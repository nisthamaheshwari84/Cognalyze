/**
 * lib/skills/curriculum/subjects/numpy.ts
 * 
 * NumPy Numerical Computing Curriculum:
 * Vectors, Strides, Broadcasting Mechanics, Linear Algebra, and SIMD performance.
 */

import { CanonicalSubject } from "../types";

export const NUMPY_SUBJECT: CanonicalSubject = {
  slug: "numpy",
  name: "NumPy & High-Performance Numerical Computing",
  icon: "📐",
  category: "Programming & Data Stack",
  tagline: "SIMD Vectorization, Contiguous C-Arrays & Matrix Algebra",
  description: "Master ndarrays, memory strides, broadcasting rules, matrix decompositions, and high-throughput numerical computing that underpins modern AI.",
  estimatedHours: 25,
  prerequisites: ["python"],
  chapters: [
    {
      slug: "ndarrays-and-memory",
      chapterNumber: 1,
      title: "Chapter 1: The ndarray Architecture & Strides",
      description: "Understand contiguous buffer allocation, pointer arithmetic, strides, and memory layouts (C vs Fortran order).",
      topics: [
        {
          slug: "vectorization-broadcasting",
          title: "Broadcasting Rules & Vectorized Arithmetic",
          summary: "Execute elementwise operations across multi-dimensional arrays without memory duplication.",
          subtopics: [
            {
              id: "np-101",
              slug: "broadcasting-mechanics-and-strides",
              title: "The NumPy Broadcasting Protocol: Zero-Copy Dimension Stretching",
              subjectSlug: "numpy",
              chapterSlug: "ndarrays-and-memory",
              topicSlug: "vectorization-broadcasting",
              estimatedMinutes: 25,
              difficulty: "intermediate",
              canonicalSkill: "python_data_stack",
              prerequisites: [],
              learningGoal: "Apply NumPy broadcasting rules across differing shapes and verify that stride=0 prevents memory duplication.",
              intuitiveStory: "Imagine an industrial stamp press. Instead of stamping 1,000 individual letters one by one with a handheld stamp, the mechanical press stamps an entire grid in one downward stroke.",
              analogy: "Broadcasting is like aligning transparent projector slides: dimensions with size 1 stretch across the target dimension with zero added paper.",
              formalConcept: "Two dimensions are compatible for broadcasting if they are equal, or one of them is 1. When dimension size is 1, NumPy sets the memory stride along that axis to 0, reading the same memory repeatedly without copying.",
              mathFormula: "y_{i,j} = x_{i,j} - \\mu_j, \\quad \\text{where } \\mathbf{x} \\in \\mathbb{R}^{N \\times D}, \\; \\boldsymbol{\\mu} \\in \\mathbb{R}^{D}",
              productionSignificance: "Feature normalization in machine learning models runs 50x-100x faster than explicit nested Python loops by invoking CPU SIMD vector instructions.",
              visualType: "dataframe",
              mermaidDiagram: `graph TD
    Matrix["Matrix (3, 4)<br/>Values: 3 rows, 4 cols"]
    Vector["Vector (4,)<br/>Prepends 1 -> (1, 4)"]
    Broad["Stride Along Axis 0 = 0 Bytes"]
    Output["Result Matrix (3, 4)<br/>Vector subtracted from every row"]
    Matrix --> Output
    Vector --> Broad --> Output`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "Normalizing a feature matrix with column means",
                  explanation: "Subtracting shape (D,) from shape (N, D) broadcasts across all N rows automatically.",
                  codeOrQuery: "import numpy as np\nX = np.array([[10.0, 20.0], [30.0, 40.0], [50.0, 60.0]])\nmu = np.mean(X, axis=0)\nnormalized = X - mu\nprint('Mean vector:', mu)\nprint('Normalized:\\n', normalized)",
                  outputSummary: "Mean: [30., 40.], Normalized: [[-20., -20.], [0., 0.], [20., 20.]]"
                }
              ],
              audioNarrationScript: "Broadcasting compares array shapes from right to left. If two dimensions are equal, or if one of them is one, they are compatible. If a dimension is missing in one array, NumPy prepends a dimension of size one. It then stretches the size one dimension by setting its stride to zero.",
              coBuildSlot: {
                slotId: "np-slot-101",
                instruction: "Complete min_max_scale(mat) using NumPy to normalize columns between 0.0 and 1.0 using axis=0.",
                starterSnippet: `import numpy as np\ndef min_max_scale(mat: np.ndarray) -> np.ndarray:\n    c_min = np.min(mat, axis=0)\n    c_max = np.max(mat, axis=0)\n    denom = np.where(c_max - c_min == 0, 1.0, c_max - c_min)\n    return (mat - c_min) / denom`,
                expectedPattern: "np\\.min.*axis\\s*=\\s*0.*np\\.max.*axis\\s*=\\s*0",
                hint1: "Compute c_min = np.min(mat, axis=0) and c_max = np.max(mat, axis=0).",
                hint2: "Return (mat - c_min) / (c_max - c_min).",
                validationExplanation: "Correctly computes column extremes along axis=0 and broadcasts normalization."
              },
              executionEnvironment: "python_sandbox",
              starterCodeOrQuery: `import numpy as np
def min_max_scale(mat: np.ndarray) -> np.ndarray:
    c_min = np.min(mat, axis=0)
    c_max = np.max(mat, axis=0)
    denom = np.where(c_max - c_min == 0, 1.0, c_max - c_min)
    return (mat - c_min) / denom

sample = np.array([[10, 200], [20, 400], [30, 600]], dtype=float)
print(min_max_scale(sample))
`,
              debugFault: {
                faultId: "np-fault-101",
                title: "Normalizing across wrong axis (axis=1 instead of axis=0)",
                buggyCodeOrConfig: `import numpy as np
def standardize(mat: np.ndarray) -> np.ndarray:
    # Bug: axis=1 computes row mean instead of feature column mean
    mean = np.mean(mat, axis=1)
    std = np.std(mat, axis=1)
    return (mat - mean) / std`,
                correctCodeOrConfig: `import numpy as np
def standardize(mat: np.ndarray) -> np.ndarray:
    mean = np.mean(mat, axis=0)
    std = np.std(mat, axis=0)
    std = np.where(std == 0, 1.0, std)
    return (mat - mean) / std`,
                diagnosticHint: "In tabular machine learning, samples are rows and features are columns; statistics must aggregate along axis=0.",
                explanation: "Using axis=0 reduces across rows, yielding a (D,) shape that broadcasts across all samples."
              },
              comprehensionChecks: [
                {
                  id: "np-cc-101a",
                  question: "Can an array of shape (4, 1, 8) broadcast with an array of shape (2, 8)?",
                  options: [
                    "No, because the dimensions have different rank.",
                    "Yes, resulting in a broadcasted shape of (4, 2, 8).",
                    "No, because 4 and 2 are incompatible.",
                    "Yes, but only if Fortran contiguous order is set."
                  ],
                  correctIndex: 1,
                  explanation: "Right to left: 8 == 8 (compatible), 1 and 2 (1 stretches to 2), 4 and (implicit 1) (stretches to 4). Final shape is (4, 2, 8)."
                }
              ],
              independentChallenge: {
                challengeId: "np-chal-101",
                title: "Euclidean Distance Matrix via Broadcasting",
                description: "Compute the pairwise Euclidean distance matrix between two point clouds A (N, D) and B (M, D) without explicit Python for-loops.",
                starterCode: `import numpy as np
def pairwise_distance(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    # A has shape (N, D), B has shape (M, D)
    # Target output shape: (N, M)
    diff = A[:, np.newaxis, :] - B[np.newaxis, :, :] # (N, M, D)
    return np.sqrt(np.sum(diff ** 2, axis=-1))
`,
                solutionCode: `import numpy as np
def pairwise_distance(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    diff = A[:, np.newaxis, :] - B[np.newaxis, :, :]
    return np.sqrt(np.sum(diff ** 2, axis=-1))
`,
                testCases: [
                  {
                    input: "A=[[0,0], [1,1]], B=[[0,0]]",
                    expectedOutput: "[[0.0], [1.41421356]]",
                    description: "Calculates correct pairwise L2 norms."
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

