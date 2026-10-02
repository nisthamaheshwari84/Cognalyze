/**
 * COGNALYZE — 20 ADVERSARIAL EVIDENCE HARDENING TESTS (SECTION 35)
 * 
 * Comprehensive regression and adversarial test suite proving:
 * - ZERO FABRICATION
 * - ZERO UNSUPPORTED INFERENCE
 * - ZERO PRIORITY MISCLASSIFICATION
 * - ZERO CROSS-SECTION CONTRADICTION
 * - ZERO SCORE MISMATCH
 * - ZERO FAKE IMPLEMENTATION EVIDENCE
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runCanonicalResultEngine } from '../lib/ai/result-engine';
import { calculateDeterministicScore } from '../lib/ai/result-engine/score-engine';
import { parseJobDescription } from '../lib/ai/result-engine/jd-engine';
import { parseResume } from '../lib/ai/result-engine/resume-engine';

describe('COGNALYZE — 20 ADVERSARIAL EVIDENCE HARDENING TESTS', () => {

  // 1. Python -> Python (Direct match, SUPPORTED)
  it('TEST 1: Python in project bullet directly matches Python JD requirement -> SUPPORTED', async () => {
    const resume = `
Jane Doe
Projects:
Backend Service
Engineered data processing pipeline using Python and Asyncio for event routing.
`;
    const jd = `
Must-Have: Python
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const match = result.matches.find((m) => m.requirementName.toLowerCase() === 'python');
    assert.ok(match, 'Match must exist for Python');
    assert.strictEqual(match.status, 'SUPPORTED', 'Python must be SUPPORTED');
    assert.strictEqual(match.relationship, 'DIRECT', 'Relationship must be DIRECT');
    assert.strictEqual(match.evidenceStrength, 'DIRECT', 'Evidence strength must be DIRECT');
  });

  // 2. SQL -> PostgreSQL (REJECTED, non-equivalence, not SUPPORTED)
  it('TEST 2: SQL experience does NOT prove PostgreSQL -> REJECTED / EVIDENCE_GAP', async () => {
    const resume = `
Jane Doe
Projects:
Data Store
Wrote relational queries and schema migrations in SQL.
`;
    const jd = `
Role: Database Developer
Must-Have: PostgreSQL
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const match = result.matches.find((m) => m.requirementName.toLowerCase() === 'postgresql');
    assert.ok(match, 'Match must exist for PostgreSQL');
    assert.notStrictEqual(match.status, 'SUPPORTED', 'SQL must NOT support PostgreSQL');
    assert.strictEqual(match.status, 'EVIDENCE_GAP');
    assert.ok(
      match.rejectedEvidence && match.rejectedEvidence.length > 0,
      'Must record rejected SQL evidence alternative'
    );
  });

  // 3. GitHub URL -> Git & Version Control (PROFILE_LINK, does not prove Git)
  it('TEST 3: GitHub URL alone does NOT prove Git & Version Control -> NOT SUPPORTED', async () => {
    const resume = `
John Doe
Links: https://github.com/johndoe
Summary:
Passionate software developer interested in web applications.
`;
    const jd = `
Role: Software Engineer
Requirement: Git & Version Control
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const gitMatch = result.matches.find((m) => m.requirementName.toLowerCase().includes('git'));
    assert.ok(gitMatch, 'Git match must exist');
    assert.notStrictEqual(gitMatch.status, 'SUPPORTED', 'GitHub URL must NOT support Git');
    assert.ok(
      gitMatch.status === 'EVIDENCE_GAP' || gitMatch.status === 'CLAIM_ONLY',
      'Git must be EVIDENCE_GAP or CLAIM_ONLY'
    );
  });

  // 4. REST API -> AWS (REJECTED, non-equivalence)
  it('TEST 4: REST API experience does NOT prove AWS -> REJECTED / EVIDENCE_GAP', async () => {
    const resume = `
Jane Doe
Projects:
Web App
Built scalable REST APIs for customer onboarding and authentication.
`;
    const jd = `
Must-Have: AWS
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const awsMatch = result.matches.find((m) => m.requirementName.toLowerCase() === 'aws');
    assert.ok(awsMatch, 'AWS match must exist');
    assert.strictEqual(awsMatch.status, 'EVIDENCE_GAP', 'REST API must NOT support AWS');
    assert.ok(
      awsMatch.rejectedEvidence && awsMatch.rejectedEvidence.some((r) => r.retrievedText.toLowerCase().includes('rest api')),
      'REST API must be recorded in rejected evidence for AWS'
    );
  });

  // 5. Docker -> AWS (REJECTED, non-equivalence)
  it('TEST 5: Docker containerization does NOT prove AWS platform -> REJECTED / EVIDENCE_GAP', async () => {
    const resume = `
Jane Doe
Projects:
DevOps Pipeline
Containerized microservices using Docker and multi-stage builds.
`;
    const jd = `
Must-Have: AWS
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const awsMatch = result.matches.find((m) => m.requirementName.toLowerCase() === 'aws');
    assert.ok(awsMatch, 'AWS match must exist');
    assert.strictEqual(awsMatch.status, 'EVIDENCE_GAP', 'Docker must NOT support AWS');
    assert.ok(
      awsMatch.rejectedEvidence && awsMatch.rejectedEvidence.length > 0,
      'Must record rejected Docker alternative'
    );
  });

  // 6. Generic Cloud -> AWS (REJECTED, non-equivalence)
  it('TEST 6: Generic cloud mention does NOT prove AWS -> REJECTED / EVIDENCE_GAP', async () => {
    const resume = `
Jane Doe
Projects:
Cloud Sync
Deployed backend service to cloud infrastructure with load balancer.
`;
    const jd = `
Must-Have: AWS
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const awsMatch = result.matches.find((m) => m.requirementName.toLowerCase() === 'aws');
    assert.ok(awsMatch, 'AWS match must exist');
    assert.strictEqual(awsMatch.status, 'EVIDENCE_GAP', 'Generic cloud must NOT support AWS');
  });

  // 7. AWS claim in summary -> AWS implementation (CLAIM_ONLY, never SUPPORTED)
  it('TEST 7: AWS claim in summary without project implementation -> CLAIM_ONLY', async () => {
    const resume = `
Jane Doe
Summary:
Experienced cloud developer with strong background in AWS and microservices.
Projects:
Chat App
Built web chat using Node.js and Socket.io.
`;
    const jd = `
Must-Have: AWS
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const awsMatch = result.matches.find((m) => m.requirementName.toLowerCase() === 'aws');
    assert.ok(awsMatch, 'AWS match must exist');
    assert.strictEqual(awsMatch.status, 'CLAIM_ONLY', 'Summary claim must be CLAIM_ONLY, never SUPPORTED');
    assert.strictEqual(awsMatch.relationship, 'CLAIM_ONLY');
  });

  // 8. FastAPI claim in summary -> FastAPI implementation (CLAIM_ONLY, never SUPPORTED)
  it('TEST 8: FastAPI claim in summary without implementation -> CLAIM_ONLY', async () => {
    const resume = `
Jane Doe
Summary:
Specialized in FastAPI and Python backend architectures.
Projects:
Data Visualizer
Created interactive charts using React and D3.
`;
    const jd = `
Must-Have: FastAPI
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const match = result.matches.find((m) => m.requirementName.toLowerCase() === 'fastapi');
    assert.ok(match, 'FastAPI match must exist');
    assert.strictEqual(match.status, 'CLAIM_ONLY', 'Summary claim must be CLAIM_ONLY');
  });

  // 9. PostgreSQL skill list -> PostgreSQL implementation (CLAIM_ONLY, never SUPPORTED)
  it('TEST 9: PostgreSQL listed in skills section without project usage -> CLAIM_ONLY', async () => {
    const resume = `
Jane Doe
Skills:
Databases: PostgreSQL, Redis
Projects:
Blog System
Developed static blog generator in Go.
`;
    const jd = `
Must-Have: PostgreSQL
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const match = result.matches.find((m) => m.requirementName.toLowerCase() === 'postgresql');
    assert.ok(match, 'PostgreSQL match must exist');
    assert.strictEqual(match.status, 'CLAIM_ONLY', 'Skills list without project is CLAIM_ONLY');
  });

  // 10. "Currently learning PostgreSQL" -> professional PostgreSQL (CLAIM_ONLY, never SUPPORTED)
  it('TEST 10: "Currently learning PostgreSQL" is classified CLAIM_ONLY, never SUPPORTED', async () => {
    const resume = `
Jane Doe
Projects:
Learning Track
Currently learning PostgreSQL database queries and indexing concepts.
`;
    const jd = `
Must-Have: PostgreSQL
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const match = result.matches.find((m) => m.requirementName.toLowerCase() === 'postgresql');
    assert.ok(match, 'PostgreSQL match must exist');
    assert.strictEqual(match.status, 'CLAIM_ONLY', 'In-progress learning must be CLAIM_ONLY');
  });

  // 11. Duplicate project description (canonical ID deduplicated, no double counting)
  it('TEST 11: Duplicate project description is canonicalized with single evidence ID', async () => {
    const resume = `
Jane Doe
Projects:
Analytics Engine
Built high-throughput data processing pipeline in Python.
Built high-throughput data processing pipeline in Python.
`;
    const jd = `
Must-Have: Python
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const pythonEv = result.evidence.filter((e) => e.text.toLowerCase().includes('python'));
    assert.ok(pythonEv.length >= 1);
    const canonIds = new Set(pythonEv.map((e) => e.canonical_evidence_id || e.id));
    assert.strictEqual(canonIds.size, 1, 'Duplicate text must map to exactly one canonical evidence ID');
  });

  // 12. Contradictory resume statements (cross-source contradiction detected)
  it('TEST 12: Contradictory education status across sources flags CONTRADICTION', async () => {
    const resume = `
Jane Doe
Education:
Currently pursuing B.Tech in Computer Science, 2026.
`;
    const jd = `
Must-Have: Computer Science Degree
`;
    const result = await runCanonicalResultEngine(resume, jd, {
      overrides: {
        linkedinMock: {
          accessible: true,
          profileFound: true,
          headline: 'Software Engineer',
          experience: [],
          education: [{ school: 'Tech University', degree: 'B.Tech Computer Science', dates: '2020 - 2024 (Graduated)' }],
          skills: [],
          checks: [],
        },
      },
    });
    const contra = result.evidenceLedger?.filter((e) => e.verification_status === 'CONTRADICTED');
    assert.ok(contra && contra.length > 0, 'Contradiction must be logged in evidence ledger');
  });

  // 13. Missing education (no placeholders: empty array, never 'Accredited University')
  it('TEST 13: Missing education yields empty education array, zero placeholder institutions', async () => {
    const resume = `
Jane Doe
Summary:
Self-taught software developer with 3 years coding experience.
Projects:
Tool
Built utility in Python.
`;
    const jd = `
Requirement: Python
`;
    const result = await runCanonicalResultEngine(resume, jd);
    assert.strictEqual(result.candidate.education.length, 0, 'Candidate education must be empty');
    assert.strictEqual(result.resumeRewrite.education.length, 0, 'Rewritten education must be empty, no placeholders');
    for (const edu of result.resumeRewrite.education) {
      assert.ok(!edu.institution.toLowerCase().includes('accredited university'));
      assert.ok(!edu.degree.toLowerCase().includes('or related field'));
    }
  });

  // 14. Missing dates (no placeholders: empty string, never 'Documented Tenure')
  it('TEST 14: Missing work dates yields empty period, never "Documented Tenure"', async () => {
    const resume = `
Jane Doe
Experience:
Software Engineer at Acme Corp
Developed backend microservices.
`;
    const jd = `
Requirement: Backend
`;
    const result = await runCanonicalResultEngine(resume, jd);
    for (const exp of result.resumeRewrite.experience) {
      assert.notStrictEqual(exp.period, 'Documented Tenure', 'Must never inject Documented Tenure');
    }
  });

  // 15. Missing company (no placeholders: empty string, never 'Professional Experience')
  it('TEST 15: Missing company yields empty company, never "Professional Experience"', async () => {
    const resume = `
Jane Doe
Experience:
Software Engineer
Developed backend microservices.
`;
    const jd = `
Requirement: Backend
`;
    const result = await runCanonicalResultEngine(resume, jd);
    for (const exp of result.resumeRewrite.experience) {
      assert.notStrictEqual(exp.company, 'Professional Experience', 'Must never inject Professional Experience placeholder');
    }
  });

  // 16. Multiple technologies in one sentence (no inflation: single evidence item with shared quote)
  it('TEST 16: Sentence mentioning Python, FastAPI, and Docker is ONE evidence item', async () => {
    const resume = `
Jane Doe
Projects:
API Hub
Engineered REST API backend using Python, FastAPI, and Docker for automated container deployment.
`;
    const parsed = parseResume(resume);
    const pEvs = parsed.evidenceItems.filter((e) => e.section === 'PROJECTS');
    assert.strictEqual(pEvs.length, 1, 'Single sentence must be ONE evidence item');
    assert.ok(pEvs[0].technologies.includes('Python'));
    assert.ok(pEvs[0].technologies.includes('FastAPI'));
    assert.ok(pEvs[0].technologies.includes('Docker'));
  });

  // 17. Same evidence repeated across sections (canonical ID deduplicated across sections)
  it('TEST 17: Same technology evidence across Summary and Projects shares canonical root', async () => {
    const resume = `
Jane Doe
Summary:
Built analytics pipeline using Python.
Projects:
Data Engine
Built analytics pipeline using Python.
`;
    const parsed = parseResume(resume);
    const pythonEvs = parsed.evidenceItems.filter((e) => e.text.toLowerCase().includes('analytics pipeline using python'));
    assert.strictEqual(pythonEvs.length, 2, 'Two occurrences found in document');
    assert.strictEqual(
      pythonEvs[0].canonical_evidence_id,
      pythonEvs[1].canonical_evidence_id,
      'Both occurrences must share the exact same canonical_evidence_id'
    );
  });

  // 18. JD preferred requirement classified correctly (priority strictly from JD)
  it('TEST 18: JD Preferred requirement is never inflated to Critical', async () => {
    const jd = `
Must-Have: Python
Preferred: Docker
Nice-to-Have: Kubernetes
`;
    const parsed = parseJobDescription(jd);
    const dockerReq = parsed.requirements.find((r) => r.normalized_requirement.toLowerCase() === 'docker');
    assert.ok(dockerReq);
    assert.strictEqual(dockerReq.priority, 'PREFERRED', 'Docker must be PREFERRED, never CRITICAL');
    assert.ok(dockerReq.priority_source_text.toLowerCase().includes('preferred'));
  });

  // 19. Nice-to-have affecting critical score (isolated: critical score unaffected)
  it('TEST 19: Nice-to-have requirement failure does NOT decrease critical score', async () => {
    const resume = `
Jane Doe
Projects:
Service
Engineered Python service.
`;
    const jd = `
Must-Have: Python
Nice-to-Have: Kubernetes
`;
    const result = await runCanonicalResultEngine(resume, jd);
    assert.strictEqual(result.score.criticalScore, 100, 'Critical score must be 100% when all critical requirements met');
    assert.strictEqual(result.score.criticalStats.supported, 1);
    assert.strictEqual(result.score.criticalStats.total, 1);
    assert.ok(result.score.niceToHaveScore !== undefined);
    assert.strictEqual(result.score.niceToHaveScore, 0, 'Nice-to-have is 0%');
  });

  // 20. Missing requirement in final matrix (blocked / complete: matrix contains 100% of parsed requirements)
  it('TEST 20: Master Requirement Matrix contains 100% of parsed JD requirements', async () => {
    const resume = `
Jane Doe
Projects:
Core
Built software.
`;
    const jd = `
Must-Have: Python
Must-Have: PostgreSQL
Important: Docker
Preferred: AWS
Nice-to-Have: Kubernetes
`;
    const result = await runCanonicalResultEngine(resume, jd);
    assert.strictEqual(result.matches.length, result.requirements.length, 'Every requirement has an entry in matches');
    assert.strictEqual(result.score.summaryCounts.totalRequirements, result.requirements.length, 'Score summary total equals requirements length');
    assert.strictEqual(result.validation.auditPassed, true, 'Programmatic audit must pass');
    assert.strictEqual(result.validation.traceabilityStatus, 'ZERO_FABRICATION_CERTIFIED', 'Status must be ZERO_FABRICATION_CERTIFIED');
  });

});
