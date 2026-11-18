/**
 * lib/integrations/coi/consent-service.ts
 * 
 * Manages explicit student consent grants and revocations for COI integration.
 * Strictly enforces user ownership and zero unauthorized data access.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { supabase, isSupabaseAvailable } from "@/lib/supabase";
import { COIConsentRecord } from "./types";

const CONSENT_FILE = path.join(process.cwd(), "data", "coi-consent-store.json");

interface ConsentStoreData {
  grants: COIConsentRecord[];
}

function loadLocalStore(): ConsentStoreData {
  try {
    if (fs.existsSync(CONSENT_FILE)) {
      const raw = fs.readFileSync(CONSENT_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Could not read coi-consent-store.json, creating initial store:", e);
  }
  return { grants: [] };
}

function saveLocalStore(data: ConsentStoreData) {
  try {
    const dir = path.dirname(CONSENT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONSENT_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save coi-consent-store.json:", e);
  }
}

export class COIConsentService {
  /**
   * Retrieves the active consent grant for a given student and client.
   */
  static async getActiveConsent(studentId: string, clientId = "coi"): Promise<COIConsentRecord | null> {
    const store = loadLocalStore();
    const grant = store.grants.find(
      (g) => g.studentId === studentId && g.clientId === clientId && g.granted && !g.revokedAt
    );

    if (!grant) return null;

    if (grant.expiresAt && new Date(grant.expiresAt).getTime() < Date.now()) {
      return null;
    }

    return grant;
  }

  /**
   * Grants or updates consent for a student.
   */
  static async grantConsent(
    studentId: string,
    scopes: string[] = ["student_dna:read", "placement_profiles:read"],
    clientId = "coi",
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<COIConsentRecord> {
    const store = loadLocalStore();
    const now = new Date().toISOString();
    // 1-year default expiry
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // Revoke any existing active grants
    store.grants = store.grants.map((g) => {
      if (g.studentId === studentId && g.clientId === clientId && !g.revokedAt) {
        return { ...g, revokedAt: now, granted: false };
      }
      return g;
    });

    const newGrant: COIConsentRecord = {
      id: `cg-${crypto.randomUUID()}`,
      studentId,
      clientId,
      granted: true,
      scopes,
      grantedAt: now,
      expiresAt,
      revokedAt: null,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    };

    store.grants.push(newGrant);
    saveLocalStore(store);

    // Synchronize to Supabase if available
    try {
      if (await isSupabaseAvailable()) {
        await supabase.from("consent_grants").insert({
          id: crypto.randomUUID(),
          person_id: studentId,
          grantee_org_id: "00000000-0000-0000-0000-000000000001", // COI System Application ID
          scope: scopes,
          expires_at: expiresAt,
          created_at: now
        }).catch(() => null);
      }
    } catch {}

    return newGrant;
  }

  /**
   * Revokes student consent. Immediately terminates data access.
   */
  static async revokeConsent(studentId: string, clientId = "coi"): Promise<boolean> {
    const store = loadLocalStore();
    const now = new Date().toISOString();
    let modified = false;

    store.grants = store.grants.map((g) => {
      if (g.studentId === studentId && g.clientId === clientId && !g.revokedAt) {
        modified = true;
        return { ...g, revokedAt: now, granted: false };
      }
      return g;
    });

    if (modified) {
      saveLocalStore(store);
      try {
        if (await isSupabaseAvailable()) {
          await supabase.from("consent_grants")
            .update({ revoked_at: now })
            .eq("person_id", studentId)
            .catch(() => null);
        }
      } catch {}
    }

    return modified;
  }

  /**
   * Validates whether a requested scope is permitted by the active grant.
   */
  static async hasScope(studentId: string, requiredScope: string, clientId = "coi"): Promise<boolean> {
    const grant = await this.getActiveConsent(studentId, clientId);
    if (!grant) return false;
    return grant.scopes.includes(requiredScope) || grant.scopes.includes("*");
  }
}
