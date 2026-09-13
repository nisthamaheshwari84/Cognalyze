-- Migration: AI Opportunity & Team Formation Engine
-- Includes Problem Statements, Interactions, Team Formations, and Members

CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Problem Statements Knowledge Base
CREATE TABLE IF NOT EXISTS problem_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  domain TEXT,
  sub_domain TEXT,
  required_skills TEXT[] DEFAULT '{}',
  fundamental_skills TEXT[] DEFAULT '{}',
  difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'Hard')),
  real_world_problem TEXT NOT NULL,
  suggested_tech_stack TEXT[] DEFAULT '{}',
  core_features TEXT[] DEFAULT '{}',
  future_scope TEXT[] DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Student PS Interactions
CREATE TABLE IF NOT EXISTS student_ps_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  ps_id UUID REFERENCES problem_statements(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('shown', 'viewed', 'saved', 'rejected', 'applied', 'selected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Team Formations
CREATE TABLE IF NOT EXISTS team_formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ps_id UUID REFERENCES problem_statements(id) ON DELETE CASCADE,
  initiating_student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'forming' CHECK (status IN ('forming', 'complete', 'disbanded')),
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Team Members
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES team_formations(id) ON DELETE CASCADE,
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  role_contribution TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_team_student UNIQUE (team_id, student_id)
);

-- 5. Add opt-in flag to student_profiles if not exists
ALTER TABLE IF EXISTS student_profiles 
ADD COLUMN IF NOT EXISTS team_match_opt_in BOOLEAN DEFAULT true;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ps_opportunity ON problem_statements(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_ps_domain ON problem_statements(domain);
CREATE INDEX IF NOT EXISTS idx_ps_interactions_student ON student_ps_interactions(student_id);
CREATE INDEX IF NOT EXISTS idx_ps_interactions_ps ON student_ps_interactions(ps_id);
CREATE INDEX IF NOT EXISTS idx_team_formations_ps ON team_formations(ps_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
