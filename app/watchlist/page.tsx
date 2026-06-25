'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { MOCK_REPORTS } from '@/lib/mock-data'
import { ScoreRing } from '@/components/company/score-ring'
import { Trash2, BookmarkCheck } from 'lucide-react'

interface SavedCompany {
  id: string
  company_slug: string
  company_name: string
  created_at: string
}

export default function WatchlistPage() {
  const [saved, setSaved] = useState<SavedCompany[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('saved_companies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setSaved(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const remove = async (id: string) => {
    const supabase = createClient()
    await supabase.from('saved_companies').delete().eq('id', id)
    setSaved(prev => prev.filter(s => s.id !== id))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Watchlist</h1>
          <p className="text-slate-500 text-sm mt-1">Companies you&apos;ve saved for tracking and comparison.</p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading...</div>
        ) : saved.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
            <BookmarkCheck size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Your watchlist is empty</p>
            <p className="text-sm mt-1">Browse companies and click Save to add them here</p>
            <Link href="/search" className="mt-4 inline-block text-sm text-slate-900 font-semibold hover:underline">
              Search companies →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {saved.map((item) => {
              const report = MOCK_REPORTS[item.company_slug]
              return (
                <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
                    {item.company_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <Link href={`/company/${item.company_slug}`} className="font-semibold text-slate-900 hover:text-slate-700 text-sm">
                      {item.company_name}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Added {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {report && <ScoreRing score={report.overall_score} verdict={report.verdict} size="sm" />}
                  <button
                    onClick={() => remove(item.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
