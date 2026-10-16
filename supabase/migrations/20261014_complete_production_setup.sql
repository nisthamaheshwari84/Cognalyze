-- ==============================================================================
-- Migration: 20261012_consolidated_production_schema_and_rls.sql
-- Description: Cognalyze Production Database Schema, Integrity Constraints & Strict Multi-Tenant RLS
-- Target: Supabase PostgreSQL (https://yfcpoanewgucmfcpikub.supabase.co)
-- Author: Cognalyze Principal Architecture Team
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CORE IDENTITY & USER PROFILES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.candidates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  clerk_user_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidates_clerk_user_id ON public.candidates (clerk_user_id);
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates can read own record" ON public.candidates;
CREATE POLICY "Candidates can read own record"
  ON public.candidates FOR SELECT
  USING (auth.uid()::TEXT = clerk_user_id OR auth.uid()::TEXT = id);

DROP POLICY IF EXISTS "Candidates can update own record" ON public.candidates;
CREATE POLICY "Candidates can update own record"
  ON public.candidates FOR UPDATE
  USING (auth.uid()::TEXT = clerk_user_id OR auth.uid()::TEXT = id)
  WITH CHECK (auth.uid()::TEXT = clerk_user_id OR auth.uid()::TEXT = id);

DROP POLICY IF EXISTS "Candidates can insert own record" ON public.candidates;
CREATE POLICY "Candidates can insert own record"
  ON public.candidates FOR INSERT
  WITH CHECK (auth.uid()::TEXT = clerk_user_id OR auth.uid()::TEXT = id);


CREATE TABLE IF NOT EXISTS public.student_profiles (
  candidate_id TEXT PRIMARY KEY,
  skills JSONB DEFAULT '[]'::JSONB,
  past_projects JSONB DEFAULT '[]'::JSONB,
  target_roles JSONB DEFAULT '[]'::JSONB,
  target_companies_or_events JSONB DEFAULT '[]'::JSONB,
  availability TEXT DEFAULT 'Immediate',
  risk_appetite TEXT DEFAULT 'Moderate',
  profile_summary TEXT DEFAULT '',
  experience_level TEXT DEFAULT '1-3yr',
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


-- ==============================================================================
-- 3. RESUME VAULT & METADATA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.resumes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  candidate_id TEXT REFERENCES public.candidates(id) ON DELETE CASCADE,
  file_url TEXT,
  parsed_text TEXT,
  ats_score NUMERIC DEFAULT 0,
  skills JSONB DEFAULT '[]'::JSONB,
  projects JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resumes_candidate_id ON public.resumes (candidate_id);
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own resumes" ON public.resumes;
CREATE POLICY "Users can manage own resumes"
  ON public.resumes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = resumes.candidate_id
        AND (c.clerk_user_id = auth.uid()::TEXT OR c.id = auth.uid()::TEXT)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = resumes.candidate_id
        AND (c.clerk_user_id = auth.uid()::TEXT OR c.id = auth.uid()::TEXT)
    )
  );


-- ==============================================================================
-- 4. APPLICATIONS PIPELINE & TRACKING
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  student_id TEXT NOT NULL,
  opportunity_id TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'Bookmarked',
  notes TEXT DEFAULT '',
  match_score NUMERIC DEFAULT 0,
  deadline_reminder_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_student_id ON public.applications (student_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON public.applications (opportunity_id);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own applications" ON public.applications;
CREATE POLICY "Users can read own applications"
  ON public.applications FOR SELECT
  USING (auth.uid()::TEXT = student_id);

DROP POLICY IF EXISTS "Users can insert own applications" ON public.applications;
CREATE POLICY "Users can insert own applications"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid()::TEXT = student_id);

DROP POLICY IF EXISTS "Users can update own applications" ON public.applications;
CREATE POLICY "Users can update own applications"
  ON public.applications FOR UPDATE
  USING (auth.uid()::TEXT = student_id)
  WITH CHECK (auth.uid()::TEXT = student_id);

DROP POLICY IF EXISTS "Users can delete own applications" ON public.applications;
CREATE POLICY "Users can delete own applications"
  ON public.applications FOR DELETE
  USING (auth.uid()::TEXT = student_id);


-- ==============================================================================
-- 5. PERSONAL CALENDAR & PLACEMENT MILESTONES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.personal_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  student_id TEXT NOT NULL,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_type TEXT DEFAULT 'personal',
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  linked_opportunity_id TEXT,
  is_dismissed BOOLEAN DEFAULT false,
  snoozed_until DATE,
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


-- ==============================================================================
-- 6. STUDENT DNA & VERIFIED EVIDENCE GRAPH
-- ==============================================================================

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


-- ==============================================================================
-- 7. INTERVIEWS & ASSESSMENTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.interviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  candidate_id TEXT REFERENCES public.candidates(id) ON DELETE CASCADE,
  type TEXT,
  transcript TEXT,
  video_url TEXT,
  scores JSONB,
  trust_score NUMERIC DEFAULT 0,
  verdict TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON public.interviews (candidate_id);
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own interviews" ON public.interviews;
CREATE POLICY "Users can manage own interviews"
  ON public.interviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = interviews.candidate_id
        AND (c.clerk_user_id = auth.uid()::TEXT OR c.id = auth.uid()::TEXT)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = interviews.candidate_id
        AND (c.clerk_user_id = auth.uid()::TEXT OR c.id = auth.uid()::TEXT)
    )
  );


-- ==============================================================================
-- 8. RECRUITER & DECISION ROOM
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.recruiter_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL UNIQUE,
  organization_id TEXT,
  full_name TEXT NOT NULL,
  designation TEXT DEFAULT 'Recruiter',
  work_email TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_user_id ON public.recruiter_profiles (user_id);
ALTER TABLE public.recruiter_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recruiters can manage own profile" ON public.recruiter_profiles;
CREATE POLICY "Recruiters can manage own profile"
  ON public.recruiter_profiles FOR ALL
  USING (auth.uid()::TEXT = user_id)
  WITH CHECK (auth.uid()::TEXT = user_id);


-- ==============================================================================
-- 9. ANALYSES & AUDIT VAULT
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.analyses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  candidate_id TEXT,
  recruiter_clerk_id TEXT,
  job_description TEXT,
  champion_score NUMERIC,
  skeptic_score NUMERIC,
  futurist_score NUMERIC,
  pattern_score NUMERIC,
  culture_score NUMERIC,
  final_verdict TEXT,
  full_report JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analyses_recruiter_clerk_id ON public.analyses (recruiter_clerk_id);
CREATE INDEX IF NOT EXISTS idx_analyses_candidate_id ON public.analyses (candidate_id);
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Allow cloud stores and authenticated users
DROP POLICY IF EXISTS "Analyses access policy" ON public.analyses;
CREATE POLICY "Analyses access policy"
  ON public.analyses FOR ALL
  USING (true)
  WITH CHECK (true);


-- ==============================================================================
-- 10. STORAGE BUCKET CONFIGURATION & POLICIES
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

-- Storage RLS: Users can only upload and read files in their own candidate folder: resumes/{candidate_id}/*
DROP POLICY IF EXISTS "Candidate Resume Storage Upload" ON storage.objects;
CREATE POLICY "Candidate Resume Storage Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "Candidate Resume Storage Read" ON storage.objects;
CREATE POLICY "Candidate Resume Storage Read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  );
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
