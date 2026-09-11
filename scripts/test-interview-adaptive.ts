import { assessAnswer, generateNextQuestion, createSessionState, updateSessionState } from "../lib/ai/interview-engine";

async function runTests() {
  console.log("=== RUNNING MOCK INTERVIEW ADAPTIVE TESTS ===\n");

  // Test 1: Fast-path shallow answer
  console.log("--- Test 1: Extremely shallow answer ---");
  const state1 = createSessionState("fresher");
  const shallowAssessment = await assessAnswer(
    "Can you explain how you designed the database schema for your e-commerce project?",
    "uh, I just used React and Mongo.",
    state1,
    "Candidate Resume: Built full stack e-commerce app with MongoDB and Node.js.",
    "Target JD: Software Development Engineer"
  );
  console.log("Assessment quality:", shallowAssessment.answer_quality);
  console.log("Next action:", shallowAssessment.next_action);
  console.log("Reasoning:", shallowAssessment.reasoning);

  if (shallowAssessment.next_action !== "follow_up_probe") {
    console.error("FAIL: Shallow answer should trigger follow_up_probe!");
    process.exit(1);
  }
  console.log("✓ Test 1 Passed: Shallow answer correctly triggers follow-up probe!\n");

  // Test 2: Update session state
  console.log("--- Test 2: Session state transition ---");
  const updatedState = updateSessionState(state1, shallowAssessment);
  console.log("Updated distribution:", updatedState.answer_distribution);
  console.log("Consecutive shallow count:", updatedState.consecutive_shallow);
  if (updatedState.consecutive_shallow !== 1 || updatedState.answer_distribution.shallow !== 1) {
    console.error("FAIL: Session state not updated properly!");
    process.exit(1);
  }
  console.log("✓ Test 2 Passed: Session state transitions correctly!\n");

  // Test 3: Experience modes
  console.log("--- Test 3: Experience mode differentiation ---");
  const fresherState = createSessionState("fresher");
  const switcherState = createSessionState("career-switcher");
  const expState = createSessionState("experienced");

  console.log("Fresher initial difficulty:", fresherState.current_difficulty);
  console.log("Career-switcher initial difficulty:", switcherState.current_difficulty);
  console.log("Experienced initial difficulty:", expState.current_difficulty);

  if (fresherState.current_difficulty !== "easy" || expState.current_difficulty !== "medium") {
    console.error("FAIL: Initial difficulty calibration mismatch!");
    process.exit(1);
  }
  console.log("✓ Test 3 Passed: Experience modes calibrate difficulty baselines correctly!\n");

  console.log("=== ALL ADAPTIVE ENGINE TESTS PASSED ===");
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
