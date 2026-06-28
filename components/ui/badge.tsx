import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand'

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-status-success-bg text-status-success border-status-success-border',
  warning: 'bg-status-warning-bg text-status-warning border-status-warning-border',
  danger:  'bg-status-danger-bg  text-status-danger  border-status-danger-border',
  info:    'bg-status-info-bg    text-status-info    border-status-info-border',
  neutral: 'bg-surface-subdued   text-ink-secondary  border-divider',
  brand:   'bg-brand-light       text-brand          border-brand/20',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-badge font-semibold border',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
