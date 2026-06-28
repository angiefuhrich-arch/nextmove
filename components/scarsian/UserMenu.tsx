'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Briefcase, Bookmark, Settings, HelpCircle, LogOut, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

function getInitials(user: SupabaseUser | null): string {
  if (!user) return ''
  const name = user.user_metadata?.full_name || user.user_metadata?.name
  if (name) {
    const parts = (name as string).trim().split(/\s+/)
    return parts.map((p: string) => p[0]).join('').toUpperCase().slice(0, 2)
  }
  return (user.email?.[0] ?? '').toUpperCase()
}

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = getInitials(user)
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Guest'

  const items = [
    { icon: User, label: 'Profile', href: '/account' },
    { icon: Briefcase, label: 'Career Wallet', href: '/wallet' },
    { icon: Bookmark, label: 'Watchlist', href: '/watchlist' },
    { icon: BarChart3, label: 'Intelligence Workspace', href: '/admin' },
    { icon: Settings, label: 'Settings', href: '/account' },
    { icon: HelpCircle, label: 'Help & Support', href: '/' },
  ]

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="User menu"
        aria-expanded={open}
        className="w-8 h-8 rounded-full bg-surface-subdued border border-divider flex items-center justify-center hover:bg-surface-elevated transition-colors"
      >
        {initials ? (
          <span className="text-[10px] font-semibold text-ink-secondary">{initials}</span>
        ) : (
          <User className="w-3.5 h-3.5 text-ink-quaternary" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-10 w-60 bg-surface-elevated border border-divider rounded-2xl shadow-dropdown p-2 z-dropdown"
          >
            <div className="px-3 py-2.5">
              <p className="text-body-sm font-semibold text-ink">{displayName}</p>
              {user?.email && <p className="text-caption text-ink-tertiary truncate">{user.email}</p>}
            </div>
            <div className="h-px bg-divider mx-2 my-1" />
            <div className="flex flex-col gap-0.5">
              {items.map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-body-sm text-ink-secondary hover:bg-surface-subdued hover:text-ink transition-all"
                >
                  <item.icon className="w-4 h-4 text-ink-quaternary" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
            <div className="h-px bg-divider mx-2 my-1" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-body-sm text-ink-tertiary hover:bg-status-danger-bg hover:text-status-danger transition-all w-full"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
