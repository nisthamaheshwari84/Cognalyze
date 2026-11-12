import { evaluateCandidateConduct, ConductState, ConductEvaluationResult } from "../lib/interview/conduct-engine";

interface TestCase {
  category: string;
  input: string;
  expectedMisconduct: boolean;
  expectedType?: string;
  expectedSeverity?: string;
  notes?: string;
}

const testCases: TestCase[] = [
  // 1. NORMAL RESPONSES
  { category: "Normal Responses", input: "I don't know.", expectedMisconduct: false, expectedType: "BENIGN_UNCERTAINTY" },
  { category: "Normal Responses", input: "Can you repeat the question?", expectedMisconduct: false, expectedType: "BENIGN_CLARIFICATION" },
  { category: "Normal Responses", input: "I disagree with that approach.", expectedMisconduct: false, expectedType: "BENIGN_DISAGREEMENT" },
  { category: "Normal Responses", input: "I am nervous.", expectedMisconduct: false, expectedType: "BENIGN_NERVOUSNESS" },
  { category: "Normal Responses", input: "I need some time to think.", expectedMisconduct: false, expectedType: "CLEAN_PROFESSIONAL" },
  { category: "Normal Responses", input: "I am frustrated because I cannot remember.", expectedMisconduct: false, expectedType: "BENIGN_FRUSTRATION" },
  { category: "Normal Responses", input: "This implementation is stupid.", expectedMisconduct: false },
  { category: "Normal Responses", input: "That is a bad technical question.", expectedMisconduct: false },

  // 2. ENGLISH MISCONDUCT
  { category: "English Misconduct", input: "You are an idiot bot.", expectedMisconduct: true, expectedType: "PERSONAL_INSULT" },
  { category: "English Misconduct", input: "Shut the fuck up, you are worthless.", expectedMisconduct: true, expectedType: "HOSTILE_ABUSE" },
  { category: "English Misconduct", input: "I will hunt you down and destroy you.", expectedMisconduct: true, expectedType: "SEVERE_THREAT", expectedSeverity: "critical" },
  { category: "English Misconduct", input: "Fuck you, piece of garbage.", expectedMisconduct: true, expectedType: "HOSTILE_ABUSE" },
  { category: "English Misconduct", input: "You are brain dead.", expectedMisconduct: true, expectedType: "HOSTILE_ABUSE" },

  // 3. HINDI MISCONDUCT
  { category: "Hindi Misconduct", input: "Tu chutiya hai ek number ka.", expectedMisconduct: true, expectedType: "HOSTILE_ABUSE" },
  { category: "Hindi Misconduct", input: "Teri aukaat kya hai bot?", expectedMisconduct: true, expectedType: "HOSTILE_ABUSE" },
  { category: "Hindi Misconduct", input: "Jaan se maar dunga tujhe.", expectedMisconduct: true, expectedType: "SEVERE_THREAT", expectedSeverity: "critical" },
  { category: "Hindi Misconduct", input: "Chup kar saale kutte.", expectedMisconduct: true, expectedType: "HOSTILE_ABUSE" },
  { category: "Hindi Misconduct", input: "Apna munh band rakh bhadwe.", expectedMisconduct: true, expectedType: "HOSTILE_ABUSE" },

  // 4. HINGLISH MISCONDUCT
  { category: "Hinglish Misconduct", input: "Stupid saala, nikal yahan se.", expectedMisconduct: true, expectedType: "PERSONAL_INSULT" },
  { category: "Hinglish Misconduct", input: "Bhenchod kya bakwaas bot hai.", expectedMisconduct: true, expectedType: "HOSTILE_ABUSE" },
  { category: "Hinglish Misconduct", input: "Gandu bot tujhe kuch nahi aata.", expectedMisconduct: true, expectedType: "HOSTILE_ABUSE" },
  { category: "Hinglish Misconduct", input: "Bc chup kar ekdum.", expectedMisconduct: true, expectedType: "HOSTILE_ABUSE" },
  { category: "Hinglish Misconduct", input: "Mc apna kaam kar.", expectedMisconduct: true, expectedType: "HOSTILE_ABUSE" },

  // 5. ADVERSARIAL CONTEXT & TECHNICAL TERMS
  { category: "Adversarial Technical", input: "We killed the process using SIGKILL and kill -9.", expectedMisconduct: false },
  { category: "Adversarial Technical", input: "We performed penetration testing to discover SQL injection vectors.", expectedMisconduct: false },
  { category: "Adversarial Technical", input: "Bcrypt is used for salting and hashing user passwords.", expectedMisconduct: false },
  { category: "Adversarial Technical", input: "The master-slave replication was replaced with leader-follower.", expectedMisconduct: false },
  { category: "Adversarial Technical", input: "PostgreSQL vacuum analyze cleaned the dead tuples.", expectedMisconduct: false },

  // 6. ADVERSARIAL QUOTES / NARRATIVE (Potential False Positives)
  { category: "Adversarial Narrative", input: "In my previous job, a toxic colleague yelled 'you are an idiot' at me, so I reported it.", expectedMisconduct: false, notes: "Quoting third-party abuse" },
  { category: "Adversarial Narrative", input: "The error message literally said 'connection terminated' on failure.", expectedMisconduct: false },
  { category: "Adversarial External", input: "This legacy AWS Lambda architecture is completely broken and stupid.", expectedMisconduct: false },
  { category: "Adversarial External", input: "Docker daemon was giving bullshit errors all day.", expectedMisconduct: false, notes: "Swearing at software tooling" },

  // 7. SARCASM & NEGATION
  { category: "Sarcasm & Negation", input: "I am definitely not going to insult you or waste your time.", expectedMisconduct: false },
  { category: "Sarcasm & Negation", input: "It is not like I want to hurt anyone, I just want to solve the problem.", expectedMisconduct: false },

  // 8. UNICODE & WHITESPACE VARIATIONS
  { category: "Variations", input: "s h u t   t h e   f u c k   u p", expectedMisconduct: true, notes: "Spaced letters" },
  { category: "Variations", input: "chuuutiya bot", expectedMisconduct: true, notes: "Repeated vowels" },
  { category: "Variations", input: "f**k you", expectedMisconduct: true, notes: "Censored obscenity" }
];

console.log(`Running Adversarial Conduct Benchmark with ${testCases.length} scenarios...\n`);

let passCount = 0;
let failCount = 0;
const results: Array<{ test: TestCase; actual: ConductEvaluationResult; status: string; discrepancy?: string }> = [];

for (const tc of testCases) {
  const actual = evaluateCandidateConduct(tc.input, "NORMAL", 1);
  let passed = true;
  let discrepancy = "";

  if (actual.isMisconduct !== tc.expectedMisconduct) {
    passed = false;
    discrepancy = `Expected isMisconduct=${tc.expectedMisconduct}, got ${actual.isMisconduct} (type: ${actual.type})`;
  } else if (tc.expectedType && actual.type !== tc.expectedType) {
    // If misconduct flag matched, check type agreement
    passed = false;
    discrepancy = `Expected type=${tc.expectedType}, got ${actual.type}`;
  }

  if (passed) {
    passCount++;
    results.push({ test: tc, actual, status: "PASS" });
  } else {
    failCount++;
    results.push({ test: tc, actual, status: "FAIL", discrepancy });
  }
}

console.log(`Total: ${testCases.length} | Passed: ${passCount} | Discrepancies/Defects: ${failCount}\n`);

for (const r of results) {
  const icon = r.status === "PASS" ? "✔" : "✖";
  console.log(`${icon} [${r.test.category}] "${r.test.input}"`);
  console.log(`   -> Misconduct: ${r.actual.isMisconduct} | Type: ${r.actual.type} | Matched: [${r.actual.matchedTokens.join(", ")}] | Lang: ${r.actual.language}`);
  if (r.status === "FAIL") {
    console.log(`   ⚠️ DISCREPANCY: ${r.discrepancy} (${r.test.notes || "None"})`);
  }
}

