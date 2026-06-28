import { CategoryScore as CategoryScoreType } from '@/types'
import { Progress, ProgressColor } from '@/components/ui/progress'
import { Badge, BadgeVariant } from '@/components/ui/badge'

interface CategoryScoreProps {
  category: CategoryScoreType
}

const statusMap: Record<string, { badge: BadgeVariant; bar: ProgressColor }> = {
  green:  { badge: 'success', bar: 'success' },
  yellow: { badge: 'warning', bar: 'warning' },
  red:    { badge: 'danger',  bar: 'danger'  },
}

export function CategoryScoreCard({ category }: CategoryScoreProps) {
  const colors = statusMap[category.status] ?? { badge: 'neutral', bar: 'brand' }
  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl border border-divider bg-surface-elevated">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink">{category.category}</span>
        <Badge variant={colors.badge}>{category.score}/100</Badge>
      </div>
      <Progress value={category.score} color={colors.bar} />
      <p className="text-badge text-ink-tertiary leading-relaxed">{category.explanation}</p>
    </div>
  )
}
