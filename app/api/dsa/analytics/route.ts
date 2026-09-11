import { NextResponse } from "next/server";
import { getDsaLearningAnalytics } from "@/lib/dsa-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || "student-demo";

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
