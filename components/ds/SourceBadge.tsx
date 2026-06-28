import { cn } from '@/lib/utils'

export type SourceTier = 1 | 2 | 3 | 4

interface SourceBadgeProps {
  label: string
  tier?: SourceTier
  url?: string
  className?: string
}

const tierClasses: Record<SourceTier, string> = {
  1: 'bg-status-success-bg text-status-success border-status-success-border',
  2: 'bg-status-info-bg   text-status-info   border-status-info-border',
  3: 'bg-surface-subdued  text-ink-secondary  border-divider',
  4: 'bg-surface-subdued  text-ink-tertiary   border-divider',
}

const tierLabels: Record<SourceTier, string> = {
  1: 'Official',
  2: 'Verified',
  3: 'News',
  4: 'Community',
}

export function SourceBadge({ label, tier = 3, url, className }: SourceBadgeProps) {
  const cls = cn(
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-badge font-medium border',
    tierClasses[tier],
    className
  )

  const inner = (
    <>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', {
        'bg-status-success': tier === 1,
        'bg-status-info':    tier === 2,
        'bg-ink-tertiary':   tier === 3 || tier === 4,
      })} />
      {label}
    </>
  )

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={cn(cls, 'hover:opacity-80 transition-opacity')}>
        {inner}
      </a>
    )
  }

  return <span className={cls}>{inner}</span>
}
