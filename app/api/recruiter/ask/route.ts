import { NextResponse } from "next/server";
import { getAllRoles, getAllCandidates } from "@/lib/recruiter-store";
import { askRecruiterIntelligence } from "@/lib/recruiter/recruiter-intelligence";

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const [roles, candidates] = await Promise.all([
      getAllRoles(),
      getAllCandidates()
    ]);

    const answer = askRecruiterIntelligence(question.trim(), candidates, roles);

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (err: any) {
    console.error("POST /api/recruiter/ask error:", err);
    return NextResponse.json({ error: err.message || "Failed to query recruiter intelligence" }, { status: 500 });
  }
}
