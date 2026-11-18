import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseJobDescription,
  ingestJobDescriptionDocument,
  detectRoleArchetype,
  auditJDQuality,
  getObservableIndicators,
  PRIORITY_WEIGHTS
} from '../lib/ai/result-engine/jd-engine';
import {
  checkNonEquivalence,
  NON_EQUIVALENCE_RULES,
  canonicalizeSkill
} from '../lib/ai/result-engine/ontology';

test('=== COGNALYZE RECRUITMENT INTELLIGENCE — GATE 2: JD INTELLIGENCE BENCHMARK ===', async (t) => {

  await t.test('[Test 1] Document Ingestion & Provenance Hash Tracking', () => {
    const rawJD = `
Title: Senior Backend Platform Engineer
Company: Acme Distributed Systems
Seniority: Senior / Staff

About the Role:
We are seeking a Senior Backend Engineer to design high-throughput distributed microservices.

Core Responsibilities:
- Design and implement scalable REST APIs using FastAPI and PostgreSQL.
- Build automated data pipelines and background task processing.
- Lead architecture reviews and ensure 99.99% system availability.

Requirements:
- 5+ years of experience in Python software engineering.
- Deep expertise in PostgreSQL schema design, indexing, and ACID transactions.
- Hands-on experience with Docker containerization and Kubernetes orchestration.

Preferred Qualifications:
- Familiarity with AWS cloud services (ECS, RDS, S3).
- Experience with CI/CD automation pipelines.
    `.trim();

    const { parsedJD, roleSpec } = ingestJobDescriptionDocument({
      rawText: rawJD,
      source: 'pasted_text',
      fileName: 'senior-backend-jd.txt'
    });

    assert.ok(roleSpec.id.startsWith('role_'), 'Role spec ID should have prefix role_');
    assert.equal(roleSpec.title, 'Senior Backend Platform Engineer');
    assert.equal(roleSpec.seniorityLevel, 'senior');
    assert.equal(roleSpec.roleArchetype, 'backend_engineer');
    assert.ok(roleSpec.sourceDocHash.length === 64, 'SHA-256 hash must be 64 hexadecimal characters');
    assert.equal(roleSpec.documentMetadata.source, 'pasted_text');
    assert.equal(roleSpec.documentMetadata.fileName, 'senior-backend-jd.txt');
    assert.ok(roleSpec.documentMetadata.extractionQualityScore >= 80, 'Well-formed JD should score >= 80 on quality');
    assert.equal(roleSpec.rawJDVerbatim, rawJD, 'Verbatim original JD must be preserved without loss');
  });

  await t.test('[Test 2] Zero Hallucination: Verbatim Quote Anchoring', () => {
    const rawJD = `
Title: Machine Learning Infrastructure Engineer
Company: NeuralWorks

Must Have Requirements:
- Hands-on experience building RAG Architecture & Retrieval pipelines.
- Production Python model serving with FastAPI.
- Relational data modeling with PostgreSQL.
    `.trim();

    const parsed = parseJobDescription(rawJD);

    assert.ok(parsed.requirements.length >= 3, 'Must extract at least 3 requirements');
    for (const req of parsed.requirements) {
      assert.ok(req.original_jd_quote, `Requirement ${req.normalized_requirement} must have original_jd_quote`);
      // Every quote must be an exact substring of the raw JD
      assert.ok(
        rawJD.includes(req.original_jd_quote),
        `Quote "${req.original_jd_quote}" must be an exact verbatim substring of the raw JD`
      );
      assert.ok(req.source_location?.lineRef, 'Must have line reference locator');
    }
  });

  await t.test('[Test 3] Compound Requirement Decomposition Without Collapsing', () => {
    const compoundJD = `
Title: Full Stack Engineer
Role Responsibilities:
- Design and implement scalable REST APIs using FastAPI and PostgreSQL with Docker deployment.
    `.trim();

    const parsed = parseJobDescription(compoundJD);

    const reqNames = parsed.requirements.map(r => r.normalized_requirement);

    // Should independently extract FastAPI, PostgreSQL, REST APIs, Scalability, and Docker
    assert.ok(reqNames.includes('FastAPI'), 'Must decompose FastAPI from compound bullet');
    assert.ok(reqNames.includes('PostgreSQL'), 'Must decompose PostgreSQL from compound bullet');
    assert.ok(reqNames.includes('RESTful API Development'), 'Must decompose RESTful API Development');
    assert.ok(reqNames.includes('Docker'), 'Must decompose Docker from compound bullet');
    assert.ok(reqNames.includes('Application Scalability & Performance'), 'Must decompose Scalability');

    const fastApiReq = parsed.requirements.find(r => r.normalized_requirement === 'FastAPI');
    assert.ok(fastApiReq?.is_decomposed, 'Decomposed requirement must have is_decomposed: true');
    assert.equal(fastApiReq?.parent_compound_requirement, 'Design and implement scalable REST APIs using FastAPI and PostgreSQL with Docker deployment.');
  });

  await t.test('[Test 4] Controlled Ontology Normalization & Hard Non-Equivalence Boundaries', () => {
    // Normalization checks
    const skillPg = canonicalizeSkill('Postgres');
    assert.equal(skillPg?.canonicalName, 'PostgreSQL');

    const skillReact = canonicalizeSkill('React.js');
    assert.equal(skillReact?.canonicalName, 'React');

    const skillLLM = canonicalizeSkill('Large Language Models');
    assert.equal(skillLLM?.canonicalName, 'Generative AI & LLMs');

    // Hard Non-Equivalence Checks
    const mysqlVsPg = checkNonEquivalence('PostgreSQL', 'Extensive experience optimizing MySQL databases and queries');
    assert.equal(mysqlVsPg.isViolated, true, 'MySQL should violate PostgreSQL non-equivalence boundary');
    assert.ok(mysqlVsPg.reason?.includes('PostgreSQL-specific advanced indexing'));

    const cloudVsAws = checkNonEquivalence('AWS', 'Familiar with general cloud computing concepts and hosting');
    assert.equal(cloudVsAws.isViolated, true, 'Generic Cloud should violate AWS boundary');
    assert.ok(cloudVsAws.reason?.includes('hands-on AWS service expertise'));

    const pythonVsFastApi = checkNonEquivalence('FastAPI', '5 years of standard Python data scripting');
    assert.equal(pythonVsFastApi.isViolated, true, 'Python should violate FastAPI framework boundary');

    const reactVsNext = checkNonEquivalence('Next.js', 'Built multiple single-page applications with React');
    assert.equal(reactVsNext.isViolated, true, 'React should violate Next.js boundary');

    // Legitimate target mention should NOT be violated
    const validAws = checkNonEquivalence('AWS', 'Designed multi-tier architectures in AWS with ECS and CloudWatch');
    assert.equal(validAws.isViolated, false, 'Legitimate AWS mention should not be flagged as violation');
  });

  await t.test('[Test 5] Explicit Priority & Weight Determinism', () => {
    const tieredJD = `
Title: Senior Frontend Engineer
Core Requirements:
- Deep expertise with React component design and TypeScript.
Preferred Qualifications:
- Experience with Next.js App Router and SSR.
Nice to Have:
- Familiarity with Tailwind CSS and Figma.
    `.trim();

    const parsed = parseJobDescription(tieredJD);

    const reactReq = parsed.requirements.find(r => r.normalized_requirement === 'React');
    const nextReq = parsed.requirements.find(r => r.normalized_requirement === 'Next.js');
    const tailwindReq = parsed.requirements.find(r => r.normalized_requirement === 'Tailwind CSS');

    assert.equal(reactReq?.priority, 'CRITICAL');
    assert.equal(reactReq?.weight, PRIORITY_WEIGHTS.CRITICAL); // 3.0

    assert.equal(nextReq?.priority, 'PREFERRED');
    assert.equal(nextReq?.weight, PRIORITY_WEIGHTS.PREFERRED); // 1.0

    assert.equal(tailwindReq?.priority, 'NICE_TO_HAVE');
    assert.equal(tailwindReq?.weight, PRIORITY_WEIGHTS.NICE_TO_HAVE); // 0.5
  });

  await t.test('[Test 6] JD Quality Audit: Detects Buzzwords, Contradictory Tenure & Missing Sections', () => {
    const flawedJD = `
Title: Junior Software Engineering Intern
Looking for a 10x rockstar ninja developer who can wear many hats.
Must have 8+ years of experience in building distributed systems.
Requires 8+ years of ChatGPT prompt engineering.
    `.trim();

    const parsed = parseJobDescription(flawedJD);
    const audit = parsed.qualityAudit || auditJDQuality(parsed, flawedJD);

    // 1. Detects buzzwords
    assert.ok(audit.ambiguousStatements.length >= 2, 'Must detect rockstar/ninja and wear many hats');
    const buzzwordFound = audit.ambiguousStatements.some(s => s.statement.toLowerCase().includes('rockstar') || s.statement.toLowerCase().includes('ninja'));
    assert.ok(buzzwordFound, 'Must flag rockstar/ninja');

    // 2. Detects contradictory experience range
    assert.ok(audit.contradictoryExperienceRanges.length >= 1, 'Must detect junior role requiring 8+ years experience');
    assert.ok(audit.contradictoryExperienceRanges[0].statedTenure.includes('8+ years'));

    // 3. Detects unrealistic combinations
    assert.ok(audit.unrealisticCombinations.length >= 1, 'Must flag 8+ years of ChatGPT as chronologically impossible');

    // 4. Detects missing sections
    assert.ok(audit.missingSections.some(s => s.includes('Responsibilities')), 'Must flag missing responsibilities section');

    // 5. Vagueness score & recruiter review gate
    assert.ok(audit.vaguenessScore >= 50, `Vagueness score should be elevated (got ${audit.vaguenessScore})`);
    assert.equal(audit.recruiterReviewRequired, true, 'Recruiter review must be flagged for flawed JD');
  });

  await t.test('[Test 7] Observable Indicators Generation for Technical Competencies', () => {
    const indicatorsRest = getObservableIndicators('RESTful API Development', 'api', 'backend_engineer');
    assert.ok(indicatorsRest.length >= 4, 'REST API should have rich observable indicators');
    assert.ok(indicatorsRest.some(i => i.includes('routing & HTTP method semantics')));
    assert.ok(indicatorsRest.some(i => i.includes('validation schemas')));

    const indicatorsPg = getObservableIndicators('PostgreSQL', 'database', 'backend_engineer');
    assert.ok(indicatorsPg.some(i => i.includes('Relational schema design')));
    assert.ok(indicatorsPg.some(i => i.includes('Indexing strategies')));

    const indicatorsDocker = getObservableIndicators('Docker', 'devops', 'backend_engineer');
    assert.ok(indicatorsDocker.some(i => i.includes('Dockerfile creation with multi-stage builds')));
  });

  await t.test('[Test 8] Deterministic Reproducibility Across Consecutive Runs', () => {
    const rawJD = `
Title: Lead Data Platform Engineer
Responsibilities:
- Build reliable real-time and batch data pipelines using Apache Spark and Kafka.
- Manage deployment to AWS and orchestrate with Docker and Kubernetes.
Qualifications:
- 5+ years building distributed ETL data infrastructure.
- Expert in Python, SQL, and PostgreSQL.
    `.trim();

    const run1 = parseJobDescription(rawJD);
    const run2 = parseJobDescription(rawJD);

    assert.equal(run1.requirements.length, run2.requirements.length, 'Requirement counts must match identically');
    assert.equal(run1.sourceHash, run2.sourceHash, 'Source hashes must be identical');

    for (let i = 0; i < run1.requirements.length; i++) {
      assert.equal(run1.requirements[i].normalized_requirement, run2.requirements[i].normalized_requirement);
      assert.equal(run1.requirements[i].priority, run2.requirements[i].priority);
      assert.equal(run1.requirements[i].weight, run2.requirements[i].weight);
      assert.equal(run1.requirements[i].original_jd_quote, run2.requirements[i].original_jd_quote);
    }
  });

});
