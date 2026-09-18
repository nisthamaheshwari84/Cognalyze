import { NextResponse } from "next/server";
import { getCandidateById, getRoleById, getAllRoles, updateCandidateStage } from "@/lib/recruiter-store";
import { buildEvidenceGraph } from "@/lib/ai/evidence-graph";
import { generateWorkSampleTask } from "@/lib/ai/work-sample";
import { evaluateTalentRecovery } from "@/lib/ai/talent-recovery";

export async function POST(req: Request) {
  try {
    const { candidateId, roleId, verdict, rationale, customTargetRequirementId } = await req.json();

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

    // ─────────────────────────────────────────────────────────────
    // VERDICT: HIRE
    // ─────────────────────────────────────────────────────────────
    if (verdict === "Hire") {
      await updateCandidateStage(candidateId, "Hired", {
        decisionJournal: {
          verdict: "Hire",
          decidedAt: new Date().toISOString(),
          rationale: rationale || "Candidate cleared all Critical Role DNA hurdles with verified proof.",
          holdLoopCount: existingHoldCount
        }
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

      await updateCandidateStage(candidateId, "Hold - Gathering Evidence", {
        activeWorkSample: holdWorkSampleTask,
        decisionJournal: {
          verdict: "Hold",
          decidedAt: new Date().toISOString(),
          rationale: rationale || "Committee requests additional empirical evidence before final offer.",
          holdLoopCount: existingHoldCount + 1
        }
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

      await updateCandidateStage(candidateId, topAlternative ? "Talent Recovered" : "Rejected", {
        decisionJournal: {
          verdict: "Reject",
          decidedAt: new Date().toISOString(),
          rationale: rationale || "Candidate did not meet critical specialization criteria for this specific role.",
          holdLoopCount: existingHoldCount,
          recoveredRoleId: topAlternative?.targetRoleId
        }
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
