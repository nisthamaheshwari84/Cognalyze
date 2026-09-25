import { NextResponse } from "next/server";
import { getAllRoles, getHireOutcomeRecords, recordHireOutcome, getAllCandidates } from "@/lib/recruiter-store";
import { computeQualityOfHireAnalytics, HireOutcomeRecord } from "@/lib/ai/quality-of-hire";
import { computeProcessIntelligence } from "@/lib/decisions/engine";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");

    const [roles, allCandidates] = await Promise.all([
      getAllRoles(),
      getAllCandidates()
    ]);
    let records = await getHireOutcomeRecords();

    if (mode === "insufficient_test" && records.length > 0) {
      records = [records[0]];
    }

    const analytics = computeQualityOfHireAnalytics(records, roles);

    // Build process intelligence from real candidate stage data
    const stageEvents = allCandidates.map(c => ({
      applicationId: c.id,
      fromStage: "Applied",
      toStage: c.currentStage || "Applied",
      occurredAt: c.decisionJournal?.decidedAt || new Date().toISOString()
    }));

    const processIntelligence = computeProcessIntelligence(stageEvents, allCandidates.length);

    return NextResponse.json({
      success: true,
      recordsCount: records.length,
      analytics,
      processIntelligence,
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
