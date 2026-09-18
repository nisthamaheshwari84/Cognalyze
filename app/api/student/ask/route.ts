import { NextResponse } from "next/server";
import { answerStudentQuestion } from "@/lib/intelligence/student-intelligence";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId = "student-demo", question } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    const response = answerStudentQuestion(studentId, question);

    return NextResponse.json({
      success: true,
      question,
      answer: response.answer,
      supportingEvidence: response.supportingEvidence,
      citations: response.citations,
      hasSufficientData: response.hasSufficientData
    });
  } catch (error: any) {
    console.error("POST /api/student/ask error:", error);
    return NextResponse.json({ error: error.message || "Failed to answer question" }, { status: 500 });
  }
}
