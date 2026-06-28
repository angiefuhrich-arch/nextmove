'use client'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef, useState } from 'react'

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg'
  onClear?: () => void
  loading?: boolean
  shortcut?: string
}

const sizeClasses = {
  sm: 'h-9 text-sm pl-9 pr-4',
  md: 'h-11 text-base pl-11 pr-4',
  lg: 'h-14 text-lg pl-14 pr-5',
}
const iconSizes = { sm: 14, md: 16, lg: 20 }
const iconPositions = { sm: 'left-2.5', md: 'left-3', lg: 'left-4' }

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, size = 'md', onClear, loading, shortcut, value, ...props }, ref) => {
    const iconSize = iconSizes[size]
    const iconPos  = iconPositions[size]

    return (
      <div className="relative w-full">
        <span className={cn('absolute top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none', iconPos)}>
          {loading
            ? <span className="block w-4 h-4 border-2 border-ink-quaternary border-t-brand rounded-full animate-spin" />
            : <Search size={iconSize} />
          }
        </span>

        <input
          ref={ref}
          value={value}
          className={cn(
            'w-full rounded-full border border-divider bg-surface-elevated text-ink placeholder:text-ink-quaternary',
            'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50',
            'transition-all duration-base',
            sizeClasses[size],
            (value && onClear) && 'pr-10',
            className
          )}
          {...props}
        />

        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-quaternary hover:text-ink-tertiary transition-colors"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}

        {shortcut && !value && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-micro text-ink-quaternary border border-divider rounded px-1.5 py-0.5 pointer-events-none">
            {shortcut}
          </div>
        )}
      </div>
    )
  }
)
SearchInput.displayName = 'SearchInput'

export { SearchInput }
