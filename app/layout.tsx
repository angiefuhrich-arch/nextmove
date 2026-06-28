import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/lib/context/AppContext'
import { PersonalizationProvider } from '@/lib/context/PersonalizationContext'
import { TopNavBar } from '@/components/scarsian/TopNavBar'

export const metadata: Metadata = {
  title: 'Scarsian — Know before you accept the offer.',
  description: 'Scarsian Career Intelligence Platform — AI-powered career analysis for international professionals in Hong Kong and Asia.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-inter antialiased bg-surface text-ink min-h-screen">
        <AppProvider>
          <PersonalizationProvider>
            <TopNavBar />
            {children}
          </PersonalizationProvider>
        </AppProvider>
      </body>
    </html>
  )
}
