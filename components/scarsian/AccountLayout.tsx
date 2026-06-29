'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  User, Briefcase, Heart, FileText, Bell,
  Shield, Settings, CreditCard, HelpCircle, LogOut,
} from 'lucide-react'

const NAV = [
  { href: '/account', label: 'Profile', icon: User, exact: true },
  { href: '/wallet', label: 'Career Wallet™', icon: Briefcase, exact: false },
  { href: '/watchlist', label: 'Watchlist', icon: Heart, exact: false },
  { href: '/account/briefs', label: 'Purchased Briefs', icon: FileText, exact: false },
  { href: '/account/notifications', label: 'Notifications', icon: Bell, exact: false },
  { href: '/account/security', label: 'Security', icon: Shield, exact: false },
  { href: '/account/preferences', label: 'Preferences', icon: Settings, exact: false },
  { href: '/account/billing', label: 'Billing & Subscription', icon: CreditCard, exact: false },
  { href: '/account/help', label: 'Help', icon: HelpCircle, exact: false },
]

export function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-surface pt-14 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 border-r border-divider bg-white fixed top-14 bottom-0 left-0 z-10 overflow-y-auto">
        <div className="px-3 py-5 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-quaternary px-2 mb-3">Account</p>
          <nav className="flex flex-col gap-0.5">
            {NAV.map(item => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-colors ${
                    active
                      ? 'bg-brand/8 text-brand font-semibold'
                      : 'text-ink-secondary hover:bg-surface-subdued hover:text-ink'
                  }`}
                >
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-brand' : 'text-ink-quaternary'}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="px-3 py-4 border-t border-divider">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm text-ink-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0 text-ink-quaternary" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-14 left-0 right-0 z-10 bg-white border-b border-divider overflow-x-auto">
        <div className="flex gap-0 px-3 py-2 min-w-max">
          {NAV.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                  active ? 'bg-brand/8 text-brand font-semibold' : 'text-ink-secondary'
                }`}
              >
                <item.icon className={`w-3.5 h-3.5 ${active ? 'text-brand' : 'text-ink-quaternary'}`} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-56 pt-10 md:pt-0">
        <div className="max-w-[760px] mx-auto px-6 py-10 md:py-14">
          {children}
        </div>
      </main>
    </div>
  )
}
