import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectCandidateRisks,
  deriveInterviewFocus,
} from '../lib/ai/result-engine/derivation-engine';
import {
  CanonicalJDRequirement,
  CanonicalResumeEvidence,
  ParsedResume,
  RequirementEvidenceMatch,
} from '../lib/ai/result-engine/types';

test('=== COGNALYZE RECRUITMENT INTELLIGENCE — GATE 7: CANDIDATE RISK & INTERVIEW INTELLIGENCE BENCHMARK ===', async (t) => {

  const baseResume = (): ParsedResume => ({
    name: 'Alex Rivera',
    links: ['https://github.com/alexrivera/rag-service'],
    education: [
      {
        degree: 'B.S. in Computer Science',
        institution: 'University of Washington',
        year: '2025',
        gpa: '3.8',
      },
    ],
    experience: [
      {
        role: 'Software Engineering Intern',
        company: 'Cloud Corp',
        period: '2023 - 2024',
        bullets: ['Maintained internal monitoring dashboard using Python.'],
      },
    ],
    projects: [
      {
        title: 'Retrieval Augmented Knowledge Assistant',
        technologies: ['FastAPI', 'RAG', 'PostgreSQL'],
        bullets: [
          'Engineered a retrieval-augmented generation pipeline using FastAPI and PostgreSQL vector indexing.',
        ],
      },
    ],
    skillsCategorized: [
      {
        category: 'Languages',
        items: ['Python', 'SQL', 'TypeScript'],
      },
    ],
    certifications: [],
    achievements: [],
    publications: [],
    openSource: [],
    hackathons: [],
    leadership: [],
    evidenceItems: [],
  });

  const makeMatch = (
    reqId: string,
    name: string,
    priority: 'CRITICAL' | 'IMPORTANT',
    status: 'SUPPORTED' | 'CLAIM_ONLY' | 'EVIDENCE_GAP',
    level: any
  ): RequirementEvidenceMatch => ({
    requirementId: reqId,
    requirementName: name,
    priority,
    relationship: status === 'SUPPORTED' ? 'DIRECT' : status === 'CLAIM_ONLY' ? 'CLAIM_ONLY' : 'NO_EVIDENCE',
    status,
    evidenceStrength: status === 'SUPPORTED' ? 'STRONG' : 'NONE',
    evidenceStrengthLevel: level,
    evidenceContribution: status === 'SUPPORTED' ? 0.65 : 0.0,
    evidenceType: 'DIRECT_IMPLEMENTATION',
    confidence: status === 'SUPPORTED' ? 0.85 : 0.0,
    confidenceTier: status === 'SUPPORTED' ? 'HIGH' : 'INSUFFICIENT',
    matchedEvidenceIds: status === 'SUPPORTED' ? [`EVD-${reqId}`] : [],
    evidenceQuotes: status === 'SUPPORTED' ? [`Implemented ${name}`] : [],
    reasoning: `Match for ${name}`,
    actionableRecommendation: 'Recommendation',
    requirement_weight: 6,
    status_multiplier: 1.0,
    earned_points: 6,
    possible_points: 6,
  });

  await t.test('[Test 1] Risk Detection: Date Inconsistency (End Year < Start Year)', () => {
    const resume = baseResume();
    resume.experience[0].period = '2024 - 2022'; // Impossible date range

    const risks = detectCandidateRisks(resume, [], []);
    const dateRisk = risks.find((r) => r.flagType === 'DATE_INCONSISTENCY');

    assert.ok(dateRisk, 'Must detect date inconsistency');
    assert.equal(dateRisk.category, 'MATERIAL_CONTRADICTION');
    assert.equal(dateRisk.severity, 'HIGH');
    assert.ok(dateRisk.explanation?.includes('earlier than start year'));
    assert.ok(dateRisk.source);
    assert.ok(dateRisk.recommended_action);
  });

  await t.test('[Test 2] Risk Detection: Duplicated Implementation Bullets Across Different Projects', () => {
    const resume = baseResume();
    resume.projects = [
      {
        title: 'E-Commerce Platform',
        technologies: ['React', 'Node.js'],
        bullets: [
          'Engineered scalable microservices architecture with automated CI/CD pipeline and integration tests.',
        ],
      },
      {
        title: 'Healthcare Analytics Portal',
        technologies: ['FastAPI', 'PostgreSQL'],
        bullets: [
          'Engineered scalable microservices architecture with automated CI/CD pipeline and integration tests.',
        ],
      },
    ];

    const risks = detectCandidateRisks(resume, [], []);
    const dupRisk = risks.find((r) => r.flagType === 'DUPLICATE_PROJECT_TEXT');

    assert.ok(dupRisk, 'Must detect duplicate project bullets');
    assert.equal(dupRisk.category, 'TECHNICAL_REVIEW_REQUIRED');
    assert.equal(dupRisk.severity, 'MEDIUM');
    assert.ok(dupRisk.explanation?.includes('Substantially identical implementation text'));
    assert.equal(dupRisk.confidence, 0.95);
  });

  await t.test('[Test 3] Risk Detection: Outsized / Unattributed Metrics (>300%, 10x, Unanchored Millions)', () => {
    const resume = baseResume();
    const evidence: CanonicalResumeEvidence[] = [
      {
        id: 'EVD-001',
        type: 'project_bullet',
        evidence_type: 'DIRECT_IMPLEMENTATION',
        section: 'PROJECTS',
        title: 'High Scale API',
        text: 'Optimized PostgreSQL database query latency by 850% and generated $5M in cost savings.',
        technologies: ['PostgreSQL'],
        source_location: { section: 'PROJECTS', bullet: 1 },
        verbatim_quote: 'Optimized PostgreSQL database query latency by 850% and generated $5M in cost savings.',
      },
    ];

    const risks = detectCandidateRisks(resume, evidence, []);
    const metricRisk = risks.find((r) => r.flagType === 'UNATTRIBUTED_METRIC');

    assert.ok(metricRisk, 'Must detect outsized metric');
    assert.equal(metricRisk.category, 'EVIDENCE_CONCERN');
    assert.ok(metricRisk.claim.includes('850%') || metricRisk.claim.includes('$5M'));
    assert.ok(metricRisk.verificationRecommended.includes('baseline measurement'));
  });

  await t.test('[Test 4] Risk Detection: Unsupported Certifications (No Issuing Authority or Credential ID)', () => {
    const resume = baseResume();
    resume.certifications = ['Advanced Artificial Intelligence Masterclass']; // Unaccredited, no date or ID

    const risks = detectCandidateRisks(resume, [], []);
    const certRisk = risks.find((r) => r.flagType === 'UNSUPPORTED_CERTIFICATION');

    assert.ok(certRisk, 'Must flag unverified certification');
    assert.equal(certRisk.category, 'UNVERIFIED_CLAIM');
    assert.equal(certRisk.severity, 'LOW');
    assert.ok(certRisk.explanation?.includes('without an issuing date'));
  });

  await t.test('[Test 5] Risk Detection: Multi-Tool Enumeration Stuffing (5+ Tools in Single Bullet)', () => {
    const resume = baseResume();
    resume.projects[0].technologies = ['Python', 'FastAPI', 'Docker', 'Kubernetes', 'Redis', 'PostgreSQL'];
    resume.projects[0].bullets = [
      'Developed microservices using Python, FastAPI, Docker, Kubernetes, Redis, and PostgreSQL for real-time stream processing.',
    ];

    const risks = detectCandidateRisks(resume, [], []);
    const stuffingRisk = risks.find((r) => r.flagType === 'MULTI_TOOL_STUFFING');

    assert.ok(stuffingRisk, 'Must flag multi-tool stuffing');
    assert.equal(stuffingRisk.category, 'EVIDENCE_CONCERN');
    assert.equal(stuffingRisk.severity, 'MEDIUM');
    assert.ok(stuffingRisk.explanation?.includes('enumerates 5+ technologies'));
  });

  await t.test('[Test 6] Standardized Section 11 Risk Contract: All fields populated with non-accusatory language', () => {
    const resume = baseResume();
    resume.experience[0].period = '2025 - 2023'; // Triggers date risk

    const risks = detectCandidateRisks(resume, [], []);
    for (const r of risks) {
      assert.ok(r.id, 'Risk must have id');
      assert.ok(r.claim, 'Risk must have claim');
      assert.ok(r.severity, 'Risk must have severity');
      assert.ok(r.category, 'Risk must have category');
      assert.ok(r.source, 'Risk must have source');
      assert.ok(typeof r.confidence === 'number', 'Risk must have numerical confidence');
      assert.ok(r.recommended_action, 'Risk must have recommended_action');
      // Non-accusatory language verification
      assert.ok(!/fraud|dishonest|liar|fake|cheat/i.test(r.explanation || ''));
      assert.ok(!/fraud|dishonest|liar|fake|cheat/i.test(r.verificationRecommended || ''));
    }
  });

  await t.test('[Test 7] Grounded Interview Intelligence: Specialized FastAPI Probe with Complete Rubric', () => {
    const evidence: CanonicalResumeEvidence[] = [
      {
        id: 'EVD-FASTAPI',
        type: 'project_bullet',
        evidence_type: 'DIRECT_IMPLEMENTATION',
        section: 'PROJECTS',
        title: 'Microservices Platform',
        text: 'Engineered high-throughput asynchronous microservices using FastAPI.',
        technologies: ['FastAPI'],
        source_location: { section: 'PROJECTS', bullet: 1 },
        verbatim_quote: 'Engineered high-throughput asynchronous microservices using FastAPI.',
      },
    ];

    const match = makeMatch('REQ-001', 'FastAPI', 'CRITICAL', 'SUPPORTED', 'LEVEL_3_IMPLEMENTATION');
    const interviewPlan = deriveInterviewFocus([match], evidence);

    const fastApiProbe = interviewPlan.probeQuestions.find(
      (q) => q.targetRequirement.toLowerCase().includes('fastapi') || q.question.includes('FastAPI')
    );

    assert.ok(fastApiProbe, 'Must generate targeted FastAPI probe');
    assert.ok(fastApiProbe.question.includes('request lifecycle, validation, error handling'));
    assert.ok(fastApiProbe.unresolvedQuestion, 'Must provide unresolvedQuestion');
    assert.ok(fastApiProbe.expectedAnswerIndicators, 'Must provide expectedAnswerIndicators');
    assert.ok(fastApiProbe.expectedAnswerIndicators.strongSignals.length >= 2);
    assert.ok(fastApiProbe.expectedAnswerIndicators.weakSignals.length >= 2);
    assert.ok(fastApiProbe.followUpQuestions && fastApiProbe.followUpQuestions.length >= 2);
    assert.ok(fastApiProbe.evaluationRubric?.includes('Score 5:'));
  });

  await t.test('[Test 8] Grounded Interview Intelligence: Specialized RAG / LLM Probe with Complete Rubric', () => {
    const evidence: CanonicalResumeEvidence[] = [
      {
        id: 'EVD-RAG',
        type: 'project_bullet',
        evidence_type: 'DIRECT_IMPLEMENTATION',
        section: 'PROJECTS',
        title: 'Legal RAG Assistant',
        text: 'Architected retrieval-augmented generation search pipeline across judicial PDFs.',
        technologies: ['RAG', 'LLM'],
        source_location: { section: 'PROJECTS', bullet: 1 },
        verbatim_quote: 'Architected retrieval-augmented generation search pipeline across judicial PDFs.',
      },
    ];

    const match = makeMatch('REQ-002', 'RAG', 'CRITICAL', 'SUPPORTED', 'LEVEL_3_IMPLEMENTATION');
    const interviewPlan = deriveInterviewFocus([match], evidence);

    const ragProbe = interviewPlan.probeQuestions.find(
      (q) => q.targetRequirement.toLowerCase().includes('rag') || q.question.includes('retrieval')
    );

    assert.ok(ragProbe, 'Must generate targeted RAG probe');
    assert.ok(ragProbe.question.includes('ingested, chunked, embedded, retrieved'));
    assert.ok(ragProbe.expectedAnswerIndicators?.strongSignals.some((s) => s.includes('chunking')));
    assert.ok(ragProbe.followUpQuestions && ragProbe.followUpQuestions.length >= 2);
    assert.ok(ragProbe.evaluationRubric?.includes('embedding pipelines, vector indexing'));
  });

  await t.test('[Test 9] Grounded Interview Intelligence: Missing Critical Requirement Bridge Question', () => {
    const match = makeMatch('REQ-K8S', 'Kubernetes', 'CRITICAL', 'EVIDENCE_GAP', 'LEVEL_0_NO_EVIDENCE');
    const interviewPlan = deriveInterviewFocus([match], []);

    const missingProbe = interviewPlan.probeQuestions.find((q) => q.questionType === 'MISSING_CRITICAL_EVIDENCE');
    assert.ok(missingProbe, 'Must generate missing critical requirement probe');
    assert.ok(missingProbe.question.includes('not documented on your resume'));
    assert.equal(missingProbe.candidateDefensibility, 'WEAK');
    assert.ok((missingProbe.expectedAnswerIndicators?.strongSignals?.length ?? 0) >= 1);
    assert.ok(missingProbe.followUpQuestions && missingProbe.followUpQuestions.length >= 2);
  });

  await t.test('[Test 10] Semantic Deduplication Pass: Prevents Duplicate or Redundant Interview Probes', () => {
    const evidence: CanonicalResumeEvidence[] = [
      {
        id: 'EVD-1',
        type: 'project_bullet',
        evidence_type: 'DIRECT_IMPLEMENTATION',
        section: 'PROJECTS',
        title: 'Project Alpha',
        text: 'Built backend with FastAPI.',
        technologies: ['FastAPI'],
        source_location: { section: 'PROJECTS', bullet: 1 },
        verbatim_quote: 'Built backend with FastAPI.',
      },
      {
        id: 'EVD-2',
        type: 'project_bullet',
        evidence_type: 'DIRECT_IMPLEMENTATION',
        section: 'PROJECTS',
        title: 'Project Alpha', // Duplicate title
        text: 'Extended backend with FastAPI routes.',
        technologies: ['FastAPI'],
        source_location: { section: 'PROJECTS', bullet: 2 },
        verbatim_quote: 'Extended backend with FastAPI routes.',
      },
    ];

    const match = makeMatch('REQ-FASTAPI', 'FastAPI', 'CRITICAL', 'SUPPORTED', 'LEVEL_3_IMPLEMENTATION');
    const interviewPlan = deriveInterviewFocus([match], evidence);

    // Assert that only 1 probe question is generated for Project Alpha, not 2 identical ones
    const alphaProbes = interviewPlan.probeQuestions.filter((q) => q.question.includes('Project Alpha'));
    assert.equal(alphaProbes.length, 1);
  });
});
