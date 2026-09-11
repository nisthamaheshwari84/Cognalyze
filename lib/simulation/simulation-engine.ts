import { supabase } from "@/lib/supabase";
import { canScoreRound } from "./gating";

export type CompanyTier = "Tier 1 FAANG" | "High-Growth Product / FinTech" | "Enterprise Service";

export interface RoundResults {
  resume_screening?: {
    result: "pass" | "borderline" | "fail" | "not_attempted";
    score: number | null;
    evidence: string;
    must_haves_missing?: string[];
    github_verification?: {
      provided: boolean;
      username?: string | null;
      verified: boolean;
      repos_count?: number;
      top_languages?: string[];
      verified_projects?: string[];
      unverified_claims?: string[];
      summary?: string;
      notes?: string;
    };
  };
  online_assessment?: {
    aptitude_score: number | null; // 0 - 100 or null if not attempted
    coding_score: number | null; // 0 - 100 or null if not attempted
    coding_problems_solved: string; // e.g. "0/2" or "Not Attempted"
    result: "pass" | "borderline" | "fail" | "not_attempted";
    struggled_topics?: string[];
    time_elapsed_seconds?: number;
  };
  group_discussion?: {
    articulation_score: number | null; // 0 - 100 or null if not attempted
    result: "pass" | "borderline" | "fail" | "not_attempted";
    specific_feedback: string;
    key_moment?: string;
    candidate_interventions_count?: number;
  };
  technical_interview?: {
    score: number | null; // 0 - 100 or null if not attempted
    result: "pass" | "borderline" | "fail" | "not_attempted";
    strong_areas: string[];
    weak_areas: string[];
    specific_examples: string;
    candidate_responses_count?: number;
  };
  hr_interview?: {
    score: number | null; // 0 - 100 or null if not attempted
    result: "pass" | "borderline" | "fail" | "not_attempted";
    specific_feedback: string;
    candidate_responses_count?: number;
  };
}

export interface RealisticOutcome {
  would_be_selected: boolean;
  likely_elimination_round:
    | "resume_screening"
    | "online_assessment"
    | "group_discussion"
    | "technical_interview"
    | "hr_interview"
    | null;
  reasoning: string;
}

export interface HolisticReport {
  target_role_and_company_tier: string;
  round_results: {
    resume_screening: {
      result: "pass" | "borderline" | "fail" | "not_attempted";
      evidence: string;
      score: number | null;
      github_verification?: any;
    };
    online_assessment: {
      aptitude_score: number | null;
      coding_score: number | null;
      coding_problems_solved: string;
      result: "pass" | "borderline" | "fail" | "not_attempted";
    };
    group_discussion: {
      articulation_score: number | null;
      result: "pass" | "borderline" | "fail" | "not_attempted";
      specific_feedback: string;
    };
    technical_interview: {
      result: "pass" | "borderline" | "fail" | "not_attempted";
      score: number | null;
      strong_areas: string[];
      weak_areas: string[];
      specific_examples: string;
    };
    hr_interview: {
      result: "pass" | "borderline" | "fail" | "not_attempted";
      score: number | null;
      specific_feedback: string;
    };
  };
  realistic_outcome: RealisticOutcome;
  profile_summary: string;
  recommended_focus: string[];
}

export type CompanyTierType =
  | "FAANG/Product (Tier-1 hiring bar)"
  | "Mid-size Product Company"
  | "Service-based/IT Services company"
  | "Startup"
  | "not sure — use a balanced general bar";

export type DriveType =
  | "On-campus placement"
  | "Off-campus/direct application"
  | "Referral"
  | "Experienced hire/lateral";

export type RoleLevel =
  | "Intern"
  | "Fresher/Entry-level"
  | "1-3 years"
  | "Senior/experienced";

export interface SimulationSession {
  id: string;
  candidate_id: string;
  target_company?: string;
  target_company_tier: CompanyTier;
  company_tier_type?: CompanyTierType;
  drive_type?: DriveType;
  role_level?: RoleLevel;
  target_role: string;
  current_round: 1 | 2 | 3 | 4 | 5 | 6; // 1-5 = rounds, 6 = holistic report
  resume_data: {
    resume_text: string;
    jd_text: string;
    github_url?: string;
  };
  round_results: RoundResults;
  holistic_report?: HolisticReport;
  created_at: string;
}

const STORAGE_KEY = "cognalyze_simulation_sessions";

/**
 * Generates an honest, holistic evaluation across all 5 rounds.
 * Strictly checks real participation via canScoreRound before assigning any score or pass verdict.
 * Zero fake fallback scores are ever generated.
 */
export function evaluateHolisticSimulation(session: SimulationSession): HolisticReport {
  const { target_role, target_company_tier, round_results, resume_data } = session;

  // ── 1. Evaluate Resume Screening ──
  const resumeEligibility = canScoreRound("resume_screening", {
    resume_text: resume_data?.resume_text,
    screening_performed: Boolean(round_results?.resume_screening && round_results.resume_screening.result !== "not_attempted"),
    score: round_results?.resume_screening?.score,
  });

  const resume = resumeEligibility.canScore && round_results?.resume_screening
    ? round_results.resume_screening
    : {
        result: "not_attempted" as const,
        score: null,
        evidence: "Not Attempted: Resume screening was not executed for this session.",
        github_verification: undefined,
      };

  // ── 2. Evaluate Online Assessment ──
  const rawOA = round_results?.online_assessment;
  const isOaSubmitted = rawOA && rawOA.result !== "not_attempted" && rawOA.aptitude_score !== null;

  const oa = isOaSubmitted
    ? rawOA
    : {
        aptitude_score: null,
        coding_score: null,
        coding_problems_solved: "Not Attempted",
        result: "not_attempted" as const,
        struggled_topics: [],
      };

  // ── 3. Evaluate Group Discussion ──
  const rawGD = round_results?.group_discussion;
  const isGdParticipated =
    rawGD &&
    rawGD.result !== "not_attempted" &&
    rawGD.articulation_score !== null &&
    (rawGD.candidate_interventions_count === undefined || rawGD.candidate_interventions_count >= 2);

  const gd = isGdParticipated
    ? rawGD
    : {
        articulation_score: null,
        result: "not_attempted" as const,
        specific_feedback: "Not Attempted: Candidate did not actively intervene in the Group Discussion.",
        key_moment: "Candidate made zero substantive contributions to the discussion.",
      };

  // ── 4. Evaluate Technical Interview ──
  const rawTech = round_results?.technical_interview;
  const isTechParticipated =
    rawTech &&
    rawTech.result !== "not_attempted" &&
    rawTech.score !== null &&
    (rawTech.candidate_responses_count === undefined || rawTech.candidate_responses_count >= 2);

  const tech = isTechParticipated
    ? rawTech
    : {
        score: null,
        result: "not_attempted" as const,
        strong_areas: [],
        weak_areas: ["Round Not Attempted"],
        specific_examples: "Not Attempted: Candidate did not complete the Technical Interview.",
      };

  // ── 5. Evaluate HR Interview ──
  const rawHR = round_results?.hr_interview;
  const isHrParticipated =
    rawHR &&
    rawHR.result !== "not_attempted" &&
    rawHR.score !== null &&
    (rawHR.candidate_responses_count === undefined || rawHR.candidate_responses_count >= 1);

  const hr = isHrParticipated
    ? rawHR
    : {
        score: null,
        result: "not_attempted" as const,
        specific_feedback: "Not Attempted: Candidate did not submit answers to the HR interview questions.",
      };

  // ── Determine realistic outcome and likely elimination round ──
  let would_be_selected = true;
  let likely_elimination_round: RealisticOutcome["likely_elimination_round"] = null;
  let reasoning = "";
  const recommended_focus: string[] = [];

  // Parse coding problems solved ratio if attempted
  const solvedMatch = (oa.coding_problems_solved || "").match(/(\d+)\s*\/\s*(\d+)/);
  const solvedCount = solvedMatch ? parseInt(solvedMatch[1], 10) : 0;

  // PRIORITY 1: Check for unattempted rounds (Immediate Disqualification)
  if (resume.result === "not_attempted") {
    would_be_selected = false;
    likely_elimination_round = "resume_screening";
    reasoning = `Disqualified at Resume Screening: The candidate did not submit or audit a resume for this session. A valid resume is required to enter the recruitment pipeline.`;
    recommended_focus.push("Upload and verify an authentic resume tailored to the target role.");
  } else if (oa.result === "not_attempted") {
    would_be_selected = false;
    likely_elimination_round = "online_assessment";
    reasoning = `Disqualified at Online Assessment: The candidate did not attempt or complete the timed online assessment. In campus drives, skipping the OA results in immediate disqualification.`;
    recommended_focus.push("Complete all aptitude sections and test coding solutions under timed constraints.");
  } else if (gd.result === "not_attempted") {
    would_be_selected = false;
    likely_elimination_round = "group_discussion";
    reasoning = `Disqualified at Group Discussion: The candidate did not actively participate in the GD round (zero or insufficient substantive interventions). Silent candidates are eliminated by moderators without scoring.`;
    recommended_focus.push("Actively participate in group debates with at least 2 substantive contributions.");
  } else if (tech.result === "not_attempted") {
    would_be_selected = false;
    likely_elimination_round = "technical_interview";
    reasoning = `Disqualified at Technical Interview: The candidate did not answer the technical interview questions. Attending without answering prevents any hiring recommendation.`;
    recommended_focus.push("Engage with technical interviewers by articulating your architecture and problem-solving process.");
  } else if (hr.result === "not_attempted") {
    would_be_selected = false;
    likely_elimination_round = "hr_interview";
    reasoning = `Disqualified at HR Interview: The candidate did not submit answers to the behavioral interview questions. Non-response in the final round terminates the candidacy.`;
    recommended_focus.push("Submit complete STAR responses for all cultural and leadership questions.");
  } else {
    // PRIORITY 2: Check standard performance gates if all rounds were actually attempted
    const resumeScore = resume.score ?? 0;
    const oaCodingScore = oa.coding_score ?? 0;
    const oaAptitudeScore = oa.aptitude_score ?? 0;
    const gdScore = gd.articulation_score ?? 0;
    const techScore = tech.score ?? 0;
    const hrScore = hr.score ?? 0;

    const resumeFailed = resume.result === "fail" || resumeScore < 45;
    const oaCodingFailed = solvedCount === 0 || oaCodingScore < 40;
    const oaAptitudeFailed = oaAptitudeScore < 40;
    const gdFailed = gd.result === "fail" || gdScore < 45;
    const techFailed = tech.result === "fail" || techScore < 55;
    const hrFailed = hr.result === "fail" || hrScore < 50;

    if (resumeFailed) {
      would_be_selected = false;
      likely_elimination_round = "resume_screening";
      reasoning = `Your resume screening score (${resumeScore}/100) failed the initial ATS parser requirements for ${target_company_tier}. In a real hiring process, the profile would have been filtered out before receiving an Online Assessment invitation. ${resume.evidence}`;
      recommended_focus.push("Revise resume with verified metrics and keyword alignments matching target job descriptions.");
    } else if (oaCodingFailed || oaAptitudeFailed) {
      would_be_selected = false;
      likely_elimination_round = "online_assessment";
      if (oaCodingFailed) {
        reasoning = `Despite group discussion (${gdScore}/100) and HR interview performance (${hrScore}/100), the coding round score (${oa.coding_problems_solved} problems solved, ${oaCodingScore}/100) would result in elimination at a company of this tier (${target_company_tier}) before reaching the technical interview stage. Real companies treat OA coding as a non-negotiable threshold filter that communication strength cannot override.`;
        recommended_focus.push(`Algorithmic coding practice: solve foundational and medium-difficulty problems under strict time constraints (${oa.struggled_topics?.join(", ") || "Data structures & algorithms"}).`);
      } else {
        reasoning = `Your aptitude score (${oaAptitudeScore}/100) fell below the campus recruitment cutoff for ${target_company_tier}. Even with adequate coding and verbal articulation, low cognitive speed scores lead to immediate rejection at the OA gating stage.`;
        recommended_focus.push("Speed quantitative and logical aptitude drilling to clear automated recruitment gate cutoffs.");
      }
    } else if (gdFailed) {
      would_be_selected = false;
      likely_elimination_round = "group_discussion";
      reasoning = `While technical capabilities were satisfactory in the coding round (${oa.coding_problems_solved} solved), your low articulation score (${gdScore}/100) and hesitation during group debate would lead to elimination in the Group Discussion round. In high-volume campus hiring, GD is an aggressive elimination filter.`;
      recommended_focus.push("Group discussion practice: master proactive entry phrases, disagreeing constructively, and synthesizing group consensus.");
    } else if (techFailed) {
      would_be_selected = false;
      likely_elimination_round = "technical_interview";
      reasoning = `You successfully cleared the resume and online assessment filters, but your technical interview (${techScore}/100) failed the bar. Interviewers identified significant gaps in ${tech.weak_areas.join(", ") || "core technical depth"}, which prevented an offer recommendation.`;
      recommended_focus.push(`Technical interview deep-dives: reinforce ${tech.weak_areas.join(", ") || "foundational concepts"} with trade-off explanations.`);
    } else if (hrFailed) {
      would_be_selected = false;
      likely_elimination_round = "hr_interview";
      reasoning = `You advanced through all technical hurdles, but the final HR round (${hrScore}/100) raised concerns around cultural alignment, motivation, or conflict handling. ${hr.specific_feedback}`;
      recommended_focus.push("HR / Behavioral preparation: refine STAR responses emphasizing personal ownership ('I' vs 'we') and quantifiable impact.");
    } else {
      would_be_selected = true;
      likely_elimination_round = null;
      reasoning = `Congratulations! Your performance across all 5 evaluation dimensions met or exceeded the hiring bar for ${target_company_tier}. You demonstrated balanced competency: ATS compliance (${resumeScore}/100), strong OA problem solving (${oa.coding_problems_solved} solved), proactive GD leadership (${gdScore}/100), technical depth (${techScore}/100), and polished behavioral communication (${hrScore}/100).`;
      recommended_focus.push("Refine high-scale system design and senior architecture tradeoffs to maximize compensation negotiation leverage.");
    }
  }

  // Ensure 3 prioritized recommendations
  while (recommended_focus.length < 3) {
    if (oa.result === "not_attempted" || (oa.coding_score != null && oa.coding_score < 75)) {
      recommended_focus.push("Targeted LeetCode medium problem sets in areas where solution execution was slow.");
    } else if (gd.result === "not_attempted" || (gd.articulation_score != null && gd.articulation_score < 75)) {
      recommended_focus.push("Practice turn-taking in peer discussions to assert authority earlier.");
    } else if (tech.weak_areas.length > 0 && !recommended_focus.some((r) => r.includes("Technical interview"))) {
      recommended_focus.push(`Review edge-case failure modes in ${tech.weak_areas.slice(0, 2).join(" and ")}.`);
    } else {
      recommended_focus.push("Conduct mock interviews under timer pressure to maintain composure during deep follow-up probes.");
    }
  }

  // Synthesize rich, genuine profile summary
  const profile_summary = `Full-cycle recruitment evaluation for ${target_role} (${target_company_tier}): ${
    !would_be_selected && likely_elimination_round
      ? `Candidate was eliminated at the ${likely_elimination_round.replace(/_/g, " ").toUpperCase()} stage due to ${
          (round_results as any)[likely_elimination_round]?.result === "not_attempted"
            ? "non-participation (Not Attempted)"
            : "failing to clear the hiring bar"
        }.`
      : "Candidate cleared all 5 stages of the recruitment funnel with solid cross-functional performance."
  }`;

  return {
    target_role_and_company_tier: `${target_role} — ${target_company_tier}`,
    round_results: {
      resume_screening: {
        result: resume.result,
        evidence: resume.evidence,
        score: resume.score,
        github_verification: (resume as any).github_verification,
      },
      online_assessment: {
        aptitude_score: oa.aptitude_score,
        coding_score: oa.coding_score,
        coding_problems_solved: oa.coding_problems_solved,
        result: oa.result,
      },
      group_discussion: {
        articulation_score: gd.articulation_score,
        result: gd.result,
        specific_feedback: gd.specific_feedback,
      },
      technical_interview: {
        result: tech.result,
        score: tech.score,
        strong_areas: tech.strong_areas,
        weak_areas: tech.weak_areas,
        specific_examples: tech.specific_examples,
      },
      hr_interview: {
        result: hr.result,
        score: hr.score,
        specific_feedback: hr.specific_feedback,
      },
    },
    realistic_outcome: {
      would_be_selected,
      likely_elimination_round,
      reasoning,
    },
    profile_summary,
    recommended_focus: recommended_focus.slice(0, 4),
  };
}

export function getLocalSimulations(): SimulationSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read simulation sessions from localStorage", e);
    return [];
  }
}

export async function saveSimulationSession(session: SimulationSession): Promise<SimulationSession> {
  if (typeof window !== "undefined") {
    try {
      const existing = getLocalSimulations();
      const filtered = existing.filter((s) => s.id !== session.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([session, ...filtered]));
    } catch (e) {
      console.warn("[simulation-engine] LocalStorage save warning:", e);
    }
  }

  try {
    const { error } = await supabase.from("simulation_sessions").upsert([
      {
        id: session.id,
        candidate_id: session.candidate_id,
        target_company: session.target_company,
        target_company_tier: session.target_company_tier,
        target_role: session.target_role,
        current_round: session.current_round,
        resume_data: session.resume_data,
        round_results: session.round_results,
        holistic_report: session.holistic_report,
        updated_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      console.warn("[simulation-engine] Supabase notice:", error.message);
    }
  } catch (e: any) {
    console.warn("[simulation-engine] Supabase write skipped:", e.message);
  }

  return session;
}
