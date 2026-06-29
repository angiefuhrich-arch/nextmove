'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { User, Sparkles, FileText, Heart, Clock, Loader2, Check, AlertCircle, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { AccountLayout } from '@/components/scarsian/AccountLayout'

interface ProfileData {
  id: string
  email: string
  display_name: string | null
  credits: number
  is_admin: boolean
  member_since: string
  brief_count: number
  saved_count: number
  search_count: number
}

function getInitials(displayName: string | null, email: string): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : displayName.substring(0, 2).toUpperCase()
  }
  return email.substring(0, 2).toUpperCase()
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editName, setEditName] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<'ok' | 'err' | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !active) { setLoading(false); return }

      const [{ data: p }, { count: briefCount }, { count: savedCount }, { count: searchCount }] =
        await Promise.all([
          supabase.from('profiles').select('display_name, credits, is_admin, created_at').eq('id', user.id).single(),
          supabase.from('brief_unlocks').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('saved_companies').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('pipeline_runs').select('*', { count: 'exact', head: true }).eq('requested_by', user.id),
        ])

      if (!active) return
      const data: ProfileData = {
        id: user.id,
        email: user.email ?? '',
        display_name: p?.display_name ?? null,
        credits: p?.credits ?? 0,
        is_admin: p?.is_admin ?? false,
        member_since: p?.created_at ?? user.created_at ?? '',
        brief_count: briefCount ?? 0,
        saved_count: savedCount ?? 0,
        search_count: searchCount ?? 0,
      }
      setProfile(data)
      setEditName(data.display_name ?? '')
      setLoading(false)
    })()
    return () => { active = false }
  }, [])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: editName.trim() || null }),
      })
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, display_name: editName.trim() || null } : prev)
        setSaveMsg('ok')
        setEditing(false)
      } else {
        setSaveMsg('err')
      }
    } catch { setSaveMsg('err') }
    setSaving(false)
  }

  if (loading) {
    return (
      <AccountLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-brand animate-spin" />
        </div>
      </AccountLayout>
    )
  }

  if (!profile) {
    return (
      <AccountLayout>
        <div className="text-center py-24 text-ink-tertiary text-sm">
          Could not load profile. Please <Link href="/login" className="text-brand underline">sign in</Link>.
        </div>
      </AccountLayout>
    )
  }

  const avatarInitials = getInitials(profile.display_name, profile.email)

  const stats = [
    { icon: Sparkles, label: 'Credits', value: profile.credits.toString(), sub: 'available', href: '/wallet' },
    { icon: FileText, label: 'Briefs Unlocked', value: profile.brief_count.toString(), sub: 'all time', href: '/account/briefs' },
    { icon: Heart, label: 'Watchlist', value: profile.saved_count.toString(), sub: 'companies', href: '/watchlist' },
    { icon: Clock, label: 'Searches', value: profile.search_count.toString(), sub: 'all time', href: null },
  ]

  return (
    <AccountLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <User className="w-5 h-5 text-brand" />
            <h1 className="text-2xl font-bold text-ink tracking-tight">Profile</h1>
          </div>
          <p className="text-sm text-ink-tertiary">Your account details and usage summary.</p>
        </div>

        {/* Avatar + identity */}
        <div className="bg-white border border-divider rounded-2xl p-6 shadow-card flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-xl font-bold text-brand flex-shrink-0">
            {avatarInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-base font-semibold text-ink">
                {profile.display_name ?? profile.email.split('@')[0]}
              </p>
              {profile.is_admin && (
                <span className="px-2 py-0.5 bg-brand text-white text-[9px] font-bold uppercase rounded-full">Admin</span>
              )}
              <span className="px-2 py-0.5 bg-surface-subdued border border-divider text-[9px] font-semibold text-ink-tertiary rounded-full uppercase">Free</span>
            </div>
            <p className="text-sm text-ink-tertiary mt-0.5">{profile.email}</p>
            <p className="text-xs text-ink-quaternary mt-1">
              Member since {profile.member_since ? new Date(profile.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s, i) => {
            const card = (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`bg-white border border-divider rounded-2xl p-4 shadow-card flex flex-col gap-1 ${s.href ? 'hover:shadow-elevated hover:border-brand/20 transition-all cursor-pointer' : ''}`}
              >
                <s.icon className="w-4 h-4 text-brand mb-1" />
                <div className="text-2xl font-bold text-ink">{s.value}</div>
                <div className="text-[11px] text-ink-secondary">{s.label}</div>
                <div className="text-[10px] text-ink-quaternary">{s.sub}</div>
              </motion.div>
            )
            return s.href
              ? <Link key={s.label} href={s.href}>{card}</Link>
              : <div key={s.label}>{card}</div>
          })}
        </div>

        {/* Edit display name */}
        <div className="bg-white border border-divider rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink">Display Name</h2>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-xs text-brand hover:underline">Edit</button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Your display name"
                maxLength={80}
                className="w-full px-4 py-2.5 rounded-xl border border-divider bg-surface-subdued text-ink text-sm placeholder:text-ink-quaternary outline-none focus:border-brand transition-colors"
              />
              {saveMsg === 'ok' && (
                <p className="flex items-center gap-1.5 text-xs text-emerald-600"><Check className="w-3.5 h-3.5" />Saved</p>
              )}
              {saveMsg === 'err' && (
                <p className="flex items-center gap-1.5 text-xs text-red-500"><AlertCircle className="w-3.5 h-3.5" />Could not save. Try again.</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-brand text-white text-xs font-semibold rounded-xl hover:bg-brand-hover transition-all disabled:opacity-60 flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save
                </button>
                <button
                  onClick={() => { setEditing(false); setSaveMsg(null); setEditName(profile.display_name ?? '') }}
                  className="px-4 py-2 border border-divider text-ink-secondary text-xs rounded-xl hover:bg-surface-subdued transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-secondary">
              {profile.display_name ?? <span className="text-ink-quaternary italic">Not set</span>}
            </p>
          )}
        </div>

        {/* Quick links */}
        <div className="bg-white border border-divider rounded-2xl p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink mb-4">Account Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { href: '/wallet', label: 'Add Credits', sub: 'Purchase Intelligence Brief credits', icon: Briefcase },
              { href: '/watchlist', label: 'Manage Watchlist', sub: 'View and manage saved companies', icon: Heart },
              { href: '/account/briefs', label: 'Purchased Briefs', sub: 'Access your Intelligence Briefs', icon: FileText },
              { href: '/account/security', label: 'Security Settings', sub: 'Password and session management', icon: User },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-divider hover:border-brand/30 hover:shadow-card transition-all bg-surface-subdued">
                <div className="w-8 h-8 rounded-lg bg-brand/8 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink">{item.label}</p>
                  <p className="text-[11px] text-ink-quaternary mt-0.5">{item.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white border border-red-100 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h2>
          <p className="text-xs text-ink-tertiary mb-4">
            Permanently delete your account and all associated data. This cannot be undone.
            Personal data will be removed in compliance with applicable privacy regulations.
          </p>
          <button
            disabled
            className="px-4 py-2 border border-red-200 text-red-500 text-xs font-medium rounded-xl opacity-50 cursor-not-allowed"
          >
            Delete Account — Contact support to request
          </button>
        </div>

      </motion.div>
    </AccountLayout>
  )
}
