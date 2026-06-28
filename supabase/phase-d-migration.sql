-- Phase D Migration: Evidence Collection
-- Run after phase-c-migration.sql

-- ============================================================
-- Add fetch columns to source_candidates
-- ============================================================
ALTER TABLE source_candidates
  ADD COLUMN IF NOT EXISTS source_tier        INTEGER NOT NULL DEFAULT 4
                             CHECK (source_tier BETWEEN 1 AND 4),
  ADD COLUMN IF NOT EXISTS fetch_status       TEXT NOT NULL DEFAULT 'pending'
                             CHECK (fetch_status IN ('pending','success','failed','skipped','blocked')),
  ADD COLUMN IF NOT EXISTS fetch_error        TEXT,
  ADD COLUMN IF NOT EXISTS http_status        INTEGER,
  ADD COLUMN IF NOT EXISTS raw_text           TEXT,            -- first 4000 chars of stripped body
  ADD COLUMN IF NOT EXISTS page_title         TEXT,
  ADD COLUMN IF NOT EXISTS meta_description   TEXT,
  ADD COLUMN IF NOT EXISTS content_length     INTEGER,
  ADD COLUMN IF NOT EXISTS collected_at       TIMESTAMPTZ;

-- ============================================================
-- Enrich evidence_records with Phase D columns
-- ============================================================
ALTER TABLE evidence_records
  ADD COLUMN IF NOT EXISTS source_url         TEXT,
  ADD COLUMN IF NOT EXISTS source_tier        INTEGER NOT NULL DEFAULT 4
                             CHECK (source_tier BETWEEN 1 AND 4),
  ADD COLUMN IF NOT EXISTS collected_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS content_length     INTEGER,
  ADD COLUMN IF NOT EXISTS pipeline_run_id_fk UUID;  -- explicit FK alias for clarity in queries

-- Add index on entity_id + evidence_type for engine queries (Phase E)
CREATE INDEX IF NOT EXISTS evidence_entity_type_idx
  ON evidence_records (entity_id, evidence_type);

-- ============================================================
-- Rate limit log for external fetches (SSRF/abuse tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS fetch_rate_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostname    TEXT NOT NULL,
  fetched_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS fetch_rate_log_host_idx ON fetch_rate_log (hostname, fetched_at);

ALTER TABLE fetch_rate_log ENABLE ROW LEVEL SECURITY;
-- Service role only (set by admin client)
DROP POLICY IF EXISTS "No public access fetch_rate_log" ON fetch_rate_log;
CREATE POLICY "No public access fetch_rate_log" ON fetch_rate_log
  FOR ALL USING (false);
