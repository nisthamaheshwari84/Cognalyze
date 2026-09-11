import { NextResponse } from "next/server";
import {
  getApplicationsStore,
  getPersonalEvents
} from "@/lib/placement-store";

function formatIcsDate(dateStr: string): string {
  // Converts YYYY-MM-DD to YYYYMMDD for all-day events
  return dateStr.replace(/[^0-9]/g, "").slice(0, 8);
}

function escapeIcsText(str: string): string {
  return (str || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function generateUid(id: string): string {
  return `${id.replace(/[^a-zA-Z0-9-]/g, "")}@cognalyze.ai`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-demo";

    // 1. Fetch applications and personal events
    const applications = await getApplicationsStore(candidateId);
    const personalEvents = await getPersonalEvents(candidateId);

    const nowTimestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

    const eventsList: Array<{
      uid: string;
      title: string;
      dateStr: string;
      description: string;
      status: string;
    }> = [];

    // Application deadlines (exclude dismissed, include snoozed)
    for (const app of applications) {
      const opp = app.opportunity;
      if (!opp) continue;
      const deadline = opp.deadline || opp.extracted_context?.deadline_if_mentioned;
      if (!deadline) continue;

      const dateOnly = deadline.split("T")[0];
      eventsList.push({
        uid: generateUid(`opp-deadline-${opp.id}`),
        title: `[Deadline] ${opp.title}`,
        dateStr: dateOnly,
        description: `Application Deadline for ${opp.title} (${opp.organizer}). Current status: ${app.stage}. Tier: ${opp.tier}. Perks: ${(opp.extracted_context?.perks || []).join(", ") || "Standard PPI"}.`,
        status: "CONFIRMED"
      });

      // Assessment dates
      const adDates = opp.extracted_context?.assessment_dates;
      if (Array.isArray(adDates)) {
        adDates.forEach((ad: any, idx: number) => {
          if (ad.date_if_mentioned) {
            const adDateOnly = ad.date_if_mentioned.split("T")[0];
            eventsList.push({
              uid: generateUid(`opp-assessment-${opp.id}-${idx}`),
              title: `[Assessment] ${opp.organizer}: ${ad.label}`,
              dateStr: adDateOnly,
              description: `Online Assessment milestone for ${opp.title}. Stage: ${app.stage}.`,
              status: "CONFIRMED"
            });
          }
        });
      }
    }

    // Personal events (exclude dismissed events, include snoozed events per spec)
    for (const pe of personalEvents) {
      if (pe.is_dismissed) continue; // EXCLUDE dismissed events per spec
      const peDateOnly = pe.event_date.split("T")[0];
      eventsList.push({
        uid: generateUid(pe.id),
        title: `[${pe.event_type.replace("_", " ").toUpperCase()}] ${pe.title}`,
        dateStr: peDateOnly,
        description: pe.notes || `Scheduled ${pe.event_type} on Cognalyze.`,
        status: "CONFIRMED"
      });
    }

    // Build RFC 5545 compliant iCalendar string
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Cognalyze//Placement Season Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Cognalyze Placement Season Calendar",
      "X-WR-TIMEZONE:Asia/Kolkata"
    ];

    for (const ev of eventsList) {
      const dtDate = formatIcsDate(ev.dateStr);
      // Next day for all-day DTEND
      const nextDay = new Date(ev.dateStr + "T00:00:00Z");
      nextDay.setDate(nextDay.getDate() + 1);
      const dtNextDate = formatIcsDate(nextDay.toISOString().split("T")[0]);

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${ev.uid}`);
      lines.push(`DTSTAMP:${nowTimestamp}`);
      lines.push(`DTSTART;VALUE=DATE:${dtDate}`);
      lines.push(`DTEND;VALUE=DATE:${dtNextDate}`);
      lines.push(`SUMMARY:${escapeIcsText(ev.title)}`);
      lines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`);
      lines.push(`STATUS:${ev.status}`);
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");

    const icsContent = lines.join("\r\n") + "\r\n";

    return new Response(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="cognalyze-placement-calendar.ics"`,
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
