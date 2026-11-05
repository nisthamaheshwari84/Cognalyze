/**
 * lib/skills/ai-data/multimedia-service.ts
 * 
 * Multimedia & Micro-Video Learning Service for AI & Data Arena.
 * Delivers 30-120s micro-concept lessons, transcripts, timed captions,
 * slide summaries, and audio narration playback with text fallback.
 */

export interface MicroVideoSegment {
  id: string;
  lessonSlug: string;
  conceptTitle: string;
  targetDurationSeconds: number; // 30 - 120 seconds
  transcriptMarkdown: string;
  timedCaptions: Array<{
    startSeconds: number;
    endSeconds: number;
    text: string;
  }>;
  keyTakeawayBullets: string[];
  visualDiagramType: "flowchart" | "stateDiagram" | "tensorGraph" | "dataGrid";
  mermaidDiagram: string;
  audioNarrationUrl?: string; // Optional real synthesized voice asset
}

export const MICRO_VIDEO_LIBRARY: Record<string, MicroVideoSegment> = {
  "attention-mechanics-60s": {
    id: "vid_att_60s",
    lessonSlug: "transformer-architecture-and-attention",
    conceptTitle: "Scaled Dot-Product Attention in 60 Seconds",
    targetDurationSeconds: 60,
    transcriptMarkdown: `Scaled Dot-Product Attention computes the compatibility between Queries and Keys, scales by the square root of dimension $d_k$ to avoid vanishing gradients in softmax, and takes a weighted sum of Values.
Formula: $\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$.
This allows every token in a sequence to dynamically attend to every other token.`,
    timedCaptions: [
      { startSeconds: 0, endSeconds: 15, text: "Scaled Dot-Product Attention maps Queries and Keys to Values." },
      { startSeconds: 15, endSeconds: 35, text: "Scaling by sqrt(d_k) prevents softmax from saturating in high dimensions." },
      { startSeconds: 35, endSeconds: 60, text: "The resulting weights dynamically blend contextual token representations." }
    ],
    keyTakeawayBullets: [
      "Query (Q) searches for relevant context; Key (K) describes content; Value (V) holds representation",
      "Scaling factor $\\sqrt{d_k}$ stabilizes softmax gradients for large embedding dimensions",
      "Complexity is $O(N^2)$ with respect to sequence length $N$"
    ],
    visualDiagramType: "flowchart",
    mermaidDiagram: `flowchart TD
  Q["Queries (Q)"] --> MatMul1["MatMul (Q × K^T)"]
  K["Keys (K)"] --> MatMul1
  MatMul1 --> Scale["Scale (÷ √d_k)"]
  Scale --> Mask["Optional Mask"]
  Mask --> Softmax["Softmax (Probabilities)"]
  Softmax --> MatMul2["MatMul (Weights × V)"]
  V["Values (V)"] --> MatMul2
  MatMul2 --> Out["Contextualized Vectors"]`
  },

  "ab-testing-srm-45s": {
    id: "vid_srm_45s",
    lessonSlug: "hypothesis-testing-and-experiment-design",
    conceptTitle: "Sample Ratio Mismatch (SRM) in 45 Seconds",
    targetDurationSeconds: 45,
    transcriptMarkdown: `Never analyze an A/B test before checking Sample Ratio Mismatch. If your traffic allocation is configured 50/50, but observed users show 55/45, a Chi-Square goodness-of-fit test will detect selection bias.
An experiment with an SRM is completely invalid—no matter how high the conversion lift seems.`,
    timedCaptions: [
      { startSeconds: 0, endSeconds: 15, text: "Before checking p-values, always test for Sample Ratio Mismatch." },
      { startSeconds: 15, endSeconds: 30, text: "A Chi-Square test verifies if the observed split deviates from expected allocation." },
      { startSeconds: 30, endSeconds: 45, text: "If SRM is detected (p < 0.01), selection bias invalidates all metrics." }
    ],
    keyTakeawayBullets: [
      "SRM occurs when traffic is routed unequally due to bot filters, redirect latency, or crash loops",
      "Goodness-of-fit $\\chi^2 = \\sum (O - E)^2 / E$ flags significant deviations",
      "Never roll out an A/B test variant with an unresolved SRM"
    ],
    visualDiagramType: "flowchart",
    mermaidDiagram: `flowchart LR
  Traffic["Incoming Traffic (50/50 Split)"] --> Router["Variant Router"]
  Router --> C["Control: 54,000"]
  Router --> T["Treatment: 46,000"]
  C & T --> ChiSq["Chi-Square SRM Test"]
  ChiSq --> Alert{"p < 0.01?"}
  Alert -->|Yes| Halt["HALT: Invalidate Test (Selection Bias)"]
  Alert -->|No| Safe["SAFE: Proceed to Two-Sample Z-Test"]`
  },

  "rag-hybrid-retrieval-60s": {
    id: "vid_rag_60s",
    lessonSlug: "rag-and-vector-databases",
    conceptTitle: "Hybrid Search & Reciprocal Rank Fusion in 60 Seconds",
    targetDurationSeconds: 60,
    transcriptMarkdown: `Pure vector similarity fails on exact keywords, product SKUs, and rare entity names.
Hybrid search resolves this by combining BM25 lexical keyword matching with dense embedding cosine similarity.
Reciprocal Rank Fusion (RRF) then scores each document using $RRF(d) = \\sum \\frac{1}{60 + r_k(d)}$, producing balanced, highly relevant retrieved context.`,
    timedCaptions: [
      { startSeconds: 0, endSeconds: 20, text: "Dense embeddings capture semantics, but struggle with exact identifiers." },
      { startSeconds: 20, endSeconds: 40, text: "BM25 handles rare keywords and precise terminology." },
      { startSeconds: 40, endSeconds: 60, text: "Reciprocal Rank Fusion blends both rankings into a superior top-k prompt context." }
    ],
    keyTakeawayBullets: [
      "Combines sparse keyword index (BM25) with dense vector index (HNSW)",
      "Reciprocal Rank Fusion merges ranked lists without score scale calibration",
      "Sub-second rerankers optimize precision before passing context to LLM"
    ],
    visualDiagramType: "flowchart",
    mermaidDiagram: `flowchart TD
  UserQ["User Query"] --> Sparse["BM25 Lexical Index"]
  UserQ --> Dense["Vector Embedding Index"]
  Sparse --> R1["Rank List 1"]
  Dense --> R2["Rank List 2"]
  R1 & R2 --> RRF["Reciprocal Rank Fusion (RRF)"]
  RRF --> Rerank["Cross-Encoder Reranker"]
  Rerank --> Context["Top-K Grounded Context"]`
  }
};

export function getMicroVideoBySlug(slug: string): MicroVideoSegment | undefined {
  return MICRO_VIDEO_LIBRARY[slug] || Object.values(MICRO_VIDEO_LIBRARY).find(v => v.lessonSlug === slug);
}
