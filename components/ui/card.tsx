import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding
  hover?: boolean
}

function Card({ className, padding = 'none', hover = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface-elevated border border-divider rounded-2xl shadow-md',
        hover && 'transition-all duration-base ease-default hover:shadow-lg hover:-translate-y-0.5 hover:border-brand-muted cursor-pointer',
        paddingClasses[padding],
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 p-6', className)} {...props} />
}

function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold text-ink leading-snug', className)} {...props} />
}

function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-ink-secondary', className)} {...props} />
}

function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}

function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
