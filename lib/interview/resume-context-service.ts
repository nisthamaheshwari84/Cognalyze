/**
 * COGNALYZE INTERVIEW SYSTEM — RESUME CONTEXT SERVICE
 * 
 * Enforces strict resume authority, versioning, SHA-256 content hashing,
 * and structured extraction of candidate projects, skills, and evidence.
 * 
 * CORE PRINCIPLE: The selected resume is the single authoritative source of truth.
 * Global candidate memory or previous session data MUST NEVER contaminate a new interview.
 */

import crypto from "crypto";
import { ClaimLedger, ProjectClaim, WorkExperienceClaim, CandidateSkillClaim } from "./ground-truth-service";

export type EvidenceProvenance =
  | "RESUME-BACKED"
  | "INTERVIEW-DISCLOSED"
  | "INDEPENDENTLY_VERIFIED"
  | "UNVERIFIED_CLAIM";

export interface ExtractedProject {
  id: string;
  name: string;
  role: string;
  description: string;
  techStack: string[];
  metrics: string[];
  architecturalHighlights: string[];
  provenance: EvidenceProvenance;
}

export interface ExtractedExperience {
  id: string;
  company: string;
  role: string;
  period: string;
  techStack: string[];
  keyContributions: string[];
  metrics: string[];
  provenance: EvidenceProvenance;
}

export interface ResumeContextSnapshot {
  snapshotId: string;
  candidateId: string;
  resumeId: string;
  resumeVersion: string;
  contentHash: string; // SHA-256 of normalized resume text
  candidateName: string;
  education: string;
  skills: CandidateSkillClaim[];
  projects: ExtractedProject[];
  experience: ExtractedExperience[];
  achievements: string[];
  rawText: string;
  createdAt: string;
}

/**
 * Computes a deterministic SHA-256 hash of normalized resume text.
 */
export function computeResumeHash(rawText: string): string {
  const normalized = (rawText || "")
    .trim()
    .toLowerCase()
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ");
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

/**
 * Parses raw resume text into a structured, immutable ResumeContextSnapshot.
 * Accurately extracts candidate projects, tech stacks, and metrics without relying on dummy fixtures.
 */
export function createResumeContextSnapshot(
  candidateId: string,
  rawResumeText: string,
  resumeId: string = "resume_default",
  resumeVersion: string = "v1.0"
): ResumeContextSnapshot {
  const text = (rawResumeText || "").trim();
  const contentHash = computeResumeHash(text);
  const snapshotId = `snap_${candidateId}_${contentHash}`;

  // 1. Candidate Name (Line 1 or explicitly formatted)
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let candidateName = "Candidate";
  if (lines.length > 0 && lines[0].length < 50 && !/^(resume|curriculum|cv|summary|objective)/i.test(lines[0])) {
    candidateName = lines[0].replace(/[|•,-].*$/, "").trim();
  }

  // 2. Education
  let education = "";
  for (const line of lines) {
    if (/\b(b\.?tech|b\.?e|m\.?tech|bachelor|master|degree|university|college|gpa)\b/i.test(line)) {
      education = line;
      break;
    }
  }

  // 3. Technical Skills Extraction
  const skills: CandidateSkillClaim[] = [];
  const knownSkillMap: Array<{ name: string; category: CandidateSkillClaim["category"] }> = [
    { name: "JavaScript", category: "languages" },
    { name: "TypeScript", category: "languages" },
    { name: "Python", category: "languages" },
    { name: "Java", category: "languages" },
    { name: "C++", category: "languages" },
    { name: "Go", category: "languages" },
    { name: "SQL", category: "languages" },
    { name: "React", category: "frontend" },
    { name: "Next.js", category: "frontend" },
    { name: "Vue", category: "frontend" },
    { name: "Node.js", category: "backend" },
    { name: "Express", category: "backend" },
    { name: "FastAPI", category: "backend" },
    { name: "Django", category: "backend" },
    { name: "PostgreSQL", category: "database" },
    { name: "MySQL", category: "database" },
    { name: "MongoDB", category: "database" },
    { name: "Redis", category: "database" },
    { name: "Docker", category: "devops" },
    { name: "Kubernetes", category: "devops" },
    { name: "AWS", category: "cloud" },
    { name: "GCP", category: "cloud" },
    { name: "Azure", category: "cloud" },
    { name: "PyTorch", category: "ai_ml" },
    { name: "TensorFlow", category: "ai_ml" },
    { name: "RAG", category: "ai_ml" },
  ];

  for (const sk of knownSkillMap) {
    const rx = new RegExp(`\\b${sk.name.replace(/[+]/g, "\\+")}\\b`, "i");
    if (rx.test(text)) {
      skills.push({
        name: sk.name,
        proficiency: "intermediate",
        category: sk.category,
        evidenceSources: ["Resume Document"],
      });
    }
  }

  // 4. Project & Experience Extraction
  const projects: ExtractedProject[] = [];
  const experience: ExtractedExperience[] = [];

  // 4a. Check for inline projects format strictly on the same line
  // (e.g. "Projects: DistributedKV (Go, Raft); ShopStream (Node, Postgres)")
  const inlineMatch = text.match(/projects?:[^\S\r\n]+([^\r\n]+)/i);
  if (inlineMatch && inlineMatch[1] && !/^\s*[-*•]/.test(inlineMatch[1])) {
    const rawItems = inlineMatch[1].split(/[;]\s*(?=[A-Za-z0-9])/);
    for (const item of rawItems) {
      const itemTrimmed = item.trim().replace(/^[-*•]\s*/, "");
      if (itemTrimmed.length > 2 && !/^(skills|experience|education|certifications)/i.test(itemTrimmed)) {
        const pMatch = itemTrimmed.match(/^([^(]+)(?:\(([^)]+)\))?/);
        const pTitle = (pMatch ? pMatch[1] : itemTrimmed).trim();
        const pTechStr = pMatch && pMatch[2] ? pMatch[2] : "";
        const pTech = knownSkillMap
          .filter((k) => new RegExp(`\\b${k.name.replace(/[+]/g, "\\+")}\\b`, "i").test(pTechStr || itemTrimmed))
          .map((k) => k.name);

        projects.push({
          id: `proj_${projects.length + 1}`,
          name: pTitle,
          role: "Developer",
          description: itemTrimmed,
          techStack: pTech,
          metrics: [],
          architecturalHighlights: [itemTrimmed],
          provenance: "RESUME-BACKED",
        });
      }
    }
  }

  // 4b. Multiline section-aware parsing (runs if inline projects not already captured)
  if (projects.length === 0) {
    let inProjects = false;
    let inExperience = false;
    let currentProject: Partial<ExtractedProject> | null = null;
    let currentExp: Partial<ExtractedExperience> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect section transitions
      if (/^(projects?|academic projects?|personal projects?|key projects?):?$/i.test(line)) {
        inProjects = true;
        inExperience = false;
        if (currentExp && currentExp.company) {
          experience.push(currentExp as ExtractedExperience);
          currentExp = null;
        }
        continue;
      }
      if (/^(experience|work experience|employment|professional experience|internships?):?$/i.test(line)) {
        inExperience = true;
        inProjects = false;
        if (currentProject && currentProject.name) {
          projects.push(currentProject as ExtractedProject);
          currentProject = null;
        }
        continue;
      }
      if (/^(skills|education|certifications|achievements|publications|leadership):?$/i.test(line)) {
        inProjects = false;
        inExperience = false;
        if (currentProject && currentProject.name) {
          projects.push(currentProject as ExtractedProject);
          currentProject = null;
        }
        if (currentExp && currentExp.company) {
          experience.push(currentExp as ExtractedExperience);
          currentExp = null;
        }
        continue;
      }

      if (inProjects) {
        // Heading formats:
        // 1. Bullet heading: • DistributedKV: High throughput... OR • DistributedKV - Go, Raft
        // 2. Plain heading: DistributedKV | Go | Link
        const bulletMatch = line.match(/^[-*•]\s*([A-Za-z0-9_\-\s]{2,40})[:\-–|]\s*(.*)$/);
        const isPlainHeading = !line.startsWith("-") && !line.startsWith("•") && !line.startsWith("*") && line.length < 90 && (line.includes("|") || line.includes("–") || line.includes("-") || line.includes(":") || (i < lines.length - 1 && (lines[i + 1].startsWith("-") || lines[i + 1].startsWith("•"))));

        if (bulletMatch) {
          if (currentProject && currentProject.name) {
            projects.push(currentProject as ExtractedProject);
          }
          const name = bulletMatch[1].trim();
          const desc = bulletMatch[2]?.trim() || line;
          const foundTech = knownSkillMap
            .filter((k) => new RegExp(`\\b${k.name.replace(/[+]/g, "\\+")}\\b`, "i").test(line))
            .map((k) => k.name);

          currentProject = {
            id: `proj_${projects.length + 1}`,
            name,
            role: "Creator & Developer",
            description: desc,
            techStack: foundTech,
            metrics: [],
            architecturalHighlights: [desc],
            provenance: "RESUME-BACKED",
          };
        } else if (isPlainHeading) {
          if (currentProject && currentProject.name) {
            projects.push(currentProject as ExtractedProject);
          }
          const parts = line.split(/[|–—]/).map((p) => p.trim());
          const name = parts[0].replace(/^project\s*\d*[:\-]?\s*/i, "").trim();
          const techLine = parts.length > 1 ? parts.slice(1).join(" ") : "";
          const foundTech = knownSkillMap.filter((k) => new RegExp(`\\b${k.name.replace(/[+]/g, "\\+")}\\b`, "i").test(techLine || line)).map((k) => k.name);

          currentProject = {
            id: `proj_${projects.length + 1}`,
            name,
            role: "Creator & Developer",
            description: line,
            techStack: foundTech,
            metrics: [],
            architecturalHighlights: [],
            provenance: "RESUME-BACKED",
          };
        } else if (currentProject) {
          const bullet = line.replace(/^[-*•]\s*/, "").trim();
          const metricMatch = bullet.match(/\b(\d+(?:\.\d+)?(?:%|x|ms|s|k|m|qps|users))\b/gi);
          if (metricMatch) {
            currentProject.metrics = currentProject.metrics || [];
            currentProject.metrics.push(...metricMatch);
          }
          const techInBullet = knownSkillMap.filter((k) => new RegExp(`\\b${k.name.replace(/[+]/g, "\\+")}\\b`, "i").test(bullet)).map((k) => k.name);
          for (const t of techInBullet) {
            if (!currentProject.techStack?.includes(t)) {
              currentProject.techStack?.push(t);
            }
          }
          currentProject.architecturalHighlights = currentProject.architecturalHighlights || [];
          if (/\b(architect|implemented|designed|deployed|optimized|configured|built)\b/i.test(bullet)) {
            currentProject.architecturalHighlights.push(bullet);
          }
        }
      }

      if (inExperience) {
        const isExpHeading = !line.startsWith("-") && !line.startsWith("•") && line.length < 90 && (line.includes("|") || line.includes("–") || line.includes("-") || /\b(20\d\d)\b/.test(line));
        if (isExpHeading) {
          if (currentExp && currentExp.company) {
            experience.push(currentExp as ExtractedExperience);
          }
          const parts = line.split(/[|–—]/).map((p) => p.trim());
          const role = parts[0] || "Software Engineer";
          const company = parts.length > 1 ? parts[1] : parts[0];
          const period = parts.find((p) => /\b(20\d\d)\b/.test(p)) || "";

          currentExp = {
            id: `exp_${experience.length + 1}`,
            company,
            role,
            period,
            techStack: [],
            keyContributions: [],
            metrics: [],
            provenance: "RESUME-BACKED",
          };
        } else if (currentExp) {
          const bullet = line.replace(/^[-*•]\s*/, "").trim();
          currentExp.keyContributions = currentExp.keyContributions || [];
          currentExp.keyContributions.push(bullet);

          const metricMatch = bullet.match(/\b(\d+(?:\.\d+)?(?:%|x|ms|s|k|m|qps|users))\b/gi);
          if (metricMatch) {
            currentExp.metrics = currentExp.metrics || [];
            currentExp.metrics.push(...metricMatch);
          }
          const techInBullet = knownSkillMap.filter((k) => new RegExp(`\\b${k.name.replace(/[+]/g, "\\+")}\\b`, "i").test(bullet)).map((k) => k.name);
          for (const t of techInBullet) {
            if (!currentExp.techStack?.includes(t)) {
              currentExp.techStack?.push(t);
            }
          }
        }
      }
    }

    if (currentProject && currentProject.name) {
      projects.push(currentProject as ExtractedProject);
    }
    if (currentExp && currentExp.company) {
      experience.push(currentExp as ExtractedExperience);
    }
  }

  return {
    snapshotId,
    candidateId,
    resumeId,
    resumeVersion,
    contentHash,
    candidateName,
    education,
    skills,
    projects,
    experience,
    achievements: [],
    rawText: text,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Converts a ResumeContextSnapshot into a canonical ClaimLedger.
 */
export function buildClaimLedgerFromSnapshot(snapshot: ResumeContextSnapshot): ClaimLedger {
  return {
    candidateId: snapshot.candidateId,
    candidateName: snapshot.candidateName,
    education: snapshot.education,
    skills: snapshot.skills,
    projects: snapshot.projects.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      description: p.description,
      techStack: p.techStack,
      forbiddenTech: [],
      metrics: p.metrics,
      architecturalHighlights: p.architecturalHighlights,
      verifiedClaims: p.architecturalHighlights,
    })),
    experience: snapshot.experience.map((e) => ({
      id: e.id,
      company: e.company,
      role: e.role,
      startDate: e.period.split("-")[0]?.trim() || "",
      endDate: e.period.split("-")[1]?.trim() || "",
      techStack: e.techStack,
      keyContributions: e.keyContributions,
      metrics: e.metrics,
    })),
    achievements: snapshot.achievements,
    disallowedClaims: [],
  };
}
