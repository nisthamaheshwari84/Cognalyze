/**
 * lib/skills/ai-data/curriculum/agentic-ai-curriculum.ts
 * 
 * Complete Autonomous AI Agents & Multi-Agent Systems Curriculum Decomposition.
 * Granular modules: Agent vs Chatbot, ReAct Loops, Tool Schemas & Function Calling,
 * Short/Long-Term Memory Architectures, State Graphs, Multi-Agent Orchestration,
 * and Production Guardrails.
 */

import { TaxonomyTopic, TaxonomyModule } from "../master-curriculum-taxonomy";

export const AGENTIC_AI_MODULES: TaxonomyModule[] = [
  {
    id: "mod_agents_foundations",
    trackId: "track_agentic_ai",
    title: "Module 1: Agent Architecture, ReAct Loops & Tool Calling",
    description: "Perception-Reasoning-Action cycles, JSON function calling schemas, and sandbox tool execution.",
    order: 1,
    topics: [
      {
        id: "agent-01-react-loop-tools",
        trackId: "track_agentic_ai",
        moduleId: "mod_agents_foundations",
        title: "Autonomous Agents: The ReAct (Reason + Act) Loop & Function Calling",
        order: 1,
        estimatedMinutes: 45,
        difficulty: "advanced",
        prerequisites: ["genai-01-foundations-scaling"],
        roleRelevance: {
          data_analyst: { importance: "HIGH", why: "Text-to-SQL automated agents that query databases and plot charts." },
          data_scientist: { importance: "HIGH", why: "Automated feature engineering and model parameter exploration agents." },
          data_engineer: { importance: "CRITICAL", why: "Self-healing pipeline agents that inspect failing ETL jobs and retry." },
          ml_engineer: { importance: "CRITICAL", why: "Tool-augmented evaluation harnesses and red-teaming agents." },
          mlops_engineer: { importance: "CRITICAL", why: "Automated incident triage and rollback agents." },
          ai_engineer: { importance: "CRITICAL", why: "Core foundation of modern enterprise autonomous AI workers." },
          genai_llm_engineer: { importance: "CRITICAL", why: "Multi-agent orchestration, state graphs, and function-calling schemas." },
          applied_ai_engineer: { importance: "CRITICAL", why: "Building customer-facing agents that interact with external REST APIs." },
        },
        learningObjectives: [
          "Understand the critical difference between a static LLM prompt and an autonomous Agent with environmental feedback loops.",
          "Construct strict JSON Schema definitions for LLM tool calling (function calling).",
          "Implement the ReAct (Reason + Act) loop with state transitions and termination conditions."
        ],
        conceptsCovered: ["ReAct Framework", "Function Calling Schemas", "Tool Execution Sandboxing", "Multi-Step Cycles", "Infinite Loop Guards"],
        subtopics: [
          { id: "agent-01-sub-1", title: "Thought -> Action -> Observation Protocol", order: 1, concepts: ["ReAct Pattern", "Environmental Feedback", "State Updates"] },
          { id: "agent-01-sub-2", title: "JSON Schema Specification for Tool Parameters", order: 2, concepts: ["JSON Schema", "Type Constraints", "Required Fields"] }
        ],
        practicalOutcome: "Construct a functional ReAct Agent in Python with calculator and database lookup tools, complete with execution traces and guardrails.",
        contextAndIntuition: {
          english: "A chatbot only produces text. If you ask it: 'What is our refund total today?', it can only hypothesize. An AI Agent has hands: it perceives the question, reasons that it needs live data, calls a query_database(date='today') tool, reads the returned SQL table, and calculates the response.",
          hinglish: "Chatbot sirf baatein kar sakta hai. Lekin AI Agent ke paas 'haath' hote hain (tools). Agar aap use pucho ki aaj kitne refunds hue, toh wo pehle sochega (Reason), SQL query ka tool call karega (Action), result read karega (Observation), aur fir final answer dega.",
          whyExists: "Enables LLMs to interact with live software, databases, APIs, and real-world execution environments.",
          whatWasUsedBefore: "Rigid deterministic rule trees and hardcoded robotic process automation (RPA)."
        },
        deepExplanation: {
          english: "In modern LLMs, function calling does NOT execute code inside the model. Instead, the model outputs a structured JSON object: `{\"name\": \"run_sql\", \"arguments\": {\"query\": \"SELECT sum(amount) FROM refunds\"}}`. The client application executes this tool in a secure sandbox and feeds the observation result back into the LLM context loop until the model outputs a final answer.",
          hinglish: "Function calling ka matlab yeh nahi ki model khud code run karta hai. Model sirf structured JSON deta hai ki kaunsa tool kis parameter ke sath chalana hai. Aapka Python backend us tool ko run karke result wapas model ko bhejta hai jab tak model final answer na bol de.",
          internalMechanics: "ReAct Loop: `User Input -> [Thought -> Action -> Tool Sandbox -> Observation]* -> Final Answer`.",
          realWorldUsage: "Autonomous customer service agents, automated code generation & test execution, and devops incident responders.",
          commonMistakes: [
            "Allowing an agent to loop infinitely without a max_iterations guardrail (wastes tokens and causes deadlocks).",
            "Executing model-generated tool arguments without schema validation (causes severe security injection vulnerabilities)."
          ]
        },
        visualDemoConfig: {
          type: "AGENT_DAG",
          initialState: {
            goal: "Lookup stock price and calculate 5-day moving average",
            nodes: ["User Prompt", "Reasoning Step", "Tool: fetch_ticker", "Observation", "Final Response"]
          }
        },
        externalResources: [
          {
            id: "res-agent-01",
            creatorOrOrg: "CampusX",
            title: "AI Agents Explained: ReAct Framework, LangChain & Tool Calling",
            topicCovered: "Agent architecture, ReAct loop, tool schemas, and multi-step execution",
            url: "https://www.youtube.com/watch?v=2xxziIWmaSA",
            timestamp: "00:54:10",
            language: "Hinglish",
            difficulty: "advanced",
            whyRecommended: "Comprehensive visual explanation of how tools, memory, and reasoning steps connect.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `def execute_agent_step(llm_tool_call, available_tools):\n    # llm_tool_call is {"name": str, "args": dict}\n    # Call the matching function from available_tools dict and return its result\n    pass`,
        solutionSnippet: `def execute_agent_step(llm_tool_call, available_tools):\n    name = llm_tool_call.get("name")\n    args = llm_tool_call.get("args", {})\n    if name not in available_tools:\n        return {"error": f"Tool '{name}' not found."}\n    return {"observation": available_tools[name](**args)}`
      }
    ]
  },
  {
    id: "mod_agents_orchestration",
    trackId: "track_agentic_ai",
    title: "Module 2: State Graphs, Memory & Multi-Agent Collaboration",
    description: "LangGraph-style state graphs, checkpointers, short/long-term memory, and orchestrator-worker patterns.",
    order: 2,
    topics: [
      {
        id: "agent-02-state-graphs-memory",
        trackId: "track_agentic_ai",
        moduleId: "mod_agents_orchestration",
        title: "State Machine Graphs, Checkpointing & Multi-Agent Coordination",
        order: 1,
        estimatedMinutes: 50,
        difficulty: "advanced",
        prerequisites: ["agent-01-react-loop-tools"],
        roleRelevance: {
          data_analyst: { importance: "HIGH", why: "Multi-step analyst agents that gather data, run statistics, and review chart code." },
          data_scientist: { importance: "CRITICAL", why: "Automating end-to-end data science pipelines with reviewer critique loops." },
          data_engineer: { importance: "CRITICAL", why: "Complex pipeline orchestration with conditional retry state graphs." },
          ml_engineer: { importance: "CRITICAL", why: "Self-correcting code generation harnesses for model deployment." },
          mlops_engineer: { importance: "CRITICAL", why: "Stateful human-in-the-loop deployment approval gates." },
          ai_engineer: { importance: "CRITICAL", why: "Production multi-agent applications (Researcher -> Writer -> Fact-Checker -> Approver)." },
          genai_llm_engineer: { importance: "CRITICAL", why: "Building stateful conversational workflows with persistent session checkpointers." },
          applied_ai_engineer: { importance: "CRITICAL", why: "Integrating asynchronous multi-step agents into web sockets and backends." },
        },
        learningObjectives: [
          "Model complex multi-step workflows as Directed State Graphs with Nodes (actions) and Edges (conditional transitions).",
          "Implement State Checkpointing so long-running agent workflows can be paused, resumed, or rewound.",
          "Design an Orchestrator-Worker pattern with a supervisor agent routing subtasks to specialized worker agents."
        ],
        conceptsCovered: ["State Graphs", "Conditional Edges", "Checkpointers", "Human-in-the-Loop", "Supervisor Pattern", "Memory Reflection"],
        subtopics: [
          { id: "agent-02-sub-1", title: "State Reduction & Node Transitions", order: 1, concepts: ["State Schema", "Reducers", "Immutable Updates"] },
          { id: "agent-02-sub-2", title: "Human-in-the-Loop Approval Interruption", order: 2, concepts: ["Interrupt Node", "Resume Token", "Safety Gate"] }
        ],
        practicalOutcome: "Implement an Orchestrator-Worker multi-agent workflow in Python that coordinates a research node, code generation node, and quality review node.",
        contextAndIntuition: {
          english: "If you give one single prompt to an LLM: 'Write, test, document, and deploy an entire web app', it fails because of context confusion. In engineering teams, you have a lead architect who assigns tasks to a developer, sends the code to a QA engineer, and requires manager approval before deploying. Multi-agent state graphs mimic this exact division of labor.",
          hinglish: "Agar ek hi LLM ko bolo ki sab kuch khud kare, toh wo confuse ho jata hai. Companies mein alag alag roles hote hain: Architect plan banata hai, Developer code likhta hai, aur QA test karta hai. Multi-agent systems mein alag specialized agents ek state graph ke through collaborate karte hain.",
          whyExists: "Breaks complex non-linear problems into deterministic, inspectable, and manageable subtasks.",
          whatWasUsedBefore: "Monolithic giant prompts that hallucinated and failed on multi-step reasoning."
        },
        deepExplanation: {
          english: "A State Graph maintains a centralized typed state object. Nodes are pure functions that accept the current state and return state updates (using reducers). Conditional edges evaluate the state to decide the next node (e.g., if code_has_errors, route back to Developer; else route to Deployer). Checkpointers serialize the state into PostgreSQL or Redis after every node transition, enabling replayability and human approval pauses.",
          hinglish: "State Graph ek central state object maintain karta hai. Nodes pure functions hote hain jo state modify karte hain. Conditional edges decide karte hain ki agla step kya hoga. Checkpointers har step ke baad state ko database mein save karte hain taaki process ko beech mein pause ya resume kiya ja sake.",
          internalMechanics: "State graph engine: `State -> Node(State) -> StateUpdate -> Reducer -> ConditionalEdge(State) -> NextNode`.",
          realWorldUsage: "Autonomous software development systems (e.g., Devin, SWE-bench solvers), medical diagnosis workflows, and loan application approval systems.",
          commonMistakes: [
            "Allowing worker agents to talk to each other directly without a supervisor or centralized state graph (leads to infinite cycles and chaos).",
            "Failing to persist state checkpointers (if the server restarts during a 10-step agent run, all work is lost)."
          ]
        },
        visualDemoConfig: {
          type: "AGENT_DAG",
          initialState: {
            nodes: ["User Input", "Supervisor Plan", "Worker: Fetch Data", "Worker: Analyze", "Reviewer Gate", "Final Response"],
            activeNode: "Reviewer Gate"
          }
        },
        externalResources: [
          {
            id: "res-agent-graph-01",
            creatorOrOrg: "CampusX",
            title: "Multi-Agent Workflows & State Graphs (LangGraph Architecture)",
            topicCovered: "State graphs, conditional edges, supervisor patterns, and human-in-the-loop",
            url: "https://www.youtube.com/watch?v=2xxziIWmaSA",
            timestamp: "01:15:00",
            language: "Hinglish",
            difficulty: "advanced",
            whyRecommended: "Clear visual diagram of cyclic state machines vs linear chains.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `def route_next_step(state):\n    # state is {"code": str, "tests_passed": bool, "attempts": int}\n    # If tests_passed is True, return "DEPLOY"\n    # If attempts >= 3, return "ESCALATE_HUMAN"\n    # Otherwise return "REWRITE_CODE"\n    pass`,
        solutionSnippet: `def route_next_step(state):\n    if state.get("tests_passed"): \n        return "DEPLOY"\n    if state.get("attempts", 0) >= 3:\n        return "ESCALATE_HUMAN"\n    return "REWRITE_CODE"`
      }
    ]
  }
];

