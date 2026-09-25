import { NextRequest, NextResponse } from "next/server";
import { getOrganizationCapabilityMap, analyzeTeamCompositionDelta } from "@/lib/organization/capability-map";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId") || "org_acme_corp";
    const orgName = searchParams.get("orgName") || "Acme Engineering Corp";

    const report = await getOrganizationCapabilityMap(orgId, orgName);
    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error("GET /api/organization/capability-map error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to compute capability map" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teamId, teamName, teamExistingCapabilities, candidatePersonId, candidatePersonName, candidateCapabilities } = body;

    const analysis = analyzeTeamCompositionDelta({
      teamId: teamId || "team_platform_core",
      teamName: teamName || "Platform Core Team",
      teamExistingCapabilities: teamExistingCapabilities || {},
      candidatePersonId: candidatePersonId || "cand_1",
      candidatePersonName: candidatePersonName || "Candidate",
      candidateCapabilities: candidateCapabilities || [],
    });

    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    console.error("POST /api/organization/capability-map error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to analyze team composition" },
      { status: 500 }
    );
  }
}
