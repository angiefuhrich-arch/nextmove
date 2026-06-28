'use client'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

export interface TimelineItem {
  id: string
  event_type?: string
  title: string
  summary?: string
  event_date?: string | null
  confidence?: number
  category?: string
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

// DS category color map (page 3)
const CATEGORY_COLORS: Record<string, { dot: string; badge: string; bg: string }> = {
  financial:   { dot: '#10B981', badge: 'text-[#10B981]', bg: 'bg-[#ECFDF5]' },
  leadership:  { dot: '#3B82F6', badge: 'text-[#3B82F6]', bg: 'bg-[#EFF6FF]' },
  layoffs:     { dot: '#EF4444', badge: 'text-[#EF4444]', bg: 'bg-[#FEF2F2]' },
  hiring:      { dot: '#8B5CF6', badge: 'text-[#8B5CF6]', bg: 'bg-[#F5F3FF]' },
  legal:       { dot: '#F97316', badge: 'text-[#F97316]', bg: 'bg-[#FFF7ED]' },
  awards:      { dot: '#F59E0B', badge: 'text-[#F59E0B]', bg: 'bg-[#FFFBEB]' },
  growth:      { dot: '#06B6D4', badge: 'text-[#06B6D4]', bg: 'bg-[#ECFEFF]' },
  culture:     { dot: '#EC4899', badge: 'text-[#EC4899]', bg: 'bg-[#FDF2F8]' },
  leadership_change: { dot: '#3B82F6', badge: 'text-[#3B82F6]', bg: 'bg-[#EFF6FF]' },
}

function getCategory(item: TimelineItem): string {
  const raw = item.category ?? item.event_type ?? ''
  return raw.toLowerCase().replace(/[_\s]+/g, '_')
}

function formatCategory(raw: string): string {
  return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn('relative', className)}>
      {items.map((item, i) => (
        <TimelineRow key={item.id} item={item} isLast={i === items.length - 1} />
      ))}
    </ol>
  )
}

function TimelineRow({ item, isLast }: { item: TimelineItem; isLast: boolean }) {
  const [open, setOpen] = useState(false)
  const cat = getCategory(item)
  const colors = CATEGORY_COLORS[cat] ?? { dot: '#9CA3AF', badge: 'text-ink-tertiary', bg: 'bg-surface-subdued' }

  return (
    <li className="flex gap-0">
      {/* Date column — 48px right-aligned */}
      <div className="w-12 shrink-0 text-right pr-3 pt-[3px]">
        {item.event_date && (
          <span className="text-caption text-ink-tertiary leading-none whitespace-nowrap">
            {formatDate(item.event_date)}
          </span>
        )}
      </div>

      {/* Spine */}
      <div className="flex flex-col items-center w-4 shrink-0">
        <span
          className="w-2 h-2 rounded-full shrink-0 mt-1"
          style={{ backgroundColor: colors.dot }}
        />
        {!isLast && <span className="w-px flex-1 bg-divider-subtle mt-1 mb-0" />}
      </div>

      {/* Content */}
      <div className={cn('flex-1 min-w-0 pl-3 pb-5', isLast && 'pb-0')}>
        <button
          onClick={() => item.summary ? setOpen(o => !o) : undefined}
          className={cn(
            'w-full text-left flex items-start justify-between gap-2',
            item.summary && 'hover:bg-surface-subdued/50 -mx-2 px-2 py-1 rounded-md transition-colors duration-fast cursor-pointer',
            !item.summary && 'cursor-default'
          )}
        >
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-body-sm text-ink-secondary font-normal leading-snug">{item.title}</p>
            {item.category && (
              <span className={cn('inline-flex self-start items-center h-[18px] px-1.5 rounded text-[9px] font-semibold uppercase tracking-wider', colors.badge, colors.bg)}>
                {formatCategory(item.category ?? item.event_type ?? '')}
              </span>
            )}
          </div>
          {item.summary && (
            <ChevronRight
              size={12}
              className={cn('text-ink-quaternary shrink-0 mt-1 transition-transform duration-base', open && 'rotate-90')}
            />
          )}
        </button>

        {open && item.summary && (
          <p
            className="mt-2 text-[11px] text-ink-tertiary leading-relaxed pl-0"
            style={{ borderLeft: `1px solid ${colors.dot}33` }}
          >
            <span className="pl-2 block">{item.summary}</span>
          </p>
        )}
      </div>
    </li>
  )
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  } catch {
    return iso.slice(0, 7)
  }
}
