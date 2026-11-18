# COGNALYZE × COI: DATABASE OWNERSHIP & DATA BOUNDARY SPECIFICATION
**Version:** 1.0  
**Status:** Approved Architectural Standard

---

### 1. The Core Invariant
* **Cognalyze owns STUDENT DNA.**
* **Opportunity Intelligence owns OPPORTUNITY DNA.**
* Under no circumstances may either service directly read, mutate, or manage tables belonging to the other.

---

### 2. Schema Breakdown (Supabase PostgreSQL)

#### Cognalyze Canonical Domain (`schema: public`)
These tables represent the student's authoritative career profile, verified assessment artifacts, and recruiter hiring pipelines:
* `users`: Primary identity and authentication accounts.
* `student_profiles`: Permanent student academic and biographical record.
* `claims`: Formally registered student claims (skills, projects, education).
* `evidence_items`: Raw and normalized proof artifacts (GitHub PRs, LeetCode submissions).
* `capability_nodes` & `capability_edges`: Student DNA graph ontology.
* `consent_grants`: Explicit consent tracking for third-party access.
* `applications`: Recruiter-side job applications and candidate pipelines.

#### COI Canonical Domain (`schema: opportunity_intelligence`)
These tables represent the opportunity discovery ecosystem and student opportunity actions:
* `student_connections`: Linked Cognalyze student credentials, OAuth tokens, and synchronization states.
* `student_profile_snapshots`: Encrypted, read-only cache of authorized Student DNA snapshots. Purged on consent revocation.
* `opportunities`: Canonical normalized opportunities (India and Global).
* `opportunity_sources`: Source connectors, health metrics, and sync policies.
* `opportunity_matches`: Computed alignment scores ($0.30S + 0.25E + \dots$) and evidence gap breakdowns.
* `preparation_plans`: Personalized roadmaps, milestones, and practice tasks.
* `student_opportunity_applications`: Student-side application tracking (Saved, Applied, Interviewing, Offer, Rejected).
* `verification_records`: Audit trail of live HTTP checks, dead-link detection, and corroboration.

---

### 3. Data Synchronization Lifecycle

```
[Student in Cognalyze updates skills or GitHub evidence]
                      │
                      ▼
[Cognalyze emits webhook / marks profile_version = N + 1]
                      │
                      ▼
[COI Background Worker reconciles version via /api/v1/me/student-dna/versions]
                      │
                      ▼
[COI fetches updated snapshot via GET /api/v1/me/student-dna]
                      │
                      ▼
[COI updates student_profile_snapshots & triggers incremental match recalculation]
```
