-- ============================================================================
-- COGNALYZE GD ARENA — PHASE 2 DATABASE SCHEMA, MEMBERSHIP RLS & HARDENING
-- Migration: 20261125_gd_arena_phase2_hardening.sql
--
-- Goals:
-- 1. Close permissive RLS leaks from 20261124_group_discussion_arena.sql.
-- 2. Enforce strict tenant & Friends-Room membership isolation.
-- 3. Add durable student tables for transcripts, evaluations, skills lab
--    progress, and topic deduplication history.
-- ============================================================================

-- ── 1. HARDEN EXISTING RLS POLICIES ──────────────────────────────────────────

ALTER TABLE IF EXISTS public.gd_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gd_friends_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gd_disciplinary_records ENABLE ROW LEVEL SECURITY;

-- Drop over-permissive 20261124 policies
DROP POLICY IF EXISTS "Users can access own gd sessions" ON public.gd_sessions;
DROP POLICY IF EXISTS "Authenticated users can access friends rooms" ON public.gd_friends_rooms;
DROP POLICY IF EXISTS "Users can view own disciplinary records" ON public.gd_disciplinary_records;

-- Strict gd_sessions policy: owner OR explicit member of the linked Friends room
CREATE POLICY "Students access own or joined friends gd sessions"
  ON public.gd_sessions
  FOR ALL
  USING (
    auth.uid()::text = user_id
    OR (
      is_friends_room = TRUE
      AND friends_room_code IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.gd_friends_rooms r
        WHERE r.room_code = gd_sessions.friends_room_code
          AND (
            r.host_user_id = auth.uid()::text
            OR r.participants @> jsonb_build_array(jsonb_build_object('userId', auth.uid()::text))
          )
      )
    )
  )
  WITH CHECK (auth.uid()::text = user_id);

-- Strict gd_friends_rooms policy: host OR joined participant only
CREATE POLICY "Room host and members access friends rooms"
  ON public.gd_friends_rooms
  FOR ALL
  USING (
    auth.uid()::text = host_user_id
    OR participants @> jsonb_build_array(jsonb_build_object('userId', auth.uid()::text))
  )
  WITH CHECK (
    auth.uid()::text = host_user_id
    OR participants @> jsonb_build_array(jsonb_build_object('userId', auth.uid()::text))
  );

-- Strict disciplinary records: candidate read-only view of own logs
CREATE POLICY "Students view own gd disciplinary records"
  ON public.gd_disciplinary_records
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- ── 2. GD ROOM MESSAGES / NORMALIZED TRANSCRIPTS ────────────────────────────
CREATE TABLE IF NOT EXISTS public.gd_room_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES public.gd_sessions(id) ON DELETE CASCADE,
    room_code TEXT,
    user_id TEXT NOT NULL,
    speaker_id TEXT NOT NULL,
    speaker_name TEXT NOT NULL,
    speaker_role TEXT NOT NULL,
    is_human BOOLEAN NOT NULL DEFAULT FALSE,
    is_coach BOOLEAN NOT NULL DEFAULT FALSE,
    stage TEXT NOT NULL DEFAULT 'active_discussion',
    content TEXT NOT NULL,
    timestamp_ms BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gd_room_messages_session ON public.gd_room_messages(session_id, timestamp_ms ASC);
CREATE INDEX IF NOT EXISTS idx_gd_room_messages_user ON public.gd_room_messages(user_id);

ALTER TABLE public.gd_room_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students access own gd messages" ON public.gd_room_messages;
CREATE POLICY "Students access own gd messages"
  ON public.gd_room_messages
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ── 3. VERIFIED GD EVALUATIONS (PER-STUDENT SCORECARD & DNA SYNC) ───────────
CREATE TABLE IF NOT EXISTS public.gd_evaluations (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES public.gd_sessions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    topic_title TEXT NOT NULL,
    format TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    overall_score INTEGER NOT NULL,
    hiring_verdict TEXT NOT NULL,
    speaking_turn_count INTEGER NOT NULL DEFAULT 0,
    dimension_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
    full_report JSONB NOT NULL,
    dna_synced BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gd_evaluations_user_created ON public.gd_evaluations(user_id, created_at DESC);

ALTER TABLE public.gd_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students access own gd evaluations" ON public.gd_evaluations;
CREATE POLICY "Students access own gd evaluations"
  ON public.gd_evaluations
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ── 4. GD SKILLS LAB PROGRESS & STREAKS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gd_skills_lab_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    track_id TEXT NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    best_score INTEGER,
    latest_score INTEGER,
    last_feedback JSONB,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_gd_skills_lab_user ON public.gd_skills_lab_progress(user_id);

ALTER TABLE public.gd_skills_lab_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage own skills lab progress" ON public.gd_skills_lab_progress;
CREATE POLICY "Students manage own skills lab progress"
  ON public.gd_skills_lab_progress
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ── 5. GD TOPIC GENERATION & DEDUPLICATION HISTORY ──────────────────────────
CREATE TABLE IF NOT EXISTS public.gd_topic_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    topic_title TEXT NOT NULL,
    domain TEXT,
    category TEXT,
    difficulty TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gd_topic_history_user ON public.gd_topic_history(user_id, created_at DESC);

ALTER TABLE public.gd_topic_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage own gd topic history" ON public.gd_topic_history;
CREATE POLICY "Students manage own gd topic history"
  ON public.gd_topic_history
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
