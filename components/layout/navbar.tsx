import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function Navbar() {
  let user = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Unauthenticated or Supabase not available
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-14 bg-surface-elevated/95 backdrop-blur-[12px] border-b border-divider-subtle"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-[1000px] mx-auto px-6 h-full flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity duration-fast">
          <ScarsianIcon />
          <span className="text-nav font-bold text-ink tracking-tight">Scarsian</span>
        </Link>

        {/* Nav items */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink href="/compare">Compare</NavLink>
          <NavLink href="/watchlist">Watchlist</NavLink>
          {user && <NavLink href="/admin">Admin</NavLink>}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <Link
                href="/wallet"
                className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-md bg-brand-light text-brand text-button-sm font-semibold hover:bg-brand/10 transition-colors duration-fast"
              >
                Credits
              </Link>
              <Link
                href="/account"
                className="w-8 h-8 rounded-full bg-surface-subdued border border-divider flex items-center justify-center text-caption font-semibold text-ink-secondary hover:bg-divider transition-colors duration-fast"
                aria-label="Account"
              >
                {user.email?.charAt(0).toUpperCase() ?? 'U'}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="h-8 px-4 rounded-md text-button-sm font-semibold text-ink-secondary hover:bg-surface-subdued transition-colors duration-fast"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="h-8 px-4 rounded-md text-button-sm font-semibold bg-brand text-white hover:bg-brand-hover transition-colors duration-fast"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="h-8 px-3 rounded-md flex items-center text-nav text-ink-tertiary hover:text-ink-secondary hover:bg-surface-subdued transition-colors duration-fast"
    >
      {children}
    </Link>
  )
}

function ScarsianIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 4c2.5 0 4.5 1.5 5.5 3.5L16 14l-5.5-4.5C11.5 7.5 13.5 6 16 6zM8 16c0-2.5 1.5-4.5 3.5-5.5L14 16l-2.5 5.5C9.5 20.5 8 18.5 8 16zm8 8c-2.5 0-4.5-1.5-5.5-3.5L16 18l5.5 2.5c-1 2-3 3.5-5.5 3.5zm3.5-9.5L18 16l2.5-5.5c2 1 3.5 3 3.5 5.5s-1.5 4.5-3.5 5.5V14.5z" fill="#2563EB"/>
    </svg>
  )
}
