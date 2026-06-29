import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/security/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { auditLog, requestMeta } from '@/lib/security/audit'
import { log } from '@/lib/security/log'
import { z } from 'zod'

const Schema = z.object({
  suspend: z.boolean(),
  reason: z.string().max(300).optional(),
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
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { suspend, reason } = parsed.data

  const admin = createAdminClient()

  const { data: before } = await admin.from('profiles').select('is_suspended').eq('id', userId).single()

  const update: Record<string, unknown> = { is_suspended: suspend }
  if (suspend) {
    update.suspended_at = new Date().toISOString()
    update.suspended_reason = reason ?? 'Suspended by admin'
  } else {
    update.suspended_at = null
    update.suspended_reason = null
  }

  const { error } = await admin.from('profiles').update(update).eq('id', userId)
  if (error) return NextResponse.json({ error: 'Could not update user' }, { status: 500 })

  const meta = requestMeta(request)
  await auditLog({
    adminUserId: auth.user.id,
    action: suspend ? 'admin_suspend_user' : 'admin_unsuspend_user',
    targetTable: 'profiles',
    targetId: userId,
    beforeState: { is_suspended: before?.is_suspended ?? false },
    afterState: { is_suspended: suspend, reason: suspend ? reason : null },
    ...meta,
  })

  log.adminAction(auth.user.id, suspend ? 'suspend_user' : 'unsuspend_user', 'profiles', userId)

  return NextResponse.json({ ok: true })
}
