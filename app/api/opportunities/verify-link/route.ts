import { NextRequest, NextResponse } from "next/server";
import { LinkVerificationEngine } from "@/lib/opportunities/verification/link-verifier";
import { opportunityService } from "@/lib/opportunities/opportunity-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, opportunityId, title, organizer, forceFresh, recordAttempt } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing required 'url' parameter" },
        { status: 400 }
      );
    }

    const verifier = LinkVerificationEngine.getInstance();
    const result = await verifier.verifyUrl(url, {
      title,
      organizer,
      opportunityId,
      forceFresh: Boolean(forceFresh)
    });

    // Record application attempt if opportunityId provided and requested
    if (opportunityId && recordAttempt) {
      try {
        const candidateId = "student-me";
        await opportunityService.recordApplicationAttempt({
          candidateId,
          opportunityId,
          applicationUrl: result.finalUrl || url,
          status: result.status,
          attemptedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn("[verify-link] Could not record application attempt:", err);
      }
    }

    return NextResponse.json({
      success: true,
      result
    });
  } catch (err: any) {
    console.error("[verify-link] Verification error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to verify link"
      },
      { status: 500 }
    );
  }
}
