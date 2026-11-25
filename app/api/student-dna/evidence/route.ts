import { NextRequest, NextResponse } from "next/server";
import {
  authorizeStudentDnaAccess,
  DNA_NO_STORE_HEADERS,
  recordDnaSecurityAudit,
} from "@/lib/dna/security-audit";
import { getStudentEvidenceList, addStudentEvidenceRecord, retractEvidenceBySource } from "@/lib/dna/store";
import { DNASourceType } from "@/lib/dna/evidence-pipeline";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const skillId = searchParams.get("skillId") || undefined;
    const sourceType = (searchParams.get("sourceType") as DNASourceType) || undefined;

    const authCheck = await authorizeStudentDnaAccess(req, {
      requestedCandidateId: searchParams.get("candidateId"),
      resourceName: "/api/student-dna/evidence",
    });
    if (!authCheck.ok) return authCheck.response;

    const candidateId = authCheck.studentId;
    const evidence = await getStudentEvidenceList(candidateId, { skillId, sourceType });

    return NextResponse.json(
      {
        success: true,
        candidateId,
        totalCount: evidence.length,
        evidence,
      },
      { headers: DNA_NO_STORE_HEADERS }
    );
  } catch (error: any) {
    console.error("GET /api/student-dna/evidence error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch evidence" },
      { status: 500, headers: DNA_NO_STORE_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authCheck = await authorizeStudentDnaAccess(req, {
      requestedCandidateId: body.userId || body.candidateId,
      resourceName: "/api/student-dna/evidence",
    });
    if (!authCheck.ok) return authCheck.response;

    const candidateId = authCheck.studentId;
    let isServerVerified = false;

    // 2. Strict validation for assessment and interview evidence
    if (body.sourceType === "assessment" || body.sourceType === "interview") {
      const sessionId = body.sessionId || body.sourceId;
      if (!sessionId) {
        return NextResponse.json(
          {
            success: false,
            error: "Verified assessment evidence requires an authoritative sessionId from a completed interview/assessment."
          },
          { status: 400 }
        );
      }

      // Verify server-side session existence and candidate ownership
      const { getSessionById, getActiveSessionState, isSessionCompleted } = await import("@/lib/interview-session-store");
      const session = (await getSessionById(sessionId)) || getActiveSessionState(sessionId);

      if (!session) {
        return NextResponse.json(
          { success: false, error: "Assessment session not found." },
          { status: 404 }
        );
      }

      const sessionCandidateId = session.candidate_id || session.candidateId;
      if (sessionCandidateId && sessionCandidateId !== candidateId) {
        return NextResponse.json(
          { success: false, error: "Forbidden. Candidate isolation violation: assessment session belongs to another candidate." },
          { status: 403 }
        );
      }

      const completed = isSessionCompleted(sessionId) || session.isCompleted || session.lifecycleState === "COMPLETED" || session.status === "COMPLETED";
      if (!completed) {
        return NextResponse.json(
          { success: false, error: "Assessment session is still active. Verified evidence can only be created from completed sessions." },
          { status: 400 }
        );
      }

      isServerVerified = true;
    }

    // 3. Prevent client-controlled verificationStatus, verified flags, and score inflation
    const sanitizedPayload = {
      ...body,
      userId: candidateId,
      trustedServerVerified: isServerVerified,
      verificationStatus: isServerVerified ? "VERIFIED" : "CLAIMED"
    };

    const result = await addStudentEvidenceRecord(candidateId, sanitizedPayload);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400, headers: DNA_NO_STORE_HEADERS });
    }

    recordDnaSecurityAudit({
      userId: candidateId,
      actorId: candidateId,
      actorRole: "student",
      action: "EVIDENCE_MUTATED",
      targetResource: "/api/student-dna/evidence",
      outcome: "COMPLETED",
      details: `Added ${sanitizedPayload.sourceType || "manual"} evidence (${result.evidence?.id}).`,
    });

    return NextResponse.json(
      {
        success: true,
        evidence: result.evidence,
        auditLog: result.auditLog,
      },
      { headers: DNA_NO_STORE_HEADERS }
    );
  } catch (error: any) {
    console.error("POST /api/student-dna/evidence error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add evidence" },
      { status: 500, headers: DNA_NO_STORE_HEADERS }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const authCheck = await authorizeStudentDnaAccess(req, {
      requestedCandidateId: searchParams.get("candidateId"),
      resourceName: "/api/student-dna/evidence",
    });
    if (!authCheck.ok) return authCheck.response;

    const sourceType = searchParams.get("sourceType") as DNASourceType;
    if (!sourceType) {
      return NextResponse.json(
        { success: false, error: "Missing sourceType query parameter." },
        { status: 400, headers: DNA_NO_STORE_HEADERS }
      );
    }

    const candidateId = authCheck.studentId;
    const result = await retractEvidenceBySource(candidateId, sourceType);

    recordDnaSecurityAudit({
      userId: candidateId,
      actorId: candidateId,
      actorRole: "student",
      action: "EVIDENCE_DELETED",
      targetResource: `/api/student-dna/evidence?sourceType=${sourceType}`,
      outcome: "COMPLETED",
      details: `Retracted ${result.removedCount} evidence items for source ${sourceType}.`,
    });

    return NextResponse.json(
      {
        success: true,
        candidateId,
        sourceType,
        removedCount: result.removedCount,
      },
      { headers: DNA_NO_STORE_HEADERS }
    );
  } catch (error: any) {
    console.error("DELETE /api/student-dna/evidence error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retract evidence" },
      { status: 500, headers: DNA_NO_STORE_HEADERS }
    );
  }
}
