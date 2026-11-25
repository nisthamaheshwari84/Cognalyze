/**
 * COGNALYZE GD ARENA — STRICT AUTHENTICATION, ROLE & TENANT GUARD
 *
 * Enforces canonical authenticated student identity across all GD API routes:
 * - Zero "guest-student" / "guest-user" silent fallbacks
 * - Rejects recruiter accounts cleanly from student-only GD Arena APIs
 * - Applies Cache-Control: no-store on every response
 * - Checks server-authoritative disciplinary suspension status
 */

import { NextResponse } from "next/server";
import { getAuthenticatedContext, AuthenticatedContext } from "@/lib/auth/server";
import { getSessionByToken, getUserById } from "@/lib/auth/store";
import { isUserSuspendedAsync } from "./disciplinary-system";

export const GD_NO_STORE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  Vary: "Cookie, Authorization"
};

export interface GDAuthorizedStudent {
  userId: string;
  userName: string;
  authCtx: AuthenticatedContext;
}

export interface GDGuardOptions {
  allowWhenSuspended?: boolean;
}

export type GDAuthResult =
  | { ok: true; student: GDAuthorizedStudent }
  | { ok: false; response: NextResponse };

function extractSessionCookie(req: Request): string | null {
  const direct = (req as any)?.cookies?.get?.("cognalyze_session")?.value;
  if (direct) return direct;
  const cookieHeader = req?.headers?.get?.("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/cognalyze_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function requireAuthenticatedGDStudent(
  req: Request,
  options: GDGuardOptions = {}
): Promise<GDAuthResult> {
  let authCtx = await getAuthenticatedContext(req);

  // If global auth returned null only because user is SUSPENDED, resolve cleanly for GD policy / appeals
  if (!authCtx) {
    const rawToken = extractSessionCookie(req);
    const session = rawToken ? getSessionByToken(rawToken) : null;
    const suspendedUser = session ? getUserById(session.userId) : null;
    if (suspendedUser && suspendedUser.status === "SUSPENDED") {
      if (suspendedUser.accountType === "recruiter") {
        return {
          ok: false,
          response: NextResponse.json(
            {
              success: false,
              error: "forbidden_student_only",
              message: "Cognalyze GD Arena is currently scoped exclusively to student accounts."
            },
            { status: 403, headers: GD_NO_STORE_HEADERS }
          )
        };
      }
      if (!options.allowWhenSuspended) {
        const suspension = await isUserSuspendedAsync(suspendedUser.id);
        return {
          ok: false,
          response: NextResponse.json(
            {
              success: false,
              error: "account_suspended",
              message: `Your account is currently suspended until ${suspension.expiresAt || "further notice"}. Reason: ${suspension.reason || "GD Conduct Policy Violation"}`,
              appealToken: suspension.appealToken
            },
            { status: 403, headers: GD_NO_STORE_HEADERS }
          )
        };
      }
      authCtx = {
        user: suspendedUser,
        studentProfile: null,
        recruiterProfile: null,
        organization: null,
        connectedAccounts: []
      };
    }
  }

  if (!authCtx || !authCtx.user?.id) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "unauthorized",
          message: "Authentication required. Please sign in to access Cognalyze GD Arena.",
          requiresAuth: true
        },
        { status: 401, headers: GD_NO_STORE_HEADERS }
      )
    };
  }

  if (authCtx.user.accountType === "recruiter") {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "forbidden_student_only",
          message: "Cognalyze GD Arena is currently scoped exclusively to student accounts."
        },
        { status: 403, headers: GD_NO_STORE_HEADERS }
      )
    };
  }

  const userId = authCtx.user.id;
  const userName = authCtx.user.fullName || authCtx.user.email?.split("@")[0] || "Student";

  if (!options.allowWhenSuspended) {
    const suspension = await isUserSuspendedAsync(userId);
    if (suspension.suspended) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            error: "account_suspended",
            message: `Your account is currently suspended until ${suspension.expiresAt || "further notice"}. Reason: ${suspension.reason}`,
            appealToken: suspension.appealToken
          },
          { status: 403, headers: GD_NO_STORE_HEADERS }
        )
      };
    }
  }

  return {
    ok: true,
    student: {
      userId,
      userName,
      authCtx
    }
  };
}
