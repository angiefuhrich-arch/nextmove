// Server component — reads ?purchase=success from URL and passes initialView to WalletClient.
// No useSearchParams() needed; no Suspense boundary required.

import { WalletClient } from './WalletClient'

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ purchase?: string }>
}) {
  const { purchase } = await searchParams
  const initialView = purchase === 'success' ? 'success' : 'overview'

  return <WalletClient initialView={initialView} />
}
