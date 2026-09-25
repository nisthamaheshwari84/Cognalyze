import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseJobDescriptionSemantically,
  extractSemanticRoleDeterministically,
  postValidateAndConsolidate,
  normalizeCanonicalName,
  getExpectedEvidenceSignals,
  getVerificationStrategy,
  mergeRoleDnaResults
} from "../lib/roles/semantic-jd-parser";
import { extractStructuredRoleFromJd, extractSemanticRoleFromJd } from "../lib/roles/role-extractor";
import { compileTieredRequirementsFromStructured, StructuredRoleRequirement } from "../lib/ai/role-dna";

describe("Semantic JD Analysis & Role DNA Intelligence Pipeline", () => {
  // ────────────────────────────────────────────────────────────
  // MANDATORY TEST CASE 1: RESPONSIBILITY SEPARATION
  // ────────────────────────────────────────────────────────────
  it("Case 1: 'Build machine learning models using Python' is classified as RESPONSIBILITY, not a mandatory screening requirement", () => {
    const jd = `
Title: AI/ML Intern
Responsibilities:
- Build and evaluate machine learning models using Python.
`;
    const dna = extractSemanticRoleDeterministically(jd);
    assert.ok(dna.responsibilities.length > 0, "Must extract responsibility");

    const resp = dna.responsibilities.find(r => r.source_text.toLowerCase().includes("build and evaluate machine learning"));
    assert.ok(resp, "Should find the build ML models responsibility");
    assert.equal(resp.category, "RESPONSIBILITY");
    assert.equal(resp.mandatory, false, "Responsibilities must never be mandatory screening criteria");

    // Verify it is not in mustHaves
    const mustHave = dna.mustHaves.find(m => m.source_text.toLowerCase().includes("build and evaluate machine learning"));
    assert.equal(mustHave, undefined, "Operational task must NOT be a must-have requirement");

    // Verify related capability was inferred with explanation
    assert.ok(resp.related_capabilities && resp.related_capabilities.length > 0, "Should infer related capability");
    const hasMl = resp.related_capabilities.some(c => c.name === "Machine Learning");
    assert.ok(hasMl, "Should infer Machine Learning capability");
  });

  // ────────────────────────────────────────────────────────────
  // MANDATORY TEST CASE 2: MUST-HAVE NORMALIZATION
  // ────────────────────────────────────────────────────────────
  it("Case 2: 'Strong Python programming skills are required' resolves to canonical MUST_HAVE Python", () => {
    const jd = `
Title: Backend Engineer
Requirements:
- Strong Python programming skills are required.
`;
    const dna = extractSemanticRoleDeterministically(jd);
    const pythonReq = dna.mustHaves.find(m => m.canonical_name === "Python");

    assert.ok(pythonReq, "Must normalize to canonical Python");
    assert.equal(pythonReq.category, "MUST_HAVE");
    assert.equal(pythonReq.mandatory, true);
    assert.ok(pythonReq.evidence_signals.includes("GitHub"));
    assert.ok(pythonReq.rationale.includes("explicitly required"));
  });

  // ────────────────────────────────────────────────────────────
  // MANDATORY TEST CASE 3: PREFERRED QUALIFICATION
  // ────────────────────────────────────────────────────────────
  it("Case 3: 'Experience with AWS is preferred' resolves to PREFERRED AWS without converting to mandatory", () => {
    const jd = `
Title: Cloud Engineer
Preferred Qualifications:
- Experience with AWS is preferred.
`;
    const dna = extractSemanticRoleDeterministically(jd);
    const awsReq = dna.preferred.find(p => p.canonical_name.toUpperCase().includes("AWS"));

    assert.ok(awsReq, "Should extract AWS under preferred");
    assert.equal(awsReq.category, "PREFERRED");
    assert.equal(awsReq.mandatory, false, "Preferred qualifications must NOT be mandatory");
  });

  // ────────────────────────────────────────────────────────────
  // MANDATORY TEST CASE 4: AMBIGUITY & ZERO HALLUCINATION
  // ────────────────────────────────────────────────────────────
  it("Case 4: 'Experience with cloud platforms' flags UNKNOWN / NEEDS_CONFIRMATION without inventing AWS/GCP", () => {
    const jd = `
Title: Platform Engineer
Requirements:
- Experience with cloud platforms.
`;
    const dna = extractSemanticRoleDeterministically(jd);
    const cloudReq = dna.ambiguities.find(a => a.canonical_name === "Cloud Deployment");

    assert.ok(cloudReq, "Should flag cloud platforms as Cloud Deployment ambiguity");
    assert.equal(cloudReq.ambiguity_status, "AMBIGUOUS");
    assert.ok(cloudReq.ambiguity_reason?.includes("specify a particular cloud platform"));

    // Ensure zero hallucination of specific vendors
    const allNames = [
      ...dna.mustHaves.map(i => i.canonical_name),
      ...dna.preferred.map(i => i.canonical_name),
      ...dna.ambiguities.map(i => i.canonical_name)
    ].join(" ").toLowerCase();

    assert.ok(!allNames.includes("aws"), "Must not invent AWS when JD only says cloud platforms");
    assert.ok(!allNames.includes("azure"), "Must not invent Azure");
    assert.ok(!allNames.includes("gcp"), "Must not invent GCP");
  });

  // ────────────────────────────────────────────────────────────
  // MANDATORY TEST CASE 5: ELIGIBILITY SEPARATION
  // ────────────────────────────────────────────────────────────
  it("Case 5: 'Currently pursuing a Bachelor's degree in Computer Science' is classified as ELIGIBILITY", () => {
    const jd = `
Title: SWE Intern
Eligibility:
- Currently pursuing a Bachelor's degree in Computer Science.
`;
    const dna = extractSemanticRoleDeterministically(jd);
    const degreeReq = dna.eligibility.find(e => e.canonical_name.includes("Bachelor"));

    assert.ok(degreeReq, "Should classify under eligibility");
    assert.equal(degreeReq.category, "ELIGIBILITY");
    assert.equal(degreeReq.subtype, "education_degree");
    assert.ok(degreeReq.evidence_signals.includes("Degree Certificate") || degreeReq.evidence_signals.includes("Transcript"));
  });

  // ────────────────────────────────────────────────────────────
  // MANDATORY TEST CASE 6: EVIDENCE SIGNAL SEPARATION
  // ────────────────────────────────────────────────────────────
  it("Case 6: 'Public GitHub repositories demonstrating meaningful implementation are preferred' is EVIDENCE_SIGNAL, not a skill", () => {
    const jd = `
Title: AI Engineer
Preferred:
- Public GitHub repositories demonstrating meaningful implementation are preferred.
`;
    const dna = extractSemanticRoleDeterministically(jd);
    const gitSig = dna.evidenceSignals.find(s => s.canonical_name.includes("GitHub"));

    assert.ok(gitSig, "Must identify as evidence signal");
    assert.equal(gitSig.category, "EVIDENCE_SIGNAL");
    assert.equal(gitSig.subtype, "evidence_source");
    assert.ok(gitSig.verification_strategy.some(v => v.includes("commit history")));
  });

  // ────────────────────────────────────────────────────────────
  // MANDATORY TEST CASE 7: COLLABORATION AS RESPONSIBILITY
  // ────────────────────────────────────────────────────────────
  it("Case 7: 'Collaborate with engineers and product managers' is classified as RESPONSIBILITY, not MUST_HAVE", () => {
    const jd = `
Title: ML Intern
Responsibilities:
- Collaborate with engineers and product managers on cross-functional initiatives.
`;
    const dna = extractSemanticRoleDeterministically(jd);
    const collabResp = dna.responsibilities.find(r => r.source_text.toLowerCase().includes("collaborate"));

    assert.ok(collabResp, "Should classify collaboration as responsibility");
    assert.equal(collabResp.category, "RESPONSIBILITY");
    assert.equal(collabResp.mandatory, false);

    // Verify it was NOT placed in must-have screening criteria
    const mustHave = dna.mustHaves.find(m => m.source_text.toLowerCase().includes("collaborate"));
    assert.equal(mustHave, undefined, "Collaboration task must NOT be a mandatory qualification");
  });

  // ────────────────────────────────────────────────────────────
  // POST-LLM VALIDATION GUARD: ANTI-HALLUCINATION ENFORCEMENT
  // ────────────────────────────────────────────────────────────
  it("Post-LLM guard downgrades task verbs from MUST_HAVE to RESPONSIBILITY and rejects vendor hallucinations", () => {
    const mockDna = {
      roleTitle: "AI Engineer",
      department: "AI",
      seniority: "Junior" as const,
      targetHires: 1,
      workMode: "Remote" as const,
      domainContext: ["Generative AI"],
      mustHaves: [
        {
          id: "m-1",
          canonical_name: "Build Data Pipelines",
          category: "MUST_HAVE" as const,
          subtype: "operational_task" as const,
          mandatory: true,
          confidence: 0.9,
          source_text: "Build data preprocessing pipelines for ML models.",
          source_section: "Responsibilities",
          rationale: "Task extracted from JD.",
          evidence_signals: ["Projects"],
          verification_strategy: ["Implementation > Claim"],
          ambiguity_status: "CLEAR" as const
        },
        {
          id: "m-2",
          canonical_name: "AWS",
          category: "MUST_HAVE" as const,
          subtype: "technical_skill" as const,
          mandatory: true,
          confidence: 0.9,
          source_text: "Experience with cloud platforms.",
          source_section: "Qualifications",
          rationale: "Cloud platforms extracted.",
          evidence_signals: ["Cloud project"],
          verification_strategy: ["Implementation > Claim"],
          ambiguity_status: "CLEAR" as const
        }
      ],
      preferred: [],
      eligibility: [],
      responsibilities: [],
      evidenceSignals: [],
      constraints: [],
      ambiguities: [],
      summary: {
        mustHaveCount: 2,
        preferredCount: 0,
        eligibilityCount: 0,
        responsibilityCount: 0,
        evidenceSignalCount: 0,
        constraintCount: 0,
        ambiguityCount: 0
      }
    };

    const sourceJd = `
Responsibilities:
Build data preprocessing pipelines for ML models.

Qualifications:
Experience with cloud platforms.
`;

    const validated = postValidateAndConsolidate(mockDna, sourceJd);

    // 1. Task verb under responsibilities section was downgraded to RESPONSIBILITY
    assert.equal(validated.mustHaves.length, 0, "Should have 0 must-haves after guard");
    const resp = validated.responsibilities.find(r => r.canonical_name.includes("Build Data"));
    assert.ok(resp, "Should downgrade to responsibility");
    assert.equal(resp.category, "RESPONSIBILITY");
    assert.equal(resp.mandatory, false);

    // 2. Hallucinated AWS was corrected to Cloud Deployment with AMBIGUOUS status
    const cloud = validated.ambiguities.find(a => a.canonical_name === "Cloud Deployment");
    assert.ok(cloud, "Hallucinated AWS must be corrected to Cloud Deployment");
    assert.equal(cloud.ambiguity_status, "AMBIGUOUS");
    assert.equal(cloud.mandatory, false);
  });

  // ────────────────────────────────────────────────────────────
  // COMPLETE REAL-WORLD AI/ML ENGINEER INTERN JD TEST
  // ────────────────────────────────────────────────────────────
  it("End-to-End: Full AI/ML Engineer Intern JD produces accurate Role DNA with distinct categories and normalized skills", async () => {
    const fullAiMlInternJd = `
Title: AI/ML Engineer Intern
Department: Artificial Intelligence & Machine Learning
Location: Remote
Work Mode: Remote

About the Role:
We are looking for an AI/ML Engineer Intern to join our team. You will work on real-world machine learning systems and intelligent features.

Responsibilities:
- Build and evaluate machine learning models using Python.
- Develop data preprocessing pipelines.
- Integrate AI APIs into internal and external tools.
- Debug and optimize ML systems in staging and production.
- Write clean, maintainable code following best practices.
- Collaborate with engineers and product managers on cross-functional initiatives.

Must-Have Qualifications:
- Strong programming skills in Python.
- Solid understanding of machine learning fundamentals, supervised learning, and unsupervised learning.
- Hands-on experience with NumPy, Pandas, and scikit-learn.
- Strong knowledge of Data Structures & Algorithms.
- Experience with Git/GitHub for version control.
- Understanding of model evaluation metrics and validation techniques.

Preferred Qualifications:
- Experience with PyTorch or TensorFlow is a plus.
- Exposure to Large Language Models (LLMs), RAG architectures, embeddings, and vector databases.
- Familiarity with FastAPI for building APIs.
- Familiarity with Docker containerization.
- Experience with cloud platforms is desirable.
- Public GitHub repositories demonstrating meaningful implementation are preferred.

Eligibility & Requirements:
- Currently pursuing a Bachelor's or Master's degree in Computer Science, Data Science, AI/ML, or related technical field.
- Available for a 6-month internship.
`;

    const roleResult = await extractSemanticRoleFromJd(fullAiMlInternJd, "AI/ML Engineer Intern");
    const roleDna = roleResult.roleDna;
    assert.ok(roleDna, "Must produce Role DNA structure");

    // 1. Role Metadata
    assert.equal(roleDna.roleTitle, "AI/ML Engineer Intern");
    assert.equal(roleDna.workMode, "Remote");

    // 2. Core Must-Haves are normalized technical skills
    const mustHaveNames = roleDna.mustHaves.map(m => m.canonical_name);
    assert.ok(mustHaveNames.includes("Python"), "Must-Haves must include normalized Python");
    assert.ok(mustHaveNames.some(m => m.includes("Machine Learning")), "Must-Haves must include Machine Learning");
    assert.ok(mustHaveNames.includes("NumPy") || mustHaveNames.some(m => m.includes("NumPy")), "Must include NumPy");
    assert.ok(mustHaveNames.includes("Data Structures & Algorithms") || mustHaveNames.some(m => m.includes("Data Structures")), "Must include DSA");
    assert.ok(mustHaveNames.includes("Git/GitHub") || mustHaveNames.some(m => m.includes("Git")), "Must include Git/GitHub");

    // 3. Preferred capabilities are separated
    const prefNames = roleDna.preferred.map(p => p.canonical_name);
    assert.ok(prefNames.some(p => p.includes("PyTorch") || p.includes("TensorFlow")), "Preferred includes PyTorch / TensorFlow");
    assert.ok(prefNames.some(p => p.includes("FastAPI") || p.includes("Docker") || p.includes("LLM") || p.includes("RAG")), "Preferred includes modern AI / container tooling");

    // 4. Eligibility is separated from technical skills
    assert.ok(roleDna.eligibility.length > 0, "Eligibility conditions must be present");
    assert.ok(roleDna.eligibility.some(e => e.canonical_name.includes("Degree") || e.canonical_name.includes("Bachelor")), "Degree eligibility identified");

    // 5. Responsibilities are separated from candidate screening requirements
    assert.ok(roleDna.responsibilities.length >= 3, "Responsibilities must be extracted");
    for (const resp of roleDna.responsibilities) {
      assert.equal(resp.mandatory, false, "Responsibilities must NOT be mandatory disqualifiers");
    }

    // 6. Evidence Signals are separated from technical skills
    assert.ok(roleDna.evidenceSignals.length > 0, "Evidence signals identified");
    assert.ok(roleDna.evidenceSignals.some(s => s.canonical_name.includes("GitHub")), "GitHub identified as evidence signal");

    // 7. Ambiguous cloud platform is flagged as UNKNOWN / NEEDS_CONFIRMATION
    const hasAmbiguity = roleDna.ambiguities.some(a => a.canonical_name.includes("Cloud"));
    assert.ok(hasAmbiguity, "Cloud platforms must be marked as ambiguous needs confirmation");

    // 8. Downstream Tiered Requirements Compilation
    const tiered = compileTieredRequirementsFromStructured(roleResult.requirements);
    const totalWeight = tiered.reduce((sum, r) => sum + r.weightPct, 0);
    assert.equal(totalWeight, 100, "Tiered weights must sum to 100%");

    // Verify responsibilities were NOT compiled as Critical dealbreakers
    for (const t of tiered) {
      if (t.dealBreakerIfMissing) {
        assert.notEqual(t.category, "operational_task" as any);
        assert.ok(!t.name.toLowerCase().startsWith("build and evaluate machine"), "Operational task must not be dealbreaker");
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // TEST CASE 8: "Good-to-Have Requirements:" Header Classification
  // ────────────────────────────────────────────────────────────
  it("Case 8: 'Good-to-Have Requirements:' header classifies items as PREFERRED, not MUST_HAVE", () => {
    const jd = `
Title: ML Engineer
Must-Have Requirements:
- Strong Python programming skills.

Good-to-Have Requirements:
- Experience with PyTorch or TensorFlow.
- Experience with Docker containerization.
`;
    const dna = extractSemanticRoleDeterministically(jd);

    // Must-haves should only contain Python
    assert.ok(dna.mustHaves.some(m => m.canonical_name === "Python"), "Must-Haves includes Python");
    assert.equal(dna.mustHaves.some(m => m.canonical_name.includes("Docker")), false, "Docker must NOT be in must-haves");

    // Preferred must contain PyTorch and Docker
    assert.ok(dna.preferred.some(p => p.canonical_name.includes("Docker")), "Docker must be classified as preferred");
    assert.ok(dna.preferred.some(p => p.canonical_name.includes("PyTorch") || p.canonical_name.includes("TensorFlow")), "PyTorch/TensorFlow must be preferred");
    for (const pref of dna.preferred) {
      assert.equal(pref.mandatory, false, "Preferred items must not be mandatory");
      assert.equal(pref.importance, "preferred");
    }
  });

  // ────────────────────────────────────────────────────────────
  // TEST CASE 9: Non-bullet requirement lines in recognized sections
  // ────────────────────────────────────────────────────────────
  it("Case 9: Paragraph/non-bullet requirements in recognized sections are properly extracted", () => {
    const jd = `
Title: Backend Developer
Must-Have Requirements:
Strong proficiency in Python
Experience with PostgreSQL database
Hands-on experience with FastAPI framework
`;
    const dna = extractSemanticRoleDeterministically(jd);
    const names = dna.mustHaves.map(m => m.canonical_name);

    assert.ok(names.includes("Python"), "Should extract Python without bullets");
    assert.ok(names.includes("PostgreSQL"), "Should extract PostgreSQL without bullets");
    assert.ok(names.includes("FastAPI"), "Should extract FastAPI without bullets");
    assert.equal(dna.mustHaves.length >= 3, true, "Should extract all 3 non-bullet requirements");
  });

  // ────────────────────────────────────────────────────────────
  // TEST CASE 10: 30+ requirements without artificial truncation
  // ────────────────────────────────────────────────────────────
  it("Case 10: Large JD with 30+ distinct requirements extracts all without artificial truncation", () => {
    const largeJd = `
Title: Principal Full Stack & AI Architect
Must-Have Requirements:
- Python
- TypeScript
- JavaScript
- Go
- Rust
- C++
- Java
- Machine Learning
- Deep Learning
- Natural Language Processing
- Computer Vision
- Data Structures & Algorithms
- System Design
- PostgreSQL
- MongoDB
- Redis
- Docker
- Kubernetes
- CI/CD
- Linux

Preferred Qualifications:
- PyTorch
- TensorFlow
- FastAPI
- React
- Next.js
- GraphQL
- Vector Databases
- RAG
- Generative AI
- AI Agents
- Hackathons
- Open Source
`;
    const dna = extractSemanticRoleDeterministically(largeJd);
    const totalItems = dna.mustHaves.length + dna.preferred.length;

    assert.ok(totalItems >= 28, `Should extract at least 28 items, got ${totalItems}`);
    assert.ok(dna.mustHaves.length >= 16, `Must-haves should have >= 16 items, got ${dna.mustHaves.length}`);
    assert.ok(dna.preferred.length >= 10, `Preferred should have >= 10 items, got ${dna.preferred.length}`);
  });

  // ────────────────────────────────────────────────────────────
  // TEST CASE 11: AND/OR Conditions & Acceptable Options
  // ────────────────────────────────────────────────────────────
  it("Case 11: 'PyTorch or TensorFlow' extracts acceptable_options correctly", () => {
    const jd = `
Title: Deep Learning Engineer
Requirements:
- Hands-on experience with PyTorch or TensorFlow.
`;
    const dna = extractSemanticRoleDeterministically(jd);
    const dlReq = dna.mustHaves.find(m => m.canonical_name.includes("PyTorch") || m.canonical_name.includes("TensorFlow"));

    assert.ok(dlReq, "Should extract PyTorch / TensorFlow requirement");
    assert.ok(dlReq.acceptable_options && dlReq.acceptable_options.length >= 2, "Should identify acceptable options");
    assert.ok(dlReq.acceptable_options.includes("PyTorch") && dlReq.acceptable_options.includes("TensorFlow"));
  });

  // ────────────────────────────────────────────────────────────
  // TEST CASE 12: Empty or whitespace JD handling
  // ────────────────────────────────────────────────────────────
  it("Case 12: Empty or whitespace JD returns clean empty Role DNA", async () => {
    const emptyResult = await parseJobDescriptionSemantically("   \n   \t   ", "Default Role");
    assert.equal(emptyResult.roleTitle, "Default Role");
    assert.equal(emptyResult.mustHaves.length, 0);
    assert.equal(emptyResult.preferred.length, 0);
    assert.equal(emptyResult.responsibilities.length, 0);
    assert.equal(emptyResult.summary.mustHaveCount, 0);
  });

  // ────────────────────────────────────────────────────────────
  // TEST CASE 13: JD with only responsibilities
  // ────────────────────────────────────────────────────────────
  it("Case 13: JD with only responsibilities does NOT create mandatory screening requirements", () => {
    const jd = `
Title: ML Collaborator
Responsibilities:
- Build and evaluate machine learning models.
- Coordinate data collection with medical researchers.
- Write technical documentation and design specifications.
`;
    const dna = extractSemanticRoleDeterministically(jd);
    assert.equal(dna.mustHaves.length, 0, "No mandatory requirements should be created from pure tasks");
    assert.ok(dna.responsibilities.length >= 2, "Responsibilities should be captured");
    for (const r of dna.responsibilities) {
      assert.equal(r.mandatory, false);
      assert.equal(r.category, "RESPONSIBILITY");
    }
  });

  // ────────────────────────────────────────────────────────────
  // TEST CASE 14: Completeness Check & mergeRoleDnaResults
  // ────────────────────────────────────────────────────────────
  it("Case 14: mergeRoleDnaResults supplements incomplete LLM extraction with deterministic items", () => {
    const partialLlm = {
      roleTitle: "AI/ML Engineer Intern",
      department: "AI",
      seniority: "Junior" as const,
      targetHires: 1,
      workMode: "Remote" as const,
      location: "Remote",
      domainContext: ["Generative AI"],
      mustHaves: [
        {
          id: "llm-1",
          canonical_name: "Python",
          category: "MUST_HAVE" as const,
          subtype: "technical_skill" as const,
          mandatory: true,
          confidence: 0.98,
          source_text: "Strong programming skills in Python.",
          source_section: "Must-Have Qualifications",
          rationale: "LLM high-precision rationale for Python.",
          evidence_signals: ["GitHub", "Python Projects"],
          verification_strategy: ["Inspect Python repositories"],
          ambiguity_status: "CLEAR" as const
        }
      ],
      preferred: [],
      eligibility: [],
      responsibilities: [],
      evidenceSignals: [],
      constraints: [],
      ambiguities: [],
      summary: {
        mustHaveCount: 1,
        preferredCount: 0,
        eligibilityCount: 0,
        responsibilityCount: 0,
        evidenceSignalCount: 0,
        constraintCount: 0,
        ambiguityCount: 0
      }
    };

    const fullDeterministicJd = `
Title: AI/ML Engineer Intern
Must-Have Qualifications:
- Strong programming skills in Python.
- Hands-on experience with NumPy and Pandas.
- Strong knowledge of Data Structures & Algorithms.

Preferred Qualifications:
- Familiarity with FastAPI.
- Experience with Docker containerization.

Eligibility & Requirements:
- Currently pursuing a Bachelor's degree in Computer Science.
`;
    const deterministicDna = extractSemanticRoleDeterministically(fullDeterministicJd);
    const merged = mergeRoleDnaResults(partialLlm, deterministicDna, fullDeterministicJd);

    // 1. Python retained LLM rationale
    const pythonItem = merged.mustHaves.find(m => m.canonical_name === "Python");
    assert.ok(pythonItem, "Python must be in merged must-haves");
    assert.equal(pythonItem.rationale, "LLM high-precision rationale for Python.");

    // 2. Deterministic items that LLM missed were restored
    assert.ok(merged.mustHaves.some(m => m.canonical_name === "NumPy"), "NumPy should be restored");
    assert.ok(merged.mustHaves.some(m => m.canonical_name === "Pandas"), "Pandas should be restored");
    assert.ok(merged.mustHaves.some(m => m.canonical_name.includes("Data Structures")), "DSA should be restored");
    assert.ok(merged.preferred.some(p => p.canonical_name === "FastAPI"), "FastAPI should be restored");
    assert.ok(merged.preferred.some(p => p.canonical_name === "Docker"), "Docker should be restored");
    assert.ok(merged.eligibility.length > 0, "Eligibility should be restored");
  });

  // ────────────────────────────────────────────────────────────
  // TEST CASE 15: Enhanced Role DNA Types & Attributes
  // ────────────────────────────────────────────────────────────
  it("Case 15: Enhanced fields (requirement_type, importance, evidence_expectation) are cleanly populated", () => {
    const jd = `
Title: ML Platform Engineer
Requirements:
- Python
- Docker
- Machine Learning
- Bachelor's degree in Computer Science
- Minimum 2+ years of software experience
`;
    const dna = extractSemanticRoleDeterministically(jd);

    const python = dna.mustHaves.find(m => m.canonical_name === "Python");
    assert.ok(python);
    assert.equal(python.requirement_type, "programming_language");
    assert.equal(python.importance, "mandatory");
    assert.equal(python.evidence_expectation, "implementation");

    const docker = dna.mustHaves.find(m => m.canonical_name === "Docker");
    assert.ok(docker);
    assert.equal(docker.requirement_type, "tool");

    const ml = dna.mustHaves.find(m => m.canonical_name === "Machine Learning");
    assert.ok(ml);
    assert.equal(ml.requirement_type, "domain_knowledge");

    const degree = dna.eligibility.find(e => e.canonical_name.includes("Degree") || e.canonical_name.includes("Bachelor"));
    assert.ok(degree);
    assert.equal(degree.requirement_type, "education");
    assert.equal(degree.evidence_expectation, "certification");
  });
});
