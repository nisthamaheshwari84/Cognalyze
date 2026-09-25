"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isGenericEmailDomain } from "@/lib/auth/security";

export default function RecruiterSignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [company, setCompany] = useState("");
  const [designation, setDesignation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live generic domain warning
  const isGeneric = workEmail.includes("@") && isGenericEmailDomain(workEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isGeneric) {
      setError("Please use your company email address. Recruiter accounts require a verified work email.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email: workEmail,
          company,
          designation,
          password,
          confirmPassword,
          accountType: "recruiter"
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create recruiter account.");

      router.push(data.nextUrl || "/verify-email?role=recruiter");
    } catch (err: any) {
      setError(err.message || "An error occurred during registration.");
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

      <div className="w-full max-w-md relative z-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/signup" className="inline-block text-xs font-mono text-slate-400 hover:text-slate-300 transition-colors mb-1">
            ← Back to choices
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Create your recruiter account
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Hire with context through verifiable engineering evidence.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-white/10 bg-[#0e131f] p-6 sm:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-950/50 border border-red-800/60 text-xs text-red-300 leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full name
              </label>
              <input
                id="recruiter-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Aarav Sharma"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Work email
                </label>
                <span className="text-[10px] font-mono text-indigo-400 uppercase">
                  Company domain required
                </span>
              </div>
              <input
                id="recruiter-workemail"
                type="email"
                value={workEmail}
                onChange={(e) => setWorkEmail(e.target.value)}
                placeholder="recruiter@company.com"
                required
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border text-white placeholder-slate-500 text-sm focus:outline-none transition-colors ${
                  isGeneric
                    ? "border-red-500/80 focus:border-red-500"
                    : "border-white/10 focus:border-indigo-500"
                }`}
              />
              {isGeneric && (
                <p className="text-[11px] text-red-400 mt-1.5 leading-tight">
                  Please use your company email address. Recruiter accounts require a verified work email.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Company name
                </label>
                <input
                  id="recruiter-company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Tech"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Your designation
                </label>
                <input
                  id="recruiter-designation"
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="Talent Lead"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password (min 8 characters)
              </label>
              <input
                id="recruiter-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Confirm password
              </label>
              <input
                id="recruiter-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <button
              id="recruiter-signup-submit"
              type="submit"
              disabled={loading || isGeneric}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Continue to Email Verification"}
            </button>
          </form>
        </div>

        {/* Existing account prompt */}
        <p className="text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-slate-200 hover:text-white font-medium underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
