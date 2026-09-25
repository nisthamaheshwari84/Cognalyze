import { NextRequest, NextResponse } from "next/server";
import {
  findUserByConnectedAccount,
  getUserByEmail,
  createUser,
  addConnectedAccount,
  createSession,
  getStudentProfileByUserId
} from "@/lib/auth/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, providerUserId, providerEmail, providerName } = body;

    if (!provider || (provider !== "github" && provider !== "linkedin")) {
      return NextResponse.json({ error: "Invalid OAuth provider." }, { status: 400 });
    }

    if (!providerUserId || !providerEmail) {
      return NextResponse.json({ error: "Missing OAuth credentials payload." }, { status: 400 });
    }

    const normalizedEmail = providerEmail.toLowerCase().trim();

    // 1. Check if this exact provider account is already connected to an existing user
    const existingLinkedUser = findUserByConnectedAccount(provider, providerUserId);
    if (existingLinkedUser) {
      const studentProfile = getStudentProfileByUserId(existingLinkedUser.id);
      const session = createSession(existingLinkedUser.id, existingLinkedUser.accountType);

      const nextUrl = !studentProfile
        ? "/student/onboarding"
        : "/student/dashboard";

      const res = NextResponse.json({
        status: "AUTHENTICATED",
        user: {
          id: existingLinkedUser.id,
          email: existingLinkedUser.email,
          accountType: existingLinkedUser.accountType
        },
        profile: studentProfile,
        nextUrl
      });

      res.cookies.set("cognalyze_session", session.token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60
      });
      res.cookies.set("cognalyze_role", existingLinkedUser.accountType, {
        path: "/",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60
      });

      return res;
    }

    // 2. Check if an account exists with the same email (Account Linking Detection)
    const existingEmailUser = getUserByEmail(normalizedEmail);
    if (existingEmailUser) {
      const studentProfile = getStudentProfileByUserId(existingEmailUser.id);
      return NextResponse.json({
        status: "LINK_CONFIRMATION_REQUIRED",
        message: "We found an existing Cognalyze account associated with this email.",
        existingUser: {
          id: existingEmailUser.id,
          email: existingEmailUser.email,
          accountType: existingEmailUser.accountType,
          username: studentProfile?.username || null,
          fullName: studentProfile?.fullName || null
        },
        provider,
        providerUserId,
        providerEmail: normalizedEmail
      });
    }

    // 3. New User Registration via OAuth (Pre-verified email from provider)
    const newUser = createUser({
      email: normalizedEmail,
      passwordHash: null,
      passwordSalt: null,
      accountType: "student",
      status: "ACTIVE" // OAuth emails are verified by provider
    });

    // Connect the OAuth account
    addConnectedAccount({
      userId: newUser.id,
      provider,
      providerUserId,
      providerEmail: normalizedEmail
    });

    const session = createSession(newUser.id, "student");

    const res = NextResponse.json({
      status: "AUTHENTICATED",
      user: {
        id: newUser.id,
        email: newUser.email,
        accountType: newUser.accountType
      },
      profile: null,
      nextUrl: "/student/onboarding"
    });

    res.cookies.set("cognalyze_session", session.token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60
    });
    res.cookies.set("cognalyze_role", "student", {
      path: "/",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60
    });

    return res;
  } catch (err: any) {
    console.error("OAuth error:", err);
    return NextResponse.json({ error: err.message || "OAuth processing failed." }, { status: 500 });
  }
}
