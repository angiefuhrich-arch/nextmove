// Data access layer — Analyst Reports
// Server-side only.

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
    .select('*')
    .eq('entity_id', entityId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data ?? null) as AnalystReport | null
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
