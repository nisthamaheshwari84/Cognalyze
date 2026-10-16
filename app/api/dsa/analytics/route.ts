import { NextResponse } from "next/server";
import { getDsaLearningAnalytics } from "@/lib/dsa-store";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedContext(req as any);
    const { searchParams } = new URL(req.url);
    const studentId = auth?.user?.id || (searchParams.get("studentId") === "student-demo" ? "student-demo" : null);

    if (!studentId) {
      return NextResponse.json({
        student_id: "",
        total_problems_solved: 0,
        total_time_spent_minutes: 0,
        current_streak_days: 0,
        retention_health_score: 0,
        problems_due_for_review: 0,
        topic_mastery: []
      });
    }

    const analytics = await getDsaLearningAnalytics(studentId);
    return NextResponse.json({
      student_id: studentId,
      ...analytics
    });
  } catch (error: any) {
    console.error("GET /api/dsa/analytics error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch analytics" }, { status: 500 });
  }
}
