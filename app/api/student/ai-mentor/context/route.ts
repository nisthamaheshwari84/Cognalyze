import { NextResponse } from "next/server";
import { getStudentMentorContext } from "@/lib/mentor/ai-mentor-service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || "student-demo";

    const context = getStudentMentorContext(studentId);

    return NextResponse.json({
      success: true,
      context
    });
  } catch (error: any) {
    console.error("[GET /api/student/ai-mentor/context] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve student mentor context.", details: error?.message },
      { status: 500 }
    );
  }
}
