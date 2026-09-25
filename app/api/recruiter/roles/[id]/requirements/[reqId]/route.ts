import { NextResponse } from "next/server";
import { getAllRoles, saveRole } from "@/lib/recruiter-store";
import { recordAuditEntry } from "@/lib/infra/audit";
import { RoleRequirementCategory, RequirementStatus } from "@/lib/roles/types";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; reqId: string }> }
) {
  try {
    const { id: roleId, reqId } = await params;
    const body = await req.json();
    const { category, status, text: newText, actorId = "recruiter" } = body;

    const roles = await getAllRoles();
    const role = roles.find((r) => r.id === roleId);

    if (!role) {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }

    if (!role.spineRequirements) {
      role.spineRequirements = [];
    }

    const reqIndex = role.spineRequirements.findIndex((r) => r.id === reqId);
    if (reqIndex === -1) {
      return NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
    }

    const existingReq = role.spineRequirements[reqIndex];
    const previousCategory = existingReq.category;
    const previousStatus = existingReq.status;

    // Apply versioned edit
    existingReq.category = (category as RoleRequirementCategory) || existingReq.category;
    existingReq.status = (status as RequirementStatus) || existingReq.status;
    if (newText) existingReq.text = newText;
    existingReq.origin = "recruiter_edited";
    existingReq.version = (existingReq.version || 1) + 1;

    role.version = (role.version || 1) + 1;
    role.updatedAt = new Date().toISOString();

    await saveRole(role);

    // Audit log human action
    await recordAuditEntry({
      actorId,
      action: "edit_role_requirement",
      targetEntityType: "role_requirement",
      targetEntityId: reqId,
      details: {
        roleId,
        previousCategory,
        newCategory: existingReq.category,
        previousStatus,
        newStatus: existingReq.status,
        version: existingReq.version,
      },
    });

    return NextResponse.json({
      success: true,
      requirement: existingReq,
      roleVersion: role.version,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
