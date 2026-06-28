import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      className={cn(
        'flex h-10 w-full rounded-xl border border-divider bg-surface-elevated px-4 py-2 text-sm text-ink',
        'placeholder:text-ink-quaternary',
        'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-base',
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export { Input }
