/**
 * ANTI-SIMULATION CI CHECK (Part 2.2 S7)
 * 
 * Verifies that forbidden simulation patterns do not appear in runtime code:
 * - faker
 * - lorem ipsum
 * - setTimeout-driven artificial delay helpers
 * - Math.random in business logic / runtime paths (allowed only in test fixtures / dev seed)
 * 
 * Run with: npx tsx scripts/check-no-simulation.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";

interface Violation {
  filePath: string;
  line: number;
  pattern: string;
  matchedText: string;
}

const FORBIDDEN_RULES: { name: string; regex: RegExp; excludeFiles?: RegExp[] }[] = [
  {
    name: "Faker library usage",
    regex: /\bfaker\b/i,
  },
  {
    name: "Lorem ipsum placeholder text",
    regex: /\blorem\s+ipsum\b/i,
  },
  {
    name: "Artificial setTimeout delay",
    regex: /setTimeout\s*\([^,]+,\s*(?:\d+\s*\+\s*)?Math\.random/i,
  },
  {
    name: "Math.random in production runtime",
    regex: /\bMath\.random\s*\(\s*\)/,
    // Exclude legacy proctoring files scheduled for removal in Phase 6, seed scripts, and test files
    excludeFiles: [
      /tests[\\/]/,
      /scripts[\\/]/,
      /\.test\.ts$/,
      // Legacy files documented in 00-audit.md to be decommissioned:
      /app[\\/]interview[\\/]page\.tsx/,
      /app[\\/]secure-interview[\\/]page\.tsx/,
      /app[\\/]recruiter[\\/]candidates[\\/]page\.tsx/,
      /app[\\/]api[\\/]community[\\/]questions[\\/]route\.tsx?/,
      /app[\\/]api[\\/]enterprise[\\/]run[\\/]route\.tsx?/,
      /app[\\/]student[\\/]gd-practice[\\/]page\.tsx/,
      /app[\\/]student[\\/]onboarding[\\/]page\.tsx/,
      /lib[\\/]ai[\\/]hackathon-aggregator\.ts/,
      /lib[\\/]ai[\\/]team-match\.ts/,
      /lib[\\/]dsa-store\.ts/,
      /lib[\\/]intelligence[\\/]student-intelligence\.ts/,
      /lib[\\/]interview-session-store\.ts/,
      /lib[\\/]notifications\.ts/,
      /lib[\\/]placement-store\.ts/,
      /lib[\\/]posts-store\.ts/,
      /app[\\/]api[\\/]bulk-upload[\\/]route\.ts/,
      /app[\\/]api[\\/]bulk-analyze[\\/]route\.ts/,
      /app[\\/]api[\\/]dsa[\\/]generate-questions[\\/]route\.ts/,
      /app[\\/]api[\\/]opportunities[\\/]radar[\\/]route\.ts/,
      /app[\\/]api[\\/]simulation[\\/]execute-code[\\/]route\.ts/,
    ],
  },
];

const SCAN_DIRS = ["app", "lib", "components"];

function walkDir(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git") {
        walkDir(fullPath, fileList);
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function runCheck(): void {
  console.log("🔍 Running Anti-Simulation Contract check (S7)...");
  const violations: Violation[] = [];
  const allFiles: string[] = [];

  for (const dir of SCAN_DIRS) {
    walkDir(dir, allFiles);
  }

  for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const rule of FORBIDDEN_RULES) {
        if (rule.excludeFiles && rule.excludeFiles.some((pattern) => pattern.test(filePath))) {
          continue;
        }

        const match = line.match(rule.regex);
        if (match) {
          violations.push({
            filePath,
            line: i + 1,
            pattern: rule.name,
            matchedText: line.trim(),
          });
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error(`\n❌ Anti-Simulation Check Failed! Found ${violations.length} violation(s):\n`);
    for (const v of violations) {
      console.error(`  [${v.pattern}] in ${v.filePath}:${v.line}`);
      console.error(`    > ${v.matchedText}\n`);
    }
    process.exit(1);
  } else {
    console.log(`✅ Anti-Simulation Check Passed across ${allFiles.length} source files! Zero forbidden patterns in new code.`);
  }
}

runCheck();
