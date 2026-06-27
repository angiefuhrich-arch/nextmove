# Scarsian Career Intelligence Platform — Architecture v2
**Status: Design Draft — For Review Before Implementation**
**Date: 2026-06-27**

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
│                                                                 │
│  External Sources                                               │
│  ├── News APIs (NewsAPI, Bing News)                             │
│  ├── Search APIs (Brave Search)                                 │
│  ├── Public Databases (Wikipedia, Crunchbase, SEC, HKEX)        │
│  ├── Job Boards (scrape-safe: LinkedIn Jobs public, Indeed)     │
│  └── Manual Admin Input                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ENTITY SYSTEM                              │
│                                                                 │
│  Company │ Industry │ Country │ City │ Job Role │ Skill │ Uni   │
│                                                                 │
│  Generic entity model — all types share the same schema.        │
│  Metadata is JSONB-typed per entity_type.                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      KNOWLEDGE GRAPH                            │
│                                                                 │
│  Entity ──(headquartered_in)──▶ Country                         │
│  Entity ──(belongs_to)──▶ Industry                              │
│  Entity ──(operates_in)──▶ City                                 │
│  Entity ──(employs)──▶ Job Role                                 │
│  Job Role ──(requires)──▶ Skill                                 │
│  Entity ──(competitor_of)──▶ Entity                             │
│                                                                 │
│  Bi-directional. Typed. Timestamped. Decaying.                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SIGNAL ENGINE                             │
│                                                                 │
│  Every piece of evidence = one Signal                           │
│                                                                 │
│  Signal {                                                       │
│    entity, category, source, confidence,                        │
│    reliability, weight, expiry, extracted_value                 │
│  }                                                              │
│                                                                 │
│  Categories: hiring | layoffs | compensation | culture |        │
│  leadership | financial | regulatory | english_language |        │
│  visa | promotion | executive_change | restructuring |           │
│  earnings | expansion | interview_experience | ...              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   INTELLIGENCE ENGINES                          │
│                                                                 │
│  Each engine consumes tagged Signals → produces a score         │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ Financial Engine │  │ Leadership Engine │                    │
│  └──────────────────┘  └──────────────────┘                    │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  Growth Engine   │  │  Culture Engine  │                    │
│  └──────────────────┘  └──────────────────┘                    │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │Compensation Eng. │  │  GF Engine (GFI) │                    │
│  └──────────────────┘  └──────────────────┘                    │
│  ┌──────────────────┐                                           │
│  │ Interview Engine │                                           │
│  └──────────────────┘                                           │
│                                                                 │
│  Outputs: structured scores with signal citations + confidence  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SCARSIAN INDEX™                              │
│                                                                 │
│  Backend formula consumes engine outputs                        │
│  CGS → CRS → MVS → CFS → Base Score → Adjustments → Final      │
│                                                                 │
│  AI is NOT called at this step.                                 │
│  Formula runs server-side in lib/scoring.ts                     │
│  Confidence < 50 → "Insufficient Data"                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AI ANALYST                                │
│                                                                 │
│  Input:  structured engine outputs + Scarsian score             │
│  Output: analyst note, summary, risk brief, opportunity brief   │
│                                                                 │
│  AI explains. AI does not score.                                │
│  All AI output is draft — requires admin approval.              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   USER RECOMMENDATION                           │
│                                                                 │
│  User profile: role, skills, country, priorities                │
│  Personalization layer adjusts relevance per user               │
│  Output: ranked intelligence feed, fit scores, alerts           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema

### 2.1 Entity System

```sql
-- Generic entity table. All types use the same table.
CREATE TABLE entities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT NOT NULL CHECK (entity_type IN (
                    'company', 'industry', 'country', 'city',
                    'job_role', 'skill', 'university'
                    -- extensible: add new types without schema change
                  )),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  display_name    TEXT,               -- localised/alternate name
  canonical_id    TEXT,               -- external ID (ISIN, ISO code, etc.)
  metadata        JSONB DEFAULT '{}', -- type-specific fields (see 2.1a)
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','deprecated','merged')),
  merged_into_id  UUID REFERENCES entities(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(entity_type, slug)
);

CREATE INDEX idx_entities_type ON entities(entity_type);
CREATE INDEX idx_entities_slug ON entities(slug);
CREATE INDEX idx_entities_metadata ON entities USING GIN(metadata);
```

**2.1a — Metadata by entity_type (JSONB schema per type):**

```
company:  { founded, size, website, ticker, hq_country_id, industry_id, hq_city_id }
industry: { sector, naics_code, sic_code, parent_industry_id }
country:  { iso2, iso3, region, subregion, hk_visa_access, english_official }
city:     { country_id, timezone, cost_of_living_index, expat_population }
job_role: { function, level_band, common_skills_ids, global_demand_index }
skill:    { category, depreciation_rate, demand_trend, transferability }
university: { country_id, qs_rank, tier, international_student_pct }
```

---

### 2.2 Knowledge Graph

```sql
-- Typed, directional relationships between entities
CREATE TABLE entity_relationships (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity_id      UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  to_entity_id        UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  relationship_type   TEXT NOT NULL CHECK (relationship_type IN (
                        'headquartered_in',   -- company → country/city
                        'operates_in',        -- company → country/city
                        'belongs_to_industry',-- company → industry
                        'employs_role',       -- company → job_role
                        'requires_skill',     -- job_role → skill
                        'teaches',            -- university → skill
                        'competitor_of',      -- company ↔ company
                        'acquired_by',        -- company → company
                        'subsidiary_of',      -- company → company
                        'part_of_industry',   -- industry → industry (hierarchy)
                        'located_in',         -- city → country
                        'expands_to'          -- company → country
                        -- add more without schema change
                      )),
  strength            FLOAT DEFAULT 1.0 CHECK (strength BETWEEN 0 AND 1),
  metadata            JSONB DEFAULT '{}',
  valid_from          DATE,
  valid_until         DATE,             -- NULL = current/ongoing
  source_signal_id    UUID,             -- signal that established this relationship
  confidence          FLOAT DEFAULT 1.0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(from_entity_id, to_entity_id, relationship_type)
);

CREATE INDEX idx_rel_from ON entity_relationships(from_entity_id, relationship_type);
CREATE INDEX idx_rel_to ON entity_relationships(to_entity_id, relationship_type);
```

---

### 2.3 Signal Engine

```sql
-- Every piece of evidence is one signal. Signals are atomic.
CREATE TABLE signals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What entity does this signal describe?
  entity_id           UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  entity_type         TEXT NOT NULL,  -- denormalized for fast filtering

  -- Classification
  category            TEXT NOT NULL CHECK (category IN (
                        'hiring', 'layoffs', 'compensation', 'culture',
                        'leadership', 'financial', 'product', 'regulatory',
                        'market', 'interview_experience', 'english_language',
                        'visa_policy', 'promotion_policy', 'executive_change',
                        'restructuring', 'earnings', 'scandal', 'expansion',
                        'contraction', 'partnership', 'award', 'sentiment'
                        -- extensible
                      )),
  subcategory         TEXT,           -- e.g. 'mass_layoff', 'cfo_departure'

  -- Source
  source_type         TEXT NOT NULL CHECK (source_type IN (
                        'news', 'job_posting', 'financial_report', 'social',
                        'employee_review', 'regulatory_filing', 'web_search',
                        'wikipedia', 'manual_admin', 'scraped_public'
                      )),
  source_url          TEXT,
  source_title        TEXT,
  source_domain       TEXT,
  source_author       TEXT,

  -- Temporal
  collected_at        TIMESTAMPTZ DEFAULT NOW(),
  published_at        TIMESTAMPTZ,    -- when the source was published
  expires_at          TIMESTAMPTZ,    -- signals decay; NULL = never expires

  -- Quality
  confidence          FLOAT NOT NULL DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  reliability         FLOAT NOT NULL DEFAULT 0.5 CHECK (reliability BETWEEN 0 AND 1),
  weight              FLOAT NOT NULL DEFAULT 1.0 CHECK (weight BETWEEN 0 AND 2),

  -- Content
  raw_text            TEXT,
  summary             TEXT,           -- AI-generated 1-sentence summary
  extracted_value     JSONB,          -- structured: {direction, magnitude, metric, unit}
  sentiment           FLOAT CHECK (sentiment BETWEEN -1 AND 1),

  -- Engine routing
  engine_tags         TEXT[],         -- which engines should consume this signal

  -- Verification workflow
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN (
                        'unverified', 'verified', 'disputed', 'expired', 'superseded'
                      )),
  verified_at         TIMESTAMPTZ,
  verified_by         UUID REFERENCES auth.users(id),
  superseded_by_id    UUID REFERENCES signals(id),

  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signals_entity ON signals(entity_id, category);
CREATE INDEX idx_signals_entity_type ON signals(entity_type);
CREATE INDEX idx_signals_category ON signals(category);
CREATE INDEX idx_signals_collected ON signals(collected_at DESC);
CREATE INDEX idx_signals_engine_tags ON signals USING GIN(engine_tags);
CREATE INDEX idx_signals_expires ON signals(expires_at) WHERE expires_at IS NOT NULL;
```

---

### 2.4 Intelligence Engines

```sql
-- Output produced by each engine for each entity
CREATE TABLE engine_outputs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id           UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  entity_type         TEXT NOT NULL,

  engine_name         TEXT NOT NULL CHECK (engine_name IN (
                        'financial_strength',
                        'leadership',
                        'growth',
                        'culture',
                        'compensation',
                        'global_friendliness',
                        'interview_experience'
                        -- add new engines without schema change
                      )),

  -- Output
  score               FLOAT NOT NULL CHECK (score BETWEEN 0 AND 100),
  component_scores    JSONB DEFAULT '{}',  -- breakdown per sub-signal
  signal_ids          UUID[],              -- signals consumed
  signal_count        INT DEFAULT 0,

  -- Confidence
  confidence          FLOAT NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  data_freshness      FLOAT CHECK (data_freshness BETWEEN 0 AND 100),
  signal_coverage     FLOAT CHECK (signal_coverage BETWEEN 0 AND 100),

  -- Versioning
  formula_version     TEXT NOT NULL,       -- e.g. 'v1.0' for auditability
  calculated_at       TIMESTAMPTZ DEFAULT NOW(),
  expires_at          TIMESTAMPTZ,         -- engine outputs decay too

  UNIQUE(entity_id, engine_name, formula_version, calculated_at)
);

CREATE INDEX idx_engine_outputs_entity ON engine_outputs(entity_id, engine_name);
CREATE INDEX idx_engine_outputs_calculated ON engine_outputs(calculated_at DESC);
```

---

### 2.5 Scarsian Index Snapshots

```sql
-- Final scored snapshot. One per entity per calculation run.
CREATE TABLE scarsian_snapshots (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id                 UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  entity_type               TEXT NOT NULL,

  -- Engine input scores (from engine_outputs)
  financial_strength_score  FLOAT,
  leadership_score          FLOAT,
  growth_score              FLOAT,
  culture_score             FLOAT,
  compensation_score        FLOAT,
  global_friendliness_score FLOAT,
  interview_experience_score FLOAT,

  -- Pillar scores (formula-calculated)
  career_growth_score       FLOAT NOT NULL,
  career_risk_score         FLOAT NOT NULL,
  market_value_score        FLOAT NOT NULL,
  career_fit_score          FLOAT NOT NULL,
  gfi_score                 FLOAT NOT NULL,

  -- Adjustment layer
  base_score                FLOAT NOT NULL,
  momentum_adjustment       FLOAT NOT NULL DEFAULT 0,
  volatility_penalty        FLOAT NOT NULL DEFAULT 0,

  -- Final output
  scarsian_score            FLOAT NOT NULL,
  career_alpha              FLOAT NOT NULL,
  confidence_score          FLOAT NOT NULL,
  verdict                   TEXT CHECK (verdict IN ('strong','caution','no-go')),
  insufficient_data         BOOLEAN DEFAULT FALSE,

  -- Admin workflow
  status                    TEXT DEFAULT 'draft' CHECK (status IN ('draft','approved','rejected','expired')),
  approved_at               TIMESTAMPTZ,
  approved_by               UUID REFERENCES auth.users(id),

  -- Versioning
  formula_version           TEXT NOT NULL DEFAULT 'v2.0',
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_snapshots_entity ON scarsian_snapshots(entity_id, status);
CREATE INDEX idx_snapshots_approved ON scarsian_snapshots(entity_id) WHERE status = 'approved';
```

---

### 2.6 AI Interpretations

```sql
-- AI explains structured scores. AI never generates scores.
CREATE TABLE ai_interpretations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id         UUID NOT NULL REFERENCES scarsian_snapshots(id) ON DELETE CASCADE,
  entity_id           UUID NOT NULL REFERENCES entities(id),

  interpretation_type TEXT NOT NULL CHECK (interpretation_type IN (
                        'analyst_note',
                        'executive_summary',
                        'risk_brief',
                        'opportunity_brief',
                        'gfi_explanation',
                        'comparison_note'
                      )),

  content             TEXT NOT NULL,
  prompt_version      TEXT,
  model               TEXT,
  tokens_used         INT,

  status              TEXT DEFAULT 'draft' CHECK (status IN ('draft','approved','published')),
  approved_by         UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2.7 User Intelligence Layer

```sql
-- User career profile (for personalization)
CREATE TABLE user_career_profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  current_role_id         UUID REFERENCES entities(id),   -- job_role entity
  target_role_id          UUID REFERENCES entities(id),
  current_country_id      UUID REFERENCES entities(id),   -- country entity
  target_country_id       UUID REFERENCES entities(id),
  current_company_id      UUID REFERENCES entities(id),   -- company entity
  university_id           UUID REFERENCES entities(id),
  skill_ids               UUID[],                          -- skill entities

  -- Weighting preferences (0–1)
  priorities              JSONB DEFAULT '{
    "career_growth": 0.35,
    "career_risk": 0.30,
    "market_value": 0.20,
    "career_fit": 0.15
  }',

  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Personalized entity recommendations
CREATE TABLE user_entity_recommendations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id           UUID NOT NULL REFERENCES entities(id),
  snapshot_id         UUID REFERENCES scarsian_snapshots(id),

  relevance_score     FLOAT,           -- personalized fit score
  personalization     JSONB,           -- which factors drove this score
  recommendation_type TEXT CHECK (recommendation_type IN ('explore','compare','watch','avoid')),

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entity_id)
);
```

---

### 2.8 Admin & Pipeline Tables

```sql
-- Pipeline analysis runs (tracks what triggered a snapshot)
CREATE TABLE analysis_runs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id           UUID NOT NULL REFERENCES entities(id),
  triggered_by        UUID REFERENCES auth.users(id),
  trigger_type        TEXT CHECK (trigger_type IN ('manual','scheduled','webhook','signal_threshold')),

  status              TEXT DEFAULT 'pending' CHECK (status IN (
                        'pending','collecting','analyzing','scoring','complete','failed'
                      )),
  signals_collected   INT DEFAULT 0,
  engines_run         TEXT[],
  snapshot_id         UUID REFERENCES scarsian_snapshots(id),
  error_log           JSONB,

  started_at          TIMESTAMPTZ DEFAULT NOW(),
  completed_at        TIMESTAMPTZ
);
```

---

## 3. Entity Relationship Diagram

```
                    ┌──────────────┐
                    │    entities  │◄─────────────────────────────┐
                    │              │                               │
                    │ entity_type  │──┐ headquarters               │
                    │ name         │  │                            │
                    │ slug         │  ▼                            │
                    │ metadata{}   │ entity_relationships          │
                    └──────┬───────┘  (knowledge graph)           │
                           │                                       │
              ┌────────────┼────────────┐                          │
              ▼            ▼            ▼                          │
         ┌─────────┐  ┌─────────┐  ┌─────────┐                   │
         │ signals │  │ engine  │  │scarsian │                   │
         │         │  │_outputs │  │_snapshot│                   │
         │ entity  │  │         │  │         │                   │
         │ category│  │ engine  │  │ scores  │                   │
         │ source  │  │ score   │  │ verdict │                   │
         │ confidence  component│  │ status  │                   │
         │ weight  │  │ signals │  │         │                   │
         │ expiry  │  │ _ids[]  │  └────┬────┘                   │
         └────┬────┘  └────┬────┘       │                        │
              │            │            ▼                         │
              │            │    ┌────────────────┐               │
              └────────────┘    │ai_interpretations│               │
                   feed         │                │               │
                                │ analyst_note   │               │
                                │ risk_brief     │               │
                                └────────────────┘               │
                                                                  │
         ┌────────────────────┐                                   │
         │user_career_profiles│──── skill_ids[] ─────────────────┘
         │                    │     role_id
         │ user priorities    │     country_id
         └────────┬───────────┘
                  │
                  ▼
         ┌────────────────────────┐
         │user_entity_recommendat │
         │ions                    │
         │ relevance_score        │
         │ personalization{}      │
         └────────────────────────┘
```

---

## 4. Data Flow Diagrams

### 4.1 Signal Collection Flow

```
Admin triggers analysis
        │
        ▼
  Create analysis_run (status: collecting)
        │
        ├──▶ Wikipedia API ──────────────┐
        ├──▶ Brave Search API ───────────┤
        ├──▶ NewsAPI ────────────────────┤──▶ raw results
        └──▶ Future: HKEX, SEC filings ─┘
                                         │
                                         ▼
                              Parse + extract
                              (AI extracts structured
                               extracted_value from raw text)
                                         │
                                         ▼
                              INSERT signals[]
                              (category, confidence,
                               reliability, engine_tags,
                               expiry set per source type)
                                         │
                                         ▼
                         Update analysis_run (status: analyzing)
```

### 4.2 Intelligence Engine Flow

```
signals (filtered by entity + engine_tags + NOT expired)
        │
        ├──▶ financial_strength engine
        │     signals: [financial, earnings, regulatory]
        │     output: score, component_scores, confidence
        │
        ├──▶ leadership engine
        │     signals: [executive_change, leadership, scandal]
        │
        ├──▶ growth engine
        │     signals: [hiring, expansion, product, market]
        │
        ├──▶ culture engine
        │     signals: [culture, compensation, sentiment]
        │
        ├──▶ compensation engine
        │     signals: [compensation, hiring]
        │
        ├──▶ global_friendliness engine (GFI)
        │     signals: [english_language, visa_policy,
        │               promotion_policy, interview_experience]
        │
        └──▶ interview_experience engine
              signals: [interview_experience, culture]

Each engine → INSERT engine_outputs row
```

### 4.3 Scarsian Index Calculation Flow

```
engine_outputs (all 7 engines for this entity)
        │
        ▼
  lib/scoring.ts (server-side, AI-free)
        │
        ├── Map engine outputs → pillar inputs
        │
        ├── CGS = f(growth, culture, global_friendliness)
        ├── CRS = f(financial_strength, leadership)
        ├── MVS = f(growth, compensation, culture)
        ├── CFS = f(culture, global_friendliness)
        │
        ├── Base Score = CGS×0.35 + CRS×0.30 + MVS×0.20 + CFS×0.15
        │
        ├── Momentum Adjustment (-5..+5)
        │    ← from growth engine trend signals
        │
        ├── Volatility Penalty (-10..0)
        │    ← from leadership + financial disruption signals
        │
        ├── Final Score = clamp(Base + Momentum + Volatility, 0, 100)
        │
        └── Confidence < 50? → insufficient_data = true
                │
                ▼
        INSERT scarsian_snapshots (status: draft)
```

### 4.4 AI Analyst Flow

```
scarsian_snapshot (draft)
        │
        ▼
  AI receives:
  ├── engine output scores (NOT raw signals)
  ├── Scarsian Index value
  ├── Top/bottom signals per engine (citations)
  └── Entity metadata
        │
        ▼
  AI generates:
  ├── analyst_note
  ├── executive_summary
  ├── risk_brief
  └── opportunity_brief
        │
        ▼
  INSERT ai_interpretations[] (status: draft)
        │
        ▼
  Admin reviews everything:
  ├── Signals (verify/dispute)
  ├── Engine outputs (override if needed)
  ├── AI interpretations (edit)
  └── Final Scarsian score (approve/reject)
        │
        ▼
  APPROVE → scarsian_snapshots.status = 'approved'
           → ai_interpretations.status = 'published'
           → visible on public entity page
```

### 4.5 User Recommendation Flow

```
User Profile
├── role, country, skills, priorities
        │
        ▼
  Query approved scarsian_snapshots
  for relevant entity types
        │
        ▼
  Personalization layer:
  re-weight formula using user.priorities
  (e.g. user prioritizes stability → CRS weight ↑)
        │
        ▼
  Rank by relevance_score
        │
        ▼
  UPSERT user_entity_recommendations
        │
        ▼
  User sees personalized intelligence feed
```

---

## 5. Migration Plan

### Phase 0 — Freeze (Now)
- Stop adding features to company-centric architecture
- Current frontend continues working unchanged
- No data is deleted

### Phase 1 — Entity Migration (Week 1)
```
GOAL: Migrate existing company records into generic entities table

1. Create new schema tables alongside existing ones (non-breaking)
2. Migrate companies → entities (entity_type = 'company')
   - companies.id maps 1:1 to entities.id via canonical_id
   - companies.industry → create industry entities + relationships
   - companies.headquarters → create country/city entities + relationships
3. Keep companies table alive as a read-only view for frontend compatibility
4. Run: INSERT INTO entities SELECT ... FROM companies
```

### Phase 2 — Signal Migration (Week 1–2)
```
GOAL: Migrate company_sources → signals

1. Map company_sources.source_type → signals.source_type
2. Map company_sources.raw_text → signals.raw_text
3. Assign engine_tags based on source content
4. company_signal_scores → signals with extracted_value JSONB
5. Old signal names map to new categories:
   - promotion_velocity    → category: 'promotion_policy'
   - financial_stability   → category: 'financial'
   - layoff_resilience     → category: 'layoffs'
   - culture_alignment     → category: 'culture'
   - visa_accessibility    → category: 'visa_policy'
   (etc.)
```

### Phase 3 — Engine Layer (Week 2–3)
```
GOAL: Replace direct signal→score mapping with engine abstraction

1. Implement 7 Intelligence Engines as server-side functions
2. Each engine queries signals by entity_id + engine_tags
3. Engines write to engine_outputs table
4. Update lib/scoring.ts to consume engine_outputs instead of raw signals
5. Recalculate all existing snapshots through new engine layer
6. company_score_snapshots → scarsian_snapshots (schema migration)
```

### Phase 4 — Frontend Compatibility (Week 3)
```
GOAL: Frontend reads from new tables, no visible change to users

Current:                          New:
/company/[slug]         →         /entity/[type]/[slug] (or keep /company/[slug])
MOCK_COMPANIES          →         entities WHERE entity_type = 'company'
MOCK_REPORTS            →         scarsian_snapshots + engine_outputs
company_score_snapshots →         scarsian_snapshots

Strategy: Create compatibility layer
  - entities view that looks like companies table
  - scarsian_snapshots view that looks like company_score_snapshots
  - Frontend code changes are minimal (swap table names)
```

### Phase 5 — New Entity Types (Week 4+)
```
GOAL: Enable Industry, Country, Job Role intelligence

1. Seed industry entities from existing company.industry fields
2. Seed country entities
3. Run pipeline on industry-level entities
4. Add /industry/[slug] and /country/[slug] pages
5. Knowledge graph relationships surface in UI
```

---

## 6. Frontend Compatibility Recommendations

### What Changes on the Backend
| Current | New |
|---|---|
| `companies` table | `entities` table (entity_type = 'company') |
| `company_sources` | `signals` |
| `company_signal_scores` | `signals` + `engine_outputs` |
| `company_score_snapshots` | `scarsian_snapshots` |
| `company_analyst_notes` | `ai_interpretations` |
| Direct signal → score | Signal → Engine → Score |

### What Does NOT Change on the Frontend (Phase 1–3)
- All existing URLs stay the same: `/company/[slug]`, `/search`, `/compare`
- Sidebar, layout, auth — untouched
- ScoreRing, CategoryScoreCard components — untouched
- Stripe billing — untouched

### Recommended Frontend Abstraction
Create a single data access layer in `lib/intelligence.ts`:
```typescript
// Current:
getCompanyReport(slug) → MOCK_REPORTS[slug]

// New (same signature, different source):
getEntityIntelligence(slug, type='company') → {
  entity, snapshot, engineOutputs, aiInterpretations
}
```
Frontend components never query tables directly — they call this layer. This means the backend can be fully replaced without touching any page components.

### Routing Strategy
Option A (Recommended): Keep `/company/[slug]` but internally resolve to entity.
Option B: `/entity/company/[slug]` as canonical, redirect from `/company/[slug]`.

Option A is less disruptive. Option B is cleaner long-term.

---

## 7. Key Design Principles

1. **Signals are immutable.** Once saved, a signal is never edited. Disputes create new signals. This preserves the evidence audit trail.

2. **Engines are versioned.** formula_version is stored on every engine_output. Changing a formula doesn't invalidate old snapshots.

3. **Signals decay.** expires_at ensures stale evidence (e.g. a 3-year-old layoff news) automatically loses weight. Engines only consume non-expired signals by default.

4. **AI is stateless at the scoring layer.** AI only receives structured engine outputs. It never sees raw signals during scoring. It generates language, not numbers.

5. **Admin is always the last gate.** No score, note, or interpretation is ever public until a human approves it.

6. **Entity system is open.** New entity types (e.g. VC Fund, Regulatory Body, Sector Index) can be added by inserting a new CHECK value — no table redesign needed.

7. **Knowledge graph enables future features.** "Companies hiring for X skill in Y country with strong GFI" becomes a graph traversal query, not a schema change.

---

## 8. Open Questions for Review

1. **Entity deduplication strategy** — If HSBC Hong Kong and HSBC Global are different entities, how do we model the parent/subsidiary relationship? Do they share signals or have separate scores?

2. **Signal expiry policy** — Proposed defaults: news=90 days, layoffs=180 days, financial_report=365 days, manual=never. Confirm?

3. **Engine formula mapping** — The current scoring formula maps raw signals to pillars. In v2, engines sit in between. How should engine scores map to CGS/CRS/MVS/CFS? Proposed:
   - CGS ← growth_engine + culture_engine
   - CRS ← financial_strength_engine + leadership_engine
   - MVS ← growth_engine + compensation_engine
   - CFS ← culture_engine + global_friendliness_engine

4. **Scheduling** — Should signal collection run on a schedule (e.g. weekly refresh per entity) or only on manual trigger? What's the initial preference?

5. **Knowledge graph queries** — What user-facing features should leverage the graph in Phase 5? Examples: "Companies in this industry with higher GFI", "Skills that increase Scarsian score at target company."

---

**Review this document before any implementation begins.**
**Once approved, Phase 1 migration can start immediately alongside the existing frontend.**
