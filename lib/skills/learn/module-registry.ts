/**
 * COGNALYZE DSA LEARN — MODULE REGISTRY
 * Central repository for all fully authored, bilingual 10-layer learning modules.
 */

import { LearningModule } from "./content-schemas";
import { validateLearningModule, ContentValidationReport } from "./content-validator";
import { KADANE_ALGORITHM_MODULE } from "./modules/kadane-algorithm";

export const PUBLISHED_LEARNING_MODULES: Record<string, LearningModule> = {
  [KADANE_ALGORITHM_MODULE.moduleId]: KADANE_ALGORITHM_MODULE
};

/**
 * Returns all registered learning modules.
 */
export function getAllLearningModules(): LearningModule[] {
  return Object.values(PUBLISHED_LEARNING_MODULES);
}

/**
 * Fetches a learning module by its unique module ID.
 */
export function getLearningModuleById(moduleId: string): LearningModule | undefined {
  return PUBLISHED_LEARNING_MODULES[moduleId];
}

/**
 * Fetches a learning module by its associated micro-concept ID.
 */
export function getLearningModuleByMicroConceptId(microConceptId: string): LearningModule | undefined {
  return Object.values(PUBLISHED_LEARNING_MODULES).find(m => m.microConceptId === microConceptId);
}

/**
 * Runs the 9-pass automated validator on every registered module.
 */
export function validateAllRegisteredModules(): Record<string, ContentValidationReport> {
  const reports: Record<string, ContentValidationReport> = {};
  for (const [id, mod] of Object.entries(PUBLISHED_LEARNING_MODULES)) {
    reports[id] = validateLearningModule(mod);
  }
  return reports;
}
