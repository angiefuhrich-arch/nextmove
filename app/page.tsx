'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Search, Command, TrendingUp, Zap, Shield, Clock,
  Briefcase, Target, Sparkles, BarChart3, Globe, ArrowRight,
} from 'lucide-react'
import { CommandPalette } from '@/components/scarsian/CommandPalette'
import { Footer } from '@/components/scarsian/Footer'
import { TopNavBar } from '@/components/scarsian/TopNavBar'
import { VerdictBadge } from '@/components/scarsian/VerdictBadge'

const BRIEF_ITEMS = [
  { icon: TrendingUp, text: '3 companies improved their Scarsian Index this week.', color: 'text-verdict-green' },
  { icon: Zap,        text: 'New GFI data added for HSBC Hong Kong.', color: 'text-blue' },
  { icon: Sparkles,   text: 'Google now ranks #1 for Global Friendliness in HK.', color: 'text-verdict-green' },
  { icon: Shield,     text: 'Goldman Sachs confidence score increased to 82%.', color: 'text-blue' },
  { icon: Clock,      text: '3 free credits available on your account.', color: 'text-white/40' },
]

const FEATURED = [
  { slug: 'hsbc',         name: 'HSBC Hong Kong',  industry: 'Banking',         score: 74, verdict: 'strong'  as const },
  { slug: 'google',       name: 'Google',           industry: 'Technology',      score: 81, verdict: 'strong'  as const },
  { slug: 'goldman-sachs',name: 'Goldman Sachs',    industry: 'Investment Bank', score: 69, verdict: 'caution' as const },
  { slug: 'meta',         name: 'Meta',             industry: 'Technology',      score: 58, verdict: 'caution' as const },
]

export default function HomePage() {
  const [paletteOpen, setPaletteOpen] = useState(false)

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0B1D3A 0%, #0A1630 50%, #050D18 100%)' }}
    >
      <div className="ambient-orbs" />

      {/* Ambient glow centre */}
      <div
        className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse, rgba(59,91,255,0.16) 0%, rgba(59,91,255,0.05) 35%, transparent 65%)',
          filter: 'blur(40px)',
        }}
      />

      <TopNavBar />

      <div className="relative z-10 max-w-[720px] mx-auto px-6 pt-28 md:pt-36 pb-16">

        {/* Morning Brief */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-14">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue" />
            <span className="text-[11px] font-bold uppercase tracking-[2px] text-blue">Intelligence Brief</span>
          </div>
          <h2 className="text-lg text-white/80 mb-4 font-light">Good morning.</h2>
          <div className="flex flex-col gap-2">
            {BRIEF_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * i }}
                className="flex items-center gap-3 text-sm"
              >
                <item.icon className={`w-3.5 h-3.5 ${item.color} flex-shrink-0`} />
                <span className="text-white/60">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Search — the hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-4"
        >
          <button
            onClick={() => setPaletteOpen(true)}
            className="w-full flex items-center gap-4 px-6 py-5 rounded-2xl bg-white/[0.05] border border-white/15 text-white/35 hover:text-white/60 hover:border-blue/40 hover:bg-white/[0.08] hover:shadow-[0_0_30px_rgba(59,91,255,0.12)] transition-all duration-300 group"
          >
            <Search className="w-5 h-5" />
            <span className="text-lg">Search any company...</span>
            <div className="ml-auto flex items-center gap-1 text-[10px] text-white/25 border border-white/15 rounded px-2 py-0.5">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-center text-xs text-white/35 mb-16 tracking-wide"
        >
          Know before you cross the border.
        </motion.p>

        {/* Featured companies */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-blue" />
              <span className="text-xs font-semibold text-white uppercase tracking-wide">Hong Kong Intelligence</span>
            </div>
            <Link href="/search" className="text-[11px] text-blue hover:underline">
              Browse all →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {FEATURED.map((c) => (
              <Link
                key={c.slug}
                href={`/company/${c.slug}`}
                className="flex items-center gap-3.5 p-4 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:border-blue/40 hover:bg-white/[0.08] transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {c.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{c.name}</div>
                  <div className="text-[11px] text-white/40">{c.industry}</div>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  <div className="text-xl font-bold text-white tabular-nums">{c.score}</div>
                  <VerdictBadge verdict={c.verdict} size="sm" />
                </div>
                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-blue/60 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Quick nav */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="flex items-center justify-center gap-2.5 flex-wrap"
        >
          {[
            { label: 'Intelligence Workspace', icon: BarChart3, path: '/admin' },
            { label: 'Career Wallet',          icon: Briefcase, path: '/wallet' },
            { label: 'Compare',                icon: Target,    path: '/compare' },
          ].map(item => (
            <Link
              key={item.path}
              href={item.path}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-xs text-white/50 hover:text-white hover:border-white/15 hover:bg-white/[0.08] transition-all"
            >
              <item.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </motion.div>

        {/* Hero sub-text for non-signed-in visitors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-24 text-center"
        >
          <div
            className="text-4xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-6 animate-glow-pulse"
            style={{
              textShadow: '0 0 40px rgba(59,91,255,0.3), 0 0 80px rgba(59,91,255,0.2), 0 4px 8px rgba(0,0,0,0.3)',
            }}
          >
            Know before you<br />cross the border.
          </div>
          <p className="text-white/40 text-base max-w-md mx-auto mb-8 leading-relaxed">
            AI-powered career intelligence for international professionals in Hong Kong and Asia.
            Scarsian Index, GFI, and analyst-grade company reports.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-xl bg-blue hover:bg-blue-hover text-white font-semibold text-sm transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Start Free — 3 Credits
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-medium text-sm transition-all"
            >
              View Pricing
            </Link>
          </div>
        </motion.div>
      </div>

      <Footer />

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
