import { NextResponse } from "next/server";
import { getCandidateById, getRoleById, saveCandidateDossier, MultiSourceCandidateProfile } from "@/lib/recruiter-store";
import { screenCandidateAgainstRole } from "@/lib/screening/candidate-screening-engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roleId, candidateIds } = body;

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

    // Fetch and ensure dossiers for all requested candidates
    const candidates: MultiSourceCandidateProfile[] = [];
    for (const id of candidateIds) {
      let cand = await getCandidateById(id);
      if (cand) {
        if (!cand.screeningDossier && (cand.resumeText || "").trim()) {
          const dossier = screenCandidateAgainstRole(
            {
              id: cand.id,
              name: cand.name,
              email: cand.email,
              phone: cand.phone,
              resumeText: cand.resumeText
            },
            role
          );
          cand = await saveCandidateDossier(cand.id, dossier);
        }
        if (cand) candidates.push(cand);
      }
    }

    if (candidates.length === 0) {
      return NextResponse.json({ success: false, error: "No valid candidates found" }, { status: 404 });
    }

    // Standardize matrix using the confirmed role's requirements
    const requirementsMatrix = role.tieredRequirements.map(reqItem => {
      const candidateColumns = candidates.map(cand => {
        const assessment = cand.screeningDossier?.assessments.find(
          a => a.requirementId === reqItem.id || a.requirementText.toLowerCase() === reqItem.name.toLowerCase()
        );

        return {
          candidateId: cand.id,
          candidateName: cand.name,
          evidenceState: assessment?.evidenceState || "EVIDENCE_NOT_FOUND",
          evidenceDepth: assessment?.evidenceDepth || "level_1_mentioned",
          candidateEvidence: assessment?.candidateEvidence || "No matching evidence located in submitted materials.",
          assessmentExplanation: assessment?.assessmentExplanation || "No evidence identified in resume text.",
          sourceSection: assessment?.sourceSection || "Unspecified",
          whyChain: assessment?.whyChain
        };
      });

      return {
        requirementId: reqItem.id,
        requirementText: reqItem.name,
        category: reqItem.category,
        competency: reqItem.name,
        candidates: candidateColumns
      };
    });

    return NextResponse.json({
      success: true,
      role: {
        id: role.id,
        title: role.title,
        version: role.version || 1,
        totalRequirements: role.tieredRequirements.length
      },
      candidates: candidates.map(c => ({
        id: c.id,
        name: c.name,
        overallCoverage: c.screeningDossier?.overallCoverage || "NEEDS HUMAN REVIEW",
        coverageCounts: c.screeningDossier?.coverageCounts || {
          totalAssessed: role.tieredRequirements.length,
          supportedCount: 0,
          partialCount: 0,
          notFoundCount: role.tieredRequirements.length,
          conflictingCount: 0,
          needsReviewCount: 0
        }
      })),
      matrix: requirementsMatrix
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
