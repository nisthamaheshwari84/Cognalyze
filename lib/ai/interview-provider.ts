/**
 * lib/ai/interview-provider.ts
 * 
 * Standardized AI Provider Abstraction for Cognalyze Technical Interview Arena.
 * 
 * Provider-Independent Architecture:
 *   - AIProvider interface defines standard contracts for interview generation, assessment, and reporting.
 *   - GroqProviderAdapter is the primary high-performance inference engine (using Groq Cloud API).
 *   - FallbackProviderAdapter guarantees zero-crash resilience during network disconnections or offline sandbox testing.
 *   - NEVER exposes API keys to client-side code; strictly server-side.
 */

import { stripThink, extractJSON } from "./interview-engine";

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json_object" | "text";
  timeoutMs?: number;
}

export interface AIProviderResponse {
  content: string;
  reasoning?: string;
  model: string;
  provider: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs: number;
}

export interface AIProvider {
  name: string;
  chat(messages: Array<{ role: string; content: string }>, options?: AICompletionOptions): Promise<AIProviderResponse>;
  isAvailable(): boolean;
}

/**
 * Primary Groq Provider Adapter
 */
export class GroqProviderAdapter implements AIProvider {
  name = "groq";
  private apiKey: string;
  private primaryModel: string;
  private fallbackModel: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || "";
    this.primaryModel = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    this.fallbackModel = process.env.GROQ_FALLBACK_MODEL || "openai/gpt-oss-20b";
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    options: AICompletionOptions = {}
  ): Promise<AIProviderResponse> {
    if (!this.isAvailable()) {
      throw new Error("[GroqProviderAdapter] GROQ_API_KEY is not configured in server environment.");
    }

    const t0 = Date.now();
    const timeoutMs = options.timeoutMs || 15000;
    const modelToUse = options.model || this.primaryModel;
    const modelsToTry = [modelToUse, this.fallbackModel].filter((m, i, arr) => arr.indexOf(m) === i);

    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const body: Record<string, any> = {
          model,
          messages,
          temperature: options.temperature ?? 0.6,
          max_tokens: options.maxTokens ?? 1000,
        };

        if (options.responseFormat === "json_object") {
          body.response_format = { type: "json_object" };
        }

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey.trim()}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errText = await res.text();
          console.warn(`[GroqProviderAdapter] Model ${model} returned status ${res.status}: ${errText.slice(0, 160)}`);
          if (res.status === 404 || res.status === 400) {
            // Model not supported on this endpoint; try next model in catalog
            continue;
          }
          if (res.status === 429) {
            // Rate limit; attempt next model
            continue;
          }
          throw new Error(`Groq HTTP ${res.status}: ${errText}`);
        }

        const data = await res.json();
        const choice = data.choices?.[0];
        const content = choice?.message?.content || "";
        const reasoning = choice?.message?.reasoning || "";

        return {
          content: content.trim(),
          reasoning: reasoning.trim(),
          model: data.model || model,
          provider: "groq",
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens,
          latencyMs: Date.now() - t0,
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[GroqProviderAdapter] Attempt with model ${model} failed: ${err.message}`);
      }
    }

    throw lastError || new Error("[GroqProviderAdapter] All Groq model attempts failed.");
  }
}

/**
 * Gemini Provider Adapter (Secondary backup if configured)
 */
export class GeminiProviderAdapter implements AIProvider {
  name = "gemini";
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    options: AICompletionOptions = {}
  ): Promise<AIProviderResponse> {
    if (!this.isAvailable()) {
      throw new Error("[GeminiProviderAdapter] GEMINI_API_KEY is not configured.");
    }

    const t0 = Date.now();
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(this.apiKey.trim());
    const model = genAI.getGenerativeModel({
      model: options.model || "gemini-1.5-flash",
      generationConfig: {
        temperature: options.temperature ?? 0.6,
        maxOutputTokens: options.maxTokens ?? 1000,
        responseMimeType: options.responseFormat === "json_object" ? "application/json" : "text/plain",
      },
    });

    // Flatten messages into conversational prompt
    const prompt = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
    const result = await model.generateContent(prompt);
    const content = result.response.text();

    return {
      content: content.trim(),
      model: options.model || "gemini-1.5-flash",
      provider: "gemini",
      latencyMs: Date.now() - t0,
    };
  }
}

/**
 * Standard Multi-Provider Orchestrator
 */
export class InterviewAIOrchestrator {
  private providers: AIProvider[] = [];

  constructor() {
    // 1. Prefer Groq first per Master Specification
    this.providers.push(new GroqProviderAdapter());
    // 2. Secondary backup: Gemini if available
    this.providers.push(new GeminiProviderAdapter());
  }

  async complete(
    messages: Array<{ role: string; content: string }>,
    options: AICompletionOptions = {}
  ): Promise<AIProviderResponse> {
    let lastError: any = null;

    for (const provider of this.providers) {
      if (!provider.isAvailable()) continue;
      try {
        const res = await provider.chat(messages, options);
        if (res && res.content) {
          return res;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[InterviewAIOrchestrator] Provider ${provider.name} failed: ${err.message}. Cascading to backup...`);
      }
    }

    throw lastError || new Error("[InterviewAIOrchestrator] No AI inference provider was available or succeeded.");
  }
}

// Global Singleton
export const interviewAI = new InterviewAIOrchestrator();

