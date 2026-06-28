import 'server-only'

// Step: Generate Brief
// Reads scoring snapshot + signals + events for this run.
// Loads the active brief_template for the entity_type from DB.
// Calls AI with structured intelligence (never raw web text).
// Stores analyst_reports record (status=pending_review — admin must approve).
// Rule: AI explains structured intelligence. It never invents facts.

import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/admin'
import { AI_SYSTEM_PROMPT_PREFIX } from '@/lib/security/evidence'
import { getActiveBriefTemplate } from '@/lib/dal/scoring-models'
import type { PipelineContext, StepResult } from '../types'

const BRIEF_GENERATION_PROMPT_VERSION = '1.0.0'
const AI_MODEL = 'gpt-4o-mini'

export async function generateBriefStep(ctx: PipelineContext): Promise<StepResult> {
  const supabase = createAdminClient()

  // 1. Load brief template for this entity_type
  const entityType = ctx.entityType ?? 'company'
  const template = await getActiveBriefTemplate(entityType)
  if (!template) {
    return {
      success: false,
      error: `No active brief template for entity_type="${entityType}"`,
    }
  }

  // 2. Load scoring snapshot for this run
  const { data: snapshot } = await supabase
    .from('scarsian_snapshots')
    .select('scarsian_score, verdict, confidence_score, pillar_scores, career_alpha')
    .eq('pipeline_run_id', ctx.runId)
    .single()

  // 3. Load top signals (up to 15, weight > 0, highest magnitude first)
  const { data: signals } = await supabase
    .from('intelligence_signals')
    .select('category, direction, magnitude, confidence, explanation')
    .eq('pipeline_run_id', ctx.runId)
    .gt('weight', 0)
    .order('magnitude', { ascending: false })
    .limit(15)

  // 4. Load top events (up to 10)
  const { data: events } = await supabase
    .from('intelligence_events')
    .select('event_type, title, summary, event_date, confidence')
    .eq('pipeline_run_id', ctx.runId)
    .neq('event_type', 'insufficient_event_data')
    .order('confidence', { ascending: false })
    .limit(10)

  // 5. Collect evidence IDs for audit trail (never exposed publicly)
  const { data: evidenceRows } = await supabase
    .from('evidence_records')
    .select('id')
    .eq('pipeline_run_id', ctx.runId)
    .eq('is_duplicate', false)
  const evidenceIdsUsed = (evidenceRows ?? []).map(r => r.id)

  // 6. Check for OpenAI key
  let openai: OpenAI
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY not set')
    openai = new OpenAI({ apiKey })
  } catch {
    // Dev fallback: write stub brief
    const stubBrief = buildStubBrief(entityType, ctx.entityName, template.output_schema)
    await writeBriefRecord(supabase, ctx, stubBrief, template, evidenceIdsUsed)
    return {
      success: true,
      note: `[stub-brief] OPENAI_API_KEY not set — wrote placeholder brief for "${ctx.entityName}"`,
    }
  }

  // 7. Build structured intelligence payload (no raw text)
  const intelligence = {
    entity_name: ctx.entityName,
    entity_type: entityType,
    scarsian_score: snapshot?.scarsian_score ?? null,
    verdict: snapshot?.verdict ?? null,
    confidence_score: snapshot?.confidence_score ?? null,
    career_alpha: snapshot?.career_alpha ?? null,
    pillar_scores: snapshot?.pillar_scores ?? {},
    signals: (signals ?? []).map(s => ({
      category:    s.category,
      direction:   s.direction,
      magnitude:   s.magnitude,
      confidence:  s.confidence,
      explanation: s.explanation,
    })),
    recent_events: (events ?? []).map(e => ({
      type:       e.event_type,
      title:      e.title,
      summary:    e.summary,
      date:       e.event_date,
      confidence: e.confidence,
    })),
  }

  // 8. Call AI with template system prompt
  const systemPrompt = `${AI_SYSTEM_PROMPT_PREFIX}

${template.system_prompt}

Output JSON matching this schema exactly:
${JSON.stringify(template.output_schema, null, 2)}`

  const userPrompt = `Here is the structured intelligence for ${ctx.entityName} (${entityType}):

${JSON.stringify(intelligence, null, 2)}

Write the intelligence brief now.`

  let briefJson: Record<string, unknown>
  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: 2000,
    })
    briefJson = JSON.parse(response.choices[0]?.message?.content ?? '{}')
  } catch (err) {
    return {
      success: false,
      error: `Brief generation AI call failed: ${err instanceof Error ? err.message : String(err)}`,
    }
  }

  // 9. Write analyst_reports record (pending_review — admin must approve)
  await writeBriefRecord(supabase, ctx, briefJson, template, evidenceIdsUsed)

  return {
    success: true,
    note: `Brief generated for "${ctx.entityName}" using template "${template.template_name}" v${template.prompt_version}`,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function writeBriefRecord(
  supabase: ReturnType<typeof createAdminClient>,
  ctx: PipelineContext,
  briefJson: Record<string, unknown>,
  template: { id: string; prompt_version: string; template_name: string },
  evidenceIdsUsed: string[]
) {
  // Load entity_id if not on context
  let entityId = ctx.entityId
  if (!entityId) {
    const { data } = await supabase
      .from('entities')
      .select('id')
      .eq('slug', ctx.entitySlug)
      .single()
    entityId = data?.id
  }
  if (!entityId) return

  const { error } = await supabase.from('analyst_reports').insert({
    entity_id:               entityId,
    title:                   briefJson.title ?? `Intelligence Brief: ${ctx.entityName}`,
    summary:                 briefJson.summary ?? null,
    strengths:               briefJson.strengths ?? [],
    risks:                   briefJson.risks ?? [],
    good_for:                briefJson.good_for ?? [],
    avoid_if:                briefJson.avoid_if ?? [],
    gfi_notes:               briefJson.gfi_notes ?? null,
    status:                  'draft',
    brief_template_id:       template.id,
    brief_template_version:  template.prompt_version,
    evidence_ids_used:       evidenceIdsUsed,
  })

  if (error) {
    console.error('[generate-brief] Failed to write analyst_reports:', error.message)
  }
}

function buildStubBrief(
  entityType: string,
  entityName: string,
  _schema: Record<string, unknown>
): Record<string, unknown> {
  return {
    title:    `Intelligence Brief: ${entityName}`,
    summary:  `[STUB] This is a placeholder brief for ${entityName} (${entityType}). Real brief will be generated when OPENAI_API_KEY is configured.`,
    strengths: [{ text: '[STUB] Evidence collection succeeded' }],
    risks:     [{ text: '[STUB] AI brief generation not yet configured' }],
    good_for:  [{ text: '[STUB] Preview mode only' }],
    avoid_if:  [],
    gfi_notes: null,
  }
}
