'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import {
  UsersRound, Loader2, RefreshCw, Plus, X, ChevronDown,
  CheckCircle, Clock, Ban, Crown, ShieldCheck,
} from 'lucide-react'

type TeamRole = 'owner' | 'admin' | 'analyst' | 'support' | 'finance' | 'viewer'
type TeamStatus = 'pending' | 'active' | 'suspended'

interface TeamMember {
  id: string
  email: string
  name: string | null
  role: TeamRole
  status: TeamStatus
  invited_at: string
  accepted_at: string | null
  last_login_at: string | null
  invited_by: string | null
}

const ROLE_LABELS: Record<TeamRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  analyst: 'Analyst',
  support: 'Support',
  finance: 'Finance',
  viewer: 'Viewer',
}

const ROLE_PERMISSIONS: Record<TeamRole, string> = {
  owner: 'Full access · manage team · billing · system settings',
  admin: 'Manage users · evidence · reports · pipelines',
  analyst: 'Review evidence · approve/reject briefs · signals',
  support: 'View users & credits · help with accounts',
  finance: 'View payments · credit transactions · refunds',
  viewer: 'Read-only admin access',
}

const ROLE_COLORS: Record<TeamRole, string> = {
  owner:   'bg-brand/10 text-brand',
  admin:   'bg-blue-50 text-blue-700',
  analyst: 'bg-purple-50 text-purple-700',
  support: 'bg-emerald-50 text-emerald-700',
  finance: 'bg-amber-50 text-amber-700',
  viewer:  'bg-slate-100 text-slate-600',
}

function StatusBadge({ status }: { status: TeamStatus }) {
  if (status === 'active') return (
    <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold uppercase">
      <CheckCircle className="w-3 h-3" /> Active
    </span>
  )
  if (status === 'pending') return (
    <span className="flex items-center gap-1 text-amber-600 text-[10px] font-bold uppercase">
      <Clock className="w-3 h-3" /> Pending
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-red-500 text-[10px] font-bold uppercase">
      <Ban className="w-3 h-3" /> Suspended
    </span>
  )
}

function RoleBadge({ role }: { role: TeamRole }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ROLE_COLORS[role]}`}>
      {role === 'owner' && <Crown className="inline w-2.5 h-2.5 mr-0.5 -mt-0.5" />}
      {role === 'admin' && <ShieldCheck className="inline w-2.5 h-2.5 mr-0.5 -mt-0.5" />}
      {ROLE_LABELS[role]}
    </span>
  )
}

const ALL_ROLES: TeamRole[] = ['owner', 'admin', 'analyst', 'support', 'finance', 'viewer']

export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRole>('viewer')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')

  // Role change tracking
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/team')
      if (!res.ok) return
      const data = await res.json()
      setMembers(data.members ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const t = setTimeout(async () => { if (active) await load() }, 0)
    return () => { active = false; clearTimeout(t) }
  }, [load])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError('')
    if (!inviteEmail) { setInviteError('Email is required'); return }
    setInviteLoading(true)
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, name: inviteName || undefined, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) { setInviteError(data.error ?? 'Failed'); return }
      setInviteEmail('')
      setInviteName('')
      setInviteRole('viewer')
      setShowInvite(false)
      await load()
    } finally {
      setInviteLoading(false)
    }
  }

  async function handleRoleChange(member: TeamMember, role: TeamRole) {
    setUpdatingId(member.id)
    try {
      await fetch('/api/admin/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: member.id, role }),
      })
      await load()
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleStatusChange(member: TeamMember, status: TeamStatus) {
    setUpdatingId(member.id)
    try {
      await fetch('/api/admin/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: member.id, status }),
      })
      await load()
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleRemove(member: TeamMember) {
    if (!confirm(`Remove ${member.email} from the team?`)) return
    await fetch(`/api/admin/team?id=${member.id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <AdminLayout activePath="/admin/team">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UsersRound className="w-5 h-5 text-brand" />
              <h1 className="text-xl font-bold text-ink">Admin Team</h1>
            </div>
            <p className="text-sm text-ink-tertiary">{members.length} team member{members.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => load()} className="p-2 rounded-xl border border-divider hover:bg-surface-subdued transition-colors">
              <RefreshCw className="w-4 h-4 text-ink-tertiary" />
            </button>
            <button onClick={() => setShowInvite(v => !v)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors">
              <Plus className="w-4 h-4" />
              Invite Member
            </button>
          </div>
        </div>

        {/* Invite form */}
        {showInvite && (
          <div className="bg-white border border-brand/20 rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-ink">Invite Team Member</h2>
              <button onClick={() => { setShowInvite(false); setInviteError('') }}
                className="p-1 hover:bg-surface-subdued rounded-lg transition-colors">
                <X className="w-4 h-4 text-ink-quaternary" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
              <div>
                <label className="block text-[11px] text-ink-quaternary mb-1 uppercase tracking-wider">Email</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com" required
                  className="w-full px-3 py-2 rounded-xl border border-divider bg-surface text-sm text-ink outline-none focus:border-brand transition-colors placeholder:text-ink-quaternary" />
              </div>
              <div>
                <label className="block text-[11px] text-ink-quaternary mb-1 uppercase tracking-wider">Name (optional)</label>
                <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3 py-2 rounded-xl border border-divider bg-surface text-sm text-ink outline-none focus:border-brand transition-colors placeholder:text-ink-quaternary" />
              </div>
              <div>
                <label className="block text-[11px] text-ink-quaternary mb-1 uppercase tracking-wider">Role</label>
                <div className="relative">
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value as TeamRole)}
                    className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-divider bg-surface text-sm text-ink outline-none focus:border-brand transition-colors">
                    {ALL_ROLES.filter(r => r !== 'owner').map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-quaternary pointer-events-none" />
                </div>
              </div>
              <button type="submit" disabled={inviteLoading}
                className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap">
                {inviteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Send Invite
              </button>
            </form>
            {inviteError && <p className="mt-2 text-xs text-red-600">{inviteError}</p>}
            <p className="mt-3 text-[11px] text-ink-quaternary">
              {ROLE_PERMISSIONS[inviteRole]}
            </p>
          </div>
        )}

        {/* Team table */}
        <div className="bg-white border border-divider rounded-2xl shadow-card overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 px-5 py-2.5 border-b border-divider bg-surface-subdued">
            {['Member', 'Role', 'Status', 'Joined / Invited', ''].map(h => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-ink-quaternary">{h}</span>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-brand animate-spin" /></div>
          ) : members.length === 0 ? (
            <div className="py-16 text-center text-sm text-ink-tertiary">No team members yet.</div>
          ) : (
            <div className="divide-y divide-divider">
              {members.map(member => (
                <div key={member.id} className="grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 px-5 py-4 items-center hover:bg-surface-subdued/50 transition-colors">
                  {/* Identity */}
                  <div>
                    <p className="text-sm font-medium text-ink">{member.name ?? member.email}</p>
                    {member.name && <p className="text-[11px] text-ink-quaternary">{member.email}</p>}
                  </div>

                  {/* Role — editable for non-owners */}
                  <div className="flex items-center gap-2">
                    {member.role === 'owner' ? (
                      <RoleBadge role={member.role} />
                    ) : (
                      <div className="relative">
                        <select
                          value={member.role}
                          disabled={updatingId === member.id}
                          onChange={e => handleRoleChange(member, e.target.value as TeamRole)}
                          className="appearance-none pl-2 pr-6 py-1 rounded-lg border border-divider bg-surface text-xs text-ink outline-none focus:border-brand transition-colors disabled:opacity-50"
                        >
                          {ALL_ROLES.filter(r => r !== 'owner').map(r => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-quaternary pointer-events-none" />
                      </div>
                    )}
                    {updatingId === member.id && <Loader2 className="w-3 h-3 animate-spin text-brand" />}
                  </div>

                  {/* Status */}
                  <StatusBadge status={member.status} />

                  {/* Dates */}
                  <div>
                    {member.accepted_at ? (
                      <p className="text-xs text-ink-tertiary">
                        Joined {new Date(member.accepted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </p>
                    ) : (
                      <p className="text-xs text-ink-quaternary">
                        Invited {new Date(member.invited_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {member.role !== 'owner' && (
                    <div className="flex items-center gap-1">
                      {member.status !== 'suspended' ? (
                        <button onClick={() => handleStatusChange(member, 'suspended')}
                          className="px-2.5 py-1 rounded-lg border border-divider text-[11px] text-ink-secondary hover:border-red-200 hover:text-red-600 transition-colors whitespace-nowrap">
                          Suspend
                        </button>
                      ) : (
                        <button onClick={() => handleStatusChange(member, 'active')}
                          className="px-2.5 py-1 rounded-lg border border-divider text-[11px] text-ink-secondary hover:border-emerald-200 hover:text-emerald-600 transition-colors whitespace-nowrap">
                          Restore
                        </button>
                      )}
                      <button onClick={() => handleRemove(member)}
                        className="p-1.5 rounded-lg border border-divider text-ink-quaternary hover:border-red-200 hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Permissions legend */}
        <div className="bg-white border border-divider rounded-2xl shadow-card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-quaternary mb-3">Role Permissions</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALL_ROLES.map(role => (
              <div key={role} className="flex items-start gap-2.5">
                <RoleBadge role={role} />
                <p className="text-[11px] text-ink-quaternary leading-relaxed">{ROLE_PERMISSIONS[role]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
