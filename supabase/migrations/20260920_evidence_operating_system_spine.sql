-- ==============================================================================
-- COGNALYZE EVIDENCE OPERATING SYSTEM — SPINE DATA MODEL (PHASE 1 ADDITIVE MIGRATION)
-- Non-destructive, idempotent, additive-only migration for the Evidence Operating System.
-- ==============================================================================

-- 1. ORGANIZATIONS & MEMBERSHIP
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug VARCHAR(128) NOT NULL UNIQUE,
    feedback_disclosure_mode VARCHAR(32) NOT NULL DEFAULT 'opt_in_per_role',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'recruiter',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS members_org_user_idx ON members (org_id, user_id);

-- 2. ROLES & REQUIREMENTS
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    jd_raw TEXT NOT NULL,
    hires_target INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS roles_org_idx ON roles (org_id);

CREATE TABLE IF NOT EXISTS role_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    category VARCHAR(32) NOT NULL, -- core | trainable | evaluated | context
    origin VARCHAR(32) NOT NULL,   -- llm_proposed | recruiter_added | recruiter_edited
    jd_span JSONB,
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- active | dismissed
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS role_req_role_idx ON role_requirements (role_id);

-- 3. PERSONS & APPLICATIONS
CREATE TABLE IF NOT EXISTS persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id TEXT,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    stage VARCHAR(32) NOT NULL DEFAULT 'applied', -- applied | screened | deep_review | interview | finalists | hired | rejected
    channel VARCHAR(64) NOT NULL DEFAULT 'direct_upload',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS apps_role_idx ON applications (role_id);
CREATE INDEX IF NOT EXISTS apps_person_idx ON applications (person_id);

-- 4. SOURCES, CLAIMS, & EVIDENCE ITEMS
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL, -- resume_pdf | github | work_sample | assessment | interview | candidate_submitted | cognalyze_activity | reference | post
    uri_blob_key TEXT,
    content_hash TEXT NOT NULL,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consent_grant_id UUID,
    raw_text_ref TEXT
);
CREATE INDEX IF NOT EXISTS sources_person_idx ON sources (person_id);

CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    kind VARCHAR(32) NOT NULL, -- skill | project | role_held | responsibility | achievement | education
    text TEXT NOT NULL,
    span JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evidence_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    span JSONB,
    quote TEXT NOT NULL,
    artifact_ref TEXT,
    tier VARCHAR(8) NOT NULL, -- T0 | T1 | T2 | T3 | T4
    occurred_at TIMESTAMPTZ,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'verified',
    extractor VARCHAR(64) NOT NULL,
    quote_verified BOOLEAN NOT NULL DEFAULT FALSE,
    supersedes_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS evidence_person_idx ON evidence_items (person_id);
CREATE INDEX IF NOT EXISTS evidence_source_idx ON evidence_items (source_id);

-- 5. CAPABILITY GRAPH & LINKS
CREATE TABLE IF NOT EXISTS capability_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug VARCHAR(128) NOT NULL UNIQUE,
    category VARCHAR(64) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS capability_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_node_id UUID NOT NULL REFERENCES capability_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES capability_nodes(id) ON DELETE CASCADE,
    kind VARCHAR(32) NOT NULL, -- part_of | related_to | prerequisite_of | transferable_to
    origin VARCHAR(32) NOT NULL DEFAULT 'curated', -- curated | proposed
    justification TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS evidence_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
    capability_node_id UUID REFERENCES capability_nodes(id) ON DELETE SET NULL,
    claim_id UUID REFERENCES claims(id) ON DELETE SET NULL,
    requirement_id UUID REFERENCES role_requirements(id) ON DELETE SET NULL,
    relation VARCHAR(32) NOT NULL, -- supports | partially_supports | adjacent_to | contradicts
    coverage VARCHAR(16) NOT NULL,  -- direct | adjacent | partial
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS links_evidence_idx ON evidence_links (evidence_id);
CREATE INDEX IF NOT EXISTS links_req_idx ON evidence_links (requirement_id);

-- 6. ASSESSMENTS (APPEND-ONLY HISTORY)
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    requirement_id UUID NOT NULL REFERENCES role_requirements(id) ON DELETE CASCADE,
    state VARCHAR(64) NOT NULL, -- ESTABLISHED | PARTIAL | UNKNOWN | CONFLICTING | NOT_ESTABLISHED_AFTER_VALIDATION | NOT_APPLICABLE
    derivation_version VARCHAR(32) NOT NULL,
    input_evidence_ids JSONB NOT NULL,
    explanation TEXT NOT NULL,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS assessments_app_idx ON assessments (application_id);

-- 7. VALIDATION PLANS, METHODS, TASKS, RESULTS
CREATE TABLE IF NOT EXISTS validation_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    resolves JSONB NOT NULL,
    candidate_minutes INTEGER NOT NULL,
    recruiter_minutes INTEGER NOT NULL,
    elapsed_time_hours INTEGER NOT NULL DEFAULT 24,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS validation_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'proposed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS validation_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES validation_plans(id) ON DELETE CASCADE,
    method_id UUID NOT NULL REFERENCES validation_methods(id) ON DELETE CASCADE,
    target_assessment_ids JSONB NOT NULL,
    generated_content JSONB NOT NULL,
    rubric JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS validation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES validation_tasks(id) ON DELETE CASCADE,
    rubric_observations JSONB NOT NULL,
    outcome VARCHAR(32) NOT NULL, -- established | not_established | partial
    recorded_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. DECISIONS & SNAPSHOTS
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    decider_user_id TEXT NOT NULL,
    decision VARCHAR(32) NOT NULL, -- advance | hire | reject | hold
    rationale TEXT NOT NULL,
    cited_evidence_ids JSONB NOT NULL,
    assessments_snapshot JSONB NOT NULL,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS decisions_app_idx ON decisions (application_id);

-- 9. STAGE EVENTS
CREATE TABLE IF NOT EXISTS stage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_stage VARCHAR(32),
    to_stage VARCHAR(32) NOT NULL,
    actor_user_id TEXT NOT NULL,
    reason TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS stage_events_app_idx ON stage_events (application_id);

-- 10. OUTCOMES (30 / 60 / 90-DAY REVIEW)
CREATE TABLE IF NOT EXISTS outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    checkpoint INTEGER NOT NULL, -- 30 | 60 | 90
    structured_fields JSONB NOT NULL,
    notes TEXT,
    recorded_by TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS outcomes_app_idx ON outcomes (application_id);

-- 11. PRIVACY, CONSENT, AUDIT, JOBS, AI LOGGING
CREATE TABLE IF NOT EXISTS consent_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    grantee_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    scope JSONB NOT NULL,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    actor_id TEXT NOT NULL,
    action VARCHAR(64) NOT NULL,
    target_entity_type VARCHAR(64) NOT NULL,
    target_entity_id TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_org_idx ON audit_log (org_id);

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'queued',
    payload JSONB,
    progress JSONB,
    result JSONB,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs (status);

CREATE TABLE IF NOT EXISTS ai_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    model VARCHAR(64) NOT NULL,
    prompt_version VARCHAR(32) NOT NULL,
    input_hash VARCHAR(64) NOT NULL,
    output_hash VARCHAR(64) NOT NULL,
    cost_usd NUMERIC(8, 6) NOT NULL DEFAULT 0,
    latency_ms INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ai_runs_hash_idx ON ai_runs (input_hash);
