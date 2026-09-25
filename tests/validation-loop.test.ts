import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { planNextBestEvidence } from "../lib/validation/planner";
import { recordValidationResultAndReDerive } from "../lib/validation/re-derivation";
import { generateCritiqueLenses } from "../lib/ai/debate-lenses";
import { EvidenceItemInput } from "../lib/evidence/derive";

describe("Validation Planner, Re-Derivation Loop, & Debate Lenses (Phase 5)", () => {
  const fixedNow = new Date("2026-09-20T00:00:00Z");

  it("Acceptance Check 1: Every generated validation task strictly links to requirementId and openAssessmentId", () => {
    const plan = planNextBestEvidence({
      candidateId: "cand-123",
      roleId: "role-backend",
      openAssessments: [
        {
          requirementId: "req-k8s",
          requirementName: "Kubernetes microservices deployment",
          state: "UNKNOWN",
          assessmentId: "assess-k8s-1",
        },
        {
          requirementId: "req-auth",
          requirementName: "Distributed OAuth token service",
          state: "PARTIAL",
          assessmentId: "assess-auth-1",
          candidateProjectName: "AuthNode-Microservice",
        },
      ],
    });

    assert.strictEqual(plan.tasks.length, 2);

    for (const task of plan.tasks) {
      assert.ok(task.requirementId, "Must link to requirementId");
      assert.ok(task.openAssessmentId, "Must link to openAssessmentId");
      assert.ok(task.rubric.length > 0, "Must contain structured rubric criteria");
      assert.ok(task.candidateMinutes > 0, "Must declare candidate minutes");
      assert.ok(task.recruiterMinutes > 0, "Must declare recruiter minutes");
    }

    // Auth task on candidate's project should be an ownership task
    const authTask = plan.tasks.find((t) => t.requirementId === "req-auth");
    assert.strictEqual(authTask?.methodId, "ownership_modification_exercise");
    assert.ok(authTask?.promptOrScenario.includes("AuthNode-Microservice"));
  });

  it("Acceptance Check 2: Completed validation task creates T3/T4 evidence and changes assessment on re-derive", () => {
    // Initial state: UNKNOWN (0 evidence items)
    const initialEvidence: EvidenceItemInput[] = [];

    // Candidate undergoes structured T4 technical interview validation probe and passes rubric criteria
    const resultPass = recordValidationResultAndReDerive({
      taskId: "task-k8s-session-1",
      requirementId: "req-k8s",
      candidateId: "cand-123",
      evaluatorId: "interviewer-sarah",
      tier: "T4",
      established: true,
      evaluatorNotes: "Candidate articulated multi-cluster failover and Helm rollback mechanisms clearly.",
      existingEvidence: initialEvidence,
      now: fixedNow,
    });

    // Verification: Assessment state changed from UNKNOWN to ESTABLISHED
    assert.strictEqual(resultPass.newState, "ESTABLISHED");
    assert.strictEqual(resultPass.loopClosed, true);
    assert.ok(resultPass.newEvidenceItem);
    assert.strictEqual(resultPass.newEvidenceItem?.tier, "T4");
    assert.strictEqual(resultPass.newEvidenceItem?.coverage, "direct");

    // Case B: Candidate fails validation task
    const resultFail = recordValidationResultAndReDerive({
      taskId: "task-distributed-db",
      requirementId: "req-dist-db",
      candidateId: "cand-123",
      evaluatorId: "interviewer-sarah",
      tier: "T3",
      established: false,
      evaluatorNotes: "Failed to implement basic partition key routing.",
      existingEvidence: initialEvidence,
      now: fixedNow,
    });

    assert.strictEqual(resultFail.newState, "NOT_ESTABLISHED_AFTER_VALIDATION");
    assert.strictEqual(resultFail.loopClosed, true);
    assert.strictEqual(resultFail.updatedAssessment.hasValidationAttempt, true);
  });

  it("Debate committee critique lenses cite evidence IDs and drop ungrounded outputs", () => {
    const report = generateCritiqueLenses({
      candidateId: "cand-123",
      evidenceItems: [
        {
          id: "ev-1",
          quote: "Architected distributed ledger in Go: github.com/user/ledger",
          tier: "T2",
          quoteVerified: true,
          artifactRef: "github.com/user/ledger",
        },
        {
          id: "ev-2",
          quote: "Maintained cloud servers",
          tier: "T1",
          quoteVerified: true,
        },
      ],
      claims: [
        { id: "claim-1", text: "Go systems architect", kind: "skill" },
      ],
      assessments: {
        "req-k8s": {
          state: "UNKNOWN",
          requirementName: "Kubernetes container orchestration",
        },
      },
    });

    assert.ok(report.observations.length >= 2);

    // Every observation MUST have at least one cited evidence ID
    for (const obs of report.observations) {
      assert.ok(obs.citedEvidenceIds.length > 0, "Observation must cite evidence ID");
    }

    const strongest = report.observations.find((o) => o.lens === "strongest_evidence");
    assert.ok(strongest?.citedEvidenceIds.includes("ev-1"));

    const unverified = report.observations.find((o) => o.lens === "unsupported_claims");
    assert.ok(unverified?.citedEvidenceIds.includes("ev-2"));
  });
});
