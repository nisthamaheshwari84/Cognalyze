import { NextResponse } from "next/server";
import { requireRecruiterAuth } from "@/lib/auth/server";
import { getAllRoles, getRoleById, getRoleVersions, saveRole, approveRole } from "@/lib/recruiter-store";
import { compileTieredRequirementsFromStructured, normalizeRoleDnaWeights, RoleDNA } from "@/lib/ai/role-dna";

export async function GET(req: Request) {
  try {
    const authCheck = await requireRecruiterAuth(req);
    if (!authCheck.success) return authCheck.response;

    const { searchParams } = new URL(req.url);
    const roleId = searchParams.get("roleId");
    const includeVersions = searchParams.get("versions") === "true";

    if (roleId && includeVersions) {
      const versions = await getRoleVersions(roleId);
      return NextResponse.json({ success: true, roleId, versions });
    }

    if (roleId) {
      const role = await getRoleById(roleId);
      if (!role) {
        return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, role });
    }

    const roles = await getAllRoles();
    return NextResponse.json({ success: true, roles });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authCheck = await requireRecruiterAuth(req);
    if (!authCheck.success) return authCheck.response;

    const body = await req.json();

    // Human Sign-Off / Approval Action Gate
    if (body.action === "approve") {
      if (!body.roleId) {
        return NextResponse.json({ success: false, error: "roleId is required for approval" }, { status: 400 });
      }
      const approvedResult = await approveRole(
        body.roleId,
        {
          approvedBy: authCheck.auth.user.id || body.approvedBy || "recruiter",
          approverRole: body.approverRole || "Lead Technical Recruiter",
          approvalStatus: body.approvalStatus || "approved",
          approvalNotes: body.approvalNotes || "Candidate requirements signed off and approved for screening.",
        },
        body.changeSummary || "Role officially signed off and approved"
      );

      if (!approvedResult) {
        return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, role: approvedResult.role, version: approvedResult.version });
    }

    if (!body.title) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }

    const structuredRequirements = body.structuredRequirements || [];
    let tieredRequirements = body.tieredRequirements;

    if (!tieredRequirements || tieredRequirements.length === 0) {
      tieredRequirements = compileTieredRequirementsFromStructured(structuredRequirements);
    } else {
      tieredRequirements = normalizeRoleDnaWeights(tieredRequirements);
    }

    // Phase 2: If jdRaw text is provided, run deterministic JD intake & review lens
    let spineRequirements = body.spineRequirements;
    let reviewLens = body.reviewLens;

    if (body.jdRaw && (!spineRequirements || spineRequirements.length === 0)) {
      const intake = (await import("@/lib/roles/jd-intake")).processJdIntake(body.jdRaw, body.title);
      spineRequirements = intake.requirements;
      reviewLens = intake.reviewLens;
    }

    // Optional 90-day outcome
    const businessOutcomes = body.businessOutcomes || (body.success90Days?.trim() ? [
      {
        id: `out-${Date.now().toString().slice(-4)}`,
        outcome: body.success90Days.trim(),
        metric: "90-day milestone verification",
        timeframe: "First 90 days",
        impactSeverity: "Critical" as const
      }
    ] : []);

    const role: RoleDNA = {
      id: body.id || `role-${body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`,
      title: body.title,
      department: body.department || "Engineering",
      seniority: body.seniority || "Senior",
      targetHires: body.targetHires || 1,
      workMode: body.workMode || "Remote",
      location: body.location || undefined,
      businessOutcomes,
      tieredRequirements,
      structuredRequirements,
      roleDna: body.roleDna,
      responsibilityGraph: body.responsibilityGraph || body.roleDna?.responsibilityGraph,
      adaptiveQuestions: body.adaptiveQuestions || body.roleDna?.adaptiveQuestions,
      approvalRecord: body.approvalRecord,
      uncertaintyThreshold: body.uncertaintyThreshold || 0.20,
      status: body.status || "active",
      version: body.version || 1,
      jdRaw: body.jdRaw,
      spineRequirements,
      reviewLens,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await saveRole(role, body.changeSummary);
    return NextResponse.json({ success: true, role: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
