/**
 * lib/skills/ai-data/curriculum/mlops-curriculum.ts
 *
 * Complete MLOps & LLMOps Curriculum Decomposition for Cognalyze.
 * Covers: Experiment tracking, MLflow model registries, Dockerized FastAPI serving,
 * GPU latency budgets, Continuous Training (CT), data drift detection, and canary rollouts.
 */

import { TaxonomyTopic, TaxonomyModule } from "../master-curriculum-taxonomy";

export const MLOPS_MODULES: TaxonomyModule[] = [
  {
    id: "mod_mlops_lifecycle",
    trackId: "track_mlops",
    title: "Module 1: Experiment Tracking, Model Registries & Reproducibility",
    description: "Version-controlled ML artifacts, parameters, metrics, and production stage gating in MLflow and DVC.",
    order: 1,
    topics: [
      {
        id: "mlops-01-experiment-tracking-registry",
        trackId: "track_mlops",
        moduleId: "mod_mlops_lifecycle",
        title: "Experiment Tracking & Model Registry: Artifacts, Metrics & Lineage",
        order: 1,
        estimatedMinutes: 35,
        difficulty: "intermediate",
        prerequisites: ["ml-01-linear-regression-gradient-descent"],
        roleRelevance: {
          data_analyst: { importance: "SUPPORTING", why: "Auditing model performance metrics against business forecasts." },
          data_scientist: { importance: "CRITICAL", why: "Tracking hyperparameters, feature sets, and loss curves to ensure reproducible models." },
          data_engineer: { importance: "HIGH", why: "Linking training datasets and feature store snapshots to model hashes." },
          ml_engineer: { importance: "CRITICAL", why: "Core foundation of ML lifecycle: artifact provenance, model staging, and lineage." },
          mlops_engineer: { importance: "CRITICAL", why: "Automating model promotion gates from Staging to Production via CI/CD webhooks." },
          ai_engineer: { importance: "HIGH", why: "Tracking prompt templates, model versions, and evaluation scores." },
          genai_llm_engineer: { importance: "HIGH", why: "Versioning fine-tuned LoRA weights and tokenizer configs." },
          applied_ai_engineer: { importance: "CRITICAL", why: "Connecting production inference servers to registered model artifacts." }
        },
        learningObjectives: [
          "Understand the core failure modes of unreproducible ML: code version drift, data drift, and untracked random seeds.",
          "Implement experiment tracking with parameters, metrics per epoch, and serialized model artifacts.",
          "Design Model Registry lifecycle states: Development -> Staging -> Production -> Archived with governance approval gates."
        ],
        conceptsCovered: ["MLflow Tracking", "Model Registry", "Artifact Lineage", "Staging vs Production", "Deterministic Seeds"],
        subtopics: [
          { id: "mlops-01-sub-1", title: "Hyperparameter Logging & Loss Metric Telemetry", order: 1, concepts: ["Run ID", "Metric Step", "Parameter Hashing"] },
          { id: "mlops-01-sub-2", title: "Model Registry Gating & Production Promotion Invariants", order: 2, concepts: ["Model Signature", "Environment Conda Spec", "Approval Webhook"] }
        ],
        practicalOutcome: "Construct an experiment tracker and model registry simulation in Python enforcing governance checks.",
        contextAndIntuition: {
          english: "If a data scientist trains a model on their laptop that reaches 96% accuracy, but forgets which dataset slice, seed, or library version was used, that model cannot be reproduced in production when bugs occur. A model registry creates an immutable audit trail connecting the code commit, data hash, hyperparameters, and serialized weights.",
          hinglish: "Jab koi scientist laptop par model train karta hai jo high accuracy deta hai par version ya seed track nahi karta, toh production mein bug aane par use recreate karna impossible ho jata hai. Model registry code commit, data hash aur serialized weights ko ek saath immutably bind karta hai.",
          whyExists: "Prevents phantom models from reaching production and satisfies regulatory compliance audits.",
          whatWasUsedBefore: "Manual file naming like `model_v2_final_FINAL_really_final.pkl` saved on shared network drives."
        },
        deepExplanation: {
          english: "A registered model artifact consists of: 1) Model weights (ONNX, Safetensors, or Pickle), 2) Schema Signature (expected tensor shapes and types), 3) Runtime Dependencies (conda.yaml or requirements.txt), and 4) Lineage Metadata (Git SHA and Training Data Commit Hash). Promotion to Production requires automated smoke-test verification.",
          hinglish: "Registered model mein weights, input-output schema signature, exact runtime dependencies aur git commit SHA shamil hote hain taaki automated smoke-tests ke bina koi model production mein na ja sake.",
          internalMechanics: "Content-addressed storage (S3/GCS); transactional state machine transitions with cryptographic checksum verification.",
          realWorldUsage: "Netflix recommendation model deployment, Stripe payment risk scoring, and Airbnb search ranking.",
          commonMistakes: [
            "Serializing models with naive Pickle without saving the exact scikit-learn or PyTorch package version, causing unpickling errors.",
            "Promoting models without validating the input schema signature against live production traffic payloads."
          ]
        },
        externalResources: [
          {
            id: "res-mlops-mlflow-01",
            creatorOrOrg: "MLflow Community & Databricks",
            title: "MLflow Model Registry & Tracking: Production Machine Learning Lifecycle",
            topicCovered: "Experiment tracking, model registry, artifact staging, and automated promotion",
            url: "https://mlflow.org/docs/latest/index.html",
            language: "English",
            difficulty: "intermediate",
            whyRecommended: "The open-source industrial standard for model lifecycle management.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `class ModelRegistry:\n    def __init__(self):\n        self.models = {}\n    def register(self, name, version, metrics, weights_hash):\n        # Register and check promotion criteria\n        pass`,
        solutionSnippet: `class ModelRegistry:\n    def __init__(self):\n        self.models = {}\n    def register(self, name, version, metrics, weights_hash):\n        stage = "STAGING" if metrics.get("accuracy", 0) >= 0.85 else "REJECTED"\n        self.models[f"{name}:{version}"] = {"stage": stage, "metrics": metrics, "hash": weights_hash}\n        return stage`
      }
    ]
  },
  {
    id: "mod_mlops_monitoring",
    trackId: "track_mlops",
    title: "Module 2: Continuous Monitoring: Data Drift, Concept Drift & Canary Rollout",
    description: "Statistical drift detection (KS-Test, PSI), performance degradation alarms, canary routing, and automated rollback.",
    order: 2,
    topics: [
      {
        id: "mlops-02-drift-detection-canary",
        trackId: "track_mlops",
        moduleId: "mod_mlops_monitoring",
        title: "Production Monitoring: Data Drift (KS-Test, PSI) & Canary Rollouts",
        order: 1,
        estimatedMinutes: 40,
        difficulty: "advanced",
        prerequisites: ["mlops-01-experiment-tracking-registry"],
        roleRelevance: {
          data_analyst: { importance: "HIGH", why: "Understanding why algorithmic scores shifted during external market shocks." },
          data_scientist: { importance: "CRITICAL", why: "Diagnosing when production distributions diverge from training distributions." },
          data_engineer: { importance: "HIGH", why: "Detecting upstream schema corruption or missing API features before they degrade models." },
          ml_engineer: { importance: "CRITICAL", why: "Implementing statistical alarms and Population Stability Index (PSI) calculations." },
          mlops_engineer: { importance: "CRITICAL", why: "Automating zero-downtime canary traffic shifting and automated rollback triggers." },
          ai_engineer: { importance: "HIGH", why: "Monitoring prompt drift and semantic shift in user queries over time." },
          genai_llm_engineer: { importance: "HIGH", why: "Tracking token length distribution drift and hallucination rate spikes." },
          applied_ai_engineer: { importance: "CRITICAL", why: "Maintaining strict SLAs on production inference latency and error rates." }
        },
        learningObjectives: [
          "Distinguish between Covariate Shift (Data Drift: P(X) changes), Concept Drift (P(Y|X) changes), and Prior Shift (P(Y) changes).",
          "Compute Population Stability Index (PSI) and two-sample Kolmogorov-Smirnov (KS) tests between reference and live windows.",
          "Design a Canary Deployment routing strategy (95% stable / 5% canary) with automated rollback on latency or error spikes."
        ],
        conceptsCovered: ["Covariate Shift", "Concept Drift", "Population Stability Index (PSI)", "Kolmogorov-Smirnov Test", "Canary Deployment"],
        subtopics: [
          { id: "mlops-02-sub-1", title: "Statistical Drift Tests: KS-Test & Population Stability Index", order: 1, concepts: ["PSI Calculation", "Empirical CDF Distance", "Drift Severity Thresholds"] },
          { id: "mlops-02-sub-2", title: "Canary Traffic Routing & Automated Rollback Triggers", order: 2, concepts: ["Weighted Routing", "Latency Budgets", "Circuit Breakers"] }
        ],
        practicalOutcome: "Implement a statistical Data Drift detector in Python that alerts when live feature distributions drift.",
        contextAndIntuition: {
          english: "If an e-commerce model trained before Black Friday suddenly receives traffic during Black Friday, user purchase volumes and cart sizes spike drastically. The model didn't change, but the data distribution drifted. Drift detectors measure this divergence so engineers can retrain models before revenue suffers.",
          hinglish: "Model bilkul theek train hua tha, lekin festival season ya market change ki wajah se incoming user distribution badal gaya. Data drift monitoring training distribution aur production distribution ke beech statistical distance measure karti hai taaki model fail hone se pehle alert bhej sake.",
          whyExists: "Prevents silent model degradation where inaccurate predictions are returned with 200 OK status codes.",
          whatWasUsedBefore: "Waiting for angry customer support tickets or quarterly revenue drops to discover broken models."
        },
        deepExplanation: {
          english: "The Population Stability Index measures divergence: `PSI = sum((Actual% - Expected%) * ln(Actual% / Expected%))`. PSI < 0.1 indicates no drift; PSI 0.1-0.2 indicates moderate change; PSI > 0.2 indicates severe drift requiring retraining. The KS-test computes `D = sup_x |F_1(x) - F_2(x)|` against a significance threshold.",
          hinglish: "PSI formula relative proportions ke ratio aur log difference se compute hota hai. PSI > 0.2 ka matlab severe distribution shift hai jisme model ko fresh data par retrain karna zaroori ho jata hai.",
          internalMechanics: "Quantile binning, two-sample empirical distribution divergence calculations, and Prometheus metric exporters.",
          realWorldUsage: "Credit risk scoring drift monitoring at financial institutions, fraud detection at PayPal, and ad CTR scoring at Google.",
          commonMistakes: [
            "Computing drift on every single individual prediction instead of aggregating statistically significant rolling windows (e.g. 1000 requests).",
            "Rolling out new models to 100% of production traffic instantly without a 5% canary soak period."
          ]
        },
        externalResources: [
          {
            id: "res-mlops-drift-01",
            creatorOrOrg: "Evidently AI & Prometheus Community",
            title: "ML System Monitoring: Detecting Data Drift, Concept Drift, and Performance Degradation",
            topicCovered: "PSI calculation, KS tests, data drift metrics, and automated alerts",
            url: "https://www.evidentlyai.com/blog/data-drift-detection",
            language: "English",
            difficulty: "advanced",
            whyRecommended: "Comprehensive guide to real-time machine learning monitoring standards.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `import math\ndef calculate_psi(expected_counts, actual_counts):\n    # Compute Population Stability Index\n    return 0.0`,
        solutionSnippet: `import math\ndef calculate_psi(expected_counts, actual_counts):\n    total_exp = sum(expected_counts)\n    total_act = sum(actual_counts)\n    psi = 0.0\n    for e, a in zip(expected_counts, actual_counts):\n        p_e = max(e / total_exp, 1e-4)\n        p_a = max(a / total_act, 1e-4)\n        psi += (p_a - p_e) * math.log(p_a / p_e)\n    return psi`
      }
    ]
  }
];

