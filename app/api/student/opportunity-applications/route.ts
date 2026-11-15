import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { studentApplicationService } from "@/lib/opportunities/student-application-service";
import { opportunityService } from "@/lib/opportunities/opportunity-service";
import { createNotification } from "@/lib/notifications";

/**
 * GET /api/student/opportunity-applications
 * 
 * Lists all student opportunity applications with their current pipeline stages.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(request);
    const { searchParams } = new URL(request.url);
    const userId = auth?.user?.id || (searchParams.get("candidateId") === "student-demo" ? "student-demo" : null);

    if (!userId) {
      return NextResponse.json({
        success: true,
        applications: [],
        count: 0,
      });
    }

    const applications = await studentApplicationService.getApplications(userId);
    const opps = await opportunityService.ensureIngested();

    // Enrich with canonical opportunity details
    const enriched = applications.map((app) => {
      const opp = opps.find((o) => o.id === app.opportunityId);
      return {
        ...app,
        opportunity: opp || null,
      };
    });

    return NextResponse.json({
      success: true,
      applications: enriched,
      count: enriched.length,
    });
  } catch (error: any) {
    console.error("[GET /api/student/opportunity-applications] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve applications" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/student/opportunity-applications
 * 
 * Upserts a student opportunity application record in the student pipeline.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(request);
    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);

    const userId = auth?.user?.id || (body.candidateId === "student-demo" || searchParams.get("candidateId") === "student-demo" ? "student-demo" : null);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Authentication is required to track applications." },
        { status: 401 }
      );
    }

    const opportunityId = body.opportunityId || body.opportunity_id;
    if (!opportunityId) {
      return NextResponse.json(
        { success: false, error: "opportunityId is required" },
        { status: 400 }
      );
    }

    // Resolve opportunity details if not supplied in body
    let organizationName = body.organizationName || body.companyName || body.organizer;
    let positionTitle = body.positionTitle || body.title;
    let applyUrl = body.applyUrl || body.sourceUrl;
    let deadline = body.deadline;

    if (!organizationName || !positionTitle || !applyUrl) {
      const opp = await opportunityService.getOpportunityById(opportunityId, userId);
      if (opp?.opportunity) {
        organizationName = organizationName || opp.opportunity.companyName || opp.opportunity.organizer || "Organization";
        positionTitle = positionTitle || opp.opportunity.title;
        applyUrl = applyUrl || opp.opportunity.applicationUrl || opp.opportunity.sourceUrl;
        deadline = deadline || opp.opportunity.deadline;
      }
    }

    const record = await studentApplicationService.upsertApplication(userId, {
      opportunityId,
      stage: body.stage || "Saved",
      organizationName: organizationName || "Organization",
      positionTitle: positionTitle || "Position",
      applyUrl: applyUrl || "",
      deadline,
      appliedAt: body.appliedAt,
      resumeVersion: body.resumeVersion,
      coverLetter: body.coverLetter,
      tailoredBulletsJson: body.tailoredBulletsJson,
      notes: body.notes,
      followUpDate: body.followUpDate,
    });

    // Notify student on stage advancement
    if (record.stage === "Applied" || record.stage === "Interviewing" || record.stage === "Offer") {
      await createNotification({
        studentId: userId,
        sourceFeature: "application_tracker",
        notificationType: "stage_changed",
        title: `📋 Application Stage: ${record.stage}`,
        body: `Updated application for ${record.positionTitle} at ${record.organizationName} to ${record.stage}.`,
        linkUrl: `/student/opportunities/${record.opportunityId}`,
        priority: "normal",
      });
    }

    return NextResponse.json({
      success: true,
      application: record,
    });
  } catch (error: any) {
    console.error("[POST /api/student/opportunity-applications] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record application" },
      { status: 500 }
    );
  }
}
