import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, checkRateLimit } from "@/lib/auth/security";
import {
  getUserByEmail,
  getStudentProfileByUserId,
  getRecruiterProfileByUserId,
  getOrganizationById,
  createSession
} from "@/lib/auth/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Rate Limit Checks (5 attempts per 15 minutes per email)
    const rateLimit = checkRateLimit(`login:${normalizedEmail}`, 5, 15 * 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Please try again in ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minutes.`,
          code: "RATE_LIMITED"
        },
        { status: 429 }
      );
    }

    // 2. User Lookup
    const user = getUserByEmail(normalizedEmail);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password. Please check your credentials." },
        { status: 401 }
      );
    }

    if (user.status === "SUSPENDED" || user.status === "REVOKED") {
      return NextResponse.json(
        { error: "Your account is currently unavailable. Contact support if you believe this is an error." },
        { status: 403 }
      );
    }

    // 3. Password Verification
    if (!user.passwordHash || !user.passwordSalt) {
      return NextResponse.json(
        {
          error: "This account was registered through third-party login. Please sign in with GitHub or LinkedIn.",
          code: "OAUTH_ONLY_ACCOUNT"
        },
        { status: 400 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password. Please check your credentials." },
        { status: 401 }
      );
    }

    // 4. Compute Verified Post-Login Routing Server-Side
    let nextUrl = "/";
    let profile = null;

    if (user.accountType === "student") {
      if (user.status === "EMAIL_PENDING") {
        nextUrl = "/verify-email?role=student";
      } else {
        const studentProfile = getStudentProfileByUserId(user.id);
        profile = studentProfile;
        if (!studentProfile) {
          nextUrl = "/student/onboarding";
        } else {
          nextUrl = "/student/dashboard";
        }
      }
    } else if (user.accountType === "recruiter") {
      if (user.status === "EMAIL_PENDING") {
        nextUrl = "/verify-email?role=recruiter";
      } else {
        const recruiterProfile = getRecruiterProfileByUserId(user.id);
        profile = recruiterProfile;
        const org = recruiterProfile?.organizationId
          ? getOrganizationById(recruiterProfile.organizationId)
          : null;

        if (!org || org.verificationStatus === "PENDING") {
          nextUrl = "/recruiter/organization/setup";
        } else {
          nextUrl = "/recruiter/dashboard";
        }
      }
    }

    // 5. Establish Session
    const session = createSession(user.id, user.accountType);

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        accountType: user.accountType,
        status: user.status
      },
      profile,
      nextUrl
    });

    res.cookies.set("cognalyze_session", session.token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60
    });

    res.cookies.set("cognalyze_role", user.accountType, {
      path: "/",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60
    });

    return res;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: err.message || "Failed to sign in." }, { status: 500 });
  }
}
