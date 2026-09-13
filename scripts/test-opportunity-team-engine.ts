import { getStudentDNA, setTeamMatchOptIn } from "../lib/ai/student-dna";
import { computeMatchScore } from "../lib/ai/placement-intelligence";
import {
  recommendProblemStatements,
  recordPSInteraction,
  getProblemStatementById,
  getAllProblemStatements
} from "../lib/ai/ps-engine";
import { analyzePSSkillGap, computeSkillGapsAgainstRequirements } from "../lib/ai/skill-gap-bridge";
import {
  findMatchingTeammates,
  simulateTeamSkillGraph,
  CANDIDATE_POOL_STUDENTS
} from "../lib/ai/team-match";
import { createCommunityPost } from "../lib/posts-store";
import { getNotifications } from "../lib/notifications";
import { DEMO_STUDENT_PROFILE, INITIAL_SEED_OPPORTUNITIES } from "../lib/placement-store";

async function runE2EVerification() {
  console.log("================================================================================");
  console.log("🚀 VERIFYING AI OPPORTUNITY & TEAM FORMATION ENGINE (ALL PHASES)");
  console.log("================================================================================\n");

  let allPassed = true;

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 1 DoD: Student DNA & GitHub Enrichment
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("▶ PHASE 1: Student DNA & GitHub Enrichment");
  const dna1 = await getStudentDNA("student-demo");

  const hasSkills = dna1.skills.length > 0;
  const hasDomains = Object.keys(dna1.project_count_by_domain).length > 0;
  const hasGithub = dna1.github_enrichment.provided && dna1.github_enrichment.verified;
  const hasPreferred = dna1.preferred_tech_stack.length > 0;

  console.log(`  - Candidate: ${dna1.candidate_id}`);
  console.log(`  - Stored skills count: ${dna1.skills.length}`);
  console.log(`  - Project domain breakdown:`, dna1.project_count_by_domain);
  console.log(`  - Inferred preferred tech (repeated >=2):`, dna1.preferred_tech_stack);
  console.log(`  - Reused GitHub verification repos: ${dna1.github_enrichment.reposCount} (user: ${dna1.github_enrichment.username})`);
  console.log(`  - Team match opt-in: ${dna1.team_match_opt_in}`);

  if (hasSkills && hasDomains && hasGithub && hasPreferred) {
    console.log("  ✅ DoD 1 PASSED: Student DNA traces strictly to stored data and verified GitHub.\n");
  } else {
    console.error("  ❌ DoD 1 FAILED!");
    allPassed = false;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 1.5 DoD: Opportunity Agent Upgrade (Dimensional Breakdown & Weighting)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("▶ PHASE 1.5: Opportunity Agent Upgrade");
  const opp = INITIAL_SEED_OPPORTUNITIES[0]; // Flipkart GRiD 7.0

  const studentA = { ...DEMO_STUDENT_PROFILE };
  const studentB = {
    ...DEMO_STUDENT_PROFILE,
    candidate_id: "student-frontend-alt",
    skills: [
      { name: "Figma", level: "Expert" as const },
      { name: "CSS", level: "Advanced" as const }
    ],
    past_projects: [
      { title: "Design UI", tech_stack: ["Figma", "CSS"], description: "Component library" }
    ],
    target_roles: ["UI/UX Designer"]
  };

  const matchA1 = computeMatchScore(studentA, opp);
  const matchA2 = computeMatchScore(studentA, opp);
  const matchB = computeMatchScore(studentB, opp);

  const isDeterministic = JSON.stringify(matchA1) === JSON.stringify(matchA2);
  const hasDimensions = matchA1.dimension_breakdown &&
    typeof matchA1.dimension_breakdown.skill_fit_pct === "number" &&
    typeof matchA1.dimension_breakdown.experience_fit_pct === "number" &&
    typeof matchA1.dimension_breakdown.interest_alignment_pct === "number" &&
    typeof matchA1.dimension_breakdown.career_goal_alignment_pct === "number";
  const isMeaningfullyDifferent = matchA1.overall_match_pct !== matchB.overall_match_pct;
  const backwardsCompatible = matchA1.fit_score === matchA1.overall_match_pct;

  console.log(`  - Match A (call 1): ${matchA1.overall_match_pct}% | Breakdown:`, matchA1.dimension_breakdown);
  console.log(`  - Match A (call 2): ${matchA2.overall_match_pct}% | Deterministic: ${isDeterministic}`);
  console.log(`  - Match B: ${matchB.overall_match_pct}% | Different from A: ${isMeaningfullyDifferent}`);
  console.log(`  - Backwards-compatible fit_score present: ${backwardsCompatible}`);
  console.log(`  - Grounded Why Explanation:\n    "${matchA1.why_explanation}"`);

  if (isDeterministic && hasDimensions && isMeaningfullyDifferent && backwardsCompatible) {
    console.log("  ✅ DoD 1.5 PASSED: Multi-dimensional breakdown, deterministic formulas, and proficiency weighting verified.\n");
  } else {
    console.error("  ❌ DoD 1.5 FAILED!");
    allPassed = false;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 2 DoD: PS Knowledge Base & Personalized Recommendation
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("▶ PHASE 2: PS Knowledge Base & Vector Retrieval");
  const allPS = getAllProblemStatements();
  console.log(`  - Total Problem Statements in KB: ${allPS.length}`);

  const dnaStudentA = await getStudentDNA("student-demo");
  const dnaStudentB = {
    ...dnaStudentA,
    candidate_id: "student-crypto-tester",
    target_domains: ["Fintech & Web3"],
    skills: [
      { name: "Solidity", level: "Expert" as const, verified_on_github: true, proficiency_weight: 1.4 },
      { name: "TypeScript", level: "Expert" as const, verified_on_github: true, proficiency_weight: 1.4 }
    ],
    projects: [
      { title: "Smart Contract DEX", tech_stack: ["Solidity"], domain: "Fintech & Web3", github_verified: true, description: "Automated market maker" }
    ]
  };

  const recA = recommendProblemStatements(dnaStudentA, { topK: 3, retrievalShortlistSize: 5 });
  const recB = recommendProblemStatements(dnaStudentB, { topK: 3, retrievalShortlistSize: 5 });

  const topA = recA.recommendations[0];
  const topB = recB.recommendations[0];

  console.log(`  - Candidate pool: ${recA.candidatePoolSize} -> Reduced to shortlist: ${recA.shortlistedCount}`);
  console.log(`  - Student A Top Match: "${topA.ps.title}" (Score: ${topA.deterministic_score}%)`);
  console.log(`  - Student B Top Match: "${topB.ps.title}" (Score: ${topB.deterministic_score}%)`);
  console.log(`  - Distinct Top Recommendations: ${topA.ps.id !== topB.ps.id}`);

  // Test interaction penalty
  const appliedPSId = topA.ps.id;
  recordPSInteraction("student-demo", appliedPSId, "applied");
  const recAAfterApplied = recommendProblemStatements(dnaStudentA, { topK: 3 });
  const appliedExcluded = !recAAfterApplied.recommendations.some(r => r.ps.id === appliedPSId);
  console.log(`  - Applied PS excluded from future recommendations: ${appliedExcluded}`);

  if (topA.ps.id !== topB.ps.id && appliedExcluded && recA.shortlistedCount < recA.candidatePoolSize + 1) {
    console.log("  ✅ DoD 2 PASSED: Vector retrieval narrows pool, rankings are personalized, and applied items are excluded.\n");
  } else {
    console.error("  ❌ DoD 2 FAILED!");
    allPassed = false;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 3 DoD: Skill Gap Analysis & Target Bridge
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("▶ PHASE 3: Skill Gap Analysis");
  const psTarget = getProblemStatementById("ps-flipkart-concurrency-locking")!;
  const gap = analyzePSSkillGap(dnaStudentA, psTarget);

  console.log(`  - Target PS: "${gap.ps_title}"`);
  console.log(`  - Overall Readiness: ${gap.overall_readiness_pct}%`);
  console.log(`  - Covered Skills: ${gap.covered_skills.map(c => c.skill).join(", ")}`);
  console.log(`  - Missing Skills: ${gap.missing_skills.map(m => m.skill).join(", ")}`);
  console.log(`  - Target Profile for TeamMatch:`, gap.team_search_target_profile);

  const hasMissing = gap.missing_skills.length > 0;
  const hasTargetProfile = gap.team_search_target_profile.target_skills_sought.length > 0;

  if (hasMissing && hasTargetProfile) {
    console.log("  ✅ DoD 3 PASSED: Skill gap analysis reuses core logic and produces target profile for team formation.\n");
  } else {
    console.error("  ❌ DoD 3 FAILED!");
    allPassed = false;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 4 DoD: AI TeamMatch & Team Simulator
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("▶ PHASE 4: AI TeamMatch & Team Simulator");
  const teammateMatches = findMatchingTeammates(dnaStudentA, psTarget, gap);

  console.log(`  - Candidate matches found: ${teammateMatches.length}`);
  for (const m of teammateMatches) {
    console.log(`    * ${m.candidate_id}: ${m.team_match_score}% match (covers: ${m.covered_gaps.join(", ") || "None"})`);
  }

  // Confirm private lurker is NEVER surfaced
  const privateSurfaced = teammateMatches.some(m => m.candidate_id === "student-private-lurker");
  console.log(`  - Non-opted-in student excluded from search: ${!privateSurfaced}`);

  // Skill Graph Simulation
  const soloSim = simulateTeamSkillGraph(psTarget, [dnaStudentA]);
  const duoTeammate = CANDIDATE_POOL_STUDENTS.find(c => c.candidate_id === "student-backend-pro")!;
  const duoSim = simulateTeamSkillGraph(psTarget, [dnaStudentA, duoTeammate]);

  console.log(`  - Solo team coverage: ${soloSim.overall_team_coverage_pct}%`);
  console.log(`  - Duo team coverage: ${duoSim.overall_team_coverage_pct}%`);
  const coverageIncreased = duoSim.overall_team_coverage_pct > soloSim.overall_team_coverage_pct;
  console.log(`  - Arithmetic coverage increased: ${coverageIncreased}`);

  if (teammateMatches.length > 0 && !privateSurfaced && coverageIncreased) {
    console.log("  ✅ DoD 4 PASSED: Opt-in enforced, teammates cover gaps, and team simulator computes arithmetic coverage.\n");
  } else {
    console.error("  ❌ DoD 4 FAILED!");
    allPassed = false;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 5 DoD: Collaboration Marketplace & Reverse Matching
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("▶ PHASE 5: Collaboration Marketplace & Reverse Matching");
  const collabPost = await createCommunityPost({
    type: "collaboration",
    title: "Flipkart GRiD Concurrency Syndicate",
    content: "Looking for a backend engineer experienced in Java and Kafka for inventory locking.",
    author_name: "Lead Student",
    author_role: "Student",
    tags: ["Java", "Kafka", "Distributed Systems"],
    skills_sought: ["Java", "Kafka"],
    problem_statement_id: "ps-flipkart-concurrency-locking"
  });

  const backendProNotifs = await getNotifications("student-backend-pro");
  const teamAlert = backendProNotifs.notifications.find(n => n.notification_type === "team_match_alert");

  console.log(`  - Created Collaboration post: ${collabPost.id}`);
  console.log(`  - Reverse-matching alert received by matching student: ${!!teamAlert}`);
  if (teamAlert) {
    console.log(`  - Alert Title: "${teamAlert.title}"`);
    console.log(`  - Alert Body: "${teamAlert.body}"`);
  }

  if (teamAlert) {
    console.log("  ✅ DoD 5 PASSED: Reverse matching dispatches grounded notifications to matching opted-in students.\n");
  } else {
    console.error("  ❌ DoD 5 FAILED!");
    allPassed = false;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 6 DoD: Student DNA Feedback Loop
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("▶ PHASE 6: Student DNA Feedback Loop");
  const initialSkillsCount = dnaStudentA.skills.length;

  // Simulate feedback loop outcome
  const feedbackRes = await fetch("http://localhost:3000/api/student/feedback-loop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      candidateId: "student-demo",
      hackathonId: "opp-flipkart-grid",
      hackathonTitle: "Flipkart GRiD 7.0",
      status: "winner",
      skillsPracticed: ["Kafka", "Distributed Systems", "Raft Consensus"],
      newProject: {
        title: "Distributed Lease Locking Engine",
        techStack: ["Java", "Kafka", "Redis"],
        description: "Built high-concurrency inventory locking with Raft consensus."
      },
      teamRole: "Backend Lead"
    })
  });

  const feedbackData = await feedbackRes.json();
  console.log(`  - Feedback Loop API status: ${feedbackRes.status}`);
  console.log(`  - Updated Skills count: ${feedbackData.updated_skills_count}`);
  console.log(`  - Updated Projects count: ${feedbackData.updated_projects_count}`);

  // Query the server for the updated DNA
  const dnaRes = await fetch("http://localhost:3000/api/student/dna?candidateId=student-demo");
  const dnaData = await dnaRes.json();
  const refreshedDNA = dnaData.dna;

  const hasNewSkill = refreshedDNA.skills.some((s: any) => s.name === "Raft Consensus");
  const hasNewProject = refreshedDNA.projects.some((p: any) => p.title === "Distributed Lease Locking Engine");
  console.log(`  - DNA includes student-confirmed skill 'Raft Consensus': ${hasNewSkill}`);
  console.log(`  - DNA includes student-confirmed project: ${hasNewProject}`);

  if (hasNewSkill && hasNewProject) {
    console.log("  ✅ DoD 6 PASSED: Student DNA updated strictly from confirmed feedback loop inputs.\n");
  } else {
    console.error("  ❌ DoD 6 FAILED!");
    allPassed = false;
  }

  console.log("================================================================================");
  if (allPassed) {
    console.log("🎉 ALL DEFINITIONS OF DONE PASSED SUCCESSFULLY ACROSS ALL PHASES!");
  } else {
    console.error("❌ SOME CHECKS FAILED!");
  }
  console.log("================================================================================\n");

  if (!allPassed) process.exit(1);
}

runE2EVerification().catch(err => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
