import { NextRequest, NextResponse } from 'next/server'
import { getPipelineRun } from '@/lib/pipeline/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params

  if (!runId || !/^[0-9a-f-]{36}$/.test(runId)) {
    return NextResponse.json({ error: 'Invalid runId' }, { status: 400 })
  }

  try {
    const run = await getPipelineRun(runId)
    return NextResponse.json({
      runId,
      status:     run.status,
      stepLog:    run.step_log ?? [],
      entitySlug: run.entity_slug,
      entityName: run.entity_name,
      entityId:   run.entity_id ?? null,
      pipelineVersion: run.pipeline_version,
    })
  } catch {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  }
}
