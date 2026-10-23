import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { OpportunityService } from "@/lib/opportunities/opportunity-service";
import { ApplicationStage } from "@/lib/opportunities/types";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth || !auth.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const apps = OpportunityService.getInstance().getStudentApplications(auth.user.id);
    return NextResponse.json({ success: true, applications: apps });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load applications." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth || !auth.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const opportunityId = body.opportunityId || body.opportunity_id;
    const stage = (body.stage || "Applied") as ApplicationStage;

    if (!opportunityId) {
      return NextResponse.json({ error: "Missing opportunityId" }, { status: 400 });
    }

    const record = OpportunityService.getInstance().trackApplicationStage({
      studentId: auth.user.id,
      opportunityId,
      stage,
      notes: body.notes,
      outcomeReason: body.outcomeReason,
      feedbackNotes: body.feedbackNotes,
    });

    return NextResponse.json({ success: true, record });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to track application." }, { status: 500 });
  }
}
