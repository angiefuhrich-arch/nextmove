import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export interface ScoringDimension {
  dimension_key:   string
  dimension_label: string
  pillar_weight:   number
  sub_dimensions:  Array<{
    key:    string
    label:  string
    weight: number
    signal_key?: string
  }>
  is_adjustment: boolean
  adjustment_min?: number | null
  adjustment_max?: number | null
  sort_order: number
}

export interface ScoringModel {
  id:                           string
  entity_type:                  string
  model_name:                   string
  version:                      string
  description:                  string | null
  insufficient_data_threshold:  number
  verdict_strong:               number
  verdict_caution:              number
  is_active:                    boolean
  dimensions:                   ScoringDimension[]
}

export async function getActiveScoringModel(entityType: string): Promise<ScoringModel | null> {
  const supabase = createAdminClient()

  const { data: model, error } = await supabase
    .from('scoring_models')
    .select('*')
    .eq('entity_type', entityType)
    .eq('is_active', true)
    .single()

  if (error || !model) return null

  const { data: dims } = await supabase
    .from('scoring_dimensions')
    .select('*')
    .eq('model_id', model.id)
    .order('sort_order')

  return {
    ...model,
    dimensions: (dims ?? []).map(d => ({
      ...d,
      pillar_weight: Number(d.pillar_weight),
    })),
  }
}

export async function getActiveBriefTemplate(entityType: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('brief_templates')
    .select('*')
    .eq('entity_type', entityType)
    .eq('is_active', true)
    .single()

  if (error) return null
  return data
}

export async function getSourceTierRules(entityType?: string) {
  const supabase = createAdminClient()

  let query = supabase
    .from('source_tier_rules')
    .select('*')
    .eq('is_active', true)

  if (entityType) {
    // Return global rules (entity_type IS NULL) + entity-specific overrides
    query = query.or(`entity_type.is.null,entity_type.eq.${entityType}`)
  } else {
    query = query.is('entity_type', null)
  }

  const { data } = await query
  return data ?? []
}
