'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'brand' | 'link'
export type ButtonSize    = 'xs' | 'sm' | 'md' | 'lg' | 'icon'

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-brand text-white hover:bg-brand-hover shadow-brand active:scale-[0.98]',
  secondary: 'bg-surface-subdued text-ink border border-divider hover:bg-divider/60 active:scale-[0.98]',
  outline:   'bg-transparent text-ink border border-divider hover:border-ink-quaternary hover:bg-surface-subdued active:scale-[0.98]',
  ghost:     'bg-transparent text-ink-secondary hover:bg-surface-subdued hover:text-ink active:scale-[0.98]',
  danger:    'bg-status-danger text-white hover:bg-red-600 active:scale-[0.98]',
  brand:     'bg-brand-light text-brand border border-brand/20 hover:bg-brand/10 active:scale-[0.98]',
  link:      'bg-transparent text-brand underline-offset-4 hover:underline p-0 h-auto rounded-none shadow-none',
}

const sizeClasses: Record<ButtonSize, string> = {
  xs:   'text-badge px-3 py-1 h-7 gap-1',
  sm:   'text-sm px-4 py-1.5 h-8 gap-1.5',
  md:   'text-sm px-5 py-2 h-9 gap-2',
  lg:   'text-base px-6 py-2.5 h-11 gap-2',
  icon: 'h-9 w-9 p-0 gap-0',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap font-medium rounded-full',
          'transition-all duration-base ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-40 select-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
