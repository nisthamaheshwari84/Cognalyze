-- ============================================================================
-- COGNALYZE: Code Comprehension Lab Upgrade (Migration 20261110_code_comprehension_upgrade)
-- User Repository Exposure Tracking, Guided Practice Attempts, and
-- Multi-Turn Interview Simulation Persistence with Strict Multi-Tenant Isolation
-- ============================================================================

-- 1. User Repository Exposure History Table
CREATE TABLE IF NOT EXISTS user_repository_exposure (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 TEXT NOT NULL,
  tenant_id               TEXT NOT NULL DEFAULT 'default-tenant',
  repository_id           TEXT NOT NULL,
  exposed_in_context      TEXT NOT NULL, -- 'foundations', 'visual_trace', 'practice', 'explorer', 'interview'
  first_exposed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_exposed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposure_count          INTEGER NOT NULL DEFAULT 1,
  is_interview_eligible   BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_repo_context UNIQUE (user_id, repository_id, exposed_in_context)
);

-- 2. Guided Practice Question Attempts Table
CREATE TABLE IF NOT EXISTS guided_practice_attempts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 TEXT NOT NULL,
  tenant_id               TEXT NOT NULL DEFAULT 'default-tenant',
  question_id             TEXT NOT NULL,
  repository_id           TEXT NOT NULL,
  category                TEXT NOT NULL,
  difficulty              TEXT NOT NULL,
  selected_option_id      TEXT,
  selected_file           TEXT,
  selected_line           INTEGER,
  is_correct              BOOLEAN NOT NULL,
  hints_used              INTEGER NOT NULL DEFAULT 0,
  score_awarded           INTEGER NOT NULL DEFAULT 0, -- 0 - 100
  attempt_timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Comprehension Interview Sessions Table (Independent Unseen Repos)
CREATE TABLE IF NOT EXISTS comprehension_interview_sessions (
  id                      TEXT PRIMARY KEY,
  user_id                 TEXT NOT NULL,
  tenant_id               TEXT NOT NULL DEFAULT 'default-tenant',
  repository_id           TEXT NOT NULL,
  target_role             TEXT NOT NULL, -- 'backend_engineer', 'fullstack_engineer', 'systems_architect', 'ai_engineer', 'security_engineer'
  difficulty              TEXT NOT NULL DEFAULT 'senior', -- 'mid', 'senior', 'staff'
  status                  TEXT NOT NULL DEFAULT 'active', -- 'active', 'evaluating', 'completed', 'abandoned'
  current_round           TEXT NOT NULL DEFAULT 'walkthrough', -- 'walkthrough', 'debugging', 'system_design', 'pr_review'
  turn_count              INTEGER NOT NULL DEFAULT 1,
  dialogue_history        JSONB NOT NULL DEFAULT '[]',
  evaluation_report       JSONB,
  dna_synced              BOOLEAN NOT NULL DEFAULT false,
  started_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Micro-Lesson Interaction Attempts (Foundations Micro-Learning)
CREATE TABLE IF NOT EXISTS micro_lesson_attempts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 TEXT NOT NULL,
  tenant_id               TEXT NOT NULL DEFAULT 'default-tenant',
  module_id               TEXT NOT NULL,
  lesson_id               TEXT NOT NULL,
  exercise_id             TEXT NOT NULL,
  selected_option_id      TEXT,
  is_correct              BOOLEAN NOT NULL,
  attempts_count          INTEGER NOT NULL DEFAULT 1,
  completed_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_lesson UNIQUE (user_id, lesson_id)
);

-- 5. Visual Dry Run Execution Traces Progress
CREATE TABLE IF NOT EXISTS dry_run_progress (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 TEXT NOT NULL,
  tenant_id               TEXT NOT NULL DEFAULT 'default-tenant',
  workflow_id             TEXT NOT NULL,
  pedagogical_mode        TEXT NOT NULL, -- 'I_DO', 'WE_DO', 'YOU_DO'
  completed_steps         INTEGER NOT NULL DEFAULT 0,
  total_steps             INTEGER NOT NULL,
  predictions_correct     INTEGER NOT NULL DEFAULT 0,
  predictions_total       INTEGER NOT NULL DEFAULT 0,
  is_completed            BOOLEAN NOT NULL DEFAULT false,
  last_traced_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_workflow_mode UNIQUE (user_id, workflow_id, pedagogical_mode)
);

-- 6. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_user_repo_exposure ON user_repository_exposure(user_id, repository_id);
CREATE INDEX IF NOT EXISTS idx_user_repo_tenant ON user_repository_exposure(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_user ON guided_practice_attempts(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_cat ON guided_practice_attempts(category, difficulty);
CREATE INDEX IF NOT EXISTS idx_interview_sess_user ON comprehension_interview_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_interview_sess_repo ON comprehension_interview_sessions(repository_id);
CREATE INDEX IF NOT EXISTS idx_micro_lesson_user ON micro_lesson_attempts(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_dry_run_user ON dry_run_progress(user_id, workflow_id);

-- 7. Row-Level Security Policies (Multi-Tenant Isolation)
ALTER TABLE user_repository_exposure ENABLE ROW LEVEL SECURITY;
ALTER TABLE guided_practice_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprehension_interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE micro_lesson_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dry_run_progress ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY user_repo_exposure_isolation
    ON user_repository_exposure FOR ALL
    USING (user_id = auth.uid()::text OR auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY practice_attempts_isolation
    ON guided_practice_attempts FOR ALL
    USING (user_id = auth.uid()::text OR auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY interview_sessions_isolation
    ON comprehension_interview_sessions FOR ALL
    USING (user_id = auth.uid()::text OR auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY micro_lesson_attempts_isolation
    ON micro_lesson_attempts FOR ALL
    USING (user_id = auth.uid()::text OR auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY dry_run_progress_isolation
    ON dry_run_progress FOR ALL
    USING (user_id = auth.uid()::text OR auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

