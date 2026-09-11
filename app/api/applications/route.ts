import { NextResponse } from "next/server";
import {
  getApplicationsStore,
  upsertApplicationRecord,
  updateApplicationStage,
  deleteApplicationRecord
} from "@/lib/placement-store";
import { createNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-demo";

    const applications = await getApplicationsStore(candidateId);
    return NextResponse.json({ applications });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const candidateId = body.candidateId || body.candidate_id || "student-demo";
    const opportunityId = body.opportunityId || body.opportunity_id;
    const stage = body.stage || "Bookmarked";
    const notes = body.notes || "";
    const action = body.action;

    if (!opportunityId) {
      return NextResponse.json({ error: "Missing opportunityId" }, { status: 400 });
    }

    if (action === "delete" || action === "remove") {
      await deleteApplicationRecord(candidateId, opportunityId);
      return NextResponse.json({ success: true, message: "Application removed from pipeline" });
    }

    const updatedApp = await upsertApplicationRecord(candidateId, opportunityId, stage, notes);

    // Unified Notification Hook
    await createNotification({
      studentId: candidateId,
      sourceFeature: "application_tracker",
      notificationType: "stage_changed",
      title: `📋 Application Stage: ${stage}`,
      body: `Your application status has been updated to "${stage}". Track upcoming prep milestones in your pipeline.`,
      linkUrl: `/student/applications`,
      priority: "normal"
    });

    return NextResponse.json({ success: true, application: updatedApp });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const candidateId = body.candidateId || body.candidate_id || "student-demo";
    const appIdOrOppId = body.id || body.opportunityId || body.opportunity_id;
    const stage = body.stage;
    const notes = body.notes;

    if (!appIdOrOppId) {
      return NextResponse.json({ error: "Missing application or opportunity id" }, { status: 400 });
    }

    const updatedApp = await updateApplicationStage(candidateId, appIdOrOppId, stage, notes);

    if (stage) {
      await createNotification({
        studentId: candidateId,
        sourceFeature: "application_tracker",
        notificationType: "stage_changed",
        title: `📋 Application Stage: ${stage}`,
        body: `Application updated to "${stage}".`,
        linkUrl: `/student/applications`,
        priority: "normal"
      });
    }

    return NextResponse.json({ success: true, application: updatedApp });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let candidateId = searchParams.get("candidateId") || "student-demo";
    let targetId = searchParams.get("id") || searchParams.get("opportunityId");

    // Also check body if query params are missing
    if (!targetId) {
      try {
        const body = await req.json();
        candidateId = body.candidateId || candidateId;
        targetId = body.id || body.opportunityId || body.opportunity_id;
      } catch {
        // no body
      }
    }

    if (!targetId) {
      return NextResponse.json({ error: "Missing id or opportunityId to delete" }, { status: 400 });
    }

    await deleteApplicationRecord(candidateId, targetId);
    return NextResponse.json({ success: true, message: "Application deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
