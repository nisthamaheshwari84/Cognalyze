"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request password reset.");

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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
            href="/"
            style={{ color: "#162A43" }}
            className="inline-block font-extrabold text-xl tracking-tight mb-1"
          >
            COGNALYZE
          </Link>
          <h1
            style={{ color: "#162A43" }}
            className="text-2xl sm:text-3xl font-bold tracking-tight"
          >
            Reset your password
          </h1>
          <p style={{ color: "#667085" }} className="text-xs sm:text-sm">
            Enter your email address and we&apos;ll send you a link to reset your password.
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
          {error && (
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

          {submitted ? (
            <div className="space-y-4">
              <div
                style={{
                  backgroundColor: "#F0FDF4",
                  borderColor: "#BBF7D0",
                  color: "#166534",
                }}
                className="p-4 rounded-lg border text-xs space-y-1"
              >
                <div className="font-bold flex items-center gap-1.5">
                  <span>✉️</span> Password reset link dispatched
                </div>
                <p className="text-[11px] leading-relaxed text-slate-700">
                  If an account exists with <strong>{email}</strong>, a secure password reset link has been sent. Please check your inbox and Spam folder.
                </p>
              </div>

              <p style={{ color: "#667085" }} className="text-xs text-center">
                Didn&apos;t get the email? Check your spam folder or try again with a different email.
              </p>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  style={{
                    backgroundColor: "#F6F5F1",
                    borderColor: "#E4E1DA",
                    color: "#17191C",
                  }}
                  className="w-full py-2.5 px-4 rounded-lg border hover:bg-[#E4E1DA] text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  Try another email
                </button>
                <Link
                  href="/login"
                  style={{
                    backgroundColor: "#356AE6",
                    color: "#FFFFFF",
                  }}
                  className="w-full py-2.5 px-4 rounded-lg hover:bg-[#2858C7] text-xs font-semibold shadow-sm transition-colors cursor-pointer text-center"
                >
                  Return to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  style={{ color: "#162A43" }}
                  className="block text-xs font-semibold mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="forgot-password-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
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
                id="forgot-password-submit"
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: "#356AE6",
                  color: "#FFFFFF",
                }}
                className="w-full py-2.5 px-4 rounded-lg hover:bg-[#2858C7] text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? "Sending link..." : "Send reset link"}
              </button>

              <div className="pt-1 text-center">
                <Link
                  href="/login"
                  style={{ color: "#356AE6" }}
                  className="text-xs hover:underline font-semibold"
                >
                  ← Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
