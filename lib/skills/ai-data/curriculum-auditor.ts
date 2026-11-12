/**
 * lib/skills/ai-data/curriculum-auditor.ts
 *
 * Automated Curriculum Completeness & Consistency Auditor for AI & Data Arena.
 * Verifies that all 10 subjects, modules, topics, and subtopics have full
 * teaching specifications, practical exercises, assessments, external resources,
 * and valid prerequisite references.
 */

import {
  MASTER_CURRICULUM_SUBJECTS,
  TaxonomySubject,
  TaxonomyModule,
  TaxonomyTopic,
  getAllTaxonomySubjects,
} from "./master-curriculum-taxonomy";
import { ROLE_SUBJECT_PROGRESSIONS } from "./sequencing-engine";
import { TargetRoleSlug } from "./types";

export interface SubjectAuditMetrics {
  subjectId: string;
  slug: string;
  title: string;
  totalModules: number;
  totalTopics: number;
  totalSubtopics: number;
  topicsWithLearningObjectives: number;
  topicsWithTeachingContent: number;
  topicsWithPracticalExercises: number;
  topicsWithAssessments: number;
  topicsWithExternalResources: number;
  missingPrerequisites: string[];
  brokenReferences: string[];
  duplicateTopicIds: string[];
  isComplete: boolean;
  completenessScorePercent: number;
}

export interface MasterCurriculumAuditReport {
  timestamp: string;
  totalSubjects: number;
  totalModules: number;
  totalTopics: number;
  totalSubtopics: number;
  allSubjectsComplete: boolean;
  overallCompletenessPercent: number;
  subjectAudits: SubjectAuditMetrics[];
  roleProgressionCoverage: Record<TargetRoleSlug, { totalAssignedSubjects: number; allPrereqsValid: boolean }>;
}

/**
 * Runs an exhaustive automated audit across all curriculum subjects and role progressions.
 */
export function runMasterCurriculumAudit(): MasterCurriculumAuditReport {
  const subjects = getAllTaxonomySubjects();
  const allTopicIds = new Set<string>();
  const duplicateIds: string[] = [];

  // Track all topic IDs to detect global duplicates
  for (const s of subjects) {
    for (const m of s.modules) {
      for (const t of m.topics) {
        if (allTopicIds.has(t.id)) {
          duplicateIds.push(t.id);
        } else {
          allTopicIds.add(t.id);
        }
      }
    }
  }

  const subjectAudits: SubjectAuditMetrics[] = subjects.map((subj) => {
    let totalSubtopics = 0;
    let topicsWithLearningObjectives = 0;
    let topicsWithTeachingContent = 0;
    let topicsWithPracticalExercises = 0;
    let topicsWithAssessments = 0;
    let topicsWithExternalResources = 0;
    const missingPrerequisites: string[] = [];
    const brokenReferences: string[] = [];
    const localTopicIds = new Set<string>();
    const localDuplicates: string[] = [];

    const allTopics = subj.modules.flatMap((m) => m.topics);

    for (const topic of allTopics) {
      if (localTopicIds.has(topic.id)) {
        localDuplicates.push(topic.id);
      } else {
        localTopicIds.add(topic.id);
      }

      if (topic.subtopics && topic.subtopics.length > 0) {
        totalSubtopics += topic.subtopics.length;
      }

      if (topic.learningObjectives && topic.learningObjectives.length > 0) {
        topicsWithLearningObjectives++;
      }

      if (
        topic.contextAndIntuition?.english &&
        topic.deepExplanation?.english &&
        topic.deepExplanation?.internalMechanics
      ) {
        topicsWithTeachingContent++;
      }

      if (topic.starterCode || topic.solutionSnippet) {
        topicsWithPracticalExercises++;
      }

      if (topic.deepExplanation?.commonMistakes && topic.deepExplanation.commonMistakes.length > 0) {
        topicsWithAssessments++;
      }

      if (topic.externalResources && topic.externalResources.length > 0) {
        topicsWithExternalResources++;
      }

      // Check prerequisites validity
      for (const prereqId of topic.prerequisites) {
        if (!allTopicIds.has(prereqId)) {
          brokenReferences.push(`Topic ${topic.id} references non-existent prerequisite ${prereqId}`);
        }
      }
    }

    // Verify subject level prerequisites
    for (const subjPrereqId of subj.prerequisites) {
      const exists = subjects.some((s) => s.id === subjPrereqId);
      if (!exists) {
        missingPrerequisites.push(`Subject ${subj.id} has invalid prerequisite ${subjPrereqId}`);
      }
    }

    const totalTopicsCount = allTopics.length;
    const learningObjRatio = totalTopicsCount > 0 ? topicsWithLearningObjectives / totalTopicsCount : 0;
    const teachingRatio = totalTopicsCount > 0 ? topicsWithTeachingContent / totalTopicsCount : 0;
    const exercisesRatio = totalTopicsCount > 0 ? topicsWithPracticalExercises / totalTopicsCount : 0;
    const resourcesRatio = totalTopicsCount > 0 ? topicsWithExternalResources / totalTopicsCount : 0;

    const completenessScore = Math.round(
      ((learningObjRatio + teachingRatio + exercisesRatio + resourcesRatio) / 4) * 100
    );

    const isComplete =
      totalTopicsCount >= 3 &&
      brokenReferences.length === 0 &&
      missingPrerequisites.length === 0 &&
      completenessScore >= 80;

    return {
      subjectId: subj.id,
      slug: subj.slug,
      title: subj.title,
      totalModules: subj.modules.length,
      totalTopics: totalTopicsCount,
      totalSubtopics,
      topicsWithLearningObjectives,
      topicsWithTeachingContent,
      topicsWithPracticalExercises,
      topicsWithAssessments,
      topicsWithExternalResources,
      missingPrerequisites,
      brokenReferences,
      duplicateTopicIds: localDuplicates,
      isComplete,
      completenessScorePercent: completenessScore,
    };
  });

  // Role progression validation
  const allSubjectIds = new Set(subjects.map((s) => s.id));
  const roleProgressionCoverage: MasterCurriculumAuditReport["roleProgressionCoverage"] = {} as any;

  for (const [roleKey, progression] of Object.entries(ROLE_SUBJECT_PROGRESSIONS)) {
    const roleSlug = roleKey as TargetRoleSlug;
    let allPrereqsValid = true;

    for (const roleSubj of progression.subjects) {
      if (!allSubjectIds.has(roleSubj.subjectId)) {
        allPrereqsValid = false;
      }
      for (const p of roleSubj.prerequisites) {
        if (!allSubjectIds.has(p)) {
          allPrereqsValid = false;
        }
      }
    }

    roleProgressionCoverage[roleSlug] = {
      totalAssignedSubjects: progression.subjects.length,
      allPrereqsValid,
    };
  }

  const totalModules = subjectAudits.reduce((acc, s) => acc + s.totalModules, 0);
  const totalTopics = subjectAudits.reduce((acc, s) => acc + s.totalTopics, 0);
  const totalSubtopics = subjectAudits.reduce((acc, s) => acc + s.totalSubtopics, 0);
  const allSubjectsComplete = subjectAudits.every((s) => s.isComplete);
  const overallCompletenessPercent = Math.round(
    subjectAudits.reduce((acc, s) => acc + s.completenessScorePercent, 0) / subjectAudits.length
  );

  return {
    timestamp: new Date().toISOString(),
    totalSubjects: subjects.length,
    totalModules,
    totalTopics,
    totalSubtopics,
    allSubjectsComplete,
    overallCompletenessPercent,
    subjectAudits,
    roleProgressionCoverage,
  };
}

