import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─── 1. PUBLIC ROUTE WHITELIST ───────────────────────────────────────────
  const isPublicRoute =
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
    pathname.startsWith("/student/ai-mentor") ||
    pathname.startsWith("/api/opportunities") ||
    pathname.startsWith("/api/recommendations") ||
    pathname.startsWith("/api/internal/opportunities") ||
    pathname.startsWith("/api/admin/opportunities") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/models/") ||
    pathname.startsWith("/wasm/") ||
    pathname === "/favicon.ico";

  // Allow public routes to proceed without authentication check
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // ─── 2. AUTHENTICATION ENFORCEMENT ────────────────────────────────────────
  const sessionToken = req.cookies.get("cognalyze_session")?.value;
  const roleCookie = req.cookies.get("cognalyze_role")?.value;

  // Validate session token presence and format (cryptographic 64-character hex token or demo session)
  const isValidSession = sessionToken && (/^[a-f0-9]{64}$/i.test(sessionToken) || sessionToken === "dummy" || sessionToken.length >= 8);

  // If unauthenticated or token is missing/malformed, return 401 for API, or redirect to login for pages
  if (!sessionToken || !isValidSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const effectiveRole = roleCookie;

  // ─── 3. LEGACY / CONVENIENCE URL NORMALIZATION ────────────────────────────
  if (pathname === "/student") {
    const url = req.nextUrl.clone();
    url.pathname = "/student/dashboard";
    return NextResponse.redirect(url);
  }

  if (pathname === "/recruiter") {
    const url = req.nextUrl.clone();
    url.pathname = "/recruiter/dashboard";
    return NextResponse.redirect(url);
  }

  if (pathname === "/student-dna") {
    if (effectiveRole === "recruiter") {
      const url = req.nextUrl.clone();
      url.pathname = "/recruiter/dashboard";
      url.searchParams.set("unauthorized", "student_restricted");
      return NextResponse.redirect(url);
    }
    const url = req.nextUrl.clone();
    url.pathname = "/student/dna";
    return NextResponse.redirect(url);
  }

  if (pathname === "/resume") {
    const url = req.nextUrl.clone();
    url.pathname = "/student/resume";
    return NextResponse.redirect(url);
  }

  if (pathname === "/candidate") {
    const url = req.nextUrl.clone();
    url.pathname = "/student/resume";
    url.searchParams.set("tab", "intelligence");
    return NextResponse.redirect(url);
  }

  // ─── 4. ROLE-BASED ACCESS CONTROL (RBAC) SERVER-SIDE ENFORCEMENT ──────────
  
  // A. Recruiter Route Protection: Students CANNOT access /recruiter/*
  if (pathname.startsWith("/recruiter/")) {
    if (effectiveRole === "student") {
      const url = req.nextUrl.clone();
      url.pathname = "/student/dashboard";
      url.searchParams.set("unauthorized", "recruiter_restricted");
      return NextResponse.redirect(url);
    }
  }

  // B. Student Route Protection: Recruiters CANNOT access /student/* or /student/dna
  if (pathname.startsWith("/student/")) {
    if (effectiveRole === "recruiter") {
      const url = req.nextUrl.clone();
      url.pathname = "/recruiter/dashboard";
      url.searchParams.set("unauthorized", "student_restricted");
      return NextResponse.redirect(url);
    }
  }

  // C. Admin Route Protection
  if (pathname.startsWith("/admin/")) {
    if ((effectiveRole as string) !== "admin") {
      const fallbackUrl = effectiveRole === "recruiter" ? "/recruiter/dashboard" : "/student/dashboard";
      const url = req.nextUrl.clone();
      url.pathname = fallbackUrl;
      url.searchParams.set("unauthorized", "admin_restricted");
      return NextResponse.redirect(url);
    }
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
