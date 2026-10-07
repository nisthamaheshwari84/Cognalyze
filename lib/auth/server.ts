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

export async function getAuthenticatedContext(req: NextRequest): Promise<AuthenticatedContext | null> {
  const sessionToken = req.cookies.get("cognalyze_session")?.value;
  const sbAccessToken = req.cookies.get("sb-access-token")?.value;
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
