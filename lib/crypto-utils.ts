/**
 * lib/crypto-utils.ts
 * 
 * Cryptographically secure, deterministic utilities for ID generation,
 * item selection, and array shuffling across server and client runtimes.
 * Conforms to Anti-Simulation Rule S7 (zero reliance on Math.random).
 */

export function generateSecureId(prefix = "", length = 12): string {
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function") {
    const raw = globalThis.crypto.randomUUID().replace(/-/g, "");
    const sub = raw.substring(0, Math.min(length, raw.length));
    return prefix ? `${prefix}${prefix.endsWith("-") || prefix.endsWith("_") ? "" : "_"}${sub}` : sub;
  }
  const fallback = Date.now().toString(36);
  return prefix ? `${prefix}${prefix.endsWith("-") || prefix.endsWith("_") ? "" : "_"}${fallback}` : fallback;
}

export function secureRandomInt(min: number, max: number): number {
  if (max <= min) return min;
  const range = max - min;
  if (typeof globalThis.crypto !== "undefined") {
    // Check for web crypto or node crypto
    if (typeof (globalThis.crypto as any).randomInt === "function") {
      return (globalThis.crypto as any).randomInt(min, max);
    }
    if (typeof globalThis.crypto.getRandomValues === "function") {
      const arr = new Uint32Array(1);
      globalThis.crypto.getRandomValues(arr);
      return min + (arr[0] % range);
    }
  }
  return min;
}

export function pickSecureRandom<T>(items: T[]): T | undefined {
  if (!items || items.length === 0) return undefined;
  if (items.length === 1) return items[0];
  const index = secureRandomInt(0, items.length);
  return items[index];
}

export function secureShuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = secureRandomInt(0, i + 1);
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}
