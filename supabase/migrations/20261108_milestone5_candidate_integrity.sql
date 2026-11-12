-- Cognalyze Technical Interview Agent — Milestone 5
-- Migration: 20261108_milestone5_candidate_integrity.sql
-- Description: Authoritative 7-dimension interview reports and immutable Student DNA event ledger with Row-Level Security

-- 1. Authoritative Final Assessment Reports Table
CREATE TABLE IF NOT EXISTS public.interview_final_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  session_id TEXT NOT NULL UNIQUE REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  overall_score NUMERIC NULL,
  assessment_status TEXT NOT NULL CHECK (assessment_status IN ('COMPLETED_CERTIFIED', 'ASSESSMENT_INCOMPLETE', 'TERMINATED_MISCONDUCT')),
  dimension_scores JSONB NOT NULL,
  coding_evaluation JSONB DEFAULT '{}'::JSONB,
  conduct_scorecard JSONB DEFAULT '{}'::JSONB,
  verbatim_evidence JSONB NOT NULL,
  strengths TEXT[] DEFAULT '{}',
  growth_areas TEXT[] DEFAULT '{}',
  dna_sync_status TEXT DEFAULT 'PENDING' CHECK (dna_sync_status IN ('PENDING', 'COMMITTED', 'SKIPPED', 'FAILED')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Student DNA Immutable Event Ledger
CREATE TABLE IF NOT EXISTS public.student_dna_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  student_id TEXT NOT NULL,
  session_id TEXT NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  competency_id TEXT NOT NULL,
  provenance_level TEXT NOT NULL CHECK (provenance_level IN (
    'PROVENANCE_LEVEL_1_VERIFIED_INTERVIEW_SANDBOX',
    'PROVENANCE_LEVEL_2_VERIFIED_INTERVIEW_THEORY',
    'PROVENANCE_LEVEL_3_EXTERNALLY_AUDITED',
    'PROVENANCE_LEVEL_4_UNVERIFIED_CANDIDATE_CLAIM',
    'PROVENANCE_LEVEL_5_CONTRADICTED_OR_FAILED'
  )),
  confidence_score NUMERIC NOT NULL,
  evidence_summary TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes for fast multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_interview_final_reports_candidate ON public.interview_final_reports(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_final_reports_session ON public.interview_final_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_student_dna_events_student ON public.student_dna_events(student_id);
CREATE INDEX IF NOT EXISTS idx_student_dna_events_session ON public.student_dna_events(session_id);

-- 4. Row Level Security Policies
ALTER TABLE public.interview_final_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_dna_events ENABLE ROW LEVEL SECURITY;

-- Candidates can view their own final reports
DROP POLICY IF EXISTS "Candidates view their own interview reports" ON public.interview_final_reports;
CREATE POLICY "Candidates view their own interview reports"
  ON public.interview_final_reports FOR SELECT
  USING (auth.uid()::TEXT = candidate_id);

-- Candidates can view their own DNA events
DROP POLICY IF EXISTS "Candidates view their own DNA events" ON public.student_dna_events;
CREATE POLICY "Candidates view their own DNA events"
  ON public.student_dna_events FOR SELECT
  USING (auth.uid()::TEXT = student_id);

-- Service role full access
DROP POLICY IF EXISTS "Service role manages interview reports" ON public.interview_final_reports;
CREATE POLICY "Service role manages interview reports"
  ON public.interview_final_reports FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages DNA events" ON public.student_dna_events;
CREATE POLICY "Service role manages DNA events"
  ON public.student_dna_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

