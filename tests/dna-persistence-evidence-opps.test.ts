import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import {
  createUser,
  upsertStudentProfileByUserId,
  getStudentProfileByUserId,
  toggleStudentSavedOpportunity,
  getStudentSavedOpportunities,
  upsertStudentTrackedApplication,
  getStudentTrackedApplications,
} from "../lib/auth/store";
import { getStudentProfile, invalidatePlacementProfile } from "../lib/placement-store";
import { getStudentDNAFull, invalidateUserDNAScope } from "../lib/dna/store";
import {
  getAllPersonalizedOpportunities,
  evaluateOpportunityAgainstStudentDNA,
} from "../lib/dna/opportunity-intelligence";

describe("Cognalyze Core Fix Verification: Persistence, Grounded Evidence & Opportunity Intelligence", () => {
  const timestamp = Date.now();
  const userAId = "test-student-dna-persist-a-" + timestamp;
  const userBId = "test-student-dna-persist-b-" + timestamp;

  before(() => {
    // Initialize user accounts in store
    createUser({
      id: userAId,
      email: `arjun_${timestamp}@example.com`,
      fullName: "Arjun Sharma",
      passwordHash: "hash",
      passwordSalt: "salt",
      accountType: "student",
      status: "ACTIVE"
    });

    createUser({
      id: userBId,
      email: `priya_${timestamp}@example.com`,
      fullName: "Priya Patel",
      passwordHash: "hash",
      passwordSalt: "salt",
      accountType: "student",
      status: "ACTIVE"
    });
  });

  it("1. Student DNA Persistence: Partial step save restores without data loss or reset", () => {
    // Student A saves step 3 with partial data
    upsertStudentProfileByUserId(userAId, {
      fullName: "Arjun Sharma",
      college: "BITS Pilani",
      year: "3rd Year",
      degree: "B.Tech Computer Science",
      branch: "Computer Science",
      graduationYear: "2027",
      cgpa: "8.9",
      currentStep: 3,
      coursework: ["Distributed Systems", "Database Internals"],
      skills: [
        { name: "Go", level: "Intermediate", yearsOfExperience: 2, evidenceSource: "Self-Reported & Projects" },
        { name: "PostgreSQL", level: "Advanced", yearsOfExperience: 3, evidenceSource: "Internship" }
      ],
      careerGoals: {
        targetRoles: ["Backend Engineer", "Systems Engineer"],
        preferredDomains: ["Fintech"],
        targetCompanies: ["Razorpay", "Zerodha"],
        preferredLocations: ["Bengaluru"],
        careerGoals: "Aiming for distributed systems engineering roles"
      }
    });

    const restoredProfileA = getStudentProfileByUserId(userAId);
    assert.ok(restoredProfileA, "Profile A must exist");
    assert.equal(restoredProfileA.currentStep, 3, "currentStep must persist at 3, not reset to 1");
    assert.equal(restoredProfileA.fullName, "Arjun Sharma");
    assert.equal(restoredProfileA.college, "BITS Pilani");
    assert.equal(restoredProfileA.skills?.length, 2);
    assert.deepEqual(restoredProfileA.coursework, ["Distributed Systems", "Database Internals"]);

    // Student A subsequently advances to step 4 and adds a project
    upsertStudentProfileByUserId(userAId, {
      currentStep: 4,
      projects: [
        {
          title: "Distributed Key-Value Store",
          description: "Raft consensus protocol implemented in Go with write-ahead logging",
          techStack: ["Go", "Raft", "gRPC"],
          githubUrl: "https://github.com/arjun/raft-kv",
          duration: "3 months"
        }
      ]
    });

    const updatedProfileA = getStudentProfileByUserId(userAId);
    assert.equal(updatedProfileA?.currentStep, 4, "currentStep updated to 4");
    assert.equal(updatedProfileA?.skills?.length, 2, "Earlier step skills must be preserved during partial step update");
    assert.equal(updatedProfileA?.projects?.length, 1);
    assert.equal(updatedProfileA?.college, "BITS Pilani", "Earlier step education must be preserved");
  });

  it("2. User Isolation: User B profile is completely isolated from User A", () => {
    // User B registers with different data
    upsertStudentProfileByUserId(userBId, {
      fullName: "Priya Patel",
      college: "IIT Bombay",
      currentStep: 2,
      skills: [
        { name: "PyTorch", level: "Advanced", yearsOfExperience: 2, evidenceSource: "Research" }
      ]
    });

    const profileA = getStudentProfileByUserId(userAId);
    const profileB = getStudentProfileByUserId(userBId);

    assert.equal(profileA?.fullName, "Arjun Sharma");
    assert.equal(profileB?.fullName, "Priya Patel");
    assert.notEqual(profileA?.skills?.[0]?.name, profileB?.skills?.[0]?.name);
    assert.equal(profileB?.projects?.length || 0, 0, "User B must not see User A's projects");
  });

  it("3. Evidence Grounding: Real students do NOT leak demo student skills or past projects", async () => {
    invalidatePlacementProfile(userAId);
    invalidateUserDNAScope(userAId);

    const placementProfile = await getStudentProfile(userAId);
    assert.ok(placementProfile, "Placement profile must exist");
    assert.equal(placementProfile.candidate_id, userAId);
    
    // Check that placementProfile does NOT have the demo student's fallback skills
    const demoSkillNames = ["FastAPI", "Autonomous Recovery Bot"];
    for (const demoSkill of demoSkillNames) {
      assert.ok(
        !placementProfile.skills.some(s => s.name === demoSkill),
        `Real student must not have demo skill '${demoSkill}'`
      );
      assert.ok(
        !placementProfile.past_projects.some(p => p.title.includes(demoSkill)),
        `Real student must not have demo project '${demoSkill}'`
      );
    }

    // Now test a student with 0 skills: should get clean empty skills, NOT demo skills
    const emptyStudentId = "test-empty-student-" + timestamp;
    createUser({
      id: emptyStudentId,
      email: `empty_${timestamp}@example.com`,
      fullName: "Brand New Student",
      passwordHash: "hash",
      passwordSalt: "salt",
      accountType: "student",
      status: "ACTIVE"
    });

    upsertStudentProfileByUserId(emptyStudentId, {
      fullName: "Brand New Student",
      skills: []
    });
    const emptyPlacementProfile = await getStudentProfile(emptyStudentId);
    assert.ok(emptyPlacementProfile, "Empty placement profile must exist");
    assert.equal(emptyPlacementProfile.skills.length, 0, "Clean new student must have 0 skills, NOT demo fallback");
  });

  it("4. Grounded Student DNA Full: Evidence items are extracted from profile sections", async () => {
    invalidateUserDNAScope(userAId);
    const dna = await getStudentDNAFull(userAId);

    assert.ok(dna, "Student DNA must be generated");
    assert.ok(dna.evidence && dna.evidence.length > 0, "Evidence items must be populated from student profile");
    
    // Must contain evidence for Go and Distributed Key-Value Store
    const hasGoEvidence = dna.evidence.some(e => 
      e.claim.toLowerCase().includes("go") || e.skillId.toLowerCase().includes("go")
    );
    assert.ok(hasGoEvidence, "Must contain Go evidence from student profile");

    const hasProjectEvidence = dna.evidence.some(e => 
      e.claim.toLowerCase().includes("distributed key-value store")
    );
    assert.ok(hasProjectEvidence, "Must contain Project evidence from student profile");

    // Must NOT contain demo evidence
    const hasDemoBot = dna.evidence.some(e => 
      e.claim.toLowerCase().includes("autonomous recovery bot")
    );
    assert.ok(!hasDemoBot, "Must not contain demo bot evidence");
  });

  it("5. Personalized Opportunities: Over 100 real opportunities cataloged with high-signal matches", async () => {
    const opportunities = getAllPersonalizedOpportunities();
    assert.ok(opportunities.length >= 100, `Catalog must contain >= 100 opportunities, found ${opportunities.length}`);

    // Verify presence of jobs, internships, hackathons, and research
    const categories = new Set(opportunities.map(o => o.category));
    assert.ok(categories.has("job"), "Must contain full-time jobs");
    assert.ok(categories.has("internship"), "Must contain internships");
    assert.ok(categories.has("hackathon"), "Must contain hackathons");
    assert.ok(categories.has("research"), "Must contain research roles");
    assert.ok(categories.has("fellowship"), "Must contain fellowships");

    // Evaluate against Student A's DNA
    const dna = await getStudentDNAFull(userAId);
    const backendRole = opportunities.find(o => 
      o.title.toLowerCase().includes("backend") || o.requiredSkills.includes("Go")
    );
    assert.ok(backendRole, "Must find at least one backend/Go role in catalog");

    const evalResult = evaluateOpportunityAgainstStudentDNA(dna.skills, dna.snapshot, backendRole);
    assert.ok(evalResult.dnaAlignmentScore > 0, "Alignment score must be computed based on student's Go skill");
    const hasGoMatched = evalResult.satisfiedMustHaves.some(s => s.skill.toLowerCase().includes("go")) ||
      evalResult.uncertainRequirements.some(s => s.skill.toLowerCase().includes("go")) ||
      evalResult.matchedPreferredSkills.some(s => s.toLowerCase().includes("go"));
    assert.ok(hasGoMatched, "Matched skills must cite student's Go skill");
  });

  it("6. Saved Opportunities & Application Tracker Persistence", () => {
    // Save opportunity for user A
    const testOppId = "opp_razorpay_sde1_2026";
    const saved = toggleStudentSavedOpportunity(userAId, testOppId);
    assert.equal(saved, true, "Should toggle to saved");

    const userASaved = getStudentSavedOpportunities(userAId);
    assert.ok(userASaved.includes(testOppId), "Saved opportunities must persist in auth store");

    // Track application stage transition
    upsertStudentTrackedApplication(userAId, {
      opportunityId: testOppId,
      stage: "INTERVIEW",
      notes: "First technical round scheduled for Friday"
    });

    const userATracked = getStudentTrackedApplications(userAId);
    const trackedRecord = userATracked.find(t => t.opportunityId === testOppId);
    assert.ok(trackedRecord, "Tracked application record must exist");
    assert.equal(trackedRecord.stage, "INTERVIEW");
    assert.equal(trackedRecord.notes, "First technical round scheduled for Friday");

    // Ensure User B has none of User A's saved or tracked opportunities
    const userBSaved = getStudentSavedOpportunities(userBId);
    assert.equal(userBSaved.length, 0, "User B must have 0 saved opportunities");
    const userBTracked = getStudentTrackedApplications(userBId);
    assert.equal(userBTracked.length, 0, "User B must have 0 tracked applications");

    // Unsave opportunity for User A
    const unsaved = toggleStudentSavedOpportunity(userAId, testOppId);
    assert.equal(unsaved, false, "Should toggle to unsaved");
    const userASavedAfter = getStudentSavedOpportunities(userAId);
    assert.ok(!userASavedAfter.includes(testOppId), "Opportunity must be removed from saved list");
  });
});
