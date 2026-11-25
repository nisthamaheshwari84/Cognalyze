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

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  Vary: "Cookie, Authorization",
};

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const { searchParams } = new URL(req.url);
    const queryCandidateId = searchParams.get("candidateId");

    if (!auth || !auth.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Student DNA requires authentication.",
          authenticated: false,
          requiresAuth: true
        },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    if (auth.user.accountType === "recruiter") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden. Recruiter accounts are restricted from accessing Student DNA directly.",
          authenticated: true,
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    if (queryCandidateId && queryCandidateId !== auth.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden. Cannot read another student's DNA.",
          authenticated: true,
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const candidateId = auth.user.id;

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

    // Subsystem Convergence (Phase 2): Bridge authoritative dnaFull into intelligence so dashboard displays canonical metrics
    const unifiedIntelligence = {
      ...intelligence,
      totalEvidenceCount: Math.max(intelligence?.totalEvidenceCount || 0, dnaFull?.evidence?.length || 0),
      verifiedEvidenceCount: Math.max(
        intelligence?.verifiedEvidenceCount || 0,
        (dnaFull?.evidence?.filter(e => e.verificationStatus === "VERIFIED" || e.verificationStatus === "DEMONSTRATED").length) || 0
      ),
      capabilitiesCount: Math.max(intelligence?.capabilitiesCount || 0, dnaFull?.skills?.length || 0),
      gaps: (intelligence?.gaps && intelligence.gaps.length > 0)
        ? intelligence.gaps
        : (dnaFull?.gapReport?.gaps || []).map((g: any) => ({
            id: `gap_${g.skillId}`,
            capability: g.skillName,
            importance: g.importance === "MUST_HAVE" ? "core" : "important",
            gapType: g.status,
            title: `Strengthen ${g.skillName}`,
            description: g.statusReason || `Current level: ${g.currentLevelLabel}, target: ${g.targetLevelLabel}`,
            currentLevel: g.currentLevelLabel,
            expectedLevel: g.targetLevelLabel,
            recommendedActionId: g.recommendedAction?.actionId
          }))
    };

    return NextResponse.json({
      success: true,
      candidateId,
      dna,
      intelligence: unifiedIntelligence,
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
