/**
 * COGNALYZE GD ARENA — AI PROVIDER GATEWAY & PROMPT GOVERNANCE
 *
 * Centralizes all LLM interactions across the 7 GD Arena subsystems:
 * 1. topic_generator
 * 2. dynamic_agent_generator
 * 3. experience_engine
 * 4. participant_agent
 * 5. coach_moderator
 * 6. evaluator
 * 7. skills_lab_coach
 *
 * Provides:
 * - Role-scoped temperature & max-token budgets
 * - Prompt input sanitization against delimiter breakout & excessive length
 * - Multi-provider failover via Cognalyze `callGroqCatalog` (Groq keys -> Gemini -> OpenAI)
 * - Typed schema validation + automatic single repair retry on malformed JSON
 * - Deterministic test hook (`setGDAIExecutorForTest`)
 */

import { callGroqCatalog } from "@/lib/groq";
import { extractJSON, stripThinkTags } from "@/lib/ai/placement-intelligence";

export type GDAIAgentRole =
  | "topic_generator"
  | "dynamic_agent_generator"
  | "experience_engine"
  | "participant_agent"
  | "coach_moderator"
  | "evaluator"
  | "skills_lab_coach";

export interface GDAIRoleBudget {
  role: GDAIAgentRole;
  preferredModel: string;
  temperature: number;
  maxTokens: number;
}

export const GD_AI_ROLE_GOVERNANCE: Record<GDAIAgentRole, GDAIRoleBudget> = {
  topic_generator: {
    role: "topic_generator",
    preferredModel: "openai/gpt-oss-120b",
    temperature: 0.85,
    maxTokens: 2200
  },
  dynamic_agent_generator: {
    role: "dynamic_agent_generator",
    preferredModel: "openai/gpt-oss-120b",
    temperature: 0.75,
    maxTokens: 1600
  },
  experience_engine: {
    role: "experience_engine",
    preferredModel: "openai/gpt-oss-120b",
    temperature: 0.7,
    maxTokens: 1400
  },
  participant_agent: {
    role: "participant_agent",
    preferredModel: "openai/gpt-oss-120b",
    temperature: 0.72,
    maxTokens: 650
  },
  coach_moderator: {
    role: "coach_moderator",
    preferredModel: "openai/gpt-oss-120b",
    temperature: 0.4,
    maxTokens: 500
  },
  evaluator: {
    role: "evaluator",
    preferredModel: "openai/gpt-oss-120b",
    temperature: 0.25,
    maxTokens: 2400
  },
  skills_lab_coach: {
    role: "skills_lab_coach",
    preferredModel: "openai/gpt-oss-120b",
    temperature: 0.45,
    maxTokens: 1000
  }
};

export interface GDAICompletionMeta {
  role: GDAIAgentRole;
  attempts: number;
  latencyMs: number;
  repaired: boolean;
  providerUsed: string;
}

export type GDAICompletionResult<T> =
  | { ok: true; data: T; meta: GDAICompletionMeta }
  | { ok: false; error: string; meta: GDAICompletionMeta };

export type GDAIExecutorFn = (params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  max_tokens: number;
}) => Promise<{ text: string; provider?: string }>;

let customExecutorForTest: GDAIExecutorFn | null = null;

export function setGDAIExecutorForTest(executor: GDAIExecutorFn | null): void {
  customExecutorForTest = executor;
}

/**
 * Sanitize untrusted student utterances, custom topics, or profile strings
 * before interpolating into system/user prompts.
 */
export function sanitizeGDPromptInput(raw: string | undefined | null, maxLength = 600): string {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/```+/g, "'")
    .replace(/\b(ignore previous instructions|system prompt:|developer mode)\b/gi, "[filtered-phrase]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

async function invokeProvider(params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  max_tokens: number;
}): Promise<{ text: string; provider: string }> {
  if (customExecutorForTest) {
    const out = await customExecutorForTest(params);
    return { text: out.text, provider: out.provider || "test-executor" };
  }
  const timeoutMs = 12000;
  let timerId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => reject(new Error("AI provider timeout exceeded (12s)")), timeoutMs);
  });
  try {
    const res = await Promise.race([
      callGroqCatalog({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature,
        max_tokens: params.max_tokens,
        response_format: { type: "json_object" }
      }),
      timeoutPromise
    ]);
    return {
      text: res.text,
      provider: res.raw?.model || params.model
    };
  } finally {
    if (timerId) clearTimeout(timerId);
  }
}

/**
 * Execute a role-governed AI JSON completion with schema validation
 * and an automatic repair attempt if the first output has malformed JSON or fails validation.
 */
export async function runGDJsonCompletion<T>(params: {
  role: GDAIAgentRole;
  systemPrompt: string;
  userPrompt: string;
  validate: (parsed: any) => T | null;
  temperatureOverride?: number;
}): Promise<GDAICompletionResult<T>> {
  const budget = GD_AI_ROLE_GOVERNANCE[params.role];
  const t0 = Date.now();
  const baseTemperature =
    typeof params.temperatureOverride === "number"
      ? Math.min(1, Math.max(0, params.temperatureOverride))
      : budget.temperature;

  let attempts = 0;
  let lastRawText = "";
  let lastError = "No completion produced";
  let providerUsed = "unknown";

  for (let pass = 1; pass <= 2; pass++) {
    attempts = pass;
    const isRepair = pass === 2;
    const messages = isRepair
      ? [
          {
            role: "system",
            content: `${params.systemPrompt}\nCRITICAL: Return ONLY strict RFC-8259 JSON matching the exact schema requested. No markdown fences, no commentary.`
          },
          {
            role: "user",
            content: `Your previous response failed schema validation (${lastError}). Repair and return valid JSON ONLY.\n\nOriginal task:\n${params.userPrompt}\n\nMalformed draft:\n${lastRawText.slice(0, 700)}`
          }
        ]
      : [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.userPrompt }
        ];

    try {
      const result = await invokeProvider({
        model: budget.preferredModel,
        messages,
        temperature: isRepair ? Math.min(0.2, baseTemperature) : baseTemperature,
        max_tokens: budget.maxTokens
      });

      providerUsed = result.provider;
      lastRawText = result.text || "";
      const clean = stripThinkTags(lastRawText);
      const parsed = extractJSON(clean);

      if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
        const validated = params.validate(parsed);
        if (validated !== null) {
          return {
            ok: true,
            data: validated,
            meta: {
              role: params.role,
              attempts,
              latencyMs: Date.now() - t0,
              repaired: isRepair,
              providerUsed
            }
          };
        }
        lastError = "Parsed JSON did not satisfy required fields";
      } else {
        lastError = "Output did not contain valid JSON object";
      }
    } catch (err: any) {
      lastError = err?.message || "Provider request failed";
    }
  }

  return {
    ok: false,
    error: lastError,
    meta: {
      role: params.role,
      attempts,
      latencyMs: Date.now() - t0,
      repaired: attempts > 1,
      providerUsed
    }
  };
}
