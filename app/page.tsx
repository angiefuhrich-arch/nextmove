'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Search, BarChart3, Shield, ChevronDown, ChevronLeft, ChevronRight,
  Building2, Sparkles, Zap, Globe, GitCompare, Bookmark, Award,
  Target, Clock, TrendingUp,
} from 'lucide-react'
import { GlowTitle } from '@/components/scarsian/GlowTitle'
import { VerdictBadge } from '@/components/scarsian/VerdictBadge'
import { TrendArrow } from '@/components/scarsian/TrendArrow'
import { Footer } from '@/components/scarsian/Footer'
import { featuredCompanies } from '@/lib/data/mockData'

export default function HomePage() {
  const router = useRouter()
  const carouselRef = useRef<HTMLDivElement>(null)

  const scrollCarousel = (dir: 'left' | 'right') => {
    carouselRef.current?.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' })
  }

  const openSearch = () => {
    // Trigger Cmd+K handler on the nav
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
  }

  return (
    <div className="min-h-screen">

      {/* ===== HERO ===== */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-16 pb-20 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0B1D3A 0%, #0A1630 50%, #050D18 100%)' }}
      >
        <div className="ambient-glow-orbs" />
        <div
          className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none z-0"
          style={{ background: 'radial-gradient(ellipse, rgba(59,91,255,0.18) 0%, rgba(59,91,255,0.06) 35%, transparent 65%)', filter: 'blur(30px)' }}
        />

        <div className="relative z-10 max-w-[800px] mx-auto text-center flex flex-col items-center">
          {/* Pre-title */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-xs font-semibold uppercase tracking-[3px] text-white/40 mb-6"
          >
            Career Intelligence
          </motion.p>

          {/* Title */}
          <GlowTitle text={`Know before you\naccept the offer.`} />

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-8 text-base text-white/60 max-w-[480px] leading-relaxed"
          >
            Evidence-based company intelligence for professionals who demand more than reviews.
          </motion.p>

          {/* Search bar */}
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            onClick={openSearch}
            className="mt-12 w-full max-w-[560px] flex items-center gap-3 px-6 py-4 rounded-full bg-white/[0.06] border border-white/15 text-white/40 hover:text-white/70 hover:border-blue/50 hover:bg-white/[0.1] hover:shadow-[0_0_30px_rgba(59,91,255,0.15)] transition-all duration-300"
          >
            <Search className="w-5 h-5" />
            <span className="text-base">Search any company...</span>
            <div className="ml-auto flex items-center gap-1 text-[10px] text-white/25 border border-white/15 rounded px-2 py-0.5">
              <span>⌘K</span>
            </div>
          </motion.button>

          {/* Value props */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="mt-14 flex flex-col sm:flex-row items-center gap-6 sm:gap-10"
          >
            {['Personalized scores', 'Evidence-based signals', 'AI analyst summaries'].map(s => (
              <div key={s} className="flex items-center gap-2 text-sm text-white/45">
                <div className="w-1.5 h-1.5 rounded-full bg-blue/60" />
                {s}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce-slow"
        >
          <ChevronDown className="w-5 h-5 text-white/25" />
        </motion.button>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-24 md:py-32 px-6 bg-navy relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(59,91,255,0.06) 0%, transparent 60%)', filter: 'blur(50px)' }}
        />
        <div className="relative z-10 max-w-[900px] mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white text-center mb-14"
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
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="scarsian-card p-8 flex flex-col gap-4"
              >
                <step.icon className="w-8 h-8 text-blue" />
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED INTELLIGENCE ===== */}
      <section className="py-24 md:py-32 px-6 bg-navy border-t border-navy-light/50">
        <div className="max-w-[1100px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">Featured Intelligence</h2>
            <p className="text-sm text-white/45">Recent analysis from the Scarsian platform</p>
          </motion.div>

          <div className="relative">
            <button
              onClick={() => scrollCarousel('left')}
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/10 border border-navy-light flex items-center justify-center hover:bg-white/20 transition-colors hidden md:flex"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/10 border border-navy-light flex items-center justify-center hover:bg-white/20 transition-colors hidden md:flex"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>

            <div
              ref={carouselRef}
              className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none' }}
            >
              {featuredCompanies.map((company, i) => (
                <motion.button
                  key={company.id}
                  initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  onClick={() => router.push(`/report/${company.id}`)}
                  className="flex-shrink-0 w-[280px] snap-start scarsian-card p-6 text-left hover:border-blue/40 transition-colors duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center text-xs font-bold text-white">
                      {company.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{company.name}</div>
                      <div className="text-[11px] text-white/40">{company.industry}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">Scarsian Index</div>
                      <div className="text-3xl font-bold text-white">{company.indexScore}</div>
                    </div>
                    <VerdictBadge verdict={company.verdict} size="sm" />
                  </div>
                  <TrendArrow trend={company.trend} showLabel={false} />
                  <div className="mt-4 text-xs font-semibold text-blue">View Report →</div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PLATFORM FEATURES ===== */}
      <section className="py-24 md:py-32 px-6 bg-navy">
        <div className="max-w-[900px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">Intelligence That Moves Careers</h2>
            <p className="text-sm text-white/45">Every dimension of a company, analyzed and scored</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {[
              { icon: Building2, title: 'Company Profiles', desc: 'Comprehensive company data including industry, size, geography, and corporate structure.' },
              { icon: BarChart3, title: 'Scarsian Index', desc: 'Our proprietary composite score aggregating all analysis dimensions into a single, actionable number.' },
              { icon: Sparkles, title: 'AI Analyst Summary', desc: 'Natural language intelligence report generated by AI, synthesizing all data points into readable insights.' },
              { icon: Zap, title: 'Evidence Signals', desc: 'Timestamped intelligence signals with source attribution. Track changes and emerging patterns over time.' },
              { icon: Globe, title: 'Source Transparency', desc: 'Every claim linked to its source. Filings, news archives, employee data, and verified public records.' },
              { icon: GitCompare, title: 'Company Comparison', desc: 'Side-by-side comparison of up to 3 companies across all dimensions.' },
              { icon: Bookmark, title: 'Watchlist', desc: 'Track companies you are considering. Get alerts when scores change or new signals emerge.' },
              { icon: Award, title: 'Confidence Scoring', desc: 'Every index includes a confidence score based on data volume, recency, and source diversity.' },
              { icon: Target, title: 'GFI Score', desc: 'Global Friendliness Index — visa access, expat retention, international leadership, language environment.' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="flex flex-col gap-2.5"
              >
                <f.icon className="w-5 h-5 text-blue mb-1" />
                <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-24 md:py-32 px-6 relative overflow-hidden" style={{ background: '#060E1A' }}>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(59,91,255,0.05) 0%, transparent 60%)', filter: 'blur(40px)' }}
        />
        <div className="relative z-10 max-w-[900px] mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white text-center mb-14"
          >
            Trusted by Professionals
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: 'I check Scarsian before every offer conversation. The Index gives me leverage in negotiations I did not have before.', name: 'Sarah Chen', title: 'VP Engineering, Fintech HK' },
              { quote: 'The evidence signals caught a leadership exodus at a company I was considering three weeks before it hit the news.', name: 'Marcus Johnson', title: 'Product Director, SaaS' },
              { quote: 'Finally, career intelligence that feels like it was built for adults. No noise, no fluff — just data and insight.', name: 'Elena Rodriguez', title: 'Data Science Lead, Enterprise' },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="scarsian-card p-7 flex flex-col gap-5"
              >
                <p className="text-base text-white/70 italic leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="h-px bg-navy-light" />
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/[0.1] flex items-center justify-center text-xs font-bold text-white">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-[11px] text-white/45">{t.title}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-24 md:py-32 px-6 bg-navy border-t border-navy-light/50 relative overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(59,91,255,0.08) 0%, transparent 60%)', filter: 'blur(40px)' }}
        />
        <div className="relative z-10 max-w-[600px] mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-5"
          >
            Make your next move with confidence.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="text-base text-white/55 mb-8"
          >
            Your career priorities. Our intelligence. The right decision.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.2 }}
            onClick={openSearch}
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-blue hover:bg-blue-hover text-white font-semibold rounded-xl text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Search className="w-5 h-5" />
            Search a Company
          </motion.button>
          <p className="mt-4 text-xs text-white/40">3 free reports on signup. Full access with Career Pass.</p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
