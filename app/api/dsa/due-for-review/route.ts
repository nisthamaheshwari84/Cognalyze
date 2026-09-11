import { NextResponse } from "next/server";
import { getDueForReviewProblems } from "@/lib/dsa-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || "student-demo";

    const dueProblems = await getDueForReviewProblems(studentId);
    return NextResponse.json({
      student_id: studentId,
      due_count: dueProblems.length,
      problems: dueProblems
    });
  } catch (error: any) {
    console.error("GET /api/dsa/due-for-review error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch review problems" }, { status: 500 });
  }
}
