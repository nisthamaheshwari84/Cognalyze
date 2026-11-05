# Phase 2.3 Production Safety Specification: PostgreSQL & RLS Migration Architecture

## Status & Scope
- **Phase**: 2.3 Follow-up Documentation (Pre-Migration Architecture Specification)
- **Constraint**: Milestone 2.3 strictly documents requirements; **zero database migrations, schema alterations, or data mutations are executed in production**.

---

## 1. Context & Architecture Transition
In local and staging environments, Cognalyze operates on an atomic, lock-managed JSON file store (`recruiter-store.json`, `recruiter-batches.json`) with safe process-level mutexes and `.tmp` rename semantics. 

For multi-tenant distributed production deployments on Vercel and Supabase/PostgreSQL, all tenant isolation, state synchronization, and audit history guarantees must transition to the database kernel level via Row-Level Security (RLS) policies, immutable tables, and strict foreign key integrity constraints.

---

## 2. Multi-Tenant Isolation Constraints

### 2.1 Tenant Scope Enforcement
All recruiter domain entities (`organizations`, `recruiter_profiles`, `recruiter_roles`, `recruiter_candidates`, `screening_dossiers`, `recruiter_batches`, and `candidate_audit_logs`) must carry an explicit, non-nullable `tenant_id uuid` column.

```sql
-- Example Schema Definition for Tenant Scoping
ALTER TABLE recruiter_candidates
  ADD COLUMN tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT;

ALTER TABLE recruiter_roles
  ADD COLUMN tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT;

ALTER TABLE screening_dossiers
  ADD COLUMN tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT;
```

### 2.2 Row-Level Security (RLS) Policies
Every table must enforce RLS enabled by default (`ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`).
Access must strictly validate against the session context tenant:

```sql
-- Dynamic session context or Supabase JWT org_id
CREATE POLICY tenant_isolation_recruiter_candidates ON recruiter_candidates
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
    OR tenant_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
    OR tenant_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID
  );

CREATE POLICY tenant_isolation_screening_dossiers ON screening_dossiers
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
    OR tenant_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
    OR tenant_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID
  );
```

### 2.3 Cross-Role & Cross-Tenant Composite Keys
To eliminate logical bugs where a candidate is queried for an incompatible role within the same or another tenant:
```sql
-- Compound foreign key ensuring candidate-role association remains within same tenant
ALTER TABLE recruiter_candidates
  ADD CONSTRAINT fk_candidate_role_tenant
  FOREIGN KEY (applied_role_id, tenant_id)
  REFERENCES recruiter_roles (id, tenant_id)
  ON DELETE RESTRICT;
```

---

## 3. Append-Only Historical Records & Audit Integrity

### 3.1 Immutable Dossier History Table (`prior_assessments`)
In accordance with Policy A screening transparency, screening assessments must **never be overwritten or mutated in place**. When a candidate's resume version advances (e.g., v1 -> v2) or a role's DNA updates:
1. The previous dossier is archived into `prior_screening_assessments`.
2. The active record in `screening_dossiers` references the active `resume_version` and `role_version`.

```sql
CREATE TABLE prior_screening_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  candidate_id UUID NOT NULL REFERENCES recruiter_candidates(id) ON DELETE RESTRICT,
  role_id UUID NOT NULL REFERENCES recruiter_roles(id) ON DELETE RESTRICT,
  resume_version INTEGER NOT NULL,
  role_version INTEGER NOT NULL,
  policy_version VARCHAR(32) NOT NULL,
  match_score NUMERIC(5, 2) NOT NULL,
  reliability_score NUMERIC(5, 2) NOT NULL,
  requirement_breakdown JSONB NOT NULL,
  provenance_summary JSONB NOT NULL,
  superseded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  superseded_reason TEXT NOT NULL
);

-- Immutable Trigger: Block UPDATE and DELETE on historical assessments
CREATE OR REPLACE FUNCTION prevent_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Security Violation: Records in prior_screening_assessments are immutable and append-only.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prior_screening_assessments_immutable
  BEFORE UPDATE OR DELETE ON prior_screening_assessments
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_mutation();
```

---

## 4. Protection Against Accidental Cascading Deletion

Recruiter profiles, job postings, and applicant screenings form a legally sensitive hiring audit trail. Accidental cascades can erase verifiable evidence and candidate consent records.

### 4.1 Strict `ON DELETE RESTRICT` Constraints
Cascading deletes (`ON DELETE CASCADE`) are **prohibited** on all core relational edges:
- Deleting a `recruiter_role` must be blocked if active candidates or historical assessments exist (`ON DELETE RESTRICT`).
- Deleting an `organization` must require explicit, multi-party administrative offboarding; never cascade-drop candidates automatically.
- Deleting a candidate record must be blocked if prior screening assessments or decision records exist (`ON DELETE RESTRICT`).

### 4.2 Soft-Deletion Lifecycle
Soft deletion (`deleted_at TIMESTAMPTZ NULL`, `archived_at TIMESTAMPTZ NULL`) must be used for UI lifecycle removal:
```sql
ALTER TABLE recruiter_candidates ADD COLUMN archived_at TIMESTAMPTZ NULL;
ALTER TABLE recruiter_roles ADD COLUMN archived_at TIMESTAMPTZ NULL;

-- Partial index for active candidates
CREATE INDEX idx_active_recruiter_candidates 
  ON recruiter_candidates(tenant_id, applied_role_id) 
  WHERE archived_at IS NULL;
```

---

## 5. Candidate Quote Integrity & Grounding Verification

In Phase 2.3, the in-memory screening engine validates that every `sourceText` corresponds directly to the active candidate resume text:
- In PostgreSQL, the `resumes` table stores canonical `raw_text`, `clean_text`, and SHA-256 `content_hash`.
- Stored requirement contributions contain `quote_verified: boolean` and `quote_match_type: 'VERBATIM' | 'NORMALIZED_WHITESPACE' | 'UNCORROBORATED'`.
- Database triggers will verify that `resume_version` in the dossier strictly matches the latest `active_resume_version` in `recruiter_candidates`.

---

## 6. Pre-Migration Verification Checklist
Prior to executing migrations in any production environment:
1. [ ] Validate all Supabase client calls use Service Role only in secure backend handlers, with `tenant_id` explicit filter clauses.
2. [ ] Test RLS leak scenarios with automated SQL test suites using `SET LOCAL ROLE recruiter_user`.
3. [ ] Verify that no `ON DELETE CASCADE` exists in the generated DDL.
4. [ ] Ensure immutable triggers are active on audit and historical dossier tables.
5. [ ] Verify that backup point-in-time recovery (PITR) is enabled.
