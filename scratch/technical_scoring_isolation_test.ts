import { POST } from "../app/api/interview-score/route";
import { evaluateCandidateConduct } from "../lib/interview/conduct-engine";
import {
  generateInterviewFinalReport,
  buildCandidateInterviewDossier,
  generateInterviewBlueprint,
  createAdvancedSessionState
} from "../lib/ai/interview-engine";

async function runTechnicalScoringIsolationVerification() {
  console.log("=== PART A6: TECHNICAL SCORING ISOLATION VERIFICATION ===\n");

  const results: Array<{ test: string; status: "PASS" | "FAIL"; details: string }> = [];

  // Scenario 1: Conduct directive turns to /api/interview-score must return isConductTurn: true, provisional: true, overall: 0
  const scoreReq1 = new Request("http://localhost:3000/api/interview-score", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "assistant", content: "Tell me about yourself." },
        { role: "user", content: "I am a backend engineer." },
        { role: "assistant", content: "Notice: Cognalyze conducts technical interviews in accordance with professional engineering standards. Inappropriate, offensive, or demeaning language is not permitted." },
        { role: "user", content: "Understood, I apologize." }
      ],
      studentId: "cand_iso_1"
    })
  });

  const res1 = await POST(scoreReq1);
  const data1 = await res1.json();

  const s1Passed = data1.isConductTurn === true && data1.provisional === true;
  results.push({
    test: "A6.1: /api/interview-score bypasses conduct directive turns without penalty",
    status: s1Passed ? "PASS" : "FAIL",
    details: `isConductTurn=${data1.isConductTurn}, provisional=${data1.provisional}, overall=${data1.overall}`
  });

  // Scenario 2: Technical mistake (wrong complexity) must NEVER trigger conduct warning
  const techMistake = "QuickSort worst-case time complexity is O(1) constant time because it splits in half.";
  const conductMistakeEval = evaluateCandidateConduct(techMistake, "NORMAL", 1);
  const s2Passed = conductMistakeEval.isMisconduct === false && conductMistakeEval.newState === "NORMAL";
  results.push({
    test: "A6.2: Technical mistake / incorrect answer never triggers conduct warnings",
    status: s2Passed ? "PASS" : "FAIL",
    details: `isMisconduct=${conductMistakeEval.isMisconduct}, newState=${conductMistakeEval.newState}, type=${conductMistakeEval.type}`
  });

  // Scenario 3: Termination event in session does not artificially reduce previously demonstrated technical scores
  const dossier = await buildCandidateInterviewDossier("cand_iso_3", "Go dev", "Cloud SWE");
  const blueprint = generateInterviewBlueprint(dossier, "Cloud Software Engineer", 45);
  const sessionState = createAdvancedSessionState(blueprint, dossier);

  // Turn 1: Strong technical answer (score: 95)
  sessionState.turns.push({
    turnIndex: 1,
    question: {
      question: "Explain Goroutines and how the Go runtime scheduler (GMP model) works.",
      question_targets: "Concurrency & Runtime Scheduler",
      question_type: "technical",
      difficulty_level: "hard",
      is_follow_up: false,
      section: "coding_system_design",
    },
    answer: "Go uses the GMP model: G is goroutine, M is OS thread, P is logical processor. It uses work-stealing and network poller with epoll.",
    assessment: {
      answer_quality: "strong",
      reasoning: "Deep understanding of Go runtime scheduler.",
      topics_demonstrated: ["Go", "Concurrency", "GMP Scheduler"],
      next_action: "move_to_new_topic",
      difficulty_adjustment: "maintain"
    },
    rubricScore: 95,
    timestamp: new Date().toISOString()
  });

  // Turn 2: Abusive termination
  sessionState.conductState = "TERMINATED";
  sessionState.conductIncidents = [{
    id: "inc_iso",
    timestamp: new Date().toISOString(),
    turnIndex: 2,
    type: "HOSTILE_ABUSE",
    severity: "critical",
    candidateInput: "shut up",
    matchedTokens: ["shut up"],
    language: "en",
    confidence: 0.95,
    previousState: "FINAL_WARNING",
    newState: "TERMINATED",
    escalationReason: "Repeated misconduct."
  }];

  const report = await generateInterviewFinalReport(sessionState, [], dossier);

  // The technical score on Turn 1 should remain intact (not docked to 0 for conduct)
  const s3Passed = report.technicalDepth.score >= 80 && report.conductState === "TERMINATED";
  results.push({
    test: "A6.3: Demonstrated technical scores remain isolated from behavioral termination",
    status: s3Passed ? "PASS" : "FAIL",
    details: `technicalDepth=${report.technicalDepth.score}, conductState=${report.conductState}`
  });

  console.log("=== TECHNICAL SCORING ISOLATION TEST RESULTS ===");
  for (const r of results) {
    console.log(`[${r.status}] ${r.test}`);
    console.log(`      Details: ${r.details}`);
  }
}

runTechnicalScoringIsolationVerification().catch(console.error);

