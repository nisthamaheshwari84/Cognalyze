/**
 * COGNALYZE — RESUME & ATS DIAGNOSTICS MASTER REGRESSION & ADVERSARIAL BENCHMARK
 * Validates Section 17 Mandatory Regression Assertions & Section 18 Adversarial Cases (A-J).
 * 
 * Asserts:
 * - Single source of truth across all 12 diagnostic sections
 * - Zero fabrication of candidate skills, metrics, or professional experience
 * - Alternative (OR) qualification handling without unearned penalties
 * - Accurate project detection without false zeros
 * - Fair early-career & internship evaluation without inflated corporate tenure
 * - Pure candidate isolation without cross-user contamination
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { runCanonicalResultEngine } from '../lib/ai/result-engine';
import { parseResume } from '../lib/ai/result-engine/resume-engine';
import { parseJobDescription } from '../lib/ai/result-engine/jd-engine';
import { matchRequirementsToEvidence } from '../lib/ai/result-engine/matching-engine';
import { calculateDeterministicScore } from '../lib/ai/result-engine/score-engine';

// =========================================================================
// SECTION 17: MANDATORY CANONICAL REGRESSION TEST FIXTURE
// =========================================================================

const SECTION_17_JD = `Software Development Engineer Intern.

Must-have:
- Python OR C++ OR Java.
- DSA.
- OOP.
- HTML/CSS/JavaScript.
- REST APIs.
- Git/GitHub.
- SQL.
- Debugging and analytical skills.

Preferred:
- React.
- Next.js.
- FastAPI.
- Flask.
- AI/ML.
- Generative AI.
- LLM APIs.
- Cloud deployment.
- Open-source contributions.
- Hackathons.`;

const SECTION_17_RESUME = `Candidate: Nistha Maheshwari.

Education:
- B.Tech CSE, AI & ML.
- ABES Engineering College.
- Currently pursuing undergraduate studies.

Skills:
- Python.
- C++.
- JavaScript.
- DSA.
- OOP.
- DBMS.
- Operating Systems.
- Computer Networks.
- HTML.
- CSS.
- React.
- Next.js.
- REST APIs.
- Git.
- GitHub.
- Supabase.
- Vercel.
- Render.
- AI/ML.
- Generative AI.
- LLM APIs.
- Prompt Engineering.

Projects:
- Cognalyze.
- SwasthyaSathi AI.
- Web Development Projects.

Experience:
- AI/ML Intern, Raudra Eduservices.`;

test('SECTION 17: Complete 12-Assertion Master Regression Suite', async () => {
  const result = await runCanonicalResultEngine(SECTION_17_RESUME, SECTION_17_JD);

  // Assertion 1: Alternative languages (Python OR C++ OR Java)
  const langMatch = result.matches.find(
    (m) => m.requirement_logic === 'OR' && m.alternatives?.includes('Python')
  );
  assert.ok(langMatch, 'Alternative programming languages requirement must exist as a single logical disjunction');
  assert.strictEqual(langMatch.alternative_satisfied, true, 'Alternative requirement must be satisfied because Python/C++ is present');
  assert.strictEqual(langMatch.status, 'CLAIM_ONLY', 'Alternative status reflects candidate evidence level');
  const javaMatch = result.matches.find((m) => m.requirementName === 'Java');
  assert.strictEqual(javaMatch, undefined, 'Java must NOT exist as an independent mandatory requirement when JD specifies OR');

  // Assertion 2: DSA must not be Level 0
  const dsaMatch = result.matches.find((m) => m.requirementName.includes('Data Structures'));
  assert.ok(dsaMatch, 'DSA requirement must be evaluated');
  assert.notStrictEqual(dsaMatch.evidenceStrengthLevel, 'LEVEL_0_NO_EVIDENCE', 'DSA must NOT be classified as Level 0 because it appears in Skills');
  assert.strictEqual(dsaMatch.evidenceStrengthLevel, 'LEVEL_1_MENTIONED', 'DSA without dedicated project code receives Level 1 Mentioned');

  // Assertion 3: OOP must not be Level 0
  const oopMatch = result.matches.find((m) => m.requirementName.includes('Object-Oriented'));
  assert.ok(oopMatch, 'OOP requirement must be evaluated');
  assert.notStrictEqual(oopMatch.evidenceStrengthLevel, 'LEVEL_0_NO_EVIDENCE', 'OOP must NOT be classified as Level 0 because it appears in Skills');
  assert.strictEqual(oopMatch.evidenceStrengthLevel, 'LEVEL_1_MENTIONED', 'OOP receives Level 1 Mentioned');

  // Assertion 4: Projects (At least 3 detected; Experience Quality must not report zero)
  assert.strictEqual(result.candidate.projects.length >= 3, true, 'At least 3 projects must be parsed from resume');
  assert.strictEqual(result.experienceAnalysis.projectEvidence.count, result.candidate.projects.length, 'Experience Quality project count must match parsed projects');
  assert.notStrictEqual(result.experienceAnalysis.projectEvidence.count, 0, 'Experience Quality must NEVER report zero projects when projects are present');

  // Assertion 5: Experience (Internship identified as internship, not multi-year employment)
  assert.strictEqual(result.experienceAnalysis.internshipExperience.documented, true, 'Internship must be documented');
  assert.strictEqual(result.experienceAnalysis.professionalExperience.level, 'EARLY', 'Student internship must be rated EARLY, never EXTENSIVE');
  assert.strictEqual(result.experienceAnalysis.professionalExperience.detail.includes('multi-year'), false, 'Must not claim multi-year corporate tenure for student');

  // Assertion 6: Python distinguished as mentioned (Level 1)
  assert.ok(langMatch.evidenceStrengthLevel === 'LEVEL_1_MENTIONED', 'Python in skills without project code is Level 1');

  // Assertion 7: JavaScript in skills must not be completely absent
  const jsMatch = result.matches.find((m) => m.requirementName.includes('JavaScript') || m.alternatives?.includes('JavaScript'));
  assert.ok(jsMatch, 'JavaScript requirement must exist');
  assert.notStrictEqual(jsMatch.evidenceStrengthLevel, 'LEVEL_0_NO_EVIDENCE', 'JavaScript must not be classified as completely absent');

  // Assertion 8: SQL does not appear in resume -> strictly Level 0 Evidence Gap
  const sqlMatch = result.matches.find((m) => m.requirementName === 'SQL');
  assert.ok(sqlMatch, 'SQL requirement must be evaluated');
  assert.strictEqual(sqlMatch.status, 'EVIDENCE_GAP', 'SQL must be marked EVIDENCE_GAP');
  assert.strictEqual(sqlMatch.evidenceStrengthLevel, 'LEVEL_0_NO_EVIDENCE', 'SQL must be Level 0');
  assert.strictEqual(sqlMatch.earned_points, 0, 'Level 0 requirement must strictly earn 0 points');

  // Assertion 9: FastAPI & Flask are unevidenced -> strictly gaps, never verified
  const fastapiMatch = result.matches.find((m) => m.requirementName === 'FastAPI');
  const flaskMatch = result.matches.find((m) => m.requirementName === 'Flask');
  assert.ok(fastapiMatch && flaskMatch, 'FastAPI and Flask requirements must be evaluated');
  assert.strictEqual(fastapiMatch.status, 'EVIDENCE_GAP', 'FastAPI must be an evidence gap');
  assert.strictEqual(flaskMatch.status, 'EVIDENCE_GAP', 'Flask must be an evidence gap');
  assert.strictEqual(fastapiMatch.verificationStatus, 'NOT_EVIDENCED', 'FastAPI must not be verified');

  // Assertion 10: Machine Learning from education does NOT become verified implementation
  const mlMatch = result.matches.find((m) => m.requirementName === 'Machine Learning');
  assert.ok(mlMatch, 'Machine Learning requirement must be evaluated');
  assert.notStrictEqual(mlMatch.evidenceStrengthLevel, 'LEVEL_3_IMPLEMENTATION', 'Educational degree must NEVER be awarded Level 3 Implementation');
  assert.strictEqual(mlMatch.evidenceStrengthLevel, 'LEVEL_1_MENTIONED', 'Education specialization without project code is Level 1');

  // Assertion 11: Git / GitHub evaluated based on supplied text
  const gitMatch = result.matches.find((m) => m.requirementName.includes('Git'));
  assert.ok(gitMatch, 'Git requirement must exist');
  assert.strictEqual(gitMatch.evidenceStrengthLevel, 'LEVEL_1_MENTIONED', 'Git listed in skills receives Level 1');

  // Assertion 12: Zero fabrication & validation gate passed
  assert.strictEqual(result.validation.passed, true, 'Master validation audit must pass cleanly');
  assert.strictEqual(result.validation.violations.length, 0, 'Must have zero cross-section consistency violations');
});

// =========================================================================
// SECTION 18: ADVERSARIAL TEST CASES (A THROUGH J)
// =========================================================================

test('ADVERSARIAL CASE A: Keyword Stuffing (50 skills, zero projects -> strictly Level 1, no inflated implementation)', async () => {
  const jd = `Full Stack Engineer. Requirements: Python, React, PostgreSQL, Docker, AWS.`;
  const resume = `Candidate: Spammer.
Skills: Python, React, PostgreSQL, Docker, AWS, Kubernetes, Redis, Java, C++, Go, Rust, Ruby, PHP, Swift, Kotlin, Dart, Flutter, Vue, Angular, Svelte, Django, Flask, FastAPI, Spring, Express, NestJS, GraphQL, gRPC, Kafka, RabbitMQ, Elasticsearch, MongoDB, Cassandra, DynamoDB, Oracle, SQLite, Terraform, Ansible, Jenkins, CircleCI, Linux, Git, Bash, Machine Learning, Deep Learning, NLP, CV, PyTorch, TensorFlow, Scikit-learn.`;

  const result = await runCanonicalResultEngine(resume, jd);
  assert.strictEqual(result.candidate.projects.length, 0, 'No projects must be extracted');
  assert.strictEqual(result.experienceAnalysis.projectEvidence.count, 0, 'Project evidence count must be 0');
  for (const m of result.matches) {
    if (m.status !== 'EVIDENCE_GAP') {
      assert.strictEqual(m.evidenceStrengthLevel, 'LEVEL_1_MENTIONED', 'Stuffed skills without projects must strictly be Level 1');
      assert.notStrictEqual(m.evidenceStrengthLevel, 'LEVEL_3_IMPLEMENTATION', 'Stuffed skills must NEVER receive Level 3');
    }
  }
});

test('ADVERSARIAL CASE B: Strong Project Evidence (Supported skills elevated; unrelated skills remain unverified)', async () => {
  const jd = `Backend Engineer. Requirements: Python, FastAPI, Docker, Kubernetes.`;
  const resume = `Candidate: Deep Builder.
Projects:
Payment Engine:
- Architected and implemented high-throughput REST APIs in Python using FastAPI.
- Containerized application services using multi-stage Dockerfiles.`;

  const result = await runCanonicalResultEngine(resume, jd);
  const pyMatch = result.matches.find((m) => m.requirementName === 'Python');
  const k8sMatch = result.matches.find((m) => m.requirementName === 'Kubernetes');

  assert.ok(pyMatch && k8sMatch);
  assert.strictEqual(pyMatch.status, 'SUPPORTED', 'Documented Python project implementation must be SUPPORTED');
  assert.strictEqual(pyMatch.evidenceStrengthLevel, 'LEVEL_3_IMPLEMENTATION', 'Action-backed Python project is Level 3');
  assert.strictEqual(k8sMatch.status, 'EVIDENCE_GAP', 'Kubernetes was not in resume and must strictly be EVIDENCE_GAP');
  assert.strictEqual(k8sMatch.earned_points, 0, 'Unrelated missing skill must strictly earn 0 points');
});

test('ADVERSARIAL CASE C: Education-only ML (Degree specialization yields educational evidence, zero verified ML)', async () => {
  const jd = `AI/ML Engineer. Requirements: Machine Learning, Python.`;
  const resume = `Candidate: Scholar.
Education:
B.Tech in Artificial Intelligence and Machine Learning, ABES Engineering College.`;

  const result = await runCanonicalResultEngine(resume, jd);
  const mlMatch = result.matches.find((m) => m.requirementName === 'Machine Learning');
  assert.ok(mlMatch);
  assert.notStrictEqual(mlMatch.evidenceStrengthLevel, 'LEVEL_3_IMPLEMENTATION', 'Education-only ML must never be Level 3 Implementation');
  assert.strictEqual(mlMatch.evidenceStrengthLevel, 'LEVEL_1_MENTIONED', 'Degree specialization must be capped at Level 1');
});

test('ADVERSARIAL CASE D: Multiple Projects (5 project headings with varying formatting -> exactly 5 detected)', async () => {
  const jd = `Software Engineer. Requirements: Python.`;
  const resume = `Candidate: Multi Project Developer.
Projects:
- Project Alpha.
- Project Beta: High-speed analytics platform.
* Project Gamma | React, Node.js
Project Delta
- Developed mobile application.
- Project Epsilon.`;

  const parsed = parseResume(resume);
  assert.strictEqual(parsed.projects.length, 5, 'Must accurately extract exactly 5 projects despite formatting variations');
  assert.strictEqual(parsed.projects.map((p) => p.title).includes('Project Alpha'), true);
  assert.strictEqual(parsed.projects.map((p) => p.title).includes('Project Delta'), true);
});

test('ADVERSARIAL CASE E: Alternative Requirements (JD: Python OR Java OR C++, resume: Python -> satisfied with zero Java penalty)', async () => {
  const jd = `Backend Developer.
Must have:
- Python OR Java OR C++.`;
  const resume = `Candidate: Pythonista.
Projects:
Backend Service:
- Built scalable web services in Python.`;

  const result = await runCanonicalResultEngine(resume, jd);
  assert.strictEqual(result.requirements.length, 1, 'Alternative group must be parsed as exactly 1 canonical requirement');
  const altMatch = result.matches[0];
  assert.strictEqual(altMatch.alternative_satisfied, true, 'Alternative group must be satisfied via Python');
  assert.strictEqual(altMatch.status, 'SUPPORTED', 'Supported Python elevates alternative group to SUPPORTED');
  assert.strictEqual(altMatch.earned_points, Math.round(altMatch.possible_points * 0.65 * (altMatch.relevanceFactor ?? 1) * 100) / 100, 'Earns Level 3 points for satisfied alternative');
  assert.strictEqual(result.gaps.length, 0, 'Satisfied alternative must produce zero gaps (no penalty for missing Java/C++)');
});

test('ADVERSARIAL CASE F: AND Requirements (JD: Python AND SQL, resume: Python only -> overall requirement not fully satisfied)', async () => {
  const jd = `Data Engineer.
Requirements:
- Python.
- SQL.`;
  const resume = `Candidate: Python Dev.
Projects:
Automation Script:
- Built Python data transformation scripts.`;

  const result = await runCanonicalResultEngine(resume, jd);
  const py = result.matches.find((m) => m.requirementName === 'Python');
  const sql = result.matches.find((m) => m.requirementName === 'SQL');
  assert.ok(py && sql);
  assert.strictEqual(py.status, 'SUPPORTED', 'Python is supported');
  assert.strictEqual(sql.status, 'EVIDENCE_GAP', 'SQL is missing');
  assert.strictEqual(sql.earned_points, 0, 'SQL earns 0 points');
  assert.strictEqual(result.score.overallEvidenceMatch < 100, true, 'Missing SQL prevents 100% score');
});

test('ADVERSARIAL CASE G: Contradictory Resume (Preserves claims, flags discrepancies without silent promotion)', async () => {
  const jd = `Software Engineer. Requirements: Python.`;
  const resume = `Candidate: Inconsistent.
Summary:
10 years of professional Python architecture experience.
Education:
B.Tech graduating in 2027.`;

  const result = await runCanonicalResultEngine(resume, jd);
  assert.strictEqual(result.risks.length > 0, true, 'Must detect outsized claim or experience anomaly');
  assert.strictEqual(result.experienceAnalysis.professionalExperience.level !== 'EXTENSIVE', true, 'Must not accept 10-year claim for current undergrad');
});

test('ADVERSARIAL CASE H: Missing / Empty Resume (Explicit rejection, zero fabricated profile)', async () => {
  const jd = `Software Engineer. Requirements: Python.`;
  await assert.rejects(
    async () => {
      await runCanonicalResultEngine('', jd);
    },
    /Resume text cannot be empty/i,
    'Empty resume must fail explicitly with clear error'
  );
});

test('ADVERSARIAL CASE I: Duplicate Skills (Python mentioned 5 times -> one canonical requirement, zero score inflation)', async () => {
  const jd = `Python Engineer. Requirements: Python.`;
  const resume = `Candidate: Python Enthusiast.
Summary: Passionate about Python.
Skills: Python, Python 3, Python programming.
Projects:
Proj1:
- Built tool in Python.
Proj2:
- Wrote tests in Python.`;

  const result = await runCanonicalResultEngine(resume, jd);
  const pyMatches = result.matches.filter((m) => m.requirementName === 'Python');
  assert.strictEqual(pyMatches.length, 1, 'Python must only be evaluated once');
  assert.strictEqual(pyMatches[0].earned_points <= pyMatches[0].possible_points, true, 'Earned points cannot exceed possible');
});

test('ADVERSARIAL CASE J: Cross-User Isolation (Two distinct candidate analyses remain strictly isolated)', async () => {
  const jd = `Full Stack Engineer. Requirements: React, Go.`;
  const resumeA = `Candidate: Alice. Skills: React.`;
  const resumeB = `Candidate: Bob. Skills: Go.`;

  const resA = await runCanonicalResultEngine(resumeA, jd);
  const resB = await runCanonicalResultEngine(resumeB, jd);

  const reactInA = resA.matches.find((m) => m.requirementName === 'React');
  const reactInB = resB.matches.find((m) => m.requirementName === 'React');
  const goInA = resA.matches.find((m) => m.requirementName === 'Go');
  const goInB = resB.matches.find((m) => m.requirementName === 'Go');

  assert.strictEqual(reactInA?.status, 'CLAIM_ONLY', 'Alice has React');
  assert.strictEqual(reactInB?.status, 'EVIDENCE_GAP', 'Bob does not have React');
  assert.strictEqual(goInA?.status, 'EVIDENCE_GAP', 'Alice does not have Go');
  assert.strictEqual(goInB?.status, 'CLAIM_ONLY', 'Bob has Go');
});
