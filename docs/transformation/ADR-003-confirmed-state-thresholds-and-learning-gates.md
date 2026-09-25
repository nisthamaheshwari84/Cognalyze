# ADR-003: Requirement State Thresholds and Gated Learning Sample Sizes

## Context
PART 13 Decision 1 required confirming the state machine thresholds for `derive()` (PART 5.2) and the minimum sample size for the organizational learning loop (PART 10).
The user approved the proposed defaults on 2026-09-20.

## Decision
1. **Requirement State Machine Thresholds (`derive()`)**:
   - `ESTABLISHED`:
     - $\ge 1$ direct-coverage evidence item at Tier T2+ (observed artifact, demonstrated task, or validated interview), OR
     - Direct-coverage Tier T1+ evidence from $\ge 2$ independent, verified sources.
     - AND no unresolved conflicting evidence.
   - `PARTIAL`:
     - Relevant evidence exists, but only provides adjacent coverage, OR
     - Direct-coverage Tier T0 or T1 evidence from only a single source, OR
     - Direct Tier T2+ evidence whose `occurred_at` timestamp exceeds the per-capability recency window (default: 24 months).
   - `UNKNOWN`:
     - Zero evidence items bearing on the requirement. (Under Truth Contract T5: "Absence of evidence is not evidence of absence").
   - `CONFLICTING`:
     - Contradicting evidence links exist for this requirement and have not been dismissed or resolved by a human recruiter.
   - `NOT_ESTABLISHED_AFTER_VALIDATION`:
     - A structured T3 (demonstration) or T4 (rubric interview) validation task was executed and the candidate did not meet the rubric criteria.
     - Uses neutral language: "Not established after structured validation on <date>". Still permits candidate to attach future evidence.
   - `NOT_APPLICABLE`:
     - Explicitly dismissed or waived by the recruiter for this candidate or role.

2. **Gated Learning Loop Sample Size (PART 10)**:
   - Minimum threshold: $N = 20$ completed 90-day outcome reviews for comparable roles within the organization.
   - Below $N = 20$: The learning panel displays: *"Not enough completed hires yet (k of 20)"*.
   - When $N \ge 20$: Shows aggregate, observational patterns with sample sizes and explicitly notes the selection-bias caveat (only hired candidates generate outcomes). The system never claims prediction or causation.

## Consequences
- Every assessment is deterministic, reproducible, versioned, and free of arbitrary numeric scores.
- Clear separation between "we haven't checked" (UNKNOWN) and "checked but not established" (NOT_ESTABLISHED_AFTER_VALIDATION).
- Full protection against premature automated pattern matching on statistically insignificant sample sizes.
