// Data access layer — Signals
// Server-side only. Never import in client components.

import { createAdminClient } from '@/lib/supabase/admin'
import type { Signal, CreateSignal, SignalReviewStatus } from '@/lib/types/intelligence'
import { computeExpiresAt, computeDecayFactor, effectiveSignalScore } from '@/lib/types/intelligence'

// ============================================================
// Read
// ============================================================

export async function getActiveSignalsForEntity(entityId: string): Promise<Signal[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('signals')
    .select('*')
    .eq('entity_id', entityId)
    .eq('expired', false)
    .order('created_at', { ascending: false })
  return (data ?? []) as Signal[]
}

export async function getSignalById(id: string): Promise<Signal | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('signals')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return data as Signal
}

// ============================================================
// Write
// ============================================================

export async function createSignal(input: CreateSignal): Promise<Signal> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('signals')
    .insert({
      entity_id: input.entity_id,
      signal_name: input.signal_name,
      signal_category: input.signal_category,
      score: input.score,
      confidence: input.confidence,
      reasoning: input.reasoning ?? null,
      evidence_ids: input.evidence_ids ?? [],
      propagated_from_entity_id: input.propagated_from_entity_id ?? null,
      propagation_weight: input.propagation_weight ?? null,
      expires_at: input.expires_at ?? null,
    })
    .select()
    .single()
  if (error || !data) throw new Error(`Failed to create signal: ${error?.message}`)
  return data as Signal
}

export async function adminOverrideSignal(
  id: string,
  overrideScore: number,
  notes: string,
  reviewedBy: string
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('signals')
    .update({
      admin_override_score: overrideScore,
      admin_notes: notes,
      review_status: 'overridden' as SignalReviewStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy,
    })
    .eq('id', id)
  if (error) throw new Error(`Failed to override signal: ${error.message}`)
}

export async function acceptSignal(id: string, reviewedBy: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('signals')
    .update({
      review_status: 'accepted' as SignalReviewStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy,
    })
    .eq('id', id)
  if (error) throw new Error(`Failed to accept signal: ${error.message}`)
}

// ============================================================
// Expiry
// ============================================================

export async function expireSignal(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('signals')
    .update({ expired: true })
    .eq('id', id)
  if (error) throw new Error(`Failed to expire signal: ${error.message}`)
}

// Batch expire signals past their expires_at date
export async function expireStaleSignals(): Promise<number> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('signals')
    .update({ expired: true })
    .eq('expired', false)
    .lt('expires_at', new Date().toISOString())
    .select('id')
  if (error) throw new Error(`Failed to expire stale signals: ${error.message}`)
  return (data ?? []).length
}

// ============================================================
// Scoring helpers
// ============================================================

// Returns effective score * decay factor for use in calculations
export function weightedSignalScore(signal: Signal): number {
  const base = effectiveSignalScore(signal)
  const decay = computeDecayFactor(signal.expires_at, signal.created_at)
  return base * decay
}

// Group signals by name, returning the most-recent non-expired one per signal
export function latestSignalsByName(signals: Signal[]): Map<string, Signal> {
  const map = new Map<string, Signal>()
  for (const s of signals) {
    const existing = map.get(s.signal_name)
    if (!existing || s.created_at > existing.created_at) {
      map.set(s.signal_name, s)
    }
  }
  return map
}

// ============================================================
// Expiry date computation helper
// ============================================================

export { computeExpiresAt }
