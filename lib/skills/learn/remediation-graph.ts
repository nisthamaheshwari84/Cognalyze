/**
 * COGNALYZE DSA LEARN — ADAPTIVE MISCONCEPTION DETECTION & REMEDIATION GRAPH (PHASE 7)
 * 
 * Maps student conceptual bottlenecks and failed diagnostics back to foundational
 * micro-concept prerequisites in the curriculum DAG, delivering targeted,
 * 2-minute micro-remedial lessons without forcing students to restart an entire chapter.
 */

import { BilingualText } from "./content-schemas";
import { buildPrerequisiteGraph } from "./prerequisite-graph";
import { getCurriculumMicroConceptById } from "./curriculum-registry";
import { getFearPointById } from "./fear-points-registry";

export type RemediationCategory = 
  | "loop_invariant_breakdown"
  | "memory_contiguity_breakdown"
  | "integer_arithmetic_overflow"
  | "pointer_aliasing_breakdown"
  | "base_case_induction_breakdown"
  | "greedy_exchange_breakdown";

export interface MicroRemediationCard {
  id: string;
  triggerKey: string; // e.g. fearPointId or misconceptionId
  category: RemediationCategory;
  title: BilingualText;
  rootCauseMicroConceptId: string;
  rootCauseTitle: string;
  explanation: BilingualText;
  visualAnalogy: BilingualText;
  quickCheckQuestion: {
    prompt: BilingualText;
    options: {
      optionId: string;
      text: BilingualText;
      isCorrect: boolean;
      explanation: BilingualText;
    }[];
  };
  bridgeBackText: BilingualText;
}

export interface RemediationDiagnosis {
  targetMicroConceptId: string;
  hasBreakdown: boolean;
  diagnosedRootCauses: Array<{
    category: RemediationCategory;
    rootCauseMicroConceptId: string;
    rootCauseTitle: string;
    remediationCard: MicroRemediationCard;
  }>;
  recommendedImmediateAction: BilingualText;
}

// ════════════════════════════════════════════════════════════════════════════
// REMEDIATION CARDS REGISTRY
// ════════════════════════════════════════════════════════════════════════════

export const REMEDIATION_CARDS_REGISTRY: Record<string, MicroRemediationCard> = {
  // ── REMEDIATION 1: LOOP INVARIANTS & ACCUMULATORS (mc-1-1-3-1) ──
  "rem-loop-invariants": {
    id: "rem-loop-invariants",
    triggerKey: "fp-1-1-3-1",
    category: "loop_invariant_breakdown",
    title: {
      en: "Micro-Remediation: Loop Invariants & Dual Accumulators",
      hinglish: "Micro-Remediation: Loop Invariants aur Do Variables ka Concept"
    },
    rootCauseMicroConceptId: "mc-1-1-3-1",
    rootCauseTitle: "Loop Execution Model, Invariants & Stack Frames",
    explanation: {
      en: "When an algorithm maintains two variables in a loop (like currSum and maxSum), they serve distinct roles: currSum tracks the active local state ending at the current iteration i, while maxSum preserves the historical global record. Conflating the two causes students to mistakenly reset maxSum or wonder why currSum isn't returned directly.",
      hinglish: "Jab loop me do variables hote hain (jaise currSum aur maxSum), dono ka role alag hota hai: currSum current step par chal rahe candidate ko count karta hai, jabki maxSum ab tak ke sabse best record ko save rakhta hai. Dono ko mix karne se hi confusion hota hai."
    },
    visualAnalogy: {
      en: "Think of an Olympic high-jump athlete: currSum is the height of the bar they are currently jumping over; maxSum is their all-time personal best recorded on the stadium scoreboard.",
      hinglish: "Olympic high-jump athlete ki tarah socho: currSum wo current height hai jisko athlete abhi kood raha hai; maxSum stadium ke board par likha all-time best record hai."
    },
    quickCheckQuestion: {
      prompt: {
        en: "If currSum drops from 10 to -2 on the current element, what should happen to maxSum?",
        hinglish: "Agar current number aane par currSum 10 se gir kar -2 ho jata hai, toh maxSum ka kya hona chahiye?"
      },
      options: [
        {
          optionId: "opt-1",
          text: {
            en: "maxSum should also become -2 because the running sum dropped.",
            hinglish: "maxSum bhi -2 ho jana chahiye kyunki sum gir gaya."
          },
          isCorrect: false,
          explanation: {
            en: "Incorrect! maxSum preserves historical peaks and never downgrades.",
            hinglish: "Galat! maxSum all-time peak rakhta hai aur kabhi downgrade nahi hota."
          }
        },
        {
          optionId: "opt-2",
          text: {
            en: "maxSum remains unchanged (e.g. 10), retaining the historical peak.",
            hinglish: "maxSum bilkul nahi badlega (jaise 10), wo pichhla peak record preserve rakhega."
          },
          isCorrect: true,
          explanation: {
            en: "Correct! Global peak records are immutable downwards.",
            hinglish: "Sahi! Historical peak record kabhi niche nahi girta."
          }
        }
      ]
    },
    bridgeBackText: {
      en: "Now that dual accumulators are clear, you understand why Kadane's algorithm safely resets currSum = 0 while leaving maxSum completely protected at its highest peak.",
      hinglish: "Ab jab dual accumulators clear hain, aapko samajh aa gaya ki Kadane me currSum ko 0 reset karne par bhi maxSum ka peak record 100% safe rehta hai."
    }
  },

  // ── REMEDIATION 2: CONTIGUOUS MEMORY & SUBARRAYS (mc-1-1-3-2) ──
  "rem-contiguous-memory": {
    id: "rem-contiguous-memory",
    triggerKey: "fp-1-1-3-2",
    category: "memory_contiguity_breakdown",
    title: {
      en: "Micro-Remediation: Contiguous Subarrays vs Subsequences",
      hinglish: "Micro-Remediation: Contiguous Subarray vs Subsequence me Fark"
    },
    rootCauseMicroConceptId: "mc-1-1-3-2",
    rootCauseTitle: "1D Array Layout, Contiguity, Cache Locality & Index Bounds",
    explanation: {
      en: "A subarray is a physically contiguous slice of RAM [i..j] with zero gaps between elements. A subsequence allows picking non-adjacent elements while preserving order. Kadane's algorithm relies strictly on physical contiguity. If a problem asks for a subsequence, Kadane is completely invalid because you can just sum all positive numbers!",
      hinglish: "Subarray memory ka ek lagatar hissa [i..j] hota hai jisme beech me koi gap nahi ho sakta. Subsequence me aap beech ke numbers chhod sakte ho. Kadane sirf contiguous subarray ke liye kaam karta hai. Agar subsequence pucha ho toh bas saare positive numbers add karne hote hain!"
    },
    visualAnalogy: {
      en: "A subarray is like a single uncut loaf of bread slice. A subsequence is like picking specific chocolate chips out of the loaf.",
      hinglish: "Subarray ek continuous bread ka tukda hai bina kate. Subsequence bread me se chuninda chocolate chips nikalne jaisa hai."
    },
    quickCheckQuestion: {
      prompt: {
        en: "For array [2, -1, 4], is [2, 4] a valid subarray?",
        hinglish: "Array [2, -1, 4] ke liye, kya [2, 4] ek valid subarray hai?"
      },
      options: [
        {
          optionId: "opt-1",
          text: {
            en: "No, because it skips index 1 (-1), making it a subsequence rather than a subarray.",
            hinglish: "Nahi, kyunki isne index 1 (-1) ko skip kar diya, isliye ye subsequence hai subarray nahi."
          },
          isCorrect: true,
          explanation: {
            en: "Spot on! Subarrays cannot skip elements.",
            hinglish: "Bilkul sahi! Subarray me koi element skip nahi ho sakta."
          }
        },
        {
          optionId: "opt-2",
          text: {
            en: "Yes, because both numbers are in the array.",
            hinglish: "Haan, kyunki dono numbers array me present hain."
          },
          isCorrect: false,
          explanation: {
            en: "Incorrect. Subarrays strictly enforce physical adjacency.",
            hinglish: "Galat. Subarray me lagatar hona compulsory hai."
          }
        }
      ]
    },
    bridgeBackText: {
      en: "Because contiguity is non-negotiable in Kadane, any negative prefix physically drags down subsequent adjacent elements. That is why resetting currSum is optimal.",
      hinglish: "Kyunki Kadane me contiguity zaroori hai, isliye negative sum aage aane wale adjacent element ko physically drag karta hai."
    }
  },

  // ── REMEDIATION 3: SIGNED BOUNDS & ALL-NEGATIVE ARRAYS (mc-1-1-1-3) ──
  "rem-signed-integers": {
    id: "rem-signed-integers",
    triggerKey: "fp-3-2-1-2",
    category: "integer_arithmetic_overflow",
    title: {
      en: "Micro-Remediation: Signed Numbers & Non-Empty Domain Invariants",
      hinglish: "Micro-Remediation: Negative Numbers aur Non-Empty Array Rules"
    },
    rootCauseMicroConceptId: "mc-1-1-1-3",
    rootCauseTitle: "32-bit Integer Overflow Wrapping into Negative Numbers",
    explanation: {
      en: "In addition, 0 is the additive identity (X + 0 = X). Beginners frequently initialize maximum sums to 0 out of habit. However, when the problem domain dictates a non-empty subarray, and all elements are negative (e.g. [-5, -2, -8]), returning 0 is mathematically wrong because 0 is not in the array! The maximum sum of a non-empty array of negatives is the least negative element (-2).",
      hinglish: "Addition me 0 identity element hota hai, isliye students aadat se maxSum = 0 set kar dete hain. Lekin jab problem me non-empty subarray manga ho aur saare numbers negative hon (jaise [-5, -2, -8]), toh 0 return karna galat hai kyunki 0 array me exist hi nahi karta! Sahi answer sabse kam negative number (-2) hota hai."
    },
    visualAnalogy: {
      en: "Imagine measuring the highest temperature in Antarctica during winter. If every thermometer reading is below zero (-30°C, -15°C, -45°C), reporting 0°C is an outright false measurement. You must report -15°C.",
      hinglish: "Antarctica me sardi ka highest temperature measure karne jaisa socho. Agar saare readings negative hain (-30°C, -15°C), toh answer 0°C bolna jhooth hoga. Sahi answer -15°C hi hai."
    },
    quickCheckQuestion: {
      prompt: {
        en: "What is the maximum non-empty subarray sum for [-10, -50, -3]?",
        hinglish: "[-10, -50, -3] ke liye non-empty maximum subarray sum kya hoga?"
      },
      options: [
        {
          optionId: "opt-1",
          text: { en: "-3", hinglish: "-3" },
          isCorrect: true,
          explanation: {
            en: "Correct! -3 is the least negative single element.",
            hinglish: "Sahi! -3 sabse bada (least negative) number hai."
          }
        },
        {
          optionId: "opt-2",
          text: { en: "0", hinglish: "0" },
          isCorrect: false,
          explanation: {
            en: "Incorrect! 0 corresponds to an empty subarray, which is forbidden.",
            hinglish: "Galat! 0 empty subarray ka sum hota hai jo allowed nahi hai."
          }
        }
      ]
    },
    bridgeBackText: {
      en: "This is why in Kadane's algorithm, we always initialize maxSum = nums[0] and update maxSum BEFORE checking currSum < 0.",
      hinglish: "Isi wajah se Kadane's algorithm me maxSum ko hamesha nums[0] se initialize karte hain aur reset se pehle update karte hain."
    }
  }
};

// ════════════════════════════════════════════════════════════════════════════
// REMEDIATION DIAGNOSTIC ENGINE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Maps known fear point IDs and misconception triggers to their remediation cards.
 */
const TRIGGER_TO_REMEDIATION_MAP: Record<string, string> = {
  // Kadane's algorithm triggers
  "fp-3-2-1-2": "rem-signed-integers",
  "det-all-negative-zero-bug": "rem-signed-integers",
  "idea-all-negative-handling": "rem-signed-integers",
  "fp-1-1-3-1": "rem-loop-invariants",
  "idea-optimal-substructure-distinction": "rem-loop-invariants",
  "idea-negative-prefix-liability": "rem-contiguous-memory",
  "det-reset-on-negative-element": "rem-loop-invariants",
  "fp-1-1-3-2": "rem-contiguous-memory"
};

/**
 * Diagnoses root-cause foundational prerequisite breakdowns for a student
 * who struggled on a given micro-concept.
 */
export function diagnosePrerequisiteBreakdown(
  targetMicroConceptId: string,
  failedDiagnosticIds: string[] = [],
  detectedMisconceptionIds: string[] = []
): RemediationDiagnosis {
  const combinedTriggers = Array.from(new Set([...failedDiagnosticIds, ...detectedMisconceptionIds]));
  const diagnosedRootCauses: RemediationDiagnosis["diagnosedRootCauses"] = [];

  for (const trigger of combinedTriggers) {
    const cardId = TRIGGER_TO_REMEDIATION_MAP[trigger];
    if (cardId && REMEDIATION_CARDS_REGISTRY[cardId]) {
      const card = REMEDIATION_CARDS_REGISTRY[cardId];
      if (!diagnosedRootCauses.some((d) => d.remediationCard.id === card.id)) {
        diagnosedRootCauses.push({
          category: card.category,
          rootCauseMicroConceptId: card.rootCauseMicroConceptId,
          rootCauseTitle: card.rootCauseTitle,
          remediationCard: card
        });
      }
    }
  }

  // If no specific trigger matched but the learner struggled, map to primary prerequisite of target micro-concept
  if (diagnosedRootCauses.length === 0 && (failedDiagnosticIds.length > 0 || detectedMisconceptionIds.length > 0)) {
    // Default to loop invariants for Kadane's algorithm
    const defaultCard = REMEDIATION_CARDS_REGISTRY["rem-loop-invariants"];
    diagnosedRootCauses.push({
      category: defaultCard.category,
      rootCauseMicroConceptId: defaultCard.rootCauseMicroConceptId,
      rootCauseTitle: defaultCard.rootCauseTitle,
      remediationCard: defaultCard
    });
  }

  const hasBreakdown = diagnosedRootCauses.length > 0;

  return {
    targetMicroConceptId,
    hasBreakdown,
    diagnosedRootCauses,
    recommendedImmediateAction: {
      en: hasBreakdown
        ? `We identified a foundational gap in "${diagnosedRootCauses[0].rootCauseTitle}". Review the 2-minute micro-card below to unlock complete mastery.`
        : "All foundational prerequisites are solid! You are ready to solve problems in the Practice Tab.",
      hinglish: hasBreakdown
        ? `Humein "${diagnosedRootCauses[0].rootCauseTitle}" me ek basic concept gap mila hai. Niche di gayi 2-minute micro-card padhkar isko turant clear karein.`
        : "Saare basic prerequisites solid hain! Aap Practice Tab me problems solve karne ke liye ready hain."
    }
  };
}

/**
 * Retrieves a remediation card by its ID.
 */
export function getRemediationCardById(id: string): MicroRemediationCard | undefined {
  return REMEDIATION_CARDS_REGISTRY[id];
}

/**
 * Retrieves all remediation cards associated with a target micro-concept.
 */
export function getAllRemediationCardsForMicroConcept(microConceptId: string): MicroRemediationCard[] {
  if (microConceptId === "mc-3-2-1-1") {
    return [
      REMEDIATION_CARDS_REGISTRY["rem-loop-invariants"],
      REMEDIATION_CARDS_REGISTRY["rem-contiguous-memory"],
      REMEDIATION_CARDS_REGISTRY["rem-signed-integers"]
    ];
  }
  return [];
}
