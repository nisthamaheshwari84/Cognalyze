import { NextRequest, NextResponse } from "next/server";
import { recordCandidateAttempt, getCandidateAttempts, getCandidateDomainSummary } from "@/lib/skills/candidate-history";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const { searchParams } = new URL(req.url);
    const candidateId = auth?.user?.id || searchParams.get("candidateId") || "student-demo";
    const domain = searchParams.get("domain") || undefined;

    const attempts = getCandidateAttempts(candidateId, domain);
    const summary = getCandidateDomainSummary(candidateId);

    return NextResponse.json({
      success: true,
      candidateId,
      attempts,
      summary
    });
  } catch (err: any) {
    console.error("Error fetching candidate history:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const body = await req.json();
    const candidateId = auth?.user?.id || body.candidateId || "student-demo";
    const {
      domain,
      topic = "General Practice",
      mode = "practice",
      score = 0,
      accuracy = 0,
      timeSpentSeconds = 0,
      questionsAttempted = 0,
      questionsCorrect = 0,
      questionIds = [],
      weaknesses = [],
      strengths = [],
      feedback = ""
    } = body;

    if (!domain) {
      return NextResponse.json({ success: false, error: "Domain is required" }, { status: 400 });
    }

    const attempt = recordCandidateAttempt({
      candidateId,
      domain,
      topic,
      mode,
      score,
      accuracy,
      timeSpentSeconds,
      questionsAttempted,
      questionsCorrect,
      questionIds,
      weaknesses,
      strengths,
      feedback
    });

    return NextResponse.json({
      success: true,
      attempt
    });
  } catch (err: any) {
    console.error("Error recording candidate attempt:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
