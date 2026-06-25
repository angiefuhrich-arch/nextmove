'use client'
import { useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MOCK_COMPANIES, MOCK_REPORTS } from '@/lib/mock-data'
import { ScoreRing } from '@/components/company/score-ring'
import { Search, Building2 } from 'lucide-react'

export default function SearchPage() {
  const [query, setQuery] = useState('')

  const filtered = MOCK_COMPANIES.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.industry.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Search</h1>
          <p className="text-slate-500 text-sm mt-1">Search any company to see their Next Move score and full intelligence report.</p>
        </div>

        <div className="relative max-w-xl">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search companies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            autoFocus
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((company) => {
            const report = MOCK_REPORTS[company.slug]
            return (
              <Link
                key={company.id}
                href={`/company/${company.slug}`}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all flex gap-4"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-bold text-base shrink-0">
                  {company.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{company.name}</p>
                  <p className="text-xs text-slate-500 mb-1">{company.industry} · {company.size} employees</p>
                  <p className="text-xs text-slate-600 line-clamp-2">{company.description}</p>
                </div>
                {report ? (
                  <div className="shrink-0">
                    <ScoreRing score={report.overall_score} verdict={report.verdict} size="sm" />
                  </div>
                ) : (
                  <div className="shrink-0 flex items-center">
                    <Building2 size={20} className="text-slate-300" />
                  </div>
                )}
              </Link>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No companies found for &ldquo;{query}&rdquo;</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
