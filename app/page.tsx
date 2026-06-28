'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Search, BarChart3, Shield, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
  FileText, Landmark, Globe, Newspaper, Users, Star, Check,
} from 'lucide-react'
import { Constellation } from '@/components/scarsian/Constellation'
import { VerdictBadge } from '@/components/scarsian/VerdictBadge'
import { TrendArrow } from '@/components/scarsian/TrendArrow'
import { Footer } from '@/components/scarsian/Footer'
import { featuredCompanies } from '@/lib/data/mockData'

const trustSources = [
  { icon: FileText, label: 'SEC Filings' },
  { icon: FileText, label: 'Annual Reports' },
  { icon: Landmark, label: 'Government Records' },
  { icon: Globe, label: 'Company Websites' },
  { icon: Newspaper, label: 'Verified News' },
  { icon: BarChart3, label: 'Public Financials' },
  { icon: Users, label: 'LinkedIn Data' },
  { icon: Star, label: 'Glassdoor' },
]

const trustChecks = [
  'Evidence-based',
  'Source verified',
  'Updated continuously',
  'No anonymous rankings',
]

const faqs = [
  { q: 'How does Scarsian calculate the Index score?', a: 'The Scarsian Index is a composite score derived from five core dimensions: financial health, leadership stability, career growth, work-life balance, and compensation competitiveness. Each dimension is weighted and sourced from verified public data.' },
  { q: 'What sources does Scarsian use?', a: 'We index SEC filings, annual reports, government records, verified news, public financials, LinkedIn data, and Glassdoor — all cited and linkable. No anonymous reviews contribute to our core scoring.' },
  { q: 'How often is data updated?', a: 'Data is updated continuously as new sources become available. The "last updated" date on each report reflects the most recent data ingestion.' },
  { q: 'Is Scarsian free to use?', a: 'You receive 3 free reports on signup. After that, full access requires a Career Pass subscription or individual report credits.' },
  { q: 'Which companies are covered?', a: 'We cover companies across every industry and geography, with a focus on Asia and international employers. If a company is not yet indexed, you can request coverage.' },
]

export default function HomePage() {
  const router = useRouter()
  const carouselRef = useRef<HTMLDivElement>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const scrollCarousel = (dir: 'left' | 'right') => {
    carouselRef.current?.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' })
  }

  const openSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
  }

  return (
    <div className="min-h-screen bg-surface">

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-14 pb-20 overflow-hidden brand-gradient">
        {/* Constellation background */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <Constellation width={1200} height={800} nodeCount={24} opacity={0.06} animated={false} variant="background" />
        </div>
        <div className="relative z-10 max-w-[720px] mx-auto text-center flex flex-col items-center">
          {/* Pre-label */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="text-xs font-semibold uppercase tracking-[3px] text-ink-tertiary mb-6"
          >
            Career Intelligence
          </motion.p>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }}
            className="text-5xl md:text-7xl font-bold text-ink tracking-tight leading-[1.05] mb-6"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.03em' }}
          >
            Know before you<br />accept the offer.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-base md:text-lg text-ink-secondary max-w-[480px] leading-relaxed mb-10"
          >
            Research employers with the same rigor investors research companies.
          </motion.p>

          {/* Search bar */}
          <motion.button
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            onClick={openSearch}
            className="mt-10 w-full max-w-[680px] flex items-center gap-4 px-7 py-[18px] rounded-2xl bg-white border border-divider text-ink-tertiary hover:text-ink-secondary hover:border-brand/30 hover:shadow-search transition-all duration-300 shadow-card"
          >
            <Search className="w-6 h-6" />
            <span className="text-lg">Search any employer...</span>
            <div className="ml-auto flex items-center gap-1 text-[11px] text-ink-quaternary border border-divider rounded px-2 py-0.5">
              <span>⌘K</span>
            </div>
          </motion.button>

          {/* Popular searches */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-[11px] text-ink-tertiary max-w-[600px]"
          >
            <span className="text-ink-quaternary mr-1">Popular searches:</span>
            {['Goldman Sachs', 'Google HK', 'HSBC', 'Cathay Pacific'].map((s, i, arr) => (
              <span key={s}>
                <button onClick={openSearch} className="hover:text-brand transition-colors underline underline-offset-2 decoration-divider hover:decoration-brand/40">{s}</button>
                {i < arr.length - 1 && <span className="text-ink-quaternary mx-1">·</span>}
              </span>
            ))}
          </motion.div>

          {/* Value props */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="mt-12 flex flex-col sm:flex-row items-center gap-5 sm:gap-8"
          >
            {['Evidence-based scores', 'Verified sources only', 'Executive summaries'].map(s => (
              <div key={s} className="flex items-center gap-2 text-sm text-ink-tertiary">
                <div className="w-1.5 h-1.5 rounded-full bg-brand/40" />
                {s}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          onClick={() => document.getElementById('trusted-intelligence')?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce-slow"
        >
          <ChevronDown className="w-5 h-5 text-ink-tertiary" />
        </motion.button>
      </section>

      {/* ===== TRUSTED INTELLIGENCE ===== */}
      <section id="trusted-intelligence" className="py-20 md:py-24 px-6 bg-white border-t border-divider">
        <div className="max-w-[800px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-ink tracking-[-0.5px] mb-3">Trusted Intelligence</h2>
            <p className="text-sm text-ink-secondary max-w-[440px] mx-auto leading-relaxed">
              Every employer profile is built from independently verified public sources.
            </p>
          </motion.div>

          {/* Source badges with icons */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-3 mb-10">
            {trustSources.map((src) => (
              <div key={src.label} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-subdued border border-divider">
                <src.icon className="w-3.5 h-3.5 text-brand/60" />
                <span className="text-[11px] font-medium text-ink-secondary">{src.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Trust checks */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {trustChecks.map((check) => (
              <div key={check} className="flex items-center gap-1.5 text-[11px] text-ink-tertiary">
                <Check className="w-3 h-3 text-emerald-500" />
                {check}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURED INTELLIGENCE ===== */}
      <section className="py-24 md:py-28 px-6 bg-surface">
        <div className="max-w-[1000px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-3xl md:text-[44px] font-bold text-ink tracking-[-1px] mb-2">Featured Intelligence</h2>
            <p className="text-sm text-ink-tertiary">Recently analyzed employers</p>
          </motion.div>

          <div className="relative">
            <button
              onClick={() => scrollCarousel('left')}
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-divider shadow-card flex items-center justify-center hover:bg-surface-subdued transition-colors hidden md:flex"
            >
              <ChevronLeft className="w-4 h-4 text-ink-secondary" />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-divider shadow-card flex items-center justify-center hover:bg-surface-subdued transition-colors hidden md:flex"
            >
              <ChevronRight className="w-4 h-4 text-ink-secondary" />
            </button>

            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none' }}
            >
              {featuredCompanies.map((company, i) => (
                <motion.button
                  key={company.id}
                  initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  onClick={() => router.push(`/report/${company.id}`)}
                  className="flex-shrink-0 w-[280px] snap-start bg-white border border-divider rounded-2xl p-6 text-left hover:border-brand/30 hover:shadow-elevated transition-all duration-300 shadow-card"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-surface-subdued border border-divider flex items-center justify-center text-xs font-bold text-ink-secondary">
                      {company.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink">{company.name}</div>
                      <div className="text-[11px] text-ink-tertiary">{company.industry}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-[10px] text-ink-tertiary uppercase tracking-wider">Scarsian Index™</div>
                      <div className="text-2xl font-bold text-ink tabular-nums">{company.indexScore}</div>
                    </div>
                    <VerdictBadge verdict={company.verdict} size="sm" />
                  </div>
                  <TrendArrow trend={company.trend} showLabel={false} />
                  <div className="mt-4 text-xs font-semibold text-brand">View Brief →</div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW SCARSIAN WORKS ===== */}
      <section id="how-it-works" className="py-24 md:py-28 px-6 bg-white relative">
        <div className="max-w-[800px] mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-3xl md:text-[44px] font-bold text-ink text-center mb-12 tracking-[-1px]"
          >
            How Scarsian Works
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Search, title: 'Search any employer', desc: 'Enter a company name. We scan public records, filings, and verified sources.' },
              { icon: BarChart3, title: 'Get the Scarsian Index™', desc: 'Our engine analyzes financial health, leadership, culture, compensation, and growth.' },
              { icon: Shield, title: 'Make your move', desc: 'Strong Move, Consider Carefully, or High Risk. Every claim backed by evidence.' },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white border border-divider rounded-2xl p-7 flex flex-col gap-3.5 shadow-card hover:shadow-elevated transition-shadow"
              >
                <step.icon className="w-7 h-7 text-brand" />
                <h3 className="text-base font-semibold text-ink">{step.title}</h3>
                <p className="text-sm text-ink-tertiary leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-20 md:py-28 px-6 bg-surface border-t border-divider">
        <div className="max-w-[720px] mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-ink text-center mb-12"
          >
            Frequently Asked Questions
          </motion.h2>
          <div className="flex flex-col divide-y divide-divider border border-divider rounded-2xl bg-surface-elevated overflow-hidden">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-surface-subdued transition-colors"
                >
                  <span className="text-sm font-semibold text-ink">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 text-ink-tertiary flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-ink-tertiary flex-shrink-0" />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-ink-secondary leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 md:py-28 px-6 bg-surface-elevated border-t border-divider">
        <div className="max-w-[600px] mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-ink mb-5 tracking-tight"
          >
            Make your next move<br />with confidence.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="text-base text-ink-secondary mb-8"
          >
            Your career priorities. Our intelligence. The right decision.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.2 }}
            onClick={openSearch}
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-brand hover:bg-brand-hover text-white font-semibold rounded-xl text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          >
            <Search className="w-5 h-5" />
            Search a Company
          </motion.button>
          <p className="mt-4 text-xs text-ink-tertiary">3 free reports on signup. Full access with Career Pass.</p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
