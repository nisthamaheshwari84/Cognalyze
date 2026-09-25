import { NextRequest, NextResponse } from "next/server";
import {
  attachPostAsEvidenceSource,
  inspectAndVerifyNetworkSource,
  listNetworkSourcesForPerson,
  verifyEngagementIndependence,
} from "@/lib/network/network-source";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const personId = searchParams.get("personId") || "cand-test-1";

    const sources = listNetworkSourcesForPerson(personId);
    return NextResponse.json({ success: true, sources });
  } catch (error: any) {
    console.error("GET /api/network/source error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list network sources" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "inspect") {
      const { sourceId, inspectorId, verifiedRepository, hasCommitsVerified, verificationNotes } = body;
      const updated = await inspectAndVerifyNetworkSource({
        sourceId,
        inspectorId: inspectorId || "recruiter_evaluator",
        verifiedRepository,
        hasCommitsVerified: Boolean(hasCommitsVerified),
        verificationNotes: verificationNotes || "Code repository verified with clean commit history",
      });
      return NextResponse.json({ success: true, source: updated });
    }

    // Default action: attach post as evidence source (starts at T1)
    const { personId, postId, postTitle, postContent, projectUrl, tags, upvotes, views } = body;

    if (!personId || !postId || !postTitle) {
      return NextResponse.json(
        { success: false, error: "personId, postId, and postTitle are required" },
        { status: 400 }
      );
    }

    const source = await attachPostAsEvidenceSource({
      personId,
      postId,
      postTitle,
      postContent: postContent || "",
      projectUrl,
      tags: tags || [],
      upvotes: Number(upvotes) || 0,
      views: Number(views) || 0,
    });

    const independenceCheck = verifyEngagementIndependence(source);

    return NextResponse.json({
      success: true,
      source,
      engagementIndependence: independenceCheck,
    });
  } catch (error: any) {
    console.error("POST /api/network/source error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process network source" },
      { status: 500 }
    );
  }
}
