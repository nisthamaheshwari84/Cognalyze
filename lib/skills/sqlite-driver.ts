/**
 * lib/skills/sqlite-driver.ts
 * 
 * Safe runtime resolver for Node.js built-in DatabaseSync (node:sqlite).
 * Completely eliminates Webpack 'UnhandledSchemeError: Reading from "node:sqlite"'
 * by using Node.js runtime process.getBuiltinModule() and dynamic evaluation,
 * bypassing Webpack static AST import parsing and client bundle pollution.
 */

// Declare global for Webpack runtime if present
declare const __non_webpack_require__: any;

export interface DatabaseSyncStatement {
  all(...params: any[]): Record<string, any>[];
  get(...params: any[]): Record<string, any> | undefined;
  run(...params: any[]): { changes: number | bigint; lastInsertRowid: number | bigint };
}

export interface DatabaseSyncInstance {
  exec(sql: string): void;
  prepare(sql: string): DatabaseSyncStatement;
  close(): void;
}

export interface DatabaseSyncConstructor {
  new (location: string, options?: any): DatabaseSyncInstance;
}

let cachedConstructor: DatabaseSyncConstructor | null = null;
let attemptedResolution = false;

/**
 * Resolves the Node.js built-in DatabaseSync constructor at runtime.
 */
export function getDatabaseSync(): DatabaseSyncConstructor {
  if (cachedConstructor) {
    return cachedConstructor;
  }

  if (attemptedResolution) {
    throw new Error(
      "Node.js built-in DatabaseSync (node:sqlite) is not available in the current runtime environment."
    );
  }

  attemptedResolution = true;

  // 1. First preference: Node.js 22+ native process.getBuiltinModule
  if (typeof process !== "undefined" && typeof (process as any).getBuiltinModule === "function") {
    try {
      const mod = (process as any).getBuiltinModule("node:sqlite") || (process as any).getBuiltinModule("sqlite");
      if (mod?.DatabaseSync) {
        cachedConstructor = mod.DatabaseSync as DatabaseSyncConstructor;
        return cachedConstructor;
      }
    } catch {
      // Continue to next method
    }
  }

  // 2. Second preference: Non-webpack dynamic require bypass
  try {
    const dynamicRequire =
      typeof __non_webpack_require__ !== "undefined"
        ? __non_webpack_require__
        : typeof eval === "function"
        ? eval("require")
        : null;

    if (typeof dynamicRequire === "function") {
      const mod = dynamicRequire("node:sqlite");
      if (mod?.DatabaseSync) {
        cachedConstructor = mod.DatabaseSync as DatabaseSyncConstructor;
        return cachedConstructor;
      }
    }
  } catch {
    // Continue to next method
  }

  throw new Error(
    "Node.js built-in DatabaseSync (node:sqlite) is not available in the current runtime environment."
  );
}

/**
 * Creates a new in-memory DatabaseSync instance safely.
 */
export function createInMemoryDatabase(): DatabaseSyncInstance {
  const DatabaseSyncClass = getDatabaseSync();
  return new DatabaseSyncClass(":memory:");
}
