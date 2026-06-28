// Pipeline Orchestrator — Supabase-persistent, survives restarts.
// Each step is atomic: status is written to pipeline_runs before step begins.
// On server restart the frontend can poll status and get live state from DB.

import { startStep, completeStep, updateRunStatus, buildContext } from './db'
import { discoverStep }       from './steps/discover'
import { verifyStep }         from './steps/verify'
import { collectStep }        from './steps/collect'
import { extractStep }        from './steps/extract'
import { detectEventsStep }   from './steps/detect-events'
import { generateSignalsStep } from './steps/generate-signals'
import { runEnginesStep }     from './steps/run-engines'
import { scoreStep }          from './steps/score'
import { generateBriefStep }  from './steps/generate-brief'
import type { PipelineContext, PipelineStatus, StepResult } from './types'
import { ORDERED_STEPS, TERMINAL_STATUSES } from './types'

interface RunContext extends PipelineContext {
  status?: PipelineStatus
}

type StepFn = (ctx: PipelineContext) => Promise<StepResult>

const STEP_FNS: Record<PipelineStatus, StepFn> = {
  discovering:       discoverStep,
  verifying:         verifyStep,
  collecting:        collectStep,
  extracting:        extractStep,
  detecting_events:  detectEventsStep,
  generating_signals: generateSignalsStep,
  running_engines:   runEnginesStep,
  scoring:           scoreStep,
  generating_brief:  generateBriefStep,
  // terminal stubs (never called as steps)
  queued:            async () => ({ success: true }),
  completed:         async () => ({ success: true }),
  insufficient_evidence: async () => ({ success: true }),
  failed:            async () => ({ success: true }),
  needs_user_clarification: async () => ({ success: true }),
}

export async function runPipeline(runId: string): Promise<void> {
  let ctx: RunContext = await buildContext(runId)

  for (const status of ORDERED_STEPS) {
    // Bail if the run was externally terminated
    if (ctx.status && TERMINAL_STATUSES.includes(ctx.status)) break

    const stepEntry = await startStep(runId, status)
    const stepFn = STEP_FNS[status]

    let result: StepResult
    try {
      result = await stepFn(ctx)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[pipeline:${runId}] step ${status} threw:`, message)
      await completeStep(runId, stepEntry, `Error: ${message}`)
      await updateRunStatus(runId, 'failed', { errorMessage: message })
      return
    }

    // Merge any context updates from step (e.g. entityId set by verify)
    if (result.data) ctx = { ...ctx, ...result.data } as RunContext

    await completeStep(runId, stepEntry, result.note)

    if (!result.success) {
      if (result.insufficientEvidence) {
        await updateRunStatus(runId, 'insufficient_evidence')
      } else if (result.needsClarification) {
        await updateRunStatus(runId, 'needs_user_clarification')
      } else {
        await updateRunStatus(runId, 'failed', { errorMessage: result.error })
      }
      return
    }

    // Persist entityId to run record after verify step
    if (status === 'verifying' && ctx.entityId) {
      await updateRunStatus(runId, status, { entityId: ctx.entityId })
      // Re-read ctx so subsequent steps have entityId
      ctx = await buildContext(runId)
    }
  }

  await updateRunStatus(runId, 'completed')
}

