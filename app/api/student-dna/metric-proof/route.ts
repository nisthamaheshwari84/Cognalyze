import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { getStudentEvidenceList } from "@/lib/dna/store";
import { getMetricProof, calculateStudentDNAMetrics } from "@/lib/dna/metric-proof";
import { getStudentProfileByUserId } from "@/lib/auth/store";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to view metric proofs." },
        { status: 401 }
      );
    }

    if (auth.user.accountType === "recruiter") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Recruiter accounts cannot inspect candidate metric proofs directly." },
        { status: 403 }
      );
    }

    // Scoped strictly to the authenticated student's permanent ID
    const studentId = auth.user.id;
    const { searchParams } = new URL(req.url);
    const metricKey = searchParams.get("metricKey");

    const evidencePool = await getStudentEvidenceList(studentId);
    const authProfile = getStudentProfileByUserId(studentId);
    const studentClaims = (authProfile?.skills || []).map((s: any) => ({
      skillName: typeof s === "string" ? s : s.name,
      claimedLevel: (typeof s === "object" && s.level) ? s.level : "Intermediate"
    }));

    if (metricKey) {
      const proof = await getMetricProof(studentId, metricKey, evidencePool, studentClaims);
      if (!proof) {
        return NextResponse.json(
          { success: false, error: `Metric '${metricKey}' not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        studentId,
        metricKey,
        proof
      });
    }

    // If no specific metric requested, return all metric proofs
    const allMetrics = await calculateStudentDNAMetrics(studentId, evidencePool, studentClaims);
    return NextResponse.json({
      success: true,
      studentId,
      metrics: allMetrics
    });
  } catch (error: any) {
    console.error("GET /api/student-dna/metric-proof error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate metric proof" },
      { status: 500 }
    );
  }
}
