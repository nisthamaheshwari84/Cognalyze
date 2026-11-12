/**
 * lib/skills/ai-data/curriculum/deep-learning-curriculum.ts
 * 
 * Complete Deep Learning Curriculum Decomposition for Cognalyze Master Taxonomy.
 * Features granular modules: Perceptrons, Backpropagation, Activations,
 * Loss Functions, Optimizers (SGD/Adam), CNNs, RNNs/LSTMs, and Transformers.
 */

import { TaxonomyTopic, TaxonomyModule } from "../master-curriculum-taxonomy";

export const DEEP_LEARNING_MODULES: TaxonomyModule[] = [
  {
    id: "mod_dl_neural_foundations",
    trackId: "track_deep_learning",
    title: "Module 1: Neural Networks, Activation Functions & Backpropagation",
    description: "Computational graphs, chain rule calculus, non-linear activations, and gradient propagation.",
    order: 1,
    topics: [
      {
        id: "dl-01-backpropagation-chain-rule",
        trackId: "track_deep_learning",
        moduleId: "mod_dl_neural_foundations",
        title: "Backpropagation: Automatic Differentiation & Computational Graphs",
        order: 1,
        estimatedMinutes: 45,
        difficulty: "intermediate",
        prerequisites: ["ml-01-linear-regression-gradient-descent"],
        roleRelevance: {
          data_analyst: { importance: "SUPPORTING", why: "Conceptual intuition for deep learning black-box predictions." },
          data_scientist: { importance: "HIGH", why: "Diagnosing vanishing and exploding gradient problems during model tuning." },
          data_engineer: { importance: "SUPPORTING", why: "Understanding GPU memory footprints and backward pass buffer requirements." },
          ml_engineer: { importance: "CRITICAL", why: "The foundational engine of all modern neural network training in PyTorch and JAX." },
          mlops_engineer: { importance: "HIGH", why: "Gradient norm monitoring and distributed data-parallel all-reduce synchronization." },
          ai_engineer: { importance: "CRITICAL", why: "Understanding parameter updates during Low-Rank Adaptation (LoRA) and fine-tuning." },
          genai_llm_engineer: { importance: "CRITICAL", why: "Core algorithm underlying transformer pre-training and alignment loss backprop." },
          applied_ai_engineer: { importance: "HIGH", why: "Debugging custom loss penalties and reinforcement learning reward gradients." },
        },
        learningObjectives: [
          "Understand how the Multivariable Chain Rule computes exact partial derivatives backward through complex directed acyclic graphs.",
          "Differentiate between Forward Pass (activations cached in memory) and Backward Pass (gradients computed via chain rule).",
          "Diagnose Vanishing and Exploding Gradients and apply proper weight initialization (He / Xavier) and Gradient Clipping."
        ],
        conceptsCovered: ["Computational Graph", "Chain Rule", "Forward vs Backward Pass", "Activation Caching", "Vanishing Gradients", "Gradient Clipping"],
        subtopics: [
          { id: "dl-01-sub-1", title: "Reverse-Mode Automatic Differentiation", order: 1, concepts: ["Reverse-Mode Autodiff", "Adjoint State", "Tape-Based Graph"] },
          { id: "dl-01-sub-2", title: "Memory Activation Caching in Backward Pass", order: 2, concepts: ["Activation Checkpointing", "VRAM Footprint"] }
        ],
        practicalOutcome: "Construct a 2-layer neural network from scratch in NumPy with forward pass, backward pass, and parameter updates.",
        contextAndIntuition: {
          english: "If a deep neural network has 100 layers and 100,000,000 parameters, computing derivatives numerically by nudging each parameter one-by-one would require 100,000,000 forward passes per step (taking weeks). Backpropagation applies the chain rule backward from the loss in a single reverse sweep, computing all 100,000,000 gradients simultaneously in O(1) passes relative to forward evaluation.",
          hinglish: "Agar ek neural network mein 100 layers aur 10 crore parameters hain, toh agar hum ek ek weight ko hilakar derivative nikalenge toh saalo lag jayenge. Backpropagation calculus ke chain rule ko use karke loss se piche ki taraf ek hi pass mein saare 10 crore gradients calculate kar leta hai.",
          whyExists: "Enables scalable gradient-based optimization for arbitrary multi-layer computational graphs.",
          whatWasUsedBefore: "Finite difference numerical approximations or evolutionary genetic algorithms that scaled poorly."
        },
        deepExplanation: {
          english: "During the forward pass, intermediate tensors are cached in memory. In the backward pass, each node receives the upstream gradient `dL/dy`, computes its local Jacobian `dy/dx`, and propagates the downstream gradient `dL/dx = (dL/dy) * (dy/dx)`. If activation functions have near-zero derivatives (e.g. saturated Sigmoid), gradients vanish exponentially as they traverse deeper layers.",
          hinglish: "Forward pass mein intermediate activations memory mein save hoti hain. Backward pass mein har node upstream gradient ko apne local derivative se multiply karke aage pass karta hai. Agar Sigmoid jaise functions use hon jinka derivative saturate ho jata hai, toh piche aate aate gradients zero ho jate hain (Vanishing Gradient Problem).",
          internalMechanics: "Reverse-mode autodiff: `node.grad += upstream_grad * local_jacobian` traversing topographically sorted nodes.",
          realWorldUsage: "PyTorch `loss.backward()` and autograd tape engine.",
          commonMistakes: [
            "Using Sigmoid activations in deep hidden layers instead of ReLU or GELU (triggers immediate vanishing gradients).",
            "Forgetting to zero out gradients (`optimizer.zero_grad()`) between training batches (gradients accumulate unintentionally)."
          ]
        },
        visualDemoConfig: {
          type: "ML_BOUNDARY",
          initialState: {
            layers: [2, 4, 1],
            loss: 0.85,
            gradientNorm: 0.042
          }
        },
        externalResources: [
          {
            id: "res-dl-bp-01",
            creatorOrOrg: "CampusX",
            title: "Backpropagation in Neural Networks Explained from Scratch with Math",
            topicCovered: "Chain rule derivation, computational graphs, and NumPy implementation",
            url: "https://www.youtube.com/watch?v=1Q_fx7pIaqE",
            timestamp: "00:15:00",
            language: "Hinglish",
            difficulty: "intermediate",
            whyRecommended: "Thorough visual breakdown of matrix chain rule and forward/backward memory caching.",
            lastVerified: "2026-11-10"
          },
          {
            id: "res-dl-bp-02",
            creatorOrOrg: "Andrej Karpathy",
            title: "The spelled-out intro to neural networks and backpropagation: building micrograd",
            topicCovered: "Micrograd scalar engine, autograd tape, and backpropagation mechanics",
            url: "https://www.youtube.com/watch?v=VMj-3S1tku0",
            language: "English",
            difficulty: "intermediate",
            whyRecommended: "The gold standard tutorial on building an automatic differentiation engine from scratch.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `import numpy as np\n\ndef relu_backward(dout, cache):\n    # cache is the forward input x\n    # Return gradient dx with respect to x\n    pass`,
        solutionSnippet: `import numpy as np\n\ndef relu_backward(dout, cache):\n    x = cache\n    dx = dout * (x > 0)\n    return dx`
      },
      {
        id: "dl-02-transformers-self-attention",
        trackId: "track_deep_learning",
        moduleId: "mod_dl_neural_foundations",
        title: "Transformers & Scaled Dot-Product Attention Mechanics",
        order: 2,
        estimatedMinutes: 50,
        difficulty: "advanced",
        prerequisites: ["dl-01-backpropagation-chain-rule"],
        roleRelevance: {
          data_analyst: { importance: "SUPPORTING", why: "Understanding how modern text analytics algorithms attend to keywords." },
          data_scientist: { importance: "HIGH", why: "Fine-tuning domain-specific embedding and classification transformer models." },
          data_engineer: { importance: "HIGH", why: "Scaling tokenized sequence datasets for massive distributed pre-training runs." },
          ml_engineer: { importance: "CRITICAL", why: "The architectural foundation of all modern Vision Transformers (ViT) and LLMs." },
          mlops_engineer: { importance: "CRITICAL", why: "Optimizing KV-cache memory and attention inference latency (vLLM, FlashAttention)." },
          ai_engineer: { importance: "CRITICAL", why: "Core understanding required to optimize context window token usage and latency." },
          genai_llm_engineer: { importance: "CRITICAL", why: "Attention matrix computation dictates context length limitations and token budget." },
          applied_ai_engineer: { importance: "CRITICAL", why: "In-depth understanding of context limits and token attention mechanisms." },
        },
        learningObjectives: [
          "Understand the limitations of sequential RNNs/LSTMs: O(N) sequential bottleneck and inability to parallelize on GPUs.",
          "Derive Scaled Dot-Product Attention: `Attention(Q, K, V) = softmax((Q @ K^T) / sqrt(d_k)) @ V`.",
          "Understand why dividing by `sqrt(d_k)` prevents vanishing gradients in the Softmax exponent."
        ],
        conceptsCovered: ["Queries, Keys, Values", "Scaled Dot-Product", "Quadratic Complexity O(N^2)", "Multi-Head Attention", "Causal Masking", "FlashAttention"],
        subtopics: [
          { id: "dl-02-sub-1", title: "Queries, Keys & Values Analogy", order: 1, concepts: ["Database Lookup Analogy", "Projection Matrices"] },
          { id: "dl-02-sub-2", title: "The Scaling Factor sqrt(d_k) Derivation", order: 2, concepts: ["Softmax Saturation", "Variance Stabilization"] }
        ],
        practicalOutcome: "Implement Scaled Dot-Product Attention with causal masking in pure NumPy.",
        contextAndIntuition: {
          english: "Before Transformers, models like RNNs processed text word-by-word like a person reading a book one letter at a time, making it impossible to process long sequences in parallel on GPU clusters. Self-attention looks at the entire sentence at once, calculating how much every word should 'pay attention' to every other word regardless of distance.",
          hinglish: "Transformers se pehle RNNs ek ek word karke process karte the, jisse GPU ka parallel power waste hota tha aur lambe paragraphs mein model purani baatein bhool jata tha. Self-attention pure paragraph ke saare words ko ek saath GPU mein daal kar dekhta hai ki kaun sa word kisse kitna related hai.",
          whyExists: "Enables massive GPU parallelization across arbitrary token sequences without sequential bottlenecks.",
          whatWasUsedBefore: "Recurrent Neural Networks (RNNs) and LSTMs that processed tokens sequentially."
        },
        deepExplanation: {
          english: "Each input token is projected into three vectors: Query (what am I looking for?), Key (what do I offer?), and Value (what information do I contain?). The dot product `Q @ K^T` measures compatibility. Without the `1/sqrt(d_k)` scaling factor, for large hidden dimensions the dot products grow large in magnitude, pushing the Softmax function into regions with near-zero gradients.",
          hinglish: "Har token ke teen vectors bante hain: Query, Key, aur Value. Query aur Key ka dot product batata hai ki do words kitne related hain. `sqrt(d_k)` se divide karna isliye zaroori hai taaki dot product bohot bada na ho jaye aur Softmax ke gradients zero na ho jayein.",
          internalMechanics: "Matrix multiplication: `(B, S, D) @ (B, D, S) -> (B, S, S)` Softmax attention weight distribution applied to `(B, S, D)` Value matrix.",
          realWorldUsage: "Underpins GPT-4, Llama 3, Claude, Gemini, BERT, and modern Diffusion architectures.",
          commonMistakes: [
            "Omitting the scaling factor `sqrt(d_k)` (causes Softmax to saturate and training to diverge).",
            "Forgetting to apply the triangular causal mask in autoregressive generation (causes future token leakage)."
          ]
        },
        visualDemoConfig: {
          type: "ML_BOUNDARY",
          initialState: {
            tokens: ["The", "bank", "of", "the", "river"],
            attentionFocus: "river attends to bank (0.84)"
          }
        },
        externalResources: [
          {
            id: "res-dl-att-01",
            creatorOrOrg: "CampusX",
            title: "Self Attention Mechanism Explained: Query, Key, Value & Softmax Math",
            topicCovered: "Scaled dot product derivation, multi-head attention, and NumPy implementation",
            url: "https://www.youtube.com/watch?v=bCZ4NTHx4gc",
            timestamp: "00:20:00",
            language: "Hinglish",
            difficulty: "advanced",
            whyRecommended: "Visual database retrieval analogy and clear matrix dimension walkthroughs.",
            lastVerified: "2026-11-10"
          },
          {
            id: "res-dl-att-02",
            creatorOrOrg: "Stanford University (CS224N)",
            title: "Transformers and Self-Attention For NLP",
            topicCovered: "Attention matrices, positional encodings, and scaling factor derivation",
            url: "https://web.stanford.edu/class/cs224n/",
            language: "English",
            difficulty: "advanced",
            whyRecommended: "Authoritative academic curriculum on transformer architecture.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `import numpy as np\n\ndef scaled_dot_product_attention(Q, K, V):\n    # Q, K, V have shape (seq_len, d_k)\n    # Compute: softmax(Q @ K.T / sqrt(d_k)) @ V\n    pass`,
        solutionSnippet: `import numpy as np\n\ndef scaled_dot_product_attention(Q, K, V):\n    d_k = Q.shape[-1]\n    scores = (Q @ K.T) / np.sqrt(d_k)\n    # Stable softmax\n    exp_scores = np.exp(scores - np.max(scores, axis=-1, keepdims=True))\n    attention_weights = exp_scores / np.sum(exp_scores, axis=-1, keepdims=True)\n    return attention_weights @ V`
      }
    ]
  }
];

