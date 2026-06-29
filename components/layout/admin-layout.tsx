import Link from 'next/link'
import { Activity, AlertTriangle, FileText, List, Settings, Shield, Home, Users, CreditCard, Unlock, UsersRound } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin',                        label: 'Overview',            icon: Home          },
  { href: '/admin/users',                  label: 'Users',               icon: Users         },
  { href: '/admin/credit-transactions',    label: 'Credit Transactions', icon: CreditCard    },
  { href: '/admin/brief-unlocks',          label: 'Brief Unlocks',       icon: Unlock        },
  { href: '/admin/runs',                   label: 'Pipeline Runs',       icon: Activity      },
  { href: '/admin/pipeline-failures',      label: 'Failed Pipelines',    icon: AlertTriangle },
  { href: '/admin/evidence',               label: 'Evidence Queue',      icon: FileText      },
  { href: '/admin/sources',                label: 'Source Queue',        icon: List          },
  { href: '/admin/audit',                  label: 'Audit Log',           icon: Shield        },
  { href: '/admin/tiers',                  label: 'Tier Rules',          icon: Settings      },
  { href: '/admin/team',                   label: 'Team',                icon: UsersRound    },
  { href: '/admin/settings',               label: 'Settings',            icon: Settings      },
]

interface AdminLayoutProps {
  children: React.ReactNode
  activePath?: string
}

export function AdminLayout({ children, activePath }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-surface pt-14">
      <div className="flex">
        {/* Sidebar — 240px, hidden <lg */}
        <aside className="hidden lg:flex flex-col fixed left-0 top-14 bottom-0 w-60 bg-surface-elevated border-r border-divider z-10 py-4">
          <div className="px-4 mb-2">
            <p className="text-label uppercase tracking-[0.08em] text-ink-quaternary">Intelligence Center</p>
          </div>
          <nav className="flex flex-col gap-0.5 px-2">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = activePath === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2.5 h-9 px-3 rounded-lg text-nav transition-colors duration-fast',
                    isActive
                      ? 'bg-brand-light text-brand font-semibold'
                      : 'text-ink-tertiary hover:text-ink-secondary hover:bg-surface-subdued'
                  )}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Mobile tab bar — horizontal scroll, <lg only */}
        <div className="lg:hidden fixed top-14 left-0 right-0 z-10 bg-surface-elevated border-b border-divider overflow-x-auto">
          <div className="flex gap-1 px-4 py-2 min-w-max">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive = activePath === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'h-8 px-3 rounded-md text-button-sm whitespace-nowrap transition-colors duration-fast',
                    isActive
                      ? 'bg-brand-light text-brand font-semibold'
                      : 'text-ink-tertiary hover:text-ink-secondary hover:bg-surface-subdued'
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 lg:ml-60 min-h-screen pt-0 lg:pt-0 mt-10 lg:mt-0">
          <div className="px-6 py-8 max-w-[calc(1000px+240px)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
