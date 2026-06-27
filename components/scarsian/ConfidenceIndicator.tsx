'use client'

import { motion } from 'framer-motion'

interface ConfidenceIndicatorProps {
  percentage: number
  label?: string
}

export function ConfidenceIndicator({ percentage, label = 'Confidence' }: ConfidenceIndicatorProps) {
  const color =
    percentage >= 80 ? '#10B981' :
    percentage >= 60 ? '#F59E0B' : '#EF4444'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/50">{label}</span>
        <span className="font-semibold" style={{ color }}>{percentage}%</span>
      </div>
      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  )
}
