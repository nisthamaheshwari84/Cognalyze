/**
 * ROLE ARCHITECT & ROLE DNA ENGINE (Phase 1)
 * 
 * Captures business outcomes and priority-tiered requirements:
 *   - Critical: Non-negotiable dealbreaker / core capability
 *   - Important: Core day-to-day competency
 *   - Preferred: Differentiator / velocity multiplier
 *   - Trainable: Can be picked up in 30-60 days on the job
 */

export type RequirementTier = "Critical" | "Important" | "Preferred" | "Trainable";

export interface BusinessOutcome {
  id: string;
  outcome: string; // e.g. "Architect high-throughput settlement engine processing 10k TPS"
  metric: string; // e.g. "P99 latency < 50ms, zero lost transactions"
  timeframe: string; // e.g. "First 90 days"
  impactSeverity: "High" | "Critical" | "Transformative";
}

export interface TieredRequirement {
  id: string;
  name: string;
  tier: RequirementTier;
  category: "Technical" | "System Design" | "Domain" | "Leadership" | "Soft Skills";
  description: string;
  weightPct: number; // Sums to 100 across requirements
  verificationMethod: "work_sample" | "code_execution" | "targeted_interview" | "portfolio_audit" | "behavioral_probe";
  dealBreakerIfMissing: boolean;
  acceptableProofTypes: ("production_code" | "architecture_spec" | "github_commit" | "live_work_sample" | "verified_interview")[];
}

export interface RoleDNA {
  id: string;
  title: string;
  department: string;
  seniority: "Junior" | "Mid-Level" | "Senior" | "Staff" | "Principal";
  targetHires: number;
  businessOutcomes: BusinessOutcome[];
  tieredRequirements: TieredRequirement[];
  uncertaintyThreshold: number; // e.g. 0.20: If >20% uncertainty on Critical/Important, trigger Minimum Proof
  status: "active" | "draft" | "filled";
  createdAt: string;
  updatedAt: string;
  calibrationNotes?: string[];
  learningLoopRefinements?: {
    date: string;
    adjustedRequirement: string;
    reason: string;
  }[];
}

/**
 * Validates and normalizes weights across tiered requirements to guarantee 100%
 */
export function normalizeRoleDnaWeights(requirements: TieredRequirement[]): TieredRequirement[] {
  if (!requirements || requirements.length === 0) return [];
  const currentTotal = requirements.reduce((acc, r) => acc + (r.weightPct || 0), 0);
  if (currentTotal === 100) return requirements;

  if (currentTotal === 0) {
    // Distribute by tier priority
    const baseWeight = Math.floor(100 / requirements.length);
    let remainder = 100 - (baseWeight * requirements.length);
    return requirements.map(r => {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder--;
      return { ...r, weightPct: baseWeight + extra };
    });
  }

  // Scale proportionally
  let sum = 0;
  const scaled = requirements.map((r, i) => {
    if (i === requirements.length - 1) {
      return { ...r, weightPct: Math.max(1, 100 - sum) };
    }
    const scaledVal = Math.max(1, Math.round((r.weightPct / currentTotal) * 100));
    sum += scaledVal;
    return { ...r, weightPct: scaledVal };
  });

  return scaled;
}

/**
 * Creates a baseline Role DNA with calibrated defaults
 */
export function createDefaultRoleDNA(title: string, dept: string): RoleDNA {
  const id = `role-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;
  return {
    id,
    title,
    department: dept,
    seniority: "Senior",
    targetHires: 2,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    uncertaintyThreshold: 0.20,
    businessOutcomes: [
      {
        id: "out-1",
        outcome: "Deliver high-availability distributed architecture for tier-1 service",
        metric: "99.99% service uptime under 5x traffic surges",
        timeframe: "First 90 days",
        impactSeverity: "Critical"
      },
      {
        id: "out-2",
        outcome: "Mentor team on distributed caching, partition fault tolerance, and observability",
        metric: "Zero critical production incidents caused by cache invalidation failures",
        timeframe: "First 60 days",
        impactSeverity: "High"
      }
    ],
    tieredRequirements: [
      {
        id: "req-1",
        name: "Distributed Systems & Event-Driven Architecture",
        tier: "Critical",
        category: "System Design",
        description: "Hands-on experience with Kafka, partition strategies, consensus trade-offs, and idempotency",
        weightPct: 35,
        verificationMethod: "work_sample",
        dealBreakerIfMissing: true,
        acceptableProofTypes: ["production_code", "architecture_spec", "live_work_sample"]
      },
      {
        id: "req-2",
        name: "Backend Concurrency & High-Throughput Storage",
        tier: "Critical",
        category: "Technical",
        description: "Deep mastery of Go/Java/C++, MVCC transaction isolation, and connection pooling",
        weightPct: 30,
        verificationMethod: "code_execution",
        dealBreakerIfMissing: true,
        acceptableProofTypes: ["production_code", "github_commit", "live_work_sample"]
      },
      {
        id: "req-3",
        name: "Cloud Observability & Reliability Engineering",
        tier: "Important",
        category: "Technical",
        description: "Prometheus metrics, distributed tracing, OpenTelemetry, and graceful degradation",
        weightPct: 20,
        verificationMethod: "targeted_interview",
        dealBreakerIfMissing: false,
        acceptableProofTypes: ["production_code", "verified_interview"]
      },
      {
        id: "req-4",
        name: "Cross-Functional Technical Leadership",
        tier: "Preferred",
        category: "Leadership",
        description: "Ability to drive RFC design reviews, unblock peers, and lead post-mortems",
        weightPct: 10,
        verificationMethod: "behavioral_probe",
        dealBreakerIfMissing: false,
        acceptableProofTypes: ["verified_interview"]
      },
      {
        id: "req-5",
        name: "Kubernetes Operator & Helm Automation",
        tier: "Trainable",
        category: "Technical",
        description: "Can be acquired within 30 days if strong Linux and Docker container fundamentals exist",
        weightPct: 5,
        verificationMethod: "portfolio_audit",
        dealBreakerIfMissing: false,
        acceptableProofTypes: ["github_commit", "verified_interview"]
      }
    ]
  };
}
