import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  getDraftKey,
  getStorageKey,
  getProblemStarterCode,
  loadDraftsFromStorage,
  saveDraftToStorage,
  clearDraftFromStorage,
  resolveProblemCode,
  SupportedLanguage
} from "../lib/skills/dsa-code-persistence";
import { getStriverProblemById } from "../lib/skills/striver-curriculum";

describe("DSA Arena Code Editor Persistence & State Management", () => {
  // Mock localStorage for node test environment
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      }
    };
  })();

  beforeEach(() => {
    localStorageMock.clear();
    (global as any).window = {
      localStorage: localStorageMock
    };
  });

  it("1. Generates unique composite keys for (problemId, language)", () => {
    const key1 = getDraftKey("count-digits-in-a-number", "cpp");
    const key2 = getDraftKey("count-digits-in-a-number", "python");
    const key3 = getDraftKey("painter-s-partition-problem", "cpp");

    assert.strictEqual(key1, "count-digits-in-a-number::cpp");
    assert.strictEqual(key2, "count-digits-in-a-number::python");
    assert.strictEqual(key3, "painter-s-partition-problem::cpp");
    assert.notStrictEqual(key1, key2);
    assert.notStrictEqual(key1, key3);
  });

  it("2. Resolves fresh starter code when no draft exists", () => {
    const prob = getStriverProblemById("count-digits-in-a-number");
    const result = resolveProblemCode({
      problem: prob,
      language: "cpp",
      candidateId: "user-123",
      inMemoryDrafts: {}
    });

    assert.strictEqual(result.isFromDraft, false);
    assert.strictEqual(result.source, "starter_template");
    assert.ok(result.code.includes("countDigits"));
  });

  it("3. CRUCIAL: Deleting starter code to empty string ('') is preserved and NEVER overwritten", () => {
    const prob = getStriverProblemById("count-digits-in-a-number");
    const inMemoryDrafts: Record<string, string> = {
      [getDraftKey(prob.id, "cpp")]: "" // User deleted all code!
    };

    const result = resolveProblemCode({
      problem: prob,
      language: "cpp",
      candidateId: "user-123",
      inMemoryDrafts
    });

    assert.strictEqual(result.isFromDraft, true);
    assert.strictEqual(result.source, "in_memory_draft");
    assert.strictEqual(result.code, "", "Empty string must be respected as an intentional user draft");
  });

  it("4. Student code implementation is preserved against starter code resets", () => {
    const prob = getStriverProblemById("count-digits-in-a-number");
    const userImplementation = `int countDigits(int n) {\n    if (n == 0) return 1;\n    int cnt = 0;\n    while (n > 0) { cnt++; n /= 10; }\n    return cnt;\n}`;
    const inMemoryDrafts: Record<string, string> = {
      [getDraftKey(prob.id, "cpp")]: userImplementation
    };

    const result = resolveProblemCode({
      problem: prob,
      language: "cpp",
      candidateId: "user-123",
      inMemoryDrafts
    });

    assert.strictEqual(result.isFromDraft, true);
    assert.strictEqual(result.source, "in_memory_draft");
    assert.strictEqual(result.code, userImplementation);
  });

  it("5. Isolates code drafts across different problems", () => {
    const probA = getStriverProblemById("count-digits-in-a-number");
    const probB = getStriverProblemById("painter-s-partition-problem");

    const codeA = "// Solution for Count Digits";
    const codeB = "// Solution for Painter Partition";

    const inMemoryDrafts: Record<string, string> = {
      [getDraftKey(probA.id, "cpp")]: codeA,
      [getDraftKey(probB.id, "cpp")]: codeB
    };

    const resultA = resolveProblemCode({
      problem: probA,
      language: "cpp",
      candidateId: "user-123",
      inMemoryDrafts
    });

    const resultB = resolveProblemCode({
      problem: probB,
      language: "cpp",
      candidateId: "user-123",
      inMemoryDrafts
    });

    assert.strictEqual(resultA.code, codeA);
    assert.strictEqual(resultB.code, codeB);
  });

  it("6. Isolates code drafts across different programming languages for the same problem", () => {
    const prob = getStriverProblemById("count-digits-in-a-number");
    const cppCode = "int countDigits(int n) { return 5; }";
    const pyCode = "def countDigits(n: int) -> int:\n    return 5";

    const inMemoryDrafts: Record<string, string> = {
      [getDraftKey(prob.id, "cpp")]: cppCode,
      [getDraftKey(prob.id, "python")]: pyCode
    };

    const resultCpp = resolveProblemCode({
      problem: prob,
      language: "cpp",
      candidateId: "user-123",
      inMemoryDrafts
    });

    const resultPy = resolveProblemCode({
      problem: prob,
      language: "python",
      candidateId: "user-123",
      inMemoryDrafts
    });

    assert.strictEqual(resultCpp.code, cppCode);
    assert.strictEqual(resultPy.code, pyCode);
  });

  it("7. Persists draft to localStorage and recovers it across page reloads", () => {
    const prob = getStriverProblemById("count-digits-in-a-number");
    const savedCode = "// Recovered from localStorage session";

    saveDraftToStorage("user-456", prob.id, "cpp", savedCode);

    // Verify localStorage has it
    const stored = loadDraftsFromStorage("user-456");
    assert.strictEqual(stored[getDraftKey(prob.id, "cpp")], savedCode);

    // Resolve with empty in-memory drafts (simulating fresh page load)
    const result = resolveProblemCode({
      problem: prob,
      language: "cpp",
      candidateId: "user-456",
      inMemoryDrafts: {}
    });

    assert.strictEqual(result.isFromDraft, true);
    assert.strictEqual(result.source, "local_storage_draft");
    assert.strictEqual(result.code, savedCode);
  });

  it("8. Explicit 'Reset Starter' clears the draft and restores fresh starter code", () => {
    const prob = getStriverProblemById("count-digits-in-a-number");
    const userCode = "int myBrokenCode() {}";

    // Save custom draft
    saveDraftToStorage("user-789", prob.id, "cpp", userCode);
    const inMemoryDrafts: Record<string, string> = {
      [getDraftKey(prob.id, "cpp")]: userCode
    };

    // User clicks Reset Starter -> clear draft
    clearDraftFromStorage("user-789", prob.id, "cpp");
    delete inMemoryDrafts[getDraftKey(prob.id, "cpp")];

    // Resolve again
    const result = resolveProblemCode({
      problem: prob,
      language: "cpp",
      candidateId: "user-789",
      inMemoryDrafts
    });

    assert.strictEqual(result.isFromDraft, false);
    assert.strictEqual(result.source, "starter_template");
    assert.ok(result.code.includes("countDigits"));
  });

  it("9. Interview mode submitted code precedence when no local edits exist", () => {
    const prob = getStriverProblemById("count-digits-in-a-number");
    const interviewSubmitted = "// Code submitted during round 1";

    const result = resolveProblemCode({
      problem: prob,
      language: "cpp",
      candidateId: "candidate-live",
      inMemoryDrafts: {},
      interviewSubmittedCode: interviewSubmitted
    });

    assert.strictEqual(result.isFromDraft, true);
    assert.strictEqual(result.source, "interview_submission");
    assert.strictEqual(result.code, interviewSubmitted);
  });
});
