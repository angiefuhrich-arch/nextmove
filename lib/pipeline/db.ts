import 'server-only'

// Pipeline DAL — all Supabase interactions for pipeline_runs and related tables.
// Uses service role client (server-side only). Never import this in browser code.

import { createAdminClient } from '@/lib/supabase/admin'
import type {
  PipelineStatus,
  PipelineContext,
  StepLogEntry,
  SourceCandidate,
  EntityCandidate,
} from './types'
import { PIPELINE_VERSION, PIPELINE_STEP_LABELS } from './types'
import { classifyUrl } from './source-tiers'

export type FetchStatus = 'pending' | 'success' | 'failed' | 'skipped' | 'blocked'

// ── Phase E types ─────────────────────────────────────────────────────────────

export type IntelligenceEventType =
  | 'leadership_change' | 'hiring_increase' | 'hiring_slowdown'
  | 'expansion' | 'restructuring' | 'layoff'
  | 'financial_growth' | 'financial_decline'
  | 'award' | 'regulatory_issue' | 'policy_change'
  | 'product_strategy' | 'market_signal' | 'insufficient_event_data'

export type SignalCategory =
  | 'financial_strength' | 'leadership' | 'career_growth'
  | 'culture' | 'compensation' | 'global_friendliness' | 'job_stability'

export type SignalDirection = 'positive' | 'negative' | 'neutral'

export interface IntelligenceEventInsert {
  pipelineRunId: string
  entityId: string
  eventType: IntelligenceEventType
  title: string
  summary: string
  eventDate?: string | null          // ISO date string YYYY-MM-DD
  eventDatePrecision?: string | null
  supportingEvidenceIds: string[]
  confidence: number                  // 0–1
  sourceTier: number                  // 1–4
  eventExtractionPromptVersion?: string
  evidenceSchemaVersion?: string
}

export interface IntelligenceSignalInsert {
  pipelineRunId: string
  entityId: string
  eventId: string
  category: SignalCategory
  subcategory?: string | null
  direction: SignalDirection
  magnitude: number                   // 0–100
  weight: number                      // 0–1
  confidence: number                  // 0–1
  reliability: number                 // 0–1
  expiryDate?: string | null          // ISO date string
  explanation: string
  signalGenerationPromptVersion?: string
}

export interface EvidenceInsert {
  pipelineRunId: string
  entityId?: string
  sourceCandidateId?: string
  evidenceType: 'financial' | 'leadership' | 'headcount' | 'culture' | 'compensation' | 'legal' | 'product' | 'market' | 'sentiment'
  rawText: string
  structuredData?: Record<string, unknown>
  sourceUrl?: string
  sourceTier: number
  pipelineVersion?: string
}

// ----------------------------------------------------------------
// Run lifecycle
// ----------------------------------------------------------------

export async function createPipelineRun(opts: {
  entitySlug: string
  entityName: string
  entityType?: string
  requestedBy?: string
}): Promise<string> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('pipeline_runs')
    .insert({
      entity_slug: opts.entitySlug,
      entity_name: opts.entityName,
      entity_type: opts.entityType ?? 'employer',
      status: 'queued',
      step_log: [],
      pipeline_version: PIPELINE_VERSION,
      requested_by: opts.requestedBy ?? null,
      discovery_query: opts.entityName,
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`Failed to create pipeline run: ${error?.message}`)
  return data.id
}

export async function getPipelineRun(runId: string) {
  const db = createAdminClient()
  const { data, error } = await db
    .from('pipeline_runs')
    .select('*')
    .eq('id', runId)
    .single()

  if (error) throw new Error(`Pipeline run not found: ${error.message}`)
  return data
}

export async function updateRunStatus(
  runId: string,
  status: PipelineStatus,
  extra?: {
    entityId?: string
    snapshotId?: string
    errorMessage?: string
  }
) {
  const db = createAdminClient()
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (extra?.entityId)    patch.entity_id     = extra.entityId
  if (extra?.snapshotId)  patch.snapshot_id   = extra.snapshotId
  if (extra?.errorMessage) patch.error_message = extra.errorMessage

  const isTerminal = ['completed', 'insufficient_evidence', 'failed', 'needs_user_clarification'].includes(status)
  if (isTerminal) patch.completed_at = new Date().toISOString()

  const { error } = await db.from('pipeline_runs').update(patch).eq('id', runId)
  if (error) throw new Error(`Failed to update run status: ${error.message}`)
}

export async function appendStepLog(runId: string, entry: StepLogEntry) {
  const db = createAdminClient()
  // Append to JSONB array atomically
  const { error } = await db.rpc('append_pipeline_step', {
    p_run_id: runId,
    p_entry: entry,
  })
  if (error) {
    // Fallback: read-modify-write (not atomic but acceptable for Phase C)
    const { data } = await db.from('pipeline_runs').select('step_log').eq('id', runId).single()
    const existing: StepLogEntry[] = (data?.step_log as StepLogEntry[]) ?? []
    const updated = existing.map(e => e.step === entry.step ? entry : e)
    if (!updated.find(e => e.step === entry.step)) updated.push(entry)
    await db.from('pipeline_runs').update({ step_log: updated }).eq('id', runId)
  }
}

export async function startStep(runId: string, status: PipelineStatus): Promise<StepLogEntry> {
  const entry: StepLogEntry = {
    step: status,
    label: PIPELINE_STEP_LABELS[status],
    startedAt: new Date().toISOString(),
  }
  await updateRunStatus(runId, status)
  await appendStepLog(runId, entry)
  return entry
}

export async function completeStep(runId: string, entry: StepLogEntry, note?: string) {
  const completed = { ...entry, completedAt: new Date().toISOString(), note }
  await appendStepLog(runId, completed)
}

// ----------------------------------------------------------------
// Source candidates
// ----------------------------------------------------------------

export async function insertSourceCandidates(
  runId: string,
  candidates: SourceCandidate[]
): Promise<string[]> {
  if (candidates.length === 0) return []
  const db = createAdminClient()
  const rows = candidates.map(c => {
    const tier = classifyUrl(c.url)
    return {
      pipeline_run_id:   runId,
      url:               c.url,
      title:             c.title ?? null,
      description:       c.description ?? null,
      published_date:    c.publishedDate ?? null,
      source_type:       c.sourceType,
      discovery_rank:    c.discoveryRank,
      reliability_score: tier.reliabilityScore,
      source_tier:       tier.tier,
      is_selected:       false,
      fetch_status:      'pending',
    }
  })
  const { data, error } = await db.from('source_candidates').insert(rows).select('id')
  if (error) throw new Error(`Failed to insert source candidates: ${error.message}`)
  return (data ?? []).map(r => r.id as string)
}

export interface SourceCandidateRow {
  id: string
  url: string
  title?: string
  source_tier: number
  reliability_score: number
  fetch_status: FetchStatus
  is_selected: boolean
}

export async function getCollectibleSources(runId: string): Promise<SourceCandidateRow[]> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('source_candidates')
    .select('id, url, title, source_tier, reliability_score, fetch_status, is_selected')
    .eq('pipeline_run_id', runId)
    .in('source_tier', [1, 2, 3])     // Tier 4 excluded from collection
    .eq('fetch_status', 'pending')
    .order('source_tier', { ascending: true })
    .order('reliability_score', { ascending: false })
  if (error) throw new Error(`Failed to get collectible sources: ${error.message}`)
  return (data ?? []) as SourceCandidateRow[]
}

export async function updateSourceFetch(
  candidateId: string,
  update: {
    fetchStatus: FetchStatus
    httpStatus?: number
    pageTitle?: string
    metaDescription?: string
    rawText?: string
    contentLength?: number
    fetchError?: string
  }
) {
  const db = createAdminClient()
  await db.from('source_candidates').update({
    fetch_status:     update.fetchStatus,
    http_status:      update.httpStatus ?? null,
    page_title:       update.pageTitle ?? null,
    meta_description: update.metaDescription ?? null,
    raw_text:         update.rawText ?? null,
    content_length:   update.contentLength ?? null,
    fetch_error:      update.fetchError ?? null,
    collected_at:     new Date().toISOString(),
  }).eq('id', candidateId)
}

// ----------------------------------------------------------------
// Evidence records
// ----------------------------------------------------------------

export async function insertEvidenceRecord(ev: EvidenceInsert): Promise<string | null> {
  // Lazy import to avoid circular deps
  const { hashEvidence, normalizeSourceUrl } = await import('@/lib/security/evidence')

  const sourceUrl        = ev.sourceUrl ?? ''
  const normalizedUrl    = normalizeSourceUrl(sourceUrl)
  const evidenceHash     = hashEvidence(sourceUrl, ev.rawText)

  const db = createAdminClient()

  // Deduplication: if same hash+entity already exists, mark as duplicate
  let duplicateOfId: string | null = null
  if (ev.entityId) {
    const { data: existing } = await db
      .from('evidence_records')
      .select('id')
      .eq('entity_id', ev.entityId)
      .eq('evidence_hash', evidenceHash)
      .eq('is_duplicate', false)
      .maybeSingle()

    if (existing) {
      duplicateOfId = existing.id as string
    }
  }

  const { data, error } = await db
    .from('evidence_records')
    .insert({
      pipeline_run_id:      ev.pipelineRunId,
      entity_id:            ev.entityId ?? null,
      source_candidate_id:  ev.sourceCandidateId ?? null,
      evidence_type:        ev.evidenceType,
      raw_text:             ev.rawText,
      structured_data:      ev.structuredData ?? null,
      source_url:           sourceUrl || null,
      normalized_source_url: normalizedUrl || null,
      source_tier:          ev.sourceTier,
      pipeline_version:     ev.pipelineVersion ?? PIPELINE_VERSION,
      evidence_hash:        evidenceHash,
      is_duplicate:         duplicateOfId !== null,
      duplicate_of_id:      duplicateOfId,
      collected_at:         new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    // Unique constraint violation = genuine duplicate; not an error
    if (error.code === '23505') return null
    throw new Error(`Failed to insert evidence record: ${error.message}`)
  }
  return data?.id as string ?? null
}

export interface EvidenceRecord {
  id: string
  evidenceType: string
  rawText: string
  sourceUrl: string | null
  sourceTier: number
  collectedAt: string
}

/** Read non-duplicate Tier 1–3 evidence records for a run, ordered by tier (best first). */
export async function getEvidenceForExtraction(runId: string, maxTier = 3): Promise<EvidenceRecord[]> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('evidence_records')
    .select('id, evidence_type, raw_text, source_url, source_tier, collected_at')
    .eq('pipeline_run_id', runId)
    .eq('is_duplicate', false)
    .lte('source_tier', maxTier)
    .order('source_tier', { ascending: true })
    .order('collected_at', { ascending: true })

  if (error) throw new Error(`Failed to get evidence records: ${error.message}`)
  return (data ?? []).map(r => ({
    id:           r.id as string,
    evidenceType: r.evidence_type as string,
    rawText:      r.raw_text as string,
    sourceUrl:    r.source_url as string | null,
    sourceTier:   Number(r.source_tier),
    collectedAt:  r.collected_at as string,
  }))
}

export async function getEvidenceCount(runId: string, maxTier = 3): Promise<number> {
  const db = createAdminClient()
  const { count } = await db
    .from('evidence_records')
    .select('*', { count: 'exact', head: true })
    .eq('pipeline_run_id', runId)
    .lte('source_tier', maxTier)
  return count ?? 0
}

// ----------------------------------------------------------------
// Entity candidates
// ----------------------------------------------------------------

export async function insertEntityCandidates(
  runId: string,
  candidates: EntityCandidate[]
): Promise<string[]> {
  if (candidates.length === 0) return []
  const db = createAdminClient()
  const rows = candidates.map(c => ({
    pipeline_run_id: runId,
    name: c.name,
    normalized_name: c.normalizedName,
    country: c.country ?? null,
    industry: c.industry ?? null,
    description: c.description ?? null,
    confidence_score: c.confidenceScore,
    source_url: c.sourceUrl ?? null,
    disambiguation_needed: c.disambiguationNeeded,
    matched_entity_id: c.matchedEntityId ?? null,
    is_selected: false,
  }))
  const { data, error } = await db.from('entity_candidates').insert(rows).select('id')
  if (error) throw new Error(`Failed to insert entity candidates: ${error.message}`)
  return (data ?? []).map(r => r.id as string)
}

export async function markEntityCandidateSelected(candidateId: string) {
  const db = createAdminClient()
  await db.from('entity_candidates').update({ is_selected: true }).eq('id', candidateId)
}

// ----------------------------------------------------------------
// Entity upsert
// ----------------------------------------------------------------

export async function upsertEntity(opts: {
  slug: string
  name: string
  industry?: string
  country?: string
  description?: string
  entityType?: string
  verified?: boolean
}): Promise<string> {
  const db = createAdminClient()

  // Try find existing
  const { data: existing } = await db
    .from('entities')
    .select('id')
    .eq('slug', opts.slug)
    .maybeSingle()

  if (existing?.id) {
    // Update metadata if we have richer info now
    await db.from('entities').update({
      industry:    opts.industry    ?? undefined,
      country:     opts.country     ?? undefined,
      description: opts.description ?? undefined,
      verified:    opts.verified    ?? undefined,
    }).eq('id', existing.id)
    return existing.id as string
  }

  const { data, error } = await db
    .from('entities')
    .insert({
      slug:        opts.slug,
      name:        opts.name,
      industry:    opts.industry    ?? null,
      country:     opts.country     ?? null,
      description: opts.description ?? null,
      entity_type: opts.entityType  ?? 'employer',
      verified:    opts.verified    ?? false,
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`Failed to upsert entity: ${error?.message}`)
  return data.id as string
}

export async function upsertEntityAlias(entityId: string, alias: string) {
  const db = createAdminClient()
  await db.from('entity_aliases').upsert(
    { entity_id: entityId, alias: alias.toLowerCase() },
    { onConflict: 'alias', ignoreDuplicates: true }
  )
}

export async function lookupEntityBySlug(slug: string) {
  const db = createAdminClient()
  const { data } = await db
    .from('entities')
    .select('id, slug, name, industry, country, description, verified')
    .eq('slug', slug)
    .maybeSingle()
  return data
}

export async function lookupEntityByName(name: string) {
  const db = createAdminClient()
  const { data } = await db
    .from('entities')
    .select('id, slug, name, industry, country')
    .ilike('name', name)
    .maybeSingle()
  return data
}

export async function buildContext(runId: string): Promise<PipelineContext> {
  const run = await getPipelineRun(runId)
  return {
    runId,
    entitySlug:      run.entity_slug as string,
    entityName:      run.entity_name as string,
    entityType:      (run.entity_type as string) ?? 'employer',
    entityId:        (run.entity_id as string | undefined) ?? undefined,
    pipelineVersion: (run.pipeline_version as string) ?? PIPELINE_VERSION,
  }
}

// ── Phase E: Intelligence events ──────────────────────────────────────────────

export async function insertIntelligenceEvent(ev: IntelligenceEventInsert): Promise<string> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('intelligence_events')
    .insert({
      pipeline_run_id:                  ev.pipelineRunId,
      entity_id:                        ev.entityId,
      event_type:                       ev.eventType,
      title:                            ev.title,
      summary:                          ev.summary,
      event_date:                       ev.eventDate ?? null,
      event_date_precision:             ev.eventDatePrecision ?? null,
      supporting_evidence_ids:          ev.supportingEvidenceIds,
      confidence:                       ev.confidence,
      source_tier:                      ev.sourceTier,
      event_extraction_prompt_version:  ev.eventExtractionPromptVersion ?? '1.0.0',
      evidence_schema_version:          ev.evidenceSchemaVersion ?? '1.0.0',
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`Failed to insert intelligence event: ${error?.message}`)
  return data.id as string
}

export async function getIntelligenceEvents(runId: string): Promise<Array<{
  id: string
  eventType: IntelligenceEventType
  title: string
  summary: string
  eventDate: string | null
  supportingEvidenceIds: string[]
  confidence: number
  sourceTier: number
}>> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('intelligence_events')
    .select('id, event_type, title, summary, event_date, supporting_evidence_ids, confidence, source_tier')
    .eq('pipeline_run_id', runId)
    .neq('event_type', 'insufficient_event_data')
    .order('confidence', { ascending: false })

  if (error) throw new Error(`Failed to get intelligence events: ${error.message}`)
  return (data ?? []).map(r => ({
    id:                   r.id as string,
    eventType:            r.event_type as IntelligenceEventType,
    title:                r.title as string,
    summary:              r.summary as string,
    eventDate:            r.event_date as string | null,
    supportingEvidenceIds: (r.supporting_evidence_ids ?? []) as string[],
    confidence:           Number(r.confidence),
    sourceTier:           Number(r.source_tier),
  }))
}

export async function getEventCount(runId: string): Promise<number> {
  const db = createAdminClient()
  const { count } = await db
    .from('intelligence_events')
    .select('*', { count: 'exact', head: true })
    .eq('pipeline_run_id', runId)
    .neq('event_type', 'insufficient_event_data')
  return count ?? 0
}

// ── Phase E: Intelligence signals ─────────────────────────────────────────────

export async function insertIntelligenceSignal(sig: IntelligenceSignalInsert): Promise<string> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('intelligence_signals')
    .insert({
      pipeline_run_id:                  sig.pipelineRunId,
      entity_id:                        sig.entityId,
      event_id:                         sig.eventId,
      category:                         sig.category,
      subcategory:                      sig.subcategory ?? null,
      direction:                        sig.direction,
      magnitude:                        sig.magnitude,
      weight:                           sig.weight,
      confidence:                       sig.confidence,
      reliability:                      sig.reliability,
      expiry_date:                      sig.expiryDate ?? null,
      explanation:                      sig.explanation,
      signal_generation_prompt_version: sig.signalGenerationPromptVersion ?? '1.0.0',
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`Failed to insert intelligence signal: ${error?.message}`)
  return data.id as string
}

export async function getSignalCount(runId: string): Promise<number> {
  const db = createAdminClient()
  const { count } = await db
    .from('intelligence_signals')
    .select('*', { count: 'exact', head: true })
    .eq('pipeline_run_id', runId)
  return count ?? 0
}

/** Update pipeline_runs with final event/signal counts after Phase E. */
export async function recordPhaseECounts(
  runId: string,
  eventCount: number,
  signalCount: number,
  insufficientEvents: boolean,
) {
  const db = createAdminClient()
  await db.from('pipeline_runs').update({
    event_count:         eventCount,
    signal_count:        signalCount,
    insufficient_events: insufficientEvents,
  }).eq('id', runId)
}
