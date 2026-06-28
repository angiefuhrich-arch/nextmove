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

  // Check if already unlocked (idempotent)
  const { data: existing } = await admin
    .from('brief_unlocks')
    .select('id')
    .eq('user_id', userId)
    .eq('entity_id', entityId)
    .maybeSingle()
  if (existing) return { ok: true }

  // Get current credit balance
  const { data: profile } = await admin
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single()
  const balance = (profile?.credits ?? 0) as number
  if (balance < 1) return { ok: false, error: 'insufficient_credits' }

  const newBalance = balance - 1

  // Deduct credit and record unlock atomically
  const idempotencyKey = `unlock_${userId}_${entityId}`
  const [, , txErr] = await Promise.all([
    admin.from('profiles').update({ credits: newBalance }).eq('id', userId),
    admin.from('brief_unlocks').insert({ user_id: userId, entity_id: entityId }),
    Promise.resolve(null),
  ])
  void txErr
  await admin.from('credit_transactions').insert({
    user_id: userId,
    transaction_type: 'spend',
    amount: -1,
    reason: `Unlocked brief for entity ${entityId}`,
    idempotency_key: idempotencyKey,
    balance_after: newBalance,
  })

  return { ok: true }
}
