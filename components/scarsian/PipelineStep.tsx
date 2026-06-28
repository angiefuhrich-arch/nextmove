'use client'

import { motion } from 'framer-motion'

type StepState = 'pending' | 'active' | 'done' | 'error'

interface PipelineStepProps {
  label: string
  state: StepState
  index: number
}

export function PipelineStep({ label, state, index }: PipelineStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="flex items-center gap-3"
    >
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
        {state === 'done' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-5 h-5 rounded-full bg-verdict-green flex items-center justify-center"
          >
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        )}
        {state === 'active' && (
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-3 h-3 rounded-full bg-blue-500"
          />
        )}
        {state === 'error' && (
          <div className="w-5 h-5 rounded-full bg-verdict-red flex items-center justify-center">
            <span className="text-white text-xs font-bold">✕</span>
          </div>
        )}
        {state === 'pending' && (
          <div className="w-2.5 h-2.5 rounded-full border border-white/20" />
        )}
      </div>

      <span className={
        state === 'done'    ? 'text-sm text-white/60 line-through' :
        state === 'active'  ? 'text-sm text-white font-medium' :
        state === 'error'   ? 'text-sm text-verdict-red' :
        'text-sm text-white/30'
      }>
        {label}
      </span>
    </motion.div>
  )
}
