import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MASTER_PYTHON_CURRICULUM_PARTS,
  getAllPythonSubtopics,
  getPythonSubtopicById,
} from "../lib/skills/python-arena/python-curriculum-registry";
import {
  CURATED_PYTHON_QUESTIONS,
  queryCuratedQuestions,
  getCuratedQuestionById,
} from "../lib/skills/python-arena/python-question-bank";
import {
  executePythonChallenge,
  executeRawPythonScript,
} from "../lib/skills/python-arena/execution-engine";
import {
  recordPythonSubmission,
  recordSubtopicStudied,
  getCandidateSubmissions,
  getCandidatePythonProgress,
} from "../lib/skills/python-arena/submission-store";
import {
  getProgressiveHint,
  diagnoseCodeAttempt,
} from "../lib/skills/python-arena/python-mentor-service";
import {
  saveCustomQuestion,
  getCandidatePrivateQuestions,
  generateQuestionsFromPrompt,
} from "../lib/skills/python-arena/custom-question-service";
import {
  generatePythonRevisionNotes,
  getStudentRevisionNotes,
} from "../lib/skills/python-arena/notes-engine";

describe("Python Practice & Placement Arena: Master Acceptance Suite", () => {
  // ── 1. CURRICULUM ACCEPTANCE ──
  it("Curriculum: All 7 parts exist with independently navigable subtopics", () => {
    assert.equal(MASTER_PYTHON_CURRICULUM_PARTS.length, 7);
    const expectedPartIds = ["part_a", "part_b", "part_c", "part_d", "part_e", "part_f", "part_g"];
    for (const pid of expectedPartIds) {
      const part = MASTER_PYTHON_CURRICULUM_PARTS.find((p) => p.id === pid);
      assert.ok(part, `Missing curriculum part: ${pid}`);
      assert.ok(part.topics.length > 0, `Part ${pid} has no topics`);
    }

    const allSubtopics = getAllPythonSubtopics();
    assert.ok(allSubtopics.length >= 10, "Total subtopics should be at least 10");

    for (const sub of allSubtopics) {
      assert.ok(sub.id, "Subtopic must have an id");
      assert.ok(sub.title, "Subtopic must have a title");
      assert.ok(sub.definitions.length > 0, `${sub.id} must define key terms`);
      assert.ok(sub.syntaxBlueprint, `${sub.id} must have syntax blueprint`);
      assert.ok(sub.workedExamples.length > 0, `${sub.id} must have worked examples`);
      assert.ok(sub.commonMistakes.length > 0, `${sub.id} must have common mistakes`);
    }
  });

  // ── 2. QUESTION BANK ACCEPTANCE ──
  it("Question Bank: Questions have unique IDs, verified test cases, and authentic provenance", () => {
    assert.ok(CURATED_PYTHON_QUESTIONS.length >= 7, "Curated question bank must be populated");

    const ids = new Set<string>();
    for (const q of CURATED_PYTHON_QUESTIONS) {
      assert.ok(!ids.has(q.id), `Duplicate question ID detected: ${q.id}`);
      ids.add(q.id);

      assert.ok(q.title, "Question must have a title");
      assert.ok(q.problemStatement, "Question must have a problem statement");
      assert.ok(q.entryFunction, "Question must have an entry function");
      assert.ok(q.starterCode, "Question must have starter code");
      assert.ok(q.referenceSolution, "Question must have a reference solution");
      assert.ok(q.publicTestCases.length > 0, `${q.id} must have public test cases`);
      assert.ok(q.progressiveHints.length >= 3, `${q.id} must have at least 3 hints`);
      assert.ok(q.provenance.company, `${q.id} must have company provenance`);
    }

    // Filter verification
    const googleQuestions = queryCuratedQuestions({ company: "Google" });
    assert.ok(googleQuestions.length > 0);
    assert.equal(googleQuestions[0].provenance.company, "Google");
  });

  // ── 3. EXECUTION ACCURACY & HIDDEN TEST RUNNER ──
  it("Execution: Evaluates reference solution against hidden test cases without failure", async () => {
    const twoSum = getCuratedQuestionById("py-q-placements-01");
    assert.ok(twoSum);

    const allTests = [...twoSum.publicTestCases, ...twoSum.hiddenTestCases];
    const execRes = await executePythonChallenge(twoSum.referenceSolution, twoSum.entryFunction!, allTests);

    assert.equal(execRes.success, true);
    assert.equal(execRes.status, "passed");
    assert.equal(execRes.passedCount, allTests.length);
    assert.equal(execRes.totalCount, allTests.length);
    assert.equal(execRes.score, 100);

    // Verify hidden tests are properly masked
    const hiddenResults = execRes.testOutcomes?.filter((t) => t.isHidden);
    assert.ok(hiddenResults && hiddenResults.length > 0);
    for (const hr of hiddenResults) {
      assert.equal(hr.actual, "[Output Hidden - Verified Match]");
    }
  });

  // ── 4. SOCRATIC PROGRESSIVE HINTS & DIAGNOSIS ──
  it("AI Mentor: Hints progress from concept to solution without premature leaks", () => {
    const hint1 = getProgressiveHint("py-q-placements-01", 1);
    assert.equal(hint1.currentTier, 1);
    assert.equal(hint1.tierName, "Conceptual Framing");
    assert.ok(!hint1.hintContent.includes("def two_sum"), "Tier 1 must not leak solution code");

    const hint5 = getProgressiveHint("py-q-placements-01", 5);
    assert.equal(hint5.currentTier, 5);
    assert.equal(hint5.tierName, "Reference Solution");
    assert.ok(hint5.hintContent.includes("def two_sum"), "Tier 5 reveals reference solution");
  });

  it("AI Mentor: Correctly diagnoses runtime syntax error and mutable default traps", () => {
    const syntaxErrResult = {
      success: false,
      status: "syntax_error" as const,
      stdout: "",
      stderr: "SyntaxError: invalid syntax",
      executionTimeMs: 10,
    };
    const diag1 = diagnoseCodeAttempt("py-q-placements-01", "def broken():", syntaxErrResult);
    assert.equal(diag1.summary, "Syntax or Indentation Error Detected");

    const passingResult = {
      success: true,
      status: "passed" as const,
      stdout: "",
      stderr: "",
      executionTimeMs: 15,
      testPassed: true,
    };
    const codeWithMutableDefault = "def add_item(x, target=[]):\n    pass";
    const diag2 = diagnoseCodeAttempt("py-q-functions-01", codeWithMutableDefault, passingResult);
    assert.equal(diag2.summary, "Potential Mutable Default Argument Trap");
  });

  // ── 5. CUSTOM QUESTION CREATION & AI NATURAL LANGUAGE GENERATOR ──
  it("Custom Questions: Persists user-created questions and AI natural-language generated drills", () => {
    const candidateId = `cand_custom_${Date.now()}`;
    const custom = saveCustomQuestion(candidateId, {
      title: "My Custom Palindrome Checker",
      topicId: "top_py_strings_sequences",
      difficulty: "beginner",
      problemStatement: "Check if string is palindrome ignoring spaces.",
      constraints: ["1 <= len(s) <= 100"],
      examples: [{ input: "race car", output: "True", explanation: "Ignoring space yields racecar." }],
      entryFunction: "is_clean_palindrome",
      starterCode: "def is_clean_palindrome(s: str) -> bool:\n    pass\n",
      referenceSolution: "def is_clean_palindrome(s: str) -> bool:\n    c = s.replace(' ', '').lower()\n    return c == c[::-1]\n",
      publicTestCases: [{ id: "c-1", args: ["race car"], expected: true }],
      hiddenTestCases: [{ id: "c-2", args: ["hello"], expected: false, isHidden: true }],
      progressiveHints: ["Strip spaces first.", "Reverse the normalized string."],
    });

    assert.ok(custom.id.startsWith("cust_"));
    const list = getCandidatePrivateQuestions(candidateId);
    assert.equal(list.length, 1);
    assert.equal(list[0].title, "My Custom Palindrome Checker");

    // Natural Language Generator
    const gen = generateQuestionsFromPrompt(candidateId, "Create 3 intermediate Python questions on sliding window with hidden test cases");
    assert.equal(gen.count, 3);
    assert.ok(gen.summary.includes("Successfully generated 3"));

    const updatedList = getCandidatePrivateQuestions(candidateId);
    assert.equal(updatedList.length, 4);
  });

  // ── 6. REVISION NOTES ENGINE (3 MODES) ──
  it("Revision Notes: Generates all 3 document modes with professional printable HTML", () => {
    const candidateId = "cand_notes_tester";
    const subtopicId = "py-foundations-what-is-python";

    const doc1 = generatePythonRevisionNotes(candidateId, subtopicId, "quick_revision");
    assert.equal(doc1.mode, "quick_revision");
    assert.ok(doc1.htmlContent.includes("Core Invariant & Syntax"));

    const doc2 = generatePythonRevisionNotes(candidateId, subtopicId, "complete_engineering");
    assert.equal(doc2.mode, "complete_engineering");
    assert.ok(doc2.htmlContent.includes("Engineering Architecture & Runtime Mechanics"));

    const doc3 = generatePythonRevisionNotes(candidateId, subtopicId, "interview_cheatsheet");
    assert.equal(doc3.mode, "interview_cheatsheet");
    assert.ok(doc3.htmlContent.includes("Tier-1 Interview Gotchas"));

    const notesVault = getStudentRevisionNotes(candidateId);
    assert.equal(notesVault.length, 3);
  });

  // ── 7. STUDENT DNA PERSISTENCE & CROSS-USER ISOLATION ──
  it("Student DNA: Passing code submission creates verified evidence and preserves candidate isolation", async () => {
    const candidateA = `student_dna_A_${Date.now()}`;
    const candidateB = `student_dna_B_${Date.now()}`;

    const twoSum = getCuratedQuestionById("py-q-placements-01")!;
    const execSuccess = await executePythonChallenge(twoSum.referenceSolution, twoSum.entryFunction!, twoSum.publicTestCases);

    // Record submission for Candidate A
    const subRes = await recordPythonSubmission({
      candidateId: candidateA,
      questionId: twoSum.id,
      code: twoSum.referenceSolution,
      execResult: execSuccess,
      isAssisted: false,
      hintsUsedCount: 0,
    });

    assert.equal(subRes.dnaSyncSuccess, true);
    assert.ok(subRes.submission.id);

    // Record subtopic studied
    recordSubtopicStudied(candidateA, "py-foundations-what-is-python");

    const progressA = getCandidatePythonProgress(candidateA);
    assert.equal(progressA.totalQuestionsSolved, 1);
    assert.equal(progressA.solveRatePercent, 100);
    assert.equal(progressA.studiedSubtopicIds.length, 1);
    assert.equal(progressA.dnaEvidenceCount, 1);

    // Candidate B must remain pristine (Cross-User Isolation)
    const progressB = getCandidatePythonProgress(candidateB);
    assert.equal(progressB.totalQuestionsSolved, 0);
    assert.equal(progressB.totalQuestionsAttempted, 0);
    assert.equal(progressB.studiedSubtopicIds.length, 0);
  });
});

