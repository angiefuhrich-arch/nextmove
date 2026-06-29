import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * Owner bootstrap — promotes OWNER_EMAIL to role=owner, is_admin=true.
 *
 * Called automatically by the middleware when OWNER_EMAIL user tries to
 * access an admin route but is not yet marked as admin. Uses the service-role
 * admin client so it works even before any manual SQL migration has been run.
 *
 * Sets both profiles.is_admin AND auth.users.app_metadata.is_admin so the
 * middleware can check the JWT directly without a DB round-trip.
 *
 * Safe to call multiple times (idempotent).
 * Rejects any request whose authenticated email doesn't match OWNER_EMAIL.
 */
export async function GET(request: NextRequest) {
  const ownerEmail = process.env.OWNER_EMAIL
  if (!ownerEmail) {
    return NextResponse.json({ error: 'OWNER_EMAIL not configured.' }, { status: 500 })
  }

  // Verify the requester is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', '/admin')
    return NextResponse.redirect(url)
  }

  // Only promote if this is the designated owner
  if (user.email?.toLowerCase() !== ownerEmail.toLowerCase()) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Use the admin (service role) client to bypass RLS
  const db = createAdminClient()

  // 1. Set is_admin in auth.users.app_metadata (embedded in JWT — no DB query needed in middleware)
  await db.auth.admin.updateUserById(user.id, {
    app_metadata: { is_admin: true, role: 'owner' },
  })

  // 2. Set profiles.is_admin (fallback for DB-based checks)
  const { error: updateErr } = await db
    .from('profiles')
    .update({ is_admin: true })
    .eq('id', user.id)

  if (updateErr) {
    // Profile row may not exist yet — insert it
    await db.from('profiles').insert({ id: user.id, is_admin: true, credits: 0 })
  }

  // 3. Best-effort: set role column if it exists
  await db.from('profiles').update({ role: 'owner' }).eq('id', user.id)

  // 4. Best-effort: upsert into admin_team_members if that table exists
  try {
    await db
      .from('admin_team_members')
      .upsert({
        email: user.email,
        name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Owner',
        role: 'owner',
        status: 'active',
        user_id: user.id,
        accepted_at: new Date().toISOString(),
      }, { onConflict: 'email' })
  } catch { /* table doesn't exist yet — ignore */ }

  console.log('[owner-bootstrap] promoted', user.email, 'to owner')

  // Redirect to the originally-requested admin path
  const next = request.nextUrl.searchParams.get('next') ?? '/admin'
  const target = next.startsWith('/') ? next : '/admin'
  return NextResponse.redirect(new URL(target, request.url))
}
