/**
 * COGNALYZE DSA LEARN — MASTER CURRICULUM REGISTRY
 * Complete 17-Step Concept Mastery Syllabus Union (Striver A2Z + Love Babbar)
 * 
 * Hierarchy:
 * Step → Topic → Subtopic → Micro-concept → Learning Unit
 */

import {
  CurriculumStep,
  CurriculumTopic,
  CurriculumSubtopic,
  MicroConcept,
  CurriculumCoverageStats
} from "./curriculum-types";

export const FULL_CURRICULUM_STEPS: CurriculumStep[] = [
  // ════════════════════════════════════════════════════════════════════════════
  // STEP 1: LEARN THE BASICS
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "step-1",
    stepNumber: 1,
    title: "Step 1: Learn the basics",
    shortTitle: "Basics & Fundamentals",
    icon: "🧮",
    description: "Foundational programming mechanics, conditions, loops, functions, basic maths, call stacks, recursion, and frequency hashing.",
    prerequisiteStepIds: [],
    topics: [
      {
        id: "topic-1-1",
        stepId: "step-1",
        title: "Programming Foundations & Syntax Mechanics",
        order: 1,
        description: "Variables, memory allocation, conditionals, loops, functions, and asymptotic complexity.",
        subtopics: [
          {
            id: "sub-1-1-1",
            topicId: "topic-1-1",
            stepId: "step-1",
            title: "Variables, Data Types & Memory Allocation",
            order: 1,
            prerequisites: [],
            difficulty: "beginner",
            description: "Understanding bits, bytes, 32-bit vs 64-bit integers, signed representation, memory addresses, and type conversions.",
            status: "published",
            striverSheetMapping: "Step 1.1 - Things to Know in C++/Java/Python",
            loveBabbarSheetMapping: "Lecture 2 - Write Your First Program & Variables",
            practiceProblemRefs: ["count-digits-in-a-number"],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-1-1-1-1",
                subtopicId: "sub-1-1-1",
                title: "What is a Variable and Memory Cell?",
                order: 1,
                prerequisites: [],
                difficulty: "beginner",
                learningObjectives: ["Understand variables as named memory locations", "Visualize RAM cells and addresses"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-1-1-1"],
                learningUnits: [
                  {
                    id: "lu-1-1-1-1-1",
                    microConceptId: "mc-1-1-1-1",
                    title: "Memory as an Array of Bytes",
                    order: 1,
                    durationMinutes: 5,
                    interactiveType: "reading",
                    learningObjectives: ["Understand byte-level memory addressing"]
                  }
                ]
              },
              {
                id: "mc-1-1-1-2",
                subtopicId: "sub-1-1-1",
                title: "Primitive Data Types, Bit Widths & Memory Footprints",
                order: 2,
                prerequisites: ["mc-1-1-1-1"],
                difficulty: "beginner",
                learningObjectives: ["Compare int, long long, char, float, double", "Calculate maximum and minimum ranges"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-1-1-2"],
                learningUnits: [
                  {
                    id: "lu-1-1-1-2-1",
                    microConceptId: "mc-1-1-1-2",
                    title: "The 32-bit Integer Limit and 2^31 - 1",
                    order: 1,
                    durationMinutes: 6,
                    interactiveType: "visual_dryrun",
                    learningObjectives: ["Visualize integer representation and limits"]
                  }
                ]
              },
              {
                id: "mc-1-1-1-3",
                subtopicId: "sub-1-1-1",
                title: "Integer Overflow, Underflow & Safe Types",
                order: 3,
                prerequisites: ["mc-1-1-1-2"],
                difficulty: "easy",
                learningObjectives: ["Detect overflow conditions in arithmetic", "Use 64-bit long long safely"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-1-1-3"],
                learningUnits: [
                  {
                    id: "lu-1-1-1-3-1",
                    microConceptId: "mc-1-1-1-3",
                    title: "Clock Arithmetic & Overflow Wrapping",
                    order: 1,
                    durationMinutes: 7,
                    interactiveType: "misconception_check",
                    learningObjectives: ["Understand two's complement sign-bit flipping on overflow"]
                  }
                ]
              }
            ]
          },
          {
            id: "sub-1-1-2",
            topicId: "topic-1-1",
            stepId: "step-1",
            title: "Conditionals, Boolean Logic & Control Flow",
            order: 2,
            prerequisites: ["sub-1-1-1"],
            difficulty: "beginner",
            description: "Boolean values, if-else chains, relational operators, short-circuit evaluation, and switch statements.",
            status: "published",
            striverSheetMapping: "Step 1.1 - If Else Statements",
            loveBabbarSheetMapping: "Lecture 3 - Conditionals and Loops",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-1-1-2-1",
                subtopicId: "sub-1-1-2",
                title: "Boolean Truth Values & Relational Comparisons",
                order: 1,
                prerequisites: [],
                difficulty: "beginner",
                learningObjectives: ["Evaluate expressions with ==, !=, <, <=, >, >=", "Understand truthiness in C++"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-1-2-1"],
                learningUnits: []
              },
              {
                id: "mc-1-1-2-2",
                subtopicId: "sub-1-1-2",
                title: "Execution Model of If-Else & Else-If Ladders",
                order: 2,
                prerequisites: ["mc-1-1-2-1"],
                difficulty: "beginner",
                learningObjectives: ["Trace branch execution order", "Differentiate independent ifs from if-else ladders"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-1-2-2"],
                learningUnits: []
              },
              {
                id: "mc-1-1-2-3",
                subtopicId: "sub-1-1-2",
                title: "Logical Operators & Short-Circuit Evaluation",
                order: 3,
                prerequisites: ["mc-1-1-2-2"],
                difficulty: "easy",
                learningObjectives: ["Understand logical AND (&&), OR (||), and NOT (!)", "Prevent null pointer access via short-circuit"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-1-2-3"],
                learningUnits: []
              }
            ]
          },
          {
            id: "sub-1-1-3",
            topicId: "topic-1-1",
            stepId: "step-1",
            title: "Loops, Iteration Mechanics & Loop Invariants",
            order: 3,
            prerequisites: ["sub-1-1-2"],
            difficulty: "beginner",
            description: "For, while, do-while loops, loop counters, off-by-one boundary traps, nested loops, break, and continue.",
            status: "published",
            striverSheetMapping: "Step 1.1 - For Loops & While Loops",
            loveBabbarSheetMapping: "Lecture 3 - While Loop & Patterns",
            practiceProblemRefs: ["count-digits-in-a-number"],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-1-1-3-1",
                subtopicId: "sub-1-1-3",
                title: "Anatomy of a Loop: Initialization, Condition & Step",
                order: 1,
                prerequisites: [],
                difficulty: "beginner",
                learningObjectives: ["Identify the 3 critical components of iteration", "Trace loop variable state after termination"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-1-3-1"],
                learningUnits: []
              },
              {
                id: "mc-1-1-3-2",
                subtopicId: "sub-1-1-3",
                title: "Loop Invariants & Off-by-One Boundary Errors",
                order: 2,
                prerequisites: ["mc-1-1-3-1"],
                difficulty: "easy",
                learningObjectives: ["Formulate invariants that hold true before, during, and after loops", "Distinguish i < N from i <= N"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-1-3-2"],
                learningUnits: []
              },
              {
                id: "mc-1-1-3-3",
                subtopicId: "sub-1-1-3",
                title: "Nested Loops & Multi-Dimensional Traversal",
                order: 3,
                prerequisites: ["mc-1-1-3-2"],
                difficulty: "easy",
                learningObjectives: ["Calculate total iterations of nested loops", "Understand inner loop resets"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-1-3-3"],
                learningUnits: []
              }
            ]
          },
          {
            id: "sub-1-1-4",
            topicId: "topic-1-1",
            stepId: "step-1",
            title: "Functions, Stack Frames & Parameter Passing",
            order: 4,
            prerequisites: ["sub-1-1-3"],
            difficulty: "easy",
            description: "Function activation records, return values, pass-by-value versus pass-by-reference (&), and scope rules.",
            status: "published",
            striverSheetMapping: "Step 1.1 - Functions (Pass by Reference and Value)",
            loveBabbarSheetMapping: "Lecture 8 - Switch Statement & Functions",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-1-1-4-1",
                subtopicId: "sub-1-1-4",
                title: "Call Stack Activation Records (Stack Frames)",
                order: 1,
                prerequisites: [],
                difficulty: "easy",
                learningObjectives: ["Visualize memory push/pop during function calls", "Understand local variable lifespan"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-1-4-1"],
                learningUnits: []
              },
              {
                id: "mc-1-1-4-2",
                subtopicId: "sub-1-1-4",
                title: "Pass-by-Value vs Pass-by-Reference (&)",
                order: 2,
                prerequisites: ["mc-1-1-4-1"],
                difficulty: "easy",
                learningObjectives: ["Explain why swap(a, b) fails without reference", "Analyze memory copying cost of passing vectors by value"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-1-4-2"],
                learningUnits: []
              }
            ]
          },
          {
            id: "sub-1-1-5",
            topicId: "topic-1-1",
            stepId: "step-1",
            title: "Asymptotic Complexity & Big-O Notation",
            order: 5,
            prerequisites: ["sub-1-1-3"],
            difficulty: "easy",
            description: "Growth rates of algorithms, operation counting, Big-O, Big-Theta, Big-Omega, auxiliary space vs total space.",
            status: "published",
            striverSheetMapping: "Step 1.1 - Time and Space Complexity",
            loveBabbarSheetMapping: "Lecture 11 - Time & Space Complexity",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-1-1-5-1",
                subtopicId: "sub-1-1-5",
                title: "Why Not Measure Time in Seconds?",
                order: 1,
                prerequisites: [],
                difficulty: "beginner",
                learningObjectives: ["Understand hardware independence in algorithm analysis", "Relate operations to CPU clock cycles (~10^8 ops/sec)"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-1-5-1"],
                learningUnits: []
              },
              {
                id: "mc-1-1-5-2",
                subtopicId: "sub-1-1-5",
                title: "Dominant Terms & Dropping Constants",
                order: 2,
                prerequisites: ["mc-1-1-5-1"],
                difficulty: "easy",
                learningObjectives: ["Calculate Big-O from algebraic polynomial expressions", "Identify dominant orders: O(1) < O(log N) < O(N) < O(N log N) < O(N^2) < O(2^N)"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-1-5-2"],
                learningUnits: []
              },
              {
                id: "mc-1-1-5-3",
                subtopicId: "sub-1-1-5",
                title: "Auxiliary Space vs Input Space",
                order: 3,
                prerequisites: ["mc-1-1-5-2"],
                difficulty: "easy",
                learningObjectives: ["Differentiate input storage from algorithm scratchpad memory", "Account for recursion call stack memory"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-1-5-3"],
                learningUnits: []
              }
            ]
          }
        ]
      },
      {
        id: "topic-1-2",
        stepId: "step-1",
        title: "Build Up Logical Thinking via 2D Patterns",
        order: 2,
        description: "Developing row-column coordinate reasoning and nested loop invariants through 22 classical geometric patterns.",
        subtopics: [
          {
            id: "sub-1-2-1",
            topicId: "topic-1-2",
            stepId: "step-1",
            title: "Coordinate Mapping & Symmetrical Pattern Invariants",
            order: 1,
            prerequisites: ["sub-1-1-3"],
            difficulty: "easy",
            description: "Formulating formulas for rows, columns, leading spaces, and character grids.",
            status: "published",
            striverSheetMapping: "Step 1.2 - Build-up Logical Thinking (Patterns 1-22)",
            loveBabbarSheetMapping: "Lecture 4 - Solving Pattern Questions",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-1-2-1-1",
                subtopicId: "sub-1-2-1",
                title: "Row-Column Outer vs Inner Loop Responsibility",
                order: 1,
                prerequisites: [],
                difficulty: "easy",
                learningObjectives: ["Assign row index to outer loop and col index to inner loop", "Derive col count as a function of row index"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: [],
                learningUnits: []
              },
              {
                id: "mc-1-2-1-2",
                subtopicId: "sub-1-2-1",
                title: "Space-Star Arithmetic in Symmetric Pyramids",
                order: 2,
                prerequisites: ["mc-1-2-1-1"],
                difficulty: "easy",
                learningObjectives: ["Formulaic decomposition: N - i - 1 spaces, 2*i + 1 stars", "Inverted symmetry via decreasing step counters"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: [],
                learningUnits: []
              }
            ]
          }
        ]
      },
      {
        id: "topic-1-3",
        stepId: "step-1",
        title: "Basic Maths for Algorithmic Problem Solving",
        order: 3,
        description: "Number extraction, divisibility, factor counting in O(sqrt(N)), Euclidean GCD, and prime identification.",
        subtopics: [
          {
            id: "sub-1-3-1",
            topicId: "topic-1-3",
            stepId: "step-1",
            title: "Digit Extraction & Base-10 Arithmetic",
            order: 1,
            prerequisites: ["sub-1-1-3"],
            difficulty: "easy",
            description: "Extracting digits using modulo 10 and division 10, digit reversing, and palindrome verification.",
            status: "published",
            striverSheetMapping: "Step 1.4 - Know Basic Maths",
            loveBabbarSheetMapping: "Lecture 7 - LeetCode Problem Solving (Reverse Int, Complement)",
            practiceProblemRefs: ["count-digits-in-a-number"],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-1-3-1-1",
                subtopicId: "sub-1-3-1",
                title: "Why N % 10 Gives the Last Digit & N / 10 Discards It",
                order: 1,
                prerequisites: [],
                difficulty: "beginner",
                learningObjectives: ["Understand positional base-10 decomposition", "Explain why time complexity is O(log10(N))"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-3-1-1"],
                learningUnits: []
              },
              {
                id: "mc-1-3-1-2",
                subtopicId: "sub-1-3-1",
                title: "Handling the Zero Edge Case (N = 0 has 1 Digit!)",
                order: 2,
                prerequisites: ["mc-1-3-1-1"],
                difficulty: "easy",
                learningObjectives: ["Differentiate while (n > 0) from do-while or explicit zero checks", "Prevent 0 returned for input 0"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-3-1-2"],
                learningUnits: []
              }
            ]
          },
          {
            id: "sub-1-3-2",
            topicId: "topic-1-3",
            stepId: "step-1",
            title: "Divisors, Factors & O(sqrt(N)) Primality Proof",
            order: 2,
            prerequisites: ["sub-1-3-1"],
            difficulty: "easy",
            description: "Why factors appear in symmetrical pairs (d, N/d), checking primality in O(sqrt(N)), Euclidean GCD.",
            status: "published",
            striverSheetMapping: "Step 1.4 - Print all Divisors & Check for Prime",
            loveBabbarSheetMapping: "Lecture 24 - Basic Maths for DSA (Prime, GCD, Modulo)",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-1-3-2-1",
                subtopicId: "sub-1-3-2",
                title: "The Symmetry of Factors Around sqrt(N)",
                order: 1,
                prerequisites: [],
                difficulty: "easy",
                learningObjectives: ["Prove that if d divides N, N/d also divides N", "Optimize loop boundary to i * i <= N"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-3-2-1"],
                learningUnits: []
              },
              {
                id: "mc-1-3-2-2",
                subtopicId: "sub-1-3-2",
                title: "Euclidean GCD Algorithm & Logarithmic Complexity",
                order: 2,
                prerequisites: ["mc-1-3-2-1"],
                difficulty: "easy",
                learningObjectives: ["Understand gcd(a, b) = gcd(b, a % b)", "Prove logarithmic termination via Fibonacci bounds"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: [],
                learningUnits: []
              }
            ]
          }
        ]
      },
      {
        id: "topic-1-4",
        stepId: "step-1",
        title: "Basic Recursion & Call-Stack Mechanics",
        order: 4,
        description: "Understanding self-invoking functions, call-stack expansion, base cases, return unwinding, and tree recursion.",
        subtopics: [
          {
            id: "sub-1-4-1",
            topicId: "topic-1-4",
            stepId: "step-1",
            title: "Recursion Anatomy: Base Case & Return Flow",
            order: 1,
            prerequisites: ["sub-1-1-4"],
            difficulty: "easy",
            description: "Why base cases prevent stack overflow, how values bubble back up the call stack, parameter versus functional return.",
            status: "published",
            striverSheetMapping: "Step 1.5 - Learn Basic Recursion",
            loveBabbarSheetMapping: "Lecture 31 - Recursion Days 1-3",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-1-4-1-1",
                subtopicId: "sub-1-4-1",
                title: "What Happens on the Call Stack During Recursion?",
                order: 1,
                prerequisites: [],
                difficulty: "easy",
                learningObjectives: ["Trace call-stack growth and contraction", "Diagnose stack overflow causes"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-4-1-1"],
                learningUnits: []
              },
              {
                id: "mc-1-4-1-2",
                subtopicId: "sub-1-4-1",
                title: "Head vs Tail Recursion & Execution Direction",
                order: 2,
                prerequisites: ["mc-1-4-1-1"],
                difficulty: "easy",
                learningObjectives: ["Contrast work done on call (forward) vs work done on return (backward)", "Print 1 to N vs N to 1"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-4-1-2"],
                learningUnits: []
              }
            ]
          }
        ]
      },
      {
        id: "topic-1-5",
        stepId: "step-1",
        title: "Basic Hashing & Frequency Counting",
        order: 5,
        description: "Direct index frequency tables, ASCII hashing, hash collisions, and C++ std::map vs std::unordered_map.",
        subtopics: [
          {
            id: "sub-1-5-1",
            topicId: "topic-1-5",
            stepId: "step-1",
            title: "Direct Address Tables vs Hash Maps",
            order: 1,
            prerequisites: ["sub-1-1-1", "sub-1-1-3"],
            difficulty: "easy",
            description: "Using array index as key, character frequency mapping with 26/256 buckets, std::map vs unordered_map trade-offs.",
            status: "published",
            striverSheetMapping: "Step 1.6 - Learn Basic Hashing",
            loveBabbarSheetMapping: "Lecture 78 - Hashmaps in C++",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-1-5-1-1",
                subtopicId: "sub-1-5-1",
                title: "Character Hashing via ASCII Offset ('c' - 'a')",
                order: 1,
                prerequisites: [],
                difficulty: "beginner",
                learningObjectives: ["Convert lowercase English letters to indices 0..25", "Execute O(1) frequency increments"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-5-1-1"],
                learningUnits: []
              },
              {
                id: "mc-1-5-1-2",
                subtopicId: "sub-1-5-1",
                title: "Ordered Map O(log N) vs Unordered Map Average O(1)",
                order: 2,
                prerequisites: ["mc-1-5-1-1"],
                difficulty: "easy",
                learningObjectives: ["Compare Red-Black Tree vs Hash Table buckets", "Identify worst-case O(N) hash collisions"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-1-5-1-2"],
                learningUnits: []
              }
            ]
          }
        ]
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 2: IMPORTANT SORTING TECHNIQUES
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "step-2",
    stepNumber: 2,
    title: "Step 2: Learn Important Sorting Techniques",
    shortTitle: "Sorting Algorithms",
    icon: "🔄",
    description: "Comparisons, swaps, stability, in-place partitions, divide-and-conquer, and recursion in Merge & Quick Sort.",
    prerequisiteStepIds: ["step-1"],
    topics: [
      {
        id: "topic-2-1",
        stepId: "step-2",
        title: "Elementary Comparison Sorts",
        order: 1,
        description: "Selection Sort, Bubble Sort, and Insertion Sort: invariants, stability, and adaptive behaviors.",
        subtopics: [
          {
            id: "sub-2-1-1",
            topicId: "topic-2-1",
            stepId: "step-2",
            title: "Selection Sort: Finding the Global Minimum",
            order: 1,
            prerequisites: ["sub-1-1-3"],
            difficulty: "easy",
            description: "Sorted prefix expansion, repeatedly finding minimum of unsorted suffix, swap count analysis, instability.",
            status: "published",
            striverSheetMapping: "Step 2.1 - Selection Sort",
            loveBabbarSheetMapping: "Lecture 16 - Selection Sort",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-2-1-1-1",
                subtopicId: "sub-2-1-1",
                title: "Sorted Prefix vs Unsorted Suffix Invariant",
                order: 1,
                prerequisites: [],
                difficulty: "easy",
                learningObjectives: ["Maintain the invariant that arr[0..i-1] is sorted and <= arr[i..N-1]", "Count exact comparison steps"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: [],
                learningUnits: []
              }
            ]
          },
          {
            id: "sub-2-1-2",
            topicId: "topic-2-1",
            stepId: "step-2",
            title: "Bubble Sort: Adjacent Swapping & Early Exit",
            order: 2,
            prerequisites: ["sub-1-1-3"],
            difficulty: "easy",
            description: "Bubbling maximum element to the right, stability invariant, early termination optimization when zero swaps occur.",
            status: "published",
            striverSheetMapping: "Step 2.1 - Bubble Sort",
            loveBabbarSheetMapping: "Lecture 17 - Bubble Sort",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-2-1-2-1",
                subtopicId: "sub-2-1-2",
                title: "The Adjacent Inversion Swap Principle",
                order: 1,
                prerequisites: [],
                difficulty: "easy",
                learningObjectives: ["Explain why adjacent swapping guarantees stability", "Achieve best-case O(N) with swap flag"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: [],
                learningUnits: []
              }
            ]
          },
          {
            id: "sub-2-1-3",
            topicId: "topic-2-1",
            stepId: "step-2",
            title: "Insertion Sort: Card-Hand Insertion",
            order: 3,
            prerequisites: ["sub-1-1-3"],
            difficulty: "easy",
            description: "Shifting elements to create a gap, online sorting properties, adaptive performance on nearly sorted data.",
            status: "published",
            striverSheetMapping: "Step 2.1 - Insertion Sort",
            loveBabbarSheetMapping: "Lecture 18 - Insertion Sort",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-2-1-3-1",
                subtopicId: "sub-2-1-3",
                title: "Insertion into Sorted Subarray by Shifting",
                order: 1,
                prerequisites: [],
                difficulty: "easy",
                learningObjectives: ["Contrast element shifting with swap operations", "Explain why Insertion Sort is preferred for small N"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: [],
                learningUnits: []
              }
            ]
          }
        ]
      },
      {
        id: "topic-2-2",
        stepId: "step-2",
        title: "Divide-and-Conquer Sorting Algorithms",
        order: 2,
        description: "Merge Sort and Quick Sort: recursion tree analysis, auxiliary buffer cost, and partitioning invariants.",
        subtopics: [
          {
            id: "sub-2-2-1",
            topicId: "topic-2-2",
            stepId: "step-2",
            title: "Merge Sort: Divide, Conquer & Two-Finger Merge",
            order: 1,
            prerequisites: ["sub-1-4-1"],
            difficulty: "medium",
            description: "Binary division of array, post-order recursive merging, auxiliary space O(N), guaranteed O(N log N) runtime.",
            status: "published",
            striverSheetMapping: "Step 2.2 - Merge Sort",
            loveBabbarSheetMapping: "Lecture 35 - Merge Sort using Recursion",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-2-2-1-1",
                subtopicId: "sub-2-2-1",
                title: "Two-Finger Merge Algorithm & Auxiliary Array",
                order: 1,
                prerequisites: [],
                difficulty: "medium",
                learningObjectives: ["Merge two sorted arrays in O(N) time", "Prove why standard Merge Sort requires O(N) auxiliary space"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-2-2-1-1"],
                learningUnits: []
              }
            ]
          },
          {
            id: "sub-2-2-2",
            topicId: "topic-2-2",
            stepId: "step-2",
            title: "Quick Sort: Partitioning & Pivot Placement",
            order: 2,
            prerequisites: ["sub-1-4-1"],
            difficulty: "medium",
            description: "Lomuto versus Hoare partitioning, placing pivot in exact final sorted index, worst case O(N^2) prevention via randomized pivot.",
            status: "published",
            striverSheetMapping: "Step 2.2 - Quick Sort",
            loveBabbarSheetMapping: "Lecture 36 - Quick Sort using Recursion",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-2-2-2-1",
                subtopicId: "sub-2-2-2",
                title: "Partitioning Invariant: Smaller to Left, Greater to Right",
                order: 1,
                prerequisites: [],
                difficulty: "medium",
                learningObjectives: ["Implement partition without extra space", "Explain why Quick Sort is unstable"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-2-2-2-1"],
                learningUnits: []
              }
            ]
          }
        ]
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 3: PROBLEMS ON ARRAYS
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "step-3",
    stepNumber: 3,
    title: "Step 3: Solve Problems on Arrays",
    shortTitle: "Arrays (Easy/Med/Hard)",
    icon: "📊",
    description: "Contiguous memory, Kadane's algorithm, Dutch National Flag, Moore's voting, two-pointer sweeps, and 2D matrix transformations.",
    prerequisiteStepIds: ["step-1", "step-2"],
    topics: [
      {
        id: "topic-3-1",
        stepId: "step-3",
        title: "Array Fundamentals & Linear Scans",
        order: 1,
        description: "Contiguous layout, cache lines, in-place rotations, and deduplication.",
        subtopics: [
          {
            id: "sub-3-1-1",
            topicId: "topic-3-1",
            stepId: "step-3",
            title: "Contiguous Memory Addressing & Cache Locality",
            order: 1,
            prerequisites: ["sub-1-1-1"],
            difficulty: "easy",
            description: "Why O(1) random access works: base + i * sizeOf(T), hardware cache line prefetching, vector growth amortized O(1).",
            status: "published",
            striverSheetMapping: "Step 3.1 - Easy Array Problems",
            loveBabbarSheetMapping: "Lecture 9 - Introduction to Arrays",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-3-1-1-1",
                subtopicId: "sub-3-1-1",
                title: "Memory Index Formula & O(1) Access Proof",
                order: 1,
                prerequisites: [],
                difficulty: "beginner",
                learningObjectives: ["Derive physical memory address from zero-based index", "Understand spatial locality in CPU caches"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: [],
                learningUnits: []
              }
            ]
          },
          {
            id: "sub-3-1-2",
            topicId: "topic-3-1",
            stepId: "step-3",
            title: "Two-Pointer In-Place Deduplication & Rotations",
            order: 2,
            prerequisites: ["sub-3-1-1"],
            difficulty: "easy",
            description: "Slow/fast pointer deduplication on sorted array, array reversal trick for rotating by K places in O(N) time and O(1) space.",
            status: "published",
            striverSheetMapping: "Step 3.1 - Remove Duplicates & Left Rotate",
            loveBabbarSheetMapping: "Lecture 20 - Array Questions (Reverse, Merge)",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-3-1-2-1",
                subtopicId: "sub-3-1-2",
                title: "Slow-Fast Pointer Placement Invariant",
                order: 1,
                prerequisites: [],
                difficulty: "easy",
                learningObjectives: ["Keep unique elements at arr[0..slow]", "Update slow only on distinct value encounter"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: [],
                learningUnits: []
              },
              {
                id: "mc-3-1-2-2",
                subtopicId: "sub-3-1-2",
                title: "The 3-Reversal Array Rotation Algorithm",
                order: 2,
                prerequisites: ["mc-3-1-2-1"],
                difficulty: "easy",
                learningObjectives: ["Reverse first K, reverse remaining N-K, reverse entire array", "Prove correctness mathematically"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: [],
                learningUnits: []
              }
            ]
          }
        ]
      },
      {
        id: "topic-3-2",
        stepId: "step-3",
        title: "Medium Array Patterns & Signature Algorithms",
        order: 2,
        description: "Kadane's Algorithm, Dutch National Flag, Moore's Voting, 2-Sum, Next Permutation, and Matrix Rotations.",
        subtopics: [
          {
            id: "sub-3-2-1",
            topicId: "topic-3-2",
            stepId: "step-3",
            title: "Kadane's Algorithm for Maximum Subarray Sum",
            order: 1,
            prerequisites: ["sub-3-1-1"],
            difficulty: "medium",
            description: "Local maximum vs global maximum, discarding negative running sums, tracking subarray start/end indices, all-negative input handling.",
            status: "published",
            striverSheetMapping: "Step 3.2 - Kadane's Algorithm",
            loveBabbarSheetMapping: "Lecture 21 - Array Questions (Rotate, Kadane)",
            practiceProblemRefs: ["painter-s-partition-problem"],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-3-2-1-1",
                subtopicId: "sub-3-2-1",
                title: "Contiguous Subarray vs Subsequence vs Subset",
                order: 1,
                prerequisites: [],
                difficulty: "easy",
                learningObjectives: ["Distinguish contiguous elements from non-contiguous selections", "Calculate total subarrays N*(N+1)/2"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-3-2-1-1"],
                learningUnits: []
              },
              {
                id: "mc-3-2-1-2",
                subtopicId: "sub-3-2-1",
                title: "The Reset-to-Zero Invariant (Negative Baggage)",
                order: 2,
                prerequisites: ["mc-3-2-1-1"],
                difficulty: "medium",
                learningObjectives: ["Prove why runningSum < 0 can never contribute to a future maximum", "Maintain globalMax = max(globalMax, runningSum)"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-3-2-1-2"],
                learningUnits: []
              },
              {
                id: "mc-3-2-1-3",
                subtopicId: "sub-3-2-1",
                title: "Handling All-Negative Arrays without Returning 0",
                order: 3,
                prerequisites: ["mc-3-2-1-2"],
                difficulty: "medium",
                learningObjectives: ["Initialize maxSoFar to INT_MIN instead of 0", "Differentiate empty subarray allowance from non-empty constraint"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-3-2-1-3"],
                learningUnits: []
              }
            ]
          },
          {
            id: "sub-3-2-2",
            topicId: "topic-3-2",
            stepId: "step-3",
            title: "Dutch National Flag Algorithm (Sort 0s, 1s, 2s)",
            order: 2,
            prerequisites: ["sub-3-1-2"],
            difficulty: "medium",
            description: "3-way partitioning using low, mid, and high pointers, maintaining 4 regions in a single pass.",
            status: "published",
            striverSheetMapping: "Step 3.2 - Sort an array of 0s, 1s and 2s",
            loveBabbarSheetMapping: "Lecture 20 - Sort 0 1 2",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-3-2-2-1",
                subtopicId: "sub-3-2-2",
                title: "The 4-Region Invariant: [0..low-1], [low..mid-1], [mid..high], [high+1..N-1]",
                order: 1,
                prerequisites: [],
                difficulty: "medium",
                learningObjectives: ["Maintain strict partition invariants", "Explain why mid does not increment when swapping with high"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-3-2-2-1"],
                learningUnits: []
              }
            ]
          },
          {
            id: "sub-3-2-3",
            topicId: "topic-3-2",
            stepId: "step-3",
            title: "Moore's Voting Algorithm (Majority Element > N/2)",
            order: 3,
            prerequisites: ["sub-3-1-1"],
            difficulty: "medium",
            description: "Pairwise element cancellation, maintaining candidate and count invariant, necessity of the second verification pass.",
            status: "published",
            striverSheetMapping: "Step 3.2 - Majority Element (>n/2 times)",
            loveBabbarSheetMapping: "Lecture 21 - Majority Element",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-3-2-3-1",
                subtopicId: "sub-3-2-3",
                title: "The Cancellation Principle of Majority Items",
                order: 1,
                prerequisites: [],
                difficulty: "medium",
                learningObjectives: ["Prove that a candidate with freq > N/2 will survive pairwise cancellations", "Explain why verification pass is mandatory"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-3-2-3-1"],
                learningUnits: []
              }
            ]
          }
        ]
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 4: BINARY SEARCH
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "step-4",
    stepNumber: 4,
    title: "Step 4: Binary Search",
    shortTitle: "Binary Search",
    icon: "🎯",
    description: "Sortedness, search space halving, lower/upper bound, rotated array search, BS on answer space, Painter's Partition, and 2D matrix search.",
    prerequisiteStepIds: ["step-1", "step-3"],
    topics: [
      {
        id: "topic-4-1",
        stepId: "step-4",
        title: "Binary Search on 1D Arrays",
        order: 1,
        description: "Monotonicity condition, overflow-safe midpoint, termination invariants, and boundary bounds.",
        subtopics: [
          {
            id: "sub-4-1-1",
            topicId: "topic-4-1",
            stepId: "step-4",
            title: "Search Space Reduction & Invariant Termination",
            order: 1,
            prerequisites: ["sub-1-1-3"],
            difficulty: "easy",
            description: "Why low <= high works, overflow-safe midpoint calculation, eliminating half the search space per iteration.",
            status: "published",
            striverSheetMapping: "Step 4.1 - Binary Search to find X in sorted array",
            loveBabbarSheetMapping: "Lecture 12 - Binary Search Explained",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-4-1-1-1",
                subtopicId: "sub-4-1-1",
                title: "The Monotonicity Property: When Does BS Apply?",
                order: 1,
                prerequisites: [],
                difficulty: "easy",
                learningObjectives: ["Identify monotonicity in input or answer space", "Explain why unsorted data invalidates BS"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-4-1-1-1"],
                learningUnits: []
              },
              {
                id: "mc-4-1-1-2",
                subtopicId: "sub-4-1-1",
                title: "Preventing Integer Overflow in Midpoint: low + (high - low)/2",
                order: 2,
                prerequisites: ["mc-4-1-1-1"],
                difficulty: "beginner",
                learningObjectives: ["Show how (low + high) / 2 overflows when sum > 2^31 - 1", "Verify algebraic equivalence of safe formula"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-4-1-1-2"],
                learningUnits: []
              }
            ]
          },
          {
            id: "sub-4-1-2",
            topicId: "topic-4-1",
            stepId: "step-4",
            title: "Lower Bound, Upper Bound & Search Range",
            order: 2,
            prerequisites: ["sub-4-1-1"],
            difficulty: "easy",
            description: "Lower bound (smallest index with val >= X), upper bound (smallest index with val > X), finding first and last occurrence.",
            status: "published",
            striverSheetMapping: "Step 4.1 - Lower Bound & Upper Bound",
            loveBabbarSheetMapping: "Lecture 13 - First and Last Position of an Element",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-4-1-2-1",
                subtopicId: "sub-4-1-2",
                title: "Lower Bound Invariant: ans = mid, high = mid - 1",
                order: 1,
                prerequisites: [],
                difficulty: "easy",
                learningObjectives: ["Differentiate lower bound from exact equality search", "Handle target not found (returns N)"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: [],
                learningUnits: []
              }
            ]
          }
        ]
      },
      {
        id: "topic-4-2",
        stepId: "step-4",
        title: "Binary Search on Answer Space (Minimax)",
        order: 2,
        description: "Transforming optimization problems into decision problems using monotonic boolean predicates.",
        subtopics: [
          {
            id: "sub-4-2-1",
            topicId: "topic-4-2",
            stepId: "step-4",
            title: "Monotonic Predicate Function & Answer Range",
            order: 1,
            prerequisites: ["sub-4-1-1"],
            difficulty: "medium",
            description: "Formulating isPossible(mid) feasibility function, setting lower bound = max(arr) and upper bound = sum(arr).",
            status: "published",
            striverSheetMapping: "Step 4.2 - Painter's Partition / Book Allocation",
            loveBabbarSheetMapping: "Lecture 15 - Book Allocation Problem / Painter's Partition",
            practiceProblemRefs: ["painter-s-partition-problem"],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-4-2-1-1",
                subtopicId: "sub-4-2-1",
                title: "The Boolean Monotonic Sequence: [F, F, ..., T, T]",
                order: 1,
                prerequisites: [],
                difficulty: "medium",
                learningObjectives: ["Prove that feasibility function is monotonic", "Identify transition boundary where answer lies"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-4-2-1-1"],
                learningUnits: []
              },
              {
                id: "mc-4-2-1-2",
                subtopicId: "sub-4-2-1",
                title: "Painter's Partition / Book Allocation Invariant",
                order: 2,
                prerequisites: ["mc-4-2-1-1"],
                difficulty: "medium",
                learningObjectives: ["Set low = max(boards) because no painter can paint less than largest board", "Set high = sum(boards)"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-4-2-1-2"],
                learningUnits: []
              }
            ]
          }
        ]
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 5: STRINGS (BASIC AND MEDIUM)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "step-5",
    stepNumber: 5,
    title: "Step 5: Strings (Basic and Medium)",
    shortTitle: "Strings & Encodings",
    icon: "🔤",
    description: "Character representations, ASCII, palindrome verification, anagrams, Roman numerals, and sliding window string patterns.",
    prerequisiteStepIds: ["step-1", "step-3"],
    topics: [
      {
        id: "topic-5-1",
        stepId: "step-5",
        title: "String Representations & Conversions",
        order: 1,
        description: "Character encodings, mutable C++ strings versus immutable Python strings, and word reversing.",
        subtopics: [
          {
            id: "sub-5-1-1",
            topicId: "topic-5-1",
            stepId: "step-5",
            title: "Character Encodings & In-Place Reversal",
            order: 1,
            prerequisites: ["sub-1-1-1"],
            difficulty: "easy",
            description: "ASCII values, reversing words in a sentence, alphanumeric palindrome checks.",
            status: "published",
            striverSheetMapping: "Step 5.1 - Basic Strings",
            loveBabbarSheetMapping: "Lecture 22 - Character Arrays & Strings",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-5-1-1-1",
                subtopicId: "sub-5-1-1",
                title: "ASCII Table Offsets & Character Arithmetic",
                order: 1,
                prerequisites: [],
                difficulty: "beginner",
                learningObjectives: ["Map '0'..'9' to integers 0..9", "Convert case using ('A' + (c - 'a'))"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: [],
                learningUnits: []
              }
            ]
          }
        ]
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 6: LEARN LINKEDLIST
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "step-6",
    stepNumber: 6,
    title: "Step 6: Learn LinkedList",
    shortTitle: "Linked Lists",
    icon: "🔗",
    description: "Node pointers, singly & doubly linked lists, Floyd's cycle detection, slow-fast middle, and list reversals.",
    prerequisiteStepIds: ["step-1"],
    topics: [
      {
        id: "topic-6-1",
        stepId: "step-6",
        title: "Singly Linked List Mechanics",
        order: 1,
        description: "Node structure, dynamic heap allocation, head pointer, traversal, and pointer rewiring.",
        subtopics: [
          {
            id: "sub-6-1-1",
            topicId: "topic-6-1",
            stepId: "step-6",
            title: "Node Allocation & Pointer Rewiring Invariants",
            order: 1,
            prerequisites: ["sub-1-1-1"],
            difficulty: "easy",
            description: "Creating nodes with new, updating next pointers before deleting old nodes, dummy heads.",
            status: "published",
            striverSheetMapping: "Step 6.1 - Learn 1D LinkedList",
            loveBabbarSheetMapping: "Lecture 44 - Linked List Day 1 (Singly, Doubly)",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-6-1-1-1",
                subtopicId: "sub-6-1-1",
                title: "Pointer Loss Danger: Rewiring Order Invariant",
                order: 1,
                prerequisites: [],
                difficulty: "easy",
                learningObjectives: ["Avoid losing reference to rest of list when inserting at head or middle", "Use dummy node to eliminate edge cases"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-6-1-1-1"],
                learningUnits: []
              }
            ]
          },
          {
            id: "sub-6-1-2",
            topicId: "topic-6-1",
            stepId: "step-6",
            title: "Floyd's Tortoise & Hare Algorithm (Cycle Detection)",
            order: 2,
            prerequisites: ["sub-6-1-1"],
            difficulty: "medium",
            description: "Slow pointer 1-step, fast pointer 2-step, mathematical proof of cycle detection and entry point.",
            status: "published",
            striverSheetMapping: "Step 6.3 - Detect a loop in LL & Find starting point",
            loveBabbarSheetMapping: "Lecture 45 - Linked List Questions (Reverse, Middle, Loop)",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-6-1-2-1",
                subtopicId: "sub-6-1-2",
                title: "Relative Speed & Distance Closure Proof",
                order: 1,
                prerequisites: [],
                difficulty: "medium",
                learningObjectives: ["Prove that fast closes distance to slow by 1 node per iteration", "Derive why meeting point allows finding cycle start"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-6-1-2-1"],
                learningUnits: []
              }
            ]
          }
        ]
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 7: RECURSION & BACKTRACKING
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "step-7",
    stepNumber: 7,
    title: "Step 7: Recursion & Backtracking",
    shortTitle: "Recursion & Backtracking",
    icon: "🪜",
    description: "Decision trees, subset generation, combination sum, permutations, N-Queens, Sudoku solver, and state undoing.",
    prerequisiteStepIds: ["step-1"],
    topics: [
      {
        id: "topic-7-1",
        stepId: "step-7",
        title: "Subsets, Combinations & Choice Trees",
        order: 1,
        description: "Include/Exclude pattern, generating 2^N states, avoiding duplicate subsets via sorting.",
        subtopics: [
          {
            id: "sub-7-1-1",
            topicId: "topic-7-1",
            stepId: "step-7",
            title: "The Include / Exclude Pattern & Backtracking",
            order: 1,
            prerequisites: ["sub-1-4-1"],
            difficulty: "medium",
            description: "Branching choice tree, pushing to path, recursing, and popping to restore state.",
            status: "published",
            striverSheetMapping: "Step 7.1 & 7.2 - Subsequences & Combination Sum",
            loveBabbarSheetMapping: "Lecture 37 - Subsets and Subsequences of String",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-7-1-1-1",
                subtopicId: "sub-7-1-1",
                title: "The State Restoration Invariant (Undo Action)",
                order: 1,
                prerequisites: [],
                difficulty: "medium",
                learningObjectives: ["Ensure data structure is returned to exact prior state after recursive call", "Visualize 2^N decision tree"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-7-1-1-1"],
                learningUnits: []
              }
            ]
          }
        ]
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 8: BIT MANIPULATION
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "step-8",
    stepNumber: 8,
    title: "Step 8: Bit Manipulation",
    shortTitle: "Bit Manipulation",
    icon: "⚡",
    description: "Bitwise operators, masks, shifts, XOR properties, Single Number variations, and Brian Kernighan's algorithm.",
    prerequisiteStepIds: ["step-1"],
    topics: [
      {
        id: "topic-8-1",
        stepId: "step-8",
        title: "Bitwise Operators & Masking",
        order: 1,
        description: "Checking, setting, clearing bits, powers of 2, and XOR arithmetic.",
        subtopics: [
          {
            id: "sub-8-1-1",
            topicId: "topic-8-1",
            stepId: "step-8",
            title: "Bitmask Mechanics & Common Bit Tricks",
            order: 1,
            prerequisites: ["sub-1-1-1"],
            difficulty: "easy",
            description: "n & (n - 1) clears rightmost set bit, n & (-n) isolates lowest set bit, XOR self-inverse.",
            status: "published",
            striverSheetMapping: "Step 8.1 - Learn Bit Manipulation",
            loveBabbarSheetMapping: "Lecture 5 - Bitwise Operators & Precedence",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-8-1-1-1",
                subtopicId: "sub-8-1-1",
                title: "Why n & (n - 1) Clears the Lowest Set Bit",
                order: 1,
                prerequisites: [],
                difficulty: "easy",
                learningObjectives: ["Analyze bit transitions during subtraction by 1", "Implement O(1) power of 2 check"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-8-1-1-1"],
                learningUnits: []
              }
            ]
          }
        ]
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 9: STACK AND QUEUES
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "step-9",
    stepNumber: 9,
    title: "Step 9: Stack and Queues",
    shortTitle: "Stack & Queue",
    icon: "🥞",
    description: "LIFO & FIFO models, balanced parentheses, monotonic stack (Next Greater Element, Largest Rectangle), and LRU cache.",
    prerequisiteStepIds: ["step-1", "step-6"],
    topics: [
      {
        id: "topic-9-1",
        stepId: "step-9",
        title: "Monotonic Stacks & Queues",
        order: 1,
        description: "Maintaining strictly increasing or decreasing structures to solve next-greater and boundary problems in O(N).",
        subtopics: [
          {
            id: "sub-9-1-1",
            topicId: "topic-9-1",
            stepId: "step-9",
            title: "Next Greater Element & Monotonic Invariant",
            order: 1,
            prerequisites: ["sub-1-1-3"],
            difficulty: "medium",
            description: "Popping smaller elements while maintaining descending stack, amortized O(N) proof.",
            status: "published",
            striverSheetMapping: "Step 9.3 - Monotonic Stack/Queue Problems",
            loveBabbarSheetMapping: "Lecture 54 - Stack Implementation & Questions",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-9-1-1-1",
                subtopicId: "sub-9-1-1",
                title: "Amortized Analysis: Why Monotonic Stack is O(N) not O(N^2)",
                order: 1,
                prerequisites: [],
                difficulty: "medium",
                learningObjectives: ["Prove that each element is pushed once and popped at most once", "Maintain monotonic invariant during traversal"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-9-1-1-1"],
                learningUnits: []
              }
            ]
          }
        ]
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 10: SLIDING WINDOW AND TWO POINTER
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "step-10",
    stepNumber: 10,
    title: "Step 10: Sliding Window & Two Pointer",
    shortTitle: "Sliding Window",
    icon: "🪟",
    description: "Fixed and variable window boundaries, expansion/contraction invariants, and exact-K transformations.",
    prerequisiteStepIds: ["step-1", "step-3"],
    topics: [
      {
        id: "topic-10-1",
        stepId: "step-10",
        title: "Dynamic Window Sizing & Exact-K Transformation",
        order: 1,
        description: "Expanding right pointer to satisfy condition, shrinking left pointer on violation, exact(K) = atMost(K) - atMost(K-1).",
        subtopics: [
          {
            id: "sub-10-1-1",
            topicId: "topic-10-1",
            stepId: "step-10",
            title: "Variable Sliding Window Invariant",
            order: 1,
            prerequisites: ["sub-3-1-1"],
            difficulty: "medium",
            description: "Maintaining valid subsegment state, updating max length = R - L + 1.",
            status: "published",
            striverSheetMapping: "Step 10.1 & 10.2 - Sliding Window & Two Pointer",
            loveBabbarSheetMapping: "Lecture 20 & 21 - Two Pointer Questions",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-10-1-1-1",
                subtopicId: "sub-10-1-1",
                title: "The exact(K) = atMost(K) - atMost(K - 1) Principle",
                order: 1,
                prerequisites: [],
                difficulty: "medium",
                learningObjectives: ["Convert difficult exact equality counting into two monotonic at-most sliding windows", "Avoid O(N^2) restart"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-10-1-1-1"],
                learningUnits: []
              }
            ]
          }
        ]
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 11: HEAPS
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "step-11",
    stepNumber: 11,
    title: "Step 11: Heaps",
    shortTitle: "Heaps & Priority Queue",
    icon: "⛰️",
    description: "Complete binary trees in arrays, heapify in O(N), priority queues, Kth largest, and running median dual-heap design.",
    prerequisiteStepIds: ["step-1", "step-2"],
    topics: [
      {
        id: "topic-11-1",
        stepId: "step-11",
        title: "Heap Structure & Heapify Mathematics",
        order: 1,
        description: "Array indexing: parent (i-1)/2, children 2i+1 and 2i+2, sift-down, O(N) build heap proof.",
        subtopics: [
          {
            id: "sub-11-1-1",
            topicId: "topic-11-1",
            stepId: "step-11",
            title: "Array Representation & O(N) Build Heap Proof",
            order: 1,
            prerequisites: ["sub-1-1-5"],
            difficulty: "medium",
            description: "Why building a heap is O(N) instead of O(N log N) using height summation series.",
            status: "published",
            striverSheetMapping: "Step 11.1 - Learning Heaps",
            loveBabbarSheetMapping: "Lecture 74 - Heaps in C++",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-11-1-1-1",
                subtopicId: "sub-11-1-1",
                title: "The Sum of Heights Proof for O(N) Heapify",
                order: 1,
                prerequisites: [],
                difficulty: "medium",
                learningObjectives: ["Calculate sum of h/2^h series as N approaches infinity", "Explain why bottom-up heapify outperforms top-down insert"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: [],
                learningUnits: []
              }
            ]
          }
        ]
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 12: GREEDY ALGORITHMS
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "step-12",
    stepNumber: 12,
    title: "Step 12: Greedy Algorithms",
    shortTitle: "Greedy Algorithms",
    icon: "🦊",
    description: "Greedy choice property, interval scheduling by finish time, fractional knapsack, and exchange argument proofs.",
    prerequisiteStepIds: ["step-1", "step-2"],
    topics: [
      {
        id: "topic-12-1",
        stepId: "step-12",
        title: "Greedy Choice Property & Interval Scheduling",
        order: 1,
        description: "Sorting by earliest finish time, proving safety of local decisions.",
        subtopics: [
          {
            id: "sub-12-1-1",
            topicId: "topic-12-1",
            stepId: "step-12",
            title: "Interval Scheduling & Earliest Finish Time Invariant",
            order: 1,
            prerequisites: ["sub-2-1-1"],
            difficulty: "easy",
            description: "Why sorting by finish time maximizes remaining available time for future meetings.",
            status: "published",
            striverSheetMapping: "Step 12.1 - Easy/Medium Greedy",
            loveBabbarSheetMapping: "Lecture 84 - Greedy Algorithms",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-12-1-1-1",
                subtopicId: "sub-12-1-1",
                title: "Exchange Argument: Why Earliest Finish Time is Optimal",
                order: 1,
                prerequisites: [],
                difficulty: "medium",
                learningObjectives: ["Use exchange argument to show greedy solution is at least as good as any optimal solution", "Identify counterexamples for sorting by start time or duration"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: [],
                learningUnits: []
              }
            ]
          }
        ]
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 13: BINARY TREES
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "step-13",
    stepNumber: 13,
    title: "Step 13: Binary Trees",
    shortTitle: "Binary Trees",
    icon: "🌳",
    description: "Root, leaf, height, traversals (In/Pre/Post/Level), LCA, diameter, maximum path sum, and vertical views.",
    prerequisiteStepIds: ["step-1", "step-6", "step-9"],
    topics: [
      {
        id: "topic-13-1",
        stepId: "step-13",
        title: "Tree Traversals & Invariant Properties",
        order: 1,
        description: "Recursive and iterative DFS traversals, queue-based BFS level order, height and diameter invariants.",
        subtopics: [
          {
            id: "sub-13-1-1",
            topicId: "topic-13-1",
            stepId: "step-13",
            title: "DFS Traversals: Preorder, Inorder & Postorder",
            order: 1,
            prerequisites: ["sub-1-4-1"],
            difficulty: "easy",
            description: "Root visit timing relative to subtrees, call-stack visualization.",
            status: "published",
            striverSheetMapping: "Step 13.1 - Traversals",
            loveBabbarSheetMapping: "Lecture 62 - Binary Trees Day 1",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-13-1-1-1",
                subtopicId: "sub-13-1-1",
                title: "The Inorder, Preorder, Postorder Traversal Order",
                order: 1,
                prerequisites: [],
                difficulty: "easy",
                learningObjectives: ["Identify exact node visit sequences", "Map recursive returns to post-order operations like height calculation"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: [],
                learningUnits: []
              }
            ]
          }
        ]
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 14: BINARY SEARCH TREES
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "step-14",
    stepNumber: 14,
    title: "Step 14: Binary Search Trees",
    shortTitle: "BST",
    icon: "🌲",
    description: "BST ordering invariant (Left < Root < Right), O(H) search, insertion, deletion with 2 children, validation, and BST iterator.",
    prerequisiteStepIds: ["step-4", "step-13"],
    topics: [
      {
        id: "topic-14-1",
        stepId: "step-14",
        title: "BST Invariants & Operations",
        order: 1,
        description: "Search, insertion, deletion, inorder traversal monotonicity, and range validation.",
        subtopics: [
          {
            id: "sub-14-1-1",
            topicId: "topic-14-1",
            stepId: "step-14",
            title: "BST Invariant & Range-Based Validation",
            order: 1,
            prerequisites: ["sub-13-1-1"],
            difficulty: "medium",
            description: "Why checking root->left < root is insufficient; passing valid range (min, max) down branches.",
            status: "published",
            striverSheetMapping: "Step 14.1 & 14.2 - Concepts & Practice",
            loveBabbarSheetMapping: "Lecture 69 - Binary Search Tree Day 1",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-14-1-1-1",
                subtopicId: "sub-14-1-1",
                title: "The Subtree Invariant: Why Local Checks Fail to Validate a BST",
                order: 1,
                prerequisites: [],
                difficulty: "medium",
                learningObjectives: ["Demonstrate false positives from purely local checks", "Pass (low, high) bounds to validate entire subtree"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-14-1-1-1"],
                learningUnits: []
              }
            ]
          }
        ]
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 15: GRAPHS
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "step-15",
    stepNumber: 15,
    title: "Step 15: Graphs",
    shortTitle: "Graphs (BFS/DFS)",
    icon: "🕸️",
    description: "Vertices, edges, representations, BFS, DFS, cycle detection, Topological Sort (Kahn's), Dijkstra, Bellman-Ford, and Disjoint Set Union (DSU).",
    prerequisiteStepIds: ["step-9", "step-11", "step-13"],
    topics: [
      {
        id: "topic-15-1",
        stepId: "step-15",
        title: "Graph Representations & Core Traversals",
        order: 1,
        description: "Adjacency list, BFS queue level-by-level exploration, DFS call stack, and cycle detection.",
        subtopics: [
          {
            id: "sub-15-1-1",
            topicId: "topic-15-1",
            stepId: "step-15",
            title: "Graph BFS / DFS & Cycle Detection",
            order: 1,
            prerequisites: ["sub-9-1-1"],
            difficulty: "medium",
            description: "Visited tracking to prevent infinite cycles, parent tracking for undirected cycles, recursion stack for directed cycles.",
            status: "published",
            striverSheetMapping: "Step 15.1 & 15.2 - Learning & BFS/DFS",
            loveBabbarSheetMapping: "Lecture 85 - Introduction to Graphs & BFS/DFS",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-15-1-1-1",
                subtopicId: "sub-15-1-1",
                title: "The Visited Array: Preventing Infinite Graph Cycling",
                order: 1,
                prerequisites: [],
                difficulty: "easy",
                learningObjectives: ["Mark visited on queue push in BFS to prevent duplicate additions", "Trace cycle detection with parent pointer"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-15-1-1-1"],
                learningUnits: []
              }
            ]
          }
        ]
      },
      {
        id: "topic-15-2",
        stepId: "step-15",
        title: "Shortest Paths & Disjoint Set Union",
        order: 2,
        description: "Dijkstra's priority queue relaxation, negative cycle awareness in Bellman-Ford, Union by rank & path compression in DSU.",
        subtopics: [
          {
            id: "sub-15-2-1",
            topicId: "topic-15-2",
            stepId: "step-15",
            title: "Dijkstra's Algorithm & Non-Negative Edge Invariant",
            order: 1,
            prerequisites: ["sub-11-1-1"],
            difficulty: "medium",
            description: "Greedy shortest path relaxation, why negative weights break Dijkstra, min-heap state.",
            status: "published",
            striverSheetMapping: "Step 15.4 - Shortest Path Algorithms",
            loveBabbarSheetMapping: "Lecture 89 - Dijkstra's Algorithm",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-15-2-1-1",
                subtopicId: "sub-15-2-1",
                title: "Edge Relaxation Invariant: dist[v] = min(dist[v], dist[u] + weight)",
                order: 1,
                prerequisites: [],
                difficulty: "medium",
                learningObjectives: ["Trace Dijkstra min-heap updates", "Demonstrate infinite negative cycle failure with negative edge weights"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-15-2-1-1"],
                learningUnits: []
              }
            ]
          }
        ]
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 16: DYNAMIC PROGRAMMING
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "step-16",
    stepNumber: 16,
    title: "Step 16: Dynamic Programming",
    shortTitle: "Dynamic Programming",
    icon: "🧩",
    description: "Overlapping subproblems, optimal substructure, memoization, tabulation, space optimization, grid DP, knapsack, LCS, LIS, and MCM.",
    prerequisiteStepIds: ["step-1", "step-3", "step-7"],
    topics: [
      {
        id: "topic-16-1",
        stepId: "step-16",
        title: "DP Foundations: Memoization to Tabulation",
        order: 1,
        description: "Converting recursion to top-down memoization, converting to bottom-up table, eliminating redundant state arrays.",
        subtopics: [
          {
            id: "sub-16-1-1",
            topicId: "topic-16-1",
            stepId: "step-16",
            title: "The 4-Step DP Formulation Pipeline",
            order: 1,
            prerequisites: ["sub-1-4-1"],
            difficulty: "medium",
            description: "1. Define state in terms of indices, 2. Express base cases, 3. Formulate recurrence relation, 4. Space-optimize.",
            status: "published",
            striverSheetMapping: "Step 16.1 - Introduction to DP",
            loveBabbarSheetMapping: "Lecture 102 - Dynamic Programming Introduction",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-16-1-1-1",
                subtopicId: "sub-16-1-1",
                title: "Overlapping Subproblems vs Independent Subproblems",
                order: 1,
                prerequisites: [],
                difficulty: "easy",
                learningObjectives: ["Contrast Merge Sort (independent) with Fibonacci (overlapping)", "Explain how caching reduces exponential to polynomial time"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-16-1-1-1"],
                learningUnits: []
              },
              {
                id: "mc-16-1-1-2",
                subtopicId: "sub-16-1-1",
                title: "Space Optimization: Rolling Previous States",
                order: 2,
                prerequisites: ["mc-16-1-1-1"],
                difficulty: "medium",
                learningObjectives: ["Replace O(N) array with prev1 and prev2 variables for O(1) space", "Replace O(M*N) 2D grid with two rows"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: [],
                learningUnits: []
              }
            ]
          }
        ]
      },
      {
        id: "topic-16-2",
        stepId: "step-16",
        title: "2D Grid DP & Subsequences (Knapsack / LCS)",
        order: 2,
        description: "Grid paths, pick/not-pick knapsack, Longest Common Subsequence match/mismatch transitions, and Edit Distance.",
        subtopics: [
          {
            id: "sub-16-2-1",
            topicId: "topic-16-2",
            stepId: "step-16",
            title: "Knapsack State Transitions & 1D Array Reversal",
            order: 1,
            prerequisites: ["sub-16-1-1"],
            difficulty: "medium",
            description: "0/1 Knapsack: why space optimization requires traversing right-to-left to prevent reusing items.",
            status: "published",
            striverSheetMapping: "Step 16.3 - DP on Subsequences",
            loveBabbarSheetMapping: "Lecture 105 - 0/1 Knapsack Problem",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-16-2-1-1",
                subtopicId: "sub-16-2-1",
                title: "The 1D Reverse Traversal Invariant in 0/1 Knapsack",
                order: 1,
                prerequisites: [],
                difficulty: "medium",
                learningObjectives: ["Prove that forward traversal in 1D knapsack turns 0/1 into Unbounded Knapsack", "Maintain single-use constraint via reverse update"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-16-2-1-1"],
                learningUnits: []
              }
            ]
          }
        ]
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 17: TRIES
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "step-17",
    stepNumber: 17,
    title: "Step 17: Tries",
    shortTitle: "Tries",
    icon: "🗂️",
    description: "Prefix trees, 26-ary children nodes, word termination markers, prefix lookup in O(L), distinct substrings, and bitwise maximum XOR.",
    prerequisiteStepIds: ["step-1", "step-8"],
    topics: [
      {
        id: "topic-17-1",
        stepId: "step-17",
        title: "Trie Architecture & Bitwise XOR Queries",
        order: 1,
        description: "Node links, insert, search, startsWith, and bitwise trie for maximum XOR in O(32 * N).",
        subtopics: [
          {
            id: "sub-17-1-1",
            topicId: "topic-17-1",
            stepId: "step-17",
            title: "Trie Node Architecture & Prefix Matching Invariant",
            order: 1,
            prerequisites: ["sub-1-1-1"],
            difficulty: "medium",
            description: "Children pointer arrays, isEndOfWord flags, O(L) prefix querying independent of dictionary size N.",
            status: "published",
            striverSheetMapping: "Step 17.1 - Theory and Implementation",
            loveBabbarSheetMapping: "Lecture 79 - Trie Implementation & Phone Directory",
            practiceProblemRefs: [],
            fearPoints: [],
            microConcepts: [
              {
                id: "mc-17-1-1-1",
                subtopicId: "sub-17-1-1",
                title: "The Prefix Sharing Invariant: Time Complexity Independent of N",
                order: 1,
                prerequisites: [],
                difficulty: "medium",
                learningObjectives: ["Explain why Trie lookup is O(length) instead of O(N * length)", "Manage memory allocation for sparse nodes"],
                status: "published",
                contentVersion: "1.0",
                coverageStatus: "covered",
                associatedMisconceptions: ["fp-17-1-1-1"],
                learningUnits: []
              }
            ]
          }
        ]
      }
    ]
  }
];

/**
 * Accessor methods for Curriculum Hierarchy
 */

export function getAllCurriculumSteps(): CurriculumStep[] {
  return FULL_CURRICULUM_STEPS;
}

export function getCurriculumStepById(stepId: string): CurriculumStep | undefined {
  return FULL_CURRICULUM_STEPS.find(s => s.id === stepId);
}

export function getCurriculumTopicById(topicId: string): CurriculumTopic | undefined {
  for (const step of FULL_CURRICULUM_STEPS) {
    const topic = step.topics.find(t => t.id === topicId);
    if (topic) return topic;
  }
  return undefined;
}

export function getCurriculumSubtopicById(subtopicId: string): CurriculumSubtopic | undefined {
  for (const step of FULL_CURRICULUM_STEPS) {
    for (const topic of step.topics) {
      const sub = topic.subtopics.find(s => s.id === subtopicId);
      if (sub) return sub;
    }
  }
  return undefined;
}

export function getCurriculumMicroConceptById(microConceptId: string): MicroConcept | undefined {
  for (const step of FULL_CURRICULUM_STEPS) {
    for (const topic of step.topics) {
      for (const sub of topic.subtopics) {
        const mc = sub.microConcepts.find(m => m.id === microConceptId);
        if (mc) return mc;
      }
    }
  }
  return undefined;
}

/**
 * Generates an exhaustive coverage statistics report.
 */
export function getCurriculumCoverageStats(): CurriculumCoverageStats {
  let totalTopics = 0;
  let totalSubtopics = 0;
  let totalMicroConcepts = 0;
  let totalFearPoints = 0;
  let totalLearningUnits = 0;

  const stepBreakdown = FULL_CURRICULUM_STEPS.map(step => {
    let stepSubtopics = 0;
    let stepMicroConcepts = 0;
    let stepFearPoints = 0;

    for (const topic of step.topics) {
      totalTopics++;
      stepSubtopics += topic.subtopics.length;
      totalSubtopics += topic.subtopics.length;

      for (const sub of topic.subtopics) {
        stepMicroConcepts += sub.microConcepts.length;
        totalMicroConcepts += sub.microConcepts.length;
        stepFearPoints += sub.fearPoints.length;
        totalFearPoints += sub.fearPoints.length;

        for (const mc of sub.microConcepts) {
          totalLearningUnits += mc.learningUnits.length;
        }
      }
    }

    return {
      stepNumber: step.stepNumber,
      stepId: step.id,
      stepTitle: step.title,
      topicsCount: step.topics.length,
      subtopicsCount: stepSubtopics,
      microConceptsCount: stepMicroConcepts,
      fearPointsCount: stepFearPoints
    };
  });

  return {
    totalSteps: FULL_CURRICULUM_STEPS.length,
    totalTopics,
    totalSubtopics,
    totalMicroConcepts,
    totalFearPoints,
    totalLearningUnits,
    stepBreakdown
  };
}
