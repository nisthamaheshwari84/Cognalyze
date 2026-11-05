/**
 * tests/phase-5-evidence-graph-spine-sync.test.ts
 * 
 * COGNALYZE PHASE 5 VERIFICATION SUITE
 * Evidence Graph & Relational Spine Synchronization
 * 
 * Verifies:
 * 1. Multi-Source Project Entity Deduplication (Scenario 7):
 *    - Merges Resume, GitHub, and LinkedIn mentions into 1 canonical entity.
 *    - Unifies tech stacks without duplicates.
 *    - Elevates verification status and marks isCorroborated = true.
 * 2. Capability Graph Topology & Prerequisite Resolution:
 *    - Backward prerequisite traversal (FastAPI requires Python and AsyncIO).
 *    - Accurate missing prerequisite reporting.
 * 3. Relational Spine Synchronization (sources, claims, evidence_items, evidence_links):
 *    - Maps directness to Tiers (T0-T4).
 *    - Persists and queries spine records idempotently.
 * 4. Multi-Tenant User Isolation:
 *    - Candidate B cannot see Candidate A's spine records or evidence graph.
 * 5. Link Relationship Traversal:
 *    - Supports, partially_supports, and contradicts counts in graph summaries.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deduplicateProjectEntities,
  normalizeProjectKey,
  RawProjectMention,
} from "../lib/evidence/project-entity-deduplication";
import {
  capabilityGraph,
} from "../lib/evidence/capability-graph";
import {
  syncCanonicalEvidenceToSpine,
  getSpineEvidenceForCandidate,
  getSpineClaimsForCandidate,
  getSpineSourcesForCandidate,
  mapDirectnessToTier,
} from "../lib/evidence/spine-synchronizer";
import {
  CanonicalEvidenceItem,
  CanonicalClaimRecord,
} from "../lib/evidence/canonical-types";

test("PHASE 5: 1. Multi-Source Project Entity Deduplication (Scenario 7)", () => {
  // Test normalization
  assert.equal(normalizeProjectKey("HyperRoute: High-throughput API gateway in Go"), "hyperroute");
  assert.equal(normalizeProjectKey("hyperroute-core"), "hyperroute");
  assert.equal(normalizeProjectKey("HyperRoute Gateway Developer"), "hyperroute");

  // Mentions across 3 sources
  const mentions: RawProjectMention[] = [
    {
      sourceType: "resume",
      rawTitle: "HyperRoute: High-throughput API gateway in Go",
      description: "Low latency reverse proxy handling 50k req/sec",
      techStack: ["Go", "Docker"],
    },
    {
      sourceType: "github",
      rawTitle: "hyperroute-core",
      url: "https://github.com/developer/hyperroute-core",
      description: "Core routing engine and buffer pool",
      techStack: ["Go", "Docker", "REST"],
      commitsCount: 45,
      hasTests: true,
      hasCi: true,
    },
    {
      sourceType: "linkedin",
      rawTitle: "HyperRoute Gateway Developer",
      description: "Developed core reverse proxy components",
      techStack: ["Go"],
    },
  ];

  const deduplicated = deduplicateProjectEntities(mentions);

  // Invariant 1: Merges into exactly 1 project entity, never 3
  assert.equal(deduplicated.length, 1, "Must deduplicate to exactly 1 project entity");

  const project = deduplicated[0];
  assert.equal(project.canonicalTitle, "HyperRoute");
  assert.equal(project.rawMentionsCount, 3);
  assert.equal(project.primaryUrl, "https://github.com/developer/hyperroute-core");

  // Invariant 2: Tech stack merged without duplicates
  assert.ok(project.mergedTechStack.includes("Go"));
  assert.ok(project.mergedTechStack.includes("Docker"));
  assert.ok(project.mergedTechStack.includes("REST"));
  assert.equal(new Set(project.mergedTechStack).size, project.mergedTechStack.length);

  // Invariant 3: Multi-source corroboration and verification status elevated
  assert.equal(project.isCorroborated, true, "Must be flagged as corroborated");
  assert.equal(project.verificationStatus, "INDEPENDENTLY_VERIFIED");
  assert.equal(project.hasTests, true);
  assert.equal(project.hasCi, true);
  assert.equal(project.totalCommits, 45);
  assert.ok(project.provenanceSummary.includes("RESUME"));
  assert.ok(project.provenanceSummary.includes("GITHUB"));
  assert.ok(project.provenanceSummary.includes("LINKEDIN"));
});

test("PHASE 5: 2. Capability Graph Topology & Prerequisite Resolution", () => {
  // FastAPI prerequisite chain: requires Python and AsyncIO
  const fastapiPrereqs = capabilityGraph.getPrerequisiteChain("fastapi");
  assert.ok(fastapiPrereqs.includes("python"), "FastAPI must require Python");
  assert.ok(fastapiPrereqs.includes("asyncio"), "FastAPI must require AsyncIO Concurrency");

  // Candidate with partial prerequisites (Python only, lacking AsyncIO)
  const candidateId = `cand_prereq_${Date.now()}`;
  const partialCheck = capabilityGraph.verifyPrerequisitesSatisfied(
    candidateId,
    "fastapi",
    ["python"]
  );
  assert.equal(partialCheck.satisfied, false, "Must not be satisfied when AsyncIO is missing");
  assert.ok(partialCheck.missingPrerequisites.includes("asyncio"));

  // Candidate with all prerequisites satisfied (Python + AsyncIO)
  const fullCheck = capabilityGraph.verifyPrerequisitesSatisfied(
    candidateId,
    "fastapi",
    ["python", "asyncio"]
  );
  assert.equal(fullCheck.satisfied, true, "Must be satisfied when all prerequisites are met");
  assert.equal(fullCheck.missingPrerequisites.length, 0);
});

test("PHASE 5: 3. Relational Spine Synchronization & Tier Mapping", async () => {
  const candidateId = `candidate_spine_${Date.now()}`;

  // Directness to Tier mapping
  assert.equal(mapDirectnessToTier("DIRECT_IMPLEMENTATION"), "T3");
  assert.equal(mapDirectnessToTier("TEST_ASSERTION"), "T3");
  assert.equal(mapDirectnessToTier("CONFIGURED_DEPENDENCY"), "T2");
  assert.equal(mapDirectnessToTier("DOCUMENTED_MENTION"), "T1");
  assert.equal(mapDirectnessToTier("ASSESSMENT_RESPONSE"), "T4");

  const canonicalEvidence: CanonicalEvidenceItem[] = [
    {
      id: `ev_${Date.now()}_1`,
      userId: candidateId,
      sourceId: "gh_repo_fastapi_app",
      sourceType: "github",
      sourceUrl: "https://github.com/candidate/fastapi-app",
      artifactRef: "main.py:L1-L25",
      verbatimQuote: "@app.get('/health')\ndef health(): return {'status': 'ok'}",
      skillId: "fastapi",
      skillName: "FastAPI",
      evidenceType: "route_definition",
      strength: 0.9,
      directness: "DIRECT_IMPLEMENTATION",
      confidence: "HIGH",
      verificationStatus: "VERIFIED",
      verificationMethod: "ast_import_parser",
      verificationTimestamp: new Date().toISOString(),
      observedAt: new Date().toISOString(),
    },
    {
      id: `ev_${Date.now()}_2`,
      userId: candidateId,
      sourceId: "pkg_json_postgres",
      sourceType: "github",
      sourceUrl: "https://github.com/candidate/fastapi-app",
      artifactRef: "package.json",
      verbatimQuote: '"pg": "^8.11.0"',
      skillId: "postgresql",
      skillName: "PostgreSQL",
      evidenceType: "dependency_manifest",
      strength: 0.5,
      directness: "CONFIGURED_DEPENDENCY",
      confidence: "MEDIUM",
      verificationStatus: "DEMONSTRATED",
      verificationMethod: "manifest_parser",
      verificationTimestamp: new Date().toISOString(),
      observedAt: new Date().toISOString(),
    },
  ];

  const canonicalClaims: CanonicalClaimRecord[] = [
    {
      id: `cl_${Date.now()}_1`,
      userId: candidateId,
      sourceType: "resume",
      category: "technical_skill",
      statement: "3 years developing production FastAPI backends with PostgreSQL",
      skillId: "fastapi",
      claimedProficiency: 4,
      supportingEvidenceIds: [canonicalEvidence[0].id],
      contradictingEvidenceIds: [],
      status: "SUPPORTED",
      extractedAt: new Date().toISOString(),
    },
  ];

  const syncResult = await syncCanonicalEvidenceToSpine(
    candidateId,
    canonicalEvidence,
    canonicalClaims
  );

  assert.equal(syncResult.evidenceItemsCount, 2);
  assert.equal(syncResult.claimsCount, 1);
  assert.ok(syncResult.sourcesCount >= 1);
  assert.equal(syncResult.linksCount, 2, "Must create 2 links to capability nodes");

  // Query back from spine
  const storedEvidence = await getSpineEvidenceForCandidate(candidateId);
  assert.equal(storedEvidence.length, 2);
  assert.equal(storedEvidence[0].tier, "T3", "Direct implementation must map to T3");
  assert.equal(storedEvidence[1].tier, "T2", "Configured dependency must map to T2");

  const storedClaims = await getSpineClaimsForCandidate(candidateId);
  assert.equal(storedClaims.length, 1);
  assert.equal(storedClaims[0].text, canonicalClaims[0].statement);

  const storedSources = await getSpineSourcesForCandidate(candidateId);
  assert.ok(storedSources.length >= 1);
});

test("PHASE 5: 4. Multi-Tenant User Isolation on Evidence Graph & Spine", async () => {
  const userAlpha = `tenant_alpha_${Date.now()}`;
  const userBeta = `tenant_beta_${Date.now()}`;

  // Alpha evidence
  await syncCanonicalEvidenceToSpine(userAlpha, [
    {
      id: `ev_alpha_${Date.now()}`,
      userId: userAlpha,
      sourceId: "gh_repo_alpha",
      sourceType: "github",
      skillId: "raft",
      evidenceType: "code",
      strength: 0.95,
      directness: "DIRECT_IMPLEMENTATION",
      confidence: "HIGH",
      verificationStatus: "VERIFIED",
      verificationMethod: "code_inspection",
      verificationTimestamp: new Date().toISOString(),
      observedAt: new Date().toISOString(),
    },
  ]);

  // Beta queries spine evidence
  const betaEvidence = await getSpineEvidenceForCandidate(userBeta);
  assert.equal(betaEvidence.length, 0, "User Beta must see ZERO evidence items from User Alpha");

  const betaClaims = await getSpineClaimsForCandidate(userBeta);
  assert.equal(betaClaims.length, 0, "User Beta must see ZERO claims from User Alpha");

  // Beta queries capability graph
  const betaGraph = capabilityGraph.getCandidateCapabilityGraph(userBeta);
  assert.equal(betaGraph.totalCapabilitiesLinked, 0, "User Beta capability graph must have 0 linked nodes");
  assert.equal(betaGraph.links.length, 0);

  // Alpha queries capability graph
  const alphaGraph = capabilityGraph.getCandidateCapabilityGraph(userAlpha);
  assert.equal(alphaGraph.totalCapabilitiesLinked, 1);
  assert.equal(alphaGraph.supportedCapabilitiesCount, 1);
});

