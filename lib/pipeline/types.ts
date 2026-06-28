// Shared types for the Scarsian Intelligence Pipeline
// Every step reads and writes through PipelineContext.

export const PIPELINE_VERSION = '1.0.0'

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
  | 'needs_user_clarification'

export const TERMINAL_STATUSES: PipelineStatus[] = [
  'completed',
  'insufficient_evidence',
  'failed',
  'needs_user_clarification',
]

export interface StepLogEntry {
  step: PipelineStatus
  label: string
  startedAt: string
  completedAt?: string
  note?: string
}

export interface PipelineContext {
  runId: string
  entitySlug: string
  entityName: string
  entityType: string
  entityId?: string
  pipelineVersion: string
}

export interface StepResult {
  success: boolean
  /** If true, pipeline ends with insufficient_evidence */
  insufficientEvidence?: boolean
  /** If true, pipeline ends with needs_user_clarification */
  needsClarification?: boolean
  error?: string
  /** Arbitrary output data merged into context by orchestrator */
  data?: Partial<PipelineContext>
  note?: string
}

export interface SourceCandidate {
  url: string
  title?: string
  description?: string
  publishedDate?: string
  sourceType: 'web_search' | 'news' | 'wikipedia' | 'linkedin' | 'glassdoor' | 'manual'
  discoveryRank: number
  reliabilityScore: number
}

export interface EntityCandidate {
  name: string
  normalizedName: string
  country?: string
  industry?: string
  description?: string
  confidenceScore: number
  sourceUrl?: string
  disambiguationNeeded: boolean
  matchedEntityId?: string
}

export const PIPELINE_STEP_LABELS: Record<PipelineStatus, string> = {
  queued:               'Queued',
  discovering:          'Discovering employer identity',
  verifying:            'Verifying entity',
  collecting:           'Collecting intelligence sources',
  extracting:           'Extracting evidence',
  detecting_events:     'Detecting key events',
  generating_signals:   'Generating signals',
  running_engines:      'Running intelligence engines',
  scoring:              'Computing Scarsian Index™',
  generating_brief:     'Generating analyst brief',
  completed:            'Completed',
  insufficient_evidence:'Insufficient public evidence',
  failed:               'Failed',
  needs_user_clarification: 'Needs clarification',
}

export const ORDERED_STEPS: PipelineStatus[] = [
  'discovering',
  'verifying',
  'collecting',
  'extracting',
  'detecting_events',
  'generating_signals',
  'running_engines',
  'scoring',
  'generating_brief',
]
