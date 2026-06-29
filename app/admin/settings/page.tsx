'use client'

import { AdminLayout } from '@/components/layout/admin-layout'
import { Settings } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function AdminSettingsPage() {
  const pathname = usePathname()
  return (
    <AdminLayout activePath={pathname}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand" />
          <h1 className="text-2xl font-bold text-ink tracking-tight">Settings</h1>
        </div>
        <div className="bg-white border border-divider rounded-2xl p-8 shadow-card text-center">
          <p className="text-sm text-ink-tertiary">Platform settings coming soon.</p>
        </div>
      </div>
    </AdminLayout>
  )
}
