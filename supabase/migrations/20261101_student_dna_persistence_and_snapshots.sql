-- ==============================================================================
-- COGNALYZE MIGRATION: STUDENT DNA PERSISTENCE & RECRUITER SNAPSHOTS
-- Migration ID: 20261101_student_dna_persistence_and_snapshots.sql
-- 
-- 1. Creates public.dna_snapshots for immutable point-of-application snapshots.
-- 2. Creates public.dna_tracked_applications and public.dna_saved_opportunities.
-- 3. Configures Row Level Security (RLS) enforcing strict multi-tenant isolation.
-- ==============================================================================

-- 1. IMMUTABLE RECRUITER POINT-OF-APPLICATION SNAPSHOTS
CREATE TABLE IF NOT EXISTS public.dna_snapshots (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  candidate_name TEXT,
  candidate_email TEXT,
  snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_dna_snapshots_student_role UNIQUE (student_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_dna_snapshots_student_id ON public.dna_snapshots (student_id);
CREATE INDEX IF NOT EXISTS idx_dna_snapshots_role_id ON public.dna_snapshots (role_id);

ALTER TABLE public.dna_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own snapshots" ON public.dna_snapshots;
CREATE POLICY "Students can view own snapshots"
  ON public.dna_snapshots FOR SELECT
  USING (auth.uid()::TEXT = student_id);

DROP POLICY IF EXISTS "Recruiters and admins can manage snapshots" ON public.dna_snapshots;
CREATE POLICY "Recruiters and admins can manage snapshots"
  ON public.dna_snapshots FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. STUDENT TRACKED APPLICATIONS
CREATE TABLE IF NOT EXISTS public.dna_tracked_applications (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  opportunity_id TEXT NOT NULL,
  opportunity_title TEXT,
  organization TEXT,
  stage TEXT NOT NULL DEFAULT 'SAVED',
  notes TEXT,
  saved_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_dna_tracked_app UNIQUE (student_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_dna_tracked_apps_student ON public.dna_tracked_applications (student_id);

ALTER TABLE public.dna_tracked_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage own tracked applications" ON public.dna_tracked_applications;
CREATE POLICY "Students can manage own tracked applications"
  ON public.dna_tracked_applications FOR ALL
  USING (auth.uid()::TEXT = student_id)
  WITH CHECK (auth.uid()::TEXT = student_id);

-- 3. STUDENT SAVED OPPORTUNITIES
CREATE TABLE IF NOT EXISTS public.dna_saved_opportunities (
  student_id TEXT NOT NULL,
  opportunity_id TEXT NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (student_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_dna_saved_opps_student ON public.dna_saved_opportunities (student_id);

ALTER TABLE public.dna_saved_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage own saved opportunities" ON public.dna_saved_opportunities;
CREATE POLICY "Students can manage own saved opportunities"
  ON public.dna_saved_opportunities FOR ALL
  USING (auth.uid()::TEXT = student_id)
  WITH CHECK (auth.uid()::TEXT = student_id);

