/**
 * COGNALYZE GD ARENA — SHARED UX DESIGN SYSTEM & STUDENT METADATA
 *
 * Strictly student-facing UX tokens aligned with Cognalyze's white/ivory + purple
 * academic intelligence aesthetic, with full light and dark mode support.
 */

export type GDArenaTabId =
  | "overview"
  | "setup"
  | "friends"
  | "topics"
  | "skills-lab"
  | "performance"
  | "guidelines";

export type GDClientExperienceMode =
  | "standard_round"
  | "crisis_room"
  | "boardroom_debate"
  | "ethical_dilemma"
  | "case_data_discussion";

export const GD_EXPERIENCE_MODE_META: Record<
  GDClientExperienceMode,
  { label: string; badge: string; description: string; defaultTwistLabel: string }
> = {
  standard_round: {
    label: "Standard Roundtable",
    badge: "Classic",
    description: "Structured placement roundtable moving cleanly from framing to synthesis.",
    defaultTwistLabel: "Stress-Test Constraint"
  },
  crisis_room: {
    label: "Crisis War-Room",
    badge: "Live Incident",
    description: "Simulates an active service, PR, or security incident demanding immediate triage.",
    defaultTwistLabel: "Breaking Incident Escalation"
  },
  boardroom_debate: {
    label: "Boardroom Strategy",
    badge: "Executive",
    description: "High-stakes leadership committee evaluating capital efficiency and risk.",
    defaultTwistLabel: "CFO / Board Mandate Shift"
  },
  ethical_dilemma: {
    label: "Ethical & Policy Dilemma",
    badge: "Governance",
    description: "Explores privacy, algorithmic fairness, whistleblower duties, and public trust.",
    defaultTwistLabel: "Public Accountability Shock"
  },
  case_data_discussion: {
    label: "Case & Constraint Brief",
    badge: "Analytical",
    description: "Grounds debate around explicit scenario constraints and adoption bottlenecks.",
    defaultTwistLabel: "Updated Field Constraint"
  }
};

export interface GDArenaTabMeta {
  id: GDArenaTabId;
  label: string;
  shortLabel: string;
  description: string;
}

export const GD_ARENA_TABS: GDArenaTabMeta[] = [
  {
    id: "overview",
    label: "Overview",
    shortLabel: "Overview",
    description: "Student DNA communication readiness, dynamic formats, and quick launch"
  },
  {
    id: "setup",
    label: "Start / Setup GD",
    shortLabel: "Setup GD",
    description: "Calibrate panel format, difficulty, voice check, and discussion prompt"
  },
  {
    id: "friends",
    label: "Friends GD",
    shortLabel: "Friends GD",
    description: "Host or join a private peer discussion room with real students"
  },
  {
    id: "topics",
    label: "Topic Library",
    shortLabel: "Topics",
    description: "Searchable curated & AI-synthesized placement discussion topics"
  },
  {
    id: "skills-lab",
    label: "GD Skills Lab",
    shortLabel: "Skills Lab",
    description: "12 targeted micro-drills for openings, bridging, counters, and synthesis"
  },
  {
    id: "performance",
    label: "Performance Centre",
    shortLabel: "Performance",
    description: "8-dimension competency trends, session logs, and Student DNA signals"
  },
  {
    id: "guidelines",
    label: "Guidelines & Conduct",
    shortLabel: "Guidelines",
    description: "Discussion etiquette, 3-warning moderation policy, and appeal submissions"
  }
];

export interface GDThemeTokens {
  bgPage: string;
  bgCard: string;
  bgSubtle: string;
  bgElevated: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSecondary: string;
  accentSoft: string;
  accentBorder: string;
  info: string;
  infoSoft: string;
  infoBorder: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  shadowCard: string;
}

export function getGDTheme(isDark: boolean): GDThemeTokens {
  return {
    bgPage: isDark ? "#07111F" : "#F6F5F1",
    bgCard: isDark ? "#0D1829" : "#FFFFFF",
    bgSubtle: isDark ? "#13243A" : "#FAF9F5",
    bgElevated: isDark ? "#172C46" : "#F1EFE9",
    border: isDark ? "#223750" : "#E4E1DA",
    borderStrong: isDark ? "#2F4B6E" : "#D0CCC2",
    textPrimary: isDark ? "#F4F7FF" : "#162A43",
    textSecondary: isDark ? "#B7C4D8" : "#475467",
    textMuted: isDark ? "#8292AA" : "#667085",
    accent: isDark ? "#818CF8" : "#4F46E5",
    accentSecondary: isDark ? "#A78BFA" : "#7C3AED",
    accentSoft: isDark ? "rgba(99, 102, 241, 0.16)" : "#EEF2FF",
    accentBorder: isDark ? "rgba(129, 140, 248, 0.35)" : "#C7D2FE",
    info: isDark ? "#60A5FA" : "#3478F6",
    infoSoft: isDark ? "rgba(52, 120, 246, 0.14)" : "#EFF4FE",
    infoBorder: isDark ? "rgba(52, 120, 246, 0.35)" : "#D2E0FB",
    success: isDark ? "#34D399" : "#059669",
    successSoft: isDark ? "rgba(16, 185, 129, 0.14)" : "#ECFDF5",
    warning: isDark ? "#FBBF24" : "#D97706",
    warningSoft: isDark ? "rgba(245, 158, 11, 0.14)" : "#FFFBEB",
    danger: isDark ? "#F87171" : "#DC2626",
    dangerSoft: isDark ? "rgba(239, 68, 68, 0.14)" : "#FEF2F2",
    shadowCard: isDark
      ? "0 4px 16px rgba(0, 0, 0, 0.35)"
      : "0 1px 3px rgba(16, 24, 40, 0.05), 0 1px 2px rgba(16, 24, 40, 0.03)"
  };
}

export interface GDExperienceModeSpec {
  id: "collaborative" | "competitive" | "corporate" | "technical_business";
  label: string;
  tagline: string;
  panelDynamics: string;
  bestFor: string;
}

export const GD_EXPERIENCE_MODES: GDExperienceModeSpec[] = [
  {
    id: "competitive",
    label: "Competitive Placement",
    tagline: "Fast-paced campus shortlist round",
    panelDynamics: "Assertive peers compete for floor time while the evaluator tracks concise impact.",
    bestFor: "Day-1 campus hiring, interruption resilience, and sharp positioning."
  },
  {
    id: "collaborative",
    label: "Collaborative Problem-Solving",
    tagline: "Consensus & synthesis panel",
    panelDynamics: "Balanced turn-taking rewarded; bridging viewpoints scores higher than aggression.",
    bestFor: "Product, team-fit, and cross-functional consensus discussions."
  },
  {
    id: "corporate",
    label: "Corporate Boardroom / Case",
    tagline: "Executive decision trade-offs",
    panelDynamics: "Structured ROI, customer risk, and operational governance debate.",
    bestFor: "Strategy, consulting, and leadership assessment centers."
  },
  {
    id: "technical_business",
    label: "Technical & Architecture Trade-Off",
    tagline: "Engineering scale vs business constraints",
    panelDynamics: "Debate latency, reliability, security posture, and engineering velocity.",
    bestFor: "SDE, Backend, AI/ML, and Systems engineering roles."
  }
];

export interface GDSkillTrackSpec {
  id: string;
  title: string;
  category: "Opening" | "Reasoning" | "Interaction" | "Leadership" | "Composure";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  durationMinutes: number;
  objective: string;
  rubricFocus: string[];
  dnaTag: string;
}

export const GD_SKILLS_LAB_TRACKS: GDSkillTrackSpec[] = [
  {
    id: "skill-opening-strong",
    title: "Opening Strong in 30 Seconds",
    category: "Opening",
    difficulty: "Beginner",
    durationMinutes: 4,
    objective: "Frame the core tension, define key terms, and set a constructive direction before the panel fractures.",
    rubricFocus: ["Definition clarity", "Neutral framing", "Thesis hook"],
    dnaTag: "Executive Communication"
  },
  {
    id: "skill-structured-peel",
    title: "Structured PEEL Argument Framing",
    category: "Reasoning",
    difficulty: "Beginner",
    durationMinutes: 5,
    objective: "Deliver Point, Evidence, Explanation, and Link-back in under 45 seconds without rambling.",
    rubricFocus: ["Logical progression", "Zero filler phrasing", "Direct conclusion"],
    dnaTag: "Structured Reasoning"
  },
  {
    id: "skill-active-listening",
    title: "Active Listening & Peer Bridging",
    category: "Interaction",
    difficulty: "Beginner",
    durationMinutes: 5,
    objective: "Reference a peer's exact premise by name, validate what holds, and extend the argument forward.",
    rubricFocus: ["Accurate citation", "Constructive pivot", "No siloed monologues"],
    dnaTag: "Active Listening"
  },
  {
    id: "skill-evidence-data",
    title: "Evidence-Backed Trade-Off Reasoning",
    category: "Reasoning",
    difficulty: "Intermediate",
    durationMinutes: 6,
    objective: "Replace vague assertions with concrete metrics, failure scenarios, and quantifiable constraints.",
    rubricFocus: ["Grounded benchmarks", "Constraint realism", "Scope qualification"],
    dnaTag: "Technical Depth"
  },
  {
    id: "skill-constructive-counter",
    title: "Constructive Counter-Arguments",
    category: "Reasoning",
    difficulty: "Intermediate",
    durationMinutes: 5,
    objective: "Challenge a flawed assumption directly while preserving psychological safety and panel decorum.",
    rubricFocus: ["Targeted rebuttal", "Steelmanning first", "Non-defensive tone"],
    dnaTag: "Critical Thinking"
  },
  {
    id: "skill-handling-interruptions",
    title: "Handling Interruptions Gracefully",
    category: "Composure",
    difficulty: "Intermediate",
    durationMinutes: 5,
    objective: "Reclaim floor space cleanly or yield strategically after an interruption without losing composure.",
    rubricFocus: ["Firm verbal anchor", "Emotional control", "Concise completion"],
    dnaTag: "Floor Command"
  },
  {
    id: "skill-redirect-monopolizer",
    title: "Redirecting Dominant Speakers",
    category: "Leadership",
    difficulty: "Advanced",
    durationMinutes: 6,
    objective: "De-escalate circular monologues politely and reopen the floor to broader evidence.",
    rubricFocus: ["Tactful interruption", "Time stewardship", "Inclusive pivot"],
    dnaTag: "Group Leadership"
  },
  {
    id: "skill-draw-quiet-peer",
    title: "Drawing Quiet Participants In",
    category: "Leadership",
    difficulty: "Intermediate",
    durationMinutes: 4,
    objective: "Spot silent panel members and invite their perspective cleanly without sounding patronizing.",
    rubricFocus: ["Situational awareness", "Genuine prompt", "Team alignment"],
    dnaTag: "Collaboration"
  },
  {
    id: "skill-mid-synthesis",
    title: "Mid-Discussion Synthesis & Reset",
    category: "Leadership",
    difficulty: "Advanced",
    durationMinutes: 6,
    objective: "Summarize two competing camps mid-session and steer the group toward unresolved risks.",
    rubricFocus: ["Fair two-sided summary", "Gap identification", "Momentum recovery"],
    dnaTag: "Synthesis"
  },
  {
    id: "skill-clean-conclusion",
    title: "Concluding Without Repeating Points",
    category: "Opening",
    difficulty: "Beginner",
    durationMinutes: 4,
    objective: "Deliver a crisp consensus-oriented closing statement reflecting actual panel evolution.",
    rubricFocus: ["Consensus reflection", "Actionable takeaway", "Time discipline"],
    dnaTag: "Executive Presence"
  },
  {
    id: "skill-abstract-framing",
    title: "Abstract & Ethical Dilemma Structuring",
    category: "Reasoning",
    difficulty: "Advanced",
    durationMinutes: 6,
    objective: "Break open-ended or philosophical topics into stakeholder, economic, and ethical pillars.",
    rubricFocus: ["Multi-lens framework", "Clear definitions", "Real-world grounding"],
    dnaTag: "Adaptability"
  },
  {
    id: "skill-composure-pressure",
    title: "Composure Under Hostile Cross-Examination",
    category: "Composure",
    difficulty: "Advanced",
    durationMinutes: 6,
    objective: "Stay analytical, concise, and respectful when multiple challengers test your core thesis.",
    rubricFocus: ["Zero aggression", "Calm concession when valid", "Principle defense"],
    dnaTag: "Stress Resilience"
  }
];
