import { NextResponse } from "next/server";
import { markAllNotificationsRead } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body optional if query param provided
    }

    const { searchParams } = new URL(req.url);
    const studentId = body.studentId || body.candidateId || searchParams.get("candidateId") || "student-demo";

    const count = await markAllNotificationsRead(studentId);

    return NextResponse.json({
      success: true,
      marked_count: count
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
