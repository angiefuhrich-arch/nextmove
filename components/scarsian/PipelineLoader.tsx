'use client'

import { motion } from 'framer-motion'
import { PipelineStep } from './PipelineStep'
import { PIPELINE_STEPS, type PipelineStatus, type StepLogEntry } from '@/lib/pipeline/runner'

interface PipelineLoaderProps {
  entityName: string
  status: PipelineStatus
  stepLog: StepLogEntry[]
}

function getStepState(stepStatus: PipelineStatus, currentStatus: PipelineStatus, stepLog: StepLogEntry[]) {
  const completedEntry = stepLog.find(e => e.step === stepStatus && e.completedAt)
  if (completedEntry) return 'done' as const
  if (currentStatus === stepStatus) return 'active' as const
  return 'pending' as const
}

const terminalStatuses: PipelineStatus[] = ['completed', 'insufficient_evidence', 'failed']

function getSourceCount(stepLog: StepLogEntry[]) {
  return stepLog.filter(e => e.completedAt).length
}

function getEvidenceCount(stepLog: StepLogEntry[]) {
  const notes = stepLog.map(e => e.note ?? '').filter(Boolean)
  const match = notes.join(' ').match(/(\d+)\s+evidence/i)
  return match ? parseInt(match[1]) : notes.length
}

export function PipelineLoader({ entityName, status, stepLog }: PipelineLoaderProps) {
  const isTerminal = terminalStatuses.includes(status)
  const sourcesDiscovered = getSourceCount(stepLog)
  const evidenceCollected = getEvidenceCount(stepLog)

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          {!isTerminal && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-2 border-brand/20 border-t-brand mx-auto mb-4"
            />
          )}
          {status === 'completed' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-12 h-12 rounded-full bg-verdict-green/10 border border-verdict-green/30 flex items-center justify-center mx-auto mb-4"
            >
              <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
                <path d="M2 9l5.5 5.5L20 2" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
          )}
          {status === 'insufficient_evidence' && (
            <div className="w-12 h-12 rounded-full bg-verdict-amber/10 border border-verdict-amber/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-verdict-amber text-xl font-bold">!</span>
            </div>
          )}

          {!isTerminal && (
            <p className="text-[10px] font-bold uppercase tracking-[3px] text-brand mb-3">
              Preparing Your Intelligence Brief™
            </p>
          )}

          <h1 className="text-2xl font-bold text-ink mb-1">
            {isTerminal
              ? status === 'completed' ? 'Intelligence ready' : 'Insufficient public evidence'
              : `Researching ${entityName}`}
          </h1>
          <p className="text-sm text-ink-secondary">
            {isTerminal
              ? status === 'completed'
                ? `Report for ${entityName} is ready.`
                : `Not enough public data found for ${entityName}.`
              : 'This typically takes a few seconds...'}
          </p>

          {/* Stats row */}
          {!isTerminal && (
            <div className="mt-4 flex items-center justify-center gap-6 text-sm text-ink-secondary">
              <span>Sources discovered: <strong className="text-ink">{sourcesDiscovered}</strong></span>
              <span>Evidence collected: <strong className="text-ink">{evidenceCollected}</strong></span>
            </div>
          )}
        </motion.div>

        {/* Steps */}
        <div className="bg-surface-elevated border border-divider rounded-2xl p-6 space-y-5">
          {PIPELINE_STEPS.map((step, i) => (
            <PipelineStep
              key={step.status}
              label={step.label}
              state={getStepState(step.status, status, stepLog)}
              index={i}
            />
          ))}
        </div>

        {!isTerminal && (
          <p className="text-center text-xs text-ink-tertiary mt-6">
            Do not close this tab — we&apos;ll redirect you automatically.
          </p>
        )}
      </div>
    </div>
  )
}
