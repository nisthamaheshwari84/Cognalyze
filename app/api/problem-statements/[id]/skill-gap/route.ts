import { NextResponse } from "next/server";
import { getStudentDNA } from "@/lib/ai/student-dna";
import { getProblemStatementById } from "@/lib/ai/ps-engine";
import { analyzePSSkillGap } from "@/lib/ai/skill-gap-bridge";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const psId = params.id;
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-demo";

    const ps = getProblemStatementById(psId);
    if (!ps) {
      return NextResponse.json({ error: "Problem statement not found" }, { status: 404 });
    }

    const dna = await getStudentDNA(candidateId);
    const analysis = analyzePSSkillGap(dna, ps);

    return NextResponse.json({
      success: true,
      analysis
    });
  } catch (error: any) {
    console.error("GET /api/problem-statements/[id]/skill-gap error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze PS skill gap" }, { status: 500 });
  }
}
