# ADR-002: Anti-Simulation Contract Enforcement and Elimination of Magic Scores

## Context
The codebase contains remnants of mock data, hardcoded benchmark candidate arrays in UI buttons, fake setTimeout delays, random ID generators, arbitrary Gaussian scoring functions, company tier blacklists, and face/body language proctoring heuristics.

The master brief establishes two non-negotiable contracts:
- **Truth Contract**: Every conclusion is a rendering of stored rows (claim -> evidence -> source). No numeric capability scores, percentages, or rank numbers for people. Deterministic quote verifier for LLM extractions.
- **Anti-Simulation Contract**: No mock data in runtime paths. Every number comes from a query. Forbidden patterns (`Math.random`, `faker`, hardcoded percentages, artificial delays) must be flagged and rejected by CI.

## Decision
1. **Purge Fake Data in Runtime**:
   - `get100BenchmarkCandidates()` and synthetic arrays will be removed from all production UI buttons (`app/recruiter/candidates/page.tsx`). Dev seed scripts will be isolated to `scripts/seed-dev/` with `is_synthetic = true`.
   - `generateSampleHireRecords()` will be eliminated from the production store initialization in `lib/recruiter-store.ts`. Empty states will display honest guidance ("No completed hires yet").
   - Artificial `setTimeout(r, 800 + Math.random() * 500)` delays in `app/interview/page.tsx` and `app/secure-interview/page.tsx` will be removed.
2. **Deprecate Prohibited Heuristics**:
   - Decommission `/api/body-language`, `/api/face-check`, and `/api/ai-text-detect`. The platform strictly does not evaluate emotion, face geometry, or stylistic AI-detection.
3. **CI Anti-Simulation Gate**:
   - Implement `scripts/check-no-simulation.ts` running in CI/pre-build to fail the build if forbidden patterns occur in `src/` or `app/` outside unit tests and seed tools.

## Consequences
- Clean, auditable, truthful product behavior.
- Complete regulatory and ethical alignment with modern AI hiring standards.
