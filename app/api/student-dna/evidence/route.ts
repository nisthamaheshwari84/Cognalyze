import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { getStudentEvidenceList, addStudentEvidenceRecord, retractEvidenceBySource } from "@/lib/dna/store";
import { DNASourceType } from "@/lib/dna/evidence-pipeline";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const { searchParams } = new URL(req.url);
    const paramCandidateId = searchParams.get("candidateId");
    const skillId = searchParams.get("skillId") || undefined;
    const sourceType = (searchParams.get("sourceType") as DNASourceType) || undefined;

    let candidateId = paramCandidateId;
    if (auth && auth.user && auth.user.accountType === "student") {
      candidateId = auth.user.id;
    } else if (!candidateId) {
      candidateId = auth?.user?.id || "student-demo";
    }

    const evidence = await getStudentEvidenceList(candidateId, { skillId, sourceType });

    return NextResponse.json({
      success: true,
      candidateId,
      totalCount: evidence.length,
      evidence
    });
  } catch (error: any) {
    console.error("GET /api/student-dna/evidence error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch evidence" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const body = await req.json();

    let candidateId = body.userId || body.candidateId;
    if (auth && auth.user && auth.user.accountType === "student") {
      candidateId = auth.user.id;
    } else if (!candidateId) {
      candidateId = auth?.user?.id || "student-demo";
    }

    const result = await addStudentEvidenceRecord(candidateId, {
      ...body,
      userId: candidateId
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      evidence: result.evidence,
      auditLog: result.auditLog
    });
  } catch (error: any) {
    console.error("POST /api/student-dna/evidence error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to add evidence" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const { searchParams } = new URL(req.url);
    const sourceType = searchParams.get("sourceType") as DNASourceType;

    if (!sourceType) {
      return NextResponse.json({ success: false, error: "Missing sourceType query parameter." }, { status: 400 });
    }

    let candidateId = searchParams.get("candidateId");
    if (auth && auth.user && auth.user.accountType === "student") {
      candidateId = auth.user.id;
    } else if (!candidateId) {
      candidateId = auth?.user?.id || "student-demo";
    }

    const result = await retractEvidenceBySource(candidateId, sourceType);

    return NextResponse.json({
      success: true,
      candidateId,
      sourceType,
      removedCount: result.removedCount
    });
  } catch (error: any) {
    console.error("DELETE /api/student-dna/evidence error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to retract evidence" }, { status: 500 });
  }
}
