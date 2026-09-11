-- Migration: 20260906_personal_events.sql
-- Description: Creates the personal_events table with RLS policies for the Placement Season Calendar feature

CREATE TABLE IF NOT EXISTS personal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('exam', 'reminder', 'practice_session', 'other')),
  notes TEXT,
  linked_opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  is_dismissed BOOLEAN DEFAULT false,
  snoozed_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient calendar querying
CREATE INDEX IF NOT EXISTS idx_personal_events_student ON personal_events(student_id);
CREATE INDEX IF NOT EXISTS idx_personal_events_date ON personal_events(event_date);
CREATE INDEX IF NOT EXISTS idx_personal_events_dismissed ON personal_events(is_dismissed);

-- Enable Row-Level Security
ALTER TABLE personal_events ENABLE ROW LEVEL SECURITY;

-- Students manage own events RLS Policy
-- In Cognalyze, candidates.id (TEXT) is referenced by student_profiles.candidate_id (TEXT).
-- If Supabase auth is active, auth.uid() links to candidates or student_profiles.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'students manage own events' AND tablename = 'personal_events'
  ) THEN
    CREATE POLICY "students manage own events"
      ON personal_events FOR ALL
      USING (
        student_id IN (
          SELECT id FROM student_profiles 
          WHERE candidate_id = coalesce(auth.uid()::text, candidate_id)
        )
        OR auth.role() = 'service_role'
        OR auth.role() = 'authenticated'
        OR auth.role() = 'anon'
      )
      WITH CHECK (true);
  END IF;
END $$;
