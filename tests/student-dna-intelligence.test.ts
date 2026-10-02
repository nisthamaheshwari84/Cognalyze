/**
 * tests/student-dna-intelligence.test.ts
 * Rigorous test suite validating all 10 Critical Test Cases from Section 56
 * of the Cognalyze Student DNA & Skill Gap Intelligence Layer specification.
 */

import { normalizeSkill, getCanonicalSkill } from "../lib/dna/taxonomy";
import {
  processEvidencePipeline,
  validateRawSourceData,
  detectContradictions,
  RawSourceData
} from "../lib/dna/evidence-pipeline";
import {
  computeStudentSkillProfile,
  calculateStudentSkillProfile,
  generateStudentDNASnapshot,
  getExplainableWhyForSkill
} from "../lib/dna/profile-engine";
import {
  getBenchmarkProfile,
  parseJobDescriptionDeterministically,
  RequirementProfile
} from "../lib/dna/requirement-engine";
import {
  computeSkillGaps,
  runDeterministicGapAnalysis
} from "../lib/dna/gap-engine";
import {
  getStudentEvidenceList,
  addStudentEvidenceRecord,
  retractEvidenceBySource,
  getStudentDNAFull
} from "../lib/dna/store";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` -> ${detail}` : ""}`);
    testsFailed++;
  }
}

async function runAllTests() {
  console.log("\n============================================================");
  console.log("RUNNING STUDENT DNA & SKILL GAP INTELLIGENCE TEST SUITE");
  console.log("============================================================\n");

  // ─────────────────────────────────────────────────────────────
  // TEST 1: Student says "I know React." (No other evidence)
  // Expected: React = Unknown/Claimed (Level 1), NOT Advanced.
  // ─────────────────────────────────────────────────────────────
  console.log("TEST 1: Self-Declared Claim Only (React)");
  {
    const raw: RawSourceData[] = [
      {
        sourceType: "self_declared",
        sourceId: "claim_01",
        userId: "student_test_1",
        skillRaw: "React",
        evidenceType: "claim",
        claim: "I know React.",
        strength: 0.3
      }
    ];

    const evidence = processEvidencePipeline(raw);
    const reactCanonical = getCanonicalSkill("react")!;
    const skillProfile = computeStudentSkillProfile("student_test_1", reactCanonical, evidence);

    assert(skillProfile.estimatedLevel <= 1, "Level is Familiar/Claimed (<= 1), NOT Advanced", `Got level: ${skillProfile.estimatedLevel}`);
    assert(skillProfile.studentFacingLabel === "Needs Practice", "Student label is 'Needs Practice'", `Got: ${skillProfile.studentFacingLabel}`);
    assert(skillProfile.confidence === "LOW", "Confidence is LOW", `Got: ${skillProfile.confidence}`);
    assert(skillProfile.evidenceCoverage === "LOW", "Coverage is LOW", `Got: ${skillProfile.evidenceCoverage}`);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 2: Multi-Source Corroboration (Resume + GitHub + Assessment)
  // Resume: "Advanced React", GitHub: 2 React repos, Assessment: 90%
  // Expected: React = Strong/Advanced with High confidence.
  // ─────────────────────────────────────────────────────────────
  console.log("\nTEST 2: Corroborated Evidence (Resume + GitHub + Assessment)");
  {
    const raw: RawSourceData[] = [
      {
        sourceType: "resume",
        sourceId: "res_01",
        userId: "student_test_2",
        skillRaw: "React",
        evidenceType: "claim",
        claim: "Advanced React Developer",
        strength: 0.7
      },
      {
        sourceType: "github",
        sourceId: "repo_react_ecommerce",
        userId: "student_test_2",
        skillRaw: "React",
        evidenceType: "public_repo",
        claim: "Built Next.js 15 e-commerce app with React Server Components",
        strength: 0.85
      },
      {
        sourceType: "github",
        sourceId: "repo_react_dashboard",
        userId: "student_test_2",
        skillRaw: "React.js", // Alias test
        evidenceType: "public_repo",
        claim: "Realtime analytics dashboard with React 19",
        strength: 0.85
      },
      {
        sourceType: "assessment",
        sourceId: "cognalyze_react_eval",
        userId: "student_test_2",
        skillRaw: "React",
        evidenceType: "verified_assessment",
        claim: "Practical React Assessment: 90% Score",
        extractedValue: { score: 90 },
        strength: 0.95,
        metadata: { score: 90 }
      }
    ];

    const evidence = processEvidencePipeline(raw);
    const reactCanonical = getCanonicalSkill("react")!;
    const skillProfile = computeStudentSkillProfile("student_test_2", reactCanonical, evidence);

    assert(skillProfile.estimatedLevel >= 4, "Proficiency is Advanced/Strongly Demonstrated (>= 4)", `Got: ${skillProfile.estimatedLevel}`);
    assert(skillProfile.studentFacingLabel === "Strong", "Student label is 'Strong'", `Got: ${skillProfile.studentFacingLabel}`);
    assert(skillProfile.confidence === "HIGH", "Confidence is HIGH", `Got: ${skillProfile.confidence}`);
    assert(skillProfile.evidenceCoverage === "HIGH", "Coverage is HIGH", `Got: ${skillProfile.evidenceCoverage}`);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 3: Contradiction Detection (Resume "Expert SQL" vs 40% Assessment)
  // Expected: Conflicting signals / low demonstrated proficiency with neutral explanation.
  // ─────────────────────────────────────────────────────────────
  console.log("\nTEST 3: Contradiction Detection (Neutral, Non-Accusatory)");
  {
    const raw: RawSourceData[] = [
      {
        sourceType: "resume",
        sourceId: "res_sql",
        userId: "student_test_3",
        skillRaw: "SQL",
        evidenceType: "claim",
        claim: "Expert in SQL and Database Optimization",
        strength: 0.8
      },
      {
        sourceType: "assessment",
        sourceId: "sql_exam",
        userId: "student_test_3",
        skillRaw: "SQL",
        evidenceType: "practical_task",
        claim: "SQL Practical Exam: 40% score",
        extractedValue: { score: 40 },
        strength: 0.4,
        metadata: { score: 40 }
      }
    ];

    const evidence = processEvidencePipeline(raw);
    const sqlCanonical = getCanonicalSkill("sql")!;
    const skillProfile = computeStudentSkillProfile("student_test_3", sqlCanonical, evidence);

    assert(skillProfile.contradiction !== null, "Contradiction detected", `Got contradiction: ${JSON.stringify(skillProfile.contradiction)}`);
    assert(skillProfile.estimatedLevel <= 2, "Proficiency held at Beginner (<= 2) due to conflicting assessment", `Got: ${skillProfile.estimatedLevel}`);
    assert(!skillProfile.contradiction?.neutralExplanation.includes("lie"), "Language does NOT accuse student of lying");
    assert(Boolean(skillProfile.contradiction?.neutralExplanation.includes("reinforcement")), "Language offers constructive guidance");
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 4: Unknown vs Zero & Requirement Gap
  // Requirement: React Intermediate. Student has 0 React evidence.
  // Expected: UNPROVEN / Not enough evidence yet (NOT GAP = 0).
  // ─────────────────────────────────────────────────────────────
  console.log("\nTEST 4: UNPROVEN vs Zero");
  {
    const reactCanonical = getCanonicalSkill("react")!;
    const skillProfile = computeStudentSkillProfile("student_test_4", reactCanonical, []);

    assert(skillProfile.estimatedLevel === 0, "Level is 0 (Unknown)", `Got: ${skillProfile.estimatedLevel}`);
    assert(skillProfile.studentFacingLabel === "Not enough evidence", "Student facing label is 'Not enough evidence'");

    const reqProfile: RequirementProfile = {
      id: "req_test",
      roleTitle: "Frontend Intern",
      requirements: [
        {
          skillId: "react",
          skillName: "React",
          category: "Frontend",
          targetLevel: 2,
          targetLevelLabel: "Beginner",
          importance: "MUST_HAVE",
          sourceText: "React proficiency required",
          confidence: "HIGH"
        }
      ],
      extractedAt: new Date().toISOString()
    };

    const gapReport = computeSkillGaps("student_test_4", [skillProfile], reqProfile);
    const reactGap = gapReport.gaps.find(g => g.skillId === "react");

    assert(reactGap?.gapStatus === "UNPROVEN", "GapStatus is strictly UNPROVEN", `Got: ${reactGap?.gapStatus}`);
    assert(reactGap?.gapSize !== 0, "Gap size is flagged (> 0), not falsely 0", `Got: ${reactGap?.gapSize}`);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 5: Requirement Met
  // Requirement: Python Intermediate (3). Student: Python Advanced (4).
  // Expected: MET.
  // ─────────────────────────────────────────────────────────────
  console.log("\nTEST 5: Requirement Met (Python)");
  {
    const raw: RawSourceData[] = [
      {
        sourceType: "github",
        sourceId: "gh_repo_1",
        userId: "student_test_5",
        skillRaw: "Python",
        evidenceType: "public_repo",
        claim: "Built async FastAPI backend with SQLAlchemy",
        strength: 0.85
      },
      {
        sourceType: "assessment",
        sourceId: "cog_py_eval",
        userId: "student_test_5",
        skillRaw: "Python",
        evidenceType: "verified_assessment",
        claim: "Scored 88% on Python Backend Assessment",
        extractedValue: { score: 88 },
        strength: 0.9,
        metadata: { score: 88 }
      }
    ];

    const evidence = processEvidencePipeline(raw);
    const pyCanonical = getCanonicalSkill("python")!;
    const skillProfile = computeStudentSkillProfile("student_test_5", pyCanonical, evidence);

    const reqProfile: RequirementProfile = {
      id: "req_backend",
      roleTitle: "Backend Developer",
      requirements: [
        {
          skillId: "python",
          skillName: "Python",
          category: "Languages",
          targetLevel: 3,
          targetLevelLabel: "Intermediate",
          importance: "MUST_HAVE",
          sourceText: "Python experience",
          confidence: "HIGH"
        }
      ],
      extractedAt: new Date().toISOString()
    };

    const gapReport = computeSkillGaps("student_test_5", [skillProfile], reqProfile);
    const pyGap = gapReport.gaps.find(g => g.skillId === "python");

    assert(pyGap?.gapStatus === "MET", "Status is MET", `Got: ${pyGap?.gapStatus}`);
    assert(pyGap?.gapSize === 0, "Gap size is 0", `Got: ${pyGap?.gapSize}`);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 6: Requirement Gap
  // Requirement: DSA Advanced (4). Student: DSA Beginner (1-2).
  // Expected: GAP.
  // ─────────────────────────────────────────────────────────────
  console.log("\nTEST 6: Significant Skill Gap (DSA)");
  {
    const raw: RawSourceData[] = [
      {
        sourceType: "self_declared",
        sourceId: "claim_dsa",
        userId: "student_test_6",
        skillRaw: "DSA",
        evidenceType: "claim",
        claim: "Solved a few array problems",
        strength: 0.4
      }
    ];

    const evidence = processEvidencePipeline(raw);
    const dsaCanonical = getCanonicalSkill("dsa")!;
    const skillProfile = computeStudentSkillProfile("student_test_6", dsaCanonical, evidence);

    const reqProfile: RequirementProfile = {
      id: "req_sde",
      roleTitle: "SDE-1",
      requirements: [
        {
          skillId: "dsa",
          skillName: "Data Structures & Algorithms",
          category: "Core CS & DSA",
          targetLevel: 4,
          targetLevelLabel: "Advanced",
          importance: "MUST_HAVE",
          sourceText: "Strong problem solving in graphs, dynamic programming, trees",
          confidence: "HIGH"
        }
      ],
      extractedAt: new Date().toISOString()
    };

    const gapReport = computeSkillGaps("student_test_6", [skillProfile], reqProfile);
    const dsaGap = gapReport.gaps.find(g => g.skillId === "dsa");

    assert(dsaGap?.gapStatus === "GAP", "Status is GAP", `Got: ${dsaGap?.gapStatus}`);
    assert((dsaGap?.gapSize || 0) >= 2, "Gap size is >= 2", `Got: ${dsaGap?.gapSize}`);
    assert(dsaGap?.actionRecommendation.ctaHref === "/student/skills/dsa", "Direct action links to Cognalyze DSA practice");
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 7: Canonical Project Entity Deduplication
  // Same project on Resume, LinkedIn, and GitHub.
  // Expected: 1 project entity, corroborating rather than tripling.
  // ─────────────────────────────────────────────────────────────
  console.log("\nTEST 7: Project Entity Deduplication (Resume + LinkedIn + GitHub)");
  {
    const raw: RawSourceData[] = [
      {
        sourceType: "resume",
        sourceId: "res_proj_1",
        userId: "student_test_7",
        skillRaw: "FastAPI",
        evidenceType: "project",
        claim: "Autonomous Payment Recovery Agent with FastAPI",
        metadata: { projectTitle: "Autonomous Payment Recovery Agent" }
      },
      {
        sourceType: "linkedin",
        sourceId: "li_proj_1",
        userId: "student_test_7",
        skillRaw: "FastAPI",
        evidenceType: "project",
        claim: "Autonomous Payment Recovery Agent: Built churn detection bot",
        metadata: { projectTitle: "Autonomous Payment Recovery Agent" }
      },
      {
        sourceType: "github",
        sourceId: "gh_proj_1",
        userId: "student_test_7",
        skillRaw: "FastAPI",
        evidenceType: "public_repo",
        claim: "Production repo: Autonomous Payment Recovery Agent",
        metadata: { projectTitle: "Autonomous Payment Recovery Agent" }
      }
    ];

    const evidence = processEvidencePipeline(raw);
    const fastapiCanonical = getCanonicalSkill("fastapi")!;
    const matching = evidence.filter(e => e.skillId === fastapiCanonical.skillId);

    assert(matching.length === 1, "Deduplicated to exactly 1 underlying entity (not 3)", `Got length: ${matching.length}`);
    assert(matching[0].verificationStatus === "REPEATED", "Verification status elevated to REPEATED", `Got: ${matching[0].verificationStatus}`);
    assert(matching[0].provenance.includes("RESUME") && matching[0].provenance.includes("github"), "Provenance captures corroboration across sources");
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 8: Strict User Isolation (Student A vs Student B)
  // Expected: Zero cross-user data leakage.
  // ─────────────────────────────────────────────────────────────
  console.log("\nTEST 8: Strict Multi-Tenant User Isolation");
  {
    const userA = "student_user_alpha_" + Date.now();
    const userB = "student_user_beta_" + Date.now();

    await addStudentEvidenceRecord(userA, {
      sourceType: "github",
      sourceId: "alpha_repo",
      userId: userA,
      skillRaw: "Rust",
      evidenceType: "public_repo",
      claim: "Built high-performance parser in Rust",
      strength: 0.9,
      metadata: { commits: 150 }
    });

    const listA = await getStudentEvidenceList(userA);
    const listB = await getStudentEvidenceList(userB);

    assert(listA.some(e => e.skillId === "rust"), "User A has Rust evidence");
    assert(!listB.some(e => e.skillId === "rust"), "User B has ZERO Rust evidence from User A (Zero cross-user leakage)");
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 9: Continuous Feedback Loop
  // Student completes a new practical assessment -> DNA updates deterministically.
  // ─────────────────────────────────────────────────────────────
  console.log("\nTEST 9: Continuous Feedback Loop (New Assessment Updates DNA)");
  {
    const user = "student_feedback_loop_" + Date.now();

    // 1. Initial state (no evidence)
    const initialDNA = await getStudentDNAFull(user);
    const initialSystemDesign = initialDNA.skills.find(s => s.skillId === "system_design");
    assert(initialSystemDesign?.estimatedLevel === 0, "Initial System Design is Unknown (0)");

    // 2. Student completes System Design practice session with 92%
    await addStudentEvidenceRecord(user, {
      sourceType: "assessment",
      sourceId: "sys_design_eval_01",
      userId: user,
      skillRaw: "System Design",
      evidenceType: "practical_task",
      claim: "Completed Rate Limiter & High-Concurrency Cache Architecture Assessment",
      extractedValue: { score: 92 },
      strength: 0.95,
      metadata: { score: 92 }
    });

    // 3. DNA recalculates deterministically
    const updatedDNA = await getStudentDNAFull(user);
    const updatedSystemDesign = updatedDNA.skills.find(s => s.skillId === "system_design");

    assert(updatedSystemDesign?.estimatedLevel! >= 2, "System Design level increased to >= 2 after assessment", `Got: ${updatedSystemDesign?.estimatedLevel}`);
    assert(updatedDNA.auditLogs.some(l => l.skillId === "system_design"), "Audit log recorded the transition");
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 10: Retracting an Integration
  // Disconnect GitHub -> GitHub-originated evidence retracted, downstream calculations update.
  // ─────────────────────────────────────────────────────────────
  console.log("\nTEST 10: Integration Disconnection & Retraction");
  {
    const user = "student_retract_test_" + Date.now();

    // Add resume claim and GitHub repo for Docker
    await addStudentEvidenceRecord(user, {
      sourceType: "resume",
      sourceId: "docker_res",
      userId: user,
      skillRaw: "Docker",
      evidenceType: "claim",
      claim: "Docker experience",
      strength: 0.5
    });

    await addStudentEvidenceRecord(user, {
      sourceType: "github",
      sourceId: "docker_repo",
      userId: user,
      skillRaw: "Docker",
      evidenceType: "public_repo",
      claim: "Containerized microservice docker-compose setup",
      strength: 0.9
    });

    const beforeRetract = await getStudentEvidenceList(user);
    assert(beforeRetract.some(e => e.sourceType === "github"), "GitHub evidence present before disconnect");

    // Retract GitHub integration
    const retractResult = await retractEvidenceBySource(user, "github");
    assert(retractResult.success && retractResult.removedCount >= 1, "Retraction succeeded");

    const afterRetract = await getStudentEvidenceList(user);
    assert(!afterRetract.some(e => e.sourceType === "github"), "Zero GitHub evidence remains after disconnect");
    assert(afterRetract.some(e => e.sourceType === "resume"), "Resume evidence remains intact");
  }

  // ─────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log("\n============================================================");
  console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log("============================================================\n");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error("Test execution threw error:", err);
  process.exit(1);
});
