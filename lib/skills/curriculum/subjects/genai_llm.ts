/**
 * lib/skills/curriculum/subjects/genai_llm.ts
 * 
 * Generative AI & Large Language Model Engineering Curriculum:
 * Prompt Architecture, Pydantic Structured Outputs, Token Embeddings,
 * Vector Databases, Hybrid Dense-Sparse RAG, and Evaluation Guardrails.
 */

import { CanonicalSubject } from "../types";

export const GENAI_LLM_SUBJECT: CanonicalSubject = {
  slug: "genai_llm",
  name: "Generative AI & LLM Engineering",
  icon: "✨",
  category: "AI & Modern ML",
  tagline: "Structured Outputs, Hybrid RAG & Vector Retrieval Systems",
  description: "Master modern production LLM engineering: deterministic schema enforcement with Pydantic, dense/sparse embeddings, Reciprocal Rank Fusion (RRF), semantic caching, and source-grounded evaluation.",
  estimatedHours: 40,
  prerequisites: ["python", "deep_learning"],
  chapters: [
    {
      slug: "hybrid-rag-and-retrieval",
      chapterNumber: 1,
      title: "Chapter 1: Hybrid RAG & Reciprocal Rank Fusion",
      description: "Combine semantic vector search with keyword-accurate BM25 lexical search using reciprocal rank fusion for robust enterprise retrieval.",
      topics: [
        {
          slug: "rrf-and-hybrid-search",
          title: "Dense + Sparse Hybrid Search with Reciprocal Rank Fusion",
          summary: "Overcome semantic blindness on exact IDs and keyword blindness on synonyms using dual-channel retrieval.",
          subtopics: [
            {
              id: "genai-101",
              slug: "reciprocal-rank-fusion-hybrid-rag",
              title: "Hybrid Retrieval Architecture: Combining Dense Embeddings and BM25 via RRF",
              subjectSlug: "genai_llm",
              chapterSlug: "hybrid-rag-and-retrieval",
              topicSlug: "rrf-and-hybrid-search",
              estimatedMinutes: 30,
              difficulty: "advanced",
              canonicalSkill: "rag_architecture_and_retrieval",
              prerequisites: [],
              learningGoal: "Implement Reciprocal Rank Fusion (RRF) with constant k=60 to merge non-comparable scores from dense semantic and sparse BM25 retrieval channels.",
              intuitiveStory: "Imagine asking a doctor for a medical diagnosis and asking an insurance billing coder for the exact alphanumeric ICD-10 billing code. Dense vector search is the doctor who understands general meaning; BM25 is the billing coder who requires exact character matches. RRF merges their recommendations fairly.",
              analogy: "RRF is an Olympic decathlon points table: it converts dissimilar raw scores (meters thrown vs seconds run) into rank points so they can be summed.",
              formalConcept: "Dense retrieval scores (cosine similarity) and sparse retrieval scores (BM25) have incompatible scales. Reciprocal Rank Fusion calculates score RRF(d) = sum(1 / (k + rank_i(d))), where k is typically 60 to dampen the influence of top ranks.",
              mathFormula: "\\text{RRF}(d \\in D) = \\sum_{m \\in M} \\frac{1}{k + r_m(d)}, \\quad k = 60",
              productionSignificance: "Single-channel vector search fails on part numbers, medical IDs, and exact error codes, while BM25 fails on semantic paraphrasing. Hybrid RAG is the enterprise standard.",
              visualType: "rag_pipeline",
              mermaidDiagram: `graph TD
    Query["User Query: 'Error ERR_403 invalid bearer token'"] --> Dense["Dense Vector Search<br/>Cosine Distance"]
    Query --> Sparse["Sparse Lexical Search<br/>BM25 Exact Match"]
    Dense --> RanksD["Dense Ranks: [Doc3, Doc1, Doc7]"]
    Sparse --> RanksS["Sparse Ranks: [Doc1, Doc2, Doc3]"]
    RanksD --> RRF["RRF Fusion Formula: 1 / (60 + rank)"]
    RanksS --> RRF
    RRF --> Out["Fused Order: Doc1 (Top Rank in both), Doc3, Doc2"]`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "Implementing Reciprocal Rank Fusion in Python",
                  explanation: "Accumulates reciprocal rank scores across multiple ranked lists.",
                  codeOrQuery: `def rrf_merge(dense_ranks: list[str], sparse_ranks: list[str], k: int = 60) -> list[tuple[str, float]]:
    scores: dict[str, float] = {}
    for rank, doc_id in enumerate(dense_ranks, start=1):
        scores[doc_id] = scores.get(doc_id, 0.0) + (1.0 / (k + rank))
    for rank, doc_id in enumerate(sparse_ranks, start=1):
        scores[doc_id] = scores.get(doc_id, 0.0) + (1.0 / (k + rank))
    return sorted(scores.items(), key=lambda item: item[1], reverse=True)

dense = ["doc_A", "doc_B", "doc_C"]
sparse = ["doc_B", "doc_D", "doc_A"]
print("Fused results:", rrf_merge(dense, sparse))`,
                  outputSummary: "doc_B ranks #1 because it placed #2 in dense and #1 in sparse."
                }
              ],
              audioNarrationScript: "When combining semantic embeddings with keyword search, never add raw cosine similarity to BM25 scores directly. Their numerical scales and variance are completely incompatible. Reciprocal Rank Fusion uses only the ordinal rank of each document, dividing one by sixty plus the rank. This provides a clean, robust ensemble.",
              coBuildSlot: {
                slotId: "genai-slot-101",
                instruction: "Complete the RRF score contribution: 1.0 / (k + rank).",
                starterSnippet: `def compute_rrf_score(rank: int, k: int = 60) -> float:\n    return 1.0 / (k + rank)`,
                expectedPattern: "1\\.0\\s*/\\s*\\(k\\s*\\+\\s*rank\\)",
                hint1: "Divide 1.0 by the sum of constant k and rank.",
                hint2: "Write: return 1.0 / (k + rank)",
                validationExplanation: "Correctly evaluates the Reciprocal Rank Fusion term."
              },
              executionEnvironment: "python_sandbox",
              starterCodeOrQuery: `def compute_rrf_score(rank: int, k: int = 60) -> float:
    return 1.0 / (k + rank)

print("Rank 1 score (k=60):", compute_rrf_score(1))
print("Rank 10 score (k=60):", compute_rrf_score(10))
`,
              debugFault: {
                faultId: "genai-fault-101",
                title: "Summing Unnormalized Cosine and BM25 Raw Scores",
                buggyCodeOrConfig: `def hybrid_score(cosine_sim: float, bm25_score: float) -> float:
    # Bug: BM25 ranges from 0 to 40+, while cosine is bounded in [-1, 1], causing BM25 to dominate 100%
    return cosine_sim + bm25_score`,
                correctCodeOrConfig: `def hybrid_score(dense_rank: int, sparse_rank: int, k: int = 60) -> float:
    return (1.0 / (k + dense_rank)) + (1.0 / (k + sparse_rank))`,
                diagnosticHint: "BM25 scores are unbounded and overpower bounded cosine similarities without min-max or rank normalization.",
                explanation: "RRF operates on ordinal ranks rather than unnormalized floating point magnitudes."
              },
              comprehensionChecks: [
                {
                  id: "genai-cc-101a",
                  question: "Why is the constant k (typically 60) included in the Reciprocal Rank Fusion denominator?",
                  options: [
                    "To ensure the final score is an integer.",
                    "To prevent high-ranked documents (e.g. rank 1 vs rank 2) from overwhelmingly dominating the entire ranking compared to slightly lower ranks.",
                    "Because 60 is the maximum number of documents allowed in a prompt context.",
                    "To convert radians to degrees."
                  ],
                  correctIndex: 1,
                  explanation: "Without constant k, rank 1 receives score 1.0 while rank 2 receives 0.5 (a 50% drop). With k=60, rank 1 receives 1/61 (~0.0163) and rank 2 receives 1/62 (~0.0161), smoothing rank sensitivity."
                }
              ],
              independentChallenge: {
                challengeId: "genai-chal-101",
                title: "Multi-Channel RAG Reranker with Top-K Filtering",
                description: "Write a function rerank_channels(dense_results, sparse_results, top_k=3) that implements RRF and returns the top_k unique document IDs.",
                starterCode: `def rerank_channels(dense_results: list[str], sparse_results: list[str], top_k: int = 3) -> list[str]:
    scores: dict[str, float] = {}
    for r, doc in enumerate(dense_results, start=1):
        scores[doc] = scores.get(doc, 0.0) + (1.0 / (60 + r))
    for r, doc in enumerate(sparse_results, start=1):
        scores[doc] = scores.get(doc, 0.0) + (1.0 / (60 + r))
    ranked = sorted(scores.keys(), key=lambda d: scores[d], reverse=True)
    return ranked[:top_k]
`,
                solutionCode: `def rerank_channels(dense_results: list[str], sparse_results: list[str], top_k: int = 3) -> list[str]:
    scores: dict[str, float] = {}
    for r, doc in enumerate(dense_results, start=1):
        scores[doc] = scores.get(doc, 0.0) + (1.0 / (60 + r))
    for r, doc in enumerate(sparse_results, start=1):
        scores[doc] = scores.get(doc, 0.0) + (1.0 / (60 + r))
    ranked = sorted(scores.keys(), key=lambda d: scores[d], reverse=True)
    return ranked[:top_k]
`,
                testCases: [
                  {
                    input: "dense=['A', 'B'], sparse=['B', 'C'], top_k=2",
                    expectedOutput: "['B', 'A']",
                    description: "B appears in both channels and takes rank #1."
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

