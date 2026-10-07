"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string>(searchParams.get("token") || searchParams.get("code") || "");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.includes("access_token=")) {
        const match = hash.match(/access_token=([^&]+)/);
        if (match && match[1]) setToken(match[1]);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset token is missing. Please use the link provided in your email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // 1. Try Supabase Auth password update
      const { supabase } = await import("@/lib/supabase");
      const sbRes = await supabase.auth.updateUser({ password });
      if (!sbRes.error) {
        setSuccess(true);
        return;
      }
    } catch {}

    try {
      // 2. Try Cognalyze secure reset token endpoint
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password.");

      setSuccess(true);
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
            Set new password
          </h1>
          <p style={{ color: "#667085" }} className="text-xs sm:text-sm">
            Please choose a secure password with at least 8 characters.
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

          {success ? (
            <div className="space-y-4">
              <div
                style={{
                  backgroundColor: "#EAF4EE",
                  borderColor: "#C8E4D3",
                  color: "#2E7D5B",
                }}
                className="p-4 rounded-lg border text-xs space-y-1"
              >
                <div className="font-bold flex items-center gap-1.5">
                  <span>✓</span> Password reset complete
                </div>
                <p className="text-[11px] opacity-90">
                  Your new password is now active. You can sign in to your Cognalyze workspace.
                </p>
              </div>

              <button
                id="reset-password-login-btn"
                onClick={() => router.push("/login")}
                style={{
                  backgroundColor: "#356AE6",
                  color: "#FFFFFF",
                }}
                className="w-full py-2.5 px-4 rounded-lg hover:bg-[#2858C7] text-xs font-semibold shadow-sm transition-colors cursor-pointer text-center"
              >
                Sign in with new password →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  style={{ color: "#162A43" }}
                  className="block text-xs font-semibold mb-1.5"
                >
                  New password
                </label>
                <input
                  id="reset-new-password"
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
                  Confirm new password
                </label>
                <input
                  id="reset-confirm-password"
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
                id="reset-password-submit"
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: "#356AE6",
                  color: "#FFFFFF",
                }}
                className="w-full py-2.5 px-4 rounded-lg hover:bg-[#2858C7] text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? "Updating password..." : "Reset password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#667085" }} className="flex items-center justify-center font-mono text-xs">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
