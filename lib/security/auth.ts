import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

export interface AuthResult {
  user: User
  error: null
}
export interface AuthError {
  user: null
  error: NextResponse
}

/** Require a valid session. Returns 401 if unauthenticated. */
export async function requireAuth(): Promise<AuthResult | AuthError> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      ),
    }
  }

  return { user, error: null }
}

export type AdminRole = 'owner' | 'admin' | 'analyst' | 'support' | 'finance' | 'viewer'

export interface AdminResult {
  user: User
  isAdmin: true
  role: AdminRole
  error: null
}
export interface AdminError {
  user: null
  isAdmin: false
  role: null
  error: NextResponse
}

/** Require a valid session AND admin access.
 *
 * Source of truth priority:
 * 1. JWT app_metadata.is_admin — set by owner-bootstrap, immune to RLS, no extra DB query.
 * 2. profiles.is_admin via admin client — fallback for rows not yet updated via bootstrap.
 *
 * Never uses the anon-key client for the is_admin check — RLS blocks that query
 * for users who don't have an explicit self-read policy on profiles.
 */
export async function requireAdmin(request?: NextRequest): Promise<AdminResult | AdminError> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null, isAdmin: false, role: null,
      error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }),
    }
  }

  // Primary: JWT app_metadata set by bootstrap (no DB query, no RLS)
  const jwtIsAdmin = user.app_metadata?.is_admin === true
  const jwtRole = user.app_metadata?.role as AdminRole | undefined

  if (jwtIsAdmin) {
    return { user, isAdmin: true, role: jwtRole ?? 'admin', error: null }
  }

  // Fallback: query profiles using the service-role admin client (bypasses RLS)
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('is_admin, role')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    console.warn('[security] non-admin attempted admin route', {
      userId: user.id,
      path: request?.nextUrl?.pathname,
      ip: request?.headers.get('x-forwarded-for') ?? 'unknown',
    })
    return {
      user: null, isAdmin: false, role: null,
      error: NextResponse.json({ error: 'Forbidden.' }, { status: 403 }),
    }
  }

  return { user, isAdmin: true, role: (profile.role as AdminRole) ?? 'admin', error: null }
}

/** Require owner role specifically (for team management, billing, system settings). */
export async function requireOwner(request?: NextRequest): Promise<AdminResult | AdminError> {
  const result = await requireAdmin(request)
  if (result.error) return result
  if (result.role !== 'owner') {
    return {
      user: null, isAdmin: false, role: null,
      error: NextResponse.json({ error: 'Owner access required.' }, { status: 403 }),
    }
  }
  return result
}

/** Extract real client IP (Vercel-aware). */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '0.0.0.0'
  )
}
