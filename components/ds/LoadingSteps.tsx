'use client'
import { cn } from '@/lib/utils'
import { Check, AlertCircle } from 'lucide-react'

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
          {title && <p className="text-label uppercase tracking-[0.08em] text-brand">{title}</p>}
          {description && <p className="text-body-sm text-ink-secondary">{description}</p>}
        </div>
      )}

      <div className="w-full max-w-sm flex flex-col">
        {steps.map((step, i) => (
          <StepRow key={i} step={step} index={i + 1} isLast={i === steps.length - 1} />
        ))}
      </div>
    </div>
  )
}

function StepRow({ step, index, isLast }: { step: LoadingStep; index: number; isLast: boolean }) {
  const isActive  = step.state === 'active'
  const isDone    = step.state === 'done'
  const isError   = step.state === 'error'
  const isPending = step.state === 'pending'

  return (
    <div className="flex gap-3">
      {/* Spine column */}
      <div className="flex flex-col items-center">
        {/* 34px circle per DS spec */}
        <div className={cn(
          'w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 text-caption font-bold transition-all duration-base',
          isActive  && 'bg-brand/10 border border-brand/30 text-brand',
          isDone    && 'bg-brand text-white',
          isError   && 'bg-status-danger/10 border border-status-danger/30 text-status-danger',
          isPending && 'bg-surface-subdued border border-divider text-ink-quaternary',
        )}>
          {isDone    && <Check size={16} strokeWidth={2.5} />}
          {isError   && <AlertCircle size={16} />}
          {(isActive || isPending) && index}
        </div>
        {!isLast && <span className="w-px flex-1 bg-divider my-1" />}
      </div>

      {/* Content */}
      <div className={cn('flex-1 min-w-0 pb-4', isLast && 'pb-0', 'flex items-center gap-3')}>
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-body-sm font-medium',
            isActive  && 'text-brand',
            isDone    && 'text-ink-tertiary',
            isError   && 'text-status-danger',
            isPending && 'text-ink-quaternary',
          )}>
            {step.label}
          </p>
          {step.sublabel && (
            <p className="text-caption text-ink-quaternary truncate">{step.sublabel}</p>
          )}
        </div>

        {isActive && (
          <div className="flex gap-0.5 shrink-0">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-brand animate-pipeline-dot"
                style={{ animationDelay: `${i * 0.16}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
