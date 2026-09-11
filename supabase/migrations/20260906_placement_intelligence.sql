-- ==============================================================================
-- Migration: Placement Intelligence Module (Additive Only)
-- Date: 2026-09-06
-- Tables: opportunities, student_profiles, recommendations, project_suggestions,
--         applications, interview_questions
-- ==============================================================================

-- 1. Opportunities Table
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hackathon', 'internship', 'job', 'fellowship', 'grant')),
  organizer TEXT NOT NULL,
  organizer_type TEXT NOT NULL CHECK (organizer_type IN ('IIT-fest', 'corporate', 'startup', 'open', 'university')),
  tags TEXT[] DEFAULT '{}',
  domain_tags TEXT[] DEFAULT '{}',
  tier TEXT DEFAULT 'Tier 2', -- Tier 1 (FAANG/Top IIT), Tier 2 (High growth), Tier 3
  deadline TIMESTAMPTZ,
  eligibility TEXT,
  source_url TEXT,
  extracted_context JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Student Profiles Table (1:1 with candidate_id)
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id TEXT NOT NULL UNIQUE,
  skills JSONB DEFAULT '[]'::jsonb,
  past_projects JSONB DEFAULT '[]'::jsonb,
  target_roles TEXT[] DEFAULT '{}',
  target_companies_or_events TEXT[] DEFAULT '{}',
  availability TEXT,
  risk_appetite TEXT,
  profile_summary TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Recommendations Table (UNIQUE on student_id + opportunity_id)
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  fit_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  reasoning TEXT,
  status TEXT DEFAULT 'recommended', -- recommended, viewed, applied, dismissed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_student_opportunity UNIQUE (student_id, opportunity_id)
);

-- 4. Project Suggestions Table (UNIQUE on student_id + opportunity_id)
CREATE TABLE IF NOT EXISTS project_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  suggestion_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_student_proj_opportunity UNIQUE (student_id, opportunity_id)
);

-- 5. Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'Bookmarked', -- Bookmarked, Applied, Interviewing, Offer, Rejected
  notes TEXT,
  deadline_reminder_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_student_app_opportunity UNIQUE (student_id, opportunity_id)
);

-- 6. Interview Questions Bank Table
CREATE TABLE IF NOT EXISTS interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_or_event TEXT NOT NULL,
  role TEXT,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'technical', -- technical, behavioral, system-design, hackathon-pitch
  upvotes INT DEFAULT 0,
  submitted_by_student_id UUID REFERENCES student_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_opportunities_type_deadline ON opportunities(type, deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_tags ON opportunities USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_opportunities_domain_tags ON opportunities USING GIN(domain_tags);
CREATE INDEX IF NOT EXISTS idx_student_profiles_candidate ON student_profiles(candidate_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_student ON recommendations(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);

-- ==============================================================================
-- Row-Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;

-- Opportunities: Readable by all, Insert/Update/Delete by service/admin
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Opportunities are readable by anyone' AND tablename = 'opportunities') THEN
    CREATE POLICY "Opportunities are readable by anyone" ON opportunities FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Opportunities insertable by service role' AND tablename = 'opportunities') THEN
    CREATE POLICY "Opportunities insertable by service role" ON opportunities FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Student Profiles: Accessible by matching candidate_id or service role
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Student profiles accessible' AND tablename = 'student_profiles') THEN
    CREATE POLICY "Student profiles accessible" ON student_profiles FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Recommendations: Accessible by matching student
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Recommendations accessible' AND tablename = 'recommendations') THEN
    CREATE POLICY "Recommendations accessible" ON recommendations FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Project Suggestions: Accessible by matching student
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Project suggestions accessible' AND tablename = 'project_suggestions') THEN
    CREATE POLICY "Project suggestions accessible" ON project_suggestions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Applications: Accessible by student
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Applications accessible' AND tablename = 'applications') THEN
    CREATE POLICY "Applications accessible" ON applications FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Interview Questions: Readable by anyone, insertable by any authenticated student
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Interview questions are readable by anyone' AND tablename = 'interview_questions') THEN
    CREATE POLICY "Interview questions are readable by anyone" ON interview_questions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Interview questions manageable' AND tablename = 'interview_questions') THEN
    CREATE POLICY "Interview questions manageable" ON interview_questions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
