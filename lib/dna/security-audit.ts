/**
 * lib/dna/security-audit.ts
 *
 * Phase 2 Student Identity, Privacy & Cross-User Isolation Boundary.
 * - Enforces strict server-side ownership on every Student DNA route
 * - Strips OAuth tokens / secrets before serialization or audit logging
 * - Emits standardized Cache-Control: no-store, private headers
 * - Maintains an isolated, append-only security & privacy audit trail per student
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { ConnectedAccount } from "@/lib/auth/types";
import { isTestRuntime } from "@/lib/env";

type VerifiedAuthContext = NonNullable<Awaited<ReturnType<typeof getAuthenticatedContext>>>;

export const DNA_NO_STORE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  Vary: "Cookie, Authorization",
};

export interface DnaSecurityAuditEvent {
  id: string;
  userId: string;
  actorId: string;
  actorRole: "student" | "recruiter" | "system" | "anonymous";
  action:
    | "DNA_ACCESSED"
    | "EVIDENCE_MUTATED"
    | "EVIDENCE_DELETED"
    | "SOURCE_CONNECTED"
    | "SOURCE_DISCONNECTED"
    | "CONSENT_UPDATED"
    | "DNA_PURGED"
    | "CROSS_USER_ACCESS_DENIED"
    | "SSRF_URL_BLOCKED";
  targetResource: string;
  outcome: "ALLOWED" | "DENIED" | "COMPLETED";
  details: string;
  timestamp: string;
}

const AUDIT_MEMORY_STORE = new Map<string, DnaSecurityAuditEvent[]>();
const SENSITIVE_KEY_PATTERN = /(token|secret|password|hash|authorization|cookie|key|credential)/i;

function isServerlessEnv(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function getSecurityAuditFilePath(): string {
  if (isServerlessEnv()) {
    return path.join("/tmp", "cognalyze-dna-security-audit.json");
  }
  return path.join(process.cwd(), "data", "dna-security-audit.json");
}

let loadedAuditFromDisk = false;

function ensureAuditLoaded(): void {
  if (loadedAuditFromDisk) return;
  loadedAuditFromDisk = true;
  try {
    const filePath = getSecurityAuditFilePath();
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (parsed && typeof parsed === "object") {
        for (const [uid, events] of Object.entries(parsed)) {
          if (Array.isArray(events)) {
            AUDIT_MEMORY_STORE.set(uid, events as DnaSecurityAuditEvent[]);
          }
        }
      }
    }
  } catch {
    // Non-fatal fallback to memory store
  }
}

function persistAuditToDisk(): void {
  try {
    const filePath = getSecurityAuditFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const serialized = Object.fromEntries(AUDIT_MEMORY_STORE.entries());
    fs.writeFileSync(filePath, JSON.stringify(serialized, null, 2), "utf-8");
  } catch {
    // Non-fatal fallback
  }
}

export function redactSensitiveText(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/ghp_[A-Za-z0-9_]+/g, "[REDACTED_GITHUB_TOKEN]")
    .replace(/github_pat_[A-Za-z0-9_]+/g, "[REDACTED_GITHUB_PAT]")
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [REDACTED_TOKEN]")
    .replace(
      /(access_token|refresh_token|encryptedAccessToken|secret|password)\s*[:=]\s*[^\s,;]+/gi,
      "$1=[REDACTED]"
    )
    .slice(0, 600);
}

export function sanitizeConnectedAccountForClient(account: ConnectedAccount): Omit<ConnectedAccount, "encryptedAccessToken"> {
  const safe: Record<string, any> = {};
  for (const [k, v] of Object.entries(account as Record<string, any>)) {
    if (SENSITIVE_KEY_PATTERN.test(k) && k !== "tokenScope") {
      continue;
    }
    safe[k] = v;
  }
  return safe as Omit<ConnectedAccount, "encryptedAccessToken">;
}

export function recordDnaSecurityAudit(event: Omit<DnaSecurityAuditEvent, "id" | "timestamp">): DnaSecurityAuditEvent {
  ensureAuditLoaded();
  const fullEvent: DnaSecurityAuditEvent = {
    id: `sec_${crypto.randomBytes(8).toString("hex")}`,
    userId: event.userId,
    actorId: event.actorId,
    actorRole: event.actorRole,
    action: event.action,
    targetResource: event.targetResource.slice(0, 120),
    outcome: event.outcome,
    details: redactSensitiveText(event.details),
    timestamp: new Date().toISOString(),
  };

  const list = AUDIT_MEMORY_STORE.get(event.userId) || [];
  list.unshift(fullEvent);
  if (list.length > 200) list.length = 200;
  AUDIT_MEMORY_STORE.set(event.userId, list);
  persistAuditToDisk();

  if (!isTestRuntime()) {
    void (async () => {
      try {
        const { isSupabaseAvailable, supabaseAdmin } = await import("@/lib/supabase");
        if ((await isSupabaseAvailable()) && supabaseAdmin) {
          await supabaseAdmin
            .from("dna_audit_logs")
            .insert({
              id: fullEvent.id,
              user_id: fullEvent.userId,
              change_type: `${fullEvent.action}:${fullEvent.outcome}`,
              reason: `${fullEvent.targetResource} — ${fullEvent.details}`,
              created_at: fullEvent.timestamp,
            })
            .catch(() => {});
        }
      } catch {
        // Non-blocking audit persistence
      }
    })();
  }

  return fullEvent;
}

export function getDnaSecurityAuditLogs(userId: string): DnaSecurityAuditEvent[] {
  ensureAuditLoaded();
  return [...(AUDIT_MEMORY_STORE.get(userId) || [])];
}

export function purgeDnaSecurityAuditLogs(userId: string): void {
  ensureAuditLoaded();
  AUDIT_MEMORY_STORE.delete(userId);
  persistAuditToDisk();
}

export function sanitizeCandidateQueryId(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return null;
  return trimmed;
}

export async function authorizeStudentDnaAccess(
  req: NextRequest,
  options?: {
    requestedCandidateId?: string | null;
    resourceName?: string;
  }
): Promise<
  | { ok: true; studentId: string; auth: VerifiedAuthContext }
  | { ok: false; response: NextResponse }
> {
  const resource = options?.resourceName || req.nextUrl.pathname;
  const auth = await getAuthenticatedContext(req);

  if (!auth?.user) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "UNAUTHORIZED",
          message: "Authentication required to access Student DNA resources.",
        },
        { status: 401, headers: DNA_NO_STORE_HEADERS }
      ),
    };
  }

  if (auth.user.accountType !== "student") {
    recordDnaSecurityAudit({
      userId: sanitizeCandidateQueryId(options?.requestedCandidateId) || auth.user.id,
      actorId: auth.user.id,
      actorRole: auth.user.accountType,
      action: "CROSS_USER_ACCESS_DENIED",
      targetResource: resource,
      outcome: "DENIED",
      details: `Non-student role (${auth.user.accountType}) attempted direct access to private Student DNA endpoint.`,
    });
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "FORBIDDEN",
          message: "Private Student DNA is strictly isolated to the owning student account.",
        },
        { status: 403, headers: DNA_NO_STORE_HEADERS }
      ),
    };
  }

  const requestedId = sanitizeCandidateQueryId(options?.requestedCandidateId);
  if (requestedId && requestedId !== auth.user.id) {
    recordDnaSecurityAudit({
      userId: auth.user.id,
      actorId: auth.user.id,
      actorRole: "student",
      action: "CROSS_USER_ACCESS_DENIED",
      targetResource: resource,
      outcome: "DENIED",
      details: `Student ${auth.user.id} attempted to query candidateId=${requestedId}.`,
    });
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "FORBIDDEN",
          message: "Cross-user Student DNA access is strictly prohibited.",
        },
        { status: 403, headers: DNA_NO_STORE_HEADERS }
      ),
    };
  }

  return { ok: true, studentId: auth.user.id, auth };
}
