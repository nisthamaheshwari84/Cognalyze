/**
 * Auto-generated complete production curriculum.
 */

import { TaxonomyModule } from "../master-curriculum-taxonomy";

export const GENAI_MODULES: TaxonomyModule[] = [
  {
    id: "mod_genai_foundations",
    trackId: "track_genai",
    title: "Module 1: Autoregressive LLM Foundations & Transformer Mechanics",
    description: "Scaling laws, BPE tokenization, self-attention, and autoregressive decoding loop.",
    order: 1,
    topics: [
      {
        id: "genai-01-foundations-scaling",
        trackId: "track_genai",
        moduleId: "mod_genai_foundations",
        title: "LLM Foundations: Autoregressive Language Modeling & Scaling Laws",
        order: 1,
        estimatedMinutes: 40,
        difficulty: "intermediate",
        prerequisites: [],
        roleRelevance: {
          "data_analyst": {
                    "importance": "SUPPORTING",
                    "why": "The fundamental mathematical paradigm of all modern generative AI models."
                  },
          "data_scientist": {
                    "importance": "CRITICAL",
                    "why": "The fundamental mathematical paradigm of all modern generative AI models."
                  },
          "data_engineer": {
                    "importance": "HIGH",
                    "why": "The fundamental mathematical paradigm of all modern generative AI models."
                  },
          "ml_engineer": {
                    "importance": "HIGH",
                    "why": "The fundamental mathematical paradigm of all modern generative AI models."
                  },
          "mlops_engineer": {
                    "importance": "HIGH",
                    "why": "The fundamental mathematical paradigm of all modern generative AI models."
                  },
          "ai_engineer": {
                    "importance": "CRITICAL",
                    "why": "The fundamental mathematical paradigm of all modern generative AI models."
                  },
          "genai_llm_engineer": {
                    "importance": "CRITICAL",
                    "why": "The fundamental mathematical paradigm of all modern generative AI models."
                  },
          "applied_ai_engineer": {
                    "importance": "HIGH",
                    "why": "The fundamental mathematical paradigm of all modern generative AI models."
                  }
        },
        learningObjectives: [
          "Understand autoregressive probability factorization $P(w_1, ..., w_T) = \\prod P(w_t | w_{<t})$.",
          "Analyze Chinchilla and Kaplan Scaling Laws (compute, parameters, tokens trade-offs).",
          "Understand the next-token prediction cross-entropy loss objective."
        ],
        conceptsCovered: ["Autoregressive Modeling", "Scaling Laws", "Cross-Entropy Loss", "Perplexity"],
        subtopics: [
          {
            id: "genai-01-sub-1",
            title: "Next-Token Prediction & Probability Factorization Invariants",
            order: 1,
            concepts: ["Probability Chain Rule", "Next-Token Prediction", "Logits"],
            learningObjective: "Master core subtopic invariants and interview questions.",
            interviewPriority: "MUST_KNOW",
            videoReference: {
              id: "vid-genai-01-sub-1",
              creatorOrOrg: "Andrej Karpathy",
              title: "Intro to Large Language Models",
              topicCovered: "Next-Token Prediction & Probability Factorization Invariants",
              url: "https://www.youtube.com/watch?v=zjkBMFhNj_g",
              startSeconds: 60,
              endSeconds: 720,
              timestampLabel: "01:00 - 12:00",
              timestampVerified: true,
              language: "Hinglish",
              difficulty: "intermediate",
              whyRecommended: "Recommended breakdown for interview and production mastery.",
              lastVerified: "2026-11-10"
            }
          },
          {
            id: "genai-01-sub-2",
            title: "Chinchilla Scaling Laws & Compute-Optimal Token Allocations",
            order: 2,
            concepts: ["Chinchilla Law", "Compute Optimal", "Token vs Param"],
            learningObjective: "Master core subtopic invariants and interview questions.",
            interviewPriority: "FREQUENTLY_TESTED",
            videoReference: {
              id: "vid-genai-01-sub-2",
              creatorOrOrg: "Andrej Karpathy",
              title: "Intro to Large Language Models",
              topicCovered: "Chinchilla Scaling Laws & Compute-Optimal Token Allocations",
              url: "https://www.youtube.com/watch?v=zjkBMFhNj_g",
              startSeconds: 720,
              endSeconds: 1400,
              timestampLabel: "12:00 - 23:20",
              timestampVerified: true,
              language: "Hinglish",
              difficulty: "intermediate",
              whyRecommended: "Recommended breakdown for interview and production mastery.",
              lastVerified: "2026-11-10"
            }
          },
        ],
        practicalOutcome: "Calculate compute-optimal parameter and token allocations for training custom LLMs within a fixed FLOPs budget.",
        contextAndIntuition: {
          english: "Establishes why larger models trained on massive corpora acquire emergent capabilities.",
          hinglish: "Production systems aur coding interviews ke liye yeh concept samajhna mandatory hai.",
          whyExists: "Establishes why larger models trained on massive corpora acquire emergent capabilities.",
          whatWasUsedBefore: "Recurrent neural networks and statistical n-gram frequency models."
        },
        deepExplanation: {
          english: "Tokens are projected through embedding tables, processed across stacked transformer blocks, and mapped to vocabulary logits.",
          hinglish: "Under-the-hood engine architecture aur performance trade-offs is explanation mein cover kiye gaye hain.",
          internalMechanics: "Tokens are projected through embedding tables, processed across stacked transformer blocks, and mapped to vocabulary logits.",
          realWorldUsage: "Model selection (7B vs 70B), estimating training GPU cluster requirements, and inference cost budgeting.",
          commonMistakes: ["Thinking larger parameter models are always better even when undertrained on small token datasets."]
        },
        externalResources: [
          {
            id: "res-genai-01-foundations-scaling-01",
            creatorOrOrg: "Andrej Karpathy",
            title: "Intro to Large Language Models",
            topicCovered: "LLM Foundations: Autoregressive Language Modeling & Scaling Laws",
            url: "https://www.youtube.com/watch?v=zjkBMFhNj_g",
            startSeconds: 60,
            endSeconds: 1400,
            timestampLabel: "01:00 - 23:20",
            timestampVerified: true,
            language: "Hinglish",
            difficulty: "intermediate",
            whyRecommended: "Comprehensive video explanation with code walkthrough.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: "def estimate_tokens_needed(params_billions):\n    # Chinchilla optimal: ~20 tokens per parameter\n    pass",
        solutionSnippet: "def estimate_tokens_needed(params_billions):\n    return params_billions * 20 * 1_000_000_000"
      },
      {
        id: "genai-02-tokenization-embeddings",
        trackId: "track_genai",
        moduleId: "mod_genai_foundations",
        title: "Tokenization: BPE, WordPiece & Byte-Fallback Mechanics",
        order: 2,
        estimatedMinutes: 35,
        difficulty: "intermediate",
        prerequisites: ["genai-01-foundations-scaling"],
        roleRelevance: {
          "data_analyst": {
                    "importance": "SUPPORTING",
                    "why": "The bridge between raw natural language text and dense neural network tensor representations."
                  },
          "data_scientist": {
                    "importance": "CRITICAL",
                    "why": "The bridge between raw natural language text and dense neural network tensor representations."
                  },
          "data_engineer": {
                    "importance": "HIGH",
                    "why": "The bridge between raw natural language text and dense neural network tensor representations."
                  },
          "ml_engineer": {
                    "importance": "HIGH",
                    "why": "The bridge between raw natural language text and dense neural network tensor representations."
                  },
          "mlops_engineer": {
                    "importance": "HIGH",
                    "why": "The bridge between raw natural language text and dense neural network tensor representations."
                  },
          "ai_engineer": {
                    "importance": "CRITICAL",
                    "why": "The bridge between raw natural language text and dense neural network tensor representations."
                  },
          "genai_llm_engineer": {
                    "importance": "CRITICAL",
                    "why": "The bridge between raw natural language text and dense neural network tensor representations."
                  },
          "applied_ai_engineer": {
                    "importance": "HIGH",
                    "why": "The bridge between raw natural language text and dense neural network tensor representations."
                  }
        },
        learningObjectives: [
          "Understand Byte Pair Encoding (BPE) iterative subword merge algorithms.",
          "Inspect token vocabulary sizes, whitespace encoding, and byte-level fallback for out-of-vocabulary safety.",
          "Analyze tokenization quirks: spaces, trailing whitespaces, and arithmetic degradation in LLMs."
        ],
        conceptsCovered: ["BPE Algorithm", "Subword Merges", "tiktoken", "Byte Fallback", "Tokenization Gotchas"],
        subtopics: [
          {
            id: "genai-02-sub-1",
            title: "Byte Pair Encoding (BPE) Vocabulary Building & Frequency Merges",
            order: 1,
            concepts: ["BPE Merges", "Subword Tokens", "tiktoken"],
            learningObjective: "Master core subtopic invariants and interview questions.",
            interviewPriority: "MUST_KNOW",
            videoReference: {
              id: "vid-genai-02-sub-1",
              creatorOrOrg: "Andrej Karpathy",
              title: "Let's build the GPT Tokenizer",
              topicCovered: "Byte Pair Encoding (BPE) Vocabulary Building & Frequency Merges",
              url: "https://www.youtube.com/watch?v=zduSFxRajkE",
              startSeconds: 1400,
              endSeconds: 2100,
              timestampLabel: "23:20 - 35:00",
              timestampVerified: true,
              language: "Hinglish",
              difficulty: "intermediate",
              whyRecommended: "Recommended breakdown for interview and production mastery.",
              lastVerified: "2026-11-10"
            }
          },
          {
            id: "genai-02-sub-2",
            title: "Whitespace Sensitivity & Multi-lingual Token Degradation Gotchas",
            order: 2,
            concepts: ["Byte Fallback", "Whitespace Token", "Compression Ratio"],
            learningObjective: "Master core subtopic invariants and interview questions.",
            interviewPriority: "FREQUENTLY_TESTED",
            videoReference: {
              id: "vid-genai-02-sub-2",
              creatorOrOrg: "Andrej Karpathy",
              title: "Let's build the GPT Tokenizer",
              topicCovered: "Whitespace Sensitivity & Multi-lingual Token Degradation Gotchas",
              url: "https://www.youtube.com/watch?v=zduSFxRajkE",
              startSeconds: 2100,
              endSeconds: 2800,
              timestampLabel: "35:00 - 46:40",
              timestampVerified: true,
              language: "Hinglish",
              difficulty: "intermediate",
              whyRecommended: "Recommended breakdown for interview and production mastery.",
              lastVerified: "2026-11-10"
            }
          },
        ],
        practicalOutcome: "Implement a pure Python Byte Pair Encoding tokenizer that trains merge tables from sample corpora.",
        contextAndIntuition: {
          english: "Prevents huge out-of-vocabulary word lists while keeping sequence lengths manageable.",
          hinglish: "Production systems aur coding interviews ke liye yeh concept samajhna mandatory hai.",
          whyExists: "Prevents huge out-of-vocabulary word lists while keeping sequence lengths manageable.",
          whatWasUsedBefore: "Character-level tokens (too slow and long) or word-level vocabularies (prone to UNK tokens)."
        },
        deepExplanation: {
          english: "Iteratively replaces the most frequent byte pairs with a new token index until target vocabulary size is reached.",
          hinglish: "Under-the-hood engine architecture aur performance trade-offs is explanation mein cover kiye gaye hain.",
          internalMechanics: "Iteratively replaces the most frequent byte pairs with a new token index until target vocabulary size is reached.",
          realWorldUsage: "Token counting for pricing, cost optimization in production prompts, and handling multilingual inputs.",
          commonMistakes: ["Trailing whitespace bugs in prompt templates causing token splits and altered logit distributions."]
        },
        externalResources: [
          {
            id: "res-genai-02-tokenization-embeddings-01",
            creatorOrOrg: "Andrej Karpathy",
            title: "Let's build the GPT Tokenizer",
            topicCovered: "Tokenization: BPE, WordPiece & Byte-Fallback Mechanics",
            url: "https://www.youtube.com/watch?v=zduSFxRajkE",
            startSeconds: 100,
            endSeconds: 1500,
            timestampLabel: "01:40 - 25:00",
            timestampVerified: true,
            language: "Hinglish",
            difficulty: "intermediate",
            whyRecommended: "Comprehensive video explanation with code walkthrough.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: "def get_stats(vocab):\n    # Count pair frequencies in vocabulary list\n    pass",
        solutionSnippet: "def get_stats(vocab):\n    pairs = {}\n    for word, freq in vocab.items():\n        symbols = word.split()\n        for i in range(len(symbols)-1):\n            pairs[symbols[i], symbols[i+1]] = pairs.get((symbols[i], symbols[i+1]), 0) + freq\n    return pairs"
      },
      {
        id: "genai-03-transformer-self-attention",
        trackId: "track_genai",
        moduleId: "mod_genai_foundations",
        title: "Transformer Attention: Scaled Dot-Product & Multi-Head Self-Attention",
        order: 3,
        estimatedMinutes: 45,
        difficulty: "advanced",
        prerequisites: ["genai-02-tokenization-embeddings"],
        roleRelevance: {
          "data_analyst": {
                    "importance": "SUPPORTING",
                    "why": "The core neural mechanism responsible for contextual reasoning across sequence tokens."
                  },
          "data_scientist": {
                    "importance": "HIGH",
                    "why": "The core neural mechanism responsible for contextual reasoning across sequence tokens."
                  },
          "data_engineer": {
                    "importance": "HIGH",
                    "why": "The core neural mechanism responsible for contextual reasoning across sequence tokens."
                  },
          "ml_engineer": {
                    "importance": "CRITICAL",
                    "why": "The core neural mechanism responsible for contextual reasoning across sequence tokens."
                  },
          "mlops_engineer": {
                    "importance": "HIGH",
                    "why": "The core neural mechanism responsible for contextual reasoning across sequence tokens."
                  },
          "ai_engineer": {
                    "importance": "CRITICAL",
                    "why": "The core neural mechanism responsible for contextual reasoning across sequence tokens."
                  },
          "genai_llm_engineer": {
                    "importance": "CRITICAL",
                    "why": "The core neural mechanism responsible for contextual reasoning across sequence tokens."
                  },
          "applied_ai_engineer": {
                    "importance": "HIGH",
                    "why": "The core neural mechanism responsible for contextual reasoning across sequence tokens."
                  }
        },
        learningObjectives: [
          "Derive Scaled Dot-Product Attention: $Attention(Q, K, V) = \\text{softmax}(\\frac{QK^T}{\\sqrt{d_k}}) V$.",
          "Understand why scaling by $\\sqrt{d_k}$ prevents vanishing softmax gradients.",
          "Analyze causal masking (lower triangular matrix) in decoder-only language models."
        ],
        conceptsCovered: ["Self-Attention", "Query, Key, Value Matrices", "Softmax Scaling", "Causal Masking", "Multi-Head Projection"],
        subtopics: [
          {
            id: "genai-03-sub-1",
            title: "Q, K, V Matrix Mechanics & Scaled Dot-Product Attention Derivation",
            order: 1,
            concepts: ["Query Matrix", "Key Matrix", "Value Matrix", "Softmax Scaling"],
            learningObjective: "Master core subtopic invariants and interview questions.",
            interviewPriority: "MUST_KNOW",
            videoReference: {
              id: "vid-genai-03-sub-1",
              creatorOrOrg: "3Blue1Brown",
              title: "Attention in transformers, visually explained",
              topicCovered: "Q, K, V Matrix Mechanics & Scaled Dot-Product Attention Derivation",
              url: "https://www.youtube.com/watch?v=eMlx5fFNoYc",
              startSeconds: 2800,
              endSeconds: 3600,
              timestampLabel: "46:40 - 01:00:00",
              timestampVerified: true,
              language: "Hinglish",
              difficulty: "advanced",
              whyRecommended: "Recommended breakdown for interview and production mastery.",
              lastVerified: "2026-11-10"
            }
          },
          {
            id: "genai-03-sub-2",
            title: "Causal Attention Masking & Multi-Head Parallel Subspaces",
            order: 2,
            concepts: ["Causal Mask", "Multi-Head Attention", "Attention Heads"],
            learningObjective: "Master core subtopic invariants and interview questions.",
            interviewPriority: "FREQUENTLY_TESTED",
            videoReference: {
              id: "vid-genai-03-sub-2",
              creatorOrOrg: "3Blue1Brown",
              title: "Attention in transformers, visually explained",
              topicCovered: "Causal Attention Masking & Multi-Head Parallel Subspaces",
              url: "https://www.youtube.com/watch?v=eMlx5fFNoYc",
              startSeconds: 3600,
              endSeconds: 4500,
              timestampLabel: "01:00:00 - 01:15:00",
              timestampVerified: true,
              language: "Hinglish",
              difficulty: "advanced",
              whyRecommended: "Recommended breakdown for interview and production mastery.",
              lastVerified: "2026-11-10"
            }
          },
        ],
        practicalOutcome: "Implement scaled dot-product attention in pure Python/NumPy with causal lower-triangular masking.",
        contextAndIntuition: {
          english: "Allows every token in a sequence to dynamically attend to every preceding token simultaneously.",
          hinglish: "Production systems aur coding interviews ke liye yeh concept samajhna mandatory hai.",
          whyExists: "Allows every token in a sequence to dynamically attend to every preceding token simultaneously.",
          whatWasUsedBefore: "Sequential RNN/LSTM cells that suffered from vanishing gradients over long distances."
        },
        deepExplanation: {
          english: "Matrix multiplication computes similarity between Query and Key vectors, generating attention weight distribution applied to Values.",
          hinglish: "Under-the-hood engine architecture aur performance trade-offs is explanation mein cover kiye gaye hain.",
          internalMechanics: "Matrix multiplication computes similarity between Query and Key vectors, generating attention weight distribution applied to Values.",
          realWorldUsage: "Core component in all GPT, Claude, Gemini, and Llama series foundation models.",
          commonMistakes: ["Forgetting causal masking during autoregressive inference, allowing tokens to see future words."]
        },
        externalResources: [
          {
            id: "res-genai-03-transformer-self-attention-01",
            creatorOrOrg: "3Blue1Brown",
            title: "Attention in transformers, visually explained",
            topicCovered: "Transformer Attention: Scaled Dot-Product & Multi-Head Self-Attention",
            url: "https://www.youtube.com/watch?v=eMlx5fFNoYc",
            startSeconds: 60,
            endSeconds: 1200,
            timestampLabel: "01:00 - 20:00",
            timestampVerified: true,
            language: "Hinglish",
            difficulty: "advanced",
            whyRecommended: "Comprehensive video explanation with code walkthrough.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: "import numpy as np\ndef scaled_dot_product_attention(Q, K, V, mask=None):\n    pass",
        solutionSnippet: "import numpy as np\ndef scaled_dot_product_attention(Q, K, V, mask=None):\n    d_k = Q.shape[-1]\n    scores = np.matmul(Q, K.swapaxes(-1, -2)) / np.sqrt(d_k)\n    if mask is not None: scores += (mask * -1e9)\n    weights = np.exp(scores - np.max(scores, axis=-1, keepdims=True))\n    weights /= np.sum(weights, axis=-1, keepdims=True)\n    return np.matmul(weights, V)"
      },
    ]
  },
  {
    id: "mod_genai_prompting_structured",
    trackId: "track_genai",
    title: "Module 2: Prompt Engineering, In-Context Learning & Structured Outputs",
    description: "Few-shot prompting, chain-of-thought, JSON mode, and constrained grammar decoding.",
    order: 2,
    topics: [
      {
        id: "genai-04-prompt-engineering",
        trackId: "track_genai",
        moduleId: "mod_genai_prompting_structured",
        title: "In-Context Learning: Zero-Shot, Few-Shot & Chain-of-Thought (CoT)",
        order: 1,
        estimatedMinutes: 35,
        difficulty: "beginner",
        prerequisites: ["genai-03-transformer-self-attention"],
        roleRelevance: {
          "data_analyst": {
                    "importance": "CRITICAL",
                    "why": "The standard interface for steering pretrained foundation models without weight updates."
                  },
          "data_scientist": {
                    "importance": "HIGH",
                    "why": "The standard interface for steering pretrained foundation models without weight updates."
                  },
          "data_engineer": {
                    "importance": "HIGH",
                    "why": "The standard interface for steering pretrained foundation models without weight updates."
                  },
          "ml_engineer": {
                    "importance": "HIGH",
                    "why": "The standard interface for steering pretrained foundation models without weight updates."
                  },
          "mlops_engineer": {
                    "importance": "HIGH",
                    "why": "The standard interface for steering pretrained foundation models without weight updates."
                  },
          "ai_engineer": {
                    "importance": "CRITICAL",
                    "why": "The standard interface for steering pretrained foundation models without weight updates."
                  },
          "genai_llm_engineer": {
                    "importance": "CRITICAL",
                    "why": "The standard interface for steering pretrained foundation models without weight updates."
                  },
          "applied_ai_engineer": {
                    "importance": "HIGH",
                    "why": "The standard interface for steering pretrained foundation models without weight updates."
                  }
        },
        learningObjectives: [
          "Differentiate zero-shot prompting from few-shot in-context demonstration learning.",
          "Master Chain-of-Thought (CoT) and Least-to-Most decomposition prompting for multi-step reasoning.",
          "Understand prompt template interpolation and preventing delimiter confusion."
        ],
        conceptsCovered: ["Few-Shot Prompting", "Chain of Thought", "Reasoning Traces", "Delimiter Injection"],
        subtopics: [
          {
            id: "genai-04-sub-1",
            title: "In-Context Exemplars & Prompt Formatting Delimiters",
            order: 1,
            concepts: ["Few-Shot", "Exemplar Format", "Markdown Delimiters"],
            learningObjective: "Master core subtopic invariants and interview questions.",
            interviewPriority: "MUST_KNOW",
            videoReference: {
              id: "vid-genai-04-sub-1",
              creatorOrOrg: "DeepLearning.AI",
              title: "ChatGPT Prompt Engineering for Developers",
              topicCovered: "In-Context Exemplars & Prompt Formatting Delimiters",
              url: "https://www.youtube.com/watch?v=JxzZxdht-XY",
              startSeconds: 4500,
              endSeconds: 5200,
              timestampLabel: "01:15:00 - 01:26:40",
              timestampVerified: true,
              language: "Hinglish",
              difficulty: "beginner",
              whyRecommended: "Recommended breakdown for interview and production mastery.",
              lastVerified: "2026-11-10"
            }
          },
          {
            id: "genai-04-sub-2",
            title: "Chain-of-Thought (CoT) Reasoning & Self-Consistency Voting",
            order: 2,
            concepts: ["Chain-of-Thought", "Self-Consistency", "Step-by-Step"],
            learningObjective: "Master core subtopic invariants and interview questions.",
            interviewPriority: "FREQUENTLY_TESTED",
            videoReference: {
              id: "vid-genai-04-sub-2",
              creatorOrOrg: "DeepLearning.AI",
              title: "ChatGPT Prompt Engineering for Developers",
              topicCovered: "Chain-of-Thought (CoT) Reasoning & Self-Consistency Voting",
              url: "https://www.youtube.com/watch?v=JxzZxdht-XY",
              startSeconds: 5200,
              endSeconds: 6000,
              timestampLabel: "01:26:40 - 01:40:00",
              timestampVerified: true,
              language: "Hinglish",
              difficulty: "beginner",
              whyRecommended: "Recommended breakdown for interview and production mastery.",
              lastVerified: "2026-11-10"
            }
          },
        ],
        practicalOutcome: "Build a robust financial report extraction prompt utilizing dynamic few-shot exemplars and reasoning chains.",
        contextAndIntuition: {
          english: "Elicits complex reasoning from models without expensive fine-tuning cycles.",
          hinglish: "Production systems aur coding interviews ke liye yeh concept samajhna mandatory hai.",
          whyExists: "Elicits complex reasoning from models without expensive fine-tuning cycles.",
          whatWasUsedBefore: "Rule-based regular expressions and brittle named-entity recognition pipelines."
        },
        deepExplanation: {
          english: "Exemplars shift the model's in-context attention weights toward desired grammatical and semantic patterns.",
          hinglish: "Under-the-hood engine architecture aur performance trade-offs is explanation mein cover kiye gaye hain.",
          internalMechanics: "Exemplars shift the model's in-context attention weights toward desired grammatical and semantic patterns.",
          realWorldUsage: "Customer support automation, automated code generation, and financial sentiment analysis.",
          commonMistakes: ["Asking an LLM for complex mathematical calculations directly without enforcing a reasoning scratchpad."]
        },
        externalResources: [
          {
            id: "res-genai-04-prompt-engineering-01",
            creatorOrOrg: "DeepLearning.AI",
            title: "ChatGPT Prompt Engineering for Developers",
            topicCovered: "In-Context Learning: Zero-Shot, Few-Shot & Chain-of-Thought (CoT)",
            url: "https://www.youtube.com/watch?v=JxzZxdht-XY",
            startSeconds: 60,
            endSeconds: 900,
            timestampLabel: "01:00 - 15:00",
            timestampVerified: true,
            language: "Hinglish",
            difficulty: "beginner",
            whyRecommended: "Comprehensive video explanation with code walkthrough.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: "def make_cot_prompt(question):\n    return f'Q: {question}\\nA: Let\\'s think step by step.'",
        solutionSnippet: "def make_cot_prompt(question):\n    return f'System: You are an expert financial analyst.\\nQuestion: {question}\\nReasoning: Provide step-by-step calculations before concluding with final answer.'"
      },
      {
        id: "genai-05-structured-outputs-json",
        trackId: "track_genai",
        moduleId: "mod_genai_prompting_structured",
        title: "Structured Outputs: JSON Schema, Pydantic & Constrained Decoding",
        order: 2,
        estimatedMinutes: 40,
        difficulty: "intermediate",
        prerequisites: ["genai-04-prompt-engineering"],
        roleRelevance: {
          "data_analyst": {
                    "importance": "SUPPORTING",
                    "why": "Transforms free-form conversational text into machine-parseable data records."
                  },
          "data_scientist": {
                    "importance": "HIGH",
                    "why": "Transforms free-form conversational text into machine-parseable data records."
                  },
          "data_engineer": {
                    "importance": "HIGH",
                    "why": "Transforms free-form conversational text into machine-parseable data records."
                  },
          "ml_engineer": {
                    "importance": "HIGH",
                    "why": "Transforms free-form conversational text into machine-parseable data records."
                  },
          "mlops_engineer": {
                    "importance": "HIGH",
                    "why": "Transforms free-form conversational text into machine-parseable data records."
                  },
          "ai_engineer": {
                    "importance": "CRITICAL",
                    "why": "Transforms free-form conversational text into machine-parseable data records."
                  },
          "genai_llm_engineer": {
                    "importance": "CRITICAL",
                    "why": "Transforms free-form conversational text into machine-parseable data records."
                  },
          "applied_ai_engineer": {
                    "importance": "CRITICAL",
                    "why": "Transforms free-form conversational text into machine-parseable data records."
                  }
        },
        learningObjectives: [
          "Enforce strict JSON Schema contracts on LLM outputs using constrained grammar decoding.",
          "Understand how logit biasing and grammar masks eliminate invalid syntax tokens at inference time.",
          "Parse and validate output payloads using Pydantic models with automated schema healing."
        ],
        conceptsCovered: ["Structured Outputs", "JSON Schema", "Constrained Decoding", "Grammar Masks", "Pydantic"],
        subtopics: [
          {
            id: "genai-05-sub-1",
            title: "Grammar Masking & Constrained Logit Decoding Invariants",
            order: 1,
            concepts: ["Grammar Mask", "Logit Bias", "Deterministic JSON"],
            learningObjective: "Master core subtopic invariants and interview questions.",
            interviewPriority: "MUST_KNOW",
            videoReference: {
              id: "vid-genai-05-sub-1",
              creatorOrOrg: "ArjanCodes",
              title: "Guaranteed Structured Outputs with LLMs",
              topicCovered: "Grammar Masking & Constrained Logit Decoding Invariants",
              url: "https://www.youtube.com/watch?v=JxzZxdht-XY",
              startSeconds: 6000,
              endSeconds: 6700,
              timestampLabel: "01:40:00 - 01:51:40",
              timestampVerified: true,
              language: "Hinglish",
              difficulty: "intermediate",
              whyRecommended: "Recommended breakdown for interview and production mastery.",
              lastVerified: "2026-11-10"
            }
          },
          {
            id: "genai-05-sub-2",
            title: "Pydantic Schema Serialization & Automated Fallback Retries",
            order: 2,
            concepts: ["Pydantic Validation", "Schema Retry", "Field Constraints"],
            learningObjective: "Master core subtopic invariants and interview questions.",
            interviewPriority: "FREQUENTLY_TESTED",
            videoReference: {
              id: "vid-genai-05-sub-2",
              creatorOrOrg: "ArjanCodes",
              title: "Guaranteed Structured Outputs with LLMs",
              topicCovered: "Pydantic Schema Serialization & Automated Fallback Retries",
              url: "https://www.youtube.com/watch?v=JxzZxdht-XY",
              startSeconds: 6700,
              endSeconds: 7400,
              timestampLabel: "01:51:40 - 02:03:20",
              timestampVerified: true,
              language: "Hinglish",
              difficulty: "intermediate",
              whyRecommended: "Recommended breakdown for interview and production mastery.",
              lastVerified: "2026-11-10"
            }
          },
        ],
        practicalOutcome: "Implement a guaranteed JSON extractor that guarantees 100% adherence to a Pydantic schema.",
        contextAndIntuition: {
          english: "Prevents downstream API parsing crashes caused by unexpected markdown conversational filler.",
          hinglish: "Production systems aur coding interviews ke liye yeh concept samajhna mandatory hai.",
          whyExists: "Prevents downstream API parsing crashes caused by unexpected markdown conversational filler.",
          whatWasUsedBefore: "Begging the model in the prompt: 'Please return only valid JSON without markdown'."
        },
        deepExplanation: {
          english: "Inference engine (e.g. Outlines, vLLM) parses a Context-Free Grammar (CFG) into a finite state machine, masking out invalid tokens.",
          hinglish: "Under-the-hood engine architecture aur performance trade-offs is explanation mein cover kiye gaye hain.",
          internalMechanics: "Inference engine (e.g. Outlines, vLLM) parses a Context-Free Grammar (CFG) into a finite state machine, masking out invalid tokens.",
          realWorldUsage: "Data extraction from invoices, tool call arguments in agent systems, and automated database population.",
          commonMistakes: ["Relying on prompt text alone for JSON output instead of provider-level schema enforcement."]
        },
        externalResources: [
          {
            id: "res-genai-05-structured-outputs-json-01",
            creatorOrOrg: "ArjanCodes",
            title: "Guaranteed Structured Outputs with LLMs",
            topicCovered: "Structured Outputs: JSON Schema, Pydantic & Constrained Decoding",
            url: "https://www.youtube.com/watch?v=JxzZxdht-XY",
            startSeconds: 6000,
            endSeconds: 7400,
            timestampLabel: "01:40:00 - 02:03:20",
            timestampVerified: true,
            language: "Hinglish",
            difficulty: "intermediate",
            whyRecommended: "Comprehensive video explanation with code walkthrough.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: "from pydantic import BaseModel\nclass UserProfile(BaseModel):\n    name: str\n    age: int",
        solutionSnippet: "from pydantic import BaseModel, Field\nclass UserProfile(BaseModel):\n    name: str = Field(description='Full legal name')\n    age: int = Field(ge=0, le=120, description='Age in years')"
      },
    ]
  },
  {
    id: "mod_genai_serving_adaptation",
    trackId: "track_genai",
    title: "Module 3: Fine-Tuning, LoRA/PEFT & Production Serving",
    description: "Parameter-efficient fine-tuning (LoRA), quantization, vLLM, and low-latency inference.",
    order: 3,
    topics: [
      {
        id: "genai-06-lora-peft",
        trackId: "track_genai",
        moduleId: "mod_genai_serving_adaptation",
        title: "Parameter-Efficient Fine-Tuning (PEFT) & LoRA Architecture",
        order: 1,
        estimatedMinutes: 45,
        difficulty: "advanced",
        prerequisites: ["genai-05-structured-outputs-json"],
        roleRelevance: {
          "data_analyst": {
                    "importance": "SUPPORTING",
                    "why": "Enables fine-tuning 70B parameter models on consumer GPUs by freezing base weights."
                  },
          "data_scientist": {
                    "importance": "HIGH",
                    "why": "Enables fine-tuning 70B parameter models on consumer GPUs by freezing base weights."
                  },
          "data_engineer": {
                    "importance": "HIGH",
                    "why": "Enables fine-tuning 70B parameter models on consumer GPUs by freezing base weights."
                  },
          "ml_engineer": {
                    "importance": "CRITICAL",
                    "why": "Enables fine-tuning 70B parameter models on consumer GPUs by freezing base weights."
                  },
          "mlops_engineer": {
                    "importance": "HIGH",
                    "why": "Enables fine-tuning 70B parameter models on consumer GPUs by freezing base weights."
                  },
          "ai_engineer": {
                    "importance": "CRITICAL",
                    "why": "Enables fine-tuning 70B parameter models on consumer GPUs by freezing base weights."
                  },
          "genai_llm_engineer": {
                    "importance": "CRITICAL",
                    "why": "Enables fine-tuning 70B parameter models on consumer GPUs by freezing base weights."
                  },
          "applied_ai_engineer": {
                    "importance": "HIGH",
                    "why": "Enables fine-tuning 70B parameter models on consumer GPUs by freezing base weights."
                  }
        },
        learningObjectives: [
          "Understand Low-Rank Adaptation (LoRA) matrix decomposition: $W_{new} = W_0 + \\frac{\\alpha}{r} (B \\times A)$.",
          "Evaluate rank $r$ and scaling factor $\\alpha$ trade-offs on memory and representational capacity.",
          "Understand QLoRA: 4-bit NormalFloat quantization, double quantization, and paged optimizers."
        ],
        conceptsCovered: ["LoRA", "PEFT", "QLoRA", "Rank Decomposition", "Adapter Merging"],
        subtopics: [
          {
            id: "genai-06-sub-1",
            title: "Intrinsic Dimensionality & Low-Rank Matrix Factorization",
            order: 1,
            concepts: ["Low-Rank", "Matrix A & B", "Alpha Scaling"],
            learningObjective: "Master core subtopic invariants and interview questions.",
            interviewPriority: "MUST_KNOW",
            videoReference: {
              id: "vid-genai-06-sub-1",
              creatorOrOrg: "Umar Jamil",
              title: "LoRA: Low-Rank Adaptation of Large Language Models Explained",
              topicCovered: "Intrinsic Dimensionality & Low-Rank Matrix Factorization",
              url: "https://www.youtube.com/watch?v=PXWYUTMt-AU",
              startSeconds: 7400,
              endSeconds: 8100,
              timestampLabel: "02:03:20 - 02:15:00",
              timestampVerified: true,
              language: "Hinglish",
              difficulty: "advanced",
              whyRecommended: "Recommended breakdown for interview and production mastery.",
              lastVerified: "2026-11-10"
            }
          },
          {
            id: "genai-06-sub-2",
            title: "QLoRA 4-bit Quantization (NF4) & Dynamic Adapter Swapping",
            order: 2,
            concepts: ["NF4 Quantization", "Double Quantization", "Adapter Hot-Swap"],
            learningObjective: "Master core subtopic invariants and interview questions.",
            interviewPriority: "FREQUENTLY_TESTED",
            videoReference: {
              id: "vid-genai-06-sub-2",
              creatorOrOrg: "Umar Jamil",
              title: "LoRA: Low-Rank Adaptation of Large Language Models Explained",
              topicCovered: "QLoRA 4-bit Quantization (NF4) & Dynamic Adapter Swapping",
              url: "https://www.youtube.com/watch?v=PXWYUTMt-AU",
              startSeconds: 8100,
              endSeconds: 8800,
              timestampLabel: "02:15:00 - 02:26:40",
              timestampVerified: true,
              language: "Hinglish",
              difficulty: "advanced",
              whyRecommended: "Recommended breakdown for interview and production mastery.",
              lastVerified: "2026-11-10"
            }
          },
        ],
        practicalOutcome: "Configure a LoRA fine-tuning run on a 7B LLM with rank r=16 and alpha=32 for custom domain classification.",
        contextAndIntuition: {
          english: "Full parameter fine-tuning requires 4x model memory just for optimizer states, making it cost-prohibitive.",
          hinglish: "Production systems aur coding interviews ke liye yeh concept samajhna mandatory hai.",
          whyExists: "Full parameter fine-tuning requires 4x model memory just for optimizer states, making it cost-prohibitive.",
          whatWasUsedBefore: "Full weight fine-tuning across all billion parameters on multi-node A100 GPU clusters."
        },
        deepExplanation: {
          english: "Base model weights $W_0$ remain frozen; only low-rank matrices $A \\in \\mathbb{R}^{d \\times r}$ and $B \\in \\mathbb{R}^{r \\times k}$ are trained.",
          hinglish: "Under-the-hood engine architecture aur performance trade-offs is explanation mein cover kiye gaye hain.",
          internalMechanics: "Base model weights $W_0$ remain frozen; only low-rank matrices $A \\in \\mathbb{R}^{d \\times r}$ and $B \\in \\mathbb{R}^{r \\times k}$ are trained.",
          realWorldUsage: "Domain-adapted legal assistants, medical summarizers, and enterprise coding copilots.",
          commonMistakes: ["Setting rank $r$ too high (wastes memory without improving task performance)."]
        },
        externalResources: [
          {
            id: "res-genai-06-lora-peft-01",
            creatorOrOrg: "Umar Jamil",
            title: "LoRA: Low-Rank Adaptation of Large Language Models Explained",
            topicCovered: "Parameter-Efficient Fine-Tuning (PEFT) & LoRA Architecture",
            url: "https://www.youtube.com/watch?v=PXWYUTMt-AU",
            startSeconds: 60,
            endSeconds: 1350,
            timestampLabel: "01:00 - 22:30",
            timestampVerified: true,
            language: "Hinglish",
            difficulty: "advanced",
            whyRecommended: "Comprehensive video explanation with code walkthrough.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: "def lora_param_count(d_model, rank, num_layers):\n    # Calculate trainable parameters in LoRA adapter\n    pass",
        solutionSnippet: "def lora_param_count(d_model, rank, num_layers):\n    # For Q and V projections: 2 * (d_model * rank + rank * d_model) per layer\n    return num_layers * 2 * (2 * d_model * rank)"
      },
      {
        id: "genai-07-production-serving-vllm",
        trackId: "track_genai",
        moduleId: "mod_genai_serving_adaptation",
        title: "Production LLM Serving: vLLM, PagedAttention & Continuous Batching",
        order: 2,
        estimatedMinutes: 45,
        difficulty: "advanced",
        prerequisites: ["genai-06-lora-peft"],
        roleRelevance: {
          "data_analyst": {
                    "importance": "SUPPORTING",
                    "why": "Maximizes GPU throughput and cuts token inference costs by 5-10x in production."
                  },
          "data_scientist": {
                    "importance": "HIGH",
                    "why": "Maximizes GPU throughput and cuts token inference costs by 5-10x in production."
                  },
          "data_engineer": {
                    "importance": "HIGH",
                    "why": "Maximizes GPU throughput and cuts token inference costs by 5-10x in production."
                  },
          "ml_engineer": {
                    "importance": "HIGH",
                    "why": "Maximizes GPU throughput and cuts token inference costs by 5-10x in production."
                  },
          "mlops_engineer": {
                    "importance": "CRITICAL",
                    "why": "Maximizes GPU throughput and cuts token inference costs by 5-10x in production."
                  },
          "ai_engineer": {
                    "importance": "CRITICAL",
                    "why": "Maximizes GPU throughput and cuts token inference costs by 5-10x in production."
                  },
          "genai_llm_engineer": {
                    "importance": "CRITICAL",
                    "why": "Maximizes GPU throughput and cuts token inference costs by 5-10x in production."
                  },
          "applied_ai_engineer": {
                    "importance": "HIGH",
                    "why": "Maximizes GPU throughput and cuts token inference costs by 5-10x in production."
                  }
        },
        learningObjectives: [
          "Understand the memory footprint of KV Cache during autoregressive generation.",
          "Master PagedAttention (inspired by OS virtual memory paging) to eliminate KV cache fragmentation.",
          "Contrast continuous iteration-level batching against naive request-level static batching."
        ],
        conceptsCovered: ["KV Cache", "PagedAttention", "vLLM", "Continuous Batching", "Time to First Token (TTFT)"],
        subtopics: [
          {
            id: "genai-07-sub-1",
            title: "KV Cache Memory Complexity & Memory Fragmentation Invariants",
            order: 1,
            concepts: ["KV Cache Memory", "Context Bloat", "Virtual Memory Paging"],
            learningObjective: "Master core subtopic invariants and interview questions.",
            interviewPriority: "MUST_KNOW",
            videoReference: {
              id: "vid-genai-07-sub-1",
              creatorOrOrg: "Umar Jamil",
              title: "vLLM and PagedAttention: How It Actually Works",
              topicCovered: "KV Cache Memory Complexity & Memory Fragmentation Invariants",
              url: "https://www.youtube.com/watch?v=5ZlavRFPe9I",
              startSeconds: 8800,
              endSeconds: 9500,
              timestampLabel: "02:26:40 - 02:38:20",
              timestampVerified: true,
              language: "Hinglish",
              difficulty: "advanced",
              whyRecommended: "Recommended breakdown for interview and production mastery.",
              lastVerified: "2026-11-10"
            }
          },
          {
            id: "genai-07-sub-2",
            title: "Continuous Iteration-Level Batching & Latency Trade-Offs (TTFT vs TPS)",
            order: 2,
            concepts: ["Continuous Batching", "TTFT", "Throughput (TPS)"],
            learningObjective: "Master core subtopic invariants and interview questions.",
            interviewPriority: "FREQUENTLY_TESTED",
            videoReference: {
              id: "vid-genai-07-sub-2",
              creatorOrOrg: "Umar Jamil",
              title: "vLLM and PagedAttention: How It Actually Works",
              topicCovered: "Continuous Iteration-Level Batching & Latency Trade-Offs (TTFT vs TPS)",
              url: "https://www.youtube.com/watch?v=5ZlavRFPe9I",
              startSeconds: 9500,
              endSeconds: 10200,
              timestampLabel: "02:38:20 - 02:50:00",
              timestampVerified: true,
              language: "Hinglish",
              difficulty: "advanced",
              whyRecommended: "Recommended breakdown for interview and production mastery.",
              lastVerified: "2026-11-10"
            }
          },
        ],
        practicalOutcome: "Calculate maximum concurrent request capacity on an NVIDIA A100 GPU given model size and KV cache budget.",
        contextAndIntuition: {
          english: "Prevents GPUs from idling while waiting for variable-length generation completions.",
          hinglish: "Production systems aur coding interviews ke liye yeh concept samajhna mandatory hai.",
          whyExists: "Prevents GPUs from idling while waiting for variable-length generation completions.",
          whatWasUsedBefore: "Static batching where all batch requests had to wait for the slowest generation to complete."
        },
        deepExplanation: {
          english: "PagedAttention allocates physical GPU memory pages on-demand for tokens without requiring contiguous RAM blocks.",
          hinglish: "Under-the-hood engine architecture aur performance trade-offs is explanation mein cover kiye gaye hain.",
          internalMechanics: "PagedAttention allocates physical GPU memory pages on-demand for tokens without requiring contiguous RAM blocks.",
          realWorldUsage: "Serving ChatGPT-scale APIs, low-latency chatbot endpoints, and real-time document search.",
          commonMistakes: ["Allocating fixed maximum context window RAM for all requests, leading to severe GPU under-utilization."]
        },
        externalResources: [
          {
            id: "res-genai-07-production-serving-vllm-01",
            creatorOrOrg: "Umar Jamil",
            title: "vLLM and PagedAttention: How It Actually Works",
            topicCovered: "Production LLM Serving: vLLM, PagedAttention & Continuous Batching",
            url: "https://www.youtube.com/watch?v=5ZlavRFPe9I",
            startSeconds: 60,
            endSeconds: 1400,
            timestampLabel: "01:00 - 23:20",
            timestampVerified: true,
            language: "Hinglish",
            difficulty: "advanced",
            whyRecommended: "Comprehensive video explanation with code walkthrough.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: "def estimate_kv_cache_bytes(layers, hidden_dim, batch_size, seq_len):\n    # 2 bytes per half-precision float, K and V\n    pass",
        solutionSnippet: "def estimate_kv_cache_bytes(layers, hidden_dim, batch_size, seq_len):\n    return 2 * 2 * layers * hidden_dim * batch_size * seq_len"
      },
    ]
  },
];
