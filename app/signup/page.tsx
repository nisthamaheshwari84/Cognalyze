"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupChoicePage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F6F5F1",
        color: "#17191C",
        fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      }}
      className="flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative overflow-hidden"
    >
      <div className="w-full max-w-lg relative z-10 space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            style={{ color: "#162A43" }}
            className="inline-block font-extrabold text-xl tracking-tight mb-1"
          >
            COGNALYZE
          </Link>
          <h1
            style={{ color: "#162A43" }}
            className="text-3xl sm:text-4xl font-bold tracking-tight"
          >
            Welcome to Cognalyze
          </h1>
          <p style={{ color: "#667085" }} className="text-sm max-w-sm mx-auto leading-relaxed">
            Build your verifiable professional identity. Discover opportunities. Understand talent through verified evidence.
          </p>
        </div>

        {/* Two Options Card Container */}
        <div className="space-y-4">
          {/* 1. STUDENT OPTION */}
          <div
            id="choice-student"
            onClick={() => router.push("/signup/student")}
            style={{
              backgroundColor: "#FFFFFF",
              borderColor: "#E4E1DA",
              boxShadow: "0 2px 12px rgba(22, 42, 67, 0.04)",
            }}
            className="group rounded-xl p-6 sm:p-7 border hover:border-[#356AE6] transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="space-y-1.5 pr-4">
              <div className="flex items-center gap-2">
                <span
                  style={{
                    backgroundColor: "#EFF4FE",
                    color: "#356AE6",
                    borderColor: "#D2E0FB",
                  }}
                  className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                >
                  Candidates & Builders
                </span>
              </div>
              <h3
                style={{ color: "#162A43" }}
                className="text-lg font-bold group-hover:text-[#356AE6] transition-colors"
              >
                Continue as Student
              </h3>
              <p style={{ color: "#667085" }} className="text-xs leading-relaxed max-w-sm">
                Build your verifiable profile, connect repositories, and discover internships matched to your evidence.
              </p>
            </div>
            <div
              style={{
                backgroundColor: "#EFF4FE",
                borderColor: "#D2E0FB",
                color: "#356AE6",
              }}
              className="w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-base transition-all shrink-0 group-hover:bg-[#356AE6] group-hover:text-white"
            >
              →
            </div>
          </div>

          {/* 2. RECRUITER OPTION */}
          <div
            id="choice-recruiter"
            onClick={() => router.push("/signup/recruiter")}
            style={{
              backgroundColor: "#FFFFFF",
              borderColor: "#E4E1DA",
              boxShadow: "0 2px 12px rgba(22, 42, 67, 0.04)",
            }}
            className="group rounded-xl p-6 sm:p-7 border hover:border-[#162A43] transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="space-y-1.5 pr-4">
              <div className="flex items-center gap-2">
                <span
                  style={{
                    backgroundColor: "#F6F5F1",
                    color: "#162A43",
                    borderColor: "#E4E1DA",
                  }}
                  className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                >
                  Hiring Teams & Leaders
                </span>
              </div>
              <h3
                style={{ color: "#162A43" }}
                className="text-lg font-bold group-hover:text-[#162A43] transition-colors"
              >
                Continue as Recruiter
              </h3>
              <p style={{ color: "#667085" }} className="text-xs leading-relaxed max-w-sm">
                Evaluate engineering candidates through observable code, run Decision Rooms, and hire with verified context.
              </p>
            </div>
            <div
              style={{
                backgroundColor: "#F6F5F1",
                borderColor: "#E4E1DA",
                color: "#162A43",
              }}
              className="w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-base transition-all shrink-0 group-hover:bg-[#162A43] group-hover:text-white"
            >
              →
            </div>
          </div>
        </div>

        {/* Existing account prompt */}
        <p style={{ color: "#667085" }} className="text-center text-xs">
          Already have a Cognalyze account?{" "}
          <Link
            href="/login"
            style={{ color: "#356AE6" }}
            className="hover:underline font-semibold"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
