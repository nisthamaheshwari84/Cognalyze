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

export interface StructuredRoleRequirement {
  id: string;
  name: string;
  category: "required" | "preferred" | "experience" | "education" | "responsibility" | "other";
  evidenceQuote: string;
  source: "job_description" | "recruiter_added";
  needsConfirmation?: boolean;
  ambiguityReason?: string;
  conflictEvidence?: {
    statementA: string;
    statementB: string;
    reason: string;
  };
  startChar?: number;
  endChar?: number;

  // Semantic Role DNA Intelligence fields
  canonicalName?: string;
  semanticCategory?: import("@/lib/roles/types").SemanticRequirementCategory;
  subtype?: string;
  rationale?: string;
  evidenceSignals?: string[];
  verificationStrategy?: string[];
  confidence?: number;
  ambiguityStatus?: import("@/lib/roles/types").AmbiguityStatus;
  relatedCapabilities?: { name: string; confidence: number; explanation: string }[];

  // Enhanced fields
  requirementType?: import("@/lib/roles/types").RequirementType;
  importance?: import("@/lib/roles/types").ImportanceLevel;
  evidenceExpectation?: import("@/lib/roles/types").EvidenceExpectation;
  acceptableOptions?: string[];
  minimumExperienceYears?: number;
}

export interface RoleDNA {
  id: string;
  title: string;
  department: string;
  seniority: "Junior" | "Mid-Level" | "Senior" | "Staff" | "Principal";
  targetHires: number;
  workMode?: "Remote" | "Hybrid" | "On-site";
  location?: string;
  businessOutcomes: BusinessOutcome[];
  tieredRequirements: TieredRequirement[];
  structuredRequirements?: StructuredRoleRequirement[];
  roleDna?: import("@/lib/roles/types").RoleDNAStructure;
  uncertaintyThreshold: number; // e.g. 0.20: If >20% uncertainty on Critical/Important, trigger Minimum Proof
  status: "active" | "draft" | "filled";
  createdAt: string;
  updatedAt: string;
  version?: number;
  jdRaw?: string;
  spineRequirements?: import("@/lib/roles/types").JdRequirement[];
  reviewLens?: import("@/lib/roles/types").JdReviewLensResult;
  calibrationNotes?: string[];
  learningLoopRefinements?: {
    date: string;
    adjustedRequirement: string;
    reason: string;
  }[];
}

/**
 * Compiles tiered requirements with normalized weights in the background
 * from structured requirements without exposing AI weights or calibration to the recruiter.
 */
export function compileTieredRequirementsFromStructured(
  structured: StructuredRoleRequirement[]
): TieredRequirement[] {
  if (!structured || structured.length === 0) {
    return [
      {
        id: "req-default-1",
        name: "General Engineering Fundamentals",
        tier: "Critical",
        category: "Technical",
        description: "Verified core programming and problem solving fundamentals",
        weightPct: 100,
        verificationMethod: "work_sample",
        dealBreakerIfMissing: true,
        acceptableProofTypes: ["production_code", "github_commit"]
      }
    ];
  }

  // Filter out noise or duplicates
  const valid = structured.filter(s => s.name && s.name.trim());
  const requiredItems = valid.filter(s =>
    s.semanticCategory === "MUST_HAVE" ||
    (!s.semanticCategory && (s.category === "required" || s.category === "experience" || s.category === "education")) ||
    (s.category === "required" && s.semanticCategory !== "RESPONSIBILITY") ||
    (s.category === "experience" && s.semanticCategory !== "RESPONSIBILITY") ||
    (s.category === "education" && s.semanticCategory !== "RESPONSIBILITY")
  );
  const preferredItems = valid.filter(s =>
    s.semanticCategory === "PREFERRED" ||
    (!s.semanticCategory && (s.category === "preferred" || s.category === "other")) ||
    (s.category === "preferred" && s.semanticCategory !== "EVIDENCE_SIGNAL") ||
    (s.category === "other" && s.semanticCategory !== "EVIDENCE_SIGNAL")
  );

  const compiled: TieredRequirement[] = [];

  // Allocate 70% weight to Required / Experience / Education
  if (requiredItems.length > 0) {
    const totalRequiredWeight = preferredItems.length > 0 ? 70 : 100;
    const base = Math.floor(totalRequiredWeight / requiredItems.length);
    let rem = totalRequiredWeight - base * requiredItems.length;

    requiredItems.forEach((item, idx) => {
      const extra = rem > 0 ? 1 : 0;
      if (rem > 0) rem--;
      const isCritical = idx === 0 || item.category === "required" || item.semanticCategory === "MUST_HAVE";
      compiled.push({
        id: item.id || `req-str-${idx + 1}`,
        name: item.canonicalName || item.name,
        tier: isCritical ? "Critical" : "Important",
        category: item.category === "experience" ? "Domain" : "Technical",
        description: item.evidenceQuote || `Verified requirement: ${item.canonicalName || item.name}`,
        weightPct: base + extra,
        verificationMethod: idx === 0 ? "work_sample" : "code_execution",
        dealBreakerIfMissing: item.category === "required" || item.semanticCategory === "MUST_HAVE",
        acceptableProofTypes: ["production_code", "github_commit", "live_work_sample"]
      });
    });
  }

  // Allocate 30% weight to Preferred / Other
  if (preferredItems.length > 0) {
    const totalPreferredWeight = requiredItems.length > 0 ? 30 : 100;
    const base = Math.floor(totalPreferredWeight / preferredItems.length);
    let rem = totalPreferredWeight - base * preferredItems.length;

    preferredItems.forEach((item, idx) => {
      const extra = rem > 0 ? 1 : 0;
      if (rem > 0) rem--;
      compiled.push({
        id: item.id || `req-str-pref-${idx + 1}`,
        name: item.canonicalName || item.name,
        tier: idx === 0 ? "Preferred" : "Trainable",
        category: "Technical",
        description: item.evidenceQuote || `Preferred capability: ${item.canonicalName || item.name}`,
        weightPct: base + extra,
        verificationMethod: "targeted_interview",
        dealBreakerIfMissing: false,
        acceptableProofTypes: ["verified_interview", "github_commit"]
      });
    });
  }

  return normalizeRoleDnaWeights(compiled);
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
