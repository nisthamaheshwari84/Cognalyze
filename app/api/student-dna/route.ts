import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { getStudentDNAFull, setUserTargetRole, invalidateUserDNAScope } from "@/lib/dna/store";
import { getStudentProfileCompletionState } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  Vary: "Cookie, Authorization",
};

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth || !auth.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to access Student DNA." },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    if (auth.user.accountType === "recruiter") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Recruiter accounts are restricted from accessing Student DNA." },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const queryCandidateId = req.nextUrl.searchParams.get("candidateId");
    if (queryCandidateId && queryCandidateId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Cannot access another student's DNA." },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    // Strictly bind candidate ID to authenticated Cognalyze Auth UUID
    const candidateId = auth.user.id;
    const isRefresh = req.nextUrl.searchParams.get("refresh") === "true";
    if (isRefresh) {
      invalidateUserDNAScope(candidateId);
    }

    const completion = getStudentProfileCompletionState(candidateId);

    // Profile Completion Gate: If student has not filled or completed the profile,
    // do not fabricate fake skills or readiness data.
    if (completion.state === "NO_PROFILE" || completion.state === "PARTIAL_PROFILE") {
      return NextResponse.json(
        {
          success: true,
          candidateId,
          profileState: completion.state,
          completion,
          data: null
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    const dna = await getStudentDNAFull(candidateId);

    return NextResponse.json(
      {
        success: true,
        candidateId,
        profileState: "COMPLETED_PROFILE",
        completion,
        data: dna
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error: any) {
    console.error("GET /api/student-dna error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch student DNA" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to update Student DNA." },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    if (auth.user.accountType === "recruiter") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Recruiter accounts cannot modify Student DNA." },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const candidateId = auth.user.id;
    const body = await req.json();

    if (body.targetRoleKey) {
      setUserTargetRole(candidateId, body.targetRoleKey);
    }

    const dna = await getStudentDNAFull(candidateId);

    return NextResponse.json(
      {
        success: true,
        data: dna
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error: any) {
    console.error("POST /api/student-dna error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update student DNA" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
