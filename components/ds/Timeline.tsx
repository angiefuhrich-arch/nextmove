import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

export interface TimelineItem {
  id: string
  date: string
  title: string
  description?: string
  category?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  icon?: ReactNode
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

const sentimentDot: Record<string, string> = {
  positive: 'bg-status-success border-status-success/30',
  neutral:  'bg-status-warning border-status-warning/30',
  negative: 'bg-status-danger  border-status-danger/30',
}

const sentimentCategory: Record<string, string> = {
  positive: 'bg-status-success-bg text-status-success border-status-success-border',
  neutral:  'bg-status-warning-bg text-status-warning border-status-warning-border',
  negative: 'bg-status-danger-bg  text-status-danger  border-status-danger-border',
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn('relative', className)}>
      {items.map((item, i) => (
        <li key={item.id} className="flex gap-4 pb-6 last:pb-0">
          {/* Spine */}
          <div className="flex flex-col items-center gap-0">
            <span className={cn(
              'w-3 h-3 rounded-full border-2 shrink-0 mt-0.5',
              item.sentiment ? sentimentDot[item.sentiment] : 'bg-brand border-brand/30'
            )} />
            {i < items.length - 1 && (
              <span className="w-px flex-1 bg-divider mt-1" />
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1 pb-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-badge text-ink-quaternary">{item.date}</span>
              {item.category && (
                <span className={cn(
                  'text-micro font-semibold tracking-caps uppercase px-2 py-0.5 rounded-full border',
                  item.sentiment ? sentimentCategory[item.sentiment] : 'bg-surface-subdued text-ink-tertiary border-divider'
                )}>
                  {item.category}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-ink">{item.title}</p>
            {item.description && (
              <p className="text-signal text-ink-secondary leading-relaxed">{item.description}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
