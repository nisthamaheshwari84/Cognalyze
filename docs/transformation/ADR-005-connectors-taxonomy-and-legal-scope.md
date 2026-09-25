# ADR-005: External Connectors, Capability Taxonomy Governance, and Compliance Scope

## Context
PART 13 Decisions 3, 4, 5, and 6 addressed candidate feedback defaults, external connectors, taxonomy curation, and initial legal compliance markets.
The user confirmed the recommendations on 2026-09-20.

## Decision
1. **Candidate Feedback Disclosure**:
   - Feedback is role-scoped and default private to the recruiter (`feedback_disclosure_mode: "opt_in_per_role"`).
   - Recruiter can opt-in to publish evidence-backed `<Explain />` feedback to the candidate.
   - Candidate-facing view shows only their own evidence-backed requirement assessments, never internal recruiter notes and never comparisons to other candidates.
2. **External Connectors (v1)**:
   - **GitHub OAuth**: Authorized via official OAuth with explicit consent. Reads authorized repositories, commit history, and pull requests to establish direct T2 evidence.
   - **Other Platforms (LinkedIn, LeetCode, etc.)**: Strictly no scraping. Stored as candidate-provided reference links (T1) until official partner APIs and consent flows are added. All non-working connectors are shown as *"Not connected"*.
3. **Capability Taxonomy Governance**:
   - Seeded with a curated software engineering ontology (`capability_nodes` and `capability_edges`).
   - LLM-extracted capabilities are marked `origin: "proposed"`. They are prohibited from being used by `derive()` until an org administrator or recruiter reviews and approves the edge (`origin: "curated"`).
4. **Target Legal Compliance**:
   - Compliant by design with India's **DPDP Act 2023** (purpose limitation, consent grants, right to deletion) and enterprise hiring standards (human decision-maker mandate, audit logging, small-cell demographic suppression). Architecture prepared for EU AI Act high-risk requirements.

## Consequences
- Zero scraping risk, zero terms-of-service violations.
- Safe, hallucination-free graph expansion through human-in-the-loop taxonomy approvals.
- High enterprise compliance defensibility.
