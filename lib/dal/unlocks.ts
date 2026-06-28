import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function hasUnlockedBrief(userId: string, entityId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('brief_unlocks')
    .select('id')
    .eq('user_id', userId)
    .eq('entity_id', entityId)
    .maybeSingle()
  return !!data
}

export async function unlockBriefForUser(userId: string, entityId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient()

  // Check if already unlocked — unique constraint also protects against races
  const { data: existing } = await admin
    .from('brief_unlocks')
    .select('id')
    .eq('user_id', userId)
    .eq('entity_id', entityId)
    .maybeSingle()
  if (existing) return { ok: true }

  // Use deduct_credits RPC: row-locks profiles, handles idempotency, inserts credit_transaction
  const idempotencyKey = `unlock_${userId}_${entityId}`
  const { data, error } = await admin.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: 1,
    p_reason: `Unlocked brief for entity ${entityId}`,
    p_idempotency_key: idempotencyKey,
    p_entity_id: entityId,
  })

  if (error) {
    console.error('[unlockBriefForUser] deduct_credits error', error)
    return { ok: false, error: 'internal' }
  }

  const result = Array.isArray(data) ? data[0] : data
  if (!result?.success) {
    const msg = result?.message ?? ''
    if (msg === 'insufficient_credits') return { ok: false, error: 'insufficient_credits' }
    return { ok: false, error: 'internal' }
  }

  // Record the unlock — ignore conflict (duplicate from race)
  await admin
    .from('brief_unlocks')
    .upsert({ user_id: userId, entity_id: entityId }, { onConflict: 'user_id,entity_id', ignoreDuplicates: true })

  return { ok: true }
}
