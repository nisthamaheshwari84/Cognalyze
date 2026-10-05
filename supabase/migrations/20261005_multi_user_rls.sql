-- ==============================================================================
-- Migration: 20261005_multi_user_rls.sql
-- Description: Multi-User Security Hardening & Row Level Security (RLS) Policies
-- Author: Cognalyze Production Engineering
-- ==============================================================================

-- 1. Enable RLS on core identity and evidence tables
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recruiter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_dna ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dna_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS resumes ENABLE ROW LEVEL SECURITY;

-- 2. User Profiles Policies (Strict self-ownership)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Student Profiles Policies
DROP POLICY IF EXISTS "Students can view own profile" ON student_profiles;
CREATE POLICY "Students can view own profile"
  ON student_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can update own profile" ON student_profiles;
CREATE POLICY "Students can update own profile"
  ON student_profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can insert own profile" ON student_profiles;
CREATE POLICY "Students can insert own profile"
  ON student_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Recruiter Profiles Policies (Requires verified recruiter status)
DROP POLICY IF EXISTS "Recruiters can view own recruiter profile" ON recruiter_profiles;
CREATE POLICY "Recruiters can view own recruiter profile"
  ON recruiter_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Recruiters can update own recruiter profile" ON recruiter_profiles;
CREATE POLICY "Recruiters can update own recruiter profile"
  ON recruiter_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Student DNA & Evidence Records
DROP POLICY IF EXISTS "Students can manage own DNA" ON student_dna;
CREATE POLICY "Students can manage own DNA"
  ON student_dna FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can manage own evidence" ON dna_evidence;
CREATE POLICY "Students can manage own evidence"
  ON dna_evidence FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recruiters may view candidate evidence only if the student has actively applied to an opportunity posted by recruiter's company
DROP POLICY IF EXISTS "Recruiters can inspect applied candidate evidence" ON dna_evidence;
CREATE POLICY "Recruiters can inspect applied candidate evidence"
  ON dna_evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN recruiter_profiles r ON r.user_id = auth.uid()
      WHERE a.candidate_id = dna_evidence.user_id
        AND r.company_name = a.company_name
    )
  );

-- 6. Applications Pipeline (Strict candidate and employer boundaries)
DROP POLICY IF EXISTS "Students can manage own applications" ON applications;
CREATE POLICY "Students can manage own applications"
  ON applications FOR ALL
  USING (auth.uid() = candidate_id)
  WITH CHECK (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Recruiters can review company applications" ON applications;
CREATE POLICY "Recruiters can review company applications"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recruiter_profiles r
      WHERE r.user_id = auth.uid()
        AND r.company_name = applications.company_name
    )
  );

-- 7. Personal Calendar Events (Strict user isolation)
DROP POLICY IF EXISTS "Users can manage own calendar events" ON student_calendar_events;
CREATE POLICY "Users can manage own calendar events"
  ON student_calendar_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. Resume Document Vault
DROP POLICY IF EXISTS "Users can manage own resumes" ON resumes;
CREATE POLICY "Users can manage own resumes"
  ON resumes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
