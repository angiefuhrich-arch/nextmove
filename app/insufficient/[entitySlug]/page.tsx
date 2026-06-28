'use client'

import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function InsufficientPage() {
  const { entitySlug } = useParams<{ entitySlug: string }>()
  const router = useRouter()
  const name = entitySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full text-center"
      >
        <div className="w-16 h-16 rounded-full bg-verdict-amber/20 border border-verdict-amber/30 flex items-center justify-center mx-auto mb-6">
          <span className="text-verdict-amber text-2xl font-bold">!</span>
        </div>

        <h1 className="text-2xl font-semibold text-white mb-2">Insufficient Public Evidence</h1>
        <p className="text-white/50 text-sm mb-8">
          We couldn&apos;t find enough verified public intelligence to produce a reliable brief for{' '}
          <span className="text-white/80 font-medium">{name}</span>.
          This can happen for private companies or recently founded employers.
        </p>

        <div className="bg-navy-dark border border-navy-light rounded-2xl p-6 mb-8 text-left">
          <p className="text-xs uppercase tracking-widest text-white/30 mb-4 font-medium">Help us improve coverage</p>
          <textarea
            placeholder="Share a link, news article, or anything you know about this employer..."
            rows={4}
            className="w-full bg-navy border border-navy-light rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <button className="mt-3 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            Submit Sources
          </button>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 rounded-xl border border-navy-light text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors"
          >
            Back to home
          </button>
          <button
            onClick={() => router.push('/watchlist')}
            className="px-5 py-2.5 rounded-xl bg-navy-dark border border-navy-light text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors"
          >
            Add to watchlist
          </button>
        </div>
      </motion.div>
    </div>
  )
}
