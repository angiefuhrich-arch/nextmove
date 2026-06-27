'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GitCompare, X, Plus, Search } from 'lucide-react'
import { companies } from '@/lib/data/mockData'
import { VerdictBadge } from '@/components/scarsian/VerdictBadge'
import { Footer } from '@/components/scarsian/Footer'

export default function ComparePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>(['stripe', 'netflix'])

  const selectedCompanies = companies.filter(c => selected.includes(c.id))
  const available = companies.filter(c => !selected.includes(c.id))

  const add = (id: string) => {
    if (selected.length < 3) setSelected(prev => [...prev, id])
  }
  const remove = (id: string) => setSelected(prev => prev.filter(x => x !== id))

  const metricKeys = selectedCompanies[0]?.categories.map(c => c.name) ?? []

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-[1000px] mx-auto px-6 py-12">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <GitCompare className="w-5 h-5 text-blue" />
            <h1 className="text-2xl font-bold text-white">Compare Companies</h1>
          </div>
          <p className="text-sm text-white/50">Side-by-side intelligence across all categories. Up to 3 companies.</p>
        </motion.div>

        {/* Company selector */}
        <div className="flex flex-wrap gap-3 mb-8">
          {selectedCompanies.map(c => (
            <div key={c.id} className="flex items-center gap-2 px-4 py-2 bg-blue/15 border border-blue/30 rounded-xl text-sm text-white">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold">
                {c.name.substring(0, 2).toUpperCase()}
              </div>
              {c.name}
              <button onClick={() => remove(c.id)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {selected.length < 3 && available.map(c => (
            <button
              key={c.id}
              onClick={() => add(c.id)}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/40 hover:text-white hover:border-white/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              {c.name}
            </button>
          ))}
        </div>

        {selectedCompanies.length < 2 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-white/40">
            <Search className="w-10 h-10 text-white/20" />
            <p>Select at least 2 companies to compare</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-3 pr-6 text-[11px] font-semibold uppercase tracking-wider text-white/40 w-36">Metric</th>
                  {selectedCompanies.map(c => (
                    <th key={c.id} className="py-3 px-4 text-center">
                      <button onClick={() => router.push(`/report/${c.id}`)} className="hover:text-blue transition-colors">
                        <div className="text-sm font-bold text-white">{c.name}</div>
                        <div className="text-[11px] text-white/40">{c.industry}</div>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Index score */}
                <tr className="border-t border-white/[0.06]">
                  <td className="py-4 pr-6 text-[11px] text-white/50 font-semibold uppercase tracking-wider">Scarsian Index</td>
                  {selectedCompanies.map(c => (
                    <td key={c.id} className="py-4 px-4 text-center">
                      <div className="text-3xl font-bold text-white">{c.indexScore}</div>
                    </td>
                  ))}
                </tr>
                {/* Verdict */}
                <tr className="border-t border-white/[0.06]">
                  <td className="py-4 pr-6 text-[11px] text-white/50 font-semibold uppercase tracking-wider">Verdict</td>
                  {selectedCompanies.map(c => (
                    <td key={c.id} className="py-4 px-4 text-center">
                      <VerdictBadge verdict={c.verdict} size="sm" />
                    </td>
                  ))}
                </tr>
                {/* Confidence */}
                <tr className="border-t border-white/[0.06]">
                  <td className="py-4 pr-6 text-[11px] text-white/50 font-semibold uppercase tracking-wider">Confidence</td>
                  {selectedCompanies.map(c => (
                    <td key={c.id} className="py-4 px-4 text-center">
                      <span className="text-sm font-semibold text-white">{c.confidence}%</span>
                    </td>
                  ))}
                </tr>
                {/* Category scores */}
                {metricKeys.map(metric => (
                  <tr key={metric} className="border-t border-white/[0.06]">
                    <td className="py-3.5 pr-6 text-[11px] text-white/50 font-semibold uppercase tracking-wider">{metric}</td>
                    {selectedCompanies.map(c => {
                      const cat = c.categories.find(x => x.name === metric)
                      const score = cat?.score ?? 0
                      const best = Math.max(...selectedCompanies.map(x => x.categories.find(y => y.name === metric)?.score ?? 0))
                      return (
                        <td key={c.id} className="py-3.5 px-4 text-center">
                          <span className={`text-sm font-bold ${score === best ? 'text-verdict-green' : 'text-white/70'}`}>
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
