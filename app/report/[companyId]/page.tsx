'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Search, Sparkles, Bookmark, GitCompare, Share2,
  TrendingUp, TrendingDown, Clock, Zap, ArrowRight,
  ChevronRight, ExternalLink, Award, Circle,
} from 'lucide-react'
import { companies } from '@/lib/data/mockData'
import { VerdictBadge } from '@/components/scarsian/VerdictBadge'
import { ScoreCard } from '@/components/scarsian/ScoreCard'
import { Footer } from '@/components/scarsian/Footer'

function Sparkline({ data, color = '#3B5BFF', width = 280, height = 60 }: {
  data: number[]; color?: string; width?: number; height?: number
}) {
  const min = Math.min(...data) - 2
  const max = Math.max(...data) + 2
  const range = max - min || 1
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * height,
  }))
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkGrad)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 3.5 : 1.5}
          fill={i === points.length - 1 ? color : `${color}66`} />
      ))}
    </svg>
  )
}

const generateTrend = (base: number) => ({
  points: [base - 10, base - 7, base - 3, base + 1, base - 2, base],
  labels: ['6M', '5M', '4M', '3M', '2M', 'Now'],
})

const impactColors = {
  positive: { dot: 'bg-verdict-green', bg: 'bg-verdict-green/10' },
  negative: { dot: 'bg-verdict-red', bg: 'bg-verdict-red/10' },
  neutral:  { dot: 'bg-white/30',     bg: 'bg-white/5' },
} as const

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params?.companyId as string
  const [sigFilter, setSigFilter] = useState('All')

  const company = companies.find(c => c.id === companyId)

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-16 px-6">
        <Search className="w-16 h-16 text-white/20 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Company not found</h1>
        <p className="text-white/50 mb-6 text-sm">We don&apos;t have intelligence on &quot;{companyId}&quot; yet.</p>
        <button onClick={() => router.push('/')} className="px-6 py-2.5 bg-blue text-white rounded-xl text-sm hover:bg-blue-hover transition-colors">
          Back to home
        </button>
      </div>
    )
  }

  const trend = generateTrend(company.indexScore)
  const sigTabs = ['All', ...Array.from(new Set(company.signals.map(s => s.category)))]
  const filtered = sigFilter === 'All' ? company.signals : company.signals.filter(s => s.category === sigFilter)

  return (
    <div className="min-h-screen pt-16">

      {/* ===== HERO: THE INDEX ===== */}
      <section className="relative pt-10 md:pt-16 pb-12 px-6">
        <div className="relative z-10 max-w-[800px] mx-auto">
          {/* Breadcrumb */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-[11px] mb-6">
            <button onClick={() => router.push('/')} className="text-blue hover:underline">Home</button>
            <ChevronRight className="w-3 h-3 text-white/20" />
            <span className="text-white/40">{company.name}</span>
          </motion.div>

          {/* Giant Score */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
            <div className="text-[11px] font-bold uppercase tracking-[3px] text-blue/70 mb-3">Scarsian Index™</div>

            <div className="text-[80px] sm:text-[100px] md:text-[120px] font-bold text-white tracking-[-4px] leading-[0.9] mb-4">
              {company.indexScore}
            </div>

            {/* Sparkline */}
            <div className="flex justify-center mb-4 opacity-70">
              <Sparkline data={trend.points} width={240} height={48} />
            </div>

            {/* Meta bar */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs mb-6">
              <VerdictBadge verdict={company.verdict} size="md" />
              <span className="text-white/30">|</span>
              <span className="text-white/50">Confidence <strong className="text-white">{company.confidence}%</strong></span>
              <span className="text-white/30">|</span>
              {company.trend.direction === 'up'
                ? <TrendingUp className="w-3.5 h-3.5 text-verdict-green" />
                : <TrendingDown className="w-3.5 h-3.5 text-verdict-red" />}
              <span className={company.trend.direction === 'up' ? 'text-verdict-green font-semibold' : 'text-verdict-red font-semibold'}>
                {company.trend.value}
              </span>
              <span className="text-white/30">|</span>
              <span className="text-white/40">{company.lastUpdated}</span>
            </div>

            {/* Company meta */}
            <div className="flex items-center justify-center gap-3 text-xs text-white/40 mb-6">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                {company.name.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-white/60 font-medium">{company.name}</span>
              <span>{company.industry}</span>
              <span>{company.country}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-2">
              {[{ icon: Bookmark, label: 'Watch' }, { icon: GitCompare, label: 'Compare' }, { icon: Share2, label: 'Share' }].map(a => (
                <button key={a.label} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/10 transition-all">
                  <a.icon className="w-3.5 h-3.5" />{a.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== AI ANALYST ===== */}
      <section className="px-6 pb-12 border-t border-white/[0.06] pt-10">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-3.5 h-3.5 text-blue" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue">AI Analyst</span>
          </div>
          <div className="scarsian-card p-6">
            <p className="text-sm text-white/70 leading-relaxed">{company.aiSummary.split('\n\n')[0]}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {company.highlights.map(h => (
                <span key={h} className="px-2.5 py-1 rounded-full text-[11px] font-medium text-blue/80 bg-blue/10 border border-blue/20">{h}</span>
              ))}
            </div>
            <p className="text-[11px] text-white/30 mt-4 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI-generated summary. Requires analyst approval before publication.
            </p>
          </div>
        </div>
      </section>

      {/* ===== CATEGORY SCORES ===== */}
      <section className="px-6 pb-12">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-3.5 h-3.5 text-blue" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue">Categories</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {company.categories.map((cat, i) => (
              <ScoreCard key={cat.name} category={cat} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== SIGNALS ===== */}
      <section className="px-6 pb-12 border-t border-white/[0.06] pt-10">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Circle className="w-3 h-3 text-blue fill-blue" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue">Signals</span>
            </div>
            <span className="text-[11px] text-white/30">{company.signals.length} signals</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-3 overflow-x-auto">
            {sigTabs.map(tab => (
              <button key={tab} onClick={() => setSigFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                  sigFilter === tab ? 'bg-blue/15 text-blue' : 'text-white/35 hover:text-white/60'
                }`}
              >{tab}</button>
            ))}
          </div>

          {/* Signal feed */}
          <div className="flex flex-col">
            {filtered.map((s, i) => (
              <motion.div key={s.id}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.02 }}
                className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-default group"
              >
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                  s.sentiment === 'positive' ? 'bg-verdict-green' : s.sentiment === 'negative' ? 'bg-verdict-red' : 'bg-verdict-amber'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-white/75 leading-snug group-hover:text-white/90 transition-colors">{s.text}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-white/30 font-medium uppercase">{s.category}</span>
                    <span className="text-[10px] text-white/20">{s.date}</span>
                    <span className="text-[10px] text-blue/50">{s.source}</span>
                  </div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                  s.sentiment === 'positive' ? 'text-verdict-green bg-verdict-green/10' :
                  s.sentiment === 'negative' ? 'text-verdict-red bg-verdict-red/10' :
                  'text-verdict-amber bg-verdict-amber/10'
                }`}>{s.sentiment}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TREND DETAIL ===== */}
      <section className="px-6 pb-12 border-t border-white/[0.06] pt-10">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-3.5 h-3.5 text-blue" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue">Index Trend</span>
          </div>
          <div className="scarsian-card p-6">
            <div className="flex items-end gap-1 mb-6" style={{ height: '120px' }}>
              {trend.points.map((v, i) => {
                const prev = i > 0 ? trend.points[i - 1] : v
                const up = v >= prev
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-xs font-bold text-white tabular-nums">{v}</span>
                    <div className="w-full bg-white/5 rounded-sm relative" style={{ height: '80px' }}>
                      <motion.div
                        initial={{ height: 0 }} whileInView={{ height: `${(v / 100) * 80}px` }}
                        viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
                        style={{ position: 'absolute', bottom: 0, width: '100%' }}
                        className={`rounded-sm ${up ? 'bg-gradient-to-t from-blue/50 to-blue/20' : 'bg-gradient-to-t from-verdict-red/30 to-verdict-red/10'}`}
                      />
                    </div>
                    <span className="text-[10px] text-white/30">{trend.labels[i]}</span>
                  </div>
                )
              })}
            </div>
            <div className="space-y-2 pt-4 border-t border-white/[0.06]">
              {company.signals.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <ArrowRight className="w-3 h-3 text-blue/50 flex-shrink-0" />
                  <span className="text-white/40 whitespace-nowrap">{s.date}:</span>
                  <span className="text-white/60 truncate">{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== TIMELINE ===== */}
      <section className="px-6 pb-12 border-t border-white/[0.06] pt-10">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-3.5 h-3.5 text-blue" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue">Event Timeline</span>
          </div>
          <div className="relative">
            <div className="absolute left-[60px] top-0 bottom-0 w-px bg-white/[0.06]" />
            <div className="flex flex-col">
              {company.signals.map((s, i) => (
                <motion.div key={s.id}
                  initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-4 py-2.5 group"
                >
                  <div className="w-[52px] text-right flex-shrink-0">
                    <span className="text-[11px] text-white/30 font-medium">{s.date}</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${impactColors[s.sentiment as keyof typeof impactColors].dot}`} />
                  <div className="flex-1">
                    <span className="text-[13px] text-white/70 group-hover:text-white/90 transition-colors">{s.text}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOURCES ===== */}
      <section className="px-6 pb-12">
        <div className="max-w-[800px] mx-auto">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {company.sources.map(src => (
              <a key={src.name} href={`https://${src.url}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-white/35 hover:text-white/60 transition-colors"
              >
                <ExternalLink className="w-2.5 h-2.5" />{src.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
