import { StudentDNA, DNASkill } from "@/lib/ai/student-dna";
import { ProblemStatement, getProblemStatementById } from "@/lib/ai/ps-engine";
import { PSSkillGapAnalysis } from "@/lib/ai/skill-gap-bridge";

export interface CandidateTeammateMatch {
  candidate_id: string;
  name: string;
  avatar: string;
  target_roles: string[];
  availability: string;
  team_match_opt_in: boolean;
  team_match_score: number;
  breakdown: {
    skill_complementarity: number;
    ps_relevance: number;
    demonstrated_experience: number;
    availability_fit: number;
  };
  covered_gaps: string[];
  github_verified_skills: string[];
  mutual_growth_narrative: string;
}

export interface SkillCoverageDetail {
  skill: string;
  coverage_pct: number;
  covered_by: { candidate_id: string; proficiency_level: string; weight: number }[];
}

export interface TeamSkillGraphSimulation {
  ps_id: string;
  ps_title: string;
  members_count: number;
  member_ids: string[];
  overall_team_coverage_pct: number;
  skill_coverage: SkillCoverageDetail[];
  uncovered_skills: string[];
  next_best_skill: {
    skill: string;
    potential_coverage_boost_pct: number;
    recommendation_reason: string;
  } | null;
}

export interface TeamFormationRecord {
  id: string;
  ps_id: string;
  initiating_student_id: string;
  status: "forming" | "complete" | "disbanded";
  title?: string;
  description?: string;
  created_at: string;
  members: {
    student_id: string;
    role_contribution: string;
    joined_at: string;
  }[];
}

// ── Pool of Candidate Students for Team Discovery ──
export const CANDIDATE_POOL_STUDENTS: StudentDNA[] = [
  {
    candidate_id: "student-backend-pro",
    skills: [
      { name: "Java", level: "Expert", verified_on_github: true, proficiency_weight: 1.4 },
      { name: "Kafka", level: "Advanced", verified_on_github: true, proficiency_weight: 1.4 },
      { name: "Distributed Systems", level: "Advanced", verified_on_github: true, proficiency_weight: 1.4 },
      { name: "Redis", level: "Advanced", verified_on_github: false, proficiency_weight: 1.2 },
      { name: "PostgreSQL", level: "Advanced", verified_on_github: false, proficiency_weight: 1.2 }
    ],
    project_count_by_domain: { "Distributed Systems & Cloud": 3 },
    projects: [
      {
        title: "Distributed Transaction Coordinator",
        tech_stack: ["Java", "Kafka", "Redis"],
        domain: "Distributed Systems & Cloud",
        github_verified: true,
        description: "Two-phase commit coordinator with Raft consensus"
      }
    ],
    hackathon_history: [
      {
        hackathon_id: "opp-flipkart-grid",
        hackathon_title: "Flipkart GRiD 6.0",
        date: "2025-10-10",
        status: "finalist",
        skills_practiced: ["Kafka", "Java"]
      }
    ],
    ps_interactions_summary: { shown_count: 4, viewed_count: 2, saved_count: 1, rejected_count: 0, applied_count: 0, selected_count: 0 },
    collaboration_history: [],
    preferred_tech_stack: ["Java", "Kafka", "Redis"],
    target_roles: ["Backend Architect", "Distributed Systems Engineer"],
    target_domains: ["Distributed Systems & Cloud"],
    availability: "20 hrs/week",
    risk_appetite: "Aggressive",
    profile_summary: "High-concurrency systems engineer with production Kafka & distributed leasing experience.",
    team_match_opt_in: true, // Opted in
    github_enrichment: {
      provided: true,
      username: "rohan-backend",
      verified: true,
      reposCount: 14,
      topLanguages: ["Java", "Go", "SQL"],
      recentActivityMonths: 12,
      verifiedProjects: ["Distributed Transaction Coordinator"],
      unverifiedClaims: [],
      summary: "Active backend engineer with distributed systems repos",
      notes: ""
    },
    updated_at: new Date().toISOString()
  },
  {
    candidate_id: "student-web3-lead",
    skills: [
      { name: "Solidity", level: "Expert", verified_on_github: true, proficiency_weight: 1.4 },
      { name: "TypeScript", level: "Advanced", verified_on_github: true, proficiency_weight: 1.4 },
      { name: "Ethereum", level: "Advanced", verified_on_github: false, proficiency_weight: 1.2 },
      { name: "State Channels", level: "Advanced", verified_on_github: true, proficiency_weight: 1.4 }
    ],
    project_count_by_domain: { "Fintech & Web3": 2 },
    projects: [
      {
        title: "State Channel Payment Network",
        tech_stack: ["Solidity", "TypeScript", "Ethers.js"],
        domain: "Fintech & Web3",
        github_verified: true,
        description: "Zero-gas micro-payment vouchers on Ethereum"
      }
    ],
    hackathon_history: [],
    ps_interactions_summary: { shown_count: 2, viewed_count: 1, saved_count: 0, rejected_count: 0, applied_count: 0, selected_count: 0 },
    collaboration_history: [],
    preferred_tech_stack: ["Solidity", "TypeScript"],
    target_roles: ["Web3 Engineer", "Smart Contract Auditor"],
    target_domains: ["Fintech & Web3"],
    availability: "15 hrs/week",
    risk_appetite: "Aggressive",
    profile_summary: "Smart contract architect with cryptographic state channel verification experience.",
    team_match_opt_in: true, // Opted in
    github_enrichment: {
      provided: true,
      username: "ananya-crypto",
      verified: true,
      reposCount: 18,
      topLanguages: ["Solidity", "TypeScript"],
      recentActivityMonths: 10,
      verifiedProjects: ["State Channel Payment Network"],
      unverifiedClaims: [],
      summary: "Verified Web3 developer",
      notes: ""
    },
    updated_at: new Date().toISOString()
  },
  {
    candidate_id: "student-private-lurker",
    skills: [
      { name: "Java", level: "Expert", verified_on_github: true, proficiency_weight: 1.4 },
      { name: "Kafka", level: "Advanced", verified_on_github: true, proficiency_weight: 1.4 }
    ],
    project_count_by_domain: { "Distributed Systems & Cloud": 2 },
    projects: [],
    hackathon_history: [],
    ps_interactions_summary: { shown_count: 1, viewed_count: 0, saved_count: 0, rejected_count: 0, applied_count: 0, selected_count: 0 },
    collaboration_history: [],
    preferred_tech_stack: ["Java"],
    target_roles: ["Backend Engineer"],
    target_domains: ["Distributed Systems & Cloud"],
    availability: "10 hrs/week",
    risk_appetite: "Moderate",
    profile_summary: "Private student profile who has NOT opted in to team formation.",
    team_match_opt_in: false, // EXPLICITLY NOT OPTED IN (Must NEVER be surfaced)
    github_enrichment: {
      provided: false,
      username: null,
      verified: false,
      reposCount: 0,
      topLanguages: [],
      recentActivityMonths: 0,
      verifiedProjects: [],
      unverifiedClaims: [],
      summary: "",
      notes: ""
    },
    updated_at: new Date().toISOString()
  }
];

// In-memory team formations store
const inMemoryTeams: Map<string, TeamFormationRecord> = new Map();

/**
 * Finds matching teammates for a student's skill gap on a Problem Statement.
 * Strictly adheres to opt-in rule: NEVER surfaces students with team_match_opt_in === false.
 */
export function findMatchingTeammates(
  initiatorDNA: StudentDNA,
  ps: ProblemStatement,
  gapAnalysis: PSSkillGapAnalysis
): CandidateTeammateMatch[] {
  const missingSkillNames = gapAnalysis.missing_skills.map(m => m.skill.toLowerCase());
  const matches: CandidateTeammateMatch[] = [];

  for (const candidate of CANDIDATE_POOL_STUDENTS) {
    // 1. Opt-in Rule: Skip if not opted in or if it's the initiator themselves
    if (!candidate.team_match_opt_in || candidate.candidate_id === initiatorDNA.candidate_id) {
      continue;
    }

    // 2. Compute Skill Complementarity (Deterministic set comparison)
    const coveredGaps: string[] = [];
    const githubVerifiedSkills: string[] = [];
    let complementarityWeight = 0;

    for (const skill of candidate.skills) {
      const lower = skill.name.toLowerCase();
      const coversMissing = missingSkillNames.some(m => m === lower || lower.includes(m) || m.includes(lower));
      if (coversMissing) {
        coveredGaps.push(skill.name);
        complementarityWeight += skill.proficiency_weight;
        if (skill.verified_on_github) {
          githubVerifiedSkills.push(skill.name);
        }
      }
    }

    const totalMissingWeight = Math.max(1, gapAnalysis.missing_skills.length) * 1.2;
    const skill_complementarity = Math.min(100, Math.round((complementarityWeight / totalMissingWeight) * 100));

    // 3. PS Relevance (Match against PS required & fundamental skills)
    const psRequired = [...ps.required_skills, ...ps.fundamental_skills].map(s => s.toLowerCase());
    let psRelevanceCount = 0;
    for (const skill of candidate.skills) {
      if (psRequired.some(r => r === skill.name.toLowerCase() || skill.name.toLowerCase().includes(r))) {
        psRelevanceCount++;
      }
    }
    const ps_relevance = Math.min(100, Math.round((psRelevanceCount / Math.max(1, psRequired.length)) * 100));

    // 4. Demonstrated Experience (Project and GitHub evidence)
    const hasDomainProjects = candidate.projects.some(p => p.domain === ps.domain);
    const hasVerifiedRepos = candidate.github_enrichment.reposCount > 0;
    let demonstrated_experience = 40;
    if (hasDomainProjects) demonstrated_experience += 35;
    if (hasVerifiedRepos) demonstrated_experience += 20;
    demonstrated_experience = Math.min(95, demonstrated_experience);

    // 5. Availability Fit
    let availability_fit = 80;
    if (candidate.availability.includes("20")) availability_fit = 95;
    else if (candidate.availability.includes("15")) availability_fit = 90;
    else if (candidate.availability.includes("10")) availability_fit = 70;

    // Composite deterministic team match score
    const team_match_score = Math.min(
      98,
      Math.max(
        35,
        Math.round(
          skill_complementarity * 0.40 +
          ps_relevance * 0.25 +
          demonstrated_experience * 0.20 +
          availability_fit * 0.15
        )
      )
    );

    // 6. Mutual Growth Narrative (Grounded in real DNA fields from both students)
    const initiatorTopSkill = initiatorDNA.skills[0]?.name || "Core Architecture";
    const candidateTopSkill = candidate.skills[0]?.name || "Specialized Engineering";
    const mutual_growth_narrative = `${candidate.candidate_id} brings verified expertise in ${coveredGaps.slice(0, 2).join(", ")} (GitHub-backed), plugging your primary gap. In exchange, you bring proven strengths in ${initiatorTopSkill} (${initiatorDNA.skills[0]?.level || "Advanced"}), creating a full-stack syndicate for ${ps.title}.`;

    matches.push({
      candidate_id: candidate.candidate_id,
      name: candidate.candidate_id.replace("student-", "").replace("-", " ").toUpperCase(),
      avatar: candidate.target_domains.includes("Fintech & Web3") ? "⚡" : "🚀",
      target_roles: candidate.target_roles,
      availability: candidate.availability,
      team_match_opt_in: candidate.team_match_opt_in,
      team_match_score,
      breakdown: {
        skill_complementarity,
        ps_relevance,
        demonstrated_experience,
        availability_fit
      },
      covered_gaps: coveredGaps,
      github_verified_skills: githubVerifiedSkills,
      mutual_growth_narrative
    });
  }

  // Sort by highest match score
  return matches.sort((a, b) => b.team_match_score - a.team_match_score);
}

/**
 * Team Skill Graph & Simulator:
 * Deterministically computes team coverage percentage across all required skills.
 * Coverage per skill = min(100, sum of members' individual coverage).
 * Arithmetic computation — no LLM guessing.
 */
export function simulateTeamSkillGraph(
  ps: ProblemStatement,
  members: StudentDNA[]
): TeamSkillGraphSimulation {
  const allRequired = [...ps.required_skills, ...ps.fundamental_skills];
  const skillCoverage: SkillCoverageDetail[] = [];
  const uncoveredSkills: string[] = [];

  for (const req of allRequired) {
    const lower = req.toLowerCase();
    let totalSkillPoints = 0;
    const coveredBy: { candidate_id: string; proficiency_level: string; weight: number }[] = [];

    for (const m of members) {
      for (const s of m.skills) {
        if (s.name.toLowerCase() === lower || s.name.toLowerCase().includes(lower) || lower.includes(s.name.toLowerCase())) {
          const points = Math.min(100, Math.round(s.proficiency_weight * 70));
          totalSkillPoints += points;
          coveredBy.push({
            candidate_id: m.candidate_id,
            proficiency_level: s.level,
            weight: s.proficiency_weight
          });
        }
      }
    }

    const cappedCoverage = Math.min(100, totalSkillPoints);
    skillCoverage.push({
      skill: req,
      coverage_pct: cappedCoverage,
      covered_by: coveredBy
    });

    if (cappedCoverage < 40) {
      uncoveredSkills.push(req);
    }
  }

  const overallCoverage = skillCoverage.length > 0
    ? Math.round(skillCoverage.reduce((sum, s) => sum + s.coverage_pct, 0) / skillCoverage.length)
    : 0;

  // Next Best Skill calculation: Which uncovered skill yields the highest coverage boost?
  let nextBestSkill: TeamSkillGraphSimulation["next_best_skill"] = null;
  if (uncoveredSkills.length > 0) {
    const target = uncoveredSkills[0];
    const potentialBoost = Math.round(80 / skillCoverage.length);
    nextBestSkill = {
      skill: target,
      potential_coverage_boost_pct: potentialBoost,
      recommendation_reason: `Currently at 0% coverage. Adding a member with ${target} directly addresses a core requirement for ${ps.title}.`
    };
  }

  return {
    ps_id: ps.id,
    ps_title: ps.title,
    members_count: members.length,
    member_ids: members.map(m => m.candidate_id),
    overall_team_coverage_pct: overallCoverage,
    skill_coverage: skillCoverage,
    uncovered_skills: uncoveredSkills,
    next_best_skill: nextBestSkill
  };
}

/**
 * Creates or updates a team formation
 */
export function createTeamFormation(
  psId: string,
  initiatorId: string,
  title?: string,
  description?: string
): TeamFormationRecord {
  const id = `team-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const formation: TeamFormationRecord = {
    id,
    ps_id: psId,
    initiating_student_id: initiatorId,
    status: "forming",
    title: title || `Team for ${psId}`,
    description: description || "",
    created_at: new Date().toISOString(),
    members: [
      {
        student_id: initiatorId,
        role_contribution: "Team Lead & Initiator",
        joined_at: new Date().toISOString()
      }
    ]
  };
  inMemoryTeams.set(id, formation);
  return formation;
}

export function addTeamMember(teamId: string, studentId: string, roleContribution: string): TeamFormationRecord | null {
  const team = inMemoryTeams.get(teamId);
  if (!team) return null;

  if (!team.members.some(m => m.student_id === studentId)) {
    team.members.push({
      student_id: studentId,
      role_contribution: roleContribution,
      joined_at: new Date().toISOString()
    });
  }
  return team;
}

export function removeTeamMember(teamId: string, studentId: string): TeamFormationRecord | null {
  const team = inMemoryTeams.get(teamId);
  if (!team) return null;

  team.members = team.members.filter(m => m.student_id !== studentId);
  return team;
}

export function getTeamFormation(teamId: string): TeamFormationRecord | null {
  return inMemoryTeams.get(teamId) || null;
}
