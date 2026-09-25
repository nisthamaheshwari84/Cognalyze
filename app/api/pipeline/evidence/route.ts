import { NextResponse } from "next/server";
import { getEvidenceForCandidate, getCandidateDecisions } from "@/lib/evidence/storage";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId");

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: "candidateId is required" },
        { status: 400 }
      );
    }

    const [evidence, decisions] = await Promise.all([
      getEvidenceForCandidate(candidateId),
      getCandidateDecisions(candidateId),
    ]);

    return NextResponse.json({
      success: true,
      candidateId,
      evidence,
      decisions,
    });
  } catch (err: any) {
    console.error("[pipeline/evidence] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
