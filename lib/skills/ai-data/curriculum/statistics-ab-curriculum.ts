/**
 * lib/skills/ai-data/curriculum/statistics-ab-curriculum.ts
 * 
 * Complete Analytical Statistics, Probability & A/B Testing Curriculum Decomposition.
 * Granular modules: Probability Distributions & Central Limit Theorem,
 * Hypothesis Testing (Z/T/Chi-Square), and Controlled A/B Testing Experimentation.
 */

import { TaxonomyTopic, TaxonomyModule } from "../master-curriculum-taxonomy";

export const STATISTICS_AB_MODULES: TaxonomyModule[] = [
  {
    id: "mod_stats_probability",
    trackId: "track_stats_ab",
    title: "Module 1: Probability Distributions & The Central Limit Theorem",
    description: "Discrete vs continuous distributions, variance, skewness, and the Central Limit Theorem.",
    order: 1,
    topics: [
      {
        id: "stats-01-clt-distributions",
        trackId: "track_stats_ab",
        moduleId: "mod_stats_probability",
        title: "Probability Distributions & The Central Limit Theorem (CLT)",
        order: 1,
        estimatedMinutes: 35,
        difficulty: "beginner",
        prerequisites: [],
        roleRelevance: {
          data_analyst: { importance: "CRITICAL", why: "Understanding standard errors and confidence intervals for metrics." },
          data_scientist: { importance: "CRITICAL", why: "The mathematical backbone of all inferential statistics and hypothesis testing." },
          data_engineer: { importance: "HIGH", why: "Data profiling and identifying skewed distributions in data lakes." },
          ml_engineer: { importance: "CRITICAL", why: "Gaussian assumptions in Bayesian optimization and variational autoencoders." },
          mlops_engineer: { importance: "HIGH", why: "Monitoring drift in input feature distribution distributions (KL divergence)." },
          ai_engineer: { importance: "HIGH", why: "Calibrating temperature softmax distributions over vocabulary tokens." },
          genai_llm_engineer: { importance: "HIGH", why: "Top-p nucleus sampling operates directly on token probability distributions." },
          applied_ai_engineer: { importance: "HIGH", why: "Setting alert thresholds based on 3-sigma standard deviation bounds." },
        },
        learningObjectives: [
          "Differentiate between Population Parameters (mu, sigma) and Sample Statistics (x_bar, s).",
          "Understand the Central Limit Theorem: The distribution of sample means approaches normality as sample size increases, regardless of the underlying population distribution.",
          "Calculate Standard Error of the Mean: `SE = sigma / sqrt(n)`."
        ],
        conceptsCovered: ["Normal Distribution", "Central Limit Theorem", "Standard Error", "Confidence Intervals", "Skewness & Kurtosis"],
        subtopics: [
          { id: "stats-01-sub-1", title: "Population vs Sample: Why Sample Size Shrinks Error", order: 1, concepts: ["Law of Large Numbers", "Standard Error sqrt(n)"] },
          { id: "stats-01-sub-2", title: "Empirical Rule (68-95-99.7) for Gaussian Distributions", order: 2, concepts: ["Z-scores", "Outlier Detection Bounds"] }
        ],
        practicalOutcome: "Demonstrate the Central Limit Theorem by drawing samples from a heavily skewed exponential distribution and proving normality of means.",
        contextAndIntuition: {
          english: "Real-world data is almost never normal: website visit times are exponential, income is heavily right-skewed, and coin tosses are binary. The Central Limit Theorem is the miraculous mathematical law that states: if you repeatedly take samples of size N and plot their averages, the distribution of those averages will ALWAYS form a perfect bell curve (Normal distribution).",
          hinglish: "Real world ka data bell curve nahi hota: salary right-skewed hoti hai aur website visits exponential hoti hain. Central Limit Theorem ek jadu jaisa rule hai jo kehta hai: chahe data kaisa bhi ho, agar aap baar baar samples lekar unka average nikalenge, toh un averages ka graph hamesha ek perfect Normal bell curve banega.",
          whyExists: "Allows statisticians to make reliable confidence intervals and tests on non-normal real-world data.",
          whatWasUsedBefore: "Assuming normality blindly or using complex non-parametric approximations."
        },
        deepExplanation: {
          english: "As sample size `n >= 30`, the sampling distribution of the mean `X_bar` converges in distribution to `Normal(mu, sigma^2 / n)`. This means that as `n` grows, the standard error decreases by `1 / sqrt(n)`, tightening the confidence interval around the true population mean.",
          hinglish: "Jab sample size `n >= 30` ho jata hai, toh sample means ka distribution `Normal(mu, sigma^2 / n)` ban jata hai. Iska standard error `sigma / sqrt(n)` hota hai, jo sample size badhne par rapidly shrink hota hai.",
          internalMechanics: "Convolution of probability density functions converging to Gaussian attractor under the Berry-Esseen theorem.",
          realWorldUsage: "Calculating election poll margins of error, financial risk value-at-risk, and customer retention confidence intervals.",
          commonMistakes: [
            "Confusing Standard Deviation (spread of individual data points) with Standard Error (spread of sample means).",
            "Assuming individual data points become normal with larger sample size (only the sample MEAN becomes normal)."
          ]
        },
        visualDemoConfig: {
          type: "ML_BOUNDARY",
          initialState: {
            populationDistribution: "Exponential (Skewed)",
            sampleSizeN: 50,
            samplingDistribution: "Normal Bell Curve"
          }
        },
        externalResources: [
          {
            id: "res-stats-clt-01",
            creatorOrOrg: "CampusX",
            title: "Central Limit Theorem Explained with Visual Python Simulation",
            topicCovered: "Population vs sample, CLT proof, standard error, and normal distribution",
            url: "https://www.youtube.com/watch?v=mcnjU5tGZls",
            timestamp: "00:10:00",
            language: "Hinglish",
            difficulty: "beginner",
            whyRecommended: "Clear visual simulations proving that skewed distributions yield normal averages.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `import numpy as np\n\ndef compute_standard_error(sample_data):\n    # Return standard error of the mean: std(sample_data, ddof=1) / sqrt(N)\n    pass`,
        solutionSnippet: `import numpy as np\n\ndef compute_standard_error(sample_data):\n    s = np.std(sample_data, ddof=1)\n    return s / np.sqrt(len(sample_data))`
      }
    ]
  },
  {
    id: "mod_stats_ab_experimentation",
    trackId: "track_stats_ab",
    title: "Module 2: A/B Testing, Hypothesis Testing & Experimentation",
    description: "Null/Alternative hypotheses, p-values, Z-tests, MDE, sample size estimation, and peeking traps.",
    order: 2,
    topics: [
      {
        id: "stats-02-ab-testing-hypothesis",
        trackId: "track_stats_ab",
        moduleId: "mod_stats_ab_experimentation",
        title: "A/B Testing & Hypothesis Testing: P-Values, Significance & Power",
        order: 1,
        estimatedMinutes: 40,
        difficulty: "intermediate",
        prerequisites: ["stats-01-clt-distributions"],
        roleRelevance: {
          data_analyst: { importance: "CRITICAL", why: "Determining whether a product feature launch produced a statistically significant lift." },
          data_scientist: { importance: "CRITICAL", why: "Core foundation of experimental design, sample size calculation, and metric verification." },
          data_engineer: { importance: "HIGH", why: "Building telemetry pipelines that guarantee randomized split assignment consistency." },
          ml_engineer: { importance: "CRITICAL", why: "Running online canary evaluation comparing new model variants to existing baselines." },
          mlops_engineer: { importance: "CRITICAL", why: "Managing traffic splitting and statistical rollback thresholds in production." },
          ai_engineer: { importance: "CRITICAL", why: "Evaluating prompt variants and model temperatures on human rating experiments." },
          genai_llm_engineer: { importance: "CRITICAL", why: "Benchmarking LLM output quality improvements across control and treatment groups." },
          applied_ai_engineer: { importance: "CRITICAL", why: "Validating user engagement impact after integrating AI features into applications." },
        },
        learningObjectives: [
          "State the Null Hypothesis (H0) and Alternative Hypothesis (H1) rigorously.",
          "Calculate Z-score, standard error of difference in proportions, and two-tailed p-values.",
          "Prevent statistical traps: Type I errors (false positives), Type II errors (false negatives), and Peeking / P-hacking."
        ],
        conceptsCovered: ["Null vs Alternative Hypothesis", "P-Value Definition", "Statistical Power (1 - Beta)", "Minimum Detectable Effect", "Peeking Problem"],
        subtopics: [
          { id: "stats-02-sub-1", title: "Two-Sample Z-Test for Conversion Proportions", order: 1, concepts: ["Pooled Proportion", "Z-Score", "Two-Tailed P-Value"] },
          { id: "stats-02-sub-2", title: "The Peeking Trap & Continuous Monitoring Bias", order: 2, concepts: ["Alpha Inflation", "Stopping Rules", "Sequential Testing"] }
        ],
        practicalOutcome: "Construct a complete A/B experiment evaluation function in Python that takes control and treatment metrics, computes z-test statistics, and emits an unambiguous business launch verdict.",
        contextAndIntuition: {
          english: "If you flip a coin 10 times and get 6 heads, is the coin biased? Probably not; it's random noise. If a new checkout button increases conversion from 5.0% to 5.2% over 100 visitors, did it actually improve, or was it pure luck? Hypothesis testing tells you the exact mathematical probability that the observed difference occurred by pure chance alone.",
          hinglish: "Agar aap sikka 10 baar uchhalein aur 6 baar heads aaye, toh sikka kharab nahi hai; wo random chance hai. A/B testing ka purpose yeh pata lagana hota hai ki naye feature se jo conversion increase dikha, wo sach mein feature ka kamaal hai ya sirf random chance.",
          whyExists: "Protects businesses from wasting millions of dollars rolling out placebo features that don't actually work.",
          whatWasUsedBefore: "Gut feelings, hippo decisions (Highest Paid Person's Opinion), and uncalibrated percentage comparisons."
        },
        deepExplanation: {
          english: "The p-value is the probability of observing an effect at least as extreme as the current data, assuming the Null Hypothesis (no real difference) is true. If `p < 0.05` (alpha), we reject the null hypothesis. The 'Peeking Problem' occurs when teams check p-values daily and stop the test early as soon as `p < 0.05`, inflating the true false positive rate from 5% to over 30%.",
          hinglish: "P-value batata hai ki agar sach mein koi difference na hota, toh itna bada result random chance se aane ki kya probability hai. Agar `p < 0.05` hai, toh hum result ko statistically significant maante hain. Roz roz p-value check karke test beech mein rokna ('peeking') ek bohot badi galti hai jisse fake results aate hain.",
          internalMechanics: "Two-proportion z-test: `z = (p_treat - p_ctrl) / sqrt(p_pool * (1 - p_pool) * (1/n_ctrl + 1/n_treat))`.",
          realWorldUsage: "E-commerce checkout redesigns, Netflix recommendation algorithm trials, and pricing experiments.",
          commonMistakes: [
            "Stopping the test early as soon as p < 0.05 is reached (p-hacking / continuous monitoring inflation).",
            "Confusing statistical significance with practical / economic significance (a 0.001% lift can be significant with 10M rows but commercially worthless)."
          ]
        },
        visualDemoConfig: {
          type: "ML_BOUNDARY",
          initialState: {
            controlRate: 0.05,
            treatmentRate: 0.058,
            pValue: 0.021,
            verdict: "LAUNCH"
          }
        },
        externalResources: [
          {
            id: "res-stats-ab-02",
            creatorOrOrg: "CampusX",
            title: "A/B Testing Complete Course for Data Scientists: Hypothesis Testing & Math",
            topicCovered: "Null hypothesis, Z-test, p-values, sample size estimation, and common pitfalls",
            url: "https://www.youtube.com/watch?v=mcnjU5tGZls",
            timestamp: "00:25:00",
            language: "Hinglish",
            difficulty: "intermediate",
            whyRecommended: "Practical breakdown of real tech company A/B testing frameworks and pitfalls.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `import math\nfrom scipy import stats\n\ndef evaluate_ab_test(control_conversions, control_visitors, test_conversions, test_visitors, alpha=0.05):\n    # Return dict with: p_value, is_significant (bool), and verdict ('LAUNCH' | 'RETAIN_CONTROL')\n    pass`,
        solutionSnippet: `import math\nfrom scipy import stats\n\ndef evaluate_ab_test(control_conversions, control_visitors, test_conversions, test_visitors, alpha=0.05):\n    p1 = control_conversions / control_visitors\n    p2 = test_conversions / test_visitors\n    p_pool = (control_conversions + test_conversions) / (control_visitors + test_visitors)\n    se = math.sqrt(p_pool * (1 - p_pool) * (1/control_visitors + 1/test_visitors))\n    z = (p2 - p1) / se\n    p_value = 2 * (1 - stats.norm.cdf(abs(z)))\n    is_significant = bool(p_value < alpha and p2 > p1)\n    return {\n        "z_score": round(z, 3),\n        "p_value": round(p_value, 5),\n        "is_significant": is_significant,\n        "verdict": "LAUNCH" if is_significant else "RETAIN_CONTROL"\n    }`
      }
    ]
  }
];

