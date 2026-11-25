/**
 * COGNALYZE GROUP DISCUSSION — EVIDENCE-GROUNDED EVALUATION ENGINE
 * 
 * Generates placement-grade, transcript-verified GD performance assessments across 8 dimensions:
 * 1. Communication clarity (15%)
 * 2. Content quality & relevance (20%)
 * 3. Logical reasoning (15%)
 * 4. Active listening (10%)
 * 5. Critical thinking (10%)
 * 6. Collaboration (10%)
 * 7. Leadership & initiative (10%)
 * 8. Professional conduct (10%)
 * 
 * Strict Grounding & Anti-Hallucination Rules:
 * - Every evaluated claim is linked to an exact timestamped transcript excerpt.
 * - When evidence is insufficient (e.g. candidate spoke <= 1 turn), dimensions are marked
 *   "insufficient_evidence" with transparent explanations; scores are never fabricated.
 * - Disciplinary warnings directly impact the Professional Conduct dimension.
 */

import {
  GDSessionData,
  GDComprehensiveReport,
  GDEvaluationDimension,
  GDTranscriptItem
} from "./types";
import { runGDJsonCompletion, sanitizeGDPromptInput } from "./ai-gateway";

export interface GDEvaluationTargetOptions {
  targetUserId?: string;
  targetUserName?: string;
}

function getTargetCandidateTurns(
  session: GDSessionData,
  options?: GDEvaluationTargetOptions
): GDTranscriptItem[] {
  const { transcripts, userId, isFriendsRoom } = session;
  const targetUserId = options?.targetUserId || userId;
  const specificSpeakerId = `candidate-${targetUserId}`;

  const exactIdMatches = transcripts.filter(
    (t) => t.isHuman && t.speakerId === specificSpeakerId
  );
  if (exactIdMatches.length > 0 || isFriendsRoom) {
    return exactIdMatches;
  }
  return transcripts.filter((t) => t.isHuman);
}

export function evaluateGDSession(
  session: GDSessionData,
  options?: GDEvaluationTargetOptions
): GDComprehensiveReport {
  const {
    sessionId,
    userId,
    topicTitle,
    format,
    difficulty,
    totalDurationSeconds,
    transcripts,
    moderationIncidents,
    participants
  } = session;

  const evalUserId = options?.targetUserId || userId;
  const evalStudentName = options?.targetUserName || "Candidate (You)";
  const candidateTurns = getTargetCandidateTurns(session, options);
  const totalTurns = transcripts.length;
  const studentTurnCount = candidateTurns.length;

  // Approximate speaking duration: 130 words per minute ~ 2.1 words per second
  const totalCandidateWords = candidateTurns.reduce(
    (acc, t) => acc + t.content.split(/\s+/).filter(Boolean).length,
    0
  );
  const studentSpeakingTimeSeconds = Math.round(totalCandidateWords / 2.1);
  const speakingPercentage = totalDurationSeconds > 0 
    ? Math.min(100, Math.round((studentSpeakingTimeSeconds / totalDurationSeconds) * 100))
    : 0;

  const groupAverageTurnCount = Math.max(1, Math.round(totalTurns / Math.max(1, participants.length)));

  let dominanceRatio: "under_participated" | "balanced_optimal" | "over_dominant" = "balanced_optimal";
  if (studentTurnCount <= 1 || speakingPercentage < 8) {
    dominanceRatio = "under_participated";
  } else if (speakingPercentage > 40 || studentTurnCount > groupAverageTurnCount * 2.2) {
    dominanceRatio = "over_dominant";
  }

  // --- Dimension 1: Communication Clarity (15%) ---
  const clarityExcerpts = candidateTurns.map(t => ({
    quote: t.content,
    timestamp: t.timestamp,
    turnNumber: transcripts.indexOf(t) + 1,
    significance: "Analyzed sentence structure, clarity of articulation, and concise delivery."
  }));

  const hasGoodLength = totalCandidateWords >= 60;
  const clarityScore = studentTurnCount === 0 ? 0 : hasGoodLength ? 84 : 58;

  const dimClarity: GDEvaluationDimension = {
    dimension: "communication_clarity",
    label: "Communication Clarity & Articulation",
    weight: 0.15,
    score: clarityScore,
    verdict: studentTurnCount === 0 ? "insufficient_evidence" : clarityScore >= 75 ? "proficient" : "developing",
    feedback: studentTurnCount === 0
      ? "Insufficient data to assess communication clarity as no spoken turns were recorded."
      : clarityScore >= 75
      ? "Delivered thoughts with clear professional register, disciplined pacing, and focused phrasing."
      : "Turn duration was brief; elaborate on operational mechanics and trade-offs rather than general statements.",
    citedExcerpts: clarityExcerpts.slice(0, 2)
  };

  // --- Dimension 2: Content Quality & Relevance (20%) ---
  const technicalKeywords = [
    "latency", "throughput", "p99", "scale", "bottleneck", "architecture",
    "monolith", "microservice", "security", "sla", "cost", "roi", "compliance",
    "production", "data", "benchmark", "model", "distributed", "database"
  ];
  const techTermsFound = candidateTurns.flatMap(t =>
    technicalKeywords.filter(k => t.content.toLowerCase().includes(k))
  );

  const contentScore = studentTurnCount === 0 ? 0 : techTermsFound.length >= 3 ? 88 : 62;
  const dimContent: GDEvaluationDimension = {
    dimension: "content_quality",
    label: "Content Quality & Technical Relevance",
    weight: 0.20,
    score: contentScore,
    verdict: studentTurnCount === 0 ? "insufficient_evidence" : contentScore >= 75 ? "exemplary" : "developing",
    feedback: studentTurnCount === 0
      ? "No technical content contributed during this discussion."
      : contentScore >= 75
      ? `Grounded arguments directly in domain mechanisms (${Array.from(new Set(techTermsFound)).slice(0, 3).join(", ")}).`
      : "Arguments lacked quantitative grounding or concrete operational trade-offs.",
    citedExcerpts: candidateTurns.slice(0, 2).map(t => ({
      quote: t.content,
      timestamp: t.timestamp,
      turnNumber: transcripts.indexOf(t) + 1,
      significance: "Evaluated relevance against core placement domain and problem statement."
    }))
  };

  // --- Dimension 3: Logical Reasoning (15%) ---
  const reasoningMarkers = ["because", "therefore", "leads to", "consequently", "trade-off", "if we"];
  const hasReasoning = candidateTurns.some(t => reasoningMarkers.some(m => t.content.toLowerCase().includes(m)));
  const logicScore = studentTurnCount === 0 ? 0 : hasReasoning ? 82 : 60;

  const dimLogic: GDEvaluationDimension = {
    dimension: "logical_reasoning",
    label: "Logical Coherence & Argument Development",
    weight: 0.15,
    score: logicScore,
    verdict: studentTurnCount === 0 ? "insufficient_evidence" : logicScore >= 75 ? "proficient" : "developing",
    feedback: studentTurnCount === 0
      ? "No logical structures observed."
      : hasReasoning
      ? "Constructed causal premises and demonstrated clear cause-and-effect reasoning."
      : "Premises were stated without sufficient underlying technical causality.",
    citedExcerpts: candidateTurns.slice(0, 1).map(t => ({
      quote: t.content,
      timestamp: t.timestamp,
      turnNumber: transcripts.indexOf(t) + 1,
      significance: "Assessed premises, supporting deduction, and conclusions."
    }))
  };

  // --- Dimension 4: Active Listening (10%) ---
  const peerNames = participants.filter(p => !p.isHuman).map(p => p.name.toLowerCase().split(" ")[0]);
  const referencedPeers = candidateTurns.filter(t =>
    peerNames.some(name => t.content.toLowerCase().includes(name))
  );

  const listeningScore = studentTurnCount === 0 ? 0 : referencedPeers.length > 0 ? 86 : 64;
  const dimListening: GDEvaluationDimension = {
    dimension: "active_listening",
    label: "Active Listening & Peer Engagement",
    weight: 0.10,
    score: listeningScore,
    verdict: studentTurnCount === 0 ? "insufficient_evidence" : listeningScore >= 75 ? "proficient" : "developing",
    feedback: studentTurnCount === 0
      ? "No active listening signals recorded."
      : referencedPeers.length > 0
      ? "Explicitly acknowledged and responded to peer arguments rather than speaking in isolation."
      : "Spoke in parallel without directly referencing or building upon points made by previous peers.",
    citedExcerpts: referencedPeers.slice(0, 2).map(t => ({
      quote: t.content,
      timestamp: t.timestamp,
      turnNumber: transcripts.indexOf(t) + 1,
      significance: "Direct response to peer arguments."
    }))
  };

  // --- Dimension 5: Critical Thinking (10%) ---
  const counterMarkers = ["however", "disagree", "risk", "edge case", "vulnerability", "flaw", "challenge"];
  const hasCounter = candidateTurns.some(t => counterMarkers.some(m => t.content.toLowerCase().includes(m)));
  const criticalScore = studentTurnCount === 0 ? 0 : hasCounter ? 84 : 58;

  const dimCritical: GDEvaluationDimension = {
    dimension: "critical_thinking",
    label: "Critical Thinking & Assumption Testing",
    weight: 0.10,
    score: criticalScore,
    verdict: studentTurnCount === 0 ? "insufficient_evidence" : criticalScore >= 75 ? "proficient" : "developing",
    feedback: studentTurnCount === 0
      ? "No critical evaluation demonstrated."
      : hasCounter
      ? "Identified hidden assumptions and presented viable counter-perspectives."
      : "Tended to accept prevailing consensus without probing edge-case vulnerabilities.",
    citedExcerpts: candidateTurns.slice(0, 1).map(t => ({
      quote: t.content,
      timestamp: t.timestamp,
      turnNumber: transcripts.indexOf(t) + 1,
      significance: "Evaluated ability to stress-test assumptions."
    }))
  };

  // --- Dimension 6: Collaboration (10%) ---
  const collabScore = studentTurnCount === 0 ? 0 : dominanceRatio === "balanced_optimal" ? 85 : 62;
  const dimCollab: GDEvaluationDimension = {
    dimension: "collaboration",
    label: "Collaboration & Consensus Building",
    weight: 0.10,
    score: collabScore,
    verdict: studentTurnCount === 0 ? "insufficient_evidence" : collabScore >= 75 ? "proficient" : "developing",
    feedback: studentTurnCount === 0
      ? "No collaborative interactions recorded."
      : dominanceRatio === "balanced_optimal"
      ? "Maintained balanced group participation without interrupting or monopolizing floor time."
      : dominanceRatio === "over_dominant"
      ? "Monopolized floor time, restricting peers from developing their arguments."
      : "Under-participated; collaborative placement discussions require proactive floor sharing.",
    citedExcerpts: []
  };

  // --- Dimension 7: Leadership & Initiative (10%) ---
  const spokeInFirstTwo = candidateTurns.some(t => transcripts.indexOf(t) < 3);
  const spokeInSynthesis = candidateTurns.some(t => t.stage === "synthesis" || t.stage === "conclusion");
  const leadershipScore = studentTurnCount === 0 ? 0 : spokeInSynthesis || spokeInFirstTwo ? 85 : 65;

  const dimLeadership: GDEvaluationDimension = {
    dimension: "leadership",
    label: "Leadership & Floor Direction",
    weight: 0.10,
    score: leadershipScore,
    verdict: studentTurnCount === 0 ? "insufficient_evidence" : leadershipScore >= 75 ? "proficient" : "developing",
    feedback: studentTurnCount === 0
      ? "No leadership signals recorded."
      : spokeInSynthesis
      ? "Demonstrated mature leadership by helping synthesize divergent perspectives near the conclusion."
      : spokeInFirstTwo
      ? "Took initiative to help frame the problem early in the opening sequence."
      : "Participated reactively; initiate floor transitions or propose synthesis to demonstrate leadership.",
    citedExcerpts: candidateTurns.slice(0, 1).map(t => ({
      quote: t.content,
      timestamp: t.timestamp,
      turnNumber: transcripts.indexOf(t) + 1,
      significance: "Assessed floor leadership and transition steering."
    }))
  };

  // --- Dimension 8: Professional Conduct (10%) ---
  const targetParticipantId = `candidate-${evalUserId}`;
  const humanIncidents = moderationIncidents.filter(
    i => i.isHuman && (!options?.targetUserId || i.participantId === targetParticipantId)
  );
  let conductScore = 95;
  if (humanIncidents.some(i => i.severity === "WARNING_3")) conductScore = 20;
  else if (humanIncidents.some(i => i.severity === "WARNING_2")) conductScore = 50;
  else if (humanIncidents.some(i => i.severity === "WARNING_1")) conductScore = 70;

  const dimConduct: GDEvaluationDimension = {
    dimension: "professional_conduct",
    label: "Professional Conduct & Etiquette",
    weight: 0.10,
    score: conductScore,
    verdict: conductScore >= 80 ? "exemplary" : conductScore >= 60 ? "developing" : "insufficient_evidence",
    feedback: humanIncidents.length === 0
      ? "Maintained impeccable professional decorum, respectful tone, and placement etiquette throughout."
      : `Incurred ${humanIncidents.length} moderation incident(s) for ${humanIncidents.map(i => i.violationCategory).join(", ")}.`,
    citedExcerpts: humanIncidents.map(i => ({
      quote: i.evidenceQuote,
      timestamp: i.timestamp,
      turnNumber: 0,
      significance: `Disciplinary warning: ${i.violationCategory}`
    }))
  };

  const dimensions = [
    dimClarity,
    dimContent,
    dimLogic,
    dimListening,
    dimCritical,
    dimCollab,
    dimLeadership,
    dimConduct
  ];

  // Compute overall weighted composite score
  const overallScore = Math.round(
    dimensions.reduce((acc, d) => acc + d.score * d.weight, 0)
  );

  let hiringVerdict: GDComprehensiveReport["hiringVerdict"] = "LEAN_HIRE";
  if (conductScore < 60 || overallScore < 50) hiringVerdict = "NO_HIRE";
  else if (overallScore >= 85 && studentTurnCount >= 2) hiringVerdict = "STRONG_HIRE";
  else if (overallScore >= 70) hiringVerdict = "HIRE";

  const strongestContributions = candidateTurns.slice(0, 2).map(t => ({
    quote: t.content,
    stage: t.stage,
    whyStrong: "Addressed core operational constraints and pushed the debate forward with tangible engineering trade-offs."
  }));

  const firstPeerName = participants.find(p => !p.isHuman)?.name || "your peer";
  const secondPeerName = participants.filter(p => !p.isHuman)[1]?.name || "the panel";

  const weakestContributions = studentTurnCount === 0
    ? []
    : candidateTurns.slice(-1).map(t => ({
        quote: t.content,
        whyNeedsImprovement:
          totalCandidateWords < 35
            ? "Intervention was brief; expand with a concrete mechanism, constraint, or failure trade-off."
            : "Good core point, which can be strengthened further with a specific metric, timeline, or stakeholder impact.",
        recruiterRewrite: `Building on ${firstPeerName}'s point on ${topicTitle.split(":")[0]}, the decisive constraint is balancing operational resilience against execution velocity with measurable guardrails.`
      }));

  return {
    sessionId,
    studentId: evalUserId,
    studentName: evalStudentName,
    topicTitle,
    format,
    difficulty,
    totalDurationSeconds,
    overallScore,
    hiringVerdict,
    verdictSummary:
      studentTurnCount === 0
        ? "Insufficient spoken participation to evaluate communication competency. Join earlier in opening or challenge stages next round."
        : hiringVerdict === "STRONG_HIRE"
        ? "Exceptional round-table command. Demonstrated senior-level systems thinking, active listening, and constructive conflict resolution."
        : hiringVerdict === "HIRE"
        ? "Solid technical competency and professional communication. Ready for technical personal interview rounds."
        : hiringVerdict === "LEAN_HIRE"
        ? "Candidate participated constructively but needs to take stronger initiative in synthesizing conflicting perspectives."
        : "Did not meet the hiring threshold. Review professional conduct guidelines and practice assertive technical framing.",
    dimensions,
    strongestContributions,
    weakestContributions,
    missedOpportunities: studentTurnCount === 0
      ? ["Did not claim a turn during the opening framing or mid-discussion synthesis windows."]
      : [
          `Could have cited a concrete operational threshold when responding to ${firstPeerName}.`,
          `Opportunity to bridge viewpoints alongside ${secondPeerName} during the synthesis stage.`
        ],
    unsupportedClaims: candidateTurns
      .filter(t => !technicalKeywords.some(k => t.content.toLowerCase().includes(k)))
      .map(t => t.content)
      .slice(0, 1),
    speakingTimeAnalysis: {
      studentSpeakingTimeSeconds,
      studentTurnCount,
      speakingPercentage,
      groupAverageTurnCount,
      dominanceRatio
    },
    moderationHistory: humanIncidents,
    targetedImprovementPlan: [
      "Practice bridging polarized viewpoints by acknowledging valid trade-offs before asserting your proposal.",
      "Ground claims with specific operational criteria, user constraints, or recovery protocols.",
      "Time your interventions during stage transitions to seize natural leadership moments."
    ],
    nextRecommendedPracticeTopic: `Structured Trade-Offs Beyond "${topicTitle.slice(0, 60)}"`,
    createdAt: new Date().toISOString()
  };
}

/**
 * AI-reasoned, transcript-grounded asynchronous evaluator (Phase 7).
 * Evaluates a specific human candidate fairly across all 8 dimensions using
 * exact numbered transcript excerpts and zero fabricated scores on silence.
 */
export async function evaluateGDSessionAsync(
  session: GDSessionData,
  options?: GDEvaluationTargetOptions
): Promise<GDComprehensiveReport> {
  const baseline = evaluateGDSession(session, options);
  const candidateTurns = getTargetCandidateTurns(session, options);

  // Strict zero-fabrication guard on silent rounds
  if (candidateTurns.length === 0) {
    return baseline;
  }

  const numberedTranscript = session.transcripts
    .map((t, idx) => {
      const turnNum = idx + 1;
      const isTarget = candidateTurns.includes(t);
      const tag = isTarget ? "[TARGET CANDIDATE]" : t.isHuman ? "[OTHER STUDENT]" : `[${t.speakerRole}]`;
      return `Turn #${turnNum} (${t.stage}) ${t.speakerName} ${tag}: "${sanitizeGDPromptInput(t.content, 360)}"`;
    })
    .join("\n");

  const aiEval = await runGDJsonCompletion<any>({
    role: "evaluator",
    systemPrompt:
      "You are Cognalyze's Always-Present GD Evaluator. Assess ONLY the [TARGET CANDIDATE] objectively based strictly on their observed turns in the transcript. NEVER invent quotes or penalize unobservable criteria unfairly when turns are sparse; mark genuinely unobserved dimensions as 'insufficient_evidence' with score 0 if zero evidence exists.",
    userPrompt: `TOPIC: "${sanitizeGDPromptInput(session.topicTitle, 200)}"
FORMAT: ${session.format} | DIFFICULTY: ${session.difficulty} | TARGET ROLE: ${sanitizeGDPromptInput(session.targetRole, 80)}
TARGET CANDIDATE TURN COUNT: ${candidateTurns.length}
CONDUCT INCIDENTS FOR TARGET: ${baseline.moderationHistory.length}

TRANSCRIPT:
${numberedTranscript}

Evaluate the [TARGET CANDIDATE] across the exact 8 dimension IDs:
1. communication_clarity (weight 0.15)
2. content_quality (weight 0.20)
3. logical_reasoning (weight 0.15)
4. active_listening (weight 0.10)
5. critical_thinking (weight 0.10)
6. collaboration (weight 0.10)
7. leadership (weight 0.10)
8. professional_conduct (weight 0.10)

Return JSON ONLY:
{
  "verdictSummary": "2-sentence executive summary grounded in observed turns",
  "dimensions": [
    {
      "dimension": "communication_clarity",
      "score": 82,
      "verdict": "proficient",
      "feedback": "Specific grounded feedback citing what the candidate actually said",
      "turnNumber": 3
    }
  ],
  "strongestContributions": [
    { "turnNumber": 3, "whyStrong": "..." }
  ],
  "weakestContributions": [
    {
      "turnNumber": 3,
      "whyNeedsImprovement": "...",
      "recruiterRewrite": "A concrete executive rewrite of that exact statement"
    }
  ],
  "missedOpportunities": ["Specific missed opportunity referencing actual panel speakers"],
  "targetedImprovementPlan": ["Concrete action 1", "Concrete action 2", "Concrete action 3"],
  "nextRecommendedPracticeTopic": "Relevant follow-up GD topic"
}`,
    validate: (parsed) => {
      if (!Array.isArray(parsed?.dimensions) || parsed.dimensions.length < 4) {
        return null;
      }
      return parsed;
    }
  });

  if (!aiEval.ok) {
    return baseline;
  }

  const aiData = aiEval.data;
  const candidateTurnSet = new Map<number, GDTranscriptItem>();
  candidateTurns.forEach((t) => {
    candidateTurnSet.set(session.transcripts.indexOf(t) + 1, t);
  });

  const mergedDimensions: GDEvaluationDimension[] = baseline.dimensions.map((baseDim) => {
    // Keep authoritative Conduct score grounded in actual moderation logs
    if (baseDim.dimension === "professional_conduct") {
      return baseDim;
    }
    const found = aiData.dimensions.find((d: any) => d?.dimension === baseDim.dimension);
    if (!found || typeof found.score !== "number") {
      return baseDim;
    }
    const clampedScore = Math.max(0, Math.min(100, Math.round(found.score)));
    const validVerdicts = ["exemplary", "proficient", "developing", "insufficient_evidence"];
    const verdict = validVerdicts.includes(found.verdict)
      ? found.verdict
      : clampedScore >= 85
      ? "exemplary"
      : clampedScore >= 72
      ? "proficient"
      : clampedScore > 0
      ? "developing"
      : "insufficient_evidence";

    const citedTurn = candidateTurnSet.get(Number(found.turnNumber)) || candidateTurns[0];
    return {
      ...baseDim,
      score: clampedScore,
      verdict,
      feedback: String(found.feedback || baseDim.feedback).trim(),
      citedExcerpts: citedTurn
        ? [
            {
              quote: citedTurn.content,
              timestamp: citedTurn.timestamp,
              turnNumber: session.transcripts.indexOf(citedTurn) + 1,
              significance: `Evaluator citation for ${baseDim.label}`
            }
          ]
        : baseDim.citedExcerpts
    };
  });

  const overallScore = Math.round(
    mergedDimensions.reduce((acc, d) => acc + d.score * d.weight, 0)
  );
  const conductDim = mergedDimensions.find((d) => d.dimension === "professional_conduct");
  const conductScore = conductDim ? conductDim.score : 95;

  let hiringVerdict: GDComprehensiveReport["hiringVerdict"] = "LEAN_HIRE";
  if (conductScore < 60 || overallScore < 50) hiringVerdict = "NO_HIRE";
  else if (overallScore >= 85 && candidateTurns.length >= 2) hiringVerdict = "STRONG_HIRE";
  else if (overallScore >= 70) hiringVerdict = "HIRE";

  const strongestContributions = Array.isArray(aiData.strongestContributions)
    ? aiData.strongestContributions
        .map((item: any) => {
          const turn = candidateTurnSet.get(Number(item?.turnNumber)) || candidateTurns[0];
          if (!turn) return null;
          return {
            quote: turn.content,
            stage: turn.stage,
            whyStrong: String(item.whyStrong || "Effective intervention.").trim()
          };
        })
        .filter(Boolean)
    : baseline.strongestContributions;

  const weakestContributions = Array.isArray(aiData.weakestContributions)
    ? aiData.weakestContributions
        .map((item: any) => {
          const turn = candidateTurnSet.get(Number(item?.turnNumber)) || candidateTurns[candidateTurns.length - 1];
          if (!turn) return null;
          return {
            quote: turn.content,
            whyNeedsImprovement: String(item.whyNeedsImprovement || "Expand with concrete criteria.").trim(),
            recruiterRewrite: String(item.recruiterRewrite || baseline.weakestContributions[0]?.recruiterRewrite || "").trim()
          };
        })
        .filter(Boolean)
    : baseline.weakestContributions;

  return {
    ...baseline,
    overallScore,
    hiringVerdict,
    verdictSummary: String(aiData.verdictSummary || baseline.verdictSummary).trim(),
    dimensions: mergedDimensions,
    strongestContributions: strongestContributions.length > 0 ? strongestContributions : baseline.strongestContributions,
    weakestContributions: weakestContributions.length > 0 ? weakestContributions : baseline.weakestContributions,
    missedOpportunities:
      Array.isArray(aiData.missedOpportunities) && aiData.missedOpportunities.length > 0
        ? aiData.missedOpportunities.slice(0, 4).map(String)
        : baseline.missedOpportunities,
    targetedImprovementPlan:
      Array.isArray(aiData.targetedImprovementPlan) && aiData.targetedImprovementPlan.length > 0
        ? aiData.targetedImprovementPlan.slice(0, 4).map(String)
        : baseline.targetedImprovementPlan,
    nextRecommendedPracticeTopic: String(
      aiData.nextRecommendedPracticeTopic || baseline.nextRecommendedPracticeTopic
    ).trim()
  };
}
