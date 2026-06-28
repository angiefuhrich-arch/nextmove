-- Phase E: Events + Signals
-- intelligence_events: structured employer events extracted from evidence
-- intelligence_signals: scored signals derived from events, traceable to evidence

-- ── Event type enum ───────────────────────────────────────────────────────────

CREATE TYPE intelligence_event_type AS ENUM (
  'leadership_change',
  'hiring_increase',
  'hiring_slowdown',
  'expansion',
  'restructuring',
  'layoff',
  'financial_growth',
  'financial_decline',
  'award',
  'regulatory_issue',
  'policy_change',
  'product_strategy',
  'market_signal',
  'insufficient_event_data'
);

-- ── Signal category / direction enums ─────────────────────────────────────────

CREATE TYPE signal_category AS ENUM (
  'financial_strength',
  'leadership',
  'career_growth',
  'culture',
  'compensation',
  'global_friendliness',
  'job_stability'
);

CREATE TYPE signal_direction AS ENUM ('positive', 'negative', 'neutral');

-- ── intelligence_events ───────────────────────────────────────────────────────

CREATE TABLE intelligence_events (
  id                             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  pipeline_run_id                UUID NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  entity_id                      UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,

  event_type                     intelligence_event_type NOT NULL,
  title                          TEXT NOT NULL,
  summary                        TEXT NOT NULL,

  -- Temporal: approximate date extracted from evidence, may be null
  event_date                     DATE,
  event_date_precision           TEXT CHECK (event_date_precision IN ('day','month','quarter','year','approximate','unknown')),

  -- Evidence traceability: array of evidence_record IDs that support this event
  supporting_evidence_ids        UUID[] NOT NULL DEFAULT '{}',

  -- Quality signals
  confidence                     NUMERIC(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  source_tier                    INTEGER NOT NULL CHECK (source_tier BETWEEN 1 AND 4),

  -- Prompt versioning
  event_extraction_prompt_version TEXT NOT NULL DEFAULT '1.0.0',
  evidence_schema_version         TEXT NOT NULL DEFAULT '1.0.0',

  created_at                     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX intelligence_events_entity_idx  ON intelligence_events(entity_id);
CREATE INDEX intelligence_events_run_idx     ON intelligence_events(pipeline_run_id);
CREATE INDEX intelligence_events_type_idx    ON intelligence_events(event_type);

-- ── intelligence_signals ──────────────────────────────────────────────────────

CREATE TABLE intelligence_signals (
  id                             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  pipeline_run_id                UUID NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  entity_id                      UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  event_id                       UUID NOT NULL REFERENCES intelligence_events(id) ON DELETE CASCADE,

  category                       signal_category NOT NULL,
  subcategory                    TEXT,

  direction                      signal_direction NOT NULL,

  -- 0–100 magnitude of the signal
  magnitude                      NUMERIC(5,2) NOT NULL CHECK (magnitude BETWEEN 0 AND 100),
  -- 0–1 weight this signal should carry during scoring
  weight                         NUMERIC(4,3) NOT NULL CHECK (weight BETWEEN 0 AND 1),

  -- Evidence quality inherited from event
  confidence                     NUMERIC(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  reliability                    NUMERIC(4,3) NOT NULL CHECK (reliability BETWEEN 0 AND 1),

  -- When this signal should expire (stale evidence decays)
  expiry_date                    DATE,

  -- Free-text explanation for analysts / audit trail
  explanation                    TEXT NOT NULL,

  -- Prompt versioning
  signal_generation_prompt_version TEXT NOT NULL DEFAULT '1.0.0',

  created_at                     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX intelligence_signals_entity_idx    ON intelligence_signals(entity_id);
CREATE INDEX intelligence_signals_run_idx       ON intelligence_signals(pipeline_run_id);
CREATE INDEX intelligence_signals_event_idx     ON intelligence_signals(event_id);
CREATE INDEX intelligence_signals_category_idx  ON intelligence_signals(category);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE intelligence_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_signals ENABLE ROW LEVEL SECURITY;

-- Intelligence tables are admin-read / service-write only.
-- Public-facing data is surfaced through approved briefs, not raw events/signals.

CREATE POLICY "admin_read_intelligence_events"
  ON intelligence_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "admin_read_intelligence_signals"
  ON intelligence_signals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Service role (server-side only) handles all inserts — no anon/user insert policies.

-- ── pipeline_runs: track event/signal counts ──────────────────────────────────

ALTER TABLE pipeline_runs
  ADD COLUMN IF NOT EXISTS event_count         INTEGER,
  ADD COLUMN IF NOT EXISTS signal_count        INTEGER,
  ADD COLUMN IF NOT EXISTS insufficient_events BOOLEAN DEFAULT FALSE;
