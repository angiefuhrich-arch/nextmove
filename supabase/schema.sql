-- Next Move Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
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

-- Saved companies (watchlist)
CREATE TABLE IF NOT EXISTS saved_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_slug TEXT NOT NULL,
  company_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_slug)
);

-- Report usage tracking
CREATE TABLE IF NOT EXISTS report_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_slug TEXT NOT NULL,
  month TEXT NOT NULL, -- format: YYYY-MM
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

-- RLS Policies
ALTER TABLE saved_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved companies"
  ON saved_companies FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage"
  ON report_usage FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analyses"
  ON offer_analyses FOR ALL USING (auth.uid() = user_id);

-- Public read on companies and reports
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Public read reports" ON company_reports FOR SELECT USING (true);
