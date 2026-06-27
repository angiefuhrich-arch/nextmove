'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Zap, CheckCircle } from 'lucide-react'
import { Footer } from '@/components/scarsian/Footer'

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
    <div className="min-h-screen pt-16">
      <div className="max-w-[900px] mx-auto px-6 py-12">

        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="scarsian-card p-8 mb-10 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(59,91,255,0.15) 0%, transparent 60%)' }} />
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-blue" />
              <span className="text-xs font-bold uppercase tracking-[2px] text-blue">Career Wallet</span>
            </div>
            <div className="text-6xl font-bold text-white mb-1">{balance}</div>
            <div className="text-sm text-white/50">credits remaining</div>
            <p className="text-xs text-white/35 mt-3">Each credit unlocks one full company intelligence report</p>
          </div>
        </motion.div>

        {/* Packages */}
        <h2 className="text-lg font-bold text-white mb-6">Add Credits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {PACKAGES.map((pkg, i) => (
            <motion.button
              key={pkg.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              onClick={() => setSelected(pkg.id)}
              className={`scarsian-card p-6 text-left transition-all duration-200 relative ${
                selected === pkg.id ? 'border-blue ring-1 ring-blue/30' : 'hover:border-navy-light/80'
              } ${pkg.popular ? 'border-blue/40' : ''}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Most Popular
                </div>
              )}
              <div className="mb-4">
                <div className="text-sm font-bold text-white mb-1">{pkg.name}</div>
                <div className="text-xs text-white/40">{pkg.credits} credits · {pkg.validity}</div>
              </div>
              <div className="mb-5">
                <span className="text-3xl font-bold text-white">{pkg.currency} {pkg.price}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {pkg.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-white/60">
                    <CheckCircle className="w-3.5 h-3.5 text-verdict-green flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </motion.button>
          ))}
        </div>

        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-12 flex justify-center"
          >
            <button className="flex items-center gap-2.5 px-8 py-4 bg-blue hover:bg-blue-hover text-white font-semibold rounded-xl text-base transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Zap className="w-5 h-5" />
              Purchase {PACKAGES.find(p => p.id === selected)?.name}
            </button>
          </motion.div>
        )}

        {/* Transaction history */}
        <h2 className="text-lg font-bold text-white mb-4">Transaction History</h2>
        <div className="scarsian-card divide-y divide-navy-light">
          {TRANSACTIONS.map(tx => (
            <div key={tx.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <div className="text-sm text-white">{tx.description}</div>
                <div className="text-[11px] text-white/40">{tx.date}</div>
              </div>
              <div className={`text-sm font-bold ${tx.amount > 0 ? 'text-verdict-green' : 'text-white/60'}`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount} credits
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}
