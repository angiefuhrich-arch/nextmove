import 'server-only'

export type RefreshPolicy = 'large_public' | 'medium' | 'private' | 'manual'

// TTL in days by policy tier
const POLICY_TTL: Record<RefreshPolicy, number> = {
  large_public: 30,
  medium:       60,
  private:      90,
  manual:       Infinity,
}

export interface FreshnessResult {
  isFresh: boolean
  isStale: boolean
  daysOld: number | null
  refreshDue: Date | null
  policy: RefreshPolicy
}

export function computeRefreshDue(policy: RefreshPolicy, fromDate: Date = new Date()): Date | null {
  const ttl = POLICY_TTL[policy]
  if (ttl === Infinity) return null
  const due = new Date(fromDate)
  due.setDate(due.getDate() + ttl)
  return due
}

export function evaluateFreshness(
  lastGeneratedAt: Date | null,
  policy: RefreshPolicy,
): FreshnessResult {
  if (!lastGeneratedAt) {
    return { isFresh: false, isStale: false, daysOld: null, refreshDue: null, policy }
  }

  const ttl = POLICY_TTL[policy]
  const now = Date.now()
  const ageMs = now - lastGeneratedAt.getTime()
  const daysOld = Math.floor(ageMs / (1000 * 60 * 60 * 24))
  const refreshDue = computeRefreshDue(policy, lastGeneratedAt)

  if (ttl === Infinity) {
    return { isFresh: true, isStale: false, daysOld, refreshDue, policy }
  }

  const isFresh = daysOld < ttl
  const isStale = !isFresh

  return { isFresh, isStale, daysOld, refreshDue: refreshDue!, policy }
}

// Infer policy from entity characteristics
// Called when an entity doesn't have an explicit policy set
export function inferRefreshPolicy(opts: {
  employeeCount?: number | null
  isPubliclyTraded?: boolean
  country?: string | null
}): RefreshPolicy {
  if (opts.isPubliclyTraded) return 'large_public'
  if (opts.employeeCount && opts.employeeCount >= 1000) return 'medium'
  return 'private'
}

// Cost estimates (USD) per pipeline component
const COST_PER_BRAVE_SEARCH = 0.005         // $0.005 per API call
const COST_PER_1K_INPUT_TOKENS  = 0.00015  // gpt-4o-mini input
const COST_PER_1K_OUTPUT_TOKENS = 0.0006   // gpt-4o-mini output

export function estimatePipelineCost(opts: {
  braveSearchCount: number
  openaiInputTokens: number
  openaiOutputTokens: number
}): number {
  const searchCost   = opts.braveSearchCount * COST_PER_BRAVE_SEARCH
  const inputCost    = (opts.openaiInputTokens  / 1000) * COST_PER_1K_INPUT_TOKENS
  const outputCost   = (opts.openaiOutputTokens / 1000) * COST_PER_1K_OUTPUT_TOKENS
  return searchCost + inputCost + outputCost
}
