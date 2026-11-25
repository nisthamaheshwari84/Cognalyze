import { NextRequest, NextResponse } from "next/server";
import { authorizeStudentDnaAccess, DNA_NO_STORE_HEADERS, recordDnaSecurityAudit } from "@/lib/dna/security-audit";
import { buildCandidateUnifiedEvidenceDossier, invalidateCandidateEvidence } from "@/lib/evidence/candidate-evidence-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const refresh = searchParams.get("refresh") === "true";

    const authCheck = await authorizeStudentDnaAccess(req, {
      requestedCandidateId: searchParams.get("candidateId"),
      resourceName: "/api/student-dna/source-intelligence",
    });
    if (!authCheck.ok) return authCheck.response;

    const candidateId = authCheck.studentId;
    if (refresh) {
      invalidateCandidateEvidence(candidateId);
      recordDnaSecurityAudit({
        userId: candidateId,
        actorId: candidateId,
        actorRole: "student",
        action: "DNA_ACCESSED",
        targetResource: "/api/student-dna/source-intelligence?refresh=true",
        outcome: "COMPLETED",
        details: "Student refreshed unified evidence dossier.",
      });
    }

    const dossier = await buildCandidateUnifiedEvidenceDossier(candidateId, { forceRefresh: refresh });

    return NextResponse.json(
      {
        success: true,
        candidateId,
        dossier,
      },
      { headers: DNA_NO_STORE_HEADERS }
    );
  } catch (error: any) {
    console.error("GET /api/student-dna/source-intelligence error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch candidate source intelligence" },
      { status: 500, headers: DNA_NO_STORE_HEADERS }
    );
  }
}
