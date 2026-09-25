import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveContextualReferences } from "../lib/mentor/reference-resolver";
import { analyzeStudentIntent } from "../lib/mentor/intent-engine";

describe("Cognalyze Mentor — Semantic Speech Understanding & Reference Resolution", () => {
  it("RESOLVES POLYSEMIC DOMAIN TERMS: linked-list pointer vs C++ pointer", () => {
    // 1. In Linked List context
    const linkedListRes = resolveContextualReferences("mujhe pointer wali cheez samajh nahi aa rahi", {
      activeTopic: "Linked List Reversal"
    });
    assert.ok(linkedListRes.resolvedReferences.length > 0);
    assert.strictEqual(linkedListRes.resolvedReferences[0].rawTerm, "pointer");
    assert.ok(linkedListRes.resolvedReferences[0].resolvedEntity.includes("linked-list node reference"));

    // 2. In C++ Memory context
    const cppRes = resolveContextualReferences("what does this pointer actually point to?", {
      activeTopic: "C++ Memory Management and Pointers"
    });
    assert.ok(cppRes.resolvedReferences.length > 0);
    assert.ok(cppRes.resolvedReferences[0].resolvedEntity.includes("C/C++ memory address pointer"));
  });

  it("RESOLVES DEICTIC AND SPATIAL PRONOUNS: 'is line me' resolves to suspect debugging line", () => {
    const debugRes = resolveContextualReferences("is line me error kyu aa raha hai?", {
      activeTopic: "API Debugging",
      surfaceState: {
        surfaceType: "code_debugging",
        title: "Debugging Workspace",
        debuggingWorkspace: {
          language: "typescript",
          codeSnippet: "function check() {\n  const x = null;\n  console.log(x.val);\n}",
          suspectLine: 3
        }
      }
    });

    assert.ok(debugRes.resolvedReferences.length > 0);
    assert.strictEqual(debugRes.resolvedReferences[0].entityType, "code_line");
    assert.ok(debugRes.resolvedReferences[0].resolvedEntity.includes("line 3"));
    assert.ok(debugRes.resolvedText.includes("line 3"));
  });

  it("RESOLVES DEICTIC ARROWS: 'isme ye arrow kyu ja raha hai' resolves to active data-flow edge", () => {
    const arrowRes = resolveContextualReferences("isme ye arrow kyu ja raha hai?", {
      activeTopic: "System Design",
      surfaceState: {
        surfaceType: "system_design",
        title: "System Design Canvas",
        systemDesignCanvas: {
          systemName: "TinyURL",
          scaleTier: "1M",
          trafficQps: 1000,
          activeComponents: [],
          dataFlowEdges: [{ from: "Load Balancer", to: "API Service", latencyMs: 5 }],
          activeSimulations: []
        }
      }
    });

    assert.ok(arrowRes.resolvedReferences.length > 0);
    assert.strictEqual(arrowRes.resolvedReferences[0].entityType, "visual_element");
    assert.ok(arrowRes.resolvedReferences[0].resolvedEntity.includes("Load Balancer to API Service"));
  });

  it("DETECTS THINKING OUT LOUD: pauses and contemplation are not treated as finished turns", () => {
    // Student thinking out loud with trailing contemplation
    const thinkingText = "Hmm... I think hashmap because we need constant lookup... actually wait, maybe sorting would work...";
    const intent = analyzeStudentIntent(thinkingText);

    assert.strictEqual(intent.isThinkingOutLoud, true);

    // Definite answer is NOT thinking out loud
    const definiteText = "We should use a hashmap to store frequency counts.";
    const definiteIntent = analyzeStudentIntent(definiteText);

    assert.strictEqual(definiteIntent.isThinkingOutLoud, false);
  });

  it("EXTRACTS STRUCTURED TASK TYPE WITHOUT MODE BUTTONS: classifies concept vs leetcode vs debug vs interview", () => {
    const t1 = analyzeStudentIntent("Explain recursion to me.");
    assert.strictEqual(t1.taskType, "concept_learning");

    const t2 = analyzeStudentIntent("Help me solve this LeetCode question.");
    assert.strictEqual(t2.taskType, "problem_solving");

    const t3 = analyzeStudentIntent("Why is this code giving the wrong output? My API is returning 500.");
    assert.strictEqual(t3.taskType, "debugging");

    const t4 = analyzeStudentIntent("Take my ML interview.");
    assert.strictEqual(t4.taskType, "interview_simulation");

    const t5 = analyzeStudentIntent("Let's design YouTube with 100k QPS.");
    assert.strictEqual(t5.taskType, "system_design");
  });

  it("EXTRACTS EXPLANATION DEPTH LEVELS: L0 intuition to L7 trade-offs", () => {
    const d0 = analyzeStudentIntent("Simple way mein samjhao, basic intuition kya hai?");
    assert.strictEqual(d0.depthLevel, "L0_intuition");

    const d4 = analyzeStudentIntent("Go into the technical detail and explain how it works under the hood.");
    assert.strictEqual(d4.depthLevel, "L4_technical_mechanism");

    const d5 = analyzeStudentIntent("What is the mathematical equation and formula for QKV attention?");
    assert.strictEqual(d5.depthLevel, "L5_math");

    const d6 = analyzeStudentIntent("Code dikhao, implementation kaise hogi?");
    assert.strictEqual(d6.depthLevel, "L6_implementation");

    const d7 = analyzeStudentIntent("Explain this from an interview perspective with trade-offs and edge cases.");
    assert.strictEqual(d7.depthLevel, "L7_tradeoffs");
  });
});
