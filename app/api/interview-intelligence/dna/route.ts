import { NextRequest, NextResponse } from "next/server";
import { syncStoreWithCloud } from "@/lib/auth/store";
import {
  buildSharedStudentDnaForInterview,
  verifyServiceHeaders,
} from "@/lib/interview-intelligence/handoff";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  Vary: "Authorization, Cookie, X-Cognalyze-Service-Sig, X-Cognalyze-Verified-User-Id",
};

export async function GET(req: NextRequest) {
  try {
    const serviceCheck = verifyServiceHeaders(req, "");
    if (!serviceCheck.ok) {
      return NextResponse.json(
        { success: false, error: serviceCheck.code, message: serviceCheck.message },
        { status: serviceCheck.status, headers: NO_STORE_HEADERS }
      );
    }

    const verifiedUserId = (req.headers.get("x-cognalyze-verified-user-id") || "").trim();
    if (!verifiedUserId) {
      return NextResponse.json(
        { success: false, error: "MISSING_USER_ID", message: "Verified userId header is required." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    await syncStoreWithCloud().catch(() => {});
    const studentDna = await buildSharedStudentDnaForInterview(verifiedUserId);

    return NextResponse.json(
      {
        success: true,
        userId: verifiedUserId,
        studentDna,
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error("[GET /api/interview-intelligence/dna] Error:", err);
    return NextResponse.json(
      { success: false, error: "DNA_FETCH_FAILED", message: err?.message || "Failed to fetch Student DNA." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
