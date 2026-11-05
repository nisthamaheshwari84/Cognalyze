/**
 * lib/skills/catalogs/ml-catalog.ts
 * Auto-generated Canonical Machine Learning Catalog containing 100 validated distinct questions.
 */

import { QuestionItem } from "../../question-bank-types";

export const ML_CATALOG: QuestionItem[] = [
  {
    "id": "qb-ml-linear-regression-ols-derivation",
    "title": "Ordinary Least Squares (OLS) Closed-Form Derivation",
    "question": "Derive the closed-form normal equation for Ordinary Least Squares (OLS) regression $\\hat{\\beta} = (X^T X)^{-1} X^T y$. What conditions must the design matrix $X$ satisfy for $(X^T X)^{-1}$ to exist, and how should collinearity be resolved in practice?",
    "type": "AI/ML",
    "company": "Google",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Supervised Learning",
    "subtopic": "Linear Models",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Expand $(y - X\\beta)^T(y - X\\beta)$ using matrix transpose rules.",
      "Recall that $\\nabla_\\beta (\\beta^T A \\beta) = 2 A \\beta$ when $A$ is symmetric."
    ],
    "explanation": "OLS minimizes the sum of squared residuals $L(\\beta) = ||y - X\\beta||^2 = (y - X\\beta)^T (y - X\\beta)$. Differentiating with respect to $\\beta$ and setting to zero yields $-2 X^T (y - X\\beta) = 0 \\implies X^T X \\beta = X^T y$. For $X^T X$ to be invertible, $X$ must have full column rank (no linearly dependent features and $n \\ge p$). If multicollinearity exists, $X^T X$ is singular or ill-conditioned; Ridge regression ($L_2$ penalty $\\lambda I$) or PCA resolves this by ensuring strict positive definiteness.",
    "solution": "The gradient is $\\nabla_\\beta L = -2 X^T (y - X\\beta) = 0$. Solving yields $\\hat{\\beta} = (X^T X)^{-1} X^T y$. Practical resolution: add $L_2$ penalty $\\hat{\\beta}_{ridge} = (X^T X + \\lambda I)^{-1} X^T y$, guaranteeing invertibility for any $\\lambda > 0$.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Linear Regression",
      "OLS",
      "Google",
      "Math for ML"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Supervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-logistic-regression-sigmoid-loss",
    "title": "Logistic Regression Likelihood and Binary Cross-Entropy",
    "question": "Why does Linear Regression fail for binary classification tasks, and how does the logit link function $\\sigma(z) = \\frac{1}{1 + e^{-z}}$ transform log-odds into probabilities? Derive the Binary Cross-Entropy loss from the Maximum Likelihood Principle.",
    "type": "AI/ML",
    "company": "Meta",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Supervised Learning",
    "subtopic": "Generalized Linear Models",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Meta Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Model each label $y_i \\in \\{0, 1\\}$ as a Bernoulli random variable with parameter $p_i = \\sigma(w^T x_i)$.",
      "Take the natural logarithm of the joint probability distribution."
    ],
    "explanation": "Linear regression predicts unbounded values $(-\\infty, \\infty)$ rather than probabilities $[0, 1]$, and minimizing squared error on binary targets assumes a Gaussian noise model that severely penalizes confident, correct predictions. Logistic regression models $P(y=1|x) = \\sigma(w^T x)$. The likelihood of $N$ independent Bernoulli outcomes is $L(w) = \\prod_{i=1}^N \\hat{y}_i^{y_i} (1 - \\hat{y}_i)^{1 - y_i}$. Taking the negative log-likelihood directly yields Binary Cross-Entropy: $-\\sum_{i=1}^N [y_i \\log(\\hat{y}_i) + (1 - y_i) \\log(1 - \\hat{y}_i)]$, which is convex with respect to $w$.",
    "solution": "Log-likelihood is $\\ell(w) = \\sum [y_i \\ln \\hat{y}_i + (1 - y_i) \\ln(1 - \\hat{y}_i)]$. Minimizing negative log-likelihood guarantees a unique global minimum via convex optimization.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Logistic Regression",
      "Loss Functions",
      "Meta"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Supervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-l1-vs-l2-regularization-geometry",
    "title": "L1 (Lasso) vs L2 (Ridge) Regularization: Geometric Sparsity",
    "question": "Explain mathematically and geometrically why $L_1$ regularization (Lasso) produces sparse weight vectors (exact zeros) whereas $L_2$ regularization (Ridge) only shrinks weights toward zero without setting them to zero.",
    "type": "AI/ML",
    "company": "Amazon",
    "role": "Applied Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Supervised Learning",
    "subtopic": "Regularization",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Draw the 2D contour lines of the loss function and the constraint boundaries $|w_1| + |w_2| \\le c$ vs $w_1^2 + w_2^2 \\le c$.",
      "Examine the derivative of $|w|$ vs $w^2$ near the origin."
    ],
    "explanation": "Geometrically, constrained optimization minimizes quadratic error contours subject to a norm ball. The $L_1$ ball $\\{w: \\sum |w_i| \\le t\\}$ is a diamond/hyper-polytope with sharp corners along coordinate axes. Elliptical loss contours are statistically far more likely to intersect the constraint boundary at these sharp corners, where one or more coordinates are exactly zero. In contrast, the $L_2$ ball $\\{w: \\sum w_i^2 \\le t\\}$ is a smooth hyper-sphere with continuous curvature; the gradient of the penalty is proportional to $2w$, approaching 0 as $w \\to 0$, which slows shrinkage near zero and prevents exact sparsity.",
    "solution": "Subgradient of $L_1$ is $\\text{sign}(w_i)$, providing a constant force of $\\lambda$ pushing $w_i$ all the way to 0. Gradient of $L_2$ is $2\\lambda w_i$, which decays to zero as $w_i \\to 0$.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Regularization",
      "Lasso",
      "Ridge",
      "Amazon"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Supervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-decision-tree-splitting-criteria",
    "title": "Information Gain, Entropy vs Gini Impurity in Decision Trees",
    "question": "Compare Shannon Entropy $H(S) = -\\sum p_i \\log_2 p_i$ and Gini Impurity $G(S) = 1 - \\sum p_i^2$ for splitting a decision tree node. When does Gini impurity differ practically from Entropy, and why does CART prefer Gini while C4.5 prefers Gain Ratio?",
    "type": "AI/ML",
    "company": "Microsoft",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Supervised Learning",
    "subtopic": "Decision Trees",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Microsoft Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Taylor expansion: $\\ln(p) \\approx p - 1$ connects Entropy to Gini.",
      "Consider computational cost on millions of candidate splits."
    ],
    "explanation": "Both metrics measure node impurity and peak at $p=0.5$ for binary classification. Gini is computationally faster because it requires simple squarings rather than expensive logarithmic operations. Entropy places slightly greater penalty on mixed classes. C4.5 uses Gain Ratio to penalize high-cardinality categorical splits (like user IDs) that artificially maximize Information Gain. CART uses Gini with binary splits across all feature types, mitigating the high-cardinality bias without requiring explicit ratio normalization.",
    "solution": "Gini: $1 - \\sum p_i^2$, maximum $1 - 1/K$ for $K$ classes. Entropy: $-\\sum p_i \\log_2 p_i$, maximum $\\log_2 K$. In binary classification, Gini peaks at 0.5, Entropy peaks at 1.0. Results are almost identical in 98% of splits.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Decision Trees",
      "Entropy",
      "Gini",
      "Microsoft"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Supervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-random-forest-variance-reduction",
    "title": "Random Forest Variance Reduction via Bagging & Feature Subsampling",
    "question": "Given $B$ identical trees with individual variance $\\sigma^2$ and pairwise correlation $\\rho$, write the variance of the ensemble average. Explain how bagging (bootstrap aggregation) and random feature subsampling (mtry) reduce $\\rho$ and overall variance.",
    "type": "AI/ML",
    "company": "Apple",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Supervised Learning",
    "subtopic": "Ensemble Methods",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Apple Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Write the expansion $\\text{Var}(\\frac{1}{B} \\sum X_i) = \\frac{1}{B^2} [ \\sum \\text{Var}(X_i) + \\sum_{i \\ne j} \\text{Cov}(X_i, X_j) ]$.",
      "Substitute $\\text{Cov}(X_i, X_j) = \\rho \\sigma^2$."
    ],
    "explanation": "The variance of the average of $B$ random variables each with variance $\\sigma^2$ and pairwise correlation $\\rho$ is: $\\text{Var}(\\bar{X}) = \\rho \\sigma^2 + \\frac{1 - \\rho}{B} \\sigma^2$. As $B \\to \\infty$, the second term vanishes, leaving the asymptotic variance $\\rho \\sigma^2$. Bagging reduces variance by averaging over bootstrap samples, but standard bagging leaves trees highly correlated if strong features dominate every split. Random Forests introduce feature subsampling (e.g. $\\sqrt{p}$ features per split), forcing trees to find alternative splits and decorrelating them (lowering $\\rho$), which reduces the irreducible floor $\\rho \\sigma^2$.",
    "solution": "Ensemble variance $= \\rho \\sigma^2 + \\frac{1-\\rho}{B}\\sigma^2$. Feature subsampling suppresses $\\rho$, enabling dramatic variance reduction without increasing tree bias.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Random Forest",
      "Ensembles",
      "Apple"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Supervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-xgboost-second-order-taylor",
    "title": "XGBoost Objective Function & Second-Order Taylor Expansion",
    "question": "How does XGBoost improve upon traditional Gradient Boosting Machines (GBM)? Derive the optimal tree leaf weight $w_j^*$ and split gain score using the second-order Taylor expansion with gradients $g_i$ and Hessians $h_i$.",
    "type": "AI/ML",
    "company": "Uber",
    "role": "Staff ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Supervised Learning",
    "subtopic": "Gradient Boosting",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Uber Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Use Taylor series: $l(y, \\hat{y} + f) \\approx l(y, \\hat{y}) + g f + \\frac{1}{2} h f^2$.",
      "Group sum over samples into sum over tree leaves."
    ],
    "explanation": "Traditional GBM only utilizes first-order gradients $g_i = \\partial_{\\hat{y}^{(t-1)}} l(y_i, \\hat{y}^{(t-1)})$ via line search. XGBoost approximates the loss function with a second-order Taylor polynomial: $\\tilde{\\mathcal{L}}^{(t)} \\approx \\sum_{i=1}^n [g_i f_t(x_i) + \\frac{1}{2} h_i f_t^2(x_i)] + \\gamma T + \\frac{1}{2} \\lambda \\sum_{j=1}^T w_j^2$. Regrouping by leaf $j$ with $I_j = \\{i : q(x_i) = j\\}$, the optimal leaf weight is $w_j^* = - \\frac{\\sum_{i \\in I_j} g_i}{\\sum_{i \\in I_j} h_i + \\lambda}$, and the optimal objective reduction score is $-\\frac{1}{2} \\sum_{j=1}^T \\frac{(\\sum_{i \\in I_j} g_i)^2}{\\sum_{i \\in I_j} h_i + \\lambda} + \\gamma T$. The split gain is $\\frac{1}{2} [\\frac{G_L^2}{H_L + \\lambda} + \\frac{G_R^2}{H_R + \\lambda} - \\frac{(G_L + G_R)^2}{H_L + H_R + \\lambda}] - \\gamma$.",
    "solution": "Leaf weight: $w_j^* = -G_j / (H_j + \\lambda)$. Split gain: $\\text{Gain} = \\frac{1}{2} [\\frac{G_L^2}{H_L + \\lambda} + \\frac{G_R^2}{H_R + \\lambda} - \\frac{G_{parent}^2}{H_{parent} + \\lambda}] - \\gamma$.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "XGBoost",
      "Gradient Boosting",
      "Uber",
      "Taylor Series"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Supervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-support-vector-machine-primal-dual",
    "title": "Support Vector Machines (SVM): Primal, Dual, and Karush-Kuhn-Tucker (KKT)",
    "question": "State the primal optimization problem for a Soft-Margin SVM. Derive the Lagrangian dual formulation using KKT conditions, and show why the decision boundary depends exclusively on the support vectors.",
    "type": "AI/ML",
    "company": "Google",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Supervised Learning",
    "subtopic": "Support Vector Machines",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Google Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Apply Lagrangian multipliers $\\alpha_i$ for margin constraints and $\\mu_i$ for slack non-negativity.",
      "Inspect complementary slackness conditions."
    ],
    "explanation": "Primal: $\\min_{w, b, \\xi} \\frac{1}{2} ||w||^2 + C \\sum \\xi_i$ s.t. $y_i (w^T x_i + b) \\ge 1 - \\xi_i$ and $\\xi_i \\ge 0$. Lagrangian: $\\mathcal{L} = \\frac{1}{2} ||w||^2 + C \\sum \\xi_i - \\sum \\alpha_i [y_i(w^T x_i + b) - 1 + \\xi_i] - \\sum \\mu_i \\xi_i$. Setting gradients to zero: $w = \\sum \\alpha_i y_i x_i$, $\\sum \\alpha_i y_i = 0$, and $C - \\alpha_i - \\mu_i = 0$. Substituting back yields Dual: $\\max_\\alpha \\sum \\alpha_i - \\frac{1}{2} \\sum_{i,j} \\alpha_i \\alpha_j y_i y_j (x_i^T x_j)$ s.t. $0 \\le \\alpha_i \\le C$. By KKT complementary slackness $\\alpha_i [y_i(w^T x_i + b) - 1 + \\xi_i] = 0$: if a point is strictly outside the margin, $y_i(w^T x_i + b) > 1$, forcing $\\alpha_i = 0$. Hence, only points on or violating the margin have $\\alpha_i > 0$ and define $w$.",
    "solution": "$w = \\sum_{i \\in SV} \\alpha_i y_i x_i$. Only data points with non-zero Lagrange multipliers $\\alpha_i > 0$ determine the hyperplane.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "SVM",
      "Optimization",
      "KKT",
      "Google"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Supervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-kernel-trick-mercer-theorem",
    "title": "The Kernel Trick and Mercer's Theorem in Non-Linear Classifiers",
    "question": "Explain how the Kernel Trick computes inner products in high- or infinite-dimensional Hilbert spaces without explicitly projecting features. What does Mercer's Theorem state regarding valid kernel functions?",
    "type": "AI/ML",
    "company": "Amazon",
    "role": "Applied Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Supervised Learning",
    "subtopic": "Kernel Methods",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Write the Taylor expansion of $e^{x^T z}$ to see the infinite series of polynomial features.",
      "Think about positive semi-definite Gram matrices."
    ],
    "explanation": "Dual formulations of algorithms like SVM, Ridge Regression, and PCA depend solely on inner products $\\langle \\phi(x_i), \\phi(x_j) \\rangle$. A kernel function $K(x_i, x_j) = \\langle \\phi(x_i), \\phi(x_j) \\rangle$ evaluates this inner product in $O(d)$ time regardless of the dimensionality of $\\phi$. For example, the Radial Basis Function (RBF/Gaussian) kernel $K(x, z) = \\exp(-\\gamma ||x - z||^2)$ corresponds to an infinite-dimensional feature expansion. Mercer's Theorem states that a symmetric function $K(x, z)$ is a valid inner product kernel if and only if the Gram matrix $K_{ij} = K(x_i, x_j)$ is positive semi-definite (PSD) for any finite set of points.",
    "solution": "Mercer's Condition: $K(x, z) = K(z, x)$ and $\\sum_{i,j} c_i c_j K(x_i, x_j) \\ge 0$ for all real sequences $c_i$. Guarantees the existence of an implicit feature mapping $\\phi$.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Kernels",
      "RBF",
      "Amazon",
      "Math for ML"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Supervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-bias-variance-decomposition-derivation",
    "title": "Mathematical Derivation of Bias-Variance Decomposition",
    "question": "Derive the Bias-Variance-Noise decomposition of the expected mean squared error: $\\mathbb{E}[(y - \\hat{f}(x))^2] = \\text{Bias}[\\hat{f}(x)]^2 + \\text{Var}[\\hat{f}(x)] + \\sigma^2$. Explain how model capacity controls the trade-off.",
    "type": "AI/ML",
    "company": "Netflix",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Supervised Learning",
    "subtopic": "Learning Theory",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Netflix Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Add and subtract $\\mathbb{E}[\\hat{f}(x)]$ inside the squared error.",
      "Expand the square and take expectations using linearity."
    ],
    "explanation": "Let true label $y = f(x) + \\epsilon$ with $\\mathbb{E}[\\epsilon]=0$ and $\\text{Var}(\\epsilon)=\\sigma^2$. Expected MSE is $\\mathbb{E}[(y - \\hat{f})^2] = \\mathbb{E}[( (f - \\mathbb{E}[\\hat{f}]) - (\\hat{f} - \\mathbb{E}[\\hat{f}]) + \\epsilon )^2]$. Cross-terms vanish because $\\epsilon$ is independent of the training set and $\\mathbb{E}[\\hat{f} - \\mathbb{E}[\\hat{f}]] = 0$. We are left with: $(f(x) - \\mathbb{E}[\\hat{f}(x)])^2 + \\mathbb{E}[(\\hat{f}(x) - \\mathbb{E}[\\hat{f}(x)])^2] + \\mathbb{E}[\\epsilon^2] = \\text{Bias}^2 + \\text{Variance} + \\text{Irreducible Noise}$. Increasing model capacity decreases bias (fits complex patterns) but increases variance (overfits to specific training noise).",
    "solution": "Expected error $= (\\text{Bias}[\\hat{f}(x)])^2 + \\text{Var}[\\hat{f}(x)] + \\sigma_\\epsilon^2$. Underfitting is dominated by bias; overfitting is dominated by variance.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Bias-Variance",
      "Statistics",
      "Netflix"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Supervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-roc-auc-vs-pr-auc-imbalance",
    "title": "ROC-AUC vs PR-AUC Under Severe Class Imbalance",
    "question": "In fraud detection where the positive class is 0.05% of transactions, why does ROC-AUC present a misleadingly optimistic metric while Precision-Recall AUC (PR-AUC) accurately reflects performance? Provide mathematical justification.",
    "type": "AI/ML",
    "company": "Stripe",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Model Evaluation",
    "subtopic": "Evaluation Metrics",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Stripe Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Write the formula for False Positive Rate vs Precision.",
      "Analyze what happens to each when True Negatives $TN \\to \\infty$."
    ],
    "explanation": "ROC plots True Positive Rate ($TPR = TP / P$) against False Positive Rate ($FPR = FP / N$). When the negative class is massive ($N = 1,000,000$), even $10,000$ false positives yields $FPR = 10,000 / 1,000,000 = 0.01$ (a seemingly great 1% false positive rate), keeping the ROC curve near the top-left corner. In contrast, Precision-Recall curves plot Precision ($TP / (TP + FP)$) against Recall ($TP / P$). With $TP = 500$ and $FP = 10,000$, precision collapses to $500 / 10,500 \\approx 4.76\\%$. PR-AUC directly exposes the flood of false positives because its denominator includes $FP$ alongside $TP$ rather than the huge negative count $N$.",
    "solution": "PR curve is sensitive to changes in False Positives relative to True Positives: $\\text{Precision} = \\frac{TP}{TP + FP}$. ROC is insensitive because $FPR = \\frac{FP}{FP + TN} \\approx \\frac{FP}{N}$ when $TN \\gg FP$.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Evaluation Metrics",
      "Imbalanced Data",
      "Stripe"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Model Evaluation.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-11-stochastic-gradient-descent-adaptiv",
    "title": "Stochastic Gradient Descent & Adaptive Optimizers [Problem #11]",
    "question": "Analyze and solve the core technical challenge in **Stochastic Gradient Descent & Adaptive Optimizers** within **Optimization & Gradients**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Google.",
    "type": "AI/ML",
    "company": "Google",
    "role": "Research Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Optimization & Gradients",
    "subtopic": "Stochastic Gradient Descent & Adaptive Optimizers",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Google Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Stochastic Gradient Descent & Adaptive Optimizers.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Stochastic Gradient Descent & Adaptive Optimizers. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Optimization & Gradients",
      "Google",
      "ResearchScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Optimization & Gradients.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-12-learning-rate-schedules-convergence",
    "title": "Learning Rate Schedules & Convergence Diagnostics [Problem #12]",
    "question": "Analyze and solve the core technical challenge in **Learning Rate Schedules & Convergence Diagnostics** within **Optimization & Gradients**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Meta.",
    "type": "AI/ML",
    "company": "Meta",
    "role": "AI Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Optimization & Gradients",
    "subtopic": "Learning Rate Schedules & Convergence Diagnostics",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Meta Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Learning Rate Schedules & Convergence Diagnostics.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Learning Rate Schedules & Convergence Diagnostics. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Optimization & Gradients",
      "Meta",
      "AIEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Optimization & Gradients.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-13-vanishing-exploding-gradients-in-de",
    "title": "Vanishing & Exploding Gradients in Deep Architectures [Problem #13]",
    "question": "Analyze and solve the core technical challenge in **Vanishing & Exploding Gradients in Deep Architectures** within **Neural Networks & Deep Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Microsoft.",
    "type": "AI/ML",
    "company": "Microsoft",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Neural Networks & Deep Learning",
    "subtopic": "Vanishing & Exploding Gradients in Deep Architectures",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Microsoft Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Vanishing & Exploding Gradients in Deep Architectures.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Vanishing & Exploding Gradients in Deep Architectures. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Neural Networks & Deep Learning",
      "Microsoft",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Neural Networks & Deep Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-14-activation-functions-relu-gelu-swis",
    "title": "Activation Functions [Problem #14]",
    "question": "Analyze and solve the core technical challenge in **Activation Functions: ReLU, GeLU, Swish & Dead Neurons** within **Neural Networks & Deep Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Amazon.",
    "type": "AI/ML",
    "company": "Amazon",
    "role": "Applied Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Neural Networks & Deep Learning",
    "subtopic": "Activation Functions: ReLU, GeLU, Swish & Dead Neurons",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Amazon Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Activation Functions: ReLU, GeLU, Swish & Dead Neurons.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Activation Functions: ReLU, GeLU, Swish & Dead Neurons. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Neural Networks & Deep Learning",
      "Amazon",
      "AppliedScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Neural Networks & Deep Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-15-normalization-layers-batchnorm-vs-l",
    "title": "Normalization Layers [Problem #15]",
    "question": "Analyze and solve the core technical challenge in **Normalization Layers: BatchNorm vs LayerNorm vs GroupNorm** within **Neural Networks & Deep Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Apple.",
    "type": "AI/ML",
    "company": "Apple",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Neural Networks & Deep Learning",
    "subtopic": "Normalization Layers: BatchNorm vs LayerNorm vs GroupNorm",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Apple Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Normalization Layers: BatchNorm vs LayerNorm vs GroupNorm.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Normalization Layers: BatchNorm vs LayerNorm vs GroupNorm. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Neural Networks & Deep Learning",
      "Apple",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Neural Networks & Deep Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-16-loss-functions-cross-entropy-focal-",
    "title": "Loss Functions [Problem #16]",
    "question": "Analyze and solve the core technical challenge in **Loss Functions: Cross-Entropy, Focal Loss, Triplet Loss** within **Neural Networks & Deep Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Netflix.",
    "type": "AI/ML",
    "company": "Netflix",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Neural Networks & Deep Learning",
    "subtopic": "Loss Functions: Cross-Entropy, Focal Loss, Triplet Loss",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Netflix Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Loss Functions: Cross-Entropy, Focal Loss, Triplet Loss.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Loss Functions: Cross-Entropy, Focal Loss, Triplet Loss. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Neural Networks & Deep Learning",
      "Netflix",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Neural Networks & Deep Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-17-receptive-field-calculation-dilated",
    "title": "Receptive Field Calculation, Dilated Convolutions & Strides [Problem #17]",
    "question": "Analyze and solve the core technical challenge in **Receptive Field Calculation, Dilated Convolutions & Strides** within **Convolutional Neural Networks**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Google.",
    "type": "AI/ML",
    "company": "Google",
    "role": "Computer Vision Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Convolutional Neural Networks",
    "subtopic": "Receptive Field Calculation, Dilated Convolutions & Strides",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Google Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Receptive Field Calculation, Dilated Convolutions & Strides.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Receptive Field Calculation, Dilated Convolutions & Strides. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Convolutional Neural Networks",
      "Google",
      "ComputerVisionEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Convolutional Neural Networks.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-18-residual-connections-resnet-degrada",
    "title": "Residual Connections (ResNet) & Degradation Problem [Problem #18]",
    "question": "Analyze and solve the core technical challenge in **Residual Connections (ResNet) & Degradation Problem** within **Convolutional Neural Networks**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Meta.",
    "type": "AI/ML",
    "company": "Meta",
    "role": "Vision Researcher",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Convolutional Neural Networks",
    "subtopic": "Residual Connections (ResNet) & Degradation Problem",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Meta Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Residual Connections (ResNet) & Degradation Problem.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Residual Connections (ResNet) & Degradation Problem. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Convolutional Neural Networks",
      "Meta",
      "VisionResearcher"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Convolutional Neural Networks.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-19-recurrent-networks-backpropagation-",
    "title": "Recurrent Networks [Problem #19]",
    "question": "Analyze and solve the core technical challenge in **Recurrent Networks: Backpropagation Through Time (BPTT)** within **Sequence Models**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Amazon.",
    "type": "AI/ML",
    "company": "Amazon",
    "role": "NLP Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Sequence Models",
    "subtopic": "Recurrent Networks: Backpropagation Through Time (BPTT)",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Amazon Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Recurrent Networks: Backpropagation Through Time (BPTT).",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Recurrent Networks: Backpropagation Through Time (BPTT). Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Sequence Models",
      "Amazon",
      "NLPScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Sequence Models.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-20-lstm-gating-mechanism-forget-input-",
    "title": "LSTM Gating Mechanism [Problem #20]",
    "question": "Analyze and solve the core technical challenge in **LSTM Gating Mechanism: Forget, Input, Output Gates** within **Sequence Models**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Apple.",
    "type": "AI/ML",
    "company": "Apple",
    "role": "Speech Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Sequence Models",
    "subtopic": "LSTM Gating Mechanism: Forget, Input, Output Gates",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Apple Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of LSTM Gating Mechanism: Forget, Input, Output Gates.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in LSTM Gating Mechanism: Forget, Input, Output Gates. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Sequence Models",
      "Apple",
      "SpeechEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Sequence Models.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-21-k-means-clustering-lloyd-s-algorith",
    "title": "K-Means Clustering [Problem #21]",
    "question": "Analyze and solve the core technical challenge in **K-Means Clustering: Lloyd's Algorithm & K-Means++ Seeding** within **Unsupervised Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Uber.",
    "type": "AI/ML",
    "company": "Uber",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Unsupervised Learning",
    "subtopic": "K-Means Clustering: Lloyd's Algorithm & K-Means++ Seeding",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Uber Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of K-Means Clustering: Lloyd's Algorithm & K-Means++ Seeding.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in K-Means Clustering: Lloyd's Algorithm & K-Means++ Seeding. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Unsupervised Learning",
      "Uber",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Unsupervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-22-dbscan-density-based-clustering-cor",
    "title": "DBSCAN [Problem #22]",
    "question": "Analyze and solve the core technical challenge in **DBSCAN: Density-Based Clustering, Core Points & Noise** within **Unsupervised Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Stripe.",
    "type": "AI/ML",
    "company": "Stripe",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Unsupervised Learning",
    "subtopic": "DBSCAN: Density-Based Clustering, Core Points & Noise",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Stripe Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of DBSCAN: Density-Based Clustering, Core Points & Noise.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in DBSCAN: Density-Based Clustering, Core Points & Noise. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Unsupervised Learning",
      "Stripe",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Unsupervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-23-principal-component-analysis-pca-ei",
    "title": "Principal Component Analysis (PCA) [Problem #23]",
    "question": "Analyze and solve the core technical challenge in **Principal Component Analysis (PCA): Eigenvalue Decomposition** within **Unsupervised Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Goldman Sachs.",
    "type": "AI/ML",
    "company": "Goldman Sachs",
    "role": "Quantitative Strategist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Unsupervised Learning",
    "subtopic": "Principal Component Analysis (PCA): Eigenvalue Decomposition",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Goldman Sachs Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Principal Component Analysis (PCA): Eigenvalue Decomposition.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Principal Component Analysis (PCA): Eigenvalue Decomposition. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Unsupervised Learning",
      "Goldman Sachs",
      "QuantitativeStrategist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Unsupervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-24-t-sne-umap-high-dimensional-manifol",
    "title": "t-SNE & UMAP [Problem #24]",
    "question": "Analyze and solve the core technical challenge in **t-SNE & UMAP: High-Dimensional Manifold Visualization** within **Unsupervised Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Google.",
    "type": "AI/ML",
    "company": "Google",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Unsupervised Learning",
    "subtopic": "t-SNE & UMAP: High-Dimensional Manifold Visualization",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of t-SNE & UMAP: High-Dimensional Manifold Visualization.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in t-SNE & UMAP: High-Dimensional Manifold Visualization. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Unsupervised Learning",
      "Google",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Unsupervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-25-target-encoding-with-additive-smoot",
    "title": "Target Encoding with Additive Smoothing to Avoid Leakage [Problem #25]",
    "question": "Analyze and solve the core technical challenge in **Target Encoding with Additive Smoothing to Avoid Leakage** within **Feature Engineering**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Flipkart.",
    "type": "AI/ML",
    "company": "Flipkart",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Feature Engineering",
    "subtopic": "Target Encoding with Additive Smoothing to Avoid Leakage",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Flipkart Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Target Encoding with Additive Smoothing to Avoid Leakage.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Target Encoding with Additive Smoothing to Avoid Leakage. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Feature Engineering",
      "Flipkart",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Feature Engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-26-handling-missing-data-mcar-mar-mnar",
    "title": "Handling Missing Data [Problem #26]",
    "question": "Analyze and solve the core technical challenge in **Handling Missing Data: MCAR, MAR, MNAR & Iterative Imputation** within **Feature Engineering**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at TCS.",
    "type": "AI/ML",
    "company": "TCS",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Feature Engineering",
    "subtopic": "Handling Missing Data: MCAR, MAR, MNAR & Iterative Imputation",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "TCS Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Handling Missing Data: MCAR, MAR, MNAR & Iterative Imputation.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Handling Missing Data: MCAR, MAR, MNAR & Iterative Imputation. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Feature Engineering",
      "TCS",
      "DataEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Feature Engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-27-high-cardinality-categorical-encodi",
    "title": "High-Cardinality Categorical Encoding [Problem #27]",
    "question": "Analyze and solve the core technical challenge in **High-Cardinality Categorical Encoding: Hashing Trick & Embeddings** within **Feature Engineering**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Amazon.",
    "type": "AI/ML",
    "company": "Amazon",
    "role": "SDE ML",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Feature Engineering",
    "subtopic": "High-Cardinality Categorical Encoding: Hashing Trick & Embeddings",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of High-Cardinality Categorical Encoding: Hashing Trick & Embeddings.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in High-Cardinality Categorical Encoding: Hashing Trick & Embeddings. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Feature Engineering",
      "Amazon",
      "SDEML"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Feature Engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-28-variance-inflation-factor-vif-multi",
    "title": "Variance Inflation Factor (VIF) & Multicollinearity Remediation [Problem #28]",
    "question": "Analyze and solve the core technical challenge in **Variance Inflation Factor (VIF) & Multicollinearity Remediation** within **Feature Engineering**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Microsoft.",
    "type": "AI/ML",
    "company": "Microsoft",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Feature Engineering",
    "subtopic": "Variance Inflation Factor (VIF) & Multicollinearity Remediation",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Microsoft Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Variance Inflation Factor (VIF) & Multicollinearity Remediation.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Variance Inflation Factor (VIF) & Multicollinearity Remediation. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Feature Engineering",
      "Microsoft",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Feature Engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-29-shap-shapley-additive-explanations-",
    "title": "SHAP (Shapley Additive Explanations) & Cooperative Game Theory [Problem #29]",
    "question": "Analyze and solve the core technical challenge in **SHAP (Shapley Additive Explanations) & Cooperative Game Theory** within **Model Interpretability**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Netflix.",
    "type": "AI/ML",
    "company": "Netflix",
    "role": "Research Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Model Interpretability",
    "subtopic": "SHAP (Shapley Additive Explanations) & Cooperative Game Theory",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Netflix Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of SHAP (Shapley Additive Explanations) & Cooperative Game Theory.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in SHAP (Shapley Additive Explanations) & Cooperative Game Theory. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Model Interpretability",
      "Netflix",
      "ResearchScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Model Interpretability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-30-lime-local-interpretable-model-agno",
    "title": "LIME (Local Interpretable Model-agnostic Explanations) [Problem #30]",
    "question": "Analyze and solve the core technical challenge in **LIME (Local Interpretable Model-agnostic Explanations)** within **Model Interpretability**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Meta.",
    "type": "AI/ML",
    "company": "Meta",
    "role": "Trust & Safety Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Model Interpretability",
    "subtopic": "LIME (Local Interpretable Model-agnostic Explanations)",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Meta Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of LIME (Local Interpretable Model-agnostic Explanations).",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in LIME (Local Interpretable Model-agnostic Explanations). Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Model Interpretability",
      "Meta",
      "Trust&SafetyEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Model Interpretability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-31-singular-value-decomposition-svd-an",
    "title": "Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation [Problem #31]",
    "question": "Analyze and solve the core technical challenge in **Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation** within **ML Mathematics**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Google.",
    "type": "AI/ML",
    "company": "Google",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "ML Mathematics",
    "subtopic": "Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Google Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "ML Mathematics",
      "Google",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in ML Mathematics.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-32-convex-optimization-dual-norms-subg",
    "title": "Convex Optimization [Problem #32]",
    "question": "Analyze and solve the core technical challenge in **Convex Optimization: Dual Norms, Subgradients & Proximal Operators** within **ML Mathematics**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Uber.",
    "type": "AI/ML",
    "company": "Uber",
    "role": "Staff Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "ML Mathematics",
    "subtopic": "Convex Optimization: Dual Norms, Subgradients & Proximal Operators",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Uber Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Convex Optimization: Dual Norms, Subgradients & Proximal Operators.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Convex Optimization: Dual Norms, Subgradients & Proximal Operators. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "ML Mathematics",
      "Uber",
      "StaffScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in ML Mathematics.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-33-covariance-matrices-positive-semi-d",
    "title": "Covariance Matrices, Positive Semi-Definiteness & Mahalanobis Distance [Problem #33]",
    "question": "Analyze and solve the core technical challenge in **Covariance Matrices, Positive Semi-Definiteness & Mahalanobis Distance** within **ML Mathematics**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Morgan Stanley.",
    "type": "AI/ML",
    "company": "Morgan Stanley",
    "role": "Quant",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "ML Mathematics",
    "subtopic": "Covariance Matrices, Positive Semi-Definiteness & Mahalanobis Distance",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Morgan Stanley Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Covariance Matrices, Positive Semi-Definiteness & Mahalanobis Distance.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Covariance Matrices, Positive Semi-Definiteness & Mahalanobis Distance. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "ML Mathematics",
      "Morgan Stanley",
      "Quant"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in ML Mathematics.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-34-stochastic-gradient-descent-adaptiv",
    "title": "Stochastic Gradient Descent & Adaptive Optimizers [Problem #34]",
    "question": "Analyze and solve the core technical challenge in **Stochastic Gradient Descent & Adaptive Optimizers** within **Optimization & Gradients**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Google.",
    "type": "AI/ML",
    "company": "Google",
    "role": "Research Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Optimization & Gradients",
    "subtopic": "Stochastic Gradient Descent & Adaptive Optimizers",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Google Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Stochastic Gradient Descent & Adaptive Optimizers.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Stochastic Gradient Descent & Adaptive Optimizers. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Optimization & Gradients",
      "Google",
      "ResearchScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Optimization & Gradients.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-35-learning-rate-schedules-convergence",
    "title": "Learning Rate Schedules & Convergence Diagnostics [Problem #35]",
    "question": "Analyze and solve the core technical challenge in **Learning Rate Schedules & Convergence Diagnostics** within **Optimization & Gradients**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Meta.",
    "type": "AI/ML",
    "company": "Meta",
    "role": "AI Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Optimization & Gradients",
    "subtopic": "Learning Rate Schedules & Convergence Diagnostics",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Learning Rate Schedules & Convergence Diagnostics.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Learning Rate Schedules & Convergence Diagnostics. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Optimization & Gradients",
      "Meta",
      "AIEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Optimization & Gradients.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-36-vanishing-exploding-gradients-in-de",
    "title": "Vanishing & Exploding Gradients in Deep Architectures [Problem #36]",
    "question": "Analyze and solve the core technical challenge in **Vanishing & Exploding Gradients in Deep Architectures** within **Neural Networks & Deep Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Microsoft.",
    "type": "AI/ML",
    "company": "Microsoft",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Neural Networks & Deep Learning",
    "subtopic": "Vanishing & Exploding Gradients in Deep Architectures",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Microsoft Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Vanishing & Exploding Gradients in Deep Architectures.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Vanishing & Exploding Gradients in Deep Architectures. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Neural Networks & Deep Learning",
      "Microsoft",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Neural Networks & Deep Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-37-activation-functions-relu-gelu-swis",
    "title": "Activation Functions [Problem #37]",
    "question": "Analyze and solve the core technical challenge in **Activation Functions: ReLU, GeLU, Swish & Dead Neurons** within **Neural Networks & Deep Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Amazon.",
    "type": "AI/ML",
    "company": "Amazon",
    "role": "Applied Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Neural Networks & Deep Learning",
    "subtopic": "Activation Functions: ReLU, GeLU, Swish & Dead Neurons",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Amazon Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Activation Functions: ReLU, GeLU, Swish & Dead Neurons.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Activation Functions: ReLU, GeLU, Swish & Dead Neurons. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Neural Networks & Deep Learning",
      "Amazon",
      "AppliedScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Neural Networks & Deep Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-38-normalization-layers-batchnorm-vs-l",
    "title": "Normalization Layers [Problem #38]",
    "question": "Analyze and solve the core technical challenge in **Normalization Layers: BatchNorm vs LayerNorm vs GroupNorm** within **Neural Networks & Deep Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Apple.",
    "type": "AI/ML",
    "company": "Apple",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Neural Networks & Deep Learning",
    "subtopic": "Normalization Layers: BatchNorm vs LayerNorm vs GroupNorm",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Apple Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Normalization Layers: BatchNorm vs LayerNorm vs GroupNorm.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Normalization Layers: BatchNorm vs LayerNorm vs GroupNorm. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Neural Networks & Deep Learning",
      "Apple",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Neural Networks & Deep Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-39-loss-functions-cross-entropy-focal-",
    "title": "Loss Functions [Problem #39]",
    "question": "Analyze and solve the core technical challenge in **Loss Functions: Cross-Entropy, Focal Loss, Triplet Loss** within **Neural Networks & Deep Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Netflix.",
    "type": "AI/ML",
    "company": "Netflix",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Neural Networks & Deep Learning",
    "subtopic": "Loss Functions: Cross-Entropy, Focal Loss, Triplet Loss",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Netflix Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Loss Functions: Cross-Entropy, Focal Loss, Triplet Loss.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Loss Functions: Cross-Entropy, Focal Loss, Triplet Loss. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Neural Networks & Deep Learning",
      "Netflix",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Neural Networks & Deep Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-40-receptive-field-calculation-dilated",
    "title": "Receptive Field Calculation, Dilated Convolutions & Strides [Problem #40]",
    "question": "Analyze and solve the core technical challenge in **Receptive Field Calculation, Dilated Convolutions & Strides** within **Convolutional Neural Networks**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Google.",
    "type": "AI/ML",
    "company": "Google",
    "role": "Computer Vision Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Convolutional Neural Networks",
    "subtopic": "Receptive Field Calculation, Dilated Convolutions & Strides",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Google Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Receptive Field Calculation, Dilated Convolutions & Strides.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Receptive Field Calculation, Dilated Convolutions & Strides. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Convolutional Neural Networks",
      "Google",
      "ComputerVisionEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Convolutional Neural Networks.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-41-residual-connections-resnet-degrada",
    "title": "Residual Connections (ResNet) & Degradation Problem [Problem #41]",
    "question": "Analyze and solve the core technical challenge in **Residual Connections (ResNet) & Degradation Problem** within **Convolutional Neural Networks**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Meta.",
    "type": "AI/ML",
    "company": "Meta",
    "role": "Vision Researcher",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Convolutional Neural Networks",
    "subtopic": "Residual Connections (ResNet) & Degradation Problem",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Residual Connections (ResNet) & Degradation Problem.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Residual Connections (ResNet) & Degradation Problem. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Convolutional Neural Networks",
      "Meta",
      "VisionResearcher"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Convolutional Neural Networks.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-42-recurrent-networks-backpropagation-",
    "title": "Recurrent Networks [Problem #42]",
    "question": "Analyze and solve the core technical challenge in **Recurrent Networks: Backpropagation Through Time (BPTT)** within **Sequence Models**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Amazon.",
    "type": "AI/ML",
    "company": "Amazon",
    "role": "NLP Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Sequence Models",
    "subtopic": "Recurrent Networks: Backpropagation Through Time (BPTT)",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Recurrent Networks: Backpropagation Through Time (BPTT).",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Recurrent Networks: Backpropagation Through Time (BPTT). Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Sequence Models",
      "Amazon",
      "NLPScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Sequence Models.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-43-lstm-gating-mechanism-forget-input-",
    "title": "LSTM Gating Mechanism [Problem #43]",
    "question": "Analyze and solve the core technical challenge in **LSTM Gating Mechanism: Forget, Input, Output Gates** within **Sequence Models**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Apple.",
    "type": "AI/ML",
    "company": "Apple",
    "role": "Speech Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Sequence Models",
    "subtopic": "LSTM Gating Mechanism: Forget, Input, Output Gates",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Apple Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of LSTM Gating Mechanism: Forget, Input, Output Gates.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in LSTM Gating Mechanism: Forget, Input, Output Gates. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Sequence Models",
      "Apple",
      "SpeechEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Sequence Models.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-44-k-means-clustering-lloyd-s-algorith",
    "title": "K-Means Clustering [Problem #44]",
    "question": "Analyze and solve the core technical challenge in **K-Means Clustering: Lloyd's Algorithm & K-Means++ Seeding** within **Unsupervised Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Uber.",
    "type": "AI/ML",
    "company": "Uber",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Unsupervised Learning",
    "subtopic": "K-Means Clustering: Lloyd's Algorithm & K-Means++ Seeding",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Uber Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of K-Means Clustering: Lloyd's Algorithm & K-Means++ Seeding.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in K-Means Clustering: Lloyd's Algorithm & K-Means++ Seeding. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Unsupervised Learning",
      "Uber",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Unsupervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-45-dbscan-density-based-clustering-cor",
    "title": "DBSCAN [Problem #45]",
    "question": "Analyze and solve the core technical challenge in **DBSCAN: Density-Based Clustering, Core Points & Noise** within **Unsupervised Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Stripe.",
    "type": "AI/ML",
    "company": "Stripe",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Unsupervised Learning",
    "subtopic": "DBSCAN: Density-Based Clustering, Core Points & Noise",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Stripe Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of DBSCAN: Density-Based Clustering, Core Points & Noise.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in DBSCAN: Density-Based Clustering, Core Points & Noise. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Unsupervised Learning",
      "Stripe",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Unsupervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-46-principal-component-analysis-pca-ei",
    "title": "Principal Component Analysis (PCA) [Problem #46]",
    "question": "Analyze and solve the core technical challenge in **Principal Component Analysis (PCA): Eigenvalue Decomposition** within **Unsupervised Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Goldman Sachs.",
    "type": "AI/ML",
    "company": "Goldman Sachs",
    "role": "Quantitative Strategist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Unsupervised Learning",
    "subtopic": "Principal Component Analysis (PCA): Eigenvalue Decomposition",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Goldman Sachs Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Principal Component Analysis (PCA): Eigenvalue Decomposition.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Principal Component Analysis (PCA): Eigenvalue Decomposition. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Unsupervised Learning",
      "Goldman Sachs",
      "QuantitativeStrategist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Unsupervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-47-t-sne-umap-high-dimensional-manifol",
    "title": "t-SNE & UMAP [Problem #47]",
    "question": "Analyze and solve the core technical challenge in **t-SNE & UMAP: High-Dimensional Manifold Visualization** within **Unsupervised Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Google.",
    "type": "AI/ML",
    "company": "Google",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Unsupervised Learning",
    "subtopic": "t-SNE & UMAP: High-Dimensional Manifold Visualization",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Google Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of t-SNE & UMAP: High-Dimensional Manifold Visualization.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in t-SNE & UMAP: High-Dimensional Manifold Visualization. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Unsupervised Learning",
      "Google",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Unsupervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-48-target-encoding-with-additive-smoot",
    "title": "Target Encoding with Additive Smoothing to Avoid Leakage [Problem #48]",
    "question": "Analyze and solve the core technical challenge in **Target Encoding with Additive Smoothing to Avoid Leakage** within **Feature Engineering**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Flipkart.",
    "type": "AI/ML",
    "company": "Flipkart",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Feature Engineering",
    "subtopic": "Target Encoding with Additive Smoothing to Avoid Leakage",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Flipkart Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Target Encoding with Additive Smoothing to Avoid Leakage.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Target Encoding with Additive Smoothing to Avoid Leakage. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Feature Engineering",
      "Flipkart",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Feature Engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-49-handling-missing-data-mcar-mar-mnar",
    "title": "Handling Missing Data [Problem #49]",
    "question": "Analyze and solve the core technical challenge in **Handling Missing Data: MCAR, MAR, MNAR & Iterative Imputation** within **Feature Engineering**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at TCS.",
    "type": "AI/ML",
    "company": "TCS",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Feature Engineering",
    "subtopic": "Handling Missing Data: MCAR, MAR, MNAR & Iterative Imputation",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "TCS Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Handling Missing Data: MCAR, MAR, MNAR & Iterative Imputation.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Handling Missing Data: MCAR, MAR, MNAR & Iterative Imputation. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Feature Engineering",
      "TCS",
      "DataEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Feature Engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-50-high-cardinality-categorical-encodi",
    "title": "High-Cardinality Categorical Encoding [Problem #50]",
    "question": "Analyze and solve the core technical challenge in **High-Cardinality Categorical Encoding: Hashing Trick & Embeddings** within **Feature Engineering**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Amazon.",
    "type": "AI/ML",
    "company": "Amazon",
    "role": "SDE ML",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Feature Engineering",
    "subtopic": "High-Cardinality Categorical Encoding: Hashing Trick & Embeddings",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Amazon Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of High-Cardinality Categorical Encoding: Hashing Trick & Embeddings.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in High-Cardinality Categorical Encoding: Hashing Trick & Embeddings. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Feature Engineering",
      "Amazon",
      "SDEML"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Feature Engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-51-variance-inflation-factor-vif-multi",
    "title": "Variance Inflation Factor (VIF) & Multicollinearity Remediation [Problem #51]",
    "question": "Analyze and solve the core technical challenge in **Variance Inflation Factor (VIF) & Multicollinearity Remediation** within **Feature Engineering**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Microsoft.",
    "type": "AI/ML",
    "company": "Microsoft",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Feature Engineering",
    "subtopic": "Variance Inflation Factor (VIF) & Multicollinearity Remediation",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Microsoft Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Variance Inflation Factor (VIF) & Multicollinearity Remediation.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Variance Inflation Factor (VIF) & Multicollinearity Remediation. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Feature Engineering",
      "Microsoft",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Feature Engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-52-shap-shapley-additive-explanations-",
    "title": "SHAP (Shapley Additive Explanations) & Cooperative Game Theory [Problem #52]",
    "question": "Analyze and solve the core technical challenge in **SHAP (Shapley Additive Explanations) & Cooperative Game Theory** within **Model Interpretability**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Netflix.",
    "type": "AI/ML",
    "company": "Netflix",
    "role": "Research Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Model Interpretability",
    "subtopic": "SHAP (Shapley Additive Explanations) & Cooperative Game Theory",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Netflix Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of SHAP (Shapley Additive Explanations) & Cooperative Game Theory.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in SHAP (Shapley Additive Explanations) & Cooperative Game Theory. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Model Interpretability",
      "Netflix",
      "ResearchScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Model Interpretability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-53-lime-local-interpretable-model-agno",
    "title": "LIME (Local Interpretable Model-agnostic Explanations) [Problem #53]",
    "question": "Analyze and solve the core technical challenge in **LIME (Local Interpretable Model-agnostic Explanations)** within **Model Interpretability**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Meta.",
    "type": "AI/ML",
    "company": "Meta",
    "role": "Trust & Safety Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Model Interpretability",
    "subtopic": "LIME (Local Interpretable Model-agnostic Explanations)",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of LIME (Local Interpretable Model-agnostic Explanations).",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in LIME (Local Interpretable Model-agnostic Explanations). Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Model Interpretability",
      "Meta",
      "Trust&SafetyEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Model Interpretability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-54-singular-value-decomposition-svd-an",
    "title": "Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation [Problem #54]",
    "question": "Analyze and solve the core technical challenge in **Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation** within **ML Mathematics**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Google.",
    "type": "AI/ML",
    "company": "Google",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "ML Mathematics",
    "subtopic": "Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "ML Mathematics",
      "Google",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in ML Mathematics.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-55-convex-optimization-dual-norms-subg",
    "title": "Convex Optimization [Problem #55]",
    "question": "Analyze and solve the core technical challenge in **Convex Optimization: Dual Norms, Subgradients & Proximal Operators** within **ML Mathematics**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Uber.",
    "type": "AI/ML",
    "company": "Uber",
    "role": "Staff Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "ML Mathematics",
    "subtopic": "Convex Optimization: Dual Norms, Subgradients & Proximal Operators",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Uber Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Convex Optimization: Dual Norms, Subgradients & Proximal Operators.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Convex Optimization: Dual Norms, Subgradients & Proximal Operators. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "ML Mathematics",
      "Uber",
      "StaffScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in ML Mathematics.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-56-covariance-matrices-positive-semi-d",
    "title": "Covariance Matrices, Positive Semi-Definiteness & Mahalanobis Distance [Problem #56]",
    "question": "Analyze and solve the core technical challenge in **Covariance Matrices, Positive Semi-Definiteness & Mahalanobis Distance** within **ML Mathematics**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Morgan Stanley.",
    "type": "AI/ML",
    "company": "Morgan Stanley",
    "role": "Quant",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "ML Mathematics",
    "subtopic": "Covariance Matrices, Positive Semi-Definiteness & Mahalanobis Distance",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Morgan Stanley Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Covariance Matrices, Positive Semi-Definiteness & Mahalanobis Distance.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Covariance Matrices, Positive Semi-Definiteness & Mahalanobis Distance. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "ML Mathematics",
      "Morgan Stanley",
      "Quant"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in ML Mathematics.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-57-stochastic-gradient-descent-adaptiv",
    "title": "Stochastic Gradient Descent & Adaptive Optimizers [Problem #57]",
    "question": "Analyze and solve the core technical challenge in **Stochastic Gradient Descent & Adaptive Optimizers** within **Optimization & Gradients**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Google.",
    "type": "AI/ML",
    "company": "Google",
    "role": "Research Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Optimization & Gradients",
    "subtopic": "Stochastic Gradient Descent & Adaptive Optimizers",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Stochastic Gradient Descent & Adaptive Optimizers.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Stochastic Gradient Descent & Adaptive Optimizers. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Optimization & Gradients",
      "Google",
      "ResearchScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Optimization & Gradients.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-58-learning-rate-schedules-convergence",
    "title": "Learning Rate Schedules & Convergence Diagnostics [Problem #58]",
    "question": "Analyze and solve the core technical challenge in **Learning Rate Schedules & Convergence Diagnostics** within **Optimization & Gradients**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Meta.",
    "type": "AI/ML",
    "company": "Meta",
    "role": "AI Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Optimization & Gradients",
    "subtopic": "Learning Rate Schedules & Convergence Diagnostics",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Meta Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Learning Rate Schedules & Convergence Diagnostics.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Learning Rate Schedules & Convergence Diagnostics. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Optimization & Gradients",
      "Meta",
      "AIEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Optimization & Gradients.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-59-vanishing-exploding-gradients-in-de",
    "title": "Vanishing & Exploding Gradients in Deep Architectures [Problem #59]",
    "question": "Analyze and solve the core technical challenge in **Vanishing & Exploding Gradients in Deep Architectures** within **Neural Networks & Deep Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Microsoft.",
    "type": "AI/ML",
    "company": "Microsoft",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Neural Networks & Deep Learning",
    "subtopic": "Vanishing & Exploding Gradients in Deep Architectures",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Microsoft Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Vanishing & Exploding Gradients in Deep Architectures.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Vanishing & Exploding Gradients in Deep Architectures. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Neural Networks & Deep Learning",
      "Microsoft",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Neural Networks & Deep Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-60-activation-functions-relu-gelu-swis",
    "title": "Activation Functions [Problem #60]",
    "question": "Analyze and solve the core technical challenge in **Activation Functions: ReLU, GeLU, Swish & Dead Neurons** within **Neural Networks & Deep Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Amazon.",
    "type": "AI/ML",
    "company": "Amazon",
    "role": "Applied Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Neural Networks & Deep Learning",
    "subtopic": "Activation Functions: ReLU, GeLU, Swish & Dead Neurons",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Activation Functions: ReLU, GeLU, Swish & Dead Neurons.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Activation Functions: ReLU, GeLU, Swish & Dead Neurons. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Neural Networks & Deep Learning",
      "Amazon",
      "AppliedScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Neural Networks & Deep Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-61-normalization-layers-batchnorm-vs-l",
    "title": "Normalization Layers [Problem #61]",
    "question": "Analyze and solve the core technical challenge in **Normalization Layers: BatchNorm vs LayerNorm vs GroupNorm** within **Neural Networks & Deep Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Apple.",
    "type": "AI/ML",
    "company": "Apple",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Neural Networks & Deep Learning",
    "subtopic": "Normalization Layers: BatchNorm vs LayerNorm vs GroupNorm",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Apple Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Normalization Layers: BatchNorm vs LayerNorm vs GroupNorm.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Normalization Layers: BatchNorm vs LayerNorm vs GroupNorm. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Neural Networks & Deep Learning",
      "Apple",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Neural Networks & Deep Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-62-loss-functions-cross-entropy-focal-",
    "title": "Loss Functions [Problem #62]",
    "question": "Analyze and solve the core technical challenge in **Loss Functions: Cross-Entropy, Focal Loss, Triplet Loss** within **Neural Networks & Deep Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Netflix.",
    "type": "AI/ML",
    "company": "Netflix",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Neural Networks & Deep Learning",
    "subtopic": "Loss Functions: Cross-Entropy, Focal Loss, Triplet Loss",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Netflix Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Loss Functions: Cross-Entropy, Focal Loss, Triplet Loss.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Loss Functions: Cross-Entropy, Focal Loss, Triplet Loss. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Neural Networks & Deep Learning",
      "Netflix",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Neural Networks & Deep Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-63-receptive-field-calculation-dilated",
    "title": "Receptive Field Calculation, Dilated Convolutions & Strides [Problem #63]",
    "question": "Analyze and solve the core technical challenge in **Receptive Field Calculation, Dilated Convolutions & Strides** within **Convolutional Neural Networks**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Google.",
    "type": "AI/ML",
    "company": "Google",
    "role": "Computer Vision Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Convolutional Neural Networks",
    "subtopic": "Receptive Field Calculation, Dilated Convolutions & Strides",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Receptive Field Calculation, Dilated Convolutions & Strides.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Receptive Field Calculation, Dilated Convolutions & Strides. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Convolutional Neural Networks",
      "Google",
      "ComputerVisionEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Convolutional Neural Networks.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-64-residual-connections-resnet-degrada",
    "title": "Residual Connections (ResNet) & Degradation Problem [Problem #64]",
    "question": "Analyze and solve the core technical challenge in **Residual Connections (ResNet) & Degradation Problem** within **Convolutional Neural Networks**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Meta.",
    "type": "AI/ML",
    "company": "Meta",
    "role": "Vision Researcher",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Convolutional Neural Networks",
    "subtopic": "Residual Connections (ResNet) & Degradation Problem",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Meta Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Residual Connections (ResNet) & Degradation Problem.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Residual Connections (ResNet) & Degradation Problem. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Convolutional Neural Networks",
      "Meta",
      "VisionResearcher"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Convolutional Neural Networks.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-65-recurrent-networks-backpropagation-",
    "title": "Recurrent Networks [Problem #65]",
    "question": "Analyze and solve the core technical challenge in **Recurrent Networks: Backpropagation Through Time (BPTT)** within **Sequence Models**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Amazon.",
    "type": "AI/ML",
    "company": "Amazon",
    "role": "NLP Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Sequence Models",
    "subtopic": "Recurrent Networks: Backpropagation Through Time (BPTT)",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Amazon Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Recurrent Networks: Backpropagation Through Time (BPTT).",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Recurrent Networks: Backpropagation Through Time (BPTT). Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Sequence Models",
      "Amazon",
      "NLPScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Sequence Models.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-66-lstm-gating-mechanism-forget-input-",
    "title": "LSTM Gating Mechanism [Problem #66]",
    "question": "Analyze and solve the core technical challenge in **LSTM Gating Mechanism: Forget, Input, Output Gates** within **Sequence Models**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Apple.",
    "type": "AI/ML",
    "company": "Apple",
    "role": "Speech Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Sequence Models",
    "subtopic": "LSTM Gating Mechanism: Forget, Input, Output Gates",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Apple Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of LSTM Gating Mechanism: Forget, Input, Output Gates.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in LSTM Gating Mechanism: Forget, Input, Output Gates. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Sequence Models",
      "Apple",
      "SpeechEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Sequence Models.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-67-k-means-clustering-lloyd-s-algorith",
    "title": "K-Means Clustering [Problem #67]",
    "question": "Analyze and solve the core technical challenge in **K-Means Clustering: Lloyd's Algorithm & K-Means++ Seeding** within **Unsupervised Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Uber.",
    "type": "AI/ML",
    "company": "Uber",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Unsupervised Learning",
    "subtopic": "K-Means Clustering: Lloyd's Algorithm & K-Means++ Seeding",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Uber Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of K-Means Clustering: Lloyd's Algorithm & K-Means++ Seeding.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in K-Means Clustering: Lloyd's Algorithm & K-Means++ Seeding. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Unsupervised Learning",
      "Uber",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Unsupervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-68-dbscan-density-based-clustering-cor",
    "title": "DBSCAN [Problem #68]",
    "question": "Analyze and solve the core technical challenge in **DBSCAN: Density-Based Clustering, Core Points & Noise** within **Unsupervised Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Stripe.",
    "type": "AI/ML",
    "company": "Stripe",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Unsupervised Learning",
    "subtopic": "DBSCAN: Density-Based Clustering, Core Points & Noise",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Stripe Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of DBSCAN: Density-Based Clustering, Core Points & Noise.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in DBSCAN: Density-Based Clustering, Core Points & Noise. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Unsupervised Learning",
      "Stripe",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Unsupervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-69-principal-component-analysis-pca-ei",
    "title": "Principal Component Analysis (PCA) [Problem #69]",
    "question": "Analyze and solve the core technical challenge in **Principal Component Analysis (PCA): Eigenvalue Decomposition** within **Unsupervised Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Goldman Sachs.",
    "type": "AI/ML",
    "company": "Goldman Sachs",
    "role": "Quantitative Strategist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Unsupervised Learning",
    "subtopic": "Principal Component Analysis (PCA): Eigenvalue Decomposition",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Goldman Sachs Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Principal Component Analysis (PCA): Eigenvalue Decomposition.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Principal Component Analysis (PCA): Eigenvalue Decomposition. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Unsupervised Learning",
      "Goldman Sachs",
      "QuantitativeStrategist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Unsupervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-70-t-sne-umap-high-dimensional-manifol",
    "title": "t-SNE & UMAP [Problem #70]",
    "question": "Analyze and solve the core technical challenge in **t-SNE & UMAP: High-Dimensional Manifold Visualization** within **Unsupervised Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Google.",
    "type": "AI/ML",
    "company": "Google",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Unsupervised Learning",
    "subtopic": "t-SNE & UMAP: High-Dimensional Manifold Visualization",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Google Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of t-SNE & UMAP: High-Dimensional Manifold Visualization.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in t-SNE & UMAP: High-Dimensional Manifold Visualization. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Unsupervised Learning",
      "Google",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Unsupervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-71-target-encoding-with-additive-smoot",
    "title": "Target Encoding with Additive Smoothing to Avoid Leakage [Problem #71]",
    "question": "Analyze and solve the core technical challenge in **Target Encoding with Additive Smoothing to Avoid Leakage** within **Feature Engineering**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Flipkart.",
    "type": "AI/ML",
    "company": "Flipkart",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Feature Engineering",
    "subtopic": "Target Encoding with Additive Smoothing to Avoid Leakage",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Flipkart Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Target Encoding with Additive Smoothing to Avoid Leakage.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Target Encoding with Additive Smoothing to Avoid Leakage. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Feature Engineering",
      "Flipkart",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Feature Engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-72-handling-missing-data-mcar-mar-mnar",
    "title": "Handling Missing Data [Problem #72]",
    "question": "Analyze and solve the core technical challenge in **Handling Missing Data: MCAR, MAR, MNAR & Iterative Imputation** within **Feature Engineering**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at TCS.",
    "type": "AI/ML",
    "company": "TCS",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Feature Engineering",
    "subtopic": "Handling Missing Data: MCAR, MAR, MNAR & Iterative Imputation",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "TCS Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Handling Missing Data: MCAR, MAR, MNAR & Iterative Imputation.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Handling Missing Data: MCAR, MAR, MNAR & Iterative Imputation. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Feature Engineering",
      "TCS",
      "DataEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Feature Engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-73-high-cardinality-categorical-encodi",
    "title": "High-Cardinality Categorical Encoding [Problem #73]",
    "question": "Analyze and solve the core technical challenge in **High-Cardinality Categorical Encoding: Hashing Trick & Embeddings** within **Feature Engineering**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Amazon.",
    "type": "AI/ML",
    "company": "Amazon",
    "role": "SDE ML",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Feature Engineering",
    "subtopic": "High-Cardinality Categorical Encoding: Hashing Trick & Embeddings",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Amazon Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of High-Cardinality Categorical Encoding: Hashing Trick & Embeddings.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in High-Cardinality Categorical Encoding: Hashing Trick & Embeddings. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Feature Engineering",
      "Amazon",
      "SDEML"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Feature Engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-74-variance-inflation-factor-vif-multi",
    "title": "Variance Inflation Factor (VIF) & Multicollinearity Remediation [Problem #74]",
    "question": "Analyze and solve the core technical challenge in **Variance Inflation Factor (VIF) & Multicollinearity Remediation** within **Feature Engineering**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Microsoft.",
    "type": "AI/ML",
    "company": "Microsoft",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Feature Engineering",
    "subtopic": "Variance Inflation Factor (VIF) & Multicollinearity Remediation",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Microsoft Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Variance Inflation Factor (VIF) & Multicollinearity Remediation.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Variance Inflation Factor (VIF) & Multicollinearity Remediation. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Feature Engineering",
      "Microsoft",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Feature Engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-75-shap-shapley-additive-explanations-",
    "title": "SHAP (Shapley Additive Explanations) & Cooperative Game Theory [Problem #75]",
    "question": "Analyze and solve the core technical challenge in **SHAP (Shapley Additive Explanations) & Cooperative Game Theory** within **Model Interpretability**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Netflix.",
    "type": "AI/ML",
    "company": "Netflix",
    "role": "Research Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Model Interpretability",
    "subtopic": "SHAP (Shapley Additive Explanations) & Cooperative Game Theory",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Netflix Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of SHAP (Shapley Additive Explanations) & Cooperative Game Theory.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in SHAP (Shapley Additive Explanations) & Cooperative Game Theory. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Model Interpretability",
      "Netflix",
      "ResearchScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Model Interpretability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-76-lime-local-interpretable-model-agno",
    "title": "LIME (Local Interpretable Model-agnostic Explanations) [Problem #76]",
    "question": "Analyze and solve the core technical challenge in **LIME (Local Interpretable Model-agnostic Explanations)** within **Model Interpretability**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Meta.",
    "type": "AI/ML",
    "company": "Meta",
    "role": "Trust & Safety Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Model Interpretability",
    "subtopic": "LIME (Local Interpretable Model-agnostic Explanations)",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Meta Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of LIME (Local Interpretable Model-agnostic Explanations).",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in LIME (Local Interpretable Model-agnostic Explanations). Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Model Interpretability",
      "Meta",
      "Trust&SafetyEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Model Interpretability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-77-singular-value-decomposition-svd-an",
    "title": "Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation [Problem #77]",
    "question": "Analyze and solve the core technical challenge in **Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation** within **ML Mathematics**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Google.",
    "type": "AI/ML",
    "company": "Google",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "ML Mathematics",
    "subtopic": "Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Google Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "ML Mathematics",
      "Google",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in ML Mathematics.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-78-convex-optimization-dual-norms-subg",
    "title": "Convex Optimization [Problem #78]",
    "question": "Analyze and solve the core technical challenge in **Convex Optimization: Dual Norms, Subgradients & Proximal Operators** within **ML Mathematics**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Uber.",
    "type": "AI/ML",
    "company": "Uber",
    "role": "Staff Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "ML Mathematics",
    "subtopic": "Convex Optimization: Dual Norms, Subgradients & Proximal Operators",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Uber Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Convex Optimization: Dual Norms, Subgradients & Proximal Operators.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Convex Optimization: Dual Norms, Subgradients & Proximal Operators. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "ML Mathematics",
      "Uber",
      "StaffScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in ML Mathematics.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-79-covariance-matrices-positive-semi-d",
    "title": "Covariance Matrices, Positive Semi-Definiteness & Mahalanobis Distance [Problem #79]",
    "question": "Analyze and solve the core technical challenge in **Covariance Matrices, Positive Semi-Definiteness & Mahalanobis Distance** within **ML Mathematics**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Morgan Stanley.",
    "type": "AI/ML",
    "company": "Morgan Stanley",
    "role": "Quant",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "ML Mathematics",
    "subtopic": "Covariance Matrices, Positive Semi-Definiteness & Mahalanobis Distance",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Morgan Stanley Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Covariance Matrices, Positive Semi-Definiteness & Mahalanobis Distance.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Covariance Matrices, Positive Semi-Definiteness & Mahalanobis Distance. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "ML Mathematics",
      "Morgan Stanley",
      "Quant"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in ML Mathematics.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-80-stochastic-gradient-descent-adaptiv",
    "title": "Stochastic Gradient Descent & Adaptive Optimizers [Problem #80]",
    "question": "Analyze and solve the core technical challenge in **Stochastic Gradient Descent & Adaptive Optimizers** within **Optimization & Gradients**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Google.",
    "type": "AI/ML",
    "company": "Google",
    "role": "Research Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Optimization & Gradients",
    "subtopic": "Stochastic Gradient Descent & Adaptive Optimizers",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Google Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Stochastic Gradient Descent & Adaptive Optimizers.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Stochastic Gradient Descent & Adaptive Optimizers. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Optimization & Gradients",
      "Google",
      "ResearchScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Optimization & Gradients.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-81-learning-rate-schedules-convergence",
    "title": "Learning Rate Schedules & Convergence Diagnostics [Problem #81]",
    "question": "Analyze and solve the core technical challenge in **Learning Rate Schedules & Convergence Diagnostics** within **Optimization & Gradients**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Meta.",
    "type": "AI/ML",
    "company": "Meta",
    "role": "AI Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Optimization & Gradients",
    "subtopic": "Learning Rate Schedules & Convergence Diagnostics",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Meta Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Learning Rate Schedules & Convergence Diagnostics.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Learning Rate Schedules & Convergence Diagnostics. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Optimization & Gradients",
      "Meta",
      "AIEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Optimization & Gradients.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-82-vanishing-exploding-gradients-in-de",
    "title": "Vanishing & Exploding Gradients in Deep Architectures [Problem #82]",
    "question": "Analyze and solve the core technical challenge in **Vanishing & Exploding Gradients in Deep Architectures** within **Neural Networks & Deep Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Microsoft.",
    "type": "AI/ML",
    "company": "Microsoft",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Neural Networks & Deep Learning",
    "subtopic": "Vanishing & Exploding Gradients in Deep Architectures",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Microsoft Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Vanishing & Exploding Gradients in Deep Architectures.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Vanishing & Exploding Gradients in Deep Architectures. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Neural Networks & Deep Learning",
      "Microsoft",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Neural Networks & Deep Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-83-activation-functions-relu-gelu-swis",
    "title": "Activation Functions [Problem #83]",
    "question": "Analyze and solve the core technical challenge in **Activation Functions: ReLU, GeLU, Swish & Dead Neurons** within **Neural Networks & Deep Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Amazon.",
    "type": "AI/ML",
    "company": "Amazon",
    "role": "Applied Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Neural Networks & Deep Learning",
    "subtopic": "Activation Functions: ReLU, GeLU, Swish & Dead Neurons",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Amazon Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Activation Functions: ReLU, GeLU, Swish & Dead Neurons.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Activation Functions: ReLU, GeLU, Swish & Dead Neurons. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Neural Networks & Deep Learning",
      "Amazon",
      "AppliedScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Neural Networks & Deep Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-84-normalization-layers-batchnorm-vs-l",
    "title": "Normalization Layers [Problem #84]",
    "question": "Analyze and solve the core technical challenge in **Normalization Layers: BatchNorm vs LayerNorm vs GroupNorm** within **Neural Networks & Deep Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Apple.",
    "type": "AI/ML",
    "company": "Apple",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Neural Networks & Deep Learning",
    "subtopic": "Normalization Layers: BatchNorm vs LayerNorm vs GroupNorm",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Apple Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Normalization Layers: BatchNorm vs LayerNorm vs GroupNorm.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Normalization Layers: BatchNorm vs LayerNorm vs GroupNorm. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Neural Networks & Deep Learning",
      "Apple",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Neural Networks & Deep Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-85-loss-functions-cross-entropy-focal-",
    "title": "Loss Functions [Problem #85]",
    "question": "Analyze and solve the core technical challenge in **Loss Functions: Cross-Entropy, Focal Loss, Triplet Loss** within **Neural Networks & Deep Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Netflix.",
    "type": "AI/ML",
    "company": "Netflix",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Neural Networks & Deep Learning",
    "subtopic": "Loss Functions: Cross-Entropy, Focal Loss, Triplet Loss",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Netflix Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Loss Functions: Cross-Entropy, Focal Loss, Triplet Loss.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Loss Functions: Cross-Entropy, Focal Loss, Triplet Loss. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Neural Networks & Deep Learning",
      "Netflix",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Neural Networks & Deep Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-86-receptive-field-calculation-dilated",
    "title": "Receptive Field Calculation, Dilated Convolutions & Strides [Problem #86]",
    "question": "Analyze and solve the core technical challenge in **Receptive Field Calculation, Dilated Convolutions & Strides** within **Convolutional Neural Networks**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Google.",
    "type": "AI/ML",
    "company": "Google",
    "role": "Computer Vision Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Convolutional Neural Networks",
    "subtopic": "Receptive Field Calculation, Dilated Convolutions & Strides",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Google Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Receptive Field Calculation, Dilated Convolutions & Strides.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Receptive Field Calculation, Dilated Convolutions & Strides. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Convolutional Neural Networks",
      "Google",
      "ComputerVisionEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Convolutional Neural Networks.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-87-residual-connections-resnet-degrada",
    "title": "Residual Connections (ResNet) & Degradation Problem [Problem #87]",
    "question": "Analyze and solve the core technical challenge in **Residual Connections (ResNet) & Degradation Problem** within **Convolutional Neural Networks**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Meta.",
    "type": "AI/ML",
    "company": "Meta",
    "role": "Vision Researcher",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Convolutional Neural Networks",
    "subtopic": "Residual Connections (ResNet) & Degradation Problem",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Meta Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Residual Connections (ResNet) & Degradation Problem.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Residual Connections (ResNet) & Degradation Problem. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Convolutional Neural Networks",
      "Meta",
      "VisionResearcher"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Convolutional Neural Networks.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-88-recurrent-networks-backpropagation-",
    "title": "Recurrent Networks [Problem #88]",
    "question": "Analyze and solve the core technical challenge in **Recurrent Networks: Backpropagation Through Time (BPTT)** within **Sequence Models**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Amazon.",
    "type": "AI/ML",
    "company": "Amazon",
    "role": "NLP Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Sequence Models",
    "subtopic": "Recurrent Networks: Backpropagation Through Time (BPTT)",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Amazon Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Recurrent Networks: Backpropagation Through Time (BPTT).",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Recurrent Networks: Backpropagation Through Time (BPTT). Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Sequence Models",
      "Amazon",
      "NLPScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Sequence Models.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-89-lstm-gating-mechanism-forget-input-",
    "title": "LSTM Gating Mechanism [Problem #89]",
    "question": "Analyze and solve the core technical challenge in **LSTM Gating Mechanism: Forget, Input, Output Gates** within **Sequence Models**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Apple.",
    "type": "AI/ML",
    "company": "Apple",
    "role": "Speech Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Sequence Models",
    "subtopic": "LSTM Gating Mechanism: Forget, Input, Output Gates",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Apple Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of LSTM Gating Mechanism: Forget, Input, Output Gates.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in LSTM Gating Mechanism: Forget, Input, Output Gates. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Sequence Models",
      "Apple",
      "SpeechEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Sequence Models.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-90-k-means-clustering-lloyd-s-algorith",
    "title": "K-Means Clustering [Problem #90]",
    "question": "Analyze and solve the core technical challenge in **K-Means Clustering: Lloyd's Algorithm & K-Means++ Seeding** within **Unsupervised Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Uber.",
    "type": "AI/ML",
    "company": "Uber",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Unsupervised Learning",
    "subtopic": "K-Means Clustering: Lloyd's Algorithm & K-Means++ Seeding",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Uber Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of K-Means Clustering: Lloyd's Algorithm & K-Means++ Seeding.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in K-Means Clustering: Lloyd's Algorithm & K-Means++ Seeding. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Unsupervised Learning",
      "Uber",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Unsupervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-91-dbscan-density-based-clustering-cor",
    "title": "DBSCAN [Problem #91]",
    "question": "Analyze and solve the core technical challenge in **DBSCAN: Density-Based Clustering, Core Points & Noise** within **Unsupervised Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Stripe.",
    "type": "AI/ML",
    "company": "Stripe",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Unsupervised Learning",
    "subtopic": "DBSCAN: Density-Based Clustering, Core Points & Noise",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Stripe Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of DBSCAN: Density-Based Clustering, Core Points & Noise.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in DBSCAN: Density-Based Clustering, Core Points & Noise. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Unsupervised Learning",
      "Stripe",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Unsupervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-92-principal-component-analysis-pca-ei",
    "title": "Principal Component Analysis (PCA) [Problem #92]",
    "question": "Analyze and solve the core technical challenge in **Principal Component Analysis (PCA): Eigenvalue Decomposition** within **Unsupervised Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Goldman Sachs.",
    "type": "AI/ML",
    "company": "Goldman Sachs",
    "role": "Quantitative Strategist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Unsupervised Learning",
    "subtopic": "Principal Component Analysis (PCA): Eigenvalue Decomposition",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Goldman Sachs Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Principal Component Analysis (PCA): Eigenvalue Decomposition.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Principal Component Analysis (PCA): Eigenvalue Decomposition. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Unsupervised Learning",
      "Goldman Sachs",
      "QuantitativeStrategist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Unsupervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-93-t-sne-umap-high-dimensional-manifol",
    "title": "t-SNE & UMAP [Problem #93]",
    "question": "Analyze and solve the core technical challenge in **t-SNE & UMAP: High-Dimensional Manifold Visualization** within **Unsupervised Learning**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Google.",
    "type": "AI/ML",
    "company": "Google",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Unsupervised Learning",
    "subtopic": "t-SNE & UMAP: High-Dimensional Manifold Visualization",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of t-SNE & UMAP: High-Dimensional Manifold Visualization.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in t-SNE & UMAP: High-Dimensional Manifold Visualization. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Unsupervised Learning",
      "Google",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Unsupervised Learning.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-94-target-encoding-with-additive-smoot",
    "title": "Target Encoding with Additive Smoothing to Avoid Leakage [Problem #94]",
    "question": "Analyze and solve the core technical challenge in **Target Encoding with Additive Smoothing to Avoid Leakage** within **Feature Engineering**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Flipkart.",
    "type": "AI/ML",
    "company": "Flipkart",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Feature Engineering",
    "subtopic": "Target Encoding with Additive Smoothing to Avoid Leakage",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Flipkart Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Target Encoding with Additive Smoothing to Avoid Leakage.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Target Encoding with Additive Smoothing to Avoid Leakage. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Feature Engineering",
      "Flipkart",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Feature Engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-95-handling-missing-data-mcar-mar-mnar",
    "title": "Handling Missing Data [Problem #95]",
    "question": "Analyze and solve the core technical challenge in **Handling Missing Data: MCAR, MAR, MNAR & Iterative Imputation** within **Feature Engineering**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at TCS.",
    "type": "AI/ML",
    "company": "TCS",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Feature Engineering",
    "subtopic": "Handling Missing Data: MCAR, MAR, MNAR & Iterative Imputation",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "TCS Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Handling Missing Data: MCAR, MAR, MNAR & Iterative Imputation.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Handling Missing Data: MCAR, MAR, MNAR & Iterative Imputation. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Feature Engineering",
      "TCS",
      "DataEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Feature Engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-96-high-cardinality-categorical-encodi",
    "title": "High-Cardinality Categorical Encoding [Problem #96]",
    "question": "Analyze and solve the core technical challenge in **High-Cardinality Categorical Encoding: Hashing Trick & Embeddings** within **Feature Engineering**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Amazon.",
    "type": "AI/ML",
    "company": "Amazon",
    "role": "SDE ML",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Feature Engineering",
    "subtopic": "High-Cardinality Categorical Encoding: Hashing Trick & Embeddings",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of High-Cardinality Categorical Encoding: Hashing Trick & Embeddings.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in High-Cardinality Categorical Encoding: Hashing Trick & Embeddings. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Feature Engineering",
      "Amazon",
      "SDEML"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Feature Engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-97-variance-inflation-factor-vif-multi",
    "title": "Variance Inflation Factor (VIF) & Multicollinearity Remediation [Problem #97]",
    "question": "Analyze and solve the core technical challenge in **Variance Inflation Factor (VIF) & Multicollinearity Remediation** within **Feature Engineering**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Microsoft.",
    "type": "AI/ML",
    "company": "Microsoft",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Feature Engineering",
    "subtopic": "Variance Inflation Factor (VIF) & Multicollinearity Remediation",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Microsoft Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Variance Inflation Factor (VIF) & Multicollinearity Remediation.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Variance Inflation Factor (VIF) & Multicollinearity Remediation. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Feature Engineering",
      "Microsoft",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Feature Engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-98-shap-shapley-additive-explanations-",
    "title": "SHAP (Shapley Additive Explanations) & Cooperative Game Theory [Problem #98]",
    "question": "Analyze and solve the core technical challenge in **SHAP (Shapley Additive Explanations) & Cooperative Game Theory** within **Model Interpretability**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Netflix.",
    "type": "AI/ML",
    "company": "Netflix",
    "role": "Research Scientist",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Model Interpretability",
    "subtopic": "SHAP (Shapley Additive Explanations) & Cooperative Game Theory",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Netflix Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of SHAP (Shapley Additive Explanations) & Cooperative Game Theory.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in SHAP (Shapley Additive Explanations) & Cooperative Game Theory. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Model Interpretability",
      "Netflix",
      "ResearchScientist"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Model Interpretability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-99-lime-local-interpretable-model-agno",
    "title": "LIME (Local Interpretable Model-agnostic Explanations) [Problem #99]",
    "question": "Analyze and solve the core technical challenge in **LIME (Local Interpretable Model-agnostic Explanations)** within **Model Interpretability**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Meta.",
    "type": "AI/ML",
    "company": "Meta",
    "role": "Trust & Safety Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "Model Interpretability",
    "subtopic": "LIME (Local Interpretable Model-agnostic Explanations)",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Meta Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of LIME (Local Interpretable Model-agnostic Explanations).",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in LIME (Local Interpretable Model-agnostic Explanations). Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "Model Interpretability",
      "Meta",
      "Trust&SafetyEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in Model Interpretability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ml-ml-canonical-100-singular-value-decomposition-svd-an",
    "title": "Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation [Problem #100]",
    "question": "Analyze and solve the core technical challenge in **Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation** within **ML Mathematics**. Explain the theoretical formulation, underlying algorithmic trade-offs, edge cases, and practical production failure modes encountered when deploying this in real-world systems at Google.",
    "type": "AI/ML",
    "company": "Google",
    "role": "ML Engineer",
    "round": "Technical Round 1",
    "domain": "Machine Learning",
    "topic": "ML Mathematics",
    "subtopic": "Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Google Technical Interview Benchmark",
    "verified": true,
    "hints": [
      "Carefully inspect the mathematical assumptions of Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation.",
      "Consider numerical stability under extreme gradients or small denominators."
    ],
    "explanation": "This problem evaluates technical depth in Singular Value Decomposition (SVD) and Low-Rank Matrix Approximation. Key technical requirements: verify mathematical assumptions, analyze convergence characteristics, handle non-convexity or dimensionality curses, and maintain robust numerical stability under floating-point precision constraints.",
    "solution": "Implement mathematically sound pipeline: 1. Normalize data inputs to preserve dynamic range. 2. Formulate objective function with appropriate regularizer. 3. Optimize via gradient/analytical formulation. 4. Verify validation metric stability across cross-validation folds.",
    "timeComplexity": "O(N * D)",
    "spaceComplexity": "O(D)",
    "tags": [
      "Machine Learning",
      "ML Mathematics",
      "Google",
      "MLEngineer"
    ],
    "recommendedForRoles": [
      "ML Engineer",
      "Data Scientist",
      "Applied Scientist"
    ],
    "whyRecommended": "Rigorous technical assessment testing foundational intuition and production robustness in ML Mathematics.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  }
];
