# Cognalyze Evidence Operating System — Transformation Progress

**Last Updated:** 2026-09-20  
**Active Phase:** Phase 8 (Org Layer, Network-as-Evidence-Source, Collaboration & Internal Mobility) Completed — Preparing for Phase 9 (Hardening & E2E)

---

## 1. Phase Status Tracker

| Phase | Description | Status | Completed Date | Report / Artifacts |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 0** | **Audit (Read-Only)** | **DONE** | 2026-09-20 | [`docs/transformation/00-audit.md`](file:///Users/nisthamaheshwari/cognalyze/docs/transformation/00-audit.md) |
| **Phase 1** | **Foundations**: Additive migrations, Drizzle schema, deterministic `derive()`, quote verifier, language contract, anti-simulation CI script | **DONE** | 2026-09-20 | [`lib/db/schema.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/db/schema.ts), [`lib/evidence/derive.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/evidence/derive.ts), [`lib/evidence/quote-verifier.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/evidence/quote-verifier.ts), [`lib/copy/language.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/copy/language.ts) |
| **Phase 2** | **Roles & Requirements**: JD intake, proposed requirements with JD spans, versioned edits, JD review lens | **DONE** | 2026-09-20 | [`lib/roles/jd-intake.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/roles/jd-intake.ts), [`app/recruiter/roles/page.tsx`](file:///Users/nisthamaheshwari/cognalyze/app/recruiter/roles/page.tsx), [`app/api/recruiter/roles/[id]/requirements/[reqId]/route.ts`](file:///Users/nisthamaheshwari/cognalyze/app/api/recruiter/roles/[id]/requirements/[reqId]/route.ts) |
| **Phase 3** | **Single-candidate ingestion**: Resume -> claims -> verified evidence, source viewer with span highlight, GitHub OAuth | **DONE** | 2026-09-20 | [`lib/ingestion/single-candidate.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/ingestion/single-candidate.ts), [`lib/connectors/github.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/connectors/github.ts), [`components/evidence/SourceViewer.tsx`](file:///Users/nisthamaheshwari/cognalyze/components/evidence/SourceViewer.tsx), [`tests/ingestion-adversarial.test.ts`](file:///Users/nisthamaheshwari/cognalyze/tests/ingestion-adversarial.test.ts) |
| **Phase 4** | **Bulk screening + Pipeline + Candidates queue**: durable jobs, split review, dedupe, baseline matcher, overlooked lens, capacity cut | **DONE** | 2026-09-20 | [`lib/screening/bulk-engine.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/screening/bulk-engine.ts), [`lib/screening/pipeline-rules.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/screening/pipeline-rules.ts), [`app/recruiter/pipeline/page.tsx`](file:///Users/nisthamaheshwari/cognalyze/app/recruiter/pipeline/page.tsx), [`app/recruiter/candidates/page.tsx`](file:///Users/nisthamaheshwari/cognalyze/app/recruiter/candidates/page.tsx) |
| **Phase 5** | **Candidate page, Explain, validation planner, adaptive interview, work samples, results -> re-derivation, debate-lens rewrite** | **DONE** | 2026-09-20 | [`lib/validation/planner.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/validation/planner.ts), [`lib/validation/re-derivation.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/validation/re-derivation.ts), [`components/evidence/Explain.tsx`](file:///Users/nisthamaheshwari/cognalyze/components/evidence/Explain.tsx), [`lib/ai/debate-lenses.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/ai/debate-lenses.ts), [`app/api/debate/route.ts`](file:///Users/nisthamaheshwari/cognalyze/app/api/debate/route.ts) |
| **Phase 6** | **Decisions, Outcomes, process intelligence; switch primary nav; redirect old routes; retire duplicate modules & purge magic weights** | **DONE** | 2026-09-20 | [`lib/decisions/engine.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/decisions/engine.ts), [`lib/scoring/index.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/scoring/index.ts), [`lib/ai/ranking.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/ai/ranking.ts), [`app/recruiter/quality-of-hire/page.tsx`](file:///Users/nisthamaheshwari/cognalyze/app/recruiter/quality-of-hire/page.tsx), [`tests/decisions-outcomes.test.ts`](file:///Users/nisthamaheshwari/cognalyze/tests/decisions-outcomes.test.ts) |
| **Phase 7** | **Candidate passport, career gap, opportunity matching, consented sharing, deletion cascade** | **DONE** | 2026-09-20 | [`lib/evidence/career-gap.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/evidence/career-gap.ts), [`lib/privacy/consent.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/privacy/consent.ts), [`lib/privacy/deletion.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/privacy/deletion.ts), [`app/candidate/passport/page.tsx`](file:///Users/nisthamaheshwari/cognalyze/app/candidate/passport/page.tsx), [`tests/candidate-passport-consent.test.ts`](file:///Users/nisthamaheshwari/cognalyze/tests/candidate-passport-consent.test.ts) |
| **Phase 8** | **Org layer, network-as-evidence-source, collaboration, internal mobility** | **DONE** | 2026-09-20 | [`lib/organization/capability-map.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/organization/capability-map.ts), [`lib/mobility/internal-mobility.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/mobility/internal-mobility.ts), [`lib/network/network-source.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/network/network-source.ts), [`lib/roles/future-role-builder.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/roles/future-role-builder.ts), [`app/recruiter/organization/page.tsx`](file:///Users/nisthamaheshwari/cognalyze/app/recruiter/organization/page.tsx), [`tests/org-mobility-network.test.ts`](file:///Users/nisthamaheshwari/cognalyze/tests/org-mobility-network.test.ts) |
| **Phase 9** | **Hardening: accessibility audit, performance, security review (tenant isolation tests), E2E** | **NEXT** | — | — |


---

## 2. Architecture Decision Records (ADRs)

| ADR | Title | Status |
| :--- | :--- | :--- |
| [ADR-001](file:///Users/nisthamaheshwari/cognalyze/docs/transformation/ADR-001-architecture-and-spine-data-model.md) | Spine Architecture, Storage Layer, and Drizzle ORM Setup | Approved |
| [ADR-002](file:///Users/nisthamaheshwari/cognalyze/docs/transformation/ADR-002-anti-simulation-and-truth-contract.md) | Anti-Simulation Contract Enforcement and Elimination of Magic Scores | Approved |
| [ADR-003](file:///Users/nisthamaheshwari/cognalyze/docs/transformation/ADR-003-confirmed-state-thresholds-and-learning-gates.md) | Confirmed Requirement State Thresholds and Gated Learning Sample Sizes | Approved |
| [ADR-004](file:///Users/nisthamaheshwari/cognalyze/docs/transformation/ADR-004-durable-job-runner-and-signed-blob-storage.md) | Durable Job Runner and Signed Blob Storage on Vercel | Approved |
| [ADR-005](file:///Users/nisthamaheshwari/cognalyze/docs/transformation/ADR-005-connectors-taxonomy-and-legal-scope.md) | External Connectors, Capability Taxonomy Governance, and Compliance Scope | Approved |

---

## 3. Phase 5 Deliverables Summary

1. **Validation Planner ("Next Best Evidence", PART 5.9 & 5.10)**:
   - Module: [`lib/validation/planner.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/validation/planner.ts)
   - Rule-based planner determining the lowest-effort method set that resolves open core requirements (candidate minutes, recruiter minutes).
   - Enforces guardrail: every generated task strictly links to `(requirement_id, open_assessment_id)`.
   - Generates ownership tasks (explain / modify / debug / extend) grounded in candidate's submitted project.
2. **Validation Result Recording & Re-Derivation Loop**:
   - Module: [`lib/validation/re-derivation.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/validation/re-derivation.ts)
   - Closes the feedback loop: completed validation task generates verified T3/T4 evidence, triggers `derive()`, and updates the assessment state (`UNKNOWN` -> `ESTABLISHED` or `NOT_ESTABLISHED_AFTER_VALIDATION`).
3. **Shared `<Explain />` Component (PART 8)**:
   - Component: [`components/evidence/Explain.tsx`](file:///Users/nisthamaheshwari/cognalyze/components/evidence/Explain.tsx)
   - Supports Recruiter variant (full provenance, internal recruiter notes) and Candidate variant (privacy-filtered, zero comparisons, actionable feedback).
4. **Debate Committee Critique Lenses Rewrite (PART 7)**:
   - Module: [`lib/ai/debate-lenses.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/ai/debate-lenses.ts)
   - Rewrote [`app/api/debate/route.ts`](file:///Users/nisthamaheshwari/cognalyze/app/api/debate/route.ts) from arbitrary voting into 3 critique lenses: Strongest Evidence Lens, Unsupported Claims Lens, Unresolved Risks Lens.
   - Enforces citation checks: every observation must cite stored evidence IDs. Discards any ungrounded output. Purged all magic scores (`Score: XX/100`).
5. **Testing & Validation**:
   - [`tests/validation-loop.test.ts`](file:///Users/nisthamaheshwari/cognalyze/tests/validation-loop.test.ts) passing 100%. Total test suite: 34 tests passing across 7 suites.
   - `check-no-simulation` passing across 245 source files.

---

## 4. Phase 6 Deliverables Summary

1. **Purged Magic Weights, Blacklists, and Institutional Bias (Truth Contract T7)**:
   - Module: [`lib/scoring/index.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/scoring/index.ts)
   - Purged prestige tier calculations (`calculateCompanyQualityScore` and `calculateEducationQualityScore`). Neutralized institutional pedigree penalties.
   - Replaced arbitrary deductions in `calculateIntegrityPenalties` with objective factual tenure/gap observations (`calculateTenureMetrics`).
   - Module: [`lib/ai/ranking.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/ai/ranking.ts)
   - Permanently purged consulting company blacklist (`SERVICE_COMPANIES`: TCS, Infosys, Wipro, Accenture, etc.). Replaced company-size bias with objective career trajectory signals and honeypot traps.
   - Module: [`lib/scoring/behavioral.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/scoring/behavioral.ts)
   - Purged hardcoded date anchor (`2026-06-27`) and arbitrary weighted sums. Made reference timestamps dynamic and behavioral metrics transparent.

2. **Decommissioned Emotion AI & Pseudoscientific Proctoring (Truth Contract T7)**:
   - Formally decommissioned `/api/body-language`, `/api/face-check`, `/api/face-validate`, and `/api/ai-text-detect`.
   - Replaced biometric facial heuristics and subjective style grading with explicit deprecation notices and zero candidate penalization.

3. **Decisions Engine & Immutable Snapshots (PART 6.1)**:
   - Module: [`lib/decisions/engine.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/decisions/engine.ts)
   - Integrated into [`app/api/recruiter/decision/route.ts`](file:///Users/nisthamaheshwari/cognalyze/app/api/recruiter/decision/route.ts)
   - Records human decisions ("hire" | "hold" | "reject" | "advance") with immutable frozen assessment snapshots, cited evidence IDs, and auditable stage transitions.

4. **Statistical Gating ($N \ge 20$) & Process Intelligence (PART 6.2 & ADR-003)**:
   - Modules: [`lib/ai/quality-of-hire.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/ai/quality-of-hire.ts), [`app/recruiter/quality-of-hire/page.tsx`](file:///Users/nisthamaheshwari/cognalyze/app/recruiter/quality-of-hire/page.tsx), [`app/api/recruiter/quality-of-hire/route.ts`](file:///Users/nisthamaheshwari/cognalyze/app/api/recruiter/quality-of-hire/route.ts)
   - Strictly gates pattern inference behind $N \ge 20$ completed 90-day reviews, enforcing the Language Contract.
   - Connected Process Intelligence computing stage funnel conversion, time in stage, and bottleneck detection (&gt; 7 days).
   - Initialized `hireRecordsStore` as empty array (`[]`) per Anti-Simulation Contract.

5. **Route Parity & Redirects**:
   - Configured redirects in [`next.config.ts`](file:///Users/nisthamaheshwari/cognalyze/next.config.ts): `/recruiter/jobs` &rarr; `/recruiter/roles` and `/recruiter/dashboard` &rarr; `/recruiter/pipeline`.

6. **Verification & Acceptance Checks**:
   - Automated test suite: [`tests/decisions-outcomes.test.ts`](file:///Users/nisthamaheshwari/cognalyze/tests/decisions-outcomes.test.ts)
   - 38/38 unit/integration tests passing across 8 suites (`npm test`).
   - Anti-simulation check passing across 246 source files (`npm run check-no-simulation`).
   - Clean Next.js production build (`npm run build`, 144/144 pages generated).

---

## 5. Phase 7 Deliverables Summary

1. **Factual Career Transitions & Gap Analysis (Truth Contract T7)**:
   - Module: [`lib/evidence/career-gap.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/evidence/career-gap.ts)
   - Strictly factual chronology calculation without moralizing language, arbitrary penalty points, or "job hopping" stigma.
   - Generates actionable, evidence-based recommendations (work sample demonstrations) rather than subjective red flags.

2. **Candidate Sovereign Ownership & Scoped Consent Grants**:
   - Module: [`lib/privacy/consent.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/privacy/consent.ts)
   - Granular sharing scopes: `verified_claims`, `work_samples`, `github_code`, `anonymized_profile`, and `full_dossier`.
   - Signed shareable passport URLs (`/candidate/passport?token=...`) with duration-based expiry.
   - Immediate revocation capability with full immutable audit logging.
   - API endpoint: [`app/api/candidate/consent/route.ts`](file:///Users/nisthamaheshwari/cognalyze/app/api/candidate/consent/route.ts)

3. **GDPR / CCPA Deletion Cascade Engine**:
   - Module: [`lib/privacy/deletion.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/privacy/deletion.ts)
   - Irrevocable deletion cascade spanning PostgreSQL spine (`consentGrants`, `claims`, `evidenceItems`, `applications`, `persons`) and local candidate stores.
   - Generates cryptographic confirmation receipt (`DEL-...`) and logs actor audit trail with zero retained PII.
   - API endpoint: [`app/api/candidate/privacy/delete/route.ts`](file:///Users/nisthamaheshwari/cognalyze/app/api/candidate/privacy/delete/route.ts)

4. **Candidate Evidence Passport Interface**:
   - Page: [`app/candidate/passport/page.tsx`](file:///Users/nisthamaheshwari/cognalyze/app/candidate/passport/page.tsx)
   - Clean, sovereign candidate UI with 3 tabs:
     - *Evidence Passport*: verified capability claims, artifact tiers, recency, and factual career timeline.
     - *Consented Sharing*: active organization access list, granular permission toggles, and signed link generator.
     - *Privacy & Erasure*: one-click GDPR/CCPA erasure with real-time confirmation receipt.

5. **Verification & Acceptance Checks**:
   - Automated test suite: [`tests/candidate-passport-consent.test.ts`](file:///Users/nisthamaheshwari/cognalyze/tests/candidate-passport-consent.test.ts)
   - All 41 unit/integration tests passing across 9 test suites (`npm test`).
   - Anti-simulation check passing across 252 source files (`npm run check-no-simulation`).
   - Clean TypeScript compilation (`npx tsc --noEmit`).
   - Clean Next.js production build (`npm run build`, 147/147 pages generated).

---

## 6. Phase 8 Deliverables Summary

1. **Organization Capability Map & Team Composition Engine (Truth Contract T7)**:
   - Module: [`lib/organization/capability-map.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/organization/capability-map.ts)
   - Computes organization and team capability maps strictly from consented employee evidence.
   - Shows exact counts of supporting evidence per capability (e.g. 14 verified items, 3 staff), never decorative bars or arbitrary percentages.
   - Team composition delta flags: *"Adds capabilities less represented in this team"* strictly via capability coverage, zero interpersonal-compatibility claims or personality profiling.
   - API endpoint: [`app/api/organization/capability-map/route.ts`](file:///Users/nisthamaheshwari/cognalyze/app/api/organization/capability-map/route.ts)

2. **Internal Mobility Engine**:
   - Module: [`lib/mobility/internal-mobility.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/mobility/internal-mobility.ts)
   - Reuses the exact same pure assessment function `deriveRequirementState()` on consented employee evidence.
   - Truthful evidence-backed matching: breaks down `ESTABLISHED`, `PARTIAL`, `UNKNOWN` states with cited evidence IDs.
   - Suggests evidence-building validation plans for unresolved core requirements via [`lib/validation/planner.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/validation/planner.ts).
   - Zero arbitrary person-score fields or ranking numbers in responses.
   - API endpoint: [`app/api/mobility/evaluate/route.ts`](file:///Users/nisthamaheshwari/cognalyze/app/api/mobility/evaluate/route.ts)

3. **Network-as-Evidence-Source Engine**:
   - Module: [`lib/network/network-source.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/network/network-source.ts)
   - Attaches community/network projects as evidence sources with initial tier strictly set to **T1 (Self-asserted / Peer-referenced)**.
   - Code inspection elevates tier to **T2 (Third-party / Verified Repository)** upon verifiable repository inspection.
   - Anti-popularity rule: mathematically guarantees that social engagement metrics (likes, views, upvotes) have 0.0 weight on evidence tiers or requirement state.
   - API endpoint: [`app/api/network/source/route.ts`](file:///Users/nisthamaheshwari/cognalyze/app/api/network/source/route.ts)
   - UI Integration: Interactive "Attach as Evidence (T1)" on community post cards in [`app/post/page.tsx`](file:///Users/nisthamaheshwari/cognalyze/app/post/page.tsx).

4. **Future Role Builder**:
   - Module: [`lib/roles/future-role-builder.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/roles/future-role-builder.ts)
   - Synthesizes discrete `core`, `trainable`, `evaluated`, and `context` requirements starting from an organization business problem or capability deficit.
   - Recruiter/hiring manager editable controls for publication to pipeline.
   - API endpoint: [`app/api/roles/future-builder/route.ts`](file:///Users/nisthamaheshwari/cognalyze/app/api/roles/future-builder/route.ts)

5. **Recruiter Organization & Mobility Screen**:
   - Page: [`app/recruiter/organization/page.tsx`](file:///Users/nisthamaheshwari/cognalyze/app/recruiter/organization/page.tsx)
   - Unified screen with 3 tabs:
     - *Capability Map*: empirical evidence counts, tier breakdown, distinct staff, unrepresented competencies.
     - *Internal Mobility*: candidate evaluation against open positions using `derive()`, honest state badges, and growth pathways.
     - *Future Role Builder*: business challenge synthesizer into discrete requirements.
   - Added `Org & Mobility` navigation link to [`components/AppNav.tsx`](file:///Users/nisthamaheshwari/cognalyze/components/AppNav.tsx).

6. **Verification & Acceptance Checks**:
   - Automated test suite: [`tests/org-mobility-network.test.ts`](file:///Users/nisthamaheshwari/cognalyze/tests/org-mobility-network.test.ts)
   - All 46 unit/integration tests passing across 10 test suites (`npm test`).
   - Anti-simulation check passing across 261 source files (`npm run check-no-simulation`).
   - Clean TypeScript compilation (`npx tsc --noEmit`).
   - Clean Next.js production build (`npm run build`, 148/148 pages generated).
