'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Search, Command, Sparkles } from 'lucide-react'
import { CommandPalette } from './CommandPalette'

export function TopNavBar() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [paletteOpen, setPaletteOpen] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 nav-blur border-b border-white/[0.06] z-[100] flex items-center justify-between px-4 md:px-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ScarsianIcon />
          <span className="text-sm font-bold text-white hidden sm:inline">Scarsian</span>
        </Link>

        {/* Center: search trigger (hidden on home) */}
        {!isHome && (
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/35 hover:text-white/60 hover:border-white/15 transition-all text-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search companies...</span>
            <div className="ml-2 flex items-center gap-0.5 text-[9px] text-white/20 border border-white/10 rounded px-1 py-0.5">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
          </button>
        )}

        {/* Right */}
        <div className="flex items-center gap-2">
          {!isHome && (
            <Link
              href="/"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/40 hover:text-blue hover:bg-blue/10 transition-all"
              title="Home"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </Link>
          )}
          <Link
            href="/wallet"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] hover:bg-white/10 transition-all"
          >
            <span className="text-blue font-semibold">3</span>
            <span className="text-white/40 hidden sm:inline">credits</span>
          </Link>
          <Link
            href="/account"
            className="w-8 h-8 rounded-full bg-navy-light flex items-center justify-center text-xs font-bold text-white hover:bg-blue/20 transition-colors"
          >
            A
          </Link>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  )
}

function ScarsianIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 4c2.5 0 4.5 1.5 5.5 3.5L16 14l-5.5-4.5C11.5 7.5 13.5 6 16 6zM8 16c0-2.5 1.5-4.5 3.5-5.5L14 16l-2.5 5.5C9.5 20.5 8 18.5 8 16zm8 8c-2.5 0-4.5-1.5-5.5-3.5L16 18l5.5 2.5c-1 2-3 3.5-5.5 3.5zm3.5-9.5L18 16l2.5-5.5c2 1 3.5 3 3.5 5.5s-1.5 4.5-3.5 5.5V14.5z" fill="#3B5BFF"/>
    </svg>
  )
}
