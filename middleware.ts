import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Backward-compatible Legacy URL Redirects
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


  // 2. Role-Based Access Control (RBAC) Server-Side Enforcement
  const roleCookie = req.cookies.get("cognalyze_role")?.value;

  // A. Recruiter Route Protection
  if (pathname.startsWith("/recruiter/")) {
    if (req.nextUrl.searchParams.get("role") === "recruiter") {
      const res = NextResponse.next();
      res.cookies.set("cognalyze_role", "recruiter", { path: "/", maxAge: 60 * 60 * 24 * 30 });
      return res;
    }
    if (roleCookie === "student") {
      const url = req.nextUrl.clone();
      url.pathname = "/student/dashboard";
      url.searchParams.set("unauthorized", "recruiter_restricted");
      return NextResponse.redirect(url);
    }
    // If no role set, establish recruiter session
    if (!roleCookie) {
      const res = NextResponse.next();
      res.cookies.set("cognalyze_role", "recruiter", { path: "/", maxAge: 60 * 60 * 24 * 30 });
      return res;
    }
  }

  // B. Student Route Protection
  if (pathname.startsWith("/student/")) {
    if (req.nextUrl.searchParams.get("role") === "student") {
      const res = NextResponse.next();
      res.cookies.set("cognalyze_role", "student", { path: "/", maxAge: 60 * 60 * 24 * 30 });
      return res;
    }
    if (roleCookie === "recruiter") {
      const url = req.nextUrl.clone();
      url.pathname = "/recruiter/dashboard";
      url.searchParams.set("unauthorized", "student_restricted");
      return NextResponse.redirect(url);
    }
    // If no role set, establish student session
    if (!roleCookie) {
      const res = NextResponse.next();
      res.cookies.set("cognalyze_role", "student", { path: "/", maxAge: 60 * 60 * 24 * 30 });
      return res;
    }
  }

  // C. Admin Route Protection
  if (pathname.startsWith("/admin/")) {
    if (roleCookie === "student") {
      const url = req.nextUrl.clone();
      url.pathname = "/student/dashboard";
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
    "/recruiter",
    "/recruiter/:path*",
    "/admin/:path*",
    "/resume",
    "/candidate",
    "/interview",
    "/secure-interview"
  ]
};
