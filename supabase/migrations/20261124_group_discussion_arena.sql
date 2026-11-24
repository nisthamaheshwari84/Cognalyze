-- ============================================================================
-- COGNALYZE GROUP DISCUSSION ARENA & DISCIPLINARY SYSTEM SCHEMA
-- Migration: 20261124_group_discussion_arena.sql
-- ============================================================================

-- 1. GD SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.gd_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    topic_title TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'competitive',
    difficulty TEXT NOT NULL DEFAULT 'intermediate',
    lifecycle_state TEXT NOT NULL DEFAULT 'BRIEFING',
    current_stage TEXT NOT NULL DEFAULT 'briefing',
    total_duration_seconds INTEGER NOT NULL DEFAULT 900,
    is_friends_room BOOLEAN NOT NULL DEFAULT FALSE,
    friends_room_code TEXT,
    participants JSONB NOT NULL DEFAULT '[]'::jsonb,
    transcripts JSONB NOT NULL DEFAULT '[]'::jsonb,
    moderation_incidents JSONB NOT NULL DEFAULT '[]'::jsonb,
    student_warning_count INTEGER NOT NULL DEFAULT 0,
    evaluation_report JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gd_sessions_user_id ON public.gd_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_gd_sessions_created_at ON public.gd_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gd_sessions_room_code ON public.gd_sessions(friends_room_code) WHERE friends_room_code IS NOT NULL;

-- 2. FRIENDS MULTIPLAYER ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.gd_friends_rooms (
    id TEXT PRIMARY KEY,
    room_code TEXT UNIQUE NOT NULL,
    host_user_id TEXT NOT NULL,
    topic_title TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'competitive',
    difficulty TEXT NOT NULL DEFAULT 'intermediate',
    duration_minutes INTEGER NOT NULL DEFAULT 15,
    status TEXT NOT NULL DEFAULT 'WAITING_ROOM',
    max_participants INTEGER NOT NULL DEFAULT 6,
    participants JSONB NOT NULL DEFAULT '[]'::jsonb,
    active_session_id TEXT REFERENCES public.gd_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gd_friends_rooms_code ON public.gd_friends_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_gd_friends_rooms_host ON public.gd_friends_rooms(host_user_id);

-- 3. GD DISCIPLINARY RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.gd_disciplinary_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    is_friends_room BOOLEAN NOT NULL DEFAULT FALSE,
    room_code TEXT,
    warning_number INTEGER NOT NULL CHECK (warning_number IN (1, 2, 3)),
    severity TEXT NOT NULL,
    violation_category TEXT NOT NULL,
    evidence_quote TEXT NOT NULL,
    context_summary TEXT NOT NULL,
    moderator_utterance TEXT NOT NULL,
    suspension_duration_hours INTEGER,
    suspension_started_at TIMESTAMPTZ,
    suspension_expires_at TIMESTAMPTZ,
    appeal_token TEXT UNIQUE NOT NULL,
    appeal_status TEXT NOT NULL DEFAULT 'NONE',
    appeal_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gd_disciplinary_user ON public.gd_disciplinary_records(user_id);
CREATE INDEX IF NOT EXISTS idx_gd_disciplinary_session ON public.gd_disciplinary_records(session_id);

-- 4. RLS POLICIES FOR USER ISOLATION
ALTER TABLE public.gd_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gd_friends_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gd_disciplinary_records ENABLE ROW LEVEL SECURITY;

-- GD Sessions: Users can view and manage their own sessions, or sessions of friends rooms they are in
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can access own gd sessions') THEN
        CREATE POLICY "Users can access own gd sessions" ON public.gd_sessions
            FOR ALL USING (auth.uid()::text = user_id OR is_friends_room = true);
    END IF;
END $$;

-- Friends Rooms: Authenticated users can view and join rooms
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can access friends rooms') THEN
        CREATE POLICY "Authenticated users can access friends rooms" ON public.gd_friends_rooms
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Disciplinary Records: Users can view their own disciplinary history
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own disciplinary records') THEN
        CREATE POLICY "Users can view own disciplinary records" ON public.gd_disciplinary_records
            FOR SELECT USING (auth.uid()::text = user_id);
    END IF;
END $$;
