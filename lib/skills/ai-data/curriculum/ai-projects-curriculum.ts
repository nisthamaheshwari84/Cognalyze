/**
 * lib/skills/ai-data/curriculum/ai-projects-curriculum.ts
 *
 * Complete Applied AI Projects Curriculum Decomposition for Cognalyze.
 * Covers: Customer Churn & Fraud ML, Enterprise RAG Assistants, Autonomous Research Crews,
 * Real-Time Scoring APIs, and End-to-End Production Capstones.
 */

import { TaxonomyTopic, TaxonomyModule } from "../master-curriculum-taxonomy";

export const AI_PROJECTS_MODULES: TaxonomyModule[] = [
  {
    id: "mod_ai_projects_predictive",
    trackId: "track_ai_projects",
    title: "Module 1: Production Tabular ML & Predictive Systems",
    description: "End-to-end engineering of customer churn, payment fraud detection, and demand forecasting systems.",
    order: 1,
    topics: [
      {
        id: "proj-01-customer-churn-pipeline",
        trackId: "track_ai_projects",
        moduleId: "mod_ai_projects_predictive",
        title: "Capstone: High-Throughput Customer Churn Prediction & Retention Engine",
        order: 1,
        estimatedMinutes: 60,
        difficulty: "advanced",
        prerequisites: ["ml-01-linear-regression-gradient-descent", "de-02-idempotent-pipelines"],
        roleRelevance: {
          data_analyst: { importance: "CRITICAL", why: "Synthesizing cohort churn drivers into executive action plans." },
          data_scientist: { importance: "CRITICAL", why: "Handling extreme class imbalance, calibrating probabilities, and calculating ROI lift." },
          data_engineer: { importance: "CRITICAL", why: "Building daily automated feature aggregation pipelines and model store exports." },
          ml_engineer: { importance: "CRITICAL", why: "Deploying low-latency scoring endpoints with model drift alarms." },
          mlops_engineer: { importance: "CRITICAL", why: "Automating retraining pipelines triggered by performance degradation." },
          ai_engineer: { importance: "HIGH", why: "Integrating predictive churn signals into personalized user retention workflows." },
          genai_llm_engineer: { importance: "HIGH", why: "Triggering proactive personalized email drafts based on predicted churn risks." },
          applied_ai_engineer: { importance: "CRITICAL", why: "Deploying end-to-end production systems that directly impact corporate ARR." }
        },
        learningObjectives: [
          "Engineer RFM (Recency, Frequency, Monetary) and temporal activity velocity features from raw transaction streams.",
          "Address extreme class imbalance (95% active / 5% churn) using SMOTE, focal loss, and precision-recall threshold tuning.",
          "Expose predictions via a containerized FastAPI endpoint returning predicted probabilities and SHAP top-3 drivers."
        ],
        conceptsCovered: ["End-to-End Pipeline", "Class Imbalance", "Threshold Tuning", "SHAP Feature Attribution", "FastAPI Serving"],
        subtopics: [
          { id: "proj-01-sub-1", title: "Feature Store Design: Behavioral Velocity & RFM Metrics", order: 1, concepts: ["Point-in-Time Correctness", "Temporal Leakage Prevention", "Feature Pipeline"] },
          { id: "proj-01-sub-2", title: "Model Calibration, Decision Thresholds & API Export", order: 2, concepts: ["Platt Scaling", "Expected Value Optimization", "Containerized Serving"] }
        ],
        practicalOutcome: "Implement a complete churn prediction pipeline with calibrated scoring and local FastAPI integration.",
        contextAndIntuition: {
          english: "Predicting whether a SaaS customer will cancel requires more than a simple `.fit()`. It requires assembling historical data without looking into the future, tuning probability thresholds based on the cost of marketing interventions vs the value of saved customers, and returning clear explanations for why a customer is at risk.",
          hinglish: "Real customer churn system mein sirf model train karna kaafi nahi hota. Historical data bina future leakage ke nikalna, business cost ke hisaab se probability threshold set karna aur har prediction ke saath explanation dena zaroori hota hai.",
          whyExists: "Enables companies to proactively retain high-value accounts before subscription cancellation.",
          whatWasUsedBefore: "Manual spreadsheet reviews done after the customer had already cancelled."
        },
        deepExplanation: {
          english: "Optimal threshold selection minimizes expected business cost: `T* = argmin_T [Cost_FN * FN(T) + Cost_FP * FP(T)]`. Rather than defaulting to 0.5, when losing a customer costs $1000 and sending a promotional retention discount costs $20, the threshold `T*` shifts significantly lower (e.g. 0.15) to capture high-recall intervention targets.",
          hinglish: "Business cost matrix ke through threshold optimize kiya jata hai. Agar customer lose karna bohot mehnga hai toh threshold kam karke recall badhayi jati hai taaki koi bhi at-risk customer miss na ho.",
          internalMechanics: "Brier score probability calibration, TreeSHAP tree traversal attribution, and async non-blocking REST endpoints.",
          realWorldUsage: "Telecom churn prevention at Verizon, SaaS retention at Salesforce, and e-commerce loyalty at Amazon.",
          commonMistakes: [
            "Optimizing for raw Accuracy on a 98% non-churn dataset (a dumb model predicting 0 gets 98% accuracy but 0 value).",
            "Failing to calibrate predicted probabilities before using them in financial decision calculations."
          ]
        },
        externalResources: [
          {
            id: "res-proj-churn-01",
            creatorOrOrg: "Scikit-Learn & Industry ML Systems",
            title: "Cost-Sensitive Machine Learning & Probability Calibration in Production",
            topicCovered: "Class imbalance, threshold optimization, probability calibration, and business impact",
            url: "https://scikit-learn.org/stable/modules/calibration.html",
            language: "English",
            difficulty: "advanced",
            whyRecommended: "Comprehensive guide to turning ML probabilities into calibrated business decisions.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `def calculate_optimal_threshold(y_true, y_probs, cost_fp=20, cost_fn=1000):\n    # Find probability threshold minimizing total business loss\n    return 0.5`,
        solutionSnippet: `def calculate_optimal_threshold(y_true, y_probs, cost_fp=20, cost_fn=1000):\n    best_thresh = 0.5\n    min_loss = float('inf')\n    for t in [i * 0.05 for i in range(1, 20)]:\n        preds = [1 if p >= t else 0 for p in y_probs]\n        fp = sum(1 for yt, yp in zip(y_true, preds) if yt == 0 and yp == 1)\n        fn = sum(1 for yt, yp in zip(y_true, preds) if yt == 1 and yp == 0)\n        loss = fp * cost_fp + fn * cost_fn\n        if loss < min_loss:\n            min_loss = loss\n            best_thresh = t\n    return best_thresh`
      }
    ]
  },
  {
    id: "mod_ai_projects_rag_agents",
    trackId: "track_ai_projects",
    title: "Module 2: Enterprise RAG & Autonomous Agent Capstones",
    description: "Building production-grade document intelligence, hybrid vector retrieval, and multi-agent collaborative workflows.",
    order: 2,
    topics: [
      {
        id: "proj-02-enterprise-rag-assistant",
        trackId: "track_ai_projects",
        moduleId: "mod_ai_projects_rag_agents",
        title: "Capstone: Enterprise Document Intelligence RAG Platform with Reranking",
        order: 1,
        estimatedMinutes: 60,
        difficulty: "advanced",
        prerequisites: ["rag-01-chunking-embeddings", "agent-01-react-loop-tools"],
        roleRelevance: {
          data_analyst: { importance: "HIGH", why: "Empowering instant querying across thousands of unstructured reports and PDFs." },
          data_scientist: { importance: "CRITICAL", why: "Evaluating semantic retrieval precision, context recall, and hallucination reduction." },
          data_engineer: { importance: "CRITICAL", why: "Building scalable chunk ingestion, embedding pipelines, and vector database indices." },
          ml_engineer: { importance: "CRITICAL", why: "Deploying hybrid BM25 + dense search and cross-encoder reranker models." },
          mlops_engineer: { importance: "CRITICAL", why: "Monitoring vector query latency, token usage costs, and automated chunk re-indexing." },
          ai_engineer: { importance: "CRITICAL", why: "Flagship architecture for enterprise knowledge search and conversational AI." },
          genai_llm_engineer: { importance: "CRITICAL", why: "Context window packing, strict citation grounding, and fallback generation." },
          applied_ai_engineer: { importance: "CRITICAL", why: "Delivering enterprise-ready, hallucination-resistant knowledge applications." }
        },
        learningObjectives: [
          "Ingest and chunk complex documents (PDFs, Markdown) with metadata preservation and sliding overlap windows.",
          "Implement Hybrid Search: Combining sparse lexical search (BM25) with dense vector embeddings via Reciprocal Rank Fusion (RRF).",
          "Deploy Cross-Encoder Reranking and evaluate answer faithfulness using the RAGAS metric triad."
        ],
        conceptsCovered: ["Hybrid Search", "BM25 + Dense", "Reciprocal Rank Fusion", "Cross-Encoder Reranking", "Faithfulness Scoring"],
        subtopics: [
          { id: "proj-02-sub-1", title: "Reciprocal Rank Fusion (RRF) & Sparse-Dense Fusion", order: 1, concepts: ["BM25 Token Scoring", "Dense Cosine Similarity", "RRF Constant k=60"] },
          { id: "proj-02-sub-2", title: "Cross-Encoder Reranking & Faithfulness Verification", order: 2, concepts: ["Full Joint Attention", "Faithfulness Metric", "Grounded Citations"] }
        ],
        practicalOutcome: "Construct an end-to-end RAG pipeline with Reciprocal Rank Fusion and cross-encoder reranking.",
        contextAndIntuition: {
          english: "Dense vector search often fails on exact alphanumeric queries like error code 'ERR_9042_TIMEOUT' because embedding models blur rare tokens. Hybrid search uses BM25 to catch exact keyword matches and dense embeddings to catch semantic meaning, fusing them together to retrieve the needle in any enterprise haystack.",
          hinglish: "Dense vector search exact part numbers ya error codes miss kar deta hai kyunki wo overall meaning par focus karta hai. Hybrid search BM25 ke exact keyword matching aur dense vector search ke semantic understanding ko combine karta hai taaki exact answer mil sake.",
          whyExists: "Eliminates enterprise retrieval failures and hallucinations in high-stakes domains.",
          whatWasUsedBefore: "Naive vector-only search that retrieved conceptually related paragraphs while missing the specific requested invoice number."
        },
        deepExplanation: {
          english: "Reciprocal Rank Fusion combines ranked lists: `RRF_Score(d) = sum_m [ 1 / (k + rank_m(d)) ]`, where `k=60` prevents top-ranked outliers from dominating. The top 20 fused candidates are passed to a Cross-Encoder that performs joint token-level attention `Attention(Query + Document)` to output calibrated relevance logits.",
          hinglish: "RRF sparse aur dense search ke rank scores ko fuse karta hai. Uske baad top candidates cross-encoder model ke paas jaate hain jo query aur document ke beech exact joint attention perform karke highest precision ranking deta hai.",
          internalMechanics: "Inverted index posting lists + HNSW graph traversal + cross-attention re-scoring with top-K truncation.",
          realWorldUsage: "Internal legal discovery search at law firms, technical documentation search at Stripe, and medical literature review.",
          commonMistakes: [
            "Passing 50 unranked raw chunks directly to the LLM, causing needle-in-a-haystack context dilution and high API costs.",
            "Generating answers without verifying that claimed facts appear in the retrieved context chunks."
          ]
        },
        externalResources: [
          {
            id: "res-proj-rag-01",
            creatorOrOrg: "Pinecone & Cohere AI",
            title: "Advanced RAG Architecture: Hybrid Search, Reranking, and Context Optimization",
            topicCovered: "Hybrid search, Reciprocal Rank Fusion, cross-encoders, and RAG evaluation",
            url: "https://www.pinecone.io/learn/advanced-rag-techniques/",
            language: "English",
            difficulty: "advanced",
            whyRecommended: "Comprehensive industrial guide to production retrieval-augmented generation.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `def reciprocal_rank_fusion(dense_ranks, sparse_ranks, k=60):\n    # Combine two ranked lists using RRF formula\n    return []`,
        solutionSnippet: `def reciprocal_rank_fusion(dense_ranks, sparse_ranks, k=60):\n    scores = {}\n    for rank, doc_id in enumerate(dense_ranks, start=1):\n        scores[doc_id] = scores.get(doc_id, 0.0) + (1.0 / (k + rank))\n    for rank, doc_id in enumerate(sparse_ranks, start=1):\n        scores[doc_id] = scores.get(doc_id, 0.0) + (1.0 / (k + rank))\n    return sorted(scores.keys(), key=lambda d: scores[d], reverse=True)`
      }
    ]
  }
];
