import { cn } from '@/lib/utils'

interface ConfidenceBadgeProps {
  value: number   // 0–100
  className?: string
}

type ConfidenceLevel = 'high' | 'moderate' | 'developing' | 'early'

function getLevel(v: number): ConfidenceLevel {
  if (v >= 85) return 'high'
  if (v >= 65) return 'moderate'
  if (v >= 45) return 'developing'
  return 'early'
}

const levelConfig: Record<ConfidenceLevel, { label: string; classes: string }> = {
  high:       { label: 'High Confidence',     classes: 'bg-status-success-bg   text-status-success  ' },
  moderate:   { label: 'Moderate Confidence', classes: 'bg-brand-light         text-brand            ' },
  developing: { label: 'Developing',          classes: 'bg-status-warning-bg   text-status-warning  ' },
  early:      { label: 'Early',               classes: 'bg-status-danger-bg    text-status-danger   ' },
}

export function ConfidenceBadge({ value, className }: ConfidenceBadgeProps) {
  const level = getLevel(value)
  const { label, classes } = levelConfig[level]

  return (
    <span className={cn(
      'inline-flex items-center h-6 px-[10px] rounded-full',
      'text-label uppercase tracking-[0.08em]',
      classes,
      className
    )}>
      {label}
    </span>
  )
}
