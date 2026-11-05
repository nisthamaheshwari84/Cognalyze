import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { getStudentEvidenceList, addStudentEvidenceRecord, retractEvidenceBySource } from "@/lib/dna/store";
import { DNASourceType } from "@/lib/dna/evidence-pipeline";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Valid student session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const skillId = searchParams.get("skillId") || undefined;
    const sourceType = (searchParams.get("sourceType") as DNASourceType) || undefined;
    const candidateId = auth.user.id;

    const evidence = await getStudentEvidenceList(candidateId, { skillId, sourceType });

    return NextResponse.json({
      success: true,
      candidateId,
      totalCount: evidence.length,
      evidence
    });
  } catch (error: any) {
    console.error("GET /api/student-dna/evidence error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch evidence" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Valid student session required." },
        { status: 401 }
      );
    }

    const candidateId = auth.user.id;
    const body = await req.json();

    // 1. Cross-candidate write prevention (P1 Fix SEC-EVID-01)
    if (body.userId && body.userId !== candidateId) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Cannot add or forge evidence for another candidate." },
        { status: 403 }
      );
    }

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
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      evidence: result.evidence,
      auditLog: result.auditLog
    });
  } catch (error: any) {
    console.error("POST /api/student-dna/evidence error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to add evidence" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Valid student session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sourceType = searchParams.get("sourceType") as DNASourceType;

    if (!sourceType) {
      return NextResponse.json({ success: false, error: "Missing sourceType query parameter." }, { status: 400 });
    }

    const candidateId = auth.user.id;
    const result = await retractEvidenceBySource(candidateId, sourceType);

    return NextResponse.json({
      success: true,
      candidateId,
      sourceType,
      removedCount: result.removedCount
    });
  } catch (error: any) {
    console.error("DELETE /api/student-dna/evidence error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to retract evidence" }, { status: 500 });
  }
}
