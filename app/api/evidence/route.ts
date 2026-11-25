import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { isTestRuntime } from "@/lib/env";
import {
  collectEvidence,
} from "@/lib/evidence-collector";
import {
  getEvidenceForCandidate,
  clearEvidenceForCandidate,
} from "@/lib/evidence-collector/store";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  Vary: "Cookie, Authorization",
};

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth?.user?.id && !isTestRuntime()) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Authentication required." },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    const { searchParams } = new URL(req.url);
    const requestedCandidateId = searchParams.get("candidateId");
    const roleId = searchParams.get("roleId") || undefined;

    if (auth?.user?.accountType === "student" && requestedCandidateId && requestedCandidateId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Cannot access another student's evidence." },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const candidateId =
      auth?.user?.accountType === "student"
        ? auth.user.id
        : requestedCandidateId || auth?.user?.id;

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: "candidateId is required" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const records = await getEvidenceForCandidate(candidateId, roleId);
    return NextResponse.json(
      {
        success: true,
        count: records.length,
        candidateId,
        roleId,
        records,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth?.user?.id && !isTestRuntime()) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Authentication required." },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    const body = await req.json();
    const {
      candidateId: requestedCandidateId,
      roleId,
      stage = "surface",
      profile,
      roleRequirements = [],
      clearExisting = false,
    } = body;

    if (auth?.user?.accountType === "student" && requestedCandidateId && requestedCandidateId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Cannot modify another student's evidence." },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const candidateId =
      auth?.user?.accountType === "student"
        ? auth.user.id
        : requestedCandidateId || auth?.user?.id;

    if (!candidateId || !roleId) {
      return NextResponse.json(
        { success: false, error: "candidateId and roleId are required" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    if (clearExisting) {
      await clearEvidenceForCandidate(candidateId, roleId);
    }

    const candidateProfile = profile || {
      candidateId,
      name: body.name || "Candidate",
      email: body.email,
      resumeText: body.resumeText,
      githubUsernameOrUrl: body.githubUsernameOrUrl || body.github,
      codeforcesHandle: body.codeforcesHandle || body.codeforces,
      leetcodeUsernameOrUrl: body.leetcodeUsernameOrUrl || body.leetcode,
      claimedSkills: body.claimedSkills,
    };

    const result = await collectEvidence(
      candidateId,
      roleId,
      stage as "surface" | "deep",
      candidateProfile,
      roleRequirements
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
