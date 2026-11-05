/**
 * lib/skills/curriculum/subjects/math_stats.ts
 * 
 * Mathematics & Statistics for AI & Machine Learning:
 * Linear Algebra, Matrix Decompositions, Calculus & Gradients,
 * Probability Distributions, Bayes Theorem, Hypothesis Testing & P-values.
 */

import { CanonicalSubject } from "../types";

export const MATH_STATS_SUBJECT: CanonicalSubject = {
  slug: "math_stats",
  name: "Mathematics & Statistics for Machine Learning",
  icon: "📊",
  category: "Data & Databases",
  tagline: "Linear Algebra, Multivariate Calculus & Inferential Statistics",
  description: "Master the mathematical foundations of machine learning: matrix eigendecomposition, gradient vectors, probability theory, Bayesian updates, and rigorous statistical hypothesis testing.",
  estimatedHours: 35,
  prerequisites: [],
  chapters: [
    {
      slug: "probability-and-bayes",
      chapterNumber: 1,
      title: "Chapter 1: Probability Theory, Distributions & Bayes Theorem",
      description: "Understand joint, marginal, and conditional probabilities, likelihood functions, and Bayesian inference.",
      topics: [
        {
          slug: "bayes-theorem-and-inference",
          title: "Conditional Probability & Bayesian Updating",
          summary: "Update beliefs rigorously in the presence of noisy real-world evidence.",
          subtopics: [
            {
              id: "ms-101",
              slug: "bayes-theorem-in-production",
              title: "Bayesian Updating: Priors, Likelihoods & Posterior Inference",
              subjectSlug: "math_stats",
              chapterSlug: "probability-and-bayes",
              topicSlug: "bayes-theorem-and-inference",
              estimatedMinutes: 25,
              difficulty: "intermediate",
              canonicalSkill: "ab_testing_statistics",
              prerequisites: [],
              learningGoal: "Apply Bayes' Theorem to compute posterior probabilities given prior prevalence and test false-positive rates.",
              intuitiveStory: "A rare disease affects 1 in 1,000 people. A test is 99% accurate. If a patient tests positive, what is the probability they actually have the disease? Counterintuitively, it is only ~9% because false positives among the 999 healthy people outnumber true positives from the 1 sick person.",
              analogy: "Bayes' Theorem is an evidence scale: your prior belief is on one pan, and the new data tip the balance according to the likelihood ratio.",
              formalConcept: "Bayes' Rule states P(A|B) = [P(B|A) * P(A)] / P(B). In machine learning, parameters theta are estimated from observed data D via P(theta|D) proportional to P(D|theta) * P(theta).",
              mathFormula: "P(Y = 1 | X) = \\frac{P(X | Y = 1) P(Y = 1)}{P(X | Y = 1) P(Y = 1) + P(X | Y = 0) P(Y = 0)}",
              productionSignificance: "In spam filtering and fraud detection, failing to factor in the extremely low prior prevalence of fraud results in hundreds of thousands of false alarms.",
              visualType: "distribution",
              mermaidDiagram: `graph LR
    Prior["Prior Belief: P(Spam) = 0.05"] --> Update{"Likelihood Ratio: P(Words|Spam) / P(Words|Ham)"}
    Evidence["Observed Words: 'urgent wire transfer'"] --> Update
    Update --> Post["Posterior: P(Spam|Words) = 0.98"]`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "Calculating Posterior Probability in Python",
                  explanation: "Implements the Law of Total Probability in the denominator.",
                  codeOrQuery: `def compute_posterior(prior: float, sensitivity: float, specificity: float) -> float:
    # sensitivity = P(Pos|Disease), specificity = P(Neg|Healthy)
    fpr = 1.0 - specificity
    p_pos = (sensitivity * prior) + (fpr * (1.0 - prior))
    return (sensitivity * prior) / p_pos

print(f"Posterior: {compute_posterior(0.001, 0.99, 0.99):.4f}")`,
                  outputSummary: "Posterior: 0.0902 (~9%)"
                }
              ],
              audioNarrationScript: "When evaluating diagnostic tests or spam filters, always multiply the likelihood by the prior probability. If the base rate is low, even an accurate test will produce more false positives than true positives. This is the base rate fallacy.",
              coBuildSlot: {
                slotId: "ms-slot-101",
                instruction: "Complete the function bayesian_update(prior, likelihood_true, likelihood_false) to return the normalized posterior.",
                starterSnippet: `def bayesian_update(prior: float, l_true: float, l_false: float) -> float:\n    p_evidence = (l_true * prior) + (l_false * (1.0 - prior))\n    return (l_true * prior) / p_evidence`,
                expectedPattern: "return\\s+\\(l_true\\s*\\*\\s*prior\\)\\s*/\\s*p_evidence",
                hint1: "Divide numerator (l_true * prior) by total evidence probability p_evidence.",
                hint2: "Write: return (l_true * prior) / p_evidence",
                validationExplanation: "Correctly computes Bayes formula normalization."
              },
              executionEnvironment: "python_sandbox",
              starterCodeOrQuery: `def bayesian_update(prior: float, l_true: float, l_false: float) -> float:
    p_evidence = (l_true * prior) + (l_false * (1.0 - prior))
    return (l_true * prior) / p_evidence

# 1% prior fraud, 95% detection rate, 2% false alarm rate
print("Posterior Fraud Probability:", bayesian_update(0.01, 0.95, 0.02))
`,
              debugFault: {
                faultId: "ms-fault-101",
                title: "Ignoring Base Rate (Base Rate Fallacy in Classifier)",
                buggyCodeOrConfig: `def predict_fraud(feature_score: float) -> bool:
    # Bug: Classifies as fraud if sensitivity > 0.9 without checking prior probability
    return feature_score > 0.9`,
                correctCodeOrConfig: `def predict_fraud(feature_score: float, prior_rate: float = 0.005) -> bool:
    # Use Bayes threshold
    odds = (feature_score / (1.0 - feature_score)) * (prior_rate / (1.0 - prior_rate))
    posterior = odds / (1.0 + odds)
    return posterior > 0.5`,
                diagnosticHint: "A model score must be calibrated against the class prior before deciding an action.",
                explanation: "Uncalibrated probabilities trigger severe false alarm cascades in low-prevalence domains."
              },
              comprehensionChecks: [
                {
                  id: "ms-cc-101a",
                  question: "What is the primary consequence of committing the Base Rate Fallacy?",
                  options: [
                    "Overestimating the probability of a rare event given a positive test.",
                    "Dividing by zero in NumPy.",
                    "Underestimating the variance of a Gaussian distribution.",
                    "Confusing mean and median."
                  ],
                  correctIndex: 0,
                  explanation: "Ignoring the prior prevalence causes observers to assume test accuracy equals posterior certainty."
                }
              ],
              independentChallenge: {
                challengeId: "ms-chal-101",
                title: "Bayesian Spam Classifier Token Scorer",
                description: "Compute the log-odds posterior score for a document given token likelihoods and prior spam rate.",
                starterCode: `import math
def compute_log_odds(prior_spam: float, token_likelihoods: list[tuple[float, float]]) -> float:
    # token_likelihoods: list of (p_word_given_spam, p_word_given_ham)
    log_odds = math.log(prior_spam / (1.0 - prior_spam))
    for p_spam, p_ham in token_likelihoods:
        log_odds += math.log(p_spam / p_ham)
    return log_odds
`,
                solutionCode: `import math
def compute_log_odds(prior_spam: float, token_likelihoods: list[tuple[float, float]]) -> float:
    log_odds = math.log(prior_spam / (1.0 - prior_spam))
    for p_spam, p_ham in token_likelihoods:
        log_odds += math.log(p_spam / p_ham)
    return log_odds
`,
                testCases: [
                  {
                    input: "prior=0.1, likelihoods=[(0.8, 0.1), (0.7, 0.2)]",
                    expectedOutput: "log-odds > 0 (classified as spam)",
                    description: "Correctly accumulates log-likelihood ratios."
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

