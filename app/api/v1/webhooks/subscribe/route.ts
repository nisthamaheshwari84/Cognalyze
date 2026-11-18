import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { COIWebhookSubscription } from "@/lib/integrations/coi/types";

const WEBHOOKS_FILE = path.join(process.cwd(), "data", "coi-webhooks-store.json");

function loadWebhooks(): COIWebhookSubscription[] {
  try {
    if (fs.existsSync(WEBHOOKS_FILE)) {
      return JSON.parse(fs.readFileSync(WEBHOOKS_FILE, "utf-8"));
    }
  } catch {}
  return [];
}

function saveWebhooks(items: COIWebhookSubscription[]) {
  try {
    const dir = path.dirname(WEBHOOKS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(WEBHOOKS_FILE, JSON.stringify(items, null, 2), "utf-8");
  } catch {}
}

/**
 * POST /api/v1/webhooks/subscribe
 * 
 * Registers approved event subscriptions for COI.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const body = await req.json().catch(() => ({}));
    const isDemo = process.env.NODE_ENV !== "production" && (req.nextUrl.searchParams.get("demo") === "true" || body.demo === true);

    if (!auth && !isDemo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUrl, events } = body;
    if (!targetUrl || typeof targetUrl !== "string") {
      return NextResponse.json({ error: "targetUrl is required" }, { status: 400 });
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
      ? events.filter((e) => validEvents.includes(e))
      : ["student_dna.updated", "student.consent.revoked"];

    const sub: COIWebhookSubscription = {
      id: `sub-${crypto.randomUUID()}`,
      targetUrl,
      events: selectedEvents as any,
      secret: crypto.randomBytes(32).toString("hex"),
      createdAt: new Date().toISOString(),
      active: true,
    };

    const subs = loadWebhooks();
    subs.push(sub);
    saveWebhooks(subs);

    return NextResponse.json({
      success: true,
      subscription: sub,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Webhook registration failed" }, { status: 500 });
  }
}
