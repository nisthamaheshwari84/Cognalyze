"use client";

import React, { useState, useEffect } from "react";
import {
  getMemoryAliasingScenario,
  evaluateNumpyBroadcasting,
  evaluateSqlJoinVisualizer,
  simulateGradientDescent,
  simulateRagPipelineFlow,
  CPythonReflectionResult,
  MemoryPointerState,
  BroadcastingEvaluation,
  SqlJoinEvaluation,
  GradientDescentSimulation,
  RagPipelineSimulation
} from "@/lib/skills/ai-data/visual-diagram-engine";

interface InteractiveDiagramStudioProps {
  topicTitle?: string;
  onOpenAiTeacher?: (initialMessage: string) => void;
}

type StudioDiagramType = 
  | "cpython_bytecode"
  | "memory_pointers"
  | "numpy_broadcasting"
  | "sql_joins"
  | "gradient_descent"
  | "rag_pipeline";

export default function InteractiveDiagramStudio({
  topicTitle = "Under the Hood Visual Studio",
  onOpenAiTeacher
}: InteractiveDiagramStudioProps) {
  const [activeDiagram, setActiveDiagram] = useState<StudioDiagramType>("cpython_bytecode");
  const [depthLevel, setDepthLevel] = useState<"beginner" | "applied" | "advanced">("applied");

  // 1. CPython State
  const [pythonCode, setPythonCode] = useState<string>("x = [1, 2]\ny = x\ny.append(3)");
  const [cpythonResult, setCpythonResult] = useState<CPythonReflectionResult | null>(null);
  const [cpythonStep, setCpythonStep] = useState<number>(0);
  const [cpythonLoading, setCpythonLoading] = useState<boolean>(false);

  // 2. Memory Aliasing State
  const [memoryScenario, setMemoryScenario] = useState<"list_aliasing" | "string_immutability">("list_aliasing");
  const [memoryStep, setMemoryStep] = useState<number>(0);

  // 3. NumPy Broadcasting State
  const [shapeAStr, setShapeAStr] = useState<string>("3, 1");
  const [shapeBStr, setShapeBStr] = useState<string>("1, 4");
  const [broadcastingEval, setBroadcastingEval] = useState<BroadcastingEvaluation | null>(null);

  // 4. SQL Joins State
  const [sqlJoinType, setSqlJoinType] = useState<"INNER" | "LEFT" | "RIGHT" | "FULL" | "CROSS">("INNER");
  const [sqlJoinEval, setSqlJoinEval] = useState<SqlJoinEvaluation | null>(null);

  // 5. Gradient Descent State
  const [learningRate, setLearningRate] = useState<number>(0.15);
  const [initialTheta, setInitialTheta] = useState<number>(-4.0);
  const [gdSim, setGdSim] = useState<GradientDescentSimulation | null>(null);
  const [gdStepIndex, setGdStepIndex] = useState<number>(0);

  // 6. RAG Pipeline State
  const [chunkSize, setChunkSize] = useState<number>(120);
  const [chunkOverlap, setChunkOverlap] = useState<number>(30);
  const [topK, setTopK] = useState<number>(2);
  const [ragQuery, setRagQuery] = useState<string>("How does Cognalyze prove student skills?");
  const [ragSim, setRagSim] = useState<RagPipelineSimulation | null>(null);

  // Load initial CPython reflection
  useEffect(() => {
    handleRunCpython();
  }, []);

  // Update NumPy broadcasting
  useEffect(() => {
    try {
      const a = shapeAStr.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
      const b = shapeBStr.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
      if (a.length > 0 && b.length > 0) {
        setBroadcastingEval(evaluateNumpyBroadcasting(a, b));
      }
    } catch {
      // ignore parsing error during input typing
    }
  }, [shapeAStr, shapeBStr]);

  // Update SQL Joins
  useEffect(() => {
    setSqlJoinEval(evaluateSqlJoinVisualizer(sqlJoinType));
  }, [sqlJoinType]);

  // Update Gradient Descent
  useEffect(() => {
    const sim = simulateGradientDescent(learningRate, initialTheta);
    setGdSim(sim);
    setGdStepIndex(sim.steps.length - 1);
  }, [learningRate, initialTheta]);

  // Update RAG Pipeline
  useEffect(() => {
    setRagSim(simulateRagPipelineFlow({ chunkSize, chunkOverlap, query: ragQuery, topK }));
  }, [chunkSize, chunkOverlap, topK, ragQuery]);

  const handleRunCpython = async () => {
    setCpythonLoading(true);
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "inspect_cpython_mechanics", code: pythonCode })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setCpythonResult(data.result);
        setCpythonStep(0);
      } else {
        setCpythonResult({
          success: false,
          code: pythonCode,
          tokens: [],
          ast: null,
          bytecode: [],
          stackTraceSteps: [],
          error: data.error || "Failed to inspect CPython mechanics."
        });
      }
    } catch (err: any) {
      setCpythonResult({
        success: false,
        code: pythonCode,
        tokens: [],
        ast: null,
        bytecode: [],
        stackTraceSteps: [],
        error: err.message || "Network error reaching CPython reflection runner."
      });
    } finally {
      setCpythonLoading(false);
    }
  };

  const memoryStates = getMemoryAliasingScenario(memoryScenario);
  const currentMemory = memoryStates[Math.min(memoryStep, memoryStates.length - 1)];

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 12, border: "1px solid #E4E1DA", overflow: "hidden" }}>
      {/* Studio Header & Navigation */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #E4E1DA", background: "#FBFBFA", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🎨</span>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#162A43", letterSpacing: "-0.02em" }}>
              Interactive Visual Diagram Studio
            </h3>
            <span style={{ fontSize: 10, background: "#EFF4FE", color: "#356AE6", padding: "2px 8px", borderRadius: 10, fontWeight: 700, border: "1px solid #D2E0FB" }}>
              CPython 3 &amp; SQLite Native
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#667085" }}>
            See internal mechanics, memory pointers, tensor broadcasts, and optimization surfaces live.
          </p>
        </div>

        {/* Depth Level Switcher & AI Mentor Bridge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", background: "#F1EFE9", borderRadius: 6, padding: 2 }}>
            {(["beginner", "applied", "advanced"] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setDepthLevel(lvl)}
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  border: "none",
                  borderRadius: 5,
                  cursor: "pointer",
                  background: depthLevel === lvl ? "#FFFFFF" : "transparent",
                  color: depthLevel === lvl ? "#162A43" : "#667085",
                  boxShadow: depthLevel === lvl ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  textTransform: "capitalize"
                }}
              >
                {lvl}
              </button>
            ))}
          </div>

          {onOpenAiTeacher && (
            <button
              onClick={() => onOpenAiTeacher(`Can you explain the visual diagram for ${activeDiagram.replace(/_/g, " ")}?`)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #356AE6",
                background: "#356AE6",
                color: "#FFFFFF",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <span>🤖</span>
              <span>Discuss with AI Teacher</span>
            </button>
          )}
        </div>
      </div>

      {/* Diagram Selection Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #E4E1DA", background: "#FFFFFF", overflowX: "auto" }}>
        {[
          { id: "cpython_bytecode", label: "⚡ CPython Bytecode & AST", icon: "⚙️" },
          { id: "memory_pointers", label: "🧠 Memory Pointers & Aliasing", icon: "📌" },
          { id: "numpy_broadcasting", label: "📐 NumPy Broadcasting Lab", icon: "📊" },
          { id: "sql_joins", label: "🔗 SQL Relational Joins", icon: "🗄️" },
          { id: "gradient_descent", label: "📉 Gradient Descent Surface", icon: "📈" },
          { id: "rag_pipeline", label: "🔍 RAG Vector Retrieval Flow", icon: "🤖" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveDiagram(tab.id as StudioDiagramType)}
            style={{
              padding: "12px 16px",
              fontSize: 12,
              fontWeight: 700,
              border: "none",
              borderBottom: activeDiagram === tab.id ? "2px solid #356AE6" : "2px solid transparent",
              background: "transparent",
              color: activeDiagram === tab.id ? "#356AE6" : "#667085",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Interactive Diagram Canvas */}
      <div style={{ padding: 24, background: "#FAF9F5" }}>
        {/* ── 1. CPYTHON BYTECODE & AST EXPLORER ── */}
        {activeDiagram === "cpython_bytecode" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* Code Editor Area */}
              <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>Python Source Code</label>
                  <span style={{ fontSize: 10, color: "#667085" }}>Native CPython 3 ast &amp; dis</span>
                </div>
                <textarea
                  value={pythonCode}
                  onChange={e => setPythonCode(e.target.value)}
                  rows={5}
                  style={{
                    width: "100%",
                    fontFamily: "monospace",
                    fontSize: 12,
                    padding: 10,
                    borderRadius: 6,
                    border: "1px solid #E4E1DA",
                    background: "#FBFBFA",
                    color: "#162A43",
                    boxSizing: "border-box",
                    outline: "none"
                  }}
                />
                <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={handleRunCpython}
                    disabled={cpythonLoading}
                    style={{
                      padding: "6px 14px",
                      background: "#162A43",
                      color: "#FFFFFF",
                      borderRadius: 6,
                      border: "none",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {cpythonLoading ? "Compiling..." : "Inspect AST & Bytecode ➔"}
                  </button>
                </div>
              </div>

              {/* Execution Stack Stepper */}
              <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>CPython Value Stack Stepper</label>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => setCpythonStep(Math.max(0, cpythonStep - 1))}
                      disabled={cpythonStep === 0}
                      style={{ padding: "2px 8px", fontSize: 11, cursor: "pointer" }}
                    >
                      ← Prev
                    </button>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px" }}>
                      {cpythonStep + 1} / {cpythonResult?.stackTraceSteps.length || 1}
                    </span>
                    <button
                      onClick={() => setCpythonStep(Math.min((cpythonResult?.stackTraceSteps.length || 1) - 1, cpythonStep + 1))}
                      disabled={!cpythonResult || cpythonStep >= cpythonResult.stackTraceSteps.length - 1}
                      style={{ padding: "2px 8px", fontSize: 11, cursor: "pointer" }}
                    >
                      Next →
                    </button>
                  </div>
                </div>

                {cpythonResult?.stackTraceSteps[cpythonStep] ? (
                  <div>
                    <div style={{ padding: "8px 12px", background: "#EFF4FE", borderRadius: 6, border: "1px solid #D2E0FB", marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6" }}>
                        Opcode: {cpythonResult.stackTraceSteps[cpythonStep].instruction.opname} ({cpythonResult.stackTraceSteps[cpythonStep].instruction.argval || "none"})
                      </div>
                      <div style={{ fontSize: 11, color: "#162A43", marginTop: 2 }}>
                        {cpythonResult.stackTraceSteps[cpythonStep].explanation}
                      </div>
                    </div>

                    <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 4 }}>Current Evaluation Stack (Top = Right):</div>
                    <div style={{ display: "flex", gap: 6, minHeight: 36, alignItems: "center", padding: "6px 10px", background: "#F6F5F1", borderRadius: 6, border: "1px dashed #E4E1DA" }}>
                      {cpythonResult.stackTraceSteps[cpythonStep].stack.length === 0 ? (
                        <span style={{ fontSize: 11, color: "#98A2B3", fontStyle: "italic" }}>Stack is empty</span>
                      ) : (
                        cpythonResult.stackTraceSteps[cpythonStep].stack.map((item, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: "4px 8px",
                              background: "#FFFFFF",
                              border: "1px solid #356AE6",
                              color: "#356AE6",
                              fontSize: 11,
                              fontWeight: 700,
                              borderRadius: 4
                            }}
                          >
                            {item}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "#667085" }}>Loading CPython stack...</div>
                )}
              </div>
            </div>

            {/* AST Tree & Disassembled Bytecode View */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Disassembled Bytecode Table */}
              <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: "#162A43" }}>Disassembled Bytecode (`dis.get_instructions`)</h4>
                <div style={{ maxHeight: 220, overflowY: "auto", fontFamily: "monospace", fontSize: 11 }}>
                  {cpythonResult?.bytecode.map((instr, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "4px 8px",
                        display: "flex",
                        justifyContent: "space-between",
                        background: idx === cpythonStep ? "#FEF3C7" : idx % 2 === 0 ? "#FBFBFA" : "#FFFFFF",
                        borderLeft: idx === cpythonStep ? "3px solid #D97706" : "3px solid transparent",
                        cursor: "pointer"
                      }}
                      onClick={() => setCpythonStep(idx)}
                    >
                      <span style={{ color: "#667085" }}>{instr.offset.toString().padStart(3, "0")}</span>
                      <strong style={{ color: "#162A43" }}>{instr.opname}</strong>
                      <span style={{ color: "#356AE6" }}>{instr.argval || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AST Node Representation */}
              <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: "#162A43" }}>Abstract Syntax Tree (`ast.parse`)</h4>
                <div style={{ maxHeight: 220, overflowY: "auto", fontSize: 11 }}>
                  {cpythonResult?.ast ? (
                    <div style={{ paddingLeft: 8 }}>
                      <div style={{ fontWeight: 700, color: "#162A43" }}>📦 Module (Root)</div>
                      {cpythonResult.ast.children.map(child => (
                        <div key={child.id} style={{ marginLeft: 16, marginTop: 4, paddingLeft: 8, borderLeft: "2px solid #E4E1DA" }}>
                          <span style={{ fontWeight: 700, color: "#356AE6" }}>{child.summary}</span>
                          <span style={{ color: "#98A2B3", fontSize: 10, marginLeft: 6 }}>line {child.lineno}</span>
                          {child.children.map(grand => (
                            <div key={grand.id} style={{ marginLeft: 16, marginTop: 2, color: "#667085" }}>
                              ↳ {grand.summary}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: "#667085" }}>No AST available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. MEMORY POINTER & ALIASING MODEL ── */}
        {activeDiagram === "memory_pointers" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => { setMemoryScenario("list_aliasing"); setMemoryStep(0); }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    border: memoryScenario === "list_aliasing" ? "1px solid #356AE6" : "1px solid #E4E1DA",
                    background: memoryScenario === "list_aliasing" ? "#EFF4FE" : "#FFFFFF",
                    color: memoryScenario === "list_aliasing" ? "#356AE6" : "#162A43",
                    cursor: "pointer"
                  }}
                >
                  List In-Place Aliasing (Mutable)
                </button>
                <button
                  onClick={() => { setMemoryScenario("string_immutability"); setMemoryStep(0); }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    border: memoryScenario === "string_immutability" ? "1px solid #356AE6" : "1px solid #E4E1DA",
                    background: memoryScenario === "string_immutability" ? "#EFF4FE" : "#FFFFFF",
                    color: memoryScenario === "string_immutability" ? "#356AE6" : "#162A43",
                    cursor: "pointer"
                  }}
                >
                  String Re-allocation (Immutable)
                </button>
              </div>

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button
                  onClick={() => setMemoryStep(Math.max(0, memoryStep - 1))}
                  disabled={memoryStep === 0}
                  style={{ padding: "4px 10px", fontSize: 11, cursor: "pointer" }}
                >
                  ← Step Back
                </button>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#162A43" }}>
                  Step {memoryStep + 1} of {memoryStates.length}
                </span>
                <button
                  onClick={() => setMemoryStep(Math.min(memoryStates.length - 1, memoryStep + 1))}
                  disabled={memoryStep >= memoryStates.length - 1}
                  style={{ padding: "4px 10px", fontSize: 11, cursor: "pointer" }}
                >
                  Advance Step →
                </button>
              </div>
            </div>

            {/* Aliasing Step Explanation Banner */}
            <div style={{ padding: "12px 16px", background: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1DA", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43" }}>{currentMemory.description}</div>
              {currentMemory.aliasingWarning && (
                <div style={{ marginTop: 6, padding: "6px 10px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, color: "#991B1B", fontSize: 11, fontWeight: 700 }}>
                  ⚠️ {currentMemory.aliasingWarning}
                </div>
              )}
            </div>

            {/* Stack vs Heap Visual Representation */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
              {/* Stack Frame */}
              <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 800, color: "#162A43" }}>Stack Frame (`locals()`)</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {currentMemory.stackVariables.map(v => (
                    <div
                      key={v.name}
                      style={{
                        padding: "10px 14px",
                        background: "#F6F5F1",
                        border: "1px solid #D2E0FB",
                        borderRadius: 6,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <strong style={{ fontSize: 13, color: "#162A43" }}>{v.name}</strong>
                      <span style={{ fontSize: 11, color: "#356AE6", fontWeight: 700, fontFamily: "monospace" }}>
                        ── points to ➔ {v.targetAddress}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Heap PyObjects */}
              <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 800, color: "#162A43" }}>CPython Heap Memory (`PyObject`)</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                  {currentMemory.heapObjects.map(obj => (
                    <div
                      key={obj.address}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        border: "2px solid #356AE6",
                        background: "#EFF4FE",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#667085", fontFamily: "monospace" }}>
                        <span>ADDR: {obj.address}</span>
                        <span>refcount={obj.refCount}</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#162A43", margin: "6px 0" }}>
                        {obj.valueString}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                        <span style={{ color: "#356AE6", fontWeight: 700 }}>type: Py{obj.type.toUpperCase()}Object</span>
                        <span style={{ color: obj.isMutable ? "#B7791F" : "#2E7D5B", fontWeight: 700 }}>
                          {obj.isMutable ? "MUTABLE" : "IMMUTABLE"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. NUMPY BROADCASTING MATRIX LAB ── */}
        {activeDiagram === "numpy_broadcasting" && (
          <div>
            <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 8, border: "1px solid #E4E1DA", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#667085", display: "block", marginBottom: 4 }}>
                    Array A Shape (comma separated)
                  </label>
                  <input
                    type="text"
                    value={shapeAStr}
                    onChange={e => setShapeAStr(e.target.value)}
                    style={{ padding: "6px 10px", fontSize: 12, fontWeight: 700, borderRadius: 6, border: "1px solid #E4E1DA", width: 120 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#667085", display: "block", marginBottom: 4 }}>
                    Array B Shape (comma separated)
                  </label>
                  <input
                    type="text"
                    value={shapeBStr}
                    onChange={e => setShapeBStr(e.target.value)}
                    style={{ padding: "6px 10px", fontSize: 12, fontWeight: 700, borderRadius: 6, border: "1px solid #E4E1DA", width: 120 }}
                  />
                </div>

                {/* Quick Presets */}
                <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
                  <button
                    onClick={() => { setShapeAStr("3, 1"); setShapeBStr("1, 4"); }}
                    style={{ padding: "6px 10px", fontSize: 11, cursor: "pointer", background: "#F6F5F1", border: "1px solid #E4E1DA", borderRadius: 4 }}
                  >
                    Preset: (3,1) + (1,4)
                  </button>
                  <button
                    onClick={() => { setShapeAStr("4, 3"); setShapeBStr("3"); }}
                    style={{ padding: "6px 10px", fontSize: 11, cursor: "pointer", background: "#F6F5F1", border: "1px solid #E4E1DA", borderRadius: 4 }}
                  >
                    Preset: (4,3) + (3,)
                  </button>
                  <button
                    onClick={() => { setShapeAStr("3, 2"); setShapeBStr("3, 3"); }}
                    style={{ padding: "6px 10px", fontSize: 11, cursor: "pointer", background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA", borderRadius: 4 }}
                  >
                    Preset: Conflict Error (3,2) + (3,3)
                  </button>
                </div>
              </div>
            </div>

            {/* Broadcasting Evaluation Result */}
            {broadcastingEval && (
              <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#162A43" }}>
                    Trailing Dimension Alignment Rule (Right-to-Left)
                  </h4>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      background: broadcastingEval.isBroadcastable ? "#EAF4EE" : "#FEF2F2",
                      color: broadcastingEval.isBroadcastable ? "#2E7D5B" : "#991B1B",
                      border: broadcastingEval.isBroadcastable ? "1px solid #C8E4D3" : "1px solid #FECACA"
                    }}
                  >
                    {broadcastingEval.isBroadcastable ? `BROADCASTABLE ➔ (${broadcastingEval.resultShape?.join(", ")})` : "INCOMPATIBLE BROADCAST"}
                  </span>
                </div>

                {broadcastingEval.errorMessage && (
                  <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, color: "#991B1B", fontSize: 12, fontFamily: "monospace", marginBottom: 14 }}>
                    {broadcastingEval.errorMessage}
                  </div>
                )}

                {/* Alignment Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 14 }}>
                  <thead>
                    <tr style={{ background: "#F6F5F1", textAlign: "left" }}>
                      <th style={{ padding: "8px 12px" }}>Axis</th>
                      <th style={{ padding: "8px 12px" }}>Array A Dim</th>
                      <th style={{ padding: "8px 12px" }}>Array B Dim</th>
                      <th style={{ padding: "8px 12px" }}>Result Dim</th>
                      <th style={{ padding: "8px 12px" }}>Mechanism</th>
                    </tr>
                  </thead>
                  <tbody>
                    {broadcastingEval.alignment.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #E4E1DA", background: !row.isCompatible ? "#FEF2F2" : "#FFFFFF" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 700 }}>axis {row.axis}</td>
                        <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 700 }}>{row.dimA}</td>
                        <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 700 }}>{row.dimB}</td>
                        <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 800, color: row.isCompatible ? "#2E7D5B" : "#991B1B" }}>
                          {row.isCompatible ? row.resultDim : "✕"}
                        </td>
                        <td style={{ padding: "8px 12px", color: row.isCompatible ? "#667085" : "#991B1B" }}>{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ fontSize: 12, color: "#162A43", lineHeight: 1.5, background: "#FBFBFA", padding: 12, borderRadius: 6 }}>
                  💡 <strong>Engineering Note:</strong> {broadcastingEval.explanation}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 4. SQL RELATIONAL JOIN VISUALIZER ── */}
        {activeDiagram === "sql_joins" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {(["INNER", "LEFT", "RIGHT", "FULL", "CROSS"] as const).map(j => (
                <button
                  key={j}
                  onClick={() => setSqlJoinType(j)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    border: sqlJoinType === j ? "1px solid #356AE6" : "1px solid #E4E1DA",
                    background: sqlJoinType === j ? "#EFF4FE" : "#FFFFFF",
                    color: sqlJoinType === j ? "#356AE6" : "#162A43",
                    cursor: "pointer"
                  }}
                >
                  {j} JOIN
                </button>
              ))}
            </div>

            {sqlJoinEval && (
              <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#162A43" }}>
                      Executed Live against SQLite In-Memory Database
                    </h4>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#667085" }}>
                      Total rows returned: <strong>{sqlJoinEval.totalRows}</strong> (Matched: {sqlJoinEval.matchedCount}, Unmatched Left: {sqlJoinEval.unmatchedLeftCount}, Unmatched Right: {sqlJoinEval.unmatchedRightCount})
                    </p>
                  </div>
                  <span style={{ fontSize: 10, background: "#F6F5F1", padding: "4px 8px", borderRadius: 4, color: "#667085" }}>
                    SQLite 3.x Engine
                  </span>
                </div>

                <div style={{ padding: "8px 12px", background: "#EFF4FE", borderRadius: 6, border: "1px solid #D2E0FB", color: "#162A43", fontSize: 12, marginBottom: 14 }}>
                  {sqlJoinEval.explanation}
                </div>

                {/* Relational Table Output */}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 14 }}>
                  <thead>
                    <tr style={{ background: "#F6F5F1", textAlign: "left" }}>
                      <th style={{ padding: "8px 12px" }}>emp_id</th>
                      <th style={{ padding: "8px 12px" }}>employee</th>
                      <th style={{ padding: "8px 12px" }}>dept_id</th>
                      <th style={{ padding: "8px 12px" }}>department</th>
                      <th style={{ padding: "8px 12px" }}>budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sqlJoinEval.records.map((row, idx) => {
                      const isUnmatched = !row.emp_id || !row.dept_id;
                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid #E4E1DA", background: isUnmatched ? "#FFFBEB" : "#FFFFFF" }}>
                          <td style={{ padding: "8px 12px", fontFamily: "monospace", color: row.emp_id ? "#162A43" : "#991B1B" }}>
                            {row.emp_id ?? "NULL"}
                          </td>
                          <td style={{ padding: "8px 12px", fontWeight: 700 }}>{row.employee ?? "NULL"}</td>
                          <td style={{ padding: "8px 12px", fontFamily: "monospace", color: row.dept_id ? "#162A43" : "#991B1B" }}>
                            {row.dept_id ?? "NULL"}
                          </td>
                          <td style={{ padding: "8px 12px" }}>{row.department ?? "NULL"}</td>
                          <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>
                            {row.budget ? `$${row.budget.toLocaleString()}` : "NULL"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── 5. GRADIENT DESCENT LOSS SURFACE ── */}
        {activeDiagram === "gradient_descent" && (
          <div>
            <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 8, border: "1px solid #E4E1DA", marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>Learning Rate (α)</label>
                    <strong style={{ fontSize: 12, color: "#356AE6" }}>{learningRate}</strong>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="1.1"
                    step="0.02"
                    value={learningRate}
                    onChange={e => setLearningRate(parseFloat(e.target.value))}
                    style={{ width: "100%" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#667085", marginTop: 2 }}>
                    <span>0.02 (Too Slow)</span>
                    <span>0.15 (Optimal)</span>
                    <span>1.10 (Divergence / Exploding)</span>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>Starting Weight (θ₀)</label>
                    <strong style={{ fontSize: 12, color: "#162A43" }}>{initialTheta}</strong>
                  </div>
                  <input
                    type="range"
                    min="-6.0"
                    max="12.0"
                    step="0.5"
                    value={initialTheta}
                    onChange={e => setInitialTheta(parseFloat(e.target.value))}
                    style={{ width: "100%" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#667085", marginTop: 2 }}>
                    <span>-6.0</span>
                    <span>Optimal θ* = 3.0</span>
                    <span>12.0</span>
                  </div>
                </div>
              </div>
            </div>

            {gdSim && (
              <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#162A43" }}>
                    Loss Surface: J(θ) = (θ - 3)² + 1
                  </h4>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      background: gdSim.status === "CONVERGED" ? "#EAF4EE" : "#FEF2F2",
                      color: gdSim.status === "CONVERGED" ? "#2E7D5B" : "#991B1B"
                    }}
                  >
                    STATUS: {gdSim.status}
                  </span>
                </div>

                <div style={{ padding: "8px 12px", background: "#EFF4FE", borderRadius: 6, color: "#162A43", fontSize: 12, marginBottom: 16 }}>
                  {gdSim.explanation}
                </div>

                {/* SVG Loss Curve Parabola & Trajectory */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <svg width="460" height="180" style={{ background: "#FBFBFA", borderRadius: 8, border: "1px solid #E4E1DA" }}>
                    {/* Parabola axis */}
                    <line x1="30" y1="150" x2="430" y2="150" stroke="#CBD5E1" strokeWidth="2" />
                    <line x1="230" y1="20" x2="230" y2="160" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
                    <text x="235" y="165" fontSize="10" fill="#64748B">θ* = 3.0</text>

                    {/* Quadratic curve J(theta) = (theta - 3)^2 + 1 */}
                    <path
                      d="M 50 30 Q 230 180 410 30"
                      fill="none"
                      stroke="#94A3B8"
                      strokeWidth="2"
                    />

                    {/* Plot trajectory steps */}
                    {gdSim.steps.slice(0, 10).map((st, idx) => {
                      // Map theta [-5, 11] to X [50, 410]
                      const x = Math.max(40, Math.min(420, 230 + (st.theta - 3) * 22));
                      // Map loss [1, 50] to Y [140, 30]
                      const y = Math.max(25, Math.min(145, 145 - (st.loss - 1) * 3));
                      return (
                        <g key={idx}>
                          <circle cx={x} cy={y} r={idx === 0 ? "5" : "3.5"} fill={idx === 0 ? "#DC2626" : "#356AE6"} />
                          {idx < 5 && (
                            <text x={x + 6} y={y - 4} fontSize="9" fill="#162A43" fontWeight="700">
                              t={st.step}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Trajectory Steps Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "#F6F5F1", textAlign: "left" }}>
                      <th style={{ padding: "6px 10px" }}>Step</th>
                      <th style={{ padding: "6px 10px" }}>Weight θ</th>
                      <th style={{ padding: "6px 10px" }}>Gradient ∇J</th>
                      <th style={{ padding: "6px 10px" }}>Step Δθ (-α∇J)</th>
                      <th style={{ padding: "6px 10px" }}>Loss J(θ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gdSim.steps.slice(0, 6).map(s => (
                      <tr key={s.step} style={{ borderBottom: "1px solid #E4E1DA" }}>
                        <td style={{ padding: "6px 10px", fontWeight: 700 }}>t={s.step}</td>
                        <td style={{ padding: "6px 10px", fontFamily: "monospace" }}>{s.theta}</td>
                        <td style={{ padding: "6px 10px", fontFamily: "monospace" }}>{s.gradient}</td>
                        <td style={{ padding: "6px 10px", fontFamily: "monospace", color: "#356AE6" }}>{s.change}</td>
                        <td style={{ padding: "6px 10px", fontFamily: "monospace", fontWeight: 700 }}>{s.loss}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── 6. RAG PIPELINE FLOW ── */}
        {activeDiagram === "rag_pipeline" && (
          <div>
            <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 8, border: "1px solid #E4E1DA", marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#162A43", display: "block", marginBottom: 4 }}>
                    Chunk Size ({chunkSize} chars)
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="250"
                    value={chunkSize}
                    onChange={e => setChunkSize(parseInt(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#162A43", display: "block", marginBottom: 4 }}>
                    Chunk Overlap ({chunkOverlap} chars)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={chunkOverlap}
                    onChange={e => setChunkOverlap(parseInt(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#162A43", display: "block", marginBottom: 4 }}>
                    Top-K Retrieved Chunks ({topK})
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={topK}
                    onChange={e => setTopK(parseInt(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </div>

            {ragSim && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Visual Chunks */}
                <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 8, border: "1px solid #E4E1DA" }}>
                  <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: "#162A43" }}>
                    Vector Space Chunks ({ragSim.chunks.length} Generated)
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                    {ragSim.chunks.map(ch => (
                      <div
                        key={ch.chunkId}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 6,
                          border: ch.isRetrieved ? "2px solid #2E7D5B" : "1px solid #E4E1DA",
                          background: ch.isRetrieved ? "#EAF4EE" : "#FBFBFA"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: ch.isRetrieved ? "#2E7D5B" : "#162A43" }}>{ch.chunkId}</span>
                          <span style={{ fontWeight: 800, color: ch.isRetrieved ? "#2E7D5B" : "#667085" }}>
                            Cosine Sim: {ch.cosineSimilarity} {ch.isRetrieved ? "★ TOP-K" : ""}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "#162A43", lineHeight: 1.4 }}>
                          &ldquo;{ch.text}&rdquo;
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grounded Generation Preview */}
                <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 8, border: "1px solid #E4E1DA" }}>
                  <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: "#162A43" }}>
                    Augmented Context &amp; Grounded Output
                  </h4>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 2 }}>Injected System Context:</div>
                    <pre style={{ fontSize: 10, background: "#F6F5F1", padding: 10, borderRadius: 6, maxHeight: 120, overflowY: "auto", whiteSpace: "pre-wrap" }}>
                      {ragSim.synthesizedPrompt}
                    </pre>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#2E7D5B", marginBottom: 2 }}>Final Grounded Output:</div>
                    <div style={{ fontSize: 12, color: "#162A43", lineHeight: 1.5, background: "#EAF4EE", padding: 10, borderRadius: 6, border: "1px solid #C8E4D3" }}>
                      {ragSim.generatedAnswer}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

