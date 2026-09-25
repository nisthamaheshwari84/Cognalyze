import { NextResponse } from "next/server";
import { buildGithubDossier } from "@/lib/evidence/github-agent";
import { buildLeetcodeDossier, LeetcodeEvidenceDossier } from "@/lib/evidence/leetcode-agent";
import { CandidateDecision, CriterionResult, Evidence, computeConfidence, validateCandidateDecision } from "@/lib/evidence/types";
import { saveEvidenceBatch, saveCandidateDecision } from "@/lib/evidence/storage";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const candidateId = body.candidateId;
    const githubUsername = (body.githubUsername || "").trim();
    const leetcodeUsername = (body.leetcodeUsername || "").trim();

    if (!candidateId || !githubUsername) {
      return NextResponse.json(
        { success: false, error: "candidateId and githubUsername are required" },
        { status: 400 }
      );
    }

    const githubDossier = await buildGithubDossier(candidateId, githubUsername);
    let leetcodeDossier: LeetcodeEvidenceDossier | null = null;
    if (leetcodeUsername) {
      leetcodeDossier = await buildLeetcodeDossier(candidateId, leetcodeUsername);
    }

    const allEvidence: Evidence[] = [
      ...githubDossier.evidence,
      ...(leetcodeDossier ? leetcodeDossier.evidence : []),
    ];

    // Build deterministic CriterionResults
    const criteriaResults: CriterionResult[] = [];

    // 1. Original GitHub Projects
    const hasOriginal = githubDossier.originalRepos > 0;
    const originalEvidenceIds = githubDossier.evidence
      .filter((e) => e.quote_or_fact.includes("fork=false"))
      .map((e) => e.id);

    if (githubDossier.totalPublicRepos === 0) {
      criteriaResults.push({
        criterion: "Independent Project Repositories",
        verdict: "insufficient_evidence",
        evidence_ids: [],
        reasoning: "No public GitHub repositories found for inspection.",
      });
    } else if (hasOriginal && originalEvidenceIds.length > 0) {
      criteriaResults.push({
        criterion: "Independent Project Repositories",
        verdict: "met",
        evidence_ids: originalEvidenceIds.slice(0, 3),
        reasoning: `Candidate has ${githubDossier.originalRepos} original repositories on GitHub.`,
      });
    } else {
      criteriaResults.push({
        criterion: "Independent Project Repositories",
        verdict: "not_met",
        evidence_ids: githubDossier.evidence.map((e) => e.id).slice(0, 2),
        reasoning: `All ${githubDossier.totalPublicRepos} public repos are forks — no independently authored project.`,
      });
    }

    // 2. Commit Depth & Consistency
    const redFlags = githubDossier.flags.filter((f) => f.type === "red");
    const greenFlags = githubDossier.flags.filter((f) => f.type === "green");
    const activeEvidenceIds = githubDossier.evidence.map((e) => e.id).slice(0, 2);

    if (githubDossier.totalPublicRepos === 0) {
      criteriaResults.push({
        criterion: "Commit Depth and Iteration",
        verdict: "insufficient_evidence",
        evidence_ids: [],
        reasoning: "No commit activity records available.",
      });
    } else if (greenFlags.some((f) => f.label === "Sustained development")) {
      criteriaResults.push({
        criterion: "Commit Depth and Iteration",
        verdict: "met",
        evidence_ids: activeEvidenceIds,
        reasoning: "Original repositories exhibit sustained development with 10+ commits.",
      });
    } else if (redFlags.some((f) => f.label === "Low commit depth")) {
      criteriaResults.push({
        criterion: "Commit Depth and Iteration",
        verdict: "partial",
        evidence_ids: activeEvidenceIds,
        reasoning: "Original repos exist but have fewer than 10 commits each.",
      });
    } else {
      criteriaResults.push({
        criterion: "Commit Depth and Iteration",
        verdict: "not_met",
        evidence_ids: activeEvidenceIds,
        reasoning: "Activity records indicate inactive profile or zero non-fork commits.",
      });
    }

    // 3. Algorithmic Problem Solving (LeetCode)
    if (leetcodeDossier && leetcodeDossier.found) {
      const lcEvIds = leetcodeDossier.evidence.map((e) => e.id);
      if (leetcodeDossier.totalSolved >= 50) {
        criteriaResults.push({
          criterion: "Algorithmic Problem Solving",
          verdict: "met",
          evidence_ids: lcEvIds,
          reasoning: `Solved ${leetcodeDossier.totalSolved} problems (Medium: ${leetcodeDossier.mediumSolved}, Hard: ${leetcodeDossier.hardSolved}).`,
        });
      } else {
        criteriaResults.push({
          criterion: "Algorithmic Problem Solving",
          verdict: "partial",
          evidence_ids: lcEvIds,
          reasoning: `Solved ${leetcodeDossier.totalSolved} problems (fewer than 50 verified).`,
        });
      }
    } else {
      criteriaResults.push({
        criterion: "Algorithmic Problem Solving",
        verdict: "insufficient_evidence",
        evidence_ids: [],
        reasoning: leetcodeUsername
          ? `LeetCode handle "${leetcodeUsername}" returned no verified problem submissions.`
          : "No LeetCode profile submitted for verification.",
      });
    }

    const hasRedForkFlag = redFlags.some((f) => f.label === "No original work");
    const outcome: CandidateDecision["outcome"] = hasRedForkFlag ? "reject" : "advance";

    const decision: CandidateDecision = {
      candidate_id: candidateId,
      stage: "github_review",
      outcome,
      criteria_results: criteriaResults,
      overall_confidence: computeConfidence(criteriaResults),
      rejection_summary: hasRedForkFlag
        ? "Not advanced — GitHub profile contains zero original repositories."
        : undefined,
      created_at: new Date().toISOString(),
    };

    validateCandidateDecision(decision, allEvidence);

    await saveEvidenceBatch(candidateId, allEvidence);
    await saveCandidateDecision(decision);

    return NextResponse.json({
      success: true,
      githubDossier,
      leetcodeDossier,
      decision,
      evidence: allEvidence,
    });
  } catch (err: any) {
    console.error("[pipeline/github-review] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
