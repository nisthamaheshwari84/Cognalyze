import {
  skillHubStore,
  COMPANY_TRACKS,
  SKILL_DOMAINS,
  SEED_APTITUDE_QUESTIONS,
  SEED_COMMUNICATION_PROMPTS,
  SEED_SKILL_RESOURCES
} from "../lib/skill-hub-store";

async function runSkillHubValidation() {
  console.log("==================================================================");
  console.log("   COGNALYZE TRACK-AWARE SKILL PRACTICE HUB VALIDATION SUITE");
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

  // 1. Company Tracks Schema & 2026 Process Verification
  console.log("\n[1] Verifying 4 Company Tracks & Real Round Structures...");
  const tracks = skillHubStore.getTracks();
  assert(tracks.length === 4, `All 4 company tracks registered (Found ${tracks.length})`);

  const serviceMass = tracks.find(t => t.slug === "service_mass");
  assert(!!serviceMass, "Track 'service_mass' exists");
  if (serviceMass) {
    assert(serviceMass.round_structure.length >= 4, `service_mass has ${serviceMass.round_structure.length} rounds`);
    const aptRound = serviceMass.round_structure.find(r => r.type === "aptitude");
    assert(!!aptRound && aptRound.is_hard_gate, "service_mass aptitude assessment is marked as a HARD GATE");
    assert(Boolean(aptRound?.typical_elimination_rate.includes("eliminated")), "service_mass aptitude documents real mass elimination rate");
  }

  const serviceElite = tracks.find(t => t.slug === "service_elite");
  assert(!!serviceElite, "Track 'service_elite' exists (TCS Digital / Infosys SP / Wipro Turbo)");

  const productFaang = tracks.find(t => t.slug === "product_faang");
  assert(!!productFaang, "Track 'product_faang' exists (Google / Amazon / Meta)");
  if (productFaang) {
    const sysDesignRound = productFaang.round_structure.find(r => r.type === "system_design");
    assert(!!sysDesignRound, "product_faang contains dedicated System Design (HLD/LLD) round");
  }

  // 2. Student Multi-Select Target Tracks & Hedging
  console.log("\n[2] Testing Student Multi-Select Target Tracks & Hedging...");
  const testCandidate = "student-test-track";
  skillHubStore.setStudentTracks(testCandidate, ["service_mass", "product_faang"]);
  const studentTracks = skillHubStore.getStudentTracks(testCandidate);
  assert(studentTracks.includes("service_mass") && studentTracks.includes("product_faang"), "Student successfully saved hedged tracks (service_mass AND product_faang)");

  // 3. Dynamic Domain & Resource Filtering
  console.log("\n[3] Testing Dynamic Domain Filtering on Company Track...");
  // Case A: Service Mass ONLY
  const serviceOnlyDomains = skillHubStore.getDomainsForTracks(["service_mass"]);
  assert(serviceOnlyDomains.some(d => d.slug === "aptitude_reasoning"), "Service-only track includes 'aptitude_reasoning'");
  assert(serviceOnlyDomains.some(d => d.slug === "communication_english"), "Service-only track includes 'communication_english'");
  assert(!serviceOnlyDomains.some(d => d.slug === "system_design"), "Service-only track EXCLUDES 'system_design' (no irrelevant HLD grind)");

  // Case B: FAANG ONLY
  const faangOnlyDomains = skillHubStore.getDomainsForTracks(["product_faang"]);
  assert(!faangOnlyDomains.some(d => d.slug === "aptitude_reasoning"), "FAANG-only track EXCLUDES mass aptitude test");
  assert(faangOnlyDomains.some(d => d.slug === "system_design"), "FAANG-only track includes 'system_design'");
  assert(faangOnlyDomains.some(d => d.slug === "behavioral_hr"), "FAANG-only track includes 'behavioral_hr'");

  // Case C: Hedging BOTH Tracks
  const hedgedDomains = skillHubStore.getDomainsForTracks(["service_mass", "product_faang"]);
  assert(hedgedDomains.some(d => d.slug === "aptitude_reasoning"), "Hedged student sees 'aptitude_reasoning'");
  assert(hedgedDomains.some(d => d.slug === "system_design"), "Hedged student sees 'system_design'");
  assert(hedgedDomains.some(d => d.slug === "communication_english"), "Hedged student sees 'communication_english'");

  // 4. Resource Depth Tagging
  console.log("\n[4] Verifying Resource Depth Metadata ('basic' vs 'interview_deep')...");
  const serviceResources = skillHubStore.getResourcesForTracks(["service_mass"]);
  assert(serviceResources.some((r: any) => r.domain === "aptitude_reasoning"), "Service track receives aptitude resources");

  const faangResources = skillHubStore.getResourcesForTracks(["product_faang"]);
  assert(faangResources.some((r: any) => r.domain === "system_design"), "FAANG track receives system design resources");

  // 5. Aptitude Question Paper Integrity & Citations
  console.log("\n[5] Verifying Company Pattern Aptitude Questions...");
  const tcsQuestions = skillHubStore.getAptitudeQuestions("TCS NQT");
  assert(tcsQuestions.length >= 3, `TCS NQT pattern questions loaded (${tcsQuestions.length} found)`);
  assert(tcsQuestions[0].source_citation.includes("PrepInsta") || tcsQuestions[0].source_citation.includes("IndiaBix"), "TCS questions cite authentic sources (PrepInsta / IndiaBix)");

  const infyQuestions = skillHubStore.getAptitudeQuestions("Infosys");
  assert(infyQuestions.some(q => q.topic.includes("Cryptarithmetic")), "Infosys paper features trademark Cryptarithmetic puzzle pattern");

  // 6. Communication & Plain-English Prompt Studio
  console.log("\n[6] Verifying Communication Prompts & Rubrics...");
  const commPrompts = skillHubStore.getCommunicationPrompts();
  assert(commPrompts.length >= 3, `Found ${commPrompts.length} plain-English communication prompts`);
  const apiPrompt = commPrompts.find(p => p.id === "comm-1");
  assert(!!apiPrompt && apiPrompt.type === "plain_english_concept", "API Grandparent prompt registered as plain_english_concept");
  assert(Boolean(apiPrompt?.prompt_text.includes("grandparent")), "Prompt instructs explaining to non-technical audience");
  assert(!!apiPrompt?.sample_winning_response, "Prompt provides benchmark gold-standard winning response");

  console.log("------------------------------------------------------------------");
  console.log(`Results: ${passed}/${total} checks passed (${((passed / total) * 100).toFixed(1)}%)`);
  if (passed === total) {
    console.log("🎉 ALL TRACK-AWARE SKILL PRACTICE HUB VALIDATIONS PASSED!");
  } else {
    process.exit(1);
  }
}

runSkillHubValidation().catch(e => {
  console.error(e);
  process.exit(1);
});
