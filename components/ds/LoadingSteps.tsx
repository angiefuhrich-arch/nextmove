'use client'
import { cn } from '@/lib/utils'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export interface LoadingStep {
  label: string
  sublabel?: string
  state: 'pending' | 'active' | 'done' | 'error'
}

interface LoadingStepsProps {
  steps: LoadingStep[]
  title?: string
  description?: string
  className?: string
}

export function LoadingSteps({ steps, title, description, className }: LoadingStepsProps) {
  return (
    <div className={cn('flex flex-col items-center gap-6', className)}>
      {(title || description) && (
        <div className="text-center flex flex-col gap-1">
          {title && <p className="text-label font-semibold tracking-caps uppercase text-brand">{title}</p>}
          {description && <p className="text-sm text-ink-secondary">{description}</p>}
        </div>
      )}

      <div className="w-full max-w-sm flex flex-col gap-1">
        {steps.map((step, i) => (
          <LoadingStepRow key={i} step={step} index={i + 1} />
        ))}
      </div>
    </div>
  )
}

function LoadingStepRow({ step, index }: { step: LoadingStep; index: number }) {
  const isActive  = step.state === 'active'
  const isDone    = step.state === 'done'
  const isError   = step.state === 'error'
  const isPending = step.state === 'pending'

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-base',
      isActive  && 'bg-brand-light',
      isDone    && 'opacity-60',
      isPending && 'opacity-40',
    )}>
      {/* Number circle / status icon */}
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-micro font-bold',
        isActive  && 'bg-brand text-white',
        isDone    && 'bg-transparent text-status-success',
        isError   && 'bg-transparent text-status-danger',
        isPending && 'bg-surface-subdued border border-divider text-ink-quaternary',
      )}>
        {isDone  && <CheckCircle2 size={16} />}
        {isError && <AlertCircle  size={16} />}
        {(isActive || isPending) && index}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', isActive ? 'text-brand' : 'text-ink-secondary')}>
          {step.label}
        </p>
        {step.sublabel && (
          <p className="text-badge text-ink-tertiary truncate">{step.sublabel}</p>
        )}
      </div>

      {/* Active dots */}
      {isActive && (
        <div className="pipeline-active flex gap-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand" />
          <span className="w-1.5 h-1.5 rounded-full bg-brand" />
          <span className="w-1.5 h-1.5 rounded-full bg-brand" />
        </div>
      )}
    </div>
  )
}
