/**
 * lib/skills/ai-data/curriculum.ts
 * 
 * Master Curriculum Graph for the Cognalyze AI, Data & Intelligence Arena.
 * Contains the 6 connected learning tracks, structured stages, prerequisite graph,
 * and exercise definitions conforming to the Universal Accuracy Rule.
 * 
 * Tracks:
 * 1. AI & Machine Learning (ai_ml)
 * 2. Data Science & Analytics (data_science_analytics)
 * 3. Generative AI & LLM Engineering (genai_llm)
 * 4. Data Engineering (data_eng)
 * 5. MLOps & Production AI (mlops)
 * 6. Applied Projects & AI Labs (applied_projects)
 */

import { AiDataTrack, AiDataTrackSlug, AiDataLesson } from "./types";

export const AI_DATA_TRACKS: Record<AiDataTrackSlug, AiDataTrack> = {
  ai_ml: {
    slug: "ai_ml",
    title: "AI & Machine Learning",
    subtitle: "From Vectorized Computing to Deep Neural Networks",
    badge: "Foundational & Applied",
    icon: "🧠",
    description: "Master Python numerical computation, data preparation, classical supervised/unsupervised algorithms, evaluation calibration, neural network foundations, and production constraints.",
    prerequisites: [],
    targetRoles: ["ml_engineer", "data_scientist", "mlops_engineer"],
    estimatedHours: 45,
    stages: [
      {
        stageNumber: 1,
        title: "Stage 1: Python Data Stack & Linear Algebra",
        objective: "Master vectorized computation with NumPy, tabular transformations with Pandas, and core matrix calculus.",
        lessons: [
          {
            id: "aiml-101",
            slug: "numpy-vectorization-and-broadcasting",
            trackSlug: "ai_ml",
            stageNumber: 1,
            title: "NumPy Vectorization & Broadcasting Mechanics",
            level: "beginner",
            durationMinutes: 20,
            canonicalSkill: "python_data_stack",
            summary: "Learn why loops are 100x slower than vectorized C-loops and how broadcasting aligns asymmetric multidimensional arrays.",
            contentMarkdown: `### 1. Learning Goal
Master NumPy contiguous array memory layouts, vectorized SIMD arithmetic, and dimensional broadcasting rules to write high-performance mathematical code without slow Python \`for\` loops.

### 2. Intuition & Real-World Analogy
Imagine stamping an entire sheet of 100 postage stamps in one single press with an industrial printing press versus licking and pressing each stamp individually by hand 100 times. Vectorization executes array operations in C-level contiguous memory blocks via CPU SIMD (Single Instruction, Multiple Data) registers, bypassing Python's dynamic type-checking overhead on every loop iteration.

### 3. Core Concept & Broadcasting Rules
When operating on two arrays of different shapes, NumPy compares dimensions element-wise from right to left (trailing dimensions):
1. Two dimensions are **compatible** if they are equal, or
2. One of the dimensions is **1** (it gets virtually stretched to match the larger dimension without copying memory).

\`\`\`python
import numpy as np

# Shape (3, 1) + Shape (1, 4) -> Result Shape (3, 4)
a = np.array([[10], [20], [30]])  # 3 rows, 1 col
b = np.array([[1, 2, 3, 4]])      # 1 row, 4 cols
result = a + b
# Result:
# [[11, 12, 13, 14],
#  [21, 22, 23, 24],
#  [31, 32, 33, 34]]
\`\`\`

### 4. Worked Technical Example: Z-Score Feature Standardization
\`\`\`python
import numpy as np

def standardize_features(matrix: np.ndarray) -> np.ndarray:
    """Standardize feature columns using zero mean and unit variance."""
    mean = np.mean(matrix, axis=0)  # Shape (D,)
    std = np.std(matrix, axis=0)    # Shape (D,)
    std = np.where(std == 0, 1.0, std) # Guard against division by zero
    return (matrix - mean) / std     # (N, D) - (D,) broadcasts across rows
\`\`\`

### 5. Check Understanding
- **Question:** If array \`A\` has shape \`(5, 1, 4)\` and array \`B\` has shape \`(3, 4)\`, can they be added via broadcasting? What is the output shape?
- **Answer:** Yes! Aligning from right: 4 == 4, 1 stretches to 3, and 5 remains 5. Output shape is \`(5, 3, 4)\`.`,
            exerciseType: "code_lab",
            provenance: "company_pattern",
            starterCode: `import numpy as np

def normalize_features(matrix: np.ndarray) -> np.ndarray:
    """
    Standardize a 2D matrix (features as columns, samples as rows)
    using zero-mean and unit-variance vectorization.
    Do NOT use for-loops.
    """
    mean = np.mean(matrix, axis=0)
    std = np.std(matrix, axis=0)
    std = np.where(std == 0, 1.0, std)
    return (matrix - mean) / std
`,
            testCases: [
              {
                id: "tc-1",
                description: "Standardizes a 3x2 matrix correctly",
                input: "[[1, 2], [3, 4], [5, 6]]",
                expected: "[[-1.22474487, -1.22474487], [0.0, 0.0], [1.22474487, 1.22474487]]"
              }
            ]
          },
          {
            id: "aiml-102",
            slug: "pandas-groupby-and-aggregations",
            trackSlug: "ai_ml",
            stageNumber: 1,
            title: "Pandas Split-Apply-Combine & GroupBy",
            level: "beginner",
            durationMinutes: 25,
            canonicalSkill: "python_data_stack",
            summary: "Extract aggregate statistical signals across categorical dimensions using optimized Pandas operations.",
            contentMarkdown: `### 1. Learning Goal
Understand the Split-Apply-Combine pattern in Pandas to aggregate, transform, and filter grouped tabular data efficiently.

### 2. Intuition & Real-World Analogy
Think of sorting mail at a post office: first, letters are divided into mailbags by postal district (**Split**); then, letters in each bag are counted and weighed (**Apply**); finally, a one-page summary report with total weight per district is compiled (**Combine**).

### 3. Core Concept: Aggregations vs Transformations
- **Aggregation (\`.agg()\`):** Collapses multiple rows in each group into a single summary scalar per group.
- **Transformation (\`.transform()\`):** Returns a Series with the exact same row count and index as the original DataFrame, enabling row-level normalization against group baselines.

\`\`\`python
import pandas as pd

df = pd.DataFrame({
    'category': ['electronics', 'electronics', 'clothing', 'clothing'],
    'price': [1200, 800, 50, 150]
})

# Row-level relative percentage within category
df['category_mean'] = df.groupby('category')['price'].transform('mean')
df['price_ratio'] = df['price'] / df['category_mean']
\`\`\`

### 4. Check Understanding
- **Question:** When should you use \`.transform()\` instead of \`.agg()\`?
- **Answer:** Use \`.transform()\` when you need to attach group-level statistics back to individual records (e.g. subtracting the group mean from each row) without changing the DataFrame's shape.`,
            exerciseType: "code_lab",
            provenance: "company_pattern"
          },
          {
            id: "aiml-103",
            slug: "matrix-operations-and-linear-algebra",
            trackSlug: "ai_ml",
            stageNumber: 1,
            title: "Vector Spaces, Dot Products & Matrix Decompositions",
            level: "beginner",
            durationMinutes: 30,
            canonicalSkill: "python_data_stack",
            summary: "Understand geometric vector projections, matrix multiplication inner dimensions, and why dot products measure similarity.",
            contentMarkdown: `### 1. Learning Goal
Master dot products, cosine angle projections, and matrix multiplications as geometric transformations fundamental to neural networks and recommendation systems.

### 2. Intuition & Real-World Analogy
A dot product between two vectors measures alignment. If two flashlights point in the exact same direction, their overlap is maximum ($1.0$). If they are perpendicular (orthogonal), their dot product is $0.0$. In machine learning, dot products measure semantic alignment between word embeddings or user/item latent factors.

### 3. Mathematical Formula
For two vectors $\\mathbf{u}, \\mathbf{v} \\in \\mathbb{R}^D$:
$$\\mathbf{u} \\cdot \\mathbf{v} = \\sum_{i=1}^D u_i v_i = \\|\\mathbf{u}\\| \\|\\mathbf{v}\\| \\cos(\\theta)$$

Cosine similarity normalizes for magnitude:
$$\\text{CosineSimilarity}(\\mathbf{u}, \\mathbf{v}) = \\frac{\\mathbf{u} \\cdot \\mathbf{v}}{\\|\\mathbf{u}\\| \\|\\mathbf{v}\\|}$$`,
            exerciseType: "code_lab",
            provenance: "company_pattern"
          }
        ]
      },
      {
        stageNumber: 2,
        title: "Stage 2: Probability, Statistics & Preprocessing",
        objective: "Understand distributions, maximum likelihood estimation, and robust feature engineering.",
        lessons: [
          {
            id: "aiml-201",
            slug: "probability-distributions-and-bayes",
            trackSlug: "ai_ml",
            stageNumber: 2,
            title: "Probability Distributions, Maximum Likelihood & Bayes Theorem",
            level: "intermediate",
            durationMinutes: 30,
            canonicalSkill: "ab_testing_statistics",
            summary: "Formulate machine learning as probabilistic inference: priors, likelihoods, and posterior probability updates.",
            contentMarkdown: `### 1. Learning Goal
Derive Bayes' Theorem and understand how prior domain knowledge is updated with observed evidence to compute posterior class probabilities.

### 2. Formula
$$P(Y|X) = \\frac{P(X|Y) P(Y)}{P(X)}$$
Where $P(Y)$ is the prior, $P(X|Y)$ is the likelihood, and $P(Y|X)$ is the posterior.

### 3. Maximum Likelihood Estimation (MLE)
Parameters $\\theta$ are chosen to maximize the joint probability of observing the training data:
$$\\theta^* = \\arg\\max_\\theta \\sum_{i=1}^N \\log P(x_i | \\theta)$$`,
            exerciseType: "conceptual_challenge",
            provenance: "verified_historical"
          },
          {
            id: "aiml-202",
            slug: "feature-engineering-and-encoding",
            trackSlug: "ai_ml",
            stageNumber: 2,
            title: "Categorical Encodings, Robust Imputation & Scaling",
            level: "intermediate",
            durationMinutes: 30,
            canonicalSkill: "classical_ml_modeling",
            summary: "Prevent target leakage during preprocessing with out-of-fold target encoding and robust median imputation.",
            contentMarkdown: `### 1. Learning Goal
Implement one-hot encoding, target encoding with smoothing, and median imputation strictly on the training partition to avoid train-test leakage.

### 2. The Cardinal Rule of Preprocessing
Never call \`.fit()\` on the full dataset before splitting! Any scaler, imputer, or encoder fitted on test data leaks statistical distributions into training, giving false high validation accuracy that collapses in production.`,
            exerciseType: "code_lab",
            provenance: "company_pattern"
          }
        ]
      },
      {
        stageNumber: 3,
        title: "Stage 3: Supervised & Classical Machine Learning",
        objective: "Implement and optimize Linear/Logistic Regression, Decision Trees, Random Forests, and XGBoost.",
        lessons: [
          {
            id: "aiml-301",
            slug: "linear-and-logistic-regression",
            trackSlug: "ai_ml",
            stageNumber: 3,
            title: "Linear & Logistic Regression with Gradient Descent",
            level: "intermediate",
            durationMinutes: 30,
            canonicalSkill: "classical_ml_modeling",
            summary: "Derive binary cross-entropy loss, compute parameter gradients, and update weights iteratively.",
            contentMarkdown: `### 1. Learning Goal
Derive the Sigmoid activation $\\sigma(z) = \\frac{1}{1 + e^{-z}}$ and binary cross-entropy loss function to build a classifier from scratch.

### 2. Log-Loss Objective
$$J(\\theta) = -\\frac{1}{N} \\sum_{i=1}^N \\left[ y_i \\log(\\hat{y}_i) + (1 - y_i) \\log(1 - \\hat{y}_i) \\right]$$

### 3. Gradient Update Rule
$$\\theta_j := \\theta_j - \\alpha \\frac{1}{N} \\sum_{i=1}^N (\\hat{y}_i - y_i) x_{ij}$$`,
            exerciseType: "experiment_studio",
            provenance: "verified_historical"
          },
          {
            id: "aiml-302",
            slug: "decision-trees-and-impurity-splitting",
            trackSlug: "ai_ml",
            stageNumber: 3,
            title: "Decision Trees & Gini Impurity Optimization",
            level: "intermediate",
            durationMinutes: 30,
            canonicalSkill: "classical_ml_modeling",
            summary: "Understand how decision trees recursively select the feature and threshold that maximizes Information Gain.",
            contentMarkdown: `### 1. Learning Goal
Calculate Gini Impurity and Entropy to determine greedy partition boundaries at every tree decision node.

### 2. Formula
$$Gini = 1 - \\sum_{i=1}^C p_i^2$$
A pure node containing only one class has Gini = 0. A 50/50 binary split has maximum Gini = 0.5.`,
            exerciseType: "experiment_studio",
            provenance: "reported_historical"
          },
          {
            id: "aiml-303",
            slug: "gradient-boosting-vs-random-forests",
            trackSlug: "ai_ml",
            stageNumber: 3,
            title: "Random Forests vs Gradient Boosting (XGBoost)",
            level: "intermediate",
            durationMinutes: 35,
            canonicalSkill: "classical_ml_modeling",
            summary: "Compare Bagging (variance reduction on independent trees) versus Boosting (bias reduction on sequential pseudo-residuals).",
            contentMarkdown: `### 1. Learning Goal
Distinguish Bagging from Boosting: Random Forests parallelize independent deep trees, while Gradient Boosted Trees sequentially fit negative gradients (residuals) of shallow weak learners.

### 2. Architectural Comparison
- **Random Forest:** Reduces Variance. Safe from severe overfitting. Parallelizable.
- **Gradient Boosting (XGBoost/LightGBM):** Reduces Bias. Fits sequential errors. Higher accuracy on tabular benchmarks but sensitive to hyperparameters.`,
            exerciseType: "experiment_studio",
            provenance: "verified_historical"
          }
        ]
      },
      {
        stageNumber: 4,
        title: "Stage 4: Unsupervised Learning & Dimensionality Reduction",
        objective: "Cluster high-dimensional data with K-Means and project variance using Principal Component Analysis.",
        lessons: [
          {
            id: "aiml-401",
            slug: "k-means-and-hierarchical-clustering",
            trackSlug: "ai_ml",
            stageNumber: 4,
            title: "K-Means Clustering, Inertia & Silhouette Analysis",
            level: "intermediate",
            durationMinutes: 30,
            canonicalSkill: "classical_ml_modeling",
            summary: "Partition feature spaces with Lloyd's algorithm, select optimal k via Elbow/Silhouette metrics, and initialize with K-Means++.",
            contentMarkdown: `### 1. Learning Goal
Implement the two-step expectation-maximization cycle of K-Means: assign points to nearest centroid, then recompute centroid as cluster mean.`,
            exerciseType: "experiment_studio",
            provenance: "company_pattern"
          },
          {
            id: "aiml-402",
            slug: "pca-and-dimensionality-reduction",
            trackSlug: "ai_ml",
            stageNumber: 4,
            title: "Principal Component Analysis & Eigenvector Projection",
            level: "intermediate",
            durationMinutes: 30,
            canonicalSkill: "python_data_stack",
            summary: "Compute covariance matrices, decompose eigenvectors, and project data onto orthogonal directions of maximum variance.",
            contentMarkdown: `### 1. Learning Goal
Reduce dimensionality from 100 features to 5 principal components while retaining 95% of total dataset variance using Singular Value Decomposition (SVD).`,
            exerciseType: "experiment_studio",
            provenance: "verified_historical"
          }
        ]
      },
      {
        stageNumber: 5,
        title: "Stage 5: Model Evaluation, Calibration & Target Leakage",
        objective: "Diagnose subtle failure modes, choose appropriate metrics for imbalanced classes, and calibrate probabilities.",
        lessons: [
          {
            id: "aiml-501",
            slug: "roc-auc-vs-precision-recall-curves",
            trackSlug: "ai_ml",
            stageNumber: 5,
            title: "ROC-AUC vs PR-AUC in Imbalanced Classification",
            level: "intermediate",
            durationMinutes: 25,
            canonicalSkill: "ml_model_evaluation",
            summary: "Why 99% accuracy is worthless when predicting 1% fraud, and why PR-AUC is the gold standard for severe imbalance.",
            contentMarkdown: `### 1. Learning Goal
Understand why ROC-AUC yields inflated optimism under severe class imbalance due to massive True Negative counts, and why Precision-Recall AUC is required.`,
            exerciseType: "conceptual_challenge",
            provenance: "verified_historical"
          },
          {
            id: "aiml-502",
            slug: "data-leakage-detection-and-prevention",
            trackSlug: "ai_ml",
            stageNumber: 5,
            title: "Detecting Target Leakage & Train-Test Contamination",
            level: "advanced",
            durationMinutes: 30,
            canonicalSkill: "ml_model_evaluation",
            summary: "Identify features that sneak ground truth into training features, resulting in 99.9% offline validation but catastrophic production failures.",
            contentMarkdown: `### 1. Learning Goal
Detect target leakage: features created using post-decision information or calculating statistics across future timestamps in temporal data.`,
            exerciseType: "code_lab",
            provenance: "company_pattern"
          },
          {
            id: "aiml-503",
            slug: "probability-calibration-platt-scaling",
            trackSlug: "ai_ml",
            stageNumber: 5,
            title: "Probability Calibration & Expected Calibration Error (ECE)",
            level: "advanced",
            durationMinutes: 30,
            canonicalSkill: "ml_model_evaluation",
            summary: "Calibrate raw model score outputs into true real-world event frequencies using Platt Scaling and Isotonic Regression.",
            contentMarkdown: `### 1. Learning Goal
Ensure that when a model outputs a probability score of 0.80, the event truly occurs 80% of the time in the real world.`,
            exerciseType: "experiment_studio",
            provenance: "verified_historical"
          }
        ]
      },
      {
        stageNumber: 6,
        title: "Stage 6: Deep Learning & Neural Architectures",
        objective: "Understand computational graphs, backpropagation in PyTorch, CNNs, and Transformer Self-Attention.",
        lessons: [
          {
            id: "aiml-601",
            slug: "pytorch-tensors-and-autograd",
            trackSlug: "ai_ml",
            stageNumber: 6,
            title: "PyTorch Tensors, Computational Graphs & Autograd",
            level: "intermediate",
            durationMinutes: 30,
            canonicalSkill: "deep_learning_foundations",
            summary: "Trace how dynamic computational graphs calculate partial derivatives automatically via backpropagation.",
            contentMarkdown: `### 1. Learning Goal
Master PyTorch DAG computation graphs, tensor manipulation, and automatic differentiation using \`.backward()\` and \`optimizer.step()\`.`,
            exerciseType: "code_lab",
            provenance: "reported_historical"
          },
          {
            id: "aiml-602",
            slug: "convolutional-neural-networks",
            trackSlug: "ai_ml",
            stageNumber: 6,
            title: "CNNs, Spatial Convolutions & Feature Extraction",
            level: "intermediate",
            durationMinutes: 30,
            canonicalSkill: "deep_learning_foundations",
            summary: "Understand 2D convolution sliding kernels, feature map pooling, and translation invariance in vision models.",
            contentMarkdown: `### 1. Learning Goal
Understand kernel filters, strides, padding, and max-pooling layers in deep convolutional neural networks.`,
            exerciseType: "code_lab",
            provenance: "company_pattern"
          },
          {
            id: "aiml-603",
            slug: "transformers-and-self-attention",
            trackSlug: "ai_ml",
            stageNumber: 6,
            title: "Self-Attention Mechanism, QKV Projections & Multi-Head Attention",
            level: "advanced",
            durationMinutes: 35,
            canonicalSkill: "deep_learning_foundations",
            summary: "Derive Scaled Dot-Product Attention: Softmax(Q K^T / sqrt(d_k)) V and parallel token relationship routing.",
            contentMarkdown: `### 1. Learning Goal
Derive the Transformer self-attention equation step-by-step and understand why Query, Key, and Value matrices route context across sequence tokens.

### 2. Attention Formula
$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}}\\right) V$$`,
            exerciseType: "code_lab",
            provenance: "verified_historical"
          }
        ]
      }
    ]
  },

  data_science_analytics: {
    slug: "data_science_analytics",
    title: "Data Science & Analytics",
    subtitle: "Turning Complex Data into Defensible Strategic Decisions",
    badge: "SQL, Stats & Product Metrics",
    icon: "📊",
    description: "Write production-grade SQL (Window functions, CTEs), perform exploratory data analysis, design robust A/B tests, and construct metric decomposition trees.",
    prerequisites: [],
    targetRoles: ["data_analyst", "data_scientist"],
    estimatedHours: 40,
    stages: [
      {
        stageNumber: 1,
        title: "Stage 1: Production SQL & Window Functions",
        objective: "Master complex analytical queries that FAANG and fintech screeners evaluate.",
        lessons: [
          {
            id: "dsa-101",
            slug: "window-functions-dense-rank-and-lead-lag",
            trackSlug: "data_science_analytics",
            stageNumber: 1,
            title: "Window Functions: ROW_NUMBER, DENSE_RANK & LEAD/LAG",
            level: "beginner",
            durationMinutes: 25,
            canonicalSkill: "advanced_sql_analytics",
            summary: "Compute rolling metrics, cohort rank transitions, and event intervals without collapsing row context.",
            contentMarkdown: `### 1. Learning Goal
Understand the difference between \`ROW_NUMBER()\`, \`RANK()\`, and \`DENSE_RANK()\` over partitioned datasets, and use \`LEAD\`/\`LAG\` to calculate interval deltas.

### 2. Intuition
Unlike \`GROUP BY\`, which collapses multiple rows into a single summary scalar, window functions calculate aggregates across a partitioned subset while preserving every individual record's row identity.

\`\`\`sql
SELECT
  employee_id,
  department_id,
  salary,
  DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as salary_rank,
  LAG(salary, 1) OVER (PARTITION BY department_id ORDER BY salary DESC) as next_higher_salary
FROM employees;
\`\`\``,
            exerciseType: "sql_lab",
            provenance: "verified_historical",
            starterQuery: `-- Find the 2nd highest salary in each department using DENSE_RANK
WITH ranked_salaries AS (
  SELECT
    department_id,
    salary,
    DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rnk
  FROM employees
)
SELECT department_id, salary
FROM ranked_salaries
WHERE rnk = 2;
`
          },
          {
            id: "dsa-102",
            slug: "cohort-retention-and-triangular-grids",
            trackSlug: "data_science_analytics",
            stageNumber: 1,
            title: "Building Cohort Retention Grids in Pure SQL",
            level: "intermediate",
            durationMinutes: 35,
            canonicalSkill: "business_product_analytics",
            summary: "Calculate Month 1, Month 2, and Month 3 user retention curves from raw user login event streams.",
            contentMarkdown: `### 1. Learning Goal
Construct triangular retention matrices in pure SQL by joining initial user acquisition cohorts with subsequent activity event streams.

### 2. Formula
$$\\text{Retention Rate}(M_k) = \\frac{\\text{Active Users in Month } k \\text{ from Cohort } C_0}{\\text{Total Users Acquired in Cohort } C_0} \\times 100$$`,
            exerciseType: "sql_lab",
            provenance: "reported_historical"
          },
          {
            id: "dsa-103",
            slug: "recursive-ctes-and-hierarchies",
            trackSlug: "data_science_analytics",
            stageNumber: 1,
            title: "Recursive CTEs & Organizational Graph Traversal",
            level: "advanced",
            durationMinutes: 30,
            canonicalSkill: "advanced_sql_analytics",
            summary: "Traverse parent-child hierarchies, management trees, and bill-of-materials graphs using recursive common table expressions.",
            contentMarkdown: `### 1. Learning Goal
Write recursive common table expressions (\`WITH RECURSIVE\`) with anchor queries, recursive joins, and cycle termination guards.`,
            exerciseType: "sql_lab",
            provenance: "verified_historical"
          }
        ]
      },
      {
        stageNumber: 2,
        title: "Stage 2: Statistical Inference & A/B Experimentation",
        objective: "Design hypothesis tests, calculate minimum detectable effects, and avoid common experimentation pitfalls.",
        lessons: [
          {
            id: "dsa-201",
            slug: "hypothesis-testing-and-sample-size",
            trackSlug: "data_science_analytics",
            stageNumber: 2,
            title: "Hypothesis Testing, P-Values & Statistical Power",
            level: "intermediate",
            durationMinutes: 30,
            canonicalSkill: "ab_testing_statistics",
            summary: "Calculate required sample sizes before launching an experiment and learn why peeking at p-values ruins test integrity.",
            contentMarkdown: `### 1. Learning Goal
Calculate required sample size $N$ given significance level $\\alpha = 0.05$, statistical power $1 - \\beta = 0.80$, and Minimum Detectable Effect (MDE).

### 2. Sample Size Formula
$$N \\approx \\frac{2 (Z_{\\alpha/2} + Z_\\beta)^2 \\cdot p (1 - p)}{\\Delta^2}$$`,
            exerciseType: "code_lab",
            provenance: "verified_historical"
          },
          {
            id: "dsa-202",
            slug: "sample-ratio-mismatch-and-network-effects",
            trackSlug: "data_science_analytics",
            stageNumber: 2,
            title: "Sample Ratio Mismatch (SRM) & Network Interference",
            level: "advanced",
            durationMinutes: 30,
            canonicalSkill: "ab_testing_statistics",
            summary: "Detect when randomization fails (Chi-Square test on traffic allocation) and handle marketplace spillover in two-sided platforms.",
            contentMarkdown: `### 1. Learning Goal
Run a Chi-Square Goodness-of-Fit test to verify whether actual user traffic allocations deviate from the planned experimental design.`,
            exerciseType: "conceptual_challenge",
            provenance: "company_pattern"
          },
          {
            id: "dsa-203",
            slug: "multi-armed-bandits-vs-ab-testing",
            trackSlug: "data_science_analytics",
            stageNumber: 2,
            title: "Multi-Armed Bandits (Thompson Sampling) vs Fixed A/B Testing",
            level: "advanced",
            durationMinutes: 30,
            canonicalSkill: "ab_testing_statistics",
            summary: "Balance exploration vs exploitation using Bayesian Thompson Sampling to minimize user regret during live experiments.",
            contentMarkdown: `### 1. Learning Goal
Compare fixed-horizon classical hypothesis testing with dynamic Bayesian Multi-Armed Bandits for rapid conversion optimization.`,
            exerciseType: "code_lab",
            provenance: "verified_historical"
          }
        ]
      },
      {
        stageNumber: 3,
        title: "Stage 3: Product Analytics & Metric Decompositions",
        objective: "Build metric trees, analyze conversion funnels, and quantify user lifetime value.",
        lessons: [
          {
            id: "dsa-301",
            slug: "metric-trees-and-funnel-conversion",
            trackSlug: "data_science_analytics",
            stageNumber: 3,
            title: "Metric Decomposition Trees & Drop-Off Diagnosis",
            level: "intermediate",
            durationMinutes: 30,
            canonicalSkill: "business_product_analytics",
            summary: "Deconstruct top-level North Star metrics (Revenue) into primary levers (Traffic x Conversion Rate x AOV) to diagnose root causes.",
            contentMarkdown: `### 1. Learning Goal
Decompose top-line business metrics into mathematical driver equations to identify which sub-funnel step caused an unexpected revenue drop.`,
            exerciseType: "conceptual_challenge",
            provenance: "company_pattern"
          },
          {
            id: "dsa-302",
            slug: "customer-lifetime-value-and-churn",
            trackSlug: "data_science_analytics",
            stageNumber: 3,
            title: "LTV Estimation & Churn Survival Curves",
            level: "advanced",
            durationMinutes: 30,
            canonicalSkill: "business_product_analytics",
            summary: "Model customer lifetime value and retention hazard rates using Kaplan-Meier survival curves.",
            contentMarkdown: `### 1. Learning Goal
Estimate Customer Lifetime Value: $LTV = \\frac{ARPU \\times \\text{Gross Margin}}{\\text{Churn Rate}}$ and analyze right-censored tenure data.`,
            exerciseType: "code_lab",
            provenance: "verified_historical"
          }
        ]
      }
    ]
  },

  genai_llm: {
    slug: "genai_llm",
    title: "Generative AI & LLM Engineering",
    subtitle: "Architecting Production RAG Pipelines, Multi-Step Agents & Evals",
    badge: "Agents, RAG & Safety",
    icon: "⚡",
    description: "Build robust LLM systems: JSON Schema enforcement, vector search, hybrid retrieval, cross-encoder rerankers, tool-calling agents, and RAG Triad evaluations.",
    prerequisites: ["ai_ml"],
    targetRoles: ["ai_engineer", "genai_llm_engineer", "applied_ai_engineer"],
    estimatedHours: 50,
    stages: [
      {
        stageNumber: 1,
        title: "Stage 1: Prompt Engineering & Structured Outputs",
        objective: "Enforce deterministic schema validation and prevent hallucinated JSON structures.",
        lessons: [
          {
            id: "genai-101",
            slug: "structured-outputs-and-pydantic-validation",
            trackSlug: "genai_llm",
            stageNumber: 1,
            title: "Structured Outputs & JSON Schema Enforcement",
            level: "beginner",
            durationMinutes: 25,
            canonicalSkill: "prompt_engineering_structured_outputs",
            summary: "Eliminate string parsing regex hacks by constraining LLM generation directly to strict JSON Schemas.",
            contentMarkdown: `### 1. Learning Goal
Constrain LLM generation directly to strict JSON Schemas and validate payloads with Pydantic to ensure 100% deterministic backend consumption.

### 2. Intuition
In production APIs, models cannot output freeform prose. Providing an explicit schema enforces grammar-based decoding at the tokenizer level, making syntax errors impossible.`,
            exerciseType: "code_lab",
            provenance: "verified_historical"
          },
          {
            id: "genai-102",
            slug: "few-shot-prompting-and-cot",
            trackSlug: "genai_llm",
            stageNumber: 1,
            title: "Chain-of-Thought (CoT) Prompting & In-Context Learning",
            level: "beginner",
            durationMinutes: 25,
            canonicalSkill: "prompt_engineering_structured_outputs",
            summary: "Elicit multi-step reasoning from large models by decomposing complex instructions into structured scratchpad thinking steps.",
            contentMarkdown: `### 1. Learning Goal
Use Chain-of-Thought prompting to guide models through intermediate reasoning steps before generating the final answer.`,
            exerciseType: "code_lab",
            provenance: "company_pattern"
          }
        ]
      },
      {
        stageNumber: 2,
        title: "Stage 2: Embeddings, RAG & Hybrid Retrieval",
        objective: "Build hybrid search pipelines with vector embeddings, BM25, and cross-encoder reranking.",
        lessons: [
          {
            id: "genai-201",
            slug: "embeddings-vector-indexes-and-ann",
            trackSlug: "genai_llm",
            stageNumber: 2,
            title: "Dense Vector Embeddings & Approximate Nearest Neighbors (HNSW)",
            level: "intermediate",
            durationMinutes: 30,
            canonicalSkill: "rag_architecture_and_retrieval",
            summary: "Index high-dimensional vector embeddings using Hierarchical Navigable Small World (HNSW) graphs for sub-millisecond retrieval.",
            contentMarkdown: `### 1. Learning Goal
Understand vector indexing with HNSW and trade-offs between exact brute-force search and approximate nearest neighbors under production latency budgets.`,
            exerciseType: "code_lab",
            provenance: "verified_historical"
          },
          {
            id: "genai-202",
            slug: "chunking-strategies-and-hybrid-search",
            trackSlug: "genai_llm",
            stageNumber: 2,
            title: "Advanced Chunking & Hybrid Search (Dense + BM25)",
            level: "intermediate",
            durationMinutes: 35,
            canonicalSkill: "rag_architecture_and_retrieval",
            summary: "Combine dense semantic embeddings with sparse keyword search (BM25) to prevent blind spots in exact term lookups.",
            contentMarkdown: `### 1. Learning Goal
Implement Reciprocal Rank Fusion (RRF) to merge dense cosine rankings with sparse BM25 keyword rankings:
$$RRF\\_Score(d) = \\sum_{m \\in M} \\frac{1}{k + r_m(d)}$$
Where $k=60$ balances rank variance.`,
            exerciseType: "code_lab",
            provenance: "verified_historical"
          },
          {
            id: "genai-203",
            slug: "reranking-with-cross-encoders",
            trackSlug: "genai_llm",
            stageNumber: 2,
            title: "Cross-Encoder Reranking & Context Compression",
            level: "advanced",
            durationMinutes: 30,
            canonicalSkill: "rag_architecture_and_retrieval",
            summary: "Refine candidate chunks using cross-encoders that evaluate full bidirectional query-document attention.",
            contentMarkdown: `### 1. Learning Goal
Use a two-stage retrieval architecture: bi-encoder for high-recall top-50 candidate retrieval, followed by a cross-encoder to rerank top-5 high-precision chunks.`,
            exerciseType: "code_lab",
            provenance: "company_pattern"
          }
        ]
      },
      {
        stageNumber: 3,
        title: "Stage 3: Evaluation, Grounding & Safety",
        objective: "Measure hallucination rates scientifically and protect systems against prompt injection.",
        lessons: [
          {
            id: "genai-301",
            slug: "the-rag-triad-evaluations",
            trackSlug: "genai_llm",
            stageNumber: 3,
            title: "The RAG Triad: Context, Groundedness & Relevance",
            level: "advanced",
            durationMinutes: 30,
            canonicalSkill: "llm_evaluations_and_safety",
            summary: "Measure hallucination rates scientifically using the Ragas Triad: Context Relevance, Groundedness, and Answer Relevance.",
            contentMarkdown: `### 1. Learning Goal
Benchmark RAG systems against the 3 cardinal dimensions:
1. **Context Relevance:** Fraction of retrieved chunk relevant to query.
2. **Groundedness / Faithfulness:** Fraction of answer claims provable from context.
3. **Answer Relevance:** Degree to which answer addresses original intent.`,
            exerciseType: "conceptual_challenge",
            provenance: "company_pattern"
          },
          {
            id: "genai-302",
            slug: "prompt-injection-defense-and-guardrails",
            trackSlug: "genai_llm",
            stageNumber: 3,
            title: "Prompt Injection Mitigation & Guardrail Verification",
            level: "advanced",
            durationMinutes: 30,
            canonicalSkill: "llm_evaluations_and_safety",
            summary: "Harden agent workflows against indirect prompt injection, data exfiltration, and jailbreak attacks.",
            contentMarkdown: `### 1. Learning Goal
Isolate untrusted user and document content from system prompts using XML boundary delimiters, dual-LLM verifiers, and strict schema output filters.`,
            exerciseType: "code_lab",
            provenance: "verified_historical"
          }
        ]
      },
      {
        stageNumber: 4,
        title: "Stage 4: Autonomous AI Agents & Tool Calling",
        objective: "Construct autonomous agents with tool schemas, loop guards, and human-in-the-loop approvals.",
        lessons: [
          {
            id: "genai-401",
            slug: "tool-calling-schemas-and-execution-loops",
            trackSlug: "genai_llm",
            stageNumber: 4,
            title: "Building Tool-Calling Agents with Execution Guards",
            level: "intermediate",
            durationMinutes: 40,
            canonicalSkill: "ai_agents_and_tool_calling",
            summary: "Construct an agent that decides when to query a database, validates parameters, and terminates gracefully.",
            contentMarkdown: `### 1. Learning Goal
Implement ReAct (Reasoning + Acting) execution loops: prompt -> model generates tool call -> execution sandbox runs tool -> response returned -> final synthesis.`,
            exerciseType: "agent_builder",
            provenance: "verified_historical"
          },
          {
            id: "genai-402",
            slug: "agent-memory-and-state-management",
            trackSlug: "genai_llm",
            stageNumber: 4,
            title: "Agent Memory: Short-Term State, Vector Memory & Human Approval",
            level: "advanced",
            durationMinutes: 35,
            canonicalSkill: "ai_agents_and_tool_calling",
            summary: "Manage conversation state across multi-turn sessions, store episodic memory in vector indices, and enforce human approval on destructive tool actions.",
            contentMarkdown: `### 1. Learning Goal
Architect agent state machines that persist conversational memory, limit context window usage via rolling summarization, and halt for human confirmation before running mutations.`,
            exerciseType: "agent_builder",
            provenance: "company_pattern"
          }
        ]
      }
    ]
  },

  data_eng: {
    slug: "data_eng",
    title: "Data Engineering",
    subtitle: "Building Robust, Scalable Data Pipelines & Warehouses",
    badge: "Pipelines & Storage",
    icon: "🛢️",
    description: "Design dimensional data models (Star/Snowflake, SCD Type 1 & 2), implement idempotent ETL pipelines, and master distributed processing with PySpark & Kafka.",
    prerequisites: ["data_science_analytics"],
    targetRoles: ["data_engineer"],
    estimatedHours: 40,
    stages: [
      {
        stageNumber: 1,
        title: "Stage 1: Dimensional Data Modeling & Warehousing",
        objective: "Design Star and Snowflake schemas with Fact and Dimension tables.",
        lessons: [
          {
            id: "de-101",
            slug: "star-schema-and-slowly-changing-dimensions",
            trackSlug: "data_eng",
            stageNumber: 1,
            title: "Star Schema Design & Slowly Changing Dimensions (SCD 2)",
            level: "beginner",
            durationMinutes: 30,
            canonicalSkill: "data_engineering_pipelines",
            summary: "Preserve historical state across changing user attributes using valid_from, valid_to, and is_current flags.",
            contentMarkdown: `### 1. Learning Goal
Architect Star Schemas with central Fact tables and surrounding Dimension tables, using SCD Type 2 to preserve historical audit trails when customer attributes change over time.

### 2. Intuition
When a user moves from New York to California, an SCD Type 1 update overwrites the record, breaking historical tax reports. SCD Type 2 marks the old row expired (\`valid_to = now()\`, \`is_current = false\`) and inserts a new active row.`,
            exerciseType: "sql_lab",
            provenance: "verified_historical"
          },
          {
            id: "de-102",
            slug: "partitioning-and-clustering-strategies",
            trackSlug: "data_eng",
            stageNumber: 1,
            title: "Partitioning & Clustering Strategies in Modern Warehouses",
            level: "intermediate",
            durationMinutes: 30,
            canonicalSkill: "data_engineering_pipelines",
            summary: "Optimize query scan costs and latency in Snowflake/BigQuery using date-based partitioning and cardinality clustering.",
            contentMarkdown: `### 1. Learning Goal
Minimize bytes scanned by aligning table storage with common query predicate filters (e.g. partition by \`event_date\`, cluster by \`customer_id\`).`,
            exerciseType: "sql_lab",
            provenance: "company_pattern"
          }
        ]
      },
      {
        stageNumber: 2,
        title: "Stage 2: Idempotent Pipelines & Data Quality",
        objective: "Build pipelines that can be safely re-run without duplicating records or corrupting state.",
        lessons: [
          {
            id: "de-201",
            slug: "idempotency-and-watermarking",
            trackSlug: "data_eng",
            stageNumber: 2,
            title: "Idempotent Data Ingestion & Watermarking",
            level: "intermediate",
            durationMinutes: 35,
            canonicalSkill: "data_engineering_pipelines",
            summary: "Architect pipelines that handle late-arriving events and backfills without duplicate records.",
            contentMarkdown: `### 1. Learning Goal
Implement idempotent ingestion: operations that can be re-run 10 times with the exact same final state as running once (e.g. partition overwrite, atomic MERGE/UPSERT).`,
            exerciseType: "code_lab",
            provenance: "company_pattern"
          },
          {
            id: "de-202",
            slug: "write-audit-publish-pattern",
            trackSlug: "data_eng",
            stageNumber: 2,
            title: "Write-Audit-Publish (WAP) Pattern on Data Lakes",
            level: "advanced",
            durationMinutes: 30,
            canonicalSkill: "data_engineering_pipelines",
            summary: "Prevent corrupted data from polluting production tables by writing to staging branches, auditing assertions, and publishing atomically.",
            contentMarkdown: `### 1. Learning Goal
Implement the Write-Audit-Publish pattern on Iceberg / Delta Lake tables to enforce data contract invariants before staging data goes live to business consumers.`,
            exerciseType: "code_lab",
            provenance: "verified_historical"
          }
        ]
      },
      {
        stageNumber: 3,
        title: "Stage 3: Distributed Processing & Streaming",
        objective: "Scale processing across worker nodes with PySpark and handle streaming events with Kafka.",
        lessons: [
          {
            id: "de-301",
            slug: "pyspark-shuffle-and-skew-optimization",
            trackSlug: "data_eng",
            stageNumber: 3,
            title: "PySpark Shuffle Operations & Data Skew Remediation",
            level: "advanced",
            durationMinutes: 35,
            canonicalSkill: "data_engineering_pipelines",
            summary: "Diagnose straggler tasks in Spark cluster jobs caused by uneven join key distributions and resolve using salting techniques.",
            contentMarkdown: `### 1. Learning Goal
Eliminate Apache Spark skew bottlenecks where 99% of executors finish in seconds but 1 executor hangs for hours on a hot join key. Solve using join salting.`,
            exerciseType: "code_lab",
            provenance: "verified_historical"
          },
          {
            id: "de-302",
            slug: "kafka-event-streams-and-consumer-groups",
            trackSlug: "data_eng",
            stageNumber: 3,
            title: "Apache Kafka Partitioning, Offsets & Exactly-Once Ingestion",
            level: "advanced",
            durationMinutes: 35,
            canonicalSkill: "data_engineering_pipelines",
            summary: "Manage consumer group rebalances, partition lag, and transactional producers to guarantee exactly-once message semantics.",
            contentMarkdown: `### 1. Learning Goal
Understand Kafka topic partitioning, consumer group offset commits, and deduplication patterns for real-time stream ingestion.`,
            exerciseType: "code_lab",
            provenance: "verified_historical"
          }
        ]
      }
    ]
  },

  mlops: {
    slug: "mlops",
    title: "MLOps & Production AI",
    subtitle: "Operationalizing Models with Serving, Monitoring & Rollbacks",
    badge: "Serving & Reliability",
    icon: "🚀",
    description: "Serve models with low-latency APIs (FastAPI), track experiments with registries, detect data/concept drift, and coordinate automated rollbacks.",
    prerequisites: ["ai_ml"],
    targetRoles: ["mlops_engineer", "ml_engineer"],
    estimatedHours: 35,
    stages: [
      {
        stageNumber: 1,
        title: "Stage 1: Model Serving & Low-Latency APIs",
        objective: "Package trained model artifacts into production microservices.",
        lessons: [
          {
            id: "mlops-101",
            slug: "serving-models-with-fastapi",
            trackSlug: "mlops",
            stageNumber: 1,
            title: "FastAPI Model Inference Microservice",
            level: "intermediate",
            durationMinutes: 30,
            canonicalSkill: "mlops_serving_and_monitoring",
            summary: "Build an asynchronous inference endpoint with Pydantic payload validation and latency profiling.",
            contentMarkdown: `### 1. Learning Goal
Package a trained machine learning model into a high-throughput, asynchronous FastAPI microservice with warm startup loading and schema validation.`,
            exerciseType: "code_lab",
            provenance: "verified_historical"
          },
          {
            id: "mlops-102",
            slug: "model-quantization-and-onnx-runtime",
            trackSlug: "mlops",
            stageNumber: 1,
            title: "Model Quantization (INT8) & ONNX Runtime Acceleration",
            level: "advanced",
            durationMinutes: 35,
            canonicalSkill: "mlops_serving_and_monitoring",
            summary: "Convert PyTorch weights to optimized ONNX computational graphs and quantize float32 parameters to int8 for 3x latency reduction.",
            contentMarkdown: `### 1. Learning Goal
Export models to ONNX and apply post-training INT8 quantization to cut inference memory footprints by 75% with negligible accuracy drop.`,
            exerciseType: "code_lab",
            provenance: "company_pattern"
          }
        ]
      },
      {
        stageNumber: 2,
        title: "Stage 2: Experiment Tracking & Feature Stores",
        objective: "Track experiment lineage with MLflow and serve point-in-time features with Feast.",
        lessons: [
          {
            id: "mlops-201",
            slug: "mlflow-tracking-and-model-versioning",
            trackSlug: "mlops",
            stageNumber: 2,
            title: "Experiment Lineage, MLflow Tracking & Model Registries",
            level: "intermediate",
            durationMinutes: 30,
            canonicalSkill: "mlops_serving_and_monitoring",
            summary: "Log hyperparameters, dataset hashes, and metric curves to establish immutable audit trails for every trained model artifact.",
            contentMarkdown: `### 1. Learning Goal
Track experiment runs with MLflow: log git commits, hyperparameters, training loss curves, and register versioned models ready for staging validation.`,
            exerciseType: "code_lab",
            provenance: "verified_historical"
          },
          {
            id: "mlops-202",
            slug: "feature-stores-feast-architecture",
            trackSlug: "mlops",
            stageNumber: 2,
            title: "Feature Stores: Feast Online vs Offline Feature Synchronization",
            level: "advanced",
            durationMinutes: 35,
            canonicalSkill: "mlops_serving_and_monitoring",
            summary: "Prevent training-serving skew by serving low-latency features from Redis online while backfilling training sets from Parquet offline.",
            contentMarkdown: `### 1. Learning Goal
Architect a Feature Store with dual storage: Redis for sub-10ms online inference lookup, and Parquet/Snowflake for point-in-time consistent historical training data.`,
            exerciseType: "code_lab",
            provenance: "company_pattern"
          }
        ]
      },
      {
        stageNumber: 3,
        title: "Stage 3: Monitoring, Drift & Automated Rollbacks",
        objective: "Monitor production performance and detect when real-world distributions shift.",
        lessons: [
          {
            id: "mlops-301",
            slug: "data-drift-and-population-stability-index",
            trackSlug: "mlops",
            stageNumber: 3,
            title: "Data Drift Detection & Population Stability Index (PSI)",
            level: "advanced",
            durationMinutes: 35,
            canonicalSkill: "mlops_serving_and_monitoring",
            summary: "Quantify how much an incoming feature distribution has shifted from baseline training distributions.",
            contentMarkdown: `### 1. Learning Goal
Calculate Population Stability Index (PSI) to detect covariate shift before model predictions cause silent business revenue degradation:
$$PSI = \\sum \\Big( (Actual\\% - Expected\\%) \\times \\ln\\frac{Actual\\%}{Expected\\%} \\Big)$$`,
            exerciseType: "code_lab",
            provenance: "verified_historical"
          },
          {
            id: "mlops-302",
            slug: "canary-deployments-and-automated-rollbacks",
            trackSlug: "mlops",
            stageNumber: 3,
            title: "Canary Deployments, Shadow Traffic & Automated Rollbacks",
            level: "advanced",
            durationMinutes: 35,
            canonicalSkill: "mlops_serving_and_monitoring",
            summary: "Safely deploy new model versions by routing 5% of traffic to a canary worker, monitoring latency and error spikes, and rolling back automatically.",
            contentMarkdown: `### 1. Learning Goal
Design zero-downtime deployment pipelines using Kubernetes / Envoy traffic splitting and Prometheus error threshold triggers.`,
            exerciseType: "code_lab",
            provenance: "company_pattern"
          }
        ]
      }
    ]
  },

  applied_projects: {
    slug: "applied_projects",
    title: "Applied Projects & AI Labs",
    subtitle: "Hands-on Capstones & Verbal Technical Defense",
    badge: "Portfolio & Defense",
    icon: "🌟",
    description: "Build portfolio-ready projects spanning RAG, Agents, Predictive ML, and Data Pipelines, culminating in verbal technical defense with the AI Mentor.",
    prerequisites: ["ai_ml", "genai_llm"],
    targetRoles: ["applied_ai_engineer", "ai_engineer", "ml_engineer", "data_scientist"],
    estimatedHours: 55,
    stages: [
      {
        stageNumber: 1,
        title: "Stage 1: Production Capstones",
        objective: "Execute comprehensive multi-stage projects with verifiable evidence artifacts.",
        lessons: [
          {
            id: "proj-101",
            slug: "production-financial-rag-analyst",
            trackSlug: "applied_projects",
            stageNumber: 1,
            title: "Production Financial RAG Analyst with Citation Grounding",
            level: "advanced",
            durationMinutes: 60,
            canonicalSkill: "rag_architecture_and_retrieval",
            summary: "Build an SEC filing analyst that answers financial queries, quotes exact text spans, and passes automated faithfulness tests.",
            contentMarkdown: `### 1. Learning Goal
Build an end-to-end RAG system over corporate 10-K filings that achieves > 90% groundedness score and provides exact paragraph-level source citations.`,
            exerciseType: "project_milestone",
            provenance: "cognalyze_simulation"
          },
          {
            id: "proj-102",
            slug: "autonomous-customer-support-agent",
            trackSlug: "applied_projects",
            stageNumber: 1,
            title: "Autonomous E-Commerce Support Agent with Tool Calling",
            level: "advanced",
            durationMinutes: 60,
            canonicalSkill: "ai_agents_and_tool_calling",
            summary: "Construct a multi-step agent that inspects order status, processes refunds under policy thresholds, and escalates edge cases.",
            contentMarkdown: `### 1. Learning Goal
Implement a customer support agent with access to order lookup and refund tools, enforcing strict policy constraints ($50 threshold) and loop guards.`,
            exerciseType: "agent_builder",
            provenance: "cognalyze_simulation"
          },
          {
            id: "proj-103",
            slug: "real-time-fraud-detection-stream",
            trackSlug: "applied_projects",
            stageNumber: 1,
            title: "Real-Time Streaming Fraud Detection with ML Scoring",
            level: "advanced",
            durationMinutes: 60,
            canonicalSkill: "classical_ml_modeling",
            summary: "Build a real-time event pipeline that scores incoming credit card transactions against an anomaly detection model under 10ms latency SLAs.",
            contentMarkdown: `### 1. Learning Goal
Connect a streaming event queue with an in-memory XGBoost model and rule engine to flag suspicious high-velocity transactions in real time.`,
            exerciseType: "project_milestone",
            provenance: "cognalyze_simulation"
          },
          {
            id: "proj-104",
            slug: "end-to-end-ab-testing-decision-engine",
            trackSlug: "applied_projects",
            stageNumber: 1,
            title: "Executive A/B Experimentation & Statistical Rollout Engine",
            level: "advanced",
            durationMinutes: 60,
            canonicalSkill: "ab_testing_statistics",
            summary: "Analyze checkout redesign experiment data, verify SRM, compute two-sample Z-tests, and produce an executive rollout decision report.",
            contentMarkdown: `### 1. Learning Goal
Conduct a rigorous experimentation audit on a live dataset, verifying sample ratios, hypothesis significance, and practical business impact before rollout.`,
            exerciseType: "project_milestone",
            provenance: "cognalyze_simulation"
          }
        ]
      },
      {
        stageNumber: 2,
        title: "Stage 2: Technical Defense & Operational Readiness",
        objective: "Defend end-to-end architectural trade-offs, handle production incidents, and prepare deployable capstones.",
        lessons: [
          {
            id: "proj-201",
            slug: "capstone-technical-architecture-defense",
            trackSlug: "applied_projects",
            stageNumber: 2,
            title: "Multi-Agent & RAG Architecture Technical Defense",
            level: "advanced",
            durationMinutes: 60,
            canonicalSkill: "ai_agents_and_tool_calling",
            summary: "Defend end-to-end architectural decisions, trade-offs, latency budgets, and security guardrails in front of the AI Technical Reviewer.",
            contentMarkdown: `### 1. Learning Goal
Conduct an architectural defense of a multi-tier AI agent system, justifying vector indexing trade-offs, concurrency models, and evaluation guardrails under technical scrutiny.`,
            exerciseType: "project_milestone",
            provenance: "cognalyze_simulation"
          },
          {
            id: "proj-202",
            slug: "production-mlops-drift-incident-postmortem",
            trackSlug: "applied_projects",
            stageNumber: 2,
            title: "Production ML Incident Post-Mortem & Remediation",
            level: "advanced",
            durationMinutes: 60,
            canonicalSkill: "mlops_serving_and_monitoring",
            summary: "Investigate a production model degradation incident, trace data drift to upstream schema shifts, and formulate an RCA and mitigation runbook.",
            contentMarkdown: `### 1. Learning Goal
Diagnose a live production ML failure caused by covariate shift, perform statistical drift detection, and author a blameless post-mortem with automated canary rollback triggers.`,
            exerciseType: "project_milestone",
            provenance: "company_pattern"
          }
        ]
      }
    ]
  }
};

export function getAllTracks(): AiDataTrack[] {
  return Object.values(AI_DATA_TRACKS);
}

export function getTrackBySlug(slug: AiDataTrackSlug): AiDataTrack {
  return AI_DATA_TRACKS[slug] || AI_DATA_TRACKS.ai_ml;
}

export function getAllLessons(): AiDataLesson[] {
  const all: AiDataLesson[] = [];
  for (const track of Object.values(AI_DATA_TRACKS)) {
    for (const stage of track.stages) {
      all.push(...stage.lessons);
    }
  }
  return all;
}

export function getLessonBySlug(slug: string): AiDataLesson | undefined {
  return getAllLessons().find(l => l.slug === slug);
}
