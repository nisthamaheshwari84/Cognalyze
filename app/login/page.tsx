"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sign in.");
      }

      router.push(data.nextUrl || "/");
    } catch (err: any) {
      setError(err.message || "An error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "github" | "linkedin") => {
    setError(null);
    setOauthLoading(provider);

    try {
      // Simulate OAuth flow with a verified candidate email
      const providerUserId = `${provider}_usr_${Math.random().toString(36).substring(2, 9)}`;
      const providerEmail = email.trim() || "nistha@cognalyze.com";

      const res = await fetch("/api/auth/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          providerUserId,
          providerEmail,
          providerName: provider === "github" ? "GitHub User" : "LinkedIn Member"
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "OAuth sign in failed.");
      }

      if (data.status === "LINK_CONFIRMATION_REQUIRED") {
        setLinkingData({
          existingUser: data.existingUser,
          provider: data.provider,
          providerUserId: data.providerUserId,
          providerEmail: data.providerEmail
        });
      } else {
        router.push(data.nextUrl || "/");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect via third-party login.");
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

      router.push(data.nextUrl || "/");
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
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block font-semibold text-lg tracking-tight text-white mb-2">
            Cognalyze
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Sign in to access your Cognalyze workspace.
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-xl border border-white/10 bg-[#0e131f] p-6 sm:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-950/50 border border-red-800/60 text-xs text-red-300 leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert("Password reset link will be sent to your verified email.")}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-mono">
              <span className="bg-[#0e131f] px-3 text-slate-500">Or continue with</span>
            </div>
          </div>

          {/* Social OAuth Buttons */}
          <div className="space-y-2.5">
            <button
              id="oauth-github-btn"
              type="button"
              onClick={() => handleOAuth("github")}
              disabled={oauthLoading !== null}
              className="w-full py-2.5 px-4 rounded-lg bg-[#141b2b] hover:bg-[#1a2338] border border-white/10 text-slate-200 text-xs font-medium flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>{oauthLoading === "github" ? "Connecting GitHub..." : "Continue with GitHub"}</span>
            </button>

            <button
              id="oauth-linkedin-btn"
              type="button"
              onClick={() => handleOAuth("linkedin")}
              disabled={oauthLoading !== null}
              className="w-full py-2.5 px-4 rounded-lg bg-[#141b2b] hover:bg-[#1a2338] border border-white/10 text-slate-200 text-xs font-medium flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-[#0a66c2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
              <span>{oauthLoading === "linkedin" ? "Connecting LinkedIn..." : "Continue with LinkedIn"}</span>
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400">
          New to Cognalyze?{" "}
          <Link href="/signup" className="text-slate-200 hover:text-white font-medium underline underline-offset-4">
            Create an account
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
