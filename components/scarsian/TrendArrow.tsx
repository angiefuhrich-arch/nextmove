import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { Trend } from '@/lib/types/ui'

interface TrendArrowProps {
  trend: Trend
  showLabel?: boolean
}

export function TrendArrow({ trend, showLabel = true }: TrendArrowProps) {
  if (trend.direction === 'up') {
    return (
      <div className="flex items-center gap-1 text-verdict-green">
        <TrendingUp className="w-4 h-4" />
        <span className="text-xs font-semibold">{trend.value}</span>
        {showLabel && <span className="text-xs text-white/50 ml-1">this quarter</span>}
      </div>
    )
  }
  if (trend.direction === 'down') {
    return (
      <div className="flex items-center gap-1 text-verdict-red">
        <TrendingDown className="w-4 h-4" />
        <span className="text-xs font-semibold">{trend.value}</span>
        {showLabel && <span className="text-xs text-white/50 ml-1">this quarter</span>}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 text-white/40">
      <Minus className="w-4 h-4" />
      <span className="text-xs font-semibold">{trend.value}</span>
      {showLabel && <span className="text-xs text-white/50 ml-1">no change</span>}
    </div>
  )
}
