import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface StatCardProps {
  value: ReactNode
  label: string
  sublabel?: string
  icon?: ReactNode
  color?: 'default' | 'brand' | 'success' | 'warning' | 'danger'
  className?: string
}

const colorClasses = {
  default: { icon: 'bg-surface-subdued text-ink-tertiary', value: 'text-ink' },
  brand:   { icon: 'bg-brand-light text-brand',             value: 'text-brand' },
  success: { icon: 'bg-status-success-bg text-status-success', value: 'text-status-success' },
  warning: { icon: 'bg-status-warning-bg text-status-warning', value: 'text-status-warning' },
  danger:  { icon: 'bg-status-danger-bg  text-status-danger',  value: 'text-status-danger' },
}

export function StatCard({ value, label, sublabel, icon, color = 'default', className }: StatCardProps) {
  const c = colorClasses[color]

  return (
    <div className={cn('bg-surface-elevated border border-divider rounded-xl shadow-sm p-5 flex flex-col gap-3', className)}>
      {icon && (
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', c.icon)}>
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        <span className={cn('text-metric-lg font-bold leading-none', c.value)}>{value}</span>
        <span className="text-caption font-medium text-ink">{label}</span>
        {sublabel && <span className="text-caption text-ink-tertiary">{sublabel}</span>}
      </div>
    </div>
  )
}
