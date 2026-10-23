/**
 * lib/opportunities/pipeline/deduplicator.ts
 * 
 * 6-STAGE SAFE DEDUPLICATION & AMBIGUITY PRESERVATION ENGINE
 * 
 * Principles:
 * 1. Deterministic Multi-Tier Resolution: Matches on external IDs, canonical URLs, and exact org + title.
 * 2. Zero Unsafe Fuzzy Auto-Merging: Similar or ambiguous titles are NEVER automatically merged.
 * 3. Provenance Preservation: Multiple source sightings attach to the canonical record as source records.
 * 4. Auditable Reviews: Ambiguous matches generate pending records in `opportunity_duplicate_reviews`.
 */

import { CanonicalOpportunity, SourceInstance, OpportunitySourceType } from "../types";

export interface DuplicateReviewCandidate {
  canonicalOpportunityId: string;
  candidateOpportunityId: string;
  similarityScore: number;
  matchReasons: string[];
  conflicts: Record<string, any>;
}

export class OpportunityDeduplicator {
  /**
   * Normalizes an organization name conservatively.
   */
  public static cleanOrgName(name: string = ""): string {
    return name
      .toLowerCase()
      .replace(/\(via\s+[a-z0-9]+\)/gi, "")
      .replace(/\b(llc|inc|corp|ltd|pvt|technologies|solutions)\b/gi, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  /**
   * Normalizes title without removing distinguishing levels (e.g. preserves 'Senior', 'Intern', 'Lead').
   */
  public static cleanTitle(title: string = ""): string {
    return title
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Normalizes URL by removing tracking tokens, query garbage, and hash fragments.
   */
  public static normalizeUrl(url: string = ""): string {
    try {
      const parsed = new URL(url);
      const trackingParams = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "source", "fbclid", "gclid", "gh_src"];
      for (const p of trackingParams) {
        parsed.searchParams.delete(p);
      }
      parsed.hash = "";
      return (parsed.hostname + parsed.pathname).toLowerCase().replace(/\/$/, "");
    } catch {
      return url.toLowerCase().trim().replace(/\/$/, "");
    }
  }

  /**
   * Convenience deduplication across an array of opportunities.
   */
  public static deduplicate(opportunities: CanonicalOpportunity[]): {
    uniqueOpportunities: CanonicalOpportunity[];
    duplicatesMergedCount: number;
    duplicateReviews: DuplicateReviewCandidate[];
  } {
    const res = this.deduplicateStream(opportunities, []);
    return {
      uniqueOpportunities: res.mergedCatalog,
      duplicatesMergedCount: opportunities.length - res.mergedCatalog.length,
      duplicateReviews: res.duplicateReviews,
    };
  }

  /**
   * Deduplicates a newly ingested stream against an existing canonical catalog.
   * Returns:
   * - mergedCatalog: Updated canonical catalog
   * - duplicateReviews: Ambiguous candidates requiring human review
   */
  public static deduplicateStream(
    incoming: CanonicalOpportunity[],
    existingCatalog: CanonicalOpportunity[]
  ): {
    mergedCatalog: CanonicalOpportunity[];
    duplicateReviews: DuplicateReviewCandidate[];
    stats: { exactSourceMatches: number; urlMatches: number; deterministicMerges: number; ambiguousFlagged: number; newDisjoint: number };
  } {
    const catalogMap = new Map<string, CanonicalOpportunity>();
    for (const item of existingCatalog) {
      catalogMap.set(item.id, { ...item });
    }

    const duplicateReviews: DuplicateReviewCandidate[] = [];
    const stats = {
      exactSourceMatches: 0,
      urlMatches: 0,
      deterministicMerges: 0,
      ambiguousFlagged: 0,
      newDisjoint: 0,
    };

    // Indexes for fast exact lookups
    const externalKeyIndex = new Map<string, string>(); // sourceId:externalId -> oppId
    const reqIndex = new Map<string, string>(); // org:req:id -> oppId
    const canonicalUrlIndex = new Map<string, string>(); // cleanUrl -> oppId
    const exactDeterministicIndex = new Map<string, string>(); // org:title:category:loc -> oppId

    for (const [id, opp] of catalogMap.entries()) {
      if (opp.sourceId) {
        externalKeyIndex.set(`${opp.source}:${opp.sourceId}`, id);
      }
      if (opp.canonicalOpportunityId) {
        externalKeyIndex.set(`canon:${opp.canonicalOpportunityId}`, id);
      }
      const cleanOrg = this.cleanOrgName(opp.companyName);
      const reqId = opp.sourceMetadata?.requisitionId;
      if (reqId) {
        reqIndex.set(`${cleanOrg}:req:${reqId}`, id);
      }

      const cleanUrl = this.normalizeUrl(opp.canonicalUrl || opp.sourceUrl);
      if (cleanUrl) canonicalUrlIndex.set(cleanUrl, id);

      const detKey = `${cleanOrg}:${this.cleanTitle(opp.title)}:${opp.opportunityType || ""}:${(opp.location || "").toLowerCase().trim()}`;
      exactDeterministicIndex.set(detKey, id);
    }

    for (const incomingOpp of incoming) {
      const cleanOrg = this.cleanOrgName(incomingOpp.companyName);

      // Stage 1: Exact Source Key Match (same source + external ID, or same canonicalOpportunityId)
      const externalKey = incomingOpp.sourceId ? `${incomingOpp.source}:${incomingOpp.sourceId}` : null;
      const canonKey = incomingOpp.canonicalOpportunityId ? `canon:${incomingOpp.canonicalOpportunityId}` : null;
      const matchedExternalId = (externalKey && externalKeyIndex.has(externalKey)) 
        ? externalKeyIndex.get(externalKey)!
        : (canonKey && externalKeyIndex.has(canonKey))
          ? externalKeyIndex.get(canonKey)!
          : null;

      if (matchedExternalId && catalogMap.has(matchedExternalId)) {
        const target = catalogMap.get(matchedExternalId)!;
        this.updateExistingRecord(target, incomingOpp);
        stats.exactSourceMatches++;
        continue;
      }

      // Stage 2: Canonical Normalized URL Match
      const cleanUrl = this.normalizeUrl(incomingOpp.canonicalUrl || incomingOpp.sourceUrl);
      if (cleanUrl && canonicalUrlIndex.has(cleanUrl)) {
        const targetId = canonicalUrlIndex.get(cleanUrl)!;
        const target = catalogMap.get(targetId)!;
        this.attachSourceInstance(target, incomingOpp);
        stats.urlMatches++;
        continue;
      }

      // Stage 3: Organization + Requisition ID Match
      const incomingReqId = incomingOpp.sourceMetadata?.requisitionId;
      if (incomingReqId && reqIndex.has(`${cleanOrg}:req:${incomingReqId}`)) {
        const targetId = reqIndex.get(`${cleanOrg}:req:${incomingReqId}`)!;
        const target = catalogMap.get(targetId)!;
        this.attachSourceInstance(target, incomingOpp);
        stats.deterministicMerges++;
        continue;
      }

      // Stage 4: Exact High-Confidence Deterministic Match (Same Org + Exact Title + Same Category + Same Location)
      const detKey = `${cleanOrg}:${this.cleanTitle(incomingOpp.title)}:${incomingOpp.opportunityType || ""}:${(incomingOpp.location || "").toLowerCase().trim()}`;
      if (exactDeterministicIndex.has(detKey)) {
        const targetId = exactDeterministicIndex.get(detKey)!;
        const target = catalogMap.get(targetId)!;
        this.attachSourceInstance(target, incomingOpp);
        stats.deterministicMerges++;
        continue;
      }

      // Stage 5: Ambiguous / Similar Title Match
      // Check if same organization has a very similar title but differing level/details
      let foundAmbiguous: { target: CanonicalOpportunity; score: number } | null = null;

      for (const existing of catalogMap.values()) {
        if (this.cleanOrgName(existing.companyName) === cleanOrg) {
          const sim = calculateStringSimilarity(this.cleanTitle(existing.title), this.cleanTitle(incomingOpp.title));
          if (sim >= 0.75 && sim < 1.0) {
            foundAmbiguous = { target: existing, score: sim };
            break;
          }
        }
      }

      if (foundAmbiguous) {
        // DO NOT AUTO-MERGE!
        // Record as separate opportunity with 'needs_review' status and log duplicate review candidate
        incomingOpp.status = "needs_review";
        catalogMap.set(incomingOpp.id, incomingOpp);

        duplicateReviews.push({
          canonicalOpportunityId: foundAmbiguous.target.id,
          candidateOpportunityId: incomingOpp.id,
          similarityScore: foundAmbiguous.score,
          matchReasons: ["Same organization", `Title similarity: ${(foundAmbiguous.score * 100).toFixed(0)}%`],
          conflicts: {
            canonicalTitle: foundAmbiguous.target.title,
            candidateTitle: incomingOpp.title,
            canonicalLocation: foundAmbiguous.target.location,
            candidateLocation: incomingOpp.location,
          },
        });
        stats.ambiguousFlagged++;
        continue;
      }

      // Stage 6: Disjoint Opportunity -> Add as new
      catalogMap.set(incomingOpp.id, incomingOpp);
      if (externalKey) externalKeyIndex.set(externalKey, incomingOpp.id);
      if (cleanUrl) canonicalUrlIndex.set(cleanUrl, incomingOpp.id);
      exactDeterministicIndex.set(detKey, incomingOpp.id);
      stats.newDisjoint++;
    }

    return {
      mergedCatalog: Array.from(catalogMap.values()),
      duplicateReviews,
      stats,
    };
  }

  private static updateExistingRecord(target: CanonicalOpportunity, incoming: CanonicalOpportunity) {
    target.lastFetchedAt = new Date().toISOString();
    if (incoming.deadline) target.deadline = incoming.deadline;
    if (incoming.description) target.description = incoming.description;
    if (incoming.updatedAt) target.updatedAt = incoming.updatedAt;
    if (incoming.lastVerifiedAt) target.lastVerifiedAt = incoming.lastVerifiedAt;
    target.applicationUrl = incoming.applicationUrl || target.applicationUrl;
    this.attachSourceInstance(target, incoming);
  }

  private static attachSourceInstance(target: CanonicalOpportunity, incoming: CanonicalOpportunity) {
    if (incoming.deadline) {
      target.deadline = incoming.deadline;
    }
    if (incoming.description && incoming.description.length > (target.description || "").length) {
      target.description = incoming.description;
    }
    if (incoming.updatedAt) {
      target.updatedAt = incoming.updatedAt;
    }
    if (!target.sourceUrls) target.sourceUrls = [target.sourceUrl];
    if (!target.sourceUrls.includes(incoming.sourceUrl)) {
      target.sourceUrls.push(incoming.sourceUrl);
    }

    if (!target.sourceInstances) {
      target.sourceInstances = [
        {
          source: target.source,
          sourceType: target.sourceType,
          sourceUrl: target.sourceUrl,
          applicationUrl: target.applicationUrl,
          retrievedAt: target.createdAt || new Date().toISOString(),
          lastVerifiedAt: target.lastVerifiedAt || new Date().toISOString(),
        },
      ];
    }

    const alreadyPresent = target.sourceInstances.some(s => s.sourceUrl === incoming.sourceUrl);
    if (!alreadyPresent) {
      target.sourceInstances.push({
        source: incoming.source,
        sourceType: incoming.sourceType,
        sourceUrl: incoming.sourceUrl,
        applicationUrl: incoming.applicationUrl,
        retrievedAt: new Date().toISOString(),
        lastVerifiedAt: incoming.lastVerifiedAt || new Date().toISOString(),
      });
    }
  }
}

/**
 * Levenshtein-based string similarity calculation (0.0 to 1.0)
 */
function calculateStringSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longerLength - editDistance) / longerLength;
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}
