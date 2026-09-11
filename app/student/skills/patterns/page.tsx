"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function CompanyPatternBanksPage() {
  const [selectedCompany, setSelectedCompany] = useState<"tcs" | "infosys" | "wipro" | "faang">("tcs");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#090d16", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ── HEADER ── */}
      <header style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(16px)", padding: "16px 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Link href="/student/skills" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                ← Skill Practice Hub
              </Link>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
              <span style={{ color: "#fbbf24", fontSize: 13, fontWeight: 700 }}>Company-Specific Pattern Archives</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
              🏛️ Company-Specific Pattern Banks (2026 Archive)
            </h1>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/student/skills/aptitude" style={{ textDecoration: "none" }}>
              <button style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                🧮 Practice Aptitude
              </button>
            </Link>
            <Link href="/student/skills/communication" style={{ textDecoration: "none" }}>
              <button style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                🎙️ Practice Speech
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>

        {/* ── COMPANY TABS ── */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", maxWidth: "100%", paddingBottom: 8, marginBottom: 24 }}>
          {[
            { id: "tcs", label: "🔥 TCS NQT (Ninja vs Digital / Prime)", tag: "TCS" },
            { id: "infosys", label: "🏛️ Infosys (GenC vs SP/DSE & HackWithInfy)", tag: "Infosys" },
            { id: "wipro", label: "⚡ Wipro (Elite NTH vs Turbo)", tag: "Wipro" },
            { id: "faang", label: "🚀 FAANG / Product Track (Amazon, Google)", tag: "Product" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCompany(tab.id as any)}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: selectedCompany === tab.id ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.08)",
                background: selectedCompany === tab.id ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.03)",
                color: selectedCompany === tab.id ? "white" : "rgba(255,255,255,0.6)",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── COMPANY PATTERN DOSSIER ── */}
        {selectedCompany === "tcs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: 18, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: "rgba(99,102,241,0.2)", color: "#a5b4fc", fontWeight: 800 }}>
                  2026 OFFICIAL NQT STRUCTURE
                </span>
                <span style={{ fontSize: 12, color: "#34d399", fontWeight: 700 }}>
                  Ninja (₹3.36 LPA) vs Digital (₹7.0 LPA) vs Prime (₹9.0 LPA)
                </span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 10px", color: "white" }}>
                TCS National Qualifier Test (NQT) Blueprint
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>
                TCS evaluates candidates through a single integrated test. Candidates scoring above the standard cutoff (~65%) are invited for the Ninja interview. Top 10-15% scorers qualify directly for the Digital & Prime coding tracks without a second test.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 16 }}>
              <div style={{ padding: 20, background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }}>
                <div style={{ fontSize: 11, color: "#38bdf8", fontWeight: 800, marginBottom: 4 }}>PART A: FOUNDATION SECTION (75 MINS)</div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: "0 0 8px" }}>Mandatory Gate for All Tracks</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                  <li><strong>Numerical Ability (20 Qs, 25m):</strong> Work & Time, P&C, Probability, Speed & Distance, SI/CI.</li>
                  <li><strong>Reasoning Ability (20 Qs, 25m):</strong> Syllogisms, Blood Relations, Data Sufficiency, Direction Sense.</li>
                  <li><strong>Verbal Ability (25 Qs, 25m):</strong> Error Spotting, Reading Comprehension, Sentence Completion.</li>
                </ul>
              </div>

              <div style={{ padding: 20, background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }}>
                <div style={{ fontSize: 11, color: "#a855f7", fontWeight: 800, marginBottom: 4 }}>PART B: ADVANCED CODING SECTION (90 MINS)</div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: "0 0 8px" }}>Digital & Prime Elevation Gate</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                  <li><strong>Coding Question 1 (Basic / 15 Marks):</strong> Array element counting, string palindrome, GCD/LCM sequences.</li>
                  <li><strong>Coding Question 2 (Advanced / 35 Marks):</strong> Greedy scheduling, grid DP, modular arithmetic, BFS paths.</li>
                  <li><strong>Languages Supported:</strong> C, C++, Java, Python 3. Strict compiler execution timeouts (1.0s).</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {selectedCompany === "infosys" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 18, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: "rgba(16,185,129,0.2)", color: "#34d399", fontWeight: 800 }}>
                  INFOSYS 2026 ARCHIVE
                </span>
                <span style={{ fontSize: 12, color: "#fbbf24", fontWeight: 700 }}>
                  System Engineer (₹3.6 LPA) vs DSE (₹6.25 LPA) vs SP (₹9.5 LPA)
                </span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 10px", color: "white" }}>
                Infosys Hiring Architecture & Cryptarithmetic Focus
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>
                Infosys assessments differ sharply from standard tests by heavily weighting <strong>Cryptarithmetic puzzles</strong> and <strong>Data Interpretation</strong> in their reasoning round, alongside pseudo-code analysis.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 16 }}>
              <div style={{ padding: 20, background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }}>
                <div style={{ fontSize: 11, color: "#10b981", fontWeight: 800, marginBottom: 4 }}>UNIQUE INFOSYS GATES</div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: "0 0 8px" }}>High Elimination Hotspots</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                  <li><strong>Cryptarithmetic (3-4 Qs):</strong> Letter substitutions (SEND + MORE = MONEY). Remember: Leading carry is always 1.</li>
                  <li><strong>Critical Reasoning & Puzzles:</strong> Seating arrangements, direction sense, and flowcharts.</li>
                  <li><strong>Pseudo-code Round (5-7 Qs):</strong> Recursive functions, pointer dereferencing, bitwise operator output tracing.</li>
                </ul>
              </div>

              <div style={{ padding: 20, background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }}>
                <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 800, marginBottom: 4 }}>HACKWITHINFY CODING LADDER</div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: "0 0 8px" }}>Specialist Programmer (SP) Path</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                  <li>3 Competitive Programming problems in 3 hours.</li>
                  <li>Problem 1: Medium greedy/two-pointer array (100 pts).</li>
                  <li>Problem 2: Tree DP or segment tree interval query (100 pts).</li>
                  <li>Problem 3: Hard graph traversal with bitmask DP (100 pts).</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {selectedCompany === "wipro" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: 18, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: "rgba(245,158,11,0.2)", color: "#fbbf24", fontWeight: 800 }}>
                  WIPRO 2026 ARCHIVE
                </span>
                <span style={{ fontSize: 12, color: "#38bdf8", fontWeight: 700 }}>
                  Elite NTH (₹3.5 LPA) vs Turbo (₹6.5 LPA)
                </span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 10px", color: "white" }}>
                Wipro Elite National Talent Hunt (NTH) Blueprint
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>
                Wipro Elite features a mandatory <strong>Written Communication (Essay Writing)</strong> round alongside Quant and Coding. Poor English grammar in the 20-minute essay immediately eliminates candidates before technical evaluation.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 16 }}>
              <div style={{ padding: 20, background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }}>
                <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 800, marginBottom: 4 }}>WRITTEN COMMUNICATION TEST</div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: "0 0 8px" }}>20-Minute Essay Gate</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                  <li>Minimum 250 words, maximum 400 words on socio-technical topic.</li>
                  <li>Automated AI grading checks: Zero spelling errors, Subject-Verb agreement, cohesive paragraph structure.</li>
                  <li>Do NOT use backspace excessively — focus on clear, active-voice prose.</li>
                </ul>
              </div>

              <div style={{ padding: 20, background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }}>
                <div style={{ fontSize: 11, color: "#38bdf8", fontWeight: 800, marginBottom: 4 }}>CODING ASSESSMENT (60 MINS)</div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: "0 0 8px" }}>2 Basic to Medium Problems</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                  <li>Question 1 (Easy): String transformations, matrix transposition.</li>
                  <li>Question 2 (Medium): Dynamic arrays, sub-array sum with hash map.</li>
                  <li>Passing both questions with all test cases guarantees an interview call.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {selectedCompany === "faang" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: 18, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: "rgba(168,85,247,0.2)", color: "#c084fc", fontWeight: 800 }}>
                  TIER-1 PRODUCT & FAANG BENCHMARKS
                </span>
                <span style={{ fontSize: 12, color: "#34d399", fontWeight: 700 }}>
                  Google / Amazon / Microsoft / Meta (₹28 LPA - ₹55+ LPA)
                </span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 10px", color: "white" }}>
                Algorithmic Pattern Grind & Distributed System Design
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>
                Zero aptitude tests. 100% of interview evaluation rests on: 1) Flawless LeetCode Medium/Hard implementation with verbalized trade-offs, 2) Distributed systems architecture (HLD/LLD), and 3) Behavioral leadership principles (STAR method).
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 16 }}>
              <div style={{ padding: 20, background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }}>
                <div style={{ fontSize: 11, color: "#c084fc", fontWeight: 800, marginBottom: 4 }}>14 RECURRING FAANG PATTERNS</div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: "0 0 8px" }}>Mastery Replaces Rote Memorization</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                  <li>Two Pointers & Sliding Window (Substrings, Max Profit)</li>
                  <li>Tree & Graph Traversals (BFS, DFS, Dijkstra, Topo-sort)</li>
                  <li>Dynamic Programming (0/1 Knapsack, LCS, Matrix chain)</li>
                  <li>Monotonic Stacks & Heaps (Next greater element, Top-K)</li>
                </ul>
              </div>

              <div style={{ padding: 20, background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }}>
                <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 800, marginBottom: 4 }}>AMAZON 16 LEADERSHIP PRINCIPLES</div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: "0 0 8px" }}>STAR Method Interrogation</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                  <li>Customer Obsession: When did you push back on a bad product decision?</li>
                  <li>Ownership: Tell me about a time you fixed something outside your role.</li>
                  <li>Disagree & Commit: Resolving an architectural deadlock with a peer.</li>
                  <li>Bias for Action: Shipping under extreme ambiguity without full data.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
