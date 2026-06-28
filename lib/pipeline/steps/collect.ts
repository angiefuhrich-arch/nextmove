// Step: Collect
// Phase D: Fetch full content from selected source_candidates.
// Currently: marks all source candidates as selected and returns success.

import { createAdminClient } from '@/lib/supabase/admin'
import type { PipelineContext, StepResult } from '../types'

const STUB_DELAY = 1800

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function collectStep(ctx: PipelineContext): Promise<StepResult> {
  // Phase D TODO: fetch raw HTML/content for each source_candidate,
  // store full_text into source_candidates.raw_text column.

  const db = createAdminClient()
  const { count } = await db
    .from('source_candidates')
    .select('*', { count: 'exact', head: true })
    .eq('pipeline_run_id', ctx.runId)

  if (!count || count === 0) {
    return { success: false, insufficientEvidence: true, note: 'No sources to collect' }
  }

  // Mark all as selected (Phase D: only select high-reliability ones)
  await db
    .from('source_candidates')
    .update({ is_selected: true })
    .eq('pipeline_run_id', ctx.runId)

  await sleep(STUB_DELAY)

  return {
    success: true,
    note: `[stub] ${count} sources marked selected; full content fetch not yet implemented`,
  }
}
