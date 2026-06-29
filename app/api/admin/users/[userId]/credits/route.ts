import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getClientIp } from '@/lib/security/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { auditLog, requestMeta } from '@/lib/security/audit'
import { log } from '@/lib/security/log'
import { z } from 'zod'

const Schema = z.object({
  type: z.enum(['credit', 'debit', 'refund', 'adjustment']),
  amount: z.number().int().positive().max(500),
  reason: z.string().min(5).max(300),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error

  const { userId } = await params

  let body: unknown
  try { body = await request.json() } catch { body = {} }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 })
  }

  const { type, amount, reason } = parsed.data

  // Signed amount: debit means subtract
  const signedAmount = (type === 'debit') ? -amount : amount

  const admin = createAdminClient()

  // Fetch before state for audit
  const { data: before } = await admin.from('profiles').select('credits').eq('id', userId).single()

  const idempotencyKey = `admin_${auth.user.id}_${userId}_${type}_${Date.now()}`

  const { data: rpcResult, error: rpcError } = await admin.rpc('admin_adjust_credits', {
    p_admin_id: auth.user.id,
    p_user_id: userId,
    p_amount: signedAmount,
    p_transaction_type: type,
    p_reason: reason,
    p_idempotency_key: idempotencyKey,
  })

  if (rpcError || !rpcResult?.[0]?.success) {
    const msg = rpcResult?.[0]?.message ?? rpcError?.message ?? 'Unknown error'
    log.adminAction(auth.user.id, `credit_${type}_failed`, 'credit_transactions', userId)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const newBalance = rpcResult[0].balance

  // Audit log — never omit for credit changes
  const meta = requestMeta(request)
  await auditLog({
    adminUserId: auth.user.id,
    action: `admin_credit_${type}`,
    targetTable: 'profiles',
    targetId: userId,
    beforeState: { credits: before?.credits ?? null },
    afterState: { credits: newBalance, amount: signedAmount, reason },
    ...meta,
  })

  log.adminAction(auth.user.id, `credit_${type}`, 'profiles', userId)

  return NextResponse.json({ ok: true, balance: newBalance })
}
