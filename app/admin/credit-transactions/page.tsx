'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { CreditCard, Loader2, RefreshCw, ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface Transaction {
  id: string
  user_id: string
  transaction_type: string
  amount: number
  reason: string | null
  balance_after: number
  stripe_session_id: string | null
  created_at: string
  entity: { name: string; slug: string } | null
  user_profile: { email: string; display_name: string | null } | null
  admin_profile: { email: string; display_name: string | null } | null
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    purchase: 'bg-emerald-50 text-emerald-700',
    credit: 'bg-blue-50 text-blue-700',
    debit: 'bg-red-50 text-red-600',
    unlock: 'bg-amber-50 text-amber-700',
    refund: 'bg-purple-50 text-purple-700',
    adjustment: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${map[type] ?? 'bg-slate-100 text-slate-600'}`}>
      {type}
    </span>
  )
}

const TYPE_OPTIONS = ['', 'purchase', 'credit', 'debit', 'unlock', 'refund', 'adjustment']

export default function AdminCreditTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [typeFilter, setTypeFilter] = useState('')

  const load = useCallback(async (p: number, type: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (type) params.set('type', type)
      const res = await fetch(`/api/admin/credit-transactions?${params}`)
      if (!res.ok) return
      const data = await res.json()
      setTransactions(data.transactions ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const t = setTimeout(async () => { if (active) await load(page, typeFilter) }, 0)
    return () => { active = false; clearTimeout(t) }
  }, [page, typeFilter, load])

  const totalPages = Math.ceil(total / 50)

  return (
    <AdminLayout activePath="/admin/credit-transactions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-5 h-5 text-brand" />
              <h1 className="text-xl font-bold text-ink">Credit Transactions</h1>
            </div>
            <p className="text-sm text-ink-tertiary">{total.toLocaleString()} total transactions</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0) }}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-divider bg-white text-sm text-ink outline-none focus:border-brand transition-colors">
                <option value="">All types</option>
                {TYPE_OPTIONS.slice(1).map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-quaternary pointer-events-none" />
            </div>
            <button onClick={() => load(page, typeFilter)} className="p-2 rounded-xl border border-divider hover:bg-surface-subdued transition-colors">
              <RefreshCw className="w-4 h-4 text-ink-tertiary" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-divider rounded-2xl shadow-card overflow-hidden">
          <div className="hidden xl:grid grid-cols-[2fr_1fr_80px_60px_2fr_1.5fr_100px] gap-3 px-5 py-2.5 border-b border-divider bg-surface-subdued">
            {['User', 'Type', 'Amount', 'Balance', 'Reason / Entity', 'Stripe Session', 'Date'].map(h => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-ink-quaternary">{h}</span>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-brand animate-spin" /></div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center text-sm text-ink-tertiary">No transactions found.</div>
          ) : (
            <div className="divide-y divide-divider">
              {transactions.map(tx => (
                <div key={tx.id} className="grid xl:grid-cols-[2fr_1fr_80px_60px_2fr_1.5fr_100px] gap-3 px-5 py-3.5 items-start hover:bg-surface-subdued/50 transition-colors">
                  {/* User */}
                  <div>
                    <Link href={`/admin/users/${tx.user_id}`}
                      className="text-sm font-medium text-ink hover:text-brand transition-colors truncate block">
                      {tx.user_profile?.email ?? tx.user_id}
                    </Link>
                    {tx.user_profile?.display_name && (
                      <p className="text-[11px] text-ink-quaternary truncate">{tx.user_profile.display_name}</p>
                    )}
                  </div>
                  {/* Type */}
                  <div className="flex items-start pt-0.5">
                    <TypeBadge type={tx.transaction_type} />
                  </div>
                  {/* Amount */}
                  <p className={`text-sm font-bold ${tx.amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </p>
                  {/* Balance after */}
                  <p className="text-sm text-ink-secondary">{tx.balance_after}</p>
                  {/* Reason / Entity */}
                  <div>
                    <p className="text-xs text-ink-secondary">{tx.reason ?? '—'}</p>
                    {tx.entity && (
                      <p className="text-[10px] text-ink-quaternary mt-0.5">{tx.entity.name}</p>
                    )}
                    {tx.admin_profile && (
                      <p className="text-[10px] text-ink-quaternary mt-0.5">by {tx.admin_profile.email}</p>
                    )}
                  </div>
                  {/* Stripe session */}
                  <p className="text-[11px] text-ink-quaternary font-mono truncate">
                    {tx.stripe_session_id ? tx.stripe_session_id.substring(0, 20) + '…' : '—'}
                  </p>
                  {/* Date */}
                  <p className="text-[11px] text-ink-quaternary whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 rounded-lg border border-divider text-xs text-ink-secondary disabled:opacity-40 hover:bg-surface-subdued">
              Previous
            </button>
            <span className="text-xs text-ink-tertiary px-2">Page {page + 1} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg border border-divider text-xs text-ink-secondary disabled:opacity-40 hover:bg-surface-subdued">
              Next
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
