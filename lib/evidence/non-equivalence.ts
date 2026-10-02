/**
 * COGNALYZE — HARD NON-EQUIVALENCE & BOUNDARY RULES
 * 
 * CORE LAW: NO EVIDENCE = NO CLAIM
 * Semantic similarity != proof.
 * Broader knowledge != specific implementation.
 * 
 * Strict non-equivalence rules enforced programmatically:
 * - Python ≠ FastAPI ≠ Flask ≠ Django
 * - REST API ≠ FastAPI ≠ Flask
 * - JavaScript ≠ React ≠ Node.js ≠ Next.js
 * - AI/ML ≠ Generative AI ≠ LLM ≠ GPT API
 * - Machine Learning ≠ Deep Learning
 * - AWS ≠ AWS Lambda ≠ EC2 ≠ S3
 * - SQL ≠ PostgreSQL ≠ MySQL ≠ MongoDB
 * - GitHub ≠ GitHub Actions
 * - HTML/CSS ≠ React
 * - Docker ≠ Kubernetes
 * - API integration ≠ OpenAI API
 * - "AI project" ≠ "LLM project"
 * - "AI/ML degree" ≠ "Generative AI implementation"
 * - "Familiar with LLMs" ≠ "Built an LLM application"
 * - "Currently pursuing" ≠ "Graduated"
 * - Skill listed ≠ Skill demonstrated
 * - Project listed ≠ Project implemented
 * - Project implemented ≠ Project independently verified
 * - Repository exists ≠ Candidate authored the entire repository
 * - Deployment URL exists ≠ Production-grade deployment
 * - README says technology X ≠ technology X actually implemented
 */

export interface NonEquivalenceRule {
  target: string;
  forbiddenBroaderOrPeers: string[];
  explanation: string;
}

export const HARD_NON_EQUIVALENCE_RULES: NonEquivalenceRule[] = [
  {
    target: "fastapi",
    forbiddenBroaderOrPeers: ["python", "flask", "django", "rest api", "restful api", "api", "backend", "web development"],
    explanation: "Python, Flask, Django, or generic REST API experience does NOT prove FastAPI implementation.",
  },
  {
    target: "flask",
    forbiddenBroaderOrPeers: ["python", "fastapi", "django", "rest api", "backend"],
    explanation: "Python, FastAPI, Django, or generic REST API experience does NOT prove Flask implementation.",
  },
  {
    target: "django",
    forbiddenBroaderOrPeers: ["python", "flask", "fastapi", "backend"],
    explanation: "Python or other web frameworks do NOT prove Django implementation.",
  },
  {
    target: "react",
    forbiddenBroaderOrPeers: ["javascript", "js", "html", "css", "html/css", "frontend", "web design"],
    explanation: "HTML, CSS, or vanilla JavaScript do NOT prove React component or state architecture.",
  },
  {
    target: "nextjs",
    forbiddenBroaderOrPeers: ["react", "javascript", "node", "nodejs"],
    explanation: "React or JavaScript alone do NOT prove Next.js App Router / SSR implementation.",
  },
  {
    target: "nodejs",
    forbiddenBroaderOrPeers: ["javascript", "frontend"],
    explanation: "Frontend JavaScript does NOT prove Node.js runtime or backend architecture.",
  },
  {
    target: "deep_learning",
    forbiddenBroaderOrPeers: ["machine_learning", "ml", "data_science", "ai", "artificial intelligence", "statistics"],
    explanation: "General Machine Learning or Data Science coursework does NOT prove Deep Learning or Neural Network implementation.",
  },
  {
    target: "generative_ai",
    forbiddenBroaderOrPeers: [
      "machine_learning",
      "ml",
      "ai",
      "deep_learning",
      "python",
      "data science",
      "b.tech ai",
      "b.tech ai & ml",
      "ai/ml degree",
      "familiarity with generative ai",
    ],
    explanation: "An AI/ML degree, general Machine Learning, or passive familiarity does NOT prove Generative AI or LLM application engineering.",
  },
  {
    target: "llm",
    forbiddenBroaderOrPeers: [
      "machine_learning",
      "ml",
      "ai",
      "deep_learning",
      "python",
      "ai project",
      "b.tech ai",
      "b.tech ai & ml",
      "ai/ml degree",
    ],
    explanation: "An AI/ML degree or generic 'AI project' does NOT prove LLM implementation (RAG, agent loops, prompt engineering).",
  },
  {
    target: "aws",
    forbiddenBroaderOrPeers: [
      "rest api",
      "restful api",
      "rest apis",
      "python",
      "fastapi",
      "docker",
      "cloud",
      "cloud computing",
      "generative ai",
      "langchain",
      "openai api",
      "deployment",
      "deployed",
      "deployed rest api",
    ],
    explanation: "REST APIs, Python, FastAPI, Docker, LangChain, or generic deployment/cloud do NOT establish AWS platform experience.",
  },
  {
    target: "git",
    forbiddenBroaderOrPeers: ["github.com", "gitlab.com", "bitbucket.org", "profile link", "portfolio"],
    explanation: "A GitHub URL or profile link does NOT automatically prove Git, Version Control, or Git workflow without explicit text evidence.",
  },
  {
    target: "git_version_control",
    forbiddenBroaderOrPeers: ["github.com", "gitlab.com", "bitbucket.org", "profile link", "portfolio"],
    explanation: "A GitHub URL or profile link does NOT automatically prove Git & Version Control.",
  },
  {
    target: "gcp",
    forbiddenBroaderOrPeers: ["rest api", "python", "cloud", "aws", "azure", "deployment"],
    explanation: "Generic REST API, Python, or cloud mentions do NOT prove Google Cloud Platform experience.",
  },
  {
    target: "azure",
    forbiddenBroaderOrPeers: ["rest api", "python", "cloud", "aws", "gcp", "openai api", "deployment"],
    explanation: "Generic REST API or cloud mentions do NOT prove Microsoft Azure experience.",
  },
  {
    target: "cloud",
    forbiddenBroaderOrPeers: ["python", "generative ai", "rest api"],
    explanation: "Python, Generative AI, or REST APIs do NOT establish Cloud computing experience.",
  },
  {
    target: "aws_lambda",
    forbiddenBroaderOrPeers: ["aws", "cloud", "cloud computing"],
    explanation: "General AWS or cloud familiarity does NOT prove serverless AWS Lambda implementation.",
  },
  {
    target: "ec2",
    forbiddenBroaderOrPeers: ["aws", "cloud", "cloud computing"],
    explanation: "General AWS familiarity does NOT prove EC2 server administration or provisioning.",
  },
  {
    target: "s3",
    forbiddenBroaderOrPeers: ["aws", "cloud"],
    explanation: "General AWS familiarity does NOT prove S3 storage bucket configuration.",
  },
  {
    target: "postgresql",
    forbiddenBroaderOrPeers: ["sql", "mysql", "mongodb", "database", "rdbms", "python"],
    explanation: "General SQL, MySQL, MongoDB, or Python experience does NOT prove PostgreSQL-specific dialect, indexing, or administration.",
  },
  {
    target: "mysql",
    forbiddenBroaderOrPeers: ["sql", "postgresql", "mongodb", "database"],
    explanation: "General SQL or PostgreSQL does NOT prove MySQL implementation.",
  },
  {
    target: "mongodb",
    forbiddenBroaderOrPeers: ["sql", "database", "rdbms", "postgresql", "mysql"],
    explanation: "Relational SQL does NOT prove MongoDB document modeling.",
  },
  {
    target: "github_actions",
    forbiddenBroaderOrPeers: ["git", "github", "gitlab", "version control"],
    explanation: "Using Git or GitHub for version control does NOT prove CI/CD pipeline automation via GitHub Actions.",
  },
  {
    target: "kubernetes",
    forbiddenBroaderOrPeers: ["docker", "containerization", "linux"],
    explanation: "Docker containerization does NOT prove Kubernetes cluster orchestration, Pods, or Helm deployments.",
  },
  {
    target: "openai_api",
    forbiddenBroaderOrPeers: ["api", "rest api", "api integration"],
    explanation: "General REST API integration does NOT prove OpenAI / LLM API integration.",
  },
];

/**
 * Normalizes text to canonical token for comparison.
 */
export function normalizeToken(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/[#]/g, "sharp")
    .replace(/[+]/g, "p")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Checks if candidate evidence strictly violates a non-equivalence boundary.
 */
export function checkNonEquivalenceViolation(
  requirement: string,
  candidateText: string
): { isViolated: boolean; rule?: NonEquivalenceRule; explanation?: string } {
  const normReq = normalizeToken(requirement);
  const lowerCand = candidateText.toLowerCase();

  for (const rule of HARD_NON_EQUIVALENCE_RULES) {
    if (rule.target === normReq || normReq.includes(rule.target)) {
      // Check if candidateText only mentions forbidden broader/peer terms without mentioning the target
      const targetRegex = new RegExp(`\\b${rule.target.replace(/_/g, "[\\s_-]?")}\\b`, "i");
      const hasTarget = targetRegex.test(lowerCand);

      if (!hasTarget) {
        for (const forbidden of rule.forbiddenBroaderOrPeers) {
          const forbiddenRegex = new RegExp(`\\b${forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
          if (forbiddenRegex.test(lowerCand)) {
            return {
              isViolated: true,
              rule,
              explanation: `${rule.explanation} (Observed: "${forbidden}" in candidate text; target: "${requirement}").`,
            };
          }
        }
      }
    }
  }

  return { isViolated: false };
}

/**
 * Non-equivalence checks for education status:
 * "Currently pursuing" ≠ "Graduated"
 */
export function detectEducationStatus(text: string): "CURRENTLY_PURSUING" | "GRADUATED" | "UNKNOWN" {
  const lower = text.toLowerCase();
  const pursuingPatterns = [
    /\bcurrently pursuing\b/i,
    /\bpursuing\b/i,
    /\benrolled\b/i,
    /\bexpected\b/i,
    /\bcandidate for\b/i,
    /\bundergraduate\b/i,
    /\bpresent\b/i,
  ];
  const graduatedPatterns = [
    /\bgraduated\b/i,
    /\bcompleted\b/i,
    /\bdegree awarded\b/i,
    /\balumnus\b/i,
    /\balumna\b/i,
  ];

  for (const p of pursuingPatterns) {
    if (p.test(lower)) return "CURRENTLY_PURSUING";
  }
  for (const g of graduatedPatterns) {
    if (g.test(lower)) return "GRADUATED";
  }

  return "UNKNOWN";
}

/**
 * Checks whether a candidate technology is non-equivalent to a target requirement.
 */
export function isNonEquivalent(requirement: string, candidateTech: string): boolean {
  return checkNonEquivalenceViolation(requirement, candidateTech).isViolated;
}

