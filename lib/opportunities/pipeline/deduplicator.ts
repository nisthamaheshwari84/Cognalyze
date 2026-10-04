/**
 * COGNALYZE OPPORTUNITY INTELLIGENCE — MULTI-SOURCE DEDUPLICATION ENGINE
 * 
 * Solves the multi-source listing duplication problem:
 * The same hackathon or role may appear on:
 * - Unstop
 * - Devpost
 * - Devfolio
 * - MLH
 * - IIT / University portal
 * - Direct Company Career page
 * 
 * Principle: Cognalyze must NOT show five separate cards for the same opportunity.
 * Merges duplicates into ONE Canonical Opportunity, preserving:
 * - Multiple source instances (sourceInstances) with full provenance
 * - Multi-source attribution
 * - Preference for official authoritative application URLs over aggregators
 */

import { CanonicalOpportunity, SourceInstance, OpportunitySourceType } from "../types";

export class OpportunityDeduplicator {
  /**
   * Cleans an organizer or company name for fuzzy matching.
   */
  public static cleanOrgName(name: string = ""): string {
    return name
      .toLowerCase()
      .replace(/\(via\s+[a-z0-9]+\)/gi, "")
      .replace(/\b(ltd|pvt|inc|corp|technologies|solutions|foundation|community|university|institute)\b/gi, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  /**
   * Cleans a title for fuzzy cross-source matching.
   */
  public static cleanTitle(title: string = ""): string {
    return title
      .toLowerCase()
      .replace(/\s*—.*$/, "") // Remove dash subtitles
      .replace(/\s*-\s*.*$/, "")
      .replace(/\b(annual|flagship|campus|hiring|challenge|sprint|edition|track|hackathon)\b/gi, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  /**
   * Normalizes an application/source URL for direct URL deduplication.
   */
  public static normalizeUrl(url: string = ""): string {
    try {
      const parsed = new URL(url);
      return (parsed.hostname + parsed.pathname).toLowerCase().replace(/\/$/, "");
    } catch {
      return url.toLowerCase().trim().replace(/\/$/, "");
    }
  }

  /**
   * Generates primary identity keys for fast lookup.
   */
  public static generateIdentityKey(opp: CanonicalOpportunity): string {
    const org = this.cleanOrgName(opp.organizer || opp.companyName);
    const title = this.cleanTitle(opp.normalizedTitle || opp.title);
    return `${org}:${title}`;
  }

  /**
   * Priority score for authoritative application link selection.
   */
  private static getSourceAuthoritativeness(type: OpportunitySourceType): number {
    switch (type) {
      case "COMPANY_CAREER": return 100;
      case "ATS": return 90;
      case "IIT": return 85;
      case "UNIVERSITY": return 80;
      case "UNSTOP": return 75;
      case "DEVFOLIO": return 75;
      case "DEVPOST": return 75;
      case "MLH": return 75;
      case "HACK2SKILL": return 70;
      case "STARTUP": return 65;
      case "JOB_API": return 50;
      case "ADMIN_IMPORT": return 95;
      default: return 60;
    }
  }

  /**
   * Deduplicates a list of canonical opportunities across multiple sources.
   */
  public static deduplicate(opportunities: CanonicalOpportunity[]): {
    uniqueOpportunities: CanonicalOpportunity[];
    duplicatesMergedCount: number;
  } {
    const canonicalMap = new Map<string, CanonicalOpportunity>();
    const urlToKeyMap = new Map<string, string>();
    let duplicatesMerged = 0;

    for (const opp of opportunities) {
      const primaryKey = this.generateIdentityKey(opp);
      const normApplyUrl = this.normalizeUrl(opp.applicationUrl);
      const normSourceUrl = this.normalizeUrl(opp.sourceUrl);

      // Check if this opportunity matches an existing one by URL or by title+org
      let matchedKey: string | undefined = undefined;

      if (canonicalMap.has(primaryKey)) {
        matchedKey = primaryKey;
      } else if (normApplyUrl && urlToKeyMap.has(normApplyUrl)) {
        matchedKey = urlToKeyMap.get(normApplyUrl);
      } else if (normSourceUrl && urlToKeyMap.has(normSourceUrl)) {
        matchedKey = urlToKeyMap.get(normSourceUrl);
      }

      if (!matchedKey) {
        // Brand new unique canonical opportunity
        const sourceInstances: SourceInstance[] = opp.sourceInstances?.length
          ? opp.sourceInstances
          : [
              {
                source: opp.source,
                sourceType: opp.sourceType,
                sourceUrl: opp.sourceUrl,
                applicationUrl: opp.applicationUrl,
                retrievedAt: opp.createdAt || new Date().toISOString(),
                lastVerifiedAt: opp.lastVerifiedAt || new Date().toISOString()
              }
            ];

        canonicalMap.set(primaryKey, { ...opp, sourceInstances });
        if (normApplyUrl) urlToKeyMap.set(normApplyUrl, primaryKey);
        if (normSourceUrl) urlToKeyMap.set(normSourceUrl, primaryKey);
      } else {
        // Duplicate detected across sources — merge and record provenance!
        const existing = canonicalMap.get(matchedKey)!;
        duplicatesMerged++;

        const currentInstance: SourceInstance = {
          source: opp.source,
          sourceType: opp.sourceType,
          sourceUrl: opp.sourceUrl,
          applicationUrl: opp.applicationUrl,
          retrievedAt: opp.createdAt || new Date().toISOString(),
          lastVerifiedAt: opp.lastVerifiedAt || new Date().toISOString()
        };

        const mergedInstances = [...(existing.sourceInstances || []), currentInstance];
        // Deduplicate source instances by source name + source URL to retain multiple platforms
        const uniqueInstancesMap = new Map<string, SourceInstance>();
        for (const inst of mergedInstances) {
          const uKey = `${inst.source}:${this.normalizeUrl(inst.sourceUrl || inst.applicationUrl)}`;
          if (!uniqueInstancesMap.has(uKey)) {
            uniqueInstancesMap.set(uKey, inst);
          }
        }
        const finalizedInstances = Array.from(uniqueInstancesMap.values());

        // Select the most authoritative source for primary display
        const oppAuth = this.getSourceAuthoritativeness(opp.sourceType);
        const existingAuth = this.getSourceAuthoritativeness(existing.sourceType);
        const prefersOpp = oppAuth > existingAuth;

        const primarySource = prefersOpp ? opp.source : existing.source;
        const primarySourceType = prefersOpp ? opp.sourceType : existing.sourceType;
        const primarySourceUrl = prefersOpp ? opp.sourceUrl : existing.sourceUrl;
        const primaryApplicationUrl = prefersOpp ? opp.applicationUrl : existing.applicationUrl;

        // Resolve deadline: if incoming opportunity has a deadline and is newer or existing had none, take incoming
        const existingTime = new Date(existing.updatedAt || existing.postedAt || 0).getTime();
        const incomingTime = new Date(opp.updatedAt || opp.postedAt || 0).getTime();
        const isIncomingNewer = incomingTime >= existingTime;

        const resolvedDeadline = opp.deadline && (!existing.deadline || isIncomingNewer)
          ? opp.deadline
          : (existing.deadline || opp.deadline || null);

        const resolvedDescription = isIncomingNewer && opp.description
          ? opp.description
          : (existing.description.length >= opp.description.length ? existing.description : opp.description);

        canonicalMap.set(matchedKey, {
          ...existing,
          source: primarySource,
          sourceType: primarySourceType,
          sourceUrl: primarySourceUrl,
          applicationUrl: primaryApplicationUrl,
          deadline: resolvedDeadline,
          sourceInstances: finalizedInstances,
          description: resolvedDescription,
          lastVerifiedAt: new Date().toISOString(),
          prize: existing.prize || opp.prize,
          teamSize: existing.teamSize || opp.teamSize,
          requiredSkills: Array.from(new Set([...existing.requiredSkills, ...opp.requiredSkills])),
          preferredSkills: Array.from(new Set([...existing.preferredSkills, ...opp.preferredSkills])),
          tags: Array.from(new Set([...(existing.tags || []), ...(opp.tags || [])]))
        });

        if (normApplyUrl) urlToKeyMap.set(normApplyUrl, matchedKey);
        if (normSourceUrl) urlToKeyMap.set(normSourceUrl, matchedKey);
      }
    }

    return {
      uniqueOpportunities: Array.from(canonicalMap.values()),
      duplicatesMergedCount: duplicatesMerged
    };
  }
}
