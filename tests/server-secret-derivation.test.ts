import test from "node:test";
import assert from "node:assert/strict";
import { resolveDomainSecret } from "@/lib/crypto/server-secret";
import { createSession, getSessionByToken } from "@/lib/auth/store";
import { encryptToken, decryptToken } from "@/lib/crypto/token-vault";
import { deriveSessionSeed } from "@/lib/interview/coding-parameterizer";

const SECRET_ENV_KEYS = [
  "SESSION_SECRET",
  "AUTH_SECRET",
  "NEXTAUTH_SECRET",
  "TOKEN_VAULT_SECRET",
  "APP_SECRET",
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
];

function withEnv(overrides: Record<string, string | undefined>, fn: () => void) {
  const backup: Record<string, string | undefined> = {};
  for (const k of new Set([...SECRET_ENV_KEYS, ...Object.keys(overrides), "NODE_ENV", "VERCEL"])) {
    backup[k] = process.env[k];
    if (SECRET_ENV_KEYS.includes(k)) {
      delete process.env[k];
    }
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    fn();
  } finally {
    for (const [k, v] of Object.entries(backup)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test("derives deterministic domain-separated secrets in Vercel production without SESSION_SECRET", () => {
  withEnv(
    {
      NODE_ENV: "production",
      VERCEL: "1",
      SUPABASE_SERVICE_ROLE_KEY: "sb_secret_test_root_key_with_high_entropy_123456",
    },
    () => {
      const s1 = resolveDomainSecret({
        domain: "session-signing",
        envKeys: ["SESSION_SECRET", "AUTH_SECRET", "NEXTAUTH_SECRET"],
      });
      const s2 = resolveDomainSecret({
        domain: "session-signing",
        envKeys: ["SESSION_SECRET", "AUTH_SECRET", "NEXTAUTH_SECRET"],
      });
      const v1 = resolveDomainSecret({
        domain: "token-vault",
        envKeys: ["TOKEN_VAULT_SECRET", "AUTH_SECRET", "NEXTAUTH_SECRET"],
      });
      const p1 = resolveDomainSecret({
        domain: "coding-parameterizer",
        envKeys: ["APP_SECRET", "SESSION_SECRET"],
      });

      assert.equal(s1, s2);
      assert.equal(s1.length, 64);
      assert.notEqual(s1, v1);
      assert.notEqual(s1, p1);
      assert.notEqual(v1, p1);

      // Verify end-to-end session creation + verification, vault encryption, and parameterizer seed
      const session = createSession("u-student-sample-001", "student");
      assert.ok(session.token.includes("."));
      const verified = getSessionByToken(session.token);
      assert.equal(verified?.userId, "u-student-sample-001");

      const encrypted = encryptToken("gho_example_oauth_token", "u-student-sample-001");
      assert.equal(decryptToken(encrypted, "u-student-sample-001"), "gho_example_oauth_token");

      const seed = deriveSessionSeed("sess-1", "two-sum");
      assert.equal(seed.length, 64);
    }
  );
});

test("ignores NEXT_PUBLIC_ variables and fails closed in production when zero server secrets exist", () => {
  withEnv(
    {
      NODE_ENV: "production",
      VERCEL: "1",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public_anon_key_should_never_sign_sessions_12345",
    },
    () => {
      assert.throws(() =>
        resolveDomainSecret({
          domain: "session-signing",
          envKeys: ["SESSION_SECRET", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
          allowTestFallback: false,
        })
      );
    }
  );
});
