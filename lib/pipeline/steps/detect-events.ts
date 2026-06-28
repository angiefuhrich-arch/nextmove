import 'server-only'

// Step: Detect Events
// Reads evidence_records (with structured_data from extract step).
// Calls AI to cluster facts into discrete intelligence_events.
// Stores events in intelligence_events table.
// Events are typed, dated, and linked to supporting evidence IDs.
// AI never assigns scores — it only identifies what happened.

import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/admin'
import { AI_SYSTEM_PROMPT_PREFIX } from '@/lib/security/evidence'
import { requireEnv } from '@/lib/security/env'
import type { PipelineContext, StepResult } from '../types'
import type { IntelligenceEventType } from '../db'
import {
  insertIntelligenceEvent,
  getEvidenceForExtraction,
  recordPhaseECounts,
  getSignalCount,
} from '../db'
import {
  EVENT_EXTRACTION_PROMPT_VERSION,
  EVIDENCE_SCHEMA_VERSION,
  MIN_EVIDENCE_FOR_EVENTS,
} from '../versions'

// ── AI response schema ────────────────────────────────────────────────────────

interface DetectedEvent {
  eventType: IntelligenceEventType
  title: string                         // ≤120 chars, present-tense description
  summary: string                       // 1–3 sentence summary
  eventDate: string | null              // "YYYY-MM-DD" or "YYYY-MM" or "YYYY" or null
  eventDatePrecision: 'day' | 'month' | 'quarter' | 'year' | 'approximate' | 'unknown'
  supportingEvidenceIds: string[]       // IDs from the evidence records provided
  confidence: number                    // 0–1
  sourceTier: number                    // lowest (best) tier among supporting evidence
}

interface EventDetectionResponse {
  events: DetectedEvent[]
  insufficientEventData: boolean
}

const EVENT_DETECTION_SYSTEM_PROMPT = `${AI_SYSTEM_PROMPT_PREFIX}

Your task is to detect discrete employer intelligence events from structured evidence facts.

Allowed event types:
- leadership_change: executive or board change
- hiring_increase: significant headcount growth or active hiring push
- hiring_slowdown: hiring freeze, reduced postings, or headcount contraction
- expansion: new offices, markets, or business lines
- restructuring: reorg, division spin-off, M&A integration
- layoff: confirmed workforce reduction
- financial_growth: revenue growth, profitability improvement, funding raised
- financial_decline: revenue decline, losses, cost-cutting, debt issues
- award: notable employer / product / ESG award or recognition
- regulatory_issue: lawsuit, fine, regulatory investigation, compliance failure
- policy_change: confirmed change to remote/hybrid, compensation, benefits, or HR policy
- product_strategy: significant product launch, pivot, or discontinuation
- market_signal: competitive positioning, market share change, customer win/loss
- insufficient_event_data: use ONLY when evidence yields no substantive events

Return ONLY valid JSON:
{
  "events": [
    {
      "eventType": "one of the types above",
      "title": "short present-tense title under 120 chars",
      "summary": "1–3 sentences describing what happened and why it matters",
      "eventDate": "YYYY-MM-DD or YYYY-MM or YYYY or null",
      "eventDatePrecision": "day|month|quarter|year|approximate|unknown",
      "supportingEvidenceIds": ["ev-uuid-1", "ev-uuid-2"],
      "confidence": 0.0–1.0,
      "sourceTier": 1|2|3|4
    }
  ],
  "insufficientEventData": true or false
}

Rules:
- Only create an event when ≥1 evidence record clearly supports it.
- Each event must cite at least one supporting evidence ID from those provided.
- Do not duplicate events — if two evidence records describe the same event, merge them.
- Do not infer events not supported by evidence.
- Set confidence < 0.5 for events with only Tier 3 support.
- If evidence is too thin for any substantive event, set insufficientEventData: true.`

async function detectEventsWithAI(
  openai: OpenAI,
  entityName: string,
  evidenceRecords: Array<{
    id: string
    evidenceType: string
    rawText: string
    sourceUrl: string | null
    sourceTier: number
    collectedAt: string
    structuredData?: Record<string, unknown> | null
  }>,
): Promise<EventDetectionResponse> {

  // Build compact evidence summary for AI — facts only, not raw HTML
  const evidenceSummary = evidenceRecords.map(r => {
    const facts = (r.structuredData as { facts?: Array<{ claim: string; factType: string; approximateDate?: string; confidence: number }> } | null)?.facts ?? []
    const factLines = facts
      .filter(f => f.confidence >= 0.4)
      .map(f => `  - [${f.factType}${f.approximateDate ? ` ~${f.approximateDate}` : ''}] ${f.claim}`)
      .join('\n')
    return [
      `<evidence_summary id="${r.id}" type="${r.evidenceType}" tier="${r.sourceTier}" url="${r.sourceUrl ?? 'unknown'}">`,
      factLines || '  (no high-confidence facts extracted)',
      '</evidence_summary>',
    ].join('\n')
  }).join('\n\n')

  const userPrompt = `Entity under analysis: "${entityName}"

Extracted evidence facts (source of truth — do not go beyond these):
${evidenceSummary}

Detect all substantive employer intelligence events from the facts above.
Return the EventDetectionResponse JSON.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: EVENT_DETECTION_SYSTEM_PROMPT },
      { role: 'user',   content: userPrompt },
    ],
    max_tokens: 3000,
  })

  const raw = response.choices[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(raw) as Partial<EventDetectionResponse>

  return {
    events: Array.isArray(parsed.events) ? parsed.events : [],
    insufficientEventData: parsed.insufficientEventData ?? true,
  }
}

function stubEvents(entityName: string, evidenceIds: string[]): DetectedEvent[] {
  return [{
    eventType: 'market_signal',
    title: `${entityName} — intelligence collected (stub mode)`,
    summary: `Evidence was collected for ${entityName}. Full event detection requires OPENAI_API_KEY.`,
    eventDate: null,
    eventDatePrecision: 'unknown',
    supportingEvidenceIds: evidenceIds.slice(0, 2),
    confidence: 0.3,
    sourceTier: 3,
  }]
}

// ── Main step ─────────────────────────────────────────────────────────────────

export async function detectEventsStep(ctx: PipelineContext): Promise<StepResult> {
  if (!ctx.entityId) {
    return { success: false, error: 'No entityId in context — verify step must run first' }
  }

  const records = await getEvidenceForExtraction(ctx.runId, 3)

  if (records.length < MIN_EVIDENCE_FOR_EVENTS) {
    // Record sentinel event and exit gracefully
    await insertIntelligenceEvent({
      pipelineRunId:                  ctx.runId,
      entityId:                       ctx.entityId,
      eventType:                      'insufficient_event_data',
      title:                          'Insufficient evidence for event detection',
      summary:                        `Only ${records.length} evidence record(s) available; minimum is ${MIN_EVIDENCE_FOR_EVENTS}.`,
      eventDate:                      null,
      supportingEvidenceIds:          records.map(r => r.id),
      confidence:                     1,
      sourceTier:                     4,
      eventExtractionPromptVersion:   EVENT_EXTRACTION_PROMPT_VERSION,
      evidenceSchemaVersion:          EVIDENCE_SCHEMA_VERSION,
    })
    await recordPhaseECounts(ctx.runId, 0, 0, true)
    return { success: true, insufficientEvidence: true, note: `Only ${records.length} evidence records — insufficient for event detection` }
  }

  // Load structured_data from DB (written by extract step)
  const db = createAdminClient()
  const { data: rawRecords } = await db
    .from('evidence_records')
    .select('id, evidence_type, raw_text, source_url, source_tier, collected_at, structured_data')
    .eq('pipeline_run_id', ctx.runId)
    .eq('is_duplicate', false)
    .lte('source_tier', 3)

  const enrichedRecords = (rawRecords ?? []).map(r => ({
    id:            r.id as string,
    evidenceType:  r.evidence_type as string,
    rawText:       r.raw_text as string,
    sourceUrl:     r.source_url as string | null,
    sourceTier:    Number(r.source_tier),
    collectedAt:   r.collected_at as string,
    structuredData: r.structured_data as Record<string, unknown> | null,
  }))

  let detected: EventDetectionResponse
  let isStub = false

  try {
    const apiKey = requireEnv('OPENAI_API_KEY')
    const openai = new OpenAI({ apiKey })
    detected = await detectEventsWithAI(openai, ctx.entityName, enrichedRecords)
  } catch {
    // Dev fallback: produce stub events so pipeline can continue
    isStub = true
    detected = {
      events: stubEvents(ctx.entityName, enrichedRecords.map(r => r.id)),
      insufficientEventData: false,
    }
  }

  if (detected.insufficientEventData || detected.events.length === 0) {
    await insertIntelligenceEvent({
      pipelineRunId:                  ctx.runId,
      entityId:                       ctx.entityId,
      eventType:                      'insufficient_event_data',
      title:                          'Evidence insufficient to detect substantive events',
      summary:                        'Available evidence did not yield any substantive employer intelligence events.',
      eventDate:                      null,
      supportingEvidenceIds:          enrichedRecords.map(r => r.id),
      confidence:                     0.9,
      sourceTier:                     3,
      eventExtractionPromptVersion:   EVENT_EXTRACTION_PROMPT_VERSION,
      evidenceSchemaVersion:          EVIDENCE_SCHEMA_VERSION,
    })
    await recordPhaseECounts(ctx.runId, 0, 0, true)
    return { success: true, insufficientEvidence: true, note: 'Evidence did not yield substantive events' }
  }

  // Persist each detected event
  let persisted = 0
  for (const ev of detected.events) {
    try {
      await insertIntelligenceEvent({
        pipelineRunId:                  ctx.runId,
        entityId:                       ctx.entityId,
        eventType:                      ev.eventType,
        title:                          ev.title.slice(0, 200),
        summary:                        ev.summary.slice(0, 2000),
        eventDate:                      ev.eventDate ?? null,
        eventDatePrecision:             ev.eventDatePrecision ?? 'unknown',
        supportingEvidenceIds:          ev.supportingEvidenceIds,
        confidence:                     Math.max(0, Math.min(1, ev.confidence ?? 0.5)),
        sourceTier:                     Math.max(1, Math.min(4, ev.sourceTier ?? 3)),
        eventExtractionPromptVersion:   EVENT_EXTRACTION_PROMPT_VERSION,
        evidenceSchemaVersion:          EVIDENCE_SCHEMA_VERSION,
      })
      persisted++
    } catch (err) {
      console.error('[detect-events] failed to insert event:', err instanceof Error ? err.message : err)
    }
  }

  const signalCount = await getSignalCount(ctx.runId)
  await recordPhaseECounts(ctx.runId, persisted, signalCount, false)

  return {
    success: true,
    note: `Detected ${persisted} events from ${enrichedRecords.length} evidence records${isStub ? ' (stub mode)' : ''}`,
  }
}
