/**
 * lib/skills/curriculum/subjects/machine_learning.ts
 * 
 * Machine Learning Theory, Applied Algorithms & Calibration:
 * Supervised Linear/Logistic Models, Loss Functions, Decision Trees,
 * Ensemble Methods (Random Forest, Gradient Boosting / XGBoost),
 * Evaluation Metrics, ROC-AUC, and Probability Calibration.
 */

import { CanonicalSubject } from "../types";

export const MACHINE_LEARNING_SUBJECT: CanonicalSubject = {
  slug: "machine_learning",
  name: "Machine Learning Engineering & Theory",
  icon: "🤖",
  category: "AI & Modern ML",
  tagline: "Loss Optimization, Ensemble Methods & Production Calibration",
  description: "Master classical machine learning from convex loss minimization and gradient descent to tree-based ensembles (XGBoost, LightGBM), precision-recall tradeoffs, and probability calibration.",
  estimatedHours: 40,
  prerequisites: ["python", "numpy", "pandas", "math_stats"],
  chapters: [
    {
      slug: "loss-and-optimization",
      chapterNumber: 1,
      title: "Chapter 1: Convex Loss Functions & Gradient Descent",
      description: "Understand Mean Squared Error (MSE), Binary Cross-Entropy (Log-Loss), convex surfaces, and batch vs stochastic gradient descent.",
      topics: [
        {
          slug: "logistic-regression-and-loss",
          title: "Logistic Regression & Binary Cross-Entropy Loss",
          summary: "Derive log-loss, compute sigmoid probabilities, and optimize weights via gradient updates.",
          subtopics: [
            {
              id: "ml-101",
              slug: "logistic-regression-and-bce",
              title: "Convex Optimization: Sigmoid Activation & Binary Cross-Entropy (BCE)",
              subjectSlug: "machine_learning",
              chapterSlug: "loss-and-optimization",
              topicSlug: "logistic-regression-and-loss",
              estimatedMinutes: 30,
              difficulty: "intermediate",
              canonicalSkill: "classical_ml_modeling",
              prerequisites: [],
              learningGoal: "Implement vectorized logistic regression with binary cross-entropy loss and gradient descent parameter updates.",
              intuitiveStory: "Imagine tuning an electronic guitar tuner. When you pluck a string, if the frequency is sharp, you turn the peg counterclockwise; if flat, clockwise. Gradient descent calculates exactly how much and in which direction to twist every tuning peg to minimize dissonance.",
              analogy: "Gradient descent is hiking down a foggy mountain by feeling which slope angle descends steepest under your boots.",
              formalConcept: "Logistic regression models P(y=1|x) via sigma(w^T x + b). Binary Cross-Entropy L(w) = -1/N sum[y log(p) + (1-y) log(1-p)] is strictly convex, ensuring a unique global minimum. The gradient with respect to w is 1/N X^T (p - y).",
              mathFormula: "\\sigma(z) = \\frac{1}{1 + e^{-z}}, \\quad \\mathcal{L} = -\\frac{1}{N} \\sum_{i=1}^N \\left[ y_i \\log p_i + (1 - y_i) \\log(1 - p_i) \\right]",
              productionSignificance: "Forms the foundational calibration backbone of ad click-through rate (CTR) prediction systems at Google and Meta.",
              visualType: "training_curve",
              mermaidDiagram: `graph LR
    Input["Features X (N, D)"] --> Dot["z = X @ w + b"]
    Dot --> Sig["p = 1 / (1 + exp(-z))"]
    Sig --> Loss["BCE Loss = -mean(y log p + (1-y) log(1-p))"]
    Loss --> Grad["Grad = (1/N) * X.T @ (p - y)"]
    Grad --> Update["w := w - lr * Grad"]`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "Vectorized Sigmoid and Binary Cross Entropy",
                  explanation: "Uses np.clip to prevent log(0) numeric overflow.",
                  codeOrQuery: `import numpy as np

def sigmoid(z: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-np.clip(z, -250, 250)))

def bce_loss(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    eps = 1e-15
    p = np.clip(y_pred, eps, 1.0 - eps)
    return -float(np.mean(y_true * np.log(p) + (1.0 - y_true) * np.log(1.0 - p)))

z = np.array([-2.0, 0.0, 2.0])
p = sigmoid(z)
print("Probabilities:", p)
print("Loss (true=[0, 1, 1]):", bce_loss(np.array([0, 1, 1]), p))`,
                  outputSummary: "Probabilities: [0.119, 0.5, 0.881], Loss: ~0.28"
                }
              ],
              audioNarrationScript: "Binary cross-entropy loss heavily penalizes confident wrong predictions. If the true label is zero, predicting a probability near one causes the loss to spike toward infinity. Always clip predicted probabilities before calculating the logarithm to prevent NaN errors in production.",
              coBuildSlot: {
                slotId: "ml-slot-101",
                instruction: "Complete the gradient calculation: grad = (1.0 / N) * (X.T @ (p - y)).",
                starterSnippet: `import numpy as np\ndef compute_gradient(X: np.ndarray, y: np.ndarray, p: np.ndarray) -> np.ndarray:\n    N = X.shape[0]\n    return (1.0 / N) * (X.T @ (p - y))`,
                expectedPattern: "\\(1\\.0\\s*/\\s*N\\)\\s*\\*\\s*\\(X\\.T\\s*@\\s*\\(p\\s*-\\s*y\\)\\)",
                hint1: "Multiply (1.0 / N) by the matrix product of X.T and (p - y).",
                hint2: "Write: (1.0 / N) * (X.T @ (p - y))",
                validationExplanation: "Correctly computes the analytical gradient of binary cross-entropy."
              },
              executionEnvironment: "python_sandbox",
              starterCodeOrQuery: `import numpy as np

def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-np.clip(z, -250, 250)))

def train_logistic_regression(X, y, epochs=100, lr=0.1):
    N, D = X.shape
    w = np.zeros(D)
    for _ in range(epochs):
        p = sigmoid(X @ w)
        grad = (1.0 / N) * (X.T @ (p - y))
        w -= lr * grad
    return w

X = np.array([[1.0, 2.0], [2.0, 1.0], [2.0, 3.0], [3.0, 2.0]])
y = np.array([0, 0, 1, 1])
w = train_logistic_regression(X, y)
print("Trained weights:", w)
`,
              debugFault: {
                faultId: "ml-fault-101",
                title: "Omission of Epsilon Guard in Log Loss Calculation",
                buggyCodeOrConfig: `import numpy as np
def loss(y_true, y_pred):
    # Bug: When y_pred contains 0.0 or 1.0, np.log outputs -inf, resulting in NaN loss
    return -np.mean(y_true * np.log(y_pred) + (1 - y_true) * np.log(1 - y_pred))`,
                correctCodeOrConfig: `import numpy as np
def loss(y_true, y_pred):
    eps = 1e-15
    p = np.clip(y_pred, eps, 1.0 - eps)
    return -np.mean(y_true * np.log(p) + (1.0 - y_true) * np.log(1.0 - p))`,
                diagnosticHint: "np.log(0.0) evaluates to -inf. Clip probabilities using np.clip(y_pred, 1e-15, 1 - 1e-15).",
                explanation: "Numerical clipping guarantees stability without noticeably perturbing metric accuracy."
              },
              comprehensionChecks: [
                {
                  id: "ml-cc-101a",
                  question: "Why is Mean Squared Error (MSE) generally NOT used as the loss function for Logistic Regression?",
                  options: [
                    "Because MSE is only defined for 1D arrays.",
                    "Because combining the non-linear sigmoid activation with MSE results in a non-convex loss surface with multiple local minima.",
                    "Because MSE requires matrix inversion.",
                    "Because MSE always produces negative numbers."
                  ],
                  correctIndex: 1,
                  explanation: "The sigmoid function coupled with MSE creates non-convex saddles and local minima. Log-loss guarantees strict convexity."
                }
              ],
              independentChallenge: {
                challengeId: "ml-chal-101",
                title: "L2 Regularized Logistic Regression Optimizer",
                description: "Implement L2 Ridge penalty regularization in gradient descent: add (lambda / N) * w to the gradient (excluding bias).",
                starterCode: `import numpy as np
def l2_regularized_grad(X: np.ndarray, y: np.ndarray, p: np.ndarray, w: np.ndarray, l2_lambda: float) -> np.ndarray:
    N = X.shape[0]
    unreg_grad = (1.0 / N) * (X.T @ (p - y))
    reg_penalty = (l2_lambda / N) * w
    return unreg_grad + reg_penalty
`,
                solutionCode: `import numpy as np
def l2_regularized_grad(X: np.ndarray, y: np.ndarray, p: np.ndarray, w: np.ndarray, l2_lambda: float) -> np.ndarray:
    N = X.shape[0]
    unreg_grad = (1.0 / N) * (X.T @ (p - y))
    reg_penalty = (l2_lambda / N) * w
    return unreg_grad + reg_penalty
`,
                testCases: [
                  {
                    input: "w=[1.0, 2.0], l2_lambda=0.1",
                    expectedOutput: "Gradient adjusted by ridge penalty vector",
                    description: "Penalizes large feature weights to prevent overfitting."
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

