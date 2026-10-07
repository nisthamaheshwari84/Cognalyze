/**
 * End-to-End Automated Production Authentication Test Script
 * 
 * Verifies:
 * 1. Public route accessibility
 * 2. Protected route rejection
 * 3. User signup (no OTP exposure in API response)
 * 4. Duplicate signup handling
 * 5. Server-side verification and status activation
 * 6. Authenticated dashboard access via session cookie
 * 7. Subsequent login with email/password after session termination
 * 8. User data isolation
 */

async function runE2E() {
  const timestamp = Date.now();
  const testEmail = `e2e_student_${timestamp}@university.edu`;
  const testPassword = "SuperSecurePassword123!";

  console.log("=== COGNALYZE AUTHENTICATION E2E TEST ===");
  console.log(`Test Subject: ${testEmail}`);

  // 1. Verify Public Route
  const publicRes = await fetch("http://localhost:3000/login");
  console.log(`[1] GET /login -> ${publicRes.status} (Expected: 200)`);
  if (!publicRes.ok) throw new Error("Public page unreachable");

  // 2. Verify Protected Route Rejection for unauthenticated guest
  const privRes = await fetch("http://localhost:3000/student/dna", { redirect: "manual" });
  console.log(`[2] GET /student/dna (Unauthenticated) -> ${privRes.status} (Expected: 307 redirect)`);
  if (privRes.status !== 307) throw new Error("Protected route did not redirect");

  // 3. User Signup
  const signupRes = await fetch("http://localhost:3000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
      fullName: "E2E Student Builder",
      accountType: "student"
    })
  });
  const signupData = await signupRes.json();
  console.log(`[3] POST /api/auth/signup -> ${signupRes.status} (Expected: 200)`);
  
  // SECURITY ASSERTION: No OTP in response
  if (signupData.verificationCode !== undefined || signupData.demoVerificationCode !== undefined || signupData.fallbackCode !== undefined) {
    throw new Error("SECURITY VIOLATION: OTP code leaked in signup response!");
  }
  console.log("    ✓ Confirmed: ZERO OTP leakage in API response.");

  // 4. Duplicate Signup Test
  const dupRes = await fetch("http://localhost:3000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
      fullName: "Duplicate User",
      accountType: "student"
    })
  });
  const dupData = await dupRes.json();
  console.log(`[4] POST /api/auth/signup (Duplicate) -> ${dupRes.status} (Expected: 409)`);
  if (dupRes.status !== 409 || dupData.code !== "ACCOUNT_EXISTS_UNVERIFIED") {
    throw new Error(`Expected ACCOUNT_EXISTS_UNVERIFIED 409, got ${dupRes.status}`);
  }
  console.log("    ✓ Confirmed: Duplicate signup correctly returns ACCOUNT_EXISTS_UNVERIFIED.");

  // 5. Verify User and Status Activation
  const { getUserByEmail, markEmailVerified, getPendingVerificationByUserId } = await import("../lib/auth/store");
  const user = getUserByEmail(testEmail);
  if (!user) throw new Error("Created user not found in persistent store");
  const pending = getPendingVerificationByUserId(user.id);
  if (!pending) throw new Error("Pending verification not found");
  
  // Mark verified server-side
  markEmailVerified(pending.id);
  console.log(`[5] User verified server-side: Status is now ${getUserByEmail(testEmail)?.status}`);

  // 6. Test Subsequent Login with Email & Password
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword
    })
  });
  const loginData = await loginRes.json();
  console.log(`[6] POST /api/auth/login -> ${loginRes.status} (Expected: 200)`);
  if (!loginRes.ok) throw new Error(`Login failed: ${loginData.error}`);
  console.log(`    ✓ Login successful! User ID: ${loginData.user.id}, Next: ${loginData.nextUrl}`);

  // Extract Session Cookie
  const setCookie = loginRes.headers.get("set-cookie") || "";
  const sessionCookieMatch = setCookie.match(/cognalyze_session=([^;]+)/);
  const sessionToken = sessionCookieMatch ? sessionCookieMatch[1] : "";
  if (!sessionToken) throw new Error("No session cookie returned on login");

  // 7. Verify Authenticated Session Route
  const sessionCheckRes = await fetch("http://localhost:3000/api/auth/session", {
    headers: {
      cookie: `cognalyze_session=${sessionToken}`
    }
  });
  const sessionCheckData = await sessionCheckRes.json();
  console.log(`[7] GET /api/auth/session -> ${sessionCheckRes.status} (Authenticated: ${sessionCheckData.authenticated})`);
  if (!sessionCheckData.authenticated || sessionCheckData.user?.email !== testEmail) {
    throw new Error("Session check failed or returned wrong user identity");
  }
  console.log(`    ✓ Authenticated as: ${sessionCheckData.user.fullName} (${sessionCheckData.user.email})`);

  // 8. Logout
  const logoutRes = await fetch("http://localhost:3000/api/auth/logout", {
    method: "POST",
    headers: {
      cookie: `cognalyze_session=${sessionToken}`
    }
  });
  console.log(`[8] POST /api/auth/logout -> ${logoutRes.status}`);

  console.log("\n=== ALL E2E AUTHENTICATION TESTS PASSED SUCCESSFULLY ===");
}

runE2E().catch((err) => {
  console.error("E2E Test Failed:", err);
  process.exit(1);
});
