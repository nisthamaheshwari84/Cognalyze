-- Migration: Recruiter Role -> Collaboration Feed -> Student Apply (with Auto-DNA)
-- Enforces immutable collaboration feed placement, one-application-per-student, and frozen DNA snapshots.

-- 1. Ensure prerequisite identity and profile tables
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'recruiter', 'admin')),
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS idx_candidates_clerk_id ON candidates (clerk_user_id);

CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  file_url TEXT,
  resume_text TEXT,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_resumes_candidate_id ON resumes (candidate_id);

CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_description TEXT,
  final_verdict TEXT,
  dna_data JSONB,
  full_report JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS dna_data JSONB;
CREATE INDEX IF NOT EXISTS idx_analyses_candidate_id ON analyses (candidate_id, created_at DESC);

-- 2. Open Roles Table
-- Open roles ALWAYS go to 'collaboration' feed — enforced in code and constrained here.
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  feed_type TEXT NOT NULL CHECK (feed_type IN ('post', 'collaboration')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roles_feed_type_status ON roles (feed_type, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roles_recruiter_id ON roles (recruiter_id);

-- 3. Role Applications Table
-- dna_snapshot is a frozen copy of the student's analysis at apply-time (jsonb), not a live reference.
CREATE TABLE IF NOT EXISTS role_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE RESTRICT,
  github_url TEXT,
  dna_snapshot JSONB NOT NULL,
  dna_snapshot_source_analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_role_student_application UNIQUE (role_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_role_applications_role ON role_applications (role_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_role_applications_student ON role_applications (student_id);
