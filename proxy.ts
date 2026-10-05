import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─── 1. PUBLIC ROUTE & GUEST STUDENT WHITELIST ─────────────────────────────
  // These routes allow guest/unauthenticated exploration without credentials.
  const isGuestStudentPath =
    pathname === "/student" ||
    pathname === "/student/dashboard" ||
    pathname === "/student/opportunities" ||
    pathname.startsWith("/student/opportunities/") ||
    pathname === "/student/resources" ||
    pathname === "/student/question-bank" ||
    pathname === "/student/skills" ||
    pathname.startsWith("/student/skills/") ||
    pathname === "/student/assessment-arena" ||
    pathname === "/student/dsa-tracker" ||
    pathname === "/student/gd-practice" ||
    pathname === "/student/simulation" ||
    pathname === "/student/practice-interview" ||
    pathname === "/student/ai-mentor" ||
    pathname.startsWith("/student/ai-mentor/");

  const isPublicGeneralPath =
    pathname === "/" ||
    pathname === "/about" ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/") ||
    pathname === "/verify-email" ||
    pathname === "/post" ||
    pathname.startsWith("/post/") ||
    pathname.startsWith("/api/posts") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/parse-resume") ||
    pathname.startsWith("/api/student/ai-mentor") ||
    pathname.startsWith("/api/opportunities") ||
    pathname.startsWith("/api/recommendations") ||
    pathname.startsWith("/api/internal/opportunities") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/models/") ||
    pathname.startsWith("/wasm/") ||
    pathname === "/favicon.ico";

  // ─── 2. RECRUITER ROUTES: NEVER ALLOW GUEST ACCESS ─────────────────────────
  const isRecruiterPath = pathname === "/recruiter" || pathname.startsWith("/recruiter/");
  const isRecruiterApiPath = pathname.startsWith("/api/recruiter");

  // ─── 3. STRICTLY PROTECTED STUDENT PRIVATE ROUTES ──────────────────────────
  // These routes contain or modify personal identity, Student DNA, applications, or profile.
  const isPrivateStudentPath =
    pathname === "/student/dna" ||
    pathname === "/student-dna" ||
    pathname === "/student/onboarding" ||
    pathname === "/student/profile" ||
    pathname === "/student/applications" ||
    pathname === "/student/journey" ||
    pathname === "/student/passport" ||
    pathname === "/student/growth" ||
    pathname === "/student/interview-prep/history";

  const isPrivateStudentApiPath =
    pathname === "/api/student/dna" ||
    pathname.startsWith("/api/student-dna") ||
    pathname === "/api/student/profile" ||
    pathname === "/api/student/onboarding";

  // Session & Role Token Extraction
  const sessionToken = req.cookies.get("cognalyze_session")?.value;
  const roleCookie = req.cookies.get("cognalyze_role")?.value;
  const hasValidSession = Boolean(
    sessionToken && (/^[a-f0-9]{64}$/i.test(sessionToken) || sessionToken.length >= 8)
  );

  // If attempting to access strictly private student data without authentication
  if ((isPrivateStudentPath || isPrivateStudentApiPath) && !hasValidSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({
        success: false,
        error: "Unauthorized. Student DNA and personalized profiles require authentication.",
        requiresAuth: true
      }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If attempting to access recruiter features without authentication
  if ((isRecruiterPath || isRecruiterApiPath) && !hasValidSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({
        success: false,
        error: "Unauthorized. Recruiter access requires a verified corporate account.",
        requiresAuth: true
      }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("role", "recruiter");
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If public or allowed guest student route, proceed
  if (isPublicGeneralPath || isGuestStudentPath) {
    // Normalization for /student -> /student/dashboard
    if (pathname === "/student") {
      const url = req.nextUrl.clone();
      url.pathname = "/student/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ─── 4. ROLE-BASED ACCESS CONTROL (RBAC) FOR AUTHENTICATED USERS ──────────
  if (hasValidSession) {
    // A. Recruiter Route Protection: Authenticated Students CANNOT access /recruiter/*
    if (isRecruiterPath && roleCookie === "student") {
      const url = req.nextUrl.clone();
      url.pathname = "/student/dashboard";
      url.searchParams.set("unauthorized", "recruiter_restricted");
      return NextResponse.redirect(url);
    }

    // B. Student Route Protection: Authenticated Recruiters CANNOT access private student tools
    if (isPrivateStudentPath && roleCookie === "recruiter") {
      const url = req.nextUrl.clone();
      url.pathname = "/recruiter/dashboard";
      url.searchParams.set("unauthorized", "student_restricted");
      return NextResponse.redirect(url);
    }
  } else {
    // Unauthenticated user hitting any other unlisted private route
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student",
    "/student/:path*",
    "/student-dna",
    "/recruiter",
    "/recruiter/:path*",
    "/admin",
    "/admin/:path*",
    "/resume",
    "/candidate",
    "/interview",
    "/secure-interview",
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ]
};
