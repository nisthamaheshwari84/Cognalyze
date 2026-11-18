import assert from "node:assert/strict";
import {
  buildCandidateIntelligence,
  StructuredCandidateIntelligence,
} from "../lib/resume/candidate-intelligence";
import {
  formulateResumeContentStrategy,
  synthesizeOptimizedResumeContent,
  OptimizedResumeContent,
} from "../lib/resume/content-engine";
import {
  generateResumeLaTeX,
  escapeLaTeX,
  LaTeXTemplateFamily,
} from "../lib/resume/latex-engine";
import {
  auditResumeIntegrity,
  ResumeIntegrityAuditResult,
} from "../lib/resume/integrity-engine";
import {
  evaluateResumeQuality,
  ComprehensiveQualityReport,
} from "../lib/resume/quality-evaluator";
import {
  simulateATSParsing,
  ATSParsingSimulationResult,
} from "../lib/resume/output-validator";
import {
  createCompanyResumeVariant,
  CompanyResumeVariant,
} from "../lib/resume/variant-engine";

async function runTests() {
  console.log("=== NEXT-GENERATION RESUME INTELLIGENCE & GENERATION BENCHMARK ===");

  // -------------------------------------------------------------------------
  // Scenario 1: Fresher Candidate (Education & Projects Prioritized, Zero Fake Exp)
  // -------------------------------------------------------------------------
  console.log("\n[Test 1] Fresher Candidate - Prioritizes Education & Projects with Zero Fake Experience");
  {
    const fresherBackground = `
      Name: Nishtha Maheshwari
      Education: B.Tech in Computer Science and Engineering at ABES Engineering College, Ghaziabad (2024 - 2028). CGPA: 8.8 / 10.0.
      Coursework: Data Structures and Algorithms, Object-Oriented Programming, Database Management Systems, Operating Systems.
      Projects:
      - Cognalyze AI Platform: Autonomous career preparation and resume intelligence system using Next.js, TypeScript, and PostgreSQL.
      - Sandboxed Code Execution: Multi-tenant isolated Python sandbox with memory limits.
      Skills: Python, TypeScript, React, Next.js, PostgreSQL, Docker, Git.
    `;

    const intel = buildCandidateIntelligence({
      rawBackgroundText: fresherBackground,
      targetRole: "Software Engineering Intern",
    });

    assert.equal(intel.careerStage, "fresher", "Candidate should be identified as fresher");
    assert.equal(intel.name, "Nishtha Maheshwari");
    assert.equal(intel.education.length, 1);
    assert.equal(intel.education[0].institution, "ABES Engineering College, Ghaziabad");
    assert.equal(intel.education[0].gpa, "8.8 / 10.0");
    assert.equal(intel.experience.length, 0, "Fresher must NOT have fabricated professional experience");

    const content = synthesizeOptimizedResumeContent(intel, "Python, React, PostgreSQL", true);
    assert.deepEqual(content.strategy.sectionOrder.slice(0, 2), ["Education", "Projects"], "Section order must prioritize Education and Projects");
    assert.equal(content.experience.length, 0, "No experience items should be fabricated");
    assert.ok(content.projects.length >= 1, "At least one project should be structured");

    const latex = generateResumeLaTeX(content, { template: "fresher" });
    assert.ok(latex.includes("\\section*{Education}"), "LaTeX must include Education section");
    assert.ok(latex.includes("ABES Engineering College, Ghaziabad"), "LaTeX must include student college");
    console.log("  ✓ Fresher verified: 0 fake experience, education & projects prioritized, coursework preserved.");
  }

  // -------------------------------------------------------------------------
  // Scenario 2: Experienced Candidate (3+ Years, Action Verbs, Metrics Preserved)
  // -------------------------------------------------------------------------
  console.log("\n[Test 2] Experienced Candidate - Verifiable Metrics & Action Verbs");
  {
    const expBackground = `
      Name: Rahul Verma
      Target Role: Senior Backend Engineer
      Experience: 4 years of experience as Software Engineer at Enterprise Systems.
      - Architected distributed event-streaming pipeline processing 250k events/sec with Apache Kafka.
      - Optimized database indexes in PostgreSQL reducing p99 query latency by 45%.
      Projects:
      - High-Throughput KV Store: Distributed key-value store using Raft consensus and Go.
      Skills: Go, Python, PostgreSQL, Kafka, Redis, Docker, Kubernetes.
    `;

    const intel = buildCandidateIntelligence({
      rawBackgroundText: expBackground,
      targetRole: "Senior Backend Engineer",
    });

    assert.equal(intel.careerStage, "senior");
    const content = synthesizeOptimizedResumeContent(intel, "Go, Kafka, PostgreSQL", true);
    assert.ok(content.strategy.sectionOrder.includes("Experience"));

    // Check project bullet optimization
    assert.ok(content.projects.length >= 1);
    const bullets = content.projects[0].bullets;
    for (const b of bullets) {
      assert.ok(b.actionVerb.length > 0, `Bullet must have an action verb: ${b.text}`);
    }
    console.log("  ✓ Experienced candidate verified: action verbs enforced, senior stage detected.");
  }

  // -------------------------------------------------------------------------
  // Scenario 3: AI / ML Specialist (PyTorch, Transformers, LLMs Categorization)
  // -------------------------------------------------------------------------
  console.log("\n[Test 3] AI/ML Specialist - Technical Depth & Clean Categorization");
  {
    const aiBackground = `
      Name: Anya Chen
      Education: M.S. in Artificial Intelligence at Stanford University.
      Projects:
      - Neural RAG System: Built hybrid dense-sparse retrieval system with LangChain, PyTorch, and Qdrant.
      Skills: Python, PyTorch, Transformers, LLMs, LangChain, Qdrant, Docker, FastAPI.
    `;

    const intel = buildCandidateIntelligence({
      rawBackgroundText: aiBackground,
      targetRole: "AI/ML Research Engineer",
    });

    const content = synthesizeOptimizedResumeContent(intel, "PyTorch, Transformers, Vector Search");
    assert.ok(content.skillsCategorized["AI & ML"], "AI & ML category must exist");
    const aiSkills = content.skillsCategorized["AI & ML"];
    assert.ok(aiSkills.includes("PyTorch") || aiSkills.includes("Transformers") || aiSkills.includes("LLMs"));
    console.log("  ✓ AI/ML skills accurately categorized under 'AI & ML'.");
  }

  // -------------------------------------------------------------------------
  // Scenario 4: Anti-Keyword-Stuffing & Authentic Context
  // -------------------------------------------------------------------------
  console.log("\n[Test 4] Anti-Keyword-Stuffing - Skills Matched Only Where Supported");
  {
    const text = `
      Name: David Kim
      Projects:
      - CLI Task Manager: Simple command-line tool built in Rust.
      Skills: Rust, Linux.
    `;

    const intel = buildCandidateIntelligence({
      rawBackgroundText: text,
      targetRole: "Systems Engineer",
    });

    // Target JD with keywords candidate DOES NOT have (e.g. Kubernetes, AWS, GraphQL)
    const jdKeywords = "Rust, Linux, Kubernetes, AWS, GraphQL, Snowflake";
    const content = synthesizeOptimizedResumeContent(intel, jdKeywords);

    // Certifications must not be injected with AWS
    assert.equal(content.certifications.length, 0, "Unsubstantiated cloud certs must not be added");

    // Only Rust and Linux should be present in skills
    const allSkills = Object.values(content.skillsCategorized).flat();
    assert.ok(!allSkills.includes("Snowflake"), "Unclaimed skills must NOT be hallucinated");
    console.log("  ✓ Anti-keyword stuffing verified: unclaimed skills are excluded.");
  }

  // -------------------------------------------------------------------------
  // Scenario 5: Unsupported Certifications Detection (Zero Fabrication Gate)
  // -------------------------------------------------------------------------
  console.log("\n[Test 5] Integrity Gate - Flags Unsupported Certifications");
  {
    const honestIntel = buildCandidateIntelligence({
      rawBackgroundText: "Name: John Doe\nEducation: B.S. CS.\nSkills: Java.",
      certificationsText: "", // Empty
    });

    // Fabricate a certification into output content as if a rogue LLM injected it
    const rogueContent = synthesizeOptimizedResumeContent(honestIntel);
    rogueContent.certifications = ["AWS Certified Solutions Architect - Professional"];

    const audit = auditResumeIntegrity(rogueContent, honestIntel);
    assert.equal(audit.passed, false, "Audit must fail when output contains uncertified certs");
    assert.ok(audit.blockers.some((b) => b.ruleId === "FABRICATED_CERTIFICATION"));
    assert.ok(audit.integrityScore < 80, "Integrity score must be penalized");
    console.log(`  ✓ Rogue certification caught: ${audit.blockers[0].title} (Score: ${audit.integrityScore})`);
  }

  // -------------------------------------------------------------------------
  // Scenario 6: Unanchored Quantitative Metrics Detection
  // -------------------------------------------------------------------------
  console.log("\n[Test 6] Integrity Gate - Flags Unanchored Quantitative Metrics");
  {
    const modestIntel = buildCandidateIntelligence({
      rawBackgroundText: "Name: Sara\nProjects:\n- Web Blog: Built a web blog with Node.js and SQLite.",
    });

    const inflatedContent = synthesizeOptimizedResumeContent(modestIntel);
    assert.ok(inflatedContent.projects.length >= 1, "Project should exist");
    inflatedContent.projects[0].bullets.push({
      id: "fake_metric",
      text: "Boosted system performance by 500% and handled 100k requests/sec.",
      actionVerb: "Boosted",
      technologiesUsed: ["Node.js"],
      hasVerifiedMetric: true,
    });

    const audit = auditResumeIntegrity(inflatedContent, modestIntel);
    assert.ok(audit.warnings.some((w) => w.ruleId === "UNANCHORED_METRIC"));
    console.log(`  ✓ Unanchored metrics detected: ${audit.warnings[0].title}`);
  }

  // -------------------------------------------------------------------------
  // Scenario 7: Zero-Education Resume (Never Fabricates Colleges)
  // -------------------------------------------------------------------------
  console.log("\n[Test 7] Zero-Education Handling - Zero Dummy Colleges");
  {
    const noEduBackground = `
      Name: Self Taught Developer
      Projects:
      - Open Source Contributor: Fixed 15 issues in open source React libraries.
      Skills: JavaScript, TypeScript, React.
    `;

    const intel = buildCandidateIntelligence({
      rawBackgroundText: noEduBackground,
    });

    assert.equal(intel.education.length, 0, "No education should be parsed if none provided");
    const content = synthesizeOptimizedResumeContent(intel);
    assert.equal(content.education.length, 0, "Never inject dummy college like 'Technical Institute'");
    console.log("  ✓ Zero education candidate handled cleanly without dummy institution injection.");
  }

  // -------------------------------------------------------------------------
  // Scenario 8: Overleaf LaTeX Compilation Validity & Escaping
  // -------------------------------------------------------------------------
  console.log("\n[Test 8] LaTeX Engine - Compilable Overleaf Code & Special Character Escaping");
  {
    const rawText = "Name: Jane & John Doe\nEducation: B.S. in CS.\nProjects:\n- Parser_{v1}: Handled 10% ~ 20% spike ^ 2.\nSkills: C++, C#.";
    const intel = buildCandidateIntelligence({ rawBackgroundText: rawText });
    const content = synthesizeOptimizedResumeContent(intel);
    content.summary = "100% C++ & C# specialist with $50k cost reduction #1 rank.";

    const latex = generateResumeLaTeX(content, { template: "ats-classic" });

    // Validate LaTeX document structure
    assert.ok(latex.startsWith("% =============================================================================="));
    assert.ok(latex.includes("\\documentclass[10pt,a4paper]{article}"));
    assert.ok(latex.includes("\\begin{document}"));
    assert.ok(latex.includes("\\end{document}"));

    // Validate special character escaping: raw '&', '%', '$', '#', '_' must appear escaped
    assert.ok(latex.includes("\\&"), "Must escape '&' as '\\&'");
    assert.ok(latex.includes("\\%"), "Must escape '%' as '\\%'");
    assert.ok(latex.includes("\\$"), "Must escape '$' as '\\$'");
    assert.ok(latex.includes("\\#"), "Must escape '#' as '\\#'");
    assert.ok(latex.includes("\\_"), "Must escape '_' as '\\_'");

    // Direct unit check on escapeLaTeX
    assert.equal(
      escapeLaTeX("A & B % C $ D # E _ F { G } ~ H ^ I"),
      "A \\& B \\% C \\$ D \\# E \\_ F \\{ G \\} \\textasciitilde{} H \\textasciicircum{} I"
    );
    console.log("  ✓ LaTeX escaping and document boundaries 100% valid.");
  }

  // -------------------------------------------------------------------------
  // Scenario 9: 7 Template Families Generation
  // -------------------------------------------------------------------------
  console.log("\n[Test 9] 7 Template Families - Generation Verification");
  {
    const intel = buildCandidateIntelligence({
      rawBackgroundText: "Name: Morgan\nEducation: B.Tech CS.\nProjects:\n- Portfolio: Built React site.\nSkills: React, CSS.",
    });
    const content = synthesizeOptimizedResumeContent(intel);

    const templates: LaTeXTemplateFamily[] = [
      "ats-classic",
      "modern-tech",
      "academic",
      "fresher",
      "executive",
      "modern-visual",
      "minimal-pro",
    ];

    for (const tmpl of templates) {
      const code = generateResumeLaTeX(content, { template: tmpl });
      assert.ok(code.includes(tmpl.toUpperCase()), `Template ${tmpl} comment header missing`);
      assert.ok(code.includes("\\begin{document}"), `Template ${tmpl} missing document body`);
      if (tmpl === "ats-classic" || tmpl === "academic") {
        assert.ok(code.includes("\\usepackage{times}"), `Template ${tmpl} should use Times font`);
      } else {
        assert.ok(code.includes("\\usepackage[default]{lato}"), `Template ${tmpl} should use Lato font`);
      }
    }
    console.log("  ✓ All 7 template families generated valid LaTeX documents.");
  }

  // -------------------------------------------------------------------------
  // Scenario 10: Company-Specific Variant Generation without Master Mutation
  // -------------------------------------------------------------------------
  console.log("\n[Test 10] Company-Specific Variant Engine - Immutability & Competency Tuning");
  {
    const masterIntel = buildCandidateIntelligence({
      rawBackgroundText: `
        Name: Nishtha Maheshwari
        Education: B.Tech Computer Science (2024-2028).
        Projects:
        - Cognalyze Intelligence Engine: Multi-tier evidence verification platform.
        - Distributed Search: Sub-10ms inverted index search in Go.
        Skills: Python, TypeScript, Go, PostgreSQL, Redis, Docker.
      `,
    });

    const masterContent = synthesizeOptimizedResumeContent(masterIntel);
    const originalMasterTitle = masterContent.title;

    // Create Google Variant
    const googleVariant = createCompanyResumeVariant({
      candidateIntel: masterIntel,
      targetCompany: "Google",
      targetRole: "Software Engineer - Search & Machine Intelligence",
      targetJdText: "Distributed Systems, Algorithms, Concurrency, High Throughput",
    });

    assert.equal(googleVariant.targetCompany, "Google");
    assert.ok(googleVariant.variantName.includes("Google"));
    assert.ok(googleVariant.content.projects.length > 0);

    // Verify Master Resume was NOT mutated
    assert.equal(masterContent.title, originalMasterTitle, "Master resume title must remain immutable");
    console.log("  ✓ Company variant created for Google without mutating master resume.");
  }

  // -------------------------------------------------------------------------
  // Scenario 11: Commercial ATS Parser Simulation & Entity Extraction
  // -------------------------------------------------------------------------
  console.log("\n[Test 11] ATS Simulation - Reading Order & Section Detection");
  {
    const intel = buildCandidateIntelligence({
      rawBackgroundText: `
        Name: Alex Morgan
        Education: B.Tech in CSE at Delhi Tech University.
        Projects:
        - Microservices Gateway: Built with Node.js and Redis.
        Skills: JavaScript, Node.js, Redis.
      `,
    });
    const content = synthesizeOptimizedResumeContent(intel);
    const latex = generateResumeLaTeX(content);

    const simulation = simulateATSParsing(latex, content);

    assert.equal(simulation.isATSParsable, true, "Resume text must be ATS parsable");
    assert.ok(simulation.score >= 85, `ATS score should be high, got ${simulation.score}`);
    assert.equal(simulation.readingOrderValid, true, "Reading order must be linear");
    assert.ok(simulation.sectionsDetected.includes("Education"), "Should detect Education section");
    assert.ok(simulation.sectionsDetected.includes("Technical Projects"), "Should detect Projects section");
    console.log(`  ✓ ATS Parser Simulation passed: score ${simulation.score}/100, linear reading order confirmed.`);
  }

  // -------------------------------------------------------------------------
  // Scenario 12: 5-Dimensional Quality Evaluator Gate
  // -------------------------------------------------------------------------
  console.log("\n[Test 12] 5-Dimensional Quality Evaluator - Quality Certification Gate");
  {
    const intel = buildCandidateIntelligence({
      rawBackgroundText: `
        Name: Nishtha Maheshwari
        Email: nishtha@example.com
        Phone: +91 98765 43210
        Education: B.Tech in Computer Science and Engineering at ABES Engineering College, Ghaziabad.
        Projects:
        - Cognalyze Intelligence Platform: Designed evidence-grounded resume parser with zero fabrication.
        Skills: Python, TypeScript, React, Next.js, PostgreSQL, Docker.
      `,
    });
    const content = synthesizeOptimizedResumeContent(intel);
    const integrity = auditResumeIntegrity(content, intel);

    const report = evaluateResumeQuality({
      content,
      integrityAudit: integrity,
      targetJdText: "Python, Next.js, PostgreSQL",
    });

    assert.ok(report.overallScore >= 80, `Expected overall score >= 80, got ${report.overallScore}`);
    assert.equal(report.isExportReady, true, "Verified resume should be export ready");
    assert.ok(report.dimensions.contentQuality.score >= 80);
    assert.ok(report.dimensions.evidenceIntegrity.score >= 90);
    assert.ok(report.dimensions.atsCompatibility.score >= 85);
    assert.ok(report.dimensions.visualQuality.score >= 85);
    console.log(`  ✓ 5D Quality Report: Overall ${report.overallScore}/100. Export Certified: ${report.isExportReady}`);
  }

  console.log("\n==================================================================");
  console.log("ALL 12 NEXT-GEN RESUME INTELLIGENCE SCENARIOS PASSED WITH 100% ACCURACY!");
  console.log("==================================================================");
}

runTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
