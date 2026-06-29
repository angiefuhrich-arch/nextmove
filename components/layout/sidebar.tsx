'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Search, BarChart3, BookmarkCheck,
  Briefcase, CreditCard, LogOut, ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/search',          label: 'Company Search',  icon: Search },
  { href: '/compare',         label: 'Compare',         icon: BarChart3 },
  { href: '/watchlist',       label: 'Watchlist',       icon: BookmarkCheck },
  { href: '/offer-assistant', label: 'Offer Assistant', icon: Briefcase },
  { href: '/account',         label: 'Account',         icon: CreditCard },
]

function ScarsianIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 4c2.5 0 4.5 1.5 5.5 3.5L16 14l-5.5-4.5C11.5 7.5 13.5 6 16 6zM8 16c0-2.5 1.5-4.5 3.5-5.5L14 16l-2.5 5.5C9.5 20.5 8 18.5 8 16zm8 8c-2.5 0-4.5-1.5-5.5-3.5L16 18l5.5 2.5c-1 2-3 3.5-5.5 3.5zm3.5-9.5L18 16l2.5-5.5c2 1 3.5 3 3.5 5.5s-1.5 4.5-3.5 5.5V14.5z" fill="#0E5A5E"/>
    </svg>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      setIsAdmin(!!data?.is_admin)
    }
    checkAdmin()
  }, [])

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.replace('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 flex flex-col z-40 border-r border-white/[0.06]"
      style={{ background: '#070F1E' }}>
      <div className="p-6 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <ScarsianIcon />
          <span className="text-white font-bold">Scarsian</span>
        </Link>
        <p className="text-white/30 text-xs mt-1">Career Intelligence</p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-blue/15 text-blue border border-blue/20'
                : 'text-white/40 hover:text-white hover:bg-white/[0.06] border border-transparent'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-semibold text-white/20 uppercase tracking-wider">Admin</p>
            </div>
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                pathname.startsWith('/admin')
                  ? 'bg-blue/15 text-blue border border-blue/20'
                  : 'text-white/40 hover:text-white hover:bg-white/[0.06] border border-transparent'
              )}
            >
              <ShieldCheck size={16} />
              Intelligence Pipeline
            </Link>
          </>
        )}
      </nav>

      <div className="p-3 border-t border-white/[0.06]">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/30 hover:text-white hover:bg-white/[0.06] w-full transition-all"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
