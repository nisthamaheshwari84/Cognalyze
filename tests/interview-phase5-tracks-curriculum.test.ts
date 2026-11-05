import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  EIGHT_TRACK_CURRICULA,
  synchronizeCandidateTrackCurriculum,
  recordTrackPracticeCompletion,
  recordVerifiedAssessmentMastery,
} from "../lib/skills/track-curriculum-synchronizer";
import {
  InterviewTrack,
  generateInterviewBlueprint,
  generateBlueprintFallbackQuestion,
  buildCandidateInterviewDossier,
  invalidateCandidateDossierCache,
} from "../lib/ai/interview-engine";
import { saveSession } from "../lib/interview-session-store";
import { getStudentDNAFull } from "../lib/dna/store";

describe("Phase 5: Eight Preparation Tracks Deep-Dive & Curriculum Synchronization Suite", () => {
  const allEightTracks: InterviewTrack[] = [
    "traditional_coding_dsa",
    "code_comprehension",
    "debugging_code_repair",
    "ai_assisted_engineering",
    "system_design",
    "code_review_reliability",
    "senior_engineering_judgment",
    "behavioral_project_deep_dives",
  ];

  test("P5-TEST 1: Eight Distinct Preparation Tracks & Competency Models", () => {
    assert.equal(allEightTracks.length, 8, "Must define exactly 8 interview preparation tracks");

    const trackNames = new Set<string>();
    const trackShortTitles = new Set<string>();

    for (const trackId of allEightTracks) {
      const track = EIGHT_TRACK_CURRICULA[trackId];
      assert.ok(track, `Track definition must exist for ${trackId}`);
      assert.equal(track.id, trackId);
      assert.ok(track.name.length > 5, `Track ${trackId} must have descriptive name`);
      assert.ok(track.philosophy.length > 20, `Track ${trackId} must have distinct engineering philosophy`);
      assert.ok(track.primaryCompetencyKeys.length >= 2, `Track ${trackId} must cover at least 2 primary competency keys`);
      assert.ok(track.coreCompetencies.length >= 3, `Track ${trackId} must have at least 3 weighted core competencies`);
      assert.ok(track.sampleTasks.length >= 3, `Track ${trackId} must have at least 3 sample tasks`);
      assert.ok(track.evalCriteria.length >= 3, `Track ${trackId} must have at least 3 evaluation criteria`);

      trackNames.add(track.name);
      trackShortTitles.add(track.shortTitle);
    }

    assert.equal(trackNames.size, 8, "All 8 track names must be unique");
    assert.equal(trackShortTitles.size, 8, "All 8 short titles must be unique");
  });

  test("P5-TEST 2: Four-Tier Difficulty Progression Across All 8 Tracks", () => {
    for (const trackId of allEightTracks) {
      const track = EIGHT_TRACK_CURRICULA[trackId];
      const tiersPresent = new Set(track.learningObjectives.map((o) => o.tier));

      assert.ok(tiersPresent.has("foundational"), `${trackId} must have foundational learning objectives`);
      assert.ok(tiersPresent.has("applied"), `${trackId} must have applied learning objectives`);
      assert.ok(tiersPresent.has("resilient"), `${trackId} must have resilient learning objectives`);
      assert.ok(tiersPresent.has("strategic"), `${trackId} must have strategic learning objectives`);

      assert.ok(track.practiceActivities.length >= 1, `${trackId} must contain concrete practice activities`);
      for (const act of track.practiceActivities) {
        assert.ok(act.scenario.length > 30, `Activity ${act.id} must have real scenario context`);
        assert.ok(act.validationCriteria.length >= 2, `Activity ${act.id} must have concrete validation criteria`);
        assert.ok(act.targetSkills.length >= 2, `Activity ${act.id} must declare target skills`);
      }
    }
  });

  test("P5-TEST 3: Bidirectional Curriculum Synchronization with Student DNA & History", async () => {
    invalidateCandidateDossierCache();
    const candidateId = "cand_p5_sync_master";

    // Seed prior interview session with demonstrated database & concurrency score
    await saveSession({
      id: "sess_p5_sync_01",
      candidate_id: candidateId,
      session_type: "mock_interview",
      target_role: "Backend Engineer",
      experience_mode: "experienced",
      overall_score: 85,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      report: {
        competenciesAssessed: [
          { competency: "Two Pointers and Sliding Window Invariants", score: 88, status: "demonstrated" },
          { competency: "Topological Sort & Dependency Resolution", score: 82, status: "demonstrated" },
        ],
      },
    });

    const progress = await synchronizeCandidateTrackCurriculum(
      candidateId,
      "traditional_coding_dsa",
      "Backend Engineer"
    );

    assert.equal(progress.candidateId, candidateId);
    assert.equal(progress.track, "traditional_coding_dsa");
    assert.ok(progress.masteredObjectivesCount >= 2, "Must recognize at least 2 demonstrated objectives");
    assert.ok(progress.readinessScore >= 50, "Readiness score must reflect demonstrated objectives");
    assert.ok(
      progress.adequatelyAssessedCompetencies.includes("Two Pointers and Sliding Window Invariants")
    );
    assert.ok(
      progress.objectiveStatuses.some(
        (o) => o.title === "Two Pointers and Sliding Window Invariants" && o.status === "mastered"
      )
    );
  });

  test("P5-TEST 4: Transparent Handling of Incomplete / Unassessed Data (No Fake Progress)", async () => {
    invalidateCandidateDossierCache();
    const blankCandidateId = "cand_p5_blank_honesty";

    const progress = await synchronizeCandidateTrackCurriculum(
      blankCandidateId,
      "ai_assisted_engineering",
      "Software Engineer"
    );

    assert.equal(progress.candidateId, blankCandidateId);
    assert.equal(progress.track, "ai_assisted_engineering");
    assert.equal(progress.masteredObjectivesCount, 0, "Blank profile must have 0 mastered objectives");
    assert.equal(progress.targetGapCount, 0, "Blank profile must not have unearned gap penalties");
    assert.equal(progress.unassessedObjectivesCount, progress.totalObjectives);
    assert.equal(progress.readinessState, "unassessed");
    assert.equal(progress.readinessScore, 0, "Readiness score must be 0 for completely unassessed track");

    // All objectives should be cleanly tagged as unassessed
    for (const obj of progress.objectiveStatuses) {
      assert.equal(obj.status, "unassessed", `Objective ${obj.title} must be unassessed without fabrication`);
    }
  });

  test("P5-TEST 5: Gap-Targeted Practice Recommendations & Novel Angle Calibrations", async () => {
    invalidateCandidateDossierCache();
    const gapCandidateId = "cand_p5_gap_targeting";

    // Record prior session with explicit gap in connection pool starvation
    await saveSession({
      id: "sess_p5_gap_01",
      candidate_id: gapCandidateId,
      session_type: "mock_interview",
      target_role: "Distributed Systems Engineer",
      experience_mode: "experienced",
      overall_score: 52,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      weak_topics_identified: ["Memory Leak & Resource Starvation"],
      report: {
        criticalGaps: ["Memory Leak & Resource Starvation"],
        competenciesAssessed: [
          { competency: "Memory Leak & Resource Starvation Isolation", score: 40, status: "gap" },
        ],
      },
    });

    const debugProgress = await synchronizeCandidateTrackCurriculum(
      gapCandidateId,
      "debugging_code_repair",
      "Distributed Systems Engineer"
    );

    assert.ok(debugProgress.targetGapCount >= 1, "Must detect historical gap");
    assert.ok(
      debugProgress.prioritizedGaps.some((g) => g.includes("Memory Leak")),
      "Prioritized gaps must include the memory leak objective"
    );
    assert.equal(debugProgress.readinessState, "needs_diagnostic");
    assert.ok(
      debugProgress.recommendedNextActivity.id.length > 0,
      "Must recommend concrete practice activity targeting gap"
    );
  });

  test("P5-TEST 6: Authentic Practice Completion & Student DNA Evidence Commit", async () => {
    const candidateId = "cand_p5_dna_commit_test";

    const commitResult = await recordTrackPracticeCompletion(
      candidateId,
      "code_review_reliability",
      "rev_act_1",
      88,
      "Candidate correctly identified path traversal vulnerability and buffer overflow risk.",
      "mastered"
    );

    assert.equal(commitResult.success, true);
    assert.ok(commitResult.evidenceId.length > 0);
    assert.ok(commitResult.message.includes("Code Review & Reliability"));

    // Verify DNA evidence store contains this authentic record
    const dna = await getStudentDNAFull(candidateId);
    assert.ok(dna, "Student DNA must exist");
    assert.ok(dna.evidence && dna.evidence.length >= 1, "Evidence list must contain recorded evidence");
    assert.ok(
      dna.evidence.some((e: any) => e.skillId === "git" || (e.claim && e.claim.includes("Code Review"))),
      "Evidence must match the recorded track activity"
    );
  });

  test("P5-TEST 7: Full Integration with Interview Engine Blueprinting & Fallbacks", async () => {
    invalidateCandidateDossierCache();
    const candidateId = "cand_p5_blueprint_integration";
    const dossier = await buildCandidateInterviewDossier(candidateId, "Senior SRE Go Linux", "SRE");

    // 1. Verify all 8 tracks prepend their distinct core competencies to the blueprint
    for (const trackId of allEightTracks) {
      const bp = generateInterviewBlueprint(dossier, "Senior SRE", 45, "experienced", undefined, undefined, "technical", undefined, undefined, trackId);
      assert.equal(bp.track, trackId);
      assert.ok(
        bp.competencies.some((c) => c.id.startsWith(`comp-track-${trackId}`)),
        `Blueprint must include track-specific competencies for ${trackId}`
      );

      // 2. Verify fallback question selector returns the track's dedicated fallback question
      const fallbackQ = generateBlueprintFallbackQuestion({
        section: "coding_system_design",
        dossier,
        track: trackId,
      });
      assert.ok(fallbackQ.question.length > 20, `Track ${trackId} must return valid fallback question`);
    }
  });

  test("P5-TEST 8: Explicit Score Thresholds (Mastery >= 70%, Gap < 60%, Developing 60-69%)", async () => {
    invalidateCandidateDossierCache();
    const candidateId = "cand_p5_thresholds_test";

    // Seed session with:
    // 1. Mastery (score 82 -> demonstrated / >= 70)
    // 2. Developing (score 65 -> 60-69%)
    // 3. Gap (score 48 -> < 60%)
    await saveSession({
      id: "sess_p5_thresh_01",
      candidate_id: candidateId,
      session_type: "mock_interview",
      target_role: "Software Engineer",
      experience_mode: "experienced",
      overall_score: 65,
      created_at: new Date().toISOString(),
      report: {
        competenciesAssessed: [
          { competency: "OWASP Top 10 PR Vulnerability Identification", score: 82, status: "demonstrated" },
          { competency: "Concurrency & Shared State Review in Asynchronous Code", score: 65, status: "partial" },
          { competency: "API Backward Compatibility & Deprecation Audits", score: 48, status: "gap" },
        ],
      },
    });

    const progress = await synchronizeCandidateTrackCurriculum(
      candidateId,
      "code_review_reliability",
      "Software Engineer"
    );

    const masteredObj = progress.objectiveStatuses.find((o) => o.objectiveId === "rev_obj_1");
    const devObj = progress.objectiveStatuses.find((o) => o.objectiveId === "rev_obj_2");
    const gapObj = progress.objectiveStatuses.find((o) => o.objectiveId === "rev_obj_3");
    const unassessedObj = progress.objectiveStatuses.find((o) => o.objectiveId === "rev_obj_4");

    assert.ok(masteredObj, "Objective 1 must exist");
    assert.equal(masteredObj.status, "mastered", "Score >= 70% must be mapped to 'mastered'");
    assert.equal(masteredObj.evidenceScore, 82);

    assert.ok(devObj, "Objective 2 must exist");
    assert.equal(devObj.status, "in_progress", "Score 60-69% must be mapped to 'in_progress' (developing)");
    assert.equal(devObj.evidenceScore, 65);

    assert.ok(gapObj, "Objective 3 must exist");
    assert.equal(gapObj.status, "target_gap", "Score < 60% must be mapped to 'target_gap'");
    assert.equal(gapObj.evidenceScore, 48);

    assert.ok(unassessedObj, "Objective 4 must exist");
    assert.equal(unassessedObj.status, "unassessed", "Unassessed objective must remain honest unassessed");
  });

  test("P5-TEST 9: Practice Completion Alone NEVER Establishes Verified Technical Mastery", async () => {
    const candidateId = "cand_p5_untrusted_practice_test";

    // Untrusted client submits high score 95% with verdict "mastered" on a practice activity
    const workoutResult = await recordTrackPracticeCompletion(
      candidateId,
      "traditional_coding_dsa",
      "dsa_act_1",
      95,
      "Attempting to claim unearned mastery via practice completion",
      "mastered"
    );
    assert.equal(workoutResult.success, true);

    const dna = await getStudentDNAFull(candidateId);
    const evidence = dna.evidence.find((e: any) => e.metadata?.activityId === "dsa_act_1");
    assert.ok(evidence, "Evidence must be recorded in Student DNA");

    // Must remain strictly practice evidence (CLAIMED, verified: false, establishesMastery: false)
    assert.equal(evidence.sourceType, "practice", "Source type must strictly remain 'practice'");
    assert.equal(evidence.metadata?.establishesMastery, false, "Practice completion must NOT establish mastery");
    assert.equal(evidence.metadata?.verified, false, "Practice completion verified flag must be false");
    assert.equal(evidence.verificationStatus, "CLAIMED", "Practice completion status must be CLAIMED, not VERIFIED");
    assert.ok(
      evidence.claim.includes("Practice completion alone does not establish verified technical mastery"),
      "Claim must explicitly state practice completion does not confer technical mastery"
    );
  });

  test("P5-TEST 10: Server-Side Assessment Validation & Forged Mastery Rejection", async () => {
    const victimCandidateId = "cand_p5_victim_owner";
    const attackerCandidateId = "cand_p5_attacker_claimant";

    // 1. Seed a legitimate completed assessment session for victim
    const validSessionId = "sess_p5_valid_victim_01";
    await saveSession({
      id: validSessionId,
      candidate_id: victimCandidateId,
      session_type: "mock_interview",
      target_role: "Backend Engineer",
      experience_mode: "experienced",
      overall_score: 88,
      created_at: new Date().toISOString(),
      report: {
        competenciesAssessed: [
          { competency: "Traditional Coding & DSA", score: 88, status: "demonstrated" },
        ],
      },
    });

    // 2. Attacker attempts to claim verified mastery using victim's session ID -> Must REJECT with Unauthorized
    await assert.rejects(
      async () => {
        await recordTrackPracticeCompletion(
          attackerCandidateId,
          "traditional_coding_dsa",
          "dsa_act_1",
          88,
          "Stolen session reference",
          "mastered",
          { assessmentSessionId: validSessionId }
        );
      },
      { message: /Unauthorized: Assessment session .* does not belong to candidate/ }
    );

    // 3. Attacker attempts to reference an incomplete/pending session of their own -> Must REJECT
    const pendingSessionId = "sess_p5_attacker_pending_01";
    await saveSession({
      id: pendingSessionId,
      candidate_id: attackerCandidateId,
      session_type: "mock_interview",
      target_role: "Backend Engineer",
      experience_mode: "experienced",
      overall_score: 0,
      created_at: new Date().toISOString(),
      // No report, session is pending
    });

    await assert.rejects(
      async () => {
        await recordTrackPracticeCompletion(
          attackerCandidateId,
          "traditional_coding_dsa",
          "dsa_act_1",
          90,
          "Pending session reference",
          "mastered",
          { assessmentSessionId: pendingSessionId }
        );
      },
      { message: /Invalid assessment session.*not completed/ }
    );

    // 4. Attacker attempts to reference a completed session that scored poorly (< 70%) -> Must REJECT
    const lowScoreSessionId = "sess_p5_attacker_failed_01";
    await saveSession({
      id: lowScoreSessionId,
      candidate_id: attackerCandidateId,
      session_type: "mock_interview",
      target_role: "Backend Engineer",
      experience_mode: "experienced",
      overall_score: 45,
      created_at: new Date().toISOString(),
      report: {
        competenciesAssessed: [
          { competency: "Traditional Coding & DSA", score: 45, status: "gap" },
        ],
      },
    });

    await assert.rejects(
      async () => {
        await recordTrackPracticeCompletion(
          attackerCandidateId,
          "traditional_coding_dsa",
          "dsa_act_1",
          90,
          "Low score session reference",
          "mastered",
          { assessmentSessionId: lowScoreSessionId }
        );
      },
      { message: /Forged mastery claim.*does not contain demonstrated mastery/ }
    );

    // 5. Legitimate candidate with authentic completed assessment (score >= 70) -> Establishes Verified Mastery
    const masteryResult = await recordVerifiedAssessmentMastery(
      victimCandidateId,
      validSessionId,
      "traditional_coding_dsa",
      "dsa_act_1",
      88,
      "Authentic server assessment verified"
    );
    assert.equal(masteryResult.success, true);

    const victimDNA = await getStudentDNAFull(victimCandidateId);
    const verifiedEvidence = victimDNA.evidence.find((e: any) => e.sourceId.includes("dsa_act_1"));
    assert.ok(verifiedEvidence, "Verified evidence must exist");
    assert.equal(verifiedEvidence.sourceType, "assessment", "Source type must be 'assessment'");
    assert.equal(verifiedEvidence.metadata?.establishesMastery, true, "Must establish verified mastery");
    assert.equal(verifiedEvidence.metadata?.verified, true, "Must be flagged verified");
    assert.equal(verifiedEvidence.verificationStatus, "VERIFIED", "Status must be VERIFIED in Student DNA");
    assert.equal(verifiedEvidence.confidence, "HIGH", "Confidence must be HIGH (0.90)");
    assert.ok(verifiedEvidence.claim.includes("Demonstrated verified technical mastery"), "Claim must indicate verified mastery");
  });

  test("P5-TEST 11: Durable Practice Submission Idempotency & Deduplication", async () => {
    const candidateId = "cand_p5_durable_idempotency_test";

    // 1. Initial submission
    const res1 = await recordTrackPracticeCompletion(
      candidateId,
      "debugging_code_repair",
      "debug_act_1",
      75,
      "First attempt",
      "completed",
      { idempotencyKey: "attempt_alpha_01" }
    );
    assert.equal(res1.success, true);

    const dna1 = await getStudentDNAFull(candidateId);
    const matchingCount1 = dna1.evidence.filter((e: any) => e.metadata?.activityId === "debug_act_1").length;
    assert.equal(matchingCount1, 1, "Exactly 1 evidence record should exist after first submission");

    // 2. Retry identical submission (idempotent retry): must return success with idempotent: true
    const res2 = await recordTrackPracticeCompletion(
      candidateId,
      "debugging_code_repair",
      "debug_act_1",
      75,
      "First attempt",
      "completed",
      { idempotencyKey: "attempt_alpha_01" }
    );
    assert.equal(res2.success, true);
    assert.equal(res2.idempotent, true, "Should return idempotent: true on retry");
    assert.equal(res2.evidenceId, res1.evidenceId, "Must return the same evidence ID");

    // Verify evidence count did NOT increase
    const dna2 = await getStudentDNAFull(candidateId);
    const matchingCount2 = dna2.evidence.filter((e: any) => e.metadata?.activityId === "debug_act_1").length;
    assert.equal(matchingCount2, 1, "Evidence count must remain 1 on idempotent retry (no duplicates)");

    // 3. Concurrent identical requests: should resolve safely via in-flight mutex
    const candidateConcurrent = "cand_p5_concurrent_test";
    const [cRes1, cRes2] = await Promise.all([
      recordTrackPracticeCompletion(
        candidateConcurrent,
        "ai_assisted_engineering",
        "ai_act_1",
        80,
        "Concurrent request 1",
        "completed"
      ),
      recordTrackPracticeCompletion(
        candidateConcurrent,
        "ai_assisted_engineering",
        "ai_act_1",
        80,
        "Concurrent request 2",
        "completed"
      ),
    ]);

    assert.equal(cRes1.success, true);
    assert.equal(cRes2.success, true);

    const dnaConcurrent = await getStudentDNAFull(candidateConcurrent);
    const concurrentCount = dnaConcurrent.evidence.filter((e: any) => e.metadata?.activityId === "ai_act_1").length;
    assert.equal(concurrentCount, 1, "Concurrent submissions must never create duplicate evidence");

    // 4. Missing idempotencyKey: safely derives stable key, retry without key never duplicates
    const candMissingKey = `cand_p5_missing_key_${Date.now()}`;
    const mRes1 = await recordTrackPracticeCompletion(
      candMissingKey,
      "traditional_coding_dsa",
      "dsa_act_1",
      82,
      "No key provided",
      "completed"
    );
    assert.equal(mRes1.success, true);

    const mRes2 = await recordTrackPracticeCompletion(
      candMissingKey,
      "traditional_coding_dsa",
      "dsa_act_1",
      82,
      "Retry also with no key",
      "completed"
    );
    assert.equal(mRes2.success, true);
    assert.equal(mRes2.idempotent, true, "Retry with missing key must return idempotent: true");

    const dnaMissing = await getStudentDNAFull(candMissingKey);
    const missingCount = dnaMissing.evidence.filter((e: any) => e.metadata?.activityId === "dsa_act_1").length;
    assert.equal(missingCount, 1, "Missing key submissions must never create duplicate evidence");

    // 5. Changed key on retry: retry with newly generated key must NOT create a second evidence record
    const candChangedKey = `cand_p5_changed_key_${Date.now()}`;
    const chRes1 = await recordTrackPracticeCompletion(
      candChangedKey,
      "traditional_coding_dsa",
      "dsa_act_1",
      85,
      "First attempt with key A",
      "completed",
      { idempotencyKey: "uuid_attempt_key_001" }
    );
    assert.equal(chRes1.success, true);

    // Client retries with newly generated key
    const chRes2 = await recordTrackPracticeCompletion(
      candChangedKey,
      "traditional_coding_dsa",
      "dsa_act_1",
      85,
      "Retry attempt with newly generated key B",
      "completed",
      { idempotencyKey: "uuid_attempt_key_002" }
    );
    assert.equal(chRes2.success, true);
    assert.equal(chRes2.idempotent, true, "Retry with newly generated key must return idempotent: true");

    const dnaChanged = await getStudentDNAFull(candChangedKey);
    const changedKeyCount = dnaChanged.evidence.filter((e: any) => e.metadata?.activityId === "dsa_act_1").length;
    assert.equal(changedKeyCount, 1, "Changed key retry must NEVER create a second evidence record");

    // 6. Cross-candidate scoping: Key is isolated strictly per candidate
    const candA = `cand_p5_cross_A_${Date.now()}`;
    const candB = `cand_p5_cross_B_${Date.now()}`;
    const sharedKey = "shared_key_12345";

    const resA = await recordTrackPracticeCompletion(
      candA,
      "system_design",
      "sys_act_1",
      88,
      "Candidate A submission",
      "completed",
      { idempotencyKey: sharedKey }
    );
    const resB = await recordTrackPracticeCompletion(
      candB,
      "system_design",
      "sys_act_1",
      88,
      "Candidate B submission",
      "completed",
      { idempotencyKey: sharedKey }
    );

    assert.equal(resA.success, true);
    assert.equal(resB.success, true);

    const dnaA = await getStudentDNAFull(candA);
    const dnaB = await getStudentDNAFull(candB);

    assert.equal(dnaA.evidence.filter((e: any) => e.metadata?.activityId === "sys_act_1").length, 1);
    assert.equal(dnaB.evidence.filter((e: any) => e.metadata?.activityId === "sys_act_1").length, 1);
    assert.equal(dnaA.evidence[0].userId, candA);
    assert.equal(dnaB.evidence[0].userId, candB);
    assert.notEqual(resA.evidenceId, resB.evidenceId, "Evidence IDs must remain isolated across candidates");
  });

  test("P5-TEST 12: Input Validation & Debounce Guard", async () => {
    const candidateId = `cand_p5_input_val_${Date.now()}`;

    // 1. Reject invalid score bounds
    await assert.rejects(
      async () => {
        await recordTrackPracticeCompletion(candidateId, "system_design", "sys_act_1", 105, "Over 100", "completed");
      },
      { message: /Invalid score/ }
    );
    await assert.rejects(
      async () => {
        await recordTrackPracticeCompletion(candidateId, "system_design", "sys_act_1", -5, "Negative", "completed");
      },
      { message: /Invalid score/ }
    );

    // 2. Reject non-existent activity
    await assert.rejects(
      async () => {
        await recordTrackPracticeCompletion(candidateId, "system_design", "non_existent_activity_id", 80, "", "completed");
      },
      { message: /does not exist/ }
    );

    // 3. Debounce guard on rapid disparate submissions within 3 seconds
    const firstSubmission = await recordTrackPracticeCompletion(
      candidateId,
      "system_design",
      "sys_act_1",
      85,
      "First submission",
      "completed"
    );
    assert.equal(firstSubmission.success, true);

    await assert.rejects(
      async () => {
        await recordTrackPracticeCompletion(
          candidateId,
          "system_design",
          "sys_act_1",
          90, // different score triggers rate limit rather than idempotent return
          "Rapid disparate submission",
          "completed"
        );
      },
      { message: /Duplicate submission detected/ }
    );
  });

  test("P5-TEST 13: Preparation Sync HTTP API Endpoint Security & Idempotency", async () => {
    const { GET, POST } = await import("../app/api/skills/preparation/sync/route");
    const { NextRequest } = await import("next/server");

    const candidateId = `cand_p5_api_${Date.now()}`;

    // 1. Untrusted client submits high score 98% with verdict "mastered"
    const req1 = new NextRequest("http://localhost:3000/api/skills/preparation/sync", {
      method: "POST",
      body: JSON.stringify({
        candidateId,
        track: "system_design",
        activityId: "sys_act_1",
        score: 98,
        evaluatorVerdict: "mastered",
        idempotencyKey: "idem_http_01",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res1 = await POST(req1);
    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    assert.equal(body1.success, true);

    // Verify Student DNA evidence is strictly unverified practice
    const dna1 = await getStudentDNAFull(candidateId);
    const ev1 = dna1.evidence.find((e: any) => e.metadata?.activityId === "sys_act_1");
    assert.ok(ev1, "Evidence must be recorded");
    assert.equal(ev1.sourceType, "practice");
    assert.equal(ev1.verificationStatus, "CLAIMED");
    assert.equal(ev1.metadata?.verified, false);
    assert.equal(ev1.metadata?.establishesMastery, false);

    // 2. Retry with same idempotency key returns 200 with idempotent: true and NO duplicate evidence
    const req2 = new NextRequest("http://localhost:3000/api/skills/preparation/sync", {
      method: "POST",
      body: JSON.stringify({
        candidateId,
        track: "system_design",
        activityId: "sys_act_1",
        score: 98,
        evaluatorVerdict: "mastered",
        idempotencyKey: "idem_http_01",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res2 = await POST(req2);
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    assert.equal(body2.success, true);
    assert.equal(body2.idempotent, true);

    const dna2 = await getStudentDNAFull(candidateId);
    assert.equal(
      dna2.evidence.filter((e: any) => e.metadata?.activityId === "sys_act_1").length,
      1,
      "HTTP API retry must never duplicate Student DNA evidence"
    );

    // 3. Forged assessment session reference returns 403 Forbidden
    const req3 = new NextRequest("http://localhost:3000/api/skills/preparation/sync", {
      method: "POST",
      body: JSON.stringify({
        candidateId,
        track: "system_design",
        activityId: "sys_act_1",
        score: 98,
        evaluatorVerdict: "mastered",
        assessmentSessionId: "sess_non_existent_unauthorized_123",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res3 = await POST(req3);
    assert.equal(res3.status, 403, "Forged session reference must return 403 Forbidden");

    // 4. GET endpoint returns synchronized state
    const req4 = new NextRequest(`http://localhost:3000/api/skills/preparation/sync?track=system_design&candidateId=${candidateId}`);
    const res4 = await GET(req4);
    assert.equal(res4.status, 200);
    const body4 = await res4.json();
    assert.equal(body4.success, true);
    assert.equal(body4.track, "system_design");
    assert.ok(body4.curriculum);
    assert.ok(body4.synchronized);
  });
});
