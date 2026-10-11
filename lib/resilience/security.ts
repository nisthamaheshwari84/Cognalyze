/**
 * COGNALYZE SECURITY & INPUT RESILIENCE
 * 
 * Defends against prompt injection, script injection, malformed payloads,
 * memory-exhaustion strings, and adversarial inputs.
 */

// Common prompt injection attack signatures
const PROMPT_INJECTION_PATTERNS = [
  /\bignore\s+(all\s+)?(previous|prior|above)\s+instructions\b/i,
  /\bdisregard\s+(all\s+)?(previous|prior|above)\s+instructions\b/i,
  /\byou\s+are\s+now\s+(a|an|in|unrestricted)\b/i,
  /\bDAN\s+mode\b/i,
  /\bjailbreak\b/i,
  /\bact\s+as\s+(an?\s+)?unrestricted\b/i,
  /\bsystem\s*:\s*/i,
  /\b\[system\]/i,
  /\b<\|im_start\|>/i,
  /\b<\|im_end\|>/i,
  /\bdeveloper\s+mode\s+enabled\b/i
];

/**
 * Sanitizes user text for AI prompts, neutralizing prompt injection attacks
 * while preserving legitimate questions and code snippets.
 */
export function sanitizePromptInput(input: string, maxLen: number = 8000): {
  cleanText: string;
  hasInjectionRisk: boolean;
  warnings: string[];
} {
  if (!input || typeof input !== "string") {
    return { cleanText: "", hasInjectionRisk: false, warnings: [] };
  }

  const warnings: string[] = [];
  let text = input;

  // 1. Remove null bytes and control characters (except newline, tab, carriage return)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 2. Length clamping to prevent memory exhaustion
  if (text.length > maxLen) {
    text = text.slice(0, maxLen);
    warnings.push(`Input was clamped to ${maxLen} characters for performance and safety.`);
  }

  // 3. Detect prompt injection signals
  let hasInjectionRisk = false;
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      hasInjectionRisk = true;
      warnings.push("Adversarial prompt pattern detected and neutralized.");
      // Wrap or neutralize directive phrases so LLM treats them strictly as inert user data
      text = text.replace(pattern, (match) => `[user query snippet: "${match}"]`);
    }
  }

  return { cleanText: text.trim(), hasInjectionRisk, warnings };
}

/**
 * Sanitizes URLs to ensure they only use http or https schemes.
 */
export function sanitizeSafeUrl(rawUrl?: string): string | undefined {
  if (!rawUrl || typeof rawUrl !== "string") return undefined;
  const trimmed = rawUrl.trim();
  if (/^(https?:\/\/)/i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      return parsed.href;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * HTML Escaper to prevent XSS if string is ever rendered in raw HTML context.
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validates file upload metadata defensively.
 */
export function validateUploadFile(file?: { name?: string; size?: number; type?: string }): {
  valid: boolean;
  error?: string;
} {
  if (!file) {
    return { valid: false, error: "No file was selected for upload." };
  }

  const maxSizeBytes = 25 * 1024 * 1024; // 25 MB
  if (typeof file.size === "number" && file.size > maxSizeBytes) {
    return { valid: false, error: `File size exceeds the 25MB limit. Please upload a smaller file.` };
  }

  if (typeof file.size === "number" && file.size === 0) {
    return { valid: false, error: "The selected file is empty (0 bytes). Please upload a valid document." };
  }

  const name = file.name || "";
  const ext = name.split(".").pop()?.toLowerCase();
  const allowedExtensions = ["pdf", "txt", "docx", "doc", "json", "png", "jpg", "jpeg", "webp"];

  if (ext && !allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file extension .${ext}. Supported formats include: ${allowedExtensions.map(e => "." + e).join(", ")}.`
    };
  }

  return { valid: true };
}

/**
 * SSRF Safety Validator (Section 20 Requirement)
 * Blocks loopback, internal private subnets, cloud metadata endpoints, and non-http(s) protocols.
 */
export function isSafePublicUrl(rawUrl: string): { safe: boolean; reason?: string } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { safe: false, reason: "Empty or invalid URL" };
  }
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { safe: false, reason: "Malformed URL format" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { safe: false, reason: `Disallowed protocol: ${parsed.protocol}` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Loopback / Localhost
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan") ||
    hostname.endsWith(".localdomain")
  ) {
    return { safe: false, reason: "Restricted local destination (SSRF Protection)" };
  }

  // AWS / GCP / Azure Cloud Metadata
  if (hostname === "169.254.169.254" || hostname.startsWith("169.254.")) {
    return { safe: false, reason: "Restricted cloud metadata service (SSRF Protection)" };
  }

  // IPv4 Private subnets
  const ipMatch = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipMatch) {
    const oct1 = parseInt(ipMatch[1], 10);
    const oct2 = parseInt(ipMatch[2], 10);

    if (oct1 === 10) {
      return { safe: false, reason: "Restricted private RFC1918 subnet (10.0.0.0/8)" };
    }
    if (oct1 === 172 && oct2 >= 16 && oct2 <= 31) {
      return { safe: false, reason: "Restricted private RFC1918 subnet (172.16.0.0/12)" };
    }
    if (oct1 === 192 && oct2 === 168) {
      return { safe: false, reason: "Restricted private RFC1918 subnet (192.168.0.0/16)" };
    }
    if (oct1 === 127 || oct1 === 0) {
      return { safe: false, reason: "Restricted loopback/zero subnet" };
    }
  }

  return { safe: true };
}
