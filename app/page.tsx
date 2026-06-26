import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { TrendingUp, Shield, Zap, Globe, Star, CheckCircle2 } from 'lucide-react'

const FEATURES = [
  { icon: Globe, title: 'Global Fit Index (GFI)', desc: 'Unique score for international professionals — visa history, English environment, expat retention, and more.' },
  { icon: TrendingUp, title: 'Scarsian Index', desc: 'Every company rated 0–100 across 11 career dimensions built for Asia-Pacific markets.' },
  { icon: Shield, title: 'Layoff Convexity', desc: 'Asymmetric risk analysis — understand downside exposure before you sign.' },
  { icon: Zap, title: 'AI Career Intelligence', desc: 'Instant analyst-grade summaries, verdicts, and offer guidance powered by AI.' },
]

const COMPANIES = ['HSBC', 'Google', 'Meta', 'Amazon', 'Microsoft', 'Stripe', 'Canva', 'Salesforce', 'HubSpot', 'Revolut', 'Airwallex', 'Glue Up']

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Star size={14} />
            Built for International Professionals in Asia
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
            Know before you<br />
            <span className="text-green-600">cross the border.</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Scarsian uses AI to analyze company reputation, career growth, compensation, culture,
            layoff risk, and global fit — so international professionals in Hong Kong and Asia
            can make smarter career decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors text-base"
            >
              <Zap size={18} />
              Start Free
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-900 font-semibold px-8 py-3.5 rounded-lg transition-colors text-base"
            >
              Analyze a Company
            </Link>
          </div>
          <p className="text-sm text-slate-400 mt-4">Free plan · 3 reports/month · No credit card required</p>
        </div>
      </section>

      {/* Verdict preview */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Strong Move', color: 'border-green-200 bg-green-50', text: 'text-green-700', dot: 'bg-green-500', desc: 'Clear opportunity — strong fundamentals' },
              { label: 'Think Twice', color: 'border-yellow-200 bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', desc: 'Proceed carefully — mixed signals' },
              { label: 'No-Go', color: 'border-red-200 bg-red-50', text: 'text-red-700', dot: 'bg-red-500', desc: 'Significant risks — avoid for now' },
            ].map((v) => (
              <div key={v.label} className={`rounded-xl border ${v.color} p-5`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${v.dot}`} />
                  <span className={`font-bold text-lg ${v.text}`}>{v.label}</span>
                </div>
                <p className="text-sm text-slate-600">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Intelligence built for Asia careers</h2>
            <p className="text-slate-500">The only platform with a Global Fit Index for international professionals.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-6 rounded-xl border border-slate-200 bg-white">
                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                  <p className="text-sm text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Companies */}
      <section className="py-16 bg-slate-50 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Companies we cover</h2>
          <p className="text-slate-500 mb-8 text-sm">Analyst-grade intelligence on employers across Hong Kong, APAC, and global tech</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {COMPANIES.map((c) => (
              <Link
                key={c}
                href={`/company/${c.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Start free. Upgrade when ready.</h2>
          <p className="text-slate-500 mb-10">Priced for Hong Kong and Asia-Pacific professionals.</p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              { name: 'Free', price: 'HK$0', features: ['3 company reports/month', 'Scarsian Index score', 'Basic AI summary'] },
              { name: 'Pro', price: 'HK$98/mo', features: ['Unlimited reports', 'Full AI analysis', 'Global Fit Index', 'Company comparison', 'Offer assistant'], highlight: true },
              { name: 'Premium', price: 'HK$228/mo', features: ['Everything in Pro', 'CV fit analysis', 'Salary negotiation', 'Career recommendations', 'Priority AI reports'] },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-xl border p-6 ${plan.highlight ? 'border-green-500 bg-green-50 ring-2 ring-green-500' : 'border-slate-200 bg-white'}`}>
                <div className="mb-4">
                  <div className="font-bold text-slate-900 mb-0.5">{plan.name}</div>
                  <div className="text-2xl font-bold text-slate-900">{plan.price}</div>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Make your next career move with confidence</h2>
          <p className="text-slate-400 mb-8">Join international professionals using Scarsian to evaluate companies before they say yes.</p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-base"
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
              <TrendingUp size={12} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">Scarsian</span>
            <span className="text-slate-400 text-xs ml-1">Career Intelligence Platform</span>
          </div>
          <p className="text-xs text-slate-400">© 2025 Scarsian. Know before you cross the border.</p>
          <div className="flex gap-4 text-xs text-slate-500">
            <Link href="/pricing" className="hover:text-slate-900">Pricing</Link>
            <Link href="/login" className="hover:text-slate-900">Login</Link>
            <Link href="/signup" className="hover:text-slate-900">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
