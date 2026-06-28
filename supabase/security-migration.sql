-- Security Migration: Rate Limits, Audit Logs, Credit Transactions, Evidence Hashing
-- Run after phase-d-migration.sql

-- ============================================================
-- 1. Rate limit windows (Supabase-backed; swap for Upstash later)
-- ============================================================
CREATE TABLE IF NOT EXISTS rate_limit_windows (
  key         TEXT NOT NULL,           -- e.g. "search:user:uuid" or "search:ip:1.2.3.4"
  window_start TIMESTAMPTZ NOT NULL,
  count       INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);

-- Auto-clean old windows (keep 24h)
CREATE INDEX IF NOT EXISTS rate_limit_windows_start_idx ON rate_limit_windows (window_start);

ALTER TABLE rate_limit_windows ENABLE ROW LEVEL SECURITY;
-- Service role only
DROP POLICY IF EXISTS "No public access rate_limit_windows" ON rate_limit_windows;
CREATE POLICY "No public access rate_limit_windows" ON rate_limit_windows FOR ALL USING (false);

-- ============================================================
-- 2. Admin audit logs
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  action         TEXT NOT NULL,
  target_table   TEXT,
  target_id      TEXT,
  before_state   JSONB,
  after_state    JSONB,
  ip_address     TEXT,
  user_agent     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_audit_logs_user_idx   ON admin_audit_logs (admin_user_id);
CREATE INDEX IF NOT EXISTS admin_audit_logs_target_idx ON admin_audit_logs (target_table, target_id);
CREATE INDEX IF NOT EXISTS admin_audit_logs_created_idx ON admin_audit_logs (created_at DESC);

ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin read audit logs" ON admin_audit_logs;
CREATE POLICY "Admin read audit logs" ON admin_audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
-- Insert handled by service role via DAL only

-- ============================================================
-- 3. Credit transactions (idempotency-keyed, append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('debit','credit','refund','adjustment')),
  amount           INTEGER NOT NULL,  -- positive = credit given, negative = credits consumed
  reason           TEXT NOT NULL,
  related_entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  related_run_id    UUID REFERENCES pipeline_runs(id) ON DELETE SET NULL,
  idempotency_key  TEXT UNIQUE NOT NULL,
  balance_after    INTEGER,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL
  -- No updated_at — transactions are immutable
);

CREATE INDEX IF NOT EXISTS credit_tx_user_idx  ON credit_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS credit_tx_idem_idx  ON credit_transactions (idempotency_key);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own transactions" ON credit_transactions;
CREATE POLICY "Users read own transactions" ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admin read all transactions" ON credit_transactions;
CREATE POLICY "Admin read all transactions" ON credit_transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
-- No public INSERT — handled by service role RPC only

-- Supabase RPC: atomic credit deduction with idempotency
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id         UUID,
  p_amount          INTEGER,
  p_reason          TEXT,
  p_idempotency_key TEXT,
  p_entity_id       UUID DEFAULT NULL,
  p_run_id          UUID DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, balance INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance INTEGER;
  new_balance     INTEGER;
BEGIN
  -- Idempotency: return existing result if key already used
  IF EXISTS (SELECT 1 FROM credit_transactions WHERE idempotency_key = p_idempotency_key) THEN
    SELECT p.credits INTO current_balance FROM profiles p WHERE p.id = p_user_id;
    RETURN QUERY SELECT true, current_balance, 'already_processed';
    RETURN;
  END IF;

  -- Lock user row to prevent concurrent deductions
  SELECT credits INTO current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF current_balance IS NULL THEN
    RETURN QUERY SELECT false, 0, 'user_not_found';
    RETURN;
  END IF;

  IF current_balance < p_amount THEN
    RETURN QUERY SELECT false, current_balance, 'insufficient_credits';
    RETURN;
  END IF;

  new_balance := current_balance - p_amount;

  UPDATE profiles SET credits = new_balance WHERE id = p_user_id;

  INSERT INTO credit_transactions (
    user_id, transaction_type, amount, reason,
    related_entity_id, related_run_id,
    idempotency_key, balance_after, created_by
  ) VALUES (
    p_user_id, 'debit', -p_amount, p_reason,
    p_entity_id, p_run_id,
    p_idempotency_key, new_balance, p_user_id
  );

  RETURN QUERY SELECT true, new_balance, 'ok';
END;
$$;

GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INTEGER, TEXT, TEXT, UUID, UUID) TO service_role;

-- ============================================================
-- 4. Evidence integrity: hash + deduplication columns
-- ============================================================
ALTER TABLE evidence_records
  ADD COLUMN IF NOT EXISTS evidence_hash          TEXT,
  ADD COLUMN IF NOT EXISTS normalized_source_url  TEXT,
  ADD COLUMN IF NOT EXISTS is_duplicate           BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS duplicate_of_id        UUID REFERENCES evidence_records(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invalidated_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invalidated_reason     TEXT,
  ADD COLUMN IF NOT EXISTS invalidated_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Unique hash per entity (prevents same evidence being stored twice for same employer)
CREATE UNIQUE INDEX IF NOT EXISTS evidence_hash_entity_idx
  ON evidence_records (entity_id, evidence_hash)
  WHERE evidence_hash IS NOT NULL AND is_duplicate = false;

-- ============================================================
-- 5. Add credits column to profiles if missing
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 3;

-- ============================================================
-- 6. Source submission table (user-submitted tips)
-- ============================================================
CREATE TABLE IF NOT EXISTS source_submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_id     UUID REFERENCES entities(id) ON DELETE SET NULL,
  url           TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','already_collected')),
  reviewed_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE source_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users insert own submissions" ON source_submissions;
CREATE POLICY "Users insert own submissions" ON source_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users read own submissions" ON source_submissions;
CREATE POLICY "Users read own submissions" ON source_submissions FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admin full access submissions" ON source_submissions;
CREATE POLICY "Admin full access submissions" ON source_submissions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
