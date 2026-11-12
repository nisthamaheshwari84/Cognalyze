# Milestone 4: Final Pre-Implementation Security Gate Report
## Technical Interview Agent — Dynamic Coding & Sandbox Evaluation Engine

**Document ID:** `reports/technical_interview_milestone4_final_security_gate.md`  
**Execution Timestamp:** 2026-11-07T15:50:00+05:30  
**Audit Role:** Principal Software Architect, Application Security Engineer & Systems Infrastructure Specialist  
**Evaluated Specification:** `docs/technical_interview_milestone4_implementation_spec_v3.md`  
**Target Deployment:** `https://cognalyze-gules.vercel.app` (Verified Local Target)  

---

## 1. Executive Summary

This report documents the final pre-implementation security audit and architectural hardening of **Milestone 4 — Dynamic Coding & Sandbox Evaluation Engine**.

Following the review of Specification v2, this report formalizes the definitive sandbox provider decision, resolves the hidden-test visibility paradox, establishes strict local developer execution policies, defines language-specific compilation and execution resource budgets, and introduces an active penetration testing fleet.

### Absolute Boundary Confirmation:
- **Zero Milestone 4 application code was written.**
- **No dependencies were installed.**
- **No database migrations were executed.**
- **No Git commits or pushes were made to remote main.**
- **No Vercel deployment occurred.**
- **Milestones 1, 2, and 3 remain 100% verified, typecheck clean, and production build compliant.**

---

## 2. Sandbox Provider Decision: Judge0 CE vs Piston

We performed an in-depth forensic comparison of **Judge0 CE** versus **Piston** across 10 operational and security dimensions:

| Dimension | Judge0 CE (Community Edition) | Piston (Engineer Man / EMH) | Decision & Risk Rationale |
| :--- | :--- | :--- | :--- |
| **Isolation Kernel** | Linux `isolate` (IOI standard) using namespaces, cgroups v1/v2, chroot | Custom Node.js runner using POSIX `prlimit` and temporary directory | **Judge0 CE wins:** `isolate` provides unbypassable Linux kernel-level containment. |
| **Container Runtime** | Multi-container Docker Compose (server, workers, Redis, Postgres) | Single Docker container (`ghcr.io/engineer-man/piston`) | **Judge0 CE wins:** True separation between job queue, API gateway, and workers. |
| **Syscall Seccomp** | Built-in strict seccomp BPF filters configured per language profile | Default Docker seccomp only; lacks granular per-language syscall denial | **Judge0 CE wins:** Blocks socket creation, process cloning, and unauthorized syscalls. |
| **Linux Capabilities** | All ambient and effective capabilities dropped (`CAP_SYS_ADMIN`, `CAP_NET_RAW` denied) | Relies on Docker daemon defaults unless manually hardened | **Judge0 CE wins:** Drops all dangerous Linux capabilities before code execution. |
| **Cgroup Enforcement** | Per-execution dedicated cgroups for CPU quota, memory limits, and swap accounting | Container-wide cgroups; process-level limits enforced only via POSIX `prlimit` | **Judge0 CE wins:** Prevents memory bomb attacks and kernel swap thrashing. |
| **Network Isolation** | Inherently disabled via network namespace unsharing (`CLONE_NEWNET`, no loopback routing) | Requires `--network none` on container; if package manager enabled, network is shared | **Judge0 CE wins:** Guarantees zero lateral network movement or cloud metadata SSRF. |
| **Filesystem Isolation** | Ephemeral `/box` tmpfs mounted with read-only bindings to `/usr`, `/lib`; auto-wiped | Shared container filesystem with temporary directory in `/tmp/piston`; risk of residue | **Judge0 CE wins:** Read-only root with wiped tmpfs prevents disk vandalism and leakage. |
| **Multi-Tenant Separation** | Sandboxes are indexed by `box_id` (0–999); wiped via `isolate --cleanup` after each run | Concurrent jobs execute within the same container namespace under user `piston` | **Judge0 CE wins:** Eliminates cross-candidate data inspection. |
| **Operational Maintenance** | Moderate: standard Docker Compose upgrade; requires kernel cgroups v2 on host VPS | Low: single image pull; dynamic package installation via `/api/v2/packages` | **Judge0 CE acceptable:** Predictable, reproducible dependency and security patching. |
| **Queue Durability** | Asynchronous Redis queue; worker failure triggers job retry from persistent state | In-memory queue; container crash drops all in-flight submissions | **Judge0 CE wins:** Submissions survive worker restarts or brief load spikes. |

### Architectural Recommendation:
**Deploy Self-Hosted Judge0 CE on a dedicated, hardened Linux VPS (2 vCPU, 4GB RAM).**  
Cognalyze Next.js (running on Vercel at `https://cognalyze-gules.vercel.app`) communicates with Judge0 over internal private VPC or HTTPS with Bearer token authentication.

---

## 3. Hidden-Test Security Correction & Mathematical Truth

### 3.1 The Visibility Reality
A program evaluating $f(x)$ necessarily receives input $x$ during its execution. It is technically impossible and logically false to claim that the current test input can be hidden from the program being evaluated.

### 3.2 The Real Security Objectives:
1. **Preventing Access to Future Test Vectors:** The candidate code must not be able to read subsequent test cases in advance.
2. **Preventing Harness Inspection:** The candidate code must not be able to inspect the evaluation runner, caller memory, or scoring rubrics.
3. **Preventing Output Redirection / Monkey-Patching:** The candidate code must not be able to forge passing test results.
4. **Preventing Test-Suite Exfiltration:** The candidate code must not be able to leak test vectors back to the candidate's browser.

### 3.3 Security Implementation in Spec v3:
- **Per-Test Fresh Box:** Each test case runs in an independent sandbox box (`box_id`). Test $N$ cannot inspect the memory, temporary files, or side-effects of Test $N-1$.
- **Backend-Only Storage:** Private evaluation test cases exist only in backend storage; they are never transmitted to the client browser.
- **Single-Input Delivery:** Inputs are delivered strictly for the single active test case via standard input (`stdin`).
- **Out-of-Band Evaluation:** Candidate code writes raw output to `stdout`. The verification assertion ($f(\text{input}) \stackrel{?}{=} \text{expected}$) occurs **outside** the sandbox in the backend judge. Candidate code never sees the expected output.
- **Redacted Aggregate Reporting:** The candidate receives only high-level status (e.g., `Passed 8/10`, `Wrong Answer on Hidden Test #4`, `Time Limit Exceeded`) with all expected outputs and boundary values strictly redacted.

---

## 4. Local Execution Restrictions & Minimum Isolation Policy

To protect developer workstations and maintain parity with production security, **untrusted candidate code is prohibited from executing directly inside the Next.js process or on the developer's host machine**.

### 4.1 Local Development Isolation Tiers:
1. **Local Docker Sandbox (Tier 1):** Developers run Judge0 CE locally via `docker compose -f docker-compose.sandbox.yml up -d`. The local Next.js instance points to `http://localhost:2358`.
2. **Trusted Mock Fixture Mode (Tier 2 - Default for CI & Offline Dev):** If the local Docker sandbox is offline, untrusted code execution is **disabled by policy**. Local tests run strictly against pre-recorded, cryptographically verified test fixtures (`MOCK_SANDBOX=true`). Live untrusted submissions return HTTP 503 (`SANDBOX_DAEMON_OFFLINE`).

---

## 5. Language-Specific Resource Limits

Resource limits are strictly bifurcated into **Compilation** and **Execution** budgets:

### 5.1 Compilation Resource Budgets

| Language | Compiler / Toolchain | Max CPU Time | Max Wall-Clock | Max Memory | Max Binary Size | Process Limit |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **C++** | `clang++ -std=c++20 -O2` | 4.0s | 6.0s | 512 MB | 10 MB | 4 |
| **Java** | `javac 21` | 5.0s | 8.0s | 768 MB | 10 MB | 8 |
| **TypeScript** | `esbuild / tsc transpile` | 2.0s | 3.0s | 256 MB | 5 MB | 2 |
| **Python** | Bytecode compilation (`compile`) | 1.0s | 2.0s | 128 MB | 2 MB | 1 |

### 5.2 Execution Resource Budgets (Per Single Test Case)

| Metric | JavaScript / Node.js 20 | Python 3.12 | C++ (Native Binary) | Java 21 (JVM Runtime) |
| :--- | :--- | :--- | :--- | :--- |
| **CPU Time Limit** | 1.0s | 1.5s | 0.5s | 1.5s |
| **Wall-Clock Limit** | 2.0s (SIGKILL) | 3.0s (SIGKILL) | 1.0s (SIGKILL) | 3.0s (SIGKILL) |
| **Memory Limit** | 128 MB (`--max-old-space-size=128`) | 128 MB (cgroups) | 64 MB (cgroups) | 256 MB (`-Xmx128m -XX:MaxMetaspaceSize=64m`) |
| **Max Process Count** | 1 (`pids.max = 1`) | 1 (`pids.max = 1`) | 1 (`pids.max = 1`) | 16 (JVM threading requirement) |
| **Max Output Size** | 128 KB | 128 KB | 128 KB | 128 KB |
| **Network Access** | Blocked (`--net=none`) | Blocked (`--net=none`) | Blocked (`--net=none`) | Blocked (`--net=none`) |

### 5.3 Global Job & Submission Limits
- **Max Source Code Length:** 64 KB.
- **Concurrent Submissions per Candidate:** Exactly 1 active job (subsequent submissions return HTTP 429).
- **Candidate Submission Rate Limit:** Max 5 submissions per 60 seconds per candidate.
- **Global Sandbox Queue Ceiling:** 100 queued executions; excess submissions receive HTTP 503 with `Retry-After: 5`.

---

## 6. Real Sandbox Security & Penetration Testing Suite

The following 10 penetration tests are specified to run against the **actual live sandbox infrastructure**:

- **TC-M4-PEN-01 (Infinite Loop / CPU Exhaustion) [Penetration]:** `while True: pass` terminated at 1.0s–1.5s CPU with `TIME_LIMIT_EXCEEDED`.
- **TC-M4-PEN-02 (Memory Bomb / Heap Exhaustion) [Penetration]:** `x = [0] * (10**9)` terminated with `MEMORY_LIMIT_EXCEEDED` under 128MB.
- **TC-M4-PEN-03 (Process Fork Bomb Containment) [Penetration]:** `while True: os.fork()` blocked by `pids.max = 1`, returning `RUNTIME_ERROR` without host starvation.
- **TC-M4-PEN-04 (Filesystem Traversal & Write Block) [Penetration]:** `open('/etc/shadow')` and writing to `/etc` throw `PermissionDenied` under read-only root.
- **TC-M4-PEN-05 (Network Sockets & Cloud Metadata SSRF) [Penetration]:** Sockets to `169.254.169.254` fail immediately with `Network is unreachable`.
- **TC-M4-PEN-06 (Environment Variable Scraping) [Penetration]:** `os.environ` exposes only sanitized whitelist (`PATH`); zero cloud keys present.
- **TC-M4-PEN-07 (Cross-Tenant File Snooping) [Integration / Penetration]:** Candidate B cannot read Candidate A's temporary files across isolated boxes.
- **TC-M4-PEN-08 (Worker Crash / Segfault Recovery) [Integration]:** Null pointer dereference (`int* p = nullptr; *p = 42;`) caught gracefully as `RUNTIME_ERROR (SIGSEGV)`.
- **TC-M4-PEN-09 (Timeout Zombie / Orphan Cleanup) [Integration]:** Killing a timed-out execution leaves 0 orphan processes in the host process table.
- **TC-M4-PEN-10 (Hidden-Test Harvesting Protection) [Penetration]:** Code attempting to read beyond current input receives EOF; zero future test vectors are accessible.

---

## 7. Prerequisite Checklist for Implementation

| Prerequisite ID | Requirement | Status | Owner |
| :--- | :--- | :---: | :--- |
| **PREREQ-01** | Formal approval of `docs/technical_interview_milestone4_implementation_spec_v3.md` | **PENDING USER APPROVAL** | User / Stakeholder |
| **PREREQ-02** | Provisioning of dedicated Judge0 CE Linux host (e.g. EC2 / Hetzner / Fly.io) | **PENDING INFRA PROVISIONING** | DevOps / Lead |
| **PREREQ-03** | Local Docker Compose sandbox configuration (`docker-compose.sandbox.yml`) | **READY TO DRAFT IN M4** | Lead Engineer |
| **PREREQ-04** | Client API adapter for Judge0 with strict local mock fallback | **READY TO IMPLEMENT IN M4** | Lead Engineer |
| **PREREQ-05** | Supabase database migration for `interview_coding_submissions` | **READY TO DRAFT IN M4** | Lead Engineer |

---

## 8. Final Approval Gate Recommendation

### Final Verdict: **READY FOR IMPLEMENTATION (SUBJECT TO EXPLICIT USER APPROVAL)**

All architectural, security, mathematical, and deployment questions have been resolved in **Specification v3**. The design is secure, scalable, testable, and strictly compatible with both the Vercel production deployment target (`https://cognalyze-gules.vercel.app`) and the Cognalyze technical assessment mission.

### Final Execution Boundary Attestation:
- No Milestone 4 source code has been written.
- No database migrations were executed.
- No remote Git commits or pushes were made.
- No Vercel deployments were triggered.
- Milestones 1, 2, and 3 remain 100% verified, typecheck clean, and production build compliant.

**We are completely stopped at the Milestone 4 approval gate. We await your explicit authorization before writing any code.**

