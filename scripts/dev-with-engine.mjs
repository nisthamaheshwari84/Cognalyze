import { execSync, spawn } from "child_process";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const interviewDir = path.resolve(projectRoot, "interview-intelligence");

function isPortHealthy(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  const children = [];
  let shuttingDown = false;

  const shutdown = (signal = "SIGTERM") => {
    if (shuttingDown) return;
    shuttingDown = true;
    for (const child of children) {
      try {
        child.kill(signal);
      } catch {
        // Ignore already-exited processes
      }
    }
  };

  process.on("SIGINT", () => {
    shutdown("SIGINT");
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    shutdown("SIGTERM");
    process.exit(0);
  });

  const engineUp = await isPortHealthy(3001);
  if (!engineUp) {
    let hasBun = false;
    try {
      execSync("which bun", { stdio: "ignore" });
      hasBun = true;
    } catch {
      hasBun = false;
    }

    const engineCmd = hasBun ? "bun" : "npx";
    const engineArgs = hasBun ? ["server.ts"] : ["tsx", "server.ts"];
    const engineProc = spawn(engineCmd, engineArgs, {
      cwd: interviewDir,
      stdio: "inherit",
      env: { ...process.env, PORT: "3001" },
    });
    children.push(engineProc);
    engineProc.on("exit", (code) => {
      if (!shuttingDown && code && code !== 0) {
        console.warn(`[dev] Interview Intelligence engine exited with code ${code}`);
      }
    });
  } else {
    console.log("[dev] Interview Intelligence engine already running on http://localhost:3001");
  }

  const nextProc = spawn("npx", ["next", "dev", "--webpack"], {
    cwd: projectRoot,
    stdio: "inherit",
    env: process.env,
  });
  children.push(nextProc);

  nextProc.on("exit", (code) => {
    shutdown("SIGTERM");
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error("Failed to start Cognalyze dev workspace:", err);
  process.exit(1);
});
