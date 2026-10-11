import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { buildCandidateUnifiedEvidenceDossier, invalidateCandidateEvidence } from "@/lib/evidence/candidate-evidence-engine";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to view candidate source intelligence." },
        { status: 401 }
      );
    }

    if (auth.user.accountType === "recruiter") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Recruiter accounts must use the recruiter candidate pipeline." },
        { status: 403 }
      );
    }

    const candidateId = auth.user.id;
    const { searchParams } = new URL(req.url);
    const refresh = searchParams.get("refresh") === "true";

    if (refresh) {
      invalidateCandidateEvidence(candidateId);
    }

    const dossier = await buildCandidateUnifiedEvidenceDossier(candidateId, { forceRefresh: refresh });

    return NextResponse.json({
      success: true,
      candidateId,
      dossier
    });
  } catch (error: any) {
    console.error("GET /api/student-dna/source-intelligence error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch candidate source intelligence" },
      { status: 500 }
    );
  }
}
