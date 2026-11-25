import { NextRequest, NextResponse } from "next/server";
import {
  authorizeStudentDnaAccess,
  DNA_NO_STORE_HEADERS,
  getDnaSecurityAuditLogs,
  purgeDnaSecurityAuditLogs,
  recordDnaSecurityAudit,
  sanitizeConnectedAccountForClient,
} from "@/lib/dna/security-audit";
import {
  disconnectAccountForUser,
  getConnectedAccountsByUserId,
  purgeStudentProfileDataForUser,
} from "@/lib/auth/store";
import { invalidateUserDNAScope, purgeUserStudentDNA, retractEvidenceBySource } from "@/lib/dna/store";
import { invalidateClaimVerificationCache } from "@/lib/evidence/claim-verification-engine";
import { invalidateStudentOrchestrationCache } from "@/lib/connectors/orchestrator";
import { COIConsentService } from "@/lib/integrations/coi/consent-service";

export const dynamic = "force-dynamic";

const ALLOWED_SOURCE_PROVIDERS = new Set([
  "github",
  "linkedin",
  "email",
  "leetcode",
  "hackerrank",
  "resume",
  "hackathon",
  "certification",
]);

/**
 * GET /api/student-dna/privacy
 * Returns strictly the authenticated student's sanitized connected accounts (never tokens),
 * active consent state, and privacy/security audit log.
 */
export async function GET(req: NextRequest) {
  const authResult = await authorizeStudentDnaAccess(req, {
    requestedCandidateId: req.nextUrl.searchParams.get("candidateId"),
    resourceName: "/api/student-dna/privacy",
  });
  if (!authResult.ok) return authResult.response;

  const { studentId } = authResult;
  const connected = getConnectedAccountsByUserId(studentId).map(sanitizeConnectedAccountForClient);
  const consent = await COIConsentService.getActiveConsent(studentId);
  const securityAudit = getDnaSecurityAuditLogs(studentId).slice(0, 50);

  return NextResponse.json(
    {
      success: true,
      studentId,
      connectedSources: connected,
      consent: consent || null,
      securityAudit,
    },
    { status: 200, headers: DNA_NO_STORE_HEADERS }
  );
}

/**
 * POST /api/student-dna/privacy
 * Manages explicit consent grants or source disconnection for the authenticated student.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const authResult = await authorizeStudentDnaAccess(req, {
    requestedCandidateId: body.userId || body.candidateId || req.nextUrl.searchParams.get("candidateId"),
    resourceName: "/api/student-dna/privacy",
  });
  if (!authResult.ok) return authResult.response;

  const { studentId } = authResult;
  const action = String(body.action || "").toLowerCase().trim();

  if (action === "grant_consent") {
    const scopes =
      Array.isArray(body.scopes) && body.scopes.length > 0
        ? body.scopes.filter((s: unknown) => typeof s === "string").slice(0, 12)
        : ["student_dna:read", "placement_profiles:read"];
    const consent = await COIConsentService.grantConsent(studentId, scopes, "coi", {
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });
    recordDnaSecurityAudit({
      userId: studentId,
      actorId: studentId,
      actorRole: "student",
      action: "CONSENT_UPDATED",
      targetResource: "coi_consent",
      outcome: "COMPLETED",
      details: `Granted consent scopes: ${scopes.join(", ")}`,
    });
    return NextResponse.json({ success: true, consent }, { status: 200, headers: DNA_NO_STORE_HEADERS });
  }

  if (action === "revoke_consent") {
    const revoked = await COIConsentService.revokeConsent(studentId);
    recordDnaSecurityAudit({
      userId: studentId,
      actorId: studentId,
      actorRole: "student",
      action: "CONSENT_UPDATED",
      targetResource: "coi_consent",
      outcome: "COMPLETED",
      details: "Student revoked active COI consent.",
    });
    return NextResponse.json({ success: true, revoked }, { status: 200, headers: DNA_NO_STORE_HEADERS });
  }

  return NextResponse.json(
    { success: false, error: "Unsupported privacy action." },
    { status: 400, headers: DNA_NO_STORE_HEADERS }
  );
}

/**
 * DELETE /api/student-dna/privacy
 * Supports:
 * - ?provider=github|linkedin|... (disconnects source, revokes tokens, retracts source evidence, invalidates caches)
 * - ?scope=all_dna (full Student DNA purge across stores, tokens, caches, and consent)
 */
export async function DELETE(req: NextRequest) {
  const authResult = await authorizeStudentDnaAccess(req, {
    requestedCandidateId: req.nextUrl.searchParams.get("candidateId"),
    resourceName: "/api/student-dna/privacy",
  });
  if (!authResult.ok) return authResult.response;

  const { studentId } = authResult;
  const provider = (req.nextUrl.searchParams.get("provider") || "").toLowerCase().trim();
  const scope = (req.nextUrl.searchParams.get("scope") || "").toLowerCase().trim();

  if (scope === "all_dna") {
    const [dnaPurge, profilePurge] = await Promise.all([
      purgeUserStudentDNA(studentId),
      Promise.resolve(purgeStudentProfileDataForUser(studentId)),
    ]);
    await COIConsentService.revokeConsent(studentId).catch(() => {});
    invalidateUserDNAScope(studentId);
    invalidateClaimVerificationCache(studentId);
    invalidateStudentOrchestrationCache(studentId);
    purgeDnaSecurityAuditLogs(studentId);

    const finalAudit = recordDnaSecurityAudit({
      userId: studentId,
      actorId: studentId,
      actorRole: "student",
      action: "DNA_PURGED",
      targetResource: "all_dna",
      outcome: "COMPLETED",
      details: `Purged ${dnaPurge.removedEvidenceCount} evidence items and ${profilePurge.removedConnections} source connections.`,
    });

    return NextResponse.json(
      {
        success: true,
        scope: "all_dna",
        purged: { ...dnaPurge, ...profilePurge },
        auditEventId: finalAudit.id,
      },
      { status: 200, headers: DNA_NO_STORE_HEADERS }
    );
  }

  if (provider && ALLOWED_SOURCE_PROVIDERS.has(provider)) {
    let disconnected = false;
    if (provider === "github" || provider === "linkedin" || provider === "email") {
      disconnected = disconnectAccountForUser(studentId, provider).disconnected;
    }

    const mappedSource =
      provider === "github" || provider === "linkedin" || provider === "resume" || provider === "hackathon" || provider === "certification"
        ? provider
        : undefined;
    const retracted = mappedSource ? await retractEvidenceBySource(studentId, mappedSource) : { removedCount: 0 };

    invalidateUserDNAScope(studentId);
    invalidateClaimVerificationCache(studentId);
    invalidateStudentOrchestrationCache(studentId);

    const audit = recordDnaSecurityAudit({
      userId: studentId,
      actorId: studentId,
      actorRole: "student",
      action: "SOURCE_DISCONNECTED",
      targetResource: provider,
      outcome: "COMPLETED",
      details: `Disconnected provider '${provider}' (accountRemoved=${disconnected}, retractedEvidence=${retracted.removedCount}).`,
    });

    return NextResponse.json(
      {
        success: true,
        provider,
        disconnected,
        retractedEvidenceCount: retracted.removedCount,
        auditEventId: audit.id,
      },
      { status: 200, headers: DNA_NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    { success: false, error: "Specify either a valid ?provider=... or ?scope=all_dna." },
    { status: 400, headers: DNA_NO_STORE_HEADERS }
  );
}
