import 'server-only'

// Step: Extract
// Reads collected source_candidates with raw HTML text.
// Uses AI to identify which evidence_type each source best represents
// and writes structured_data onto existing evidence_records.
// Does NOT re-insert evidence — collect.ts already inserted the records.
// This step enriches those records with structured facts for event detection.

import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/admin'
import { wrapEvidenceForPrompt, sanitizeForPrompt, AI_SYSTEM_PROMPT_PREFIX } from '@/lib/security/evidence'
import { requireEnv } from '@/lib/security/env'
import type { PipelineContext, StepResult } from '../types'
import { EVIDENCE_SCHEMA_VERSION } from '../versions'

const MAX_EXCERPT_FOR_EXTRACTION = 3000
const BATCH_SIZE = 4    // process up to 4 evidence records per AI call

// ── Structured fact schema returned by extraction prompt ──────────────────────

interface ExtractedFacts {
  facts: Array<{
    claim: string              // specific, falsifiable claim from the text
    factType:                  // maps to evidence_type
      | 'headcount_change'
      | 'leadership_change'
      | 'financial_metric'
      | 'office_expansion'
      | 'restructuring'
      | 'award_recognition'
      | 'regulatory'
      | 'product_launch'
      | 'market_position'
      | 'culture_indicator'
      | 'compensation_indicator'
      | 'other'
    approximateDate?: string   // "YYYY", "YYYY-MM", "YYYY-MM-DD", or null
    confidence: number         // 0–1
    directQuote?: string       // short verbatim quote from the text supporting this claim
  }>
  insufficientSignal: boolean  // true if text yields no useful employer intelligence
}

const EXTRACTION_SYSTEM_PROMPT = `${AI_SYSTEM_PROMPT_PREFIX}

Your task is to extract structured employer intelligence facts from provided text evidence.

Return ONLY valid JSON matching this schema:
{
  "facts": [
    {
      "claim": "specific falsifiable claim about the employer",
      "factType": one of [headcount_change, leadership_change, financial_metric, office_expansion, restructuring, award_recognition, regulatory, product_launch, market_position, culture_indicator, compensation_indicator, other],
      "approximateDate": "YYYY-MM-DD" or "YYYY-MM" or "YYYY" or null,
      "confidence": 0.0–1.0,
      "directQuote": "short verbatim phrase from text" or null
    }
  ],
  "insufficientSignal": true or false
}

Rules:
- Only extract facts about the specific entity under analysis (entity type will be provided in the user message).
- Do not include facts about competitors unless directly comparing to the entity.
- Do not fabricate. If the text is vague, set confidence below 0.5.
- If text contains no useful signal, return insufficientSignal: true with empty facts array.
- Maximum 8 facts per evidence record. Choose the highest-confidence ones.
- directQuote must be under 150 characters and appear verbatim in the text.`

async function extractFactsFromEvidence(
  openai: OpenAI,
  entityName: string,
  records: Array<{ id: string; rawText: string; sourceUrl: string | null; sourceTier: number; evidenceType: string; collectedAt: string }>,
  entityType?: string,
): Promise<Map<string, ExtractedFacts>> {
  const wrapped = wrapEvidenceForPrompt(records.map(r => ({
    id: r.id,
    sourceUrl: r.sourceUrl ?? 'unknown',
    sourceTier: r.sourceTier,
    excerpt: sanitizeForPrompt(r.rawText.slice(0, MAX_EXCERPT_FOR_EXTRACTION)),
    evidenceType: r.evidenceType,
    collectedAt: r.collectedAt,
  })))

  const userPrompt = `Entity under analysis: "${entityName}"
Entity type: ${entityType ?? 'company'}

${wrapped}

Extract structured facts for each evidence record above.
Return a JSON object where each key is the evidence id and the value matches the ExtractedFacts schema.
Example: { "uuid-1": { "facts": [...], "insufficientSignal": false }, "uuid-2": { ... } }`

  const AI_MODEL = 'gpt-4o-mini'
  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
      { role: 'user',   content: userPrompt },
    ],
    max_tokens: 4000,
  })

  const raw = response.choices[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(raw) as Record<string, ExtractedFacts>

  const result = new Map<string, ExtractedFacts>()
  for (const record of records) {
    const facts = parsed[record.id]
    if (facts && Array.isArray(facts.facts)) {
      result.set(record.id, facts)
    } else {
      result.set(record.id, { facts: [], insufficientSignal: true })
    }
  }
  return result
}

// ── Main step ─────────────────────────────────────────────────────────────────

export async function extractStep(ctx: PipelineContext): Promise<StepResult> {
  const { getEvidenceForExtraction, getEvidenceCount } = await import('../db')

  const records = await getEvidenceForExtraction(ctx.runId, 3)

  if (records.length === 0) {
    return { success: true, insufficientEvidence: true, note: 'No evidence records to extract from' }
  }

  let openai: OpenAI
  try {
    const apiKey = requireEnv('OPENAI_API_KEY')
    openai = new OpenAI({ apiKey })
  } catch {
    // Dev fallback: write stub structured_data so downstream steps aren't blocked
    const db = createAdminClient()
    for (const rec of records) {
      await db.from('evidence_records')
        .update({
          structured_data: {
            facts: [{ claim: `[stub] Evidence collected from ${rec.sourceUrl ?? 'unknown'}`, factType: 'other', confidence: 0.3 }],
            insufficientSignal: false,
            evidenceSchemaVersion: EVIDENCE_SCHEMA_VERSION,
            extractedAt: new Date().toISOString(),
          }
        })
        .eq('id', rec.id)
    }
    return {
      success: true,
      note: `[stub-extract] OPENAI_API_KEY not set — wrote placeholder structured_data for ${records.length} records`,
    }
  }

  // Process in batches to stay within token limits
  const db = createAdminClient()
  let totalFacts = 0
  let failedRecords = 0

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE)
    let factsMap: Map<string, ExtractedFacts>

    try {
      factsMap = await extractFactsFromEvidence(openai, ctx.entityName, batch, ctx.entityType)
    } catch (err) {
      // Batch failed — mark records as extraction-failed but don't abort pipeline
      console.error('[extract] batch failed:', err instanceof Error ? err.message : err)
      failedRecords += batch.length
      continue
    }

    // Write structured_data back to each evidence_record
    for (const rec of batch) {
      const facts = factsMap.get(rec.id)
      if (!facts) { failedRecords++; continue }

      await db.from('evidence_records')
        .update({
          structured_data: {
            ...facts,
            evidenceSchemaVersion: EVIDENCE_SCHEMA_VERSION,
            extractedAt: new Date().toISOString(),
          }
        })
        .eq('id', rec.id)

      totalFacts += facts.facts.length
    }
  }

  const evidenceCount = await getEvidenceCount(ctx.runId, 3)
  if (evidenceCount === 0) {
    return { success: true, insufficientEvidence: true, note: 'No usable evidence after extraction' }
  }

  return {
    success: true,
    note: `Extracted ${totalFacts} facts from ${records.length - failedRecords}/${records.length} evidence records`,
  }
}
