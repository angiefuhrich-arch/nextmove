import { Verdict } from '@/types'
import { getVerdictLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ScoreRingProps {
  score: number
  verdict: Verdict
  size?: 'sm' | 'md' | 'lg'
}

export function ScoreRing({ score, verdict, size = 'md' }: ScoreRingProps) {
  const sizes = {
    sm: { ring: 64, stroke: 5, text: 'text-xl', label: 'text-xs' },
    md: { ring: 96, stroke: 7, text: 'text-3xl', label: 'text-xs' },
    lg: { ring: 128, stroke: 8, text: 'text-4xl', label: 'text-sm' },
  }

  const s = sizes[size]
  const radius = (s.ring - s.stroke * 2) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference

  const colors: Record<Verdict, string> = {
    strong: '#16a34a',
    caution: '#ca8a04',
    'no-go': '#dc2626',
  }

  const color = colors[verdict]

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: s.ring, height: s.ring }}>
        <svg width={s.ring} height={s.ring} className="-rotate-90">
          <circle
            cx={s.ring / 2} cy={s.ring / 2} r={radius}
            fill="none" stroke="#e2e8f0" strokeWidth={s.stroke}
          />
          <circle
            cx={s.ring / 2} cy={s.ring / 2} r={radius}
            fill="none" stroke={color} strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold text-slate-900', s.text)}>{score}</span>
        </div>
      </div>
      <span className={cn('font-semibold', s.label)} style={{ color }}>
        {getVerdictLabel(verdict)}
      </span>
    </div>
  )
}
