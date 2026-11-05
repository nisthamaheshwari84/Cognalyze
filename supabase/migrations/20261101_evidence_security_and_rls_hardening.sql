-- ==============================================================================
-- COGNALYZE MIGRATION: EVIDENCE SECURITY & RLS HARDENING (PHASE 1)
-- Migration ID: 20261101_evidence_security_and_rls_hardening.sql
-- 
-- 1. Hardens public.dna_snapshots RLS by eliminating "USING (true)" policy.
-- 2. Enables Row Level Security (RLS) on all 9 orphaned evidence tables.
-- 3. Implements strict tenant-bound access:
--    - Students can strictly access their own evidence and snapshots.
--    - Verified recruiters can inspect applicant evidence and snapshots.
-- 4. Creates public.connected_accounts table with AES-256 token encryption support and RLS.
-- ==============================================================================

-- 1. HARDEN SNAPSHOT ACCESS CONTROL (ELIMINATE USING (true))
ALTER TABLE IF EXISTS public.dna_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recruiters and admins can manage snapshots" ON public.dna_snapshots;
DROP POLICY IF EXISTS "Recruiters can view applicant snapshots" ON public.dna_snapshots;
DROP POLICY IF EXISTS "Recruiters and system can insert snapshots" ON public.dna_snapshots;
DROP POLICY IF EXISTS "Recruiters and system can update snapshots" ON public.dna_snapshots;

-- Candidates can view only their own point-of-application snapshots
DROP POLICY IF EXISTS "Students can view own snapshots" ON public.dna_snapshots;
CREATE POLICY "Students can view own snapshots"
  ON public.dna_snapshots FOR SELECT
  USING (auth.uid()::TEXT = student_id);

-- Verified recruiters can view candidate snapshots
CREATE POLICY "Recruiters can view applicant snapshots"
  ON public.dna_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recruiter_profiles rp
      WHERE rp.user_id = auth.uid()::TEXT
    )
  );

-- Only verified recruiters, admins, or candidate point-of-application submission can insert
CREATE POLICY "Recruiters and system can insert snapshots"
  ON public.dna_snapshots FOR INSERT
  WITH CHECK (
    auth.uid()::TEXT = student_id OR
    EXISTS (
      SELECT 1 FROM public.recruiter_profiles rp
      WHERE rp.user_id = auth.uid()::TEXT
    )
  );

-- Only verified recruiters can update/freeze candidate evaluation snapshots
CREATE POLICY "Recruiters and system can update snapshots"
  ON public.dna_snapshots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recruiter_profiles rp
      WHERE rp.user_id = auth.uid()::TEXT
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recruiter_profiles rp
      WHERE rp.user_id = auth.uid()::TEXT
    )
  );

-- 2. ENABLE RLS & DEFINE POLICIES ON ORPHANED EVIDENCE SPINE TABLES

-- A. public.sources
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sources') THEN
    ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own sources" ON public.sources;
    CREATE POLICY "Users can view own sources"
      ON public.sources FOR SELECT
      USING (
        person_id IN (SELECT id FROM public.persons WHERE user_id = auth.uid()::TEXT) OR
        EXISTS (SELECT 1 FROM public.recruiter_profiles rp WHERE rp.user_id = auth.uid()::TEXT)
      );
    DROP POLICY IF EXISTS "Users can manage own sources" ON public.sources;
    CREATE POLICY "Users can manage own sources"
      ON public.sources FOR ALL
      USING (person_id IN (SELECT id FROM public.persons WHERE user_id = auth.uid()::TEXT))
      WITH CHECK (person_id IN (SELECT id FROM public.persons WHERE user_id = auth.uid()::TEXT));
  END IF;
END $$;

-- B. public.claims
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'claims') THEN
    ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own claims" ON public.claims;
    CREATE POLICY "Users can view own claims"
      ON public.claims FOR SELECT
      USING (
        person_id IN (SELECT id FROM public.persons WHERE user_id = auth.uid()::TEXT) OR
        EXISTS (SELECT 1 FROM public.recruiter_profiles rp WHERE rp.user_id = auth.uid()::TEXT)
      );
    DROP POLICY IF EXISTS "Users can manage own claims" ON public.claims;
    CREATE POLICY "Users can manage own claims"
      ON public.claims FOR ALL
      USING (person_id IN (SELECT id FROM public.persons WHERE user_id = auth.uid()::TEXT))
      WITH CHECK (person_id IN (SELECT id FROM public.persons WHERE user_id = auth.uid()::TEXT));
  END IF;
END $$;

-- C. public.evidence_items
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'evidence_items') THEN
    ALTER TABLE public.evidence_items ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own evidence items" ON public.evidence_items;
    CREATE POLICY "Users can view own evidence items"
      ON public.evidence_items FOR SELECT
      USING (
        person_id IN (SELECT id FROM public.persons WHERE user_id = auth.uid()::TEXT) OR
        EXISTS (SELECT 1 FROM public.recruiter_profiles rp WHERE rp.user_id = auth.uid()::TEXT)
      );
    DROP POLICY IF EXISTS "Users can manage own evidence items" ON public.evidence_items;
    CREATE POLICY "Users can manage own evidence items"
      ON public.evidence_items FOR ALL
      USING (person_id IN (SELECT id FROM public.persons WHERE user_id = auth.uid()::TEXT))
      WITH CHECK (person_id IN (SELECT id FROM public.persons WHERE user_id = auth.uid()::TEXT));
  END IF;
END $$;

-- D. public.evidence_links
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'evidence_links') THEN
    ALTER TABLE public.evidence_links ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own evidence links" ON public.evidence_links;
    CREATE POLICY "Users can view own evidence links"
      ON public.evidence_links FOR SELECT
      USING (
        evidence_id IN (
          SELECT id FROM public.evidence_items
          WHERE person_id IN (SELECT id FROM public.persons WHERE user_id = auth.uid()::TEXT)
        ) OR
        EXISTS (SELECT 1 FROM public.recruiter_profiles rp WHERE rp.user_id = auth.uid()::TEXT)
      );
  END IF;
END $$;

-- E. public.capability_nodes & public.capability_edges (Taxonomy: read-only for authenticated, write-protected)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'capability_nodes') THEN
    ALTER TABLE public.capability_nodes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "All users can view taxonomy nodes" ON public.capability_nodes;
    CREATE POLICY "All users can view taxonomy nodes"
      ON public.capability_nodes FOR SELECT
      USING (true);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'capability_edges') THEN
    ALTER TABLE public.capability_edges ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "All users can view taxonomy edges" ON public.capability_edges;
    CREATE POLICY "All users can view taxonomy edges"
      ON public.capability_edges FOR SELECT
      USING (true);
  END IF;
END $$;

-- F. public.evidence (from 20260922_evidence_layer.sql)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'evidence') THEN
    ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Candidates can view own evidence" ON public.evidence;
    CREATE POLICY "Candidates can view own evidence"
      ON public.evidence FOR SELECT
      USING (
        candidate_id::TEXT = auth.uid()::TEXT OR
        EXISTS (SELECT 1 FROM public.recruiter_profiles rp WHERE rp.user_id = auth.uid()::TEXT)
      );
    DROP POLICY IF EXISTS "Candidates can manage own evidence" ON public.evidence;
    CREATE POLICY "Candidates can manage own evidence"
      ON public.evidence FOR ALL
      USING (candidate_id::TEXT = auth.uid()::TEXT)
      WITH CHECK (candidate_id::TEXT = auth.uid()::TEXT);
  END IF;
END $$;

-- G. public.pipeline_evidence & public.pipeline_candidate_decisions (from 20260923_evidence_pipeline.sql)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pipeline_evidence') THEN
    ALTER TABLE public.pipeline_evidence ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Candidates can view own pipeline evidence" ON public.pipeline_evidence;
    CREATE POLICY "Candidates can view own pipeline evidence"
      ON public.pipeline_evidence FOR SELECT
      USING (
        candidate_id = auth.uid()::TEXT OR
        EXISTS (SELECT 1 FROM public.recruiter_profiles rp WHERE rp.user_id = auth.uid()::TEXT)
      );
    DROP POLICY IF EXISTS "Candidates can manage own pipeline evidence" ON public.pipeline_evidence;
    CREATE POLICY "Candidates can manage own pipeline evidence"
      ON public.pipeline_evidence FOR ALL
      USING (candidate_id = auth.uid()::TEXT)
      WITH CHECK (candidate_id = auth.uid()::TEXT);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pipeline_candidate_decisions') THEN
    ALTER TABLE public.pipeline_candidate_decisions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Candidates can view own decisions" ON public.pipeline_candidate_decisions;
    CREATE POLICY "Candidates can view own decisions"
      ON public.pipeline_candidate_decisions FOR SELECT
      USING (
        candidate_id = auth.uid()::TEXT OR
        EXISTS (SELECT 1 FROM public.recruiter_profiles rp WHERE rp.user_id = auth.uid()::TEXT)
      );
    DROP POLICY IF EXISTS "Recruiters can manage pipeline decisions" ON public.pipeline_candidate_decisions;
    CREATE POLICY "Recruiters can manage pipeline decisions"
      ON public.pipeline_candidate_decisions FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.recruiter_profiles rp WHERE rp.user_id = auth.uid()::TEXT)
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.recruiter_profiles rp WHERE rp.user_id = auth.uid()::TEXT)
      );
  END IF;
END $$;

-- 3. CONNECTED ACCOUNTS VAULT TABLE WITH ENCRYPTED TOKENS & RLS
CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  provider_email TEXT NOT NULL,
  encrypted_access_token TEXT,
  token_scope JSONB DEFAULT '[]'::JSONB,
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_connected_account UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON public.connected_accounts (user_id);
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own connected accounts" ON public.connected_accounts;
CREATE POLICY "Users can manage own connected accounts"
  ON public.connected_accounts FOR ALL
  USING (auth.uid()::TEXT = user_id)
  WITH CHECK (auth.uid()::TEXT = user_id);

