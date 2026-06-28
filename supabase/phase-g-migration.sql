-- ── Phase G: Production Readiness & Autonomous Operations ──────────────────────
-- Cache-first architecture, refresh policy engine, cost tracking,
-- operational analytics, and autonomous refresh infrastructure.

-- ── 1. entities — refresh & cache tracking ──────────────────────────────────

ALTER TABLE entities
  ADD COLUMN IF NOT EXISTS last_brief_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_refreshed_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refresh_due_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refresh_policy           TEXT NOT NULL DEFAULT 'medium'
    CHECK (refresh_policy IN ('large_public','medium','private','manual')),
  ADD COLUMN IF NOT EXISTS search_count             INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cache_hit_count          INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pipeline_run_count       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_searched_at         TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS entities_refresh_due_idx ON entities (refresh_due_at)
  WHERE refresh_due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS entities_last_searched_idx ON entities (last_searched_at DESC);

-- ── 2. scarsian_snapshots — freshness tracking ──────────────────────────────

ALTER TABLE scarsian_snapshots
  ADD COLUMN IF NOT EXISTS freshness_status TEXT NOT NULL DEFAULT 'fresh'
    CHECK (freshness_status IN ('fresh','stale','expired')),
  ADD COLUMN IF NOT EXISTS is_current       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS refresh_due_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS generated_at     TIMESTAMPTZ DEFAULT NOW();

-- Only one current snapshot per entity
CREATE UNIQUE INDEX IF NOT EXISTS snapshots_current_entity_idx
  ON scarsian_snapshots (entity_id) WHERE is_current = true;

-- ── 3. pipeline_runs — cost & cache tracking ────────────────────────────────

ALTER TABLE pipeline_runs
  ADD COLUMN IF NOT EXISTS trigger_type        TEXT NOT NULL DEFAULT 'user_search'
    CHECK (trigger_type IN ('user_search','refresh_request','admin_manual','scheduled','auto_confidence')),
  ADD COLUMN IF NOT EXISTS cache_policy_result TEXT
    CHECK (cache_policy_result IN ('fresh_served','stale_refresh_queued','miss_pipeline_started','duplicate_active')),
  ADD COLUMN IF NOT EXISTS ai_cost_estimate    NUMERIC(10,6),
  ADD COLUMN IF NOT EXISTS brave_search_count  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS openai_input_tokens  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS openai_output_tokens INTEGER NOT NULL DEFAULT 0;

-- ── 4. refresh_requests ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS refresh_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id        UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  requested_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason           TEXT,
  trigger_type     TEXT NOT NULL DEFAULT 'user_search'
    CHECK (trigger_type IN ('user_search','admin_manual','scheduled','watchlist','news_event')),
  credits_required INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed','skipped')),
  pipeline_run_id  UUID REFERENCES pipeline_runs(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS refresh_requests_entity_idx  ON refresh_requests (entity_id);
CREATE INDEX IF NOT EXISTS refresh_requests_status_idx  ON refresh_requests (status);
CREATE INDEX IF NOT EXISTS refresh_requests_created_idx ON refresh_requests (created_at DESC);

ALTER TABLE refresh_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "refresh_requests_admin" ON refresh_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "refresh_requests_own_read" ON refresh_requests FOR SELECT
  USING (requested_by = auth.uid());

-- ── 5. user_submitted_sources ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_submitted_sources (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id        UUID REFERENCES entities(id) ON DELETE SET NULL,
  submitted_by     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url              TEXT NOT NULL,
  description      TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  admin_note       TEXT,
  evidence_record_id UUID REFERENCES evidence_records(id) ON DELETE SET NULL,
  reviewed_at      TIMESTAMPTZ,
  reviewed_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_sources_entity_idx  ON user_submitted_sources (entity_id);
CREATE INDEX IF NOT EXISTS user_sources_status_idx  ON user_submitted_sources (status);
CREATE INDEX IF NOT EXISTS user_sources_user_idx    ON user_submitted_sources (submitted_by);

ALTER TABLE user_submitted_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_sources_own"   ON user_submitted_sources FOR ALL USING (submitted_by = auth.uid());
CREATE POLICY "user_sources_admin" ON user_submitted_sources FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- ── 6. watchlist_notifications ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS watchlist_notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id         UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL
    CHECK (notification_type IN ('score_change','new_signals','leadership_change','layoff_detected',
                                  'hiring_increase','compensation_change','new_evidence','brief_updated')),
  message           TEXT NOT NULL,
  previous_value    TEXT,
  new_value         TEXT,
  is_read           BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS watchlist_notif_user_idx   ON watchlist_notifications (user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS watchlist_notif_entity_idx ON watchlist_notifications (entity_id);

ALTER TABLE watchlist_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watchlist_notif_own" ON watchlist_notifications FOR ALL USING (user_id = auth.uid());

-- ── 7. Helper: increment entity counters atomically ──────────────────────────

CREATE OR REPLACE FUNCTION increment_entity_search(
  p_entity_id UUID,
  p_cache_hit BOOLEAN
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE entities SET
    search_count      = search_count + 1,
    cache_hit_count   = cache_hit_count + CASE WHEN p_cache_hit THEN 1 ELSE 0 END,
    last_searched_at  = NOW()
  WHERE id = p_entity_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_entity_search(UUID, BOOLEAN) TO service_role;

-- ── 8. Helper: mark snapshot as current ──────────────────────────────────────

CREATE OR REPLACE FUNCTION set_current_snapshot(
  p_snapshot_id UUID,
  p_entity_id   UUID,
  p_refresh_due TIMESTAMPTZ
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Clear previous current
  UPDATE scarsian_snapshots SET is_current = false
  WHERE entity_id = p_entity_id AND is_current = true;
  -- Set new current
  UPDATE scarsian_snapshots SET
    is_current     = true,
    freshness_status = 'fresh',
    refresh_due_at = p_refresh_due,
    generated_at   = NOW()
  WHERE id = p_snapshot_id;
  -- Update entity tracking
  UPDATE entities SET
    last_brief_generated_at = NOW(),
    last_refreshed_at       = NOW(),
    refresh_due_at          = p_refresh_due,
    pipeline_run_count      = pipeline_run_count + 1
  WHERE id = p_entity_id;
END;
$$;

GRANT EXECUTE ON FUNCTION set_current_snapshot(UUID, UUID, TIMESTAMPTZ) TO service_role;

-- ── 9. Helper: mark stale snapshots ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION mark_stale_snapshots()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  WITH stale AS (
    UPDATE scarsian_snapshots
    SET freshness_status = 'stale'
    WHERE is_current = true
      AND status = 'approved'
      AND refresh_due_at < NOW()
      AND freshness_status = 'fresh'
    RETURNING id
  )
  SELECT COUNT(*) INTO updated_count FROM stale;
  RETURN updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_stale_snapshots() TO service_role;
