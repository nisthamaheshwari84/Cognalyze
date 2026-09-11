import { NextResponse } from "next/server";
import { getDifficultyAdaptiveSuggestions } from "@/lib/dsa-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || "student-demo";

    const suggestions = await getDifficultyAdaptiveSuggestions(studentId);
    return NextResponse.json({
      student_id: studentId,
      suggestions_count: suggestions.length,
      suggestions
    });
  } catch (error: any) {
    console.error("GET /api/dsa/suggestions error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch suggestions" }, { status: 500 });
  }
}
