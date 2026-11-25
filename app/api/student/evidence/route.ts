import { NextRequest, NextResponse } from "next/server";
import { authorizeStudentDnaAccess, DNA_NO_STORE_HEADERS, recordDnaSecurityAudit } from "@/lib/dna/security-audit";
import {
  getStudentEvidence,
  getStudentIntelligenceProfile,
  normalizeCapabilityName,
} from "@/lib/intelligence/student-intelligence";
import {
  runClaimLevelVerification,
  invalidateClaimVerificationCache,
} from "@/lib/evidence/claim-verification-engine";
import {
  sourceRetrievalOrchestrator,
  invalidateStudentOrchestrationCache,
  getRetrievalRunHistory,
} from "@/lib/connectors/orchestrator";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paramCandidateId = searchParams.get("candidateId");
    const capability = searchParams.get("capability");
    const refresh = searchParams.get("refresh") === "true";

    const authCheck = await authorizeStudentDnaAccess(req, {
      requestedCandidateId: paramCandidateId,
      resourceName: "/api/student/evidence",
    });
    if (!authCheck.ok) return authCheck.response;

    const candidateId = authCheck.studentId;

    if (refresh) {
      invalidateClaimVerificationCache(candidateId);
      invalidateStudentOrchestrationCache(candidateId);
      await sourceRetrievalOrchestrator.executeMultiSourceRetrieval(candidateId, { forceRefresh: true });
      recordDnaSecurityAudit({
        userId: candidateId,
        actorId: candidateId,
        actorRole: "student",
        action: "DNA_ACCESSED",
        targetResource: "/api/student/evidence?refresh=true",
        outcome: "COMPLETED",
        details: "Student triggered multi-source evidence refresh.",
      });
    }

    const dossier = await runClaimLevelVerification(candidateId, { forceRefresh: refresh });
    const runHistory = getRetrievalRunHistory(candidateId);

    const allEvidence = getStudentEvidence(candidateId);
    const profile = getStudentIntelligenceProfile(candidateId);

    if (capability) {
      const norm = normalizeCapabilityName(capability);
      const items = allEvidence.filter((e) => normalizeCapabilityName(e.capability) === norm);
      const capabilitySummary = profile.capabilities[norm] || null;

      return NextResponse.json(
        {
          success: true,
          candidateId,
          capability: norm,
          capabilitySummary,
          evidence: items,
          count: items.length,
          dossier,
          runHistory,
        },
        { headers: DNA_NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        candidateId,
        evidence: allEvidence,
        totalCount: allEvidence.length,
        dossier,
        runHistory,
      },
      { headers: DNA_NO_STORE_HEADERS }
    );
  } catch (error: any) {
    console.error("GET /api/student/evidence error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch evidence" },
      { status: 500, headers: DNA_NO_STORE_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authCheck = await authorizeStudentDnaAccess(req, {
      requestedCandidateId: body?.candidateId || body?.userId,
      resourceName: "/api/student/evidence",
    });
    if (!authCheck.ok) return authCheck.response;

    const studentId = authCheck.studentId;
    invalidateClaimVerificationCache(studentId);
    invalidateStudentOrchestrationCache(studentId);

    const bundle = await sourceRetrievalOrchestrator.executeMultiSourceRetrieval(studentId, { forceRefresh: true });
    const dossier = await runClaimLevelVerification(studentId, { forceRefresh: true });

    recordDnaSecurityAudit({
      userId: studentId,
      actorId: studentId,
      actorRole: "student",
      action: "DNA_ACCESSED",
      targetResource: "POST /api/student/evidence",
      outcome: "COMPLETED",
      details: `Re-verified multi-source evidence (${bundle.artifacts.length} artifacts).`,
    });

    return NextResponse.json(
      {
        success: true,
        studentId,
        message: "Multi-source evidence refreshed and re-verified successfully.",
        bundle,
        dossier,
      },
      { headers: DNA_NO_STORE_HEADERS }
    );
  } catch (error: any) {
    console.error("POST /api/student/evidence error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to refresh evidence" },
      { status: 500, headers: DNA_NO_STORE_HEADERS }
    );
  }
}
