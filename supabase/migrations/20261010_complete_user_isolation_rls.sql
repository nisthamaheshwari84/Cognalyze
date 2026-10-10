-- ==============================================================================
-- Migration: 20261010_complete_user_isolation_rls.sql
-- Description: Complete Multi-Tenant User Data Isolation & Strict Row Level Security
-- Tables: applications, student_profiles, personal_events, student_dna, 
--         dna_evidence, interview_sessions
-- Author: Cognalyze Production Engineering
-- ==============================================================================

-- 1. Applications Pipeline
CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  candidate_id TEXT NOT NULL,
  opportunity_id TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'Bookmarked',
  notes TEXT DEFAULT '',
  match_score NUMERIC DEFAULT 0,
  applied_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (candidate_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON public.applications (candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON public.applications (opportunity_id);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own applications" ON public.applications;
CREATE POLICY "Users can read own applications"
  ON public.applications FOR SELECT
  USING (auth.uid()::TEXT = candidate_id);

DROP POLICY IF EXISTS "Users can insert own applications" ON public.applications;
CREATE POLICY "Users can insert own applications"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid()::TEXT = candidate_id);

DROP POLICY IF EXISTS "Users can update own applications" ON public.applications;
CREATE POLICY "Users can update own applications"
  ON public.applications FOR UPDATE
  USING (auth.uid()::TEXT = candidate_id)
  WITH CHECK (auth.uid()::TEXT = candidate_id);

DROP POLICY IF EXISTS "Users can delete own applications" ON public.applications;
CREATE POLICY "Users can delete own applications"
  ON public.applications FOR DELETE
  USING (auth.uid()::TEXT = candidate_id);


-- 2. Student Placement Profiles
CREATE TABLE IF NOT EXISTS public.student_profiles (
  candidate_id TEXT PRIMARY KEY,
  skills JSONB DEFAULT '[]'::JSONB,
  past_projects JSONB DEFAULT '[]'::JSONB,
  target_roles JSONB DEFAULT '[]'::JSONB,
  target_companies_or_events JSONB DEFAULT '[]'::JSONB,
  availability TEXT DEFAULT 'Immediate',
  risk_appetite TEXT DEFAULT 'Moderate',
  profile_summary TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

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


-- 3. Personal Calendar Events
CREATE TABLE IF NOT EXISTS public.personal_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  student_id TEXT NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  event_type TEXT DEFAULT 'personal',
  priority TEXT DEFAULT 'medium',
  notes TEXT DEFAULT '',
  opportunity_id TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personal_events_student_id ON public.personal_events (student_id);

ALTER TABLE public.personal_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage own personal events" ON public.personal_events;
CREATE POLICY "Students can manage own personal events"
  ON public.personal_events FOR ALL
  USING (auth.uid()::TEXT = student_id)
  WITH CHECK (auth.uid()::TEXT = student_id);


-- 4. Student DNA & Verified Artifacts
CREATE TABLE IF NOT EXISTS public.student_dna (
  user_id TEXT PRIMARY KEY,
  core_capabilities JSONB DEFAULT '[]'::JSONB,
  archetypes JSONB DEFAULT '[]'::JSONB,
  verified_projects JSONB DEFAULT '[]'::JSONB,
  top_skills JSONB DEFAULT '[]'::JSONB,
  profile_summary TEXT DEFAULT '',
  last_computed TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.student_dna ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage own DNA" ON public.student_dna;
CREATE POLICY "Students can manage own DNA"
  ON public.student_dna FOR ALL
  USING (auth.uid()::TEXT = user_id)
  WITH CHECK (auth.uid()::TEXT = user_id);


-- 5. DNA Evidence Records
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


-- 6. Interview & Assessment Sessions
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  candidate_id TEXT NOT NULL,
  session_type TEXT NOT NULL,
  experience_mode TEXT DEFAULT 'standard',
  target_role TEXT DEFAULT 'Software Engineer',
  target_company TEXT,
  opportunity_id TEXT,
  topics_covered JSONB DEFAULT '[]'::JSONB,
  answer_distribution JSONB DEFAULT '{"strong":0,"adequate":0,"shallow":0,"off_topic":0}'::JSONB,
  security_flags JSONB DEFAULT '{"tab_switches":0,"face_violations":0}'::JSONB,
  overall_score NUMERIC DEFAULT 0,
  weak_topics_identified JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate_id ON public.interview_sessions (candidate_id);

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates can manage own interview sessions" ON public.interview_sessions;
CREATE POLICY "Candidates can manage own interview sessions"
  ON public.interview_sessions FOR ALL
  USING (auth.uid()::TEXT = candidate_id)
  WITH CHECK (auth.uid()::TEXT = candidate_id);
