/**
 * lib/env.ts
 * 
 * Centralized runtime environment helpers for Cognalyze.
 */

export function isTestRuntime(): boolean {
  if (process.env.NODE_ENV === "test") return true;
  if (process.env.VITEST !== undefined) return true;
  if (process.env.NODE_TEST_CONTEXT !== undefined) return true;
  if (process.env.COG_DISABLE_CLOUD_SYNC === "true") return true;
  if (typeof process !== "undefined" && Array.isArray(process.argv)) {
    if (process.argv.some(arg => arg.includes("--test") || arg.endsWith(".test.ts") || arg.endsWith(".test.js"))) {
      return true;
    }
  }
  return false;
}
