/**
 * tests/phase-1-evidence-foundation-security.test.ts
 * 
 * COGNALYZE PHASE 1 VERIFICATION SUITE
 * Evidence Architecture, Data Foundation & Security Baseline
 * 
 * Verifies:
 * 1. AES-256-GCM Encrypted Token Vault with authenticated tag and tenant binding.
 * 2. ConnectedAccount token encryption at rest without plaintext leakage.
 * 3. Canonical Evidence data model normalization and type safety.
 * 4. Multi-Tenant Snapshot & RLS hardening (zero USING (true) snapshot management).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import {
  encryptToken,
  decryptToken,
  isEncryptedToken
} from "../lib/crypto/token-vault";
import {
  addConnectedAccount,
  getDecryptedTokenForUser,
  updateConnectedAccountToken
} from "../lib/auth/store";
import {
  CanonicalEvidenceItem,
  CanonicalClaimRecord,
  toCanonicalStatus
} from "../lib/evidence/canonical-types";

test("PHASE 1 SECURITY: 1. AES-256-GCM Token Vault Encryption, IV Randomness & Tamper Resistance", () => {
  const sampleToken = "ghp_secureAccessToken99887766554433221100";
  const userId = `user_vault_test_${Date.now()}`;

  // Encrypt token
  const encrypted1 = encryptToken(sampleToken, userId);
  const encrypted2 = encryptToken(sampleToken, userId);

  // Invariant 1: Format adheres to enc_v1:<iv>:<tag>:<cipher>
  assert.ok(isEncryptedToken(encrypted1), "Must be recognized as encrypted token");
  assert.ok(isEncryptedToken(encrypted2), "Must be recognized as encrypted token");
  assert.ok(encrypted1.startsWith("enc_v1:"), "Must start with enc_v1 prefix");

  // Invariant 2: IV randomness ensures identical inputs produce distinct ciphertexts
  assert.notEqual(encrypted1, encrypted2, "Two encryptions of same token must produce different IV and ciphertext");

  // Invariant 3: Successful roundtrip decryption
  const decrypted = decryptToken(encrypted1, userId);
  assert.equal(decrypted, sampleToken, "Decrypted token must match original plaintext");

  // Invariant 4: Tamper resistance (modifying 1 character in ciphertext fails authentication)
  const parts = encrypted1.split(":");
  const tamperedCipher = parts[3].slice(0, -2) + (parts[3].slice(-2) === "aa" ? "bb" : "aa");
  const tamperedPayload = `${parts[0]}:${parts[1]}:${parts[2]}:${tamperedCipher}`;
  assert.equal(decryptToken(tamperedPayload, userId), null, "Tampered ciphertext must fail authentication and return null");

  // Invariant 5: Raw plaintext does not report as encrypted
  assert.equal(isEncryptedToken("ghp_unencrypted_raw_token"), false, "Plaintext token must return false");
  assert.equal(decryptToken("ghp_unencrypted_raw_token", userId), null, "Decrypting plaintext must return null");
});

test("PHASE 1 SECURITY: 2. Tenant-Bound Token Encryption Isolation", () => {
  const token = "ghp_candidateSecretToken_Alpha_123";
  const studentAlpha = "student_alpha_uuid_101";
  const studentBeta = "student_beta_uuid_202";

  // Encrypt with studentAlpha context
  const cipherAlpha = encryptToken(token, studentAlpha);

  // Student Alpha can decrypt successfully
  const decryptedAlpha = decryptToken(cipherAlpha, studentAlpha);
  assert.equal(decryptedAlpha, token, "Candidate Alpha must be able to decrypt their own token");

  // Student Beta attempting to decrypt with their own context MUST return null
  const decryptedBeta = decryptToken(cipherAlpha, studentBeta);
  assert.equal(decryptedBeta, null, "Candidate Beta must NOT be able to decrypt Candidate Alpha's token");
});

test("PHASE 1 SECURITY: 3. ConnectedAccount Ingestion with Encrypted Token Storage at Rest", () => {
  const testUserId = `user_oauth_test_${Date.now()}`;
  const rawGitHubToken = "gho_oauthCandidateLiveToken456";

  // Add connected account with raw access token
  const account = addConnectedAccount({
    userId: testUserId,
    provider: "github",
    providerUserId: `gh_uid_${Date.now()}`,
    providerEmail: `student_${Date.now()}@university.edu`,
    accessToken: rawGitHubToken,
    tokenScope: ["read:user", "repo"]
  });

  // Verify account object has encrypted token, never plaintext
  assert.ok(account.encryptedAccessToken, "Account must have encryptedAccessToken populated");
  assert.notEqual(account.encryptedAccessToken, rawGitHubToken, "Plaintext token must NEVER be stored at rest");
  assert.ok(isEncryptedToken(account.encryptedAccessToken!), "Stored token must be AES-256-GCM format");

  // Decrypt via authorized store helper
  const recoveredToken = getDecryptedTokenForUser(testUserId, "github");
  assert.equal(recoveredToken, rawGitHubToken, "Authorized user must retrieve decrypted token");

  // Foreign user cannot decrypt
  const foreignAttempt = getDecryptedTokenForUser(`foreign_user_${Date.now()}`, "github");
  assert.equal(foreignAttempt, null, "Foreign user ID must return null");

  // Update token via updateConnectedAccountToken
  const updatedToken = "gho_newRefreshedToken789";
  const updated = updateConnectedAccountToken(testUserId, "github", updatedToken, ["read:user", "repo", "read:org"]);
  assert.equal(updated, true, "Update token should succeed");

  const newRecovered = getDecryptedTokenForUser(testUserId, "github");
  assert.equal(newRecovered, updatedToken, "Updated token must match new refreshed plaintext");
});

test("PHASE 1 DATA FOUNDATION: 4. Canonical Evidence Model & Status Normalization", () => {
  // Test canonical status mappings
  assert.equal(toCanonicalStatus("verified"), "VERIFIED");
  assert.equal(toCanonicalStatus("established"), "VERIFIED");
  assert.equal(toCanonicalStatus("independently_verified"), "VERIFIED");
  assert.equal(toCanonicalStatus("demonstrated"), "DEMONSTRATED");
  assert.equal(toCanonicalStatus("student_reported"), "STUDENT_REPORTED");
  assert.equal(toCanonicalStatus("claimed"), "STUDENT_REPORTED");
  assert.equal(toCanonicalStatus("conflicting_evidence"), "CONFLICTING");
  assert.equal(toCanonicalStatus("rate_limited"), "INACCESSIBLE");
  assert.equal(toCanonicalStatus("not_connected"), "NOT_CONNECTED");

  // Construct canonical evidence item with all mandatory provenance fields
  const canonicalItem: CanonicalEvidenceItem = {
    id: "ev_test_101",
    userId: "student_uuid_55",
    sourceId: "gh_repo_cognalyze_core",
    sourceType: "github",
    sourceUrl: "https://github.com/candidate/cognalyze-core",
    artifactRef: "src/auth/middleware.ts#L45-L60",
    commitSha: "a1b2c3d4e5f607182930415263748596a7b8c9d0",
    verbatimQuote: "export function authGuard(req: Request) { ... }",
    skillId: "typescript",
    skillName: "TypeScript",
    category: "Languages",
    evidenceType: "source_file",
    strength: 0.95,
    directness: "DIRECT_IMPLEMENTATION",
    confidence: "HIGH",
    verificationStatus: "VERIFIED",
    verificationMethod: "ast_import_parser",
    verificationTimestamp: new Date().toISOString(),
    observedAt: new Date().toISOString(),
    contentHash: "sha256_dummy_hash_for_test"
  };

  assert.equal(canonicalItem.skillId, "typescript");
  assert.equal(canonicalItem.directness, "DIRECT_IMPLEMENTATION");
  assert.equal(canonicalItem.verificationStatus, "VERIFIED");
});

test("PHASE 1 SECURITY: 5. Database Migration Audit & Elimination of Insecure Snapshot Policy", () => {
  // Read the new security hardening migration file
  const migrationPath = path.join(
    process.cwd(),
    "supabase",
    "migrations",
    "20261101_evidence_security_and_rls_hardening.sql"
  );
  assert.ok(fs.existsSync(migrationPath), "Migration file must exist on disk");

  const sqlContent = fs.readFileSync(migrationPath, "utf-8");

  // Invariant 1: Insecure policy is explicitly dropped
  assert.ok(
    sqlContent.includes('DROP POLICY IF EXISTS "Recruiters and admins can manage snapshots" ON public.dna_snapshots;'),
    "Migration must explicitly drop the insecure universal policy"
  );

  // Invariant 2: Candidate snapshot isolation policy exists
  assert.ok(
    sqlContent.includes("auth.uid()::TEXT = student_id"),
    "Migration must scope student snapshot access strictly to auth.uid()"
  );

  // Invariant 3: Recruiter policy requires recruiter_profiles check
  assert.ok(
    sqlContent.includes("SELECT 1 FROM public.recruiter_profiles"),
    "Recruiter access must verify membership in recruiter_profiles"
  );

  // Invariant 4: No universal USING (true) for snapshot management
  const snapshotSection = sqlContent.split("-- 2. ENABLE RLS")[0];
  const uncommentedSnapshotSection = snapshotSection.replace(/--.*$/gm, "");
  assert.ok(
    !uncommentedSnapshotSection.includes("USING (true)"),
    "Snapshot management section must NEVER contain USING (true) in policy definition"
  );

  // Invariant 5: RLS enabled on all 9 orphaned evidence tables
  const expectedTables = [
    "sources",
    "claims",
    "evidence_items",
    "evidence_links",
    "capability_nodes",
    "capability_edges",
    "evidence",
    "pipeline_evidence",
    "pipeline_candidate_decisions",
    "connected_accounts"
  ];

  for (const table of expectedTables) {
    assert.ok(
      sqlContent.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`) ||
      sqlContent.includes(`ALTER TABLE IF EXISTS public.${table} ENABLE ROW LEVEL SECURITY`),
      `Migration must enable RLS on public.${table}`
    );
  }
});
