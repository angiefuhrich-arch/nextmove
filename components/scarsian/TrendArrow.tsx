import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface TrendArrowProps {
  direction: 'up' | 'down' | 'flat'
  value?: string
  size?: number
}

export function TrendArrow({ direction, value, size = 14 }: TrendArrowProps) {
  if (direction === 'up') {
    return (
      <span className="inline-flex items-center gap-1 text-verdict-green text-xs font-medium">
        <TrendingUp size={size} />
        {value}
      </span>
    )
  }
  if (direction === 'down') {
    return (
      <span className="inline-flex items-center gap-1 text-verdict-red text-xs font-medium">
        <TrendingDown size={size} />
        {value}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-white/40 text-xs font-medium">
      <Minus size={size} />
      {value}
    </span>
  )
}
