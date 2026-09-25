import { NextResponse } from "next/server";
import { getCandidateById, getRoleById, getAllRoles, updateCandidateStage } from "@/lib/recruiter-store";
import { buildEvidenceGraph } from "@/lib/ai/evidence-graph";
import { generateWorkSampleTask } from "@/lib/ai/work-sample";
import { evaluateTalentRecovery } from "@/lib/ai/talent-recovery";
import { recordHumanDecision, DecisionType } from "@/lib/decisions/engine";

export async function POST(req: Request) {
  try {
    const {
      candidateId,
      roleId,
      verdict,
      rationale,
      customTargetRequirementId,
      decidedBy = "Hiring Committee",
      citedEvidenceIds = []
    } = await req.json();

    if (!candidateId || !roleId || !verdict) {
      return NextResponse.json({ success: false, error: "candidateId, roleId, and verdict are required" }, { status: 400 });
    }

    const [candidate, role, allRoles] = await Promise.all([
      getCandidateById(candidateId),
      getRoleById(roleId),
      getAllRoles()
    ]);

    if (!candidate || !role) {
      return NextResponse.json({ success: false, error: "Candidate or Role not found" }, { status: 404 });
    }

    const existingHoldCount = candidate.decisionJournal?.holdLoopCount || 0;
    const normDecision: DecisionType = verdict.toLowerCase() === "hire" ? "hire" : verdict.toLowerCase() === "hold" ? "hold" : "reject";

    // ─────────────────────────────────────────────────────────────
    // VERDICT: HIRE
    // ─────────────────────────────────────────────────────────────
    if (verdict === "Hire") {
      await recordHumanDecision({
        applicationId: candidate.id,
        candidateId: candidate.id,
        roleId: role.id,
        decision: "hire",
        deciderUserId: decidedBy,
        rationale: rationale || "Candidate cleared all Critical Role DNA hurdles with verified proof.",
        citedEvidenceIds,
        assessmentsSnapshot: {
          decidedAt: new Date().toISOString(),
          roleTitle: role.title,
          candidateName: candidate.name,
          holdLoopCount: existingHoldCount
        },
        fromStage: candidate.currentStage || "In Decision Room",
        toStage: "Hired"
      });

      return NextResponse.json({
        success: true,
        verdict: "Hire",
        message: `Candidate ${candidate.name} has been hired. Transitioned to Onboarding & 30/60/90 Quality-of-Hire loop.`
      });
    }


    // ─────────────────────────────────────────────────────────────
    // VERDICT: HOLD (More Evidence Loopback to Phase 7)
    // ─────────────────────────────────────────────────────────────
    if (verdict === "Hold") {
      // Find the first unresolved requirement to generate a new verification challenge for
      const { candidateDNA } = buildEvidenceGraph(
        {
          id: candidate.id,
          name: candidate.name,
          resumeText: candidate.resumeText,
          githubData: candidate.githubData,
          studentProjects: candidate.studentProjects,
          hackathons: candidate.hackathonRecords,
          workSampleResults: candidate.workSampleResults
        },
        role
      );

      const unresolvedReq = candidateDNA.evidenceGraph.find(n => n.uncertaintyStatus !== "known");
      const targetReqId = customTargetRequirementId || unresolvedReq?.requirementId || role.tieredRequirements[0].id;

      // Phase 10 loops directly back into Phase 7 Work Sample engine!
      const holdWorkSampleTask = generateWorkSampleTask(role, targetReqId, "hold_evidence_gather");

      await recordHumanDecision({
        applicationId: candidate.id,
        candidateId: candidate.id,
        roleId: role.id,
        decision: "hold",
        deciderUserId: decidedBy,
        rationale: rationale || "Committee requests additional empirical evidence before final offer.",
        citedEvidenceIds,
        assessmentsSnapshot: {
          decidedAt: new Date().toISOString(),
          targetRequirementId: targetReqId,
          roleTitle: role.title,
          holdLoopCount: existingHoldCount + 1
        },
        fromStage: candidate.currentStage || "In Decision Room",
        toStage: "Hold - Gathering Evidence"
      });

      // Keep active work sample on candidate profile for prompt resolution
      await updateCandidateStage(candidateId, "Hold - Gathering Evidence", {
        activeWorkSample: holdWorkSampleTask
      });

      return NextResponse.json({
        success: true,
        verdict: "Hold",
        holdLoopCount: existingHoldCount + 1,
        message: `Candidate placed on Hold. Initiated Phase 7 verification loopback to collect empirical evidence.`,
        triggeredWorkSampleTask: holdWorkSampleTask
      });
    }

    // ─────────────────────────────────────────────────────────────
    // VERDICT: REJECT (Triggers Phase 11 Talent Recovery)
    // ─────────────────────────────────────────────────────────────
    if (verdict === "Reject") {
      const { candidateDNA } = buildEvidenceGraph(
        {
          id: candidate.id,
          name: candidate.name,
          resumeText: candidate.resumeText,
          githubData: candidate.githubData,
          studentProjects: candidate.studentProjects,
          hackathons: candidate.hackathonRecords,
          workSampleResults: candidate.workSampleResults
        },
        role
      );

      const talentRecovery = evaluateTalentRecovery(candidateDNA, role.id, allRoles);
      const topAlternative = talentRecovery.recoveredMatches[0];

      await recordHumanDecision({
        applicationId: candidate.id,
        candidateId: candidate.id,
        roleId: role.id,
        decision: "reject",
        deciderUserId: decidedBy,
        rationale: rationale || "Candidate did not meet critical specialization criteria for this specific role.",
        citedEvidenceIds,
        assessmentsSnapshot: {
          decidedAt: new Date().toISOString(),
          roleTitle: role.title,
          candidateName: candidate.name,
          recoveredRoleId: topAlternative?.targetRoleId
        },
        fromStage: candidate.currentStage || "In Decision Room",
        toStage: topAlternative ? "Talent Recovered" : "Rejected"
      });


      return NextResponse.json({
        success: true,
        verdict: "Reject",
        message: `Candidate rejected from ${role.title}. Talent Recovery engine executed.`,
        talentRecovery
      });
    }

    return NextResponse.json({ success: false, error: "Invalid verdict. Expected 'Hire', 'Hold', or 'Reject'." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
