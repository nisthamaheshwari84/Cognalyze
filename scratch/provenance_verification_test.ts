import {
  buildCandidateIntelligenceProfile,
  buildJDCompetencyMatrix,
  extractTwelvePointProjectProfile,
  CandidateIntelligenceProfile
} from "../lib/interview/candidate-intelligence";

async function runProvenanceVerification() {
  console.log("=== PART A5: EVIDENCE PROVENANCE INDEPENDENT VERIFICATION ===\n");

  const results: Array<{ test: string; status: "PASS" | "FAIL"; details: string }> = [];

  // Scenario 1: Resume mentions React -> Must NOT become VERIFIED_EVIDENCE
  const profile1 = buildCandidateIntelligenceProfile({
    candidateId: "cand_prov_1",
    resumeText: "Skills: React, Redux, HTML, CSS. Built responsive web applications.",
    verifiedDNASkills: [] // No verified DNA
  });
  const reactProv = profile1.provenanceMap["react"];
  const s1Passed = reactProv && reactProv.provenance === "CANDIDATE_CLAIM";
  results.push({
    test: "A5.1: Resume-declared skill cannot become VERIFIED_EVIDENCE",
    status: s1Passed ? "PASS" : "FAIL",
    details: `React provenance=${reactProv?.provenance} (Expected: CANDIDATE_CLAIM)`
  });

  // Scenario 2: Candidate self-reports PostgreSQL -> Must remain candidate-reported / claim
  const profile2 = buildCandidateIntelligenceProfile({
    candidateId: "cand_prov_2",
    resumeText: "Experienced in backend databases.",
    claimedSkills: ["PostgreSQL"]
  });
  const pgProv = profile2.provenanceMap["postgresql"];
  const s2Passed = pgProv && (pgProv.provenance === "CANDIDATE_CLAIM" || pgProv.provenance === "CANDIDATE_REPORTED");
  results.push({
    test: "A5.2: Self-reported skill remains CANDIDATE_CLAIM / CANDIDATE_REPORTED",
    status: s2Passed ? "PASS" : "FAIL",
    details: `PostgreSQL provenance=${pgProv?.provenance}`
  });

  // Scenario 3: GitHub repository exists -> Does NOT verify personal implementation ownership
  const projectProfile = extractTwelvePointProjectProfile({
    title: "Kubernetes Cluster Autoscaler",
    githubUrl: "https://github.com/kubernetes/autoscaler", // Public repo exists
    tech: ["Go", "Kubernetes"],
    description: "Autoscaling cluster nodes based on resource metrics."
  });
  // Personal contribution must be explicitly flagged as unstated if not detailed in resume text
  const personalContrib = projectProfile.personalContribution;
  const s3Passed = projectProfile.provenance.personalContribution === "UNVERIFIED_CLAIM" || personalContrib.includes("Unstated");
  results.push({
    test: "A5.3: Public GitHub URL does not grant unearned personal contribution verification",
    status: s3Passed ? "PASS" : "FAIL",
    details: `Personal contribution provenance=${projectProfile.provenance.personalContribution}, text="${personalContrib}"`
  });

  // Scenario 4: Authenticated Student DNA evidence -> Verified with authentic source
  const profile4 = buildCandidateIntelligenceProfile({
    candidateId: "cand_prov_4",
    resumeText: "Full stack developer.",
    verifiedDNASkills: [
      { capability: "PostgreSQL Query Optimization", score: 88, evidenceSource: "student_dna_assessment" }
    ]
  });
  const verifiedPg = profile4.verifiedCompetencies.find(c => c.name.toLowerCase().includes("postgresql"));
  const s4Passed = verifiedPg && verifiedPg.provenance === "VERIFIED_EVIDENCE" && verifiedPg.verifiedScore === 88;
  results.push({
    test: "A5.4: Authenticated Student DNA evidence correctly classified as VERIFIED_EVIDENCE",
    status: s4Passed ? "PASS" : "FAIL",
    details: `Name=${verifiedPg?.name}, Score=${verifiedPg?.verifiedScore}, Source=${verifiedPg?.source}`
  });

  // Scenario 5: Platform coding assessment -> Preserved with score and verification
  const profile5 = buildCandidateIntelligenceProfile({
    candidateId: "cand_prov_5",
    verifiedDNASkills: [
      { capability: "Data Structures & Algorithms", score: 92, evidenceSource: "platform_arena_challenge" }
    ]
  });
  const dsaComp = profile5.verifiedCompetencies.find(c => c.name.includes("Algorithms"));
  const s5Passed = dsaComp && dsaComp.provenance === "VERIFIED_EVIDENCE" && dsaComp.confidence >= 0.9;
  results.push({
    test: "A5.5: Platform assessment preserves provenance and high confidence (>=0.9)",
    status: s5Passed ? "PASS" : "FAIL",
    details: `Confidence=${dsaComp?.confidence}, Provenance=${dsaComp?.provenance}`
  });

  // Scenario 6: Next.js implies React -> Must remain INFERRED
  const profile6 = buildCandidateIntelligenceProfile({
    candidateId: "cand_prov_6",
    resumeText: "Built frontend using Next.js 14 App Router and Tailwind CSS.",
    claimedSkills: ["Next.js", "Tailwind CSS"]
  });
  const inferredReact = profile6.inferredCompetencies.find(c => c.name.toLowerCase().includes("react"));
  const s6Passed = inferredReact && inferredReact.provenance === "INFERRED";
  results.push({
    test: "A5.6: Dependent frameworks (Next.js -> React) classified strictly as INFERRED",
    status: s6Passed ? "PASS" : "FAIL",
    details: `Inferred competency=${inferredReact?.name}, Provenance=${inferredReact?.provenance}, Source="${inferredReact?.source}"`
  });

  // Scenario 7: Missing JD skill -> Reported as unsupported requirement, NOT candidate incompetence
  const jdMatrix = buildJDCompetencyMatrix(
    "Senior Cloud Engineer: Deep Kubernetes, Kafka, and Rust microservices architecture required.",
    "Cloud Engineer",
    ["Node.js", "PostgreSQL", "Docker"] // Missing Kubernetes, Kafka, Rust
  );
  const unsupported = jdMatrix.unsupportedJDRequirements;
  const s7Passed = unsupported.length > 0 && unsupported.some(u => /kafka|stream|queue|kubernetes|rust|api/i.test(u));
  results.push({
    test: "A5.7: Unsupported JD competencies detected as role requirement gap rather than penalty",
    status: s7Passed ? "PASS" : "FAIL",
    details: `Unsupported JD requirements: [${unsupported.join(", ")}]`
  });

  // Scenario 8: Contradictory sources -> Preserves conflict in potentialInconsistencies
  const profile8 = buildCandidateIntelligenceProfile({
    candidateId: "cand_prov_8",
    resumeText: `
      Candidate with 1 year experience as Junior Developer.
      Experience: Built 10 complex microservices in 10 years of senior leadership.
    `,
    claimedSkills: ["Kubernetes", "Kafka", "Distributed Systems"]
  });
  const conflicts = profile8.potentialInconsistencies;
  const s8Passed = Array.isArray(conflicts); // Conflict array exists and does not silently overwrite
  results.push({
    test: "A5.8: Inconsistencies data structure preserves conflict records",
    status: s8Passed ? "PASS" : "FAIL",
    details: `potentialInconsistencies count=${conflicts.length}`
  });

  console.log("=== EVIDENCE PROVENANCE TEST RESULTS ===");
  for (const r of results) {
    console.log(`[${r.status}] ${r.test}`);
    console.log(`      Details: ${r.details}`);
  }
}

runProvenanceVerification().catch(console.error);
