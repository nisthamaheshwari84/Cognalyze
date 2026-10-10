import assert from "assert";

const BASE_URL = "http://localhost:3000";

async function testUserIsolation() {
  console.log("=== STARTING COMPLETE MULTI-USER ISOLATION ACCEPTANCE TEST ===");

  // Helper for cookies
  function extractCookie(res: Response): string {
    const setCookie = res.headers.get("set-cookie");
    if (!setCookie) return "";
    return setCookie.split(";")[0];
  }

  // 1. REGISTER STUDENT A: Rahul Sharma
  console.log("\n[1] Registering Student A: Rahul Sharma...");
  const signupARes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Rahul Sharma",
      email: `rahul_${Date.now()}@test.com`,
      password: "Password123!",
      confirmPassword: "Password123!",
      accountType: "student",
    }),
  });
  const signupAData = await signupARes.json();
  assert.equal(signupARes.status, 200, "Student A signup must succeed");
  const cookieA = extractCookie(signupARes);
  const studentAId = signupAData.user.id;
  console.log("✓ Student A registered with ID:", studentAId);

  // Check Session for Student A
  const sessionARes = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: { Cookie: cookieA },
  });
  const sessionAData = await sessionARes.json();
  assert.equal(sessionAData.authenticated, true);
  assert.equal(sessionAData.user.fullName, "Rahul Sharma");
  assert.equal(sessionAData.studentProfile.profileCompleted, false, "New student profile must start uncompleted");
  console.log("✓ Student A session verified: starts with clean profileCompleted: false");

  // Complete Onboarding for Student A
  console.log("\n[2] Completing 9-section Student DNA onboarding for Rahul Sharma...");
  const onboardARes = await fetch(`${BASE_URL}/api/student/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieA },
    body: JSON.stringify({
      college: "IIT Delhi",
      degree: "B.Tech",
      branch: "Computer Science",
      graduationYear: "2026",
      cgpa: "9.2",
      skills: [
        { name: "Python", level: "Advanced" },
        { name: "Distributed Systems", level: "Intermediate" },
      ],
      projects: [
        {
          title: "Distributed Queue",
          description: "High-throughput FIFO messaging queue with raft replication",
          techStack: ["Python", "gRPC"],
          githubUrl: "https://github.com/rahul-sharma/dist-queue",
        },
      ],
      experience: [],
      achievements: [{ title: "Smart India Hackathon Finalist", type: "Hackathon" }],
      certifications: [],
      careerGoals: {
        targetRoles: ["Backend Engineer"],
        preferredDomains: ["Infrastructure"],
        targetCompanies: ["Uber", "Google"],
      },
    }),
  });
  assert.equal(onboardARes.status, 200, "Student A onboarding must succeed");
  console.log("✓ Student A onboarding completed");

  // Verify Student A DNA
  const dnaARes = await fetch(`${BASE_URL}/api/student/dna`, {
    headers: { Cookie: cookieA },
  });
  const dnaAData = await dnaARes.json();
  assert.equal(dnaAData.evidenceEngine.identity.name, "Rahul Sharma");
  const hasPython = dnaAData.evidenceEngine.capabilities.some((c: any) => c.name.toLowerCase().includes("python"));
  assert.ok(hasPython, "Student A DNA must contain Python capability");
  const hasDistQueue = dnaAData.evidenceEngine.keyEvidence.some((e: any) => e.title.includes("Distributed Queue"));
  assert.ok(hasDistQueue, "Student A DNA must contain Distributed Queue project");
  console.log("✓ Student A DNA strictly contains Rahul's identity, Python, and Distributed Queue");

  // 3. STUDENT A ADDS APPLICATION & CALENDAR EVENT
  console.log("\n[3] Student A applies to Walmart SDE Sprint & creates a calendar milestone...");
  const appARes = await fetch(`${BASE_URL}/api/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieA },
    body: JSON.stringify({
      opportunityId: "opp-walmart-sde-sprint",
      stage: "Applied",
      notes: "Submitted coding round solution",
    }),
  });
  assert.equal(appARes.status, 200, "Student A application must be recorded");

  const calARes = await fetch(`${BASE_URL}/api/student/calendar/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieA },
    body: JSON.stringify({
      title: "Rahul's Mock Interview With Peer",
      date: "2026-10-20",
      event_type: "interview",
      priority: "high",
    }),
  });
  assert.equal(calARes.status, 200, "Student A calendar event must be created");
  console.log("✓ Student A successfully added application and calendar milestone");

  // Verify Student A sees them
  const getAppARes = await fetch(`${BASE_URL}/api/applications`, {
    headers: { Cookie: cookieA },
  });
  const getAppDataA = await getAppARes.json();
  assert.ok(getAppDataA.applications.some((a: any) => a.opportunity_id === "opp-walmart-sde-sprint"), "Student A must have Walmart in applications");

  const getCalARes = await fetch(`${BASE_URL}/api/student/calendar`, {
    headers: { Cookie: cookieA },
  });
  const getCalDataA = await getCalARes.json();
  const aHasPeerInterview = (getCalDataA.events || []).some((e: any) => e.title === "Rahul's Mock Interview With Peer");
  assert.ok(aHasPeerInterview, "Student A must see their own calendar event");
  console.log("✓ Student A reads own application and calendar event correctly");

  // 4. REGISTER STUDENT B: Priya Patel
  console.log("\n[4] Registering Student B: Priya Patel...");
  const signupBRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Priya Patel",
      email: `priya_${Date.now()}@test.com`,
      password: "Password123!",
      confirmPassword: "Password123!",
      accountType: "student",
    }),
  });
  const signupBData = await signupBRes.json();
  assert.equal(signupBRes.status, 200, "Student B signup must succeed");
  const cookieB = extractCookie(signupBRes);
  const studentBId = signupBData.user.id;
  console.log("✓ Student B registered with ID:", studentBId);

  // Check Session for Student B
  const sessionBRes = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: { Cookie: cookieB },
  });
  const sessionBData = await sessionBRes.json();
  assert.equal(sessionBData.user.fullName, "Priya Patel");
  assert.equal(sessionBData.studentProfile.profileCompleted, false, "Student B must start with clean uncompleted profile");
  console.log("✓ Student B session verified: independent clean profile");

  // 5. CRITICAL ISOLATION CHECK: STUDENT B MUST SEE ZERO APPLICATIONS & ZERO PERSONAL CALENDAR EVENTS
  console.log("\n[5] CRITICAL TEST: Verifying Student B starts with ZERO leaked applications or calendar events...");
  const getAppBRes = await fetch(`${BASE_URL}/api/applications`, {
    headers: { Cookie: cookieB },
  });
  const getAppDataB = await getAppBRes.json();
  assert.equal(getAppDataB.applications.length, 0, "CRITICAL: Student B must start with ZERO applications (must NOT see Student A's Walmart application)!");
  console.log("✓ Applications Isolation: Student B has 0 applications, Walmart did NOT leak!");

  const getCalBRes = await fetch(`${BASE_URL}/api/student/calendar`, {
    headers: { Cookie: cookieB },
  });
  const getCalDataB = await getCalBRes.json();
  const bSeesRahulEvent = (getCalDataB.events || []).some((e: any) => e.title === "Rahul's Mock Interview With Peer");
  assert.equal(bSeesRahulEvent, false, "CRITICAL: Student B must NEVER see Student A's calendar event!");
  console.log("✓ Calendar Isolation: Student B does NOT see Student A's calendar event!");

  // Complete Onboarding for Student B with completely different data
  console.log("\n[6] Completing onboarding for Priya Patel (Java + Payment Gateway)...");
  const onboardBRes = await fetch(`${BASE_URL}/api/student/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieB },
    body: JSON.stringify({
      college: "BITS Pilani",
      degree: "B.E.",
      branch: "Information Systems",
      graduationYear: "2025",
      cgpa: "8.8",
      skills: [
        { name: "Java", level: "Expert" },
        { name: "Spring Boot", level: "Advanced" },
      ],
      projects: [
        {
          title: "Payment Gateway",
          description: "PCI-DSS compliant transaction processing gateway",
          techStack: ["Java", "Spring Boot", "PostgreSQL"],
          githubUrl: "https://github.com/priya-patel/pay-gateway",
        },
      ],
      experience: [],
      achievements: [],
      certifications: [],
      careerGoals: {
        targetRoles: ["Fintech Engineer"],
        preferredDomains: ["Payments"],
        targetCompanies: ["Stripe", "Visa"],
      },
    }),
  });
  assert.equal(onboardBRes.status, 200, "Student B onboarding must succeed");
  console.log("✓ Student B onboarding completed");

  // Verify Student B DNA - MUST HAVE ZERO traces of Rahul Sharma or Nistha!
  const dnaBRes = await fetch(`${BASE_URL}/api/student/dna`, {
    headers: { Cookie: cookieB },
  });
  const dnaBData = await dnaBRes.json();
  assert.equal(dnaBData.evidenceEngine.identity.name, "Priya Patel");
  
  // Verify Priya has Java
  const bHasJava = dnaBData.evidenceEngine.capabilities.some((c: any) => c.name.toLowerCase().includes("java"));
  assert.ok(bHasJava, "Student B DNA must contain Java capability");
  
  // Verify Priya has Payment Gateway
  const bHasPayment = dnaBData.evidenceEngine.keyEvidence.some((e: any) => e.title.includes("Payment Gateway"));
  assert.ok(bHasPayment, "Student B DNA must contain Payment Gateway project");

  // CRITICAL: VERIFY ZERO CROSS-CONTAMINATION IN DNA
  const bHasPython = dnaBData.evidenceEngine.capabilities.some((c: any) => c.name.toLowerCase().includes("python"));
  assert.equal(bHasPython, false, "CRITICAL: Student B must NEVER see Student A's Python capability!");

  const bHasDistQueue = dnaBData.evidenceEngine.keyEvidence.some((e: any) => e.title.includes("Distributed Queue"));
  assert.equal(bHasDistQueue, false, "CRITICAL: Student B must NEVER see Student A's Distributed Queue project!");
  console.log("✓ DNA Isolation: Priya's DNA has zero traces of Rahul's data!");

  // 7. STUDENT B APPLIES TO FLIPKART GRID
  console.log("\n[7] Student B applies to Flipkart GRiD 2026...");
  await fetch(`${BASE_URL}/api/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieB },
    body: JSON.stringify({
      opportunityId: "opp-flipkart-grid-2026",
      stage: "Bookmarked",
    }),
  });

  // Re-verify Student A does NOT see Flipkart
  const getAppARecheck = await fetch(`${BASE_URL}/api/applications`, {
    headers: { Cookie: cookieA },
  });
  const aAppsRecheck = await getAppARecheck.json();
  const aHasFlipkart = aAppsRecheck.applications.some((a: any) => a.opportunity_id === "opp-flipkart-grid-2026");
  assert.equal(aHasFlipkart, false, "CRITICAL: Student A must NOT see Student B's Flipkart bookmark!");
  console.log("✓ Application Bi-Directional Isolation: Rahul does NOT see Priya's Flipkart bookmark!");

  // Re-verify Student B does NOT see Walmart
  const getAppBRecheck = await fetch(`${BASE_URL}/api/applications`, {
    headers: { Cookie: cookieB },
  });
  const bAppsRecheck = await getAppBRecheck.json();
  const bHasWalmart = bAppsRecheck.applications.some((a: any) => a.opportunity_id === "opp-walmart-sde-sprint");
  assert.equal(bHasWalmart, false, "CRITICAL: Student B must NOT see Student A's Walmart application!");
  console.log("✓ Application Bi-Directional Isolation: Priya does NOT see Rahul's Walmart application!");

  console.log("\n=== ALL USER DATA ISOLATION TESTS PASSED WITH 100% SUCCESS ===");
}

testUserIsolation().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
