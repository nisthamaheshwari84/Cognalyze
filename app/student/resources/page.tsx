"use client";

import React, { useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";

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
      accentColor: "#356AE6",
      tools: [
        {
          title: "FAANG Mock Interview",
          description: "Interactive AI face & voice technical interview with 7-axis rubric scoring and hiring signals.",
          href: "/interview",
          icon: "🎙️",
          badge: "Voice & Face AI",
          tagColor: "#356AE6",
          actionText: "Launch Interview"
        },
        {
          title: "Opportunity Practice Interview",
          description: "Targeted practice session tailored specifically to the requirements of any saved opportunity.",
          href: "/student/practice-interview",
          icon: "🎤",
          badge: "Opportunity-Grounded",
          tagColor: "#356AE6",
          actionText: "Practice Opportunity"
        },
        {
          title: "AI Interview Prep & Behavioral",
          description: "Diagnostic behavioral answer analysis, STAR story builder, and communication evaluation.",
          href: "/student/interview-prep",
          icon: "🧠",
          badge: "Behavioral & HR",
          tagColor: "#162A43",
          actionText: "Prepare Behavioral"
        },
        {
          title: "Group Discussion Simulator",
          description: "Multi-speaker campus placement GD practice with live speech sentiment and turn-taking feedback.",
          href: "/student/gd-practice",
          icon: "👥",
          badge: "Campus Placement",
          tagColor: "#B7791F",
          actionText: "Practice GD"
        },
        {
          title: "Question Bank & STAR Stories",
          description: "Curated bank of CS core questions, HR behavioral questions, and structured STAR templates.",
          href: "/student/question-bank",
          icon: "📚",
          badge: "CS Core & HR",
          tagColor: "#162A43",
          actionText: "Browse Bank"
        }
      ]
    },
    {
      id: "technical",
      title: "Technical Practice",
      description: "Data structures, algorithms, core computer science, and timed problem solving.",
      icon: "⚡",
      accentColor: "#162A43",
      tools: [
        {
          title: "Cognalyze AI Mentor (Adaptive AI)",
          description: "Multilingual, Socratic learning environment that diagnoses understanding, teaches interactively, detects confusion, and builds verified evidence.",
          href: "/student/ai-mentor",
          icon: "🧠",
          badge: "AI Mentor ✦",
          tagColor: "#356AE6",
          actionText: "Launch AI Mentor"
        },
        {
          title: "DSA Tracker (Striver SDE Sheet)",
          description: "Interactive algorithmic problem tracker mapping test case executions directly to Student DNA.",
          href: "/student/dsa-tracker",
          icon: "⚡",
          badge: "Evidence-Linked",
          tagColor: "#2E7D5B",
          actionText: "Open DSA Tracker"
        },
        {
          title: "Assessment Arena",
          description: "Timed campus coding tests, algorithmic challenges, and execution-verified submissions.",
          href: "/student/assessment-arena",
          icon: "⚔️",
          badge: "Timed Challenges",
          tagColor: "#2E7D5B",
          actionText: "Enter Arena"
        },
        {
          title: "CS Core Subject Practice",
          description: "OS, DBMS, Computer Networks, and OOP technical revision with verified mastery assessments.",
          href: "/student/question-bank",
          icon: "💻",
          badge: "Core Engineering",
          tagColor: "#356AE6",
          actionText: "Study CS Core"
        }
      ]
    },
    {
      id: "career",
      title: "Career Building",
      description: "Resume diagnostics, campus placement simulation, and verified credential management.",
      icon: "📄",
      accentColor: "#2E7D5B",
      tools: [
        {
          title: "Resume Workspace & Diagnostics",
          description: "ATS parser, keyword match analysis, project impact metrics, and resume optimization.",
          href: "/student/resume",
          icon: "📄",
          badge: "ATS Scored",
          tagColor: "#C24141",
          actionText: "Analyze Resume"
        },
        {
          title: "Resume Builder",
          description: "Interactive resume creator that formats your verified DNA evidence into exportable PDF resumes.",
          href: "/resume",
          icon: "✍️",
          badge: "Export Ready",
          tagColor: "#162A43",
          actionText: "Build Resume"
        },
        {
          title: "Campus Recruitment Simulation",
          description: "5-stage mock placement drive simulation with automated screening and recruiter decision room.",
          href: "/student/simulation",
          icon: "🏆",
          badge: "End-to-End Sim",
          tagColor: "#356AE6",
          actionText: "Start Simulation"
        },
        {
          title: "Student Capability Passport",
          description: "Cryptographically shareable verified capability grants and artifact proofs for recruiters.",
          href: "/student/passport",
          icon: "🛂",
          badge: "Privacy Controls",
          tagColor: "#162A43",
          actionText: "Manage Passport"
        },
        {
          title: "Capabilities & Growth Engine",
          description: "Comprehensive capability graph showing verified levels, gaps to bridge, and actionable milestones.",
          href: "/student/capabilities",
          icon: "📈",
          badge: "Growth Milestones",
          tagColor: "#2E7D5B",
          actionText: "View Capabilities"
        }
      ]
    },
    {
      id: "planning",
      title: "Planning & Community",
      description: "Placement calendar, drive deadlines, interview scheduling, and collaboration feed.",
      icon: "📅",
      accentColor: "#B7791F",
      tools: [
        {
          title: "Placement Calendar & Deadlines",
          description: "Drive deadlines, assessment rounds, interview schedules, and iCal calendar synchronization.",
          href: "/student/calendar",
          icon: "📅",
          badge: "Calendar Sync",
          tagColor: "#B7791F",
          actionText: "View Calendar"
        },
        {
          title: "Collaboration Feed & Syndicates",
          description: "Post project proposals, discover hackathon teammates, and form cross-functional syndicates.",
          href: "/post",
          icon: "📢",
          badge: "Team Formation",
          tagColor: "#2E7D5B",
          actionText: "Post to Feed"
        },
        {
          title: "Placement Question Bank",
          description: "Technical interview questions, company patterns, test suites, and preparation guides.",
          href: "/question-bank",
          icon: "💡",
          badge: "Question Bank",
          tagColor: "#356AE6",
          actionText: "Explore Question Bank"
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
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "28px 24px 60px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#356AE6" }}>
                CENTRAL TOOL &amp; PREPARATION HUB
              </span>
              <span style={{ fontSize: 10, padding: "2px 8px", background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", borderRadius: 4, fontWeight: 700 }}>
                15+ Integrated Modules
              </span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#162A43", margin: 0 }}>
              Resources &amp; Preparation Tools
            </h1>
            <p style={{ fontSize: 13, color: "#667085", margin: "4px 0 0", maxWidth: 640 }}>
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
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 7,
                  color: "#17191C",
                  fontSize: 12,
                  outline: "none",
                  boxSizing: "border-box"
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
                borderRadius: 7,
                border: activeTab === tab.id ? "1px solid #356AE6" : "1px solid #E4E1DA",
                background: activeTab === tab.id ? "#EFF4FE" : "#FFFFFF",
                color: activeTab === tab.id ? "#356AE6" : "#667085",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
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
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#162A43", margin: 0 }}>
                    {category.title}
                  </h2>
                  <div style={{ fontSize: 12, color: "#667085" }}>
                    {category.description}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
                {category.tools.map((tool, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 10,
                      padding: "18px 20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 14,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
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
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 4,
                              background: "#EFF4FE",
                              color: tool.tagColor || "#356AE6",
                              border: "1px solid #D2E0FB"
                            }}
                          >
                            {tool.badge}
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#162A43", margin: "0 0 6px" }}>
                        {tool.title}
                      </h3>
                      <p style={{ fontSize: 12.5, color: "#667085", lineHeight: 1.5, margin: 0 }}>
                        {tool.description}
                      </p>
                    </div>

                    <Link
                      href={tool.href}
                      style={{
                        padding: "8px 14px",
                        background: "#F6F5F1",
                        border: "1px solid #E4E1DA",
                        borderRadius: 7,
                        color: "#162A43",
                        fontSize: 12,
                        fontWeight: 600,
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
            <div style={{ padding: "48px 20px", textAlign: "center", background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#162A43" }}>No tools matched &quot;{searchFilter}&quot;</div>
              <div style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>
                Try searching for &quot;interview&quot;, &quot;DSA&quot;, &quot;resume&quot;, or reset your filters.
              </div>
              <button
                onClick={() => { setSearchFilter(""); setActiveTab("all"); }}
                style={{ marginTop: 14, padding: "6px 14px", background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 7, color: "#356AE6", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
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
