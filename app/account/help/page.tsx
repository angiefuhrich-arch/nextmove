'use client'

import { motion } from 'framer-motion'
import { HelpCircle, Mail, BookOpen, MessageSquare, FileText } from 'lucide-react'
import Link from 'next/link'
import { AccountLayout } from '@/components/scarsian/AccountLayout'

const FAQ = [
  { q: 'How do Intelligence Brief credits work?', a: 'Each credit unlocks one full Intelligence Brief. Credits never expire. If we cannot produce a brief due to insufficient evidence, you are not charged.' },
  { q: 'Can I get a refund for unused credits?', a: 'Credits are non-refundable once purchased. Contact support if you believe there has been an error with your transaction.' },
  { q: 'How current is the data in Intelligence Briefs?', a: 'Most employer profiles are refreshed within 24–72 hours of new verified information becoming available. The Evidence Confidence indicator shows data recency.' },
  { q: 'What sources does Scarsian use?', a: 'We use SEC filings, corporate annual reports, government registries, trusted business news, company websites, and verified professional data. No anonymous reviews.' },
  { q: 'How do I remove a company from my Watchlist?', a: 'Go to Watchlist, find the company, and click the delete button. You will stop receiving alerts for that employer.' },
]

export default function HelpPage() {
  return (
    <AccountLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

        <div>
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="w-5 h-5 text-brand" />
            <h1 className="text-2xl font-bold text-ink tracking-tight">Help</h1>
          </div>
          <p className="text-sm text-ink-tertiary">Answers, resources, and support for your Scarsian account.</p>
        </div>

        {/* Contact options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Mail, label: 'Email Support', desc: 'Get help from our team. We respond within 1–2 business days.', action: 'support@scarsian.com', href: 'mailto:support@scarsian.com' },
            { icon: BookOpen, label: 'Documentation', desc: 'Guides on Intelligence Briefs, the Scarsian Index, and methodology.', action: 'View docs', href: '/methodology' },
            { icon: MessageSquare, label: 'Feedback', desc: 'Report bugs, suggest features, or share your experience.', action: 'Send feedback', href: 'mailto:feedback@scarsian.com' },
            { icon: FileText, label: 'Methodology', desc: 'How the Scarsian Index is calculated and what the scores mean.', action: 'Read methodology', href: '/methodology' },
          ].map(item => (
            <Link key={item.label} href={item.href}
              className="flex flex-col gap-2 p-4 bg-white border border-divider rounded-2xl shadow-card hover:shadow-elevated hover:border-brand/20 transition-all">
              <div className="w-9 h-9 rounded-xl bg-brand/8 flex items-center justify-center">
                <item.icon className="w-4.5 h-4.5 text-brand" />
              </div>
              <p className="text-sm font-semibold text-ink">{item.label}</p>
              <p className="text-xs text-ink-tertiary leading-relaxed">{item.desc}</p>
              <span className="text-xs text-brand mt-auto">{item.action} →</span>
            </Link>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white border border-divider rounded-2xl p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink mb-5">Frequently Asked Questions</h2>
          <div className="space-y-5">
            {FAQ.map((item, i) => (
              <div key={i} className="border-b border-divider last:border-b-0 pb-5 last:pb-0">
                <p className="text-sm font-medium text-ink mb-1.5">{item.q}</p>
                <p className="text-xs text-ink-tertiary leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

      </motion.div>
    </AccountLayout>
  )
}
