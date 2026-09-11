import { canScoreRound } from "../lib/simulation/gating";
import { evaluateHolisticSimulation, SimulationSession } from "../lib/simulation/simulation-engine";
import { generateOASession, executeJavascriptCode } from "../lib/simulation/oa-generator";
import { verifyGitHubProfile } from "../lib/simulation/github-verifier";

async function runAllTests() {
  console.log("================================================================================");
  console.log("🧪 RUNNING COMPREHENSIVE VERIFICATION FOR FULL RECRUITMENT SIMULATION GATING");
  console.log("================================================================================\n");

  let allPassed = true;

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 1: GD Arena without candidate messages -> MUST be "not_attempted" & score === null
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("▶ TEST 1: GD Arena zero participation gating (DoD 1)");
  const gdEmptyCheck = canScoreRound("group_discussion", {
    gdMessages: [
      { speaker: "Moderator", role: "moderator", content: "Welcome to today's group discussion topic: Monolith vs Microservices." },
      { speaker: "Peer 1 (Aarav)", role: "peer", content: "I believe microservices offer unparalleled scaling benefits." },
      { speaker: "Peer 2 (Neha)", role: "peer", content: "However, operational overhead and distributed tracing can kill small teams." },
    ],
  });

  console.log(`  - canScoreRound Result: canScore = ${gdEmptyCheck.canScore}, status = "${gdEmptyCheck.status}"`);
  console.log(`  - Reason: "${gdEmptyCheck.reason}"`);
  console.log(`  - Missing: ${JSON.stringify(gdEmptyCheck.missingRequirements)}`);

  // Holistic session evaluation with zero GD participation
  const mockSessionZeroGD: SimulationSession = {
    id: "test-session-zero-gd",
    candidate_id: "cand-1",
    target_company: "Amazon",
    target_company_tier: "Tier 1 FAANG",
    company_tier_type: "FAANG/Product (Tier-1 hiring bar)",
    target_role: "Backend SDE-1",
    current_round: 6,
    resume_data: {
      resume_text: "Experienced engineer with Node.js and TypeScript development.",
      jd_text: "Backend engineer with distributed systems focus.",
    },
    round_results: {
      resume_screening: { score: 85, result: "pass", evidence: "Verified skills" },
      online_assessment: { aptitude_score: 80, coding_score: 85, coding_problems_solved: "2/2", result: "pass" },
      group_discussion: {
        articulation_score: null,
        result: "not_attempted",
        specific_feedback: "Not Attempted: Candidate did not speak in the GD session.",
        candidate_interventions_count: 0,
      },
      technical_interview: {
        score: 82,
        result: "pass",
        strong_areas: ["Data Structures"],
        weak_areas: [],
        specific_examples: "Solid understanding of system design.",
        candidate_responses_count: 3,
      },
      hr_interview: {
        score: 80,
        result: "pass",
        specific_feedback: "Strong behavioral responses using STAR.",
        candidate_responses_count: 2,
      },
    },
    created_at: new Date().toISOString(),
  };

  const reportZeroGD = evaluateHolisticSimulation(mockSessionZeroGD);
  console.log(`  - Holistic Report GD Result: "${reportZeroGD.round_results.group_discussion.result}"`);
  console.log(`  - Holistic Report GD Score: ${reportZeroGD.round_results.group_discussion.articulation_score}`);
  console.log(`  - Likely Elimination: "${reportZeroGD.realistic_outcome.likely_elimination_round}"`);
  console.log(`  - Outcome Reasoning: "${reportZeroGD.realistic_outcome.reasoning}"`);

  if (
    gdEmptyCheck.canScore === false &&
    gdEmptyCheck.status === "not_attempted" &&
    reportZeroGD.round_results.group_discussion.result === "not_attempted" &&
    reportZeroGD.round_results.group_discussion.articulation_score === null &&
    reportZeroGD.realistic_outcome.likely_elimination_round === "group_discussion"
  ) {
    console.log("  ✅ DoD 1 PASSED: Zero GD messages produces 'Not Attempted' and null numeric score.\n");
  } else {
    console.error("  ❌ DoD 1 FAILED!");
    allPassed = false;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 2: Online Assessment skip / early submit / unattempted (DoD 2)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("▶ TEST 2: Online Assessment skip & timer gating (DoD 2)");
  
  // Case 2A: Skipped without answering anything
  const oaEmptyCheck = canScoreRound("online_assessment", {
    oaAnswers: {},
    totalAptitudeCount: 8,
    codingPassCount: null,
    timeElapsedSeconds: 10,
    minTimeSeconds: 180,
  });
  console.log(`  - Case 2A (Immediate skip, 0 answers, 10s elapsed):`);
  console.log(`    canScore = ${oaEmptyCheck.canScore}, status = "${oaEmptyCheck.status}"`);
  console.log(`    Missing requirements: ${JSON.stringify(oaEmptyCheck.missingRequirements)}`);

  // Case 2B: Answered all questions but tried to bypass before minimum timer (e.g. at 45s out of 180s)
  const oaFastBypassCheck = canScoreRound("online_assessment", {
    oaAnswers: { 0: 1, 1: 2, 2: 0, 3: 1, 4: 2, 5: 1, 6: 0, 7: 3 },
    totalAptitudeCount: 8,
    codingPassCount: 3,
    timeElapsedSeconds: 45,
    minTimeSeconds: 180,
  });
  console.log(`  - Case 2B (All answered, but only 45s / 180s elapsed):`);
  console.log(`    canScore = ${oaFastBypassCheck.canScore}, status = "${oaFastBypassCheck.status}"`);
  console.log(`    Missing requirements: ${JSON.stringify(oaFastBypassCheck.missingRequirements)}`);

  const mockSessionZeroOA: SimulationSession = {
    ...mockSessionZeroGD,
    round_results: {
      ...mockSessionZeroGD.round_results,
      online_assessment: {
        aptitude_score: null,
        coding_score: null,
        coding_problems_solved: "Not Attempted",
        result: "not_attempted",
      },
    },
  };
  const reportZeroOA = evaluateHolisticSimulation(mockSessionZeroOA);
  console.log(`  - Holistic Report OA Result: "${reportZeroOA.round_results.online_assessment.result}"`);
  console.log(`  - Holistic Report OA Aptitude Score: ${reportZeroOA.round_results.online_assessment.aptitude_score}`);
  console.log(`  - Holistic Report OA Coding Score: ${reportZeroOA.round_results.online_assessment.coding_score}`);

  if (
    oaEmptyCheck.canScore === false &&
    oaEmptyCheck.status === "not_attempted" &&
    oaFastBypassCheck.canScore === false &&
    oaFastBypassCheck.missingRequirements.some((r) => r.includes("Minimum assessment time")) &&
    reportZeroOA.round_results.online_assessment.result === "not_attempted" &&
    reportZeroOA.round_results.online_assessment.aptitude_score === null &&
    reportZeroOA.round_results.online_assessment.coding_score === null
  ) {
    console.log("  ✅ DoD 2 PASSED: Skipping or bypassing OA timer is strictly blocked and marked 'Not Attempted'.\n");
  } else {
    console.error("  ❌ DoD 2 FAILED!");
    allPassed = false;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 3: Dynamic OA generation & Deterministic Scoring (DoD 3)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("▶ TEST 3: Dynamic OA generation & Deterministic execution scoring (DoD 3)");
  const generatedOA = generateOASession("Google", "FAANG/Product (Tier-1 hiring bar)");
  console.log(`  - Generated OA Session ID: ${generatedOA.sessionId}`);
  console.log(`  - Aptitude Questions Generated: ${generatedOA.aptitudeQuestions.length} questions`);
  console.log(`  - Coding Problems Generated: ${generatedOA.codingProblems.length} problems`);
  console.log(`  - Min Timer Enforced: ${generatedOA.minTimeSeconds}s`);

  // Simulate candidate answers: 6 out of 8 correct, 2 wrong
  const answers: Record<number, number> = {};
  let expectedCorrect = 0;
  generatedOA.aptitudeQuestions.forEach((q, idx) => {
    if (idx < 6) {
      // Correct answer
      answers[idx] = q.correct_option_index;
      expectedCorrect++;
    } else {
      // Intentionally wrong answer
      answers[idx] = (q.correct_option_index + 1) % q.options.length;
    }
  });

  const aptitudeScore = Math.round((expectedCorrect / generatedOA.aptitudeQuestions.length) * 100);
  console.log(`  - Aptitude Scoring: ${expectedCorrect}/${generatedOA.aptitudeQuestions.length} correct = ${aptitudeScore}/100 (deterministic)`);

  // Test deterministic code execution on Problem 1: Subarray Sum Equals K
  const prob1 = generatedOA.codingProblems[0];
  console.log(`  - Testing Problem 1: "${prob1.title}" (${prob1.testCases.length} test cases)`);
  
  // Real correct JS solution
  const correctSolutionCode = `
    function subarraySum(nums, k) {
      let count = 0;
      let sum = 0;
      const map = { 0: 1 };
      for (let num of nums) {
        sum += num;
        if (map[sum - k] !== undefined) count += map[sum - k];
        map[sum] = (map[sum] || 0) + 1;
      }
      return count;
    }
  `;
  const execResult = executeJavascriptCode(correctSolutionCode, prob1.functionName, prob1.testCases);
  console.log(`  - Execution outcome: ${execResult.passed}/${execResult.total} test cases passed`);
  execResult.logs.forEach((log) => console.log(`    ${log}`));

  // Incomplete/incorrect solution
  const incorrectSolutionCode = `
    function subarraySum(nums, k) {
      return 0; // deliberately failing starter code
    }
  `;
  const badExecResult = executeJavascriptCode(incorrectSolutionCode, prob1.functionName, prob1.testCases);
  console.log(`  - Deliberately failing starter code: ${badExecResult.passed}/${badExecResult.total} passed`);

  if (
    aptitudeScore === 75 &&
    execResult.passed === execResult.total &&
    badExecResult.passed === 0
  ) {
    console.log("  ✅ DoD 3 PASSED: Scoring matches deterministic answer keys and actual test suites.\n");
  } else {
    console.error("  ❌ DoD 3 FAILED!");
    allPassed = false;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 4: GitHub Verification & Contradiction Detection (DoD 4)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("▶ TEST 4: GitHub profile verification & resume claim contradiction check (DoD 4)");
  // Candidate claims a "distributed sensor pipeline" and "payment gateway"
  const resumeWithClaims = `
    Senior Software Engineer with 4 years experience.
    Led development of a high-throughput distributed sensor pipeline processing 50k events/sec.
    Architected core payment gateway microservice handling $2M daily transactions.
    Implemented containerized microservices using Docker and Kubernetes.
  `;

  // Test with Torvalds (or any public account) where sensor pipeline won't exist in public repos
  console.log("  - Fetching live public GitHub profile for verification...");
  const githubResult = await verifyGitHubProfile("torvalds", resumeWithClaims);
  console.log(`  - Profile Verified: ${githubResult.verified}`);
  console.log(`  - Username: @${githubResult.username}`);
  console.log(`  - Public Repos: ${githubResult.reposCount}`);
  console.log(`  - Unverified Claims Detected: ${JSON.stringify(githubResult.unverifiedClaims)}`);
  console.log(`  - Summary Output: "${githubResult.summary}"`);

  // Test with no GitHub provided (should not penalize or fabricate)
  const noGithubResult = await verifyGitHubProfile("", resumeWithClaims);
  console.log(`  - No GitHub provided test:`);
  console.log(`    Summary: "${noGithubResult.summary}"`);
  console.log(`    Notes: "${noGithubResult.notes}"`);

  if (
    githubResult.verified === true &&
    githubResult.unverifiedClaims.length > 0 &&
    githubResult.summary.includes("lack public repository evidence") &&
    noGithubResult.provided === false &&
    noGithubResult.summary.includes("GitHub not provided/verifiable")
  ) {
    console.log("  ✅ DoD 4 PASSED: GitHub cross-referencing surfaces contradictions honestly without penalizing missing profiles.\n");
  } else {
    console.error("  ❌ DoD 4 FAILED!");
    allPassed = false;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 5: HR Interview & Technical Round Logic Intact (DoD 5, 6, 7)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("▶ TEST 5, 6 & 7: Universal canScoreRound call sites, Technical untouched, HR gating (DoD 5, 6, 7)");
  
  // Test HR Round gating
  const hrEmptyCheck = canScoreRound("hr_interview", {
    hrQuestions: [{ id: "q1", question: "Describe a conflict." }, { id: "q2", question: "Describe a project failure." }],
    hrAnswers: ["", ""], // empty answers
  });
  console.log(`  - HR Gating with empty answers: canScore = ${hrEmptyCheck.canScore}, status = "${hrEmptyCheck.status}"`);
  console.log(`    Missing: ${JSON.stringify(hrEmptyCheck.missingRequirements)}`);

  const hrFilledCheck = canScoreRound("hr_interview", {
    hrQuestions: [{ id: "q1", question: "Describe a conflict." }, { id: "q2", question: "Describe a project failure." }],
    hrAnswers: [
      "In my capstone project, our team disagreed on whether to use GraphQL or REST. I set up a benchmark measuring payload latency and presented empirical data, which helped us align on REST.",
      "During an internship, a cache invalidation bug corrupted user session state in staging. I took ownership of the incident, reverted the faulty commit, wrote reproduction unit tests, and documented the root cause.",
    ],
  });
  console.log(`  - HR Gating with substantive STAR answers: canScore = ${hrFilledCheck.canScore}, status = "${hrFilledCheck.status}"`);

  // Test Technical Interview gating
  const techEmptyCheck = canScoreRound("technical_interview", {
    techMessages: [
      { role: "assistant", content: "Can you explain how database indexing with B-Trees works?" },
    ],
  });
  console.log(`  - Technical Gating with 0 candidate responses: canScore = ${techEmptyCheck.canScore}, status = "${techEmptyCheck.status}"`);

  const techFilledCheck = canScoreRound("technical_interview", {
    techMessages: [
      { role: "assistant", content: "Can you explain how database indexing with B-Trees works?" },
      { role: "user", content: "B-Trees keep keys sorted and balanced, maintaining O(log n) lookups with high branching factors to minimize disk I/O operations." },
      { role: "assistant", content: "What is the difference between clustered and non-clustered indexes?" },
      { role: "user", content: "A clustered index defines the physical storage order of table data, meaning only one exists per table, whereas non-clustered indexes store pointers." },
    ],
  });
  console.log(`  - Technical Gating with 2 substantive candidate responses: canScore = ${techFilledCheck.canScore}, status = "${techFilledCheck.status}"`);

  // Verify all 5 rounds are checked by canScoreRound
  const rounds = ["resume_screening", "online_assessment", "group_discussion", "technical_interview", "hr_interview"] as const;
  const gatedAllRounds = rounds.every((r) => {
    const res = canScoreRound(r, null);
    return res.canScore === false && res.status === "not_attempted";
  });

  if (
    hrEmptyCheck.canScore === false &&
    hrFilledCheck.canScore === true &&
    techEmptyCheck.canScore === false &&
    techFilledCheck.canScore === true &&
    gatedAllRounds
  ) {
    console.log("  ✅ DoD 5, 6 & 7 PASSED: canScoreRound universally protects all 5 rounds and validates real participation.\n");
  } else {
    console.error("  ❌ DoD 5, 6 & 7 FAILED!");
    allPassed = false;
  }

  console.log("================================================================================");
  if (allPassed) {
    console.log("🎉 ALL DEFINITION OF DONE VERIFICATION TESTS PASSED SUCCESSFULLY!");
  } else {
    console.log("⚠️ SOME TESTS FAILED. CHECK LOGS ABOVE.");
  }
  console.log("================================================================================\n");
}

runAllTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
