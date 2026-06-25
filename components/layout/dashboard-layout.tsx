import { Sidebar } from './sidebar'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
