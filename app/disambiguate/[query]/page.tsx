'use client'

import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Building2, Globe, Shield, ChevronRight, ArrowLeft } from 'lucide-react'

const ambiguousSets: Record<string, Array<{
  id: string
  name: string
  tagline: string
  country: string
  website: string
  industry: string
  confidence: number
  sources: number
}>> = {
  hsbc: [
    { id: 'hsbc-hk', name: 'HSBC Hong Kong', tagline: 'Global banking giant with strong Asia presence', country: 'Hong Kong', website: 'hsbc.com.hk', industry: 'Banking', confidence: 94, sources: 23 },
    { id: 'hsbc-uk', name: 'HSBC UK', tagline: 'UK retail and commercial banking division', country: 'United Kingdom', website: 'hsbc.co.uk', industry: 'Banking', confidence: 88, sources: 19 },
    { id: 'hsbc-us', name: 'HSBC USA', tagline: 'US commercial banking operations', country: 'United States', website: 'us.hsbc.com', industry: 'Banking', confidence: 72, sources: 14 },
  ],
  google: [
    { id: 'google', name: 'Google (Alphabet)', tagline: 'Global technology and search leader', country: 'United States', website: 'abc.xyz', industry: 'Technology', confidence: 98, sources: 47 },
    { id: 'google-cloud', name: 'Google Cloud', tagline: 'Cloud computing division of Alphabet', country: 'United States', website: 'cloud.google.com', industry: 'Cloud Computing', confidence: 85, sources: 21 },
  ],
  microsoft: [
    { id: 'microsoft', name: 'Microsoft Corporation', tagline: 'Global technology corporation', country: 'United States', website: 'microsoft.com', industry: 'Technology', confidence: 97, sources: 45 },
    { id: 'msft-uk', name: 'Microsoft UK', tagline: 'UK subsidiary and operations', country: 'United Kingdom', website: 'microsoft.com/en-gb', industry: 'Technology', confidence: 68, sources: 12 },
  ],
}

export default function DisambiguationPage() {
  const { query } = useParams<{ query: string }>()
  const router = useRouter()
  const searchKey = (query as string)?.toLowerCase() ?? ''
  const entities = ambiguousSets[searchKey] ?? ambiguousSets['hsbc']
  const displayQuery = query ?? 'this employer'

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 pt-16">
      <div className="max-w-[600px] w-full">
        <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-[11px] text-ink-tertiary hover:text-brand transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" />Back to search
        </button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-ink mb-2">Which employer do you mean?</h1>
          <p className="text-sm text-ink-secondary leading-relaxed mb-8">
            We found multiple employers matching &ldquo;{displayQuery}&rdquo;. Select the one you want to research.
          </p>

          <div className="flex flex-col gap-3 mb-8">
            {entities.map((entity, i) => (
              <motion.button
                key={entity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => router.push(`/brief/${entity.id}`)}
                className="group flex items-start gap-4 p-4 rounded-2xl bg-white border border-divider hover:border-brand/30 hover:shadow-elevated transition-all text-left w-full"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-subdued border border-divider flex items-center justify-center text-sm font-bold text-ink-secondary flex-shrink-0">
                  {entity.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-ink">{entity.name}</span>
                    <span className="text-[10px] text-ink-quaternary bg-surface-subdued px-1.5 py-0.5 rounded">{entity.industry}</span>
                  </div>
                  <p className="text-[12px] text-ink-secondary mb-2">{entity.tagline}</p>
                  <div className="flex items-center gap-3 text-[10px] text-ink-quaternary flex-wrap">
                    <span className="flex items-center gap-1"><Globe className="w-2.5 h-2.5" />{entity.website}</span>
                    <span>{entity.country}</span>
                    <span className="flex items-center gap-1"><Shield className="w-2.5 h-2.5" />{entity.confidence}% confidence</span>
                    <span>{entity.sources} sources</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-quaternary group-hover:text-brand transition-colors flex-shrink-0 mt-2" />
              </motion.button>
            ))}
          </div>

          <div className="text-center">
            <p className="text-[11px] text-ink-quaternary mb-3">None of these match what you are looking for?</p>
            <button
              onClick={() => router.push(`/building/${encodeURIComponent(displayQuery as string)}`)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl transition-all"
            >
              <Building2 className="w-3.5 h-3.5" />
              Research &ldquo;{displayQuery}&rdquo; anyway
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
