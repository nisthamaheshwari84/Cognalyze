import { NextResponse } from "next/server";
import { compareCandidates, parseJDIntelligence, CandidateEvaluationSnapshot } from "@/lib/recruiter/decision-room-engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roleId, roleTitle = "Software Engineer", trackId = "general_swe", jdText = "", candidates = [] } = body;

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json(
        { success: false, error: "An array of candidates is required for comparison.", code: "INVALID_CANDIDATES" },
        { status: 400 }
      );
    }

    const roleProfile = parseJDIntelligence(roleTitle, jdText, { trackId: trackId as any });
    if (roleId) roleProfile.roleId = roleId;

    const matrix = compareCandidates(candidates as CandidateEvaluationSnapshot[], roleProfile);

    return NextResponse.json({
      success: true,
      comparisonMatrix: matrix,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

