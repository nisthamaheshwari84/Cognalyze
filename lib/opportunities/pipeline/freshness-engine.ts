/**
 * COGNALYZE OPPORTUNITY INTELLIGENCE — FRESHNESS ENGINE
 * 
 * Manages the lifecycle of discovered opportunities:
 * DISCOVERED -> ACTIVE -> UPDATED -> STALE -> EXPIRED
 * 
 * Rules:
 * 1. Never knowingly recommend expired opportunities.
 * 2. Explicit employer closing dates override generic heuristics.
 * 3. Human-readable verification: "Verified today", "Verified 2 hours ago".
 * 4. Urgency computation: "Closes tomorrow", "Closing in 3 days".
 */

import { CanonicalOpportunity, FreshnessState, OpportunityLifecycleStatus } from "../types";

export class OpportunityFreshnessEngine {
  /**
   * Evaluates and updates the freshness and lifecycle status of an opportunity.
   */
  public static evaluateFreshness(opp: CanonicalOpportunity): {
    status: OpportunityLifecycleStatus;
    freshness: FreshnessState;
    isExpired: boolean;
    verificationLabel: string;
    urgencyLabel?: string;
  } {
    const now = Date.now();

    // 0. Check explicit REMOVED status
    if (opp.status === "REMOVED") {
      return {
        status: "REMOVED",
        freshness: "EXPIRED",
        isExpired: true,
        verificationLabel: "Removed by source",
        urgencyLabel: "No longer available"
      };
    }

    // 1. Check explicit deadline
    if (opp.deadline) {
      const deadlineMs = new Date(opp.deadline).getTime();
      if (!isNaN(deadlineMs) && deadlineMs < now) {
        return {
          status: "EXPIRED",
          freshness: "EXPIRED",
          isExpired: true,
          verificationLabel: "Expired",
          urgencyLabel: "Deadline passed"
        };
      }
    }

    // 2. Check posted date
    const postedMs = opp.postedAt ? new Date(opp.postedAt).getTime() : now;
    const daysSincePosted = (now - postedMs) / (1000 * 60 * 60 * 24);

    let freshness: FreshnessState = "ACTIVE";
    let status: OpportunityLifecycleStatus = "ACTIVE";

    if (daysSincePosted < 3) {
      freshness = "FRESH";
      status = "ACTIVE";
    } else if (daysSincePosted <= 14) {
      freshness = "ACTIVE";
      status = "ACTIVE";
    } else if (daysSincePosted <= 30) {
      freshness = "AGING";
      status = "ACTIVE";
    } else {
      freshness = "STALE";
      status = "STALE";
    }

    // 3. Compute verification label
    const verifiedMs = opp.lastVerifiedAt ? new Date(opp.lastVerifiedAt).getTime() : now;
    const hoursSinceVerified = Math.max(0, (now - verifiedMs) / (1000 * 60 * 60));

    let verificationLabel = "Verified today";
    if (hoursSinceVerified < 1) {
      verificationLabel = "Verified just now";
    } else if (hoursSinceVerified < 24) {
      verificationLabel = `Verified ${Math.floor(hoursSinceVerified)}h ago`;
    } else if (hoursSinceVerified < 48) {
      verificationLabel = "Verified yesterday";
    } else {
      verificationLabel = `Verified ${Math.floor(hoursSinceVerified / 24)}d ago`;
    }

    // 4. Compute urgency label if deadline exists
    let urgencyLabel: string | undefined = undefined;
    if (opp.deadline) {
      const deadlineMs = new Date(opp.deadline).getTime();
      const daysLeft = (deadlineMs - now) / (1000 * 60 * 60 * 24);
      if (daysLeft <= 1) {
        urgencyLabel = "Closes today!";
      } else if (daysLeft <= 2) {
        urgencyLabel = "Closes tomorrow!";
      } else if (daysLeft <= 7) {
        urgencyLabel = `Closing in ${Math.ceil(daysLeft)} days`;
      }
    }

    return {
      status,
      freshness,
      isExpired: false,
      verificationLabel,
      urgencyLabel
    };
  }

  /**
   * Filters out stale/expired opportunities from the active recommendation pipeline.
   */
  public static filterActiveOpportunities(opportunities: CanonicalOpportunity[]): CanonicalOpportunity[] {
    return opportunities.filter(opp => {
      const evaluation = this.evaluateFreshness(opp);
      return !evaluation.isExpired && evaluation.status !== "EXPIRED";
    });
  }
}
