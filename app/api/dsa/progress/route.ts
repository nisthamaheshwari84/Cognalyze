import { NextResponse } from "next/server";
import {
  getAllTopics,
  getAllProblems,
  getStudentDsaProgress,
  updateDsaProblemProgress
} from "@/lib/dsa-store";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedContext(req as any);
    const { searchParams } = new URL(req.url);
    const studentId = auth?.user?.id || (searchParams.get("studentId") === "student-demo" ? "student-demo" : null);
    const topicId = searchParams.get("topicId") || undefined;

    const [topics, problems, progressMap] = await Promise.all([
      getAllTopics(),
      getAllProblems(topicId),
      studentId ? getStudentDsaProgress(studentId) : Promise.resolve<Record<string, any>>({})
    ]);

    const enrichedProblems = problems.map(prob => ({
      ...prob,
      progress: progressMap[prob.id] || {
        student_id: studentId || "",
        problem_id: prob.id,
        status: "unsolved",
        review_count: 0,
        time_spent_seconds: 0,
        notes: ""
      }
    }));

    return NextResponse.json({
      student_id: studentId || "",
      topics,
      problems: enrichedProblems
    });
  } catch (error: any) {
    console.error("GET /api/dsa/progress error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch progress" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedContext(req as any);
    const body = await req.json();
    const studentId = auth?.user?.id || (body.studentId === "student-demo" ? "student-demo" : null);

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to save problem progress." }, { status: 401 });
    }

    const {
      problemId,
      status,
      timeSpentSeconds,
      notes,
      nextReviewDate
    } = body;

    if (!problemId) {
      return NextResponse.json({ error: "Missing problemId" }, { status: 400 });
    }

    const updated = await updateDsaProblemProgress(studentId, problemId, {
      status,
      time_spent_seconds: timeSpentSeconds,
      notes,
      next_review_date: nextReviewDate
    });

    return NextResponse.json({ success: true, progress: updated });
  } catch (error: any) {
    console.error("POST /api/dsa/progress error:", error);
    return NextResponse.json({ error: error.message || "Failed to update progress" }, { status: 500 });
  }
}
