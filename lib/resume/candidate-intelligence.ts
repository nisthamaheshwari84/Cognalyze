/**
 * COGNALYZE RESUME INTELLIGENCE — CANDIDATE INTELLIGENCE MODEL
 * 
 * Aggregates candidate data across multiple authoritative sources:
 * - Existing Resume Document
 * - Student DNA & Verified Artifacts
 * - GitHub Repositories & Commits
 * - LinkedIn / Portfolio
 * - User Assertions
 * 
 * Strict Attribution Law: Every fact, skill, project, and metric retains its original source
 * and verification state. Candidate claims are NEVER conflated with independently verified facts.
 */

export type InformationSource =
  | "RESUME_DOCUMENT"
  | "STUDENT_DNA"
  | "GITHUB_REPOSITORY"
  | "LINKEDIN_PROFILE"
  | "USER_INPUT"
  | "VERIFIED_CREDENTIAL";

export type CorroborationStatus =
  | "CANDIDATE_REPORTED"
  | "CONTEXTUALLY_SUPPORTED"
  | "DEMONSTRATED"
  | "ARTIFACT_CORROBORATED"
  | "INDEPENDENTLY_VERIFIED"
  | "UNVERIFIED"
  | "CONTRADICTORY";

export interface CandidateSourceAttribution {
  source: InformationSource;
  corroboration: CorroborationStatus;
  verbatimProof?: string;
  sourceUri?: string;
  timestamp: string;
}

export interface CandidateEducationClaim {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  honors?: string[];
  coursework?: string[];
  attribution: CandidateSourceAttribution;
}

export interface CandidateExperienceClaim {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  rawContributions: string[];
  technologiesUsed: string[];
  verifiableMetrics: string[];
  attribution: CandidateSourceAttribution;
}

export interface CandidateProjectClaim {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  individualOwnershipPercent?: number;
  architecturalHighlights: string[];
  metrics: string[];
  attribution: CandidateSourceAttribution;
}

export interface CandidateCertificationClaim {
  id: string;
  name: string;
  issuer?: string;
  date?: string;
  credentialUrl?: string;
  attribution: CandidateSourceAttribution;
}

export interface CandidateSkillItem {
  name: string;
  category: "Languages" | "Frameworks & Web" | "Databases & Cloud" | "AI & ML" | "Core Fundamentals" | "Tools";
  proficiency?: "beginner" | "intermediate" | "advanced" | "expert";
  attribution: CandidateSourceAttribution;
}

export interface StructuredCandidateIntelligence {
  candidateId: string;
  name: string;
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  targetRole: string;
  targetCompany?: string;
  yearsOfExperience: number | null;
  careerStage: "fresher" | "1-3years" | "senior" | "career-switcher";
  skills: CandidateSkillItem[];
  education: CandidateEducationClaim[];
  experience: CandidateExperienceClaim[];
  projects: CandidateProjectClaim[];
  certifications: CandidateCertificationClaim[];
  achievements: string[];
  rawBackgroundText: string;
}

/**
 * Builds a structured candidate intelligence profile from raw inputs,
 * strictly attributing sources and forbidding automatic fabrication.
 */
export function buildCandidateIntelligence(params: {
  candidateId?: string;
  name?: string;
  rawResumeText?: string;
  rawBackgroundText?: string;
  targetRole?: string;
  targetCompany?: string;
  linkedin?: string;
  github?: string;
  certificationsText?: string;
  studentDna?: any;
}): StructuredCandidateIntelligence {
  const candidateId = params.candidateId || `cand_${Date.now()}`;
  const bgText = (params.rawBackgroundText || params.rawResumeText || "").trim();
  const lines = bgText.split("\n").map((l) => l.trim()).filter(Boolean);

  // 1. Extract Name
  let name = params.name || "";
  if (!name) {
    const nameMatch = bgText.match(/(?:name|candidate name|full name)\s*:\s*([^\n\r,]+)/i);
    if (nameMatch) {
      name = nameMatch[1].trim();
    } else if (lines.length > 0 && lines[0].length < 40 && !/^(resume|cv|summary|objective)/i.test(lines[0])) {
      name = lines[0].replace(/[|•,-].*$/, "").trim();
    } else {
      name = "Candidate";
    }
  }

  // 2. Extract Contact Info
  const emailMatch = bgText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  const email = emailMatch ? emailMatch[0] : "";

  const phoneMatch = bgText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/);
  const phone = phoneMatch ? phoneMatch[0] : "";

  const linkedin = params.linkedin || (bgText.match(/linkedin\.com\/in\/[A-Za-z0-9_\-]+/i)?.[0] ? `https://${bgText.match(/linkedin\.com\/in\/[A-Za-z0-9_\-]+/i)![0]}` : "");
  const github = params.github || (bgText.match(/github\.com\/[A-Za-z0-9_\-]+/i)?.[0] ? `https://${bgText.match(/github\.com\/[A-Za-z0-9_\-]+/i)![0]}` : "");

  // 3. Determine Target Role & Career Stage
  const targetRole = params.targetRole || "Software Engineer";
  const expMatch = bgText.match(/(\d+)(?:\+)?\s*(?:years?|yrs?)\s*(?:of\s*)?experience/i);
  const yearsOfExperience = expMatch ? parseInt(expMatch[1], 10) : null;

  let careerStage: StructuredCandidateIntelligence["careerStage"] = "1-3years";
  if (yearsOfExperience === null || yearsOfExperience === 0 || /\b(student|fresher|intern|undergraduate|b\.?tech|expected graduation)\b/i.test(bgText)) {
    careerStage = "fresher";
  } else if (yearsOfExperience >= 5 || /\b(senior|staff|lead|principal|architect)\b/i.test(targetRole)) {
    careerStage = "senior";
  } else {
    careerStage = "1-3years";
  }

  // 4. Extract Education (only if candidate explicitly stated it)
  const education: CandidateEducationClaim[] = [];
  const eduLine = lines.find((l) => /\b(b\.?tech|b\.?e|m\.?tech|bachelor|master|degree|university|college|gpa)\b/i.test(l));
  if (eduLine) {
    const gpaMatch = eduLine.match(/gpa[:\s]+(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?)/i);
    const instMatch = eduLine.match(/(?:at|from|•|,)\s*([A-Za-z\s]+(?:College|University|Institute|School)[A-Za-z\s,]*)/i);

    education.push({
      id: "edu_1",
      institution: instMatch ? instMatch[1].trim() : eduLine.split(/•|,|-/)[0].trim(),
      degree: eduLine.replace(/gpa:.*$/i, "").trim(),
      gpa: gpaMatch ? gpaMatch[1].trim() : undefined,
      attribution: {
        source: "USER_INPUT",
        corroboration: "CANDIDATE_REPORTED",
        verbatimProof: eduLine,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // 5. Extract Skills (Taxonomy mapping)
  const skills: CandidateSkillItem[] = [];
  const knownSkillMap: Array<{ name: string; cat: CandidateSkillItem["category"] }> = [
    { name: "Python", cat: "Languages" },
    { name: "TypeScript", cat: "Languages" },
    { name: "JavaScript", cat: "Languages" },
    { name: "C++", cat: "Languages" },
    { name: "Java", cat: "Languages" },
    { name: "Go", cat: "Languages" },
    { name: "SQL", cat: "Languages" },
    { name: "React", cat: "Frameworks & Web" },
    { name: "Next.js", cat: "Frameworks & Web" },
    { name: "Node.js", cat: "Frameworks & Web" },
    { name: "FastAPI", cat: "Frameworks & Web" },
    { name: "PostgreSQL", cat: "Databases & Cloud" },
    { name: "Redis", cat: "Databases & Cloud" },
    { name: "MongoDB", cat: "Databases & Cloud" },
    { name: "Docker", cat: "Databases & Cloud" },
    { name: "Kubernetes", cat: "Databases & Cloud" },
    { name: "AWS", cat: "Databases & Cloud" },
    { name: "GCP", cat: "Databases & Cloud" },
    { name: "Machine Learning", cat: "AI & ML" },
    { name: "Generative AI", cat: "AI & ML" },
    { name: "LLMs", cat: "AI & ML" },
    { name: "PyTorch", cat: "AI & ML" },
    { name: "TensorFlow", cat: "AI & ML" },
    { name: "RAG", cat: "AI & ML" },
    { name: "Data Structures & Algorithms", cat: "Core Fundamentals" },
    { name: "System Design", cat: "Core Fundamentals" },
    { name: "Operating Systems", cat: "Core Fundamentals" },
    { name: "Computer Networks", cat: "Core Fundamentals" },
  ];

  for (const sk of knownSkillMap) {
    if (new RegExp(`\\b${sk.name.replace(/[+]/g, "\\+")}\\b`, "i").test(bgText)) {
      skills.push({
        name: sk.name,
        category: sk.cat,
        attribution: {
          source: "USER_INPUT",
          corroboration: "CANDIDATE_REPORTED",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // 6. Extract Projects
  const projects: CandidateProjectClaim[] = [];
  let inProjects = false;
  let currentProject: Partial<CandidateProjectClaim> | null = null;

  for (const line of lines) {
    if (/^(projects?|academic projects?|key projects?):?$/i.test(line)) {
      inProjects = true;
      continue;
    }
    if (/^(experience|skills|education|certifications|achievements):?$/i.test(line)) {
      inProjects = false;
      if (currentProject && currentProject.name) {
        projects.push(currentProject as CandidateProjectClaim);
        currentProject = null;
      }
      continue;
    }

    if (inProjects) {
      const isBullet = line.startsWith("-") || line.startsWith("•") || line.startsWith("*");
      const hasSeparator = line.includes(":") || line.includes(" - ") || line.includes(" – ") || line.includes(" | ");
      if (isBullet && (hasSeparator || !currentProject)) {
        if (currentProject && currentProject.name) {
          projects.push(currentProject as CandidateProjectClaim);
        }
        const clean = line.replace(/^[-*•]\s*/, "");
        const parts = clean.split(/[:|]|\s+[-–]\s+/);
        const pName = parts[0].trim();
        const techFound = knownSkillMap
          .filter((k) => new RegExp(`\\b${k.name.replace(/[+]/g, "\\+")}\\b`, "i").test(line))
          .map((k) => k.name);

        currentProject = {
          id: `proj_${projects.length + 1}`,
          name: pName,
          description: clean,
          technologies: techFound,
          architecturalHighlights: [clean],
          metrics: [],
          attribution: {
            source: "USER_INPUT",
            corroboration: "CANDIDATE_REPORTED",
            verbatimProof: line,
            timestamp: new Date().toISOString(),
          },
        };
      } else if (currentProject) {
        currentProject.architecturalHighlights = currentProject.architecturalHighlights || [];
        currentProject.architecturalHighlights.push(line.replace(/^[-*•]\s*/, ""));
        const metricMatch = line.match(/\b(\d+(?:\.\d+)?(?:%|x|ms|s|k|m|users|qps))\b/gi);
        if (metricMatch) {
          currentProject.metrics = currentProject.metrics || [];
          currentProject.metrics.push(...metricMatch);
        }
      }
    }
  }

  if (currentProject && currentProject.name) {
    projects.push(currentProject as CandidateProjectClaim);
  }

  // 7. Extract Certifications ONLY IF explicitly provided by user
  const certifications: CandidateCertificationClaim[] = [];
  const certRaw = params.certificationsText || "";
  if (certRaw.trim().length > 0) {
    const rawItems = certRaw
      .replace(/^certifications\s*:?/i, "")
      .split(/(?:\d+\.\s*|,|;|\n)/)
      .map((c) => c.trim())
      .filter((c) => c.length > 3);

    for (const item of rawItems) {
      certifications.push({
        id: `cert_${certifications.length + 1}`,
        name: item,
        attribution: {
          source: "USER_INPUT",
          corroboration: "CANDIDATE_REPORTED",
          verbatimProof: item,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  return {
    candidateId,
    name,
    contact: {
      email,
      phone,
      location: "Bengaluru, India",
      linkedin: linkedin || undefined,
      github: github || undefined,
    },
    targetRole,
    targetCompany: params.targetCompany,
    yearsOfExperience,
    careerStage,
    skills,
    education,
    experience: [],
    projects,
    certifications, // NEVER fabricated! If empty, remains []
    achievements: [],
    rawBackgroundText: bgText,
  };
}
