'use client'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'standard' | 'hero'  // standard=56px, hero=64px
  onClear?: () => void
  loading?: boolean
  shortcut?: string
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, variant = 'standard', onClear, loading, shortcut, value, ...props }, ref) => {
    const isHero = variant === 'hero'

    return (
      <div className="relative w-full">
        <span className={cn(
          'absolute top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none',
          isHero ? 'left-5' : 'left-4'
        )}>
          {loading
            ? <span className="block w-5 h-5 border-2 border-divider border-t-brand rounded-full animate-spin" />
            : <Search size={isHero ? 20 : 18} />
          }
        </span>

        <input
          ref={ref}
          value={value}
          className={cn(
            'w-full rounded-xl border border-divider bg-surface-elevated text-ink',
            'placeholder:text-ink-quaternary text-body-lg',
            'shadow-sm',
            'focus:outline-none focus:border-brand focus:shadow-md',
            'focus:ring-2 focus:ring-border-focus/20',
            'transition-all duration-base ease-default',
            isHero ? 'h-16 pl-14 pr-5' : 'h-14 pl-12 pr-4',
            (value && onClear) && (isHero ? 'pr-14' : 'pr-12'),
            className
          )}
          {...props}
        />

        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 text-ink-quaternary hover:text-ink-tertiary transition-colors duration-fast',
              isHero ? 'right-5' : 'right-4'
            )}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}

        {shortcut && !value && (
          <div className={cn(
            'absolute top-1/2 -translate-y-1/2 pointer-events-none',
            'flex items-center gap-0.5 text-caption text-ink-quaternary',
            'border border-divider rounded-md px-1.5 py-0.5',
            isHero ? 'right-5' : 'right-4'
          )}>
            {shortcut}
          </div>
        )}
      </div>
    )
  }
)
SearchInput.displayName = 'SearchInput'

export { SearchInput }
