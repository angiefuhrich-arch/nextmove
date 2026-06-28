import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: ReactNode
  sublabel?: string
  delta?: number
  icon?: ReactNode
  className?: string
  size?: 'sm' | 'md'
}

export function MetricCard({ label, value, sublabel, delta, icon, className, size = 'md' }: MetricCardProps) {
  const hasDelta = typeof delta === 'number'
  const deltaUp  = hasDelta && delta > 0
  const deltaFlat = hasDelta && delta === 0

  return (
    <div className={cn('bg-surface-elevated border border-divider rounded-2xl shadow-card p-5 flex flex-col gap-2', className)}>
      <div className="flex items-start justify-between">
        <p className="text-label font-semibold tracking-caps uppercase text-ink-tertiary">{label}</p>
        {icon && <span className="text-ink-quaternary">{icon}</span>}
      </div>

      <div className="flex items-end gap-2">
        <span className={cn('font-bold text-ink leading-none', size === 'md' ? 'text-3xl' : 'text-2xl')}>
          {value}
        </span>
        {hasDelta && (
          <span className={cn(
            'text-badge font-semibold mb-0.5',
            deltaFlat ? 'text-ink-tertiary' : deltaUp ? 'text-status-success' : 'text-status-danger'
          )}>
            {deltaFlat ? '—' : deltaUp ? `+${delta}` : `${delta}`}
          </span>
        )}
      </div>

      {sublabel && <p className="text-badge text-ink-tertiary">{sublabel}</p>}
    </div>
  )
}
