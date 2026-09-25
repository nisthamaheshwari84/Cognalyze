// app/api/roles/[roleId]/apply/route.ts
//
// The student only ever provides resume_id + (optional) github_url in the request.
// The student's Cognalyze "DNA" (their existing analysis output) is fetched server-side
// and attached automatically. The student never has to re-submit or manually attach it,
// and cannot fake it, because it's read from the DB by student_id.

import { NextRequest, NextResponse } from "next/server";
import { getCollabUser } from "@/lib/collab/auth";
import {
  getRoleById,
  verifyResumeBelongsToStudent,
  getStudentLatestAnalysis,
  createRoleApplication,
} from "@/lib/collab/store";
import { ApplyToRoleInput } from "@/lib/collab/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roleId: string }> | { roleId: string } }
) {
  const user = await getCollabUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (user.role !== "student" && user.role !== "admin") {
    return NextResponse.json({ error: "Only students can apply" }, { status: 403 });
  }

  const resolvedParams = await params;
  const roleId = resolvedParams.roleId;

  let body: ApplyToRoleInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  if (!body.resume_id) {
    return NextResponse.json({ error: "resume_id is required" }, { status: 400 });
  }

  // 1. Verify the role exists, is open, and is a collaboration-feed role
  const role = await getRoleById(roleId);
  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  if (role.status !== "open" || role.feed_type !== "collaboration") {
    return NextResponse.json({ error: "This role is no longer open" }, { status: 409 });
  }

  // 2. Verify the resume belongs to this student (prevents submitting someone else's resume_id)
  const resumeCheck = await verifyResumeBelongsToStudent(body.resume_id, user.id);
  if (!resumeCheck.valid) {
    return NextResponse.json({ error: "Invalid resume for this student" }, { status: 400 });
  }

  // 3. Auto-attach DNA: fetch this student's most recent computed DNA analysis
  const latestAnalysis = await getStudentLatestAnalysis(user.id);
  if (!latestAnalysis || !latestAnalysis.dna_data) {
    // Design choice per spec: block the application rather than silently posting with missing DNA
    return NextResponse.json(
      {
        error:
          "No Cognalyze DNA analysis found for this student yet — complete an analysis before applying.",
      },
      { status: 412 }
    );
  }

  // 4. Create frozen application snapshot
  try {
    const application = await createRoleApplication({
      role_id: role.id,
      student_id: user.id,
      resume_id: body.resume_id,
      github_url: body.github_url?.trim() || undefined,
      dna_snapshot: latestAnalysis.dna_data, // Frozen copy at apply-time
      dna_snapshot_source_analysis_id: latestAnalysis.id,
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (err: any) {
    if (err.code === "23505" || err.message?.includes("already applied")) {
      return NextResponse.json(
        { error: "You have already applied to this role" },
        { status: 409 }
      );
    }
    console.error("[roles/apply POST] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit application" },
      { status: 500 }
    );
  }
}
