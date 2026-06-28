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

export interface AdminResult {
  user: User
  isAdmin: true
  error: null
}
export interface AdminError {
  user: null
  isAdmin: false
  error: NextResponse
}

/** Require a valid session AND profiles.is_admin = true. */
export async function requireAdmin(request?: NextRequest): Promise<AdminResult | AdminError> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null, isAdmin: false,
      error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }),
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    // Log suspicious access attempt
    console.warn('[security] non-admin attempted admin route', {
      userId: user.id,
      path: request?.nextUrl?.pathname,
      ip: request?.headers.get('x-forwarded-for') ?? 'unknown',
    })
    return {
      user: null, isAdmin: false,
      error: NextResponse.json({ error: 'Forbidden.' }, { status: 403 }),
    }
  }

  return { user, isAdmin: true, error: null }
}

/** Extract real client IP (Vercel-aware). */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '0.0.0.0'
  )
}
