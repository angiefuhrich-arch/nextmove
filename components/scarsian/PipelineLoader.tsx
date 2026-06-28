'use client'

import { motion } from 'framer-motion'
import { Sparkles, Check } from 'lucide-react'
import { PipelineStep } from './PipelineStep'
import { Constellation } from './Constellation'
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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-16 brand-gradient relative overflow-hidden">
      {/* Constellation background */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <Constellation
          width={600}
          height={600}
          nodeCount={8}
          opacity={0.06}
          animated={!isTerminal}
          variant="radiating"
          centerX={300}
          centerY={300}
        />
      </div>

      <div className="relative max-w-[480px] w-full z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <motion.div
              animate={{ rotate: isTerminal ? 0 : 360 }}
              transition={{ duration: 3, repeat: isTerminal ? 0 : Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-5 h-5 text-brand" />
            </motion.div>
            <span className="text-[11px] font-bold uppercase tracking-[2px] text-brand">
              {isTerminal ? 'Intelligence Brief Ready' : 'Preparing your Intelligence Brief™'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-ink mb-2">
            {isTerminal
              ? status === 'completed' ? entityName : 'Insufficient public evidence'
              : `Researching ${entityName}`}
          </h1>
          <p className="text-sm text-ink-tertiary">
            {isTerminal
              ? status === 'completed'
                ? 'Your Intelligence Brief is ready for review.'
                : `Not enough public data found for ${entityName}.`
              : 'This typically takes a few seconds. Every finding is verified against trusted sources.'}
          </p>
        </motion.div>

        {/* Stats row */}
        {!isTerminal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-4 mb-6 text-[10px] text-ink-quaternary">
            <span>Sources discovered: {sourcesDiscovered}</span>
            <span>Evidence collected: {evidenceCollected}</span>
          </motion.div>
        )}

        {/* Steps */}
        <div className="flex flex-col gap-0 relative">
          <div className="absolute left-[17px] top-3 bottom-3 w-px bg-divider" />
          {PIPELINE_STEPS.map((step, i) => {
            const state = getStepState(step.status, status, stepLog)
            const isDone = state === 'done'
            const isActive = state === 'active'
            return (
              <motion.div
                key={step.status}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: state === 'pending' ? 0.3 : 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3.5 py-2.5 relative"
              >
                <div className={`w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all duration-500 ${
                  isDone ? 'bg-brand text-white' :
                  isActive ? 'bg-brand/10 text-brand border border-brand/30' :
                  'bg-surface-subdued text-ink-quaternary border border-divider'
                }`}>
                  {isDone ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                </div>
                <div className="flex-1 text-left pt-0.5 min-w-0">
                  <div className={`text-[13px] font-medium transition-colors ${
                    isDone ? 'text-brand' : isActive ? 'text-ink' : 'text-ink-quaternary'
                  }`}>
                    {step.label}
                  </div>
                  {isActive && (
                    <div className="flex gap-1 mt-1.5">
                      {[0, 1, 2].map(j => (
                        <motion.div
                          key={j}
                          className="w-1.5 h-1.5 rounded-full bg-brand/40"
                          animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: j * 0.2 }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
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
