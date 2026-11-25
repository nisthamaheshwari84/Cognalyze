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
 * SSRF Safety Validator (Phase 2 & Section 20 Requirement)
 * Blocks loopback, private RFC1918/RFC4193/RFC6598 subnets, IPv6 local ranges,
 * hex/octal/integer IP encodings, userinfo credentials, cloud metadata services,
 * and non-http(s) protocols.
 */
export function isSafePublicUrl(rawUrl: string): { safe: boolean; reason?: string } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { safe: false, reason: "Empty or invalid URL" };
  }
  const trimmed = rawUrl.trim();
  if (trimmed.length > 2048) {
    return { safe: false, reason: "URL exceeds maximum allowed length" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { safe: false, reason: "Malformed URL format" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { safe: false, reason: `Disallowed protocol: ${parsed.protocol}` };
  }

  if (parsed.username || parsed.password) {
    return { safe: false, reason: "Embedded credentials in URL are not permitted" };
  }

  if (parsed.port && !["80", "443", ""].includes(parsed.port)) {
    return { safe: false, reason: `Restricted destination port: ${parsed.port}` };
  }

  const rawHost = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!rawHost) {
    return { safe: false, reason: "Missing destination hostname" };
  }

  // Loopback / internal hostnames / cloud metadata aliases
  if (
    rawHost === "localhost" ||
    rawHost === "127.0.0.1" ||
    rawHost === "::1" ||
    rawHost === "::" ||
    rawHost === "0.0.0.0" ||
    rawHost === "metadata.google.internal" ||
    rawHost === "metadata" ||
    rawHost.endsWith(".localhost") ||
    rawHost.endsWith(".local") ||
    rawHost.endsWith(".internal") ||
    rawHost.endsWith(".lan") ||
    rawHost.endsWith(".localdomain") ||
    rawHost.endsWith(".home.arpa")
  ) {
    return { safe: false, reason: "Restricted local/internal destination (SSRF Protection)" };
  }

  // Block integer / hex / octal IP representations (e.g. 2130706433, 0x7f000001, 0177.0.0.1)
  if (/^\d+$/.test(rawHost) || /^0x[0-9a-f]+$/i.test(rawHost)) {
    return { safe: false, reason: "Encoded numeric IP hostnames are disallowed (SSRF Protection)" };
  }
  if (rawHost.includes(".") && rawHost.split(".").every((part) => /^(0x[0-9a-f]+|0[0-7]+|\d+)$/i.test(part))) {
    // Reject non-canonical octal/hex segments outright
    const hasEncodedPart = rawHost.split(".").some((part) => /^0x/i.test(part) || (part.length > 1 && part.startsWith("0")));
    if (hasEncodedPart) {
      return { safe: false, reason: "Hex/octal obfuscated IP address is disallowed (SSRF Protection)" };
    }
  }

  // IPv6 private, link-local, loopback & IPv4-mapped checks
  if (rawHost.includes(":")) {
    if (
      rawHost === "::1" ||
      rawHost === "::" ||
      rawHost.startsWith("fe80:") ||
      rawHost.startsWith("fc") ||
      rawHost.startsWith("fd") ||
      rawHost.startsWith("::ffff:") ||
      rawHost.startsWith("ff")
    ) {
      return { safe: false, reason: "Restricted IPv6 loopback/private/mapped range (SSRF Protection)" };
    }
  }

  // AWS / GCP / Azure Cloud Metadata
  if (rawHost === "169.254.169.254" || rawHost.startsWith("169.254.")) {
    return { safe: false, reason: "Restricted cloud metadata service (SSRF Protection)" };
  }

  // Standard IPv4 private / CGNAT / loopback / reserved ranges
  const ipMatch = rawHost.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
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
    if (oct1 === 100 && oct2 >= 64 && oct2 <= 127) {
      return { safe: false, reason: "Restricted CGNAT subnet (100.64.0.0/10)" };
    }
    if (oct1 === 127 || oct1 === 0 || oct1 >= 224) {
      return { safe: false, reason: "Restricted loopback/zero/multicast subnet" };
    }
  }

  return { safe: true };
}
