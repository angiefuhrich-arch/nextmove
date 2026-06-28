'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'brand' | 'link' | 'outline'
export type ButtonSize    = 'sm' | 'md' | 'lg' | 'xs' | 'icon'

const variantClasses: Record<ButtonVariant, string> = {
  // DS canonical variants
  primary:   'bg-brand text-white hover:bg-brand-hover active:scale-[0.98]',
  secondary: 'bg-surface-elevated text-ink-secondary border border-divider hover:bg-surface-subdued active:scale-[0.98]',
  ghost:     'bg-transparent text-ink-tertiary hover:bg-surface-subdued hover:text-ink-secondary active:scale-[0.98]',
  danger:    'bg-status-danger text-white hover:bg-red-600 active:scale-[0.98]',
  // Extended variants
  brand:     'bg-brand-light text-brand border border-brand/20 hover:bg-brand/10 active:scale-[0.98]',
  outline:   'bg-transparent text-ink border border-divider hover:border-ink-quaternary hover:bg-surface-subdued active:scale-[0.98]',
  link:      'bg-transparent text-brand underline-offset-4 hover:underline p-0 h-auto rounded-none',
}

// DS Button sizes: Small=32px/radius-md, Medium=40px/radius-lg, Large=48px/radius-xl
const sizeClasses: Record<ButtonSize, string> = {
  xs:   'h-7  px-3  text-button-sm rounded-sm gap-1',
  sm:   'h-8  px-4  text-button-sm rounded-md  gap-1.5',
  md:   'h-10 px-5  text-button    rounded-lg  gap-2',
  lg:   'h-12 px-7  text-button    rounded-xl  gap-2',
  icon: 'h-10 w-10 rounded-lg p-0 gap-0',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap font-semibold select-none',
          'transition-all duration-fast ease-default',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-40',
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
