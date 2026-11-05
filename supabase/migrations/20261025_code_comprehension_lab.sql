-- ============================================================================
-- COGNALYZE: Code Comprehension Lab Schema (Migration 20261025_code_comprehension_lab)
-- Multi-file Codebase Intelligence, Challenge Sessions, Events, Sandboxed Runs,
-- 100-Point Evidence Rubrics, and Student DNA Integration
-- ============================================================================

-- 1. Codebase Library Table
CREATE TABLE IF NOT EXISTS codebases (
  id                  TEXT PRIMARY KEY,
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  source_type         TEXT NOT NULL DEFAULT 'cognalyze_owned', -- 'cognalyze_owned', 'open_source', 'ai_generated', 'partner'
  language            TEXT NOT NULL,
  framework           TEXT NOT NULL,
  version             TEXT NOT NULL DEFAULT '1.0.0',
  immutable_snapshot  TEXT NOT NULL,
  manifest            JSONB NOT NULL DEFAULT '{}',
  architecture_graph  JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Comprehension Challenges Table
CREATE TABLE IF NOT EXISTS comprehension_challenges (
  id                  TEXT PRIMARY KEY,
  codebase_id         TEXT NOT NULL REFERENCES codebases(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  mode                TEXT NOT NULL, -- 'detective', 'bug_hunter', 'architecture_explorer', 'ai_auditor'
  difficulty          TEXT NOT NULL, -- 'beginner', 'intermediate', 'advanced'
  learning_objectives TEXT[] NOT NULL DEFAULT '{}',
  instructions        TEXT NOT NULL,
  rubric_version      TEXT NOT NULL DEFAULT '1.0-canonical-100pt',
  rubric_weights      JSONB NOT NULL DEFAULT '{}',
  test_suite_meta     JSONB NOT NULL DEFAULT '{}',
  is_published        BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Comprehension Practice Sessions
CREATE TABLE IF NOT EXISTS comprehension_sessions (
  id                  TEXT PRIMARY KEY,
  candidate_id        TEXT NOT NULL,
  challenge_id        TEXT NOT NULL REFERENCES comprehension_challenges(id) ON DELETE CASCADE,
  practice_mode       TEXT NOT NULL DEFAULT 'practice', -- 'learn', 'practice', 'interview'
  status              TEXT NOT NULL DEFAULT 'active',   -- 'active', 'evaluating', 'completed', 'timed_out'
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  active_files        JSONB NOT NULL DEFAULT '{}',      -- Student edits/working tree diffs
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Comprehension Events & Investigation Telemetry
CREATE TABLE IF NOT EXISTS comprehension_events (
  id                  TEXT PRIMARY KEY,
  session_id          TEXT NOT NULL REFERENCES comprehension_sessions(id) ON DELETE CASCADE,
  candidate_id        TEXT NOT NULL,
  event_type          TEXT NOT NULL, -- 'file_open', 'hypothesis_formulate', 'tutor_query', 'test_run', 'fix_propose'
  payload             JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Comprehension Assessments (100-Point Canonical Evidence)
CREATE TABLE IF NOT EXISTS comprehension_assessments (
  id                  TEXT PRIMARY KEY,
  session_id          TEXT NOT NULL UNIQUE REFERENCES comprehension_sessions(id) ON DELETE CASCADE,
  candidate_id        TEXT NOT NULL,
  challenge_id        TEXT NOT NULL,
  overall_score       NUMERIC(5,2) NOT NULL,
  dimension_scores    JSONB NOT NULL DEFAULT '{}',
  evidence_records    JSONB NOT NULL DEFAULT '[]',
  feedback            JSONB NOT NULL DEFAULT '{}',
  dna_sync_status     TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'synced', 'skipped'
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Indexes for High-Throughput Retrieval
CREATE INDEX IF NOT EXISTS idx_codebases_lang ON codebases(language, framework);
CREATE INDEX IF NOT EXISTS idx_comprehension_challenges_codebase ON comprehension_challenges(codebase_id);
CREATE INDEX IF NOT EXISTS idx_comprehension_sessions_candidate ON comprehension_sessions(candidate_id, status);
CREATE INDEX IF NOT EXISTS idx_comprehension_events_session ON comprehension_events(session_id);
CREATE INDEX IF NOT EXISTS idx_comprehension_assessments_candidate ON comprehension_assessments(candidate_id);

-- 7. Row Level Security Policies (Multi-tenant Isolation)
ALTER TABLE comprehension_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprehension_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprehension_assessments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY comprehension_sessions_user_isolation
    ON comprehension_sessions FOR ALL
    USING (candidate_id = auth.uid()::text OR auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY comprehension_events_user_isolation
    ON comprehension_events FOR ALL
    USING (candidate_id = auth.uid()::text OR auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY comprehension_assessments_user_isolation
    ON comprehension_assessments FOR ALL
    USING (candidate_id = auth.uid()::text OR auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
