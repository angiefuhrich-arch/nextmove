export type SubscriptionTier = 'free' | 'pro' | 'premium'

export type Verdict = 'strong' | 'caution' | 'no-go'

export interface Company {
  id: string
  name: string
  slug: string
  logo?: string
  industry: string
  size: string
  headquarters: string
  founded: number
  website?: string
  description: string
}

export interface CategoryScore {
  category: string
  score: number
  status: 'green' | 'yellow' | 'red'
  explanation: string
}

export interface CompanyReport {
  id: string
  company_id: string
  overall_score: number
  verdict: Verdict
  ai_summary: string
  best_reasons: string[]
  biggest_risks: string[]
  good_for: string[]
  avoid_if: string[]
  confidence_score: number
  last_updated: string
  categories: CategoryScore[]
}

export interface OfferAnalysis {
  recommendation: 'accept' | 'negotiate' | 'decline'
  negotiation_tips: string[]
  risk_warnings: string[]
  career_outlook: string
  explanation: string
}

export interface UserProfile {
  id: string
  email: string
  subscription_tier: SubscriptionTier
  reports_used_this_month: number
  stripe_customer_id?: string
}
