import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  buildCandidateInterviewDossier,
  generateInterviewBlueprint,
  createAdvancedSessionState,
  generateNextAdaptiveQuestion,
  isQuestionSemanticallyDuplicate,
  invalidateCandidateDossierCache,
} from "../lib/ai/interview-engine";
import {
  saveSession,
  getHistoricalQuestionsForCandidate,
  getHistoricalAssessedCompetencies,
  getAccumulatedWeakTopics,
} from "../lib/interview-session-store";

describe("Phase 4: Candidate & Cross-Session Personalization Suite", () => {
  const candidateId = "cand_p4_personalization_master";

  test("P4-TEST 1: Authorized Candidate Context & Provenance Preservation", async () => {
    invalidateCandidateDossierCache();
    const resume = `
Maya Lin - Distributed Systems Engineer
Experience: 3 years
Skills: Go, C++, Rust, PostgreSQL, gRPC, Distributed Consensus
Projects:
1. ChronoDB: Distributed time-series database with Raft consensus in Go.
`;
    const jd = "Distributed Systems Infrastructure Engineer. Requires Raft, distributed consensus, and low-level storage engines.";

    const dossier = await buildCandidateInterviewDossier(candidateId, resume, jd);

    assert.ok(dossier, "Dossier must exist");
    assert.equal(dossier.candidateId, candidateId);
    assert.ok(dossier.projects.length >= 1, "Must extract project ChronoDB");
    assert.equal(dossier.projects[0].title, "ChronoDB");

    // Provenance integrity
    assert.ok(Array.isArray(dossier.missingOrUnverified), "Missing/unverified must be tracked");
    assert.ok(
      dossier.missingOrUnverified.some((m) => m.toLowerCase().includes("github")),
      "Missing GitHub account must be flagged honestly"
    );
    assert.equal(dossier.githubStatus.connected, false, "Must not pretend GitHub is connected");

    // Verified vs claimed skills
    assert.ok(Array.isArray(dossier.claimedSkills), "Claimed skills must be an array");
    assert.ok(Array.isArray(dossier.verifiedSkills), "Verified skills must be an array");

    // Tenant isolation: empty/missing candidateId returns empty history without cross-tenant leak
    const unauthHistory = await getHistoricalQuestionsForCandidate("");
    assert.deepEqual(unauthHistory, [], "Unauthenticated candidate query must return empty questions array");
    const unauthComps = await getHistoricalAssessedCompetencies("");
    assert.deepEqual(unauthComps, {}, "Unauthenticated candidate query must return empty competencies map");
  });

  test("P4-TEST 2: Session-Specific Competency Plan (Primary, Supporting, Assessed, Needing Evidence)", async () => {
    invalidateCandidateDossierCache();
    const dossier = await buildCandidateInterviewDossier(candidateId, "Senior Backend Engineer Go Kafka Postgres", "Backend Lead");
    
    // Inject mock historical weak topic and previously assessed competency
    dossier.accumulatedWeakTopics = ["Distributed Locking & Deadlocks"];
    dossier.previouslyAssessedCompetencies = {
      "Database Concurrency": { score: 85, status: "demonstrated" },
      "Distributed Locking & Deadlocks": { score: 45, status: "gap" },
    };

    const bp = generateInterviewBlueprint(dossier, "Backend Lead", 45, "experienced");

    assert.ok(bp.primaryCompetencies && bp.primaryCompetencies.length > 0, "Primary competencies must be populated");
    assert.ok(bp.supportingCompetencies && bp.supportingCompetencies.length > 0, "Supporting competencies must be populated");
    assert.ok(
      bp.areasAdequatelyAssessed?.includes("Database Concurrency"),
      "Areas adequately assessed must include Database Concurrency"
    );
    assert.ok(
      bp.areasNeedingEvidence?.includes("Distributed Locking & Deadlocks"),
      "Areas needing evidence must include historical gap"
    );
  });

  test("P4-TEST 3: Role Archetype Personalization (Backend vs Frontend vs AI/ML vs Systems vs Fresher)", async () => {
    // 1. Backend Role
    const backendDossier = await buildCandidateInterviewDossier("c_be", "Backend Engineer Go Postgres", "Backend Engineer");
    const backendBp = generateInterviewBlueprint(backendDossier, "Backend Engineer", 45);
    const hasDbOrBackendComp = backendBp.competencies.some(
      (c) => c.categoryKey === "J_DATABASES_SQL" || c.categoryKey === "M_BACKEND_ENGINEERING"
    );
    assert.ok(hasDbOrBackendComp, "Backend role must target database / backend engineering competencies");

    // 2. Frontend Role
    const feDossier = await buildCandidateInterviewDossier("c_fe", "Frontend Developer React TypeScript Next.js", "Senior Frontend Engineer");
    const feBp = generateInterviewBlueprint(feDossier, "Senior Frontend Engineer", 45);
    const hasFeComp = feBp.competencies.some(
      (c) => c.categoryKey === "N_FRONTEND_ENGINEERING" || c.name.toLowerCase().includes("frontend")
    );
    assert.ok(hasFeComp, "Frontend role must target frontend / UI architecture competencies");

    // 3. AI/ML Role
    const mlDossier = await buildCandidateInterviewDossier("c_ml", "Machine Learning Engineer PyTorch Scikit-learn", "AI/ML Engineer");
    const mlBp = generateInterviewBlueprint(mlDossier, "AI/ML Engineer", 45);
    const hasMlComp = mlBp.competencies.some(
      (c) => c.categoryKey === "R_AIML_FUNDAMENTALS" || c.name.toLowerCase().includes("machine learning")
    );
    assert.ok(hasMlComp, "AI/ML role must target ML pipelines / model evaluation");

    // 4. Systems Role
    const sysDossier = await buildCandidateInterviewDossier("c_sys", "Systems Engineer C Rust Linux Kernel", "Systems Infrastructure Engineer");
    const sysBp = generateInterviewBlueprint(sysDossier, "Systems Infrastructure Engineer", 45);
    const hasSysComp = sysBp.competencies.some(
      (c) => c.categoryKey === "K_OPERATING_SYSTEMS" || c.name.toLowerCase().includes("systems programming")
    );
    assert.ok(hasSysComp, "Systems role must target low-level OS, concurrency and memory management");

    // 5. Fresher Candidate
    const fresherDossier = await buildCandidateInterviewDossier("c_fresh", "CS Graduate Java Python", "Junior SWE", undefined);
    const fresherBp = generateInterviewBlueprint(fresherDossier, "Junior SWE", 45, "fresher");
    const codingComp = fresherBp.competencies.find((c) => c.category === "coding_reasoning" || c.category === "system_design");
    assert.ok(codingComp, "Fresher must have problem-solving competency");
    assert.equal(codingComp?.category, "coding_reasoning", "Fresher must be assigned coding reasoning, NOT senior system design");
  });

  test("P4-TEST 4: Cross-Session Anti-Repetition & History Retention", async () => {
    const historicalCandidateId = "cand_p4_cross_session_history";
    const priorQuestion1 = "In a high-concurrency relational database, how do you handle deadlocks and choose between Read Committed and Serializable isolation?";
    const priorQuestion2 = "How did you structure the high-level architecture of your microservices in ChronoDB?";

    // Save a historical completed session with known questions
    await saveSession({
      id: "sess_prior_01",
      candidate_id: historicalCandidateId,
      session_type: "mock_interview",
      target_role: "Backend Engineer",
      experience_mode: "experienced",
      overall_score: 82,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      report: {
        questionByQuestionAnalysis: [
          { turnIndex: 1, questionText: priorQuestion1, score: 80 },
          { turnIndex: 2, questionText: priorQuestion2, score: 85 },
        ]
      },
      transcript: [
        { role: "assistant", content: priorQuestion1 },
        { role: "user", content: "We configured deadlock timeouts and Read Committed." },
      ]
    });

    // Verify historical questions are retrieved for this candidate
    const history = await getHistoricalQuestionsForCandidate(historicalCandidateId);
    assert.ok(history.length >= 1, "Historical questions must be retrieved");
    assert.ok(history.some((q) => q.includes("relational database") || q.includes("ChronoDB")));

    // Build fresh dossier for a new session
    const dossier = await buildCandidateInterviewDossier(historicalCandidateId, "Backend Engineer Go Postgres", "Backend Engineer");
    assert.ok(dossier.historicalQuestionsAsked && dossier.historicalQuestionsAsked.length >= 1);

    // Verify semantic duplicate detector blocks prior session questions
    const duplicateOfPrior = "In a high-concurrency database, how do you handle deadlocks between Read Committed and Serializable isolation levels?";
    const isDup = isQuestionSemanticallyDuplicate(duplicateOfPrior, dossier.historicalQuestionsAsked);
    assert.equal(isDup, true, "Semantic duplicate of a prior session question must be detected");

    // A genuinely novel question should NOT be flagged as duplicate
    const novelQuestion = "How do you implement distributed tracing with OpenTelemetry across gRPC boundaries?";
    const isNovelDup = isQuestionSemanticallyDuplicate(novelQuestion, dossier.historicalQuestionsAsked);
    assert.equal(isNovelDup, false, "Novel technical question must NOT be rejected");

    // Criterion 3 verification: Incomplete / pending / skipped / insufficient-evidence assessments
    await saveSession({
      id: "sess_prior_incomplete",
      candidate_id: historicalCandidateId,
      session_type: "mock_interview",
      target_role: "Backend Engineer",
      experience_mode: "experienced",
      overall_score: 50,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      report: {
        competenciesAssessed: [
          { competency: "Pending Review Skill", score: 90, status: "pending" },
          { competency: "Skipped Question Topic", score: 85, status: "skipped" },
          { competency: "Insufficient Evidence Domain", score: 80, status: "insufficient_evidence" },
          { competency: "Solid Backend Fundamentals", score: 88, status: "demonstrated" },
        ]
      }
    });

    const historicalComps = await getHistoricalAssessedCompetencies(historicalCandidateId);
    assert.ok(historicalComps["Solid Backend Fundamentals"], "Valid completed assessment must be present");
    assert.equal(historicalComps["Pending Review Skill"], undefined, "Pending status must be excluded");
    assert.equal(historicalComps["Skipped Question Topic"], undefined, "Skipped status must be excluded");
    assert.equal(historicalComps["Insufficient Evidence Domain"], undefined, "Insufficient evidence status must be excluded");
  });

  test("P4-TEST 5: Revisiting Weak Topics from Prior Sessions with Novel Angles", async () => {
    const candidateWeakId = "cand_p4_weak_revisit";

    // Record prior session with critical gap
    await saveSession({
      id: "sess_prior_weak_01",
      candidate_id: candidateWeakId,
      session_type: "mock_interview",
      target_role: "Distributed Systems Engineer",
      experience_mode: "experienced",
      overall_score: 45,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      weak_topics_identified: ["Kafka Consumer Group Rebalance Timeout"],
      report: {
        criticalGaps: ["Kafka Consumer Group Rebalance Timeout"],
        competenciesAssessed: [
          { competency: "Kafka Consumer Group Rebalance Timeout", score: 40, status: "gap" }
        ]
      }
    });

    const accumulatedWeak = await getAccumulatedWeakTopics(candidateWeakId);
    assert.ok(accumulatedWeak.includes("Kafka Consumer Group Rebalance Timeout"));

    const dossier = await buildCandidateInterviewDossier(candidateWeakId, "Distributed Systems Kafka Go", "Backend Engineer");
    assert.ok(dossier.accumulatedWeakTopics?.includes("Kafka Consumer Group Rebalance Timeout"));

    const blueprint = generateInterviewBlueprint(dossier, "Backend Engineer", 45, "experienced");
    blueprint.currentSection = "technical_fundamentals";
    const sessionState = createAdvancedSessionState(blueprint, dossier, "sess_p4_weak_session");

    // Next adaptive question should take into account candidate context without crashing
    const nextQ = await generateNextAdaptiveQuestion(sessionState, dossier, "", null);
    assert.ok(nextQ.question.length > 15, "Question must be generated");
    assert.ok(nextQ.section === "technical_fundamentals" || nextQ.section === "resume_projects");
  });

  test("P4-TEST 6: Incomplete Profile Transparency (No Fabricated Personalization)", async () => {
    invalidateCandidateDossierCache();
    // Candidate with 0 resume, 0 GitHub, 0 LinkedIn
    const minimalDossier = await buildCandidateInterviewDossier("cand_minimal_blank", "", "");

    assert.equal(minimalDossier.candidateId, "cand_minimal_blank");
    assert.equal(minimalDossier.projects.length, 0, "Must have 0 projects when none provided");
    assert.equal(minimalDossier.githubStatus.connected, false);
    assert.equal(minimalDossier.githubStatus.accessibleRepos.length, 0);
    assert.ok(minimalDossier.missingOrUnverified.length >= 2, "Must note missing GitHub and resume");

    const bp = generateInterviewBlueprint(minimalDossier, "Software Engineer", 30, "fresher");
    const state = createAdvancedSessionState(bp, minimalDossier, "sess_blank_cand");

    const openingQ = await generateNextAdaptiveQuestion(state, minimalDossier, "", null);
    assert.ok(openingQ.question.length > 10);
    // Ensure no hallucinated project names like 'EventMesh' or 'ChronoDB' appear for this blank candidate
    assert.ok(!openingQ.question.includes("EventMesh"), "Must not invent EventMesh for blank candidate");
    assert.ok(!openingQ.question.includes("ChronoDB"), "Must not invent ChronoDB for blank candidate");
  });
});
