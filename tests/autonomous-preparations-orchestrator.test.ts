/**
 * COGNALYZE AUTONOMOUS PREPARATIONS ORCHESTRATOR & SYSTEM VERIFICATION SUITE
 *
 * Verifies:
 * 1. Central Preparation Orchestrator produces complete Command Center state ("Continue My Preparation", Daily Execution Plan).
 * 2. Open Source Intelligence returns actionable issues with suggestedApproach, unit tests, and GitHub URLs.
 * 3. Project Intelligence ranks blueprints cleanly using Student DNA and provides architecture schemas.
 * 4. Autonomous Assessment Engine synthesizes single-click opportunity mock tests and scores them cleanly with remediation routing.
 * 5. Interview Track Configuration pre-populates and routes directly to /student/practice-interview.
 * 6. SQLite Driver operates safely in runtime without static Webpack scheme imports.
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { preparationOrchestrator } from "../lib/skills/preparations/orchestrator";
import {
  getAllOpenSourceRepositories,
  getAllMatchedIssues,
} from "../lib/skills/preparations/open-source-intelligence";
import {
  getAllProjectBlueprints,
  rankProjectsForStudent,
} from "../lib/skills/preparations/project-intelligence";
import { autonomousAssessmentEngine } from "../lib/skills/preparations/autonomous-assessment-engine";
import { createInMemoryDatabase } from "../lib/skills/sqlite-driver";

describe("Autonomous Preparations Orchestrator & Runtime Verification", () => {
  test("1. Orchestrates full GSoC 2027 Command Center and Next Action", () => {
    const context = preparationOrchestrator.orchestrateArena("test-student-gsoc-1", "gsoc-2027");
    assert.ok(context, "Orchestrated context must be returned for gsoc-2027");

    assert.equal(context.arena.id, "gsoc-2027");
    assert.ok(context.commandCenter.primaryNextAction.title.length > 0, "Primary action must have a title");
    assert.ok(context.commandCenter.primaryNextAction.targetHref.startsWith("/"), "Target href must be valid route");
    assert.ok(context.commandCenter.dailyTasks.length >= 3, "Must provide prioritized daily execution tasks");
    assert.ok(context.matchedIssues.length > 0, "Must provide matched open source issues");
    assert.ok(context.recommendedRepositories.length > 0, "Must provide recommended repositories");
    assert.ok(context.rankedProjects.length > 0, "Must provide ranked project blueprints");
    assert.ok(context.readyMockAssessmentSession.questions.length > 0, "Must pre-configure autonomous mock assessment");
    assert.ok(context.interviewTrackConfig.directHref.includes("/student/practice-interview"), "Must link to interview studio");
  });

  test("2. Orchestrates Flipkart GRiD 7.0 with Interview Studio & DSA/System Design Routing", () => {
    const context = preparationOrchestrator.orchestrateArena("test-student-grid-1", "flipkart-grid-7");
    assert.ok(context, "Orchestrated context must exist for flipkart-grid-7");

    assert.equal(context.arena.category, "COMPANY_HACKATHON");
    assert.equal(context.interviewTrackConfig.track, "system_design");
    assert.ok(context.interviewTrackConfig.directHref.includes("company=Flipkart"), "Interview route must include Flipkart parameter");
  });

  test("3. Open Source Intelligence provides valid issues with step-by-step approach and test specs", () => {
    const repos = getAllOpenSourceRepositories();
    assert.ok(repos.length >= 15, "Must provide comprehensive repository index");
    for (const r of repos) {
      assert.ok(r.repoUrl.startsWith("https://"), `Repo ${r.name} must have valid URL`);
      assert.ok(r.localSetupCommand.length > 0, `Repo ${r.name} must have setup command`);
      assert.ok(r.testSuiteCommand.length > 0, `Repo ${r.name} must have test command`);
    }

    const issues = getAllMatchedIssues();
    assert.ok(issues.length >= 10, "Must provide actionable matched issues");
    for (const issue of issues) {
      assert.ok(issue.issueUrl.startsWith("https://"), `Issue ${issue.id} must have valid GitHub issue URL`);
      assert.ok(Array.isArray(issue.suggestedApproach) && issue.suggestedApproach.length > 0, `Issue ${issue.id} must include implementation steps`);
      assert.ok(issue.testRequirements.length > 0, `Issue ${issue.id} must include unit test guidance`);
    }
  });

  test("4. Project Intelligence ranks blueprints by Student DNA match and target program", () => {
    const blueprints = getAllProjectBlueprints();
    assert.ok(blueprints.length > 0, "Project blueprints must exist");

    for (const b of blueprints) {
      assert.ok(b.systemComponents.length > 0, `Blueprint ${b.id} must specify component architecture table`);
      assert.ok(b.acceptanceCriteria.length > 0, `Blueprint ${b.id} must specify acceptance criteria`);
    }

    const ranked = rankProjectsForStudent(blueprints, ["Python", "FastAPI", "Redis"], "flipkart-grid-7");
    assert.equal(ranked.length, blueprints.length);
    assert.ok(ranked[0].matchScore >= ranked[ranked.length - 1].matchScore, "Must sort blueprints descending by matchScore");
  });

  test("5. Autonomous Mock Assessment Engine synthesizes and evaluates opportunity tests", () => {
    const session = autonomousAssessmentEngine.generateAutonomousAssessment("flipkart-grid-7", "intermediate", ["DSA"]);
    assert.ok(session.questions.length >= 2, "Must generate assessment questions");
    assert.ok(session.totalMarks > 0, "Total marks must be > 0");

    // Submit empty / poor responses to check remediation routing
    const weakEval = autonomousAssessmentEngine.evaluateAssessmentResponses(session, {});
    assert.equal(weakEval.passed, false);
    assert.equal(weakEval.verdict, "NEEDS_REMEDIATION");
    assert.ok(weakEval.weakAreaRemediationLinks.length > 0, "Failed assessment must generate direct arena remediation links");

    // Submit strong responses
    const strongResponses: Record<string, string> = {};
    for (const q of session.questions) {
      if (q.type === "conceptual" && q.correctAnswer) {
        strongResponses[q.id] = q.correctAnswer;
      } else {
        strongResponses[q.id] = "Use atomic Redis Lua scripts to enforce serialized inventory decrements with idempotency keys and bounded deadlock timeouts.";
      }
    }

    const strongEval = autonomousAssessmentEngine.evaluateAssessmentResponses(session, strongResponses);
    assert.equal(strongEval.passed, true);
    assert.ok(strongEval.percentage >= 70, `Expected high score, got ${strongEval.percentage}%`);
  });

  test("6. SQLite Driver resolves DatabaseSync safely without static Webpack scheme imports", () => {
    // 1. Verify runtime SQL execution via safe driver
    const db = createInMemoryDatabase();
    db.exec("CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT);");
    db.exec("INSERT INTO items (id, name) VALUES (1, 'Cognalyze');");
    const rows = db.prepare("SELECT * FROM items;").all();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, "Cognalyze");
    db.close();

    // 2. Verify zero static 'from "node:sqlite"' in source directories
    const dirs = ["lib", "app", "components"];
    const scanDir = (dirPath: string): string[] => {
      const results: string[] = [];
      for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
        const full = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          results.push(...scanDir(full));
        } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          const content = fs.readFileSync(full, "utf8");
          if (/^\s*import\s+[\s\S]*?\s+from\s+["']node:sqlite["']/m.test(content)) {
            results.push(full);
          }
        }
      }
      return results;
    };

    const offendingFiles = dirs.flatMap(d => scanDir(path.join(process.cwd(), d)));
    assert.deepEqual(offendingFiles, [], "No source files may contain static import from 'node:sqlite'");
  });
});
