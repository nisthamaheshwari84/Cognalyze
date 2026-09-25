// lib/evidence/hackathon-agent.ts
//
// Hackathon project claim fetcher: validates and fetches real project metadata
// from public hackathon links (Devfolio, Devpost, GitHub) so hackathon claims
// are grounded in verifiable external facts, never just candidate self-reported text.

import { Evidence } from "./types";
import { HackathonClaim } from "./deep-review-agent";

export interface VerifiedHackathonClaim extends HackathonClaim {
  url_verified: boolean;
  retrieved_description?: string;
  retrieved_awards?: string;
  source_platform: "devfolio" | "devpost" | "github" | "other";
}

export interface HackathonEvidenceDossier {
  candidateId: string;
  claims: VerifiedHackathonClaim[];
  evidence: Evidence[];
}

function detectPlatform(url: string): "devfolio" | "devpost" | "github" | "other" {
  const lower = url.toLowerCase();
  if (lower.includes("devfolio.co")) return "devfolio";
  if (lower.includes("devpost.com")) return "devpost";
  if (lower.includes("github.com")) return "github";
  return "other";
}

function extractMetaTags(html: string): { title?: string; description?: string } {
  const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) ||
                     html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) ||
                    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);

  return {
    title: titleMatch?.[1]?.trim(),
    description: descMatch?.[1]?.trim(),
  };
}

export async function verifyHackathonClaim(
  candidateId: string,
  claim: HackathonClaim
): Promise<{ verified: VerifiedHackathonClaim; evidence: Evidence[] }> {
  const link = (claim.claimed_project_link || "").trim();
  const evidenceList: Evidence[] = [];

  if (!link) {
    const evidenceId = `ev_${candidateId}_hack_${claim.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_nolink`;
    evidenceList.push({
      id: evidenceId,
      source_type: "hackathon_submission",
      source_ref: `hackathon:${claim.name}`,
      quote_or_fact: `No project link provided for claimed hackathon "${claim.name}".`,
      extracted_at: new Date().toISOString(),
    });

    return {
      verified: {
        ...claim,
        url_verified: false,
        source_platform: "other",
      },
      evidence: evidenceList,
    };
  }

  const platform = detectPlatform(link);
  const evidenceId = `ev_${candidateId}_hack_${claim.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(link, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeout);

    if (!res || !res.ok) {
      evidenceList.push({
        id: evidenceId,
        source_type: "hackathon_submission",
        source_ref: link,
        quote_or_fact: `Project link returned status ${res?.status ?? "unreachable"}: "${link}". Content could not be verified.`,
        extracted_at: new Date().toISOString(),
      });

      return {
        verified: {
          ...claim,
          url_verified: false,
          source_platform: platform,
        },
        evidence: evidenceList,
      };
    }

    const html = await res.text();
    const { title, description } = extractMetaTags(html);

    const factSummary = description
      ? `Verified ${platform} submission: "${title || claim.name}". Description: "${description.slice(0, 200)}"`
      : `Verified reachable ${platform} submission at "${link}".`;

    evidenceList.push({
      id: evidenceId,
      source_type: "hackathon_submission",
      source_ref: link,
      quote_or_fact: factSummary,
      extracted_at: new Date().toISOString(),
    });

    return {
      verified: {
        ...claim,
        url_verified: true,
        retrieved_description: description,
        source_platform: platform,
      },
      evidence: evidenceList,
    };
  } catch {
    evidenceList.push({
      id: evidenceId,
      source_type: "hackathon_submission",
      source_ref: link,
      quote_or_fact: `Network fetch failed for claimed project link: "${link}".`,
      extracted_at: new Date().toISOString(),
    });

    return {
      verified: {
        ...claim,
        url_verified: false,
        source_platform: platform,
      },
      evidence: evidenceList,
    };
  }
}

export async function buildHackathonDossier(
  candidateId: string,
  claims: HackathonClaim[]
): Promise<HackathonEvidenceDossier> {
  const verifiedClaims: VerifiedHackathonClaim[] = [];
  const allEvidence: Evidence[] = [];

  for (const claim of claims) {
    const { verified, evidence } = await verifyHackathonClaim(candidateId, claim);
    verifiedClaims.push(verified);
    allEvidence.push(...evidence);
  }

  return {
    candidateId,
    claims: verifiedClaims,
    evidence: allEvidence,
  };
}
