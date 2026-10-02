import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { getWhyForSkill, getStudentEvidenceList } from "@/lib/dna/store";
import { calculateStudentSkillProfile } from "@/lib/dna/profile-engine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    const auth = await getAuthenticatedContext(req);
    const { skillId } = await params;

    const { searchParams } = new URL(req.url);
    const paramCandidateId = searchParams.get("candidateId");

    let candidateId = paramCandidateId;
    if (auth && auth.user && auth.user.accountType === "student") {
      candidateId = auth.user.id;
    } else if (!candidateId) {
      candidateId = auth?.user?.id || "student-demo";
    }

    const whyData = await getWhyForSkill(candidateId, skillId);
    const evidence = await getStudentEvidenceList(candidateId, { skillId });

    return NextResponse.json({
      success: true,
      candidateId,
      skillId,
      why: whyData,
      evidence
    });
  } catch (error: any) {
    console.error("GET /api/student-dna/skills/[skillId] error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch skill explanation" }, { status: 500 });
  }
}
