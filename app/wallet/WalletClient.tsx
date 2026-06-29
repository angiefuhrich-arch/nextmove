'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Briefcase, Check, CreditCard, CheckCircle, XCircle,
  ChevronRight, ChevronLeft, Clock, FileText,
  Bookmark, Sparkles, Shield, AlertTriangle,
  Lock, Unlock, History, Loader2,
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

const creditPackages = [
  { id: 'starter', name: 'Starter', credits: 3, price: 29, perCredit: '$9.67 per credit',
    features: ['3 full Intelligence Briefs', 'Credits never expire', 'All 5 dimensions'], popular: false, save: null, badge: null },
  { id: 'professional', name: 'Professional', credits: 10, price: 79, perCredit: '$7.90 per credit',
    features: ['10 full Intelligence Briefs', 'Credits never expire', 'All 5 dimensions', 'Priority delivery'], popular: true, save: 'Save 18%', badge: 'Most Popular' },
  { id: 'enterprise', name: 'Enterprise', credits: 30, price: 199, perCredit: '$6.63 per credit',
    features: ['30 full Intelligence Briefs', 'Credits never expire', 'All 5 dimensions', 'Priority delivery', 'Bulk discount'], popular: false, save: 'Save 31%', badge: 'Best Value' },
]

interface CreditTransaction {
  id: string
  transaction_type: string
  amount: number
  reason: string
  balance_after: number
  created_at: string
}

type WalletView = 'overview' | 'payment' | 'processing' | 'success' | 'failed' | 'history'

export function WalletClient({ initialView }: { initialView: WalletView }) {
  const [credits, setCredits] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [view, setView] = useState<WalletView>(initialView)
  const [txPage, setTxPage] = useState(0)
  const [failedReason, setFailedReason] = useState('')

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const [{ data: profile }, { data: txData }] = await Promise.all([
        supabase.from('profiles').select('credits').eq('id', user.id).single(),
        supabase.from('credit_transactions').select('id,transaction_type,amount,reason,balance_after,created_at')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      ])
      setCredits(profile?.credits ?? 0)
      setTransactions(txData ?? [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const txPerPage = 5
  const totalPages = Math.ceil(transactions.length / txPerPage)
  const paginated = transactions.slice(txPage * txPerPage, (txPage + 1) * txPerPage)
  const pkg = creditPackages.find(p => p.id === selectedPackage)

  const handleSelect = (pkgId: string) => {
    setSelectedPackage(pkgId)
    setView('payment')
  }

  const handlePay = async () => {
    setView('processing')
    try {
      const res = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selectedPackage }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setFailedReason(data.error ?? 'Payment could not be initiated.')
        setView('failed')
      }
    } catch {
      setFailedReason('Network error. Please try again.')
      setView('failed')
    }
  }

  const reset = () => { setView('overview'); setSelectedPackage(null) }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
      </div>
    )
  }

  const usedCredits = transactions.filter(tx => tx.transaction_type === 'debit' || tx.transaction_type === 'unlock').length
  const purchasedCredits = transactions.filter(tx => tx.transaction_type === 'purchase').reduce((sum, tx) => sum + tx.amount, 0)

  return (
    <div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-5 h-5 text-brand" />
            <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-[-1px]">Career Wallet&trade;</h1>
          </div>
          <p className="text-sm text-ink-tertiary">Credits unlock full Intelligence Briefs.</p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { icon: Sparkles, label: 'Credits', value: (credits ?? 0).toString(), sub: 'available' },
            { icon: FileText, label: 'Briefs Unlocked', value: usedCredits.toString(), sub: 'all time' },
            { icon: Clock, label: 'Credits Purchased', value: purchasedCredits.toString(), sub: 'all time' },
            { icon: Bookmark, label: 'Transactions', value: transactions.length.toString(), sub: 'total' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white border border-divider rounded-2xl p-4 shadow-card">
              <s.icon className="w-4 h-4 text-brand mb-2" />
              <div className="text-xl font-bold text-ink">{s.value}</div>
              <div className="text-[11px] text-ink-tertiary">{s.label}</div>
              <div className="text-[10px] text-ink-quaternary">{s.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Unlock promo */}
        {view === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-brand-light border border-brand/15 rounded-2xl p-5 flex items-start gap-4 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-brand" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-ink mb-1">Unlock full Intelligence Briefs</h3>
              <p className="text-[11px] text-ink-tertiary leading-relaxed mb-3">
                Each Brief costs 1 credit. No subscription required. Credits never expire.
                If we cannot produce a Brief due to insufficient evidence, you are not charged.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-ink-quaternary">
                <Shield className="w-3 h-3" />
                <span>No charge for insufficient evidence</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Overview */}
        {view === 'overview' && (
          <>
            <div className="mb-10">
              <h2 className="text-base font-semibold text-ink mb-4">Add Credits</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {creditPackages.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`bg-white border rounded-2xl p-5 flex flex-col gap-2.5 ${p.popular ? 'border-brand/40 shadow-elevated' : 'border-divider shadow-card'}`}>
                    {p.popular && (
                      <span className="self-start px-2.5 py-0.5 bg-brand text-white text-[9px] font-bold uppercase rounded-full">Most Popular</span>
                    )}
                    {p.badge === 'Best Value' && (
                      <span className="self-start px-2.5 py-0.5 bg-emerald-500 text-white text-[9px] font-bold uppercase rounded-full">Best Value</span>
                    )}
                    <h3 className="text-sm font-semibold text-ink">{p.name}</h3>
                    <div className="text-2xl font-bold text-ink">{p.credits} <span className="text-xs font-normal text-ink-tertiary">credits</span></div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-brand">${p.price}</span>
                      {p.save && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{p.save}</span>}
                    </div>
                    <div className="text-[11px] text-ink-quaternary">{p.perCredit}</div>
                    <ul className="flex flex-col gap-1 mt-1">
                      {p.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-[11px] text-ink-tertiary">
                          <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => handleSelect(p.id)}
                      className={`mt-auto w-full py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        p.popular ? 'bg-brand hover:bg-brand-hover text-white' : 'border border-brand/40 text-brand hover:bg-brand-light'
                      }`}>
                      Select
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            <button onClick={() => setView('history')}
              className="flex items-center gap-2 text-sm text-brand hover:underline mb-6">
              <History className="w-4 h-4" />
              View full credit history
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {/* History */}
        {view === 'history' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-ink">Credit History</h2>
              <button onClick={reset} className="text-[11px] text-brand hover:underline">Back to wallet</button>
            </div>
            <div className="bg-white border border-divider rounded-2xl overflow-hidden shadow-card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider">
                    {['Date', 'Type', 'Description', 'Amount', 'Status'].map(h => (
                      <th key={h} className="text-left text-[10px] uppercase font-semibold text-ink-tertiary tracking-wider py-2.5 px-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-ink-tertiary text-sm">No transactions yet</td>
                    </tr>
                  ) : paginated.map(tx => {
                    const isPurchase = tx.transaction_type === 'purchase'
                    const displayAmount = isPurchase ? `+${tx.amount}` : `${tx.amount}`
                    return (
                      <tr key={tx.id} className="border-b border-divider last:border-b-0 hover:bg-surface-subdued/50">
                        <td className="py-3 px-3 text-xs text-ink-secondary whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isPurchase ? 'bg-emerald-50 text-emerald-600' : 'bg-surface-subdued text-ink-tertiary'
                          }`}>{tx.transaction_type}</span>
                        </td>
                        <td className="py-3 px-3 text-xs text-ink-secondary">{tx.reason}</td>
                        <td className={`py-3 px-3 text-xs font-bold text-right whitespace-nowrap ${isPurchase ? 'text-emerald-600' : 'text-ink-tertiary'}`}>
                          {displayAmount}
                        </td>
                        <td className="py-3 px-3">
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 whitespace-nowrap">
                            <Check className="w-2.5 h-2.5" />Complete
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-4">
                <button onClick={() => setTxPage(p => Math.max(0, p - 1))} disabled={txPage === 0}
                  className="p-1.5 rounded hover:bg-surface-subdued disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => setTxPage(i)}
                    className={`w-7 h-7 rounded text-xs ${txPage === i ? 'bg-surface-subdued text-ink' : 'text-ink-tertiary'}`}>{i + 1}</button>
                ))}
                <button onClick={() => setTxPage(p => Math.min(totalPages - 1, p + 1))} disabled={txPage === totalPages - 1}
                  className="p-1.5 rounded hover:bg-surface-subdued disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}

      {/* Payment modal */}
        <AnimatePresence>
          {view !== 'overview' && view !== 'history' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4"
              onClick={() => view !== 'processing' && reset()}>
              <div className="absolute inset-0 bg-black/15 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-[420px] bg-white border border-divider rounded-2xl p-7 shadow-modal">

                {view === 'payment' && pkg && (
                  <>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-bold text-ink">Purchase {pkg.name}</h3>
                      <button onClick={reset} className="p-1.5 rounded hover:bg-surface-subdued">
                        <XCircle className="w-4 h-4 text-ink-quaternary" />
                      </button>
                    </div>
                    <div className="bg-surface-subdued border border-divider rounded-xl p-3.5 mb-5 flex justify-between items-center">
                      <span className="text-sm text-ink-secondary">{pkg.name} — {pkg.credits} credits</span>
                      <span className="text-lg font-bold text-ink">${pkg.price}.00</span>
                    </div>
                    <div className="flex items-center gap-3 mb-4 text-[10px] text-ink-quaternary">
                      <span className="flex items-center gap-1"><Shield className="w-3 h-3" />SSL Secure</span>
                      <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" />Credits never expire</span>
                    </div>
                    <div className="space-y-2.5 mb-5">
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-quaternary" />
                        <input type="text" placeholder="Card number"
                          className="w-full pl-9 pr-4 py-3 rounded-xl bg-surface-subdued border border-divider text-ink text-sm placeholder:text-ink-quaternary outline-none focus:border-brand transition-all" />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <input type="text" placeholder="MM/YY"
                          className="w-full px-4 py-3 rounded-xl bg-surface-subdued border border-divider text-ink text-sm placeholder:text-ink-quaternary outline-none focus:border-brand transition-all" />
                        <input type="text" placeholder="CVV"
                          className="w-full px-4 py-3 rounded-xl bg-surface-subdued border border-divider text-ink text-sm placeholder:text-ink-quaternary outline-none focus:border-brand transition-all" />
                      </div>
                      <input type="text" placeholder="Cardholder name"
                        className="w-full px-4 py-3 rounded-xl bg-surface-subdued border border-divider text-ink text-sm placeholder:text-ink-quaternary outline-none focus:border-brand transition-all" />
                    </div>
                    <div className="border-t border-divider pt-3.5 mb-5 flex justify-between">
                      <span className="text-ink-secondary text-sm">Total</span>
                      <span className="text-xl font-bold text-ink">${pkg.price}.00</span>
                    </div>
                    <button onClick={handlePay} className="w-full py-3 bg-brand hover:bg-brand-hover text-white font-semibold rounded-xl text-sm transition-all">
                      Pay ${pkg.price}
                    </button>
                    <p className="text-[10px] text-ink-quaternary text-center mt-3">Payments processed securely. Credits never expire.</p>
                  </>
                )}

                {view === 'processing' && (
                  <div className="flex flex-col items-center gap-3 py-10">
                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-ink-tertiary">Processing payment...</p>
                  </div>
                )}

                {view === 'success' && (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                      <CheckCircle className="w-12 h-12 text-emerald-500" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-ink">Purchase complete!</h3>
                    <p className="text-sm text-ink-tertiary">Credits have been added to your Career Wallet</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-ink-quaternary mt-1">
                      <Unlock className="w-3 h-3" />
                      <span>You can now unlock any Intelligence Brief</span>
                    </div>
                    <button onClick={reset} className="mt-3 px-7 py-2.5 bg-brand text-white font-semibold rounded-xl text-sm">Done</button>
                  </div>
                )}

                {view === 'failed' && (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                      <AlertTriangle className="w-12 h-12 text-red-400" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-ink">Payment failed</h3>
                    <p className="text-sm text-ink-tertiary text-center px-4">{failedReason || 'Your card issuer declined the transaction. Please try a different payment method.'}</p>
                    <div className="flex flex-col gap-2 w-full mt-2">
                      <button onClick={() => setView('payment')} className="w-full py-2.5 bg-brand text-white font-semibold rounded-xl text-sm">
                        Try Again
                      </button>
                      <button onClick={reset} className="w-full py-2.5 border border-divider text-ink-secondary text-sm rounded-xl hover:bg-surface-subdued transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  )
}
