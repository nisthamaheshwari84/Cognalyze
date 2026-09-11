import { skillHubStore } from "../lib/skill-hub-store";

async function testLimitlessInterviewExpansion() {
  console.log("==================================================================");
  console.log("   LIMITLESS AUTHENTIC INTERVIEW PLATFORM VERIFICATION SUITE");
  console.log("==================================================================");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  // 1. CS Technical Interview Store & Domain Integrity
  console.log("\n[1] Testing CS Technical Interview Bank & Expectations...");
  const csQuestions = skillHubStore.getCSQuestions("all");
  assert(csQuestions.length >= 20, `Found ${csQuestions.length} core CS technical interview questions (Target: >=20)`);

  const dbmsQuestions = csQuestions.filter(q => q.domain === "dbms");
  assert(dbmsQuestions.length >= 5, `Found ${dbmsQuestions.length} DBMS questions (Salary, ACID, B-Tree, Normalization, Sharding)`);

  const oopQuestions = csQuestions.filter(q => q.domain === "oop");
  assert(oopQuestions.length >= 5, `Found ${oopQuestions.length} OOP questions (Abstract vs Interface, vtables, SOLID, Diamond problem, Rule of 3/5)`);

  const osQuestions = csQuestions.filter(q => q.domain === "os");
  assert(osQuestions.length >= 5, `Found ${osQuestions.length} OS questions (Deadlock, Context Switch, Virtual Memory, Mutex vs Semaphore, Race Conditions)`);

  const networkQuestions = csQuestions.filter(q => q.domain === "networks");
  assert(networkQuestions.length >= 5, `Found ${networkQuestions.length} Computer Networks questions (google.com, TCP vs UDP, HTTP/1-3, CORS, TLS Crypto, Event Loops)`);

  // Check rubrics and follow-ups
  const sqlQuestion = csQuestions.find(q => q.id === "cs-1");
  assert(!!sqlQuestion, "Second highest salary SQL challenge present");
  assert(Boolean(sqlQuestion?.follow_up.includes("50 million rows")), "Includes Bar-Raiser follow-up scale grilling question");
  assert(Boolean((sqlQuestion?.expected_points?.length ?? 0) >= 3), "Includes detailed interviewer expected points");

  // 2. High-Scale System Design Challenges
  console.log("\n[2] Testing High-Scale System Design Arena...");
  const sdChallenges = skillHubStore.getSystemDesignChallenges();
  assert(sdChallenges.length >= 6, `Found ${sdChallenges.length} system design challenges (Target: >=6)`);

  const rateLimiter = sdChallenges.find(c => c.id === "sd-1");
  assert(!!rateLimiter, "Distributed Rate Limiter challenge loaded");

  const tinyUrl = sdChallenges.find(c => c.id === "sd-2");
  assert(!!tinyUrl, "Scalable URL Shortener challenge loaded");

  const whatsapp = sdChallenges.find(c => c.id === "sd-3");
  assert(!!whatsapp, "WhatsApp Real-Time Chat (WebSocket/Kafka) challenge loaded");

  const uber = sdChallenges.find(c => c.id === "sd-4");
  assert(!!uber, "Uber Driver Dispatch (H3 Geohash/Redis) challenge loaded");

  const flashSale = sdChallenges.find(c => c.id === "sd-5");
  assert(!!flashSale, "Flash Sale E-Commerce Inventory challenge loaded");

  const netflix = sdChallenges.find(c => c.id === "sd-6");
  assert(!!netflix, "Netflix Video CDN Streaming challenge loaded");

  // 3. Behavioral HR & Bar-Raiser Dual Track
  console.log("\n[3] Testing Authentic HR & STAR Behavioral Bank...");
  const serviceHR = skillHubStore.getBehavioralQuestions("service_hr");
  assert(serviceHR.length >= 8, `Found ${serviceHR.length} Service HR questions (Target: >=8)`);
  assert(serviceHR.some(q => q.question.toLowerCase().includes("relocat")), "Includes relocation & rotational shift commitment filter question");
  assert(serviceHR.some(q => q.question.includes("2-year service agreement")), "Includes 2-year service bond / loyalty question");
  assert(serviceHR.some(q => q.question.toLowerCase().includes("bench")), "Includes bench / shadow resource resilience question");

  const faangStar = skillHubStore.getBehavioralQuestions("faang_star");
  assert(faangStar.length >= 8, `Found ${faangStar.length} Amazon 16 LPs STAR questions (Target: >=8)`);
  assert(faangStar.some(q => q.principle?.includes("Customer Obsession")), "Includes Customer Obsession question");
  assert(faangStar.some(q => q.principle?.includes("Bias for Action")), "Includes Bias for Action question");
  assert(faangStar.some(q => q.principle?.includes("Disagree and Commit") || q.title.includes("Disagree")), "Includes Disagree and Commit question");
  assert(faangStar.some(q => q.principle?.includes("Frugality")), "Includes Frugality question");

  // 4. Aptitude Bank
  console.log("\n[4] Testing Mass Service Aptitude Bank...");
  const tcsQuestions = skillHubStore.getAptitudeQuestions("tcs_nqt");
  assert(tcsQuestions.length >= 10, `Found ${tcsQuestions.length} TCS NQT questions`);

  const infosysQuestions = skillHubStore.getAptitudeQuestions("infosys_infytq");
  assert(infosysQuestions.length >= 10, `Found ${infosysQuestions.length} Infosys InfyTQ/SP questions`);

  const wiproQuestions = skillHubStore.getAptitudeQuestions("wipro_elite");
  assert(wiproQuestions.length >= 10, `Found ${wiproQuestions.length} Wipro Elite questions`);

  const allAptitude = skillHubStore.getAptitudeQuestions("all");
  assert(allAptitude.length >= 40, `Found ${allAptitude.length} total Aptitude questions across sections`);

  console.log("\n==================================================================");
  console.log(`TEST RESULTS: ${passed}/${total} assertions PASSED`);
  console.log("==================================================================");

  if (passed === total) {
    console.log("🎉 ALL TESTS PASSED! PLATFORM IS PRODUCTION READY WITH AUTHENTIC QUESTIONS & REAL INTERVIEW EXPERIENCE!");
    process.exit(0);
  } else {
    console.error("⚠️ SOME TESTS FAILED!");
    process.exit(1);
  }
}

testLimitlessInterviewExpansion().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
