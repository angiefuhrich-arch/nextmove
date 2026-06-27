type Verdict = 'strong' | 'caution' | 'no-go'

interface VerdictBadgeProps {
  verdict: Verdict
  size?: 'sm' | 'md' | 'lg'
}

const verdictConfig: Record<Verdict, { label: string; className: string }> = {
  strong:  { label: 'Strong Move',  className: 'badge-strong-move' },
  caution: { label: 'Think Twice',  className: 'badge-consider' },
  'no-go': { label: 'High Risk',    className: 'badge-high-risk' },
}

const sizeClasses = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-5 py-2 text-sm',
  lg: 'px-6 py-2.5 text-sm',
}

export function VerdictBadge({ verdict, size = 'md' }: VerdictBadgeProps) {
  const config = verdictConfig[verdict]
  return (
    <span className={`inline-flex items-center ${config.className} ${sizeClasses[size]}`}>
      {config.label}
    </span>
  )
}
