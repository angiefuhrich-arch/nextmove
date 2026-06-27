-- Scarsian Career Intelligence — Phase 1 Migration
-- Entity System · Events · Evidence · Signals · Formula Registry
-- Run this AFTER schema.sql and pipeline-schema.sql have been applied.

-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for entity name search

-- ============================================================
-- 1. FORMULA REGISTRY
-- ============================================================

CREATE TABLE IF NOT EXISTS formula_versions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version          TEXT UNIQUE NOT NULL,          -- semver, e.g. 'v1.0.0'
  description      TEXT,
  -- Pillar weights for Scarsian Index
  pillar_weights   JSONB NOT NULL DEFAULT '{
    "cgs": 0.30,
    "crs": 0.25,
    "mvs": 0.15,
    "cfs": 0.20,
    "gfi": 0.10
  }',
  -- Intra-pillar signal weights
  cgs_signal_weights JSONB NOT NULL DEFAULT '{
    "promotion_velocity": 0.35,
    "skill_transferability": 0.35,
    "network_multiplier": 0.30
  }',
  crs_signal_weights JSONB NOT NULL DEFAULT '{
    "layoff_resilience": 0.35,
    "reputation_safety": 0.30,
    "financial_stability": 0.35
  }',
  mvs_signal_weights JSONB NOT NULL DEFAULT '{
    "badge_premium": 0.45,
    "talent_magnetism": 0.30,
    "sector_optionality": 0.25
  }',
  cfs_signal_weights JSONB NOT NULL DEFAULT '{
    "culture_alignment": 1.0
  }',
  gfi_signal_weights JSONB NOT NULL DEFAULT '{
    "communication_accessibility": 0.25,
    "visa_accessibility": 0.20,
    "international_leadership": 0.15,
    "expat_retention": 0.15,
    "language_accessibility": 0.15,
    "regional_autonomy": 0.10
  }',
  -- Confidence weighting
  confidence_weights JSONB NOT NULL DEFAULT '{
    "evidence_coverage": 0.30,
    "data_freshness": 0.25,
    "cross_source_agreement": 0.25,
    "sample_reliability": 0.20
  }',
  -- Adjustment layer rules
  adjustment_rules JSONB NOT NULL DEFAULT '{
    "momentum_range": [-5, 5],
    "volatility_range": [-10, 0],
    "momentum_divisor": 10,
    "volatility_divisor": 10
  }',
  -- Confidence threshold below which we declare "Insufficient Data"
  insufficient_data_threshold INTEGER NOT NULL DEFAULT 50,
  -- Verdict thresholds
  verdict_thresholds JSONB NOT NULL DEFAULT '{
    "strong": 70,
    "caution": 45
  }',
  is_active        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by       UUID REFERENCES auth.users(id)
);

-- Only one active formula at a time
CREATE UNIQUE INDEX IF NOT EXISTS formula_versions_active_unique
  ON formula_versions (is_active)
  WHERE is_active = TRUE;

-- Engine-to-pillar mapping (per formula version)
CREATE TABLE IF NOT EXISTS engine_formula_mappings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_version_id  UUID NOT NULL REFERENCES formula_versions(id),
  engine_name         TEXT NOT NULL,   -- 'financial_strength' | 'leadership' | etc.
  target_pillars      JSONB NOT NULL,  -- [{"pillar":"crs","weight":1.0}, ...]
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (formula_version_id, engine_name)
);

-- ============================================================
-- 2. ENTITY SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS entities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   TEXT NOT NULL CHECK (entity_type IN ('company','industry','country','person')),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  -- Optional market/locale context
  market        TEXT,          -- e.g. 'HK', 'SG', 'US'
  -- Soft link to legacy companies table during migration
  legacy_company_id UUID REFERENCES companies(id),
  -- Extra metadata (flexible)
  metadata      JSONB NOT NULL DEFAULT '{}',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, slug)
);

CREATE INDEX IF NOT EXISTS entities_name_trgm ON entities USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS entities_type ON entities (entity_type);
CREATE INDEX IF NOT EXISTS entities_slug ON entities (slug);

-- Entity relationships (parent/subsidiary/peer/competitor)
CREATE TABLE IF NOT EXISTS entity_relationships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity_id  UUID NOT NULL REFERENCES entities(id),
  to_entity_id    UUID NOT NULL REFERENCES entities(id),
  relationship    TEXT NOT NULL CHECK (relationship IN (
    'subsidiary_of','parent_of','competitor_of','peer_of',
    'operates_in','belongs_to_industry','headquartered_in'
  )),
  -- Signal propagation from parent to child
  propagation_weight  NUMERIC(4,3) NOT NULL DEFAULT 0.30
    CHECK (propagation_weight >= 0 AND propagation_weight <= 1),
  propagation_confidence_penalty NUMERIC(4,3) NOT NULL DEFAULT 0.20
    CHECK (propagation_confidence_penalty >= 0 AND propagation_confidence_penalty <= 1),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from      DATE,
  valid_until     DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (from_entity_id <> to_entity_id)
);

CREATE INDEX IF NOT EXISTS entity_relationships_from ON entity_relationships (from_entity_id);
CREATE INDEX IF NOT EXISTS entity_relationships_to ON entity_relationships (to_entity_id);

-- ============================================================
-- 3. INTELLIGENCE EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS intelligence_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id     UUID NOT NULL REFERENCES entities(id),
  event_type    TEXT NOT NULL CHECK (event_type IN (
    'news','financial_report','job_posting','layoff','executive_change',
    'award','government_filing','policy_change','hiring_trend',
    'manual_research','admin_refresh','signal_expiry'
  )),
  title         TEXT NOT NULL,
  description   TEXT,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_url    TEXT,
  severity      TEXT CHECK (severity IN ('low','medium','high','critical')),
  metadata      JSONB NOT NULL DEFAULT '{}',
  -- Triggers recalculation
  triggers_recalc BOOLEAN NOT NULL DEFAULT FALSE,
  processed     BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS intelligence_events_entity ON intelligence_events (entity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS intelligence_events_unprocessed ON intelligence_events (processed, triggers_recalc)
  WHERE processed = FALSE AND triggers_recalc = TRUE;

-- ============================================================
-- 4. EVIDENCE RECORDS (Immutable)
-- ============================================================

-- Signal expiry defaults (informational; used by application logic)
-- job_posting: 30d, news: 90d, hiring_trend: 90d, layoff: 180d,
-- executive_change: 365d, financial_report: 365d, award: 365d,
-- policy_change: until_superseded, manual_research: none, government_filing: none

CREATE TABLE IF NOT EXISTS evidence_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       UUID NOT NULL REFERENCES entities(id),
  event_id        UUID REFERENCES intelligence_events(id),
  source_type     TEXT NOT NULL CHECK (source_type IN (
    'news','financial_report','job_posting','glassdoor','linkedin',
    'reddit','blind','hkex','government','company_website','annual_report',
    'manual_research','admin_verified','brave_search','wikipedia'
  )),
  source_url      TEXT,
  source_title    TEXT,
  content_summary TEXT NOT NULL,
  raw_content     TEXT,
  -- Immutability enforcement: only disputed and review_status can be updated
  disputed        BOOLEAN NOT NULL DEFAULT FALSE,
  dispute_reason  TEXT,
  supersedes_id   UUID REFERENCES evidence_records(id),  -- for corrections
  review_status   TEXT NOT NULL DEFAULT 'unreviewed'
    CHECK (review_status IN ('unreviewed','accepted','rejected')),
  -- Temporal
  collected_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evidence_date   DATE,   -- date the underlying event occurred
  collected_by    UUID REFERENCES auth.users(id),  -- NULL = system
  -- Signal expiry anchor
  default_expiry_days INTEGER,  -- NULL = no expiry
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No UPDATE policy except for disputed/review_status (enforced in RLS)
CREATE INDEX IF NOT EXISTS evidence_records_entity ON evidence_records (entity_id, collected_at DESC);
CREATE INDEX IF NOT EXISTS evidence_records_event ON evidence_records (event_id);
CREATE INDEX IF NOT EXISTS evidence_not_disputed ON evidence_records (entity_id)
  WHERE disputed = FALSE;

-- ============================================================
-- 5. SIGNALS
-- ============================================================

-- Signal expiry config (per signal type)
CREATE TABLE IF NOT EXISTS signal_expiry_rules (
  signal_name           TEXT PRIMARY KEY,
  default_expiry_days   INTEGER,   -- NULL = no expiry
  decay_start_pct       NUMERIC(4,3) NOT NULL DEFAULT 0.50,  -- decay begins at 50% of lifetime
  description           TEXT
);

-- Seed default expiry rules
INSERT INTO signal_expiry_rules (signal_name, default_expiry_days, description) VALUES
  ('job_posting',          30,  'Job postings'),
  ('news',                 90,  'News and press'),
  ('hiring_trend',         90,  'Hiring trend signals'),
  ('layoff',              180,  'Layoff events'),
  ('executive_change',    365,  'Executive / leadership changes'),
  ('financial_report',    365,  'Financial reports and filings'),
  ('award',               365,  'Awards and recognition'),
  ('policy_change',      NULL,  'Until superseded'),
  ('manual_research',    NULL,  'No expiry for admin-verified research'),
  ('government_filing',  NULL,  'No expiry for government filings')
ON CONFLICT (signal_name) DO NOTHING;

-- Signals derived from evidence
CREATE TABLE IF NOT EXISTS signals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id         UUID NOT NULL REFERENCES entities(id),
  signal_name       TEXT NOT NULL,   -- matches SCORING_SIGNALS or CONFIDENCE_SIGNALS
  signal_category   TEXT NOT NULL CHECK (signal_category IN (
    'cgs','crs','mvs','cfs','gfi','confidence','adjustment'
  )),
  score             NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  confidence        NUMERIC(5,2) NOT NULL DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  reasoning         TEXT,
  -- Source tracking
  evidence_ids      UUID[] NOT NULL DEFAULT '{}',  -- evidence records used
  -- Propagation metadata
  propagated_from_entity_id UUID REFERENCES entities(id),
  propagation_weight        NUMERIC(4,3),
  -- Temporal
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ,   -- NULL = never expires
  expired           BOOLEAN NOT NULL DEFAULT FALSE,
  -- Admin override
  admin_override_score  NUMERIC(5,2),
  admin_notes           TEXT,
  review_status         TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending','accepted','overridden','rejected')),
  reviewed_at       TIMESTAMPTZ,
  reviewed_by       UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS signals_entity_active ON signals (entity_id, signal_name)
  WHERE expired = FALSE;
CREATE INDEX IF NOT EXISTS signals_expiry ON signals (expires_at)
  WHERE expired = FALSE AND expires_at IS NOT NULL;

-- ============================================================
-- 6. UPDATED TRIGGER: entities.updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS entities_updated_at ON entities;
CREATE TRIGGER entities_updated_at
  BEFORE UPDATE ON entities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

-- formula_versions
ALTER TABLE formula_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "formula_versions_read_auth" ON formula_versions;
CREATE POLICY "formula_versions_read_auth" ON formula_versions
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "formula_versions_write_admin" ON formula_versions;
CREATE POLICY "formula_versions_write_admin" ON formula_versions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- engine_formula_mappings
ALTER TABLE engine_formula_mappings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "engine_mappings_read_auth" ON engine_formula_mappings;
CREATE POLICY "engine_mappings_read_auth" ON engine_formula_mappings
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "engine_mappings_write_admin" ON engine_formula_mappings;
CREATE POLICY "engine_mappings_write_admin" ON engine_formula_mappings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- entities
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "entities_read_auth" ON entities;
CREATE POLICY "entities_read_auth" ON entities
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "entities_write_admin" ON entities;
CREATE POLICY "entities_write_admin" ON entities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- entity_relationships
ALTER TABLE entity_relationships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "entity_relationships_read_auth" ON entity_relationships;
CREATE POLICY "entity_relationships_read_auth" ON entity_relationships
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "entity_relationships_write_admin" ON entity_relationships;
CREATE POLICY "entity_relationships_write_admin" ON entity_relationships
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- intelligence_events
ALTER TABLE intelligence_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "intelligence_events_read_auth" ON intelligence_events;
CREATE POLICY "intelligence_events_read_auth" ON intelligence_events
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "intelligence_events_write_admin" ON intelligence_events;
CREATE POLICY "intelligence_events_write_admin" ON intelligence_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- evidence_records: no DELETE, UPDATE only for dispute/review_status
ALTER TABLE evidence_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "evidence_read_auth" ON evidence_records;
CREATE POLICY "evidence_read_auth" ON evidence_records
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "evidence_insert_admin" ON evidence_records;
CREATE POLICY "evidence_insert_admin" ON evidence_records
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
DROP POLICY IF EXISTS "evidence_dispute_admin" ON evidence_records;
CREATE POLICY "evidence_dispute_admin" ON evidence_records
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
-- No DELETE policy intentionally

-- signal_expiry_rules
ALTER TABLE signal_expiry_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "signal_expiry_rules_read_auth" ON signal_expiry_rules;
CREATE POLICY "signal_expiry_rules_read_auth" ON signal_expiry_rules
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "signal_expiry_rules_write_admin" ON signal_expiry_rules;
CREATE POLICY "signal_expiry_rules_write_admin" ON signal_expiry_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- signals
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "signals_read_auth" ON signals;
CREATE POLICY "signals_read_auth" ON signals
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "signals_write_admin" ON signals;
CREATE POLICY "signals_write_admin" ON signals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ============================================================
-- 8. SEED: Formula v1.0.0
-- ============================================================

DO $$
DECLARE
  fv_id UUID;
BEGIN
  INSERT INTO formula_versions (
    version, description, is_active,
    pillar_weights,
    cgs_signal_weights, crs_signal_weights,
    mvs_signal_weights, cfs_signal_weights,
    gfi_signal_weights, confidence_weights,
    adjustment_rules, insufficient_data_threshold, verdict_thresholds
  ) VALUES (
    'v1.0.0',
    'Initial Scarsian Index formula. GFI is a first-class pillar. Approved 2026-06-27.',
    TRUE,
    '{"cgs":0.30,"crs":0.25,"mvs":0.15,"cfs":0.20,"gfi":0.10}',
    '{"promotion_velocity":0.35,"skill_transferability":0.35,"network_multiplier":0.30}',
    '{"layoff_resilience":0.35,"reputation_safety":0.30,"financial_stability":0.35}',
    '{"badge_premium":0.45,"talent_magnetism":0.30,"sector_optionality":0.25}',
    '{"culture_alignment":1.0}',
    '{"communication_accessibility":0.25,"visa_accessibility":0.20,"international_leadership":0.15,"expat_retention":0.15,"language_accessibility":0.15,"regional_autonomy":0.10}',
    '{"evidence_coverage":0.30,"data_freshness":0.25,"cross_source_agreement":0.25,"sample_reliability":0.20}',
    '{"momentum_range":[-5,5],"volatility_range":[-10,0],"momentum_divisor":10,"volatility_divisor":10}',
    50,
    '{"strong":70,"caution":45}'
  )
  ON CONFLICT (version) DO NOTHING
  RETURNING id INTO fv_id;

  IF fv_id IS NOT NULL THEN
    INSERT INTO engine_formula_mappings (formula_version_id, engine_name, target_pillars) VALUES
      (fv_id, 'financial_strength',   '[{"pillar":"crs","weight":1.0}]'),
      (fv_id, 'leadership',           '[{"pillar":"crs","weight":0.5},{"pillar":"cgs","weight":0.5}]'),
      (fv_id, 'career_growth',        '[{"pillar":"cgs","weight":0.6},{"pillar":"mvs","weight":0.4}]'),
      (fv_id, 'culture',              '[{"pillar":"cfs","weight":1.0}]'),
      (fv_id, 'compensation',         '[{"pillar":"mvs","weight":1.0}]'),
      (fv_id, 'global_friendliness',  '[{"pillar":"gfi","weight":1.0}]'),
      (fv_id, 'interview_experience', '[{"pillar":"cfs","weight":1.0}]'),
      (fv_id, 'job_stability',        '[{"pillar":"crs","weight":1.0}]')
    ON CONFLICT (formula_version_id, engine_name) DO NOTHING;
  END IF;
END $$;
