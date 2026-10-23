-- ==============================================================================
-- COGNALYZE CANONICAL OPPORTUNITY & INGESTION PIPELINE MIGRATION
-- Migration: 20261024_canonical_opportunity_pipeline.sql
-- ==============================================================================

-- 1. SOURCE REGISTRY & MONITORING
CREATE TABLE IF NOT EXISTS public.opportunity_sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'EMPLOYER_ATS', 'HACKATHON_PLATFORM', 'UNIVERSITY', 
        'JOB_BOARD', 'MANUAL_IMPORT', 'SEARCH_DISCOVERY'
    )),
    base_url TEXT NOT NULL,
    connector_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'REQUIRES_APPROVAL' CHECK (status IN (
        'ACTIVE', 'LIMITED', 'DISABLED', 'ERROR', 'REQUIRES_AUTH', 'REQUIRES_APPROVAL'
    )),
    polling_frequency_minutes INT DEFAULT 360,
    consecutive_failures INT DEFAULT 0,
    last_synced_at TIMESTAMPTZ,
    last_error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CANONICAL OPPORTUNITY CORE
CREATE TABLE IF NOT EXISTS public.opportunities (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    organization_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'FULL_TIME', 'INTERNSHIP', 'HACKATHON', 'COMPETITION', 
        'RESEARCH', 'FELLOWSHIP', 'SCHOLARSHIP', 'WORKSHOP', 
        'MEETUP', 'CONFERENCE', 'UNIVERSITY_FEST', 'OTHER_OPPORTUNITY'
    )),
    opportunity_subtype TEXT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    canonical_url TEXT NOT NULL UNIQUE,
    original_apply_url TEXT NOT NULL,
    location TEXT DEFAULT NULL,
    remote_type TEXT DEFAULT NULL CHECK (remote_type IS NULL OR remote_type IN ('remote', 'onsite', 'hybrid')),
    tier TEXT DEFAULT 'Unranked' CHECK (tier IN ('Tier-1', 'Tier-2', 'Tier-3', 'Unranked')),
    compensation_or_prize TEXT DEFAULT NULL,
    deadline TIMESTAMPTZ DEFAULT NULL,
    deadline_timezone TEXT DEFAULT NULL,
    deadline_is_date_only BOOLEAN DEFAULT false,
    deadline_evaluation_status TEXT DEFAULT 'NORMAL' CHECK (deadline_evaluation_status IN ('NORMAL', 'TIMEZONE_UNCONFIRMED', 'EXPIRED')),
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL,
    lifecycle_status TEXT NOT NULL DEFAULT 'discovered' CHECK (lifecycle_status IN (
        'discovered', 'active', 'needs_review', 'stale', 'closed', 'expired', 'rejected'
    )),
    verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK (verification_status IN (
        'UNVERIFIED', 'AUTOMATED_HEAD_VERIFIED', 'SOURCE_API_CONFIRMED', 
        'SOURCE_CONFIRMED_CLOSED', 'MANUALLY_VERIFIED', 'LINK_DEAD'
    )),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_lifecycle_deadline ON public.opportunities (lifecycle_status, deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_org_title ON public.opportunities (organization_name, title);
CREATE INDEX IF NOT EXISTS idx_opportunities_category ON public.opportunities (category);

-- 3. SOURCE PROVENANCE RECORDS
CREATE TABLE IF NOT EXISTS public.opportunity_source_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    opportunity_id TEXT NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    source_id TEXT NOT NULL REFERENCES public.opportunity_sources(id) ON DELETE RESTRICT,
    external_listing_id TEXT,
    source_listing_url TEXT NOT NULL,
    raw_payload JSONB DEFAULT '{}'::JSONB,
    extracted_fields JSONB DEFAULT '{}'::JSONB,
    fetch_timestamp TIMESTAMPTZ DEFAULT NOW(),
    source_published_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opp_source_records_opp_id ON public.opportunity_source_records (opportunity_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_source_external_unique ON public.opportunity_source_records (source_id, external_listing_id) WHERE external_listing_id IS NOT NULL;

-- 4. STRUCTURED REQUIREMENTS
CREATE TABLE IF NOT EXISTS public.opportunity_requirements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    opportunity_id TEXT NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    requirement_type TEXT NOT NULL CHECK (requirement_type IN (
        'DEGREE', 'BRANCH', 'GRADUATION_YEAR', 'CGPA', 'BACKLOG_POLICY', 
        'CORE_SKILL', 'PREFERRED_SKILL', 'EXPERIENCE_YEARS'
    )),
    value TEXT NOT NULL,
    is_hard_gate BOOLEAN DEFAULT true,
    remediation_action_url TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opp_reqs_opp_id ON public.opportunity_requirements (opportunity_id);

-- 5. AUDIT TRAIL: STATUS HISTORY
CREATE TABLE IF NOT EXISTS public.opportunity_status_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    opportunity_id TEXT NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    previous_lifecycle_status TEXT,
    new_lifecycle_status TEXT NOT NULL,
    previous_verification_status TEXT,
    new_verification_status TEXT NOT NULL,
    change_reason TEXT NOT NULL,
    actor TEXT NOT NULL DEFAULT 'SYSTEM',
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_opp_id ON public.opportunity_status_history (opportunity_id);

-- 6. AUDIT TRAIL: DUPLICATE CANDIDATE REVIEWS
CREATE TABLE IF NOT EXISTS public.opportunity_duplicate_reviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    canonical_opportunity_id TEXT NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    candidate_opportunity_id TEXT NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    similarity_score NUMERIC NOT NULL,
    match_reasons JSONB NOT NULL,
    conflicts JSONB DEFAULT '{}'::JSONB,
    review_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (review_status IN ('PENDING', 'APPROVED_MERGE', 'REJECTED_DISTINCT')),
    reviewed_by TEXT DEFAULT NULL,
    reviewed_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ATOMIC SYNC LEASES
CREATE TABLE IF NOT EXISTS public.opportunity_sync_leases (
    source_id TEXT PRIMARY KEY REFERENCES public.opportunity_sources(id) ON DELETE CASCADE,
    leased_by TEXT NOT NULL,
    leased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- 8. SYNC RUN LOGS
CREATE TABLE IF NOT EXISTS public.opportunity_sync_runs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    source_id TEXT NOT NULL REFERENCES public.opportunity_sources(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ DEFAULT NULL,
    discovered_count INT DEFAULT 0,
    ingested_count INT DEFAULT 0,
    updated_count INT DEFAULT 0,
    error_count INT DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('RUNNING', 'SUCCESS', 'PARTIAL_FAILURE', 'FAILED')),
    log_summary TEXT DEFAULT NULL
);

-- 9. PLACEMENT OFFERS & VERIFIED OUTCOMES
CREATE TABLE IF NOT EXISTS public.placement_offers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL REFERENCES public.student_profiles(candidate_id) ON DELETE CASCADE,
    opportunity_id TEXT REFERENCES public.opportunities(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    offer_type TEXT NOT NULL CHECK (offer_type IN ('internship', 'full_time', 'ppo', 'contract')),
    compensation_structure JSONB DEFAULT '{}'::JSONB,
    offer_date DATE NOT NULL,
    joining_date DATE DEFAULT NULL,
    acceptance_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (acceptance_status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED')),
    verification_status TEXT NOT NULL DEFAULT 'SELF_REPORTED' CHECK (verification_status IN ('SELF_REPORTED', 'OFFER_LETTER_SUBMITTED', 'COLLEGE_VERIFIED', 'EMPLOYER_CONFIRMED')),
    verification_proof_path TEXT DEFAULT NULL,
    verified_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_placement_offers_user_id ON public.placement_offers (user_id);

-- 10. ATOMIC LEASE RPC FUNCTIONS
CREATE OR REPLACE FUNCTION public.acquire_opportunity_sync_lease(
    p_source_id TEXT,
    p_leased_by TEXT,
    p_duration_seconds INT
)
RETURNS TABLE (acquired BOOLEAN, lease_owner TEXT, expires_at TIMESTAMPTZ) AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_expires TIMESTAMPTZ := v_now + (p_duration_seconds || ' seconds')::INTERVAL;
    v_current_lease RECORD;
BEGIN
    SELECT * INTO v_current_lease FROM public.opportunity_sync_leases WHERE source_id = p_source_id FOR UPDATE;

    IF v_current_lease IS NULL THEN
        INSERT INTO public.opportunity_sync_leases (source_id, leased_by, leased_at, expires_at)
        VALUES (p_source_id, p_leased_by, v_now, v_expires);
        RETURN QUERY SELECT true, p_leased_by, v_expires;
    ELSIF v_current_lease.expires_at < v_now THEN
        UPDATE public.opportunity_sync_leases
        SET leased_by = p_leased_by, leased_at = v_now, expires_at = v_expires
        WHERE source_id = p_source_id;
        RETURN QUERY SELECT true, p_leased_by, v_expires;
    ELSE
        RETURN QUERY SELECT false, v_current_lease.leased_by, v_current_lease.expires_at;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.renew_opportunity_sync_lease(
    p_source_id TEXT,
    p_leased_by TEXT,
    p_duration_seconds INT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated INT;
BEGIN
    UPDATE public.opportunity_sync_leases
    SET expires_at = NOW() + (p_duration_seconds || ' seconds')::INTERVAL
    WHERE source_id = p_source_id 
      AND leased_by = p_leased_by 
      AND expires_at >= NOW();
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.release_opportunity_sync_lease(
    p_source_id TEXT,
    p_leased_by TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_deleted INT;
BEGIN
    DELETE FROM public.opportunity_sync_leases
    WHERE source_id = p_source_id AND leased_by = p_leased_by;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. ROW-LEVEL SECURITY ENFORCEMENT
ALTER TABLE public.opportunity_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_source_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_duplicate_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_sync_leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_offers ENABLE ROW LEVEL SECURITY;

-- Opportunities & Requirements: Read-only for authenticated students (active/stale/expired)
CREATE POLICY "Authenticated users view active opportunities"
    ON public.opportunities FOR SELECT
    TO authenticated
    USING (lifecycle_status IN ('active', 'expired', 'stale'));

CREATE POLICY "Authenticated users view requirements"
    ON public.opportunity_requirements FOR SELECT
    TO authenticated
    USING (true);

-- Internal pipeline tables: No authenticated policies -> Only service_role can access
-- (opportunity_sources, opportunity_source_records, status_history, duplicate_reviews, leases, sync_runs)

-- Placement Offers: Isolated strictly to candidate owner
CREATE POLICY "Students manage own placement offers"
    ON public.placement_offers FOR ALL
    TO authenticated
    USING (auth.uid()::TEXT = user_id)
    WITH CHECK (auth.uid()::TEXT = user_id);
