import { NextRequest, NextResponse } from "next/server";
import {
  getApplicationsStore,
  upsertApplicationRecord,
  updateApplicationStage,
  deleteApplicationRecord
} from "@/lib/placement-store";
import { createNotification } from "@/lib/notifications";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    // Guest users see zero applications
    if (!auth) {
      return NextResponse.json({ applications: [] });
    }

    const candidateId = auth.user.id;
    const applications = await getApplicationsStore(candidateId);
    return NextResponse.json({ applications });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth) {
      return NextResponse.json({
        error: "Unauthorized. Tracking applications requires authentication.",
        requiresAuth: true
      }, { status: 401 });
    }

    const candidateId = auth.user.id;
    const body = await req.json();
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

    // Student Career Intelligence Event Bus: Emits Career Memory event
    if (stage === "Offer" || stage === "Rejected" || stage === "Interviewing") {
      try {
        const { recordStudentEvent } = await import("@/lib/intelligence/student-intelligence");
        await recordStudentEvent({
          studentId: candidateId,
          eventType: "application_outcome",
          payload: {
            companyName: (updatedApp as any)?.opportunity?.organizer || "Company",
            roleTitle: (updatedApp as any)?.opportunity?.title || "Role",
            status: stage,
            feedbackNotes: notes || undefined,
            strengths: stage === "Offer" ? ["Core Alignment", "Technical Evaluation"] : undefined,
            weaknesses: stage === "Rejected" && notes ? [notes] : undefined
          }
        });
      } catch (eventErr) {
        console.warn("Failed to record application outcome to Career Memory:", eventErr);
      }
    }

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
    const auth = await getAuthenticatedContext(req as any);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized. Updating applications requires authentication." }, { status: 401 });
    }

    const candidateId = auth.user.id;
    const body = await req.json();
    const appIdOrOppId = body.id || body.opportunityId || body.opportunity_id;
    const stage = body.stage;
    const notes = body.notes;

    if (!appIdOrOppId) {
      return NextResponse.json({ error: "Missing application or opportunity id" }, { status: 400 });
    }

    const updatedApp = await updateApplicationStage(candidateId, appIdOrOppId, stage, notes);

    // Student Career Intelligence Event Bus: Emits Career Memory event
    if (stage === "Offer" || stage === "Rejected" || stage === "Interviewing") {
      try {
        const { recordStudentEvent } = await import("@/lib/intelligence/student-intelligence");
        await recordStudentEvent({
          studentId: candidateId,
          eventType: "application_outcome",
          payload: {
            companyName: (updatedApp as any)?.opportunity?.organizer || "Company",
            roleTitle: (updatedApp as any)?.opportunity?.title || "Role",
            status: stage,
            feedbackNotes: notes || undefined,
            strengths: stage === "Offer" ? ["Core Alignment", "Interview Performance"] : undefined,
            weaknesses: stage === "Rejected" && notes ? [notes] : undefined
          }
        });
      } catch (eventErr) {
        console.warn("Failed to record application outcome to Career Memory:", eventErr);
      }
    }

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
    const auth = await getAuthenticatedContext(req as any);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized. Deleting applications requires authentication." }, { status: 401 });
    }

    const candidateId = auth.user.id;
    const { searchParams } = new URL(req.url);
    let targetId = searchParams.get("id") || searchParams.get("opportunityId");

    // Also check body if query params are missing
    if (!targetId) {
      try {
        const body = await req.json();
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
