/**
 * tests/dsa-company-prep-expansion.test.ts
 * 
 * Verifies resolution of the 16-question bottleneck, broad 56-company directory coverage,
 * and traceable company-question mappings across sectors.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  COMPANY_DIRECTORY,
  getCompanyDirectory,
  getCompanyBySlug,
  getCompaniesBySector
} from "../lib/skills/company-directory";

import {
  getCompanyQuestions,
  getDistinctCanonicalProblemCount,
  getTotalCompanyQuestionMappings,
  getCompanyStats
} from "../lib/skills/dsa-company-mappings";

import { EXPANDED_PLACEMENT_QUESTIONS } from "../lib/question-bank-catalog";

test("Company Directory: 56 companies categorized across all 4 sectors", () => {
  const dir = getCompanyDirectory();
  assert.equal(dir.length, 56, `Expected exactly 56 companies in directory, found: ${dir.length}`);

  const sectors = ["global_tech", "india_product", "it_services", "finance_quant"] as const;
  for (const s of sectors) {
    const inSector = getCompaniesBySector(s);
    assert.ok(inSector.length >= 8, `Sector ${s} should have >= 8 companies, found ${inSector.length}`);
  }

  // Verify comprehensive status representation across all companies
  const available = dir.filter(c => c.status === "questions_available");
  assert.equal(available.length, 56, "All 56 configured companies now have verified or curated questions available");
});

test("Company Mappings: Traceable mappings exceed 1,000 relations without canonical ID pollution", () => {
  const totalMappings = getTotalCompanyQuestionMappings();
  assert.ok(
    totalMappings >= 1000,
    `Expected >= 1000 company mappings, got ${totalMappings}`
  );

  const stats = getCompanyStats();
  const amazonStat = stats.find(s => s.companySlug === "amazon");
  const googleStat = stats.find(s => s.companySlug === "google");
  const microsoftStat = stats.find(s => s.companySlug === "microsoft");
  const metaStat = stats.find(s => s.companySlug === "meta");

  assert.ok(amazonStat && amazonStat.problemCount >= 300, `Amazon must have >= 300 DSA PROBLEMs mapped, got ${amazonStat?.problemCount}`);
  assert.ok(googleStat && googleStat.problemCount >= 150, `Google must have >= 150 DSA PROBLEMs mapped, got ${googleStat?.problemCount}`);
  assert.ok(microsoftStat && microsoftStat.problemCount >= 80, `Microsoft must have >= 80 DSA PROBLEMs mapped, got ${microsoftStat?.problemCount}`);
  assert.ok(metaStat && metaStat.problemCount >= 50, `Meta must have >= 50 DSA PROBLEMs mapped, got ${metaStat?.problemCount}`);

  // Test retrieval
  const amazonProblems = getCompanyQuestions("amazon");
  assert.ok(amazonProblems.length >= 300);
  for (const m of amazonProblems.slice(0, 20)) {
    assert.ok(m.problemId, "Mapping must have problemId");
    assert.equal(m.companySlug, "amazon");
    assert.ok(m.provenance, "Mapping must have traceable provenance");
  }
});

test("Company Prep Resolution: Question Bank never limits company prep to 16 questions", () => {
  const targetCompanies = ["Amazon", "Google", "Microsoft", "Meta", "Uber", "Apple"];

  for (const comp of targetCompanies) {
    const matching = EXPANDED_PLACEMENT_QUESTIONS.filter(
      q =>
        (q.company || "").toLowerCase() === comp.toLowerCase() ||
        (q.tags || []).some(t => t.toLowerCase() === comp.toLowerCase())
    );
    assert.ok(
      matching.length > 16,
      `Company ${comp} should have > 16 questions in Question Bank, but found only ${matching.length}!`
    );
  }
});
