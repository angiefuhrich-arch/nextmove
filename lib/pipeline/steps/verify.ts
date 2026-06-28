import 'server-only'

// Step: Verify
// Examines entity_candidates to pick the best match, resolves against the
// entities table, creates a new entity record if needed, and stores aliases.

import {
  createAdminClient,
} from '@/lib/supabase/admin'
import {
  markEntityCandidateSelected,
  upsertEntity,
  upsertEntityAlias,
  lookupEntityBySlug,
  lookupEntityByName,
} from '../db'
import type { PipelineContext, StepResult, EntityCandidate } from '../types'

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(ltd|limited|inc|incorporated|co\.|corp|corporation|hk|hong kong|pvt|plc|llc|group|holdings?)\b/gi, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function toSlug(name: string): string {
  return normalizeCompanyName(name).replace(/\s+/g, '-')
}

async function getBestCandidate(runId: string): Promise<{
  id: string
  data: EntityCandidate
} | null> {
  const db = createAdminClient()
  const { data: candidates } = await db
    .from('entity_candidates')
    .select('*')
    .eq('pipeline_run_id', runId)
    .order('confidence_score', { ascending: false })
    .limit(1)

  if (!candidates || candidates.length === 0) return null

  const c = candidates[0]
  return {
    id: c.id as string,
    data: {
      name:                 c.name as string,
      normalizedName:       c.normalized_name as string,
      country:              c.country as string | undefined,
      industry:             c.industry as string | undefined,
      description:          c.description as string | undefined,
      confidenceScore:      c.confidence_score as number,
      sourceUrl:            c.source_url as string | undefined,
      disambiguationNeeded: c.disambiguation_needed as boolean,
      matchedEntityId:      c.matched_entity_id as string | undefined,
    },
  }
}

export async function verifyStep(ctx: PipelineContext): Promise<StepResult> {
  const candidate = await getBestCandidate(ctx.runId)

  if (!candidate) {
    return {
      success: false,
      insufficientEvidence: true,
      note: 'No entity candidates from discovery step',
    }
  }

  if (candidate.data.confidenceScore < 40) {
    return {
      success: false,
      insufficientEvidence: true,
      note: `Best candidate confidence too low (${candidate.data.confidenceScore}%)`,
    }
  }

  // Resolve against existing entities
  let entityId: string | undefined

  // 1. Check by slug from requested name
  const slugFromRequest = toSlug(ctx.entityName)
  const existing = await lookupEntityBySlug(slugFromRequest)
    ?? await lookupEntityByName(ctx.entityName)

  if (existing) {
    entityId = existing.id as string
  } else {
    // 2. Create new entity
    entityId = await upsertEntity({
      slug:        slugFromRequest,
      name:        ctx.entityName,
      industry:    candidate.data.industry,
      country:     candidate.data.country,
      description: candidate.data.description,
      entityType:  ctx.entityType,
      verified:    candidate.data.confidenceScore >= 75,
    })
  }

  // Mark candidate as selected
  await markEntityCandidateSelected(candidate.id)

  // Store aliases: original name variations
  const aliasVariants = new Set([
    ctx.entityName.toLowerCase(),
    normalizeCompanyName(ctx.entityName),
    candidate.data.normalizedName,
  ])
  for (const alias of aliasVariants) {
    if (alias) await upsertEntityAlias(entityId, alias)
  }

  return {
    success: true,
    note: `Entity resolved: ${ctx.entityName} → ${entityId} (confidence ${candidate.data.confidenceScore}%)`,
    data: { entityId },
  }
}
