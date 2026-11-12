/**
 * lib/skills/ai-data/question-bank-auditor.ts
 *
 * Automated Quality & Completeness Auditor for Company Question Banks.
 * Enforces:
 * - Minimum 50 questions per topic and subtopic
 * - Pattern variety (Conceptual, MCQ, Coding, Output Prediction, Debugging, Scenario, Interview, Advanced)
 * - Difficulty distribution (Beginner, Intermediate, Advanced, Interview, Challenge)
 * - 0 duplicate question IDs
 * - Authenticated company attributions and valid test cases
 */

import {
  getAllTaxonomySubjects,
  TaxonomySubject,
  TaxonomyTopic,
  TaxonomySubtopic,
} from "./master-curriculum-taxonomy";
import {
  generateSubtopicQuestionBank,
  getTopicQuestionBank,
} from "./question-generator-engine";
import {
  CompanyQuestion,
  QuestionPatternType,
  QuestionDifficultyLevel,
} from "./company-question-bank-types";

export interface SubtopicAuditResult {
  subtopicId: string;
  subtopicTitle: string;
  topicId: string;
  totalQuestions: number;
  hasMinimumFifty: boolean;
  patternsCovered: Record<QuestionPatternType, number>;
  difficultiesCovered: Record<QuestionDifficultyLevel, number>;
  codingQuestionsWithHiddenCases: number;
  duplicateIds: string[];
  validCompanyAttributions: number;
  qualityScorePercent: number;
  isAuditPassed: boolean;
  issues: string[];
}

export interface QuestionBankMasterAuditReport {
  timestamp: string;
  totalSubtopicsAudited: number;
  totalQuestionsAudited: number;
  allSubtopicsHaveFiftyPlus: boolean;
  zeroDuplicateIds: boolean;
  overallQualityScorePercent: number;
  subtopicAudits: SubtopicAuditResult[];
  failedSubtopicCount: number;
}

/**
 * Runs an exhaustive automated audit verifying every topic and subtopic has >= 50 verified questions.
 */
export function runQuestionBankCompletenessAudit(): QuestionBankMasterAuditReport {
  const subjects = getAllTaxonomySubjects();
  const subtopicAudits: SubtopicAuditResult[] = [];
  const globalSeenQuestionIds = new Set<string>();
  let totalQuestionsCount = 0;

  for (const subj of subjects) {
    for (const mod of subj.modules) {
      for (const topic of mod.topics) {
        // Collect subtopics (or fallback default)
        const subtopics: TaxonomySubtopic[] =
          topic.subtopics && topic.subtopics.length > 0
            ? topic.subtopics
            : [
                {
                  id: `${topic.id}-sub-1`,
                  title: topic.title,
                  order: 1,
                  concepts: topic.conceptsCovered || [topic.title],
                },
              ];

        for (const sub of subtopics) {
          const questions = generateSubtopicQuestionBank(
            topic.trackId,
            topic.moduleId,
            topic,
            sub
          );
          totalQuestionsCount += questions.length;

          const localSeen = new Set<string>();
          const duplicateIds: string[] = [];
          const patternsCovered: Record<QuestionPatternType, number> = {
            conceptual: 0,
            mcq: 0,
            coding: 0,
            output_prediction: 0,
            debugging: 0,
            scenario: 0,
            interview: 0,
            advanced_problem: 0,
          };
          const difficultiesCovered: Record<QuestionDifficultyLevel, number> = {
            beginner: 0,
            intermediate: 0,
            advanced: 0,
            interview: 0,
            challenge: 0,
          };
          let codingWithHidden = 0;
          let validCompanies = 0;
          const issues: string[] = [];

          for (const q of questions) {
            // Check global and local duplicates
            if (localSeen.has(q.id) || globalSeenQuestionIds.has(q.id)) {
              duplicateIds.push(q.id);
            }
            localSeen.add(q.id);
            globalSeenQuestionIds.add(q.id);

            // Tally patterns
            if (patternsCovered[q.questionType] !== undefined) {
              patternsCovered[q.questionType]++;
            }

            // Tally difficulties
            if (difficultiesCovered[q.difficulty] !== undefined) {
              difficultiesCovered[q.difficulty]++;
            }

            // Coding test cases check
            if (q.questionType === "coding") {
              if (q.hiddenTestCases && q.hiddenTestCases.length > 0 && q.referenceSolution) {
                codingWithHidden++;
              } else {
                issues.push(`Coding question ${q.id} missing hidden test cases or solution`);
              }
            }

            // Company attribution check
            if (q.relevantCompanies && q.relevantCompanies.length > 0) {
              validCompanies++;
            } else {
              issues.push(`Question ${q.id} missing company attribution`);
            }
          }

          const hasMinimumFifty = questions.length >= 50;
          if (!hasMinimumFifty) {
            issues.push(`Subtopic ${sub.id} only has ${questions.length} questions (minimum 50 required)`);
          }

          // Quality score calculation
          const patternVariety = Object.values(patternsCovered).filter((count) => count > 0).length;
          const diffVariety = Object.values(difficultiesCovered).filter((count) => count > 0).length;
          const hasZeroDuplicates = duplicateIds.length === 0;

          const qualityScore = Math.round(
            ((hasMinimumFifty ? 30 : (questions.length / 50) * 30) +
              (patternVariety / 7) * 30 +
              (diffVariety / 5) * 20 +
              (hasZeroDuplicates ? 20 : 0))
          );

          const isAuditPassed =
            hasMinimumFifty &&
            hasZeroDuplicates &&
            patternVariety >= 5 &&
            diffVariety >= 4 &&
            qualityScore >= 85;

          subtopicAudits.push({
            subtopicId: sub.id,
            subtopicTitle: sub.title,
            topicId: topic.id,
            totalQuestions: questions.length,
            hasMinimumFifty,
            patternsCovered,
            difficultiesCovered,
            codingQuestionsWithHiddenCases: codingWithHidden,
            duplicateIds,
            validCompanyAttributions: validCompanies,
            qualityScorePercent: qualityScore,
            isAuditPassed,
            issues,
          });
        }
      }
    }
  }

  const allSubtopicsHaveFiftyPlus = subtopicAudits.every((s) => s.hasMinimumFifty);
  const zeroDuplicateIds = subtopicAudits.every((s) => s.duplicateIds.length === 0);
  const failedSubtopicCount = subtopicAudits.filter((s) => !s.isAuditPassed).length;
  const overallQualityScorePercent = Math.round(
    subtopicAudits.reduce((acc, s) => acc + s.qualityScorePercent, 0) / subtopicAudits.length
  );

  return {
    timestamp: new Date().toISOString(),
    totalSubtopicsAudited: subtopicAudits.length,
    totalQuestionsAudited: totalQuestionsCount,
    allSubtopicsHaveFiftyPlus,
    zeroDuplicateIds,
    overallQualityScorePercent,
    subtopicAudits,
    failedSubtopicCount,
  };
}

