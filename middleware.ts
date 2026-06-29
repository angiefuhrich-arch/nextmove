import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes that require authentication at middleware level.
// Page-level guards remain as defense-in-depth.
const AUTH_REQUIRED_PREFIXES = [
  '/wallet',
  '/watchlist',
  '/compare',
  '/account',
  '/api/pipeline',
  '/api/sources',
]

// Routes that require admin at middleware level.
const ADMIN_REQUIRED_PREFIXES = [
  '/admin',
  '/api/admin',
]

// Public routes — always allowed without auth check.
const PUBLIC_PREFIXES = [
  '/_next',
  '/favicon.ico',
  '/api/search',           // search is rate-limited but does not require auth
  '/api/stripe',           // Stripe webhooks use signature verification, not session auth
  '/api/owner-bootstrap',  // bootstrap route promotes OWNER_EMAIL before admin flag is set
]

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(p => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always pass through public paths
  if (matchesPrefix(pathname, PUBLIC_PREFIXES)) {
    return NextResponse.next()
  }

  // Build response — required by Supabase SSR to refresh cookies
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Only instantiate Supabase client if we need to check auth
  const needsAuth  = matchesPrefix(pathname, AUTH_REQUIRED_PREFIXES)
  const needsAdmin = matchesPrefix(pathname, ADMIN_REQUIRED_PREFIXES)

  if (!needsAuth && !needsAdmin) {
    return response
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return response  // misconfigured — let page handle it

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (needsAdmin) {
    // Check admin flag — prefer JWT app_metadata (no extra DB round-trip and immune to RLS),
    // fall back to profiles table for accounts promoted before app_metadata was set.
    const jwtIsAdmin = user.app_metadata?.is_admin === true

    let isAdmin = jwtIsAdmin
    if (!isAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      isAdmin = profile?.is_admin === true
    }

    if (!isAdmin) {
      // If this is the designated owner, send them to the bootstrap route to get promoted
      const ownerEmail = process.env.OWNER_EMAIL
      if (ownerEmail && user.email?.toLowerCase() === ownerEmail.toLowerCase()) {
        const bootstrapUrl = new URL('/api/owner-bootstrap', request.url)
        bootstrapUrl.searchParams.set('next', pathname)
        return NextResponse.redirect(bootstrapUrl)
      }
      // Return 403 for API routes, redirect for pages
      if (pathname.startsWith('/api/')) {
        return new NextResponse(JSON.stringify({ error: 'Forbidden.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
