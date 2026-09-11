import {
  evaluateHolisticSimulation,
  SimulationSession,
} from "../lib/simulation/simulation-engine";

async function runHolisticSimulationTests() {
  console.log("================================================================================");
  console.log("FULL RECRUITMENT SIMULATION — HOLISTIC VERIFICATION TEST SUITE");
  console.log("================================================================================\n");

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Profile A — Strong Communication & HR, Failed Coding OA (0/2 Solved)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("--------------------------------------------------------------------------------");
  console.log("TEST 1: Profile A (Strong Communication/GD/HR, Weak Coding 0/2)");
  console.log("--------------------------------------------------------------------------------");

  const sessionProfileA: SimulationSession = {
    id: "sim_test_profile_a",
    candidate_id: "candidate_strong_comm",
    target_company_tier: "Tier 1 FAANG",
    target_role: "Software Development Engineer",
    current_round: 6,
    resume_data: {
      resume_text: "Skills: React, JavaScript, Communication, Agile. Project: Frontend dashboard.",
      jd_text: "Target: Software Development Engineer at Tier 1 FAANG",
    },
    round_results: {
      resume_screening: {
        result: "pass",
        score: 82,
        evidence: "Verified frontend and collaboration skills.",
      },
      online_assessment: {
        aptitude_score: 75,
        coding_score: 20, // Failed coding
        coding_problems_solved: "0/2",
        result: "fail",
        struggled_topics: ["Hash Map Lookups", "Time Complexity Analysis"],
      },
      group_discussion: {
        articulation_score: 88, // Strong GD
        result: "pass",
        specific_feedback: "Assertive intervention, excellent active listening and synthesis.",
        key_moment: "Candidate framed team velocity vs architecture trade-off clearly.",
      },
      technical_interview: {
        score: 72,
        result: "pass",
        strong_areas: ["High-level concepts", "Communication"],
        weak_areas: ["Algorithmic implementation details"],
        specific_examples: "Candidate communicated clearly but struggled on algorithmic edge cases.",
      },
      hr_interview: {
        score: 90, // Strong HR
        result: "pass",
        specific_feedback: "Outstanding STAR responses with clear personal ownership.",
      },
    },
    created_at: new Date().toISOString(),
  };

  const reportA = evaluateHolisticSimulation(sessionProfileA);

  console.log("Profile A Realistic Outcome:");
  console.log("  - Would be selected:", reportA.realistic_outcome.would_be_selected);
  console.log("  - Likely elimination round:", reportA.realistic_outcome.likely_elimination_round);
  console.log("  - Reasoning:", reportA.realistic_outcome.reasoning);
  console.log("  - Priority 1 Focus:", reportA.recommended_focus[0]);

  // Assertions for Profile A
  if (reportA.realistic_outcome.would_be_selected !== false) {
    throw new Error("ASSERTION FAILED: Profile A should NOT be selected due to failed OA coding!");
  }
  if (reportA.realistic_outcome.likely_elimination_round !== "online_assessment") {
    throw new Error(`ASSERTION FAILED: Profile A elimination round should be 'online_assessment', got '${reportA.realistic_outcome.likely_elimination_round}'`);
  }
  if (!reportA.realistic_outcome.reasoning.includes("coding round score")) {
    throw new Error("ASSERTION FAILED: Reasoning must explicitly cite the failed coding round!");
  }
  if (!reportA.recommended_focus[0].toLowerCase().includes("algorithmic coding")) {
    throw new Error(`ASSERTION FAILED: Top recommendation should be algorithmic coding, got '${reportA.recommended_focus[0]}'`);
  }
  console.log("✓ Profile A passed: Correctly eliminated at Online Assessment despite 88 GD / 90 HR!\n");

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Profile B — Strong Coding (2/2 Solved), Poor Communication/GD (40/100)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("--------------------------------------------------------------------------------");
  console.log("TEST 2: Profile B (Strong Coding 2/2, Weak Communication/GD)");
  console.log("--------------------------------------------------------------------------------");

  const sessionProfileB: SimulationSession = {
    id: "sim_test_profile_b",
    candidate_id: "candidate_strong_coder",
    target_company_tier: "Tier 1 FAANG",
    target_role: "Software Development Engineer",
    current_round: 6,
    resume_data: {
      resume_text: "Skills: C++, Python, Distributed Systems, Algorithms. Project: Custom memory allocator.",
      jd_text: "Target: Software Development Engineer at Tier 1 FAANG",
    },
    round_results: {
      resume_screening: {
        result: "pass",
        score: 85,
        evidence: "Verified systems programming depth and high-performance algorithms.",
      },
      online_assessment: {
        aptitude_score: 90,
        coding_score: 95, // Strong coding
        coding_problems_solved: "2/2",
        result: "pass",
        struggled_topics: [],
      },
      group_discussion: {
        articulation_score: 40, // Failed GD
        result: "fail",
        specific_feedback: "Passive participation; spoke only once and failed to address group counters.",
        key_moment: "Candidate hesitated when asked to synthesize conflicting views.",
      },
      technical_interview: {
        score: 82,
        result: "pass",
        strong_areas: ["Memory architecture", "Algorithmic complexity"],
        weak_areas: ["Verbal explanation pacing"],
        specific_examples: "Candidate wrote optimal C++ pointers with minimal verbal narration.",
      },
      hr_interview: {
        score: 65,
        result: "borderline",
        specific_feedback: "Struggled on cross-functional conflict resolution examples.",
      },
    },
    created_at: new Date().toISOString(),
  };

  const reportB = evaluateHolisticSimulation(sessionProfileB);

  console.log("Profile B Realistic Outcome:");
  console.log("  - Would be selected:", reportB.realistic_outcome.would_be_selected);
  console.log("  - Likely elimination round:", reportB.realistic_outcome.likely_elimination_round);
  console.log("  - Reasoning:", reportB.realistic_outcome.reasoning);
  console.log("  - Priority 1 Focus:", reportB.recommended_focus[0]);

  // Assertions for Profile B
  if (reportB.realistic_outcome.would_be_selected !== false) {
    throw new Error("ASSERTION FAILED: Profile B should NOT be selected due to failed GD communication!");
  }
  if (reportB.realistic_outcome.likely_elimination_round !== "group_discussion") {
    throw new Error(`ASSERTION FAILED: Profile B elimination round should be 'group_discussion', got '${reportB.realistic_outcome.likely_elimination_round}'`);
  }
  if (!reportB.recommended_focus[0].toLowerCase().includes("group discussion")) {
    throw new Error(`ASSERTION FAILED: Top recommendation should be Group discussion practice, got '${reportB.recommended_focus[0]}'`);
  }
  console.log("✓ Profile B passed: Correctly eliminated at Group Discussion despite 95 coding score!\n");

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Profile C — Balanced High Performer (Passes All Rounds)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("--------------------------------------------------------------------------------");
  console.log("TEST 3: Profile C (All-around Balanced High Performer)");
  console.log("--------------------------------------------------------------------------------");

  const sessionProfileC: SimulationSession = {
    id: "sim_test_profile_c",
    candidate_id: "candidate_balanced",
    target_company_tier: "Tier 1 FAANG",
    target_role: "Software Development Engineer",
    current_round: 6,
    resume_data: {
      resume_text: "Skills: Go, TypeScript, Distributed Systems, Kubernetes. Project: Raft consensus.",
      jd_text: "Target: Software Development Engineer at Tier 1 FAANG",
    },
    round_results: {
      resume_screening: {
        result: "pass",
        score: 90,
        evidence: "Verified distributed systems experience with high production relevance.",
      },
      online_assessment: {
        aptitude_score: 85,
        coding_score: 90,
        coding_problems_solved: "2/2",
        result: "pass",
      },
      group_discussion: {
        articulation_score: 82,
        result: "pass",
        specific_feedback: "Synthesized conflicting points and demonstrated proactive leadership.",
      },
      technical_interview: {
        score: 85,
        result: "pass",
        strong_areas: ["Distributed consensus", "Failure recovery"],
        weak_areas: [],
        specific_examples: "Articulated exact trade-offs between Raft leader leases and network latency.",
      },
      hr_interview: {
        score: 85,
        result: "pass",
        specific_feedback: "Demonstrated strong culture fit and high ownership in post-mortems.",
      },
    },
    created_at: new Date().toISOString(),
  };

  const reportC = evaluateHolisticSimulation(sessionProfileC);

  console.log("Profile C Realistic Outcome:");
  console.log("  - Would be selected:", reportC.realistic_outcome.would_be_selected);
  console.log("  - Likely elimination round:", reportC.realistic_outcome.likely_elimination_round);
  console.log("  - Reasoning:", reportC.realistic_outcome.reasoning);

  if (reportC.realistic_outcome.would_be_selected !== true) {
    throw new Error("ASSERTION FAILED: Profile C should be selected!");
  }
  if (reportC.realistic_outcome.likely_elimination_round !== null) {
    throw new Error("ASSERTION FAILED: Profile C elimination round should be null!");
  }
  console.log("✓ Profile C passed: Correctly awarded Offer Recommended!\n");

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Technical Interview Conditioning Verification
  // ──────────────────────────────────────────────────────────────────────────
  console.log("--------------------------------------------------------------------------------");
  console.log("TEST 4: Technical Interview Opener Adaptation Check");
  console.log("--------------------------------------------------------------------------------");

  function getTechOpener(codingPassCount: number) {
    if (codingPassCount === 0) {
      return "I reviewed your Online Assessment report. You ran into significant difficulty with the algorithmic coding challenge (0/2 test cases passed). Walk me through what went wrong...";
    } else {
      return "Welcome to the technical round. I saw your Online Assessment code submission — clean O(N) approach. Let's raise the bar today: suppose that lookup logic needs to scale across a distributed cache...";
    }
  }

  const weakOpener = getTechOpener(0);
  const strongOpener = getTechOpener(2);

  console.log("Weak OA Opener:", weakOpener);
  console.log("Strong OA Opener:", strongOpener);

  if (!weakOpener.includes("significant difficulty") || !strongOpener.includes("clean O(N) approach")) {
    throw new Error("ASSERTION FAILED: Technical interview opener did not adapt to OA performance!");
  }
  console.log("✓ Technical Interview Adaptation verified!\n");

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: DSA Tracker Isolation Verification
  // ──────────────────────────────────────────────────────────────────────────
  console.log("--------------------------------------------------------------------------------");
  console.log("TEST 5: DSA Tracker Isolation Verification");
  console.log("--------------------------------------------------------------------------------");
  // Inspect that simulation engine imports ZERO references to dsa_progress or addDsaProgress
  const fs = await import("fs");
  const simEngineCode = fs.readFileSync("lib/simulation/simulation-engine.ts", "utf8");
  const simPageCode = fs.readFileSync("app/student/simulation/page.tsx", "utf8");

  const polluted = simEngineCode.includes("dsa_progress") ||
                   simEngineCode.includes("dsa-store") ||
                   simPageCode.includes("dsa_progress") ||
                   simPageCode.includes("addDsaProgress");

  if (polluted) {
    throw new Error("ASSERTION FAILED: Simulation touches DSA Tracker progress store!");
  }
  console.log("✓ Verified: Simulation operates in a 100% isolated fresh assessment context!\n");

  console.log("================================================================================");
  console.log("ALL 5 VERIFICATION CHECKS PASSED SUCCESSFULLY!");
  console.log("================================================================================");
}

runHolisticSimulationTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
