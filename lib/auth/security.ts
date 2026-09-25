/**
 * COGNALYZE SECURITY UTILITIES
 * 
 * Production security routines:
 * - PBKDF2 salted password hashing & timing-safe verification
 * - 6-digit cryptographic verification code generation & hashing
 * - Username normalization, validation, and reserved names enforcement
 * - Generic consumer email detection for recruiters
 * - Rate limiting helpers
 */

import crypto from "crypto";

// ─── 1. PASSWORD HASHING (PBKDF2) ───
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = "sha512";

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEYLEN,
    PBKDF2_DIGEST
  ).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computed = crypto.pbkdf2Sync(
      password,
      salt,
      PBKDF2_ITERATIONS,
      PBKDF2_KEYLEN,
      PBKDF2_DIGEST
    ).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch {
    return false;
  }
}

// ─── 2. VERIFICATION CODES (6-DIGIT OTP) ───
export function generateVerificationCode(): string {
  // Cryptographically secure 6-digit number between 100000 and 999999
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
}

export function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

export function verifyCode(inputCode: string, storedHash: string): boolean {
  try {
    const inputHash = hashCode(inputCode);
    return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(storedHash));
  } catch {
    return false;
  }
}

// ─── 3. USERNAME NORMALIZATION & RULES ───
export const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "support",
  "help",
  "cognalyze",
  "api",
  "app",
  "login",
  "signup",
  "signin",
  "register",
  "settings",
  "security",
  "recruiter",
  "student",
  "system",
  "root",
  "official",
  "post",
  "posts",
  "candidate",
  "candidates",
  "resume",
  "auth",
  "verify",
  "verification",
  "logout",
  "terms",
  "privacy",
  "about",
  "decision-room",
  "dashboard",
  "profile",
  "null",
  "undefined"
]);

export interface UsernameValidationResult {
  valid: boolean;
  normalized: string;
  error?: string;
}

export function validateUsername(raw: string): UsernameValidationResult {
  if (!raw || typeof raw !== "string") {
    return { valid: false, normalized: "", error: "Username is required." };
  }

  // Remove leading @ if user typed it
  let cleaned = raw.trim();
  if (cleaned.startsWith("@")) {
    cleaned = cleaned.substring(1);
  }

  const normalized = cleaned.toLowerCase();

  if (normalized.length < 3) {
    return { valid: false, normalized, error: "Username must be at least 3 characters." };
  }

  if (normalized.length > 30) {
    return { valid: false, normalized, error: "Username cannot exceed 30 characters." };
  }

  const allowedRegex = /^[a-z0-9_-]+$/;
  if (!allowedRegex.test(normalized)) {
    return { 
      valid: false, 
      normalized, 
      error: "Username can only contain lowercase letters, numbers, underscores, and hyphens." 
    };
  }

  if (RESERVED_USERNAMES.has(normalized)) {
    return { valid: false, normalized, error: "This username is reserved by Cognalyze." };
  }

  return { valid: true, normalized };
}

// ─── 4. RECRUITER WORK EMAIL VALIDATION ───
export const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "ymail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "mail.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "aim.com",
  "zoho.com",
  "gmx.com",
  "gmx.net",
  "yandex.com",
  "fastmail.com",
  "tutanota.com"
]);

export function isGenericEmailDomain(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1]?.toLowerCase().trim();
  return GENERIC_EMAIL_DOMAINS.has(domain);
}

export function extractEmailDomain(email: string): string {
  if (!email || !email.includes("@")) return "";
  return email.split("@")[1]?.toLowerCase().trim();
}

// ─── 5. RATE LIMITING HELPER (In-Memory Sliding Window) ───
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitBuckets = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = rateLimitBuckets.get(key);

  if (!existing || now > existing.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= maxRequests) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds: retryAfter > 0 ? retryAfter : 1 };
  }

  existing.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
