import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import {
  getPlacementProfile,
  upsertPlacementProfile,
  generateAdaptiveRoadmap,
} from "@/lib/skills/placement-profile-engine";
import { PlacementIntelligenceService } from "@/lib/skills/placement-intelligence-engine";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth || !auth.user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const userId = auth.user.id;
    const dashboard = await PlacementIntelligenceService.getInstance().getCompletePlacementDashboard(userId);

    const hasProfile = !!dashboard.profile;
    const roadmap = generateAdaptiveRoadmap(dashboard.profile);

    return NextResponse.json({
      success: true,
      hasProfile,
      profileState: dashboard.profile?.profileCompleted ? "COMPLETE" : hasProfile ? "PARTIAL" : "NO_PROFILE",
      profile: dashboard.profile,
      overview: dashboard.overview,
      gapAnalysis: dashboard.gapAnalysis,
      proofPortfolio: dashboard.proofPortfolio,
      opportunities: dashboard.opportunities,
      offers: dashboard.offers,
      applications: dashboard.applications,
      roadmap,
    });
  } catch (err: any) {
    console.error("GET /api/student/placement-profile error:", err);
    return NextResponse.json({ error: err.message || "Failed to load placement profile." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth || !auth.user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const userId = auth.user.id;
    const body = await req.json();

    const updated = upsertPlacementProfile(userId, {
      ...body,
      fullName: body.fullName || auth.user.fullName || "",
      email: body.email || auth.user.email || "",
    });

    const dashboard = await PlacementIntelligenceService.getInstance().getCompletePlacementDashboard(userId);
    const roadmap = generateAdaptiveRoadmap(updated);

    return NextResponse.json({
      success: true,
      profile: updated,
      overview: dashboard.overview,
      gapAnalysis: dashboard.gapAnalysis,
      proofPortfolio: dashboard.proofPortfolio,
      opportunities: dashboard.opportunities,
      offers: dashboard.offers,
      applications: dashboard.applications,
      roadmap,
    });
  } catch (err: any) {
    console.error("POST /api/student/placement-profile error:", err);
    return NextResponse.json({ error: err.message || "Failed to update placement profile." }, { status: 500 });
  }
}
