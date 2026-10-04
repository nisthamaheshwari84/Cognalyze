import { NextRequest, NextResponse } from "next/server";
import { getStudentDNA, setTeamMatchOptIn, invalidateStudentDNACache } from "@/lib/ai/student-dna";
import { 
  getStudentIntelligenceProfile, 
  updateCareerIntent, 
  getStudentEvidence 
} from "@/lib/intelligence/student-intelligence";
import { runEvidenceEngine } from "@/lib/intelligence/evidence-engine";
import { getStudentDNAFull } from "@/lib/dna/store";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const { searchParams } = new URL(req.url);
    const queryCandidateId = searchParams.get("candidateId");

    if (!auth && !queryCandidateId) {
      return NextResponse.json({
        success: false,
        error: "Unauthorized. Please sign in to access Student DNA.",
        authenticated: false,
      }, { status: 401 });
    }

    if (auth && auth.user.accountType === "recruiter") {
      return NextResponse.json({
        success: false,
        error: "Forbidden. Recruiter accounts are restricted from accessing Student DNA.",
        authenticated: true,
      }, { status: 403 });
    }

    // Strictly scope query to the authenticated student or explicit candidate ID
    const candidateId = auth?.user?.id || queryCandidateId || "student-demo";
    const refresh = searchParams.get("refresh") === "true";

    if (refresh) {
      invalidateStudentDNACache(candidateId);
    }

    const [dna, intelligence, evidence, dnaFull] = await Promise.all([
      getStudentDNA(candidateId),
      getStudentIntelligenceProfile(candidateId),
      getStudentEvidence(candidateId),
      getStudentDNAFull(candidateId)
    ]);

    const evidenceEngine = runEvidenceEngine(candidateId);

    return NextResponse.json({
      success: true,
      candidateId,
      dna,
      intelligence,
      evidence,
      evidenceEngine,
      dnaFull
    });
  } catch (error: any) {
    console.error("GET /api/student/dna error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch student DNA" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth) {
      return NextResponse.json({
        success: false,
        error: "Unauthorized. Please sign in.",
        authenticated: false,
      }, { status: 401 });
    }

    if (auth.user.accountType === "recruiter") {
      return NextResponse.json({
        success: false,
        error: "Forbidden. Recruiter accounts cannot modify Student DNA.",
        authenticated: true,
      }, { status: 403 });
    }

    const candidateId = auth.user.id;
    const body = await req.json();
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
