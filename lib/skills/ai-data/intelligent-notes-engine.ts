/**
 * lib/skills/ai-data/intelligent-notes-engine.ts
 *
 * Topic-Grounded Intelligent Notes & Evidence-Based Weakness Remediation Notes.
 * Uses canonical topic metadata + actual TopicMasteryRecord weakConcepts (zero fabricated failures).
 */

import { getTopicLocation, getTaxonomyTopicById } from "./master-curriculum-taxonomy";
import { getCandidateDomainSummary } from "@/lib/skills/candidate-history";
import type { TopicMasteryRecord } from "./types";

export interface CanonicalTopicNote {
  topicId: string;
  topicTitle: string;
  canonicalSkill: string;
  targetRole: string;
  learningObjectives: string[];
  formalDefinition: string;
  mentalModelAnalogy: string;
  mathematicalFormulas: Array<{ formula: string; description: string }>;
  productionCodeExample: {
    language: "python" | "sql";
    code: string;
    explanation: string;
  };
  underTheHoodArchitecture: string;
  commonMistakesAndTraps: Array<{
    trap: string;
    whyItHappens: string;
    howToAvoid: string;
  }>;
  interviewCheatSheet: Array<{
    question: string;
    conciseAnswer: string;
    followUpTrap: string;
  }>;
}

export interface StudentWeaknessRecord {
  weakConcept: string;
  observedEvidence: string;
  whyItMatters: string;
  whatWentWrong: string;
  howToImprove: string;
  recommendedPracticeDrill: string;
  severity: "high" | "medium" | "low";
}

export interface PersonalWeaknessNote {
  candidateId: string;
  generatedDate: string;
  totalWeaknessesDetected: number;
  weaknesses: StudentWeaknessRecord[];
  evidenceSummary: string;
  readinessVerdict: string;
}

export function generateCanonicalNotesForTopic(topicId: string, role: string = "AI Engineer"): CanonicalTopicNote {
  const loc = getTopicLocation(topicId);
  const item = loc?.topic || getTaxonomyTopicById(topicId);
  const topicTitle = item ? item.title : topicId.replace(/-/g, " ");
  const skill = item ? item.moduleId || item.trackId : "core_python";
  const isSql = loc?.subject.id === "subj_sql" || topicId.startsWith("sql-");

  return {
    topicId,
    topicTitle,
    canonicalSkill: skill,
    targetRole: role,
    learningObjectives: item?.learningObjectives?.length
      ? item.learningObjectives
      : [`Master core mechanics and production usage of ${topicTitle}.`],
    formalDefinition: item
      ? `${item.contextAndIntuition.english}\n\n${item.deepExplanation.english}`
      : `${topicTitle} engineering principles and invariants.`,
    mentalModelAnalogy: item
      ? `Before ${topicTitle}: ${item.contextAndIntuition.whatWasUsedBefore} Today: ${item.contextAndIntuition.whyExists}`
      : `Structured execution mental model for ${topicTitle}.`,
    mathematicalFormulas: isSql
      ? [
          {
            formula: "\\text{Relational Partition} = \\text{GROUP BY}(k) \\text{ or } \\text{OVER}(\\text{PARTITION BY } k)",
            description: "Separating set-level collapse from row-preserving window calculation.",
          },
        ]
      : [
          {
            formula: "\\text{Outcome} = f_{\\text{validated}}(\\text{clean\\_inputs})",
            description: `Core input-to-output invariant for ${topicTitle}.`,
          },
        ],
    productionCodeExample: {
      language: isSql ? "sql" : "python",
      code:
        item?.solutionSnippet ||
        item?.starterCode ||
        (isSql
          ? `SELECT user_id, COUNT(*) AS orders_cnt FROM orders WHERE status = 'completed' GROUP BY user_id;`
          : `def verified_step(items):\n    return [x for x in items if x is not None]\n`),
      explanation: item?.practicalOutcome || `Production implementation pattern for ${topicTitle}.`,
    },
    underTheHoodArchitecture:
      item?.deepExplanation.internalMechanics ||
      `Deterministic memory, type, and runtime guarantees governing ${topicTitle}.`,
    commonMistakesAndTraps: (item?.deepExplanation.commonMistakes || ["Ignoring empty or null edge cases."]).map((trap) => ({
      trap,
      whyItHappens: `Common misconception when applying ${topicTitle} under real production inputs.`,
      howToAvoid: `Validate edge cases early and test assertions against small concrete inputs.`,
    })),
    interviewCheatSheet: [
      {
        question: `Where is ${topicTitle} applied in real ${role} systems?`,
        conciseAnswer: item?.deepExplanation.realWorldUsage || item?.practicalOutcome || "Used across production pipelines.",
        followUpTrap: item?.deepExplanation.commonMistakes[0] || "Edge-case & boundary handling under scale.",
      },
      {
        question: `Why did engineers adopt ${topicTitle} over older approaches?`,
        conciseAnswer: item?.contextAndIntuition.whyExists || "Reliability and performance.",
        followUpTrap: `Contrast carefully with: ${item?.contextAndIntuition.whatWasUsedBefore || "naive manual implementations"}.`,
      },
    ],
  };
}

export function generatePersonalWeaknessNotes(
  candidateId: string,
  masteryMap: Record<string, TopicMasteryRecord> = {}
): PersonalWeaknessNote {
  const weaknesses: StudentWeaknessRecord[] = [];

  for (const rec of Object.values(masteryMap)) {
    if (rec.weakConcepts && rec.weakConcepts.length > 0) {
      const topic = getTaxonomyTopicById(rec.topicId);
      for (const wc of rec.weakConcepts) {
        weaknesses.push({
          weakConcept: `${topic?.title || rec.topicId}: ${wc}`,
          observedEvidence: `Assessment score: ${rec.assessmentScore ?? "pending"}% across ${rec.attemptsCount} attempt(s).`,
          whyItMatters: topic?.practicalOutcome || "Prerequisite for downstream topics and assessments.",
          whatWentWrong: `Verification check failed for ${wc} on topic '${topic?.title || rec.topicId}'.`,
          howToImprove: `Review the 'How It Works' & 'Common Mistakes' sections in ${topic?.title || rec.topicId}, then complete the remediation quiz.`,
          recommendedPracticeDrill: topic?.title || rec.topicId,
          severity: rec.remediationRequired ? "high" : "medium",
        });
      }
    }
  }

  const domainSummary = getCandidateDomainSummary(candidateId);
  if (domainSummary) {
    Object.values(domainSummary).forEach((dom) => {
      dom.weakTopics?.forEach((t: string) => {
        if (!weaknesses.some((w) => w.weakConcept.includes(t))) {
          weaknesses.push({
            weakConcept: t,
            observedEvidence: `Flagged in practice history for ${t}.`,
            whyItMatters: "Core competency tested in technical screening.",
            whatWentWrong: `Previous attempt indicated gaps in ${t}.`,
            howToImprove: `Revisit worked example and run practical exercises for ${t}.`,
            recommendedPracticeDrill: t,
            severity: "medium",
          });
        }
      });
    });
  }

  return {
    candidateId,
    generatedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    totalWeaknessesDetected: weaknesses.length,
    weaknesses,
    evidenceSummary:
      weaknesses.length > 0
        ? `${weaknesses.length} verified knowledge gap(s) detected from your completed assessments and practical labs.`
        : "No weak concepts flagged yet. Complete a subtopic micro-check, practical lab, or topic assessment to populate personalized remediation notes.",
    readinessVerdict:
      weaknesses.some((w) => w.severity === "high")
        ? "Targeted Remediation Recommended"
        : weaknesses.length > 0
        ? "On Track (Minor Review)"
        : "Baseline Clean — Ready to Progress",
  };
}
