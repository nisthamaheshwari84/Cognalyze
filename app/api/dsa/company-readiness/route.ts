import { NextResponse } from "next/server";
import { computeCompanyReadinessScore } from "@/lib/dsa-store";
import { getAllOpportunities } from "@/lib/placement-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || "student-demo";
    const opportunityId = searchParams.get("opportunityId");

    if (!opportunityId) {
      return NextResponse.json({ error: "Missing opportunityId parameter" }, { status: 400 });
    }

    const allOpps = await getAllOpportunities();
    const opp: any = allOpps.find(o => o.id === opportunityId) || {
      id: opportunityId,
      title: "Target Company Engineering Assessment",
      organizer: "Target Company",
      tags: ["Algorithms", "Data Structures", "System Design"],
      domain_tags: ["Core Engineering"],
      extracted_context: {}
    };

    const targetOpp = {
      id: opp.id || opportunityId,
      title: opp.title,
      organizer: opp.organizer,
      tags: opp.tags,
      domain_tags: opp.domain_tags,
      extracted_context: opp.extracted_context
    };

    const readiness = await computeCompanyReadinessScore(studentId, targetOpp);
    return NextResponse.json({
      student_id: studentId,
      opportunity_id: opportunityId,
      opportunity_title: opp.title,
      company: opp.organizer,
      ...readiness
    });
  } catch (error: any) {
    console.error("GET /api/dsa/company-readiness error:", error);
    return NextResponse.json({ error: error.message || "Failed to compute company readiness" }, { status: 500 });
  }
}
