import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Scarsian — Know before you cross the border.',
  description: 'Scarsian Career Intelligence Platform — AI-powered career analysis for international professionals in Hong Kong and Asia.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-inter antialiased bg-navy text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}
