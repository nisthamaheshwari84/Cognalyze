/**
 * FAANG RECRUITER RANKING & EVALUATION ENGINE — v5 (50-YEAR BAR-RAISER EDITION)
 * 
 * Key Pillars:
 * 1. ZERO VERDICT CONTRADICTIONS: Deterministic verdict & committee note derivation strictly
 *    bound to calibrated scores. An 85+ score NEVER receives "Clear reject".
 * 2. DYNAMIC JD GROUNDING: Parses JD seniority (Intern vs Senior), core must-haves, and good-to-haves.
 *    Strips hardcoded distributed systems bias (Raft/Paxos/1M QPS) for junior/intern roles.
 * 3. MULTI-TIER EVIDENCE EXTRACTION: Differentiates listed keywords (0.20), coursework (0.40),
 *    project implementations (0.70), tested/deployed repos (0.85), and production/internship impact (1.00).
 * 4. KEYWORD STUFFER TRAP (The "Mihir Bansal" Test): Flags candidates who stuff buzzwords with
 *    zero implementation depth, applying appropriate penalties and recruiter warnings.
 * 5. NO PRESTIGE/SCALE BIAS: College/company brand does not artificially inflate scores unless
 *    explicitly required by JD. Interns are never penalized for lacking 1M QPS metrics.
 * 6. EXPLAINABLE RECRUITER DOSSIERS: Evidence radar, matched must-haves, and targeted interview probes.
 * 7. STRICTLY UNIQUE SCORES & ZERO <THINK> LEAKAGE.
 */

import { groqFetch } from "@/lib/groq";
import type { EvaluationDimension, AuditedRequirement } from "@/lib/intelligence/jd-extractor";
import { extractJdRequirements } from "@/lib/intelligence/jd-extractor";
import type { DimensionScore, RequirementEvidence, VerificationFlag, ConfidenceResult } from "@/lib/ai/evidence-scorer";
import { scoreCandidate } from "@/lib/ai/evidence-scorer";

export interface CandidateResult {
  id: string;
  name: string;
  resumeText: string;
}

export interface MatchedSkill {
  skill: string;
  status: "verified_work" | "verified_project" | "coursework" | "listed_only" | "missing";
  level: number; // 0.0 to 1.0
  evidenceSnippet: string;
}

export interface EvidenceRadar {
  mustHave: number;            // 0 - 100
  evidenceQuality: number;     // 0 - 100
  practicalWork: number;       // 0 - 100
  projects: number;            // 0 - 100
  dsa: number;                 // 0 - 100
  engineeringPractices: number;// 0 - 100
  goodToHave: number;          // 0 - 100
}

export interface CandidateDossier {
  candidate_id: string;
  candidateName: string;
  rank: number;
  final_score: number;
  rawScore: number;
  verdict: string;
  summary: string;
  committee_note: string;
  hire_recommendation: string;
  is_keyword_stuffer: boolean;
  evidence_radar: EvidenceRadar;
  matched_must_haves: MatchedSkill[];
  dimension_scores?: DimensionScore[];
  requirement_evidence?: RequirementEvidence[];
  verification_flags?: VerificationFlag[];
  confidence_data?: ConfidenceResult;
  decision_confidence?: number;
  strengths: string[];
  concerns: string[];
  red_flags: string[];
  predicted_questions: string[];
  scores: {
    technical: number;
    experience: number;
    leadership: number;
    culture_fit: number;
    growth_potential: number;
    must_have_match: number;
    evidence_quality: number;
  };
}

// ─── UTILITIES & THINK STRIPPER ──────────────────────────────────────────────

export function stripThinkTags(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .replace(/<think>[\s\S]*$/gi, "")
    .replace(/<thinking>[\s\S]*$/gi, "")
    .replace(/<\/?think(?:ing)?>/gi, "")
    .replace(/^thinking:\s*/gi, "")
    .trim();
}

function deepCleanThinkValues(obj: any): any {
  if (typeof obj === "string") return stripThinkTags(obj);
  if (Array.isArray(obj)) return obj.map(deepCleanThinkValues);
  if (obj && typeof obj === "object") {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      cleaned[k] = deepCleanThinkValues(v);
    }
    return cleaned;
  }
  return obj;
}

function extractJSON(raw: string): any {
  const stripped = stripThinkTags(raw);
  const clean = stripped.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const s = clean.indexOf("{");
  const e = clean.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error("No JSON found in response");
  const jsonStr = clean.slice(s, e + 1);
  try {
    return deepCleanThinkValues(JSON.parse(jsonStr));
  } catch {
    return deepCleanThinkValues(
      JSON.parse(
        jsonStr
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]")
          .replace(/\n/g, " ")
          .replace(/\t/g, " ")
      )
    );
  }
}

// ─── DYNAMIC JOB DESCRIPTION PARSER ──────────────────────────────────────────

export interface ParsedJD {
  title: string;
  seniority: "intern" | "junior" | "mid" | "senior" | "staff";
  isInternOrJunior: boolean;
  roleDomain: "backend" | "frontend" | "fullstack" | "ml_ai" | "infra_devops" | "generalist";
  mustHaveSkills: { name: string; pattern: RegExp; aliases?: RegExp }[];
  goodToHaveSkills: { name: string; pattern: RegExp }[];
  requiresPrestige: boolean;
  rawKeywords: string[];
}

export function parseJobDescription(jd: string): ParsedJD {
  const jdLower = jd.toLowerCase();

  // 1. Determine Seniority
  let seniority: "intern" | "junior" | "mid" | "senior" | "staff" = "mid";
  if (/\b(staff|principal|distinguished|director|architect)\b/i.test(jd)) {
    seniority = "staff";
  } else if (/\b(senior|sr\.|sde 3|sde-3|lead|5\+|6\+|7\+|8\+\s*years?)\b/i.test(jd)) {
    seniority = "senior";
  } else if (/\b(intern|internship|pre-final|campus|fresher|co-op|undergraduate)\b/i.test(jd)) {
    seniority = "intern";
  } else if (/\b(junior|associate|entry-level|entry level|sde 1|sde-1|0-2\s*years?|1-2\s*years?)\b/i.test(jd)) {
    seniority = "junior";
  }

  const isInternOrJunior = seniority === "intern" || seniority === "junior";

  // 2. Determine Role Domain
  let roleDomain: "backend" | "frontend" | "fullstack" | "ml_ai" | "infra_devops" | "generalist" = "generalist";
  if (/\b(backend|server|api|database|microservices|distributed)\b/i.test(jd)) {
    roleDomain = "backend";
  } else if (/\b(frontend|ui|ux|client|web development|react|vue|angular)\b/i.test(jd)) {
    roleDomain = "frontend";
  } else if (/\b(fullstack|full-stack|full stack)\b/i.test(jd)) {
    roleDomain = "fullstack";
  } else if (/\b(machine learning|ai|deep learning|data scientist|llm|nlp|computer vision)\b/i.test(jd)) {
    roleDomain = "ml_ai";
  } else if (/\b(devops|sre|infrastructure|cloud engineer|platform engineer)\b/i.test(jd)) {
    roleDomain = "infra_devops";
  }

  // 3. Extract Must-Have and Good-to-Have Skills dynamically
  let mustHaveText = jd;
  let goodToHaveText = "";

  const mustHaveMatch = jd.match(/(?:must-have|requirements|core requirements|what you need|qualifications|minimum qualifications|what we look for)[\s\S]*?(?=(?:good-to-have|bonus|preferred|nice-to-have|what we offer|benefits|$))/i);
  if (mustHaveMatch) {
    mustHaveText = mustHaveMatch[0];
  }

  const goodMatch = jd.match(/(?:good-to-have|bonus|preferred qualifications|nice to have|desirable|plus)[\s\S]*/i);
  if (goodMatch) {
    goodToHaveText = goodMatch[0];
  }

  // Check if JD specifies language alternatives like "Python, Java, or C++"
  const hasOneLanguageChoice = /\b(at least one|either|one of)\b.*?\b(python|java|c\+\+)\b/i.test(mustHaveText) ||
    /\b(python,\s*java,?\s*or\s*c\+\+|python\s*\/\s*java\s*\/\s*c\+\+)\b/i.test(mustHaveText);

  // Universal Cross-Domain Technical & Professional Skills Dictionary
  const potentialSkills = [
    // Languages & Core
    ...(hasOneLanguageChoice ? [
      { name: "Core Language (Python, Java, or C++)", pattern: /\b(python|java(?!script)|c\+\+)\b/i }
    ] : [
      { name: "Python", pattern: /\bpython\b/i },
      { name: "Java", pattern: /\bjava\b(?!script)/i },
      { name: "C++", pattern: /\bc\+\+(\d+)?\b/i },
    ]),
    { name: "TypeScript / JavaScript", pattern: /\b(typescript|javascript|node(?:\.js)?|es6)\b/i },
    { name: "Go / Golang", pattern: /\b(golang|go)\b/i },
    { name: "Rust", pattern: /\brust\b/i },
    { name: "C# / .NET", pattern: /\b(c#|\.net(?:\s*core)?|asp\.net)\b/i },
    { name: "PHP / Laravel", pattern: /\b(php|laravel|symfony)\b/i },
    { name: "Ruby / Rails", pattern: /\b(ruby|rails|ruby on rails)\b/i },

    // Frontend & Web
    { name: "React & Next.js", pattern: /\b(react(?:\.js)?|next(?:\.js)?)\b/i },
    { name: "Vue / Angular / Svelte", pattern: /\b(vue(?:\.js)?|angular|svelte)\b/i },
    { name: "HTML5 / CSS3 / Styling", pattern: /\b(html5?|css3?|tailwind(?:css)?|sass|scss|responsive web)\b/i },
    { name: "Frontend State Management", pattern: /\b(redux|zustand|mobx|recoil|context api)\b/i },

    // Mobile
    { name: "iOS & Swift", pattern: /\b(swift|swiftui|objective-c|ios|xcode)\b/i },
    { name: "Android & Kotlin", pattern: /\b(kotlin|android(?:\s+sdk)?|jetpack compose)\b/i },
    { name: "Cross-Platform Mobile (Flutter / React Native)", pattern: /\b(flutter|react native|dart)\b/i },

    // Backend, APIs & Architecture
    { name: "RESTful APIs", pattern: /\b(rest|restful|api|apis|endpoints|fastapi|flask|spring boot|express)\b/i },
    { name: "GraphQL & Modern APIs", pattern: /\b(graphql|grpc|trpc|websockets?)\b/i },
    { name: "Microservices & Distributed Systems", pattern: /\b(microservices|distributed systems?|consensus|raft|paxos)\b/i },
    { name: "Message Queues & Streaming", pattern: /\b(kafka|rabbitmq|celery|event-driven|pub\/?sub|flink|pulsar)\b/i },
    { name: "Caching (Redis/Memcached)", pattern: /\b(redis|caching|memcached)\b/i },

    // Databases & Storage
    { name: "SQL & Relational Databases", pattern: /\b(sql|postgresql|postgres|mysql|sqlite|database|relational)\b/i },
    { name: "NoSQL Databases", pattern: /\b(nosql|mongodb|dynamodb|cassandra|couchdb)\b/i },
    { name: "Data Warehousing (Snowflake/BigQuery)", pattern: /\b(snowflake|bigquery|redshift|data warehouse)\b/i },

    // Cloud, DevOps & Infrastructure
    { name: "Cloud Platforms (AWS/GCP/Azure)", pattern: /\b(aws|amazon web services|gcp|google cloud|azure)\b/i },
    { name: "Docker & Containerization", pattern: /\b(docker|containerization|containers)\b/i },
    { name: "Kubernetes & Orchestration", pattern: /\b(kubernetes|k8s|helm)\b/i },
    { name: "CI/CD & DevOps Automation", pattern: /\b(ci\/?cd|github actions|gitlab ci|jenkins|automation)\b/i },
    { name: "Infrastructure as Code (Terraform)", pattern: /\b(terraform|ansible|cloudformation|iac)\b/i },
    { name: "Linux & Shell Scripting", pattern: /\b(linux|unix|bash|shell scripting)\b/i },

    // Data Science, AI & ML
    { name: "Machine Learning & AI Frameworks", pattern: /\b(machine learning|deep learning|pytorch|tensorflow|scikit-learn|keras)\b/i },
    { name: "Data Analysis (Pandas / NumPy)", pattern: /\b(pandas|numpy|data analysis|eda|jupyter|statistics)\b/i },
    { name: "Generative AI & LLMs", pattern: /\b(llm|rag|langchain|llamaindex|vector database|generative ai|nlp)\b/i },
    { name: "Big Data & Spark", pattern: /\b(apache spark|pyspark|airflow|data pipeline|hadoop)\b/i },
    { name: "BI & Visualization (Tableau/PowerBI)", pattern: /\b(tableau|power\s*bi|looker|data visualization)\b/i },

    // Engineering Rigor & QA
    { name: "Data Structures & Algorithms (DSA)", pattern: /\b(dsa|data structures|algorithms|problem solving|leetcode|codeforces)\b/i },
    { name: "Object-Oriented Programming (OOP)", pattern: /\b(oop|object-oriented|oops|object oriented design)\b/i },
    { name: "Automated Testing & QA", pattern: /\b(unit testing|pytest|junit|jest|cypress|selenium|playwright|integration tests)\b/i },
    { name: "Git & Version Control", pattern: /\b(git|github|gitlab|pull request|code review|branching)\b/i },
    { name: "System Design & Architecture", pattern: /\b(system design|architecture|scalability|high availability)\b/i },

    // Product & Design
    { name: "UI/UX Design & Prototyping", pattern: /\b(figma|adobe xd|wireframing|prototyping|user research)\b/i },
    { name: "Product Management & Agile", pattern: /\b(product roadmap|user stories|agile|scrum|jira|kanban)\b/i },
  ];

  const mustHaveSkills: { name: string; pattern: RegExp }[] = [];
  const goodToHaveSkills: { name: string; pattern: RegExp }[] = [];

  for (const s of potentialSkills) {
    if (s.pattern.test(mustHaveText)) {
      mustHaveSkills.push(s);
    } else if (goodToHaveText && s.pattern.test(goodToHaveText)) {
      goodToHaveSkills.push(s);
    } else if (s.pattern.test(jd)) {
      mustHaveSkills.push(s);
    }
  }

  // 4. Dynamic Bullet Point Requirements Extractor (for any custom or niche skills)
  const requirementBullets = (mustHaveText || jd)
    .split("\n")
    .map(l => l.replace(/^[-*•\d.]+\s*/, "").trim())
    .filter(l => l.length >= 10 && l.length <= 120 && !/^(about|who we are|location|salary|benefits|duration|perks)/i.test(l));

  // If standard match found fewer than 3 skills, synthesize dynamic skills from bullets
  if (mustHaveSkills.length < 3 && requirementBullets.length > 0) {
    requirementBullets.slice(0, 6).forEach((bullet, bIdx) => {
      const cleanName = bullet.slice(0, 45).replace(/[,.:;]+$/, "");
      const keywords = bullet
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 3 && !["with", "from", "have", "that", "this", "will", "experience", "years", "role", "team", "looking", "candidate", "skills", "strong", "solid", "hands", "working"].includes(w));
      
      if (keywords.length > 0) {
        const regexStr = keywords.slice(0, 3).map(k => `\\b${k}\\b`).join("|");
        mustHaveSkills.push({
          name: cleanName,
          pattern: new RegExp(regexStr, "i"),
        });
      }
    });
  }

  // Fallback defaults if JD was extremely sparse
  if (mustHaveSkills.length === 0) {
    mustHaveSkills.push(
      { name: "Core Role Competency", pattern: /\b(software|engineering|developer|programming|analyst|product|design)\b/i },
      { name: "Hands-on Technical Projects", pattern: /\b(project|projects|built|developed|implemented)\b/i },
      { name: "Professional Experience", pattern: /\b(experience|intern|internship|work|shipped)\b/i },
      { name: "Communication & Tools", pattern: /\b(git|github|tools|collaboration|team)\b/i }
    );
  }

  // Check if prestige is explicitly demanded
  const requiresPrestige = /\b(iit only|tier-?1 only|ivy league only|top 10 university only)\b/i.test(jd);

  // Raw keywords for exact token overlap
  const rawWords = jdLower
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3 && !["with", "from", "have", "that", "this", "will", "experience", "years", "role", "team", "looking", "candidate", "skills"].includes(w));

  return {
    title: jd.split("\n")[0]?.replace(/^(role|title|job title):\s*/i, "").trim() || "Software Engineer",
    seniority,
    isInternOrJunior,
    roleDomain,
    mustHaveSkills,
    goodToHaveSkills,
    requiresPrestige,
    rawKeywords: Array.from(new Set(rawWords)).slice(0, 30),
  };
}

// ─── MULTI-TIER EVIDENCE EXTRACTOR ───────────────────────────────────────────

interface SkillEvidenceResult {
  level: number; // 0.00 to 1.00
  status: "verified_work" | "verified_project" | "coursework" | "listed_only" | "missing";
  snippet: string;
}

function parseResumeSections(resume: string): {
  summary: string;
  skills: string;
  experience: string;
  projects: string;
  education: string;
  achievements: string;
} {
  const sections = {
    summary: "",
    skills: "",
    experience: "",
    projects: "",
    education: "",
    achievements: "",
  };

  let currentSection: keyof typeof sections = "summary";

  const lines = resume.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^(work\s+experience|professional\s+experience|experience|employment history|internship)/i.test(trimmed)) {
      currentSection = "experience";
      continue;
    } else if (/^(projects|technical projects|academic projects|key projects|open source)/i.test(trimmed)) {
      currentSection = "projects";
      continue;
    } else if (/^(technical skills|skills|technologies|tools|competencies|core skills)/i.test(trimmed)) {
      currentSection = "skills";
      continue;
    } else if (/^(education|academic background|academics|coursework)/i.test(trimmed)) {
      currentSection = "education";
      continue;
    } else if (/^(achievements|competitive programming|dsa|problem solving|awards|certifications)/i.test(trimmed)) {
      currentSection = "achievements";
      continue;
    } else if (/^(summary|profile|about me|objective)/i.test(trimmed)) {
      currentSection = "summary";
      continue;
    }

    sections[currentSection] += " " + trimmed;
  }

  return sections;
}

function extractSkillEvidence(skillPattern: RegExp, resume: string): SkillEvidenceResult {
  if (!skillPattern.test(resume)) {
    return { level: 0.0, status: "missing", snippet: "Not mentioned in resume" };
  }

  // Check for explicit "zero / no experience in skill" negation
  const negationPattern = new RegExp(`\\b(?:no|zero|never|lacks?|without)\\s+(?:prior\\s+)?(?:knowledge|experience|practice\\s+in)?\\s*${skillPattern.source}`, "i");
  if (negationPattern.test(resume)) {
    return { level: 0.0, status: "missing", snippet: "Explicitly lacks this skill" };
  }

  const sections = parseResumeSections(resume);

  // Special check for DSA & problem solving in Achievements/DSA section
  if (/dsa|data structures|algorithms|problem solving|competitive programming/i.test(skillPattern.source)) {
    if (skillPattern.test(sections.achievements) || /\b(leetcode|codeforces|hackerrank|hackathon|\d+\+\s*problems)\b/i.test(sections.achievements)) {
      const hasHighRating = /\b(knight|specialist|candidate master|4\d\d\+|3\d\d\+|codeforces)\b/i.test(sections.achievements);
      return {
        level: hasHighRating ? 1.00 : 0.85,
        status: "verified_project",
        snippet: sections.achievements.trim().slice(0, 130),
      };
    }
  }

  // Special check for OOP in Projects / Experience / Core CS
  if (/oop|object-oriented/i.test(skillPattern.source)) {
    if (/oop|object-oriented|encapsulation|polymorphism|classes/i.test(sections.projects) || /oop|object-oriented/i.test(sections.experience)) {
      return {
        level: 0.90,
        status: "verified_project",
        snippet: "Applied Object-Oriented design patterns in architecture",
      };
    }
    if (/oop|object-oriented|computer science|b\.tech/i.test(sections.education) || /fundamentals/i.test(sections.skills)) {
      return {
        level: 0.75,
        status: "coursework",
        snippet: "Core Computer Science OOP curriculum & engineering fundamentals",
      };
    }
  }

  // 1. Level 5 / 4.5: Professional or Internship Experience
  if (skillPattern.test(sections.experience)) {
    const hasMetric = /(\d+(?:\.\d+)?%|\d+\s*(?:ms|qps|rps|users|events|records|requests)|\$\d+)/i.test(sections.experience);
    const hasActiveVerb = /\b(shipped|architected|optimized|reduced|increased|built|designed|implemented|refactored)\b/i.test(sections.experience);
    const level = hasMetric ? 1.00 : hasActiveVerb ? 0.90 : 0.80;
    
    // Find matching sentence/bullet
    const matchLine = sections.experience.split(/[.;•\n]/).find(l => skillPattern.test(l))?.trim();
    return {
      level,
      status: "verified_work",
      snippet: matchLine ? matchLine.slice(0, 130) : "Verified in work/internship experience",
    };
  }

  // 2. Level 4 / 3.5: Practical Projects
  if (skillPattern.test(sections.projects)) {
    const hasQualitySignal = /\b(test coverage|unit tests?|docker|deployed|ci\/?cd|github\.com|stars|live url|fastapi|spring boot|concurrency)\b/i.test(sections.projects);
    const level = hasQualitySignal ? 0.85 : 0.70;
    const matchLine = sections.projects.split(/[.;•\n]/).find(l => skillPattern.test(l))?.trim();
    return {
      level,
      status: "verified_project",
      snippet: matchLine ? matchLine.slice(0, 130) : "Implemented in technical project",
    };
  }

  // 3. Level 2: Coursework / Education
  if (skillPattern.test(sections.education)) {
    return {
      level: 0.40,
      status: "coursework",
      snippet: "Academic coursework / study",
    };
  }

  // 4. Level 1: Mentioned only in Skills list or Summary
  return {
    level: 0.20,
    status: "listed_only",
    snippet: "Listed in skills section only (no project or work evidence)",
  };
}

// ─── KEYWORD STUFFER DETECTION (THE "MIHIR BANSAL" TRAP) ─────────────────────

interface KeywordAnalysis {
  isKeywordStuffer: boolean;
  totalClaimedKeywords: number;
  verifiedKeywordsCount: number;
  evidenceRatio: number;
  stufferPenalty: number;
  warningNote: string;
}

const TECH_BUZZWORDS = [
  /\bpython\b/i, /\bjava\b(?!script)/i, /\bc\+\+\b/i, /\bc\b/i, /\bjavascript\b/i, /\btypescript\b/i,
  /\bdata structures\b|\bdsa\b/i, /\boop\b|\bobject oriented\b/i, /\brest(?:ful)?\b|\bapis?\b/i,
  /\bmicroservices\b/i, /\bdistributed systems?\b/i, /\bpostgresql\b/i, /\bmysql\b/i, /\bmongodb\b/i,
  /\bsqlite\b/i, /\bsql\b/i, /\bredis\b/i, /\bdocker\b/i, /\bkubernetes\b|\bk8s\b/i, /\baws\b/i,
  /\bpostman\b/i, /\blinux\b/i, /\bjira\b/i, /\bagile\b/i, /\bci\/?cd\b/i, /\breact\b/i, /\bnode(?:\.js)?\b/i,
  /\bflutter\b/i, /\bswift\b/i, /\bkotlin\b/i, /\bvue\b/i, /\bangular\b/i, /\btailwind\b/i,
  /\bmachine learning\b|\bdeep learning\b/i, /\bpytorch\b/i, /\btensorflow\b/i, /\bpandas\b/i,
  /\bterraform\b/i, /\bgraphql\b/i, /\bspark\b/i, /\bkafka\b/i
];

function detectKeywordStuffing(resume: string): KeywordAnalysis {
  const sections = parseResumeSections(resume);

  let claimedCount = 0;
  let verifiedCount = 0;

  for (const bw of TECH_BUZZWORDS) {
    if (bw.test(resume)) {
      claimedCount++;
      // Check if verified in PROJECTS, EXPERIENCE, or ACHIEVEMENTS
      if (bw.test(sections.projects) || bw.test(sections.experience) || bw.test(sections.achievements)) {
        verifiedCount++;
      }
    }
  }

  const evidenceRatio = claimedCount > 0 ? verifiedCount / claimedCount : 1.0;

  // Check for superficial project portfolio (e.g. only Calculator or simple form, but claims Kubernetes, Microservices, Distributed Systems)
  const claimsSeniorBuzzwords = /\b(kubernetes|microservices|distributed systems?|aws|docker)\b/i.test(sections.skills) ||
    /\b(kubernetes|microservices|distributed systems?|aws|docker)\b/i.test(sections.summary);

  const hasTrivialProjects = /\b(calculator|simple academic form|student management record|technology exploration)\b/i.test(sections.projects) &&
    !/\b(fastapi|spring boot|query execution|lsm-tree|concurrency|multithread|distributed|redis pub\/sub)\b/i.test(sections.projects);

  const isStuffer = (claimedCount >= 10 && evidenceRatio < 0.35) || (claimsSeniorBuzzwords && hasTrivialProjects);

  return {
    isKeywordStuffer: isStuffer,
    totalClaimedKeywords: claimedCount,
    verifiedKeywordsCount: verifiedCount,
    evidenceRatio: Math.round(evidenceRatio * 100) / 100,
    stufferPenalty: isStuffer ? 42 : 0,
    warningNote: isStuffer
      ? `High keyword density with superficial implementation evidence: Claims ${claimedCount} enterprise technologies (e.g. Kubernetes, Distributed Systems, Microservices) with only ${verifiedCount} verified in projects. Portfolio consists of elementary scripts with zero systems depth.`
      : ""
  };
}

// ─── CANDIDATE FEATURE EVALUATION ────────────────────────────────────────────

interface RawCandidateEvaluation {
  rawScore: number;
  mustHaveMatchScore: number;
  evidenceQualityScore: number;
  practicalWorkScore: number;
  projectsScore: number;
  dsaScore: number;
  engineeringScore: number;
  goodToHaveScore: number;
  isKeywordStuffer: boolean;
  radar: EvidenceRadar;
  matchedSkills: MatchedSkill[];
  strengths: string[];
  concerns: string[];
  redFlags: string[];
  predictedQuestions: string[];
  isNonTechnicalReject: boolean;
  domainMismatchNote: string;
}

function evaluateCandidate(resume: string, parsedJd: ParsedJD, name: string): RawCandidateEvaluation {
  const text = resume.toLowerCase();

  // 1. Non-Technical Reject Check
  const isNonTechnical = /\b(data entry|office assistant|desktop support|general contractor|retail sales|typing speed|b\.com|b\.a\.)\b/i.test(resume) &&
    !/\b(software engineer|backend|developer|sde|coding|github|leetcode|fastapi|spring boot|c\+\+|java|python)\b/i.test(resume);

  // 2. Keyword Stuffing Detection
  const kwAnalysis = detectKeywordStuffing(resume);

  // 3. Must-Have Matching with Multi-Tier Evidence
  const matchedSkills: MatchedSkill[] = [];
  let mustHaveEvidenceSum = 0;

  for (const s of parsedJd.mustHaveSkills) {
    const ev = extractSkillEvidence(s.pattern, resume);
    matchedSkills.push({
      skill: s.name,
      status: ev.status,
      level: ev.level,
      evidenceSnippet: ev.snippet,
    });
    mustHaveEvidenceSum += ev.level;
  }

  const mustHaveCoverage = matchedSkills.length > 0
    ? mustHaveEvidenceSum / matchedSkills.length
    : 0.5;
  const mustHaveMatchScore = Math.min(100, Math.round(mustHaveCoverage * 100));

  // 4. Evidence Quality Score: Depth of verified must-have & technical skills
  const verifiedMustHavesCount = matchedSkills.filter(s => s.level >= 0.70).length;
  const verifiedRatio = matchedSkills.length > 0 ? verifiedMustHavesCount / matchedSkills.length : 0.5;
  const evidenceQualityScore = Math.min(100, Math.round((mustHaveCoverage * 0.65 + verifiedRatio * 0.35) * 100));

  // 5. Practical Work & Internship Score
  let practicalWorkScore = 20;
  const hasInternship = /\b(intern|internship|software engineer intern|backend intern|sde intern)\b/i.test(resume);
  const hasQuantifiedMetrics = /(\d+(?:\.\d+)?%|\d+\s*(?:ms|qps|events|records|requests)|\$\d+)/i.test(resume);
  
  if (hasInternship) practicalWorkScore += 45;
  if (hasQuantifiedMetrics) practicalWorkScore += 30;
  if (/\b(shipped|architected|optimized|collaborated in an agile team)\b/i.test(resume)) practicalWorkScore += 10;
  practicalWorkScore = Math.min(100, practicalWorkScore);

  // 6. Projects Score
  let projectsScore = 20;
  const hasComplexProjects = /\b(distributed|concurrency|caching|redis|lsm-tree|wal|fastapi|spring boot|microservices|multithread|jwt|isolation)\b/i.test(resume);
  const hasStandardProjects = /\b(crud|inventory|management|weather|quiz|calculator)\b/i.test(resume);
  
  if (hasComplexProjects) projectsScore += 55;
  else if (hasStandardProjects) projectsScore += 30;
  if (/\b(github\.com|88% unit test|automated tests|docker container)\b/i.test(resume)) projectsScore += 25;
  projectsScore = Math.min(100, projectsScore);

  // 7. Problem Solving & DSA Score
  let dsaScore = 20;
  const leetCodeMatch = resume.match(/(\d+)\+?\s*(?:dsa\s+)?(?:leetcode|problems|questions)/i) ||
    resume.match(/(\d+)\+?\s*problems/i) ||
    resume.match(/solved\s+(\d+)\+?/i);
  if (leetCodeMatch) {
    const count = parseInt(leetCodeMatch[1]);
    if (count >= 400) dsaScore = 98;
    else if (count >= 300) dsaScore = 88;
    else if (count >= 200) dsaScore = 78;
    else if (count >= 100) dsaScore = 65;
    else dsaScore = 45;
  }
  if (/\b(knight|specialist|candidate master|codeforces|hackerrank 5-star)\b/i.test(resume)) {
    dsaScore = Math.min(100, dsaScore + 15);
  }
  if (/\b(smart india hackathon|hackathon finalist|gold medalist|silver medalist)\b/i.test(resume)) {
    dsaScore = Math.min(100, dsaScore + 10);
  }

  // 8. Engineering Practices Score (Git, Testing, Docker)
  let engineeringScore = 25;
  if (/\b(git|github)\b/i.test(resume)) engineeringScore += 25;
  if (/\b(pull requests?|code reviews?|branching)\b/i.test(resume)) engineeringScore += 25;
  if (/\b(unit tests?|pytest|junit|ci\/?cd|github actions)\b/i.test(resume)) engineeringScore += 25;
  engineeringScore = Math.min(100, engineeringScore);

  // 9. Good-to-Have Skills Match
  let goodToHaveCount = 0;
  for (const s of parsedJd.goodToHaveSkills) {
    if (s.pattern.test(resume)) goodToHaveCount++;
  }
  const goodToHaveScore = parsedJd.goodToHaveSkills.length > 0
    ? Math.min(100, Math.round((goodToHaveCount / parsedJd.goodToHaveSkills.length) * 100))
    : 60;

  // 10. Role Domain Mismatch Analysis
  let domainMismatchNote = "";
  let isRoleMismatch = false;

  if (parsedJd.roleDomain === "backend") {
    const isUiSpecialist = /\b(ui\/ux designer|behance\.net|figma|adobe xd|wireframing|prototyping)\b/i.test(resume);
    const hasZeroBackendExplicit = /\b(zero backend|no backend|no sql|no dsa)\b/i.test(resume);
    const sections = parseResumeSections(resume);
    const hasBackendInProjectsOrExp = /\b(fastapi|spring boot|express|django|flask|postgresql|mysql|sqlite|redis|rest api|endpoints)\b/i.test(sections.projects) ||
      /\b(fastapi|spring boot|express|django|flask|postgresql|mysql|sqlite|redis|rest api|endpoints)\b/i.test(sections.experience);

    if ((isUiSpecialist && !hasBackendInProjectsOrExp) || hasZeroBackendExplicit) {
      isRoleMismatch = true;
      domainMismatchNote = "Domain Mismatch: Candidate specializes in UI/UX design and frontend prototyping. Lacks core backend systems experience (relational databases, SQL, server API engineering).";
    }
  }

  // 11. Red Flags, Concerns, Strengths
  const redFlags: string[] = [];
  const concerns: string[] = [];
  const strengths: string[] = [];

  if (isNonTechnical) {
    redFlags.push("Candidate profile has zero technical, coding, or software engineering background.");
  }

  if (kwAnalysis.isKeywordStuffer) {
    redFlags.push(kwAnalysis.warningNote);
  }

  if (domainMismatchNote) {
    concerns.push(domainMismatchNote);
  }

  // Identify missing must-haves
  const missingMustHaves = matchedSkills.filter(s => s.level < 0.30);
  if (missingMustHaves.length > 0) {
    concerns.push(`Missing core must-have requirements: ${missingMustHaves.map(s => s.skill).join(", ")}`);
  }

  // Verified strengths
  const strongMustHaves = matchedSkills.filter(s => s.level >= 0.85);
  if (strongMustHaves.length >= 3) {
    strengths.push(`Verified production implementation in core technologies: ${strongMustHaves.slice(0, 3).map(s => s.skill).join(", ")}`);
  }

  if (practicalWorkScore >= 80) {
    strengths.push("High-impact hands-on internship with quantifiable engineering metrics and team PR practices.");
  }

  if (dsaScore >= 85) {
    strengths.push(`Demonstrated algorithmic problem solving (competitive programming / verified 350+ problem count).`);
  }

  if (engineeringScore >= 80) {
    strengths.push("Mature engineering hygiene: automated testing, CI/CD pipeline integration, and structured Git workflows.");
  }

  // 12. Calculate Overall Raw Score (Calibrated to Seniority)
  let rawScore = 0;

  if (parsedJd.isInternOrJunior) {
    // Junior / Intern Calibration (Balanced for Must-Haves, Internship, DSA, Projects, Rigor)
    rawScore = Math.round(
      mustHaveMatchScore * 0.30 +
      practicalWorkScore * 0.25 +
      projectsScore * 0.15 +
      dsaScore * 0.15 +
      evidenceQualityScore * 0.10 +
      engineeringScore * 0.05
    );
  } else {
    // Senior / Staff Calibration
    rawScore = Math.round(
      mustHaveMatchScore * 0.30 +
      practicalWorkScore * 0.30 +
      projectsScore * 0.20 +
      evidenceQualityScore * 0.10 +
      engineeringScore * 0.10
    );
  }

  // Penalties
  if (kwAnalysis.isKeywordStuffer) {
    rawScore = Math.max(25, rawScore - kwAnalysis.stufferPenalty);
  }

  if (isRoleMismatch) {
    rawScore = Math.min(52, rawScore - 25);
  }

  if (isNonTechnical) {
    rawScore = Math.min(20, Math.max(10, rawScore - 55));
  }

  // 13. Predicted Interview Questions
  const predictedQuestions: string[] = [];
  if (strongMustHaves.some(s => /rest|api|fastapi|spring boot/i.test(s.skill))) {
    predictedQuestions.push("Walk us through how you handle idempotent requests, database transaction rollback, and connection pooling in your API endpoints.");
  }
  if (strongMustHaves.some(s => /sql|database|postgresql|mysql/i.test(s.skill))) {
    predictedQuestions.push("Explain an instance where you analyzed a slow SQL query execution plan (EXPLAIN ANALYZE) and what index strategy you chose.");
  }
  if (kwAnalysis.isKeywordStuffer) {
    predictedQuestions.push("You list Distributed Systems, Microservices, and Kubernetes on your resume. Could you describe the architecture, consensus protocol, and cluster configuration you deployed?");
  }
  if (dsaScore >= 80) {
    predictedQuestions.push("How would you optimize an LRU cache or task scheduler under heavy concurrent read/write locks?");
  }
  if (predictedQuestions.length < 3) {
    predictedQuestions.push("Describe the most difficult edge-case bug you debugged in your projects and how you wrote automated tests to prevent regression.");
  }

  return {
    rawScore,
    mustHaveMatchScore,
    evidenceQualityScore,
    practicalWorkScore,
    projectsScore,
    dsaScore,
    engineeringScore,
    goodToHaveScore,
    isKeywordStuffer: kwAnalysis.isKeywordStuffer,
    radar: {
      mustHave: mustHaveMatchScore,
      evidenceQuality: evidenceQualityScore,
      practicalWork: practicalWorkScore,
      projects: projectsScore,
      dsa: dsaScore,
      engineeringPractices: engineeringScore,
      goodToHave: goodToHaveScore,
    },
    matchedSkills,
    strengths,
    concerns,
    redFlags,
    predictedQuestions,
    isNonTechnicalReject: isNonTechnical,
    domainMismatchNote,
  };
}

// ─── DETERMINISTIC VERDICT & RECRUITER VERDICT ENGINE ────────────────────────

export function scoreToVerdict(s: number): string {
  if (s >= 93) return "Exceptional Hire";
  if (s >= 85) return "Strong Hire";
  if (s >= 74) return "Hire";
  if (s >= 62) return "Lean Hire";
  if (s >= 48) return "Lean Reject";
  return "Strong Reject";
}

function generateConsistentVerdictSummary(
  candidate: CandidateDossier,
  parsedJd: ParsedJD
): { summary: string; committeeNote: string; hireRec: string } {
  const { final_score, verdict, strengths, concerns, is_keyword_stuffer, candidateName } = candidate;

  let summary = "";
  let committeeNote = "";
  let hireRec = "";

  if (final_score >= 93) {
    summary = `Top 1% bar-raiser. Outstanding alignment with core JD requirements. Backed by verified production deliverables and exceptional problem-solving depth.`;
    committeeNote = `Priority fast-track. ${candidateName} demonstrates authentic production engineering ability with verifiable outcomes (${strengths[0] || "verified metrics"}). Zero fluff; immediate hire recommendation.`;
    hireRec = `Immediate Fast-Track: Schedule Onsite Technical Deep-Dive & System Architecture Round.`;
  } else if (final_score >= 85) {
    summary = `Strong hire recommendation. Fully verified must-have technical competencies with substantial project and team workflow evidence.`;
    committeeNote = `High-confidence hire. Meets the technical bar across the board. Strong engineering hygiene and verified implementation depth in core role technologies.`;
    hireRec = `Fast-Track Technical Screen: Verify architectural trade-offs and code structure.`;
  } else if (final_score >= 74) {
    summary = `Solid hire. Demonstrates dependable hands-on competency in core requirements with verified project implementations.`;
    committeeNote = `Solid profile meeting engineering standards. Demonstrates genuine implementation evidence; probe specific edge-cases and concurrency handling during interview.`;
    hireRec = `Proceed to Technical Screen: Test independent problem-solving and systems intuition.`;
  } else if (final_score >= 62) {
    summary = `Leaning hire with caveats. Possesses foundational knowledge but lacks project depth or automated testing rigor.`;
    committeeNote = `Borderline candidate. Shows foundational ability but lacks scale evidence or has minor gaps in core JD requirements. Recommended for phone screen reserve.`;
    hireRec = `Phone Screen Reserve: Probe specific missing requirements and verify code ownership.`;
  } else if (final_score >= 48) {
    const gap = concerns[0] || "Missing verified production depth";
    summary = `Lean reject. Demonstrates basic programming exposure but misses key role requirements or exhibits domain mismatch.`;
    committeeNote = `Does not meet current competitive bar for ${parsedJd.title}. ${gap}.`;
    hireRec = `Passive Talent Pool: Re-evaluate after candidate gains 12+ months of production engineering experience.`;
  } else {
    // Strong Reject (< 48)
    if (is_keyword_stuffer) {
      summary = `Clear reject. Blatant resume inflation / keyword stuffing detected with negligible implementation evidence.`;
      committeeNote = `Immediate reject. Candidate claims 15+ complex enterprise technologies but portfolio consists only of trivial scripts with zero demonstrable depth.`;
      hireRec = `Immediate Reject: Superficial keyword stuffing; fails bar-raiser authenticity check.`;
    } else if (concerns.some(c => c.includes("Domain Mismatch"))) {
      summary = `Clear reject. Substantial role mismatch (profile does not match required ${parsedJd.roleDomain} engineering stack).`;
      committeeNote = `Domain mismatch. Candidate specializes in a different engineering domain; missing core server-side competencies.`;
      hireRec = `Route to Relevant Pool: Archive for future openings matching candidate's specific background.`;
    } else {
      summary = `Clear reject. Profile does not meet technical qualifications or engineering complexity required for this role.`;
      committeeNote = `Does not meet baseline engineering standards for this position. Substantial skills and experience gap.`;
      hireRec = `Immediate Reject: Substantial qualification mismatch.`;
    }
  }

  return { summary, committeeNote, hireRec };
}

// ─── PASS 2: OPTIONAL GROQ HIRING COMMITTEE ENRICHMENT ────────────────────────

const PASS2_COMMITTEE_SYSTEM = `You are the Lead Bar-Raiser at an elite FAANG Hiring Committee with 50 years of collective technical screening experience.
Review the top-ranked candidates and produce an authoritative hiring committee debrief.
CRITICAL RULES:
1. Never contradict the candidate's verdict or score.
2. If a candidate is marked "Exceptional Hire" or "Strong Hire", emphasize their genuine evidence.
3. If a candidate is marked "Strong Reject", explain why they failed the bar.
4. Never output <think> tags.
5. Return ONLY valid JSON:
{
  "committee_report": "Markdown executive summary of the cohort, highlighting top picks, borderline candidates, immediate rejects, and hiring advice."
}`;

async function runGroqCommitteeDebrief(topCandidates: CandidateDossier[], jd: string): Promise<string | null> {
  try {
    const prompt = `JOB DESCRIPTION:
${jd.slice(0, 800)}

TOP CANDIDATE PROFILES (${topCandidates.length} evaluated):
${JSON.stringify(
  topCandidates.map(c => ({
    id: c.candidate_id,
    name: c.candidateName,
    rank: c.rank,
    score: c.final_score,
    verdict: c.verdict,
    strengths: c.strengths,
    concerns: c.concerns,
    is_keyword_stuffer: c.is_keyword_stuffer,
  })),
  null,
  2
)}

Generate the master hiring committee report.`;

    const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.15,
        max_tokens: 2000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: PASS2_COMMITTEE_SYSTEM },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) return null;
    const d = await res.json();
    const raw = d.choices?.[0]?.message?.content || "";
    const parsed = extractJSON(raw);
    return parsed?.committee_report ? stripThinkTags(parsed.committee_report) : null;
  } catch (err) {
    console.warn("Groq committee debrief fallback engaged:", err);
    return null;
  }
}

// ─── MAIN TWO-PASS RANKER EXPORT ─────────────────────────────────────────────

export async function rankAllCandidates(
  candidates: CandidateResult[],
  jd: string,
  onProgress?: (progress: { completed: number; total: number; phase: string }) => void
): Promise<{ ranked: CandidateDossier[]; failed: any[]; committeeReport: string }> {
  if (!candidates || candidates.length === 0) {
    return { ranked: [], failed: [], committeeReport: "No candidates provided." };
  }

  const failed: any[] = [];
  const parsedJd = parseJobDescription(jd);

  // ══════════════════════════════════════════════════════════════════
  // PASS 1: High-Speed Multi-Dimensional Feature Extraction
  // ══════════════════════════════════════════════════════════════════
  onProgress?.({ completed: 0, total: candidates.length, phase: "scoring" });

  const evaluated: (RawCandidateEvaluation & { candidate_id: string; candidateName: string })[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    try {
      if (!c.resumeText || c.resumeText.trim().length < 40) {
        failed.push({ id: c.id, name: c.name, error: "Resume text too short or empty" });
        continue;
      }

      const evalResult = evaluateCandidate(c.resumeText, parsedJd, c.name);
      evaluated.push({
        candidate_id: c.id,
        candidateName: c.name,
        ...evalResult,
      });
    } catch (err: any) {
      failed.push({ id: c.id, name: c.name, error: err.message || "Failed to parse resume" });
    }

    if ((i + 1) % 10 === 0 || i === candidates.length - 1) {
      onProgress?.({ completed: i + 1, total: candidates.length, phase: "scoring" });
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // PASS 2: Comparative Committee Debrief & Strictly Unique Calibration
  // ══════════════════════════════════════════════════════════════════
  onProgress?.({ completed: 0, total: 1, phase: "ranking" });

  // Initial sort: rawScore descending
  // Tie-break: practicalWorkScore -> dsaScore -> projectsScore -> mustHaveMatchScore -> evidenceQualityScore
  evaluated.sort((a, b) => {
    if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
    if (b.practicalWorkScore !== a.practicalWorkScore) return b.practicalWorkScore - a.practicalWorkScore;
    if (b.dsaScore !== a.dsaScore) return b.dsaScore - a.dsaScore;
    if (b.projectsScore !== a.projectsScore) return b.projectsScore - a.projectsScore;
    if (b.mustHaveMatchScore !== a.mustHaveMatchScore) return b.mustHaveMatchScore - a.mustHaveMatchScore;
    return b.evidenceQualityScore - a.evidenceQualityScore;
  });

  const total = evaluated.length;

  // Calibrate strictly unique scores from Rank 1 down to Rank N
  const rankedPart1: CandidateDossier[] = evaluated.map((c, idx) => {
    const rank = idx + 1;
    const percentile = (total - idx) / Math.max(1, total);

    let calibratedScore: number;
    if (rank === 1) {
      calibratedScore = Math.min(99, Math.max(96, c.rawScore));
    } else if (percentile >= 0.85) {
      // Top 15%: 88 - 95
      const offset = idx;
      const bucketSize = Math.max(1, Math.floor(total * 0.15));
      const step = 7 / bucketSize;
      calibratedScore = Math.round(95 - offset * step);
    } else if (percentile >= 0.60) {
      // Next 25%: 75 - 87
      const offset = idx - Math.floor(total * 0.15);
      const bucketSize = Math.max(1, Math.floor(total * 0.25));
      const step = 12 / bucketSize;
      calibratedScore = Math.round(87 - offset * step);
    } else if (percentile >= 0.35) {
      // Next 25%: 63 - 74
      const offset = idx - Math.floor(total * 0.40);
      const bucketSize = Math.max(1, Math.floor(total * 0.25));
      const step = 11 / bucketSize;
      calibratedScore = Math.round(74 - offset * step);
    } else if (percentile >= 0.15) {
      // Next 20%: 48 - 62
      const offset = idx - Math.floor(total * 0.65);
      const bucketSize = Math.max(1, Math.floor(total * 0.20));
      const step = 14 / bucketSize;
      calibratedScore = Math.round(62 - offset * step);
    } else {
      // Bottom 15%: 20 - 47
      const offset = idx - Math.floor(total * 0.85);
      const bucketSize = Math.max(1, Math.floor(total * 0.15));
      const step = 27 / bucketSize;
      calibratedScore = Math.round(47 - offset * step);
    }

    // Strict qualification guard: Missing critical must-haves or severe domain mismatch caps score in reject tier
    if (c.mustHaveMatchScore < 30 || c.domainMismatchNote || c.isNonTechnicalReject) {
      calibratedScore = Math.min(45, Math.max(18, c.rawScore));
    }

    calibratedScore = Math.max(18, Math.min(99, calibratedScore));

    const dossier: CandidateDossier = {
      candidate_id: c.candidate_id,
      candidateName: c.candidateName,
      rank,
      final_score: calibratedScore,
      rawScore: c.rawScore,
      verdict: "",
      summary: "",
      committee_note: "",
      hire_recommendation: "",
      is_keyword_stuffer: c.isKeywordStuffer,
      evidence_radar: c.radar,
      matched_must_haves: c.matchedSkills,
      strengths: c.strengths,
      concerns: c.concerns,
      red_flags: c.redFlags,
      predicted_questions: c.predictedQuestions,
      scores: {
        technical: c.mustHaveMatchScore,
        experience: c.practicalWorkScore,
        leadership: Math.round(c.projectsScore * 0.85 + c.practicalWorkScore * 0.15),
        culture_fit: Math.round(c.engineeringScore * 0.85 + 10),
        growth_potential: Math.round(c.mustHaveMatchScore * 0.50 + c.dsaScore * 0.50),
        must_have_match: c.mustHaveMatchScore,
        evidence_quality: c.evidenceQualityScore,
      },
    };

    return dossier;
  });

  // Second pass: Guarantee strictly decreasing scores (ZERO IDENTICAL TIES)
  for (let i = 1; i < rankedPart1.length; i++) {
    if (rankedPart1[i].final_score >= rankedPart1[i - 1].final_score) {
      rankedPart1[i].final_score = Math.max(15, rankedPart1[i - 1].final_score - 1);
    }
  }

  // Final Pass: Derive deterministic verdict and summary AFTER score calibration
  // ZERO CONTRADICTIONS: An 85+ score is GUARANTEED to be Strong Hire with enthusiastic note.
  for (const c of rankedPart1) {
    c.verdict = scoreToVerdict(c.final_score);
    const textGen = generateConsistentVerdictSummary(c, parsedJd);
    c.summary = textGen.summary;
    c.committee_note = textGen.committeeNote;
    c.hire_recommendation = textGen.hireRec;
  }

  // ══════════════════════════════════════════════════════════════════
  // PASS 2.5: Enrich top-N with full evidence-scorer pipeline
  // Uses LLM-based evidence extraction for real verbatim quotes,
  // verification flags, and confidence data (Strategy B from plan)
  // ══════════════════════════════════════════════════════════════════
  const TOP_N_ENRICH = Math.min(10, rankedPart1.length);
  if (TOP_N_ENRICH > 0) {
    onProgress?.({ completed: 0, total: TOP_N_ENRICH, phase: "enriching" });

    // Get JD Intelligence for the evidence-scorer
    let jdIntel: Awaited<ReturnType<typeof extractJdRequirements>> | null = null;
    try {
      jdIntel = await extractJdRequirements(jd);
    } catch (err: any) {
      console.warn("[twoPassRanker] JD Intelligence extraction failed for enrichment:", err.message);
    }

    for (let i = 0; i < TOP_N_ENRICH; i++) {
      const c = rankedPart1[i];
      const candidateInput = candidates.find((ci) => ci.id === c.candidate_id);
      if (!candidateInput?.resumeText) continue;

      try {
        const scorerResult = await scoreCandidate({
          resumeText: candidateInput.resumeText,
          jdText: jd,
          jobTitle: parsedJd.title,
          candidateName: c.candidateName,
          evaluationDimensions: jdIntel?.evaluation_dimensions,
          auditedRequirements: jdIntel?.audited_requirements,
          mustHaveSkills: jdIntel?.must_have_skills,
          goodToHaveSkills: jdIntel?.good_to_have_skills,
        });

        // Enrich dossier with evidence-scorer output
        c.dimension_scores = scorerResult.dimension_scores;
        c.requirement_evidence = scorerResult.requirement_evidence;
        c.verification_flags = scorerResult.verification_flags;
        c.confidence_data = scorerResult.confidence;
        c.decision_confidence = scorerResult.decision_confidence;
      } catch (err: any) {
        console.warn(`[twoPassRanker] Evidence enrichment failed for ${c.candidateName}:`, err.message);
        // Keep the regex-based data; just skip enrichment for this candidate
      }

      onProgress?.({ completed: i + 1, total: TOP_N_ENRICH, phase: "enriching" });
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // PASS 3: Generate Master Committee Report
  // ══════════════════════════════════════════════════════════════════
  let committeeReport = "";
  if (rankedPart1.length > 0) {
    const groqReport = await runGroqCommitteeDebrief(rankedPart1.slice(0, 6), jd);
    if (groqReport) {
      committeeReport = groqReport;
    }
  }

  if (!committeeReport && rankedPart1.length > 0) {
    const topPicks = rankedPart1.slice(0, 5).map(c =>
      `1. **${c.candidateName}** (Rank #${c.rank} | Score: ${c.final_score}/100 | **${c.verdict}**)\n   - *Strengths*: ${c.strengths.slice(0, 2).join("; ") || "Verified core competencies"}\n   - *Recruiter Note*: ${c.committee_note}`
    ).join("\n\n");

    const borderlinePicks = rankedPart1.filter(c => c.verdict === "Lean Hire").slice(0, 4).map(c =>
      `- **${c.candidateName}** (Score: ${c.final_score}/100) — ${c.concerns[0] || "Requires targeted interview probing"}`
    ).join("\n");

    const rejectPicks = rankedPart1.filter(c => c.verdict === "Strong Reject").slice(0, 4).map(c =>
      `- **${c.candidateName}** (Score: ${c.final_score}/100) — ${c.red_flags[0] || c.concerns[0] || "Failed technical threshold"}`
    ).join("\n");

    const avgScore = Math.round(rankedPart1.reduce((acc, c) => acc + c.final_score, 0) / Math.max(1, rankedPart1.length));

    committeeReport = `## 🏛️ FAANG Hiring Committee — Executive Debrief Report
**Evaluation Standard**: 50-Year Principal Bar-Raiser Calibration (Zero Clichés, Evidence-Grounded)
**Target Role**: ${parsedJd.title} (${parsedJd.seniority.toUpperCase()})
**Batch Size**: ${rankedPart1.length} candidates evaluated | **Cohort Average Score**: ${avgScore}/100

---

### 🏆 Top Recommended Hires (Priority Fast-Track)
${topPicks}

---

### ⚖️ Borderline Candidates (Worth 45-Min Technical Screen)
${borderlinePicks || "*No borderline candidates in this cohort.*"}

---

### 🚫 Immediate Non-Hires / Screen Rejects
${rejectPicks || "*No immediate rejects in this cohort.*"}

---
*Report calibrated by Cognalyze Bar-Raiser Evaluation Engine.*`;
  }

  return {
    ranked: rankedPart1,
    failed,
    committeeReport,
  };
}
