/**
 * COGNALYZE DSA LEARN — CONCEPT MASTERY PLATFORM
 * 9-Pass Automated Educational Content Validator (Phase 3)
 * 
 * Enforces rigorous pedagogical, factual, linguistic, and structural invariants
 * before any learning module can be published or served to students.
 */

import {
  BilingualText,
  LearningModule,
  SimulationFrame
} from "./content-schemas";
import {
  getCurriculumStepById,
  getCurriculumSubtopicById,
  getCurriculumMicroConceptById
} from "./curriculum-registry";
import { getFearPointById } from "./fear-points-registry";

export interface ValidationPassResult {
  passNumber: number;
  passName: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export interface ContentValidationReport {
  moduleId: string;
  overallPassed: boolean;
  passedCount: number;
  totalPasses: number;
  passResults: ValidationPassResult[];
  canPublish: boolean;
}

/**
 * Helper to check bilingual text validity:
 * Both English and Hinglish must be present, non-empty, and distinct.
 */
function checkBilingual(
  bt: BilingualText | undefined | null,
  context: string,
  errors: string[],
  warnings: string[]
): void {
  if (!bt) {
    errors.push(`Missing bilingual text object in: ${context}`);
    return;
  }
  if (!bt.en || bt.en.trim().length === 0) {
    errors.push(`Empty English text in: ${context}`);
  } else if (bt.en.trim().length < 5) {
    warnings.push(`Suspiciously brief English text in: ${context} ("${bt.en}")`);
  }

  if (!bt.hinglish || bt.hinglish.trim().length === 0) {
    errors.push(`Empty Hinglish text in: ${context}`);
  } else if (bt.hinglish.trim().length < 5) {
    warnings.push(`Suspiciously brief Hinglish text in: ${context} ("${bt.hinglish}")`);
  }

  // Ensure Hinglish is an authentic adaptation and not a raw duplicate copy of English
  if (bt.en && bt.hinglish && bt.en.trim().toLowerCase() === bt.hinglish.trim().toLowerCase()) {
    warnings.push(
      `Hinglish is an identical copy of English in: ${context}. Requires conversational Roman Hindi phrasing.`
    );
  }
}

/**
 * PASS 1: Structural Completeness
 * Verifies that all 10 non-negotiable educational layers and metadata are defined.
 */
export function validatePass1Structure(module: LearningModule): ValidationPassResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!module.moduleId || module.moduleId.trim().length === 0) {
    errors.push("Missing moduleId");
  }
  if (!module.microConceptId) errors.push("Missing microConceptId");
  if (!module.subtopicId) errors.push("Missing subtopicId");
  if (!module.stepId) errors.push("Missing stepId");
  if (!module.version) errors.push("Missing version");
  if (module.estimatedReadTimeMinutes <= 0) {
    errors.push("estimatedReadTimeMinutes must be greater than 0");
  }

  checkBilingual(module.title, "module.title", errors, warnings);

  // Layer existence checks
  if (!module.layer1WhyExists) errors.push("Missing Layer 1: Why It Exists");
  if (!module.layer2Intuition) errors.push("Missing Layer 2: Intuition & Analogy");
  if (!module.layer3Invariants) errors.push("Missing Layer 3: Invariants");
  if (!module.layer4VisualDryRun) errors.push("Missing Layer 4: Visual Dry-Run");
  if (!module.layer5SocraticDerivation) errors.push("Missing Layer 5: Socratic Derivation");
  if (!module.layer6Complexity) errors.push("Missing Layer 6: Complexity");
  if (!module.layer7CommonPitfalls) errors.push("Missing Layer 7: Common Pitfalls");
  if (!module.layer8PatternTriggers) errors.push("Missing Layer 8: Pattern Triggers");
  if (!module.layer9VerificationRubric) errors.push("Missing Layer 9: Verification Rubric");
  if (!module.layer10BridgeToPractice) errors.push("Missing Layer 10: Bridge to Practice");

  return {
    passNumber: 1,
    passName: "Structural Completeness (10 Layers)",
    passed: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * PASS 2: Algorithmic & Mathematical Invariants
 * Validates pre-conditions, loop invariants with formal statements, and post-conditions.
 */
export function validatePass2Invariants(module: LearningModule): ValidationPassResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const l3 = module.layer3Invariants;
  if (!l3) {
    return {
      passNumber: 2,
      passName: "Invariants Completeness",
      passed: false,
      errors: ["Layer 3 is undefined"],
      warnings: []
    };
  }

  if (!l3.preConditions || l3.preConditions.length === 0) {
    errors.push("Layer 3: Pre-conditions list cannot be empty");
  }
  if (!l3.postConditions || l3.postConditions.length === 0) {
    errors.push("Layer 3: Post-conditions list cannot be empty");
  }
  if (!l3.loopInvariants || l3.loopInvariants.length === 0) {
    errors.push("Layer 3: Must specify at least one formal loop invariant");
  } else {
    l3.loopInvariants.forEach((inv, idx) => {
      if (!inv.name || inv.name.trim().length === 0) {
        errors.push(`Layer 3: Loop invariant at index ${idx} is missing a name`);
      }
      if (!inv.formalStatement || inv.formalStatement.trim().length === 0) {
        errors.push(`Layer 3: Loop invariant "${inv.name || idx}" missing formal mathematical statement`);
      }
      checkBilingual(inv.plainEnglishExplanation, `Layer 3: Invariant "${inv.name}" explanation`, errors, warnings);
      checkBilingual(inv.whyItMustHold, `Layer 3: Invariant "${inv.name}" whyItMustHold`, errors, warnings);
    });
  }

  checkBilingual(l3.inductiveProofBasis, "Layer 3: Inductive proof basis", errors, warnings);

  if (!l3.invariantPreservationRules) {
    errors.push("Layer 3: Missing invariant preservation rules (initialization, maintenance, termination)");
  } else {
    checkBilingual(l3.invariantPreservationRules.atInitialization, "Layer 3: At Initialization", errors, warnings);
    checkBilingual(l3.invariantPreservationRules.duringMaintenance, "Layer 3: During Maintenance", errors, warnings);
    checkBilingual(l3.invariantPreservationRules.uponTermination, "Layer 3: Upon Termination", errors, warnings);
  }

  return {
    passNumber: 2,
    passName: "Invariants & Induction Verification",
    passed: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * PASS 3: Time & Space Complexity Formal Derivation
 * Ensures rigorous proof, not just bare Big-O notation.
 */
export function validatePass3Complexity(module: LearningModule): ValidationPassResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const l6 = module.layer6Complexity;
  if (!l6) {
    return {
      passNumber: 3,
      passName: "Complexity Proof Rigor",
      passed: false,
      errors: ["Layer 6 is undefined"],
      warnings: []
    };
  }

  const { timeComplexity, spaceComplexity } = l6;
  if (!timeComplexity) {
    errors.push("Layer 6: Missing timeComplexity object");
  } else {
    if (!timeComplexity.worstCase?.notation) errors.push("Layer 6: Missing worstCase time complexity notation");
    checkBilingual(timeComplexity.worstCase?.formalDerivation, "Layer 6: Worst-case derivation", errors, warnings);
    checkBilingual(timeComplexity.averageCase?.formalDerivation, "Layer 6: Average-case derivation", errors, warnings);
    checkBilingual(timeComplexity.bestCase?.formalDerivation, "Layer 6: Best-case derivation", errors, warnings);
  }

  if (!spaceComplexity) {
    errors.push("Layer 6: Missing spaceComplexity object");
  } else {
    if (!spaceComplexity.auxiliarySpace?.notation) errors.push("Layer 6: Missing auxiliarySpace notation");
    if (!spaceComplexity.totalWorkingSpace?.notation) errors.push("Layer 6: Missing totalWorkingSpace notation");
    checkBilingual(spaceComplexity.whyLessSpaceIsImpossible, "Layer 6: whyLessSpaceIsImpossible", errors, warnings);
  }

  if (!l6.scalingBehaviorGraphSummary || l6.scalingBehaviorGraphSummary.length === 0) {
    warnings.push("Layer 6: Scaling behavior summary table is empty");
  }

  return {
    passNumber: 3,
    passName: "Time & Space Complexity Proof Rigor",
    passed: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * PASS 4: Visual Dry-Run Trace Fidelity
 * Ensures interactive simulation frames are consistent, sequential, and annotated.
 */
export function validatePass4VisualDryRun(module: LearningModule): ValidationPassResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const l4 = module.layer4VisualDryRun;
  if (!l4) {
    return {
      passNumber: 4,
      passName: "Visual Dry-Run Trace Fidelity",
      passed: false,
      errors: ["Layer 4 is undefined"],
      warnings: []
    };
  }

  if (!l4.defaultInputDataset || !l4.defaultInputDataset.data || l4.defaultInputDataset.data.length === 0) {
    errors.push("Layer 4: Default input dataset must have at least one element");
  } else {
    checkBilingual(l4.defaultInputDataset.description, "Layer 4: Default dataset description", errors, warnings);
  }

  if (!l4.stepByStepFrames || l4.stepByStepFrames.length < 3) {
    errors.push(`Layer 4: Must contain at least 3 simulation frames (found: ${l4.stepByStepFrames?.length || 0})`);
  } else {
    const arrayLen = l4.defaultInputDataset?.data?.length || 0;
    l4.stepByStepFrames.forEach((frame: SimulationFrame, idx: number) => {
      if (frame.frameIndex !== idx) {
        errors.push(`Layer 4: Frame at array position ${idx} has mismatched frameIndex ${frame.frameIndex}`);
      }
      if (frame.codeLineNumber <= 0) {
        errors.push(`Layer 4: Frame ${idx} has invalid codeLineNumber ${frame.codeLineNumber}`);
      }
      checkBilingual(frame.title, `Layer 4: Frame ${idx} title`, errors, warnings);
      checkBilingual(frame.explanation, `Layer 4: Frame ${idx} explanation`, errors, warnings);

      if (!frame.variables || frame.variables.length === 0) {
        warnings.push(`Layer 4: Frame ${idx} has empty accumulator variables`);
      }

      if (frame.pointers && arrayLen > 0) {
        frame.pointers.forEach(p => {
          // Pointers can be -1 (sentinel) or up to arrayLen (past end iterator)
          if (p.index < -1 || p.index > arrayLen) {
            errors.push(
              `Layer 4: Frame ${idx} pointer "${p.name}" index ${p.index} out of bounds for array length ${arrayLen}`
            );
          }
        });
      }
    });
  }

  return {
    passNumber: 4,
    passName: "Visual Dry-Run Simulation Frame Integrity",
    passed: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * PASS 5: Dual-Language Readability & Tone Check
 * Verifies that all layers have authentic bilingual texts.
 */
export function validatePass5BilingualContent(module: LearningModule): ValidationPassResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Layer 1
  checkBilingual(module.layer1WhyExists?.historicalGenesis, "Layer 1: Historical Genesis", errors, warnings);
  checkBilingual(module.layer1WhyExists?.coreProblemStatement, "Layer 1: Core Problem Statement", errors, warnings);
  checkBilingual(module.layer1WhyExists?.breakthroughInsight, "Layer 1: Breakthrough Insight", errors, warnings);

  // Layer 2
  checkBilingual(module.layer2Intuition?.highLevelOverview, "Layer 2: High Level Overview", errors, warnings);
  checkBilingual(module.layer2Intuition?.primaryAnalogy?.metaphorTitle, "Layer 2: Primary Analogy Title", errors, warnings);
  checkBilingual(module.layer2Intuition?.primaryAnalogy?.narrativeExplanation, "Layer 2: Primary Analogy Narrative", errors, warnings);
  checkBilingual(module.layer2Intuition?.mentalVisualPrompt, "Layer 2: Mental Visual Prompt", errors, warnings);

  // Layer 5
  checkBilingual(module.layer5SocraticDerivation?.derivationGoal, "Layer 5: Derivation Goal", errors, warnings);
  checkBilingual(module.layer5SocraticDerivation?.synthesisSummary, "Layer 5: Synthesis Summary", errors, warnings);

  // Layer 8
  module.layer8PatternTriggers?.primaryTriggers?.forEach((trigger, idx) => {
    checkBilingual(trigger.clueDescription, `Layer 8: Trigger ${idx} description`, errors, warnings);
    checkBilingual(trigger.algorithmicImplication, `Layer 8: Trigger ${idx} implication`, errors, warnings);
  });

  // Layer 10
  checkBilingual(module.layer10BridgeToPractice?.recommendedImmediateAction, "Layer 10: Recommended Immediate Action", errors, warnings);

  return {
    passNumber: 5,
    passName: "Dual-Language Readability & Tone Check",
    passed: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * PASS 6: C++20 Annotated Code Snippet Verification
 * Primary language is C++20 with annotated lines and compilation metadata.
 */
export function validatePass6CodeSnippets(module: LearningModule): ValidationPassResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!module.annotatedCodeSnippets || module.annotatedCodeSnippets.length === 0) {
    errors.push("Missing annotatedCodeSnippets: At least one primary C++20 implementation is required");
    return {
      passNumber: 6,
      passName: "C++20 Annotated Code Verification",
      passed: false,
      errors,
      warnings
    };
  }

  const cppSnippet = module.annotatedCodeSnippets.find(s => s.language === "cpp");
  if (!cppSnippet) {
    errors.push("Primary C++20 implementation (language: 'cpp') is missing");
  } else {
    if (!cppSnippet.fullSourceCode || cppSnippet.fullSourceCode.trim().length === 0) {
      errors.push("C++20 snippet has empty fullSourceCode");
    } else {
      const code = cppSnippet.fullSourceCode;
      // Basic sanity checks for valid C++20 function structure
      if (!code.includes("(") || !code.includes(")") || !code.includes("{") || !code.includes("}")) {
        errors.push("C++20 snippet is missing standard function structure");
      }
      if (!code.includes("return")) {
        warnings.push("C++20 snippet does not contain a return statement");
      }
    }

    if (!cppSnippet.lineAnnotations || cppSnippet.lineAnnotations.length < 3) {
      errors.push(
        `C++20 snippet must contain at least 3 annotated lines (found: ${cppSnippet.lineAnnotations?.length || 0})`
      );
    } else {
      cppSnippet.lineAnnotations.forEach(ann => {
        if (ann.lineNumber <= 0) {
          errors.push(`Invalid lineNumber ${ann.lineNumber} in C++ annotation`);
        }
        checkBilingual(ann.annotation, `C++ annotation at line ${ann.lineNumber}`, errors, warnings);
      });
    }

    if (!cppSnippet.compilationMetadata?.isVerifiedCompilable) {
      warnings.push("C++20 snippet compilationMetadata is not marked as verifiedCompilable");
    }
  }

  return {
    passNumber: 6,
    passName: "C++20 Annotated Code Verification",
    passed: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * PASS 7: Verification Rubric Integrity
 * Verifies that the free-text evaluation rubric contains at least 3 essential ideas
 * summing to 100%, misconception detectors, and diagnostic questions.
 */
export function validatePass7Rubric(module: LearningModule): ValidationPassResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const l9 = module.layer9VerificationRubric;
  if (!l9) {
    return {
      passNumber: 7,
      passName: "Verification Rubric Integrity",
      passed: false,
      errors: ["Layer 9 is undefined"],
      warnings: []
    };
  }

  if (l9.minimumPassingMasteryScore <= 0 || l9.minimumPassingMasteryScore > 100) {
    errors.push("Layer 9: minimumPassingMasteryScore must be between 1 and 100");
  }

  if (!l9.essentialCoreIdeas || l9.essentialCoreIdeas.length < 3) {
    errors.push(
      `Layer 9: Must contain at least 3 essentialCoreIdeas for free-text evaluation (found: ${l9.essentialCoreIdeas?.length || 0})`
    );
  } else {
    let totalWeight = 0;
    l9.essentialCoreIdeas.forEach((idea, idx) => {
      totalWeight += idea.weightPercentage;
      if (!idea.conceptLabel || idea.conceptLabel.trim().length === 0) {
        errors.push(`Layer 9: Essential idea ${idx} missing conceptLabel`);
      }
      checkBilingual(idea.semanticExpectation, `Layer 9: Essential idea "${idea.conceptLabel}" expectation`, errors, warnings);
      if (!idea.requiredKeywords || idea.requiredKeywords.length === 0) {
        errors.push(`Layer 9: Essential idea "${idea.conceptLabel}" must have at least one required keyword/phrase`);
      }
    });

    if (totalWeight !== 100) {
      errors.push(`Layer 9: Essential ideas weights must sum to 100% (currently sums to ${totalWeight}%)`);
    }
  }

  if (!l9.misconceptionDetectors || l9.misconceptionDetectors.length === 0) {
    errors.push("Layer 9: Must define at least one misconceptionDetector");
  } else {
    l9.misconceptionDetectors.forEach((md, idx) => {
      if (!md.detectionTriggers || md.detectionTriggers.length === 0) {
        errors.push(`Layer 9: Misconception detector ${idx} (${md.misconceptionLabel}) has no detection triggers`);
      }
      checkBilingual(md.remediationAdvice, `Layer 9: Misconception "${md.misconceptionLabel}" remediation`, errors, warnings);
    });
  }

  if (!l9.diagnosticQuestions || l9.diagnosticQuestions.length < 2) {
    warnings.push(
      `Layer 9: Recommended to have at least 2 diagnosticQuestions (found: ${l9.diagnosticQuestions?.length || 0})`
    );
  }

  return {
    passNumber: 7,
    passName: "Verification Rubric & Diagnostic Questioning",
    passed: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * PASS 8: Fear Points & Curriculum Hierarchy Linkage
 * Validates that all fearPointRefIds and hierarchy IDs point to registered entities.
 */
export function validatePass8FearPointsAndCurriculum(module: LearningModule): ValidationPassResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Hierarchy validation
  const step = getCurriculumStepById(module.stepId);
  if (!step) {
    errors.push(`Invalid stepId "${module.stepId}": Not found in curriculum registry`);
  }

  const subtopic = getCurriculumSubtopicById(module.subtopicId);
  if (!subtopic) {
    errors.push(`Invalid subtopicId "${module.subtopicId}": Not found in curriculum registry`);
  }

  const microConcept = getCurriculumMicroConceptById(module.microConceptId);
  if (!microConcept) {
    errors.push(`Invalid microConceptId "${module.microConceptId}": Not found in curriculum registry`);
  }

  // Layer 7 Fear Point references
  if (module.layer7CommonPitfalls?.mistakeTraps) {
    module.layer7CommonPitfalls.mistakeTraps.forEach(trap => {
      if (trap.fearPointRefId) {
        const fp = getFearPointById(trap.fearPointRefId);
        if (!fp) {
          errors.push(
            `Layer 7: Mistake trap "${trap.trapId}" references non-existent fearPointId "${trap.fearPointRefId}"`
          );
        }
      }
    });
  }

  // Layer 9 Misconception Fear Point references
  if (module.layer9VerificationRubric?.misconceptionDetectors) {
    module.layer9VerificationRubric.misconceptionDetectors.forEach(md => {
      if (md.associatedFearPointId) {
        const fp = getFearPointById(md.associatedFearPointId);
        if (!fp) {
          errors.push(
            `Layer 9: Misconception detector "${md.id}" references non-existent fearPointId "${md.associatedFearPointId}"`
          );
        }
      }
    });
  }

  return {
    passNumber: 8,
    passName: "Curriculum Registry & Fear Points Cross-Linkage",
    passed: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * PASS 9: Publication Lifecycle & Readiness
 * Enforces that a module can only transition to "published" if all 8 preceding passes are 100% error-free.
 */
export function validatePass9PublicationReadiness(
  module: LearningModule,
  previousPasses: ValidationPassResult[]
): ValidationPassResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const priorErrors = previousPasses.filter(p => !p.passed);

  if (module.status === "published") {
    if (priorErrors.length > 0) {
      errors.push(
        `Cannot publish module "${module.moduleId}": Failed ${priorErrors.length} validation pass(es) [${priorErrors.map(p => `Pass ${p.passNumber}: ${p.passName}`).join(", ")}]`
      );
    }
    if (module.auditMetadata?.verifiedPassCount !== 9) {
      errors.push(`Module marked 'published' must have auditMetadata.verifiedPassCount = 9 (found: ${module.auditMetadata?.verifiedPassCount})`);
    }
  } else {
    // For "draft" or "verified", report how many passes remain before publication
    if (priorErrors.length > 0) {
      warnings.push(`Module is in "${module.status}" status. ${priorErrors.length} pass(es) currently require remediation before publication.`);
    }
  }

  return {
    passNumber: 9,
    passName: "Publication Lifecycle & Gatekeeper",
    passed: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * MASTER 9-PASS VALIDATOR
 * Runs all 9 validation passes on a given module and returns the consolidated report.
 */
export function validateLearningModule(module: LearningModule): ContentValidationReport {
  const p1 = validatePass1Structure(module);
  const p2 = validatePass2Invariants(module);
  const p3 = validatePass3Complexity(module);
  const p4 = validatePass4VisualDryRun(module);
  const p5 = validatePass5BilingualContent(module);
  const p6 = validatePass6CodeSnippets(module);
  const p7 = validatePass7Rubric(module);
  const p8 = validatePass8FearPointsAndCurriculum(module);
  
  const priorPasses = [p1, p2, p3, p4, p5, p6, p7, p8];
  const p9 = validatePass9PublicationReadiness(module, priorPasses);
  
  const allPasses = [...priorPasses, p9];
  const passedCount = allPasses.filter(p => p.passed).length;
  const overallPassed = passedCount === allPasses.length;

  return {
    moduleId: module.moduleId,
    overallPassed,
    passedCount,
    totalPasses: allPasses.length,
    passResults: allPasses,
    canPublish: overallPassed && module.status === "published"
  };
}
