// Scarsian Intelligence Platform — Core Type System (Phase 1)
// All types mirror the Phase 1 SQL schema exactly.

// ============================================================
// Formula Registry
// ============================================================

export type PillarKey = 'cgs' | 'crs' | 'mvs' | 'cfs' | 'gfi'

export interface PillarWeights {
  cgs: number
  crs: number
  mvs: number
  cfs: number
  gfi: number
}

export interface FormulaVersion {
  id: string
  version: string
  description: string | null
  pillar_weights: PillarWeights
  cgs_signal_weights: Record<string, number>
  crs_signal_weights: Record<string, number>
  mvs_signal_weights: Record<string, number>
  cfs_signal_weights: Record<string, number>
  gfi_signal_weights: Record<string, number>
  confidence_weights: Record<string, number>
  adjustment_rules: {
    momentum_range: [number, number]
    volatility_range: [number, number]
    momentum_divisor: number
    volatility_divisor: number
  }
  insufficient_data_threshold: number
  verdict_thresholds: { strong: number; caution: number }
  is_active: boolean
  created_at: string
  created_by: string | null
}

export type EngineName =
  | 'financial_strength'
  | 'leadership'
  | 'career_growth'
  | 'culture'
  | 'compensation'
  | 'global_friendliness'
  | 'interview_experience'
  | 'job_stability'

export interface EnginePillarTarget {
  pillar: PillarKey
  weight: number
}

export interface EngineFormulaMapping {
  id: string
  formula_version_id: string
  engine_name: EngineName
  target_pillars: EnginePillarTarget[]
  created_at: string
}

// ============================================================
// Entity System
// ============================================================

export type EntityType = 'company' | 'industry' | 'country' | 'person'

export interface Entity {
  id: string
  entity_type: EntityType
  name: string
  slug: string
  market: string | null
  legacy_company_id: string | null
  metadata: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export type RelationshipType =
  | 'subsidiary_of'
  | 'parent_of'
  | 'competitor_of'
  | 'peer_of'
  | 'operates_in'
  | 'belongs_to_industry'
  | 'headquartered_in'

export interface EntityRelationship {
  id: string
  from_entity_id: string
  to_entity_id: string
  relationship: RelationshipType
  propagation_weight: number
  propagation_confidence_penalty: number
  is_active: boolean
  valid_from: string | null
  valid_until: string | null
  created_at: string
}

// ============================================================
// Intelligence Events
// ============================================================

export type EventType =
  | 'news'
  | 'financial_report'
  | 'job_posting'
  | 'layoff'
  | 'executive_change'
  | 'award'
  | 'government_filing'
  | 'policy_change'
  | 'hiring_trend'
  | 'manual_research'
  | 'admin_refresh'
  | 'signal_expiry'

export type EventSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface IntelligenceEvent {
  id: string
  entity_id: string
  event_type: EventType
  title: string
  description: string | null
  occurred_at: string
  source_url: string | null
  severity: EventSeverity | null
  metadata: Record<string, unknown>
  triggers_recalc: boolean
  processed: boolean
  processed_at: string | null
  created_at: string
  created_by: string | null
}

// ============================================================
// Evidence Records (Immutable)
// ============================================================

export type EvidenceSourceType =
  | 'news'
  | 'financial_report'
  | 'job_posting'
  | 'glassdoor'
  | 'linkedin'
  | 'reddit'
  | 'blind'
  | 'hkex'
  | 'government'
  | 'company_website'
  | 'annual_report'
  | 'manual_research'
  | 'admin_verified'
  | 'brave_search'
  | 'wikipedia'

export type EvidenceReviewStatus = 'unreviewed' | 'accepted' | 'rejected'

export interface EvidenceRecord {
  id: string
  entity_id: string
  event_id: string | null
  source_type: EvidenceSourceType
  source_url: string | null
  source_title: string | null
  content_summary: string
  raw_content: string | null
  disputed: boolean
  dispute_reason: string | null
  supersedes_id: string | null
  review_status: EvidenceReviewStatus
  collected_at: string
  evidence_date: string | null
  collected_by: string | null
  default_expiry_days: number | null
  created_at: string
}

// Insert type (omits system-generated fields)
export interface CreateEvidenceRecord {
  entity_id: string
  event_id?: string | null
  source_type: EvidenceSourceType
  source_url?: string | null
  source_title?: string | null
  content_summary: string
  raw_content?: string | null
  evidence_date?: string | null
  collected_by?: string | null
  default_expiry_days?: number | null
  supersedes_id?: string | null
}

// ============================================================
// Signals
// ============================================================

export type SignalCategory = 'cgs' | 'crs' | 'mvs' | 'cfs' | 'gfi' | 'confidence' | 'adjustment'

export type SignalReviewStatus = 'pending' | 'accepted' | 'overridden' | 'rejected'

export interface Signal {
  id: string
  entity_id: string
  signal_name: string
  signal_category: SignalCategory
  score: number
  confidence: number
  reasoning: string | null
  evidence_ids: string[]
  propagated_from_entity_id: string | null
  propagation_weight: number | null
  created_at: string
  expires_at: string | null
  expired: boolean
  admin_override_score: number | null
  admin_notes: string | null
  review_status: SignalReviewStatus
  reviewed_at: string | null
  reviewed_by: string | null
}

export interface CreateSignal {
  entity_id: string
  signal_name: string
  signal_category: SignalCategory
  score: number
  confidence: number
  reasoning?: string | null
  evidence_ids?: string[]
  propagated_from_entity_id?: string | null
  propagation_weight?: number | null
  expires_at?: string | null
}

// Effective score resolves override if present
export function effectiveSignalScore(signal: Signal): number {
  if (signal.review_status === 'overridden' && signal.admin_override_score !== null) {
    return signal.admin_override_score
  }
  return signal.score
}

// ============================================================
// Signal Expiry
// ============================================================

export interface SignalExpiryRule {
  signal_name: string
  default_expiry_days: number | null
  decay_start_pct: number
  description: string | null
}

// Compute expiry date from evidence date or now
export function computeExpiresAt(
  expiryDays: number | null,
  fromDate?: Date
): string | null {
  if (expiryDays === null) return null
  const base = fromDate ?? new Date()
  const expiry = new Date(base.getTime() + expiryDays * 24 * 60 * 60 * 1000)
  return expiry.toISOString()
}

// Compute decay factor (0–1) based on time remaining
// Returns 1.0 when far from expiry, decays to 0.0 at expiry
export function computeDecayFactor(
  expiresAt: string | null,
  createdAt: string,
  decayStartPct = 0.5
): number {
  if (!expiresAt) return 1.0
  const now = Date.now()
  const created = new Date(createdAt).getTime()
  const expires = new Date(expiresAt).getTime()
  const total = expires - created
  if (total <= 0) return 0
  const remaining = expires - now
  if (remaining <= 0) return 0
  const decayStartAt = created + total * decayStartPct
  if (now < decayStartAt) return 1.0
  const decayWindow = expires - decayStartAt
  return Math.max(0, remaining / decayWindow)
}
