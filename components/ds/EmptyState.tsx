import { cn } from '@/lib/utils'
import { ReactNode } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'

interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: ButtonProps['variant']
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  actions?: EmptyStateAction[]
  className?: string
  size?: 'sm' | 'md'
}

export function EmptyState({ icon, title, description, actions, className, size = 'md' }: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center text-center',
      size === 'md' ? 'gap-4 py-16 px-6' : 'gap-3 py-10 px-4',
      className
    )}>
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-surface-subdued border border-divider flex items-center justify-center text-ink-tertiary">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <p className={cn('font-semibold text-ink', size === 'md' ? 'text-base' : 'text-sm')}>{title}</p>
        {description && (
          <p className={cn('text-ink-secondary max-w-[320px]', size === 'md' ? 'text-sm' : 'text-badge')}>
            {description}
          </p>
        )}
      </div>
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {actions.map((a) => (
            <Button key={a.label} variant={a.variant ?? 'secondary'} size="sm" onClick={a.onClick}>
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
