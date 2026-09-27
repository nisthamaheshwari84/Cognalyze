import assert from "assert";

const BASE_URL = "http://localhost:3000";

async function testUserIsolation() {
  console.log("=== STARTING MULTI-USER ISOLATION ACCEPTANCE TEST ===");

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
  console.log("✓ Student A registered with ID:", signupAData.user.id);

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

  // 2. REGISTER STUDENT B: Priya Patel
  console.log("\n[3] Registering Student B: Priya Patel...");
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
  console.log("✓ Student B registered with ID:", signupBData.user.id);

  // Check Session for Student B
  const sessionBRes = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: { Cookie: cookieB },
  });
  const sessionBData = await sessionBRes.json();
  assert.equal(sessionBData.user.fullName, "Priya Patel");
  assert.equal(sessionBData.studentProfile.profileCompleted, false, "Student B must start with clean uncompleted profile");
  console.log("✓ Student B session verified: independent clean profile");

  // Complete Onboarding for Student B with completely different data
  console.log("\n[4] Completing onboarding for Priya Patel (Java + Payment Gateway)...");
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

  // CRITICAL: VERIFY ZERO CROSS-CONTAMINATION
  const bHasPython = dnaBData.evidenceEngine.capabilities.some((c: any) => c.name.toLowerCase().includes("python"));
  assert.equal(bHasPython, false, "CRITICAL: Student B must NEVER see Student A's Python capability!");

  const bHasDistQueue = dnaBData.evidenceEngine.keyEvidence.some((e: any) => e.title.includes("Distributed Queue"));
  assert.equal(bHasDistQueue, false, "CRITICAL: Student B must NEVER see Student A's Distributed Queue project!");

  console.log("✓ ZERO CROSS-CONTAMINATION CONFIRMED: Priya's DNA has zero traces of Rahul's data!");

  // 3. RE-VERIFY STUDENT A IS UNTOUCHED
  console.log("\n[5] Re-verifying Student A's data was not overwritten or contaminated...");
  const dnaARecheckRes = await fetch(`${BASE_URL}/api/student/dna`, {
    headers: { Cookie: cookieA },
  });
  const dnaARecheckData = await dnaARecheckRes.json();
  assert.equal(dnaARecheckData.evidenceEngine.identity.name, "Rahul Sharma");
  const aHasJava = dnaARecheckData.evidenceEngine.capabilities.some((c: any) => c.name.toLowerCase().includes("java"));
  assert.equal(aHasJava, false, "CRITICAL: Student A must NEVER see Student B's Java capability!");
  console.log("✓ Rahul's DNA is intact, isolated, and completely free of Priya's data!");

  console.log("\n=== ALL USER DATA ISOLATION TESTS PASSED WITH 100% SUCCESS ===");
}

testUserIsolation().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
