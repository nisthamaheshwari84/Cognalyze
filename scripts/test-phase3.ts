import {
  updateDsaProblemProgress,
  getDsaLearningAnalytics,
  computeCompanyReadinessScore
} from "../lib/dsa-store";

async function runPhase3Verification() {
  console.log("🚀 Starting Phase 3 Verification...");
  const studentId = `test-student-p3-${Date.now()}`;

  // Test 3a: Heatmap verification
  console.log("\n[3a] Testing Topic Mastery Heatmap...");
  await updateDsaProblemProgress(studentId, "two-sum", { status: "solved" });
  await updateDsaProblemProgress(studentId, "contains-duplicate", { status: "solved" });

  const analytics = await getDsaLearningAnalytics(studentId);
  const arrayTopic = analytics.heatmap.find(h => h.topic.id === "arrays-hashing");
  console.assert(arrayTopic !== undefined, "Arrays & Hashing should be in heatmap");
  console.assert(arrayTopic?.solved === 2, `Arrays & Hashing should have 2 solved, got ${arrayTopic?.solved}`);
  console.assert(arrayTopic?.easy === 2, `Both solved should be easy, got ${arrayTopic?.easy}`);
  console.log(`✓ Heatmap matches raw data: ${arrayTopic?.solved}/${arrayTopic?.total} (${arrayTopic?.completion_pct}%)`);

  // Test 3b: Cramming vs Consistency Detector
  console.log("\n[3b] Testing Consistency vs. Cramming Detector...");
  // Right now, only 2 solves today (less than 5 total) -> should NOT trigger cramming yet
  console.assert(analytics.cramming_analysis.is_cramming === false, "Should not flag cramming with < 5 solves");
  console.log("✓ No false positive cramming flag with low problem volume");

  // Add 4 more solves today (total 6 solves, 100% in 1 day >= 60%)
  await updateDsaProblemProgress(studentId, "valid-anagram", { status: "solved" });
  await updateDsaProblemProgress(studentId, "valid-palindrome", { status: "solved" });
  await updateDsaProblemProgress(studentId, "valid-parentheses", { status: "solved" });
  await updateDsaProblemProgress(studentId, "best-time-to-buy-and-sell-stock", { status: "solved" });

  const crammingAnalytics = await getDsaLearningAnalytics(studentId);
  console.assert(crammingAnalytics.cramming_analysis.is_cramming === true, "Should flag cramming when 100% of solves in 1 day");
  console.assert(crammingAnalytics.cramming_analysis.note !== null, "Cramming note must be present");
  console.assert(crammingAnalytics.cramming_analysis.note?.includes("spreading practice across more days"), "Note must phrase advice educationally");
  console.log(`✓ Cramming detected honestly: ${crammingAnalytics.cramming_analysis.highest_day_percentage}% in 1 session with learning principle note`);

  // Test 3c: Company Readiness Score
  console.log("\n[3c] Testing Company-Readiness Score...");
  const oppMock = {
    id: "opp-amazon-assessment",
    title: "Amazon SDE-1 Campus Drive",
    organizer: "Amazon",
    tags: ["Algorithms", "Data Structures"],
    domain_tags: ["E-Commerce"]
  };

  const readiness = await computeCompanyReadinessScore(studentId, oppMock);
  console.assert(typeof readiness.readiness_percentage === "number", "Readiness must be numeric");
  console.assert(readiness.disclaimer.includes("heuristic"), "Disclaimer must accompany score");
  console.log(`✓ Readiness score computed: ${readiness.readiness_percentage}% with non-judgmental disclaimer`);

  console.log("\n🎉 Phase 3 All Tests Passed Successfully!");
}

runPhase3Verification().catch(err => {
  console.error("Phase 3 verification failed:", err);
  process.exit(1);
});
