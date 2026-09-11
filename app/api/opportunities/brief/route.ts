import { NextResponse } from "next/server";
import { getAllOpportunities } from "@/lib/placement-store";
import { createNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const opportunityId = searchParams.get("opportunityId");
    const candidateId = searchParams.get("candidateId") || "student-demo";

    const opportunities = await getAllOpportunities();
    const opp = opportunities.find(o => o.id === opportunityId) || opportunities[0];

    if (!opp) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    // Determine if brief is stale / needs_refresh (e.g. older than 7 days or flagged)
    const lastUpdated = opp.extracted_context?.brief_updated_at || (opp as any).created_at || null;
    const isStale = lastUpdated ? (Date.now() - new Date(lastUpdated).getTime() > 7 * 86400000) : true;
    const needs_refresh = Boolean(opp.extracted_context?.needs_refresh || isStale);

    // Unified Notification Hook: when a viewed opportunity's brief flips to needs_refresh -> low priority
    if (needs_refresh) {
      await createNotification({
        studentId: candidateId,
        sourceFeature: "company_brief",
        notificationType: "needs_refresh",
        title: `🏢 Intelligence Stale: ${opp.organizer} Brief`,
        body: `Company brief for ${opp.title} (${opp.organizer}) needs refresh with latest campus recruitment updates.`,
        linkUrl: `/student/opportunities/${opp.id}`,
        priority: "low"
      });
    }

    return NextResponse.json({
      success: true,
      opportunity_id: opp.id,
      company: opp.organizer,
      role: opp.title,
      needs_refresh,
      brief_context: opp.extracted_context || {}
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const opportunityId = body.opportunityId;
    const candidateId = body.candidateId || "student-demo";
    const needs_refresh = body.needs_refresh ?? true;

    const opportunities = await getAllOpportunities();
    const opp = opportunities.find(o => o.id === opportunityId) || opportunities[0];

    if (opp && needs_refresh) {
      // Unified Notification Hook
      await createNotification({
        studentId: candidateId,
        sourceFeature: "company_brief",
        notificationType: "needs_refresh",
        title: `🏢 Intelligence Stale: ${opp.organizer} Brief`,
        body: `Company brief for ${opp.title} (${opp.organizer}) marked for refresh with latest placement intel.`,
        linkUrl: `/student/opportunities/${opp.id}`,
        priority: "low"
      });
    }

    return NextResponse.json({
      success: true,
      opportunity_id: opportunityId,
      needs_refresh
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
