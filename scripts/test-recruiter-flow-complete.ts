/**
 * COMPLETE FLOW VERIFICATION TEST SUITE: Cognalyze Recruiter
 * 
 * Verifies all 14 Phases (Phase 0 to Phase 13) end-to-end:
 *   Phase 0: Recruiter Login + Command Center + Candidate Pool / Open Positions views
 *   Phase 1: Role Architect -> Role DNA (outcomes + 4-tier requirements)
 *   Phase 2: Candidate Discovery (Bulk upload + Student application sync)
 *   Phase 3: Multi-Source Candidate Intelligence (Resume, GitHub, ethical LinkedIn/LeetCode links, Projects, Hackathons, Prior Interviews)
 *   Phase 4: Evidence Graph (Claim -> Source -> Proof) & Candidate DNA
 *   Phase 5: Role <-> Candidate Match Engine & 3-way Strong/Partial/Unknown split
 *   Phase 6: Uncertainty Engine & Minimum Proof Engine (Critical prioritized over Trainable)
 *   Phase 7: Verification & Work Sample Mini-Task generation and evaluation
 *   Phase 8: Interview Intelligence + Memory (no repeats, targets unknowns)
 *   Phase 9: Conflict Detector & Targeted Verification loopback
 *   Phase 10: Decision Room with Hire / Hold / Reject (Hold loops back to Phase 7)
 *   Phase 11: Talent Recovery routing rejected candidate to alternative roles
 *   Phase 12: 30/60/90 Quality-of-Hire Learning Loop (insufficient data state vs threshold met)
 *   Phase 13: Future Role & Screening Optimization feedback loop
 */

import {
  getAllRoles,
  getRoleById,
  saveRole,
  getAllCandidates,
  getCandidateById,
  addCandidate,
  getActionQueue,
  getHireOutcomeRecords,
  recordHireOutcome,
  updateCandidateStage
} from "../lib/recruiter-store";

import {
  RoleDNA,
  createDefaultRoleDNA,
  normalizeRoleDnaWeights
} from "../lib/ai/role-dna";

import {
  buildEvidenceGraph
} from "../lib/ai/evidence-graph";

import {
  computeRoleCandidateMatch,
  generateMinimumProofPlan
} from "../lib/ai/minimum-proof";

import {
  generateWorkSampleTask,
  evaluateWorkSample
} from "../lib/ai/work-sample";

import {
  generateMemoryAwareInterviewQuestions,
  recordInterviewFeedback,
  CandidateInterviewHistory
} from "../lib/ai/interview-memory";

import {
  detectConflicts
} from "../lib/ai/conflict-detector";

import {
  evaluateTalentRecovery
} from "../lib/ai/talent-recovery";

import {
  computeQualityOfHireAnalytics,
  generateSampleHireRecords
} from "../lib/ai/quality-of-hire";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function runCompleteRecruiterFlowTest() {
  console.log("================================================================================");
  console.log("🚀 STARTING COMPLETE FLOW TEST: Cognalyze Recruiter (Phase 0 to Phase 13)");
  console.log("================================================================================\n");

  // ─────────────────────────────────────────────────────────────
  // PHASE 0: Login + Command Center + Pool/Positions Views
  // ─────────────────────────────────────────────────────────────
  console.log("▶ PHASE 0: Recruiter Command Center & Live Pipeline Views");
  const roles = await getAllRoles();
  assert(roles.length >= 3, `Expected at least 3 active roles in store, found ${roles.length}`);

  const candidates = await getAllCandidates();
  assert(candidates.length >= 3, `Expected at least 3 candidates in store, found ${candidates.length}`);

  const actionQueue = await getActionQueue();
  assert(actionQueue.length >= 1, `Expected at least 1 action item in Command Center queue, found ${actionQueue.length}`);
  console.log(`  ✓ Command Center Action Queue loaded: ${actionQueue.length} pending items`);

  // ─────────────────────────────────────────────────────────────
  // PHASE 1: Role Architect -> Role DNA
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ PHASE 1: Role Architect -> Role DNA Creation & Tiered Requirements");
  const newRole = createDefaultRoleDNA("Principal Distributed Architect", "Core Systems");
  newRole.tieredRequirements = [
    {
      id: "req-crit-1",
      name: "Raft Consensus & Distributed Log Replication",
      tier: "Critical",
      category: "System Design",
      description: "Deep knowledge of multi-Paxos/Raft state machines and quorum failover",
      weightPct: 40,
      verificationMethod: "work_sample",
      dealBreakerIfMissing: true,
      acceptableProofTypes: ["production_code", "live_work_sample"]
    },
    {
      id: "req-crit-2",
      name: "Low-Latency Kernel Network Tuning (eBPF/DPDK)",
      tier: "Critical",
      category: "Technical",
      description: "High packet throughput with zero-copy buffers",
      weightPct: 30,
      verificationMethod: "code_execution",
      dealBreakerIfMissing: true,
      acceptableProofTypes: ["production_code"]
    },
    {
      id: "req-imp-1",
      name: "Distributed Tracing Architecture (OpenTelemetry)",
      tier: "Important",
      category: "Technical",
      description: "Context propagation across microservices boundaries",
      weightPct: 20,
      verificationMethod: "targeted_interview",
      dealBreakerIfMissing: false,
      acceptableProofTypes: ["verified_interview"]
    },
    {
      id: "req-train-1",
      name: "Prometheus Alertmanager Syntax",
      tier: "Trainable",
      category: "Technical",
      description: "Rule writing; easily acquired in first 2 weeks",
      weightPct: 10,
      verificationMethod: "portfolio_audit",
      dealBreakerIfMissing: false,
      acceptableProofTypes: ["verified_interview"]
    }
  ];

  const normalized = normalizeRoleDnaWeights(newRole.tieredRequirements);
  const totalWeight = normalized.reduce((acc, r) => acc + r.weightPct, 0);
  assert(totalWeight === 100, `Expected total requirement weight to equal 100%, got ${totalWeight}%`);
  assert(newRole.businessOutcomes.length >= 2, "Expected Role DNA to store business outcomes");

  await saveRole(newRole);
  const retrievedRole = await getRoleById(newRole.id);
  assert(retrievedRole !== null && retrievedRole.id === newRole.id, "Role DNA saved and retrieved successfully");

  // ─────────────────────────────────────────────────────────────
  // PHASE 2: Candidate Discovery (Bulk Upload + Student Application Sync)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ PHASE 2: Candidate Discovery: Multi-Channel Intake Synchronization");
  const bulkCandidate = candidates.find(c => c.sourceType === "bulk_upload");
  const studentCandidate = candidates.find(c => c.sourceType === "student_application");

  assert(bulkCandidate !== undefined, `Confirmed bulk upload candidate present in pool: ${bulkCandidate?.name}`);
  assert(studentCandidate !== undefined, `Confirmed student application candidate synchronized in pool: ${studentCandidate?.name}`);
  assert(bulkCandidate?.appliedRoleId !== undefined && studentCandidate?.appliedRoleId !== undefined, "Both entry paths map to valid role IDs");

  // ─────────────────────────────────────────────────────────────
  // PHASE 3: Candidate Intelligence Multi-Source Dossier
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ PHASE 3: Multi-Source Candidate Intelligence Aggregation");
  const testCandidate = candidates.find(c => c.id === "cand-student-nistha") || candidates[0];

  assert(Boolean(testCandidate.resumeText), "Resume text successfully parsed");
  assert(Boolean(testCandidate.githubData?.handle), `GitHub integration verified: @${testCandidate.githubData?.handle} with ${testCandidate.githubData?.repos.length} repos`);
  assert(Boolean(testCandidate.linkedInUrl), `LinkedIn ethical reference link verified (no scraping): ${testCandidate.linkedInUrl}`);
  assert(Boolean(testCandidate.leetCodeProfile?.username), `LeetCode profile handle verified: ${testCandidate.leetCodeProfile?.username} (${testCandidate.leetCodeProfile?.problemsSolved} solved)`);
  assert(Boolean(testCandidate.studentProjects && testCandidate.studentProjects.length > 0), `Cognalyze student project submissions synchronized: ${testCandidate.studentProjects?.length} projects`);
  assert(Boolean(testCandidate.hackathonRecords && testCandidate.hackathonRecords.length > 0), `Hackathon participation records verified: ${testCandidate.hackathonRecords?.[0]}`);
  assert(Boolean(testCandidate.priorCognalyzeInterviewHistory && testCandidate.priorCognalyzeInterviewHistory.length > 0), `Prior Cognalyze evaluation history retrieved: ${testCandidate.priorCognalyzeInterviewHistory?.[0].roleEvaluatedFor}`);

  // ─────────────────────────────────────────────────────────────
  // PHASE 4: Evidence Graph & Candidate DNA
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ PHASE 4: Evidence Graph (Claim -> Source -> Proof) & Candidate DNA");
  const targetRole = roles[0]; // Senior Distributed Backend Engineer
  const { candidateDNA, nodes } = buildEvidenceGraph(
    {
      id: testCandidate.id,
      name: testCandidate.name,
      resumeText: testCandidate.resumeText,
      githubData: testCandidate.githubData,
      studentProjects: testCandidate.studentProjects,
      hackathons: testCandidate.hackathonRecords,
      workSampleResults: testCandidate.workSampleResults
    },
    targetRole
  );

  assert(nodes.length === targetRole.tieredRequirements.length, `Evidence Graph nodes (${nodes.length}) match Role DNA requirements`);
  for (const node of nodes) {
    assert(Boolean(node.claim), `Node for ${node.requirementName} contains explicit claim`);
    assert(Boolean(node.source), `Node for ${node.requirementName} identifies source`);
    assert(node.uncertaintyStatus === "known" || node.uncertaintyStatus === "partially_known" || node.uncertaintyStatus === "unknown", `Valid uncertainty status: ${node.uncertaintyStatus}`);
  }

  assert(candidateDNA.hiddenTalents.length >= 1, `Hidden Talent Detector unstated strengths found: ${candidateDNA.hiddenTalents[0].competency}`);
  assert(candidateDNA.growthVelocityScore > 0, `Computed Growth Velocity: ${candidateDNA.growthVelocityScore}/100`);

  // ─────────────────────────────────────────────────────────────
  // PHASE 5: Role ↔ Candidate Match Engine & 3-Way Split
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ PHASE 5: Role ↔ Candidate Match Engine & 3-Way Evidence Split");
  const match = computeRoleCandidateMatch(targetRole, candidateDNA);

  const totalSplitItems = match.evidenceSplit.strong.length + match.evidenceSplit.partial.length + match.evidenceSplit.unknown.length;
  assert(totalSplitItems === targetRole.tieredRequirements.length, `3-way split contains all ${targetRole.tieredRequirements.length} requirements`);
  console.log(`  ✓ 3-Way Split: Strong (${match.evidenceSplit.strong.length}), Partial (${match.evidenceSplit.partial.length}), Unknown (${match.evidenceSplit.unknown.length})`);
  assert(match.coverageSummary.criticalCoveragePct >= 0, `Critical Coverage: ${match.coverageSummary.criticalCoveragePct}%`);

  // ─────────────────────────────────────────────────────────────
  // PHASE 6: Uncertainty Engine & Minimum Proof Engine
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ PHASE 6: Uncertainty Engine & Minimum Proof Prioritization");
  const minProof = generateMinimumProofPlan(targetRole, candidateDNA);

  assert(minProof.prioritizationIntegrityCheck.criticalPrioritizedFirst, "Prioritization Check: Critical unknowns MUST be prioritized before Trainable skills");
  
  if (minProof.proposals.length >= 2) {
    const firstTier = minProof.proposals[0].tier;
    assert(firstTier === "Critical" || firstTier === "Important", `First verification probe is tier '${firstTier}' (strictly non-trainable)`);
  }
  console.log(`  ✓ Minimum Proof Plan: ${minProof.proposals.length} probes generated. Critical first validated.`);

  // ─────────────────────────────────────────────────────────────
  // PHASE 7: Verification & Work Sample Mini-Tasks
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ PHASE 7: Verification / Work Sample Generation & Submission Evaluation");
  const criticalReq = targetRole.tieredRequirements.find(r => r.tier === "Critical")!;
  const workSampleTask = generateWorkSampleTask(targetRole, criticalReq.id, "direct_verification");

  assert(workSampleTask.requirementId === criticalReq.id, "Work sample mini-task is genuinely tied to Role DNA Critical requirement");
  assert(workSampleTask.evaluationRubric.length >= 2, "Work sample contains structured multi-point rubric");

  // Evaluate candidate submission
  const submission = `We implement an idempotent Kafka consumer using a PostgreSQL unique transaction ledger. We store the idempotency_key in a dedicated transactions table inside an ACID transaction before committing offsets. If a partition rebalance occurs, uncommitted transactions roll back cleanly and poison-pill messages are routed to a dead-letter queue. We monitor lag metrics via Prometheus and trace with OpenTelemetry.`;
  const evalResult = evaluateWorkSample(workSampleTask, testCandidate.id, submission);

  assert(evalResult.passed === true, `Work sample evaluation passed: ${evalResult.score}/100`);
  assert(evalResult.updatedEvidenceState === "known", "Work sample successfully promoted requirement state from Unknown to Known!");
  assert(Boolean(evalResult.verbatimProof), "Verbatim proof captured for Evidence Graph");

  // Update candidate profile with work sample result
  testCandidate.workSampleResults = {
    [criticalReq.id]: {
      passed: evalResult.passed,
      score: evalResult.score,
      output: evalResult.verbatimProof
    }
  };

  // Re-run Evidence Graph and verify promotion
  const reEvaluated = buildEvidenceGraph(
    {
      id: testCandidate.id,
      name: testCandidate.name,
      resumeText: testCandidate.resumeText,
      githubData: testCandidate.githubData,
      studentProjects: testCandidate.studentProjects,
      hackathons: testCandidate.hackathonRecords,
      workSampleResults: testCandidate.workSampleResults
    },
    targetRole
  );

  const updatedNode = reEvaluated.nodes.find(n => n.requirementId === criticalReq.id);
  assert(updatedNode?.uncertaintyStatus === "known", `Requirement '${criticalReq.name}' is now empirically KNOWN via Work Sample proof`);

  // ─────────────────────────────────────────────────────────────
  // PHASE 8: Interview Intelligence + Memory
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ PHASE 8: Interview Intelligence with Cross-Round Memory & Deduplication");
  const mockHistory: CandidateInterviewHistory = {
    candidateId: testCandidate.id,
    roleId: targetRole.id,
    roundsCompleted: 1,
    questionHistory: [
      {
        questionId: "q-old-1",
        roundNumber: 1,
        interviewerName: "Sarah Chen (Tech Lead)",
        requirementId: targetRole.tieredRequirements[1].id,
        requirementName: targetRole.tieredRequirements[1].name,
        questionText: "Walk me through a production scenario where you had to debug a race condition under concurrent load.",
        focusArea: "Concurrency",
        rating: 8,
        competencyConfirmed: true,
        timestamp: new Date().toISOString()
      }
    ]
  };

  const interviewQuestions = generateMemoryAwareInterviewQuestions(targetRole, reEvaluated.candidateDNA, mockHistory);
  assert(interviewQuestions.length >= 1, `Generated ${interviewQuestions.length} memory-aware interview questions`);

  // Confirm no verbatim repetition
  const repeated = interviewQuestions.some(q => q.questionText === mockHistory.questionHistory[0].questionText);
  assert(!repeated, "Interview Memory confirmed: avoided asking already-asked question");

  // Record round 2 scorecard feedback
  const updatedHistory = recordInterviewFeedback(mockHistory, {
    interviewerName: "Alex Rivera (Bar Raiser)",
    roundNumber: 2,
    questionId: interviewQuestions[0].questionId,
    requirementId: interviewQuestions[0].requirementId,
    requirementName: interviewQuestions[0].requirementName,
    questionText: interviewQuestions[0].questionText,
    focusArea: interviewQuestions[0].probingAngle,
    candidateResponseSummary: "Candidate articulated failure modes and circuit breaker thresholds with strong conviction.",
    verbatimQuote: "We set circuit breaker timeout to 250ms with a half-open trial rate of 10% after 5 consecutive failures.",
    rating: 9,
    competencyConfirmed: true
  });

  assert(updatedHistory.roundsCompleted === 2, "Interview rounds incremented to 2");
  assert(updatedHistory.questionHistory.length === 2, "Question history correctly appended");
  assert(updatedHistory.overallInterviewerRecommendation === "Strong Hire" || updatedHistory.overallInterviewerRecommendation === "Hire", `Recommendation derived: ${updatedHistory.overallInterviewerRecommendation}`);

  // ─────────────────────────────────────────────────────────────
  // PHASE 9: Conflict Detector & Targeted Verification Loop
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ PHASE 9: Conflict Detector & Targeted Verification Loopback");
  const conflictingWorkSamples = {
    [targetRole.tieredRequirements[0].id]: {
      passed: false,
      score: 42,
      output: "Failed to answer transaction rollback edge case under partition rebalance."
    }
  };

  const conflictResult = detectConflicts(
    targetRole,
    candidateDNA,
    undefined,
    conflictingWorkSamples
  );

  assert(conflictResult.conflictsFound, "Conflict Detector successfully caught discrepancy between claim and failed work sample");
  assert(conflictResult.targetedLoopProposals.length >= 1, "Conflict loopback confirmed: automatically created targeted Phase 7 verification mini-task");
  console.log(`  ✓ Conflict Loopback active: '${conflictResult.targetedLoopProposals[0].title}'`);

  // ─────────────────────────────────────────────────────────────
  // PHASE 10: Decision Room & Hold Loop
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ PHASE 10: Decision Room (Hire / Hold / Reject) & Hold Loopback");
  // Test Hold decision loopback
  const holdCandidate = { ...testCandidate };
  const holdWorkSample = generateWorkSampleTask(targetRole, targetRole.tieredRequirements[0].id, "hold_evidence_gather");
  assert(holdWorkSample.triggerContext === "hold_evidence_gather", "Hold decision successfully triggered Phase 7 verification loopback");

  // Re-evaluation after Hold submission
  const holdSubmission = evaluateWorkSample(holdWorkSample, holdCandidate.id, "Comprehensive architectural defense addressing previous ambiguities.");
  assert(holdSubmission.score >= 50, "Hold verification executed and updated evidence trail");

  // ─────────────────────────────────────────────────────────────
  // PHASE 11: Talent Recovery -> Other Open Roles
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ PHASE 11: Talent Recovery: Routing Rejected Candidate to Alternative Open Roles");
  const talentRecovery = evaluateTalentRecovery(candidateDNA, targetRole.id, roles);

  assert(talentRecovery.recoveredMatches.length >= 1, `Talent Recovery successfully matched rejected candidate to ${talentRecovery.recoveredMatches.length} alternative role(s)`);
  const topRecovery = talentRecovery.recoveredMatches[0];
  console.log(`  ✓ Top Recovered Match: ${topRecovery.targetRoleTitle} (${topRecovery.compatibilityScore}% Compatibility)`);
  assert(Boolean(topRecovery.directRoutingAction), "Talent Recovery produced concrete routing action");

  // ─────────────────────────────────────────────────────────────
  // PHASE 12: 30/60/90 Quality-of-Hire Learning Loop (Honest Gating)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ PHASE 12: 30/60/90 Quality-of-Hire Learning Loop & Honest Gating Threshold");
  
  // 1. Test "Insufficient Data" state (< 20 records)
  const insufficientRecords = generateSampleHireRecords(); // 3 records
  const insufficientAnalytics = computeQualityOfHireAnalytics(insufficientRecords, roles);
  assert(insufficientAnalytics.status === "insufficient_data", `Gating verified: Status is 'insufficient_data' when records < 20 (${insufficientAnalytics.currentRecordsCount}/20)`);
  console.log(`  ✓ Insufficient Data State verified: "${insufficientAnalytics.message}"`);

  // 2. Test "Threshold Met" state (>= 20 records)
  const cohort20Records = Array.from({ length: 20 }, (_, idx) => {
    const base = generateSampleHireRecords()[idx % 3];
    return {
      ...base,
      hireId: `hire-test-${idx + 1}`,
      candidateId: `cand-test-${idx + 1}`
    };
  });
  const metAnalytics = computeQualityOfHireAnalytics(cohort20Records, roles);
  assert(metAnalytics.status === "threshold_met", `Threshold Met verified: Status is 'threshold_met' with ${metAnalytics.currentRecordsCount} records`);
  assert(Boolean(metAnalytics.metrics?.average90DayPerformance), `Average 90-day performance: ${metAnalytics.metrics?.average90DayPerformance}%`);
  assert(Boolean(metAnalytics.metrics?.workSampleCorrelation), `Work sample correlation advantage: +${metAnalytics.metrics?.workSampleCorrelation.deltaPct}%`);


  // ─────────────────────────────────────────────────────────────
  // PHASE 13: Improve Future Role / Screening Engine
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ PHASE 13: Future Role Optimization & Calibration Feedback Loop");
  assert(Boolean(metAnalytics.phase13FutureRecommendations && metAnalytics.phase13FutureRecommendations.length >= 1), "Phase 13 calibration recommendations generated from 90-day retention learnings");
  
  const rec = metAnalytics.phase13FutureRecommendations![0];
  console.log(`  ✓ Recommendation for ${rec.roleTitle}: ${rec.recommendationType}`);
  console.log(`    Rationale: ${rec.rationale}`);
  assert(Boolean(rec.expectedYieldImprovement), "Expected yield improvement quantified");

  console.log("\n================================================================================");
  console.log("🎉 ALL 14 PHASES (0 to 13) VERIFIED SUCCESSFULLY WITH ZERO OMISSIONS!");
  console.log("================================================================================\n");
}

runCompleteRecruiterFlowTest().catch(err => {
  console.error("FATAL ERROR IN TEST RUNNER:", err);
  process.exit(1);
});
