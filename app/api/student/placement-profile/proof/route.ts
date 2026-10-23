import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { PlacementIntelligenceService } from "@/lib/skills/placement-intelligence-engine";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth || !auth.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const proofs = await PlacementIntelligenceService.getInstance().getProofPortfolio(auth.user.id);
    return NextResponse.json({ success: true, proofs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load proof portfolio." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth || !auth.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    if (!body.skillOrClaim || !body.title) {
      return NextResponse.json({ error: "skillOrClaim and title are required." }, { status: 400 });
    }

    const proof = await PlacementIntelligenceService.getInstance().addProofItem(auth.user.id, {
      skillOrClaim: body.skillOrClaim,
      evidenceType: body.evidenceType || "github_repo",
      title: body.title,
      description: body.description,
      sourceUrl: body.sourceUrl,
      sourceRecordId: body.sourceRecordId,
      verificationTier: body.verificationTier || "self_reported",
      verificationMethod: body.verificationMethod || "candidate_submission",
      confidenceScore: Number(body.confidenceScore) || 75,
      assessmentScore: body.assessmentScore ? Number(body.assessmentScore) : undefined,
      limitations: body.limitations,
      metadata: body.metadata || {},
    });

    return NextResponse.json({ success: true, proof });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to add proof item." }, { status: 500 });
  }
}
