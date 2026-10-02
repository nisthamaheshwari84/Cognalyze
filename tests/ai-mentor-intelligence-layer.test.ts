import { describe, it } from "node:test";
import assert from "node:assert";
import {
  getLearnerState,
  updateLearnerState,
  recordMisconception,
  recordMastery
} from "../lib/mentor/learner-model";
import {
  planTeachingTurn,
  generateTeachingResponse,
  isConfusionOrAltRequest,
  isDirectAnswerDemanded,
  KNOWN_MISCONCEPTIONS
} from "../lib/mentor/teaching-engine";
import {
  isBoundedUtilityRequest,
  handleInterviewQuery
} from "../lib/mentor/interview-engine";
import {
  getStudentMentorContext,
  getDeterministicMentorResponse,
  generateFirstPrinciplesReasoning,
  executeMentorTurn,
  classifyIntent
} from "../lib/mentor/ai-mentor-service";

describe("Cognalyze AI Mentor — Intelligence Layer & Learner Model", () => {
  // ─────────────────────────────────────────────────────────────
  // 1. REAL LEARNER MODEL PERSISTENCE & EVOLUTION
  // ─────────────────────────────────────────────────────────────
  describe("1. Real Learner Model (learnerState)", () => {
    it("maintains structured learner state with target role, weak concepts, and misconceptions", () => {
      const learner = getLearnerState("test-learner-1");
      assert.ok(learner.targetRole, "Must have targetRole");
      assert.ok(Array.isArray(learner.masteredConcepts), "Must track masteredConcepts");
      assert.ok(Array.isArray(learner.weakConcepts), "Must track weakConcepts");
      assert.ok(Array.isArray(learner.misconceptions), "Must track misconceptions");
      assert.ok(Array.isArray(learner.interviewReadinessSignals), "Must track interviewReadinessSignals");
    });

    it("records cognitive misconceptions and increments frequency upon repeated occurrences", () => {
      const studentId = "test-learner-misconception";
      recordMisconception(studentId, "Memory Pointers", "Assuming pointers automatically allocate heap space");
      const state1 = getLearnerState(studentId);
      const m1 = state1.misconceptions.find((m) => m.concept === "Memory Pointers");
      assert.ok(m1, "Must store misconception");
      assert.strictEqual(m1.frequency, 1);

      // Repeat observation
      recordMisconception(studentId, "Memory Pointers", "Assuming pointers automatically allocate heap space");
      const state2 = getLearnerState(studentId);
      const m2 = state2.misconceptions.find((m) => m.concept === "Memory Pointers");
      assert.strictEqual(m2?.frequency, 2);
    });

    it("promotes weak concepts to mastered upon verified independent recall", () => {
      const studentId = "test-learner-mastery";
      updateLearnerState(studentId, () => ({
        weakConcepts: ["Tree Traversals"],
        masteredConcepts: ["Arrays"]
      }));

      recordMastery(studentId, "Tree Traversals");
      const state = getLearnerState(studentId);
      assert.ok(state.masteredConcepts.includes("Tree Traversals"), "Must be in mastered");
      assert.ok(!state.weakConcepts.includes("Tree Traversals"), "Must be removed from weak");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. ADAPTIVE TEACHING ENGINE & STRATEGY SELECTION
  // ─────────────────────────────────────────────────────────────
  describe("2. Adaptive Teaching Engine & Dynamic Strategies", () => {
    it("detects direct answer demand and delivers first-principles answer without obstruction", () => {
      assert.strictEqual(isDirectAnswerDemanded("just tell me the answer"), true);
      assert.strictEqual(isDirectAnswerDemanded("stop asking questions, just explain it"), true);
      assert.strictEqual(isDirectAnswerDemanded("How does recursion work?"), false);

      const learner = getLearnerState("test-learner-direct");
      const plan = planTeachingTurn("just tell me the answer", learner);
      assert.strictEqual(plan.strategy, "DIRECT_EXPLANATION");

      const response = generateTeachingResponse("just tell me the answer", plan, learner);
      assert.ok(response.content.includes("The Direct Answer"), "Gives direct answer");
      assert.ok(response.content.includes("O(\\log n)"), "Includes complexity");
    });

    it("detects confusion and switches representation from code to real-world analogy", () => {
      assert.strictEqual(isConfusionOrAltRequest("I still don't understand"), true);
      assert.strictEqual(isConfusionOrAltRequest("explain another way without code"), true);

      const learner = getLearnerState("test-learner-analogy");
      // Set to analogy representation (1)
      const plan = planTeachingTurn("explain another way without code", learner);
      assert.strictEqual(plan.strategy, "ANALOGY_FIRST");

      const response = generateTeachingResponse("explain another way without code", plan, learner);
      assert.ok(response.content.includes("Russian") || response.content.includes("dictionary") || response.content.includes("doll"), "Uses analogy representation");
    });

    it("detects common cognitive misconceptions and corrects false premises first", () => {
      const learner = getLearnerState("test-learner-trap");
      const plan = planTeachingTurn("binary search is log n because sorting is logarithmic", learner);
      assert.ok(plan.misconceptionDetected, "Detects misconception");
      assert.strictEqual(plan.misconceptionDetected?.concept, "Binary Search");

      const response = generateTeachingResponse("binary search is log n because sorting is logarithmic", plan, learner);
      assert.ok(response.content.includes("Sorting takes $O(n \\log n)$") || response.content.includes("cuts the remaining search space"), "Corrects false premise");
    });

    it("renders ASCII visual stack frame when visual reasoning is selected", () => {
      const learner = getLearnerState("test-learner-visual");
      const plan = planTeachingTurn("show me a visual diagram of recursion", learner);
      assert.strictEqual(plan.strategy, "VISUAL_REASONING");

      const response = generateTeachingResponse("show me a visual diagram of recursion", plan, learner);
      assert.ok(response.content.includes("[ Call Stack Memory ]") || response.content.includes("factorial(1)"), "Contains visual ASCII stack diagram");
    });

    it("applies 5-step divergence protocol when student asks to debug custom code", () => {
      const learner = getLearnerState("test-learner-debug");
      const plan = planTeachingTurn("I have a weird bug in my custom function", learner);
      assert.strictEqual(plan.strategy, "DEBUG_WITH_ME");

      const response = generateTeachingResponse("I have a weird bug in my custom function", plan, learner);
      assert.ok(response.content.includes("5-step engineering debug protocol"), "Uses 5-step protocol");
      assert.ok(response.content.includes("Point of Divergence"), "Checks point of divergence");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. INTERVIEW INTELLIGENCE ENGINE & ANTI-CHATTER
  // ─────────────────────────────────────────────────────────────
  describe("3. Interview Intelligence Engine & Anti-Chatter", () => {
    it("satisfies Strict Anti-Chatter: gives exact 5 behavioral questions and stops without chatter", () => {
      const bounded = isBoundedUtilityRequest("Give me 5 behavioral questions");
      assert.strictEqual(bounded.isBounded, true);
      assert.strictEqual(bounded.type, "questions_list");
      assert.strictEqual(bounded.count, 5);

      const learner = getLearnerState("test-learner-interview");
      const turn = handleInterviewQuery("Give me 5 behavioral questions", learner);
      assert.ok(turn.content.includes("1. **Ownership & Initiative:**"));
      assert.ok(turn.content.includes("5. **Learning Under Pressure:**"));
      assert.ok(!turn.content.includes("Would you like 5 more?"), "Strictly avoids endless conversational chatter");
    });

    it("fixes student answer using STAR+R and leads with the conclusion in first 15 seconds", () => {
      const bounded = isBoundedUtilityRequest("Fix my answer: I worked on payment recovery and it was slow");
      assert.strictEqual(bounded.isBounded, true);
      assert.strictEqual(bounded.type, "fix_answer");

      const learner = getLearnerState("test-learner-fix");
      const turn = handleInterviewQuery("Fix my answer", learner);
      assert.ok(turn.content.includes("Conclusion (First 15s):"), "Teaches leading with conclusion");
      assert.ok(turn.content.includes("STAR+R"), "Uses STAR+R framework");
    });

    it("evaluates remote interview camera & posture setup with observable behaviors (no psychological pseudo-science)", () => {
      const bounded = isBoundedUtilityRequest("How should I sit during an interview and look less nervous on camera?");
      assert.strictEqual(bounded.isBounded, true);
      assert.strictEqual(bounded.type, "body_language");

      const learner = getLearnerState("test-learner-camera");
      const turn = handleInterviewQuery("How should I sit during an interview", learner);
      assert.ok(turn.content.includes("Camera Elevation & Eye-Line"), "Coaches camera elevation");
      assert.ok(turn.content.includes("Gaze Direction"), "Coaches gaze near webcam lens");
      assert.ok(!turn.content.includes("dishonest") && !turn.content.includes("lying"), "Never makes psychological claims");
    });

    it("trains graceful handling of uncertainty ('I don't know') without bluffing", () => {
      const bounded = isBoundedUtilityRequest("What should I do when I don't know the answer in an interview?");
      assert.strictEqual(bounded.isBounded, true);
      assert.strictEqual(bounded.type, "dont_know_coaching");

      const learner = getLearnerState("test-learner-uncertainty");
      const turn = handleInterviewQuery("I don't know the answer", learner);
      assert.ok(turn.content.includes("Acknowledge the Boundary Directly"), "Coaches acknowledging boundary");
      assert.ok(turn.content.includes("Anchor to Adjacent Demonstrable Knowledge"), "Coaches adjacent knowledge anchoring");
      assert.ok(turn.content.includes("Demonstrate First-Principles Reasoning"), "Coaches first principles reasoning");
    });

    it("provides progressive 4-tier hint ladder without dumping solution", () => {
      const learner = getLearnerState("test-learner-hint");
      const turn = handleInterviewQuery("Give me a hint for rotated sorted array", learner);
      assert.ok(turn.content.includes("Hint (Level 1 of 4: Conceptual Direction)"), "Provides progressive hint 1");
      assert.ok(turn.content.includes("arr[low] <= arr[mid]"), "Gives directional clue");
      assert.ok(!turn.content.includes("return mid"), "Does not dump full solution");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. ADVANCED / UNSEEN TECHNICAL QUESTIONS (SECTIONS 22 & 43)
  // ─────────────────────────────────────────────────────────────
  describe("4. Advanced / Unseen Technical Reasoning", () => {
    it("explains why caching can make a distributed application slower from first principles", () => {
      const context = getStudentMentorContext("student-demo");
      const turn = generateFirstPrinciplesReasoning(
        "Why can adding a cache sometimes make a distributed application slower?",
        context,
        "GENERAL_REASONING"
      );
      assert.ok(turn.content.includes("Cache Miss"), "Explains cache miss penalty");
      assert.ok(turn.content.includes("Serialization") || turn.content.includes("Network Round-Trip"), "Details serialization/network tax");
      assert.ok(turn.content.includes("Thundering Herd") || turn.content.includes("Stampede"), "Mentions cache stampede");
    });

    it("explains why adding more threads can reduce performance", () => {
      const context = getStudentMentorContext("student-demo");
      const turn = generateFirstPrinciplesReasoning(
        "Why does adding more threads sometimes reduce performance?",
        context,
        "GENERAL_REASONING"
      );
      assert.ok(turn.content.includes("Context-Switching") || turn.content.includes("context switch"), "Explains context switching tax");
      assert.ok(turn.content.includes("Amdahl's Law") || turn.content.includes("Lock Contention"), "Mentions lock contention or Amdahl");
    });

    it("explains why database indexes slow down write operations", () => {
      const context = getStudentMentorContext("student-demo");
      const turn = generateFirstPrinciplesReasoning(
        "Why can a database index make writes slower?",
        context,
        "GENERAL_REASONING"
      );
      assert.ok(turn.content.includes("B+ Tree") || turn.content.includes("Page Split"), "Explains B+ Tree page splits");
      assert.ok(turn.content.includes("Write Amplification") || turn.content.includes("WAL"), "Mentions write amplification");
    });

    it("explains why a model with lower training loss can perform worse", () => {
      const context = getStudentMentorContext("student-demo");
      const turn = generateFirstPrinciplesReasoning(
        "Why can a model with lower training loss perform worse?",
        context,
        "GENERAL_REASONING"
      );
      assert.ok(turn.content.includes("Overfitting") || turn.content.includes("High Variance"), "Explains overfitting");
      assert.ok(turn.content.includes("Distribution Shift") || turn.content.includes("Covariate Shift"), "Explains distribution shift");
    });

    it("explains distributed lock failure despite consensus (GC pause & fencing tokens)", () => {
      const context = getStudentMentorContext("student-demo");
      const turn = generateFirstPrinciplesReasoning(
        "Why does a distributed lock fail even though every node agrees it exists?",
        context,
        "GENERAL_REASONING"
      );
      assert.ok(turn.content.includes("Garbage Collection") || turn.content.includes("GC pause"), "Explains GC pause");
      assert.ok(turn.content.includes("Fencing Token") || turn.content.includes("token"), "Prescribes fencing tokens");
    });

    it("explains CAP theorem with both ELI5 paper-cup analogy and Senior Interview breakdown", () => {
      const context = getStudentMentorContext("student-demo");
      const eli5 = generateFirstPrinciplesReasoning("Explain CAP theorem like I'm five", context, "CONCEPT_EXPLANATION");
      assert.ok(eli5.content.includes("paper-cup phone") || eli5.content.includes("notebook"), "Uses ELI5 paper-cup phone analogy");

      const interview = generateFirstPrinciplesReasoning("Explain CAP theorem like I'm preparing for an interview", context, "CONCEPT_EXPLANATION");
      assert.ok(interview.content.includes("Linearizable") || interview.content.includes("Linearizability"), "Explains linearizability");
      assert.ok(interview.content.includes("PACELC"), "Explains PACELC theorem");
    });

    it("code-switches naturally to Hinglish when candidate asks in everyday Hinglish", () => {
      const context = getStudentMentorContext("student-demo");
      const turn = generateFirstPrinciplesReasoning("bhai recursion samjha de", context, "DSA_ALGORITHMS");
      assert.ok(turn.content.includes("Actually yahan problem") || turn.content.includes("stack pe"), "Responds in natural Hinglish");
      assert.ok(turn.content.includes("Base Case") && turn.content.includes("def count(n):"), "Keeps technical terms strictly in English");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. END-TO-END EXECUTION FLOW & PERSISTENCE
  // ─────────────────────────────────────────────────────────────
  describe("5. End-to-End Execution Flow (executeMentorTurn)", () => {
    it("handles bounded requests through executeMentorTurn without crashing", async () => {
      const turn = await executeMentorTurn("student-demo", "Give me 5 behavioral questions", "interview");
      assert.ok(turn.content.includes("1. **Ownership & Initiative:**"));
      assert.ok(turn.confidence && turn.confidence >= 0.90);
    });

    it("handles Socratic confusion in executeMentorTurn by switching pedagogical representations", async () => {
      const turn = await executeMentorTurn("student-demo", "I still don't understand, explain without code", "learn");
      assert.ok(turn.content.length > 50);
      assert.ok(turn.why.includes("Analogy") || turn.why.includes("representation") || turn.why.includes("Teaching"));
    });
  });
});
