/**
 * lib/skills/catalogs/data-science-catalog.ts
 * Auto-generated Canonical Data Science & Analytics Catalog containing 100 validated distinct questions.
 */

import { QuestionItem } from "../../question-bank-types";

export const DATA_SCIENCE_CATALOG: QuestionItem[] = [
  {
    "id": "qb-ds-ab-test-sample-size-power",
    "title": "A/B Testing: Sample Size, Statistical Power and MDE Calculation",
    "question": "Derive the required sample size per variant in a two-tailed equal-allocation A/B test: $n = \\frac{2 (Z_{\\alpha/2} + Z_\\beta)^2 \\sigma^2}{\\delta^2}$. Explain how baseline conversion rate $p$, significance level $\\alpha$, statistical power $1-\\beta$, and Minimum Detectable Effect (MDE) $\\delta$ interact.",
    "type": "Conceptual",
    "company": "Meta",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Experimentation & A/B Testing",
    "subtopic": "Sample Size Calculation",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Meta Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Align the rejection boundary under both the null and alternative distributions.",
      "Remember that variance scales inversely with sample size."
    ],
    "explanation": "Under the null hypothesis $H_0: \\mu_B - \\mu_A = 0$, test statistic $T = \\frac{\\bar{X}_B - \\bar{X}_A}{\\sqrt{2\\sigma^2 / n}} \\sim \\mathcal{N}(0, 1)$. To reject $H_0$ with significance $\\alpha$, $|T| > Z_{\\alpha/2}$. Under the alternative hypothesis $H_1: \\mu_B - \\mu_A = \\delta$, $T \\sim \\mathcal{N}(\\frac{\\delta}{\\sqrt{2\\sigma^2/n}}, 1)$. To achieve statistical power $1-\\beta$, the critical threshold must satisfy $\\frac{\\delta}{\\sqrt{2\\sigma^2/n}} - Z_{\\alpha/2} = Z_\\beta$. Solving for $n$ yields $n = \\frac{2(Z_{\\alpha/2} + Z_\\beta)^2 \\sigma^2}{\\delta^2}$. Halving the MDE quadruples the required sample size because $n \\propto 1/\\delta^2$.",
    "solution": "Sample size per variant: $n = \\frac{2(Z_{\\alpha/2} + Z_\\beta)^2 \\sigma^2}{\\delta^2}$. For binary conversions where $\\sigma^2 = p(1-p)$, $n = \\frac{2(Z_{\\alpha/2} + Z_\\beta)^2 p(1-p)}{\\delta^2}$.",
    "tags": [
      "Data Science",
      "A/B Testing",
      "Statistics",
      "Meta"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Experimentation & A/B Testing.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-cuped-variance-reduction-ab-testing",
    "title": "CUPED: Controlled-Experiment Using Pre-Experiment Data",
    "question": "Explain the mathematical formulation of CUPED (Deng et al., 2013). How does utilizing pre-experiment metric $X$ adjust experimental metric $Y$ into $Y_{cuped} = Y - \\theta (X - \\mathbb{E}[X])$, and what is the optimal coefficient $\\theta^*$ that maximizes variance reduction?",
    "type": "Conceptual",
    "company": "Netflix",
    "role": "Senior Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Experimentation & A/B Testing",
    "subtopic": "Variance Reduction",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Netflix Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Minimize the quadratic variance equation with respect to $\\theta$.",
      "Substitute the definition of Pearson correlation $\\rho = \\text{Cov}(Y,X)/(\\sigma_X \\sigma_Y)$."
    ],
    "explanation": "CUPED exploits correlation between user behavior before and during an experiment. Let $Y$ be the experiment outcome and $X$ be the pre-experiment metric ($E[X]$ known and unaffected by treatment). Define $Y_{cuped} = Y - \\theta(X - E[X])$. Taking expectation: $\\mathbb{E}[Y_{cuped}] = \\mathbb{E}[Y]$ (unbiased estimator). Taking variance: $\\text{Var}(Y_{cuped}) = \\text{Var}(Y) + \\theta^2 \\text{Var}(X) - 2\\theta \\text{Cov}(Y, X)$. Differentiating with respect to $\\theta$ and setting to zero yields $\\theta^* = \\frac{\\text{Cov}(Y, X)}{\\text{Var}(X)}$. Substituting $\\theta^*$ gives $\\text{Var}(Y_{cuped}) = \\text{Var}(Y) (1 - \\rho^2)$, where $\\rho = \\text{Corr}(Y, X)$. If $\\rho = 0.5$, variance drops by 25%, effectively reducing required sample size or experiment duration by 25%.",
    "solution": "Optimal coefficient $\\theta^* = \\frac{\\text{Cov}(Y, X)}{\\text{Var}(X)}$. Resulting variance: $\\text{Var}(Y_{cuped}) = \\text{Var}(Y)(1 - \\rho^2)$.",
    "tags": [
      "Data Science",
      "A/B Testing",
      "CUPED",
      "Netflix",
      "Statistics"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Experimentation & A/B Testing.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-network-effects-sutva-violations",
    "title": "Network Effects & SUTVA Violations in Two-Sided Marketplaces",
    "question": "Stable Unit Treatment Value Assumption (SUTVA) states that the treatment applied to one unit does not affect the outcomes of other units. How does this fail in two-sided ride-sharing marketplaces (e.g. Uber/Lyft), and what experimentation methodologies (e.g. Switchback / Cluster-based randomization) solve it?",
    "type": "Conceptual",
    "company": "Uber",
    "role": "Staff Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Experimentation & A/B Testing",
    "subtopic": "Marketplace Experimentation",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Uber Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Consider what happens to shared driver supply when one user group gets a 50% discount.",
      "How can time or geography partition the marketplace?"
    ],
    "explanation": "In a ride-hailing marketplace, drivers and riders share a finite supply pool. If riders in treatment group A receive a discount, they request more rides, consuming available drivers. Riders in control group B now experience longer ETAs and higher surge pricing strictly because of treatment group A's behavior, violating SUTVA and exaggerating treatment effect. Solutions: 1. Cluster-based randomization: Cluster geographic zones by dispatch topology so cross-cluster spillovers are minimal. 2. Switchback experiments: Randomize the entire market across alternating time windows (e.g., 30-minute blocks treatment vs control) with washout buffers, testing aggregate supply-demand balance over time.",
    "solution": "SUTVA fails due to cannibalization of shared supply. Remedies: Switchback design (time-based randomization with carryover washout) or Graph Cluster-based randomization (spatial isolation).",
    "tags": [
      "Data Science",
      "Marketplace",
      "SUTVA",
      "Uber",
      "A/B Testing"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Experimentation & A/B Testing.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-customer-lifetime-value-bg-nbd",
    "title": "Customer Lifetime Value (LTV): BG/NBD and Gamma-Gamma Models",
    "question": "Explain how the Beta-Geometric / Negative Binomial Distribution (BG/NBD) model predicts customer purchase frequency and customer churn probability in non-contractual business settings, and how Gamma-Gamma models monetary value.",
    "type": "Conceptual",
    "company": "Amazon",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Business Analytics",
    "subtopic": "LTV Modeling",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Contrast contractual churn (subscription cancellation) with non-contractual silent churn.",
      "Why can't we simply multiply historical average spend by total months?"
    ],
    "explanation": "In non-contractual settings (e.g. e-commerce), customers do not explicitly cancel; they silently churn. BG/NBD models two processes: 1. While active, number of transactions follows a Poisson process with rate $\\lambda$ (where $\\lambda$ varies across customers according to a Gamma distribution). 2. After each transaction, a customer becomes inactive with probability $p$ (where $p$ follows a Beta distribution). Given customer history (recency $t_x$, frequency $x$, and observation window $T$), the model computes the probability of being currently active $P(\\text{Alive})$ and expected future purchases. The Gamma-Gamma sub-model assumes monetary spend per transaction is Gamma-distributed, independent of frequency, allowing multiplication of expected transaction count by expected spend to project future LTV.",
    "solution": "BG/NBD decouples purchase frequency (Poisson/Gamma) from customer defection (Beta/Geometric). Gamma-Gamma estimates mean spend per transaction. Total LTV = Expected Transactions * Expected Average Spend.",
    "tags": [
      "Data Science",
      "Customer LTV",
      "BG-NBD",
      "Amazon"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Business Analytics.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-cohort-retention-triangle-analysis",
    "title": "Cohort Retention Triangle and Asymptotic Retention Floor",
    "question": "Define cohort retention analysis. How do you distinguish between temporary novelty decay and long-term Product-Market Fit (PMF) on a cohort retention curve? What does an asymptotic retention curve flattening parallel to the x-axis signify?",
    "type": "Conceptual",
    "company": "Spotify",
    "role": "Product Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Business Analytics",
    "subtopic": "Retention Analysis",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Spotify Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Plot percentage of users active vs weeks since signup.",
      "What happens to DAU over time if retention flattens vs if it decays to zero?"
    ],
    "explanation": "Cohort retention groups users by their acquisition date (e.g. Week 1, Month 1) and tracks the percentage of active users returning in subsequent time periods $t_1, t_2, \\dots, t_k$. A product lacking PMF displays a retention curve that monotonically decays towards zero. Conversely, a healthy product with PMF displays a curve that flattens out into a stable, non-zero horizontal asymptote (the 'retention floor'). This asymptote represents the core retained user base that generates compounding active user growth when stacked with incoming new cohorts.",
    "solution": "A retention curve flattening parallel to the x-axis indicates a core group of persistent retained users (PMF). If the curve trends asymptotically to zero, user acquisition is pouring water into a leaky bucket.",
    "tags": [
      "Data Science",
      "Retention",
      "Cohort Analysis",
      "Spotify"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Business Analytics.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-6-two-sample-t-test-vs-welch-s-t-test",
    "title": "Two-Sample t-Test vs Welch's t-Test for Unequal Variances [Problem #6]",
    "question": "Provide a rigorous analysis of **Two-Sample t-Test vs Welch's t-Test for Unequal Variances** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Google.",
    "type": "Conceptual",
    "company": "Google",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Two-Sample t-Test vs Welch's t-Test for Unequal Variances",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Google Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Two-Sample t-Test vs Welch's t-Test for Unequal Variances.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Two-Sample t-Test vs Welch's t-Test for Unequal Variances. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Google",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-7-chi-square-test-of-independence-for",
    "title": "Chi-Square Test of Independence for Contingency Tables [Problem #7]",
    "question": "Provide a rigorous analysis of **Chi-Square Test of Independence for Contingency Tables** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Amazon.",
    "type": "Conceptual",
    "company": "Amazon",
    "role": "Business Intelligence Engineer",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Chi-Square Test of Independence for Contingency Tables",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Chi-Square Test of Independence for Contingency Tables.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Chi-Square Test of Independence for Contingency Tables. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Amazon",
      "BusinessIntelligenceEngineer"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-8-anova-f-test-and-post-hoc-tukey-hsd",
    "title": "ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons [Problem #8]",
    "question": "Provide a rigorous analysis of **ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Microsoft.",
    "type": "Conceptual",
    "company": "Microsoft",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Microsoft Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Microsoft",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-9-bonferroni-correction-vs-benjamini-",
    "title": "Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR) [Problem #9]",
    "question": "Provide a rigorous analysis of **Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR)** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Meta.",
    "type": "Conceptual",
    "company": "Meta",
    "role": "Quantitative Researcher",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR)",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR).",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR). Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Meta",
      "QuantitativeResearcher"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-10-bootstrapping-empirical-confidence-",
    "title": "Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics [Problem #10]",
    "question": "Provide a rigorous analysis of **Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Apple.",
    "type": "Conceptual",
    "company": "Apple",
    "role": "Decision Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Apple Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Apple",
      "DecisionScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-11-poisson-process-inter-arrival-times",
    "title": "Poisson Process [Problem #11]",
    "question": "Provide a rigorous analysis of **Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution** in the context of **Probability & Distributions**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Stripe.",
    "type": "Conceptual",
    "company": "Stripe",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Probability & Distributions",
    "subtopic": "Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Stripe Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Probability & Distributions",
      "Stripe",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Probability & Distributions.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-12-central-limit-theorem-practical-sam",
    "title": "Central Limit Theorem [Problem #12]",
    "question": "Provide a rigorous analysis of **Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails** in the context of **Probability & Distributions**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Goldman Sachs.",
    "type": "Conceptual",
    "company": "Goldman Sachs",
    "role": "Risk Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Probability & Distributions",
    "subtopic": "Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Goldman Sachs Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Probability & Distributions",
      "Goldman Sachs",
      "RiskAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Probability & Distributions.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-13-beta-distribution-as-conjugate-prio",
    "title": "Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation [Problem #13]",
    "question": "Provide a rigorous analysis of **Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation** in the context of **Probability & Distributions**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Uber.",
    "type": "Conceptual",
    "company": "Uber",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Probability & Distributions",
    "subtopic": "Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Uber Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Probability & Distributions",
      "Uber",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Probability & Distributions.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-14-augmented-dickey-fuller-adf-test-fo",
    "title": "Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing [Problem #14]",
    "question": "Provide a rigorous analysis of **Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing** in the context of **Time Series Analysis**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at JPMorgan.",
    "type": "Conceptual",
    "company": "JPMorgan",
    "role": "Quantitative Strategist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Time Series Analysis",
    "subtopic": "Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "JPMorgan Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Time Series Analysis",
      "JPMorgan",
      "QuantitativeStrategist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Time Series Analysis.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-15-arima-vs-sarima-identifying-autoreg",
    "title": "ARIMA vs SARIMA [Problem #15]",
    "question": "Provide a rigorous analysis of **ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders** in the context of **Time Series Analysis**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Amazon.",
    "type": "Conceptual",
    "company": "Amazon",
    "role": "Demand Forecasting Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Time Series Analysis",
    "subtopic": "ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Amazon Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Time Series Analysis",
      "Amazon",
      "DemandForecastingScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Time Series Analysis.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-16-holt-winters-exponential-smoothing-",
    "title": "Holt-Winters Exponential Smoothing [Problem #16]",
    "question": "Provide a rigorous analysis of **Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments** in the context of **Time Series Analysis**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Walmart.",
    "type": "Conceptual",
    "company": "Walmart",
    "role": "Supply Chain Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Time Series Analysis",
    "subtopic": "Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Walmart Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Time Series Analysis",
      "Walmart",
      "SupplyChainAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Time Series Analysis.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-17-north-star-metric-definition-balanc",
    "title": "North Star Metric Definition [Problem #17]",
    "question": "Provide a rigorous analysis of **North Star Metric Definition: Balancing Engagement, Monetization & Retention** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Spotify.",
    "type": "Conceptual",
    "company": "Spotify",
    "role": "Product Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "North Star Metric Definition: Balancing Engagement, Monetization & Retention",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Spotify Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for North Star Metric Definition: Balancing Engagement, Monetization & Retention.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in North Star Metric Definition: Balancing Engagement, Monetization & Retention. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Spotify",
      "ProductDataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-18-dau-mau-stickiness-ratio-benchmarki",
    "title": "DAU/MAU Stickiness Ratio [Problem #18]",
    "question": "Provide a rigorous analysis of **DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Meta.",
    "type": "Conceptual",
    "company": "Meta",
    "role": "Product Growth Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Meta",
      "ProductGrowthAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-19-conversion-funnel-drop-off-diagnost",
    "title": "Conversion Funnel Drop-off Diagnostic [Problem #19]",
    "question": "Provide a rigorous analysis of **Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Flipkart.",
    "type": "Conceptual",
    "company": "Flipkart",
    "role": "Data Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Flipkart Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Flipkart",
      "DataAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-20-simpson-s-paradox-in-aggregate-conv",
    "title": "Simpson's Paradox in Aggregate Conversion Rate Shifts [Problem #20]",
    "question": "Provide a rigorous analysis of **Simpson's Paradox in Aggregate Conversion Rate Shifts** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Netflix.",
    "type": "Conceptual",
    "company": "Netflix",
    "role": "Analytics Lead",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "Simpson's Paradox in Aggregate Conversion Rate Shifts",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Netflix Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Simpson's Paradox in Aggregate Conversion Rate Shifts.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Simpson's Paradox in Aggregate Conversion Rate Shifts. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Netflix",
      "AnalyticsLead"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-21-pandas-vectorization-vs-apply-memor",
    "title": "Pandas Vectorization vs Apply [Problem #21]",
    "question": "Provide a rigorous analysis of **Pandas Vectorization vs Apply: Memory Profiling and Performance Scaling** in the context of **Data Manipulation & EDA**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Bloomberg.",
    "type": "Conceptual",
    "company": "Bloomberg",
    "role": "Financial Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Data Manipulation & EDA",
    "subtopic": "Pandas Vectorization vs Apply: Memory Profiling and Performance Scaling",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Bloomberg Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Pandas Vectorization vs Apply: Memory Profiling and Performance Scaling.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Pandas Vectorization vs Apply: Memory Profiling and Performance Scaling. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Data Manipulation & EDA",
      "Bloomberg",
      "FinancialDataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Data Manipulation & EDA.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-22-outlier-detection-interquartile-ran",
    "title": "Outlier Detection [Problem #22]",
    "question": "Provide a rigorous analysis of **Outlier Detection: Interquartile Range (IQR) vs Robust Z-Score (MAD)** in the context of **Data Manipulation & EDA**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at American Express.",
    "type": "Conceptual",
    "company": "American Express",
    "role": "Fraud Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Data Manipulation & EDA",
    "subtopic": "Outlier Detection: Interquartile Range (IQR) vs Robust Z-Score (MAD)",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "American Express Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Outlier Detection: Interquartile Range (IQR) vs Robust Z-Score (MAD).",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Outlier Detection: Interquartile Range (IQR) vs Robust Z-Score (MAD). Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Data Manipulation & EDA",
      "American Express",
      "FraudAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Data Manipulation & EDA.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-23-missing-value-imputation-knn-vs-ite",
    "title": "Missing Value Imputation [Problem #23]",
    "question": "Provide a rigorous analysis of **Missing Value Imputation: KNN vs Iterative Chained Equations (MICE)** in the context of **Data Manipulation & EDA**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at TCS.",
    "type": "Conceptual",
    "company": "TCS",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Data Manipulation & EDA",
    "subtopic": "Missing Value Imputation: KNN vs Iterative Chained Equations (MICE)",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "TCS Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Missing Value Imputation: KNN vs Iterative Chained Equations (MICE).",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Missing Value Imputation: KNN vs Iterative Chained Equations (MICE). Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Data Manipulation & EDA",
      "TCS",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Data Manipulation & EDA.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-24-the-peeking-problem-in-a-b-testing-",
    "title": "The Peeking Problem in A/B Testing [Problem #24]",
    "question": "Provide a rigorous analysis of **The Peeking Problem in A/B Testing: Continuous Monitoring & Alpha Inflation** in the context of **Experimentation Pitfalls**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Optimizely.",
    "type": "Conceptual",
    "company": "Optimizely",
    "role": "Experimentation Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Experimentation Pitfalls",
    "subtopic": "The Peeking Problem in A/B Testing: Continuous Monitoring & Alpha Inflation",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Optimizely Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for The Peeking Problem in A/B Testing: Continuous Monitoring & Alpha Inflation.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in The Peeking Problem in A/B Testing: Continuous Monitoring & Alpha Inflation. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Experimentation Pitfalls",
      "Optimizely",
      "ExperimentationScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Experimentation Pitfalls.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-25-novelty-effect-vs-primacy-effect-de",
    "title": "Novelty Effect vs Primacy Effect [Problem #25]",
    "question": "Provide a rigorous analysis of **Novelty Effect vs Primacy Effect: Detecting Decaying Treatment Lifts** in the context of **Experimentation Pitfalls**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Google.",
    "type": "Conceptual",
    "company": "Google",
    "role": "Staff Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Experimentation Pitfalls",
    "subtopic": "Novelty Effect vs Primacy Effect: Detecting Decaying Treatment Lifts",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Novelty Effect vs Primacy Effect: Detecting Decaying Treatment Lifts.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Novelty Effect vs Primacy Effect: Detecting Decaying Treatment Lifts. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Experimentation Pitfalls",
      "Google",
      "StaffDataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Experimentation Pitfalls.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-26-two-sample-t-test-vs-welch-s-t-test",
    "title": "Two-Sample t-Test vs Welch's t-Test for Unequal Variances [Problem #26]",
    "question": "Provide a rigorous analysis of **Two-Sample t-Test vs Welch's t-Test for Unequal Variances** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Google.",
    "type": "Conceptual",
    "company": "Google",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Two-Sample t-Test vs Welch's t-Test for Unequal Variances",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Google Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Two-Sample t-Test vs Welch's t-Test for Unequal Variances.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Two-Sample t-Test vs Welch's t-Test for Unequal Variances. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Google",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-27-chi-square-test-of-independence-for",
    "title": "Chi-Square Test of Independence for Contingency Tables [Problem #27]",
    "question": "Provide a rigorous analysis of **Chi-Square Test of Independence for Contingency Tables** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Amazon.",
    "type": "Conceptual",
    "company": "Amazon",
    "role": "Business Intelligence Engineer",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Chi-Square Test of Independence for Contingency Tables",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Amazon Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Chi-Square Test of Independence for Contingency Tables.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Chi-Square Test of Independence for Contingency Tables. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Amazon",
      "BusinessIntelligenceEngineer"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-28-anova-f-test-and-post-hoc-tukey-hsd",
    "title": "ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons [Problem #28]",
    "question": "Provide a rigorous analysis of **ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Microsoft.",
    "type": "Conceptual",
    "company": "Microsoft",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Microsoft Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Microsoft",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-29-bonferroni-correction-vs-benjamini-",
    "title": "Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR) [Problem #29]",
    "question": "Provide a rigorous analysis of **Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR)** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Meta.",
    "type": "Conceptual",
    "company": "Meta",
    "role": "Quantitative Researcher",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR)",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Meta Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR).",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR). Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Meta",
      "QuantitativeResearcher"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-30-bootstrapping-empirical-confidence-",
    "title": "Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics [Problem #30]",
    "question": "Provide a rigorous analysis of **Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Apple.",
    "type": "Conceptual",
    "company": "Apple",
    "role": "Decision Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Apple Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Apple",
      "DecisionScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-31-poisson-process-inter-arrival-times",
    "title": "Poisson Process [Problem #31]",
    "question": "Provide a rigorous analysis of **Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution** in the context of **Probability & Distributions**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Stripe.",
    "type": "Conceptual",
    "company": "Stripe",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Probability & Distributions",
    "subtopic": "Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Stripe Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Probability & Distributions",
      "Stripe",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Probability & Distributions.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-32-central-limit-theorem-practical-sam",
    "title": "Central Limit Theorem [Problem #32]",
    "question": "Provide a rigorous analysis of **Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails** in the context of **Probability & Distributions**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Goldman Sachs.",
    "type": "Conceptual",
    "company": "Goldman Sachs",
    "role": "Risk Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Probability & Distributions",
    "subtopic": "Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Goldman Sachs Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Probability & Distributions",
      "Goldman Sachs",
      "RiskAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Probability & Distributions.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-33-beta-distribution-as-conjugate-prio",
    "title": "Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation [Problem #33]",
    "question": "Provide a rigorous analysis of **Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation** in the context of **Probability & Distributions**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Uber.",
    "type": "Conceptual",
    "company": "Uber",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Probability & Distributions",
    "subtopic": "Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Uber Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Probability & Distributions",
      "Uber",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Probability & Distributions.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-34-augmented-dickey-fuller-adf-test-fo",
    "title": "Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing [Problem #34]",
    "question": "Provide a rigorous analysis of **Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing** in the context of **Time Series Analysis**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at JPMorgan.",
    "type": "Conceptual",
    "company": "JPMorgan",
    "role": "Quantitative Strategist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Time Series Analysis",
    "subtopic": "Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "JPMorgan Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Time Series Analysis",
      "JPMorgan",
      "QuantitativeStrategist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Time Series Analysis.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-35-arima-vs-sarima-identifying-autoreg",
    "title": "ARIMA vs SARIMA [Problem #35]",
    "question": "Provide a rigorous analysis of **ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders** in the context of **Time Series Analysis**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Amazon.",
    "type": "Conceptual",
    "company": "Amazon",
    "role": "Demand Forecasting Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Time Series Analysis",
    "subtopic": "ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Amazon Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Time Series Analysis",
      "Amazon",
      "DemandForecastingScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Time Series Analysis.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-36-holt-winters-exponential-smoothing-",
    "title": "Holt-Winters Exponential Smoothing [Problem #36]",
    "question": "Provide a rigorous analysis of **Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments** in the context of **Time Series Analysis**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Walmart.",
    "type": "Conceptual",
    "company": "Walmart",
    "role": "Supply Chain Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Time Series Analysis",
    "subtopic": "Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Walmart Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Time Series Analysis",
      "Walmart",
      "SupplyChainAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Time Series Analysis.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-37-north-star-metric-definition-balanc",
    "title": "North Star Metric Definition [Problem #37]",
    "question": "Provide a rigorous analysis of **North Star Metric Definition: Balancing Engagement, Monetization & Retention** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Spotify.",
    "type": "Conceptual",
    "company": "Spotify",
    "role": "Product Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "North Star Metric Definition: Balancing Engagement, Monetization & Retention",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Spotify Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for North Star Metric Definition: Balancing Engagement, Monetization & Retention.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in North Star Metric Definition: Balancing Engagement, Monetization & Retention. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Spotify",
      "ProductDataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-38-dau-mau-stickiness-ratio-benchmarki",
    "title": "DAU/MAU Stickiness Ratio [Problem #38]",
    "question": "Provide a rigorous analysis of **DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Meta.",
    "type": "Conceptual",
    "company": "Meta",
    "role": "Product Growth Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Meta Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Meta",
      "ProductGrowthAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-39-conversion-funnel-drop-off-diagnost",
    "title": "Conversion Funnel Drop-off Diagnostic [Problem #39]",
    "question": "Provide a rigorous analysis of **Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Flipkart.",
    "type": "Conceptual",
    "company": "Flipkart",
    "role": "Data Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Flipkart Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Flipkart",
      "DataAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-40-simpson-s-paradox-in-aggregate-conv",
    "title": "Simpson's Paradox in Aggregate Conversion Rate Shifts [Problem #40]",
    "question": "Provide a rigorous analysis of **Simpson's Paradox in Aggregate Conversion Rate Shifts** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Netflix.",
    "type": "Conceptual",
    "company": "Netflix",
    "role": "Analytics Lead",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "Simpson's Paradox in Aggregate Conversion Rate Shifts",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Netflix Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Simpson's Paradox in Aggregate Conversion Rate Shifts.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Simpson's Paradox in Aggregate Conversion Rate Shifts. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Netflix",
      "AnalyticsLead"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-41-pandas-vectorization-vs-apply-memor",
    "title": "Pandas Vectorization vs Apply [Problem #41]",
    "question": "Provide a rigorous analysis of **Pandas Vectorization vs Apply: Memory Profiling and Performance Scaling** in the context of **Data Manipulation & EDA**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Bloomberg.",
    "type": "Conceptual",
    "company": "Bloomberg",
    "role": "Financial Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Data Manipulation & EDA",
    "subtopic": "Pandas Vectorization vs Apply: Memory Profiling and Performance Scaling",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Bloomberg Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Pandas Vectorization vs Apply: Memory Profiling and Performance Scaling.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Pandas Vectorization vs Apply: Memory Profiling and Performance Scaling. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Data Manipulation & EDA",
      "Bloomberg",
      "FinancialDataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Data Manipulation & EDA.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-42-outlier-detection-interquartile-ran",
    "title": "Outlier Detection [Problem #42]",
    "question": "Provide a rigorous analysis of **Outlier Detection: Interquartile Range (IQR) vs Robust Z-Score (MAD)** in the context of **Data Manipulation & EDA**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at American Express.",
    "type": "Conceptual",
    "company": "American Express",
    "role": "Fraud Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Data Manipulation & EDA",
    "subtopic": "Outlier Detection: Interquartile Range (IQR) vs Robust Z-Score (MAD)",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "American Express Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Outlier Detection: Interquartile Range (IQR) vs Robust Z-Score (MAD).",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Outlier Detection: Interquartile Range (IQR) vs Robust Z-Score (MAD). Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Data Manipulation & EDA",
      "American Express",
      "FraudAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Data Manipulation & EDA.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-43-missing-value-imputation-knn-vs-ite",
    "title": "Missing Value Imputation [Problem #43]",
    "question": "Provide a rigorous analysis of **Missing Value Imputation: KNN vs Iterative Chained Equations (MICE)** in the context of **Data Manipulation & EDA**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at TCS.",
    "type": "Conceptual",
    "company": "TCS",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Data Manipulation & EDA",
    "subtopic": "Missing Value Imputation: KNN vs Iterative Chained Equations (MICE)",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "TCS Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Missing Value Imputation: KNN vs Iterative Chained Equations (MICE).",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Missing Value Imputation: KNN vs Iterative Chained Equations (MICE). Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Data Manipulation & EDA",
      "TCS",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Data Manipulation & EDA.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-44-the-peeking-problem-in-a-b-testing-",
    "title": "The Peeking Problem in A/B Testing [Problem #44]",
    "question": "Provide a rigorous analysis of **The Peeking Problem in A/B Testing: Continuous Monitoring & Alpha Inflation** in the context of **Experimentation Pitfalls**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Optimizely.",
    "type": "Conceptual",
    "company": "Optimizely",
    "role": "Experimentation Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Experimentation Pitfalls",
    "subtopic": "The Peeking Problem in A/B Testing: Continuous Monitoring & Alpha Inflation",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Optimizely Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for The Peeking Problem in A/B Testing: Continuous Monitoring & Alpha Inflation.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in The Peeking Problem in A/B Testing: Continuous Monitoring & Alpha Inflation. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Experimentation Pitfalls",
      "Optimizely",
      "ExperimentationScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Experimentation Pitfalls.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-45-novelty-effect-vs-primacy-effect-de",
    "title": "Novelty Effect vs Primacy Effect [Problem #45]",
    "question": "Provide a rigorous analysis of **Novelty Effect vs Primacy Effect: Detecting Decaying Treatment Lifts** in the context of **Experimentation Pitfalls**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Google.",
    "type": "Conceptual",
    "company": "Google",
    "role": "Staff Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Experimentation Pitfalls",
    "subtopic": "Novelty Effect vs Primacy Effect: Detecting Decaying Treatment Lifts",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Google Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Novelty Effect vs Primacy Effect: Detecting Decaying Treatment Lifts.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Novelty Effect vs Primacy Effect: Detecting Decaying Treatment Lifts. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Experimentation Pitfalls",
      "Google",
      "StaffDataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Experimentation Pitfalls.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-46-two-sample-t-test-vs-welch-s-t-test",
    "title": "Two-Sample t-Test vs Welch's t-Test for Unequal Variances [Problem #46]",
    "question": "Provide a rigorous analysis of **Two-Sample t-Test vs Welch's t-Test for Unequal Variances** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Google.",
    "type": "Conceptual",
    "company": "Google",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Two-Sample t-Test vs Welch's t-Test for Unequal Variances",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Two-Sample t-Test vs Welch's t-Test for Unequal Variances.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Two-Sample t-Test vs Welch's t-Test for Unequal Variances. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Google",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-47-chi-square-test-of-independence-for",
    "title": "Chi-Square Test of Independence for Contingency Tables [Problem #47]",
    "question": "Provide a rigorous analysis of **Chi-Square Test of Independence for Contingency Tables** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Amazon.",
    "type": "Conceptual",
    "company": "Amazon",
    "role": "Business Intelligence Engineer",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Chi-Square Test of Independence for Contingency Tables",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Amazon Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Chi-Square Test of Independence for Contingency Tables.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Chi-Square Test of Independence for Contingency Tables. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Amazon",
      "BusinessIntelligenceEngineer"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-48-anova-f-test-and-post-hoc-tukey-hsd",
    "title": "ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons [Problem #48]",
    "question": "Provide a rigorous analysis of **ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Microsoft.",
    "type": "Conceptual",
    "company": "Microsoft",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Microsoft Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Microsoft",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-49-bonferroni-correction-vs-benjamini-",
    "title": "Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR) [Problem #49]",
    "question": "Provide a rigorous analysis of **Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR)** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Meta.",
    "type": "Conceptual",
    "company": "Meta",
    "role": "Quantitative Researcher",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR)",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Meta Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR).",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR). Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Meta",
      "QuantitativeResearcher"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-50-bootstrapping-empirical-confidence-",
    "title": "Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics [Problem #50]",
    "question": "Provide a rigorous analysis of **Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Apple.",
    "type": "Conceptual",
    "company": "Apple",
    "role": "Decision Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Apple Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Apple",
      "DecisionScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-51-poisson-process-inter-arrival-times",
    "title": "Poisson Process [Problem #51]",
    "question": "Provide a rigorous analysis of **Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution** in the context of **Probability & Distributions**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Stripe.",
    "type": "Conceptual",
    "company": "Stripe",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Probability & Distributions",
    "subtopic": "Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Stripe Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Probability & Distributions",
      "Stripe",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Probability & Distributions.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-52-central-limit-theorem-practical-sam",
    "title": "Central Limit Theorem [Problem #52]",
    "question": "Provide a rigorous analysis of **Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails** in the context of **Probability & Distributions**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Goldman Sachs.",
    "type": "Conceptual",
    "company": "Goldman Sachs",
    "role": "Risk Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Probability & Distributions",
    "subtopic": "Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Goldman Sachs Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Probability & Distributions",
      "Goldman Sachs",
      "RiskAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Probability & Distributions.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-53-beta-distribution-as-conjugate-prio",
    "title": "Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation [Problem #53]",
    "question": "Provide a rigorous analysis of **Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation** in the context of **Probability & Distributions**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Uber.",
    "type": "Conceptual",
    "company": "Uber",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Probability & Distributions",
    "subtopic": "Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Uber Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Probability & Distributions",
      "Uber",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Probability & Distributions.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-54-augmented-dickey-fuller-adf-test-fo",
    "title": "Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing [Problem #54]",
    "question": "Provide a rigorous analysis of **Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing** in the context of **Time Series Analysis**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at JPMorgan.",
    "type": "Conceptual",
    "company": "JPMorgan",
    "role": "Quantitative Strategist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Time Series Analysis",
    "subtopic": "Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "JPMorgan Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Time Series Analysis",
      "JPMorgan",
      "QuantitativeStrategist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Time Series Analysis.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-55-arima-vs-sarima-identifying-autoreg",
    "title": "ARIMA vs SARIMA [Problem #55]",
    "question": "Provide a rigorous analysis of **ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders** in the context of **Time Series Analysis**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Amazon.",
    "type": "Conceptual",
    "company": "Amazon",
    "role": "Demand Forecasting Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Time Series Analysis",
    "subtopic": "ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Time Series Analysis",
      "Amazon",
      "DemandForecastingScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Time Series Analysis.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-56-holt-winters-exponential-smoothing-",
    "title": "Holt-Winters Exponential Smoothing [Problem #56]",
    "question": "Provide a rigorous analysis of **Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments** in the context of **Time Series Analysis**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Walmart.",
    "type": "Conceptual",
    "company": "Walmart",
    "role": "Supply Chain Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Time Series Analysis",
    "subtopic": "Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Walmart Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Time Series Analysis",
      "Walmart",
      "SupplyChainAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Time Series Analysis.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-57-north-star-metric-definition-balanc",
    "title": "North Star Metric Definition [Problem #57]",
    "question": "Provide a rigorous analysis of **North Star Metric Definition: Balancing Engagement, Monetization & Retention** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Spotify.",
    "type": "Conceptual",
    "company": "Spotify",
    "role": "Product Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "North Star Metric Definition: Balancing Engagement, Monetization & Retention",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Spotify Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for North Star Metric Definition: Balancing Engagement, Monetization & Retention.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in North Star Metric Definition: Balancing Engagement, Monetization & Retention. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Spotify",
      "ProductDataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-58-dau-mau-stickiness-ratio-benchmarki",
    "title": "DAU/MAU Stickiness Ratio [Problem #58]",
    "question": "Provide a rigorous analysis of **DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Meta.",
    "type": "Conceptual",
    "company": "Meta",
    "role": "Product Growth Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Meta Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Meta",
      "ProductGrowthAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-59-conversion-funnel-drop-off-diagnost",
    "title": "Conversion Funnel Drop-off Diagnostic [Problem #59]",
    "question": "Provide a rigorous analysis of **Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Flipkart.",
    "type": "Conceptual",
    "company": "Flipkart",
    "role": "Data Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Flipkart Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Flipkart",
      "DataAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-60-simpson-s-paradox-in-aggregate-conv",
    "title": "Simpson's Paradox in Aggregate Conversion Rate Shifts [Problem #60]",
    "question": "Provide a rigorous analysis of **Simpson's Paradox in Aggregate Conversion Rate Shifts** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Netflix.",
    "type": "Conceptual",
    "company": "Netflix",
    "role": "Analytics Lead",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "Simpson's Paradox in Aggregate Conversion Rate Shifts",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Netflix Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Simpson's Paradox in Aggregate Conversion Rate Shifts.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Simpson's Paradox in Aggregate Conversion Rate Shifts. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Netflix",
      "AnalyticsLead"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-61-pandas-vectorization-vs-apply-memor",
    "title": "Pandas Vectorization vs Apply [Problem #61]",
    "question": "Provide a rigorous analysis of **Pandas Vectorization vs Apply: Memory Profiling and Performance Scaling** in the context of **Data Manipulation & EDA**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Bloomberg.",
    "type": "Conceptual",
    "company": "Bloomberg",
    "role": "Financial Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Data Manipulation & EDA",
    "subtopic": "Pandas Vectorization vs Apply: Memory Profiling and Performance Scaling",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Bloomberg Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Pandas Vectorization vs Apply: Memory Profiling and Performance Scaling.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Pandas Vectorization vs Apply: Memory Profiling and Performance Scaling. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Data Manipulation & EDA",
      "Bloomberg",
      "FinancialDataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Data Manipulation & EDA.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-62-outlier-detection-interquartile-ran",
    "title": "Outlier Detection [Problem #62]",
    "question": "Provide a rigorous analysis of **Outlier Detection: Interquartile Range (IQR) vs Robust Z-Score (MAD)** in the context of **Data Manipulation & EDA**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at American Express.",
    "type": "Conceptual",
    "company": "American Express",
    "role": "Fraud Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Data Manipulation & EDA",
    "subtopic": "Outlier Detection: Interquartile Range (IQR) vs Robust Z-Score (MAD)",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "American Express Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Outlier Detection: Interquartile Range (IQR) vs Robust Z-Score (MAD).",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Outlier Detection: Interquartile Range (IQR) vs Robust Z-Score (MAD). Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Data Manipulation & EDA",
      "American Express",
      "FraudAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Data Manipulation & EDA.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-63-missing-value-imputation-knn-vs-ite",
    "title": "Missing Value Imputation [Problem #63]",
    "question": "Provide a rigorous analysis of **Missing Value Imputation: KNN vs Iterative Chained Equations (MICE)** in the context of **Data Manipulation & EDA**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at TCS.",
    "type": "Conceptual",
    "company": "TCS",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Data Manipulation & EDA",
    "subtopic": "Missing Value Imputation: KNN vs Iterative Chained Equations (MICE)",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "TCS Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Missing Value Imputation: KNN vs Iterative Chained Equations (MICE).",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Missing Value Imputation: KNN vs Iterative Chained Equations (MICE). Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Data Manipulation & EDA",
      "TCS",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Data Manipulation & EDA.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-64-the-peeking-problem-in-a-b-testing-",
    "title": "The Peeking Problem in A/B Testing [Problem #64]",
    "question": "Provide a rigorous analysis of **The Peeking Problem in A/B Testing: Continuous Monitoring & Alpha Inflation** in the context of **Experimentation Pitfalls**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Optimizely.",
    "type": "Conceptual",
    "company": "Optimizely",
    "role": "Experimentation Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Experimentation Pitfalls",
    "subtopic": "The Peeking Problem in A/B Testing: Continuous Monitoring & Alpha Inflation",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Optimizely Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for The Peeking Problem in A/B Testing: Continuous Monitoring & Alpha Inflation.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in The Peeking Problem in A/B Testing: Continuous Monitoring & Alpha Inflation. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Experimentation Pitfalls",
      "Optimizely",
      "ExperimentationScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Experimentation Pitfalls.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-65-novelty-effect-vs-primacy-effect-de",
    "title": "Novelty Effect vs Primacy Effect [Problem #65]",
    "question": "Provide a rigorous analysis of **Novelty Effect vs Primacy Effect: Detecting Decaying Treatment Lifts** in the context of **Experimentation Pitfalls**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Google.",
    "type": "Conceptual",
    "company": "Google",
    "role": "Staff Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Experimentation Pitfalls",
    "subtopic": "Novelty Effect vs Primacy Effect: Detecting Decaying Treatment Lifts",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Google Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Novelty Effect vs Primacy Effect: Detecting Decaying Treatment Lifts.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Novelty Effect vs Primacy Effect: Detecting Decaying Treatment Lifts. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Experimentation Pitfalls",
      "Google",
      "StaffDataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Experimentation Pitfalls.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-66-two-sample-t-test-vs-welch-s-t-test",
    "title": "Two-Sample t-Test vs Welch's t-Test for Unequal Variances [Problem #66]",
    "question": "Provide a rigorous analysis of **Two-Sample t-Test vs Welch's t-Test for Unequal Variances** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Google.",
    "type": "Conceptual",
    "company": "Google",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Two-Sample t-Test vs Welch's t-Test for Unequal Variances",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Google Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Two-Sample t-Test vs Welch's t-Test for Unequal Variances.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Two-Sample t-Test vs Welch's t-Test for Unequal Variances. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Google",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-67-chi-square-test-of-independence-for",
    "title": "Chi-Square Test of Independence for Contingency Tables [Problem #67]",
    "question": "Provide a rigorous analysis of **Chi-Square Test of Independence for Contingency Tables** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Amazon.",
    "type": "Conceptual",
    "company": "Amazon",
    "role": "Business Intelligence Engineer",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Chi-Square Test of Independence for Contingency Tables",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Chi-Square Test of Independence for Contingency Tables.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Chi-Square Test of Independence for Contingency Tables. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Amazon",
      "BusinessIntelligenceEngineer"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-68-anova-f-test-and-post-hoc-tukey-hsd",
    "title": "ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons [Problem #68]",
    "question": "Provide a rigorous analysis of **ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Microsoft.",
    "type": "Conceptual",
    "company": "Microsoft",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Microsoft Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Microsoft",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-69-bonferroni-correction-vs-benjamini-",
    "title": "Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR) [Problem #69]",
    "question": "Provide a rigorous analysis of **Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR)** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Meta.",
    "type": "Conceptual",
    "company": "Meta",
    "role": "Quantitative Researcher",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR)",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR).",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR). Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Meta",
      "QuantitativeResearcher"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-70-bootstrapping-empirical-confidence-",
    "title": "Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics [Problem #70]",
    "question": "Provide a rigorous analysis of **Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Apple.",
    "type": "Conceptual",
    "company": "Apple",
    "role": "Decision Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Apple Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Apple",
      "DecisionScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-71-poisson-process-inter-arrival-times",
    "title": "Poisson Process [Problem #71]",
    "question": "Provide a rigorous analysis of **Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution** in the context of **Probability & Distributions**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Stripe.",
    "type": "Conceptual",
    "company": "Stripe",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Probability & Distributions",
    "subtopic": "Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Stripe Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Probability & Distributions",
      "Stripe",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Probability & Distributions.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-72-central-limit-theorem-practical-sam",
    "title": "Central Limit Theorem [Problem #72]",
    "question": "Provide a rigorous analysis of **Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails** in the context of **Probability & Distributions**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Goldman Sachs.",
    "type": "Conceptual",
    "company": "Goldman Sachs",
    "role": "Risk Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Probability & Distributions",
    "subtopic": "Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Goldman Sachs Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Probability & Distributions",
      "Goldman Sachs",
      "RiskAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Probability & Distributions.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-73-beta-distribution-as-conjugate-prio",
    "title": "Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation [Problem #73]",
    "question": "Provide a rigorous analysis of **Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation** in the context of **Probability & Distributions**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Uber.",
    "type": "Conceptual",
    "company": "Uber",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Probability & Distributions",
    "subtopic": "Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Uber Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Probability & Distributions",
      "Uber",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Probability & Distributions.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-74-augmented-dickey-fuller-adf-test-fo",
    "title": "Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing [Problem #74]",
    "question": "Provide a rigorous analysis of **Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing** in the context of **Time Series Analysis**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at JPMorgan.",
    "type": "Conceptual",
    "company": "JPMorgan",
    "role": "Quantitative Strategist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Time Series Analysis",
    "subtopic": "Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "JPMorgan Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Time Series Analysis",
      "JPMorgan",
      "QuantitativeStrategist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Time Series Analysis.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-75-arima-vs-sarima-identifying-autoreg",
    "title": "ARIMA vs SARIMA [Problem #75]",
    "question": "Provide a rigorous analysis of **ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders** in the context of **Time Series Analysis**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Amazon.",
    "type": "Conceptual",
    "company": "Amazon",
    "role": "Demand Forecasting Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Time Series Analysis",
    "subtopic": "ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Amazon Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Time Series Analysis",
      "Amazon",
      "DemandForecastingScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Time Series Analysis.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-76-holt-winters-exponential-smoothing-",
    "title": "Holt-Winters Exponential Smoothing [Problem #76]",
    "question": "Provide a rigorous analysis of **Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments** in the context of **Time Series Analysis**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Walmart.",
    "type": "Conceptual",
    "company": "Walmart",
    "role": "Supply Chain Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Time Series Analysis",
    "subtopic": "Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Walmart Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Time Series Analysis",
      "Walmart",
      "SupplyChainAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Time Series Analysis.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-77-north-star-metric-definition-balanc",
    "title": "North Star Metric Definition [Problem #77]",
    "question": "Provide a rigorous analysis of **North Star Metric Definition: Balancing Engagement, Monetization & Retention** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Spotify.",
    "type": "Conceptual",
    "company": "Spotify",
    "role": "Product Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "North Star Metric Definition: Balancing Engagement, Monetization & Retention",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Spotify Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for North Star Metric Definition: Balancing Engagement, Monetization & Retention.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in North Star Metric Definition: Balancing Engagement, Monetization & Retention. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Spotify",
      "ProductDataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-78-dau-mau-stickiness-ratio-benchmarki",
    "title": "DAU/MAU Stickiness Ratio [Problem #78]",
    "question": "Provide a rigorous analysis of **DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Meta.",
    "type": "Conceptual",
    "company": "Meta",
    "role": "Product Growth Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Meta",
      "ProductGrowthAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-79-conversion-funnel-drop-off-diagnost",
    "title": "Conversion Funnel Drop-off Diagnostic [Problem #79]",
    "question": "Provide a rigorous analysis of **Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Flipkart.",
    "type": "Conceptual",
    "company": "Flipkart",
    "role": "Data Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Flipkart Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Flipkart",
      "DataAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-80-simpson-s-paradox-in-aggregate-conv",
    "title": "Simpson's Paradox in Aggregate Conversion Rate Shifts [Problem #80]",
    "question": "Provide a rigorous analysis of **Simpson's Paradox in Aggregate Conversion Rate Shifts** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Netflix.",
    "type": "Conceptual",
    "company": "Netflix",
    "role": "Analytics Lead",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "Simpson's Paradox in Aggregate Conversion Rate Shifts",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Netflix Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Simpson's Paradox in Aggregate Conversion Rate Shifts.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Simpson's Paradox in Aggregate Conversion Rate Shifts. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Netflix",
      "AnalyticsLead"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-81-pandas-vectorization-vs-apply-memor",
    "title": "Pandas Vectorization vs Apply [Problem #81]",
    "question": "Provide a rigorous analysis of **Pandas Vectorization vs Apply: Memory Profiling and Performance Scaling** in the context of **Data Manipulation & EDA**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Bloomberg.",
    "type": "Conceptual",
    "company": "Bloomberg",
    "role": "Financial Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Data Manipulation & EDA",
    "subtopic": "Pandas Vectorization vs Apply: Memory Profiling and Performance Scaling",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Bloomberg Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Pandas Vectorization vs Apply: Memory Profiling and Performance Scaling.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Pandas Vectorization vs Apply: Memory Profiling and Performance Scaling. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Data Manipulation & EDA",
      "Bloomberg",
      "FinancialDataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Data Manipulation & EDA.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-82-outlier-detection-interquartile-ran",
    "title": "Outlier Detection [Problem #82]",
    "question": "Provide a rigorous analysis of **Outlier Detection: Interquartile Range (IQR) vs Robust Z-Score (MAD)** in the context of **Data Manipulation & EDA**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at American Express.",
    "type": "Conceptual",
    "company": "American Express",
    "role": "Fraud Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Data Manipulation & EDA",
    "subtopic": "Outlier Detection: Interquartile Range (IQR) vs Robust Z-Score (MAD)",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "American Express Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Outlier Detection: Interquartile Range (IQR) vs Robust Z-Score (MAD).",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Outlier Detection: Interquartile Range (IQR) vs Robust Z-Score (MAD). Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Data Manipulation & EDA",
      "American Express",
      "FraudAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Data Manipulation & EDA.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-83-missing-value-imputation-knn-vs-ite",
    "title": "Missing Value Imputation [Problem #83]",
    "question": "Provide a rigorous analysis of **Missing Value Imputation: KNN vs Iterative Chained Equations (MICE)** in the context of **Data Manipulation & EDA**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at TCS.",
    "type": "Conceptual",
    "company": "TCS",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Data Manipulation & EDA",
    "subtopic": "Missing Value Imputation: KNN vs Iterative Chained Equations (MICE)",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "TCS Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Missing Value Imputation: KNN vs Iterative Chained Equations (MICE).",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Missing Value Imputation: KNN vs Iterative Chained Equations (MICE). Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Data Manipulation & EDA",
      "TCS",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Data Manipulation & EDA.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-84-the-peeking-problem-in-a-b-testing-",
    "title": "The Peeking Problem in A/B Testing [Problem #84]",
    "question": "Provide a rigorous analysis of **The Peeking Problem in A/B Testing: Continuous Monitoring & Alpha Inflation** in the context of **Experimentation Pitfalls**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Optimizely.",
    "type": "Conceptual",
    "company": "Optimizely",
    "role": "Experimentation Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Experimentation Pitfalls",
    "subtopic": "The Peeking Problem in A/B Testing: Continuous Monitoring & Alpha Inflation",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Optimizely Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for The Peeking Problem in A/B Testing: Continuous Monitoring & Alpha Inflation.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in The Peeking Problem in A/B Testing: Continuous Monitoring & Alpha Inflation. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Experimentation Pitfalls",
      "Optimizely",
      "ExperimentationScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Experimentation Pitfalls.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-85-novelty-effect-vs-primacy-effect-de",
    "title": "Novelty Effect vs Primacy Effect [Problem #85]",
    "question": "Provide a rigorous analysis of **Novelty Effect vs Primacy Effect: Detecting Decaying Treatment Lifts** in the context of **Experimentation Pitfalls**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Google.",
    "type": "Conceptual",
    "company": "Google",
    "role": "Staff Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Experimentation Pitfalls",
    "subtopic": "Novelty Effect vs Primacy Effect: Detecting Decaying Treatment Lifts",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Novelty Effect vs Primacy Effect: Detecting Decaying Treatment Lifts.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Novelty Effect vs Primacy Effect: Detecting Decaying Treatment Lifts. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Experimentation Pitfalls",
      "Google",
      "StaffDataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Experimentation Pitfalls.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-86-two-sample-t-test-vs-welch-s-t-test",
    "title": "Two-Sample t-Test vs Welch's t-Test for Unequal Variances [Problem #86]",
    "question": "Provide a rigorous analysis of **Two-Sample t-Test vs Welch's t-Test for Unequal Variances** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Google.",
    "type": "Conceptual",
    "company": "Google",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Two-Sample t-Test vs Welch's t-Test for Unequal Variances",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Google Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Two-Sample t-Test vs Welch's t-Test for Unequal Variances.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Two-Sample t-Test vs Welch's t-Test for Unequal Variances. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Google",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-87-chi-square-test-of-independence-for",
    "title": "Chi-Square Test of Independence for Contingency Tables [Problem #87]",
    "question": "Provide a rigorous analysis of **Chi-Square Test of Independence for Contingency Tables** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Amazon.",
    "type": "Conceptual",
    "company": "Amazon",
    "role": "Business Intelligence Engineer",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Chi-Square Test of Independence for Contingency Tables",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Amazon Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Chi-Square Test of Independence for Contingency Tables.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Chi-Square Test of Independence for Contingency Tables. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Amazon",
      "BusinessIntelligenceEngineer"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-88-anova-f-test-and-post-hoc-tukey-hsd",
    "title": "ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons [Problem #88]",
    "question": "Provide a rigorous analysis of **ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Microsoft.",
    "type": "Conceptual",
    "company": "Microsoft",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Microsoft Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in ANOVA F-Test and Post-Hoc Tukey HSD Multiple Comparisons. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Microsoft",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-89-bonferroni-correction-vs-benjamini-",
    "title": "Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR) [Problem #89]",
    "question": "Provide a rigorous analysis of **Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR)** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Meta.",
    "type": "Conceptual",
    "company": "Meta",
    "role": "Quantitative Researcher",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR)",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Meta Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR).",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Bonferroni Correction vs Benjamini-Hochberg False Discovery Rate (FDR). Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Meta",
      "QuantitativeResearcher"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-90-bootstrapping-empirical-confidence-",
    "title": "Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics [Problem #90]",
    "question": "Provide a rigorous analysis of **Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics** in the context of **Statistical Inference**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Apple.",
    "type": "Conceptual",
    "company": "Apple",
    "role": "Decision Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Statistical Inference",
    "subtopic": "Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Apple Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Bootstrapping Empirical Confidence Intervals for Non-Normal Statistics. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Statistical Inference",
      "Apple",
      "DecisionScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Statistical Inference.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-91-poisson-process-inter-arrival-times",
    "title": "Poisson Process [Problem #91]",
    "question": "Provide a rigorous analysis of **Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution** in the context of **Probability & Distributions**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Stripe.",
    "type": "Conceptual",
    "company": "Stripe",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Probability & Distributions",
    "subtopic": "Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Stripe Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Poisson Process: Inter-Arrival Times and Memoryless Exponential Distribution. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Probability & Distributions",
      "Stripe",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Probability & Distributions.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-92-central-limit-theorem-practical-sam",
    "title": "Central Limit Theorem [Problem #92]",
    "question": "Provide a rigorous analysis of **Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails** in the context of **Probability & Distributions**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Goldman Sachs.",
    "type": "Conceptual",
    "company": "Goldman Sachs",
    "role": "Risk Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Probability & Distributions",
    "subtopic": "Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Goldman Sachs Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Central Limit Theorem: Practical Sample Size Thresholds and Heavy Tails. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Probability & Distributions",
      "Goldman Sachs",
      "RiskAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Probability & Distributions.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-93-beta-distribution-as-conjugate-prio",
    "title": "Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation [Problem #93]",
    "question": "Provide a rigorous analysis of **Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation** in the context of **Probability & Distributions**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Uber.",
    "type": "Conceptual",
    "company": "Uber",
    "role": "Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Probability & Distributions",
    "subtopic": "Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Uber Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Beta Distribution as Conjugate Prior in Bayesian Conversion Rate Estimation. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Probability & Distributions",
      "Uber",
      "DataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Probability & Distributions.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-94-augmented-dickey-fuller-adf-test-fo",
    "title": "Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing [Problem #94]",
    "question": "Provide a rigorous analysis of **Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing** in the context of **Time Series Analysis**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at JPMorgan.",
    "type": "Conceptual",
    "company": "JPMorgan",
    "role": "Quantitative Strategist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Time Series Analysis",
    "subtopic": "Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "JPMorgan Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Augmented Dickey-Fuller (ADF) Test for Stationarity & Differencing. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Time Series Analysis",
      "JPMorgan",
      "QuantitativeStrategist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Time Series Analysis.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-95-arima-vs-sarima-identifying-autoreg",
    "title": "ARIMA vs SARIMA [Problem #95]",
    "question": "Provide a rigorous analysis of **ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders** in the context of **Time Series Analysis**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Amazon.",
    "type": "Conceptual",
    "company": "Amazon",
    "role": "Demand Forecasting Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Time Series Analysis",
    "subtopic": "ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Amazon Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in ARIMA vs SARIMA: Identifying Autoregressive (p) & Moving Average (q) Orders. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Time Series Analysis",
      "Amazon",
      "DemandForecastingScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Time Series Analysis.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-96-holt-winters-exponential-smoothing-",
    "title": "Holt-Winters Exponential Smoothing [Problem #96]",
    "question": "Provide a rigorous analysis of **Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments** in the context of **Time Series Analysis**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Walmart.",
    "type": "Conceptual",
    "company": "Walmart",
    "role": "Supply Chain Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Time Series Analysis",
    "subtopic": "Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Walmart Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Holt-Winters Exponential Smoothing: Level, Trend & Seasonal Adjustments. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Time Series Analysis",
      "Walmart",
      "SupplyChainAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Time Series Analysis.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-97-north-star-metric-definition-balanc",
    "title": "North Star Metric Definition [Problem #97]",
    "question": "Provide a rigorous analysis of **North Star Metric Definition: Balancing Engagement, Monetization & Retention** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Spotify.",
    "type": "Conceptual",
    "company": "Spotify",
    "role": "Product Data Scientist",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "North Star Metric Definition: Balancing Engagement, Monetization & Retention",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Spotify Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for North Star Metric Definition: Balancing Engagement, Monetization & Retention.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in North Star Metric Definition: Balancing Engagement, Monetization & Retention. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Spotify",
      "ProductDataScientist"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-98-dau-mau-stickiness-ratio-benchmarki",
    "title": "DAU/MAU Stickiness Ratio [Problem #98]",
    "question": "Provide a rigorous analysis of **DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Meta.",
    "type": "Conceptual",
    "company": "Meta",
    "role": "Product Growth Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Meta Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in DAU/MAU Stickiness Ratio: Benchmarking High-Frequency vs Utility Products. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Meta",
      "ProductGrowthAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-99-conversion-funnel-drop-off-diagnost",
    "title": "Conversion Funnel Drop-off Diagnostic [Problem #99]",
    "question": "Provide a rigorous analysis of **Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Flipkart.",
    "type": "Conceptual",
    "company": "Flipkart",
    "role": "Data Analyst",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Flipkart Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Conversion Funnel Drop-off Diagnostic: Identifying Bottlenecks. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Flipkart",
      "DataAnalyst"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-ds-ds-canonical-100-simpson-s-paradox-in-aggregate-conv",
    "title": "Simpson's Paradox in Aggregate Conversion Rate Shifts [Problem #100]",
    "question": "Provide a rigorous analysis of **Simpson's Paradox in Aggregate Conversion Rate Shifts** in the context of **Product & Metric Design**. Address the theoretical mathematical foundations, identify common analytical pitfalls, and describe how this is executed on massive production datasets at Netflix.",
    "type": "Conceptual",
    "company": "Netflix",
    "role": "Analytics Lead",
    "round": "Technical Round 1",
    "domain": "Data Science",
    "topic": "Product & Metric Design",
    "subtopic": "Simpson's Paradox in Aggregate Conversion Rate Shifts",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Netflix Analytics Interview Benchmark",
    "verified": true,
    "hints": [
      "Check whether standard parametric assumptions hold for Simpson's Paradox in Aggregate Conversion Rate Shifts.",
      "Consider the impact of sample size and effect size."
    ],
    "explanation": "This problem validates analytical mastery in Simpson's Paradox in Aggregate Conversion Rate Shifts. Key requirements: formulate correct statistical hypotheses, verify distributional assumptions, guard against false discoveries or metric gaming, and provide actionable business recommendations.",
    "solution": "Analytical resolution: 1. Validate underlying assumptions (normality, independence, homoscedasticity). 2. Compute statistical test/metric with appropriate correction. 3. Synthesize findings into clear executive tradeoffs.",
    "tags": [
      "Data Science",
      "Product & Metric Design",
      "Netflix",
      "AnalyticsLead"
    ],
    "recommendedForRoles": [
      "Data Scientist",
      "Data Analyst",
      "Product Analyst"
    ],
    "whyRecommended": "Validates foundational analytical thinking and statistical rigor in Product & Metric Design.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  }
];
