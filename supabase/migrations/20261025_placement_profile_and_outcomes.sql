-- ====================================================================
-- COGNALYZE PHASE 3: CANONICAL PLACEMENT PROFILE, PROOF PORTFOLIO & OUTCOMES
-- Migration: 20261025_placement_profile_and_outcomes.sql
--
-- Features:
-- 1. `student_placement_profiles` - authoritative candidate placement identity
-- 2. `placement_proof_items` - evidence-grounded proof portfolio with 4 verification tiers
-- 3. `placement_offers_outcomes` - private verified offers, acceptance and joining records
-- 4. Complete multi-user RLS isolation (Strictly candidate-owned)
-- ====================================================================

-- 1. STUDENT PLACEMENT PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.student_placement_profiles (
  user_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  college TEXT NOT NULL DEFAULT '',
  degree TEXT NOT NULL DEFAULT 'B.Tech',
  branch TEXT NOT NULL DEFAULT 'Computer Science & Engineering',
  graduation_year TEXT NOT NULL DEFAULT '2026',
  academic_year TEXT DEFAULT 'Final Year',
  cgpa NUMERIC(4, 2),
  active_backlogs INTEGER DEFAULT 0,
  
  -- Placement Goals & Preferences
  target_roles JSONB NOT NULL DEFAULT '["Software Development Engineer (SDE-1)"]'::jsonb,
  target_companies JSONB NOT NULL DEFAULT '["Google", "Amazon", "Razorpay"]'::jsonb,
  opportunity_type TEXT NOT NULL DEFAULT 'both', -- 'internship', 'full_time', 'both'
  placement_type TEXT NOT NULL DEFAULT 'both',   -- 'on_campus', 'off_campus', 'both'
  preferred_work_mode TEXT DEFAULT 'hybrid',     -- 'remote', 'hybrid', 'onsite', 'any'
  preferred_locations JSONB DEFAULT '["Bengaluru", "Hyderabad", "Pune", "Remote"]'::jsonb,
  target_deadline DATE,
  min_compensation_expectation NUMERIC(12, 2),
  
  -- Technical & Interview Setup
  daily_prep_minutes INTEGER NOT NULL DEFAULT 90,
  preferred_language TEXT NOT NULL DEFAULT 'cpp',
  preferred_interview_format TEXT NOT NULL DEFAULT 'mixed',
  programming_languages JSONB DEFAULT '["C++", "Python", "SQL"]'::jsonb,
  dsa_proficiency_level TEXT DEFAULT 'Intermediate',
  
  -- Competencies Grid & Improvement Areas
  competencies JSONB NOT NULL DEFAULT '{}'::jsonb,
  focus_improvement_areas JSONB DEFAULT '["SQL Window Functions", "Operating Systems Paging"]'::jsonb,
  
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_placement_profiles_user_id ON public.student_placement_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_placement_profiles_grad_year ON public.student_placement_profiles(graduation_year);

-- Enable RLS
ALTER TABLE public.student_placement_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates can view own placement profile" ON public.student_placement_profiles;
CREATE POLICY "Candidates can view own placement profile"
  ON public.student_placement_profiles
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Candidates can update own placement profile" ON public.student_placement_profiles;
CREATE POLICY "Candidates can update own placement profile"
  ON public.student_placement_profiles
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);


-- 2. PLACEMENT PROOF PORTFOLIO TABLE
CREATE TABLE IF NOT EXISTS public.placement_proof_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  skill_or_claim TEXT NOT NULL,
  evidence_type TEXT NOT NULL, -- 'github_repo', 'deployed_app', 'coding_assessment', 'cs_interview', 'internship', 'hackathon', 'certificate', 'mentor_confirmation'
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  source_record_id TEXT,
  
  -- 4 Distinct Verification Tiers
  verification_tier TEXT NOT NULL CHECK (verification_tier IN ('self_reported', 'source_connected', 'assessment_verified', 'independently_confirmed')),
  verification_method TEXT NOT NULL DEFAULT 'user_submission',
  confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 50.00, -- 0 - 100
  assessment_score NUMERIC(5, 2),                       -- optional score
  limitations TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_placement_proofs_user ON public.placement_proof_items(user_id);
CREATE INDEX IF NOT EXISTS idx_placement_proofs_tier ON public.placement_proof_items(verification_tier);
CREATE INDEX IF NOT EXISTS idx_placement_proofs_skill ON public.placement_proof_items(skill_or_claim);

ALTER TABLE public.placement_proof_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates view own proof items" ON public.placement_proof_items;
CREATE POLICY "Candidates view own proof items"
  ON public.placement_proof_items
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Candidates manage own proof items" ON public.placement_proof_items;
CREATE POLICY "Candidates manage own proof items"
  ON public.placement_proof_items
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);


-- 3. PLACEMENT OFFERS & OUTCOMES TABLE
CREATE TABLE IF NOT EXISTS public.placement_offers_outcomes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  employer TEXT NOT NULL,
  role_title TEXT NOT NULL,
  offer_date DATE NOT NULL,
  compensation_ctc NUMERIC(14, 2),
  compensation_stipend NUMERIC(10, 2),
  currency TEXT NOT NULL DEFAULT 'INR',
  
  -- Status progression
  status TEXT NOT NULL CHECK (status IN ('OFFER_RECEIVED', 'OFFER_ACCEPTED', 'JOINED', 'DECLINED')),
  expected_joining_date DATE,
  actual_joining_date DATE,
  
  -- Verification Level
  verification_level TEXT NOT NULL CHECK (verification_level IN ('self_reported', 'document_supported', 'independently_confirmed')),
  document_url TEXT,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_placement_offers_user ON public.placement_offers_outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_placement_offers_status ON public.placement_offers_outcomes(status);

ALTER TABLE public.placement_offers_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates view own offers" ON public.placement_offers_outcomes;
CREATE POLICY "Candidates view own offers"
  ON public.placement_offers_outcomes
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Candidates manage own offers" ON public.placement_offers_outcomes;
CREATE POLICY "Candidates manage own offers"
  ON public.placement_offers_outcomes
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
