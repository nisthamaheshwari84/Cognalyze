import { NextResponse } from "next/server";
import { getAllRoles, saveRole } from "@/lib/recruiter-store";
import { compileTieredRequirementsFromStructured, normalizeRoleDnaWeights, RoleDNA } from "@/lib/ai/role-dna";

export async function GET() {
  try {
    const roles = await getAllRoles();
    return NextResponse.json({ success: true, roles });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
      uncertaintyThreshold: body.uncertaintyThreshold || 0.20,
      status: body.status || "active",
      version: body.version || 1,
      jdRaw: body.jdRaw,
      spineRequirements,
      reviewLens,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await saveRole(role);
    return NextResponse.json({ success: true, role: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
