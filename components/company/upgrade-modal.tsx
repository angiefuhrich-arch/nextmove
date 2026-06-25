'use client'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Zap, Lock } from 'lucide-react'
import Link from 'next/link'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  reason?: string
}

export function UpgradeModal({ open, onClose, reason }: UpgradeModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mx-auto">
          <Lock size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Upgrade to Pro</h2>
          <p className="text-slate-500 mt-1 text-sm">
            {reason || "You've reached your free plan limit of 3 reports per month."}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 text-left space-y-2">
          {[
            'Unlimited company reports',
            'Full AI analysis & insights',
            'Compare companies side by side',
            'Watchlist & offer decision assistant',
            'Downloadable PDF reports',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm text-slate-700">
              <Zap size={14} className="text-green-500 shrink-0" />
              {feature}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Maybe later</Button>
          <Link href="/pricing" className="flex-1">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
              Upgrade — $12/mo
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  )
}
