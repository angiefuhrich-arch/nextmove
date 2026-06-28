import { cn } from '@/lib/utils'
import { HTMLAttributes, ReactNode } from 'react'

// ─── PageContainer ──────────────────────────────────────────────
// Wraps an entire page. Accounts for fixed TopNavBar (56px).
interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  noPad?: boolean
}
export function PageContainer({ className, noPad = false, ...props }: PageContainerProps) {
  return (
    <div
      className={cn('min-h-svh bg-surface pt-14', !noPad && 'pb-20', className)}
      {...props}
    />
  )
}

// ─── ContentContainer ────────────────────────────────────────────
// Centers content with a max-width constraint and horizontal padding.
interface ContentContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
}
const containerWidths: Record<string, string> = {
  xs:   'max-w-[520px]',
  sm:   'max-w-[680px]',
  md:   'max-w-[880px]',
  lg:   'max-w-[1100px]',
  xl:   'max-w-[1280px]',
  full: 'max-w-none',
}
export function ContentContainer({ className, size = 'md', ...props }: ContentContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full px-4 md:px-6', containerWidths[size], className)}
      {...props}
    />
  )
}

// ─── TwoColumnLayout ────────────────────────────────────────────
// Left column (narrow) + right column (wide). Stacks on mobile.
interface TwoColumnLayoutProps {
  left: ReactNode
  right: ReactNode
  leftWidth?: 'narrow' | 'equal'
  className?: string
  gap?: 'sm' | 'md' | 'lg'
}
const leftWidths  = { narrow: 'lg:w-[300px] shrink-0', equal: 'lg:flex-1' }
const columnGaps  = { sm: 'gap-4', md: 'gap-6', lg: 'gap-8 md:gap-10' }

export function TwoColumnLayout({ left, right, leftWidth = 'narrow', className, gap = 'lg' }: TwoColumnLayoutProps) {
  return (
    <div className={cn('flex flex-col lg:flex-row', columnGaps[gap], className)}>
      <aside className={cn('w-full', leftWidths[leftWidth])}>
        {left}
      </aside>
      <main className="flex-1 min-w-0">
        {right}
      </main>
    </div>
  )
}

// ─── DetailLayout ────────────────────────────────────────────────
// Standard detail page: header strip + body columns.
interface DetailLayoutProps {
  header: ReactNode
  sidebar?: ReactNode
  children: ReactNode
  className?: string
}
export function DetailLayout({ header, sidebar, children, className }: DetailLayoutProps) {
  return (
    <PageContainer>
      <div className="border-b border-divider bg-surface-elevated">
        <ContentContainer size="lg" className="py-8">
          {header}
        </ContentContainer>
      </div>
      <ContentContainer size="lg" className="py-8">
        {sidebar
          ? <TwoColumnLayout left={sidebar} right={children} />
          : children
        }
      </ContentContainer>
    </PageContainer>
  )
}

// ─── SidebarLayout ───────────────────────────────────────────────
// Fixed sidebar (admin / dashboard) + scrollable content area.
interface SidebarLayoutProps {
  sidebar: ReactNode
  children: ReactNode
  className?: string
}
export function SidebarLayout({ sidebar, children, className }: SidebarLayoutProps) {
  return (
    <div className={cn('flex min-h-svh pt-14', className)}>
      <nav className="hidden lg:flex w-60 xl:w-64 shrink-0 flex-col border-r border-divider bg-surface-elevated fixed top-14 bottom-0 overflow-y-auto">
        {sidebar}
      </nav>
      <div className="flex-1 lg:pl-60 xl:pl-64 min-w-0">
        {children}
      </div>
    </div>
  )
}
