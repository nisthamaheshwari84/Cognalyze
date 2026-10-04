import { test } from "node:test";
import assert from "node:assert/strict";
import { extractEvidenceClaimsFromResume } from "@/app/api/parse-resume/route";
import { recordStudentEvent, getStudentIntelligenceProfile } from "@/lib/intelligence/student-intelligence";
import { invalidateStudentDNACache } from "@/lib/ai/student-dna";
import { getStudentProfileByUserId, upsertStudentProfileByUserId } from "@/lib/auth/store";
import { getStudentProfile, upsertStudentProfile } from "@/lib/placement-store";

test("Resume Parser: Extracts skills from technical sections and text", () => {
  const resumeText = `
Nistha Maheshwari
Computer Science & Engineering · BMS College of Engineering
SKILLS:
- Languages: Python, TypeScript, JavaScript, SQL, C++
- Web & Frameworks: React, Next.js, Node.js, FastAPI, Tailwind CSS
- Cloud & Infrastructure: Docker, PostgreSQL, Redis, Linux, Git
- AI & Data: Machine Learning, PyTorch, GenAI
`;

  const extracted = extractEvidenceClaimsFromResume(resumeText);
  assert.ok(extracted.skills.length >= 10, `Expected at least 10 skills, got ${extracted.skills.length}`);
  
  const skillNames = extracted.skills.map((s) => s.name);
  assert.ok(skillNames.includes("Python"), "Python must be extracted");
  assert.ok(skillNames.includes("TypeScript"), "TypeScript must be extracted");
  assert.ok(skillNames.includes("React"), "React must be extracted");
  assert.ok(skillNames.includes("PostgreSQL"), "PostgreSQL must be extracted");
  assert.ok(skillNames.includes("Docker"), "Docker must be extracted");
  assert.ok(skillNames.includes("GenAI"), "GenAI must be extracted");
});

test("Resume Parser: Extracts structured projects with tech stack and descriptions", () => {
  const resumeText = `
PROJECTS:
1. Distributed Opportunity Discovery Engine | Python, Next.js, PostgreSQL, Docker
- Engineered an automated career research engine analyzing student DNA across 1,000+ hiring sources
- Reduced query latency by 65% using async pipeline caching

2. Real-Time Interview Intelligence Bot | Python, PyTorch, FastAPI
- Built live question generation and response evaluation system
- Evaluated 500+ student responses against grounded rubric benchmarks
`;

  const extracted = extractEvidenceClaimsFromResume(resumeText);
  assert.ok(extracted.projects.length >= 2, `Expected at least 2 projects, got ${extracted.projects.length}`);

  const p1 = extracted.projects.find((p) => p.title.includes("Opportunity Discovery"));
  assert.ok(p1, "Must find Opportunity Discovery Engine project");
  assert.ok(p1.tech_stack.includes("Python"), "Must extract Python in tech stack");
  assert.ok(p1.tech_stack.includes("Next.js") || p1.tech_stack.includes("PostgreSQL"), "Must extract frameworks in tech stack");
  assert.ok(p1.description.length > 20, "Must extract non-empty description");

  const p2 = extracted.projects.find((p) => p.title.includes("Interview Intelligence"));
  assert.ok(p2, "Must find Interview Intelligence Bot project");
  assert.ok(p2.tech_stack.includes("PyTorch") || p2.tech_stack.includes("FastAPI"), "Must extract PyTorch/FastAPI in tech stack");
});

test("Student DNA & Evidence Sync: Updating resume evidence updates Student DNA capabilities", async () => {
  const candidateId = "u-student-nistha-001";

  const extracted = {
    skills: [
      { name: "Python", level: "Claimed", proficiency: "Advanced" },
      { name: "TypeScript", level: "Claimed", proficiency: "Advanced" },
      { name: "PostgreSQL", level: "Claimed", proficiency: "Advanced" },
      { name: "FastAPI", level: "Claimed", proficiency: "Intermediate" },
    ],
    projects: [
      {
        title: "Distributed Opportunity Discovery Engine",
        tech_stack: ["Python", "FastAPI", "PostgreSQL"],
        description: "Built high-throughput indexing engine for career intelligence",
      },
    ],
  };

  // 1. Record student event
  const result = await recordStudentEvent({
    studentId: candidateId,
    eventType: "resume_uploaded",
    payload: {
      skills: extracted.skills,
      projects: extracted.projects,
      filename: "test_resume.pdf",
    },
  });

  assert.ok(result.affectedCapabilities.length > 0, "Must affect capabilities in DNA");
  invalidateStudentDNACache(candidateId);

  // 2. Fetch updated intelligence
  const intel = getStudentIntelligenceProfile(candidateId);
  assert.ok(intel.totalEvidenceCount > 0, "Evidence count must be > 0");
  assert.ok(intel.capabilities["Python"], "Python capability must be updated");

  // 3. Update auth store
  upsertStudentProfileByUserId(candidateId, {
    resumeFileName: "test_resume.pdf",
    skills: extracted.skills.map((s) => ({ name: s.name, level: (s.proficiency as any) || "Intermediate" })),
    projects: extracted.projects.map((p) => ({
      title: p.title,
      description: p.description,
      techStack: p.tech_stack,
    })),
  });

  const profile = getStudentProfileByUserId(candidateId);
  assert.equal(profile?.resumeFileName, "test_resume.pdf");
  assert.ok(profile?.skills && profile.skills.length >= 4, "Auth profile skills must be updated");
});

test("End-to-End API: POST /api/parse-resume parses multipart FormData and JSON", async () => {
  const { POST } = await import("@/app/api/parse-resume/route");

  // Test JSON input
  const jsonReq = new Request("http://localhost:3000/api/parse-resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resumeText: "Nistha Maheshwari\nSkills: Python, TypeScript, Docker\nProjects:\nTest Engine | Python, Docker\n- Built test project",
      candidateId: "u-student-nistha-001",
    }),
  });

  const jsonRes = await POST(jsonReq as any);
  assert.equal(jsonRes.status, 200);

  const jsonData = await jsonRes.json();
  assert.equal(jsonData.success, true);
  assert.ok(jsonData.skillsCount >= 2, "Must extract skills");
  assert.ok(jsonData.projectsCount >= 1, "Must extract projects");
  assert.ok(jsonData.message.includes("parsed successfully"), "Must return user-friendly success message");
});
