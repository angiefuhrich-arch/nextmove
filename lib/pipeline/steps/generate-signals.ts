import 'server-only'

// Step: Generate Signals
// Reads intelligence_events for this run.
// For each event, AI interprets what signal it produces
// across the 7 signal categories.
// Stores intelligence_signals — the last structured layer before engine scoring.
//
// AI rule: AI classifies and weights signals. AI never computes final scores.
// Tier 4 events are stored but given weight = 0 (not used in MVP scoring).

import OpenAI from 'openai'
import { AI_SYSTEM_PROMPT_PREFIX } from '@/lib/security/evidence'
import { requireEnv } from '@/lib/security/env'
import type { PipelineContext, StepResult } from '../types'
import type { SignalCategory, SignalDirection } from '../db'
import {
  getIntelligenceEvents,
  getEventCount,
  insertIntelligenceSignal,
  recordPhaseECounts,
  getSignalCount,
} from '../db'
import {
  SIGNAL_GENERATION_PROMPT_VERSION,
  MIN_EVENTS_FOR_SIGNALS,
} from '../versions'

// ── AI response schema ────────────────────────────────────────────────────────

interface GeneratedSignal {
  category: SignalCategory
  subcategory: string | null
  direction: SignalDirection
  magnitude: number          // 0–100 strength of this signal
  weight: number             // 0–1 how much to weight during scoring
  confidence: number         // 0–1 inherited from event + AI assessment
  reliability: number        // 0–1 based on source tier
  expiryMonths: number       // months before signal goes stale
  explanation: string        // 1–2 sentences, must reference the event
}

interface SignalGenerationResponse {
  signals: GeneratedSignal[]
}

const SIGNAL_GENERATION_SYSTEM_PROMPT = `${AI_SYSTEM_PROMPT_PREFIX}

Your task is to generate scored intelligence signals from employer events.

Signal categories and what they measure:
- financial_strength: revenue health, profitability, funding runway, cost discipline
- leadership: executive stability, management quality, org clarity
- career_growth: promotion paths, headcount growth, new roles, learning investment
- culture: values alignment, employee sentiment, DEI signals, work environment
- compensation: salary competitiveness, equity, benefits, bonus signals
- global_friendliness: visa sponsorship, international offices, language accessibility, expat retention
- job_stability: layoff risk, restructuring risk, revenue durability

Return ONLY valid JSON:
{
  "signals": [
    {
      "category": "one of the 7 categories",
      "subcategory": "optional specific sub-aspect or null",
      "direction": "positive|negative|neutral",
      "magnitude": 0–100,
      "weight": 0.0–1.0,
      "confidence": 0.0–1.0,
      "reliability": 0.0–1.0,
      "expiryMonths": 6|12|18|24|36,
      "explanation": "1–2 sentence explanation citing the event"
    }
  ]
}

Rules:
- Generate only signals clearly supported by the event.
- A single event can produce multiple signals (e.g., a layoff affects job_stability AND career_growth).
- magnitude reflects how strong the signal is (100 = very strong, 0 = negligible).
- weight reflects how reliable the evidence chain is:
  * Tier 1 source → weight up to 1.0
  * Tier 2 source → weight up to 0.8
  * Tier 3 source → weight up to 0.6
  * Tier 4 source → weight = 0.0 (stored but not used in MVP scoring)
- reliability = weight × confidence
- expiryMonths: use shorter for fast-moving signals (headcount = 12), longer for structural (leadership = 24).
- explanation must NOT invent facts beyond the event summary provided.
- Do NOT assign Scarsian scores. Do NOT compute final indices.`

async function generateSignalsForEvent(
  openai: OpenAI,
  entityName: string,
  event: {
    id: string
    eventType: string
    title: string
    summary: string
    eventDate: string | null
    confidence: number
    sourceTier: number
  },
): Promise<GeneratedSignal[]> {
  const userPrompt = `Entity: "${entityName}"

Event:
- id: ${event.id}
- type: ${event.eventType}
- title: ${event.title}
- summary: ${event.summary}
- approximate date: ${event.eventDate ?? 'unknown'}
- event confidence: ${event.confidence}
- source tier: ${event.sourceTier}

Generate all relevant intelligence signals for this event.
Return the SignalGenerationResponse JSON.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SIGNAL_GENERATION_SYSTEM_PROMPT },
      { role: 'user',   content: userPrompt },
    ],
    max_tokens: 2000,
  })

  const raw = response.choices[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(raw) as Partial<SignalGenerationResponse>
  return Array.isArray(parsed.signals) ? parsed.signals : []
}

const VALID_CATEGORIES = new Set<SignalCategory>([
  'financial_strength', 'leadership', 'career_growth',
  'culture', 'compensation', 'global_friendliness', 'job_stability',
])
const VALID_DIRECTIONS = new Set<SignalDirection>(['positive', 'negative', 'neutral'])

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }

function toExpiryDate(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + clamp(months, 1, 48))
  return d.toISOString().slice(0, 10)
}

function stubSignalsForEvent(event: { id: string; eventType: string; sourceTier: number }): GeneratedSignal[] {
  return [{
    category:    'career_growth',
    subcategory: null,
    direction:   'neutral',
    magnitude:   30,
    weight:      event.sourceTier <= 2 ? 0.5 : 0.3,
    confidence:  0.3,
    reliability: event.sourceTier <= 2 ? 0.15 : 0.09,
    expiryMonths: 12,
    explanation: `[stub] Signal placeholder for ${event.eventType} event. Full generation requires OPENAI_API_KEY.`,
  }]
}

// ── Main step ─────────────────────────────────────────────────────────────────

export async function generateSignalsStep(ctx: PipelineContext): Promise<StepResult> {
  if (!ctx.entityId) {
    return { success: false, error: 'No entityId in context — verify step must run first' }
  }

  const events = await getIntelligenceEvents(ctx.runId)

  if (events.length < MIN_EVENTS_FOR_SIGNALS) {
    return {
      success: true,
      insufficientEvidence: true,
      note: `Only ${events.length} substantive event(s) — insufficient for signal generation`,
    }
  }

  let openai: OpenAI | null = null
  let isStub = false

  try {
    const apiKey = requireEnv('OPENAI_API_KEY')
    openai = new OpenAI({ apiKey })
  } catch {
    isStub = true
  }

  let totalSignals = 0
  let failedEvents = 0

  for (const event of events) {
    let rawSignals: GeneratedSignal[]

    if (isStub || !openai) {
      rawSignals = stubSignalsForEvent(event)
    } else {
      try {
        rawSignals = await generateSignalsForEvent(openai, ctx.entityName, event)
      } catch (err) {
        console.error('[generate-signals] AI call failed for event', event.id, err instanceof Error ? err.message : err)
        failedEvents++
        rawSignals = stubSignalsForEvent(event)
      }
    }

    for (const sig of rawSignals) {
      // Validate and clamp AI output
      const category = VALID_CATEGORIES.has(sig.category as SignalCategory)
        ? sig.category as SignalCategory
        : 'career_growth'
      const direction = VALID_DIRECTIONS.has(sig.direction as SignalDirection)
        ? sig.direction as SignalDirection
        : 'neutral'

      // Tier 4 sources get weight = 0 in MVP
      const effectiveWeight = event.sourceTier >= 4 ? 0 : clamp(sig.weight ?? 0.5, 0, 1)
      const confidence  = clamp(sig.confidence  ?? event.confidence, 0, 1)
      const reliability = clamp(sig.reliability ?? effectiveWeight * confidence, 0, 1)

      try {
        await insertIntelligenceSignal({
          pipelineRunId:                   ctx.runId,
          entityId:                        ctx.entityId,
          eventId:                         event.id,
          category,
          subcategory:                     sig.subcategory ?? null,
          direction,
          magnitude:                       clamp(sig.magnitude ?? 50, 0, 100),
          weight:                          effectiveWeight,
          confidence,
          reliability,
          expiryDate:                      toExpiryDate(sig.expiryMonths ?? 12),
          explanation:                     (sig.explanation ?? '').slice(0, 1000),
          signalGenerationPromptVersion:   SIGNAL_GENERATION_PROMPT_VERSION,
        })
        totalSignals++
      } catch (err) {
        console.error('[generate-signals] failed to insert signal:', err instanceof Error ? err.message : err)
      }
    }
  }

  const eventCount = await getEventCount(ctx.runId)
  const signalCount = await getSignalCount(ctx.runId)
  await recordPhaseECounts(ctx.runId, eventCount, signalCount, false)

  return {
    success: true,
    note: `Generated ${totalSignals} signals from ${events.length} events${isStub ? ' (stub mode)' : ''}${failedEvents > 0 ? `; ${failedEvents} events fell back to stub` : ''}`,
  }
}
