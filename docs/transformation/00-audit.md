# Cognalyze Evidence Operating System — Phase 0 Comprehensive Audit

**Date:** 2026-09-20  
**Status:** Complete (Read-Only Audit)  
**System Target:** Cognalyze Evidence Operating System for Human Capability (Transformation Brief v2)  
**Authors:** Principal Engineer & Product Architect

---

## 1. Route Map

### 1.1 Recruiter Routes (Existing)
| Path | Current Purpose | Proposed Transformation / Re-homing |
| :--- | :--- | :--- |
| `/recruiter` | Landing / Redirect to dashboard or command center | Redirects to new Pipeline screen (`/recruiter/pipeline`) |
| `/recruiter/dashboard` | High-level metrics, open jobs, candidate volume | Replaced by primary **Pipeline** screen: "What requires your attention?" |
| `/recruiter/roles` | Role list, create role, JD upload, Role DNA inspector | Transformed to **Roles**: "What are we hiring for?" with versioned role requirements and JD review lens |
| `/recruiter/jobs` | Legacy job list | Consolidated into `/recruiter/roles` |
| `/recruiter/candidates` | Candidate screening, bulk paste/upload, 100 benchmark resumes, 5 debate agents, legacy ranking | Transformed to **Candidates**: "Who deserves deeper review?" with lexicographic rules panel ("How this is sorted") |
| `/recruiter/decision-room` | Decision journaling, candidate comparison, talent recovery | Transformed to **Decisions**: "What does the evidence tell us?" with immutable evidence snapshots |
| `/recruiter/interviews` | Schedule and conduct interviews, question prompter | Transformed to **Interview (Validation Session)**: "What do we still need to establish?" with rubric observations |
| `/recruiter/quality-of-hire`| 30/60/90-day retention/performance analytics, synthetic hire generator | Transformed to **Outcomes**: "What did we learn?" with strictly gated (N >= 20) org-learning loop |
| `/recruiter/analytics` | Funnel metrics, conversion charts | Replaced by Process Intelligence lens over `stage_events` |

### 1.2 Candidate & Student Routes (Existing)
| Path | Current Purpose | Proposed Transformation / Re-homing |
| :--- | :--- | :--- |
| `/candidate` | Single candidate analysis / result view (recently upgraded with 11 evidence sections) | Serves as basis for Candidate Lens (`/recruiter/candidates/[id]`) and candidate feedback |
| `/resume` | Standalone resume intelligence audit | Candidate-facing resume analysis; feeds Evidence Ingestion |
| `/student` | Student portal home / dashboard | Preserved: Student Home with Evidence Passport entry |
| `/student/dashboard` | Student stats, active applications, upcoming events | Transformed: Evidence Passport, capability coverage, open validations |
| `/student/dna` | Student Capability DNA & evidence nodes | Re-homed as **Evidence Passport** (person-owned evidence graph) |
| `/student/applications` | Applied opportunities tracking | Preserved: Applications tracking with evidence-backed status |
| `/student/opportunities` | Job & internship listings | Preserved: Opportunity matching using `derive()` function |
| `/student/opportunities/[id]`| Opportunity detail & project recommendations | Preserved: Gap engine against opportunity requirements |
| `/student/resume` | Resume builder & analyzer | Preserved: Resume Builder with verifiable claims |
| `/student/skills` | Skill Hub landing | Preserved: Skill Practice Hub |
| `/student/skills/aptitude` | Aptitude test practice | Preserved: Skill Practice Hub |
| `/student/skills/behavioral`| Behavioral question generator | Preserved: Re-homed to interview preparation |
| `/student/skills/communication`| Communication evaluation | Preserved |
| `/student/skills/cs-interview`| CS technical interview practice | Preserved: Technical validation practice |
| `/student/skills/system-design`| System design practice | Preserved: Technical validation practice |
| `/student/skills/patterns` | DSA patterns | Preserved: Skill Practice Hub |
| `/student/dsa-tracker` | Striver sheet / DSA problem progress | Preserved: Skill Practice Hub / DSA Tracker |
| `/student/journey` | Career roadmap and milestones | Preserved: Career Gap Engine |
| `/student/calendar` | Event scheduling, reminders, snooze, dismiss | Preserved: Personal calendar & validation event scheduling |
| `/student/calendar/history` | Historical event log | Preserved |
| `/student/community` | Student discussion & questions | Preserved: Network layer |
| `/student/gd-practice` | Group discussion simulator | Preserved |
| `/student/interview-prep` | AI mock interview session | Preserved: Re-homed as validation simulator |
| `/student/interview-prep/history`| Past interview transcripts & feedback | Preserved |
| `/student/question-bank` | Technical question repository | Preserved |
| `/student/simulation` | Work simulation / OA coding sandbox | Preserved: Re-homed as demonstration task sandbox |
| `/student/onboarding` | Profile creation flow | Preserved: Person & consent onboarding |

### 1.3 Platform & Network Routes (Existing)
| Path | Current Purpose | Proposed Transformation / Re-homing |
| :--- | :--- | :--- |
| `/` | Marketing landing page | Preserved & aligned to Evidence Operating System positioning |
| `/about` | Product overview | Updated positioning |
| `/post` | Network feed for projects, achievements, hackathons | Transformed: Network boundary (posts can become evidence sources at T1) |
| `/interview` | Live mock interview interface | Preserved: Re-homed under candidate validation practice |
| `/secure-interview` | Proctoring/anti-cheat interview interface | Audit finding: Contains client-side `face-api.js` and fake delays. Must be purged of emotion/face tracking per Part 2.4. |
| `/admin/opportunities` | Administrative opportunity ingest/management | Preserved: Boundary producer |

### 1.4 API Routes Summary
- **Ingestion & Parsing:** `/api/parse-resume`, `/api/split-resumes`, `/api/bulk-upload`, `/api/bulk-analyze`, `/api/github-analyze`, `/api/linkedin-analyze`
- **Result & Intelligence:** `/api/resume-intelligence`, `/api/candidate`, `/api/recruiter/analyze-jd`, `/api/dna`, `/api/recruiter/evidence-graph`, `/api/skills-gap`
- **Scoring & Ranking (To be refactored/purged of magic numbers):** `/api/rank-candidates`, `/api/recruiter/match-engine`, `/api/debate`, `/api/recruiter-analysis`, `/api/behavioral/analyze`, `/api/trust-score`
- **Violating / Prohibited APIs (Per Part 2.4 & S1):**
  - `/api/body-language`: Uses Llama-vision to score posture/eye contact/confidence (0-100). **MUST BE DEPRECATED/REMOVED**.
  - `/api/face-check` & `/api/face-validate`: Face counting / tracking. **MUST BE DEPRECATED/REMOVED**.
  - `/api/ai-text-detect`: AI-detector penalizing style, typing speed, and vocabulary. **MUST BE DEPRECATED/REMOVED**.
- **Student & Hub APIs:** `/api/dsa/*`, `/api/skills/*`, `/api/student/*`, `/api/opportunities/*`, `/api/problem-statements/*`, `/api/teams/*`

---

## 2. Database Schema Map

Cognalyze currently runs on Supabase PostgreSQL with `pgvector`. Schema definitions exist in `supabase/schema.sql` and `supabase/migrations/`.

### 2.1 Existing Tables
1. **`candidates`**: `id`, `name`, `email`, `phone`, `resume_text`, `skills` (JSONB), `career_history` (JSONB), `education` (JSONB), `raw_profile` (JSONB), `embedding` (vector(1536)), `redrob_signals` (JSONB), `created_at`.
2. **`jobs`**: `id`, `title`, `company`, `department`, `description`, `required_skills` (JSONB), `experience_range` (JSONB), `target_yoe`, `embedding` (vector(1536)), `created_at`.
3. **`evaluations`**: `id`, `candidate_id`, `job_id`, `overall_score`, `skill_score`, `experience_score`, `trajectory_score`, `company_score`, `education_score`, `behavioral_score`, `penalties` (JSONB), `flags` (JSONB), `explanation` (text), `created_at`.
4. **`honeypot_scans`**: `id`, `candidate_id`, `is_honeypot`, `trust_score`, `flags` (JSONB), `scanned_at`.
5. **`behavioral_metrics`**: `id`, `candidate_id`, `hireability_score`, `availability_score`, `recruiter_interest_score`, `risk_score`, `calculated_at`.
6. **`funnel_runs`**: `id`, `job_id`, `status`, `config`, `created_at`.
7. **`candidate_funnel_states`**: `id`, `run_id`, `candidate_id`, `stage`, `status`, `stage_scores` (JSONB), `updated_at`.
8. **`student_profiles`**: `id`, `clerk_user_id`, `full_name`, `email`, `university`, `degree`, `graduation_year`, `target_roles` (text[]), `skills` (text[]), `github_url`, `linkedin_url`, `resume_url`, `raw_resume_text`, `created_at`, `updated_at`.
9. **`opportunities`**: `id`, `title`, `company`, `opportunity_type`, `description`, `requirements` (text[]), `preferred_skills` (text[]), `location`, `stipend_or_salary`, `deadline`, `source_url`, `is_active`, `embedding` (vector(1536)), `created_at`.
10. **`recommendations`**: `id`, `student_id`, `opportunity_id`, `fit_score`, `match_reasons` (text[]), `missing_skills` (text[]), `status`, `recommended_at`.
11. **`project_suggestions`**: `id`, `student_id`, `opportunity_id`, `title`, `description`, `skills_targeted` (text[]), `complexity_level`, `created_at`.
12. **`applications`**: `id`, `student_id`, `opportunity_id`, `status`, `applied_at`, `notes`.
13. **`interview_questions`**: `id`, `opportunity_id`, `question`, `expected_competencies` (text[]), `suggested_duration_minutes`, `created_at`.
14. **`personal_events`**: `id`, `student_id`, `title`, `event_type`, `start_time`, `end_time`, `status`, `source_type`, `created_at`.
15. **`dsa_topics`, `dsa_problems`, `dsa_progress`, `student_dsa_goals`, `student_badges`, `student_connections`, `student_leaderboard_preferences`**: DSA Tracker & social gamification.
16. **`company_tracks`, `skill_domains`, `skill_resources`, `student_skill_progress`**: Skill Practice Hub.
17. **`problem_statements`, `student_ps_interactions`, `team_formations`, `team_members`**: Opportunity problem statements and collaboration teams.
18. **`notifications`**: User notification system.

### 2.2 Core Spine Target Architecture (Additive Migrations in Phase 1)
To fulfill the Evidence Operating System spine, the following tables will be introduced additively:
- `organizations`, `members` (org scoping & roles)
- `roles` (org_id, title, jd_raw, hires_target, status, version)
- `role_requirements` (role_id, text, category: core|trainable|evaluated|context, origin, jd_span, status, version)
- `persons` (identity fields, user_id, is_synthetic)
- `sources` (person_id, type, uri/blob_key, content_hash, retrieved_at, consent_grant_id, raw_text_ref)
- `claims` (person_id, kind, text, source_id, span)
- `evidence_items` (person_id, source_id, span, quote, artifact_ref, tier T0-T4, occurred_at, observed_at, verification_status, extractor, quote_verified, supersedes_id)
- `evidence_links` (evidence_id, capability_node_id, claim_id, requirement_id, relation, coverage)
- `capability_nodes`, `capability_edges` (part_of, related_to, prerequisite_of, transferable_to; curated/proposed)
- `assessments` (application_id, requirement_id, state: ESTABLISHED|PARTIAL|UNKNOWN|CONFLICTING|NOT_ESTABLISHED_AFTER_VALIDATION|NOT_APPLICABLE, derivation_version, input_evidence_ids, computed_at)
- `validation_methods` (catalog with resolves[], effort estimates)
- `validation_plans`, `validation_tasks`, `validation_results`
- `decisions` (application_id, decider, decision, rationale citing evidence_ids, immutable snapshot)
- `stage_events` (application_id, from, to, actor, at, reason)
- `outcomes` (application_id, checkpoint: 30|60|90, structured_fields, notes, recorded_by)
- `consent_grants`, `audit_log`, `jobs`, `ai_runs`

---

## 3. Existing Scoring and AI Code Audit

Per **Truth Contract T7**, all hardcoded offsets, magic weights, fudge factors, and AI-generated scores must be audited.

### 3.1 Hardcoded Weights & Arbitrary Formulas
1. **`lib/scoring/index.ts`**:
   - `calculateExperienceScore`: Gaussian decay `exp(-((actual - target)^2) / (2 * variance^2))` with arbitrary `targetYoe * 0.3` variance.
   - `calculateTrajectoryScore`: Max 40 points for >=24 months tenure; penalizes tenure <12 months with arbitrary linear points; awards `min(60, promos * 20)`.
   - `calculateCompanyQualityScore`: `{ 1: 100, 2: 75, 3: 50, 4: 30 }` — arbitrary prestige tiers.
   - `calculateEducationQualityScore`: Arbitrary 30% penalty (`base * 0.7`) if degree is deemed "irrelevant".
   - `calculateIntegrityPenalties`: Arbitrary `penalty += 20` for keyword density > 15%; arbitrary `penalty += fakeSkillsCount * 10`; arbitrary `penalty += 15` for gap > 12 months.
2. **`lib/scoring/behavioral.ts`**:
   - Arbitrary weighted sum for hireability: `profileQuality * 0.25 + githubActivity * 0.25 + interviewCompletion * 0.30 + offerAcceptance * 0.20`.
   - Notice period points: `<=15 -> 100, <=30 -> 75, <=60 -> 50, >60 -> 25`.
   - Relocation points: `flexibility ? 100 : 50`.
   - Recruiter interest: `recruiterResponse * 0.60 + profileQuality * 0.20 + verificationScore * 0.20`.
   - Fallback magic constants if signals are missing: `hireabilityScore: 70, availabilityScore: 70, recruiterInterestScore: 70, riskScore: 20`.
   - Hardcoded anchor date: `new Date("2026-06-27")`.
3. **`lib/ai/ranking.ts`**:
   - Hardcoded blacklist of consulting/service firms: `["tcs", "tata consultancy", "infosys", "wipro", "accenture", "cognizant", "capgemini", "hcl", "tech mahindra", "l&t"]`. If only service history is found, `companyScore = 10` and candidate is disqualified.
   - Arbitrary rank formula: `skillScore * 0.30 + experienceScore * 0.20 + companyScore * 0.15 + availability * 0.15 + hireability * 0.10`.
   - Hardcoded tech release year traps: penalizes candidate by 40 points for duration anomalies without checking project specifics.
4. **`lib/ai/funnel.ts`**:
   - Asks LLM to score candidate 0-100 on 4 stages and output `PASS` or `REJECT` based on arbitrary thresholds.
5. **`app/api/debate/route.ts`**:
   - Instructs LLM agents to output `"Score: XX/100"` and `"Verdict: Strong Reject / Lean Hire / Strong Hire"`.
   - Hardcoded fallback on error: `Verdict: Lean Hire\nScore: 50/100`.
6. **`app/api/body-language/route.ts`**:
   - Prompts vision LLM to output scores 0-100 for `posture`, `eyeContact`, `confidence`, `expression`.
   - Fallback on error: `{overall:60, posture:60, eyeContact:55, confidence:58, expression:62}`.

### 3.2 Discarded-Evidence Paths
- When `lib/scoring/index.ts` applies Gaussian penalties or company tier penalties, it replaces the underlying verifiable facts (e.g. "Candidate has 4 years experience at Company X") with a single collapsed number (`68/100`), discarding the context.
- `lib/ai/ranking.ts` discards real project artifacts if a candidate worked at an IT services firm.
- `app/api/debate/route.ts` asks agents to generate text that is not validated against source quotes or stored evidence IDs.

---

## 4. Runtime Simulation and Fake Data Audit

Per **Anti-Simulation Contract (PART 2.2)**, no mock data, faker, or fake delays may reach runtime paths.

| Location | Issue | Violation | Remedy |
| :--- | :--- | :--- | :--- |
| `app/recruiter/candidates/page.tsx:5, 1109` | Imports and runs `get100BenchmarkCandidates()` on button click: `⚡ Load 100 Benchmark Resumes (Simulate 1000 Pipeline)` | S1, S5 | Remove from runtime UI. Move seed data to `scripts/seed-dev/` with `is_synthetic=true`. |
| `lib/recruiter-store.ts:328` | Initializes `hireRecordsStore` with `generateSampleHireRecords()` | S1, S4, S5 | Initialize store with empty array. Load real rows from DB; empty state if 0 rows. |
| `app/api/recruiter/quality-of-hire/route.ts:13` | Has `mode === "insufficient_test"` fallback using sample records | S1 | Remove simulated modes from production API route. |
| `app/interview/page.tsx:642` | `await new Promise(r => setTimeout(r, 800 + Math.random() * 500));` | S1, S7 | Remove artificial delays. UI renders actual loading state while real API completes. |
| `app/secure-interview/page.tsx:635`| `await new Promise(r => setTimeout(r, 700 + Math.random() * 600));` | S1, S7 | Remove artificial delays. |
| `app/api/community/questions/route.ts:708` | `upvotes: Math.floor(Math.random() * 20) + 15` | S1, S2 | Default to actual upvotes (0 or real count from DB). |
| `app/api/enterprise/run/route.ts:84` | `candidate_id: CAND_${Math.round(Math.random() * 10000000)}` | S1 | Use `crypto.randomUUID()`. |
| Various files | `Math.random().toString(36)...` for IDs | Code quality | Replace with `crypto.randomUUID()`. |

---

## 5. Reusable Components vs. Redundant UI

### 5.1 Reusable Components to Retain & Refine
- `components/resume/ResumeIntelligenceView.tsx`: Core 11-section layout (Strengths, Missing Evidence, Experience Quality, Roadmap, Interview Focus) built on the zero-fabrication result engine. Provides the foundation for Candidate Lens (`/recruiter/candidates/[id]`).
- `components/resume/ResumeBuilderView.tsx`: Interactive resume editor with verifiable bullet proofing.
- `components/AppNav.tsx`: Main navigation bar (to be updated to primary nav: Pipeline, Roles, Candidates, Decisions, Outcomes).
- `components/NotificationBell.tsx`: User notification drawer.
- `components/student/GlobalEvidenceDrawer.tsx`: Existing evidence drawer for students; can be expanded into the canonical "View Evidence" drawer for recruiters and candidates.
- `components/student/AskCognalyzeModal.tsx`: Grounded AI query modal.

### 5.2 Redundant / Obsolete UI to Consolidate
- `app/recruiter/jobs/page.tsx` is completely redundant with `app/recruiter/roles/page.tsx`.
- Five conflicting candidate ranking/evaluation tables across `app/recruiter/candidates/page.tsx`, `app/recruiter/analytics/page.tsx`, and `app/recruiter/dashboard/page.tsx`.
- Magic score meters and radial percentage gauges across recruiter screens.
- Emotion/body language score cards in `app/secure-interview/page.tsx`.

---

## 6. Old -> New Terminology and Route Mapping

| Old Term / Feature | New Term / Concept | Architectural Meaning |
| :--- | :--- | :--- |
| Match Score / ATS % | Requirement States | No percentages. State per requirement: `ESTABLISHED`, `PARTIAL`, `UNKNOWN`, `CONFLICTING`, `NOT_ESTABLISHED_AFTER_VALIDATION`. |
| Candidate Ranking | Explicit Recruiter Sorting | Lexicographic rule panel ("How this is sorted"): e.g. most core established, then fewest unknown, then most recent T2+. |
| AI Resume Screener | Evidence Ingestion & Verification | Claims extracted with exact quotes, verified against source text via deterministic verifier. |
| AI Interviewer | Validation Session | Rubric-driven tasks targeted specifically at `UNKNOWN` or `CONFLICTING` core requirements. |
| AI Decision / Auto-Reject | Human Decision with Evidence Snapshot | The system never decides. Recruiter records decision citing evidence IDs. |
| Quality of Hire Prediction | Organizational Learning Loop | Gated at >=20 completed 90-day hires. Observational patterns, not predictive grades. |
| Student DNA | Evidence Passport | Person-owned living evidence profile with fine-grained consent grants. |
| Career Gap Analysis | Career Gap Engine | Direct comparison of person's evidence against target role requirements. |
| `/recruiter/dashboard` | `/recruiter/pipeline` | Action-oriented: "What requires your attention?" |
| `/recruiter/candidates` | `/recruiter/candidates` | Queue of candidates with core requirement state strips. |
| `/recruiter/jobs` | `/recruiter/roles` | Versioned role requirements derived from JD with recruiter override. |
| `/recruiter/decision-room` | `/recruiter/decisions` | Decision packet + immutable evidence snapshot. |
| `/recruiter/quality-of-hire`| `/recruiter/outcomes` | 30/60/90-day checkpoints and gated org learning. |

---

## 7. Features to Preserve and Re-Home

Per Part 0 of the master brief, the following existing features are strictly preserved:
1. **Resume Builder**: Preserved in `/student/resume` & `/resume`, integrated with evidence extractor.
2. **Mock Interviews & Interview Prep**: Preserved in `/student/interview-prep` and `/interview`, grounded in validation rubrics.
3. **Skills Gap Analysis**: Preserved in `/student/journey` and career gap engine, grounded in stored requirement assessments.
4. **Recruiter Candidate Evaluation & XLSX Export**: Preserved using SheetJS (`xlsx`) in `/recruiter/candidates`, exporting honest requirement states and evidence counts instead of magic percentages.
5. **DSA Tracker & Skill Practice Hub**: Preserved in `/student/dsa-tracker` and `/student/skills/*`.
6. **Student Profiles & Target Roles**: Preserved in `student_profiles.target_roles` and mapped to Evidence Passport.
7. **Opportunities & Problem Statements**: Preserved in `/student/opportunities` and `/student/opportunities/[id]`.
8. **Network / Post Feed**: Preserved in `/post` as an evidence source boundary.
9. **Authentication & Roles**: Preserved using Clerk (`@clerk/nextjs`) with org scoping.

---

## 8. Identified Architectural & Operational Risks

1. **Drizzle ORM Integration**:
   - The brief specifies Drizzle ORM. The current repo uses `@supabase/supabase-js` directly.
   - *Risk:* Introducing Drizzle requires setting up a type-safe Drizzle schema that connects to the existing PostgreSQL database without breaking existing Supabase queries.
   - *Mitigation:* Add `drizzle-orm` and `postgres` (or `drizzle-orm/postgres-js`), configure Drizzle client alongside Supabase client, and write additive Drizzle schemas for the spine tables in Phase 1.
2. **Vercel Execution Limits on Bulk Screening**:
   - Vercel Serverless Functions have a 60s timeout on Pro and 10-15s on Hobby. Bulk processing 100+ resumes cannot run in a single synchronous HTTP request.
   - *Risk:* Timeouts or memory exhaustion when parsing large PDFs.
   - *Mitigation:* Resumable, durable job records (`jobs` table). Process resumes in small idempotent batches (or chunked server actions / edge steps) with progress tracked in database rows.
3. **LLM Citation Verifier False Discards**:
   - If an LLM returns a quote with slight whitespace, smart-quote, or hyphen variations, a naive string check will reject it.
   - *Risk:* Good evidence discarded due to formatting discrepancies.
   - *Mitigation:* Deterministic quote verifier with Unicode normalization, whitespace collapsing, and case-folding before exact sub-string indexing.
4. **Prohibited AI Proctoring Code**:
   - `app/api/body-language` and `app/secure-interview` contain facial/emotion/typing heuristics that violate Part 2.4.
   - *Risk:* Regulatory compliance breach and brand contradiction.
   - *Mitigation:* Formally deprecate these endpoints and client loops; replace with task ownership verification (explain / modify / debug / extend).

---

## 9. Proposed Architecture Decision Records (ADRs)

- **ADR-001**: Spine Architecture, Storage Layer, and Drizzle ORM Setup over PostgreSQL.
- **ADR-002**: Anti-Simulation Contract Enforcement and Elimination of Magic Scores.
- **ADR-003**: Deterministic Evidence Model, Requirement State Machine (`derive()`), and Quote Verifier.
- **ADR-004**: Vercel-Compatible Durable Job Queue and Chunked Processing.
- **ADR-005**: Central Copy & Language Contract (`lib/copy/language.ts`).

---

## 10. Phase 0 Acceptance & Sign-off

Phase 0 is complete in read-only mode. All codebase paths, magic numbers, prohibited heuristics, and simulation routines have been mapped.

**Next Action:** Present the 6 irreversible/product-defining decisions from **PART 13** to the user for formal confirmation before Phase 1 foundation code is written.
