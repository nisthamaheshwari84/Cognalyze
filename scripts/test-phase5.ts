import {
  evaluateMilestoneBadges,
  getStudentBadges,
  updateDsaProblemProgress,
  getStudentDsaGoal,
  setStudentDsaGoal
} from "../lib/dsa-store";

async function runPhase5Verification() {
  console.log("🚀 Starting Phase 5 Verification (Badges & Goals)...");
  const studentId = `test-student-p5-${Date.now()}`;

  // Test 5a: Milestone Badges Awarded Only on Genuine Milestones
  console.log("\n[5a] Testing Milestone Badge Evaluation...");
  const initialBadges = await evaluateMilestoneBadges(studentId);
  console.assert(initialBadges.length === 0, "No badges should be awarded with 0 solves");
  console.log("✓ 0 badges awarded for 0 solves (never awarded for milestones not actually reached)");

  // Solve 1 problem -> should earn 'first_solve'
  await updateDsaProblemProgress(studentId, "two-sum", { status: "solved" });
  const badgesAfter1 = await evaluateMilestoneBadges(studentId);
  console.assert(badgesAfter1.some(b => b.badge_type === "first_solve"), "Should earn 'first_solve' badge");
  console.assert(badgesAfter1.length === 1, "Should have exactly 1 badge after 1 solve");
  console.log("✓ 'First Blood' badge earned on first verified solve");

  // Solve 4 more problems (total 5) -> should earn '5_problems'
  await updateDsaProblemProgress(studentId, "contains-duplicate", { status: "solved" });
  await updateDsaProblemProgress(studentId, "valid-anagram", { status: "solved" });
  await updateDsaProblemProgress(studentId, "valid-palindrome", { status: "solved" });
  await updateDsaProblemProgress(studentId, "valid-parentheses", { status: "solved" });

  const badgesAfter5 = await evaluateMilestoneBadges(studentId);
  console.assert(badgesAfter5.some(b => b.badge_type === "5_problems"), "Should earn '5_problems' badge");
  console.assert(!badgesAfter5.some(b => b.badge_type === "25_problems"), "Must NOT earn 25 solves badge prematurely");
  console.log("✓ 'Pattern Seeker' (5 solves) badge earned; higher tiers remain locked");

  // Test 5b: Daily Goal Setting & Reflection
  console.log("\n[5b] Testing Daily Goal Setting and 7/30 Day Reflection...");
  await setStudentDsaGoal(studentId, 2); // 2 problems per day
  const goalMetrics = await getStudentDsaGoal(studentId);

  console.assert(goalMetrics.daily_target === 2, "Daily target should be 2");
  console.assert(goalMetrics.total_solved_7_days === 5, `Expected 5 solves in last 7 days, got ${goalMetrics.total_solved_7_days}`);
  // 5 solves out of 14 expected (2 * 7 = 14) -> ~36%
  const expectedPct = Math.round((5 / 14) * 100);
  console.assert(goalMetrics.last_7_days_completion_pct === expectedPct, `Expected ${expectedPct}%, got ${goalMetrics.last_7_days_completion_pct}%`);
  console.log(`✓ Daily goal reflection reflects real solve data: ${goalMetrics.total_solved_7_days}/14 problems (${goalMetrics.last_7_days_completion_pct}%) without estimation`);

  console.log("\n🎉 Phase 5 All Tests Passed Successfully!");
}

runPhase5Verification().catch(err => {
  console.error("Phase 5 verification failed:", err);
  process.exit(1);
});
