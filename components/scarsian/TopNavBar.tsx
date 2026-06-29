'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { SearchBox } from './SearchBox'

export function TopNavBar() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [showNavSearch, setShowNavSearch] = useState(false)
  const navInputRef = useRef<HTMLInputElement>(null)

  // On home: observe the hero search box and show navbar search when it scrolls off screen
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

  // Cmd+K: focus whichever search is active
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isHome) {
          // If hero is visible, focus hero input; otherwise focus nav input
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

  const showSearch = !isHome || showNavSearch

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-divider z-[100] flex items-center justify-between px-4 md:px-6 gap-3">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
        <ScarsianIcon />
        <span className="text-sm font-bold text-ink hidden sm:inline">Scarsian</span>
      </Link>

      {/* Center: search — only when not on home or hero has scrolled off */}
      <div className={`flex-1 max-w-[480px] mx-auto transition-all duration-200 ${showSearch ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <SearchBox
          size="compact"
          placeholder="Search any employer…"
          inputRef={navInputRef}
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/wallet"
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-light border border-brand/20 text-[11px] hover:bg-brand/10 transition-all"
        >
          <span className="text-brand font-semibold">47</span>
          <span className="text-brand/70 hidden sm:inline">credits</span>
        </Link>
        <UserAvatar />
      </div>
    </header>
  )
}

function UserAvatar() {
  return (
    <Link
      href="/account"
      className="w-8 h-8 rounded-full bg-ink-quaternary/30 flex items-center justify-center text-[10px] font-bold text-ink hover:bg-ink-quaternary/50 transition-colors border border-divider"
    >
      SC
    </Link>
  )
}

function ScarsianIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 4c2.5 0 4.5 1.5 5.5 3.5L16 14l-5.5-4.5C11.5 7.5 13.5 6 16 6zM8 16c0-2.5 1.5-4.5 3.5-5.5L14 16l-2.5 5.5C9.5 20.5 8 18.5 8 16zm8 8c-2.5 0-4.5-1.5-5.5-3.5L16 18l5.5 2.5c-1 2-3 3.5-5.5 3.5zm3.5-9.5L18 16l2.5-5.5c2 1 3.5 3 3.5 5.5s-1.5 4.5-3.5 5.5V14.5z" fill="#0E5A5E"/>
    </svg>
  )
}
