/**
 * COGNALYZE — MASTER EVIDENCE ENGINE TEST SUITE
 * 
 * Implements all 15 automated self-tests specified in Section 31:
 * - TEST 1: 100% supported resume (no evidence gaps)
 * - TEST 2: 0% evidence (zero fabricated claims)
 * - TEST 3: 70% aligned resume (deterministic weights)
 * - TEST 4: Keyword-only resume (CLAIM_ONLY, never SUPPORTED)
 * - TEST 5: Related-but-different technologies (PostgreSQL vs MongoDB -> no cross-inference)
 * - TEST 6: Claim without proof (CLAIM_ONLY, not SUPPORTED)
 * - TEST 7: Conflicting sources (CONTRADICTED / potential inconsistency)
 * - TEST 8: Duplicate project evidence (deduplicated evidence entities)
 * - TEST 9: Same evidence supporting multiple requirements (no evidence inflation)
 * - TEST 10: External URL inaccessible (SOURCE_INACCESSIBLE, never verified)
 * - TEST 11: Empty skills section (zero hallucinated skills)
 * - TEST 12: Resume rewrite (traceable to original evidence IDs)
 * - TEST 13: Duplicate interview questions (semantic deduplication)
 * - TEST 14: Score calculation (displayed score matches independent recalculation)
 * - TEST 15: Requirement count (mathematical invariant: supported + partial + claimed + not_evidenced + contradicted = total requirements)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runCanonicalResultEngine } from '../lib/ai/result-engine';
import { parseResume } from '../lib/ai/result-engine/resume-engine';
import { parseJobDescription } from '../lib/ai/result-engine/jd-engine';
import { calculateDeterministicScore, validateScoreIntegrity } from '../lib/ai/result-engine/score-engine';
import { inspectGithubRepository } from '../lib/evidence/source-verifier';

describe('COGNALYZE MASTER EVIDENCE ENGINE — 15 AUTOMATED INVARIANTS', () => {

  // ─────────────────────────────────────────────────────────────
  // TEST 1: 100% supported resume -> No evidence gaps
  // ─────────────────────────────────────────────────────────────
  it('TEST 1: 100% supported resume produces zero evidence gaps and 100% score', async () => {
    const resume = `
Jane Doe
Email: jane@example.com
Projects:
FastAPI Microservices Platform
Architected and developed high-throughput backend services using Python and FastAPI.
Integrated PostgreSQL relational database with SQLAlchemy ORM and connection pooling.
`;
    const jd = `
Job Title: Python Backend Engineer
Required: Python
Required: FastAPI
Required: PostgreSQL
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const gaps = result.matches.filter((m) => m.status === 'EVIDENCE_GAP' || m.status === 'MISSING');
    assert.strictEqual(gaps.length, 0, 'Must have zero evidence gaps for 100% supported candidate');
    assert.strictEqual(result.score.overallEvidenceMatch, 100, 'Score must be 100%');
    assert.strictEqual(result.score.summaryCounts.supported, result.requirements.length);
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 2: 0% evidence -> No fabricated claims
  // ─────────────────────────────────────────────────────────────
  it('TEST 2: 0% evidence resume produces zero fabricated claims and zero score', async () => {
    const resume = `
John Graphic
Email: john@design.com
Summary: Creative graphic designer with 5 years experience in Photoshop and Illustrator.
Projects:
Brand Identity
Designed corporate logos and marketing brochures using Figma and Adobe InDesign.
`;
    const jd = `
Job Title: Distributed Systems Engineer
Required: Rust
Required: Kubernetes
Required: Apache Kafka
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const supported = result.matches.filter((m) => m.status === 'SUPPORTED');
    assert.strictEqual(supported.length, 0, 'Must have 0 supported requirements');
    assert.strictEqual(result.score.overallEvidenceMatch, 0, 'Score must be 0%');
    assert.strictEqual(result.strengths.length, 0, 'Must have 0 strengths for unevidenced candidate');
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 3: 70% aligned resume -> Supported + evidence gaps correctly represented
  // ─────────────────────────────────────────────────────────────
  it('TEST 3: 70% aligned resume correctly represents supported items and evidence gaps', async () => {
    const resume = `
Alice Dev
Email: alice@example.com
Projects:
ML Pipeline
Built end-to-end Machine Learning pipelines using Python and Scikit-learn.
Implemented data preprocessing routines with Pandas.
`;
    const jd = `
Job Title: Machine Learning Engineer
Must-Have: Python
Must-Have: Machine Learning
Nice-to-Have: AWS
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const pythonMatch = result.matches.find((m) => m.requirementName.toLowerCase().includes('python'));
    const mlMatch = result.matches.find((m) => m.requirementName.toLowerCase().includes('machine learning'));
    const awsMatch = result.matches.find((m) => m.requirementName.toLowerCase().includes('aws'));

    assert.ok(pythonMatch && pythonMatch.status === 'SUPPORTED', 'Python must be SUPPORTED');
    assert.ok(mlMatch && mlMatch.status === 'SUPPORTED', 'Machine Learning must be SUPPORTED');
    assert.ok(awsMatch && awsMatch.status === 'EVIDENCE_GAP', 'AWS must be EVIDENCE_GAP');
    assert.ok(result.score.overallEvidenceMatch >= 80, 'Score reflects supported critical requirements');
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 4: Keyword-only resume -> Keywords alone must not create strong evidence
  // ─────────────────────────────────────────────────────────────
  it('TEST 4: Keyword-only resume classifies skills as CLAIM_ONLY, never SUPPORTED', async () => {
    const resume = `
Bob Candidate
Email: bob@test.com
Technical Skills: Docker, Kubernetes, AWS, PostgreSQL, React
`;
    const jd = `
Job Title: DevOps Engineer
Required: Docker
Required: Kubernetes
`;
    const result = await runCanonicalResultEngine(resume, jd);
    for (const match of result.matches) {
      assert.notStrictEqual(match.status, 'SUPPORTED', 'Keyword mention in skills section cannot be SUPPORTED');
      assert.strictEqual(match.status, 'CLAIM_ONLY', 'Must be classified as CLAIM_ONLY');
      assert.strictEqual(match.verificationStatus, 'SELF_CLAIM');
    }
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 5: Related-but-different technologies -> No cross-inference
  // ─────────────────────────────────────────────────────────────
  it('TEST 5: PostgreSQL in resume does NOT satisfy MongoDB in JD (no cross-inference)', async () => {
    const resume = `
Dev User
Email: dev@test.com
Projects:
Relational Data Store
Implemented high-concurrency database queries and tables using PostgreSQL.
`;
    const jd = `
Job Title: Database Engineer
Required: MongoDB
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const mongoMatch = result.matches.find((m) => m.requirementName.toLowerCase().includes('mongo'));
    assert.ok(mongoMatch, 'MongoDB requirement must be present');
    assert.strictEqual(mongoMatch.status, 'EVIDENCE_GAP', 'MongoDB must be EVIDENCE_GAP');
    assert.strictEqual(mongoMatch.relationship, 'NO_EVIDENCE');
    assert.notStrictEqual(mongoMatch.status, 'SUPPORTED');
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 6: Claim without proof -> CLAIMED, not SUPPORTED
  // ─────────────────────────────────────────────────────────────
  it('TEST 6: "Expert in AWS" in summary without project implementation is CLAIM_ONLY', async () => {
    const resume = `
Sam Cloud
Email: sam@test.com
Summary: Expert in AWS cloud infrastructure and microservice architectures.
Projects:
Local Tool
Created local command-line script in Python.
`;
    const jd = `
Job Title: Cloud Architect
Required: AWS
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const awsMatch = result.matches.find((m) => m.requirementName.toLowerCase().includes('aws'));
    assert.ok(awsMatch, 'AWS requirement must be present');
    assert.strictEqual(awsMatch.status, 'CLAIM_ONLY');
    assert.strictEqual(awsMatch.verificationStatus, 'SELF_CLAIM');
    assert.notStrictEqual(awsMatch.status, 'SUPPORTED');
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 7: Conflicting sources -> CONTRADICTED / potential inconsistency
  // ─────────────────────────────────────────────────────────────
  it('TEST 7: Discrepancy between resume and LinkedIn flags CONTRADICTION', async () => {
    const resume = `
Alex Student
Email: alex@university.edu
Education:
Currently pursuing B.Tech in Computer Science, expected 2026.
Technical Skills: Python
`;
    const jd = `
Job Title: Software Engineer
Required: Python
`;
    const result = await runCanonicalResultEngine(resume, jd, {
      overrides: {
        linkedinMock: {
          accessible: true,
          profileName: 'Alex Student',
          educationStatus: 'GRADUATED',
          checks: [
            { check: 'LinkedIn profile accessible', result: 'PASSED' },
            { check: 'Education status verified', result: 'PASSED', detail: 'Graduated' },
          ],
        },
      },
    });

    const contradictions = result.evidenceLedger?.filter((e) => e.verification_status === 'CONTRADICTED');
    assert.ok(contradictions && contradictions.length > 0, 'Must record contradiction in evidence ledger');
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 8: Duplicate project evidence -> Deduplicated evidence
  // ─────────────────────────────────────────────────────────────
  it('TEST 8: Multiple bullets under one project heading group into single project entity', async () => {
    const resume = `
Candidate Dev
Email: candidate@test.com
Projects:
Document Parser Platform
Built scalable document parsing system using Python.
Implemented regular expression and AST tokenization modules.
Deployed system for batch file processing.
`;
    const parsed = parseResume(resume);
    assert.strictEqual(parsed.projects.length, 1, 'Must recognize exactly 1 project entity');
    assert.strictEqual(parsed.projects[0].bullets.length, 3, 'Must attach all 3 bullets to the project');
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 9: Same evidence supporting multiple requirements -> No evidence inflation
  // ─────────────────────────────────────────────────────────────
  it('TEST 9: Single sentence mentioning Python and FastAPI remains ONE underlying evidence item (Rule 12)', async () => {
    const resume = `
John Doe
Email: john@test.com
Projects:
API Hub
Built high-speed RESTful microservices in Python using FastAPI.
`;
    const parsed = parseResume(resume);
    const bulletEvidence = parsed.evidenceItems.find((e) => e.text.includes('microservices'));
    assert.ok(bulletEvidence, 'Must have project bullet evidence');
    assert.ok(
      bulletEvidence.technologies.includes('Python') && bulletEvidence.technologies.includes('FastAPI'),
      'Single sentence supports multiple technologies'
    );
    // Rule 12: Single sentence must be ONE underlying evidence item, not duplicated into multiple items
    const matchingSentences = parsed.evidenceItems.filter((e) => e.text === bulletEvidence.text);
    assert.strictEqual(matchingSentences.length, 1, 'Sentence must remain ONE underlying source item (no inflation)');
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 10: External URL inaccessible -> SOURCE_INACCESSIBLE
  // ─────────────────────────────────────────────────────────────
  it('TEST 10: Inaccessible GitHub URL is marked INACCESSIBLE, never verified', async () => {
    const inspection = await inspectGithubRepository('https://github.com/definitely-nonexistent-user-xyz-12345/repo-does-not-exist');
    assert.strictEqual(inspection.accessible, false);
    assert.strictEqual(inspection.verificationStatus, 'INACCESSIBLE');
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 11: Empty skills section -> No hallucinated skills
  // ─────────────────────────────────────────────────────────────
  it('TEST 11: Resume with empty skills section produces zero hallucinated skills', async () => {
    const resume = `
Sarah Minimal
Email: sarah@example.com
Summary: Student seeking opportunities.
Education:
B.S. in Mathematics - 2024
`;
    const parsed = parseResume(resume);
    assert.strictEqual(parsed.skillsCategorized.length, 0, 'Must have zero categorized skills');
    assert.strictEqual(parsed.languages?.length || 0, 0, 'Must have zero hallucinated languages');
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 12: Resume rewrite -> Every bullet traceable to original evidence
  // ─────────────────────────────────────────────────────────────
  it('TEST 12: Every rewritten bullet contains original evidence ID linkage', async () => {
    const resume = `
Taylor Swift
Email: taylor@example.com
Projects:
Data Analyzer
Developed statistical data analyzer using Python and NumPy.
`;
    const jd = `
Job Title: Python Engineer
Required: Python
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const rewrittenBullets = result.resumeRewrite.projects.flatMap((p) => p.bullets);
    assert.ok(rewrittenBullets.length > 0, 'Must generate rewritten project bullets');
    for (const b of rewrittenBullets) {
      assert.ok(b.original_evidence_ids && b.original_evidence_ids.length > 0, 'Bullet must link to original evidence IDs');
      assert.ok(b.sourceVerbatimQuote.length > 0, 'Bullet must preserve verbatim quote');
    }
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 13: Duplicate interview questions -> Semantic deduplication
  // ─────────────────────────────────────────────────────────────
  it('TEST 13: Interview probes are semantically deduplicated (no duplicate questions)', async () => {
    const resume = `
Jane Code
Email: jane@test.com
Projects:
Alpha Service
Built data streaming engine in Python.
Optimized batch memory allocation.
Configured internal queue buffers.
`;
    const jd = `
Job Title: Backend Developer
Required: Python
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const questions = result.interviewFocus.probeQuestions;
    const projectQuestions = questions.filter((q) => q.questionType === 'PROJECT_OWNERSHIP');
    assert.strictEqual(projectQuestions.length, 1, 'Must have exactly 1 project ownership question for Alpha Service (not 3)');
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 14: Score calculation -> Exactly matches deterministic calculation
  // ─────────────────────────────────────────────────────────────
  it('TEST 14: Displayed score exactly matches independent deterministic calculation', async () => {
    const resume = `
Dev Person
Email: dev@person.com
Projects:
Web System
Implemented REST API services using Python and FastAPI.
`;
    const jd = `
Job Title: Python Developer
Must-Have: Python
Must-Have: FastAPI
Nice-to-Have: Docker
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const validation = validateScoreIntegrity(result.requirements, result.matches, result.score.overallEvidenceMatch);
    assert.strictEqual(validation.valid, true, 'Score integrity validation must pass');
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 15: Requirement count -> Mathematical invariant
  // ─────────────────────────────────────────────────────────────
  it('TEST 15: Mathematical invariant: supported + partial + claimed + not_evidenced + contradicted = total', async () => {
    const resume = `
Candidate Q
Email: q@candidate.com
Technical Skills: Docker
Projects:
App Service
Built backend microservice in Python.
`;
    const jd = `
Job Title: Cloud Software Engineer
Must-Have: Python
Important: Docker
Preferred: Kubernetes
Preferred: AWS
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const counts = result.score.summaryCounts;
    const totalCalculated =
      counts.supported +
      counts.partial +
      counts.claimOnly +
      counts.evidenceGaps +
      counts.skillGaps +
      counts.missing +
      counts.contradicted;

    assert.strictEqual(
      totalCalculated,
      result.requirements.length,
      `Sum of requirement categories (${totalCalculated}) must equal total requirements count (${result.requirements.length})`
    );
  });

});
