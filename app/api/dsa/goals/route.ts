import { NextResponse } from "next/server";
import { getStudentDsaGoal, setStudentDsaGoal } from "@/lib/dsa-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || "student-demo";

    const goalData = await getStudentDsaGoal(studentId);
    return NextResponse.json({
      student_id: studentId,
      ...goalData
    });
  } catch (error: any) {
    console.error("GET /api/dsa/goals error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch goal" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId = "student-demo", dailyTarget } = body;

    if (!dailyTarget || isNaN(Number(dailyTarget)) || Number(dailyTarget) <= 0) {
      return NextResponse.json({ error: "Daily target must be a positive number" }, { status: 400 });
    }

    const updated = await setStudentDsaGoal(studentId, Number(dailyTarget));
    const goalMetrics = await getStudentDsaGoal(studentId);

    return NextResponse.json({
      success: true,
      ...goalMetrics
    });
  } catch (error: any) {
    console.error("POST /api/dsa/goals error:", error);
    return NextResponse.json({ error: error.message || "Failed to update daily goal" }, { status: 500 });
  }
}
