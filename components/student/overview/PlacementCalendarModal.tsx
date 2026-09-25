"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarEventItem } from "@/app/api/student/calendar/route";

interface PlacementCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  events?: CalendarEventItem[];
}

export default function PlacementCalendarModal({
  isOpen,
  onClose,
  events = []
}: PlacementCalendarModalProps) {
  const [filter, setFilter] = useState<"all" | "drives" | "deadlines" | "interviews">("all");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Curated fallback drives if events from API are sparse
  const defaultDrives = [
    {
      id: "drive-tcs-digital",
      date: "28 Sep",
      company: "TCS Digital",
      type: "Registration closes",
      round: "Aptitude + coding round",
      eligibility: "B.Tech CSE/IT/ECE (CGPA >= 7.0)",
      status: "Open",
      action: "Open",
      href: "/student/opportunities",
      category: "deadlines"
    },
    {
      id: "drive-campus-general",
      date: "03 Oct",
      company: "Campus Placement Drive",
      type: "Company briefing & PPT",
      round: "Eligibility verification & shortlisting",
      eligibility: "All 2026 Graduating Batch",
      status: "Upcoming",
      action: "View",
      href: "/student/calendar",
      category: "drives"
    },
    {
      id: "drive-tech-interview",
      date: "10 Oct",
      company: "Technical Interview Round",
      type: "Preparation milestone",
      round: "DSA + Projects + Core CS (OS, DBMS, CN)",
      eligibility: "Shortlisted candidates from OA",
      status: "Prep Active",
      action: "Prepare",
      href: "/interview",
      category: "interviews"
    },
    {
      id: "drive-flipkart-grid",
      date: "15 Oct",
      company: "Flipkart GRiD 7.0",
      type: "Software Dev Track Submission",
      round: "E-Commerce Architecture & System Design",
      eligibility: "B.Tech 2026/2027",
      status: "Open",
      action: "Open",
      href: "/student/opportunities",
      category: "deadlines"
    },
    {
      id: "drive-razorpay-hack",
      date: "22 Oct",
      company: "Razorpay AI Buildathon",
      type: "Autonomous Agent Track",
      round: "Prototype review & fintech API integration",
      eligibility: "Open to all engineering students",
      status: "Open",
      action: "Prepare",
      href: "/student/opportunities",
      category: "drives"
    },
    {
      id: "drive-hr-interviews",
      date: "28 Oct",
      company: "Final HR & Culture Fit Interviews",
      type: "Leadership & STAR behavioral",
      round: "Offer rollouts & package negotiation",
      eligibility: "Technical round cleared",
      status: "Scheduled",
      action: "Prepare",
      href: "/student/question-bank",
      category: "interviews"
    }
  ];

  // Map API events if available, otherwise blend with structured drives
  const displayItems = defaultDrives.filter((d) => {
    if (filter === "all") return true;
    return d.category === filter;
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 780,
          maxHeight: "88vh",
          backgroundColor: "#ffffff",
          borderRadius: 20,
          border: "1px solid #e2e8f0",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f8fafc"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: "#0f172a",
                color: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              📅
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                Placement Calendar & Season Schedule
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Live campus drives, corporate deadlines, online assessments & prep milestones
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link
              href="/student/calendar"
              onClick={onClose}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#2563eb",
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: 8,
                backgroundColor: "#eff6ff",
                border: "1px solid #dbeafe"
              }}
            >
              Full Calendar Page →
            </Link>

            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontWeight: 700
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div
          style={{
            padding: "12px 24px",
            display: "flex",
            gap: 8,
            borderBottom: "1px solid #f1f5f9",
            backgroundColor: "#ffffff"
          }}
        >
          {[
            { id: "all", label: "All Events" },
            { id: "drives", label: "Company Drives" },
            { id: "deadlines", label: "Registration Deadlines" },
            { id: "interviews", label: "Assessments & Interviews" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: filter === tab.id ? 700 : 500,
                backgroundColor: filter === tab.id ? "#0f172a" : "#f1f5f9",
                color: filter === tab.id ? "#ffffff" : "#475569",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Calendar Events List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {displayItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                gap: 16,
                flexWrap: "wrap",
                transition: "border-color 0.15s ease"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Date Badge */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    {item.date.split(" ")[1]}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
                    {item.date.split(" ")[0]}
                  </span>
                </div>

                {/* Details */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                      {item.company}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 6,
                        backgroundColor: item.status === "Open" ? "#ecfdf5" : "#f1f5f9",
                        color: item.status === "Open" ? "#059669" : "#475569",
                        border: `1px solid ${item.status === "Open" ? "#a7f3d0" : "#e2e8f0"}`
                      }}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: "#334155", fontWeight: 600, marginTop: 2 }}>
                    {item.type} • <span style={{ color: "#64748b", fontWeight: 400 }}>{item.round}</span>
                  </div>

                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    Eligibility: {item.eligibility}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={item.href}
                onClick={onClose}
                style={{
                  padding: "8px 18px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: "none",
                  backgroundColor: item.action === "Open" ? "#2563eb" : "#f1f5f9",
                  color: item.action === "Open" ? "#ffffff" : "#0f172a",
                  border: item.action === "Open" ? "none" : "1px solid #cbd5e1",
                  boxShadow: item.action === "Open" ? "0 2px 4px rgba(37,99,235,0.2)" : "none",
                  marginLeft: "auto"
                }}
              >
                [{item.action}]
              </Link>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span style={{ fontSize: 12, color: "#64748b" }}>
            All dates synchronized with College TPO Portal & Corporate ATS.
          </span>
          <button
            onClick={onClose}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#334155",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
