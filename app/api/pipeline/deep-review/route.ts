import { NextResponse } from "next/server";
import {
  fetchFullRepoDetails,
  buildDeepReviewInput,
  runDeepReview,
  ResumeProjectClaim,
  HackathonClaim,
  ContestHistoryEntry,
} from "@/lib/evidence/deep-review-agent";
import { buildGithubDossier } from "@/lib/evidence/github-agent";
import { buildLeetcodeDossier } from "@/lib/evidence/leetcode-agent";
import { buildHackathonDossier } from "@/lib/evidence/hackathon-agent";
import { CandidateDecision, CriterionResult, Evidence, computeConfidence, validateCandidateDecision } from "@/lib/evidence/types";
import { saveEvidenceBatch, saveCandidateDecision } from "@/lib/evidence/storage";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const candidateId = body.candidateId;
    const githubUsername = (body.githubUsername || "").trim();
    const repoNames: string[] = Array.isArray(body.repoNames) ? body.repoNames : [];
    const resumeProjectClaims: ResumeProjectClaim[] = Array.isArray(body.resumeProjectClaims)
      ? body.resumeProjectClaims
      : [];
    const leetcodeUsername = (body.leetcodeUsername || "").trim();
    const hackathonClaims: HackathonClaim[] = Array.isArray(body.hackathonClaims)
      ? body.hackathonClaims
      : [];
    const contestHistory: ContestHistoryEntry[] = Array.isArray(body.contestHistory)
      ? body.contestHistory
      : [];

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: "candidateId is required" },
        { status: 400 }
      );
    }

    // 1. Gather component dossiers
    const [fullRepos, githubDossier, leetcodeDossier, hackathonDossier] = await Promise.all([
      githubUsername && repoNames.length > 0
        ? fetchFullRepoDetails(githubUsername, repoNames)
        : Promise.resolve([]),
      githubUsername
        ? buildGithubDossier(candidateId, githubUsername)
        : Promise.resolve({
            candidateId,
            username: "",
            totalPublicRepos: 0,
            originalRepos: 0,
            forkedRepos: 0,
            activeMonthsLast12: 0,
            flags: [],
            topRepos: [],
            evidence: [],
          }),
      buildLeetcodeDossier(candidateId, leetcodeUsername),
      buildHackathonDossier(candidateId, hackathonClaims),
    ]);

    // 2. Assemble deep review input
    const deepReviewInput = buildDeepReviewInput({
      candidateId,
      resumeProjectClaims,
      githubDossier,
      fullRepoDetails: fullRepos,
      leetcodeDossier,
      hackathonClaims,
      contestHistory,
    });

    // 3. Run LLM verification & programmatic quote downgrade check
    const deepReviewOutput = await runDeepReview(deepReviewInput);

    // 4. Transform DeepReviewOutput into auditable Evidence entries
    const generatedEvidence: Evidence[] = [
      ...githubDossier.evidence,
      ...leetcodeDossier.evidence,
      ...hackathonDossier.evidence,
    ];

    for (let i = 0; i < deepReviewOutput.per_project_results.length; i++) {
      const p = deepReviewOutput.per_project_results[i];
      const repoUrl = p.matched_repo_url || "unmatched";

      if (p.step1_claim_match.evidence_quotes.length > 0) {
        const evId = `ev_${candidateId}_proj_${i}_match`;
        generatedEvidence.push({
          id: evId,
          source_type: "github_repo",
          source_ref: repoUrl,
          quote_or_fact: `Project Match [${p.step1_claim_match.verdict}]: "${p.step1_claim_match.evidence_quotes.join(" | ")}"`,
          extracted_at: new Date().toISOString(),
        });
      }

      if (p.step2_vibe_coding_signal.evidence_quotes.length > 0) {
        const evId = `ev_${candidateId}_proj_${i}_commits`;
        generatedEvidence.push({
          id: evId,
          source_type: "github_commit_stats",
          source_ref: `${repoUrl}#commits`,
          quote_or_fact: `Commit Signal [${p.step2_vibe_coding_signal.verdict}]: "${p.step2_vibe_coding_signal.evidence_quotes.join(" | ")}"`,
          extracted_at: new Date().toISOString(),
        });
      }

      if (p.step3_learning_reflection.evidence_quotes.length > 0) {
        const evId = `ev_${candidateId}_proj_${i}_reflection`;
        generatedEvidence.push({
          id: evId,
          source_type: "github_repo",
          source_ref: `${repoUrl}#readme`,
          quote_or_fact: `Design Reflection [${p.step3_learning_reflection.verdict}]: "${p.step3_learning_reflection.evidence_quotes.join(" | ")}"`,
          extracted_at: new Date().toISOString(),
        });
      }
    }

    // 5. Build formal CandidateDecision with verified evidence IDs
    const criteriaResults: CriterionResult[] = [];

    // Project Authenticity Criterion
    for (let i = 0; i < deepReviewOutput.per_project_results.length; i++) {
      const p = deepReviewOutput.per_project_results[i];
      const matchEvId = `ev_${candidateId}_proj_${i}_match`;
      const commitEvId = `ev_${candidateId}_proj_${i}_commits`;
      const evIds = generatedEvidence
        .filter((e) => e.id === matchEvId || e.id === commitEvId)
        .map((e) => e.id);

      const isVibeCoded = p.step2_vibe_coding_signal.verdict.includes("single_shot") ||
                          p.step2_vibe_coding_signal.verdict.includes("low_engagement");
      const isInsufficient = p.step1_claim_match.verdict === "insufficient_evidence" ||
                             p.step1_claim_match.verdict === "not_found";

      criteriaResults.push({
        criterion: `Project Authenticity: ${p.project_name}`,
        verdict: isInsufficient
          ? "insufficient_evidence"
          : isVibeCoded
          ? "not_met"
          : p.step1_claim_match.verdict === "matched"
          ? "met"
          : "partial",
        evidence_ids: isInsufficient ? [] : evIds,
        reasoning: `${p.project_name}: Claim match is "${p.step1_claim_match.verdict}", commit pattern shows "${p.step2_vibe_coding_signal.verdict}".`,
      });
    }

    // Skill Consistency Criterion
    const dsaVerdict = deepReviewOutput.skill_consistency.dsa_claim_vs_leetcode.verdict;
    const dsaQuotes = deepReviewOutput.skill_consistency.dsa_claim_vs_leetcode.evidence_quotes;
    const lcEvIds = leetcodeDossier.evidence.map((e) => e.id);

    criteriaResults.push({
      criterion: "DSA & Problem Solving Authenticity",
      verdict: dsaVerdict === "consistent"
        ? "met"
        : dsaVerdict === "inconsistent"
        ? "not_met"
        : "insufficient_evidence",
      evidence_ids: dsaVerdict === "insufficient_evidence" ? [] : lcEvIds,
      reasoning: dsaQuotes.length > 0
        ? `LeetCode metrics: ${dsaQuotes.join("; ")}.`
        : "No verifiable algorithmic problem statistics matched.",
    });

    const anyVibeCoded = criteriaResults.some((c) => c.verdict === "not_met");
    const outcome: CandidateDecision["outcome"] = anyVibeCoded ? "hold" : "advance";

    const decision: CandidateDecision = {
      candidate_id: candidateId,
      stage: "deep_review",
      outcome,
      criteria_results: criteriaResults,
      overall_confidence: deepReviewOutput.overall_confidence,
      rejection_summary: anyVibeCoded
        ? `Held for human review: ${criteriaResults.filter((c) => c.verdict === "not_met").map((c) => c.criterion).join(", ")}.`
        : undefined,
      created_at: new Date().toISOString(),
    };

    validateCandidateDecision(decision, generatedEvidence);

    await saveEvidenceBatch(candidateId, generatedEvidence);
    await saveCandidateDecision(decision);

    return NextResponse.json({
      success: true,
      deepReviewOutput,
      decision,
      evidence: generatedEvidence,
    });
  } catch (err: any) {
    console.error("[pipeline/deep-review] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
