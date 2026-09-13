import { NextResponse } from "next/server";
import { getStudentDNA } from "@/lib/ai/student-dna";
import { getProblemStatementById } from "@/lib/ai/ps-engine";
import { analyzePSSkillGap } from "@/lib/ai/skill-gap-bridge";
import { findMatchingTeammates } from "@/lib/ai/team-match";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId = "student-demo", psId } = body;

    if (!psId) {
      return NextResponse.json({ error: "Missing required psId" }, { status: 400 });
    }

    const ps = getProblemStatementById(psId);
    if (!ps) {
      return NextResponse.json({ error: "Problem statement not found" }, { status: 404 });
    }

    const dna = await getStudentDNA(studentId);
    const gapAnalysis = analyzePSSkillGap(dna, ps);
    const candidateMatches = findMatchingTeammates(dna, ps, gapAnalysis);

    return NextResponse.json({
      success: true,
      ps_id: ps.id,
      ps_title: ps.title,
      initiator_id: studentId,
      missing_skills_sought: gapAnalysis.missing_skills.map(m => m.skill),
      candidates_count: candidateMatches.length,
      teammate_matches: candidateMatches
    });
  } catch (error: any) {
    console.error("POST /api/teams/match error:", error);
    return NextResponse.json({ error: error.message || "Failed to find matching teammates" }, { status: 500 });
  }
}
