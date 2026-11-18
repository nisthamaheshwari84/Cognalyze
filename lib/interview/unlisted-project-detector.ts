/**
 * COGNALYZE INTERVIEW SYSTEM — UNLISTED PROJECT DETECTOR
 * 
 * Detects projects, systems, or products verbally introduced by the candidate
 * during an interview turn that are ABSENT from the submitted resume.
 * 
 * Enforces Provenance Separation:
 * - RESUME-BACKED: Claims rooted directly in the selected resume document.
 * - INTERVIEW-DISCLOSED: New projects/systems verbally disclosed during the interview.
 * 
 * CORE BEHAVIORAL RULE:
 * When a candidate mentions an unlisted project (e.g. "Cognalyze"), Alex MUST
 * formally acknowledge its absence from the submitted resume before probing:
 * "You mentioned Cognalyze, which sounds interesting. I noticed that this project
 * isn't explicitly listed in the resume you submitted. Could you explain your
 * involvement, your individual contributions, and the technologies you used?"
 */

import { ExtractedProject, ResumeContextSnapshot } from "./resume-context-service";

export interface UnlistedProjectDetectionResult {
  hasUnlistedProject: boolean;
  unlistedProjectName?: string;
  matchedMentionText?: string;
  provenance: "INTERVIEW-DISCLOSED";
  acknowledgmentText?: string;
  turnQuestion?: string;
}

export interface CandidateDisclosedEntity {
  name: string;
  firstMentionedTurn: number;
  provenance: "INTERVIEW-DISCLOSED";
  individualContributions?: string;
  technologiesClaimed?: string[];
  turnsExplored: number;
}

/**
 * Normalizes entity or project names for fuzzy token matching.
 */
function normalizeProjectName(name: string): string {
  return (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Common English nouns, verbs, tech names, and conversational words that should
 * NEVER be mistaken for project titles.
 */
const EXCLUDED_PROJECT_WORDS = new Set([
  "react", "nextjs", "next.js", "node", "nodejs", "python", "java", "golang", "c++", "c#", "rust",
  "javascript", "typescript", "postgres", "postgresql", "mysql", "mongodb", "redis", "docker", "kubernetes",
  "aws", "gcp", "azure", "graphql", "rest", "api", "git", "github", "linux", "html", "css", "tailwind",
  "the", "this", "that", "these", "those", "my", "our", "a", "an", "in", "on", "at", "for", "with",
  "project", "system", "app", "application", "platform", "service", "tool", "stack", "code", "repo",
  "frontend", "backend", "fullstack", "database", "server", "client", "team", "company", "college",
  "university", "internship", "work", "experience", "task", "feature", "pipeline", "architecture",
  "model", "algorithm", "data", "test", "demo", "production", "staging", "user", "users", "customer"
]);

/**
 * Scans candidate speech/text for project mentions and compares against the authoritative resume projects.
 */
export function detectUnlistedProject(
  candidateAnswer: string,
  resumeProjects: Array<{ name?: string; title?: string }>,
  alreadyDisclosed: CandidateDisclosedEntity[] = []
): UnlistedProjectDetectionResult {
  if (!candidateAnswer || candidateAnswer.trim().length === 0) {
    return { hasUnlistedProject: false, provenance: "INTERVIEW-DISCLOSED" };
  }

  const normalizedResumeProjects = new Set(
    resumeProjects
      .map((p) => normalizeProjectName(p.name || p.title || ""))
      .filter((n) => n.length > 1)
  );

  const normalizedDisclosed = new Set(
    alreadyDisclosed.map((d) => normalizeProjectName(d.name)).filter((n) => n.length > 1)
  );

  // Regex patterns where candidates introduce projects or systems
  const candidateIntroPatterns = [
    /\b(?:in|on|at|built|created|developed|designed|founded|working on|worked on|my project|our project|my startup|our startup|my application|the application|my platform|the platform)\s+([A-Z][A-Za-z0-9_\-\.]{2,30})\b/g,
    /\b(?:project|platform|app|product|tool called|named|system called|known as)\s+([A-Z][A-Za-z0-9_\-\.]{2,30})\b/gi,
    /\b([A-Z][A-Za-z0-9]{2,25}(?:Hub|lyze|Scale|Engine|Pulse|Track|Base|Flow|Cloud|Stack|Craft|Sync|Mesh|Desk|Forge))\b/g,
    /\b(Cognalyze)\b/gi, // Direct explicit guard for the core Cognalyze scenario
  ];

  const candidateCandidates: string[] = [];

  for (const pattern of candidateIntroPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(candidateAnswer)) !== null) {
      const candidateWord = match[1]?.trim();
      if (!candidateWord) continue;
      const cleanWord = candidateWord.replace(/[.,;:!?]+$/, "").trim();
      const norm = normalizeProjectName(cleanWord);

      if (norm.length >= 3 && !EXCLUDED_PROJECT_WORDS.has(norm) && !EXCLUDED_PROJECT_WORDS.has(cleanWord.toLowerCase())) {
        candidateCandidates.push(cleanWord);
      }
    }
  }

  // Deduplicate candidates preserving original casing
  const uniqueCandidates = Array.from(new Set(candidateCandidates));

  for (const candidateName of uniqueCandidates) {
    const norm = normalizeProjectName(candidateName);

    // If it is in the resume, it is NOT an unlisted project
    const isListedInResume = Array.from(normalizedResumeProjects).some(
      (rp) => rp === norm || rp.includes(norm) || norm.includes(rp)
    );
    if (isListedInResume) {
      continue;
    }

    // If it was already disclosed and acknowledged in an earlier turn, do not re-acknowledge as new
    const wasAlreadyAcknowledged = Array.from(normalizedDisclosed).some((d) => d === norm);
    if (wasAlreadyAcknowledged) {
      continue;
    }

    // Found an unlisted project!
    const acknowledgment = `You mentioned ${candidateName}, which sounds interesting. I noticed that this project isn't explicitly listed in the resume you submitted.`;
    const turnQuestion = `${acknowledgment} Could you explain your involvement, your individual contributions, and the core technologies you used in ${candidateName}?`;

    return {
      hasUnlistedProject: true,
      unlistedProjectName: candidateName,
      matchedMentionText: candidateName,
      provenance: "INTERVIEW-DISCLOSED",
      acknowledgmentText: acknowledgment,
      turnQuestion,
    };
  }

  return { hasUnlistedProject: false, provenance: "INTERVIEW-DISCLOSED" };
}
