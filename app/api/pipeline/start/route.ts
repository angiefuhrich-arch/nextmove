import { NextRequest, NextResponse } from 'next/server'
import { createRun, runPipeline } from '@/lib/pipeline/runner'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { entitySlug, entityName } = body

  if (!entitySlug || typeof entitySlug !== 'string') {
    return NextResponse.json({ error: 'entitySlug required' }, { status: 400 })
  }

  const runId = crypto.randomUUID()
  const name = (typeof entityName === 'string' && entityName.trim()) ? entityName.trim() : entitySlug

  createRun(runId, entitySlug, name)

  // Fire-and-forget: do not await
  runPipeline(runId).catch(console.error)

  return NextResponse.json({ runId, entitySlug, entityName: name })
}
