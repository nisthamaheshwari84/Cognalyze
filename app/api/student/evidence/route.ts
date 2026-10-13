import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { 
  getStudentEvidence, 
  getStudentIntelligenceProfile, 
  normalizeCapabilityName 
} from "@/lib/intelligence/student-intelligence";
import {
  runClaimLevelVerification,
  invalidateClaimVerificationCache
} from "@/lib/evidence/claim-verification-engine";
import {
  sourceRetrievalOrchestrator,
  invalidateStudentOrchestrationCache,
  getRetrievalRunHistory
} from "@/lib/connectors/orchestrator";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth || !auth.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to view candidate evidence." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const paramCandidateId = searchParams.get("candidateId");
    const capability = searchParams.get("capability");
    const refresh = searchParams.get("refresh") === "true";

    // Strict multi-tenant authorization
    let candidateId = auth.user.id;
    if (auth.user.accountType === "recruiter") {
      candidateId = paramCandidateId || auth.user.id;
    } else {
      // Students can ONLY access their own evidence records
      candidateId = auth.user.id;
    }

    if (refresh) {
      invalidateClaimVerificationCache(candidateId);
      invalidateStudentOrchestrationCache(candidateId);
      await sourceRetrievalOrchestrator.executeMultiSourceRetrieval(candidateId, { forceRefresh: true });
    }

    // Run claim-level multi-source verification
    const dossier = await runClaimLevelVerification(candidateId, { forceRefresh: refresh });
    const runHistory = getRetrievalRunHistory(candidateId);

    const allEvidence = getStudentEvidence(candidateId);
    const profile = getStudentIntelligenceProfile(candidateId);

    if (capability) {
      const norm = normalizeCapabilityName(capability);
      const items = allEvidence.filter(e => normalizeCapabilityName(e.capability) === norm);
      const capabilitySummary = profile.capabilities[norm] || null;

      return NextResponse.json({
        success: true,
        candidateId,
        capability: norm,
        capabilitySummary,
        evidence: items,
        count: items.length,
        dossier,
        runHistory
      });
    }

    return NextResponse.json({
      success: true,
      candidateId,
      evidence: allEvidence,
      totalCount: allEvidence.length,
      dossier,
      runHistory
    });
  } catch (error: any) {
    console.error("GET /api/student/evidence error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch evidence" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth || !auth.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to trigger evidence refresh." },
        { status: 401 }
      );
    }

    const studentId = auth.user.id;
    invalidateClaimVerificationCache(studentId);
    invalidateStudentOrchestrationCache(studentId);

    const bundle = await sourceRetrievalOrchestrator.executeMultiSourceRetrieval(studentId, { forceRefresh: true });
    const dossier = await runClaimLevelVerification(studentId, { forceRefresh: true });

    return NextResponse.json({
      success: true,
      studentId,
      message: "Multi-source evidence refreshed and re-verified successfully.",
      bundle,
      dossier
    });
  } catch (error: any) {
    console.error("POST /api/student/evidence error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to refresh evidence" },
      { status: 500 }
    );
  }
}

