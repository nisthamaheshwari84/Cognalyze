-- ============================================================================
-- COGNALYZE OPPORTUNITY INTELLIGENCE (COI) — ISOLATED SCHEMA MIGRATION
-- Migration: 20261117_create_opportunity_intelligence_schema.sql
-- Description: Creates isolated opportunity_intelligence schema, tables, and RLS policies.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS opportunity_intelligence;

-- 1. Student Connections & Consent Records
CREATE TABLE IF NOT EXISTS opportunity_intelligence.student_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  cognalyze_user_id UUID NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  scopes JSONB NOT NULL DEFAULT '["student_dna:read"]'::jsonb,
  sync_status VARCHAR(32) NOT NULL DEFAULT 'connected',
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coi_connections_student ON opportunity_intelligence.student_connections(student_id);

-- 2. Read-Only Cached Student DNA Snapshots
CREATE TABLE IF NOT EXISTS opportunity_intelligence.student_profile_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  profile_version INTEGER NOT NULL DEFAULT 1,
  schema_version VARCHAR(16) NOT NULL DEFAULT '1.0',
  snapshot_data JSONB NOT NULL,
  completeness_pct INTEGER NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coi_snapshots_student ON opportunity_intelligence.student_profile_snapshots(student_id, profile_version DESC);

-- 3. Opportunities Catalog
CREATE TABLE IF NOT EXISTS opportunity_intelligence.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(256) UNIQUE NOT NULL,
  canonical_hash VARCHAR(128) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  organization_website TEXT DEFAULT '',
  description TEXT NOT NULL,
  category VARCHAR(64) NOT NULL,
  employment_type VARCHAR(64) DEFAULT '',
  compensation_type VARCHAR(32) DEFAULT 'unknown',
  compensation_details TEXT DEFAULT 'Not disclosed',
  currency VARCHAR(16) DEFAULT 'USD',
  required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  education_requirements TEXT DEFAULT '',
  min_academic_year INTEGER,
  max_academic_year INTEGER,
  graduation_years JSONB NOT NULL DEFAULT '[]'::jsonb,
  location TEXT NOT NULL DEFAULT 'Remote',
  country VARCHAR(64) NOT NULL DEFAULT 'Global',
  work_mode VARCHAR(32) NOT NULL DEFAULT 'remote',
  international_eligible BOOLEAN NOT NULL DEFAULT true,
  deadline TIMESTAMPTZ,
  apply_url TEXT NOT NULL,
  original_source_url TEXT NOT NULL,
  primary_source_id VARCHAR(64) NOT NULL,
  verification_status VARCHAR(32) NOT NULL DEFAULT 'Source Verified',
  confidence_score NUMERIC(4,3) NOT NULL DEFAULT 0.850,
  lifecycle_status VARCHAR(32) NOT NULL DEFAULT 'Published',
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coi_opp_category_status ON opportunity_intelligence.opportunities(category, lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_coi_opp_country_mode ON opportunity_intelligence.opportunities(country, work_mode);
CREATE INDEX IF NOT EXISTS idx_coi_opp_deadline ON opportunity_intelligence.opportunities(deadline);

-- 4. Opportunity Sources
CREATE TABLE IF NOT EXISTS opportunity_intelligence.opportunity_sources (
  id VARCHAR(64) PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  source_category VARCHAR(64) NOT NULL,
  geographic_coverage VARCHAR(64) NOT NULL,
  connector_type VARCHAR(64) NOT NULL,
  api_endpoint TEXT NOT NULL UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  health_status VARCHAR(32) NOT NULL DEFAULT 'healthy',
  opportunities_discovered INTEGER NOT NULL DEFAULT 0,
  valid_opportunities_extracted INTEGER NOT NULL DEFAULT 0,
  last_successful_scan TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Student Opportunity Matches (Computed from DNA Snapshot)
CREATE TABLE IF NOT EXISTS opportunity_intelligence.opportunity_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  opportunity_id UUID NOT NULL REFERENCES opportunity_intelligence.opportunities(id) ON DELETE CASCADE,
  match_score NUMERIC(5,2) NOT NULL,
  eligibility_status VARCHAR(32) NOT NULL DEFAULT 'eligible',
  matching_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  why_reasoning TEXT NOT NULL,
  formula_version VARCHAR(32) NOT NULL DEFAULT 'coi_v1.0',
  profile_version INTEGER NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coi_matches_student ON opportunity_intelligence.opportunity_matches(student_id, match_score DESC);

-- 6. Student Application Tracking
CREATE TABLE IF NOT EXISTS opportunity_intelligence.student_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  opportunity_id UUID NOT NULL REFERENCES opportunity_intelligence.opportunities(id) ON DELETE CASCADE,
  stage VARCHAR(32) NOT NULL DEFAULT 'SAVED',
  notes TEXT DEFAULT '',
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coi_apps_student ON opportunity_intelligence.student_applications(student_id, stage);

-- 7. Audit Logs
CREATE TABLE IF NOT EXISTS opportunity_intelligence.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  action VARCHAR(64) NOT NULL,
  target_type VARCHAR(64) NOT NULL,
  target_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Row Level Security (RLS)
ALTER TABLE opportunity_intelligence.student_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_intelligence.student_profile_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_intelligence.opportunity_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_intelligence.student_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY coi_connections_owner_policy ON opportunity_intelligence.student_connections
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY coi_snapshots_owner_policy ON opportunity_intelligence.student_profile_snapshots
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY coi_matches_owner_policy ON opportunity_intelligence.opportunity_matches
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY coi_applications_owner_policy ON opportunity_intelligence.student_applications
  FOR ALL USING (auth.uid() = student_id);
