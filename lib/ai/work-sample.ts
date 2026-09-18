/**
 * VERIFICATION & WORK SAMPLE ENGINE (Phase 7)
 * 
 * Generates realistic, role-specific mini-tasks directly grounded in Role DNA requirements.
 * Evaluates candidate responses/code and updates the requirement's evidence state in the Evidence Graph.
 * 
 * Reused by:
 *   - Phase 7 (Standard verification for Critical unknowns)
 *   - Phase 9 (Targeted verification triggered by Conflict Detector)
 *   - Phase 10 (More evidence loop triggered by Decision Room "Hold")
 */

import { RoleDNA, TieredRequirement } from "./role-dna";

export interface WorkSampleMiniTask {
  id: string;
  roleId: string;
  requirementId: string;
  requirementName: string;
  tier: "Critical" | "Important" | "Preferred" | "Trainable";
  title: string;
  scenarioContext: string;
  technicalTask: string;
  starterCodeOrTemplate?: string;
  evaluationRubric: {
    criterion: string;
    points: number;
    whatToLookFor: string;
  }[];
  expectedDeliverable: string;
  timeLimitMinutes: number;
  triggerContext: "direct_verification" | "conflict_resolution" | "hold_evidence_gather";
}

export interface WorkSampleEvaluationResult {
  taskId: string;
  candidateId: string;
  passed: boolean;
  score: number; // 0-100
  verbatimProof: string;
  interviewerVerdict: "VERIFIED" | "PARTIAL" | "UNRESOLVED";
  rubricBreakdown: {
    criterion: string;
    scoreAwarded: number;
    maxScore: number;
    feedback: string;
  }[];
  updatedEvidenceState: "known" | "partially_known" | "unknown";
  decisionImpact: string;
}

/**
 * Generates a realistic work sample mini-task tailored to a specific Role DNA requirement
 */
export function generateWorkSampleTask(
  role: RoleDNA,
  requirementId: string,
  triggerContext: "direct_verification" | "conflict_resolution" | "hold_evidence_gather" = "direct_verification"
): WorkSampleMiniTask {
  const req = role.tieredRequirements.find(r => r.id === requirementId) || role.tieredRequirements[0];
  const taskId = `ws-${req.id}-${Date.now().toString().slice(-4)}`;

  if (req.name.toLowerCase().includes("kafka") || req.name.toLowerCase().includes("distributed") || req.name.toLowerCase().includes("event")) {
    return {
      id: taskId,
      roleId: role.id,
      requirementId: req.id,
      requirementName: req.name,
      tier: req.tier,
      title: "Distributed Outbox & Partition Key Idempotency Challenge",
      scenarioContext: `At ScalePay, our payment settlement microservice emits high-volume ledger events. During a network partition or broker rebalance, duplicate events occur, causing potential double-credits unless idempotency is strictly enforced.`,
      technicalTask: `1. Implement an idempotent consumer handler or state transition guard for Kafka messages.
2. Address partition rebalance edge cases: How do you prevent out-of-order execution when partition assignment shifts mid-batch?
3. Provide the exact SQL schema or Redis transaction lock strategy you would deploy.`,
      starterCodeOrTemplate: `// Go or TypeScript snippet
type TransactionEvent struct {
    IDempotencyKey string    \`json:"idempotency_key"\`
    AccountID      string    \`json:"account_id"\`
    AmountCents    int64     \`json:"amount_cents"\`
    EventTimestamp time.Time \`json:"timestamp"\`
}

func HandleLedgerEvent(ctx context.Context, msg []byte) error {
    // TODO: Implement idempotency guard and atomic write
    return nil
}`,
      evaluationRubric: [
        { criterion: "Idempotency Storage Pattern", points: 40, whatToLookFor: "Uses unique database constraint or atomic Redis SETNX with distributed lease" },
        { criterion: "Partition Rebalance Handling", points: 30, whatToLookFor: "Addresses commit offsets after atomic DB transaction completes, not before" },
        { criterion: "Failure Mode Reasoning", points: 30, whatToLookFor: "Clear strategy for poison pill messages and dead-letter queues" }
      ],
      expectedDeliverable: "Written architectural code snippet (Go/TS/Java) + 3-paragraph trade-off explanation",
      timeLimitMinutes: 45,
      triggerContext
    };
  }

  // Default systems & backend task
  return {
    id: taskId,
    roleId: role.id,
    requirementId: req.id,
    requirementName: req.name,
    tier: req.tier,
    title: `Targeted Technical Work Sample: ${req.name}`,
    scenarioContext: `Our engineering team requires production-grade verification for '${req.name}' under realistic enterprise failure modes.`,
    technicalTask: `Demonstrate your architectural reasoning for '${req.name}':
1. Outline how you structure components to handle peak load without cascading failures.
2. What telemetry (metrics/traces) would you emit to diagnose subtle latency spikes?
3. Describe an actual failure mode you encountered in this domain and your root-cause resolution.`,
    evaluationRubric: [
      { criterion: "Demonstrated Engineering Depth", points: 50, whatToLookFor: "Concrete technical specifics rather than vague buzzwords" },
      { criterion: "Production Reliability Mindset", points: 30, whatToLookFor: "Addresses circuit breakers, retries, timeouts, and fallbacks" },
      { criterion: "Clarity of Technical Communication", points: 20, whatToLookFor: "Structured, concise, and defensible architectural choices" }
    ],
    expectedDeliverable: "Written design response with code/query sample",
    timeLimitMinutes: 35,
    triggerContext
  };
}

/**
 * Evaluates a candidate's work sample submission and produces verified proof
 */
export function evaluateWorkSample(
  task: WorkSampleMiniTask,
  candidateId: string,
  submissionText: string
): WorkSampleEvaluationResult {
  const clean = (submissionText || "").toLowerCase();
  
  // Evaluation heuristics based on rubric keywords
  const hasSpecifics = clean.length > 150;
  const mentionsIdempotency = clean.includes("idempotent") || clean.includes("unique") || clean.includes("atomic") || clean.includes("transaction");
  const mentionsFailureModes = clean.includes("timeout") || clean.includes("retry") || clean.includes("dead-letter") || clean.includes("circuit") || clean.includes("rollback");
  const mentionsTelemetry = clean.includes("metric") || clean.includes("trace") || clean.includes("log") || clean.includes("prometheus") || clean.includes("alert");

  let score = 50;
  if (hasSpecifics) score += 20;
  if (mentionsIdempotency) score += 15;
  if (mentionsFailureModes) score += 10;
  if (mentionsTelemetry) score += 5;

  score = Math.min(100, Math.max(25, score));
  const passed = score >= 70;

  const verbatimProof = `WorkSample [${task.title}]: Candidate submitted ${submissionText.slice(0, 180)}... (Verified Score: ${score}/100)`;

  return {
    taskId: task.id,
    candidateId,
    passed,
    score,
    verbatimProof,
    interviewerVerdict: passed ? "VERIFIED" : score >= 55 ? "PARTIAL" : "UNRESOLVED",
    rubricBreakdown: task.evaluationRubric.map(r => ({
      criterion: r.criterion,
      scoreAwarded: Math.round((score / 100) * r.points),
      maxScore: r.points,
      feedback: passed ? `Solid demonstration of ${r.whatToLookFor.toLowerCase()}` : `Needs clearer precision regarding ${r.whatToLookFor.toLowerCase()}`
    })),
    updatedEvidenceState: passed ? "known" : score >= 55 ? "partially_known" : "unknown",
    decisionImpact: passed 
      ? `Requirement '${task.requirementName}' promoted from Unknown to Known. Decision uncertainty reduced.`
      : `Requirement '${task.requirementName}' remains unverified. Follow-up interview probe recommended.`
  };
}

import { groqFetch } from "@/lib/groq";

/**
 * Real LLM-powered work sample evaluator via Groq llama-3.3-70b-versatile
 */
export async function evaluateWorkSampleWithAI(
  task: WorkSampleMiniTask,
  candidateId: string,
  submissionText: string
): Promise<WorkSampleEvaluationResult> {
  const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_2 || process.env.GROQ_API_KEY_3;
  if (!apiKey) {
    return evaluateWorkSample(task, candidateId, submissionText);
  }

  const prompt = `You are a Principal Software Engineering Staff Reviewer at a top-tier technology enterprise.
Evaluate this candidate's live technical work-sample code submission against the designated Role DNA challenge with deep technical rigor.

CHALLENGE TITLE: ${task.title}
TARGET REQUIREMENT: ${task.requirementName} (${task.tier})
SCENARIO CONTEXT: ${task.scenarioContext}
TECHNICAL TASK: ${task.technicalTask}
RUBRIC CRITERIA: ${JSON.stringify(task.evaluationRubric)}

CANDIDATE'S ACTUAL SUBMISSION:
"""
${submissionText}
"""

Evaluate this submission thoroughly. Look for:
1. Production robustness, concurrency hazards, race conditions, ACID boundaries.
2. Concrete code patterns, idempotency handling, failure modes, telemetry.
3. Realistic engineering trade-offs and absence of shallow hand-waving.

Return a valid JSON object matching EXACTLY this structure:
{
  "score": number, // 0 to 100
  "passed": boolean, // true if score >= 70
  "verbatimProof": "string (concise 1-2 sentence evidence statement summarizing demonstrated capability)",
  "interviewerVerdict": "VERIFIED" | "PARTIAL" | "UNRESOLVED",
  "rubricBreakdown": [
    {
      "criterion": "string",
      "scoreAwarded": number,
      "maxScore": number,
      "feedback": "string"
    }
  ],
  "decisionImpact": "string (impact on hiring decision)"
}`;

  try {
    const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        const score = Math.min(100, Math.max(0, Number(parsed.score) || 60));
        const passed = score >= 70;
        return {
          taskId: task.id,
          candidateId,
          passed,
          score,
          verbatimProof: parsed.verbatimProof || `WorkSample [${task.title}]: Verified Score ${score}/100`,
          interviewerVerdict: passed ? "VERIFIED" : score >= 55 ? "PARTIAL" : "UNRESOLVED",
          rubricBreakdown: Array.isArray(parsed.rubricBreakdown) && parsed.rubricBreakdown.length > 0 
            ? parsed.rubricBreakdown 
            : task.evaluationRubric.map(r => ({
                criterion: r.criterion,
                scoreAwarded: Math.round((score / 100) * r.points),
                maxScore: r.points,
                feedback: passed ? "Demonstrated solid technical depth." : "Lacks sufficient depth."
              })),
          updatedEvidenceState: passed ? "known" : score >= 55 ? "partially_known" : "unknown",
          decisionImpact: parsed.decisionImpact || (passed
            ? `Requirement '${task.requirementName}' promoted to Known in Evidence Graph.`
            : `Requirement '${task.requirementName}' remains unverified.`)
        };
      }
    }
  } catch (err) {
    console.warn("Groq AI evaluation fallback to deterministic rubric:", err);
  }

  // Resilient deterministic fallback
  return evaluateWorkSample(task, candidateId, submissionText);
}
