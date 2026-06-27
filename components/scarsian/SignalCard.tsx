'use client'

import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'

interface SignalCardProps {
  category: string
  date: string
  text: string
  source: string
  sourceUrl?: string
  sentiment: 'positive' | 'neutral' | 'negative'
  index?: number
}

const sentimentClass = {
  positive: 'signal-positive',
  neutral: 'signal-neutral',
  negative: 'signal-negative',
}

export function SignalCard({ category, date, text, source, sourceUrl, sentiment, index = 0 }: SignalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`bg-navy-dark rounded-r-xl p-5 flex flex-col gap-2 hover:bg-white/[0.03] transition-colors duration-300 ${sentimentClass[sentiment]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-white/50">{category}</span>
        <span className="text-[11px] text-white/40">{date}</span>
      </div>
      <p className="text-sm text-white/80 leading-relaxed">{text}</p>
      {sourceUrl ? (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue hover:underline mt-1">
          <ExternalLink className="w-3 h-3" />
          <span className="text-xs">{source}</span>
        </a>
      ) : (
        <div className="flex items-center gap-1 text-blue/60 mt-1">
          <ExternalLink className="w-3 h-3" />
          <span className="text-xs">{source}</span>
        </div>
      )}
    </motion.div>
  )
}
