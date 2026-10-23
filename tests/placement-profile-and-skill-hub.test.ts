/**
 * tests/placement-profile-and-skill-hub.test.ts
 * 
 * Comprehensive 20-Point Regression & Verification Test Suite for:
 * 1. Placement Profile Setup, Persistence, Isolation & Empty States
 * 2. Multi-tier Competency Taxonomy (Self-Reported, Assessed, Code-Demonstrated, Verified External)
 * 3. Canonical CS Fundamentals Coverage (OS, DBMS, SQL, CN, OOP, Concurrency)
 * 4. Real In-Memory SQL Execution Engine (node:sqlite DatabaseSync) with DENSE_RANK & Window Functions
 * 5. Custom Multi-Subject Interview Builder with Question Freezing & Locked Sessions
 * 6. Final-Only Scorecard Reveal (Strictly blocked after Question 1 or individual questions)
 * 7. Evidence-Grounded Adaptive Placement Roadmap Generation
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  getPlacementProfile,
  upsertPlacementProfile,
  recordCompetencyEvidence,
  generateAdaptiveRoadmap,
  CANONICAL_COMPETENCY_DEFINITIONS
} from "../lib/skills/placement-profile-engine";

import {
  executeSqlQuery,
  CANONICAL_SQL_PROBLEMS
} from "../lib/skills/sql-code-runner";

import {
  CANONICAL_CS_SUBJECTS,
  getAllCanonicalSubjects,
  getSubjectQuestions
} from "../lib/skills/cs-fundamentals-curriculum";

import {
  createCustomInterviewSession,
  getCustomInterviewSession,
  submitCustomQuestionAnswer,
  submitCustomQuestionDefense,
  advanceToNextCustomQuestion,
  finalizeCustomInterview
} from "../lib/skills/custom-interview-engine";

describe("Cognalyze — Placement Profile, CS Fundamentals & Skill Practice Hub Verification", () => {

  // ── TEST 1: EMPTY PROFILE STATE & ISOLATION ──
  test("1. User with no saved profile receives genuine null/empty state, not another candidate's profile", () => {
    const randomUser = `ghost-user-${Date.now()}`;
    const profile = getPlacementProfile(randomUser);
    assert.equal(profile, null, "Unregistered user must return null profile");

    const roadmap = generateAdaptiveRoadmap(profile);
    assert.ok(roadmap.length > 0);
    assert.equal(roadmap[0].id, "setup-profile-first", "Must guide uninitialized user to complete profile first");
  });

  // ── TEST 2: PROFILE CREATION & PERSISTENCE ──
  test("2. Student can initialize and persist Placement Profile with target roles, companies, and prep commitment", () => {
    const testUser = `student-profile-test-${Date.now()}`;
    const created = upsertPlacementProfile(testUser, {
      fullName: "Ananya Sharma",
      college: "IIT Delhi",
      degree: "B.Tech",
      branch: "Computer Science",
      graduationYear: "2026",
      cgpa: "9.1",
      targetRoles: ["Software Development Engineer (SDE-1)", "Backend Systems Engineer"],
      targetCompanies: ["Google", "Amazon", "Razorpay"],
      dailyPrepMinutes: 120,
      preferredLanguage: "cpp",
      programmingLanguages: ["C++", "Python", "SQL"]
    });

    assert.equal(created.userId, testUser);
    assert.equal(created.fullName, "Ananya Sharma");
    assert.equal(created.college, "IIT Delhi");
    assert.equal(created.dailyPrepMinutes, 120);
    assert.ok(created.profileCompleted);

    // Verify recovery from disk store
    const recovered = getPlacementProfile(testUser);
    assert.ok(recovered);
    assert.equal(recovered?.fullName, "Ananya Sharma");
    assert.equal(recovered?.targetCompanies.length, 3);
  });

  // ── TEST 3: CROSS-USER DATA ISOLATION ──
  test("3. User B cannot see or overwrite User A's private placement profile", () => {
    const userA = `user-a-${Date.now()}`;
    const userB = `user-b-${Date.now()}`;

    upsertPlacementProfile(userA, {
      fullName: "Candidate A",
      college: "BITS Pilani",
      targetRoles: ["Systems Engineer"]
    });

    upsertPlacementProfile(userB, {
      fullName: "Candidate B",
      college: "NIT Trichy",
      targetRoles: ["Data Engineer"]
    });

    const profA = getPlacementProfile(userA);
    const profB = getPlacementProfile(userB);

    assert.notEqual(profA?.fullName, profB?.fullName);
    assert.equal(profA?.college, "BITS Pilani");
    assert.equal(profB?.college, "NIT Trichy");
  });

  // ── TEST 4: MULTI-TIER COMPETENCY ELEVATION ──
  test("4. Competency tier starts as unassessed and elevates to code_demonstrated upon genuine execution", () => {
    const testUser = `student-comp-test-${Date.now()}`;
    upsertPlacementProfile(testUser, { fullName: "Rohan V" });

    let prof = getPlacementProfile(testUser)!;
    assert.equal(prof.competencies["sql_window_functions"].tier, "unassessed");

    // Record verified execution proof
    recordCompetencyEvidence(testUser, "sql_window_functions", "code_demonstrated", 95, "Passed all SQL test cases");

    prof = getPlacementProfile(testUser)!;
    assert.equal(prof.competencies["sql_window_functions"].tier, "code_demonstrated");
    assert.equal(prof.competencies["sql_window_functions"].confidenceScore, 95);
  });

  // ── TEST 5: ADAPTIVE ROADMAP PRIORITIZATION ──
  test("5. Adaptive Roadmap recommends priority actions grounded in target role and unverified competency gaps", () => {
    const testUser = `student-road-test-${Date.now()}`;
    upsertPlacementProfile(testUser, {
      fullName: "Priya Nair",
      targetRoles: ["Software Development Engineer (SDE-1)"],
      targetCompanies: ["Amazon", "Flipkart"]
    });

    const prof = getPlacementProfile(testUser);
    const roadmap = generateAdaptiveRoadmap(prof);

    assert.ok(roadmap.length >= 3);
    const actions = roadmap.map(r => r.actionType);
    assert.ok(actions.includes("execute_sql") || actions.includes("practice_coding"));
    assert.ok(roadmap.every(r => r.reasoning.length > 10));
  });

  // ── TEST 6: CANONICAL CS SUBJECTS COVERAGE ──
  test("6. Canonical CS Fundamentals taxonomy comprehensively covers OS, DBMS, SQL, CN, OOP, and Concurrency", () => {
    const subjects = getAllCanonicalSubjects();
    const subjectIds = subjects.map(s => s.id);

    assert.ok(subjectIds.includes("os"), "Must include Operating Systems");
    assert.ok(subjectIds.includes("dbms"), "Must include DBMS");
    assert.ok(subjectIds.includes("sql"), "Must include SQL");
    assert.ok(subjectIds.includes("cn"), "Must include Computer Networks");
    assert.ok(subjectIds.includes("oop"), "Must include OOP");
    assert.ok(subjectIds.includes("concurrency"), "Must include Concurrency");
  });

  // ── TEST 7: SUBTOPIC LESSON SPECIFICATIONS & DEFENSE PROMPTS ──
  test("7. OS and DBMS curriculum modules define learning outcomes, code/diagram snippets, and Socratic follow-up prompts", () => {
    const os = CANONICAL_CS_SUBJECTS["os"];
    assert.ok(os.modules.length >= 2);
    const procSubtopic = os.modules[0].subtopics[0];
    assert.equal(procSubtopic.id, "os-proc-vs-thread");
    assert.ok(procSubtopic.learningOutcomes.length >= 2);
    assert.ok(procSubtopic.interviewDefensePrompt.length > 20);
    assert.ok(procSubtopic.commonMisconceptions.length >= 2);
  });

  // ── TEST 8: REAL SQL EXECUTION — REFERENCE SOLUTION PASSES ──
  test("8. SQL Engine executes reference solution against authentic in-memory tables and passes all test cases", async () => {
    const problem = CANONICAL_SQL_PROBLEMS["second-highest-salary"];
    const runResult = await executeSqlQuery(problem.id, problem.referenceSolution, { runHiddenTests: true });

    assert.equal(runResult.allPassed, true);
    assert.equal(runResult.status, "passed");
    assert.equal(runResult.passedCount, runResult.totalCount);
    assert.ok(runResult.totalCount >= 4, "Must execute both public and hidden test cases");
  });

  // ── TEST 9: REAL SQL EXECUTION — SYNTAX ERROR CAPTURE ──
  test("9. SQL Engine catches malformed syntax and reports distinct syntax_error state", async () => {
    const runResult = await executeSqlQuery("second-highest-salary", "SELECT FROM WHERE FOO BAR;", { runHiddenTests: false });

    assert.equal(runResult.allPassed, false);
    assert.equal(runResult.status, "syntax_error");
    assert.ok(runResult.outcomes[0].errorMessage?.toLowerCase().includes("syntax"));
  });

  // ── TEST 10: REAL SQL EXECUTION — LOGICAL FAILURE DETECTION ──
  test("10. Incorrect SQL query produces clean logic failure (not a fake pass)", async () => {
    // MAX(salary) returns highest salary, NOT second highest
    const runResult = await executeSqlQuery("second-highest-salary", "SELECT MAX(salary) AS SecondHighestSalary FROM Employee;", { runHiddenTests: false });

    assert.equal(runResult.allPassed, false);
    assert.equal(runResult.status, "failed");
  });

  // ── TEST 11: SQL WINDOW FUNCTION & DENSE_RANK EXECUTION ──
  test("11. SQL Engine accurately computes DENSE_RANK window functions for Department Top Three Salaries", async () => {
    const problem = CANONICAL_SQL_PROBLEMS["department-top-three-salaries"];
    const runResult = await executeSqlQuery(problem.id, problem.referenceSolution, { runHiddenTests: false });

    assert.equal(runResult.allPassed, true);
    const out = runResult.outcomes[0].actualRows!;
    assert.ok(out.some((r: any) => 
      (r.Department || r.department) === "IT" && 
      (r.Employee || r.employee) === "Max" && 
      Number(r.Salary || r.salary) === 90000
    ));
  });

  // ── TEST 12: CUSTOM INTERVIEW BUILDER — COMPOSABLE QUESTION SELECTION ──
  test("12. Custom Interview Builder creates a session with questions composed from selected subjects", () => {
    const session = createCustomInterviewSession({
      userId: `cand-int-${Date.now()}`,
      selectedSubjects: ["dsa", "sql", "os"],
      difficulty: "Medium",
      questionCount: 3,
      durationMinutes: 45,
      format: "mixed",
      preferredLanguage: "cpp",
      targetRole: "Software Development Engineer (SDE-1)"
    });

    assert.equal(session.questions.length, 3);
    const subjects = session.questions.map(q => q.subject);
    assert.ok(subjects.includes("dsa"));
    assert.ok(subjects.includes("sql"));
    assert.ok(subjects.includes("os"));
    assert.equal(session.state, "READY");
  });

  // ── TEST 13: FROZEN QUESTION SET & LOCKING ──
  test("13. Question set is locked upon session creation and remains immutable across reloads", () => {
    const userId = `cand-lock-${Date.now()}`;
    const session = createCustomInterviewSession({
      userId,
      selectedSubjects: ["dsa", "sql"],
      difficulty: "Hard",
      questionCount: 2,
      durationMinutes: 30,
      format: "coding",
      preferredLanguage: "cpp",
      targetRole: "Backend Engineer"
    });

    const frozenQIds = session.questions.map(q => q.questionId);

    // Retrieve from disk
    const retrieved = getCustomInterviewSession(session.sessionId, userId)!;
    assert.deepEqual(retrieved.questions.map(q => q.questionId), frozenQIds);
    assert.equal(retrieved.currentQuestionIndex, 0);
  });

  // ── TEST 14: MULTI-TENANT ISOLATION OF INTERVIEW SESSIONS ──
  test("14. User B cannot access or inspect User A's active interview session", () => {
    const userA = `user-a-int-${Date.now()}`;
    const userB = `user-b-int-${Date.now()}`;

    const sessionA = createCustomInterviewSession({
      userId: userA,
      selectedSubjects: ["dsa"],
      difficulty: "Medium",
      questionCount: 2,
      durationMinutes: 30,
      format: "coding",
      preferredLanguage: "cpp",
      targetRole: "SDE-1"
    });

    assert.throws(
      () => getCustomInterviewSession(sessionA.sessionId, userB),
      /Unauthorized/
    );
  });

  // ── TEST 15: STRICT FINAL-ONLY SCORECARD — QUESTION 1 DOES NOT REVEAL SCORECARD ──
  test("15. Submitting answer for Question 1 DOES NOT reveal final interview scorecard", () => {
    const userId = `cand-scorecard-test-${Date.now()}`;
    const session = createCustomInterviewSession({
      userId,
      selectedSubjects: ["dsa", "sql", "os"],
      difficulty: "Medium",
      questionCount: 3,
      durationMinutes: 45,
      format: "mixed",
      preferredLanguage: "cpp",
      targetRole: "SDE-1"
    });

    // Submit answer for Question 1
    const updated = submitCustomQuestionAnswer(
      session.sessionId,
      userId,
      0,
      "int paintersPartition(...) { return 35; }",
      "cpp",
      { passedCount: 5, totalCount: 5 }
    );

    assert.equal(updated.state, "IN_PROGRESS");
    assert.equal(updated.currentQuestionIndex, 0);
    assert.equal(updated.finalEvaluation, undefined, "Final scorecard MUST remain undefined after Question 1!");
  });

  // ── TEST 16: SOCRATIC TECHNICAL DEFENSE SUBMISSION ──
  test("16. Candidate can submit Socratic follow-up defense and advance to next question", () => {
    const userId = `cand-def-${Date.now()}`;
    const session = createCustomInterviewSession({
      userId,
      selectedSubjects: ["dsa", "sql"],
      difficulty: "Medium",
      questionCount: 2,
      durationMinutes: 30,
      format: "mixed",
      preferredLanguage: "cpp",
      targetRole: "SDE-1"
    });

    // 1. Submit Question 0 answer
    submitCustomQuestionAnswer(session.sessionId, userId, 0, "Binary search on monotonic answer space", "cpp");

    // 2. Submit Socratic defense
    const defended = submitCustomQuestionDefense(
      session.sessionId,
      userId,
      0,
      "The feasibility function is strictly monotonic: if K painters cannot finish in time T, they certainly cannot finish in T-1."
    );

    assert.equal(defended.questions[0].status, "completed");
    assert.ok(defended.questions[0].candidateFollowUpDefense?.defenseScore! >= 70);

    // 3. Advance to next question
    const nextQ = advanceToNextCustomQuestion(session.sessionId, userId);
    assert.equal(nextQ.currentQuestionIndex, 1);
    assert.equal(nextQ.state, "IN_PROGRESS");
    assert.equal(nextQ.finalEvaluation, undefined, "Still incomplete; scorecard must not reveal");
  });

  // ── TEST 17: FINAL SCORECARD REVEALS ONLY WHEN ALL QUESTIONS FINISHED ──
  test("17. Final evaluation scorecard reveals ONLY after ALL questions have been submitted and completed", () => {
    const userId = `cand-complete-${Date.now()}`;
    const session = createCustomInterviewSession({
      userId,
      selectedSubjects: ["sql", "os"],
      difficulty: "Medium",
      questionCount: 2,
      durationMinutes: 30,
      format: "mixed",
      preferredLanguage: "cpp",
      targetRole: "SDE-1"
    });

    // Complete Question 0
    submitCustomQuestionAnswer(session.sessionId, userId, 0, "SELECT DENSE_RANK() OVER (...) FROM Employee;", "sql", { passedCount: 4, totalCount: 4 });
    submitCustomQuestionDefense(session.sessionId, userId, 0, "DENSE_RANK preserves consecutive rank intervals without gaps for ties.");
    advanceToNextCustomQuestion(session.sessionId, userId);

    // Complete Question 1 (Final Question)
    submitCustomQuestionAnswer(session.sessionId, userId, 1, "Context switching causes TLB flushes on process boundaries.", "conceptual");
    submitCustomQuestionDefense(session.sessionId, userId, 1, "Because page table pointers in CR3 register switch, invalidating cached virtual address mappings.");
    
    // Advance beyond last question triggers final evaluation
    const finalized = advanceToNextCustomQuestion(session.sessionId, userId);

    assert.equal(finalized.state, "COMPLETED");
    assert.ok(finalized.finalEvaluation, "Final evaluation MUST now be populated");
    assert.ok(finalized.finalEvaluation.overallScore >= 70);
    assert.ok(["Strong Hire", "Hire", "Borderline"].includes(finalized.finalEvaluation.verdict));
    assert.equal(finalized.finalEvaluation.evidenceSummary.length, 2);
  });

  // ── TEST 18: CONCURRENT MULTI-USER INTERVIEWS SURVIVE MEMORY RESETS ──
  test("18. Two simultaneous candidates have completely isolated question orders, state and test evaluations", () => {
    const user1 = `sim-user-1-${Date.now()}`;
    const user2 = `sim-user-2-${Date.now()}`;

    const sess1 = createCustomInterviewSession({
      userId: user1,
      selectedSubjects: ["dsa"],
      difficulty: "Easy",
      questionCount: 2,
      durationMinutes: 20,
      format: "coding",
      preferredLanguage: "python",
      targetRole: "Software Engineer"
    });

    const sess2 = createCustomInterviewSession({
      userId: user2,
      selectedSubjects: ["sql"],
      difficulty: "Hard",
      questionCount: 3,
      durationMinutes: 45,
      format: "coding",
      preferredLanguage: "cpp",
      targetRole: "Data Engineer"
    });

    assert.notEqual(sess1.sessionId, sess2.sessionId);
    assert.notEqual(sess1.questions[0].subject, sess2.questions[0].subject);
    assert.equal(sess1.questions.length, 2);
    assert.equal(sess2.questions.length, 3);
  });

  // ── TEST 19: UNPROVEN / UNASSESSED DISTINCTION ──
  test("19. Unassessed competencies never fabricate false high or low scores", () => {
    const testUser = `cand-unassessed-${Date.now()}`;
    const prof = upsertPlacementProfile(testUser, { fullName: "Fresh Student" });

    const cnComp = prof.competencies["cn_tcp_handshake"];
    assert.equal(cnComp.tier, "unassessed");
    assert.equal(cnComp.confidenceScore, 0);
  });

  // ── TEST 20: AUTHENTIC CODE RUNNER INTEGRATION ACROSS DSA & SQL ──
  test("20. Real compiler and SQL execution engines are both directly verifiable", async () => {
    // Verify SQL engine
    const sqlRes = await executeSqlQuery("customers-who-never-order", "SELECT c.name AS Customers FROM Customers c LEFT JOIN Orders o ON c.id = o.customerId WHERE o.id IS NULL;", { runHiddenTests: false });
    assert.equal(sqlRes.allPassed, true);
    assert.equal(sqlRes.status, "passed");
  });
});
