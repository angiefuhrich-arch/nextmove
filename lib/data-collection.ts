export interface CollectedSource {
  source_type: 'brave_search' | 'news' | 'wikipedia' | 'manual'
  source_url: string
  source_title: string
  published_date: string | null
  raw_text: string
  reliability_score: number
}

async function fetchWikipedia(companyName: string): Promise<CollectedSource[]> {
  try {
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(companyName)}`
    const res = await fetch(searchUrl, { headers: { 'User-Agent': 'ScarsianBot/1.0' } })
    if (!res.ok) return []
    const data = await res.json()
    if (!data.extract) return []
    return [{
      source_type: 'wikipedia',
      source_url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(companyName)}`,
      source_title: data.title ?? companyName,
      published_date: null,
      raw_text: data.extract,
      reliability_score: 70,
    }]
  } catch {
    return []
  }
}

async function fetchBraveSearch(query: string): Promise<CollectedSource[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY
  if (!apiKey) return []

  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&text_decorations=false`
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
    })
    if (!res.ok) return []
    const data = await res.json()
    const results = data.web?.results ?? []
    return results.map((r: { url: string; title: string; page_age?: string; description?: string }) => ({
      source_type: 'brave_search' as const,
      source_url: r.url,
      source_title: r.title,
      published_date: r.page_age ? new Date(r.page_age).toISOString().split('T')[0] : null,
      raw_text: r.description ?? '',
      reliability_score: 55,
    }))
  } catch {
    return []
  }
}

async function fetchNews(companyName: string): Promise<CollectedSource[]> {
  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) return []

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(companyName)}&sortBy=relevancy&pageSize=5&language=en`
    const res = await fetch(url, { headers: { 'X-Api-Key': apiKey } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.articles ?? []).map((a: { url: string; title: string; publishedAt?: string; content?: string; description?: string }) => ({
      source_type: 'news' as const,
      source_url: a.url,
      source_title: a.title,
      published_date: a.publishedAt ? a.publishedAt.split('T')[0] : null,
      raw_text: (a.content ?? a.description ?? '').slice(0, 1000),
      reliability_score: 65,
    }))
  } catch {
    return []
  }
}

export async function collectCompanyData(companyName: string, market: string): Promise<CollectedSource[]> {
  const searchTarget = `${companyName} ${market}`

  const [wiki, employeeReviews, layoffNews, careerNews] = await Promise.all([
    fetchWikipedia(companyName),
    fetchBraveSearch(`${searchTarget} employee reviews culture career growth glassdoor`),
    fetchBraveSearch(`${searchTarget} layoffs restructuring financial stability 2024 2025`),
    fetchNews(searchTarget),
  ])

  const all = [...wiki, ...employeeReviews, ...layoffNews, ...careerNews]

  // Deduplicate by URL
  const seen = new Set<string>()
  return all.filter(s => {
    if (seen.has(s.source_url)) return false
    seen.add(s.source_url)
    return true
  })
}
