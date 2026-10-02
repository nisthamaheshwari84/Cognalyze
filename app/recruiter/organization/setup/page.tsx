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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-canvas)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      }}
      className="flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative overflow-hidden"
    >
      <div className="w-full max-w-lg relative z-10 space-y-8">
        {/* Brand */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            style={{ color: "var(--accent)" }}
            className="inline-block font-semibold text-lg tracking-tight mb-1"
          >
            Cognalyze
          </Link>
          <h1
            style={{ color: "var(--text-primary)" }}
            className="text-2xl sm:text-3xl font-bold tracking-tight"
          >
            {verificationResult ? "Organization Verification" : "Let's set up your organization"}
          </h1>
          <p style={{ color: "var(--text-secondary)" }} className="text-xs sm:text-sm">
            {verificationResult
              ? "Distinct verification checks for your hiring organization."
              : "Establish your company identity to unlock candidate screening and Decision Rooms."}
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
          }}
          className="rounded-xl border p-6 sm:p-8 space-y-6"
        >
          {error && (
            <div
              style={{
                backgroundColor: "var(--color-error-bg)",
                borderColor: "var(--color-error)",
                color: "var(--color-error)",
              }}
              className="p-3.5 rounded-lg border text-xs leading-relaxed"
            >
              {error}
            </div>
          )}

          {!verificationResult ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label style={{ color: "var(--text-secondary)" }} className="block text-xs font-semibold mb-1.5">
                  Company name
                </label>
                <input
                  id="org-company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Technologies"
                  required
                  style={{
                    backgroundColor: "var(--bg-surface-inner)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label style={{ color: "var(--text-secondary)" }} className="text-xs font-semibold">
                    Company website
                  </label>
                  <span style={{ color: "var(--text-muted)" }} className="text-[10px] font-mono">
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
                  style={{
                    backgroundColor: "var(--bg-surface-inner)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label style={{ color: "var(--text-secondary)" }} className="block text-xs font-semibold mb-1.5">
                    Industry
                  </label>
                  <input
                    id="org-industry"
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Cloud & Distributed Systems"
                    style={{
                      backgroundColor: "var(--bg-surface-inner)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors"
                  />
                </div>

                <div>
                  <label style={{ color: "var(--text-secondary)" }} className="block text-xs font-semibold mb-1.5">
                    Company size
                  </label>
                  <select
                    id="org-size"
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    style={{
                      backgroundColor: "var(--bg-surface-inner)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors"
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
                <label style={{ color: "var(--text-secondary)" }} className="block text-xs font-semibold mb-1.5">
                  Your role in hiring
                </label>
                <input
                  id="org-recruiter-role"
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="Technical Recruiter"
                  required
                  style={{
                    backgroundColor: "var(--bg-surface-inner)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  id="org-setup-submit"
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "#FFFFFF",
                  }}
                  className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 hover:opacity-90"
                >
                  {loading ? "Verifying domain..." : "Continue to Verification Check"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Verification Checklist */}
              <div className="space-y-3">
                <span style={{ color: "var(--text-muted)" }} className="text-xs font-mono font-semibold uppercase tracking-wider block">
                  Organization Verification Status
                </span>

                {/* Check 1: Work Email */}
                <div
                  style={{
                    backgroundColor: "var(--bg-surface-inner)",
                    borderColor: "var(--border-subtle)",
                  }}
                  className="p-3.5 rounded-lg border flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span style={{ color: "var(--color-success)" }} className="font-bold">✓</span>
                    <span style={{ color: "var(--text-primary)" }}>Work email verified</span>
                  </div>
                  <span style={{ color: "var(--color-success)" }} className="text-[11px] font-mono font-semibold">
                    {workEmail || "Verified"}
                  </span>
                </div>

                {/* Check 2: Domain Match */}
                <div
                  style={{
                    backgroundColor: "var(--bg-surface-inner)",
                    borderColor: "var(--border-subtle)",
                  }}
                  className="p-3.5 rounded-lg border flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span style={{ color: verificationResult.domainMatches ? "var(--color-success)" : "var(--color-warning)" }} className="font-bold">
                      {verificationResult.domainMatches ? "✓" : "⚠"}
                    </span>
                    <span style={{ color: "var(--text-primary)" }}>Company domain match</span>
                  </div>
                  <span
                    style={{ color: verificationResult.domainMatches ? "var(--color-success)" : "var(--color-warning)" }}
                    className="text-[11px] font-mono font-semibold"
                  >
                    {verificationResult.domainMatches ? (verificationResult.organization?.domain || "Matched") : "Domain Mismatch"}
                  </span>
                </div>

                {/* Check 3: Organization Status */}
                <div
                  style={{
                    backgroundColor: "var(--bg-surface-inner)",
                    borderColor: "var(--border-subtle)",
                  }}
                  className="p-3.5 rounded-lg border flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span style={{ color: verificationResult.status === "ACTIVE" ? "var(--color-success)" : "var(--color-warning)" }} className="font-bold">
                      {verificationResult.status === "ACTIVE" ? "✓" : "●"}
                    </span>
                    <span style={{ color: "var(--text-primary)" }}>Verification state</span>
                  </div>
                  <span
                    style={{
                      backgroundColor: verificationResult.status === "ACTIVE" ? "var(--color-success-bg)" : "var(--color-warning-bg)",
                      color: verificationResult.status === "ACTIVE" ? "var(--color-success)" : "var(--color-warning)",
                      borderColor: verificationResult.status === "ACTIVE" ? "var(--color-success)" : "var(--color-warning)",
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-mono uppercase border font-semibold"
                  >
                    {verificationResult.status === "ACTIVE" ? "VERIFIED" : "MANUAL REVIEW"}
                  </span>
                </div>
              </div>

              {/* Status Note */}
              {verificationResult.status === "ACTIVE" ? (
                <div
                  style={{
                    backgroundColor: "var(--color-success-bg)",
                    borderColor: "var(--color-success)",
                  }}
                  className="p-4 rounded-lg border text-xs space-y-1"
                >
                  <span style={{ color: "var(--color-success)" }} className="font-semibold block">
                    Workspace Verified: {verificationResult.organization?.name}
                  </span>
                  <p style={{ color: "var(--text-secondary)" }} className="text-[11px] leading-relaxed">
                    Your organization domain is verified. You now have full access to candidate screening and hiring workflows.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: "var(--color-warning-bg)",
                    borderColor: "var(--color-warning)",
                  }}
                  className="p-4 rounded-lg border text-xs space-y-1"
                >
                  <span style={{ color: "var(--color-warning)" }} className="font-semibold block">
                    Submission Under Compliance Review
                  </span>
                  <p style={{ color: "var(--text-secondary)" }} className="text-[11px] leading-relaxed">
                    Your company domain differs from your work email domain or requires independent substantiation. Our team has received your submission for manual review.
                  </p>
                </div>
              )}

              {verificationResult.status === "ACTIVE" ? (
                <button
                  id="org-enter-workspace-btn"
                  onClick={() => router.push("/recruiter/dashboard")}
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "#FFFFFF",
                  }}
                  className="w-full py-3 px-4 rounded-lg text-xs font-semibold shadow-sm transition-opacity hover:opacity-90 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Enter Recruiter Workspace</span>
                  <span>→</span>
                </button>
              ) : (
                <button
                  onClick={() => setVerificationResult(null)}
                  style={{
                    backgroundColor: "var(--bg-surface-inner)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                  className="w-full py-3 px-4 rounded-lg border text-xs font-semibold shadow-sm transition-opacity hover:opacity-90 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Edit Company Details</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Note */}
        <p style={{ color: "var(--text-muted)" }} className="text-center text-[11px] font-mono">
          Email verification is distinct from organization verification.
        </p>
      </div>
    </div>
  );
}
