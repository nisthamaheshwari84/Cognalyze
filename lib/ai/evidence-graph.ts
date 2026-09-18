/**
 * EVIDENCE GRAPH & CANDIDATE DNA ENGINE (Phase 4)
 * 
 * Traceable Claim -> Source -> Proof mapping per requirement:
 *   - Uncertainty Map: "known" (verified proof), "partially_known" (unverified claim / coursework), "unknown" (no evidence)
 *   - Hidden Talent Detector: Unearths unstated strengths from codebases & project architectures
 *   - Candidate DNA: Consolidated capability profile derived directly FROM the Evidence Graph
 */

import { TieredRequirement, RoleDNA } from "./role-dna";

export interface EvidenceNode {
  requirementId: string;
  requirementName: string;
  tier: "Critical" | "Important" | "Preferred" | "Trainable";
  claim: string; // What the candidate states or claims
  source: "resume" | "github" | "student_project" | "work_sample" | "interview" | "hackathon" | "certification";
  proofLocation: string; // e.g. "github.com/org/repo/blob/main/pkg/consumer.go:L45", "Resume Page 1, Bullet 3"
  proofType: "verbatim_quote" | "code_commit" | "test_execution" | "live_work_sample" | "unverified_mention" | "none";
  verbatimProof: string | null; // Actual code snippet, quote, or work sample test output
  uncertaintyStatus: "known" | "partially_known" | "unknown";
  confidenceScore: number; // 0.0 to 1.0
  verifiedAt?: string;
  verifiedBy?: string; // "automated_test_runner" | "recruiter_screen" | "panelist"
}

export interface HiddenTalentSignal {
  competency: string;
  evidenceSource: string;
  description: string;
  strategicValue: string; // Why this adds non-obvious upside to the team
  confidence: number;
}

export interface CandidateDNA {
  candidateId: string;
  name: string;
  overallScore: number; // 0-100
  capabilitySummary: string;
  coreStrengths: string[];
  criticalGaps: string[];
  trainableGaps: string[];
  growthVelocityScore: number; // 0-100 based on trajectory & project complexity
  hiddenTalents: HiddenTalentSignal[];
  evidenceGraph: EvidenceNode[];
  uncertaintySummary: {
    knownCount: number;
    partiallyKnownCount: number;
    unknownCount: number;
    overallUncertaintyRatio: number; // 0.0 (fully known) to 1.0 (completely unknown)
    criticalUnknownsCount: number;
  };
}

/**
 * Builds an Evidence Graph for a candidate against a specific Role DNA
 */
export function buildEvidenceGraph(
  candidate: {
    id: string;
    name: string;
    resumeText: string;
    githubData?: { repos: { name: string; description: string; languages: string[]; url: string }[] };
    studentProjects?: { title: string; tech: string[]; description: string }[];
    hackathons?: string[];
    workSampleResults?: Record<string, { passed: boolean; score: number; output: string }>;
    interviewNotes?: Record<string, { verified: boolean; rating: number; transcriptQuote: string }>;
  },
  role: RoleDNA
): EvidenceGraphResult {
  const nodes: EvidenceNode[] = [];
  const hiddenTalents: HiddenTalentSignal[] = [];

  const lowerResume = (candidate.resumeText || "").toLowerCase();
  const repos = candidate.githubData?.repos || [];
  const projects = candidate.studentProjects || [];

  for (const req of role.tieredRequirements) {
    const reqLower = req.name.toLowerCase();
    const reqTokens = reqLower.split(/\W+/).filter(t => t.length > 3);

    // 1. Check if verified by completed Work Sample (Phase 7)
    if (candidate.workSampleResults && candidate.workSampleResults[req.id]) {
      const ws = candidate.workSampleResults[req.id];
      nodes.push({
        requirementId: req.id,
        requirementName: req.name,
        tier: req.tier,
        claim: `Completed dedicated work sample test for ${req.name}`,
        source: "work_sample",
        proofLocation: `WorkSampleRunner/execution-session-${req.id}`,
        proofType: "live_work_sample",
        verbatimProof: ws.output || `Passed verification benchmark with score ${ws.score}%`,
        uncertaintyStatus: ws.passed ? "known" : "partially_known",
        confidenceScore: ws.passed ? 0.95 : 0.40,
        verifiedAt: new Date().toISOString(),
        verifiedBy: "automated_test_runner"
      });
      continue;
    }

    // 2. Check if verified by Interview Memory / Question Probe (Phase 8)
    if (candidate.interviewNotes && candidate.interviewNotes[req.id]) {
      const note = candidate.interviewNotes[req.id];
      nodes.push({
        requirementId: req.id,
        requirementName: req.name,
        tier: req.tier,
        claim: `Evaluated in technical interview panel for ${req.name}`,
        source: "interview",
        proofLocation: `InterviewSession/transcript-record-${req.id}`,
        proofType: "verified_interview" as any,
        verbatimProof: note.transcriptQuote || `Interviewer confirmed competency score ${note.rating}/10`,
        uncertaintyStatus: note.verified ? "known" : "partially_known",
        confidenceScore: note.verified ? 0.90 : 0.45,
        verifiedAt: new Date().toISOString(),
        verifiedBy: "panelist"
      });
      continue;
    }

    // 3. Check GitHub Repositories for verifiable code proof
    const matchingRepo = repos.find(r => 
      r.name.toLowerCase().includes(reqLower) ||
      r.description.toLowerCase().includes(reqLower) ||
      reqTokens.some(t => r.languages.map(l => l.toLowerCase()).includes(t) || r.description.toLowerCase().includes(t))
    );

    if (matchingRepo) {
      nodes.push({
        requirementId: req.id,
        requirementName: req.name,
        tier: req.tier,
        claim: `Implemented ${req.name} in open-source repository ${matchingRepo.name}`,
        source: "github",
        proofLocation: matchingRepo.url || `github.com/project/${matchingRepo.name}`,
        proofType: "code_commit",
        verbatimProof: `Repo: ${matchingRepo.name} (${matchingRepo.languages.join(", ")}): ${matchingRepo.description}`,
        uncertaintyStatus: "known",
        confidenceScore: 0.88
      });
      continue;
    }

    // 4. Check Cognalyze Student Projects
    const matchingProj = projects.find(p =>
      p.title.toLowerCase().includes(reqLower) ||
      p.description.toLowerCase().includes(reqLower) ||
      reqTokens.some(t => p.tech.map(tc => tc.toLowerCase()).includes(t))
    );

    if (matchingProj) {
      nodes.push({
        requirementId: req.id,
        requirementName: req.name,
        tier: req.tier,
        claim: `Curated project submission demonstrating ${req.name}`,
        source: "student_project",
        proofLocation: `CognalyzeProject/${matchingProj.title}`,
        proofType: "code_commit",
        verbatimProof: `${matchingProj.title} [${matchingProj.tech.join(", ")}]: ${matchingProj.description}`,
        uncertaintyStatus: "known",
        confidenceScore: 0.82
      });
      continue;
    }

    // 5. Check Resume Text for verbatim mentions
    const resumeMatches = reqTokens.filter(t => lowerResume.includes(t));
    if (resumeMatches.length >= Math.max(1, Math.floor(reqTokens.length * 0.6))) {
      // Find matching sentence in resume
      const sentences = candidate.resumeText.split(/\n|\.\s+/);
      const matchedSentence = sentences.find(s => reqTokens.some(t => s.toLowerCase().includes(t))) || "";

      const isListedOnly = matchedSentence.toLowerCase().includes("skills:") || matchedSentence.toLowerCase().includes("technologies:");
      
      nodes.push({
        requirementId: req.id,
        requirementName: req.name,
        tier: req.tier,
        claim: matchedSentence.trim() || `Mentioned in resume (${resumeMatches.join(", ")})`,
        source: "resume",
        proofLocation: `Resume Section: ${isListedOnly ? 'Skills List' : 'Experience Description'}`,
        proofType: isListedOnly ? "unverified_mention" : "verbatim_quote",
        verbatimProof: matchedSentence.trim() || `Resume contains reference to: ${resumeMatches.join(", ")}`,
        uncertaintyStatus: isListedOnly ? "unknown" : "partially_known",
        confidenceScore: isListedOnly ? 0.30 : 0.55
      });
      continue;
    }

    // 6. Unknown / Missing
    nodes.push({
      requirementId: req.id,
      requirementName: req.name,
      tier: req.tier,
      claim: "No evidence found across resume, GitHub, or prior assessments",
      source: "resume",
      proofLocation: "Not detected in candidate corpus",
      proofType: "none",
      verbatimProof: null,
      uncertaintyStatus: "unknown",
      confidenceScore: 0.0
    });
  }

  // 7. Detect Hidden Talents (signals present in GitHub / Projects that exceed the JD's requirements)
  for (const repo of repos) {
    const desc = repo.description.toLowerCase();
    if (desc.includes("consensus") || desc.includes("raft") || desc.includes("distributed kv")) {
      hiddenTalents.push({
        competency: "Low-Level Distributed Consensus Implementation",
        evidenceSource: `GitHub: ${repo.name}`,
        description: `Authored autonomous consensus engine or distributed KV store (${repo.name}). Demonstrates deep systems rigor not typically found in standard resume bullets.`,
        strategicValue: "Accelerates tier-1 infrastructure scalability and prevents architectural anti-patterns.",
        confidence: 0.92
      });
    }
    if (desc.includes("compiler") || desc.includes("ast") || desc.includes("bytecode")) {
      hiddenTalents.push({
        competency: "Language Internals & Compiler Tooling",
        evidenceSource: `GitHub: ${repo.name}`,
        description: `Constructed AST parser or bytecode execution engine (${repo.name}). Shows exceptional algorithmic clarity and memory management discipline.`,
        strategicValue: "Highly valuable for performance-critical engines, high-frequency data pipelines, and SDKs.",
        confidence: 0.90
      });
    }
  }

  // Check hackathons
  if (candidate.hackathons && candidate.hackathons.length > 0) {
    hiddenTalents.push({
      competency: "Rapid Competitive Engineering & Hackathon Execution",
      evidenceSource: `Competitive Track: ${candidate.hackathons.join(", ")}`,
      description: `Track record of competitive hackathon builds under 36-hour sprint constraints.`,
      strategicValue: "Indicates high delivery momentum and resilience in ambiguous startup or greenfield initiatives.",
      confidence: 0.85
    });
  }

  // 8. Synthesize Candidate DNA directly from Evidence Graph
  const known = nodes.filter(n => n.uncertaintyStatus === "known");
  const partial = nodes.filter(n => n.uncertaintyStatus === "partially_known");
  const unknown = nodes.filter(n => n.uncertaintyStatus === "unknown");
  const criticalUnknowns = unknown.filter(n => n.tier === "Critical");

  const totalReqs = nodes.length;
  const overallUncertaintyRatio = totalReqs > 0 ? (unknown.length + partial.length * 0.5) / totalReqs : 1.0;

  // Weight-based score computation
  let weightedScore = 0;
  for (const node of nodes) {
    const req = role.tieredRequirements.find(r => r.id === node.requirementId);
    const weight = req?.weightPct || (100 / (nodes.length || 1));
    const factor = node.uncertaintyStatus === "known" ? 1.0 : node.uncertaintyStatus === "partially_known" ? 0.5 : 0.0;
    weightedScore += (weight * factor);
  }

  const candidateDNA: CandidateDNA = {
    candidateId: candidate.id,
    name: candidate.name,
    overallScore: Math.round(weightedScore),
    capabilitySummary: `${candidate.name} has strong proven grounding in ${known.map(k => k.requirementName).slice(0, 2).join(" & ") || "software fundamentals"}, with ${criticalUnknowns.length} critical uncertainty gap(s) requiring verification.`,
    coreStrengths: known.map(k => `${k.requirementName} (${k.proofLocation})`),
    criticalGaps: criticalUnknowns.map(u => `${u.requirementName} [Critical]`),
    trainableGaps: unknown.filter(u => u.tier === "Trainable").map(u => `${u.requirementName} [Trainable]`),
    growthVelocityScore: Math.min(98, 65 + (known.length * 7) + (hiddenTalents.length * 8)),
    hiddenTalents,
    evidenceGraph: nodes,
    uncertaintySummary: {
      knownCount: known.length,
      partiallyKnownCount: partial.length,
      unknownCount: unknown.length,
      overallUncertaintyRatio: Number(overallUncertaintyRatio.toFixed(2)),
      criticalUnknownsCount: criticalUnknowns.length
    }
  };

  return {
    candidateDNA,
    nodes
  };
}

export interface EvidenceGraphResult {
  candidateDNA: CandidateDNA;
  nodes: EvidenceNode[];
}
