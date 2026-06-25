import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { TrendingUp, Shield, Zap, BarChart3, Star, CheckCircle2 } from 'lucide-react'

const FEATURES = [
  { icon: BarChart3, title: 'Company Score', desc: 'Every company rated 0–100 across 10 career dimensions.' },
  { icon: TrendingUp, title: 'Career Growth Analysis', desc: 'Understand your real promotion and advancement potential.' },
  { icon: Shield, title: 'Layoff Risk Assessment', desc: 'Know the financial stability and risk before you join.' },
  { icon: Zap, title: 'AI-Powered Insights', desc: 'Instant summaries, verdicts, and personalized guidance.' },
]

const COMPANIES = ['Google', 'Meta', 'Amazon', 'Microsoft', 'Stripe', 'Canva', 'Salesforce', 'HubSpot', 'Revolut', 'Airwallex', 'HSBC', 'Glue Up']

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Star size={14} />
            AI Career Intelligence Platform
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
            Know before you<br />
            <span className="text-green-600">accept the offer.</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Next Move uses AI to analyze company reputation, career growth, compensation, culture, 
            layoff risk, and employee sentiment so you can make smarter career decisions.
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
          <p className="text-sm text-slate-400 mt-4">Free plan includes 3 company reports per month. No credit card required.</p>
        </div>
      </section>

      {/* Verdict Preview */}
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
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Everything you need to decide</h2>
            <p className="text-slate-500">10 dimensions. One score. Instant clarity.</p>
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
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Companies we analyze</h2>
          <p className="text-slate-500 mb-8 text-sm">Get instant intelligence on top employers across tech, finance, and more</p>
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

      {/* Pricing Preview */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Start free. Upgrade when ready.</h2>
          <p className="text-slate-500 mb-10">No credit card required to start.</p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              { name: 'Free', price: '$0', features: ['3 company reports/month', 'Basic score', 'Basic AI summary'] },
              { name: 'Pro', price: '$12/mo', features: ['Unlimited reports', 'Full AI analysis', 'Company comparison', 'Watchlist', 'Offer decision assistant'], highlight: true },
              { name: 'Premium', price: '$29/mo', features: ['Everything in Pro', 'CV-based fit analysis', 'Salary negotiation', 'Career recommendations', 'Priority AI reports'] },
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
          <Link
            href="/pricing"
            className="inline-flex mt-8 items-center text-sm text-slate-500 hover:text-slate-900 underline"
          >
            See full pricing details →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Make your next career move with confidence</h2>
          <p className="text-slate-400 mb-8">Join thousands of professionals using Next Move to evaluate companies before they say yes.</p>
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
            <span className="font-bold text-slate-900 text-sm">Next Move</span>
          </div>
          <p className="text-xs text-slate-400">© 2025 Next Move. Know before you accept the offer.</p>
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
