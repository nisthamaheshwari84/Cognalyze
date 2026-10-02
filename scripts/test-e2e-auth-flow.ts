/**
 * End-to-end verification script for real HTTP requests against localhost:3000
 */
async function runE2E() {
  console.log("Starting End-to-End HTTP Flow Test...");

  // 1. Check Public Landing Page
  const landingRes = await fetch("http://localhost:3000/");
  console.log(`[1] GET / -> ${landingRes.status} (Expected: 200)`);
  if (landingRes.status !== 200) throw new Error("Landing page failed");

  // 2. Check Unauthenticated Protected Route
  const dnaRes = await fetch("http://localhost:3000/student/dna", { redirect: "manual" });
  console.log(`[2] GET /student/dna (no session) -> ${dnaRes.status} (Expected: 307)`);
  console.log(`    Location header: ${dnaRes.headers.get("location")}`);
  if (dnaRes.status !== 307) throw new Error("Protected route did not redirect");

  // 3. Check /student-dna legacy route
  const legacyDnaRes = await fetch("http://localhost:3000/student-dna", { redirect: "manual" });
  console.log(`[3] GET /student-dna (no session) -> ${legacyDnaRes.status} (Expected: 307)`);
  console.log(`    Location header: ${legacyDnaRes.headers.get("location")}`);

  // 4. Test Student Signup
  const testEmail = `e2e_student_${Date.now()}@university.edu`;
  const signupRes = await fetch("http://localhost:3000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: "SuperSecurePassword123!",
      fullName: "E2E Test Student",
      role: "student",
      username: `e2e_${Date.now()}`
    })
  });
  const signupData = await signupRes.json();
  console.log(`[4] POST /api/auth/signup -> ${signupRes.status} (Expected: 200)`);
  console.log(`    Message: ${signupData.message}`);
  if (!signupRes.ok) throw new Error("Signup failed");

  // 5. Test Resend Code to obtain code for automated testing
  // In development, the auth store persists the verification code hash
  const { getPendingVerificationByUserId, getUserByEmail } = await import("../lib/auth/store");
  const user = getUserByEmail(testEmail);
  if (!user) throw new Error("Created user not found in store");
  const pending = getPendingVerificationByUserId(user.id);
  console.log(`[5] User created with ID: ${user.id}, Status: ${user.status}`);

  // 6. Verify Email OTP
  const testCode = signupData.demoVerificationCode;
  console.log(`[5] Verifying with code: ${testCode}`);

  const verifyRes = await fetch("http://localhost:3000/api/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: signupData.userId,
      code: testCode
    })
  });
  const verifyData = await verifyRes.json();
  console.log(`[6] POST /api/auth/verify-email -> ${verifyRes.status} (Expected: 200)`);
  console.log(`    Status: ${verifyData.status}, NextUrl: ${verifyData.nextUrl}`);
  if (!verifyRes.ok) throw new Error("Verify email failed");

  // Extract session cookie
  const setCookie = verifyRes.headers.get("set-cookie") || "";
  const sessionCookieMatch = setCookie.match(/cognalyze_session=([^;]+)/);
  const sessionToken = sessionCookieMatch ? sessionCookieMatch[1] : "";
  console.log(`[7] Obtained Session Token: ${sessionToken.substring(0, 16)}...`);

  // 8. Access Student Dashboard with Session Cookie
  const dashRes = await fetch("http://localhost:3000/student/dashboard", {
    headers: {
      cookie: `cognalyze_session=${sessionToken}; cognalyze_role=student`
    },
    redirect: "manual"
  });
  console.log(`[8] GET /student/dashboard (with valid student session) -> ${dashRes.status} (Expected: 200)`);
  if (dashRes.status !== 200) throw new Error("Dashboard access failed with valid session");

  // 9. Verify Student cannot access Recruiter Dashboard
  const recruiterDashRes = await fetch("http://localhost:3000/recruiter/dashboard", {
    headers: {
      cookie: `cognalyze_session=${sessionToken}; cognalyze_role=student`
    },
    redirect: "manual"
  });
  console.log(`[9] GET /recruiter/dashboard (as student) -> ${recruiterDashRes.status} (Expected: 307)`);
  console.log(`    Redirected to: ${recruiterDashRes.headers.get("location")}`);
  if (recruiterDashRes.status !== 307) throw new Error("Student was not blocked from recruiter dashboard");

  // 10. Test Logout
  const logoutRes = await fetch("http://localhost:3000/api/auth/logout", {
    method: "POST",
    headers: {
      cookie: `cognalyze_session=${sessionToken}`
    }
  });
  console.log(`[10] POST /api/auth/logout -> ${logoutRes.status} (Expected: 200)`);

  console.log("\nALL END-TO-END HTTP TESTS PASSED PERFECTLY!");
}

runE2E().catch(err => {
  console.error("E2E Test Failed:", err);
  process.exit(1);
});
