-- ==============================================================================
-- COGNALYZE MIGRATION: CONSOLIDATED ROLE INTELLIGENCE & WORKFORCE ENGINE
-- Migration ID: 20261101_consolidated_roles_schema.sql
-- 
-- 1. Reconciles schema conflict between 20260920 and 20260924 on public.roles.
-- 2. Creates public.role_versions for immutable point-of-application & approval history.
-- 3. Creates public.role_responsibilities for the Responsibility-to-Capability Graph.
-- 4. Creates public.market_signals and public.role_evolution_proposals for Global Workforce Intelligence.
-- ==============================================================================

-- 1. RECONCILE public.roles (Supporting enterprise recruiter spine + collaboration feed)
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS recruiter_id UUID;
  ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
  ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS jd_raw TEXT DEFAULT '';
  ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS required_skills TEXT[] DEFAULT '{}';
  ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS feed_type TEXT DEFAULT 'collaboration';
  ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS hires_target INTEGER DEFAULT 1;
  ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'active';
  ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
  ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS active_version_id TEXT;
  ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
END $$;

CREATE INDEX IF NOT EXISTS idx_roles_org_id ON public.roles (org_id);
CREATE INDEX IF NOT EXISTS idx_roles_status ON public.roles (status);
CREATE INDEX IF NOT EXISTS idx_roles_version ON public.roles (version);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recruiters and admins can manage roles" ON public.roles;
CREATE POLICY "Recruiters and admins can manage roles"
  ON public.roles FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. IMMUTABLE ROLE VERSIONS & HUMAN APPROVAL VAULT
CREATE TABLE IF NOT EXISTS public.role_versions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  approval_status TEXT NOT NULL DEFAULT 'draft' CHECK (approval_status IN ('draft', 'under_review', 'approved', 'published', 'archived')),
  approval_notes TEXT,
  diff_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_role_versions UNIQUE (role_id, version)
);

CREATE INDEX IF NOT EXISTS idx_role_versions_role ON public.role_versions (role_id, version DESC);
ALTER TABLE public.role_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recruiters can manage role versions" ON public.role_versions;
CREATE POLICY "Recruiters can manage role versions"
  ON public.role_versions FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. RESPONSIBILITY-TO-CAPABILITY GRAPH TABLE
CREATE TABLE IF NOT EXISTS public.role_responsibilities (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  role_version_id TEXT REFERENCES public.role_versions(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  ownership_level TEXT NOT NULL DEFAULT 'own' CHECK (ownership_level IN ('assist', 'own', 'lead', 'architect')),
  capabilities JSONB NOT NULL DEFAULT '[]'::JSONB,
  outcomes JSONB NOT NULL DEFAULT '[]'::JSONB,
  complexity TEXT NOT NULL DEFAULT 'intermediate' CHECK (complexity IN ('foundational', 'intermediate', 'advanced', 'mission_critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_resp_role ON public.role_responsibilities (role_id);
ALTER TABLE public.role_responsibilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recruiters can manage role responsibilities" ON public.role_responsibilities;
CREATE POLICY "Recruiters can manage role responsibilities"
  ON public.role_responsibilities FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. GLOBAL WORKFORCE INTELLIGENCE: MARKET SIGNALS
CREATE TABLE IF NOT EXISTS public.market_signals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  company_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Global',
  event_type TEXT NOT NULL CHECK (event_type IN ('layoff', 'hiring_surge', 'hiring_freeze', 'restructuring', 'relocation', 'skill_shift')),
  announcement_date DATE NOT NULL,
  headcount_affected INTEGER,
  india_impact_status TEXT NOT NULL DEFAULT 'potential_india_impact' CHECK (india_impact_status IN ('confirmed_india_impact', 'reported_india_impact', 'potential_india_impact', 'no_established_india_impact', 'insufficient_evidence')),
  india_impact_details TEXT,
  affected_capabilities JSONB NOT NULL DEFAULT '[]'::JSONB,
  source_urls TEXT[] NOT NULL DEFAULT '{}',
  confidence NUMERIC DEFAULT 0.85,
  verified_by_human BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_signals_company ON public.market_signals (company_name);
CREATE INDEX IF NOT EXISTS idx_market_signals_date ON public.market_signals (announcement_date DESC);
CREATE INDEX IF NOT EXISTS idx_market_signals_india ON public.market_signals (india_impact_status);
ALTER TABLE public.market_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view verified market signals" ON public.market_signals;
CREATE POLICY "Public can view verified market signals"
  ON public.market_signals FOR SELECT
  USING (true);

-- 5. ROLE EVOLUTION PROPOSALS (HUMAN APPROVAL GATE)
CREATE TABLE IF NOT EXISTS public.role_evolution_proposals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  market_signal_id TEXT REFERENCES public.market_signals(id) ON DELETE SET NULL,
  target_canonical_role TEXT NOT NULL,
  proposed_change TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('add_capability', 'deprecate_capability', 'adjust_depth', 'update_responsibility')),
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evolution_proposals_role ON public.role_evolution_proposals (role_id);
ALTER TABLE public.role_evolution_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recruiters can manage evolution proposals" ON public.role_evolution_proposals;
CREATE POLICY "Recruiters can manage evolution proposals"
  ON public.role_evolution_proposals FOR ALL
  USING (true)
  WITH CHECK (true);

