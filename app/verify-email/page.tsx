"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") || "student";

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [email, setEmail] = useState<string>("");
  const [accountType, setAccountType] = useState<"student" | "recruiter">(roleParam === "recruiter" ? "recruiter" : "student");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [nextDestination, setNextDestination] = useState<string>("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch current session email on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data.authenticated && data.user) {
          setEmail(data.user.email);
          setAccountType(data.user.accountType);
          if (data.user.emailVerifiedAt) {
            setSuccess(true);
            setNextDestination(data.user.accountType === "student" ? "/student/onboarding" : "/recruiter/organization/setup");
          }
        }
      } catch (err) {
        console.error("Session check error:", err);
      }
    }
    checkSession();
  }, []);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleDigitChange = (index: number, val: string) => {
    if (val.length > 1) {
      // Handle paste
      const pasted = val.replace(/\D/g, "").slice(0, 6).split("");
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        if (pasted[i]) newDigits[i] = pasted[i];
      }
      setDigits(newDigits);
      const nextIndex = Math.min(5, pasted.length);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const cleanVal = val.replace(/\D/g, "");
    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    // Auto-advance
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");

      setSuccess(true);
      setNextDestination(data.nextUrl || (accountType === "student" ? "/student/onboarding" : "/recruiter/organization/setup"));
    } catch (err: any) {
      setError(err.message || "Failed to verify code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.retryAfterSeconds) {
          setCooldown(data.retryAfterSeconds);
        }
        throw new Error(data.error || "Failed to resend code.");
      }

      setCooldown(60);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code.");
    } finally {
      setResending(false);
    }
  };

  // Mask email for privacy (e.g. ni******@gmail.com)
  const maskedEmail = email
    ? email.replace(/^(.)(.*)(@.*)$/, (_, first, middle, rest) => first + "*".repeat(Math.max(2, middle.length)) + rest)
    : accountType === "recruiter" ? "your company email" : "your email";

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
          <Link href="/" className="inline-block font-semibold text-lg tracking-tight text-white mb-2">
            Cognalyze
          </Link>

          {!success ? (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {accountType === "recruiter" ? "Verify your company email" : "Verify your email"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
                {accountType === "recruiter"
                  ? "We've sent a 6-digit verification code to your work email address:"
                  : "One small step before we build your profile. We've sent a code to:"}
              </p>
              <div className="inline-block px-3 py-1 rounded bg-[#141b2b] border border-white/10 text-xs font-mono text-indigo-300 mt-1">
                {maskedEmail}
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl mx-auto mb-2">
                ✓
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {accountType === "recruiter" ? "Work email verified" : "Email verified"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
                {accountType === "recruiter"
                  ? "Next, we'll verify your organization before you can access hiring workflows."
                  : "You're ready to build your Cognalyze profile."}
              </p>
            </>
          )}
        </div>

        {/* Card */}
        <div className="rounded-xl border border-white/10 bg-[#0e131f] p-6 sm:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-950/50 border border-red-800/60 text-xs text-red-300 leading-relaxed">
              {error}
            </div>
          )}

          {!success ? (
            <form onSubmit={handleVerify} className="space-y-6">
              {/* 6 Digit OTP inputs */}
              <div className="flex justify-between gap-2 sm:gap-2.5">
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 rounded-lg bg-[#141b2b] border border-white/10 text-white text-center text-lg sm:text-xl font-mono font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                ))}
              </div>

              <button
                id="verify-email-submit"
                type="submit"
                disabled={loading || digits.join("").length < 6}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify email"}
              </button>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                <span className="text-slate-400">Didn&apos;t receive it?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || resending}
                  className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending..." : "Resend code"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                <div className="font-semibold text-emerald-200">
                  {accountType === "recruiter" ? "✓ Work email confirmed" : "✓ Identity verified"}
                </div>
                <p className="text-[11px] text-emerald-300/80">
                  {accountType === "recruiter"
                    ? "Status advanced to ORGANIZATION_PENDING. Proceed to set up your company profile."
                    : "Your email is confirmed. Next, claim your unique username and profile details."}
                </p>
              </div>

              <button
                id="verify-continue-btn"
                onClick={() => router.push(nextDestination)}
                className="w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] font-mono text-slate-500">
          Account Status: {success ? (accountType === "student" ? "ACTIVE" : "ORGANIZATION_PENDING") : "EMAIL_PENDING"}
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-400 font-mono text-xs">Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
