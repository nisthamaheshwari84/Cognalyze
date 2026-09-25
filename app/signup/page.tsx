"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupChoicePage() {
  const router = useRouter();

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
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block font-semibold text-lg tracking-tight text-white mb-1">
            Cognalyze
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Welcome to Cognalyze
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            Build your professional identity. Discover opportunities. Understand people through their work.
          </p>
        </div>

        {/* Two Options Card Container */}
        <div className="space-y-4">
          {/* 1. STUDENT OPTION */}
          <div
            id="choice-student"
            onClick={() => router.push("/signup/student")}
            className="group rounded-xl p-6 sm:p-7 bg-[#0e131f] border border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer shadow-xl flex items-center justify-between"
          >
            <div className="space-y-1.5 pr-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wide">
                  Candidates & Builders
                </span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-200 transition-colors">
                Continue as Student
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Build your verifiable profile, connect repositories, and discover internships matched to your proof.
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#141b2b] group-hover:bg-indigo-600 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-white transition-all shrink-0">
              →
            </div>
          </div>

          {/* 2. RECRUITER OPTION */}
          <div
            id="choice-recruiter"
            onClick={() => router.push("/signup/recruiter")}
            className="group rounded-xl p-6 sm:p-7 bg-[#0e131f] border border-white/10 hover:border-slate-400 transition-all cursor-pointer shadow-xl flex items-center justify-between"
          >
            <div className="space-y-1.5 pr-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wide">
                  Hiring Teams & Leaders
                </span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-slate-200 transition-colors">
                Continue as Recruiter
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Evaluate engineering candidates through observable code, run Decision Rooms, and hire with context.
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#141b2b] group-hover:bg-slate-200 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-slate-900 transition-all shrink-0">
              →
            </div>
          </div>
        </div>

        {/* Existing account prompt */}
        <p className="text-center text-xs text-slate-400">
          Already have a Cognalyze account?{" "}
          <Link href="/login" className="text-slate-200 hover:text-white font-medium underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
