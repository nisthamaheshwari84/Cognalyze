-- COGNALYZE POST-AUDIT REMEDIATION: Interview Sessions Resilience & Serverless Safety
-- Ensures public.interview_sessions exists with all required columns, indexes, RLS, and constraints
-- to support durable serverless hydration across multi-instance environments.

CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  candidate_id TEXT NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'mock_interview',
  experience_mode TEXT DEFAULT 'standard',
  target_role TEXT DEFAULT 'Software Engineer',
  target_company TEXT,
  opportunity_id TEXT,
  topics_covered JSONB DEFAULT '[]'::JSONB,
  answer_distribution JSONB DEFAULT '{"strong":0,"adequate":0,"shallow":0,"off_topic":0}'::JSONB,
  security_flags JSONB DEFAULT '{"tab_switches":0,"face_violations":0}'::JSONB,
  overall_score NUMERIC DEFAULT 0,
  weak_topics_identified JSONB DEFAULT '[]'::JSONB,
  status TEXT DEFAULT 'active',
  transcript JSONB DEFAULT '[]'::JSONB,
  report JSONB,
  state JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure resilience columns exist if table was previously created with earlier schema
ALTER TABLE public.interview_sessions
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS transcript JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS report JSONB,
  ADD COLUMN IF NOT EXISTS state JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Indexes for performant lookups by candidate, status, and compound
CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate_id ON public.interview_sessions (candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON public.interview_sessions (status);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate_status ON public.interview_sessions (candidate_id, status);

-- Enable Row Level Security
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

-- Candidates can manage only their own interview sessions
DROP POLICY IF EXISTS "Candidates can manage own interview sessions" ON public.interview_sessions;
CREATE POLICY "Candidates can manage own interview sessions"
  ON public.interview_sessions FOR ALL
  USING (auth.uid()::TEXT = candidate_id)
  WITH CHECK (auth.uid()::TEXT = candidate_id);

-- Service role bypass for server-side API execution
DROP POLICY IF EXISTS "Service role full access on interview_sessions" ON public.interview_sessions;
CREATE POLICY "Service role full access on interview_sessions"
  ON public.interview_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
