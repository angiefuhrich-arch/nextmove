// Safe HTTP fetcher for evidence collection.
// Enforces SSRF protection, timeouts, size limits, and User-Agent.

export interface FetchResult {
  ok: boolean
  status?: number
  pageTitle?: string
  metaDescription?: string
  excerpt?: string              // first ~2000 chars of visible text
  contentLength: number
  error?: string
}

const MAX_CONTENT_BYTES = 512_000     // 512 KB
const FETCH_TIMEOUT_MS  = 12_000     // 12 seconds
const MAX_EXCERPT_CHARS = 2_000

const USER_AGENT = 'Scarsian-Intelligence-Bot/1.0 (+https://scarsian.com/bot)'

// Private / link-local IP ranges blocked to prevent SSRF
const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,              // link-local / AWS metadata
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,  // CGNAT
  /^\[?::1\]?$/,             // IPv6 loopback
  /^\[?fc[0-9a-f]{2}:/i,    // IPv6 ULA
  /^metadata\./i,            // AWS/GCP metadata hostnames
  /^169\.254\.169\.254$/,    // AWS EC2 metadata IP
]

function isBlockedHost(hostname: string): boolean {
  return BLOCKED_HOST_PATTERNS.some(p => p.test(hostname))
}

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]{1,300})<\/title>/i)
  return m?.[1]?.replace(/\s+/g, ' ').trim()
}

function extractMetaDescription(html: string): string | undefined {
  const m = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,500})["']/i
  ) ?? html.match(
    /<meta[^>]+content=["']([^"']{1,500})["'][^>]+name=["']description["']/i
  )
  return m?.[1]?.replace(/\s+/g, ' ').trim()
}

function extractExcerpt(html: string): string {
  // Remove script, style, head, nav, footer blocks
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return text.slice(0, MAX_EXCERPT_CHARS)
}

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

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '') // strip IPv6 brackets
  if (isBlockedHost(hostname)) {
    return { ok: false, contentLength: 0, error: `Blocked host: ${hostname}` }
  }

  let res: Response
  try {
    res = await fetch(rawUrl, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, contentLength: 0, error: `Fetch error: ${message}` }
  }

  if (!res.ok) {
    return { ok: false, status: res.status, contentLength: 0, error: `HTTP ${res.status}` }
  }

  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
    // PDFs and other binary types — record status but no text extraction
    return { ok: true, status: res.status, contentLength: 0, error: 'Non-HTML content type' }
  }

  // Stream with size guard
  const reader = res.body?.getReader()
  if (!reader) return { ok: false, contentLength: 0, error: 'No response body' }

  const chunks: Uint8Array[] = []
  let totalBytes = 0

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

  const html = new TextDecoder('utf-8', { fatal: false }).decode(
    chunks.reduce((acc, c) => {
      const merged = new Uint8Array(acc.length + c.length)
      merged.set(acc)
      merged.set(c, acc.length)
      return merged
    }, new Uint8Array(0))
  )

  return {
    ok: true,
    status: res.status,
    pageTitle:       extractTitle(html),
    metaDescription: extractMetaDescription(html),
    excerpt:         extractExcerpt(html),
    contentLength:   totalBytes,
  }
}
