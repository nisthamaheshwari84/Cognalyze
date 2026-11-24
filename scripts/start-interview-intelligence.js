import { execSync, spawn } from "child_process";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const interviewDir = path.resolve(projectRoot, "interview-intelligence");

function checkPortInUse(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      resolve(true);
    });
    req.on("error", () => {
      try {
        const out = execSync(`lsof -i :${port} -t 2>/dev/null`, { encoding: "utf8" });
        resolve(Boolean(out.trim()));
      } catch {
        resolve(false);
      }
    });
    req.setTimeout(1000, () => {
      req.destroy();
      try {
        const out = execSync(`lsof -i :${port} -t 2>/dev/null`, { encoding: "utf8" });
        resolve(Boolean(out.trim()));
      } catch {
        resolve(false);
      }
    });
  });
}

async function main() {
  const inUse = await checkPortInUse(3001);
  if (inUse) {
    console.log("====================================================");
    console.log("⚡ Cognalyze Personalized Interview Arena Engine is ACTIVE!");
    console.log("   Port 3001 is already running and ready to accept requests.");
    console.log("   Dedicated URL: http://localhost:3001");
    console.log("   Cognalyze Arena: http://localhost:3000/student/practice-interview");
    console.log("====================================================");
    // Keep alive or exit smoothly so npm run doesn't fail
    process.exit(0);
    return;
  }

  console.log("Starting Interview Intelligence Engine on port 3001...");
  // Prefer bun if available, else fall back to tsx
  let runner = "bun";
  try {
    execSync("which bun", { stdio: "ignore" });
  } catch {
    runner = "npx tsx";
  }

  const child = spawn(runner, runner === "bun" ? ["server.ts"] : ["server.ts"], {
    cwd: interviewDir,
    stdio: "inherit",
    env: { ...process.env, PORT: "3001" },
    shell: true,
  });

  child.on("exit", (code) => {
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error("Failed to run Interview Intelligence:", err);
  process.exit(1);
});
