/**
 * lib/skills/curriculum/subjects/deep_learning.ts
 * 
 * Deep Learning, Neural Network Architectures & PyTorch Foundations:
 * Perceptrons, Multi-Layer Perceptrons, Backpropagation Calculus,
 * Activation Functions (ReLU, GELU), CNNs, Self-Attention & Transformers.
 */

import { CanonicalSubject } from "../types";

export const DEEP_LEARNING_SUBJECT: CanonicalSubject = {
  slug: "deep_learning",
  name: "Deep Learning, PyTorch & Neural Networks",
  icon: "🧠",
  category: "AI & Modern ML",
  tagline: "Automatic Differentiation, Backprop Calculus & Transformer Blocks",
  description: "Master deep neural networks from tensor autograd graphs and manual backpropagation to convolutional feature extractors and self-attention Transformer blocks.",
  estimatedHours: 45,
  prerequisites: ["python", "numpy", "math_stats", "machine_learning"],
  chapters: [
    {
      slug: "backprop-and-neural-nets",
      chapterNumber: 1,
      title: "Chapter 1: Multi-Layer Perceptrons & Backpropagation",
      description: "Master matrix forward passes, computational graphs, reverse-mode autodiff, chain rule derivatives, and exploding/vanishing gradients.",
      topics: [
        {
          slug: "forward-backward-pass",
          title: "The Computational Graph & Manual Backprop",
          summary: "Derive and implement exact backpropagation gradients through linear layers and non-linear activations.",
          subtopics: [
            {
              id: "dl-101",
              slug: "manual-backpropagation-calculus",
              title: "The Reverse-Mode Engine: Jacobian Multiplications & Backprop Calculus",
              subjectSlug: "deep_learning",
              chapterSlug: "backprop-and-neural-nets",
              topicSlug: "forward-backward-pass",
              estimatedMinutes: 35,
              difficulty: "advanced",
              canonicalSkill: "deep_learning_foundations",
              prerequisites: [],
              learningGoal: "Implement a 2-layer neural network forward pass, compute cross-entropy loss, and derive analytical weight gradients via the multivariate chain rule.",
              intuitiveStory: "Imagine an automated factory where 10 machines assemble an engine. If the final engine vibrates violently, the quality inspector works backward from the output axle, tracking how each machine's gear alignment contributed to the final vibration.",
              analogy: "Backpropagation is reverse error attribution: passing blame backward through the computational graph according to the chain rule.",
              formalConcept: "Given loss L and intermediate activation a = relu(z) with z = W x + b, backpropagation computes dL/dW = (dL/dz) x^T, where dL/dz = (dL/da) elementwise-multiplied by relu'(z).",
              mathFormula: "\\frac{\\partial \\mathcal{L}}{\\partial \\mathbf{W}^{[l]}} = \\frac{1}{N} \\mathbf{\\delta}^{[l]} (\\mathbf{A}^{[l-1]})^T, \\quad \\mathbf{\\delta}^{[l]} = ((\\mathbf{W}^{[l+1]})^T \\mathbf{\\delta}^{[l+1]}) \\odot \\sigma'({\\mathbf{Z}^{[l]}})",
              productionSignificance: "Understanding exact tensor gradient shapes is mandatory when diagnosing vanishing gradients, custom PyTorch autograd functions, and GPU memory saturation.",
              visualType: "training_curve",
              mermaidDiagram: `graph LR
    X["Input X"] --> Z1["Z1 = X @ W1 + b1"]
    Z1 --> A1["A1 = ReLU(Z1)"]
    A1 --> Z2["Z2 = A1 @ W2 + b2"]
    Z2 --> Out["Probabilities = Softmax(Z2)"]
    Out --> Loss["Loss L"]
    Loss -. "dL/dZ2 = (P - Y)" .-> Z2
    Z2 -. "dL/dW2 = A1.T @ dZ2" .-> A1
    A1 -. "dZ1 = (dZ2 @ W2.T) * (Z1 > 0)" .-> Z1
    Z1 -. "dL/dW1 = X.T @ dZ1" .-> X`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "Manual 2-Layer Neural Network Forward and Backward Pass",
                  explanation: "Uses NumPy to execute exact analytical chain rule gradients.",
                  codeOrQuery: `import numpy as np

def relu(z): return np.maximum(0, z)
def relu_prime(z): return (z > 0).astype(float)

X = np.array([[0.5, 0.8], [0.1, 0.4]]) # (2, 2)
y = np.array([[1.0], [0.0]]) # (2, 1)

W1 = np.array([[0.2, 0.4], [0.3, 0.1]]) # (2, 2)
W2 = np.array([[0.5], [0.7]]) # (2, 1)

# Forward
Z1 = X @ W1
A1 = relu(Z1)
Z2 = A1 @ W2
p = 1.0 / (1.0 + np.exp(-Z2))

# Backward
dZ2 = p - y
dW2 = A1.T @ dZ2
dA1 = dZ2 @ W2.T
dZ1 = dA1 * relu_prime(Z1)
dW1 = X.T @ dZ1

print("Loss:", -np.mean(y*np.log(p) + (1-y)*np.log(1-p)))
print("dW2 shape:", dW2.shape)
print("dW1 shape:", dW1.shape)`,
                  outputSummary: "dW2: (2, 1), dW1: (2, 2) - Dimensionally consistent gradients."
                }
              ],
              audioNarrationScript: "In reverse-mode automatic differentiation, the error gradient flows backward through the network. Notice how the gradient with respect to a weight matrix is always the transpose of the input activation multiplied by the incoming error delta. Keeping track of matrix inner dimensions is the key to mastering backpropagation.",
              coBuildSlot: {
                slotId: "dl-slot-101",
                instruction: "Complete the ReLU derivative calculation: dZ1 = dA1 * (Z1 > 0).astype(float).",
                starterSnippet: `import numpy as np\ndef backprop_relu(dA1: np.ndarray, Z1: np.ndarray) -> np.ndarray:\n    return dA1 * (Z1 > 0).astype(float)`,
                expectedPattern: "dA1\\s*\\*\\s*\\(Z1\\s*>\\s*0\\)",
                hint1: "Multiply dA1 by the boolean mask (Z1 > 0).",
                hint2: "Write: return dA1 * (Z1 > 0).astype(float)",
                validationExplanation: "Correctly applies the derivative of the Rectified Linear Unit activation."
              },
              executionEnvironment: "python_sandbox",
              starterCodeOrQuery: `import numpy as np
def backprop_relu(dA1: np.ndarray, Z1: np.ndarray) -> np.ndarray:
    return dA1 * (Z1 > 0).astype(float)

dA = np.array([[-0.5, 0.3], [1.2, -0.8]])
Z = np.array([[2.0, -1.0], [-0.5, 3.0]])
print("dZ:", backprop_relu(dA, Z))
`,
              debugFault: {
                faultId: "dl-fault-101",
                title: "Dying ReLU Caused by Incorrect Derivative Formulation",
                buggyCodeOrConfig: `def relu_grad(dA, Z):
    # Bug: Testing dA > 0 instead of Z > 0
    return dA * (dA > 0).astype(float)`,
                correctCodeOrConfig: `def relu_grad(dA, Z):
    return dA * (Z > 0).astype(float)`,
                diagnosticHint: "The gradient of ReLU depends strictly on the forward input Z, not the upstream gradient dA.",
                explanation: "ReLU is piecewise linear: slope is 1 where Z > 0, and 0 where Z <= 0."
              },
              comprehensionChecks: [
                {
                  id: "dl-cc-101a",
                  question: "If a neuron's pre-activation Z is negative throughout training, what happens to its weight updates under ReLU?",
                  options: [
                    "The weights explode to infinity.",
                    "The gradient is strictly 0.0, permanently freezing the neuron (the 'Dying ReLU' problem).",
                    "The learning rate doubles automatically.",
                    "The neuron converts to a sigmoid activation."
                  ],
                  correctIndex: 1,
                  explanation: "Because the derivative of ReLU is 0 for Z <= 0, no gradient flows back to update the weights."
                }
              ],
              independentChallenge: {
                challengeId: "dl-chal-101",
                title: "Gradient Checking (Numerical vs Analytical Diff)",
                description: "Write a gradient check function verify_gradient(f, w, analytical_grad, eps=1e-5) that asserts numerical finite differences match analytical gradients within relative error 1e-4.",
                starterCode: `import numpy as np
def verify_gradient(f, w: np.ndarray, analytical_grad: np.ndarray, eps: float = 1e-5) -> bool:
    numerical_grad = np.zeros_like(w)
    for i in range(len(w)):
        w_plus = w.copy()
        w_minus = w.copy()
        w_plus[i] += eps
        w_minus[i] -= eps
        numerical_grad[i] = (f(w_plus) - f(w_minus)) / (2.0 * eps)
    rel_error = np.linalg.norm(numerical_grad - analytical_grad) / (np.linalg.norm(numerical_grad) + np.linalg.norm(analytical_grad) + 1e-12)
    return bool(rel_error < 1e-4)
`,
                solutionCode: `import numpy as np
def verify_gradient(f, w: np.ndarray, analytical_grad: np.ndarray, eps: float = 1e-5) -> bool:
    numerical_grad = np.zeros_like(w)
    for i in range(len(w)):
        w_plus = w.copy()
        w_minus = w.copy()
        w_plus[i] += eps
        w_minus[i] -= eps
        numerical_grad[i] = (f(w_plus) - f(w_minus)) / (2.0 * eps)
    rel_error = np.linalg.norm(numerical_grad - analytical_grad) / (np.linalg.norm(numerical_grad) + np.linalg.norm(analytical_grad) + 1e-12)
    return bool(rel_error < 1e-4)
`,
                testCases: [
                  {
                    input: "f(w) = w^2, w=2.0, analytical_grad=4.0",
                    expectedOutput: "True (rel_error < 1e-4)",
                    description: "Verifies analytical gradient using two-sided central difference formula."
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

