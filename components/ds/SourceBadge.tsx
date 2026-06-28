import { cn } from '@/lib/utils'
import { ExternalLink, Star } from 'lucide-react'

export type SourceTier = 1 | 2 | 3 | 4

interface SourceBadgeProps {
  label: string
  tier?: SourceTier
  url?: string
  className?: string
}

// Stars filled per tier (max 3 shown publicly; tier 4 is internal only)
const tierStars: Record<SourceTier, number> = { 1: 3, 2: 2, 3: 1, 4: 0 }

export function SourceBadge({ label, tier = 3, url, className }: SourceBadgeProps) {
  const filledStars = tierStars[tier]
  const MAX_STARS = 3

  const inner = (
    <>
      <ExternalLink size={10} className="text-ink-quaternary shrink-0" />
      <span className="text-caption text-ink-secondary truncate">{label}</span>
      <span className="flex items-center gap-px shrink-0">
        {Array.from({ length: MAX_STARS }).map((_, i) => (
          <Star
            key={i}
            size={10}
            className={i < filledStars ? 'text-status-warning fill-status-warning' : 'text-divider fill-none'}
          />
        ))}
      </span>
    </>
  )

  const cls = cn(
    'inline-flex items-center gap-1.5 px-[14px] py-[10px] rounded-xl',
    'bg-surface-elevated border border-divider',
    'hover:shadow-md transition-shadow duration-base',
    className
  )

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    )
  }

  return <span className={cls}>{inner}</span>
}
