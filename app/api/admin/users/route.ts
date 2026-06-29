import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/security/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0'))
  const perPage = 50
  const q = searchParams.get('q')?.toLowerCase() ?? ''

  const admin = createAdminClient()

  // Auth users (email, created_at, last_sign_in_at)
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({ page: page + 1, perPage })
  if (authError) return NextResponse.json({ error: 'Could not fetch users' }, { status: 500 })

  const allUsers = authData.users
  const filteredUsers = q
    ? allUsers.filter(u => u.email?.toLowerCase().includes(q))
    : allUsers

  const userIds = filteredUsers.map(u => u.id)
  if (userIds.length === 0) return NextResponse.json({ users: [], total: 0 })

  // Profiles (credits, display_name, is_admin, is_suspended)
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, display_name, credits, is_admin, is_suspended, suspended_reason, created_at')
    .in('id', userIds)

  // Credit transaction aggregates per user
  const { data: txRows } = await admin
    .from('credit_transactions')
    .select('user_id, transaction_type, amount')
    .in('user_id', userIds)

  // Brief unlock counts
  const { data: briefRows } = await admin
    .from('brief_unlocks')
    .select('user_id')
    .in('user_id', userIds)

  // Watchlist counts
  const { data: watchlistRows } = await admin
    .from('saved_companies')
    .select('user_id')
    .in('user_id', userIds)

  // Aggregate in memory
  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  const txMap: Record<string, { purchased: number; used: number }> = {}
  for (const tx of txRows ?? []) {
    if (!txMap[tx.user_id]) txMap[tx.user_id] = { purchased: 0, used: 0 }
    if (tx.transaction_type === 'purchase' || tx.transaction_type === 'credit') {
      txMap[tx.user_id].purchased += tx.amount
    } else if (tx.transaction_type === 'debit' || tx.transaction_type === 'unlock') {
      txMap[tx.user_id].used += Math.abs(tx.amount)
    }
  }
  const briefCountMap: Record<string, number> = {}
  for (const r of briefRows ?? []) briefCountMap[r.user_id] = (briefCountMap[r.user_id] ?? 0) + 1

  const watchlistCountMap: Record<string, number> = {}
  for (const r of watchlistRows ?? []) watchlistCountMap[r.user_id] = (watchlistCountMap[r.user_id] ?? 0) + 1

  const users = filteredUsers.map(u => {
    const p = profileMap[u.id]
    const tx = txMap[u.id] ?? { purchased: 0, used: 0 }
    return {
      id: u.id,
      email: u.email ?? '',
      display_name: p?.display_name ?? null,
      signup_date: u.created_at,
      last_login: u.last_sign_in_at ?? null,
      credits: p?.credits ?? 0,
      total_purchased: tx.purchased,
      total_used: tx.used,
      brief_count: briefCountMap[u.id] ?? 0,
      watchlist_count: watchlistCountMap[u.id] ?? 0,
      is_admin: p?.is_admin ?? false,
      is_suspended: p?.is_suspended ?? false,
      suspended_reason: p?.suspended_reason ?? null,
    }
  })

  return NextResponse.json({ users, total: authData.total ?? filteredUsers.length })
}
