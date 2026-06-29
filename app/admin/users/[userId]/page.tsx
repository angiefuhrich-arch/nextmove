'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import {
  ArrowLeft, Loader2, CreditCard, BookOpen, Bookmark,
  ShieldAlert, ShieldCheck, AlertTriangle, ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface UserDetail {
  id: string
  email: string
  display_name: string | null
  signup_date: string
  last_login: string | null
  credits: number
  total_purchased: number
  total_used: number
  brief_count: number
  watchlist_count: number
  is_admin: boolean
  is_suspended: boolean
  suspended_reason: string | null
  suspended_at: string | null
  transactions: Transaction[]
  briefs: Brief[]
  watchlist: WatchlistItem[]
  recent_searches: Search[]
}

interface Transaction {
  id: string
  transaction_type: string
  amount: number
  reason: string | null
  balance_after: number
  created_at: string
  entity: { name: string; slug: string } | null
  admin_profile: { email: string } | null
}

interface Brief {
  id: string
  entity_id: string
  unlocked_at: string
  entity: { name: string; slug: string } | null
}

interface WatchlistItem {
  id: string
  entity_id: string
  created_at: string
  entity: { name: string; slug: string } | null
}

interface Search {
  id: string
  query: string
  created_at: string
}

type Tab = 'overview' | 'transactions' | 'briefs' | 'watchlist'

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
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${map[type] ?? 'bg-slate-100 text-slate-600'}`}>
      {type}
    </span>
  )
}

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')

  // Credit form
  const [creditType, setCreditType] = useState<'credit' | 'debit' | 'refund' | 'adjustment'>('credit')
  const [creditAmount, setCreditAmount] = useState('')
  const [creditReason, setCreditReason] = useState('')
  const [creditLoading, setCreditLoading] = useState(false)
  const [creditError, setCreditError] = useState('')
  const [creditSuccess, setCreditSuccess] = useState('')

  // Suspend form
  const [suspendReason, setSuspendReason] = useState('')
  const [suspendLoading, setSuspendLoading] = useState(false)
  const [suspendError, setSuspendError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (!res.ok) return
      const data = await res.json()
      setUser(data.user)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    let active = true
    const t = setTimeout(async () => { if (active) await load() }, 0)
    return () => { active = false; clearTimeout(t) }
  }, [load])

  async function handleCredits(e: React.FormEvent) {
    e.preventDefault()
    setCreditError('')
    setCreditSuccess('')
    const amt = parseInt(creditAmount)
    if (!amt || amt < 1 || amt > 500) { setCreditError('Amount must be 1–500'); return }
    if (creditReason.length < 5) { setCreditError('Reason must be at least 5 characters'); return }
    setCreditLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: creditType, amount: amt, reason: creditReason }),
      })
      const data = await res.json()
      if (!res.ok) { setCreditError(data.error ?? 'Failed'); return }
      setCreditSuccess(`Done. New balance: ${data.balance}`)
      setCreditAmount('')
      setCreditReason('')
      await load()
    } finally {
      setCreditLoading(false)
    }
  }

  async function handleSuspend() {
    setSuspendError('')
    if (!user) return
    const suspend = !user.is_suspended
    if (suspend && suspendReason.length < 5) { setSuspendError('Please enter a reason (min 5 chars)'); return }
    setSuspendLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspend, reason: suspendReason }),
      })
      if (!res.ok) { setSuspendError('Failed to update suspension'); return }
      setSuspendReason('')
      await load()
    } finally {
      setSuspendLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout activePath="/admin/users">
        <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 text-brand animate-spin" /></div>
      </AdminLayout>
    )
  }

  if (!user) {
    return (
      <AdminLayout activePath="/admin/users">
        <div className="py-24 text-center text-sm text-ink-tertiary">User not found.</div>
      </AdminLayout>
    )
  }

  const initials = (user.display_name ?? user.email).substring(0, 2).toUpperCase()

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'transactions', label: `Transactions (${user.transactions.length})` },
    { id: 'briefs', label: `Briefs (${user.briefs.length})` },
    { id: 'watchlist', label: `Watchlist (${user.watchlist.length})` },
  ]

  return (
    <AdminLayout activePath="/admin/users">
      <div className="space-y-6">
        {/* Back */}
        <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-ink-tertiary hover:text-brand transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Users
        </Link>

        {/* Header */}
        <div className="bg-white border border-divider rounded-2xl shadow-card p-6">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/15 flex items-center justify-center text-sm font-bold text-brand flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h1 className="text-lg font-bold text-ink">{user.email}</h1>
                {user.is_suspended && <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase">Suspended</span>}
                {user.is_admin && !user.is_suspended && <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-bold uppercase">Admin</span>}
                {!user.is_admin && !user.is_suspended && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase">Active</span>}
              </div>
              {user.display_name && <p className="text-sm text-ink-tertiary">{user.display_name}</p>}
              <p className="text-xs text-ink-quaternary mt-1">ID: {user.id}</p>
            </div>
            {/* Stats */}
            <div className="flex items-center gap-6 flex-wrap text-center">
              {[
                { label: 'Credits', value: user.credits, icon: <CreditCard className="w-3.5 h-3.5" /> },
                { label: 'Briefs', value: user.brief_count, icon: <BookOpen className="w-3.5 h-3.5" /> },
                { label: 'Watchlist', value: user.watchlist_count, icon: <Bookmark className="w-3.5 h-3.5" /> },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex items-center gap-1 text-ink-quaternary mb-0.5 justify-center">{s.icon}<span className="text-[10px] uppercase tracking-wider">{s.label}</span></div>
                  <p className="text-xl font-bold text-ink">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
          {user.is_suspended && user.suspended_reason && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span><strong>Suspension reason:</strong> {user.suspended_reason}</span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: tabs */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tabs */}
            <div className="flex gap-1 bg-surface-subdued rounded-xl p-1 border border-divider">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === t.id ? 'bg-white shadow-card text-ink' : 'text-ink-tertiary hover:text-ink'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Overview */}
            {tab === 'overview' && (
              <div className="bg-white border border-divider rounded-2xl shadow-card divide-y divide-divider">
                {[
                  { label: 'Email', value: user.email },
                  { label: 'Display Name', value: user.display_name ?? '—' },
                  { label: 'Signup', value: new Date(user.signup_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
                  { label: 'Last Login', value: user.last_login ? new Date(user.last_login).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
                  { label: 'Credits', value: `${user.credits} (purchased: +${user.total_purchased}, used: −${user.total_used})` },
                  { label: 'Briefs Unlocked', value: user.brief_count },
                  { label: 'Watchlist Items', value: user.watchlist_count },
                  { label: 'Admin', value: user.is_admin ? 'Yes' : 'No' },
                  { label: 'Suspended', value: user.is_suspended ? `Yes — ${user.suspended_reason ?? ''}` : 'No' },
                ].map(row => (
                  <div key={row.label} className="flex items-start justify-between gap-4 px-5 py-3">
                    <span className="text-[11px] text-ink-quaternary uppercase tracking-wider w-32 flex-shrink-0">{row.label}</span>
                    <span className="text-sm text-ink text-right">{String(row.value)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Transactions */}
            {tab === 'transactions' && (
              <div className="bg-white border border-divider rounded-2xl shadow-card overflow-hidden">
                <div className="hidden sm:grid grid-cols-[1fr_80px_60px_1fr_90px] gap-3 px-5 py-2.5 border-b border-divider bg-surface-subdued">
                  {['Type', 'Amount', 'Balance', 'Reason', 'Date'].map(h => (
                    <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-ink-quaternary">{h}</span>
                  ))}
                </div>
                {user.transactions.length === 0 ? (
                  <div className="py-12 text-center text-sm text-ink-tertiary">No transactions.</div>
                ) : (
                  <div className="divide-y divide-divider">
                    {user.transactions.map(tx => (
                      <div key={tx.id} className="grid sm:grid-cols-[1fr_80px_60px_1fr_90px] gap-3 px-5 py-3 items-start">
                        <TypeBadge type={tx.transaction_type} />
                        <p className={`text-sm font-bold ${tx.amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </p>
                        <p className="text-sm text-ink">{tx.balance_after}</p>
                        <div>
                          <p className="text-xs text-ink-secondary">{tx.reason ?? '—'}</p>
                          {tx.entity && <p className="text-[10px] text-ink-quaternary">{tx.entity.name}</p>}
                        </div>
                        <p className="text-[11px] text-ink-quaternary">
                          {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Briefs */}
            {tab === 'briefs' && (
              <div className="bg-white border border-divider rounded-2xl shadow-card overflow-hidden">
                {user.briefs.length === 0 ? (
                  <div className="py-12 text-center text-sm text-ink-tertiary">No briefs unlocked.</div>
                ) : (
                  <div className="divide-y divide-divider">
                    {user.briefs.map(b => (
                      <div key={b.id} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-ink">{b.entity?.name ?? b.entity_id}</p>
                          <p className="text-[11px] text-ink-quaternary">
                            Unlocked {new Date(b.unlocked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                          </p>
                        </div>
                        {b.entity?.slug && (
                          <Link href={`/brief/${b.entity.slug}`} target="_blank"
                            className="px-3 py-1.5 rounded-lg border border-divider text-[11px] text-ink-secondary hover:border-brand/30 hover:text-brand transition-colors whitespace-nowrap">
                            View Brief
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Watchlist */}
            {tab === 'watchlist' && (
              <div className="bg-white border border-divider rounded-2xl shadow-card overflow-hidden">
                {user.watchlist.length === 0 ? (
                  <div className="py-12 text-center text-sm text-ink-tertiary">No watchlist items.</div>
                ) : (
                  <div className="divide-y divide-divider">
                    {user.watchlist.map(w => (
                      <div key={w.id} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-ink">{w.entity?.name ?? w.entity_id}</p>
                          <p className="text-[11px] text-ink-quaternary">
                            Added {new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: actions */}
          <div className="space-y-4">
            {/* Credit Management */}
            <div className="bg-white border border-divider rounded-2xl shadow-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-4 h-4 text-brand" />
                <h2 className="text-sm font-semibold text-ink">Adjust Credits</h2>
              </div>
              <form onSubmit={handleCredits} className="space-y-3">
                <div>
                  <label className="block text-[11px] text-ink-quaternary mb-1 uppercase tracking-wider">Type</label>
                  <div className="relative">
                    <select value={creditType} onChange={e => setCreditType(e.target.value as typeof creditType)}
                      className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl border border-divider bg-surface text-sm text-ink outline-none focus:border-brand transition-colors">
                      <option value="credit">Credit (add)</option>
                      <option value="debit">Debit (subtract)</option>
                      <option value="refund">Refund</option>
                      <option value="adjustment">Adjustment</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-quaternary pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-ink-quaternary mb-1 uppercase tracking-wider">Amount (1–500)</label>
                  <input type="number" min={1} max={500} value={creditAmount} onChange={e => setCreditAmount(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 rounded-xl border border-divider bg-surface text-sm text-ink outline-none focus:border-brand transition-colors placeholder:text-ink-quaternary" />
                </div>
                <div>
                  <label className="block text-[11px] text-ink-quaternary mb-1 uppercase tracking-wider">Reason</label>
                  <textarea value={creditReason} onChange={e => setCreditReason(e.target.value)}
                    rows={2} placeholder="Reason for credit adjustment…"
                    className="w-full px-3 py-2 rounded-xl border border-divider bg-surface text-sm text-ink outline-none focus:border-brand transition-colors placeholder:text-ink-quaternary resize-none" />
                </div>
                {creditError && <p className="text-xs text-red-600">{creditError}</p>}
                {creditSuccess && <p className="text-xs text-emerald-600">{creditSuccess}</p>}
                <button type="submit" disabled={creditLoading}
                  className="w-full py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {creditLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Apply Adjustment
                </button>
              </form>
            </div>

            {/* Suspend / Unsuspend */}
            <div className="bg-white border border-divider rounded-2xl shadow-card p-5">
              <div className="flex items-center gap-2 mb-4">
                {user.is_suspended
                  ? <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  : <ShieldAlert className="w-4 h-4 text-red-500" />}
                <h2 className="text-sm font-semibold text-ink">
                  {user.is_suspended ? 'Unsuspend User' : 'Suspend User'}
                </h2>
              </div>
              {!user.is_suspended && (
                <div className="mb-3">
                  <label className="block text-[11px] text-ink-quaternary mb-1 uppercase tracking-wider">Reason</label>
                  <textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)}
                    rows={2} placeholder="Reason for suspension…"
                    className="w-full px-3 py-2 rounded-xl border border-divider bg-surface text-sm text-ink outline-none focus:border-brand transition-colors placeholder:text-ink-quaternary resize-none" />
                </div>
              )}
              {suspendError && <p className="text-xs text-red-600 mb-2">{suspendError}</p>}
              <button onClick={handleSuspend} disabled={suspendLoading}
                className={`w-full py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${user.is_suspended ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-600 text-white hover:bg-red-700'}`}>
                {suspendLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {user.is_suspended ? 'Unsuspend Account' : 'Suspend Account'}
              </button>
              {user.is_suspended && user.suspended_at && (
                <p className="text-[10px] text-ink-quaternary text-center mt-2">
                  Suspended {new Date(user.suspended_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                </p>
              )}
            </div>

            {/* Info card */}
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-600" />
              <span>All credit adjustments and suspensions are logged in the audit trail and cannot be undone.</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
