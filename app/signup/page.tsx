'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/'), 2000)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <CheckCircle2 size={48} className="text-brand mx-auto mb-4" />
          <h2 className="text-title-md font-bold text-ink">Account created!</h2>
          <p className="text-ink-tertiary mt-1">Redirecting you now…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-brand rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-white" />
            </div>
            <span className="font-bold text-ink text-xl">Scarsian</span>
          </Link>
          <h1 className="text-title-md font-bold text-ink">Create your account</h1>
          <p className="text-body-sm text-ink-tertiary mt-1">Free plan · No card needed</p>
        </div>

        <form onSubmit={handleSignup} className="bg-white rounded-xl border border-divider shadow-sm p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          <div>
            <label className="block text-body-sm font-medium text-ink mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-divider text-body-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-ink mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-divider text-body-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-brand hover:bg-brand/90 text-white rounded-lg text-body-sm font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Start free'}
          </button>
          <p className="text-caption text-ink-quaternary text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>

        <p className="text-center text-body-sm text-ink-tertiary mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-brand font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
