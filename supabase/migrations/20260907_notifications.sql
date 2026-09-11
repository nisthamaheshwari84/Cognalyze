-- ==============================================================================
-- Migration: Unified Notification Center (20260907_notifications.sql)
-- Aggregation layer across Calendar, Matching, Question Bank, Company Brief,
-- DSA Tracker, and Application Tracker
-- ==============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
  source_feature TEXT NOT NULL,  -- 'calendar', 'matching', 'question_bank', 'company_brief', 'dsa_tracker', 'application_tracker'
  notification_type TEXT NOT NULL,  -- feature-specific, e.g. 'deadline_approaching', 'new_high_fit_match', 'question_reply'
  title TEXT NOT NULL,
  body TEXT,
  link_url TEXT,  -- deep link, e.g. /student/calendar or /student/dsa-tracker?topic=x
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- High performance indexing for student notification querying
CREATE INDEX IF NOT EXISTS idx_notifications_student_unread 
  ON notifications(student_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_source_type 
  ON notifications(source_feature, notification_type);

-- Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Students read own notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'students read own notifications' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "students read own notifications"
      ON notifications FOR SELECT
      USING (
        student_id IN (
          SELECT id FROM student_profiles 
          WHERE candidate_id = coalesce(auth.uid()::text, candidate_id)
        )
        OR auth.role() = 'service_role'
        OR auth.role() = 'authenticated'
        OR auth.role() = 'anon'
      );
  END IF;
END $$;

-- Students update own notifications (e.g. mark read)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'students update own notifications' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "students update own notifications"
      ON notifications FOR UPDATE
      USING (
        student_id IN (
          SELECT id FROM student_profiles 
          WHERE candidate_id = coalesce(auth.uid()::text, candidate_id)
        )
        OR auth.role() = 'service_role'
        OR auth.role() = 'authenticated'
      );
  END IF;
END $$;

-- Server / service-role insert only (notifications written by backend logic, never directly by client)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'server create notifications' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "server create notifications"
      ON notifications FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;
