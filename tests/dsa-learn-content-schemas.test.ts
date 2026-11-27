/**
 * COGNALYZE DSA LEARN — AUTOMATED TEST SUITE: PHASE 3
 * Tests Educational Content Architecture, Schemas & 9-Pass Content Validator
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  LearningModule,
  SimulationFrame
} from "../lib/skills/learn/content-schemas";
import {
  validateLearningModule,
  validatePass1Structure,
  validatePass2Invariants,
  validatePass3Complexity,
  validatePass4VisualDryRun,
  validatePass5BilingualContent,
  validatePass6CodeSnippets,
  validatePass7Rubric,
  validatePass8FearPointsAndCurriculum,
  validatePass9PublicationReadiness
} from "../lib/skills/learn/content-validator";

/**
 * Creates a fully valid, production-grade test fixture module
 * for Kadane's Algorithm (mc-3-2-1-1 / sub-3-2-1 / step-3).
 */
function createValidTestModule(): LearningModule {
  return {
    moduleId: "mod-kadane-algorithm",
    microConceptId: "mc-3-2-1-1",
    subtopicId: "sub-3-2-1",
    stepId: "step-3",
    title: {
      en: "Kadane's Algorithm: Maximum Subarray Sum in Linear Time",
      hinglish: "Kadane's Algorithm: Contiguous Subarray ka Maximum Sum Linear Time me"
    },
    version: "1.0.0",
    difficulty: "medium",
    estimatedReadTimeMinutes: 15,
    status: "published",

    layer1WhyExists: {
      historicalGenesis: {
        en: "In 1977, Ulf Grenander formulated the maximum sum subarray problem to model 2D image signals. The naive solution checked all O(N^2) or O(N^3) candidate subarrays.",
        hinglish: "1977 me Ulf Grenander ne image processing ke liye problem banayi thi. Brute force approach O(N^3) ya O(N^2) me saare subarrays check karta tha jo bade arrays me time-out ho jata hai."
      },
      coreProblemStatement: {
        en: "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
        hinglish: "Array me se continuous hissa (subarray) chuno jiska sum sabse zyada ho, aur wo maximum sum return karo."
      },
      naiveApproaches: [
        {
          title: {
            en: "Cubic All-Pairs Subarray Enumeration",
            hinglish: "Saare Subarrays ko 3 nested loops se nikalna"
          },
          algorithmicIntuition: {
            en: "Iterate through every start i, every end j, and calculate sum from i to j using a third loop.",
            hinglish: "Har start i aur har end j ke liye loop chala kar saare elements ka sum calculate karo."
          },
          timeComplexity: "O(N^3)",
          spaceComplexity: "O(1)",
          bottleneckReason: {
            en: "Redundant summation recalculating overlapping prefix sums repeatedly.",
            hinglish: "Har baar naye sir se sum nikalna jabki pichhla sum pehle se known tha."
          },
          failureScenario: {
            inputExample: "N = 100,000 array with positive and negative integers",
            whyItFailsOrTimesOut: {
              en: "10^15 operations exceed standard 1-second limit (10^8 ops) by 10,000,000x.",
              hinglish: "10^15 operations execute karne me ghanton lag jayenge jabki limit sirf 1 second ki hoti hai."
            }
          }
        }
      ],
      breakthroughInsight: {
        en: "A negative running sum is an absolute liability. Carrying a negative prefix into subsequent elements strictly degrades any future subarray sum.",
        hinglish: "Agar ab tak ka total sum negative ho chuka hai, toh wo aage aane wale kisi bhi element ka sum sirf ghatayega hi. Isliye negative sum ko aage carry karne ke bajaye turant 0 par reset kar do."
      },
      complexityComparisonTable: [
        {
          approachName: "Brute Force All Subarrays",
          timeComplexity: "O(N^3)",
          spaceComplexity: "O(1)",
          scalabilityThreshold: "N <= 500"
        },
        {
          approachName: "Prefix Sum / Double Loop",
          timeComplexity: "O(N^2)",
          spaceComplexity: "O(1)",
          scalabilityThreshold: "N <= 5000"
        },
        {
          approachName: "Kadane's Algorithm",
          timeComplexity: "O(N)",
          spaceComplexity: "O(1)",
          scalabilityThreshold: "N <= 10^7"
        }
      ]
    },

    layer2Intuition: {
      highLevelOverview: {
        en: "At each element, make a greedy decision: Should I extend the existing subarray, or discard it and start fresh with the current element?",
        hinglish: "Har element par khade hokar bas ek decision lena hai: Pichhle sum ko sath leke chalein ya purane ko bhool kar yahan se nayi shuruat karein?"
      },
      primaryAnalogy: {
        metaphorTitle: {
          en: "The Debt-Ridden Business Partnership",
          hinglish: "Karz me doobi hui Purani Dukaan vs Nayi Shuruat"
        },
        narrativeExplanation: {
          en: "Imagine inheriting a sequence of business contracts. If your accumulated net balance is negative, partnering with the next business immediately incurs debt. You are better off declaring bankruptcy (resetting to 0) and taking the next opportunity fresh.",
          hinglish: "Socho aap ek business chala rahe ho. Agar pichhla running balance negative ho chuka hai, toh naye contract me purana karz add karne ka koi faayda nahi hai. Usko chhod kar 0 se naya account kholna hi akalmandhi hai."
        },
        mappingToAlgorithmicElements: [
          {
            realWorldEntity: "Accumulated net debt (< 0)",
            algorithmEquivalent: "currSum < 0",
            roleExplanation: {
              en: "Negative running sum that degrades future extensions.",
              hinglish: "Negative balance jo aage ke total ko chhota kar deta hai."
            }
          },
          {
            realWorldEntity: "Declaring bankruptcy / Fresh ledger",
            algorithmEquivalent: "currSum = 0",
            roleExplanation: {
              en: "Resetting the accumulator to discard toxic prefixes.",
              hinglish: "Sum ko zero karke aage se fresh count shuru karna."
            }
          }
        ]
      },
      mentalVisualPrompt: {
        en: "Visualize a running water tank: positive numbers fill the tank, negative numbers drain it. The moment it drops below ground level, pump it dry and start refilling.",
        hinglish: "Ek water tank visualize karo: positive number pani bharte hain, negative number nikalte hain. Jaise hi level 0 se niche jaye, tank khali karke fresh bharo."
      }
    },

    layer3Invariants: {
      preConditions: [
        "Array contains at least one integer: nums.size() >= 1",
        "Array values fit within standard signed 32-bit or 64-bit bounds"
      ],
      loopInvariants: [
        {
          name: "Local Maximum Subarray Ending at Index i",
          formalStatement: "\\text{currSum} = \\max\\left(0, \\sum_{k=s}^{i} \\text{nums}[k]\\right) \\quad \\text{where } s \\le i",
          plainEnglishExplanation: {
            en: "At the end of iteration i, currSum holds the maximum sum of any contiguous subarray ending at index i, or 0 if all such sums are negative.",
            hinglish: "Iteration i khatam hone par, currSum index i par khatam hone wale kisi bhi subarray ka maximum sum rakhta hai (ya 0 agar negative ho)."
          },
          whyItMustHold: {
            en: "Ensures optimal substructure: any optimal subarray ending at i either extends the optimal subarray ending at i-1 or starts anew at i.",
            hinglish: "Optimal substructure maintain karta hai: index i par subarray ya toh pichhle optimal ko extend karega ya yahin se shuru hoga."
          }
        },
        {
          name: "Global Maximum Subarray Seen So Far",
          formalStatement: "\\text{maxSum} = \\max_{0 \\le p \\le q \\le i} \\sum_{k=p}^{q} \\text{nums}[k]",
          plainEnglishExplanation: {
            en: "maxSum holds the maximum subarray sum observed across all examined prefixes up to index i.",
            hinglish: "maxSum ab tak ke dekhe gaye saare subarrays me se sabse highest sum ko record karta hai."
          },
          whyItMustHold: {
            en: "Guarantees that when the loop finishes at index n-1, maxSum is the true global maximum over the entire array.",
            hinglish: "Loop khatam hone par poore array ka global maximum correct milna guarantee karta hai."
          }
        }
      ],
      postConditions: [
        "maxSum contains the true maximum contiguous subarray sum over nums[0..n-1]",
        "Single pass completion with O(N) time and O(1) space"
      ],
      inductiveProofBasis: {
        en: "Base Case: At i = 0, currSum = nums[0], maxSum = nums[0]. Inductive Step: Assume invariant holds at i - 1. Then at i, nums[i] is added. If currSum + nums[i] < nums[i], starting at nums[i] is strictly superior. If currSum drops below 0, resetting to 0 preserves future optimality.",
        hinglish: "Base case: i = 0 par currSum aur maxSum dono nums[0] hote hain. Induction se agar i - 1 tak property sahi hai, toh i par nums[i] add karne par optimal choice strictly maintain rehti hai."
      },
      invariantPreservationRules: {
        atInitialization: {
          en: "Initialize currSum = 0 (or nums[0]) and maxSum = nums[0] (or LLONG_MIN).",
          hinglish: "currSum ko 0 aur maxSum ko nums[0] se initialize karo."
        },
        duringMaintenance: {
          en: "Add nums[i] to currSum. Update maxSum = max(maxSum, currSum). If currSum < 0, reset currSum = 0.",
          hinglish: "nums[i] ko currSum me add karo, maxSum update karo, aur agar currSum negative ho toh 0 kardo."
        },
        uponTermination: {
          en: "After loop reaches n, all possible end positions 0..n-1 have been examined, making maxSum globally optimal.",
          hinglish: "Loop n tak pahunchne ke baad saare possible subarrays evaluate ho chuke hote hain."
        }
      }
    },

    layer4VisualDryRun: {
      defaultInputDataset: {
        description: {
          en: "Standard mixed array with negatives and positives",
          hinglish: "Mixed array jisme positive aur negative dono numbers hain"
        },
        data: [-2, 1, -3, 4, -1, 2, 1, -5, 4]
      },
      stepByStepFrames: [
        {
          frameIndex: 0,
          title: {
            en: "Initialization: First Element",
            hinglish: "Initialization: Pehla Element"
          },
          codeLineNumber: 3,
          explanation: {
            en: "Initialize currSum = 0, maxSum = nums[0] = -2.",
            hinglish: "currSum ko 0 aur maxSum ko nums[0] yaani -2 set karo."
          },
          arrayState: [
            { index: 0, value: -2, state: "active" },
            { index: 1, value: 1, state: "unvisited" },
            { index: 2, value: -3, state: "unvisited" }
          ],
          pointers: [{ name: "i", index: 0, color: "blue" }],
          variables: [
            { name: "currSum", value: -2, delta: "+(-2)" },
            { name: "maxSum", value: -2, isHighlighted: true }
          ],
          calloutAlert: {
            type: "warning",
            message: {
              en: "currSum became negative (-2), so it is reset to 0.",
              hinglish: "currSum negative (-2) ho gaya, isliye turant 0 par reset kar diya."
            }
          }
        },
        {
          frameIndex: 1,
          title: {
            en: "Index 1: Element 1",
            hinglish: "Index 1: Element 1"
          },
          codeLineNumber: 5,
          explanation: {
            en: "currSum becomes 0 + 1 = 1. Update maxSum = max(-2, 1) = 1.",
            hinglish: "currSum 0 + 1 = 1 ho gaya. maxSum update hokar 1 ban gaya."
          },
          arrayState: [
            { index: 0, value: -2, state: "discarded" },
            { index: 1, value: 1, state: "included" },
            { index: 2, value: -3, state: "unvisited" }
          ],
          pointers: [{ name: "i", index: 1, color: "blue" }],
          variables: [
            { name: "currSum", value: 1, delta: "+1" },
            { name: "maxSum", value: 1, isHighlighted: true }
          ]
        },
        {
          frameIndex: 2,
          title: {
            en: "Index 2: Element -3",
            hinglish: "Index 2: Element -3"
          },
          codeLineNumber: 6,
          explanation: {
            en: "currSum becomes 1 + (-3) = -2. Reset currSum to 0. maxSum stays 1.",
            hinglish: "currSum 1 + (-3) = -2 hua. 0 se kam hone ki wajah se reset ho gaya. maxSum 1 hi raha."
          },
          arrayState: [
            { index: 0, value: -2, state: "discarded" },
            { index: 1, value: 1, state: "discarded" },
            { index: 2, value: -3, state: "discarded" }
          ],
          pointers: [{ name: "i", index: 2, color: "blue" }],
          variables: [
            { name: "currSum", value: 0, delta: "reset to 0" },
            { name: "maxSum", value: 1 }
          ]
        }
      ]
    },

    layer5SocraticDerivation: {
      derivationGoal: {
        en: "Discover why discarding a negative running sum guarantees finding the optimal subarray.",
        hinglish: "Yeh samajhna ki negative sum ko chhod dene se maximum subarray kaise milta hai."
      },
      guidedSteps: [
        {
          stepIndex: 1,
          promptQuestion: {
            en: "If your running sum of a subarray prefix is -5, and the next element is 10, does keeping the prefix help you or hurt you?",
            hinglish: "Agar pichhle hisse ka sum -5 hai aur agla number 10 hai, toh pichhle ko sath rakhne se faayda hoga ya nuksan?"
          },
          contextSituation: {
            en: "Comparing (-5 + 10 = 5) versus starting fresh at 10.",
            hinglish: "(-5 + 10 = 5) ko compare karo 10 se akele shuru karne se."
          },
          thoughtOptions: [
            {
              optionId: "opt-1",
              text: {
                en: "Keeping it helps because it includes more elements.",
                hinglish: "Sath rakhna chahiye kyunki zyada elements hain."
              },
              isOptimalThought: false,
              feedback: {
                en: "Incorrect: adding -5 reduces the total to 5. 10 by itself is greater than 5.",
                hinglish: "Galat: -5 add karne se sum 5 ho jayega, jabki 10 akela hi usse bada hai."
              }
            },
            {
              optionId: "opt-2",
              text: {
                en: "Discarding it is strictly better because 10 > 5.",
                hinglish: "Usko chhodna behtar hai kyunki 10 akela 5 se bada hai."
              },
              isOptimalThought: true,
              feedback: {
                en: "Exactly right! Any prefix with sum < 0 only acts as a drag on future elements.",
                hinglish: "Bilkul sahi! Koi bhi negative sum aage aane wale numbers ko sirf kam hi karega."
              }
            }
          ],
          hintProgression: {
            level1GentleNudge: {
              en: "Calculate 10 versus -5 + 10.",
              hinglish: "10 aur (-5 + 10) ka comparison dekho."
            },
            level2StructuralHint: {
              en: "Whenever S < 0, S + X < X for any value of X.",
              hinglish: "Agar S < 0 ho, toh S + X hamesha X se chhota hi hoga."
            },
            level3BreakthroughReveal: {
              en: "Therefore, no optimal subarray will ever begin with or contain a strictly negative prefix.",
              hinglish: "Iska matlab koi bhi optimal subarray kabhi bhi negative prefix se shuru nahi hoga."
            }
          },
          socraticResolution: {
            en: "A negative prefix is mathematically proven to be toxic to all subsequent extensions.",
            hinglish: "Yeh prove ho gaya ki negative prefix aage ke kisi bhi hisse ko nuksan hi pahunchata hai."
          }
        }
      ],
      synthesisSummary: {
        en: "By greedily cutting off negative prefixes at zero, we prune all sub-optimal subarrays in a single O(N) sweep.",
        hinglish: "Negative prefixes ko 0 par cut karke hum bina saare subarrays banaye ek hi pass me answer nikal lete hain."
      }
    },

    layer6Complexity: {
      timeComplexity: {
        bestCase: {
          notation: "O(N)",
          formalDerivation: {
            en: "A single linear pass visiting each element from index 0 to n-1 exactly once.",
            hinglish: "Poore array me 0 se n-1 tak har element ko sirf ek baar visit kiya jata hai."
          },
          governingFactors: ["Array size N"]
        },
        averageCase: {
          notation: "O(N)",
          formalDerivation: {
            en: "Uniform O(1) operations per iteration: arithmetic addition, comparison, assignment.",
            hinglish: "Har step par O(1) constant time operations hote hain: addition aur comparison."
          },
          governingFactors: ["Array size N"]
        },
        worstCase: {
          notation: "O(N)",
          formalDerivation: {
            en: "No nested loops or backtracking. Exactly N iterations regardless of data distribution.",
            hinglish: "Koyi nested loop ya backtrack nahi hai. N iterations strictly execute hote hain."
          },
          governingFactors: ["Array size N"]
        }
      },
      spaceComplexity: {
        auxiliarySpace: {
          notation: "O(1)",
          formalDerivation: {
            en: "Only two scalar variables (currSum, maxSum) allocated in the register/stack frame.",
            hinglish: "Sirf do scalar variables (currSum aur maxSum) use hote hain."
          },
          governingFactors: ["Constant primitive storage"]
        },
        stackMemorySpace: {
          notation: "O(1)",
          formalDerivation: {
            en: "Iterative implementation without recursive stack frames.",
            hinglish: "Iterative code hai, recursion call stack ki zaroorat nahi padti."
          },
          governingFactors: ["Iterative loop"]
        },
        totalWorkingSpace: {
          notation: "O(1)",
          formalDerivation: {
            en: "No extra containers, arrays, or dynamic memory allocations.",
            hinglish: "Koyi naya array ya container allocate nahi hota."
          },
          governingFactors: ["In-place inspection"]
        },
        whyLessSpaceIsImpossible: {
          en: "To track both the local running sum and the global maximum, at least two scalar accumulators are required.",
          hinglish: "Local running sum aur global maximum ko track karne ke liye kam se kam 2 variables toh chahiye hi."
        }
      },
      scalingBehaviorGraphSummary: [
        {
          inputScaleN: "10^4",
          expectedOperations: "10^4",
          typicalWallClockDuration: "< 1 ms"
        },
        {
          inputScaleN: "10^6",
          expectedOperations: "10^6",
          typicalWallClockDuration: "~2 ms"
        }
      ]
    },

    layer7CommonPitfalls: {
      criticalEdgeCases: [
        {
          edgeCaseName: {
            en: "All Negative Numbers Array",
            hinglish: "Poora Array Negative Numbers se bhara ho"
          },
          inputScenario: "[-5, -2, -8, -1, -4]",
          handlingStrategy: {
            en: "Initialize maxSum to nums[0] (or LLONG_MIN) and update maxSum BEFORE resetting currSum to 0. Otherwise it wrongly returns 0.",
            hinglish: "maxSum ko 0 nahi balki nums[0] se shuru karo aur maxSum update pehle karo, currSum reset baad me."
          }
        }
      ],
      mistakeTraps: [
        {
          trapId: "trap-kadane-all-negative",
          fearPointRefId: "fp-3-2-1-2",
          title: {
            en: "Premature Reset Overwriting All-Negative Answers with 0",
            hinglish: "All-Negative array me 0 return karne ki galti"
          },
          falseAssumption: {
            en: "Assuming the maximum subarray sum can never be negative, so initializing maxSum = 0.",
            hinglish: "Yeh assume karna ki answer kabhi negative ho hi nahi sakta, isliye maxSum = 0 rakh dena."
          },
          buggyCodeSnippet: "int maxSum = 0; // BUG: Fails when all elements are negative\nfor (int x : nums) { ... }",
          correctCodeSnippet: "long long maxSum = nums[0]; // CORRECT: Accommodates least negative single element\nlong long currSum = 0;\nfor (int x : nums) {\n    currSum += x;\n    maxSum = max(maxSum, currSum);\n    if (currSum < 0) currSum = 0;\n}",
          explanationOfFix: {
            en: "If all elements are negative, the maximum subarray is the single least-negative element (e.g. -1 in [-3, -1, -5]). Initializing maxSum to 0 erroneously reports 0.",
            hinglish: "Agar saare elements negative hain toh sabse kam negative wala element (jaise -1) answer hota hai. 0 se shuru karne par galat answer aayega."
          },
          testCaseThatExposesIt: {
            input: "nums = [-3, -1, -5]",
            buggyOutput: "0",
            expectedOutput: "-1"
          }
        }
      ]
    },

    layer8PatternTriggers: {
      primaryTriggers: [
        {
          clueType: "keyword",
          clueDescription: {
            en: "Problem mentions 'maximum sum', 'largest sum', and 'contiguous subarray'.",
            hinglish: "Question me 'maximum sum' aur 'contiguous/continuous subarray' likha ho."
          },
          examplePhrases: [
            "maximum subarray sum",
            "largest sum contiguous segment",
            "continuous sequence with peak value"
          ],
          algorithmicImplication: {
            en: "Strong signal for Kadane's algorithm or prefix-minimum reduction.",
            hinglish: "Seedha Kadane's algorithm lagane ka clear signal hai."
          }
        }
      ],
      constraintSignatures: [
        {
          inputSizeConstraint: "N <= 10^5 or N <= 10^6",
          compatibleComplexities: ["O(N)", "O(N log N)"],
          immediateDeductions: {
            en: "O(N^2) double loops will TLE. Kadane's linear scan is optimal.",
            hinglish: "O(N^2) TLE dega, O(N) Kadane best aur fastest rahega."
          }
        }
      ],
      counterSignals: [
        {
          misleadingClue: {
            en: "Problem asks for maximum sum subsequence (elements don't need to be contiguous).",
            hinglish: "Question me subsequence pucha ho jisme elements lagatar hona zaroori nahi."
          },
          whyThisAlgorithmFailsHere: {
            en: "Kadane relies on contiguity. For a subsequence, simply sum all positive numbers.",
            hinglish: "Kadane contiguous subarray ke liye hota hai. Subsequence me bas saare positive numbers add karne hote hain."
          },
          alternativePatternRecommended: "Greedy positive accumulation or DP"
        }
      ]
    },

    layer9VerificationRubric: {
      minimumPassingMasteryScore: 80,
      essentialCoreIdeas: [
        {
          id: "idea-negative-prefix-discard",
          conceptLabel: "Negative Running Sum Discard",
          semanticExpectation: {
            en: "Explains that a negative accumulated sum degrades any future subarray, so resetting currSum to 0 is optimal.",
            hinglish: "Samjhata hai ki negative running sum aage ke subarrays ko nuksan pahunchata hai isliye usko 0 par reset karte hain."
          },
          requiredKeywords: ["negative", "reset", "degrade", "0"],
          weightPercentage: 40
        },
        {
          id: "idea-optimal-substructure",
          conceptLabel: "Local vs Global Maximum Distinction",
          semanticExpectation: {
            en: "Clearly differentiates currSum (best subarray ending at current index) from maxSum (best subarray seen overall).",
            hinglish: "currSum aur maxSum me fark batata hai: currSum current index par khatam hone wala best hai, maxSum global best hai."
          },
          requiredKeywords: ["currSum", "maxSum", "global", "local"],
          weightPercentage: 35
        },
        {
          id: "idea-all-negative-handling",
          conceptLabel: "All-Negative Initialization & Timing",
          semanticExpectation: {
            en: "Explains why maxSum must be updated before resetting currSum, or initialized to nums[0] to handle all-negative arrays.",
            hinglish: "Batata hai ki all-negative arrays ke liye maxSum ko nums[0] se shuru karna aur reset se pehle update karna zaroori hai."
          },
          requiredKeywords: ["nums[0]", "negative", "update", "before"],
          weightPercentage: 25
        }
      ],
      misconceptionDetectors: [
        {
          id: "detector-all-negative-zero",
          associatedFearPointId: "fp-3-2-1-2",
          misconceptionLabel: "Assuming minimum answer is 0",
          detectionTriggers: [
            "initialize to 0",
            "answer cannot be negative",
            "empty subarray"
          ],
          remediationAdvice: {
            en: "Remember that if the problem requires a non-empty subarray, an all-negative array must return its largest element (e.g. -1), not 0.",
            hinglish: "Dhyan rahe agar non-empty subarray chahiye toh all-negative array me answer sabse bada negative number hota hai, 0 nahi."
          }
        }
      ],
      diagnosticQuestions: [
        {
          id: "diag-q1",
          questionType: "code_output_prediction",
          questionPrompt: {
            en: "What is the maximum subarray sum of nums = [-2, -5, -1, -4]?",
            hinglish: "nums = [-2, -5, -1, -4] ka maximum subarray sum kya hoga?"
          },
          options: [
            {
              optionId: "opt-a",
              text: { en: "0", hinglish: "0" },
              isCorrect: false,
              explanation: {
                en: "0 is incorrect because an empty subarray is not permitted.",
                hinglish: "0 galat hai kyunki empty subarray allowed nahi hai."
              }
            },
            {
              optionId: "opt-b",
              text: { en: "-1", hinglish: "-1" },
              isCorrect: true,
              explanation: {
                en: "Correct! -1 is the single least-negative contiguous element.",
                hinglish: "Sahi! -1 sabse kam negative element hai."
              }
            }
          ]
        },
        {
          id: "diag-q2",
          questionType: "invariant_check",
          questionPrompt: {
            en: "Why do we reset currSum to 0 when it drops below 0?",
            hinglish: "Jab currSum 0 se kam ho jata hai toh use 0 par kyu reset karte hain?"
          },
          options: [
            {
              optionId: "opt-a",
              text: {
                en: "Because adding a negative prefix strictly reduces the sum of any future subarray.",
                hinglish: "Kyunki negative sum add karne se aage aane wale subarray ka sum kam ho jata hai."
              },
              isCorrect: true,
              explanation: {
                en: "Spot on! Any prefix with sum < 0 acts as a drag on subsequent numbers.",
                hinglish: "Sahi! Negative prefix aage ke sum ko drag karta hai."
              }
            }
          ]
        }
      ]
    },

    layer10BridgeToPractice: {
      canonicalPracticeProblems: [
        {
          problemId: "dsa-step3-max-subarray",
          title: "Maximum Subarray (LeetCode 53 / Step 3.2)",
          difficulty: "medium",
          conceptApplicationNotes: {
            en: "Direct textbook application of Kadane's algorithm.",
            hinglish: "Kadane's algorithm ka direct application."
          },
          subtleVariationFromCore: {
            en: "Standard version returning the maximum scalar sum.",
            hinglish: "Standard version jo scalar sum return karta hai."
          }
        }
      ],
      progressionRoadmap: [
        {
          level: "standard",
          description: {
            en: "Master scalar Kadane's algorithm.",
            hinglish: "Pehle normal Kadane solve karo."
          },
          problemIds: ["dsa-step3-max-subarray"]
        }
      ],
      recommendedImmediateAction: {
        en: "Switch to the Practice tab and write the solution in C++ 20 to verify complete understanding.",
        hinglish: "Ab Practice tab me jakar C++ 20 me solution likho aur visible tests pass karo."
      }
    },

    annotatedCodeSnippets: [
      {
        language: "cpp",
        standardVersion: "C++20 (Clang++ / G++)",
        fullSourceCode: `long long maxSubarraySum(const std::vector<int>& nums) {
    long long maxSum = nums[0];
    long long currSum = 0;
    for (int x : nums) {
        currSum += x;
        if (currSum > maxSum) {
            maxSum = currSum;
        }
        if (currSum < 0) {
            currSum = 0;
        }
    }
    return maxSum;
}`,
        lineAnnotations: [
          {
            lineNumber: 2,
            annotation: {
              en: "Initialize maxSum to the first element to correctly handle all-negative arrays.",
              hinglish: "maxSum ko pehle element se shuru karo taaki all-negative arrays me bhi sahi answer aaye."
            },
            invariantChecked: "nums.size() >= 1"
          },
          {
            lineNumber: 5,
            annotation: {
              en: "Accumulate current element into running sum.",
              hinglish: "Current element ko chal rahe sum me add karo."
            }
          },
          {
            lineNumber: 9,
            annotation: {
              en: "Discard toxic negative running sum by resetting to 0.",
              hinglish: "Agar sum negative ho gaya toh usko 0 par reset kardo taaki aage nuksan na ho."
            },
            invariantChecked: "currSum >= 0 for future iterations"
          }
        ],
        compilationMetadata: {
          testedCompiler: "clang++ 16.0.0 / g++ 13.2",
          compilerFlags: ["-std=c++20", "-O2", "-Wall"],
          isVerifiedCompilable: true
        }
      }
    ],

    auditMetadata: {
      author: "Principal DSA Curriculum Architect",
      lastAuditedDate: "2026-11-18",
      verifiedPassCount: 9,
      humanReviewSignoff: "Verified & Approved"
    }
  };
}

// ============================================================================
// TEST SUITE
// ============================================================================

test("Phase 3 — Educational Content Architecture & 9-Pass Validator", async (t) => {

  await t.test("1. Production-grade valid module passes all 9 validation passes cleanly", () => {
    const module = createValidTestModule();
    const report = validateLearningModule(module);

    assert.equal(report.overallPassed, true, "Master report overallPassed must be true");
    assert.equal(report.passedCount, 9, "All 9 passes must pass");
    assert.equal(report.totalPasses, 9, "Total passes must be 9");
    assert.equal(report.canPublish, true, "Can publish must be true for valid module in published state");

    report.passResults.forEach(p => {
      assert.equal(p.passed, true, `Pass ${p.passNumber}: ${p.passName} should pass, but had errors: ${p.errors.join("; ")}`);
      assert.equal(p.errors.length, 0, `Pass ${p.passNumber} should have 0 errors`);
    });
  });

  await t.test("2. Pass 1: Catches missing mandatory layers and metadata", () => {
    const module = createValidTestModule();
    // Intentionally remove Layer 1 and clear moduleId
    module.moduleId = "";
    (module as any).layer1WhyExists = undefined;

    const res = validatePass1Structure(module);
    assert.equal(res.passed, false, "Pass 1 must fail when layers are missing");
    assert.ok(res.errors.some(e => e.includes("Missing moduleId")));
    assert.ok(res.errors.some(e => e.includes("Missing Layer 1")));
  });

  await t.test("3. Pass 2: Invariants completeness detects missing loop invariant or formal math statement", () => {
    const module = createValidTestModule();
    module.layer3Invariants.loopInvariants[0].formalStatement = "";

    const res = validatePass2Invariants(module);
    assert.equal(res.passed, false, "Pass 2 must fail when loop invariant formal statement is missing");
    assert.ok(res.errors.some(e => e.includes("missing formal mathematical statement")));
  });

  await t.test("4. Pass 3: Complexity rigor catches missing formal derivation", () => {
    const module = createValidTestModule();
    module.layer6Complexity.timeComplexity.worstCase.formalDerivation = { en: "", hinglish: "" };

    const res = validatePass3Complexity(module);
    assert.equal(res.passed, false, "Pass 3 must fail when time complexity derivation is empty");
    assert.ok(res.errors.some(e => e.includes("Empty English text")));
  });

  await t.test("5. Pass 4: Visual dry-run simulation detects non-sequential frames or invalid pointer indices", () => {
    const module = createValidTestModule();
    // Frame pointer pointing way out of array bounds
    module.layer4VisualDryRun.stepByStepFrames[1].pointers = [{ name: "i", index: 999 }];

    const res = validatePass4VisualDryRun(module);
    assert.equal(res.passed, false, "Pass 4 must fail when pointer index is out of bounds");
    assert.ok(res.errors.some(e => e.includes("out of bounds for array length")));
  });

  await t.test("6. Pass 5: Bilingual check flags empty strings", () => {
    const module = createValidTestModule();
    module.layer1WhyExists.historicalGenesis.hinglish = "";

    const res = validatePass5BilingualContent(module);
    assert.equal(res.passed, false, "Pass 5 must fail when Hinglish text is empty");
    assert.ok(res.errors.some(e => e.includes("Empty Hinglish text")));
  });

  await t.test("7. Pass 6: Code snippet check enforces C++20 and line annotations", () => {
    const module = createValidTestModule();
    module.annotatedCodeSnippets = [];

    const res = validatePass6CodeSnippets(module);
    assert.equal(res.passed, false, "Pass 6 must fail when no C++20 snippet is provided");
    assert.ok(res.errors.some(e => e.includes("At least one primary C++20 implementation is required")));
  });

  await t.test("8. Pass 7: Rubric validator enforces weights summing to 100% and minimum essential ideas", () => {
    const module = createValidTestModule();
    // Tamper with weights
    module.layer9VerificationRubric.essentialCoreIdeas[0].weightPercentage = 10; // now sums to 70%

    const res = validatePass7Rubric(module);
    assert.equal(res.passed, false, "Pass 7 must fail when rubric weights do not sum to 100%");
    assert.ok(res.errors.some(e => e.includes("must sum to 100%")));
  });

  await t.test("9. Pass 8: Cross-links validate existence in Fear Points & Curriculum Registries", () => {
    const module = createValidTestModule();
    module.layer7CommonPitfalls.mistakeTraps[0].fearPointRefId = "fp-non-existent-999";

    const res = validatePass8FearPointsAndCurriculum(module);
    assert.equal(res.passed, false, "Pass 8 must fail when referencing non-existent fear point ID");
    assert.ok(res.errors.some(e => e.includes("references non-existent fearPointId")));
  });

  await t.test("10. Pass 9: Publication Gatekeeper blocks published status if previous passes fail", () => {
    const module = createValidTestModule();
    module.layer1WhyExists = undefined as any; // Breaks Pass 1
    module.status = "published";

    const report = validateLearningModule(module);
    assert.equal(report.overallPassed, false, "Report overallPassed must be false");
    assert.equal(report.canPublish, false, "canPublish must be false");
    
    const p9 = report.passResults.find(p => p.passNumber === 9);
    assert.ok(p9);
    assert.equal(p9?.passed, false, "Pass 9 must fail when prior passes have errors and module is 'published'");
    assert.ok(p9?.errors.some(e => e.includes("Cannot publish module")));
  });
});
