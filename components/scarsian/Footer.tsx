import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-divider bg-surface-elevated py-10 px-6">
      <div className="max-w-[800px] mx-auto flex flex-col items-center gap-5">
        <div className="flex items-center gap-2">
          <ScarsianIcon />
          <span className="text-sm font-bold text-ink">Scarsian</span>
        </div>
        <p className="text-xs text-ink-tertiary">Evidence-based employer intelligence</p>
        <div className="flex items-center gap-6">
          <Link href="/admin" className="text-[11px] text-ink-tertiary hover:text-ink-secondary transition-colors">Intelligence Center</Link>
          <Link href="/wallet" className="text-[11px] text-ink-tertiary hover:text-ink-secondary transition-colors">Career Wallet</Link>
          <Link href="/watchlist" className="text-[11px] text-ink-tertiary hover:text-ink-secondary transition-colors">Watchlist</Link>
          <Link href="/compare" className="text-[11px] text-ink-tertiary hover:text-ink-secondary transition-colors">Compare</Link>
        </div>
        <p className="text-[10px] text-ink-quaternary">&copy; 2026 Scarsian. All rights reserved.</p>
      </div>
    </footer>
  )
}

function ScarsianIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
      <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 4c2.5 0 4.5 1.5 5.5 3.5L16 14l-5.5-4.5C11.5 7.5 13.5 6 16 6zM8 16c0-2.5 1.5-4.5 3.5-5.5L14 16l-2.5 5.5C9.5 20.5 8 18.5 8 16zm8 8c-2.5 0-4.5-1.5-5.5-3.5L16 18l5.5 2.5c-1 2-3 3.5-5.5 3.5zm3.5-9.5L18 16l2.5-5.5c2 1 3.5 3 3.5 5.5s-1.5 4.5-3.5 5.5V14.5z" fill="#0E5A5E"/>
    </svg>
  )
}
