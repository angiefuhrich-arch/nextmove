import { NextRequest, NextResponse } from 'next/server'
import { getEntityBySlug } from '@/lib/dal/entities'
import { getLatestApprovedSnapshot } from '@/lib/dal/snapshots'

const DIMS = ['cgs_score', 'crs_score', 'mvs_score', 'cfs_score', 'gfi_score'] as const
const DIM_LABELS: Record<typeof DIMS[number], string> = {
  cgs_score: 'Culture & Growth',
  crs_score: 'Comp & Retention',
  mvs_score: 'Mission & Vision',
  cfs_score: 'Career Fit',
  gfi_score: 'GFI',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string }> }
) {
  const { entitySlug } = await params
  const entity = await getEntityBySlug(entitySlug, 'company')
  if (!entity) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const snapshot = await getLatestApprovedSnapshot(entity.id)

  return NextResponse.json({
    slug: entitySlug,
    name: entity.name,
    industry: (entity.metadata as Record<string, string> | null)?.industry ?? entity.market ?? null,
    indexScore: snapshot?.scarsian_score ?? null,
    verdict: snapshot?.verdict ?? null,
    confidence: snapshot?.confidence_score ?? null,
    categories: snapshot
      ? DIMS.map(k => ({ name: DIM_LABELS[k], score: snapshot[k] ?? null })).filter(c => c.score !== null)
      : [],
  })
}
