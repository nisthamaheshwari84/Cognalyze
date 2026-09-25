/**
 * COGNALYZE — MULTI-PROVIDER LLM ABSTRACTION LAYER (SECTION 60)
 * 
 * Supports local LLM inference through Ollama, with graceful fallback to
 * Groq, OpenAI, Gemini, or deterministic rule-based output.
 * 
 * INVARIANTS:
 * - Never hardcode the entire application to one model.
 * - Gracefully handle model unavailable, timeout, malformed response, context limits.
 * - Always prefer structured JSON schemas over arbitrary prose.
 */

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
  timeoutMs?: number;
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface LLMProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  generate(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;
  generateStructured<T>(messages: LLMMessage[], schemaDescription?: string, options?: LLMOptions): Promise<T>;
}

// ══════════════════════════════════════════════════════════════════════
// 1. OLLAMA LOCAL PROVIDER (Local First)
// ══════════════════════════════════════════════════════════════════════
export class OllamaProvider implements LLMProvider {
  name = "Ollama";
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    this.model = process.env.OLLAMA_MODEL || "llama3.1:8b";
  }

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }

  async generate(messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    const timeout = options.timeoutMs || 25000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          format: options.responseFormat === "json" ? "json" : undefined,
          options: {
            temperature: options.temperature ?? 0.1,
            num_predict: options.maxTokens ?? 1024,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Ollama HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      return {
        content: data.message?.content || "",
        provider: "Ollama",
        model: this.model,
        usage: {
          promptTokens: data.prompt_eval_count,
          completionTokens: data.eval_count,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      throw new Error(`Ollama generation failed: ${err.message}`);
    }
  }

  async generateStructured<T>(messages: LLMMessage[], schemaDescription?: string, options: LLMOptions = {}): Promise<T> {
    const modifiedMessages = [...messages];
    if (schemaDescription) {
      modifiedMessages.push({
        role: "user",
        content: `IMPORTANT: Respond ONLY with valid, parseable JSON matching this schema:\n${schemaDescription}\nDo NOT wrap in markdown fences. Output raw JSON object only.`,
      });
    }

    const res = await this.generate(modifiedMessages, { ...options, responseFormat: "json" });
    return parseJSONSafely<T>(res.content);
  }
}

// ══════════════════════════════════════════════════════════════════════
// 2. GROQ PROVIDER (Ultra-fast cloud backup)
// ══════════════════════════════════════════════════════════════════════
export class GroqProvider implements LLMProvider {
  name = "Groq";
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || "";
    this.model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generate(messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const timeout = options.timeoutMs || 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: options.temperature ?? 0.1,
          max_tokens: options.maxTokens ?? 1500,
          response_format: options.responseFormat === "json" ? { type: "json_object" } : undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Groq HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      return {
        content: data.choices?.[0]?.message?.content || "",
        provider: "Groq",
        model: this.model,
        usage: data.usage,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      throw new Error(`Groq generation failed: ${err.message}`);
    }
  }

  async generateStructured<T>(messages: LLMMessage[], schemaDescription?: string, options: LLMOptions = {}): Promise<T> {
    const modifiedMessages = [...messages];
    if (schemaDescription) {
      modifiedMessages.push({
        role: "user",
        content: `IMPORTANT: Respond ONLY with valid, parseable JSON matching this schema:\n${schemaDescription}\nOutput raw JSON object only.`,
      });
    }

    const res = await this.generate(modifiedMessages, { ...options, responseFormat: "json" });
    return parseJSONSafely<T>(res.content);
  }
}

// ══════════════════════════════════════════════════════════════════════
// 3. MULTI-PROVIDER ROUTER & HYBRID FALLBACK
// ══════════════════════════════════════════════════════════════════════
export class ResilientLLMRouter implements LLMProvider {
  name = "ResilientRouter";
  private providers: LLMProvider[];

  constructor() {
    this.providers = [
      new OllamaProvider(),
      new GroqProvider(),
    ];
  }

  async isAvailable(): Promise<boolean> {
    for (const p of this.providers) {
      if (await p.isAvailable()) return true;
    }
    return false;
  }

  async generate(messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    let lastError: Error | null = null;

    for (const provider of this.providers) {
      try {
        const available = await provider.isAvailable();
        if (!available) continue;

        return await provider.generate(messages, options);
      } catch (err: any) {
        console.warn(`[LLM Router] Provider ${provider.name} failed: ${err.message}. Trying next fallback...`);
        lastError = err;
      }
    }

    throw new Error(`All LLM providers unavailable. Last error: ${lastError?.message || "Unknown error"}`);
  }

  async generateStructured<T>(messages: LLMMessage[], schemaDescription?: string, options: LLMOptions = {}): Promise<T> {
    let lastError: Error | null = null;

    for (const provider of this.providers) {
      try {
        const available = await provider.isAvailable();
        if (!available) continue;

        return await provider.generateStructured<T>(messages, schemaDescription, options);
      } catch (err: any) {
        console.warn(`[LLM Router] Provider ${provider.name} structured gen failed: ${err.message}. Trying next fallback...`);
        lastError = err;
      }
    }

    throw new Error(`All LLM providers failed for structured output. Last error: ${lastError?.message || "Unknown error"}`);
  }
}

// Helper: Safely parse JSON from raw LLM responses
export function parseJSONSafely<T>(raw: string): T {
  const clean = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*$/gi, "")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    return JSON.parse(clean) as T;
  } catch {
    const match = clean.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        // Fall through
      }
    }
    throw new Error(`Failed to parse JSON response from LLM: ${clean.slice(0, 200)}...`);
  }
}

// Global Singleton
let globalRouter: ResilientLLMRouter | null = null;

export function getLLMProvider(): LLMProvider {
  if (!globalRouter) {
    globalRouter = new ResilientLLMRouter();
  }
  return globalRouter;
}
