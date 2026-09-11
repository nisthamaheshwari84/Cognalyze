-- ============================================================================
-- COGNALYZE: Track-Aware Skill Practice Hub (Migration 20260907_skill_practice_hub)
-- Bridges India's Service-Company Hiring Track (TCS, Infosys, Wipro, Cognizant)
-- with Product & FAANG Track (DSA Pattern Grind, System Design, STAR Behavioral)
-- ============================================================================

-- 1. Company Tracks Table
CREATE TABLE IF NOT EXISTS company_tracks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL, -- 'service_mass', 'service_elite', 'product_mid', 'product_faang'
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  hiring_focus    TEXT NOT NULL,
  round_structure JSONB NOT NULL,
  target_companies TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Alter student_profiles to support multi-select target tracks
ALTER TABLE IF EXISTS student_profiles
  ADD COLUMN IF NOT EXISTS target_tracks TEXT[] DEFAULT '{"service_mass", "product_mid"}';

-- 3. Skill Domains Table
CREATE TABLE IF NOT EXISTS skill_domains (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL, -- 'aptitude_reasoning', 'communication_english', etc.
  name             TEXT NOT NULL,
  description      TEXT NOT NULL,
  icon             TEXT NOT NULL,
  is_service_track BOOLEAN DEFAULT false,
  is_product_track BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Skill Resources & Pattern Banks Table
CREATE TABLE IF NOT EXISTS skill_resources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_slug     TEXT NOT NULL,
  title           TEXT NOT NULL,
  resource_type   TEXT NOT NULL, -- 'interactive_quiz', 'self_practice_prompt', 'pattern_breakdown', 'cheat_sheet'
  company_tag     TEXT,          -- 'TCS NQT', 'Infosys', 'Wipro', 'Amazon', 'Google'
  source_citation TEXT,          -- 'PrepInsta 2026 Archive', 'IndiaBix Verified Pattern', etc.
  metadata        JSONB NOT NULL DEFAULT '{}', -- { depth: 'basic' | 'interview_deep', track_relevance: [...] }
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Student Skill Progress & Submissions
CREATE TABLE IF NOT EXISTS student_skill_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    TEXT NOT NULL,
  domain_slug     TEXT NOT NULL,
  resource_id     TEXT NOT NULL,
  score           NUMERIC(5,2),
  details         JSONB NOT NULL DEFAULT '{}',
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Indexes for Fast Track & Domain Filtering
CREATE INDEX IF NOT EXISTS idx_company_tracks_slug ON company_tracks(slug);
CREATE INDEX IF NOT EXISTS idx_skill_domains_slug ON skill_domains(slug);
CREATE INDEX IF NOT EXISTS idx_skill_resources_domain ON skill_resources(domain_slug);
CREATE INDEX IF NOT EXISTS idx_student_skill_progress_candidate ON student_skill_progress(candidate_id);
