"use client";

import React, { useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import ContextualJourneyBanner from "@/components/student/ContextualJourneyBanner";

interface ToolCard {
  title: string;
  description: string;
  href: string;
  icon: string;
  badge?: string;
  tagColor?: string;
  actionText?: string;
}

interface ToolCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
  tools: ToolCard[];
}

export default function StudentResourcesPage() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");

  const categories: ToolCategory[] = [
    {
      id: "interview",
      title: "Interview Hub",
      description: "Comprehensive technical, systems design, voice, and behavioral interview simulators.",
      icon: "🎙️",
      accentColor: "#ec4899",
      tools: [
        {
          title: "FAANG Mock Interview",
          description: "Interactive AI face & voice technical interview with 7-axis rubric scoring and hiring signals.",
          href: "/interview",
          icon: "🎙️",
          badge: "Voice & Face AI",
          tagColor: "#ec4899",
          actionText: "Launch Interview"
        },
        {
          title: "Opportunity Practice Interview",
          description: "Targeted practice session tailored specifically to the requirements of any saved opportunity.",
          href: "/student/practice-interview",
          icon: "🎤",
          badge: "Opportunity-Grounded",
          tagColor: "#38bdf8",
          actionText: "Practice Opportunity"
        },
        {
          title: "AI Interview Prep & Behavioral",
          description: "Diagnostic behavioral answer analysis, STAR story builder, and communication evaluation.",
          href: "/student/interview-prep",
          icon: "🧠",
          badge: "Behavioral & HR",
          tagColor: "#a855f7",
          actionText: "Prepare Behavioral"
        },
        {
          title: "Group Discussion Simulator",
          description: "Multi-speaker campus placement GD practice with live speech sentiment and turn-taking feedback.",
          href: "/student/gd-practice",
          icon: "👥",
          badge: "Campus Placement",
          tagColor: "#f59e0b",
          actionText: "Practice GD"
        },
        {
          title: "Question Bank & STAR Stories",
          description: "Curated bank of CS core questions, HR behavioral questions, and structured STAR templates.",
          href: "/student/question-bank",
          icon: "📚",
          badge: "CS Core & HR",
          tagColor: "#06b6d4",
          actionText: "Browse Bank"
        }
      ]
    },
    {
      id: "technical",
      title: "Technical Practice",
      description: "Data structures, algorithms, core computer science, and timed problem solving.",
      icon: "⚡",
      accentColor: "#10b981",
      tools: [
        {
          title: "Cognalyze Mentor (Adaptive AI)",
          description: "Multilingual, Socratic learning environment that diagnoses understanding, teaches interactively, detects confusion, and builds verified evidence.",
          href: "/student/mentor",
          icon: "🧠",
          badge: "Adaptive AI Mentor",
          tagColor: "#818cf8",
          actionText: "Launch Mentor"
        },
        {
          title: "DSA Tracker (Striver SDE Sheet)",
          description: "Interactive algorithmic problem tracker mapping test case executions directly to Student DNA.",
          href: "/student/dsa-tracker",
          icon: "⚡",
          badge: "Evidence-Linked",
          tagColor: "#10b981",
          actionText: "Open DSA Tracker"
        },
        {
          title: "Assessment Arena",
          description: "Timed campus coding tests, algorithmic challenges, and execution-verified submissions.",
          href: "/student/assessment-arena",
          icon: "⚔️",
          badge: "Timed Challenges",
          tagColor: "#34d399",
          actionText: "Enter Arena"
        },
        {
          title: "CS Core Subject Practice",
          description: "OS, DBMS, Computer Networks, and OOP technical revision with verified mastery assessments.",
          href: "/student/question-bank",
          icon: "💻",
          badge: "Core Engineering",
          tagColor: "#38bdf8",
          actionText: "Study CS Core"
        }
      ]
    },
    {
      id: "career",
      title: "Career Building",
      description: "Resume diagnostics, campus placement simulation, and verified credential management.",
      icon: "📄",
      accentColor: "#8b5cf6",
      tools: [
        {
          title: "Resume Workspace & Diagnostics",
          description: "ATS parser, keyword match analysis, project impact metrics, and resume optimization.",
          href: "/student/resume",
          icon: "📄",
          badge: "ATS Scored",
          tagColor: "#f43f5e",
          actionText: "Analyze Resume"
        },
        {
          title: "Resume Builder",
          description: "Interactive resume creator that formats your verified DNA evidence into exportable PDF resumes.",
          href: "/resume",
          icon: "✍️",
          badge: "Export Ready",
          tagColor: "#a855f7",
          actionText: "Build Resume"
        },
        {
          title: "Campus Recruitment Simulation",
          description: "5-stage mock placement drive simulation with automated screening and recruiter decision room.",
          href: "/student/simulation",
          icon: "🏆",
          badge: "End-to-End Sim",
          tagColor: "#8b5cf6",
          actionText: "Start Simulation"
        },
        {
          title: "Student Capability Passport",
          description: "Cryptographically shareable verified capability grants and artifact proofs for recruiters.",
          href: "/student/passport",
          icon: "🛂",
          badge: "Privacy Controls",
          tagColor: "#6366f1",
          actionText: "Manage Passport"
        },
        {
          title: "Capabilities & Growth Engine",
          description: "Comprehensive capability graph showing verified levels, gaps to bridge, and actionable milestones.",
          href: "/student/capabilities",
          icon: "📈",
          badge: "Growth Milestones",
          tagColor: "#059669",
          actionText: "View Capabilities"
        }
      ]
    },
    {
      id: "planning",
      title: "Planning & Community",
      description: "Placement calendar, drive deadlines, interview scheduling, and collaboration feed.",
      icon: "📅",
      accentColor: "#f59e0b",
      tools: [
        {
          title: "Placement Calendar & Deadlines",
          description: "Drive deadlines, assessment rounds, interview schedules, and iCal calendar synchronization.",
          href: "/student/calendar",
          icon: "📅",
          badge: "Calendar Sync",
          tagColor: "#f59e0b",
          actionText: "View Calendar"
        },
        {
          title: "Collaboration Feed & Syndicates",
          description: "Post project proposals, discover hackathon teammates, and form cross-functional syndicates.",
          href: "/post",
          icon: "📢",
          badge: "Team Formation",
          tagColor: "#10b981",
          actionText: "Post to Feed"
        },
        {
          title: "Student Community",
          description: "Peer discussion board, campus placement tips, interview debriefs, and study groups.",
          href: "/student/community",
          icon: "🌐",
          badge: "Peer Network",
          tagColor: "#38bdf8",
          actionText: "Join Community"
        }
      ]
    }
  ];

  const filteredCategories = categories.map(cat => {
    if (activeTab !== "all" && cat.id !== activeTab) return null;
    const matchingTools = cat.tools.filter(t =>
      searchFilter.trim() === "" ||
      t.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.description.toLowerCase().includes(searchFilter.toLowerCase())
    );
    if (matchingTools.length === 0) return null;
    return { ...cat, tools: matchingTools };
  }).filter(Boolean) as ToolCategory[];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "28px 24px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "#818cf8" }}>
                CENTRAL TOOL &amp; PREPARATION HUB
              </span>
              <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(99,102,241,0.15)", color: "#a5b4fc", borderRadius: 4, fontWeight: 700 }}>
                15+ Integrated Modules
              </span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", margin: 0 }}>
              Resources &amp; Preparation Tools
            </h1>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0", maxWidth: 640 }}>
              All secondary interview simulators, coding trackers, resume builders, and placement planning modules in one place.
            </p>
          </div>

          {/* Search bar within resources */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative", width: 260 }}>
              <input
                type="text"
                placeholder="Filter tools..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 32px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: 8,
                  color: "white",
                  fontSize: 12,
                  outline: "none"
                }}
              />
              <span style={{ position: "absolute", left: 10, top: 9, fontSize: 13, opacity: 0.5 }}>🔍</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { id: "all", label: "All Modules (15+)", icon: "🧰" },
            { id: "interview", label: "Interview Hub", icon: "🎙️" },
            { id: "technical", label: "Technical Practice", icon: "⚡" },
            { id: "career", label: "Career Building", icon: "📄" },
            { id: "planning", label: "Planning & Community", icon: "📅" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: activeTab === tab.id ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.08)",
                background: activeTab === tab.id ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                color: activeTab === tab.id ? "white" : "rgba(255,255,255,0.7)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease"
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Categories and Tools Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {filteredCategories.map(category => (
            <div key={category.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 20 }}>{category.icon}</span>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 900, color: "white", margin: 0 }}>
                    {category.title}
                  </h2>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    {category.description}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
                {category.tools.map((tool, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(15, 23, 42, 0.5)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: 14,
                      padding: "18px 20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 14,
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 24 }}>{tool.icon}</span>
                        {tool.badge && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: 4,
                              background: `${tool.tagColor || category.accentColor}18`,
                              color: tool.tagColor || category.accentColor,
                              border: `1px solid ${tool.tagColor || category.accentColor}33`
                            }}
                          >
                            {tool.badge}
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: "0 0 6px" }}>
                        {tool.title}
                      </h3>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, margin: 0 }}>
                        {tool.description}
                      </p>
                    </div>

                    <Link
                      href={tool.href}
                      style={{
                        padding: "8px 14px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 8,
                        color: "white",
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                    >
                      <span>{tool.actionText || "Open Tool"}</span>
                      <span>→</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div style={{ padding: "48px 20px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>No tools matched &quot;{searchFilter}&quot;</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                Try searching for &quot;interview&quot;, &quot;DSA&quot;, &quot;resume&quot;, or reset your filters.
              </div>
              <button
                onClick={() => { setSearchFilter(""); setActiveTab("all"); }}
                style={{ marginTop: 14, padding: "6px 14px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 6, color: "#c7d2fe", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
