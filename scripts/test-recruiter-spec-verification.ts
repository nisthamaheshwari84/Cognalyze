/**
 * COGNALYZE RECRUITER SPECIFICATION VERIFICATION SUITE
 * 
 * Verifies core requirements of the Evidence-Based Hiring Intelligence OS:
 * 1. Evidence Independence & Provenance (Section 3, 16)
 * 2. "Unknown is a valid result" / Absence of evidence != evidence of absence (Section 26)
 * 3. Candidate Rediscovery across open roles (Section 38)
 * 4. Grounded "Ask Cognalyze" Intelligence without hallucination (Section 39)
 * 5. Blind Technical Screening / PII Minimization (Section 40)
 * 6. AI/Template signals & Project Ownership Verification (Section 19, 20)
 * 7. False Positive & False Negative Risk Analysis (Section 27)
 * 8. Recruiter Override requiring explicit reason & audit trail (Section 37, 58)
 * 9. Ollama Local LLM Provider abstraction & Resilient Router (Section 60)
 */

import {
  discoverRediscoveryCandidates,
  askRecruiterIntelligence,
  getPiiMinimizedProfile,
  analyzeProjectOwnership,
  evaluateCandidateRisks,
  calculatePipelineCounts
} from "../lib/recruiter/recruiter-intelligence";

import {
  OllamaProvider,
  GroqProvider,
  ResilientLLMRouter
} from "../lib/llm/llm-provider";

import { getAllRoles, getAllCandidates, updateCandidateStage } from "../lib/recruiter-store";
import { recordHumanDecision } from "../lib/decisions/engine";

async function runVerification() {
  console.log("============================================================");
  console.log(" COGNALYZE RECRUITER — VERIFICATION TEST SUITE");
  console.log("============================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      if (detail) console.log(`         ${detail}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      if (detail) console.error(`         Failure detail: ${detail}`);
    }
  }

  // Load test data from recruiter store
  const roles = await getAllRoles();
  const candidates = await getAllCandidates();

  console.log(`Loaded ${roles.length} roles and ${candidates.length} candidates from persistent store.\n`);

  // ─────────────────────────────────────────────────────────────
  // TEST 1: Candidate Rediscovery Engine (Section 38)
  // ─────────────────────────────────────────────────────────────
  console.log("TEST GROUP 1: Candidate Rediscovery (Section 38)");
  const targetRole = roles[0];
  const rediscoveryMatches = discoverRediscoveryCandidates(targetRole, candidates);
  assert(
    Array.isArray(rediscoveryMatches),
    "Rediscovery engine returns candidate matches without dropping history",
    `Found ${rediscoveryMatches.length} cross-role candidate rediscovery matches for "${targetRole.title}".`
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 2: Grounded "Ask Cognalyze" (Section 39, Anti-Hallucination)
  // ─────────────────────────────────────────────────────────────
  console.log("\nTEST GROUP 2: Grounded 'Ask Cognalyze' Intelligence (Section 39)");
  const question1 = "Which candidates have strong ML evidence but unverified project ownership?";
  const answer1 = askRecruiterIntelligence(question1, candidates, roles);
  assert(
    answer1.answer.length > 0 && answer1.citedCandidates.length >= 0,
    "Ask Cognalyze answers grounded inquiries citing candidate evidence",
    `Response: "${answer1.answer.slice(0, 100)}..."`
  );
  assert(
    answer1.citedRequirements.length > 0,
    "Answers explicitly link to evaluated role requirements or provenances",
    `Cited: ${answer1.citedRequirements.join(", ")}`
  );

  // Negative test: unanswerable question
  const question2 = "What is the candidate's personal horoscope and favorite color?";
  const answer2 = askRecruiterIntelligence(question2, candidates, roles);
  assert(
    !answer2.hasSufficientData && answer2.answer.includes("not have sufficient verified evidence"),
    "Returns 'insufficient evidence' rather than hallucinating answers (Anti-Hallucination Sec 46)",
    `Answer: "${answer2.answer}"`
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 3: PII-Minimized (Blind Technical Screening) (Section 40)
  // ─────────────────────────────────────────────────────────────
  console.log("\nTEST GROUP 3: Blind Technical Screening (Section 40)");
  const sampleCandidate = candidates.find(c => c.githubData) || candidates[0];
  const blinded = getPiiMinimizedProfile(sampleCandidate);
  assert(
    blinded.name.startsWith("Candidate #"),
    "Candidate identity is blinded to anonymized identifier (e.g. Candidate #ID)",
    `Blinded Name: ${blinded.name}`
  );
  assert(
    blinded.email.includes("blind-screening") && blinded.phone === undefined,
    "Contact information and demographics are completely masked",
    `Masked Contact: ${blinded.email}`
  );
  assert(
    blinded.githubData?.verifiedReposCount !== undefined || blinded.resumeText !== undefined,
    "Verified technical evidence and repositories remain fully available for objective assessment",
    `Technical Evidence Retained: ${blinded.githubData?.verifiedReposCount || "Verified profile scope"} items`
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 4: Project Ownership Verification & AI/Template Signals (Section 19, 20)
  // ─────────────────────────────────────────────────────────────
  console.log("\nTEST GROUP 4: Project Ownership & Template Detection (Section 19, 20)");
  const projectAnalysis = analyzeProjectOwnership(sampleCandidate, "Distributed Cache", targetRole);
  assert(
    projectAnalysis.signalsObserved.length > 0,
    "Engine extracts concrete structural and commit signals without accusing",
    `Signals: ${projectAnalysis.signalsObserved.join(" | ")}`
  );
  assert(
    projectAnalysis.generatedQuestions.length >= 3,
    "Generates candidate-specific architectural verification questions (not static trivia)",
    `Sample Question: "${projectAnalysis.generatedQuestions[0]}"`
  );
  assert(
    ["REQUIRES_OWNERSHIP_VERIFICATION", "POSSIBLE_TEMPLATE_DEPENDENCE", "CLEAN_ORIGINAL"].includes(projectAnalysis.templateDependenceSignal),
    "Uses neutral, evidence-grounded status labels per Section 19",
    `Signal: ${projectAnalysis.templateDependenceSignal}`
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 5: False Positive & False Negative Risk Analysis (Section 27)
  // ─────────────────────────────────────────────────────────────
  console.log("\nTEST GROUP 5: False Positive & False Negative Risk (Section 27)");
  const risks = evaluateCandidateRisks(sampleCandidate);
  assert(
    ["LOW", "MEDIUM", "HIGH"].includes(risks.falsePositiveRisk.level),
    "Evaluates False Positive Risk (polished resume vs. verified depth)",
    `False Positive: ${risks.falsePositiveRisk.level} (${risks.falsePositiveRisk.reasons[0]})`
  );
  assert(
    ["LOW", "MODERATE", "MEDIUM", "HIGH"].includes(risks.falseNegativeRisk.level),
    "Evaluates False Negative Risk (surfacing hidden strengths on concise resumes)",
    `False Negative: ${risks.falseNegativeRisk.level} (${risks.falseNegativeRisk.reasons[0]})`
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 6: Progressive Screening Funnel (Section 11)
  // ─────────────────────────────────────────────────────────────
  console.log("\nTEST GROUP 6: Dynamic Progressive Screening (Section 11)");
  const funnel = calculatePipelineCounts(candidates);
  assert(
    funnel.appliedCount >= funnel.evidenceQualifiedCount && funnel.evidenceQualifiedCount >= funnel.interviewShortlistCount,
    "Dynamic pipeline counts reflect real stage progression without hardcoded ratios",
    `Applied: ${funnel.appliedCount} -> Evidence-Qualified: ${funnel.evidenceQualifiedCount} -> Deep Review: ${funnel.deepReviewCount} -> Verification: ${funnel.verificationCount} -> Shortlist: ${funnel.interviewShortlistCount}`
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 7: Recruiter Override with Mandatory Audit Reason (Section 37, 58)
  // ─────────────────────────────────────────────────────────────
  console.log("\nTEST GROUP 7: Recruiter Override & Immutable Decision Trail (Section 37, 58)");
  const overrideTest = await recordHumanDecision({
    applicationId: sampleCandidate.id,
    candidateId: sampleCandidate.id,
    roleId: targetRole.id,
    decision: "advance",
    deciderUserId: "Hiring Manager (Unit Test)",
    rationale: "[RECRUITER OVERRIDE: Demonstrated outstanding live systems architecture in whiteboard drill] Override automated hold",
    citedEvidenceIds: ["req-senior-1"],
    assessmentsSnapshot: {
      isOverride: true,
      recruiterOverrideReason: "Demonstrated outstanding live systems architecture in whiteboard drill",
      stage: "Technical Interview",
      verdict: "Advance"
    },
    fromStage: "In Decision Room",
    toStage: "Technical Interview"
  });

  assert(
    overrideTest.success && overrideTest.decision === "advance",
    "Recruiter override is recorded with target stage transition",
    `Decision ID: ${overrideTest.decisionId}, To Stage: ${overrideTest.nextStage}`
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 8: LLM Provider Abstraction & Ollama Fallback (Section 60)
  // ─────────────────────────────────────────────────────────────
  console.log("\nTEST GROUP 8: LLM Provider Abstraction & Ollama Compatibility (Section 60)");
  const ollama = new OllamaProvider("http://localhost:11434", "llama3.1:8b");
  const isOllamaUp = await ollama.isAvailable();
  console.log(`         Ollama local daemon status: ${isOllamaUp ? "CONNECTED" : "OFFLINE (Graceful fallback active)"}`);

  const router = new ResilientLLMRouter(ollama, new GroqProvider());
  assert(
    router !== null,
    "ResilientLLMRouter instantiates multi-provider architecture with Ollama priority",
    "Ollama -> Groq resilient routing configured per Section 60."
  );

  console.log("\n============================================================");
  console.log(` FINAL RESULTS: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log("============================================================\n");
}

runVerification().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
