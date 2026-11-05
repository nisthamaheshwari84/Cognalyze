/**
 * tests/dsa-phase3-mentor-and-company.test.ts
 * 
 * Verification Test Suite for Phase 3:
 * - Company Preparation Layer & Catalog
 * - Question Provenance Transparency
 * - Dedicated & Contextual DSA Mentor Service (Hinglish, Socratic Guidance, Debugging, Speech Summary)
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  COMPANY_TRACKS,
  getAllCompanyTracks,
  getCompanyTrackBySlug,
  getProblemsForCompany
} from "../lib/skills/dsa-company-prep";
import { executeDsaMentorTurn } from "../lib/skills/dsa-mentor-service";
import { POST as mentorPostHandler, GET as mentorGetHandler } from "../app/api/skills/dsa/mentor/route";
import { GET as companiesGetHandler } from "../app/api/skills/dsa/companies/route";
import { NextRequest } from "next/server";

describe("Phase 3: Company Preparation Layer & Catalogue", () => {
  test("Curated Company Tracks contains verified tracks across 3 sectors", () => {
    const tracks = getAllCompanyTracks();
    assert.ok(tracks.length >= 5, "Expected at least 5 curated company tracks");

    const categories = new Set(tracks.map(t => t.category));
    assert.ok(categories.has("tier1_faang"), "Should cover Tier 1 / FAANG");
    assert.ok(categories.has("fintech_product"), "Should cover Fintech / High-Growth Product");
    assert.ok(categories.has("enterprise_mass"), "Should cover Enterprise / Mass IT Recruiters");

    // Check specific known companies
    assert.ok(getCompanyTrackBySlug("google"), "Google track must exist");
    assert.ok(getCompanyTrackBySlug("amazon"), "Amazon track must exist");
    assert.ok(getCompanyTrackBySlug("stripe"), "Stripe track must exist");
    assert.ok(getCompanyTrackBySlug("tcs"), "TCS track must exist");
    assert.ok(getCompanyTrackBySlug("microsoft"), "Microsoft track must exist");
  });

  test("Company tracks contain rigorous assessment format and role specifications", () => {
    const googleTrack = getCompanyTrackBySlug("google");
    assert.ok(googleTrack);
    assert.strictEqual(googleTrack.slug, "google");
    assert.ok(googleTrack.roles.length > 0);
    assert.ok(googleTrack.assessmentFormat.oaDurationMinutes > 0);
    assert.ok(googleTrack.assessmentFormat.interviewRounds >= 3);
    assert.ok(googleTrack.assessmentFormat.coreTopics.length >= 3);
  });

  test("Company problem mappings carry explicit provenance badges", () => {
    const amazonResult = getProblemsForCompany("amazon");
    const amazonProblems = amazonResult.problems;
    assert.ok(amazonProblems.length > 0, "Amazon track must have mapped problems");

    const validProvenances = new Set(["verified_historical", "historical_reported", "reported_historical", "role_pattern", "cognalyze_simulation", "community_reported"]);
    for (const p of amazonProblems) {
      assert.ok(p.problemId, "Problem mapping must have canonical problemId");
      assert.ok(p.title, "Problem mapping must have title");
      assert.ok(validProvenances.has(p.provenance), `Invalid provenance: ${p.provenance}`);
      assert.ok(p.frequencyScore >= 1 && p.frequencyScore <= 100, "Frequency score must be between 1 and 100");
      assert.ok(p.assessmentStage, "Assessment stage must be specified");
    }
  });

  test("GET /api/skills/dsa/companies returns all company tracks or individual slug", async () => {
    // 1. All tracks
    const allReq = new NextRequest("http://localhost:3000/api/skills/dsa/companies");
    const allRes = await companiesGetHandler(allReq);
    const allData = await allRes.json();
    assert.strictEqual(allRes.status, 200);
    assert.strictEqual(allData.success, true);
    assert.ok(allData.companies.length >= 5);

    // 2. Specific slug
    const googleReq = new NextRequest("http://localhost:3000/api/skills/dsa/companies?slug=google");
    const googleRes = await companiesGetHandler(googleReq);
    const googleData = await googleRes.json();
    assert.strictEqual(googleRes.status, 200);
    assert.strictEqual(googleData.success, true);
    assert.strictEqual(googleData.company.slug, "google");

    // 3. Unknown slug
    const unknownReq = new NextRequest("http://localhost:3000/api/skills/dsa/companies?slug=non-existent-co");
    const unknownRes = await companiesGetHandler(unknownReq);
    assert.strictEqual(unknownRes.status, 404);
  });
});

describe("Phase 3: Contextual DSA Mentor Service", () => {
  test("executeDsaMentorTurn generates Socratic response with problem context", async () => {
    const turn = await executeDsaMentorTurn({
      studentId: "test-candidate",
      message: "How should I approach this problem?",
      problemId: "two-sum",
      language: "python"
    });

    assert.ok(turn.reply, "Mentor should produce a pedagogical reply");
    assert.ok(turn.suggestedPrompts.length > 0, "Mentor should suggest follow-up questions");
    assert.ok(turn.spokenSummary, "Mentor should produce spoken summary");
  });

  test("executeDsaMentorTurn responds in Hinglish when requested", async () => {
    const turn = await executeDsaMentorTurn({
      studentId: "test-candidate",
      message: "Mujhe Hinglish me samjhao please, optimal approach kya hogi?",
      problemId: "binary-search",
      language: "cpp"
    });

    assert.ok(turn.reply);
    // Should include Hinglish phrasing or conversational markers
    const hasHinglish = /karo|karein|samjho|approach|dhyan|dekho|hai/i.test(turn.reply);
    assert.ok(hasHinglish, "Reply should reflect Hinglish conversational style");
  });

  test("executeDsaMentorTurn produces spoken summary when voiceRequested is true", async () => {
    const turn = await executeDsaMentorTurn({
      studentId: "test-candidate",
      message: "Quick summary of time complexity",
      problemId: "binary-search",
      voiceRequested: true
    });

    assert.ok(turn.spokenSummary, "Voice-requested turn must return a spokenSummary");
    assert.ok(turn.spokenSummary.length <= 350, "Spoken summary should be concise for Web Speech");
  });

  test("executeDsaMentorTurn generates Mermaid diagrams for visual learners", async () => {
    const turn = await executeDsaMentorTurn({
      studentId: "test-candidate",
      message: "Draw a diagram or flowchart of binary search halving",
      problemId: "binary-search"
    });

    assert.ok(turn.diagram, "Mentor should attach a diagram for visual requests");
    assert.ok(turn.diagram.includes("graph LR") || turn.diagram.includes("graph TD") || turn.diagram.includes("flowchart TD"), "Diagram should be valid Mermaid syntax");
  });

  test("POST /api/skills/dsa/mentor route handler executes mentor turns", async () => {
    const req = new NextRequest("http://localhost:3000/api/skills/dsa/mentor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: "student-demo",
        message: "Explain Kadane's algorithm boundary reset",
        problemId: "maximum-subarray-sum-kadane-s-algorithm",
        voiceRequested: true
      })
    });

    const res = await mentorPostHandler(req);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.reply);
    assert.ok(data.spokenSummary);
  });

  test("GET /api/skills/dsa/mentor returns mentor status and quick prompts", async () => {
    const req = new NextRequest("http://localhost:3000/api/skills/dsa/mentor?problemId=two-sum");
    const res = await mentorGetHandler(req);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.defaultPrompts.length >= 4);
    assert.ok(data.capabilities.includes("image_vision"));
  });
});
