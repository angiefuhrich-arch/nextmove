import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MOCK_COMPANIES, MOCK_REPORTS } from '@/lib/mock-data'
import Link from 'next/link'
import { ScoreRing } from '@/components/company/score-ring'
import { Search, TrendingUp, BarChart3, Briefcase } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const topCompanies = MOCK_COMPANIES.slice(0, 6)

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back. What company are you evaluating today?</p>
        </div>

        {/* Quick search */}
        <Link
          href="/search"
          className="flex items-center gap-3 w-full max-w-xl bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-400 hover:border-slate-400 transition-colors text-sm"
        >
          <Search size={16} />
          Search any company...
        </Link>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: '/search', icon: Search, label: 'Analyze Company', color: 'bg-slate-900 text-white' },
            { href: '/compare', icon: BarChart3, label: 'Compare Companies', color: 'bg-blue-600 text-white' },
            { href: '/offer-assistant', icon: Briefcase, label: 'Evaluate Offer', color: 'bg-green-600 text-white' },
            { href: '/watchlist', icon: TrendingUp, label: 'My Watchlist', color: 'bg-purple-600 text-white' },
          ].map(({ href, icon: Icon, label, color }) => (
            <Link
              key={href}
              href={href}
              className={`${color} rounded-xl p-4 flex flex-col gap-2 hover:opacity-90 transition-opacity`}
            >
              <Icon size={20} />
              <span className="text-sm font-semibold">{label}</span>
            </Link>
          ))}
        </div>

        {/* Featured companies */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Top Companies</h2>
            <Link href="/search" className="text-sm text-slate-500 hover:text-slate-900">View all →</Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topCompanies.map((company) => {
              const report = MOCK_REPORTS[company.slug]
              if (!report) return null
              return (
                <Link
                  key={company.id}
                  href={`/company/${company.slug}`}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-4"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                    {company.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{company.name}</p>
                    <p className="text-xs text-slate-500 truncate">{company.industry}</p>
                  </div>
                  <ScoreRing score={report.overall_score} verdict={report.verdict} size="sm" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
