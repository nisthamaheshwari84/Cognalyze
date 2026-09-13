"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function useCountUp(target: number, duration = 2000) {
  const [val, setVal] = useState(0);
  const frameRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(ease * target));
      if (p < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);
  return val;
}

function StatCounter({ value, suffix = "", prefix = "", label }: { value: number; suffix?: string; prefix?: string; label: string }) {
  const count = useCountUp(value, 2200);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "clamp(2rem,4vw,3.2rem)", fontWeight: 900, letterSpacing: "-2px", color: "white", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: 2, marginTop: 6, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

const TICKER_ITEMS = [
  "LIVE: AI committee shortlisted Candidate #4,721 ✓",
  "NEW: 3 red flags detected in resume scan →",
  "VERIFIED: Trust score 94/100 — interview passed ✓",
  "ANALYSIS: Technical depth score 87/100 for ML role",
  "RANKED: Candidate A beats Candidate B by 23 points",
  "FLAGGED: Tab switch detected during live interview ⚠",
  "SHORTLIST: Champion agent overrides Skeptic 90 vs 55",
  "COMPLETE: 5-agent debate reached consensus in 8.2s",
];

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSwitchMode = searchParams.get("switch") === "true";

  const [tick, setTick] = useState(0);
  const [savedRole, setSavedRole] = useState<string | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    tickerRef.current = setInterval(() => setTick(p => (p + 1) % TICKER_ITEMS.length), 3200);
    return () => { if (tickerRef.current) clearInterval(tickerRef.current); };
  }, []);

  // Check role persistence on initial load
  useEffect(() => {
    async function checkSavedRole() {
      try {
        const res = await fetch("/api/auth/role");
        const data = await res.json();
        const role = data?.role;
        setSavedRole(role || null);

        // If user already has an established role and didn't explicitly request ?switch=true,
        // automatically route to their active section so they don't see the selector every visit
        if (role && (role === "student" || role === "recruiter") && !isSwitchMode) {
          setIsRouting(true);
          router.replace(role === "recruiter" ? "/recruiter/dashboard" : "/student/dashboard");
          return;
        }
      } catch (e) {
        console.warn("Could not check role preference:", e);
      } finally {
        setCheckingRole(false);
      }
    }
    checkSavedRole();
  }, [isSwitchMode, router]);

  const handleSelectSection = async (target: "student" | "recruiter" | "post") => {
    if (target === "post") {
      router.push("/post");
      return;
    }

    setIsRouting(true);
    try {
      await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: target })
      });
      router.push(target === "recruiter" ? "/recruiter/dashboard" : "/student/dashboard");
    } catch (e) {
      console.error("Failed to set role:", e);
      router.push(target === "recruiter" ? "/recruiter/dashboard" : "/student/dashboard");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#05060f", color: "white", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", overflowX: "hidden" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes ticker{0%{opacity:0;transform:translateY(8px)}10%{opacity:1;transform:translateY(0)}90%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-8px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.2)}50%{box-shadow:0 0 60px rgba(99,102,241,0.5)}}
        .three-way-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .three-way-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px -15px rgba(99, 102, 241, 0.35);
        }
        a { text-decoration: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); border-radius: 2px; }
      `}</style>

      {/* GRID BACKGROUND */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.025) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "radial-gradient(ellipse 80% 60% at 50% -10%,rgba(99,102,241,0.14) 0%,transparent 70%)", pointerEvents: "none" }} />

      {/* LIVE TICKER */}
      <div style={{ position: "relative", zIndex: 10, background: "rgba(99,102,241,0.1)", borderBottom: "1px solid rgba(99,102,241,0.2)", padding: "7px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 6px #00ff88", animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#00ff88" }}>LIVE</span>
          </div>
          <div key={tick} style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", animation: "ticker 3.2s ease-in-out", letterSpacing: 0.5 }}>
            {TICKER_ITEMS[tick]}
          </div>
        </div>
      </div>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(5,6,15,0.85)", backdropFilter: "blur(24px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#6366f1,#a855f7)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900, animation: "glow 3s ease-in-out infinite" }}>⚡</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: "-0.5px", color: "white" }}>COGNALYZE</div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "rgba(99,102,241,0.7)", marginTop: -2 }}>AI PLACEMENT & RECRUITMENT INTELLIGENCE</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/post">
            <button style={{ padding: "6px 14px", borderRadius: 9, border: "1px solid rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.12)", color: "#d8b4fe", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <span>📢</span>
              <span>Feed / Post</span>
            </button>
          </Link>
          <Link href="/about">
            <button style={{ padding: "6px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
              Docs
            </button>
          </Link>
          {savedRole && (
            <span style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }}>
              Current: <strong style={{ color: "white", textTransform: "capitalize" }}>{savedRole}</strong>
            </span>
          )}
        </div>
      </nav>

      {/* THREE-WAY LANDING ROUTER SECTION */}
      <section style={{ position: "relative", zIndex: 10, padding: "4rem 2rem 2.5rem", maxWidth: 1200, margin: "0 auto", animation: "fadeUp 0.6s ease" }}>
        
        {/* Switching banner indicator if ?switch=true */}
        {isSwitchMode && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: 999, marginBottom: 20 }}>
            <span style={{ fontSize: 13 }}>⇄</span>
            <span style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 700 }}>
              Section Switcher — Choose your workspace destination
            </span>
          </div>
        )}

        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 14px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 999, marginBottom: 16 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#6366f1", animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 10, letterSpacing: 3, color: "rgba(99,102,241,0.9)", fontWeight: 700 }}>CHOOSE YOUR PLATFORM EXPERIENCE</span>
          </div>

          <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 900, letterSpacing: "-2.5px", lineHeight: 1.1, margin: "0 0 1rem", color: "white" }}>
            Welcome to <span style={{ background: "linear-gradient(135deg,#38bdf8,#818cf8,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Cognalyze</span>
          </h1>
          <p style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", color: "rgba(255,255,255,0.6)", maxWidth: 620, margin: "0 auto", lineHeight: 1.6 }}>
            Select your portal to enter. Seamlessly prepare for placements, run adversarial hiring committees, or explore the open community feed.
          </p>
        </div>

        {/* THREE LARGE CLEAR OPTIONS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginBottom: "3rem" }}>
          
          {/* 1. STUDENT CARD */}
          <div
            id="landing-option-student"
            className="three-way-card"
            onClick={() => handleSelectSection("student")}
            style={{
              background: "linear-gradient(180deg, rgba(56, 189, 248, 0.08) 0%, rgba(10, 15, 29, 0.95) 100%)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              borderRadius: 24,
              padding: "2.5rem 2rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, background: "radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
            
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ width: 54, height: 54, borderRadius: 16, background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                  🎓
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, padding: "4px 10px", borderRadius: 6, background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
                  STUDENT PORTAL
                </span>
              </div>

              <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-1px", margin: "0 0 12px", color: "white" }}>
                Student
              </h2>

              <p style={{ fontSize: 15, color: "rgba(255, 255, 255, 0.75)", lineHeight: 1.6, margin: "0 0 24px", minHeight: 48 }}>
                Track opportunities, prep for interviews, build your resume.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {[
                  "Verified Opportunities & Hackathons",
                  "100% Gated 6-Stage Recruitment Sim",
                  "Striver SDE 455 DSA Mastery Tracker",
                  "6-Template Resume Builder & ATS Diagnostics"
                ].map((feat, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255, 255, 255, 0.65)" }}>
                    <span style={{ color: "#38bdf8", fontSize: 14 }}>✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: 14,
                border: "none",
                background: "linear-gradient(135deg, #0284c7, #38bdf8)",
                color: "white",
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: 0.5,
                cursor: "pointer",
                boxShadow: "0 8px 24px -6px rgba(56,189,248,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
            >
              <span>Launch Student Workspace</span>
              <span>→</span>
            </button>
          </div>

          {/* 2. RECRUITER CARD */}
          <div
            id="landing-option-recruiter"
            className="three-way-card"
            onClick={() => handleSelectSection("recruiter")}
            style={{
              background: "linear-gradient(180deg, rgba(168, 85, 247, 0.08) 0%, rgba(10, 15, 29, 0.95) 100%)",
              border: "1px solid rgba(168, 85, 247, 0.25)",
              borderRadius: 24,
              padding: "2.5rem 2rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, background: "radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
            
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ width: 54, height: 54, borderRadius: 16, background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                  💼
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, padding: "4px 10px", borderRadius: 6, background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.3)" }}>
                  ENTERPRISE SUITE
                </span>
              </div>

              <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-1px", margin: "0 0 12px", color: "white" }}>
                Recruiter
              </h2>

              <p style={{ fontSize: 15, color: "rgba(255, 255, 255, 0.75)", lineHeight: 1.6, margin: "0 0 24px", minHeight: 48 }}>
                Manage hiring, screen candidates, run assessments.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {[
                  "5-Agent Adversarial Hiring Committee",
                  "Two-Pass Two-Tier Candidate Ranker",
                  "JD Intelligence & Nuanced Dealbreakers",
                  "Proctored Technical & Behavioral Analytics"
                ].map((feat, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255, 255, 255, 0.65)" }}>
                    <span style={{ color: "#c084fc", fontSize: 14 }}>✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: 14,
                border: "none",
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                color: "white",
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: 0.5,
                cursor: "pointer",
                boxShadow: "0 8px 24px -6px rgba(168,85,247,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
            >
              <span>Launch Recruiter Suite</span>
              <span>→</span>
            </button>
          </div>

          {/* 3. POST CARD */}
          <div
            id="landing-option-post"
            className="three-way-card"
            onClick={() => handleSelectSection("post")}
            style={{
              background: "linear-gradient(180deg, rgba(52, 211, 153, 0.08) 0%, rgba(10, 15, 29, 0.95) 100%)",
              border: "1px solid rgba(52, 211, 153, 0.25)",
              borderRadius: 24,
              padding: "2.5rem 2rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, background: "radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
            
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ width: 54, height: 54, borderRadius: 16, background: "rgba(52, 211, 153, 0.15)", border: "1px solid rgba(52, 211, 153, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                  📢
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, padding: "4px 10px", borderRadius: 6, background: "rgba(52, 211, 153, 0.15)", color: "#34d399", border: "1px solid rgba(52, 211, 153, 0.3)" }}>
                  SHARED COMMUNITY
                </span>
              </div>

              <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-1px", margin: "0 0 12px", color: "white" }}>
                Post
              </h2>

              <p style={{ fontSize: 15, color: "rgba(255, 255, 255, 0.75)", lineHeight: 1.6, margin: "0 0 24px", minHeight: 48 }}>
                Browse hiring posts, opportunities, and community updates.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {[
                  "Hiring Posts with Real Student Fit-Scores",
                  "Recruiter Indicators & Potential Candidate Counts",
                  "Professional Architecture & Interview Debriefs",
                  "Hackathon & Open-Source Collaboration Requests"
                ].map((feat, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255, 255, 255, 0.65)" }}>
                    <span style={{ color: "#34d399", fontSize: 14 }}>✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: 14,
                border: "none",
                background: "linear-gradient(135deg, #059669, #34d399)",
                color: "white",
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: 0.5,
                cursor: "pointer",
                boxShadow: "0 8px 24px -6px rgba(52,211,153,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
            >
              <span>Browse Unified Feed</span>
              <span>→</span>
            </button>
          </div>

        </div>

        {/* Routing progress spinner overlay */}
        {isRouting && (
          <div style={{ textAlign: "center", padding: "1rem", color: "#818cf8", fontSize: 13, fontWeight: 700 }}>
            <span style={{ display: "inline-block", animation: "pulse 1s infinite" }}>⚡ Loading workspace session...</span>
          </div>
        )}
      </section>

      {/* STATS COUNTER BAR */}
      <section style={{ position: "relative", zIndex: 10, borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "3rem 2rem", background: "rgba(99,102,241,0.03)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "2rem" }}>
          <StatCounter value={107} suffix="+" label="Verified Drives & Hackathons" />
          <StatCounter value={5} label="Adversarial AI Agents" />
          <StatCounter value={455} label="Striver DSA Problems" />
          <StatCounter value={100} suffix="%" label="Evidence Gated Scoring" />
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ position: "relative", zIndex: 10, borderTop: "1px solid rgba(255,255,255,0.05)", padding: "2.5rem 2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ fontWeight: 800, color: "white", marginBottom: 6 }}>COGNALYZE PLATFORM</div>
          <div>Adversarial Placement Intelligence & AI Hiring Committee Suite. Built for students, recruiters, and engineering builders.</div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#05060f", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>Initializing Cognalyze...</div>}>
      <HomeContent />
    </Suspense>
  );
}