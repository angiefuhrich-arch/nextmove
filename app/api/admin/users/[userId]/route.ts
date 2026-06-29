import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/security/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error

  const { userId } = await params
  const admin = createAdminClient()

  const [
    { data: { user: authUser }, error: authError },
    { data: profile },
    { data: txRows },
    { data: briefRows },
    { data: watchlistRows },
    { data: pipelineRows },
  ] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from('profiles').select('display_name, credits, is_admin, is_suspended, suspended_at, suspended_reason, created_at, notification_prefs, preferences').eq('id', userId).single(),
    admin.from('credit_transactions').select('id, transaction_type, amount, reason, balance_after, stripe_session_id, created_at, created_by, related_entity_id, entities:related_entity_id(name,slug)').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
    admin.from('brief_unlocks').select('id, unlocked_at, entities:entity_id(name,slug)').eq('user_id', userId).order('unlocked_at', { ascending: false }).limit(50),
    admin.from('saved_companies').select('id, company_name, company_slug, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
    admin.from('pipeline_runs').select('id, entity_slug, status, created_at').eq('requested_by', userId).order('created_at', { ascending: false }).limit(20),
  ])

  if (authError || !authUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const totalPurchased = (txRows ?? []).filter(t => t.transaction_type === 'purchase' || t.transaction_type === 'credit').reduce((s, t) => s + t.amount, 0)
  const totalUsed = (txRows ?? []).filter(t => t.transaction_type === 'debit' || t.transaction_type === 'unlock').reduce((s, t) => s + Math.abs(t.amount), 0)

  return NextResponse.json({
    id: authUser.id,
    email: authUser.email,
    display_name: profile?.display_name ?? null,
    signup_date: authUser.created_at,
    last_login: authUser.last_sign_in_at ?? null,
    credits: profile?.credits ?? 0,
    is_admin: profile?.is_admin ?? false,
    is_suspended: profile?.is_suspended ?? false,
    suspended_at: profile?.suspended_at ?? null,
    suspended_reason: profile?.suspended_reason ?? null,
    total_purchased: totalPurchased,
    total_used: totalUsed,
    transactions: txRows ?? [],
    briefs: briefRows ?? [],
    watchlist: watchlistRows ?? [],
    pipelines: pipelineRows ?? [],
    brief_count: briefRows?.length ?? 0,
    watchlist_count: watchlistRows?.length ?? 0,
  })
}
