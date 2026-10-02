/**
 * COGNALYZE — PHASE 25 ANTI-HALLUCINATION EVIDENCE TEST SUITE
 * 
 * Tests the 10 non-negotiable system invariants:
 * - CASE 1: Resume: Python, REST APIs; JD: FastAPI -> FastAPI = NOT_EVIDENCED (not PARTIAL, not SUPPORTED)
 * - CASE 2: Resume: B.Tech AI & ML; JD: LLM implementation -> LLM = NOT_EVIDENCED
 * - CASE 3: Resume: "Familiarity with Generative AI and LLM-based applications" -> Generative AI = SELF_CLAIM (not VERIFIED_IMPLEMENTATION)
 * - CASE 4: Resume: "Currently pursuing B.Tech" -> Education status = CURRENTLY_PURSUING (never GRADUATED)
 * - CASE 5: Resume contains 2 project headings -> Project count = 2 (never 3)
 * - CASE 6: Resume: "Pandas", no project implementation -> Pandas = SELF_CLAIM
 * - CASE 7: README says "FastAPI", repo contains no FastAPI code -> FastAPI = NOT_EXTERNALLY_VERIFIED
 * - CASE 8: Repo contains actual FastAPI implementation -> FastAPI = EXTERNALLY_VERIFIED with exact source evidence
 * - CASE 9: GitHub URL is inaccessible -> GITHUB = INACCESSIBLE (never GITHUB VERIFIED)
 * - CASE 10: LinkedIn conflicts with resume -> CONTRADICTION (never silently select one)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runCanonicalResultEngine } from '../lib/ai/result-engine';
import { detectEducationStatus } from '../lib/evidence/non-equivalence';
import { inspectGithubRepository } from '../lib/evidence/source-verifier';

describe('Phase 25 Anti-Hallucination & Evidence Invariants', () => {

  // ─────────────────────────────────────────────────────────────
  // CASE 1: Python + REST API ≠ FastAPI
  // ─────────────────────────────────────────────────────────────
  it('CASE 1: Python and REST APIs in resume do NOT satisfy FastAPI in JD -> NOT_EVIDENCED', async () => {
    const resume = `
John Doe
Email: john@example.com
Summary: Software developer with Python experience building REST APIs.
Technical Skills: Python, REST APIs, Git
Projects:
API Service
Built backend microservices using Python and standard HTTP REST APIs.
`;
    const jd = `
Job Title: Backend Engineer
Required: FastAPI backend web services
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const fastApiMatch = result.matches.find((m) =>
      m.requirementName.toLowerCase().includes('fastapi')
    );

    assert.ok(fastApiMatch, 'FastAPI requirement should be extracted from JD');
    assert.strictEqual(
      fastApiMatch.status,
      'EVIDENCE_GAP',
      'FastAPI status must be EVIDENCE_GAP / NOT_EVIDENCED'
    );
    assert.strictEqual(
      fastApiMatch.relationship,
      'NO_EVIDENCE',
      'FastAPI relationship must be NO_EVIDENCE (never PARTIAL or DIRECT)'
    );
    assert.notStrictEqual(fastApiMatch.status, 'PARTIAL');
    assert.notStrictEqual(fastApiMatch.status, 'SUPPORTED');
    assert.strictEqual(fastApiMatch.verificationStatus, 'NOT_EVIDENCED');
  });

  // ─────────────────────────────────────────────────────────────
  // CASE 2: B.Tech AI & ML ≠ LLM implementation
  // ─────────────────────────────────────────────────────────────
  it('CASE 2: B.Tech AI & ML degree does NOT satisfy LLM implementation -> NOT_EVIDENCED', async () => {
    const resume = `
Candidate Name
Email: candidate@test.com
Education:
B.Tech AI & ML - 2024
Summary: Computer science student with degree in B.Tech AI & ML.
Technical Skills: Machine Learning, Python
Projects:
Statistical Predictor
Implemented basic linear regression in Python using Scikit-learn.
`;
    const jd = `
Job Title: AI Engineer
Required: LLM implementation and RAG pipeline engineering
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const llmMatch = result.matches.find((m) =>
      m.requirementName.toLowerCase().includes('llm') ||
      m.requirementName.toLowerCase().includes('generative ai')
    );

    assert.ok(llmMatch, 'LLM requirement must be extracted from JD');
    assert.strictEqual(
      llmMatch.status,
      'EVIDENCE_GAP',
      'LLM implementation must be EVIDENCE_GAP / NOT_EVIDENCED'
    );
    assert.strictEqual(
      llmMatch.verificationStatus,
      'NOT_EVIDENCED',
      'LLM verification status must be NOT_EVIDENCED'
    );
    assert.notStrictEqual(llmMatch.status, 'SUPPORTED');
    assert.notStrictEqual(llmMatch.status, 'PARTIAL');
  });

  // ─────────────────────────────────────────────────────────────
  // CASE 3: "Familiarity with..." = SELF_CLAIM (not verified)
  // ─────────────────────────────────────────────────────────────
  it('CASE 3: "Familiarity with Generative AI" is classified as SELF_CLAIM, not verified implementation', async () => {
    const resume = `
Alex Smith
Email: alex@example.com
Summary: Developer with familiarity with Generative AI and LLM-based applications.
Technical Skills: Python, Git
Projects:
Web Portfolio
Created personal portfolio site in HTML and CSS.
`;
    const jd = `
Job Title: AI Developer
Required: Generative AI
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const genAiMatch = result.matches.find((m) =>
      m.requirementName.toLowerCase().includes('generative ai') ||
      m.requirementName.toLowerCase().includes('llm')
    );

    assert.ok(genAiMatch, 'Generative AI requirement must be present');
    assert.strictEqual(
      genAiMatch.status,
      'CLAIM_ONLY',
      'Status must be CLAIM_ONLY'
    );
    assert.strictEqual(
      genAiMatch.verificationStatus,
      'SELF_CLAIM',
      'Verification status must be SELF_CLAIM, not verified implementation'
    );
    assert.notStrictEqual(genAiMatch.status, 'SUPPORTED');
  });

  // ─────────────────────────────────────────────────────────────
  // CASE 4: "Currently pursuing B.Tech" = CURRENTLY_PURSUING (never GRADUATED)
  // ─────────────────────────────────────────────────────────────
  it('CASE 4: "Currently pursuing B.Tech" is evaluated as CURRENTLY_PURSUING, never GRADUATED', () => {
    const text = 'Currently pursuing B.Tech in Computer Science at University of Technology (2022-2026)';
    const status = detectEducationStatus(text);

    assert.strictEqual(status, 'CURRENTLY_PURSUING');
    assert.notStrictEqual(status, 'GRADUATED');
  });

  // ─────────────────────────────────────────────────────────────
  // CASE 5: 2 project headings -> Project count = 2 (never 3)
  // ─────────────────────────────────────────────────────────────
  it('CASE 5: Resume with exactly two project headings produces project count = 2, never 3', async () => {
    const resume = `
Jane Doe
Email: jane@example.com
Summary: Software developer.
Projects:
First Project Title
Built responsive web application using JavaScript.
Implemented modular frontend UI components.

Second Project Title
Developed data analytics tool using Python.
Visualized user engagement metrics.
`;
    const jd = `
Job Title: Software Engineer
Required: JavaScript, Python
`;
    const result = await runCanonicalResultEngine(resume, jd);

    assert.strictEqual(
      result.candidate.projects.length,
      2,
      'Parsed projects count must be exactly 2'
    );
    assert.strictEqual(
      result.experienceAnalysis.projectEvidence.count,
      2,
      'Experience analysis project count must be exactly 2 (never 3)'
    );
  });

  // ─────────────────────────────────────────────────────────────
  // CASE 6: "Pandas" in Skills with no project implementation = SELF_CLAIM
  // ─────────────────────────────────────────────────────────────
  it('CASE 6: "Pandas" listed in skills without project implementation is SELF_CLAIM', async () => {
    const resume = `
Candidate Name
Email: candidate@test.com
Technical Skills: Python, Pandas, SQL
Projects:
Web Scraper
Built web scraper in Python using Beautiful Soup to collect article titles.
`;
    const jd = `
Job Title: Data Analyst
Required: Pandas
`;
    const result = await runCanonicalResultEngine(resume, jd);
    const pandasMatch = result.matches.find((m) =>
      m.requirementName.toLowerCase().includes('pandas')
    );

    assert.ok(pandasMatch, 'Pandas requirement should be matched');
    assert.strictEqual(
      pandasMatch.status,
      'CLAIM_ONLY',
      'Pandas with no project implementation must be CLAIM_ONLY'
    );
    assert.strictEqual(
      pandasMatch.verificationStatus,
      'SELF_CLAIM',
      'Pandas verification status must be SELF_CLAIM'
    );
    assert.notStrictEqual(pandasMatch.status, 'SUPPORTED');
  });

  // ─────────────────────────────────────────────────────────────
  // CASE 7: README says "FastAPI", but repo has no FastAPI code -> NOT_EXTERNALLY_VERIFIED
  // ─────────────────────────────────────────────────────────────
  it('CASE 7: README claims "FastAPI", but repository contains no FastAPI code -> NOT_EXTERNALLY_VERIFIED', async () => {
    const inspection = await inspectGithubRepository(
      'https://github.com/candidate/repo',
      ['FastAPI', 'Python'],
      {
        accessible: true,
        readmeText: 'Built with FastAPI and Python. High performance backend API.',
        files: {
          'main.py': 'print("Hello world")\nimport sys\n',
          'requirements.txt': 'requests==2.28.0\n',
        },
      }
    );

    assert.strictEqual(inspection.accessible, true);
    assert.strictEqual(inspection.sourceTechnologiesFound.includes('python'), true);
    // FastAPI was in README, but NOT in requirements or source code
    assert.strictEqual(
      inspection.sourceTechnologiesFound.includes('fastapi'),
      false,
      'FastAPI source code must NOT be verified'
    );
    assert.strictEqual(
      inspection.dependenciesFound.includes('fastapi'),
      false,
      'FastAPI dependency must NOT be verified'
    );

    const fastApiCheck = inspection.checks.find((c) => c.check.includes('FastAPI'));
    assert.ok(fastApiCheck);
    assert.strictEqual(
      fastApiCheck.result,
      'FAILED',
      'FastAPI check must FAIL when no FastAPI code or dependency exists'
    );
  });

  // ─────────────────────────────────────────────────────────────
  // CASE 8: Repo contains actual FastAPI code -> EXTERNALLY_VERIFIED
  // ─────────────────────────────────────────────────────────────
  it('CASE 8: Repository contains actual FastAPI code -> EXTERNALLY_VERIFIED with exact source evidence', async () => {
    const inspection = await inspectGithubRepository(
      'https://github.com/candidate/fastapi-service',
      ['FastAPI', 'Python'],
      {
        accessible: true,
        readmeText: '# FastAPI Microservice\nBackend service for orders.',
        files: {
          'app.py': 'from fastapi import FastAPI\napp = FastAPI()\n@app.get("/")\ndef root(): return {"ok": True}\n',
          'requirements.txt': 'fastapi==0.110.0\nuvicorn==0.28.0\n',
        },
      }
    );

    assert.strictEqual(inspection.accessible, true);
    assert.strictEqual(
      inspection.sourceTechnologiesFound.includes('fastapi'),
      true,
      'FastAPI source code must be verified'
    );
    assert.strictEqual(
      inspection.dependenciesFound.includes('fastapi'),
      true,
      'FastAPI dependency must be verified'
    );

    const fastApiCheck = inspection.checks.find((c) => c.check.includes('FastAPI'));
    assert.ok(fastApiCheck);
    assert.strictEqual(fastApiCheck.result, 'PASSED');
  });

  // ─────────────────────────────────────────────────────────────
  // CASE 9: GitHub URL inaccessible -> GITHUB = INACCESSIBLE (never VERIFIED)
  // ─────────────────────────────────────────────────────────────
  it('CASE 9: Inaccessible GitHub URL produces GITHUB = INACCESSIBLE, never GITHUB VERIFIED', async () => {
    const inspection = await inspectGithubRepository(
      'https://github.com/nonexistent-user-12345/missing-repo-xyz',
      ['Python'],
      {
        accessible: false,
      }
    );

    assert.strictEqual(inspection.accessible, false);
    const accessCheck = inspection.checks.find((c) => c.check === 'Repository accessible');
    assert.ok(accessCheck);
    assert.strictEqual(accessCheck.result, 'FAILED');
    assert.strictEqual(inspection.sourceTechnologiesFound.length, 0);
  });

  // ─────────────────────────────────────────────────────────────
  // CASE 10: LinkedIn conflicts with resume -> CONTRADICTION (never silently select one)
  // ─────────────────────────────────────────────────────────────
  it('CASE 10: Resume says "Currently pursuing", LinkedIn says "Graduated" -> CONTRADICTION flagged', async () => {
    const resume = `
Student Name
Email: student@edu.com
Education:
Currently pursuing B.Tech in Computer Science, expected 2026.
Technical Skills: Python, SQL
Projects:
Database Engine
Built SQL querying tool in Python.
`;
    const jd = `
Job Title: Software Intern
Required: Python
`;
    const result = await runCanonicalResultEngine(resume, jd, {
      overrides: {
        linkedinMock: {
          accessible: true,
          profileName: 'Student Name',
          educationStatus: 'GRADUATED',
          checks: [
            { check: 'LinkedIn profile accessible', result: 'PASSED' },
            { check: 'Education status verified', result: 'PASSED', detail: 'Graduated' },
          ],
        },
      },
    });

    const contradictionEvidence = result.evidenceLedger?.find(
      (e) => e.verification_status === 'CONTRADICTED'
    );

    assert.ok(
      contradictionEvidence,
      'Evidence Ledger must contain a CONTRADICTED record'
    );
    assert.ok(
      contradictionEvidence.observed_fact.includes('Contradiction detected'),
      'Observed fact must explicitly state contradiction'
    );
    assert.ok(
      contradictionEvidence.original_text.includes('CURRENTLY_PURSUING') &&
      contradictionEvidence.original_text.includes('GRADUATED'),
      'Evidence must cite both sources rather than silently selecting one'
    );

    // Contradiction probe question should also be generated in interview plan
    const contradictionProbe = result.interviewFocus.probeQuestions.find(
      (q) => q.questionType === 'CONTRADICTION'
    );
    assert.ok(contradictionProbe, 'Interview focus must generate a question probing the contradiction');
  });

});
