// app/api/roles/[roleId]/route.ts
//
// Role management endpoint: retrieve role details + submitted applications with frozen DNA snapshots,
// and close filled roles so they disappear from the collaboration feed automatically.

import { NextRequest, NextResponse } from "next/server";
import { getCollabUser } from "@/lib/collab/auth";
import { getRoleById, closeRole, getRoleApplications } from "@/lib/collab/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roleId: string }> | { roleId: string } }
) {
  const resolvedParams = await params;
  const roleId = resolvedParams.roleId;

  const role = await getRoleById(roleId);
  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  const user = await getCollabUser(req);
  let applications = undefined;

  // If the requester is the role's recruiter or an admin, include applications with frozen DNA snapshots
  if (user && (user.id === role.recruiter_id || user.role === "admin")) {
    applications = await getRoleApplications(roleId);
  }

  return NextResponse.json({ role, applications });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roleId: string }> | { roleId: string } }
) {
  const user = await getCollabUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (user.role !== "recruiter" && user.role !== "admin") {
    return NextResponse.json({ error: "Only recruiters can manage roles" }, { status: 403 });
  }

  const resolvedParams = await params;
  const roleId = resolvedParams.roleId;

  const body = await req.json().catch(() => ({}));
  const status = body.status;

  if (status !== "closed") {
    return NextResponse.json(
      { error: "Only status: 'closed' is currently supported" },
      { status: 400 }
    );
  }

  const result = await closeRole(roleId, user.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error || "Failed to close role" }, { status: 400 });
  }

  return NextResponse.json({ success: true, status: "closed" });
}
