import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

import {
  generateRoleDNASnapshot,
  getRoleDNASnapshot,
  refreshRoleDNASnapshotWithAudit,
  RoleDNASnapshot
} from "../lib/dna/recruiter-snapshot";
import {
  getStudentSavedOpportunityIds,
  toggleStudentSavedOpportunity,
  getStudentTrackedApplications,
  upsertStudentTrackedApplication
} from "../lib/dna/opportunity-intelligence";
import { saveDNAStoreToCloud } from "../lib/dna/store";
import { RoleDNA } from "../lib/ai/role-dna";

test("PHASE 2 REMEDIATION: 1. Recruiter Point-of-Application Snapshot Persistence", async () => {
  const testStudentId = `stud_snap_test_${Date.now()}`;
  const testRoleId = "role-sde-backend-test";

  const mockRole: any = {
    id: testRoleId,
    title: "Senior Backend Engineer",
    department: "Core Engineering",
    seniority: "Senior",
    summary: "Build scalable distributed microservices.",
    technicalRequirements: [
      { name: "Go", importance: "Must-Have", category: "Language", requiredProficiency: "Advanced", minYearsExperience: 3, verifiedEvidenceTypes: ["github"] }
    ],
    experienceRequirements: [],
    behavioralCompetencies: [],
    weights: { technical: 0.7, experience: 0.2, behavioral: 0.1 },
    isComplete: true
  };

  const mockDnaFull: any = {
    userId: testStudentId,
    lastUpdatedAt: new Date().toISOString(),
    skills: [
      { skillId: "golang", skillName: "Go", estimatedLevel: 4, levelLabel: "Advanced", statusReason: "Verified" }
    ],
    snapshot: { overallCoverage: "HIGH" },
    evidence: []
  };

  // 1. Generate snapshot
  const snapshot = generateRoleDNASnapshot({
    studentId: testStudentId,
    candidateName: "Alex Mercer",
    candidateEmail: "alex@example.com",
    role: mockRole,
    dnaFull: mockDnaFull
  });

  assert.ok(snapshot, "Snapshot should be generated");
  assert.equal(snapshot.studentId, testStudentId);
  assert.equal(snapshot.roleId, testRoleId);
  assert.equal(snapshot.snapshotVersion, 1);

  // 2. Retrieve snapshot from disk/memory
  const retrieved = getRoleDNASnapshot(testStudentId, testRoleId);
  assert.ok(retrieved, "Snapshot should be retrieved");
  assert.equal(retrieved.id, snapshot.id);

  // 3. Candidate skill changes should NOT alter existing frozen snapshot
  mockDnaFull.skills.push({ skillId: "python", skillName: "Python", estimatedLevel: 5 });
  const stillFrozen = getRoleDNASnapshot(testStudentId, testRoleId);
  assert.equal(stillFrozen?.skillsAssessment.length, 1, "Snapshot must remain frozen to initial application state");

  // 4. Controlled recruiter refresh increments version with audit log
  const refreshed = refreshRoleDNASnapshotWithAudit(stillFrozen!, mockDnaFull, "Recruiter triggered re-evaluation");
  assert.equal(refreshed.snapshotVersion, 2, "Refreshed snapshot must be version 2");
  assert.equal(refreshed.revisionHistory.length, 1, "Must contain revision history entry");
  assert.equal(refreshed.revisionHistory[0].reason, "Recruiter triggered re-evaluation");
});

test("PHASE 2 REMEDIATION: 2. Elimination of Multi-Tenant Cloud Mirror in public.analyses", async () => {
  // Verify saveDNAStoreToCloud does NOT write to public.analyses under a shared system key
  const result = await saveDNAStoreToCloud();
  assert.equal(result.success, true, "saveDNAStoreToCloud should exit cleanly without cloud mirror failure");

  // Read lib/dna/store.ts to verify CLOUD_DNA_KEY and .from('analyses') are eliminated
  const storeCode = fs.readFileSync(path.join(process.cwd(), "lib/dna/store.ts"), "utf-8");
  assert.ok(!storeCode.includes("CLOUD_DNA_KEY"), "CLOUD_DNA_KEY must be permanently eliminated");
  assert.ok(!storeCode.includes('.from("analyses")'), "Dumping multi-tenant store to analyses table must be eliminated");
});

test("PHASE 2 REMEDIATION: 3. Decommissioned Legacy LLM Route (/api/dna)", async () => {
  const { POST, GET } = await import("../app/api/dna/route");
  
  const postRes = await POST(new Request("http://localhost/api/dna", { method: "POST" }));
  assert.equal(postRes.status, 410, "POST /api/dna must return HTTP 410 Gone");
  const postData = await postRes.json();
  assert.equal(postData.error, "Gone");

  const getRes = await GET(new Request("http://localhost/api/dna", { method: "GET" }));
  assert.equal(getRes.status, 410, "GET /api/dna must return HTTP 410 Gone");
});

test("PHASE 2 REMEDIATION: 4. Subsystem Unification & Saved Opportunities Persistence", async () => {
  const testStudentId = `opp_persist_user_${Date.now()}`;
  const oppId = "opp-stripe-backend-2026";

  // Initially empty
  const initialSaved = getStudentSavedOpportunityIds(testStudentId);
  assert.ok(!initialSaved.includes(oppId), "Should not contain opp initially");

  // Toggle save
  const isSaved = toggleStudentSavedOpportunity(testStudentId, oppId);
  assert.equal(isSaved, true, "Should return true when saved");
  assert.ok(getStudentSavedOpportunityIds(testStudentId).includes(oppId), "Must contain saved opp ID");

  // Track application stage
  const tracked = upsertStudentTrackedApplication(testStudentId, oppId, "APPLIED", "Applied via official careers portal");
  assert.ok(tracked, "Should return tracked application object");
  assert.equal(tracked.stage, "APPLIED");
  assert.equal(tracked.notes, "Applied via official careers portal");

  const allTracked = getStudentTrackedApplications(testStudentId);
  assert.ok(allTracked.some(t => t.opportunityId === oppId && t.stage === "APPLIED"), "Tracked apps must include updated record");
});

