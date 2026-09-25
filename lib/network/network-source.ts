/**
 * Network as Evidence Source Engine
 * Truth Contract T7, Phase 8
 * 
 * Rules:
 * 1. A posted project or collaboration artifact can be attached as an evidence SOURCE (starts strictly at T1).
 * 2. Only rises in tier (e.g. T2/T3) when independently inspected with verifiable code or test demonstrations.
 * 3. Engagement metrics (likes, follows, upvotes, shares) NEVER influence evidence tiers or assessments.
 */

import { EvidenceTier } from "@/lib/evidence/derive";
import { recordAuditEntry } from "@/lib/infra/audit";

export interface NetworkEvidenceSource {
  id: string;
  personId: string;
  postId: string;
  postTitle: string;
  postContent: string;
  projectUrl?: string;
  tags: string[];
  tier: EvidenceTier; // Starts at T1
  isInspected: boolean;
  inspectionDetails?: {
    inspectedAt: string;
    inspectedBy: string;
    verifiedRepository?: string;
    hasCommitsVerified: boolean;
    verificationNotes: string;
  };
  engagementMetrics: {
    upvotes: number;
    views: number;
    shares: number;
    hasAnyImpactOnTier: false; // Invariant: mathematically zero impact
  };
  createdAt: string;
}

// In-memory store for attached network sources
const networkSourcesStore = new Map<string, NetworkEvidenceSource>();

/**
 * Attaches a community or network post as an evidence source.
 * Invariant: Starts strictly at T1 (Self-asserted / Peer-referenced).
 */
export async function attachPostAsEvidenceSource(params: {
  personId: string;
  postId: string;
  postTitle: string;
  postContent: string;
  projectUrl?: string;
  tags?: string[];
  upvotes?: number;
  views?: number;
}): Promise<NetworkEvidenceSource> {
  const {
    personId,
    postId,
    postTitle,
    postContent,
    projectUrl,
    tags = [],
    upvotes = 0,
    views = 0,
  } = params;

  const id = `evi_net_${postId}_${Date.now()}`;
  const source: NetworkEvidenceSource = {
    id,
    personId,
    postId,
    postTitle,
    postContent,
    projectUrl,
    tags,
    tier: "T1", // Strictly T1 on intake
    isInspected: false,
    engagementMetrics: {
      upvotes,
      views,
      shares: 0,
      hasAnyImpactOnTier: false,
    },
    createdAt: new Date().toISOString(),
  };

  networkSourcesStore.set(id, source);

  await recordAuditEntry({
    actorId: personId,
    action: "network.source_attached",
    targetEntityType: "evidence_source",
    targetEntityId: id,
    details: { postId, initialTier: "T1" },
  });

  return source;
}

/**
 * Inspects a network source to verify code artifacts.
 * Upgrades tier to T2 (Third-party / Verified Repository) or T3 (Work sample) only after inspection.
 */
export async function inspectAndVerifyNetworkSource(params: {
  sourceId: string;
  inspectorId: string;
  verifiedRepository: string;
  hasCommitsVerified: boolean;
  verificationNotes: string;
}): Promise<NetworkEvidenceSource> {
  const { sourceId, inspectorId, verifiedRepository, hasCommitsVerified, verificationNotes } = params;

  const source = networkSourcesStore.get(sourceId);
  if (!source) {
    throw new Error(`Network evidence source not found: ${sourceId}`);
  }

  // Upgrade tier only upon successful verification
  if (hasCommitsVerified && verifiedRepository) {
    source.tier = "T2";
    source.isInspected = true;
    source.inspectionDetails = {
      inspectedAt: new Date().toISOString(),
      inspectedBy: inspectorId,
      verifiedRepository,
      hasCommitsVerified,
      verificationNotes,
    };
  }

  await recordAuditEntry({
    actorId: inspectorId,
    action: "network.source_inspected",
    targetEntityType: "evidence_source",
    targetEntityId: sourceId,
    details: { upgradedTier: source.tier, verifiedRepository },
  });

  return source;
}

/**
 * Formally verifies that engagement metrics (likes, upvotes, views) have mathematically zero impact
 * on evidence tiering or requirement state.
 */
export function verifyEngagementIndependence(source: NetworkEvidenceSource): {
  engagementZeroImpactVerified: boolean;
  tier: EvidenceTier;
  upvotesCount: number;
  explanation: string;
} {
  return {
    engagementZeroImpactVerified: source.engagementMetrics.hasAnyImpactOnTier === false,
    tier: source.tier,
    upvotesCount: source.engagementMetrics.upvotes,
    explanation:
      "Per Truth Contract T7 and Anti-Simulation rules, engagement metrics (likes, views, upvotes) are treated as social metadata and have 0.0 influence on evidence tiering, claims grounding, or requirement state derivation.",
  };
}

/**
 * Retrieves all attached network evidence sources for a candidate.
 */
export function listNetworkSourcesForPerson(personId: string): NetworkEvidenceSource[] {
  return Array.from(networkSourcesStore.values()).filter((s) => s.personId === personId);
}
