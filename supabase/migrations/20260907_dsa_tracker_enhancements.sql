-- ==============================================================================
-- Migration: DSA Tracker Full Enhancement Suite
-- Date: 2026-09-07
-- Tables: dsa_topics, dsa_problems, dsa_progress, student_connections,
--         student_leaderboard_preferences, student_badges, student_dsa_goals
-- ==============================================================================

-- 1. Topics Table
CREATE TABLE IF NOT EXISTS dsa_topics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Problems Table
CREATE TABLE IF NOT EXISTS dsa_problems (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES dsa_topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  problem_url TEXT,
  description TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Student Progress Table (with Phase 1 & 4 enhancements)
CREATE TABLE IF NOT EXISTS dsa_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  problem_id TEXT NOT NULL REFERENCES dsa_problems(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'unsolved' CHECK (status IN ('unsolved', 'attempted', 'solved')),
  previous_status TEXT, -- Tracks if ever marked 'attempted' prior to 'solved'
  time_spent_seconds INT DEFAULT 0,
  next_review_date DATE,
  review_count INT DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  notes TEXT,
  solved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_student_dsa_problem UNIQUE (student_id, problem_id)
);

-- 4. Social Layer: Mutual Connections (Phase 4a)
CREATE TABLE IF NOT EXISTS student_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_student_id TEXT NOT NULL,
  recipient_student_id TEXT NOT NULL,
  connection_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_mutual_connection UNIQUE (requester_student_id, recipient_student_id)
);

-- 5. Social Layer: Leaderboard Preferences (Phase 4b)
CREATE TABLE IF NOT EXISTS student_leaderboard_preferences (
  student_id TEXT PRIMARY KEY,
  is_opted_in BOOLEAN DEFAULT false,
  display_handle TEXT NOT NULL,
  college_name TEXT DEFAULT 'Engineering Institute',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Milestone Badges (Phase 5a)
CREATE TABLE IF NOT EXISTS student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_student_badge UNIQUE (student_id, badge_type)
);

-- 7. Daily Goals (Phase 5b)
CREATE TABLE IF NOT EXISTS student_dsa_goals (
  student_id TEXT PRIMARY KEY,
  daily_target INT DEFAULT 2,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_dsa_problems_topic ON dsa_problems(topic_id);
CREATE INDEX IF NOT EXISTS idx_dsa_progress_student ON dsa_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_dsa_progress_review ON dsa_progress(student_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_student_connections ON student_connections(requester_student_id, recipient_student_id);
