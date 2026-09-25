import { NextResponse } from "next/server";
import {
  createConsentGrant,
  revokeConsentGrant,
  listActiveConsentGrants,
  generatePassportShareableLink
} from "@/lib/privacy/consent";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "default_candidate";

    const grants = await listActiveConsentGrants(candidateId);
    const shareableLink = generatePassportShareableLink(candidateId, false);
    const anonymousLink = generatePassportShareableLink(candidateId, true);

    return NextResponse.json({
      success: true,
      candidateId,
      grants,
      shareableLink,
      anonymousLink
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { candidateId, granteeOrgId, granteeOrgName, scopes, isAnonymous, durationDays } = body;

    if (!candidateId || !granteeOrgId) {
      return NextResponse.json(
        { success: false, error: "candidateId and granteeOrgId are required" },
        { status: 400 }
      );
    }

    const grant = await createConsentGrant({
      personId: candidateId,
      granteeOrgId,
      granteeOrgName: granteeOrgName || "Employer Organization",
      scopes: scopes || ["verified_claims"],
      isAnonymous: Boolean(isAnonymous),
      durationDays: durationDays || 30
    });

    return NextResponse.json({ success: true, grant });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const grantId = searchParams.get("grantId");
    const candidateId = searchParams.get("candidateId");

    if (!grantId || !candidateId) {
      return NextResponse.json(
        { success: false, error: "grantId and candidateId are required" },
        { status: 400 }
      );
    }

    await revokeConsentGrant(grantId, candidateId);
    return NextResponse.json({ success: true, message: "Consent grant revoked immediately." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
