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
  const typeFilter = searchParams.get('type') ?? ''

  const admin = createAdminClient()

  let query = admin
    .from('credit_transactions')
    .select(`
      id, user_id, transaction_type, amount, reason,
      balance_after, stripe_session_id, created_at, created_by,
      entity:related_entity_id(name, slug),
      user_profile:user_id(email, display_name),
      admin_profile:created_by(email, display_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * perPage, (page + 1) * perPage - 1)

  if (typeFilter) {
    query = query.eq('transaction_type', typeFilter)
  }

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: 'Could not fetch transactions' }, { status: 500 })

  return NextResponse.json({ transactions: data ?? [], total: count ?? 0 })
}
