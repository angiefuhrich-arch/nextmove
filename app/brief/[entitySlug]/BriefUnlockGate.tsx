'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Zap, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  entitySlug: string
  entityName: string
  creditsBalance: number
  isAuthenticated: boolean
}

export function BriefUnlockGate({ entitySlug, entityName, creditsBalance, isAuthenticated }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUnlock = async () => {
    if (!isAuthenticated) {
      router.push(`/login?next=/brief/${entitySlug}`)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/briefs/${entitySlug}/unlock`, { method: 'POST' })
      if (res.ok) {
        router.refresh()
      } else if (res.status === 402) {
        setError('insufficient_credits')
      } else {
        setError('unknown')
      }
    } catch {
      setError('unknown')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 py-20 px-6">
      <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-divider flex items-center justify-center">
        <Lock className="w-6 h-6 text-ink-tertiary" />
      </div>

      <div className="text-center max-w-sm">
        <h2 className="text-title-sm text-ink font-bold mb-2">Intelligence Brief Locked</h2>
        <p className="text-body-sm text-ink-tertiary">
          Unlock the full Intelligence Brief for <span className="font-semibold text-ink">{entityName}</span> — including scores, signals, key findings, and evidence.
        </p>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated border border-divider text-body-sm text-ink-secondary">
        <Zap className="w-4 h-4 text-brand" />
        1 credit per brief · {isAuthenticated ? `${creditsBalance} credit${creditsBalance !== 1 ? 's' : ''} remaining` : 'Sign in to view balance'}
      </div>

      {error === 'insufficient_credits' && (
        <div className="text-body-sm text-status-error text-center">
          You&apos;re out of credits.{' '}
          <a href="/wallet" className="underline text-brand">Top up your Career Wallet</a>
          {' '}to continue.
        </div>
      )}
      {error === 'unknown' && (
        <p className="text-body-sm text-status-error text-center">Something went wrong. Please try again.</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {isAuthenticated ? (
          <button
            onClick={handleUnlock}
            disabled={loading}
            className={cn(
              'flex items-center gap-2 h-10 px-5 rounded-xl text-body-sm font-semibold transition-colors duration-fast',
              'bg-brand text-white hover:bg-brand/90 disabled:opacity-60'
            )}
          >
            {loading ? 'Unlocking…' : 'Unlock Brief — 1 Credit'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        ) : (
          <button
            onClick={handleUnlock}
            className="flex items-center gap-2 h-10 px-5 rounded-xl text-body-sm font-semibold bg-brand text-white hover:bg-brand/90 transition-colors duration-fast"
          >
            Sign in to Unlock
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
        <a
          href="/wallet"
          className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-body-sm font-semibold border border-divider text-ink-secondary hover:text-ink hover:border-brand/30 transition-colors duration-fast"
        >
          Get Credits
        </a>
      </div>
    </div>
  )
}
