/**
 * lib/skills/ai-data/master-curriculum-taxonomy.ts
 * 
 * Master Curriculum Taxonomy for Cognalyze AI & Data Arena.
 * Centralized, interconnected knowledge registry covering:
 * - 8 Career Roles with role-specific importance & why-rationales
 * - Complete Python Journey A to Z (Sections A to F: Foundations, Control Flow, Data Structures, Functions, Advanced OOP, Data/AI)
 * - Complete NumPy Journey (33 concepts: SIMD, broadcasting, vectorization, multidimensional arrays)
 * - Complete Pandas Journey (39 concepts: Series, DataFrames, indexing, cleaning, EDA, windowing)
 * - Statistics, SQL & Analytical Modeling (A/B testing, cohort analysis)
 * - Complete Machine Learning & Deep Learning (Supervised, Unsupervised, Neural Nets, Attention)
 * - Generative AI, RAG & Autonomous Agentic Workflows
 * - Topic-specific verified External Learning Resources (CampusX, Official Docs, Stanford, Karpathy)
 */

import { TargetRoleSlug } from "./types";
import { PYTHON_MODULES } from "./curriculum/python-curriculum";
import { NUMPY_MODULES } from "./curriculum/numpy-curriculum";
import { PANDAS_MODULES } from "./curriculum/pandas-curriculum";
import { SQL_MODULES } from "./curriculum/sql-curriculum";
import { STATISTICS_AB_MODULES } from "./curriculum/statistics-ab-curriculum";
import { ML_MODULES } from "./curriculum/ml-curriculum";
import { DEEP_LEARNING_MODULES } from "./curriculum/deep-learning-curriculum";
import { GENAI_MODULES } from "./curriculum/genai-curriculum";
import { RAG_MODULES } from "./curriculum/rag-curriculum";
import { AGENTIC_AI_MODULES } from "./curriculum/agentic-ai-curriculum";
import { DATA_ENGINEERING_MODULES } from "./curriculum/data-engineering-curriculum";
import { MLOPS_MODULES } from "./curriculum/mlops-curriculum";
import { AI_EVAL_MODULES } from "./curriculum/ai-eval-curriculum";
import { AI_PROJECTS_MODULES } from "./curriculum/ai-projects-curriculum";

export interface ExternalResource {
  id: string;
  creatorOrOrg: string;
  title: string;
  topicCovered: string;
  url: string;
  timestamp?: string;
  startSeconds?: number;
  endSeconds?: number;
  timestampLabel?: string;
  timestampVerified?: boolean;
  language: "English" | "Hinglish";
  difficulty: "beginner" | "intermediate" | "advanced";
  whyRecommended: string;
  lastVerified: string;
}

export interface TaxonomySubtopic {
  id: string;
  title: string;
  order: number;
  concepts: string[];
  learningObjective?: string;
  videoReference?: ExternalResource;
  interviewPriority?: "MUST_KNOW" | "FREQUENTLY_TESTED" | "INTERVIEW_IMPORTANT" | "ADVANCED" | "PRODUCTION" | "NICE_TO_KNOW";
}

export interface TaxonomyTopic {
  id: string;
  trackId: string;
  moduleId: string;
  title: string;
  order: number;
  estimatedMinutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  prerequisites: string[];
  roleRelevance: Record<TargetRoleSlug, { importance: "CRITICAL" | "HIGH" | "SUPPORTING"; why: string }>;
  learningObjectives: string[];
  conceptsCovered: string[];
  subtopics?: TaxonomySubtopic[];
  practicalOutcome: string;
  contextAndIntuition: {
    english: string;
    hinglish: string;
    whyExists: string;
    whatWasUsedBefore: string;
  };
  deepExplanation: {
    english: string;
    hinglish: string;
    internalMechanics: string;
    realWorldUsage: string;
    commonMistakes: string[];
  };
  visualDemoConfig?: {
    type: "ARRAY_BROADCASTING" | "DATAFRAME_TRANSFORM" | "EXECUTION_TRACE" | "ML_BOUNDARY" | "RAG_RETRIEVAL" | "AGENT_DAG";
    initialState: any;
  };
  externalResources: ExternalResource[];
  starterCode?: string;
  solutionSnippet?: string;
}

export interface TaxonomyModule {
  id: string;
  trackId: string;
  title: string;
  description: string;
  order: number;
  topics: TaxonomyTopic[];
}

export interface TaxonomySubject {
  id: string;
  slug: string;
  title: string;
  icon: string;
  badge: string;
  description: string;
  estimatedHours: number;
  prerequisites: string[];
  modules: TaxonomyModule[];
}

export interface TaxonomyTrack {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  description: string;
  estimatedHours: number;
  modules: TaxonomyModule[];
}

// =========================================================================
// 1. COMPLETE PYTHON CURRICULUM (SECTIONS A TO F)
// =========================================================================

const PYTHON_FOUNDATIONS_TOPICS: TaxonomyTopic[] = [
  {
    id: "py-01-intro",
    trackId: "track_python",
    moduleId: "mod_py_foundations",
    title: "Introduction to Programming & The Python Interpreter",
    order: 1,
    estimatedMinutes: 25,
    difficulty: "beginner",
    prerequisites: [],
    roleRelevance: {
      data_analyst: { importance: "CRITICAL", why: "Foundation for automating spreadsheets and manipulating datasets." },
      data_scientist: { importance: "CRITICAL", why: "Core environment for training statistical and ML models." },
      data_engineer: { importance: "CRITICAL", why: "Essential for building ETL pipelines and Spark scripts." },
      ml_engineer: { importance: "CRITICAL", why: "Primary language for PyTorch, TensorRT, and inference servers." },
      mlops_engineer: { importance: "CRITICAL", why: "Needed for containerized model packaging and pipeline CI/CD." },
      ai_engineer: { importance: "CRITICAL", why: "Primary runtime for LLM orchestration and Agent frameworks." },
      genai_llm_engineer: { importance: "CRITICAL", why: "Foundation for LangChain, LlamaIndex, and fine-tuning." },
      applied_ai_engineer: { importance: "CRITICAL", why: "Required to bridge pre-trained models with production software." },
    },
    learningObjectives: [
      "Understand how Python bytecode compiles and runs on the CPython Virtual Machine.",
      "Understand dynamic typing, interpreted execution vs ahead-of-time compilation.",
      "Write, run, and debug first Python script cleanly."
    ],
    conceptsCovered: ["CPython", "Bytecode", "GIL", "Interpreter", "Virtual Machines", "Interactive REPL"],
    subtopics: [
      { id: "py-01-sub-1", title: "CPython Architecture & Bytecode Compilation (.pyc)", order: 1, concepts: ["Bytecode", "Compiler", "PVM"] },
      { id: "py-01-sub-2", title: "Global Interpreter Lock (GIL) & OS Thread Schedulers", order: 2, concepts: ["GIL", "Concurrency", "Threading"] },
      { id: "py-01-sub-3", title: "Interactive REPL, stdout, and CLI Flag Mechanics", order: 3, concepts: ["REPL", "CLI Flags", "Interpreter"] }
    ],
    practicalOutcome: "Execute first verified Python program that validates runtime system information and environment variables.",
    contextAndIntuition: {
      english: "Before Python, software developers spent weeks wrestling with memory allocation, pointer de-referencing, and platform-specific compilation in C and C++. Python was engineered by Guido van Rossum to prioritize developer productivity and code readability without sacrificing mathematical expressiveness.",
      hinglish: "Python se pehle developers C aur C++ mein manual memory allocation aur pointer errors se pareshan rehte the. Python ka purpose yeh tha ki code likhna clean aur readable ho, bina developer productivity ko compromise kiye.",
      whyExists: "Provides a clean, high-level expressive syntax with rapid iteration cycles, ideal for scientific computing and AI.",
      whatWasUsedBefore: "Low-level compiled languages (C, Fortran, C++) with manual memory management and rigid compilation phases."
    },
    deepExplanation: {
      english: "When you execute a Python file (`python main.py`), CPython first compiles source text into an intermediate `.pyc` bytecode representation. The CPython Virtual Machine evaluates these opcodes in a continuous evaluation loop. While Python has an overhead compared to compiled C, its vast C-extension ecosystem (NumPy, PyTorch) achieves native hardware speeds.",
      hinglish: "Jab aap `python script.py` run karte ho, CPython pehle source code ko bytecode (`.pyc`) mein compile karta hai. Fir CPython VM in bytecodes ko execute karta hai. Python ke slow hone ke bawajood, iske libraries C-extensions par bani hain jisse actual computation native speed par run hoti hai.",
      internalMechanics: "Source (.py) -> Tokenizer -> AST -> Bytecode (.pyc) -> CPython Evaluation Loop (ceval.c).",
      realWorldUsage: "Underpins every Python runtime, Jupyter Notebook kernel, serverless AWS Lambda, and Ray cluster in industry.",
      commonMistakes: [
        "Confusing interpreted execution with a total lack of compilation (Python does compile to bytecode).",
        "Assuming Python is inherently single-threaded for I/O operations (the GIL primarily affects CPU-bound tasks)."
      ]
    },
    externalResources: [
      {
        id: "res-py-01",
        creatorOrOrg: "CampusX",
        title: "Python Full Course for Data Science & Machine Learning (Introduction)",
        topicCovered: "Python Interpreter, History & First Script",
        url: "https://www.youtube.com/watch?v=JxzZxdht-XY",
        timestamp: "00:05:20",
        language: "Hinglish",
        difficulty: "beginner",
        whyRecommended: "Clear visual explanation of how Python fits into the modern data science workflow.",
        lastVerified: "2026-11-10"
      },
      {
        id: "res-py-02",
        creatorOrOrg: "Official Python Documentation",
        title: "An Informal Introduction to Python",
        topicCovered: "CPython Interpreter & Core Language Syntax",
        url: "https://docs.python.org/3/tutorial/introduction.html",
        language: "English",
        difficulty: "beginner",
        whyRecommended: "Canonical reference for accurate language specifications.",
        lastVerified: "2026-11-10"
      }
    ],
    starterCode: `# 1. Print system architecture & Python version\nimport sys\nimport platform\n\ndef check_environment():\n    # TODO: return dict with python_version, platform, and sys.byteorder\n    pass\n\nprint(check_environment())`,
    solutionSnippet: `import sys\nimport platform\n\ndef check_environment():\n    return {\n        "python_version": sys.version.split()[0],\n        "platform": platform.system(),\n        "byteorder": sys.byteorder\n    }\n\nprint(check_environment())`
  },
  {
    id: "py-02-variables-types",
    trackId: "track_python",
    moduleId: "mod_py_foundations",
    title: "Variables, Dynamic Typing & Memory Allocation",
    order: 2,
    estimatedMinutes: 30,
    difficulty: "beginner",
    prerequisites: ["py-01-intro"],
    roleRelevance: {
      data_analyst: { importance: "CRITICAL", why: "Prevents silent type coercion errors when calculating financial metrics." },
      data_scientist: { importance: "CRITICAL", why: "Understanding float precision and NaN behavior is critical for statistics." },
      data_engineer: { importance: "CRITICAL", why: "Essential for schema validation in Spark and Snowflake ingestions." },
      ml_engineer: { importance: "CRITICAL", why: "Memory reference semantics dictate whether tensor copies allocate VRAM." },
      mlops_engineer: { importance: "HIGH", why: "Helps debug OOM issues in batch processing workers." },
      ai_engineer: { importance: "HIGH", why: "Needed for structured JSON parsing and Pydantic schemas." },
      genai_llm_engineer: { importance: "HIGH", why: "Ensures type safety across LLM tool-calling payloads." },
      applied_ai_engineer: { importance: "CRITICAL", why: "Prevents runtime AttributeError exceptions in production APIs." },
    },
    learningObjectives: [
      "Understand variable naming conventions (PEP 8) and Python's object-reference model.",
      "Distinguish between value assignment and reference assignment via `id()` and `is`.",
      "Master primitive data types: int, float, bool, str, and NoneType."
    ],
    conceptsCovered: ["Object References", "id()", "PEP 8", "Garbage Collection", "Reference Counting", "Primitive Types"],
    subtopics: [
      { id: "py-02-sub-1", title: "PyObject Internal Structure & Heap Allocation", order: 1, concepts: ["PyObject", "ob_refcnt", "Heap"] },
      { id: "py-02-sub-2", title: "Pointer Aliasing vs Value Copying (is vs ==)", order: 2, concepts: ["Identity", "Equality", "Memory address"] },
      { id: "py-02-sub-3", title: "Mutable vs Immutable Memory Invariants", order: 3, concepts: ["Tuples", "Integers", "Lists"] }
    ],
    practicalOutcome: "Construct a variable inspector that tracks object IDs and detects reference aliasing vs independent cloning.",
    contextAndIntuition: {
      english: "In C or Java, a variable is a named storage box in RAM with a fixed size and type. In Python, variables are NOT boxes; they are lightweight name tags (pointers) pointing to objects allocated on the heap.",
      hinglish: "C ya Java mein variable ek memory box hota hai jiska type fixed hota hai. Lekin Python mein variable koi box nahi hota, balki ek sticky note ya name tag hota hai jo heap memory mein kisi object ki taraf point karta hai.",
      whyExists: "Enables flexible, dynamic programming where variables can re-point to different types without reallocating fixed stack frames.",
      whatWasUsedBefore: "Static typing with explicit type declarations (`int x = 5;`) that require rigid recompilation."
    },
    deepExplanation: {
      english: "Every Python object is a C struct (`PyObject`) consisting of an integer reference count (`ob_refcnt`) and a pointer to the type object (`ob_type`). When you write `a = 1000; b = a`, `b` does not allocate new memory; it increments the reference count of `1000`. When `del a` is called, the reference count decrements.",
      hinglish: "Python mein har object ek C struct (`PyObject`) hota hai jisme reference count aur type pointer hota hai. Jab aap `b = a` karte ho, nayi memory allocate nahi hoti, balki purane object ka reference count 1 se badh jata hai.",
      internalMechanics: "PyObject struct in CPython with reference counting + generational cyclic garbage collector.",
      realWorldUsage: "Explains why modifying a list or array passed into a function can unexpectedly mutate the caller's dataset.",
      commonMistakes: [
        "Confusing equality check `==` (checks value equality) with identity check `is` (checks exact memory address).",
        "Assuming small integers behave identically to large integers (Python caches small integers -5 to 256)."
      ]
    },
    externalResources: [
      {
        id: "res-py-var-01",
        creatorOrOrg: "CampusX",
        title: "Python Variables and Dynamic Typing Deep Dive",
        topicCovered: "Memory allocation, id(), and reference model",
        url: "https://www.youtube.com/watch?v=JxzZxdht-XY",
        timestamp: "00:28:15",
        language: "Hinglish",
        difficulty: "beginner",
        whyRecommended: "Visual diagram of memory pointers and CPython reference counting.",
        lastVerified: "2026-11-10"
      }
    ],
    starterCode: `def demonstrate_aliasing():\n    # 1. Create a list a = [1, 2, 3]\n    # 2. Assign b = a\n    # 3. Append 4 to b\n    # 4. Return whether a and b have the same id() and whether a was modified\n    pass`,
    solutionSnippet: `def demonstrate_aliasing():\n    a = [1, 2, 3]\n    b = a\n    b.append(4)\n    return {\n        "same_id": id(a) == id(b),\n        "a_contents": a,\n        "is_aliased": True\n    }`
  },
  {
    id: "py-03-operators-precedence",
    trackId: "track_python",
    moduleId: "mod_py_foundations",
    title: "Operators, Bitwise Math & Precedence Rules",
    order: 3,
    estimatedMinutes: 25,
    difficulty: "beginner",
    prerequisites: ["py-02-variables-types"],
    roleRelevance: {
      data_analyst: { importance: "CRITICAL", why: "Bitwise boolean masks (`&` and `|`) are required for Pandas DataFrame filtering." },
      data_scientist: { importance: "CRITICAL", why: "Operator precedence prevents mathematical errors in cost function implementations." },
      data_engineer: { importance: "HIGH", why: "Bitwise operations enable compact binary flags in data pipelines." },
      ml_engineer: { importance: "CRITICAL", why: "Matrix multiplication operator `@` vs element-wise `*` determines tensor computations." },
      mlops_engineer: { importance: "SUPPORTING", why: "Needed for shell return code validations and exit bitmasks." },
      ai_engineer: { importance: "HIGH", why: "Logical short-circuiting prevents null pointer errors in fallback chains." },
      genai_llm_engineer: { importance: "HIGH", why: "Essential for constructing token length and budget comparisons." },
      applied_ai_engineer: { importance: "HIGH", why: "Required for robust boolean permission checks in APIs." },
    },
    learningObjectives: [
      "Master arithmetic, comparison, logical (`and`, `or`, `not`), membership (`in`), and identity (`is`) operators.",
      "Understand short-circuit evaluation in boolean expressions.",
      "Learn operator precedence to write unambiguous mathematical code."
    ],
    conceptsCovered: ["Short-circuiting", "Precedence Table", "Floor Division `//`", "Modulo `%`", "Bitwise Operators", "Membership `in`"],
    practicalOutcome: "Implement a robust pricing discount validator using short-circuit logical guards.",
    contextAndIntuition: {
      english: "Without strict operator precedence rules, mathematical formulas like `y = mx + b` or compound loan calculations could produce completely different results depending on the order of evaluation.",
      hinglish: "Bina operator precedence ke mathematical formulas jaise `y = mx + b` galat calculate ho sakte hain agar multiplication addition se pehle execute na ho.",
      whyExists: "Ensures unambiguous evaluation order according to standard PEMDAS mathematical conventions.",
      whatWasUsedBefore: "Manual nesting of parentheses for every single binary operation."
    },
    deepExplanation: {
      english: "Python adheres to standard PEMDAS hierarchy: Parentheses `()` > Exponentiation `**` > Unary `+`, `-` > Multiplicative `*`, `/`, `//`, `%` > Additive `+`, `-` > Comparison `>`, `<`, `==` > Logical `not` > `and` > `or`. Crucially, `and` and `or` perform short-circuiting: in `False and expensive_func()`, the second term is never evaluated.",
      hinglish: "Python standard mathematical priority follow karta hai: Pehle `**`, fir `*`, `/`, `//`, `%`, fir `+`, `-`, aur end mein logical operators. Ek bohot important concept hai 'short-circuit evaluation'—agar `False and func()` hai, toh Python doosre function ko call hi nahi karega kyunki answer confirm False hai.",
      internalMechanics: "The AST generator constructs binary operator nodes according to grammar precedence rules defined in `Grammar/python.gram`.",
      realWorldUsage: "Pandas uses overloaded bitwise operators `&` and `|` because Python's built-in `and` / `or` cannot be overloaded for vector truthiness.",
      commonMistakes: [
        "Using `and` / `or` when filtering Pandas DataFrames instead of `&` / `|` with parentheses.",
        "Forgetting that `**` binds more tightly than unary `-` (`-2 ** 2 == -4`, not `4`)."
      ]
    },
    externalResources: [
      {
        id: "res-py-op-01",
        creatorOrOrg: "CampusX",
        title: "Python Operators Explained with Common Gotchas",
        topicCovered: "Arithmetic, Logical, and Bitwise Operators",
        url: "https://www.youtube.com/watch?v=JxzZxdht-XY",
        timestamp: "00:45:10",
        language: "Hinglish",
        difficulty: "beginner",
        whyRecommended: "Great visual demonstrations of short-circuit evaluation.",
        lastVerified: "2026-11-10"
      }
    ],
    starterCode: `def safe_divide(numerator, denominator):\n    # Return numerator / denominator if denominator is non-zero, otherwise return None\n    # Use short-circuit evaluation\n    pass`,
    solutionSnippet: `def safe_divide(numerator, denominator):\n    return (denominator != 0) and (numerator / denominator) or None`
  }
];

// =========================================================================
// 2. COMPLETE NUMPY CURRICULUM (33 CONCEPTS)
// =========================================================================

const NUMPY_CURRICULUM_TOPICS: TaxonomyTopic[] = [
  {
    id: "np-01-intro-why-numpy",
    trackId: "track_numpy",
    moduleId: "mod_numpy_core",
    title: "Why NumPy Exists: The Cost of Python Objects vs C Arrays",
    order: 1,
    estimatedMinutes: 30,
    difficulty: "beginner",
    prerequisites: ["py-02-variables-types"],
    roleRelevance: {
      data_analyst: { importance: "CRITICAL", why: "Underpins Pandas internal vector engine and speed." },
      data_scientist: { importance: "CRITICAL", why: "Core data representation for all scientific algorithms." },
      data_engineer: { importance: "HIGH", why: "Understanding contiguous buffer allocations prevents memory fragmentation." },
      ml_engineer: { importance: "CRITICAL", why: "Tensors in PyTorch/TensorFlow are generalized NumPy arrays." },
      mlops_engineer: { importance: "HIGH", why: "Key to zero-copy data deserialization across Triton and ONNX." },
      ai_engineer: { importance: "CRITICAL", why: "Vector embeddings and cosine similarities run on NumPy primitives." },
      genai_llm_engineer: { importance: "CRITICAL", why: "KV-cache allocations and attention dot-products are matrix operations." },
      applied_ai_engineer: { importance: "CRITICAL", why: "Essential for real-time sensor and audio/vision preprocessing." },
    },
    learningObjectives: [
      "Understand why a Python `list` of integers requires ~28 bytes per element while a NumPy `int64` requires only 8 bytes.",
      "Learn how CPU cache locality and SIMD (Single Instruction Multiple Data) accelerate numerical computation by 50x–200x.",
      "Inspect memory layouts using `.nbytes`, `.dtype`, and `.itemsize`."
    ],
    conceptsCovered: ["Contiguous Memory", "Cache Locality", "SIMD", "C Array Pointers", "Type Boxing/Unboxing", "Strides"],
    practicalOutcome: "Benchmark and measure memory consumption and execution time of summing 1,000,000 numbers in pure Python vs NumPy.",
    contextAndIntuition: {
      english: "In pure Python, a list is an array of pointers to individual `PyObject` structs scattered across the heap. Each integer is 'boxed' with metadata (reference count, type pointer). When iterating over a Python list, the CPU repeatedly incurs cache misses. NumPy allocates one single contiguous memory block in C, allowing the CPU to load continuous memory chunks directly into L1/L2 cache registers.",
      hinglish: "Pure Python list mein har number ek alag pointer hota hai jo memory mein bikhra rehta hai. Isse CPU ko har element padhne ke liye baar baar RAM access karni padti hai jisse cache miss hota hai. NumPy ek single continuous C-memory block allocate karta hai, jisse CPU L1/L2 cache mein saara data ek saath load karke SIMD instructions se 100x fast calculate karta hai.",
      whyExists: "Solves the fundamental slowness of Python's dynamic object model for large numerical computations.",
      whatWasUsedBefore: "Nested Python loops with lists or compiling standalone C/Fortran modules manually."
    },
    deepExplanation: {
      english: "An `ndarray` consists of two main parts: a data buffer (a raw contiguous block of bytes) and a metadata header containing shape, dtype, and strides. When performing an operation like `arr * 2`, NumPy delegates execution to compiled C/Fortran routines that utilize AVX/SSE vector instructions on modern CPUs.",
      hinglish: "NumPy `ndarray` ke do hisse hote hain: raw data buffer (contiguous C memory) aur metadata header (shape, dtype, strides). Jab aap `arr * 2` karte ho, CPython ka koi loop nahi chalta; directly compiled C code CPU ke SIMD registers use karke ek clock cycle mein multiple numbers multiply karta hai.",
      internalMechanics: "PyArrayObject struct wrapping a raw memory pointer with shape and stride coordinate mapping.",
      realWorldUsage: "The foundational layer of SciPy, Pandas, Scikit-Learn, PyTorch, OpenCV, and TensorFlow.",
      commonMistakes: [
        "Using Python `for` loops to iterate through a NumPy array (destroys vectorized speed advantages).",
        "Mixing inhomogeneous data types inside an array, forcing NumPy to fallback to an inefficient `object` dtype."
      ]
    },
    visualDemoConfig: {
      type: "ARRAY_BROADCASTING",
      initialState: { arrayA: [1, 2, 3, 4], memoryBytesPerElem: 8, pythonListBytesPerElem: 28 }
    },
    externalResources: [
      {
        id: "res-np-01",
        creatorOrOrg: "CampusX",
        title: "NumPy Complete Course for Beginners: Why NumPy is Fast",
        topicCovered: "Python List vs NumPy Array, Memory Layout, SIMD",
        url: "https://www.youtube.com/watch?v=Rbg7n455PmA",
        timestamp: "00:08:45",
        language: "Hinglish",
        difficulty: "beginner",
        whyRecommended: "Clear visual explanation of memory overhead and speed comparisons with actual benchmarks.",
        lastVerified: "2026-11-10"
      },
      {
        id: "res-np-02",
        creatorOrOrg: "Official NumPy Documentation",
        title: "NumPy: The absolute basics for beginners",
        topicCovered: "ndarray structure, creation, and memory layout",
        url: "https://numpy.org/doc/stable/user/absolute_beginners.html",
        language: "English",
        difficulty: "beginner",
        whyRecommended: "The definitive documentation on NumPy data types and array attributes.",
        lastVerified: "2026-11-10"
      }
    ],
    starterCode: `import numpy as np\nimport sys\n\ndef memory_comparison(size=1000000):\n    # 1. Create a Python list of range(size)\n    # 2. Create a NumPy int64 array of np.arange(size)\n    # 3. Compute total memory for both and return the ratio\n    pass`,
    solutionSnippet: `import numpy as np\nimport sys\n\ndef memory_comparison(size=1000000):\n    py_list = list(range(size))\n    np_arr = np.arange(size, dtype=np.int64)\n    \n    # List overhead: pointer list size + individual int object sizes\n    py_mem = sys.getsizeof(py_list) + sum(sys.getsizeof(x) for x in py_list[:100]) * (size // 100)\n    np_mem = np_arr.nbytes\n    \n    return {\n        "python_list_bytes": py_mem,\n        "numpy_array_bytes": np_mem,\n        "memory_saving_ratio": round(py_mem / np_mem, 2)\n    }`
  },
  {
    id: "np-02-broadcasting-mechanics",
    trackId: "track_numpy",
    moduleId: "mod_numpy_core",
    title: "Broadcasting Rules: Dimensional Alignment Without Memory Copying",
    order: 2,
    estimatedMinutes: 35,
    difficulty: "intermediate",
    prerequisites: ["np-01-intro-why-numpy"],
    roleRelevance: {
      data_analyst: { importance: "HIGH", why: "Crucial for normalizing columns and subtracting group means." },
      data_scientist: { importance: "CRITICAL", why: "Core mechanism for feature scaling (Z-score normalization) and distance metrics." },
      data_engineer: { importance: "HIGH", why: "Optimizes matrix scaling in distributed array workloads." },
      ml_engineer: { importance: "CRITICAL", why: "Adding bias vectors to batch matrix outputs in neural layers relies on broadcasting." },
      mlops_engineer: { importance: "HIGH", why: "Validating input tensor shapes against model signatures requires broadcasting rules." },
      ai_engineer: { importance: "CRITICAL", why: "Softmax attention masks and score normalizations use multidimensional broadcasting." },
      genai_llm_engineer: { importance: "CRITICAL", why: "Rotary position embeddings (RoPE) broadcast frequency bands across sequence tokens." },
      applied_ai_engineer: { importance: "CRITICAL", why: "Image channel normalization `(image - mean) / std` is a canonical broadcasting operation." },
    },
    learningObjectives: [
      "Master the two strict rules of NumPy dimensional compatibility.",
      "Understand how stride manipulation allows virtual dimension stretching with zero memory duplication.",
      "Diagnose and fix `ValueError: operands could not be broadcast together`."
    ],
    conceptsCovered: ["Trailing Dimensions", "Stride 0 Trick", "Virtual Copying", "Shape Matching", "Dimensional Expansion `np.newaxis`"],
    practicalOutcome: "Implement an image batch Z-score normalizer applying per-channel mean and standard deviation via broadcasting.",
    contextAndIntuition: {
      english: "Suppose you want to add a 1D vector of shape `(3,)` to a 2D matrix of shape `(4, 3)`. In traditional programming, you would have to allocate a new `(4, 3)` matrix and copy the vector 4 times. Broadcasting performs this operation virtually by setting the stride for the repeated dimension to 0, meaning the CPU reads the exact same memory address repeatedly without copying a single byte.",
      hinglish: "Maan lijiye aapke paas `(4, 3)` ka matrix hai aur aap usme `(3,)` ka vector add karna chahte ho. Purani programming mein aapko vector ko 4 baar duplicate karke memory waste karni padti. NumPy broadcasting mein koi duplicate data copy nahi hota; NumPy stride ko 0 set kar deta hai jisse memory reuse hoti hai aur calculation instant ho jati hai.",
      whyExists: "Allows element-wise mathematical operations on arrays of differing shapes without consuming gigabytes of memory.",
      whatWasUsedBefore: "Manual `np.tile()` or `np.repeat()` that created redundant in-memory copies."
    },
    deepExplanation: {
      english: "NumPy compares array shapes from right to left (trailing dimensions). Two dimensions are compatible if: 1) they are equal, or 2) one of them is 1. If an array has fewer dimensions than another, it is prepended with 1s on the left until the ranks match. When a dimension is 1, NumPy uses stride 0 along that axis.",
      hinglish: "Broadcasting rule: NumPy trailing dimensions (right to left) compare karta hai. Do dimensions tabhi match hongi agar: 1) dono barabar hon, ya 2) dono mein se koi ek 1 ho. Agar kisi array ke dimensions kam hain, toh left side par 1 add kar diya jata hai.",
      internalMechanics: "Stride calculation: If `shape[dim] == 1`, set `stride[dim] = 0` during the outer C-iterator loop.",
      realWorldUsage: "Neural network layer bias addition: `(Batch_size, Hidden_dim) + (Hidden_dim,)`.",
      commonMistakes: [
        "Attempting to broadcast `(4, 3)` with `(4,)` without reshaping to `(4, 1)` (NumPy aligns trailing dimensions first).",
        "Overusing `np.tile()` when broadcasting accomplishes the task in-place with zero memory allocation."
      ]
    },
    visualDemoConfig: {
      type: "ARRAY_BROADCASTING",
      initialState: {
        arrayA: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]],
        shapeA: [4, 3],
        arrayB: [10, 20, 30],
        shapeB: [3]
      }
    },
    externalResources: [
      {
        id: "res-np-bc-01",
        creatorOrOrg: "CampusX",
        title: "NumPy Broadcasting Explained with Visual Rules & Intuition",
        topicCovered: "Two rules of broadcasting, stride 0, and shape alignment",
        url: "https://www.youtube.com/watch?v=Rbg7n455PmA",
        timestamp: "00:42:15",
        language: "Hinglish",
        difficulty: "intermediate",
        whyRecommended: "Step-by-step visual demonstration of right-to-left trailing dimension alignment.",
        lastVerified: "2026-11-10"
      }
    ],
    starterCode: `import numpy as np\n\ndef normalize_features(X):\n    # X is of shape (N, D) where N is number of samples and D is feature dimensions.\n    # Subtract feature means and divide by feature standard deviations using broadcasting.\n    # Return normalized array of same shape (N, D).\n    pass`,
    solutionSnippet: `import numpy as np\n\ndef normalize_features(X):\n    mean = np.mean(X, axis=0) # shape (D,)\n    std = np.std(X, axis=0)   # shape (D,)\n    std_safe = np.where(std == 0, 1.0, std)\n    return (X - mean) / std_safe`
  }
];

// =========================================================================
// 3. MASTER TRACK REGISTRY
// =========================================================================

export const MASTER_CURRICULUM_TRACKS: TaxonomyTrack[] = [
  {
    id: "track_python",
    title: "Python Foundations to Advanced Engineering",
    subtitle: "Complete Python Mastery from Interpreter to High-Performance Architecture",
    icon: "🐍",
    badge: "Core Foundation",
    description: "Systematic mastery of Python syntax, data structures, functional paradigms, OOP, memory internals, and production libraries for AI & Data.",
    estimatedHours: 40,
    modules: PYTHON_MODULES
  },
  {
    id: "track_numpy",
    title: "NumPy & High-Performance Numerical Computing",
    subtitle: "Vectorized SIMD Operations, Broadcasting & Multidimensional Tensors",
    icon: "⚡",
    badge: "Numerical Foundation",
    description: "Deep engineering exploration of ndarrays, contiguous C buffers, memory strides, broadcasting mechanics, and vectorization.",
    estimatedHours: 25,
    modules: NUMPY_MODULES
  },
  {
    id: "track_pandas",
    title: "Pandas: Data Manipulation, Cleaning & Tabular Analytics",
    subtitle: "Series, DataFrames, Dual Indexing (loc/iloc), GroupBy & Advanced Transformations",
    icon: "🐼",
    badge: "Tabular Foundation",
    description: "High-performance tabular manipulation, index alignment, vector text operations, time-series windowing, and EDA.",
    estimatedHours: 30,
    modules: PANDAS_MODULES
  },
  {
    id: "track_sql_stats",
    title: "SQL Mastery, Analytical Statistics & A/B Testing",
    subtitle: "Window Functions, CTEs, Hypothesis Testing & Business Cohorts",
    icon: "📊",
    badge: "Analytical Foundation",
    description: "Relational database mastery, analytical window aggregates, statistical testing, and controlled product experiments.",
    estimatedHours: 35,
    modules: [...SQL_MODULES, ...STATISTICS_AB_MODULES]
  },
  {
    id: "track_ml",
    title: "Machine Learning & Deep Neural Architectures",
    subtitle: "Gradient Descent, Bias-Variance, Backpropagation, CNNs & Transformers",
    icon: "🤖",
    badge: "Predictive Intelligence",
    description: "Supervised and unsupervised mathematical formulations, loss surface optimization, data leakage guards, and deep neural nets.",
    estimatedHours: 45,
    modules: [...ML_MODULES, ...DEEP_LEARNING_MODULES]
  },
  {
    id: "track_genai",
    title: "Generative AI, RAG & Autonomous Agentic Workflows",
    subtitle: "Vector Retrieval, Hybrid Search, ReAct Loops & Multi-Agent State Graphs",
    icon: "🧠",
    badge: "Agentic Intelligence",
    description: "Production LLM architectures, dense vector search, citation grounding, multi-step ReAct loops, and autonomous tool calling.",
    estimatedHours: 40,
    modules: [...GENAI_MODULES, ...RAG_MODULES, ...AGENTIC_AI_MODULES]
  }
];

// =========================================================================
// 4. CANONICAL SUBJECT REGISTRY (10 INDEPENDENT SUBJECTS)
// =========================================================================

export const MASTER_CURRICULUM_SUBJECTS: TaxonomySubject[] = [
  {
    id: "subj_python",
    slug: "python",
    title: "Python Foundations & Advanced Engineering",
    icon: "🐍",
    badge: "Programming",
    description: "CPython virtual machine, dynamic typing, control flow, data structures, and OOP.",
    estimatedHours: 40,
    prerequisites: [],
    modules: PYTHON_MODULES
  },
  {
    id: "subj_numpy",
    slug: "numpy",
    title: "NumPy Numerical Computing",
    icon: "⚡",
    badge: "Vectorization",
    description: "ndarrays, C-contiguous buffers, strides, broadcasting rules, and SIMD operations.",
    estimatedHours: 25,
    prerequisites: ["subj_python"],
    modules: NUMPY_MODULES
  },
  {
    id: "subj_pandas",
    slug: "pandas",
    title: "Pandas Tabular Analytics",
    icon: "🐼",
    badge: "Data Wrangling",
    description: "Series, DataFrames, dual indexing (loc/iloc), cleaning, GroupBy, and EDA.",
    estimatedHours: 30,
    prerequisites: ["subj_numpy"],
    modules: PANDAS_MODULES
  },
  {
    id: "subj_sql",
    slug: "sql",
    title: "Relational Databases & SQL",
    icon: "🗄️",
    badge: "Database",
    description: "Relational joins, window functions, CTEs, indexing, and ACID transactions.",
    estimatedHours: 30,
    prerequisites: [],
    modules: SQL_MODULES
  },
  {
    id: "subj_stats_ab",
    slug: "statistics-ab-testing",
    title: "Statistics, Probability & A/B Testing",
    icon: "📊",
    badge: "Inference",
    description: "Probability distributions, Central Limit Theorem, hypothesis tests, and A/B testing.",
    estimatedHours: 30,
    prerequisites: ["subj_python"],
    modules: STATISTICS_AB_MODULES
  },
  {
    id: "subj_ml",
    slug: "machine-learning",
    title: "Classical Machine Learning",
    icon: "📈",
    badge: "Predictive Models",
    description: "Supervised & unsupervised learning, gradient descent, evaluation, and leakage guards.",
    estimatedHours: 40,
    prerequisites: ["subj_numpy", "subj_pandas", "subj_stats_ab"],
    modules: ML_MODULES
  },
  {
    id: "subj_deep_learning",
    slug: "deep-learning",
    title: "Deep Learning & Transformers",
    icon: "🤖",
    badge: "Neural Networks",
    description: "Backpropagation, automatic differentiation, activations, CNNs, and Self-Attention.",
    estimatedHours: 45,
    prerequisites: ["subj_ml"],
    modules: DEEP_LEARNING_MODULES
  },
  {
    id: "subj_genai_llm",
    slug: "generative-ai-llms",
    title: "Generative AI & LLM Engineering",
    icon: "✨",
    badge: "Foundational Models",
    description: "Tokenization, context windows, LoRA fine-tuning, prompt engineering, and structured outputs.",
    estimatedHours: 35,
    prerequisites: ["subj_deep_learning"],
    modules: GENAI_MODULES
  },
  {
    id: "subj_rag",
    slug: "rag",
    title: "Retrieval-Augmented Generation (RAG)",
    icon: "🔍",
    badge: "Vector Retrieval",
    description: "Document chunking, dense embeddings, vector databases, hybrid search, and rerankers.",
    estimatedHours: 35,
    prerequisites: ["subj_genai_llm", "subj_numpy"],
    modules: RAG_MODULES
  },
  {
    id: "subj_agents",
    slug: "agentic-ai",
    title: "Autonomous AI Agents",
    icon: "🧠",
    badge: "Agentic Systems",
    description: "ReAct loops, function calling schemas, state graphs, multi-agent coordination, and guardrails.",
    estimatedHours: 40,
    prerequisites: ["subj_rag"],
    modules: AGENTIC_AI_MODULES
  },
  {
    id: "subj_data_engineering",
    slug: "data-engineering",
    title: "Data Engineering & Distributed Pipelines",
    icon: "⚙️",
    badge: "Pipelines & Storage",
    description: "Batch vs streaming, idempotent ETL/ELT, Lakehouses, Parquet, PySpark, Airflow, and CDC.",
    estimatedHours: 35,
    prerequisites: ["subj_sql", "subj_python"],
    modules: DATA_ENGINEERING_MODULES
  },
  {
    id: "subj_mlops",
    slug: "mlops-llmops",
    title: "MLOps & LLMOps Production Engineering",
    icon: "🚀",
    badge: "Model Operations",
    description: "Experiment tracking, MLflow model registries, containerized serving, drift monitoring, and canary rollouts.",
    estimatedHours: 35,
    prerequisites: ["subj_ml"],
    modules: MLOPS_MODULES
  },
  {
    id: "subj_ai_eval",
    slug: "ai-evaluation-safety",
    title: "AI Evaluation & Responsible AI",
    icon: "🛡️",
    badge: "Evaluation & Safety",
    description: "Golden benchmarks, LLM-as-a-judge calibration, prompt injection defense, PII masking, and guardrails.",
    estimatedHours: 30,
    prerequisites: ["subj_genai_llm"],
    modules: AI_EVAL_MODULES
  },
  {
    id: "subj_ai_projects",
    slug: "applied-ai-projects",
    title: "Applied AI Projects & Capstones",
    icon: "🏆",
    badge: "Production Capstones",
    description: "End-to-end customer churn, enterprise document RAG, autonomous research agents, and real-time APIs.",
    estimatedHours: 45,
    prerequisites: ["subj_ml", "subj_rag", "subj_agents"],
    modules: AI_PROJECTS_MODULES
  }
];

export const TAXONOMY_SUBJECTS: TaxonomySubject[] = MASTER_CURRICULUM_SUBJECTS;

export function getAllTaxonomySubjects(): TaxonomySubject[] {
  return MASTER_CURRICULUM_SUBJECTS;
}

export function getTaxonomySubjectBySlug(slug: string): TaxonomySubject | null {
  return MASTER_CURRICULUM_SUBJECTS.find((s) => s.slug === slug || s.id === slug) || null;
}

export const TOPIC_ID_ALIASES: Record<string, string> = {
  "py-01-intro": "py-01-intro-interpreter",
  "py-02-variables-types": "py-02-variables-data-types",
  "np-02-broadcasting": "np-04-broadcasting-rules",
  "np-02-broadcasting-mechanics": "np-04-broadcasting-rules",
  "np-01-architecture": "np-01-intro-why-numpy",
  "sql-03-window-functions": "sql-04-window-functions-framing",
  "ml-03-metrics": "ml-63-regression-metrics",
  "genai-02-structured-outputs": "genai-05-structured-outputs-json",
};

// Master lookup helper
export function getTaxonomyTopicById(topicId: string): TaxonomyTopic | null {
  const resolvedId = TOPIC_ID_ALIASES[topicId] || topicId;
  for (const subj of MASTER_CURRICULUM_SUBJECTS) {
    for (const mod of subj.modules) {
      const found = mod.topics.find((t) => t.id === resolvedId);
      if (found) return found;
    }
  }
  for (const track of MASTER_CURRICULUM_TRACKS) {
    for (const mod of track.modules) {
      const found = mod.topics.find((t) => t.id === resolvedId);
      if (found) return found;
    }
  }
  return null;
}

// =========================================================================
// 5. CANONICAL MASTER TRACKS & SEQUENTIAL NAVIGATION ENGINE
// =========================================================================

export interface CanonicalMasterTrack {
  id: "track_a_foundations" | "track_b_specialized";
  code: "TRACK_A" | "TRACK_B";
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  subjectIds: string[];
}

export const CANONICAL_MASTER_TRACKS: CanonicalMasterTrack[] = [
  {
    id: "track_a_foundations",
    code: "TRACK_A",
    title: "Track A — Shared Foundations",
    subtitle: "Python, Data Manipulation, SQL & Mathematics",
    badge: "Core Engineering",
    description: "The universal technical foundation required across all modern AI, Data Science, and Machine Learning engineering roles.",
    subjectIds: [
      "subj_python",
      "subj_numpy",
      "subj_pandas",
      "subj_sql",
      "subj_stats_ab"
    ]
  },
  {
    id: "track_b_specialized",
    code: "TRACK_B",
    title: "Track B — Specialized Domains",
    subtitle: "ML, Deep Learning, GenAI, Data Engineering, MLOps & Capstones",
    badge: "Specialized Engineering",
    description: "Production intelligence disciplines calibrated to industry career roles: Machine Learning, Transformers, LLMs, Agents, Pipelines, and Production MLOps.",
    subjectIds: [
      "subj_ml",
      "subj_deep_learning",
      "subj_genai_llm",
      "subj_rag",
      "subj_agents",
      "subj_data_engineering",
      "subj_mlops",
      "subj_ai_eval",
      "subj_ai_projects"
    ]
  }
];

export function getCanonicalMasterTracks(): CanonicalMasterTrack[] {
  return CANONICAL_MASTER_TRACKS;
}

export interface FlatCurriculumTopic {
  topic: TaxonomyTopic;
  subject: TaxonomySubject;
  module: TaxonomyModule;
  trackId: "track_a_foundations" | "track_b_specialized";
  globalIndex: number;
}

export function getAllCurriculumTopicsFlat(): FlatCurriculumTopic[] {
  const result: FlatCurriculumTopic[] = [];
  let index = 0;
  for (const track of CANONICAL_MASTER_TRACKS) {
    for (const subjId of track.subjectIds) {
      const subj = MASTER_CURRICULUM_SUBJECTS.find(s => s.id === subjId);
      if (!subj) continue;
      for (const mod of subj.modules) {
        for (const topic of mod.topics) {
          result.push({
            topic,
            subject: subj,
            module: mod,
            trackId: track.id,
            globalIndex: index++
          });
        }
      }
    }
  }
  return result;
}

export function getNextAndPreviousTopic(currentTopicId: string): {
  previous: FlatCurriculumTopic | null;
  current: FlatCurriculumTopic | null;
  next: FlatCurriculumTopic | null;
} {
  const all = getAllCurriculumTopicsFlat();
  const resolvedId = TOPIC_ID_ALIASES[currentTopicId] || currentTopicId;
  const currentIndex = all.findIndex(item => item.topic.id === resolvedId);
  if (currentIndex === -1) {
    return {
      previous: null,
      current: all[0] || null,
      next: all[1] || null
    };
  }
  return {
    previous: currentIndex > 0 ? all[currentIndex - 1] : null,
    current: all[currentIndex],
    next: currentIndex < all.length - 1 ? all[currentIndex + 1] : null
  };
}

export function getTopicLocation(topicId: string): FlatCurriculumTopic | null {
  const all = getAllCurriculumTopicsFlat();
  const resolvedId = TOPIC_ID_ALIASES[topicId] || topicId;
  return all.find(item => item.topic.id === resolvedId) || null;
}

