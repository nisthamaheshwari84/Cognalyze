import { supabase } from "@/lib/supabase";

export type CompanyTier = "Tier 1 FAANG" | "High-Growth Product / FinTech" | "Enterprise Service";

export interface RoundResults {
  resume_screening?: {
    result: "pass" | "borderline" | "fail";
    score: number;
    evidence: string;
    must_haves_missing?: string[];
  };
  online_assessment?: {
    aptitude_score: number; // 0 - 100
    coding_score: number; // 0 - 100
    coding_problems_solved: string; // e.g. "0/2" or "1/2" or "2/2"
    result: "pass" | "borderline" | "fail";
    struggled_topics?: string[];
  };
  group_discussion?: {
    articulation_score: number; // 0 - 100
    result: "pass" | "borderline" | "fail";
    specific_feedback: string;
    key_moment?: string;
  };
  technical_interview?: {
    score: number; // 0 - 100
    result: "pass" | "borderline" | "fail";
    strong_areas: string[];
    weak_areas: string[];
    specific_examples: string;
  };
  hr_interview?: {
    score: number; // 0 - 100
    result: "pass" | "borderline" | "fail";
    specific_feedback: string;
  };
}

export interface RealisticOutcome {
  would_be_selected: boolean;
  likely_elimination_round: "resume_screening" | "online_assessment" | "group_discussion" | "technical_interview" | "hr_interview" | null;
  reasoning: string;
}

export interface HolisticReport {
  target_role_and_company_tier: string;
  round_results: {
    resume_screening: {
      result: "pass" | "borderline" | "fail";
      evidence: string;
      score?: number;
    };
    online_assessment: {
      aptitude_score: number;
      coding_score: number;
      coding_problems_solved: string;
      result: "pass" | "borderline" | "fail";
    };
    group_discussion: {
      articulation_score: number;
      result: "pass" | "borderline" | "fail";
      specific_feedback: string;
    };
    technical_interview: {
      result: "pass" | "borderline" | "fail";
      strong_areas: string[];
      weak_areas: string[];
      specific_examples: string;
    };
    hr_interview: {
      result: "pass" | "borderline" | "fail";
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
  };
  round_results: RoundResults;
  holistic_report?: HolisticReport;
  created_at: string;
}

const STORAGE_KEY = "cognalyze_simulation_sessions";

/**
 * Generates an honest, holistic, non-blended evaluation across all 5 rounds.
 * Strictly pinpoints the exact realistic elimination round without false encouragement.
 */
export function evaluateHolisticSimulation(session: SimulationSession): HolisticReport {
  const { target_role, target_company_tier, round_results } = session;

  const resume = round_results.resume_screening || {
    result: "borderline",
    score: 60,
    evidence: "Standard resume baseline with general skill matches.",
  };

  const oa = round_results.online_assessment || {
    aptitude_score: 50,
    coding_score: 50,
    coding_problems_solved: "1/2",
    result: "borderline",
    struggled_topics: [],
  };

  const gd = round_results.group_discussion || {
    articulation_score: 65,
    result: "pass",
    specific_feedback: "Moderate participation in round debate.",
    key_moment: "",
  };

  const tech = round_results.technical_interview || {
    score: 60,
    result: "borderline",
    strong_areas: ["General problem solving"],
    weak_areas: ["Edge case rigor"],
    specific_examples: "Candidate gave adequate answers with occasional hesitation on system boundaries.",
  };

  const hr = round_results.hr_interview || {
    score: 70,
    result: "pass",
    specific_feedback: "Polite demeanor and standard career motivation.",
  };

  // ── Determine realistic outcome and likely elimination round ──
  let would_be_selected = true;
  let likely_elimination_round: RealisticOutcome["likely_elimination_round"] = null;
  let reasoning = "";
  const recommended_focus: string[] = [];

  // Parse coding problems solved ratio
  const solvedMatch = oa.coding_problems_solved.match(/(\d+)\s*\/\s*(\d+)/);
  const solvedCount = solvedMatch ? parseInt(solvedMatch[1], 10) : 0;
  const totalCoding = solvedMatch ? parseInt(solvedMatch[2], 10) : 2;

  // HARD GATE 1: Resume Screening
  const resumeFailed = resume.result === "fail" || resume.score < 45;

  // HARD GATE 2: Online Assessment (Coding & Aptitude)
  // For Tier 1 FAANG and FinTech, OA coding is an uncompromising hard cutoff
  const oaCodingFailed = solvedCount === 0 || oa.coding_score < 40;
  const oaAptitudeFailed = oa.aptitude_score < 40;

  // HARD GATE 3: Group Discussion
  const gdFailed = gd.result === "fail" || gd.articulation_score < 45;

  // HARD GATE 4: Technical Interview
  const techFailed = tech.result === "fail" || tech.score < 55;

  // HARD GATE 5: HR Interview
  const hrFailed = hr.result === "fail" || hr.score < 50;

  if (resumeFailed) {
    would_be_selected = false;
    likely_elimination_round = "resume_screening";
    reasoning = `Your resume screening score (${resume.score}/100) failed the initial ATS parser requirements for ${target_company_tier}. In a real hiring process, the profile would have been filtered out before receiving an Online Assessment invitation. ${resume.evidence}`;
    recommended_focus.push("Revise resume with verified metrics and keyword alignments matching target job descriptions.");
  } else if (oaCodingFailed || oaAptitudeFailed) {
    would_be_selected = false;
    likely_elimination_round = "online_assessment";
    if (oaCodingFailed) {
      reasoning = `Despite strong group discussion (${gd.articulation_score}/100) and HR interview performance (${hr.score}/100), the coding round score (${oa.coding_problems_solved} problems solved, ${oa.coding_score}/100) would result in elimination at a company of this tier (${target_company_tier}) before reaching the technical interview stage. Real companies treat OA coding as a non-negotiable threshold filter that communication strength cannot override.`;
      recommended_focus.push(`Algorithmic coding practice: solve foundational and medium-difficulty problems under strict time constraints (${oa.struggled_topics?.join(", ") || "Data structures & algorithms"}).`);
    } else {
      reasoning = `Your aptitude score (${oa.aptitude_score}/100) fell below the campus recruitment cutoff for ${target_company_tier}. Even with adequate coding and verbal articulation, low cognitive speed scores lead to immediate rejection at the OA gating stage.`;
      recommended_focus.push("Speed quantitative and logical aptitude drilling to clear automated recruitment gate cutoffs.");
    }
  } else if (gdFailed) {
    would_be_selected = false;
    likely_elimination_round = "group_discussion";
    reasoning = `While technical capabilities were satisfactory in the coding round (${oa.coding_problems_solved} solved), your low articulation score (${gd.articulation_score}/100) and hesitation during group debate would lead to elimination in the Group Discussion round. In high-volume campus hiring, GD is an aggressive elimination filter.`;
    recommended_focus.push("Group discussion practice: master proactive entry phrases, disagreeing constructively, and synthesizing group consensus.");
  } else if (techFailed) {
    would_be_selected = false;
    likely_elimination_round = "technical_interview";
    reasoning = `You successfully cleared the resume and online assessment filters, but your technical interview (${tech.score}/100) failed the bar. Interviewers identified significant gaps in ${tech.weak_areas.join(", ") || "core technical depth"}, which prevented an offer recommendation.`;
    recommended_focus.push(`Technical interview deep-dives: reinforce ${tech.weak_areas.join(", ") || "foundational concepts"} with trade-off explanations.`);
  } else if (hrFailed) {
    would_be_selected = false;
    likely_elimination_round = "hr_interview";
    reasoning = `You advanced through all technical hurdles, but the final HR round (${hr.score}/100) raised concerns around cultural alignment, motivation, or conflict handling. ${hr.specific_feedback}`;
    recommended_focus.push("HR / Behavioral preparation: refine STAR responses emphasizing personal ownership ('I' vs 'we') and quantifiable impact.");
  } else {
    would_be_selected = true;
    likely_elimination_round = null;
    reasoning = `Congratulations! Your performance across all 5 evaluation dimensions met or exceeded the hiring bar for ${target_company_tier}. You demonstrated balanced competency: ATS compliance (${resume.score}/100), strong OA problem solving (${oa.coding_problems_solved} solved), proactive GD leadership (${gd.articulation_score}/100), technical depth (${tech.score}/100), and polished behavioral communication (${hr.score}/100).`;
    recommended_focus.push("Refine high-scale system design and senior architecture tradeoffs to maximize compensation negotiation leverage.");
  }

  // Ensure 3 prioritized recommendations
  if (recommended_focus.length < 3) {
    if (oa.coding_score < 75 && !recommended_focus.some((r) => r.includes("Algorithmic"))) {
      recommended_focus.push("Targeted LeetCode medium problem sets in areas where solution execution was slow.");
    }
    if (gd.articulation_score < 75 && !recommended_focus.some((r) => r.includes("Group discussion"))) {
      recommended_focus.push("Practice turn-taking in peer discussions to assert authority earlier.");
    }
    if (tech.weak_areas.length > 0 && !recommended_focus.some((r) => r.includes("Technical interview"))) {
      recommended_focus.push(`Review edge-case failure modes in ${tech.weak_areas.slice(0, 2).join(" and ")}.`);
    }
    if (recommended_focus.length < 3) {
      recommended_focus.push("Conduct mock interviews with timer pressure to maintain composure during deep follow-up probes.");
    }
  }

  // Synthesize rich, genuine profile summary
  const profile_summary = `Full-cycle recruitment evaluation for ${target_role} (${target_company_tier}): The candidate demonstrated ${
    solvedCount >= 1 ? "capable algorithmic problem solving in the OA" : "vulnerable coding fundamentals in the online assessment"
  } coupled with ${
    gd.articulation_score >= 70 ? "commanding verbal articulation in group debate" : "under-assertive communication during group discussion"
  }. Technical probing revealed strengths in ${tech.strong_areas.slice(0, 2).join(", ") || "core areas"} but surfaced limitations in ${
    tech.weak_areas.slice(0, 2).join(", ") || "edge-case depth"
  }. Behavioral fit was assessed as ${hr.score >= 70 ? "sound and culturally collaborative" : "requiring more structured STAR impact articulation"}.`;

  return {
    target_role_and_company_tier: `${target_role} — ${target_company_tier}`,
    round_results: {
      resume_screening: {
        result: resume.result,
        evidence: resume.evidence,
        score: resume.score,
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
        strong_areas: tech.strong_areas,
        weak_areas: tech.weak_areas,
        specific_examples: tech.specific_examples,
      },
      hr_interview: {
        result: hr.result,
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

// ── Persistence Helpers ──

export function getLocalSimulations(): SimulationSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveSimulationSession(session: SimulationSession): Promise<SimulationSession> {
  if (typeof window !== "undefined") {
    try {
      const existing = getLocalSimulations();
      const filtered = existing.filter((s) => s.id !== session.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([session, ...filtered].slice(0, 30)));
    } catch (e) {
      console.warn("[simulation-engine] LocalStorage save warning:", e);
    }
  }

  // Attempt database persistence
  try {
    const { error } = await supabase.from("simulation_sessions").upsert([
      {
        id: session.id,
        candidate_id: session.candidate_id,
        target_company_tier: session.target_company_tier,
        target_role: session.target_role,
        current_round: session.current_round,
        round_results: session.round_results,
        holistic_report: session.holistic_report,
        created_at: session.created_at,
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
