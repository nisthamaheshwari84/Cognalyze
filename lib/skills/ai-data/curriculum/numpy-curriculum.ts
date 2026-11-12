/**
 * lib/skills/ai-data/curriculum/numpy-curriculum.ts
 * 
 * Complete NumPy Curriculum Decomposition for Cognalyze Master Taxonomy.
 * Features granular modules: Architecture, Creation, Attributes, Indexing/Slicing,
 * Reshaping, Broadcasting, Vectorization, Aggregations, Boolean/Fancy Indexing,
 * Linear Algebra, and Performance Optimization.
 */

import { TaxonomyTopic, TaxonomyModule } from "../master-curriculum-taxonomy";

export const NUMPY_MODULES: TaxonomyModule[] = [
  {
    id: "mod_np_architecture",
    trackId: "track_numpy",
    title: "Module 1: Architecture, Memory Layout & Array Creation",
    description: "ndarray C-buffer internals, memory strides, contiguous arrays, and creation factory functions.",
    order: 1,
    topics: [
      {
        id: "np-01-intro-why-numpy",
        trackId: "track_numpy",
        moduleId: "mod_np_architecture",
        title: "Why NumPy Exists: Python Object Overhead vs C-Contiguous Arrays",
        order: 1,
        estimatedMinutes: 30,
        difficulty: "beginner",
        prerequisites: ["py-02-variables-data-types"],
        roleRelevance: {
          data_analyst: { importance: "CRITICAL", why: "Underpins Pandas vector engine speed and memory efficiency." },
          data_scientist: { importance: "CRITICAL", why: "Core numerical data representation for all ML modeling." },
          data_engineer: { importance: "HIGH", why: "Understanding contiguous buffer allocations prevents memory fragmentation." },
          ml_engineer: { importance: "CRITICAL", why: "PyTorch/TensorFlow tensors are generalized C-contiguous NumPy arrays." },
          mlops_engineer: { importance: "HIGH", why: "Key to zero-copy data deserialization across Triton and ONNX inference runtimes." },
          ai_engineer: { importance: "CRITICAL", why: "Vector embeddings and cosine similarity computations execute on NumPy primitives." },
          genai_llm_engineer: { importance: "CRITICAL", why: "KV-cache memory allocations and attention matrix multiplications." },
          applied_ai_engineer: { importance: "CRITICAL", why: "High-throughput audio, vision, and sensor preprocessing." },
        },
        learningObjectives: [
          "Understand why Python lists incur ~28 bytes overhead per element while NumPy uses exactly 8 bytes (for int64).",
          "Learn how CPU cache locality and SIMD (Single Instruction Multiple Data) accelerate computation by 50x–200x.",
          "Inspect memory layouts using .nbytes, .dtype, and .itemsize."
        ],
        conceptsCovered: ["Contiguous Memory", "Cache Locality", "SIMD", "C Array Pointers", "Type Boxing", "Strides"],
        subtopics: [
          { id: "np-01-sub-1", title: "CPython PyObject Boxing vs Raw C Buffer", order: 1, concepts: ["PyObject", "Boxing", "Memory Layout"] },
          { id: "np-01-sub-2", title: "SIMD Vector Registers & CPU Cache Lines", order: 2, concepts: ["SIMD", "AVX", "L1/L2 Cache"] }
        ],
        practicalOutcome: "Benchmark memory consumption and execution time of summing 1,000,000 numbers in Python vs NumPy.",
        contextAndIntuition: {
          english: "In pure Python, a list is an array of pointers to individual PyObject structs scattered across the heap. Each integer is 'boxed' with metadata (refcount, type pointer). When iterating over a Python list, the CPU repeatedly incurs cache misses. NumPy allocates one single contiguous memory block in C, allowing the CPU to load continuous memory chunks directly into L1/L2 cache registers.",
          hinglish: "Pure Python list mein har number ek alag pointer hota hai jo memory mein bikhra rehta hai. Isse CPU ko har element padhne ke liye baar baar RAM access karni padti hai jisse cache miss hota hai. NumPy ek single continuous C-memory block allocate karta hai, jisse CPU L1/L2 cache mein saara data ek saath load karke SIMD instructions se 100x fast calculate karta hai.",
          whyExists: "Solves the fundamental slowness of Python's dynamic object model for large numerical computations.",
          whatWasUsedBefore: "Nested Python loops with lists or compiling standalone C/Fortran modules manually."
        },
        deepExplanation: {
          english: "An ndarray consists of two main parts: a data buffer (a raw contiguous block of bytes) and a metadata header containing shape, dtype, and strides. When performing an operation like arr * 2, NumPy delegates execution to compiled C/Fortran routines that utilize AVX/SSE vector instructions on modern CPUs.",
          hinglish: "NumPy ndarray ke do hisse hote hain: raw data buffer (contiguous C memory) aur metadata header (shape, dtype, strides). Jab aap arr * 2 karte ho, CPython ka koi loop nahi chalta; directly compiled C code CPU ke SIMD registers use karke ek clock cycle mein multiple numbers multiply karta hai.",
          internalMechanics: "PyArrayObject struct wrapping a raw memory pointer with shape and stride coordinate mapping.",
          realWorldUsage: "The foundational layer of SciPy, Pandas, Scikit-Learn, PyTorch, OpenCV, and TensorFlow.",
          commonMistakes: [
            "Using Python for loops to iterate through a NumPy array (destroys vectorized speed advantages).",
            "Mixing inhomogeneous data types inside an array, forcing NumPy to fallback to an inefficient object dtype."
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
          }
        ],
        starterCode: `import numpy as np\n\ndef memory_comparison(size=1000000):\n    # 1. Create a NumPy int64 array of np.arange(size)\n    # 2. Return total bytes allocated\n    pass`,
        solutionSnippet: `import numpy as np\n\ndef memory_comparison(size=1000000):\n    arr = np.arange(size, dtype=np.int64)\n    return {"numpy_bytes": arr.nbytes}`
      },
      {
        id: "np-02-array-creation-attributes",
        trackId: "track_numpy",
        moduleId: "mod_np_architecture",
        title: "Array Creation Factories, Data Types & Shape Attributes",
        order: 2,
        estimatedMinutes: 25,
        difficulty: "beginner",
        prerequisites: ["np-01-intro-why-numpy"],
        roleRelevance: {
          data_analyst: { importance: "CRITICAL", why: "Initializing zero-filled matrices for data pivot tables." },
          data_scientist: { importance: "CRITICAL", why: "Generating synthetic feature distributions and linear grids." },
          data_engineer: { importance: "HIGH", why: "Allocating fixed-size memory buffers for stream batching." },
          ml_engineer: { importance: "CRITICAL", why: "Initializing neural network weight tensors with zeros, ones, or random values." },
          mlops_engineer: { importance: "HIGH", why: "Creating dummy input tensors for model benchmarking and latency tests." },
          ai_engineer: { importance: "HIGH", why: "Allocating coordinate grid matrices for positional encodings." },
          genai_llm_engineer: { importance: "CRITICAL", why: "Creating attention mask matrices of zeros and ones." },
          applied_ai_engineer: { importance: "HIGH", why: "Creating blank canvas image arrays in OpenCV." },
        },
        learningObjectives: [
          "Master array creation factory functions: np.zeros, np.ones, np.full, np.arange, np.linspace, and np.empty.",
          "Inspect array attributes: .ndim, .shape, .size, .dtype, and .itemsize.",
          "Understand memory uninitialized risk with np.empty vs safe zero-filling with np.zeros."
        ],
        conceptsCovered: ["zeros/ones/full", "arange vs linspace", "shape vs size vs ndim", "dtype casting", "empty uninitialized RAM"],
        subtopics: [
          { id: "np-02-sub-1", title: "arange() vs linspace() for Numerical Intervals", order: 1, concepts: ["Step size", "Endpoint inclusion", "Floating point errors"] },
          { id: "np-02-sub-2", title: "Uninitialized Memory with np.empty", order: 2, concepts: ["Garbage memory", "Allocation speed"] }
        ],
        practicalOutcome: "Construct a coordinate mesh grid generator for mathematical surface evaluations.",
        contextAndIntuition: {
          english: "When building mathematical models, you frequently need pre-allocated matrices filled with zeros, ones, or evenly spaced values across an interval (e.g., 100 points between 0 and 1). Functions like np.linspace provide floating-point exactness that avoids cumulative rounding errors.",
          hinglish: "Jab aap neural network ya math models banate ho, toh aapko pehle se fixed size ke zero ya one filled matrices chahiye hote hain. `np.linspace` floating-point precision ke sath interval divide karta hai bina kisi rounding error ke.",
          whyExists: "Provides deterministic, fast C-level array allocations without Python loop overhead.",
          whatWasUsedBefore: "Manual list multiplications `[0] * N` which have pointer aliasing issues in multi-dimensions."
        },
        deepExplanation: {
          english: "`np.empty((3, 3))` allocates memory without clearing existing bits in RAM, making it slightly faster but full of arbitrary garbage values. In contrast, `np.zeros` issues a `calloc` system call that zeroes out pages directly.",
          hinglish: "`np.empty` memory allocate karta hai bina purana data clear kiye, isliye isme garbage values hoti hain. `np.zeros` memory ko zero se initialize karta hai jo safe hota hai.",
          internalMechanics: "Direct wrapper around C `malloc` (empty) and `calloc` (zeros) with PyArray_NewFromDescr.",
          realWorldUsage: "Pre-allocating batch buffers in streaming audio/video pipelines.",
          commonMistakes: [
            "Using `np.empty` and forgetting to overwrite every element before reading (reads random garbage memory).",
            "Confusing `np.arange(start, stop, step)` with `np.linspace(start, stop, num_points)`."
          ]
        },
        externalResources: [
          {
            id: "res-np-create-01",
            creatorOrOrg: "CampusX",
            title: "NumPy Array Creation: zeros, ones, arange, linspace & Attributes",
            topicCovered: "Factory functions, dtypes, and shape attributes",
            url: "https://www.youtube.com/watch?v=Rbg7n455PmA",
            timestamp: "00:22:10",
            language: "Hinglish",
            difficulty: "beginner",
            whyRecommended: "Clear visual comparisons of arange vs linspace and array attributes.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `import numpy as np\n\ndef create_grid(start, stop, points):\n    # Return a 1D array of 'points' evenly spaced values between start and stop (inclusive)\n    pass`,
        solutionSnippet: `import numpy as np\n\ndef create_grid(start, stop, points):\n    return np.linspace(start, stop, points)`
      }
    ]
  },
  {
    id: "mod_np_broadcasting_vectorization",
    trackId: "track_numpy",
    title: "Module 2: Dimensional Transformations, Broadcasting & Vectorization",
    description: "Multi-axis slicing, reshape/flatten, trailing dimensional alignment, and stride-0 virtual expansion.",
    order: 2,
    topics: [
      {
        id: "np-03-indexing-slicing-views",
        trackId: "track_numpy",
        moduleId: "mod_np_broadcasting_vectorization",
        title: "Multi-Axis Indexing, Slicing & Views vs Copies",
        order: 1,
        estimatedMinutes: 30,
        difficulty: "intermediate",
        prerequisites: ["np-02-array-creation-attributes"],
        roleRelevance: {
          data_analyst: { importance: "CRITICAL", why: "Extracting specific sub-matrices and time slices from data arrays." },
          data_scientist: { importance: "CRITICAL", why: "Feature column extraction and spatial sub-sampling." },
          data_engineer: { importance: "HIGH", why: "Zero-copy chunk slicing across large tabular arrays." },
          ml_engineer: { importance: "CRITICAL", why: "Tensor patch extraction in computer vision and attention slice operations." },
          mlops_engineer: { importance: "SUPPORTING", why: "Validating input batch tensor shapes." },
          ai_engineer: { importance: "CRITICAL", why: "Extracting embedding vectors and token attention weights." },
          genai_llm_engineer: { importance: "CRITICAL", why: "Slicing multi-head attention queries, keys, and values `(B, H, S, D)`." },
          applied_ai_engineer: { importance: "CRITICAL", why: "Crop and resize operations on image pixels." },
        },
        learningObjectives: [
          "Master multi-axis slicing syntax `arr[rows, cols, depth]` with step increments.",
          "Understand the critical difference: Basic slicing returns a VIEW (shares memory); Fancy indexing returns a COPY.",
          "Check memory sharing via `arr.base` and prevent unintentional mutations."
        ],
        conceptsCovered: ["Multi-Axis Slices", "Views vs Copies", "arr.base Check", "Strided Slicing", "Ellipsis `...`"],
        subtopics: [
          { id: "np-03-sub-1", title: "Memory Views & The .base Pointer", order: 1, concepts: ["Shared Buffer", "No Memory Allocation", "Mutation Side-effects"] },
          { id: "np-03-sub-2", title: "The Ellipsis (...) Syntax for High-Dimensional Tensors", order: 2, concepts: ["Ellipsis", "Multidimensional Slicing"] }
        ],
        practicalOutcome: "Construct a spatial patch extractor that extracts sub-matrices as views without allocating new RAM.",
        contextAndIntuition: {
          english: "In standard Python, slicing a list `b = a[1:5]` creates an independent new list copy. In NumPy, basic slicing `b = a[1:5]` creates a VIEW pointing to the exact same memory buffer. If you modify `b[0] = 999`, `a[1]` is also mutated! This enables blazing speed with zero memory allocations, but requires engineers to know when to explicitly call `.copy()`.",
          hinglish: "Python list mein slice karne par naya copy banta hai. Lekin NumPy mein basic slice ek VIEW hota hai jo usi original memory buffer ko point karta hai! Agar aap sliced array ko change karenge toh original array bhi change ho jayega. Isse memory save hoti hai lekin dhyan na rakhne par bugs aate hain.",
          whyExists: "Enables zero-copy sub-matrix operations on gigabyte-sized numerical arrays.",
          whatWasUsedBefore: "Manual array copy loops that wasted gigabytes of RAM."
        },
        deepExplanation: {
          english: "A view modifies only the metadata (shape and offset pointer), keeping `data` unchanged. If `view.base is arr`, they share memory. When you need an independent array, you must explicitly write `arr.copy()`.",
          hinglish: "View sirf metadata (shape aur offset) badalta hai, actual data buffer wahi rehta hai. `view.base` check karke pata lagaya ja sakta hai ki dono memory share kar rahe hain ya nahi.",
          internalMechanics: "Adjusting `data_ptr = original_ptr + offset` and adjusting `shape` and `strides` tuples.",
          realWorldUsage: "Image cropping, audio windowing, and attention head slicing.",
          commonMistakes: [
            "Modifying a slice and accidentally corrupting the parent training dataset.",
            "Calling `.copy()` on massive arrays inside tight loops (causes memory exhaustion)."
          ]
        },
        externalResources: [
          {
            id: "res-np-slice-01",
            creatorOrOrg: "CampusX",
            title: "NumPy Indexing, Slicing & The View vs Copy Invariant",
            topicCovered: "Multi-axis slicing, views, copies, and memory sharing",
            url: "https://www.youtube.com/watch?v=Rbg7n455PmA",
            timestamp: "00:34:00",
            language: "Hinglish",
            difficulty: "intermediate",
            whyRecommended: "Clear visual diagram showing how two array headers point to one memory block.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `import numpy as np\n\ndef safe_crop(arr, r_start, r_end, c_start, c_end, make_copy=True):\n    # Extract submatrix. If make_copy is True, ensure modifying the result does NOT mutate arr.\n    pass`,
        solutionSnippet: `import numpy as np\n\ndef safe_crop(arr, r_start, r_end, c_start, c_end, make_copy=True):\n    sub = arr[r_start:r_end, c_start:c_end]\n    return sub.copy() if make_copy else sub`
      },
      {
        id: "np-04-broadcasting-rules",
        trackId: "track_numpy",
        moduleId: "mod_np_broadcasting_vectorization",
        title: "Broadcasting Rules: Dimensional Alignment Without Memory Copying",
        order: 2,
        estimatedMinutes: 35,
        difficulty: "intermediate",
        prerequisites: ["np-03-indexing-slicing-views"],
        roleRelevance: {
          data_analyst: { importance: "HIGH", why: "Subtracting column means and normalizing matrices." },
          data_scientist: { importance: "CRITICAL", why: "Core mechanism for feature scaling (Z-score normalization) and distance matrices." },
          data_engineer: { importance: "HIGH", why: "Optimizes matrix scaling in distributed array workloads." },
          ml_engineer: { importance: "CRITICAL", why: "Adding bias vectors to batch matrix outputs in neural layers relies on broadcasting." },
          mlops_engineer: { importance: "HIGH", why: "Validating input tensor shapes against model signatures requires broadcasting rules." },
          ai_engineer: { importance: "CRITICAL", why: "Softmax attention masks and score normalizations use multidimensional broadcasting." },
          genai_llm_engineer: { importance: "CRITICAL", why: "Rotary position embeddings (RoPE) broadcast frequency bands across sequence tokens." },
          applied_ai_engineer: { importance: "CRITICAL", why: "Image channel normalization (image - mean) / std is a canonical broadcasting operation." },
        },
        learningObjectives: [
          "Master the two strict rules of NumPy dimensional compatibility.",
          "Understand how stride manipulation allows virtual dimension stretching with zero memory duplication.",
          "Diagnose and fix ValueError: operands could not be broadcast together."
        ],
        conceptsCovered: ["Trailing Dimensions", "Stride 0 Trick", "Virtual Copying", "Shape Matching", "Dimensional Expansion np.newaxis"],
        subtopics: [
          { id: "np-04-sub-1", title: "Trailing Dimensions Right-to-Left Alignment", order: 1, concepts: ["Right-to-Left", "Dimension 1 Rule", "Rank Padding"] },
          { id: "np-04-sub-2", title: "Stride 0 Memory Trick for Repeated Elements", order: 2, concepts: ["Stride 0", "Zero Memory Duplication"] }
        ],
        practicalOutcome: "Implement an image batch Z-score normalizer applying per-channel mean and standard deviation via broadcasting.",
        contextAndIntuition: {
          english: "Suppose you want to add a 1D vector of shape (3,) to a 2D matrix of shape (4, 3). In traditional programming, you would have to allocate a new (4, 3) matrix and copy the vector 4 times. Broadcasting performs this operation virtually by setting the stride for the repeated dimension to 0, meaning the CPU reads the exact same memory address repeatedly without copying a single byte.",
          hinglish: "Maan lijiye aapke paas (4, 3) ka matrix hai aur aap usme (3,) ka vector add karna chahte ho. Purani programming mein aapko vector ko 4 baar duplicate karke memory waste karni padti. NumPy broadcasting mein koi duplicate data copy nahi hota; NumPy stride ko 0 set kar deta hai jisse memory reuse hoti hai aur calculation instant ho jati hai.",
          whyExists: "Allows element-wise mathematical operations on arrays of differing shapes without consuming gigabytes of memory.",
          whatWasUsedBefore: "Manual np.tile() or np.repeat() that created redundant in-memory copies."
        },
        deepExplanation: {
          english: "NumPy compares array shapes from right to left (trailing dimensions). Two dimensions are compatible if: 1) they are equal, or 2) one of them is 1. If an array has fewer dimensions than another, it is prepended with 1s on the left until the ranks match. When a dimension is 1, NumPy uses stride 0 along that axis.",
          hinglish: "Broadcasting rule: NumPy trailing dimensions (right to left) compare karta hai. Do dimensions tabhi match hongi agar: 1) dono barabar hon, ya 2) dono mein se koi ek 1 ho. Agar kisi array ke dimensions kam hain, toh left side par 1 add kar diya jata hai.",
          internalMechanics: "Stride calculation: If shape[dim] == 1, set stride[dim] = 0 during the outer C-iterator loop.",
          realWorldUsage: "Neural network layer bias addition: (Batch_size, Hidden_dim) + (Hidden_dim,).",
          commonMistakes: [
            "Attempting to broadcast (4, 3) with (4,) without reshaping to (4, 1) (NumPy aligns trailing dimensions first).",
            "Overusing np.tile() when broadcasting accomplishes the task in-place with zero memory allocation."
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
        starterCode: `import numpy as np\n\ndef normalize_features(X):\n    # X is (N, D). Subtract feature means and divide by feature standard deviations using broadcasting.\n    pass`,
        solutionSnippet: `import numpy as np\n\ndef normalize_features(X):\n    mean = np.mean(X, axis=0)\n    std = np.std(X, axis=0)\n    std_safe = np.where(std == 0, 1.0, std)\n    return (X - mean) / std_safe`
      }
    ]
  }
];

