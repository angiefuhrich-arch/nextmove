import { Sidebar } from './sidebar'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#070F1E' }}>
      <Sidebar />
      <main className="ml-60 min-h-screen text-white">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
