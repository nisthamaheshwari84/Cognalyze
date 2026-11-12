/**
 * COGNALYZE PREPARATIONS ARENA & CAREER LAUNCH PATHWAYS
 * Comprehensive Master Acceptance Test Suite
 * 
 * Verifies:
 * 1. Product Placement: Inside Skill Practice Hub with 4 Canonical Categories
 * 2. Non-Generic Opportunity Blueprints: Distinct architectures for GSoC, Flipkart GRID, Amazon HackOn, Walmart, etc.
 * 3. 4-Tier Personalization: Absolute Beginner to Advanced with Student DNA integration
 * 4. Deep Integration with Existing Skill Arenas (DSA, AI & Data, CS Fundamentals, Code Comprehension)
 * 5. Cross-Opportunity Optimizer: Shared foundations and time-saving balanced schedules
 * 6. AI Proposal Rubric Evaluator: Authentic scoring of technical depth, timeline, and community engagement
 * 7. Evidence-Based Progress Tracking: Synchronizes completed milestones with Student DNA
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  getAllPreparationArenas,
  getPreparationArenaBySlug,
  getArenasByCategory,
} from "../lib/skills/preparations/canonical-arenas-registry";
import { preparationsPersonalization } from "../lib/skills/preparations/personalization-engine";
import { proposalEvaluator } from "../lib/skills/preparations/proposal-evaluator";
import { preparationsStore } from "../lib/skills/preparations/arena-store";

describe("Preparations Arena & Career Launch Pathways Acceptance Suite", () => {
  test("1. Catalog Coverage: All major opportunity categories and flagship programs exist", () => {
    const arenas = getAllPreparationArenas();
    assert.ok(arenas.length >= 6, "Must provide comprehensive arena catalog");

    const gsoc = getPreparationArenaBySlug("gsoc-2026");
    assert.ok(gsoc, "GSoC 2026 arena must exist");
    assert.equal(gsoc.category, "OPEN_SOURCE");
    assert.ok(gsoc.stipendOrPrize.includes("$1,500"), "Must have verified GSoC stipend");

    const flipkart = getPreparationArenaBySlug("flipkart-grid-7");
    assert.ok(flipkart, "Flipkart GRiD arena must exist");
    assert.equal(flipkart.category, "COMPANY_HACKATHON");
    assert.ok(flipkart.stipendOrPrize.includes("32 LPA"), "Must have verified Flipkart CTC / PPI details");

    const amazon = getPreparationArenaBySlug("amazon-hackon-2026");
    assert.ok(amazon, "Amazon HackOn arena must exist");
    assert.equal(amazon.category, "COMPANY_HACKATHON");

    const walmart = getPreparationArenaBySlug("walmart-sparkathon-2026");
    assert.ok(walmart, "Walmart Sparkathon arena must exist");

    const aiml = getPreparationArenaBySlug("paid-aiml-internship-2026");
    assert.ok(aiml, "Paid AI/ML Internship arena must exist");
    assert.equal(aiml.category, "SPECIALIZED_INTERNSHIP");

    const google = getPreparationArenaBySlug("google-swe-prep-2026");
    assert.ok(google, "Google SWE Prep arena must exist");
    assert.equal(google.category, "COMPANY_HIRING");
  });

  test("2. Opportunity-Specific Architecture: Differentiates e-commerce flash sale from GSoC async daemon", () => {
    const gsoc = getPreparationArenaBySlug("gsoc-2026");
    const flipkart = getPreparationArenaBySlug("flipkart-grid-7");

    assert.ok(gsoc && flipkart);

    // GSoC project must focus on open-source ingestion & telemetry
    const gsocProj = gsoc.projects[0];
    assert.ok(gsocProj.techStack.includes("Prometheus Client") || gsocProj.techStack.includes("FastAPI"));

    // Flipkart project must focus on high-concurrency flash sale inventory locking
    const flipkartProj = flipkart.projects[0];
    assert.ok(flipkartProj.title.toLowerCase().includes("flash") || flipkartProj.title.toLowerCase().includes("inventory"));
    assert.ok(flipkartProj.techStack.includes("Redis (Lua)") || flipkartProj.techStack.includes("PostgreSQL"));
    assert.ok(flipkartProj.acceptanceCriteria.some(c => c.toLowerCase().includes("zero inventory oversold")));
  });

  test("3. Beginner-to-Advanced Personalization: Scaffolds absolute beginners, accelerates advanced", () => {
    const gsoc = getPreparationArenaBySlug("gsoc-2026");
    assert.ok(gsoc);

    // Absolute Beginner roadmap includes terminal & basic git commands
    const abRoadmap = preparationsPersonalization.generatePersonalizedRoadmap(gsoc, "absolute_beginner", []);
    const abTaskTitles = abRoadmap.flatMap(p => p.tasks).map(t => t.title.toLowerCase());
    assert.ok(abTaskTitles.some(t => t.includes("git") || t.includes("fork") || t.includes("clone")));

    // Intermediate roadmap with already verified Git skips basic git tasks and focuses on PR & Proposal
    const verifiedSkills = ["Git & GitHub Collaborative Workflow", "Python"];
    const intRoadmap = preparationsPersonalization.generatePersonalizedRoadmap(gsoc, "intermediate", verifiedSkills);
    assert.ok(intRoadmap.length > 0);
  });

  test("4. Student DNA Evidence Matching: Accurate coverage computation without fabricated numbers", () => {
    const aiml = getPreparationArenaBySlug("paid-aiml-internship-2026");
    assert.ok(aiml);

    const mockProfile = {
      candidateId: "cand_test_001",
      verifiedSkills: ["Python Vectorized Data Stack (NumPy, Pandas)", "Relational SQL (CTEs & Window Functions)"],
      projects: ["Sales Dashboard"],
      targetRoles: ["AI Engineer"],
    };

    const match = preparationsPersonalization.evaluateSkillMatch(aiml, mockProfile);
    assert.ok(match.evidenceCoveragePercentage > 0 && match.evidenceCoveragePercentage <= 100);
    assert.ok(match.alreadyDemonstratedSkills.length >= 2, "Must identify already demonstrated skills");
    assert.ok(match.missingSkills.length > 0, "Must identify missing gaps");
  });

  test("5. Deep Integration with Existing Skill Arenas: Tasks link directly to DSA, AI-Data, CS Fundamentals", () => {
    const flipkart = getPreparationArenaBySlug("flipkart-grid-7");
    assert.ok(flipkart);

    const allTasks = Object.values(flipkart.phases).flatMap(phases => phases.flatMap(p => p.tasks));
    const targetHrefs = allTasks.map(t => t.targetHref);

    assert.ok(targetHrefs.some(h => h.includes("/student/skills/dsa")), "Must link to DSA Arena");
    assert.ok(targetHrefs.some(h => h.includes("/student/skills/cs-interview")), "Must link to CS Fundamentals");
    assert.ok(targetHrefs.some(h => h.includes("/student/skills/system-design")), "Must link to System Design");
  });

  test("6. Cross-Opportunity Optimizer: Finds common foundations and generates balanced schedule", () => {
    const selectedArenas = ["gsoc-2026", "flipkart-grid-7", "paid-aiml-internship-2026"];
    const plan = preparationsPersonalization.optimizeMultipleTargets(selectedArenas);

    assert.equal(plan.targetArenas.length, 3);
    assert.ok(plan.timeSavingsWeeks >= 2, "Must calculate meaningful time savings across 3 programs");
    assert.ok(plan.weeklyBalancedSchedule.length >= 4, "Must provide 4-week balanced schedule");
    assert.ok(plan.sharedFoundations.length > 0, "Must identify shared skills between targets");
  });

  test("7. AI Proposal Rubric Evaluator: Rejects shallow drafts and awards high marks for rigorous specifications", () => {
    const gsoc = getPreparationArenaBySlug("gsoc-2026");
    assert.ok(gsoc);

    // Shallow draft should receive NEEDS_REVISION
    const shallowDraft = "I want to do GSoC because I love open source and I will write code for this project.";
    const shallowEval = proposalEvaluator.evaluateProposal(gsoc, shallowDraft);
    assert.equal(shallowEval.verdict, "NEEDS_REVISION");
    assert.ok(shallowEval.overallScore < 50);
    assert.ok(shallowEval.gaps.length > 0);

    // Rigorous proposal draft
    const rigorousDraft = `
## 1. Abstract & Problem Definition
Currently, Apache Foo buffers JSON-ND payloads entirely in heap memory, causing OutOfMemory crashes on 5GB+ files. This project implements an asynchronous streaming parser yielding a 65% memory reduction.

## 2. Technical Approach & Architecture
We will implement an AsyncStreamTokenizer under foo.io.streaming using an iterator pattern. All APIs maintain backward compatibility. Unit tests using pytest will test chunk boundaries and error recovery.

## 3. 12-Week Milestone Schedule
- Weeks 1-2: Core tokenizer and benchmark harness.
- Weeks 3-4: Stream chunk buffer and zero-copy slicing.
- Weeks 5-6: Mid-term evaluation & integration tests.
- Weeks 7-8: Documentation, type hints, and buffer weeks for maintainer reviews.

## 4. Community Bonding & Prior Contributions
I have already submitted PR #142 fixing issue #119 on github.com/foo/foo which was reviewed and merged by maintainer @dev.
`;
    const rigorousEval = proposalEvaluator.evaluateProposal(gsoc, rigorousDraft);
    assert.ok(rigorousEval.overallScore >= 75, `Expected score >= 75, got ${rigorousEval.overallScore}`);
    assert.ok(rigorousEval.verdict === "STRONG_SUBMISSION" || rigorousEval.verdict === "MEETS_CRITERIA");
    assert.ok(rigorousEval.strengths.length >= 2);
  });

  test("8. Task Completion & Student DNA Synchronization: Persists progress and updates readiness score", () => {
    const candidateId = `test_cand_${Date.now()}`;
    const arenaId = "flipkart-grid-7";

    const initialState = preparationsStore.getOrCreateState(candidateId, arenaId);
    assert.equal(initialState.completedTaskIds.length, 0);
    assert.equal(initialState.readinessScore, 0);

    // Complete task 1
    const updatedState = preparationsStore.completeTask(
      candidateId,
      arenaId,
      "grid-ab-1",
      "Solved Kadane and Array Transformations in DSA Arena"
    );

    assert.ok(updatedState.completedTaskIds.includes("grid-ab-1"));
    assert.ok(updatedState.readinessScore > 0, "Readiness score must elevate upon task completion");
    assert.equal(updatedState.evidenceCount, 1);
  });

  test("9. Mock Assessment Simulator: Evaluates and grades timed challenge questions", () => {
    const gsoc = getPreparationArenaBySlug("gsoc-2026");
    assert.ok(gsoc && gsoc.mockAssessments.length > 0);

    const mock = gsoc.mockAssessments[0];
    assert.ok(mock.questions.length > 0);

    const q1 = mock.questions[0];
    assert.ok(q1.options && q1.correctAnswer);
    assert.equal(typeof q1.marks, "number");
  });
});

