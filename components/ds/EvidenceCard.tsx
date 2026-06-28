import { cn } from '@/lib/utils'
import { Calendar } from 'lucide-react'
import { SourceBadge, SourceTier } from './SourceBadge'

interface EvidenceCardProps {
  title: string
  summary?: string
  sourceLabel?: string
  sourceUrl?: string
  sourceTier?: SourceTier
  date?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  isLast?: boolean
  className?: string
}

const SENTIMENT_DOT: Record<string, string> = {
  positive: 'bg-status-success',
  neutral:  'bg-status-warning',
  negative: 'bg-status-danger',
}

export function EvidenceCard({
  title,
  summary,
  sourceLabel,
  sourceUrl,
  sourceTier = 3,
  date,
  sentiment,
  isLast,
  className,
}: EvidenceCardProps) {
  return (
    <div className={cn(
      'flex gap-3 px-4 py-3',
      'hover:bg-surface-subdued/50 transition-colors duration-fast',
      !isLast && 'border-b border-divider-subtle',
      className
    )}>
      {/* Sentiment dot */}
      <div className="pt-1.5 shrink-0">
        <span className={cn(
          'block w-1.5 h-1.5 rounded-full',
          sentiment ? SENTIMENT_DOT[sentiment] : 'bg-divider'
        )} />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <p className="text-body-sm text-ink leading-snug">{title}</p>
        {summary && (
          <p className="text-caption text-ink-secondary leading-relaxed">{summary}</p>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          {sourceLabel && (
            <SourceBadge label={sourceLabel} tier={sourceTier} url={sourceUrl} />
          )}
          {date && (
            <span className="flex items-center gap-1 text-caption text-ink-quaternary">
              <Calendar size={10} />
              {date}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
