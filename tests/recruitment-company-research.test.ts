/**
 * tests/recruitment-company-research.test.ts
 * 
 * Comprehensive automated verification of Company Recruitment Research,
 * Blueprint Registry, and Competency Frameworks.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  getAllCompanies,
  getCompanyById,
  getCompanyBySlug,
  getCompaniesByTier,
} from "../lib/recruitment/company-registry";

import {
  getAllBlueprints,
  getBlueprintById,
  getBlueprintsByCompany,
  getBlueprint,
  getBlueprintStages,
  getResearchClaims,
} from "../lib/recruitment/blueprint-registry";

import {
  ALL_COMPETENCY_FRAMEWORKS,
  getCompetencyFrameworkById,
} from "../lib/recruitment/competency-frameworks";

describe("Recruitment Arena Phase 1 — Company Research & Blueprints", () => {
  const EXPECTED_COMPANY_IDS = [
    "google",
    "amazon",
    "microsoft",
    "adobe",
    "atlassian",
    "deloitte",
    "tcs",
    "infosys",
    "accenture",
    "jpmorgan",
  ];

  it("registers exactly the 10 target enterprise companies with full metadata", () => {
    const companies = getAllCompanies();
    assert.strictEqual(companies.length, 10, "Should have exactly 10 companies");

    for (const expectedId of EXPECTED_COMPANY_IDS) {
      const company = getCompanyById(expectedId);
      assert.ok(company, `Company ${expectedId} must exist`);
      assert.ok(company.name.length > 0, `${expectedId} must have a valid name`);
      assert.ok(company.officialCareersUrl.startsWith("https://"), `${expectedId} must have official HTTPS career URL`);
      assert.ok(company.headquarters.length > 0, `${expectedId} must have headquarters`);
      assert.ok(company.overview.length > 30, `${expectedId} must have detailed overview`);
      assert.ok(company.supportedRoleFamilies.length > 0, `${expectedId} must support at least 1 role family`);
      assert.ok(company.supportedChannels.length > 0, `${expectedId} must support at least 1 hiring channel`);
      assert.ok(company.competencyFrameworkId, `${expectedId} must link to a competency framework`);
    }
  });

  it("classifies companies correctly into recruitment tier categories", () => {
    const faangTiers = getCompaniesByTier("TIER_1_FAANG");
    const faangIds = faangTiers.map((c) => c.id).sort();
    assert.deepStrictEqual(faangIds, ["amazon", "google", "microsoft"].sort());

    const productTiers = getCompaniesByTier("HIGH_GROWTH_PRODUCT");
    const productIds = productTiers.map((c) => c.id).sort();
    assert.deepStrictEqual(productIds, ["adobe", "atlassian"].sort());

    const enterpriseTiers = getCompaniesByTier("ENTERPRISE_SERVICE");
    const enterpriseIds = enterpriseTiers.map((c) => c.id).sort();
    assert.deepStrictEqual(enterpriseIds, ["accenture", "deloitte", "infosys", "tcs"].sort());

    const fintechTiers = getCompaniesByTier("FINTECH_GLOBAL");
    const fintechIds = fintechTiers.map((c) => c.id);
    assert.deepStrictEqual(fintechIds, ["jpmorgan"]);
  });

  it("verifies all competency frameworks have rigorous definitions and sample questions", () => {
    for (const expectedId of EXPECTED_COMPANY_IDS) {
      const company = getCompanyById(expectedId)!;
      const framework = getCompetencyFrameworkById(company.competencyFrameworkId!);
      assert.ok(framework, `Competency framework ${company.competencyFrameworkId} must exist for ${company.name}`);
      assert.ok(framework.principles.length >= 1, `Framework for ${company.name} must have at least 1 principle`);

      for (const principle of framework.principles) {
        assert.ok(principle.id.length > 0, "Principle must have id");
        assert.ok(principle.name.length > 0, "Principle must have name");
        assert.ok(principle.definition.length > 10, "Principle must have substantive definition");
        assert.ok(principle.positiveIndicators.length >= 1, "Principle must have positive indicators");
        assert.ok(principle.sampleProbingQuestions.length >= 1, "Principle must have sample probing questions");
      }
    }
  });

  it("ensures every company has at least one verified recruitment blueprint", () => {
    const allBlueprints = getAllBlueprints();
    assert.ok(allBlueprints.length >= 10, "Should have at least 10 blueprints");

    for (const expectedId of EXPECTED_COMPANY_IDS) {
      const blueprints = getBlueprintsByCompany(expectedId);
      assert.ok(blueprints.length >= 1, `Company ${expectedId} must have at least 1 blueprint`);

      for (const bp of blueprints) {
        assert.ok(bp.title.length > 0, `Blueprint ${bp.id} must have title`);
        assert.ok(bp.version.length > 0, `Blueprint ${bp.id} must have version`);
        assert.ok(bp.stages.length >= 3, `Blueprint ${bp.id} must have at least 3 stages`);
        assert.ok(bp.verifiedSources.length >= 3, `Blueprint ${bp.id} must have verified research claims`);
        assert.ok(Object.keys(bp.competencyRubric).length >= 2, `Blueprint ${bp.id} must have competency rubric`);
      }
    }
  });

  it("verifies research claims contain verifiable URLs and approval status", () => {
    const allBlueprints = getAllBlueprints();
    for (const bp of allBlueprints) {
      for (const claim of bp.verifiedSources) {
        assert.strictEqual(claim.verificationStatus, "APPROVED");
        assert.ok(claim.sourceUrl.startsWith("https://"), `Source URL ${claim.sourceUrl} must be HTTPS`);
        assert.ok(claim.stageOrder >= 1, "Stage order must be positive integer");
        assert.ok(claim.evaluationFocus.length >= 1, "Claim must have evaluation focus items");
      }
    }
  });

  it("verifies accurate company-specific stage differentiation without generic homogenization", () => {
    // 1. Google must NOT have Group Discussion
    const googleSde = getBlueprint("google", "sde", "campus")!;
    assert.ok(googleSde, "Google SDE campus blueprint must exist");
    const googleHasGD = googleSde.stages.some((s) => s.stageType === "group_discussion");
    assert.strictEqual(googleHasGD, false, "Google MUST NOT have a Group Discussion stage");
    const googleHasGoc = googleSde.stages.some((s) => s.id === "stage_google_oa");
    assert.ok(googleHasGoc, "Google must have GOC online challenge");

    // 2. Amazon SDE must have OA2 Work Simulation and Bar Raiser
    const amazonSde = getBlueprint("amazon", "sde", "campus")!;
    assert.ok(amazonSde, "Amazon SDE campus blueprint must exist");
    const amazonHasWorkSim = amazonSde.stages.some((s) => s.stageType === "work_simulation");
    const amazonHasBarRaiser = amazonSde.stages.some((s) => s.id === "stage_amzn_bar_raiser");
    assert.ok(amazonHasWorkSim, "Amazon must feature SDE Work Simulation (OA2)");
    assert.ok(amazonHasBarRaiser, "Amazon must feature the signature Bar Raiser stage");

    // 3. Deloitte Campus MUST have Group Discussion & Case Study
    const deloitteTech = getBlueprint("deloitte", "data_analyst", "campus")!;
    assert.ok(deloitteTech, "Deloitte blueprint must exist");
    const deloitteHasGD = deloitteTech.stages.some((s) => s.stageType === "group_discussion");
    const deloitteHasCase = deloitteTech.stages.some((s) => s.stageType === "case_study");
    assert.ok(deloitteHasGD, "Deloitte campus must include Group Discussion & Case Simulation");
    assert.ok(deloitteHasCase, "Deloitte campus must include Case Study Interview");

    // 4. Atlassian must have Code Craft live pair programming
    const atlassianSde = getBlueprint("atlassian", "sde", "campus")!;
    assert.ok(atlassianSde, "Atlassian blueprint must exist");
    const atlassianHasCodeCraft = atlassianSde.stages.some((s) => s.id === "stage_atlassian_code_craft");
    assert.ok(atlassianHasCodeCraft, "Atlassian must feature Code Craft pair programming");

    // 5. Accenture must have Automated Communication Assessment
    const accSde = getBlueprint("accenture", "sde", "campus")!;
    assert.ok(accSde, "Accenture blueprint must exist");
    const accHasComm = accSde.stages.some((s) => s.stageType === "verbal_ability" || s.assessmentFormat === "communication_assessment");
    assert.ok(accHasComm, "Accenture must feature Automated Communication Assessment");

    // 6. JPMorgan must have Superday
    const jpmcSde = getBlueprint("jpmorgan", "sde", "campus")!;
    assert.ok(jpmcSde, "JPMorgan blueprint must exist");
    const jpmcHasSuperday = jpmcSde.stages.some((s) => s.title.includes("Superday"));
    assert.ok(jpmcHasSuperday, "JPMorgan must feature Superday rounds");
  });

  it("verifies stage dependency chains (DAG) form valid ordered execution sequences", () => {
    const allBlueprints = getAllBlueprints();
    for (const bp of allBlueprints) {
      const stages = getBlueprintStages(bp.id);
      const stageIds = new Set(stages.map((s) => s.id));

      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        assert.strictEqual(stage.order, i + 1, `Stage ${stage.id} order must match index + 1`);

        // Check dependsOn validity
        for (const depId of stage.dependsOn) {
          assert.ok(stageIds.has(depId), `Dependency ${depId} must exist in blueprint ${bp.id}`);
          const depStage = stages.find((s) => s.id === depId)!;
          assert.ok(depStage.order < stage.order, `Dependency ${depId} must precede ${stage.id}`);
        }
      }
    }
  });
});

