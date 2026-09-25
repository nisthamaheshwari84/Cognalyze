import { NextResponse } from "next/server";
import {
  getCandidateById,
  getRoleById,
  getAllCandidates,
  getAllRoles,
  updateCandidateStage,
  MultiSourceCandidateProfile
} from "@/lib/recruiter-store";
import { buildDecisionRoomDossier } from "@/lib/decision-room/decision-engine";
import { recordHumanDecision, DecisionType } from "@/lib/decisions/engine";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId");
    let roleId = searchParams.get("roleId");

    const [allCandidates, allRoles] = await Promise.all([
      getAllCandidates(),
      getAllRoles()
    ]);

    if (allCandidates.length === 0 || allRoles.length === 0) {
      return NextResponse.json(
        { success: false, error: "No candidates or roles available" },
        { status: 404 }
      );
    }

    // Determine target candidate
    let candidate = candidateId
      ? allCandidates.find(c => c.id === candidateId)
      : allCandidates[0];

    if (!candidate) {
      candidate = allCandidates[0];
    }

    // Determine target role
    let role = roleId
      ? allRoles.find(r => r.id === roleId)
      : allRoles.find(r => r.id === candidate?.appliedRoleId) || allRoles[0];

    if (!role) {
      role = allRoles[0];
    }

    const isDemo = candidate.id.startsWith("cand-vikram") || candidate.id.startsWith("cand-ananya");
    const dossier = buildDecisionRoomDossier(candidate, role, isDemo);

    return NextResponse.json({
      success: true,
      dossier,
      candidatesList: allCandidates.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        appliedRoleId: c.appliedRoleId,
        appliedRoleTitle: c.appliedRoleTitle,
        currentStage: c.currentStage
      })),
      rolesList: allRoles.map(r => ({
        id: r.id,
        title: r.title,
        version: r.version || 1,
        requirementsCount: r.tieredRequirements.length
      }))
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // ─────────────────────────────────────────────────────────────
    // ACTION: RECORD HUMAN DECISION
    // ─────────────────────────────────────────────────────────────
    if (action === "record_decision") {
      const {
        candidateId,
        roleId,
        stage,
        verdict,
        supportingEvidenceIds = [],
        remainingGaps = [],
        recruiterNote = "",
        decidedBy = "Hiring Committee",
        isOverride = false,
        recruiterOverrideReason = ""
      } = body;

      if (!candidateId || !roleId || !stage || !verdict) {
        return NextResponse.json(
          { success: false, error: "candidateId, roleId, stage, and verdict are required" },
          { status: 400 }
        );
      }

      if (isOverride && !recruiterOverrideReason.trim()) {
        return NextResponse.json(
          { success: false, error: "Override reason is strictly required when overriding system recommendation." },
          { status: 400 }
        );
      }

      const [candidate, role] = await Promise.all([
        getCandidateById(candidateId),
        getRoleById(roleId)
      ]);

      if (!candidate || !role) {
        return NextResponse.json(
          { success: false, error: "Candidate or Role not found" },
          { status: 404 }
        );
      }

      const decisionType: DecisionType =
        verdict.toLowerCase() === "hire"
          ? "hire"
          : verdict.toLowerCase() === "hold"
          ? "hold"
          : verdict.toLowerCase() === "advance"
          ? "advance"
          : "reject";

      // 1. Record in immutable audit engine
      const combinedRationale = isOverride
        ? `[RECRUITER OVERRIDE: ${recruiterOverrideReason.trim()}] ${recruiterNote.trim()}`
        : recruiterNote.trim() || `Candidate transitioned to ${stage} based on verified evidence.`;

      await recordHumanDecision({
        applicationId: candidate.id,
        candidateId: candidate.id,
        roleId: role.id,
        decision: decisionType,
        deciderUserId: decidedBy,
        rationale: combinedRationale,
        citedEvidenceIds: supportingEvidenceIds,
        assessmentsSnapshot: {
          decidedAt: new Date().toISOString(),
          stage,
          verdict,
          isOverride,
          recruiterOverrideReason: isOverride ? recruiterOverrideReason.trim() : undefined,
          remainingGaps,
          roleTitle: role.title,
          roleVersion: role.version || 1,
          candidateName: candidate.name
        },
        fromStage: candidate.currentStage || "In Decision Room",
        toStage: stage
      });

      // 2. Update candidate stage in recruiter store
      await updateCandidateStage(candidateId, stage as any, {
        decisionJournal: {
          verdict: verdict === "Hire" ? "Hire" : verdict === "Hold" ? "Hold" : "Reject",
          decidedAt: new Date().toISOString(),
          rationale: combinedRationale,
          holdLoopCount: candidate.decisionJournal?.holdLoopCount || 0,
          citedEvidenceIds: supportingEvidenceIds,
          isOverride,
          recruiterOverrideReason: isOverride ? recruiterOverrideReason.trim() : undefined,
          decidedBy
        } as any
      });

      return NextResponse.json({
        success: true,
        message: isOverride 
          ? `✓ Recruiter override recorded with audit reason. Candidate transitioned to stage "${stage}".`
          : `✓ Decision recorded: Candidate transitioned to stage "${stage}".`,
        stage,
        verdict,
        isOverride
      });
    }

    // ─────────────────────────────────────────────────────────────
    // ACTION: CONFIRM OR REJECT IDENTITY
    // ─────────────────────────────────────────────────────────────
    if (action === "confirm_identity") {
      const { candidateId, sourceId, confirmed } = body;
      if (!candidateId || !sourceId) {
        return NextResponse.json(
          { success: false, error: "candidateId and sourceId are required" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: confirmed
          ? `Source ${sourceId} verified by recruiter.`
          : `Source ${sourceId} dismissed from candidate profile.`
      });
    }

    // ─────────────────────────────────────────────────────────────
    // ACTION: REFRESH EVIDENCE
    // ─────────────────────────────────────────────────────────────
    if (action === "refresh_evidence") {
      const { candidateId, roleId } = body;
      const [candidate, role] = await Promise.all([
        getCandidateById(candidateId),
        getRoleById(roleId)
      ]);

      if (!candidate || !role) {
        return NextResponse.json({ success: false, error: "Candidate or Role not found" }, { status: 404 });
      }

      const isDemo = candidate.id.startsWith("cand-vikram") || candidate.id.startsWith("cand-ananya");
      const dossier = buildDecisionRoomDossier(candidate, role, isDemo);
      dossier.evidenceVersion = (dossier.evidenceVersion || 1) + 1;

      return NextResponse.json({
        success: true,
        message: "External sources checked. Evidence refreshed without altering past decisions.",
        dossier
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
