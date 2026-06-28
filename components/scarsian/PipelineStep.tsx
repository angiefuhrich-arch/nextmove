'use client'

import { motion } from 'framer-motion'

type StepState = 'pending' | 'active' | 'done' | 'error'

interface PipelineStepProps {
  label: string
  state: StepState
  index: number
  subtitle?: string
}

export function PipelineStep({ label, state, index, subtitle }: PipelineStepProps) {
  const stepNum = index + 1

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: state === 'pending' ? 0.4 : 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="flex items-start gap-4"
    >
      {/* Number circle */}
      <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center mt-0.5">
        {state === 'done' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-7 h-7 rounded-full bg-verdict-green flex items-center justify-center"
          >
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
              <path d="M1.5 4.5l2.5 2.5L9 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        )}
        {state === 'active' && (
          <div className="w-7 h-7 rounded-full bg-ink flex items-center justify-center text-[11px] font-bold text-white">
            {stepNum}
          </div>
        )}
        {state === 'error' && (
          <div className="w-7 h-7 rounded-full bg-verdict-red flex items-center justify-center text-white text-xs font-bold">
            ✕
          </div>
        )}
        {state === 'pending' && (
          <div className="w-7 h-7 rounded-full border-2 border-ink-quaternary flex items-center justify-center text-[11px] font-medium text-ink-tertiary">
            {stepNum}
          </div>
        )}
      </div>

      <div className="flex-1">
        <p className={
          state === 'done'   ? 'text-sm text-ink-tertiary line-through' :
          state === 'active' ? 'text-sm text-ink font-semibold' :
          state === 'error'  ? 'text-sm text-verdict-red font-medium' :
          'text-sm text-ink-tertiary'
        }>
          {label}
        </p>
        {subtitle && state !== 'done' && (
          <p className="text-xs text-ink-tertiary mt-0.5">{subtitle}</p>
        )}
        {/* Animated dots for active step */}
        {state === 'active' && (
          <div className="pipeline-active flex gap-1 mt-1.5">
            {[0, 1, 2].map(j => (
              <span
                key={j}
                className="w-1.5 h-1.5 rounded-full bg-brand inline-block"
                style={{ animationDelay: `${j * 0.2}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
