/**
 * lib/skills/code-comprehension/tutor-engine.ts
 * 
 * Context-Aware AI Engineering Tutor for Code Comprehension Lab.
 * Retrieves repository context, architecture graphs, and test outputs
 * to provide grounded, 3-level engineering mentorship without hallucinations.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCodebaseById, searchCodebaseContent } from "./codebase-library";
import { getChallengeById } from "./challenge-factory";

export interface TutorResponse {
  assistanceLevel: "hint" | "guided" | "full";
  reply: string;
  citedFiles: string[];
  suggestedNextSteps: string[];
  confidence: number;
}

export async function askEngineeringTutor(params: {
  challengeId: string;
  userQuestion: string;
  assistanceLevel?: "hint" | "guided" | "full";
  activeFile?: string;
  conversationHistory?: Array<{ sender: "candidate" | "tutor"; text: string }>;
}): Promise<TutorResponse> {
  const challenge = getChallengeById(params.challengeId);
  if (!challenge) {
    throw new Error(`CHALLENGE_NOT_FOUND: ${params.challengeId}`);
  }

  const codebase = getCodebaseById(challenge.codebaseId);
  if (!codebase) {
    throw new Error(`CODEBASE_NOT_FOUND: ${challenge.codebaseId}`);
  }

  const level = params.assistanceLevel || "guided";

  // Gather relevant repository context: search keywords from user question in codebase
  const searchTerms = params.userQuestion.split(/\s+/).filter(w => w.length > 3).slice(0, 3);
  let retrievedSnippets: string[] = [];
  for (const term of searchTerms) {
    const matches = searchCodebaseContent(codebase.id, term);
    for (const m of matches.slice(0, 2)) {
      retrievedSnippets.push(`[${m.path}:${m.lineNumber}] ${m.lineContent}`);
    }
  }

  const relevantFilesList = challenge.relevantFiles.join(", ");
  const activeFileContext = params.activeFile && codebase.files[params.activeFile]?.content
    ? `ACTIVE OPEN FILE (${params.activeFile}):\n${codebase.files[params.activeFile]?.content?.slice(0, 1000)}...`
    : "";

  const systemInstruction = `You are a Senior Principal Staff Engineer serving as an AI Engineering Tutor for Cognalyze Code Comprehension Lab.
You are mentoring a software engineering student investigating the real codebase: "${codebase.title}".

CHALLENGE: "${challenge.title}" (${challenge.mode})
OBJECTIVES: ${challenge.learningObjectives.join("; ")}
RELEVANT FILES: ${relevantFilesList}

CURRENT ASSISTANCE LEVEL: "${level.toUpperCase()}"
- If "HINT": Point the student towards the exact file or concept to inspect. Do NOT give away the full answer or fix. Ask a targeted diagnostic question.
- If "GUIDED": Explain the mechanics of the relevant code path and prompt them to predict the root cause or edge case.
- If "FULL": Provide an end-to-end technical breakdown of the architecture, data flow, failure mode, and production trade-offs.

RULES:
1. Always reference ACTUAL files from the repository (${relevantFilesList}). Do NOT invent imaginary classes, files, or external libraries.
2. If citing code, reference real mechanisms in ${codebase.title}.
3. Keep tone objective, encouraging, and razor-sharp technical.
4. Output concise GitHub-style markdown.`;

  // Try LLM generation if GEMINI_API_KEY is available
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `${systemInstruction}

REPOSITORY EVIDENCE:
${retrievedSnippets.join("\n") || "Primary architecture and route definitions available."}

${activeFileContext}

STUDENT QUESTION: "${params.userQuestion}"

Respond with an insightful, grounded explanation matching the ${level} level.`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();

      return {
        assistanceLevel: level,
        reply: text,
        citedFiles: challenge.relevantFiles,
        suggestedNextSteps: [
          `Inspect ${challenge.relevantFiles[0]} to verify the call sequence.`,
          "Run the test suite to observe runtime assertions.",
        ],
        confidence: 90,
      };
    } catch (err) {
      console.warn("[tutor-engine] Gemini API call fallback triggered:", err);
    }
  }

  // Deterministic Grounded Fallback
  return generateDeterministicTutorReply(challenge.id, params.userQuestion, level, challenge.relevantFiles);
}

function generateDeterministicTutorReply(
  challengeId: string,
  question: string,
  level: "hint" | "guided" | "full",
  relevantFiles: string[]
): TutorResponse {
  const qLower = question.toLowerCase();

  if (challengeId === "detective-taskflow-auth") {
    if (level === "hint") {
      return {
        assistanceLevel: "hint",
        reply: `Look closely at **src/middleware/auth.ts** and **src/controllers/task.controller.ts**. Notice how \`authenticateUser\` verifies the JWT and attaches \`req.user = decoded\`. Where is \`req.user.organizationId\` subsequently passed?`,
        citedFiles: ["src/middleware/auth.ts", "src/controllers/task.controller.ts"],
        suggestedNextSteps: ["Open src/middleware/auth.ts to check the JWT payload decode.", "Check how TaskRepository.findById filters by organizationId."],
        confidence: 95,
      };
    }
    return {
      assistanceLevel: level,
      reply: `### Request Flow & Tenant Isolation Architecture
1. **Authentication**: The client sends an HTTP request with \`Authorization: Bearer <token>\`. In \`src/middleware/auth.ts\`, \`authenticateUser\` decodes the token, validating its signature against \`JWT_SECRET\`, and assigns \`req.user = { id, organizationId, role }\`.
2. **Controller Boundary**: \`TaskController\` unpacks the validated Zod schema and explicitly passes \`user.organizationId\` down to \`TaskService\` and \`TaskRepository\`.
3. **Multi-Tenant Protection**: In \`src/repositories/task.repository.ts\`, every SQL/data query enforces \`item.organizationId === orgId\`. If a user queries an existing task belonging to another organization, the repository returns \`null\`, denying cross-tenant data leakage.`,
      citedFiles: ["src/routes/task.routes.ts", "src/middleware/auth.ts", "src/repositories/task.repository.ts"],
      suggestedNextSteps: ["Run test-auth-tenant-isolation to verify cross-tenant queries return null."],
      confidence: 95,
    };
  }

  if (challengeId === "bughunter-taskflow-rbac") {
    if (level === "hint") {
      return {
        assistanceLevel: "hint",
        reply: `Compare the route declarations in **src/routes/task.routes.ts**. Look at \`POST /\` vs \`PATCH /:id/status\`. What middleware is protecting task creation that is completely absent on status updates?`,
        citedFiles: ["src/routes/task.routes.ts"],
        suggestedNextSteps: ["Inspect lines 12-16 in src/routes/task.routes.ts.", "Check what requireRole(['admin', 'member']) does."],
        confidence: 95,
      };
    }
    return {
      assistanceLevel: level,
      reply: `### Root-Cause Diagnosis: Missing Route RBAC Guard
In \`src/routes/task.routes.ts\`:
- \`POST /\` uses \`requireRole(["admin", "member"])\`
- \`DELETE /:id\` uses \`requireRole(["admin"])\`
- However, **\`PATCH /:id/status\` only relies on the router-level \`authenticateUser\` middleware!**

Any authenticated user with a valid JWT—including read-only \`viewer\` accounts—can issue a \`PATCH /api/v1/tasks/:id/status\` request and advance tasks.

**Correction**:
Attach \`requireRole(["admin", "member"])\` directly to the \`PATCH /:id/status\` route handler.`,
      citedFiles: ["src/routes/task.routes.ts", "src/middleware/auth.ts"],
      suggestedNextSteps: ["Apply the requireRole middleware fix to src/routes/task.routes.ts.", "Run tests to verify viewers receive 403 Forbidden."],
      confidence: 98,
    };
  }

  // Generic fallback
  return {
    assistanceLevel: level,
    reply: `In this challenge, examine the interactions between ${relevantFiles.join(" and ")}. Review how parameters are validated, how errors are propagated, and whether edge cases (such as concurrent requests or missing permissions) are handled safely.`,
    citedFiles: relevantFiles,
    suggestedNextSteps: ["Review the test suite to understand expected invariants.", "Trace the execution path from entrypoint to data access."],
    confidence: 85,
  };
}
