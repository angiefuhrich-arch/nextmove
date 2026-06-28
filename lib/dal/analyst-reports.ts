// Data access layer — Analyst Reports
// Server-side only.
// IMPORTANT: evidence_ids_used is an internal audit field and must NEVER be
// included in any public-facing query or API response. Use redactForPublic()
// before returning any report to the client.

import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export interface AnalystReport {
  id: string
  entity_id: string
  snapshot_id: string | null
  title: string
  summary: string
  strengths: Array<{ text: string }>
  risks: Array<{ text: string }>
  good_for: Array<{ text: string }>
  avoid_if: Array<{ text: string }>
  gfi_notes: string | null
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CreateAnalystReportInput {
  entity_id: string
  snapshot_id?: string | null
  title: string
  summary: string
  strengths?: Array<{ text: string }>
  risks?: Array<{ text: string }>
  good_for?: Array<{ text: string }>
  avoid_if?: Array<{ text: string }>
  gfi_notes?: string | null
  created_by?: string | null
}

export async function createAnalystReport(input: CreateAnalystReportInput): Promise<AnalystReport> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('analyst_reports')
    .insert({
      entity_id:   input.entity_id,
      snapshot_id: input.snapshot_id ?? null,
      title:       input.title,
      summary:     input.summary,
      strengths:   input.strengths ?? [],
      risks:       input.risks ?? [],
      good_for:    input.good_for ?? [],
      avoid_if:    input.avoid_if ?? [],
      gfi_notes:   input.gfi_notes ?? null,
      status:      'draft',
      created_by:  input.created_by ?? null,
    })
    .select()
    .single()
  if (error || !data) throw new Error(`Failed to create analyst report: ${error?.message}`)
  return data as AnalystReport
}

export async function updateAnalystReport(
  id: string,
  updates: Partial<Pick<AnalystReport, 'title' | 'summary' | 'strengths' | 'risks' | 'good_for' | 'avoid_if' | 'gfi_notes'>>
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('analyst_reports')
    .update(updates)
    .eq('id', id)
  if (error) throw new Error(`Failed to update analyst report: ${error.message}`)
}

export async function publishAnalystReport(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('analyst_reports')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(`Failed to publish analyst report: ${error.message}`)
}

export async function getPublishedReportForEntity(entityId: string): Promise<AnalystReport | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('analyst_reports')
    .select(PUBLIC_REPORT_COLUMNS)   // never fetch evidence_ids_used
    .eq('entity_id', entityId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  return redactForPublic(data as AnalystReport)
}

export async function getDraftReportsForEntity(entityId: string): Promise<AnalystReport[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('analyst_reports')
    .select('*')
    .eq('entity_id', entityId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
  return (data ?? []) as AnalystReport[]
}

// ── Public-safe projection ────────────────────────────────────────────────────
// Strips internal fields that must never be exposed to frontend or API responses.
// Always call this before returning a report to any client.

export type PublicAnalystReport = Omit<AnalystReport, never> & {
  // evidence_ids_used is excluded at type level
}

export function redactForPublic(report: AnalystReport & { evidence_ids_used?: unknown; brief_template_id?: unknown; brief_template_version?: unknown }): AnalystReport {
  const safe = { ...report } as Record<string, unknown>
  delete safe['evidence_ids_used']
  delete safe['brief_template_id']
  delete safe['brief_template_version']
  return safe as unknown as AnalystReport
}

// Public select columns — use this in all public-facing Supabase queries
// to ensure evidence_ids_used is never fetched from the DB.
export const PUBLIC_REPORT_COLUMNS =
  'id,entity_id,snapshot_id,title,summary,strengths,risks,good_for,avoid_if,gfi_notes,status,published_at,created_at,updated_at' as const
