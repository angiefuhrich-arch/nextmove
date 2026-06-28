import { NextRequest, NextResponse } from 'next/server'
import { getRunState } from '@/lib/pipeline/runner'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params
  const state = getRunState(runId)

  if (!state) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  }

  return NextResponse.json({
    runId,
    status: state.status,
    stepLog: state.stepLog,
    entitySlug: state.entitySlug,
    entityName: state.entityName,
  })
}
