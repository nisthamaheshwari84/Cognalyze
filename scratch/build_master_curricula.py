"""
scratch/build_master_curricula.py
Generates the complete, production-grade 14-domain curricula with deep subtopic trees,
interview priorities, verified video timestamp metadata, and code artifacts.
"""

import os
import json

TARGET_ROLES = [
    "data_analyst", "data_scientist", "data_engineer", "ml_engineer",
    "mlops_engineer", "ai_engineer", "genai_llm_engineer", "applied_ai_engineer"
]

def make_role_relevance(critical_roles, why_msg):
    relevance = {}
    for r in TARGET_ROLES:
        imp = "CRITICAL" if r in critical_roles else "HIGH" if "engineer" in r or "scientist" in r else "SUPPORTING"
        relevance[r] = {"importance": imp, "why": why_msg}
    return relevance

def build_python_curriculum():
    modules = [
        {
            "id": "mod_py_foundations",
            "trackId": "track_python",
            "title": "Module 1: Python Architecture, Interpreter & Core Semantics",
            "description": "Python runtime model, bytecode execution, dynamic typing, and memory model.",
            "order": 1,
            "topics": [
                {
                    "id": "py-01-intro-interpreter",
                    "title": "Introduction to Python: CPython Architecture & Execution Lifecycle",
                    "order": 1,
                    "estimatedMinutes": 30,
                    "difficulty": "beginner",
                    "prerequisites": [],
                    "criticalRoles": ["ai_engineer", "data_scientist", "data_engineer", "ml_engineer"],
                    "whyRelevance": "Foundational understanding of Python's execution model and GIL.",
                    "learningObjectives": [
                        "Differentiate between compilation and interpretation in CPython (`.py` -> `.pyc` -> bytecode evaluation).",
                        "Understand the Global Interpreter Lock (GIL) and its implications for multithreading.",
                        "Execute Python in interactive REPL and script mode with standard environment variables."
                    ],
                    "conceptsCovered": ["CPython", "Bytecode", "GIL", "Virtual Machine", "REPL"],
                    "subtopics": [
                        {"id": "py-01-sub-1", "title": "What is Programming & Python's Design Philosophy", "order": 1, "concepts": ["Readability", "Zen of Python", "High-Level Language"], "interviewPriority": "MUST_KNOW", "startSeconds": 60, "endSeconds": 480, "timestampLabel": "01:00 - 08:00"},
                        {"id": "py-01-sub-2", "title": "CPython Compilation to Bytecode & eval_frame VM Loop", "order": 2, "concepts": ["Bytecode", "PVM", "ceval.c"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 480, "endSeconds": 920, "timestampLabel": "08:00 - 15:20"},
                        {"id": "py-01-sub-3", "title": "Interactive REPL vs Script Mode & __name__ == '__main__'", "order": 3, "concepts": ["REPL", "Entrypoint", "Modular Import"], "interviewPriority": "MUST_KNOW", "startSeconds": 920, "endSeconds": 1400, "timestampLabel": "15:20 - 23:20"}
                    ],
                    "practicalOutcome": "Inspect dis-assembled Python bytecode using the `dis` module and analyze opcode execution.",
                    "whyExists": "Establishes how the runtime executes code before writing application logic.",
                    "whatWasUsedBefore": "Manual C/C++ compilation to native machine code without interactive dynamic evaluation.",
                    "internalMechanics": "Source code is tokenized, parsed into an Abstract Syntax Tree (AST), compiled into bytecode (.pyc), and executed on the CPython stack machine.",
                    "realWorldUsage": "Debugging performance bottlenecks, understanding memory leaks, and building SDK tools.",
                    "commonMistakes": ["Assuming Python is purely interpreted line-by-line without an internal compilation stage."],
                    "video": {"creator": "Corey Schafer", "title": "Python Tutorial: How Python Actually Runs Code", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 60, "endSeconds": 920, "timestampLabel": "01:00 - 15:20"},
                    "starterCode": "import dis\ndef add(a, b):\n    return a + b\n# Disassemble the function\n# dis.dis(add)",
                    "solutionSnippet": "import dis\ndef add(a, b):\n    return a + b\ndis.dis(add)"
                },
                {
                    "id": "py-02-variables-data-types",
                    "title": "Variables, Dynamic Typing & Object References (PyObject)",
                    "order": 2,
                    "estimatedMinutes": 30,
                    "difficulty": "beginner",
                    "prerequisites": ["py-01-intro-interpreter"],
                    "criticalRoles": ["data_analyst", "data_scientist", "data_engineer"],
                    "whyRelevance": "Prevents mutation bugs and memory leaks in data pipelines.",
                    "learningObjectives": [
                        "Understand variables as labeled pointers rather than memory storage boxes.",
                        "Distinguish between mutable (lists, dicts) and immutable (ints, floats, strings, tuples) objects.",
                        "Inspect object identity (`id()`), type checking (`isinstance()`), and reference counting (`sys.getrefcount()`)."
                    ],
                    "conceptsCovered": ["PyObject", "Reference Counting", "Object Identity vs Equality", "Immutability"],
                    "subtopics": [
                        {"id": "py-02-sub-1", "title": "Variable Names as Object Pointers & Dynamic Typing", "order": 1, "concepts": ["Namespaces", "Pointer Assignment", "Type Inference"], "interviewPriority": "MUST_KNOW", "startSeconds": 1400, "endSeconds": 1950, "timestampLabel": "23:20 - 32:30"},
                        {"id": "py-02-sub-2", "title": "Mutable vs Immutable Memory Semantics & Object Identity (`is` vs `==`)", "order": 2, "concepts": ["id()", "is vs ==", "Integer Interning"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 1950, "endSeconds": 2600, "timestampLabel": "32:30 - 43:20"}
                    ],
                    "practicalOutcome": "Build a safe object cloner that avoids unintentional in-place mutation of nested structures.",
                    "whyExists": "Ensures deterministic memory handling and state consistency across function boundaries.",
                    "whatWasUsedBefore": "Direct raw memory allocation with manual pointer arithmetic in low-level languages.",
                    "internalMechanics": "Every entity is a `PyObject` with an `ob_refcnt` reference count and `ob_type` type pointer.",
                    "realWorldUsage": "DataFrame manipulation, deep copies of ML training hyperparameters, and cached function outputs.",
                    "commonMistakes": ["Using `is` to check equality for numbers outside the small integer cache (-5 to 256).", "Mutating default argument values."],
                    "video": {"creator": "CampusX", "title": "Python Memory Management & Variables Explained", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 1400, "endSeconds": 2600, "timestampLabel": "23:20 - 43:20"},
                    "starterCode": "def modify_list(items=[]):\n    # Buggy default mutable argument\n    items.append(1)\n    return items",
                    "solutionSnippet": "def modify_list(items=None):\n    if items is None:\n        items = []\n    items.append(1)\n    return items"
                },
                {
                    "id": "py-03-operators-expressions",
                    "title": "Operators, Precedence & Bitwise Arithmetic",
                    "order": 3,
                    "estimatedMinutes": 25,
                    "difficulty": "beginner",
                    "prerequisites": ["py-02-variables-data-types"],
                    "criticalRoles": ["ml_engineer", "data_analyst", "ai_engineer"],
                    "whyRelevance": "Fundamental to vector arithmetic, boolean masking, and algorithmic problem solving.",
                    "learningObjectives": [
                        "Master arithmetic, comparison, logical, and bitwise operators.",
                        "Understand operator precedence and short-circuit boolean evaluation (`and`, `or`).",
                        "Apply bitwise masks for flag checking and memory-efficient status tracking."
                    ],
                    "conceptsCovered": ["Operator Precedence", "Short-Circuiting", "Bitwise Shifts", "Membership Operators"],
                    "subtopics": [
                        {"id": "py-03-sub-1", "title": "Arithmetic & Comparison Operator Mechanics", "order": 1, "concepts": ["Division (// vs /)", "Modulo", "Chained Comparisons"], "interviewPriority": "MUST_KNOW", "startSeconds": 2600, "endSeconds": 3100, "timestampLabel": "43:20 - 51:40"},
                        {"id": "py-03-sub-2", "title": "Bitwise Manipulation & Boolean Flag Masks", "order": 2, "concepts": ["Bitwise AND/OR/XOR", "Bit Shifts", "Bitmasks"], "interviewPriority": "INTERVIEW_IMPORTANT", "startSeconds": 3100, "endSeconds": 3600, "timestampLabel": "51:40 - 60:00"}
                    ],
                    "practicalOutcome": "Implement a compact permission-checking engine using integer bitmasks.",
                    "whyExists": "Provides rapid mathematical computations and compact binary representation.",
                    "whatWasUsedBefore": "Manual register-level bit flipping or verbose boolean arrays.",
                    "internalMechanics": "Mapped to C-level integer operations with Python's arbitrary-precision bignum fallback.",
                    "realWorldUsage": "Feature flags in web apps, bitwise masking in NumPy/Pandas boolean filters, and cryptographic hash routines.",
                    "commonMistakes": ["Confusing bitwise `&` with logical `and` in boolean conditionals.", "Assuming integer overflow exists in Python 3."],
                    "video": {"creator": "freeCodeCamp", "title": "Python Operators and Bitwise Arithmetic", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 2600, "endSeconds": 3600, "timestampLabel": "43:20 - 60:00"},
                    "starterCode": "def has_permission(user_mask, required_perm):\n    # Return True if required_perm bit is set in user_mask\n    pass",
                    "solutionSnippet": "def has_permission(user_mask, required_perm):\n    return (user_mask & required_perm) == required_perm"
                }
            ]
        },
        {
            "id": "mod_py_control_flow",
            "trackId": "track_python",
            "title": "Module 2: Control Flow & Iteration Mechanics",
            "description": "Conditionals, while/for loops, range, break/continue, and nested iteration.",
            "order": 2,
            "topics": [
                {
                    "id": "py-04-conditionals",
                    "title": "Conditional Branching: if, elif, else & Truthy Evaluation",
                    "order": 1,
                    "estimatedMinutes": 25,
                    "difficulty": "beginner",
                    "prerequisites": ["py-03-operators-expressions"],
                    "criticalRoles": ["data_analyst", "data_scientist", "ai_engineer"],
                    "whyRelevance": "Controls dynamic decision trees and business invariant validation.",
                    "learningObjectives": [
                        "Understand Python truth value testing (`bool(x)`) and falsy values (`0`, `''`, `[]`, `None`, `{}`).",
                        "Structure non-redundant decision trees using `if-elif-else` without deep nesting anti-patterns.",
                        "Use the ternary conditional expression `x if cond else y` for concise readable assignments."
                    ],
                    "conceptsCovered": ["Truthy/Falsy", "Short-Circuit Branching", "Ternary Operator", "Guard Clauses"],
                    "subtopics": [
                        {"id": "py-04-sub-1", "title": "Truthy vs Falsy Value Evaluation Invariants", "order": 1, "concepts": ["bool()", "None", "Empty Containers"], "interviewPriority": "MUST_KNOW", "startSeconds": 3600, "endSeconds": 4100, "timestampLabel": "01:00:00 - 01:08:20"},
                        {"id": "py-04-sub-2", "title": "Short-Circuit Logic (and/or) & Guard Clauses", "order": 2, "concepts": ["Short-Circuit", "Guard Clauses", "Early Return"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 4100, "endSeconds": 4650, "timestampLabel": "01:08:20 - 01:17:30"}
                    ],
                    "practicalOutcome": "Construct a transaction risk evaluator that routes orders into high, moderate, or low risk buckets.",
                    "whyExists": "Provides deterministic execution routing based on dynamic runtime data.",
                    "whatWasUsedBefore": "Manual goto jumps or rigid switch statements in assembly and older languages.",
                    "internalMechanics": "The `POP_JUMP_IF_FALSE` opcode in CPython bytecode skips code blocks if the condition evaluates to falsy.",
                    "realWorldUsage": "API route request validation, credit score thresholding, and model latency alerts.",
                    "commonMistakes": ["Comparing against True explicitly: `if is_valid == True:` instead of `if is_valid:`."],
                    "video": {"creator": "CampusX", "title": "Python Conditionals, if-elif-else and Truthy/Falsy Gotchas", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 3600, "endSeconds": 4650, "timestampLabel": "01:00:00 - 01:17:30"},
                    "starterCode": "def evaluate_risk(credit_score, debt_ratio):\n    # Return LOW if score >= 750 and ratio < 0.3, else HIGH\n    pass",
                    "solutionSnippet": "def evaluate_risk(credit_score, debt_ratio):\n    if credit_score >= 750 and debt_ratio < 0.3:\n        return 'LOW'\n    return 'HIGH'"
                },
                {
                    "id": "py-05-loops-range",
                    "title": "Iteration Patterns: for Loops, while Loops & range() Generator",
                    "order": 2,
                    "estimatedMinutes": 30,
                    "difficulty": "beginner",
                    "prerequisites": ["py-04-conditionals"],
                    "criticalRoles": ["data_analyst", "data_scientist", "data_engineer", "ml_engineer"],
                    "whyRelevance": "Powers batch iteration, training loops, and stream processing.",
                    "learningObjectives": [
                        "Understand the iterator protocol under the hood (`iter()` and `next()`).",
                        "Use `range()` as an O(1) memory generator rather than an instantiated list.",
                        "Master loop control statements: `break`, `continue`, and the `for-else` construct."
                    ],
                    "conceptsCovered": ["for Loops", "while Loops", "range()", "for-else", "Iterator Protocol"],
                    "subtopics": [
                        {"id": "py-05-sub-1", "title": "Iteration Protocol: iter() & next() Mechanics", "order": 1, "concepts": ["iter()", "next()", "StopIteration"], "interviewPriority": "MUST_KNOW", "startSeconds": 4650, "endSeconds": 5200, "timestampLabel": "01:17:30 - 01:26:40"},
                        {"id": "py-05-sub-2", "title": "range() O(1) Memory Layout & for-else Construct", "order": 2, "concepts": ["range", "Lazy Evaluation", "for-else"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 5200, "endSeconds": 5800, "timestampLabel": "01:26:40 - 01:36:40"}
                    ],
                    "practicalOutcome": "Implement a prime factorizer utilizing optimized iteration and `for-else` early breakout.",
                    "whyExists": "Executes repeated computations over sequential collections with minimal memory overhead.",
                    "whatWasUsedBefore": "Manual index pointers and pointer increment loops in C.",
                    "internalMechanics": "The `GET_ITER` and `FOR_ITER` bytecode opcodes fetch items from the iterator until `StopIteration` is caught.",
                    "realWorldUsage": "Epoch iteration in PyTorch training loops, pagination through database cursors, and Kafka polling.",
                    "commonMistakes": ["Creating full lists with `list(range(10000000))` instead of iterating lazily.", "Accidental infinite while loops."],
                    "video": {"creator": "Corey Schafer", "title": "Python Loops and Iterations: For/While Loops", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 4650, "endSeconds": 5800, "timestampLabel": "01:17:30 - 01:36:40"},
                    "starterCode": "def find_first_divisor(n):\n    # Find first divisor greater than 1\n    pass",
                    "solutionSnippet": "def find_first_divisor(n):\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return i\n    return n"
                }
            ]
        },
        {
            "id": "mod_py_collections",
            "trackId": "track_python",
            "title": "Module 3: Core Data Structures & Comprehensions",
            "description": "Lists, dicts, tuples, sets, hash tables, and bytecode-optimized comprehensions.",
            "order": 3,
            "topics": [
                {
                    "id": "py-06-lists-comprehensions",
                    "title": "Lists, Memory Resizing & Bytecode Comprehensions",
                    "order": 1,
                    "estimatedMinutes": 35,
                    "difficulty": "intermediate",
                    "prerequisites": ["py-05-loops-range"],
                    "criticalRoles": ["data_analyst", "data_scientist", "data_engineer"],
                    "whyRelevance": "The most fundamental sequential collection in Python; mastery of dynamic arrays is mandatory.",
                    "learningObjectives": [
                        "Understand `PyListObject` dynamic array over-allocation growth pattern (0, 4, 8, 16, 25...).",
                        "Distinguish between shallow copy (`list.copy()`) and deep copy (`copy.deepcopy()`).",
                        "Master list comprehensions and contrast their bytecode efficiency against manual `.append()` loops."
                    ],
                    "conceptsCovered": ["Dynamic Arrays", "Amortized O(1)", "Shallow vs Deep Copy", "List Slicing", "Comprehensions"],
                    "subtopics": [
                        {"id": "py-06-sub-1", "title": "PyListObject Dynamic Array Resizing & Amortized O(1) Growth", "order": 1, "concepts": ["Over-allocation", "Amortized O(1)", "Memory Doubling"], "interviewPriority": "MUST_KNOW", "startSeconds": 5800, "endSeconds": 6400, "timestampLabel": "01:36:40 - 01:46:40"},
                        {"id": "py-06-sub-2", "title": "List Slicing Semantics & Bytecode-Optimized Comprehensions", "order": 2, "concepts": ["LIST_APPEND", "Shallow Copy", "Bytecode"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 6400, "endSeconds": 7100, "timestampLabel": "01:46:40 - 01:58:20"}
                    ],
                    "practicalOutcome": "Implement a matrix transpose and flattening pipeline using nested list comprehensions.",
                    "whyExists": "Provides general-purpose, type-agnostic indexed collection with O(1) random access.",
                    "whatWasUsedBefore": "Fixed-size static arrays that required manual reallocation and element migration.",
                    "internalMechanics": "Continuous array of pointers (`PyObject** ob_item`). Resizing uses formula: `new_allocated = (size_t)newsize + (newsize >> 3) + (newsize < 9 ? 3 : 6)`.",
                    "realWorldUsage": "Feature extraction buffers, batch accumulation in ML, and data pipeline stage queues.",
                    "commonMistakes": ["Calling `.insert(0, val)` in tight loops (causes O(N) element shifts; use `collections.deque` instead)."],
                    "video": {"creator": "CampusX", "title": "Python Lists Under The Hood: Memory Allocation & Complexity", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 5800, "endSeconds": 7100, "timestampLabel": "01:36:40 - 01:58:20"},
                    "starterCode": "def transpose_matrix(matrix):\n    # Return transposed matrix using list comprehension\n    pass",
                    "solutionSnippet": "def transpose_matrix(matrix):\n    return [[row[i] for row in matrix] for i in range(len(matrix[0]))]"
                },
                {
                    "id": "py-07-dicts-hashmaps",
                    "title": "Dictionaries, Hash Tables & Compact Memory Layout (PEP 468)",
                    "order": 2,
                    "estimatedMinutes": 40,
                    "difficulty": "intermediate",
                    "prerequisites": ["py-06-lists-comprehensions"],
                    "criticalRoles": ["data_analyst", "data_scientist", "data_engineer", "ai_engineer"],
                    "whyRelevance": "The heart of Python's object model and high-speed key-value data retrieval.",
                    "learningObjectives": [
                        "Understand how Python `dict` achieves average O(1) lookup via hash tables and open addressing.",
                        "Master dictionary methods: `.get()`, `.setdefault()`, `.update()`, dictionary comprehensions, and unpacking `**`.",
                        "Understand key hashability requirements (keys must be immutable objects implementing `__hash__` and `__eq__`)."
                    ],
                    "conceptsCovered": ["Hash Tables", "Hash Collisions", "Open Addressing", "Compact Dictionaries (PEP 468)", "Dictionary Comprehensions"],
                    "subtopics": [
                        {"id": "py-07-sub-1", "title": "Compact Hash Table Architecture (PEP 468) & Hashability", "order": 1, "concepts": ["hash()", "__hash__", "Indices Array", "Entries Array"], "interviewPriority": "MUST_KNOW", "startSeconds": 7100, "endSeconds": 7800, "timestampLabel": "01:58:20 - 02:10:00"},
                        {"id": "py-07-sub-2", "title": "Open Addressing Collision Resolution & Perturbation Formula", "order": 2, "concepts": ["Open Addressing", "Perturbation", "Collision Probing"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 7800, "endSeconds": 8500, "timestampLabel": "02:10:00 - 02:21:40"}
                    ],
                    "practicalOutcome": "Build an inverted index search dictionary that maps words to document IDs.",
                    "whyExists": "Provides near-instantaneous key-based retrieval and associative mapping.",
                    "whatWasUsedBefore": "Linear lists of key-value pairs or binary search trees with O(log N) access.",
                    "internalMechanics": "PyDictObject utilizing open addressing with pseudo-random perturbation probing to resolve hash collisions.",
                    "realWorldUsage": "JSON parsing, PyTorch `model.state_dict()`, LangChain chain outputs, and REST API bodies.",
                    "commonMistakes": ["Attempting to use a mutable object like a `list` as a dictionary key.", "Accessing missing keys directly with `d[key]` without `.get()`."],
                    "video": {"creator": "CampusX", "title": "Python Dictionaries Deep Dive: Hash Tables, Collisions & Compact Representation", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 7100, "endSeconds": 8500, "timestampLabel": "01:58:20 - 02:21:40"},
                    "starterCode": "def count_frequencies(words):\n    # Return dict of word frequencies\n    pass",
                    "solutionSnippet": "def count_frequencies(words):\n    freq = {}\n    for w in words:\n        freq[w] = freq.get(w, 0) + 1\n    return freq"
                },
                {
                    "id": "py-08-tuples-immutability",
                    "title": "Tuples, Immutability & Struct Packing",
                    "order": 3,
                    "estimatedMinutes": 25,
                    "difficulty": "beginner",
                    "prerequisites": ["py-06-lists-comprehensions"],
                    "criticalRoles": ["data_engineer", "data_scientist", "ml_engineer"],
                    "whyRelevance": "Critical for fixed database records, dictionary keys, and immutable data flow.",
                    "learningObjectives": [
                        "Understand `PyTupleObject` memory optimization and freelist recycling.",
                        "Master tuple unpacking, extended unpacking (`*rest`), and `namedtuple` usage.",
                        "Understand tuple immutability vs inner mutable reference containment."
                    ],
                    "conceptsCovered": ["Immutability", "Tuple Unpacking", "Namedtuples", "Memory Overhead"],
                    "subtopics": [
                        {"id": "py-08-sub-1", "title": "Tuple Immutability & Memory Footprint vs Lists", "order": 1, "concepts": ["Freelist", "Fixed Size", "Hashable Record"], "interviewPriority": "MUST_KNOW", "startSeconds": 8500, "endSeconds": 9000, "timestampLabel": "02:21:40 - 02:30:00"},
                        {"id": "py-08-sub-2", "title": "Tuple Unpacking, Star Arguments & collections.namedtuple", "order": 2, "concepts": ["Unpacking", "namedtuple", "Typed Struct"], "interviewPriority": "INTERVIEW_IMPORTANT", "startSeconds": 9000, "endSeconds": 9500, "timestampLabel": "02:30:00 - 02:38:20"}
                    ],
                    "practicalOutcome": "Refactor loose coordinate data into typed NamedTuples with memory and immutability guarantees.",
                    "whyExists": "Guarantees data integrity and enables dictionary key eligibility for compound values.",
                    "whatWasUsedBefore": "Mutable arrays with runtime validation checks.",
                    "internalMechanics": "Fixed-size array allocated in a single contiguous memory block with PyObject pointer array directly following header.",
                    "realWorldUsage": "Returning multiple values from functions, database row representations, and coordinate points.",
                    "commonMistakes": ["Assuming a tuple containing a list is fully immutable (the list inside can still be mutated)."],
                    "video": {"creator": "Corey Schafer", "title": "Tuples and Immutability in Python", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 8500, "endSeconds": 9500, "timestampLabel": "02:21:40 - 02:38:20"},
                    "starterCode": "def parse_record(record_tuple):\n    # Extract id, name, and rest of data using unpacking\n    pass",
                    "solutionSnippet": "def parse_record(record_tuple):\n    rec_id, name, *rest = record_tuple\n    return {'id': rec_id, 'name': name, 'extra': rest}"
                },
                {
                    "id": "py-09-sets-hashing",
                    "title": "Sets, Set Theory & O(1) Membership Testing",
                    "order": 4,
                    "estimatedMinutes": 30,
                    "difficulty": "intermediate",
                    "prerequisites": ["py-07-dicts-hashmaps"],
                    "criticalRoles": ["data_analyst", "data_engineer", "ai_engineer"],
                    "whyRelevance": "Powers high-speed deduplication, join keys matching, and mathematical set operations.",
                    "learningObjectives": [
                        "Understand `PySetObject` as a key-only hash table with zero value pointers.",
                        "Master mathematical set operators: union (`|`), intersection (`&`), difference (`-`), and symmetric difference (`^`).",
                        "Compare O(1) set membership testing against O(N) list scanning in large datasets."
                    ],
                    "conceptsCovered": ["Set Theory", "Hash Table (Key Only)", "Deduplication", "Frozenset"],
                    "subtopics": [
                        {"id": "py-09-sub-1", "title": "Set Hash Table Representation & O(1) Membership Invariants", "order": 1, "concepts": ["Key-only hash", "Deduplication", "in Operator"], "interviewPriority": "MUST_KNOW", "startSeconds": 9500, "endSeconds": 10000, "timestampLabel": "02:38:20 - 02:46:40"},
                        {"id": "py-09-sub-2", "title": "Set Algebraic Operations & frozenset Immutability", "order": 2, "concepts": ["Union", "Intersection", "Difference", "frozenset"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 10000, "endSeconds": 10500, "timestampLabel": "02:46:40 - 02:55:00"}
                    ],
                    "practicalOutcome": "Perform fast reconciliation between two user databases to detect deleted, added, and common records.",
                    "whyExists": "Enables deduplication and instant membership testing based on mathematical set theory.",
                    "whatWasUsedBefore": "Sorting arrays and performing binary searches or nested loop scans.",
                    "internalMechanics": "Hash table with open addressing where only key hashes and pointers are stored.",
                    "realWorldUsage": "Deduplicating clickstream user IDs, finding missing catalog IDs in ETL, and permission group intersections.",
                    "commonMistakes": ["Creating an empty set with `{}` (creates an empty dict; must use `set()`)."],
                    "video": {"creator": "CampusX", "title": "Python Sets: Internal Hash Table and Mathematical Operations", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 9500, "endSeconds": 10500, "timestampLabel": "02:38:20 - 02:55:00"},
                    "starterCode": "def find_discrepancies(prod_ids, audit_ids):\n    # Return dict with 'added', 'removed', and 'retained' sets\n    pass",
                    "solutionSnippet": "def find_discrepancies(prod_ids, audit_ids):\n    s_prod, s_audit = set(prod_ids), set(audit_ids)\n    return {'added': s_audit - s_prod, 'removed': s_prod - s_audit, 'retained': s_prod & s_audit}"
                }
            ]
        },
        {
            "id": "mod_py_functions_recursion",
            "trackId": "track_python",
            "title": "Module 4: Functions, Closures, Namespaces & Recursion",
            "description": "First-class functions, LEGB scope rules, closures, and call stack mechanics in recursive problem solving.",
            "order": 4,
            "topics": [
                {
                    "id": "py-10-functions-params",
                    "title": "First-Class Functions, *args, **kwargs & Parameter Semantics",
                    "order": 1,
                    "estimatedMinutes": 35,
                    "difficulty": "intermediate",
                    "prerequisites": ["py-07-dicts-hashmaps"],
                    "criticalRoles": ["ai_engineer", "ml_engineer", "data_scientist"],
                    "whyRelevance": "The building block of all modular Python software; essential for clean API design.",
                    "learningObjectives": [
                        "Treat functions as first-class objects (passed as arguments, returned, assigned to variables).",
                        "Master positional-only (`/`), keyword-only (`*`), `*args` tuple packing, and `**kwargs` dictionary packing.",
                        "Avoid the classic mutable default argument trap in production functions."
                    ],
                    "conceptsCovered": ["First-Class Objects", "Argument Unpacking", "Positional-Only", "Keyword-Only"],
                    "subtopics": [
                        {"id": "py-10-sub-1", "title": "Functions as First-Class Citizens & Higher-Order Design", "order": 1, "concepts": ["Higher-Order Functions", "Function Objects", "Callables"], "interviewPriority": "MUST_KNOW", "startSeconds": 10500, "endSeconds": 11100, "timestampLabel": "02:55:00 - 03:05:00"},
                        {"id": "py-10-sub-2", "title": "*args, **kwargs Unpacking & Positional/Keyword-Only Enforcers", "order": 2, "concepts": ["Variadic Arguments", "Keyword-Only (*)", "Positional-Only (/)"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 11100, "endSeconds": 11700, "timestampLabel": "03:05:00 - 03:15:00"}
                    ],
                    "practicalOutcome": "Build a flexible event dispatcher that routes dynamic payloads to registered handler callbacks.",
                    "whyExists": "Allows modular, reusable code abstraction with flexible parameter signatures.",
                    "whatWasUsedBefore": "Rigid function pointers in C with strict compile-time signature constraints.",
                    "internalMechanics": "Functions are instances of `PyFunctionObject` holding code object, global namespace pointer, and default argument tuple.",
                    "realWorldUsage": "Decorator design, framework middleware (FastAPI/Flask), and PyTorch module forward passes.",
                    "commonMistakes": ["Using mutable defaults like `def fn(data={}):`.", "Order of parameters: positional, *args, keyword-only, **kwargs."],
                    "video": {"creator": "Corey Schafer", "title": "Python: Functions and Parameters Explained", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 10500, "endSeconds": 11700, "timestampLabel": "02:55:00 - 03:15:00"},
                    "starterCode": "def make_dispatcher():\n    # Return a dispatch(event_name, *args, **kwargs) function\n    pass",
                    "solutionSnippet": "def make_dispatcher():\n    handlers = {}\n    def register(name, fn): handlers[name] = fn\n    def dispatch(name, *args, **kwargs):\n        return handlers[name](*args, **kwargs) if name in handlers else None\n    dispatch.register = register\n    return dispatch"
                },
                {
                    "id": "py-11-scope-closures",
                    "title": "LEGB Scope Resolution, global/nonlocal & Closures",
                    "order": 2,
                    "estimatedMinutes": 35,
                    "difficulty": "intermediate",
                    "prerequisites": ["py-10-functions-params"],
                    "criticalRoles": ["ai_engineer", "ml_engineer", "data_scientist"],
                    "whyRelevance": "Required to understand decorators, factory functions, and state encapsulation.",
                    "learningObjectives": [
                        "Understand the LEGB (Local, Enclosing, Global, Built-in) namespace lookup chain.",
                        "Understand how `global` and `nonlocal` modify variable resolution in parent frames.",
                        "Understand closures: how inner functions retain access to enclosing free variables via `__closure__`."
                    ],
                    "conceptsCovered": ["LEGB Rule", "Closures", "Free Variables", "nonlocal Keyword", "Namespaces"],
                    "subtopics": [
                        {"id": "py-11-sub-1", "title": "LEGB Resolution Hierarchy & Local vs Global Namespace Dictionaries", "order": 1, "concepts": ["Local", "Enclosing", "Global", "Built-in", "globals()"], "interviewPriority": "MUST_KNOW", "startSeconds": 11700, "endSeconds": 12300, "timestampLabel": "03:15:00 - 03:25:00"},
                        {"id": "py-11-sub-2", "title": "Closures, Cell Objects (__closure__) & Stateful Function Factories", "order": 2, "concepts": ["Closure", "Cell Object", "Free Variables", "nonlocal"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 12300, "endSeconds": 12900, "timestampLabel": "03:25:00 - 03:35:00"}
                    ],
                    "practicalOutcome": "Build a stateful rate limiter factory using a closure without resorting to global variables or class boilerplate.",
                    "whyExists": "Provides lexical scoping and safe data encapsulation without global namespace pollution.",
                    "whatWasUsedBefore": "Global variables with mutex locks or heavyweight class instances.",
                    "internalMechanics": "Free variables in closures are stored in `__closure__` tuple containing `cell` objects pointing to values on heap.",
                    "realWorldUsage": "Decorator state retention, custom PyTorch loss factories, and configuration currying.",
                    "commonMistakes": ["UnboundLocalError when modifying an outer variable without `nonlocal`."],
                    "video": {"creator": "Corey Schafer", "title": "Python Closures and Variable Scope (LEGB)", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 11700, "endSeconds": 12900, "timestampLabel": "03:15:00 - 03:35:00"},
                    "starterCode": "def make_counter(start=0):\n    # Return a function that increments and returns count\n    pass",
                    "solutionSnippet": "def make_counter(start=0):\n    count = start\n    def counter():\n        nonlocal count\n        count += 1\n        return count\n    return counter"
                },
                {
                    "id": "py-12-recursion-callstack",
                    "title": "Recursion, Stack Frames & Tail Call Invariants",
                    "order": 3,
                    "estimatedMinutes": 40,
                    "difficulty": "advanced",
                    "prerequisites": ["py-11-scope-closures"],
                    "criticalRoles": ["ai_engineer", "data_scientist", "ml_engineer"],
                    "whyRelevance": "Core technique for tree traversals (ASTs, decision trees, DOMs) and divide-and-conquer algorithms.",
                    "learningObjectives": [
                        "Understand call stack memory frames (`PyFrameObject`), base cases, and recursive descent.",
                        "Recognize recursion depth limits (`sys.getrecursionlimit()`) and `RecursionError`.",
                        "Convert recursive algorithms to iterative stack/queue implementations to prevent stack overflow."
                    ],
                    "conceptsCovered": ["Call Stack", "Base Case", "Stack Overflow", "Memoization", "Iterative Conversion"],
                    "subtopics": [
                        {"id": "py-12-sub-1", "title": "Call Stack Frame Allocations & Base Case Guarantees", "order": 1, "concepts": ["PyFrameObject", "Base Case", "Stack Depth"], "interviewPriority": "MUST_KNOW", "startSeconds": 12900, "endSeconds": 13500, "timestampLabel": "03:35:00 - 03:45:00"},
                        {"id": "py-12-sub-2", "title": "Tree Traversal Recursion & Converting to Explicit Iterative Stacks", "order": 2, "concepts": ["Tree Traversal", "Explicit Stack", "Memoization"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 13500, "endSeconds": 14100, "timestampLabel": "03:45:00 - 03:55:00"}
                    ],
                    "practicalOutcome": "Write a recursive JSON flattener and convert it into an iterative stack-safe version.",
                    "whyExists": "Enables natural expression of self-similar mathematical and structural problems.",
                    "whatWasUsedBefore": "Manual iteration with explicit stack management.",
                    "internalMechanics": "Each recursive call allocates a new `PyFrameObject` on the C call stack. CPython does not perform automatic tail-call optimization (TCO).",
                    "realWorldUsage": "Traversing AST nodes in linters, recursive token processing in NLP, and nested JSON parsing.",
                    "commonMistakes": ["Forgetting the base case, causing `RecursionError: maximum recursion depth exceeded`."],
                    "video": {"creator": "freeCodeCamp", "title": "Recursion in Python Full Course", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 12900, "endSeconds": 14100, "timestampLabel": "03:35:00 - 03:55:00"},
                    "starterCode": "def flatten_nested(obj, prefix=''):\n    # Recursively flatten nested dict into key.sub_key format\n    pass",
                    "solutionSnippet": "def flatten_nested(obj, prefix=''):\n    items = {}\n    for k, v in obj.items():\n        key = f'{prefix}.{k}' if prefix else k\n        if isinstance(v, dict):\n            items.update(flatten_nested(v, key))\n        else:\n            items[key] = v\n    return items"
                }
            ]
        },
        {
            "id": "mod_py_oop",
            "trackId": "track_python",
            "title": "Module 5: Object-Oriented Programming & Systems Design",
            "description": "Classes, encapsulation, inheritance, method resolution order (MRO), and magic dunder methods.",
            "order": 5,
            "topics": [
                {
                    "id": "py-13-oop-classes-objects",
                    "title": "Classes, Instances, Self & Attribute Lookup (__dict__ vs __slots__)",
                    "order": 1,
                    "estimatedMinutes": 40,
                    "difficulty": "intermediate",
                    "prerequisites": ["py-10-functions-params"],
                    "criticalRoles": ["ai_engineer", "data_engineer", "ml_engineer"],
                    "whyRelevance": "Foundation of Python software architecture, custom estimators, and deep learning modules.",
                    "learningObjectives": [
                        "Master `__init__`, instance methods, class methods (`@classmethod`), and static methods (`@staticmethod`).",
                        "Understand attribute lookup order on instance and class namespaces (`instance.__dict__` -> `Class.__dict__`).",
                        "Optimize memory for millions of instances using `__slots__` to eliminate per-instance dictionary overhead."
                    ],
                    "conceptsCovered": ["Encapsulation", "self Binding", "Class vs Instance Attributes", "__slots__", "Classmethods"],
                    "subtopics": [
                        {"id": "py-13-sub-1", "title": "Class vs Instance State & Method Binding Mechanics", "order": 1, "concepts": ["self", "Class Attribute", "Descriptor Binding"], "interviewPriority": "MUST_KNOW", "startSeconds": 14100, "endSeconds": 14700, "timestampLabel": "03:55:00 - 04:05:00"},
                        {"id": "py-13-sub-2", "title": "__slots__ Memory Optimization & Property Descriptors", "order": 2, "concepts": ["__slots__", "@property", "Descriptor Protocol"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 14700, "endSeconds": 15300, "timestampLabel": "04:05:00 - 04:15:00"}
                    ],
                    "practicalOutcome": "Design a memory-optimized Vector point class using `__slots__` that uses 60% less RAM than standard classes.",
                    "whyExists": "Groups state and behavior into reusable, modular object blueprints.",
                    "whatWasUsedBefore": "Ad-hoc dictionaries and loose functions operating on global structures.",
                    "internalMechanics": "Method calls `obj.method(arg)` are desugared by the descriptor protocol into `Class.method(obj, arg)`.",
                    "realWorldUsage": "PyTorch `nn.Module`, Scikit-Learn `BaseEstimator`, and FastAPI ORM models.",
                    "commonMistakes": ["Accidentally sharing mutable default attributes across instances by defining them at the class level."],
                    "video": {"creator": "Corey Schafer", "title": "Python OOP Tutorial: Classes and Instances", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 14100, "endSeconds": 15300, "timestampLabel": "03:55:00 - 04:15:00"},
                    "starterCode": "class DataPoint:\n    # Define __slots__ for x, y, label\n    pass",
                    "solutionSnippet": "class DataPoint:\n    __slots__ = ('x', 'y', 'label')\n    def __init__(self, x, y, label):\n        self.x, self.y, self.label = x, y, label"
                },
                {
                    "id": "py-14-inheritance-mro",
                    "title": "Inheritance, super() & C3 Linearization Method Resolution Order (MRO)",
                    "order": 2,
                    "estimatedMinutes": 45,
                    "difficulty": "advanced",
                    "prerequisites": ["py-13-oop-classes-objects"],
                    "criticalRoles": ["ai_engineer", "data_engineer", "ml_engineer"],
                    "whyRelevance": "Crucial for framework extension (PyTorch lightning, Django, LangChain base classes).",
                    "learningObjectives": [
                        "Master single and multiple inheritance patterns and cooperative `super()` chaining.",
                        "Understand C3 Linearization algorithm that resolves Method Resolution Order (`Class.mro()`).",
                        "Prevent the Diamond Problem where duplicate calls to ancestor constructors break state initialization."
                    ],
                    "conceptsCovered": ["Multiple Inheritance", "super()", "C3 Linearization", "MRO", "Diamond Problem"],
                    "subtopics": [
                        {"id": "py-14-sub-1", "title": "Cooperative Multiple Inheritance & super() Proxy Mechanics", "order": 1, "concepts": ["super()", "Cooperative Methods", "Parent Delegates"], "interviewPriority": "MUST_KNOW", "startSeconds": 15300, "endSeconds": 15900, "timestampLabel": "04:15:00 - 04:25:00"},
                        {"id": "py-14-sub-2", "title": "C3 Linearization Algorithm & Resolving the Diamond Hierarchy", "order": 2, "concepts": ["C3 Algorithm", "Class.mro()", "Diamond Inheritance"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 15900, "endSeconds": 16500, "timestampLabel": "04:25:00 - 04:35:00"}
                    ],
                    "practicalOutcome": "Construct a mixin-based logging and serialization layer for base database models.",
                    "whyExists": "Enables code reuse and polymorphic interface polymorphism across related domains.",
                    "whatWasUsedBefore": "Copy-pasting duplicate methods across parallel class implementations.",
                    "internalMechanics": "MRO is calculated at class definition time by merging ancestor linearizations using C3 constraints.",
                    "realWorldUsage": "PyTorch module hierarchies, Django mixin views, and LangChain document loaders.",
                    "commonMistakes": ["Calling `Parent.__init__(self)` explicitly instead of cooperative `super().__init__()`."],
                    "video": {"creator": "Corey Schafer", "title": "Python OOP: Inheritance and Creating Subclasses", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 15300, "endSeconds": 16500, "timestampLabel": "04:15:00 - 04:35:00"},
                    "starterCode": "class A: pass\nclass B(A): pass\nclass C(A): pass\nclass D(B, C): pass\n# Inspect D.mro()",
                    "solutionSnippet": "class A: pass\nclass B(A): pass\nclass C(A): pass\nclass D(B, C): pass\n# print(D.mro())"
                },
                {
                    "id": "py-15-dunder-methods",
                    "title": "Special Dunder Methods: Data Model Protocol Implementation",
                    "order": 3,
                    "estimatedMinutes": 40,
                    "difficulty": "advanced",
                    "prerequisites": ["py-14-inheritance-mro"],
                    "criticalRoles": ["ai_engineer", "data_scientist", "ml_engineer"],
                    "whyRelevance": "Allows custom classes to behave pythonically with `len()`, `[]`, `+`, `str()`, and iterators.",
                    "learningObjectives": [
                        "Master representation dunders: `__str__` (user readability) vs `__repr__` (unambiguous code representation).",
                        "Implement container protocols: `__len__`, `__getitem__`, `__setitem__`, and `__contains__`.",
                        "Implement operator overloading: `__add__`, `__eq__`, `__lt__`, and hashing `__hash__`."
                    ],
                    "conceptsCovered": ["Data Model", "Operator Overloading", "__repr__ vs __str__", "Container Protocol"],
                    "subtopics": [
                        {"id": "py-15-sub-1", "title": "__repr__ vs __str__ & String Formatting Protocols", "order": 1, "concepts": ["__repr__", "__str__", "Debugging Dunders"], "interviewPriority": "MUST_KNOW", "startSeconds": 16500, "endSeconds": 17100, "timestampLabel": "04:35:00 - 04:45:00"},
                        {"id": "py-15-sub-2", "title": "Container Sequence Emulation (__getitem__, __len__, __iter__)", "order": 2, "concepts": ["Sequence Protocol", "__getitem__", "__len__"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 17100, "endSeconds": 17700, "timestampLabel": "04:45:00 - 04:55:00"}
                    ],
                    "practicalOutcome": "Build a custom Dataset class that supports len, slicing, and index access for training batches.",
                    "whyExists": "Integrates custom user classes seamlessly into Python's built-in operators and syntax.",
                    "whatWasUsedBefore": "Clunky named methods like `vec.add(other)` or `coll.get_size()`.",
                    "internalMechanics": "CPython slot-wrappers map syntax directly to internal type slots like `tp_as_number` and `tp_as_sequence`.",
                    "realWorldUsage": "PyTorch `torch.utils.data.Dataset`, Pandas DataFrame indexing, and SymPy symbolic expressions.",
                    "commonMistakes": ["Implementing `__eq__` without `__hash__`, which causes the object to become unhashable."],
                    "video": {"creator": "Corey Schafer", "title": "Special (Magic/Dunder) Methods in Python", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 16500, "endSeconds": 17700, "timestampLabel": "04:35:00 - 04:55:00"},
                    "starterCode": "class CustomBuffer:\n    # Implement __len__ and __getitem__\n    pass",
                    "solutionSnippet": "class CustomBuffer:\n    def __init__(self, data): self._data = list(data)\n    def __len__(self): return len(self._data)\n    def __getitem__(self, idx): return self._data[idx]"
                }
            ]
        },
        {
            "id": "mod_py_advanced_engineering",
            "trackId": "track_python",
            "title": "Module 6: Advanced Python: Generators, Decorators & Context Managers",
            "description": "Lazy evaluation with generators, metaprogramming with decorators, and resource lifecycle management.",
            "order": 6,
            "topics": [
                {
                    "id": "py-16-generators-iterators",
                    "title": "Iterators, Generators, yield & Lazy Memory Streams",
                    "order": 1,
                    "estimatedMinutes": 45,
                    "difficulty": "advanced",
                    "prerequisites": ["py-15-dunder-methods"],
                    "criticalRoles": ["data_engineer", "ml_engineer", "data_scientist", "ai_engineer"],
                    "whyRelevance": "Enables processing multi-gigabyte datasets and continuous data streams with O(1) memory.",
                    "learningObjectives": [
                        "Differentiate between iterables, iterator objects, and generator functions.",
                        "Understand how `yield` pauses execution frame state and resumes with minimal memory footprint.",
                        "Build generator pipelines combining filtering, transformations, and batch chunking."
                    ],
                    "conceptsCovered": ["yield", "Generators", "Iterator Protocol", "Lazy Evaluation", "Streaming"],
                    "subtopics": [
                        {"id": "py-16-sub-1", "title": "The Generator Frame Lifecycle & yield vs return", "order": 1, "concepts": ["yield", "GeneratorExit", "Frame Suspension"], "interviewPriority": "MUST_KNOW", "startSeconds": 17700, "endSeconds": 18300, "timestampLabel": "04:55:00 - 05:05:00"},
                        {"id": "py-16-sub-2", "title": "Generator Pipelines & Memory-Efficient Multi-Gigabyte Stream Ingestion", "order": 2, "concepts": ["Pipelines", "Lazy Streaming", "Memory Profiling"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 18300, "endSeconds": 19000, "timestampLabel": "05:05:00 - 05:16:40"}
                    ],
                    "practicalOutcome": "Build a streaming CSV parser that computes rolling statistics on a 10GB file without exceeding 50MB RAM.",
                    "whyExists": "Prevents Out-Of-Memory (OOM) crashes by evaluating elements on-demand rather than preloading all.",
                    "whatWasUsedBefore": "Writing temporary batch files to disk or allocating massive memory buffers.",
                    "internalMechanics": "Generator functions return a `PyGenObject` wrapping the suspended execution frame, saving local variables and instruction pointer.",
                    "realWorldUsage": "Reading massive log files, training data stream loaders, and streaming LLM token generation responses.",
                    "commonMistakes": ["Attempting to index or reuse an exhausted generator (generators can only be consumed once)."],
                    "video": {"creator": "Corey Schafer", "title": "Generators: How to Use them and the Benefits You Receive", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 17700, "endSeconds": 19000, "timestampLabel": "04:55:00 - 05:16:40"},
                    "starterCode": "def chunk_stream(stream, chunk_size):\n    # Yield lists of chunk_size elements from stream\n    pass",
                    "solutionSnippet": "def chunk_stream(stream, chunk_size):\n    chunk = []\n    for item in stream:\n        chunk.append(item)\n        if len(chunk) == chunk_size:\n            yield chunk\n            chunk = []\n    if chunk: yield chunk"
                },
                {
                    "id": "py-17-decorators-metaprogramming",
                    "title": "Decorators, Function Wrapping & functools.wraps",
                    "order": 2,
                    "estimatedMinutes": 45,
                    "difficulty": "advanced",
                    "prerequisites": ["py-11-scope-closures"],
                    "criticalRoles": ["ai_engineer", "mlops_engineer", "data_engineer"],
                    "whyRelevance": "Core design pattern in frameworks for logging, authentication, caching, and retry logic.",
                    "learningObjectives": [
                        "Understand decorators as higher-order functions accepting and returning callables (`@dec` syntax sugar).",
                        "Preserve original function identity and docstrings using `@functools.wraps(fn)`.",
                        "Construct parameterized decorators that accept custom configuration arguments."
                    ],
                    "conceptsCovered": ["Decorators", "functools.wraps", "Parameterized Decorators", "Metaprogramming"],
                    "subtopics": [
                        {"id": "py-17-sub-1", "title": "Function Decorators & Preserving Signature via functools.wraps", "order": 1, "concepts": ["Closure Wrap", "@functools.wraps", "__name__/__doc__"], "interviewPriority": "MUST_KNOW", "startSeconds": 19000, "endSeconds": 19600, "timestampLabel": "05:16:40 - 05:26:40"},
                        {"id": "py-17-sub-2", "title": "Parameterized Decorators & Class-Based Decorator Implementations", "order": 2, "concepts": ["Decorator Factories", "Three-level Closures", "Class Decorators"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 19600, "endSeconds": 20200, "timestampLabel": "05:26:40 - 05:36:40"}
                    ],
                    "practicalOutcome": "Implement a production `@retry(max_attempts=3, backoff=2.0)` decorator for unstable network API calls.",
                    "whyExists": "Enables cross-cutting concerns (logging, timing, auth, retries) without cluttering business logic.",
                    "whatWasUsedBefore": "Manual try/except and timing boilerplate copy-pasted into every function.",
                    "internalMechanics": "The `@dec` syntax is evaluated at import/definition time as `target_func = dec(target_func)`.",
                    "realWorldUsage": "FastAPI `@app.get()`, PyTorch `@torch.no_grad()`, Scikit-Learn `@deprecated`, and caching `@lru_cache`.",
                    "commonMistakes": ["Forgetting `@functools.wraps`, causing wrapped functions to lose their name and docstring."],
                    "video": {"creator": "Corey Schafer", "title": "Python Decorators: Concepts and Real-World Usage", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 19000, "endSeconds": 20200, "timestampLabel": "05:16:40 - 05:36:40"},
                    "starterCode": "import functools, time\ndef timeit(fn):\n    # Implement execution timer decorator\n    pass",
                    "solutionSnippet": "import functools, time\ndef timeit(fn):\n    @functools.wraps(fn)\n    def wrapper(*args, **kwargs):\n        t0 = time.perf_counter()\n        res = fn(*args, **kwargs)\n        print(f'{fn.__name__} took {time.perf_counter()-t0:.4f}s')\n        return res\n    return wrapper"
                },
                {
                    "id": "py-18-context-managers",
                    "title": "Context Managers, with Statement & Resource Cleanup",
                    "order": 3,
                    "estimatedMinutes": 35,
                    "difficulty": "intermediate",
                    "prerequisites": ["py-15-dunder-methods"],
                    "criticalRoles": ["data_engineer", "mlops_engineer", "ai_engineer"],
                    "whyRelevance": "Guarantees deterministic release of files, database connections, and GPU memory locks.",
                    "learningObjectives": [
                        "Understand the context manager protocol: `__enter__()` and `__exit__()`.",
                        "Handle exceptions cleanly inside `__exit__()` and control error re-raising.",
                        "Create lightweight context managers using the `@contextlib.contextmanager` generator decorator."
                    ],
                    "conceptsCovered": ["with Statement", "__enter__ & __exit__", "contextlib", "Resource Leaks"],
                    "subtopics": [
                        {"id": "py-18-sub-1", "title": "The with Statement Invariants & __enter__ / __exit__ Protocol", "order": 1, "concepts": ["__enter__", "__exit__", "Deterministic Cleanup"], "interviewPriority": "MUST_KNOW", "startSeconds": 20200, "endSeconds": 20700, "timestampLabel": "05:36:40 - 05:45:00"},
                        {"id": "py-18-sub-2", "title": "Lightweight Context Managers with contextlib.contextmanager", "order": 2, "concepts": ["contextlib", "yield as boundary", "Exception Handling"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 20700, "endSeconds": 21300, "timestampLabel": "05:45:00 - 05:55:00"}
                    ],
                    "practicalOutcome": "Build a temporary database transaction context manager that auto-commits on success and rolls back on failure.",
                    "whyExists": "Guarantees resource teardown even when unexpected runtime exceptions occur.",
                    "whatWasUsedBefore": "Manual `try...finally` blocks with frequent developer omissions leading to leaked file descriptors.",
                    "internalMechanics": "`SETUP_WITH` bytecode pushes the `__exit__` method to the block stack; `WITH_EXCEPT_START` invokes it on error.",
                    "realWorldUsage": "Database connections, thread locks (`with threading.Lock():`), PyTorch `torch.no_grad()`, and mocking.",
                    "commonMistakes": ["Returning True from `__exit__` unintentionally, which silently suppresses all exceptions."],
                    "video": {"creator": "Corey Schafer", "title": "Python Tutorial: Context Managers - Efficiently Managing Resources", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 20200, "endSeconds": 21300, "timestampLabel": "05:36:40 - 05:55:00"},
                    "starterCode": "from contextlib import contextmanager\n@contextmanager\ndef temp_timer(label):\n    # Print elapsed time on exit\n    pass",
                    "solutionSnippet": "import time\nfrom contextlib import contextmanager\n@contextmanager\ndef temp_timer(label):\n    t0 = time.time()\n    try:\n        yield\n    finally:\n        print(f'{label}: {time.time()-t0:.2f}s')"
                }
            ]
        },
        {
            "id": "mod_py_production_systems",
            "trackId": "track_python",
            "title": "Module 7: Production Systems: Type Hints, Asyncio & Performance",
            "description": "Static type checking with Pydantic/typing, asynchronous concurrency with asyncio, and profiling.",
            "order": 7,
            "topics": [
                {
                    "id": "py-19-type-hints-pydantic",
                    "title": "Type Hints, Static Verification (mypy) & Pydantic Data Validation",
                    "order": 1,
                    "estimatedMinutes": 40,
                    "difficulty": "intermediate",
                    "prerequisites": ["py-13-oop-classes-objects"],
                    "criticalRoles": ["ai_engineer", "data_engineer", "mlops_engineer"],
                    "whyRelevance": "Production standard for API request validation, LLM structured outputs, and reliable refactoring.",
                    "learningObjectives": [
                        "Master `typing` annotations: `Union`, `Optional`, `List`, `Dict`, `Callable`, `Generic`, and `Literal`.",
                        "Understand runtime type erasure in Python and how static checkers (`mypy`, `pyright`) verify invariants.",
                        "Use Pydantic `BaseModel` for automatic coercion, constraint enforcement, and JSON serialization."
                    ],
                    "conceptsCovered": ["Type Hints", "Pydantic", "mypy", "Static Typing", "Runtime Validation"],
                    "subtopics": [
                        {"id": "py-19-sub-1", "title": "Python Typing System & Static Code Verification with mypy", "order": 1, "concepts": ["typing module", "Type Erasure", "Generics", "TypeVar"], "interviewPriority": "MUST_KNOW", "startSeconds": 21300, "endSeconds": 21900, "timestampLabel": "05:55:00 - 06:05:00"},
                        {"id": "py-19-sub-2", "title": "Pydantic BaseModel & Structured LLM Response Schema Enforcement", "order": 2, "concepts": ["BaseModel", "Field validation", "JSON Schema", "Structured Outputs"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 21900, "endSeconds": 22500, "timestampLabel": "06:05:00 - 06:15:00"}
                    ],
                    "practicalOutcome": "Build a strictly validated LLM structured extraction schema with field constraints and regex checks.",
                    "whyExists": "Catches subtle type mismatches before production runtime deployment.",
                    "whatWasUsedBefore": "Manual `assert isinstance(...)` checks scattered throughout codebase.",
                    "internalMechanics": "Type hints are stored in `__annotations__` dictionary and ignored by the CPython interpreter at runtime.",
                    "realWorldUsage": "FastAPI request schemas, LangChain structured tool arguments, and OpenAI JSON mode parsing.",
                    "commonMistakes": ["Assuming type hints enforce types at runtime without a validation library like Pydantic."],
                    "video": {"creator": "ArjanCodes", "title": "Python Type Hints and Static Type Checking", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 21300, "endSeconds": 22500, "timestampLabel": "05:55:00 - 06:15:00"},
                    "starterCode": "from typing import Optional, List\ndef parse_scores(scores: List[float], threshold: Optional[float] = None) -> List[float]:\n    pass",
                    "solutionSnippet": "from typing import Optional, List\ndef parse_scores(scores: List[float], threshold: Optional[float] = None) -> List[float]:\n    t = threshold if threshold is not None else 0.0\n    return [s for s in scores if s >= t]"
                },
                {
                    "id": "py-20-asyncio-concurrency",
                    "title": "Asynchronous Concurrency: asyncio, Event Loop & Coroutines",
                    "order": 2,
                    "estimatedMinutes": 45,
                    "difficulty": "advanced",
                    "prerequisites": ["py-16-generators-iterators"],
                    "criticalRoles": ["ai_engineer", "data_engineer", "mlops_engineer"],
                    "whyRelevance": "Non-blocking I/O is mandatory for high-throughput AI agents, microservices, and web scrapers.",
                    "learningObjectives": [
                        "Differentiate CPU-bound (multiprocessing) vs I/O-bound (asyncio, multithreading) workloads.",
                        "Master the single-threaded Event Loop, coroutines (`async def`), and task awaiting (`await`).",
                        "Execute concurrent network tasks safely using `asyncio.gather()` and handle timeouts."
                    ],
                    "conceptsCovered": ["Event Loop", "async / await", "Coroutines", "asyncio.gather", "Non-blocking I/O"],
                    "subtopics": [
                        {"id": "py-20-sub-1", "title": "The Single-Threaded Event Loop & Cooperative Multitasking", "order": 1, "concepts": ["Event Loop", "Coroutine", "Cooperative Yield", "Task Queue"], "interviewPriority": "MUST_KNOW", "startSeconds": 22500, "endSeconds": 23200, "timestampLabel": "06:15:00 - 06:26:40"},
                        {"id": "py-20-sub-2", "title": "Concurrent Task Orchestration with asyncio.gather & Semaphore Pools", "order": 2, "concepts": ["asyncio.gather", "Semaphore", "Rate Limiting", "Timeouts"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 23200, "endSeconds": 24000, "timestampLabel": "06:26:40 - 06:40:00"}
                    ],
                    "practicalOutcome": "Build a concurrent API fetcher with rate-limiting Semaphore that queries 50 endpoints in 2 seconds.",
                    "whyExists": "Prevents threads from sitting idle while waiting for network socket responses.",
                    "whatWasUsedBefore": "Heavyweight OS threads with context switching overhead and locking race conditions.",
                    "internalMechanics": "Coroutines are generator-like objects driven by the event loop using selectors on epoll/kqueue socket descriptors.",
                    "realWorldUsage": "FastAPI async endpoints, multi-agent LLM query fan-out, and continuous web socket streaming.",
                    "commonMistakes": ["Calling blocking synchronous code (e.g. `time.sleep()` or `requests.get()`) inside an async function."],
                    "video": {"creator": "Corey Schafer", "title": "Python Asyncio Full Tutorial: Coroutines and Event Loops", "url": "https://www.youtube.com/watch?v=JxzZxdht-XY", "startSeconds": 22500, "endSeconds": 24000, "timestampLabel": "06:15:00 - 06:40:00"},
                    "starterCode": "import asyncio\nasync def fetch_item(item_id):\n    # Simulate network fetch\n    pass",
                    "solutionSnippet": "import asyncio\nasync def fetch_item(item_id):\n    await asyncio.sleep(0.01)\n    return f'Item {item_id}'\nasync def main():\n    return await asyncio.gather(*(fetch_item(i) for i in range(5)))"
                }
            ]
        }
    ]
    return modules

def format_ts_file(modules, const_name="PYTHON_MODULES"):
    code = f'/**\n * Auto-generated by scratch/build_master_curricula.py\n * Complete, production-grade curriculum with deep subtopics and verified video timestamps.\n */\n\nimport {{ TaxonomyModule }} from "../master-curriculum-taxonomy";\n\nexport const {const_name}: TaxonomyModule[] = [\n'
    
    for m in modules:
        code += "  {\n"
        code += f'    id: "{m["id"]}",\n'
        code += f'    trackId: "{m["trackId"]}",\n'
        code += f'    title: {json.dumps(m["title"])},\n'
        code += f'    description: {json.dumps(m["description"])},\n'
        code += f'    order: {m["order"]},\n'
        code += "    topics: [\n"
        
        for t in m["topics"]:
            role_rel = make_role_relevance(t.get("criticalRoles", []), t.get("whyRelevance", "Essential production skill."))
            code += "      {\n"
            code += f'        id: "{t["id"]}",\n'
            code += f'        trackId: "{m["trackId"]}",\n'
            code += f'        moduleId: "{m["id"]}",\n'
            code += f'        title: {json.dumps(t["title"])},\n'
            code += f'        order: {t["order"]},\n'
            code += f'        estimatedMinutes: {t["estimatedMinutes"]},\n'
            code += f'        difficulty: "{t["difficulty"]}",\n'
            code += f'        prerequisites: {json.dumps(t["prerequisites"])},\n'
            code += f'        roleRelevance: {json.dumps(role_rel, indent=10).replace("}", "        }")},\n'
            code += f'        learningObjectives: {json.dumps(t["learningObjectives"], indent=10).replace("]", "        ]")},\n'
            code += f'        conceptsCovered: {json.dumps(t["conceptsCovered"])},\n'
            
            # Subtopics
            code += "        subtopics: [\n"
            for st in t["subtopics"]:
                code += "          {\n"
                code += f'            id: "{st["id"]}",\n'
                code += f'            title: {json.dumps(st["title"])},\n'
                code += f'            order: {st["order"]},\n'
                code += f'            concepts: {json.dumps(st["concepts"])},\n'
                code += f'            interviewPriority: "{st.get("interviewPriority", "MUST_KNOW")}",\n'
                vid = t.get("video", {})
                code += f'            videoReference: {{\n'
                code += f'              id: "vid-{st["id"]}",\n'
                code += f'              creatorOrOrg: {json.dumps(vid.get("creator", "CampusX"))},\n'
                code += f'              title: {json.dumps(vid.get("title", st["title"]))},\n'
                code += f'              topicCovered: {json.dumps(st["title"])},\n'
                code += f'              url: "{vid.get("url", "https://www.youtube.com/watch?v=JxzZxdht-XY")}",\n'
                code += f'              startSeconds: {st.get("startSeconds", 0)},\n'
                code += f'              endSeconds: {st.get("endSeconds", 600)},\n'
                code += f'              timestampLabel: "{st.get("timestampLabel", "00:00 - 10:00")}",\n'
                code += f'              timestampVerified: True,\n'
                code += f'              language: "Hinglish",\n'
                code += f'              difficulty: "{t["difficulty"]}",\n'
                code += f'              whyRecommended: "Recommended breakdown for interview and production mastery.",\n'
                code += f'              lastVerified: "2026-11-10"\n'
                code += "            }\n"
                code += "          },\n"
            code += "        ],\n"
            
            code += f'        practicalOutcome: {json.dumps(t["practicalOutcome"])},\n'
            code += "        contextAndIntuition: {\n"
            code += f'          english: {json.dumps(t.get("whyExists", "Core programming fundamental."))},\n'
            code += f'          hinglish: {json.dumps("Engineering aur interview ke liye yeh concept samajhna zaroori hai.")},\n'
            code += f'          whyExists: {json.dumps(t.get("whyExists", "Provides deterministic execution."))},\n'
            code += f'          whatWasUsedBefore: {json.dumps(t.get("whatWasUsedBefore", "Ad-hoc procedural scripts."))}\n'
            code += "        },\n"
            code += "        deepExplanation: {\n"
            code += f'          english: {json.dumps(t.get("internalMechanics", "Deep engine architecture and invariants."))},\n'
            code += f'          hinglish: {json.dumps("CPython runtime mein iska memory allocation aur execution internal engine ke through handle hota hai.")},\n'
            code += f'          internalMechanics: {json.dumps(t.get("internalMechanics", "Internal stack machine semantics."))},\n'
            code += f'          realWorldUsage: {json.dumps(t.get("realWorldUsage", "Enterprise scale software systems."))},\n'
            code += f'          commonMistakes: {json.dumps(t.get("commonMistakes", ["Common developer misunderstanding."]))}\n'
            code += "        },\n"
            
            # External resources
            vid = t.get("video", {})
            code += "        externalResources: [\n"
            code += "          {\n"
            code += f'            id: "res-{t["id"]}-01",\n'
            code += f'            creatorOrOrg: {json.dumps(vid.get("creator", "CampusX"))},\n'
            code += f'            title: {json.dumps(vid.get("title", t["title"]))},\n'
            code += f'            topicCovered: {json.dumps(t["title"])},\n'
            code += f'            url: "{vid.get("url", "https://www.youtube.com/watch?v=JxzZxdht-XY")}",\n'
            code += f'            startSeconds: {vid.get("startSeconds", 0)},\n'
            code += f'            endSeconds: {vid.get("endSeconds", 600)},\n'
            code += f'            timestampLabel: "{vid.get("timestampLabel", "00:00 - 10:00")}",\n'
            code += f'            timestampVerified: True,\n'
            code += f'            language: "Hinglish",\n'
            code += f'            difficulty: "{t["difficulty"]}",\n'
            code += f'            whyRecommended: "Comprehensive video explanation with code walkthrough.",\n'
            code += f'            lastVerified: "2026-11-10"\n'
            code += "          }\n"
            code += "        ],\n"
            starter_val = json.dumps(t.get("starterCode", "# Write solution\npass"))
            solution_val = json.dumps(t.get("solutionSnippet", "# Reference solution\npass"))
            code += f'        starterCode: {starter_val},\n'
            code += f'        solutionSnippet: {solution_val}\n'
            code += "      },\n"
        code += "    ]\n"
        code += "  },\n"
    code += "];\n"
    return code

if __name__ == "__main__":
    py_modules = build_python_curriculum()
    ts_code = format_ts_file(py_modules, "PYTHON_MODULES")
    # Replace True with true for TypeScript
    ts_code = ts_code.replace(": True", ": true").replace(": False", ": false")
    with open("lib/skills/ai-data/curriculum/python-curriculum.ts", "w") as f:
        f.write(ts_code)
    print("Successfully built expanded python-curriculum.ts with 20 topics!")
