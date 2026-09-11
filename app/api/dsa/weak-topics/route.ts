import { NextResponse } from "next/server";
import { getWeakTopics } from "@/lib/dsa-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || "student-demo";

    const weakTopics = await getWeakTopics(studentId);
    return NextResponse.json({
      student_id: studentId,
      weak_topics_count: weakTopics.length,
      weak_topics: weakTopics.map(w => ({
        id: w.topic.id,
        name: w.topic.name,
        slug: w.topic.slug,
        solved_ratio_pct: w.solved_ratio,
        attempted_count: w.attempted_count
      }))
    });
  } catch (error: any) {
    console.error("GET /api/dsa/weak-topics error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch weak topics" }, { status: 500 });
  }
}
