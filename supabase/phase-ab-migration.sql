-- Phase A+B Migration: On-Demand Intelligence Pipeline
-- Run after phase1-migration.sql and phase2-migration.sql

-- ============================================================
-- entities: canonical employer records (name + slug)
-- ============================================================
CREATE TABLE IF NOT EXISTS entities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  industry    TEXT,
  country     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read entities" ON entities;
CREATE POLICY "Public read entities" ON entities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write entities" ON entities;
CREATE POLICY "Admin write entities" ON entities FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- ============================================================
-- entity_aliases: alternate names that map to a canonical entity
-- ============================================================
CREATE TABLE IF NOT EXISTS entity_aliases (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id  UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  alias      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS entity_aliases_alias_idx ON entity_aliases (lower(alias));

ALTER TABLE entity_aliases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read aliases" ON entity_aliases;
CREATE POLICY "Public read aliases" ON entity_aliases FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write aliases" ON entity_aliases;
CREATE POLICY "Admin write aliases" ON entity_aliases FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- ============================================================
-- entity_search_logs: every search query for analytics
-- ============================================================
CREATE TABLE IF NOT EXISTS entity_search_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  raw_query      TEXT NOT NULL,
  normalized     TEXT NOT NULL,
  matched_entity UUID REFERENCES entities(id) ON DELETE SET NULL,
  cache_hit      BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE entity_search_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users insert own search logs" ON entity_search_logs;
CREATE POLICY "Users insert own search logs" ON entity_search_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "Admin read search logs" ON entity_search_logs;
CREATE POLICY "Admin read search logs" ON entity_search_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- ============================================================
-- pipeline_runs: one row per on-demand intelligence request
-- ============================================================
CREATE TYPE IF NOT EXISTS pipeline_status AS ENUM (
  'queued',
  'discovering',
  'verifying',
  'collecting',
  'extracting',
  'detecting_events',
  'generating_signals',
  'running_engines',
  'scoring',
  'generating_brief',
  'completed',
  'insufficient_evidence',
  'failed',
  'needs_user_clarification'
);

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_slug     TEXT NOT NULL,
  entity_name     TEXT NOT NULL,
  status          pipeline_status NOT NULL DEFAULT 'queued',
  step_log        JSONB NOT NULL DEFAULT '[]',
  entity_id       UUID REFERENCES entities(id) ON DELETE SET NULL,
  snapshot_id     UUID,  -- set when completed
  error_message   TEXT,
  requested_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
-- Users can insert and read their own runs
DROP POLICY IF EXISTS "Users insert own runs" ON pipeline_runs;
CREATE POLICY "Users insert own runs" ON pipeline_runs FOR INSERT
  WITH CHECK (auth.uid() = requested_by OR requested_by IS NULL);
DROP POLICY IF EXISTS "Users read own runs" ON pipeline_runs;
CREATE POLICY "Users read own runs" ON pipeline_runs FOR SELECT
  USING (auth.uid() = requested_by OR requested_by IS NULL);
DROP POLICY IF EXISTS "Admin full access runs" ON pipeline_runs;
CREATE POLICY "Admin full access runs" ON pipeline_runs FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- brief_unlocks: tracks per-user free repeat views
CREATE TABLE IF NOT EXISTS brief_unlocks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id  UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, entity_id)
);

ALTER TABLE brief_unlocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own unlocks" ON brief_unlocks;
CREATE POLICY "Users manage own unlocks" ON brief_unlocks FOR ALL
  USING (auth.uid() = user_id);

-- Seed mock entities that match existing mock data
INSERT INTO entities (slug, name, industry, country) VALUES
  ('stripe',  'Stripe',  'Fintech',              'USA'),
  ('tesla',   'Tesla',   'Automotive / AI',       'USA'),
  ('netflix', 'Netflix', 'Entertainment / Tech',  'USA'),
  ('airbnb',  'Airbnb',  'Travel / Tech',         'USA')
ON CONFLICT (slug) DO NOTHING;
