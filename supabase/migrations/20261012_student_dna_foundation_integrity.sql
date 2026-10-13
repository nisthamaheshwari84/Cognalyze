-- ============================================================================
-- COGNALYZE MIGRATION: STUDENT DNA FOUNDATION & DATA INTEGRITY
-- Phase 1 Foundation, Validation & Integrity
-- ============================================================================

-- 1. Student Profiles Foundation Integrity Constraints
DO $$ 
BEGIN
  -- Phone constraint: If provided, must match Indian mobile format or valid E.164
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_student_profiles_phone'
  ) THEN
    ALTER TABLE IF EXISTS public.student_profiles
      ADD CONSTRAINT chk_student_profiles_phone
      CHECK (phone IS NULL OR phone = '' OR phone ~ '^\+?[0-9\s\-]{10,16}$');
  END IF;

  -- Graduation year constraint: 4-digit valid year range
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_student_profiles_grad_year'
  ) THEN
    ALTER TABLE IF EXISTS public.student_profiles
      ADD CONSTRAINT chk_student_profiles_grad_year
      CHECK (graduation_year IS NULL OR graduation_year = '' OR graduation_year ~ '^[12][0-9]{3}$');
  END IF;
END $$;

-- 2. Performance Indexing for Location & Institution Queries
CREATE INDEX IF NOT EXISTS idx_student_profiles_location ON public.student_profiles(location);
CREATE INDEX IF NOT EXISTS idx_student_profiles_college ON public.student_profiles(college);

-- 3. Documented Migration Comments
COMMENT ON TABLE public.student_profiles IS 'Student DNA Foundation records with enforced data integrity and multi-tenant isolation.';
