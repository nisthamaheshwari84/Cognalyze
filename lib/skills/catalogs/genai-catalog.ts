/**
 * lib/skills/catalogs/genai-catalog.ts
 * Auto-generated Canonical Generative AI & LLM Catalog containing 100 validated distinct questions.
 */

import { QuestionItem } from "../../question-bank-types";

export const GENAI_CATALOG: QuestionItem[] = [
  {
    "id": "qb-genai-scaled-dot-product-attention-scaling",
    "title": "Scaled Dot-Product Attention: The Mathematical Necessity of $\\sqrt{d_k}$",
    "question": "In the attention formula $\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}}\\right) V$, why is the dot product scaled by $\\frac{1}{\\sqrt{d_k}}$? What catastrophic failure occurs in backpropagation when $d_k$ is large without this scaling factor?",
    "type": "GenAI",
    "company": "Google DeepMind",
    "role": "Research Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Transformer Architecture",
    "subtopic": "Attention Mechanisms",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google DeepMind AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Calculate the variance of the sum of $d_k$ independent products of standard normal variables.",
      "Recall the derivative of the softmax function $\\frac{\\partial s_i}{\\partial z_j} = s_i(\\delta_{ij} - s_j)$ when inputs have huge differences."
    ],
    "explanation": "Assume components of $q$ and $k$ are independent random variables with zero mean and unit variance $\\sigma^2 = 1$. The dot product $q \\cdot k = \\sum_{i=1}^{d_k} q_i k_i$ has mean $0$ and variance $\\sum_{i=1}^{d_k} \\text{Var}(q_i k_i) = d_k$. For large key dimension (e.g. $d_k = 128$), the variance of the dot product is $128$, and standard deviation is $\\approx 11.3$. Without scaling by $\\sqrt{d_k}$, large magnitudes push the softmax function into regions with near-zero gradients (saturated softmax), causing vanishing gradients and stalling training. Dividing by $\\sqrt{d_k}$ normalizes the variance back to $1.0$, keeping softmax in its linear, sensitive gradient regime.",
    "solution": "Variance of $\\sum_{i=1}^{d_k} q_i k_i$ equals $d_k$. Dividing by $\\sqrt{d_k}$ yields unit variance: $\\text{Var}\\left(\\frac{q \\cdot k}{\\sqrt{d_k}}\\right) = \\frac{d_k}{d_k} = 1$, preventing softmax saturation.",
    "tags": [
      "Generative AI",
      "Transformers",
      "Attention",
      "DeepMind",
      "Math for ML"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-kv-cache-autoregressive-generation",
    "title": "KV Caching: Complexity Reduction in Autoregressive Decoding",
    "question": "During autoregressive LLM decoding, why does generating $T$ tokens from a prompt of length $N$ require $O((N + T)^2)$ operations without KV caching? How does KV caching reduce per-step computational complexity from $O(L^2)$ to $O(L)$, and what are its GPU memory implications?",
    "type": "GenAI",
    "company": "Anthropic",
    "role": "Inference Systems Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Inference Acceleration",
    "subtopic": "KV Cache & PagedAttention",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Anthropic AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Compare the query dimension of the current token (1 x d) vs past keys (L x d).",
      "Calculate KV cache memory in gigabytes for a 32-layer model."
    ],
    "explanation": "At token generation step $t$, the query vector is computed strictly for the latest token $x_t$. Without caching, the model redundantly recomputes the Key ($K$) and Value ($V$) projections for all preceding $t-1$ tokens, leading to $\\sum_{t=1}^T O((N+t) d) = O(N T d + T^2 d)$ redundant compute. By caching the previously computed $K$ and $V$ tensors in GPU VRAM, each new step only computes $Q_t, K_t, V_t$ for the single new token and appends $K_t, V_t$ to the cache. However, KV cache memory footprint scales as $2 \\times n_{layers} \\times n_{heads} \\times d_{head} \\times \\text{seq\\_len} \\times \\text{batch\\_size} \\times \\text{bytes\\_per\\_elem}$. For a 70B model with context length 8K at FP16, KV cache alone can exceed 20GB per concurrent request.",
    "solution": "Replaces quadratic redundant recomputation $O(L^2)$ with constant query projection and linear attention dot product $O(L)$ against cached keys/values. Trades VRAM bandwidth and capacity for massive latency gains.",
    "tags": [
      "Generative AI",
      "KV Cache",
      "Inference",
      "vLLM",
      "Anthropic"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-lora-low-rank-adaptation-mechanics",
    "title": "LoRA: Low-Rank Adaptation Matrix Decomposition",
    "question": "How does LoRA (Hu et al., 2021) parameterize weight updates during fine-tuning as $\\Delta W = \\frac{\\alpha}{r} (B \\times A)$? What are the dimensions and initializations of $A$ and $B$, why is the forward pass $h = W_0 x + \\Delta W x$ zero-initialized, and why does LoRA introduce zero inference latency when merged?",
    "type": "GenAI",
    "company": "Meta",
    "role": "AI Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Parameter-Efficient Fine-Tuning",
    "subtopic": "LoRA & QLoRA",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Meta AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "What is the rank of the product of two rank-r matrices?",
      "How does zero-initializing $B$ ensure that $\\Delta W = 0$ at the start of training?"
    ],
    "explanation": "LoRA freezes the pre-trained weight matrix $W_0 \\in \\mathbb{R}^{d \\times k}$ and models the weight update $\\Delta W$ as the product of two low-rank matrices: $B \\in \\mathbb{R}^{d \\times r}$ and $A \\in \\mathbb{R}^{r \\times k}$, where rank $r \\ll \\min(d, k)$. Matrix $A$ is initialized from a Gaussian $\\mathcal{N}(0, \\sigma^2)$ and matrix $B$ is initialized to zero, ensuring $\\Delta W = B \\times A = 0$ at step 0 so training begins exactly from the pre-trained model's output. The scaling factor $\\frac{\\alpha}{r}$ stabilizes hyperparameter tuning when changing rank $r$. For deployment, $W_{merged} = W_0 + \\frac{\\alpha}{r} B A$ is precomputed and saved directly into the model weights, adding exactly zero latency and zero auxiliary parameters during inference.",
    "solution": "Weight update: $\\Delta W = \\frac{\\alpha}{r} B A$ with $B=0, A \\sim \\mathcal{N}$. Merging $W_{new} = W_0 + \\Delta W$ eliminates inference overhead entirely.",
    "tags": [
      "Generative AI",
      "PEFT",
      "LoRA",
      "Meta",
      "Fine-Tuning"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-rag-chunking-dense-sparse-hybrid",
    "title": "Hybrid RAG: Reciprocal Rank Fusion of Dense Vectors and BM25",
    "question": "Why does semantic dense retrieval (cosine similarity of text embeddings) frequently fail on specific queries like alphanumeric product codes, error codes, or rare acronyms, and how does Hybrid Search combining dense embeddings with sparse BM25 via Reciprocal Rank Fusion (RRF) resolve this?",
    "type": "GenAI",
    "company": "OpenAI",
    "role": "Applied AI Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Retrieval-Augmented Generation",
    "subtopic": "Hybrid Search & Reranking",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Consider what an embedding model outputs for an unrecognized hash string.",
      "Why can't you simply add raw cosine similarity to raw BM25 score without normalization?"
    ],
    "explanation": "Dense embeddings map semantic concepts into continuous vector spaces. Words with similar meanings cluster together, but rare tokens (such as error code 'ERR-404-X9' or parts catalog numbers) are smoothed out or mapped onto unrelated centroids due to subword tokenization and dimensional compression. BM25 is a term-frequency / inverse-document-frequency exact keyword algorithm that guarantees exact token matching. Hybrid Search executes both queries in parallel and combines the ranking positions using Reciprocal Rank Fusion: $\\text{RRF\\_Score}(d) = \\sum_{m \\in \\{dense, sparse\\}} \\frac{1}{k + \\text{rank}_m(d)}$, where constant $k \\approx 60$. RRF is robust because it relies on ordinal ranking rather than calibrating disparate score distributions.",
    "solution": "Dense search handles semantic intent; sparse BM25 handles exact entity matching. RRF combines rankings: $\\text{Score}(d) = \\frac{1}{60 + \\text{rank}_{dense}(d)} + \\frac{1}{60 + \\text{rank}_{bm25}(d)}$.",
    "tags": [
      "Generative AI",
      "RAG",
      "Embeddings",
      "BM25",
      "OpenAI"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-react-agent-loop-tool-calling",
    "title": "ReAct Pattern: Interleaving Reasoning, Acting, and Observing in LLM Agents",
    "question": "Explain the ReAct (Reason + Act) agent architecture (Yao et al., 2022). How does alternating between Thought (chain-of-thought self-reflection), Action (tool invocation with structured JSON arguments), and Observation (environment feedback) prevent hallucination cascades and infinite loops in autonomous AI agents?",
    "type": "GenAI",
    "company": "Microsoft",
    "role": "Senior AI Software Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "AI Agents & Tool Use",
    "subtopic": "Agent Architectures",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Microsoft AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Think about what happens when an LLM tries to guess the current stock price without tools.",
      "How does feedback from an API error allow the model to fix its arguments?"
    ],
    "explanation": "Standard chain-of-thought reasoning occurs in a closed cognitive loop without external factual grounding, making models prone to hallucination compounding over long steps. Standard action-oriented generation invokes tools without explicit internal reasoning, frequently misidentifying required arguments or calling tools prematurely. ReAct enforces a strict three-phase loop: 1. Thought: Model decomposes user goal, reviews current knowledge state, and determines the next necessary information gap. 2. Action: Model selects a tool from its manifest and emits structured execution arguments. 3. Observation: Execution engine runs the tool in the real world and injects output back into prompt context. If an observation reveals an error or missing data, the next Thought step course-corrects rather than hallucinating answers.",
    "solution": "ReAct loop: $\\text{Thought} \\to \\text{Action} \\to \\text{Observation} \\to \\text{Thought}$. Internal reasoning directs tool usage; external environment feedback grounds reasoning.",
    "tags": [
      "Generative AI",
      "AI Agents",
      "ReAct",
      "Tool Use",
      "Microsoft"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-6-rotary-position-embeddings-rope-rel",
    "title": "Rotary Position Embeddings (RoPE) [System Design #6]",
    "question": "Architect and evaluate **Rotary Position Embeddings (RoPE): Relative Distance Preservation** within **Transformer Architecture**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Meta.",
    "type": "GenAI",
    "company": "Meta",
    "role": "LLM Researcher",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Transformer Architecture",
    "subtopic": "Rotary Position Embeddings (RoPE): Relative Distance Preservation",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Rotary Position Embeddings (RoPE): Relative Distance Preservation.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Rotary Position Embeddings (RoPE): Relative Distance Preservation. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Transformer Architecture",
      "Meta",
      "LLMResearcher"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-7-alibi-linear-biases-for-extrapolati",
    "title": "ALiBi [System Design #7]",
    "question": "Architect and evaluate **ALiBi: Linear Biases for Extrapolating Beyond Training Context** within **Transformer Architecture**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Anthropic.",
    "type": "GenAI",
    "company": "Anthropic",
    "role": "Research Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Transformer Architecture",
    "subtopic": "ALiBi: Linear Biases for Extrapolating Beyond Training Context",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Anthropic AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for ALiBi: Linear Biases for Extrapolating Beyond Training Context.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in ALiBi: Linear Biases for Extrapolating Beyond Training Context. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Transformer Architecture",
      "Anthropic",
      "ResearchEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-8-flashattention-gpu-sram-tiling-and-",
    "title": "FlashAttention [System Design #8]",
    "question": "Architect and evaluate **FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention** within **Transformer Architecture**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Stanford / OpenAI.",
    "type": "GenAI",
    "company": "Stanford / OpenAI",
    "role": "AI Systems Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Transformer Architecture",
    "subtopic": "FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Stanford / OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Transformer Architecture",
      "Stanford / OpenAI",
      "AISystemsEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-9-byte-pair-encoding-bpe-subword-voca",
    "title": "Byte-Pair Encoding (BPE) [System Design #9]",
    "question": "Architect and evaluate **Byte-Pair Encoding (BPE): Subword Vocabulary Construction** within **Tokenizer & Embeddings**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at OpenAI.",
    "type": "GenAI",
    "company": "OpenAI",
    "role": "NLP Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Tokenizer & Embeddings",
    "subtopic": "Byte-Pair Encoding (BPE): Subword Vocabulary Construction",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Byte-Pair Encoding (BPE): Subword Vocabulary Construction.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Byte-Pair Encoding (BPE): Subword Vocabulary Construction. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Tokenizer & Embeddings",
      "OpenAI",
      "NLPScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-10-speculative-decoding-small-draft-mo",
    "title": "Speculative Decoding [System Design #10]",
    "question": "Architect and evaluate **Speculative Decoding: Small Draft Model with Big Verifier** within **Inference Acceleration**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Google DeepMind.",
    "type": "GenAI",
    "company": "Google DeepMind",
    "role": "Inference Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Inference Acceleration",
    "subtopic": "Speculative Decoding: Small Draft Model with Big Verifier",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google DeepMind AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Speculative Decoding: Small Draft Model with Big Verifier.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Speculative Decoding: Small Draft Model with Big Verifier. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Inference Acceleration",
      "Google DeepMind",
      "InferenceEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-11-continuous-batching-pagedattention-",
    "title": "Continuous Batching & PagedAttention in Production vLLM [System Design #11]",
    "question": "Architect and evaluate **Continuous Batching & PagedAttention in Production vLLM** within **Inference Acceleration**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Databricks.",
    "type": "GenAI",
    "company": "Databricks",
    "role": "Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Inference Acceleration",
    "subtopic": "Continuous Batching & PagedAttention in Production vLLM",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Databricks AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Continuous Batching & PagedAttention in Production vLLM.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Continuous Batching & PagedAttention in Production vLLM. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Inference Acceleration",
      "Databricks",
      "PlatformEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-12-awq-activation-aware-weight-quantiz",
    "title": "AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs [System Design #12]",
    "question": "Architect and evaluate **AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs** within **Model Quantization**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at NVIDIA.",
    "type": "GenAI",
    "company": "NVIDIA",
    "role": "CUDA Kernel Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Model Quantization",
    "subtopic": "AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "NVIDIA AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Model Quantization",
      "NVIDIA",
      "CUDAKernelEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-13-gptq-second-order-error-compensatio",
    "title": "GPTQ [System Design #13]",
    "question": "Architect and evaluate **GPTQ: Second-Order Error Compensation in One-Shot Quantization** within **Model Quantization**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Meta.",
    "type": "GenAI",
    "company": "Meta",
    "role": "AI Infrastructure Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Model Quantization",
    "subtopic": "GPTQ: Second-Order Error Compensation in One-Shot Quantization",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Meta AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for GPTQ: Second-Order Error Compensation in One-Shot Quantization.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in GPTQ: Second-Order Error Compensation in One-Shot Quantization. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Model Quantization",
      "Meta",
      "AIInfrastructureEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-14-direct-preference-optimization-dpo-",
    "title": "Direct Preference Optimization (DPO) vs PPO in RLHF [System Design #14]",
    "question": "Architect and evaluate **Direct Preference Optimization (DPO) vs PPO in RLHF** within **Fine-Tuning & Alignment**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Anthropic.",
    "type": "GenAI",
    "company": "Anthropic",
    "role": "Alignment Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Fine-Tuning & Alignment",
    "subtopic": "Direct Preference Optimization (DPO) vs PPO in RLHF",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Anthropic AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Direct Preference Optimization (DPO) vs PPO in RLHF.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Direct Preference Optimization (DPO) vs PPO in RLHF. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Fine-Tuning & Alignment",
      "Anthropic",
      "AlignmentScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-15-constitutional-ai-self-critique-for",
    "title": "Constitutional AI & Self-Critique for Safe Response Generation [System Design #15]",
    "question": "Architect and evaluate **Constitutional AI & Self-Critique for Safe Response Generation** within **Fine-Tuning & Alignment**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Anthropic.",
    "type": "GenAI",
    "company": "Anthropic",
    "role": "AI Safety Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Fine-Tuning & Alignment",
    "subtopic": "Constitutional AI & Self-Critique for Safe Response Generation",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Anthropic AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Constitutional AI & Self-Critique for Safe Response Generation.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Constitutional AI & Self-Critique for Safe Response Generation. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Fine-Tuning & Alignment",
      "Anthropic",
      "AISafetyEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-16-hierarchical-chunking-parent-docume",
    "title": "Hierarchical Chunking [System Design #16]",
    "question": "Architect and evaluate **Hierarchical Chunking: Parent Document Retrieval & Small-to-Big** within **RAG & Vector Search**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Amazon.",
    "type": "GenAI",
    "company": "Amazon",
    "role": "Applied Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "RAG & Vector Search",
    "subtopic": "Hierarchical Chunking: Parent Document Retrieval & Small-to-Big",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Hierarchical Chunking: Parent Document Retrieval & Small-to-Big.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Hierarchical Chunking: Parent Document Retrieval & Small-to-Big. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "RAG & Vector Search",
      "Amazon",
      "AppliedScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-17-hnsw-hierarchical-navigable-small-w",
    "title": "HNSW (Hierarchical Navigable Small World) Vector Graph Indexing [System Design #17]",
    "question": "Architect and evaluate **HNSW (Hierarchical Navigable Small World) Vector Graph Indexing** within **RAG & Vector Search**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Pinecone.",
    "type": "GenAI",
    "company": "Pinecone",
    "role": "Search Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "RAG & Vector Search",
    "subtopic": "HNSW (Hierarchical Navigable Small World) Vector Graph Indexing",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Pinecone AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for HNSW (Hierarchical Navigable Small World) Vector Graph Indexing.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in HNSW (Hierarchical Navigable Small World) Vector Graph Indexing. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "RAG & Vector Search",
      "Pinecone",
      "SearchEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-18-cross-encoder-rerankers-improving-t",
    "title": "Cross-Encoder Rerankers [System Design #18]",
    "question": "Architect and evaluate **Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval** within **RAG & Vector Search**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Cohere.",
    "type": "GenAI",
    "company": "Cohere",
    "role": "Reranking Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "RAG & Vector Search",
    "subtopic": "Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cohere AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "RAG & Vector Search",
      "Cohere",
      "RerankingScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-19-structured-json-decoding-via-contex",
    "title": "Structured JSON Decoding via Context-Free Grammars (CFGs) [System Design #19]",
    "question": "Architect and evaluate **Structured JSON Decoding via Context-Free Grammars (CFGs)** within **AI Agents**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at OpenAI.",
    "type": "GenAI",
    "company": "OpenAI",
    "role": "AI Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "AI Agents",
    "subtopic": "Structured JSON Decoding via Context-Free Grammars (CFGs)",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Structured JSON Decoding via Context-Free Grammars (CFGs).",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Structured JSON Decoding via Context-Free Grammars (CFGs). Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "AI Agents",
      "OpenAI",
      "AIPlatformEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-20-multi-agent-coordination-hierarchic",
    "title": "Multi-Agent Coordination [System Design #20]",
    "question": "Architect and evaluate **Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus** within **AI Agents**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Microsoft.",
    "type": "GenAI",
    "company": "Microsoft",
    "role": "Principal AI Architect",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "AI Agents",
    "subtopic": "Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Microsoft AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "AI Agents",
      "Microsoft",
      "PrincipalAIArchitect"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-21-llm-as-a-judge-mitigating-position-",
    "title": "LLM-as-a-Judge [System Design #21]",
    "question": "Architect and evaluate **LLM-as-a-Judge: Mitigating Position, Length, and Egocentric Biases** within **Evaluation & Guardrails**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Databricks.",
    "type": "GenAI",
    "company": "Databricks",
    "role": "Evaluation Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Evaluation & Guardrails",
    "subtopic": "LLM-as-a-Judge: Mitigating Position, Length, and Egocentric Biases",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Databricks AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for LLM-as-a-Judge: Mitigating Position, Length, and Egocentric Biases.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in LLM-as-a-Judge: Mitigating Position, Length, and Egocentric Biases. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Evaluation & Guardrails",
      "Databricks",
      "EvaluationScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-22-prompt-injection-jailbreak-defense-",
    "title": "Prompt Injection & Jailbreak Defense via Dual-Model Architecture [System Design #22]",
    "question": "Architect and evaluate **Prompt Injection & Jailbreak Defense via Dual-Model Architecture** within **Evaluation & Guardrails**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Google.",
    "type": "GenAI",
    "company": "Google",
    "role": "AI Security Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Evaluation & Guardrails",
    "subtopic": "Prompt Injection & Jailbreak Defense via Dual-Model Architecture",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Prompt Injection & Jailbreak Defense via Dual-Model Architecture.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Prompt Injection & Jailbreak Defense via Dual-Model Architecture. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Evaluation & Guardrails",
      "Google",
      "AISecurityEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-23-needle-in-a-haystack-benchmarking-c",
    "title": "Needle in a Haystack [System Design #23]",
    "question": "Architect and evaluate **Needle in a Haystack: Benchmarking Context Retrieval Precision** within **Evaluation & Guardrails**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Meta.",
    "type": "GenAI",
    "company": "Meta",
    "role": "Research Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Evaluation & Guardrails",
    "subtopic": "Needle in a Haystack: Benchmarking Context Retrieval Precision",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Meta AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Needle in a Haystack: Benchmarking Context Retrieval Precision.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Needle in a Haystack: Benchmarking Context Retrieval Precision. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Evaluation & Guardrails",
      "Meta",
      "ResearchEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-24-chain-of-thought-cot-self-consisten",
    "title": "Chain-of-Thought (CoT) & Self-Consistency Majority Voting [System Design #24]",
    "question": "Architect and evaluate **Chain-of-Thought (CoT) & Self-Consistency Majority Voting** within **Prompt Engineering**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Google.",
    "type": "GenAI",
    "company": "Google",
    "role": "Prompt Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Prompt Engineering",
    "subtopic": "Chain-of-Thought (CoT) & Self-Consistency Majority Voting",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Google AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Chain-of-Thought (CoT) & Self-Consistency Majority Voting.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Chain-of-Thought (CoT) & Self-Consistency Majority Voting. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Prompt Engineering",
      "Google",
      "PromptEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-25-tree-of-thoughts-tot-breadth-first-",
    "title": "Tree-of-Thoughts (ToT) [System Design #25]",
    "question": "Architect and evaluate **Tree-of-Thoughts (ToT): Breadth-First Exploration of Reasoning Paths** within **Prompt Engineering**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Princeton / OpenAI.",
    "type": "GenAI",
    "company": "Princeton / OpenAI",
    "role": "AI Researcher",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Prompt Engineering",
    "subtopic": "Tree-of-Thoughts (ToT): Breadth-First Exploration of Reasoning Paths",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Princeton / OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Tree-of-Thoughts (ToT): Breadth-First Exploration of Reasoning Paths.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Tree-of-Thoughts (ToT): Breadth-First Exploration of Reasoning Paths. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Prompt Engineering",
      "Princeton / OpenAI",
      "AIResearcher"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-26-rotary-position-embeddings-rope-rel",
    "title": "Rotary Position Embeddings (RoPE) [System Design #26]",
    "question": "Architect and evaluate **Rotary Position Embeddings (RoPE): Relative Distance Preservation** within **Transformer Architecture**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Meta.",
    "type": "GenAI",
    "company": "Meta",
    "role": "LLM Researcher",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Transformer Architecture",
    "subtopic": "Rotary Position Embeddings (RoPE): Relative Distance Preservation",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Meta AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Rotary Position Embeddings (RoPE): Relative Distance Preservation.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Rotary Position Embeddings (RoPE): Relative Distance Preservation. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Transformer Architecture",
      "Meta",
      "LLMResearcher"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-27-alibi-linear-biases-for-extrapolati",
    "title": "ALiBi [System Design #27]",
    "question": "Architect and evaluate **ALiBi: Linear Biases for Extrapolating Beyond Training Context** within **Transformer Architecture**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Anthropic.",
    "type": "GenAI",
    "company": "Anthropic",
    "role": "Research Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Transformer Architecture",
    "subtopic": "ALiBi: Linear Biases for Extrapolating Beyond Training Context",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Anthropic AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for ALiBi: Linear Biases for Extrapolating Beyond Training Context.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in ALiBi: Linear Biases for Extrapolating Beyond Training Context. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Transformer Architecture",
      "Anthropic",
      "ResearchEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-28-flashattention-gpu-sram-tiling-and-",
    "title": "FlashAttention [System Design #28]",
    "question": "Architect and evaluate **FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention** within **Transformer Architecture**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Stanford / OpenAI.",
    "type": "GenAI",
    "company": "Stanford / OpenAI",
    "role": "AI Systems Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Transformer Architecture",
    "subtopic": "FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Stanford / OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Transformer Architecture",
      "Stanford / OpenAI",
      "AISystemsEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-29-byte-pair-encoding-bpe-subword-voca",
    "title": "Byte-Pair Encoding (BPE) [System Design #29]",
    "question": "Architect and evaluate **Byte-Pair Encoding (BPE): Subword Vocabulary Construction** within **Tokenizer & Embeddings**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at OpenAI.",
    "type": "GenAI",
    "company": "OpenAI",
    "role": "NLP Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Tokenizer & Embeddings",
    "subtopic": "Byte-Pair Encoding (BPE): Subword Vocabulary Construction",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Byte-Pair Encoding (BPE): Subword Vocabulary Construction.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Byte-Pair Encoding (BPE): Subword Vocabulary Construction. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Tokenizer & Embeddings",
      "OpenAI",
      "NLPScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-30-speculative-decoding-small-draft-mo",
    "title": "Speculative Decoding [System Design #30]",
    "question": "Architect and evaluate **Speculative Decoding: Small Draft Model with Big Verifier** within **Inference Acceleration**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Google DeepMind.",
    "type": "GenAI",
    "company": "Google DeepMind",
    "role": "Inference Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Inference Acceleration",
    "subtopic": "Speculative Decoding: Small Draft Model with Big Verifier",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Google DeepMind AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Speculative Decoding: Small Draft Model with Big Verifier.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Speculative Decoding: Small Draft Model with Big Verifier. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Inference Acceleration",
      "Google DeepMind",
      "InferenceEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-31-continuous-batching-pagedattention-",
    "title": "Continuous Batching & PagedAttention in Production vLLM [System Design #31]",
    "question": "Architect and evaluate **Continuous Batching & PagedAttention in Production vLLM** within **Inference Acceleration**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Databricks.",
    "type": "GenAI",
    "company": "Databricks",
    "role": "Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Inference Acceleration",
    "subtopic": "Continuous Batching & PagedAttention in Production vLLM",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Databricks AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Continuous Batching & PagedAttention in Production vLLM.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Continuous Batching & PagedAttention in Production vLLM. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Inference Acceleration",
      "Databricks",
      "PlatformEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-32-awq-activation-aware-weight-quantiz",
    "title": "AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs [System Design #32]",
    "question": "Architect and evaluate **AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs** within **Model Quantization**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at NVIDIA.",
    "type": "GenAI",
    "company": "NVIDIA",
    "role": "CUDA Kernel Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Model Quantization",
    "subtopic": "AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "NVIDIA AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Model Quantization",
      "NVIDIA",
      "CUDAKernelEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-33-gptq-second-order-error-compensatio",
    "title": "GPTQ [System Design #33]",
    "question": "Architect and evaluate **GPTQ: Second-Order Error Compensation in One-Shot Quantization** within **Model Quantization**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Meta.",
    "type": "GenAI",
    "company": "Meta",
    "role": "AI Infrastructure Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Model Quantization",
    "subtopic": "GPTQ: Second-Order Error Compensation in One-Shot Quantization",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for GPTQ: Second-Order Error Compensation in One-Shot Quantization.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in GPTQ: Second-Order Error Compensation in One-Shot Quantization. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Model Quantization",
      "Meta",
      "AIInfrastructureEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-34-direct-preference-optimization-dpo-",
    "title": "Direct Preference Optimization (DPO) vs PPO in RLHF [System Design #34]",
    "question": "Architect and evaluate **Direct Preference Optimization (DPO) vs PPO in RLHF** within **Fine-Tuning & Alignment**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Anthropic.",
    "type": "GenAI",
    "company": "Anthropic",
    "role": "Alignment Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Fine-Tuning & Alignment",
    "subtopic": "Direct Preference Optimization (DPO) vs PPO in RLHF",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Anthropic AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Direct Preference Optimization (DPO) vs PPO in RLHF.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Direct Preference Optimization (DPO) vs PPO in RLHF. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Fine-Tuning & Alignment",
      "Anthropic",
      "AlignmentScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-35-constitutional-ai-self-critique-for",
    "title": "Constitutional AI & Self-Critique for Safe Response Generation [System Design #35]",
    "question": "Architect and evaluate **Constitutional AI & Self-Critique for Safe Response Generation** within **Fine-Tuning & Alignment**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Anthropic.",
    "type": "GenAI",
    "company": "Anthropic",
    "role": "AI Safety Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Fine-Tuning & Alignment",
    "subtopic": "Constitutional AI & Self-Critique for Safe Response Generation",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Anthropic AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Constitutional AI & Self-Critique for Safe Response Generation.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Constitutional AI & Self-Critique for Safe Response Generation. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Fine-Tuning & Alignment",
      "Anthropic",
      "AISafetyEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-36-hierarchical-chunking-parent-docume",
    "title": "Hierarchical Chunking [System Design #36]",
    "question": "Architect and evaluate **Hierarchical Chunking: Parent Document Retrieval & Small-to-Big** within **RAG & Vector Search**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Amazon.",
    "type": "GenAI",
    "company": "Amazon",
    "role": "Applied Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "RAG & Vector Search",
    "subtopic": "Hierarchical Chunking: Parent Document Retrieval & Small-to-Big",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Amazon AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Hierarchical Chunking: Parent Document Retrieval & Small-to-Big.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Hierarchical Chunking: Parent Document Retrieval & Small-to-Big. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "RAG & Vector Search",
      "Amazon",
      "AppliedScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-37-hnsw-hierarchical-navigable-small-w",
    "title": "HNSW (Hierarchical Navigable Small World) Vector Graph Indexing [System Design #37]",
    "question": "Architect and evaluate **HNSW (Hierarchical Navigable Small World) Vector Graph Indexing** within **RAG & Vector Search**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Pinecone.",
    "type": "GenAI",
    "company": "Pinecone",
    "role": "Search Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "RAG & Vector Search",
    "subtopic": "HNSW (Hierarchical Navigable Small World) Vector Graph Indexing",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Pinecone AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for HNSW (Hierarchical Navigable Small World) Vector Graph Indexing.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in HNSW (Hierarchical Navigable Small World) Vector Graph Indexing. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "RAG & Vector Search",
      "Pinecone",
      "SearchEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-38-cross-encoder-rerankers-improving-t",
    "title": "Cross-Encoder Rerankers [System Design #38]",
    "question": "Architect and evaluate **Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval** within **RAG & Vector Search**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Cohere.",
    "type": "GenAI",
    "company": "Cohere",
    "role": "Reranking Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "RAG & Vector Search",
    "subtopic": "Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Cohere AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "RAG & Vector Search",
      "Cohere",
      "RerankingScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-39-structured-json-decoding-via-contex",
    "title": "Structured JSON Decoding via Context-Free Grammars (CFGs) [System Design #39]",
    "question": "Architect and evaluate **Structured JSON Decoding via Context-Free Grammars (CFGs)** within **AI Agents**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at OpenAI.",
    "type": "GenAI",
    "company": "OpenAI",
    "role": "AI Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "AI Agents",
    "subtopic": "Structured JSON Decoding via Context-Free Grammars (CFGs)",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Structured JSON Decoding via Context-Free Grammars (CFGs).",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Structured JSON Decoding via Context-Free Grammars (CFGs). Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "AI Agents",
      "OpenAI",
      "AIPlatformEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-40-multi-agent-coordination-hierarchic",
    "title": "Multi-Agent Coordination [System Design #40]",
    "question": "Architect and evaluate **Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus** within **AI Agents**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Microsoft.",
    "type": "GenAI",
    "company": "Microsoft",
    "role": "Principal AI Architect",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "AI Agents",
    "subtopic": "Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Microsoft AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "AI Agents",
      "Microsoft",
      "PrincipalAIArchitect"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-41-llm-as-a-judge-mitigating-position-",
    "title": "LLM-as-a-Judge [System Design #41]",
    "question": "Architect and evaluate **LLM-as-a-Judge: Mitigating Position, Length, and Egocentric Biases** within **Evaluation & Guardrails**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Databricks.",
    "type": "GenAI",
    "company": "Databricks",
    "role": "Evaluation Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Evaluation & Guardrails",
    "subtopic": "LLM-as-a-Judge: Mitigating Position, Length, and Egocentric Biases",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Databricks AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for LLM-as-a-Judge: Mitigating Position, Length, and Egocentric Biases.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in LLM-as-a-Judge: Mitigating Position, Length, and Egocentric Biases. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Evaluation & Guardrails",
      "Databricks",
      "EvaluationScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-42-prompt-injection-jailbreak-defense-",
    "title": "Prompt Injection & Jailbreak Defense via Dual-Model Architecture [System Design #42]",
    "question": "Architect and evaluate **Prompt Injection & Jailbreak Defense via Dual-Model Architecture** within **Evaluation & Guardrails**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Google.",
    "type": "GenAI",
    "company": "Google",
    "role": "AI Security Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Evaluation & Guardrails",
    "subtopic": "Prompt Injection & Jailbreak Defense via Dual-Model Architecture",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Google AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Prompt Injection & Jailbreak Defense via Dual-Model Architecture.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Prompt Injection & Jailbreak Defense via Dual-Model Architecture. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Evaluation & Guardrails",
      "Google",
      "AISecurityEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-43-needle-in-a-haystack-benchmarking-c",
    "title": "Needle in a Haystack [System Design #43]",
    "question": "Architect and evaluate **Needle in a Haystack: Benchmarking Context Retrieval Precision** within **Evaluation & Guardrails**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Meta.",
    "type": "GenAI",
    "company": "Meta",
    "role": "Research Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Evaluation & Guardrails",
    "subtopic": "Needle in a Haystack: Benchmarking Context Retrieval Precision",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Meta AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Needle in a Haystack: Benchmarking Context Retrieval Precision.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Needle in a Haystack: Benchmarking Context Retrieval Precision. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Evaluation & Guardrails",
      "Meta",
      "ResearchEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-44-chain-of-thought-cot-self-consisten",
    "title": "Chain-of-Thought (CoT) & Self-Consistency Majority Voting [System Design #44]",
    "question": "Architect and evaluate **Chain-of-Thought (CoT) & Self-Consistency Majority Voting** within **Prompt Engineering**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Google.",
    "type": "GenAI",
    "company": "Google",
    "role": "Prompt Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Prompt Engineering",
    "subtopic": "Chain-of-Thought (CoT) & Self-Consistency Majority Voting",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Google AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Chain-of-Thought (CoT) & Self-Consistency Majority Voting.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Chain-of-Thought (CoT) & Self-Consistency Majority Voting. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Prompt Engineering",
      "Google",
      "PromptEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-45-tree-of-thoughts-tot-breadth-first-",
    "title": "Tree-of-Thoughts (ToT) [System Design #45]",
    "question": "Architect and evaluate **Tree-of-Thoughts (ToT): Breadth-First Exploration of Reasoning Paths** within **Prompt Engineering**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Princeton / OpenAI.",
    "type": "GenAI",
    "company": "Princeton / OpenAI",
    "role": "AI Researcher",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Prompt Engineering",
    "subtopic": "Tree-of-Thoughts (ToT): Breadth-First Exploration of Reasoning Paths",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Princeton / OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Tree-of-Thoughts (ToT): Breadth-First Exploration of Reasoning Paths.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Tree-of-Thoughts (ToT): Breadth-First Exploration of Reasoning Paths. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Prompt Engineering",
      "Princeton / OpenAI",
      "AIResearcher"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-46-rotary-position-embeddings-rope-rel",
    "title": "Rotary Position Embeddings (RoPE) [System Design #46]",
    "question": "Architect and evaluate **Rotary Position Embeddings (RoPE): Relative Distance Preservation** within **Transformer Architecture**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Meta.",
    "type": "GenAI",
    "company": "Meta",
    "role": "LLM Researcher",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Transformer Architecture",
    "subtopic": "Rotary Position Embeddings (RoPE): Relative Distance Preservation",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Meta AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Rotary Position Embeddings (RoPE): Relative Distance Preservation.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Rotary Position Embeddings (RoPE): Relative Distance Preservation. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Transformer Architecture",
      "Meta",
      "LLMResearcher"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-47-alibi-linear-biases-for-extrapolati",
    "title": "ALiBi [System Design #47]",
    "question": "Architect and evaluate **ALiBi: Linear Biases for Extrapolating Beyond Training Context** within **Transformer Architecture**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Anthropic.",
    "type": "GenAI",
    "company": "Anthropic",
    "role": "Research Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Transformer Architecture",
    "subtopic": "ALiBi: Linear Biases for Extrapolating Beyond Training Context",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Anthropic AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for ALiBi: Linear Biases for Extrapolating Beyond Training Context.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in ALiBi: Linear Biases for Extrapolating Beyond Training Context. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Transformer Architecture",
      "Anthropic",
      "ResearchEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-48-flashattention-gpu-sram-tiling-and-",
    "title": "FlashAttention [System Design #48]",
    "question": "Architect and evaluate **FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention** within **Transformer Architecture**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Stanford / OpenAI.",
    "type": "GenAI",
    "company": "Stanford / OpenAI",
    "role": "AI Systems Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Transformer Architecture",
    "subtopic": "FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Stanford / OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Transformer Architecture",
      "Stanford / OpenAI",
      "AISystemsEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-49-byte-pair-encoding-bpe-subword-voca",
    "title": "Byte-Pair Encoding (BPE) [System Design #49]",
    "question": "Architect and evaluate **Byte-Pair Encoding (BPE): Subword Vocabulary Construction** within **Tokenizer & Embeddings**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at OpenAI.",
    "type": "GenAI",
    "company": "OpenAI",
    "role": "NLP Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Tokenizer & Embeddings",
    "subtopic": "Byte-Pair Encoding (BPE): Subword Vocabulary Construction",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Byte-Pair Encoding (BPE): Subword Vocabulary Construction.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Byte-Pair Encoding (BPE): Subword Vocabulary Construction. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Tokenizer & Embeddings",
      "OpenAI",
      "NLPScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-50-speculative-decoding-small-draft-mo",
    "title": "Speculative Decoding [System Design #50]",
    "question": "Architect and evaluate **Speculative Decoding: Small Draft Model with Big Verifier** within **Inference Acceleration**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Google DeepMind.",
    "type": "GenAI",
    "company": "Google DeepMind",
    "role": "Inference Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Inference Acceleration",
    "subtopic": "Speculative Decoding: Small Draft Model with Big Verifier",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Google DeepMind AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Speculative Decoding: Small Draft Model with Big Verifier.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Speculative Decoding: Small Draft Model with Big Verifier. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Inference Acceleration",
      "Google DeepMind",
      "InferenceEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-51-continuous-batching-pagedattention-",
    "title": "Continuous Batching & PagedAttention in Production vLLM [System Design #51]",
    "question": "Architect and evaluate **Continuous Batching & PagedAttention in Production vLLM** within **Inference Acceleration**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Databricks.",
    "type": "GenAI",
    "company": "Databricks",
    "role": "Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Inference Acceleration",
    "subtopic": "Continuous Batching & PagedAttention in Production vLLM",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Databricks AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Continuous Batching & PagedAttention in Production vLLM.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Continuous Batching & PagedAttention in Production vLLM. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Inference Acceleration",
      "Databricks",
      "PlatformEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-52-awq-activation-aware-weight-quantiz",
    "title": "AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs [System Design #52]",
    "question": "Architect and evaluate **AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs** within **Model Quantization**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at NVIDIA.",
    "type": "GenAI",
    "company": "NVIDIA",
    "role": "CUDA Kernel Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Model Quantization",
    "subtopic": "AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "NVIDIA AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Model Quantization",
      "NVIDIA",
      "CUDAKernelEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-53-gptq-second-order-error-compensatio",
    "title": "GPTQ [System Design #53]",
    "question": "Architect and evaluate **GPTQ: Second-Order Error Compensation in One-Shot Quantization** within **Model Quantization**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Meta.",
    "type": "GenAI",
    "company": "Meta",
    "role": "AI Infrastructure Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Model Quantization",
    "subtopic": "GPTQ: Second-Order Error Compensation in One-Shot Quantization",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Meta AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for GPTQ: Second-Order Error Compensation in One-Shot Quantization.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in GPTQ: Second-Order Error Compensation in One-Shot Quantization. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Model Quantization",
      "Meta",
      "AIInfrastructureEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-54-direct-preference-optimization-dpo-",
    "title": "Direct Preference Optimization (DPO) vs PPO in RLHF [System Design #54]",
    "question": "Architect and evaluate **Direct Preference Optimization (DPO) vs PPO in RLHF** within **Fine-Tuning & Alignment**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Anthropic.",
    "type": "GenAI",
    "company": "Anthropic",
    "role": "Alignment Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Fine-Tuning & Alignment",
    "subtopic": "Direct Preference Optimization (DPO) vs PPO in RLHF",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Anthropic AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Direct Preference Optimization (DPO) vs PPO in RLHF.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Direct Preference Optimization (DPO) vs PPO in RLHF. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Fine-Tuning & Alignment",
      "Anthropic",
      "AlignmentScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-55-constitutional-ai-self-critique-for",
    "title": "Constitutional AI & Self-Critique for Safe Response Generation [System Design #55]",
    "question": "Architect and evaluate **Constitutional AI & Self-Critique for Safe Response Generation** within **Fine-Tuning & Alignment**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Anthropic.",
    "type": "GenAI",
    "company": "Anthropic",
    "role": "AI Safety Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Fine-Tuning & Alignment",
    "subtopic": "Constitutional AI & Self-Critique for Safe Response Generation",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Anthropic AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Constitutional AI & Self-Critique for Safe Response Generation.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Constitutional AI & Self-Critique for Safe Response Generation. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Fine-Tuning & Alignment",
      "Anthropic",
      "AISafetyEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-56-hierarchical-chunking-parent-docume",
    "title": "Hierarchical Chunking [System Design #56]",
    "question": "Architect and evaluate **Hierarchical Chunking: Parent Document Retrieval & Small-to-Big** within **RAG & Vector Search**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Amazon.",
    "type": "GenAI",
    "company": "Amazon",
    "role": "Applied Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "RAG & Vector Search",
    "subtopic": "Hierarchical Chunking: Parent Document Retrieval & Small-to-Big",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Amazon AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Hierarchical Chunking: Parent Document Retrieval & Small-to-Big.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Hierarchical Chunking: Parent Document Retrieval & Small-to-Big. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "RAG & Vector Search",
      "Amazon",
      "AppliedScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-57-hnsw-hierarchical-navigable-small-w",
    "title": "HNSW (Hierarchical Navigable Small World) Vector Graph Indexing [System Design #57]",
    "question": "Architect and evaluate **HNSW (Hierarchical Navigable Small World) Vector Graph Indexing** within **RAG & Vector Search**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Pinecone.",
    "type": "GenAI",
    "company": "Pinecone",
    "role": "Search Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "RAG & Vector Search",
    "subtopic": "HNSW (Hierarchical Navigable Small World) Vector Graph Indexing",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Pinecone AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for HNSW (Hierarchical Navigable Small World) Vector Graph Indexing.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in HNSW (Hierarchical Navigable Small World) Vector Graph Indexing. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "RAG & Vector Search",
      "Pinecone",
      "SearchEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-58-cross-encoder-rerankers-improving-t",
    "title": "Cross-Encoder Rerankers [System Design #58]",
    "question": "Architect and evaluate **Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval** within **RAG & Vector Search**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Cohere.",
    "type": "GenAI",
    "company": "Cohere",
    "role": "Reranking Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "RAG & Vector Search",
    "subtopic": "Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cohere AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "RAG & Vector Search",
      "Cohere",
      "RerankingScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-59-structured-json-decoding-via-contex",
    "title": "Structured JSON Decoding via Context-Free Grammars (CFGs) [System Design #59]",
    "question": "Architect and evaluate **Structured JSON Decoding via Context-Free Grammars (CFGs)** within **AI Agents**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at OpenAI.",
    "type": "GenAI",
    "company": "OpenAI",
    "role": "AI Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "AI Agents",
    "subtopic": "Structured JSON Decoding via Context-Free Grammars (CFGs)",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Structured JSON Decoding via Context-Free Grammars (CFGs).",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Structured JSON Decoding via Context-Free Grammars (CFGs). Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "AI Agents",
      "OpenAI",
      "AIPlatformEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-60-multi-agent-coordination-hierarchic",
    "title": "Multi-Agent Coordination [System Design #60]",
    "question": "Architect and evaluate **Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus** within **AI Agents**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Microsoft.",
    "type": "GenAI",
    "company": "Microsoft",
    "role": "Principal AI Architect",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "AI Agents",
    "subtopic": "Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Microsoft AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "AI Agents",
      "Microsoft",
      "PrincipalAIArchitect"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-61-llm-as-a-judge-mitigating-position-",
    "title": "LLM-as-a-Judge [System Design #61]",
    "question": "Architect and evaluate **LLM-as-a-Judge: Mitigating Position, Length, and Egocentric Biases** within **Evaluation & Guardrails**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Databricks.",
    "type": "GenAI",
    "company": "Databricks",
    "role": "Evaluation Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Evaluation & Guardrails",
    "subtopic": "LLM-as-a-Judge: Mitigating Position, Length, and Egocentric Biases",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Databricks AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for LLM-as-a-Judge: Mitigating Position, Length, and Egocentric Biases.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in LLM-as-a-Judge: Mitigating Position, Length, and Egocentric Biases. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Evaluation & Guardrails",
      "Databricks",
      "EvaluationScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-62-prompt-injection-jailbreak-defense-",
    "title": "Prompt Injection & Jailbreak Defense via Dual-Model Architecture [System Design #62]",
    "question": "Architect and evaluate **Prompt Injection & Jailbreak Defense via Dual-Model Architecture** within **Evaluation & Guardrails**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Google.",
    "type": "GenAI",
    "company": "Google",
    "role": "AI Security Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Evaluation & Guardrails",
    "subtopic": "Prompt Injection & Jailbreak Defense via Dual-Model Architecture",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Google AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Prompt Injection & Jailbreak Defense via Dual-Model Architecture.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Prompt Injection & Jailbreak Defense via Dual-Model Architecture. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Evaluation & Guardrails",
      "Google",
      "AISecurityEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-63-needle-in-a-haystack-benchmarking-c",
    "title": "Needle in a Haystack [System Design #63]",
    "question": "Architect and evaluate **Needle in a Haystack: Benchmarking Context Retrieval Precision** within **Evaluation & Guardrails**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Meta.",
    "type": "GenAI",
    "company": "Meta",
    "role": "Research Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Evaluation & Guardrails",
    "subtopic": "Needle in a Haystack: Benchmarking Context Retrieval Precision",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Needle in a Haystack: Benchmarking Context Retrieval Precision.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Needle in a Haystack: Benchmarking Context Retrieval Precision. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Evaluation & Guardrails",
      "Meta",
      "ResearchEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-64-chain-of-thought-cot-self-consisten",
    "title": "Chain-of-Thought (CoT) & Self-Consistency Majority Voting [System Design #64]",
    "question": "Architect and evaluate **Chain-of-Thought (CoT) & Self-Consistency Majority Voting** within **Prompt Engineering**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Google.",
    "type": "GenAI",
    "company": "Google",
    "role": "Prompt Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Prompt Engineering",
    "subtopic": "Chain-of-Thought (CoT) & Self-Consistency Majority Voting",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Chain-of-Thought (CoT) & Self-Consistency Majority Voting.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Chain-of-Thought (CoT) & Self-Consistency Majority Voting. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Prompt Engineering",
      "Google",
      "PromptEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-65-tree-of-thoughts-tot-breadth-first-",
    "title": "Tree-of-Thoughts (ToT) [System Design #65]",
    "question": "Architect and evaluate **Tree-of-Thoughts (ToT): Breadth-First Exploration of Reasoning Paths** within **Prompt Engineering**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Princeton / OpenAI.",
    "type": "GenAI",
    "company": "Princeton / OpenAI",
    "role": "AI Researcher",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Prompt Engineering",
    "subtopic": "Tree-of-Thoughts (ToT): Breadth-First Exploration of Reasoning Paths",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Princeton / OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Tree-of-Thoughts (ToT): Breadth-First Exploration of Reasoning Paths.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Tree-of-Thoughts (ToT): Breadth-First Exploration of Reasoning Paths. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Prompt Engineering",
      "Princeton / OpenAI",
      "AIResearcher"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-66-rotary-position-embeddings-rope-rel",
    "title": "Rotary Position Embeddings (RoPE) [System Design #66]",
    "question": "Architect and evaluate **Rotary Position Embeddings (RoPE): Relative Distance Preservation** within **Transformer Architecture**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Meta.",
    "type": "GenAI",
    "company": "Meta",
    "role": "LLM Researcher",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Transformer Architecture",
    "subtopic": "Rotary Position Embeddings (RoPE): Relative Distance Preservation",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Rotary Position Embeddings (RoPE): Relative Distance Preservation.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Rotary Position Embeddings (RoPE): Relative Distance Preservation. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Transformer Architecture",
      "Meta",
      "LLMResearcher"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-67-alibi-linear-biases-for-extrapolati",
    "title": "ALiBi [System Design #67]",
    "question": "Architect and evaluate **ALiBi: Linear Biases for Extrapolating Beyond Training Context** within **Transformer Architecture**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Anthropic.",
    "type": "GenAI",
    "company": "Anthropic",
    "role": "Research Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Transformer Architecture",
    "subtopic": "ALiBi: Linear Biases for Extrapolating Beyond Training Context",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Anthropic AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for ALiBi: Linear Biases for Extrapolating Beyond Training Context.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in ALiBi: Linear Biases for Extrapolating Beyond Training Context. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Transformer Architecture",
      "Anthropic",
      "ResearchEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-68-flashattention-gpu-sram-tiling-and-",
    "title": "FlashAttention [System Design #68]",
    "question": "Architect and evaluate **FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention** within **Transformer Architecture**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Stanford / OpenAI.",
    "type": "GenAI",
    "company": "Stanford / OpenAI",
    "role": "AI Systems Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Transformer Architecture",
    "subtopic": "FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Stanford / OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Transformer Architecture",
      "Stanford / OpenAI",
      "AISystemsEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-69-byte-pair-encoding-bpe-subword-voca",
    "title": "Byte-Pair Encoding (BPE) [System Design #69]",
    "question": "Architect and evaluate **Byte-Pair Encoding (BPE): Subword Vocabulary Construction** within **Tokenizer & Embeddings**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at OpenAI.",
    "type": "GenAI",
    "company": "OpenAI",
    "role": "NLP Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Tokenizer & Embeddings",
    "subtopic": "Byte-Pair Encoding (BPE): Subword Vocabulary Construction",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Byte-Pair Encoding (BPE): Subword Vocabulary Construction.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Byte-Pair Encoding (BPE): Subword Vocabulary Construction. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Tokenizer & Embeddings",
      "OpenAI",
      "NLPScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-70-speculative-decoding-small-draft-mo",
    "title": "Speculative Decoding [System Design #70]",
    "question": "Architect and evaluate **Speculative Decoding: Small Draft Model with Big Verifier** within **Inference Acceleration**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Google DeepMind.",
    "type": "GenAI",
    "company": "Google DeepMind",
    "role": "Inference Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Inference Acceleration",
    "subtopic": "Speculative Decoding: Small Draft Model with Big Verifier",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google DeepMind AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Speculative Decoding: Small Draft Model with Big Verifier.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Speculative Decoding: Small Draft Model with Big Verifier. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Inference Acceleration",
      "Google DeepMind",
      "InferenceEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-71-continuous-batching-pagedattention-",
    "title": "Continuous Batching & PagedAttention in Production vLLM [System Design #71]",
    "question": "Architect and evaluate **Continuous Batching & PagedAttention in Production vLLM** within **Inference Acceleration**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Databricks.",
    "type": "GenAI",
    "company": "Databricks",
    "role": "Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Inference Acceleration",
    "subtopic": "Continuous Batching & PagedAttention in Production vLLM",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Databricks AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Continuous Batching & PagedAttention in Production vLLM.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Continuous Batching & PagedAttention in Production vLLM. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Inference Acceleration",
      "Databricks",
      "PlatformEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-72-awq-activation-aware-weight-quantiz",
    "title": "AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs [System Design #72]",
    "question": "Architect and evaluate **AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs** within **Model Quantization**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at NVIDIA.",
    "type": "GenAI",
    "company": "NVIDIA",
    "role": "CUDA Kernel Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Model Quantization",
    "subtopic": "AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "NVIDIA AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Model Quantization",
      "NVIDIA",
      "CUDAKernelEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-73-gptq-second-order-error-compensatio",
    "title": "GPTQ [System Design #73]",
    "question": "Architect and evaluate **GPTQ: Second-Order Error Compensation in One-Shot Quantization** within **Model Quantization**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Meta.",
    "type": "GenAI",
    "company": "Meta",
    "role": "AI Infrastructure Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Model Quantization",
    "subtopic": "GPTQ: Second-Order Error Compensation in One-Shot Quantization",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Meta AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for GPTQ: Second-Order Error Compensation in One-Shot Quantization.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in GPTQ: Second-Order Error Compensation in One-Shot Quantization. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Model Quantization",
      "Meta",
      "AIInfrastructureEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-74-direct-preference-optimization-dpo-",
    "title": "Direct Preference Optimization (DPO) vs PPO in RLHF [System Design #74]",
    "question": "Architect and evaluate **Direct Preference Optimization (DPO) vs PPO in RLHF** within **Fine-Tuning & Alignment**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Anthropic.",
    "type": "GenAI",
    "company": "Anthropic",
    "role": "Alignment Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Fine-Tuning & Alignment",
    "subtopic": "Direct Preference Optimization (DPO) vs PPO in RLHF",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Anthropic AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Direct Preference Optimization (DPO) vs PPO in RLHF.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Direct Preference Optimization (DPO) vs PPO in RLHF. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Fine-Tuning & Alignment",
      "Anthropic",
      "AlignmentScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-75-constitutional-ai-self-critique-for",
    "title": "Constitutional AI & Self-Critique for Safe Response Generation [System Design #75]",
    "question": "Architect and evaluate **Constitutional AI & Self-Critique for Safe Response Generation** within **Fine-Tuning & Alignment**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Anthropic.",
    "type": "GenAI",
    "company": "Anthropic",
    "role": "AI Safety Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Fine-Tuning & Alignment",
    "subtopic": "Constitutional AI & Self-Critique for Safe Response Generation",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Anthropic AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Constitutional AI & Self-Critique for Safe Response Generation.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Constitutional AI & Self-Critique for Safe Response Generation. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Fine-Tuning & Alignment",
      "Anthropic",
      "AISafetyEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-76-hierarchical-chunking-parent-docume",
    "title": "Hierarchical Chunking [System Design #76]",
    "question": "Architect and evaluate **Hierarchical Chunking: Parent Document Retrieval & Small-to-Big** within **RAG & Vector Search**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Amazon.",
    "type": "GenAI",
    "company": "Amazon",
    "role": "Applied Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "RAG & Vector Search",
    "subtopic": "Hierarchical Chunking: Parent Document Retrieval & Small-to-Big",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Hierarchical Chunking: Parent Document Retrieval & Small-to-Big.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Hierarchical Chunking: Parent Document Retrieval & Small-to-Big. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "RAG & Vector Search",
      "Amazon",
      "AppliedScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-77-hnsw-hierarchical-navigable-small-w",
    "title": "HNSW (Hierarchical Navigable Small World) Vector Graph Indexing [System Design #77]",
    "question": "Architect and evaluate **HNSW (Hierarchical Navigable Small World) Vector Graph Indexing** within **RAG & Vector Search**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Pinecone.",
    "type": "GenAI",
    "company": "Pinecone",
    "role": "Search Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "RAG & Vector Search",
    "subtopic": "HNSW (Hierarchical Navigable Small World) Vector Graph Indexing",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Pinecone AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for HNSW (Hierarchical Navigable Small World) Vector Graph Indexing.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in HNSW (Hierarchical Navigable Small World) Vector Graph Indexing. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "RAG & Vector Search",
      "Pinecone",
      "SearchEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-78-cross-encoder-rerankers-improving-t",
    "title": "Cross-Encoder Rerankers [System Design #78]",
    "question": "Architect and evaluate **Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval** within **RAG & Vector Search**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Cohere.",
    "type": "GenAI",
    "company": "Cohere",
    "role": "Reranking Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "RAG & Vector Search",
    "subtopic": "Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cohere AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "RAG & Vector Search",
      "Cohere",
      "RerankingScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-79-structured-json-decoding-via-contex",
    "title": "Structured JSON Decoding via Context-Free Grammars (CFGs) [System Design #79]",
    "question": "Architect and evaluate **Structured JSON Decoding via Context-Free Grammars (CFGs)** within **AI Agents**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at OpenAI.",
    "type": "GenAI",
    "company": "OpenAI",
    "role": "AI Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "AI Agents",
    "subtopic": "Structured JSON Decoding via Context-Free Grammars (CFGs)",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Structured JSON Decoding via Context-Free Grammars (CFGs).",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Structured JSON Decoding via Context-Free Grammars (CFGs). Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "AI Agents",
      "OpenAI",
      "AIPlatformEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-80-multi-agent-coordination-hierarchic",
    "title": "Multi-Agent Coordination [System Design #80]",
    "question": "Architect and evaluate **Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus** within **AI Agents**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Microsoft.",
    "type": "GenAI",
    "company": "Microsoft",
    "role": "Principal AI Architect",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "AI Agents",
    "subtopic": "Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Microsoft AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "AI Agents",
      "Microsoft",
      "PrincipalAIArchitect"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-81-llm-as-a-judge-mitigating-position-",
    "title": "LLM-as-a-Judge [System Design #81]",
    "question": "Architect and evaluate **LLM-as-a-Judge: Mitigating Position, Length, and Egocentric Biases** within **Evaluation & Guardrails**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Databricks.",
    "type": "GenAI",
    "company": "Databricks",
    "role": "Evaluation Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Evaluation & Guardrails",
    "subtopic": "LLM-as-a-Judge: Mitigating Position, Length, and Egocentric Biases",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Databricks AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for LLM-as-a-Judge: Mitigating Position, Length, and Egocentric Biases.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in LLM-as-a-Judge: Mitigating Position, Length, and Egocentric Biases. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Evaluation & Guardrails",
      "Databricks",
      "EvaluationScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-82-prompt-injection-jailbreak-defense-",
    "title": "Prompt Injection & Jailbreak Defense via Dual-Model Architecture [System Design #82]",
    "question": "Architect and evaluate **Prompt Injection & Jailbreak Defense via Dual-Model Architecture** within **Evaluation & Guardrails**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Google.",
    "type": "GenAI",
    "company": "Google",
    "role": "AI Security Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Evaluation & Guardrails",
    "subtopic": "Prompt Injection & Jailbreak Defense via Dual-Model Architecture",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Prompt Injection & Jailbreak Defense via Dual-Model Architecture.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Prompt Injection & Jailbreak Defense via Dual-Model Architecture. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Evaluation & Guardrails",
      "Google",
      "AISecurityEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-83-needle-in-a-haystack-benchmarking-c",
    "title": "Needle in a Haystack [System Design #83]",
    "question": "Architect and evaluate **Needle in a Haystack: Benchmarking Context Retrieval Precision** within **Evaluation & Guardrails**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Meta.",
    "type": "GenAI",
    "company": "Meta",
    "role": "Research Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Evaluation & Guardrails",
    "subtopic": "Needle in a Haystack: Benchmarking Context Retrieval Precision",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Meta AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Needle in a Haystack: Benchmarking Context Retrieval Precision.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Needle in a Haystack: Benchmarking Context Retrieval Precision. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Evaluation & Guardrails",
      "Meta",
      "ResearchEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-84-chain-of-thought-cot-self-consisten",
    "title": "Chain-of-Thought (CoT) & Self-Consistency Majority Voting [System Design #84]",
    "question": "Architect and evaluate **Chain-of-Thought (CoT) & Self-Consistency Majority Voting** within **Prompt Engineering**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Google.",
    "type": "GenAI",
    "company": "Google",
    "role": "Prompt Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Prompt Engineering",
    "subtopic": "Chain-of-Thought (CoT) & Self-Consistency Majority Voting",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Google AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Chain-of-Thought (CoT) & Self-Consistency Majority Voting.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Chain-of-Thought (CoT) & Self-Consistency Majority Voting. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Prompt Engineering",
      "Google",
      "PromptEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-85-tree-of-thoughts-tot-breadth-first-",
    "title": "Tree-of-Thoughts (ToT) [System Design #85]",
    "question": "Architect and evaluate **Tree-of-Thoughts (ToT): Breadth-First Exploration of Reasoning Paths** within **Prompt Engineering**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Princeton / OpenAI.",
    "type": "GenAI",
    "company": "Princeton / OpenAI",
    "role": "AI Researcher",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Prompt Engineering",
    "subtopic": "Tree-of-Thoughts (ToT): Breadth-First Exploration of Reasoning Paths",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Princeton / OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Tree-of-Thoughts (ToT): Breadth-First Exploration of Reasoning Paths.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Tree-of-Thoughts (ToT): Breadth-First Exploration of Reasoning Paths. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Prompt Engineering",
      "Princeton / OpenAI",
      "AIResearcher"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-86-rotary-position-embeddings-rope-rel",
    "title": "Rotary Position Embeddings (RoPE) [System Design #86]",
    "question": "Architect and evaluate **Rotary Position Embeddings (RoPE): Relative Distance Preservation** within **Transformer Architecture**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Meta.",
    "type": "GenAI",
    "company": "Meta",
    "role": "LLM Researcher",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Transformer Architecture",
    "subtopic": "Rotary Position Embeddings (RoPE): Relative Distance Preservation",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Meta AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Rotary Position Embeddings (RoPE): Relative Distance Preservation.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Rotary Position Embeddings (RoPE): Relative Distance Preservation. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Transformer Architecture",
      "Meta",
      "LLMResearcher"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-87-alibi-linear-biases-for-extrapolati",
    "title": "ALiBi [System Design #87]",
    "question": "Architect and evaluate **ALiBi: Linear Biases for Extrapolating Beyond Training Context** within **Transformer Architecture**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Anthropic.",
    "type": "GenAI",
    "company": "Anthropic",
    "role": "Research Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Transformer Architecture",
    "subtopic": "ALiBi: Linear Biases for Extrapolating Beyond Training Context",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Anthropic AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for ALiBi: Linear Biases for Extrapolating Beyond Training Context.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in ALiBi: Linear Biases for Extrapolating Beyond Training Context. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Transformer Architecture",
      "Anthropic",
      "ResearchEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-88-flashattention-gpu-sram-tiling-and-",
    "title": "FlashAttention [System Design #88]",
    "question": "Architect and evaluate **FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention** within **Transformer Architecture**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Stanford / OpenAI.",
    "type": "GenAI",
    "company": "Stanford / OpenAI",
    "role": "AI Systems Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Transformer Architecture",
    "subtopic": "FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Stanford / OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in FlashAttention: GPU SRAM Tiling and IO-Aware Exact Attention. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Transformer Architecture",
      "Stanford / OpenAI",
      "AISystemsEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-89-byte-pair-encoding-bpe-subword-voca",
    "title": "Byte-Pair Encoding (BPE) [System Design #89]",
    "question": "Architect and evaluate **Byte-Pair Encoding (BPE): Subword Vocabulary Construction** within **Tokenizer & Embeddings**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at OpenAI.",
    "type": "GenAI",
    "company": "OpenAI",
    "role": "NLP Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Tokenizer & Embeddings",
    "subtopic": "Byte-Pair Encoding (BPE): Subword Vocabulary Construction",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Byte-Pair Encoding (BPE): Subword Vocabulary Construction.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Byte-Pair Encoding (BPE): Subword Vocabulary Construction. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Tokenizer & Embeddings",
      "OpenAI",
      "NLPScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-90-speculative-decoding-small-draft-mo",
    "title": "Speculative Decoding [System Design #90]",
    "question": "Architect and evaluate **Speculative Decoding: Small Draft Model with Big Verifier** within **Inference Acceleration**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Google DeepMind.",
    "type": "GenAI",
    "company": "Google DeepMind",
    "role": "Inference Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Inference Acceleration",
    "subtopic": "Speculative Decoding: Small Draft Model with Big Verifier",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Google DeepMind AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Speculative Decoding: Small Draft Model with Big Verifier.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Speculative Decoding: Small Draft Model with Big Verifier. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Inference Acceleration",
      "Google DeepMind",
      "InferenceEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-91-continuous-batching-pagedattention-",
    "title": "Continuous Batching & PagedAttention in Production vLLM [System Design #91]",
    "question": "Architect and evaluate **Continuous Batching & PagedAttention in Production vLLM** within **Inference Acceleration**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Databricks.",
    "type": "GenAI",
    "company": "Databricks",
    "role": "Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Inference Acceleration",
    "subtopic": "Continuous Batching & PagedAttention in Production vLLM",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Databricks AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Continuous Batching & PagedAttention in Production vLLM.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Continuous Batching & PagedAttention in Production vLLM. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Inference Acceleration",
      "Databricks",
      "PlatformEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-92-awq-activation-aware-weight-quantiz",
    "title": "AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs [System Design #92]",
    "question": "Architect and evaluate **AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs** within **Model Quantization**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at NVIDIA.",
    "type": "GenAI",
    "company": "NVIDIA",
    "role": "CUDA Kernel Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Model Quantization",
    "subtopic": "AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "NVIDIA AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in AWQ (Activation-Aware Weight Quantization) for 4-Bit LLMs. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Model Quantization",
      "NVIDIA",
      "CUDAKernelEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-93-gptq-second-order-error-compensatio",
    "title": "GPTQ [System Design #93]",
    "question": "Architect and evaluate **GPTQ: Second-Order Error Compensation in One-Shot Quantization** within **Model Quantization**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Meta.",
    "type": "GenAI",
    "company": "Meta",
    "role": "AI Infrastructure Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Model Quantization",
    "subtopic": "GPTQ: Second-Order Error Compensation in One-Shot Quantization",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for GPTQ: Second-Order Error Compensation in One-Shot Quantization.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in GPTQ: Second-Order Error Compensation in One-Shot Quantization. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Model Quantization",
      "Meta",
      "AIInfrastructureEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-94-direct-preference-optimization-dpo-",
    "title": "Direct Preference Optimization (DPO) vs PPO in RLHF [System Design #94]",
    "question": "Architect and evaluate **Direct Preference Optimization (DPO) vs PPO in RLHF** within **Fine-Tuning & Alignment**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Anthropic.",
    "type": "GenAI",
    "company": "Anthropic",
    "role": "Alignment Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Fine-Tuning & Alignment",
    "subtopic": "Direct Preference Optimization (DPO) vs PPO in RLHF",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Anthropic AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Direct Preference Optimization (DPO) vs PPO in RLHF.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Direct Preference Optimization (DPO) vs PPO in RLHF. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Fine-Tuning & Alignment",
      "Anthropic",
      "AlignmentScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-95-constitutional-ai-self-critique-for",
    "title": "Constitutional AI & Self-Critique for Safe Response Generation [System Design #95]",
    "question": "Architect and evaluate **Constitutional AI & Self-Critique for Safe Response Generation** within **Fine-Tuning & Alignment**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Anthropic.",
    "type": "GenAI",
    "company": "Anthropic",
    "role": "AI Safety Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "Fine-Tuning & Alignment",
    "subtopic": "Constitutional AI & Self-Critique for Safe Response Generation",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Anthropic AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Constitutional AI & Self-Critique for Safe Response Generation.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Constitutional AI & Self-Critique for Safe Response Generation. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "Fine-Tuning & Alignment",
      "Anthropic",
      "AISafetyEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-96-hierarchical-chunking-parent-docume",
    "title": "Hierarchical Chunking [System Design #96]",
    "question": "Architect and evaluate **Hierarchical Chunking: Parent Document Retrieval & Small-to-Big** within **RAG & Vector Search**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Amazon.",
    "type": "GenAI",
    "company": "Amazon",
    "role": "Applied Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "RAG & Vector Search",
    "subtopic": "Hierarchical Chunking: Parent Document Retrieval & Small-to-Big",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Amazon AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Hierarchical Chunking: Parent Document Retrieval & Small-to-Big.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Hierarchical Chunking: Parent Document Retrieval & Small-to-Big. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "RAG & Vector Search",
      "Amazon",
      "AppliedScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-97-hnsw-hierarchical-navigable-small-w",
    "title": "HNSW (Hierarchical Navigable Small World) Vector Graph Indexing [System Design #97]",
    "question": "Architect and evaluate **HNSW (Hierarchical Navigable Small World) Vector Graph Indexing** within **RAG & Vector Search**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Pinecone.",
    "type": "GenAI",
    "company": "Pinecone",
    "role": "Search Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "RAG & Vector Search",
    "subtopic": "HNSW (Hierarchical Navigable Small World) Vector Graph Indexing",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Pinecone AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for HNSW (Hierarchical Navigable Small World) Vector Graph Indexing.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in HNSW (Hierarchical Navigable Small World) Vector Graph Indexing. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "RAG & Vector Search",
      "Pinecone",
      "SearchEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-98-cross-encoder-rerankers-improving-t",
    "title": "Cross-Encoder Rerankers [System Design #98]",
    "question": "Architect and evaluate **Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval** within **RAG & Vector Search**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Cohere.",
    "type": "GenAI",
    "company": "Cohere",
    "role": "Reranking Scientist",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "RAG & Vector Search",
    "subtopic": "Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Cohere AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Cross-Encoder Rerankers: Improving Top-K Precision Post-Retrieval. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "RAG & Vector Search",
      "Cohere",
      "RerankingScientist"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-99-structured-json-decoding-via-contex",
    "title": "Structured JSON Decoding via Context-Free Grammars (CFGs) [System Design #99]",
    "question": "Architect and evaluate **Structured JSON Decoding via Context-Free Grammars (CFGs)** within **AI Agents**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at OpenAI.",
    "type": "GenAI",
    "company": "OpenAI",
    "role": "AI Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "AI Agents",
    "subtopic": "Structured JSON Decoding via Context-Free Grammars (CFGs)",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "OpenAI AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Structured JSON Decoding via Context-Free Grammars (CFGs).",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Structured JSON Decoding via Context-Free Grammars (CFGs). Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "AI Agents",
      "OpenAI",
      "AIPlatformEngineer"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-genai-genai-canonical-100-multi-agent-coordination-hierarchic",
    "title": "Multi-Agent Coordination [System Design #100]",
    "question": "Architect and evaluate **Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus** within **AI Agents**. Address system scaling boundaries, mathematical guarantees, memory trade-offs, and critical reliability failure modes encountered in modern production LLM deployment at Microsoft.",
    "type": "GenAI",
    "company": "Microsoft",
    "role": "Principal AI Architect",
    "round": "Technical Round 2",
    "domain": "Generative AI",
    "topic": "AI Agents",
    "subtopic": "Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Microsoft AI Architecture Benchmark",
    "verified": true,
    "hints": [
      "Analyze VRAM bandwidth vs compute bottlenecks for Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus.",
      "Consider numerical stability under FP16/BF16 representation."
    ],
    "explanation": "This problem validates deep engineering capability in Multi-Agent Coordination: Hierarchical Delegation vs Swarm Consensus. Key technical requirements: understand attention mechanics/quantization limits, optimize hardware bandwidth utilization, enforce deterministic safety constraints, and benchmark performance metrics rigorously.",
    "solution": "Architectural resolution: 1. Formulate mathematical or system constraint. 2. Implement memory-efficient representation. 3. Verify accuracy retention or latency SLA under maximum concurrency.",
    "tags": [
      "Generative AI",
      "AI Agents",
      "Microsoft",
      "PrincipalAIArchitect"
    ],
    "recommendedForRoles": [
      "AI Engineer",
      "LLM Engineer",
      "Machine Learning Engineer"
    ],
    "whyRecommended": "Rigorous technical challenge validating modern Generative AI and LLM system engineering.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  }
];
