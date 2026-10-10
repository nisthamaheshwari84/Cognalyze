"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { clearUserSessionStorage } from "@/lib/client-storage-cleanup";

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
  const [expiresInSeconds, setExpiresInSeconds] = useState<number>(15 * 60); // 15 mins default
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [deliveryNotice, setDeliveryNotice] = useState<string | null>(null);
  const [nextDestination, setNextDestination] = useState<string>("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch current session email & verification status on mount
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
            setNextDestination(data.user.accountType === "student" ? "/student/dashboard" : "/recruiter/organization/setup");
          }

          if (data.pendingVerification?.expiresAt) {
            const expMs = new Date(data.pendingVerification.expiresAt).getTime();
            const remaining = Math.max(0, Math.floor((expMs - Date.now()) / 1000));
            setExpiresInSeconds(remaining);
          }
        }
      } catch (err) {
        console.error("Session check error:", err);
      }
    }
    checkSession();
  }, []);

  // Expiry countdown timer
  useEffect(() => {
    if (expiresInSeconds <= 0) return;
    const timer = setInterval(() => {
      setExpiresInSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresInSeconds]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

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
      setError("Please enter the full 6-digit verification code.");
      return;
    }

    if (expiresInSeconds <= 0) {
      setError("This code has expired. Request a new one.");
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
      if (!res.ok) throw new Error(data.error || "Incorrect verification code.");

      if (data.user?.id) {
        clearUserSessionStorage(data.user.id);
      }

      setSuccess(true);
      setNextDestination(data.nextUrl || (accountType === "student" ? "/student/dashboard" : "/recruiter/organization/setup"));
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

      setDeliveryNotice(data.deliveryNotice || "A new 6-digit verification code has been dispatched to your email.");
      setCooldown(30);
      setExpiresInSeconds(15 * 60);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code.");
    } finally {
      setResending(false);
    }
  };

  // Mask email for privacy (e.g. a********@gmail.com)
  const maskedEmail = email
    ? email.replace(/^(.)(.*)(@.*)$/, (_, first, middle, rest) => first + "*".repeat(Math.max(2, middle.length)) + rest)
    : accountType === "recruiter" ? "your company email" : "your email";

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

          {!success ? (
            <>
              <h1
                style={{ color: "#162A43" }}
                className="text-2xl sm:text-3xl font-bold tracking-tight"
              >
                Verify your email
              </h1>
              <p style={{ color: "#667085" }} className="text-xs sm:text-sm max-w-xs mx-auto">
                We&apos;ve sent a 6-digit verification code to:
              </p>
              <div
                style={{
                  backgroundColor: "#EFF4FE",
                  borderColor: "#D2E0FB",
                  color: "#356AE6",
                }}
                className="inline-block px-3 py-1 rounded border text-xs font-mono font-bold mt-1"
              >
                {maskedEmail}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  backgroundColor: "#EAF4EE",
                  borderColor: "#C8E4D3",
                  color: "#2E7D5B",
                }}
                className="w-12 h-12 rounded-full border flex items-center justify-center text-xl font-bold mx-auto mb-2"
              >
                ✓
              </div>
              <h1
                style={{ color: "#162A43" }}
                className="text-2xl sm:text-3xl font-bold tracking-tight"
              >
                {accountType === "recruiter" ? "Work email verified" : "Email verified"}
              </h1>
              <p style={{ color: "#667085" }} className="text-xs sm:text-sm max-w-xs mx-auto">
                {accountType === "recruiter"
                  ? "Next, configure your organization workspace to access hiring workflows."
                  : "Your email is confirmed. Proceed to your personalized student dashboard."}
              </p>
            </>
          )}
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

          {deliveryNotice && (
            <div
              style={{
                backgroundColor: "#F0FDF4",
                borderColor: "#BBF7D0",
                color: "#166534",
              }}
              className="p-3.5 rounded-lg border text-xs leading-relaxed flex items-start gap-2"
            >
              <span className="text-sm">✉️</span>
              <span className="flex-1">{deliveryNotice}</span>
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
                    style={{
                      backgroundColor: "#FAFAF8",
                      borderColor: "#E4E1DA",
                      color: "#17191C",
                    }}
                    className="w-11 h-13 sm:w-12 sm:h-14 rounded-lg border text-center text-lg sm:text-xl font-mono font-bold focus:outline-none focus:border-[#356AE6] transition-colors"
                  />
                ))}
              </div>

              <button
                id="verify-email-submit"
                type="submit"
                disabled={loading || digits.join("").length < 6}
                style={{
                  backgroundColor: "#356AE6",
                  color: "#FFFFFF",
                }}
                className="w-full py-2.5 px-4 rounded-lg hover:bg-[#2858C7] text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify email"}
              </button>

              <div style={{ borderColor: "#E4E1DA" }} className="flex items-center justify-between text-xs pt-1 border-t">
                <span style={{ color: "#667085" }}>Didn&apos;t receive it?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || resending}
                  style={{ color: "#356AE6" }}
                  className="font-semibold hover:underline transition-colors cursor-pointer disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending..." : "Resend code"}
                </button>
              </div>

              <div className="text-center">
                {expiresInSeconds > 0 ? (
                  <span style={{ color: "#667085" }} className="text-xs font-mono">
                    Code expires in <span className="font-semibold text-slate-800">{formatTimer(expiresInSeconds)}</span>
                  </span>
                ) : (
                  <span style={{ color: "#C24141" }} className="text-xs font-medium">
                    This code has expired. Request a new one.
                  </span>
                )}
              </div>

              <p style={{ color: "#98A2B3" }} className="text-[11px] text-center leading-normal">
                Tip: If the email doesn&apos;t appear in your inbox within a minute, check your <span className="font-medium text-slate-600">Spam or Promotions</span> folder.
              </p>
            </form>
          ) : (
            <div className="space-y-4">
              <div
                style={{
                  backgroundColor: "#EAF4EE",
                  borderColor: "#C8E4D3",
                  color: "#2E7D5B",
                }}
                className="p-4 rounded-lg border text-xs space-y-1"
              >
                <div className="font-bold">
                  {accountType === "recruiter" ? "✓ Work email confirmed" : "✓ Email verified"}
                </div>
                <p className="text-[11px] opacity-90">
                  {accountType === "recruiter"
                    ? "Status advanced to ORGANIZATION_PENDING. Proceed to set up your company workspace."
                    : "Your account is activated. Proceed to your dashboard."}
                </p>
              </div>

              <button
                id="verify-continue-btn"
                onClick={() => router.push(nextDestination)}
                style={{
                  backgroundColor: "#356AE6",
                  color: "#FFFFFF",
                }}
                className="w-full py-2.5 px-4 rounded-lg hover:bg-[#2858C7] text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <p style={{ color: "#98A2B3" }} className="text-center text-[11px] font-mono">
          Account Status: {success ? (accountType === "student" ? "ACTIVE" : "ORGANIZATION_PENDING") : "EMAIL_PENDING"}
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#667085" }} className="flex items-center justify-center font-mono text-xs">Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
