/**
 * COGNALYZE MENTOR — LLM PROVIDER IMPLEMENTATION
 * Primary provider wrapping Groq with resilient timeout and error handling.
 */

import { ILLMProvider, ILLMMessage, ILLMOptions } from "./types";
import { groqFetch } from "../../groq";

export class GroqLLMProvider implements ILLMProvider {
  name = "groq-primary";

  async generateTurn(
    systemPrompt: string,
    messages: ILLMMessage[],
    options?: ILLMOptions
  ): Promise<string> {
    const model = options?.model || "openai/gpt-oss-120b";
    const temperature = options?.temperature ?? 0.2;
    const maxTokens = options?.maxTokens ?? 350;

    const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY || ""}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: maxTokens,
        temperature
      })
    });

    if (!res || !res.ok) {
      throw new Error(`LLM provider returned status ${res?.status || 500}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  }
}

export const defaultLLMProvider = new GroqLLMProvider();
