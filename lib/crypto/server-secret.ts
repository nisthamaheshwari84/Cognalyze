import crypto from "crypto";
import { isTestRuntime } from "@/lib/env";

/**
 * High-entropy, strictly server-side root secrets already provisioned across Cognalyze deployments.
 * Public variables (NEXT_PUBLIC_*) are intentionally excluded.
 */
const ROOT_SERVER_SECRET_ENV_KEYS = [
  "COGNALYZE_INTERVIEW_HANDOFF_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "POSTGRES_URL",
  "GROQ_API_KEY",
  "GROQ_API_KEY_2",
  "GROQ_API_KEY_3",
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "GITHUB_CLIENT_SECRET",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_TOKEN",
  "GITHUB_PAT",
  "BREVO_API_KEY",
  "RESEND_API_KEY",
  "VERCEL_AUTOMATION_BYPASS_SECRET",
] as const;

const ephemeralDevSecrets = new Map<string, string>();
const warnedMissingSecretDomains = new Set<string>();

function readValidSecretEnv(key: string, minLength: number): string | null {
  if (!key || key.startsWith("NEXT_PUBLIC_")) return null;
  const val = (process.env[key] || "").trim();
  if (val.length < minLength) return null;
  if (val.toLowerCase().includes("placeholder")) return null;
  return val;
}

export interface ResolveDomainSecretOptions {
  /** Domain separation identifier, e.g. "session-signing", "token-vault". */
  domain: string;
  /** Primary explicit env var names checked before derived root fallback. */
  envKeys: string[];
  /** Minimum accepted character length for explicit/root secrets (default: 16). */
  minLength?: number;
  /** Allow deterministic test runtime fallback when running under unit/integration test runners. */
  allowTestFallback?: boolean;
}

/**
 * Resolves a cryptographic secret for a specific server subsystem:
 * 1. Explicit dedicated environment variables when configured.
 * 2. Domain-separated HMAC-SHA256 derivation from existing server-only secrets
 *    (deterministic across serverless instances without static hardcoded fallbacks).
 * 3. Test-only fallback under test runners, or ephemeral per-process dev key locally.
 * 4. Fails closed in production if no server-only secret exists at all.
 */
export function resolveDomainSecret(options: ResolveDomainSecretOptions): string {
  const minLength = options.minLength ?? 16;

  for (const key of options.envKeys) {
    const explicit = readValidSecretEnv(key, minLength);
    if (explicit) {
      return explicit;
    }
  }

  for (const rootKey of ROOT_SERVER_SECRET_ENV_KEYS) {
    const rootSecret = readValidSecretEnv(rootKey, minLength);
    if (rootSecret) {
      return crypto
        .createHmac("sha256", rootSecret)
        .update(`cognalyze:${options.domain}:v1`)
        .digest("hex");
    }
  }

  if (options.allowTestFallback !== false && isTestRuntime()) {
    return `cognalyze_test_only_${options.domain}_not_for_production`;
  }

  const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
  if (isProd) {
    const expected = options.envKeys.join(" or ");
    throw new Error(
      `${expected} (or a server-side root secret like SUPABASE_SERVICE_ROLE_KEY) must be configured in production.`
    );
  }

  let ephemeral = ephemeralDevSecrets.get(options.domain);
  if (!ephemeral) {
    ephemeral = crypto.randomBytes(32).toString("hex");
    ephemeralDevSecrets.set(options.domain, ephemeral);
    if (!warnedMissingSecretDomains.has(options.domain)) {
      warnedMissingSecretDomains.add(options.domain);
      console.warn(
        `[server-secret] No configured secret found for "${options.domain}" in local dev; using ephemeral process key.`
      );
    }
  }
  return ephemeral;
}
