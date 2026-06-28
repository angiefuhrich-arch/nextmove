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

export function PipelineLoader({ entityName, status, stepLog }: PipelineLoaderProps) {
  const isTerminal = terminalStatuses.includes(status)

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
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
              className="w-12 h-12 rounded-full border-2 border-blue-500/30 border-t-blue-500 mx-auto mb-6"
            />
          )}
          {status === 'completed' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-12 h-12 rounded-full bg-verdict-green/20 border border-verdict-green/40 flex items-center justify-center mx-auto mb-6"
            >
              <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
                <path d="M2 9l5.5 5.5L20 2" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
          )}
          {status === 'insufficient_evidence' && (
            <div className="w-12 h-12 rounded-full bg-verdict-amber/20 border border-verdict-amber/40 flex items-center justify-center mx-auto mb-6">
              <span className="text-verdict-amber text-xl">!</span>
            </div>
          )}

          <h1 className="text-xl font-semibold text-white mb-1">
            {isTerminal
              ? status === 'completed' ? 'Intelligence ready' : 'Insufficient public evidence'
              : 'Building employer intelligence'}
          </h1>
          <p className="text-sm text-white/50">
            {isTerminal
              ? status === 'completed'
                ? `Report for ${entityName} is ready.`
                : `Not enough public data found for ${entityName}.`
              : `Analysing ${entityName} — this takes about 20 seconds`}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="bg-navy-dark border border-navy-light rounded-2xl p-6 space-y-4">
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
          <p className="text-center text-xs text-white/30 mt-6">
            Do not close this tab — we&apos;ll redirect you automatically.
          </p>
        )}
      </div>
    </div>
  )
}
