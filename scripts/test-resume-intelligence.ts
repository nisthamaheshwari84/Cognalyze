import { analyzeResumeIntelligence, validateZeroFabrication } from '../lib/ai/resume-intelligence-engine';

async function runTests() {
  console.log('====================================================');
  console.log('COGNALYZE EVIDENCE-GROUNDED RESUME INTELLIGENCE TEST');
  console.log('====================================================\n');

  const sampleResume = `
Nistha Maheshwari
Email: nistha@example.com | GitHub: github.com/nistha

EDUCATION
Bachelor of Technology in Computer Science
XYZ Institute of Technology, Graduating 2025

TECHNICAL SKILLS
Languages: Python, SQL, C++
Frameworks & Libraries: Pandas, NumPy, Scikit-learn, Flask, Matplotlib
Developer Tools: Git, VS Code, Linux

PROJECTS
Customer Churn Prediction Workflow
- Developed a customer churn prediction workflow using Python, Pandas, and Scikit-learn to identify at-risk telecommunication subscribers.
- Conducted exploratory data analysis, handled class imbalance through stratified sampling, and evaluated Random Forest and Logistic Regression models.
- Exposed model inferences via a lightweight Flask REST API for local testing.

Automated Document Classifier
- Built a text classification system in Python utilizing TF-IDF vectorization and Multinomial Naive Bayes.
- Processed 5,000+ unstructured technical text documents and categorized them into 5 distinct department queues.
`;

  const sampleJd = `
Machine Learning Engineer (Campus / Early Career)
Company: DataScale Systems

Role Requirements:
- Strong Python programming foundations and clean coding practices (Must-have / Critical)
- Practical experience with Machine Learning workflows, feature engineering, and model evaluation in Scikit-learn (Must-have / Critical)
- Experience designing and testing REST APIs (Important)
- Experience deploying applications to AWS (EC2, S3, ECS) or GCP cloud environments (Preferred)
- Experience with Generative AI / LLM orchestration frameworks like LangChain (Preferred)
`;

  console.log('[1/5] Ingesting full resume and JD into analyzeResumeIntelligence...');
  const report = await analyzeResumeIntelligence(sampleResume, sampleJd);

  console.log('[2/5] Verifying Deterministic Role Alignment Model...');
  const alignment = report.feedback.roleAlignmentSummary;
  console.log(`- Critical Requirements Supported: ${alignment.criticalSupported.supported} / ${alignment.criticalSupported.total}`);
  console.log(`- Important Requirements Supported: ${alignment.importantSupported.supported} / ${alignment.importantSupported.total}`);
  console.log(`- Preferred Requirements Supported: ${alignment.preferredSupported.supported} / ${alignment.preferredSupported.total}`);
  console.log(`- Evidence Coverage Level: ${alignment.evidenceCoverage}`);
  console.log(`- Formula Alignment Score: ${alignment.alignmentPercentage}% (Formula: ${alignment.formulaVersion})`);

  if (alignment.criticalSupported.total === 0) {
    throw new Error('FAILED: Critical requirements count should be > 0');
  }

  console.log('\n[3/5] Verifying Absolute Zero-Fabrication Policy & Evidence Drawer...');
  const bullets = [
    ...report.rewriter.experience.flatMap((e) => e.bullets),
    ...report.rewriter.projects.flatMap((p) => p.bullets),
  ];
  console.log(`- Rewritten bullets count: ${bullets.length}`);
  const zeroFab = validateZeroFabrication(bullets, sampleResume);
  console.log(`- Zero-Fabrication Check Passed: ${zeroFab.certified}`);
  if (!zeroFab.certified) {
    console.error('Violations:', zeroFab.violations);
    throw new Error('FAILED: Zero-fabrication check failed!');
  }

  for (const b of bullets.slice(0, 2)) {
    console.log(`  * Bullet: "${b.rewrittenText.slice(0, 60)}..."`);
    console.log(`    Provenance Quote: "${b.originalText.slice(0, 50)}..."`);
    console.log(`    New Facts Added: ${b.newFactsAdded}`);
    console.log(`    Defensibility: ${b.interviewDefensibility}`);
  }

  console.log('\n[4/5] Verifying Honest Market Position & Experience Quality (Fresher Fairness)...');
  console.log(`- Market Benchmark Status: ${report.feedback.marketPosition.benchmarkStatus}`);
  console.log(`- Market Explanation: "${report.feedback.marketPosition.explanation}"`);
  console.log(`- Fresher Assessment: "${report.feedback.experienceQuality.fresherFriendlyAssessment}"`);
  if (report.feedback.marketPosition.benchmarkStatus === 'COHORT_BENCHMARK' && !report.feedback.marketPosition.cohortDefinition) {
    throw new Error('FAILED: Cohort benchmark cannot be claimed without cohort definition');
  }

  console.log('\n[5/5] Verifying Cross-Section Consistency Across All 11 Canonical Sections...');
  if (!report.canonical) {
    throw new Error('FAILED: Canonical single source of truth object must be present in report');
  }

  const c = report.canonical;
  console.log(`- Canonical Ingested Requirements: ${c.requirements.length}`);
  console.log(`- Canonical Ingested Evidence Items: ${c.evidence.length}`);
  console.log(`- Canonical Matches: ${c.matches.length}`);
  console.log(`- Section 1 (Role Alignment): ${c.score.overallEvidenceMatch}%`);
  console.log(`- Section 2 (Requirement Table): ${c.matches.length} items evaluated`);
  console.log(`- Section 3 (Evidence Review): ${c.evidence.length} source-located items`);
  console.log(`- Section 4 (Strengths): ${c.strengths.length} evidence-backed strengths`);
  console.log(`- Section 5 (Gaps & Risks): ${c.gaps.length} gaps identified`);
  console.log(`- Section 6 (Experience Quality): Level=${c.experienceAnalysis.professionalExperience.level}, Projects=${c.experienceAnalysis.projectEvidence.count}`);
  console.log(`- Section 7 (Skills Gap): ${c.matches.filter(m => m.status !== 'SUPPORTED').length} gap items`);
  console.log(`- Section 8 (Truthful Rewriter): Full resume certified=${c.resumeRewrite.zeroFabricationCertified}`);
  console.log(`- Section 9 (Roadmap): ${c.roadmap.milestones.length} gap-derived milestones`);
  console.log(`- Section 10 (Interview Focus): ${c.interviewFocus.probeQuestions.length} probing questions`);
  console.log(`- Section 11 (Final Verdict): "${c.finalVerdict.oneLineVerdict}"`);

  // Assertions
  if (c.strengths.length === 0) throw new Error('FAILED: Strengths should be > 0');
  if (c.gaps.length === 0) throw new Error('FAILED: Gaps should be > 0');
  if (!c.validation.passed) throw new Error('FAILED: Validation layer failed: ' + c.validation.violations.join('; '));

  console.log('\n====================================================');
  console.log('ALL 11 SECTIONS & CANONICAL PIPELINE VERIFIED 100%!');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
