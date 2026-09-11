import { NextResponse } from "next/server";
import { recordSpacedReview } from "@/lib/dsa-store";

export async function POST(
  req: Request,
  context: { params: Promise<{ problemId: string }> }
) {
  try {
    const { problemId } = await context.params;
    const body = await req.json();
    const { result, studentId = "student-demo" } = body;

    if (result !== "retained" && result !== "forgot") {
      return NextResponse.json(
        { error: "Invalid result. Must be 'retained' or 'forgot'." },
        { status: 400 }
      );
    }

    const reviewResult = await recordSpacedReview(studentId, problemId, result);
    return NextResponse.json({
      success: true,
      problem_id: problemId,
      result,
      ...reviewResult
    });
  } catch (error: any) {
    console.error("POST /api/dsa/progress/[problemId]/review error:", error);
    return NextResponse.json({ error: error.message || "Failed to record review" }, { status: 500 });
  }
}
