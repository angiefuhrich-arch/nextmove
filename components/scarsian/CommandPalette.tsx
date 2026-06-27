'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'

// Static company list for command palette; will be replaced with API search in Phase 5
const COMPANIES = [
  { slug: 'hsbc', name: 'HSBC', industry: 'Banking' },
  { slug: 'google', name: 'Google', industry: 'Technology' },
  { slug: 'meta', name: 'Meta', industry: 'Technology' },
  { slug: 'amazon', name: 'Amazon', industry: 'E-Commerce / Cloud' },
  { slug: 'goldman-sachs', name: 'Goldman Sachs', industry: 'Investment Banking' },
  { slug: 'stripe', name: 'Stripe', industry: 'Fintech' },
  { slug: 'airbnb', name: 'Airbnb', industry: 'Travel / Technology' },
  { slug: 'netflix', name: 'Netflix', industry: 'Streaming' },
  { slug: 'canva', name: 'Canva', industry: 'Design / Technology' },
  { slug: 'airwallex', name: 'Airwallex', industry: 'Fintech' },
]

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const filtered = COMPANIES.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.industry.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => { setSelectedIndex(0) }, [query])
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  // Cmd+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (!open) {
          // signal parent to open — in practice the parent manages this
        }
      }
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(p => (p + 1) % filtered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(p => (p - 1 + filtered.length) % filtered.length)
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      router.push(`/company/${filtered[selectedIndex].slug}`)
      onClose()
      setQuery('')
    }
  }

  const navigate = (slug: string) => {
    router.push(`/company/${slug}`)
    onClose()
    setQuery('')
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[400] flex items-start justify-center pt-[120px]"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-[640px] mx-4 bg-navy-dark border border-navy-light rounded-3xl shadow-modal overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-navy-light">
              <Search className="w-5 h-5 text-white/50 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search companies..."
                className="flex-1 bg-transparent text-white text-lg placeholder-white/30 outline-none"
              />
              <button onClick={onClose} className="p-1 rounded-md hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-2">
              {filtered.length > 0 ? filtered.map((company, i) => (
                <button
                  key={company.slug}
                  onClick={() => navigate(company.slug)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-150 ${
                    i === selectedIndex
                      ? 'bg-blue/20 border border-blue/40'
                      : 'hover:bg-white/[0.08] border border-transparent'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {company.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-white">{company.name}</div>
                    <div className="text-xs text-white/50">{company.industry}</div>
                  </div>
                </button>
              )) : (
                <div className="flex flex-col items-center gap-3 py-12 text-white/50">
                  <Search className="w-12 h-12 text-white/30" />
                  <p className="text-base">No companies found</p>
                  <p className="text-sm text-white/30">Try a different search term</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
