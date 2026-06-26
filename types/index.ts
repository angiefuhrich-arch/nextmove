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
  // Scarsian Index
  scarsian_index?: number
  confidence_score?: number
  verdict?: Verdict
  analyst_note?: string
  gfi_score?: number
  // Scarsian dimensions
  ladder_speed?: number
  skill_depreciation_risk?: number
  network_multiplier?: number
  layoff_convexity?: number
  reputation_stain_risk?: number
  financial_runway?: number
  badge_premium?: number
  talent_magnetism?: number
  sector_optionality?: number
  cultural_velocity_match?: number
  global_mobility_index?: number
  // GFI dimensions
  english_working_language?: number
  visa_sponsorship_history?: number
  international_leadership_ratio?: number
  expat_retention_rate?: number
  cantonese_requirement_level?: number
  regional_office_culture?: number
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
  is_admin?: boolean
}
