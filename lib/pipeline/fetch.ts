import 'server-only'

// Safe HTTP fetcher for evidence collection.
// Enforces: SSRF protection (hostname + DNS resolution), timeout, size limit,
// redirect limit, content-type guard, and HTML text extraction.

import dns, { type LookupAddress } from 'dns'
import { promisify } from 'util'
const lookupAll = promisify(dns.lookup) as (
  hostname: string,
  opts: { all: true; verbatim?: boolean }
) => Promise<LookupAddress[]>

export interface FetchResult {
  ok: boolean
  status?: number
  pageTitle?: string
  metaDescription?: string
  excerpt?: string              // first ~2000 chars of visible text
  contentLength: number
  error?: string
}

const MAX_CONTENT_BYTES  = 512_000     // 512 KB
const FETCH_TIMEOUT_MS   = 12_000     // 12 seconds
const MAX_REDIRECTS      = 3
const MAX_EXCERPT_CHARS  = 2_000

const USER_AGENT = 'Scarsian-Intelligence-Bot/1.0 (+https://scarsian.com/bot)'

// ── SSRF block rules ──────────────────────────────────────────────────────────

// Hostname patterns blocked before DNS resolution
const BLOCKED_HOST_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /^metadata\.google\.internal$/i,
  /^metadata$/i,
  /^169\.254\.169\.254$/,     // AWS EC2 / GCP metadata IP
  /^fd[0-9a-f]{2}:/i,        // IPv6 ULA (starts fc00::/7 → fc/fd)
]

// Private IPv4 CIDR ranges (checked after DNS resolution)
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return false

  const [a, b, c] = parts
  return (
    a === 0 ||                                      // 0.0.0.0/8
    a === 10 ||                                     // 10.0.0.0/8
    a === 127 ||                                    // 127.0.0.0/8
    (a === 100 && b >= 64 && b <= 127) ||           // 100.64.0.0/10 CGNAT
    (a === 169 && b === 254) ||                     // 169.254.0.0/16 link-local
    (a === 172 && b >= 16 && b <= 31) ||            // 172.16.0.0/12
    (a === 192 && b === 168) ||                     // 192.168.0.0/16
    (a === 198 && b === 18) ||                      // 198.18.0.0/15 benchmark
    a === 255                                       // 255.255.255.255 broadcast
  )
}

// Private IPv6 addresses (checked after DNS resolution)
function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase().replace(/^\[|\]$/g, '')
  return (
    lower === '::1' ||
    lower === '::' ||
    lower.startsWith('fc') ||      // fc00::/7 ULA
    lower.startsWith('fd') ||
    lower.startsWith('fe80') ||    // fe80::/10 link-local
    lower.startsWith('ff')         // ff00::/8 multicast
  )
}

async function resolveAndValidateHost(hostname: string): Promise<string | null> {
  // Pattern check first (no DNS needed)
  for (const pattern of BLOCKED_HOST_PATTERNS) {
    if (pattern.test(hostname)) return `Blocked hostname pattern: ${hostname}`
  }

  // DNS resolution — check all resolved IPs
  let addresses: LookupAddress[]
  try {
    addresses = await lookupAll(hostname, { all: true, verbatim: true })
  } catch {
    return `DNS resolution failed for: ${hostname}`
  }

  if (addresses.length === 0) return `No DNS records for: ${hostname}`

  for (const addr of addresses) {
    if (addr.family === 4 && isPrivateIPv4(addr.address)) {
      return `SSRF blocked: ${hostname} resolves to private IPv4 ${addr.address}`
    }
    if (addr.family === 6 && isPrivateIPv6(addr.address)) {
      return `SSRF blocked: ${hostname} resolves to private IPv6 ${addr.address}`
    }
  }

  return null // OK
}

// ── HTML extraction ───────────────────────────────────────────────────────────

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]{1,300})<\/title>/i)
  return m?.[1]?.replace(/\s+/g, ' ').trim()
}

function extractMetaDescription(html: string): string | undefined {
  const m =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,600})["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']{1,600})["'][^>]+name=["']description["']/i)
  return m?.[1]?.replace(/\s+/g, ' ').trim()
}

// Sanitize and strip HTML to visible text — no external deps
function extractExcerpt(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<head[\s\S]*?<\/head>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_EXCERPT_CHARS)
}

// ── Main fetcher ──────────────────────────────────────────────────────────────

export async function safeFetch(rawUrl: string): Promise<FetchResult> {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return { ok: false, contentLength: 0, error: 'Invalid URL' }
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, contentLength: 0, error: `Blocked protocol: ${parsed.protocol}` }
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '')
  const ssrfError = await resolveAndValidateHost(hostname)
  if (ssrfError) {
    console.warn('[fetch] SSRF blocked:', ssrfError)
    return { ok: false, contentLength: 0, error: ssrfError }
  }

  // Fetch with redirect tracking
  let redirectsFollowed = 0
  let currentUrl = rawUrl

  let res: Response
  try {
    res = await fetch(currentUrl, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml;q=0.9,text/plain;q=0.8,*/*;q=0.5',
        'Accept-Language': 'en',
      },
      redirect: 'manual',   // handle redirects manually so we can re-validate
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })

    // Follow redirects manually, re-validating each hop
    while (res.status >= 300 && res.status < 400 && redirectsFollowed < MAX_REDIRECTS) {
      const location = res.headers.get('location')
      if (!location) break

      let nextUrl: URL
      try {
        nextUrl = new URL(location, currentUrl)
      } catch {
        return { ok: false, contentLength: 0, error: `Invalid redirect URL: ${location}` }
      }

      if (!['http:', 'https:'].includes(nextUrl.protocol)) {
        return { ok: false, contentLength: 0, error: `Blocked redirect protocol: ${nextUrl.protocol}` }
      }

      const redirectHost = nextUrl.hostname.replace(/^\[|\]$/g, '')
      const redirectSsrfError = await resolveAndValidateHost(redirectHost)
      if (redirectSsrfError) {
        return { ok: false, contentLength: 0, error: `SSRF via redirect: ${redirectSsrfError}` }
      }

      currentUrl = nextUrl.toString()
      redirectsFollowed++
      res = await fetch(currentUrl, {
        method: 'GET',
        headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' },
        redirect: 'manual',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
    }

    if (redirectsFollowed >= MAX_REDIRECTS && res.status >= 300 && res.status < 400) {
      return { ok: false, status: res.status, contentLength: 0, error: 'Too many redirects' }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, contentLength: 0, error: `Fetch error: ${message}` }
  }

  if (!res.ok) {
    return { ok: false, status: res.status, contentLength: 0, error: `HTTP ${res.status}` }
  }

  const contentType = res.headers.get('content-type') ?? ''
  const isTextContent = contentType.includes('text/html') || contentType.includes('text/plain')
  if (!isTextContent) {
    return {
      ok: true,
      status: res.status,
      contentLength: 0,
      error: `Non-text content-type: ${contentType.split(';')[0]}`,
    }
  }

  // Stream with size guard
  const reader = res.body?.getReader()
  if (!reader) return { ok: false, contentLength: 0, error: 'No response body' }

  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      totalBytes += value.byteLength
      if (totalBytes > MAX_CONTENT_BYTES) {
        reader.cancel()
        break
      }
      chunks.push(value)
    }
  } catch (err) {
    reader.cancel()
    return { ok: false, contentLength: totalBytes, error: `Stream error: ${(err as Error).message}` }
  }

  const buffer = new Uint8Array(
    chunks.reduce((acc, c) => acc + c.length, 0)
  )
  let offset = 0
  for (const c of chunks) { buffer.set(c, offset); offset += c.length }
  const html = new TextDecoder('utf-8', { fatal: false }).decode(buffer)

  return {
    ok: true,
    status: res.status,
    pageTitle:       extractTitle(html),
    metaDescription: extractMetaDescription(html),
    excerpt:         extractExcerpt(html),
    contentLength:   totalBytes,
  }
}
