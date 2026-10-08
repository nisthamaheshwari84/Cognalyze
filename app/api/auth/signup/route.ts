import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  hashPassword,
  generateVerificationCode,
  hashCode,
  isGenericEmailDomain
} from "@/lib/auth/security";
import {
  createUser,
  getUserByEmail,
  createEmailVerification,
  createRecruiterProfile,
  createSession,
  upsertStudentProfileByUserId,
  syncStoreWithCloud,
  saveStoreToCloud
} from "@/lib/auth/store";
import { sendVerificationOtpEmail, EmailDispatchResult } from "@/lib/email/email-service";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, confirmPassword, accountType, fullName, designation, company } = body;

    // 1. Basic validation
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const effectiveAccountType = accountType || body.role;

    if (!effectiveAccountType || (effectiveAccountType !== "student" && effectiveAccountType !== "recruiter")) {
      return NextResponse.json({ error: "Invalid account type." }, { status: 400 });
    }

    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    // 2. Recruiter Work Email Enforcement
    if (effectiveAccountType === "recruiter") {
      if (isGenericEmailDomain(email)) {
        return NextResponse.json(
          {
            error: "Please use your company email address. Recruiter accounts require a verified work email.",
            code: "GENERIC_EMAIL_REJECTED"
          },
          { status: 400 }
        );
      }
    }

    // Sync cloud store first
    await syncStoreWithCloud();

    // 3. Existing User Check (Differentiate verified vs unverified)
    const existing = getUserByEmail(email);
    if (existing) {
      if (existing.status === "EMAIL_PENDING") {
        return NextResponse.json(
          {
            error: "Your account exists but your email hasn't been verified yet.",
            code: "ACCOUNT_EXISTS_UNVERIFIED",
            userId: existing.id,
            email: existing.email,
            accountType: existing.accountType,
            nextUrl: `/verify-email?role=${existing.accountType}`
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: "An account already exists with this email address. Please sign in instead.",
          code: "ACCOUNT_EXISTS",
          email: existing.email,
          nextUrl: "/login"
        },
        { status: 409 }
      );
    }

    // 4. Supabase Auth Registration
    let permanentUserId = crypto.randomUUID();
    try {
      const sbRes = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            fullName: fullName.trim(),
            role: effectiveAccountType
          }
        }
      });
      if (sbRes.data?.user?.id) {
        permanentUserId = sbRes.data.user.id;
      }
    } catch (sbErr) {
      console.warn("Supabase Auth signUp note:", sbErr);
    }

    // 5. Hash Password & Create User in synchronized store
    const { hash, salt } = hashPassword(password);
    const user = createUser({
      id: permanentUserId,
      email,
      fullName: fullName.trim(),
      passwordHash: hash,
      passwordSalt: salt,
      accountType: effectiveAccountType,
      status: "EMAIL_PENDING",
      profileCompleted: false
    });

    // 5. Generate 6-digit Verification Code & Dispatch Email Server-Side
    const verificationCode = generateVerificationCode();
    const codeHash = hashCode(verificationCode);
    createEmailVerification(user.id, user.email, codeHash);

    let emailResult: EmailDispatchResult = { provider: "fallback", success: false };
    try {
      emailResult = await sendVerificationOtpEmail(user.email, verificationCode, user.fullName);
    } catch (err: any) {
      console.error("Failed to dispatch verification email on signup:", err);
    }

    // 6. Create Profile based on account type
    if (effectiveAccountType === "recruiter") {
      createRecruiterProfile({
        userId: user.id,
        fullName: fullName.trim(),
        designation: (designation || "Hiring Manager").trim(),
        workEmail: user.email
      });
    } else if (effectiveAccountType === "student") {
      upsertStudentProfileByUserId(user.id, {
        fullName: fullName.trim(),
        email: user.email,
        profileCompleted: false,
        profileCompletionPercentage: 0
      });
    }

    // 7. Establish Session
    const session = createSession(user.id, effectiveAccountType);
    await saveStoreToCloud();

    const res = NextResponse.json({
      success: true,
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        accountType: user.accountType,
        status: user.status,
        profileCompleted: false
      },
      accountType: user.accountType,
      email: user.email,
      status: user.status,
      nextUrl: `/verify-email?role=${effectiveAccountType}`,
      emailDelivery: {
        delivered: emailResult.success,
        notice: emailResult.success
          ? `Verification code sent to ${user.email}.`
          : (emailResult.error || "Email delivery failed.")
      }
    });

    res.cookies.set("cognalyze_session", session.token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60
    });

    res.cookies.set("cognalyze_role", effectiveAccountType, {
      path: "/",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60
    });

    return res;
  } catch (err: any) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: err.message || "Failed to create account." }, { status: 500 });
  }
}
