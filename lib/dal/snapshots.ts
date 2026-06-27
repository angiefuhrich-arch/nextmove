// Data access layer — Scarsian Snapshots + Trend Points
// Server-side only.

import { createAdminClient } from '@/lib/supabase/admin'
import type { ScarsianCalculationResult } from '@/lib/types/engines'

// ============================================================
// Snapshots
// ============================================================

export interface SnapshotRow {
  id: string
  entity_id: string
  formula_version_id: string
  cgs_score: number | null
  crs_score: number | null
  mvs_score: number | null
  cfs_score: number | null
  gfi_score: number | null
  scarsian_score: number
  career_alpha: number
  confidence_score: number
  insufficient_data: boolean
  verdict: string | null
  momentum_adjustment: number | null
  volatility_penalty: number | null
  base_score: number | null
  engine_output_ids: string[]
  signal_ids: string[]
  calculation_timestamp: string
  status: 'draft' | 'approved' | 'rejected' | 'superseded'
  approved_at: string | null
  approved_by: string | null
  analyst_note: string | null
  supersedes_id: string | null
  legacy_snapshot_id: string | null
  created_at: string
  created_by: string | null
}

export async function createScarsianSnapshot(
  entityId: string,
  result: ScarsianCalculationResult,
  engineOutputIds: string[],
  userId?: string
): Promise<SnapshotRow> {
  const admin = createAdminClient()

  // Supersede any existing approved snapshot for this entity
  await admin
    .from('scarsian_snapshots')
    .update({ status: 'superseded' })
    .eq('entity_id', entityId)
    .eq('status', 'approved')

  const { data, error } = await admin
    .from('scarsian_snapshots')
    .insert({
      entity_id:            entityId,
      formula_version_id:   result.formula_version_id,
      cgs_score:            result.cgs_score,
      crs_score:            result.crs_score,
      mvs_score:            result.mvs_score,
      cfs_score:            result.cfs_score,
      gfi_score:            result.gfi_score,
      scarsian_score:       result.scarsian_score,
      career_alpha:         result.career_alpha,
      confidence_score:     result.confidence_score,
      insufficient_data:    result.insufficient_data,
      verdict:              result.verdict,
      momentum_adjustment:  result.momentum_adjustment,
      volatility_penalty:   result.volatility_penalty,
      base_score:           result.base_score,
      engine_output_ids:    engineOutputIds,
      signal_ids:           result.signal_ids_used,
      calculation_timestamp: result.calculation_timestamp,
      status:               'draft',
      created_by:           userId ?? null,
    })
    .select()
    .single()

  if (error || !data) throw new Error(`Failed to create snapshot: ${error?.message}`)
  return data as SnapshotRow
}

export async function approveScarsianSnapshot(
  snapshotId: string,
  userId: string,
  analystNote?: string
): Promise<SnapshotRow> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('scarsian_snapshots')
    .update({
      status:      'approved',
      approved_at: new Date().toISOString(),
      approved_by: userId,
      ...(analystNote !== undefined ? { analyst_note: analystNote } : {}),
    })
    .eq('id', snapshotId)
    .select()
    .single()
  if (error || !data) throw new Error(`Failed to approve snapshot: ${error?.message}`)
  return data as SnapshotRow
}

export async function rejectScarsianSnapshot(
  snapshotId: string,
  userId: string
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('scarsian_snapshots')
    .update({
      status:      'rejected',
      rejected_at: new Date().toISOString(),
      rejected_by: userId,
    })
    .eq('id', snapshotId)
  if (error) throw new Error(`Failed to reject snapshot: ${error.message}`)
}

export async function getLatestApprovedSnapshot(entityId: string): Promise<SnapshotRow | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('scarsian_snapshots')
    .select('*')
    .eq('entity_id', entityId)
    .eq('status', 'approved')
    .order('approved_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data ?? null) as SnapshotRow | null
}

export async function getDraftSnapshotForEntity(entityId: string): Promise<SnapshotRow | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('scarsian_snapshots')
    .select('*')
    .eq('entity_id', entityId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data ?? null) as SnapshotRow | null
}

// ============================================================
// Trend Points
// ============================================================

export async function recordTrendPoint(
  entityId: string,
  snapshot: SnapshotRow,
  trigger: 'new_signals' | 'news' | 'financial_report' | 'admin_refresh' | 'weekly' | 'manual' | 'initial'
): Promise<void> {
  const admin = createAdminClient()
  await admin.from('intelligence_trend_points').insert({
    entity_id:       entityId,
    snapshot_id:     snapshot.id,
    scarsian_score:  snapshot.scarsian_score,
    confidence_score: snapshot.confidence_score,
    cgs_score:       snapshot.cgs_score ?? null,
    crs_score:       snapshot.crs_score ?? null,
    mvs_score:       snapshot.mvs_score ?? null,
    cfs_score:       snapshot.cfs_score ?? null,
    gfi_score:       snapshot.gfi_score ?? null,
    trigger,
  })
}

export async function getTrendPoints(
  entityId: string,
  limit = 12
): Promise<Array<{ recorded_at: string; scarsian_score: number; confidence_score: number }>> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('intelligence_trend_points')
    .select('recorded_at, scarsian_score, confidence_score')
    .eq('entity_id', entityId)
    .order('recorded_at', { ascending: true })
    .limit(limit)
  return (data ?? []) as Array<{ recorded_at: string; scarsian_score: number; confidence_score: number }>
}
