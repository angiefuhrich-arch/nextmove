-- Phase C Migration: Persistent Pipeline + Discovery Tables
-- Run after phase-ab-migration.sql

-- ============================================================
-- Add pipeline_version to pipeline_runs
-- ============================================================
ALTER TABLE pipeline_runs
  ADD COLUMN IF NOT EXISTS pipeline_version TEXT NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS entity_type      TEXT NOT NULL DEFAULT 'employer',
  ADD COLUMN IF NOT EXISTS discovery_query  TEXT;

-- ============================================================
-- source_candidates: raw web results from Brave Search discovery
-- ============================================================
CREATE TABLE IF NOT EXISTS source_candidates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_run_id  UUID NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  url              TEXT NOT NULL,
  title            TEXT,
  description      TEXT,
  published_date   DATE,
  source_type      TEXT NOT NULL DEFAULT 'web_search'
                     CHECK (source_type IN ('web_search','news','wikipedia','linkedin','glassdoor','manual')),
  discovery_rank   INTEGER,
  reliability_score INTEGER DEFAULT 50 CHECK (reliability_score BETWEEN 0 AND 100),
  is_selected      BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS source_candidates_run_idx ON source_candidates (pipeline_run_id);

ALTER TABLE source_candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access source_candidates" ON source_candidates;
CREATE POLICY "Admin full access source_candidates" ON source_candidates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
-- Users can read candidates for their own runs
DROP POLICY IF EXISTS "Users read own run candidates" ON source_candidates;
CREATE POLICY "Users read own run candidates" ON source_candidates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pipeline_runs
    WHERE pipeline_runs.id = source_candidates.pipeline_run_id
      AND pipeline_runs.requested_by = auth.uid()
  ));

-- ============================================================
-- entity_candidates: possible employer matches found during discovery
-- ============================================================
CREATE TABLE IF NOT EXISTS entity_candidates (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_run_id        UUID NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  normalized_name        TEXT NOT NULL,
  country                TEXT,
  industry               TEXT,
  description            TEXT,
  confidence_score       INTEGER DEFAULT 50 CHECK (confidence_score BETWEEN 0 AND 100),
  source_url             TEXT,
  is_selected            BOOLEAN NOT NULL DEFAULT false,
  disambiguation_needed  BOOLEAN NOT NULL DEFAULT false,
  matched_entity_id      UUID REFERENCES entities(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS entity_candidates_run_idx ON entity_candidates (pipeline_run_id);

ALTER TABLE entity_candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access entity_candidates" ON entity_candidates;
CREATE POLICY "Admin full access entity_candidates" ON entity_candidates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
DROP POLICY IF EXISTS "Users read own run entity_candidates" ON entity_candidates;
CREATE POLICY "Users read own run entity_candidates" ON entity_candidates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pipeline_runs
    WHERE pipeline_runs.id = entity_candidates.pipeline_run_id
      AND pipeline_runs.requested_by = auth.uid()
  ));

-- ============================================================
-- evidence_records: immutable structured evidence (dispute pattern)
-- ============================================================
CREATE TABLE IF NOT EXISTS evidence_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_run_id     UUID NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  entity_id           UUID REFERENCES entities(id) ON DELETE SET NULL,
  source_candidate_id UUID REFERENCES source_candidates(id) ON DELETE SET NULL,
  evidence_type       TEXT NOT NULL
                        CHECK (evidence_type IN (
                          'financial','leadership','headcount','culture',
                          'compensation','legal','product','market','sentiment'
                        )),
  raw_text            TEXT NOT NULL,
  structured_data     JSONB,
  pipeline_version    TEXT NOT NULL DEFAULT '1.0.0',
  is_disputed         BOOLEAN NOT NULL DEFAULT false,
  dispute_reason      TEXT,
  corrected_by        UUID REFERENCES evidence_records(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
  -- No updated_at — evidence is immutable; disputes create new records
);

CREATE INDEX IF NOT EXISTS evidence_records_run_idx    ON evidence_records (pipeline_run_id);
CREATE INDEX IF NOT EXISTS evidence_records_entity_idx ON evidence_records (entity_id);

ALTER TABLE evidence_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access evidence_records" ON evidence_records;
CREATE POLICY "Admin full access evidence_records" ON evidence_records FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
-- No UPDATE/DELETE for non-admins — evidence is immutable

-- ============================================================
-- pipeline_versions: version registry for reproducibility
-- ============================================================
CREATE TABLE IF NOT EXISTS pipeline_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version         TEXT UNIQUE NOT NULL,
  description     TEXT,
  engine_versions JSONB NOT NULL DEFAULT '{}',
  prompt_versions JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pipeline_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active pipeline versions" ON pipeline_versions;
CREATE POLICY "Public read active pipeline versions" ON pipeline_versions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write pipeline versions" ON pipeline_versions;
CREATE POLICY "Admin write pipeline versions" ON pipeline_versions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

INSERT INTO pipeline_versions (version, description, engine_versions, prompt_versions, is_active)
VALUES (
  '1.0.0',
  'Initial on-demand pipeline — Phase C (discover + verify)',
  '{"financial_strength":"1.0","leadership":"1.0","career_growth":"1.0","culture":"1.0","compensation":"1.0","global_friendliness":"1.0","interview_experience":"1.0","job_stability":"1.0"}',
  '{"analyst_brief":"1.0"}',
  true
) ON CONFLICT (version) DO NOTHING;

-- ============================================================
-- RPC: Atomic append to pipeline_runs.step_log JSONB array
-- ============================================================
CREATE OR REPLACE FUNCTION append_pipeline_step(p_run_id UUID, p_entry JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing JSONB;
  updated  JSONB;
  idx      INTEGER;
BEGIN
  SELECT step_log INTO existing FROM pipeline_runs WHERE id = p_run_id FOR UPDATE;
  IF existing IS NULL THEN existing := '[]'::JSONB; END IF;

  -- Replace entry with same step if exists, otherwise append
  idx := NULL;
  FOR i IN 0..jsonb_array_length(existing)-1 LOOP
    IF (existing->i->>'step') = (p_entry->>'step') THEN
      idx := i;
      EXIT;
    END IF;
  END LOOP;

  IF idx IS NOT NULL THEN
    updated := jsonb_set(existing, ARRAY[idx::TEXT], p_entry);
  ELSE
    updated := existing || jsonb_build_array(p_entry);
  END IF;

  UPDATE pipeline_runs SET step_log = updated, updated_at = NOW() WHERE id = p_run_id;
END;
$$;

-- Grant execute to service role (used by admin client)
GRANT EXECUTE ON FUNCTION append_pipeline_step(UUID, JSONB) TO service_role;

-- ============================================================
-- Update entity_type on entities table
-- ============================================================
ALTER TABLE entities
  ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL DEFAULT 'employer'
    CHECK (entity_type IN ('employer','university','hospital','law_firm','accounting_firm','hotel','other')),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS verified    BOOLEAN NOT NULL DEFAULT false;
