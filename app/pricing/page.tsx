import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { CheckCircle2, Zap } from 'lucide-react'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with basic company intelligence.',
    features: ['3 company reports per month', 'Basic Next Move Score', 'Basic AI summary', 'Company search'],
    cta: 'Start free',
    href: '/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: 'per month',
    description: 'For serious job seekers and active candidates.',
    features: [
      'Unlimited company reports',
      'Full AI analysis & insights',
      'Company comparison (2-3 companies)',
      'Watchlist — save companies',
      'Offer Decision Assistant',
      'Downloadable PDF reports',
    ],
    cta: 'Get Pro',
    href: '/api/stripe/checkout?plan=pro',
    highlight: true,
  },
  {
    name: 'Premium',
    price: '$29',
    period: 'per month',
    description: 'Full intelligence suite for career transformations.',
    features: [
      'Everything in Pro',
      'CV-based company fit analysis',
      'Salary negotiation guidance',
      'Career move recommendations',
      'Priority AI reports',
      'Early access to new features',
    ],
    cta: 'Get Premium',
    href: '/api/stripe/checkout?plan=premium',
    highlight: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-28 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Simple, honest pricing</h1>
            <p className="text-slate-500 text-lg">Start free. Upgrade when you need more intelligence.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 flex flex-col ${
                  plan.highlight
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-500 ring-offset-2'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {plan.highlight && (
                  <div className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 w-fit">
                    <Zap size={11} />
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h2>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-500 text-sm">/{plan.period}</span>
                  </div>
                  <p className="text-sm text-slate-500">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <CheckCircle2 size={15} className="text-green-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`w-full flex items-center justify-center h-11 rounded-lg font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-14 border-t border-slate-100 pt-12">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 text-center">Frequently asked questions</h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {[
                { q: 'What counts as a report?', a: 'Each time you view a company\'s full intelligence report, that uses one report credit. Basic search results don\'t count.' },
                { q: 'Can I cancel anytime?', a: 'Yes. Cancel anytime from your account page. You keep access until the end of your billing period.' },
                { q: 'How accurate is the AI analysis?', a: 'Reports are based on aggregated data and AI analysis. We show confidence scores so you always know the data quality.' },
                { q: 'Is my data private?', a: 'Yes. Your offer analysis and CV data are never shared. Read our privacy policy for details.' },
              ].map(({ q, a }) => (
                <div key={q}>
                  <p className="font-medium text-slate-900 mb-1 text-sm">{q}</p>
                  <p className="text-slate-500 text-sm">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
