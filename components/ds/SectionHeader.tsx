import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface SectionHeaderProps {
  label?: string
  title: ReactNode
  subtitle?: ReactNode
  align?: 'left' | 'center'
  className?: string
  as?: 'h1' | 'h2' | 'h3'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const headingClasses = {
  sm: 'text-xl md:text-2xl font-bold text-ink',
  md: 'text-2xl md:text-3xl font-bold text-ink',
  lg: 'text-3xl md:text-4xl font-bold text-ink leading-tight',
  xl: 'text-4xl md:text-5xl font-bold text-ink leading-tight tracking-tight',
}

export function SectionHeader({
  label,
  title,
  subtitle,
  align = 'center',
  className,
  as: Tag = 'h2',
  size = 'lg',
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3', align === 'center' && 'items-center text-center', className)}>
      {label && (
        <p className="text-label font-semibold tracking-caps uppercase text-brand">
          {label}
        </p>
      )}
      <Tag className={headingClasses[size]}>{title}</Tag>
      {subtitle && (
        <p className={cn('text-sm md:text-base text-ink-secondary leading-relaxed', align === 'center' && 'max-w-[560px]')}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
