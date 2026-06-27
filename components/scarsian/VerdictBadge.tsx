// Supports both the UI verdict type (strong-move/consider/high-risk) and
// the internal API type (strong/caution/no-go).
type Verdict = 'strong-move' | 'consider' | 'high-risk' | 'strong' | 'caution' | 'no-go'

interface VerdictBadgeProps {
  verdict: Verdict
  size?: 'sm' | 'md' | 'lg'
}

const verdictConfig: Record<Verdict, { label: string; className: string }> = {
  'strong-move': { label: 'Strong Move',        className: 'badge-strong-move' },
  'consider':    { label: 'Consider Carefully', className: 'badge-consider' },
  'high-risk':   { label: 'High Risk',          className: 'badge-high-risk' },
  'strong':  { label: 'Strong Move',        className: 'badge-strong-move' },
  'caution': { label: 'Consider Carefully', className: 'badge-consider' },
  'no-go':   { label: 'High Risk',          className: 'badge-high-risk' },
}

const sizeClasses = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-5 py-2 text-sm',
  lg: 'px-6 py-2.5 text-sm',
}

export function VerdictBadge({ verdict, size = 'md' }: VerdictBadgeProps) {
  const config = verdictConfig[verdict]
  return (
    <span className={`inline-flex items-center rounded-full font-bold uppercase tracking-[1px] ${config.className} ${sizeClasses[size]}`}>
      {config.label}
    </span>
  )
}
