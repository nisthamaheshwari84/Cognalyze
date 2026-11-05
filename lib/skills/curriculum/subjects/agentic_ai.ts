/**
 * lib/skills/curriculum/subjects/agentic_ai.ts
 * 
 * Agentic AI & Autonomous Systems Curriculum:
 * ReAct (Reasoning + Acting) loops, JSON Tool Calling, Multi-Agent Workflows,
 * DAG Cycle Prevention, Working Memory, Planning, and Loop Guardrails.
 */

import { CanonicalSubject } from "../types";

export const AGENTIC_AI_SUBJECT: CanonicalSubject = {
  slug: "agentic_ai",
  name: "Agentic AI & Multi-Agent Systems",
  icon: "🤖",
  category: "AI & Modern ML",
  tagline: "ReAct Loops, Deterministic Tool Calling & Multi-Agent DAGs",
  description: "Master autonomous AI systems: structured ReAct loops, tool calling schemas, multi-agent state machines, cycle detection, short/long-term memory, and defensive execution guardrails.",
  estimatedHours: 35,
  prerequisites: ["python", "genai_llm"],
  chapters: [
    {
      slug: "react-and-tool-calling",
      chapterNumber: 1,
      title: "Chapter 1: The ReAct Loop & Autonomous Tool Execution",
      description: "Implement the Thought-Action-Observation cycle with structured tool parsing, execution sandboxes, and termination condition guarantees.",
      topics: [
        {
          slug: "react-cycle-and-execution",
          title: "The ReAct Loop: Reasoning, Action & Observation",
          summary: "Coordinate autonomous step-by-step reasoning with deterministic real-world tool execution.",
          subtopics: [
            {
              id: "ag-101",
              slug: "react-loop-state-machine",
              title: "Autonomous Execution: Thought-Action-Observation State Machines & Step Gating",
              subjectSlug: "agentic_ai",
              chapterSlug: "react-and-tool-calling",
              topicSlug: "react-cycle-and-execution",
              estimatedMinutes: 30,
              difficulty: "advanced",
              canonicalSkill: "ai_agents_and_tool_calling",
              prerequisites: [],
              learningGoal: "Construct an autonomous ReAct loop state machine with explicit step limits, cycle detection, and tool parameter validation.",
              intuitiveStory: "A chef does not open all spice jars at once. They taste the sauce (Thought), decide it needs salt (Action), add a pinch, and taste it again (Observation). The agent loops between thinking and acting until the recipe is complete.",
              analogy: "A ReAct agent is a detective following clues one by one, inspecting physical evidence before deciding which door to open next.",
              formalConcept: "The ReAct paradigm interleaves reasoning traces ('Thought') with task-specific actions ('Action' + Tool Name + Parameters) and environment observations ('Observation'). The loop terminates when a 'Finish' action is emitted or maximum steps N are reached.",
              mathFormula: "S_{t+1} = \\text{LLM}(q, \\tau_1, a_1, o_1, \\dots, \\tau_t, a_t, o_t), \\quad \\text{Step Count } t \\le T_{\\max}",
              productionSignificance: "Without strict step limits and cycle detection, autonomous agents can enter infinite loops, generating thousands of dollars in redundant API calls in minutes.",
              visualType: "agent_dag",
              mermaidDiagram: `graph TD
    User["User Goal: 'What is refund status for order 982?'"] --> T1["Thought 1: 'I need to query the orders database'"]
    T1 --> A1["Action 1: Tool 'lookup_order(id=982)'"]
    A1 --> Env["Environment Execution: SQLite Sandbox"]
    Env --> O1["Observation 1: '{ status: REFUNDED, amount: 45.00 }'"]
    O1 --> T2["Thought 2: 'I have the status. I can answer.'"]
    T2 --> Fin["Action: Finish('Order 982 was refunded $45.00')"]`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "Bounded ReAct Dispatch Loop",
                  explanation: "Executes tool calls deterministically while guarding against infinite step cycles.",
                  codeOrQuery: `def execute_agent_loop(goal: str, tools: dict, max_steps: int = 5) -> str:
    history = [f"Goal: {goal}"]
    for step in range(1, max_steps + 1):
        # Simulated agent decision
        if step == 1:
            action, args = "fetch_order", {"id": 101}
            obs = tools[action](**args)
            history.append(f"Observation: {obs}")
        else:
            return f"Order 101 is delivered. History steps: {step}"
    return "Timeout: Maximum steps exceeded."

tools = {"fetch_order": lambda id: {"id": id, "status": "DELIVERED"}}
print(execute_agent_loop("Check status of order 101", tools))`,
                  outputSummary: "Order 101 is delivered. History steps: 2"
                }
              ],
              audioNarrationScript: "An autonomous agent requires three non-negotiable safety guardrails: a hard cap on maximum execution steps, an execution sandbox for external tool calls, and a cycle detector that aborts if the agent invokes the exact same tool with identical parameters multiple times without new information.",
              coBuildSlot: {
                slotId: "ag-slot-101",
                instruction: "Complete the cycle check: if (tool_name, str(params)) in seen_actions: raise RuntimeError('Infinite loop detected').",
                starterSnippet: `seen_actions = set()\ndef check_cycle(tool: str, params: dict):\n    sig = (tool, str(sorted(params.items())))\n    if sig in seen_actions:\n        raise RuntimeError("Agent cycle detected")\n    seen_actions.add(sig)`,
                expectedPattern: "if\\s+sig\\s+in\\s+seen_actions:\\s*raise\\s+RuntimeError",
                hint1: "Check if the action signature already exists in seen_actions.",
                hint2: "Write: if sig in seen_actions: raise RuntimeError('Agent cycle detected')",
                validationExplanation: "Correctly detects duplicate tool invocations to abort repetitive cycles."
              },
              executionEnvironment: "agent_builder",
              starterCodeOrQuery: `seen_actions = set()

def record_action(tool: str, params: dict):
    sig = (tool, str(sorted(params.items())))
    if sig in seen_actions:
        raise RuntimeError(f"Agent cycle detected for tool {tool} with params {params}")
    seen_actions.add(sig)
    return "Action approved"

print(record_action("search", {"q": "python"}))
try:
    print(record_action("search", {"q": "python"}))
except RuntimeError as e:
    print("Caught expected cycle guardrail:", e)
`,
              debugFault: {
                faultId: "ag-fault-101",
                title: "Unbounded Loop Lacking Step Counter Guard",
                buggyCodeOrConfig: `def run_agent(task, tool_runner):
    # Bug: while True without max_steps causes infinite billing drain on ambiguous tasks
    while True:
        action = tool_runner.get_next_action()
        if action.name == "finish": return action.result
        tool_runner.execute(action)`,
                correctCodeOrConfig: `def run_agent(task, tool_runner, max_steps=10):
    for step in range(max_steps):
        action = tool_runner.get_next_action()
        if action.name == "finish": return action.result
        tool_runner.execute(action)
    raise TimeoutError(f"Agent exceeded maximum allowed step budget ({max_steps})")`,
                diagnosticHint: "Always use a bounded for-loop with max_steps rather than while True.",
                explanation: "Defensive engineering requires a strict bounding budget on tool executions and LLM invocations."
              },
              comprehensionChecks: [
                {
                  id: "ag-cc-101a",
                  question: "What is the primary purpose of interleaving 'Thought' traces before 'Action' in ReAct?",
                  options: [
                    "To slow down the agent so humans can read it.",
                    "To allow the model to plan, decompose complex goals, and synthesize observations before selecting the next tool call.",
                    "To generate markdown formatting.",
                    "Because Python requires comments."
                  ],
                  correctIndex: 1,
                  explanation: "Empirical research (Yao et al., 2022) demonstrates that prompting models to generate verbal reasoning traces drastically reduces hallucinated tool arguments and improves task completion rates."
                }
              ],
              independentChallenge: {
                challengeId: "ag-chal-101",
                title: "Directed Acyclic Graph (DAG) Cycle Detector",
                description: "Implement a cycle detector for multi-agent workflows: given a dictionary representing workflow transitions {node: [children]}, return True if an execution cycle exists.",
                starterCode: `def has_workflow_cycle(graph: dict[str, list[str]]) -> bool:
    visited = set()
    rec_stack = set()

    def dfs(node: str) -> bool:
        visited.add(node)
        rec_stack.add(node)
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                if dfs(neighbor): return True
            elif neighbor in rec_stack:
                return True
        rec_stack.remove(node)
        return False

    for node in graph:
        if node not in visited:
            if dfs(node): return True
    return False
`,
                solutionCode: `def has_workflow_cycle(graph: dict[str, list[str]]) -> bool:
    visited = set()
    rec_stack = set()

    def dfs(node: str) -> bool:
        visited.add(node)
        rec_stack.add(node)
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                if dfs(neighbor): return True
            elif neighbor in rec_stack:
                return True
        rec_stack.remove(node)
        return False

    for node in graph:
        if node not in visited:
            if dfs(node): return True
    return False
`,
                testCases: [
                  {
                    input: "graph={'A': ['B'], 'B': ['C'], 'C': ['A']}",
                    expectedOutput: "True (Cycle A->B->C->A)",
                    description: "Accurately detects recursive cycles in agent dependency graphs."
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

