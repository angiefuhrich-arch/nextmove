import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, requireOwner } from '@/lib/security/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { auditLog, requestMeta } from '@/lib/security/audit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const VALID_ROLES = ['owner', 'admin', 'analyst', 'support', 'finance', 'viewer'] as const

const InviteSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().min(1).max(200).optional(),
  role: z.enum(VALID_ROLES).default('viewer'),
})

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error

  const db = createAdminClient()
  const { data, error } = await db
    .from('admin_team_members')
    .select('*')
    .order('invited_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Could not fetch team.' }, { status: 500 })
  return NextResponse.json({ members: data ?? [] })
}

export async function POST(request: NextRequest) {
  // Only owners can invite team members
  const auth = await requireOwner(request)
  if (auth.error) return auth.error

  let body: unknown
  try { body = await request.json() } catch { body = {} }

  const parsed = InviteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  const { email, name, role } = parsed.data
  const db = createAdminClient()

  // Check if already a team member
  const { data: existing } = await db
    .from('admin_team_members')
    .select('id, status')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'This email is already a team member.' }, { status: 409 })
  }

  // Look up if they already have a user account
  const { data: users } = await db.auth.admin.listUsers()
  const existingUser = users?.users?.find(u => u.email === email)

  const { data: member, error } = await db
    .from('admin_team_members')
    .insert({
      email,
      name: name ?? null,
      role,
      status: 'pending',
      invited_by: auth.user.id,
      user_id: existingUser?.id ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Could not create invitation.' }, { status: 500 })

  const meta = requestMeta(request)
  await auditLog({
    adminUserId: auth.user.id,
    action: 'admin_team_invite',
    targetTable: 'admin_team_members',
    targetId: member.id,
    afterState: { email, role, status: 'pending' },
    ...meta,
  })

  return NextResponse.json({ member })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireOwner(request)
  if (auth.error) return auth.error

  let body: unknown
  try { body = await request.json() } catch { body = {} }

  const Schema = z.object({
    id: z.string().uuid(),
    role: z.enum(VALID_ROLES).optional(),
    status: z.enum(['pending', 'active', 'suspended']).optional(),
    name: z.string().min(1).max(200).optional(),
  })

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  const { id, ...updates } = parsed.data
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })

  const db = createAdminClient()
  const { data: before } = await db.from('admin_team_members').select('*').eq('id', id).single()
  if (!before) return NextResponse.json({ error: 'Team member not found.' }, { status: 404 })

  // Prevent demoting the last owner
  if (updates.role && updates.role !== 'owner' && before.role === 'owner') {
    const { count } = await db
      .from('admin_team_members')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'owner')
      .eq('status', 'active')
    if ((count ?? 0) <= 1) {
      return NextResponse.json({ error: 'Cannot demote the only owner.' }, { status: 400 })
    }
  }

  const { data: member, error } = await db
    .from('admin_team_members')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Could not update team member.' }, { status: 500 })

  const meta = requestMeta(request)
  await auditLog({
    adminUserId: auth.user.id,
    action: 'admin_team_update',
    targetTable: 'admin_team_members',
    targetId: id,
    beforeState: before,
    afterState: member,
    ...meta,
  })

  return NextResponse.json({ member })
}

export async function DELETE(request: NextRequest) {
  const auth = await requireOwner(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 })

  const db = createAdminClient()
  const { data: member } = await db.from('admin_team_members').select('*').eq('id', id).single()
  if (!member) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  if (member.role === 'owner') return NextResponse.json({ error: 'Cannot remove an owner.' }, { status: 400 })

  await db.from('admin_team_members').delete().eq('id', id)

  const meta = requestMeta(request)
  await auditLog({
    adminUserId: auth.user.id,
    action: 'admin_team_remove',
    targetTable: 'admin_team_members',
    targetId: id,
    beforeState: member,
    ...meta,
  })

  return NextResponse.json({ ok: true })
}
