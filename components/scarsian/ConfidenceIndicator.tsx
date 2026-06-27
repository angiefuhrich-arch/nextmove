'use client'

import { motion } from 'framer-motion'

interface ConfidenceIndicatorProps {
  percentage: number
  size?: 'sm' | 'md'
}

export function ConfidenceIndicator({ percentage, size = 'md' }: ConfidenceIndicatorProps) {
  const width = size === 'sm' ? 'w-32' : 'w-48'
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/50 uppercase tracking-[0.5px]">Confidence</span>
        <span className="text-sm font-bold text-white">{percentage}%</span>
      </div>
      <div className={`h-1.5 bg-white/10 rounded-full overflow-hidden ${width}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full bg-blue rounded-full"
        />
      </div>
    </div>
  )
}
