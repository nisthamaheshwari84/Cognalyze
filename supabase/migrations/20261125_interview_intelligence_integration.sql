-- ==============================================================================
-- COGNALYZE MIGRATION: INTERVIEW INTELLIGENCE UNIFIED IDENTITY & HANDOFF TICKETS
-- Migration ID: 20261125_interview_intelligence_integration.sql
--
-- Supports:
-- 1. Single-use, short-lived launch ticket replay protection across serverless instances.
-- 2. Strict RLS locking ticket management exclusively to service_role.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.interview_launch_tickets (
  jti TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'interview-intelligence',
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_launch_tickets_user_id
  ON public.interview_launch_tickets (user_id);

CREATE INDEX IF NOT EXISTS idx_interview_launch_tickets_expires_at
  ON public.interview_launch_tickets (expires_at);

ALTER TABLE public.interview_launch_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on interview_launch_tickets" ON public.interview_launch_tickets;
CREATE POLICY "Service role full access on interview_launch_tickets"
  ON public.interview_launch_tickets FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
