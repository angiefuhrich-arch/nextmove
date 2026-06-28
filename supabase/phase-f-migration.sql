-- ============================================================
-- Phase F Migration: Multi-vertical foundations + security gaps
-- ============================================================
-- Run after: phase-e-migration.sql
-- Idempotent: all blocks use IF NOT EXISTS / OR REPLACE / DO $$

-- ── 1. Entity type enum — add new verticals ────────────────────────────────────
DO $$ BEGIN
  -- Add each missing value only if it doesn't exist yet
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'university'             AND enumtypid = 'entity_type_enum'::regtype) THEN
    ALTER TYPE entity_type_enum ADD VALUE 'university';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'hospital'              AND enumtypid = 'entity_type_enum'::regtype) THEN
    ALTER TYPE entity_type_enum ADD VALUE 'hospital';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'law_firm'              AND enumtypid = 'entity_type_enum'::regtype) THEN
    ALTER TYPE entity_type_enum ADD VALUE 'law_firm';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'accounting_firm'       AND enumtypid = 'entity_type_enum'::regtype) THEN
    ALTER TYPE entity_type_enum ADD VALUE 'accounting_firm';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'hotel'                 AND enumtypid = 'entity_type_enum'::regtype) THEN
    ALTER TYPE entity_type_enum ADD VALUE 'hotel';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'restaurant'            AND enumtypid = 'entity_type_enum'::regtype) THEN
    ALTER TYPE entity_type_enum ADD VALUE 'restaurant';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'financial_institution' AND enumtypid = 'entity_type_enum'::regtype) THEN
    ALTER TYPE entity_type_enum ADD VALUE 'financial_institution';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'professional_service'  AND enumtypid = 'entity_type_enum'::regtype) THEN
    ALTER TYPE entity_type_enum ADD VALUE 'professional_service';
  END IF;
EXCEPTION WHEN undefined_object THEN
  -- entity_type_enum doesn't exist yet; entities.entity_type is TEXT — skip
  NULL;
END $$;

-- ── 2. entity_markets — one entity, many markets ───────────────────────────────
CREATE TABLE IF NOT EXISTS entity_markets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id   UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  market      TEXT NOT NULL,          -- e.g. 'HK', 'SG', 'US', 'GB'
  country     TEXT NOT NULL,          -- e.g. 'Hong Kong', 'Singapore'
  is_primary  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_id, market)
);

CREATE INDEX IF NOT EXISTS entity_markets_entity_idx ON entity_markets (entity_id);
CREATE INDEX IF NOT EXISTS entity_markets_market_idx  ON entity_markets (market);

-- Only one primary market per entity
CREATE UNIQUE INDEX IF NOT EXISTS entity_markets_primary_idx
  ON entity_markets (entity_id) WHERE is_primary = true;

-- RLS
ALTER TABLE entity_markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entity_markets_read"
  ON entity_markets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "entity_markets_write_service"
  ON entity_markets FOR ALL
  TO service_role
  USING (true);

-- ── 3. source_tier_rules — DB-driven tier classification ───────────────────────
CREATE TABLE IF NOT EXISTS source_tier_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NULL entity_type = applies to all verticals (global rule)
  entity_type       TEXT,
  domain_pattern    TEXT NOT NULL,        -- matched via hostname.endsWith()
  tier              SMALLINT NOT NULL CHECK (tier BETWEEN 1 AND 4),
  reliability_score SMALLINT NOT NULL CHECK (reliability_score BETWEEN 0 AND 100),
  allow_for_evidence BOOLEAN NOT NULL DEFAULT false,
  allow_scraping    BOOLEAN NOT NULL DEFAULT false,
  notes             TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (domain_pattern, entity_type)     -- entity_type NULL counts as one slot
);

CREATE INDEX IF NOT EXISTS source_tier_rules_entity_idx ON source_tier_rules (entity_type);
CREATE INDEX IF NOT EXISTS source_tier_rules_tier_idx   ON source_tier_rules (tier);

ALTER TABLE source_tier_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "source_tier_rules_read"
  ON source_tier_rules FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "source_tier_rules_write_service"
  ON source_tier_rules FOR ALL
  TO service_role
  USING (true);

-- Seed: migrate existing hardcoded rules (entity_type NULL = global)
INSERT INTO source_tier_rules (entity_type, domain_pattern, tier, reliability_score, allow_for_evidence, allow_scraping, notes)
VALUES
  -- Tier 1 — global regulatory / official
  (NULL, 'hkex.com.hk',           1, 97, true,  true,  'HKEX stock exchange'),
  (NULL, 'sfc.hk',                1, 97, true,  true,  'HK Securities and Futures Commission'),
  (NULL, 'cr.gov.hk',             1, 97, true,  true,  'HK Companies Registry'),
  (NULL, 'sec.gov',               1, 97, true,  true,  'US Securities and Exchange Commission'),
  (NULL, 'edgar.sec.gov',         1, 97, true,  true,  'SEC EDGAR filings'),
  (NULL, 'companieshouse.gov.uk', 1, 97, true,  true,  'UK Companies House'),
  (NULL, 'ir.tesla.com',          1, 95, true,  true,  'Tesla investor relations'),
  (NULL, 'investors.airbnb.com',  1, 95, true,  true,  'Airbnb investor relations'),
  (NULL, 'ir.netflix.net',        1, 95, true,  true,  'Netflix investor relations'),
  (NULL, 'stripe.com',            1, 92, true,  true,  'Stripe official'),
  -- Tier 2 — structured data
  (NULL, 'crunchbase.com',        2, 78, true,  true,  'Startup data aggregator'),
  (NULL, 'levels.fyi',            2, 75, true,  true,  'Compensation data'),
  (NULL, 'pitchbook.com',         2, 80, true,  false, 'Login-gated VC data'),
  (NULL, 'jobsdb.com',            2, 68, true,  true,  'Asia job listings'),
  (NULL, 'jobstreet.com',         2, 68, true,  true,  'SEA job listings'),
  (NULL, 'wikipedia.org',         2, 65, true,  true,  'Encyclopedia'),
  -- Tier 3 — reputable news
  (NULL, 'bloomberg.com',         3, 90, true,  true,  NULL),
  (NULL, 'reuters.com',           3, 90, true,  true,  NULL),
  (NULL, 'ft.com',                3, 90, true,  true,  NULL),
  (NULL, 'wsj.com',               3, 88, true,  true,  NULL),
  (NULL, 'nytimes.com',           3, 88, true,  true,  NULL),
  (NULL, 'theguardian.com',       3, 82, true,  true,  NULL),
  (NULL, 'scmp.com',              3, 80, true,  true,  'South China Morning Post'),
  (NULL, 'cnbc.com',              3, 80, true,  true,  NULL),
  (NULL, 'techcrunch.com',        3, 78, true,  true,  NULL),
  (NULL, 'forbes.com',            3, 72, true,  true,  NULL),
  (NULL, 'businessinsider.com',   3, 68, true,  true,  NULL),
  (NULL, 'hkfp.com',              3, 72, true,  true,  'HK Free Press'),
  -- Tier 4 — community / discovery only (global)
  (NULL, 'linkedin.com',          4, 40, false, false, 'Login-gated; discovery only'),
  (NULL, 'linkedin.com/jobs',     4, 40, false, false, 'Login-gated'),
  (NULL, 'glassdoor.com',         4, 38, false, false, 'Review site'),
  (NULL, 'indeed.com',            4, 35, false, false, 'Job site'),
  (NULL, 'teamblind.com',         4, 32, false, false, 'Anonymous forum'),
  (NULL, 'reddit.com',            4, 28, false, false, 'Social forum'),
  (NULL, 'twitter.com',           4, 25, false, false, 'Social media'),
  (NULL, 'x.com',                 4, 25, false, false, 'Social media'),
  (NULL, 'facebook.com',          4, 20, false, false, 'Social media'),
  (NULL, 'quora.com',             4, 22, false, false, 'Q&A site'),

  -- University-specific Tier 1 sources
  ('university', 'ugc.edu.hk',        1, 98, true, true,  'HK University Grants Committee'),
  ('university', 'qaa.ac.uk',         1, 97, true, true,  'UK Quality Assurance Agency'),
  ('university', 'moe.gov.cn',        1, 96, true, true,  'China Ministry of Education'),
  ('university', 'qs.com',            2, 82, true, true,  'QS World University Rankings'),
  ('university', 'timeshighereducation.com', 2, 82, true, true, 'THE Rankings'),
  ('university', 'topuniversities.com', 2, 80, true, true, 'QS rankings portal'),

  -- Hospital-specific Tier 1 sources
  ('hospital', 'dh.gov.hk',           1, 98, true, true,  'HK Department of Health'),
  ('hospital', 'cms.gov',             1, 98, true, true,  'US Centers for Medicare & Medicaid'),
  ('hospital', 'cqc.org.uk',          1, 97, true, true,  'UK Care Quality Commission'),
  ('hospital', 'jointcommission.org', 2, 90, true, true,  'Joint Commission accreditation'),
  ('hospital', 'leapfroggroup.org',   2, 85, true, true,  'Hospital safety scores'),

  -- Law firm-specific Tier 1/2 sources
  ('law_firm', 'hklawsoc.org.hk',     1, 98, true, true,  'HK Law Society'),
  ('law_firm', 'sra.org.uk',          1, 98, true, true,  'Solicitors Regulation Authority'),
  ('law_firm', 'americanbar.org',     1, 97, true, true,  'American Bar Association'),
  ('law_firm', 'chambersandpartners.com', 2, 88, true, true, 'Chambers rankings'),
  ('law_firm', 'legal500.com',        2, 85, true, true,  'Legal 500 rankings'),

  -- Hotel-specific sources
  ('hotel', 'tripadvisor.com',        3, 65, true, true,  'Travel reviews (aggregated)'),
  ('hotel', 'booking.com',            3, 70, true, true,  'Booking platform with ratings'),
  ('hotel', 'hyatt.com',              1, 90, true, true,  'Official hotel website'),

  -- Financial institution-specific
  ('financial_institution', 'mas.gov.sg', 1, 98, true, true, 'Monetary Authority of Singapore'),
  ('financial_institution', 'hkma.gov.hk', 1, 98, true, true, 'HK Monetary Authority'),
  ('financial_institution', 'federalreserve.gov', 1, 98, true, true, 'US Federal Reserve'),
  ('financial_institution', 'fca.org.uk', 1, 98, true, true, 'UK FCA')

ON CONFLICT (domain_pattern, entity_type) DO NOTHING;

-- ── 4. scoring_models — per entity_type formula registry ───────────────────────
CREATE TABLE IF NOT EXISTS scoring_models (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   TEXT NOT NULL,              -- matches entities.entity_type
  model_name    TEXT NOT NULL,
  version       TEXT NOT NULL,              -- e.g. 'v1.0.0'
  description   TEXT,
  insufficient_data_threshold SMALLINT NOT NULL DEFAULT 50,  -- confidence below this = insufficient
  verdict_strong   SMALLINT NOT NULL DEFAULT 70,
  verdict_caution  SMALLINT NOT NULL DEFAULT 45,
  is_active     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, version)
);

-- Only one active model per entity_type
CREATE UNIQUE INDEX IF NOT EXISTS scoring_models_active_idx
  ON scoring_models (entity_type) WHERE is_active = true;

ALTER TABLE scoring_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scoring_models_read"
  ON scoring_models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "scoring_models_write_service"
  ON scoring_models FOR ALL
  TO service_role
  USING (true);

-- ── 5. scoring_dimensions — per-model pillar and sub-dimension weights ──────────
CREATE TABLE IF NOT EXISTS scoring_dimensions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id        UUID NOT NULL REFERENCES scoring_models(id) ON DELETE CASCADE,
  dimension_key   TEXT NOT NULL,    -- e.g. 'career_growth', 'patient_safety'
  dimension_label TEXT NOT NULL,
  pillar_weight   NUMERIC(5,4) NOT NULL,   -- weight of this pillar in final score (sums to 1.0)
  -- Sub-dimensions stored as JSONB: [{key, label, weight, signal_key}]
  sub_dimensions  JSONB NOT NULL DEFAULT '[]',
  -- Adjustment config (optional)
  is_adjustment   BOOLEAN NOT NULL DEFAULT false,
  adjustment_min  NUMERIC(6,2),
  adjustment_max  NUMERIC(6,2),
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (model_id, dimension_key)
);

CREATE INDEX IF NOT EXISTS scoring_dimensions_model_idx ON scoring_dimensions (model_id);

ALTER TABLE scoring_dimensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scoring_dimensions_read"
  ON scoring_dimensions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "scoring_dimensions_write_service"
  ON scoring_dimensions FOR ALL
  TO service_role
  USING (true);

-- Seed: employer scoring model v1.0.0
WITH model AS (
  INSERT INTO scoring_models (entity_type, model_name, version, description, is_active)
  VALUES (
    'company',
    'Scarsian Employer Index',
    'v1.0.0',
    'Career intelligence score for employers: CGS 30% + CRS 25% + MVS 15% + CFS 20% + GFI 10%',
    true
  )
  ON CONFLICT (entity_type, version) DO NOTHING
  RETURNING id
)
INSERT INTO scoring_dimensions (model_id, dimension_key, dimension_label, pillar_weight, sub_dimensions, sort_order)
SELECT
  model.id,
  d.dimension_key,
  d.dimension_label,
  d.pillar_weight,
  d.sub_dimensions::JSONB,
  d.sort_order
FROM model, (VALUES
  ('career_growth', 'Career Growth Score', 0.30,
   '[{"key":"promotion_velocity","label":"Promotion Velocity","weight":0.35},{"key":"skill_transferability","label":"Skill Transferability","weight":0.35},{"key":"network_multiplier","label":"Network Multiplier","weight":0.30}]',
   1),
  ('career_risk', 'Career Risk Score', 0.25,
   '[{"key":"layoff_resilience","label":"Layoff Resilience","weight":0.35},{"key":"reputation_safety","label":"Reputation Safety","weight":0.30},{"key":"financial_stability","label":"Financial Stability","weight":0.35}]',
   2),
  ('market_value', 'Market Value Score', 0.15,
   '[{"key":"badge_premium","label":"Badge Premium","weight":0.45},{"key":"talent_magnetism","label":"Talent Magnetism","weight":0.30},{"key":"sector_optionality","label":"Sector Optionality","weight":0.25}]',
   3),
  ('career_fit', 'Career Fit Score', 0.20,
   '[{"key":"culture_alignment","label":"Culture Alignment","weight":1.0}]',
   4),
  ('global_friendliness', 'Global Friendliness Index', 0.10,
   '[{"key":"communication_accessibility","label":"Communication Accessibility","weight":0.25},{"key":"visa_accessibility","label":"Visa Accessibility","weight":0.20},{"key":"international_leadership","label":"International Leadership","weight":0.15},{"key":"expat_retention","label":"Expat Retention","weight":0.15},{"key":"language_accessibility","label":"Language Accessibility","weight":0.15},{"key":"regional_autonomy","label":"Regional Autonomy","weight":0.10}]',
   5)
) AS d(dimension_key, dimension_label, pillar_weight, sub_dimensions, sort_order)
ON CONFLICT (model_id, dimension_key) DO NOTHING;

-- ── 6. brief_templates — per entity_type brief schema + prompts ────────────────
CREATE TABLE IF NOT EXISTS brief_templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type      TEXT NOT NULL,
  template_name    TEXT NOT NULL,
  description      TEXT,
  -- JSON schema describing expected output fields
  output_schema    JSONB NOT NULL,
  -- AI system prompt for this template (appended after AI_SYSTEM_PROMPT_PREFIX)
  system_prompt    TEXT NOT NULL,
  prompt_version   TEXT NOT NULL DEFAULT '1.0.0',
  is_active        BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, prompt_version)
);

-- Only one active template per entity_type
CREATE UNIQUE INDEX IF NOT EXISTS brief_templates_active_idx
  ON brief_templates (entity_type) WHERE is_active = true;

ALTER TABLE brief_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brief_templates_read"
  ON brief_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "brief_templates_write_service"
  ON brief_templates FOR ALL
  TO service_role
  USING (true);

-- Seed: Employer Brief template v1.0.0
INSERT INTO brief_templates (entity_type, template_name, description, output_schema, system_prompt, prompt_version, is_active)
VALUES (
  'company',
  'Employer Intelligence Brief',
  'Career-focused brief for employers, covering growth, risk, culture and global friendliness.',
  '{
    "title": "string",
    "summary": "string — 2–3 sentence executive summary",
    "strengths": [{"text": "string"}],
    "risks": [{"text": "string"}],
    "good_for": [{"text": "string — type of professional this employer suits"}],
    "avoid_if": [{"text": "string — profile that should avoid this employer"}],
    "gfi_notes": "string — global friendliness observations"
  }'::JSONB,
  'You are a senior career intelligence analyst. Your task is to write a concise, evidence-based employer brief for career professionals evaluating a job offer or career move.

RULES:
- Write ONLY from the structured intelligence provided. Do not invent facts.
- Use precise, professional language. No marketing language.
- Do not reveal scores or formulas; describe the employer qualitatively.
- Each point must be supported by the provided evidence or signals.
- Do not recommend accepting or rejecting an offer; present facts only.
- Output ONLY valid JSON matching the provided schema.',
  '1.0.0',
  true
)
ON CONFLICT (entity_type, prompt_version) DO NOTHING;

-- ── 7. analyst_reports — add template_id + redacted evidence tracking ──────────
ALTER TABLE analyst_reports
  ADD COLUMN IF NOT EXISTS brief_template_id UUID REFERENCES brief_templates(id),
  ADD COLUMN IF NOT EXISTS brief_template_version TEXT,
  ADD COLUMN IF NOT EXISTS evidence_ids_used UUID[] DEFAULT '{}';  -- internal, never exposed publicly

-- Backfill: mark all existing reports as using default employer template
UPDATE analyst_reports ar
SET brief_template_id = (
  SELECT id FROM brief_templates WHERE entity_type = 'company' AND is_active = true LIMIT 1
)
WHERE brief_template_id IS NULL;

-- ── 8. pipeline_runs — add ai_model_version ────────────────────────────────────
ALTER TABLE pipeline_runs
  ADD COLUMN IF NOT EXISTS ai_model_version TEXT,
  ADD COLUMN IF NOT EXISTS scoring_model_id UUID REFERENCES scoring_models(id),
  ADD COLUMN IF NOT EXISTS entity_type      TEXT;  -- denormalized for fast filtering

-- ── 9. evidence_records — add entity_type column for direct queries ─────────────
ALTER TABLE evidence_records
  ADD COLUMN IF NOT EXISTS entity_type TEXT;

-- Backfill from entities join
UPDATE evidence_records er
SET entity_type = e.entity_type
FROM entities e
WHERE er.entity_id = e.id
  AND er.entity_type IS NULL;

-- ── 10. Security: admin_audit_logs — ensure evidence_ids column ────────────────
ALTER TABLE admin_audit_logs
  ADD COLUMN IF NOT EXISTS resource_type TEXT,
  ADD COLUMN IF NOT EXISTS metadata      JSONB DEFAULT '{}';

-- ── 11. Updated_at trigger for new tables ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER source_tier_rules_updated_at
    BEFORE UPDATE ON source_tier_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER scoring_models_updated_at
    BEFORE UPDATE ON scoring_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER brief_templates_updated_at
    BEFORE UPDATE ON brief_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
