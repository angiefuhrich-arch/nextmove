// Step: Discover
// Uses Brave Search to find sources and entity candidates for the target employer.
// Falls back to a structured stub when BRAVE_SEARCH_API_KEY is not configured.

import { insertSourceCandidates, insertEntityCandidates } from '../db'
import { classifyUrl } from '../source-tiers'
import type { PipelineContext, StepResult, SourceCandidate, EntityCandidate } from '../types'

const BRAVE_SEARCH_URL = 'https://api.search.brave.com/res/v1/web/search'

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(ltd|limited|inc|incorporated|co\.|corp|corporation|hk|hong kong|pvt|plc|llc|group|holdings?)\b/gi, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(name: string): string {
  return normalizeCompanyName(name).replace(/\s+/g, '-')
}

interface BraveWebResult {
  title: string
  url: string
  description?: string
  page_age?: string
}

interface BraveSearchResponse {
  web?: { results?: BraveWebResult[] }
  news?: { results?: BraveWebResult[] }
}

async function braveSearch(query: string, count = 10): Promise<BraveWebResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY
  if (!apiKey) return []

  const url = new URL(BRAVE_SEARCH_URL)
  url.searchParams.set('q', query)
  url.searchParams.set('count', String(count))
  url.searchParams.set('search_lang', 'en')
  url.searchParams.set('text_decorations', 'false')

  const res = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': apiKey,
    },
    signal: AbortSignal.timeout(12_000),
  })

  if (!res.ok) {
    console.error(`[discover] Brave Search error ${res.status}: ${await res.text()}`)
    return []
  }

  const data: BraveSearchResponse = await res.json()
  return [
    ...(data.web?.results ?? []),
    ...(data.news?.results ?? []),
  ]
}

function extractEntityCandidates(
  entityName: string,
  results: BraveWebResult[]
): EntityCandidate[] {
  const normalizedTarget = normalizeCompanyName(entityName)
  const candidates: EntityCandidate[] = []

  // Primary candidate: the search target itself
  const exactMatch = results.find(r =>
    r.title.toLowerCase().includes(entityName.toLowerCase())
  )

  candidates.push({
    name: entityName,
    normalizedName: normalizedTarget,
    description: exactMatch?.description,
    confidenceScore: exactMatch ? 85 : 50,
    sourceUrl: exactMatch?.url,
    disambiguationNeeded: false,
  })

  // Secondary: detect if results hint at multiple companies with same name
  const alternateNames = new Set<string>()
  for (const r of results) {
    const titleWords = r.title.split(/[–\-|]/)[0].trim()
    const normalizedTitle = normalizeCompanyName(titleWords)
    if (
      normalizedTitle !== normalizedTarget &&
      normalizedTitle.includes(normalizedTarget.split(' ')[0]) &&
      titleWords.length < 60
    ) {
      alternateNames.add(titleWords)
    }
  }

  // If there are more than 2 distinct alternate names, flag for disambiguation
  if (alternateNames.size > 2) {
    candidates[0].disambiguationNeeded = true
  }

  return candidates
}

function buildStubResults(entityName: string): BraveWebResult[] {
  // Structured stub for when Brave Search API key is not configured
  const slug = slugify(entityName)
  return [
    {
      title: `${entityName} — LinkedIn`,
      url: `https://www.linkedin.com/company/${slug}`,
      description: `${entityName} company profile on LinkedIn — employees, jobs, and updates.`,
    },
    {
      title: `${entityName} Reviews — Glassdoor`,
      url: `https://www.glassdoor.com/Reviews/${slug}-reviews.htm`,
      description: `Read ${entityName} reviews from employees about work-life balance, culture, and leadership.`,
    },
    {
      title: `${entityName} — Wikipedia`,
      url: `https://en.wikipedia.org/wiki/${entityName.replace(/\s+/g, '_')}`,
      description: `${entityName} is a company. Overview, history, and key people.`,
    },
    {
      title: `${entityName} Revenue and Funding — Crunchbase`,
      url: `https://www.crunchbase.com/organization/${slug}`,
      description: `${entityName} funding rounds, investors, revenue data, and team.`,
    },
    {
      title: `${entityName} Salaries — Levels.fyi`,
      url: `https://www.levels.fyi/companies/${slug}`,
      description: `${entityName} compensation data, levels, and equity breakdown.`,
    },
  ]
}

export async function discoverStep(ctx: PipelineContext): Promise<StepResult> {
  const query = `"${ctx.entityName}" company employer jobs`

  let results = await braveSearch(query)
  const usedStub = results.length === 0

  if (usedStub) {
    // No API key or search failed — use structured stub
    results = buildStubResults(ctx.entityName)
    console.log(`[discover] No Brave Search results; using stub for "${ctx.entityName}"`)
  }

  if (results.length === 0) {
    return { success: false, insufficientEvidence: true, note: 'No discovery results found' }
  }

  // Map results → SourceCandidate rows (tier classification from source-tiers.ts)
  const sourceCandidates: SourceCandidate[] = results.map((r, i) => {
    const tier = classifyUrl(r.url)
    const sourceType: SourceCandidate['sourceType'] =
      tier.hostname.endsWith('linkedin.com')  ? 'linkedin' :
      tier.hostname.endsWith('glassdoor.com') ? 'glassdoor' :
      tier.hostname.endsWith('wikipedia.org') ? 'wikipedia' :
      'web_search'

    return {
      url: r.url,
      title: r.title,
      description: r.description,
      publishedDate: r.page_age ?? undefined,
      sourceType,
      discoveryRank: i + 1,
      reliabilityScore: tier.reliabilityScore,
    }
  })

  await insertSourceCandidates(ctx.runId, sourceCandidates)

  // Extract entity candidates
  const entityCandidates = extractEntityCandidates(ctx.entityName, results)
  await insertEntityCandidates(ctx.runId, entityCandidates)

  const topCandidate = entityCandidates[0]
  const note = usedStub
    ? `Stub mode — ${results.length} synthetic sources; Brave Search not configured`
    : `Found ${results.length} sources; top candidate confidence ${topCandidate?.confidenceScore ?? 0}%`

  return {
    success: true,
    note,
    data: {},
  }
}
