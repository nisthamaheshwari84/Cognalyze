# Implementation Plan: Evidence-Based Recruiter Ranking Engine & JD Grounding

Revamp the candidate evaluation and ranking pipeline in Cognalyze to eliminate verdict contradictions, abolish unwarranted infrastructure/prestige bias, faithfully ground all scoring in the provided Job Description, differentiate keyword stuffing from verified evidence (the "Mihir Bansal" test), and provide transparent, explainable recruiter dossiers.

## User Review Required
> [!IMPORTANT]
> - **Prestige Bias Removed**: College names (IIT/NIT/Stanford) and company names (FAANG) will **no longer** artificially inflate scores unless the job description explicitly requires them. Evaluation is 100% evidence-based.
> - **Intern/Junior Calibration**: Interns will **never** be penalized for lacking enterprise-scale metrics (e.g. 1M QPS). Production metrics become a bonus, not a requirement.
> - **Verdict & Summary Consistency**: Verdicts and summaries are strictly bound by a single deterministic source of truth — eliminating the bug where an 85 (Strong Hire) was paired with "Clear reject."
> - **Built-in 30 SDE Intern Benchmark**: Includes the exact 30-candidate dataset (Aarav Sharma, Rohan Verma, ..., Rahul Iyer [ML mismatch], Neel Malhotra [UI mismatch], Mihir Bansal [keyword stuffer]) to test ground-truth evaluation instantly.

---

## Proposed Changes

### Evaluation Engine & Scoring Pipeline

#### [MODIFY] [twoPassRanker.ts](file:///Users/nisthamaheshwari/cognalyze/lib/ai/twoPassRanker.ts)
- **Dynamic JD Parser**:
  - Parse JD into `seniority` (intern/junior/mid/senior/staff), `mustHaveSkills`, `goodToHaveSkills`, and `responsibilities`.
  - Strip all hardcoded infrastructure stacks (Raft, Paxos, Kafka, Flink, K8s, Cassandra) unless present in the user's JD.
- **Evidence-Based Skill Extractor**:
  - Categorize skill mentions into 5 evidence levels:
    - `0.20`: Skill merely listed in skills section.
    - `0.40`: Coursework / academic subject.
    - `0.70`: Project implementation.
    - `0.85`: Deployed project / public repo / automated tests.
    - `1.00`: Professional experience / internship with verifiable outcome.
  - **Keyword Stuffer Trap (Mihir Bansal test)**: High keyword count with low evidence ratio triggers a specific penalty and alert: *"High keyword density with superficial implementation evidence."*
- **Seniority-Aware Scoring Weights**:
  - For Interns: 35% Must-Have Match, 20% Evidence Quality, 15% Practical Work / Internships, 10% Projects, 10% Problem Solving / DSA, 5% Engineering Practices (Git, Testing), 5% Good-to-Have.
- **Deterministic Verdict & Summary Engine**:
  - Map `final_score` deterministically to verdict and generate coherent, contradiction-free summaries.
  - An 85+ score will always generate high-conviction hire recommendations, never "Clear reject."
- **Recruiter Dossier & Fit Breakdown**:
  - Return `evidenceRadar`: `{ mustHave, evidenceQuality, experience, projects, dsa, engineeringPractices, goodToHave }`.
  - Return `matchedMustHaves` with status (`strong`, `moderate`, `weak`, `missing`).
  - Return `whyThisRank`: strengths, gaps, risks, and recommended interview focus.

---

### Benchmark Dataset

#### [MODIFY] [benchmarkCandidates.ts](file:///Users/nisthamaheshwari/cognalyze/lib/ai/benchmarkCandidates.ts)
- Add `get30SdeInternBenchmarkCandidates()` and `getSdeInternJobDescription()` containing:
  - Top Tier (Aarav Sharma, Rohan Verma, Arjun Jain, Kabir Kapoor, Vivaan Mehta)
  - Next Tier (Aditya Singh, Ishaan Malhotra, Vihaan Agarwal, Reyansh Bansal, Kunal Patel, Ananya Reddy, Aditi Saxena, Meera Chopra)
  - Middle Tier (Candidates 14–22)
  - Weak Tier (Candidates 23–27)
  - Role Mismatches (Rahul Iyer - ML heavy, Neel Malhotra - UI/UX heavy)
  - Special Keyword-Stuffer Test (Mihir Bansal - all keywords, zero evidence)

---

### Frontend Recruiter UI

#### [MODIFY] [app/recruiter/page.tsx](file:///Users/nisthamaheshwari/cognalyze/app/recruiter/page.tsx)
- Add **"⚡ Load 30 SDE Intern Benchmark Resumes"** button.
- Update candidate card to display:
  - Non-contradictory summary & verdict badge.
  - **Evidence Radar Bars** (Must-Have, Evidence Quality, Projects, DSA, Engineering, Good-to-Have).
  - Expandable **"Why this candidate ranks here"** panel showing matched must-haves, concrete evidence quotes, and interview screen advice.
  - Keyword stuffing warning tag if detected.

---

## Verification Plan

### Automated Tests
- Create and run `scripts/test-recruiter-ranking.ts`:
  - Run the 30-candidate SDE Intern benchmark through `rankAllCandidates`.
  - Verify Aarav Sharma, Rohan Verma, Arjun Jain, Kabir Kapoor, Vivaan Mehta occupy the top tier.
  - Verify Mihir Bansal (keyword stuffer) is **NOT** in the top 5 and is flagged for low evidence quality.
  - Verify Rahul Iyer (ML mismatch) and Neel Malhotra (UI mismatch) rank lower than strong backend interns.
  - Verify **zero** candidates have contradictory verdicts and summaries (e.g. no Strong Hire with "Clear reject").
  - Verify **zero** `<think>` tags.

### Manual / Browser Verification
- Open `http://localhost:3001/recruiter`.
- Click "⚡ Load 30 SDE Intern Benchmark Resumes".
- Run ranking and inspect candidate cards, scores, evidence bars, and committee debrief report.
- Capture screenshots for `walkthrough.md`.
