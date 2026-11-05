"use client";

import React, { useState, Suspense, useMemo } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { useTheme } from "@/components/ThemeProvider";
import {
  AgentWorkflow,
  AgentNode,
  AgentNodeType,
  AgentExecutionResult,
  AgentAssessmentReport,
  BUILTIN_AGENT_TOOLS,
  validateAgentWorkflow
} from "@/lib/skills/ai-data/agent-builder-engine";

const STARTER_TEMPLATES: Record<string, { name: string; description: string; workflow: AgentWorkflow }> = {
  customer_support: {
    name: "Customer Support Routing Agent",
    description: "Evaluates incoming customer issues, performs knowledge search, and formats structured responses.",
    workflow: {
      id: "wf-customer-support",
      name: "Customer Support Router & Responder",
      description: "Automated intent routing and knowledge search",
      nodes: [
        {
          id: "node-in",
          label: "Customer Query Input",
          type: "input",
          config: { promptTemplate: "Incoming user support inquiry." }
        },
        {
          id: "node-filter",
          label: "Guardrail Validator",
          type: "validation",
          config: { systemPrompt: "Check for prohibited keywords or malicious inputs." }
        },
        {
          id: "node-model",
          label: "Intent Classifier & Router",
          type: "model",
          config: { model: "gemini-1.5-flash", systemPrompt: "Classify intent and call appropriate knowledge retrieval tool." }
        },
        {
          id: "node-retrieval",
          label: "Knowledge Base Search",
          type: "retrieval",
          config: { toolName: "knowledge_search" }
        },
        {
          id: "node-format",
          label: "Response Synthesizer",
          type: "structured_output",
          config: { outputSchema: '{\n  "resolution": "string",\n  "status": "resolved | escalated"\n}' }
        },
        {
          id: "node-out",
          label: "Final Customer Response",
          type: "output",
          config: {}
        }
      ],
      edges: [
        { id: "e1", source: "node-in", target: "node-filter" },
        { id: "e2", source: "node-filter", target: "node-model" },
        { id: "e3", source: "node-model", target: "node-retrieval" },
        { id: "e4", source: "node-retrieval", target: "node-format" },
        { id: "e5", source: "node-format", target: "node-out" }
      ]
    }
  },
  financial_auditor: {
    name: "Financial Risk Auditor Agent",
    description: "Queries transactional database, calculates risk ratios with safe calculator, and triggers approval gates.",
    workflow: {
      id: "wf-financial-auditor",
      name: "Financial Risk Auditor",
      description: "Financial anomaly and risk verification",
      nodes: [
        {
          id: "node-in",
          label: "Audit Trigger Input",
          type: "input",
          config: { promptTemplate: "Audit request containing account ID and threshold." }
        },
        {
          id: "node-db",
          label: "Account Balance DB Lookup",
          type: "tool",
          config: { toolName: "database_lookup" }
        },
        {
          id: "node-calc",
          label: "Ratio Calculator",
          type: "tool",
          config: { toolName: "calculator" }
        },
        {
          id: "node-branch",
          label: "Risk Threshold Condition",
          type: "branch",
          config: { condition_field: "tool_needed" }
        },
        {
          id: "node-out",
          label: "Audit Report Output",
          type: "output",
          config: {}
        }
      ],
      edges: [
        { id: "e1", source: "node-in", target: "node-db" },
        { id: "e2", source: "node-db", target: "node-calc" },
        { id: "e3", source: "node-calc", target: "node-branch" },
        { id: "e4", source: "node-branch", target: "node-out" }
      ]
    }
  }
};

const NODE_TYPE_COLORS: Record<AgentNodeType, { bg: string; border: string; text: string; icon: string }> = {
  input: { bg: "#EFF6FF", border: "#3B82F6", text: "#1D4ED8", icon: "📥" },
  prompt: { bg: "#F5F3FF", border: "#8B5CF6", text: "#6D28D9", icon: "📝" },
  model: { bg: "#EEF2FF", border: "#6366F1", text: "#4338CA", icon: "🧠" },
  structured_output: { bg: "#ECFDF5", border: "#10B981", text: "#047857", icon: "📋" },
  tool: { bg: "#FFFBEB", border: "#F59E0B", text: "#B45309", icon: "🛠️" },
  retrieval: { bg: "#F0FDF4", border: "#22C55E", text: "#15803D", icon: "🔍" },
  branch: { bg: "#FFF1F2", border: "#F43F5E", text: "#BE123C", icon: "🔀" },
  memory: { bg: "#FAF5FF", border: "#A855F7", text: "#7E22CE", icon: "💾" },
  validation: { bg: "#FEF2F2", border: "#EF4444", text: "#B91C1C", icon: "🛡️" },
  retry: { bg: "#FFF7ED", border: "#F97316", text: "#C2410C", icon: "🔁" },
  output: { bg: "#F1F5F9", border: "#64748B", text: "#334155", icon: "📤" },
  evaluation: { bg: "#F3F4F6", border: "#4B5563", text: "#1F2937", icon: "⚖️" }
};

const toolsList = Object.values(BUILTIN_AGENT_TOOLS);

function AgentBuilderContent() {
  const { isDark } = useTheme();

  const [activeTemplate, setActiveTemplate] = useState<string>("customer_support");
  const [workflow, setWorkflow] = useState<AgentWorkflow>(STARTER_TEMPLATES.customer_support.workflow);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("node-model");
  const [testInput, setTestInput] = useState<string>("What is your return and refund policy for damaged electronics?");
  const [executing, setExecuting] = useState<boolean>(false);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<AgentExecutionResult | null>(null);
  const [assessmentReport, setAssessmentReport] = useState<AgentAssessmentReport | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<"canvas" | "trace" | "evaluation" | "tools">("canvas");

  const selectedNode = useMemo(() => {
    return workflow.nodes.find((n) => n.id === selectedNodeId) || workflow.nodes[0];
  }, [workflow, selectedNodeId]);

  const validation = useMemo(() => {
    return validateAgentWorkflow(workflow);
  }, [workflow]);

  const handleTemplateChange = (tmplKey: string) => {
    if (STARTER_TEMPLATES[tmplKey]) {
      setActiveTemplate(tmplKey);
      setWorkflow(JSON.parse(JSON.stringify(STARTER_TEMPLATES[tmplKey].workflow)));
      setSelectedNodeId(STARTER_TEMPLATES[tmplKey].workflow.nodes[0]?.id || "");
      setExecutionResult(null);
      setAssessmentReport(null);
    }
  };

  const handleAddNode = (type: AgentNodeType) => {
    const newId = `node-${Math.random().toString(36).substring(2, 8)}-${Date.now().toString(36)}`;
    const newNode: AgentNode = {
      id: newId,
      label: `New ${type.replace(/_/g, " ")}`,
      type,
      config: {
        systemPrompt: "Node instructions...",
        model: "gemini-1.5-flash"
      }
    };
    setWorkflow((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
    setSelectedNodeId(newId);
  };

  const handleDeleteNode = (id: string) => {
    if (workflow.nodes.length <= 1) return;
    const remaining = workflow.nodes.filter((n) => n.id !== id);
    setWorkflow((prev) => ({
      ...prev,
      nodes: remaining,
      edges: prev.edges.filter((e) => e.source !== id && e.target !== id)
    }));
    if (selectedNodeId === id) {
      setSelectedNodeId(remaining[0]?.id || "");
    }
  };

  const handleConnectNodes = (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;
    const fromExists = workflow.nodes.some((n) => n.id === fromId);
    const toExists = workflow.nodes.some((n) => n.id === toId);
    if (!fromExists || !toExists) return;
    const exists = workflow.edges.some((e) => e.source === fromId && e.target === toId);
    if (!exists) {
      const edgeId = `e-${Math.random().toString(36).substring(2, 8)}-${Date.now().toString(36)}`;
      setWorkflow((prev) => ({
        ...prev,
        edges: [...prev.edges, { id: edgeId, source: fromId, target: toId }]
      }));
    }
  };

  const handleRemoveEdge = (edgeId: string) => {
    setWorkflow((prev) => ({
      ...prev,
      edges: prev.edges.filter((e) => e.id !== edgeId)
    }));
  };

  const handleRunWorkflow = async () => {
    setExecuting(true);
    setActiveViewTab("trace");
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute_agent_workflow",
          workflow,
          input: { query: testInput }
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setExecutionResult(data.result);
      } else {
        alert(data.error || "Failed to execute agent workflow");
      }
    } catch (err: any) {
      alert("Execution error: " + err.message);
    } finally {
      setExecuting(false);
    }
  };

  const handleEvaluateWorkflow = async () => {
    setEvaluating(true);
    setActiveViewTab("evaluation");
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate_agent_workflow",
          workflow
        })
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        setAssessmentReport(data.evaluation);
      } else {
        alert(data.error || "Evaluation failed");
      }
    } catch (err: any) {
      alert("Evaluation error: " + err.message);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#0A0F1D" : "#F7F9FC",
        color: isDark ? "#F2F6FC" : "#17191C",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      <AppNav role="student" />

      {/* ── TOP HEADER / BREADCRUMB ── */}
      <header
        style={{
          borderBottom: `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`,
          backgroundColor: isDark ? "#0E1726" : "#FFFFFF",
          padding: "12px 24px",
          position: "sticky",
          top: 56,
          zIndex: 30
        }}
      >
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <Link href="/student/skills/ai-data" style={{ color: "#667085", textDecoration: "none", fontSize: 11.5, fontWeight: 600 }}>
                ← AI, Data & Intelligence Arena
              </Link>
              <span style={{ color: "#98A2B3" }}>/</span>
              <span style={{ color: "#356AE6", fontSize: 11.5, fontWeight: 700 }}>Visual AI Agent Builder</span>
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: isDark ? "#FFFFFF" : "#162A43", display: "flex", alignItems: "center", gap: 8 }}>
              <span>🤖</span> Visual AI Agent Builder & Autonomous Runtime
            </h1>
          </div>

          {/* Quick template selector and actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <span style={{ color: "#64748B", fontWeight: 600 }}>Template:</span>
              <select
                value={activeTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "6px 10px",
                  borderRadius: 6,
                  backgroundColor: isDark ? "#16253C" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
                  color: isDark ? "#FFFFFF" : "#1E293B"
                }}
              >
                <option value="customer_support">Customer Support Router</option>
                <option value="financial_auditor">Financial Risk Auditor</option>
              </select>
            </div>

            <button
              onClick={handleRunWorkflow}
              disabled={executing || !validation.isValid}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "7px 16px",
                borderRadius: 6,
                backgroundColor: validation.isValid ? "#10B981" : "#94A3B8",
                color: "#FFFFFF",
                border: "none",
                cursor: validation.isValid && !executing ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              {executing ? "Running..." : "▶ Run Agent Trace"}
            </button>

            <button
              onClick={handleEvaluateWorkflow}
              disabled={evaluating || !validation.isValid}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "7px 16px",
                borderRadius: 6,
                backgroundColor: validation.isValid ? "#356AE6" : "#94A3B8",
                color: "#FFFFFF",
                border: "none",
                cursor: validation.isValid && !evaluating ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              {evaluating ? "Evaluating..." : "⚖️ Evaluate Robustness"}
            </button>
          </div>
        </div>
      </header>

      {/* ── VALIDATION WARNING BANNER IF INVALID ── */}
      {!validation.isValid && (
        <div
          style={{
            backgroundColor: "#FEF2F2",
            borderBottom: "1px solid #F87171",
            padding: "8px 24px",
            fontSize: 12,
            color: "#991B1B",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}
        >
          <span>⚠️ Graph Validation Issues:</span>
          <span>{validation.errors.join("; ")}</span>
        </div>
      )}

      {/* ── MAIN STUDIO CONTENT ── */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 24px", display: "grid", gridTemplateColumns: "260px 1fr 340px", gap: 16 }}>
        
        {/* ── LEFT SIDEBAR: NODE PALETTE & WORKFLOW SUMMARY ── */}
        <div
          style={{
            backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
            border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
            borderRadius: 8,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            height: "fit-content"
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748B", marginBottom: 8 }}>
              Add Agent Nodes
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {(
                [
                  "model",
                  "tool",
                  "retrieval",
                  "branch",
                  "structured_output",
                  "validation",
                  "retry",
                  "memory"
                ] as AgentNodeType[]
              ).map((nt) => {
                const styling = NODE_TYPE_COLORS[nt];
                return (
                  <button
                    key={nt}
                    onClick={() => handleAddNode(nt)}
                    style={{
                      padding: "8px 6px",
                      borderRadius: 6,
                      border: `1px solid ${styling.border}`,
                      backgroundColor: styling.bg,
                      color: styling.text,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      textAlign: "center"
                    }}
                  >
                    <span>{styling.icon}</span>
                    <span>{nt.replace(/_/g, " ")}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <hr style={{ borderColor: isDark ? "#1E2A3B" : "#F1F5F9", margin: "4px 0" }} />

          {/* Test Input Configuration */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748B", marginBottom: 6 }}>
              Interactive Run Input
            </div>
            <textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                fontSize: 12,
                fontFamily: "inherit",
                backgroundColor: isDark ? "#16253C" : "#F8FAFC",
                border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
                color: isDark ? "#FFFFFF" : "#1E293B",
                resize: "vertical"
              }}
              placeholder="Enter user prompt or event payload..."
            />
          </div>

          <hr style={{ borderColor: isDark ? "#1E2A3B" : "#F1F5F9", margin: "4px 0" }} />

          {/* Graph Stats */}
          <div style={{ fontSize: 11.5, color: "#64748B", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Total Nodes:</span>
              <strong style={{ color: isDark ? "#FFFFFF" : "#1E293B" }}>{workflow.nodes.length}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Connected Edges:</span>
              <strong style={{ color: isDark ? "#FFFFFF" : "#1E293B" }}>{workflow.edges.length}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Cycle Status:</span>
              <strong style={{ color: validation.isValid ? "#10B981" : "#EF4444" }}>
                {validation.isValid ? "Acyclic (Safe)" : "Issues Detected"}
              </strong>
            </div>
          </div>
        </div>

        {/* ── CENTER: TABBED CANVAS / TRACE / EVALUATION ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* View Tab Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderBottom: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
              paddingBottom: 8
            }}
          >
            {[
              { id: "canvas", label: "🗺️ Visual Graph Canvas", count: workflow.nodes.length },
              { id: "trace", label: "⚡ Execution Trace", count: executionResult ? executionResult.traces.length : 0 },
              { id: "evaluation", label: "⚖️ Robustness Rubric", count: assessmentReport ? `${assessmentReport.score}/100` : null },
              { id: "tools", label: "🛠️ Available Tools", count: toolsList.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveViewTab(tab.id as any)}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeViewTab === tab.id ? (isDark ? "#233857" : "#EFF4FE") : "transparent",
                  color: activeViewTab === tab.id ? "#356AE6" : (isDark ? "#94A3B8" : "#64748B"),
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 10,
                      backgroundColor: isDark ? "#16253C" : "#E2E8F0",
                      color: isDark ? "#CBD5E1" : "#475569"
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TAB 1: VISUAL GRAPH CANVAS */}
          {activeViewTab === "canvas" && (
            <div
              style={{
                backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
                borderRadius: 8,
                padding: 20,
                minHeight: 520,
                position: "relative",
                backgroundImage: isDark
                  ? "radial-gradient(#1E2A3B 1px, transparent 1px)"
                  : "radial-gradient(#E2E8F0 1px, transparent 1px)",
                backgroundSize: "20px 20px"
              }}
            >
              <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                  Click a node to inspect and configure properties. Drag or connect via edges below.
                </span>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>Workflow ID: {workflow.id}</span>
              </div>

              {/* Node Sequence List Display */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640, margin: "0 auto" }}>
                {workflow.nodes.map((node, index) => {
                  const styling = NODE_TYPE_COLORS[node.type] || { bg: "#F1F5F9", border: "#CBD5E1", text: "#334155", icon: "📦" };
                  const isSelected = node.id === selectedNodeId;

                  return (
                    <div key={node.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      {/* Node Card */}
                      <div
                        onClick={() => setSelectedNodeId(node.id)}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: 8,
                          border: `2px solid ${isSelected ? "#356AE6" : styling.border}`,
                          backgroundColor: isDark ? "#16253C" : styling.bg,
                          boxShadow: isSelected ? "0 0 0 3px rgba(53, 106, 230, 0.25)" : "none",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 18 }}>{styling.icon}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#FFFFFF" : "#1E293B" }}>
                              {node.label}
                            </div>
                            <div style={{ fontSize: 11, color: styling.text, fontWeight: 600 }}>
                              Type: {node.type.replace(/_/g, " ")} {node.config?.model ? `(${node.config.model})` : ""} {node.config?.toolName ? `[${node.config.toolName}]` : ""}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {node.type !== "input" && node.type !== "output" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNode(node.id);
                              }}
                              style={{
                                fontSize: 11,
                                padding: "4px 8px",
                                borderRadius: 4,
                                backgroundColor: "transparent",
                                color: "#EF4444",
                                border: "1px solid #EF4444",
                                cursor: "pointer"
                              }}
                              title="Delete Node"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Connection arrows */}
                      {index < workflow.nodes.length - 1 && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "4px 0" }}>
                          <div style={{ width: 2, height: 16, backgroundColor: isDark ? "#334155" : "#CBD5E1" }} />
                          <span style={{ fontSize: 11, color: isDark ? "#64748B" : "#94A3B8" }}>▼</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Edge connection manager */}
              <div
                style={{
                  marginTop: 24,
                  padding: "10px 14px",
                  borderRadius: 6,
                  backgroundColor: isDark ? "#16253C" : "#F8FAFC",
                  border: `1px solid ${isDark ? "#2A3F5F" : "#E2E8F0"}`,
                  fontSize: 12
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6, color: "#64748B" }}>Workflow Transitions & Connections:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {workflow.edges.map((edge) => {
                    const fromNode = workflow.nodes.find((n) => n.id === edge.source);
                    const toNode = workflow.nodes.find((n) => n.id === edge.target);
                    return (
                      <span
                        key={edge.id}
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: 4,
                          backgroundColor: isDark ? "#233857" : "#E2E8F0",
                          color: isDark ? "#CBD5E1" : "#334155",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <span>{fromNode?.label || edge.source} ➔ {toNode?.label || edge.target}</span>
                        <button
                          onClick={() => handleRemoveEdge(edge.id)}
                          style={{ border: "none", background: "none", color: "#EF4444", cursor: "pointer", padding: 0 }}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXECUTION TRACE & RUNTIME LOGS */}
          {activeViewTab === "trace" && (
            <div
              style={{
                backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
                borderRadius: 8,
                padding: 16,
                minHeight: 520
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: isDark ? "#FFFFFF" : "#1E293B" }}>
                  Execution Step Traces & Observability
                </h3>
                {executionResult && (
                  <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                    <span>Status: <strong style={{ color: executionResult.success ? "#10B981" : "#EF4444" }}>{executionResult.success ? "Completed" : "Failed"}</strong></span>
                    <span>Total Latency: <strong>{executionResult.executionTimeMs} ms</strong></span>
                    <span>Tokens: <strong>{executionResult.totalTokens}</strong></span>
                  </div>
                )}
              </div>

              {!executionResult && !executing && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748B" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>No active execution trace yet.</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Click &quot;Run Agent Trace&quot; above to execute the workflow through the autonomous runtime.</div>
                </div>
              )}

              {executing && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#356AE6" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Executing agent workflow graph...</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>Validating steps, calling safe tools, and collecting traces.</div>
                </div>
              )}

              {executionResult && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Step Timeline */}
                  {executionResult.traces.map((trace) => (
                    <div
                      key={trace.stepIndex}
                      style={{
                        padding: 12,
                        borderRadius: 6,
                        backgroundColor: isDark ? "#16253C" : "#F8FAFC",
                        border: `1px solid ${trace.status === "SUCCESS" ? (isDark ? "#233857" : "#E2E8F0") : "#F87171"}`
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: 4,
                              backgroundColor: "#356AE6",
                              color: "#FFFFFF"
                            }}
                          >
                            STEP {trace.stepIndex + 1}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#FFFFFF" : "#1E293B" }}>
                            {trace.nodeLabel} ({trace.nodeType})
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#64748B" }}>
                          <span>⏱ {trace.latencyMs}ms</span>
                          <span style={{ color: trace.status === "SUCCESS" ? "#10B981" : "#EF4444", fontWeight: 700 }}>
                            {trace.status}
                          </span>
                        </div>
                      </div>

                      {/* Output snippet */}
                      <div style={{ fontSize: 11.5, color: isDark ? "#CBD5E1" : "#475569", whiteSpace: "pre-wrap", fontFamily: "monospace", backgroundColor: isDark ? "#0A0F1D" : "#FFFFFF", padding: 8, borderRadius: 4, border: `1px solid ${isDark ? "#1E2A3B" : "#F1F5F9"}` }}>
                        {JSON.stringify(trace.outputState, null, 2)}
                      </div>
                    </div>
                  ))}

                  {/* Final Output Summary */}
                  <div
                    style={{
                      marginTop: 10,
                      padding: 14,
                      borderRadius: 6,
                      backgroundColor: isDark ? "#0E1726" : "#ECFDF5",
                      border: `1px solid ${isDark ? "#22334A" : "#A7F3D0"}`
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#047857", marginBottom: 6 }}>
                      ✅ Final Agent Output Delivery
                    </div>
                    <div style={{ fontSize: 12.5, whiteSpace: "pre-wrap", color: isDark ? "#FFFFFF" : "#064E3B", fontFamily: "monospace" }}>
                      {typeof executionResult.finalOutput === "object" ? JSON.stringify(executionResult.finalOutput, null, 2) : String(executionResult.finalOutput)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ROBUSTNESS & SECURITY EVALUATION */}
          {activeViewTab === "evaluation" && (
            <div
              style={{
                backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
                borderRadius: 8,
                padding: 16,
                minHeight: 520
              }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px 0", color: isDark ? "#FFFFFF" : "#1E293B" }}>
                Multi-Scenario Agent Assessment & Security Rubric
              </h3>

              {!assessmentReport && !evaluating && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748B" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>⚖️</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>No evaluation report generated yet.</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Click &quot;Evaluate Robustness&quot; to test your agent against adversarial prompts, tool validations, and edge cases.</div>
                </div>
              )}

              {evaluating && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#356AE6" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Running automated evaluation test suite...</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>Simulating benign queries, prompt injection attempts, and boundary inputs.</div>
                </div>
              )}

              {assessmentReport && (
                <div>
                  {/* Score Card Header */}
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 6,
                      backgroundColor: assessmentReport.passed ? (isDark ? "#162E20" : "#ECFDF5") : (isDark ? "#3B1818" : "#FEF2F2"),
                      border: `1px solid ${assessmentReport.passed ? "#10B981" : "#EF4444"}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: assessmentReport.passed ? "#10B981" : "#EF4444" }}>
                        {assessmentReport.passed ? "✓ Agent Workflow Qualified" : "✕ Agent Workflow Failed Gates"}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                        {assessmentReport.feedback}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: assessmentReport.passed ? "#10B981" : "#EF4444" }}>
                        {assessmentReport.score} / 100
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B" }}>Rubric Score</div>
                    </div>
                  </div>

                  {/* Dimension Rubric Breakdown */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {Object.entries(assessmentReport.rubricBreakdown).map(([key, val]) => (
                      <div
                        key={key}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 6,
                          backgroundColor: isDark ? "#16253C" : "#F8FAFC",
                          border: `1px solid ${isDark ? "#2A3F5F" : "#E2E8F0"}`
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                          <span style={{ textTransform: "capitalize", color: isDark ? "#FFFFFF" : "#1E293B" }}>
                            {key.replace(/([A-Z])/g, " $1")}
                          </span>
                          <span style={{ color: "#356AE6" }}>{val} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Scenario Results */}
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 8 }}>Scenario Execution Breakdown:</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {assessmentReport.scenarioResults.map((sc, i) => (
                      <div
                        key={i}
                        style={{
                          padding: 10,
                          borderRadius: 6,
                          backgroundColor: isDark ? "#16253C" : "#F8FAFC",
                          border: `1px solid ${sc.passed ? "#10B981" : "#EF4444"}`,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#FFFFFF" : "#1E293B" }}>
                            {sc.scenarioName}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748B" }}>
                            {sc.feedback}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 4,
                            backgroundColor: sc.passed ? "#ECFDF5" : "#FEF2F2",
                            color: sc.passed ? "#047857" : "#B91C1C"
                          }}
                        >
                          {sc.passed ? "PASSED" : "FAILED"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AVAILABLE TOOLS INSPECTOR */}
          {activeViewTab === "tools" && (
            <div
              style={{
                backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
                borderRadius: 8,
                padding: 16,
                minHeight: 520
              }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px 0", color: isDark ? "#FFFFFF" : "#1E293B" }}>
                Built-in Sandboxed Agent Tools Catalog
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                {toolsList.map((t) => (
                  <div
                    key={t.name}
                    style={{
                      padding: 12,
                      borderRadius: 6,
                      backgroundColor: isDark ? "#16253C" : "#F8FAFC",
                      border: `1px solid ${isDark ? "#2A3F5F" : "#E2E8F0"}`
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: "#356AE6" }}>
                        🛠️ {t.name}
                      </span>
                      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, backgroundColor: isDark ? "#233857" : "#E2E8F0", color: "#64748B" }}>
                        Active Sandbox Tool
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: isDark ? "#CBD5E1" : "#475569", marginBottom: 6 }}>
                      {t.description}
                    </div>
                    <div style={{ fontSize: 11, fontFamily: "monospace", color: "#64748B", backgroundColor: isDark ? "#0A0F1D" : "#FFFFFF", padding: 6, borderRadius: 4 }}>
                      Parameters: {JSON.stringify(t.parameters)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR: SELECTED NODE PROPERTY INSPECTOR ── */}
        <div
          style={{
            backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
            border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
            borderRadius: 8,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            height: "fit-content"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748B" }}>
              Node Inspector
            </span>
            <span style={{ fontSize: 11, fontFamily: "monospace", color: "#94A3B8" }}>
              {selectedNode.id}
            </span>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>
              Node Display Name
            </label>
            <input
              type="text"
              value={selectedNode.label}
              onChange={(e) => {
                const val = e.target.value;
                setWorkflow((prev) => ({
                  ...prev,
                  nodes: prev.nodes.map((n) => (n.id === selectedNode.id ? { ...n, label: val } : n))
                }));
              }}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 4,
                fontSize: 12,
                backgroundColor: isDark ? "#16253C" : "#F8FAFC",
                border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
                color: isDark ? "#FFFFFF" : "#1E293B"
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>
              Node Type
            </label>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                padding: "4px 8px",
                borderRadius: 4,
                backgroundColor: isDark ? "#16253C" : "#EFF6FF",
                color: "#356AE6",
                display: "inline-block"
              }}
            >
              {selectedNode.type}
            </span>
          </div>

          {/* Model Config Fields */}
          {selectedNode.type === "model" && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>
                Model Provider & Engine
              </label>
              <select
                value={selectedNode.config?.model || "gemini-1.5-flash"}
                onChange={(e) => {
                  const val = e.target.value;
                  setWorkflow((prev) => ({
                    ...prev,
                    nodes: prev.nodes.map((n) =>
                      n.id === selectedNode.id ? { ...n, config: { ...n.config, model: val } } : n
                    )
                  }));
                }}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  backgroundColor: isDark ? "#16253C" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
                  color: isDark ? "#FFFFFF" : "#1E293B"
                }}
              >
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast, General)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Agentic)</option>
                <option value="gpt-4o">GPT-4o (Multimodal)</option>
              </select>
            </div>
          )}

          {/* Tool Selector Config */}
          {(selectedNode.type === "tool" || selectedNode.type === "retrieval") && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>
                Attached Sandbox Tool
              </label>
              <select
                value={selectedNode.config?.toolName || "calculator"}
                onChange={(e) => {
                  const val = e.target.value;
                  setWorkflow((prev) => ({
                    ...prev,
                    nodes: prev.nodes.map((n) =>
                      n.id === selectedNode.id ? { ...n, config: { ...n.config, toolName: val } } : n
                    )
                  }));
                }}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  backgroundColor: isDark ? "#16253C" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
                  color: isDark ? "#FFFFFF" : "#1E293B"
                }}
              >
                {toolsList.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Instructions / Prompt field */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>
              System Prompt / Instructions
            </label>
            <textarea
              value={selectedNode.config?.systemPrompt || ""}
              onChange={(e) => {
                const val = e.target.value;
                setWorkflow((prev) => ({
                  ...prev,
                  nodes: prev.nodes.map((n) =>
                    n.id === selectedNode.id ? { ...n, config: { ...n.config, systemPrompt: val } } : n
                  )
                }));
              }}
              rows={4}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 4,
                fontSize: 11.5,
                fontFamily: "monospace",
                backgroundColor: isDark ? "#16253C" : "#F8FAFC",
                border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
                color: isDark ? "#FFFFFF" : "#1E293B",
                resize: "vertical"
              }}
            />
          </div>

          {/* Connect Outgoing Edge */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>
              Connect Transition To Node:
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              <select
                id="connect-target-select"
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  backgroundColor: isDark ? "#16253C" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
                  color: isDark ? "#FFFFFF" : "#1E293B"
                }}
              >
                {workflow.nodes
                  .filter((n) => n.id !== selectedNode.id)
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.type})
                    </option>
                  ))}
              </select>
              <button
                onClick={() => {
                  const selectEl = document.getElementById("connect-target-select") as HTMLSelectElement;
                  if (selectEl && selectEl.value) {
                    handleConnectNodes(selectedNode.id, selectEl.value);
                  }
                }}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "6px 10px",
                  borderRadius: 4,
                  backgroundColor: "#356AE6",
                  color: "#FFFFFF",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                + Connect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentBuilderPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Loading Agent Builder...</div>}>
      <AgentBuilderContent />
    </Suspense>
  );
}
