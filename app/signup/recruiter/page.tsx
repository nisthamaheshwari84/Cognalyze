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
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingState, setExistingState] = useState<"EXISTS" | "UNVERIFIED" | null>(null);
  const [unverifiedUserId, setUnverifiedUserId] = useState<string | null>(null);

  // Live generic domain warning
  const isGeneric = workEmail.includes("@") && isGenericEmailDomain(workEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExistingState(null);

    if (isGeneric) {
      setError("Please use your company email address. Recruiter accounts require a verified work email.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
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
      if (!res.ok) {
        if (data.code === "ACCOUNT_EXISTS") {
          setExistingState("EXISTS");
          throw new Error("An account already exists with this email.");
        }
        if (data.code === "ACCOUNT_EXISTS_UNVERIFIED") {
          setExistingState("UNVERIFIED");
          setUnverifiedUserId(data.userId || null);
          throw new Error("Your account exists but your email hasn't been verified yet.");
        }
        throw new Error(data.error || "Failed to create recruiter account.");
      }

      router.push(data.nextUrl || "/verify-email?role=recruiter");
    } catch (err: any) {
      setError(err.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendForUnverified = async () => {
    setResending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: unverifiedUserId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend verification code.");
      router.push("/verify-email?role=recruiter");
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code.");
    } finally {
      setResending(false);
    }
  };

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
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            href="/signup"
            style={{ color: "#356AE6" }}
            className="inline-block text-xs font-mono font-semibold hover:underline transition-colors mb-1"
          >
            ← Back to choices
          </Link>
          <h1
            style={{ color: "#162A43" }}
            className="text-2xl sm:text-3xl font-bold tracking-tight"
          >
            Create your recruiter account
          </h1>
          <p style={{ color: "#667085" }} className="text-xs sm:text-sm">
            Hire with context through verifiable engineering evidence.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: "#E4E1DA",
            boxShadow: "0 4px 20px rgba(22, 42, 67, 0.06)",
          }}
          className="rounded-xl border p-6 sm:p-8 space-y-6"
        >
          {error && !existingState && (
            <div
              style={{
                backgroundColor: "#FDF2F2",
                borderColor: "#F8C8C8",
                color: "#C24141",
              }}
              className="p-3.5 rounded-lg border text-xs leading-relaxed"
            >
              {error}
            </div>
          )}

          {/* Section 5: Specific Existing Email State Cards */}
          {existingState === "EXISTS" && (
            <div
              style={{
                backgroundColor: "#EFF4FE",
                borderColor: "#D2E0FB",
                color: "#162A43",
              }}
              className="p-4 rounded-xl border space-y-3 text-xs"
            >
              <div className="font-bold flex items-center gap-1.5 text-sm text-[#1E40AF]">
                <span>ℹ️</span> An account already exists with this email.
              </div>
              <p className="text-slate-600 leading-relaxed">
                You already have a recruiter account registered with <strong>{workEmail}</strong>. Please sign in to access your organization workspace.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  style={{
                    backgroundColor: "#356AE6",
                    color: "#FFFFFF",
                  }}
                  className="flex-1 py-2 px-3 rounded-lg hover:bg-[#2858C7] text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Sign in instead
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#D2E0FB",
                    color: "#1E40AF",
                  }}
                  className="py-2 px-3 rounded-lg border hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </div>
          )}

          {existingState === "UNVERIFIED" && (
            <div
              style={{
                backgroundColor: "#FFFBEB",
                borderColor: "#FDE68A",
                color: "#92400E",
              }}
              className="p-4 rounded-xl border space-y-3 text-xs"
            >
              <div className="font-bold flex items-center gap-1.5 text-sm text-[#B45309]">
                <span>⚠️</span> Work email verification pending
              </div>
              <p className="text-amber-800 leading-relaxed">
                Your recruiter account exists with <strong>{workEmail}</strong>, but your company email hasn&apos;t been verified yet.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => router.push("/verify-email?role=recruiter")}
                  style={{
                    backgroundColor: "#D97706",
                    color: "#FFFFFF",
                  }}
                  className="flex-1 py-2 px-3 rounded-lg hover:bg-[#B45309] text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Continue verification
                </button>
                <button
                  type="button"
                  onClick={handleResendForUnverified}
                  disabled={resending}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#FDE68A",
                    color: "#92400E",
                  }}
                  className="py-2 px-3 rounded-lg border hover:bg-amber-50 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend code"}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                style={{ color: "#162A43" }}
                className="block text-xs font-semibold mb-1.5"
              >
                Full name
              </label>
              <input
                id="recruiter-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Aarav Sharma"
                required
                style={{
                  backgroundColor: "#FAFAF8",
                  borderColor: "#E4E1DA",
                  color: "#17191C",
                }}
                className="w-full px-3.5 py-2.5 rounded-lg border placeholder-slate-400 text-sm focus:outline-none focus:border-[#356AE6] transition-colors"
              />
            </div>

            <div>
              <label
                style={{ color: "#162A43" }}
                className="block text-xs font-semibold mb-1.5"
              >
                Work email address
              </label>
              <input
                id="recruiter-email"
                type="email"
                value={workEmail}
                onChange={(e) => setWorkEmail(e.target.value)}
                placeholder="aarav@acme.com"
                required
                style={{
                  backgroundColor: "#FAFAF8",
                  borderColor: isGeneric ? "#F8C8C8" : "#E4E1DA",
                  color: "#17191C",
                }}
                className="w-full px-3.5 py-2.5 rounded-lg border placeholder-slate-400 text-sm focus:outline-none focus:border-[#356AE6] transition-colors"
              />
              {isGeneric && (
                <p style={{ color: "#C24141" }} className="text-[11px] mt-1">
                  Please use your corporate work email (e.g. name@company.com). Public mail providers are not permitted for recruiter accounts.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  style={{ color: "#162A43" }}
                  className="block text-xs font-semibold mb-1.5"
                >
                  Company
                </label>
                <input
                  id="recruiter-company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc."
                  required
                  style={{
                    backgroundColor: "#FAFAF8",
                    borderColor: "#E4E1DA",
                    color: "#17191C",
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border placeholder-slate-400 text-sm focus:outline-none focus:border-[#356AE6] transition-colors"
                />
              </div>

              <div>
                <label
                  style={{ color: "#162A43" }}
                  className="block text-xs font-semibold mb-1.5"
                >
                  Designation
                </label>
                <input
                  id="recruiter-designation"
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="Tech Recruiter"
                  required
                  style={{
                    backgroundColor: "#FAFAF8",
                    borderColor: "#E4E1DA",
                    color: "#17191C",
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border placeholder-slate-400 text-sm focus:outline-none focus:border-[#356AE6] transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                style={{ color: "#162A43" }}
                className="block text-xs font-semibold mb-1.5"
              >
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
                style={{
                  backgroundColor: "#FAFAF8",
                  borderColor: "#E4E1DA",
                  color: "#17191C",
                }}
                className="w-full px-3.5 py-2.5 rounded-lg border placeholder-slate-400 text-sm focus:outline-none focus:border-[#356AE6] transition-colors"
              />
            </div>

            <div>
              <label
                style={{ color: "#162A43" }}
                className="block text-xs font-semibold mb-1.5"
              >
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
                style={{
                  backgroundColor: "#FAFAF8",
                  borderColor: "#E4E1DA",
                  color: "#17191C",
                }}
                className="w-full px-3.5 py-2.5 rounded-lg border placeholder-slate-400 text-sm focus:outline-none focus:border-[#356AE6] transition-colors"
              />
            </div>

            <button
              id="recruiter-signup-submit"
              type="submit"
              disabled={loading || isGeneric}
              style={{
                backgroundColor: "#356AE6",
                color: "#FFFFFF",
              }}
              className="w-full py-2.5 px-4 rounded-lg hover:bg-[#2858C7] text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Creating recruiter account..." : "Continue to work email verification"}
            </button>
          </form>
        </div>

        {/* Existing account prompt */}
        <p style={{ color: "#667085" }} className="text-center text-xs">
          Already have an account?{" "}
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
