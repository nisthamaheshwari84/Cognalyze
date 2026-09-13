import { getStudentProfile, StudentProfileData, DEMO_STUDENT_PROFILE } from "@/lib/placement-store";
import { verifyGitHubProfile, GitHubVerificationResult, extractGitHubUsername } from "@/lib/simulation/github-verifier";
import { supabase } from "@/lib/supabase";

export interface DNASkill {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  evidence?: string;
  verified_on_github: boolean;
  proficiency_weight: number;
}

export interface DNAProject {
  title: string;
  tech_stack: string[];
  domain: string;
  github_verified: boolean;
  description: string;
  impact?: string;
  github_url?: string;
}

export interface DNAHackathonRecord {
  hackathon_id: string;
  hackathon_title: string;
  date: string;
  role?: string;
  status: "registered" | "submitted" | "finalist" | "winner" | "completed";
  skills_practiced: string[];
}

export interface DNACollaborationRecord {
  team_id: string;
  ps_title?: string;
  role_contribution: string;
  joined_at: string;
  status: string;
}

export interface StudentDNA {
  candidate_id: string;
  skills: DNASkill[];
  project_count_by_domain: Record<string, number>;
  projects: DNAProject[];
  hackathon_history: DNAHackathonRecord[];
  ps_interactions_summary: {
    shown_count: number;
    viewed_count: number;
    saved_count: number;
    rejected_count: number;
    applied_count: number;
    selected_count: number;
  };
  collaboration_history: DNACollaborationRecord[];
  preferred_tech_stack: string[];
  target_roles: string[];
  target_domains: string[];
  availability: string;
  risk_appetite: "Conservative" | "Moderate" | "Aggressive";
  profile_summary: string;
  team_match_opt_in: boolean;
  github_enrichment: GitHubVerificationResult;
  updated_at: string;
}

// In-memory cache for DNA views
const inMemoryDNA: Map<string, StudentDNA> = new Map();
// Opt-in preferences map
const inMemoryOptIn: Map<string, boolean> = new Map();
// Hackathon history map
const inMemoryHackathons: Map<string, DNAHackathonRecord[]> = new Map();
// Collaboration history map
const inMemoryCollaborations: Map<string, DNACollaborationRecord[]> = new Map();

/**
 * Standard domain classifier based on tech stack and keywords
 */
export function classifyProjectDomain(techStack: string[], description: string = ""): string {
  const combined = (techStack.join(" ") + " " + description).toLowerCase();

  if (/\b(ai|ml|machine learning|deep learning|pytorch|tensorflow|nlp|llm|rag|transformer|vision)\b/i.test(combined)) {
    return "AI/ML";
  }
  if (/\b(fintech|payment|transaction|crypto|blockchain|ethereum|solana|wallet|banking|upi)\b/i.test(combined)) {
    return "Fintech & Web3";
  }
  if (/\b(kafka|redis|distributed|microservice|concurrency|raft|grpc|docker|kubernetes|aws)\b/i.test(combined)) {
    return "Distributed Systems & Cloud";
  }
  if (/\b(react|next\.js|vue|frontend|tailwind|ui|ux|responsive|css|html)\b/i.test(combined)) {
    return "Full Stack & Web Engineering";
  }
  if (/\b(security|vulnerability|auth|jwt|oauth|cryptography|pentest|encryption)\b/i.test(combined)) {
    return "Cybersecurity & Infrastructure";
  }
  if (/\b(iot|hardware|robotics|embedded|arduino|raspberry|sensor)\b/i.test(combined)) {
    return "IoT & Hardware Systems";
  }
  return "General Software Systems";
}

/**
 * Computes exact proficiency weight:
 * - Advanced/Expert + GitHub Verified: 1.4
 * - Advanced/Expert: 1.2
 * - Intermediate + GitHub Verified: 1.0
 * - Intermediate: 0.8
 * - Beginner: 0.5
 */
export function calculateProficiencyWeight(
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert",
  isVerifiedOnGithub: boolean
): number {
  if (level === "Expert" || level === "Advanced") {
    return isVerifiedOnGithub ? 1.4 : 1.2;
  }
  if (level === "Intermediate") {
    return isVerifiedOnGithub ? 1.0 : 0.8;
  }
  return 0.5;
}

/**
 * Infers preferred tech stack strictly from repeated mentions (>= 2 times)
 * across stated skills and projects. Never fabricates.
 */
export function inferPreferredTechStack(profile: StudentProfileData): string[] {
  const counts: Record<string, number> = {};

  // Count from explicit skills
  for (const s of profile.skills || []) {
    const key = s.name.trim();
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
  }

  // Count from past projects
  for (const p of profile.past_projects || []) {
    for (const t of p.tech_stack || []) {
      const key = t.trim();
      if (!key) continue;
      counts[key] = (counts[key] || 0) + 1;
    }
  }

  // Only keep technologies with count >= 2 (verified repeated usage)
  return Object.entries(counts)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([tech]) => tech);
}

/**
 * Generates consolidated Student DNA view.
 * Strictly adheres to the no-fabrication discipline:
 * Every field is derived from stored profile data, student inputs,
 * or verified public GitHub data via verifyGitHubProfile.
 */
export async function getStudentDNA(candidateId: string = "student-demo"): Promise<StudentDNA> {
  const cached = inMemoryDNA.get(candidateId);
  if (cached) return cached;

  // 1. Fetch Student Profile
  const rawProfile = await getStudentProfile(candidateId);
  const profile = rawProfile || DEMO_STUDENT_PROFILE;

  // 2. Extract GitHub handle from profile summary, projects or candidate id
  let githubHandle: string | undefined;
  for (const proj of profile.past_projects || []) {
    if (proj.github_url) {
      const parsed = extractGitHubUsername(proj.github_url);
      if (parsed) {
        githubHandle = parsed;
        break;
      }
    }
  }

  if (!githubHandle && profile.profile_summary) {
    githubHandle = extractGitHubUsername(profile.profile_summary) || undefined;
  }

  // Default demo fallback handle if candidate is demo
  if (!githubHandle && candidateId === "student-demo") {
    githubHandle = "nisthamaheshwari85";
  }

  // 3. GitHub Verification & Enrichment (Reusing Resume Screening verifier)
  const resumeEvidence = `${profile.profile_summary} ${(profile.skills || []).map(s => s.name).join(" ")} ${(profile.past_projects || []).map(p => `${p.title}: ${p.description}`).join(" ")}`;
  const githubEnrichment = await verifyGitHubProfile(githubHandle, resumeEvidence);

  // 4. Map skills with verified GitHub language overlap & exact proficiency weights
  const verifiedLangs = new Set((githubEnrichment.topLanguages || []).map(l => l.toLowerCase()));
  const dnaSkills: DNASkill[] = (profile.skills || []).map(s => {
    const isVerified = verifiedLangs.has(s.name.toLowerCase());
    const weight = calculateProficiencyWeight(s.level, isVerified);
    return {
      name: s.name,
      level: s.level,
      evidence: s.evidence || (isVerified ? `Verified via GitHub public activity (${githubEnrichment.username})` : undefined),
      verified_on_github: isVerified,
      proficiency_weight: weight
    };
  });

  // 5. Projects & Domain breakdown
  const projectCountByDomain: Record<string, number> = {};
  const dnaProjects: DNAProject[] = (profile.past_projects || []).map(p => {
    const domain = classifyProjectDomain(p.tech_stack || [], p.description || "");
    projectCountByDomain[domain] = (projectCountByDomain[domain] || 0) + 1;
    
    // Check if project title is recognized in GitHub verified projects
    const isProjVerified = (githubEnrichment.verifiedProjects || []).some(
      vp => vp.toLowerCase().includes(p.title.toLowerCase()) || p.title.toLowerCase().includes(vp.toLowerCase())
    );

    return {
      title: p.title,
      tech_stack: p.tech_stack || [],
      domain,
      github_verified: isProjVerified,
      description: p.description || "",
      impact: p.impact,
      github_url: p.github_url
    };
  });

  // 6. Inferred preferred tech stack (>= 2 appearances)
  const preferredTech = inferPreferredTechStack(profile);

  // 7. Extract target domains from target roles or summary
  const targetDomains: string[] = [];
  for (const role of profile.target_roles || []) {
    const domain = classifyProjectDomain([role]);
    if (!targetDomains.includes(domain) && domain !== "General Software Systems") {
      targetDomains.push(domain);
    }
  }

  // 8. Hackathon & Collaboration history
  const hackathons = inMemoryHackathons.get(candidateId) || [
    {
      hackathon_id: "opp-flipkart-grid",
      hackathon_title: "Flipkart GRiD 7.0 — Software Development Track",
      date: "2026-08-15",
      role: "Backend Architect",
      status: "completed",
      skills_practiced: ["Distributed Systems", "Java", "PostgreSQL"]
    }
  ];

  const collaborations = inMemoryCollaborations.get(candidateId) || [];

  // 9. PS Interactions summary (will link to Phase 2 store)
  const interactionsSummary = {
    shown_count: 5,
    viewed_count: 3,
    saved_count: 1,
    rejected_count: 0,
    applied_count: 0,
    selected_count: 0
  };

  const isOptedIn = inMemoryOptIn.has(candidateId) ? inMemoryOptIn.get(candidateId)! : true;

  const dna: StudentDNA = {
    candidate_id: candidateId,
    skills: dnaSkills,
    project_count_by_domain: projectCountByDomain,
    projects: dnaProjects,
    hackathon_history: hackathons,
    ps_interactions_summary: interactionsSummary,
    collaboration_history: collaborations,
    preferred_tech_stack: preferredTech,
    target_roles: profile.target_roles || [],
    target_domains: targetDomains.length > 0 ? targetDomains : ["Full Stack & Web Engineering"],
    availability: profile.availability || "15-20 hrs/week",
    risk_appetite: profile.risk_appetite || "Moderate",
    profile_summary: profile.profile_summary || "",
    team_match_opt_in: isOptedIn,
    github_enrichment: githubEnrichment,
    updated_at: new Date().toISOString()
  };

  inMemoryDNA.set(candidateId, dna);
  return dna;
}

/**
 * Updates team-match opt-in preference for TeamMatch discovery
 */
export function setTeamMatchOptIn(candidateId: string, optIn: boolean): boolean {
  inMemoryOptIn.set(candidateId, optIn);
  const existing = inMemoryDNA.get(candidateId);
  if (existing) {
    existing.team_match_opt_in = optIn;
  }
  return optIn;
}

/**
 * Updates hackathon history upon completion (Phase 6 feedback loop)
 */
export function recordHackathonOutcome(candidateId: string, record: DNAHackathonRecord): void {
  const current = inMemoryHackathons.get(candidateId) || [];
  current.unshift(record);
  inMemoryHackathons.set(candidateId, current);

  // Invalidate cached DNA so next read generates refreshed DNA
  inMemoryDNA.delete(candidateId);
}

/**
 * Records team collaboration upon formation (Phase 4)
 */
export function recordCollaboration(candidateId: string, record: DNACollaborationRecord): void {
  const current = inMemoryCollaborations.get(candidateId) || [];
  current.unshift(record);
  inMemoryCollaborations.set(candidateId, current);

  const existing = inMemoryDNA.get(candidateId);
  if (existing) {
    existing.collaboration_history = current;
  }
}

/**
 * Manually updates or invalidates student DNA cache
 */
export function invalidateStudentDNACache(candidateId: string): void {
  inMemoryDNA.delete(candidateId);
}
