import { NextResponse } from "next/server";
import { getOrCreateLearningTwin, recordMentorEvidence } from "@/lib/mentor/store";
import { MentorEvidenceRecord } from "@/lib/mentor/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-demo";

    const twin = getOrCreateLearningTwin(candidateId);
    const sessionEvidence = twin.sessionEvidence || [];

    const demonstrated = sessionEvidence.filter((e) => e.demonstratedLevel === "Demonstrated");
    const developing = sessionEvidence.filter((e) => e.demonstratedLevel === "Developing");
    const weak = sessionEvidence.filter((e) => e.demonstratedLevel === "Weak");

    const independentCount = sessionEvidence.filter((e) => e.assistanceLevel === "Independent").length;
    const hintAssistedCount = sessionEvidence.filter((e) => e.assistanceLevel === "Hint-Assisted").length;

    return NextResponse.json({
      success: true,
      candidateId,
      totalEvidenceCount: sessionEvidence.length,
      demonstrated,
      developing,
      weak,
      metrics: {
        independentCount,
        hintAssistedCount,
        guidedCount: sessionEvidence.length - independentCount - hintAssistedCount
      },
      evidenceRecords: sessionEvidence
    });
  } catch (err: any) {
    console.error("[GET /api/mentor/evidence] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to load evidence summary" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { candidateId = "student-demo", evidenceRecord }: { candidateId?: string; evidenceRecord: MentorEvidenceRecord } = body;

    if (!evidenceRecord) {
      return NextResponse.json({ error: "Missing evidenceRecord" }, { status: 400 });
    }

    recordMentorEvidence(candidateId, evidenceRecord);

    return NextResponse.json({
      success: true,
      message: "Evidence recorded and committed to Student DNA",
      recordedEvidenceId: evidenceRecord.id
    });
  } catch (err: any) {
    console.error("[POST /api/mentor/evidence] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to record evidence" }, { status: 500 });
  }
}
