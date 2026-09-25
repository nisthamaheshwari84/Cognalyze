import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { changeUsername, getStudentProfileByUserId } from "@/lib/auth/store";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth || !auth.studentProfile) {
      return NextResponse.json({ error: "Unauthorized. Student profile required." }, { status: 401 });
    }

    const body = await req.json();
    const { newUsername } = body;

    if (!newUsername || typeof newUsername !== "string") {
      return NextResponse.json({ error: "New username is required." }, { status: 400 });
    }

    const result = changeUsername(auth.studentProfile.id, newUsername);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Username updated successfully.",
      newUsername: result.newUsername,
      publicUrl: `cognalyze.com/@${result.newUsername}`
    });
  } catch (err: any) {
    console.error("Username change error:", err);
    return NextResponse.json({ error: err.message || "Failed to change username." }, { status: 500 });
  }
}
