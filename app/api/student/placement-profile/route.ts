import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import {
  getPlacementProfile,
  upsertPlacementProfile,
  generateAdaptiveRoadmap,
} from "@/lib/skills/placement-profile-engine";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth || !auth.user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const profile = getPlacementProfile(auth.user.id);
    if (!profile) {
      return NextResponse.json({
        success: true,
        hasProfile: false,
        profileState: "NO_PROFILE",
        profile: null,
        roadmap: generateAdaptiveRoadmap(null),
      });
    }

    const roadmap = generateAdaptiveRoadmap(profile);

    return NextResponse.json({
      success: true,
      hasProfile: true,
      profileState: profile.profileCompleted ? "COMPLETE" : "PARTIAL",
      profile,
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

    const body = await req.json();

    const updated = upsertPlacementProfile(auth.user.id, {
      ...body,
      fullName: body.fullName || auth.user.fullName || "",
      email: body.email || auth.user.email || "",
    });

    const roadmap = generateAdaptiveRoadmap(updated);

    return NextResponse.json({
      success: true,
      profile: updated,
      roadmap,
    });
  } catch (err: any) {
    console.error("POST /api/student/placement-profile error:", err);
    return NextResponse.json({ error: err.message || "Failed to update placement profile." }, { status: 500 });
  }
}
