import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/me
 * Returns the current user's profile data.
 * Uses the service-role admin client to read profiles — bypasses RLS.
 * Also checks app_metadata for is_admin so it works before/after bootstrap.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  // Check app_metadata first (set by bootstrap, no DB needed)
  const jwtIsAdmin = user.app_metadata?.is_admin === true

  // Also check profiles via admin client (bypasses RLS) for credits/display_name
  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('credits, display_name, is_admin')
    .eq('id', user.id)
    .single()

  const isAdmin = jwtIsAdmin || profile?.is_admin === true

  return NextResponse.json({
    authenticated: true,
    id: user.id,
    email: user.email,
    display_name: profile?.display_name ?? null,
    credits: profile?.credits ?? 0,
    is_admin: isAdmin,
  })
}
