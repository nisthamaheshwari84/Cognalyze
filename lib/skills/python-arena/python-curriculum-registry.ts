/**
 * lib/skills/python-arena/python-curriculum-registry.ts
 *
 * Master Curriculum Registry for Cognalyze Python Practice & Placement Arena.
 * Strictly adheres to the 7-Part Educational Hierarchy:
 * Part A: Python Foundations
 * Part B: Python Data Structures
 * Part C: Functions and Programming Techniques
 * Part D: Object-Oriented Programming
 * Part E: Intermediate and Advanced Python
 * Part F: Advanced Engineering
 * Part G: Python for Problem Solving and Placements
 *
 * Each subtopic is an independent record containing:
 * - Real worked examples with verified outputs
 * - Important definitions and syntax blueprints
 * - Common mistakes and production interview gotchas
 * - Practice questions mapping and starter code
 */

export interface SubtopicWorkedExample {
  title: string;
  code: string;
  expectedOutput: string;
  explanation: string;
}

export interface SubtopicCurriculumItem {
  id: string;
  topicId: string;
  partId: "part_a" | "part_b" | "part_c" | "part_d" | "part_e" | "part_f" | "part_g";
  partTitle: string;
  topicTitle: string;
  title: string;
  order: number;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  canonicalSkill: string;
  summary: string;
  definitions: Array<{ term: string; explanation: string }>;
  syntaxBlueprint: string;
  workedExamples: SubtopicWorkedExample[];
  commonMistakes: Array<{ mistake: string; correction: string; whyItFails: string }>;
  interviewGotchas: string[];
  revisionChecklist: string[];
  associatedQuestionIds: string[];
}

export interface PythonCurriculumTopic {
  id: string;
  partId: "part_a" | "part_b" | "part_c" | "part_d" | "part_e" | "part_f" | "part_g";
  title: string;
  order: number;
  estimatedHours: number;
  subtopics: SubtopicCurriculumItem[];
}

export interface PythonCurriculumPart {
  id: "part_a" | "part_b" | "part_c" | "part_d" | "part_e" | "part_f" | "part_g";
  title: string;
  subtitle: string;
  description: string;
  targetStage: "Foundations" | "Core Structures" | "Techniques" | "OOP" | "Advanced" | "Engineering" | "Placements";
  topics: PythonCurriculumTopic[];
}

// ── PART A: PYTHON FOUNDATIONS ───────────────────────────────────────────────
const PART_A_TOPICS: PythonCurriculumTopic[] = [
  {
    id: "top_py_intro_interpreter",
    partId: "part_a",
    title: "Introduction to Programming & CPython Architecture",
    order: 1,
    estimatedHours: 4,
    subtopics: [
      {
        id: "py-foundations-what-is-python",
        topicId: "top_py_intro_interpreter",
        partId: "part_a",
        partTitle: "Part A: Python Foundations",
        topicTitle: "Introduction to Programming & CPython Architecture",
        title: "What is Python & Design Philosophy",
        order: 1,
        difficulty: "beginner",
        canonicalSkill: "python_programming",
        summary: "Python is a high-level, dynamically-typed, interpreted language prioritizing readability, maintainability, and clean syntax as defined in PEP 20 (The Zen of Python).",
        definitions: [
          { term: "Dynamic Typing", explanation: "Types are bound to values at runtime, not to variable names during compilation." },
          { term: "CPython", explanation: "The standard reference implementation written in C that compiles Python code to bytecode and executes it via the Python Virtual Machine (PVM)." }
        ],
        syntaxBlueprint: `# Import Zen of Python\nimport this\n\n# Dynamic type assignment\nx = 42\nx = "now a string"`,
        workedExamples: [
          {
            title: "Dynamic Variable Rebinding",
            code: `val = 100\nprint(f"Initial: {val} (type: {type(val).__name__})")\nval = "Cognalyze"\nprint(f"Rebound: {val} (type: {type(val).__name__})")`,
            expectedOutput: "Initial: 100 (type: int)\nRebound: Cognalyze (type: str)",
            explanation: "Variables in Python are object references (pointers) pointing to heap-allocated PyObject structs, allowing seamless rebinding."
          }
        ],
        commonMistakes: [
          {
            mistake: "Assuming variable declaration specifies fixed memory types like C++/Java.",
            correction: "Remember variables are untyped names pointing to typed objects.",
            whyItFails: "Attempting to declare types like 'int x = 5' results in a SyntaxError."
          }
        ],
        interviewGotchas: [
          "Python compiles source code (.py) to bytecode (.pyc) before executing in the PVM eval_frame loop.",
          "The Global Interpreter Lock (GIL) serializes execution of Python bytecode across native OS threads."
        ],
        revisionChecklist: ["Dynamic typing vs Static typing", "CPython vs PyPy/Jython", "Bytecode compilation process"],
        associatedQuestionIds: ["py-q-foundations-01", "py-q-foundations-02"]
      },
      {
        id: "py-foundations-variables-types",
        topicId: "top_py_intro_interpreter",
        partId: "part_a",
        partTitle: "Part A: Python Foundations",
        topicTitle: "Introduction to Programming & CPython Architecture",
        title: "Variables, Primitive Data Types & Type Conversion",
        order: 2,
        difficulty: "beginner",
        canonicalSkill: "python_programming",
        summary: "Python provides built-in numeric types (int, float, complex), boolean (bool), and textual strings (str) with explicit casting functions (int(), float(), str(), bool()).",
        definitions: [
          { term: "Arbitrary-Precision Integers", explanation: "Python 3 ints have unbounded precision and never overflow 32-bit/64-bit limits." },
          { term: "Truthy/Falsy Evaluation", explanation: "Empty collections, 0, None, and False evaluate to False in boolean contexts; non-empty or non-zero values evaluate to True." }
        ],
        syntaxBlueprint: `num_str = "128"\nnum_int = int(num_str)\nis_active = bool(num_int)`,
        workedExamples: [
          {
            title: "Safe Type Conversion and Truthiness",
            code: `items = []\nprint("Empty list bool:", bool(items))\nnum = int("450")\nprint("Converted int plus 50:", num + 50)`,
            expectedOutput: "Empty list bool: False\nConverted int plus 50: 500",
            explanation: "Empty collections have truthiness False, which allows concise conditional statements like 'if not items:'."
          }
        ],
        commonMistakes: [
          {
            mistake: "Calling int('3.14') directly on a floating-point string representation.",
            correction: "Use int(float('3.14')) instead.",
            whyItFails: "int() expects an integer literal string; decimal points trigger a ValueError."
          }
        ],
        interviewGotchas: [
          "bool is a direct subclass of int in Python (isinstance(True, int) is True).",
          "Python small integers (-5 to 256) are interned in a static memory table during interpreter startup."
        ],
        revisionChecklist: ["Small integer caching (-5 to 256)", "float precision limits (IEEE 754)", "Implicit vs Explicit conversion"],
        associatedQuestionIds: ["py-q-foundations-03", "py-q-foundations-04"]
      },
      {
        id: "py-foundations-input-output-operators",
        topicId: "top_py_intro_interpreter",
        partId: "part_a",
        partTitle: "Part A: Python Foundations",
        topicTitle: "Introduction to Programming & CPython Architecture",
        title: "Input/Output, Arithmetic & Operator Precedence",
        order: 3,
        difficulty: "beginner",
        canonicalSkill: "python_programming",
        summary: "Standard I/O via print() and input(), alongside arithmetic (+, -, *, /, //, %, **), comparison, and logical operators with short-circuit evaluation.",
        definitions: [
          { term: "Floor Division (//)", explanation: "Divides and rounds down to the nearest integer toward negative infinity." },
          { term: "Short-Circuiting", explanation: "Logical 'and'/'or' stops evaluation as soon as the outcome is determined." }
        ],
        syntaxBlueprint: `# Floor division & power\nresult = (17 // 3) + (2 ** 4)\nprint(f"Result: {result}")`,
        workedExamples: [
          {
            title: "Floor Division with Negative Numbers",
            code: `print("7 // 3 =", 7 // 3)\nprint("-7 // 3 =", -7 // 3)`,
            expectedOutput: "7 // 3 = 2\n-7 // 3 = -3",
            explanation: "Floor division rounds toward negative infinity (-2.333 rounds down to -3), unlike C/Java which truncates toward zero."
          }
        ],
        commonMistakes: [
          {
            mistake: "Expecting / to return an integer when dividing evenly (e.g. 4 / 2).",
            correction: "Use // if an integer is required.",
            whyItFails: "/ always returns a float (4 / 2 is 2.0)."
          }
        ],
        interviewGotchas: [
          "Precedence of exponentiation (**) is higher than unary negation (-2 ** 2 is -4, while (-2) ** 2 is 4).",
          "Chained comparisons in Python: 1 < x < 10 expands to (1 < x) and (x < 10) with x evaluated only once."
        ],
        revisionChecklist: ["PEMDAS operator precedence", "Chained comparisons", "Floating-point division / vs //"],
        associatedQuestionIds: ["py-q-foundations-05", "py-q-foundations-06"]
      }
    ]
  },
  {
    id: "top_py_control_flow",
    partId: "part_a",
    title: "Conditionals, Loops & Iteration Mechanics",
    order: 2,
    estimatedHours: 5,
    subtopics: [
      {
        id: "py-foundations-conditionals",
        topicId: "top_py_control_flow",
        partId: "part_a",
        partTitle: "Part A: Python Foundations",
        topicTitle: "Conditionals, Loops & Iteration Mechanics",
        title: "Conditional Statements: if, elif, else & Guard Clauses",
        order: 1,
        difficulty: "beginner",
        canonicalSkill: "python_programming",
        summary: "Branching constructs for decision trees, guard clause architecture to eliminate deeply nested code, and ternary conditional expressions.",
        definitions: [
          { term: "Guard Clause", explanation: "A conditional check at the start of a function that returns early on failure or edge cases, avoiding nested indentation." },
          { term: "Ternary Operator", explanation: "Expression syntax: value_if_true if condition else value_if_false." }
        ],
        syntaxBlueprint: `status = "Approved" if score >= 80 else "Review"`,
        workedExamples: [
          {
            title: "Ternary and Guard Pattern",
            code: `def evaluate_age(age: int) -> str:\n    if age < 0:\n        return "Invalid"\n    return "Adult" if age >= 18 else "Minor"\n\nprint(evaluate_age(21))\nprint(evaluate_age(14))`,
            expectedOutput: "Adult\nMinor",
            explanation: "Guard clause handles boundary input instantly, cleanly separating validation from business logic."
          }
        ],
        commonMistakes: [
          {
            mistake: "Over-nesting 5+ levels of if-else ladders.",
            correction: "Flatten using early returns and dictionary mappings.",
            whyItFails: "High cyclomatic complexity makes code hard to test and debug."
          }
        ],
        interviewGotchas: [
          "Python 3.10+ introduced match/case pattern matching as an expressive structural alternative to long if-elif chains."
        ],
        revisionChecklist: ["Ternary expressions", "Guard clause pattern", "Structural pattern matching"],
        associatedQuestionIds: ["py-q-foundations-07", "py-q-foundations-08"]
      },
      {
        id: "py-foundations-loops-iteration",
        topicId: "top_py_control_flow",
        partId: "part_a",
        partTitle: "Part A: Python Foundations",
        topicTitle: "Conditionals, Loops & Iteration Mechanics",
        title: "Loops: for, while, break, continue & loop else",
        order: 2,
        difficulty: "beginner",
        canonicalSkill: "python_programming",
        summary: "Iteration using for and while loops, loop control with break and continue, range() generators, and the Python-unique 'for...else' construct.",
        definitions: [
          { term: "Loop Else Clause", explanation: "The else block executes only if the loop completes normally without encountering a break statement." },
          { term: "range(start, stop, step)", explanation: "A memory-efficient immutable sequence generator producing integers in O(1) memory." }
        ],
        syntaxBlueprint: `for num in range(2, 10, 2):\n    if num == 8:\n        break\nelse:\n    print("Completed without break")`,
        workedExamples: [
          {
            title: "Finding Primes with for-else",
            code: `def is_prime(n: int) -> bool:\n    if n <= 1:\n        return False\n    for i in range(2, int(n ** 0.5) + 1):\n        if n % i == 0:\n            break\n    else:\n        return True\n    return False\n\nprint("7 is prime:", is_prime(7))\nprint("9 is prime:", is_prime(9))`,
            expectedOutput: "7 is prime: True\n9 is prime: False",
            explanation: "The else block runs only if no divisor broke the loop, providing an elegant prime check."
          }
        ],
        commonMistakes: [
          {
            mistake: "Modifying a list while iterating over it with a for loop.",
            correction: "Iterate over a copy (items[:]) or use list comprehensions.",
            whyItFails: "Index pointers shift during removal, causing skipped elements."
          }
        ],
        interviewGotchas: [
          "range() in Python 3 does not generate a list in memory; it is a lazy generator object calculating elements on-the-fly."
        ],
        revisionChecklist: ["for...else construct semantics", "Iterating over collections safely", "Loop complexity"],
        associatedQuestionIds: ["py-q-foundations-09", "py-q-foundations-10"]
      }
    ]
  }
];

// ── PART B: PYTHON DATA STRUCTURES ──────────────────────────────────────────
const PART_B_TOPICS: PythonCurriculumTopic[] = [
  {
    id: "top_py_strings_sequences",
    partId: "part_b",
    title: "Strings, Slicing & Sequence Protocols",
    order: 3,
    estimatedHours: 5,
    subtopics: [
      {
        id: "py-structures-strings-slicing",
        topicId: "top_py_strings_sequences",
        partId: "part_b",
        partTitle: "Part B: Python Data Structures",
        topicTitle: "Strings, Slicing & Sequence Protocols",
        title: "Strings, Extended Slicing & Built-in Methods",
        order: 1,
        difficulty: "beginner",
        canonicalSkill: "core_data_structures",
        summary: "Strings are immutable sequences of Unicode codepoints supporting extended slicing [start:stop:step], split, join, strip, and formatting.",
        definitions: [
          { term: "Immutability", explanation: "String memory cannot be modified in-place; all modifications instantiate new string objects." },
          { term: "Extended Slicing", explanation: "Syntax seq[start:stop:step] where negative step reverses the traversal order." }
        ],
        syntaxBlueprint: `text = "Cognitive"\nreversed_text = text[::-1]`,
        workedExamples: [
          {
            title: "Palindrome Verification via Slicing",
            code: `word = "radar"\nis_palindrome = word == word[::-1]\nprint(f"'{word}' is palindrome: {is_palindrome}")`,
            expectedOutput: "'radar' is palindrome: True",
            explanation: "Extended slice word[::-1] creates a reversed copy in O(N) time with fast C-level memory copying."
          }
        ],
        commonMistakes: [
          {
            mistake: "Repeated string concatenation using += inside a loop.",
            correction: "Accumulate substrings in a list and use ''.join(list).",
            whyItFails: "Because strings are immutable, += creates a new string each iteration, producing O(N^2) quadratic time complexity."
          }
        ],
        interviewGotchas: [
          "Python 3 strings are internally represented using Flexible String Representation (PEP 393): 1, 2, or 4 bytes per character depending on the maximum codepoint (ASCII uses 1 byte).",
          "str.join() takes an iterable and minimizes memory allocations by pre-calculating total buffer size."
        ],
        revisionChecklist: ["Extended slicing syntax", "str.join() vs + concatenation", "String immutability"],
        associatedQuestionIds: ["py-q-structures-01", "py-q-structures-02"]
      }
    ]
  },
  {
    id: "top_py_lists_tuples",
    partId: "part_b",
    title: "Lists, Tuples & Memory Immutability",
    order: 4,
    estimatedHours: 6,
    subtopics: [
      {
        id: "py-structures-lists-methods",
        topicId: "top_py_lists_tuples",
        partId: "part_b",
        partTitle: "Part B: Python Data Structures",
        topicTitle: "Lists, Tuples & Memory Immutability",
        title: "Dynamic Arrays (Lists): Amortized O(1) Growth & Methods",
        order: 1,
        difficulty: "intermediate",
        canonicalSkill: "core_data_structures",
        summary: "Python lists are mutable dynamic arrays of contiguous object pointers, providing O(1) random indexing and amortized O(1) append via geometric resizing.",
        definitions: [
          { term: "Dynamic Array Over-allocation", explanation: "CPython allocates excess capacity (growth factor ~ 1.125 + 3) to achieve amortized O(1) appends." },
          { term: "Tuple", explanation: "An immutable sequence of object references, hashable if all elements are hashable." }
        ],
        syntaxBlueprint: `data = [10, 20, 30]\ndata.append(40)\ndata.pop()`,
        workedExamples: [
          {
            title: "List Slicing and Shallow vs Deep Copy",
            code: `original = [[1, 2], [3, 4]]\nshallow = original[:]\nshallow[0].append(99)\nprint("Original after nested mutation:", original)`,
            expectedOutput: "Original after nested mutation: [[1, 2, 99], [3, 4]]",
            explanation: "Slicing produces a shallow copy; inner container pointers are shared between original and copy. Use copy.deepcopy() for true isolation."
          }
        ],
        commonMistakes: [
          {
            mistake: "Creating a 2D matrix using [[0] * cols] * rows.",
            correction: "Use [[0 for _ in range(cols)] for _ in range(rows)].",
            whyItFails: "Multiplying the outer list duplicates the exact same inner list reference; modifying row 0 modifies all rows simultaneously."
          }
        ],
        interviewGotchas: [
          "list.insert(0, val) and list.pop(0) are O(N) operations because all elements must shift. Use collections.deque for O(1) FIFO queues.",
          "Tuples with immutable elements can be used as dictionary keys and set elements; lists cannot."
        ],
        revisionChecklist: ["Amortized O(1) list append", "Shallow vs Deep copy", "collections.deque vs list"],
        associatedQuestionIds: ["py-q-structures-03", "py-q-structures-04"]
      }
    ]
  },
  {
    id: "top_py_dicts_sets",
    partId: "part_b",
    title: "Dictionaries, Sets & Hash Table Internals",
    order: 5,
    estimatedHours: 6,
    subtopics: [
      {
        id: "py-structures-dicts-internals",
        topicId: "top_py_dicts_sets",
        partId: "part_b",
        partTitle: "Part B: Python Data Structures",
        topicTitle: "Dictionaries, Sets & Hash Table Internals",
        title: "Hash Tables: Dictionaries, Sets & Collision Resolution",
        order: 1,
        difficulty: "intermediate",
        canonicalSkill: "core_data_structures",
        summary: "CPython dicts use compact hash tables (PEP 468) maintaining insertion order with open addressing and perturbation quadratic probing for collision resolution.",
        definitions: [
          { term: "Hashability", explanation: "An object must define __hash__() and __eq__() and its hash value must remain constant across its lifetime." },
          { term: "Set", explanation: "An unordered collection of unique hashable elements supporting O(1) membership tests and mathematical set operations." }
        ],
        syntaxBlueprint: `counts = {}\nfor x in items:\n    counts[x] = counts.get(x, 0) + 1`,
        workedExamples: [
          {
            title: "Frequency Map using dict.get() and Comprehension",
            code: `words = ["apple", "banana", "apple", "cherry", "banana", "apple"]\ncounts = {}\nfor w in words:\n    counts[w] = counts.get(w, 0) + 1\nprint("Frequency map:", counts)`,
            expectedOutput: "Frequency map: {'apple': 3, 'banana': 2, 'cherry': 1}",
            explanation: "dict.get(key, default) avoids KeyErrors and updates counts cleanly in O(1) average time."
          }
        ],
        commonMistakes: [
          {
            mistake: "Using mutable types (like lists or sets) as dictionary keys.",
            correction: "Convert lists to tuples and sets to frozensets before using as keys.",
            whyItFails: "Mutable objects do not implement a constant __hash__(), raising TypeError: unhashable type."
          }
        ],
        interviewGotchas: [
          "Dictionaries in Python 3.7+ are guaranteed to maintain key insertion order as a language specification.",
          "Set lookup (x in my_set) is average O(1), whereas list lookup (x in my_list) is linear O(N)."
        ],
        revisionChecklist: ["Compact dictionary architecture", "Hash collision resolution in CPython", "Hashable requirements"],
        associatedQuestionIds: ["py-q-structures-05", "py-q-structures-06"]
      }
    ]
  }
];

// ── PART C: FUNCTIONS & PROGRAMMING TECHNIQUES ──────────────────────────────
const PART_C_TOPICS: PythonCurriculumTopic[] = [
  {
    id: "top_py_functions_scopes",
    partId: "part_c",
    title: "Function Definitions, Scope & Parameter Mechanics",
    order: 6,
    estimatedHours: 6,
    subtopics: [
      {
        id: "py-functions-params-kwargs",
        topicId: "top_py_functions_scopes",
        partId: "part_c",
        partTitle: "Part C: Functions & Techniques",
        topicTitle: "Function Definitions, Scope & Parameter Mechanics",
        title: "Positional, Keyword, *args, **kwargs & LEGB Scope",
        order: 1,
        difficulty: "intermediate",
        canonicalSkill: "python_programming",
        summary: "Functions define callable units of execution. Parameter binding supports positional-only (/), keyword-only (*), variable args (*args, **kwargs), and LEGB name resolution.",
        definitions: [
          { term: "LEGB Rule", explanation: "Name lookup order: Local -> Enclosing -> Global -> Built-in." },
          { term: "*args & **kwargs", explanation: "*args packs positional arguments into a tuple; **kwargs packs keyword arguments into a dictionary." }
        ],
        syntaxBlueprint: `def configure(name, *args, timeout=30, **kwargs):\n    pass`,
        workedExamples: [
          {
            title: "Dynamic Dispatch with *args and **kwargs",
            code: `def log_event(event_type: str, *details, **metadata):\n    print(f"[{event_type}] Details: {details} | Metadata: {metadata}")\n\nlog_event("AUTH_LOGIN", "user_102", "ip_192.168.1.1", status="success", latency_ms=14)`,
            expectedOutput: "[AUTH_LOGIN] Details: ('user_102', 'ip_192.168.1.1') | Metadata: {'status': 'success', 'latency_ms': 14}",
            explanation: "*details packs unassigned positional args into a tuple, while **metadata captures keyword arguments into a dictionary."
          }
        ],
        commonMistakes: [
          {
            mistake: "Using a mutable default argument like def append_to(item, target=[]).",
            correction: "Use def append_to(item, target=None): if target is None: target = []",
            whyItFails: "Default arguments are evaluated once at function definition time, sharing the same list across all future calls."
          }
        ],
        interviewGotchas: [
          "Default argument evaluation gotcha is one of the top 3 most frequently tested Python interview questions.",
          "Use the 'nonlocal' keyword to rebind variables in an outer enclosing closure scope without making them global."
        ],
        revisionChecklist: ["Mutable default argument trap", "LEGB name resolution", "Keyword-only parameters (*)"],
        associatedQuestionIds: ["py-q-functions-01", "py-q-functions-02"]
      },
      {
        id: "py-functions-closures-lambdas",
        topicId: "top_py_functions_scopes",
        partId: "part_c",
        partTitle: "Part C: Functions & Techniques",
        topicTitle: "Function Definitions, Scope & Parameter Mechanics",
        title: "Lambdas, First-Class Functions & Closures",
        order: 2,
        difficulty: "intermediate",
        canonicalSkill: "python_programming",
        summary: "Functions are first-class objects that can be passed as arguments, returned from other functions, and capture lexical environments as closures.",
        definitions: [
          { term: "Closure", explanation: "A function object that retains access to variables in its enclosing lexical scope even after that scope has finished execution." },
          { term: "Lambda Function", explanation: "An anonymous inline function restricted to a single expression: lambda x: x * 2." }
        ],
        syntaxBlueprint: `def make_multiplier(factor):\n    return lambda x: x * factor\n\ndouble = make_multiplier(2)`,
        workedExamples: [
          {
            title: "Stateful Closure without Classes",
            code: `def make_counter(start: int = 0):\n    count = start\n    def increment():\n        nonlocal count\n        count += 1\n        return count\n    return increment\n\ncounter = make_counter(10)\nprint("Next:", counter())\nprint("Next:", counter())`,
            expectedOutput: "Next: 11\nNext: 12",
            explanation: "The inner increment function captures 'count' via cell references in its __closure__ attribute."
          }
        ],
        commonMistakes: [
          {
            mistake: "Creating lambdas inside a loop: funcs = [lambda: i for i in range(3)].",
            correction: "Bind the current loop variable with a default arg: lambda i=i: i.",
            whyItFails: "Closures bind by reference to the variable, not by value; all lambdas look up the final loop value (2)."
          }
        ],
        interviewGotchas: [
          "Inspect function.__closure__[0].cell_contents to inspect the captured closure values in CPython.",
          "Lambdas in Python are syntactically limited to a single expression and cannot contain assignments or loops."
        ],
        revisionChecklist: ["Closure binding by reference trap in loops", "nonlocal vs global", "First-class citizen functions"],
        associatedQuestionIds: ["py-q-functions-03", "py-q-functions-04"]
      }
    ]
  }
];

// ── PART D: OBJECT-ORIENTED PROGRAMMING ─────────────────────────────────────
const PART_D_TOPICS: PythonCurriculumTopic[] = [
  {
    id: "top_py_classes_oop",
    partId: "part_d",
    title: "Classes, Objects & Dunder Methods",
    order: 7,
    estimatedHours: 6,
    subtopics: [
      {
        id: "py-oop-classes-methods",
        topicId: "top_py_classes_oop",
        partId: "part_d",
        partTitle: "Part D: Object-Oriented Programming",
        topicTitle: "Classes, Objects & Dunder Methods",
        title: "Classes, Constructors (__init__), Self & Method Types",
        order: 1,
        difficulty: "intermediate",
        canonicalSkill: "python_programming",
        summary: "Defining classes, instantiating objects, understanding instance variables vs class variables, and choosing between instance, class (@classmethod), and static (@staticmethod) methods.",
        definitions: [
          { term: "Class Method (@classmethod)", explanation: "Receives the class (cls) as its implicit first parameter; commonly used for alternative constructors." },
          { term: "Static Method (@staticmethod)", explanation: "Does not receive self or cls; behaves as a plain function namespaced inside the class." }
        ],
        syntaxBlueprint: `class User:\n    species = "Homo Sapiens"  # Class variable\n    def __init__(self, username):\n        self.username = username  # Instance variable`,
        workedExamples: [
          {
            title: "Alternative Constructors via @classmethod",
            code: `class Temperature:\n    def __init__(self, celsius: float):\n        self.celsius = celsius\n    \n    @classmethod\n    def from_fahrenheit(cls, f: float):\n        return cls((f - 32) * 5 / 9)\n\nt1 = Temperature.from_fahrenheit(212)\nprint(f"212 F in Celsius: {round(t1.celsius, 1)} C")`,
            expectedOutput: "212 F in Celsius: 100.0 C",
            explanation: "@classmethod receives cls dynamically, making it a robust factory method that supports subclassing."
          }
        ],
        commonMistakes: [
          {
            mistake: "Mutating a class variable through an instance: self.items.append(x).",
            correction: "Understand that if items is defined at class level, it is shared across all instances.",
            whyItFails: "Shared class lists cause state leakage between separate object instances."
          }
        ],
        interviewGotchas: [
          "self is not a reserved Python keyword; it is simply a PEP 8 convention for the first positional argument of an instance method.",
          "Dunder __new__ constructs and returns the new instance, while __init__ initializes its attributes."
        ],
        revisionChecklist: ["__new__ vs __init__", "Instance vs Class variables", "@classmethod vs @staticmethod"],
        associatedQuestionIds: ["py-q-oop-01", "py-q-oop-02"]
      },
      {
        id: "py-oop-inheritance-mro",
        topicId: "top_py_classes_oop",
        partId: "part_d",
        partTitle: "Part D: Object-Oriented Programming",
        topicTitle: "Classes, Objects & Dunder Methods",
        title: "Inheritance, Polymorphism & Method Resolution Order (MRO)",
        order: 2,
        difficulty: "advanced",
        canonicalSkill: "python_programming",
        summary: "Multiple inheritance, cooperative super() calls, and the C3 Linearization algorithm governing Method Resolution Order (MRO).",
        definitions: [
          { term: "MRO (Method Resolution Order)", explanation: "The deterministic ordering CPython follows to search for methods and attributes in class inheritance trees." },
          { term: "C3 Linearization", explanation: "The algorithm used since Python 2.3 guaranteeing local precedence ordering and monotonicity." }
        ],
        syntaxBlueprint: `class Child(BaseA, BaseB):\n    def __init__(self):\n        super().__init__()`,
        workedExamples: [
          {
            title: "Inspecting Class MRO",
            code: `class A: pass\nclass B(A): pass\nclass C(A): pass\nclass D(B, C): pass\n\nprint("MRO for D:", [cls.__name__ for cls in D.mro()])`,
            expectedOutput: "MRO for D: ['D', 'B', 'C', 'A', 'object']",
            explanation: "C3 linearization guarantees that direct parents are searched in order (B before C) and common ancestor A is evaluated after all subclasses."
          }
        ],
        commonMistakes: [
          {
            mistake: "Hardcoding BaseClass.__init__(self) in multiple inheritance hierarchies.",
            correction: "Always use super().__init__() to ensure cooperative multiple inheritance.",
            whyItFails: "Hardcoding calls can cause diamond-problem base classes to be initialized multiple times."
          }
        ],
        interviewGotchas: [
          "Calling super() without arguments in Python 3 automatically infers the current class and instance.",
          "If an inheritance hierarchy violates C3 linearization invariants, Python raises TypeError: Cannot create a consistent method resolution order."
        ],
        revisionChecklist: ["Diamond problem resolution", "C3 Linearization algorithm", "super() cooperative calling"],
        associatedQuestionIds: ["py-q-oop-03", "py-q-oop-04"]
      }
    ]
  }
];

// ── PART E: INTERMEDIATE & ADVANCED PYTHON ──────────────────────────────────
const PART_E_TOPICS: PythonCurriculumTopic[] = [
  {
    id: "top_py_iterators_generators",
    partId: "part_e",
    title: "Iterators, Generators & Context Managers",
    order: 8,
    estimatedHours: 6,
    subtopics: [
      {
        id: "py-advanced-generators-yield",
        topicId: "top_py_iterators_generators",
        partId: "part_e",
        partTitle: "Part E: Intermediate & Advanced Python",
        topicTitle: "Iterators, Generators & Context Managers",
        title: "Generators, yield, Generator Expressions & Lazy Evaluation",
        order: 1,
        difficulty: "advanced",
        canonicalSkill: "python_programming",
        summary: "Implementing lazy memory-efficient streams using the yield statement, understanding generator frames, and chaining data pipelines with itertools.",
        definitions: [
          { term: "Generator Function", explanation: "A function containing 'yield' that pauses execution and retains frame state between iterations." },
          { term: "Lazy Evaluation", explanation: "Computing values only when explicitly requested, reducing peak memory footprint from O(N) to O(1)." }
        ],
        syntaxBlueprint: `def fib_stream():\n    a, b = 0, 1\n    while True:\n        yield a\n        a, b = b, a + b`,
        workedExamples: [
          {
            title: "O(1) Memory Stream Generation",
            code: `def count_up(limit: int):\n    n = 1\n    while n <= limit:\n        yield n\n        n += 1\n\ngen = count_up(3)\nprint(next(gen))\nprint(next(gen))\nprint(next(gen))`,
            expectedOutput: "1\n2\n3",
            explanation: "The generator maintains its execution pointer and local variables between calls, yielding values on demand."
          }
        ],
        commonMistakes: [
          {
            mistake: "Attempting to re-iterate over an exhausted generator.",
            correction: "Generators can only be consumed once; instantiate a new generator or convert to list if reuse is needed.",
            whyItFails: "Calling next() on an exhausted generator raises StopIteration."
          }
        ],
        interviewGotchas: [
          "Generator expressions (x ** 2 for x in data) return a generator; list comprehensions [x ** 2 for x in data] build the entire list in memory immediately.",
          "yield from iterable delegates iteration to a subgenerator, passing return values and exceptions transparently."
        ],
        revisionChecklist: ["Iteration protocol (__iter__ & __next__)", "yield vs return", "yield from delegation"],
        associatedQuestionIds: ["py-q-advanced-01", "py-q-advanced-02"]
      },
      {
        id: "py-advanced-decorators-context",
        topicId: "top_py_iterators_generators",
        partId: "part_e",
        partTitle: "Part E: Intermediate & Advanced Python",
        topicTitle: "Iterators, Generators & Context Managers",
        title: "Decorators, functools.wraps & Context Managers (with statement)",
        order: 2,
        difficulty: "advanced",
        canonicalSkill: "python_programming",
        summary: "Writing function and class decorators, preserving docstrings and metadata with @functools.wraps, and implementing context managers via __enter__/__exit__ and contextlib.",
        definitions: [
          { term: "Decorator", explanation: "A higher-order function that takes another function as an argument and extends its behavior without modifying it directly." },
          { term: "Context Manager", explanation: "An object defining __enter__() and __exit__() used with the 'with' statement for deterministic resource management." }
        ],
        syntaxBlueprint: `@functools.wraps(func)\ndef wrapper(*args, **kwargs):\n    # Pre-execution\n    res = func(*args, **kwargs)\n    # Post-execution\n    return res`,
        workedExamples: [
          {
            title: "Execution Timer Decorator",
            code: `import functools, time\n\ndef time_it(func):\n    @functools.wraps(func)\n    def wrapper(*args, **kwargs):\n        t0 = time.time()\n        result = func(*args, **kwargs)\n        print(f"{func.__name__} finished")\n        return result\n    return wrapper\n\n@time_it\ndef compute():\n    return sum(range(1000))\n\nprint("Result:", compute())`,
            expectedOutput: "compute finished\nResult: 499500",
            explanation: "@functools.wraps preserves the original function's name and docstring on the wrapper."
          }
        ],
        commonMistakes: [
          {
            mistake: "Forgetting @functools.wraps on the wrapper function.",
            correction: "Always decorate wrapper with @functools.wraps(func).",
            whyItFails: "Without @functools.wraps, func.__name__ becomes 'wrapper', breaking logging and debugging tools."
          }
        ],
        interviewGotchas: [
          "The __exit__ method of a context manager receives (exc_type, exc_val, exc_tb); returning True suppresses the exception from propagating."
        ],
        revisionChecklist: ["Decorators with arguments", "@functools.wraps utility", "Deterministic cleanup with context managers"],
        associatedQuestionIds: ["py-q-advanced-03", "py-q-advanced-04"]
      }
    ]
  }
];

// ── PART F: ADVANCED ENGINEERING ───────────────────────────────────────────
const PART_F_TOPICS: PythonCurriculumTopic[] = [
  {
    id: "top_py_concurrency_profiling",
    partId: "part_f",
    title: "Concurrency, AsyncIO & Performance Optimization",
    order: 9,
    estimatedHours: 7,
    subtopics: [
      {
        id: "py-engineering-gil-threads-processes",
        topicId: "top_py_concurrency_profiling",
        partId: "part_f",
        partTitle: "Part F: Advanced Engineering",
        topicTitle: "Concurrency, AsyncIO & Performance Optimization",
        title: "The GIL, Multithreading vs Multiprocessing & AsyncIO",
        order: 1,
        difficulty: "expert",
        canonicalSkill: "python_programming",
        summary: "Understanding when to use threading (I/O bound), multiprocessing (CPU bound), and asyncio (cooperative event-loop multitasking) under CPython's GIL.",
        definitions: [
          { term: "Global Interpreter Lock (GIL)", explanation: "A mutex that protects access to Python objects, preventing multiple native threads from executing Python bytecode in parallel." },
          { term: "AsyncIO Event Loop", explanation: "A single-threaded non-blocking cooperative execution loop orchestrating coroutines via async/await." }
        ],
        syntaxBlueprint: `import asyncio\n\nasync def fetch_data():\n    await asyncio.sleep(0.01)\n    return "Loaded"`,
        workedExamples: [
          {
            title: "AsyncIO Gather for Concurrent I/O Tasks",
            code: `import asyncio\n\nasync def task(name: str, delay: float):\n    await asyncio.sleep(delay)\n    return f"Done {name}"\n\nasync def main():\n    res = await asyncio.gather(task("A", 0.01), task("B", 0.01))\n    print(res)\n\nasyncio.run(main())`,
            expectedOutput: "['Done A', 'Done B']",
            explanation: "asyncio.gather executes multiple non-blocking coroutines concurrently within a single OS thread."
          }
        ],
        commonMistakes: [
          {
            mistake: "Using multithreading (threading.Thread) to speed up CPU-bound mathematical calculations in Python.",
            correction: "Use multiprocessing.Pool or native C extensions (NumPy, Cython).",
            whyItFails: "Due to the GIL, multiple threads running CPU-bound Python bytecode will execute serially and may run slower due to thread-switching overhead."
          }
        ],
        interviewGotchas: [
          "Python 3.13 introduces experimental free-threaded (no-GIL) build options (PEP 703).",
          "Calling blocking I/O functions (e.g. time.sleep or requests.get) inside an async function blocks the entire event loop."
        ],
        revisionChecklist: ["GIL impact on CPU vs I/O bound tasks", "threading vs multiprocessing", "asyncio event loop mechanics"],
        associatedQuestionIds: ["py-q-engineering-01", "py-q-engineering-02"]
      }
    ]
  }
];

// ── PART G: PROBLEM SOLVING & PLACEMENTS ─────────────────────────────────────
const PART_G_TOPICS: PythonCurriculumTopic[] = [
  {
    id: "top_py_placement_algorithms",
    partId: "part_g",
    title: "Algorithmic Patterns, Placement Problem Solving & Complexity",
    order: 10,
    estimatedHours: 8,
    subtopics: [
      {
        id: "py-placements-two-pointers-sliding-window",
        topicId: "top_py_placement_algorithms",
        partId: "part_g",
        partTitle: "Part G: Placements & Problem Solving",
        topicTitle: "Algorithmic Patterns, Placement Problem Solving & Complexity",
        title: "Two Pointers, Sliding Window & Frequency Counting Patterns",
        order: 1,
        difficulty: "advanced",
        canonicalSkill: "algorithmic_problem_solving",
        summary: "Essential placement coding patterns: converging and parallel two pointers, dynamic and fixed-size sliding windows, and hash map frequency counting.",
        definitions: [
          { term: "Two Pointers", explanation: "A technique using two index pointers (typically left and right) to process linear arrays in O(N) time and O(1) space." },
          { term: "Sliding Window", explanation: "A subsegment of an array that expands and contracts to maintain a specific invariant in linear time." }
        ],
        syntaxBlueprint: `left = 0\nfor right in range(len(nums)):\n    # Expand window\n    while not valid:\n        # Contract window\n        left += 1`,
        workedExamples: [
          {
            title: "Maximum Subarray Sum of Size K (Fixed Sliding Window)",
            code: `def max_sum_k(nums: list[int], k: int) -> int:\n    if len(nums) < k:\n        return 0\n    window_sum = sum(nums[:k])\n    max_sum = window_sum\n    for i in range(k, len(nums)):\n        window_sum += nums[i] - nums[i - k]\n        if window_sum > max_sum:\n            max_sum = window_sum\n    return max_sum\n\nprint("Max sum size 3:", max_sum_k([2, 1, 5, 1, 3, 2], 3))`,
            expectedOutput: "Max sum size 3: 9",
            explanation: "Sliding window updates the sum in O(1) time per element by adding the arriving element and subtracting the departing element."
          }
        ],
        commonMistakes: [
          {
            mistake: "Re-computing the window sum from scratch (sum(nums[i:i+k])) in every iteration.",
            correction: "Maintain running sum: window += nums[i] - nums[i-k].",
            whyItFails: "Re-slicing and summing creates O(N * K) time complexity rather than optimal O(N)."
          }
        ],
        interviewGotchas: [
          "Sliding window problems frequently appear in Tier-1 product interviews (Amazon, Google, Microsoft, Adobe) to test optimal complexity awareness.",
          "Check array boundaries: when nums is empty or k > len(nums)."
        ],
        revisionChecklist: ["Fixed vs Dynamic sliding window", "Two pointers on sorted arrays", "Time & Space complexity analysis"],
        associatedQuestionIds: ["py-q-placements-01", "py-q-placements-02"]
      }
    ]
  }
];

// ── FULL MASTER REGISTRY ────────────────────────────────────────────────────
export const MASTER_PYTHON_CURRICULUM_PARTS: PythonCurriculumPart[] = [
  {
    id: "part_a",
    title: "Part A: Python Foundations",
    subtitle: "Architecture, Syntax, Variables, Operators & Control Flow",
    description: "Build an unshakable foundation from programming basics to CPython internals, variables, operator precedence, and conditionals.",
    targetStage: "Foundations",
    topics: PART_A_TOPICS
  },
  {
    id: "part_b",
    title: "Part B: Python Data Structures",
    subtitle: "Strings, Dynamic Arrays, Tuples, Dictionaries & Hash Tables",
    description: "Deep dive into memory layout, time complexity, and mutation semantics of Python's primary built-in data structures.",
    targetStage: "Core Structures",
    topics: PART_B_TOPICS
  },
  {
    id: "part_c",
    title: "Part C: Functions & Programming Techniques",
    subtitle: "Signatures, Arguments, *args/**kwargs, Closures & Recursion",
    description: "Master parameter binding, LEGB scope rules, lambda functions, closures, and functional programming patterns.",
    targetStage: "Techniques",
    topics: PART_C_TOPICS
  },
  {
    id: "part_d",
    title: "Part D: Object-Oriented Programming",
    subtitle: "Encapsulation, Inheritance, MRO, Polymorphism & Dunder Methods",
    description: "Design robust object architectures, understand C3 Linearization MRO, and leverage Python dunder methods.",
    targetStage: "OOP",
    topics: PART_D_TOPICS
  },
  {
    id: "part_e",
    title: "Part E: Intermediate & Advanced Python",
    subtitle: "Generators, Iterators, Decorators, Context Managers & Memory",
    description: "Harness lazy streams with yield, write production decorators with @functools.wraps, and manage resources safely.",
    targetStage: "Advanced",
    topics: PART_E_TOPICS
  },
  {
    id: "part_f",
    title: "Part F: Advanced Engineering",
    subtitle: "The GIL, Multithreading, Multiprocessing, AsyncIO & Profiling",
    description: "Engineer production-ready scalable systems handling concurrency, event loops, memory profiling, and packaging.",
    targetStage: "Engineering",
    topics: PART_F_TOPICS
  },
  {
    id: "part_g",
    title: "Part G: Python for Problem Solving and Placements",
    subtitle: "Two Pointers, Sliding Window, DP, Trees, Graphs & Coding Patterns",
    description: "Solve Tier-1 product company interview challenges with optimal asymptotic time and space complexity.",
    targetStage: "Placements",
    topics: PART_G_TOPICS
  }
];

export function getAllPythonSubtopics(): SubtopicCurriculumItem[] {
  const items: SubtopicCurriculumItem[] = [];
  for (const part of MASTER_PYTHON_CURRICULUM_PARTS) {
    for (const topic of part.topics) {
      for (const sub of topic.subtopics) {
        items.push(sub);
      }
    }
  }
  return items;
}

export function getPythonSubtopicById(subtopicId: string): SubtopicCurriculumItem | undefined {
  return getAllPythonSubtopics().find((s) => s.id === subtopicId);
}

