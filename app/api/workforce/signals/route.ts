import { NextRequest, NextResponse } from "next/server";
import { requireRecruiterAuth } from "@/lib/auth/server";
import {
  getAllMarketSignals,
  getWorkforceSummary,
  getMarketSignalsForRole,
  classifyIndiaImpact,
  generateRoleEvolutionProposals,
  getEvolutionProposalsForRole,
  reviewEvolutionProposal,
} from "@/lib/workforce/workforce-intelligence-engine";
import { getRoleById } from "@/lib/recruiter-store";

export async function GET(req: NextRequest) {
  try {
    const authCheck = await requireRecruiterAuth(req);
    if (!authCheck.success) return authCheck.response;

    const { searchParams } = new URL(req.url);
    const roleId = searchParams.get("roleId");
    const roleTitle = searchParams.get("roleTitle");
    const summaryOnly = searchParams.get("summary") === "true";

    if (summaryOnly) {
      const summary = await getWorkforceSummary();
      return NextResponse.json({ success: true, summary });
    }

    if (roleId) {
      const role = await getRoleById(roleId);
      if (!role) {
        return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
      }
      const existingCaps = [
        ...(role.structuredRequirements?.map((r) => r.canonicalName || r.name) || []),
        ...(role.tieredRequirements?.map((r) => r.name) || []),
      ];
      const { matchingSignals, relevantCapabilities } = await getMarketSignalsForRole(
        role.title,
        existingCaps
      );
      const proposals = await getEvolutionProposalsForRole(roleId);

      return NextResponse.json({
        success: true,
        roleId,
        matchingSignals,
        relevantCapabilities,
        proposals,
      });
    }

    if (roleTitle) {
      const { matchingSignals, relevantCapabilities } = await getMarketSignalsForRole(roleTitle);
      return NextResponse.json({
        success: true,
        roleTitle,
        matchingSignals,
        relevantCapabilities,
      });
    }

    const [signals, summary] = await Promise.all([
      getAllMarketSignals(),
      getWorkforceSummary(),
    ]);

    return NextResponse.json({
      success: true,
      signals,
      summary,
    });
  } catch (err: any) {
    console.error("Error in GET /api/workforce/signals:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authCheck = await requireRecruiterAuth(req);
    if (!authCheck.success) return authCheck.response;

    const body = await req.json();
    const action = body.action || "classify_impact";

    if (action === "classify_impact") {
      const classification = classifyIndiaImpact(body.signal || {});
      return NextResponse.json({ success: true, classification });
    }

    if (action === "generate_proposals") {
      const { roleId } = body;
      if (!roleId) {
        return NextResponse.json({ success: false, error: "roleId is required" }, { status: 400 });
      }
      const role = await getRoleById(roleId);
      if (!role) {
        return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
      }
      const proposals = await generateRoleEvolutionProposals(role);
      return NextResponse.json({ success: true, roleId, proposals });
    }

    if (action === "review_proposal") {
      const { proposalId, decision } = body;
      if (!proposalId || !["approved", "rejected"].includes(decision)) {
        return NextResponse.json(
          { success: false, error: "Valid proposalId and decision ('approved' | 'rejected') required" },
          { status: 400 }
        );
      }
      const updated = await reviewEvolutionProposal(proposalId, decision, authCheck.auth.user.id);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, proposal: updated });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error("Error in POST /api/workforce/signals:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
