import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, checkRateLimit } from "@/lib/auth/security";
import {
  getUserByEmail,
  getStudentProfileByUserId,
  getRecruiterProfileByUserId,
  getOrganizationById,
  createSession,
  syncStoreWithCloud,
  saveStoreToCloud,
  createUser,
  upsertStudentProfileByUserId,
  createRecruiterProfile
} from "@/lib/auth/store";
import { supabase } from "@/lib/supabase";

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
          error: `Too many attempts. Please try again in ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minutes.`,
          code: "RATE_LIMITED"
        },
        { status: 429 }
      );
    }

    // Sync cloud store in case another serverless worker created the account
    await syncStoreWithCloud();

    let authenticatedUserId: string | null = null;
    let authenticatedUser: any = null;
    let sbSession: any = null;

    // 2. Primary: Attempt Supabase Auth Sign-In
    try {
      const sbRes = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (sbRes.data?.user) {
        const userId = sbRes.data.user.id;
        authenticatedUserId = userId;
        sbSession = sbRes.data.session;

        // Ensure user exists in local/cloud store keyed by Supabase user id
        authenticatedUser = getUserByEmail(normalizedEmail);
        if (!authenticatedUser) {
          const role = (sbRes.data.user.user_metadata?.role || "student") as "student" | "recruiter";
          authenticatedUser = createUser({
            id: userId,
            email: normalizedEmail,
            fullName: sbRes.data.user.user_metadata?.fullName || "User",
            passwordHash: null,
            passwordSalt: null,
            accountType: role,
            status: "ACTIVE"
          });
          if (role === "student") {
            upsertStudentProfileByUserId(userId, {
              fullName: sbRes.data.user.user_metadata?.fullName || "Student",
              email: normalizedEmail
            });
          }
        }
      } else if (sbRes.error?.message?.toLowerCase().includes("email not confirmed")) {
        const existing = getUserByEmail(normalizedEmail);
        const role = existing?.accountType || "student";
        const userId = existing?.id || normalizedEmail;
        const session = createSession(userId, role);

        const res = NextResponse.json(
          {
            error: "Please verify your email before signing in.",
            code: "EMAIL_NOT_VERIFIED",
            userId,
            email: normalizedEmail,
            accountType: role,
            nextUrl: `/verify-email?role=${role}`
          },
          { status: 403 }
        );

        res.cookies.set("cognalyze_session", session.token, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60
        });

        res.cookies.set("cognalyze_role", role, {
          path: "/",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60
        });

        return res;
      }
    } catch (sbErr) {
      console.warn("Supabase Auth signIn attempt error:", sbErr);
    }

    // 3. Fallback: Check Persistent Cloud Store
    if (!authenticatedUserId || !authenticatedUser) {
      const user = getUserByEmail(normalizedEmail);
      if (!user) {
        return NextResponse.json(
          { error: "Incorrect email or password.", code: "INVALID_CREDENTIALS" },
          { status: 401 }
        );
      }

      if (user.status === "SUSPENDED" || user.status === "REVOKED") {
        return NextResponse.json(
          { error: "Your account is currently unavailable. Contact support if you believe this is an error." },
          { status: 403 }
        );
      }

      if (user.status === "EMAIL_PENDING") {
        const session = createSession(user.id, user.accountType);
        const res = NextResponse.json(
          {
            error: "Please verify your email before signing in.",
            code: "EMAIL_NOT_VERIFIED",
            userId: user.id,
            email: user.email,
            accountType: user.accountType,
            nextUrl: `/verify-email?role=${user.accountType}`
          },
          { status: 403 }
        );

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
      }

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
          { error: "Incorrect email or password.", code: "INVALID_CREDENTIALS" },
          { status: 401 }
        );
      }

      authenticatedUserId = user.id;
      authenticatedUser = user;
    }

    if (!authenticatedUserId || !authenticatedUser) {
      return NextResponse.json(
        { error: "Incorrect email or password.", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const finalUserId: string = authenticatedUserId;

    // 4. Compute Verified Post-Login Routing Server-Side
    let nextUrl = "/";
    let profile = null;

    if (authenticatedUser.accountType === "student") {
      const studentProfile = getStudentProfileByUserId(finalUserId);
      profile = studentProfile;
      nextUrl = "/student/dashboard";
    } else if (authenticatedUser.accountType === "recruiter") {
      const recruiterProfile = getRecruiterProfileByUserId(finalUserId);
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

    // 5. Establish Session
    const session = createSession(finalUserId, authenticatedUser.accountType);
    await saveStoreToCloud();


    const res = NextResponse.json({
      success: true,
      user: {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        accountType: authenticatedUser.accountType,
        status: authenticatedUser.status
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

    if (sbSession?.access_token) {
      res.cookies.set("sb-access-token", sbSession.access_token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60
      });
    }

    res.cookies.set("cognalyze_role", authenticatedUser.accountType, {
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

