/**
 * tests/company-prep-56-coverage.test.ts
 * 
 * Verifies 100% verified coverage across all 56 companies in Cognalyze Company Prep:
 * 1. All 56 companies in COMPANY_DIRECTORY have status 'questions_available'
 * 2. Every single company returns >= 15 mapped questions
 * 3. Specific deep verification for Salesforce, Walmart, NVIDIA, JPMorgan, Amex, etc.
 * 4. Company alias normalization (walmart-global-tech, jpmorganchase, american-express, etc.)
 * 5. getCompanyCoverageAudit() returns 100% coverage and empty zeroQuestionCompanies
 * 6. Provenance classification (historical_verified, historical_reported, curated_practice, ai_generated_fallback)
 * 7. Multi-role filtering support
 */

import test from "node:test";
import assert from "node:assert/strict";

import { COMPANY_DIRECTORY } from "../lib/skills/company-directory";
import {
  getCompanyQuestions,
  resolveCompanySlug,
  COMPANY_ALIASES,
  getTotalCompanyQuestionMappings,
  getDistinctCanonicalProblemCount
} from "../lib/skills/dsa-company-mappings";
import {
  COMPANY_TRACKS,
  getCompanyTrackBySlug,
  getProblemsForCompany,
  getCompanyPrepSummary,
  getCompanyCoverageAudit
} from "../lib/skills/dsa-company-prep";

test("Area B: Directory & Track alignment for all 56 configured companies", () => {
  assert.equal(COMPANY_DIRECTORY.length, 56, "Must contain exactly 56 companies");
  assert.equal(COMPANY_TRACKS.length, 56, "COMPANY_TRACKS must contain exactly 56 companies");

  for (const comp of COMPANY_DIRECTORY) {
    assert.equal(
      comp.status,
      "questions_available",
      `Company ${comp.name} (${comp.slug}) must have status 'questions_available'`
    );
    assert.equal(
      comp.statusLabel,
      "Questions Available",
      `Company ${comp.name} statusLabel must be 'Questions Available'`
    );
  }
});

test("Area B: 100% Question Coverage — ZERO companies with 0 questions", () => {
  const audit = getCompanyCoverageAudit();

  assert.equal(audit.totalCompanies, 56);
  assert.equal(audit.companiesWithQuestions, 56);
  assert.equal(audit.coveragePercentage, 100, "Coverage percentage must be strictly 100%");
  assert.deepEqual(audit.zeroQuestionCompanies, [], "Zero question companies list must be strictly empty");

  // Check sector distribution
  assert.equal(audit.sectorBreakdown.global_tech.companyCount, 25);
  assert.ok(audit.sectorBreakdown.global_tech.questionCount > 1000);

  assert.equal(audit.sectorBreakdown.india_product.companyCount, 15);
  assert.ok(audit.sectorBreakdown.india_product.questionCount >= 200);

  assert.equal(audit.sectorBreakdown.it_services.companyCount, 8);
  assert.ok(audit.sectorBreakdown.it_services.questionCount >= 100);

  assert.equal(audit.sectorBreakdown.finance_quant.companyCount, 8);
  assert.ok(audit.sectorBreakdown.finance_quant.questionCount >= 100);

  // Assert each company individually has >= 15 questions
  for (const company of COMPANY_DIRECTORY) {
    const questions = getCompanyQuestions(company.slug);
    assert.ok(
      questions.length >= 15,
      `Company ${company.name} (${company.slug}) has ${questions.length} questions, expected >= 15`
    );
  }
});

test("Area B: High-Priority Companies Audit (Salesforce & Walmart Global Tech)", () => {
  // Salesforce
  const sfTrack = getCompanyTrackBySlug("salesforce");
  assert.ok(sfTrack, "Salesforce track must exist");
  assert.ok(sfTrack.problems.length >= 15, `Salesforce must have >= 15 questions, got ${sfTrack.problems.length}`);
  
  const sfVerified = sfTrack.problems.filter(p => p.provenance === "historical_verified");
  assert.ok(sfVerified.length >= 4, "Salesforce must have verified historical questions");
  assert.ok(sfTrack.problems.some(p => p.problemId === "basic-calculator-ii"));
  assert.ok(sfTrack.problems.some(p => p.problemId === "lru-cache"));
  assert.ok(sfTrack.problems.some(p => p.problemId === "merge-k-sorted-lists"));

  // Walmart Global Tech
  const wmTrack = getCompanyTrackBySlug("walmart");
  assert.ok(wmTrack, "Walmart track must exist");
  assert.ok(wmTrack.problems.length >= 15, `Walmart must have >= 15 questions, got ${wmTrack.problems.length}`);
  
  const wmVerified = wmTrack.problems.filter(p => p.provenance === "historical_verified");
  assert.ok(wmVerified.length >= 3, "Walmart must have verified historical questions");
  assert.ok(wmTrack.problems.some(p => p.problemId === "search-in-rotated-sorted-array"));
  assert.ok(wmTrack.problems.some(p => p.problemId === "rotting-oranges"));
  assert.ok(wmTrack.problems.some(p => p.problemId === "trapping-rain-water"));
});

test("Area B: Company Aliases normalize correctly to canonical tracks", () => {
  const testCases = [
    { alias: "walmart-global-tech", canonical: "walmart" },
    { alias: "walmart-labs", canonical: "walmart" },
    { alias: "jpmorganchase", canonical: "jpmorgan" },
    { alias: "jp-morgan", canonical: "jpmorgan" },
    { alias: "jpmc", canonical: "jpmorgan" },
    { alias: "american-express", canonical: "amex" },
    { alias: "americanexpress", canonical: "amex" },
    { alias: "goldman", canonical: "goldman-sachs" },
    { alias: "tcs-ninja-digital-prime", canonical: "tcs" },
    { alias: "tcs-digital", canonical: "tcs" },
    { alias: "infosys-dse-sp", canonical: "infosys" },
    { alias: "wipro-turbo-elite", canonical: "wipro" },
    { alias: "cognizant-genc", canonical: "cognizant" },
    { alias: "meta-platforms", canonical: "meta" },
    { alias: "tiktok", canonical: "bytedance" }
  ];

  for (const tc of testCases) {
    const resolved = resolveCompanySlug(tc.alias);
    assert.equal(resolved, tc.canonical, `Alias ${tc.alias} must resolve to ${tc.canonical}`);

    const questions = getCompanyQuestions(tc.alias);
    assert.ok(questions.length >= 15, `Resolved alias ${tc.alias} must return >= 15 questions`);

    const track = getCompanyTrackBySlug(tc.alias);
    assert.ok(track, `getCompanyTrackBySlug must find track for alias ${tc.alias}`);
    assert.equal(track!.slug, tc.canonical);
  }
});

test("Area B: Provenance and Role Filtering in getProblemsForCompany", () => {
  // Provenance filtering on Salesforce
  const verifiedOnly = getProblemsForCompany("salesforce", { provenance: "historical_verified" });
  assert.ok(verifiedOnly.problems.length >= 4);
  assert.ok(verifiedOnly.problems.every(p => p.provenance === "historical_verified"));

  // Difficulty filtering
  const hardOnly = getProblemsForCompany("walmart", { difficulty: "hard" });
  assert.ok(hardOnly.problems.length >= 1);
  assert.ok(hardOnly.problems.every(p => p.difficulty === "hard"));

  // Pagination
  const paged = getProblemsForCompany("google", { limit: 10, offset: 5 });
  assert.equal(paged.problems.length, 10);
  assert.ok(paged.totalCount > 50);
});

test("Area B: Summary stats totals check", () => {
  const summary = getCompanyPrepSummary();
  assert.equal(summary.totalCompaniesCount, 56);
  assert.equal(summary.companiesWithQuestionsCount, 56);
  assert.equal(summary.companiesAwaitingDataCount, 0);
  assert.ok(summary.totalQuestionMappingsCount >= 1500);
  assert.ok(summary.distinctCanonicalProblemsCount >= 400);
});

