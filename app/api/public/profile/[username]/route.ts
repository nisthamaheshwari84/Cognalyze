import { NextRequest, NextResponse } from "next/server";
import { getPublicProfileByUsername } from "@/lib/auth/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username: rawUsername } = await params;
    if (!rawUsername) {
      return NextResponse.json({ error: "Username parameter is required." }, { status: 400 });
    }

    const publicProfile = getPublicProfileByUsername(rawUsername);
    if (!publicProfile) {
      return NextResponse.json(
        { error: "Public profile not found or set to private." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: publicProfile
    });
  } catch (err: any) {
    console.error("Public profile fetch error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch profile." }, { status: 500 });
  }
}
