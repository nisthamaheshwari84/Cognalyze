/**
 * lib/skills/curriculum/subjects/python.ts
 * 
 * Comprehensive Python Core Curriculum:
 * Progresses from absolute fundamentals through advanced concepts, OOP,
 * functional programming, testing, debugging, and professional software engineering.
 */

import { CanonicalSubject } from "../types";

export const PYTHON_SUBJECT: CanonicalSubject = {
  slug: "python",
  name: "Python Core & Software Engineering",
  icon: "🐍",
  category: "Programming & Data Stack",
  tagline: "From Syntax Fundamentals to Production-Grade Architecture",
  description: "Master Python 3 from core variable bindings and memory semantics to object-oriented patterns, decorators, generators, testing, and defensive engineering.",
  estimatedHours: 40,
  prerequisites: [],
  chapters: [
    {
      slug: "python-fundamentals",
      chapterNumber: 1,
      title: "Chapter 1: Python Fundamentals & Memory Model",
      description: "Understand variables as object references, dynamic typing, primitive data types, and arithmetic precision.",
      topics: [
        {
          slug: "variables-and-memory",
          title: "Variables, References & Object Identity",
          summary: "Learn why Python variables are named pointers to objects in memory rather than memory storage boxes.",
          subtopics: [
            {
              id: "py-101",
              slug: "variables-references-and-identity",
              title: "Variables as Object Pointers & The 'is' vs '==' Paradigm",
              subjectSlug: "python",
              chapterSlug: "python-fundamentals",
              topicSlug: "variables-and-memory",
              estimatedMinutes: 25,
              difficulty: "beginner",
              canonicalSkill: "python",
              prerequisites: [],
              learningGoal: "Understand that Python variables are tags bound to heap objects and distinguish between value equality (==) and identity (is).",
              intuitiveStory: "Imagine luggage tags at an airport. If you attach two distinct tags with the label 'Flight 101' to two identical black suitcases, the suitcases have equal contents (==), but they are not the exact same suitcase (is).",
              analogy: "Variables in Python are adhesive luggage tags stuck onto objects floating in heap memory.",
              formalConcept: "In CPython, every object possesses a type, a value, and a unique identity returned by id(), corresponding to its memory address. The '==' operator invokes __eq__ to compare values, while the 'is' operator checks if id(a) == id(b).",
              productionSignificance: "Misusing 'is' for string or integer value comparison introduces intermittent bugs due to small-integer caching (-5 to 256) and string interning.",
              visualType: "memory_graph",
              mermaidDiagram: `graph LR
    subgraph Stack["Namespace (Stack)"]
        A["a"]
        B["b"]
        C["c"]
    end
    subgraph Heap["Heap Memory"]
        Obj1["[1, 2, 3]<br/>id: 0x10A<br/>refcount: 2"]
        Obj2["[1, 2, 3]<br/>id: 0x10B<br/>refcount: 1"]
    end
    A --> Obj1
    B --> Obj1
    C --> Obj2`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "Binding two names to the same mutable list",
                  explanation: "Assigning b = a copies the pointer, not the underlying array.",
                  codeOrQuery: "a = [1, 2, 3]\nb = a\nc = [1, 2, 3]\nprint(f'a == c: {a == c}, a is c: {a is c}')\nprint(f'a is b: {a is b}')",
                  outputSummary: "a == c: True, a is c: False, a is b: True"
                },
                {
                  stepNumber: 2,
                  title: "Mutating via one reference",
                  explanation: "Mutating 'b' reflects in 'a' because both variables point to the identical heap address.",
                  codeOrQuery: "b.append(4)\nprint(f'a after b mutation: {a}')",
                  outputSummary: "a after b mutation: [1, 2, 3, 4]"
                }
              ],
              audioNarrationScript: "In Python, assigning a variable does not copy data. When you write b equals a, Python simply points the label b to the existing object. Modifying the list through b modifies the same object seen by a. Always use copy or deepcopy when you require isolated state.",
              coBuildSlot: {
                slotId: "py-slot-101",
                instruction: "Complete the function clone_without_aliasing(lst) to return an independent shallow copy of lst so mutations do not mutate the input.",
                starterSnippet: "def clone_without_aliasing(lst: list) -> list:\n    # Return a new independent copy\n    return lst.copy()",
                expectedPattern: "return\\s+(lst\\.copy\\(\\)|list\\(lst\\)|lst\\[:\\])",
                hint1: "Use the list copy() method or slice syntax lst[:].",
                hint2: "Write: return lst.copy()",
                validationExplanation: "Correctly constructs a shallow copy breaking the aliased reference."
              },
              executionEnvironment: "python_sandbox",
              starterCodeOrQuery: `def clone_without_aliasing(lst: list) -> list:
    return lst.copy()

original = [10, 20, 30]
cloned = clone_without_aliasing(original)
cloned.append(40)
print("Original:", original)
print("Cloned:", cloned)
print("Are they the same object?", original is cloned)
`,
              debugFault: {
                faultId: "py-fault-101",
                title: "Accidental List Aliasing In Place Modification",
                buggyCodeOrConfig: `def append_audit_tag(records: list, tag: str) -> list:
    updated = records # Bug: aliases original list
    updated.append(tag)
    return updated`,
                correctCodeOrConfig: `def append_audit_tag(records: list, tag: str) -> list:
    updated = records.copy()
    updated.append(tag)
    return updated`,
                diagnosticHint: "records is being modified in place because updated is an alias rather than a copy.",
                explanation: "Using records.copy() ensures the caller's input list remains unmutated (pure function)."
              },
              comprehensionChecks: [
                {
                  id: "py-cc-101a",
                  question: "What is the result of evaluating: [1, 2] is [1, 2]?",
                  options: [
                    "True, because the elements are identical.",
                    "False, because each literal creates a new distinct list object in heap memory.",
                    "TypeError, because 'is' cannot be used on lists.",
                    "True, due to CPython list interning."
                  ],
                  correctIndex: 1,
                  explanation: "List literals allocate distinct objects in heap memory, so their id addresses differ."
                },
                {
                  id: "py-cc-101b",
                  question: "When should 'is' be preferred over '=='?",
                  options: [
                    "When comparing floating point numbers for precision.",
                    "When checking singleton identity, such as 'x is None' or 'x is True'.",
                    "When checking if two strings have equal length.",
                    "When sorting dictionary keys."
                  ],
                  correctIndex: 1,
                  explanation: "Singletons like None, True, and False have exactly one instance in CPython, so 'is' is the idiomatic, fastest check."
                }
              ],
              independentChallenge: {
                challengeId: "py-chal-101",
                title: "Safe Immutable State Duplicator",
                description: "Write a function isolate_state(state: dict) -> dict that returns a shallow copy of a dictionary and asserts that modifying the new dictionary does not mutate the original.",
                starterCode: `def isolate_state(state: dict) -> dict:
    # Write your solution
    return state.copy()
`,
                solutionCode: `def isolate_state(state: dict) -> dict:
    return state.copy()
`,
                testCases: [
                  {
                    input: "{'user': 'alice', 'role': 'admin'}",
                    expectedOutput: "{'user': 'alice', 'role': 'admin'}",
                    description: "Returns identical key-value mappings."
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
    },
    {
      slug: "python-data-structures",
      chapterNumber: 2,
      title: "Chapter 2: Data Structures & Collections",
      description: "Master lists, dicts, sets, tuples, list comprehensions, and O(1) hash table lookup mechanics.",
      topics: [
        {
          slug: "comprehensions-and-generators",
          title: "List, Dict & Set Comprehensions",
          summary: "Write concise, performant, and pythonic transformations without verbose accumulator loops.",
          subtopics: [
            {
              id: "py-201",
              slug: "list-comprehensions-and-filtering",
              title: "Vectorized Thinking in Pure Python: Comprehensions vs Loops",
              subjectSlug: "python",
              chapterSlug: "python-data-structures",
              topicSlug: "comprehensions-and-generators",
              estimatedMinutes: 25,
              difficulty: "beginner",
              canonicalSkill: "python",
              prerequisites: ["variables-references-and-identity"],
              learningGoal: "Construct list, dict, and set comprehensions with conditional filtering and understand bytecode performance advantages.",
              intuitiveStory: "Instead of taking items out of a pantry one by one, checking each in a bowl, and appending to a tray, an automated sorter filters and packs the items in a single pass.",
              analogy: "A comprehension is an assembly line with a built-in quality control gate.",
              formalConcept: "List comprehensions in Python execute via specialized C-level bytecode (LIST_APPEND) that avoids repeated method lookup overhead associated with explicit list.append() invocations in a Python loop.",
              productionSignificance: "Comprehensions execute 25% to 35% faster than equivalent append loops while remaining significantly more readable when expressions stay under 80 characters.",
              visualType: "memory_graph",
              mermaidDiagram: `graph LR
    In["Input Sequence: [1, 2, 3, 4, 5, 6]"] --> Cond{"Filter Gate: x % 2 == 0"}
    Cond -- "True" --> Transform["Expression: x ** 2"]
    Cond -- "False" --> Discard["Discard"]
    Transform --> Out["Output List: [4, 16, 36]"]`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "Traditional loop vs Comprehension",
                  explanation: "Comprehensions express the mathematical set builder notation: { x^2 | x in S, x even }.",
                  codeOrQuery: "nums = [1, 2, 3, 4, 5, 6]\neven_squares = [x ** 2 for x in nums if x % 2 == 0]\nprint('Even squares:', even_squares)",
                  outputSummary: "Even squares: [4, 16, 36]"
                },
                {
                  stepNumber: 2,
                  title: "Dictionary Comprehension with Inversion",
                  explanation: "Easily invert a bijective key-value map in a single readable line.",
                  codeOrQuery: "code_to_dept = {'CS': 'Computer Science', 'EE': 'Electrical Engineering'}\ndept_to_code = {v: k for k, v in code_to_dept.items()}\nprint('Inverted:', dept_to_code)",
                  outputSummary: "Inverted: {'Computer Science': 'CS', 'Electrical Engineering': 'EE'}"
                }
              ],
              audioNarrationScript: "List comprehensions replace multi-line loop templates with a single declarative expression. The syntax reads: expression, for item in iterable, if condition. Keep them readable; if you find yourself nesting three levels of loops, refactor to a standard generator function.",
              coBuildSlot: {
                slotId: "py-slot-201",
                instruction: "Complete the function extract_long_words(words, min_length) to return an uppercase list of words whose length is strictly greater than min_length.",
                starterSnippet: "def extract_long_words(words: list[str], min_length: int) -> list[str]:\n    return [w.upper() for w in words if len(w) > min_length]",
                expectedPattern: "\\[\\s*w\\.upper\\(\\)\\s+for\\s+w\\s+in\\s+words\\s+if\\s+len\\(w\\)\\s*>\\s*min_length\\s*\\]",
                hint1: "Use: [w.upper() for w in words if len(w) > min_length]",
                hint2: "Remember to apply .upper() to the target expression.",
                validationExplanation: "Correctly filters elements by length and applies uppercase string transformation."
              },
              executionEnvironment: "python_sandbox",
              starterCodeOrQuery: `def extract_long_words(words: list[str], min_length: int) -> list[str]:
    return [w.upper() for w in words if len(w) > min_length]

sample = ["python", "is", "a", "productive", "language"]
print(extract_long_words(sample, 4))
`,
              debugFault: {
                faultId: "py-fault-201",
                title: "Condition in Wrong Slot of Comprehension",
                buggyCodeOrConfig: `def filter_positives(nums: list[int]) -> list[int]:
    # Bug: Ternary placed before for-clause without else causes SyntaxError
    return [x if x > 0 for x in nums]`,
                correctCodeOrConfig: `def filter_positives(nums: list[int]) -> list[int]:
    return [x for x in nums if x > 0]`,
                diagnosticHint: "Filtering conditions belong at the end of the comprehension: [expr for item in seq if cond].",
                explanation: "Ternary expressions (a if cond else b) go before 'for', while filtering gates go after 'in sequence'."
              },
              comprehensionChecks: [
                {
                  id: "py-cc-201a",
                  question: "Why does a list comprehension generally execute faster than an explicit for-loop with list.append()?",
                  options: [
                    "Because comprehensions bypass memory allocation entirely.",
                    "Because CPython avoids repeated attribute lookups for .append and invokes optimized C-level append opcodes.",
                    "Because comprehensions run in parallel across CPU cores automatically.",
                    "Because Python converts comprehensions to Assembly language."
                  ],
                  correctIndex: 1,
                  explanation: "In an explicit loop, Python looks up 'append' on the list object on every iteration. Comprehensions use the LIST_APPEND bytecode directly."
                }
              ],
              independentChallenge: {
                challengeId: "py-chal-201",
                title: "Inverted Index Dictionary Builder",
                description: "Given a list of documents, construct an inverted word index: a dictionary mapping each word to a sorted list of unique document IDs in which it appears.",
                starterCode: `def build_inverted_index(docs: list[str]) -> dict[str, list[int]]:
    index: dict[str, list[int]] = {}
    for doc_id, text in enumerate(docs):
        for word in text.lower().split():
            if word not in index:
                index[word] = []
            if doc_id not in index[word]:
                index[word].append(doc_id)
    return index
`,
                solutionCode: `def build_inverted_index(docs: list[str]) -> dict[str, list[int]]:
    index: dict[str, list[int]] = {}
    for doc_id, text in enumerate(docs):
        for word in set(text.lower().split()):
            if word not in index:
                index[word] = []
            index[word].append(doc_id)
    return {k: sorted(v) for k, v in index.items()}
`,
                testCases: [
                  {
                    input: "['apple banana', 'banana orange', 'apple grape']",
                    expectedOutput: "{'apple': [0, 2], 'banana': [0, 1], 'grape': [2], 'orange': [1]}",
                    description: "Correctly indexes word occurrence across multiple documents."
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
    },
    {
      slug: "python-oop-and-classes",
      chapterNumber: 3,
      title: "Chapter 3: Object-Oriented Design & Encapsulation",
      description: "Master classes, inheritance, dunder methods (__repr__, __len__, __iter__), properties, and abstract base classes.",
      topics: [
        {
          slug: "dunder-methods-and-data-models",
          title: "The Python Data Model & Magic Methods",
          summary: "Implement custom objects that integrate seamlessly with Python's core protocols (len, print, iterations).",
          subtopics: [
            {
              id: "py-301",
              slug: "python-data-model-dunder-methods",
              title: "The Pythonic Protocol: __repr__, __str__, and Custom Operators",
              subjectSlug: "python",
              chapterSlug: "python-oop-and-classes",
              topicSlug: "dunder-methods-and-data-models",
              estimatedMinutes: 30,
              difficulty: "intermediate",
              canonicalSkill: "python",
              prerequisites: ["list-comprehensions-and-filtering"],
              learningGoal: "Implement __repr__, __str__, __eq__, and __add__ on custom domain models conforming to Python's object protocols.",
              intuitiveStory: "When you plug a USB cable into your laptop, your laptop doesn't care who manufactured the cable as long as it adheres to the standard USB interface protocol. Dunder methods are Python's standard hardware ports.",
              analogy: "Dunder methods are standardized plugs that let your custom classes speak native Python.",
              formalConcept: "CPython uses slot methods on type objects (tp_repr, tp_as_number) to execute built-in functions like len(obj) or str(obj). Overriding dunder methods like __repr__ defines the unambiguous developer string representation.",
              productionSignificance: "Without a valid __repr__, debugging logs in production show opaque pointers like <Object at 0x7f9a>, wasting engineering hours during incidents.",
              visualType: "memory_graph",
              mermaidDiagram: `classDiagram
    class Money {
        +int amount_cents
        +str currency
        +__repr__() str
        +__str__() str
        +__add__(other) Money
        +__eq__(other) bool
    }`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "Implementing __repr__ and __add__",
                  explanation: "Construct a Money class that supports safe addition and formatted string representation.",
                  codeOrQuery: `class Money:
    def __init__(self, amount_cents: int, currency: str = "USD"):
        self.amount_cents = amount_cents
        self.currency = currency

    def __repr__(self) -> str:
        return f"Money({self.amount_cents}, '{self.currency}')"

    def __str__(self) -> str:
        return f"\${self.amount_cents / 100:.2f} {self.currency}"

    def __add__(self, other: 'Money') -> 'Money':
        if not isinstance(other, Money) or self.currency != other.currency:
            raise ValueError("Cannot add different currencies")
        return Money(self.amount_cents + other.amount_cents, self.currency)

m1 = Money(1550)
m2 = Money(2450)
m3 = m1 + m2
print("Repr:", repr(m3))
print("Str:", str(m3))`,
                  outputSummary: "Repr: Money(4000, 'USD'), Str: $40.00 USD"
                }
              ],
              audioNarrationScript: "Implementing dunder methods makes your custom classes feel like built-in Python types. Always implement __repr__ first; it should ideally return a string that could recreate the object when passed to eval. Implement __str__ when you need user-friendly formatting.",
              coBuildSlot: {
                slotId: "py-slot-301",
                instruction: "Complete the __len__ method so that len(playlist) returns the number of tracks.",
                starterSnippet: `class Playlist:\n    def __init__(self, name: str, tracks: list[str]):\n        self.name = name\n        self.tracks = tracks\n    def __len__(self) -> int:\n        return len(self.tracks)`,
                expectedPattern: "def\\s+__len__\\s*\\(self\\)\\s*->\\s*int:\\s*return\\s+len\\(self\\.tracks\\)",
                hint1: "Define def __len__(self) -> int: and return len(self.tracks).",
                hint2: "Write: def __len__(self) -> int: return len(self.tracks)",
                validationExplanation: "Correctly satisfies Python's sequence length protocol."
              },
              executionEnvironment: "python_sandbox",
              starterCodeOrQuery: `class Playlist:
    def __init__(self, name: str, tracks: list[str]):
        self.name = name
        self.tracks = tracks

    def __len__(self) -> int:
        return len(self.tracks)

p = Playlist("Focus Beats", ["Lo-Fi 1", "Ambient Wave", "Deep Synth"])
print("Playlist length:", len(p))
`,
              debugFault: {
                faultId: "py-fault-301",
                title: "__repr__ returning non-string type",
                buggyCodeOrConfig: `class Vector:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __repr__(self):
        # Bug: __repr__ must return a string, not a tuple
        return (self.x, self.y)`,
                correctCodeOrConfig: `class Vector:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __repr__(self):
        return f"Vector({self.x}, {self.y})"`,
                diagnosticHint: "TypeError: __repr__ returned non-string (type tuple). Format as an f-string.",
                explanation: "The Python language specification strictly mandates that __repr__ and __str__ must return str."
              },
              comprehensionChecks: [
                {
                  id: "py-cc-301a",
                  question: "What is the primary architectural difference between __repr__ and __str__?",
                  options: [
                    "__str__ is for developers while __repr__ is for end-users.",
                    "__repr__ aims to be unambiguous and machine-readable for developers; __str__ is readable for users.",
                    "__repr__ cannot contain numbers, while __str__ can.",
                    "__repr__ is only invoked inside Jupyter notebooks."
                  ],
                  correctIndex: 1,
                  explanation: "The guiding rule from Python creator Guido van Rossum: __repr__ is for developers (debugging); __str__ is for end-users."
                }
              ],
              independentChallenge: {
                challengeId: "py-chal-301",
                title: "Custom Bounded Priority Queue Object",
                description: "Implement a bounded priority collection PriorityBuffer with maximum capacity that discards lower-priority items when full.",
                starterCode: `class PriorityBuffer:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.items: list[tuple[int, str]] = [] # (priority, payload)

    def push(self, priority: int, payload: str) -> None:
        self.items.append((priority, payload))
        self.items.sort(key=lambda x: x[0], reverse=True)
        if len(self.items) > self.capacity:
            self.items.pop()

    def __len__(self) -> int:
        return len(self.items)
`,
                solutionCode: `class PriorityBuffer:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.items: list[tuple[int, str]] = []

    def push(self, priority: int, payload: str) -> None:
        self.items.append((priority, payload))
        self.items.sort(key=lambda x: x[0], reverse=True)
        if len(self.items) > self.capacity:
            self.items.pop()

    def __len__(self) -> int:
        return len(self.items)
`,
                testCases: [
                  {
                    input: "cap=2, push(10, 'A'), push(30, 'B'), push(20, 'C')",
                    expectedOutput: "len=2, items=[(30, 'B'), (20, 'C')]",
                    description: "Maintains top items by priority within bounded capacity."
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

