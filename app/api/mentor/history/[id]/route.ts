import { NextResponse } from "next/server";
import { getMentorSessionById } from "@/lib/mentor/store";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-demo";

    const session = getMentorSessionById(candidateId, id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      session
    });
  } catch (err: any) {
    console.error("[GET /api/mentor/history/[id]] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to load session details" }, { status: 500 });
  }
}
