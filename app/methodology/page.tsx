'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  FileText, Landmark, Globe, Newspaper, Star, Shield,
  ArrowLeft, ChevronRight, BarChart3, Check, Lock, TrendingUp,
} from 'lucide-react'
import { Footer } from '@/components/scarsian/Footer'

const sections = [
  {
    title: 'Data Collection',
    icon: FileText,
    content: `Scarsian collects data exclusively from publicly available, independently verifiable sources. We do not use anonymous reviews, unverified social media posts, or paid placement data.\n\nEvery piece of evidence in an Intelligence Brief can be traced back to its original public source. If we cannot verify it, we do not include it.`,
    sources: [
      { icon: FileText, name: 'SEC EDGAR Filings', desc: 'Quarterly and annual financial reports filed with the U.S. Securities and Exchange Commission' },
      { icon: Landmark, name: 'Government Registries', desc: 'Corporate registration data, tax filings, and regulatory disclosures' },
      { icon: Globe, name: 'Company Websites', desc: 'Official career pages, press releases, and corporate announcements' },
      { icon: Newspaper, name: 'Verified Business News', desc: 'Established publications with editorial standards (Bloomberg, Reuters, Financial Times)' },
      { icon: Star, name: 'Glassdoor (Supplementary)', desc: 'Community-contributed reviews treated as sentiment signals, not primary evidence' },
    ],
  },
  {
    title: 'Evidence Weighting',
    icon: Shield,
    content: `Not all sources are equal. Scarsian assigns a trust weight to every source based on verification standards, editorial oversight, and regulatory backing.\n\nGovernment filings and audited annual reports receive the highest weight. Community-contributed data receives the lowest and is always cross-referenced against primary sources.`,
    weights: [
      { stars: 5, label: 'SEC Filings & Annual Reports', desc: 'Government-regulated, legally binding, independently audited' },
      { stars: 5, label: 'Government Registries', desc: 'Official corporate records with legal standing' },
      { stars: 4, label: 'Established News Outlets', desc: 'Editorial oversight, fact-checking, professional journalists' },
      { stars: 3, label: 'Professional Networks', desc: 'Self-reported data with verification mechanisms' },
      { stars: 2, label: 'Company Sources', desc: 'Useful for official positions but naturally biased' },
      { stars: 1, label: 'Community Sources', desc: 'Anonymous posts. Used cautiously for sentiment only' },
    ],
  },
  {
    title: 'How Evidence Confidence Works',
    icon: Shield,
    content: `Evidence Confidence reflects the volume, recency, and diversity of sources behind an Intelligence Brief. It answers the question: how much verified evidence supports this score?\n\nA high confidence score means multiple independent sources consistently support the findings. A lower confidence score does not mean the data is wrong — it simply means fewer public sources are available.`,
    levels: [
      { range: '85-100%', label: 'High Confidence', desc: 'Abundant recent data from diverse sources' },
      { range: '65-84%', label: 'Moderate Confidence', desc: 'Sufficient data from multiple sources' },
      { range: '45-64%', label: 'Developing', desc: 'Limited data, emerging picture' },
      { range: '0-44%', label: 'Early', desc: 'Sparse data, preliminary assessment' },
    ],
  },
  {
    title: 'How the Scarsian Index is Calculated',
    icon: BarChart3,
    content: `The Scarsian Index is a composite score from 0 to 100 derived from five core dimensions. Each dimension is scored independently based on verified evidence, then weighted into a single score.\n\nThe five dimensions are designed to capture what matters most to career decisions: financial stability, leadership quality, growth potential, compensation competitiveness, and cultural environment.`,
    dimensions: [
      { name: 'Financial Strength', weight: '25%', desc: 'Revenue growth, profitability, cash position, debt levels, market performance' },
      { name: 'Leadership', weight: '20%', desc: 'CEO tenure, executive stability, board independence, leadership turnover' },
      { name: 'Career Growth', weight: '20%', desc: 'Internal mobility, promotion velocity, learning investment, hiring trends' },
      { name: 'Compensation', weight: '20%', desc: 'Salary benchmarks, equity packages, bonus structures, pay transparency' },
      { name: 'Culture', weight: '15%', desc: 'Employee sentiment, work-life balance, DEI indicators, retention rates' },
    ],
  },
  {
    title: 'Why Anonymous Opinions Are Not Enough',
    icon: Lock,
    content: `Anonymous reviews and social media posts can be valuable for sentiment, but they lack verification, accountability, and consistency. Scarsian treats community data as supplementary signals — never as primary evidence.\n\nThis is why Scarsian does not publish an overall employer rating based on user reviews. Instead, every dimension score is backed by specific, attributable evidence from trusted public sources.`,
  },
  {
    title: 'Version History & Transparency',
    icon: TrendingUp,
    content: `Scarsian maintains a complete version history for every Intelligence Brief. Each update is logged with the sources that triggered the change, the date of the update, and the dimension scores before and after.\n\nThis means you can always see why a score changed and what evidence drove the change. Transparency is not a feature — it is the foundation of the Scarsian Method.`,
  },
]

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < count ? 'text-amber-400 fill-amber-400' : 'text-divider'}`} />
      ))}
    </div>
  )
}

export default function MethodologyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-surface pt-14">
      <div className="max-w-[720px] mx-auto px-6 py-12 md:py-16">

        <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-[11px] text-ink-tertiary hover:text-brand transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" />Back to Intelligence Center
        </button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-brand" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand">Scarsian Method&trade;</span>
          </div>
          <h1 className="text-3xl md:text-[44px] font-bold text-ink tracking-[-1px] mb-4">Our Methodology</h1>
          <p className="text-sm text-ink-secondary leading-relaxed max-w-[540px]">
            Every Intelligence Brief is built on a rigorous, transparent methodology. We believe you deserve to understand exactly how we arrive at every score.
          </p>
        </motion.div>

        {/* Principles */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-14">
          {[
            { label: 'Evidence-First', desc: 'No score without verified sources' },
            { label: 'Transparent', desc: 'Every claim traced to its origin' },
            { label: 'Independent', desc: 'No company can influence scores' },
          ].map((p) => (
            <div key={p.label} className="bg-white border border-divider rounded-xl p-4 shadow-card">
              <Check className="w-4 h-4 text-emerald-500 mb-2" />
              <div className="text-sm font-semibold text-ink">{p.label}</div>
              <div className="text-[11px] text-ink-tertiary">{p.desc}</div>
            </div>
          ))}
        </motion.div>

        {/* Sections */}
        <div className="flex flex-col gap-10">
          {sections.map((section) => (
            <motion.section
              key={section.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: 0.05 }}
              className="border-t border-divider pt-8"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <section.icon className="w-4 h-4 text-brand" />
                <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
              </div>
              <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-line mb-6">{section.content}</p>

              {'sources' in section && section.sources && (
                <div className="flex flex-col gap-2 mb-4">
                  {section.sources.map((s) => (
                    <div key={s.name} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-divider">
                      <s.icon className="w-4 h-4 text-brand/60 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-ink">{s.name}</div>
                        <div className="text-[11px] text-ink-tertiary">{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {'weights' in section && section.weights && (
                <div className="bg-white border border-divider rounded-xl overflow-hidden shadow-card mb-4">
                  {section.weights.map((w, i) => (
                    <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < section.weights!.length - 1 ? 'border-b border-divider' : ''}`}>
                      <StarRating count={w.stars} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink">{w.label}</div>
                        <div className="text-[11px] text-ink-tertiary">{w.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {'levels' in section && section.levels && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {section.levels.map((l, i) => (
                    <div key={i} className="bg-white border border-divider rounded-xl p-4 shadow-card">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-brand">{l.range}</span>
                        <span className="text-xs font-semibold text-ink">{l.label}</span>
                      </div>
                      <p className="text-[11px] text-ink-tertiary">{l.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {'dimensions' in section && section.dimensions && (
                <div className="bg-white border border-divider rounded-xl overflow-hidden shadow-card mb-4">
                  {section.dimensions.map((d, i) => (
                    <div key={i} className={`flex items-center gap-4 px-4 py-3.5 ${i < section.dimensions!.length - 1 ? 'border-b border-divider' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-ink">{d.name}</span>
                          <span className="text-[10px] font-bold text-brand bg-brand-light px-1.5 py-0.5 rounded">{d.weight}</span>
                        </div>
                        <div className="text-[11px] text-ink-tertiary">{d.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>
          ))}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="mt-14 text-center py-10 border-t border-divider">
          <p className="text-sm text-ink-secondary mb-4">Ready to see the methodology in action?</p>
          <button onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-hover text-white font-semibold rounded-xl text-sm transition-all">
            Search an Employer
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}
