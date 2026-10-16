import { NextResponse } from "next/server";
import { markAllNotificationsRead } from "@/lib/notifications";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedContext(req as any);
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body optional if query param provided
    }

    const { searchParams } = new URL(req.url);
    const studentId = auth?.user?.id || (searchParams.get("candidateId") === "student-demo" ? "student-demo" : null);

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const count = await markAllNotificationsRead(studentId);

    return NextResponse.json({
      success: true,
      marked_count: count
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
