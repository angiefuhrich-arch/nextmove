import { CategoryScore as CategoryScoreType } from '@/types'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface CategoryScoreProps {
  category: CategoryScoreType
}

export function CategoryScoreCard({ category }: CategoryScoreProps) {
  return (
    <div className="space-y-2 p-4 rounded-lg border border-slate-100 bg-white">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{category.category}</span>
        <div className="flex items-center gap-2">
          <Badge variant={category.status}>{category.score}/100</Badge>
        </div>
      </div>
      <Progress value={category.score} color={category.status} />
      <p className="text-xs text-slate-500 leading-relaxed">{category.explanation}</p>
    </div>
  )
}
