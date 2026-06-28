// Legacy route — all Intelligence Briefs now served from /brief/[entitySlug]
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function LegacyReportRedirect({
  params,
}: {
  params: Promise<{ companyId: string }>
}) {
  const { companyId } = await params
  redirect(`/brief/${companyId}`)
}
