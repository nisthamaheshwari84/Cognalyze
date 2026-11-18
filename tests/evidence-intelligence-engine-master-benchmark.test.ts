/**
 * COGNALYZE EVIDENCE INTELLIGENCE ENGINE — MASTER BENCHMARK TEST SUITE
 * 12 Candidate-JD Scenarios testing:
 * - 5-Level Evidence Strength Classification
 * - Decomposed Compound Requirements & Role Archetypes
 * - Anti-Inflation Math (resolving 88% bug on keyword stuffing)
 * - Deterministic Points Audit (SUM(earned)/SUM(possible))
 * - Dedicated Risk & Anomaly Detection (Contradictions, Inflated Metrics, Stuffing)
 * - Fresher Fairness & Honest Benchmarking
 * - Zero Fabrication & Strict Non-Equivalence
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { runCanonicalResultEngine } from '../lib/ai/result-engine';

test('MASTER BENCHMARK: 12-Scenario Candidate-JD Intelligence Suite', async (t) => {

  // =========================================================================
  // SCENARIO 1: Strong Candidate with Substantial Evidence
  // =========================================================================
  await t.test('Scenario 1: Strong candidate with substantial implementation evidence', async () => {
    const jd = `
Role: Senior Backend Engineer
Requirements:
- Python: Advanced server-side development
- FastAPI: Building high-performance asynchronous REST APIs
- PostgreSQL: Relational database design and query optimization
- Docker: Containerization and deployment
`;

    const resume = `
Alex Mercer
alex@example.com | github.com/alexmercer

PROJECTS
E-Commerce Engine | github.com/alexmercer/ecommerce
- Architected and deployed microservices backend using FastAPI and Python handling 500 requests per second.
- Implemented PostgreSQL database schemas with connection pooling and optimized complex relational joins.
- Authored Dockerfile and multi-stage container configurations for automated deployment.

EXPERIENCE
Backend Engineer | TechFlow Corp (2022 - 2024)
- Developed distributed data processing workers using Python and asyncio.
- Maintained Docker orchestration pipelines in staging and production environments.
`;

    const result = await runCanonicalResultEngine(resume, jd);

    assert.ok(result.score.overallEvidenceMatch >= 60, `Expected high score, got ${result.score.overallEvidenceMatch}`);
    assert.strictEqual(result.score.pointsAuditPassed, true);
    assert.ok(result.score.levelCounts!.level3Implementation >= 2 || result.score.levelCounts!.level4ArtifactBacked >= 1);
    assert.strictEqual(result.validation.auditPassed, true);
    assert.strictEqual(result.validation.zeroFabricationCertified, true);
  });

  // =========================================================================
  // SCENARIO 2: Keyword-Stuffed Resume (Resolving the 88% Bug)
  // =========================================================================
  await t.test('Scenario 2: Keyword-stuffed resume is downgraded to Level 2 Contextual, avoiding score inflation', async () => {
    const jd = `
Role: AI/ML Engineer
Requirements:
- Python
- PyTorch
- FastAPI
- Docker
- Kubernetes
- Redis
- PostgreSQL
- Vector Search
`;

    // 8 tools crammed into a single vague bullet
    const stuffedResume = `
Jordan Lee
jordan@example.com

SKILLS
Python, PyTorch, FastAPI, Docker, Kubernetes, Redis, PostgreSQL, Vector Search

PROJECTS
AI Platform
- Worked on AI platform leveraging Python, PyTorch, FastAPI, Docker, Kubernetes, Redis, PostgreSQL, Vector Search for analytics.
`;

    const result = await runCanonicalResultEngine(stuffedResume, jd);

    // Previously, this candidate scored 88% due to binary SUPPORTED mapping!
    // With multi-skill chain deduplication, it must score realistically low/moderate (under 55%)
    assert.ok(
      result.score.overallEvidenceMatch <= 55,
      `Keyword stuffing should not inflate score above 55%. Got ${result.score.overallEvidenceMatch}%`
    );

    // Multi-skill stuffing risk must be flagged
    const stuffingRisk = result.risks.find((r) => r.flagType === 'MULTI_TOOL_STUFFING');
    assert.ok(stuffingRisk, 'Expected MULTI_TOOL_STUFFING risk to be flagged');
    assert.strictEqual(stuffingRisk?.category, 'EVIDENCE_CONCERN');

    // Level 2 contextual count should be high
    assert.ok(result.score.levelCounts!.level2Contextual >= 3, 'Multi-skill bullets should map to Level 2 Contextual');
  });

  // =========================================================================
  // SCENARIO 3: Candidate with Claims but No Implementation Details
  // =========================================================================
  await t.test('Scenario 3: Claims in skills/summary without implementation map to Level 1 Mentioned Only', async () => {
    const jd = `
Role: Cloud Engineer
Requirements:
- Terraform
- Kubernetes
- AWS
`;

    const claimedResume = `
Taylor Swift
taylor@example.com

PROFESSIONAL SUMMARY
Experienced technologist with broad skills in Terraform, Kubernetes, and AWS infrastructure.

TECHNICAL SKILLS
- Cloud: AWS, GCP
- DevOps: Terraform, Kubernetes

PROJECTS
Personal Portfolio Website
- Built static portfolio website using HTML, CSS, and basic JavaScript.
`;

    const result = await runCanonicalResultEngine(claimedResume, jd);

    // Terraform, Kubernetes, AWS are claimed in skills/summary only -> Level 1 Mentioned Only (10%)
    assert.ok(result.score.levelCounts!.level1Mentioned >= 2, 'Claimed skills should map to Level 1');
    assert.ok(result.score.overallEvidenceMatch <= 25, `Claim-only candidate should score <= 25%, got ${result.score.overallEvidenceMatch}%`);
    assert.strictEqual(result.strengths.length, 0, 'Level 1 claims must not be listed as strengths');

    // Unsupported skill claim risks must be identified
    const skillRisks = result.risks.filter((r) => r.flagType === 'UNSUPPORTED_SKILL_CLAIM');
    assert.ok(skillRisks.length > 0, 'Expected unsupported skill claim risks');
  });

  // =========================================================================
  // SCENARIO 4: Candidate with Strong Projects but Limited Work Experience (Fresher Fairness)
  // =========================================================================
  await t.test('Scenario 4: Early-career student with deep projects is evaluated fairly on technical merit', async () => {
    const jd = `
Role: Junior Software Engineer
Requirements:
- Python
- SQL
- Git
`;

    const studentResume = `
Samantha Ray
samantha@university.edu

EDUCATION
Bachelor of Technology in Computer Science (Expected 2025)
GPA: 3.8 / 4.0

PROJECTS
Algorithmic Trading Backtester | github.com/sray/backtester
- Implemented event-driven backtesting engine in Python utilizing NumPy and Pandas with unit tests.
- Designed SQL schemas for historical tick storage and optimized temporal queries with indexed timestamps.
- Managed version control across 150+ Git commits with automated branch validation.

Campus Food Delivery Portal | github.com/sray/delivery
- Built relational database models in SQL managing users, menus, and order states.
`;

    const result = await runCanonicalResultEngine(studentResume, jd);

    assert.ok(result.score.overallEvidenceMatch >= 60, `Student with strong projects should score well on technical merit. Got ${result.score.overallEvidenceMatch}%`);
    assert.strictEqual(result.experienceAnalysis.professionalExperience.level, 'NO_PROFESSIONAL_FOUND');
    assert.strictEqual(result.experienceAnalysis.projectEvidence.level, 'MODERATE');
    assert.ok(result.experienceAnalysis.fresherFairnessAssessment.includes('authentic code artifacts'));
    
    // Early career informational note should be recorded
    const earlyCareerRisk = result.risks.find((r) => r.flagType === 'EARLY_CAREER_CONTEXT');
    assert.ok(earlyCareerRisk, 'Expected EARLY_CAREER_CONTEXT risk tag');
    assert.strictEqual(earlyCareerRisk?.category, 'INFORMATIONAL');
  });

  // =========================================================================
  // SCENARIO 5: Unrelated Professional Experience
  // =========================================================================
  await t.test('Scenario 5: Unrelated professional experience does not falsely satisfy software requirements', async () => {
    const jd = `
Role: Machine Learning Engineer
Requirements:
- PyTorch
- Model Training
- Python
`;

    const unrelatedResume = `
Marcus Brody
marcus@salescorp.com

EXPERIENCE
Senior Account Executive | Enterprise Sales Corp (2020 - 2024)
- Managed pipeline of 40 enterprise B2B software accounts closing $1.5M in ARR.
- Led weekly client demos and coordinated customer success onboarding calls.
- Supervised team of 4 business development representatives.
`;

    const result = await runCanonicalResultEngine(unrelatedResume, jd);

    // Sales experience cannot satisfy ML requirements
    assert.strictEqual(result.score.overallEvidenceMatch, 0);
    assert.strictEqual(result.score.levelCounts!.level0NoEvidence, 3);
    assert.strictEqual(result.strengths.length, 0);
    assert.ok(result.finalVerdict.primaryDocumentedLimitations.length > 0);
  });

  // =========================================================================
  // SCENARIO 6: Partial Skill Coverage & Points Reconciliation
  // =========================================================================
  await t.test('Scenario 6: Partial skill coverage strictly reconciles earned vs possible points', async () => {
    const jd = `
Role: Full Stack Engineer
Requirements:
- React: Frontend UI
- Go: Backend microservices
- Docker: Containerization
- Kubernetes: Cluster orchestration
`;

    const partialResume = `
Devin Vance
devin@example.com

SKILLS
React, Docker

PROJECTS
Task Manager App
- Developed responsive web application interface using React and state hooks.
`;

    const result = await runCanonicalResultEngine(partialResume, jd);

    // React has implementation (Level 3)
    // Docker is claimed in skills only (Level 1)
    // Go and Kubernetes are missing (Level 0)
    const lc = result.score.levelCounts!;
    assert.strictEqual(
      lc.level5Verified + lc.level4ArtifactBacked + lc.level3Implementation + lc.level2Contextual + lc.level1Mentioned + lc.level0NoEvidence,
      result.requirements.length
    );
    assert.strictEqual(result.score.pointsAuditPassed, true);
    assert.strictEqual(
      result.score.overallEvidenceMatch,
      Math.round((result.score.totalEarnedPoints / result.score.totalPossiblePoints) * 100)
    );
  });

  // =========================================================================
  // SCENARIO 7: Contradictory Employment Dates & Timeline Anomalies
  // =========================================================================
  await t.test('Scenario 7: Date inconsistencies trigger Material Contradiction risks', async () => {
    const jd = `
Role: Software Engineer
Requirements:
- Java
`;

    // End date earlier than start date
    const dateGlitchResume = `
Arthur Pendelton
arthur@example.com

EXPERIENCE
Software Developer | Inverted Timelines LLC (2024 - 2021)
- Developed enterprise Java services and maintained Spring Boot endpoints.
`;

    const result = await runCanonicalResultEngine(dateGlitchResume, jd);

    const dateRisk = result.risks.find((r) => r.flagType === 'DATE_INCONSISTENCY');
    assert.ok(dateRisk, 'Expected DATE_INCONSISTENCY risk flag');
    assert.strictEqual(dateRisk?.category, 'MATERIAL_CONTRADICTION');
    assert.strictEqual(dateRisk?.severity, 'HIGH');
  });

  // =========================================================================
  // SCENARIO 8: Outsized Ungrounded Metric Detection
  // =========================================================================
  await t.test('Scenario 8: Outsized or unanchored metrics are flagged as Evidence Concerns', async () => {
    const jd = `
Role: Growth Engineer
Requirements:
- Python
`;

    const hyperboleResume = `
Felix Vance
felix@example.com

PROJECTS
Marketing Bot
- Developed Python script that boosted conversion rates by 800% overnight with zero baseline marketing spend.
`;

    const result = await runCanonicalResultEngine(hyperboleResume, jd);

    const metricRisk = result.risks.find((r) => r.flagType === 'UNATTRIBUTED_METRIC');
    assert.ok(metricRisk, 'Expected UNATTRIBUTED_METRIC risk flag');
    assert.strictEqual(metricRisk?.category, 'EVIDENCE_CONCERN');
    assert.ok(metricRisk?.claim.includes('800%'));
  });

  // =========================================================================
  // SCENARIO 9: Inaccessible External Source Handling
  // =========================================================================
  await t.test('Scenario 9: Inaccessible repository link is flagged without crashing or inventing code', async () => {
    const jd = `
Role: Frontend Engineer
Requirements:
- TypeScript
`;

    const brokenLinkResume = `
Chloe Bennett
chloe@example.com | github.com/chloe-nonexistent-999

PROJECTS
Design System | github.com/chloe-nonexistent-999/design-system
- Authored reusable components using TypeScript.
`;

    const result = await runCanonicalResultEngine(brokenLinkResume, jd, {
      overrides: {
        githubMock: {
          accessible: false,
        },
      },
    });

    assert.ok(result.discoveredSources?.some((s) => s.verification_status === 'INACCESSIBLE'));
    const sourceRisk = result.risks.find((r) => r.flagType === 'INACCESSIBLE_SOURCE');
    assert.ok(sourceRisk, 'Expected INACCESSIBLE_SOURCE risk flag');
    assert.strictEqual(sourceRisk?.category, 'NEEDS_CLARIFICATION');
  });

  // =========================================================================
  // SCENARIO 10: Artifact-Backed & Independently Verified Evidence
  // =========================================================================
  await t.test('Scenario 10: Verified GitHub inspection produces Level 4 / 5 Evidence', async () => {
    const jd = `
Role: Full Stack Engineer
Requirements:
- TypeScript
- Next.js
`;

    const verifiedResume = `
David Kim
david@example.com | github.com/davidkim

PROJECTS
NextApp | github.com/davidkim/nextapp
- Developed full-stack SaaS platform using TypeScript and Next.js App Router.
`;

    const result = await runCanonicalResultEngine(verifiedResume, jd, {
      overrides: {
        githubMock: {
          accessible: true,
          files: {
            'package.json': JSON.stringify({ dependencies: { next: '^14.0.0', typescript: '^5.0.0' } }),
            'app/page.tsx': 'export default function Page() { return <div>NextApp</div>; }',
          },
        },
      },
    });

    // TypeScript & Next.js should achieve Level 4 or Level 5
    const tsMatch = result.matches.find((m) => m.requirementName.toLowerCase().includes('typescript'));
    assert.ok(tsMatch);
    assert.ok(
      tsMatch.evidenceStrengthLevel === 'LEVEL_4_ARTIFACT_BACKED' ||
      tsMatch.evidenceStrengthLevel === 'LEVEL_5_INDEPENDENTLY_VERIFIED'
    );
    assert.strictEqual(tsMatch.status, 'SUPPORTED');
  });

  // =========================================================================
  // SCENARIO 11: Missing Education Section (Zero Fabrication)
  // =========================================================================
  await t.test('Scenario 11: Resume without education section does not fabricate fake degrees', async () => {
    const jd = `
Role: Systems Engineer
Requirements:
- C++
- Linux
`;

    const noEduResume = `
Ethan Hunt
ethan@imf.org

PROJECTS
Linux Kernel Module
- Wrote low-level C++ drivers for Linux operating system input devices.
`;

    const result = await runCanonicalResultEngine(noEduResume, jd);

    assert.strictEqual(result.candidate.education.length, 0);
    assert.strictEqual(result.resumeRewrite.education.length, 0);
    assert.strictEqual(result.validation.zeroFabricationCertified, true);
  });

  // =========================================================================
  // SCENARIO 12: Completely Unrelated Role Application
  // =========================================================================
  await t.test('Scenario 12: Completely unrelated candidate receives 0% and honest gap analysis', async () => {
    const jd = `
Role: Computer Vision Research Scientist
Requirements:
- PyTorch
- OpenCV
- Convolutional Neural Networks
- CUDA
`;

    const civilEngineerResume = `
Robert Langdon
robert@archaeo.org

EDUCATION
Master of Arts in Symbology and History

EXPERIENCE
Field Researcher | Historical Artifacts Institute (2018 - 2024)
- Cataloged medieval manuscripts and conducted carbon dating field investigations.
- Published 3 monographs on European architecture and cryptology.
`;

    const result = await runCanonicalResultEngine(civilEngineerResume, jd);

    assert.strictEqual(result.score.overallEvidenceMatch, 0);
    assert.strictEqual(result.strengths.length, 0);
    assert.strictEqual(result.score.levelCounts!.level0NoEvidence, result.requirements.length);
    assert.ok(result.finalVerdict.oneLineVerdict.includes('not currently establish verified implementation evidence'));
    assert.strictEqual(result.validation.auditPassed, true);
  });

});
