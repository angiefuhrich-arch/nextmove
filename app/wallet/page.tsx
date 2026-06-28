'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Zap, CheckCircle } from 'lucide-react'
import { Footer } from '@/components/scarsian/Footer'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const PACKAGES = [
  {
    id: 'career-pass',
    name: 'Career Pass',
    credits: 10,
    price: 228,
    currency: 'HKD',
    validity: '90 days',
    features: ['10 full company reports', 'AI analyst summaries', 'Signal intelligence feed', 'Export + share reports', 'GFI global scores'],
    popular: true,
  },
  {
    id: 'single',
    name: 'Single Report',
    credits: 1,
    price: 38,
    currency: 'HKD',
    validity: 'No expiry',
    features: ['1 full company report', 'AI analyst summary', 'Signal intelligence feed'],
    popular: false,
  },
  {
    id: 'research',
    name: 'Research Bundle',
    credits: 30,
    price: 588,
    currency: 'HKD',
    validity: '180 days',
    features: ['30 full company reports', 'AI analyst summaries', 'Signal intelligence feed', 'Export + share reports', 'GFI global scores', 'Priority data refresh'],
    popular: false,
  },
]

const TRANSACTIONS = [
  { id: '1', date: 'Today', type: 'credit', description: 'Free signup credits', amount: +3 },
]

export default function WalletPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const balance = 3

  return (
    <div className="min-h-screen bg-surface pt-14">
      <div className="max-w-[900px] mx-auto px-6 py-12">

        {/* Balance card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card padding="lg" className="mb-10 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-brand" />
              <span className="text-label font-bold uppercase tracking-[2px] text-brand">Career Wallet</span>
            </div>
            <div className="text-metric-lg text-ink font-bold mb-1">{balance}</div>
            <p className="text-body-sm text-ink-tertiary">credits remaining</p>
            <p className="text-caption text-ink-quaternary mt-3">Each credit unlocks one full company intelligence report</p>
          </Card>
        </motion.div>

        {/* Packages */}
        <h2 className="text-title-sm text-ink font-semibold mb-6">Add Credits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {PACKAGES.map((pkg, i) => (
            <motion.button
              key={pkg.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              onClick={() => setSelected(pkg.id)}
              className={cn(
                'relative bg-surface-elevated border rounded-2xl p-6 text-left transition-all duration-base ease-default shadow-md',
                selected === pkg.id
                  ? 'border-brand ring-2 ring-brand/20 shadow-lg'
                  : pkg.popular
                  ? 'border-brand/30 hover:border-brand/50'
                  : 'border-divider hover:border-brand/30 hover:shadow-lg'
              )}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand text-white text-label font-bold uppercase tracking-wider rounded-full">
                  Most Popular
                </div>
              )}
              <div className="mb-4">
                <p className="text-body-sm font-bold text-ink mb-1">{pkg.name}</p>
                <p className="text-caption text-ink-tertiary">{pkg.credits} credits · {pkg.validity}</p>
              </div>
              <div className="mb-5">
                <span className="text-metric-sm text-ink font-bold">{pkg.currency} {pkg.price}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {pkg.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-caption text-ink-secondary">
                    <CheckCircle className="w-3.5 h-3.5 text-status-success flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </motion.button>
          ))}
        </div>

        {selected && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12 flex justify-center">
            <button
              className="flex items-center gap-2.5 h-12 px-7 bg-brand hover:bg-brand-hover text-white font-semibold rounded-xl text-button transition-colors duration-fast"
              onClick={() => {
                setTimeout(() => setSelected(null), 2500)
              }}
            >
              <Zap className="w-5 h-5" />
              Purchase {PACKAGES.find(p => p.id === selected)?.name}
            </button>
          </motion.div>
        )}

        {/* Transaction history */}
        <h2 className="text-title-sm text-ink font-semibold mb-4">Transaction History</h2>
        <Card>
          {TRANSACTIONS.map((tx, i) => (
            <div
              key={tx.id}
              className={cn('flex items-center justify-between px-6 py-4', i > 0 && 'border-t border-divider')}
            >
              <div>
                <p className="text-body-sm text-ink">{tx.description}</p>
                <p className="text-caption text-ink-tertiary">{tx.date}</p>
              </div>
              <span className={cn('text-body-sm font-bold', tx.amount > 0 ? 'text-status-success' : 'text-ink-secondary')}>
                {tx.amount > 0 ? '+' : ''}{tx.amount} credits
              </span>
            </div>
          ))}
        </Card>
      </div>
      <Footer />
    </div>
  )
}
