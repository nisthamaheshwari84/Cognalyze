/**
 * lib/skills/curriculum/subjects/artificial_intelligence.ts
 * 
 * Classical Artificial Intelligence & Heuristic Search:
 * Uninformed Search (BFS, DFS), Informed Search (A*, Greedy Best-First),
 * Admissible Heuristics, Adversarial Search (Minimax, Alpha-Beta Pruning),
 * and Constraint Satisfaction Problems (CSP).
 */

import { CanonicalSubject } from "../types";

export const ARTIFICIAL_INTELLIGENCE_SUBJECT: CanonicalSubject = {
  slug: "artificial_intelligence",
  name: "Classical Artificial Intelligence & Search",
  icon: "♟️",
  category: "AI & Modern ML",
  tagline: "Heuristic Search, A* Optimality & Adversarial Minimax",
  description: "Master state space search, graph traversal heuristics, admissible Manhattan/Euclidean distances, A* pathfinding, and game tree alpha-beta pruning.",
  estimatedHours: 25,
  prerequisites: ["python", "dsa"],
  chapters: [
    {
      slug: "heuristic-search-and-astar",
      chapterNumber: 1,
      title: "Chapter 1: Informed State Space Search & A*",
      description: "Understand state graphs, cost functions g(n), heuristic estimates h(n), and conditions for A* optimality.",
      topics: [
        {
          slug: "astar-and-admissibility",
          title: "A* Search & Admissible Heuristics",
          summary: "Find guaranteed shortest paths in large state spaces using priority-guided exploration.",
          subtopics: [
            {
              id: "ai-101",
              slug: "astar-search-algorithm",
              title: "Optimal Pathfinding: The A* Evaluation Function f(n) = g(n) + h(n)",
              subjectSlug: "artificial_intelligence",
              chapterSlug: "heuristic-search-and-astar",
              topicSlug: "astar-and-admissibility",
              estimatedMinutes: 30,
              difficulty: "advanced",
              canonicalSkill: "classical_ml_modeling",
              prerequisites: [],
              learningGoal: "Implement A* search with a min-heap priority queue and prove that admissible heuristics guarantee optimal path solutions.",
              intuitiveStory: "Imagine driving across the country with a GPS. Dijkstra's algorithm searches in an ever-expanding circle around your starting city, exploring equally toward the north, south, east, and west. A* search uses your compass heading toward your destination city to focus exploration directly forward.",
              analogy: "Dijkstra is a circular radio ripple; A* is a directed flashlight beam guided by a compass.",
              formalConcept: "A* evaluates nodes via f(n) = g(n) + h(n), where g(n) is the exact cost from start to n, and h(n) is an estimated cost from n to the goal. If h(n) is admissible (never overestimates true cost) and consistent, A* is provably complete and optimal.",
              mathFormula: "f(n) = g(n) + h(n), \\quad \\text{where } 0 \\le h(n) \\le h^*(n) \\; (\\text{Admissibility})",
              productionSignificance: "Powers routing engines in autonomous vehicles, robotics motion planning, and video game pathfinding grids.",
              visualType: "memory_graph",
              mermaidDiagram: `graph LR
    Start["Start Node: g=0, h=10 -> f=10"] --> Pop["Pop Min f(n) from Priority Queue"]
    Pop --> Expand["Expand Neighbors: g(n') = g(n) + cost"]
    Expand --> Calc["Compute f(n') = g(n') + h(n')"]
    Calc --> Push["Push Neighbors to Min-Heap"]
    Push --> Check{"Is Goal Reached?"}
    Check -- "No" --> Pop
    Check -- "Yes" --> Optimal["Reconstruct Optimal Path!"]`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "A* Algorithm on 2D Grid with Manhattan Distance",
                  explanation: "Uses heapq to always expand the node with minimal f(n).",
                  codeOrQuery: `import heapq

def a_star_search(start: tuple, goal: tuple, neighbors_fn) -> list:
    def h(pos): return abs(pos[0] - goal[0]) + abs(pos[1] - goal[1])
    
    pq = [(h(start), 0, start, [start])] # (f, g, current, path)
    visited = {start: 0}
    
    while pq:
        f, g, curr, path = heapq.heappop(pq)
        if curr == goal:
            return path
        for nxt in neighbors_fn(curr):
            new_g = g + 1
            if nxt not in visited or new_g < visited[nxt]:
                visited[nxt] = new_g
                heapq.heappush(pq, (new_g + h(nxt), new_g, nxt, path + [nxt]))
    return []

# 4-way grid neighbors
neighbors = lambda pos: [(pos[0]+dx, pos[1]+dy) for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]]
path = a_star_search((0, 0), (2, 2), neighbors)
print("Shortest path length:", len(path) - 1)`,
                  outputSummary: "Shortest path length: 4 steps"
                }
              ],
              audioNarrationScript: "A* search guarantees finding the shortest path as long as your heuristic is admissible, meaning it never overestimates the actual distance to the goal. Manhattan distance on a grid without diagonal movement is admissible because the shortest possible path is a straight grid line.",
              coBuildSlot: {
                slotId: "ai-slot-101",
                instruction: "Complete Manhattan heuristic: abs(a[0] - b[0]) + abs(a[1] - b[1]).",
                starterSnippet: `def manhattan_distance(a: tuple[int, int], b: tuple[int, int]) -> int:\n    return abs(a[0] - b[0]) + abs(a[1] - b[1])`,
                expectedPattern: "abs\\(a\\[0\\]\\s*-\\s*b\\[0\\]\\)\\s*\\+\\s*abs\\(a\\[1\\]\\s*-\\s*b\\[1\\]\\)",
                hint1: "Sum the absolute horizontal and vertical coordinate deltas.",
                hint2: "Write: return abs(a[0] - b[0]) + abs(a[1] - b[1])",
                validationExplanation: "Correctly computes admissible Manhattan L1 grid metric."
              },
              executionEnvironment: "python_sandbox",
              starterCodeOrQuery: `def manhattan_distance(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1])

p1 = (1, 3)
p2 = (4, 7)
print("Manhattan distance:", manhattan_distance(p1, p2))
`,
              debugFault: {
                faultId: "ai-fault-101",
                title: "Inadmissible Heuristic Causing Suboptimal Pathfinding",
                buggyCodeOrConfig: `def h_inadmissible(pos, goal):
    # Bug: Multiplying distance by 2 overestimates true cost, breaking optimality proof!
    return (abs(pos[0] - goal[0]) + abs(pos[1] - goal[1])) * 2`,
                correctCodeOrConfig: `def h_inadmissible(pos, goal):
    return abs(pos[0] - goal[0]) + abs(pos[1] - goal[1])`,
                diagnosticHint: "An admissible heuristic must never exceed the true remaining cost h*(n).",
                explanation: "Overestimating causes A* to behave like greedy search, sacrificing its optimality guarantee."
              },
              comprehensionChecks: [
                {
                  id: "ai-cc-101a",
                  question: "If heuristic h(n) = 0 for all nodes, what classic algorithm does A* reduce to?",
                  options: [
                    "Depth-First Search (DFS)",
                    "Dijkstra's Algorithm (Uniform Cost Search)",
                    "Breadth-First Search on trees only",
                    "Binary Search"
                  ],
                  correctIndex: 1,
                  explanation: "When h(n) = 0, f(n) = g(n) + 0 = g(n), meaning nodes are evaluated solely on accumulated cost from start, which is identical to Dijkstra's algorithm."
                }
              ],
              independentChallenge: {
                challengeId: "ai-chal-101",
                title: "Grid Obstacle A* Path Solver",
                description: "Write an A* pathfinder that navigates around blocked obstacle cells represented by '#' characters in a 2D string grid.",
                starterCode: `import heapq

def find_path(grid: list[str], start: tuple[int, int], goal: tuple[int, int]) -> int:
    R, C = len(grid), len(grid[0])
    h = lambda r, c: abs(r - goal[0]) + abs(c - goal[1])
    pq = [(h(*start), 0, start[0], start[1])]
    visited = {start: 0}

    while pq:
        f, g, r, c = heapq.heappop(pq)
        if (r, c) == goal:
            return g
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < R and 0 <= nc < C and grid[nr][nc] != '#':
                ng = g + 1
                if (nr, nc) not in visited or ng < visited[(nr, nc)]:
                    visited[(nr, nc)] = ng
                    heapq.heappush(pq, (ng + h(nr, nc), ng, nr, nc))
    return -1
`,
                solutionCode: `import heapq

def find_path(grid: list[str], start: tuple[int, int], goal: tuple[int, int]) -> int:
    R, C = len(grid), len(grid[0])
    h = lambda r, c: abs(r - goal[0]) + abs(c - goal[1])
    pq = [(h(*start), 0, start[0], start[1])]
    visited = {start: 0}

    while pq:
        f, g, r, c = heapq.heappop(pq)
        if (r, c) == goal:
            return g
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < R and 0 <= nc < C and grid[nr][nc] != '#':
                ng = g + 1
                if (nr, nc) not in visited or ng < visited[(nr, nc)]:
                    visited[(nr, nc)] = ng
                    heapq.heappush(pq, (ng + h(nr, nc), ng, nr, nc))
    return -1
`,
                testCases: [
                  {
                    input: "grid=['...', '.#.', '...'], start=(0,0), goal=(2,2)",
                    expectedOutput: "4 steps around obstacle",
                    description: "Finds optimal path avoiding the central obstacle."
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

