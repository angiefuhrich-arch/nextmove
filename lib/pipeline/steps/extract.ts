import 'server-only'

// Step: Extract
// Phase D: Use AI to extract structured facts from raw source text.
// Creates immutable evidence_records.
// Currently: stub — no extraction performed.

import type { PipelineContext, StepResult } from '../types'

const STUB_DELAY = 1600

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function extractStep(_ctx: PipelineContext): Promise<StepResult> {
  // Phase D TODO:
  // 1. Read selected source_candidates with raw_text
  // 2. For each source, call AI extraction prompt → structured evidence JSON
  // 3. Insert into evidence_records (immutable)
  // 4. Check minimum evidence threshold → return insufficientEvidence if below

  await sleep(STUB_DELAY)

  return {
    success: true,
    note: '[stub] Evidence extraction not yet implemented (Phase D)',
  }
}
