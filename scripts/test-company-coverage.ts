import { COMPANY_DIRECTORY } from "../lib/skills/company-directory";
import { getCompanyQuestions } from "../lib/skills/dsa-company-mappings";

console.log("Auditing coverage across all 56 companies...");
const dir = COMPANY_DIRECTORY;
console.log(`Directory has ${dir.length} companies.`);
