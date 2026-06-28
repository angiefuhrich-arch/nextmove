'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Search, Sparkles, Bookmark, GitCompare,
  TrendingUp, TrendingDown, Clock, Zap, ExternalLink,
  ChevronRight, Award, Circle,
} from 'lucide-react'
import { companies } from '@/lib/data/mockData'
import { VerdictBadge } from '@/components/scarsian/VerdictBadge'
import { ScoreCard } from '@/components/scarsian/ScoreCard'
import { Footer } from '@/components/scarsian/Footer'

function Sparkline({ data, color = '#2563EB', width = 280, height = 60 }: {
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
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
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

const sentimentColors = {
  positive: { dot: 'bg-verdict-green', badge: 'text-verdict-green bg-verdict-green/10' },
  negative: { dot: 'bg-verdict-red', badge: 'text-verdict-red bg-verdict-red/10' },
  neutral:  { dot: 'bg-verdict-amber', badge: 'text-verdict-amber bg-verdict-amber/10' },
} as const

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params?.companyId as string
  const [sigFilter, setSigFilter] = useState('All')

  const company = companies.find(c => c.id === companyId)

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-16 px-6 bg-surface">
        <Search className="w-16 h-16 text-ink-quaternary mb-4" />
        <h1 className="text-xl font-bold text-ink mb-2">Company not found</h1>
        <p className="text-ink-secondary mb-6 text-sm">We don&apos;t have intelligence on &quot;{companyId}&quot; yet.</p>
        <button onClick={() => router.push('/')} className="px-6 py-2.5 bg-brand text-white rounded-xl text-sm hover:bg-brand-hover transition-colors">
          Back to home
        </button>
      </div>
    )
  }

  const trend = generateTrend(company.indexScore)
  const sigTabs = ['All', ...Array.from(new Set(company.signals.map(s => s.category)))]
  const filtered = sigFilter === 'All' ? company.signals : company.signals.filter(s => s.category === sigFilter)

  return (
    <div className="min-h-screen bg-surface pt-14">

      {/* ===== COMPANY HEADER ===== */}
      <section className="pt-10 md:pt-14 pb-10 px-6 border-b border-divider bg-surface-elevated">
        <div className="max-w-[800px] mx-auto">
          {/* Breadcrumb */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-[11px] mb-6 text-ink-tertiary">
            <button onClick={() => router.push('/')} className="text-brand hover:underline">Home</button>
            <ChevronRight className="w-3 h-3" />
            <span>{company.name}</span>
          </motion.div>

          {/* Company identity */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-surface-subdued border border-divider flex items-center justify-center text-base font-bold text-ink-secondary">
                {company.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink">{company.name}</h1>
                <p className="text-sm text-ink-tertiary">{company.industry} · {company.country}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {[{ icon: Bookmark, label: 'Add to Watchlist' }, { icon: GitCompare, label: 'Compare' }].map(a => (
                <button key={a.label} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs text-ink-secondary border border-divider hover:bg-surface-subdued transition-all">
                  <a.icon className="w-3.5 h-3.5" />{a.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== SCARSIAN INDEX HERO ===== */}
      <section className="py-12 px-6 border-b border-divider">
        <div className="max-w-[800px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-[3px] text-brand/70 mb-2">Scarsian Index™</div>

            <div className="text-[80px] sm:text-[100px] font-bold text-ink tracking-[-4px] leading-[0.9] mb-4">
              {company.indexScore}
            </div>

            {/* Blue progress bar */}
            <div className="w-64 mx-auto h-2 bg-surface-subdued rounded-full mb-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${company.indexScore}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-full bg-brand rounded-full"
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs mb-4">
              <VerdictBadge verdict={company.verdict} size="md" />
              <span className="text-ink-quaternary">·</span>
              <span className="text-ink-secondary">Confidence <strong className="text-ink">{company.confidence}%</strong></span>
              <span className="text-ink-quaternary">·</span>
              {company.trend.direction === 'up'
                ? <TrendingUp className="w-3.5 h-3.5 text-verdict-green" />
                : <TrendingDown className="w-3.5 h-3.5 text-verdict-red" />}
              <span className={company.trend.direction === 'up' ? 'text-verdict-green font-semibold' : 'text-verdict-red font-semibold'}>
                {company.trend.value}
              </span>
              <span className="text-ink-quaternary">·</span>
              <span className="text-ink-tertiary">{company.lastUpdated}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== EXECUTIVE SUMMARY ===== */}
      <section className="px-6 py-10 border-b border-divider">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-3.5 h-3.5 text-brand" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand">Executive Summary™</span>
          </div>
          <div className="scarsian-card p-6">
            <p className="text-sm text-ink-secondary leading-relaxed">{company.aiSummary.split('\n\n')[0]}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {company.highlights.map(h => (
                <span key={h} className="px-2.5 py-1 rounded-full text-[11px] font-medium text-brand bg-brand-light border border-brand/20">{h}</span>
              ))}
            </div>
            <p className="text-[11px] text-ink-tertiary mt-4 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI-generated summary. Requires analyst approval before publication.
            </p>
          </div>
        </div>
      </section>

      {/* ===== EVIDENCE CONFIDENCE ===== */}
      <section className="px-6 py-10 border-b border-divider">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-3.5 h-3.5 text-brand" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand">Evidence Confidence™</span>
          </div>
          <div className="scarsian-card p-6">
            <div className="flex items-center gap-3 mb-4">
              {/* Pill dots */}
              <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < Math.round(company.confidence / 10) ? 'bg-brand' : 'bg-divider'}`} />
                ))}
              </div>
              <span className="text-sm font-bold text-ink">{company.confidence}%</span>
              <span className="text-xs text-ink-secondary">
                {company.confidence >= 80 ? 'High Confidence' : company.confidence >= 60 ? 'Medium Confidence' : 'Low Confidence'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center border-t border-divider pt-4">
              <div>
                <div className="text-lg font-bold text-ink">{company.signals.length}</div>
                <div className="text-[11px] text-ink-tertiary">Signals</div>
              </div>
              <div>
                <div className="text-lg font-bold text-ink">{company.sources.length}</div>
                <div className="text-[11px] text-ink-tertiary">Sources</div>
              </div>
              <div>
                <div className="text-lg font-bold text-ink">{company.categories.length}</div>
                <div className="text-[11px] text-ink-tertiary">Dimensions</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 5 CORE DIMENSIONS ===== */}
      <section className="px-6 py-10 border-b border-divider">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center gap-2 mb-5">
            <Circle className="w-3 h-3 text-brand fill-brand" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand">5 Core Dimensions</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {company.categories.map((cat, i) => (
              <ScoreCard key={cat.name} category={cat} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== KEY FINDINGS ===== */}
      <section className="px-6 py-10 border-b border-divider">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Circle className="w-3 h-3 text-brand fill-brand" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand">Key Findings</span>
            </div>
            <span className="text-[11px] text-ink-tertiary">{company.signals.length} findings</span>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
            {sigTabs.map(tab => (
              <button key={tab} onClick={() => setSigFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                  sigFilter === tab
                    ? 'bg-brand/10 text-brand border border-brand/20'
                    : 'text-ink-tertiary hover:text-ink-secondary border border-transparent'
                }`}
              >{tab}</button>
            ))}
          </div>

          {/* Findings list */}
          <div className="flex flex-col">
            {filtered.map((s, i) => {
              const colors = sentimentColors[s.sentiment as keyof typeof sentimentColors] ?? sentimentColors.neutral
              return (
                <motion.div key={s.id}
                  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.02 }}
                  className="flex items-start gap-3 py-3 border-b border-divider last:border-0 hover:bg-surface-subdued -mx-2 px-2 rounded-lg transition-colors cursor-default group"
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${colors.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-ink-secondary leading-snug group-hover:text-ink transition-colors">{s.text}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-ink-tertiary font-medium uppercase">{s.category}</span>
                      <span className="text-[10px] text-ink-quaternary">{s.date}</span>
                      <a href={`#`} className="text-[10px] text-brand hover:underline">{s.source}</a>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${colors.badge}`}>{s.sentiment}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== EMPLOYER OUTLOOK ===== */}
      <section className="px-6 py-10 border-b border-divider">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-3.5 h-3.5 text-brand" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand">Employer Outlook™</span>
          </div>
          <div className="scarsian-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-ink">Index Trend</div>
                <div className="text-xs text-ink-tertiary">Last 6 months</div>
              </div>
              <div className={`text-sm font-bold ${company.trend.direction === 'up' ? 'text-verdict-green' : 'text-verdict-red'}`}>
                {company.trend.value}
              </div>
            </div>
            <div className="flex justify-center mb-2">
              <Sparkline data={trend.points} width={680} height={80} />
            </div>
            <div className="flex justify-between text-[10px] text-ink-tertiary px-1">
              {trend.labels.map(l => <span key={l}>{l}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* ===== TIMELINE ===== */}
      <section className="px-6 py-10 border-b border-divider">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-3.5 h-3.5 text-brand" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand">Timeline</span>
          </div>
          <div className="relative">
            <div className="absolute left-[62px] top-0 bottom-0 w-px bg-divider" />
            <div className="flex flex-col">
              {company.signals.map((s, i) => {
                const colors = sentimentColors[s.sentiment as keyof typeof sentimentColors] ?? sentimentColors.neutral
                return (
                  <motion.div key={s.id}
                    initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-4 py-3 group"
                  >
                    <div className="w-[52px] text-right flex-shrink-0">
                      <span className="text-[11px] text-ink-tertiary font-medium">{s.date}</span>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 border-2 border-white ${colors.dot}`} />
                    <div className="flex-1">
                      <span className="text-[13px] text-ink-secondary group-hover:text-ink transition-colors leading-snug">{s.text}</span>
                      <span className="ml-2 inline-block text-[10px] px-2 py-0.5 rounded-full bg-surface-subdued text-ink-tertiary border border-divider">{s.category}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOURCES ===== */}
      <section className="px-6 py-10">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center gap-2 mb-5">
            <ExternalLink className="w-3.5 h-3.5 text-brand" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand">Sources</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {company.sources.map(src => (
              <a key={src.name} href={`https://${src.url}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-divider bg-surface-elevated text-[11px] text-ink-secondary hover:border-brand/30 hover:text-brand transition-colors"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                {src.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
