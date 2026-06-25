'use client'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MOCK_COMPANIES, MOCK_REPORTS } from '@/lib/mock-data'
import { Progress } from '@/components/ui/progress'
import { getVerdictLabel, getVerdictColor } from '@/lib/utils'
import { BarChart3 } from 'lucide-react'

const COMPARE_DIMENSIONS = [
  'Financial Stability', 'Compensation', 'Culture', 'Career Growth',
  'Layoff Risk', 'Work-Life Balance', 'Leadership', 'Employee Sentiment'
]

export default function ComparePage() {
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (slug: string) => {
    setSelected(prev =>
      prev.includes(slug)
        ? prev.filter(s => s !== slug)
        : prev.length < 3 ? [...prev, slug] : prev
    )
  }

  const companyReports = selected.map(slug => ({
    company: MOCK_COMPANIES.find(c => c.slug === slug)!,
    report: MOCK_REPORTS[slug]!,
  })).filter(x => x.company && x.report)

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compare Companies</h1>
          <p className="text-slate-500 text-sm mt-1">Select 2–3 companies to compare side by side.</p>
        </div>

        {/* Company selector */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">Select companies ({selected.length}/3 selected)</p>
          <div className="flex flex-wrap gap-2">
            {MOCK_COMPANIES.map((c) => (
              <button
                key={c.slug}
                onClick={() => toggle(c.slug)}
                disabled={!selected.includes(c.slug) && selected.length >= 3}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selected.includes(c.slug)
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 disabled:opacity-40'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {companyReports.length >= 2 ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className={`grid gap-0`} style={{ gridTemplateColumns: `200px repeat(${companyReports.length}, 1fr)` }}>
              <div className="p-4 bg-slate-50 border-b border-slate-200" />
              {companyReports.map(({ company, report }) => (
                <div key={company.slug} className="p-4 bg-slate-50 border-b border-l border-slate-200 text-center">
                  <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-700 mx-auto mb-2">
                    {company.name.charAt(0)}
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">{company.name}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{report.overall_score}</p>
                  <p className={`text-xs font-semibold ${getVerdictColor(report.verdict)}`}>
                    {getVerdictLabel(report.verdict)}
                  </p>
                </div>
              ))}
            </div>

            {/* Dimension rows */}
            {COMPARE_DIMENSIONS.map((dim) => (
              <div
                key={dim}
                className={`grid gap-0 border-b border-slate-100`}
                style={{ gridTemplateColumns: `200px repeat(${companyReports.length}, 1fr)` }}
              >
                <div className="p-4 flex items-center">
                  <span className="text-sm font-medium text-slate-700">{dim}</span>
                </div>
                {companyReports.map(({ company, report }) => {
                  const cat = report.categories.find(c => c.category === dim)
                  const score = cat?.score ?? 0
                  const status = cat?.status ?? 'yellow'
                  return (
                    <div key={company.slug} className="p-4 border-l border-slate-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-slate-900">{score}</span>
                        <span className={`text-xs font-medium ${
                          status === 'green' ? 'text-green-600' : status === 'red' ? 'text-red-600' : 'text-yellow-600'
                        }`}>{score >= 70 ? '●' : score >= 45 ? '●' : '●'}</span>
                      </div>
                      <Progress value={score} color={status} />
                    </div>
                  )
                })}
              </div>
            ))}

            {/* Recommendation row */}
            <div
              className="grid gap-0"
              style={{ gridTemplateColumns: `200px repeat(${companyReports.length}, 1fr)` }}
            >
              <div className="p-4 flex items-center bg-slate-50">
                <span className="text-sm font-semibold text-slate-700">Verdict</span>
              </div>
              {companyReports.map(({ company, report }) => (
                <div key={company.slug} className="p-4 border-l border-slate-100 bg-slate-50 text-center">
                  <span className={`text-sm font-bold ${getVerdictColor(report.verdict)}`}>
                    {getVerdictLabel(report.verdict)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
            <BarChart3 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Select at least 2 companies to compare</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
