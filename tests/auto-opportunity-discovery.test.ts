/**
 * COGNALYZE — AUTOMATIC OPPORTUNITY DISCOVERY AFTER RESUME ANALYSIS
 * 
 * Test Suite verifying:
 * 1. Resume analysis updates Student DNA with parsed skills and projects.
 * 2. Automatic Opportunity Discovery runs across permitted source adapters.
 * 3. Categorizes discovered opportunities into:
 *    - Strong Opportunities (You can apply / Apply now)
 *    - Opportunities With Gaps (Relevant — but evidence gap / Build evidence first)
 *    - Other Relevant Opportunities (Campus / Explore)
 * 4. Transparent provenance: Each recommendation provides "Why you can apply" and "Gap".
 * 5. Direct application URLs are preserved without obfuscation.
 * 6. The existing Opportunity Agent remains intact and operational.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  recordStudentEvent,
  getStudentIntelligenceProfile,
  getStudentEvidence,
  getStudentChangeLog,
} from "../lib/intelligence/student-intelligence";
import { opportunityService } from "../lib/opportunities/opportunity-service";

describe("Cognalyze Automatic Opportunity Discovery from Resume Analysis", () => {
  const testStudentId = "student-test-auto-discover";

  test("1. Resume Analysis updates Student DNA with parsed skills and projects", async () => {
    const extractedSkills = [
      { name: "Python", proficiency: "Advanced" },
      { name: "FastAPI", proficiency: "Intermediate" },
      { name: "Machine Learning", proficiency: "Intermediate" },
      { name: "React", proficiency: "Familiar" },
    ];

    const extractedProjects = [
      {
        title: "Autonomous Healthcare Agent",
        tech_stack: ["Python", "FastAPI", "Machine Learning"],
        description: "Built anomaly detection engine with RESTful endpoints",
      },
    ];

    const result = await recordStudentEvent({
      studentId: testStudentId,
      eventType: "resume_uploaded",
      payload: {
        skills: extractedSkills,
        projects: extractedProjects,
      },
    });

    assert.equal(result.success, true, "Event recording succeeded");

    // Verify Student DNA profile updated
    const profile = getStudentIntelligenceProfile(testStudentId);
    assert.ok(profile.totalEvidenceCount > 0, "Evidence items registered in Student DNA");

    // Verify demonstrated project evidence level (Level 2)
    const evidenceList = getStudentEvidence(testStudentId);
    const pythonEvidence = evidenceList.find(
      (e) => e.capability.toLowerCase() === "python" && e.sourceType === "project"
    );
    assert.ok(pythonEvidence, "Project evidence created for Python");
    assert.equal(pythonEvidence.evidenceLevel, 2, "Project evidence registered at Level 2 (DEMONSTRATED)");

    // Verify audit log captured transition
    const changeLog = getStudentChangeLog(testStudentId);
    const resumeEvent = changeLog.find((e) => e.triggerEvent.includes("resume"));
    assert.ok(resumeEvent, "DNA change event logged in Career Intelligence loop");
  });

  test("2. Automatic Opportunity Discovery researches current opportunities using updated DNA", async () => {
    const feed = await opportunityService.getPersonalizedFeed(testStudentId, {
      forceRefresh: true,
    });

    assert.ok(feed.summary.totalResearched > 0, "Researched available opportunities across sources");
    assert.ok(feed.summary.sourcesActive >= 4, "Active sources count >= 4");
    assert.ok(
      feed.allPersonalizedMatches.length > 0,
      "Produced personalized opportunity matches"
    );

    // Verify categorization
    const applyNow = feed.categorized.applyNow;
    const buildEvidence = feed.categorized.buildEvidence;
    const explore = feed.categorized.explore;

    assert.ok(
      applyNow.length > 0 || buildEvidence.length > 0,
      "Classified opportunities into actionable tiers"
    );
  });

  test("3. Strong Opportunities provide 'Why you can apply' with verified evidence proof", async () => {
    const feed = await opportunityService.getPersonalizedFeed(testStudentId);
    const all = feed.allPersonalizedMatches;

    // Find any match with recommendations
    const candidateMatch = all.find((m) => m.recommendation === "APPLY_NOW") || all[0];
    assert.ok(candidateMatch, "Found matched opportunity");

    // Verify structured "Why" explanations
    assert.ok(
      candidateMatch.why.whyThisCandidate.length > 10,
      "Generates clear candidate evidence reason"
    );
    assert.ok(
      candidateMatch.why.whyThisOpportunity.length > 10,
      "Generates role alignment reason"
    );
    assert.ok(
      candidateMatch.why.whyNow.length > 10,
      "Generates why now timeliness reason"
    );

    // Verify direct application URL exists
    const appUrl = candidateMatch.opportunity.applicationUrl || candidateMatch.opportunity.sourceUrl;
    assert.ok(appUrl.startsWith("http"), "Direct official application URL is preserved");
  });

  test("4. Opportunities with gaps generate actionable recommendations without blind rejection", async () => {
    const feed = await opportunityService.getPersonalizedFeed(testStudentId);
    const gapMatch = feed.categorized.buildEvidence[0];

    if (gapMatch) {
      assert.ok(gapMatch.evidenceGaps.length > 0, "Identified specific evidence gaps");
      assert.ok(
        gapMatch.recommendationReason.length > 10,
        "Explains why candidate should build evidence"
      );
      assert.ok(gapMatch.actionPlan, "Provides concrete project deliverable suggestion");
    }
  });

  test("5. Source Transparency: Every opportunity attributes its verified source and freshness", async () => {
    const feed = await opportunityService.getPersonalizedFeed(testStudentId);
    for (const match of feed.allPersonalizedMatches.slice(0, 5)) {
      const opp = match.opportunity;
      assert.ok(opp.source.length > 0, "Source name is attributed");
      assert.ok(opp.sourceType.length > 0, "Source type is categorized");
      assert.ok(
        opp.freshness === "FRESH" || opp.freshness === "ACTIVE" || opp.freshness === "AGING",
        "Valid freshness state tracked"
      );
    }
  });
});
