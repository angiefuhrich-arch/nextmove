'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GitCompare, X, Plus, Search } from 'lucide-react'
import { companies } from '@/lib/data/mockData'
import { VerdictBadge } from '@/components/scarsian/VerdictBadge'
import { Footer } from '@/components/scarsian/Footer'
import { cn } from '@/lib/utils'

export default function ComparePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>(['stripe', 'netflix'])

  const selectedCompanies = companies.filter(c => selected.includes(c.id))
  const available = companies.filter(c => !selected.includes(c.id))

  const add = (id: string) => { if (selected.length < 3) setSelected(p => [...p, id]) }
  const remove = (id: string) => setSelected(p => p.filter(x => x !== id))

  const metricKeys = selectedCompanies[0]?.categories.map(c => c.name) ?? []

  return (
    <div className="min-h-screen bg-surface pt-14">
      <div className="max-w-[1000px] mx-auto px-6 py-12">

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <GitCompare className="w-5 h-5 text-brand" />
            <h1 className="text-title-lg text-ink font-bold">Compare Employers</h1>
          </div>
          <p className="text-body-sm text-ink-tertiary">Side-by-side intelligence across all dimensions. Up to 3 employers.</p>
        </motion.div>

        {/* Company selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {selectedCompanies.map(c => (
            <div key={c.id} className="flex items-center gap-2 h-9 px-3 bg-brand-light border border-brand/20 rounded-lg text-body-sm text-brand">
              <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center text-label font-bold">
                {c.name.substring(0, 2).toUpperCase()}
              </div>
              {c.name}
              <button onClick={() => remove(c.id)} className="text-brand/50 hover:text-brand transition-colors duration-fast">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {selected.length < 3 && available.map(c => (
            <button
              key={c.id}
              onClick={() => add(c.id)}
              className="flex items-center gap-2 h-9 px-3 bg-surface-elevated border border-divider rounded-lg text-body-sm text-ink-tertiary hover:text-ink hover:border-brand/30 transition-colors duration-fast"
            >
              <Plus className="w-3.5 h-3.5" />
              {c.name}
            </button>
          ))}
        </div>

        {selectedCompanies.length < 2 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-ink-quaternary">
            <Search className="w-10 h-10 text-ink-quaternary/50" />
            <p className="text-body-sm">Select at least 2 employers to compare</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto rounded-2xl border border-divider shadow-md">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-divider bg-surface-subdued/40">
                  <th className="px-4 py-3 text-label uppercase tracking-widest text-ink-tertiary font-semibold w-36">Dimension</th>
                  {selectedCompanies.map(c => (
                    <th key={c.id} className="px-4 py-3 text-center">
                      <button onClick={() => router.push(`/report/${c.id}`)} className="hover:text-brand transition-colors duration-fast">
                        <p className="text-body-sm font-bold text-ink">{c.name}</p>
                        <p className="text-caption text-ink-tertiary">{c.industry}</p>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-divider">
                  <td className="px-4 py-3 text-label uppercase tracking-wider text-ink-tertiary font-semibold">Scarsian Index</td>
                  {selectedCompanies.map(c => (
                    <td key={c.id} className="px-4 py-3 text-center">
                      <span className="text-metric-md text-ink font-bold">{c.indexScore}</span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-divider">
                  <td className="px-4 py-3 text-label uppercase tracking-wider text-ink-tertiary font-semibold">Verdict</td>
                  {selectedCompanies.map(c => (
                    <td key={c.id} className="px-4 py-3 text-center">
                      <VerdictBadge verdict={c.verdict} size="sm" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-divider">
                  <td className="px-4 py-3 text-label uppercase tracking-wider text-ink-tertiary font-semibold">Confidence</td>
                  {selectedCompanies.map(c => (
                    <td key={c.id} className="px-4 py-3 text-center">
                      <span className="text-body-sm font-semibold text-ink">{c.confidence}%</span>
                    </td>
                  ))}
                </tr>
                {metricKeys.map((metric, mi) => (
                  <tr key={metric} className={cn('border-b border-divider last:border-0', mi % 2 === 0 && 'bg-surface/40')}>
                    <td className="px-4 py-3 text-label uppercase tracking-wider text-ink-tertiary font-semibold">{metric}</td>
                    {selectedCompanies.map(c => {
                      const cat = c.categories.find(x => x.name === metric)
                      const score = cat?.score ?? 0
                      const best = Math.max(...selectedCompanies.map(x => x.categories.find(y => y.name === metric)?.score ?? 0))
                      return (
                        <td key={c.id} className="px-4 py-3 text-center">
                          <span className={cn('text-body-sm font-bold', score === best ? 'text-status-success' : 'text-ink-tertiary')}>
                            {score}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  )
}
