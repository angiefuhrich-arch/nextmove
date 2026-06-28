import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/security/auth'
import { getPipelineRun } from '@/lib/pipeline/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params

  if (!runId || !/^[0-9a-f-]{36}$/.test(runId)) {
    return NextResponse.json({ error: 'Invalid runId' }, { status: 400 })
  }

  // Auth required — users may only see their own runs
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const run = await getPipelineRun(runId)

    // Users may only read their own runs (service role bypasses RLS but we enforce here)
    if (run.requested_by && run.requested_by !== auth.user.id) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }

    return NextResponse.json({
      runId,
      status:          run.status,
      stepLog:         run.step_log ?? [],
      entitySlug:      run.entity_slug,
      entityName:      run.entity_name,
      entityId:        run.entity_id ?? null,
      pipelineVersion: run.pipeline_version,
    })
  } catch {
    // Never expose internal errors
    return NextResponse.json({ error: 'Run not found.' }, { status: 404 })
  }
}
