-- Admin Team & Role Migration
-- Adds role column to profiles, creates admin_team_members table,
-- and sets the founder account as owner/admin.

-- ── 1. Role enum ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM (
    'owner', 'admin', 'analyst', 'support', 'finance', 'viewer'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. Add role column to profiles ───────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user','owner','admin','analyst','support','finance','viewer'));

-- ── 3. Set founder as owner + admin ──────────────────────────────────────────
-- Uses email lookup through auth.users to be safe across environments.
UPDATE profiles
SET
  role     = 'owner',
  is_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'angiefuhrich@gmail.com' LIMIT 1
);

-- ── 4. Admin team members table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_team_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invited_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email         TEXT NOT NULL,
  name          TEXT,
  role          TEXT NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('owner','admin','analyst','support','finance','viewer')),
  status        TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','suspended')),
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invited_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at   TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  notes         TEXT,
  UNIQUE (email)
);

-- Index for lookups by user
CREATE INDEX IF NOT EXISTS idx_admin_team_user_id ON admin_team_members(user_id);

-- ── 5. Seed the founder as an active owner team member ───────────────────────
INSERT INTO admin_team_members (email, name, role, status, accepted_at, user_id)
SELECT
  u.email,
  'Angie Fuhrich',
  'owner',
  'active',
  now(),
  u.id
FROM auth.users u
WHERE u.email = 'angiefuhrich@gmail.com'
ON CONFLICT (email) DO UPDATE
  SET role = 'owner', status = 'active', user_id = EXCLUDED.user_id;

-- ── 6. RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE admin_team_members ENABLE ROW LEVEL SECURITY;

-- Only admins can read team members
DROP POLICY IF EXISTS admin_team_read ON admin_team_members;
CREATE POLICY admin_team_read ON admin_team_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only owners can insert/update/delete
DROP POLICY IF EXISTS admin_team_write ON admin_team_members;
CREATE POLICY admin_team_write ON admin_team_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ── 7. Helper: is_owner() ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_owner()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'
  );
$$;

COMMENT ON TABLE admin_team_members IS
  'Admin team with role-based access. Owner-only mutations. All admins can read.';
