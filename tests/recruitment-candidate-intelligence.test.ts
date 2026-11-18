import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateRequirementAgainstCandidate,
  calculateDocumentedExperienceYears,
  parseResumeSections
} from '../lib/screening/candidate-screening-engine';
import {
  parseResume,
  buildNormalizedCandidateProfile
} from '../lib/ai/result-engine/resume-engine';

test('=== COGNALYZE RECRUITMENT INTELLIGENCE — GATE 3: CANDIDATE INTELLIGENCE BENCHMARK ===', async (t) => {

  await t.test('[Test 1] Anti-Promotion Gate: Flat Skill Keywords Are NEVER Fully SUPPORTED', () => {
    const resumeText = `
Alex Morgan
Full Stack Developer
Email: alex.morgan@example.com

Technical Skills:
- Languages: Python, TypeScript, Java
- Cloud & Infrastructure: Kubernetes, AWS, Docker, Terraform
- Databases: PostgreSQL, Redis

Experience:
Software Developer at Acme Labs (2023 - 2024)
- Developed responsive web interfaces using React and Tailwind CSS.
    `.trim();

    const sections = parseResumeSections(resumeText);

    // Requirement: Kubernetes (without explicit years)
    const k8sReq = { id: 'req_k8s', name: 'Kubernetes', category: 'required' };
    const assessmentK8s = evaluateRequirementAgainstCandidate(k8sReq, resumeText, sections);

    // CRITICAL GATE: Flat skill list MUST be PARTIALLY_SUPPORTED, NEVER SUPPORTED!
    assert.equal(
      assessmentK8s.evidenceState,
      'PARTIALLY_SUPPORTED',
      'Flat skills list item must be PARTIALLY_SUPPORTED, never promoted to SUPPORTED'
    );
    assert.equal(assessmentK8s.evidenceDepth, 'level_1_mentioned');
    assert.ok(
      assessmentK8s.assessmentExplanation.includes('self-reported keyword') ||
      assessmentK8s.assessmentExplanation.includes('does not constitute demonstrated'),
      'Explanation must clearly identify self-reported keyword limitation'
    );

    // Requirement: React (has work experience bullet)
    const reactReq = { id: 'req_react', name: 'React', category: 'required' };
    const assessmentReact = evaluateRequirementAgainstCandidate(reactReq, resumeText, sections);
    assert.equal(assessmentReact.evidenceState, 'SUPPORTED', 'Skill demonstrated in work bullet should be SUPPORTED');
    assert.equal(assessmentReact.evidenceDepth, 'level_3_work_experience');
  });

  await t.test('[Test 2] Non-Overlapping Chronology: Merges Parallel Roles (No Double Counting)', () => {
    // Candidate with overlapping full-time and freelance roles in same 12-month period
    const overlappingResume = `
Work Experience:
Software Engineer at Alpha Corp (Jan 2022 - Jun 2023)
- Built backend APIs.

Freelance Backend Developer at Beta Systems (Jan 2023 - Dec 2023)
- Maintained distributed pipelines.
    `.trim();

    const expCalc = calculateDocumentedExperienceYears(overlappingResume);

    // Jan 2022 to Jun 2023 = 18 months
    // Jan 2023 to Dec 2023 = 12 months (6 months overlap with Alpha Corp)
    // Non-overlapping interval: Jan 2022 to Dec 2023 = 24 months = 2.0 years
    assert.equal(
      expCalc.approxYears,
      2.0,
      `Overlapping dates must merge to 2.0 years, not sum to 2.5 years (got ${expCalc.approxYears})`
    );
    assert.equal(expCalc.totalNonOverlappingMonths, 24);
  });

  await t.test('[Test 3] Non-Overlapping Chronology: Gaps Between Employment Are Not Inferred as Experience', () => {
    // Candidate with 1 year experience, 5 year career gap, then 2 years experience
    const gappedResume = `
Work Experience:
Junior Developer at StartUp Inc (Jan 2018 - Dec 2018)
- Built internal tools.

Senior Developer at Enterprise Corp (Jan 2024 - Dec 2025)
- Led microservices transition.
    `.trim();

    const expCalc = calculateDocumentedExperienceYears(gappedResume);

    // 2018 (12 months) + 2024-2025 (24 months) = 36 months = 3.0 years
    // Must NOT calculate 2025 - 2018 = 7 or 8 years!
    assert.equal(
      expCalc.approxYears,
      3.0,
      `Gapped employment must equal 3.0 years, not 7 or 8 years (got ${expCalc.approxYears})`
    );
    assert.equal(expCalc.totalNonOverlappingMonths, 36);
  });

  await t.test('[Test 4] Chronology Breakdown: Separates Internships from Full-Time Tenure', () => {
    const mixedResume = `
Experience:
Software Engineering Intern at Google (May 2023 - Aug 2023)
- Optimized query cache.

Full-Time Software Engineer at Cloudflare (Jan 2024 - Dec 2024)
- Developed Edge Workers.
    `.trim();

    const expCalc = calculateDocumentedExperienceYears(mixedResume);

    assert.ok(expCalc.internshipYears > 0, 'Must record internship tenure');
    assert.equal(expCalc.fullTimeYears, 1.0, 'Must record 1.0 year full-time tenure');
    assert.ok(expCalc.approxYears >= 1.3, 'Total non-overlapping tenure should reflect combined calendar time');
  });

  await t.test('[Test 5] Zero Fabrication: Preserves Missing Email & Missing Education Honestly', () => {
    const minimalResume = `
Jane Doe
Backend Engineer

Skills:
- Go, PostgreSQL
    `.trim();

    const parsed = parseResume(minimalResume);

    // Zero fake email
    assert.equal(parsed.email, undefined, 'Must not fabricate dummy email when omitted in resume');

    // Zero fake college/education
    assert.equal(parsed.education.length, 0, 'Must not inject dummy university when education is absent');
  });

  await t.test('[Test 6] CGPA Scale Preservation: Retains Original Scale Without Silent Scale Conversion', () => {
    const resumeTenScale = `
Rahul Sharma
Education:
Bachelor of Technology in Computer Science from IIT Delhi (2020 - 2024)
CGPA: 8.4/10
    `.trim();

    const parsedTen = parseResume(resumeTenScale);
    assert.equal(parsedTen.education.length, 1);
    assert.equal(parsedTen.education[0].gpa, '8.4', 'Must extract exact GPA string');
    assert.equal(parsedTen.education[0].gpaScale, 10, 'Must recognize 10-point CGPA scale');

    const resumeFourScale = `
Emily Watson
Education:
BS in Computer Science from Stanford University (2019 - 2023)
GPA: 3.85 / 4.0
    `.trim();

    const parsedFour = parseResume(resumeFourScale);
    assert.equal(parsedFour.education.length, 1);
    assert.equal(parsedFour.education[0].gpa, '3.85');
    assert.equal(parsedFour.education[0].gpaScale, 4, 'Must recognize 4.0 GPA scale');
  });

  await t.test('[Test 7] Original Document Preservation & Immutable Cryptographic Hash', () => {
    const rawResume = `
David Kim
Senior DevOps Engineer
Email: david.kim@cloudinfra.io
Phone: (555) 987-6543
GitHub: https://github.com/davidkim-infra

Professional Experience:
Platform Engineer at TerraCloud (2022 - Present)
- Architected Kubernetes clusters across multi-region AWS environments.
    `.trim();

    const parsed = parseResume(rawResume);
    const profile = buildNormalizedCandidateProfile(parsed, 'cand_dkim_001');

    assert.equal(profile.id, 'cand_dkim_001');
    assert.equal(profile.rawResumeVerbatim, rawResume, 'Must preserve verbatim resume document');
    assert.equal(profile.sourceHash.length, 64, 'Source hash must be 64-char hex SHA-256');
    assert.equal(profile.contact.name, 'David Kim');
    assert.equal(profile.contact.email, 'david.kim@cloudinfra.io');
    assert.ok(profile.experienceBreakdown.totalNonOverlappingYears >= 4.0, 'Calculates tenure up to current year');
  });

  await t.test('[Test 8] Project Understanding: Action Implementation vs Self-Reported Claim', () => {
    const projectResume = `
Devon Vance
Software Engineer

Technical Skills:
Python, FastAPI, Docker

Projects:
Distributed Task Queue Engine (2024)
- Architected and engineered an asynchronous task worker in Python using Redis and Docker.
- Implemented exponential backoff retry policies and dead-letter queues handling 5,000 tasks/sec.
    `.trim();

    const parsed = parseResume(projectResume);

    // Project bullet should have DIRECT_IMPLEMENTATION evidence
    const projectEv = parsed.evidenceItems.find(e => e.section === 'PROJECTS');
    assert.ok(projectEv, 'Must extract project evidence item');
    assert.equal(projectEv?.evidence_type, 'DIRECT_IMPLEMENTATION', 'Action-oriented project bullet is DIRECT_IMPLEMENTATION');

    // Skill list item must be SKILL_LIST with SELF_CLAIM status
    const skillEv = parsed.evidenceItems.find(e => e.section === 'SKILLS');
    assert.ok(skillEv, 'Must extract skill evidence item');
    assert.equal(skillEv?.evidence_type, 'SKILL_LIST');
    assert.equal(skillEv?.verification_status, 'SELF_CLAIM');
  });

});

