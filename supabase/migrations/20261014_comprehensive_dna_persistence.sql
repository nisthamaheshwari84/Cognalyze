-- ==============================================================================
-- Migration: 20261014_comprehensive_dna_persistence.sql
-- Description: Authoritative Cognalyze Production Database Schema,
--              Student DNA, Profile, Evidence Graph, and Strict Multi-Tenant RLS
-- Target: Supabase PostgreSQL
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. STUDENT PROFILES COMPREHENSIVE SCHEMA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.student_profiles (
  candidate_id TEXT PRIMARY KEY,
  full_name TEXT DEFAULT 'Student',
  email TEXT,
  phone TEXT,
  location TEXT,
  college TEXT,
  degree TEXT,
  branch TEXT,
  year TEXT,
  graduation_year TEXT,
  cgpa TEXT,
  coursework JSONB DEFAULT '[]'::JSONB,
  skills JSONB DEFAULT '[]'::JSONB,
  past_projects JSONB DEFAULT '[]'::JSONB,
  experience JSONB DEFAULT '[]'::JSONB,
  achievements JSONB DEFAULT '[]'::JSONB,
  certifications JSONB DEFAULT '[]'::JSONB,
  career_goals JSONB DEFAULT '{}'::JSONB,
  target_roles JSONB DEFAULT '[]'::JSONB,
  target_companies_or_events JSONB DEFAULT '[]'::JSONB,
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  resume_url TEXT,
  resume_file_name TEXT,
  current_step INTEGER DEFAULT 1,
  profile_completed BOOLEAN DEFAULT false,
  profile_completion_percentage INTEGER DEFAULT 0,
  availability TEXT DEFAULT 'Immediate',
  risk_appetite TEXT DEFAULT 'Moderate',
  profile_summary TEXT DEFAULT '',
  experience_level TEXT DEFAULT 'fresher',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist if table was previously created with fewer columns
DO $$
BEGIN
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT 'Student';
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS email TEXT;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS location TEXT;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS college TEXT;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS degree TEXT;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS branch TEXT;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS year TEXT;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS graduation_year TEXT;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS cgpa TEXT;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS coursework JSONB DEFAULT '[]'::JSONB;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS experience JSONB DEFAULT '[]'::JSONB;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::JSONB;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::JSONB;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS career_goals JSONB DEFAULT '{}'::JSONB;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS resume_file_name TEXT;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 1;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;
  ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;
END $$;

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own profile" ON public.student_profiles;
CREATE POLICY "Students can view own profile"
  ON public.student_profiles FOR SELECT
  USING (auth.uid()::TEXT = candidate_id);

DROP POLICY IF EXISTS "Students can update own profile" ON public.student_profiles;
CREATE POLICY "Students can update own profile"
  ON public.student_profiles FOR UPDATE
  USING (auth.uid()::TEXT = candidate_id)
  WITH CHECK (auth.uid()::TEXT = candidate_id);

DROP POLICY IF EXISTS "Students can insert own profile" ON public.student_profiles;
CREATE POLICY "Students can insert own profile"
  ON public.student_profiles FOR INSERT
  WITH CHECK (auth.uid()::TEXT = candidate_id);

CREATE INDEX IF NOT EXISTS idx_student_profiles_candidate_id ON public.student_profiles (candidate_id);

-- ==============================================================================
-- 3. STUDENT DNA DERIVED STATE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.student_dna (
  user_id TEXT PRIMARY KEY,
  core_capabilities JSONB DEFAULT '[]'::JSONB,
  archetypes JSONB DEFAULT '[]'::JSONB,
  verified_projects JSONB DEFAULT '[]'::JSONB,
  top_skills JSONB DEFAULT '[]'::JSONB,
  active_target_role TEXT DEFAULT 'sde_intern',
  gap_report JSONB DEFAULT '{}'::JSONB,
  metrics_proof JSONB DEFAULT '{}'::JSONB,
  profile_summary TEXT DEFAULT '',
  last_computed TIMESTAMPTZ DEFAULT now()
);

DO $$
BEGIN
  ALTER TABLE public.student_dna ADD COLUMN IF NOT EXISTS active_target_role TEXT DEFAULT 'sde_intern';
  ALTER TABLE public.student_dna ADD COLUMN IF NOT EXISTS gap_report JSONB DEFAULT '{}'::JSONB;
  ALTER TABLE public.student_dna ADD COLUMN IF NOT EXISTS metrics_proof JSONB DEFAULT '{}'::JSONB;
END $$;

ALTER TABLE public.student_dna ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage own DNA" ON public.student_dna;
CREATE POLICY "Students can manage own DNA"
  ON public.student_dna FOR ALL
  USING (auth.uid()::TEXT = user_id)
  WITH CHECK (auth.uid()::TEXT = user_id);

-- ==============================================================================
-- 4. DNA EVIDENCE RECORD VAULT
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.dna_evidence (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  certainty TEXT DEFAULT 'Verified',
  confidence NUMERIC DEFAULT 0.85,
  source TEXT DEFAULT 'platform',
  date TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dna_evidence_user_id ON public.dna_evidence (user_id);
ALTER TABLE public.dna_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage own evidence" ON public.dna_evidence;
CREATE POLICY "Students can manage own evidence"
  ON public.dna_evidence FOR ALL
  USING (auth.uid()::TEXT = user_id)
  WITH CHECK (auth.uid()::TEXT = user_id);
