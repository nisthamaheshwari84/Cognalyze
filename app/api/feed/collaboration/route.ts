// app/api/feed/collaboration/route.ts
//
// Only logged-in Cognalyze students can view this feed. Only open collaboration roles show up —
// once a recruiter closes a role, it disappears from here automatically (status filter),
// so students never apply to something already filled.

import { NextRequest, NextResponse } from "next/server";
import { getCollabUser } from "@/lib/collab/auth";
import { getCollaborationFeed } from "@/lib/collab/store";

export async function GET(req: NextRequest) {
  const user = await getCollabUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Confirm caller is a logged-in Cognalyze student
  if (user.role !== "student" && user.role !== "admin") {
    return NextResponse.json(
      { error: "Only students can view the collaboration feed" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "0", 10);
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") ?? "20", 10), 50);

    const { feed, page: curPage } = await getCollaborationFeed(user.id, page, pageSize);

    return NextResponse.json({ feed, page: curPage });
  } catch (err: any) {
    console.error("[feed/collaboration GET] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load collaboration feed" },
      { status: 500 }
    );
  }
}
