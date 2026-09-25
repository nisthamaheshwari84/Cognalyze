/**
 * COGNALYZE MENTOR — CONTEXTUAL REFERENCE RESOLVER
 * Resolves deictic references ("yeh", "woh", "this", "that", "upar wala", "isme", "yahan")
 * and polysemic domain terms ("pointer", "cache", "stack") based on active learning context.
 */

import { LearningSurfaceState, ResolvedReference, ConversationalMessage } from "./types";

export interface ReferenceResolutionContext {
  activeTopic: string;
  activeSubtopic?: string;
  surfaceState?: LearningSurfaceState;
  recentMessages?: ConversationalMessage[];
}

export interface ReferenceResolutionResult {
  originalText: string;
  resolvedText: string;
  resolvedReferences: ResolvedReference[];
}

/**
 * Resolves ambiguous terms and deictic pronouns in student speech.
 */
export function resolveContextualReferences(
  userText: string,
  context: ReferenceResolutionContext
): ReferenceResolutionResult {
  const lower = userText.toLowerCase().trim();
  const resolvedReferences: ResolvedReference[] = [];
  let resolvedText = userText;

  const topicLower = (context.activeTopic || "").toLowerCase();
  const surface = context.surfaceState;

  // 1. Resolve Polysemic Domain Terms (e.g. "pointer", "stack", "cache")
  if (lower.includes("pointer")) {
    if (topicLower.includes("linked list") || topicLower.includes("node") || surface?.surfaceType === "visual_interactive") {
      resolvedReferences.push({
        rawTerm: "pointer",
        resolvedEntity: "linked-list node reference (next/prev pointer)",
        entityType: "domain_concept",
        confidence: 0.95
      });
    } else if (topicLower.includes("c++") || topicLower.includes("memory") || topicLower.includes("c lang")) {
      resolvedReferences.push({
        rawTerm: "pointer",
        resolvedEntity: "C/C++ memory address pointer (*ptr)",
        entityType: "domain_concept",
        confidence: 0.92
      });
    } else if (topicLower.includes("two pointer") || topicLower.includes("array") || topicLower.includes("binary search")) {
      resolvedReferences.push({
        rawTerm: "pointer",
        resolvedEntity: "array index cursor (left/right/mid pointer)",
        entityType: "domain_concept",
        confidence: 0.94
      });
    }
  }

  if (lower.includes("stack")) {
    if (topicLower.includes("recursion") || topicLower.includes("backtracking") || surface?.conceptVisual?.diagramType === "call_stack") {
      resolvedReferences.push({
        rawTerm: "stack",
        resolvedEntity: "runtime execution call-stack",
        entityType: "domain_concept",
        confidence: 0.96
      });
    } else {
      resolvedReferences.push({
        rawTerm: "stack",
        resolvedEntity: "LIFO stack data structure",
        entityType: "domain_concept",
        confidence: 0.85
      });
    }
  }

  // 2. Resolve Deictic Pronouns & Spatial References ("yeh", "woh", "upar wala", "this line", "is line")
  // Check against active debugging workspace line
  if (
    (lower.includes("line") || lower.includes("yahan") || lower.includes("is line") || lower.includes("this line")) &&
    surface?.debuggingWorkspace?.suspectLine
  ) {
    const lineNum = surface.debuggingWorkspace.suspectLine;
    resolvedReferences.push({
      rawTerm: "this line / yahan",
      resolvedEntity: `line ${lineNum} (${surface.debuggingWorkspace.codeSnippet.split("\n")[lineNum - 1]?.trim() || "suspect code"})`,
      entityType: "code_line",
      confidence: 0.9
    });
    resolvedText = resolvedText.replace(/is line|this line|yahan/gi, `line ${lineNum}`);
  }

  // Check against visual nodes / arrows in active diagram
  if (
    (lower.includes("arrow") || lower.includes("ye arrow") || lower.includes("yeh arrow") || lower.includes("isme ye arrow")) &&
    surface?.surfaceType === "system_design" &&
    surface.systemDesignCanvas?.dataFlowEdges?.length
  ) {
    const primaryEdge = surface.systemDesignCanvas.dataFlowEdges[0];
    const resolvedDesc = `request data-flow arrow from ${primaryEdge.from} to ${primaryEdge.to}`;
    resolvedReferences.push({
      rawTerm: "ye arrow / this arrow",
      resolvedEntity: resolvedDesc,
      entityType: "visual_element",
      confidence: 0.92
    });
    resolvedText = resolvedText.replace(/ye arrow|yeh arrow|this arrow/gi, resolvedDesc);
  }

  // Check against "upar wala" / "previous one" / "first approach"
  if (lower.includes("upar wala") || lower.includes("previous one") || lower.includes("first approach") || lower.includes("first case")) {
    // If recent messages discussed brute force vs optimal
    const hasBruteForce = context.recentMessages?.some(m => m.content.toLowerCase().includes("brute force") || m.content.toLowerCase().includes("row by row"));
    if (hasBruteForce) {
      resolvedReferences.push({
        rawTerm: "upar wala / first approach",
        resolvedEntity: "brute force approach / row-by-row traversal",
        entityType: "approach",
        confidence: 0.91
      });
    }
  }

  // Check against active visual tree node (e.g. recursion tree factorial(2))
  if (
    (lower.includes("yeh") || lower.includes("this") || lower.includes("ye node")) &&
    surface?.conceptVisual?.activeNodeId
  ) {
    const activeNode = surface.conceptVisual.nodes.find(n => n.id === surface.conceptVisual?.activeNodeId);
    if (activeNode) {
      resolvedReferences.push({
        rawTerm: "yeh / this",
        resolvedEntity: `node ${activeNode.label} (value: ${activeNode.value || "active"})`,
        entityType: "visual_element",
        confidence: 0.88
      });
    }
  }

  return {
    originalText: userText,
    resolvedText,
    resolvedReferences
  };
}
