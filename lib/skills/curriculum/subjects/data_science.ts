/**
 * lib/skills/curriculum/subjects/data_science.ts
 * 
 * Data Science & Analytics Curriculum:
 * Exploratory Data Analysis, Outlier Diagnostics, Feature Engineering,
 * Triangular Cohort Retention, and Controlled Online Experiments (A/B Testing).
 */

import { CanonicalSubject } from "../types";

export const DATA_SCIENCE_SUBJECT: CanonicalSubject = {
  slug: "data_science",
  name: "Data Science, Analytics & Experimentation",
  icon: "🔬",
  category: "Data & Databases",
  tagline: "Exploratory Profiling, Cohort Retention & Rigorous A/B Testing",
  description: "Master modern product analytics: distribution skew, outlier diagnostics, target-leakage-free feature engineering, retention curves, and hypothesis testing with SRM controls.",
  estimatedHours: 35,
  prerequisites: ["python", "pandas", "sql", "math_stats"],
  chapters: [
    {
      slug: "ab-testing-and-experimentation",
      chapterNumber: 1,
      title: "Chapter 1: A/B Testing, SRM & Statistical Decision Making",
      description: "Master hypothesis design, minimum detectable effect (MDE), Sample Ratio Mismatch (SRM) chi-square diagnostics, and two-sample proportion Z-tests.",
      topics: [
        {
          slug: "srm-and-hypothesis-testing",
          title: "Sample Ratio Mismatch (SRM) & Two-Sample Z-Tests",
          summary: "Diagnose tracking failures and compute exact confidence intervals before launching product changes.",
          subtopics: [
            {
              id: "ds-101",
              slug: "srm-diagnostics-and-ztest",
              title: "Scientific Experimentation: SRM Chi-Square & Two-Sample Z-Tests",
              subjectSlug: "data_science",
              chapterSlug: "ab-testing-and-experimentation",
              topicSlug: "srm-and-hypothesis-testing",
              estimatedMinutes: 30,
              difficulty: "advanced",
              canonicalSkill: "ab_testing_statistics",
              prerequisites: [],
              learningGoal: "Diagnose Sample Ratio Mismatch (SRM) using Pearson's Chi-Square test and calculate two-sample pooled Z-tests for conversion uplift.",
              intuitiveStory: "A casino flips a coin to assign players to Table A or Table B. After 10,000 flips, 6,000 players are at Table A and 4,000 at Table B. Before celebrating Table A's higher revenue, you must realize the coin is rigged (SRM). The experiment is invalid.",
              analogy: "An SRM test is an inspection of the laboratory balance scale before you measure the chemical reaction.",
              formalConcept: "Sample Ratio Mismatch (SRM) occurs when the observed variant traffic split diverges from the designed allocation ratio (e.g., 50/50). Chi-Square goodness-of-fit evaluates: sum((Obs - Exp)^2 / Exp). If p < 0.01, SRM is detected, invalidating standard t-test or Z-test assumptions.",
              mathFormula: "\\chi^2 = \\sum_{i} \\frac{(O_i - E_i)^2}{E_i}, \\quad Z = \\frac{p_T - p_C}{\\sqrt{p_p(1-p_p)(\\frac{1}{N_T} + \\frac{1}{N_C})}}",
              productionSignificance: "Proceeding with a feature rollout when an SRM is present leads to false positive decisions that cost tech companies millions in degraded conversion.",
              visualType: "distribution",
              mermaidDiagram: `graph TD
    Traffic["7,000 Total Visitors"] --> Split{"Chi-Square SRM Check<br/>Expected 50/50: 3500 / 3500"}
    Split -- "Observed: 3500 / 3500 (Chi2=0, p=1.0)" --> Clean["SRM Clean: Proceed to Uplift Test"]
    Clean --> ZTest["Two-Sample Z-Test: Z=2.113, p=0.0346<br/>Statistically Significant (+15.22% Lift)"]
    Split -- "Observed: 3800 / 3200 (p < 0.001)" --> Invalid["SRM Detected: Stop and Debug Routing!"]`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "Computing Chi-Square SRM in Python",
                  explanation: "Calculates Pearson chi-square statistic against expected 50/50 allocation.",
                  codeOrQuery: `import math

def check_srm(control_n: int, treat_n: int) -> tuple[float, bool]:
    total = control_n + treat_n
    exp = total / 2.0
    chi2 = ((control_n - exp) ** 2 / exp) + ((treat_n - exp) ** 2 / exp)
    # 1 degree of freedom: critical value at alpha=0.001 is 10.828
    is_srm = chi2 > 10.828
    return chi2, is_srm

print("3500 vs 3500 Chi2:", check_srm(3500, 3500))
print("3800 vs 3200 Chi2:", check_srm(3800, 3200))`,
                  outputSummary: "Clean split yields Chi2 = 0.0 (no SRM); 3800 vs 3200 yields Chi2 = 51.4 (Severe SRM detected)."
                }
              ],
              audioNarrationScript: "Never interpret conversion uplift or p-values until you have first verified that Sample Ratio Mismatch is clean. If your router was configured for fifty-fifty traffic but delivered fifty-four to forty-six, your assignment mechanism has a bug, such as browser redirection lag or bot filtering bias. Discard the test and fix the pipeline.",
              coBuildSlot: {
                slotId: "ds-slot-101",
                instruction: "Complete the pooled proportion formula: p_pooled = (c_conv + t_conv) / (c_n + t_n).",
                starterSnippet: `def compute_pooled_p(c_conv: int, t_conv: int, c_n: int, t_n: int) -> float:\n    return (c_conv + t_conv) / (c_n + t_n)`,
                expectedPattern: "return\\s+\\(c_conv\\s*\\+\\s*t_conv\\)\\s*/\\s*\\(c_n\\s*\\+\\s*t_n\\)",
                hint1: "Sum the conversions and divide by the sum of sample sizes.",
                hint2: "Write: return (c_conv + t_conv) / (c_n + t_n)",
                validationExplanation: "Correctly computes the pooled proportion under the null hypothesis."
              },
              executionEnvironment: "python_sandbox",
              starterCodeOrQuery: `import math

def compute_z_test(c_n: int, c_conv: int, t_n: int, t_conv: int):
    p_c = c_conv / c_n
    p_t = t_conv / t_n
    p_pool = (c_conv + t_conv) / (c_n + t_n)
    se = math.sqrt(p_pool * (1.0 - p_pool) * (1.0 / c_n + 1.0 / t_n))
    z = (p_t - p_c) / se
    uplift = ((p_t - p_c) / p_c) * 100.0
    return z, uplift

z, uplift = compute_z_test(3500, 368, 3500, 424)
print(f"Z-score: {z:.3f}, Relative Uplift: {uplift:.2f}%")
`,
              debugFault: {
                faultId: "ds-fault-101",
                title: "Computing Unpooled Standard Error for Null Hypothesis Z-Test",
                buggyCodeOrConfig: `import math
def compute_se(p_c, n_c, p_t, n_t):
    # Bug: Using unpooled variances for standard null hypothesis testing
    return math.sqrt((p_c * (1 - p_c) / n_c) + (p_t * (1 - p_t) / n_t))`,
                correctCodeOrConfig: `import math
def compute_se(p_c, n_c, p_t, n_t):
    p_pool = (p_c * n_c + p_t * n_t) / (n_c + n_t)
    return math.sqrt(p_pool * (1.0 - p_pool) * (1.0 / n_c + 1.0 / n_t))`,
                diagnosticHint: "Under H0 (p_c == p_t), both variants share a common pooled proportion p_pool.",
                explanation: "The standard two-sample proportion Z-test pools variances under the null hypothesis."
              },
              comprehensionChecks: [
                {
                  id: "ds-cc-101a",
                  question: "If an A/B test has an SRM with p < 0.0001, what action should the data team take?",
                  options: [
                    "Report the uplift as valid if the Z-test has p < 0.05.",
                    "Invalidate the experiment, pause rollout, and investigate assignment/logging bias.",
                    "Double the sample size and continue testing.",
                    "Remove 10% of users at random."
                  ],
                  correctIndex: 1,
                  explanation: "An SRM proves that user assignment is corrupted, introducing selection bias that invalidates all statistical inferences."
                }
              ],
              independentChallenge: {
                challengeId: "ds-chal-101",
                title: "Automated Experiment Safety Gatekeeper",
                description: "Write an end-to-end evaluation function evaluate_experiment(c_n, c_conv, t_n, t_conv, mde_pct) that returns 'ROLLOUT', 'STOP_SRM', or 'INCONCLUSIVE'.",
                starterCode: `import math

def evaluate_experiment(c_n: int, c_conv: int, t_n: int, t_conv: int, mde_pct: float) -> str:
    # 1. SRM Check (50/50 expected)
    total = c_n + t_n
    exp = total / 2.0
    chi2 = ((c_n - exp)**2 / exp) + ((t_n - exp)**2 / exp)
    if chi2 > 10.828:
        return "STOP_SRM"

    # 2. Uplift & Z-Score
    p_c = c_conv / c_n
    p_t = t_conv / t_n
    rel_lift = ((p_t - p_c) / p_c) * 100.0
    p_pool = (c_conv + t_conv) / total
    se = math.sqrt(p_pool * (1 - p_pool) * (2.0 / (c_n)))
    z = (p_t - p_c) / se

    if z >= 1.96 and rel_lift >= mde_pct:
        return "ROLLOUT"
    return "INCONCLUSIVE"
`,
                solutionCode: `import math

def evaluate_experiment(c_n: int, c_conv: int, t_n: int, t_conv: int, mde_pct: float) -> str:
    total = c_n + t_n
    exp = total / 2.0
    chi2 = ((c_n - exp)**2 / exp) + ((t_n - exp)**2 / exp)
    if chi2 > 10.828:
        return "STOP_SRM"

    p_c = c_conv / c_n
    p_t = t_conv / t_n
    rel_lift = ((p_t - p_c) / p_c) * 100.0
    p_pool = (c_conv + t_conv) / total
    se = math.sqrt(p_pool * (1 - p_pool) * (1.0 / c_n + 1.0 / t_n))
    z = (p_t - p_c) / se

    if z >= 1.96 and rel_lift >= mde_pct:
        return "ROLLOUT"
    return "INCONCLUSIVE"
`,
                testCases: [
                  {
                    input: "c_n=3500, c_c=368, t_n=3500, t_c=424, mde=5.0",
                    expectedOutput: "ROLLOUT",
                    description: "SRM is clean, lift is +15.22% (> 5% MDE), and Z > 1.96."
                  }
                ],
                rubric: {
                  correctness: 40,
                  codeQuality: 30,
                  efficiency: 30
                }
              }
            }
          ]
        }
      ]
    }
  ]
};

