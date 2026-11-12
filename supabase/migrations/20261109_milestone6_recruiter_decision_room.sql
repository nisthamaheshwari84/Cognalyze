-- Cognalyze Technical Interview Agent — Milestone 6
-- Migration: 20261109_milestone6_recruiter_decision_room.sql
-- Description: Enterprise Recruiter Decision Room schema, candidate pipeline tracking, and immutable decision audit log with RLS

-- 1. Recruiter Roles Table
CREATE TABLE IF NOT EXISTS public.recruiter_roles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  organization_id TEXT NOT NULL,
  title TEXT NOT NULL,
  track_id TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  jd_text TEXT NOT NULL,
  competency_requirements JSONB NOT NULL DEFAULT '[]'::JSONB,
  dimension_weights JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Recruiter Candidate Pipeline Junction
CREATE TABLE IF NOT EXISTS public.recruiter_candidate_pipelines (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  organization_id TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES public.recruiter_roles(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL,
  interview_session_id TEXT REFERENCES public.interview_sessions(id) ON DELETE SET NULL,
  final_report_id TEXT REFERENCES public.interview_final_reports(id) ON DELETE SET NULL,
  stage TEXT NOT NULL DEFAULT 'APPLIED' CHECK (stage IN ('APPLIED', 'TECHNICAL_SCREEN', 'DECISION_ROOM', 'OFFER', 'REJECTED', 'WITHDRAWN')),
  hiring_verdict TEXT NULL CHECK (hiring_verdict IN ('STRONG_HIRE', 'HIRE', 'HOLD', 'NO_HIRE', 'STRONG_NO_HIRE')),
  is_override BOOLEAN DEFAULT false,
  override_reason TEXT NULL,
  decision_notes TEXT NULL,
  decided_by TEXT NULL,
  decided_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Immutable Decision Audit Ledger
CREATE TABLE IF NOT EXISTS public.recruiter_decision_audit (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  organization_id TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES public.recruiter_roles(id),
  candidate_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  previous_stage TEXT NOT NULL,
  new_stage TEXT NOT NULL,
  ai_recommendation TEXT NOT NULL,
  human_verdict TEXT NOT NULL,
  is_override BOOLEAN NOT NULL,
  override_reason TEXT NULL,
  action_summary TEXT NOT NULL,
  ip_address TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Fast Query Indexes
CREATE INDEX IF NOT EXISTS idx_recruiter_roles_org ON public.recruiter_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_pipelines_org ON public.recruiter_candidate_pipelines(organization_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_pipelines_role ON public.recruiter_candidate_pipelines(role_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_pipelines_candidate ON public.recruiter_candidate_pipelines(candidate_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_decision_audit_org ON public.recruiter_decision_audit(organization_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_decision_audit_role ON public.recruiter_decision_audit(role_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_decision_audit_candidate ON public.recruiter_decision_audit(candidate_id);

-- 5. Row Level Security Policies
ALTER TABLE public.recruiter_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_candidate_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_decision_audit ENABLE ROW LEVEL SECURITY;

-- Organization-level isolation: Recruiters can only access data belonging to their organization
DROP POLICY IF EXISTS "Recruiters access own organization roles" ON public.recruiter_roles;
CREATE POLICY "Recruiters access own organization roles"
  ON public.recruiter_roles FOR ALL
  USING (organization_id = (SELECT org_id FROM public.users WHERE id = auth.uid()::TEXT));

DROP POLICY IF EXISTS "Recruiters access own organization pipelines" ON public.recruiter_candidate_pipelines;
CREATE POLICY "Recruiters access own organization pipelines"
  ON public.recruiter_candidate_pipelines FOR ALL
  USING (organization_id = (SELECT org_id FROM public.users WHERE id = auth.uid()::TEXT));

DROP POLICY IF EXISTS "Recruiters access own organization audit log" ON public.recruiter_decision_audit;
CREATE POLICY "Recruiters access own organization audit log"
  ON public.recruiter_decision_audit FOR SELECT
  USING (organization_id = (SELECT org_id FROM public.users WHERE id = auth.uid()::TEXT));

-- Service role full access
DROP POLICY IF EXISTS "Service role manages recruiter roles" ON public.recruiter_roles;
CREATE POLICY "Service role manages recruiter roles"
  ON public.recruiter_roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages recruiter pipelines" ON public.recruiter_candidate_pipelines;
CREATE POLICY "Service role manages recruiter pipelines"
  ON public.recruiter_candidate_pipelines FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages recruiter decision audit" ON public.recruiter_decision_audit;
CREATE POLICY "Service role manages recruiter decision audit"
  ON public.recruiter_decision_audit FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

