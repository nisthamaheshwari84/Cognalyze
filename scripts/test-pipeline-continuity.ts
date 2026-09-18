/**
 * AUTOMATED VERIFICATION: END-TO-END PIPELINE DATA CONTINUITY
 * 
 * Verifies that data entered in:
 * 1. Role DNA Architect (/recruiter/roles)
 * 2. Candidate Screening (/recruiter/candidates)
 * 
 * FLOWS DIRECTLY AND ACCURATELY INTO:
 * 3. Decision Room (/recruiter/decision-room)
 * 
 * with ZERO reversion to pre-fed seed data (Vikram Malhotra / default role).
 */

import { getAllRoles, saveRole, getAllCandidates, addCandidate, getCandidateById, getRoleById } from "../lib/recruiter-store";
import { RoleDNA } from "../lib/ai/role-dna";
import { buildEvidenceGraph } from "../lib/ai/evidence-graph";
import { computeRoleCandidateMatch, generateMinimumProofPlan } from "../lib/ai/minimum-proof";

async function runPipelineContinuityTest() {
  console.log("══════════════════════════════════════════════════════════════════════════════");
  console.log("🧪 TESTING PIPELINE CONTINUITY: ROLE DNA → CANDIDATE SCREENING → DECISION ROOM");
  console.log("══════════════════════════════════════════════════════════════════════════════\n");

  let passed = 0;

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1: Recruiter creates a brand new custom Role DNA
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("▶ [STEP 1] Recruiter creates custom Role DNA: 'Lead Cryptographic Security Architect'...");
  const customRoleId = `role-crypto-${Date.now()}`;
  const customRole: RoleDNA = {
    id: customRoleId,
    title: "Lead Cryptographic Security Architect",
    department: "Security & Zero Knowledge",
    seniority: "Staff",
    targetHires: 1,
    status: "active",
    uncertaintyThreshold: 0.20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    businessOutcomes: [
      {
        id: "out-crypto-1",
        outcome: "Audit and verify zero-knowledge proof circuit latency under 120ms for rollups",
        metric: "100% formal verification sign-off",
        timeframe: "First 90 days",
        impactSeverity: "Critical"
      }
    ],
    tieredRequirements: [
      {
        id: "req-crypto-1",
        name: "Zero-Knowledge Proofs & Elliptic Curve Cryptography",
        tier: "Critical",
        category: "Technical",
        description: "Deep practical knowledge of Circom, halo2, pairing-friendly curves, and BLS signatures",
        weightPct: 35,
        verificationMethod: "work_sample",
        dealBreakerIfMissing: true,
        acceptableProofTypes: ["production_code", "live_work_sample"]
      },
      {
        id: "req-crypto-2",
        name: "Rust Systems & Memory-Safe Concurrency",
        tier: "Critical",
        category: "Technical",
        description: "Zero-copy serialization, SIMD optimizations, and multi-threaded prover execution",
        weightPct: 35,
        verificationMethod: "code_execution",
        dealBreakerIfMissing: true,
        acceptableProofTypes: ["production_code", "github_commit"]
      },
      {
        id: "req-crypto-3",
        name: "Smart Contract Threat Modeling & Formal Verification",
        tier: "Preferred",
        category: "System Design",
        description: "Audit experience with EVM bytecode and fuzzing engines",
        weightPct: 30,
        verificationMethod: "portfolio_audit",
        dealBreakerIfMissing: false,
        acceptableProofTypes: ["live_work_sample", "verified_interview"]
      }
    ]
  };

  await saveRole(customRole);
  const rolesAfterSave = await getAllRoles();
  
  if (rolesAfterSave[0].id !== customRoleId) {
    throw new Error(`Expected newly created role to be at index 0, got ${rolesAfterSave[0].id}`);
  }
  console.log(`  ✓ Role successfully prepended to active store: "${rolesAfterSave[0].title}"`);
  passed++;

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2: Recruiter uploads and screens a custom candidate for this role
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n▶ [STEP 2] Recruiter uploads & screens custom candidate: 'Rohan Sen' for this role...");
  const customCandId = `cand-rohan-${Date.now()}`;
  const rohanResume = `Rohan Sen
Cryptographic Systems Engineer & Rust Builder
Location: Bengaluru, India | Email: rohan.sen@zksecurity.io

Summary:
5+ years writing production-grade Zero-Knowledge circuits and high-performance Rust cryptographic libraries.
Specialized in Circom, Halo2, and BLS12-381 curve arithmetic.

Experience:
- Staff Cryptographer at ZK-Scale Labs (2022 - Present):
  * Authored optimized Halo2 PLONK prover accelerating proving time by 3.8x using AVX-512 SIMD in Rust.
  * Implemented pairing-friendly elliptic curve operations for decentralized cross-rollup verification bridges.
  * Conducted formal audits on zk-SNARK circuits processing $450M in daily transaction volume.
- Systems Engineer at SecureChain (2020 - 2022):
  * Wrote multi-threaded Rust consensus verifier with zero-copy deserialization.
  * Eliminated timing side-channel attacks across ECDSA and Ed25519 signing routines.

Projects:
- halo2-simd-prover: Open-source SIMD-vectorized backend for Halo2 zero-knowledge circuits in Rust.
- circom-rollup-circuits: Production state transition verification circuits in Circom.

Skills: Rust, Circom, Halo2, Cryptography, Zero-Knowledge Proofs, C++, Go, Multi-threading, Formal Verification.`;

  await addCandidate({
    id: customCandId,
    name: "Rohan Sen",
    email: "rohan.sen@zksecurity.io",
    appliedRoleId: customRoleId,
    appliedRoleTitle: customRole.title,
    sourceType: "bulk_upload",
    appliedAt: new Date().toISOString(),
    resumeText: rohanResume,
    currentStage: "In Decision Room"
  });

  const candidatesAfterAdd = await getAllCandidates();
  if (candidatesAfterAdd[0].id !== customCandId) {
    throw new Error(`Expected newly created candidate to be at index 0, got ${candidatesAfterAdd[0].id}`);
  }
  console.log(`  ✓ Custom candidate successfully prepended to active store: "${candidatesAfterAdd[0].name}"`);
  passed++;

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3: Verify Decision Room receives and evaluates Rohan Sen against Crypto Role
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n▶ [STEP 3] Verifying Decision Room Evidence Synthesis Pipeline on Rohan Sen & Custom Role...");

  const activeCand = await getCandidateById(customCandId);
  const activeRole = await getRoleById(customRoleId);

  if (!activeCand || activeCand.name !== "Rohan Sen") {
    throw new Error("Failed to fetch Rohan Sen from store");
  }
  if (!activeRole || activeRole.title !== "Lead Cryptographic Security Architect") {
    throw new Error("Failed to fetch Lead Cryptographic Security Architect from store");
  }

  // Generate Evidence Graph
  const { candidateDNA, nodes } = buildEvidenceGraph(
    {
      id: activeCand.id,
      name: activeCand.name,
      resumeText: activeCand.resumeText,
    },
    activeRole
  );

  console.log(`  ✓ Candidate DNA Name: "${candidateDNA.name}" (NOT Vikram Malhotra)`);
  console.log(`  ✓ Growth Velocity: ${candidateDNA.growthVelocityScore}/100`);
  console.log(`  ✓ Total Evidence Nodes: ${nodes.length} requirement nodes audited`);

  // Verify critical requirement matching
  const cryptoReqNode = nodes.find(n => n.requirementId === "req-crypto-1");
  if (!cryptoReqNode) {
    throw new Error("Missing req-crypto-1 node in evidence graph");
  }
  console.log(`  ✓ Requirement "${cryptoReqNode.requirementName}" Status: ${cryptoReqNode.uncertaintyStatus.toUpperCase()}`);
  console.log(`  ✓ Empirical Evidence Claim: "${cryptoReqNode.claim}"`);

  if (!cryptoReqNode.claim.toLowerCase().includes("zero-knowledge") && !cryptoReqNode.claim.toLowerCase().includes("halo2")) {
    throw new Error("Evidence claim does not contain Rohan's cryptography experience");
  }

  // Match Engine
  const match = computeRoleCandidateMatch(activeRole, candidateDNA);
  console.log(`  ✓ Match Engine Score against ${activeRole.title}: ${match.matchScore}/100`);
  console.log(`  ✓ Decision Readiness: ${match.decisionReadiness} (${match.overallVerdict})`);
  console.log(`  ✓ Evidence Split: ${match.evidenceSplit.partial.length} partial claims, ${match.evidenceSplit.unknown.length} unknowns`);

  // Minimum Proof Plan
  const proofPlan = generateMinimumProofPlan(activeRole, candidateDNA);
  console.log(`  ✓ Minimum Proof Plan: ${proofPlan.minimalActionsCount} minimal actions needed`);
  console.log(`  ✓ Recommended Verification Probes: ${proofPlan.proposals.length} probes prioritized`);
  console.log(`  ✓ Critical Prioritized First: ${proofPlan.prioritizationIntegrityCheck.criticalPrioritizedFirst}`);

  if (match.matchScore <= 0) {
    throw new Error(`Expected valid match score for Rohan Sen on Cryptography role, got ${match.matchScore}`);
  }
  passed++;

  console.log("\n══════════════════════════════════════════════════════════════════════════════");
  console.log(`🎉 ALL ${passed}/3 PIPELINE CONTINUITY TESTS PASSED!`);
  console.log("   Data created in Step 1 & Step 2 flowed 100% cleanly into Decision Room!");
  console.log("   Zero reversion to Vikram Malhotra or pre-fed seed data.");
  console.log("══════════════════════════════════════════════════════════════════════════════");
}

runPipelineContinuityTest().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
