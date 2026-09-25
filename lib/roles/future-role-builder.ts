/**
 * Future Role Builder Engine
 * Truth Contract T7, Phase 8
 * 
 * Starts from a concrete business problem / capability deficit and produces a draft requirement set
 * categorized into core, trainable, evaluated, and context that the recruiter/hiring manager edits.
 */

export interface ProposedFutureRequirement {
  id: string;
  text: string;
  category: "core" | "trainable" | "evaluated" | "context";
  rationale: string;
  suggestedValidationMethod: "work_sample" | "structured_interview" | "code_review" | "portfolio_check";
  isRecruiterApproved: boolean;
}

export interface FutureRoleDraft {
  draftId: string;
  proposedTitle: string;
  businessProblem: string;
  targetHires: number;
  department: string;
  requirements: ProposedFutureRequirement[];
  estimatedTimeToHireDays: number;
  createdAt: string;
}

/**
 * Generates a draft role and discrete requirement set from a business problem.
 */
export function generateRoleDraftFromProblem(params: {
  businessProblem: string;
  targetHires?: number;
  department?: string;
  suggestedTitle?: string;
}): FutureRoleDraft {
  const {
    businessProblem,
    targetHires = 1,
    department = "Core Engineering",
    suggestedTitle,
  } = params;

  const draftId = `draft_${Date.now()}`;
  const lower = businessProblem.toLowerCase();

  // Infer Title if not provided
  let proposedTitle = suggestedTitle || "Distributed Systems Engineer";
  if (lower.includes("security") || lower.includes("audit") || lower.includes("vulnerability")) {
    proposedTitle = suggestedTitle || "Infrastructure Security Engineer";
  } else if (lower.includes("ml") || lower.includes("inference") || lower.includes("llm") || lower.includes("vector")) {
    proposedTitle = suggestedTitle || "ML Platform Engineer";
  } else if (lower.includes("frontend") || lower.includes("ui") || lower.includes("react")) {
    proposedTitle = suggestedTitle || "Senior Frontend Systems Engineer";
  }

  const requirements: ProposedFutureRequirement[] = [];

  // Core capability 1: Primary architecture / language
  if (lower.includes("kafka") || lower.includes("stream") || lower.includes("throughput") || lower.includes("event")) {
    requirements.push({
      id: `req_core_1_${Date.now()}`,
      text: "Production experience designing event-driven architectures with Apache Kafka or Pulsar handling >= 50k msgs/sec",
      category: "core",
      rationale: "Directly solves the high-throughput message ingestion requirement stated in business challenge.",
      suggestedValidationMethod: "work_sample",
      isRecruiterApproved: true,
    });
  } else if (lower.includes("inference") || lower.includes("llm") || lower.includes("vector")) {
    requirements.push({
      id: `req_core_1_${Date.now()}`,
      text: "Experience deploying low-latency LLM serving engines (vLLM / TensorRT-LLM) and vector search indexing",
      category: "core",
      rationale: "Required for high-throughput model inferencing stated in the problem statement.",
      suggestedValidationMethod: "work_sample",
      isRecruiterApproved: true,
    });
  } else {
    requirements.push({
      id: `req_core_1_${Date.now()}`,
      text: "Deep production expertise in distributed backend systems and high-concurrency microservices",
      category: "core",
      rationale: "Core baseline required to stabilize multi-service operational bottlenecks.",
      suggestedValidationMethod: "work_sample",
      isRecruiterApproved: true,
    });
  }

  // Core capability 2: Data consistency / storage
  requirements.push({
    id: `req_core_2_${Date.now()}`,
    text: "Proven mastery of transactional data consistency, distributed locking, and PostgreSQL / Redis caching strategies",
    category: "core",
    rationale: "Ensures data correctness and prevents split-brain states under heavy query loads.",
    suggestedValidationMethod: "structured_interview",
    isRecruiterApproved: true,
  });

  // Trainable capability
  requirements.push({
    id: `req_train_1_${Date.now()}`,
    text: "Familiarity with Kubernetes orchestration, Helm charts, and internal GitOps deployment workflows",
    category: "trainable",
    rationale: "Operational tools can be rapidly trained on the job if distributed systems fundamentals are sound.",
    suggestedValidationMethod: "portfolio_check",
    isRecruiterApproved: true,
  });

  // Evaluated capability
  requirements.push({
    id: `req_eval_1_${Date.now()}`,
    text: "Ability to conduct root-cause analysis on distributed traces and author high-severity incident post-mortems",
    category: "evaluated",
    rationale: "Crucial for system reliability and team escalation protocols.",
    suggestedValidationMethod: "structured_interview",
    isRecruiterApproved: true,
  });

  // Context capability
  requirements.push({
    id: `req_ctx_1_${Date.now()}`,
    text: "Cross-functional communication with product managers to scope technical trade-offs and SLA requirements",
    category: "context",
    rationale: "Provides business context for prioritization and technical roadmapping.",
    suggestedValidationMethod: "structured_interview",
    isRecruiterApproved: true,
  });

  return {
    draftId,
    proposedTitle,
    businessProblem,
    targetHires,
    department,
    requirements,
    estimatedTimeToHireDays: 28,
    createdAt: new Date().toISOString(),
  };
}
