import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  className?: string
  color?: 'green' | 'yellow' | 'red' | 'blue'
}

function Progress({ value, className, color = 'blue' }: ProgressProps) {
  const colorClass = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    blue: 'bg-slate-900',
  }[color]

  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div
        className={cn('h-full rounded-full transition-all', colorClass)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export { Progress }
