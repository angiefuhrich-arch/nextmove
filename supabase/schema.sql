-- Scarsian Career Intelligence — Database Schema
-- Run this in your Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  industry TEXT,
  size TEXT,
  headquarters TEXT,
  founded INTEGER,
  website TEXT,
  description TEXT,
  -- Scarsian Index
  scarsian_index INTEGER DEFAULT 0,
  confidence_score INTEGER DEFAULT 0,
  verdict TEXT CHECK (verdict IN ('strong', 'think', 'nogo')) DEFAULT 'think',
  analyst_note TEXT,
  gfi_score INTEGER DEFAULT 0,
  -- Scarsian dimensions
  ladder_speed INTEGER DEFAULT 50,
  skill_depreciation_risk INTEGER DEFAULT 50,
  network_multiplier INTEGER DEFAULT 50,
  layoff_convexity INTEGER DEFAULT 50,
  reputation_stain_risk INTEGER DEFAULT 50,
  financial_runway INTEGER DEFAULT 50,
  badge_premium INTEGER DEFAULT 50,
  talent_magnetism INTEGER DEFAULT 50,
  sector_optionality INTEGER DEFAULT 50,
  cultural_velocity_match INTEGER DEFAULT 50,
  global_mobility_index INTEGER DEFAULT 50,
  -- GFI dimensions
  english_working_language INTEGER DEFAULT 50,
  visa_sponsorship_history INTEGER DEFAULT 50,
  international_leadership_ratio INTEGER DEFAULT 50,
  expat_retention_rate INTEGER DEFAULT 50,
  cantonese_requirement_level INTEGER DEFAULT 1,
  regional_office_culture INTEGER DEFAULT 50,
  edit_history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company reports
CREATE TABLE IF NOT EXISTS company_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  company_slug TEXT NOT NULL,
  overall_score INTEGER NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('strong', 'caution', 'no-go')),
  ai_summary TEXT,
  best_reasons JSONB DEFAULT '[]',
  biggest_risks JSONB DEFAULT '[]',
  good_for JSONB DEFAULT '[]',
  avoid_if JSONB DEFAULT '[]',
  confidence_score INTEGER,
  categories JSONB DEFAULT '[]',
  last_updated DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data sources
CREATE TABLE IF NOT EXISTS data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  source_type TEXT CHECK (source_type IN ('glassdoor','linkedin','indeed','reddit','blind','news','manual','scraped','hkex','annual_report')),
  source_url TEXT,
  source_title TEXT,
  data_points INTEGER DEFAULT 0,
  freshness_days INTEGER DEFAULT 0,
  reliability_score INTEGER DEFAULT 50,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved companies (watchlist)
CREATE TABLE IF NOT EXISTS saved_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_slug TEXT NOT NULL,
  company_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_slug)
);

-- Report usage
CREATE TABLE IF NOT EXISTS report_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_slug TEXT NOT NULL,
  month TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'premium')),
  status TEXT NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offer analyses
CREATE TABLE IF NOT EXISTS offer_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  salary_offered INTEGER,
  current_salary INTEGER,
  recommendation TEXT CHECK (recommendation IN ('accept', 'negotiate', 'decline')),
  analysis_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_analyses ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Public read companies" ON companies;
DROP POLICY IF EXISTS "Public read reports" ON company_reports;
DROP POLICY IF EXISTS "Users can manage own saved companies" ON saved_companies;
DROP POLICY IF EXISTS "Users can view own usage" ON report_usage;
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can view own analyses" ON offer_analyses;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can write companies" ON companies;

-- Policies
CREATE POLICY "Public read companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Public read reports" ON company_reports FOR SELECT USING (true);
CREATE POLICY "Users can manage own saved companies" ON saved_companies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own usage" ON report_usage FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own analyses" ON offer_analyses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own profile" ON profiles FOR ALL USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
