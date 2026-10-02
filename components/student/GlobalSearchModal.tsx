"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

interface SearchItem {
  id: string;
  title: string;
  category: "Destination" | "Opportunity" | "Tool" | "Application" | "DNA";
  href: string;
  icon: string;
  description: string;
}

const SEARCH_REGISTRY: SearchItem[] = [
  // Major Destinations
  { id: "dest-overview", title: "Overview / Command Center", category: "Destination", href: "/student/dashboard", icon: "🏠", description: "Home snapshot, next best actions, and career direction" },
  { id: "dest-dna", title: "My Student DNA", category: "Destination", href: "/student/dna", icon: "🧬", description: "Canonical verified evidence, skills, and capability matrix" },
  { id: "dest-opps", title: "Opportunities & Hackathons", category: "Destination", href: "/student/opportunities", icon: "🎯", description: "Verified campus drives, hackathons, and corporate internships" },
  { id: "dest-apps", title: "Applications Kanban", category: "Destination", href: "/student/applications", icon: "📋", description: "Application tracking across pipeline stages" },
  { id: "dest-resources", title: "Resources & Tool Hub", category: "Destination", href: "/student/resources", icon: "🧰", description: "All interview, technical practice, and career building tools" },
  { id: "dest-profile", title: "My Profile", category: "Destination", href: "/student/profile", icon: "👤", description: "Academic details, resume projects, links, and preferences" },

  { id: "tool-mentor", title: "Cognalyze AI Mentor", category: "Tool", href: "/student/ai-mentor", icon: "🤖", description: "Personalized learning, DSA practice, interview preparation & career guidance" },
  { id: "tool-interview", title: "FAANG Mock Interview", category: "Tool", href: "/interview", icon: "🎙️", description: "Real-time AI voice & technical interview simulation" },
  { id: "tool-practice-interview", title: "Practice Interview", category: "Tool", href: "/student/practice-interview", icon: "🎤", description: "Targeted opportunity mock interview session" },
  { id: "tool-dsa", title: "DSA Tracker (Striver Sheet)", category: "Tool", href: "/student/dsa-tracker", icon: "⚡", description: "Algorithmic problem sets and SDE sheet progress" },
  { id: "tool-resume", title: "Resume Workspace & ATS", category: "Tool", href: "/student/resume", icon: "📄", description: "Resume parsing, keyword diagnostics, and ATS score" },
  { id: "tool-resume-builder", title: "Resume Builder", category: "Tool", href: "/resume", icon: "✍️", description: "Interactive resume creator and PDF exporter" },
  { id: "tool-sim", title: "Recruitment Simulation", category: "Tool", href: "/student/simulation", icon: "🏆", description: "5-stage campus recruitment process simulation" },
  { id: "tool-qbank", title: "Question Bank & STAR Stories", category: "Tool", href: "/student/question-bank", icon: "📚", description: "CS core subject questions and HR behavioral bank" },
  { id: "tool-calendar", title: "Placement Calendar", category: "Tool", href: "/student/calendar", icon: "📅", description: "Drive deadlines, interview rounds, and iCal export" },
  { id: "tool-passport", title: "Student Passport", category: "Tool", href: "/student/passport", icon: "🛂", description: "Shareable verified capability grants for recruiters" },
  { id: "tool-arena", title: "Assessment Arena", category: "Tool", href: "/student/assessment-arena", icon: "⚔️", description: "Timed coding challenges and problem solving tests" },
  { id: "tool-gd", title: "Group Discussion Practice", category: "Tool", href: "/student/gd-practice", icon: "👥", description: "Multi-speaker campus GD simulation" },
  { id: "tool-community", title: "Collaboration Feed", category: "Tool", href: "/post", icon: "📢", description: "Syndicate team matching and project posts" },

  // Canonical Opportunities
  { id: "opp-flipkart", title: "Flipkart GRiD 7.0 (SDE Track)", category: "Opportunity", href: "/student/opportunities/opp-flipkart-grid", icon: "🛍️", description: "Annual SDE-1 PPI Hackathon (CTC ₹32 LPA)" },
  { id: "opp-sih", title: "Smart India Hackathon (SIH 2026)", category: "Opportunity", href: "/student/opportunities/opp-sih-2026-1", icon: "🇮🇳", description: "National hackathon with government problem statements" },
  { id: "opp-walmart", title: "Walmart Global Tech SDE Sprint", category: "Opportunity", href: "/student/opportunities/opp-walmart-sde-sprint", icon: "🏢", description: "Tier-1 corporate internship hiring challenge" }
];

export default function GlobalSearchModal({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { isDark } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Typo alias map for common misspellings
  const TYPO_MAP: Record<string, string> = {
    intreview: "interview",
    intervew: "interview",
    intrview: "interview",
    resme: "resume",
    resum: "resume",
    cv: "resume",
    mentr: "mentor",
    ai: "mentor",
    recrusion: "dsa",
    ds: "dsa",
    algo: "dsa",
    hackton: "opportunity",
    opertunity: "opportunity",
    opport: "opportunity",
    opp: "opportunity",
  };

  const rawLower = query.toLowerCase().trim();
  const normalizedQuery = TYPO_MAP[rawLower] || rawLower;
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  const filtered = queryTokens.length === 0
    ? SEARCH_REGISTRY.slice(0, 8)
    : SEARCH_REGISTRY.filter(item => {
        const itemText = (item.title + " " + item.description + " " + item.category).toLowerCase();
        // Match full phrase or any query token
        return itemText.includes(normalizedQuery) || queryTokens.some(token => itemText.includes(token));
      });

  const isExactEmpty = queryTokens.length > 0 && filtered.length === 0;
  const displayItems = isExactEmpty ? SEARCH_REGISTRY.slice(0, 4) : filtered;

  const handleSelect = (item: SearchItem) => {
    onClose();
    router.push(item.href);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(8px)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          background: isDark ? "#0E1B2E" : "#FFFFFF",
          border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
          borderRadius: 16,
          boxShadow: isDark ? "0 25px 50px -12px rgba(0, 0, 0, 0.8)" : "0 20px 40px -12px rgba(22, 42, 67, 0.15)",
          overflow: "hidden",
          fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`, gap: 10 }}>
          <span style={{ fontSize: 18, opacity: 0.6 }}>🔍</span>
          <input
            type="text"
            placeholder="Search opportunities, tools, DNA, applications, or DSA..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            autoFocus
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: isDark ? "#F2F6FC" : "#17191C",
              fontSize: 14,
              outline: "none"
            }}
          />
          <kbd style={{ fontSize: 10, padding: "2px 6px", background: isDark ? "rgba(255, 255, 255, 0.08)" : "#F0EFEA", borderRadius: 4, color: isDark ? "#B6C4D6" : "#667085", border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}` }}>
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: "50vh", overflowY: "auto", padding: "8px" }}>
          {isExactEmpty && (
            <div style={{ padding: "10px 14px 6px", fontSize: 12, color: isDark ? "#B6C4D6" : "#667085" }}>
              No exact matches found for &quot;{query}&quot;. Related platform destinations:
            </div>
          )}

          {displayItems.length > 0 ? (
            displayItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: idx === selectedIndex ? (isDark ? "rgba(52, 120, 246, 0.15)" : "#EEF4FD") : "transparent",
                  border: idx === selectedIndex ? `1px solid ${isDark ? "rgba(52, 120, 246, 0.3)" : "#D1E2FB"}` : "1px solid transparent",
                  transition: "all 0.12s ease"
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#F2F6FC" : "#17191C" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", marginTop: 2 }}>
                      {item.description}
                    </div>
                  </div>
                </div>

                <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: isDark ? "rgba(255, 255, 255, 0.06)" : "#F0EFEA", color: isDark ? "#B6C4D6" : "#667085", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}` }}>
                  {item.category}
                </span>
              </div>
            ))
          ) : (
            <div style={{ padding: "32px 16px", textAlign: "center", color: isDark ? "#7E8FA6" : "#98A2B3", fontSize: 13 }}>
              No matches found. Try &quot;DSA&quot;, &quot;Interview&quot;, or &quot;Hackathon&quot;.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ padding: "8px 16px", borderTop: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`, background: isDark ? "#13243A" : "#FAF9F6", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: isDark ? "#7E8FA6" : "#98A2B3" }}>
          <span>Navigation Quick Jump</span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
}
