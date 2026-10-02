"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function CompanyPatternBanksPage() {
  const [selectedCompany, setSelectedCompany] = useState<"tcs" | "infosys" | "wipro" | "faang">("tcs");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ── HEADER ── */}
      <header style={{ borderBottom: "1px solid #E4E1DA", backgroundColor: "#FFFFFF", padding: "14px 24px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <Link href="/student/skills" style={{ color: "#667085", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                ← Skill Practice Hub
              </Link>
              <span style={{ color: "#98A2B3" }}>/</span>
              <span style={{ color: "#356AE6", fontSize: 12, fontWeight: 700 }}>Company Pattern Archives</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "#162A43", letterSpacing: "-0.03em" }}>
              🏛️ Company-Specific Pattern Banks
            </h1>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/student/skills/aptitude" style={{ textDecoration: "none" }}>
              <button style={{ padding: "6px 12px", borderRadius: 7, background: "#EFF4FE", border: "1px solid #D2E0FB", color: "#356AE6", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                🧮 Practice Aptitude
              </button>
            </Link>
            <Link href="/student/skills/communication" style={{ textDecoration: "none" }}>
              <button style={{ padding: "6px 12px", borderRadius: 7, background: "#EAF4EE", border: "1px solid #C8E4D3", color: "#2E7D5B", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                🎙️ Practice Speech
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

        {/* ── COMPANY TABS ── */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", maxWidth: "100%", paddingBottom: 8, marginBottom: 24 }}>
          {[
            { id: "tcs", label: "🔥 TCS NQT (Ninja vs Digital / Prime)", tag: "TCS" },
            { id: "infosys", label: "🏛️ Infosys (GenC vs SP/DSE & HackWithInfy)", tag: "Infosys" },
            { id: "wipro", label: "⚡ Wipro (Elite NTH vs Turbo)", tag: "Wipro" },
            { id: "faang", label: "🚀 FAANG / Product Track (Amazon, Google)", tag: "Product" }
          ].map(tab => {
            const isSelected = selectedCompany === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCompany(tab.id as any)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 7,
                  border: isSelected ? "1px solid #162A43" : "1px solid #E4E1DA",
                  background: isSelected ? "#162A43" : "#FFFFFF",
                  color: isSelected ? "#FFFFFF" : "#667085",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: isSelected ? "0 2px 4px rgba(22, 42, 67, 0.12)" : "0 1px 2px rgba(0,0,0,0.02)",
                  transition: "all 0.15s ease"
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── COMPANY PATTERN DOSSIER ── */}
        {selectedCompany === "tcs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", fontWeight: 700 }}>
                  2026 OFFICIAL NQT STRUCTURE
                </span>
                <span style={{ fontSize: 12, color: "#2E7D5B", fontWeight: 700 }}>
                  Ninja (₹3.36 LPA) vs Digital (₹7.0 LPA) vs Prime (₹9.0 LPA)
                </span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px", color: "#162A43", letterSpacing: "-0.02em" }}>
                TCS National Qualifier Test (NQT) Blueprint
              </h2>
              <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.6, margin: 0 }}>
                TCS evaluates candidates through a single integrated test. Candidates scoring above the standard cutoff (~65%) are invited for the Ninja interview. Top 10-15% scorers qualify directly for the Digital &amp; Prime coding tracks without a second test.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 14 }}>
              <div style={{ padding: 18, background: "#F9F8F5", border: "1px solid #E4E1DA", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "#356AE6", fontWeight: 700, marginBottom: 4 }}>PART A: FOUNDATION SECTION (75 MINS)</div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#162A43", margin: "0 0 8px" }}>Mandatory Gate for All Tracks</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#667085", lineHeight: 1.6 }}>
                  <li><strong style={{ color: "#17191C" }}>Numerical Ability (20 Qs, 25m):</strong> Work &amp; Time, P&amp;C, Probability, Speed &amp; Distance, SI/CI.</li>
                  <li><strong style={{ color: "#17191C" }}>Reasoning Ability (20 Qs, 25m):</strong> Syllogisms, Blood Relations, Data Sufficiency, Direction Sense.</li>
                  <li><strong style={{ color: "#17191C" }}>Verbal Ability (25 Qs, 25m):</strong> Error Spotting, Reading Comprehension, Sentence Completion.</li>
                </ul>
              </div>

              <div style={{ padding: 18, background: "#F9F8F5", border: "1px solid #E4E1DA", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "#B7791F", fontWeight: 700, marginBottom: 4 }}>PART B: ADVANCED CODING SECTION (90 MINS)</div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#162A43", margin: "0 0 8px" }}>Digital &amp; Prime Elevation Gate</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#667085", lineHeight: 1.6 }}>
                  <li><strong style={{ color: "#17191C" }}>Coding Question 1 (Basic / 15 Marks):</strong> Array element counting, string palindrome, GCD/LCM sequences.</li>
                  <li><strong style={{ color: "#17191C" }}>Coding Question 2 (Advanced / 35 Marks):</strong> Greedy scheduling, grid DP, modular arithmetic, BFS paths.</li>
                  <li><strong style={{ color: "#17191C" }}>Languages Supported:</strong> C, C++, Java, Python 3. Strict compiler execution timeouts (1.0s).</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {selectedCompany === "infosys" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "#EAF4EE", color: "#2E7D5B", border: "1px solid #C8E4D3", fontWeight: 700 }}>
                  INFOSYS 2026 ARCHIVE
                </span>
                <span style={{ fontSize: 12, color: "#B7791F", fontWeight: 700 }}>
                  System Engineer (₹3.6 LPA) vs DSE (₹6.25 LPA) vs SP (₹9.5 LPA)
                </span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px", color: "#162A43", letterSpacing: "-0.02em" }}>
                Infosys Hiring Architecture &amp; Cryptarithmetic Focus
              </h2>
              <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.6, margin: 0 }}>
                Infosys assessments differ sharply from standard tests by heavily weighting <strong style={{ color: "#17191C" }}>Cryptarithmetic puzzles</strong> and <strong style={{ color: "#17191C" }}>Data Interpretation</strong> in their reasoning round, alongside pseudo-code analysis.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 14 }}>
              <div style={{ padding: 18, background: "#F9F8F5", border: "1px solid #E4E1DA", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "#2E7D5B", fontWeight: 700, marginBottom: 4 }}>UNIQUE INFOSYS GATES</div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#162A43", margin: "0 0 8px" }}>High Elimination Hotspots</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#667085", lineHeight: 1.6 }}>
                  <li><strong style={{ color: "#17191C" }}>Cryptarithmetic (3-4 Qs):</strong> Letter substitutions (SEND + MORE = MONEY). Remember: Leading carry is always 1.</li>
                  <li><strong style={{ color: "#17191C" }}>Critical Reasoning &amp; Puzzles:</strong> Seating arrangements, direction sense, and flowcharts.</li>
                  <li><strong style={{ color: "#17191C" }}>Pseudo-code Round (5-7 Qs):</strong> Recursive functions, pointer dereferencing, bitwise operator output tracing.</li>
                </ul>
              </div>

              <div style={{ padding: 18, background: "#F9F8F5", border: "1px solid #E4E1DA", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "#B7791F", fontWeight: 700, marginBottom: 4 }}>HACKWITHINFY CODING LADDER</div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#162A43", margin: "0 0 8px" }}>Specialist Programmer (SP) Path</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#667085", lineHeight: 1.6 }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "#FEF7ED", color: "#B7791F", border: "1px solid #F8D8A7", fontWeight: 700 }}>
                  WIPRO 2026 ARCHIVE
                </span>
                <span style={{ fontSize: 12, color: "#356AE6", fontWeight: 700 }}>
                  Elite NTH (₹3.5 LPA) vs Turbo (₹6.5 LPA)
                </span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px", color: "#162A43", letterSpacing: "-0.02em" }}>
                Wipro Elite National Talent Hunt (NTH) Blueprint
              </h2>
              <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.6, margin: 0 }}>
                Wipro Elite features a mandatory <strong style={{ color: "#17191C" }}>Written Communication (Essay Writing)</strong> round alongside Quant and Coding. Poor English grammar in the 20-minute essay immediately eliminates candidates before technical evaluation.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 14 }}>
              <div style={{ padding: 18, background: "#F9F8F5", border: "1px solid #E4E1DA", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "#B7791F", fontWeight: 700, marginBottom: 4 }}>WRITTEN COMMUNICATION TEST</div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#162A43", margin: "0 0 8px" }}>20-Minute Essay Gate</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#667085", lineHeight: 1.6 }}>
                  <li>Minimum 250 words, maximum 400 words on socio-technical topic.</li>
                  <li>Automated AI grading checks: Zero spelling errors, Subject-Verb agreement, cohesive paragraph structure.</li>
                  <li>Do NOT use backspace excessively — focus on clear, active-voice prose.</li>
                </ul>
              </div>

              <div style={{ padding: 18, background: "#F9F8F5", border: "1px solid #E4E1DA", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "#356AE6", fontWeight: 700, marginBottom: 4 }}>CODING ASSESSMENT (60 MINS)</div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#162A43", margin: "0 0 8px" }}>2 Basic to Medium Problems</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#667085", lineHeight: 1.6 }}>
                  <li>Question 1 (Easy): String transformations, matrix transposition.</li>
                  <li>Question 2 (Medium): Dynamic arrays, sub-array sum with hash map.</li>
                  <li>Passing both questions with all test cases guarantees an interview call.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {selectedCompany === "faang" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", fontWeight: 700 }}>
                  TIER-1 PRODUCT &amp; FAANG BENCHMARKS
                </span>
                <span style={{ fontSize: 12, color: "#2E7D5B", fontWeight: 700 }}>
                  Google / Amazon / Microsoft / Meta (₹28 LPA - ₹55+ LPA)
                </span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px", color: "#162A43", letterSpacing: "-0.02em" }}>
                Algorithmic Pattern Grind &amp; Distributed System Design
              </h2>
              <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.6, margin: 0 }}>
                Zero aptitude tests. 100% of interview evaluation rests on: 1) Flawless LeetCode Medium/Hard implementation with verbalized trade-offs, 2) Distributed systems architecture (HLD/LLD), and 3) Behavioral leadership principles (STAR method).
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 14 }}>
              <div style={{ padding: 18, background: "#F9F8F5", border: "1px solid #E4E1DA", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "#356AE6", fontWeight: 700, marginBottom: 4 }}>14 RECURRING FAANG PATTERNS</div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#162A43", margin: "0 0 8px" }}>Mastery Replaces Rote Memorization</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#667085", lineHeight: 1.6 }}>
                  <li>Two Pointers &amp; Sliding Window (Substrings, Max Profit)</li>
                  <li>Tree &amp; Graph Traversals (BFS, DFS, Dijkstra, Topo-sort)</li>
                  <li>Dynamic Programming (0/1 Knapsack, LCS, Matrix chain)</li>
                  <li>Monotonic Stacks &amp; Heaps (Next greater element, Top-K)</li>
                </ul>
              </div>

              <div style={{ padding: 18, background: "#F9F8F5", border: "1px solid #E4E1DA", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "#B7791F", fontWeight: 700, marginBottom: 4 }}>AMAZON 16 LEADERSHIP PRINCIPLES</div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#162A43", margin: "0 0 8px" }}>STAR Method Interrogation</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#667085", lineHeight: 1.6 }}>
                  <li>Customer Obsession: When did you push back on a bad product decision?</li>
                  <li>Ownership: Tell me about a time you fixed something outside your role.</li>
                  <li>Disagree &amp; Commit: Resolving an architectural deadlock with a peer.</li>
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
