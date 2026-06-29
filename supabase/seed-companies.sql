-- ============================================================
-- Scarsian Seed: 6 Test Companies
-- Run this in the Supabase SQL editor (as service role / superuser)
-- All scores calculated using the v1.0.0 formula weights exactly.
-- ============================================================

DO $$
DECLARE
  fv_id       UUID;
  e_google    UUID;
  e_openai    UUID;
  e_deloitte  UUID;
  e_hsbc      UUID;
  e_cathay    UUID;
  e_tencent   UUID;
  snap_id     UUID;
BEGIN

  -- ── 0. Get active formula version ────────────────────────────────────────
  SELECT id INTO fv_id FROM formula_versions WHERE is_active = true LIMIT 1;
  IF fv_id IS NULL THEN
    RAISE EXCEPTION 'No active formula_version found — run migrations first';
  END IF;

  -- ────────────────────────────────────────────────────────────────────────
  -- Helper: upsert entity, return id
  -- Handles both phase1 schema (has entity_type) and phase-ab schema (slug-only).
  -- We try the full upsert first, fall back to slug-only if entity_type column absent.
  -- ────────────────────────────────────────────────────────────────────────

  -- ── 1. GOOGLE ─────────────────────────────────────────────────────────────
  INSERT INTO entities (entity_type, name, slug, market, metadata, is_active)
  VALUES (
    'company', 'Google', 'google', 'US',
    '{"industry":"Technology","country":"United States","website":"https://careers.google.com","description":"Alphabet subsidiary operating search, cloud, advertising, and hardware divisions globally.","founded":1998}',
    true
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO e_google FROM entities WHERE slug = 'google' LIMIT 1;
  IF e_google IS NULL THEN RAISE EXCEPTION 'Could not find/create entity: google'; END IF;

  -- Signals
  DELETE FROM signals WHERE entity_id = e_google;
  INSERT INTO signals (entity_id, signal_name, signal_category, score, confidence, reasoning, review_status) VALUES
    (e_google, 'promotion_velocity',        'cgs',        72, 75, 'Seed data — Google', 'accepted'),
    (e_google, 'skill_transferability',     'cgs',        85, 75, 'Seed data — Google', 'accepted'),
    (e_google, 'network_multiplier',        'cgs',        90, 75, 'Seed data — Google', 'accepted'),
    (e_google, 'layoff_resilience',         'crs',        62, 75, 'Seed data — Google', 'accepted'),
    (e_google, 'reputation_safety',         'crs',        70, 75, 'Seed data — Google', 'accepted'),
    (e_google, 'financial_stability',       'crs',        95, 75, 'Seed data — Google', 'accepted'),
    (e_google, 'badge_premium',             'mvs',        95, 75, 'Seed data — Google', 'accepted'),
    (e_google, 'talent_magnetism',          'mvs',        92, 75, 'Seed data — Google', 'accepted'),
    (e_google, 'sector_optionality',        'mvs',        88, 75, 'Seed data — Google', 'accepted'),
    (e_google, 'culture_alignment',         'cfs',        72, 75, 'Seed data — Google', 'accepted'),
    (e_google, 'communication_accessibility','gfi',       90, 75, 'Seed data — Google', 'accepted'),
    (e_google, 'visa_accessibility',        'gfi',        82, 75, 'Seed data — Google', 'accepted'),
    (e_google, 'international_leadership',  'gfi',        78, 75, 'Seed data — Google', 'accepted'),
    (e_google, 'expat_retention',           'gfi',        74, 75, 'Seed data — Google', 'accepted'),
    (e_google, 'language_accessibility',    'gfi',        85, 75, 'Seed data — Google', 'accepted'),
    (e_google, 'regional_autonomy',         'gfi',        68, 75, 'Seed data — Google', 'accepted'),
    (e_google, 'momentum_score',            'adjustment', 58, 75, 'Seed data — Google', 'accepted'),
    (e_google, 'volatility_score',          'adjustment', 25, 75, 'Seed data — Google', 'accepted');

  -- Supersede old snapshots
  UPDATE scarsian_snapshots SET status = 'superseded' WHERE entity_id = e_google AND status = 'approved';

  -- Scores (pre-calculated):
  --   CGS = 72*0.35 + 85*0.35 + 90*0.30 = 81.95 → 82
  --   CRS = 62*0.35 + 70*0.30 + 95*0.35 = 75.95 → 76
  --   MVS = 95*0.45 + 92*0.30 + 88*0.25 = 92.35 → 92
  --   CFS = 72
  --   GFI = 90*0.25+82*0.20+78*0.15+74*0.15+85*0.15+68*0.10 = 81.25 → 81
  --   base = 81.95*0.30 + 75.95*0.25 + 92.35*0.15 + 72*0.20 + 81.25*0.10 = 79.95
  --   momentum_adj = (58-50)/10 = 0.8
  --   volatility_penalty = -(25/10) = -2.5
  --   scarsian = round(79.95 + 0.8 - 2.5) = 78  verdict: strong  confidence: 76
  INSERT INTO scarsian_snapshots (
    entity_id, formula_version_id,
    cgs_score, crs_score, mvs_score, cfs_score, gfi_score,
    base_score, momentum_adjustment, volatility_penalty,
    scarsian_score, career_alpha, confidence_score,
    insufficient_data, verdict, engine_output_ids, signal_ids,
    calculation_timestamp, status, approved_at,
    analyst_note
  ) VALUES (
    e_google, fv_id,
    82, 76, 92, 72, 81,
    79.95, 0.8, -2.5,
    78, 28, 76,
    false, 'strong', '{}',
    (SELECT array_agg(id) FROM signals WHERE entity_id = e_google),
    now(), 'approved', now(),
    'Strong badge premium and skills transfer. Recent layoffs (2023–2024) weigh on resilience score. GFI is high due to broad international footprint and English-first environment.'
  ) RETURNING id INTO snap_id;

  INSERT INTO intelligence_trend_points (entity_id, snapshot_id, scarsian_score, confidence_score, cgs_score, crs_score, mvs_score, cfs_score, gfi_score, trigger)
  VALUES (e_google, snap_id, 78, 76, 82, 76, 92, 72, 81, 'initial');

  -- ── 2. OPENAI ─────────────────────────────────────────────────────────────
  INSERT INTO entities (entity_type, name, slug, market, metadata, is_active)
  VALUES (
    'company', 'OpenAI', 'openai', 'US',
    '{"industry":"Artificial Intelligence","country":"United States","website":"https://openai.com/careers","description":"AI research and deployment company responsible for ChatGPT, GPT-4, and related models.","founded":2015}',
    true
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO e_openai FROM entities WHERE slug = 'openai' LIMIT 1;

  DELETE FROM signals WHERE entity_id = e_openai;
  INSERT INTO signals (entity_id, signal_name, signal_category, score, confidence, reasoning, review_status) VALUES
    (e_openai, 'promotion_velocity',         'cgs',        78, 65, 'Seed data — OpenAI', 'accepted'),
    (e_openai, 'skill_transferability',      'cgs',        88, 65, 'Seed data — OpenAI', 'accepted'),
    (e_openai, 'network_multiplier',         'cgs',        82, 65, 'Seed data — OpenAI', 'accepted'),
    (e_openai, 'layoff_resilience',          'crs',        55, 65, 'Seed data — OpenAI', 'accepted'),
    (e_openai, 'reputation_safety',          'crs',        62, 65, 'Seed data — OpenAI', 'accepted'),
    (e_openai, 'financial_stability',        'crs',        68, 65, 'Seed data — OpenAI', 'accepted'),
    (e_openai, 'badge_premium',              'mvs',        92, 65, 'Seed data — OpenAI', 'accepted'),
    (e_openai, 'talent_magnetism',           'mvs',        88, 65, 'Seed data — OpenAI', 'accepted'),
    (e_openai, 'sector_optionality',         'mvs',        82, 65, 'Seed data — OpenAI', 'accepted'),
    (e_openai, 'culture_alignment',          'cfs',        68, 65, 'Seed data — OpenAI', 'accepted'),
    (e_openai, 'communication_accessibility','gfi',        88, 65, 'Seed data — OpenAI', 'accepted'),
    (e_openai, 'visa_accessibility',         'gfi',        78, 65, 'Seed data — OpenAI', 'accepted'),
    (e_openai, 'international_leadership',   'gfi',        72, 65, 'Seed data — OpenAI', 'accepted'),
    (e_openai, 'expat_retention',            'gfi',        68, 65, 'Seed data — OpenAI', 'accepted'),
    (e_openai, 'language_accessibility',     'gfi',        82, 65, 'Seed data — OpenAI', 'accepted'),
    (e_openai, 'regional_autonomy',          'gfi',        55, 65, 'Seed data — OpenAI', 'accepted'),
    (e_openai, 'momentum_score',             'adjustment', 72, 65, 'Seed data — OpenAI', 'accepted'),
    (e_openai, 'volatility_score',           'adjustment', 40, 65, 'Seed data — OpenAI', 'accepted');

  UPDATE scarsian_snapshots SET status = 'superseded' WHERE entity_id = e_openai AND status = 'approved';

  -- CGS=83 CRS=62 MVS=88 CFS=68 GFI=76 base=74.7 mom=+2.2 vol=-4.0 → 73 strong confidence=67
  INSERT INTO scarsian_snapshots (
    entity_id, formula_version_id,
    cgs_score, crs_score, mvs_score, cfs_score, gfi_score,
    base_score, momentum_adjustment, volatility_penalty,
    scarsian_score, career_alpha, confidence_score,
    insufficient_data, verdict, engine_output_ids, signal_ids,
    calculation_timestamp, status, approved_at, analyst_note
  ) VALUES (
    e_openai, fv_id,
    83, 62, 88, 68, 76,
    74.7, 2.2, -4.0,
    73, 23, 67,
    false, 'strong', '{}',
    (SELECT array_agg(id) FROM signals WHERE entity_id = e_openai),
    now(), 'approved', now(),
    'Exceptional badge premium for AI roles. High momentum offset by elevated volatility from structural uncertainty around revenue model and governance. Financial stability reflects continued dependence on external capital.'
  ) RETURNING id INTO snap_id;

  INSERT INTO intelligence_trend_points (entity_id, snapshot_id, scarsian_score, confidence_score, cgs_score, crs_score, mvs_score, cfs_score, gfi_score, trigger)
  VALUES (e_openai, snap_id, 73, 67, 83, 62, 88, 68, 76, 'initial');

  -- ── 3. DELOITTE ───────────────────────────────────────────────────────────
  INSERT INTO entities (entity_type, name, slug, market, metadata, is_active)
  VALUES (
    'company', 'Deloitte', 'deloitte', 'GB',
    '{"industry":"Professional Services","country":"United Kingdom","website":"https://www2.deloitte.com/careers","description":"Big Four professional services network providing audit, consulting, financial advisory, and tax services worldwide.","founded":1845}',
    true
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO e_deloitte FROM entities WHERE slug = 'deloitte' LIMIT 1;

  DELETE FROM signals WHERE entity_id = e_deloitte;
  INSERT INTO signals (entity_id, signal_name, signal_category, score, confidence, reasoning, review_status) VALUES
    (e_deloitte, 'promotion_velocity',         'cgs',        65, 80, 'Seed data — Deloitte', 'accepted'),
    (e_deloitte, 'skill_transferability',      'cgs',        78, 80, 'Seed data — Deloitte', 'accepted'),
    (e_deloitte, 'network_multiplier',         'cgs',        82, 80, 'Seed data — Deloitte', 'accepted'),
    (e_deloitte, 'layoff_resilience',          'crs',        75, 80, 'Seed data — Deloitte', 'accepted'),
    (e_deloitte, 'reputation_safety',          'crs',        80, 80, 'Seed data — Deloitte', 'accepted'),
    (e_deloitte, 'financial_stability',        'crs',        85, 80, 'Seed data — Deloitte', 'accepted'),
    (e_deloitte, 'badge_premium',              'mvs',        80, 80, 'Seed data — Deloitte', 'accepted'),
    (e_deloitte, 'talent_magnetism',           'mvs',        72, 80, 'Seed data — Deloitte', 'accepted'),
    (e_deloitte, 'sector_optionality',         'mvs',        82, 80, 'Seed data — Deloitte', 'accepted'),
    (e_deloitte, 'culture_alignment',          'cfs',        60, 80, 'Seed data — Deloitte', 'accepted'),
    (e_deloitte, 'communication_accessibility','gfi',        85, 80, 'Seed data — Deloitte', 'accepted'),
    (e_deloitte, 'visa_accessibility',         'gfi',        78, 80, 'Seed data — Deloitte', 'accepted'),
    (e_deloitte, 'international_leadership',   'gfi',        85, 80, 'Seed data — Deloitte', 'accepted'),
    (e_deloitte, 'expat_retention',            'gfi',        72, 80, 'Seed data — Deloitte', 'accepted'),
    (e_deloitte, 'language_accessibility',     'gfi',        82, 80, 'Seed data — Deloitte', 'accepted'),
    (e_deloitte, 'regional_autonomy',          'gfi',        65, 80, 'Seed data — Deloitte', 'accepted'),
    (e_deloitte, 'momentum_score',             'adjustment', 52, 80, 'Seed data — Deloitte', 'accepted'),
    (e_deloitte, 'volatility_score',           'adjustment', 12, 80, 'Seed data — Deloitte', 'accepted');

  UPDATE scarsian_snapshots SET status = 'superseded' WHERE entity_id = e_deloitte AND status = 'approved';

  -- CGS=75 CRS=80 MVS=78 CFS=60 GFI=79 base=74.0 mom=+0.2 vol=-1.2 → 73 strong confidence=79
  INSERT INTO scarsian_snapshots (
    entity_id, formula_version_id,
    cgs_score, crs_score, mvs_score, cfs_score, gfi_score,
    base_score, momentum_adjustment, volatility_penalty,
    scarsian_score, career_alpha, confidence_score,
    insufficient_data, verdict, engine_output_ids, signal_ids,
    calculation_timestamp, status, approved_at, analyst_note
  ) VALUES (
    e_deloitte, fv_id,
    75, 80, 78, 60, 79,
    74.0, 0.2, -1.2,
    73, 23, 79,
    false, 'strong', '{}',
    (SELECT array_agg(id) FROM signals WHERE entity_id = e_deloitte),
    now(), 'approved', now(),
    'Stable career risk profile with strong sector optionality post-exit. Culture alignment is moderate — up-or-out dynamic reduces fit scores for non-partner-track candidates. Global mobility is a key strength.'
  ) RETURNING id INTO snap_id;

  INSERT INTO intelligence_trend_points (entity_id, snapshot_id, scarsian_score, confidence_score, cgs_score, crs_score, mvs_score, cfs_score, gfi_score, trigger)
  VALUES (e_deloitte, snap_id, 73, 79, 75, 80, 78, 60, 79, 'initial');

  -- ── 4. HSBC HONG KONG ─────────────────────────────────────────────────────
  INSERT INTO entities (entity_type, name, slug, market, metadata, is_active)
  VALUES (
    'company', 'HSBC Hong Kong', 'hsbc-hong-kong', 'HK',
    '{"industry":"Banking & Financial Services","country":"Hong Kong","website":"https://www.hsbc.com.hk/careers","description":"Regional headquarters for HSBC Group in Asia, focusing on retail, commercial, and investment banking across the Asia-Pacific region.","founded":1865}',
    true
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO e_hsbc FROM entities WHERE slug = 'hsbc-hong-kong' LIMIT 1;

  DELETE FROM signals WHERE entity_id = e_hsbc;
  INSERT INTO signals (entity_id, signal_name, signal_category, score, confidence, reasoning, review_status) VALUES
    (e_hsbc, 'promotion_velocity',         'cgs',        48, 72, 'Seed data — HSBC Hong Kong', 'accepted'),
    (e_hsbc, 'skill_transferability',      'cgs',        62, 72, 'Seed data — HSBC Hong Kong', 'accepted'),
    (e_hsbc, 'network_multiplier',         'cgs',        70, 72, 'Seed data — HSBC Hong Kong', 'accepted'),
    (e_hsbc, 'layoff_resilience',          'crs',        68, 72, 'Seed data — HSBC Hong Kong', 'accepted'),
    (e_hsbc, 'reputation_safety',          'crs',        72, 72, 'Seed data — HSBC Hong Kong', 'accepted'),
    (e_hsbc, 'financial_stability',        'crs',        85, 72, 'Seed data — HSBC Hong Kong', 'accepted'),
    (e_hsbc, 'badge_premium',              'mvs',        75, 72, 'Seed data — HSBC Hong Kong', 'accepted'),
    (e_hsbc, 'talent_magnetism',           'mvs',        62, 72, 'Seed data — HSBC Hong Kong', 'accepted'),
    (e_hsbc, 'sector_optionality',         'mvs',        58, 72, 'Seed data — HSBC Hong Kong', 'accepted'),
    (e_hsbc, 'culture_alignment',          'cfs',        52, 72, 'Seed data — HSBC Hong Kong', 'accepted'),
    (e_hsbc, 'communication_accessibility','gfi',        78, 72, 'Seed data — HSBC Hong Kong', 'accepted'),
    (e_hsbc, 'visa_accessibility',         'gfi',        72, 72, 'Seed data — HSBC Hong Kong', 'accepted'),
    (e_hsbc, 'international_leadership',   'gfi',        80, 72, 'Seed data — HSBC Hong Kong', 'accepted'),
    (e_hsbc, 'expat_retention',            'gfi',        68, 72, 'Seed data — HSBC Hong Kong', 'accepted'),
    (e_hsbc, 'language_accessibility',     'gfi',        70, 72, 'Seed data — HSBC Hong Kong', 'accepted'),
    (e_hsbc, 'regional_autonomy',          'gfi',        60, 72, 'Seed data — HSBC Hong Kong', 'accepted'),
    (e_hsbc, 'momentum_score',             'adjustment', 46, 72, 'Seed data — HSBC Hong Kong', 'accepted'),
    (e_hsbc, 'volatility_score',           'adjustment', 18, 72, 'Seed data — HSBC Hong Kong', 'accepted');

  UPDATE scarsian_snapshots SET status = 'superseded' WHERE entity_id = e_hsbc AND status = 'approved';

  -- CGS=60 CRS=75 MVS=67 CFS=52 GFI=73 base=64.3 mom=-0.4 vol=-1.8 → 62 caution confidence=71
  INSERT INTO scarsian_snapshots (
    entity_id, formula_version_id,
    cgs_score, crs_score, mvs_score, cfs_score, gfi_score,
    base_score, momentum_adjustment, volatility_penalty,
    scarsian_score, career_alpha, confidence_score,
    insufficient_data, verdict, engine_output_ids, signal_ids,
    calculation_timestamp, status, approved_at, analyst_note
  ) VALUES (
    e_hsbc, fv_id,
    60, 75, 67, 52, 73,
    64.3, -0.4, -1.8,
    62, 12, 71,
    false, 'caution', '{}',
    (SELECT array_agg(id) FROM signals WHERE entity_id = e_hsbc),
    now(), 'approved', now(),
    'Strong financial stability and respectable international leadership. Promotion velocity is slow by industry standards. Skill transferability is moderate — banking-specific skills limit optionality outside the sector. HK regulatory environment introduces some confidence discount.'
  ) RETURNING id INTO snap_id;

  INSERT INTO intelligence_trend_points (entity_id, snapshot_id, scarsian_score, confidence_score, cgs_score, crs_score, mvs_score, cfs_score, gfi_score, trigger)
  VALUES (e_hsbc, snap_id, 62, 71, 60, 75, 67, 52, 73, 'initial');

  -- ── 5. CATHAY PACIFIC ─────────────────────────────────────────────────────
  INSERT INTO entities (entity_type, name, slug, market, metadata, is_active)
  VALUES (
    'company', 'Cathay Pacific', 'cathay-pacific', 'HK',
    '{"industry":"Aviation","country":"Hong Kong","website":"https://www.cathaypacific.com/careers","description":"Hong Kong''s flag carrier airline, operating passenger and cargo services across a global network of over 100 destinations.","founded":1946}',
    true
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO e_cathay FROM entities WHERE slug = 'cathay-pacific' LIMIT 1;

  DELETE FROM signals WHERE entity_id = e_cathay;
  INSERT INTO signals (entity_id, signal_name, signal_category, score, confidence, reasoning, review_status) VALUES
    (e_cathay, 'promotion_velocity',         'cgs',        52, 62, 'Seed data — Cathay Pacific', 'accepted'),
    (e_cathay, 'skill_transferability',      'cgs',        55, 62, 'Seed data — Cathay Pacific', 'accepted'),
    (e_cathay, 'network_multiplier',         'cgs',        62, 62, 'Seed data — Cathay Pacific', 'accepted'),
    (e_cathay, 'layoff_resilience',          'crs',        48, 62, 'Seed data — Cathay Pacific', 'accepted'),
    (e_cathay, 'reputation_safety',          'crs',        65, 62, 'Seed data — Cathay Pacific', 'accepted'),
    (e_cathay, 'financial_stability',        'crs',        58, 62, 'Seed data — Cathay Pacific', 'accepted'),
    (e_cathay, 'badge_premium',              'mvs',        65, 62, 'Seed data — Cathay Pacific', 'accepted'),
    (e_cathay, 'talent_magnetism',           'mvs',        55, 62, 'Seed data — Cathay Pacific', 'accepted'),
    (e_cathay, 'sector_optionality',         'mvs',        45, 62, 'Seed data — Cathay Pacific', 'accepted'),
    (e_cathay, 'culture_alignment',          'cfs',        58, 62, 'Seed data — Cathay Pacific', 'accepted'),
    (e_cathay, 'communication_accessibility','gfi',        75, 62, 'Seed data — Cathay Pacific', 'accepted'),
    (e_cathay, 'visa_accessibility',         'gfi',        68, 62, 'Seed data — Cathay Pacific', 'accepted'),
    (e_cathay, 'international_leadership',   'gfi',        70, 62, 'Seed data — Cathay Pacific', 'accepted'),
    (e_cathay, 'expat_retention',            'gfi',        60, 62, 'Seed data — Cathay Pacific', 'accepted'),
    (e_cathay, 'language_accessibility',     'gfi',        72, 62, 'Seed data — Cathay Pacific', 'accepted'),
    (e_cathay, 'regional_autonomy',          'gfi',        55, 62, 'Seed data — Cathay Pacific', 'accepted'),
    (e_cathay, 'momentum_score',             'adjustment', 48, 62, 'Seed data — Cathay Pacific', 'accepted'),
    (e_cathay, 'volatility_score',           'adjustment', 30, 62, 'Seed data — Cathay Pacific', 'accepted');

  UPDATE scarsian_snapshots SET status = 'superseded' WHERE entity_id = e_cathay AND status = 'approved';

  -- CGS=56 CRS=57 MVS=57 CFS=58 GFI=68 base=57.9 mom=-0.2 vol=-3.0 → 55 caution confidence=63
  INSERT INTO scarsian_snapshots (
    entity_id, formula_version_id,
    cgs_score, crs_score, mvs_score, cfs_score, gfi_score,
    base_score, momentum_adjustment, volatility_penalty,
    scarsian_score, career_alpha, confidence_score,
    insufficient_data, verdict, engine_output_ids, signal_ids,
    calculation_timestamp, status, approved_at, analyst_note
  ) VALUES (
    e_cathay, fv_id,
    56, 57, 57, 58, 68,
    57.9, -0.2, -3.0,
    55, 5, 63,
    false, 'caution', '{}',
    (SELECT array_agg(id) FROM signals WHERE entity_id = e_cathay),
    now(), 'approved', now(),
    'Aviation remains structurally challenged post-pandemic. Skill transferability is below average — aviation-specific roles limit exit optionality. GFI benefits from the international nature of operations but regional autonomy is constrained.'
  ) RETURNING id INTO snap_id;

  INSERT INTO intelligence_trend_points (entity_id, snapshot_id, scarsian_score, confidence_score, cgs_score, crs_score, mvs_score, cfs_score, gfi_score, trigger)
  VALUES (e_cathay, snap_id, 55, 63, 56, 57, 57, 58, 68, 'initial');

  -- ── 6. TENCENT ────────────────────────────────────────────────────────────
  INSERT INTO entities (entity_type, name, slug, market, metadata, is_active)
  VALUES (
    'company', 'Tencent', 'tencent', 'CN',
    '{"industry":"Technology","country":"China","website":"https://careers.tencent.com","description":"Chinese multinational conglomerate operating WeChat, QQ, gaming, cloud, and fintech platforms across China and internationally.","founded":1998}',
    true
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO e_tencent FROM entities WHERE slug = 'tencent' LIMIT 1;

  DELETE FROM signals WHERE entity_id = e_tencent;
  INSERT INTO signals (entity_id, signal_name, signal_category, score, confidence, reasoning, review_status) VALUES
    (e_tencent, 'promotion_velocity',         'cgs',        68, 60, 'Seed data — Tencent', 'accepted'),
    (e_tencent, 'skill_transferability',      'cgs',        72, 60, 'Seed data — Tencent', 'accepted'),
    (e_tencent, 'network_multiplier',         'cgs',        78, 60, 'Seed data — Tencent', 'accepted'),
    (e_tencent, 'layoff_resilience',          'crs',        55, 60, 'Seed data — Tencent', 'accepted'),
    (e_tencent, 'reputation_safety',          'crs',        55, 60, 'Seed data — Tencent', 'accepted'),
    (e_tencent, 'financial_stability',        'crs',        82, 60, 'Seed data — Tencent', 'accepted'),
    (e_tencent, 'badge_premium',              'mvs',        72, 60, 'Seed data — Tencent', 'accepted'),
    (e_tencent, 'talent_magnetism',           'mvs',        75, 60, 'Seed data — Tencent', 'accepted'),
    (e_tencent, 'sector_optionality',         'mvs',        68, 60, 'Seed data — Tencent', 'accepted'),
    (e_tencent, 'culture_alignment',          'cfs',        55, 60, 'Seed data — Tencent', 'accepted'),
    (e_tencent, 'communication_accessibility','gfi',        62, 60, 'Seed data — Tencent', 'accepted'),
    (e_tencent, 'visa_accessibility',         'gfi',        55, 60, 'Seed data — Tencent', 'accepted'),
    (e_tencent, 'international_leadership',   'gfi',        65, 60, 'Seed data — Tencent', 'accepted'),
    (e_tencent, 'expat_retention',            'gfi',        55, 60, 'Seed data — Tencent', 'accepted'),
    (e_tencent, 'language_accessibility',     'gfi',        60, 60, 'Seed data — Tencent', 'accepted'),
    (e_tencent, 'regional_autonomy',          'gfi',        62, 60, 'Seed data — Tencent', 'accepted'),
    (e_tencent, 'momentum_score',             'adjustment', 50, 60, 'Seed data — Tencent', 'accepted'),
    (e_tencent, 'volatility_score',           'adjustment', 35, 60, 'Seed data — Tencent', 'accepted');

  UPDATE scarsian_snapshots SET status = 'superseded' WHERE entity_id = e_tencent AND status = 'approved';

  -- CGS=72 CRS=64 MVS=72 CFS=55 GFI=60 base=65.6 mom=0 vol=-3.5 → 62 caution confidence=61
  INSERT INTO scarsian_snapshots (
    entity_id, formula_version_id,
    cgs_score, crs_score, mvs_score, cfs_score, gfi_score,
    base_score, momentum_adjustment, volatility_penalty,
    scarsian_score, career_alpha, confidence_score,
    insufficient_data, verdict, engine_output_ids, signal_ids,
    calculation_timestamp, status, approved_at, analyst_note
  ) VALUES (
    e_tencent, fv_id,
    72, 64, 72, 55, 60,
    65.6, 0.0, -3.5,
    62, 12, 61,
    false, 'caution', '{}',
    (SELECT array_agg(id) FROM signals WHERE entity_id = e_tencent),
    now(), 'approved', now(),
    'Strong financial position and domestic brand equity. GFI scores are suppressed by language accessibility and regulatory opacity for international hires. Reputation safety affected by ongoing geopolitical headwinds.'
  ) RETURNING id INTO snap_id;

  INSERT INTO intelligence_trend_points (entity_id, snapshot_id, scarsian_score, confidence_score, cgs_score, crs_score, mvs_score, cfs_score, gfi_score, trigger)
  VALUES (e_tencent, snap_id, 62, 61, 72, 64, 72, 55, 60, 'initial');

  -- ── 7. Entity aliases for search ───────────────────────────────────────────
  INSERT INTO entity_aliases (entity_id, alias) VALUES
    (e_google,   'Alphabet'),
    (e_google,   'Google LLC'),
    (e_openai,   'Open AI'),
    (e_openai,   'ChatGPT company'),
    (e_deloitte, 'Deloitte Touche Tohmatsu'),
    (e_deloitte, 'Deloitte & Touche'),
    (e_hsbc,     'HSBC'),
    (e_hsbc,     'Hongkong and Shanghai Banking Corporation'),
    (e_cathay,   'Cathay'),
    (e_cathay,   'CX'),
    (e_tencent,  '腾讯'),
    (e_tencent,  'WeChat company')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '=== Seed complete ===';
  RAISE NOTICE 'Google:         Scarsian=78 (strong,  conf=76)';
  RAISE NOTICE 'OpenAI:         Scarsian=73 (strong,  conf=67)';
  RAISE NOTICE 'Deloitte:       Scarsian=73 (strong,  conf=79)';
  RAISE NOTICE 'HSBC HK:        Scarsian=62 (caution, conf=71)';
  RAISE NOTICE 'Cathay Pacific: Scarsian=55 (caution, conf=63)';
  RAISE NOTICE 'Tencent:        Scarsian=62 (caution, conf=61)';

END $$;
