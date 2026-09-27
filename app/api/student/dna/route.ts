import { NextRequest, NextResponse } from "next/server";
import { getStudentDNA, setTeamMatchOptIn, invalidateStudentDNACache } from "@/lib/ai/student-dna";
import { 
  getStudentIntelligenceProfile, 
  updateCareerIntent, 
  getStudentEvidence 
} from "@/lib/intelligence/student-intelligence";
import { runEvidenceEngine } from "@/lib/intelligence/evidence-engine";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const { searchParams } = new URL(req.url);
    const paramCandidateId = searchParams.get("candidateId");

    // If user is an authenticated student, STRICTLY scope to their own user id
    let candidateId = paramCandidateId;
    if (auth && auth.user && auth.user.accountType === "student") {
      candidateId = auth.user.id;
    } else if (!candidateId) {
      if (auth && auth.user) {
        candidateId = auth.user.id;
      } else {
        return NextResponse.json({
          success: false,
          error: "Unauthorized. Please sign in.",
          authenticated: false,
        }, { status: 401 });
      }
    }

    const refresh = searchParams.get("refresh") === "true";

    if (refresh) {
      invalidateStudentDNACache(candidateId);
    }

    const [dna, intelligence, evidence] = await Promise.all([
      getStudentDNA(candidateId),
      getStudentIntelligenceProfile(candidateId),
      getStudentEvidence(candidateId)
    ]);

    const evidenceEngine = runEvidenceEngine(candidateId);

    return NextResponse.json({
      success: true,
      candidateId,
      dna,
      intelligence,
      evidence,
      evidenceEngine
    });
  } catch (error: any) {
    console.error("GET /api/student/dna error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch student DNA" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const body = await req.json();
    let candidateId = body.candidateId || "student-demo";
    if (auth && auth.user && auth.user.accountType === "student") {
      candidateId = auth.user.id;
    }
    const { 
      teamMatchOptIn,
      careerIntent
    } = body;

    if (typeof teamMatchOptIn === "boolean") {
      setTeamMatchOptIn(candidateId, teamMatchOptIn);
    }

    if (careerIntent) {
      updateCareerIntent({
        ...careerIntent,
        studentId: candidateId
      });
    }

    const [dna, intelligence] = await Promise.all([
      getStudentDNA(candidateId),
      getStudentIntelligenceProfile(candidateId)
    ]);

    return NextResponse.json({
      success: true,
      dna,
      intelligence
    });
  } catch (error: any) {
    console.error("POST /api/student/dna error:", error);
    return NextResponse.json({ error: error.message || "Failed to update student DNA settings" }, { status: 500 });
  }
}
