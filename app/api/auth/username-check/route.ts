import { NextRequest, NextResponse } from "next/server";
import { checkUsernameAvailability } from "@/lib/auth/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username") || "";

    if (!username.trim()) {
      return NextResponse.json(
        { available: false, error: "Username query parameter is required." },
        { status: 400 }
      );
    }

    const result = checkUsernameAvailability(username);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Username check error:", err);
    return NextResponse.json({ error: err.message || "Failed to check username." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = body.username || "";

    if (!username.trim()) {
      return NextResponse.json(
        { available: false, error: "Username is required." },
        { status: 400 }
      );
    }

    const result = checkUsernameAvailability(username);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Username check error:", err);
    return NextResponse.json({ error: err.message || "Failed to check username." }, { status: 500 });
  }
}
