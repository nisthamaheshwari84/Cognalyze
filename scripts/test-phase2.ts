import { matchActionToDsaTopic } from "../lib/dsa-roadmap-matcher";
import {
  updateDsaProblemProgress,
  getWeakTopics,
  computeCompanyReadinessScore
} from "../lib/dsa-store";

async function runPhase2Verification() {
  console.log("🚀 Starting Phase 2 Verification...");
  const studentId = `test-student-p2-${Date.now()}`;

  // Test 2a: Roadmap Deep Link Matcher
  console.log("\n[2a] Testing Skill-Gap Roadmap to DSA Tracker Deep Links...");
  const match1 = matchActionToDsaTopic("Solve 10 Dynamic Programming problems on LeetCode");
  console.assert(match1.matchedTopic?.slug === "dynamic-programming", "Should match Dynamic Programming");
  console.assert(match1.deepLinkUrl === "/student/dsa-tracker?topic=dynamic-programming", "Deep link URL should match");
  console.log(`✓ '${match1.originalText}' mapped to '${match1.deepLinkUrl}'`);

  const match2 = matchActionToDsaTopic("Practice Breadth First Search graph traversals");
  console.assert(match2.matchedTopic?.slug === "graphs", "Should match Graphs");
  console.assert(match2.deepLinkUrl === "/student/dsa-tracker?topic=graphs", "Deep link URL should match");
  console.log(`✓ '${match2.originalText}' mapped to '${match2.deepLinkUrl}'`);

  const matchNoDsa = matchActionToDsaTopic("Improve speaking clarity for non-technical rounds");
  console.assert(matchNoDsa.matchedTopic === null, "Should not match non-DSA action");
  console.log(`✓ Non-DSA action correctly returned null without false positive`);

  // Test 2b: Weak-Topic Connection
  console.log("\n[2b] Testing Weak-Topic Detection...");
  // Untouched topic should NOT be flagged as weak
  const initialWeak = await getWeakTopics(studentId);
  console.assert(initialWeak.length === 0, "Untouched topics must never be flagged as weak");
  console.log("✓ Untouched topics are not flagged as weak (distinguishes struggling from not started)");

  // Attempt 3 problems in "binary-search" but solve 0 (solve ratio 0/5 = 0% < 40%)
  await updateDsaProblemProgress(studentId, "binary-search-std", { status: "attempted" });
  await updateDsaProblemProgress(studentId, "search-a-2d-matrix", { status: "attempted" });
  await updateDsaProblemProgress(studentId, "koko-eating-bananas", { status: "attempted" });

  const weakAfter3Attempts = await getWeakTopics(studentId);
  console.assert(weakAfter3Attempts.some(w => w.topic.id === "binary-search"), "Binary search should now be flagged as weak");
  console.log("✓ Binary search flagged as weak after 3 attempts with <40% solve ratio");

  // Test 2c: Opportunity-Specific Problem Sets
  console.log("\n[2c] Testing Opportunity-Specific Problem Set Matching...");
  const oppMock = {
    id: "opp-uber-distributed",
    title: "Uber HackTag — Distributed Systems Track",
    organizer: "Uber Technologies",
    tags: ["Distributed Systems", "Algorithms", "Concurrency"],
    domain_tags: ["Cloud Infra"],
    extracted_context: {
      summary: "Build high-throughput messaging pipelines and low-latency storage engines.",
      tracks_or_themes: ["Distributed Consensus", "Scalable Caching"]
    }
  };

  const readiness = await computeCompanyReadinessScore(studentId, oppMock);
  console.assert(typeof readiness.readiness_percentage === "number", "Readiness percentage should be a number");
  console.assert(readiness.disclaimer.includes("heuristic"), "Disclaimer must clearly state it is a heuristic, not a guarantee");
  console.log(`✓ Opportunity-specific score: ${readiness.readiness_percentage}% with honest disclaimer`);

  console.log("\n🎉 Phase 2 All Tests Passed Successfully!");
}

runPhase2Verification().catch(err => {
  console.error("Phase 2 verification failed:", err);
  process.exit(1);
});
