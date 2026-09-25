# ADR-001: Spine Architecture, Storage Layer, and Drizzle ORM Integration

## Context
Cognalyze is transitioning from scattered feature tables to a unified Evidence Operating System with a single data model:
`Role -> Requirements -> Sources -> Claims + Evidence -> Assessments -> Validation Plans -> Decisions -> Outcomes`.

The existing repository uses Supabase PostgreSQL (`@supabase/supabase-js`) with `pgvector`. Brief v2 calls for Drizzle ORM to provide strictly typed schema definitions, additive migrations, and zero-runtime-drift type safety across all queries.

## Decision
1. **Database & ORM**: We will integrate Drizzle ORM (`drizzle-orm` + `postgres`) alongside the existing Supabase Postgres connection.
   - All new spine tables (`organizations`, `roles`, `role_requirements`, `persons`, `sources`, `claims`, `evidence_items`, `evidence_links`, `capability_nodes`, `capability_edges`, `assessments`, `validation_methods`, `validation_plans`, `validation_tasks`, `validation_results`, `decisions`, `stage_events`, `outcomes`, `consent_grants`, `audit_log`, `jobs`, `ai_runs`) will be defined in Drizzle under `lib/db/schema/`.
   - Migrations will be generated and applied additively using Drizzle Kit / SQL migration scripts into `supabase/migrations/`.
2. **Additive Safety**: Existing tables (`candidates`, `student_profiles`, `jobs`, `dsa_*`, `opportunities`) will remain untouched during Phases 1–5.
3. **Data Access Layer**: New spine queries will use Drizzle's type-safe query builder, with row-level organization scoping enforced at the data layer.

## Consequences
- Preserves 100% of existing student and recruiter functionality while laying a strict, typed foundation.
- Full type safety for all evidence graph and assessment computations.
