import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface HeroBannerProps {
  label?: string
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  className?: string
  fullHeight?: boolean
  ambient?: boolean
}

export function HeroBanner({
  label,
  title,
  subtitle,
  actions,
  footer,
  className,
  fullHeight = false,
  ambient = true,
}: HeroBannerProps) {
  return (
    <section className={cn(
      'relative flex flex-col items-center justify-center text-center px-6 bg-surface overflow-hidden',
      fullHeight ? 'min-h-svh py-24' : 'py-24 md:py-32',
      className
    )}>
      {ambient && <div className="ambient-orbs" />}

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-[760px]">
        {label && (
          <p className="text-label font-semibold tracking-caps uppercase text-brand animate-fade-in">
            {label}
          </p>
        )}
        <div className="text-4xl md:text-6xl font-bold text-ink leading-[1.06] tracking-tight animate-slide-up">
          {title}
        </div>
        {subtitle && (
          <p className="text-base md:text-lg text-ink-secondary leading-relaxed max-w-[520px] animate-slide-up [animation-delay:60ms]">
            {subtitle}
          </p>
        )}
        {actions && (
          <div className="flex items-center gap-3 flex-wrap justify-center animate-slide-up [animation-delay:120ms]">
            {actions}
          </div>
        )}
      </div>

      {footer && (
        <div className="relative z-10 mt-12 animate-fade-in [animation-delay:300ms]">
          {footer}
        </div>
      )}
    </section>
  )
}
