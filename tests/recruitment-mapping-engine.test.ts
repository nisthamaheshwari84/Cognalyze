import test from 'node:test';
import assert from 'node:assert/strict';
import {
  matchRequirementsToEvidence,
  buildRequirementEvaluationRecords,
} from '../lib/ai/result-engine/matching-engine';
import {
  CanonicalJDRequirement,
  CanonicalResumeEvidence,
} from '../lib/ai/result-engine/types';

test('=== COGNALYZE RECRUITMENT INTELLIGENCE — GATE 5: REQUIREMENT EVIDENCE MAPPING ENGINE BENCHMARK ===', async (t) => {
  const baseReq = (overrides: Partial<CanonicalJDRequirement>): CanonicalJDRequirement => ({
    id: 'REQ-001',
    original_text: 'Experience with PostgreSQL',
    normalized_requirement: 'PostgreSQL',
    category: 'technical',
    subcategory: 'databases',
    priority: 'CRITICAL',
    priority_source_text: 'Must have extensive PostgreSQL experience',
    requirement_type: 'tool',
    synonyms: ['Postgres', 'Postgres DB'],
    explicitness: 'explicit',
    evidence_policy: 'direct_or_project_evidence',
    demonstrableLevelRequired: 'hands_on_project',
    ...overrides,
  });

  const baseEvidence = (overrides: Partial<CanonicalResumeEvidence>): CanonicalResumeEvidence => ({
    id: 'EVD-001',
    type: 'project_bullet',
    evidence_type: 'DIRECT_IMPLEMENTATION',
    section: 'PROJECTS',
    title: 'Distributed Analytics Platform',
    text: 'Designed schema and optimized complex query latency on PostgreSQL 15.',
    technologies: ['PostgreSQL', 'SQL'],
    source_location: { section: 'PROJECTS', bullet: 1 },
    verbatim_quote: 'Designed schema and optimized complex query latency on PostgreSQL 15.',
    ...overrides,
  });

  await t.test('[Test 1] Exact Terminology & Alias Matching: maps alias "Postgres" to normalized requirement "PostgreSQL"', () => {
    const req = baseReq({ normalized_requirement: 'PostgreSQL', synonyms: ['Postgres'] });
    const evidence = [
      baseEvidence({
        text: 'Maintained and migrated schema on Postgres database cluster.',
        verbatim_quote: 'Maintained and migrated schema on Postgres database cluster.',
        technologies: ['Postgres'],
      }),
    ];

    const matches = matchRequirementsToEvidence([req], evidence);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].status, 'SUPPORTED');
    assert.equal(matches[0].evidenceStrengthLevel, 'LEVEL_3_IMPLEMENTATION');
    assert.equal(matches[0].demonstrableCheckPassed, true);
    assert.ok(matches[0].confidence >= 0.80);
  });

  await t.test('[Test 2] Hard Non-Equivalence: SQL evidence does NOT satisfy PostgreSQL requirement', () => {
    const req = baseReq({ normalized_requirement: 'PostgreSQL' });
    const evidence = [
      baseEvidence({
        text: 'Wrote complex SQL queries to fetch reports from relational database.',
        verbatim_quote: 'Wrote complex SQL queries to fetch reports from relational database.',
        technologies: ['SQL'],
      }),
    ];

    const matches = matchRequirementsToEvidence([req], evidence);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].status, 'EVIDENCE_GAP');
    assert.equal(matches[0].nonEquivalenceApplied, true);
    assert.ok(matches[0].rejectedEvidence && matches[0].rejectedEvidence.length > 0);
    assert.ok(matches[0].rejectedEvidence![0].reason.includes('does NOT prove PostgreSQL'));
  });

  await t.test('[Test 3] Hard Non-Equivalence: React does NOT satisfy Next.js requirement', () => {
    const req = baseReq({
      id: 'REQ-NEXT',
      normalized_requirement: 'Next.js',
      original_text: 'Requires Next.js experience',
      synonyms: ['NextJS', 'Next'],
    });
    const evidence = [
      baseEvidence({
        text: 'Built interactive single page application with React and Redux.',
        verbatim_quote: 'Built interactive single page application with React and Redux.',
        technologies: ['React', 'Redux'],
      }),
    ];

    const matches = matchRequirementsToEvidence([req], evidence);
    assert.equal(matches[0].status, 'EVIDENCE_GAP');
    assert.equal(matches[0].nonEquivalenceApplied, true);
    assert.ok(matches[0].rejectedEvidence && matches[0].rejectedEvidence.length > 0);
    assert.ok(/do(es)? NOT prove Next\.js/i.test(matches[0].rejectedEvidence![0].reason));
  });

  await t.test('[Test 4] Hard Non-Equivalence: Generic Cloud does NOT satisfy AWS requirement', () => {
    const req = baseReq({
      id: 'REQ-AWS',
      normalized_requirement: 'AWS',
      original_text: 'Proficiency with AWS cloud infrastructure',
      synonyms: ['Amazon Web Services'],
    });
    const evidence = [
      baseEvidence({
        text: 'Deployed containerized backend on cloud computing platform.',
        verbatim_quote: 'Deployed containerized backend on cloud computing platform.',
        technologies: ['Cloud'],
      }),
    ];

    const matches = matchRequirementsToEvidence([req], evidence);
    assert.equal(matches[0].status, 'EVIDENCE_GAP');
    assert.equal(matches[0].nonEquivalenceApplied, true);
  });

  await t.test('[Test 5] Hard Non-Equivalence: Python does NOT satisfy FastAPI requirement', () => {
    const req = baseReq({
      id: 'REQ-FASTAPI',
      normalized_requirement: 'FastAPI',
      original_text: 'High-throughput microservices using FastAPI',
      synonyms: [],
    });
    const evidence = [
      baseEvidence({
        text: 'Wrote Python automation scripts to parse server logs.',
        verbatim_quote: 'Wrote Python automation scripts to parse server logs.',
        technologies: ['Python'],
      }),
    ];

    const matches = matchRequirementsToEvidence([req], evidence);
    assert.equal(matches[0].status, 'EVIDENCE_GAP');
    assert.equal(matches[0].nonEquivalenceApplied, true);
  });

  await t.test('[Test 6] Hard Non-Equivalence: Docker does NOT satisfy Kubernetes requirement', () => {
    const req = baseReq({
      id: 'REQ-K8S',
      normalized_requirement: 'Kubernetes',
      original_text: 'Orchestrating microservices on Kubernetes',
      synonyms: ['K8s'],
    });
    const evidence = [
      baseEvidence({
        text: 'Packaged microservices into Docker containers for local testing.',
        verbatim_quote: 'Packaged microservices into Docker containers for local testing.',
        technologies: ['Docker'],
      }),
    ];

    const matches = matchRequirementsToEvidence([req], evidence);
    assert.equal(matches[0].status, 'EVIDENCE_GAP');
    assert.equal(matches[0].nonEquivalenceApplied, true);
  });

  await t.test('[Test 7] Specificity Enforcement: Skills-only mention is CLAIM_ONLY and fails hands_on_project requirement', () => {
    const req = baseReq({
      normalized_requirement: 'PostgreSQL',
      demonstrableLevelRequired: 'hands_on_project',
    });
    const evidence = [
      baseEvidence({
        evidence_type: 'SKILL_LIST',
        section: 'SKILLS',
        title: 'Technical Skills',
        text: 'PostgreSQL, MongoDB, Redis',
        verbatim_quote: 'PostgreSQL, MongoDB, Redis',
        technologies: ['PostgreSQL'],
      }),
    ];

    const matches = matchRequirementsToEvidence([req], evidence);
    assert.equal(matches[0].status, 'CLAIM_ONLY');
    assert.equal(matches[0].evidenceStrengthLevel, 'LEVEL_1_MENTIONED');
    assert.equal(matches[0].demonstrableCheckPassed, false);
    assert.ok(
      matches[0].limitations?.includes(
        'Demonstrable hands-on project requirement not satisfied by self-reported mention or contextual evidence.'
      )
    );
    assert.equal(matches[0].review_required, true);
  });

  await t.test('[Test 8] Level 3 Implementation: satisfies hands_on_project requirement with documented limitations', () => {
    const req = baseReq({
      normalized_requirement: 'PostgreSQL',
      demonstrableLevelRequired: 'hands_on_project',
    });
    const evidence = [
      baseEvidence({
        text: 'Architected relational data models and indexed queries on PostgreSQL.',
        verbatim_quote: 'Architected relational data models and indexed queries on PostgreSQL.',
        technologies: ['PostgreSQL'],
      }),
    ];

    const matches = matchRequirementsToEvidence([req], evidence);
    assert.equal(matches[0].status, 'SUPPORTED');
    assert.equal(matches[0].demonstrableCheckPassed, true);
    assert.ok(
      matches[0].limitations?.includes(
        'Ownership is not independently established through external commit history'
      )
    );
    assert.ok(
      matches[0].limitations?.includes(
        'Production-scale reliability is not independently demonstrated'
      )
    );
  });

  await t.test('[Test 9] Level 5 Verified: zero fundamental limitations when independently inspected in AST', () => {
    const req = baseReq({ normalized_requirement: 'FastAPI' });
    const evidence = [
      baseEvidence({
        text: 'FastAPI application with lifespan router and dependency injection',
        verbatim_quote: 'from fastapi import FastAPI, Depends',
        technologies: ['FastAPI'],
        verification_status: 'EXTERNALLY_VERIFIED',
      }),
    ];

    const matches = matchRequirementsToEvidence([req], evidence);
    assert.equal(matches[0].status, 'SUPPORTED');
    assert.equal(matches[0].evidenceStrengthLevel, 'LEVEL_5_INDEPENDENTLY_VERIFIED');
    assert.equal(matches[0].confidence, 0.98);
    assert.equal(matches[0].limitations?.length, 0);
    assert.ok(matches[0].supporting_reason?.includes('Independently verified'));
  });

  await t.test('[Test 10] Decoupled RequirementEvaluationRecord generation: builds canonical records matching Section 9 spec', () => {
    const reqCritical = baseReq({
      id: 'REQ-001',
      normalized_requirement: 'PostgreSQL',
      priority: 'CRITICAL',
      demonstrableLevelRequired: 'hands_on_project',
    });
    const reqPreferred = baseReq({
      id: 'REQ-002',
      normalized_requirement: 'Redis',
      priority: 'PREFERRED',
      demonstrableLevelRequired: 'none',
    });

    const evidence = [
      baseEvidence({
        id: 'EVD-001',
        text: 'PostgreSQL, MongoDB',
        section: 'SKILLS',
        evidence_type: 'SKILL_LIST',
        verbatim_quote: 'PostgreSQL, MongoDB',
        technologies: ['PostgreSQL'],
      }),
      baseEvidence({
        id: 'EVD-002',
        text: 'Configured Redis cache for session storage and rate limiting.',
        section: 'PROJECTS',
        evidence_type: 'DIRECT_IMPLEMENTATION',
        verbatim_quote: 'Configured Redis cache for session storage and rate limiting.',
        technologies: ['Redis'],
      }),
    ];

    const matches = matchRequirementsToEvidence([reqCritical, reqPreferred], evidence);
    const records = buildRequirementEvaluationRecords(matches, 'CAND-001');

    assert.equal(records.length, 2);

    // Record 1 (Critical PostgreSQL with only skills mention)
    const rec1 = records.find((r) => r.requirement_id === 'REQ-001')!;
    assert.equal(rec1.candidate_id, 'CAND-001');
    assert.equal(rec1.status, 'CLAIM_ONLY');
    assert.equal(rec1.demonstrableCheckPassed, false);
    assert.equal(rec1.review_required, true);
    assert.ok(rec1.limitations.length > 0);
    assert.ok(rec1.supporting_reason);

    // Record 2 (Preferred Redis with implementation)
    const rec2 = records.find((r) => r.requirement_id === 'REQ-002')!;
    assert.equal(rec2.candidate_id, 'CAND-001');
    assert.equal(rec2.status, 'SUPPORTED');
    assert.equal(rec2.demonstrableCheckPassed, true);
    assert.equal(rec2.review_required, false);
  });
});
