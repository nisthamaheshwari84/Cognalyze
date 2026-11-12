/**
 * lib/skills/ai-data/curriculum/rag-curriculum.ts
 * 
 * Complete Retrieval-Augmented Generation (RAG) Curriculum Decomposition.
 * Granular modules: Chunking Strategies, Embedding Models & Vector Spaces,
 * Vector Databases & HNSW Indexing, Hybrid Search, Cross-Encoder Rerankers,
 * Grounded Citations, and Ragas Evaluation Metrics.
 */

import { TaxonomyTopic, TaxonomyModule } from "../master-curriculum-taxonomy";

export const RAG_MODULES: TaxonomyModule[] = [
  {
    id: "mod_rag_architecture",
    trackId: "track_rag",
    title: "Module 1: Document Processing, Chunking & Dense Embeddings",
    description: "Recursive chunking, boundary overlaps, bi-encoder embeddings, and cosine similarity spaces.",
    order: 1,
    topics: [
      {
        id: "rag-01-chunking-embeddings",
        trackId: "track_rag",
        moduleId: "mod_rag_architecture",
        title: "Document Ingestion: Chunking Strategies, Overlap & Vector Spaces",
        order: 1,
        estimatedMinutes: 40,
        difficulty: "intermediate",
        prerequisites: ["np-04-broadcasting-rules"],
        roleRelevance: {
          data_analyst: { importance: "HIGH", why: "Enables semantic search across PDF annual reports and earnings calls." },
          data_scientist: { importance: "CRITICAL", why: "Evaluating embedding distance metrics and clustering high-dimensional text." },
          data_engineer: { importance: "CRITICAL", why: "Building robust vector ingestion pipelines with chunk batching and metadata." },
          ml_engineer: { importance: "CRITICAL", why: "Fine-tuning embedding models (BGE, Cohere, OpenAI) with contrastive loss." },
          mlops_engineer: { importance: "CRITICAL", why: "Monitoring vector embedding latency, token ingestion throughput, and cost." },
          ai_engineer: { importance: "CRITICAL", why: "The foundational layer of all enterprise knowledge retrieval engines." },
          genai_llm_engineer: { importance: "CRITICAL", why: "Chunking fidelity directly determines whether the LLM retrieves true facts." },
          applied_ai_engineer: { importance: "CRITICAL", why: "Connecting client document repositories to chat assistants." },
        },
        learningObjectives: [
          "Understand the trade-offs of chunk sizes: Small chunks (high precision, low context) vs Large chunks (high context, lost needle).",
          "Implement Recursive Character Text Splitting with paragraph, sentence, and word boundary fallbacks.",
          "Compute Dense Vector Embeddings and measure similarity using Cosine Distance."
        ],
        conceptsCovered: ["Fixed vs Recursive Chunking", "Chunk Overlap", "Dense Embeddings", "Cosine Similarity", "Semantic Drift"],
        subtopics: [
          { id: "rag-01-sub-1", title: "Chunk Overlap & The Sentence Severance Problem", order: 1, concepts: ["Overlap Window", "Sentence Boundary Preservation"] },
          { id: "rag-01-sub-2", title: "Embedding Vectors & Cosine Angle Math", order: 2, concepts: ["High-Dimensional Hyper-Sphere", "Unit Normalization"] }
        ],
        practicalOutcome: "Construct a text chunker with sliding overlap window and cosine similarity ranker in pure Python.",
        contextAndIntuition: {
          english: "If you cut a document into arbitrary 500-character pieces, you might slice a crucial sentence right in half: 'The patient has...' in chunk 1, and '...no history of allergy' in chunk 2. Chunk overlap creates a protective buffer so that boundary context is never severed, ensuring the embedding model captures complete semantic thoughts.",
          hinglish: "Agar aap kisi document ko bina dekhe 500 characters mein kaat denge, toh aadha sentence ek chunk mein aur aadha doosre mein chala jayega. Chunk overlap ek chhota sliding window rakhta hai taaki koi bhi important thought beech mein se na kate.",
          whyExists: "Prevents semantic severance and context loss when chunking large text corpora.",
          whatWasUsedBefore: "Naive character-count slicing that broke words and sentences."
        },
        deepExplanation: {
          english: "Recursive splitting tries delimiters in order: `[\"\\n\\n\", \"\\n\", \" \", \"\"]`. It splits at paragraph breaks first; if a paragraph is still too big, it splits at sentence breaks. Cosine similarity evaluates `(A . B) / (||A|| * ||B||)`. If vectors are L2-normalized upfront, cosine similarity simplifies to a single fast dot product `A . B`.",
          hinglish: "Recursive chunking pehle bade paragraph breaks dhoondhta hai; agar paragraph fir bhi bada ho toh sentence break use karta hai. Cosine similarity do vectors ke beech ka angle nikalta hai. Agar vectors pehle se normalized hon, toh cosine similarity direct dot product ban jati hai jo super-fast hoti hai.",
          internalMechanics: "Greedy boundary search with sliding window buffer; L2 vector normalization for O(D) dot-product similarity.",
          realWorldUsage: "Internal legal discovery search, technical support wiki RAG, and financial PDF QA.",
          commonMistakes: [
            "Setting overlap to 0 (causes severe context fragmentation at chunk edges).",
            "Embedding massive chunks (>2000 tokens) that dilute the specific answer needle in high-dimensional vector space."
          ]
        },
        visualDemoConfig: {
          type: "RAG_RETRIEVAL",
          initialState: {
            chunkSize: 500,
            overlap: 50,
            similarityScore: 0.82
          }
        },
        externalResources: [
          {
            id: "res-rag-chunk-01",
            creatorOrOrg: "CampusX",
            title: "Text Chunking Strategies in RAG: Fixed, Recursive & Semantic Splitting",
            topicCovered: "Chunk size trade-offs, overlap buffers, and vector embedding spaces",
            url: "https://www.youtube.com/watch?v=2xxziIWmaSA",
            timestamp: "00:25:00",
            language: "Hinglish",
            difficulty: "intermediate",
            whyRecommended: "Clear visual animations showing how sentences are preserved across chunk windows.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `def chunk_text(text, chunk_size=100, overlap=20):\n    # Split text into overlapping windows of chunk_size characters with 'overlap'\n    pass`,
        solutionSnippet: `def chunk_text(text, chunk_size=100, overlap=20):\n    chunks = []\n    start = 0\n    while start < len(text):\n        end = start + chunk_size\n        chunks.append(text[start:end])\n        if end >= len(text):\n            break\n        start += (chunk_size - overlap)\n    return chunks`
      }
    ]
  },
  {
    id: "mod_rag_advanced_retrieval",
    trackId: "track_rag",
    title: "Module 2: Hybrid Search, Reranking & Ragas Evaluation",
    description: "Combining Dense Vector Search with BM25 Lexical Keyword Search, Cross-Encoders, and Ragas metrics.",
    order: 2,
    topics: [
      {
        id: "rag-02-hybrid-search-reranking",
        trackId: "track_rag",
        moduleId: "mod_rag_advanced_retrieval",
        title: "Hybrid Search (Dense + BM25) & Cross-Encoder Reranking",
        order: 1,
        estimatedMinutes: 45,
        difficulty: "advanced",
        prerequisites: ["rag-01-chunking-embeddings"],
        roleRelevance: {
          data_analyst: { importance: "HIGH", why: "Ensures exact product SKUs and numerical codes match reliably in search." },
          data_scientist: { importance: "CRITICAL", why: "Ensembling lexical and semantic score distributions." },
          data_engineer: { importance: "CRITICAL", why: "Integrating OpenSearch / Elasticsearch with vector indices." },
          ml_engineer: { importance: "CRITICAL", why: "Deploying two-stage retrieval architectures with low latency." },
          mlops_engineer: { importance: "CRITICAL", why: "Balancing retrieval precision against cross-encoder inference cost." },
          ai_engineer: { importance: "CRITICAL", why: "Essential for production RAG systems where pure vector search fails on keywords." },
          genai_llm_engineer: { importance: "CRITICAL", why: "Maximizes LLM context precision and eliminates retrieval hallucinations." },
          applied_ai_engineer: { importance: "CRITICAL", why: "Building commercial search systems with high accuracy." },
        },
        learningObjectives: [
          "Understand why pure vector search fails on exact keyword queries (SKUs, IDs, medical codes, acronyms).",
          "Combine Dense Vector Search with BM25 Sparse Search using Reciprocal Rank Fusion (RRF).",
          "Deploy Cross-Encoder Rerankers to filter top-50 candidate chunks down to the top-3 highest-precision chunks."
        ],
        conceptsCovered: ["Hybrid Search", "BM25 Sparse Retrieval", "Reciprocal Rank Fusion (RRF)", "Bi-Encoder vs Cross-Encoder", "Reranker Scoring"],
        subtopics: [
          { id: "rag-02-sub-1", title: "Why Dense Embeddings Miss Exact Keyword Matches", order: 1, concepts: ["Embedding Blur", "Exact SKU Matching", "BM25 Scoring"] },
          { id: "rag-02-sub-2", title: "Reciprocal Rank Fusion (RRF) Algorithm", order: 2, concepts: ["RRF Constant K=60", "Rank Merging", "No Score Normalization Needed"] }
        ],
        practicalOutcome: "Implement Reciprocal Rank Fusion (RRF) in Python merging keyword and vector search rankings.",
        contextAndIntuition: {
          english: "If a user searches for 'Error Code 0x80070005', a vector model might match 'Windows authorization failure' conceptually, but miss the exact error page. BM25 keyword search finds the exact code instantly. Hybrid search combines the conceptual understanding of embeddings with the exact keyword precision of BM25.",
          hinglish: "Agar user 'Error 0x80070005' search kare, toh vector search conceptual similarity dekhta hai aur exact code miss kar sakta hai. BM25 keyword search exact match pakadta hai. Hybrid search dono ko jod kar perfect result deta hai.",
          whyExists: "Solves the fatal flaw of vector embeddings on acronyms, part numbers, and specific entities.",
          whatWasUsedBefore: "Pure vector search or pure keyword search independently."
        },
        deepExplanation: {
          english: "Reciprocal Rank Fusion (RRF) combines ranked lists without requiring score normalization: `RRF_Score(d) = sum(1 / (k + rank_i(d)))` where `k=60` is a standard constant. Cross-encoders then compute self-attention across the concatenated pair `[CLS] Query [SEP] Document [SEP]`, achieving state-of-the-art precision at the cost of higher compute.",
          hinglish: "RRF algorithm bina score normalize kiye do alag search lists ko rank ke basis par merge karta hai. Iske baad Cross-encoder model query aur document ko ek saath padh kar top results nikalta hai.",
          internalMechanics: "RRF formula: `score = 1 / (60 + dense_rank) + 1 / (60 + sparse_rank)`. Cross-encoder cross-attention over full token sequence.",
          realWorldUsage: "Enterprise document search engines, legal compliance review, and customer support RAG.",
          commonMistakes: [
            "Running a heavy Cross-Encoder over 10,000 documents (causes multi-second latency; run it only over top-50 candidates).",
            "Attempting to add raw cosine similarity scores directly to raw BM25 scores without rank fusion (scales are incompatible)."
          ]
        },
        visualDemoConfig: {
          type: "RAG_RETRIEVAL",
          initialState: {
            denseCandidates: 50,
            sparseCandidates: 50,
            rerankedFinal: 3
          }
        },
        externalResources: [
          {
            id: "res-rag-hybrid-01",
            creatorOrOrg: "CampusX",
            title: "Advanced RAG: Hybrid Search, BM25 & Cross-Encoder Rerankers",
            topicCovered: "Combining dense and sparse search, RRF math, and reranking pipelines",
            url: "https://www.youtube.com/watch?v=2xxziIWmaSA",
            timestamp: "00:45:00",
            language: "Hinglish",
            difficulty: "advanced",
            whyRecommended: "Clear visual comparisons of Bi-encoder vs Cross-encoder attention mechanisms.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `def reciprocal_rank_fusion(dense_ranks, sparse_ranks, k=60):\n    # dense_ranks and sparse_ranks are dicts mapping doc_id -> 1-based rank\n    # Return dict mapping doc_id -> rrf_score\n    pass`,
        solutionSnippet: `def reciprocal_rank_fusion(dense_ranks, sparse_ranks, k=60):\n    scores = {}\n    all_docs = set(dense_ranks.keys()) | set(sparse_ranks.keys())\n    for doc in all_docs:\n        score = 0.0\n        if doc in dense_ranks:\n            score += 1.0 / (k + dense_ranks[doc])\n        if doc in sparse_ranks:\n            score += 1.0 / (k + sparse_ranks[doc])\n        scores[doc] = round(score, 6)\n    return scores`
      }
    ]
  }
];
