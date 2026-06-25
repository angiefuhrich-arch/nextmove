import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'green' | 'yellow' | 'red' | 'outline'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-slate-100 text-slate-800': variant === 'default',
          'bg-green-100 text-green-800': variant === 'green',
          'bg-yellow-100 text-yellow-800': variant === 'yellow',
          'bg-red-100 text-red-800': variant === 'red',
          'border border-slate-200 text-slate-700': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
