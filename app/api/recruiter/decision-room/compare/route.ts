import { NextResponse } from "next/server";
import { getCandidateById, getRoleById } from "@/lib/recruiter-store";
import { buildDecisionRoomDossier, DecisionRoomDossier } from "@/lib/decision-room/decision-engine";

export async function POST(req: Request) {
  try {
    const { roleId, candidateIds } = await req.json();

    if (!roleId || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "roleId and an array of candidateIds are required" },
        { status: 400 }
      );
    }

    const role = await getRoleById(roleId);
    if (!role) {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }

    const candidateDossiers: DecisionRoomDossier[] = [];
    for (const cId of candidateIds.slice(0, 4)) {
      const cand = await getCandidateById(cId);
      if (cand) {
        const isDemo = cand.id.startsWith("cand-vikram") || cand.id.startsWith("cand-ananya");
        const dossier = buildDecisionRoomDossier(cand, role, isDemo);
        candidateDossiers.push(dossier);
      }
    }

    if (candidateDossiers.length === 0) {
      return NextResponse.json({ success: false, error: "No valid candidates found" }, { status: 404 });
    }

    // Standardize comparison across confirmed role requirements
    const requirementRows = role.tieredRequirements.map(reqItem => {
      const candidateColumns = candidateDossiers.map(d => {
        const match = d.requirementsMatch.find(m => m.requirementId === reqItem.id);
        return {
          candidateId: d.candidateId,
          candidateName: d.candidateName,
          evidenceState: match?.evidenceState || "EVIDENCE_NOT_FOUND",
          evidenceDepth: match?.evidenceDepth || "MENTIONED",
          candidateEvidence: match?.candidateEvidence || "No evidence identified in submitted materials.",
          sourceName: match?.sourceName || "Application",
          evidenceGap: match?.evidenceGap
        };
      });

      return {
        requirementId: reqItem.id,
        requirementName: reqItem.name,
        tier: reqItem.tier,
        category: reqItem.category,
        candidates: candidateColumns
      };
    });

    return NextResponse.json({
      success: true,
      role: {
        id: role.id,
        title: role.title,
        version: role.version || 1
      },
      candidates: candidateDossiers.map(d => ({
        id: d.candidateId,
        name: d.candidateName,
        currentStage: d.currentStage,
        coverageCounts: d.coverageCounts,
        projectsCount: d.inspectedProjects.length,
        verifiedSourcesCount: d.discoveredSources.filter(s => s.identityStatus === "VERIFIED").length
      })),
      requirementRows
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
