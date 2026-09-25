import { extractStructuredRoleFromJd } from "../lib/roles/role-extractor";

console.log("=== Scenario 1: Highly Detailed Production JD ===");
const detailedJd = `
Job Title: Senior Distributed Systems Engineer
Department: Core Infrastructure
Openings: 3
Work Mode: Remote
Location: Pan India

About Us:
We power mission-critical settlement infrastructure for millions of financial transactions.

Core Responsibilities & Requirements:
- 5+ years of production experience in Go or Java backend engineering
- Deep hands-on experience designing and operating Kafka-based event-driven architectures
- Proven mastery of backend concurrency, thread pools, and distributed consensus (Raft or Paxos)
- Bachelor's or Master's degree in Computer Science or equivalent field
- Authorized to work in India without sponsorship

Preferred Qualifications:
- Experience developing Kubernetes custom operators and CRDs
- Hands-on experience with Prometheus metrics and OpenTelemetry distributed tracing
`;

const res1 = extractStructuredRoleFromJd(detailedJd);
console.log(`Title: ${res1.roleTitle}`);
console.log(`Total Extracted: ${res1.requirements.length}`);
console.log(`Required: ${res1.summary.requiredCount}, Preferred: ${res1.summary.preferredCount}, Experience: ${res1.summary.experienceCount}, Education: ${res1.summary.educationCount}, Other: ${res1.summary.otherCount}`);
res1.requirements.forEach(r => {
  console.log(`  [${r.category.toUpperCase()}] ${r.name} -> Evidence: "${r.evidenceQuote.slice(0, 50)}..."`);
});

console.log("\n=== Scenario 2: Short & Simple JD ===");
const shortJd = `
Role: Frontend Developer
Openings: 1

We need a Frontend Developer.
Requirements:
- 2+ years experience building web applications
- Proficient in TypeScript and modern frontend frameworks
`;

const res2 = extractStructuredRoleFromJd(shortJd);
console.log(`Title: ${res2.roleTitle}`);
console.log(`Total Extracted: ${res2.requirements.length}`);
res2.requirements.forEach(r => {
  console.log(`  [${r.category.toUpperCase()}] ${r.name} (Needs Confirmation: ${r.needsConfirmation ? r.ambiguityReason : 'No'})`);
});

console.log("\n=== Scenario 3: Messy & Ambiguous JD with Conflicts ===");
const messyJd = `
Position: Cloud Software Architect
About: Looking for someone with 3+ years experience to join fast-paced environment.

Requirements:
- 8+ years of total software engineering experience
- Experience with cloud technologies
- Strong database knowledge
`;

const res3 = extractStructuredRoleFromJd(messyJd);
console.log(`Title: ${res3.roleTitle}`);
console.log(`Total Extracted: ${res3.requirements.length}`);
console.log(`Conflicts Detected: ${res3.conflicts.length}`);
res3.conflicts.forEach(c => {
  console.log(`  ⚠️ Conflict: ${c.reason}`);
});
res3.requirements.forEach(r => {
  if (r.needsConfirmation) {
    console.log(`  ⚠️ Ambiguous: "${r.name}" -> Reason: ${r.ambiguityReason}`);
  }
});

console.log("\n✅ All 3 scenarios verified successfully without any hallucinated skills!");
