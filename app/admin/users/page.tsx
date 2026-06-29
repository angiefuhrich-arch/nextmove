'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Users, Search, Loader2, ChevronRight, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface AdminUser {
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
}

function StatusBadge({ user }: { user: AdminUser }) {
  if (user.is_suspended) return <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase">Suspended</span>
  if (user.is_admin) return <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-bold uppercase">Admin</span>
  return <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase">Active</span>
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  const load = useCallback(async (q: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (q) params.set('q', q)
      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) return
      const data = await res.json()
      setUsers(data.users ?? [])
      setTotal(data.total ?? 0)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    let active = true
    const t = setTimeout(async () => {
      if (!active) return
      await load(query, page)
    }, query ? 400 : 0)
    return () => { active = false; clearTimeout(t) }
  }, [query, page, load])

  const totalPages = Math.ceil(total / 50)

  return (
    <AdminLayout activePath="/admin/users">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-brand" />
              <h1 className="text-xl font-bold text-ink">Users</h1>
            </div>
            <p className="text-sm text-ink-tertiary">{total.toLocaleString()} registered users</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-quaternary" />
              <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(0) }}
                placeholder="Search by email…"
                className="pl-8 pr-4 py-2 rounded-xl border border-divider bg-white text-sm text-ink placeholder:text-ink-quaternary outline-none focus:border-brand transition-colors w-56"
              />
            </div>
            <button onClick={() => load(query, page)} className="p-2 rounded-xl border border-divider hover:bg-surface-subdued transition-colors">
              <RefreshCw className="w-4 h-4 text-ink-tertiary" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-divider rounded-2xl shadow-card overflow-hidden">
          {/* Header row */}
          <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-3 px-5 py-2.5 border-b border-divider bg-surface-subdued">
            {['User', 'Signup', 'Last Login', 'Credits', 'Briefs', 'Watchlist', ''].map(h => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-ink-quaternary">{h}</span>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-brand animate-spin" /></div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-sm text-ink-tertiary">No users found.</div>
          ) : (
            <div className="divide-y divide-divider">
              {users.map(user => (
                <div key={user.id} className="grid lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-3 px-5 py-3.5 items-center hover:bg-surface-subdued/50 transition-colors">
                  {/* User */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/15 flex items-center justify-center text-[10px] font-bold text-brand flex-shrink-0">
                      {(user.display_name ?? user.email).substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium text-ink truncate">{user.email}</p>
                        <StatusBadge user={user} />
                      </div>
                      {user.display_name && <p className="text-[11px] text-ink-quaternary truncate">{user.display_name}</p>}
                    </div>
                  </div>
                  {/* Signup */}
                  <p className="text-xs text-ink-tertiary">
                    {new Date(user.signup_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </p>
                  {/* Last login */}
                  <p className="text-xs text-ink-tertiary">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                      : '—'}
                  </p>
                  {/* Credits */}
                  <div>
                    <p className="text-sm font-bold text-ink">{user.credits}</p>
                    <p className="text-[10px] text-ink-quaternary">+{user.total_purchased} / −{user.total_used}</p>
                  </div>
                  {/* Briefs */}
                  <p className="text-sm text-ink-secondary">{user.brief_count}</p>
                  {/* Watchlist */}
                  <p className="text-sm text-ink-secondary">{user.watchlist_count}</p>
                  {/* Action */}
                  <Link href={`/admin/users/${user.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-divider text-[11px] text-ink-secondary hover:border-brand/30 hover:text-brand transition-colors whitespace-nowrap">
                    View
                    <ChevronRight className="w-3 h-3" />
                  </Link>
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

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-ink-quaternary">
          <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" />Active</span>
          <span className="flex items-center gap-1.5"><ShieldAlert className="w-3 h-3 text-brand" />Admin</span>
          <span className="flex items-center gap-1.5"><ShieldAlert className="w-3 h-3 text-red-400" />Suspended</span>
        </div>
      </div>
    </AdminLayout>
  )
}
