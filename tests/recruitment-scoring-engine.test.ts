import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDeterministicScore,
  calculateTriPartiteMetrics,
  validateScoreIntegrity,
  DEFAULT_SCORING_WEIGHT_CONFIG,
} from '../lib/ai/result-engine/score-engine';
import {
  CanonicalJDRequirement,
  RequirementEvidenceMatch,
} from '../lib/ai/result-engine/types';

test('=== COGNALYZE RECRUITMENT INTELLIGENCE — GATE 6: DETERMINISTIC ROLE ALIGNMENT SCORING ENGINE BENCHMARK ===', async (t) => {

  const makeReq = (id: string, name: string, priority: 'CRITICAL' | 'IMPORTANT' | 'PREFERRED' | 'NICE_TO_HAVE'): CanonicalJDRequirement => ({
    id,
    original_text: `Must have ${name}`,
    normalized_requirement: name,
    category: 'technical',
    subcategory: 'skills',
    priority,
    priority_source_text: `Must have ${name}`,
    requirement_type: 'skill',
    synonyms: [],
    explicitness: 'explicit',
    evidence_policy: 'direct_or_project_evidence',
    weight: priority === 'CRITICAL' ? 6 : priority === 'IMPORTANT' ? 3 : 1,
  });

  const makeMatch = (
    req: CanonicalJDRequirement,
    level: 'LEVEL_5_INDEPENDENTLY_VERIFIED' | 'LEVEL_4_ARTIFACT_BACKED' | 'LEVEL_3_IMPLEMENTATION' | 'LEVEL_2_CONTEXTUAL' | 'LEVEL_1_MENTIONED' | 'LEVEL_0_NO_EVIDENCE',
    status: 'SUPPORTED' | 'PARTIAL' | 'CLAIM_ONLY' | 'EVIDENCE_GAP',
    contribution: number,
    confidence: number,
    relevanceFactor: number = 1.0
  ): RequirementEvidenceMatch => {
    const weight = req.weight ?? 3;
    const earned_points = Math.round(weight * contribution * relevanceFactor * 100) / 100;
    return {
      requirementId: req.id,
      requirementName: req.normalized_requirement,
      priority: req.priority,
      relationship: level === 'LEVEL_0_NO_EVIDENCE' ? 'NO_EVIDENCE' : level === 'LEVEL_1_MENTIONED' ? 'CLAIM_ONLY' : 'DIRECT',
      status,
      evidenceStrength: level === 'LEVEL_0_NO_EVIDENCE' ? 'NONE' : level === 'LEVEL_1_MENTIONED' ? 'WEAK' : 'STRONG',
      evidenceStrengthLevel: level,
      evidenceContribution: contribution,
      relevanceFactor,
      evidenceType: level === 'LEVEL_0_NO_EVIDENCE' ? 'NO_EVIDENCE' : 'DIRECT_IMPLEMENTATION',
      confidence,
      confidenceTier: confidence >= 0.70 ? 'HIGH' : confidence >= 0.40 ? 'MEDIUM' : 'LOW',
      matchedEvidenceIds: level === 'LEVEL_0_NO_EVIDENCE' ? [] : [`EVD-${req.id}`],
      evidenceQuotes: level === 'LEVEL_0_NO_EVIDENCE' ? [] : [`Implemented ${req.normalized_requirement}`],
      reasoning: `Evidence for ${req.normalized_requirement}`,
      actionableRecommendation: 'Action',
      requirement_weight: weight,
      status_multiplier: contribution,
      earned_points,
      possible_points: weight,
    };
  };

  await t.test('[Test 1] Tri-Partite Decoupled Metrics: Independent Alignment, Confidence & Coverage', () => {
    // 5 requirements: 1 Critical (weight 6), 2 Important (weight 3 each), 2 Preferred (weight 1 each) -> Total possible: 14
    const r1 = makeReq('R1', 'PostgreSQL', 'CRITICAL');
    const r2 = makeReq('R2', 'FastAPI', 'IMPORTANT');
    const r3 = makeReq('R3', 'Docker', 'IMPORTANT');
    const r4 = makeReq('R4', 'Redis', 'PREFERRED');
    const r5 = makeReq('R5', 'Kubernetes', 'PREFERRED');

    const requirements = [r1, r2, r3, r4, r5];

    // Candidate has independently verified PostgreSQL (Level 5, 100% contribution, 0.98 confidence)
    // But has ZERO evidence for the other 4 requirements
    const matches = [
      makeMatch(r1, 'LEVEL_5_INDEPENDENTLY_VERIFIED', 'SUPPORTED', 1.00, 0.98),
      makeMatch(r2, 'LEVEL_0_NO_EVIDENCE', 'EVIDENCE_GAP', 0.00, 0.00),
      makeMatch(r3, 'LEVEL_0_NO_EVIDENCE', 'EVIDENCE_GAP', 0.00, 0.00),
      makeMatch(r4, 'LEVEL_0_NO_EVIDENCE', 'EVIDENCE_GAP', 0.00, 0.00),
      makeMatch(r5, 'LEVEL_0_NO_EVIDENCE', 'EVIDENCE_GAP', 0.00, 0.00),
    ];

    const score = calculateDeterministicScore(requirements, matches);

    // 1. Role Alignment: 6 earned / 14 possible = 42.86%
    assert.equal(score.roleAlignmentPercentage, 42.86);
    assert.equal(score.overallEvidenceMatch, 43);

    // 2. Requirement Coverage: 1 assessed / 5 total = 20.00%
    assert.equal(score.requirementCoveragePercentage, 20.00);

    // 3. Evidence Confidence: weighted confidence = (0.98 * 6) / 14 = 42.00%
    assert.equal(score.evidenceConfidencePercentage, 42.00);

    // Assert decoupling: alignment (42.86%) != coverage (20.00%)
    assert.notEqual(score.roleAlignmentPercentage, score.requirementCoveragePercentage);
    assert.equal(score.triPartiteScore?.breakdown.totalAssessedRequirements, 1);
    assert.equal(score.triPartiteScore?.breakdown.totalUnassessedRequirements, 4);
  });

  await t.test('[Test 2] High Confidence on Low Coverage vs High Coverage on Low Confidence', () => {
    const r1 = makeReq('R1', 'Go', 'CRITICAL');
    const r2 = makeReq('R2', 'Rust', 'CRITICAL');
    const requirements = [r1, r2];

    // Candidate A: 1 verified requirement (100% on 1, 0% on 2)
    const matchesA = [
      makeMatch(r1, 'LEVEL_5_INDEPENDENTLY_VERIFIED', 'SUPPORTED', 1.00, 0.98),
      makeMatch(r2, 'LEVEL_0_NO_EVIDENCE', 'EVIDENCE_GAP', 0.00, 0.00),
    ];
    const scoreA = calculateDeterministicScore(requirements, matchesA);

    // Candidate B: both requirements mentioned only in skills list (Level 1, 10% contribution, 0.40 confidence)
    const matchesB = [
      makeMatch(r1, 'LEVEL_1_MENTIONED', 'CLAIM_ONLY', 0.10, 0.40),
      makeMatch(r2, 'LEVEL_1_MENTIONED', 'CLAIM_ONLY', 0.10, 0.40),
    ];
    const scoreB = calculateDeterministicScore(requirements, matchesB);

    // Candidate A has higher alignment on R1 and higher confidence on R1, but lower coverage (50%)
    assert.equal(scoreA.requirementCoveragePercentage, 50.00);
    assert.equal(scoreA.roleAlignmentPercentage, 50.00);

    // Candidate B has 100% coverage, but low alignment (10%) and lower confidence (40%)
    assert.equal(scoreB.requirementCoveragePercentage, 100.00);
    assert.equal(scoreB.roleAlignmentPercentage, 10.00);
    assert.equal(scoreB.evidenceConfidencePercentage, 40.00);

    // They must never be conflated
    assert.ok(scoreA.roleAlignmentPercentage > scoreB.roleAlignmentPercentage);
    assert.ok(scoreB.requirementCoveragePercentage > scoreA.requirementCoveragePercentage);
  });

  await t.test('[Test 3] Zero Points Invariant: Level 0 Evidence Gap strictly earns 0.00 points', () => {
    const r1 = makeReq('R1', 'Kubernetes', 'CRITICAL');
    const requirements = [r1];
    const matches = [makeMatch(r1, 'LEVEL_0_NO_EVIDENCE', 'EVIDENCE_GAP', 0.00, 0.00)];

    const score = calculateDeterministicScore(requirements, matches);
    assert.equal(score.totalEarnedPoints, 0.00);
    assert.equal(score.roleAlignmentPercentage, 0.00);
    assert.equal(score.overallEvidenceMatch, 0);
  });

  await t.test('[Test 4] Maximum Points Invariant: Earned points cannot exceed possible points', () => {
    const r1 = makeReq('R1', 'Python', 'CRITICAL');
    const requirements = [r1];
    const matches = [makeMatch(r1, 'LEVEL_5_INDEPENDENTLY_VERIFIED', 'SUPPORTED', 1.00, 1.00)];

    const score = calculateDeterministicScore(requirements, matches);
    assert.equal(score.totalEarnedPoints, 6.00);
    assert.equal(score.totalPossiblePoints, 6.00);
    assert.equal(score.roleAlignmentPercentage, 100.00);
    assert.ok(score.pointsAuditPassed);
  });

  await t.test('[Test 5] Anti-Cheat Invariant: validateScoreIntegrity catches fabricated points', () => {
    const r1 = makeReq('R1', 'AWS', 'CRITICAL');
    const requirements = [r1];

    // Forged match where Level 0 earns 5 points
    const forgedMatch = makeMatch(r1, 'LEVEL_0_NO_EVIDENCE', 'EVIDENCE_GAP', 0.00, 0.00);
    forgedMatch.earned_points = 5.0;

    const integrity = validateScoreIntegrity(requirements, [forgedMatch], 83);
    assert.equal(integrity.valid, false);
    assert.ok(integrity.error?.includes('LEVEL_0_NO_EVIDENCE but earned 5 points'));
  });

  await t.test('[Test 6] Configurable Weights: Custom priority weight overrides calculate deterministically', () => {
    const r1 = makeReq('R1', 'Next.js', 'CRITICAL');
    const r2 = makeReq('R2', 'TypeScript', 'PREFERRED');
    const requirements = [r1, r2];

    const matches = [
      makeMatch(r1, 'LEVEL_3_IMPLEMENTATION', 'SUPPORTED', 0.65, 0.80),
      makeMatch(r2, 'LEVEL_5_INDEPENDENTLY_VERIFIED', 'SUPPORTED', 1.00, 0.98),
    ];

    const customConfig = {
      ...DEFAULT_SCORING_WEIGHT_CONFIG,
      priorityWeights: {
        CRITICAL: 10,
        IMPORTANT: 5,
        PREFERRED: 2,
        NICE_TO_HAVE: 1,
      },
      version: 'custom-calibrated-v1',
    };

    // With customConfig, R1 weight is 10, R2 weight is 2. Possible = 12.
    // Update match weights to match custom config
    matches[0].requirement_weight = 10;
    matches[0].possible_points = 10;
    matches[0].earned_points = Math.round(10 * 0.65 * 100) / 100; // 6.5

    matches[1].requirement_weight = 2;
    matches[1].possible_points = 2;
    matches[1].earned_points = Math.round(2 * 1.00 * 100) / 100; // 2.0

    const score = calculateDeterministicScore(requirements, matches, customConfig);
    // Earned = 8.5 / 12 = 70.83%
    assert.equal(score.roleAlignmentPercentage, 70.83);
    assert.equal(score.scoringModelVersion, 'custom-calibrated-v1');
  });

  await t.test('[Test 7] Deterministic Reproducibility: 100 consecutive runs produce bit-for-bit identical outputs', () => {
    const reqs = [
      makeReq('R1', 'Java', 'CRITICAL'),
      makeReq('R2', 'Spring Boot', 'CRITICAL'),
      makeReq('R3', 'PostgreSQL', 'IMPORTANT'),
      makeReq('R4', 'Kafka', 'IMPORTANT'),
      makeReq('R5', 'Docker', 'PREFERRED'),
    ];

    const matches = [
      makeMatch(reqs[0], 'LEVEL_3_IMPLEMENTATION', 'SUPPORTED', 0.65, 0.80),
      makeMatch(reqs[1], 'LEVEL_2_CONTEXTUAL', 'PARTIAL', 0.35, 0.50),
      makeMatch(reqs[2], 'LEVEL_5_INDEPENDENTLY_VERIFIED', 'SUPPORTED', 1.00, 0.98),
      makeMatch(reqs[3], 'LEVEL_0_NO_EVIDENCE', 'EVIDENCE_GAP', 0.00, 0.00),
      makeMatch(reqs[4], 'LEVEL_4_ARTIFACT_BACKED', 'SUPPORTED', 0.85, 0.90),
    ];

    const firstRun = calculateDeterministicScore(reqs, matches);

    for (let i = 0; i < 100; i++) {
      const run = calculateDeterministicScore(reqs, matches);
      assert.equal(run.overallEvidenceMatch, firstRun.overallEvidenceMatch);
      assert.equal(run.roleAlignmentPercentage, firstRun.roleAlignmentPercentage);
      assert.equal(run.evidenceConfidencePercentage, firstRun.evidenceConfidencePercentage);
      assert.equal(run.requirementCoveragePercentage, firstRun.requirementCoveragePercentage);
      assert.equal(run.totalEarnedPoints, firstRun.totalEarnedPoints);
      assert.equal(run.totalPossiblePoints, firstRun.totalPossiblePoints);
    }
  });

  await t.test('[Test 8] Category Breakdown Reconciliation: Category scores reflect individual priority weights', () => {
    const r1 = makeReq('R1', 'Critical-1', 'CRITICAL');
    const r2 = makeReq('R2', 'Critical-2', 'CRITICAL');
    const r3 = makeReq('R3', 'Important-1', 'IMPORTANT');
    const requirements = [r1, r2, r3];

    // Critical-1: 100%, Critical-2: 0% -> Critical category should be 50%
    // Important-1: 100% -> Important category should be 100%
    const matches = [
      makeMatch(r1, 'LEVEL_5_INDEPENDENTLY_VERIFIED', 'SUPPORTED', 1.00, 1.00),
      makeMatch(r2, 'LEVEL_0_NO_EVIDENCE', 'EVIDENCE_GAP', 0.00, 0.00),
      makeMatch(r3, 'LEVEL_5_INDEPENDENTLY_VERIFIED', 'SUPPORTED', 1.00, 1.00),
    ];

    const score = calculateDeterministicScore(requirements, matches);
    assert.equal(score.criticalScore, 50);
    assert.equal(score.importantScore, 100);
    assert.equal(score.preferredScore, 100); // 0 preferred reqs defaults to 100
  });

  await t.test('[Test 9] Defensibility Tier Classification: Distinguishes STRONG, MODERATE, and WEAK', () => {
    const r1 = makeReq('R1', 'Core Tech', 'CRITICAL');
    const requirements = [r1];

    // Strong: High confidence (0.95), High alignment (100%)
    const strongMatch = [makeMatch(r1, 'LEVEL_5_INDEPENDENTLY_VERIFIED', 'SUPPORTED', 1.00, 0.95)];
    const strongScore = calculateDeterministicScore(requirements, strongMatch);
    assert.equal(strongScore.triPartiteScore?.breakdown.scoringDefensibility, 'STRONG');

    // Moderate: Moderate confidence (0.50), Moderate alignment (35%)
    const modMatch = [makeMatch(r1, 'LEVEL_2_CONTEXTUAL', 'PARTIAL', 0.35, 0.50)];
    const modScore = calculateDeterministicScore(requirements, modMatch);
    assert.equal(modScore.triPartiteScore?.breakdown.scoringDefensibility, 'MODERATE');

    // Weak: Zero confidence (0.00), Zero alignment (0%)
    const weakMatch = [makeMatch(r1, 'LEVEL_0_NO_EVIDENCE', 'EVIDENCE_GAP', 0.00, 0.00)];
    const weakScore = calculateDeterministicScore(requirements, weakMatch);
    assert.equal(weakScore.triPartiteScore?.breakdown.scoringDefensibility, 'WEAK');
  });

  await t.test('[Test 10] Mathematical Invariant: Summary counts sum exactly to total requirements count', () => {
    const reqs = [
      makeReq('R1', 'Skill1', 'CRITICAL'),
      makeReq('R2', 'Skill2', 'IMPORTANT'),
      makeReq('R3', 'Skill3', 'PREFERRED'),
      makeReq('R4', 'Skill4', 'NICE_TO_HAVE'),
    ];

    const matches = [
      makeMatch(reqs[0], 'LEVEL_3_IMPLEMENTATION', 'SUPPORTED', 0.65, 0.80),
      makeMatch(reqs[1], 'LEVEL_2_CONTEXTUAL', 'PARTIAL', 0.35, 0.50),
      makeMatch(reqs[2], 'LEVEL_1_MENTIONED', 'CLAIM_ONLY', 0.10, 0.40),
      makeMatch(reqs[3], 'LEVEL_0_NO_EVIDENCE', 'EVIDENCE_GAP', 0.00, 0.00),
    ];

    const score = calculateDeterministicScore(reqs, matches);
    const sum =
      score.summaryCounts.supported +
      score.summaryCounts.partial +
      score.summaryCounts.claimOnly +
      score.summaryCounts.evidenceGaps +
      score.summaryCounts.skillGaps +
      score.summaryCounts.missing +
      score.summaryCounts.contradicted;

    assert.equal(sum, reqs.length);
    assert.equal(score.summaryCounts.totalRequirements, reqs.length);
  });
});

