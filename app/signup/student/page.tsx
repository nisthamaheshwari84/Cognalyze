"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StudentSignupPage() {
  const router = useRouter();
  const [method, setMethod] = useState<"choice" | "email">("choice");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Account Linking Modal State
  const [linkingData, setLinkingData] = useState<{
    existingUser: any;
    provider: string;
    providerUserId: string;
    providerEmail: string;
  } | null>(null);
  const [linkingLoading, setLinkingLoading] = useState(false);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
          email,
          password,
          confirmPassword,
          accountType: "student"
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create student account.");

      router.push(data.nextUrl || "/verify-email?role=student");
    } catch (err: any) {
      setError(err.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "github" | "linkedin") => {
    setError(null);
    setOauthLoading(provider);

    try {
      const providerUserId = `${provider}_std_${Math.random().toString(36).substring(2, 9)}`;
      const providerEmail = email.trim() || `candidate_${Math.random().toString(36).substring(2, 6)}@gmail.com`;

      const res = await fetch("/api/auth/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          providerUserId,
          providerEmail,
          providerName: fullName.trim() || "Student Builder"
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OAuth sign up failed.");

      if (data.status === "LINK_CONFIRMATION_REQUIRED") {
        setLinkingData({
          existingUser: data.existingUser,
          provider: data.provider,
          providerUserId: data.providerUserId,
          providerEmail: data.providerEmail
        });
      } else {
        router.push(data.nextUrl || "/student/onboarding");
      }
    } catch (err: any) {
      setError(err.message || "Failed to authenticate with third-party provider.");
    } finally {
      setOauthLoading(null);
    }
  };

  const handleConfirmLink = async () => {
    if (!linkingData) return;
    setLinkingLoading(true);

    try {
      const res = await fetch("/api/auth/link-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: linkingData.existingUser.id,
          provider: linkingData.provider,
          providerUserId: linkingData.providerUserId,
          providerEmail: linkingData.providerEmail
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to link account.");

      router.push(data.nextUrl || "/student/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to link account.");
    } finally {
      setLinkingLoading(false);
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
          <Link href="/signup" className="inline-block text-xs font-mono text-indigo-400 hover:text-indigo-300 transition-colors mb-1">
            ← Back to choices
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Create your student profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Build proof. Connect repositories. Discover matched opportunities.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-white/10 bg-[#0e131f] p-6 sm:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-950/50 border border-red-800/60 text-xs text-red-300 leading-relaxed">
              {error}
            </div>
          )}

          {method === "choice" ? (
            <div className="space-y-3">
              <button
                id="student-oauth-github"
                type="button"
                onClick={() => handleOAuth("github")}
                disabled={oauthLoading !== null}
                className="w-full py-3 px-4 rounded-lg bg-[#141b2b] hover:bg-[#1a2338] border border-white/10 text-slate-200 text-xs font-medium flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>{oauthLoading === "github" ? "Connecting GitHub..." : "Continue with GitHub"}</span>
              </button>

              <button
                id="student-oauth-linkedin"
                type="button"
                onClick={() => handleOAuth("linkedin")}
                disabled={oauthLoading !== null}
                className="w-full py-3 px-4 rounded-lg bg-[#141b2b] hover:bg-[#1a2338] border border-white/10 text-slate-200 text-xs font-medium flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-[#0a66c2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
                <span>{oauthLoading === "linkedin" ? "Connecting LinkedIn..." : "Continue with LinkedIn"}</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-mono">
                  <span className="bg-[#0e131f] px-3 text-slate-500">Or</span>
                </div>
              </div>

              <button
                id="student-email-choice-btn"
                type="button"
                onClick={() => setMethod("email")}
                className="w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Continue with Email
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full name
                </label>
                <input
                  id="student-fullname"
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
                  Email address
                </label>
                <input
                  id="student-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nistha@gmail.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password (min 8 characters)
                </label>
                <input
                  id="student-password"
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
                  id="student-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setMethod("choice")}
                  className="py-2.5 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  id="student-signup-submit"
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Continue"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Existing account prompt */}
        <p className="text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-slate-200 hover:text-white font-medium underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>

      {/* Account Linking Confirmation Modal */}
      {linkingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0e131f] p-6 shadow-2xl space-y-5">
            <div className="space-y-2">
              <span className="text-xs font-mono font-semibold text-indigo-400 uppercase">
                Account Linking
              </span>
              <h3 className="text-lg font-bold text-white">
                Existing Cognalyze Account Found
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We found an existing Cognalyze account associated with <strong>{linkingData.providerEmail}</strong>
                {linkingData.existingUser.username ? ` (@${linkingData.existingUser.username})` : ""}.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#141b2b] border border-white/5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Account Type:</span>
                <span className="text-slate-200 capitalize">{linkingData.existingUser.accountType}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Connecting Provider:</span>
                <span className="text-slate-200 capitalize">{linkingData.provider}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={handleConfirmLink}
                disabled={linkingLoading}
                className="flex-1 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {linkingLoading ? "Connecting..." : "Connect to Existing Profile"}
              </button>
              <button
                onClick={() => setLinkingData(null)}
                className="py-2.5 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
