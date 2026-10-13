import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { getStudentEvidenceList, addStudentEvidenceRecord, invalidateUserDNAScope } from "@/lib/dna/store";
import { completeRecommendedAction } from "@/lib/dna/role-gap-engine";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to complete actions." },
        { status: 401 }
      );
    }

    if (auth.user.accountType === "recruiter") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Recruiter accounts cannot submit student actions." },
        { status: 403 }
      );
    }

    const studentId = auth.user.id;
    const body = await req.json();

    const { actionId, skillId, artifactType, artifactUrl, details } = body;
    if (!actionId || !skillId) {
      return NextResponse.json(
        { success: false, error: "Missing actionId or skillId in completion payload." },
        { status: 400 }
      );
    }

    const currentEvidence = await getStudentEvidenceList(studentId);
    const result = await completeRecommendedAction(
      studentId,
      actionId,
      {
        artifactType: artifactType || "project_artifact",
        artifactUrl,
        skillId,
        details
      },
      currentEvidence
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to record action completion." },
        { status: 400 }
      );
    }

    // Persist new evidence record through store to update disk/cloud and audit log
    if (result.newEvidence) {
      await addStudentEvidenceRecord(studentId, {
        sourceType: result.newEvidence.sourceType,
        sourceId: result.newEvidence.sourceId,
        userId: studentId,
        skillRaw: result.newEvidence.skillId,
        evidenceType: result.newEvidence.evidenceType,
        claim: result.newEvidence.claim,
        extractedValue: result.newEvidence.extractedValue,
        strength: result.newEvidence.strength,
        timestamp: result.newEvidence.observedAt || result.newEvidence.createdAt,
        metadata: result.newEvidence.metadata
      });
    }

    // Invalidate cached DNA so subsequent queries recompute immediately
    invalidateUserDNAScope(studentId);

    return NextResponse.json({
      success: true,
      studentId,
      actionId,
      recommendationStatus: result.updatedRecommendationStatus,
      newEvidenceId: result.newEvidence?.id
    });
  } catch (error: any) {
    console.error("POST /api/student-dna/action error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process action completion" },
      { status: 500 }
    );
  }
}
