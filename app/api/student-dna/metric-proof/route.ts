import { NextRequest, NextResponse } from "next/server";
import { authorizeStudentDnaAccess, DNA_NO_STORE_HEADERS } from "@/lib/dna/security-audit";
import { getStudentEvidenceList } from "@/lib/dna/store";
import { getMetricProof, calculateStudentDNAMetrics } from "@/lib/dna/metric-proof";
import { getStudentProfileByUserId } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const metricKey = searchParams.get("metricKey");

    const authCheck = await authorizeStudentDnaAccess(req, {
      requestedCandidateId: searchParams.get("candidateId"),
      resourceName: "/api/student-dna/metric-proof",
    });
    if (!authCheck.ok) return authCheck.response;

    const studentId = authCheck.studentId;
    const evidencePool = await getStudentEvidenceList(studentId);
    const authProfile = getStudentProfileByUserId(studentId);
    const studentClaims = (authProfile?.skills || []).map((s: any) => ({
      skillName: typeof s === "string" ? s : s.name,
      claimedLevel: typeof s === "object" && s.level ? s.level : "Intermediate",
    }));

    if (metricKey) {
      const proof = await getMetricProof(studentId, metricKey, evidencePool, studentClaims);
      if (!proof) {
        return NextResponse.json(
          { success: false, error: `Metric '${metricKey}' not found.` },
          { status: 404, headers: DNA_NO_STORE_HEADERS }
        );
      }
      return NextResponse.json(
        {
          success: true,
          studentId,
          metricKey,
          proof,
        },
        { headers: DNA_NO_STORE_HEADERS }
      );
    }

    const allMetrics = await calculateStudentDNAMetrics(studentId, evidencePool, studentClaims);
    return NextResponse.json(
      {
        success: true,
        studentId,
        metrics: allMetrics,
      },
      { headers: DNA_NO_STORE_HEADERS }
    );
  } catch (error: any) {
    console.error("GET /api/student-dna/metric-proof error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate metric proof" },
      { status: 500, headers: DNA_NO_STORE_HEADERS }
    );
  }
}
