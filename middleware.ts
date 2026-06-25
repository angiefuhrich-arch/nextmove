import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Auth is handled at the page level via Supabase client
  // This middleware just passes all requests through
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
