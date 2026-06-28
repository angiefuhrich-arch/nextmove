import { cn } from '@/lib/utils'

export type ProgressColor = 'brand' | 'success' | 'warning' | 'danger' | 'ink'

const colorClasses: Record<ProgressColor, string> = {
  brand:   'bg-brand',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  danger:  'bg-status-danger',
  ink:     'bg-ink',
}

interface ProgressProps {
  value: number
  color?: ProgressColor
  size?: 'xs' | 'sm' | 'md'
  className?: string
  trackClassName?: string
}

const sizeClasses = { xs: 'h-1', sm: 'h-1.5', md: 'h-2' }

function Progress({ value, color = 'brand', size = 'sm', className, trackClassName }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-surface-subdued', sizeClasses[size], trackClassName)}>
      <div
        className={cn('h-full rounded-full transition-all duration-slow ease-out', colorClasses[color], className)}
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}

export { Progress }
