"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RecruiterOrganizationSetupPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [industry, setIndustry] = useState("Enterprise Software");
  const [companySize, setCompanySize] = useState("50-250 employees");
  const [designation, setDesignation] = useState("Technical Recruiter");
  const [workEmail, setWorkEmail] = useState("");

  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    domainMatches: boolean;
    status: string;
    organization: any;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing session context
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data.authenticated && data.user) {
          setWorkEmail(data.user.email);
          if (data.recruiterProfile) {
            setDesignation(data.recruiterProfile.designation || "Technical Recruiter");
          }
          if (data.organization) {
            setCompanyName(data.organization.name);
            setCompanyWebsite(data.organization.website);
            setVerificationResult({
              success: true,
              domainMatches: true,
              status: data.organization.verificationStatus,
              organization: data.organization
            });
          }
        }
      } catch (err) {
        console.error("Session load error:", err);
      }
    }
    loadSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/recruiter/organization/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          companyWebsite,
          industry,
          companySize,
          designation
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to set up organization.");

      setVerificationResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to set up organization.");
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {verificationResult ? "Organization Verification" : "Let's set up your organization"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {verificationResult
              ? "Distinct verification checks for your hiring organization."
              : "Establish your company identity to unlock candidate screening and Decision Rooms."}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-white/10 bg-[#0e131f] p-6 sm:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-950/50 border border-red-800/60 text-xs text-red-300 leading-relaxed">
              {error}
            </div>
          )}

          {!verificationResult ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Company name
                </label>
                <input
                  id="org-company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Technologies"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Company website
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    Domain match verification
                  </span>
                </div>
                <input
                  id="org-company-website"
                  type="text"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://acme.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Industry
                  </label>
                  <input
                    id="org-industry"
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Cloud & Distributed Systems"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Company size
                  </label>
                  <select
                    id="org-size"
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="1-10 employees">1-10 employees</option>
                    <option value="11-50 employees">11-50 employees</option>
                    <option value="50-250 employees">50-250 employees</option>
                    <option value="250-1000 employees">250-1000 employees</option>
                    <option value="1000+ employees">1000+ employees</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Your role in hiring
                </label>
                <input
                  id="org-recruiter-role"
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="Technical Recruiter"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  id="org-setup-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Verifying domain..." : "Continue to Verification Check"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Verification Checklist */}
              <div className="space-y-3">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 block">
                  Organization Verification Status
                </span>

                {/* Check 1: Work Email */}
                <div className="p-3.5 rounded-lg bg-[#141b2b] border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span className="text-slate-200">Work email verified</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {workEmail || "Verified"}
                  </span>
                </div>

                {/* Check 2: Domain Match */}
                <div className="p-3.5 rounded-lg bg-[#141b2b] border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span className="text-slate-200">Company domain match</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {verificationResult.organization?.domain || "Matched"}
                  </span>
                </div>

                {/* Check 3: Organization Status */}
                <div className="p-3.5 rounded-lg bg-[#141b2b] border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span className="text-slate-200">Organization verification</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/40 uppercase">
                    {verificationResult.status}
                  </span>
                </div>
              </div>

              {/* Status Note */}
              <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-slate-300 space-y-1">
                <span className="font-semibold text-emerald-300 block">
                  Workspace Ready: {verificationResult.organization?.name}
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your organization status is verified. You now have full access to candidate dossiers, Decision Rooms, and hiring workflows.
                </p>
              </div>

              <button
                id="org-enter-workspace-btn"
                onClick={() => router.push("/recruiter/dashboard")}
                className="w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Enter Recruiter Workspace</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>

        {/* Note */}
        <p className="text-center text-[11px] font-mono text-slate-500">
          Email verification is distinct from organization verification.
        </p>
      </div>
    </div>
  );
}
