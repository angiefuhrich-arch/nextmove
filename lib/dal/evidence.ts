// Data access layer — Evidence Records (Immutable)
// Server-side only. Never import in client components.

import { createAdminClient } from '@/lib/supabase/admin'
import type { EvidenceRecord, CreateEvidenceRecord, EvidenceReviewStatus } from '@/lib/types/intelligence'

// ============================================================
// Read
// ============================================================

export async function getEvidenceForEntity(
  entityId: string,
  opts: { includeDisputed?: boolean; limit?: number } = {}
): Promise<EvidenceRecord[]> {
  const admin = createAdminClient()
  let query = admin
    .from('evidence_records')
    .select('*')
    .eq('entity_id', entityId)
    .order('collected_at', { ascending: false })
    .limit(opts.limit ?? 100)
  if (!opts.includeDisputed) {
    query = query.eq('disputed', false)
  }
  const { data } = await query
  return (data ?? []) as EvidenceRecord[]
}

export async function getEvidenceById(id: string): Promise<EvidenceRecord | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('evidence_records')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return data as EvidenceRecord
}

// ============================================================
// Write — Insert Only
// ============================================================

export async function createEvidence(input: CreateEvidenceRecord): Promise<EvidenceRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('evidence_records')
    .insert({
      entity_id: input.entity_id,
      event_id: input.event_id ?? null,
      source_type: input.source_type,
      source_url: input.source_url ?? null,
      source_title: input.source_title ?? null,
      content_summary: input.content_summary,
      raw_content: input.raw_content ?? null,
      evidence_date: input.evidence_date ?? null,
      collected_by: input.collected_by ?? null,
      default_expiry_days: input.default_expiry_days ?? null,
      supersedes_id: input.supersedes_id ?? null,
    })
    .select()
    .single()
  if (error || !data) throw new Error(`Failed to create evidence: ${error?.message}`)
  return data as EvidenceRecord
}

// ============================================================
// Dispute — Never delete, only mark disputed and create correction
// ============================================================

export async function disputeEvidence(
  id: string,
  reason: string
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('evidence_records')
    .update({ disputed: true, dispute_reason: reason })
    .eq('id', id)
  if (error) throw new Error(`Failed to dispute evidence: ${error.message}`)
}

export async function correctEvidence(
  originalId: string,
  correction: Omit<CreateEvidenceRecord, 'supersedes_id'>,
  disputeReason: string
): Promise<EvidenceRecord> {
  await disputeEvidence(originalId, disputeReason)
  return createEvidence({ ...correction, supersedes_id: originalId })
}

// ============================================================
// Review Status
// ============================================================

export async function setEvidenceReviewStatus(
  id: string,
  status: EvidenceReviewStatus
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('evidence_records')
    .update({ review_status: status })
    .eq('id', id)
  if (error) throw new Error(`Failed to update evidence review status: ${error.message}`)
}
