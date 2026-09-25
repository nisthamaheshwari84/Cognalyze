import { NextResponse } from "next/server";
import { getOrCreateLearningTwin, updateLearningTwin } from "@/lib/mentor/store";
import { KNOWLEDGE_GRAPH, getDomainNodes } from "@/lib/mentor/knowledge-graph";

interface DiagnosticQuestion {
  id: string;
  conceptId: string;
  conceptName: string;
  questionText: string;
  hints: string[];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain") || "System Design";

    const nodes = getDomainNodes(domain);
    const questions: DiagnosticQuestion[] = nodes.slice(0, 5).map((node, idx) => ({
      id: `diag-q-${idx + 1}`,
      conceptId: node.id,
      conceptName: node.title,
      questionText: node.coreQuestions[0] || `Explain your approach to ${node.title}.`,
      hints: [node.hintLadder.level1, node.hintLadder.level2]
    }));

    return NextResponse.json({
      success: true,
      domain,
      totalQuestions: questions.length,
      questions
    });
  } catch (err: any) {
    console.error("[GET /api/mentor/diagnostic] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch diagnostic questions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      candidateId = "student-demo",
      domain = "System Design",
      responses = []
    }: {
      candidateId?: string;
      domain?: string;
      responses: Array<{ conceptId: string; answerText: string }>;
    } = body;

    const twin = getOrCreateLearningTwin(candidateId, { domain });
    const nodes = getDomainNodes(domain);

    const demonstrated: string[] = [];
    const weak: string[] = [];
    const misconceptions: string[] = [];

    responses.forEach((resp) => {
      const node = KNOWLEDGE_GRAPH[resp.conceptId];
      if (!node) return;

      const lower = resp.answerText.toLowerCase();
      // Check for common misconception keywords
      node.commonMisconceptions.forEach((m) => {
        if (lower.includes("same") || lower.includes("always") || lower.includes("equal")) {
          misconceptions.push(`${node.title}: ${m.misconception}`);
        }
      });

      // Simple heuristic for initial baseline (rich reasoning vs empty/minimal)
      if (resp.answerText.length > 40 && (lower.includes("because") || lower.includes("trade-off") || lower.includes("latency") || lower.includes("overhead"))) {
        demonstrated.push(node.title);
        if (twin.concepts[node.id]) {
          twin.concepts[node.id].status = "mostly_understood";
        }
      } else {
        weak.push(node.title);
        if (twin.concepts[node.id]) {
          twin.concepts[node.id].status = "weak";
        }
      }
    });

    // Recommend starting concept: first weak node or first node with unfulfilled prerequisites
    const startingNode = nodes.find((n) => weak.includes(n.title)) || nodes[0];

    const diagnosticResults = {
      demonstratedConcepts: demonstrated,
      weakConcepts: weak,
      misconceptions,
      estimatedStartingConcept: startingNode?.title || "Foundations"
    };

    const updated = updateLearningTwin(candidateId, {
      diagnosticCompleted: true,
      diagnosticResults,
      activeConceptId: startingNode?.id || twin.activeConceptId
    });

    return NextResponse.json({
      success: true,
      diagnosticResults,
      learningTwin: updated
    });
  } catch (err: any) {
    console.error("[POST /api/mentor/diagnostic] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit diagnostic" }, { status: 500 });
  }
}
