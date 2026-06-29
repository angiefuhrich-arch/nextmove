'use client'

import { AdminLayout } from '@/components/layout/admin-layout'
import { List } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function AdminSourcesPage() {
  const pathname = usePathname()
  return (
    <AdminLayout activePath={pathname}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <List className="w-5 h-5 text-brand" />
          <h1 className="text-2xl font-bold text-ink tracking-tight">Source Queue</h1>
        </div>
        <div className="bg-white border border-divider rounded-2xl p-10 shadow-card text-center">
          <List className="w-8 h-8 text-ink-quaternary mx-auto mb-3" />
          <p className="text-sm font-medium text-ink mb-1">Source ingestion tools are not available yet.</p>
          <p className="text-xs text-ink-tertiary max-w-sm mx-auto leading-relaxed">
            This area will be used to monitor and manage employer data sources.
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}
