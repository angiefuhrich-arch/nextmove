// Source Tier Classification
// Tier 1: Official / regulator / government / company filing
// Tier 2: Structured data providers / job APIs / verified aggregators
// Tier 3: Reputable news / established media
// Tier 4: Community / review / forum / social — DISCOVERY ONLY, not for scoring
//
// Rule: Only Tier 1–3 sources may contribute to evidence_records used in scoring.
// Tier 4 is allowed in source_candidates for discovery breadth, but is excluded
// from the collect step and cannot influence Scarsian Index in MVP.

export type SourceTier = 1 | 2 | 3 | 4

export interface TierRule {
  tier: SourceTier
  reliabilityScore: number
  allowForEvidence: boolean   // false = discovery only
  allowScraping: boolean      // false = do not attempt to fetch content
}

// Exact domain → tier mapping.
// Subdomains are matched via hostname.endsWith(domain).
const DOMAIN_TIERS: Record<string, TierRule> = {
  // ── Tier 1: Official / regulatory / government ──────────────────
  'hkex.com.hk':               { tier: 1, reliabilityScore: 97, allowForEvidence: true, allowScraping: true },
  'sfc.hk':                    { tier: 1, reliabilityScore: 97, allowForEvidence: true, allowScraping: true },
  'cr.gov.hk':                 { tier: 1, reliabilityScore: 97, allowForEvidence: true, allowScraping: true },
  'sec.gov':                   { tier: 1, reliabilityScore: 97, allowForEvidence: true, allowScraping: true },
  'companieshouse.gov.uk':     { tier: 1, reliabilityScore: 97, allowForEvidence: true, allowScraping: true },
  'edgar.sec.gov':             { tier: 1, reliabilityScore: 97, allowForEvidence: true, allowScraping: true },
  'ir.tesla.com':              { tier: 1, reliabilityScore: 95, allowForEvidence: true, allowScraping: true },
  'investors.airbnb.com':      { tier: 1, reliabilityScore: 95, allowForEvidence: true, allowScraping: true },
  'ir.netflix.net':            { tier: 1, reliabilityScore: 95, allowForEvidence: true, allowScraping: true },
  'stripe.com':                { tier: 1, reliabilityScore: 92, allowForEvidence: true, allowScraping: true },

  // ── Tier 2: Structured data / verified aggregators ───────────────
  'crunchbase.com':            { tier: 2, reliabilityScore: 78, allowForEvidence: true, allowScraping: true },
  'levels.fyi':                { tier: 2, reliabilityScore: 75, allowForEvidence: true, allowScraping: true },
  'pitchbook.com':             { tier: 2, reliabilityScore: 80, allowForEvidence: true, allowScraping: false }, // login-gated
  'jobsdb.com':                { tier: 2, reliabilityScore: 68, allowForEvidence: true, allowScraping: true },
  'jobstreet.com':             { tier: 2, reliabilityScore: 68, allowForEvidence: true, allowScraping: true },
  'linkedin.com/jobs':         { tier: 2, reliabilityScore: 70, allowForEvidence: false, allowScraping: false }, // login-gated
  'wikipedia.org':             { tier: 2, reliabilityScore: 65, allowForEvidence: true, allowScraping: true },

  // ── Tier 3: Reputable news / established media ────────────────────
  'bloomberg.com':             { tier: 3, reliabilityScore: 90, allowForEvidence: true, allowScraping: true },
  'reuters.com':               { tier: 3, reliabilityScore: 90, allowForEvidence: true, allowScraping: true },
  'ft.com':                    { tier: 3, reliabilityScore: 90, allowForEvidence: true, allowScraping: true },
  'wsj.com':                   { tier: 3, reliabilityScore: 88, allowForEvidence: true, allowScraping: true },
  'techcrunch.com':            { tier: 3, reliabilityScore: 78, allowForEvidence: true, allowScraping: true },
  'scmp.com':                  { tier: 3, reliabilityScore: 80, allowForEvidence: true, allowScraping: true },
  'nytimes.com':               { tier: 3, reliabilityScore: 88, allowForEvidence: true, allowScraping: true },
  'theguardian.com':           { tier: 3, reliabilityScore: 82, allowForEvidence: true, allowScraping: true },
  'cnbc.com':                  { tier: 3, reliabilityScore: 80, allowForEvidence: true, allowScraping: true },
  'forbes.com':                { tier: 3, reliabilityScore: 72, allowForEvidence: true, allowScraping: true },
  'businessinsider.com':       { tier: 3, reliabilityScore: 68, allowForEvidence: true, allowScraping: true },
  'hkfp.com':                  { tier: 3, reliabilityScore: 72, allowForEvidence: true, allowScraping: true },

  // ── Tier 4: Community / review / social — DISCOVERY ONLY ─────────
  'linkedin.com':              { tier: 4, reliabilityScore: 40, allowForEvidence: false, allowScraping: false },
  'glassdoor.com':             { tier: 4, reliabilityScore: 38, allowForEvidence: false, allowScraping: false },
  'indeed.com':                { tier: 4, reliabilityScore: 35, allowForEvidence: false, allowScraping: false },
  'teamblind.com':             { tier: 4, reliabilityScore: 32, allowForEvidence: false, allowScraping: false },
  'reddit.com':                { tier: 4, reliabilityScore: 28, allowForEvidence: false, allowScraping: false },
  'twitter.com':               { tier: 4, reliabilityScore: 25, allowForEvidence: false, allowScraping: false },
  'x.com':                     { tier: 4, reliabilityScore: 25, allowForEvidence: false, allowScraping: false },
  'facebook.com':              { tier: 4, reliabilityScore: 20, allowForEvidence: false, allowScraping: false },
  'quora.com':                 { tier: 4, reliabilityScore: 22, allowForEvidence: false, allowScraping: false },
}

const DEFAULT_TIER: TierRule = { tier: 4, reliabilityScore: 45, allowForEvidence: false, allowScraping: true }

export function classifyUrl(rawUrl: string): TierRule & { hostname: string } {
  let hostname = ''
  try {
    hostname = new URL(rawUrl).hostname.replace(/^www\./, '')
  } catch {
    return { ...DEFAULT_TIER, hostname: '' }
  }

  // Longest-match: check both exact and subdomain
  for (const [domain, rule] of Object.entries(DOMAIN_TIERS)) {
    if (hostname === domain || hostname.endsWith('.' + domain)) {
      return { ...rule, hostname }
    }
  }

  // Heuristic: .gov / .edu domains are Tier 1
  if (hostname.endsWith('.gov') || hostname.endsWith('.gov.hk') || hostname.endsWith('.edu')) {
    return { tier: 1, reliabilityScore: 88, allowForEvidence: true, allowScraping: true, hostname }
  }

  return { ...DEFAULT_TIER, hostname }
}

export function isEvidenceEligible(url: string): boolean {
  return classifyUrl(url).allowForEvidence
}

export function isScrapingAllowed(url: string): boolean {
  return classifyUrl(url).allowScraping
}
