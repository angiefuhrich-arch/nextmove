import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

// Content Security Policy
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.stripe.com",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ')

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://scarsian.com',
  isDev ? 'http://localhost:3000' : null,
].filter(Boolean) as string[]

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy',   value: cspDirectives },
          { key: 'X-Frame-Options',            value: 'DENY' },
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security',  value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin',      value: ALLOWED_ORIGINS[0] },
          { key: 'Access-Control-Allow-Methods',     value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers',     value: 'X-CSRF-Token,X-Requested-With,Accept,Content-Type,Authorization' },
        ],
      },
    ]
  },
}

export default nextConfig
