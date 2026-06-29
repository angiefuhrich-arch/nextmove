'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  User, Briefcase, Heart, FileText, Bell,
  Shield, Settings, CreditCard, HelpCircle, LogOut,
} from 'lucide-react'
import { SearchBox } from './SearchBox'

const MENU_ITEMS = [
  { href: '/account', label: 'Profile', icon: User },
  { href: '/wallet', label: 'Career Wallet™', icon: Briefcase },
  { href: '/watchlist', label: 'Watchlist', icon: Heart },
  { href: '/account/briefs', label: 'Purchased Briefs', icon: FileText },
  { href: '/account/notifications', label: 'Notifications', icon: Bell },
  { href: '/account/security', label: 'Security', icon: Shield },
  { href: '/account/preferences', label: 'Preferences', icon: Settings },
  { href: '/account/billing', label: 'Billing & Subscription', icon: CreditCard },
  { href: '/account/help', label: 'Help', icon: HelpCircle },
]

function getInitials(displayName: string | null | undefined, email: string | null | undefined): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : displayName.substring(0, 2).toUpperCase()
  }
  return (email ?? 'SC').substring(0, 2).toUpperCase()
}

export function TopNavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === '/'
  const [showNavSearch, setShowNavSearch] = useState(false)
  const navInputRef = useRef<HTMLInputElement>(null)

  const [credits, setCredits] = useState<number | null>(null)
  const [initials, setInitials] = useState('SC')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fetch user data
  useEffect(() => {
    let active = true
    ;(async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !active) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits, display_name')
        .eq('id', user.id)
        .single()
      if (!active) return
      setCredits(profile?.credits ?? 0)
      setInitials(getInitials(profile?.display_name, user.email))
    })()
    return () => { active = false }
  }, [])

  // Cmd+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isHome) {
          const heroInput = document.querySelector<HTMLInputElement>('#hero-search-box input')
          if (heroInput && !showNavSearch) {
            heroInput.focus()
          } else {
            navInputRef.current?.focus()
          }
        } else {
          navInputRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isHome, showNavSearch])

  // IntersectionObserver on home hero
  useEffect(() => {
    if (!isHome) return
    const target = document.getElementById('hero-search-box')
    if (!target) return
    const observer = new IntersectionObserver(
      ([entry]) => { setShowNavSearch(!entry.isIntersecting) },
      { threshold: 0, rootMargin: '-64px 0px 0px 0px' },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [isHome])

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const showSearch = !isHome || showNavSearch

  const handleLogout = async () => {
    setMenuOpen(false)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-divider z-[100] flex items-center justify-between px-4 md:px-6 gap-3">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
        <ScarsianIcon />
        <span className="text-sm font-bold text-ink hidden sm:inline">Scarsian</span>
      </Link>

      {/* Center: search */}
      <div className={`flex-1 max-w-[480px] mx-auto transition-all duration-200 ${showSearch ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <SearchBox size="compact" placeholder="Search any employer…" inputRef={navInputRef} />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/wallet"
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-light border border-brand/20 text-[11px] hover:bg-brand/10 transition-all"
        >
          <span className="text-brand font-semibold">{credits ?? '—'}</span>
          <span className="text-brand/70 hidden sm:inline">credits</span>
        </Link>

        {/* Avatar + dropdown */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="Account menu"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-[10px] font-bold text-brand hover:bg-brand/20 transition-colors"
          >
            {initials}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-52 bg-white border border-divider rounded-2xl shadow-elevated overflow-hidden z-[200]"
            >
              <div className="py-1.5">
                {MENU_ITEMS.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink-secondary hover:bg-surface-subdued hover:text-ink transition-colors"
                  >
                    <item.icon className="w-3.5 h-3.5 text-ink-quaternary flex-shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="border-t border-divider py-1.5">
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-ink-quaternary flex-shrink-0" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function ScarsianIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 4c2.5 0 4.5 1.5 5.5 3.5L16 14l-5.5-4.5C11.5 7.5 13.5 6 16 6zM8 16c0-2.5 1.5-4.5 3.5-5.5L14 16l-2.5 5.5C9.5 20.5 8 18.5 8 16zm8 8c-2.5 0-4.5-1.5-5.5-3.5L16 18l5.5 2.5c-1 2-3 3.5-5.5 3.5zm3.5-9.5L18 16l2.5-5.5c2 1 3.5 3 3.5 5.5s-1.5 4.5-3.5 5.5V14.5z" fill="#0E5A5E"/>
    </svg>
  )
}
