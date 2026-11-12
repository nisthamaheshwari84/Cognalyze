/**
 * lib/interview/conduct-engine.ts
 * 
 * COGNALYZE PROFESSIONAL CONDUCT & INTERVIEW INTEGRITY ENGINE (Milestone 2)
 * 
 * Non-Negotiable Mandates:
 * 1. Backend-Enforced State Machine (Deterministic, zero reliance on LLM prompts).
 * 2. Multilingual Classification: English, Hindi, and Hinglish.
 * 3. Strict Nuance: Distinguish genuine misconduct from:
 *    - Frustration ("this is so frustrating", "syntax bhool gaya")
 *    - Nervousness ("sorry I'm really nervous", "my mind went blank")
 *    - Inability to answer ("I honestly don't know", "mujhe nahi pata", "can we skip?")
 *    - Clarification requests ("can you repeat that?", "kya matlab?")
 *    - Respectful disagreement ("I actually disagree, because in PostgreSQL MVCC...")
 * 4. State Transitions:
 *    - NORMAL -> FIRST_WARNING -> FINAL_WARNING -> TERMINATED
 *    - Immediate termination on severe threats, hate speech, or severe abuse.
 * 5. Complete incident logs:
 *    - Timestamp, classification, confidence, matched tokens, escalation reason.
 * 6. Strictly Independent from Technical Competency Scoring:
 *    - Behavioral incidents NEVER alter technical rubric marks.
 *    - Technical mistakes NEVER trigger conduct warnings.
 * 7. Durable persistence and recovery across session reloads.
 */

export type ConductState = "NORMAL" | "FIRST_WARNING" | "FINAL_WARNING" | "TERMINATED";

export type ConductIncidentSeverity = "low" | "medium" | "high" | "critical";

export type ConductIncidentType =
  | "SEVERE_THREAT"
  | "SEXUAL_MISCONDUCT"
  | "HOSTILE_ABUSE"
  | "PERSONAL_INSULT"
  | "PROFANE_VULGARITY"
  | "DISRUPTIVE_CONTEMPT"
  | "BENIGN_FRUSTRATION"
  | "BENIGN_NERVOUSNESS"
  | "BENIGN_UNCERTAINTY"
  | "BENIGN_CLARIFICATION"
  | "BENIGN_DISAGREEMENT"
  | "CLEAN_PROFESSIONAL";

export interface ConductIncident {
  id: string;
  timestamp: string;
  turnIndex: number;
  type: ConductIncidentType;
  severity: ConductIncidentSeverity;
  candidateInput: string;
  matchedTokens: string[];
  language: "en" | "hi" | "hinglish";
  confidence: number;
  previousState: ConductState;
  newState: ConductState;
  interviewerMessage?: string;
  escalationReason: string;
}

export interface ConductEvaluationResult {
  isMisconduct: boolean;
  type: ConductIncidentType;
  severity?: ConductIncidentSeverity;
  confidence: number;
  matchedTokens: string[];
  language: "en" | "hi" | "hinglish";
  previousState: ConductState;
  newState: ConductState;
  shouldHaltTurn: boolean;
  interviewerMessage?: string;
  incident?: ConductIncident;
}

// ══════════════════════════════════════════════════════════════
// 1. INSTITUTIONAL PROFESSIONAL WARNING DIRECTIVES
// ══════════════════════════════════════════════════════════════

export const INSTITUTIONAL_CONDUCT_MESSAGES = {
  FIRST_WARNING:
    "Notice: Cognalyze conducts technical interviews in accordance with professional engineering standards. Inappropriate, offensive, or demeaning language is not permitted. Please maintain professional communication and address the technical question.",
  FINAL_WARNING:
    "Final Warning: Continued use of unprofessional or abusive language violates our interview integrity policy. Any further inappropriate conduct will result in the immediate termination of this interview session.",
  TERMINATED:
    "Interview Terminated: This interview session has been concluded due to repeated violations of Cognalyze professional conduct standards. A record of this session has been archived.",
  IMMEDIATE_TERMINATION_THREAT:
    "Interview Terminated Immediately: Severe threats, harassment, or abusive conduct are strictly prohibited under institutional policy. This session has been terminated and reported.",
};

// ══════════════════════════════════════════════════════════════
// 2. MULTILINGUAL DICTIONARY & REGEX RULES
// ══════════════════════════════════════════════════════════════

// 1. Critical Threats (English, Hindi, Hinglish)
const CRITICAL_THREAT_PATTERNS = [
  /\b(i will (kill|murder|hunt|destroy|dox|doxx|harm|ruin|hack))\b/i,
  /\b(beat (your|u) (ass|face|head))\b/i,
  /\b(jaan se maar|maar (dunga|daalunga|feunkunga)|pel dunga|thok dunga|teri jaan)\b/i,
  /\b(tujhe dekh lunga|dekh lunga tujhe|tere ghar aa ke)\b/i,
  /\b(destroy your system|ddos your|bomb)\b/i,
];

// 2. Sexual Misconduct & Explicit Vulgarity
const SEXUAL_MISCONDUCT_PATTERNS = [
  /\b(send nudes?|show boobs?|naked|blowjob|suck my (dick|cock)|fuck me)\b/i,
  /\b(chut|gaand mara|lund|lauda le|chudwa|bhosda)\b/i,
];

// 3. Hostile Abuse & Slurs (English, Hindi, Hinglish)
const HOSTILE_ABUSE_PATTERNS = [
  // English
  /\b(shut (the )?fuck up|stfu|screw you|fuck (you|u|off|this)|go to hell|piece of (shit|junk|crap|garbage)|dumb (as fuck|ass|bitch)|eat shit|motherfucker|bastard|asshole|bitch|bitches)\b/i,
  /\byou\s+(are\s+)?(a\s+)?(complete|totally|completely|fucking|absolute|f\*cking|utter)?\s*(an?\s+)?(idiot|brain\s*dead|worthless|garbage|moron|clueless|useless)\b/i,
  /\byou\s+(suck|are\s+worthless|are\s+garbage|are\s+(an?\s+)?idiot|are\s+brain\s*dead)\b/i,
  // Hindi & Hinglish
  /\b(chutiya|chutiye|chutya|chootiya|bhenchod|behenchod|bhen k lode|madarchod|maderchod|mc|bc|gandu|gaandu|harami|kamine|kamina|randi|bhosdike|bhosdi k|saale kutte|kutta kamina)\b/i,
  /\b(chup kar|apna (muh|munh) band rakh|bakwaas band kar|teri aukaat)\b/i,
  /\b(teri maa ki|bhaad me ja|bhadwe|bhadwa)\b/i,
];

// 4. Demeaning Insults (English & Hinglish)
const PERSONAL_INSULT_PATTERNS = [
  /\b(stupid bot|dumb bot|useless bot|worthless bot|idiot bot|garbage bot|trash bot|fuck(ing)? bot)\b/i,
  /\b(pagal bot|bewakoof bot|gadhe bot|faltu bot|bakwas bot)\b/i,
  /\b(terko (kuch nahi|coding aati bhi h|kya pata)|tujhe kuch nahi aata|nikal yahan se)\b/i,
  /\b(waste of time bot|you know nothing|incompetent bot)\b/i,
];

// 5. General Profane Language (Swearing without direct personal attack)
const PROFANE_VULGARITY_PATTERNS = [
  /\b(shit|damn it|damnit|crap|fucking hell|what the fuck|wtf|bullshit|fuck(ing)?|fucked|f\*ck)\b/i,
  /\b(bakwaas|faltu cheez|hatao ye)\b/i,
];

// 6. Benign Nuance Exception Filters (MUST NEVER BE CLASSIFIED AS MISCONDUCT)
const BENIGN_UNCERTAINTY_PATTERNS = [
  /\b(don'?t know|do not know|not sure|not familiar|haven'?t worked|never used)\b/i,
  /\b(no idea|drawing a blank|can'?t recall|cannot recall|can'?t remember)\b/i,
  /\b(nahi pata|pata nahi|yaad nahi|kabhi use nahi kiya|idea nahi hai)\b/i,
  /\b(skip this|move on|next question|can we skip|let'?s pass)\b/i,
];

const BENIGN_FRUSTRATION_PATTERNS = [
  /\b(frustrat(ed|ing)|annoying|stuck|struggling|confus(ed|ing))\b/i,
  /\b(having a hard time|brain is freezing|drawing a blank on the syntax)\b/i,
  /\b(dimag kharab ho raha hai|samajh nahi aa raha|thoda confuse ho gaya|fumbling)\b/i,
  /\b(syntax bhool gaya|yaar mushkil hai|so frustrating)\b/i,
];

const BENIGN_NERVOUSNESS_PATTERNS = [
  /\b(nervous|anxious|shaking|heart is beating|anxiety|sweating)\b/i,
  /\b(darr lag raha|ghabrahat|thoda nervous hoon|nervousness)\b/i,
];

const BENIGN_CLARIFICATION_PATTERNS = [
  /\b(can you repeat|could you repeat|pardon|please clarify|what do you mean)\b/i,
  /\b(samjha nahi|kya matlab|ek baar aur batao|question dobara)\b/i,
  /\b(could you rephrase|clarify that requirement)\b/i,
];

const BENIGN_DISAGREEMENT_PATTERNS = [
  /\b(i (politely |actually |respectfully )?disagree|alternative approach|in my experience|on the contrary)\b/i,
  /\b(actually in postgresql|according to the official docs|contrary to|different approach)\b/i,
  /\b(mera point of view alag hai|mai agree nahi karta)\b/i,
];

// ══════════════════════════════════════════════════════════════
// 3. CORE BEHAVIORAL EVALUATION FUNCTION
// ══════════════════════════════════════════════════════════════

/**
 * Normalizes spaced characters, repeated vowels/consonants, and masked profanities
 * for adversarial misconduct detection without false positive creep.
 */
function normalizeForConductCheck(input: string): string {
  // Collapsing spaced individual letters (e.g. "f u c k" -> "fuck", "b i t c h" -> "bitch", "m a d a r c h o d" -> "madarchod")
  let res = input.replace(/\b([a-zA-Z]\s+){2,14}[a-zA-Z]\b/g, (m) => m.replace(/\s+/g, ""));
  // Collapsing 3+ repeated characters down to 1 (e.g. "fuuuuck" -> "fuck", "chuuutiya" -> "chutiya", "shiiit" -> "shit")
  res = res.replace(/([a-zA-Z])\1{2,}/g, "$1");
  // Normalize masked profanities (e.g. "f*ck", "f***", "b*tch", "a**hole")
  res = res
    .replace(/(^|[\s.,!?])f[\*\@\#\$\%\^]ck(?=[\s.,!?]|$)/gi, "$1fuck")
    .replace(/(^|[\s.,!?])f[\*\@\#\$\%\^]{1,3}k(?=[\s.,!?]|$)/gi, "$1fuck")
    .replace(/(^|[\s.,!?])f[\*\@\#\$\%\^]{3}(?=[\s.,!?]|$)/gi, "$1fuck")
    .replace(/(^|[\s.,!?])b[\*\@\#\$\%\^]tch(?=[\s.,!?]|$)/gi, "$1bitch")
    .replace(/(^|[\s.,!?])a[\*\@\#\$\%\^]{2}hole(?=[\s.,!?]|$)/gi, "$1asshole")
    .replace(/(^|[\s.,!?])sh[\*\@\#\$\%\^]t(?=[\s.,!?]|$)/gi, "$1shit");
  return res;
}

/**
 * Detects whether the candidate is narrating/quoting an external third party
 * rather than directing abuse at the interviewer or process.
 */
function isQuotedNarrativeContext(input: string): boolean {
  const clean = input.toLowerCase();
  const narrativeReporting = /\b(my\s+manager|the\s+manager|someone|colleague|coworker|boss|he|she|they|client|peer|interviewer)\s+(said|yelled|shouted|told\s+me|called\s+me|screamed|messaged)\b/i;
  const quotingPastExp = /\b(in\s+my\s+(previous|past|last|prior)\s+(job|company|team|role|project)|once|one\s+time)\b/i;

  if (
    (narrativeReporting.test(clean) || quotingPastExp.test(clean)) &&
    (input.includes('"') || input.includes("'") || /\bcalled\s+me\b/i.test(clean))
  ) {
    return true;
  }
  return false;
}

/**
 * Evaluates candidate input for behavioral misconduct, distinguishing genuine hostility
 * from normal frustration, nervousness, inability to answer, or requests for clarification.
 */
export function evaluateCandidateConduct(
  candidateInput: string,
  currentState: ConductState = "NORMAL",
  turnIndex: number = 1
): ConductEvaluationResult {
  const clean = (candidateInput || "").trim().toLowerCase();
  const wordCount = clean ? clean.split(/\s+/).filter(Boolean).length : 0;

  if (wordCount === 0) {
    return {
      isMisconduct: false,
      type: "CLEAN_PROFESSIONAL",
      confidence: 1.0,
      matchedTokens: [],
      language: "en",
      previousState: currentState,
      newState: currentState,
      shouldHaltTurn: false,
    };
  }

  // Detect language
  let language: "en" | "hi" | "hinglish" = "en";
  if (/[\u0900-\u097F]/.test(clean)) {
    language = "hi";
  } else if (/\b(yaar|hai|nahi|mujhe|terko|kuch|kya|bhi|tera|tujhe|mai|hoon|hota|raha|gaya)\b/i.test(clean)) {
    language = "hinglish";
  }

  // Quoted Third-Party Narrative Protection:
  // If candidate is describing a past experience quoting an external party, do not treat as direct misconduct
  if (isQuotedNarrativeContext(candidateInput)) {
    const matchedThreats = findMatchedTokens(clean, CRITICAL_THREAT_PATTERNS);
    const matchedSexual = findMatchedTokens(clean, SEXUAL_MISCONDUCT_PATTERNS);
    if (matchedThreats.length === 0 && matchedSexual.length === 0) {
      return {
        isMisconduct: false,
        type: "CLEAN_PROFESSIONAL",
        confidence: 0.95,
        matchedTokens: [],
        language,
        previousState: currentState,
        newState: currentState,
        shouldHaltTurn: false,
      };
    }
  }

  // 1. STEP 1: Check for Benign Intent Exceptions FIRST (Strict False-Positive Protection)
  // If the candidate is expressing uncertainty, frustration, or asking for clarification,
  // ensure we do NOT falsely flag them as abusive unless explicit hostile abuse tokens are present.
  const hasUncertainty = BENIGN_UNCERTAINTY_PATTERNS.some((p) => p.test(clean));
  const hasFrustration = BENIGN_FRUSTRATION_PATTERNS.some((p) => p.test(clean));
  const hasNervousness = BENIGN_NERVOUSNESS_PATTERNS.some((p) => p.test(clean));
  const hasClarification = BENIGN_CLARIFICATION_PATTERNS.some((p) => p.test(clean));
  const hasDisagreement = BENIGN_DISAGREEMENT_PATTERNS.some((p) => p.test(clean));

  const hasBenignQualifier = hasUncertainty || hasFrustration || hasNervousness || hasClarification || hasDisagreement;

  // 2. STEP 2: Check Critical Threats & Severe Harm (Zero Tolerance)
  const matchedThreats = findMatchedTokens(clean, CRITICAL_THREAT_PATTERNS);
  if (matchedThreats.length > 0) {
    const incident: ConductIncident = {
      id: `incident_${Date.now()}_${turnIndex}`,
      timestamp: new Date().toISOString(),
      turnIndex,
      type: "SEVERE_THREAT",
      severity: "critical",
      candidateInput,
      matchedTokens: matchedThreats,
      language,
      confidence: 0.98,
      previousState: currentState,
      newState: "TERMINATED",
      interviewerMessage: INSTITUTIONAL_CONDUCT_MESSAGES.IMMEDIATE_TERMINATION_THREAT,
      escalationReason: "Direct violent or physical threat detected; immediate institutional termination enforced.",
    };
    return {
      isMisconduct: true,
      type: "SEVERE_THREAT",
      severity: "critical",
      confidence: 0.98,
      matchedTokens: matchedThreats,
      language,
      previousState: currentState,
      newState: "TERMINATED",
      shouldHaltTurn: true,
      interviewerMessage: INSTITUTIONAL_CONDUCT_MESSAGES.IMMEDIATE_TERMINATION_THREAT,
      incident,
    };
  }

  // 3. STEP 3: Check Sexual Misconduct (Zero Tolerance)
  const matchedSexual = findMatchedTokens(clean, SEXUAL_MISCONDUCT_PATTERNS);
  if (matchedSexual.length > 0) {
    const incident: ConductIncident = {
      id: `incident_${Date.now()}_${turnIndex}`,
      timestamp: new Date().toISOString(),
      turnIndex,
      type: "SEXUAL_MISCONDUCT",
      severity: "critical",
      candidateInput,
      matchedTokens: matchedSexual,
      language,
      confidence: 0.95,
      previousState: currentState,
      newState: "TERMINATED",
      interviewerMessage: INSTITUTIONAL_CONDUCT_MESSAGES.IMMEDIATE_TERMINATION_THREAT,
      escalationReason: "Inappropriate sexual remarks or solicitation detected; immediate termination enforced.",
    };
    return {
      isMisconduct: true,
      type: "SEXUAL_MISCONDUCT",
      severity: "critical",
      confidence: 0.95,
      matchedTokens: matchedSexual,
      language,
      previousState: currentState,
      newState: "TERMINATED",
      shouldHaltTurn: true,
      interviewerMessage: INSTITUTIONAL_CONDUCT_MESSAGES.IMMEDIATE_TERMINATION_THREAT,
      incident,
    };
  }

  // 4. STEP 4: Check Hostile Abuse & Slurs
  const matchedAbuse = findMatchedTokens(clean, HOSTILE_ABUSE_PATTERNS);
  if (matchedAbuse.length > 0) {
    return transitionBehavioralState(
      "HOSTILE_ABUSE",
      "high",
      matchedAbuse,
      candidateInput,
      language,
      currentState,
      turnIndex,
      0.95,
      "Hostile or abusive slurs directed at interview process."
    );
  }

  // 5. STEP 5: Check Personal Demeaning Insults
  const matchedInsults = findMatchedTokens(clean, PERSONAL_INSULT_PATTERNS);
  if (matchedInsults.length > 0) {
    return transitionBehavioralState(
      "PERSONAL_INSULT",
      "medium",
      matchedInsults,
      candidateInput,
      language,
      currentState,
      turnIndex,
      0.90,
      "Demeaning insult directed at interviewer persona."
    );
  }

  // 6. STEP 6: Check Profane Vulgarity
  const matchedProfanity = findMatchedTokens(clean, PROFANE_VULGARITY_PATTERNS);
  if (matchedProfanity.length > 0) {
    // If paired with benign frustration (e.g. "damn it I forgot the syntax"), treat as benign unless repeated
    if (hasBenignQualifier && matchedProfanity.every((t) => /damn|crap|shit/i.test(t))) {
      return {
        isMisconduct: false,
        type: "BENIGN_FRUSTRATION",
        confidence: 0.85,
        matchedTokens: matchedProfanity,
        language,
        previousState: currentState,
        newState: currentState,
        shouldHaltTurn: false,
      };
    }

    return transitionBehavioralState(
      "PROFANE_VULGARITY",
      "low",
      matchedProfanity,
      candidateInput,
      language,
      currentState,
      turnIndex,
      0.80,
      "Gratuitous vulgar language inconsistent with professional standards."
    );
  }

  // 7. STEP 7: Classify Benign Behaviors (Zero Misconduct)
  if (hasUncertainty) {
    return {
      isMisconduct: false,
      type: "BENIGN_UNCERTAINTY",
      confidence: 0.95,
      matchedTokens: [],
      language,
      previousState: currentState,
      newState: currentState,
      shouldHaltTurn: false,
    };
  }

  if (hasFrustration) {
    return {
      isMisconduct: false,
      type: "BENIGN_FRUSTRATION",
      confidence: 0.90,
      matchedTokens: [],
      language,
      previousState: currentState,
      newState: currentState,
      shouldHaltTurn: false,
    };
  }

  if (hasNervousness) {
    return {
      isMisconduct: false,
      type: "BENIGN_NERVOUSNESS",
      confidence: 0.90,
      matchedTokens: [],
      language,
      previousState: currentState,
      newState: currentState,
      shouldHaltTurn: false,
    };
  }

  if (hasClarification) {
    return {
      isMisconduct: false,
      type: "BENIGN_CLARIFICATION",
      confidence: 0.95,
      matchedTokens: [],
      language,
      previousState: currentState,
      newState: currentState,
      shouldHaltTurn: false,
    };
  }

  if (hasDisagreement) {
    return {
      isMisconduct: false,
      type: "BENIGN_DISAGREEMENT",
      confidence: 0.90,
      matchedTokens: [],
      language,
      previousState: currentState,
      newState: currentState,
      shouldHaltTurn: false,
    };
  }

  return {
    isMisconduct: false,
    type: "CLEAN_PROFESSIONAL",
    confidence: 1.0,
    matchedTokens: [],
    language,
    previousState: currentState,
    newState: currentState,
    shouldHaltTurn: false,
  };
}

// ══════════════════════════════════════════════════════════════
// 4. BEHAVIORAL STATE TRANSITION LOGIC
// ══════════════════════════════════════════════════════════════

function transitionBehavioralState(
  type: ConductIncidentType,
  severity: ConductIncidentSeverity,
  matchedTokens: string[],
  candidateInput: string,
  language: "en" | "hi" | "hinglish",
  currentState: ConductState,
  turnIndex: number,
  confidence: number,
  reason: string
): ConductEvaluationResult {
  let newState: ConductState = currentState;
  let interviewerMessage = "";
  let shouldHaltTurn = true;

  if (currentState === "NORMAL") {
    newState = "FIRST_WARNING";
    interviewerMessage = INSTITUTIONAL_CONDUCT_MESSAGES.FIRST_WARNING;
  } else if (currentState === "FIRST_WARNING") {
    newState = "FINAL_WARNING";
    interviewerMessage = INSTITUTIONAL_CONDUCT_MESSAGES.FINAL_WARNING;
  } else if (currentState === "FINAL_WARNING" || currentState === "TERMINATED") {
    newState = "TERMINATED";
    interviewerMessage = INSTITUTIONAL_CONDUCT_MESSAGES.TERMINATED;
  }

  const incident: ConductIncident = {
    id: `conduct_inc_${Date.now()}_${turnIndex}`,
    timestamp: new Date().toISOString(),
    turnIndex,
    type,
    severity,
    candidateInput,
    matchedTokens,
    language,
    confidence,
    previousState: currentState,
    newState,
    interviewerMessage,
    escalationReason: reason,
  };

  return {
    isMisconduct: true,
    type,
    severity,
    confidence,
    matchedTokens,
    language,
    previousState: currentState,
    newState,
    shouldHaltTurn,
    interviewerMessage,
    incident,
  };
}

function findMatchedTokens(text: string, patterns: RegExp[]): string[] {
  const matches: string[] = [];
  const normalized = normalizeForConductCheck(text);
  for (const pat of patterns) {
    const m = text.match(pat) || (normalized !== text ? normalized.match(pat) : null);
    if (m && m[0] && !matches.includes(m[0])) {
      matches.push(m[0]);
    }
  }
  return matches;
}
