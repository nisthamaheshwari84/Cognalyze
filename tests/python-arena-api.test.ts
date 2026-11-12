import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GET, POST } from "../app/api/skills/python-arena/route";
import { NextRequest } from "next/server";

describe("Python Arena: API Pipeline", () => {
  it("GET ?action=get_curriculum returns all 7 parts", async () => {
    const req = new NextRequest("http://localhost:3000/api/skills/python-arena?action=get_curriculum");
    const res = await GET(req);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.parts.length, 7);
    assert.equal(data.parts[0].id, "part_a");
    assert.equal(data.parts[6].id, "part_g");
    assert.ok(data.totalSubtopics >= 10);
  });

  it("GET ?action=get_questions returns curated questions with filters", async () => {
    const req = new NextRequest("http://localhost:3000/api/skills/python-arena?action=get_questions&difficulty=beginner");
    const res = await GET(req);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.questions.length >= 1);
    assert.ok(data.questions.every((q: any) => q.difficulty === "beginner"));
  });

  it("POST action=execute_code runs sample tests and full submit with DNA update", async () => {
    const candidateId = `cand_test_${Date.now()}`;
    const code = `
def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []
`;
    // 1. Run samples
    const reqRun = new NextRequest("http://localhost:3000/api/skills/python-arena", {
      method: "POST",
      body: JSON.stringify({
        action: "execute_code",
        candidateId,
        questionId: "py-q-placements-01",
        code,
        mode: "run_samples",
      }),
    });
    const resRun = await POST(reqRun);
    const dataRun = await resRun.json();
    assert.equal(dataRun.success, true);
    assert.equal(dataRun.result.status, "passed");
    assert.equal(dataRun.result.passedCount, 3);

    // 2. Full submit
    const reqSub = new NextRequest("http://localhost:3000/api/skills/python-arena", {
      method: "POST",
      body: JSON.stringify({
        action: "execute_code",
        candidateId,
        questionId: "py-q-placements-01",
        code,
        mode: "submit",
      }),
    });
    const resSub = await POST(reqSub);
    const dataSub = await resSub.json();
    assert.equal(dataSub.success, true);
    assert.equal(dataSub.result.status, "passed");
    assert.equal(dataSub.result.score, 100);
    assert.equal(dataSub.dnaSyncSuccess, true);
    assert.ok(dataSub.submission?.id);

    // 3. Verify progress updated
    const reqProg = new NextRequest(`http://localhost:3000/api/skills/python-arena?action=get_progress&candidateId=${candidateId}`);
    const resProg = await GET(reqProg);
    const dataProg = await resProg.json();
    assert.equal(dataProg.success, true);
    assert.equal(dataProg.progress.totalQuestionsAttempted, 1);
    assert.equal(dataProg.progress.totalQuestionsSolved, 1);
    assert.equal(dataProg.progress.solveRatePercent, 100);
  });

  it("POST action=get_hint provides progressive Socratic hint scaffolding", async () => {
    const req = new NextRequest("http://localhost:3000/api/skills/python-arena", {
      method: "POST",
      body: JSON.stringify({
        action: "get_hint",
        questionId: "py-q-placements-01",
        requestedTier: 1,
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.hint.currentTier, 1);
    assert.equal(data.hint.tierName, "Conceptual Framing");
    assert.equal(data.hint.canAdvance, true);
  });

  it("POST action=generate_notes creates printable revision document", async () => {
    const req = new NextRequest("http://localhost:3000/api/skills/python-arena", {
      method: "POST",
      body: JSON.stringify({
        action: "generate_notes",
        candidateId: "cand_test",
        subtopicId: "py-foundations-what-is-python",
        mode: "quick_revision",
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.document.htmlContent.includes("Cognalyze Python Practice"));
    assert.equal(data.document.mode, "quick_revision");
  });
});

