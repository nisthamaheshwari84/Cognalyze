/**
 * Helper to wrap calls to Groq API with robust fallback / retry logic, key rotation, and multi-provider backup.
 * 
 * Flow:
 * 1. Checks PRIMARY_PROVIDER in .env.local (can be "gemini", "openai", or "groq").
 * 2. Supports comma-separated keys for all three providers in .env.local to enable automatic Key Rotation.
 * 3. Rotates to the next key if a rate limit (HTTP 429) occurs.
 * 4. Bounces dynamically between providers (Gemini -> OpenAI -> Groq) to ensure a strong, indestructible free backup.
 */
export async function groqFetch(url: string, options: RequestInit): Promise<Response> {
  // If it's not a Groq completions request, fallback to standard fetch
  if (!url.includes("api.groq.com")) {
    return fetch(url, options);
  }

  let bodyObj: any = {};
  try {
    if (typeof options.body === "string") {
      bodyObj = JSON.parse(options.body);
    }
  } catch (e) {
    // Ignore parsing issues
  }

  // Parse keys into lists to support comma-separated rotation
  const getKeys = (val?: string): string[] => {
    if (!val) return [];
    return val.split(",").map(k => k.trim()).filter(Boolean);
  };

  const getEnvKeys = (prefixes: string[]): string[] => {
    const keys: string[] = [];
    const matchedEnvKeys = Object.keys(process.env)
      .filter(k => prefixes.some(p => k.startsWith(p)))
      .sort((a, b) => {
        if (a.length !== b.length) return a.length - b.length;
        return a.localeCompare(b);
      });
    for (const envKey of matchedEnvKeys) {
      keys.push(...getKeys(process.env[envKey]));
    }
    return Array.from(new Set(keys));
  };

  const primaryProvider = (process.env.PRIMARY_PROVIDER || "groq").toLowerCase();
  const geminiKeys = getEnvKeys(["GEMINI_API_KEY", "NEXT_PUBLIC_GEMINI_API_KEY"]);
  const openaiKeys = getEnvKeys(["OPENAI_API_KEY", "NEXT_PUBLIC_OPENAI_API_KEY"]);
  const groqKeys = getEnvKeys(["GROQ_API_KEY"]);

  let lastResponse: Response | null = null;
  let lastError: any = null;

  // --- Gemini API with Key Rotation ---
  const callGemini = async (): Promise<Response | null> => {
    if (geminiKeys.length === 0) return null;

    for (let idx = 0; idx < geminiKeys.length; idx++) {
      const key = geminiKeys[idx];
      console.log(`[groqFetch] Directing request to Gemini API (gemini-1.5-flash) using key index ${idx}...`);
      const tempBody = { ...bodyObj, model: "gemini-1.5-flash" };
      const geminiHeaders = new Headers(options.headers || {});
      geminiHeaders.set("Authorization", `Bearer ${key}`);
      geminiHeaders.set("Content-Type", "application/json");

      try {
        const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
          ...options,
          headers: geminiHeaders,
          body: JSON.stringify(tempBody)
        });
        lastResponse = res;

        if (res.ok) {
          console.log(`[groqFetch] Success with Gemini key index ${idx}`);
          return res;
        }

        const errText = await res.clone().text();
        console.warn(`[groqFetch] Gemini key index ${idx} failed (status: ${res.status}): ${errText}`);

        if (res.status === 429) {
          console.warn(`[groqFetch] Gemini key index ${idx} rate-limited. Trying next Gemini key...`);
          continue;
        }
        continue;
      } catch (err) {
        console.error(`[groqFetch] Gemini key index ${idx} error:`, err);
        lastError = err;
      }
    }
    return null;
  };

  // --- OpenAI API with Key Rotation ---
  const callOpenAI = async (): Promise<Response | null> => {
    if (openaiKeys.length === 0) return null;

    for (let idx = 0; idx < openaiKeys.length; idx++) {
      const key = openaiKeys[idx];
      console.log(`[groqFetch] Directing request to OpenAI API (gpt-4o-mini) using key index ${idx}...`);
      const tempBody = { ...bodyObj, model: "gpt-4o-mini" };
      const openaiHeaders = new Headers(options.headers || {});
      openaiHeaders.set("Authorization", `Bearer ${key}`);
      openaiHeaders.set("Content-Type", "application/json");

      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          ...options,
          headers: openaiHeaders,
          body: JSON.stringify(tempBody)
        });
        lastResponse = res;

        if (res.ok) {
          console.log(`[groqFetch] Success with OpenAI key index ${idx}`);
          return res;
        }

        const errText = await res.clone().text();
        console.warn(`[groqFetch] OpenAI key index ${idx} failed (status: ${res.status}): ${errText}`);

        if (res.status === 429) {
          console.warn(`[groqFetch] OpenAI key index ${idx} rate-limited. Trying next OpenAI key...`);
          continue;
        }
        continue;
      } catch (err) {
        console.error(`[groqFetch] OpenAI key index ${idx} error:`, err);
        lastError = err;
      }
    }
    return null;
  };

  // --- Groq Cloud with Key & Model Rotation ---
  const callGroqCatalog = async (): Promise<Response | null> => {
    if (groqKeys.length === 0) return null;

    // Detect if request contains image/vision content
    const hasImage = JSON.stringify(bodyObj).includes("image_url");

    let groqModelsToTry: string[];
    const requested = (bodyObj.model || "").trim();

    const realGroqCatalog = [
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "qwen/qwen3.8-27b",
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant"
    ];

    if (hasImage) {
      groqModelsToTry = ["llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"];
    } else if (requested) {
      groqModelsToTry = [requested, ...realGroqCatalog.filter(m => m !== requested)];
    } else {
      groqModelsToTry = realGroqCatalog;
    }

    // Bound retries: try models with active keys, max 2 keys per model to avoid retry storms
    const maxKeysToTry = Math.min(groqKeys.length, 2);

    for (let modelIdx = 0; modelIdx < groqModelsToTry.length; modelIdx++) {
      const model = groqModelsToTry[modelIdx];

      for (let keyIdx = 0; keyIdx < maxKeysToTry; keyIdx++) {
        const key = groqKeys[keyIdx];
        const tempBody = { ...bodyObj, model };
        
        const modifiedHeaders = new Headers(options.headers || {});
        modifiedHeaders.set("Authorization", `Bearer ${key}`);

        const modifiedOptions: RequestInit = {
          ...options,
          headers: modifiedHeaders,
          body: JSON.stringify(tempBody),
          signal: options.signal || AbortSignal.timeout(8000),
        };

        try {
          const res = await fetch(url, modifiedOptions);
          lastResponse = res;

          if (res.ok) {
            return res;
          }

          if (res.status === 401) {
            console.warn(`[groqFetch] Key index ${keyIdx} unauthorized (401). Trying next key.`);
            continue;
          }

          if (res.status === 429) {
            console.warn(`[groqFetch] Key index ${keyIdx} model ${model} rate-limited (429). Trying next key.`);
            continue;
          }

          if (res.status === 404 || res.status === 400) {
            // Model doesn't exist or bad request: skip to next model immediately, don't burn other keys
            break;
          }

          continue;
        } catch (err: any) {
          if (err.name === "TimeoutError") {
            console.warn(`[groqFetch] Request timed out for model ${model} on key ${keyIdx}.`);
          } else {
            console.warn(`[groqFetch] Network error for model ${model}:`, err.message);
          }
          lastError = err;
          continue;
        }
      }
    }
    return null;
  };

  // --- EXECUTE BY PRIORITY ---
  if (primaryProvider === "gemini" && geminiKeys.length > 0) {
    const geminiRes = await callGemini();
    if (geminiRes?.ok) return geminiRes;
  } else if (primaryProvider === "openai" && openaiKeys.length > 0) {
    const openaiRes = await callOpenAI();
    if (openaiRes?.ok) return openaiRes;
  }

  // Fallback to Groq if not successfully handled
  const groqRes = await callGroqCatalog();
  if (groqRes?.ok) return groqRes;

  // Final fallback to remaining providers if not already executed as primary
  if (primaryProvider !== "gemini" && geminiKeys.length > 0) {
    const geminiRes = await callGemini();
    if (geminiRes?.ok) return geminiRes;
  }
  if (primaryProvider !== "openai" && openaiKeys.length > 0) {
    const openaiRes = await callOpenAI();
    if (openaiRes?.ok) return openaiRes;
  }

  if (lastResponse) return lastResponse;
  throw lastError || new Error("All AI provider attempts and keys failed. Check credentials and limits.");
}

export async function callGroqCatalog(payload: {
  model?: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: any;
}): Promise<{ text: string; raw: any }> {
  const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Groq catalog call failed with status ${res.status}`);
  }
  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  const text = (msg?.content || msg?.reasoning || "").trim();
  return { text, raw: data };
}
