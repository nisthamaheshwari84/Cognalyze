/**
 * lib/skills/behavioral-curriculum.ts
 * Comprehensive Behavioral & Corporate HR Curriculum, Question Bank, and Adaptive Evaluation Engine.
 * 
 * Implements:
 * 1. 12 Core Behavioral Competencies with full learning guides:
 *    - Extreme Ownership, Disagree & Commit, Handling Failure, Bias for Action,
 *      Customer Obsession, Dive Deep, Leadership & Initiative, Teamwork & Conflict,
 *      Prioritization & Pressure, Invent & Simplify, Corporate Stability (Service HR),
 *      Ethical Integrity & Engineering Standards.
 * 2. 40+ Rich, Categorized Behavioral Questions (Product STAR & Service HR).
 * 3. Honest, evidence-based answer evaluation (STAR completeness, "I" vs "we" ownership, metrics).
 * 4. Dynamic follow-up probing engine that responds to the candidate's actual text.
 * 5. Multi-question interview session generator with history tracking & candidate isolation.
 */

import { BehavioralQuestion, SEED_BEHAVIORAL_QUESTIONS } from "@/lib/skill-hub-store";
import { getCandidateSeenQuestionIds, getCandidateAttempts } from "@/lib/skills/candidate-history";

// ── 1. COMPETENCY DATA MODELS ───────────────────────────────────────────────

export type CompetencyId =
  | "extreme_ownership"
  | "disagree_and_commit"
  | "handling_failure"
  | "bias_for_action"
  | "customer_obsession"
  | "dive_deep"
  | "leadership_initiative"
  | "teamwork_conflict"
  | "prioritization_pressure"
  | "invent_and_simplify"
  | "corporate_stability"
  | "ethical_integrity";

export type CompetencyStatus = "NOT_ASSESSED" | "DEVELOPING" | "PROGRESSING" | "STRONG";

export interface CompetencyGuide {
  id: CompetencyId;
  name: string;
  shortTitle: string;
  icon: string;
  trackType: "faang_star" | "service_hr" | "universal";
  definition: string;
  interviewerIntent: string;
  positiveSignals: string[];
  redFlags: string[];
  weakAnswerExample: {
    answer: string;
    whyItFails: string;
  };
  strongAnswerExample: {
    situation: string;
    task: string;
    action: string;
    result: string;
    whyItHires: string;
  };
  checkpoint: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  samplePracticeQuestionId: string;
}

export interface BehavioralQuestionFull extends Omit<BehavioralQuestion, "track_type"> {
  track_type: "service_hr" | "faang_star" | "universal";
  competency_id: CompetencyId;
  difficulty: "Foundational" | "Mid-Level" | "Bar-Raiser";
  seniority: "Campus / Entry-Level" | "Associate SDE" | "Mid-Senior";
  isProjectAdaptable?: boolean;
  followUpProbes: {
    missingOwnership: string;
    missingMetrics: string;
    missingResolution: string;
    challengePerspective: string;
  };
}

// ── 2. 12 CORE COMPETENCY LEARNING GUIDES (LEARN MODE) ─────────────────────

export const BEHAVIORAL_COMPETENCY_GUIDES: CompetencyGuide[] = [
  {
    id: "extreme_ownership",
    name: "Extreme Ownership & Personal Accountability",
    shortTitle: "Ownership",
    icon: "🛡️",
    trackType: "universal",
    definition: "Taking 100% responsibility for the end-to-end outcome of a deliverable, without passing blame to dependencies, teammates, or external constraints.",
    interviewerIntent: "Interviewers look for candidates who proactively step in to resolve blockers, admit their own mistakes, and institute mechanisms to ensure issues never recur.",
    positiveSignals: [
      "Uses clear 'I' statements when describing action and responsibility",
      "Fixes the immediate problem first before conducting root-cause analysis",
      "Institutes automated or systematic mechanisms to prevent recurrence",
      "Refuses to say 'that was not my job' or deflect blame to teammates"
    ],
    redFlags: [
      "Hiding behind 'we decided' or 'the team failed to inform me'",
      "Blaming QA, backend engineers, or product managers for production bugs",
      "Stopping at identifying the problem without executing a solution",
      "Claiming they have never made a mistake or that mistakes were minor"
    ],
    weakAnswerExample: {
      answer: "We had a production bug before demo day because the backend team changed the API endpoints without telling us. The team panicked and our demo crashed. It wasn't really my fault because I was only working on the frontend components.",
      whyItFails: "Total lack of ownership. The candidate passively points fingers at the backend team and accepts failure rather than coordinating a fallback or verifying API contracts."
    },
    strongAnswerExample: {
      situation: "48 hours before our capstone demo, our primary third-party auth service deprecated an API schema, breaking user logins.",
      task: "I realized relying on an unpinned external API was a risk I had overlooked. I took full ownership of restoring authentication.",
      action: "I audited the breaking endpoints, coordinated a fallback JWT cookie mechanism, and stayed overnight to rewrite our auth middleware with automated contract tests in CI.",
      result: "We deployed 12 hours ahead of the demo with 100% login success across 400 user sessions. I documented our API contract protocol to prevent future deprecation breaks.",
      whyItHires: "Demonstrates immediate personal agency, technical execution under pressure, and systemic prevention."
    },
    checkpoint: {
      question: "Which of the following phrases is a red flag indicating weak ownership?",
      options: [
        "A. 'I realized I should have added schema validation in our CI pipeline earlier.'",
        "B. 'The backend team missed the deadline, so our feature naturally had to be delayed.'",
        "C. 'I proposed an interim fallback while we investigated the root cause.'",
        "D. 'I stayed to help the DevOps team deploy the emergency patch.'"
      ],
      correctIndex: 1,
      explanation: "Option B deflects blame to another team instead of taking ownership to mitigate the delay or communicate proactively."
    },
    samplePracticeQuestionId: "beh-prod-5"
  },
  {
    id: "disagree_and_commit",
    name: "Constructive Disagreement & Commit",
    shortTitle: "Disagree & Commit",
    icon: "🤝",
    trackType: "faang_star",
    definition: "Having the backbone to respectfully challenge ideas with data when you disagree, but committing 100% to the team's final decision once made.",
    interviewerIntent: "Evaluates intellectual humility, data-driven persuasion, and the ability to work cohesively without harboring resentment after a debate.",
    positiveSignals: [
      "Brings objective data or benchmark proofs rather than emotional opinions",
      "Understands the legitimate arguments of the counter-party",
      "Executes the agreed-upon direction with full enthusiasm even if it wasn't their first choice"
    ],
    redFlags: [
      "Passive aggressiveness or saying 'I told you so' when an alternative hits a snag",
      "Backing down immediately without presenting evidence",
      "Escalating emotionally without objective metrics"
    ],
    weakAnswerExample: {
      answer: "My teammate wanted to use MongoDB and I wanted PostgreSQL. We argued back and forth for days. Eventually our professor told us to use Postgres, so I was proven right in the end.",
      whyItFails: "Focuses on personal ego ('I was proven right') and external authority rather than data-driven resolution or respectful collaboration."
    },
    strongAnswerExample: {
      situation: "During architecture design, a teammate wanted MongoDB for fast setup, while I advocated PostgreSQL for ACID transaction guarantees in our e-commerce checkout.",
      task: "I needed to resolve the technical disagreement without stalling our 2-week sprint or creating interpersonal friction.",
      action: "I built a 30-minute stress-test script demonstrating that under concurrent payment simulation, MongoDB had 3% dirty reads without complex locks, whereas PostgreSQL maintained 100% consistency with sub-10ms latency. Seeing the benchmark, my teammate agreed.",
      result: "We processed 15,000 simulated checkouts with zero discrepancies. My teammate thanked me for bringing data, and we established benchmark testing as our team's standard debate resolution tool.",
      whyItHires: "Uses empirical data instead of ego, respects the teammate, and institutionalizes a healthy engineering culture."
    },
    checkpoint: {
      question: "What is the primary indicator of a strong 'Disagree and Commit' mindset?",
      options: [
        "A. Continuing to lobby for your preferred solution after the team reaches consensus.",
        "B. Giving in immediately to avoid conflict with senior developers.",
        "C. Presenting data-backed alternatives, but executing the chosen decision with 100% effort.",
        "D. Asking the team manager to make all architectural decisions."
      ],
      correctIndex: 2,
      explanation: "Option C captures the Amazon Leadership Principle: have backbone to debate, but commit fully to the team's chosen path."
    },
    samplePracticeQuestionId: "beh-2"
  },
  {
    id: "handling_failure",
    name: "Learning from Failure & Resilience",
    shortTitle: "Failure & Resilience",
    icon: "🔄",
    trackType: "universal",
    definition: "Acknowledging personal errors, diagnosing the root cause transparently, and converting failure into systemic improvements and resilience.",
    interviewerIntent: "Assesses vulnerability, maturity, and whether the candidate learns from mistakes or repeats them.",
    positiveSignals: [
      "Readily admits a real, non-trivial mistake without minimizing it",
      "Focuses on the immediate remediation steps taken",
      "Explains the permanent architectural or operational safeguard introduced"
    ],
    redFlags: [
      "Claiming a fake flaw (e.g. 'My biggest failure is that I am too much of a perfectionist')",
      "Shifting blame to ambiguous external circumstances",
      "Failing to explain what was learned or what changed afterward"
    ],
    weakAnswerExample: {
      answer: "I don't really have any major failures because I plan everything carefully. Once I forgot to format my code before a commit, but I fixed it right away.",
      whyItFails: "Dishonest and avoids vulnerability. Interviewers know every engineer makes mistakes; claiming none shows lack of experience or self-awareness."
    },
    strongAnswerExample: {
      situation: "During my internship, I pushed an unindexed migration script to staging that dropped a foreign key constraint, spiking API latency from 45ms to 4.2 seconds.",
      task: "I needed to immediately remediate the staging outage and prevent similar database degradation from ever reaching production.",
      action: "I alerted the team on Slack immediately without hiding the issue, rolled back the migration within 8 minutes, and ran EXPLAIN query plans. Afterward, I authored a pre-commit lint rule that inspects all SQL migrations for accidental DROP INDEX operations.",
      result: "Staging latency returned to 45ms. My team adopted the pre-commit hook across all repositories, catching two similar risks in subsequent sprints.",
      whyItHires: "Transparent communication, fast rollback, and a permanent automated safety rail."
    },
    checkpoint: {
      question: "What makes a failure story truly effective in an interview?",
      options: [
        "A. Demonstrating that the failure wasn't really your fault.",
        "B. Choosing a trivial mistake so you still look flawless.",
        "C. Transparently admitting a real error, explaining the fix, and showing the permanent mechanism you built.",
        "D. Explaining that the company's bad infrastructure caused your code to crash."
      ],
      correctIndex: 2,
      explanation: "Option C shows high emotional maturity, technical honesty, and the ability to turn failure into systemic reliability."
    },
    samplePracticeQuestionId: "beh-prod-5"
  },
  {
    id: "bias_for_action",
    name: "Bias for Action & Navigating Ambiguity",
    shortTitle: "Bias for Action",
    icon: "⚡",
    trackType: "faang_star",
    definition: "Making calculated, rapid progress in ambiguous environments with incomplete data, recognizing that many decisions are reversible (two-way doors).",
    interviewerIntent: "Distinguishes engineers who suffer from analysis paralysis from those who create forward momentum while managing risk.",
    positiveSignals: [
      "Recognizes two-way door decisions (speed over exhaustive data)",
      "Uses small prototypes or telemetry to answer unknowns",
      "Communicates calculated risk and rollback plans"
    ],
    redFlags: [
      "Waiting days for a manager to provide instructions on minor blockers",
      "Reckless action that causes outages without rollback capability",
      "Perfectionism that blocks shipping critical fixes"
    ],
    weakAnswerExample: {
      answer: "The client requirements were completely unclear. So our team decided to wait two weeks until the next stakeholder meeting to get full clarification before writing any code.",
      whyItFails: "Total analysis paralysis. Shows zero initiative to build a quick proof-of-concept, formulate hypotheses, or unblock progress."
    },
    strongAnswerExample: {
      situation: "During a hackathon app launch, 15% of mobile users experienced checkout failures, but server logs had no stacktraces.",
      task: "I had incomplete telemetry and only 6 hours of launch traffic remaining. I couldn't wait days for full analytics integration.",
      action: "Recognizing this was a reversible two-way door, I wrote a lightweight 10-line client logger capturing browser viewport and OS. Within 2 hours, data showed iOS Safari 16 was blocking third-party storage cookies. I deployed a server-side session fallback that night.",
      result: "Checkout failure rate dropped from 15% to 0.2% for 2,400 active shoppers within 3 hours.",
      whyItHires: "Identifies reversible decisions, acts with speed, and delivers quantifiable user recovery."
    },
    checkpoint: {
      question: "When is a 'Bias for Action' most critical according to modern engineering standards?",
      options: [
        "A. When deploying high-risk one-way door architectural rewrites without testing.",
        "B. When facing ambiguous user issues where rapid telemetry or a reversible fallback can unblock customers.",
        "C. Only when your manager explicitly tells you to rush.",
        "D. When skipping security reviews to hit a sprint deadline."
      ],
      correctIndex: 1,
      explanation: "Option B highlights two-way door decision making: moving fast with safe, reversible interventions under ambiguity."
    },
    samplePracticeQuestionId: "beh-5"
  },
  {
    id: "customer_obsession",
    name: "Customer Obsession & User Advocacy",
    shortTitle: "Customer Obsession",
    icon: "❤️",
    trackType: "universal",
    definition: "Working backwards from real customer pain points and prioritizing long-term user trust over short-term vanity metrics or internal convenience.",
    interviewerIntent: "Checks if the candidate builds software for real human impact rather than just satisfying resume-driven tech stack desires.",
    positiveSignals: [
      "Speaks passionately about user experience and reducing friction",
      "Gathers direct user feedback rather than relying on assumptions",
      "Advocates for accessibility, performance, and reliability for end users"
    ],
    redFlags: [
      "Prioritizing fancy tech architectures that harm user latency",
      "Dismissing user bug reports as 'user error'",
      "Focusing only on what the manager asked for without considering customer impact"
    ],
    weakAnswerExample: {
      answer: "We built the app using GraphQL and Microservices because those are the latest industry technologies. The users had some complaints about loading times, but our backend was modern.",
      whyItFails: "Resume-driven development. Cares more about modern tech buzzwords than actual customer latency or satisfaction."
    },
    strongAnswerExample: {
      situation: "Our campus portal had a 45% drop-off rate on course enrollment day because students with slow 3G cellular connections timed out on heavy bundle assets.",
      task: "I needed to make course registration reliable for every student, regardless of their device hardware or connection speed.",
      action: "I audited our bundle using Webpack analyzer, removed 1.2MB of unused libraries, implemented route-based code splitting, and added an offline-first service worker with optimistic UI updates.",
      result: "Bundle size decreased by 68%, load time dropped from 8.4s to 1.8s on 3G, and course registration drop-offs dropped to near zero across 3,500 students.",
      whyItHires: "Puts user constraints first, identifies root performance bottlenecks, and measures real user success."
    },
    checkpoint: {
      question: "Which action best demonstrates genuine Customer Obsession?",
      options: [
        "A. Convincing users to upgrade to expensive new phones so your app runs smoothly.",
        "B. Optimizing application performance and accessibility based on real user network constraints.",
        "C. Refactoring clean working code to use a trendy framework nobody asked for.",
        "D. Ignoring negative user feedback because the app works fine on your local machine."
      ],
      correctIndex: 1,
      explanation: "Option B prioritizes real user conditions and solves genuine customer friction."
    },
    samplePracticeQuestionId: "beh-5"
  },
  {
    id: "corporate_stability",
    name: "Corporate Culture, Adaptability & Service Alignment",
    shortTitle: "Service HR Culture",
    icon: "🏢",
    trackType: "service_hr",
    definition: "Demonstrating professional maturity, geographic flexibility, shift readiness, and commitment to enterprise client delivery standards (TCS, Infosys, Wipro, Accenture).",
    interviewerIntent: "Service firms eliminate over 25% of candidates in the HR round for hesitation regarding relocation, 24/7 client rotations, or service agreements. Tests enterprise adaptability.",
    positiveSignals: [
      "Comfort with multi-year service commitments and relocation across India/global client sites",
      "Appreciation of enterprise-scale systems (banking, healthcare) over prototype hype",
      "Willingness to learn unfamiliar legacy or enterprise technologies (Mainframe, Java, Testing)"
    ],
    redFlags: [
      "Hesitation about rotational night shifts or relocation",
      "Speaking condescendingly about IT services vs startups",
      "Giving the impression of using the job as a 6-month stopgap for GATE/CAT/MBA"
    ],
    weakAnswerExample: {
      answer: "I only want to work in Bangalore or Pune because I don't like other cities. Also, I only want to work on React and AI; I will not do testing or mainframe support.",
      whyItFails: "Instant rejection flag for service companies. Shows inflexibility, regional bias, and resistance to enterprise client staffing needs."
    },
    strongAnswerExample: {
      situation: "The interviewer asks about joining a large IT consultancy with relocation across India and potential allocation to an unfamiliar technology domain.",
      task: "Position my engineering goals: mastering enterprise software engineering and business domain logic.",
      action: "I emphasize my adaptability from hostel life, state 100% comfort with relocation and rotational shifts, and explain that enterprise banking/retail systems run on diverse backbones. I view any assignment as an opportunity to master mission-critical client infrastructure.",
      result: "Clear alignment with company delivery models, positioning me as a versatile, dependable asset for global engagements.",
      whyItHires: "Demonstrates corporate maturity, high adaptability, and authentic readiness for global client consulting."
    },
    checkpoint: {
      question: "Why do enterprise IT services firms ask about rotational night shifts and relocation?",
      options: [
        "A. To see if you will complain and refuse.",
        "B. Because global Fortune 500 clients operate across 24/7 timezones and require operational stability.",
        "C. As a trick question where you should say no.",
        "D. Because they don't have offices in major cities."
      ],
      correctIndex: 1,
      explanation: "Global IT services firms run mission-critical 24/7 systems for worldwide clients. Confirming flexibility is essential."
    },
    samplePracticeQuestionId: "beh-srv-shifts"
  },
  {
    id: "dive_deep",
    name: "Dive Deep & Root Cause Analysis",
    shortTitle: "Dive Deep",
    icon: "🔬",
    trackType: "faang_star",
    definition: "Operating at all levels, staying connected to the details, auditing frequently, and investigating anomalies down to the fundamental source code, memory, or packet level rather than applying superficial band-aids.",
    interviewerIntent: "Evaluates whether the candidate investigates bugs and performance bottlenecks systematically, or merely applies guess-and-check patches and restarts.",
    positiveSignals: [
      "Using profilers, flame graphs, and network telemetry to isolate root causes",
      "Refusing to accept 'it fixed itself after container reboot'",
      "Documenting post-mortems and building permanent automated regression guardrails"
    ],
    redFlags: [
      "Randomly modifying code until an error disappears without knowing why",
      "Blaming external cloud providers or hardware without forensic evidence",
      "Stopping investigation at the first surface-level symptom"
    ],
    weakAnswerExample: {
      answer: "Our server crashed periodically, so we set up a cron job to restart the container every 3 hours so users wouldn't notice the issue.",
      whyItFails: "Hides the defect rather than identifying the root cause. A classic red flag for technical depth and production reliability."
    },
    strongAnswerExample: {
      situation: "During peak traffic, our backend microservice experienced gradual latency spikes from 120ms to over 4,000ms until pod OOM kills.",
      task: "Isolate and eliminate the underlying memory leak before our quarterly flash sale.",
      action: "I connected Node.js inspector in a staging replica and captured heap snapshots across 10,000 simulated requests. Comparing allocations, I discovered an unbounded in-memory cache retaining unsubscribed event listeners. I refactored the listener cleanup in an ngOnDestroy lifecycle hook and replaced the ad-hoc cache with an LRU cache capped at 50MB with automated TTL eviction.",
      result: "Memory usage stabilized at 85MB flat, p99 latency dropped back to 95ms, and the service handled 2.4M flash sale requests without a single pod restart.",
      whyItHires: "Demonstrates scientific root-cause isolation using professional profiling tools, permanent systemic fix, and zero hand-waving."
    },
    checkpoint: {
      question: "What is the primary indicator of a strong 'Dive Deep' response?",
      options: [
        "A. Explaining that you rebooted the server until the error stopped.",
        "B. Isolating the specific low-level root cause using profiling, logs, or metrics, and fixing it permanently.",
        "C. Re-assigning the Jira ticket to the infrastructure team.",
        "D. Increasing the RAM on the cloud server without investigating memory usage."
      ],
      correctIndex: 1,
      explanation: "Dive Deep requires rigorous evidence-based investigation down to root causes rather than cosmetic workarounds."
    },
    samplePracticeQuestionId: "beh-deep-1"
  },
  {
    id: "leadership_initiative",
    name: "Leadership & Influencing Without Authority",
    shortTitle: "Leadership & Influence",
    icon: "⚡",
    trackType: "universal",
    definition: "Rallying peers, unblocking teammates, driving high engineering standards, and taking initiative without waiting for formal permission or management titles.",
    interviewerIntent: "Tests whether the candidate is a passive ticket-taker or a force multiplier who elevates the whole engineering team.",
    positiveSignals: [
      "Mentoring struggling peers and proactively unblocking team bottlenecks",
      "Volunteering for tedious or difficult shared engineering tasks",
      "Building consensus using objective data and empathetic communication"
    ],
    redFlags: [
      "Believing leadership requires being appointed team lead or manager",
      "Dictating solutions without listening to team concerns",
      "Refusing to help teammates because 'it is not in my job description'"
    ],
    weakAnswerExample: {
      answer: "I was the team lead on my college project, so I assigned all the tasks to my group members and told them they had to finish by Friday.",
      whyItFails: "Displays hierarchical task-delegation rather than genuine collaborative leadership, peer empowerment, or shared problem solving."
    },
    strongAnswerExample: {
      situation: "Our 4-person capstone team was stalled for 5 days over database schema design, causing frustration and missed weekly milestones.",
      task: "Break the deadlock and re-energize team velocity without imposing unilateral authority.",
      action: "I created an objective trade-off matrix comparing relational PostgreSQL vs MongoDB against our actual app query patterns. I hosted an informal whiteboarding session, validated each teammate's architectural concerns, and proposed a hybrid approach using Postgres JSONB columns. I then volunteered to write the initial migration script and schema validator.",
      result: "The team unanimously agreed, velocity increased by 40%, and we shipped our sprint MVP 2 days ahead of the presentation.",
      whyItHires: "Shows empathetic consensus building, objective technical evaluation, and leading by personal contribution."
    },
    checkpoint: {
      question: "How does a top-tier candidate demonstrate leadership in entry-level engineering interviews?",
      options: [
        "A. By insisting on their personal ideas because they know best.",
        "B. By showing how they unblocked peers, fostered consensus with data, and led by example.",
        "C. By complaining that team members didn't do their assigned homework.",
        "D. By waiting until the professor or engineering manager intervenes."
      ],
      correctIndex: 1,
      explanation: "Peer leadership is about unblocking others, driving consensus with data, and delivering shared success without needing formal authority."
    },
    samplePracticeQuestionId: "beh-lead-1"
  },
  {
    id: "teamwork_conflict",
    name: "Cross-Functional Collaboration & Dealing with Difficult Teammates",
    shortTitle: "Teamwork & Conflict",
    icon: "🤝",
    trackType: "universal",
    definition: "Working effectively with diverse personalities, resolving interpersonal friction professionally, and maintaining team morale and collective outcomes.",
    interviewerIntent: "Checks emotional intelligence (EQ), ego management, constructive communication, and whether the candidate will create toxic friction or build strong partnerships.",
    positiveSignals: [
      "Addressing interpersonal friction privately and respectfully before escalating",
      "Assuming good intent and focusing on shared project objectives",
      "Active listening and adapting communication styles to different teammates"
    ],
    redFlags: [
      "Publicly humiliating or blaming a colleague in group chats or meetings",
      "Passive-aggressive behavior, withholding information, or malicious compliance",
      "Escalating trivial disagreements directly to management without attempting 1-on-1 dialogue"
    ],
    weakAnswerExample: {
      answer: "One teammate was completely useless and didn't write any code. So I complained to the professor to get them removed from our group, and we finished the project without them.",
      whyItFails: "Total failure of empathy and conflict resolution. Portrays the candidate as uncollaborative, vindictive, and quick to write people off."
    },
    strongAnswerExample: {
      situation: "During a hackathon, our UI designer and backend engineer had a heated argument over API contract schemas, causing the backend dev to stop replying to messages.",
      task: "De-escalate emotional tension and restore collaboration under a strict 24-hour clock.",
      action: "I initiated a private 1-on-1 call with the backend engineer, listened to his frustrations regarding shifting payload requirements, and validated his concern about rework. I then scheduled a 15-minute sync with both of them, introduced an OpenAPI Swagger contract as the single source of truth, and agreed to mock the frontend endpoints so both could work in parallel without blocking.",
      result: "Tension dissolved immediately. Both finished their modules on time, and our team won 2nd place overall.",
      whyItHires: "Demonstrates high EQ, private mediation, de-escalation, and creating win-win engineering solutions."
    },
    checkpoint: {
      question: "What is the best initial step when dealing with a teammate who is missing deadlines or unresponsive?",
      options: [
        "A. Immediately file a complaint with their manager or professor.",
        "B. Have a private, empathetic 1-on-1 conversation to understand their blockers and find how to support them.",
        "C. Badmouth them in the team Slack channel to pressure them.",
        "D. Silently redo all their work yourself without saying anything."
      ],
      correctIndex: 1,
      explanation: "Private, respectful 1-on-1 communication uncovers hidden blockers and preserves psychological safety."
    },
    samplePracticeQuestionId: "beh-team-1"
  },
  {
    id: "prioritization_pressure",
    name: "Prioritization, High-Pressure Deadlines & Decision Making",
    shortTitle: "Prioritization & Pressure",
    icon: "⏱️",
    trackType: "universal",
    definition: "Maintaining composure, triaging competing demands using structured frameworks, and making pragmatic trade-offs when time and resources are constrained.",
    interviewerIntent: "Assesses how the candidate handles production emergencies, crunch times, and scope negotiations without burning out or compromising safety.",
    positiveSignals: [
      "Using structured triage (Eisenhower matrix, MoSCoW, impact vs effort)",
      "Proactive stakeholder communication before deadlines are breached",
      "Protecting core reliability while ruthlessly scoping out non-essential nice-to-haves"
    ],
    redFlags: [
      "Freezing up or panicking under tight deadlines",
      "Trying to do everything at once and delivering everything poorly",
      "Hiding delays until the final hour and surprising stakeholders"
    ],
    weakAnswerExample: {
      answer: "I had 3 exams and a project due on the same day. I pulled two consecutive all-nighters drinking energy drinks, rushed everything at the last minute, and was exhausted.",
      whyItFails: "Glorifies burnout and lack of planning. Shows no prioritization framework, no scope negotiation, and unsustainable execution."
    },
    strongAnswerExample: {
      situation: "Two days before our product beta launch, our third-party payments provider updated their webhook verification, breaking checkout flows while 4 other frontend features remained unmerged.",
      task: "Triage launch blockers and ensure on-time release without risking payment security.",
      action: "I immediately organized a 20-minute triage meeting. I categorized the issues: the payment webhook was a P0 showstopper, 2 frontend features were P1 nice-to-haves, and 2 were cosmetic P2s. I negotiated with product to defer the P2s to sprint +1. I paired with our backend engineer to implement HMAC signature verification for the webhook, and wrote automated integration tests.",
      result: "We launched on schedule at 9:00 AM with zero checkout errors, processing $14,000 in volume on day one.",
      whyItHires: "Shows ruthless prioritization, calm stakeholder alignment, proactive communication, and zero compromise on security."
    },
    checkpoint: {
      question: "When faced with 5 critical tasks that cannot all be finished by deadline, what is the professional engineering approach?",
      options: [
        "A. Work 24 hours straight without sleeping until everything is done.",
        "B. Triage tasks by impact vs urgency, negotiate scope early with stakeholders, and deliver core priorities with high quality.",
        "C. Silently drop the hardest tasks and hope nobody notices.",
        "D. Blame the product manager for setting unrealistic expectations."
      ],
      correctIndex: 1,
      explanation: "High performers communicate trade-offs early, prioritize high-impact essentials, and protect execution quality."
    },
    samplePracticeQuestionId: "beh-prio-1"
  },
  {
    id: "invent_and_simplify",
    name: "Innovation, Simplicity, Process Improvement & Adaptability",
    shortTitle: "Invent & Simplify",
    icon: "💡",
    trackType: "faang_star",
    definition: "Seeking innovation, finding simple solutions to complex problems, and creating automations that eliminate redundant manual toil.",
    interviewerIntent: "Tests whether the candidate over-engineers solutions or finds elegant, low-maintenance architectures that solve the problem efficiently.",
    positiveSignals: [
      "Automating repetitive manual tasks (scripts, CI/CD, linting)",
      "Choosing simple, battle-tested solutions over trendy complex tools",
      "Reducing system complexity, lines of code, and maintenance overhead"
    ],
    redFlags: [
      "Over-engineering simple requirements with unnecessary microservices or frameworks",
      "Resistance to modernizing obsolete workflows",
      "Inventing solutions in search of a problem"
    ],
    weakAnswerExample: {
      answer: "We needed a simple blog, so I set up a Kubernetes cluster with 6 microservices, Kafka message streaming, and Cassandra database because it looked cool on my resume.",
      whyItFails: "Grotesque over-engineering. Increases failure modes, cloud costs, and operational toil with zero business justification."
    },
    strongAnswerExample: {
      situation: "Our college department required students to manually fill PDF forms, print them, and wait in physical queues for faculty signatures for lab approvals.",
      task: "Streamline the approval process with zero budget and minimal maintenance.",
      action: "Instead of building a heavyweight mobile app with custom databases, I created a simple Google App Script tied to Google Forms that parsed student submissions, verified prerequisites against a sheet, automatically generated digital signature tokens via email, and logged status in real time.",
      result: "Approval turnaround dropped from 4 days to 45 seconds, eliminating physical queues for 800+ students and saving faculty 15 hours weekly.",
      whyItHires: "Demonstrates true invention through simplicity: maximum user impact with minimum infrastructure burden."
    },
    checkpoint: {
      question: "What represents the highest engineering maturity in 'Invent & Simplify'?",
      options: [
        "A. Choosing the most complex distributed architecture available.",
        "B. Solving a user problem with the simplest, most reliable, and lowest-maintenance solution possible.",
        "C. Writing 10,000 lines of custom code when an existing 10-line library exists.",
        "D. Refusing to automate any task."
      ],
      correctIndex: 1,
      explanation: "Great engineers pride themselves on simplicity and eliminating complexity, not manufacturing it."
    },
    samplePracticeQuestionId: "beh-inv-1"
  },
  {
    id: "ethical_integrity",
    name: "Ethical Situations, Accountability & Engineering Standards",
    shortTitle: "Ethics & Integrity",
    icon: "🛡️",
    trackType: "universal",
    definition: "Adhering to uncompromised ethical standards, protecting user data privacy, taking responsibility for mistakes, and doing the right thing when nobody is watching.",
    interviewerIntent: "Crucial behavioral screen. Verifies whether candidate will cut corners on security, falsify data, hide breaches, or handle sensitive user data irresponsibly.",
    positiveSignals: [
      "Refusing to deploy unencrypted credentials or insecure shortcuts",
      "Reporting errors and vulnerabilities immediately with remediation plans",
      "Protecting user privacy and respecting intellectual property"
    ],
    redFlags: [
      "Willingness to bypass data privacy regulations to meet a deadline",
      "Hiding production bugs or covering up failed builds",
      "Using proprietary code or plagiarism without attribution"
    ],
    weakAnswerExample: {
      answer: "Our deadline was in 2 hours, so we disabled input validation and SSL certificates to make the tests pass. We planned to turn them back on later, but forgot.",
      whyItFails: "Gross violation of engineering ethics and security hygiene. Introduces critical vulnerabilities to meet artificial deadlines."
    },
    strongAnswerExample: {
      situation: "While reviewing our staging database dump before a production migration, I noticed plaintext user passwords and phone numbers in an unsecured analytics bucket.",
      task: "Protect user privacy and eliminate the compliance vulnerability immediately.",
      action: "I immediately flagged the issue to our project mentor and paused the migration pipeline. I audited the analytics ingestion pipeline, implemented bcrypt hashing on ingest, purged the unsecured staging bucket, and introduced an automated pre-commit hook scanning for unencrypted PII patterns.",
      result: "Prevented exposure of 12,000 user records, established GDPR-compliant data sanitization guidelines, and received a departmental commendation.",
      whyItHires: "Proves absolute integrity: paused a launch to protect user security, resolved the root cause, and built guardrails against recurrence."
    },
    checkpoint: {
      question: "If you discover a security vulnerability in production right before a major client demo, what should you do?",
      options: [
        "A. Ignore it until after the demo so you don't look bad.",
        "B. Transparently inform leadership, assess the risk, apply immediate mitigations, and protect user data integrity.",
        "C. Secretly delete the code so nobody knows you wrote it.",
        "D. Blame another teammate."
      ],
      correctIndex: 1,
      explanation: "Professional integrity requires immediate transparency, objective risk assessment, and prioritizing security over optics."
    },
    samplePracticeQuestionId: "beh-eth-1"
  }
];

// ── 3. 40+ RICH BEHAVIORAL QUESTIONS (BANK & INTERVIEW) ────────────────────

const CURATED_BEHAVIORAL_QUESTIONS: BehavioralQuestionFull[] = [
  // ── 1. EXTREME OWNERSHIP ──
  {
    id: "beh-own-1",
    competency_id: "extreme_ownership",
    track_type: "faang_star",
    difficulty: "Bar-Raiser",
    seniority: "Associate SDE",
    title: "Stepping Up to Own an Unassigned Production Blocker",
    company_tag: "Amazon / Microsoft / Uber",
    question: "Tell me about a time when a critical issue arose that was outside your direct scope or assigned tickets. How did you handle it?",
    context_tip: "Tests whether you look away when an issue isn't 'your job' or step up to ensure customer safety.",
    star_rubric: {
      situation: "A system failure, broken CI build, or security hole that nobody had claimed.",
      task: "Deciding to take responsibility despite having your own assigned sprint deliverables.",
      action: "Triage, communicate ownership to team, resolve the blocker, and conduct postmortem.",
      result: "Restored system health, unblocked colleagues, and added automated regression guard."
    },
    ideal_response: "During our project launch, an integration test broke on main branch because of a library upgrade made by another subteam. Although it wasn't my ticket, all 6 developers were blocked from merging. I messaged the channel: 'I am taking ownership of fixing the main build.' I bisected the commits, identified that the new JWT library required an explicit algorithm parameter, wrote the patch, and had main green within 45 minutes.",
    followUpProbes: {
      missingOwnership: "What specifically was your personal contribution rather than the general team effort?",
      missingMetrics: "How much engineering time or downtime was saved by your proactive intervention?",
      missingResolution: "What mechanism did you add to ensure that specific break can never happen again?",
      challengePerspective: "Did taking on this unassigned task cause any of your own committed deadlines to slip?"
    }
  },
  {
    id: "beh-own-2",
    competency_id: "extreme_ownership",
    track_type: "faang_star",
    difficulty: "Mid-Level",
    seniority: "Campus / Entry-Level",
    title: "Owning a Serious Bug in Production You Authored",
    company_tag: "Google / Amazon / Atlassian",
    question: "Tell me about a time when code you personally wrote or reviewed broke something important. How did you react, and how did you resolve it?",
    context_tip: "Vulnerability test. Interviewers reject candidates who make excuses or pretend their code was infallible.",
    star_rubric: {
      situation: "A regression or unexpected null pointer exception that slipped through testing.",
      task: "Immediately owning the incident without concealment or deflecting to QA.",
      action: "Rapid rollback, post-incident RCA with team, and adding automated tests.",
      result: "Restored availability within minutes; built safeguards that caught subsequent errors."
    },
    ideal_response: "In our e-commerce project, I pushed an optimization to the search query that omitted pagination parameters, causing server memory spikes when returning 10,000 products. As soon as latency spiked, I alerted our lead: 'My search query PR introduced this memory leak; I am reverting it immediately.' Within 5 minutes the revert was deployed. I then added an integration test enforcing mandatory pagination limit bounds before re-submitting.",
    followUpProbes: {
      missingOwnership: "How quickly did you acknowledge the bug, and did you wait for someone else to point it out?",
      missingMetrics: "What was the measurable latency spike or error rate before and after your rollback?",
      missingResolution: "What automated lint or test rule did you implement to safeguard against recurrence?",
      challengePerspective: "Looking back, why wasn't this edge case captured in your original local testing?"
    }
  },
  {
    id: "beh-own-3",
    competency_id: "extreme_ownership",
    track_type: "service_hr",
    difficulty: "Foundational",
    seniority: "Campus / Entry-Level",
    title: "Taking Responsibility for a Missed Team Deliverable",
    company_tag: "TCS / Infosys / Wipro HR",
    question: "Describe a situation during your college or internship projects where your team missed an important milestone. What role did you play in recovering from it?",
    context_tip: "Service HR looks for maturity and team loyalty rather than throwing colleagues under the bus.",
    star_rubric: {
      situation: "A project milestone that was delayed due to scope or coordination challenges.",
      task: "Acknowledging your own share of the delivery gap.",
      action: "Organizing an emergency replanning session, redistributing tasks, and staying extra hours.",
      result: "Delivered revised scope with high quality; established weekly progress tracking."
    },
    ideal_response: "In our 4-person software lab, we underestimated the complexity of OAuth integration and missed our sprint milestone by 3 days. Instead of blaming our backend partner, I recognized I should have called for an earlier progress sync. I organized a 30-minute triage, volunteered to handle the token refresh logic, and we paired together over the weekend. We delivered a fully secure system on Monday and instituted daily 5-minute standups thereafter.",
    followUpProbes: {
      missingOwnership: "What did YOU personally do to turn the project around rather than just attend meetings?",
      missingMetrics: "How did the delayed timeline impact the final project grade or stakeholder satisfaction?",
      missingResolution: "What daily process did your team adopt to ensure milestones weren't missed again?",
      challengePerspective: "If a teammate consistently underdelivers, how do you handle it without conflict?"
    }
  },

  // ── 2. DISAGREE AND COMMIT ──
  {
    id: "beh-dis-1",
    competency_id: "disagree_and_commit",
    track_type: "faang_star",
    difficulty: "Bar-Raiser",
    seniority: "Associate SDE",
    title: "Technical Disagreement on Architecture (SQL vs NoSQL / Monolith vs Microservices)",
    company_tag: "Amazon / Google / Razorpay",
    question: "Tell me about a time when you strongly disagreed with an architectural proposal made by a senior engineer or teammate. How did you argue your case, and what happened?",
    context_tip: "Bar-Raiser filter: Look for data-backed argumentation, absence of ego, and wholehearted commitment to the chosen direction.",
    star_rubric: {
      situation: "A high-stakes architectural decision with trade-offs on consistency, latency, or complexity.",
      task: "Advocating for your technical position without creating interpersonal friction.",
      action: "Building a proof-of-concept benchmark with quantitative measurements.",
      result: "Data-driven alignment, zero personal grudges, and robust production stability."
    },
    ideal_response: "A senior teammate proposed splitting our 3-month-old student startup app into 5 microservices. I disagreed because our team had only 3 engineers, and managing distributed network calls and Kubernetes would drain our bandwidth from shipping features. Rather than arguing conceptually, I presented a resource audit showing we spent 4 hours a week on DevOps with a modular monolith versus an estimated 18 hours managing distributed tracing. We agreed to keep a clean modular monolith, and we shipped 3 major features on time.",
    followUpProbes: {
      missingOwnership: "What evidence or concrete proof did you use to substantiate your viewpoint?",
      missingMetrics: "What was the estimated engineering time or cloud cost difference between the two choices?",
      missingResolution: "Once the decision was made, how did you ensure the team worked harmoniously together?",
      challengePerspective: "What if the team had rejected your recommendation and chosen microservices — how would you react?"
    }
  },
  {
    id: "beh-dis-2",
    competency_id: "disagree_and_commit",
    track_type: "universal",
    difficulty: "Mid-Level",
    seniority: "Campus / Entry-Level",
    title: "Disagreeing with a Group Consensus on Feature Prioritization",
    company_tag: "Microsoft / Accenture / Flipkart",
    question: "Describe a time when the majority of your team wanted to go in one direction, but you believed another path was right. How did you voice your perspective?",
    context_tip: "Tests courage to speak up against groupthink and respect for collaborative consensus.",
    star_rubric: {
      situation: "Team opting for an easy shortcut or vanity feature instead of core reliability.",
      task: "Respectfully challenging the group consensus with user evidence.",
      action: "Articulated the customer risk, proposed an MVP compromise, and accepted the team vote.",
      result: "Customer-first outcome that saved the project from critical user drop-offs."
    },
    ideal_response: "During our final semester app build, my teammates wanted to spend the final week building animations and dark mode. I argued that our checkout page had an unhandled error rate of 8% on slow networks, and that addressing reliability was far more critical for user retention. I shared a screen recording of the crash. The team saw the user impact and voted to allocate 3 days to fix the error handling before adding polish.",
    followUpProbes: {
      missingOwnership: "How did you communicate your concerns without sounding critical of your peers?",
      missingMetrics: "What specific metric or user pain point proved that your concern was valid?",
      missingResolution: "How did you balance the team's desire for visual polish with your technical priorities?",
      challengePerspective: "What would you have done if the team voted against you and insisted on dark mode?"
    }
  },

  // ── 3. HANDLING FAILURE & RESILIENCE ──
  {
    id: "beh-fail-1",
    competency_id: "handling_failure",
    track_type: "faang_star",
    difficulty: "Bar-Raiser",
    seniority: "Associate SDE",
    title: "Post-Mortem: Overcoming a Failed Deployment or System Outage",
    company_tag: "Amazon / Google / Uber",
    question: "Tell me about a time when a project or deployment you worked on failed significantly. Walk me through the post-mortem: what went wrong, and what changed permanently?",
    context_tip: "Looks for blameless post-mortem culture, technical depth on root-cause, and long-term systemic fixes.",
    star_rubric: {
      situation: "A production outage, memory leak, or broken feature release.",
      task: "Leading or contributing to the blameless post-mortem analysis.",
      action: "Identified the 5 Whys, avoided finger-pointing, and added automated guardrails.",
      result: "Zero repeat incidents; documented post-mortem shared as engineering best practice."
    },
    ideal_response: "In our cloud hosting project, an unexpected traffic spike caused our relational database to exhaust its connection pool, causing a 40-minute site outage. In our post-mortem, rather than blaming the traffic surge, we asked the 5 Whys: Why did connections exhaust? Because our API server held connections during external third-party HTTP calls. I refactored the connection lifecycle to acquire DB handles only during query execution and added connection pool health monitoring.",
    followUpProbes: {
      missingOwnership: "What was your direct personal responsibility in the failure and in the fix?",
      missingMetrics: "How long was the outage, and how did your architectural fix improve concurrency limits?",
      missingResolution: "What automated alarm or circuit breaker did you install after the incident?",
      challengePerspective: "How did you keep stakeholders informed while the system was down?"
    }
  },
  {
    id: "beh-fail-2",
    competency_id: "handling_failure",
    track_type: "universal",
    difficulty: "Mid-Level",
    seniority: "Campus / Entry-Level",
    title: "Dealing with Academic or Hackathon Rejection constructively",
    company_tag: "All Tracks",
    question: "Tell me about a time when you put in immense effort into a competition, project, or exam, but the outcome was an utter disappointment. How did you process it?",
    context_tip: "Tests emotional grit, perseverance, and converting rejection into fuel for self-improvement.",
    star_rubric: {
      situation: "Losing a hackathon or receiving negative feedback on a passionate project.",
      task: "Managing disappointment without cynicism or bitterness.",
      action: "Sought direct feedback from judges/evaluators, identified key skill gaps, and practiced them.",
      result: "Used the lessons to win or successfully deliver the next engineering endeavor."
    },
    ideal_response: "In my 3rd year, my team built a real-time IoT app for a national hackathon and didn't even make the top 20 finalists. We were crushed. Instead of walking away disappointed, I approached two judges and asked: 'What was the single biggest gap in our submission?' They pointed out our tech was solid, but our UI had too much friction and we failed to demonstrate business viability. I spent the next 2 months taking UI/UX courses and learning product metrics. Six months later, at the next state hackathon, we built an accessible hospital triage app with a 2-click flow and won Second Place.",
    followUpProbes: {
      missingOwnership: "What specific feedback did you personally act upon?",
      missingMetrics: "How did your preparation change quantitatively between the first and second hackathon?",
      missingResolution: "What mental framework do you use to stay motivated when faced with rejection?",
      challengePerspective: "How did you keep your teammates motivated when they wanted to quit?"
    }
  },

  // ── 4. BIAS FOR ACTION ──
  {
    id: "beh-act-1",
    competency_id: "bias_for_action",
    track_type: "faang_star",
    difficulty: "Bar-Raiser",
    seniority: "Associate SDE",
    title: "Making Fast Progress with 60% Information under Ambiguity",
    company_tag: "Amazon / Swiggy / Uber",
    question: "Tell me about a time when you had to make an important engineering decision quickly, but only had incomplete or ambiguous information. How did you proceed?",
    context_tip: "Evaluates two-way door decision making and risk containment.",
    star_rubric: {
      situation: "Urgent deadline or live issue with sparse documentation or contradictory specs.",
      task: "Balancing the risk of action against the risk of delay.",
      action: "Identified the reversible components, implemented telemetry, and deployed an MVP.",
      result: "Unblocked the product while collecting real data to inform the long-term solution."
    },
    ideal_response: "During our hackathon project, our third-party payment gateway documentation was outdated, and our checkout form gave intermittent 500 errors with no error payload. With only 8 hours left before submission, I couldn't wait for support. I realized checkout failure was a blocker, but handling transactions via a verified Stripe webhook was a safe, well-understood pattern. I swapped the untested gateway for Stripe in 2 hours, ran 10 test card purchases, and launched on schedule.",
    followUpProbes: {
      missingOwnership: "What specific risk analysis did you do before pulling the trigger?",
      missingMetrics: "What was the time saved by taking action instead of waiting for full clarification?",
      missingResolution: "How did you monitor the deployment to ensure no hidden side effects occurred?",
      challengePerspective: "If your rapid decision had broken something, what was your rollback contingency?"
    }
  },

  // ── 5. CORPORATE STABILITY & SERVICE HR ──
  {
    id: "beh-srv-bond",
    competency_id: "corporate_stability",
    track_type: "service_hr",
    difficulty: "Foundational",
    seniority: "Campus / Entry-Level",
    title: "Handling 2-Year Service Agreement & Relocation Policy",
    company_tag: "TCS / Infosys / Wipro HR",
    question: "Our company requires a 2-year service agreement and the flexibility to relocate to any base office in India (Chennai, Bangalore, Pune, Kolkata). Are you completely comfortable with this commitment?",
    context_tip: "HR Eliminator Question: Tests corporate dependability and stability. Never hesitate or give ambiguous conditions.",
    star_rubric: {
      situation: "Acknowledge the enterprise training investment provided by the organization.",
      task: "Confirm personal readiness for relocation and multi-year professional growth.",
      action: "Cite prior adaptability (living in hostels, new cities) and enthusiasm for client projects.",
      result: "Reassure long-term corporate dedication and mutual value creation."
    },
    ideal_response: "Yes, I am 100% comfortable with both the 2-year service agreement and relocation to any base branch across India. Having lived away from my hometown in college hostels for 4 years, I adapt very quickly to new cities and diverse team environments. I view the 2-year agreement as a mutual commitment: the company invests world-class enterprise training and client mentorship in me, and I deliver reliable, high-quality engineering value across client engagements.",
    followUpProbes: {
      missingOwnership: "What specific experiences in your background demonstrate your adaptability to new cities?",
      missingMetrics: "What are your 3-year professional milestones within our organization?",
      missingResolution: "How will you handle your parents' concerns if relocated to a distant branch?",
      challengePerspective: "What if a competitor offers you 20% higher compensation after 10 months?"
    }
  },
  {
    id: "beh-srv-shifts",
    competency_id: "corporate_stability",
    track_type: "service_hr",
    difficulty: "Foundational",
    seniority: "Campus / Entry-Level",
    title: "Working in 24/7 Rotational Night Shifts for Global Banking Clients",
    company_tag: "TCS Ninja / Wipro Elite / Cognizant",
    question: "Many of our banking and healthcare clients operate in North America and Europe. You may be assigned to rotational night shifts and weekend support. Are you comfortable with this work schedule?",
    context_tip: "Service Critical Filter: Eliminates candidates who express reluctance on night shifts or off-hours support.",
    star_rubric: {
      situation: "Understand that global IT consulting operates across international business hours.",
      task: "Demonstrate professional readiness for rotational shifts.",
      action: "Explain time management habits, physical health discipline, and client focus.",
      result: "Highlight the benefit: night shifts provide direct interaction with senior overseas stakeholders."
    },
    ideal_response: "I am completely comfortable with rotational night shifts and weekend client support. In global IT consulting, mission-critical systems like core banking or patient records require uninterrupted 24/7 vigilance. Working during US or European business hours is actually an exceptional learning opportunity for an associate engineer, as it provides direct exposure to international client stakeholders and live production incident triage.",
    followUpProbes: {
      missingOwnership: "How do you maintain your health and focus during rotational sleep schedules?",
      missingMetrics: "Have you ever pulled overnight engineering marathons or project deployments successfully?",
      missingResolution: "How do you ensure seamless handover communication to the incoming morning shift?",
      challengePerspective: "What if your module lead asks you to extend your shift by 4 hours during a critical Sev-1 incident?"
    }
  },
  {
    id: "beh-srv-tech",
    competency_id: "corporate_stability",
    track_type: "service_hr",
    difficulty: "Foundational",
    seniority: "Campus / Entry-Level",
    title: "Allocation to an Unfamiliar Tech Stack or Testing / Production Support",
    company_tag: "Infosys / Wipro / Accenture HR",
    question: "You have listed Python and Web Development on your resume. What if after training, business needs require you to join a Mainframe maintenance project or Manual QA testing? How will you react?",
    context_tip: "Service Trap Question: Rejects candidates who complain about not getting modern frameworks.",
    star_rubric: {
      situation: "Recognize that client project staffing is driven by enterprise contracts.",
      task: "Showcase technology-agnostic mindset and willingness to master the client's core business.",
      action: "Explain proactive learning strategy to automate tests or modernize legacy components.",
      result: "Position yourself as an adaptable problem solver rather than a single-framework developer."
    },
    ideal_response: "I view programming languages and frameworks as tools to solve business problems, not personal identities. If allocated to Mainframe, Support, or Testing, I recognize that the world's most critical financial systems run on these exact backbones. I would dive in to master the business logic and system SLAs. Furthermore, testing and support teach you how software breaks in production, which makes you a 10x better software architect. I would also seek opportunities to safely automate repetitive test cases using Python scripts.",
    followUpProbes: {
      missingOwnership: "How would you stay motivated if the daily work involves repetitive execution?",
      missingMetrics: "What specific scripting or automation skills could you bring to a legacy system?",
      missingResolution: "How would you expand your technical learning during your personal time?",
      challengePerspective: "Will you feel frustrated seeing your batchmates assigned to cloud development?"
    }
  },

  // ── 6. LEADERSHIP & INITIATIVE ──
  {
    id: "beh-lead-1",
    competency_id: "leadership_initiative",
    track_type: "faang_star",
    difficulty: "Bar-Raiser",
    seniority: "Associate SDE",
    title: "Unblocking a Demoralized or Disconnected Team",
    company_tag: "Amazon / Google / Atlassian",
    question: "Tell me about a time when your team's momentum stalled because of morale, ambiguity, or fatigue. How did you step up to rekindle progress?",
    context_tip: "Tests peer leadership, emotional intelligence, and inspiring others without formal managerial authority.",
    star_rubric: {
      situation: "A team facing burn-out, complex technical ambiguity, or missed deadlines.",
      task: "Recognizing the emotional and technical slump and deciding to intervene.",
      action: "Broke down intimidating tasks into bite-sized 2-hour wins, paired with struggling peers.",
      result: "Restored team velocity, shipped the release, and received peer praise."
    },
    ideal_response: "During our semester project, our team spent 3 days stuck on WebSocket synchronization, and two teammates grew demoralized and stopped participating. I realized the problem seemed too overwhelming. I organized an informal working session with snacks. I broke the WebSocket problem into 3 small modules, took on the server handshake myself, and paired with each teammate on their message dispatchers. Within 4 hours, we had our first live message passing between browsers. The visual success revived everyone's energy, and we completed the project 2 days ahead of schedule.",
    followUpProbes: {
      missingOwnership: "What specific leadership action did you take without being appointed the official manager?",
      missingMetrics: "How much did team velocity improve after you restructured the deliverables?",
      missingResolution: "How did you ensure balanced workload distribution across all members?",
      challengePerspective: "What did you do if one team member still refused to contribute?"
    }
  },

  // ── 7. PRIORITIZATION & PRESSURE ──
  {
    id: "beh-prio-1",
    competency_id: "prioritization_pressure",
    track_type: "universal",
    difficulty: "Mid-Level",
    seniority: "Campus / Entry-Level",
    title: "Handling 3 Simultaneous Conflicting Deadlines",
    company_tag: "TCS / Amazon / Infosys / Razorpay",
    question: "Describe a situation where you had multiple high-priority deliverables competing for the exact same deadline. How did you triage your time and communicate with stakeholders?",
    context_tip: "Tests Eisenhower matrix prioritization, stakeholder communication, and avoiding burnout.",
    star_rubric: {
      situation: "Simultaneous project crunch (e.g. final exam, project submission, and interview prep).",
      task: "Determining what cannot slip versus what can be negotiated or delegated.",
      action: "Used structured time-blocking, communicated early trade-offs with professors/leads.",
      result: "Delivered all primary objectives with high quality without panicking."
    },
    ideal_response: "During the final week of our semester, I had our major project demo, an operating systems laboratory exam, and my campus placement test on the same Thursday. Panicking would solve nothing. I listed all deliverables and categorized them by urgency and impact. I negotiated a 24-hour extension on our project documentation with our professor by showing that our code was already 100% complete, freeing up 8 hours to focus on OS concurrency revision. I scored an 'A' on the lab exam and delivered the project demo successfully.",
    followUpProbes: {
      missingOwnership: "How did you communicate proactively with stakeholders before deadlines were missed?",
      missingMetrics: "How did you allocate your hours across the conflicting priorities?",
      missingResolution: "What time management tooling or framework do you use on a daily basis?",
      challengePerspective: "What is your strategy when a manager refuses to grant an extension on any task?"
    }
  },

  // ── 8. DIVE DEEP & ROOT CAUSE ──
  {
    id: "beh-deep-1",
    competency_id: "dive_deep",
    track_type: "faang_star",
    difficulty: "Bar-Raiser",
    seniority: "Associate SDE",
    title: "Diagnosing an Intermittent Production Heisenbug",
    company_tag: "Google / Amazon / Uber",
    question: "Tell me about a deeply elusive bug, race condition, or memory leak that others gave up on. How did you drill down to the fundamental root cause?",
    context_tip: "Tests technical rigor, telemetry analysis, and refusing to stop at surface symptoms.",
    star_rubric: {
      situation: "An intermittent failure that reproduces unpredictably in production or load testing.",
      task: "Take complete ownership of root-cause isolation without guessing or restarting pods.",
      action: "Used profilers, heap dumps, or network packet traces to isolate the exact instruction or thread interleaving.",
      result: "Proved root cause, implemented an atomic guardrail, and eliminated the defect with zero regressions."
    },
    ideal_response: "In our high-concurrency reservation app, 0.2% of users experienced phantom double-charges during flash bookings. Logs showed no exceptions. I isolated the payment worker code, attached a staging debugger with 5,000 synthetic parallel checkouts, and captured thread traces. I discovered a non-thread-safe singleton holding database connection pool references, causing thread race interleaving. I refactored the connection acquisition to a scoped per-request connection pool and added a Redis distributed lock with idempotent charge keys. We re-tested with 20,000 concurrent requests; double charges dropped to zero flat.",
    followUpProbes: {
      missingOwnership: "What specific forensic tools or telemetry did YOU personally configure to catch this bug?",
      missingMetrics: "What was the measurable failure rate before and after your patch?",
      missingResolution: "How did you ensure other developers wouldn't introduce the same pattern elsewhere?",
      challengePerspective: "Why didn't you simply wrap the transaction in a heavier database-level lock?"
    }
  },

  // ── 9. TEAMWORK & DIFFICULT TEAMMATES ──
  {
    id: "beh-team-1",
    competency_id: "teamwork_conflict",
    track_type: "universal",
    difficulty: "Mid-Level",
    seniority: "Campus / Entry-Level",
    title: "Navigating a Breakdown with an Unresponsive Teammate",
    company_tag: "Microsoft / TCS / Infosys / Atlassian",
    question: "Tell me about a time you worked on a team project where a peer was missing deadlines, not communicating, or delivering low-quality work. How did you resolve the situation constructively?",
    context_tip: "Tests empathy, private resolution, avoiding toxic blame, and protecting project delivery.",
    star_rubric: {
      situation: "A team deliverable threatened by an uncommunicative or struggling group member.",
      task: "Intervene constructively without publicly humiliating the teammate or doing everything silently.",
      action: "Scheduled a private 1-on-1, discovered underlying blockers, restructured task chunks, and supported them.",
      result: "Teammate re-engaged, contributed their sub-module, and project shipped on time."
    },
    ideal_response: "During our semester database project, our teammate responsible for the SQL backend stopped attending meetings and missed two check-ins. Instead of escalating to the professor, I scheduled a private coffee chat with him. He admitted he was overwhelmed by normalization queries and felt embarrassed to ask for help. I broke his remaining module into 3 bite-sized stored procedures and paired with him for 90 minutes to co-write the first query. His confidence returned immediately; he finished the remaining two procedures independently, and our project received an A grade.",
    followUpProbes: {
      missingOwnership: "What did you do personally rather than just reporting the teammate to a supervisor?",
      missingMetrics: "How did your intervention change the project delivery timeline?",
      missingResolution: "What would you have done if the teammate still refused to engage after your 1-on-1?",
      challengePerspective: "Was it fair to the rest of the team for you to spend time helping one underperformer?"
    }
  },

  // ── 10. INVENT & SIMPLIFY ──
  {
    id: "beh-inv-1",
    competency_id: "invent_and_simplify",
    track_type: "faang_star",
    difficulty: "Mid-Level",
    seniority: "Associate SDE",
    title: "Automating Away Repetitive Developer Toil",
    company_tag: "Amazon / Stripe / Meta",
    question: "Describe a situation where you noticed unnecessary complexity, manual toil, or repetitive work in your team's workflow. How did you simplify or automate it?",
    context_tip: "Tests efficiency mindset, process simplification, and engineering leverage.",
    star_rubric: {
      situation: "A slow, manual, or error-prone developer onboarding or deployment process.",
      task: "Design an elegant, low-overhead simplification that saves team hours.",
      action: "Created a lightweight CLI or automated script reducing multi-step manual work to one command.",
      result: "Saved substantial developer hours weekly and eliminated manual human errors."
    },
    ideal_response: "On our 6-developer team, onboarding a new local development environment required 14 manual steps across Docker, PostgreSQL seeds, and environment variables, taking nearly 6 hours with frequent config mismatches. I created a single Makefile and a shell script that automated dependency checks, spun up containers with health checks, and pre-seeded test fixtures with realistic dummy data. Onboarding time was cut from 6 hours to 4 minutes, saving our team over 30 hours across the semester and eliminating 'works on my machine' bugs.",
    followUpProbes: {
      missingOwnership: "Did anyone ask you to build this script, or did you build it purely on your own initiative?",
      missingMetrics: "What was the exact time savings across the entire engineering group?",
      missingResolution: "How did you keep the automation updated as dependencies evolved?",
      challengePerspective: "Why not use a managed remote development environment instead?"
    }
  },

  // ── 11. ETHICAL INTEGRITY ──
  {
    id: "beh-eth-1",
    competency_id: "ethical_integrity",
    track_type: "universal",
    difficulty: "Bar-Raiser",
    seniority: "Associate SDE",
    title: "Standing Firm on Security Standards Under Deadline Pressure",
    company_tag: "Apple / Amazon / Cisco / TCS",
    question: "Tell me about a time you felt pressured to compromise on security, data privacy, or engineering standards to meet an aggressive deadline. What decision did you make?",
    context_tip: "Tests unyielding integrity, risk management, and professional courage.",
    star_rubric: {
      situation: "Pressure to bypass security scans, skip test suites, or push unencrypted data to ship fast.",
      task: "Stand firm on ethical principles and safety while proposing a realistic path forward.",
      action: "Refused the dangerous shortcut, communicated risks transparently, and offered a safer compromise.",
      result: "Protected customer data and system integrity without jeopardizing the long-term project."
    },
    ideal_response: "Hours before our project deployment, our team realized that integrating OAuth was delayed, and a teammate suggested hardcoding API master keys in frontend JavaScript to make the live demo work. I refused to approve the pull request. I explained that hardcoded master keys in client-side code would expose our database credentials to anyone with browser devtools. Instead, I stayed back for 2 hours and set up a lightweight Node proxy backend to store the secret securely on the server side. We launched with zero credentials exposed, keeping our infrastructure secure.",
    followUpProbes: {
      missingOwnership: "How did you explain the trade-off to team members who were upset about the delay?",
      missingMetrics: "What vulnerability severity would the shortcut have caused (CVE / OWASP rating)?",
      missingResolution: "How do you enforce security guardrails automatically in CI/CD today?",
      challengePerspective: "What if your direct manager had ordered you to push the insecure code anyway?"
    }
  }
];

const SEED_ENRICHED: BehavioralQuestionFull[] = SEED_BEHAVIORAL_QUESTIONS.map(q => {
  let compId: CompetencyId = "extreme_ownership";
  const p = (q.principle || "").toLowerCase();
  const t = (q.title || "").toLowerCase();

  if (p.includes("disagree") || t.includes("disagree")) compId = "disagree_and_commit";
  else if (p.includes("customer") || t.includes("customer")) compId = "customer_obsession";
  else if (p.includes("dive deep") || t.includes("dive deep") || t.includes("root-causing")) compId = "dive_deep";
  else if (p.includes("deliver") || t.includes("deadlines") || t.includes("pressure")) compId = "prioritization_pressure";
  else if (p.includes("earn trust") || t.includes("mistake") || t.includes("failure")) compId = "handling_failure";
  else if (p.includes("invent") || p.includes("frugality") || t.includes("simplify") || t.includes("budget")) compId = "invent_and_simplify";
  else if (p.includes("standards") || t.includes("quality") || t.includes("standards")) compId = "ethical_integrity";
  else if (p.includes("action") || t.includes("ambiguity")) compId = "bias_for_action";
  else if (q.track_type === "service_hr" || t.includes("relocation") || t.includes("shift") || t.includes("bond")) compId = "corporate_stability";

  return {
    ...q,
    competency_id: compId,
    difficulty: q.track_type === "faang_star" ? "Bar-Raiser" : "Foundational",
    seniority: "Campus / Entry-Level",
    followUpProbes: {
      missingOwnership: "What specifically was your personal technical contribution versus the team?",
      missingMetrics: "What was the measurable outcome, time saved, or uptime percentage?",
      missingResolution: "Looking back, what is one systemic thing you would do differently today?",
      challengePerspective: "What was the other party's perspective and how did you resolve it?"
    }
  };
});

const existingIds = new Set(CURATED_BEHAVIORAL_QUESTIONS.map(q => q.id));
export const EXPANDED_BEHAVIORAL_QUESTION_BANK: BehavioralQuestionFull[] = [
  ...CURATED_BEHAVIORAL_QUESTIONS,
  ...SEED_ENRICHED.filter(q => !existingIds.has(q.id))
];

// ── 4. DYNAMIC FOLLOW-UP PROBING ENGINE (INTERACTION) ───────────────────────

export interface BehavioralEvaluationResult {
  score: number; // 0 to 100
  verdict: "Strong Hire" | "Hire" | "Borderline" | "Needs Diagnostic";
  situationScore: number;
  taskScore: number;
  actionScore: number;
  resultScore: number;
  iRatio: number; // Percentage of 'I' vs 'we' in the response
  quantifiableImpactFound: boolean;
  strengths: string[];
  improvements: string[];
  followUpProbe: {
    question: string;
    reason: string;
    type: "OWNERSHIP" | "METRICS" | "REFLECTION" | "CHALLENGE" | "RESOLUTION";
  };
  feedbackSummary: string;
}

/**
 * Honest, evidence-based behavioral answer evaluation.
 * Never gives a fixed 88/100 or fake "Hire" for empty or superficial answers.
 */
export function evaluateBehavioralAnswerLocally(
  question: BehavioralQuestionFull,
  answer: string,
  candidateContext?: { targetTrack?: string; projectTitle?: string }
): BehavioralEvaluationResult {
  const clean = (answer || "").trim();

  // 1. REJECT EMPTY OR GIBBERISH SUBMISSIONS
  if (clean.length < 20 || clean.split(/\s+/).length < 5) {
    return {
      score: 10,
      verdict: "Needs Diagnostic",
      situationScore: 10,
      taskScore: 10,
      actionScore: 5,
      resultScore: 5,
      iRatio: 0,
      quantifiableImpactFound: false,
      strengths: [],
      improvements: [
        "Please provide a complete STAR narrative (Situation, Task, Action, Result).",
        "Explain what YOU specifically did and the measurable outcome achieved."
      ],
      followUpProbe: {
        question: "Could you walk me through the specific situation you faced, what your personal responsibility was, and what specific action you took?",
        reason: "Initial answer was insufficient to assess behavioral signals.",
        type: "OWNERSHIP"
      },
      feedbackSummary: "Answer was too brief to evaluate. A strong behavioral response requires at least 3-4 sentences detailing the challenge, your specific personal actions ('I'), and the measurable outcome."
    };
  }

  const words = clean.split(/\s+/);
  const wordCount = words.length;

  // 2. METRIC DETECTION: Check for numbers, percentages, or time units
  const metricRegex = /\b(\d+%\b|\d+\s*(hours?|days?|weeks?|months?|ms|seconds?|mins?|minutes?|users?|shoppers?|records?|queries|reqs?|transactions?|k|m|million|lakhs?)|zero\s+errors?|99\.\d+%)/i;
  const hasMetrics = metricRegex.test(clean);

  // 3. OWNERSHIP RATIO: Count "I" / "my" vs "we" / "our"
  const iMatches = clean.match(/\b(i|my|mine|myself|i'd|i've|i'm|i'll)\b/gi) || [];
  const weMatches = clean.match(/\b(we|our|us|team|group|everyone)\b/gi) || [];
  const totalPronouns = iMatches.length + weMatches.length;
  const iRatio = totalPronouns > 0 ? Math.round((iMatches.length / totalPronouns) * 100) : 50;

  // 4. STAR COMPONENT COVERAGE CHECK
  const hasSituation = clean.length > 50 && /\b(when|during|faced|deadline|project|client|system|problem|challenge|production|bug|outage)\b/i.test(clean);
  const hasTask = /\b(needed to|had to|responsible|task|goal|objective|decided to|realized)\b/i.test(clean);
  const hasAction = /\b(i (built|wrote|created|refactored|audited|contacted|deployed|fixed|investigated|organized|researched|coordinated|implemented))\b/i.test(clean);
  const hasResult = /\b(result|outcome|decreased|increased|saved|delivered|succeeded|grade|on-time|prevented|improved|learned)\b/i.test(clean);

  let situationScore = hasSituation ? 80 : 40;
  let taskScore = hasTask ? 80 : 45;
  let actionScore = hasAction ? (iRatio >= 60 ? 90 : 65) : (iRatio >= 60 ? 70 : 45);
  let resultScore = hasResult ? (hasMetrics ? 95 : 75) : 40;

  if (wordCount < 40) {
    situationScore = Math.min(situationScore, 50);
    taskScore = Math.min(taskScore, 50);
    actionScore = Math.min(actionScore, 55);
    resultScore = Math.min(resultScore, 50);
  }

  const rawScore = Math.round(
    situationScore * 0.15 + taskScore * 0.15 + actionScore * 0.45 + resultScore * 0.25
  );
  const score = Math.max(15, Math.min(96, rawScore));

  const verdict: "Strong Hire" | "Hire" | "Borderline" | "Needs Diagnostic" =
    score >= 85 ? "Strong Hire" : score >= 70 ? "Hire" : score >= 50 ? "Borderline" : "Needs Diagnostic";

  // Strengths
  const strengths: string[] = [];
  if (iRatio >= 65) strengths.push("Strong personal ownership: explicitly demonstrated what 'I' did rather than hiding behind 'we'.");
  if (hasMetrics) strengths.push("Quantifiable impact: cited measurable metrics or concrete outcomes.");
  if (hasSituation && hasAction) strengths.push("Structured narrative: clearly connected the challenge to the specific technical intervention.");

  // Improvements
  const improvements: string[] = [];
  if (iRatio < 50) improvements.push("Over-reliance on 'we': Clarify your specific personal technical contributions versus the team.");
  if (!hasMetrics) improvements.push("Missing quantifiable metrics: Include hours saved, latency reduced, or user impact numbers.");
  if (!hasResult) improvements.push("Incomplete Result: Explain the lasting outcome and what systemic mechanism you added to prevent recurrence.");

  // Dynamic Follow-Up Probing
  let followUpProbe: {
    question: string;
    reason: string;
    type: "OWNERSHIP" | "METRICS" | "REFLECTION" | "CHALLENGE" | "RESOLUTION";
  } = {
    question: question.followUpProbes.challengePerspective,
    reason: "Testing trade-off defense and empathy for alternative perspectives.",
    type: "CHALLENGE"
  };

  if (iRatio < 50) {
    followUpProbe = {
      question: question.followUpProbes.missingOwnership || "You mentioned what the team did. What specifically was YOUR personal role and technical contribution?",
      reason: "Candidate used excessive 'we' language, obscuring individual ownership.",
      type: "OWNERSHIP"
    };
  } else if (!hasMetrics) {
    followUpProbe = {
      question: question.followUpProbes.missingMetrics || "What was the measurable outcome or time saved as a result of your actions?",
      reason: "Answer lacked quantifiable impact metrics.",
      type: "METRICS"
    };
  } else if (!hasResult) {
    followUpProbe = {
      question: question.followUpProbes.missingResolution || "Looking back, what is one systemic thing you would do differently today to prevent this from happening again?",
      reason: "Probing retrospective learning and operational resilience.",
      type: "RESOLUTION"
    };
  }

  const feedbackSummary = verdict === "Strong Hire"
    ? `Exceptional response. Demonstrates high agency (${iRatio}% 'I' statements), clear STAR structure, and measurable outcome delivery.`
    : verdict === "Hire"
    ? `Solid answer meeting hiring standards. ${improvements[0] || "Continue practicing crisp metric attribution."}`
    : `Developing response (Score: ${score}%). ${improvements[0] || "Focus on personal ownership and tangible metrics."}`;

  return {
    score,
    verdict,
    situationScore,
    taskScore,
    actionScore,
    resultScore,
    iRatio,
    quantifiableImpactFound: hasMetrics,
    strengths,
    improvements,
    followUpProbe,
    feedbackSummary
  };
}

// ── 5. MULTI-QUESTION INTERVIEW GENERATOR ───────────────────────────────────

export interface BehavioralInterviewSession {
  sessionId: string;
  candidateId: string;
  trackType: "faang_star" | "service_hr";
  questions: BehavioralQuestionFull[];
  targetDurationMinutes: number;
}

/**
 * Generates a multi-question behavioral interview session (3-4 questions)
 * avoiding recently seen questions for this candidate.
 */
export function generateBehavioralInterviewSession(
  candidateId: string,
  trackType: "faang_star" | "service_hr" = "faang_star",
  questionCount: number = 3
): BehavioralInterviewSession {
  const seenIds = getCandidateSeenQuestionIds(candidateId, "behavioral_hr");
  const trackPool = EXPANDED_BEHAVIORAL_QUESTION_BANK.filter(
    q => q.track_type === trackType || q.track_type === "universal"
  );

  const unseen = trackPool.filter(q => !seenIds.has(q.id));
  const pool = unseen.length >= questionCount ? unseen : trackPool;

  // Shuffle candidate pool to ensure fresh variation between sessions
  const shuffledPool = [...pool].sort(() => Math.random() - 0.5);

  // Balanced selection across competencies
  const usedCompetencies = new Set<string>();
  const selected: BehavioralQuestionFull[] = [];

  for (const q of shuffledPool) {
    if (selected.length >= questionCount) break;
    if (!usedCompetencies.has(q.competency_id)) {
      selected.push(q);
      usedCompetencies.add(q.competency_id);
    }
  }

  // If we still need more questions, pick from remaining pool
  for (const q of shuffledPool) {
    if (selected.length >= questionCount) break;
    if (!selected.some(s => s.id === q.id)) {
      selected.push(q);
    }
  }

  return {
    sessionId: `beh-sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    candidateId,
    trackType,
    questions: selected,
    targetDurationMinutes: selected.length * 4
  };
}

// ── 6. DYNAMIC CANDIDATE COMPETENCY DASHBOARD CALCULATOR ────────────────────

export interface CandidateCompetencyScorecard {
  competencyId: CompetencyId;
  name: string;
  status: CompetencyStatus;
  statusColor: string;
  attemptsCount: number;
  averageScore: number;
  evidenceQuote?: string;
  lastPracticed?: string;
}

/**
 * Computes live, evidence-based competency states for the candidate.
 * If a competency has never been tested, returns NOT_ASSESSED (no fake "Demonstrated"!).
 */
export function getCandidateBehavioralScorecard(candidateId: string): CandidateCompetencyScorecard[] {
  const attempts = getCandidateAttempts(candidateId, "behavioral_hr");

  const competencies: { id: CompetencyId; name: string }[] = [
    { id: "extreme_ownership", name: "Extreme Ownership" },
    { id: "disagree_and_commit", name: "Disagree & Commit" },
    { id: "handling_failure", name: "Dealing with Failure" },
    { id: "bias_for_action", name: "Bias for Action" },
    { id: "customer_obsession", name: "Customer Obsession" },
    { id: "corporate_stability", name: "Corporate Stability & HR Culture" },
    { id: "dive_deep", name: "Dive Deep & Root Cause Analysis" },
    { id: "leadership_initiative", name: "Leadership & Influence" },
    { id: "teamwork_conflict", name: "Teamwork & Collaboration" },
    { id: "prioritization_pressure", name: "Prioritization & Pressure" },
    { id: "invent_and_simplify", name: "Invent & Simplify" },
    { id: "ethical_integrity", name: "Ethics & Integrity" }
  ];

  return competencies.map(c => {
    const matchingAttempts = attempts.filter(
      a => a.topic.toLowerCase().includes(c.name.toLowerCase()) ||
           a.feedback.toLowerCase().includes(c.id.replace(/_/g, " "))
    );

    if (matchingAttempts.length === 0) {
      return {
        competencyId: c.id,
        name: c.name,
        status: "NOT_ASSESSED",
        statusColor: "#64748b",
        attemptsCount: 0,
        averageScore: 0
      };
    }

    const totalScore = matchingAttempts.reduce((sum, a) => sum + (a.score || 0), 0);
    const avg = Math.round(totalScore / matchingAttempts.length);

    let status: CompetencyStatus = "DEVELOPING";
    let statusColor = "#f87171";

    if (avg >= 85) {
      status = "STRONG";
      statusColor = "#34d399";
    } else if (avg >= 70) {
      status = "PROGRESSING";
      statusColor = "#38bdf8";
    } else if (avg >= 50) {
      status = "DEVELOPING";
      statusColor = "#fbbf24";
    }

    const lastAttempt = matchingAttempts[0];

    return {
      competencyId: c.id,
      name: c.name,
      status,
      statusColor,
      attemptsCount: matchingAttempts.length,
      averageScore: avg,
      evidenceQuote: lastAttempt?.strengths?.[0] || lastAttempt?.feedback,
      lastPracticed: lastAttempt?.timestamp ? new Date(lastAttempt.timestamp).toLocaleDateString() : "Recently"
    };
  });
}

// ── RE-EXPORT REDESIGNED BEHAVIORAL ENGINE ──────────────────────────────────
export * from "./behavioral-engine";
