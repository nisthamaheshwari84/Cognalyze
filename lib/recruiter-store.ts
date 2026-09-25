/**
 * UNIFIED RECRUITER STORE (Phases 0, 1, 2, 3, 10, 11, 12)
 * 
 * Provides unified state management across the entire Recruiter workflow:
 *   - Phase 0: Open Positions, Candidate Pool, Action Queue
 *   - Phase 1: Role DNA repository
 *   - Phase 2: Multi-channel candidate intake (Bulk Upload + Student Applications synchronization)
 *   - Phase 3: Multi-source candidate intelligence dossier (Resume, GitHub, ethical LinkedIn/LeetCode links, Cognalyze Student projects, Hackathons, Assessments)
 *   - Phase 7/9/10: Work sample sessions, Hold loopback, and Conflict resolution
 *   - Phase 10/11: Decision Room journal & Talent Recovery routing
 *   - Phase 12: 30/60/90 Quality-of-Hire outcome records
 */

import { RoleDNA, createDefaultRoleDNA } from "./ai/role-dna";
import { CandidateDNA, buildEvidenceGraph } from "./ai/evidence-graph";
import { computeRoleCandidateMatch, generateMinimumProofPlan, MatchEngineResult, MinimumProofPlan } from "./ai/minimum-proof";
import { WorkSampleMiniTask, WorkSampleEvaluationResult } from "./ai/work-sample";
import { CandidateInterviewHistory } from "./ai/interview-memory";
import { DetectedConflict } from "./ai/conflict-detector";
import { HireOutcomeRecord } from "./ai/quality-of-hire";
import { getApplicationsStore } from "./placement-store";
import { CandidateScreeningDossier, RecruiterCorrection } from "./screening/candidate-screening-engine";

export interface MultiSourceCandidateProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  appliedRoleId: string;
  appliedRoleTitle: string;
  sourceType: "bulk_upload" | "student_application" | "talent_recovery";
  appliedAt: string;
  
  // Phase 3 Multi-Source Signals
  resumeText: string;
  githubData?: {
    handle: string;
    profileUrl: string;
    verifiedReposCount: number;
    repos: { name: string; description: string; languages: string[]; url: string }[];
  };
  linkedInUrl?: string; // Stored as ethical candidate-provided reference link (no scraping)
  leetCodeProfile?: {
    username: string;
    profileUrl: string;
    problemsSolved: number;
    rankingBadge: string;
  };
  hackathonRecords?: string[];
  studentProjects?: { title: string; tech: string[]; description: string }[];
  certifications?: string[];
  priorCognalyzeInterviewHistory?: {
    roleEvaluatedFor: string;
    score: number;
    feedback: string;
    completedAt: string;
  }[];

  // Pipeline Execution State
  currentStage: "Applied" | "Evidence Graph Built" | "Work Sample Pending" | "Work Sample Evaluated" | "Interviewing" | "Conflict Review" | "In Decision Room" | "Hired" | "Hold - Gathering Evidence" | "Rejected" | "Talent Recovered";
  activeWorkSample?: WorkSampleMiniTask;
  workSampleResults?: Record<string, { passed: boolean; score: number; output: string }>;
  interviewHistory?: CandidateInterviewHistory;
  activeConflicts?: DetectedConflict[];
  decisionJournal?: {
    verdict: "Hire" | "Hold" | "Reject";
    decidedAt: string;
    rationale: string;
    holdLoopCount: number;
    recoveredRoleId?: string;
    citedEvidenceIds?: string[];
  };

  // Feature 2 Evidence-Grounded Screening Dossier
  screeningDossier?: CandidateScreeningDossier;
  recruiterCorrections?: RecruiterCorrection[];
}


export interface RecruiterActionItem {
  id: string;
  type: "evaluate_work_sample" | "resolve_conflict" | "decision_room_ready" | "milestone_checkin";
  title: string;
  candidateId: string;
  candidateName: string;
  roleId: string;
  roleTitle: string;
  urgency: "Immediate" | "High" | "Normal";
  dueText: string;
  actionUrl: string;
}

// ─────────────────────────────────────────────────────────────
// In-Memory Seed State
// ─────────────────────────────────────────────────────────────

const initialRoles: RoleDNA[] = [
  createDefaultRoleDNA("Senior Distributed Backend Engineer", "Core Infrastructure"),
  {
    ...createDefaultRoleDNA("Generative AI & ML Platform Architect", "AI Research"),
    id: "role-ml-platform",
    title: "Generative AI & ML Platform Architect",
    department: "AI Research",
    seniority: "Staff",
    tieredRequirements: [
      {
        id: "req-ml-1",
        name: "LLM Inference Acceleration & KV-Caching",
        tier: "Critical",
        category: "Technical",
        description: "vLLM, TensorRT-LLM, PagedAttention, speculative decoding, and quantization (FP8/AWQ)",
        weightPct: 35,
        verificationMethod: "work_sample",
        dealBreakerIfMissing: true,
        acceptableProofTypes: ["production_code", "live_work_sample"]
      },
      {
        id: "req-ml-2",
        name: "Distributed Training & Pipeline Parallelism",
        tier: "Critical",
        category: "System Design",
        description: "PyTorch FSDP, DeepSpeed ZeRO-3, NCCL collective communication, and GPU cluster topologies",
        weightPct: 30,
        verificationMethod: "code_execution",
        dealBreakerIfMissing: true,
        acceptableProofTypes: ["production_code", "github_commit"]
      },
      {
        id: "req-ml-3",
        name: "Agentic Tool Use & Guardrail Reliability",
        tier: "Important",
        category: "Technical",
        description: "Function calling schemas, structured outputs, semantic caching, and latency optimization",
        weightPct: 20,
        verificationMethod: "targeted_interview",
        dealBreakerIfMissing: false,
        acceptableProofTypes: ["production_code", "verified_interview"]
      },
      {
        id: "req-ml-4",
        name: "Research Paper Velocity & Prototyping",
        tier: "Preferred",
        category: "Leadership",
        description: "Ability to ingest new NeurIPS/ICLR papers and implement proof-of-concept architectures within 48h",
        weightPct: 10,
        verificationMethod: "portfolio_audit",
        dealBreakerIfMissing: false,
        acceptableProofTypes: ["github_commit"]
      },
      {
        id: "req-ml-5",
        name: "Kubernetes Kubeflow Orchestration",
        tier: "Trainable",
        category: "Technical",
        description: "Job scheduling and GPU node auto-scaling; can be acquired on the job",
        weightPct: 5,
        verificationMethod: "portfolio_audit",
        dealBreakerIfMissing: false,
        acceptableProofTypes: ["verified_interview"]
      }
    ]
  },
  {
    ...createDefaultRoleDNA("Fullstack Edge Systems Engineer", "Product Engineering"),
    id: "role-fullstack-edge",
    title: "Fullstack Edge Systems Engineer",
    department: "Product Engineering",
    seniority: "Mid-Level",
    targetHires: 3
  }
];

const initialCandidates: MultiSourceCandidateProfile[] = [
  {
    id: "cand-vikram",
    name: "Vikram Malhotra",
    email: "vikram.m@example.com",
    appliedRoleId: initialRoles[0].id,
    appliedRoleTitle: initialRoles[0].title,
    sourceType: "bulk_upload",
    appliedAt: "2026-09-12T08:30:00Z",
    resumeText: `Vikram Malhotra
Senior Backend Systems Engineer • 5 years experience
Expertise: Go, Java, Concurrency Primitives, Distributed Systems, Kafka, PostgreSQL MVCC.
Experience:
- Staff Engineer at PayFlow Global: Built event-driven transaction pipeline processing 8,000 TPS.
- Engineered transactional outbox with PostgreSQL and Kafka topic partition balancing.
- Resolved zero-downtime database failovers and lock contention issues under heavy concurrent load.
Skills: Go, Java, Kafka, PostgreSQL, Docker, Redis, Kubernetes, Distributed Tracing.`,
    githubData: {
      handle: "vikramm-dev",
      profileUrl: "https://github.com/vikramm-dev",
      verifiedReposCount: 14,
      repos: [
        {
          name: "raft-consensus-go",
          description: "Raft consensus implementation with leader election, log replication, and snapshotting in Go",
          languages: ["Go"],
          url: "https://github.com/vikramm-dev/raft-consensus-go"
        },
        {
          name: "kafka-idempotent-outbox",
          description: "Production-ready transactional outbox pattern using PostgreSQL LISTEN/NOTIFY and Kafka",
          languages: ["Go", "SQL"],
          url: "https://github.com/vikramm-dev/kafka-idempotent-outbox"
        }
      ]
    },
    linkedInUrl: "https://linkedin.com/in/vikram-malhotra-systems",
    leetCodeProfile: {
      username: "vikram_systems",
      profileUrl: "https://leetcode.com/vikram_systems",
      problemsSolved: 480,
      rankingBadge: "Guardian (Top 1.2%)"
    },
    hackathonRecords: ["Smart India Hackathon Finalist 2024 (Distributed Ledger)"],
    certifications: ["AWS Certified Solutions Architect", "Confluent Certified Developer for Apache Kafka"],
    currentStage: "In Decision Room"
  },
  {
    id: "cand-ananya",
    name: "Ananya Sharma",
    email: "ananya.s@example.com",
    appliedRoleId: "role-ml-platform",
    appliedRoleTitle: "Generative AI & ML Platform Architect",
    sourceType: "bulk_upload",
    appliedAt: "2026-09-13T10:15:00Z",
    resumeText: `Ananya Sharma
ML Platform Engineer • 4 years experience
Built distributed training pipelines and low-latency LLM serving infrastructure.
- Deployed vLLM with PagedAttention and continuous batching, reducing inference latency by 40%.
- Fine-tuned 70B parameter models using PyTorch FSDP and DeepSpeed ZeRO-3 across 64 H100 GPUs.
- Designed agentic tool execution loop with semantic caching in Redis.`,
    githubData: {
      handle: "ananyasharma-ai",
      profileUrl: "https://github.com/ananyasharma-ai",
      verifiedReposCount: 9,
      repos: [
        {
          name: "speculative-decoding-vllm",
          description: "Accelerated speculative decoding benchmark for LLaMA-3 models using draft networks",
          languages: ["Python", "C++", "CUDA"],
          url: "https://github.com/ananyasharma-ai/speculative-decoding-vllm"
        }
      ]
    },
    linkedInUrl: "https://linkedin.com/in/ananya-sharma-ml",
    hackathonRecords: ["Razorpay AI Buildathon 1st Runner Up (Agentic Core)"],
    certifications: ["DeepLearning.AI Generative AI Engineering"],
    currentStage: "Work Sample Evaluated",
    workSampleResults: {
      "req-ml-1": {
        passed: true,
        score: 94,
        output: "Implemented custom continuous batch scheduler with PagedAttention block allocation."
      }
    }
  },
  {
    id: "cand-student-nistha",
    name: "Nistha Maheshwari",
    email: "nistha@example.com",
    appliedRoleId: initialRoles[0].id,
    appliedRoleTitle: initialRoles[0].title,
    sourceType: "student_application", // Cross-system intake from Cognalyze Student Platform
    appliedAt: "2026-09-14T02:00:00Z",
    resumeText: `Nistha Maheshwari
Computer Science • Distributed Systems & AI Platforms
Active builder on Cognalyze Platform.
Projects:
- Automated Customer Churn & Recovery Bot (Agentic AI + Node.js + Razorpay).
- Distributed Edge Sensor Pipeline (Go, MQTT, PostgreSQL, Docker).
- High-Throughput Event Broker simulation with partition isolation.
Skills: Go, TypeScript, PostgreSQL, Docker, MQTT, Kafka primitives, Python.`,
    githubData: {
      handle: "nisthamaheshwari85",
      profileUrl: "https://github.com/nisthamaheshwari85",
      verifiedReposCount: 8,
      repos: [
        {
          name: "automated-recovery-bot",
          description: "Intelligent recovery bot for recurring payment failures using webhooks and predictive retry delays",
          languages: ["TypeScript", "Node.js"],
          url: "https://github.com/nisthamaheshwari85/automated-recovery-bot"
        },
        {
          name: "edge-sensor-pipeline",
          description: "Telemetry ingestion pipeline in Go with time-series indexing and anomaly alarms",
          languages: ["Go", "SQL"],
          url: "https://github.com/nisthamaheshwari85/edge-sensor-pipeline"
        }
      ]
    },
    linkedInUrl: "https://linkedin.com/in/nistha-maheshwari",
    leetCodeProfile: {
      username: "nistha85",
      profileUrl: "https://leetcode.com/nistha85",
      problemsSolved: 310,
      rankingBadge: "Knight (Top 4%)"
    },
    hackathonRecords: ["Flipkart GRiD 6.0 Participant", "Smart India Hackathon College Round Winner"],
    studentProjects: [
      {
        title: "Automated Recovery Pipeline",
        tech: ["TypeScript", "Node.js", "PostgreSQL"],
        description: "Autonomous payment recovery engine with exponential backoff and idempotency keys"
      },
      {
        title: "Distributed Edge Sensor Pipeline",
        tech: ["Go", "MQTT", "PostgreSQL", "Docker"],
        description: "Real-time telemetry collection and anomaly detection"
      }
    ],
    priorCognalyzeInterviewHistory: [
      {
        roleEvaluatedFor: "Backend Engineering Simulation",
        score: 88,
        feedback: "Clear architectural thinking regarding idempotency and database schema design.",
        completedAt: "2026-09-11T16:00:00Z"
      }
    ],
    currentStage: "Applied"
  }
];

import fs from "fs";
import path from "path";

const STORE_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(STORE_DIR, "recruiter-store.json");

// Global storage containers initialized with defaults
let rolesStore: RoleDNA[] = [...initialRoles];
let candidatesStore: MultiSourceCandidateProfile[] = [...initialCandidates];
let hireRecordsStore: HireOutcomeRecord[] = [];

function loadStoreFromDisk() {
  try {
    if (typeof window === "undefined" && fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.roles && Array.isArray(parsed.roles) && parsed.roles.length > 0) rolesStore = parsed.roles;
      if (parsed.candidates && Array.isArray(parsed.candidates) && parsed.candidates.length > 0) candidatesStore = parsed.candidates;
      if (parsed.hireRecords && Array.isArray(parsed.hireRecords) && parsed.hireRecords.length > 0) hireRecordsStore = parsed.hireRecords;
    }
  } catch (err) {
    console.error("Failed to load recruiter store from disk:", err);
  }
}

export function persistStoreToDisk() {
  try {
    if (typeof window === "undefined") {
      if (!fs.existsSync(STORE_DIR)) {
        fs.mkdirSync(STORE_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify({
        roles: rolesStore,
        candidates: candidatesStore,
        hireRecords: hireRecordsStore
      }, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Failed to persist recruiter store to disk:", err);
  }
}

loadStoreFromDisk();

// ─────────────────────────────────────────────────────────────
// STORE OPERATIONS
// ─────────────────────────────────────────────────────────────

export async function getAllRoles(): Promise<RoleDNA[]> {
  return rolesStore;
}

export async function getRoleById(id: string): Promise<RoleDNA | null> {
  return rolesStore.find(r => r.id === id) || null;
}

export async function saveRole(role: RoleDNA): Promise<RoleDNA> {
  const existingIdx = rolesStore.findIndex(r => r.id === role.id);
  if (existingIdx >= 0) {
    rolesStore[existingIdx] = { ...role, updatedAt: new Date().toISOString() };
  } else {
    rolesStore.unshift(role);
  }
  persistStoreToDisk();
  return role;
}

let studentAppsSynced = false;

export async function getAllCandidates(): Promise<MultiSourceCandidateProfile[]> {
  // Sync with Student-side applications from placement-store (Phase 2 connection)
  if (!studentAppsSynced) {
    studentAppsSynced = true;
    try {
      const timeoutPromise = new Promise<any[]>((res) => setTimeout(() => res([]), 500));
      const studentApps = await Promise.race([getApplicationsStore("student-demo"), timeoutPromise]);
      for (const app of studentApps) {
        const alreadyInPool = candidatesStore.some(c => c.id === `student-app-${app.id}`);
        if (!alreadyInPool && app.opportunity) {
        candidatesStore.push({
          id: `student-app-${app.id}`,
          name: "Demo Student (Cognalyze)",
          email: "student.demo@cognalyze.edu",
          appliedRoleId: rolesStore[0].id,
          appliedRoleTitle: app.opportunity.title || rolesStore[0].title,
          sourceType: "student_application",
          appliedAt: app.updated_at || new Date().toISOString(),
          resumeText: `Demo Student Applicant
3rd Year Computer Science student.
Skills: Go, TypeScript, Next.js, PostgreSQL, Docker, Distributed Systems.
Curated Projects:
- Autonomous Recovery Bot
- Edge Telemetry Ingestion Pipeline`,
          linkedInUrl: "https://linkedin.com/in/demo-student",
          hackathonRecords: [app.opportunity.title],
          currentStage: "Applied"
        });
        }
      }
    } catch {}
  }

  return candidatesStore;
}

export async function getCandidateById(id: string): Promise<MultiSourceCandidateProfile | null> {
  const pool = await getAllCandidates();
  return pool.find(c => c.id === id) || null;
}

export async function addCandidate(cand: MultiSourceCandidateProfile): Promise<MultiSourceCandidateProfile> {
  const existingIdx = candidatesStore.findIndex(c => c.id === cand.id);
  if (existingIdx >= 0) {
    candidatesStore[existingIdx] = { ...candidatesStore[existingIdx], ...cand };
  } else {
    candidatesStore.unshift(cand);
  }
  persistStoreToDisk();
  return cand;
}

export async function updateCandidateStage(
  id: string,
  stage: MultiSourceCandidateProfile["currentStage"],
  extraUpdates?: Partial<MultiSourceCandidateProfile>
): Promise<MultiSourceCandidateProfile | null> {
  const cand = candidatesStore.find(c => c.id === id);
  if (!cand) return null;
  cand.currentStage = stage;
  if (extraUpdates) {
    Object.assign(cand, extraUpdates);
  }
  persistStoreToDisk();
  return cand;
}

export async function saveCandidateDossier(
  candidateId: string,
  dossier: CandidateScreeningDossier
): Promise<MultiSourceCandidateProfile | null> {
  const cand = candidatesStore.find(c => c.id === candidateId);
  if (!cand) return null;
  cand.screeningDossier = dossier;
  persistStoreToDisk();
  return cand;
}

export async function addCandidateCorrection(
  candidateId: string,
  correction: RecruiterCorrection
): Promise<MultiSourceCandidateProfile | null> {
  const cand = candidatesStore.find(c => c.id === candidateId);
  if (!cand) return null;
  if (!cand.recruiterCorrections) {
    cand.recruiterCorrections = [];
  }
  cand.recruiterCorrections.push(correction);
  if (cand.screeningDossier) {
    const item = cand.screeningDossier.assessments.find(a => a.requirementId === correction.requirementId);
    if (item) {
      item.evidenceState = correction.correctedState;
      item.assessmentExplanation = `[Recruiter Correction]: Updated to ${correction.correctedState}. Reason: ${correction.reason}`;
    }
  }
  persistStoreToDisk();
  return cand;
}

export async function getRoleCandidateMetrics(roleId: string): Promise<{
  totalApplicants: number;
  analyzedCount: number;
  needsAttentionCount: number;
}> {
  const pool = await getAllCandidates();
  const roleCandidates = pool.filter(c => c.appliedRoleId === roleId);
  const totalApplicants = roleCandidates.length;
  const analyzedCount = roleCandidates.filter(c => !!c.screeningDossier).length;
  const needsAttentionCount = roleCandidates.filter(c => {
    if (!c.screeningDossier) return false;
    return (
      c.screeningDossier.coverageCounts.needsReviewCount > 0 ||
      c.screeningDossier.coverageCounts.conflictingCount > 0
    );
  }).length;
  return { totalApplicants, analyzedCount, needsAttentionCount };
}

export async function getActionQueue(): Promise<RecruiterActionItem[]> {
  const candidates = await getAllCandidates();
  const actions: RecruiterActionItem[] = [];

  for (const c of candidates) {
    if (c.currentStage === "Work Sample Evaluated") {
      actions.push({
        id: `act-eval-${c.id}`,
        type: "evaluate_work_sample",
        title: `Work Sample Completed by ${c.name} — Awaiting Review`,
        candidateId: c.id,
        candidateName: c.name,
        roleId: c.appliedRoleId,
        roleTitle: c.appliedRoleTitle,
        urgency: "High",
        dueText: "Submitted today",
        actionUrl: `/recruiter/decision-room?candidate=${c.id}&tab=work_sample`
      });
    } else if (c.currentStage === "Conflict Review") {
      actions.push({
        id: `act-conf-${c.id}`,
        type: "resolve_conflict",
        title: `Performance Conflict Detected for ${c.name} — Review Discrepancy`,
        candidateId: c.id,
        candidateName: c.name,
        roleId: c.appliedRoleId,
        roleTitle: c.appliedRoleTitle,
        urgency: "Immediate",
        dueText: "High divergence",
        actionUrl: `/recruiter/decision-room?candidate=${c.id}&tab=conflicts`
      });
    } else if (c.currentStage === "In Decision Room") {
      actions.push({
        id: `act-dec-${c.id}`,
        type: "decision_room_ready",
        title: `Final Decision Required: ${c.name}`,
        candidateId: c.id,
        candidateName: c.name,
        roleId: c.appliedRoleId,
        roleTitle: c.appliedRoleTitle,
        urgency: "Normal",
        dueText: "Ready for Committee",
        actionUrl: `/recruiter/decision-room?candidate=${c.id}`
      });
    } else if (c.currentStage === "Hold - Gathering Evidence") {
      actions.push({
        id: `act-hold-${c.id}`,
        type: "evaluate_work_sample",
        title: `Hold Loop: Additional Evidence Ingested for ${c.name}`,
        candidateId: c.id,
        candidateName: c.name,
        roleId: c.appliedRoleId,
        roleTitle: c.appliedRoleTitle,
        urgency: "Normal",
        dueText: "Hold cycle active",
        actionUrl: `/recruiter/decision-room?candidate=${c.id}&tab=work_sample`
      });
    }
  }

  // Add 30/60/90 check-in action
  actions.push({
    id: "act-checkin-rahul",
    type: "milestone_checkin",
    title: "90-Day Quality-of-Hire Review Due: Rahul Verma",
    candidateId: "cand-rahul",
    candidateName: "Rahul Verma",
    roleId: "role-senior-backend",
    roleTitle: "Senior Distributed Backend Engineer",
    urgency: "Normal",
    dueText: "Due in 3 days",
    actionUrl: "/recruiter/quality-of-hire"
  });

  return actions;
}

export async function getHireOutcomeRecords(): Promise<HireOutcomeRecord[]> {
  return hireRecordsStore;
}

export async function recordHireOutcome(outcome: HireOutcomeRecord): Promise<HireOutcomeRecord> {
  const idx = hireRecordsStore.findIndex(h => h.hireId === outcome.hireId);
  if (idx >= 0) {
    hireRecordsStore[idx] = outcome;
  } else {
    hireRecordsStore.push(outcome);
  }
  persistStoreToDisk();
  return outcome;
}
