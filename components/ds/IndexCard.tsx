import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

interface IndexCardProps {
  score: number
  label?: string
  sublabel?: string
  showBar?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function scoreColor(score: number) {
  if (score >= 70) return { text: 'text-status-success', bar: 'success' as const }
  if (score >= 45) return { text: 'text-status-warning', bar: 'warning' as const }
  return { text: 'text-status-danger', bar: 'danger' as const }
}

const sizeClasses = {
  sm: { score: 'text-metric-sm', label: 'text-caption' },
  md: { score: 'text-metric-lg', label: 'text-label'   },
  lg: { score: 'text-metric-xl', label: 'text-body-sm' },
}

export function IndexCard({ score, label = 'SCARSIAN INDEX™', sublabel, showBar = true, size = 'md', className }: IndexCardProps) {
  const { text, bar } = scoreColor(score)
  const sz = sizeClasses[size]

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <p className="text-label font-semibold tracking-caps uppercase text-ink-tertiary">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={cn('font-bold leading-none', text, sz.score)}>
          {score}
        </span>
        <span className="text-sm text-ink-quaternary">/100</span>
      </div>
      {showBar && (
        <Progress value={score} color={bar} size="md" />
      )}
      {sublabel && <p className={cn('text-ink-tertiary', sz.label)}>{sublabel}</p>}
    </div>
  )
}
