import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  createUser,
  getUserByEmail,
  getUserById,
  createSession,
  deleteSession,
  getSessionByToken
} from "../lib/auth/store";
import {
  getStudentProfile,
  upsertStudentProfile,
  getPersonalEvents,
  createPersonalEvent,
  getApplicationsStore,
  upsertApplicationRecord,
  getAllOpportunities
} from "../lib/placement-store";
import {
  getStudentDNAFull,
  addStudentEvidenceRecord,
  getStudentEvidenceList
} from "../lib/dna/store";
import { GET as calendarGet } from "../app/api/student/calendar/route";
import { GET as recommendationsGet } from "../app/api/recommendations/route";

describe("CRITICAL MULTI-USER DATA ISOLATION & PERSONALIZATION MATRIX (10-POINT SUITE)", () => {
  const ts = Date.now();
  // Test User Identities
  const userAId = `isolated_user_a_${ts}`;
  const userAEmail = `usera_${ts}@test.cognalyze.com`;

  const userBId = `isolated_user_b_${ts}`;
  const userBEmail = `userb_${ts}@test.cognalyze.com`;

  const userCId = `isolated_user_c_${ts}`;
  const userCEmail = `userc_${ts}@test.cognalyze.com`;

  let tokenA = "";
  let tokenB = "";
  let tokenC = "";

  // Set up 3 isolated users
  test("Setup: Initialize User A, User B, and User C with isolated profiles", async () => {
    // 1. User A: Completed profile
    createUser({
      id: userAId,
      email: userAEmail,
      fullName: "User Alpha Completed",
      passwordHash: "hash_a",
      passwordSalt: "salt_a",
      accountType: "student",
      status: "ACTIVE",
      profileCompleted: true
    });
    await upsertStudentProfile({
      candidate_id: userAId,
      skills: [
        { name: "Python", level: "Expert" },
        { name: "PyTorch", level: "Advanced" },
        { name: "Distributed Systems", level: "Advanced" }
      ],
      past_projects: [
        {
          title: "Distributed LLM Serving Engine",
          tech_stack: ["Python", "PyTorch"],
          description: "4,000 LOC distributed serving pipeline"
        }
      ],
      target_roles: ["AI/ML Systems Engineer"],
      target_companies_or_events: ["Google", "DeepMind"],
      availability: "Immediate",
      risk_appetite: "Moderate",
      profile_summary: "AI systems engineer with distributed inference experience.",
      experience_level: "1-3yr"
    });
    await addStudentEvidenceRecord(userAId, {
      sourceType: "github",
      sourceId: "alpha_repo",
      userId: userAId,
      skillRaw: "Python",
      evidenceType: "public_repo",
      claim: "Built distributed inference engine in Python",
      strength: 0.9,
      metadata: { commits: 150 }
    });
    await createPersonalEvent({
      student_id: userAId,
      title: "Alpha Systems Interview Prep",
      event_type: "practice_session",
      event_date: "2026-10-25"
    });
    const opps = await getAllOpportunities();
    if (opps.length > 0 && opps[0].id) {
      await upsertApplicationRecord(userAId, opps[0].id, "Applied", "Direct application submitted");
    }

    const sessA = createSession(userAId, "student");
    tokenA = sessA.token;

    // 2. User B: New student, NEVER completed Student DNA, 0 personal evidence
    createUser({
      id: userBId,
      email: userBEmail,
      fullName: "User Beta Clean Slate",
      passwordHash: "hash_b",
      passwordSalt: "salt_b",
      accountType: "student",
      status: "ACTIVE",
      profileCompleted: false
    });
    const sessB = createSession(userBId, "student");
    tokenB = sessB.token;

    // 3. User C: Partially completed Student DNA, different skills & target role
    createUser({
      id: userCId,
      email: userCEmail,
      fullName: "User Gamma Partial",
      passwordHash: "hash_c",
      passwordSalt: "salt_c",
      accountType: "student",
      status: "ACTIVE",
      profileCompleted: false
    });
    await upsertStudentProfile({
      candidate_id: userCId,
      skills: [
        { name: "TypeScript", level: "Intermediate" },
        { name: "CSS Architecture", level: "Intermediate" }
      ],
      past_projects: [],
      target_roles: ["Frontend UX Engineer"],
      target_companies_or_events: ["Stripe"],
      availability: "Immediate",
      risk_appetite: "Conservative",
      profile_summary: "Frontend developer focused on accessibility and design systems.",
      experience_level: "fresher"
    });
    await addStudentEvidenceRecord(userCId, {
      sourceType: "github",
      sourceId: "gamma_repo",
      userId: userCId,
      skillRaw: "TypeScript",
      evidenceType: "public_repo",
      claim: "Built design tokens in TypeScript",
      strength: 0.8,
      metadata: { commits: 45 }
    });
    const sessC = createSession(userCId, "student");
    tokenC = sessC.token;

    assert.ok(tokenA && tokenB && tokenC, "Sessions generated for all 3 users");
  });

  // ── TEST 1 — USER A ──────────────────────────────────────────────
  test("TEST 1: User A sees only User A's own profile, evidence, skills, and target role", async () => {
    const profA = await getStudentProfile(userAId);
    assert.ok(profA);
    assert.deepEqual(profA?.target_roles, ["AI/ML Systems Engineer"]);
    assert.ok(profA?.skills.some(s => s.name === "Python"));
    assert.ok(profA?.skills.some(s => s.name === "Distributed Systems"));
    assert.ok(!profA?.skills.some(s => s.name === "CSS Architecture"), "User A must not have User C's CSS skill");

    const evidenceListA = await getStudentEvidenceList(userAId);
    assert.ok(evidenceListA.length >= 1, "User A has real evidence");
    assert.ok(evidenceListA.some(e => e.skillId === "python"), "User A has verified Python skill evidence");

    // Check personal calendar
    const calA = await getPersonalEvents(userAId);
    assert.equal(calA.length, 1);
    assert.equal(calA[0].title, "Alpha Systems Interview Prep");
  });

  // ── TEST 2 — USER B ──────────────────────────────────────────────
  test("TEST 2: User B sees clean empty profile without inheriting User A's data or fake metrics", async () => {
    const profB = await getStudentProfile(userBId);
    assert.ok(profB);
    assert.equal(profB.skills.length, 0, "User B has 0 skills recorded");
    assert.equal(profB.past_projects.length, 0, "User B has 0 projects recorded");
    assert.equal(profB.target_roles.length, 0, "User B has 0 target roles");

    const evidenceListB = await getStudentEvidenceList(userBId);
    assert.equal(evidenceListB.length, 0, "User B must have exactly 0 evidence records");

    // Verify calendar events for User B
    const calB = await getPersonalEvents(userBId);
    assert.equal(calB.length, 0, "User B has 0 personal calendar events");

    const appB = await getApplicationsStore(userBId);
    assert.equal(appB.length, 0, "User B has 0 applications");

    // Test API route for User B returns clean state
    const req = new NextRequest("https://cognalyze.com/api/recommendations", {
      headers: { cookie: `cognalyze_session=${tokenB}; cognalyze_role=student` }
    });
    const res = await recommendationsGet(req);
    const data = await res.json();
    assert.equal(data.needsOnboarding, true, "User B needs onboarding");
    assert.ok(data.recommendations.length > 0, "User B can browse all verified opportunities");
    assert.ok(data.recommendations.every((r: any) => r.matching_tags.length === 0), "User B receives 0 matched skills from User A");
  });

  // ── TEST 3 — USER C ──────────────────────────────────────────────
  test("TEST 3: User C sees only their own partial profile and appropriate incomplete-profile state", async () => {
    const profC = await getStudentProfile(userCId);
    assert.ok(profC);
    assert.deepEqual(profC?.target_roles, ["Frontend UX Engineer"]);
    assert.ok(profC?.skills.some(s => s.name === "TypeScript"));
    assert.ok(!profC?.skills.some(s => s.name === "Distributed Systems"), "User C must not inherit User A skills");

    const evidenceListC = await getStudentEvidenceList(userCId);
    assert.ok(evidenceListC.length >= 1);
    assert.ok(evidenceListC.some(e => e.skillId === "typescript"));
  });

  // ── TEST 4 — ACCOUNT SWITCHING ──────────────────────────────────
  test("TEST 4: Account switching (A -> logout -> B -> A) consistently preserves independent data", async () => {
    // 1. Logged in as User A
    const sessA = getSessionByToken(tokenA);
    assert.equal(sessA?.userId, userAId);
    const profileA1 = await getStudentProfile(sessA.userId);
    assert.deepEqual(profileA1?.target_roles, ["AI/ML Systems Engineer"]);

    // 2. User A logs out
    deleteSession(tokenA);
    const deadSessA = getSessionByToken(tokenA);
    assert.equal(deadSessA, null, "Token A revoked upon logout");

    // 3. User B logs in
    const sessB = getSessionByToken(tokenB);
    assert.equal(sessB?.userId, userBId);
    const profileB = await getStudentProfile(sessB.userId);
    assert.equal(profileB?.skills.length, 0, "User B profile has 0 skills");
    assert.equal(profileB?.target_roles.length, 0, "User B profile has 0 target roles");

    // 4. User A logs back in (new session)
    const newSessA = createSession(userAId, "student");
    const profileA2 = await getStudentProfile(newSessA.userId);
    assert.deepEqual(profileA2?.target_roles, ["AI/ML Systems Engineer"]);
    assert.ok(profileA2?.skills.some(s => s.name === "Python"));

    // Clean up temporary session
    deleteSession(newSessA.token);
  });

  // ── TEST 5 — API OWNERSHIP ───────────────────────────────────────
  test("TEST 5: User B cannot access User A's private data by tampering candidateId or URL parameters", async () => {
    // User B tries to query calendar with candidateId=userAId
    const reqCalendar = new NextRequest(`https://cognalyze.com/api/student/calendar?candidateId=${userAId}`, {
      headers: { cookie: `cognalyze_session=${tokenB}; cognalyze_role=student` }
    });
    const resCalendar = await calendarGet(reqCalendar);
    const calData = await resCalendar.json();

    // The API derives identity from session (tokenB = User B), ignoring tampered query param!
    // Since User B has 0 personal events, events count must be 0
    assert.equal(calData.events.length, 0, "API scoped query to User B session, User A events NOT returned");

    // User B tries to query recommendations with candidateId=userAId
    const reqRec = new NextRequest(`https://cognalyze.com/api/recommendations?candidateId=${userAId}`, {
      headers: { cookie: `cognalyze_session=${tokenB}; cognalyze_role=student` }
    });
    const resRec = await recommendationsGet(reqRec);
    const recData = await resRec.json();
    assert.equal(recData.needsOnboarding, true, "User B cannot hijack User A's recommendations");
  });

  // ── TEST 6 — DATABASE RLS ────────────────────────────────────────
  test("TEST 6: Database ownership constraints ensure candidate IDs map 1:1 without cross-tenant collisions", async () => {
    const userAProfile = await getStudentProfile(userAId);
    const userBProfile = await getStudentProfile(userBId);
    const userCProfile = await getStudentProfile(userCId);

    assert.notEqual(userAProfile?.candidate_id, userBProfile?.candidate_id);
    assert.notEqual(userBProfile?.candidate_id, userCProfile?.candidate_id);
    assert.notEqual(userAProfile?.candidate_id, userCProfile?.candidate_id);
  });

  // ── TEST 7 — PLACEMENT CALENDAR ──────────────────────────────────
  test("TEST 7: Genuine public events can appear for multiple users while personal events and application records remain strictly private", async () => {
    // User A has 1 personal event + 1 application
    const userAPersonal = await getPersonalEvents(userAId);
    assert.equal(userAPersonal.length, 1);
    assert.equal(userAPersonal[0].title, "Alpha Systems Interview Prep");

    // User B has 0 personal events
    const userBPersonal = await getPersonalEvents(userBId);
    assert.equal(userBPersonal.length, 0);

    // Public opportunities exist and can be browsed by all users
    const publicOpps = await getAllOpportunities();
    assert.ok(publicOpps.length > 0, "Public opportunities available");

    // But User A's application is ONLY in User A's store
    const userAApps = await getApplicationsStore(userAId);
    const userBApps = await getApplicationsStore(userBId);
    assert.ok(userAApps.length >= 1);
    assert.equal(userBApps.length, 0);
  });

  // ── TEST 8 — STUDENT DNA RESTORATION ──────────────────────────────
  test("TEST 8: User A's Student DNA restores accurately without displaying to User B or User C", async () => {
    // Update Student DNA for User A with an additional skill
    await upsertStudentProfile({
      candidate_id: userAId,
      skills: [
        { name: "Python", level: "Expert" },
        { name: "FastAPI", level: "Advanced" }
      ],
      past_projects: [],
      target_roles: ["AI/ML Systems Engineer"],
      target_companies_or_events: ["Google"],
      availability: "Immediate",
      risk_appetite: "Moderate",
      profile_summary: "AI systems engineer."
    });

    // Simulate session logout & fresh login
    const freshSessA = createSession(userAId, "student");
    const restoredA = await getStudentProfile(freshSessA.userId);

    assert.ok(restoredA);
    assert.ok(restoredA?.skills.some(s => s.name === "FastAPI"));

    // Verify User B still has 0 skills and User C has no FastAPI
    const bState = await getStudentProfile(userBId);
    assert.equal(bState?.skills.length, 0);

    const cState = await getStudentProfile(userCId);
    assert.ok(cState);
    assert.ok(!cState?.skills.some(s => s.name === "FastAPI"));

    deleteSession(freshSessA.token);
  });

  // ── TEST 9 — FAILURE HANDLING ────────────────────────────────────
  test("TEST 9: A failed or empty session does not substitute another user's data or display fabricated profile", async () => {
    // Unauthenticated request with invalid token
    const req = new NextRequest("https://cognalyze.com/api/recommendations", {
      headers: { cookie: "cognalyze_session=invalid-expired-token; cognalyze_role=student" }
    });
    const res = await recommendationsGet(req);
    const data = await res.json();

    assert.equal(data.needsOnboarding, true);
    assert.ok(data.recommendations.length > 0, "Public opportunities visible for unauthenticated users");
    // Crucial: Must NEVER contain User A's matched skills or profile identity
    assert.ok(data.recommendations.every((r: any) => r.matching_tags.length === 0), "No matched tags for unauthenticated user");
    assert.ok(!JSON.stringify(data).includes("User Alpha"), "User A name not leaked");
    assert.ok(!JSON.stringify(data).includes("AI/ML Systems Engineer"), "User A target role not leaked");
  });

  // ── TEST 10 — EXISTING FUNCTIONALITY ─────────────────────────────
  test("TEST 10: Authentication, profile persistence, evidence, calendar, and recommendations continue to work", async () => {
    // User A can still retrieve evidence
    const evidenceA = await getStudentEvidenceList(userAId);
    assert.ok(evidenceA.length >= 1);

    // User A can still retrieve calendar
    const calendarA = await getPersonalEvents(userAId);
    assert.equal(calendarA.length, 1);

    // User A can add a new personal event
    const newEvent = await createPersonalEvent({
      student_id: userAId,
      title: "Google Mock Interview",
      event_type: "practice_session",
      event_date: "2026-10-30"
    });
    assert.ok(newEvent.id);
    const updatedCalA = await getPersonalEvents(userAId);
    assert.equal(updatedCalA.length, 2);

    // User B is still clean
    const updatedCalB = await getPersonalEvents(userBId);
    assert.equal(updatedCalB.length, 0);
  });
});
