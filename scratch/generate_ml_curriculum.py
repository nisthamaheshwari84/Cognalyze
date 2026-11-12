import json

modules_data = [
    {
        "id": "mod_ml_foundations",
        "title": "Module 1: Machine Learning Foundations",
        "description": "Core paradigms, evolution of learning systems, AI vs ML vs DL distinctions, and development lifecycle.",
        "order": 1,
        "topics": [
            ("ml-001-what-is-ml", "What is Machine Learning? Principles & Problem Formulations", [("ml-001-sub-1", "Empirical Risk Minimization vs Rule-Based Programming"), ("ml-001-sub-2", "Inductive Bias and Generalization to Unseen Distributions")]),
            ("ml-002-evolution-of-ml", "Evolution of Machine Learning: Expert Systems to Modern AI", [("ml-002-sub-1", "From Symbolic AI to Statistical Learning"), ("ml-002-sub-2", "Hardware Shifts: Vector Engines, GPUs & Tensor Processing")]),
            ("ml-03-ai-vs-ml-vs-dl", "AI vs ML vs Deep Learning: Taxonomic Boundaries & Nuances", [("ml-03-sub-1", "Hierarchical Relationship: AI > ML > Deep Learning"), ("ml-03-sub-2", "Representation Learning vs Handcrafted Feature Engineering")]),
            ("ml-04-types-of-ml", "Taxonomy of Machine Learning: Feedback & Supervision Signals", [("ml-04-sub-1", "Continuous, Discrete, and Delayed Feedback Signals"), ("ml-04-sub-2", "Online vs Batch Learning Trade-offs")]),
            ("ml-05-supervised-learning", "Supervised Learning Paradigm: Inputs, Targets & Loss Surfaces", [("ml-05-sub-1", "Feature-Target Mapping Formalism: f(X) -> Y"), ("ml-05-sub-2", "Classification vs Regression Loss Function Formulations")]),
            ("ml-06-unsupervised-learning", "Unsupervised Learning Paradigm: Latent Structure & Density", [("ml-06-sub-1", "Finding Patterns in Unlabelled Distributions"), ("ml-06-sub-2", "Manifold Hypothesis and Intrinsic Dimensionality")]),
            ("ml-07-semi-supervised", "Semi-Supervised Learning & Pseudo-Labeling Workflows", [("ml-07-sub-1", "Harnessing Massive Unlabeled Data with Sparse Labels"), ("ml-07-sub-2", "Consistency Regularization and Pseudo-Labeling Thresholds")]),
            ("ml-08-self-supervised", "Self-Supervised Learning: Pretext Tasks & Contrastive Loss", [("ml-08-sub-1", "Masked Modeling and Predictive Pretext Tasks"), ("ml-08-sub-2", "Contrastive Representations & InfoNCE Bounds")]),
            ("ml-09-reinforcement-learning", "Reinforcement Learning Foundations: Agents, Environments & Rewards", [("ml-09-sub-1", "Markov Decision Processes (MDP) & Bellman Optimality"), ("ml-09-sub-2", "Exploration vs Exploitation Trade-off in Agent Trajectories")]),
            ("ml-10-mldlc-lifecycle", "Machine Learning Development Lifecycle (MLDLC)", [("ml-10-sub-1", "Iterative Phases: Framing -> Ingestion -> Model -> Deploy"), ("ml-10-sub-2", "Hidden Technical Debt & Verification Loops in ML Systems")])
        ]
    },
    {
        "id": "mod_ml_math",
        "title": "Module 2: Mathematical Foundations for ML",
        "description": "Linear algebra, matrix decomposition, multivariate calculus, optimization convexity, and probability theory.",
        "order": 2,
        "topics": [
            ("ml-11-linear-algebra", "Linear Algebra for ML: Vector Spaces, Norms & Dot Products", [("ml-11-sub-1", "Euclidean Vector Spaces & Inner Product Spaces"), ("ml-11-sub-2", "L1, L2 and L-infinity Norms as Geometric Penalties")]),
            ("ml-12-vectors-matrices", "Scalars, Vectors, Matrices & High-Dimensional Tensors", [("ml-12-sub-1", "Tensor Rank, Shapes and Contiguous Buffer Strides"), ("ml-12-sub-2", "Row-Major vs Column-Major Linearization in Hardware")]),
            ("ml-13-matrix-operations", "Matrix Operations: Transpose, Inverse, Trace & Determinant", [("ml-13-sub-1", "Invertibility, Full Rank & Singularity Hazards"), ("ml-13-sub-2", "Determinant as Volume Scaling Factor in Linear Transformations")]),
            ("ml-14-matrix-multiplication", "Matrix Multiplication Mechanics & Vectorized Projections", [("ml-14-sub-1", "Row-Column Projections vs Outer Product Linear Combinations"), ("ml-14-sub-2", "BLAS Optimization & Computational Complexity O(N^3)")]),
            ("ml-15-eigenvalues-eigenvectors", "Eigenvalues, Eigenvectors & Spectral Decomposition", [("ml-15-sub-1", "Characteristic Equation: det(A - lambda*I) = 0"), ("ml-15-sub-2", "Principal Axes of Variance and Diagonalization")]),
            ("ml-16-probability-theory", "Probability Theory Fundamentals: Axioms & Sample Spaces", [("ml-16-sub-1", "Kolmogorov Axioms and Probability Measures"), ("ml-16-sub-2", "Random Variables: Discrete PMF vs Continuous PDF")]),
            ("ml-17-conditional-probability", "Conditional Probability, Joint Distributions & Independence", [("ml-17-sub-1", "Product Rule: P(A, B) = P(A|B) * P(B)"), ("ml-17-sub-2", "Statistical Independence vs Covariance/Correlation Zero")]),
            ("ml-18-bayes-theorem", "Bayes' Theorem: Prior, Likelihood, Evidence & Posterior", [("ml-18-sub-1", "Bayesian Updating: Posterior proportional to Likelihood * Prior"), ("ml-18-sub-2", "Maximum A Posteriori (MAP) vs Maximum Likelihood (MLE)")]),
            ("ml-19-probability-distributions", "Probability Distributions in ML: Gaussian, Bernoulli & Poisson", [("ml-19-sub-1", "Gaussian Normal Curve, Mean, Variance & CLT"), ("ml-19-sub-2", "Bernoulli/Binomial for Classification and Poisson for Rates")]),
            ("ml-20-descriptive-statistics", "Descriptive Statistics: Central Tendency, Spread & Skewness", [("ml-20-sub-1", "Mean, Median, Mode & Sensitivity to Outliers"), ("ml-20-sub-2", "Variance, Standard Deviation, IQR and Kurtosis")]),
            ("ml-21-inferential-statistics", "Inferential Statistics: Sampling Distributions & Confidence", [("ml-21-sub-1", "Standard Error of the Mean & Student's t-Distribution"), ("ml-21-sub-2", "Two-Sided Confidence Intervals and Margin of Error")]),
            ("ml-22-calculus-fundamentals", "Multivariate Calculus Fundamentals for Deep Optimization", [("ml-22-sub-1", "Limit Definition of Derivative & Tangent Approximations"), ("ml-22-sub-2", "Local Linearity and Taylor Series Expansion")]),
            ("ml-23-derivatives-gradients", "Derivatives, Gradients and Jacobians in Vector Calculus", [("ml-23-sub-1", "The Gradient Vector as the Direction of Steepest Ascent"), ("ml-23-sub-2", "Jacobian Matrices for Multi-Output Vector Functions")]),
            ("ml-24-partial-derivatives", "Partial Derivatives, Chain Rule & Computational Graphs", [("ml-24-sub-1", "Multi-Variable Chain Rule for Composite Functions"), ("ml-24-sub-2", "Reverse-Mode Automatic Differentiation Mechanics")]),
            ("ml-25-optimization-convexity", "Optimization Fundamentals: Convex Sets, Functions & Minima", [("ml-25-sub-1", "Hessian Matrix Positive Semidefiniteness for Convexity"), ("ml-25-sub-2", "Saddle Points, Vanishing Gradients & Subgradients")])
        ]
    },
    {
        "id": "mod_ml_data_prep",
        "title": "Module 3: Data Preparation & Feature Engineering",
        "description": "Exploratory data analysis, imputation, outlier guards, categorical encodings, scaling, and leakage prevention.",
        "order": 3,
        "topics": [
            ("ml-26-data-collection", "Data Collection & Sourcing Invariants for Production ML", [("ml-26-sub-1", "Data Lineage, Sampling Bias and Representation Guards"), ("ml-26-sub-2", "Point-in-Time Accurate Joins for Historical Training Sets")]),
            ("ml-27-data-understanding", "Data Understanding & Statistical Profiling Pipelines", [("ml-27-sub-1", "Automated Distribution Auditing & Cardinality Profiling"), ("ml-27-sub-2", "Detecting Data Types, Mismatches and Mixed Types")]),
            ("ml-28-eda-workflows", "Exploratory Data Analysis (EDA): Univariate & Bivariate", [("ml-28-sub-1", "Histograms, Boxplots, and Quantile Diagnostics"), ("ml-28-sub-2", "Pairplots, Correlation Heatmaps and Multicollinearity Checks")]),
            ("ml-29-data-cleaning", "Data Cleaning: Deduplication & Structural Remediation", [("ml-29-sub-1", "Exact and Fuzzy Deduplication Invariants"), ("ml-29-sub-2", "String Normalization, Whitespace Stripping & Regex Cleaning")]),
            ("ml-30-missing-values", "Missing Value Treatment: MCAR, MAR, MNAR & Imputation", [("ml-30-sub-1", "Missingness Mechanisms: MCAR vs MAR vs MNAR"), ("ml-30-sub-2", "Median, MICE, KNN and Model-Based Imputation")]),
            ("ml-31-outlier-detection", "Outlier Detection: Z-Score, Tukey IQR & Isolation Forests", [("ml-31-sub-1", "Statistical Outliers (3-Sigma Rule vs 1.5*IQR Fence)"), ("ml-31-sub-2", "Multivariate Outlier Isolation with Tree Ensembles")]),
            ("ml-32-feature-engineering", "Feature Engineering: Domain-Specific Interaction Features", [("ml-32-sub-1", "Ratios, Polynomial Expansions, and Interaction Terms"), ("ml-32-sub-2", "Datetime Feature Extraction (Cyclic Sin/Cos Transforms)")]),
            ("ml-33-feature-selection", "Feature Selection: Filter, Wrapper & Embedded Methods", [("ml-33-sub-1", "Variance Thresholding, Mutual Information & Chi-Square"), ("ml-33-sub-2", "Recursive Feature Elimination (RFE) & L1 Sparsity")]),
            ("ml-34-categorical-encoding", "Categorical Encoding: One-Hot, Ordinal & Target Encoding", [("ml-34-sub-1", "High-Cardinality Dangers with One-Hot Sparsity"), ("ml-34-sub-2", "Out-of-Fold Target Encoding with Bayesian Smoothing")]),
            ("ml-35-feature-scaling", "Feature Scaling: MinMax, Standard, Robust & Normalizer", [("ml-35-sub-1", "Why Distance-Based and Gradient-Based Models Require Scaling"), ("ml-35-sub-2", "Tree-Based Models Invariance to Monotonic Transformations")]),
            ("ml-36-normalization-standardization", "Normalization vs Standardization: Mathematical Distinctions", [("ml-36-sub-1", "Z-Score Standardization: mu=0, sigma=1"), ("ml-36-sub-2", "MinMax Scaling to [0, 1] Range & Sensitivity to Outliers")]),
            ("ml-37-train-test-splitting", "Train/Test Splitting: Random, Stratified & Time-Series", [("ml-37-sub-1", "Stratified K-Fold for Imbalanced Class Distributions"), ("ml-37-sub-2", "Time-Based Rolling Window Splits (Purged & Embargoed)")]),
            ("ml-38-cross-validation", "Cross-Validation Protocols: K-Fold, Repeated & GroupKFold", [("ml-38-sub-1", "K-Fold Bias-Variance Trade-off across Folds"), ("ml-38-sub-2", "GroupKFold to Prevent Subject / Entity Leakage")]),
            ("ml-02-data-leakage-validation", "Data Leakage: Train/Test Split Invariants & Validation", [("ml-02-sub-1", "Pre-split Scaling and Imputation Invariants"), ("ml-02-sub-2", "Target Leakage from Future Event Contamination")])
        ]
    },
    {
        "id": "mod_ml_supervised",
        "title": "Module 4: Supervised Learning",
        "description": "Linear models, regularized regression, classification boundaries, tree-based models, and gradient boosting.",
        "order": 4,
        "topics": [
            ("ml-01-linear-regression-gradient-descent", "Linear Models & Gradient Descent Optimization", [("ml-01-sub-1", "Convex MSE Loss Surface & Gradient Vector Matrix Calculus"), ("ml-01-sub-2", "Batch vs Mini-batch vs Stochastic Gradient Descent")]),
            ("ml-41-multiple-linear-regression", "Multiple Linear Regression & Multicollinearity Diagnostics", [("ml-41-sub-1", "Variance Inflation Factor (VIF) & Condition Numbers"), ("ml-41-sub-2", "P-Values, Adjusted R-Squared & Hypothesis F-Tests")]),
            ("ml-42-polynomial-regression", "Polynomial Regression & Non-linear Curve Fitting", [("ml-42-sub-1", "Degree Hyperparameter & Runaway Overfitting Risk"), ("ml-42-sub-2", "Basis Function Expansions and Numerical Instabilities")]),
            ("ml-43-regularization-theory", "Regularization Theory: L1 vs L2 Geometric Constraints", [("ml-43-sub-1", "L1 Diamond vs L2 Ball Geometries on Contour Lines"), ("ml-43-sub-2", "Why L1 Induces Exact Zero Sparsity for Feature Selection")]),
            ("ml-44-ridge-regression", "Ridge Regression: L2 Regularization & Tikhonov Conditioning", [("ml-44-sub-1", "Closed Form with Penalty: (X^T X + lambda*I)^(-1) X^T y"), ("ml-44-sub-2", "Shrinkage Behavior and Solving Ill-Conditioned Matrices")]),
            ("ml-45-lasso-regression", "Lasso Regression: L1 Regularization & Subgradient Calculus", [("ml-45-sub-1", "Coordinate Descent Optimization for Non-Differentiable L1"), ("ml-45-sub-2", "ElasticNet: Blending L1 and L2 for Collinear Feature Groups")]),
            ("ml-46-logistic-regression", "Logistic Regression & Sigmoid Log-Odds Decision Boundaries", [("ml-46-sub-1", "Sigmoid Activation & Logit Function Link"), ("ml-46-sub-2", "Binary Cross-Entropy Loss & Maximum Likelihood Estimation")]),
            ("ml-47-knn-classifier", "K-Nearest Neighbors (KNN): Distance Metrics & Curse of Dimensionality", [("ml-47-sub-1", "Euclidean, Manhattan and Minkowski Metric Geometries"), ("ml-47-sub-2", "KD-Trees and Ball-Trees for Accelerated Neighbor Search")]),
            ("ml-48-naive-bayes", "Naive Bayes Classifiers: Conditional Independence Assumptions", [("ml-48-sub-1", "Gaussian, Multinomial and Bernoulli Naive Bayes"), ("ml-48-sub-2", "Laplace Smoothing for Zero-Frequency Categorical Tokens")]),
            ("ml-49-decision-trees", "Decision Trees: Recursive Binary Splitting, Gini & Entropy", [("ml-49-sub-1", "Gini Impurity vs Information Gain (Shannon Entropy)"), ("ml-49-sub-2", "Pruning Strategies: Pre-pruning max_depth vs Cost-Complexity CCP")]),
            ("ml-50-random-forests", "Random Forests: Bagging, Bootstrap Samples & Out-of-Bag Error", [("ml-50-sub-1", "Feature Subsampling (max_features=sqrt(p)) for De-correlation"), ("ml-50-sub-2", "Out-of-Bag (OOB) Validation as Free Cross-Validation")]),
            ("ml-51-svm-kernel-trick", "Support Vector Machines (SVM): Maximum Margin & Kernel Trick", [("ml-51-sub-1", "Hard Margin vs Soft Margin (C Hyperparameter & Slack)"), ("ml-51-sub-2", "Radial Basis Function (RBF) Kernel & Mercer Theorem")]),
            ("ml-52-gradient-boosting", "Gradient Tree Boosting: Sequential Residual Optimization", [("ml-52-sub-1", "Boosting Weak Learners by Fitting Negative Gradients"), ("ml-52-sub-2", "Learning Rate Shrinkage and Number of Estimators Trade-off")]),
            ("ml-53-xgboost-lightgbm", "XGBoost & LightGBM: Second-Order Gradients & Histogram Splitting", [("ml-53-sub-1", "Taylor Series Second-Order Hessian Expansion in XGBoost"), ("ml-53-sub-2", "LightGBM Gradient-based One-Side Sampling (GOSS)")]),
            ("ml-54-supervised-applications", "Supervised Learning Applications: Fraud, Churn & Demand", [("ml-54-sub-1", "End-to-End Classification Pipeline: Churn Prediction"), ("ml-54-sub-2", "End-to-End Regression Pipeline: Demand Forecasting")])
        ]
    },
    {
        "id": "mod_ml_unsupervised",
        "title": "Module 5: Unsupervised Learning",
        "description": "Partitioning, density-based clustering, dimensionality reduction, anomaly detection, and clustering validation.",
        "order": 5,
        "topics": [
            ("ml-55-kmeans-clustering", "K-Means Clustering: Lloyd Algorithm, Centroids & K-Means++", [("ml-55-sub-1", "Voronoi Cell Partitioning & Alternating Minimization"), ("ml-55-sub-2", "K-Means++ Probabilistic Seeding to Avoid Local Optima")]),
            ("ml-56-hierarchical-clustering", "Hierarchical Agglomerative Clustering & Dendrograms", [("ml-56-sub-1", "Linkage Criteria: Ward, Single, Complete and Average"), ("ml-56-sub-2", "Cutting Dendrograms & Cophenetic Correlation Invariants")]),
            ("ml-57-dbscan-clustering", "DBSCAN: Density-Based Clustering of Applications with Noise", [("ml-57-sub-1", "Epsilon Radius, MinPts, Core Points and Border Points"), ("ml-57-sub-2", "Arbitrary Shape Cluster Discovery and Robust Noise Handling")]),
            ("ml-58-gmm-em-clustering", "Gaussian Mixture Models (GMM) & Expectation-Maximization", [("ml-58-sub-1", "Soft Clustering Probabilities via Gaussian Components"), ("ml-58-sub-2", "EM Algorithm: E-Step Latent Assignment & M-Step MLE Update")]),
            ("ml-59-pca-svd", "Principal Component Analysis (PCA) & Singular Value Decomposition", [("ml-59-sub-1", "Covariance Matrix Eigen-decomposition vs Direct SVD"), ("ml-59-sub-2", "Explained Variance Ratio & Scree Plot Elbow Selection")]),
            ("ml-60-tsne-umap", "Non-linear Dimensionality Reduction: t-SNE & UMAP Mechanics", [("ml-60-sub-1", "t-SNE Student-t Kernel for Crowding Problem Prevention"), ("ml-60-sub-2", "UMAP Fuzzy Simplicial Sets & Global Structure Preservation")]),
            ("ml-61-anomaly-detection", "Anomaly & Novelty Detection: Isolation Forests & Local Outlier Factor", [("ml-61-sub-1", "Isolation Forest: Random Tree Partition Path Lengths"), ("ml-61-sub-2", "Local Outlier Factor (LOF) Relative Density Ratios")]),
            ("ml-62-clustering-evaluation", "Clustering Evaluation: Silhouette, Davies-Bouldin & Calinski", [("ml-62-sub-1", "Silhouette Coefficient: Inter-cluster vs Intra-cluster Distance"), ("ml-62-sub-2", "Elbow Method Inertia vs Information Criteria (BIC/AIC)")])
        ]
    },
    {
        "id": "mod_ml_evaluation",
        "title": "Module 6: Model Evaluation & Hyperparameter Tuning",
        "description": "Validation metrics, confusion matrices, ROC curves, bias-variance tradeoff, and hyperparameter optimization.",
        "order": 6,
        "topics": [
            ("ml-63-regression-metrics", "Regression Metrics: MAE, MSE, RMSE, MAPE & R-Squared", [("ml-63-sub-1", "L1 Error (MAE) Robustness vs L2 Penalty (MSE/RMSE)"), ("ml-63-sub-2", "R-Squared Baseline Comparison vs Negative R-Squared Scenarios")]),
            ("ml-64-classification-metrics", "Classification Metrics: Accuracy, Balanced Accuracy & Log-Loss", [("ml-64-sub-1", "The Accuracy Paradox in Severe Class Imbalance"), ("ml-64-sub-2", "Cross-Entropy (Log-Loss) as Calibration Measure")]),
            ("ml-65-confusion-matrix", "Confusion Matrix: TP, FP, TN, FN & Cost-Matrix Evaluation", [("ml-65-sub-1", "2x2 Binary Matrix & Multi-Class Confusion Grids"), ("ml-65-sub-2", "Business Cost Matrix: Weighting Type I vs Type II Errors")]),
            ("ml-66-precision-recall", "Precision, Recall & The Precision-Recall Trade-off Curve", [("ml-66-sub-1", "Classification Threshold Sliding Dynamics"), ("ml-66-sub-2", "Average Precision (AP) and PR Curve Area (PR-AUC)")]),
            ("ml-67-f1-score-averaging", "F1 Score, F-Beta & Multi-Class Averaging Protocols", [("ml-67-sub-1", "Harmonic Mean Intuition: Why Arithmetic Mean Fails"), ("ml-67-sub-2", "Macro vs Micro vs Weighted Averaging Mechanics")]),
            ("ml-68-roc-auc-pr-curves", "ROC-AUC Curves: True Positive Rate vs False Positive Rate", [("ml-68-sub-1", "Receiver Operating Characteristic Geometric Interpretation"), ("ml-68-sub-2", "Why ROC-AUC is Misleading in Imbalanced Datasets vs PR-AUC")]),
            ("ml-69-bias-variance-tradeoff", "Bias-Variance Decomposition & Generalization Error Bounds", [("ml-69-sub-1", "Expected Test Error = Bias^2 + Variance + Irreducible Noise"), ("ml-69-sub-2", "Model Complexity Curve and Optimal Capacity Point")]),
            ("ml-70-overfitting-diagnostics", "Overfitting vs Underfitting Diagnostics & Learning Curves", [("ml-70-sub-1", "Plotting Training vs Validation Curves Across Sample Size"), ("ml-70-sub-2", "Remediation Playbook: More Data, Regularization, or Complexity")]),
            ("ml-71-hyperparameter-tuning", "Hyperparameter Optimization: Grid, Random & Bayesian Search", [("ml-71-sub-1", "Curse of Dimensionality in Exhaustive GridSearch"), ("ml-71-sub-2", "Tree-structured Parzen Estimators (TPE / Optuna)")]),
            ("ml-72-model-selection", "Model Selection Protocols & Statistical Significance Tests", [("ml-72-sub-1", "Paired t-test and McNemar's Test on Model Folds"), ("ml-72-sub-2", "Occam's Razor & Minimum Description Length in Selection")]),
            ("ml-73-model-interpretability", "Model Interpretability: Intrinsic vs Post-Hoc Explainability", [("ml-73-sub-1", "White-Box Linear/Tree Models vs Black-Box Ensembles"), ("ml-73-sub-2", "Global Feature Importance vs Local Instance Attribution")])
        ]
    },
    {
        "id": "mod_ml_advanced",
        "title": "Module 7: Advanced Machine Learning & Ensembles",
        "description": "Bagging, boosting, stacking, imbalanced data, SHAP values, time series forecasting, and recommendation systems.",
        "order": 7,
        "topics": [
            ("ml-74-ensemble-learning", "Ensemble Learning Architectures: Voting & Model Blending", [("ml-74-sub-1", "Condorcet Jury Theorem & Diversity of Errors Requirement"), ("ml-74-sub-2", "Hard Voting vs Soft Probability-Weighted Voting")]),
            ("ml-75-bagging-mechanics", "Bootstrap Aggregating (Bagging) Mechanics & Variance Reduction", [("ml-75-sub-1", "Independent Sampling with Replacement from Empirical Distribution"), ("ml-75-sub-2", "Why Bagging Reduces Variance without Increasing Bias")]),
            ("ml-76-boosting-mechanics", "Sequential Boosting Mechanics: Adaptive Weight Updates", [("ml-76-sub-1", "AdaBoost Exponential Loss and Sample Re-weighting"), ("ml-76-sub-2", "Forward Stagewise Additive Modeling")]),
            ("ml-77-stacking-meta-learners", "Stacking Classifiers: Out-of-Fold Predictions & Meta-Learners", [("ml-77-sub-1", "K-Fold Blending to Prevent Target Leakage into Meta-Learner"), ("ml-77-sub-2", "Selecting Diverse Base Learners (Linear + Tree + Distance)")]),
            ("ml-78-imbalanced-datasets", "Imbalanced Datasets: SMOTE, Focal Loss & Cost-Sensitive Learning", [("ml-78-sub-1", "Synthetic Minority Over-sampling Technique (SMOTE) Invariants"), ("ml-78-sub-2", "Focal Loss Dynamically Down-Weighting Easy Negatives")]),
            ("ml-79-shap-feature-importance", "Permutation Feature Importance & SHAP Values (Shapley)", [("ml-79-sub-1", "Permutation Feature Importance: Shuffling Column Invariants"), ("ml-79-sub-2", "Shapley Additive Explanations (SHAP) Game Theoretic Axioms")]),
            ("ml-80-xai-lime-shap", "Explainable AI (XAI): LIME Local Surrogate Modeling", [("ml-80-sub-1", "Local Interpretable Model-agnostic Explanations (LIME)"), ("ml-80-sub-2", "Perturbation Neighborhoods and Interpretable Explanations")]),
            ("ml-81-time-series-forecasting", "Time Series Forecasting: Stationarity, Autocorrelation & ARIMA", [("ml-81-sub-1", "Augmented Dickey-Fuller (ADF) Test for Stationarity"), ("ml-81-sub-2", "ARIMA(p, d, q) Lag Order Selection via ACF / PACF")]),
            ("ml-82-recommendation-systems", "Recommendation Systems: Collaborative Filtering & Matrix Factorization", [("ml-82-sub-1", "User-User and Item-Item Cosine Similarity Baselines"), ("ml-82-sub-2", "Singular Value Decomposition (SVD) for Latent User-Item Factors")]),
            ("ml-83-probability-calibration", "Probability Calibration: Platt Scaling & Isotonic Regression", [("ml-83-sub-1", "Reliability Diagrams (Calibration Curves)"), ("ml-83-sub-2", "Platt Logistic Scaling vs Non-parametric Isotonic Fits")]),
            ("ml-84-advanced-optimization", "Advanced Constrained Optimization in Machine Learning", [("ml-84-sub-1", "Lagrange Multipliers and KKT Conditions in SVMs"), ("ml-84-sub-2", "Coordinate Descent, Proximal Gradients & Newton-Raphson")])
        ]
    },
    {
        "id": "mod_ml_engineering",
        "title": "Module 8: Practical ML Engineering & Production",
        "description": "Scikit-learn pipelines, experiment tracking, serialization, serving APIs, drift monitoring, and retraining.",
        "order": 8,
        "topics": [
            ("ml-85-sklearn-pipelines", "Scikit-Learn Pipeline Construction: Custom Transformers & ColumnTransformer", [("ml-85-sub-1", "BaseEstimator and TransformerMixin Interface Contracts"), ("ml-85-sub-2", "ColumnTransformer for Heterogeneous Numerical/Categorical Streams")]),
            ("ml-86-experiment-tracking", "Experiment Tracking with MLflow: Parameters, Metrics & Artifacts", [("ml-86-sub-1", "Reproducibility: Logging Git Commits, Seeds & Artifacts"), ("ml-86-sub-2", "Model Registry Lifecycle: Staging -> Production Transitions")]),
            ("ml-87-model-serialization", "Model Serialization: Pickle, Joblib & ONNX Interoperability", [("ml-87-sub-1", "Security Risks of Untrusted Python Pickle Deserialization"), ("ml-87-sub-2", "Open Neural Network Exchange (ONNX) Cross-Platform Execution")]),
            ("ml-88-model-serving-apis", "Model Serving Architectures: FastAPI Microservices & Triton", [("ml-88-sub-1", "Building Low-Latency Pydantic Inference Endpoints"), ("ml-88-sub-2", "Triton & TorchServe Dynamic Batching and Concurrency")]),
            ("ml-89-inference-architectures", "Real-Time vs Batch Inference Pipelines: Design Trade-offs", [("ml-89-sub-1", "P99 Latency Budgets for Real-Time Online Scoring"), ("ml-89-sub-2", "High-Throughput Offline Batch Prediction Jobs on Spark")]),
            ("ml-90-model-monitoring", "Production Model Monitoring: Latency, Throughput & Data Quality", [("ml-90-sub-1", "Prometheus & Grafana Telemetry for ML API Endpoints"), ("ml-90-sub-2", "Missing Input and Out-of-Range Value Interceptors")]),
            ("ml-91-drift-detection", "Concept Drift vs Covariate Shift Detection in Production", [("ml-91-sub-1", "Two-Sample Kolmogorov-Smirnov (KS) Feature Drift Test"), ("ml-91-sub-2", "Population Stability Index (PSI) Thresholding (> 0.2 Drift Alert)")]),
            ("ml-92-data-drift-gates", "Data Quality & Schema Drift Gates for Production Ingestion", [("ml-92-sub-1", "Great Expectations Declarative Schema Assertions"), ("ml-92-sub-2", "Automated Circuit Breakers Blocking Corrupted Inferences")]),
            ("ml-93-automated-retraining", "Automated Continuous Training (CT) & Shadow Deployments", [("ml-93-sub-1", "Triggering Retraining Pipelines via Cron, Volume or Drift"), ("ml-93-sub-2", "Shadow (Dark) Traffic Evaluation vs Live Production Model")]),
            ("ml-94-docker-ml-services", "Containerization & Docker for Reproducible ML Microservices", [("ml-94-sub-1", "Multi-Stage Dockerfiles for Python C-Extension Dependencies"), ("ml-94-sub-2", "Non-Root Security and Resource Capping in Kubernetes")]),
            ("ml-95-production-ml-project", "End-to-End Production ML Capstone Project", [("ml-95-sub-1", "Architecting Full Pipeline: Ingest -> Train -> Test -> Serve -> Drift"), ("ml-95-sub-2", "Production Incident Triage & Automated Rollback Runbook")])
        ]
    }
]

print("Total modules:", len(modules_data))
total_topics = sum(len(m["topics"]) for m in modules_data)
print("Total topics in ML curriculum:", total_topics)
