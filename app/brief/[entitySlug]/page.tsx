// /brief/[entitySlug] — canonical public brief page (v4 on-demand pipeline output)
// Falls back to mock data for demo; Phase C will check scarsian_snapshots.

import { companies } from '@/lib/data/mockData'
import { notFound, redirect } from 'next/navigation'

interface Props {
  params: Promise<{ entitySlug: string }>
}

export default async function BriefPage({ params }: Props) {
  const { entitySlug } = await params

  // In Phase C: check scarsian_snapshots for approved brief.
  // For now: fall through to report page if mock data exists, else 404.
  const company = companies.find(c => c.id === entitySlug)
  if (company) {
    redirect(`/report/${entitySlug}`)
  }

  notFound()
}
