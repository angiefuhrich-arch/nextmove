import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/security/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const Schema = z.object({
  new_password: z.string().min(8).max(128),
})

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  let body: unknown
  try { body = await request.json() } catch { body = {} }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(auth.user.id, {
    password: parsed.data.new_password,
  })

  if (error) {
    return NextResponse.json({ error: 'Could not update password' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
