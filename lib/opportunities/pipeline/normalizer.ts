/**
 * COGNALYZE OPPORTUNITY INTELLIGENCE — NORMALIZER & ROLE DNA ENGINE
 * 
 * Normalizes varied job titles, employment types, and requirements into canonical schemas.
 * Extracts structured Role DNA:
 * - MUST_HAVE skills (critical screening criteria)
 * - PREFERRED skills (bonus/nice-to-have)
 * - ELIGIBILITY constraints (graduation year, degree, work authorization)
 * - DISQUALIFIERS (explicit exclusions)
 */

import { CanonicalOpportunity, RoleDNA, RemoteType, EmploymentType, ExperienceLevel } from "../types";

const CANONICAL_ROLE_MAP: { pattern: RegExp; canonical: string; category: string }[] = [
  {
    pattern: /(ai|ml|machine\s*learning|deep\s*learning|artificial\s*intelligence|data\s*science).*(intern|trainee|apprentice)/i,
    canonical: "AI/ML Engineer Intern",
    category: "AI/ML Engineering"
  },
  {
    pattern: /(ai|ml|machine\s*learning|deep\s*learning|data\s*scientist|llm).*(engineer|developer)/i,
    canonical: "AI/ML Engineer",
    category: "AI/ML Engineering"
  },
  {
    pattern: /(swe|software|engineering|developer).*(intern|trainee|fellow|apprentice)/i,
    canonical: "Software Engineer Intern",
    category: "Software Engineering"
  },
  {
    pattern: /(backend|server|systems|platform|api).*(intern|trainee)/i,
    canonical: "Backend Engineer Intern",
    category: "Backend Engineering"
  },
  {
    pattern: /(backend|server|systems|platform|api).*(engineer|developer)/i,
    canonical: "Backend Engineer",
    category: "Backend Engineering"
  },
  {
    pattern: /(frontend|ui|web|client).*(intern|trainee)/i,
    canonical: "Frontend Engineer Intern",
    category: "Frontend Engineering"
  },
  {
    pattern: /(frontend|ui|web|client).*(engineer|developer)/i,
    canonical: "Frontend Engineer",
    category: "Frontend Engineering"
  },
  {
    pattern: /(full\s*stack|fullstack|web\s*application).*(intern|trainee)/i,
    canonical: "Fullstack Engineer Intern",
    category: "Full-Stack Engineering"
  },
  {
    pattern: /(full\s*stack|fullstack|web\s*application).*(engineer|developer)/i,
    canonical: "Fullstack Engineer",
    category: "Full-Stack Engineering"
  },
  {
    pattern: /(devops|cloud|sre|site\s*reliability|infrastructure).*(intern|engineer|developer)/i,
    canonical: "DevOps & Cloud Engineer",
    category: "Cloud & DevOps"
  }
];

export function normalizeJobTitle(rawTitle: string): { normalizedTitle: string; roleCategory: string } {
  for (const mapping of CANONICAL_ROLE_MAP) {
    if (mapping.pattern.test(rawTitle)) {
      return {
        normalizedTitle: mapping.canonical,
        roleCategory: mapping.category
      };
    }
  }

  // Fallback to title casing
  return {
    normalizedTitle: rawTitle.trim(),
    roleCategory: rawTitle.toLowerCase().includes("engineer") ? "Software Engineering" : "General Technology"
  };
}

export function normalizeRemoteType(locationText?: string, remoteText?: string): RemoteType {
  const combined = `${locationText || ""} ${remoteText || ""}`.toLowerCase();
  if (combined.includes("remote") && !combined.includes("hybrid") && !combined.includes("onsite")) {
    return "remote";
  }
  if (combined.includes("hybrid") || (combined.includes("remote") && combined.includes("onsite"))) {
    return "hybrid";
  }
  return "onsite";
}

export function normalizeEmploymentType(typeText?: string): EmploymentType {
  const t = (typeText || "").toLowerCase();
  if (t.includes("intern")) return "internship";
  if (t.includes("fellow")) return "fellowship";
  if (t.includes("part")) return "part_time";
  return "full_time";
}

export function normalizeExperienceLevel(levelText?: string, title?: string): ExperienceLevel {
  const combined = `${levelText || ""} ${title || ""}`.toLowerCase();
  if (combined.includes("intern") || combined.includes("trainee") || combined.includes("fresher")) return "intern";
  if (combined.includes("senior") || combined.includes("lead") || combined.includes("principal")) return "senior";
  if (combined.includes("mid") || combined.includes("2-") || combined.includes("3-") || combined.includes("sde-2")) return "mid_level";
  return "entry_level";
}

/**
 * Extracts structured Role DNA from opportunity text.
 */
export function extractRoleDNA(opp: Partial<CanonicalOpportunity>): RoleDNA {
  const text = `${opp.title || ""} ${opp.description || ""} ${(opp.requiredSkills || []).join(" ")} ${(opp.responsibilities || []).join(" ")}`.toLowerCase();

  const mustHaves: string[] = [];
  const preferred: string[] = [];
  const disqualifiers: string[] = [];

  // Skill identification dictionary
  const skillKeywords: { skill: string; regex: RegExp; defaultCategory: "must" | "pref" }[] = [
    { skill: "Python", regex: /\b(python)\b/i, defaultCategory: "must" },
    { skill: "JavaScript", regex: /\b(javascript|js|es6)\b/i, defaultCategory: "must" },
    { skill: "TypeScript", regex: /\b(typescript|ts)\b/i, defaultCategory: "must" },
    { skill: "Java", regex: /\b(java)\b/i, defaultCategory: "must" },
    { skill: "C++", regex: /\b(c\+\+|cpp)\b/i, defaultCategory: "must" },
    { skill: "Go", regex: /\b(golang|go)\b/i, defaultCategory: "must" },
    { skill: "React", regex: /\b(react|react\.js|reactjs)\b/i, defaultCategory: "must" },
    { skill: "Next.js", regex: /\b(next\.js|nextjs)\b/i, defaultCategory: "must" },
    { skill: "Node.js", regex: /\b(node|node\.js|nodejs|express)\b/i, defaultCategory: "must" },
    { skill: "FastAPI", regex: /\b(fastapi)\b/i, defaultCategory: "must" },
    { skill: "SQL", regex: /\b(sql|postgres|postgresql|mysql)\b/i, defaultCategory: "must" },
    { skill: "Algorithms", regex: /\b(dsa|data\s*structures|algorithms|problem\s*solving)\b/i, defaultCategory: "must" },
    { skill: "Machine Learning", regex: /\b(machine\s*learning|ml|scikit|pandas|numpy)\b/i, defaultCategory: "must" },
    { skill: "PyTorch", regex: /\b(pytorch|torch)\b/i, defaultCategory: "pref" },
    { skill: "TensorFlow", regex: /\b(tensorflow|tf|keras)\b/i, defaultCategory: "pref" },
    { skill: "Docker", regex: /\b(docker|containers|containerization)\b/i, defaultCategory: "pref" },
    { skill: "Kubernetes", regex: /\b(kubernetes|k8s)\b/i, defaultCategory: "pref" },
    { skill: "AWS", regex: /\b(aws|amazon\s*web\s*services|ec2|s3)\b/i, defaultCategory: "pref" },
    { skill: "Git", regex: /\b(git|github|gitlab)\b/i, defaultCategory: "must" },
    { skill: "GraphQL", regex: /\b(graphql)\b/i, defaultCategory: "pref" },
    { skill: "Redis", regex: /\b(redis|caching)\b/i, defaultCategory: "pref" },
    { skill: "Distributed Systems", regex: /\b(distributed\s*systems|concurrency|scalability)\b/i, defaultCategory: "pref" }
  ];

  for (const item of skillKeywords) {
    if (item.regex.test(text)) {
      if (item.defaultCategory === "must" && mustHaves.length < 5) {
        mustHaves.push(item.skill);
      } else {
        preferred.push(item.skill);
      }
    }
  }

  // Disqualifier detection
  if (text.includes("5+ years") || text.includes("minimum 5 years")) {
    disqualifiers.push("Requires 5+ years of industry experience (senior role)");
  }
  if (text.includes("us citizenship required") || text.includes("security clearance")) {
    disqualifiers.push("Requires US Citizenship or government security clearance");
  }
  if (text.includes("must be local to") && !text.includes("remote")) {
    disqualifiers.push("Strictly requires local on-site residency");
  }

  const { roleCategory } = normalizeJobTitle(opp.title || "Software Engineer Intern");

  return {
    roleCategory,
    mustHaveSkills: Array.from(new Set(mustHaves.length > 0 ? mustHaves : (opp.requiredSkills || ["Computer Science", "Algorithms"]))),
    preferredSkills: Array.from(new Set(preferred.length > 0 ? preferred : (opp.preferredSkills || ["Docker", "Cloud"]))),
    experienceYearsMin: opp.experienceLevel === "intern" ? 0 : 0,
    experienceYearsMax: opp.experienceLevel === "intern" ? 1 : 2,
    educationSummary: opp.educationRequirements?.degreesAllowed?.join(" / ") || "Bachelor's degree in CS/IT or related engineering",
    graduationWindow: opp.graduationRequirements?.allowedYears?.length
      ? `${Math.min(...opp.graduationRequirements.allowedYears)}–${Math.max(...opp.graduationRequirements.allowedYears)}`
      : "2026–2029",
    locationMode: opp.remoteType || "hybrid",
    disqualifiers
  };
}
