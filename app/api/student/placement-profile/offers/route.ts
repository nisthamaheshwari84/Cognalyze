import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { PlacementIntelligenceService } from "@/lib/skills/placement-intelligence-engine";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth || !auth.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const offers = await PlacementIntelligenceService.getInstance().getOffers(auth.user.id);
    return NextResponse.json({ success: true, offers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load offers." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth || !auth.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    if (!body.employer || !body.roleTitle) {
      return NextResponse.json({ error: "employer and roleTitle are required." }, { status: 400 });
    }

    const offer = await PlacementIntelligenceService.getInstance().recordOffer(auth.user.id, {
      employer: body.employer,
      roleTitle: body.roleTitle,
      offerDate: body.offerDate || new Date().toISOString().split("T")[0],
      compensationCtc: body.compensationCtc ? Number(body.compensationCtc) : undefined,
      compensationStipend: body.compensationStipend ? Number(body.compensationStipend) : undefined,
      currency: body.currency || "INR",
      status: body.status || "OFFER_RECEIVED",
      expectedJoiningDate: body.expectedJoiningDate,
      actualJoiningDate: body.actualJoiningDate,
      verificationLevel: body.verificationLevel || "self_reported",
      documentUrl: body.documentUrl,
      verifiedBy: body.verifiedBy,
      notes: body.notes,
    });

    return NextResponse.json({ success: true, offer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to record offer." }, { status: 500 });
  }
}
