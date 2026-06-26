-- Scarsian Pipeline Schema
-- Run this AFTER schema.sql in Supabase SQL Editor

-- Company sources (raw evidence)
CREATE TABLE IF NOT EXISTS company_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('brave_search','news','wikipedia','manual')),
  source_url TEXT,
  source_title TEXT,
  published_date DATE,
  retrieved_at TIMESTAMPTZ DEFAULT NOW(),
  raw_text TEXT,
  reliability_score INTEGER DEFAULT 50 CHECK (reliability_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signal scores (AI-proposed, admin-editable)
CREATE TABLE IF NOT EXISTS company_signal_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  snapshot_id UUID, -- set after snapshot created
  signal_name TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  confidence INTEGER NOT NULL DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
  reasoning TEXT,
  source_ids UUID[] DEFAULT '{}',
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','overridden')),
  admin_override_score INTEGER CHECK (admin_override_score BETWEEN 0 AND 100),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Score snapshots (calculated, versioned)
CREATE TABLE IF NOT EXISTS company_score_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  scarsian_score INTEGER NOT NULL CHECK (scarsian_score BETWEEN 0 AND 100),
  career_growth_score INTEGER NOT NULL CHECK (career_growth_score BETWEEN 0 AND 100),
  career_risk_score INTEGER NOT NULL CHECK (career_risk_score BETWEEN 0 AND 100),
  market_value_score INTEGER NOT NULL CHECK (market_value_score BETWEEN 0 AND 100),
  career_fit_score INTEGER NOT NULL CHECK (career_fit_score BETWEEN 0 AND 100),
  gfi_score INTEGER NOT NULL CHECK (gfi_score BETWEEN 0 AND 100),
  career_alpha INTEGER NOT NULL,
  confidence_score INTEGER NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
  verdict TEXT NOT NULL DEFAULT 'caution' CHECK (verdict IN ('strong','caution','no-go')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','rejected')),
  analyst_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);

-- Analyst notes (editable)
CREATE TABLE IF NOT EXISTS company_analyst_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  snapshot_id UUID REFERENCES company_score_snapshots(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key from signal_scores to snapshots
ALTER TABLE company_signal_scores
  ADD CONSTRAINT fk_signal_snapshot
  FOREIGN KEY (snapshot_id)
  REFERENCES company_score_snapshots(id)
  ON DELETE SET NULL;

-- RLS
ALTER TABLE company_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_signal_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_score_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_analyst_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Admin read sources" ON company_sources;
DROP POLICY IF EXISTS "Admin write sources" ON company_sources;
DROP POLICY IF EXISTS "Admin read signals" ON company_signal_scores;
DROP POLICY IF EXISTS "Admin write signals" ON company_signal_scores;
DROP POLICY IF EXISTS "Public read approved snapshots" ON company_score_snapshots;
DROP POLICY IF EXISTS "Admin read all snapshots" ON company_score_snapshots;
DROP POLICY IF EXISTS "Admin write snapshots" ON company_score_snapshots;
DROP POLICY IF EXISTS "Admin read notes" ON company_analyst_notes;
DROP POLICY IF EXISTS "Admin write notes" ON company_analyst_notes;

-- Sources: admin only
CREATE POLICY "Admin read sources" ON company_sources FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admin write sources" ON company_sources FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Signals: admin only
CREATE POLICY "Admin read signals" ON company_signal_scores FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admin write signals" ON company_signal_scores FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Snapshots: public can read approved, admin reads all
CREATE POLICY "Public read approved snapshots" ON company_score_snapshots FOR SELECT
  USING (status = 'approved');
CREATE POLICY "Admin read all snapshots" ON company_score_snapshots FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admin write snapshots" ON company_score_snapshots FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Notes: admin only
CREATE POLICY "Admin read notes" ON company_analyst_notes FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admin write notes" ON company_analyst_notes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
