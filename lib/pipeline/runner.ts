// Pipeline stub runner — advances through all steps with delays.
// Replace each step body with real implementation in Phase C+.

export type PipelineStatus =
  | 'queued'
  | 'discovering'
  | 'verifying'
  | 'collecting'
  | 'extracting'
  | 'detecting_events'
  | 'generating_signals'
  | 'running_engines'
  | 'scoring'
  | 'generating_brief'
  | 'completed'
  | 'insufficient_evidence'
  | 'failed'

export interface StepLogEntry {
  step: PipelineStatus
  label: string
  startedAt: string
  completedAt?: string
  note?: string
}

export const PIPELINE_STEPS: { status: PipelineStatus; label: string; durationMs: number }[] = [
  { status: 'discovering',       label: 'Discovering employer identity',  durationMs: 2200 },
  { status: 'verifying',         label: 'Verifying entity',               durationMs: 1800 },
  { status: 'collecting',        label: 'Collecting intelligence sources', durationMs: 2500 },
  { status: 'extracting',        label: 'Extracting evidence',            durationMs: 2000 },
  { status: 'detecting_events',  label: 'Detecting key events',           durationMs: 1600 },
  { status: 'generating_signals',label: 'Generating signals',             durationMs: 1800 },
  { status: 'running_engines',   label: 'Running intelligence engines',   durationMs: 2200 },
  { status: 'scoring',           label: 'Computing Scarsian Index',       durationMs: 1400 },
  { status: 'generating_brief',  label: 'Generating analyst brief',       durationMs: 2000 },
]

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// In-memory store for demo (replace with DB updates in Phase C)
const runStore = new Map<string, {
  status: PipelineStatus
  stepLog: StepLogEntry[]
  entitySlug: string
  entityName: string
}>()

export function getRunState(runId: string) {
  return runStore.get(runId) ?? null
}

export function createRun(runId: string, entitySlug: string, entityName: string) {
  runStore.set(runId, {
    status: 'queued',
    stepLog: [],
    entitySlug,
    entityName,
  })
}

export async function runPipeline(runId: string) {
  const state = runStore.get(runId)
  if (!state) return

  for (const step of PIPELINE_STEPS) {
    const entry: StepLogEntry = {
      step: step.status,
      label: step.label,
      startedAt: new Date().toISOString(),
    }
    state.status = step.status
    state.stepLog = [...state.stepLog, entry]
    runStore.set(runId, { ...state })

    await sleep(step.durationMs)

    entry.completedAt = new Date().toISOString()
    state.stepLog = state.stepLog.map(e => e.step === step.status ? entry : e)
    runStore.set(runId, { ...state })
  }

  // Stub outcome: 80% completed, 20% insufficient_evidence
  const outcome: PipelineStatus = Math.random() < 0.8 ? 'completed' : 'insufficient_evidence'
  state.status = outcome
  runStore.set(runId, { ...state })
}
