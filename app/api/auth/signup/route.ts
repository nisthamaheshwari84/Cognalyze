import { NextRequest, NextResponse } from "next/server";
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
  upsertStudentProfileByUserId
} from "@/lib/auth/store";
import { sendVerificationOtpEmail, EmailDispatchResult } from "@/lib/email/email-service";

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

    // 3. Existing User Check
    const existing = getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        {
          error: "An account already exists with this email address. Please sign in instead.",
          code: "ACCOUNT_EXISTS"
        },
        { status: 409 }
      );
    }

    // 4. Hash Password & Create User
    const { hash, salt } = hashPassword(password);
    const user = createUser({
      email,
      fullName: fullName.trim(),
      passwordHash: hash,
      passwordSalt: salt,
      accountType: effectiveAccountType,
      status: "EMAIL_PENDING",
      profileCompleted: false
    });

    // 5. Generate 6-digit Verification Code & Dispatch Email
    const verificationCode = generateVerificationCode();
    const codeHash = hashCode(verificationCode);
    createEmailVerification(user.id, user.email, codeHash, verificationCode);

    let emailResult: EmailDispatchResult = { provider: "fallback", success: true, deliveryNotice: "" };
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
      // Create empty isolated student profile strictly bound to this user's ID
      upsertStudentProfileByUserId(user.id, {
        fullName: fullName.trim(),
        email: user.email,
        profileCompleted: false,
        profileCompletionPercentage: 0
      });
    }

    // 7. Establish Session
    const session = createSession(user.id, effectiveAccountType);

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
        provider: emailResult.provider,
        delivered: emailResult.success && emailResult.provider !== "fallback",
        notice: emailResult.deliveryNotice
      },
      // If external email provider is unconfigured or in non-production, return code so user is never blocked
      verificationCode: emailResult.provider === "fallback" || process.env.NODE_ENV !== "production" ? verificationCode : undefined,
      demoVerificationCode: verificationCode
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
