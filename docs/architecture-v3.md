# Scarsian Career Intelligence Platform — Architecture v3
**Status: Final Architecture Direction — For Review Before Implementation**
**Date: 2026-06-27**
**Supersedes: docs/architecture-v2.md**

---

## 1. Core Architecture Flow

```
External Sources
      │
      ▼
   Events          ← real-world changes (layoffs, funding, CEO departure)
      │
      ▼
  Evidence         ← raw factual extractions from sources (immutable)
      │
      ▼
   Signals         ← structured interpretations of evidence (decay over time)
      │
      ▼
Scarsian Intelligence Graph™   ← entities + relationships + signals
      │
      ▼
Intelligence Engines           ← 8 modular scoring engines
      │
      ▼
Scarsian Index™                ← deterministic, versioned, auditable
      │
      ▼
Analyst Reports                ← AI explains, never scores
      │
      ▼
Personalized Recommendations   ← weighted by user career profile
```

**Core Principle: AI explains. AI never scores.**
Scores are deterministic, versioned, auditable, and based solely on structured signals.

---

## 2. Entity Relationship Diagram

```
                         ┌────────────────────┐
                         │   formula_versions │
                         │   (scoring rules)  │
                         └────────┬───────────┘
                                  │ versioned by
                                  │
┌──────────────┐         ┌────────▼───────────┐        ┌──────────────────┐
│  audit_logs  │         │     entities       │◄───────│entity_relationships│
│              │         │                    │        │                  │
│ who changed  │         │ company / industry │        │ typed edges      │
│ what / when  │         │ country / city     │        │ confidence-rated │
└──────────────┘         │ job_role / skill   │        │ timestamped      │
                         │ university         │        └──────────────────┘
                         └────────┬───────────┘
                                  │
                    ┌─────────────┼─────────────────┐
                    │             │                 │
                    ▼             ▼                 ▼
          ┌──────────────┐  ┌──────────┐   ┌──────────────┐
          │intelligence  │  │ signals  │   │  engine      │
          │_events       │  │          │   │  _outputs    │
          │              │  │ entity_id│   │              │
          │ layoff_ann.  │  │ category │   │ engine_name  │
          │ ceo_resigned │  │ direction│   │ score 0-100  │
          │ funding_round│  │ magnitude│   │ confidence   │
          │              │  │ weight   │   │ signal_ids[] │
          └──────┬───────┘  │ expires  │   └──────┬───────┘
                 │          └────┬─────┘          │
                 │               │                │
                 ▼               │ feeds          ▼
        ┌────────────────┐       │      ┌──────────────────┐
        │evidence_records│───────┘      │scarsian_snapshots│
        │                │  generates   │                  │
        │ raw_excerpt    │              │ CGS CRS MVS CFS  │
        │ extracted_claim│              │ scarsian_score   │
        │ immutable      │              │ career_alpha     │
        │ reliability    │              │ verdict          │
        └────────────────┘              │ trend_direction  │
                                        │ status: draft→   │
                                        │ approved         │
                                        └──────┬───────────┘
                                               │
                                               ▼
                                    ┌──────────────────┐
                                    │ analyst_reports  │
                                    │                  │
                                    │ AI explains only │
                                    │ draft→approved   │
                                    └──────────────────┘
                                               │
                    ┌──────────────────────────┤
                    │                          │
                    ▼                          ▼
        ┌──────────────────────┐   ┌─────────────────────────┐
        │  user_career_profiles│   │user_entity_recommen-    │
        │                      │   │dations                  │
        │  role / country /    │   │                         │
        │  skills / priorities │   │ relevance_score         │
        └──────────────────────┘   │ personalized_verdict    │
                                   └─────────────────────────┘

        ┌──────────────────────────────────────────────────┐
        │              WALLET SYSTEM                       │
        │                                                  │
        │  user_wallets ──► credit_transactions            │
        │       │           credit_packages                │
        │       └─────────► career_passes                  │
        │                   unlocked_reports               │
        └──────────────────────────────────────────────────┘
```

---

## 3. Complete Database Schema

### 3.1 Formula Versions

```sql
-- Track every version of the scoring formula for auditability.
-- Changing the formula creates a new version, never overwrites.
CREATE TABLE formula_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version         TEXT NOT NULL UNIQUE,       -- e.g. 'v3.0', 'v3.1'
  description     TEXT NOT NULL,
  formula_spec    JSONB NOT NULL,             -- full formula definition as JSON
  is_active       BOOLEAN DEFAULT FALSE,      -- only one active at a time
  activated_at    TIMESTAMPTZ,
  deprecated_at   TIMESTAMPTZ,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.2 Entity System

```sql
-- Generic entity table. All entity types share this schema.
-- New entity types require only a CHECK constraint update, not a schema change.
CREATE TABLE entities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT NOT NULL CHECK (entity_type IN (
                    'company', 'industry', 'country', 'city',
                    'job_role', 'skill', 'university'
                    -- extensible: add values here as needed
                  )),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  display_name    TEXT,
  canonical_id    TEXT,     -- external identifier (ISIN, ISO code, Crunchbase ID, etc.)
  metadata        JSONB DEFAULT '{}',
  -- Metadata schema per entity_type:
  -- company:    { founded, size, website, ticker, hq_country_id, industry_id, hq_city_id }
  -- industry:   { sector, naics_code, parent_industry_id }
  -- country:    { iso2, iso3, region, hk_visa_access, english_official }
  -- city:       { country_id, timezone, expat_population }
  -- job_role:   { function, level_band, common_skill_ids }
  -- skill:      { category, depreciation_rate, demand_trend }
  -- university: { country_id, qs_rank, tier }
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','deprecated','merged')),
  merged_into_id  UUID REFERENCES entities(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(entity_type, slug)
);

CREATE INDEX idx_entities_type    ON entities(entity_type);
CREATE INDEX idx_entities_slug    ON entities(slug);
CREATE INDEX idx_entities_meta    ON entities USING GIN(metadata);
CREATE INDEX idx_entities_status  ON entities(status);
```

---

### 3.3 Scarsian Intelligence Graph™ — Relationships

```sql
-- Typed, directional edges between entities.
-- The graph enables traversal queries: "companies in this industry with strong GFI"
CREATE TABLE entity_relationships (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity_id      UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  to_entity_id        UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  relationship_type   TEXT NOT NULL CHECK (relationship_type IN (
                        'headquartered_in',     -- company → country/city
                        'operates_in',          -- company → country/city
                        'belongs_to_industry',  -- company → industry
                        'employs_role',         -- company → job_role
                        'requires_skill',       -- job_role → skill
                        'teaches',              -- university → skill
                        'competitor_of',        -- company ↔ company
                        'acquired_by',          -- company → company
                        'subsidiary_of',        -- company → company
                        'part_of_industry',     -- industry → industry (hierarchy)
                        'located_in',           -- city → country
                        'expands_to',           -- company → country
                        'related_event',        -- entity → intelligence_event
                        'supported_by',         -- event → evidence_record
                        'generates_signal'      -- evidence → signal
                      )),
  strength            FLOAT DEFAULT 1.0 CHECK (strength BETWEEN 0 AND 1),
  confidence          FLOAT DEFAULT 1.0 CHECK (confidence BETWEEN 0 AND 1),
  metadata            JSONB DEFAULT '{}',
  valid_from          DATE,
  valid_until         DATE,           -- NULL = current / ongoing
  source_signal_id    UUID,
  created_at          TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(from_entity_id, to_entity_id, relationship_type)
);

CREATE INDEX idx_rel_from ON entity_relationships(from_entity_id, relationship_type);
CREATE INDEX idx_rel_to   ON entity_relationships(to_entity_id, relationship_type);
```

---

### 3.4 Event Layer

```sql
-- Events represent real-world changes detected about an entity.
-- Events sit above evidence: one event may be supported by multiple evidence records.
CREATE TABLE intelligence_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  entity_type     TEXT NOT NULL,

  event_type      TEXT NOT NULL CHECK (event_type IN (
                    'layoff_announced',
                    'executive_departure',
                    'executive_appointment',
                    'funding_round',
                    'annual_report_published',
                    'office_opened',
                    'office_closed',
                    'hiring_increase',
                    'hiring_freeze',
                    'restructuring_announced',
                    'regulatory_issue',
                    'salary_policy_change',
                    'visa_sponsorship_confirmed',
                    'english_language_confirmed',
                    'acquisition_announced',
                    'ipo_announced',
                    'product_launch',
                    'market_expansion',
                    'partnership_announced',
                    'scandal_reported',
                    'earnings_beat',
                    'earnings_miss',
                    'credit_downgrade',
                    'award_received'
                    -- extensible
                  )),

  event_title     TEXT NOT NULL,
  event_summary   TEXT,
  event_date      DATE,             -- when the event occurred (not when we detected it)
  detected_at     TIMESTAMPTZ DEFAULT NOW(),
  source_count    INT DEFAULT 0,    -- number of evidence records supporting this event

  confidence      FLOAT DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  status          TEXT DEFAULT 'draft' CHECK (status IN (
                    'draft', 'verified', 'disputed', 'archived'
                  )),
  disputed_reason TEXT,
  verified_by     UUID REFERENCES auth.users(id),
  verified_at     TIMESTAMPTZ,

  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_entity    ON intelligence_events(entity_id, event_type);
CREATE INDEX idx_events_date      ON intelligence_events(event_date DESC);
CREATE INDEX idx_events_status    ON intelligence_events(status);
CREATE INDEX idx_events_detected  ON intelligence_events(detected_at DESC);
```

---

### 3.5 Evidence Layer

```sql
-- Evidence is raw factual material extracted from sources.
-- Evidence is IMMUTABLE. Never update. If wrong, mark disputed and create corrected record.
-- One source article can produce multiple evidence records.
CREATE TABLE evidence_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID REFERENCES intelligence_events(id) ON DELETE SET NULL,
  entity_id           UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,

  -- Source
  source_type         TEXT NOT NULL CHECK (source_type IN (
                        'news', 'job_posting', 'financial_report', 'annual_report',
                        'regulatory_filing', 'company_website', 'career_page',
                        'government_database', 'web_search', 'wikipedia',
                        'hkex_filing', 'sec_filing', 'manual_admin', 'api_news'
                      )),
  source_name         TEXT,           -- e.g. "South China Morning Post"
  source_url          TEXT,
  source_domain       TEXT,
  source_title        TEXT,
  source_author       TEXT,
  published_at        TIMESTAMPTZ,
  collected_at        TIMESTAMPTZ DEFAULT NOW(),

  -- Content
  raw_excerpt         TEXT,           -- verbatim text from source
  extracted_claim     TEXT,           -- one factual claim extracted from the excerpt
  extracted_value     JSONB,          -- structured: { metric, value, unit, direction, magnitude }
  -- Example extracted_value:
  -- { "metric": "headcount_change", "value": -1000, "unit": "employees",
  --   "direction": "decrease", "magnitude": 0.08, "period": "Q1 2025" }

  -- Quality
  reliability_score   FLOAT DEFAULT 0.5 CHECK (reliability_score BETWEEN 0 AND 1),
  confidence_score    FLOAT DEFAULT 0.5 CHECK (confidence_score BETWEEN 0 AND 1),

  -- Verification
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN (
                        'unverified', 'verified', 'disputed', 'superseded'
                      )),
  disputed_reason     TEXT,
  superseded_by_id    UUID REFERENCES evidence_records(id),
  verified_by         UUID REFERENCES auth.users(id),
  verified_at         TIMESTAMPTZ,

  created_at          TIMESTAMPTZ DEFAULT NOW()
  -- NOTE: No updated_at. Evidence is immutable.
);

CREATE INDEX idx_evidence_entity  ON evidence_records(entity_id);
CREATE INDEX idx_evidence_event   ON evidence_records(event_id);
CREATE INDEX idx_evidence_source  ON evidence_records(source_type);
CREATE INDEX idx_evidence_status  ON evidence_records(verification_status);
```

---

### 3.6 Signal Engine

```sql
-- Signals are structured interpretations of evidence.
-- Signals are the atomic unit consumed by intelligence engines.
-- Signals decay over time via expires_at.
CREATE TABLE signals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id         UUID REFERENCES evidence_records(id) ON DELETE SET NULL,
  event_id            UUID REFERENCES intelligence_events(id) ON DELETE SET NULL,
  entity_id           UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  entity_type         TEXT NOT NULL,  -- denormalized for fast filtering

  -- Classification
  category            TEXT NOT NULL CHECK (category IN (
                        'hiring', 'layoffs', 'compensation', 'culture',
                        'leadership', 'financial', 'regulatory', 'market',
                        'interview_experience', 'english_language',
                        'visa_policy', 'promotion_policy', 'executive_change',
                        'restructuring', 'earnings', 'expansion', 'contraction',
                        'scandal', 'sentiment', 'partnership', 'award'
                      )),
  subcategory         TEXT,   -- e.g. 'mass_layoff', 'cfo_departure', 'series_b'

  -- Signal value
  direction           TEXT NOT NULL CHECK (direction IN ('positive','negative','neutral')),
  magnitude           FLOAT DEFAULT 0.5 CHECK (magnitude BETWEEN 0 AND 1),
  weight              FLOAT DEFAULT 1.0 CHECK (weight BETWEEN 0 AND 2),

  -- Quality
  confidence          FLOAT NOT NULL DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  reliability         FLOAT NOT NULL DEFAULT 0.5 CHECK (reliability BETWEEN 0 AND 1),
  sentiment           FLOAT CHECK (sentiment BETWEEN -1 AND 1),

  -- Routing to engines
  engine_tags         TEXT[],  -- which engines consume this signal

  -- Decay
  expires_at          TIMESTAMPTZ,  -- NULL = never expires (manual verified only)
  decay_rate          FLOAT DEFAULT 0.1,  -- rate at which weight decays toward expiry

  -- Verification
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN (
                        'unverified', 'verified', 'disputed', 'expired', 'superseded'
                      )),
  superseded_by_id    UUID REFERENCES signals(id),
  verified_by         UUID REFERENCES auth.users(id),
  verified_at         TIMESTAMPTZ,

  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Default expiry windows (applied at signal creation time):
-- news / sentiment:        +90 days
-- layoffs / restructuring: +180 days
-- financial / earnings:    +365 days
-- executive_change:        +365 days
-- visa_policy / culture:   +180 days
-- job_posting signals:     +45 days
-- manual verified:         no expiry (expires_at = NULL)

CREATE INDEX idx_signals_entity    ON signals(entity_id, category);
CREATE INDEX idx_signals_entity_t  ON signals(entity_type);
CREATE INDEX idx_signals_engines   ON signals USING GIN(engine_tags);
CREATE INDEX idx_signals_expires   ON signals(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_signals_status    ON signals(verification_status);
CREATE INDEX idx_signals_created   ON signals(created_at DESC);
```

---

### 3.7 Intelligence Engine Outputs

```sql
-- Each engine consumes signals and produces a structured score.
-- Versioned: changing a formula creates a new row, never overwrites.
CREATE TABLE engine_outputs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id           UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  entity_type         TEXT NOT NULL,

  engine_name         TEXT NOT NULL CHECK (engine_name IN (
                        'financial_strength',
                        'leadership',
                        'career_growth',
                        'culture',
                        'compensation',
                        'global_friendliness',
                        'interview_experience',
                        'job_stability'
                        -- add new engines here
                      )),

  -- Output
  score               FLOAT NOT NULL CHECK (score BETWEEN 0 AND 100),
  component_scores    JSONB DEFAULT '{}',   -- sub-signal breakdown
  signal_ids          UUID[],               -- signals consumed
  evidence_ids        UUID[],               -- evidence referenced
  signal_count        INT DEFAULT 0,

  -- Confidence
  confidence          FLOAT NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  data_freshness      FLOAT CHECK (data_freshness BETWEEN 0 AND 100),
  signal_coverage     FLOAT CHECK (signal_coverage BETWEEN 0 AND 100),

  -- Versioning
  formula_version     TEXT NOT NULL,
  calculated_at       TIMESTAMPTZ DEFAULT NOW(),
  expires_at          TIMESTAMPTZ,          -- engine outputs decay if signals underneath do

  run_id              UUID REFERENCES analysis_runs(id),

  UNIQUE(entity_id, engine_name, formula_version, calculated_at)
);

CREATE INDEX idx_engine_entity    ON engine_outputs(entity_id, engine_name);
CREATE INDEX idx_engine_calc      ON engine_outputs(calculated_at DESC);
CREATE INDEX idx_engine_version   ON engine_outputs(formula_version);
```

---

### 3.8 Scarsian Index™ Snapshots

```sql
-- One row per scoring run. Never overwrite. Historical record is permanent.
-- status: draft → approved or rejected
CREATE TABLE scarsian_snapshots (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id                   UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  entity_type                 TEXT NOT NULL,
  run_id                      UUID REFERENCES analysis_runs(id),

  -- Engine inputs (from engine_outputs — not from AI)
  financial_strength_score    FLOAT,
  leadership_score            FLOAT,
  career_growth_score_engine  FLOAT,  -- renamed to avoid collision
  culture_score               FLOAT,
  compensation_score          FLOAT,
  global_friendliness_score   FLOAT,
  interview_experience_score  FLOAT,
  job_stability_score         FLOAT,

  -- Pillar scores (formula-calculated)
  career_growth_score         FLOAT NOT NULL,   -- CGS
  career_risk_score           FLOAT NOT NULL,   -- CRS
  market_value_score          FLOAT NOT NULL,   -- MVS
  career_fit_score            FLOAT NOT NULL,   -- CFS
  gfi_score                   FLOAT NOT NULL,

  -- Base and adjustments
  base_score                  FLOAT NOT NULL,
  momentum_adjustment         FLOAT NOT NULL DEFAULT 0,
  volatility_penalty          FLOAT NOT NULL DEFAULT 0,
  confidence_penalty          FLOAT NOT NULL DEFAULT 0,
  severe_risk_override        BOOLEAN DEFAULT FALSE,

  -- Final output
  scarsian_score              FLOAT NOT NULL,
  career_alpha                FLOAT NOT NULL,
  confidence_score            FLOAT NOT NULL,
  verdict                     TEXT CHECK (verdict IN ('strong','caution','no-go')),
  verdict_label               TEXT CHECK (verdict_label IN (
                                'Strong Move', 'Consider Carefully', 'High Risk'
                              )),
  trend_direction             TEXT CHECK (trend_direction IN ('improving','stable','declining')),
  insufficient_data           BOOLEAN DEFAULT FALSE,

  -- Versioning
  formula_version             TEXT NOT NULL,

  -- Admin workflow
  status                      TEXT DEFAULT 'draft' CHECK (status IN (
                                'draft', 'approved', 'rejected', 'expired'
                              )),
  approved_at                 TIMESTAMPTZ,
  approved_by                 UUID REFERENCES auth.users(id),
  rejection_reason            TEXT,

  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_snap_entity         ON scarsian_snapshots(entity_id, status);
CREATE INDEX idx_snap_approved       ON scarsian_snapshots(entity_id, approved_at DESC)
                                        WHERE status = 'approved';
CREATE INDEX idx_snap_created        ON scarsian_snapshots(created_at DESC);
CREATE INDEX idx_snap_entity_history ON scarsian_snapshots(entity_id, created_at DESC);
```

---

### 3.9 Analyst Reports

```sql
-- AI generates language, not scores.
-- Analyst reports explain the Scarsian snapshot in human-readable form.
-- All reports are draft by default and require admin approval.
CREATE TABLE analyst_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id         UUID NOT NULL REFERENCES scarsian_snapshots(id) ON DELETE CASCADE,
  entity_id           UUID NOT NULL REFERENCES entities(id),

  report_type         TEXT NOT NULL CHECK (report_type IN (
                        'executive_summary',
                        'analyst_note',
                        'risk_brief',
                        'opportunity_brief',
                        'global_friendliness_explanation',
                        'career_outlook',
                        'comparison_note'
                      )),

  content             TEXT NOT NULL,

  -- AI metadata
  ai_model            TEXT,
  prompt_version      TEXT,
  tokens_used         INT,

  -- Input passed to AI (for audit)
  ai_input_summary    JSONB,  -- engine scores + top signals passed to AI

  -- Admin workflow
  status              TEXT DEFAULT 'draft' CHECK (status IN (
                        'draft', 'approved', 'published', 'archived'
                      )),
  edited_content      TEXT,     -- admin-edited version if different from AI output
  approved_by         UUID REFERENCES auth.users(id),
  approved_at         TIMESTAMPTZ,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_snapshot ON analyst_reports(snapshot_id);
CREATE INDEX idx_reports_entity   ON analyst_reports(entity_id, status);
```

---

### 3.10 User Career Profiles

```sql
CREATE TABLE user_career_profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Career context (entity references)
  current_role_id         UUID REFERENCES entities(id),     -- job_role
  target_role_id          UUID REFERENCES entities(id),     -- job_role
  current_country_id      UUID REFERENCES entities(id),     -- country
  target_country_id       UUID REFERENCES entities(id),     -- country
  current_company_id      UUID REFERENCES entities(id),     -- company
  university_id           UUID REFERENCES entities(id),     -- university
  skill_ids               UUID[],                           -- skill entities
  industry_preferences    UUID[],                           -- industry entities

  -- Personalization weights (0–1, must sum to ~1.0)
  priority_career_growth  FLOAT DEFAULT 0.35,
  priority_stability      FLOAT DEFAULT 0.30,
  priority_market_value   FLOAT DEFAULT 0.20,
  priority_career_fit     FLOAT DEFAULT 0.15,

  -- Qualitative priorities
  salary_priority         TEXT CHECK (salary_priority IN ('low','medium','high','critical')),
  flexibility_priority    TEXT CHECK (flexibility_priority IN ('low','medium','high','critical')),
  global_priority         TEXT CHECK (global_priority IN ('low','medium','high','critical')),

  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.11 User Entity Recommendations

```sql
CREATE TABLE user_entity_recommendations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id             UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  snapshot_id           UUID REFERENCES scarsian_snapshots(id),

  relevance_score       FLOAT CHECK (relevance_score BETWEEN 0 AND 100),
  personalized_verdict  TEXT CHECK (personalized_verdict IN (
                          'Strong Move', 'Consider Carefully', 'High Risk', 'Not Relevant'
                        )),
  recommendation_type   TEXT CHECK (recommendation_type IN ('explore','compare','watch','avoid')),
  personalization       JSONB,   -- which factors drove the personalized score

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, entity_id)
);
```

---

### 3.12 Wallet System

```sql
-- One wallet per user
CREATE TABLE user_wallets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance         INT NOT NULL DEFAULT 0 CHECK (balance >= 0),   -- credits
  lifetime_spent  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Credit packages available for purchase
CREATE TABLE credit_packages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  credits         INT NOT NULL,
  price_hkd       INT NOT NULL,
  stripe_price_id TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Every credit movement is recorded
CREATE TABLE credit_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id           UUID NOT NULL REFERENCES user_wallets(id),
  user_id             UUID NOT NULL REFERENCES auth.users(id),
  transaction_type    TEXT NOT NULL CHECK (transaction_type IN (
                        'purchase',         -- bought credits
                        'spend',            -- used credits for a feature
                        'refund',           -- credit returned
                        'bonus',            -- admin granted
                        'expiry',           -- credits expired
                        'career_pass_grant' -- Career Pass auto-credit
                      )),
  amount              INT NOT NULL,        -- positive = added, negative = deducted
  balance_after       INT NOT NULL,
  description         TEXT,
  feature_used        TEXT,               -- 'company_report', 'comparison', 'offer_analysis'
  entity_id           UUID REFERENCES entities(id),
  stripe_payment_id   TEXT,
  package_id          UUID REFERENCES credit_packages(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_txn_wallet  ON credit_transactions(wallet_id, created_at DESC);
CREATE INDEX idx_txn_user    ON credit_transactions(user_id, created_at DESC);

-- Career Pass: 90-day unlimited access
CREATE TABLE career_passes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  stripe_payment_id TEXT,
  price_paid_hkd  INT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_passes_user   ON career_passes(user_id, status);
CREATE INDEX idx_passes_expiry ON career_passes(expires_at) WHERE status = 'active';

-- Track which reports a user has unlocked
CREATE TABLE unlocked_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id   UUID NOT NULL REFERENCES entities(id),
  snapshot_id UUID REFERENCES scarsian_snapshots(id),
  unlock_type TEXT CHECK (unlock_type IN ('credit_spend','career_pass','free_tier','admin_grant')),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, entity_id)
);
```

---

### 3.13 Analysis Runs

```sql
-- Audit log for every pipeline execution
CREATE TABLE analysis_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id         UUID NOT NULL REFERENCES entities(id),
  triggered_by      UUID REFERENCES auth.users(id),
  trigger_type      TEXT CHECK (trigger_type IN (
                      'manual', 'scheduled', 'signal_threshold', 'admin_force'
                    )),

  status            TEXT DEFAULT 'pending' CHECK (status IN (
                      'pending', 'collecting', 'extracting',
                      'signaling', 'engine_run', 'scoring',
                      'generating_report', 'complete', 'failed'
                    )),

  -- Results
  events_created    INT DEFAULT 0,
  evidence_created  INT DEFAULT 0,
  signals_created   INT DEFAULT 0,
  engines_run       TEXT[],
  snapshot_id       UUID REFERENCES scarsian_snapshots(id),

  error_log         JSONB,
  started_at        TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);

CREATE INDEX idx_runs_entity  ON analysis_runs(entity_id, started_at DESC);
CREATE INDEX idx_runs_status  ON analysis_runs(status);
```

---

### 3.14 Audit Logs

```sql
-- Every admin action is logged. Immutable.
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        UUID NOT NULL REFERENCES auth.users(id),
  action          TEXT NOT NULL,   -- 'approve_snapshot', 'reject_signal', 'override_score', etc.
  resource_type   TEXT NOT NULL,   -- table name: 'scarsian_snapshots', 'signals', etc.
  resource_id     UUID NOT NULL,
  before_state    JSONB,
  after_state     JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_actor    ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created  ON audit_logs(created_at DESC);
```

---

## 4. Data Flow Diagrams

### 4.1 Signal Collection Flow

```
Admin triggers run (entity_id + market context)
            │
            ▼
    CREATE analysis_run (status: collecting)
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
Wikipedia API   Brave Search   NewsAPI   HKEX/SEC (future)
     │             │             │
     └──────┬──────┘─────────────┘
            │ raw source material
            ▼
    AI EXTRACTION STEP
    (AI reads raw text → extracts structured claims)
    AI outputs:
      - event_type
      - extracted_claim (one factual sentence)
      - extracted_value { metric, value, direction, magnitude }
      - confidence
            │
     ┌──────┴──────────┐
     ▼                 ▼
intelligence_events   evidence_records
(one per real event)  (one per extracted claim, IMMUTABLE)
     │                 │
     └────────┬────────┘
              ▼
           signals
    (structured interpretation,
     engine_tags assigned,
     expiry calculated,
     decay_rate set)
              │
              ▼
    UPDATE analysis_run (status: signaling → engine_run)
```

### 4.2 Intelligence Engine Flow

```
signals WHERE entity_id = X
  AND verification_status != 'disputed'
  AND (expires_at IS NULL OR expires_at > NOW())
      │
      ├──▶ financial_strength engine
      │      consumes: financial, earnings, regulatory
      │      weight_adjustment: signal.reliability × signal.confidence × decay_factor
      │      output: { score, component_scores, confidence }
      │
      ├──▶ leadership engine
      │      consumes: executive_change, leadership, scandal
      │
      ├──▶ career_growth engine
      │      consumes: hiring, expansion, promotion_policy, product
      │
      ├──▶ culture engine
      │      consumes: culture, sentiment, interview_experience
      │
      ├──▶ compensation engine
      │      consumes: compensation, hiring
      │
      ├──▶ global_friendliness engine (GFI)
      │      consumes: english_language, visa_policy, interview_experience
      │
      ├──▶ interview_experience engine
      │      consumes: interview_experience, culture, sentiment
      │
      └──▶ job_stability engine
             consumes: layoffs, restructuring, financial, regulatory

All 8 engines → INSERT engine_outputs (formula_version stamped)
```

### 4.3 Scarsian Index Calculation

```
engine_outputs (all 8 engines, latest per entity)
            │
            ▼
    lib/scoring.ts (server-side, formula only, zero AI)
            │
            ├── CGS = career_growth×0.50 + culture×0.25 + global_friendliness×0.25
            │
            ├── CRS = financial_strength×0.40 + leadership×0.30 + job_stability×0.30
            │
            ├── MVS = career_growth×0.40 + compensation×0.35 + market_signals×0.25
            │         (market_signals derived from expansion/contraction signals)
            │
            ├── CFS = culture×0.45 + global_friendliness×0.35 + interview_exp×0.20
            │
            ├── Base = CGS×0.35 + CRS×0.30 + MVS×0.20 + CFS×0.15
            │
            ├── Momentum Adjustment (-5..+5)
            │   derived from: hiring signals trend + expansion signals trend
            │
            ├── Volatility Penalty (-10..0)
            │   derived from: layoffs + executive_change + restructuring + scandal signals
            │
            ├── Confidence Penalty (0..-5)
            │   applied when confidence_score < 70:
            │   penalty = (70 - confidence_score) × 0.1, capped at -5
            │
            ├── Severe Risk Override
            │   if any signal.category = 'scandal' with magnitude > 0.8:
            │   cap final score at 35
            │
            ├── Final = clamp(Base + Momentum + Volatility + ConfPenalty, 0, 100)
            │
            ├── Career Alpha = Final - 50
            │
            ├── Trend Direction:
            │   compare to previous approved snapshot for same entity
            │   improving / stable / declining
            │
            └── Insufficient Data:
                confidence_score < 50 → insufficient_data = true
                display "Insufficient Data", suppress numerical score

                │
                ▼
        INSERT scarsian_snapshots (status: 'draft', formula_version stamped)
```

### 4.4 Analyst Report Generation

```
scarsian_snapshot (draft, score calculated)
            │
            ▼
    AI receives ONLY:
    ├── entity name + metadata
    ├── engine output scores (NOT raw signals or evidence)
    ├── top 5 positive signals: { category, direction, summary, source }
    ├── top 5 negative signals: { category, direction, summary, source }
    ├── Scarsian Index final score
    ├── pillar scores (CGS, CRS, MVS, CFS, GFI)
    └── trend_direction vs previous snapshot
            │
            ▼
    AI generates (draft status, never auto-published):
    ├── executive_summary     (2 sentences)
    ├── analyst_note          (3–4 sentences, professional tone)
    ├── risk_brief            (2–3 bullet risks)
    ├── opportunity_brief     (2–3 bullet opportunities)
    ├── global_friendliness_explanation
    └── career_outlook        (3-year projection narrative)
            │
            ▼
    INSERT analyst_reports[] (status: 'draft')
            │
            ▼
    UPDATE analysis_run (status: 'complete')
            │
            ▼
    Admin notified → Admin CMS review queue
```

### 4.5 Admin Review & Approval

```
Admin opens /admin/review/[snapshotId]
            │
            ├── View: evidence_records + verification_status
            ├── View: signals grouped by engine
            ├── View: engine_outputs with component_scores
            ├── View: scarsian_score + pillar breakdown
            ├── View: analyst_reports (all types)
            │
            ├── Admin can:
            │   ├── Verify or dispute individual evidence records
            │   ├── Verify or dispute individual signals
            │   ├── Override engine inputs (manual override score + audit note)
            │   ├── Edit analyst report content
            │   └── Override trend_direction
            │
            ├── On APPROVE:
            │   ├── Recalculate scoring with any admin overrides
            │   ├── UPDATE scarsian_snapshots (status: approved, approved_at, approved_by)
            │   ├── UPDATE analyst_reports (status: published)
            │   ├── UPDATE entities (surface scores for public display)
            │   ├── INSERT audit_log (action: approve_snapshot)
            │   └── Public entity page now shows updated intelligence
            │
            └── On REJECT:
                ├── UPDATE scarsian_snapshots (status: rejected, rejection_reason)
                ├── INSERT audit_log (action: reject_snapshot)
                └── Draft stays private
```

### 4.6 Trend Layer

```
Every approved snapshot is permanently stored.

Query: scarsian_snapshots WHERE entity_id = X AND status = 'approved' ORDER BY approved_at

January 2025:  scarsian_score=78, verdict='strong'
February 2025: scarsian_score=81, verdict='strong', trend=improving
March 2025:    scarsian_score=84, verdict='strong', trend=improving
April 2025:    scarsian_score=79, verdict='strong', trend=declining

Frontend: render time-series chart
Annotate chart with intelligence_events (e.g. "CEO departed" at March dip)
Show trend_direction badge on entity page
```

### 4.7 Wallet & Access Flow

```
User requests entity report
            │
            ▼
    Check: unlocked_reports WHERE user_id = X AND entity_id = Y
            │
     Already unlocked? ──YES──▶ Show report
            │NO
            ▼
    Check: career_passes WHERE user_id = X AND status = 'active' AND expires_at > NOW()
            │
     Active Career Pass? ──YES──▶ INSERT unlocked_reports (career_pass) → Show report
            │NO
            ▼
    Check: user_wallets.balance >= feature_cost
            │
     Sufficient credits? ──YES──▶
            │                    Deduct credits (INSERT credit_transaction: spend)
            │                    INSERT unlocked_reports (credit_spend)
            │                    INSERT audit_log
            │                    Show report
            │NO
            ▼
    Show: "Buy credits or get a Career Pass to unlock this report"
    Feature costs (credits):
    ├── Company report:   5 credits
    ├── Comparison:       3 credits
    ├── Offer analysis:   4 credits
    └── Free tier:        3 free reports on signup (wallet grant)
```

---

## 5. Migration Sequence

### Phase 0 — Freeze (Immediate)
- No new features on current company-centric tables
- Current frontend continues to work unchanged
- No data deleted

### Phase 1 — Parallel Schema (Week 1)
```
1. CREATE all new v3 tables alongside existing tables
2. CREATE formula_versions row: { version: 'v3.0', is_active: true }
3. Migrate existing companies → entities (entity_type = 'company')
   INSERT INTO entities (entity_type, name, slug, metadata)
   SELECT 'company', name, slug, jsonb_build_object('founded', founded, ...)
   FROM companies
4. Migrate company_sources → evidence_records + signals
   (best-effort: assign categories from source_type field)
5. CREATE compatibility views:
   CREATE VIEW companies_compat AS SELECT ... FROM entities WHERE entity_type = 'company'
6. Keep all existing pages working, reading from old tables
```

### Phase 2 — Event & Evidence Layer (Week 2)
```
1. Admin CMS: add Events section
2. Admin CMS: add Evidence section
3. Migrate company_signal_scores → signals
   (map old signal names to new categories)
4. Link existing company_score_snapshots → scarsian_snapshots
5. Test: /admin/review/[id] reads from new tables
```

### Phase 3 — Intelligence Engines (Week 3)
```
1. Implement 8 engine functions in lib/engines/
2. Each engine: query signals by entity_id + engine_tags → compute score
3. Store outputs in engine_outputs
4. Update lib/scoring.ts to consume engine_outputs (not raw signals)
5. Recalculate all draft snapshots through new engine layer
6. QA: verify formula produces expected outputs
```

### Phase 4 — Frontend Data Layer (Week 4)
```
1. Create lib/intelligence.ts (unified data access layer)
   getEntityIntelligence(slug, type) → { entity, snapshot, engines, reports }
2. Update /company/[slug] to use lib/intelligence.ts
3. Add trend chart component
4. Keep /company/[slug] URL (no redirect needed)
5. Add /company/[slug]/signals page (admin only)
```

### Phase 5 — Wallet (Week 5–6)
```
1. Create wallet tables
2. Grant 3 free credits on signup (via Supabase trigger)
3. Replace Stripe subscription checkout with credit pack checkout
4. Add Career Pass Stripe product (HK$228/90 days)
5. Update unlocked_reports check on all paid features
6. Deprecate old subscriptions table
```

### Phase 6 — New Entity Types (Week 7+)
```
1. Seed industry entities from company.metadata.industry
2. Seed country entities
3. Run pipeline on industry-level entities
4. Add /industry/[slug] pages
5. Surface knowledge graph: "Companies in this industry" on industry page
```

---

## 6. TypeScript Type System (Foundation)

```typescript
// lib/types/entities.ts

export type EntityType =
  | 'company' | 'industry' | 'country' | 'city'
  | 'job_role' | 'skill' | 'university'

export type EngineId =
  | 'financial_strength' | 'leadership' | 'career_growth'
  | 'culture' | 'compensation' | 'global_friendliness'
  | 'interview_experience' | 'job_stability'

export type SignalCategory =
  | 'hiring' | 'layoffs' | 'compensation' | 'culture'
  | 'leadership' | 'financial' | 'regulatory' | 'market'
  | 'interview_experience' | 'english_language' | 'visa_policy'
  | 'promotion_policy' | 'executive_change' | 'restructuring'
  | 'earnings' | 'expansion' | 'contraction' | 'scandal' | 'sentiment'

export type SignalDirection = 'positive' | 'negative' | 'neutral'
export type SnapshotStatus = 'draft' | 'approved' | 'rejected' | 'expired'
export type Verdict = 'strong' | 'caution' | 'no-go'
export type VerdictLabel = 'Strong Move' | 'Consider Carefully' | 'High Risk'

export interface Entity {
  id: string
  entity_type: EntityType
  name: string
  slug: string
  display_name?: string
  canonical_id?: string
  metadata: Record<string, unknown>
  status: 'active' | 'deprecated' | 'merged'
}

export interface EngineOutput {
  id: string
  entity_id: string
  engine_name: EngineId
  score: number            // 0–100
  confidence: number       // 0–100
  component_scores: Record<string, number>
  signal_ids: string[]
  signal_count: number
  formula_version: string
  calculated_at: string
}

export interface ScarsianSnapshot {
  id: string
  entity_id: string
  // Engine inputs
  financial_strength_score?: number
  leadership_score?: number
  career_growth_score_engine?: number
  culture_score?: number
  compensation_score?: number
  global_friendliness_score?: number
  interview_experience_score?: number
  job_stability_score?: number
  // Pillars
  career_growth_score: number
  career_risk_score: number
  market_value_score: number
  career_fit_score: number
  gfi_score: number
  // Adjustments
  base_score: number
  momentum_adjustment: number
  volatility_penalty: number
  confidence_penalty: number
  severe_risk_override: boolean
  // Final
  scarsian_score: number
  career_alpha: number
  confidence_score: number
  verdict: Verdict
  verdict_label: VerdictLabel
  trend_direction?: 'improving' | 'stable' | 'declining'
  insufficient_data: boolean
  formula_version: string
  status: SnapshotStatus
}

// lib/types/wallet.ts

export interface UserWallet {
  id: string
  user_id: string
  balance: number
  lifetime_spent: number
}

export type TransactionType =
  | 'purchase' | 'spend' | 'refund' | 'bonus' | 'expiry' | 'career_pass_grant'

export const FEATURE_COSTS: Record<string, number> = {
  company_report: 5,
  comparison: 3,
  offer_analysis: 4,
}

export const FREE_CREDITS_ON_SIGNUP = 3
```

---

## 7. Security Requirements

All of the following must be in place before any feature goes to production.

```
Authentication & Authorization:
├── RLS on ALL tables — no table without a policy
├── Admin routes: check profiles.is_admin server-side (not client-side)
├── Service role key: only in server-side lib/supabase/admin.ts
├── No Supabase keys in client bundle except NEXT_PUBLIC_SUPABASE_ANON_KEY
├── No OpenAI keys in client bundle
├── No Stripe secrets in client bundle

API Security:
├── Stripe webhooks: verify signature via STRIPE_WEBHOOK_SECRET before processing
├── All admin API routes: auth check + admin check before any DB write
├── Rate limiting on: /api/admin/analyze (expensive), /api/offers/analyze
├── Generic error messages to users (never expose stack traces or DB errors)

Wallet Security:
├── Credit deductions: use Supabase transactions or RPC functions (not client-side math)
├── balance CHECK (balance >= 0) at DB level
├── All credit_transactions: server-side only, never from client
├── Career Pass expiry: checked server-side on every access

Audit:
├── audit_logs: INSERT on every admin action (approve, reject, override, grant)
├── audit_logs: immutable — no UPDATE or DELETE policies
├── credit_transactions: immutable — no UPDATE or DELETE policies
├── evidence_records: immutable — disputes create new records, never overwrite

Data:
├── evidence_records: verified public sources only
├── No automated scraping from LinkedIn, Glassdoor, Indeed, Blind
├── Every source stored with URL, type, reliability, verification_status
```

---

## 8. Risks & Tradeoffs

| Risk | Severity | Mitigation |
|---|---|---|
| Migration disrupts live frontend | High | Phase 1 runs parallel tables; compatibility views bridge old→new |
| Signal quality is low without scale | High | Manual admin verification required before approval; confidence penalties |
| Engine formula changes break historical comparison | Medium | formula_version on every row; old snapshots never recalculated |
| AI generates false analyst notes | Medium | All AI output is draft; admin approves before publish; input is structured not raw |
| Wallet complexity delays launch | Medium | Phase 5 — wallet comes after core intelligence is stable |
| Supabase RLS complexity with 18+ tables | Medium | Establish RLS patterns early; test with non-admin user before shipping |
| Signal decay requires background jobs | Low | Cron job to mark expired signals; Supabase pg_cron or Vercel Cron |
| Entity deduplication (HSBC HK vs HSBC Global) | Low | Use entity_relationships (subsidiary_of); separate entities with separate signals |

---

## 9. Implementation Timeline

| Phase | Work | Duration | Dependency |
|---|---|---|---|
| 0 | Freeze, architecture approval | Now | — |
| 1 | New schema + entity migration | Week 1 | Approval |
| 2 | Event + evidence + signal layer | Week 2 | Phase 1 |
| 3 | Intelligence engines + scoring v3 | Week 3 | Phase 2 |
| 4 | Frontend data layer + trend chart | Week 4 | Phase 3 |
| 5 | Wallet + career pass + credits | Week 5–6 | Phase 4 |
| 6 | New entity types (industry, country) | Week 7+ | Phase 4 |
| 7 | Hong Kong company dataset | Week 8+ | Phase 3 |
| 8 | Personalization layer | Week 9+ | Phase 6 |
| 9 | Forecast placeholders | Week 10+ | Phase 7 |

---

## 10. Open Questions for Confirmation

1. **Formula weights** — The CGS/CRS/MVS/CFS weights (0.35/0.30/0.20/0.15) from v2 are retained. Confirm or adjust?

2. **Engine-to-pillar mapping** — Proposed above. Needs sign-off before scoring module is written.

3. **Signal expiry defaults** — Proposed in schema comments. Confirm?

4. **Career Pass pricing** — HK$228/90 days proposed. Confirm? Should it replace the existing Premium subscription or run alongside?

5. **Free credit grant** — 3 credits = 0.6 company reports on signup. Is this the right number?

6. **HSBC HK vs HSBC Global** — Treat as two separate entities connected via `subsidiary_of`? Or one entity with a `market` field?

7. **Trend calculation** — How frequently should the pipeline re-run for existing entities? Proposed: weekly for active entities (those with Career Pass users watching them).

8. **Admin CMS priority** — Should Admin CMS be built before or after the wallet system?

---

**This document is the canonical architecture reference for v3.**
**No implementation begins until this is reviewed and open questions are answered.**
