import { describe, it, before } from "node:test";
import assert from "node:assert";
import { NextRequest } from "next/server";
import { POST as createRoleRoute, GET as getRolesRoute } from "../app/api/roles/route";
import { GET as getCollabFeedRoute } from "../app/api/feed/collaboration/route";
import { POST as applyRoute } from "../app/api/roles/[roleId]/apply/route";
import { PATCH as closeRoleRoute, GET as getRoleRoute } from "../app/api/roles/[roleId]/route";
import { seedStudentData, createRole } from "../lib/collab/store";

describe("Recruiter Role -> Collaboration Feed -> Student Apply (with Auto-DNA) Test Suite", () => {
  const recruiterId = "recruiter_test_101";
  const studentWithDna = "student_dna_verified_202";
  const studentWithoutDna = "student_no_dna_303";
  const foreignStudent = "student_foreign_404";

  const studentResumeId = `resume_${studentWithDna}_primary`;
  const foreignResumeId = `resume_${foreignStudent}_primary`;

  const studentDnaData = {
    candidate_id: studentWithDna,
    skills: [{ name: "React", level: "Expert", verified_on_github: true }],
    radar: { technical_depth: 92, problem_solving: 88 },
  };

  before(() => {
    // Seed verified student data (resume & analysis)
    seedStudentData(studentWithDna, studentResumeId, studentDnaData);
    seedStudentData(foreignStudent, foreignResumeId, { candidate_id: foreignStudent, skills: [] });
  });

  // Helper to create test NextRequest
  function makeReq(
    url: string,
    method: string,
    body?: any,
    user?: { id: string; role: "student" | "recruiter" | "admin" }
  ) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (user) {
      headers["x-test-user-id"] = user.id;
      headers["x-test-role"] = user.role;
    }

    return new NextRequest(new URL(url, "http://localhost:3000"), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Role Posting (Recruiter -> Collaboration Feed only)
  // ─────────────────────────────────────────────────────────────
  describe("1. Role Creation & Immutability Rules", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const req = makeReq("http://localhost:3000/api/roles", "POST", {
        title: "Senior Backend Engineer",
        description: "Build distributed microservices in Go.",
      });

      const res = await createRoleRoute(req);
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.match(data.error, /Not authenticated/i);
    });

    it("rejects non-recruiters (students) from posting roles with 403", async () => {
      const req = makeReq(
        "http://localhost:3000/api/roles",
        "POST",
        {
          title: "Malicious Student Role",
          description: "Attempting to post as student.",
        },
        { id: studentWithDna, role: "student" }
      );

      const res = await createRoleRoute(req);
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.match(data.error, /Only recruiters can post roles/i);
    });

    it("creates an open role and GUARANTEES feed_type is hardcoded to 'collaboration'", async () => {
      const req = makeReq(
        "http://localhost:3000/api/roles",
        "POST",
        {
          title: "Lead AI Platform Engineer",
          description: "Architect high-performance inference pipelines.",
          required_skills: ["Python", "PyTorch", "Kubernetes"],
          feed_type: "post", // Attempt to inject 'post' feed — must be ignored!
        },
        { id: recruiterId, role: "recruiter" }
      );

      const res = await createRoleRoute(req);
      assert.strictEqual(res.status, 201);
      const data = await res.json();

      assert.ok(data.role);
      assert.strictEqual(data.role.title, "Lead AI Platform Engineer");
      assert.strictEqual(data.role.feed_type, "collaboration"); // Guaranteed
      assert.strictEqual(data.role.status, "open");
      assert.deepStrictEqual(data.role.required_skills, ["Python", "PyTorch", "Kubernetes"]);
    });

    it("requires title and description to be non-empty", async () => {
      const req = makeReq(
        "http://localhost:3000/api/roles",
        "POST",
        { title: " ", description: "" },
        { id: recruiterId, role: "recruiter" }
      );

      const res = await createRoleRoute(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /title and description are required/i);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Collaboration Feed Viewing Rules
  // ─────────────────────────────────────────────────────────────
  describe("2. Collaboration Feed Viewing & Access Control", () => {
    it("rejects unauthenticated requests to view collaboration feed with 401", async () => {
      const req = makeReq("http://localhost:3000/api/feed/collaboration", "GET");
      const res = await getCollabFeedRoute(req);
      assert.strictEqual(res.status, 401);
    });

    it("rejects recruiters from browsing student collaboration feed with 403", async () => {
      const req = makeReq(
        "http://localhost:3000/api/feed/collaboration",
        "GET",
        undefined,
        { id: recruiterId, role: "recruiter" }
      );

      const res = await getCollabFeedRoute(req);
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.match(data.error, /Only students can view the collaboration feed/i);
    });

    it("allows authenticated students to view open collaboration roles", async () => {
      const req = makeReq(
        "http://localhost:3000/api/feed/collaboration",
        "GET",
        undefined,
        { id: studentWithDna, role: "student" }
      );

      const res = await getCollabFeedRoute(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();

      assert.ok(Array.isArray(data.feed));
      const targetRole = data.feed.find((r: any) => r.title === "Lead AI Platform Engineer");
      assert.ok(targetRole);
      assert.strictEqual(targetRole.feed_type, "collaboration");
      assert.strictEqual(targetRole.status, "open");
      assert.strictEqual(targetRole.already_applied, false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Student Apply & Auto-Attached DNA Snapshot Rules
  // ─────────────────────────────────────────────────────────────
  describe("3. Student Apply & Frozen DNA Snapshot Rules", () => {
    let createdRoleId: string;

    before(async () => {
      const role = await createRole({
        recruiter_id: recruiterId,
        title: "Fullstack Product Engineer",
        description: "Join our founding team building collaborative tools.",
        required_skills: ["TypeScript", "Next.js"],
      });
      createdRoleId = role.id;
    });

    it("rejects recruiters from applying with 403", async () => {
      const req = makeReq(
        `http://localhost:3000/api/roles/${createdRoleId}/apply`,
        "POST",
        { resume_id: studentResumeId },
        { id: recruiterId, role: "recruiter" }
      );

      const res = await applyRoute(req, { params: Promise.resolve({ roleId: createdRoleId }) });
      assert.strictEqual(res.status, 403);
    });

    it("rejects application if resume_id is missing", async () => {
      const req = makeReq(
        `http://localhost:3000/api/roles/${createdRoleId}/apply`,
        "POST",
        {},
        { id: studentWithDna, role: "student" }
      );

      const res = await applyRoute(req, { params: Promise.resolve({ roleId: createdRoleId }) });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /resume_id is required/i);
    });

    it("blocks application if resume belongs to another student", async () => {
      const req = makeReq(
        `http://localhost:3000/api/roles/${createdRoleId}/apply`,
        "POST",
        { resume_id: foreignResumeId }, // Foreign resume!
        { id: studentWithDna, role: "student" }
      );

      const res = await applyRoute(req, { params: Promise.resolve({ roleId: createdRoleId }) });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /Invalid resume for this student/i);
    });

    it("blocks application with HTTP 412 if student has NO DNA analysis on record", async () => {
      const req = makeReq(
        `http://localhost:3000/api/roles/${createdRoleId}/apply`,
        "POST",
        { resume_id: `resume_${studentWithoutDna}_primary` },
        { id: studentWithoutDna, role: "student" }
      );

      const res = await applyRoute(req, { params: Promise.resolve({ roleId: createdRoleId }) });
      assert.strictEqual(res.status, 412);
      const data = await res.json();
      assert.match(data.error, /No Cognalyze DNA analysis found/i);
    });

    it("submits application and automatically attaches frozen DNA snapshot", async () => {
      const req = makeReq(
        `http://localhost:3000/api/roles/${createdRoleId}/apply`,
        "POST",
        {
          resume_id: studentResumeId,
          github_url: "https://github.com/janedoe/real-project",
        },
        { id: studentWithDna, role: "student" }
      );

      const res = await applyRoute(req, { params: Promise.resolve({ roleId: createdRoleId }) });
      assert.strictEqual(res.status, 201);
      const data = await res.json();

      assert.ok(data.application);
      assert.strictEqual(data.application.role_id, createdRoleId);
      assert.strictEqual(data.application.student_id, studentWithDna);
      assert.strictEqual(data.application.resume_id, studentResumeId);
      assert.strictEqual(data.application.github_url, "https://github.com/janedoe/real-project");

      // Verify frozen DNA snapshot was copied
      assert.ok(data.application.dna_snapshot);
      assert.strictEqual(data.application.dna_snapshot.candidate_id, studentWithDna);
      assert.deepStrictEqual(data.application.dna_snapshot.skills, studentDnaData.skills);
    });

    it("prevents duplicate applications from the same student with HTTP 409", async () => {
      const req = makeReq(
        `http://localhost:3000/api/roles/${createdRoleId}/apply`,
        "POST",
        { resume_id: studentResumeId },
        { id: studentWithDna, role: "student" }
      );

      const res = await applyRoute(req, { params: Promise.resolve({ roleId: createdRoleId }) });
      assert.strictEqual(res.status, 409);
      const data = await res.json();
      assert.match(data.error, /already applied/i);
    });

    it("marks already_applied = true in the collaboration feed for the applied student", async () => {
      const req = makeReq(
        "http://localhost:3000/api/feed/collaboration",
        "GET",
        undefined,
        { id: studentWithDna, role: "student" }
      );

      const res = await getCollabFeedRoute(req);
      const data = await res.json();

      const appliedRole = data.feed.find((r: any) => r.id === createdRoleId);
      assert.ok(appliedRole);
      assert.strictEqual(appliedRole.already_applied, true);
    });

    it("allows recruiter to inspect submitted applications with frozen DNA snapshot", async () => {
      const req = makeReq(
        `http://localhost:3000/api/roles/${createdRoleId}`,
        "GET",
        undefined,
        { id: recruiterId, role: "recruiter" }
      );

      const res = await getRoleRoute(req, { params: Promise.resolve({ roleId: createdRoleId }) });
      assert.strictEqual(res.status, 200);
      const data = await res.json();

      assert.ok(Array.isArray(data.applications));
      assert.strictEqual(data.applications.length, 1);
      assert.strictEqual(data.applications[0].student_id, studentWithDna);
      assert.deepStrictEqual(data.applications[0].dna_snapshot.skills, studentDnaData.skills);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Role Lifecycle: Closing Roles
  // ─────────────────────────────────────────────────────────────
  describe("4. Role Lifecycle & Feed Disappearance", () => {
    let lifecycleRoleId: string;

    before(async () => {
      const role = await createRole({
        recruiter_id: recruiterId,
        title: "Frontend Architect",
        description: "Lead UI architecture.",
        required_skills: ["React", "CSS Modules"],
      });
      lifecycleRoleId = role.id;
    });

    it("allows recruiter to close role", async () => {
      const req = makeReq(
        `http://localhost:3000/api/roles/${lifecycleRoleId}`,
        "PATCH",
        { status: "closed" },
        { id: recruiterId, role: "recruiter" }
      );

      const res = await closeRoleRoute(req, { params: Promise.resolve({ roleId: lifecycleRoleId }) });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, "closed");
    });

    it("closed role disappears from the collaboration feed", async () => {
      const req = makeReq(
        "http://localhost:3000/api/feed/collaboration",
        "GET",
        undefined,
        { id: studentWithDna, role: "student" }
      );

      const res = await getCollabFeedRoute(req);
      const data = await res.json();

      const found = data.feed.find((r: any) => r.id === lifecycleRoleId);
      assert.strictEqual(found, undefined);
    });

    it("rejects application to closed role with HTTP 409", async () => {
      const req = makeReq(
        `http://localhost:3000/api/roles/${lifecycleRoleId}/apply`,
        "POST",
        { resume_id: studentResumeId },
        { id: studentWithDna, role: "student" }
      );

      const res = await applyRoute(req, { params: Promise.resolve({ roleId: lifecycleRoleId }) });
      assert.strictEqual(res.status, 409);
      const data = await res.json();
      assert.match(data.error, /no longer open/i);
    });
  });
});
