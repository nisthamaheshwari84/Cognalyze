import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getUserByEmail, createPasswordResetToken, syncStoreWithCloud } from "@/lib/auth/store";
import { sendPasswordResetEmail, isEmailConfigured } from "@/lib/email/email-service";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Sync cloud store first
    await syncStoreWithCloud();

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

    // 1. Supabase Auth native password reset
    try {
      await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${baseUrl}/reset-password`
      });
    } catch (sbErr) {
      console.warn("Supabase resetPasswordForEmail note:", sbErr);
    }

    // 2. Cognalyze secure reset token flow
    const user = getUserByEmail(normalizedEmail);
    if (user && user.passwordHash) {
      // Generate cryptographically secure reset token
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      createPasswordResetToken(user.id, user.email, tokenHash);

      const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

      try {
        await sendPasswordResetEmail(user.email, resetUrl, user.fullName);
      } catch (err: any) {
        console.error("Failed to send password reset email:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a password reset link has been sent. Please check your inbox and spam folder."
    });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
