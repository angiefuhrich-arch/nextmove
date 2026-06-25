'use client'
import { use, useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MOCK_COMPANIES, MOCK_REPORTS } from '@/lib/mock-data'
import { ScoreRing } from '@/components/company/score-ring'
import { CategoryScoreCard } from '@/components/company/category-score'
import { UpgradeModal } from '@/components/company/upgrade-modal'
import { Badge } from '@/components/ui/badge'
import { getVerdictLabel, getVerdictBg, getVerdictColor } from '@/lib/utils'
import { CheckCircle2, AlertTriangle, Users, UserX, Globe, Calendar, BookmarkPlus, BookmarkCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const company = MOCK_COMPANIES.find(c => c.slug === slug)
  const report = MOCK_REPORTS[slug]

  useEffect(() => {
    const checkSaved = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('saved_companies').select('id').eq('user_id', user.id).eq('company_slug', slug).single()
      setIsSaved(!!data)
    }
    checkSaved()
  }, [slug])

  const toggleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    if (isSaved) {
      await supabase.from('saved_companies').delete().eq('user_id', user.id).eq('company_slug', slug)
      setIsSaved(false)
    } else {
      await supabase.from('saved_companies').insert({ user_id: user.id, company_slug: slug, company_name: company?.name })
      setIsSaved(true)
    }
    setSaving(false)
  }

  if (!company || !report) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg font-medium">Company not found</p>
          <Link href="/search" className="text-sm text-slate-500 hover:text-slate-900 mt-2 inline-block">← Back to search</Link>
        </div>
      </DashboardLayout>
    )
  }

  const verdictBg = getVerdictBg(report.verdict)
  const verdictColor = getVerdictColor(report.verdict)

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 font-bold text-xl">
              {company.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-slate-500">{company.industry}</span>
                <span className="text-slate-300">·</span>
                <span className="text-sm text-slate-500">{company.size} employees</span>
                <span className="text-slate-300">·</span>
                <span className="text-sm text-slate-500">{company.headquarters}</span>
              </div>
            </div>
          </div>
          <button
            onClick={toggleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors"
          >
            {isSaved ? <BookmarkCheck size={15} className="text-green-500" /> : <BookmarkPlus size={15} />}
            {isSaved ? 'Saved' : 'Save'}
          </button>
        </div>

        {/* Verdict Banner */}
        <div className={`rounded-xl border-2 p-6 ${verdictBg}`}>
          <div className="flex items-center gap-6">
            <ScoreRing score={report.overall_score} verdict={report.verdict} size="lg" />
            <div className="flex-1">
              <div className={`text-3xl font-bold mb-1 ${verdictColor}`}>
                {getVerdictLabel(report.verdict)}
              </div>
              <p className="text-slate-700 leading-relaxed">{report.ai_summary}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Calendar size={12} />Updated {report.last_updated}</span>
                <span className="flex items-center gap-1"><Globe size={12} />Confidence: {report.confidence_score}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Best reasons & risks */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500" />
              Best Reasons to Join
            </h3>
            <ul className="space-y-2">
              {report.best_reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-500" />
              Biggest Risks
            </h3>
            <ul className="space-y-2">
              {report.biggest_risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Good for / Avoid */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Users size={16} className="text-blue-500" />
              Good For
            </h3>
            <ul className="space-y-2">
              {report.good_for.map((r, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <UserX size={16} className="text-red-400" />
              Think Twice If
            </h3>
            <ul className="space-y-2">
              {report.avoid_if.map((r, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Category scores */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-4 text-lg">Detailed Scores</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {report.categories.map((cat) => (
              <CategoryScoreCard key={cat.category} category={cat} />
            ))}
          </div>
        </div>

        {/* Compare CTA */}
        <div className="bg-slate-900 rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">Compare {company.name} with other companies</p>
            <p className="text-slate-400 text-sm mt-0.5">See how it stacks up side by side</p>
          </div>
          <Link
            href={`/compare?a=${company.slug}`}
            className="bg-white text-slate-900 hover:bg-slate-100 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            Compare →
          </Link>
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </DashboardLayout>
  )
}
