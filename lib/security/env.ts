import 'server-only'

// Environment variable validation — called at startup in critical server paths.
// Fails safely: missing non-critical vars warn; missing critical vars throw.

interface EnvSpec {
  key: string
  critical: boolean
  description: string
}

const ENV_SPECS: EnvSpec[] = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL',   critical: true,  description: 'Supabase project URL' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', critical: true, description: 'Supabase anon key' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY',  critical: true,  description: 'Supabase service role key (server-side only)' },
  { key: 'BRAVE_SEARCH_API_KEY',       critical: false, description: 'Brave Search API key (pipeline uses stub mode if missing)' },
  { key: 'OPENAI_API_KEY',             critical: false, description: 'OpenAI API key (required for Phase E brief generation)' },
  { key: 'STRIPE_SECRET_KEY',          critical: false, description: 'Stripe secret key (required when payments enabled)' },
  { key: 'STRIPE_WEBHOOK_SECRET',      critical: false, description: 'Stripe webhook secret' },
]

let validated = false

export function validateEnv(): void {
  if (validated) return
  validated = true

  const missing: string[] = []
  const warnings: string[] = []

  for (const spec of ENV_SPECS) {
    const val = process.env[spec.key]
    if (!val || val.trim() === '') {
      if (spec.critical) {
        missing.push(`${spec.key}: ${spec.description}`)
      } else {
        warnings.push(`${spec.key} not set — ${spec.description}`)
      }
    }
  }

  if (warnings.length > 0) {
    console.warn('[env] Optional env vars not set:', warnings)
  }

  if (missing.length > 0) {
    const msg = `[env] CRITICAL: missing required environment variables:\n${missing.join('\n')}`
    console.error(msg)
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg)
    }
  }
}

/** Assert a single env var is present (use in server functions that need it). */
export function requireEnv(key: string): string {
  const val = process.env[key]
  if (!val || val.trim() === '') {
    throw new Error(`Required environment variable ${key} is not set.`)
  }
  return val
}
