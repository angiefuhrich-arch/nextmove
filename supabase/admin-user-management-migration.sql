-- Admin User Management: extend schema for user management & credit control

-- profiles: suspension
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- credit_transactions: Stripe payment reference + arbitrary metadata
ALTER TABLE credit_transactions
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- RPC: admin_adjust_credits
-- Atomically adjusts a user's credit balance, records the transaction,
-- and returns the new balance. Requires the caller to be an admin.
CREATE OR REPLACE FUNCTION admin_adjust_credits(
  p_admin_id       UUID,
  p_user_id        UUID,
  p_amount         INTEGER,      -- signed: positive = add, negative = subtract
  p_transaction_type TEXT,       -- 'credit' | 'debit' | 'refund' | 'adjustment'
  p_reason         TEXT,
  p_idempotency_key TEXT
) RETURNS TABLE(success BOOLEAN, balance INTEGER, message TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current INTEGER;
  v_new     INTEGER;
BEGIN
  -- Guard: caller must be admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = p_admin_id AND is_admin = true
  ) THEN
    RETURN QUERY SELECT false, 0, 'Not authorized'::TEXT;
    RETURN;
  END IF;

  -- Lock the user row
  SELECT credits INTO v_current FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'User not found'::TEXT;
    RETURN;
  END IF;

  v_new := v_current + p_amount;
  IF v_new < 0 THEN
    RETURN QUERY SELECT false, v_current, 'Insufficient credits'::TEXT;
    RETURN;
  END IF;

  -- Update balance
  UPDATE profiles SET credits = v_new WHERE id = p_user_id;

  -- Record transaction (idempotent — ON CONFLICT does nothing)
  INSERT INTO credit_transactions (
    id, user_id, transaction_type, amount, reason,
    balance_after, idempotency_key, created_by, created_at
  ) VALUES (
    gen_random_uuid(), p_user_id, p_transaction_type,
    p_amount, p_reason, v_new, p_idempotency_key, p_admin_id, NOW()
  ) ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN QUERY SELECT true, v_new, 'OK'::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_adjust_credits TO service_role;
