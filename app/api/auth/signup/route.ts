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
  createSession
} from "@/lib/auth/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, confirmPassword, accountType, fullName, designation, company } = body;

    // 1. Basic validation
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    if (!accountType || (accountType !== "student" && accountType !== "recruiter")) {
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
    if (accountType === "recruiter") {
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
      passwordHash: hash,
      passwordSalt: salt,
      accountType,
      status: "EMAIL_PENDING"
    });

    // 5. Generate 6-digit Verification Code
    const verificationCode = generateVerificationCode();
    const codeHash = hashCode(verificationCode);
    createEmailVerification(user.id, user.email, codeHash);

    // 6. Create Recruiter Profile if recruiter
    if (accountType === "recruiter") {
      createRecruiterProfile({
        userId: user.id,
        fullName: fullName.trim(),
        designation: (designation || "Hiring Manager").trim(),
        workEmail: user.email
      });
    }

    // 7. Establish Session
    const session = createSession(user.id, accountType);

    const res = NextResponse.json({
      success: true,
      userId: user.id,
      accountType: user.accountType,
      email: user.email,
      status: user.status,
      nextUrl: `/verify-email?role=${accountType}`,
      // Exposed for test/local demo verification
      demoVerificationCode: process.env.NODE_ENV !== "production" ? verificationCode : undefined
    });

    res.cookies.set("cognalyze_session", session.token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60
    });

    res.cookies.set("cognalyze_role", accountType, {
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
