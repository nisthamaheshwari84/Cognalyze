/**
 * COGNALYZE DSA LEARN — FEAR POINTS & MISCONCEPTION REGISTRY
 * Maps classical beginner traps, syntax confusions, visualization bottlenecks,
 * and false mathematical assumptions to precise remedial explanations and visuals.
 */

import { FearPoint } from "./curriculum-types";

export const FEAR_POINTS_REGISTRY: Record<string, FearPoint> = {
  // ── STEP 1 FEAR POINTS ──
  "fp-1-1-1-1": {
    fearPointId: "fp-1-1-1-1",
    subtopicId: "sub-1-1-1",
    microConceptId: "mc-1-1-1-1",
    title: "Variables as Static Labels vs Dynamic Memory Cells",
    difficultyReason: "Beginners imagine variables as mathematical constants rather than addressable memory buckets in RAM that change over time.",
    commonWrongAssumption: "Assuming `a = a + 1` is an algebraic equation stating a equals a + 1 (impossible in math) instead of an assignment operation.",
    correctExplanation: "The `=` operator in programming is assignment, not equality. The right-hand expression is computed first, and the resulting value is stored into the memory cell named `a`.",
    recommendedVisual: "Memory box diagram showing value 5 overwritten by 6.",
    verificationQuestionIds: ["vq-1-1-1-1"]
  },
  "fp-1-1-1-2": {
    fearPointId: "fp-1-1-1-2",
    subtopicId: "sub-1-1-1",
    microConceptId: "mc-1-1-1-2",
    title: "Integer Division Truncation vs Mathematical Real Division",
    difficultyReason: "In C++, 5 / 2 yields 2 instead of 2.5, causing silent bugs in mathematical formulas.",
    commonWrongAssumption: "Expecting `double x = 5 / 2;` to store 2.5.",
    correctExplanation: "Because both 5 and 2 are integers, integer division performs truncation towards zero before assignment. To get 2.5, at least one operand must be a floating-point type: `5.0 / 2` or `(double)5 / 2`.",
    recommendedVisual: "Number line showing fractional discard.",
    verificationQuestionIds: ["vq-1-1-1-2"]
  },
  "fp-1-1-1-3": {
    fearPointId: "fp-1-1-1-3",
    subtopicId: "sub-1-1-1",
    microConceptId: "mc-1-1-1-3",
    title: "32-bit Integer Overflow Wrapping into Negative Numbers",
    difficultyReason: "When adding to `2147483647`, the number suddenly turns into `-2147483648` without any warning or crash.",
    commonWrongAssumption: "Assuming computers will give an error when an integer gets too large.",
    correctExplanation: "Standard 32-bit signed integers use two's complement. Adding 1 to the maximum positive integer flips the sign bit to 1, which represents the most negative number. Always use `long long` when sums can exceed ~2*10^9.",
    recommendedVisual: "Circular clock visual showing wrap-around from max positive to min negative.",
    verificationQuestionIds: ["vq-1-1-1-3"]
  },
  "fp-1-1-2-1": {
    fearPointId: "fp-1-1-2-1",
    subtopicId: "sub-1-1-2",
    microConceptId: "mc-1-1-2-1",
    title: "Assignment (`=`) Accidental Use in Conditionals (`==`)",
    difficultyReason: "Writing `if (x = 5)` instead of `if (x == 5)` always evaluates to true and silently mutates `x`.",
    commonWrongAssumption: "Assuming `if (x = 5)` checks if x is equal to 5.",
    correctExplanation: "`=` assigns 5 to `x`, and the value of the assignment expression is 5. In C++, any non-zero integer is evaluated as boolean true, so the if-block always executes.",
    recommendedVisual: "Syntax comparison highlight: assignment vs equality test.",
    verificationQuestionIds: ["vq-1-1-2-1"]
  },
  "fp-1-1-2-2": {
    fearPointId: "fp-1-1-2-2",
    subtopicId: "sub-1-1-2",
    microConceptId: "mc-1-1-2-2",
    title: "Chained Relational Operators `a < b < c`",
    difficultyReason: "In mathematics, `1 < 2 < 3` and `3 > 2 > 1` are valid chain inequalities. In C++, they evaluate left-to-right as `(1 < 2) < 3` -> `1 < 3` -> true, but `3 > 2 > 1` -> `1 > 1` -> false!",
    commonWrongAssumption: "Assuming `a < b < c` tests whether b is strictly between a and c.",
    correctExplanation: "You must explicitly use logical AND: `(a < b) && (b < c)`. The chained syntax evaluates `(a < b)` to a boolean (0 or 1), which is then compared with `c`.",
    recommendedVisual: "Operator precedence step-by-step AST tree.",
    verificationQuestionIds: ["vq-1-1-2-2"]
  },
  "fp-1-1-2-3": {
    fearPointId: "fp-1-1-2-3",
    subtopicId: "sub-1-1-2",
    microConceptId: "mc-1-1-2-3",
    title: "Short-Circuit Guard Evaluation Order",
    difficultyReason: "Students write `if (arr[i] == target && i < n)` which crashes with segmentation fault on out-of-bounds.",
    commonWrongAssumption: "Assuming all parts of an if condition are evaluated simultaneously.",
    correctExplanation: "C++ logical AND `&&` evaluates left-to-right and immediately aborts if the left operand is false. You MUST put boundary guards first: `if (i < n && arr[i] == target)`.",
    recommendedVisual: "Timeline showing short-circuit early exit.",
    verificationQuestionIds: ["vq-1-1-2-3"]
  },
  "fp-1-1-3-1": {
    fearPointId: "fp-1-1-3-1",
    subtopicId: "sub-1-1-3",
    microConceptId: "mc-1-1-3-1",
    title: "The Semicolon After For/While Loop Header Trap",
    difficultyReason: "Writing `for (int i = 0; i < n; i++);` terminates the loop with an empty body.",
    commonWrongAssumption: "Assuming the indented block beneath the loop will execute n times.",
    correctExplanation: "A semicolon `;` immediately following `for(...)` or `while(...)` creates an empty loop body. The loop runs to completion doing nothing, and the subsequent block executes only once with `i == n`.",
    recommendedVisual: "AST showing empty statement bound to loop body.",
    verificationQuestionIds: ["vq-1-1-3-1"]
  },
  "fp-1-1-3-2": {
    fearPointId: "fp-1-1-3-2",
    subtopicId: "sub-1-1-3",
    microConceptId: "mc-1-1-3-2",
    title: "Off-by-One Array Boundary Indexing (`i <= n`)",
    difficultyReason: "Accessing `arr[n]` when an array has `n` elements (valid indices are `0` through `n - 1`).",
    commonWrongAssumption: "Assuming an array of size 5 includes index 5.",
    correctExplanation: "Array indexing is 0-based. An array of size N has indices 0, 1, 2, ..., N-1. Accessing `arr[N]` is undefined behavior (reads garbage or causes a segmentation fault). Loop condition must be `i < n`.",
    recommendedVisual: "Array indexing ruler showing bounds from 0 to N-1 and the illegal Nth cell.",
    verificationQuestionIds: ["vq-1-1-3-2"]
  },
  "fp-1-1-3-3": {
    fearPointId: "fp-1-1-3-3",
    subtopicId: "sub-1-1-3",
    microConceptId: "mc-1-1-3-3",
    title: "Inner Loop Variable Shadowing or Shared Counter",
    difficultyReason: "Accidentally using `i` instead of `j` in the inner loop, causing outer loop corruption or premature termination.",
    commonWrongAssumption: "Expecting nested loops to automatically isolate loop counters.",
    correctExplanation: "If the inner loop increments or mutates `i`, it directly disrupts the outer loop's progression. Always use distinct counter variables: `i` for outer, `j` for inner, `k` for innermost.",
    recommendedVisual: "Nested loop state matrix showing simultaneous i and j states.",
    verificationQuestionIds: ["vq-1-1-3-3"]
  },
  "fp-1-1-4-1": {
    fearPointId: "fp-1-1-4-1",
    subtopicId: "sub-1-1-4",
    microConceptId: "mc-1-1-4-1",
    title: "Returning Pointers to Local Stack Variables",
    difficultyReason: "Returning `&localVar` from a function produces a dangling pointer because the stack frame is destroyed upon return.",
    commonWrongAssumption: "Assuming local variables exist as long as something points to them.",
    correctExplanation: "Stack memory allocated for a function's local variables is deallocated when the function returns. Returning a pointer or reference to a local variable leads to undefined behavior. Use heap allocation (`new`) or return by value.",
    recommendedVisual: "Stack frame deallocation animation.",
    verificationQuestionIds: ["vq-1-1-4-1"]
  },
  "fp-1-1-4-2": {
    fearPointId: "fp-1-1-4-2",
    subtopicId: "sub-1-1-4",
    microConceptId: "mc-1-1-4-2",
    title: "Accidental Pass-by-Value Memory Duplication in Vectors",
    difficultyReason: "Writing `void solve(vector<int> nums)` creates a full copy of the vector on every call, turning an O(N) traversal into O(N^2) or causing TLE.",
    commonWrongAssumption: "Assuming C++ vectors automatically behave like references or pointers as in Java/Python.",
    correctExplanation: "In C++, non-primitive objects are passed by value by default, making an expensive deep copy. Always pass large structures by constant reference: `const vector<int>& nums` (read-only) or `vector<int>& nums` (mutating).",
    recommendedVisual: "Memory cloning diagram: shallow pointer vs deep array copy.",
    verificationQuestionIds: ["vq-1-1-4-2"]
  },
  "fp-1-1-5-1": {
    fearPointId: "fp-1-1-5-1",
    subtopicId: "sub-1-1-5",
    microConceptId: "mc-1-1-5-1",
    title: "Confusing Wall-Clock Milliseconds with Asymptotic Big-O",
    difficultyReason: "Students benchmark code on small test cases (N = 10) and conclude an O(N^2) algorithm is 'faster' than O(N log N) because of small constant factor.",
    commonWrongAssumption: "Believing algorithmic complexity is measured in milliseconds.",
    correctExplanation: "Big-O describes how resource requirements scale as input size N grows towards infinity. An O(N^2) algorithm with tiny constants will always be overtaken and crushed by an O(N log N) algorithm for sufficiently large N.",
    recommendedVisual: "Growth curve chart showing O(N^2) exploding past N = 10^4 while O(N log N) remains flat.",
    verificationQuestionIds: ["vq-1-1-5-1"]
  },
  "fp-1-1-5-2": {
    fearPointId: "fp-1-1-5-2",
    subtopicId: "sub-1-1-5",
    microConceptId: "mc-1-1-5-2",
    title: "Assuming Two Loops Always Mean O(N^2)",
    difficultyReason: "Seeing a while loop inside a for loop and immediately assuming O(N^2), failing to recognize two-pointer or sliding window amortized O(N).",
    commonWrongAssumption: "Any nested loop construct is O(N^2).",
    correctExplanation: "Complexity is determined by total operations, not visual nesting. In two-pointer sliding windows, the inner pointer only advances forward and never resets, so total steps across all outer loop iterations are at most 2N = O(N).",
    recommendedVisual: "Amortized traversal bar showing single pass of left and right pointers.",
    verificationQuestionIds: ["vq-1-1-5-2"]
  },
  "fp-1-1-5-3": {
    fearPointId: "fp-1-1-5-3",
    subtopicId: "sub-1-1-5",
    microConceptId: "mc-1-1-5-3",
    title: "Ignoring Call-Stack Memory in Recursive Space Complexity",
    difficultyReason: "Claiming a recursive function uses O(1) space because it allocates no arrays, ignoring the call stack depth.",
    commonWrongAssumption: "Space complexity only accounts for heap or explicit auxiliary variables.",
    correctExplanation: "Every recursive call allocates an activation frame on the call stack. A recursion of depth N consumes O(N) stack memory, which can trigger stack overflow if N >= 10^5.",
    recommendedVisual: "Call stack tower visualizing recursive stack growth.",
    verificationQuestionIds: ["vq-1-1-5-3"]
  },

  // ── STEP 1.3 MATHS FEAR POINTS ──
  "fp-1-3-1-1": {
    fearPointId: "fp-1-3-1-1",
    subtopicId: "sub-1-3-1",
    microConceptId: "mc-1-3-1-1",
    title: "Negative Number Modulo Traps in C++",
    difficultyReason: "In C++, `-7 % 10` returns `-7`, not `3` (as in Python or mathematical modulo).",
    commonWrongAssumption: "Assuming `n % 10` always extracts a positive single-digit remainder.",
    correctExplanation: "In C++, `%` is the remainder operator, not mathematical modulo. Its result retains the sign of the dividend. To safely extract digits from negative numbers, take `abs(n)` first or use `((n % 10) + 10) % 10`.",
    recommendedVisual: "Modulo comparison table: C++ vs Python vs Mathematics.",
    verificationQuestionIds: ["vq-1-3-1-1"]
  },
  "fp-1-3-1-2": {
    fearPointId: "fp-1-3-1-2",
    subtopicId: "sub-1-3-1",
    microConceptId: "mc-1-3-1-2",
    title: "The Zero Digit Edge Case (`n = 0`)",
    difficultyReason: "A while loop `while (n > 0) { count++; n /= 10; }` produces `count = 0` when `n = 0`, but the number 0 has 1 digit!",
    commonWrongAssumption: "Assuming standard digit counting loop handles 0 naturally.",
    correctExplanation: "Input 0 does not enter a `while (n > 0)` loop. An explicit check `if (n == 0) return 1;` is mandatory, or use a `do-while` loop which executes the body at least once.",
    recommendedVisual: "Control flow diagram comparing while vs do-while for n = 0.",
    verificationQuestionIds: ["vq-1-3-1-2"]
  },
  "fp-1-3-2-1": {
    fearPointId: "fp-1-3-2-1",
    subtopicId: "sub-1-3-2",
    microConceptId: "mc-1-3-2-1",
    title: "Duplicate Counting of Perfect Square Factors",
    difficultyReason: "In `for (int i = 1; i * i <= n; i++)`, when `i * i == n` (e.g. 6*6 = 36), adding both `i` and `n / i` counts 6 twice.",
    commonWrongAssumption: "Assuming all factor pairs are distinct.",
    correctExplanation: "When `i == n / i`, the factor is the square root and appears only once. You must check `if (i != n / i)` before recording the complementary factor.",
    recommendedVisual: "Pair rectangle diagram for 36: (1,36), (2,18), (3,12), (4,9), and the square (6,6).",
    verificationQuestionIds: ["vq-1-3-2-1"]
  },

  // ── STEP 1.4 RECURSION FEAR POINTS ──
  "fp-1-4-1-1": {
    fearPointId: "fp-1-4-1-1",
    subtopicId: "sub-1-4-1",
    microConceptId: "mc-1-4-1-1",
    title: "Missing Base Case Causing Stack Overflow Segmentation Fault",
    difficultyReason: "Recursion without a reachable base case runs indefinitely until the OS stack memory (~8MB) is exhausted.",
    commonWrongAssumption: "Expecting the program to freeze or loop, rather than immediately crashing with SIGSEGV.",
    correctExplanation: "Every call frame takes stack memory. Without a base case, recursion runs until physical stack memory limits are breached. The base case must always be the very first check in the recursive function.",
    recommendedVisual: "Stack memory filling up until red overflow line.",
    verificationQuestionIds: ["vq-1-4-1-1"]
  },
  "fp-1-4-1-2": {
    fearPointId: "fp-1-4-1-2",
    subtopicId: "sub-1-4-1",
    microConceptId: "mc-1-4-1-2",
    title: "Post-Call Execution Amnesia (Returning from Recursion)",
    difficultyReason: "Students fail to realize that code AFTER the recursive call executes in reverse order as the call stack unwinds.",
    commonWrongAssumption: "Assuming a function ends when it makes a recursive call.",
    correctExplanation: "When a recursive call is made, the current function pauses its execution right there. Once the recursive call returns, execution resumes on the very next line in that suspended frame.",
    recommendedVisual: "Step-by-step call stack unwinding diagram.",
    verificationQuestionIds: ["vq-1-4-1-2"]
  },

  // ── STEP 1.5 HASHING FEAR POINTS ──
  "fp-1-5-1-1": {
    fearPointId: "fp-1-5-1-1",
    subtopicId: "sub-1-5-1",
    microConceptId: "mc-1-5-1-1",
    title: "Direct Array Hashing with Large or Negative Numbers",
    difficultyReason: "Attempting `hash[arr[i]]++` when `arr[i] = 10^9` or `arr[i] = -5` causes compilation failure or segmentation fault.",
    commonWrongAssumption: "Assuming array indices can be negative or arbitrarily large up to 10^9.",
    correctExplanation: "Arrays only support non-negative indices bounded by allocated memory (typically <= 10^7 in global scope). For negative numbers or sparse large values, use `std::unordered_map` or offset coordinate shifting.",
    recommendedVisual: "Memory allocation boundary comparison: array vs hash map buckets.",
    verificationQuestionIds: ["vq-1-5-1-1"]
  },
  "fp-1-5-1-2": {
    fearPointId: "fp-1-5-1-2",
    subtopicId: "sub-1-5-1",
    microConceptId: "mc-1-5-1-2",
    title: "The O(N) Worst Case Collision Vulnerability of std::unordered_map",
    difficultyReason: "Students believe `unordered_map` is ALWAYS O(1), but hostile anti-hash test cases can force all keys into a single bucket, causing O(N^2) TLE.",
    commonWrongAssumption: "Unordered map has guaranteed O(1) time complexity.",
    correctExplanation: "Average time is O(1), but worst-case time is O(N) if collisions occur. In competitive programming, custom hash functors (e.g. splitmix64) or `std::map` (guaranteed O(log N)) prevent targeted collision attacks.",
    recommendedVisual: "Hash bucket collision chaining visualization.",
    verificationQuestionIds: ["vq-1-5-1-2"]
  },

  // ── STEP 2 SORTING FEAR POINTS ──
  "fp-2-2-1-1": {
    fearPointId: "fp-2-2-1-1",
    subtopicId: "sub-2-2-1",
    microConceptId: "mc-2-2-1-1",
    title: "Merge Sort Index Offsets: Mid vs High vs Low",
    difficultyReason: "Off-by-one errors in merge bounds `(low, mid)` and `(mid + 1, high)` leading to infinite recursion or missed elements.",
    commonWrongAssumption: "Dividing as `(low, mid - 1)` and `(mid, high)` which fails on 2-element arrays.",
    correctExplanation: "Standard partition is `mid = low + (high - low) / 2`, followed by `mergeSort(low, mid)` and `mergeSort(mid + 1, high)`. The base case is `low >= high`.",
    recommendedVisual: "Divide-and-conquer binary tree showing base case bounds.",
    verificationQuestionIds: ["vq-2-2-1-1"]
  },
  "fp-2-2-2-1": {
    fearPointId: "fp-2-2-2-1",
    subtopicId: "sub-2-2-2",
    microConceptId: "mc-2-2-2-1",
    title: "Quick Sort Worst Case on Already Sorted Arrays",
    difficultyReason: "Picking first or last element as pivot on an already sorted array yields unbalanced partitions of size 1 and N-1, causing O(N^2) runtime.",
    commonWrongAssumption: "Assuming Quick Sort is always faster than Merge Sort.",
    correctExplanation: "Without randomized pivot selection or median-of-three, already sorted or identical-element inputs trigger O(N^2) worst case. Randomized pivot ensures average O(N log N) with high probability.",
    recommendedVisual: "Degenerate linear Quick Sort recursion tree vs balanced binary tree.",
    verificationQuestionIds: ["vq-2-2-2-1"]
  },

  // ── STEP 3 ARRAYS FEAR POINTS ──
  "fp-3-2-1-1": {
    fearPointId: "fp-3-2-1-1",
    subtopicId: "sub-3-2-1",
    microConceptId: "mc-3-2-1-1",
    title: "Subarray vs Subsequence vs Subset Confusion",
    difficultyReason: "Students confuse contiguous subarrays with non-contiguous subsequences.",
    commonWrongAssumption: "Thinking `[1, 3]` is a subarray of `[1, 2, 3, 4]`.",
    correctExplanation: "A **subarray** must be contiguous (consecutive elements). A **subsequence** maintains relative order but can skip elements. A **subset** is any unordered collection of elements.",
    recommendedVisual: "Visual Venn diagram / array slicing comparison.",
    verificationQuestionIds: ["vq-3-2-1-1"]
  },
  "fp-3-2-1-2": {
    fearPointId: "fp-3-2-1-2",
    subtopicId: "sub-3-2-1",
    microConceptId: "mc-3-2-1-2",
    title: "Kadane's Algorithm Negative Reset Timing",
    difficultyReason: "Resetting `runningSum = 0` BEFORE updating `maxSum`, causing all-negative arrays to fail.",
    commonWrongAssumption: "Assuming `runningSum` should be reset before comparing with `maxSum`.",
    correctExplanation: "You must FIRST update `maxSum = max(maxSum, runningSum)`, and THEN if `runningSum < 0`, reset `runningSum = 0`. Otherwise, an array like `[-3, -2, -5]` incorrectly returns 0 instead of -2.",
    recommendedVisual: "Timeline showing running sum update vs reset sequence.",
    verificationQuestionIds: ["vq-3-2-1-2"]
  },
  "fp-3-2-1-3": {
    fearPointId: "fp-3-2-1-3",
    subtopicId: "sub-3-2-1",
    microConceptId: "mc-3-2-1-3",
    title: "Initializing `maxSum = 0` instead of `INT_MIN` in Kadane's",
    difficultyReason: "When all array elements are negative (e.g. `[-5, -1, -8]`), initializing `maxSum = 0` outputs 0, which does not exist in the array.",
    commonWrongAssumption: "Assuming a sum can never be less than 0.",
    correctExplanation: "Unless an empty subarray is explicitly permitted, `maxSum` must be initialized to `INT_MIN` or `arr[0]` so that the largest single negative element is correctly identified.",
    recommendedVisual: "Kadane execution trace on all-negative array.",
    verificationQuestionIds: ["vq-3-2-1-3"]
  },
  "fp-3-2-2-1": {
    fearPointId: "fp-3-2-2-1",
    subtopicId: "sub-3-2-2",
    microConceptId: "mc-3-2-2-1",
    title: "Dutch National Flag: Forgetting That `swap(mid, high)` Does NOT Advance `mid`",
    difficultyReason: "When swapping `arr[mid]` with `arr[high]`, advancing `mid++` causes unsorted elements to be skipped.",
    commonWrongAssumption: "Advancing `mid++` on every swap just like in `swap(low, mid)`.",
    correctExplanation: "The element swapped from `high` into `mid` was unexamined! You must examine it on the next iteration without advancing `mid`. Only decrement `high--`.",
    recommendedVisual: "DNF pointer movement diagram with highlight on unexamined element at mid.",
    verificationQuestionIds: ["vq-3-2-2-1"]
  },
  "fp-3-2-3-1": {
    fearPointId: "fp-3-2-3-1",
    subtopicId: "sub-3-2-3",
    microConceptId: "mc-3-2-3-1",
    title: "Moore's Voting Algorithm: Omitting the Verification Pass",
    difficultyReason: "Moore's Voting finds a candidate, but if no majority element exists (e.g. `[1, 2, 3]`), it still outputs whatever candidate remains.",
    commonWrongAssumption: "Assuming Moore's algorithm automatically verifies existence of a majority element.",
    correctExplanation: "Moore's algorithm guarantees that IF a majority element (> N/2) exists, it will be the surviving candidate. A second O(N) linear count pass is mandatory to confirm frequency > N/2.",
    recommendedVisual: "Cancellation trace on an array without a majority element.",
    verificationQuestionIds: ["vq-3-2-3-1"]
  },

  // ── STEP 4 BINARY SEARCH FEAR POINTS ──
  "fp-4-1-1-1": {
    fearPointId: "fp-4-1-1-1",
    subtopicId: "sub-4-1-1",
    microConceptId: "mc-4-1-1-1",
    title: "Binary Search Infinite Loop on `low < high` vs `low <= high`",
    difficultyReason: "Mismatching the while loop condition with pointer updates (e.g. `high = mid` vs `high = mid - 1`), causing an infinite loop when `high - low == 1`.",
    commonWrongAssumption: "Assuming any termination condition will terminate safely.",
    correctExplanation: "If using `low <= high`, always update `low = mid + 1` and `high = mid - 1`. If updating `low = mid`, the midpoint must be biased upwards `low + (high - low + 1) / 2` to prevent infinite oscillation.",
    recommendedVisual: "Two-element state oscillation diagram: low = 0, high = 1, mid = 0.",
    verificationQuestionIds: ["vq-4-1-1-1"]
  },
  "fp-4-1-1-2": {
    fearPointId: "fp-4-1-1-2",
    subtopicId: "sub-4-1-1",
    microConceptId: "mc-4-1-1-2",
    title: "Midpoint Integer Overflow with `(low + high) / 2`",
    difficultyReason: "When search space is large (e.g. in BS on answers up to 2*10^9), `low + high` exceeds `2^31 - 1`, producing negative mid.",
    commonWrongAssumption: "Assuming `(low + high) / 2` is always safe for indices.",
    correctExplanation: "Always write `low + (high - low) / 2`. The subtraction `(high - low)` can never overflow because both operands are non-negative and high >= low.",
    recommendedVisual: "Integer overflow bit graph for 32-bit addition.",
    verificationQuestionIds: ["vq-4-1-1-2"]
  },
  "fp-4-2-1-1": {
    fearPointId: "fp-4-2-1-1",
    subtopicId: "sub-4-2-1",
    microConceptId: "mc-4-2-1-1",
    title: "Failing to Recognize Binary Search on Unsorted Input",
    difficultyReason: "Students assume that because the input array is unsorted, Binary Search is impossible.",
    commonWrongAssumption: "Binary Search can only be applied when the input array itself is sorted.",
    correctExplanation: "In **Binary Search on Answers**, we are NOT searching the input array! We are searching the **answer range** (e.g. capacity from max(arr) to sum(arr)), which is inherently sorted and monotonic.",
    recommendedVisual: "Dual-track visual: Unsorted input array vs Sorted answer range below it.",
    verificationQuestionIds: ["vq-4-2-1-1"]
  },
  "fp-4-2-1-2": {
    fearPointId: "fp-4-2-1-2",
    subtopicId: "sub-4-2-1",
    microConceptId: "mc-4-2-1-2",
    title: "Setting Inadequate Lower Bound in Painter's Partition / Book Allocation",
    difficultyReason: "Setting `low = 0` or `low = 1` instead of `low = max(arr)`, allowing an invalid state where a single task exceeds the entire worker capacity.",
    commonWrongAssumption: "Setting `low = 1` as the minimum possible answer.",
    correctExplanation: "No worker can take a fractional job. Therefore, the minimum possible maximum workload MUST be at least the largest single job in the array: `low = *max_element(arr.begin(), arr.end())`.",
    recommendedVisual: "Visual showing single board exceeding painter capacity.",
    verificationQuestionIds: ["vq-4-2-1-2"]
  },

  // ── STEP 6 LINKED LIST FEAR POINTS ──
  "fp-6-1-1-1": {
    fearPointId: "fp-6-1-1-1",
    subtopicId: "sub-6-1-1",
    microConceptId: "mc-6-1-1-1",
    title: "Losing the Linked List Tail during Insertion",
    difficultyReason: "Setting `curr->next = newNode` before saving `curr->next` to `newNode->next`, permanently severing the remainder of the list.",
    commonWrongAssumption: "Assuming pointer updates can be done in any order.",
    correctExplanation: "Always connect the new node to the downstream list FIRST: `newNode->next = curr->next`, and THEN update `curr->next = newNode`.",
    recommendedVisual: "Dangling pointer diagram showing lost chain of nodes.",
    verificationQuestionIds: ["vq-6-1-1-1"]
  },
  "fp-6-1-2-1": {
    fearPointId: "fp-6-1-2-1",
    subtopicId: "sub-6-1-2",
    microConceptId: "mc-6-1-2-1",
    title: "Assuming Fast Can Skip Over Slow Without Meeting in a Cycle",
    difficultyReason: "Students wonder: what if fast jumps 2 steps and hops right over slow without landing on the exact same node?",
    commonWrongAssumption: "Believing fast can leapfrog slow indefinitely in a cycle.",
    correctExplanation: "In each step, fast moves 2 and slow moves 1, so the relative distance decreases by exactly 1 node every iteration. A distance decreasing by 1 must hit 0. They are guaranteed to meet within C steps.",
    recommendedVisual: "Circular track step-by-step distance closure animation.",
    verificationQuestionIds: ["vq-6-1-2-1"]
  },

  // ── STEP 7 RECURSION FEAR POINTS ──
  "fp-7-1-1-1": {
    fearPointId: "fp-7-1-1-1",
    subtopicId: "sub-7-1-1",
    microConceptId: "mc-7-1-1-1",
    title: "Forgetting the Backtracking Pop / State Reversal",
    difficultyReason: "Adding an element to a path `current.push_back(arr[i])`, recursing, and forgetting `current.pop_back()`, causing all future branches to be contaminated.",
    commonWrongAssumption: "Assuming local paths in recursive calls are automatically isolated.",
    correctExplanation: "If passing the path by reference (`vector<int>& path`) for efficiency, any mutation persists. You MUST reverse the mutation immediately after the recursive call returns.",
    recommendedVisual: "Decision tree showing contaminated branch without backtrack pop.",
    verificationQuestionIds: ["vq-7-1-1-1"]
  },

  // ── STEP 8 BIT MANIPULATION FEAR POINTS ──
  "fp-8-1-1-1": {
    fearPointId: "fp-8-1-1-1",
    subtopicId: "sub-8-1-1",
    microConceptId: "mc-8-1-1-1",
    title: "Operator Precedence Trap with Bitwise Operators (`==` over `&`)",
    difficultyReason: "Writing `if (n & 1 == 0)` evaluates as `if (n & (1 == 0))` -> `if (n & 0)` -> false!",
    commonWrongAssumption: "Assuming bitwise operators `&` and `|` have higher precedence than relational `==`.",
    correctExplanation: "In C++, `==` has higher precedence than `&` and `|`. Always wrap bitwise expressions in parentheses: `if ((n & 1) == 0)`.",
    recommendedVisual: "Precedence comparison chart showing unexpected grouping.",
    verificationQuestionIds: ["vq-8-1-1-1"]
  },

  // ── STEP 9 STACK FEAR POINTS ──
  "fp-9-1-1-1": {
    fearPointId: "fp-9-1-1-1",
    subtopicId: "sub-9-1-1",
    microConceptId: "mc-9-1-1-1",
    title: "Calling `st.top()` on an Empty Stack (Segmentation Fault)",
    difficultyReason: "Calling `st.top()` or `st.pop()` when `st.empty()` is true results in undefined behavior or crash.",
    commonWrongAssumption: "Assuming `top()` returns null or -1 when empty.",
    correctExplanation: "In C++, calling `top()` or `pop()` on an empty stack is illegal. Always verify `!st.empty()` before inspecting or popping.",
    recommendedVisual: "Stack boundary guard flowchart.",
    verificationQuestionIds: ["vq-9-1-1-1"]
  },

  // ── STEP 10 SLIDING WINDOW FEAR POINTS ──
  "fp-10-1-1-1": {
    fearPointId: "fp-10-1-1-1",
    subtopicId: "sub-10-1-1",
    microConceptId: "mc-10-1-1-1",
    title: "Shrinking Sliding Window with `if` Instead of `while`",
    difficultyReason: "When a window violation occurs, using `if (condition)` only shrinks the left pointer by 1, which might still leave the window invalid.",
    commonWrongAssumption: "Assuming shrinking once is always sufficient to restore validity.",
    correctExplanation: "A newly added element might cause a condition violation that requires shrinking the left pointer multiple times. Use `while (invalid) { left++; }`.",
    recommendedVisual: "Window state trace showing invalid state persisting under single if.",
    verificationQuestionIds: ["vq-10-1-1-1"]
  },

  // ── STEP 14 BST FEAR POINTS ──
  "fp-14-1-1-1": {
    fearPointId: "fp-14-1-1-1",
    subtopicId: "sub-14-1-1",
    microConceptId: "mc-14-1-1-1",
    title: "Validating BST by Only Checking Immediate Children",
    difficultyReason: "Checking `node->left->val < node->val && node->right->val > node->val` passes for a tree where a right grandchild in left subtree is greater than root (illegal).",
    commonWrongAssumption: "Local parent-child checks validate an entire BST.",
    correctExplanation: "Every node in the left subtree must be less than all of its ancestors. You must pass valid bounds `(minVal, maxVal)` down the recursion.",
    recommendedVisual: "Counterexample binary tree showing locally valid but globally invalid BST.",
    verificationQuestionIds: ["vq-14-1-1-1"]
  },

  // ── STEP 15 GRAPHS FEAR POINTS ──
  "fp-15-1-1-1": {
    fearPointId: "fp-15-1-1-1",
    subtopicId: "sub-15-1-1",
    microConceptId: "mc-15-1-1-1",
    title: "Marking Visited on Pop Instead of Push in BFS (Memory Explosion)",
    difficultyReason: "If visited is marked when a node is dequeued, multiple neighbors can push the same node repeatedly into the queue, causing O(V^2) queue explosion.",
    commonWrongAssumption: "Thinking push vs pop visited marking makes no difference.",
    correctExplanation: "You MUST mark a node as visited immediately when it is **pushed** into the queue. This prevents any other node from enqueuing it again.",
    recommendedVisual: "Queue growth comparison graph: push-marking vs pop-marking.",
    verificationQuestionIds: ["vq-15-1-1-1"]
  },
  "fp-15-2-1-1": {
    fearPointId: "fp-15-2-1-1",
    subtopicId: "sub-15-2-1",
    microConceptId: "mc-15-2-1-1",
    title: "Using Dijkstra on Negative Edge Weights",
    difficultyReason: "Dijkstra marks a node finalized as soon as it is popped from min-heap, assuming no future path can be shorter. Negative weights break this greedy invariant.",
    commonWrongAssumption: "Assuming Dijkstra works for all directed graphs.",
    correctExplanation: "Dijkstra requires all edge weights to be non-negative. If negative edge weights exist, use Bellman-Ford (O(V*E)) or SPFA.",
    recommendedVisual: "Counterexample 3-node graph with negative edge breaking Dijkstra greedy choice.",
    verificationQuestionIds: ["vq-15-2-1-1"]
  },

  // ── STEP 16 DP FEAR POINTS ──
  "fp-16-1-1-1": {
    fearPointId: "fp-16-1-1-1",
    subtopicId: "sub-16-1-1",
    microConceptId: "mc-16-1-1-1",
    title: "Confusing Top-Down Memoization Table Size with Base Case Offsets",
    difficultyReason: "Accessing `memo[n]` when memo table was sized to `vector<int> memo(n)`, causing out-of-bounds at index n.",
    commonWrongAssumption: "A table for 0 to N needs size N.",
    correctExplanation: "If values range from 0 to N inclusive, there are N + 1 distinct states! The table size must be `N + 1`.",
    recommendedVisual: "Array indexing table from 0 to N.",
    verificationQuestionIds: ["vq-16-1-1-1"]
  },
  "fp-16-2-1-1": {
    fearPointId: "fp-16-2-1-1",
    subtopicId: "sub-16-2-1",
    microConceptId: "mc-16-2-1-1",
    title: "Forward vs Backward 1D Array Traversal in 0/1 Knapsack",
    difficultyReason: "In 0/1 knapsack, updating the 1D DP array from left to right accidentally reuses the current item multiple times.",
    commonWrongAssumption: "1D DP array traversal direction does not matter.",
    correctExplanation: "Updating left-to-right uses the newly updated value `dp[w - wt]` from the CURRENT item, turning it into Unbounded Knapsack. Traversing right-to-left ensures `dp[w - wt]` comes from the PREVIOUS item.",
    recommendedVisual: "1D knapsack overwrite diagram: forward vs reverse traversal.",
    verificationQuestionIds: ["vq-16-2-1-1"]
  },

  // ── STEP 17 TRIES FEAR POINTS ──
  "fp-17-1-1-1": {
    fearPointId: "fp-17-1-1-1",
    subtopicId: "sub-17-1-1",
    microConceptId: "mc-17-1-1-1",
    title: "Confusing Prefix Node Existence with Word Termination",
    difficultyReason: "Searching for 'app' in a Trie containing 'apple': all 3 nodes exist, but 'app' was never inserted as a word.",
    commonWrongAssumption: "If all characters are found, the word is in the dictionary.",
    correctExplanation: "A word search requires BOTH all character nodes to exist AND the final node's `isEndOfWord` flag to be `true`. A prefix search (`startsWith`) only requires node existence.",
    recommendedVisual: "Trie diagram showing difference between prefix node and terminal node.",
    verificationQuestionIds: ["vq-17-1-1-1"]
  }
};

/**
 * Accessor methods for Fear Points Registry
 */
export function getAllFearPoints(): FearPoint[] {
  return Object.values(FEAR_POINTS_REGISTRY);
}

export function getFearPointById(id: string): FearPoint | undefined {
  return FEAR_POINTS_REGISTRY[id];
}

export function getFearPointsBySubtopic(subtopicId: string): FearPoint[] {
  return Object.values(FEAR_POINTS_REGISTRY).filter(fp => fp.subtopicId === subtopicId);
}

export function getFearPointsByMicroConcept(microConceptId: string): FearPoint[] {
  return Object.values(FEAR_POINTS_REGISTRY).filter(fp => fp.microConceptId === microConceptId);
}
