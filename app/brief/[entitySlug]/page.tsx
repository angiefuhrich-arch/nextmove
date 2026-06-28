// /brief/[entitySlug] — canonical public brief page (v4 on-demand pipeline output)

import { getEntityBySlug } from '@/lib/dal/entities'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ entitySlug: string }>
}

export default async function BriefPage({ params }: Props) {
  const { entitySlug } = await params

  // Check entities table first (v4 system)
  const entity = await getEntityBySlug(entitySlug, 'company')
  if (entity) {
    redirect(`/report/${entitySlug}`)
  }

  // Legacy fallback: check old companies table
  const admin = createAdminClient()
  const { data: legacy } = await admin
    .from('companies')
    .select('slug')
    .eq('slug', entitySlug)
    .maybeSingle()
  if (legacy) {
    redirect(`/report/${entitySlug}`)
  }

  notFound()
}
