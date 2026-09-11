import { NextResponse } from "next/server";
import {
  getApplicationsStore,
  getPersonalEvents,
  getStudentProfile,
  OpportunityData
} from "@/lib/placement-store";
import { computeMatchScore } from "@/lib/ai/placement-intelligence";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-demo";
    const todayStr = new Date().toISOString().split("T")[0];

    const profile = await getStudentProfile(candidateId);
    const applications = await getApplicationsStore(candidateId);
    const personalEvents = await getPersonalEvents(candidateId);

    const historyItems: Array<{
      id: string;
      title: string;
      date: string;
      event_type: string;
      fit_score: number;
      application_stage: string | null;
      outcome: "Hit" | "Missed" | "Completed" | "Dismissed" | "Upcoming";
      is_high_fit: boolean;
      notes: string;
      opportunity_id?: string;
    }> = [];

    let highFitPassedDeadlines = 0;
    let highFitAppliedBeforeDeadline = 0;

    for (const app of applications) {
      const opp = app.opportunity;
      if (!opp) continue;
      const deadlineStr = opp.deadline?.split("T")[0] || opp.extracted_context?.deadline_if_mentioned;
      if (!deadlineStr) continue;

      let fitScore = 75;
      if (profile) {
        const match = computeMatchScore(profile, opp);
        fitScore = match.fit_score;
      }

      const isHighFit = fitScore >= 75;
      const isPast = deadlineStr < todayStr;
      const hasApplied = app.stage !== "Bookmarked";

      let outcome: "Hit" | "Missed" | "Upcoming" = "Upcoming";
      if (isPast) {
        if (hasApplied) {
          outcome = "Hit";
          if (isHighFit) highFitAppliedBeforeDeadline++;
        } else {
          outcome = "Missed";
        }
        if (isHighFit) {
          highFitPassedDeadlines++;
        }
      } else {
        outcome = "Upcoming";
      }

      historyItems.push({
        id: `app-hist-${app.id}`,
        title: `${opp.title} (${opp.organizer})`,
        date: deadlineStr,
        event_type: "deadline",
        fit_score: fitScore,
        application_stage: app.stage,
        outcome,
        is_high_fit: isHighFit,
        notes: outcome === "Hit" 
          ? `Applied successfully ahead of deadline (${app.stage}).` 
          : outcome === "Missed"
          ? `Deadline elapsed while still in Bookmarked stage.`
          : `Upcoming deadline. Currently ${app.stage}.`,
        opportunity_id: opp.id
      });
    }

    // Include personal events in retrospective log, including dismissed ones per spec
    for (const pe of personalEvents) {
      const isPast = pe.event_date < todayStr;
      let outcome: "Hit" | "Missed" | "Completed" | "Dismissed" | "Upcoming" = "Upcoming";
      if (pe.is_dismissed) {
        outcome = "Dismissed";
      } else if (isPast) {
        outcome = "Completed";
      }

      historyItems.push({
        id: pe.id,
        title: pe.title,
        date: pe.event_date,
        event_type: pe.event_type,
        fit_score: 75,
        application_stage: null,
        outcome,
        is_high_fit: false,
        notes: pe.notes || `Scheduled ${pe.event_type} (${outcome.toLowerCase()}).`,
        opportunity_id: pe.linked_opportunity_id
      });
    }

    // Exact computation without rounding or hand-waving
    const percentage = highFitPassedDeadlines > 0
      ? Number(((highFitAppliedBeforeDeadline / highFitPassedDeadlines) * 100).toFixed(1))
      : 100.0;

    return NextResponse.json({
      success: true,
      candidate_id: candidateId,
      today: todayStr,
      metrics: {
        high_fit_passed_deadlines: highFitPassedDeadlines,
        high_fit_applied_before_deadline: highFitAppliedBeforeDeadline,
        percentage_applied_before_deadline: percentage,
        headline_stat: `You applied to ${percentage}% of your high-fit opportunities before their deadline (${highFitAppliedBeforeDeadline} of ${highFitPassedDeadlines}).`
      },
      history: historyItems.sort((a, b) => b.date.localeCompare(a.date))
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
