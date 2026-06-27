'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface ScoreCardProps {
  icon: LucideIcon
  name: string
  score: number
  description: string
  trend?: 'up' | 'down' | 'flat'
  index?: number
}

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

export function ScoreCard({ icon: Icon, name, score, description, index = 0 }: ScoreCardProps) {
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
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-blue/70" />
          <span className="text-xs font-medium text-white/70">{name}</span>
        </div>
        <span className={`text-sm font-bold ${scoreColor(score)}`}>{score}</span>
      </div>
      <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${score}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.04 + 0.1 }}
          className={`h-full rounded-full ${barColor(score)}`}
        />
      </div>
      <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">{description}</p>
    </motion.div>
  )
}
