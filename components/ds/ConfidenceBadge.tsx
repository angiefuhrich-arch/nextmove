import { cn } from '@/lib/utils'

interface ConfidenceBadgeProps {
  value: number
  showDots?: boolean
  dotCount?: number
  showLabel?: boolean
  className?: string
  size?: 'sm' | 'md'
}

function confidenceLabel(v: number) {
  if (v >= 80) return 'High'
  if (v >= 55) return 'Moderate'
  if (v >= 35) return 'Low'
  return 'Insufficient'
}

function confidenceColor(v: number): string {
  if (v >= 80) return 'text-status-success'
  if (v >= 55) return 'text-status-warning'
  return 'text-status-danger'
}

export function ConfidenceBadge({
  value,
  showDots = true,
  dotCount = 10,
  showLabel = true,
  className,
  size = 'sm',
}: ConfidenceBadgeProps) {
  const filled    = Math.round((value / 100) * dotCount)
  const colorText = confidenceColor(value)
  const label     = confidenceLabel(value)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showDots && (
        <div className={cn('flex items-center gap-0.5', size === 'md' ? 'gap-1' : 'gap-0.5')}>
          {Array.from({ length: dotCount }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'rounded-full transition-colors',
                size === 'md' ? 'w-2 h-2' : 'w-1.5 h-1.5',
                i < filled ? 'bg-brand' : 'bg-divider'
              )}
            />
          ))}
        </div>
      )}
      {showLabel && (
        <span className={cn('text-badge font-semibold', colorText)}>
          {label} · {value}%
        </span>
      )}
    </div>
  )
}
