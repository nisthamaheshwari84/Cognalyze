import { NextResponse } from "next/server";
import { getAllRoles, getHireOutcomeRecords, recordHireOutcome } from "@/lib/recruiter-store";
import { computeQualityOfHireAnalytics, HireOutcomeRecord, generateSampleHireRecords } from "@/lib/ai/quality-of-hire";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode"); // "live", "insufficient_test", or default

    const roles = await getAllRoles();
    let records = await getHireOutcomeRecords();

    if (mode === "insufficient_test") {
      // Simulate raw initial state with only 1 hire to test the insufficient data state
      records = [records[0]];
    }

    const analytics = computeQualityOfHireAnalytics(records, roles);

    return NextResponse.json({
      success: true,
      recordsCount: records.length,
      analytics,
      records
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.candidateId || !body.roleId) {
      return NextResponse.json({ success: false, error: "candidateId and roleId are required" }, { status: 400 });
    }

    const outcomeRecord: HireOutcomeRecord = {
      hireId: body.hireId || `hire-${Date.now().toString().slice(-4)}`,
      candidateId: body.candidateId,
      candidateName: body.candidateName || "Hired Engineer",
      roleId: body.roleId,
      roleTitle: body.roleTitle || "Software Engineer",
      hiredAt: body.hiredAt || new Date().toISOString(),
      preHireSignals: body.preHireSignals || {
        overallFitScore: 85,
        hadVerifiedWorkSample: true,
        interviewScore: 88,
        criticalGapsIdentified: [],
        evidenceTypeForCritical: "work_sample"
      },
      day30Milestone: body.day30Milestone,
      day60Milestone: body.day60Milestone,
      day90Milestone: body.day90Milestone
    };

    const saved = await recordHireOutcome(outcomeRecord);
    return NextResponse.json({ success: true, record: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
