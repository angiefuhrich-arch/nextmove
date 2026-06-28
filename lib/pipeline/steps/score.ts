import 'server-only'

// Step: Score
// Phase D: Apply formula registry weights to compute Scarsian Index™.
// Currently: stub.

import type { PipelineContext, StepResult } from '../types'

const STUB_DELAY = 1200

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function scoreStep(_ctx: PipelineContext): Promise<StepResult> {
  // Phase D TODO:
  // 1. Read engine_outputs for this run
  // 2. Load active formula_version from formula_registry
  // 3. Apply: Scarsian Index = CGS×0.30 + CRS×0.25 + MVS×0.15 + CFS×0.20 + GFI×0.10
  // 4. Store into scarsian_snapshots (status=draft, not yet public)
  // 5. Record formula_version_id for full reproducibility

  await sleep(STUB_DELAY)

  return {
    success: true,
    note: '[stub] Scarsian Index scoring not yet implemented (Phase D)',
  }
}
