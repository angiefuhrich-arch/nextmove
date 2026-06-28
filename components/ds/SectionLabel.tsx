import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface SectionLabelProps {
  icon: LucideIcon
  label: string
  badge?: string
  className?: string
}

export function SectionLabel({ icon: Icon, label, badge, className }: SectionLabelProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-brand" />
        <span className="text-label font-bold uppercase tracking-widest text-brand">{label}</span>
      </div>
      {badge && (
        <span className="text-caption text-ink-quaternary">{badge}</span>
      )}
    </div>
  )
}
