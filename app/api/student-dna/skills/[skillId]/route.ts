import { NextRequest, NextResponse } from "next/server";
import { authorizeStudentDnaAccess, DNA_NO_STORE_HEADERS } from "@/lib/dna/security-audit";
import { getWhyForSkill, getStudentEvidenceList } from "@/lib/dna/store";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    const { skillId } = await params;
    const { searchParams } = new URL(req.url);
    const paramCandidateId = searchParams.get("candidateId");

    const authCheck = await authorizeStudentDnaAccess(req, {
      requestedCandidateId: paramCandidateId,
      resourceName: `/api/student-dna/skills/${skillId}`,
    });
    if (!authCheck.ok) return authCheck.response;

    const candidateId = authCheck.studentId;
    const whyData = await getWhyForSkill(candidateId, skillId);
    const evidence = await getStudentEvidenceList(candidateId, { skillId });

    return NextResponse.json(
      {
        success: true,
        candidateId,
        skillId,
        why: whyData,
        evidence,
      },
      { headers: DNA_NO_STORE_HEADERS }
    );
  } catch (error: any) {
    console.error("GET /api/student-dna/skills/[skillId] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch skill explanation" },
      { status: 500, headers: DNA_NO_STORE_HEADERS }
    );
  }
}
