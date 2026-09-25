// lib/collab/auth.ts
//
// Dual-mode server authentication & identity resolver for collaboration feed routes.
// Resolves identity from Clerk, Cognalyze session cookies, or Supabase candidate records.

import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase, isSupabaseAvailable } from "../supabase";
import { getAuthenticatedContext } from "../auth/server";

export interface CollabUser {
  id: string; // Canonical Candidate / User ID
  role: "student" | "recruiter" | "admin";
  clerkUserId?: string;
  name?: string;
  email?: string;
}

export async function getCollabUser(req: NextRequest): Promise<CollabUser | null> {
  // 1. Check test / development override headers first (for automated tests)
  const testUserId = req.headers.get("x-test-user-id");
  const testRole = req.headers.get("x-test-role") as "student" | "recruiter" | "admin" | null;
  if (testUserId && testRole) {
    return {
      id: testUserId,
      role: testRole,
      name: testRole === "recruiter" ? "Test Recruiter" : "Test Student",
    };
  }

  // 2. Attempt Clerk authentication
  try {
    const clerkAuth = await auth();
    const clerkUserId = clerkAuth?.userId;

    if (clerkUserId) {
      // Query candidate identity from Supabase by clerk_user_id
      const available = await isSupabaseAvailable();
      if (available && supabase) {
        const { data: cand } = await supabase
          .from("candidates")
          .select("id, role, name, email")
          .eq("clerk_user_id", clerkUserId)
          .maybeSingle();

        if (cand && cand.id) {
          return {
            id: cand.id,
            role: (cand.role as any) || "student",
            clerkUserId,
            name: cand.name || undefined,
            email: cand.email || undefined,
          };
        }
      }

      // If candidate record not yet created in DB, default to clerkUserId
      return {
        id: clerkUserId,
        role: "student", // default role
        clerkUserId,
      };
    }
  } catch {
    // Clerk not configured or error calling auth()
  }

  // 3. Fallback to Cognalyze session cookie (lib/auth/server.ts)
  try {
    const authContext = await getAuthenticatedContext(req);
    if (authContext && authContext.user) {
      const user = authContext.user;
      return {
        id: user.id,
        role: user.accountType as "student" | "recruiter" | "admin",
        name: authContext.studentProfile?.fullName || authContext.recruiterProfile?.fullName || user.email,
        email: user.email,
      };
    }
  } catch {}

  // 4. Fallback for demo student / recruiter via authorization bearer or cookie if present
  const demoRoleCookie = req.cookies.get("cognalyze_role")?.value;
  if (demoRoleCookie === "recruiter" || demoRoleCookie === "student") {
    return {
      id: demoRoleCookie === "recruiter" ? "recruiter-demo" : "student-demo",
      role: demoRoleCookie,
      name: demoRoleCookie === "recruiter" ? "Demo Recruiter" : "Demo Student",
    };
  }

  return null;
}
