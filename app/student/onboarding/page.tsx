"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StudentOnboardingPage() {
  const router = useRouter();

  // Multi-step flow: 1: Details -> 2: Username -> 3: Complete
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 State: Profile Details
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [degree, setDegree] = useState("");
  const [graduationYear, setGraduationYear] = useState("2026");
  const [primaryInterests, setPrimaryInterests] = useState<string[]>([
    "Distributed Systems",
    "Backend Engineering"
  ]);
  const [interestInput, setInterestInput] = useState("");

  // Step 2 State: Username Selection & Debounce
  const [username, setUsername] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    available: boolean;
    normalized?: string;
    reason?: string;
    suggestions?: string[];
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-load session info
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data.authenticated && data.studentProfile) {
          // If profile already exists, proceed to dashboard
          router.push("/student/dashboard");
        }
      } catch (err) {
        console.error("Session load error:", err);
      }
    }
    loadSession();
  }, [router]);

  // Debounced username availability checker
  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus(null);
      return;
    }

    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/username-check?username=${encodeURIComponent(username.trim())}`);
        const data = await res.json();
        setUsernameStatus(data);
      } catch (err) {
        console.error("Username check error:", err);
      } finally {
        setCheckingUsername(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username]);

  const handleAddInterest = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && interestInput.trim()) {
      e.preventDefault();
      if (!primaryInterests.includes(interestInput.trim())) {
        setPrimaryInterests([...primaryInterests, interestInput.trim()]);
      }
      setInterestInput("");
    }
  };

  const handleRemoveInterest = (item: string) => {
    setPrimaryInterests(primaryInterests.filter((i) => i !== item));
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please provide your full name.");
      return;
    }
    setError(null);
    // Suggest initial username based on full name if empty
    if (!username) {
      const suggested = fullName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15);
      setUsername(suggested);
    }
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    if (!usernameStatus?.available) {
      setError("Please choose a valid and available username.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/student/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          username: usernameStatus.normalized || username,
          college,
          degree,
          graduationYear,
          primaryInterests
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create profile.");

      setStep(3);
    } catch (err: any) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative overflow-hidden font-sans">
      {/* Background Grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px"
        }}
      />

      <div className="w-full max-w-lg relative z-10 space-y-8">
        {/* Brand */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block font-semibold text-lg tracking-tight text-white mb-1">
            Cognalyze
          </Link>

          {step === 1 && (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Let&apos;s build your Cognalyze profile
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Tell us about your background to help us surface the right opportunities.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Choose your Cognalyze username
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                This will be your permanent public identity on Cognalyze.
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl mx-auto mb-2">
                ✓
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Your Cognalyze identity is ready
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Identity created and verified.
              </p>
            </>
          )}
        </div>

        {/* Card */}
        <div className="rounded-xl border border-white/10 bg-[#0e131f] p-6 sm:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-950/50 border border-red-800/60 text-xs text-red-300 leading-relaxed">
              {error}
            </div>
          )}

          {/* STEP 1: Details */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full name
                </label>
                <input
                  id="onboarding-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nistha Maheshwari"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  College / University
                </label>
                <input
                  id="onboarding-college"
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="BMS College of Engineering"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Degree & Major
                  </label>
                  <input
                    id="onboarding-degree"
                    type="text"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    placeholder="B.Tech CS & AI"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Graduation year
                  </label>
                  <input
                    id="onboarding-gradyear"
                    type="text"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="2026"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Primary technical interests
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {primaryInterests.map((interest) => (
                    <span
                      key={interest}
                      className="px-2.5 py-1 rounded-md text-xs bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 flex items-center gap-1.5"
                    >
                      <span>{interest}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(interest)}
                        className="text-indigo-400 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={handleAddInterest}
                  placeholder="Type an interest and press Enter (e.g. Distributed Systems, GenAI)"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                id="onboarding-step1-continue"
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                Continue to Username Selection →
              </button>
            </form>
          )}

          {/* STEP 2: Username Picker */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono text-sm">
                    @
                  </span>
                  <input
                    id="onboarding-username-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                    placeholder="nistha"
                    autoFocus
                    className="w-full pl-8 pr-10 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  {checkingUsername && (
                    <span className="absolute right-3.5 top-3 text-[10px] text-slate-400 font-mono">
                      Checking...
                    </span>
                  )}
                </div>

                {/* Availability Feedback Strip */}
                {usernameStatus && !checkingUsername && (
                  <div className="mt-2 text-xs">
                    {usernameStatus.available ? (
                      <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 flex items-center gap-2">
                        <span className="font-bold">✓</span>
                        <span>@{usernameStatus.normalized} is available</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 flex items-center gap-2">
                          <span className="font-bold">✕</span>
                          <span>{usernameStatus.reason || "Username is not available."}</span>
                        </div>

                        {usernameStatus.suggestions && usernameStatus.suggestions.length > 0 && (
                          <div className="text-[11px] text-slate-400 space-y-1">
                            <span>Suggestions:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {usernameStatus.suggestions.map((sug) => (
                                <button
                                  key={sug}
                                  type="button"
                                  onClick={() => setUsername(sug)}
                                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-indigo-300 border border-white/10 font-mono text-[11px] cursor-pointer"
                                >
                                  @{sug}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Public URL Preview */}
              <div className="p-3.5 rounded-lg bg-[#0a0d16] border border-white/5 space-y-1 text-xs font-mono">
                <span className="text-slate-500 block uppercase text-[10px]">Your public Cognalyze profile</span>
                <span className="text-slate-300">
                  cognalyze.com/@{usernameStatus?.normalized || username || "your-username"}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  id="onboarding-username-submit"
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading || !usernameStatus?.available}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Creating identity..." : "Continue"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Ready */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="p-5 rounded-lg bg-[#141b2b] border border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#1a2235] border border-white/10 flex items-center justify-center text-slate-100 font-semibold text-sm">
                    {fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{fullName}</h3>
                    <span className="text-xs font-mono text-indigo-400">@{username}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 border-t border-white/5 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">College:</span>
                    <span>{college || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Degree:</span>
                    <span>{degree || "Computer Science"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-emerald-400 font-mono">Identity Verified</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300">
                <span className="text-indigo-300 font-semibold block mb-0.5">Next step: Progressive Profile</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Connect your GitHub repositories to start building verifiable technical evidence for hiring teams.
                </p>
              </div>

              <button
                id="onboarding-complete-btn"
                type="button"
                onClick={() => router.push("/student/dashboard")}
                className="w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Continue to your profile →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
