import { NextResponse } from "next/server";
import {
  collectEvidence,
} from "@/lib/evidence-collector";
import {
  getEvidenceForCandidate,
  clearEvidenceForCandidate,
} from "@/lib/evidence-collector/store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId");
    const roleId = searchParams.get("roleId") || undefined;

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: "candidateId is required" },
        { status: 400 }
      );
    }

    const records = await getEvidenceForCandidate(candidateId, roleId);
    return NextResponse.json({
      success: true,
      count: records.length,
      candidateId,
      roleId,
      records,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      candidateId,
      roleId,
      stage = "surface",
      profile,
      roleRequirements = [],
      clearExisting = false,
    } = body;

    if (!candidateId || !roleId) {
      return NextResponse.json(
        { success: false, error: "candidateId and roleId are required" },
        { status: 400 }
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
