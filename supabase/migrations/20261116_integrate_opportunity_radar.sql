-- ==============================================================================
-- COGNALYZE × OPPORTUNITY RADAR INTEGRATION MIGRATION
-- Migration: 20261116_integrate_opportunity_radar.sql
-- Strictly additive. Does NOT duplicate or conflict with recruiter tables.
-- ==============================================================================

-- 1. PATCH CANONICAL OPPORTUNITIES TABLE
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS canonical_hash TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_opportunities_canonical_hash ON public.opportunities (canonical_hash);

-- Expand category check constraint to support all ecosystem sectors
ALTER TABLE public.opportunities DROP CONSTRAINT IF EXISTS opportunities_category_check;
ALTER TABLE public.opportunities ADD CONSTRAINT opportunities_category_check CHECK (category IN (
    'FULL_TIME', 'INTERNSHIP', 'HACKATHON', 'COMPETITION', 'RESEARCH', 'FELLOWSHIP',
    'SCHOLARSHIP', 'WORKSHOP', 'MEETUP', 'CONFERENCE', 'UNIVERSITY_FEST', 'OTHER_OPPORTUNITY',
    'OFF_CAMPUS_JOB', 'STARTUP', 'OPEN_SOURCE', 'REMOTE_GLOBAL', 'EVENT'
));

-- 2. ISOLATED STUDENT OPPORTUNITY APPLICATION TRACKER
-- Zero collision with recruiter applications
CREATE TABLE IF NOT EXISTS public.student_opportunity_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    opportunity_id TEXT NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    stage TEXT NOT NULL DEFAULT 'Saved' CHECK (stage IN (
        'Saved', 'Preparing', 'Applied', 'Interviewing', 'Accepted', 'Rejected', 'Withdrawn'
    )),
    applied_at TIMESTAMPTZ,
    deadline TIMESTAMPTZ,
    organization_name TEXT NOT NULL,
    position_title TEXT NOT NULL,
    resume_version TEXT DEFAULT 'Primary Resume',
    cover_letter TEXT DEFAULT '',
    tailored_bullets_json JSONB DEFAULT '[]'::JSONB,
    apply_url TEXT NOT NULL,
    notes TEXT DEFAULT '',
    follow_up_date DATE,
    permission_level INT DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_student_opp_app UNIQUE (user_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_stu_opp_app_user_stage ON public.student_opportunity_applications (user_id, stage);
CREATE INDEX IF NOT EXISTS idx_stu_opp_app_deadline ON public.student_opportunity_applications (deadline);

-- 3. APPLICATION ACTIONS AUDIT TRAIL
CREATE TABLE IF NOT EXISTS public.student_opportunity_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.student_opportunity_applications(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'status_change' | 'prep_kit_generated' | 'note_added' | 'followup_set'
    summary TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ANONYMIZED AGENT TRACES (STRICT PII SANITIZATION)
CREATE TABLE IF NOT EXISTS public.opportunity_agent_traces (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    agent_name TEXT NOT NULL,
    task_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'fallback', 'error', 'blocked')),
    input_summary TEXT NOT NULL,
    output_summary TEXT NOT NULL,
    tools_used_json JSONB DEFAULT '[]'::JSONB,
    duration_ms INT NOT NULL DEFAULT 0,
    token_usage INT DEFAULT 0,
    model_name TEXT DEFAULT 'deterministic',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opp_agent_traces_created ON public.opportunity_agent_traces (created_at DESC);

-- 5. PUBLIC SEO LANDING PAGES & CRAWL ANALYTICS
CREATE TABLE IF NOT EXISTS public.opportunity_seo_pages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    meta_description TEXT NOT NULL,
    h1 TEXT NOT NULL,
    intro_copy TEXT NOT NULL,
    filter_criteria_json JSONB DEFAULT '{}'::JSONB,
    page_type TEXT NOT NULL CHECK (page_type IN ('category_geo', 'guide')),
    is_indexable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.opportunity_seo_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    path TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('crawl', 'impression', 'click')),
    referrer TEXT DEFAULT '',
    user_agent TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ROW-LEVEL SECURITY ENFORCEMENT
ALTER TABLE public.student_opportunity_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_opportunity_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_agent_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_seo_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_seo_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students isolate own applications"
    ON public.student_opportunity_applications FOR ALL
    TO authenticated
    USING (auth.uid()::TEXT = user_id)
    WITH CHECK (auth.uid()::TEXT = user_id);

CREATE POLICY "Students isolate own actions"
    ON public.student_opportunity_actions FOR ALL
    TO authenticated
    USING (auth.uid()::TEXT = user_id)
    WITH CHECK (auth.uid()::TEXT = user_id);

CREATE POLICY "Public read SEO pages"
    ON public.opportunity_seo_pages FOR SELECT
    TO anon, authenticated
    USING (is_indexable = TRUE);
