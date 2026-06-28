'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Search, BarChart3, Shield, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
} from 'lucide-react'
import { VerdictBadge } from '@/components/scarsian/VerdictBadge'
import { TrendArrow } from '@/components/scarsian/TrendArrow'
import { Footer } from '@/components/scarsian/Footer'
import { featuredCompanies } from '@/lib/data/mockData'

const sourcePills = [
  'SEC Filings', 'Annual Reports', 'Government Records', 'Company Websites',
  'Verified News', 'Public Financials', 'LinkedIn Data', 'Glassdoor',
]

const trustPoints = [
  'All sources cited and linkable',
  'No anonymous reviews in scoring',
  'Updated continuously',
  'Confidence-weighted results',
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
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-14 pb-20 bg-surface">
        <div className="max-w-[720px] mx-auto text-center flex flex-col items-center">
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
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            onClick={openSearch}
            className="w-full max-w-[560px] flex items-center gap-3 px-6 py-4 rounded-full bg-white border border-divider shadow-sm text-ink-tertiary hover:text-ink-secondary hover:border-brand/40 hover:shadow-md transition-all duration-300"
          >
            <Search className="w-5 h-5 text-ink-tertiary" />
            <span className="text-base">Search any company...</span>
            <div className="ml-auto flex items-center gap-1 text-[10px] text-ink-quaternary border border-divider rounded px-2 py-0.5">
              <span>⌘K</span>
            </div>
          </motion.button>

          {/* Popular searches */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
            className="mt-4 flex items-center gap-2 flex-wrap justify-center"
          >
            <span className="text-xs text-ink-tertiary">Popular:</span>
            {['Goldman Sachs', 'Google HK', 'HSBC', 'Cathay Pacific'].map(s => (
              <button key={s} onClick={openSearch} className="text-xs text-brand hover:underline">{s}</button>
            ))}
          </motion.div>

          {/* Value props */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-8"
          >
            {['Evidence-based scores', 'Verified sources only', 'Executive summaries'].map(s => (
              <div key={s} className="flex items-center gap-2 text-sm text-ink-secondary">
                <div className="w-1.5 h-1.5 rounded-full bg-brand" />
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
      <section id="trusted-intelligence" className="py-20 md:py-28 px-6 bg-surface-elevated border-t border-divider">
        <div className="max-w-[800px] mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-ink mb-4"
          >
            Trusted Intelligence
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="text-sm text-ink-secondary mb-10 max-w-[480px] mx-auto"
          >
            Every score is built from verified public sources — never anonymous reviews.
          </motion.p>

          {/* Source pills */}
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2.5 justify-center mb-12"
          >
            {sourcePills.map(s => (
              <span key={s} className="px-3 py-1.5 rounded-full bg-surface-subdued border border-divider text-sm text-ink-secondary font-medium">
                {s}
              </span>
            ))}
          </motion.div>

          {/* Trust checkmarks */}
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {trustPoints.map(p => (
              <div key={p} className="flex items-start gap-2 text-left">
                <svg className="w-4 h-4 text-verdict-green mt-0.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs text-ink-secondary leading-snug">{p}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURED INTELLIGENCE ===== */}
      <section className="py-20 md:py-28 px-6 bg-surface border-t border-divider">
        <div className="max-w-[1100px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-ink mb-2">Featured Intelligence</h2>
            <p className="text-sm text-ink-tertiary">Recent analysis from the Scarsian platform</p>
          </motion.div>

          <div className="relative">
            <button
              onClick={() => scrollCarousel('left')}
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-divider shadow-sm flex items-center justify-center hover:bg-surface-subdued transition-colors hidden md:flex"
            >
              <ChevronLeft className="w-4 h-4 text-ink-secondary" />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-divider shadow-sm flex items-center justify-center hover:bg-surface-subdued transition-colors hidden md:flex"
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
                  className="flex-shrink-0 w-[280px] snap-start scarsian-card p-6 text-left hover:border-brand/30 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-surface-subdued flex items-center justify-center text-xs font-bold text-ink-secondary">
                      {company.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink">{company.name}</div>
                      <div className="text-[11px] text-ink-tertiary">{company.industry}</div>
                    </div>
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-ink-tertiary mb-1">Scarsian Index™</div>
                  <div className="flex items-end justify-between mb-3">
                    <div className="text-4xl font-bold text-ink tracking-tight">{company.indexScore}</div>
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
      <section className="py-20 md:py-28 px-6 bg-surface-elevated border-t border-divider">
        <div className="max-w-[900px] mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-ink text-center mb-14"
          >
            How Scarsian Works
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Search, title: 'Search any company', desc: 'Enter a company name. We index companies across every industry and geography in Asia and beyond.' },
              { icon: BarChart3, title: 'Get the Scarsian Index', desc: 'Our proprietary methodology analyzes financial health, leadership, culture, compensation, and growth trajectory.' },
              { icon: Shield, title: 'Make your move', desc: 'Strong Move, Consider Carefully, or High Risk. Backed by evidence, not anonymous opinions.' },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="scarsian-card p-8 flex flex-col gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="text-base font-semibold text-ink">{step.title}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{step.desc}</p>
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
