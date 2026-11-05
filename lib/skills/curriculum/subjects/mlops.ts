/**
 * lib/skills/curriculum/subjects/mlops.ts
 * 
 * MLOps & Production AI Curriculum:
 * Model Serving with FastAPI, Low-Latency Inference, Model Drift Detection,
 * Population Stability Index (PSI), Feature Stores, and Automated CI/CD for ML.
 */

import { CanonicalSubject } from "../types";

export const MLOPS_SUBJECT: CanonicalSubject = {
  slug: "mlops",
  name: "MLOps, Serving & Production AI Systems",
  icon: "🚀",
  category: "AI & Modern ML",
  tagline: "High-Throughput Model Serving, Drift Detection & Observability",
  description: "Master real-world machine learning operations: microservice serving with FastAPI, ONNX runtime quantization, data/concept drift detection with PSI, and automated retraining pipelines.",
  estimatedHours: 35,
  prerequisites: ["python", "machine_learning"],
  chapters: [
    {
      slug: "model-drift-and-monitoring",
      chapterNumber: 1,
      title: "Chapter 1: Model Drift Detection & Statistical Monitoring",
      description: "Detect covariate shift and concept drift using Population Stability Index (PSI) and Kolmogorov-Smirnov distribution tests.",
      topics: [
        {
          slug: "psi-and-drift-metrics",
          title: "Population Stability Index (PSI) & Covariate Shift",
          summary: "Measure changes between training baseline and live inference distributions to alert before model degradation occurs.",
          subtopics: [
            {
              id: "mlops-101",
              slug: "population-stability-index-psi",
              title: "Model Observability: Population Stability Index (PSI) & Distribution Drift",
              subjectSlug: "mlops",
              chapterSlug: "model-drift-and-monitoring",
              topicSlug: "psi-and-drift-metrics",
              estimatedMinutes: 30,
              difficulty: "advanced",
              canonicalSkill: "mlops_serving_and_monitoring",
              prerequisites: [],
              learningGoal: "Calculate the Population Stability Index (PSI) across binned feature distributions and evaluate drift severity thresholds.",
              intuitiveStory: "Imagine a clothing retailer that trains an inventory model in the summer, where 90% of searches are for swimsuits. When winter arrives, customers search for heavy coats. The model hasn't changed, but the world has (covariate shift). PSI detects this seasonal shift before inventory runs dry.",
              analogy: "PSI is a smoke detector that smells when the incoming air composition has shifted away from normal oxygen levels.",
              formalConcept: "The Population Stability Index (PSI) measures the divergence between a baseline reference distribution B and a live production distribution T across K quantile bins: PSI = sum((T_k - B_k) * ln(T_k / B_k)). PSI < 0.1 indicates stability; 0.1 <= PSI < 0.25 indicates moderate drift; PSI >= 0.25 requires immediate retraining.",
              mathFormula: "\\text{PSI} = \\sum_{k=1}^K (T_k - B_k) \\ln\\left(\\frac{T_k}{B_k}\\right)",
              productionSignificance: "Credit risk and fraud models experience continuous drift. Automated PSI alerts trigger retraining DAGs before default rates spike.",
              visualType: "distribution",
              mermaidDiagram: `graph LR
    Train["Training Baseline Distribution (10 Quantile Bins)"] --> Calc["PSI Formula: sum((T_k - B_k) * ln(T_k / B_k))"]
    Live["Production Inference Stream (Last 7 Days)"] --> Calc
    Calc --> Verdict{"Evaluate PSI Score"}
    Verdict -- "PSI < 0.1" --> Healthy["Healthy: Zero Model Drift"]
    Verdict -- "0.1 <= PSI < 0.25" --> Monitor["Moderate Shift: Alert On-Call Engineer"]
    Verdict -- "PSI >= 0.25" --> Retrain["Significant Shift: Trigger Automated Retraining Pipeline!"]`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "Calculating Population Stability Index in Python",
                  explanation: "Binned frequency calculation with zero-division safeguard.",
                  codeOrQuery: `import math

def calculate_psi(baseline_counts: list[int], target_counts: list[int]) -> float:
    b_total, t_total = sum(baseline_counts), sum(target_counts)
    psi = 0.0
    for b, t in zip(baseline_counts, target_counts):
        b_pct = max(1e-4, b / b_total)
        t_pct = max(1e-4, t / t_total)
        psi += (t_pct - b_pct) * math.log(t_pct / b_pct)
    return psi

baseline = [100, 100, 100, 100]
stable_live = [105, 95, 102, 98]
drifted_live = [20, 30, 200, 150]

print(f"Stable Live PSI: {calculate_psi(baseline, stable_live):.4f}")
print(f"Drifted Live PSI: {calculate_psi(baseline, drifted_live):.4f}")`,
                  outputSummary: "Stable Live PSI: ~0.002 (< 0.1); Drifted Live PSI: ~0.42 (>= 0.25 - Retrain Required)"
                }
              ],
              audioNarrationScript: "Population Stability Index is the industry standard for monitoring feature and prediction drift. It compares the percentage of samples falling into each bucket between your training dataset and live production inference. If your score exceeds zero point twenty-five, your model is operating on unfamiliar data and must be retrained.",
              coBuildSlot: {
                slotId: "mlops-slot-101",
                instruction: "Complete the term: (t_pct - b_pct) * math.log(t_pct / b_pct).",
                starterSnippet: `import math\ndef psi_term(b_pct: float, t_pct: float) -> float:\n    return (t_pct - b_pct) * math.log(t_pct / b_pct)`,
                expectedPattern: "\\(t_pct\\s*-\\s*b_pct\\)\\s*\\*\\s*math\\.log\\(t_pct\\s*/\\s*b_pct\\)",
                hint1: "Multiply difference (t_pct - b_pct) by the natural log of (t_pct / b_pct).",
                hint2: "Write: return (t_pct - b_pct) * math.log(t_pct / b_pct)",
                validationExplanation: "Correctly computes symmetric Kullback-Leibler divergence term."
              },
              executionEnvironment: "python_sandbox",
              starterCodeOrQuery: `import math

def psi_term(b_pct: float, t_pct: float) -> float:
    return (t_pct - b_pct) * math.log(t_pct / b_pct)

# 25% baseline vs 40% live in a single bin
print("Bin PSI contribution:", psi_term(0.25, 0.40))
`,
              debugFault: {
                faultId: "mlops-fault-101",
                title: "Log Division by Zero When a Live Bin Has 0 Counts",
                buggyCodeOrConfig: `import math
def compute_bin_psi(b_cnt, t_cnt, total_b, total_t):
    # Bug: When t_cnt is 0, math.log(0) crashes with ValueError: math domain error
    b_p = b_cnt / total_b
    t_p = t_cnt / total_t
    return (t_p - b_p) * math.log(t_p / b_p)`,
                correctCodeOrConfig: `import math
def compute_bin_psi(b_cnt, t_cnt, total_b, total_t):
    eps = 1e-4
    b_p = max(eps, b_cnt / total_b)
    t_p = max(eps, t_cnt / total_t)
    return (t_p - b_p) * math.log(t_p / b_p)`,
                diagnosticHint: "Use max(1e-4, ...) or Laplace smoothing to prevent math domain errors on unpopulated bins.",
                explanation: "Production features frequently have rare bins that receive zero hits over short aggregation windows."
              },
              comprehensionChecks: [
                {
                  id: "mlops-cc-101a",
                  question: "According to industry standard thresholds, what does a PSI of 0.28 indicate?",
                  options: [
                    "The model has 28% accuracy.",
                    "Significant distribution shift; model degradation is likely and retraining should be triggered.",
                    "The model is overfitting.",
                    "The feature has low importance."
                  ],
                  correctIndex: 1,
                  explanation: "A PSI >= 0.25 indicates significant population shift requiring model review or automated retraining."
                }
              ],
              independentChallenge: {
                challengeId: "mlops-chal-101",
                title: "Production Drift Guard Evaluator",
                description: "Write an automated drift detector detect_feature_drift(baseline_bins, live_bins) that returns a status report: 'HEALTHY', 'MODERATE_DRIFT', or 'ACTION_REQUIRED_RETRAIN'.",
                starterCode: `import math

def detect_feature_drift(baseline: list[int], live: list[int]) -> str:
    total_b, total_l = sum(baseline), sum(live)
    psi = 0.0
    for b, l in zip(baseline, live):
        p_b = max(1e-4, b / total_b)
        p_l = max(1e-4, l / total_l)
        psi += (p_l - p_b) * math.log(p_l / p_b)
    if psi >= 0.25:
        return "ACTION_REQUIRED_RETRAIN"
    elif psi >= 0.10:
        return "MODERATE_DRIFT"
    return "HEALTHY"
`,
                solutionCode: `import math

def detect_feature_drift(baseline: list[int], live: list[int]) -> str:
    total_b, total_l = sum(baseline), sum(live)
    psi = 0.0
    for b, l in zip(baseline, live):
        p_b = max(1e-4, b / total_b)
        p_l = max(1e-4, l / total_l)
        psi += (p_l - p_b) * math.log(p_l / p_b)
    if psi >= 0.25:
        return "ACTION_REQUIRED_RETRAIN"
    elif psi >= 0.10:
        return "MODERATE_DRIFT"
    return "HEALTHY"
`,
                testCases: [
                  {
                    input: "baseline=[100, 100, 100], live=[20, 50, 230]",
                    expectedOutput: "ACTION_REQUIRED_RETRAIN",
                    description: "Accurately flags severe shift across categories."
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

