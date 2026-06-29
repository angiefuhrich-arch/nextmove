'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Shield, ChevronDown,
  FileText, Landmark, Globe, Newspaper, Users, Star, Check,
  HelpCircle, Building2, Sparkles, Zap, GitCompare, Bookmark, Award, Target, Search,
} from 'lucide-react'
import { Constellation } from '@/components/scarsian/Constellation'
import { Footer } from '@/components/scarsian/Footer'
import { SearchBox } from '@/components/scarsian/SearchBox'
import { useEmployerSearch } from '@/lib/hooks/useEmployerSearch'
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
  { q: 'Where does Scarsian\'s data come from?', a: 'Every Intelligence Brief is built from independently verified public sources: SEC filings, corporate annual reports, government registries, trusted business news, company websites, and verified professional data. We never use anonymous reviews or unverified claims.' },
  { q: 'How often is Scarsian updated?', a: 'Our platform continuously monitors trusted sources. The Scarsian Index and Evidence Confidence scores update as new verified information becomes available. Most employers are refreshed within 24–72 hours.' },
  { q: 'Can companies pay to improve their score?', a: 'No. The Scarsian Index is calculated entirely from publicly available evidence using our proprietary methodology. No company can influence their score through payment or partnership.' },
  { q: 'How is the Scarsian Index calculated?', a: 'The Scarsian Index is a composite score derived from five core dimensions: Financial Strength, Leadership, Career Growth, Compensation, and Culture. Each dimension is scored based on verified evidence, then weighted and combined into a single 0–100 score.' },
  { q: 'How reliable is the Executive Summary?', a: 'Every Executive Summary is generated from verified evidence and cross-referenced against multiple independent sources. The Evidence Confidence indicator shows how much verified data supports each Brief.' },
  { q: 'Why do confidence scores vary between employers?', a: 'Evidence Confidence reflects the volume, recency, and diversity of sources available for each employer. Large public companies typically have higher confidence due to more frequent disclosures. Private companies or smaller firms may have lower confidence simply because less public data exists.' },
]

const features = [
  { icon: Building2, title: 'Employer Profiles', desc: 'Comprehensive data including industry, size, geography, and corporate structure.' },
  { icon: BarChart3, title: 'Scarsian Index™', desc: 'Proprietary composite score across all analysis dimensions into one actionable number.' },
  { icon: Sparkles, title: 'Executive Summary™', desc: 'Natural language intelligence report synthesizing all data into readable insight.' },
  { icon: Zap, title: 'Key Findings', desc: 'Timestamped findings with source attribution. Track changes and emerging patterns.' },
  { icon: Globe, title: 'Source Transparency', desc: 'Every claim linked to its source. SEC filings, news, employee data, public records.' },
  { icon: GitCompare, title: 'Comparison', desc: 'Side-by-side across all dimensions. Up to 3 employers. Export and share.' },
  { icon: Bookmark, title: 'Watchlist', desc: 'Track employers you are considering. Alerts when scores change or new findings appear.' },
  { icon: Award, title: 'Evidence Confidence™', desc: 'Every index includes confidence based on data volume, recency, and source diversity.' },
  { icon: Target, title: 'For You', desc: 'Set your priorities and every score adapts. Salary, growth, stability — your way.' },
]

const POPULAR_SEARCHES = ['HSBC Hong Kong', 'Google', 'OpenAI', 'Deloitte', 'Cathay Pacific', 'Tencent']

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [launchingQuery, setLaunchingQuery] = useState<string | null>(null)
  const { search } = useEmployerSearch()

  const handlePopularSearch = async (query: string) => {
    if (launchingQuery) return
    setLaunchingQuery(query)
    await search(query)
    setLaunchingQuery(null)
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
            Your career priorities. Our intelligence. The right decision.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-10 w-full max-w-[680px]"
          >
            <SearchBox id="hero-search-box" size="hero" placeholder="Search any employer…" />
          </motion.div>

          {/* Popular searches */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-[11px] text-ink-tertiary max-w-[600px]"
          >
            <span className="text-ink-quaternary mr-1">Popular searches:</span>
            {POPULAR_SEARCHES.map((s, i, arr) => (
              <span key={s}>
                <button
                  onClick={() => handlePopularSearch(s)}
                  disabled={!!launchingQuery}
                  className="hover:text-brand transition-colors underline underline-offset-2 decoration-divider hover:decoration-brand/40 disabled:opacity-60"
                >
                  {launchingQuery === s ? 'Searching…' : s}
                </button>
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

      {/* ===== INTELLIGENCE THAT MOVES CAREERS (Features) ===== */}
      <section className="py-24 md:py-28 px-6 bg-surface">
        <div className="max-w-[800px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
            <h2 className="text-3xl md:text-[44px] font-bold text-ink tracking-[-1px] mb-3">Intelligence That Moves Careers</h2>
            <p className="text-sm text-ink-tertiary">Every dimension of an employer, analyzed and scored</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-9">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                className="flex flex-col gap-2">
                <f.icon className="w-5 h-5 text-brand/70 mb-0.5" />
                <h3 className="text-sm font-semibold text-ink">{f.title}</h3>
                <p className="text-xs text-ink-tertiary leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== EARLY ACCESS ===== */}
      <section className="py-24 md:py-28 px-6 bg-surface-subdued">
        <div className="max-w-[600px] mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="w-12 h-12 rounded-2xl bg-white border border-divider flex items-center justify-center mx-auto mb-5 shadow-card">
              <Users className="w-5 h-5 text-brand" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-ink tracking-[-0.5px] mb-3">Coming Soon</h2>
            <p className="text-sm text-ink-secondary max-w-[400px] mx-auto leading-relaxed mb-4">
              Early access feedback will appear here. We&apos;re working with professionals to validate every Intelligence Brief before broader release.
            </p>
            <p className="text-[11px] text-ink-quaternary">Trust is more important than social proof.</p>
          </motion.div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-24 md:py-28 px-6 bg-white">
        <div className="max-w-[640px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-3.5 h-3.5 text-brand" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand">FAQ</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-ink tracking-[-0.5px]">Common Questions</h2>
          </motion.div>
          <div className="flex flex-col divide-y divide-divider">
            {faqs.map((faq, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-4 text-left group"
                >
                  <span className="text-sm font-medium text-ink group-hover:text-brand transition-colors pr-4">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-ink-quaternary flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="pb-4">
                    <p className="text-sm text-ink-secondary leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
