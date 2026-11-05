/**
 * COGNALYZE SERVER-SIDE AUTHENTICATION HELPERS
 * 
 * Provides server-side session extraction, role enforcement, and access checks.
 * NEVER trusts client-side role or spoofed cookies.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getSessionByToken,
  getUserById,
  getStudentProfileByUserId,
  getRecruiterProfileByUserId,
  getOrganizationById,
  getConnectedAccountsByUserId,
  syncStoreWithCloud
} from "./store";
import { User, StudentProfile, RecruiterProfile, Organization, ConnectedAccount } from "./types";

export interface AuthenticatedContext {
  user: User;
  studentProfile: StudentProfile | null;
  recruiterProfile: RecruiterProfile | null;
  organization: Organization | null;
  connectedAccounts: ConnectedAccount[];
}

export async function getAuthenticatedContext(req: NextRequest | Request): Promise<AuthenticatedContext | null> {
  let sessionToken = (req as any)?.cookies?.get?.("cognalyze_session")?.value;
  let sbAccessToken = (req as any)?.cookies?.get?.("sb-access-token")?.value;

  if (!sessionToken && !sbAccessToken && req?.headers?.get) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const matchSess = cookieHeader.match(/cognalyze_session=([^;]+)/);
      if (matchSess) sessionToken = decodeURIComponent(matchSess[1]);
      const matchSb = cookieHeader.match(/sb-access-token=([^;]+)/);
      if (matchSb) sbAccessToken = decodeURIComponent(matchSb[1]);
    }
  }

  const effectiveToken = sessionToken || sbAccessToken;
  if (!effectiveToken) return null;

  let session = sessionToken ? getSessionByToken(sessionToken) : null;
  if (!session && sessionToken) {
    await syncStoreWithCloud();
    session = getSessionByToken(sessionToken);
  }

  let userId = session?.userId;

  // Support direct Supabase access token validation
  if (!userId && effectiveToken) {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase.auth.getUser(effectiveToken);
      if (data?.user?.id) {
        userId = data.user.id;
      }
    } catch {}
  }

  if (!userId) return null;

  let user = getUserById(userId);
  if (!user) {
    await syncStoreWithCloud();
    user = getUserById(userId);
  }

  if (!user && session?.userId) {
    const { createUser } = await import("./store");
    user = createUser({
      id: session.userId,
      email: `${session.userId}@cognalyze.local`,
      passwordHash: null,
      passwordSalt: null,
      accountType: session.accountType || "student",
      status: "ACTIVE"
    });
  }

  if (!user || user.status === "SUSPENDED" || user.status === "REVOKED") {
    return null;
  }

  const studentProfile = user.accountType === "student"
    ? getStudentProfileByUserId(user.id)
    : null;

  const recruiterProfile = user.accountType === "recruiter"
    ? getRecruiterProfileByUserId(user.id)
    : null;

  const organization = recruiterProfile?.organizationId
    ? getOrganizationById(recruiterProfile.organizationId)
    : null;

  const connectedAccounts = getConnectedAccountsByUserId(user.id);

  return {
    user,
    studentProfile,
    recruiterProfile,
    organization,
    connectedAccounts
  };
}

/**
 * Server-Side Access Guard for API Routes
 */
export async function requireAuth(req: NextRequest): Promise<AuthenticatedContext | NextResponse> {
  const auth = await getAuthenticatedContext(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }
  return auth;
}

export async function requireRole(
  req: NextRequest,
  role: "student" | "recruiter"
): Promise<AuthenticatedContext | NextResponse> {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.user.accountType !== role) {
    return NextResponse.json(
      { error: `Forbidden. This action requires a ${role} account.` },
      { status: 403 }
    );
  }

  // Recruiter Access Machine Check
  if (role === "recruiter") {
    if (auth.user.status === "EMAIL_PENDING") {
      return NextResponse.json(
        { error: "Forbidden. Work email verification is pending.", status: "EMAIL_PENDING" },
        { status: 403 }
      );
    }
    if (auth.user.status === "ORGANIZATION_PENDING" || !auth.organization || auth.organization.verificationStatus === "PENDING") {
      return NextResponse.json(
        { error: "Forbidden. Organization setup and verification is pending.", status: "ORGANIZATION_PENDING" },
        { status: 403 }
      );
    }
  }

  return auth;
}

/**
 * Recruiter Authorization Guard for Recruiter API Endpoints
 * Returns 401 if unauthenticated, 403 if authenticated but not recruiter.
 */
export async function requireRecruiterAuth(req: NextRequest | Request): Promise<
  { success: true; auth: AuthenticatedContext } | { success: false; response: NextResponse }
> {
  const auth = await getAuthenticatedContext(req);
  if (!auth || !auth.user) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized. Recruiter session required." },
        { status: 401 }
      )
    };
  }

  if (auth.user.accountType !== "recruiter") {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "Forbidden. Recruiter access required." },
        { status: 403 }
      )
    };
  }

  if (auth.user.status === "EMAIL_PENDING") {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "Forbidden. Work email verification is pending.", status: "EMAIL_PENDING" },
        { status: 403 }
      )
    };
  }

  if (
    auth.user.status === "ORGANIZATION_PENDING" ||
    !auth.organization ||
    auth.organization.verificationStatus === "PENDING"
  ) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "Forbidden. Organization setup and verification is pending.", status: "ORGANIZATION_PENDING" },
        { status: 403 }
      )
    };
  }

  return { success: true, auth };
}

/**
 * Extracts organization ID from authenticated recruiter context.
 */
export function getRecruiterOrgId(auth: AuthenticatedContext): string | null {
  return auth.organization?.id || auth.recruiterProfile?.organizationId || (auth.user as any)?.organizationId || null;
}

