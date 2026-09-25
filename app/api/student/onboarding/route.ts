import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { createStudentProfile, getStudentProfileByUserId, getUserById } from "@/lib/auth/store";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const body = await req.json();
    const { username, fullName, college, degree, graduationYear, primaryInterests, explicitUserId } = body;

    const targetUserId = auth?.user?.id || explicitUserId;
    if (!targetUserId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const user = getUserById(targetUserId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Check if already has a profile
    const existing = getStudentProfileByUserId(targetUserId);
    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Profile already exists.",
        profile: existing,
        nextUrl: "/student/dashboard"
      });
    }

    if (!username || !fullName) {
      return NextResponse.json({ error: "Username and Full Name are required." }, { status: 400 });
    }

    const profile = createStudentProfile({
      userId: targetUserId,
      username,
      fullName,
      college: college || "Not Specified",
      degree: degree || "Computer Science",
      graduationYear: graduationYear || "2026",
      primaryInterests: Array.isArray(primaryInterests) ? primaryInterests : ["Software Engineering"]
    });

    return NextResponse.json({
      success: true,
      profile,
      publicUrl: `cognalyze.com/@${profile.username}`,
      nextUrl: "/student/dashboard"
    });
  } catch (err: any) {
    console.error("Student onboarding error:", err);
    return NextResponse.json({ error: err.message || "Failed to complete onboarding." }, { status: 500 });
  }
}
