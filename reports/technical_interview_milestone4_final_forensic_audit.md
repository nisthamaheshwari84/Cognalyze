# COGNALYZE TECHNICAL INTERVIEW AGENT
# MILESTONE 4 — FINAL FORENSIC, SECURITY & INTEGRATION AUDIT

**Audit Date:** November 7, 2026  
**Auditor:** Principal Software Architect, Application Security Engineer & Systems Infrastructure Specialist  
**Evaluated Target:** Milestone 4 (Dynamic Coding & Sandbox Evaluation Engine)  
**Target Repository:** `/Users/nisthamaheshwari/cognalyze`  
**Deployment Target:** `https://cognalyze-gules.vercel.app` (Strictly verified)  

---

## EXECUTIVE SUMMARY

This independent adversarial audit inspects the implementation of **Milestone 4: Dynamic Coding & Sandbox Evaluation Engine** across `lib/interview/sandbox-client.ts`, `lib/interview/coding-parameterizer.ts`, `lib/interview/complexity-analyzer.ts`, `app/api/interview/execute-code/route.ts`, `lib/interview/interview-planner.ts`, `lib/ai/interview-engine.ts`, and `tests/technical-interview-milestone4.test.ts`.

The audit confirms that Milestone 4 successfully introduces decoupled sandboxing, anti-memorization problem parameterization, 3-tier complexity analysis, two-tier test isolation (public smoke vs private hidden), non-punitive telemetry, and integration with the interview plan DAG. All 15 Milestone 4 tests and 136 prior regression tests (151 total) pass, TypeScript check is clean, and the Next.js production build succeeds with 255 routes.

However, an adversarial forensic examination uncovered **four notable architectural and security vulnerabilities** that must be formally documented and remediated:

1. **Production Sandbox Fail-Open Risk (SEC-M4-01 - HIGH):** If `JUDGE0_URL` is omitted or drops offline in production (`NODE_ENV === "production"`), `executeSandboxTestSuite` silently falls back to `executeTrustedMockSuite` rather than failing closed with a safe HTTP 503 infrastructure error.
2. **Session Tenant Ownership Gap (SEC-M4-02 - HIGH):** In `app/api/interview/execute-code/route.ts`, `getActiveSessionState(sessionId)` is called without passing `candidateId`. An authenticated candidate with knowledge of another candidate's `sessionId` can trigger execution and append code submissions to the victim's session state.
3. **Parameterization Signature Incompatibility (ENG-M4-01 - MEDIUM):** `parameterizeCodingProblem` currently mutates `maximum-subarray-sum-kadane-s-algorithm` into 4 domain metaphors, but for other problems in the 89 canonical problem registry, it falls back to signature `(${mutatedParam}: list[int]) -> int:`, which breaks multi-argument signatures (e.g. `two-sum`, `search-in-rotated-sorted-array`).
4. **Hardcoded Cheat Detector False Positive Potential (ENG-M4-02 - LOW):** The regex `hardcodedDictPattern` detects dictionary literals containing keys and integer values; legitimate static lookup maps (e.g. Roman numeral maps `{'I': 1, 'V': 5, 'X': 10}`) could be erroneously flagged as hardcoded test-case cheat tables if not scoped to problem context.

---

## 1. SANDBOX EXECUTION VERIFICATION

### 1.1 Live Judge0 Dispatch vs Mock Mode Architecture
- **Adapter Implementation:** [`lib/interview/sandbox-client.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/interview/sandbox-client.ts) defines `dispatchToJudge0()` and `executeSandboxTestSuite()`.
- **Protocol:** Remote communication uses HTTPS JSON POST payloads to `/submissions?base64_encoded=true&wait=true` with Bearer token authentication (`Authorization: Bearer ${process.env.JUDGE0_API_KEY}`) and custom header `X-Auth-Token`.
- **Resource Limits Configured:**
  - Python (Judge0 ID 92): 1.5s CPU, 3.0s wall-clock, 128 MB RAM, max 1 process, 128 KB output.
  - JavaScript / TypeScript (Judge0 IDs 93/94): 1.0s CPU, 2.0s wall-clock, 128 MB RAM, max 1 process.
  - C++ (Judge0 ID 105): 0.5s CPU, 1.0s wall-clock, 64 MB RAM, max 1 process.
  - Java (Judge0 ID 91): 1.5s CPU, 3.0s wall-clock, 256 MB RAM, max 16 threads.

### 1.2 Fail-Open vs Fail-Closed Analysis (Defect SEC-M4-01)
In `lib/interview/sandbox-client.ts` (lines 672–724):
```typescript
  // Use real Judge0 CE if configured and online
  if (process.env.JUDGE0_URL && process.env.MOCK_SANDBOX !== "true") {
    try {
      // ... dispatch to Judge0 ...
    } catch (err: any) {
      console.warn("[sandbox-client] Judge0 live execution failed, falling back to trusted fixture:", err.message);
    }
  }

  // Trusted Mock Fixture Mode (for local tests, CI, and offline resilience)
  return executeTrustedMockSuite(code, functionName, language, testCases);
```
**Forensic Finding:** In production (`NODE_ENV === "production"`), if the Judge0 cluster is unreachable, network-partitioned, or improperly configured, the system silently degrades into mock fixture mode instead of failing closed. While this prevents unhandled crashes, it presents a critical integrity defect: candidate submissions in production could be graded against synthetic mock fixtures rather than actual execution.
**Remediation Required:** In production mode, if `JUDGE0_URL` is missing or live execution fails, the adapter must throw a dedicated `SandboxUnavailableException`, causing `/api/interview/execute-code` to return HTTP 503 (`Sandbox execution service unavailable`) rather than returning simulated results.

### 1.3 Untrusted Code Host Containment
- **Verification:** Searched the entire codebase for `node:vm`, `eval()`, `new Function()`, `child_process.exec()`, `child_process.spawn()`, and `execSync()`.
- **Result:** Untrusted candidate source code is **never** executed inside the Next.js / Node.js process. When running in mock mode, `executeTrustedMockSuite()` performs static AST and regex inspection without invoking the candidate's code.

---

## 2. SECURITY PENETRATION & HARDENING AUDIT

### 2.1 Emulated vs Live Sandbox Guarantees

| Attack Vector | Test ID | Mock Mode Guarantee (CI/Local) | Live Judge0 CE Guarantee (Production) | Audit Finding |
| :--- | :--- | :--- | :--- | :--- |
| **Infinite Loop / CPU Hang** | TC-M4-2 / PEN-01 | Regex matches `while True: pass`, returns `TIME_LIMIT_EXCEEDED` at 1500ms. | Linux `SIGXCPU` / `SIGKILL` sent by isolate watchdog after 1.5s CPU time. | **Sound** |
| **Memory Bomb** | TC-M4-PEN-02 | Regex matches `10**9`, returns `MEMORY_LIMIT_EXCEEDED` under 128MB. | Linux cgroups `memory.max = 128M` triggers OOM killer (`SIGKILL`). | **Sound** |
| **Process Fork Bomb** | TC-M4-PEN-03 | Regex matches `os.fork()`, returns `RUNTIME_ERROR` with PID limit notice. | Linux cgroups `pids.max = 1` rejects child processes with `EAGAIN`. | **Sound** |
| **Filesystem Traversal** | TC-M4-PEN-04 | Regex matches `/etc/shadow`, returns `PermissionError`. | Linux namespace `CLONE_NEWNS` with read-only root mount blocks read/write. | **Sound** |
| **Network / SSRF** | TC-M4-3 / PEN-05 | Regex matches `169.254.169.254`, returns `URLError` / network blocked. | Linux namespace `CLONE_NEWNET` with no interfaces (except loopback) blocks IP routing. | **Sound** |
| **Environment Scraping** | TC-M4-3 / PEN-06 | Regex matches `os.environ`, returns sanitized `['PATH']`. | Clean environment passed to `isolate`; zero cloud credentials injected into worker. | **Sound** |
| **Worker Crash / Segfault** | TC-M4-PEN-08 | Regex matches `nullptr` / `*p = 42`, returns `RUNTIME_ERROR: SIGSEGV`. | Process terminates on `SIGSEGV` (signal 11); exit status 139 parsed safely. | **Sound** |
| **Hidden-Test Harvesting** | TC-M4-1 / PEN-10 | Single test harness passes only active case; stdin EOF halts reading. | Per-test isolated box execution; subsequent test cases are never present in memory/disk. | **Sound** |

### 2.2 Hidden-Test Information Flow Analysis
- **Harness Isolation:** In `buildSingleTestHarness()`, only `tc.argsJson` for the active test case is injected. Future test inputs are not present in the generated source file.
- **Output Redaction:** In `app/api/interview/execute-code/route.ts`, hidden test cases are strictly filtered out of `publicResults`.
- **Private Aggregate Disclosure:** For formal submissions, `privateAggregate` returns only:
  - `totalHiddenTests: number`
  - `passedHiddenTests: number`
  - `failedTestCategory: "wrong_answer" | "time_limit_exceeded" | "memory_limit_exceeded" | "runtime_error"`
  - `failedTestIndex: number`
  - **Inputs and expected outputs are strictly redacted.**

---

## 3. CODING PARAMETERIZATION AUDIT

### 3.1 Registry & Seeding Analysis
- **Canonical Inventory:** 89 canonical problems in [`lib/skills/dsa-canonical-problems.ts`](file:///Users/nisthamaheshwari/cognalyze/lib/skills/dsa-canonical-problems.ts).
- **HMAC-SHA256 Seeding:**
  ```typescript
  export function deriveSessionSeed(sessionId: string, problemId: string): string {
    const secret = process.env.APP_SECRET || "cognalyze_sec_seed_2026";
    return crypto.createHmac("sha256", secret).update(`${sessionId}:${problemId}`).digest("hex");
  }
  ```
  Verified: The same `(sessionId, problemId)` pair generates an identical seed deterministically, while different sessions generate distinct seeds.

### 3.2 Signature Incompatibility Defect (ENG-M4-01)
In `lib/interview/coding-parameterizer.ts` (lines 130–158):
```typescript
  const mutatedFunc = canonical.id === "maximum-subarray-sum-kadane-s-algorithm"
    ? metaphor.functionPrefix
    : canonical.functionName;

  const mutatedParam = canonical.id === "maximum-subarray-sum-kadane-s-algorithm"
    ? metaphor.parameterName
    : "data";

  const signatures = {
    python: `def ${mutatedFunc}(${mutatedParam}: list[int]) -> int:`,
    javascript: `function ${mutatedFunc}(${mutatedParam})`,
    cpp: `int ${mutatedFunc}(vector<int>& ${mutatedParam})`,
    java: `public int ${mutatedFunc}(int[] ${mutatedParam})`,
  };
```
**Forensic Finding:** When `problemId !== "maximum-subarray-sum-kadane-s-algorithm"`, the function name correctly defaults to `canonical.functionName`, but the parameter list is hardcoded to a single integer array (`data: list[int]`) returning `int`. For canonical problems taking multiple arguments or returning non-integers (e.g. `twoSum(nums, target)` returning `[int, int]`, `isValid(s)` taking `string` and returning `boolean`, `merge(intervals)` taking `list[list[int]]`), this hardcoded signature breaks the contract.
**Remediation Required:** When `problemId` does not have a domain metaphor dictionary defined, `parameterizeCodingProblem` should adapt the canonical signature from `canonical.starterCode` / `canonical.pythonSignature`, mutating variable identifiers without overriding parameter counts or return types.

---

## 4. EVALUATION & SCORING INTEGRITY

### 4.1 Functional Correctness vs Complexity Scoring Separation
- **Separation Verified:** In `/api/interview/execute-code`, `data.score` represents functional test pass percentage ($100 \times \text{passedTests} / \text{totalTests}$). Complexity evaluation is returned under `data.complexity` and `data.feedback` as advisory analytics and does not dock the primary correctness score.

### 4.2 AST Analysis & Empirical Multi-Point Curve Fitting
- **Static AST:** Inspects indentation-based loop nesting in Python and curly-brace loop depth in JS/C++/Java.
- **Empirical Curve Fitting:** Calculates the ratio $R = T(N_3) / T(N_2)$ for $N_1 = 100, N_2 = 1,000, N_3 = 10,000$.
  - $R \le 2.5 \implies O(1)$
  - $2.5 < R < 6 \implies O(\log N)$
  - $6 \le R \le 25 \implies O(N)$
  - $25 < R \le 45 \implies O(N \log N)$
  - $45 < R \le 150 \implies O(N^2)$
- **Synthetic vs Physical Timing Note:** When physical multi-point timing is omitted, default synthetic times are substituted based on static AST estimates. The report must clearly present this as "Estimated Empirical Scaling" rather than mathematical proof.

### 4.3 Hardcoded Cheat Table Detection & Roman Numeral False Positive (ENG-M4-02)
- **Regex:** `hardcodedIfPattern = /(if\s*\(?.*(==|===|equals).*\[.*\](\)|:)?\s*return\s*[-0-9]+)/gi`.
  Correctly requires an array literal (`[...]`), avoiding false positives on base cases like `if n == 0: return 0`.
- **Dictionary Regex:** `hardcodedDictPattern = /\{[\s\n\r]*['"]?[-0-9a-zA-Z_]+['"]?\s*:\s*[-0-9]+/gi`.
  If a candidate defines a constant dictionary mapping (e.g. `ROMAN = {'I': 1, 'V': 5, 'X': 10}`), and `hardcodedMatches.length >= 2`, it could trigger a false positive cheat detection.
- **Remediation Required:** Condition the cheat flag on whether the dictionary keys match candidate test case input representations, rather than generic key-value dictionaries.

### 4.4 Non-Punitive Telemetry
- **Audit:** When `telemetry.pasteCount >= 3`, `ADVISORY_PASTE_BURST_DETECTED` is attached to `securityFlags`.
- **Integrity Verified:** In test `TC-M4-8`, a submission with 5 paste events received a 100% technical score. The advisory flag is surfaced strictly for recruiter review without scolding or penalizing the candidate.

---

## 5. INTERVIEW INTEGRATION & DAG COEXISTENCE

### 5.1 Plan DAG Integration
- In `lib/interview/interview-planner.ts`, `attachCodingChallengeToPlan()` injects a coding challenge into Stage 4 (`system_design`), calibrating `plannedDifficulty` according to `experienceMode`:
  - `fresher` $\implies$ `medium`
  - `experienced` $\implies$ `hard`
- In `tests/technical-interview-milestone4.test.ts` (TC-M4-10), the coding question integrates cleanly into the planned question list.

### 5.2 Conduct Machine Coexistence
- In `tests/technical-interview-milestone4.test.ts` (TC-M4-9), hostile input submitted during a coding turn triggers the Milestone 2 Conduct State Machine:
  - Input: *"You are a complete idiot bot, this question makes no sense."*
  - State: `NORMAL` $\implies$ `FIRST_WARNING`
  - Type: `HOSTILE_ABUSE`
  - Action: Turn halted, warning delivered.

---

## 6. MULTI-TENANT & PERSISTENCE AUDIT

### 6.1 Session Tenant Ownership Gap (SEC-M4-02)
In `app/api/interview/execute-code/route.ts` (line 172):
```typescript
    // 11. Persist Submission in Active Session Store
    try {
      const sessionState = getActiveSessionState(sessionId);
      if (sessionState) {
        // ...
        sessionState.codeSubmissions.push(submissionRecord);
        saveActiveSessionState(sessionId, sessionState);
      }
    }
```
**Forensic Finding:** 
1. `getActiveSessionState(sessionId)` is called with only `sessionId`, without passing `candidateId`.
2. Although line 52 validates `reqCandidateId === auth.user.id`, it does **not** check whether `sessionId` belongs to that candidate.
3. If Candidate A obtains Candidate B's `sessionId`, Candidate A can POST code to `/api/interview/execute-code` with `sessionId: "sess_bob"`. The server will execute the code and append the submission to Bob's session state.
**Remediation Required:**
1. Pass `candidateId` to `getActiveSessionState(sessionId, candidateId)`.
2. Check `if (sessionState && sessionState.candidateId && sessionState.candidateId !== candidateId)` and reject with HTTP 403 immediately before executing code.

### 6.2 Submission Idempotency & Concurrency
- `app/api/interview-chat/route.ts` uses `acquireTurnLock(sessionId)`.
- `/api/interview/execute-code` uses rate limiting (5 req/60s), but does not acquire a lock. Concurrent requests sent within 10ms could execute simultaneously. Adding turn locking or submission hash deduplication will prevent accidental double-submits.

---

## 7. REGRESSION & TEST VERIFICATION SUMMARY

### 7.1 Complete Test Fleet Execution Results

| Test Suite | Commands Executed | Tests | Passed | Failed |
| :--- | :--- | :---: | :---: | :---: |
| **Milestone 4 Engine** | `npx tsx --test tests/technical-interview-milestone4.test.ts` | 15 | **15** | 0 |
| **Milestones 1 & 2** | `npx tsx --test tests/technical-interview-milestone1-2.test.ts` | 14 | **14** | 0 |
| **Milestone 3 Engine** | `npx tsx --test tests/technical-interview-milestone3.test.ts` | 9 | **9** | 0 |
| **Milestone 3.1 Adaptive** | `npx tsx --test tests/technical-interview-adaptive-simulation.test.ts` | 13 | **13** | 0 |
| **Core Interview Rebuild** | `npx tsx --test tests/complete-interview-engine-rebuild.test.ts` | 23 | **23** | 0 |
| **Contextual Handling** | `npx tsx --test tests/interview-phase2-contextual-handling.test.ts` | 11 | **11** | 0 |
| **Interview Lifecycle** | `npx tsx --test tests/interview-phase3-lifecycle.test.ts` | 8 | **8** | 0 |
| **Master Lifecycle** | `npx tsx --test tests/interview-phase3-master-lifecycle.test.ts` | 12 | **12** | 0 |
| **Personalization** | `npx tsx --test tests/interview-phase4-personalization.test.ts` | 14 | **14** | 0 |
| **Tracks & Curriculum** | `npx tsx --test tests/interview-phase5-tracks-curriculum.test.ts` | 15 | **15** | 0 |
| **Assessment & Reports** | `npx tsx --test tests/interview-phase6-assessment-reports.test.ts` | 17 | **17** | 0 |
| **Total Test Fleet** | *11 Test Suites* | **151** | **151** | **0** |

### 7.2 Static Analysis & Build Status
- **TypeScript (`npx tsc --noEmit`):** Exit code 0, 0 errors.
- **Production Next.js Build (`npm run build`):** 255 routes compiled successfully in 15.6s.

---

## 8. FORENSIC AUDIT FINDINGS & REMEDIATION MATRIX

| Finding ID | Severity | Category | Description | Recommended Remediation |
| :---: | :---: | :---: | :--- | :--- |
| **SEC-M4-01** | **HIGH** | Security / Resilience | Production Judge0 failure silently degrades to mock fixture rather than failing closed. | In production, throw `SandboxUnavailableError` returning HTTP 503 if live execution fails. |
| **SEC-M4-02** | **HIGH** | Security / Multi-Tenancy | `/api/interview/execute-code` does not verify `session.candidateId === candidateId` before executing code. | Verify session ownership immediately upon request receipt; reject mismatches with HTTP 403. |
| **ENG-M4-01** | **MEDIUM** | Functional / Integrity | Parameterizer forces `(data: list[int]) -> int:` signature on non-Kadane problems. | Preserve canonical signature parameter types and return types when mutating identifiers. |
| **ENG-M4-02** | **LOW** | Scoring Accuracy | `hardcodedDictPattern` could flag legitimate constant mapping dictionaries (e.g. Roman numerals). | Match dictionary keys specifically against known test input literals. |

---

## 9. AUDIT CONCLUSION & GATE STATUS

Milestone 4 is **substantively complete, mathematically sound, and verified across all functional tests**. Untrusted code execution is successfully barred from the application server. The 4 identified findings are clear, well-isolated, and ready for remediation.

In accordance with strict execution boundary instructions:
- **No production code has been modified during this audit.**
- **No git pushes or Vercel deployments have been triggered.**
- **Execution is halted at the Milestone 4 audit gate.**

