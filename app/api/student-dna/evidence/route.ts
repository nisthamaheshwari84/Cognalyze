import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { getStudentEvidenceList, addStudentEvidenceRecord, retractEvidenceBySource } from "@/lib/dna/store";
import { DNASourceType } from "@/lib/dna/evidence-pipeline";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Valid student session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const skillId = searchParams.get("skillId") || undefined;
    const sourceType = (searchParams.get("sourceType") as DNASourceType) || undefined;
    const candidateId = auth.user.id;

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
    if (!auth?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Valid student session required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const candidateId = auth.user.id;

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
    if (!auth?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Valid student session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sourceType = searchParams.get("sourceType") as DNASourceType;

    if (!sourceType) {
      return NextResponse.json({ success: false, error: "Missing sourceType query parameter." }, { status: 400 });
    }

    const candidateId = auth.user.id;
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
