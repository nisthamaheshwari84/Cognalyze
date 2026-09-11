"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { CalendarEventItem } from "@/app/api/student/calendar/route";
import NotificationBell from "@/components/NotificationBell";
import AppNav from "@/components/AppNav";

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string; label: string; dot: string }> = {
  deadline: {
    bg: "rgba(16, 185, 129, 0.12)",
    text: "#10b981",
    border: "rgba(16, 185, 129, 0.3)",
    label: "Application Deadline",
    dot: "#10b981"
  },
  assessment: {
    bg: "rgba(245, 158, 11, 0.12)",
    text: "#f59e0b",
    border: "rgba(245, 158, 11, 0.3)",
    label: "Online Assessment",
    dot: "#f59e0b"
  },
  practice_session: {
    bg: "rgba(168, 85, 247, 0.12)",
    text: "#a855f7",
    border: "rgba(168, 85, 247, 0.3)",
    label: "Practice Session",
    dot: "#a855f7"
  },
  exam: {
    bg: "rgba(239, 68, 68, 0.12)",
    text: "#ef4444",
    border: "rgba(239, 68, 68, 0.3)",
    label: "Exam",
    dot: "#ef4444"
  },
  reminder: {
    bg: "rgba(59, 130, 246, 0.12)",
    text: "#3b82f6",
    border: "rgba(59, 130, 246, 0.3)",
    label: "Reminder",
    dot: "#3b82f6"
  },
  other: {
    bg: "rgba(148, 163, 184, 0.12)",
    text: "#94a3b8",
    border: "rgba(148, 163, 184, 0.3)",
    label: "Milestone",
    dot: "#94a3b8"
  }
};

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  Bookmarked: { bg: "rgba(148, 163, 184, 0.15)", text: "#94a3b8" },
  Applied: { bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa" },
  Interviewing: { bg: "rgba(168, 85, 247, 0.15)", text: "#c084fc" },
  Offer: { bg: "rgba(34, 197, 94, 0.15)", text: "#4ade80" },
  Rejected: { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171" }
};

export function getGoogleCalendarUrl(event: CalendarEventItem): string {
  const title = encodeURIComponent(event.title);
  const cleanDate = event.event_date.replace(/-/g, "");
  const d = new Date(event.event_date + "T00:00:00Z");
  d.setDate(d.getDate() + 1);
  const nextDate = d.toISOString().split("T")[0].replace(/-/g, "");
  const dates = `${cleanDate}/${nextDate}`;

  const detailsLines = [
    `🎯 Event: ${event.title}`,
    `📌 Type: ${event.event_type.replace("_", " ").toUpperCase()}`,
    `⚡ Priority Score: ${event.priority_score}/100 (${event.priority_label} Priority)`,
    event.application_status ? `📋 Live Application Status: ${event.application_status}` : "",
    event.prep_window ? `🛠️ Suggested Prep Sprint: ${event.prep_window.start_date} to ${event.prep_window.end_date}` : "",
    event.notes ? `📝 Notes: ${event.notes}` : "",
    `🔗 Cognalyze Season Calendar: http://localhost:3001/student/calendar`
  ].filter(Boolean);

  const details = encodeURIComponent(detailsLines.join("\n"));
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=Cognalyze+Placement+Season`;
}

export default function StudentCalendarPage() {
  const [candidateId, setCandidateId] = useState("student-demo");
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [next7Days, setNext7Days] = useState<CalendarEventItem[]>([]);
  const [topPriorityItem, setTopPriorityItem] = useState<CalendarEventItem | null>(null);
  const [digest, setDigest] = useState<any>(null);

  // View state
  const [viewMode, setViewMode] = useState<"month" | "weekly_load" | "priority" | "chronological">("month");
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 8, 1)); // Default to Sep 2026 for placement season
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Modals state
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [showGoogleSyncModal, setShowGoogleSyncModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("2026-09-15");
  const [newType, setNewType] = useState<"practice_session" | "exam" | "reminder" | "other">("practice_session");
  const [newSessionTarget, setNewSessionTarget] = useState<"interview" | "gd" | "general">("interview");
  const [newNotes, setNewNotes] = useState("");
  const [submittingModal, setSubmittingModal] = useState(false);

  // Status message
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("cognalyze_student_id") || "student-demo";
    setCandidateId(stored);
    loadCalendar(stored);
  }, []);

  const loadCalendar = async (cId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/calendar?candidateId=${cId}`);
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
        setNext7Days(data.next_7_days || []);
        setTopPriorityItem(data.top_priority_item || null);
        setDigest(data.digest || null);
      }
    } catch (err) {
      console.error("Failed to load calendar", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSnooze = async (eventId: string, daysToAdd = 3) => {
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysToAdd);
      const untilDateStr = targetDate.toISOString().split("T")[0];

      const res = await fetch(`/api/student/calendar/events/${eventId}/snooze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ until_date: untilDateStr })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Snoozed until ${untilDateStr}. Hidden from 7-day radar.`);
        loadCalendar(candidateId);
        if (selectedEvent?.id === eventId) {
          setSelectedEvent(prev => prev ? { ...prev, is_snoozed: true, snoozed_until: untilDateStr } : null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismiss = async (eventId: string) => {
    try {
      const res = await fetch(`/api/student/calendar/events/${eventId}/dismiss`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        showToast("Event dismissed. Preserved in retrospective log.");
        setSelectedEvent(null);
        loadCalendar(candidateId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePracticeSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate) return;

    setSubmittingModal(true);
    try {
      let notesText = newNotes;
      if (newSessionTarget === "interview") {
        notesText = `[Mock Interview Session] ${notesText}`.trim();
      } else if (newSessionTarget === "gd") {
        notesText = `[GD Practice Arena] ${notesText}`.trim();
      }

      const res = await fetch("/api/student/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: candidateId,
          title: newTitle,
          event_date: newDate,
          event_type: newType,
          notes: notesText
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Session scheduled successfully!");
        setShowPracticeModal(false);
        setNewTitle("");
        setNewNotes("");
        loadCalendar(candidateId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingModal(false);
    }
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = useMemo(() => {
    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      events: CalendarEventItem[];
      conflictCount: number;
      hasConflict: boolean;
      activePrepWindows: Array<{ oppTitle: string; note: string }>;
    }> = [];

    // Events mapped by date
    const dateEventsMap = new Map<string, CalendarEventItem[]>();
    for (const evt of events) {
      const list = dateEventsMap.get(evt.event_date) || [];
      list.push(evt);
      dateEventsMap.set(evt.event_date, list);
    }

    // Prep windows
    const prepWindows = events
      .filter(e => e.prep_window)
      .map(e => ({
        start: e.prep_window!.start_date,
        end: e.prep_window!.end_date,
        oppTitle: e.linked_opportunity?.title || e.title,
        note: e.prep_window!.note
      }));

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonthDate = new Date(year, month - 1, d);
      const dateStr = prevMonthDate.toISOString().split("T")[0];
      const evts = dateEventsMap.get(dateStr) || [];
      const activePreps = prepWindows.filter(p => dateStr >= p.start && dateStr <= p.end);
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        events: evts,
        conflictCount: evts.length,
        hasConflict: evts.length > 1,
        activePrepWindows: activePreps
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(Date.UTC(year, month, d));
      const dateStr = dateObj.toISOString().split("T")[0];
      const evts = dateEventsMap.get(dateStr) || [];
      const activePreps = prepWindows.filter(p => dateStr >= p.start && dateStr <= p.end);
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        events: evts,
        conflictCount: evts.length,
        hasConflict: evts.length > 1,
        activePrepWindows: activePreps
      });
    }

    // Next month padding to round up to 35 or 42 cells
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remainingCells; d++) {
      const nextMonthDate = new Date(year, month + 1, d);
      const dateStr = nextMonthDate.toISOString().split("T")[0];
      const evts = dateEventsMap.get(dateStr) || [];
      const activePreps = prepWindows.filter(p => dateStr >= p.start && dateStr <= p.end);
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        events: evts,
        conflictCount: evts.length,
        hasConflict: evts.length > 1,
        activePrepWindows: activePreps
      });
    }

    return days;
  }, [year, month, firstDayIndex, daysInMonth, daysInPrevMonth, events]);

  // Weekly load calculation
  const weeklyLoad = useMemo(() => {
    const weeks: Array<{
      label: string;
      range: string;
      eventsCount: number;
      deadlinesCount: number;
      assessmentsCount: number;
      practiceCount: number;
      intensity: "High" | "Moderate" | "Light";
    }> = [];

    for (let i = 0; i < calendarDays.length; i += 7) {
      const weekDays = calendarDays.slice(i, i + 7);
      const weekEvents = weekDays.flatMap(d => d.events);
      const startDay = weekDays[0].dateStr;
      const endDay = weekDays[6].dateStr;
      const count = weekEvents.length;

      let intensity: "High" | "Moderate" | "Light" = "Light";
      if (count >= 4) intensity = "High";
      else if (count >= 2) intensity = "Moderate";

      weeks.push({
        label: `Week ${Math.floor(i / 7) + 1}`,
        range: `${startDay.slice(5)} to ${endDay.slice(5)}`,
        eventsCount: count,
        deadlinesCount: weekEvents.filter(e => e.event_type === "deadline").length,
        assessmentsCount: weekEvents.filter(e => e.event_type === "assessment").length,
        practiceCount: weekEvents.filter(e => e.event_type === "practice_session").length,
        intensity
      });
    }
    return weeks;
  }, [calendarDays]);

  const sortedEvents = useMemo(() => {
    if (viewMode === "priority") {
      return [...events].sort((a, b) => b.priority_score - a.priority_score);
    }
    return [...events].sort((a, b) => a.event_date.localeCompare(b.event_date));
  }, [events, viewMode]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#090d16", color: "#f1f5f9", fontFamily: "Inter, sans-serif" }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            backgroundColor: "#1e293b",
            border: "1px solid #38bdf8",
            color: "#f8fafc",
            padding: "12px 20px",
            borderRadius: 10,
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            fontSize: 13,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 10
          }}
        >
          <span>✨</span>
          <span>{notification}</span>
        </div>
      )}

      <AppNav role="student" />

      {/* Top Header */}
      <header
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          backgroundColor: "rgba(15, 23, 42, 0.7)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
          padding: "16px 28px"
        }}
      >
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href="/student" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13 }}>
                ← Placement Copilot
              </Link>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
              <span style={{ color: "#38bdf8", fontSize: 13, fontWeight: 600 }}>Season Calendar</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 0", letterSpacing: "-0.5px" }}>
              🗓️ Placement Season Intelligence Calendar
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
              Conflict-aware timeline, smart prep windows, and priority ranking based on fit + urgency.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <NotificationBell candidateId={candidateId} />

            <Link
              href="/student/calendar/history"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                backgroundColor: "rgba(30, 41, 59, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#cbd5e1",
                fontSize: 13,
                textDecoration: "none",
                fontWeight: 500
              }}
            >
              📊 Retrospective Log
            </Link>

            <a
              href={`/api/student/calendar/export.ics?candidateId=${candidateId}`}
              download="cognalyze-placement-calendar.ics"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                backgroundColor: "rgba(56, 189, 248, 0.12)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                color: "#38bdf8",
                fontSize: 13,
                textDecoration: "none",
                fontWeight: 600
              }}
            >
              📥 Export .ICS
            </a>

            <button
              onClick={() => setShowGoogleSyncModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                backgroundColor: "rgba(66, 133, 244, 0.15)",
                border: "1px solid rgba(66, 133, 244, 0.4)",
                color: "#60a5fa",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <span>📅 Google Calendar Sync</span>
            </button>

            <button
              onClick={() => setShowPracticeModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                border: "none",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)"
              }}
            >
              ⚡ Schedule Practice Session
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>
        {/* Top Intelligence Grid: Today's Digest + Next 7 Days Priority Widget */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 20, marginBottom: 28 }}>
          {/* In-App Today's Placement Digest */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              padding: 20,
              boxShadow: "0 8px 30px rgba(0,0,0,0.3)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>☕</span>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Today&apos;s Placement Digest</h2>
              </div>
              <span
                style={{
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 10,
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  color: "#fbbf24",
                  border: "1px solid rgba(245, 158, 11, 0.3)"
                }}
              >
                In-App Briefing
              </span>
            </div>

            <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 14px", lineHeight: 1.5 }}>
              Proactive snapshot for today & upcoming 48 hours. Non-snoozed events ranked by priority.
            </p>

            {digest?.events && digest.events.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {digest.events.slice(0, 3).map((evt: CalendarEventItem) => (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      backgroundColor: "rgba(30, 41, 59, 0.6)",
                      border: `1px solid ${EVENT_TYPE_COLORS[evt.event_type]?.border || "rgba(255,255,255,0.1)"}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "transform 0.15s ease"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>
                        {evt.title}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        📅 {evt.event_date} ({evt.days_until_date === 0 ? "Today" : `${evt.days_until_date}d away`}) • {EVENT_TYPE_COLORS[evt.event_type]?.label}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 6,
                          backgroundColor: evt.priority_score >= 80 ? "rgba(239, 68, 68, 0.2)" : "rgba(56, 189, 248, 0.2)",
                          color: evt.priority_score >= 80 ? "#f87171" : "#38bdf8"
                        }}
                      >
                        {evt.priority_score} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "16px", textAlign: "center", backgroundColor: "rgba(30, 41, 59, 0.3)", borderRadius: 8, color: "#94a3b8", fontSize: 13 }}>
                🌴 No urgent deadlines or assessments in the next 48 hours. Excellent window for mock interviews!
              </div>
            )}

            {/* Email Infra Gap Notice */}
            <div
              style={{
                marginTop: 14,
                padding: "8px 12px",
                borderRadius: 8,
                backgroundColor: "rgba(100, 116, 139, 0.1)",
                border: "1px dashed rgba(148, 163, 184, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
                color: "#94a3b8"
              }}
            >
              <span>ℹ️</span>
              <span>
                <strong>System Note:</strong> External SMTP email delivery flagged as future gap. Real-time in-app briefing enabled.
              </span>
            </div>
          </div>

          {/* Next 7 Days Priority Radar */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              padding: 20,
              boxShadow: "0 8px 30px rgba(0,0,0,0.3)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🎯</span>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Next 7 Days — Priority Radar</h2>
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                Sorted by Fit × Urgency
              </span>
            </div>

            {/* Top single most urgent item ("Do this first") */}
            {topPriorityItem ? (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  marginBottom: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        backgroundColor: "#ef4444",
                        color: "#ffffff",
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "2px 6px",
                        borderRadius: 4,
                        letterSpacing: 0.5
                      }}
                    >
                      DO THIS FIRST
                    </span>
                    <span style={{ fontSize: 11, color: "#fca5a5" }}>
                      Highest fit + impending deadline
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", marginTop: 4 }}>
                    {topPriorityItem.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 2 }}>
                    Due: {topPriorityItem.event_date} ({topPriorityItem.days_until_date} days remaining)
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#f87171" }}>
                    {topPriorityItem.priority_score} pts
                  </span>
                  {topPriorityItem.deep_links.project_suggestions_url && (
                    <Link
                      href={topPriorityItem.deep_links.project_suggestions_url}
                      style={{
                        fontSize: 11,
                        padding: "4px 8px",
                        borderRadius: 6,
                        backgroundColor: "#38bdf8",
                        color: "#0f172a",
                        fontWeight: 700,
                        textDecoration: "none"
                      }}
                    >
                      Start Prep →
                    </Link>
                  )}
                </div>
              </div>
            ) : null}

            {/* Remaining items in 7 days */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto" }}>
              {next7Days.slice(topPriorityItem ? 1 : 0).map(evt => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    backgroundColor: "rgba(30, 41, 59, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ maxWidth: "70%" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {evt.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      {evt.event_date} • {evt.days_until_date}d left
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8" }}>
                      {evt.priority_score}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSnooze(evt.id, 3);
                      }}
                      title="Snooze 3 days"
                      style={{
                        border: "none",
                        background: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        fontSize: 13
                      }}
                    >
                      ⏰
                    </button>
                  </div>
                </div>
              ))}

              {next7Days.length === 0 && (
                <div style={{ textAlign: "center", padding: "16px", color: "#64748b", fontSize: 13 }}>
                  No imminent items in the 7-day window. All caught up!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Switcher & Month Navigation Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 20,
            padding: "12px 18px",
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            borderRadius: 12,
            border: "1px solid rgba(255, 255, 255, 0.08)"
          }}
        >
          {/* Month Stepper */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              style={{
                backgroundColor: "rgba(30, 41, 59, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#f8fafc",
                borderRadius: 8,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: 14
              }}
            >
              ‹
            </button>
            <div style={{ fontSize: 18, fontWeight: 700, minWidth: 170, textAlign: "center" }}>
              {monthName} {year}
            </div>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              style={{
                backgroundColor: "rgba(30, 41, 59, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#f8fafc",
                borderRadius: 8,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: 14
              }}
            >
              ›
            </button>
            <button
              onClick={() => setCurrentDate(new Date(2026, 8, 1))}
              style={{
                backgroundColor: "rgba(56, 189, 248, 0.1)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                color: "#38bdf8",
                borderRadius: 6,
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600
              }}
            >
              Sep 2026 Season
            </button>
          </div>

          {/* View Mode Buttons */}
          <div style={{ display: "flex", gap: 6, backgroundColor: "rgba(30, 41, 59, 0.6)", padding: 4, borderRadius: 8, overflowX: "auto", maxWidth: "100%" }}>
            {[
              { id: "month", label: "📅 Month Grid" },
              { id: "weekly_load", label: "📊 Weekly Load" },
              { id: "priority", label: "🔥 Priority Order" },
              { id: "chronological", label: "⏳ Timeline" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as any)}
                style={{
                  backgroundColor: viewMode === tab.id ? "#38bdf8" : "transparent",
                  color: viewMode === tab.id ? "#090d16" : "#94a3b8",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: viewMode === tab.id ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 16, fontSize: 12, color: "#94a3b8" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#10b981" }}></span>
            <span>Application Deadline</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#f59e0b" }}></span>
            <span>Online Assessment</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#a855f7" }}></span>
            <span>Practice Session</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#ef4444" }}></span>
            <span>Exam</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 12, height: 12, border: "1px dashed rgba(56, 189, 248, 0.6)", backgroundColor: "rgba(56, 189, 248, 0.15)", borderRadius: 3 }}></span>
            <span>Prep Window Range</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13 }}>⚠️</span>
            <span style={{ color: "#fbbf24" }}>Conflict Detected</span>
          </div>
        </div>

        {/* ─── VIEW 1: MONTH GRID ─── */}
        {viewMode === "month" && (
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              overflowX: "auto",
              boxShadow: "0 10px 40px rgba(0,0,0,0.4)"
            }}
          >
            <div style={{ minWidth: 680 }}>
              {/* Days of Week Header */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", backgroundColor: "rgba(30, 41, 59, 0.7)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(dow => (
                <div key={dow} style={{ padding: "12px 8px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>
                  {dow}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
              {calendarDays.map((cell, idx) => {
                const isSelected = selectedDate === cell.dateStr;
                const hasPrep = cell.activePrepWindows.length > 0;

                return (
                  <div
                    key={`${cell.dateStr}-${idx}`}
                    onClick={() => {
                      setSelectedDate(cell.dateStr);
                      if (cell.events.length > 0) {
                        setSelectedEvent(cell.events[0]);
                      }
                    }}
                    style={{
                      minHeight: 115,
                      padding: 8,
                      backgroundColor: isSelected
                        ? "rgba(56, 189, 248, 0.12)"
                        : cell.isCurrentMonth
                        ? hasPrep
                          ? "rgba(14, 165, 233, 0.07)" // Lighter shade block for prep window
                          : "rgba(15, 23, 42, 0.9)"
                        : "rgba(10, 15, 26, 0.95)",
                      border: isSelected
                        ? "1px solid #38bdf8"
                        : hasPrep
                        ? "1px dashed rgba(56, 189, 248, 0.3)"
                        : "1px solid rgba(255, 255, 255, 0.03)",
                      display: "flex",
                      flexDirection: "column",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      position: "relative"
                    }}
                  >
                    {/* Day Number + Conflict indicator */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: cell.isCurrentMonth ? "#f1f5f9" : "#475569",
                          borderRadius: "50%",
                          width: 22,
                          height: 22,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isSelected ? "#38bdf8" : "transparent"
                        }}
                      >
                        {cell.dayNumber}
                      </span>

                      {/* Conflict Flag Indicator */}
                      {cell.hasConflict && (
                        <span
                          title={`${cell.conflictCount} events on this day — plan carefully!`}
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "1px 5px",
                            borderRadius: 4,
                            backgroundColor: "rgba(245, 158, 11, 0.2)",
                            color: "#fbbf24",
                            border: "1px solid rgba(245, 158, 11, 0.4)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2
                          }}
                        >
                          ⚠️ {cell.conflictCount}
                        </span>
                      )}
                    </div>

                    {/* Prep Window Indicator Banner */}
                    {hasPrep && (
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          color: "#38bdf8",
                          backgroundColor: "rgba(56, 189, 248, 0.15)",
                          borderRadius: 3,
                          padding: "2px 4px",
                          marginBottom: 4,
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          whiteSpace: "nowrap"
                        }}
                      >
                        ⚡ Prep: {cell.activePrepWindows[0].oppTitle.slice(0, 14)}...
                      </div>
                    )}

                    {/* Events inside this day */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, overflowY: "hidden" }}>
                      {cell.events.map(ev => {
                        const styleConfig = EVENT_TYPE_COLORS[ev.event_type] || EVENT_TYPE_COLORS.other;
                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(ev);
                              setSelectedDate(cell.dateStr);
                            }}
                            title={`${ev.title} (${ev.priority_score} pts priority)`}
                            style={{
                              fontSize: 11,
                              padding: "2px 6px",
                              borderRadius: 4,
                              backgroundColor: styleConfig.bg,
                              border: `1px solid ${styleConfig.border}`,
                              color: styleConfig.text,
                              fontWeight: 600,
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              display: "flex",
                              alignItems: "center",
                              gap: 4
                            }}
                          >
                            <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: styleConfig.dot, flexShrink: 0 }}></span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        )}

        {/* ─── VIEW 2: WEEKLY LOAD VIEW ─── */}
        {viewMode === "weekly_load" && (
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              padding: 24
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Weekly Load & Cognitive Fatigue Radar</h3>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 24px" }}>
              Visualizes placement season workload across upcoming weeks so you can anticipate heavy assessment sprints.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {weeklyLoad.map((w, idx) => {
                const barPercent = Math.min(100, Math.max(10, w.eventsCount * 22));
                const barColor = w.intensity === "High" ? "#f87171" : w.intensity === "Moderate" ? "#fbbf24" : "#38bdf8";

                return (
                  <div
                    key={idx}
                    style={{
                      padding: "16px 20px",
                      borderRadius: 10,
                      backgroundColor: "rgba(30, 41, 59, 0.5)",
                      border: "1px solid rgba(255, 255, 255, 0.05)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#ffffff" }}>{w.label}</span>
                        <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 10 }}>({w.range})</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "#cbd5e1" }}>
                          {w.eventsCount} events ({w.deadlinesCount} deadlines, {w.assessmentsCount} tests, {w.practiceCount} practice)
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 6,
                            backgroundColor: w.intensity === "High" ? "rgba(239, 68, 68, 0.2)" : w.intensity === "Moderate" ? "rgba(245, 158, 11, 0.2)" : "rgba(56, 189, 248, 0.2)",
                            color: barColor
                          }}
                        >
                          {w.intensity} Load
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: "100%", height: 10, backgroundColor: "rgba(15, 23, 42, 0.8)", borderRadius: 5, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${barPercent}%`,
                          height: "100%",
                          backgroundColor: barColor,
                          borderRadius: 5,
                          transition: "width 0.4s ease"
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── VIEW 3 & 4: PRIORITY & CHRONOLOGICAL LISTS ─── */}
        {(viewMode === "priority" || viewMode === "chronological") && (
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              padding: 24
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                {viewMode === "priority" ? "🔥 Placement Events Ranked by Priority Score" : "⏳ Chronological Placement Season Timeline"}
              </h3>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Total Active: {sortedEvents.length} events
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sortedEvents.map(evt => {
                const styleConfig = EVENT_TYPE_COLORS[evt.event_type] || EVENT_TYPE_COLORS.other;
                const stageConfig = evt.application_status ? STAGE_COLORS[evt.application_status] : null;

                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    style={{
                      padding: "16px 20px",
                      borderRadius: 10,
                      backgroundColor: "rgba(30, 41, 59, 0.5)",
                      border: `1px solid ${styleConfig.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "transform 0.15s ease"
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 6,
                            backgroundColor: styleConfig.bg,
                            color: styleConfig.text
                          }}
                        >
                          {styleConfig.label}
                        </span>

                        {stageConfig && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: 6,
                              backgroundColor: stageConfig.bg,
                              color: stageConfig.text
                            }}
                          >
                            Live Status: {evt.application_status}
                          </span>
                        )}

                        {evt.conflict_flag && (
                          <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 600 }}>
                            ⚠️ Date Conflict ({evt.conflict_count} on {evt.event_date})
                          </span>
                        )}

                        {evt.is_snoozed && (
                          <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>
                            (Snoozed until {evt.snoozed_until})
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", marginBottom: 2 }}>
                        {evt.title}
                      </div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>
                        📅 {evt.event_date} • {evt.days_until_date} days remaining {evt.prep_window && `• ⚡ Prep sprint active (${evt.prep_window.days}d)`}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: evt.priority_score >= 80 ? "#f87171" : "#38bdf8" }}>
                          {evt.priority_score} pts
                        </div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>
                          {evt.priority_label} Priority
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSnooze(evt.id, 3);
                          }}
                          style={{
                            backgroundColor: "rgba(100, 116, 139, 0.2)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            color: "#cbd5e1",
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            cursor: "pointer"
                          }}
                        >
                          Snooze
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(evt.id);
                          }}
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.15)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#f87171",
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            cursor: "pointer"
                          }}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── EVENT INSPECTOR / DETAILS DRAWER ─── */}
        {selectedEvent && (
          <div
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              width: 440,
              maxWidth: "calc(100vw - 48px)",
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              zIndex: 100
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 6,
                  backgroundColor: EVENT_TYPE_COLORS[selectedEvent.event_type]?.bg,
                  color: EVENT_TYPE_COLORS[selectedEvent.event_type]?.text
                }}
              >
                {EVENT_TYPE_COLORS[selectedEvent.event_type]?.label}
              </span>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 16, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "#ffffff" }}>
              {selectedEvent.title}
            </h3>

            <div style={{ fontSize: 12, color: "#38bdf8", marginBottom: 12 }}>
              📅 {selectedEvent.event_date} ({selectedEvent.days_until_date >= 0 ? `${selectedEvent.days_until_date} days remaining` : "Past due"})
            </div>

            {/* Conflict Warning Box */}
            {selectedEvent.conflict_flag && (
              <div
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  border: "1px solid rgba(245, 158, 11, 0.4)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginBottom: 12,
                  fontSize: 12,
                  color: "#fbbf24",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <span>⚠️</span>
                <span>
                  <strong>Conflict Alert:</strong> {selectedEvent.conflict_count} events on this day — plan carefully!
                </span>
              </div>
            )}

            {/* Prep Window Box */}
            {selectedEvent.prep_window && (
              <div
                style={{
                  backgroundColor: "rgba(56, 189, 248, 0.1)",
                  border: "1px dashed rgba(56, 189, 248, 0.4)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginBottom: 12,
                  fontSize: 12,
                  color: "#38bdf8"
                }}
              >
                ⚡ <strong>Suggested Prep Window:</strong> {selectedEvent.prep_window.start_date} to {selectedEvent.prep_window.end_date} ({selectedEvent.prep_window.days} days). {selectedEvent.prep_window.note}
              </div>
            )}

            {/* Live Application Status */}
            {selectedEvent.application_status && (
              <div style={{ marginBottom: 12, fontSize: 12, color: "#cbd5e1" }}>
                <strong>Application Status: </strong>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 6,
                    backgroundColor: STAGE_COLORS[selectedEvent.application_status]?.bg,
                    color: STAGE_COLORS[selectedEvent.application_status]?.text,
                    fontWeight: 600
                  }}
                >
                  {selectedEvent.application_status}
                </span>
                <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 6 }}>(live from Application Tracker)</span>
              </div>
            )}

            {/* Priority Score Breakdown */}
            <div
              style={{
                backgroundColor: "rgba(30, 41, 59, 0.6)",
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 16,
                fontSize: 12,
                color: "#cbd5e1"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <strong>Priority Score:</strong>
                <span style={{ color: "#38bdf8", fontWeight: 700 }}>{selectedEvent.priority_score} / 100</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>
                {selectedEvent.priority_breakdown.explanation}
              </p>
            </div>

            {/* Action Links (Confirmed Step 0 Routes + Google Calendar) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {/* Direct 1-Click Google Calendar Sync */}
              <a
                href={getGoogleCalendarUrl(selectedEvent)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, rgba(66, 133, 244, 0.25) 0%, rgba(52, 168, 83, 0.2) 50%, rgba(251, 188, 5, 0.2) 100%)",
                  border: "1px solid rgba(66, 133, 244, 0.6)",
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(66, 133, 244, 0.2)"
                }}
              >
                <span style={{ fontSize: 14 }}>📅</span>
                <span>Add to Google Calendar (1-Click)</span>
                <span style={{ fontSize: 11, opacity: 0.8 }}>↗</span>
              </a>

              {selectedEvent.deep_links.project_suggestions_url && (
                <Link
                  href={selectedEvent.deep_links.project_suggestions_url}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "8px",
                    borderRadius: 8,
                    backgroundColor: "rgba(56, 189, 248, 0.15)",
                    border: "1px solid rgba(56, 189, 248, 0.4)",
                    color: "#38bdf8",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none"
                  }}
                >
                  💡 View Project Blueprint & Suggestions →
                </Link>
              )}

              {selectedEvent.deep_links.roadmap_url && (
                <Link
                  href={selectedEvent.deep_links.roadmap_url}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "8px",
                    borderRadius: 8,
                    backgroundColor: "rgba(99, 102, 241, 0.15)",
                    border: "1px solid rgba(99, 102, 241, 0.4)",
                    color: "#818cf8",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none"
                  }}
                >
                  🗺️ Skill-Gap Roadmap →
                </Link>
              )}

              {selectedEvent.deep_links.practice_interview_url && (
                <Link
                  href={selectedEvent.deep_links.practice_interview_url}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "8px",
                    borderRadius: 8,
                    backgroundColor: "rgba(168, 85, 247, 0.15)",
                    border: "1px solid rgba(168, 85, 247, 0.4)",
                    color: "#c084fc",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none"
                  }}
                >
                  🎙️ Practice Mock Interview →
                </Link>
              )}

              {selectedEvent.deep_links.gd_practice_url && (
                <Link
                  href={selectedEvent.deep_links.gd_practice_url}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "8px",
                    borderRadius: 8,
                    backgroundColor: "rgba(236, 72, 153, 0.15)",
                    border: "1px solid rgba(236, 72, 153, 0.4)",
                    color: "#f472b6",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none"
                  }}
                >
                  👥 Group Discussion Practice Arena →
                </Link>
              )}
            </div>

            {/* Snooze and Dismiss Controls */}
            <div style={{ display: "flex", gap: 8, borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: 12 }}>
              <button
                onClick={() => handleSnooze(selectedEvent.id, 3)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: 6,
                  backgroundColor: "rgba(100, 116, 139, 0.2)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#cbd5e1",
                  fontSize: 12,
                  cursor: "pointer"
                }}
              >
                ⏰ Snooze 3 Days
              </button>

              <button
                onClick={() => handleDismiss(selectedEvent.id)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: 6,
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#f87171",
                  fontSize: 12,
                  cursor: "pointer"
                }}
              >
                🗑️ Dismiss Event
              </button>
            </div>
          </div>
        )}

        {/* ─── SCHEDULE PRACTICE SESSION MODAL ─── */}
        {showPracticeModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
              padding: 20
            }}
          >
            <div
              style={{
                width: 480,
                backgroundColor: "#0f172a",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 25px 60px rgba(0,0,0,0.8)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>⚡ Schedule Placement Practice Session</h3>
                <button
                  onClick={() => setShowPracticeModal(false)}
                  style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 16, cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreatePracticeSession}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                    Session Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FAANG SDE-1 System Design Drill"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      backgroundColor: "rgba(30, 41, 59, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                      fontSize: 13
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        backgroundColor: "rgba(30, 41, 59, 0.8)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#ffffff",
                        fontSize: 13
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                      Event Type
                    </label>
                    <select
                      value={newType}
                      onChange={e => setNewType(e.target.value as any)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        backgroundColor: "rgba(30, 41, 59, 0.8)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#ffffff",
                        fontSize: 13
                      }}
                    >
                      <option value="practice_session">Practice Session</option>
                      <option value="exam">Exam / Coding Test</option>
                      <option value="reminder">Reminder</option>
                      <option value="other">Other Milestone</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                    Direct Tool Integration (Jump straight into session)
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { id: "interview", label: "🎙️ Mock Interview" },
                      { id: "gd", label: "👥 GD Arena" },
                      { id: "general", label: "📝 General Prep" }
                    ].map(target => (
                      <button
                        type="button"
                        key={target.id}
                        onClick={() => setNewSessionTarget(target.id as any)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 6,
                          border: newSessionTarget === target.id ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.1)",
                          backgroundColor: newSessionTarget === target.id ? "rgba(56, 189, 248, 0.15)" : "rgba(30, 41, 59, 0.5)",
                          color: newSessionTarget === target.id ? "#38bdf8" : "#94a3b8",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        {target.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                    Notes & Focus Areas
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Focus: distributed caching, CAP theorem, and binary tree traversal under 25 mins"
                    value={newNotes}
                    onChange={e => setNewNotes(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      backgroundColor: "rgba(30, 41, 59, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                      fontSize: 13,
                      resize: "vertical"
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowPracticeModal(false)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      backgroundColor: "transparent",
                      color: "#cbd5e1",
                      fontSize: 13,
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingModal}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 8,
                      border: "none",
                      background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    {submittingModal ? "Scheduling..." : "Confirm & Add to Calendar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── GOOGLE CALENDAR SYNC MODAL ─── */}
        {showGoogleSyncModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 250,
              padding: 20
            }}
          >
            <div
              style={{
                width: 520,
                backgroundColor: "#0f172a",
                border: "1px solid rgba(66, 133, 244, 0.4)",
                borderRadius: 16,
                padding: 26,
                boxShadow: "0 25px 60px rgba(0,0,0,0.85)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>📅</span>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#ffffff" }}>
                    Google Calendar Integration
                  </h3>
                </div>
                <button
                  onClick={() => setShowGoogleSyncModal(false)}
                  style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 18, cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 20px", lineHeight: 1.5 }}>
                Sync all your placement deadlines, online assessments, and practice sessions directly with your Google Calendar on web and mobile devices.
              </p>

              {/* Method 1: Direct 1-Click Sync */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: 10,
                  backgroundColor: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  marginBottom: 14
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#60a5fa" }}>Method 1: 1-Click Event Sync</span>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, backgroundColor: "rgba(59, 130, 246, 0.2)", color: "#93c5fd" }}>Easiest</span>
                </div>
                <p style={{ fontSize: 12, color: "#cbd5e1", margin: 0, lineHeight: 1.4 }}>
                  Click on any event on your Month Grid or Next 7 Days Radar, then click <strong>&quot;Add to Google Calendar (1-Click)&quot;</strong> in the inspector drawer. It opens Google Calendar with all dates, prep notes, and links pre-filled.
                </p>
              </div>

              {/* Method 2: Full Season ICS Sync */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: 10,
                  backgroundColor: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  marginBottom: 20
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#34d399" }}>Method 2: Full Season Calendar Sync (.ICS)</span>
                </div>
                <ol style={{ fontSize: 12, color: "#cbd5e1", margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                  <li>Download your personalized season calendar file:</li>
                  <div style={{ margin: "8px 0" }}>
                    <a
                      href={`/api/student/calendar/export.ics?candidateId=${candidateId}`}
                      download="cognalyze-placement-calendar.ics"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        borderRadius: 6,
                        backgroundColor: "#38bdf8",
                        color: "#0f172a",
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: "none"
                      }}
                    >
                      📥 Download cognalyze-placement-calendar.ics
                    </a>
                  </div>
                  <li>Open Google Calendar Settings → <strong>Import &amp; Export</strong></li>
                  <li>Select the downloaded file to import all deadlines with alarms.</li>
                </ol>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <a
                  href="https://calendar.google.com/calendar/r/settings/export"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    color: "#60a5fa",
                    textDecoration: "none",
                    fontWeight: 600
                  }}
                >
                  Open Google Calendar Web Settings ↗
                </a>
                <button
                  type="button"
                  onClick={() => setShowGoogleSyncModal(false)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: "rgba(255, 255, 255, 0.1)",
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
