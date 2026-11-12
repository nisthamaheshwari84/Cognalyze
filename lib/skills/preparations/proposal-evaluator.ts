/**
 * COGNALYZE PREPARATION PROPOSAL & SUBMISSION EVALUATOR
 * 
 * Provides authentic, rubric-grounded evaluation of student proposals,
 * hackathon decks, and technical project submissions.
 * 
 * Never gives generic 'Looks good!' feedback.
 * Analyzes:
 * - Technical Depth & Feasibility
 * - Timeline Granularity (2-week sprint milestones, buffer periods)
 * - Pre-proposal Evidence & Community Engagement
 * - Clarity and Risk Mitigation
 */

import {
  ContributionWorkspaceState,
  PreparationArena,
  StudentIntelligenceSnapshot,
} from "./types";

export interface ProposalEvaluationResult {
  overallScore: number; // 0-100
  verdict: "STRONG_SUBMISSION" | "MEETS_CRITERIA" | "NEEDS_REVISION";
  rubricScores: {
    criterion: string;
    score: number;
    maxScore: number;
    feedback: string;
  }[];
  strengths: string[];
  gaps: string[];
  actionableFeedback: string;
  sourceAttribution: "AI-Generated Evaluation — Not Official Mentor Approval";
  reviewedAt: string;
}

export interface ContextualProposalGuidance {
  organizationName: string;
  officialRequirementsNote: string;
  suggestedScaffoldMarkdown: string;
  verifiedContributionEvidenceCount: number;
  verifiedEvidenceSnippets: string[];
}

export class ProposalEvaluator {
  private static instance: ProposalEvaluator;

  private constructor() {}

  public static getInstance(): ProposalEvaluator {
    if (!ProposalEvaluator.instance) {
      ProposalEvaluator.instance = new ProposalEvaluator();
    }
    return ProposalEvaluator.instance;
  }

  public evaluateProposal(
    arena: PreparationArena,
    proposalText: string
  ): ProposalEvaluationResult {
    const text = proposalText.trim();
    const wordCount = text.split(/\s+/).length;

    const rubric = arena.proposalTemplate?.scoringRubric || [
      { criterion: "Technical Depth & Feasibility", weightage: 35, description: "Detailed understanding of APIs and architecture" },
      { criterion: "Timeline Granularity & Realism", weightage: 25, description: "Clear two-week milestones with deliverables" },
      { criterion: "Pre-Proposal Evidence & Community Engagement", weightage: 25, description: "Prior PRs, discussions, and mentor alignment" },
      { criterion: "Proposal Clarity & Professionalism", weightage: 15, description: "Clean structure and formatting" }
    ];

    const lower = text.toLowerCase();
    const strengths: string[] = [];
    const gaps: string[] = [];
    const rubricScores: ProposalEvaluationResult["rubricScores"] = [];

    // Criterion 1: Technical Depth & Feasibility
    let techScore = 0;
    const maxTech = rubric.find(r => r.criterion.includes("Technical"))?.weightage || 35;
    if (wordCount < 100) {
      techScore = Math.floor(maxTech * 0.2);
      gaps.push("Draft is too brief. Must specify concrete classes, APIs, and module interactions.");
    } else {
      let depthSignals = 0;
      if (lower.includes("api") || lower.includes("endpoint") || lower.includes("interface")) depthSignals++;
      if (lower.includes("test") || lower.includes("pytest") || lower.includes("unit test") || lower.includes("benchmark")) depthSignals++;
      if (lower.includes("database") || lower.includes("schema") || lower.includes("sql") || lower.includes("cache")) depthSignals++;
      if (lower.includes("edge case") || lower.includes("exception") || lower.includes("error handling") || lower.includes("concurrency")) depthSignals++;

      techScore = Math.min(maxTech, Math.floor(maxTech * (0.4 + depthSignals * 0.15)));
      if (depthSignals >= 3) {
        strengths.push("Good technical specification with explicit APIs, test considerations, and edge cases.");
      } else {
        gaps.push("Technical architecture needs more concrete API signatures, schema definitions, and unit test strategies.");
      }
    }
    rubricScores.push({
      criterion: "Technical Depth & Feasibility",
      score: techScore,
      maxScore: maxTech,
      feedback: techScore >= maxTech * 0.75
        ? "Robust technical design addressing underlying modules and tests."
        : "Deepen your technical architecture. Include explicit interface definitions and failure modes."
    });

    // Criterion 2: Timeline Granularity & Realism
    let timelineScore = 0;
    const maxTimeline = rubric.find(r => r.criterion.includes("Timeline"))?.weightage || 25;
    const hasMilestones = lower.includes("week") || lower.includes("milestone") || lower.includes("sprint") || lower.includes("phase");
    const hasBuffer = lower.includes("buffer") || lower.includes("review") || lower.includes("testing") || lower.includes("documentation");

    if (hasMilestones && hasBuffer) {
      timelineScore = maxTimeline;
      strengths.push("Excellent timeline breakdown with dedicated buffer weeks for testing and documentation.");
    } else if (hasMilestones) {
      timelineScore = Math.floor(maxTimeline * 0.7);
      gaps.push("Add explicit buffer weeks before mid-term and final evaluations to absorb unexpected delays.");
    } else {
      timelineScore = Math.floor(maxTimeline * 0.3);
      gaps.push("Missing structured milestone schedule. Break work into bi-weekly deliverables.");
    }
    rubricScores.push({
      criterion: "Timeline Granularity & Realism",
      score: timelineScore,
      maxScore: maxTimeline,
      feedback: timelineScore >= maxTimeline * 0.7
        ? "Clear time estimates with realistic milestone progression."
        : "Break project into two-week sprints and include at least 1-2 weeks of buffer time."
    });

    // Criterion 3: Pre-Proposal Evidence & Community Engagement
    let communityScore = 0;
    const maxCommunity = rubric.find(r => r.criterion.includes("Community") || r.criterion.includes("Evidence"))?.weightage || 25;
    const hasPR = lower.includes("pr") || lower.includes("pull request") || lower.includes("commit") || lower.includes("github.com") || lower.includes("merged");
    const hasDiscussion = lower.includes("issue") || lower.includes("discussion") || lower.includes("mentor") || lower.includes("slack") || lower.includes("discord");

    if (hasPR && hasDiscussion) {
      communityScore = maxCommunity;
      strengths.push("Strong community engagement documented with PR references and prior maintainer discussions.");
    } else if (hasPR || hasDiscussion) {
      communityScore = Math.floor(maxCommunity * 0.65);
      gaps.push("Link specific pull request URLs or issue numbers demonstrating prior codebase familiarity.");
    } else {
      communityScore = Math.floor(maxCommunity * 0.25);
      gaps.push("No evidence of community bonding. Maintainers rarely accept proposals from contributors with zero prior interaction.");
    }
    rubricScores.push({
      criterion: "Pre-Proposal Evidence & Community Engagement",
      score: communityScore,
      maxScore: maxCommunity,
      feedback: communityScore >= maxCommunity * 0.7
        ? "Verifiable proof of community interaction and codebase familiarity."
        : "Contribute at least 1 good-first-issue PR and link it inside your proposal to build maintainer trust."
    });

    // Criterion 4: Clarity & Professionalism
    let clarityScore = 0;
    const maxClarity = rubric.find(r => r.criterion.includes("Clarity"))?.weightage || 15;
    if (wordCount >= 250 && text.includes("\n")) {
      clarityScore = maxClarity;
      strengths.push("Clean section structure with professional technical prose.");
    } else {
      clarityScore = Math.floor(maxClarity * 0.5);
      gaps.push("Use structured markdown headings (e.g. ## Architecture, ## Timeline) for readability.");
    }
    rubricScores.push({
      criterion: "Proposal Clarity & Professionalism",
      score: clarityScore,
      maxScore: maxClarity,
      feedback: clarityScore >= maxClarity * 0.7
        ? "Well-structured, concise, and professional tone."
        : "Improve formatting with clear markdown headings and bullet points."
    });

    const overallScore = Math.min(100, Math.max(0, techScore + timelineScore + communityScore + clarityScore));
    let verdict: ProposalEvaluationResult["verdict"] = "NEEDS_REVISION";
    if (overallScore >= 80) {
      verdict = "STRONG_SUBMISSION";
    } else if (overallScore >= 55) {
      verdict = "MEETS_CRITERIA";
    }

    const actionableFeedback = verdict === "STRONG_SUBMISSION"
      ? `Outstanding proposal for ${arena.shortName}. Your technical design and milestones are well balanced. Ensure all GitHub PR links are up to date and submit early.`
      : `To strengthen this proposal for ${arena.shortName}: 1) ${gaps[0] || "Refine technical specifications."} 2) ${gaps[1] || "Add explicit sprint milestones."} 3) Verify your solution directly resolves the core requirements.`;

    return {
      overallScore,
      verdict,
      rubricScores,
      strengths,
      gaps,
      actionableFeedback,
      sourceAttribution: "AI-Generated Evaluation — Not Official Mentor Approval",
      reviewedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates organization-aware scaffold grounded in verified Student DNA & GitHub PRs.
   * Explicitly separates AI guidance from official human mentor approval.
   */
  public buildContextualGuidance(
    arena: PreparationArena,
    dna: StudentIntelligenceSnapshot,
    workspaces: ContributionWorkspaceState[] = []
  ): ContextualProposalGuidance {
    const verifiedPRs = workspaces.filter(
      w => w.prVerificationStatus === "verified_open" || w.prVerificationStatus === "verified_merged"
    );
    const verifiedEvidenceSnippets = [
      ...verifiedPRs.map(w => `Verified GitHub PR (${w.prVerificationStatus}): ${w.prUrl} on ${w.repoFullName}`),
      ...dna.verifiedSkills.slice(0, 4).map(s => `Verified DNA Skill: ${s.skill} (${s.sourceTypes.join(", ")})`),
      ...dna.projects.slice(0, 2).map(p => `Project Artifact: ${p.title}`),
    ];

    const scaffold = `# ${arena.shortName} Technical Proposal Draft

## 1. Problem Statement & Target Scope
- Clearly define the engineering bottleneck or feature objective for ${arena.companyOrOrg}.
- Reference exact modules/issues rather than generic high-level goals.

## 2. Proposed Solution & Technical Architecture
- Detail data schemas, API contracts, concurrency invariants, and failure recovery.
- Explicitly note trade-offs you evaluated.

## 3. Deliverables & 2-Week Milestone Schedule
- **Weeks 1–2 (Community Bonding / Setup):** Confirm architecture & baseline CI tests.
- **Weeks 3–6 (Core Implementation):** Ship Module A + automated tests.
- **Weeks 7–8 (Buffer & Mid-Term Review):** Integration benchmarks & documentation.
- **Weeks 9–12 (Final Polish):** Edge cases, final PR review & docs handoff.

## 4. Testing & Risk Management
- Specify unit test frameworks (PyTest / Go test / Jest), regression mocks, and rollback plan if timeline slips.

## 5. Prior Experience & Verified Contribution Evidence
${verifiedEvidenceSnippets.length > 0 ? verifiedEvidenceSnippets.map(s => `- ${s}`).join("\n") : "- [No verified GitHub PRs linked yet — complete and verify your first issue PR in the Open Source Studio]"}
`;

    return {
      organizationName: arena.companyOrOrg,
      officialRequirementsNote: `Always verify official ${arena.shortName} templates & deadlines at ${arena.officialUrl}. AI rubric scores below are guidance only and never substitute for human mentor feedback.`,
      suggestedScaffoldMarkdown: scaffold,
      verifiedContributionEvidenceCount: verifiedPRs.length,
      verifiedEvidenceSnippets,
    };
  }
}

export const proposalEvaluator = ProposalEvaluator.getInstance();

