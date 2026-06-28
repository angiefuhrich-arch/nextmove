// /brief/[entitySlug] — canonical Intelligence Brief route

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Zap, Award, TrendingUp, TrendingDown, Clock, ExternalLink, Search, Sparkles } from 'lucide-react'
import { getEntityBySlug } from '@/lib/dal/entities'
import { getLatestApprovedSnapshot, getTrendPoints } from '@/lib/dal/snapshots'
import { getPublishedReportForEntity } from '@/lib/dal/analyst-reports'
import { getActiveSignalsForEntity } from '@/lib/dal/signals'
import { getEvidenceForEntity } from '@/lib/dal/evidence'
import { createAdminClient } from '@/lib/supabase/admin'
import { SignalTabs } from './SignalTabs'
import { Footer } from '@/components/scarsian/Footer'
import { ConfidenceBadge } from '@/components/ds/ConfidenceBadge'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// ── Trend sparkline (server-rendered SVG) ────────────────────────────────────

function Sparkline({ points, color = '#0E5A5E', width = 680, height = 80 }: {
  points: number[]; color?: string; width?: number; height?: number
}) {
  if (points.length < 2) return null
  const min = Math.min(...points) - 2
  const max = Math.max(...points) + 2
  const range = max - min || 1
  const coords = points.map((v, i) => ({
    x: (i / (points.length - 1)) * width,
    y: height - ((v - min) / range) * height,
  }))
  const pathD = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible w-full">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkGrad)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === coords.length - 1 ? 3.5 : 1.5}
          fill={i === coords.length - 1 ? color : `${color}66`} />
      ))}
    </svg>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const SCORE_DIMS: Array<{ key: 'cgs_score' | 'crs_score' | 'mvs_score' | 'cfs_score' | 'gfi_score'; label: string }> = [
  { key: 'cgs_score', label: 'Culture & Growth' },
  { key: 'crs_score', label: 'Comp & Retention' },
  { key: 'mvs_score', label: 'Mission & Vision' },
  { key: 'cfs_score', label: 'Career Fit' },
  { key: 'gfi_score', label: 'GFI' },
]

function dimColor(score: number) {
  if (score >= 70) return { text: 'text-status-success', bar: 'bg-status-success' }
  if (score >= 45) return { text: 'text-status-warning', bar: 'bg-status-warning' }
  return { text: 'text-status-danger', bar: 'bg-status-danger' }
}

function verdictLabel(verdict: string | null): string {
  if (!verdict) return 'No verdict'
  return verdict.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function verdictClasses(verdict: string | null): string {
  if (verdict === 'strong_move') return 'badge-strong-move'
  if (verdict === 'consider')    return 'badge-consider'
  if (verdict === 'high_risk')   return 'badge-high-risk'
  return 'px-3 py-1 rounded-full text-caption font-semibold bg-surface-subdued text-ink-secondary border border-divider'
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function BriefPage({
  params,
}: {
  params: Promise<{ entitySlug: string }>
}) {
  const { entitySlug } = await params

  // Entity lookup — v4 entities table first, fall back to legacy companies
  let entityId: string | null = null
  let entityName = ''
  let entityIndustry: string | null = null
  let entityMarket: string | null = null

  const entity = await getEntityBySlug(entitySlug, 'company')
  if (entity) {
    entityId = entity.id
    entityName = entity.name
    entityMarket = entity.market ?? null
    entityIndustry = (entity.metadata as Record<string, string> | null)?.industry ?? null
  } else {
    // Try legacy companies table
    const admin = createAdminClient()
    const { data: legacy } = await admin
      .from('companies')
      .select('id,name,slug,industry,headquarters')
      .eq('slug', entitySlug)
      .maybeSingle()
    if (!legacy) notFound()
    entityName = legacy.name
    entityIndustry = legacy.industry ?? null
    entityMarket = legacy.headquarters ?? null
  }

  // Parallel data fetches — all from real intelligence tables
  const [snapshot, report, signals, evidence, trendPoints] = await Promise.all([
    entityId ? getLatestApprovedSnapshot(entityId) : null,
    entityId ? getPublishedReportForEntity(entityId) : null,
    entityId ? getActiveSignalsForEntity(entityId) : [],
    entityId ? getEvidenceForEntity(entityId, { limit: 50 }) : [],
    entityId ? getTrendPoints(entityId, 12) : [],
  ])

  const indexScore = snapshot?.scarsian_score ?? null
  const confidence = snapshot?.confidence_score ?? null
  const verdict = snapshot?.verdict ?? null

  const trendScores = trendPoints.map(p => p.scarsian_score)
  const trendUp = trendScores.length >= 2 && trendScores[trendScores.length - 1] > trendScores[0]

  return (
    <div className="min-h-screen bg-surface pt-14">

      {/* ── COMPANY HEADER ─────────────────────────────────────────── */}
      <section className="pt-10 md:pt-14 pb-10 px-6 border-b border-divider bg-surface-elevated">
        <div className="max-w-[800px] mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 mb-6 text-label text-ink-tertiary">
            <Link href="/" className="text-brand hover:underline">Intelligence Center</Link>
            <ChevronRight className="w-3 h-3" />
            <span>{entityName}</span>
          </div>

          {/* Identity */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-surface-subdued border border-divider flex items-center justify-center text-title-sm font-bold text-ink-secondary">
              {entityName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-title-lg text-ink font-bold">{entityName}</h1>
              <p className="text-body-sm text-ink-tertiary">
                {[entityIndustry, entityMarket].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SCARSIAN INDEX HERO ────────────────────────────────────── */}
      <section className="py-12 px-6 border-b border-divider">
        <div className="max-w-[800px] mx-auto text-center">
          <p className="text-label font-bold uppercase tracking-[3px] text-brand/70 mb-2">Scarsian Index™</p>

          {indexScore !== null ? (
            <>
              <div className="text-metric-xl text-ink mb-4">{Math.round(indexScore)}</div>

              <div className="w-64 mx-auto h-2 bg-surface-subdued rounded-full mb-4 overflow-hidden">
                <div className="h-full bg-brand rounded-full transition-all duration-slow" style={{ width: `${indexScore}%` }} />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 text-body-sm mb-4">
                <span className={cn('px-3 py-1 text-caption font-bold uppercase tracking-wide', verdictClasses(verdict))}>
                  {verdictLabel(verdict)}
                </span>
                {confidence !== null && (
                  <>
                    <span className="text-ink-quaternary">·</span>
                    <ConfidenceBadge value={Math.round(confidence * 100)} />
                  </>
                )}
                {trendScores.length >= 2 && (
                  <>
                    <span className="text-ink-quaternary">·</span>
                    {trendUp
                      ? <TrendingUp className="w-3.5 h-3.5 text-verdict-green" />
                      : <TrendingDown className="w-3.5 h-3.5 text-verdict-red" />}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="py-8">
              <Search className="w-10 h-10 text-ink-quaternary mx-auto mb-3" />
              <p className="text-title-sm text-ink">No approved score yet</p>
              <p className="text-body-sm text-ink-tertiary mt-1">Intelligence is being collected for this employer.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── EXECUTIVE SUMMARY ──────────────────────────────────────── */}
      {report && (
        <section className="px-6 py-10 border-b border-divider">
          <div className="max-w-[800px] mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-3.5 h-3.5 text-brand" />
              <span className="text-label font-bold uppercase tracking-widest text-brand">Executive Summary™</span>
            </div>
            <div className="scarsian-card p-6">
              <p className="text-body-sm text-ink-secondary leading-relaxed">{report.summary}</p>

              {report.strengths.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {report.strengths.slice(0, 5).map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-label font-medium text-brand bg-brand-light border border-brand/20">
                      {s.text}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-caption text-ink-tertiary mt-4 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Analyst-approved summary.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── EVIDENCE CONFIDENCE ────────────────────────────────────── */}
      {snapshot && (
        <section className="px-6 py-10 border-b border-divider">
          <div className="max-w-[800px] mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-3.5 h-3.5 text-brand" />
              <span className="text-label font-bold uppercase tracking-widest text-brand">Evidence Confidence™</span>
            </div>
            <div className="scarsian-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn('w-2.5 h-2.5 rounded-full', i < Math.round((snapshot.confidence_score ?? 0) * 10) ? 'bg-brand' : 'bg-divider')}
                    />
                  ))}
                </div>
                <span className="text-body-sm font-bold text-ink">{Math.round((snapshot.confidence_score ?? 0) * 100)}%</span>
                <ConfidenceBadge value={Math.round((snapshot.confidence_score ?? 0) * 100)} />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center border-t border-divider pt-4">
                <div>
                  <div className="text-metric-sm text-ink">{signals.length}</div>
                  <div className="text-caption text-ink-tertiary">Signals</div>
                </div>
                <div>
                  <div className="text-metric-sm text-ink">{evidence.length}</div>
                  <div className="text-caption text-ink-tertiary">Evidence</div>
                </div>
                <div>
                  <div className="text-metric-sm text-ink">
                    {SCORE_DIMS.filter(d => snapshot[d.key] !== null).length}
                  </div>
                  <div className="text-caption text-ink-tertiary">Dimensions</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 5 CORE DIMENSIONS ──────────────────────────────────────── */}
      {snapshot && (
        <section className="px-6 py-10 border-b border-divider">
          <div className="max-w-[800px] mx-auto">
            <p className="text-label font-bold uppercase tracking-widest text-brand mb-5">5 Core Dimensions</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {SCORE_DIMS.map(({ key, label }) => {
                const raw = snapshot[key]
                if (raw === null) return null
                const score = Math.round(raw)
                const { text, bar } = dimColor(raw)
                return (
                  <div key={key} className="scarsian-card p-4 flex flex-col gap-2">
                    <p className="text-label uppercase tracking-[0.06em] text-ink-tertiary">{label}</p>
                    <span className={cn('text-metric-sm font-bold', text)}>{score}</span>
                    <div className="h-1.5 bg-surface-subdued rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', bar)} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── KEY FINDINGS (signals — interactive client component) ─── */}
      {signals.length > 0 && (
        <section className="px-6 py-10 border-b border-divider">
          <div className="max-w-[800px] mx-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-label font-bold uppercase tracking-widest text-brand">Key Findings</p>
              <span className="text-caption text-ink-tertiary">{signals.length} signals</span>
            </div>
            <SignalTabs signals={signals} />
          </div>
        </section>
      )}

      {/* ── EMPLOYER OUTLOOK (trend) ────────────────────────────────── */}
      {trendScores.length >= 2 && (
        <section className="px-6 py-10 border-b border-divider">
          <div className="max-w-[800px] mx-auto">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-3.5 h-3.5 text-brand" />
              <span className="text-label font-bold uppercase tracking-widest text-brand">Employer Outlook™</span>
            </div>
            <div className="scarsian-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-body-sm font-semibold text-ink">Index Trend</p>
                  <p className="text-caption text-ink-tertiary">Last {trendScores.length} snapshots</p>
                </div>
                <span className={cn('text-body-sm font-bold', trendUp ? 'text-verdict-green' : 'text-verdict-red')}>
                  {trendUp ? '▲' : '▼'} {Math.abs(Math.round(trendScores[trendScores.length - 1] - trendScores[0]))} pts
                </span>
              </div>
              <div className="flex justify-center">
                <Sparkline points={trendScores} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── TIMELINE (evidence) ─────────────────────────────────────── */}
      {evidence.length > 0 && (
        <section className="px-6 py-10 border-b border-divider">
          <div className="max-w-[800px] mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-3.5 h-3.5 text-brand" />
              <span className="text-label font-bold uppercase tracking-widest text-brand">Timeline</span>
            </div>
            <div className="relative">
              <div className="absolute left-[62px] top-0 bottom-0 w-px bg-divider" />
              <div className="flex flex-col">
                {evidence.slice(0, 20).map(ev => (
                  <div key={ev.id} className="flex items-start gap-4 py-3 group">
                    <div className="w-[52px] text-right flex-shrink-0">
                      <span className="text-caption text-ink-tertiary font-medium">
                        {ev.evidence_date
                          ? new Date(ev.evidence_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                          : new Date(ev.collected_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                      </span>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 border-2 border-white bg-brand/60" />
                    <div className="flex-1">
                      <p className="text-body-sm text-ink-secondary group-hover:text-ink transition-colors duration-fast leading-snug">
                        {ev.content_summary}
                      </p>
                      <span className="mt-0.5 inline-block text-label px-2 py-0.5 rounded-full bg-surface-subdued text-ink-tertiary border border-divider">
                        {ev.source_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SOURCES ─────────────────────────────────────────────────── */}
      {evidence.length > 0 && (
        <section className="px-6 py-10">
          <div className="max-w-[800px] mx-auto">
            <div className="flex items-center gap-2 mb-5">
              <ExternalLink className="w-3.5 h-3.5 text-brand" />
              <span className="text-label font-bold uppercase tracking-widest text-brand">Sources</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {evidence
                .filter(ev => ev.source_url)
                .slice(0, 20)
                .map(ev => (
                  <a
                    key={ev.id}
                    href={ev.source_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-divider bg-surface-elevated text-caption text-ink-secondary hover:border-brand/30 hover:text-brand transition-colors duration-fast"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    {ev.source_title ?? (() => { try { return new URL(ev.source_url!).hostname } catch { return ev.source_url } })()}
                  </a>
                ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
