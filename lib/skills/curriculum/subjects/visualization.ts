/**
 * lib/skills/curriculum/subjects/visualization.ts
 * 
 * Data Visualization & Visual Analytics:
 * Matplotlib & Seaborn, Figure/Axes architecture, univariate distributions,
 * correlation heatmaps, facet grids, and publication styling.
 */

import { CanonicalSubject } from "../types";

export const VISUALIZATION_SUBJECT: CanonicalSubject = {
  slug: "visualization",
  name: "Data Visualization & Visual Analytics",
  icon: "📈",
  category: "Programming & Data Stack",
  tagline: "Matplotlib, Seaborn, Distribution Plots & Executive Dashboards",
  description: "Master visual storytelling and scientific plotting: Figure and Axes hierarchies, kernel density estimations (KDE), correlation matrices, and customized statistical charts.",
  estimatedHours: 20,
  prerequisites: ["python", "pandas"],
  chapters: [
    {
      slug: "plotting-foundations",
      chapterNumber: 1,
      title: "Chapter 1: Figure & Axes Object-Oriented Architecture",
      description: "Master Matplotlib's explicit object-oriented API (fig, ax), subplots, and publication-ready formatting.",
      topics: [
        {
          slug: "fig-ax-architecture",
          title: "The Object-Oriented Matplotlib API: Figure vs Axes",
          summary: "Avoid stateful pyplot bugs by explicitly controlling Figure canvases and Axes viewports.",
          subtopics: [
            {
              id: "viz-101",
              slug: "matplotlib-figure-axes-hierarchy",
              title: "Canvas Control: The Figure, Axes, and Spines Object Hierarchy",
              subjectSlug: "visualization",
              chapterSlug: "plotting-foundations",
              topicSlug: "fig-ax-architecture",
              estimatedMinutes: 25,
              difficulty: "beginner",
              canonicalSkill: "exploratory_data_analysis",
              prerequisites: [],
              learningGoal: "Utilize plt.subplots() to generate clean multi-panel layouts with custom labels, gridlines, and twin axes.",
              intuitiveStory: "Think of an art gallery. The 'Figure' is the entire wooden frame hanging on the wall. The 'Axes' are the individual canvas paintings mounted inside the frame. One frame can hold two, four, or six distinct paintings.",
              analogy: "Figure is the canvas board; Axes is the coordinate system where data is drawn.",
              formalConcept: "The pyplot state-machine interface (plt.plot) tracks an implicit 'current' figure and axis, which introduces subtle state bleed across cells or threads. The object-oriented interface fig, ax = plt.subplots() gives deterministic, thread-safe references to each plotting area.",
              productionSignificance: "In automated PDF report generation and ML monitoring servers, implicit pyplot state creates memory leaks and cross-request chart pollution.",
              visualType: "distribution",
              mermaidDiagram: `graph TD
    Fig["Figure Object: The Master Canvas Container"] --> Ax1["Axes 1: Subplot (1, 2, 1) Line Chart"]
    Fig --> Ax2["Axes 2: Subplot (1, 2, 2) Histogram"]
    Ax1 --> Spines["Spines, Ticks, XLabel, YLabel"]
    Ax2 --> Hist["Bars, KDE Curve, Legend"]`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "Creating Multi-Panel Figures with Object-Oriented Syntax",
                  explanation: "Generates 2 distinct viewports side-by-side with explicit formatting.",
                  codeOrQuery: `import matplotlib.pyplot as plt

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))
ax1.plot([1, 2, 3], [10, 20, 25], color="teal", marker="o")
ax1.set_title("User Growth")
ax1.set_xlabel("Quarter")

ax2.bar(["A", "B", "C"], [40, 60, 20], color="coral")
ax2.set_title("Churn by Plan")
plt.tight_layout()
print("Figure created with 2 independent axes.")`,
                  outputSummary: "Figure created with 2 independent axes."
                }
              ],
              audioNarrationScript: "Always use fig, ax = plt.subplots rather than calling plt.plot directly. The object-oriented API gives you complete, predictable control over multi-panel layouts, secondary axes, and typography, while avoiding shared state bugs in production web applications.",
              coBuildSlot: {
                slotId: "viz-slot-101",
                instruction: "Complete the subplots initialization: fig, ax = plt.subplots(figsize=(8, 5)).",
                starterSnippet: `import matplotlib.pyplot as plt\ndef init_canvas():\n    fig, ax = plt.subplots(figsize=(8, 5))\n    return fig, ax`,
                expectedPattern: "fig,\\s*ax\\s*=\\s*plt\\.subplots\\(",
                hint1: "Use plt.subplots(figsize=(8, 5)).",
                hint2: "Write: fig, ax = plt.subplots(figsize=(8, 5))",
                validationExplanation: "Correctly instantiates Figure and Axes pair."
              },
              executionEnvironment: "python_sandbox",
              starterCodeOrQuery: `import matplotlib.pyplot as plt
fig, ax = plt.subplots(figsize=(6, 4))
ax.plot([0, 1, 2], [0, 1, 4], label="Quadratic")
ax.set_title("Parabola")
ax.legend()
print("Canvas initialized successfully.")
`,
              debugFault: {
                faultId: "viz-fault-101",
                title: "Memory Leak via Unclosed Pyplot Figures",
                buggyCodeOrConfig: `import matplotlib.pyplot as plt
def generate_chart_bytes(data):
    # Bug: Creating figures with plt.figure() without plt.close(fig) leaks memory in long-running servers
    fig, ax = plt.subplots()
    ax.plot(data)
    return "bytes"`,
                correctCodeOrConfig: `import matplotlib.pyplot as plt
def generate_chart_bytes(data):
    fig, ax = plt.subplots()
    ax.plot(data)
    plt.close(fig) # Releases canvas memory buffer immediately
    return "bytes"`,
                diagnosticHint: "Always call plt.close(fig) after saving or rendering charts to avoid memory exhaustion.",
                explanation: "Matplotlib retains references to all generated figures in a global cache until plt.close() is called."
              },
              comprehensionChecks: [
                {
                  id: "viz-cc-101a",
                  question: "Why should backend web servers avoid the implicit `plt.plot()` state machine?",
                  options: [
                    "Because it is not thread-safe and retains ungarbage-collected figures in memory.",
                    "Because Matplotlib only works with GPUs.",
                    "Because `plt.plot()` requires root permissions.",
                    "Because line plots cannot have colors."
                  ],
                  correctIndex: 0,
                  explanation: "The global pyplot state machine is not thread-safe and keeps figure objects in global memory until explicitly closed."
                }
              ],
              independentChallenge: {
                challengeId: "viz-chal-101",
                title: "Correlation Heatmap Annotator",
                description: "Write a function format_correlation_matrix(matrix) that checks matrix symmetry and rounds values to 2 decimals.",
                starterCode: `def format_correlation_matrix(matrix: list[list[float]]) -> list[list[float]]:
    return [[round(val, 2) for val in row] for row in matrix]
`,
                solutionCode: `def format_correlation_matrix(matrix: list[list[float]]) -> list[list[float]]:
    return [[round(val, 2) for val in row] for row in matrix]
`,
                testCases: [
                  {
                    input: "[[1.0, 0.856], [0.856, 1.0]]",
                    expectedOutput: "[[1.0, 0.86], [0.86, 1.0]]",
                    description: "Rounds correlation coefficients accurately."
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

