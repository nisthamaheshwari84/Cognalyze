import { createClient } from "@supabase/supabase-js";

if (typeof window === "undefined" && process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const fs = require("fs");
    const path = require("path");
    const envFile = path.join(/* turbopackIgnore: true */ process.cwd(), ".env.local");
    if (fs.existsSync(envFile)) {
      const lines = fs.readFileSync(envFile, "utf8").split("\n");
      for (const line of lines) {
        const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (m) {
          const k = m[1];
          let v = (m[2] || "").trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
          }
          if (!process.env[k]) process.env[k] = v;
        }
      }
    }
  } catch {}
}

let isAvailable: boolean | null = null;
let checkPromise: Promise<boolean> | null = null;

export async function isSupabaseAvailable(): Promise<boolean> {
  if (typeof window !== "undefined") return true;
  if (isAvailable !== null) return isAvailable;
  if (checkPromise) return checkPromise;

  checkPromise = (async () => {
    try {
      const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      if (!rawUrl || rawUrl.includes("placeholder") || !rawKey || rawKey.includes("placeholder")) {
        isAvailable = false;
        return false;
      }
      const host = new URL(rawUrl).hostname;
      const dns = require("dns").promises;
      await dns.resolve(host);

      const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
      const probeKey = rawServiceKey || rawKey;

      // Fast HTTP health probe with 1500ms timeout: validates key and unpaused status
      const res = await fetch(`${rawUrl}/rest/v1/`, {
        method: "HEAD",
        headers: { apikey: probeKey, Authorization: `Bearer ${probeKey}` },
        signal: AbortSignal.timeout(1500)
      }).catch(() => null);

      if (!res || res.status === 401 || res.status === 403 || res.status >= 500) {
        isAvailable = false;
        return false;
      }

      isAvailable = true;
      return true;
    } catch {
      isAvailable = false;
      return false;
    }
  })();
  return checkPromise;
}

// Start fast check immediately
if (typeof window === "undefined") {
  isSupabaseAvailable();
}

const rawSupabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseUrl = (rawSupabaseUrl.startsWith("http://") || rawSupabaseUrl.startsWith("https://"))
  ? rawSupabaseUrl
  : "https://placeholder.supabase.co";

const rawAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
const supabaseAnonKey = rawAnonKey || "placeholder-anon-key";

const rawServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const supabaseServiceKey = rawServiceKey || "";

const boundedFetch = (url: any, opts: any) =>
  fetch(url, { ...opts, signal: opts?.signal || AbortSignal.timeout(3000) });

let realClient: any = null;
function getRealClient() {
  if (!realClient) {
    try {
      const keyToUse = (typeof window === "undefined" && supabaseServiceKey)
        ? supabaseServiceKey
        : (supabaseAnonKey || "placeholder-anon-key");
      realClient = createClient(supabaseUrl, keyToUse, {
        global: { fetch: boundedFetch }
      });
    } catch {
      realClient = createClient("https://placeholder.supabase.co", "placeholder-anon-key", {
        global: { fetch: boundedFetch }
      });
    }
  }
  return realClient;
}

let realAdminClient: any = null;
export function getAdminClient() {
  if (!realAdminClient) {
    try {
      if (supabaseServiceKey && !supabaseServiceKey.includes("placeholder")) {
        realAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
          global: { fetch: boundedFetch }
        });
      } else {
        realAdminClient = getRealClient();
      }
    } catch {
      realAdminClient = getRealClient();
    }
  }
  return realAdminClient;
}

function createLazyChain(tableName: string) {
  const calls: Array<{ method: string; args: any[] }> = [];
  const lazyHandler: ProxyHandler<any> = {
    get(target, prop: string) {
      if (prop === "then") {
        return (resolve: any, reject: any) => {
          isSupabaseAvailable().then(available => {
            if (!available) {
              resolve({ data: null, error: { message: "Supabase host unreachable" } });
              return;
            }
            let cur = getRealClient().from(tableName);
            for (const c of calls) {
              cur = (cur as any)[c.method](...c.args);
            }
            cur.then(resolve, reject);
          }).catch(reject);
        };
      }
      if (prop === "maybeSingle" || prop === "single") {
        return (...args: any[]) => {
          return isSupabaseAvailable().then(available => {
            if (!available) {
              return prop === "maybeSingle"
                ? { data: null, error: null }
                : { data: null, error: { message: "Supabase host unreachable" } };
            }
            let cur = getRealClient().from(tableName);
            for (const c of calls) {
              cur = (cur as any)[c.method](...c.args);
            }
            return (cur as any)[prop](...args);
          });
        };
      }
      return (...args: any[]) => {
        calls.push({ method: prop, args });
        return new Proxy({}, lazyHandler);
      };
    }
  };
  return new Proxy({}, lazyHandler);
}

export const supabase: any = typeof window !== "undefined"
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({}, {
      get(target, prop: string) {
        if (prop === "from") {
          return (tableName: string) => createLazyChain(tableName);
        }
        const client = getRealClient();
        const val = client[prop];
        if (typeof val === "function") {
          return val.bind(client);
        }
        return val;
      }
    });

export const supabaseAdmin = typeof window === "undefined" ? getAdminClient() : supabase;


