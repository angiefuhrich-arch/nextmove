'use client'

import { motion } from 'framer-motion'
import type { CategoryScore } from '@/lib/types/ui'

function scoreColor(score: number): string {
  if (score >= 90) return 'text-score-deep'
  if (score >= 80) return 'text-score-light'
  if (score >= 60) return 'text-score-soft'
  if (score >= 40) return 'text-score-amber'
  return 'text-score-red'
}

function barColor(score: number): string {
  if (score >= 80) return 'bg-score-light'
  if (score >= 60) return 'bg-score-soft'
  if (score >= 40) return 'bg-score-amber'
  return 'bg-score-red'
}

interface ScoreCardProps {
  category: CategoryScore
  index?: number
}

export function ScoreCard({ category, index = 0 }: ScoreCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      whileHover={{ y: -1 }}
      className="scarsian-card p-4 flex flex-col gap-3 cursor-default transition-all duration-250"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/70">{category.name}</span>
        <span className={`text-sm font-bold ${scoreColor(category.score)}`}>{category.score}</span>
      </div>
      <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${category.score}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.04 + 0.1 }}
          className={`h-full rounded-full ${barColor(category.score)}`}
        />
      </div>
      <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">{category.description}</p>
    </motion.div>
  )
}
