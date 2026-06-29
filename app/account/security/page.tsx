'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { Shield, Loader2, Check, AlertCircle, Eye, EyeOff, Clock } from 'lucide-react'
import { AccountLayout } from '@/components/scarsian/AccountLayout'

interface UserSession {
  email: string
  last_sign_in: string | null
  created_at: string | null
}

export default function SecurityPage() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !active) { setLoading(false); return }
      setSession({
        email: user.email ?? '',
        last_sign_in: user.last_sign_in_at ?? null,
        created_at: user.created_at ?? null,
      })
      setLoading(false)
    })()
    return () => { active = false }
  }, [])

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setSaveMsg({ type: 'err', text: 'Password must be at least 8 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setSaveMsg({ type: 'err', text: 'Passwords do not match.' })
      return
    }
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/account/security/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword }),
      })
      if (res.ok) {
        setSaveMsg({ type: 'ok', text: 'Password updated successfully.' })
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json().catch(() => ({}))
        setSaveMsg({ type: 'err', text: data.error ?? 'Could not update password.' })
      }
    } catch {
      setSaveMsg({ type: 'err', text: 'Network error. Try again.' })
    }
    setSaving(false)
  }

  return (
    <AccountLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-brand" />
            <h1 className="text-2xl font-bold text-ink tracking-tight">Security</h1>
          </div>
          <p className="text-sm text-ink-tertiary">Manage your password and review account activity.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-brand animate-spin" /></div>
        ) : (
          <>
            {/* Account info */}
            <div className="bg-white border border-divider rounded-2xl p-5 shadow-card space-y-3">
              <h2 className="text-sm font-semibold text-ink">Account</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-surface-subdued rounded-xl px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-quaternary mb-1">Email address</p>
                  <p className="text-ink-secondary">{session?.email}</p>
                </div>
                <div className="bg-surface-subdued rounded-xl px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-quaternary mb-1">Account created</p>
                  <p className="text-ink-secondary">
                    {session?.created_at
                      ? new Date(session.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent login */}
            <div className="bg-white border border-divider rounded-2xl p-5 shadow-card">
              <h2 className="text-sm font-semibold text-ink mb-4">Recent Login Activity</h2>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-subdued border border-divider">
                <div className="w-9 h-9 rounded-xl bg-brand/8 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Most recent sign-in</p>
                  <p className="text-xs text-ink-tertiary">
                    {session?.last_sign_in
                      ? new Date(session.last_sign_in).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Unknown'}
                  </p>
                </div>
                <span className="ml-auto px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full">Active</span>
              </div>
              <p className="text-xs text-ink-quaternary mt-3">Full session history is not available. Contact support if you believe your account has been compromised.</p>
            </div>

            {/* Change password */}
            <div className="bg-white border border-divider rounded-2xl p-5 shadow-card">
              <h2 className="text-sm font-semibold text-ink mb-4">Change Password</h2>
              <div className="space-y-3 max-w-[400px]">
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full pr-10 px-4 py-2.5 rounded-xl border border-divider bg-surface-subdued text-ink text-sm placeholder:text-ink-quaternary outline-none focus:border-brand transition-colors"
                  />
                  <button onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-quaternary hover:text-ink-secondary">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2.5 rounded-xl border border-divider bg-surface-subdued text-ink text-sm placeholder:text-ink-quaternary outline-none focus:border-brand transition-colors"
                />
                {saveMsg && (
                  <p className={`flex items-center gap-1.5 text-xs ${saveMsg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {saveMsg.type === 'ok' ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {saveMsg.text}
                  </p>
                )}
                <button
                  onClick={handleChangePassword}
                  disabled={saving || !newPassword}
                  className="px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-hover transition-all disabled:opacity-60 flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Update Password
                </button>
              </div>
            </div>

            {/* MFA placeholder */}
            <div className="bg-white border border-divider rounded-2xl p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-ink">Two-Factor Authentication</h2>
                  <p className="text-xs text-ink-tertiary mt-1">Add an extra layer of security to your account.</p>
                </div>
                <span className="px-2.5 py-1 bg-surface-subdued border border-divider text-[10px] font-bold text-ink-quaternary uppercase rounded-full">Coming Soon</span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AccountLayout>
  )
}
