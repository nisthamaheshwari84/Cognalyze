/**
 * COGNALYZE MENTOR — CONTEXT RETRIEVER
 * Ingests canonical Student DNA and career memory silently.
 * Enforces the Anti-Overclaiming Contract:
 * Never infers mastery from exposure or single unverified claims.
 */

import {
  getStudentIntelligenceProfile,
  getStudentEvidence,
  getCareerIntent
} from "../intelligence/student-intelligence";
import { SilentStudentContext } from "./types";

/**
 * Retrieve verified Student DNA context to inform Mentor decisions silently
 */
export function getSilentStudentContext(studentId: string): SilentStudentContext {
  const profile = getStudentIntelligenceProfile(studentId);
  const evidenceList = getStudentEvidence(studentId);
  const careerIntent = getCareerIntent(studentId);

  // Group capabilities by verified demonstration status
  const demonstratedCapabilities: string[] = [];
  const assessedCapabilities: string[] = [];
  const knownGaps: string[] = [];
  const verifiedProjects: string[] = [];

  Object.values(profile.capabilities || {}).forEach((c: any) => {
    if (c.evidenceLevel >= 3 || c.proficiencyState === "Mastered" || c.proficiencyState === "Strong") {
      demonstratedCapabilities.push(c.name);
    } else if (c.evidenceLevel === 2 || c.proficiencyState === "Developing") {
      assessedCapabilities.push(c.name);
    } else if (c.proficiencyState === "Insufficient Evidence" || c.hasConflict) {
      knownGaps.push(c.name);
    }
  });

  // Extract distinct verified project sources
  evidenceList.forEach((ev) => {
    if (ev.sourceType === "project" && ev.provenance.sourceName) {
      if (!verifiedProjects.includes(ev.provenance.sourceName)) {
        verifiedProjects.push(ev.provenance.sourceName);
      }
    }
  });

  // Summarize prior experience defensively
  let priorExperienceSummary = "";
  if (demonstratedCapabilities.length > 0) {
    priorExperienceSummary = `Candidate has verified demonstrated experience in: ${demonstratedCapabilities.slice(0, 5).join(", ")}.`;
  } else if (assessedCapabilities.length > 0) {
    priorExperienceSummary = `Candidate has emerging/developing experience in: ${assessedCapabilities.slice(0, 5).join(", ")}.`;
  } else {
    priorExperienceSummary = "Candidate has limited recorded evidence. Calibrate depth gently through introductory Socratic check.";
  }

  return {
    studentId,
    targetRole: careerIntent?.primaryGoal,
    demonstratedCapabilities,
    assessedCapabilities,
    verifiedProjects,
    knownGaps,
    recentMisconceptions: [],
    priorExperienceSummary
  };
}

/**
 * Build a concise, silent system directive informing the Mentor of what to skip or adapt
 */
export function buildSilentBriefingDirective(context: SilentStudentContext): string {
  const parts: string[] = [];

  if (context.targetRole) {
    parts.push(`- Target Career Goal: ${context.targetRole} (tailor architectural scenarios towards this where relevant).`);
  }

  if (context.demonstratedCapabilities.length > 0) {
    parts.push(
      `- Verified Demonstrated Capabilities: [${context.demonstratedCapabilities.join(", ")}]. Do NOT lecture them on the absolute basics of these concepts. Acknowledge and build on top of them.`
    );
  }

  if (context.knownGaps.length > 0) {
    parts.push(
      `- Areas with Limited/Conflicting Evidence: [${context.knownGaps.slice(0, 4).join(", ")}]. Probe understanding gently before diving into advanced distributed patterns.`
    );
  }

  parts.push(
    `- ANTI-OVERCLAIMING RULE: Never flatter the student with empty praise ("You are an expert", "You are advanced"). Never assume mastery from a single answer. Rely on continuous demonstration.`
  );

  return parts.join("\n");
}
