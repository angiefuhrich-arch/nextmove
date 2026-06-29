'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Unlock, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface BriefUnlock {
  id: string
  user_id: string
  entity_id: string
  unlocked_at: string
  credits_charged: number
  entity: { name: string; slug: string } | null
  user_profile: { email: string; display_name: string | null } | null
}

export default function AdminBriefUnlocksPage() {
  const [unlocks, setUnlocks] = useState<BriefUnlock[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  const load = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      const res = await fetch(`/api/admin/brief-unlocks?${params}`)
      if (!res.ok) return
      const data = await res.json()
      setUnlocks(data.unlocks ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const t = setTimeout(async () => { if (active) await load(page) }, 0)
    return () => { active = false; clearTimeout(t) }
  }, [page, load])

  const totalPages = Math.ceil(total / 50)

  return (
    <AdminLayout activePath="/admin/brief-unlocks">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Unlock className="w-5 h-5 text-brand" />
              <h1 className="text-xl font-bold text-ink">Brief Unlocks</h1>
            </div>
            <p className="text-sm text-ink-tertiary">{total.toLocaleString()} total unlocks</p>
          </div>
          <button onClick={() => load(page)} className="p-2 rounded-xl border border-divider hover:bg-surface-subdued transition-colors">
            <RefreshCw className="w-4 h-4 text-ink-tertiary" />
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-divider rounded-2xl shadow-card overflow-hidden">
          <div className="hidden lg:grid grid-cols-[2fr_2fr_1fr_100px] gap-3 px-5 py-2.5 border-b border-divider bg-surface-subdued">
            {['User', 'Entity', 'Credits Charged', 'Unlocked At'].map(h => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-ink-quaternary">{h}</span>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-brand animate-spin" /></div>
          ) : unlocks.length === 0 ? (
            <div className="py-16 text-center text-sm text-ink-tertiary">No unlocks found.</div>
          ) : (
            <div className="divide-y divide-divider">
              {unlocks.map(u => (
                <div key={u.id} className="grid lg:grid-cols-[2fr_2fr_1fr_100px] gap-3 px-5 py-3.5 items-center hover:bg-surface-subdued/50 transition-colors">
                  {/* User */}
                  <div>
                    <Link href={`/admin/users/${u.user_id}`}
                      className="text-sm font-medium text-ink hover:text-brand transition-colors truncate block">
                      {u.user_profile?.email ?? u.user_id}
                    </Link>
                    {u.user_profile?.display_name && (
                      <p className="text-[11px] text-ink-quaternary truncate">{u.user_profile.display_name}</p>
                    )}
                  </div>
                  {/* Entity */}
                  <div>
                    {u.entity ? (
                      <Link href={`/brief/${u.entity.slug}`} target="_blank"
                        className="text-sm text-ink hover:text-brand transition-colors">
                        {u.entity.name}
                      </Link>
                    ) : (
                      <p className="text-sm text-ink-quaternary">{u.entity_id}</p>
                    )}
                  </div>
                  {/* Credits charged */}
                  <p className="text-sm font-bold text-ink">{u.credits_charged}</p>
                  {/* Date */}
                  <p className="text-[11px] text-ink-quaternary whitespace-nowrap">
                    {new Date(u.unlocked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
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
