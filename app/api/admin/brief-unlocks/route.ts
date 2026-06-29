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

  const admin = createAdminClient()

  const { data, count, error } = await admin
    .from('brief_unlocks')
    .select(`
      id, user_id, entity_id, unlocked_at,
      entity:entity_id(name, slug),
      user_profile:user_id(email, display_name)
    `, { count: 'exact' })
    .order('unlocked_at', { ascending: false })
    .range(page * perPage, (page + 1) * perPage - 1)

  if (error) return NextResponse.json({ error: 'Could not fetch unlocks' }, { status: 500 })

  // Credits charged: find the matching debit transaction for each unlock
  const unlockEntityIds = (data ?? []).map(u => u.entity_id).filter(Boolean)
  const unlockUserIds = (data ?? []).map(u => u.user_id).filter(Boolean)

  const creditMap: Record<string, number> = {}
  if (unlockEntityIds.length > 0 && unlockUserIds.length > 0) {
    const { data: txRows } = await admin
      .from('credit_transactions')
      .select('user_id, related_entity_id, amount')
      .in('user_id', unlockUserIds)
      .in('related_entity_id', unlockEntityIds)
      .in('transaction_type', ['debit', 'unlock'])
    for (const tx of txRows ?? []) {
      const key = `${tx.user_id}:${tx.related_entity_id}`
      creditMap[key] = Math.abs(tx.amount)
    }
  }

  const unlocks = (data ?? []).map(u => ({
    ...u,
    credits_charged: creditMap[`${u.user_id}:${u.entity_id}`] ?? 1,
  }))

  return NextResponse.json({ unlocks, total: count ?? 0 })
}
