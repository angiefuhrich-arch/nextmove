export type Verdict = 'strong-move' | 'consider' | 'high-risk'
export type TrendDirection = 'up' | 'down' | 'flat'
export type SignalSentiment = 'positive' | 'neutral' | 'negative'
export type SignalStatus = 'approved' | 'pending' | 'rejected' | 'flagged'

export interface Trend {
  direction: TrendDirection
  value: string
}

export interface CategoryScore {
  name: string
  icon: string
  score: number
  description: string
  trend: Trend
}

export interface UISignal {
  id: string
  category: string
  date: string
  text: string
  source: string
  sentiment: SignalSentiment
  status: SignalStatus
}

export interface Source {
  name: string
  url: string
}

export interface CompanyReport {
  id: string
  name: string
  industry: string
  country: string
  employees: string
  indexScore: number
  confidence: number
  verdict: Verdict
  aiSummary: string
  highlights: string[]
  categories: CategoryScore[]
  signals: UISignal[]
  sources: Source[]
  lastUpdated: string
  trend: Trend
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}
