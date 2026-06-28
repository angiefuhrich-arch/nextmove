import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPipelineRun } from '@/lib/pipeline/db'
import { runPipeline } from '@/lib/pipeline/orchestrator'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(ltd|limited|inc|corp|corporation|hk|plc|llc|group|holdings?)\b/gi, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim()
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { entitySlug, entityName, entityType } = body

  if (!entityName || typeof entityName !== 'string' || entityName.trim().length < 2) {
    return NextResponse.json({ error: 'entityName required (min 2 chars)' }, { status: 400 })
  }

  const name  = entityName.trim()
  const slug  = (typeof entitySlug === 'string' && entitySlug.trim())
    ? entitySlug.trim()
    : slugify(name)
  const type  = (typeof entityType === 'string' && entityType.trim()) ? entityType.trim() : 'employer'

  // Get auth user (optional — pipeline runs are allowed for anonymous users for now)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const runId = await createPipelineRun({
    entitySlug: slug,
    entityName: name,
    entityType: type,
    requestedBy: user?.id,
  })

  // Fire-and-forget: pipeline runs async, frontend polls /status
  runPipeline(runId).catch(err =>
    console.error(`[pipeline] run ${runId} failed:`, err)
  )

  return NextResponse.json({ runId, entitySlug: slug, entityName: name })
}
