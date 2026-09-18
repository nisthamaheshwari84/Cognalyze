import { NextResponse } from "next/server";
import { getAllRoles, saveRole } from "@/lib/recruiter-store";
import { normalizeRoleDnaWeights, RoleDNA } from "@/lib/ai/role-dna";

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
    if (!body.title || !body.department) {
      return NextResponse.json({ success: false, error: "Title and Department are required" }, { status: 400 });
    }

    const tieredRequirements = normalizeRoleDnaWeights(body.tieredRequirements || []);

    const role: RoleDNA = {
      id: body.id || `role-${body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`,
      title: body.title,
      department: body.department,
      seniority: body.seniority || "Senior",
      targetHires: body.targetHires || 1,
      businessOutcomes: body.businessOutcomes || [],
      tieredRequirements,
      uncertaintyThreshold: body.uncertaintyThreshold || 0.20,
      status: body.status || "active",
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await saveRole(role);
    return NextResponse.json({ success: true, role: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
