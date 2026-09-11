import { NextResponse } from "next/server";
import {
  getApplicationsStore,
  getPersonalEvents,
  getStudentProfile,
  getAllOpportunities,
  OpportunityData,
  PersonalEvent,
  ApplicationRecord
} from "@/lib/placement-store";
import { computeMatchScore } from "@/lib/ai/placement-intelligence";
import { createNotification } from "@/lib/notifications";

export interface CalendarEventItem {
  id: string;
  source_type: "application_deadline" | "assessment_date" | "personal_event";
  event_type: "deadline" | "assessment" | "practice_session" | "exam" | "reminder" | "other";
  title: string;
  event_date: string; // YYYY-MM-DD
  days_until_date: number;
  priority_score: number;
  priority_label: "Critical" | "High" | "Medium" | "Standard";
  priority_breakdown: {
    fit_score: number;
    urgency_score: number;
    explanation: string;
  };
  conflict_flag: boolean;
  conflict_count: number;
  prep_window: {
    start_date: string;
    end_date: string;
    days: number;
    note: string;
  } | null;
  application_status: "Bookmarked" | "Applied" | "Interviewing" | "Offer" | "Rejected" | null;
  linked_opportunity_id?: string | null;
  linked_opportunity?: OpportunityData | null;
  notes?: string | null;
  is_dismissed: boolean;
  snoozed_until: string | null;
  is_snoozed: boolean;
  deep_links: {
    roadmap_url?: string;
    project_suggestions_url?: string;
    practice_interview_url?: string;
    gd_practice_url?: string;
    application_tracker_url?: string;
  };
}

// Calculate explainable priority score: 65% fit weight + 35% urgency weight
export function computeEventPriority(fitScore: number, daysUntil: number) {
  const clampedDays = Math.max(0, daysUntil);
  // Urgency score scales from 10 to 100 based on proximity
  const urgencyScore = Math.min(100, Math.max(10, 100 - clampedDays * 4));
  const rawScore = (fitScore * 0.65) + (urgencyScore * 0.35);
  const score = Math.round(rawScore);

  let label: "Critical" | "High" | "Medium" | "Standard" = "Standard";
  if (score >= 82) label = "Critical";
  else if (score >= 70) label = "High";
  else if (score >= 50) label = "Medium";

  const explanation = `${score}/100 Priority (${Math.round(fitScore)}% candidate fit × 0.65 + ${Math.round(urgencyScore)} urgency × 0.35).`;
  return { score, label, urgencyScore, explanation };
}

// Parse ISO date or date string safely to YYYY-MM-DD
function toDateStr(d: string | null | undefined): string | null {
  if (!d) return null;
  try {
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return null;
    return parsed.toISOString().split("T")[0];
  } catch {
    return null;
  }
}

// Calculate days difference from current date (IST)
function getDaysUntil(dateStr: string, referenceDateStr?: string): number {
  const todayStr = referenceDateStr || new Date().toISOString().split("T")[0];
  const target = new Date(dateStr + "T00:00:00Z");
  const today = new Date(todayStr + "T00:00:00Z");
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// Subtract days from a YYYY-MM-DD string
function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-demo";
    const todayStr = new Date().toISOString().split("T")[0];

    // 1. Fetch Student Profile for dynamic fit calculation
    const profile = await getStudentProfile(candidateId);

    // 2. Fetch live applications for this student
    const applications = await getApplicationsStore(candidateId);
    const appMap = new Map<string, ApplicationRecord>();
    applications.forEach(a => {
      appMap.set(a.opportunity_id, a);
    });

    // 3. Fetch personal events for this student
    const personalEvents = await getPersonalEvents(candidateId);

    // 4. Precompute fit scores for opportunities linked to applications
    const fitScoreMap = new Map<string, number>();
    for (const app of applications) {
      if (app.opportunity) {
        if (profile) {
          const match = computeMatchScore(profile, app.opportunity);
          fitScoreMap.set(app.opportunity_id, match.fit_score);
        } else {
          fitScoreMap.set(app.opportunity_id, app.opportunity.tier === "Tier 1" ? 85 : 70);
        }
      }
    }

    const rawEvents: CalendarEventItem[] = [];

    // ─────────────────────────────────────────────────────────────
    // Source 1: Application Deadlines
    // ─────────────────────────────────────────────────────────────
    for (const app of applications) {
      const opp = app.opportunity;
      if (!opp) continue;

      const deadlineDateStr = toDateStr(opp.deadline) || toDateStr(opp.extracted_context?.deadline_if_mentioned);
      if (!deadlineDateStr) continue;

      const fitScore = fitScoreMap.get(opp.id || "") ?? (opp.tier === "Tier 1" ? 85 : 70);
      const daysUntil = getDaysUntil(deadlineDateStr, todayStr);
      const priority = computeEventPriority(fitScore, daysUntil);

      // Prep Window Calculation:
      // High difficulty or Tier-1 hackathons requiring engineering project blueprints get 7-10 day prep window.
      // Simple application-only or low-difficulty opportunities get NO prep window (null) per spec.
      const diffTier = (opp.extracted_context?.difficulty_tier || "").toLowerCase();
      const isLowDifficulty = diffTier === "low" || opp.tier === "Tier 3";
      const needsPrep = !isLowDifficulty && (diffTier === "high" || (opp.tier === "Tier 1" && opp.type === "hackathon"));
      const prepDays = diffTier === "high" ? 10 : 7;

      let prepWindow = null;
      if (needsPrep && daysUntil > 0) {
        const startDate = subtractDays(deadlineDateStr, prepDays);
        prepWindow = {
          start_date: startDate,
          end_date: deadlineDateStr,
          days: prepDays,
          note: `Prep sprint suggested for ${opp.title} (${diffTier || "engineering"} challenge requirements).`
        };
      }

      rawEvents.push({
        id: `deadline-${app.id || opp.id}`,
        source_type: "application_deadline",
        event_type: "deadline",
        title: `${opp.title} — Submission Deadline`,
        event_date: deadlineDateStr,
        days_until_date: daysUntil,
        priority_score: priority.score,
        priority_label: priority.label,
        priority_breakdown: {
          fit_score: fitScore,
          urgency_score: priority.urgencyScore,
          explanation: priority.explanation
        },
        conflict_flag: false, // Calculated in pass 2
        conflict_count: 1,
        prep_window: prepWindow,
        application_status: app.stage, // LIVE from applications table
        linked_opportunity_id: opp.id,
        linked_opportunity: opp,
        notes: app.notes || opp.extracted_context?.summary || null,
        is_dismissed: false,
        snoozed_until: null,
        is_snoozed: false,
        deep_links: {
          roadmap_url: `/candidate`,
          project_suggestions_url: `/student/opportunities/${opp.id}`,
          application_tracker_url: `/student/applications`
        }
      });

      // Unified Notification Hook: Deadline within 3 days and not yet applied
      if (daysUntil >= 0 && daysUntil <= 3 && app.stage !== "Applied") {
        await createNotification({
          studentId: candidateId,
          sourceFeature: "calendar",
          notificationType: "deadline_approaching",
          title: `Deadline Approaching: ${opp.title}`,
          body: `${opp.title} (${opp.organizer}) deadline is ${daysUntil === 0 ? "today" : `in ${daysUntil} day(s)`}. Submit your application!`,
          linkUrl: `/student/calendar`,
          priority: "high"
        });
      }

      // ─────────────────────────────────────────────────────────────
      // Source 2: Auto-detected assessment_dates (only for bookmarked/applied)
      // ─────────────────────────────────────────────────────────────
      const assessmentDates = opp.extracted_context?.assessment_dates;
      if (Array.isArray(assessmentDates)) {
        assessmentDates.forEach((ad: any, adIdx: number) => {
          // Never guess a date — if not clearly stated, date_if_mentioned stays null and is omitted entirely
          const adDateStr = toDateStr(ad.date_if_mentioned);
          if (adDateStr) {
            const adDaysUntil = getDaysUntil(adDateStr, todayStr);
            // Assessment is critical urgency
            const adPriority = computeEventPriority(Math.max(fitScore, 75), adDaysUntil);

            rawEvents.push({
              id: `assessment-${opp.id}-${adIdx}`,
              source_type: "assessment_date",
              event_type: "assessment",
              title: `${opp.organizer}: ${ad.label || "Online Assessment"}`,
              event_date: adDateStr,
              days_until_date: adDaysUntil,
              priority_score: adPriority.score,
              priority_label: adPriority.label,
              priority_breakdown: {
                fit_score: fitScore,
                urgency_score: adPriority.urgencyScore,
                explanation: `Online assessment round for ${opp.organizer}. High selection impact.`
              },
              conflict_flag: false,
              conflict_count: 1,
              prep_window: adDaysUntil > 3 ? {
                start_date: subtractDays(adDateStr, 3),
                end_date: adDateStr,
                days: 3,
                note: "Review core data structures and algorithmic speed drills"
              } : null,
              application_status: app.stage,
              linked_opportunity_id: opp.id,
              linked_opportunity: opp,
              notes: `Auto-extracted assessment milestone for ${opp.title}.`,
              is_dismissed: false,
              snoozed_until: null,
              is_snoozed: false,
              deep_links: {
                practice_interview_url: `/student/practice-interview`,
                gd_practice_url: `/student/gd-practice`,
                application_tracker_url: `/student/applications`,
                project_suggestions_url: `/student/opportunities/${opp.id}`
              }
            });
          }
        });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Source 3: Personal Events (including mock interview / GD sessions)
    // ─────────────────────────────────────────────────────────────
    for (const pe of personalEvents) {
      const peDateStr = toDateStr(pe.event_date);
      if (!peDateStr) continue;

      const daysUntil = getDaysUntil(peDateStr, todayStr);
      // Linked opportunity fit if any, else neutral high value 75
      let fitScore = 75;
      let linkedOpp: OpportunityData | null = null;
      let appStatus = null;

      if (pe.linked_opportunity_id) {
        fitScore = fitScoreMap.get(pe.linked_opportunity_id) || 75;
        const matchingApp = appMap.get(pe.linked_opportunity_id);
        if (matchingApp) {
          appStatus = matchingApp.stage;
          linkedOpp = matchingApp.opportunity || null;
        }
      }

      const priority = computeEventPriority(fitScore, daysUntil);
      const isSnoozed = pe.snoozed_until ? pe.snoozed_until > todayStr : false;

      rawEvents.push({
        id: pe.id,
        source_type: "personal_event",
        event_type: pe.event_type as any,
        title: pe.title,
        event_date: peDateStr,
        days_until_date: daysUntil,
        priority_score: priority.score,
        priority_label: priority.label,
        priority_breakdown: {
          fit_score: fitScore,
          urgency_score: priority.urgencyScore,
          explanation: pe.notes || `Student-scheduled ${pe.event_type.replace("_", " ")}.`
        },
        conflict_flag: false,
        conflict_count: 1,
        prep_window: null,
        application_status: appStatus,
        linked_opportunity_id: pe.linked_opportunity_id || null,
        linked_opportunity: linkedOpp,
        notes: pe.notes || null,
        is_dismissed: Boolean(pe.is_dismissed),
        snoozed_until: pe.snoozed_until || null,
        is_snoozed: isSnoozed,
        deep_links: {
          practice_interview_url: `/student/practice-interview`,
          gd_practice_url: `/student/gd-practice`,
          roadmap_url: `/candidate`
        }
      });
    }

    // ─────────────────────────────────────────────────────────────
    // Pass 2: Conflict Detection & Aggregation
    // Compute date frequency across active events (non-dismissed)
    // ─────────────────────────────────────────────────────────────
    const activeDateCount = new Map<string, number>();
    for (const evt of rawEvents) {
      if (!evt.is_dismissed) {
        activeDateCount.set(evt.event_date, (activeDateCount.get(evt.event_date) || 0) + 1);
      }
    }

    for (const evt of rawEvents) {
      const count = activeDateCount.get(evt.event_date) || 1;
      if (count > 1) {
        evt.conflict_flag = true;
        evt.conflict_count = count;
      }
    }

    // Unified Notification Hook: If any active conflicts detected, alert student once
    const conflictDates = Array.from(activeDateCount.entries()).filter(([_, cnt]) => cnt > 1);
    if (conflictDates.length > 0) {
      const firstConf = conflictDates[0];
      await createNotification({
        studentId: candidateId,
        sourceFeature: "calendar",
        notificationType: "conflict_detected",
        title: `Schedule Conflict: ${firstConf[1]} Events on ${firstConf[0]}`,
        body: `You have ${firstConf[1]} overlapping deadlines/events scheduled on ${firstConf[0]}. Check your calendar to balance prep time.`,
        linkUrl: `/student/calendar`,
        priority: "normal"
      });
    }

    // ─────────────────────────────────────────────────────────────
    // Subsets: Full Calendar vs Next 7 Days Widget vs Retrospective
    // ─────────────────────────────────────────────────────────────
    // Full Calendar: non-dismissed (includes snoozed, per spec)
    const calendarEvents = rawEvents.filter(e => !e.is_dismissed);

    // Next 7 Days Widget: non-dismissed, non-snoozed, within [today, today + 7]
    const next7DaysEvents = rawEvents
      .filter(e => !e.is_dismissed && !e.is_snoozed && e.days_until_date >= 0 && e.days_until_date <= 7)
      .sort((a, b) => b.priority_score - a.priority_score);

    // Top recommended action for widget ("Do this first")
    const topRecommendedAction = next7DaysEvents.length > 0 ? next7DaysEvents[0] : null;

    // Today's Placement Digest (in-app fallback): today + next 2 days
    const digestEvents = rawEvents
      .filter(e => !e.is_dismissed && !e.is_snoozed && e.days_until_date >= 0 && e.days_until_date <= 2)
      .sort((a, b) => b.priority_score - a.priority_score);

    return NextResponse.json({
      success: true,
      candidate_id: candidateId,
      today: todayStr,
      timezone: "Asia/Kolkata (IST)",
      email_infra_status: "flagged_as_gap",
      email_gap_notice: "Cognalyze email delivery service is flagged as a future gap. In-app 'Today's Placement Digest' provides real-time proactive briefing.",
      total_events: calendarEvents.length,
      events: calendarEvents,
      next_7_days: next7DaysEvents,
      top_priority_item: topRecommendedAction,
      digest: {
        date: todayStr,
        count: digestEvents.length,
        events: digestEvents
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
