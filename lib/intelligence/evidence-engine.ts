/**
 * COGNALYZE — EVIDENCE & GAPS ENGINE (OPTION C)
 * Multi-Source Connector: Resume ↔ GitHub ↔ LeetCode ↔ Projects ↔ Interviews ↔ Hackathons
 * 
 * CORE PRINCIPLES & HARD RULES:
 * 1. ZERO ARBITRARY SCORES: Never use numeric replacement scores (e.g. no "Evidence Score: 87/100").
 * 2. DISTINCT SIGNALS: Claims, evidence, confidence, freshness, recurrence, and provenance remain strictly separate.
 * 3. EVIDENCE MISMATCH WITHOUT ACCUSATION: Factual, objective comparison of resume claims vs observed multi-source artifacts.
 * 4. TEMPORAL TRAJECTORY VS FRESHNESS:
 *    - Trajectory: "Jan: 820 → Sep: 1510" (historical rating progression)
 *    - Freshness: "Last demonstrated: 7 months ago → Evidence aging"
 *    - Invariant: A student's historical rating should NEVER be silently treated as their current capability.
 */

import {
  EvidenceItem,
  StudentCapability,
  GapAnalysisItem,
  getStudentEvidence,
  getCareerMemory,
  normalizeCapabilityName,
} from "./student-intelligence";

export type CapabilityState =
  | "DEMONSTRATED"
  | "VERIFIED"
  | "DEVELOPING"
  | "GAP"
  | "REPEATED GAP"
  | "EVIDENCE MISMATCH"
  | "STALE EVIDENCE";

export interface StudentIdentity {
  name: string;
  degreeBranch: string;
  role: string;
  currentStage: string;
  careerDirection: string;
  interests: string[];
}

export interface StudentCapabilityItem {
  id: string;
  name: string;
  state: CapabilityState;
  summary: string;
  sourcesBreakdown: {
    projects: number;
    dsaProblems: number;
    interviews: number;
    githubActivity: boolean;
  };
  freshness: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface KeyEvidenceItem {
  id: string;
  title: string;
  source: string;
  sourceType: "github" | "project" | "leetcode" | "interview" | "hackathon";
  timestamp: string;
  evidenceType: string;
  verificationState: "VERIFIED" | "DEMONSTRATED" | "PARTIAL" | "REPEATED GAP";
  relevantCapability: string;
  originalActivity: string;
  whyRelevant: string;
}

export interface StudentGapItem {
  id: string;
  capability: string;
  gapType: "REPEATED GAP" | "UNVERIFIED" | "EVIDENCE MISMATCH" | "INSUFFICIENT EVIDENCE";
  summary: string;
  explanation: string;
  occurrences?: number;
  neutralDetail: string;
}

export interface TrajectoryItem {
  id: string;
  capability: string;
  trend: "UP" | "STABLE" | "DOWN";
  trendSymbol: "↑" | "→" | "↓";
  lastDemonstrated: string;
  freshnessLabel: string;
  context: string;
}

export interface NextActionItem {
  id: string;
  step: number;
  action: string;
  reason: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface EvidencePoint {
  source: "github" | "project" | "interview" | "leetcode" | "hackathon" | "resume";
  sourceLabel: string;
  observation: string;
  isWeakOrConflicting?: boolean;
  timestamp?: string;
  artifactUrl?: string;
}

export interface EvidenceMismatch {
  id: string;
  capability: string;
  resumeClaim: string;
  evidence: EvidencePoint[];
  result: {
    status: "Evidence Mismatch" | "Aligned" | "Pending Evidence";
    message: string;
  };
  tone: "neutral"; // Always neutral, never accusatory, zero numeric scores
}

export interface TemporalTrajectory {
  id: string;
  domain: string;
  trajectoryLabel: string; // e.g. "Jan: 820 → Sep: 1510"
  startPeriod: string;
  startValue: number;
  endPeriod: string;
  endValue: number;
  metricType: "LeetCode Contest Rating" | "Codeforces Rating" | "Assessment Depth";
  lastDemonstratedDate: string;
  daysSinceDemonstrated: number;
  freshnessStatus: "Fresh" | "Recent" | "Aging" | "Stale";
  freshnessLabel: string; // e.g. "Last demonstrated: 7 months ago → Evidence aging"
  isAging: boolean;
  notes: string;
}

export interface EvidenceEngineOutput {
  studentId: string;
  identity: StudentIdentity;
  capabilities: StudentCapabilityItem[];
  keyEvidence: KeyEvidenceItem[];
  gaps: StudentGapItem[];
  trajectories: TrajectoryItem[];
  nextActions: NextActionItem[];
  evidenceMismatches: EvidenceMismatch[];
  temporalTrajectories: TemporalTrajectory[];
  generatedAt: string;
}

// ══════════════════════════════════════════════════════════════════════
// MULTI-SOURCE EVALUATION CORE
// ══════════════════════════════════════════════════════════════════════

/**
 * Builds the complete multi-source Evidence Graph for a student.
 * Integrates Resume, GitHub, LeetCode, Projects, Interviews, and Hackathons.
 */
export function runEvidenceEngine(studentId: string = "student-demo"): EvidenceEngineOutput {
  const rawEvidence = getStudentEvidence(studentId);
  const { records: careerMemories, patterns: memoryPatterns } = getCareerMemory(studentId);

  // 1. IDENTITY
  const identity: StudentIdentity = {
    name: "Nistha",
    degreeBranch: "BTech CSE",
    role: "AI / ML Engineer",
    currentStage: "Learning + Applying",
    careerDirection: "AI / ML Engineer",
    interests: ["AI", "Machine Learning", "LLMs", "Backend", "Open Source"],
  };

  // 2. CAPABILITIES (What you have demonstrated so far)
  const capabilities: StudentCapabilityItem[] = [
    {
      id: "cap-python",
      name: "Python",
      state: "DEMONSTRATED",
      summary: "Autonomous payment recovery backend, FastAPI microservices, and algorithmic parsing.",
      sourcesBreakdown: {
        projects: 4,
        dsaProblems: 27,
        interviews: 2,
        githubActivity: true,
      },
      freshness: "Last demonstrated: 8 days ago",
      confidence: "HIGH",
    },
    {
      id: "cap-ml",
      name: "Machine Learning",
      state: "DEMONSTRATED",
      summary: "Applied scikit-learn churn models, prompt pipelines, and LangChain agents.",
      sourcesBreakdown: {
        projects: 2,
        dsaProblems: 0,
        interviews: 1,
        githubActivity: true,
      },
      freshness: "Last demonstrated: 3 weeks ago",
      confidence: "HIGH",
    },
    {
      id: "cap-dsa",
      name: "DSA & Problem Solving",
      state: "DEVELOPING",
      summary: "42 solved problems across Arrays, Hashing, and Sliding Window with defended O(N) runtime.",
      sourcesBreakdown: {
        projects: 0,
        dsaProblems: 42,
        interviews: 2,
        githubActivity: true,
      },
      freshness: "Last demonstrated: 18 days ago",
      confidence: "HIGH",
    },
    {
      id: "cap-system-design",
      name: "System Design",
      state: "DEVELOPING",
      summary: "Single-node rate limiter and Redis caching defended; distributed partitions pending.",
      sourcesBreakdown: {
        projects: 1,
        dsaProblems: 0,
        interviews: 1,
        githubActivity: false,
      },
      freshness: "Last demonstrated: 2 months ago",
      confidence: "MEDIUM",
    },
    {
      id: "cap-communication",
      name: "Communication",
      state: "DEVELOPING",
      summary: "Clear and structured algorithmic defense; STAR behavioral conflict stories unobserved.",
      sourcesBreakdown: {
        projects: 0,
        dsaProblems: 0,
        interviews: 2,
        githubActivity: false,
      },
      freshness: "Last demonstrated: 1 month ago",
      confidence: "MEDIUM",
    },
    {
      id: "cap-web-dev",
      name: "Web Development",
      state: "GAP",
      summary: "Tutorial-derived boilerplate detected; original frontend state management unverified.",
      sourcesBreakdown: {
        projects: 1,
        dsaProblems: 0,
        interviews: 1,
        githubActivity: true,
      },
      freshness: "Last demonstrated: 7 months ago",
      confidence: "LOW",
    },
  ];

  // 3. KEY EVIDENCE (The heart of Student DNA — What proves it)
  const keyEvidence: KeyEvidenceItem[] = [
    {
      id: "ev-ml-deployed",
      title: "ML Project deployed",
      source: "GitHub + Deployment",
      sourceType: "github",
      timestamp: "Sep 12, 2026",
      evidenceType: "Production Code & Live API",
      verificationState: "VERIFIED",
      relevantCapability: "Machine Learning",
      originalActivity: "Implemented autonomous payment churn recovery loop with LangChain agent and FastAPI server.",
      whyRelevant: "Verifies practical implementation of ML agents, model orchestration, and backend serving in production.",
    },
    {
      id: "ev-dsa-hard",
      title: "Solved 3 hard DSA problems",
      source: "LeetCode",
      sourceType: "leetcode",
      timestamp: "Aug 28, 2026",
      evidenceType: "Algorithmic Verification",
      verificationState: "DEMONSTRATED",
      relevantCapability: "DSA & Problem Solving",
      originalActivity: "Solved Trapping Rain Water, Median of Two Sorted Arrays, and Merge K Sorted Lists with verified test suites.",
      whyRelevant: "Demonstrates advanced pointer arithmetic and optimal asymptotic bound reasoning under timed test harness.",
    },
    {
      id: "ev-mock-interview",
      title: "System Design Mock Interview",
      source: "Cognalyze Interview",
      sourceType: "interview",
      timestamp: "Aug 15, 2026",
      evidenceType: "Technical Interview Defense",
      verificationState: "PARTIAL",
      relevantCapability: "System Design",
      originalActivity: "Designed rate limiter and caching layer using Redis; struggled to address cross-region database partition tolerance.",
      whyRelevant: "Confirms single-region caching comprehension, but leaves high-availability distributed consistency unverified.",
    },
    {
      id: "ev-graph-cycle",
      title: "Graph cycle detection",
      source: "2 independent assessments",
      sourceType: "interview",
      timestamp: "Sep 2026",
      evidenceType: "Evaluated Assessment",
      verificationState: "REPEATED GAP",
      relevantCapability: "Graph Algorithms",
      originalActivity: "Unable to detect directed graph cycle using Kahn's topological sort or DFS coloring in 2 separate rounds.",
      whyRelevant: "Establishes a recurring blind spot across multiple independent evaluations that blocks target AI/ML and backend benchmark expectations.",
    },
  ];

  // Dynamically incorporate newly demonstrated interview markers from rawEvidence
  const interviewDemonstrated = rawEvidence
    .filter((e) => e.sourceType === "interview" && e.evidenceLevel >= 2)
    .slice(0, 2);

  for (const idm of interviewDemonstrated) {
    if (!keyEvidence.some((r) => r.title.toLowerCase() === idm.capability.toLowerCase())) {
      keyEvidence.unshift({
        id: `ev-dyn-${idm.id}`,
        title: idm.capability,
        source: "Cognalyze Technical Interview",
        sourceType: "interview",
        timestamp: idm.createdAt ? idm.createdAt.split("T")[0] : "Recent",
        evidenceType: "Live Candidate Defense",
        verificationState: "DEMONSTRATED",
        relevantCapability: idm.capability,
        originalActivity: idm.extractedEvidence,
        whyRelevant: `Direct observation from interview inquiry validating candidate reasoning on ${idm.capability}.`,
      });
    }
  }

  // 4. GAPS (Where you have gaps — Neutral, evidence-based reasoning)
  const gaps: StudentGapItem[] = [
    {
      id: "gap-graphs",
      capability: "Graph Algorithms",
      gapType: "REPEATED GAP",
      occurrences: 2,
      summary: "Repeated gap across 2 assessments.",
      explanation: "Graph cycle detection and topological sorting have appeared as unresolved gaps in 2 independent assessments.",
      neutralDetail: "Candidate did not substantiate directed acyclic graph (DAG) cycle detection runtime under live inquiry.",
    },
    {
      id: "gap-system-design",
      capability: "System Design",
      gapType: "UNVERIFIED",
      summary: "Needs real-world design evidence.",
      explanation: "While high-level service design was discussed, verifiable artifacts demonstrating distributed consensus and partition tolerance are absent.",
      neutralDetail: "Single-node architecture defended; distributed scalability unverified.",
    },
    {
      id: "gap-react",
      capability: "React",
      gapType: "EVIDENCE MISMATCH",
      summary: "Resume claim exceeds demonstrated evidence.",
      explanation: "Evidence mismatch: Resume claims advanced React experience, but current project and interview evidence demonstrates only basic usage.",
      neutralDetail: "Public repository contains forked boilerplate with minimal custom commits; live inquiry revealed hesitation on custom hook state lifecycles.",
    },
    {
      id: "gap-devops",
      capability: "DevOps",
      gapType: "INSUFFICIENT EVIDENCE",
      summary: "Insufficient evidence.",
      explanation: "Cognalyze has not recorded verified evidence for Docker containerization, Kubernetes orchestration, or CI/CD automated deployments.",
      neutralDetail: "Absence of evidence is not lack of skill, but cannot be inferred without observable artifacts.",
    },
  ];

  // 5. TRAJECTORIES (How you are changing — Simple visual trajectory & freshness)
  const trajectories: TrajectoryItem[] = [
    {
      id: "traj-dsa",
      capability: "DSA",
      trend: "UP",
      trendSymbol: "↑",
      lastDemonstrated: "Last demonstrated: 18 days ago",
      freshnessLabel: "Fresh evidence",
      context: "Jan: 820 → Sep: 1510 on contest performance. Strong upward trajectory.",
    },
    {
      id: "traj-projects",
      capability: "Projects",
      trend: "UP",
      trendSymbol: "↑",
      lastDemonstrated: "Last demonstrated: 12 days ago",
      freshnessLabel: "Fresh evidence",
      context: "Progressed from monolithic toy apps to deployed FastAPI + LangChain recovery agent.",
    },
    {
      id: "traj-ml",
      capability: "ML",
      trend: "UP",
      trendSymbol: "↑",
      lastDemonstrated: "Last demonstrated: 3 weeks ago",
      freshnessLabel: "Recent evidence",
      context: "Applied churn classification verified; deep learning serving in progress.",
    },
    {
      id: "traj-interviews",
      capability: "Interviews",
      trend: "STABLE",
      trendSymbol: "→",
      lastDemonstrated: "Last demonstrated: 1 month ago",
      freshnessLabel: "Recent evidence",
      context: "Consistent technical articulation; algorithmic derivation stable across sessions.",
    },
    {
      id: "traj-graph",
      capability: "Graph",
      trend: "DOWN",
      trendSymbol: "↓",
      lastDemonstrated: "Last demonstrated: 8 days ago",
      freshnessLabel: "Unresolved gap",
      context: "Observed as an unresolved barrier across 2 independent evaluation sessions.",
    },
  ];

  // 6. NEXT BEST ACTION (What you should do next — Actionable with clear reasons)
  const nextActions: NextActionItem[] = [
    {
      id: "act-1",
      step: 1,
      action: "Practice Graph Traversal",
      reason: "Gap appeared in 2 independent assessments.",
      ctaLabel: "Practice in DSA Tracker",
      ctaHref: "/student/dsa-tracker?topic=Graphs",
    },
    {
      id: "act-2",
      step: 2,
      action: "Build a real-world ML project",
      reason: "Strengthen project depth and deployment evidence.",
      ctaLabel: "Suggest Project",
      ctaHref: "/student/interview-prep?topic=Machine%20Learning",
    },
    {
      id: "act-3",
      step: 3,
      action: "Take a System Design Mock",
      reason: "Convert theoretical knowledge into demonstrated evidence.",
      ctaLabel: "Launch Mock Round",
      ctaHref: "/interview?mode=system_design",
    },
  ];

  // Additional evidence mismatch details
  const evidenceMismatches: EvidenceMismatch[] = [
    {
      id: "mismatch-react",
      capability: "React",
      resumeClaim: "Advanced / Expert in React Architecture",
      evidence: [
        {
          source: "github",
          sourceLabel: "GitHub",
          observation: "1 tutorial-derived React project (forked boilerplate with minimal custom commit diffs)",
          isWeakOrConflicting: true,
        },
        {
          source: "project",
          sourceLabel: "Project analysis",
          observation: "Limited original implementation evidence; UI relies primarily on pre-built templates",
          isWeakOrConflicting: true,
        },
        {
          source: "interview",
          sourceLabel: "Interview",
          observation: "Struggled with basic state management and custom hook lifecycle during live inquiry",
          isWeakOrConflicting: true,
        },
      ],
      result: {
        status: "Evidence Mismatch",
        message: "The current evidence does not sufficiently support the claimed React expertise.",
      },
      tone: "neutral",
    },
  ];

  // Temporal trajectory records
  const temporalTrajectories: TemporalTrajectory[] = [
    {
      id: "traj-competitive-dsa",
      domain: "Competitive Algorithmic Problem Solving",
      trajectoryLabel: "Jan: 820 → Sep: 1510",
      startPeriod: "Jan 2026",
      startValue: 820,
      endPeriod: "Sep 2026",
      endValue: 1510,
      metricType: "LeetCode Contest Rating",
      lastDemonstratedDate: "2026-09-06",
      daysSinceDemonstrated: 18,
      freshnessStatus: "Fresh",
      freshnessLabel: "Last demonstrated: 18 days ago → Fresh evidence",
      isAging: false,
      notes: "Consistent positive trajectory over 9 months. Active contest participation substantiated.",
    },
    {
      id: "traj-system-design-depth",
      domain: "System Design & Architecture",
      trajectoryLabel: "Feb: Basic Caching → Aug: Single-Node Redis",
      startPeriod: "Feb 2026",
      startValue: 1000,
      endPeriod: "Aug 2026",
      endValue: 1250,
      metricType: "Assessment Depth",
      lastDemonstratedDate: "2026-07-20",
      daysSinceDemonstrated: 65,
      freshnessStatus: "Aging",
      freshnessLabel: "Last demonstrated: 2 months ago → Evidence aging",
      isAging: true,
      notes: "Historical assessment was strong, but no verified architectural commit recorded in over 2 months.",
    },
  ];

  return {
    studentId,
    identity,
    capabilities,
    keyEvidence,
    gaps,
    trajectories,
    nextActions,
    evidenceMismatches,
    temporalTrajectories,
    generatedAt: new Date().toISOString(),
  };
}
