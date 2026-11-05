/**
 * lib/crypto/token-vault.ts
 * 
 * COGNALYZE ENCRYPTED TOKEN VAULT
 * 
 * Provides authenticated AES-256-GCM encryption and decryption for third-party OAuth
 * access tokens (GitHub, LinkedIn) stored at rest in Supabase and auth store.
 * 
 * Invariants:
 * 1. Zero plaintext tokens at rest.
 * 2. Authenticated encryption with AES-256-GCM (12-byte IV + 16-byte auth tag).
 * 3. Tenant-bound key derivation: if userId is provided, encryption key is cryptographically
 *    salted with userId so token cannot be decrypted across user contexts.
 * 4. Safe error handling: corrupted payloads return null rather than crashing the runtime.
 */

import crypto from "crypto";

const MASTER_VAULT_SECRET =
  process.env.TOKEN_VAULT_SECRET ||
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "cognalyze_default_token_vault_master_key_2026_secured";

/**
 * Derives a 32-byte key for AES-256 from the master secret and optional userId.
 */
function deriveEncryptionKey(userId?: string): Buffer {
  const seed = userId ? `${MASTER_VAULT_SECRET}::${userId.trim().toLowerCase()}` : MASTER_VAULT_SECRET;
  return crypto.createHash("sha256").update(seed).digest();
}

/**
 * Encrypts a plaintext OAuth token using AES-256-GCM.
 * Output format: enc_v1:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>
 */
export function encryptToken(plainToken: string, userId?: string): string {
  if (!plainToken || typeof plainToken !== "string") {
    throw new Error("Cannot encrypt empty token payload");
  }

  const key = deriveEncryptionKey(userId);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(plainToken, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `enc_v1:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted token.
 * Returns null if the token is invalid, tampered with, or wrong user context.
 */
export function decryptToken(encryptedPayload: string, userId?: string): string | null {
  if (!encryptedPayload || typeof encryptedPayload !== "string") {
    return null;
  }

  // Not encrypted with our vault
  if (!encryptedPayload.startsWith("enc_v1:")) {
    // If it's already plaintext (e.g. legacy/mock in dev), return cautiously or null
    return null;
  }

  try {
    const parts = encryptedPayload.split(":");
    if (parts.length !== 4) return null;

    const [version, ivHex, tagHex, cipherHex] = parts;
    if (version !== "enc_v1" || !ivHex || !tagHex || !cipherHex) return null;

    const key = deriveEncryptionKey(userId);
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(tagHex, "hex");

    if (iv.length !== 12 || authTag.length !== 16) return null;

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(cipherHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch {
    // Decryption failure (authentication tag mismatch or corrupted data)
    return null;
  }
}

/**
 * Checks whether a given string is in the encrypted token format.
 */
export function isEncryptedToken(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  return token.startsWith("enc_v1:") && token.split(":").length === 4;
}

