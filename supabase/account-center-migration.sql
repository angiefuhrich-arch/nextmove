-- Account Center: extend profiles with user-editable fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT '{
    "weekly_digest": true,
    "watchlist_alerts": true,
    "report_refresh": true,
    "credit_warnings": true,
    "product_announcements": false
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{
    "default_market": "HK",
    "email_frequency": "weekly"
  }'::jsonb;

-- RLS: users can update their own profile fields
CREATE POLICY IF NOT EXISTS "users_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
