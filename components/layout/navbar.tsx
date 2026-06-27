import Link from 'next/link'

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 nav-blur border-b border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ScarsianIcon />
          <span className="font-bold text-white">Scarsian</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-white/50">
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/search"  className="hover:text-white transition-colors">Companies</Link>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login"
            className="px-4 py-2 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.06] transition-all">
            Log in
          </Link>
          <Link href="/signup"
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue hover:bg-blue-hover text-white transition-colors">
            Start Free
          </Link>
        </div>
      </div>
    </nav>
  )
}

function ScarsianIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
      <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 4c2.5 0 4.5 1.5 5.5 3.5L16 14l-5.5-4.5C11.5 7.5 13.5 6 16 6zM8 16c0-2.5 1.5-4.5 3.5-5.5L14 16l-2.5 5.5C9.5 20.5 8 18.5 8 16zm8 8c-2.5 0-4.5-1.5-5.5-3.5L16 18l5.5 2.5c-1 2-3 3.5-5.5 3.5zm3.5-9.5L18 16l2.5-5.5c2 1 3.5 3 3.5 5.5s-1.5 4.5-3.5 5.5V14.5z" fill="#3B5BFF"/>
    </svg>
  )
}
