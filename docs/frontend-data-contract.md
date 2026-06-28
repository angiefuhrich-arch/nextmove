# Scarsian Frontend Data Contract
**Version:** Phase F · Updated 2026-06-28  
**Purpose:** Single source of truth for every data shape Kimi designs against and every screen that needs implementing.

---

## 1. Search API

**Endpoint:** `GET /api/search?q={query}`  
**Auth:** Optional (stricter rate limits if anonymous)

```typescript
// Response
{
  results: Array<{
    id:             string        // entity UUID
    name:           string        // "Goldman Sachs"
    slug:           string        // "goldman-sachs-hk"
    entity_type:    string        // "company" | "university" | "hospital" | ...
    market:         string        // "HK" | "SG" | "US"
    scarsian_score: number | null // 0–100; null if no approved snapshot
    verdict:        "strong" | "caution" | "no-go" | null
    confidence:     number | null // 0–100
    has_brief:      boolean       // true if published analyst report exists
  }>
}
```

**Empty state:** `results: []`  
**Error:** `{ error: "Invalid request." }` (400) or `{ error: "Rate limited." }` (429)

---

## 2. Pipeline

### Start Pipeline
**Endpoint:** `POST /api/pipeline/start`  
**Auth:** Required

```typescript
// Request body
{ companyName: string, market?: string }

// Response
{ runId: string, status: "started" }
```

### Poll Status
**Endpoint:** `GET /api/pipeline/{runId}/status`  
**Auth:** Required  
**Poll interval:** 2–4 seconds until terminal status

```typescript
// Response
{
  status: PipelineStatus   // see below
  currentStep: string      // human label e.g. "Collecting evidence"
  progress: number         // 0–100
  stepLog: Array<{
    step:        string
    label:       string
    startedAt:   string    // ISO datetime
    completedAt: string | null
    note:        string | null
  }>
  // Set on completion
  entitySlug:  string | null
  snapshotId:  string | null
  // Set on insufficient_evidence
  insufficientReason: string | null
}

type PipelineStatus =
  | "queued"
  | "discovering"
  | "verifying"
  | "collecting"
  | "extracting"
  | "detecting_events"
  | "generating_signals"
  | "running_engines"
  | "scoring"
  | "generating_brief"
  | "completed"
  | "insufficient_evidence"  // → redirect to /insufficient/{entitySlug}
  | "failed"
  | "needs_user_clarification"
```

**Terminal statuses:** `completed`, `insufficient_evidence`, `failed`, `needs_user_clarification`

---

## 3. Intelligence Brief Page

**Route:** `/report/{companyId}` (companyId = entity slug or UUID)  
**Data sources:** `scarsian_snapshots` + `analyst_reports` + `intelligence_signals` + `intelligence_events`

### 3a. Entity Header
```typescript
{
  name:         string
  entity_type:  string
  market:       string
  headquarters: string | null
  description:  string | null
  official_url: string | null
  // From entity_markets
  markets: Array<{ market: string; country: string; is_primary: boolean }>
}
```

### 3b. Scarsian Index Block
```typescript
{
  scarsian_score:  number      // 0–100
  verdict:         "strong" | "caution" | "no-go"
  career_alpha:    number      // score - 50; positive = above average
  confidence_score: number     // 0–100
  insufficient_data: boolean
  formula_version:  string     // e.g. "v1.0.0"
  // Pillar scores (employer model v1.0.0)
  pillar_scores: {
    career_growth:       number
    career_risk:         number
    market_value:        number
    career_fit:          number
    global_friendliness: number
  }
  snapshot_date: string        // ISO date of last approved snapshot
}
```

### 3c. Analyst Brief
```typescript
{
  title:     string
  summary:   string            // 2–3 sentence executive summary
  strengths: Array<{ text: string }>
  risks:     Array<{ text: string }>
  good_for:  Array<{ text: string }>
  avoid_if:  Array<{ text: string }>
  gfi_notes: string | null
  published_at: string         // ISO datetime
  // NOTE: evidence_ids_used is NEVER included in public responses
}
```

### 3d. Signals (Key Findings)
```typescript
Array<{
  category:    "career_growth" | "risk" | "market_value" | "culture" | "compensation" | "global" | "stability"
  direction:   "positive" | "negative" | "neutral"
  magnitude:   number          // 0–100
  confidence:  number          // 0–1
  explanation: string
  expiry_date: string | null   // ISO date
}>
```

### 3e. Evidence Timeline
```typescript
Array<{
  id:          string
  event_type:  string          // e.g. "leadership_change"
  title:       string
  summary:     string
  event_date:  string | null
  confidence:  number          // 0–1
  // NOTE: supporting_evidence_ids are internal — NOT exposed
}>
```

### 3f. Sources
```typescript
Array<{
  url:             string
  title:           string | null
  source_type:     string      // e.g. "financial_report", "news"
  source_tier:     1 | 2 | 3  // 4 is never shown publicly
  collected_at:    string
  evidence_date:   string | null
  review_status:   "accepted" | "unreviewed"
}>
```

### 3g. Paywall / Unlock State
```typescript
{
  is_locked:      boolean      // true if user has no credits or no active sub
  credits_cost:   number       // credits required to unlock (default: 1)
  user_credits:   number       // current user credit balance
  unlock_url:     string       // Stripe checkout URL
  // If already unlocked
  unlocked_at:    string | null
}
```

---

## 4. Insufficient Evidence Page

**Route:** `/insufficient/{entitySlug}`

```typescript
{
  entity_name:   string
  entity_slug:   string
  entity_type:   string
  // What was checked
  sources_tried: number
  evidence_found: number
  pipeline_ran_at: string       // ISO datetime
  // Steps completed before stopping
  completed_steps: string[]
  // User options
  can_submit_source: boolean    // always true
  can_request_refresh: boolean  // true if user has credits
}
```

---

## 5. Admin — Pipeline Monitor

**Endpoint:** `GET /api/admin/runs` (to be built in Phase G)  
**Auth:** Admin only

```typescript
Array<{
  id:               string
  entity_name:      string
  entity_type:      string
  status:           PipelineStatus
  pipeline_version: string
  ai_model_version: string       // NEW — "gpt-4o-mini"
  requested_by:     string | null
  started_at:       string
  completed_at:     string | null
  evidence_count:   number
  event_count:      number
  signal_count:     number
  error_message:    string | null
}>
```

---

## 6. Admin — Evidence Review Queue

**Endpoint:** `GET /api/admin/evidence` (to be built in Phase G)  
**Auth:** Admin only

```typescript
Array<{
  id:             string
  entity_name:    string
  entity_slug:    string
  source_url:     string
  source_title:   string | null
  source_type:    string
  source_tier:    1 | 2 | 3 | 4
  content_summary: string
  review_status:  "unreviewed" | "accepted" | "rejected"
  disputed:       boolean
  dispute_reason: string | null
  collected_at:   string
  evidence_date:  string | null
  pipeline_run_id: string
  // NOTE: raw_content is NEVER returned to admin UI (too large; security)
}>
```

---

## 7. Admin — Source Tier Rules (Phase G)

**Endpoint:** `GET /api/admin/tier-rules` (to be built)

```typescript
Array<{
  id:                string
  entity_type:       string | null   // null = global
  domain_pattern:    string
  tier:              1 | 2 | 3 | 4
  reliability_score: number
  allow_for_evidence: boolean
  allow_scraping:    boolean
  notes:             string | null
  is_active:         boolean
}>
```

---

## 8. Wallet / Credits

**Endpoint:** `GET /api/wallet` (to be built in Phase G)

```typescript
{
  balance:    number
  tier:       "free" | "starter" | "pro"
  transactions: Array<{
    id:          string
    amount:      number      // negative = debit, positive = credit
    description: string
    created_at:  string
  }>
}
```

---

## 9. Watchlist

**Endpoint:** `GET/POST/DELETE /api/watchlist` (to be built in Phase G)

```typescript
// GET response
Array<{
  entity_id:    string
  name:         string
  slug:         string
  entity_type:  string
  scarsian_score: number | null
  verdict:      string | null
  added_at:     string
  // Alert settings
  alert_on_score_change:   boolean
  alert_on_new_brief:      boolean
  alert_threshold:         number | null
}>
```

---

## 10. Compare

**Endpoint:** `GET /api/compare?ids=slug1,slug2,slug3` (to be built in Phase G)  
Max 3 entities.

```typescript
Array<{
  entity: { name, slug, entity_type, market }
  scarsian_score: number | null
  verdict:        string | null
  pillar_scores: {
    career_growth:       number | null
    career_risk:         number | null
    market_value:        number | null
    career_fit:          number | null
    global_friendliness: number | null
  }
  top_strength:   string | null   // first item from brief.strengths
  top_risk:       string | null   // first item from brief.risks
}>
```

---

## 11. Breaking Changes (Phase F)

| What changed | Impact |
|---|---|
| `ScarsianScores.career_growth_score` etc. removed | Use `pillar_scores['career_growth']` or `toEmployerPillarNames(scores)` |
| `scoring.ts` now requires `ScoringModel` arg | Pass result of `getActiveScoringModel(entityType)` or omit for employer fallback |
| `analyst_reports.evidence_ids_used` column added | Never select this column in public queries — use `PUBLIC_REPORT_COLUMNS` |
| Middleware now enforces auth on `/wallet`, `/watchlist`, `/compare`, `/account`, `/api/pipeline`, `/admin` | Unauthenticated users redirected to `/login?next=...` |
| `generate-brief.ts` is now live (not a stub) | Requires `brief_templates` table to be seeded (done in phase-f-migration.sql) |
| `pipeline_runs.ai_model_version` added | All new runs record `'gpt-4o-mini'` |
| `source_tier_rules` table replaces hardcoded `DOMAIN_TIERS` | Code falls back to `DOMAIN_TIERS` if DB unavailable |

---

## 12. Screens Kimi Must Still Design

### High Priority (blocks frontend implementation)
| Screen | Route | Status |
|---|---|---|
| Search results dropdown | CommandPalette overlay | Design needed |
| Entity disambiguation | `/disambiguate?q=...` | Design needed |
| Brief page (real data connected) | `/report/{slug}` | Design exists; needs data wiring |
| Brief paywall / unlock modal | Overlay on `/report/{slug}` | Design needed |
| Source submission modal | Overlay | Design needed |

### Medium Priority
| Screen | Route | Status |
|---|---|---|
| Methodology page | `/methodology` | Design needed |
| FAQ standalone page | `/faq` | Design needed |
| Compare page | `/compare` | Design needed |
| Watchlist page | `/watchlist` | Design needed |
| Account / wallet page | `/wallet` | Design needed |

### Admin (internal — can be utilitarian)
| Screen | Route | Status |
|---|---|---|
| Pipeline monitor | `/admin/runs` | Design needed |
| Evidence review queue | `/admin/evidence` | Design needed |
| Source review queue | `/admin/sources` | Design needed |
| Admin audit log viewer | `/admin/audit` | Design needed |
| Tier rules manager | `/admin/tiers` | Design needed |

### Mobile
All screens above need mobile breakpoint specs (< 768px).

---

## 13. Component → Data Field Mapping

| DS Component | Fields consumed |
|---|---|
| `IndexCard` | `scarsian_score`, `verdict`, `confidence_score` |
| `MetricCard` | `career_alpha`, `confidence_score`, `scarsian_score` |
| `ConfidenceBadge` | `confidence_score` (0–100) |
| `EvidenceCard` | `title`, `summary`, `source_type`, `source_tier`, `evidence_date` |
| `SourceBadge` | `source_tier`, `source_type`, `url` |
| `Timeline` | `event_type`, `title`, `summary`, `event_date`, `confidence` |
| `LoadingSteps` | `stepLog[].label`, `stepLog[].state` (derived from status) |
| `StatCard` | `evidence_count`, `signal_count`, `event_count`, `sources_tried` |
| `VerdictBadge` (existing) | `verdict: "strong" \| "caution" \| "no-go"` |
| `SectionHeader` | Static label + title text per section |
| `EmptyState` | Shown when `results: []` or `insufficient_data: true` |
