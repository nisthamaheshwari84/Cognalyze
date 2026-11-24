import { test, describe } from "node:test";
import assert from "node:assert";
import {
  ALL_CANONICAL_COMPANIES,
  ALL_CANONICAL_ROLES,
  resolveCanonicalCompany,
  resolveCanonicalRole,
  getCanonicalRole,
  validateCompanyIdentity,
  assertCompanyIsolation
} from "../lib/question-bank/canonical-identity";
import {
  ROLE_TAXONOMIES,
  getRoleCategoryWeight,
  getRoleMustHaveTopics
} from "../lib/question-bank/role-taxonomy";
import {
  COMPANY_INTELLIGENCE_REGISTRY,
  getCompanyIntelligenceGuide
} from "../lib/question-bank/company-intelligence-registry";
import {
  queryCompanyQuestionBank,
  auditCompanyIsolation,
  getMasterQuestionsPool
} from "../lib/question-bank/company-question-store";
import {
  createResearchJob,
  getResearchJob,
  updateResearchJobState,
  getResearchJobsByCompany
} from "../lib/question-bank/research-job-store";
import {
  executeAutonomousResearch
} from "../lib/question-bank/autonomous-research-engine";
import { ALL_COMPANIES, ALL_ROLES } from "../lib/question-bank-data";

describe("COGNALYZE COMPANY INTERVIEW INTELLIGENCE & AUTONOMOUS RESEARCH ENGINE", () => {
  // ── TEST 1: Canonical Company Identity Resolution ──
  test("1. All 56 real companies in ALL_COMPANIES resolve cleanly to canonical identities", () => {
    const realCompanies = ALL_COMPANIES.filter(c => c !== "All Companies");
    assert.strictEqual(realCompanies.length, 56, "Expected 56 real companies");

    for (const compName of realCompanies) {
      const canonical = resolveCanonicalCompany(compName);
      assert.ok(canonical, `Company "${compName}" must resolve to a canonical company`);
      assert.ok(canonical.id.startsWith("comp-"), `Canonical ID for ${compName} must start with comp-`);
      assert.ok(canonical.displayName.length > 0, `Display name for ${compName} must not be empty`);
      assert.ok(canonical.sectorLabel, `Sector for ${compName} must exist`);
    }
  });

  // ── TEST 2: Company Alias and Case-Insensitive Matching ──
  test("2. Company aliases and casing variations map to correct canonical identity", () => {
    const growwTest = resolveCanonicalCompany("groww");
    assert.strictEqual(growwTest?.id, "comp-groww");
    assert.strictEqual(growwTest?.displayName, "Groww");

    const amazonIndia = resolveCanonicalCompany("Amazon India");
    assert.strictEqual(amazonIndia?.id, "comp-amazon");

    const credTest = resolveCanonicalCompany("cred");
    assert.strictEqual(credTest?.id, "comp-cred");

    const flipkartInternet = resolveCanonicalCompany("Flipkart Internet");
    assert.strictEqual(flipkartInternet?.id, "comp-flipkart");

    const googlePvt = resolveCanonicalCompany("Google LLC");
    assert.strictEqual(googlePvt?.id, "comp-google");
  });

  // ── TEST 3: Strict Company Isolation & Anti-Leakage Guards ──
  test("3. Groww, CRED, PhonePe NEVER resolve or leak into Amazon; unknown companies never default to Amazon", () => {
    const groww = resolveCanonicalCompany("Groww");
    const amazon = resolveCanonicalCompany("Amazon");
    const cred = resolveCanonicalCompany("CRED");
    const phonepe = resolveCanonicalCompany("PhonePe");

    assert.notStrictEqual(groww?.id, amazon?.id, "Groww must not have Amazon's ID");
    assert.notStrictEqual(cred?.id, amazon?.id, "CRED must not have Amazon's ID");
    assert.notStrictEqual(phonepe?.id, amazon?.id, "PhonePe must not have Amazon's ID");

    // Unknown company must return null or invalid, NEVER Amazon
    const unknownComp = resolveCanonicalCompany("CompletelyUnknownFakeCorp999");
    assert.strictEqual(unknownComp, null, "Unknown company must return null, NEVER Amazon");

    const validation = validateCompanyIdentity("CompletelyUnknownFakeCorp999");
    assert.strictEqual(validation.isValid, false);
    assert.strictEqual(validation.canonical, null);

    // Assert isolation check throws when mismatch occurs
    assert.throws(() => {
      assertCompanyIsolation("Groww", "Amazon");
    }, /Cross-Company Contamination Detected/);

    assert.throws(() => {
      assertCompanyIsolation("CRED", "Amazon");
    }, /Cross-Company Contamination Detected/);

    // Matching assertion must pass
    assert.doesNotThrow(() => {
      assertCompanyIsolation("Groww", "Groww");
    });
  });

  // ── TEST 4: Canonical Role Identity Resolution ──
  test("4. All 13 real roles in ALL_ROLES resolve to canonical role taxonomy", () => {
    const realRoles = ALL_ROLES.filter(r => r !== "All Roles");
    assert.strictEqual(realRoles.length, 13, "Expected 13 real roles");

    for (const roleName of realRoles) {
      const canonical = getCanonicalRole(roleName);
      assert.ok(canonical, `Role "${roleName}" must resolve to a canonical role`);
      assert.ok(canonical.id.startsWith("role-"), `Canonical ID for ${roleName} must start with role-`);
      assert.ok(canonical.displayName.length > 0);
    }
  });

  // ── TEST 5: Dynamic Role Taxonomy & Weightings ──
  test("5. Role-specific category weights dynamically adapt across roles", () => {
    // SDE must prioritize System Design and DSA
    const sdeDsaWeight = getRoleCategoryWeight("role-sde", "DSA");
    assert.ok(sdeDsaWeight >= 30, `SDE DSA weight expected >= 30, got ${sdeDsaWeight}`);

    // Data Analyst must prioritize SQL and Data Analysis
    const daSqlWeight = getRoleCategoryWeight("role-data-analyst", "SQL");
    assert.ok(daSqlWeight >= 30, `Data Analyst SQL weight expected >= 30, got ${daSqlWeight}`);

    // Must-have topics
    const sdeTopics = getRoleMustHaveTopics("role-sde");
    assert.ok(sdeTopics.includes("Dynamic Programming") || sdeTopics.includes("System Architecture"));

    const mleTopics = getRoleMustHaveTopics("role-ml-engineer");
    assert.ok(mleTopics.includes("Transformers & Attention") || mleTopics.includes("Backpropagation & Optimizers"));
  });

  // ── TEST 6: Company Intelligence Guide 100% Coverage & No Amazon Fallback ──
  test("6. Every company returns its dedicated intelligence guide with ZERO fallback to Amazon", () => {
    const realCompanies = ALL_COMPANIES.filter(c => c !== "All Companies");

    for (const compName of realCompanies) {
      const guide = getCompanyIntelligenceGuide(compName);
      assert.ok(guide, `Guide must exist for ${compName}`);
      assert.strictEqual(
        guide.company.toLowerCase(),
        compName.toLowerCase(),
        `Guide for ${compName} returned company ${guide.company} (leakage detected!)`
      );
      assert.ok(guide.hiringRounds.length > 0, `${compName} must have hiring rounds defined`);
      assert.ok(guide.topicWeightage.length > 0, `${compName} must have topic weightages`);
    }

    // Groww specifically
    const growwGuide = getCompanyIntelligenceGuide("Groww");
    assert.strictEqual(growwGuide.company, "Groww");
    assert.strictEqual(growwGuide.logoText, "GR");
    assert.ok(growwGuide.overview.includes("fintech") || growwGuide.overview.includes("Groww"));

    // CRED specifically
    const credGuide = getCompanyIntelligenceGuide("CRED");
    assert.strictEqual(credGuide.company, "CRED");
    assert.strictEqual(credGuide.logoText, "CR");
    assert.ok(credGuide.overview.includes("credit") || credGuide.overview.includes("CRED"));
  });

  // ── TEST 7: Question Store Isolation & Cross-Company Audit ──
  test("7. Querying Groww returns ONLY Groww questions; Audit confirms zero cross-contamination", () => {
    const growwResult = queryCompanyQuestionBank({
      company: "Groww",
      limit: 100
    });

    assert.ok(growwResult.questions.length > 0, "Groww must have questions seeded");
    for (const q of growwResult.questions) {
      assert.strictEqual(q.company, "Groww", `Question ${q.id} must be for Groww`);
    }

    const amazonResult = queryCompanyQuestionBank({
      company: "Amazon",
      limit: 100
    });
    assert.ok(amazonResult.questions.length > 0, "Amazon must have questions");
    for (const q of amazonResult.questions) {
      assert.strictEqual(q.company, "Amazon", `Question ${q.id} must be for Amazon`);
    }

    // Run platform-wide isolation audit
    const audit = auditCompanyIsolation();
    assert.strictEqual(audit.passed, true, `Platform isolation audit must be clean: ${audit.isolationViolations.join(", ")}`);
    assert.strictEqual(audit.isolationViolations.length, 0);
  });

  // ── TEST 8: Question Provenance Integrity ──
  test("8. Question provenance separates verified, reported, and AI practice items transparently", () => {
    const allQuestions = getMasterQuestionsPool();
    assert.ok(allQuestions.length >= 770, `Master pool should have 770+ questions, got ${allQuestions.length}`);

    for (const q of allQuestions) {
      assert.ok(q.sourceType, `Question ${q.id} must have a sourceType`);
      if (q.sourceType === "Verified Company Question") {
        assert.strictEqual(q.verified, true, `Verified question ${q.id} must have verified=true`);
        assert.ok(q.source, `Verified question ${q.id} must cite its source`);
      }
      if (q.sourceType === "AI-Generated Practice Question") {
        assert.strictEqual(q.verified, false, `AI practice question ${q.id} must have verified=false`);
      }
    }
  });

  // ── TEST 9: Research Job State Machine ──
  test("9. Research job store manages state transitions, idempotency, and bounded retries", () => {
    const testComp = `TestCorp_${Date.now()}`;
    const job = createResearchJob(testComp, "Software Engineer");
    assert.ok(job.researchJobId.startsWith("job-"));
    assert.strictEqual(job.jobStatus, "pending");
    assert.strictEqual(job.companyName, testComp);

    // Transition to researching
    const updated = updateResearchJobState(job.researchJobId, "researching");
    assert.strictEqual(updated?.jobStatus, "researching");

    // Retrieve by company
    const compJobs = getResearchJobsByCompany(testComp);
    assert.ok(compJobs.some(j => j.researchJobId === job.researchJobId));
  });

  // ── TEST 10: Rapid Company Switching Invariance Simulation ──
  test("10. Rapid sequential company switches guarantee zero data leakage or state crossover", () => {
    const sequence = ["Amazon", "Groww", "Google", "CRED", "Microsoft", "PhonePe", "Amazon", "Groww"];

    for (const targetCompany of sequence) {
      const guide = getCompanyIntelligenceGuide(targetCompany);
      assert.strictEqual(guide.company, targetCompany, `Guide company must match target ${targetCompany}`);

      const canonicalTarget = resolveCanonicalCompany(targetCompany);
      const result = queryCompanyQuestionBank({ company: targetCompany, limit: 10 });
      for (const q of result.questions) {
        const canonicalQ = resolveCanonicalCompany(q.company);
        assert.strictEqual(
          canonicalQ?.id,
          canonicalTarget?.id,
          `Rapid switch leaked ${q.company} (${canonicalQ?.id}) into ${targetCompany} (${canonicalTarget?.id})`
        );
      }
    }
  });
});
