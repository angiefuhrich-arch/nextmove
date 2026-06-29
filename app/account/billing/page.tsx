'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { CreditCard, Sparkles, FileText, Loader2, ChevronRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { AccountLayout } from '@/components/scarsian/AccountLayout'

interface BillingData {
  credits: number
  brief_count: number
  transaction_count: number
  last_purchase: string | null
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !active) { setLoading(false); return }

      const [{ data: profile }, { data: txs }, { count: briefCount }] = await Promise.all([
        supabase.from('profiles').select('credits').eq('id', user.id).single(),
        supabase.from('credit_transactions').select('transaction_type, created_at')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('brief_unlocks').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ])

      if (!active) return
      const lastPurchase = txs?.find(t => t.transaction_type === 'purchase')
      setData({
        credits: profile?.credits ?? 0,
        brief_count: briefCount ?? 0,
        transaction_count: txs?.length ?? 0,
        last_purchase: lastPurchase?.created_at ?? null,
      })
      setLoading(false)
    })()
    return () => { active = false }
  }, [])

  return (
    <AccountLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-5 h-5 text-brand" />
            <h1 className="text-2xl font-bold text-ink tracking-tight">Billing & Subscription</h1>
          </div>
          <p className="text-sm text-ink-tertiary">Your current plan, credits, and payment history.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-brand animate-spin" /></div>
        ) : (
          <>
            {/* Current plan */}
            <div className="bg-white border border-divider rounded-2xl p-6 shadow-card">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-quaternary mb-1">Current Plan</p>
                  <h2 className="text-xl font-bold text-ink">Free</h2>
                  <p className="text-sm text-ink-tertiary mt-1">Pay-as-you-go Intelligence Briefs. No subscription required.</p>
                </div>
                <span className="px-3 py-1.5 bg-brand/8 border border-brand/20 text-brand text-xs font-bold rounded-full">Active</span>
              </div>
              <div className="mt-5 pt-5 border-t border-divider">
                <p className="text-xs text-ink-quaternary mb-3">Upgrade for volume discounts and priority delivery.</p>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 border border-divider text-ink-tertiary text-xs rounded-xl opacity-50 cursor-not-allowed">
                  Subscription plans — Coming Soon
                </span>
              </div>
            </div>

            {/* Credit balance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Sparkles, label: 'Credits Available', value: data?.credits.toString() ?? '0' },
                { icon: FileText, label: 'Briefs Unlocked', value: data?.brief_count.toString() ?? '0' },
                { icon: CreditCard, label: 'Transactions', value: data?.transaction_count.toString() ?? '0' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="bg-white border border-divider rounded-2xl p-4 shadow-card">
                  <s.icon className="w-4 h-4 text-brand mb-2" />
                  <div className="text-2xl font-bold text-ink">{s.value}</div>
                  <div className="text-xs text-ink-tertiary">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {data?.last_purchase && (
              <div className="bg-white border border-divider rounded-2xl p-5 shadow-card">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-quaternary mb-2">Last Purchase</p>
                <p className="text-sm text-ink-secondary">
                  {new Date(data.last_purchase).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white border border-divider rounded-2xl divide-y divide-divider shadow-card overflow-hidden">
              <Link href="/wallet" className="flex items-center gap-3 px-5 py-4 hover:bg-surface-subdued transition-colors">
                <Sparkles className="w-4 h-4 text-brand flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">Add Credits</p>
                  <p className="text-xs text-ink-tertiary">Purchase Intelligence Brief credits</p>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-quaternary" />
              </Link>
              <Link href="/wallet" className="flex items-center gap-3 px-5 py-4 hover:bg-surface-subdued transition-colors">
                <CreditCard className="w-4 h-4 text-brand flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">View Credit History</p>
                  <p className="text-xs text-ink-tertiary">Full transaction log in Career Wallet™</p>
                </div>
                <ExternalLink className="w-4 h-4 text-ink-quaternary" />
              </Link>
            </div>

            {/* Invoices placeholder */}
            <div className="bg-white border border-divider rounded-2xl p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-ink">Invoices & Payment Methods</h2>
                  <p className="text-xs text-ink-tertiary mt-1">Download invoices and manage saved payment methods.</p>
                </div>
                <span className="px-2.5 py-1 bg-surface-subdued border border-divider text-[10px] font-bold text-ink-quaternary uppercase rounded-full">Coming Soon</span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AccountLayout>
  )
}
