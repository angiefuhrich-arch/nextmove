// Data access layer — Entity System
// Server-side only. Never import in client components.

import { createAdminClient } from '@/lib/supabase/admin'
import type { Entity, EntityType, EntityRelationship, RelationshipType } from '@/lib/types/intelligence'

// ============================================================
// Entities
// ============================================================

export async function getEntityById(id: string): Promise<Entity | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('entities')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return data as Entity
}

export async function getEntityBySlug(slug: string, entityType?: EntityType): Promise<Entity | null> {
  const admin = createAdminClient()
  let query = admin.from('entities').select('*').eq('slug', slug)
  if (entityType) query = query.eq('entity_type', entityType)
  const { data, error } = await query.single()
  if (error || !data) return null
  return data as Entity
}

export async function searchEntities(query: string, entityType?: EntityType, limit = 20): Promise<Entity[]> {
  const admin = createAdminClient()
  let q = admin
    .from('entities')
    .select('*')
    .ilike('name', `%${query}%`)
    .eq('is_active', true)
    .order('name')
    .limit(limit)
  if (entityType) q = q.eq('entity_type', entityType)
  const { data } = await q
  return (data ?? []) as Entity[]
}

export interface CreateEntityInput {
  entity_type: EntityType
  name: string
  slug: string
  market?: string | null
  legacy_company_id?: string | null
  metadata?: Record<string, unknown>
}

export async function upsertEntity(input: CreateEntityInput): Promise<Entity> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('entities')
    .upsert({
      entity_type: input.entity_type,
      name: input.name,
      slug: input.slug,
      market: input.market ?? null,
      legacy_company_id: input.legacy_company_id ?? null,
      metadata: input.metadata ?? {},
    }, { onConflict: 'entity_type,slug' })
    .select()
    .single()
  if (error || !data) throw new Error(`Failed to upsert entity: ${error?.message}`)
  return data as Entity
}

export async function migrateCompanyToEntity(companyId: string): Promise<Entity> {
  const admin = createAdminClient()
  const { data: company, error } = await admin
    .from('companies')
    .select('id, name, slug, industry, headquarters')
    .eq('id', companyId)
    .single()
  if (error || !company) throw new Error(`Company not found: ${companyId}`)

  return upsertEntity({
    entity_type: 'company',
    name: company.name,
    slug: company.slug,
    market: company.headquarters ?? null,
    legacy_company_id: company.id,
    metadata: { industry: company.industry },
  })
}

// ============================================================
// Entity Relationships
// ============================================================

export async function getEntityRelationships(entityId: string): Promise<EntityRelationship[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('entity_relationships')
    .select('*')
    .or(`from_entity_id.eq.${entityId},to_entity_id.eq.${entityId}`)
    .eq('is_active', true)
  return (data ?? []) as EntityRelationship[]
}

export async function getParentEntities(entityId: string): Promise<Entity[]> {
  const admin = createAdminClient()
  const { data: rels } = await admin
    .from('entity_relationships')
    .select('to_entity_id')
    .eq('from_entity_id', entityId)
    .eq('relationship', 'subsidiary_of')
    .eq('is_active', true)
  if (!rels?.length) return []
  const parentIds = rels.map(r => r.to_entity_id)
  const { data } = await admin.from('entities').select('*').in('id', parentIds)
  return (data ?? []) as Entity[]
}

export interface CreateRelationshipInput {
  from_entity_id: string
  to_entity_id: string
  relationship: RelationshipType
  propagation_weight?: number
  propagation_confidence_penalty?: number
  valid_from?: string | null
  valid_until?: string | null
}

export async function createEntityRelationship(input: CreateRelationshipInput): Promise<EntityRelationship> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('entity_relationships')
    .insert({
      from_entity_id: input.from_entity_id,
      to_entity_id: input.to_entity_id,
      relationship: input.relationship,
      propagation_weight: input.propagation_weight ?? 0.30,
      propagation_confidence_penalty: input.propagation_confidence_penalty ?? 0.20,
      valid_from: input.valid_from ?? null,
      valid_until: input.valid_until ?? null,
    })
    .select()
    .single()
  if (error || !data) throw new Error(`Failed to create relationship: ${error?.message}`)
  return data as EntityRelationship
}
