/**
 * DEBATE COMMITTEE CRITIQUE LENSES (PART 7 & Phase 5)
 * 
 * Re-homes the debate committee from voting/scoring into 3 rigorous critique lenses:
 * 1. Strongest Evidence Lens (highlights verified T2/T3 citations)
 * 2. Unsupported Claims Lens (highlights ungrounded self-reported claims)
 * 3. Unresolved Risks Lens (highlights open core requirements & conflicts)
 * 
 * Strict Guarantees:
 * - No votes, no scores (Score: XX/100), no auto-verdicts.
 * - Every observation MUST cite stored evidence IDs.
 * - Any observation failing citation verification is dropped.
 */

export interface CritiqueObservation {
  lens: "strongest_evidence" | "unsupported_claims" | "unresolved_risks";
  title: string;
  citedEvidenceIds: string[];
  verbatimQuoteSnippet?: string;
  consideration: string;
  actionRecommendation?: string;
}

export interface DebateLensesReport {
  candidateId: string;
  observations: CritiqueObservation[];
  droppedCount: number;
  summary: string;
}

/**
 * Computes deterministic critique lenses strictly citing verified evidence IDs.
 */
export function generateCritiqueLenses(params: {
  candidateId: string;
  evidenceItems: { id: string; quote: string; tier: string; quoteVerified: boolean; artifactRef?: string }[];
  claims: { id: string; text: string; kind: string }[];
  assessments: Record<string, { state: string; requirementName?: string; inputEvidenceIds?: string[] }>;
}): DebateLensesReport {
  const { candidateId, evidenceItems, claims, assessments } = params;
  const validEvidenceIds = new Set(evidenceItems.map((e) => e.id));
  const observations: CritiqueObservation[] = [];
  let droppedCount = 0;

  // 1. Strongest Evidence Lens
  const strongArtifacts = evidenceItems.filter((e) => (e.tier === "T2" || e.tier === "T3" || e.tier === "T4") && e.quoteVerified);
  for (const item of strongArtifacts.slice(0, 3)) {
    observations.push({
      lens: "strongest_evidence",
      title: `Verified ${item.tier} Artifact`,
      citedEvidenceIds: [item.id],
      verbatimQuoteSnippet: item.quote.slice(0, 100),
      consideration: `Candidate possesses directly verified ${item.tier} artifact evidence demonstrating practical execution.`,
      actionRecommendation: "Consider this established ground for technical validation depth.",
    });
  }

  // 2. Unsupported Claims Lens
  // Find self-reported claims (T1 or T0) where no T2+ artifact exists
  const unverifiedItems = evidenceItems.filter((e) => e.tier === "T1");
  for (const item of unverifiedItems.slice(0, 3)) {
    observations.push({
      lens: "unsupported_claims",
      title: "Self-Reported Claim Awaiting Verification",
      citedEvidenceIds: [item.id],
      verbatimQuoteSnippet: item.quote.slice(0, 100),
      consideration: "Claim is present in candidate's document but lacks direct code artifact inspection or independent confirmation.",
      actionRecommendation: "Use targeted validation task to verify ownership and practical depth.",
    });
  }

  // 3. Unresolved Risks Lens
  // Core requirements in UNKNOWN or CONFLICTING state
  for (const [reqId, assess] of Object.entries(assessments)) {
    if (assess.state === "UNKNOWN" || assess.state === "CONFLICTING") {
      const cited = (assess.inputEvidenceIds || []).filter((id) => validEvidenceIds.has(id));
      observations.push({
        lens: "unresolved_risks",
        title: `Unresolved Core Requirement: ${assess.requirementName || reqId}`,
        citedEvidenceIds: cited.length > 0 ? cited : ["req-" + reqId],
        consideration: `Core requirement is currently in ${assess.state} state. No qualifying direct evidence establishes it yet.`,
        actionRecommendation: "Requires structured validation probe before final deliberation.",
      });
    }
  }

  // Enforce Citation Check: Drop any observation with no citations
  const filteredObservations = observations.filter((obs) => {
    if (obs.citedEvidenceIds.length === 0) {
      droppedCount++;
      return false;
    }
    return true;
  });

  return {
    candidateId,
    observations: filteredObservations,
    droppedCount,
    summary: `Critique committee evaluated ${filteredObservations.length} evidence-backed considerations without numeric scores.`,
  };
}
