import { test } from "node:test";
import assert from "node:assert/strict";
import {
  extractTwelvePointProjectProfile,
  buildJDCompetencyMatrix,
  buildCandidateIntelligenceProfile,
  EvidenceProvenance,
  CandidateIntelligenceProfile,
  JDCompetencyMatrix,
  TwelvePointProjectProfile
} from "../lib/interview/candidate-intelligence";
import {
  evaluateCandidateConduct,
  ConductState,
  ConductIncident,
  INSTITUTIONAL_CONDUCT_MESSAGES
} from "../lib/interview/conduct-engine";
import {
  buildCandidateInterviewDossier,
  generateInterviewBlueprint,
  createAdvancedSessionState,
  generateInterviewFinalReport,
} from "../lib/ai/interview-engine";
import {
  saveActiveSessionState,
  getActiveSessionState,
  saveActiveSessionStateAsync,
  getActiveSessionStateAsync
} from "../lib/interview-session-store";

test("Milestone 1 & 2 Master Engineering Suite: Candidate Intelligence & Conduct Integrity", async (t) => {

  // ══════════════════════════════════════════════════════════════
  // MILESTONE 1: CANDIDATE & JD INTELLIGENCE ENGINE
  // ══════════════════════════════════════════════════════════════

  await t.test("M1-1: 12-point project profiling extracts all dimensions from technical project text", async () => {
    const projectText = `
      Project: Distributed Payment Gateway & Settlement Engine
      Problem Solved: Handled high transaction volume payment processing with reconciliation latency under 2 seconds.
      Architecture: Event-driven microservices using Node.js, TypeScript, Kafka message broker, and Redis distributed caching.
      Tech Stack: Node.js, Express, TypeScript, Apache Kafka, PostgreSQL, Redis, Docker, Kubernetes.
      Personal Contribution: Designed the distributed lock mechanism, implemented idempotency keys, and built the webhook delivery retry worker.
      Technical Challenges: Mitigated race conditions and double charges during network partitions using Redis Redlock.
      Database Design: PostgreSQL with schema isolation per merchant, read replicas, and partitioned ledger entries.
      API Structure: RESTful endpoints with OpenAPI 3.0 specification, HMAC-SHA256 signature verification, and idempotency headers.
      Security Measures: Encrypted PAN tokens at rest using AES-256-GCM, TLS 1.3 in transit, and role-based access control.
      Performance Optimizations: Reduced p99 latency from 450ms to 85ms via Redis multi-level caching and connection pooling.
      Testing Strategy: 92% unit test coverage using Jest, end-to-end integration tests with Testcontainers, and chaos testing for Kafka broker failures.
      Deployment & CI: GitLab CI pipeline with automated linting, security scans via Snyk, and Helm charts for zero-downtime rolling Kubernetes deployment.
      Retrospective Improvements: If rebuilding today, would use Go for higher concurrency and introduce gRPC for internal service communications.
    `;

    const profile: TwelvePointProjectProfile = extractTwelvePointProjectProfile(
      "Distributed Payment Gateway",
      projectText,
      ["Node.js", "Kafka", "PostgreSQL", "Redis", "Docker", "Kubernetes", "TypeScript"]
    );

    assert.equal(profile.title, "Distributed Payment Gateway");
    assert.ok(profile.problemSolved.length > 0, "Problem solved must be extracted");
    assert.ok(profile.architecture.length > 0, "Architecture must be extracted");
    assert.ok(profile.techStackRationale.length > 0, "Tech stack rationale must be extracted");
    assert.ok(profile.personalContribution.length > 0, "Personal contribution must be extracted");
    assert.ok(profile.technicalChallenges.length > 0, "Technical challenges must be extracted");
    assert.ok(profile.databaseDesign.length > 0, "Database design must be extracted");
    assert.ok(profile.apiStructure.length > 0, "API structure must be extracted");
    assert.ok(profile.securityMeasures.length > 0, "Security measures must be extracted");
    assert.ok(profile.performanceOptimizations.length > 0, "Performance optimizations must be extracted");
    assert.ok(profile.testingStrategy.length > 0, "Testing strategy must be extracted");
    assert.ok(profile.deploymentAndCI.length > 0, "Deployment & CI must be extracted");
    assert.ok(profile.retrospectiveImprovements.length > 0, "Retrospective improvements must be extracted");

    // Check specific extraction keywords
    assert.ok(profile.securityMeasures.toLowerCase().includes("aes") || profile.securityMeasures.toLowerCase().includes("encrypt") || profile.securityMeasures.toLowerCase().includes("token"), "Security must reflect encryption");
    assert.ok(profile.testingStrategy.toLowerCase().includes("jest") || profile.testingStrategy.toLowerCase().includes("coverage") || profile.testingStrategy.toLowerCase().includes("test"), "Testing must reflect coverage or Jest");
  });

  await t.test("M1-2: JD Competency Matrix maps must-have, good-to-have, and detects unsupported requirements", async () => {
    const jdText = `
      Senior Backend Systems Engineer
      Responsibilities:
      - Architect scalable distributed microservices handling 100k+ requests per second.
      - Maintain PostgreSQL databases and design zero-downtime migration strategies.
      
      Must-Have Requirements:
      - Strong proficiency in Golang or Java.
      - Experience with Apache Kafka and distributed stream processing.
      - Deep expertise in Kubernetes orchestration and Helm deployments.
      - Production experience with distributed caching using Redis.
      
      Nice-to-Have Requirements:
      - Experience with Rust.
      - Familiarity with eBPF and Linux kernel tuning.
    `;

    // Candidate only knows Node.js, Express, MongoDB (does NOT know Golang, Kafka, Kubernetes)
    const candidateSkills = ["Node.js", "Express", "MongoDB", "JavaScript"];

    const matrix: JDCompetencyMatrix = buildJDCompetencyMatrix(jdText, candidateSkills);

    assert.ok(matrix.targetRole.length > 0, "Target role must be identified");
    assert.ok(matrix.mustHaveCompetencies.length > 0, "Must-have competencies must be identified");
    assert.ok(matrix.engineeringFundamentals.length > 0, "Engineering fundamentals must be identified");
    
    // Check that unsupported JD requirements (Kafka, Kubernetes, Golang) are detected
    assert.ok(matrix.unsupportedJDRequirements.length > 0, "Unsupported JD requirements must be detected");
    const unsupportedStr = matrix.unsupportedJDRequirements.join(" ").toLowerCase();
    assert.ok(
      unsupportedStr.includes("kafka") || unsupportedStr.includes("kubernetes") || unsupportedStr.includes("golang") || unsupportedStr.includes("stream"),
      "Unsupported requirements must highlight missing stack elements"
    );
  });

  await t.test("M1-3: Candidate Intelligence Profile strictly separates verified evidence from self-claims", async () => {
    const rawResume = `
      Name: Alex Rivera
      Skills: React, Node.js, PostgreSQL, Docker, AWS, GraphQL
      Experience: Full-stack Developer at Acme Corp. Built REST APIs and React frontends.
    `;

    // Simulated verified DNA evidence (only React and Node.js are verified in Student DNA)
    const verifiedDNA = [
      { capability: "React", score: 85, evidenceSource: "github_pr_audit" },
      { capability: "Node.js", score: 80, evidenceSource: "coding_assessment" }
    ];

    const profile: CandidateIntelligenceProfile = buildCandidateIntelligenceProfile({
      resumeText: rawResume,
      verifiedDNASkills: verifiedDNA,
      candidateId: "cand_provenance_test"
    });

    // 1. React & Node.js must be VERIFIED_EVIDENCE
    const reactProv = profile.provenanceMap["react"];
    const nodeProv = profile.provenanceMap["node.js"] || profile.provenanceMap["node"];
    assert.ok(reactProv, "React provenance must exist");
    assert.equal(reactProv.provenance, "VERIFIED_EVIDENCE", "DNA-verified skill must have VERIFIED_EVIDENCE provenance");
    assert.equal(reactProv.verifiedScore, 85);

    // 2. AWS & GraphQL were only in resume text, NOT in DNA -> Must be CANDIDATE_CLAIM or UNVERIFIED_CLAIM
    const awsProv = profile.provenanceMap["aws"];
    const gqlProv = profile.provenanceMap["graphql"];
    assert.ok(awsProv, "AWS provenance must exist");
    assert.notEqual(awsProv.provenance, "VERIFIED_EVIDENCE", "Unverified resume skill must NEVER be promoted to VERIFIED_EVIDENCE");
    assert.ok(
      awsProv.provenance === "CANDIDATE_CLAIM" || awsProv.provenance === "UNVERIFIED_CLAIM",
      "Resume-only skill must be classified as claim"
    );

    // 3. Unverified claims list must contain AWS and GraphQL
    assert.ok(profile.unverifiedClaims.some(c => /aws|graphql/i.test(c)), "Unverified claims list must contain non-DNA claims");
  });

  await t.test("M1-4: Dossier and Advanced Session State encapsulate Candidate & JD Intelligence", async () => {
    const resume = "Software Engineer with 2 years experience building Node.js microservices and PostgreSQL databases.";
    const jd = "Backend Engineer: Node.js, PostgreSQL, Docker, distributed architecture.";

    const dossier = await buildCandidateInterviewDossier("cand_dossier_m1", resume, jd);
    assert.ok(dossier.candidateIntelligence, "Dossier must contain candidateIntelligence");
    assert.ok(dossier.jdCompetencyMatrix, "Dossier must contain jdCompetencyMatrix");

    const blueprint = generateInterviewBlueprint(dossier, "Backend Engineer", 45);
    const sessionState = createAdvancedSessionState(blueprint, dossier);

    assert.ok(sessionState.candidateIntelligence, "Session state must carry candidateIntelligence");
    assert.ok(sessionState.jdCompetencyMatrix, "Session state must carry jdCompetencyMatrix");
    assert.equal(sessionState.conductState, "NORMAL", "Initial conduct state must be NORMAL");
    assert.deepEqual(sessionState.conductIncidents, [], "Initial conduct incidents must be empty");
  });

  // ══════════════════════════════════════════════════════════════
  // MILESTONE 2: BEHAVIORAL CONDUCT & INTEGRITY STATE MACHINE
  // ══════════════════════════════════════════════════════════════

  await t.test("M2-1: Deterministic state machine transitions: NORMAL -> FIRST_WARNING -> FINAL_WARNING -> TERMINATED", async () => {
    // Turn 1: Candidate insults interviewer in English
    const turn1Input = "Shut the fuck up, you are an idiot bot.";
    const eval1 = evaluateCandidateConduct(turn1Input, "NORMAL", 1);

    assert.equal(eval1.isMisconduct, true, "Severe insult must be flagged as misconduct");
    assert.equal(eval1.shouldHaltTurn, true, "Misconduct must halt turn");
    assert.equal(eval1.previousState, "NORMAL");
    assert.equal(eval1.newState, "FIRST_WARNING", "State must advance from NORMAL to FIRST_WARNING");
    assert.ok(eval1.interviewerMessage?.includes("Notice:"), "First warning message must be emitted");
    assert.ok(eval1.incident, "Incident record must be generated");
    assert.equal(eval1.incident?.previousState, "NORMAL");
    assert.equal(eval1.incident?.newState, "FIRST_WARNING");

    // Turn 2: Candidate insults again in Hindi / Hinglish
    const turn2Input = "bakwaas band kar chutiye, terko kuch nahi aata";
    const eval2 = evaluateCandidateConduct(turn2Input, "FIRST_WARNING", 2);

    assert.equal(eval2.isMisconduct, true);
    assert.equal(eval2.previousState, "FIRST_WARNING");
    assert.equal(eval2.newState, "FINAL_WARNING", "State must advance from FIRST_WARNING to FINAL_WARNING");
    assert.ok(eval2.interviewerMessage?.includes("Final Warning:"), "Final warning message must be emitted");
    assert.equal(eval2.incident?.newState, "FINAL_WARNING");

    // Turn 3: Candidate persists in misconduct
    const turn3Input = "you piece of shit, go to hell";
    const eval3 = evaluateCandidateConduct(turn3Input, "FINAL_WARNING", 3);

    assert.equal(eval3.isMisconduct, true);
    assert.equal(eval3.previousState, "FINAL_WARNING");
    assert.equal(eval3.newState, "TERMINATED", "State must advance from FINAL_WARNING to TERMINATED");
    assert.ok(eval3.interviewerMessage?.includes("Interview Terminated:"), "Termination message must be emitted");
    assert.equal(eval3.incident?.newState, "TERMINATED");
  });

  await t.test("M2-2: Immediate termination enforced on critical threats and violent hostility", async () => {
    // English violent threat
    const threat1 = "I will hunt you down and destroy you.";
    const evalThreat1 = evaluateCandidateConduct(threat1, "NORMAL", 1);

    assert.equal(evalThreat1.isMisconduct, true);
    assert.equal(evalThreat1.severity, "critical");
    assert.equal(evalThreat1.type, "SEVERE_THREAT");
    assert.equal(evalThreat1.newState, "TERMINATED", "Critical threat must bypass warnings and TERMINATE immediately");
    assert.ok(evalThreat1.interviewerMessage?.includes("Interview Terminated Immediately"), "Immediate termination notice must be used");

    // Hindi / Hinglish violent threat
    const threat2 = "jaan se maar dunga tujhe, dekh lunga tere ko";
    const evalThreat2 = evaluateCandidateConduct(threat2, "NORMAL", 1);

    assert.equal(evalThreat2.isMisconduct, true);
    assert.equal(evalThreat2.severity, "critical");
    assert.equal(evalThreat2.type, "SEVERE_THREAT");
    assert.equal(evalThreat2.newState, "TERMINATED", "Hindi violent threat must terminate immediately");
  });

  await t.test("M2-3: Multilingual Hinglish slang classification", async () => {
    // Hindi / Hinglish insults & profanity
    const hinglish1 = "abe saale kutte chup kar";
    const res1 = evaluateCandidateConduct(hinglish1, "NORMAL", 1);
    assert.equal(res1.isMisconduct, true);
    assert.equal(res1.newState, "FIRST_WARNING");

    const hinglish2 = "teri maa ki, kya bakwaas bot hai";
    const res2 = evaluateCandidateConduct(hinglish2, "FIRST_WARNING", 2);
    assert.equal(res2.isMisconduct, true);
    assert.equal(res2.newState, "FINAL_WARNING");
  });

  await t.test("M2-4: Benign nuance exception protection — NEVER flags nervousness, uncertainty, or frustration as misconduct", async () => {
    // 1. Nervousness
    const nervous1 = "Sorry, I am really nervous and my heart is beating fast. Can I have a moment?";
    const evalNervous = evaluateCandidateConduct(nervous1, "NORMAL", 1);
    assert.equal(evalNervous.isMisconduct, false, "Nervousness must not be flagged as misconduct");
    assert.equal(evalNervous.type, "BENIGN_NERVOUSNESS");
    assert.equal(evalNervous.newState, "NORMAL");

    // 2. Hindi nervousness
    const nervousHi = "Thoda ghabrahat ho rahi hai aur darr lag raha hai.";
    const evalNervousHi = evaluateCandidateConduct(nervousHi, "NORMAL", 1);
    assert.equal(evalNervousHi.isMisconduct, false);
    assert.equal(evalNervousHi.type, "BENIGN_NERVOUSNESS");

    // 3. Inability to answer / uncertainty
    const uncertain1 = "I honestly don't know the answer to this question. Can we skip this or move to the next topic?";
    const evalUncertain = evaluateCandidateConduct(uncertain1, "NORMAL", 1);
    assert.equal(evalUncertain.isMisconduct, false, "Inability to answer must not be misconduct");
    assert.equal(evalUncertain.type, "BENIGN_UNCERTAINTY");

    // 4. Hindi uncertainty
    const uncertainHi = "Mujhe iska answer nahi pata, kabhi use nahi kiya. Let's pass.";
    const evalUncertainHi = evaluateCandidateConduct(uncertainHi, "NORMAL", 1);
    assert.equal(evalUncertainHi.isMisconduct, false);
    assert.equal(evalUncertainHi.type, "BENIGN_UNCERTAINTY");

    // 5. Frustration without personal attack
    const frustration1 = "This is so frustrating, I am totally struggling with the syntax today.";
    const evalFrustration = evaluateCandidateConduct(frustration1, "NORMAL", 1);
    assert.equal(evalFrustration.isMisconduct, false, "Normal frustration must not be misconduct");
    assert.equal(evalFrustration.type, "BENIGN_FRUSTRATION");

    // 6. Hinglish frustration
    const frustrationHi = "Dimag kharab ho raha hai yaar, syntax bhool gaya.";
    const evalFrustrationHi = evaluateCandidateConduct(frustrationHi, "NORMAL", 1);
    assert.equal(evalFrustrationHi.isMisconduct, false);
    assert.equal(evalFrustrationHi.type, "BENIGN_FRUSTRATION");

    // 7. Clarification request
    const clarification1 = "Can you please clarify what you mean by partition key in this context?";
    const evalClarification = evaluateCandidateConduct(clarification1, "NORMAL", 1);
    assert.equal(evalClarification.isMisconduct, false);
    assert.equal(evalClarification.type, "BENIGN_CLARIFICATION");

    // 8. Respectful technical disagreement
    const disagreement = "I actually disagree with that approach. In PostgreSQL MVCC, row updates append a new tuple rather than in-place mutations.";
    const evalDisagreement = evaluateCandidateConduct(disagreement, "NORMAL", 1);
    assert.equal(evalDisagreement.isMisconduct, false);
    assert.equal(evalDisagreement.type, "BENIGN_DISAGREEMENT");
  });

  await t.test("M2-5: Complete incident audit logging structure", async () => {
    const input = "You are a useless garbage bot, shut up!";
    const res = evaluateCandidateConduct(input, "NORMAL", 3);

    assert.ok(res.incident, "Incident object must be generated");
    const inc = res.incident!;
    assert.ok(inc.id.startsWith("conduct_inc_"), "Incident must have unique ID");
    assert.ok(Date.parse(inc.timestamp) > 0, "Incident must have ISO timestamp");
    assert.equal(inc.turnIndex, 3);
    assert.ok(inc.matchedTokens.length > 0, "Incident must record matched tokens");
    assert.equal(inc.previousState, "NORMAL");
    assert.equal(inc.newState, "FIRST_WARNING");
    assert.ok(inc.confidence >= 0.8, "Confidence must be >= 0.8");
    assert.ok(inc.escalationReason.length > 0, "Escalation reason must be documented");
  });

  await t.test("M2-6: Independence of behavioral evaluation from technical competency scoring", async () => {
    // Setup a session state with a technical turn and a subsequent conduct warning
    const dossier = await buildCandidateInterviewDossier("cand_decoupling", "Node.js React dev", "Full stack");
    const blueprint = generateInterviewBlueprint(dossier, "Full Stack Engineer", 45);
    const sessionState = createAdvancedSessionState(blueprint, dossier);

    // Simulate Turn 1: Strong technical answer
    sessionState.turns.push({
      turnIndex: 1,
      question: {
        question: "How do you handle connection pooling in PostgreSQL with Node.js?",
        question_targets: "Database Connection Management",
        question_type: "technical",
        difficulty_level: "medium",
        is_follow_up: false,
        section: "coding_system_design",
      },
      answer: "We use pg-pool with max connections set to 20 per pod, keeping idle timeouts to 10 seconds to prevent leaking idle connections.",
      assessment: {
        answer_quality: "strong",
        reasoning: "Excellent understanding of pg-pool and connection sizing.",
        topics_demonstrated: ["PostgreSQL", "Connection Pooling"],
        next_action: "move_to_new_topic",
        difficulty_adjustment: "escalate"
      },
      rubricScore: 90,
      timestamp: new Date().toISOString()
    });

    // Simulate conduct incident on Turn 2
    const conductEval = evaluateCandidateConduct("fuck this, you bot", "NORMAL", 2);
    sessionState.conductState = conductEval.newState;
    sessionState.conductIncidents = [conductEval.incident!];

    // Generate final report
    const report = await generateInterviewFinalReport(sessionState, [
      { role: "assistant", content: "How do you handle connection pooling?" },
      { role: "user", content: "We use pg-pool with max connections set to 20..." }
    ], dossier);

    // Verify: The technical score is derived purely from Turn 1's technical competency (90)
    // Behavioral incident is tracked in conductState & conductIncidents WITHOUT modifying technical marks!
    assert.ok(report.overallScore >= 80, "Technical score must reflect technical performance, not conduct deduction");
    assert.equal(report.conductState, "FIRST_WARNING", "Report must preserve conduct state");
    assert.equal(report.conductIncidents?.length, 1, "Report must preserve conduct incidents");
  });

  await t.test("M2-7: Session persistence & recovery of conduct state across reloads", async () => {
    const testSessionId = `test_conduct_sess_${Date.now()}`;
    const dossier = await buildCandidateInterviewDossier("cand_persist_test", "Go developer", "Cloud Eng");
    const blueprint = generateInterviewBlueprint(dossier, "Cloud Engineer", 45);
    const sessionState = createAdvancedSessionState(blueprint, dossier, testSessionId);

    // Candidate commits misconduct
    const evalRes = evaluateCandidateConduct("idiot bot", "NORMAL", 1);
    sessionState.conductState = evalRes.newState;
    sessionState.conductIncidents = [evalRes.incident!];

    // Save session state to disk / store
    await saveActiveSessionStateAsync(testSessionId, sessionState);

    // Recover session state from store
    const recoveredState = await getActiveSessionStateAsync(testSessionId, "cand_persist_test");

    assert.ok(recoveredState, "Recovered state must exist");
    assert.equal(recoveredState.conductState, "FIRST_WARNING", "Recovered state must preserve FIRST_WARNING");
    assert.equal(recoveredState.conductIncidents.length, 1, "Recovered state must preserve conduct incidents");
    assert.equal(recoveredState.conductIncidents[0].matchedTokens[0], "idiot bot", "Recovered incident must match token");
  });

  await t.test("M2-8: Adversarial conduct classifier evasion & narrative exception protection", async () => {
    // 1. Adverb / adjective modifier evasion
    const adv1 = evaluateCandidateConduct("You are a complete idiot", "NORMAL", 1);
    assert.equal(adv1.isMisconduct, true, "Adverb modifier 'complete idiot' must be detected");
    assert.equal(adv1.newState, "FIRST_WARNING");

    const adv2 = evaluateCandidateConduct("You are completely brain dead", "NORMAL", 1);
    assert.equal(adv2.isMisconduct, true, "Adverb modifier 'completely brain dead' must be detected");

    // 2. Quoted third-party narrative false-positive protection
    const narrative1 = evaluateCandidateConduct("In my previous job a manager yelled 'you are an idiot' at me during a retrospective", "NORMAL", 1);
    assert.equal(narrative1.isMisconduct, false, "Quoted narrative describing third-party manager abuse must NOT be flagged as candidate misconduct");
    assert.equal(narrative1.type, "CLEAN_PROFESSIONAL");

    // 3. Spaced letters evasion
    const spaced1 = evaluateCandidateConduct("f u c k you", "NORMAL", 1);
    assert.equal(spaced1.isMisconduct, true, "Spaced letters 'f u c k' must be detected");

    const spaced2 = evaluateCandidateConduct("you b i t c h", "NORMAL", 1);
    assert.equal(spaced2.isMisconduct, true, "Spaced letters 'b i t c h' must be detected");

    // 4. Repeated vowels / elongation evasion
    const repeated1 = evaluateCandidateConduct("chuuutiya bot", "NORMAL", 1);
    assert.equal(repeated1.isMisconduct, true, "Elongated Hinglish slang 'chuuutiya' must be detected");

    // 5. Censored / masked profanity evasion
    const masked1 = evaluateCandidateConduct("what the f*** is this", "NORMAL", 1);
    assert.equal(masked1.isMisconduct, true, "Masked profanity 'f***' must be detected");

    const masked2 = evaluateCandidateConduct("what the f*ck", "NORMAL", 1);
    assert.equal(masked2.isMisconduct, true, "Masked profanity 'f*ck' must be detected");

    const masked3 = evaluateCandidateConduct("you b*tch", "NORMAL", 1);
    assert.equal(masked3.isMisconduct, true, "Masked slur 'b*tch' must be detected");
  });

  await t.test("M2-9: Monotonic session versioning rejects LWW stale snapshot overwrites", async () => {
    const lwwSessionId = `test_lww_sess_${Date.now()}`;
    const dossier = await buildCandidateInterviewDossier("cand_lww_test", "Node.js engineer", "Backend Eng");
    const blueprint = generateInterviewBlueprint(dossier, "Backend Engineer", 45);
    const sessionState = createAdvancedSessionState(blueprint, dossier, lwwSessionId);

    // Turn 1 completes
    sessionState.turns.push({
      turnIndex: 1,
      question: { question: "Tell me about Redis" } as any,
      answer: "We used Redis for caching.",
      assessment: { answer_quality: "adequate" } as any,
      timestamp: new Date().toISOString(),
    });
    saveActiveSessionState(lwwSessionId, sessionState);

    // Save a stale clone at Turn 1
    const staleSnapshot = JSON.parse(JSON.stringify(sessionState));

    // Turn 2 completes and candidate commits misconduct -> conduct escalates to FIRST_WARNING
    sessionState.turns.push({
      turnIndex: 2,
      question: { question: "Explain cache stampede" } as any,
      answer: "Shut up you complete idiot.",
      assessment: { answer_quality: "shallow" } as any,
      timestamp: new Date().toISOString(),
    });
    sessionState.conductState = "FIRST_WARNING";
    sessionState.conductIncidents = [{
      id: "inc_1",
      turnIndex: 2,
      type: "HOSTILE_ABUSE",
      severity: "high",
      candidateInput: "Shut up you complete idiot.",
      matchedTokens: ["complete idiot"],
      language: "en",
      confidence: 0.95,
      timestamp: new Date().toISOString(),
      previousState: "NORMAL",
      newState: "FIRST_WARNING",
      interviewerMessage: "Warning",
      escalationReason: "Abuse"
    }];
    saveActiveSessionState(lwwSessionId, sessionState);

    // Current state in store has 2 turns, version 3, and FIRST_WARNING
    const freshState = getActiveSessionState(lwwSessionId, "cand_lww_test");
    assert.equal(freshState.turns.length, 2);
    assert.equal(freshState.conductState, "FIRST_WARNING");

    // An outdated delayed worker now attempts to save staleSnapshot (only 1 turn, conduct NORMAL)
    saveActiveSessionState(lwwSessionId, staleSnapshot);

    // Monotonic guard must reject the stale turn regression and maintain the higher conduct state
    const protectedState = getActiveSessionState(lwwSessionId, "cand_lww_test");
    assert.equal(protectedState.turns.length, 2, "Monotonic versioning must prevent dropping turns from newer state");
    assert.equal(protectedState.conductState, "FIRST_WARNING", "Monotonic conduct protection must prevent downgrading conduct state");
  });

});
