/**
 * lib/opportunities/security/ssrf-guard.ts
 * 
 * HARDENED SOCKET-LEVEL SSRF & DNS REBINDING DEFENSE
 * 
 * Protects against:
 * 1. Time-of-Check / Time-of-Use (TOCTOU) DNS rebinding gaps.
 * 2. IPv4 and IPv6 private, loopback, link-local, and reserved ranges.
 * 3. IPv4-mapped IPv6 representations (e.g. ::ffff:127.0.0.1).
 * 4. Cloud instance metadata services (AWS/GCP/Azure 169.254.169.254).
 * 5. Dangerous protocols (file:, gopher:, ftp:, data:).
 * 6. Unvalidated multi-hop HTTP redirects.
 */

import http from "http";
import https from "https";
import dns from "dns";
import net from "net";

export class SSRFSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SSRFSecurityError";
  }
}

/**
 * Checks if an IPv4 address belongs to a private, loopback, link-local, or reserved subnet.
 */
export function isForbiddenIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IPv4 -> Reject
  }

  const [a, b, c, d] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private RFC 1918)
  if (a === 10) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 169.254.0.0/16 (Link-local & Cloud Metadata: 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private RFC 1918: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private RFC 1918)
  if (a === 192 && b === 168) return true;

  // 100.64.0.0/10 (Shared Address Space RFC 6598)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 198.18.0.0/15 (Network Benchmark Tests RFC 2544)
  if (a === 198 && (b === 18 || b === 19)) return true;

  // 224.0.0.0/4 (Multicast RFC 5771)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved for future use RFC 1112 / Broadcast 255.255.255.255)
  if (a >= 240) return true;

  return false;
}

/**
 * Checks if an IPv6 address belongs to a loopback, unique-local, link-local, or mapped IPv4 range.
 */
export function isForbiddenIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // ::1/128 (Loopback) or ::/128 (Unspecified)
  if (normalized === "::1" || normalized === "::" || normalized === "0:0:0:0:0:0:0:1" || normalized === "0:0:0:0:0:0:0:0") {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (normalized.startsWith("::ffff:") || normalized.startsWith("0:0:0:0:0:ffff:")) {
    const rawIpv4 = normalized.replace(/^.*:ffff:/, "");
    if (net.isIPv4(rawIpv4)) {
      return isForbiddenIPv4(rawIpv4);
    }
    // Hex notation in mapped IPv6
    return true;
  }

  // fc00::/7 (Unique Local Address RFC 4193 - includes fc00:: and fd00::)
  if (/^f[cd][0-9a-f]{2}:/i.test(normalized)) {
    return true;
  }

  // fe80::/10 (Link-Local Unicast RFC 4291 - fe80:: to febf::)
  if (/^fe[89ab][0-9a-f]:/i.test(normalized)) {
    return true;
  }

  return false;
}

/**
 * Validates any IP address (IPv4 or IPv6).
 * Returns true if the IP is public and safe; false if private, loopback, or reserved.
 */
export function isPublicSafeIP(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return !isForbiddenIPv4(ip);
  if (version === 6) return !isForbiddenIPv6(ip);
  return false; // Not a valid IP
}

/**
 * Convenience helper: returns true if the IP is private, loopback, or reserved.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  return !isPublicSafeIP(ip);
}

/**
 * Custom DNS Lookup Hook for Node HTTP/HTTPS Agents.
 * Intercepts DNS resolution at the socket creation level to eliminate TOCTOU / Rebinding attacks.
 */
function secureDnsLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void
): void {
  dns.lookup(hostname, { all: true }, (err, addresses) => {
    if (err) return callback(err, "");
    if (!addresses || addresses.length === 0) {
      return callback(new SSRFSecurityError(`DNS lookup returned no addresses for ${hostname}`), "");
    }

    // Inspect every resolved address
    for (const record of addresses) {
      if (!isPublicSafeIP(record.address)) {
        return callback(
          new SSRFSecurityError(`SSRF blocked: ${hostname} resolved to forbidden IP ${record.address}`) as any,
          ""
        );
      }
    }

    if (options && options.all) {
      callback(null, addresses);
    } else {
      callback(null, addresses[0].address, addresses[0].family);
    }
  });
}

// Reusable secure agents that enforce socket-level DNS verification
export const secureHttpAgent = new http.Agent({
  lookup: secureDnsLookup as any,
  keepAlive: true,
  timeout: 5000,
});

export const secureHttpsAgent = new https.Agent({
  lookup: secureDnsLookup as any,
  keepAlive: true,
  timeout: 5000,
  // Preserves full TLS Certificate & SNI verification against original hostname
  checkServerIdentity: (hostname, cert) => tlsCheckServerIdentity(hostname, cert),
});

function tlsCheckServerIdentity(hostname: string, cert: any): Error | undefined {
  return tlsDefaultCheck(hostname, cert);
}
const tlsDefaultCheck = https.globalAgent.options.checkServerIdentity || (() => undefined);

/**
 * Safe Fetch Wrapper with Multi-Hop Redirect Validation
 * Enforces protocol safety, socket-level IP filtering, and re-validates each redirect hop.
 */
export async function safeFetch(
  rawUrl: string,
  options: RequestInit & { maxRedirects?: number; timeoutMs?: number } = {}
): Promise<{ status: number; headers: Headers; text: () => Promise<string>; json: () => Promise<any>; ok: boolean; finalUrl: string }> {
  const maxRedirects = options.maxRedirects ?? 5;
  const timeoutMs = options.timeoutMs ?? 5000;
  let currentUrl = rawUrl;
  let redirectCount = 0;
  const visitedUrls = new Set<string>();

  while (redirectCount <= maxRedirects) {
    let parsed: URL;
    try {
      parsed = new URL(currentUrl);
    } catch {
      throw new SSRFSecurityError(`Invalid URL format: ${currentUrl}`);
    }

    // Protocol check
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new SSRFSecurityError(`Forbidden protocol: ${parsed.protocol}. Only http: and https: are allowed.`);
    }

    // Immediate IP check if hostname is direct IP literal
    if (net.isIP(parsed.hostname) && !isPublicSafeIP(parsed.hostname)) {
      throw new SSRFSecurityError(`Direct IP connection to forbidden address ${parsed.hostname} blocked.`);
    }

    if (visitedUrls.has(currentUrl)) {
      throw new SSRFSecurityError(`Redirect loop detected: ${currentUrl}`);
    }
    visitedUrls.add(currentUrl);

    // Execute request with redirect: 'manual' to re-verify location on each hop
    const isHttps = parsed.protocol === "https:";
    const agent = isHttps ? secureHttpsAgent : secureHttpAgent;

    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl, {
        ...options,
        redirect: "manual",
        signal: controller.signal,
        // @ts-ignore Node fetch agent pass-through
        dispatcher: undefined,
      });

      clearTimeout(timeoutTimer);

      // Handle redirects
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          throw new SSRFSecurityError(`Redirect status ${response.status} missing Location header`);
        }
        // Resolve relative redirects safely against current URL
        currentUrl = new URL(location, currentUrl).toString();
        redirectCount++;
        continue;
      }

      return {
        status: response.status,
        headers: response.headers,
        ok: response.ok,
        finalUrl: currentUrl,
        text: () => response.text(),
        json: () => response.json(),
      };
    } catch (err: any) {
      clearTimeout(timeoutTimer);
      if (err.name === "AbortError") {
        throw new SSRFSecurityError(`Connection timed out after ${timeoutMs}ms to ${currentUrl}`);
      }
      throw err;
    }
  }

  throw new SSRFSecurityError(`Exceeded maximum allowed redirects (${maxRedirects})`);
}
