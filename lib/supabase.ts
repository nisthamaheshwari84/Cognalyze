import { createClient } from "@supabase/supabase-js";

if (typeof window === "undefined" && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const fs = require("fs");
    const path = require("path");
    const envFile = path.join(process.cwd(), ".env.local");
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
      if (!rawUrl || rawUrl.includes("placeholder")) {
        isAvailable = false;
        return false;
      }
      const host = new URL(rawUrl).hostname;
      const dns = require("dns").promises;
      await dns.resolve(host);
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

let realClient: any = null;
function getRealClient() {
  if (!realClient) {
    realClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return realClient;
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
  : {
      from(table: string) {
        return createLazyChain(table);
      },
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      }
    };

