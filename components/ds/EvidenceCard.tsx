import { cn } from '@/lib/utils'
import { ExternalLink, Calendar } from 'lucide-react'
import { SourceBadge, SourceTier } from './SourceBadge'

interface EvidenceCardProps {
  title: string
  summary: string
  sourceLabel: string
  sourceUrl?: string
  sourceTier?: SourceTier
  date?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  className?: string
}

const sentimentBorder: Record<string, string> = {
  positive: 'border-l-status-success',
  neutral:  'border-l-status-warning',
  negative: 'border-l-status-danger',
}

export function EvidenceCard({
  title,
  summary,
  sourceLabel,
  sourceUrl,
  sourceTier = 3,
  date,
  sentiment,
  className,
}: EvidenceCardProps) {
  return (
    <div className={cn(
      'bg-surface-elevated border border-divider rounded-xl p-4 flex flex-col gap-2',
      sentiment && `border-l-[3px] ${sentimentBorder[sentiment]}`,
      className
    )}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink leading-snug">{title}</p>
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-ink-quaternary hover:text-brand transition-colors"
            aria-label="Open source"
          >
            <ExternalLink size={13} />
          </a>
        )}
      </div>

      <p className="text-signal text-ink-secondary leading-relaxed">{summary}</p>

      <div className="flex items-center gap-3 mt-1">
        <SourceBadge label={sourceLabel} tier={sourceTier} url={sourceUrl} />
        {date && (
          <span className="flex items-center gap-1 text-badge text-ink-quaternary">
            <Calendar size={11} />
            {date}
          </span>
        )}
      </div>
    </div>
  )
}
