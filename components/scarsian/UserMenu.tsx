'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Briefcase, Bookmark, Settings, HelpCircle, Shield, LogOut, BarChart3 } from 'lucide-react'

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const items = [
    { icon: User, label: 'Profile', href: '/account' },
    { icon: Briefcase, label: 'Career Wallet', href: '/wallet' },
    { icon: Bookmark, label: 'Watchlist', href: '/watchlist' },
    { icon: BarChart3, label: 'Intelligence Workspace', href: '/admin' },
    { icon: Settings, label: 'Settings', href: '/account' },
    { icon: HelpCircle, label: 'Help & Support', href: '/' },
    { icon: Shield, label: 'Admin Portal', href: '/admin', adminOnly: true },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white hover:bg-white/15 transition-colors border border-white/10"
      >
        SC
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-11 w-60 bg-navy-dark/95 backdrop-blur-xl border border-navy-light rounded-2xl shadow-dropdown p-2 z-[300]"
          >
            <div className="px-3 py-2.5">
              <p className="text-sm font-semibold text-white">Career Professional</p>
              <p className="text-[11px] text-white/40">3 credits remaining</p>
            </div>
            <div className="h-px bg-navy-light mx-2 my-1" />
            <div className="flex flex-col gap-0.5">
              {items.filter(i => !i.adminOnly).map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/65 hover:bg-white/[0.06] hover:text-white transition-all"
                >
                  <item.icon className="w-4 h-4 text-white/40" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
            <div className="h-px bg-navy-light mx-2 my-1" />
            <button
              onClick={() => { router.push('/'); setOpen(false) }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/40 hover:bg-verdict-red/10 hover:text-verdict-red transition-all w-full"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
