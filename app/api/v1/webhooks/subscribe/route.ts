import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { DNA_NO_STORE_HEADERS, recordDnaSecurityAudit } from "@/lib/dna/security-audit";
import { isSafePublicUrl } from "@/lib/resilience/security";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { COIWebhookSubscription } from "@/lib/integrations/coi/types";

export const dynamic = "force-dynamic";

const WEBHOOKS_FILE = path.join(process.cwd(), "data", "coi-webhooks-store.json");

function loadWebhooks(): Array<COIWebhookSubscription & { userId?: string }> {
  try {
    if (fs.existsSync(WEBHOOKS_FILE)) {
      return JSON.parse(fs.readFileSync(WEBHOOKS_FILE, "utf-8"));
    }
  } catch {}
  return [];
}

function saveWebhooks(items: Array<COIWebhookSubscription & { userId?: string }>) {
  try {
    const dir = path.dirname(WEBHOOKS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(WEBHOOKS_FILE, JSON.stringify(items, null, 2), "utf-8");
  } catch {}
}

/**
 * POST /api/v1/webhooks/subscribe
 * Registers approved event subscriptions for COI strictly for the authenticated user
 * with SSRF validation on targetUrl and secret omission/redaction safeguards.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const body = await req.json().catch(() => ({}));

    if (!auth?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: DNA_NO_STORE_HEADERS }
      );
    }

    const { targetUrl, events } = body;
    if (!targetUrl || typeof targetUrl !== "string") {
      return NextResponse.json(
        { error: "targetUrl is required" },
        { status: 400, headers: DNA_NO_STORE_HEADERS }
      );
    }

    const urlSafety = isSafePublicUrl(targetUrl);
    if (!urlSafety.safe) {
      recordDnaSecurityAudit({
        userId: auth.user.id,
        actorId: auth.user.id,
        actorRole: auth.user.accountType,
        action: "SSRF_URL_BLOCKED",
        targetResource: "/api/v1/webhooks/subscribe",
        outcome: "DENIED",
        details: `Blocked unsafe webhook URL (${urlSafety.reason}).`,
      });
      return NextResponse.json(
        { error: `Invalid or restricted targetUrl: ${urlSafety.reason}` },
        { status: 400, headers: DNA_NO_STORE_HEADERS }
      );
    }

    const validEvents = [
      "student_dna.created",
      "student_dna.updated",
      "student_dna.evidence.updated",
      "student_dna.placement_profile.updated",
      "student_dna.deleted",
      "student.consent.revoked",
    ];

    const selectedEvents = Array.isArray(events)
      ? events.filter((e: unknown) => typeof e === "string" && validEvents.includes(e))
      : ["student_dna.updated", "student.consent.revoked"];

    const secret = crypto.randomBytes(32).toString("hex");
    const sub: COIWebhookSubscription & { userId: string } = {
      id: `sub-${crypto.randomUUID()}`,
      userId: auth.user.id,
      targetUrl: targetUrl.trim(),
      events: selectedEvents as any,
      secret,
      createdAt: new Date().toISOString(),
      active: true,
    };

    const subs = loadWebhooks();
    subs.push(sub);
    saveWebhooks(subs);

    return NextResponse.json(
      {
        success: true,
        subscription: {
          id: sub.id,
          userId: sub.userId,
          targetUrl: sub.targetUrl,
          events: sub.events,
          createdAt: sub.createdAt,
          active: sub.active,
        },
      },
      { status: 201, headers: DNA_NO_STORE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Webhook registration failed" },
      { status: 500, headers: DNA_NO_STORE_HEADERS }
    );
  }
}
