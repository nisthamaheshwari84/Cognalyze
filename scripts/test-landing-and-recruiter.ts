import { POST as setRole } from "../app/api/auth/role/route";
import { proxy as middleware } from "../proxy";
import { NextRequest } from "next/server";
import assert from "node:assert/strict";

async function verifyRecruiterAndPost() {
  console.log("\n========================================================");
  console.log("🚀 VERIFYING RECRUITER & POST ACCESSIBILITY & ROLE FLOW");
  console.log("========================================================\n");

  // 1. Verify Public access to /post in middleware
  console.log("▶ CHECK 1: Public access to /post");
  const postReq = new NextRequest("https://cognalyze.com/post");
  const postRes = middleware(postReq);
  assert.equal(postRes.status, 200, "Unauthenticated user must be allowed to view /post");
  console.log("  ✅ /post is accessible publicly without being redirected to login");

  // 2. Select Recruiter role from landing page
  console.log("\n▶ CHECK 2: Selecting recruiter role via /api/auth/role");
  const selectRecruiterReq = new NextRequest("https://cognalyze.com/api/auth/role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "recruiter" }),
  });
  const selectRecruiterRes = await setRole(selectRecruiterReq);
  assert.equal(selectRecruiterRes.status, 200, "Selecting recruiter role must succeed");
  
  const setCookieHeader = selectRecruiterRes.headers.get("set-cookie") || "";
  assert.ok(setCookieHeader.includes("cognalyze_role=recruiter"), "Cookie cognalyze_role must be set to recruiter");
  assert.ok(setCookieHeader.includes("cognalyze_session="), "Cookie cognalyze_session must be provisioned for recruiter");
  console.log("  ✅ Recruiter role and session cookies provisioned successfully");

  // Extract cookies
  const roleMatch = setCookieHeader.match(/cognalyze_role=([^;]+)/);
  const sessionMatch = setCookieHeader.match(/cognalyze_session=([^;]+)/);
  const roleCookie = roleMatch ? roleMatch[1] : "";
  const sessionToken = sessionMatch ? sessionMatch[1] : "";

  // 3. Verify accessing /recruiter/dashboard with provisioned cookies
  console.log("\n▶ CHECK 3: Accessing /recruiter/dashboard with recruiter session");
  const recruiterDashReq = new NextRequest("https://cognalyze.com/recruiter/dashboard", {
    headers: {
      cookie: `cognalyze_session=${sessionToken}; cognalyze_role=${roleCookie}`,
    },
  });
  const recruiterDashRes = middleware(recruiterDashReq);
  assert.equal(recruiterDashRes.status, 200, "Recruiter dashboard must allow access with recruiter session");
  console.log("  ✅ /recruiter/dashboard allows entry (status 200, no redirect)");

  // 4. Switch back to Student role
  console.log("\n▶ CHECK 4: Switching back to student role via /api/auth/role");
  const selectStudentReq = new NextRequest("https://cognalyze.com/api/auth/role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "student" }),
  });
  const selectStudentRes = await setRole(selectStudentReq);
  assert.equal(selectStudentRes.status, 200, "Selecting student role must succeed");
  const studentCookieHeader = selectStudentRes.headers.get("set-cookie") || "";
  assert.ok(studentCookieHeader.includes("cognalyze_role=student"), "Cookie cognalyze_role must be set to student");
  assert.ok(studentCookieHeader.includes("cognalyze_session="), "Cookie cognalyze_session must be provisioned for student");
  console.log("  ✅ Student role and session cookies provisioned successfully");

  const studentSessionMatch = studentCookieHeader.match(/cognalyze_session=([^;]+)/);
  const studentSessionToken = studentSessionMatch ? studentSessionMatch[1] : "";

  // 5. Verify accessing /student/dashboard with student session
  console.log("\n▶ CHECK 5: Accessing /student/dashboard with student session");
  const studentDashReq = new NextRequest("https://cognalyze.com/student/dashboard", {
    headers: {
      cookie: `cognalyze_session=${studentSessionToken}; cognalyze_role=student`,
    },
  });
  const studentDashRes = middleware(studentDashReq);
  assert.equal(studentDashRes.status, 200, "Student dashboard must allow access with student session");
  console.log("  ✅ /student/dashboard allows entry (status 200)");

  console.log("\n🎉 ALL RECRUITER & POST NAVIGATION TESTS PASSED PERFECTLY!\n");
}

verifyRecruiterAndPost().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
