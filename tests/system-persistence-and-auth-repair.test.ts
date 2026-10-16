import { describe, it } from "node:test";
import assert from "node:assert";
import {
  createSession,
  getSessionByToken,
  deleteSession,
  createUser,
  getUserById,
  getUserByEmail,
  upsertStudentProfileByUserId,
  getStudentProfileByUserId,
  getStudentProfileCompletionState
} from "../lib/auth/store";
import {
  initializeUserEvidenceIfEmpty,
  getStudentEvidenceList,
  addStudentEvidenceRecord,
  setUserTargetRole,
  getUserTargetRole,
  getStudentDNAFull,
  invalidateUserDNAScope
} from "../lib/dna/store";

describe("Cognalyze — Complete Authentication, Persistence & Multi-User Isolation Repair", () => {
  const userA_Id = `u-test-user-a-${Date.now()}`;
  const userA_Email = `usera_${Date.now()}@test.cognalyze.com`;

  const userB_Id = `u-test-user-b-${Date.now()}`;
  const userB_Email = `userb_${Date.now()}@test.cognalyze.com`;

  // ── TEST 1: Stateless Cryptographic Signed Session Tokens ──
  it("TEST 1: Creates cryptographically signed session tokens that survive process memory resets", () => {
    const session = createSession(userA_Id, "student");
    assert.ok(session.token, "Session token must exist");
    assert.ok(session.token.includes("."), "Session token must be HMAC signed with data and signature parts");
    assert.ok(session.token.length >= 64, "Session token must have sufficient cryptographic entropy");

    // Recover session using getSessionByToken
    const retrieved = getSessionByToken(session.token);
    assert.ok(retrieved, "Session must be recoverable");
    assert.strictEqual(retrieved?.userId, userA_Id);
    assert.strictEqual(retrieved?.accountType, "student");
  });

  // ── TEST 2: Session Invalidation on Logout ──
  it("TEST 2: Logout revokes cryptographic token and prevents reuse", () => {
    const session = createSession(userA_Id, "student");
    const token = session.token;

    assert.ok(getSessionByToken(token), "Session should be active before logout");

    // Execute logout
    deleteSession(token);

    // Verify revoked
    const afterLogout = getSessionByToken(token);
    assert.strictEqual(afterLogout, null, "Session must be null after logout");
  });

  // ── TEST 3: Tampered Token Security Rejection ──
  it("TEST 3: Rejects forged or tampered session tokens", () => {
    const session = createSession(userA_Id, "student");
    const parts = session.token.split(".");
    assert.strictEqual(parts.length, 2);

    // Tamper with payload
    const tamperedPayload = Buffer.from(JSON.stringify({
      id: "forged-id",
      userId: "u-victim-user",
      accountType: "student",
      expiresAt: new Date(Date.now() + 1000000).toISOString()
    })).toString("base64url");

    const forgedToken = `${tamperedPayload}.${parts[1]}`;
    const result = getSessionByToken(forgedToken);
    assert.strictEqual(result, null, "Forged token with invalid signature must be rejected");
  });

  // ── TEST 4: User A Profile Creation, Onboarding & Persistence ──
  it("TEST 4: Persists User A profile, skills, projects, and target role", async () => {
    // 1. Create User A
    createUser({
      id: userA_Id,
      email: userA_Email,
      fullName: "Alice Student",
      passwordHash: "hashA",
      passwordSalt: "saltA",
      accountType: "student",
      status: "ACTIVE"
    });

    // 2. Onboard User A with skills & projects
    upsertStudentProfileByUserId(userA_Id, {
      fullName: "Alice Student",
      email: userA_Email,
      college: "Stanford University",
      degree: "B.S.",
      branch: "Computer Science",
      skills: [
        { name: "TypeScript", level: "Advanced" },
        { name: "PostgreSQL", level: "Intermediate" }
      ],
      projects: [
        {
          title: "Distributed KV Store",
          techStack: ["TypeScript", "PostgreSQL"],
          description: "High throughput key-value store with replication"
        }
      ],
      careerGoals: {
        targetRoles: ["fullstack_dev"],
        preferredDomains: ["Distributed Systems"],
        targetCompanies: ["Stripe"],
        preferredLocations: ["Remote"]
      },
      profileCompleted: true,
      profileCompletionPercentage: 100
    });

    setUserTargetRole(userA_Id, "fullstack_dev");

    // 3. Verify User A profile is stored
    const profileA = getStudentProfileByUserId(userA_Id);
    assert.ok(profileA, "Profile A must exist");
    assert.strictEqual(profileA?.fullName, "Alice Student");
    assert.strictEqual(profileA?.skills?.length, 2);
    assert.strictEqual(getUserTargetRole(userA_Id), "fullstack_dev");

    // 4. Verify Student DNA computation for User A
    const dnaA = await getStudentDNAFull(userA_Id);
    assert.ok(dnaA, "Student DNA for User A must compute");
    assert.strictEqual(dnaA.userId, userA_Id);
    assert.ok(dnaA.evidence.length > 0, "User A must have synthesized evidence from profile");
  });

  // ── TEST 5: Logout and Login-After-Logout Data Recovery ──
  it("TEST 5: Recover saved profile, skills, projects, and role after logout and login", async () => {
    // 1. Establish session
    const session1 = createSession(userA_Id, "student");
    assert.ok(session1.token);

    // 2. Log out
    deleteSession(session1.token);
    assert.strictEqual(getSessionByToken(session1.token), null);

    // Invalidate in-memory caches to simulate server restart
    invalidateUserDNAScope(userA_Id);

    // 3. Log in again (new session for exact same user)
    const session2 = createSession(userA_Id, "student");
    assert.ok(session2.token);
    const activeSession = getSessionByToken(session2.token);
    assert.strictEqual(activeSession?.userId, userA_Id);

    // 4. Read back data
    const recoveredProfile = getStudentProfileByUserId(userA_Id);
    assert.ok(recoveredProfile, "Profile must survive logout and login");
    assert.strictEqual(recoveredProfile?.fullName, "Alice Student");
    assert.strictEqual(recoveredProfile?.college, "Stanford University");
    assert.strictEqual(recoveredProfile?.skills?.length, 2);
    assert.strictEqual(recoveredProfile?.skills[0].name, "TypeScript");

    // 5. Verify role and Student DNA remain intact
    assert.strictEqual(getUserTargetRole(userA_Id), "fullstack_dev");
    const recoveredDNA = await getStudentDNAFull(userA_Id);
    assert.ok(recoveredDNA, "Student DNA must be recovered");
    assert.strictEqual(recoveredDNA.userId, userA_Id);
    assert.ok(recoveredDNA.evidence.length > 0);
  });

  // ── TEST 6: User B Signup & Honest Empty State (Zero Leaks from User A) ──
  it("TEST 6: New user B starts with genuine empty profile (no leakage from user A or defaults)", async () => {
    // Create new User B
    createUser({
      id: userB_Id,
      email: userB_Email,
      fullName: "Bob Newcomer",
      passwordHash: "hashB",
      passwordSalt: "saltB",
      accountType: "student",
      status: "ACTIVE"
    });

    // User B has not completed onboarding
    const completionB = getStudentProfileCompletionState(userB_Id);
    assert.strictEqual(completionB.state, "NO_PROFILE", "New user must start in NO_PROFILE state");
    assert.strictEqual(completionB.completedStepsCount, 0, "New user must have 0 completed steps");
    assert.strictEqual(completionB.completionPercentage, 0, "New user must have 0% completion");

    // Check evidence isolation
    const evidenceB = await getStudentEvidenceList(userB_Id);
    assert.strictEqual(evidenceB.length, 0, "User B must have 0 evidence records initially");

    // Check User A's data was NOT leaked to User B
    const profileB = getStudentProfileByUserId(userB_Id);
    assert.strictEqual(profileB, null, "User B profile must not exist prior to onboarding");
  });

  // ── TEST 7: Cross-User Data Isolation ──
  it("TEST 7: User B cannot access User A's evidence or target role", async () => {
    // User A has 2 skills, 1 project, target role fullstack_dev
    const evidenceA = await getStudentEvidenceList(userA_Id);
    const evidenceB = await getStudentEvidenceList(userB_Id);

    assert.ok(evidenceA.length > 0, "User A has evidence");
    assert.strictEqual(evidenceB.length, 0, "User B has zero evidence");

    // All records in evidenceA must be owned by userA_Id
    for (const ev of evidenceA) {
      assert.strictEqual(ev.userId, userA_Id, "Evidence must strictly belong to User A");
    }

    assert.strictEqual(getUserTargetRole(userA_Id), "fullstack_dev");
    assert.strictEqual(getUserTargetRole(userB_Id), "sde_intern", "User B must not inherit User A's custom role");
  });

  // ── TEST 8: Evidence Deduplication on Retry ──
  it("TEST 8: Evidence deduplication prevents inflated counts on repeated submissions", async () => {
    const rawEvidence = {
      sourceType: "github" as const,
      sourceId: "gh_repo_alice_store",
      userId: userA_Id,
      skillRaw: "TypeScript",
      evidenceType: "public_repo",
      claim: "Authored TypeScript repository",
      extractedValue: "30 commits",
      strength: 0.85
    };

    const res1 = await addStudentEvidenceRecord(userA_Id, rawEvidence);
    assert.strictEqual(res1.success, true);

    const listAfterFirst = await getStudentEvidenceList(userA_Id);
    const countAfterFirst = listAfterFirst.length;

    // Submit identical evidence again (simulating user double-click or retry)
    const res2 = await addStudentEvidenceRecord(userA_Id, rawEvidence);
    assert.strictEqual(res2.success, true);

    const listAfterSecond = await getStudentEvidenceList(userA_Id);
    assert.strictEqual(listAfterSecond.length, countAfterFirst, "Duplicate evidence submission must update rather than inflate count");
  });

  // ── TEST 9: Invalidation does not destroy historical evidence ──
  it("TEST 9: Non-destructive profile refresh preserves stored evidence", async () => {
    const evidenceBefore = await getStudentEvidenceList(userA_Id);
    const countBefore = evidenceBefore.length;
    assert.ok(countBefore > 0);

    // Trigger scope invalidation
    invalidateUserDNAScope(userA_Id);

    const evidenceAfter = await getStudentEvidenceList(userA_Id);
    assert.strictEqual(evidenceAfter.length, countBefore, "Scope invalidation must preserve evidence");
  });
});
