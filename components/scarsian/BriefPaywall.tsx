'use client'

import { useRouter } from 'next/navigation'
import { Lock, Shield } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BriefPaywallProps {
  open: boolean
  onClose: () => void
  onUnlock: () => void
  companyName: string
  sourceCount?: number
  confidence?: number
  credits?: number
  isUnlocking?: boolean
}

export function BriefPaywall({
  open,
  onClose,
  onUnlock,
  companyName,
  sourceCount = 6,
  confidence = 85,
  credits = 0,
  isUnlocking = false,
}: BriefPaywallProps) {
  const router = useRouter()
  const hasCredits = credits > 0

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center gap-5">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-brand-light flex items-center justify-center">
          <Lock className="w-8 h-8 text-brand" />
        </div>

        {/* Title + description */}
        <div className="flex flex-col gap-2">
          <h2 className="text-title-md font-semibold text-ink">
            Unlock This Intelligence Brief™
          </h2>
          <p className="text-body-sm text-ink-secondary max-w-[320px]">
            This Brief for <span className="font-semibold text-ink">{companyName}</span> contains verified
            evidence across {sourceCount} sources with {confidence}% confidence.
          </p>
        </div>

        {/* Cost badge */}
        <span className="inline-flex items-center h-6 px-3 rounded-full text-badge font-semibold bg-brand-light text-brand border border-brand/20">
          Cost: 1 credit
        </span>

        {/* CTAs */}
        <div className="w-full flex flex-col gap-2.5">
          <Button
            className={cn('w-full h-11', !hasCredits && 'opacity-40 cursor-not-allowed')}
            disabled={!hasCredits || isUnlocking}
            onClick={hasCredits ? onUnlock : undefined}
          >
            {isUnlocking ? 'Unlocking…' : 'Unlock with 1 Credit'}
          </Button>
          <Button
            variant="secondary"
            className={cn('w-full h-11', !hasCredits && 'animate-pulse')}
            onClick={() => { onClose(); router.push('/wallet') }}
          >
            Buy More Credits
          </Button>
        </div>

        {/* Trust note */}
        <div className="flex items-start gap-1.5">
          <Shield className="w-3.5 h-3.5 text-ink-quaternary flex-shrink-0 mt-0.5" />
          <p className="text-caption text-ink-quaternary text-left">
            Credits never expire. No charge if evidence is insufficient.
          </p>
        </div>
      </div>
    </Modal>
  )
}
