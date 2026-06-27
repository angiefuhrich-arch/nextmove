-- Scarsian Career Intelligence — Phase 2 Migration
-- Intelligence Engines · Scarsian Index · Trend Snapshots · Analyst Reports
-- Run AFTER phase1-migration.sql

-- ============================================================
-- 1. ENGINE OUTPUTS
-- Each engine run produces one row per entity per run.
-- ============================================================

CREATE TABLE IF NOT EXISTS engine_outputs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id           UUID NOT NULL REFERENCES entities(id),
  engine_name         TEXT NOT NULL,
  formula_version_id  UUID NOT NULL REFERENCES formula_versions(id),
  -- Pillar scores produced by this engine
  pillar_scores       JSONB NOT NULL DEFAULT '{}',  -- e.g. {"crs": 72, "cgs": 68}
  -- Confidence per pillar
  pillar_confidence   JSONB NOT NULL DEFAULT '{}',
  -- Traceability
  signal_ids          UUID[] NOT NULL DEFAULT '{}',
  evidence_ids        UUID[] NOT NULL DEFAULT '{}',
  overall_confidence  NUMERIC(5,2) NOT NULL DEFAULT 50,
  reasoning           TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS engine_outputs_entity ON engine_outputs (entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS engine_outputs_engine ON engine_outputs (engine_name, entity_id);

-- ============================================================
-- 2. SCARSIAN SNAPSHOTS (versioned, immutable after approval)
-- Replaces company_score_snapshots in the new architecture.
-- ============================================================

CREATE TABLE IF NOT EXISTS scarsian_snapshots (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id             UUID NOT NULL REFERENCES entities(id),
  formula_version_id    UUID NOT NULL REFERENCES formula_versions(id),
  -- Pillar scores
  cgs_score             NUMERIC(5,2),
  crs_score             NUMERIC(5,2),
  mvs_score             NUMERIC(5,2),
  cfs_score             NUMERIC(5,2),
  gfi_score             NUMERIC(5,2),
  -- Composite
  scarsian_score        INTEGER NOT NULL,
  career_alpha          INTEGER NOT NULL,
  confidence_score      INTEGER NOT NULL,
  insufficient_data     BOOLEAN NOT NULL DEFAULT FALSE,
  verdict               TEXT CHECK (verdict IN ('strong','caution','no-go')),
  -- Adjustment layer
  momentum_adjustment   NUMERIC(4,2),
  volatility_penalty    NUMERIC(4,2),
  base_score            NUMERIC(5,2),
  -- Traceability — every snapshot records what went into it
  engine_output_ids     UUID[] NOT NULL DEFAULT '{}',
  signal_ids            UUID[] NOT NULL DEFAULT '{}',
  calculation_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Status lifecycle
  status                TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','approved','rejected','superseded')),
  approved_at           TIMESTAMPTZ,
  approved_by           UUID REFERENCES auth.users(id),
  rejected_at           TIMESTAMPTZ,
  rejected_by           UUID REFERENCES auth.users(id),
  -- Analyst content
  analyst_note          TEXT,
  -- Link to prior snapshot (for superseded chain)
  supersedes_id         UUID REFERENCES scarsian_snapshots(id),
  -- Legacy bridge during migration
  legacy_snapshot_id    UUID,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS scarsian_snapshots_entity ON scarsian_snapshots (entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS scarsian_snapshots_approved ON scarsian_snapshots (entity_id, status)
  WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS scarsian_snapshots_formula ON scarsian_snapshots (formula_version_id);

-- ============================================================
-- 3. INTELLIGENCE TREND POINTS (time series)
-- ============================================================

CREATE TABLE IF NOT EXISTS intelligence_trend_points (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id        UUID NOT NULL REFERENCES entities(id),
  snapshot_id      UUID REFERENCES scarsian_snapshots(id),
  scarsian_score   INTEGER NOT NULL,
  confidence_score INTEGER NOT NULL,
  cgs_score        INTEGER,
  crs_score        INTEGER,
  mvs_score        INTEGER,
  cfs_score        INTEGER,
  gfi_score        INTEGER,
  recorded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trigger          TEXT CHECK (trigger IN (
    'new_signals','news','financial_report','admin_refresh','weekly','manual','initial'
  ))
);

CREATE INDEX IF NOT EXISTS trend_points_entity ON intelligence_trend_points (entity_id, recorded_at DESC);

-- ============================================================
-- 4. ANALYST REPORTS
-- ============================================================

CREATE TABLE IF NOT EXISTS analyst_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id    UUID NOT NULL REFERENCES entities(id),
  snapshot_id  UUID REFERENCES scarsian_snapshots(id),
  title        TEXT NOT NULL,
  summary      TEXT NOT NULL,
  -- Structured sections
  strengths    JSONB NOT NULL DEFAULT '[]',   -- [{text: "..."}, ...]
  risks        JSONB NOT NULL DEFAULT '[]',
  good_for     JSONB NOT NULL DEFAULT '[]',
  avoid_if     JSONB NOT NULL DEFAULT '[]',
  gfi_notes    TEXT,
  -- Status
  status       TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published','archived')),
  published_at TIMESTAMPTZ,
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analyst_reports_entity ON analyst_reports (entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS analyst_reports_published ON analyst_reports (entity_id)
  WHERE status = 'published';

DROP TRIGGER IF EXISTS analyst_reports_updated_at ON analyst_reports;
CREATE TRIGGER analyst_reports_updated_at
  BEFORE UPDATE ON analyst_reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 5. ANALYSIS RUNS (audit trail for each pipeline run)
-- ============================================================

CREATE TABLE IF NOT EXISTS analysis_runs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id           UUID NOT NULL REFERENCES entities(id),
  formula_version_id  UUID REFERENCES formula_versions(id),
  status              TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running','completed','failed')),
  trigger             TEXT CHECK (trigger IN (
    'admin_manual','new_signals','news','financial_report','weekly','api'
  )),
  engines_run         TEXT[] NOT NULL DEFAULT '{}',
  snapshot_id         UUID REFERENCES scarsian_snapshots(id),
  error               TEXT,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  created_by          UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS analysis_runs_entity ON analysis_runs (entity_id, started_at DESC);

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

-- engine_outputs
ALTER TABLE engine_outputs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "engine_outputs_read_auth" ON engine_outputs;
CREATE POLICY "engine_outputs_read_auth" ON engine_outputs
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "engine_outputs_write_admin" ON engine_outputs;
CREATE POLICY "engine_outputs_write_admin" ON engine_outputs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- scarsian_snapshots
ALTER TABLE scarsian_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scarsian_snapshots_read_approved" ON scarsian_snapshots;
CREATE POLICY "scarsian_snapshots_read_approved" ON scarsian_snapshots
  FOR SELECT USING (
    status = 'approved' OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
DROP POLICY IF EXISTS "scarsian_snapshots_write_admin" ON scarsian_snapshots;
CREATE POLICY "scarsian_snapshots_write_admin" ON scarsian_snapshots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- intelligence_trend_points
ALTER TABLE intelligence_trend_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trend_points_read_auth" ON intelligence_trend_points;
CREATE POLICY "trend_points_read_auth" ON intelligence_trend_points
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "trend_points_write_admin" ON intelligence_trend_points;
CREATE POLICY "trend_points_write_admin" ON intelligence_trend_points
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- analyst_reports
ALTER TABLE analyst_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analyst_reports_read_published" ON analyst_reports;
CREATE POLICY "analyst_reports_read_published" ON analyst_reports
  FOR SELECT USING (
    status = 'published' OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
DROP POLICY IF EXISTS "analyst_reports_write_admin" ON analyst_reports;
CREATE POLICY "analyst_reports_write_admin" ON analyst_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- analysis_runs
ALTER TABLE analysis_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analysis_runs_read_admin" ON analysis_runs;
CREATE POLICY "analysis_runs_read_admin" ON analysis_runs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
DROP POLICY IF EXISTS "analysis_runs_write_admin" ON analysis_runs;
CREATE POLICY "analysis_runs_write_admin" ON analysis_runs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
