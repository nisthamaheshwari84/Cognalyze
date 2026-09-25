/**
 * AI RUN TRACKING & LOGGING (Part 3 & Part 7)
 * 
 * Every LLM invocation records model, prompt_version, input_hash, output_hash,
 * cost, and latency in ai_runs table.
 */

import * as crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { aiRuns } from "@/lib/db/schema";

export interface LogAiRunParams {
  orgId?: string;
  model: string;
  promptVersion: string;
  inputText: string;
  outputText: string;
  costUsd?: number;
  latencyMs: number;
}

export function computeSha256(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export async function recordAiRun(params: LogAiRunParams): Promise<void> {
  try {
    const inputHash = computeSha256(params.inputText);
    const outputHash = computeSha256(params.outputText);

    const db = getDb();
    await db.insert(aiRuns).values({
      orgId: params.orgId ? (params.orgId as any) : null,
      model: params.model,
      promptVersion: params.promptVersion,
      inputHash,
      outputHash,
      costUsd: (params.costUsd ?? 0).toFixed(6),
      latencyMs: params.latencyMs,
    });
  } catch (err) {
    console.error("[AI_RUN_LOG_ERROR] Failed to persist AI run log:", err, {
      model: params.model,
      promptVersion: params.promptVersion,
    });
  }
}
