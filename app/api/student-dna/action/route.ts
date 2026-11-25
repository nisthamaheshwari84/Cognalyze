import { NextRequest, NextResponse } from "next/server";
import { authorizeStudentDnaAccess, DNA_NO_STORE_HEADERS, recordDnaSecurityAudit } from "@/lib/dna/security-audit";
import { getStudentEvidenceList, addStudentEvidenceRecord, invalidateUserDNAScope } from "@/lib/dna/store";
import { completeRecommendedAction } from "@/lib/dna/role-gap-engine";
import { isSafePublicUrl } from "@/lib/resilience/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authCheck = await authorizeStudentDnaAccess(req, {
      requestedCandidateId: body.userId || body.candidateId,
      resourceName: "/api/student-dna/action",
    });
    if (!authCheck.ok) return authCheck.response;

    const studentId = authCheck.studentId;
    const { actionId, skillId, artifactType, artifactUrl, details } = body;
    if (!actionId || !skillId) {
      return NextResponse.json(
        { success: false, error: "Missing actionId or skillId in completion payload." },
        { status: 400, headers: DNA_NO_STORE_HEADERS }
      );
    }

    if (artifactUrl && typeof artifactUrl === "string") {
      const urlCheck = isSafePublicUrl(artifactUrl);
      if (!urlCheck.safe) {
        recordDnaSecurityAudit({
          userId: studentId,
          actorId: studentId,
          actorRole: "student",
          action: "SSRF_URL_BLOCKED",
          targetResource: "/api/student-dna/action",
          outcome: "DENIED",
          details: `Blocked unsafe artifactUrl: ${urlCheck.reason}`,
        });
        return NextResponse.json(
          { success: false, error: `Invalid or restricted artifactUrl: ${urlCheck.reason}` },
          { status: 400, headers: DNA_NO_STORE_HEADERS }
        );
      }
    }

    const currentEvidence = await getStudentEvidenceList(studentId);
    const result = await completeRecommendedAction(
      studentId,
      actionId,
      {
        artifactType: artifactType || "project_artifact",
        artifactUrl,
        skillId,
        details,
      },
      currentEvidence
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to record action completion." },
        { status: 400, headers: DNA_NO_STORE_HEADERS }
      );
    }

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
        metadata: result.newEvidence.metadata,
      });
    }

    invalidateUserDNAScope(studentId);
    recordDnaSecurityAudit({
      userId: studentId,
      actorId: studentId,
      actorRole: "student",
      action: "EVIDENCE_MUTATED",
      targetResource: `/api/student-dna/action:${actionId}`,
      outcome: "COMPLETED",
      details: `Recorded completion of recommended action ${actionId} for ${skillId}.`,
    });

    return NextResponse.json(
      {
        success: true,
        studentId,
        actionId,
        recommendationStatus: result.updatedRecommendationStatus,
        newEvidenceId: result.newEvidence?.id,
      },
      { headers: DNA_NO_STORE_HEADERS }
    );
  } catch (error: any) {
    console.error("POST /api/student-dna/action error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process action completion" },
      { status: 500, headers: DNA_NO_STORE_HEADERS }
    );
  }
}
