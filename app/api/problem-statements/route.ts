import { NextResponse } from "next/server";
import { getStudentDNA } from "@/lib/ai/student-dna";
import { recommendProblemStatements, getAllProblemStatements } from "@/lib/ai/ps-engine";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-demo";
    const topK = parseInt(searchParams.get("topK") || "5", 10);
    const all = searchParams.get("all") === "true";

    if (all) {
      return NextResponse.json({
        success: true,
        count: getAllProblemStatements().length,
        problem_statements: getAllProblemStatements()
      });
    }

    const dna = await getStudentDNA(candidateId);
    const result = recommendProblemStatements(dna, { topK });

    return NextResponse.json({
      success: true,
      candidate_id: candidateId,
      candidate_pool_size: result.candidatePoolSize,
      shortlisted_count: result.shortlistedCount,
      recommendations: result.recommendations
    });
  } catch (error: any) {
    console.error("GET /api/problem-statements error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch problem statements" }, { status: 500 });
  }
}
