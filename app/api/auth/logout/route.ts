import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // Return 200 — the client handles the redirect so it can call router.refresh() first
  return NextResponse.json({ ok: true })
}
