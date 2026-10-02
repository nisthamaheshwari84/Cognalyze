import fs from "fs";
import path from "path";
import { GD_DOMAINS, GD_FRESHNESS_OPTIONS, GD_CATEGORIES } from "../lib/group-discussion-data";
import { ALL_COMPANIES, ALL_ROLES, ALL_ROUNDS, ALL_QUESTION_TYPES, QUESTION_CATEGORIES } from "../lib/question-bank-data";
import { EXPANDED_PLACEMENT_QUESTIONS, SUBTOPICS_BY_TOPIC } from "../lib/question-bank-catalog";
import { COMPANY_PREP_GUIDES } from "../lib/company-prep-data";
import { isDuplicateOrSimilar } from "../app/api/gd/generate-topics/route";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✅ ${message}`);
  }
}

async function runTestSuite() {
  console.log("\n============================================================");
  console.log("🚀 COGNALYZE GD & QUESTION BANK VALIDATION SUITE");
  console.log("============================================================\n");

  // ─── PART A: GROUP DISCUSSION ───────────────────────────────────────
  console.log("▶ TEST 1: GD Domain and Freshness Configuration");
  assert(GD_DOMAINS.length === 16, `GD_DOMAINS has exactly 16 domains (found ${GD_DOMAINS.length})`);
  assert(GD_DOMAINS.includes("AI & Machine Learning"), "Includes AI & Machine Learning");
  assert(GD_DOMAINS.includes("Software Engineering"), "Includes Software Engineering");
  assert(GD_DOMAINS.includes("Cybersecurity"), "Includes Cybersecurity");
  assert(GD_DOMAINS.includes("Future of Work"), "Includes Future of Work");
  assert(GD_DOMAINS.includes("Climate & Sustainability"), "Includes Climate & Sustainability");
  assert(GD_FRESHNESS_OPTIONS.includes("Latest"), "Includes Latest freshness option");
  assert(GD_FRESHNESS_OPTIONS.includes("Trending"), "Includes Trending freshness option");
  assert(GD_FRESHNESS_OPTIONS.includes("Evergreen"), "Includes Evergreen freshness option");

  console.log("\n▶ TEST 2: GD AI Duplicate Rejection Functionality");
  const baseTitle = "Autonomous AI Coding Agents vs Junior Software Engineers in Campus Hiring";
  const exactDuplicate = "Autonomous AI Coding Agents vs Junior Software Engineers in Campus Hiring";
  const nearDuplicate = "Autonomous AI Coding Agents vs Junior Software Engineers in Campus Hiring 2026";
  const distinctTitle = "Modular Monoliths vs Distributed Microservices for High-Growth Startups";

  assert(isDuplicateOrSimilar(exactDuplicate, [baseTitle]), "Rejects exact duplicate title");
  assert(isDuplicateOrSimilar(nearDuplicate, [baseTitle]), "Rejects near-duplicate title with high token similarity");
  assert(!isDuplicateOrSimilar(distinctTitle, [baseTitle]), "Accepts distinct discussion topic");

  console.log("\n▶ TEST 3: Group Discussion Page UI & Controls");
  const gdPagePath = path.join(process.cwd(), "app", "group-discussion", "page.tsx");
  assert(fs.existsSync(gdPagePath), "app/group-discussion/page.tsx exists");
  const gdPageContent = fs.readFileSync(gdPagePath, "utf-8");
  assert(gdPageContent.includes("Generate Fresh Topics"), "Contains 'Generate Fresh Topics' button");
  assert(gdPageContent.includes("All Domains"), "Contains Domain selector dropdown");
  assert(gdPageContent.includes("All Freshness"), "Contains Freshness filter dropdown");
  assert(gdPageContent.includes("AI-Generated"), "Displays AI-Generated provenance badge");
  assert(gdPageContent.includes("Verified Archive"), "Displays Verified Archive badge");
  assert(gdPageContent.includes("source_context"), "Renders why this topic / source context callout");
  assert(gdPageContent.includes("Start GD Practice"), "Preserves Start GD Practice button and workflow");
  assert(gdPageContent.includes("Launch Live Multi-Speaker Simulation"), "Preserves simulation link");

  // ─── PART B: QUESTION BANK ──────────────────────────────────────────
  console.log("\n▶ TEST 4: Placement Question Bank Multi-Company & Role Architecture");
  assert(ALL_COMPANIES.length >= 25, `Supports 25+ companies (found ${ALL_COMPANIES.length})`);
  assert(ALL_ROLES.length >= 10, `Supports 10+ roles (found ${ALL_ROLES.length})`);
  assert(ALL_ROUNDS.length >= 10, `Supports 10+ interview rounds (found ${ALL_ROUNDS.length})`);
  assert(ALL_QUESTION_TYPES.length >= 15, `Supports 15+ question types (found ${ALL_QUESTION_TYPES.length})`);

  console.log("\n▶ TEST 5: Comprehensive Placement Question Catalog Depth");
  assert(EXPANDED_PLACEMENT_QUESTIONS.length >= 20, `Catalog contains expanded questions (found ${EXPANDED_PLACEMENT_QUESTIONS.length})`);
  
  const companiesInCatalog = new Set(EXPANDED_PLACEMENT_QUESTIONS.map(q => q.company).filter(Boolean));
  assert(companiesInCatalog.has("Google"), "Catalog contains Google questions");
  assert(companiesInCatalog.has("Amazon"), "Catalog contains Amazon questions");
  assert(companiesInCatalog.has("Microsoft"), "Catalog contains Microsoft questions");
  assert(companiesInCatalog.has("Meta"), "Catalog contains Meta questions");
  assert(companiesInCatalog.has("Uber"), "Catalog contains Uber questions");
  assert(companiesInCatalog.has("Apple"), "Catalog contains Apple questions");
  assert(companiesInCatalog.has("Adobe"), "Catalog contains Adobe questions");
  assert(companiesInCatalog.has("NVIDIA"), "Catalog contains NVIDIA questions");
  assert(companiesInCatalog.has("TCS"), "Catalog contains TCS questions");
  assert(companiesInCatalog.has("Infosys"), "Catalog contains Infosys questions");
  assert(companiesInCatalog.has("Deloitte"), "Catalog contains Deloitte questions");
  assert(companiesInCatalog.has("Cisco"), "Catalog contains Cisco questions");

  console.log("\n▶ TEST 6: Evidence-First Provenance Separation");
  const verifiedQuestions = EXPANDED_PLACEMENT_QUESTIONS.filter(q => q.sourceType === "Verified Company Question");
  const reportedQuestions = EXPANDED_PLACEMENT_QUESTIONS.filter(q => q.sourceType === "Reported Question");
  const aiPracticeQuestions = EXPANDED_PLACEMENT_QUESTIONS.filter(q => q.sourceType === "AI-Generated Practice Question");

  assert(verifiedQuestions.length > 0, `Has verified company questions (${verifiedQuestions.length})`);
  assert(reportedQuestions.length > 0, `Has reported company questions (${reportedQuestions.length})`);
  assert(aiPracticeQuestions.length > 0, `Has transparently labeled AI practice questions (${aiPracticeQuestions.length})`);

  // Ensure no AI question falsely claims to be verified
  for (const q of aiPracticeQuestions) {
    assert(q.verified === false, `AI Question ${q.id} correctly has verified: false`);
    assert(q.sourceType === "AI-Generated Practice Question", `AI Question ${q.id} has transparent source type`);
  }

  console.log("\n▶ TEST 7: Subtopic Hierarchy Mapping");
  assert(SUBTOPICS_BY_TOPIC["DSA"].includes("Arrays"), "DSA includes Arrays");
  assert(SUBTOPICS_BY_TOPIC["DSA"].includes("Trees"), "DSA includes Trees");
  assert(SUBTOPICS_BY_TOPIC["DSA"].includes("Dynamic Programming"), "DSA includes Dynamic Programming");
  assert(SUBTOPICS_BY_TOPIC["DBMS"].includes("SQL"), "DBMS includes SQL");
  assert(SUBTOPICS_BY_TOPIC["DBMS"].includes("ACID"), "DBMS includes ACID");
  assert(SUBTOPICS_BY_TOPIC["Operating Systems"].includes("Processes"), "OS includes Processes");

  console.log("\n▶ TEST 8: Company Preparation Guides");
  assert(!!COMPANY_PREP_GUIDES["Amazon"], "Amazon prep guide exists");
  assert(!!COMPANY_PREP_GUIDES["Google"], "Google prep guide exists");
  assert(!!COMPANY_PREP_GUIDES["Microsoft"], "Microsoft prep guide exists");
  assert(!!COMPANY_PREP_GUIDES["Goldman Sachs"], "Goldman Sachs prep guide exists");
  assert(!!COMPANY_PREP_GUIDES["TCS"], "TCS prep guide exists");
  assert(COMPANY_PREP_GUIDES["Amazon"].hiringRounds.length >= 4, "Amazon has full round breakdown");

  console.log("\n▶ TEST 9: Question Bank Page UI & Controls");
  const qbPagePath = path.join(process.cwd(), "app", "question-bank", "page.tsx");
  assert(fs.existsSync(qbPagePath), "app/question-bank/page.tsx exists");
  const qbPageContent = fs.readFileSync(qbPagePath, "utf-8");
  assert(qbPageContent.includes("Prepare for Company"), "Contains 'Prepare for Company' mode");
  assert(qbPageContent.includes("ALL_COMPANIES"), "Renders company filter dropdown");
  assert(qbPageContent.includes("ALL_ROLES"), "Renders role filter dropdown");
  assert(qbPageContent.includes("ALL_ROUNDS"), "Renders round filter dropdown");
  assert(qbPageContent.includes("ALL_QUESTION_TYPES"), "Renders question type filter dropdown");
  assert(qbPageContent.includes("availableSubtopics"), "Renders subtopic filter dropdown");
  assert(qbPageContent.includes("Cognalyze Evidence Note"), "Contains evidence note callout");
  assert(qbPageContent.includes("Test Cases"), "Practice workspace supports test cases");
  assert(qbPageContent.includes("Complexity Analysis"), "Practice workspace supports complexity analysis");
  assert(qbPageContent.includes("Show Hint"), "Practice workspace supports hints");

  console.log("\n============================================================");
  console.log("🎉 ALL GD & QUESTION BANK VALIDATION TESTS PASSED!");
  console.log("============================================================\n");
}

runTestSuite().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
