-- Cognalyze Recruitment Arena — Enterprise Architecture
-- Migration: 20261112_recruitment_arena_schema.sql
-- Description: Core tables for verified recruitment blueprints, dynamic student journeys, stage execution telemetry, and RLS

-- 1. Recruitment Companies Table
CREATE TABLE IF NOT EXISTS public.recruitment_companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  tier_category TEXT NOT NULL CHECK (tier_category IN ('TIER_1_FAANG', 'HIGH_GROWTH_PRODUCT', 'ENTERPRISE_SERVICE', 'FINTECH_GLOBAL')),
  headquarters TEXT NOT NULL,
  overview TEXT NOT NULL,
  official_careers_url TEXT NOT NULL,
  supported_role_families JSONB NOT NULL DEFAULT '[]'::JSONB,
  supported_channels JSONB NOT NULL DEFAULT '[]'::JSONB,
  competency_framework_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Recruitment Blueprints Table (Immutable Versioning)
CREATE TABLE IF NOT EXISTS public.recruitment_blueprints (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES public.recruitment_companies(id) ON DELETE CASCADE,
  role_family TEXT NOT NULL CHECK (role_family IN ('sde', 'ai_ml', 'data_analyst')),
  hiring_channel TEXT NOT NULL CHECK (hiring_channel IN ('campus', 'off_campus', 'internship', 'experienced')),
  country TEXT NOT NULL DEFAULT 'GLOBAL',
  version TEXT NOT NULL DEFAULT '1.0.0',
  is_published BOOLEAN DEFAULT true,
  title TEXT NOT NULL,
  overview TEXT NOT NULL,
  stages JSONB NOT NULL DEFAULT '[]'::JSONB,
  competency_rubric JSONB NOT NULL DEFAULT '{}'::JSONB,
  verified_sources JSONB NOT NULL DEFAULT '[]'::JSONB,
  last_verified_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, role_family, hiring_channel, country, version)
);

-- 3. Student Recruitment Journeys Table
CREATE TABLE IF NOT EXISTS public.student_recruitment_journeys (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  student_id TEXT NOT NULL,
  company_id TEXT NOT NULL REFERENCES public.recruitment_companies(id),
  blueprint_id TEXT NOT NULL REFERENCES public.recruitment_blueprints(id),
  blueprint_version TEXT NOT NULL,
  role_family TEXT NOT NULL,
  hiring_channel TEXT NOT NULL,
  current_stage_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'OFFER_EXTENDED', 'DID_NOT_PASS', 'ABANDONED', 'FAST_TRACKED')),
  overall_score NUMERIC(5, 2) DEFAULT 0.00,
  stage_progress JSONB NOT NULL DEFAULT '{}'::JSONB,
  competency_scores JSONB NOT NULL DEFAULT '{}'::JSONB,
  recruiter_pipeline_id TEXT REFERENCES public.recruiter_candidate_pipelines(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Student Recruitment Stage Attempts & Telemetry
CREATE TABLE IF NOT EXISTS public.student_recruitment_stage_attempts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  journey_id TEXT NOT NULL REFERENCES public.student_recruitment_journeys(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL,
  stage_type TEXT NOT NULL,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'SKIPPED')),
  raw_score NUMERIC(5, 2) DEFAULT 0.00,
  max_score NUMERIC(5, 2) DEFAULT 100.00,
  percentage_score NUMERIC(5, 2) DEFAULT 0.00,
  duration_seconds INTEGER DEFAULT 0,
  telemetry JSONB NOT NULL DEFAULT '{}'::JSONB,
  rubric_evaluations JSONB NOT NULL DEFAULT '{}'::JSONB,
  evaluator_feedback TEXT,
  session_reference_id TEXT, -- e.g. interview_sessions.id if an interview stage
  attempt_count INTEGER DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 5. Fast Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_recruitment_companies_tier ON public.recruitment_companies(tier_category);
CREATE INDEX IF NOT EXISTS idx_recruitment_blueprints_lookup ON public.recruitment_blueprints(company_id, role_family, hiring_channel);
CREATE INDEX IF NOT EXISTS idx_student_journeys_student ON public.student_recruitment_journeys(student_id);
CREATE INDEX IF NOT EXISTS idx_student_journeys_company ON public.student_recruitment_journeys(company_id);
CREATE INDEX IF NOT EXISTS idx_student_journeys_status ON public.student_recruitment_journeys(status);
CREATE INDEX IF NOT EXISTS idx_student_stage_attempts_journey ON public.student_recruitment_stage_attempts(journey_id);
CREATE INDEX IF NOT EXISTS idx_student_stage_attempts_student ON public.student_recruitment_stage_attempts(student_id);

-- 6. Row Level Security Policies
ALTER TABLE public.recruitment_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_recruitment_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_recruitment_stage_attempts ENABLE ROW LEVEL SECURITY;

-- Public/Authenticated read for companies and published blueprints
CREATE POLICY "Allow public read access to recruitment_companies"
  ON public.recruitment_companies FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to published recruitment_blueprints"
  ON public.recruitment_blueprints FOR SELECT
  USING (is_published = true);

-- Student-isolated RLS policies for journeys
CREATE POLICY "Students can view their own recruitment journeys"
  ON public.student_recruitment_journeys FOR SELECT
  USING (auth.uid()::text = student_id OR student_id = 'demo-student-id' OR auth.role() = 'service_role');

CREATE POLICY "Students can insert their own recruitment journeys"
  ON public.student_recruitment_journeys FOR INSERT
  WITH CHECK (auth.uid()::text = student_id OR student_id = 'demo-student-id' OR auth.role() = 'service_role');

CREATE POLICY "Students can update their own recruitment journeys"
  ON public.student_recruitment_journeys FOR UPDATE
  USING (auth.uid()::text = student_id OR student_id = 'demo-student-id' OR auth.role() = 'service_role');

-- Student-isolated RLS policies for stage attempts
CREATE POLICY "Students can view their own stage attempts"
  ON public.student_recruitment_stage_attempts FOR SELECT
  USING (auth.uid()::text = student_id OR student_id = 'demo-student-id' OR auth.role() = 'service_role');

CREATE POLICY "Students can insert their own stage attempts"
  ON public.student_recruitment_stage_attempts FOR INSERT
  WITH CHECK (auth.uid()::text = student_id OR student_id = 'demo-student-id' OR auth.role() = 'service_role');

CREATE POLICY "Students can update their own stage attempts"
  ON public.student_recruitment_stage_attempts FOR UPDATE
  USING (auth.uid()::text = student_id OR student_id = 'demo-student-id' OR auth.role() = 'service_role');

