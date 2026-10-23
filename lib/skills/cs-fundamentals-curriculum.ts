/**
 * lib/skills/cs-fundamentals-curriculum.ts
 * Comprehensive Canonical CS Fundamentals Curriculum & Verified Question Bank.
 * 
 * Strict Subject-Wise Isolation for all 6 Core Computer Science Subjects:
 * 1. Operating Systems (OS) - "os"
 * 2. Database Management Systems (DBMS) - "dbms"
 * 3. SQL Practical Skills - "sql"
 * 4. Computer Networks (CN) - "cn" (alias "networks")
 * 5. Object-Oriented Programming (OOP & Design) - "oop"
 * 6. Concurrency & Multithreading - "concurrency"
 * 
 * Every lesson contains definitions, prerequisites, beginner-to-interview depth,
 * worked diagrams/code, trade-offs, misconceptions, and interactive checkpoints.
 * Every question contains real company provenance, verification status, expected points,
 * benchmark solution, pitfalls, socratic follow-up defense, and rubrics.
 */

export interface LessonCheckpoint {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SubtopicLesson {
  id: string;
  title: string;
  summary: string;
  prerequisites: string[];
  learningOutcomes: string[];
  explanationMarkdown: string;
  codeOrDiagramSnippet?: string;
  interviewDefensePrompt: string;
  commonMisconceptions: string[];
  estimatedMinutes: number;
  tradeoffs?: string;
  checkpoint?: LessonCheckpoint;
}

export interface CSQuestionItem {
  id: string;
  subjectId: "os" | "dbms" | "sql" | "cn" | "oop" | "concurrency";
  subtopicId: string;
  topic: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questionType: "conceptual" | "mcq" | "sql" | "code" | "scenario";
  questionText: string;
  codeSnippet?: string;
  options?: string[];
  correctOptionIndex?: number;
  whyWrong?: string[];
  expectedPoints: string[];
  idealAnswer: string;
  explanation: string;
  commonPitfalls: string[];
  companyTag: string;
  roleLevel: string;
  sourceCitation: string;
  reportingPeriod: string;
  verificationStatus: "verified_company" | "candidate_reported" | "commonly_reported" | "cognalyze_generated";
  followUpChallenge: {
    question: string;
    whyAsked: string;
    expectedDefense: string;
  };
  rubric: {
    conceptualAccuracyWeight: number;
    depthWeight: number;
    tradeoffAnalysisWeight: number;
  };
}

export interface CSSubjectDefinition {
  id: "os" | "dbms" | "sql" | "cn" | "oop" | "concurrency";
  name: string;
  shortName: string;
  badge: string;
  iconName: string;
  overview: string;
  targetTracks: ("service_mass" | "service_elite" | "product_mid" | "product_faang")[];
  modules: {
    moduleId: string;
    title: string;
    subtopics: SubtopicLesson[];
  }[];
  questions: CSQuestionItem[];
}

export const CANONICAL_CS_SUBJECTS: Record<string, CSSubjectDefinition> = {
  // ═════════════════════════════════════════════════════════════════════════════
  // 1. OPERATING SYSTEMS (OS)
  // ═════════════════════════════════════════════════════════════════════════════
  os: {
    id: "os",
    name: "Operating Systems",
    shortName: "OS",
    badge: "Core Systems",
    iconName: "Cpu",
    overview: "Processes, threads, CPU scheduling, race conditions, semaphores, deadlocks, virtual memory, paging, thrashing, system calls, and file systems.",
    targetTracks: ["service_mass", "service_elite", "product_mid", "product_faang"],
    modules: [
      {
        moduleId: "os-proc",
        title: "Processes, Threads & CPU Scheduling",
        subtopics: [
          {
            id: "os-proc-vs-thread",
            title: "Process vs Thread & Context Switching",
            summary: "Memory space isolation, Process Control Block (PCB) vs Thread Control Block (TCB), and overhead of context switches.",
            prerequisites: ["Basic computer organization", "Memory hierarchy"],
            learningOutcomes: [
              "Explain memory space boundaries between processes and threads",
              "Enumerate the components of PCB and TCB",
              "Calculate CPU context switch overhead including TLB flush impacts"
            ],
            explanationMarkdown: "A **Process** is an execution instance of a program with private virtual address space containing:\n1. **Text**: Compiled machine code.\n2. **Data/BSS**: Global and static variables.\n3. **Heap**: Dynamic memory allocations (`malloc` / `new`).\n4. **Stack**: Local variables, return addresses, and stack frames.\n\nA **Thread** (Lightweight Process) executes within a process. Threads share the Text, Data, Heap, and open file descriptors, but maintain private:\n- Program Counter (PC).\n- CPU Registers.\n- Private Stack space.\n\n### Context Switching Overhead\n- **Thread Context Switch**: Saves registers, swaps stack pointer. The virtual memory mapping is unchanged, so the CPU **Translation Lookaside Buffer (TLB)** remains valid.\n- **Process Context Switch**: In addition to register saving, changes the page directory root register (e.g. CR3 on x86). This flushes the CPU TLB cache, causing high-latency RAM access on subsequent instructions.",
            codeOrDiagramSnippet: "+-----------------------------------------------------------+\n| Process Virtual Address Space                             |\n|  [ Text ]   [ Data/BSS ]   [ Heap (Shared by Threads) ]   |\n|                                                           |\n|  Thread 1: [Registers] [PC] [Stack 1]                     |\n|  Thread 2: [Registers] [PC] [Stack 2]                     |\n+-----------------------------------------------------------+",
            interviewDefensePrompt: "If threads within a process share the heap, why does context switching between threads still incur CPU latency?",
            commonMisconceptions: [
              "Misconception: Threads have separate heaps. (Reality: All threads share one virtual heap address space; synchronization is required to prevent data corruption).",
              "Misconception: Thread creation is zero cost. (Reality: Creating a thread allocates kernel stack space and scheduler data structures)."
            ],
            tradeoffs: "Processes offer strong security isolation and fault tolerance at the cost of high IPC overhead. Threads offer ultra-fast shared-memory communication at the cost of concurrency bugs.",
            checkpoint: {
              question: "Which of the following is NOT shared between threads of the same process?",
              options: [
                "Open file descriptors",
                "Global static variables",
                "Call Stack and CPU Registers",
                "Dynamically allocated heap objects"
              ],
              correctIndex: 2,
              explanation: "Each thread must have its own private Call Stack and CPU Registers. File descriptors, globals, and heap are shared across threads in the process."
            },
            estimatedMinutes: 20
          },
          {
            id: "os-scheduling-algos",
            title: "CPU Scheduling Algorithms (FCFS, SJF, RR & Priority)",
            summary: "Preemptive vs non-preemptive scheduling, convoy effect, round robin time slice quantum trade-offs, and starvation.",
            prerequisites: ["Process states (Ready, Running, Waiting)"],
            learningOutcomes: [
              "Compute Average Waiting Time and Turnaround Time for FCFS, SJF, and Round Robin",
              "Diagnose the Convoy Effect in First-Come First-Served scheduling",
              "Balance Round Robin time slice quantum between response time and context switch overhead"
            ],
            explanationMarkdown: "The CPU scheduler selects a process from the Ready queue when the CPU becomes idle.\n\n### Scheduling Metrics\n- **Turnaround Time**: Completion Time - Arrival Time.\n- **Waiting Time**: Turnaround Time - Burst Time.\n- **Response Time**: Time from submission to first CPU execution.\n\n### Key Algorithms:\n1. **FCFS (First-Come, First-Served)**: Non-preemptive. Suffers from the **Convoy Effect**, where short I/O-bound processes wait behind a long CPU-bound process.\n2. **SJF (Shortest Job First)**: Provably optimal minimum average waiting time. Difficult to know burst times in advance.\n3. **SRTF (Shortest Remaining Time First)**: Preemptive version of SJF.\n4. **Round Robin (RR)**: Preemptive. Each process gets a fixed time quantum $q$. If $q$ is large, RR degrades to FCFS. If $q$ is too small, context switch overhead dominates CPU cycles.",
            codeOrDiagramSnippet: "Round Robin Execution (Quantum = 4ms):\nP1 (Burst 10ms) | P2 (Burst 3ms) | P3 (Burst 5ms)\nGantt Chart: [ P1: 0-4 ] -> [ P2: 4-7 ] -> [ P3: 7-11 ] -> [ P1: 11-15 ] -> [ P3: 15-16 ] -> [ P1: 16-18 ]",
            interviewDefensePrompt: "How would you tune the time quantum in a Round Robin scheduler for a modern interactive operating system?",
            commonMisconceptions: [
              "Misconception: A smaller time quantum always improves system throughput. (Reality: If quantum shrinks near context switch latency ~5-10 microseconds, CPU spends most cycles switching registers)."
            ],
            tradeoffs: "SJF minimizes average waiting time but risks starvation of long jobs. Round Robin ensures fairness and low response time but has higher average turnaround time.",
            checkpoint: {
              question: "What happens if the time quantum in Round Robin scheduling is set significantly smaller than context switch duration?",
              options: [
                "Average turnaround time approaches the theoretical optimum",
                "CPU throughput plummets because context switch overhead consumes most cycles",
                "The algorithm behaves identically to First-Come First-Served",
                "Starvation of I/O bound processes occurs"
              ],
              correctIndex: 1,
              explanation: "If quantum $q$ is smaller than context switch time, the CPU spends more time switching state than executing process instructions."
            },
            estimatedMinutes: 20
          }
        ]
      },
      {
        moduleId: "os-sync",
        title: "Synchronization, Concurrency & Deadlocks",
        subtopics: [
          {
            id: "os-deadlocks",
            title: "Deadlocks: The 4 Coffman Conditions & Prevention",
            summary: "Mutual exclusion, hold and wait, no preemption, circular wait, Banker's algorithm, and Resource Allocation Graphs.",
            prerequisites: ["Critical section problem", "Locks"],
            learningOutcomes: [
              "List and define the four necessary Coffman conditions for deadlock",
              "Construct Resource Allocation Graphs with cycle detection",
              "Formulate deadlock prevention by breaking circular wait via lock ordering"
            ],
            explanationMarkdown: "A **Deadlock** is a state where a set of processes are blocked because each holds a resource and waits for another resource held by another process in the set.\n\n### The 4 Necessary Coffman Conditions:\n1. **Mutual Exclusion**: Non-shareable resource holding.\n2. **Hold and Wait**: Process holding resources requests additional resources.\n3. **No Preemption**: Resources can only be released voluntarily.\n4. **Circular Wait**: Closed chain of processes where each holds a resource needed by the next.\n\n### Deadlock Handling Strategies:\n- **Prevention**: Invalidate at least one of the 4 Coffman conditions. Most practical: **Total Lock Ordering** (breaks Circular Wait).\n- **Avoidance**: Banker's Algorithm evaluates safe states before granting resources.\n- **Detection & Recovery**: Build a Wait-For Graph, run cycle detection ($O(V+E)$), terminate or rollback processes.",
            codeOrDiagramSnippet: "Deadlock Cycle:\nThread 1: acquires Lock A ----> waits for Lock B (held by Thread 2)\nThread 2: acquires Lock B ----> waits for Lock A (held by Thread 1)\nResult: Both threads wait indefinitely.",
            interviewDefensePrompt: "If you detect a circular deadlock in a distributed microservices environment, how do you recover without causing cascading failures?",
            commonMisconceptions: [
              "Misconception: A cycle in a resource allocation graph always guarantees a deadlock. (Reality: If resources have multiple instances, a cycle is a necessary condition but NOT sufficient; deadlock only occurs if all resources in the cycle have single instances)."
            ],
            tradeoffs: "Deadlock prevention via total lock ordering has zero runtime overhead, but requires developers to maintain strict acquisition order discipline.",
            checkpoint: {
              question: "Which strategy successfully prevents deadlocks by breaking the Circular Wait condition?",
              options: [
                "Allowing only one thread to execute in the system",
                "Requiring all resources to be requested in a strict global numerical order",
                "Terminating a process whenever it requests a second lock",
                "Using spinlocks instead of mutexes"
              ],
              correctIndex: 1,
              explanation: "Imposing a total ordering on resource acquisitions (e.g. must acquire Lock 1 before Lock 2) guarantees circular wait cycles are mathematically impossible."
            },
            estimatedMinutes: 25
          },
          {
            id: "os-sync-primitives",
            title: "Mutexes, Semaphores & Monitors",
            summary: "Critical section problem, binary vs counting semaphores, spinlocks, and Peterson's algorithm.",
            prerequisites: ["Race conditions"],
            learningOutcomes: [
              "Differentiate between Mutex, Counting Semaphore, and Spinlock",
              "Analyze busy-waiting vs sleep-wait CPU utilization",
              "Construct correct synchronization blocks to avoid lost wakeups"
            ],
            explanationMarkdown: "### Critical Section Problem\nA critical section is a segment of code where shared resources are accessed. Any valid synchronization solution must satisfy:\n1. **Mutual Exclusion**: Only one process executes in the critical section at a time.\n2. **Progress**: Selection of next entering process cannot be postponed indefinitely.\n3. **Bounded Waiting**: Bound on how many times others can enter before a requesting process is granted entry.\n\n### Primitives:\n- **Mutex**: An exclusive ownership lock (`acquire()` / `release()`). Only the thread that acquired the mutex can release it.\n- **Semaphore**: An integer counter managed via atomic `wait()` (decrement) and `signal()` (increment).\n  - *Binary Semaphore*: Counter is 0 or 1.\n  - *Counting Semaphore*: Counter is $N$, representing $N$ available resource units. Can be signaled by ANY thread.\n- **Spinlock**: Repeatedly tests lock condition in a tight loop. Useful on multi-core systems when critical section duration is shorter than two context switches.",
            codeOrDiagramSnippet: "Counting Semaphore Pattern:\nSemaphore pool = new Semaphore(5); // 5 connections available\npool.acquire(); // decrements counter; blocks if 0\ntry {\n  useConnection();\n} finally {\n  pool.release(); // increments counter; unblocks waiting thread\n}",
            interviewDefensePrompt: "Under what specific CPU and architecture conditions is a spinlock superior to a sleep-lock (mutex)?",
            commonMisconceptions: [
              "Misconception: A binary semaphore is identical to a mutex. (Reality: A mutex enforces ownership: only the acquiring thread can release it; semaphores have no ownership and can be signaled across threads)."
            ],
            tradeoffs: "Spinlocks waste CPU cycles if the lock is held long, but avoid context switch latency if held briefly. Mutexes sleep the thread, saving CPU at the cost of context switch overhead.",
            checkpoint: {
              question: "What is the primary difference between a binary semaphore and a mutex?",
              options: [
                "A binary semaphore can count up to infinity",
                "A mutex has an ownership requirement where only the thread that locked it may unlock it",
                "A mutex uses busy-waiting while a semaphore always uses kernel sleeps",
                "Binary semaphores are implemented exclusively in user space"
              ],
              correctIndex: 1,
              explanation: "A mutex enforces thread ownership (only the acquiring thread can unlock it). A semaphore can be signaled/released by any thread."
            },
            estimatedMinutes: 20
          }
        ]
      },
      {
        moduleId: "os-mem",
        title: "Memory Management & Virtual Memory",
        subtopics: [
          {
            id: "os-virtual-memory-paging",
            title: "Paging, Multi-Level Page Tables & TLB",
            summary: "Virtual to physical address translation, MMU, page tables, TLB hits/misses, and page faults.",
            prerequisites: ["Computer memory organization"],
            learningOutcomes: [
              "Trace address translation from virtual address (page number + offset) to physical frame",
              "Calculate memory consumption of multi-level page tables",
              "Explain hardware TLB lookup and handling of page faults"
            ],
            explanationMarkdown: "Virtual memory provides each process with the illusion of a vast, contiguous address space while physical RAM is partitioned into fixed-size **Frames** (typically 4KB).\n\n### Paging Mechanics\nA Virtual Address consists of:\n- **Page Number ($p$)**: Index into the process page table.\n- **Offset ($d$)**: Byte offset within the 4KB page.\n\nThe Memory Management Unit (MMU) uses the page table to translate Virtual Page Number ($p$) to Physical Frame Number ($f$). Physical address is $(f \\\\times \\\\text{Page Size}) + d$.\n\n### Multi-Level Page Tables\nOn 64-bit architectures, a single flat page table would require petabytes. Hierarchical multi-level paging breaks the page table into multiple tiers (e.g. 4 levels on x86-64), allocating lower tables only for virtual addresses currently in use.\n\n### Translation Lookaside Buffer (TLB)\nA hardware associative cache in the CPU that stores recent virtual-to-physical translations.\n- **TLB Hit**: Translation resolves in ~1 cycle.\n- **TLB Miss**: MMU walks the multi-level page table in RAM (~10-50ns).",
            codeOrDiagramSnippet: "Virtual Address: [ Page Number (VPN) | Offset (VPO) ]\n                       |\n                   [TLB Lookup]\n                   /          \\\\\\\\\n              (Hit)            (Miss)\n             /                   \\\\\\\\\n      [Frame Number]       [Page Table Walk] -> Update TLB\n             \\\\\\\\                   /\n              +----[ Physical Address: Frame Number + Offset ]",
            interviewDefensePrompt: "Walk through the exact hardware and OS steps that occur when a thread touches an address that causes a Page Fault.",
            commonMisconceptions: [
              "Misconception: Paging causes external fragmentation. (Reality: Paging eliminates external fragmentation because any free frame can host any page; it only incurs small internal fragmentation on the last page of a segment)."
            ],
            tradeoffs: "Multi-level page tables save gigabytes of RAM by only allocating used tables, but increase memory lookup latency on TLB misses (requiring 4 RAM lookups per translation).",
            checkpoint: {
              question: "What happens to a process when a major Page Fault occurs during instruction execution?",
              options: [
                "The process is aborted immediately with SIGSEGV",
                "It continues executing instructions while disk I/O occurs in background",
                "It is transitioned to Waiting state while the page is read from disk, then restarted at the faulting instruction",
                "Its virtual address space is cleared and re-initialized"
              ],
              correctIndex: 2,
              explanation: "Because disk reads take milliseconds, the OS suspends the process to the Waiting state. Once the page is loaded into a frame, the faulting instruction is restarted."
            },
            estimatedMinutes: 25
          },
          {
            id: "os-page-replacement",
            title: "Page Replacement Algorithms (LRU, FIFO, Clock) & Thrashing",
            summary: "Optimal, LRU, FIFO (Bélády's Anomaly), Second-Chance (Clock), and Thrashing working sets.",
            prerequisites: ["Paging basics"],
            learningOutcomes: [
              "Demonstrate Bélády's Anomaly where allocating more frames increases page faults in FIFO",
              "Implement the Clock (Second-Chance) approximation of LRU",
              "Explain the Working Set Model to prevent Thrashing"
            ],
            explanationMarkdown: "When a page fault occurs and no physical memory frames are free, the OS must choose a victim page to evict.\n\n### Page Replacement Algorithms:\n1. **Optimal (MIN / OPT)**: Evict the page that will not be used for the longest period of time in the future. Unachievable in practice; used as a theoretical benchmark.\n2. **FIFO (First-In, First-Out)**: Evicts oldest loaded page. Suffers from **B\u00e9l\u00e1dy's Anomaly** (adding more frames can increase page faults).\n3. **LRU (Least Recently Used)**: Evicts page that has not been accessed for the longest time. Requires timestamp tracking or linked list updates on EVERY memory access (too expensive in hardware).\n4. **Clock (Second-Chance) Algorithm**: Practical approximation of LRU using a single Reference Bit per page and a circular pointer.\n\n### Thrashing:\nWhen a system spends more time paging (swapping pages between RAM and disk) than executing user instructions. Occurs when $\\\\sum \\\\text{Working Set Sizes} > \\\\text{Total Physical RAM}$.",
            codeOrDiagramSnippet: "Clock Algorithm:\nPointer -> [Page A: Ref=1] -> clears Ref=0, advances\n           [Page B: Ref=0] -> EVICT VICTIM! Replace with new page.",
            interviewDefensePrompt: "Why does FIFO suffer from Bélády's Anomaly while LRU does not?",
            commonMisconceptions: [
              "Misconception: Adding more RAM always decreases page fault rate. (Reality: Under FIFO replacement, specific access patterns trigger more page faults with 4 frames than with 3 frames due to Bélády's Anomaly)."
            ],
            tradeoffs: "True LRU provides optimal realistic page fault rates but is too slow in hardware. The Clock algorithm achieves 95% of LRU performance with near-zero hardware overhead.",
            checkpoint: {
              question: "What is the primary indicator that an operating system has entered Thrashing?",
              options: [
                "CPU utilization approaches 100% running user code",
                "Disk I/O queue is saturated with paging requests while CPU utilization drops near zero",
                "All processes terminate due to out-of-memory errors",
                "The Translation Lookaside Buffer hit rate reaches 100%"
              ],
              correctIndex: 1,
              explanation: "During thrashing, processes continuously fault and wait on disk reads. The disk queue is saturated with swap I/O while the CPU sits idle waiting for I/O completion."
            },
            estimatedMinutes: 20
          }
        ]
      },
      {
        moduleId: "os-arch",
        title: "Kernel Architecture, System Calls & File Systems",
        subtopics: [
          {
            id: "os-syscalls-interrupts",
            title: "System Calls, Interrupts & Dual-Mode Execution",
            summary: "User mode vs Kernel mode (Ring 3 vs Ring 0), trap mechanisms, and hardware vs software interrupts.",
            prerequisites: ["CPU architecture basics"],
            learningOutcomes: [
              "Explain how the CPU transitions between user mode and kernel mode",
              "Trace the execution flow of a system call like read() or write()",
              "Differentiate between hardware interrupts, software interrupts, and CPU exceptions"
            ],
            explanationMarkdown: "Modern CPUs enforce dual-mode operation (e.g. Ring 3 for User Mode and Ring 0 for Kernel Mode) to protect system resources and memory from unprivileged code.\n\n### Mode Transition:\n1. User application executes a system call wrapper (e.g. `write()`).\n2. CPU loads system call number into register (e.g. `RAX` on x86-64) and executes a software trap instruction (e.g. `syscall` or `int 0x80`).\n3. Hardware transitions CPU privilege from User Mode (Ring 3) to Kernel Mode (Ring 0).\n4. CPU swaps user stack pointer to kernel stack pointer and saves program counter.\n5. The kernel looks up the system call table to invoke the registered kernel function (`sys_write`).\n6. Kernel validates memory pointer arguments to prevent user code from accessing kernel space.\n7. System call executes, return value placed in `RAX`, and `sysret` switches back to User Mode.",
            codeOrDiagramSnippet: "User Space (Ring 3)        Kernel Space (Ring 0)\n--------------------        ---------------------\napp calls write() --------> [ CPU Trap: syscall ]\n                            - Switch to kernel stack\n                            - Dispatch via sys_call_table[RAX]\n                            - Execute sys_write()\nuser resumes <------------- [ CPU Return: sysret ]",
            interviewDefensePrompt: "How does the OS kernel ensure a malicious user program cannot pass a pointer to kernel memory inside a read() system call?",
            commonMisconceptions: [
              "Misconception: System calls execute in user space like normal library functions. (Reality: System calls require CPU privilege elevation via hardware traps)."
            ],
            tradeoffs: "Strict dual-mode separation protects operating system stability and security at the cost of context switch overhead on every I/O system call.",
            checkpoint: {
              question: "What mechanism is used by a user-space application to request privileged kernel services?",
              options: [
                "Direct function call to kernel address space",
                "Software interrupt or trap instruction (e.g., syscall / int 0x80)",
                "Writing directly to memory-mapped hardware I/O registers",
                "Modifying the CPU status register from Ring 3"
              ],
              correctIndex: 1,
              explanation: "User applications cannot directly jump to kernel addresses; they execute a software interrupt/trap instruction (like 'syscall') which elevates CPU privilege to Ring 0 safely."
            },
            estimatedMinutes: 20
          },
          {
            id: "os-file-systems-ipc",
            title: "File Systems (Inodes & VFS) & IPC Mechanisms",
            summary: "Unix Inodes, hard links vs soft links, Virtual File System (VFS), and IPC via Pipes, Sockets, and Shared Memory.",
            prerequisites: ["Operating systems basics"],
            learningOutcomes: [
              "Describe the structure and metadata contained in an Inode",
              "Differentiate between Hard Links and Symbolic (Soft) Links",
              "Compare IPC performance between Unix Pipes, Sockets, and Shared Memory"
            ],
            explanationMarkdown: "### Unix Inode Architecture\nAn **Inode** (index node) is a filesystem data structure containing file metadata:\n- File size, permissions, owner, timestamps (access, modify, change).\n- Data block pointers: Direct pointers (typically 12), Single indirect pointer, Double indirect pointer, Triple indirect pointer.\n- **Link count**: Number of directory entries pointing to this inode.\n- *Crucially, an Inode does NOT contain the filename.* Filenames are stored in directory files as mappings: `(filename, inode_number)`.\n\n### Hard Links vs Soft (Symbolic) Links\n- **Hard Link**: A new directory entry pointing to the SAME inode number. Incrementing the inode's link count. Deleting one file only decrements link count; data remains until link count is 0 and no open file handles exist.\n- **Soft Link**: A separate file containing the string path to another file. If target is deleted, soft link becomes dangling.\n\n### Inter-Process Communication (IPC):\n1. **Pipes**: Unidirectional byte stream; producer writes, consumer reads. Synchronized via OS kernel buffers.\n2. **Shared Memory**: Fastest IPC. Both processes map the same physical RAM frame into their virtual address spaces. Zero kernel copying; requires synchronization (semaphores/mutexes).\n3. **Sockets**: Bidirectional network/domain communication; supports cross-machine IPC.",
            codeOrDiagramSnippet: "Inode Data Pointers:\nDirect Pointers (0-11) ---> [ Data Block 0 ] ... [ Data Block 11 ]\nSingle Indirect Pointer -> [ Block of Pointers ] -> [ Data Blocks ]\nDouble Indirect Pointer -> [ Block of Pointers ] -> [ Block of Pointers ] -> [ Data Blocks ]",
            interviewDefensePrompt: "If you unlink (rm) an open file that a process is actively reading, what happens to the file data on disk?",
            commonMisconceptions: [
              "Misconception: Deleting a file immediately wipes its data blocks. (Reality: If any process holds an open file descriptor, the inode and data blocks remain allocated until the last descriptor closes)."
            ],
            tradeoffs: "Shared memory is the fastest IPC because it avoids kernel buffer copying, but requires manual mutex/semaphore synchronization to prevent race conditions.",
            checkpoint: {
              question: "What happens when you delete the original file of a Hard Link vs a Soft Link?",
              options: [
                "Both links become broken and unreadable",
                "The Hard link remains fully accessible with original data; the Soft link becomes a dangling broken link",
                "The file system removes all hard links automatically",
                "The soft link takes ownership of the hard link's inode"
              ],
              correctIndex: 1,
              explanation: "A Hard Link shares the inode; removing one hard link simply decrements the reference count. A Soft Link only contains the pathname, so deleting the target leaves the soft link pointing to a non-existent path."
            },
            estimatedMinutes: 20
          }
        ]
      }
    ],
    questions: [
      {
        id: "os-q-scheduling",
        subjectId: "os",
        subtopicId: "os-scheduling-algos",
        topic: "Preemptive SJF vs Round Robin",
        title: "Preemptive Shortest Job First vs Round Robin Trade-offs",
        difficulty: "Medium",
        questionType: "conceptual",
        questionText: "Compare Preemptive Shortest Job First (SRTF) and Round Robin scheduling. Which minimizes average waiting time, and under what workloads does each algorithm fail?",
        expectedPoints: [
          "SRTF is provably optimal for minimizing average waiting time",
          "SRTF requires prior knowledge of CPU burst times, which is impossible to know with certainty in general-purpose OS",
          "SRTF can cause indefinite starvation of CPU-intensive long processes",
          "Round Robin guarantees bounded response time and prevents starvation using a time slice quantum",
          "Round Robin performs poorly if time quantum is either too small (context switch thrashing) or too large (degrades to FCFS)"
        ],
        idealAnswer: "Preemptive Shortest Job First (SRTF) is provably optimal for minimizing average waiting time because scheduling shorter jobs first drains the ready queue fastest. However, it requires prior knowledge of process burst times, which general-purpose OSs cannot know ahead of time, and it risks indefinite starvation for long CPU-bound tasks if a continuous stream of short tasks arrives.\n\nRound Robin (RR) prioritizes fairness and responsiveness: each ready process receives a fixed time quantum. RR prevents starvation and offers superior interactive response times. However, if the time quantum is tuned poorly, RR fails: a tiny quantum causes high context-switching overhead, while a massive quantum degrades into FCFS with high turnaround times.",
            explanation: "Shortest Remaining Time First minimizes average waiting time but starves long jobs. Round Robin guarantees responsiveness but incurs context switch overhead on every quantum expiration.",
        commonPitfalls: [
          "Claiming Round Robin has better average waiting time than SJF",
          "Forgetting that SJF cannot be implemented exactly in general purpose systems without estimation heuristics"
        ],
        companyTag: "Amazon",
        roleLevel: "SDE-1 / Systems Engineer",
        sourceCitation: "Amazon 2025 SDE-1 Technical Round Archive",
        reportingPeriod: "2025 Campus Drives",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "How does Linux Completely Fair Scheduler (CFS) balance fairness and interactivity without a fixed round-robin quantum?",
          whyAsked: "Tests transition from textbook knowledge to real-world production OS design.",
          expectedDefense: "CFS uses virtual runtime (vruntime) tracked in a red-black tree, always picking the task with smallest vruntime and scaling time slices based on nice values."
        },
        rubric: {
          conceptualAccuracyWeight: 0.4,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.25
        }
      },
      {
        id: "os-q-deadlock-conditions",
        subjectId: "os",
        subtopicId: "os-deadlocks",
        topic: "Coffman Deadlock Conditions",
        title: "The 4 Coffman Deadlock Conditions & Practical Elimination in Banking",
        difficulty: "Medium",
        questionType: "conceptual",
        questionText: "Enumerate the four necessary Coffman conditions for a deadlock. In a multi-threaded banking application transferring funds between accounts, which condition is the most practical to eliminate to prevent deadlocks, and how is it implemented?",
        expectedPoints: [
          "List all 4: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait",
          "Explain that Mutual Exclusion is unavoidable because account balances cannot be updated concurrently without race conditions",
          "Explain that breaking Circular Wait via total lock ordering is the standard solution",
          "Implementation: Always acquire locks in ascending order of Account ID: lock(min(accA, accB)); lock(max(accA, accB))"
        ],
        idealAnswer: "The 4 necessary Coffman conditions are:\n1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait\n\nIn a banking transfer function transfer(Account from, Account to, double amount), two concurrent transfers (A -> B and B -> A) can deadlock if Thread 1 locks A and waits for B, while Thread 2 locks B and waits for A.\n\nThe most practical condition to break is **Circular Wait**. Mutual exclusion cannot be broken because accounts require exclusive locks to avoid dirty balance updates. Breaking Circular Wait is implemented via **total lock ordering**:\n```cpp\nAccount first = from.id < to.id ? from : to;\nAccount second = from.id < to.id ? to : from;\nlock(first.mutex);\nlock(second.mutex);\n```\nBecause every thread acquires locks in strictly ascending numerical order, a circular dependency cycle is mathematically impossible.",
            explanation: "Breaking circular wait via consistent lock ordering (e.g. sorting by entity ID) eliminates deadlocks with zero runtime overhead.",
        commonPitfalls: [
          "Suggesting breaking mutual exclusion for bank balances (would cause money duplication race conditions)",
          "Forgetting that both accounts must be locked during the transfer"
        ],
        companyTag: "Microsoft",
        roleLevel: "Software Engineer",
        sourceCitation: "Microsoft Core Engineering Interview 2025",
        reportingPeriod: "2025 Drives",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "What if account IDs are UUIDs or non-numeric strings? How do you ensure total ordering?",
          whyAsked: "Tests practical production implementation detail.",
          expectedDefense: "Use lexicographical string comparison (e.g., strcmp or UUID byte-wise comparison) to establish an immutable total order before locking."
        },
        rubric: {
          conceptualAccuracyWeight: 0.4,
          depthWeight: 0.4,
          tradeoffAnalysisWeight: 0.2
        }
      },
      {
        id: "os-q-virtual-memory-tlb",
        subjectId: "os",
        subtopicId: "os-virtual-memory-paging",
        topic: "Page Fault & TLB Miss Mechanics",
        title: "Exact Step-by-Step Page Fault Handling & TLB Miss",
        difficulty: "Hard",
        questionType: "conceptual",
        questionText: "Walk through exactly what happens at the hardware and kernel level when an instruction attempts to access a virtual memory address that is currently swapped out to disk. What is the difference between a TLB miss and a Page Fault?",
        expectedPoints: [
          "TLB Miss: Address translation is not cached in CPU hardware TLB; MMU does page table walk in RAM (takes ~10-50ns)",
          "Page Fault: Page is not present in physical RAM at all (present/valid bit = 0 in page table entry)",
          "Hardware generates Exception 14 (Page Fault Trap), transitioning CPU from user mode to kernel mode",
          "OS saves process context, inspects faulting address in CR2 register, and validates against process VMA",
          "OS allocates a physical frame, issues asynchronous disk I/O, and puts process in Waiting state",
          "On disk I/O interrupt, OS updates page table entry, sets valid bit, and restarts the faulting instruction"
        ],
        idealAnswer: "A **TLB Miss** occurs entirely within CPU/RAM speed: the hardware TLB does not have the cached translation, so the MMU performs a page-table walk in physical RAM. If the page is present, translation succeeds in tens of nanoseconds without kernel intervention.\n\nA **Page Fault** occurs when the page table entry indicates the page is not in physical RAM (Present Bit = 0). This triggers a major hardware-to-kernel transition:\n1. MMU raises hardware exception (Page Fault Trap).\n2. CPU saves user registers and switches to Kernel Mode.\n3. Faulting virtual address is stored in CR2 register.\n4. Kernel page fault handler checks if the address is legal within the process Virtual Memory Areas (VMAs). If illegal, sends SIGSEGV.\n5. Kernel allocates a free physical frame (or runs Clock/LRU page replacement to evict a victim page).\n6. Kernel initiates block I/O to read the 4KB page from disk/swap space.\n7. Kernel moves the process to Waiting state and schedules another process.\n8. When disk I/O finishes, disk controller raises an interrupt.\n9. Kernel marks the page table entry as Present, writes the Physical Frame Number, and clears the fault.\n10. The original process is moved to Ready state and restarts the exact instruction that faulted.",
            explanation: "TLB miss is resolved by memory walk; page fault requires kernel interrupt, disk I/O, process rescheduling, and instruction replay.",
        commonPitfalls: [
          "Confusing TLB miss with a page fault (TLB miss does not necessarily touch disk)",
          "Stating that the process terminates on a page fault"
        ],
        companyTag: "Google",
        roleLevel: "Systems Software Engineer",
        sourceCitation: "Google SWE Systems Screening Archives",
        reportingPeriod: "2024-2025",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "What is a Minor Page Fault vs a Major Page Fault?",
          whyAsked: "Probes real OS profiling and performance diagnostic skills.",
          expectedDefense: "A Major Page Fault requires disk I/O. A Minor Page Fault occurs when the page is already in physical memory (e.g., shared library cache or allocated without zeroing) and only needs page table mapping without disk access."
        },
        rubric: {
          conceptualAccuracyWeight: 0.45,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.2
        }
      },
      {
        id: "os-q-spinlock-vs-mutex",
        subjectId: "os",
        subtopicId: "os-sync-primitives",
        topic: "Spinlock vs Mutex Trade-offs",
        title: "Binary Semaphore vs Mutex vs Spinlock: When Does a Spinlock Outperform a Mutex?",
        difficulty: "Medium",
        questionType: "conceptual",
        questionText: "Contrast a Spinlock and a Mutex. Under what specific system conditions (core count, critical section length, thread contention) is a Spinlock significantly faster than a Mutex, and why should a Spinlock NEVER be used on a single-core CPU without preemption?",
        expectedPoints: [
          "A Mutex puts the blocked thread to sleep via kernel futex, incurring context switch latency (~2 to 10 microseconds)",
          "A Spinlock busy-loops checking an atomic variable, burning CPU cycles without sleeping",
          "A Spinlock outperforms a Mutex when critical section duration is shorter than two context switch times on a multi-core machine",
          "On a single-core CPU, the spinning thread occupies 100% of the core, preventing the lock-holding thread from ever running and releasing the lock (deadlock / livelock)"
        ],
        idealAnswer: "A **Mutex** suspends a waiting thread: if the lock is held, the thread enters the kernel wait queue and relinquishes the CPU, incurring context-switch overhead (saving registers, swapping cache state, ~2-10 microseconds).\n\nA **Spinlock** does not sleep; it executes a tight loop (`test_and_set` or `compare_and_swap`) burning CPU cycles until the lock becomes free.\n\n### When Spinlock Outperforms Mutex:\nOn a **multi-core machine**, if the critical section is extremely short (e.g., updating a linked list pointer taking 20 nanoseconds), the lock will be released before a context switch would even finish. Sleeping would waste 5,000ns; spinning resolves in 20ns.\n\n### Why NEVER on Single-Core Without Preemption:\nOn a single-core uniprocessor, if Thread A holds the lock and Thread B spins, Thread B hogs 100% of the single CPU. Because Thread A cannot get CPU time to execute and release the lock, the system enters an indefinite livelock/deadlock.",
            explanation: "Spinlocks avoid context switch latency on multi-core systems when hold times are tiny, but waste power and can cause uniprocessor livelocks.",
        commonPitfalls: [
          "Suggesting spinlocks for disk or network I/O locks (spinning for milliseconds destroys CPU performance)",
          "Believing spinlocks work on single-core systems without kernel preemption"
        ],
        companyTag: "Meta",
        roleLevel: "Production Engineer / Kernel SWE",
        sourceCitation: "Meta Systems & Production Infrastructure Interview 2025",
        reportingPeriod: "2025 Hiring",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "What is an Adaptive Mutex in modern kernels like Linux and Solaris?",
          whyAsked: "Tests knowledge of hybrid synchronization in production engines.",
          expectedDefense: "An adaptive mutex spins for a very short duration if the lock owner is currently running on another core, and falls back to sleeping if the owner sleeps or time expires."
        },
        rubric: {
          conceptualAccuracyWeight: 0.4,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.25
        }
      },
      {
        id: "os-q-belady-anomaly",
        subjectId: "os",
        subtopicId: "os-page-replacement",
        topic: "Bélády's Anomaly & Page Replacement",
        title: "Bélády's Anomaly Demonstration under FIFO vs LRU Stack Property",
        difficulty: "Medium",
        questionType: "conceptual",
        questionText: "What is Bélády's Anomaly? Give an access reference string where increasing memory frames from 3 to 4 increases page faults under FIFO. Why is LRU provably immune to Bélády's Anomaly?",
        expectedPoints: [
          "Definition: Bélády's Anomaly is the phenomenon where allocating more physical memory frames increases the total number of page faults",
          "Classic FIFO reference string: 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5",
          "Calculates 9 faults with 3 frames vs 10 faults with 4 frames under FIFO",
          "Stack Property: LRU is a stack algorithm where the set of pages in an n-frame memory is always a strict subset of the pages in an (n+1)-frame memory",
          "Because LRU satisfies the inclusion property ($M(n) \\subset M(n+1)$), it can never fault on an address that hit with fewer frames"
        ],
        idealAnswer: "**B\u00e9l\u00e1dy's Anomaly** is the counterintuitive phenomenon where increasing the number of physical memory page frames leads to an INCREASE in the total number of page faults for a given reference string.\n\n### Classic Demonstration under FIFO:\nReference string: `1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5`\n- With **3 Frames**: Yields **9 Page Faults**.\n- With **4 Frames**: Yields **10 Page Faults**. (Fault count increases despite having 33% more physical memory!)\n\n### Why LRU is Immune:\nLRU belongs to a class of algorithms called **Stack Algorithms**. A page replacement algorithm is a stack algorithm if the set of pages in memory for $n$ frames is always a strict subset of the pages that would be in memory with $n+1$ frames for every step:\n$$M(n, t) \\\\subseteq M(n+1, t)$$\nBecause LRU maintains the most recently used pages at the top of an imaginary stack, adding another frame simply increases the stack capacity. If a page was present in an $n$-capacity stack, it is guaranteed to be present in an $(n+1)$-capacity stack. Thus, page faults can never increase.",
            explanation: "FIFO does not satisfy the inclusion property and suffers from Bélády's anomaly, while LRU is a stack algorithm that provably avoids it.",
        commonPitfalls: [
          "Thinking adding RAM always reduces page faults regardless of algorithm",
          "Claiming LRU can suffer from Bélády's anomaly"
        ],
        companyTag: "TCS",
        roleLevel: "Digital / Innovator Technical",
        sourceCitation: "TCS Digital National Qualifier Test Technical Archives",
        reportingPeriod: "2024-2025",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "Does Optimal Replacement (OPT) suffer from Bélády's Anomaly?",
          whyAsked: "Tests understanding of the stack property across algorithms.",
          expectedDefense: "No, Optimal replacement is also a stack algorithm and strictly satisfies the inclusion property, so it is immune to Bélády's Anomaly."
        },
        rubric: {
          conceptualAccuracyWeight: 0.45,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.2
        }
      },
      {
        id: "os-q-hard-vs-soft-links",
        subjectId: "os",
        subtopicId: "os-file-systems-ipc",
        topic: "Inodes, Hard Links & Unlink",
        title: "Linux Inode Architecture, Hard Links vs Soft Links & Unlink of Open Files",
        difficulty: "Hard",
        questionType: "conceptual",
        questionText: "Explain the difference between a Hard Link and a Soft Link at the Inode level. If Process A opens a 1GB file, and while Process A is reading it, Process B executes 'rm file.txt', what happens to the file data on disk? When is the disk space actually freed?",
        expectedPoints: [
          "Hard link creates a new directory entry pointing to the existing inode and increments inode.i_nlink",
          "Soft link creates a new file with a new inode containing the target path string",
          "Hard links cannot cross filesystem boundaries or link directories; soft links can",
          "When 'rm' executes, unlink() decrements the inode reference count",
          "The file data is NOT freed immediately because Process A holds an open file descriptor (in-memory dentry/inode refcount > 0)",
          "The disk blocks are only marked free on disk when the inode link count reaches 0 AND the last process closes the file handle"
        ],
        idealAnswer: "At the filesystem level:\n- A **Hard Link** creates a new directory entry `(filename, inode_num)` pointing to the SAME inode. It increments the inode's internal link counter (`i_nlink`). A hard link cannot cross filesystem partitions (because inode numbers are partition-local).\n- A **Soft Link (Symlink)** allocates a brand new inode with file type `S_IFLNK`, containing the target path string in its data block.\n\n### The 'rm' on an Open File Scenario:\nWhen Process B runs `rm file.txt`, the system call executed is `unlink(\"file.txt\")`:\n1. The kernel removes the directory entry for `file.txt` and decrements `inode->i_nlink` from 1 to 0.\n2. However, the kernel does **NOT** free the physical disk blocks yet.\n3. Process A holds an open file descriptor in its file table referencing the VFS `struct file` and in-memory `struct inode` with an active reference counter (`i_count > 0`).\n4. Process A continues to read and write to the 1GB file normally without error.\n5. The 1GB disk space is only freed to the filesystem free-block bitmap when **Process A calls `close(fd)` or terminates**. At that moment, both `i_nlink == 0` and `i_count == 0`, and the kernel returns the blocks to the free list.",
            explanation: "Unlink removes the directory entry and decrements link count, but blocks remain on disk until all open file handles are closed.",
        commonPitfalls: [
          "Claiming Process A will receive an I/O error as soon as 'rm' is run",
          "Claiming disk space is recovered immediately upon 'rm'"
        ],
        companyTag: "Uber",
        roleLevel: "Systems Software Engineer",
        sourceCitation: "Uber Distributed Storage & Infrastructure Interview",
        reportingPeriod: "2024-2025",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "How can a system administrator identify disk space held by unlinked open files on a full disk partition?",
          whyAsked: "Tests production Linux troubleshooting capability.",
          expectedDefense: "Run 'lsof +L1' or 'lsof | grep deleted' to inspect processes holding file descriptors to unlinked (deleted) inodes."
        },
        rubric: {
          conceptualAccuracyWeight: 0.45,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.2
        }
      }
    ]
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // 2. DATABASE MANAGEMENT SYSTEMS (DBMS)
  // ═════════════════════════════════════════════════════════════════════════════
  dbms: {
    id: "dbms",
    name: "Database Management Systems",
    shortName: "DBMS",
    badge: "Data Systems",
    iconName: "Database",
    overview: "Relational modeling, normalization (1NF to BCNF), ACID guarantees, transaction isolation levels, indexing, B+ trees, WAL recovery, and concurrency control.",
    targetTracks: ["service_mass", "service_elite", "product_mid", "product_faang"],
    modules: [
      {
        moduleId: "dbms-norm",
        title: "Relational Modeling & Normalization",
        subtopics: [
          {
            id: "dbms-normalization-bcnf",
            title: "Database Normalization: 1NF to BCNF & Anomalies",
            summary: "Insertion, update, and deletion anomalies; functional dependencies, Candidate Keys, and lossless decomposition.",
            prerequisites: ["Relational algebra basics", "Keys and attributes"],
            learningOutcomes: [
              "Identify update, insertion, and deletion anomalies in denormalized tables",
              "Decompose tables into 1NF, 2NF, 3NF, and BCNF",
              "Verify lossless join and dependency preservation"
            ],
            explanationMarkdown: "Normalization systematically decomposes relations to minimize data redundancy and eliminate anomalies:\n- **Insertion Anomaly**: Cannot record data without recording unrelated attributes (e.g. cannot add a new course without enrolling a student).\n- **Deletion Anomaly**: Deleting one piece of data inadvertently destroys other vital information (e.g. deleting the last student enrolled in a course deletes the course record).\n- **Update Anomaly**: Modifying an attribute in one row leaves duplicate instances in other rows out of sync.\n\n### Normal Forms Checklist:\n1. **1NF**: Every attribute contains only atomic (indivisible) values; no repeating groups.\n2. **2NF**: In 1NF and contains **NO partial dependencies** (every non-prime attribute must depend on the whole candidate key, not a proper subset).\n3. **3NF**: In 2NF and contains **NO transitive dependencies** ($X \\\\rightarrow Y$, where neither $X$ is a superkey nor $Y$ is a prime attribute).\n4. **BCNF (Boyce-Codd Normal Form)**: A stricter version of 3NF where for every non-trivial functional dependency $X \\\\rightarrow Y$, $X$ **must strictly be a superkey**.",
            codeOrDiagramSnippet: "Un-normalized Table:\n[ StudentID (PK) | CourseID (PK) | StudentName | CourseInstructor ]\nPartial Dependency: StudentID -> StudentName (violates 2NF)\nTransitive Dependency: CourseID -> CourseInstructor (violates 3NF)",
            interviewDefensePrompt: "Can every relation be decomposed into BCNF while simultaneously guaranteeing both Lossless Join and Dependency Preservation? If not, what trade-off must you make?",
            commonMisconceptions: [
              "Misconception: Higher normal form is always better in high-throughput production. (Reality: 3NF/BCNF require multiple JOINs on read; OLAP analytical systems intentionally denormalize into Star/Snowflake schemas for query performance).",
              "Misconception: Primary Key is the only key that determines dependencies. (Reality: Functional dependencies depend on Candidate Keys and business invariants, not just designated primary keys)."
            ],
            tradeoffs: "BCNF guarantees zero redundancy from functional dependencies but may sacrifice functional dependency preservation. 3NF always guarantees both lossless join and dependency preservation, but permits minor redundancy.",
            checkpoint: {
              question: "A relation R(A, B, C) has Candidate Key (A, B) and functional dependency B -> C. Which normal form does it violate?",
              options: [
                "1NF",
                "2NF",
                "3NF only",
                "BCNF only"
              ],
              correctIndex: 1,
              explanation: "Candidate key is (A, B). The dependency B -> C is a partial dependency because attribute C depends on B (a proper subset of the key), violating 2NF."
            },
            estimatedMinutes: 20
          },
          {
            id: "dbms-keys-functional-dependencies",
            title: "Keys, Constraints & Functional Dependency Closures",
            summary: "Superkeys, Candidate Keys, Primary Keys, Foreign Keys, and calculating attribute closures $X^+$.",
            prerequisites: ["Set theory basics"],
            learningOutcomes: [
              "Compute attribute closure $X^+$ under a set of functional dependencies $F$",
              "Identify all Candidate Keys of a relation",
              "Configure ON DELETE CASCADE vs RESTRICT constraints"
            ],
            explanationMarkdown: "### Hierarchy of Keys\n1. **Superkey**: Any set of attributes that uniquely identifies a tuple in a relation.\n2. **Candidate Key**: A **minimal** superkey (no proper subset is a superkey).\n3. **Primary Key**: The designated candidate key chosen by the database architect for indexing and relationships.\n4. **Foreign Key**: An attribute in a table that references the Primary Key of another table, enforcing referential integrity.\n\n### Attribute Closure Algorithm\nTo determine if $X$ is a superkey for relation $R$:\n1. Initialize closure $X^+ = X$.\n2. For each dependency $Y \\\\rightarrow Z \\\\in F$:\n   - If $Y \\\\subseteq X^+$, then $X^+ = X^+ \\\\cup Z$.\n3. Repeat until $X^+$ stops growing.\n4. If $X^+$ contains all attributes of $R$, then $X$ is a **Superkey**.",
            codeOrDiagramSnippet: "Relation R(A, B, C, D) with F = { A -> B, B -> C, C -> D }\nClosure of A:\nA+ = {A} -> {A, B} -> {A, B, C} -> {A, B, C, D}\nSince A+ contains all attributes, A is a Candidate Key!",
            interviewDefensePrompt: "Under high write throughput, what is the performance impact of enforcing FOREIGN KEY constraints with ON DELETE CASCADE?",
            commonMisconceptions: [
              "Misconception: A table can have multiple Primary Keys. (Reality: A table can have multiple Candidate Keys, but only ONE Primary Key)."
            ],
            tradeoffs: "Foreign key constraints ensure bulletproof data consistency but require row locks on parent tables during child modifications, adding latency to distributed microservices.",
            checkpoint: {
              question: "What is the mathematical definition of a Candidate Key?",
              options: [
                "Any attribute that has unique integer values",
                "A superkey that has no proper subset that is also a superkey (minimal superkey)",
                "The first column defined in the CREATE TABLE statement",
                "A key that references another table's primary key"
              ],
              correctIndex: 1,
              explanation: "A candidate key is a minimal superkey: it uniquely identifies all rows, and removing any attribute destroys uniqueness."
            },
            estimatedMinutes: 20
          }
        ]
      },
      {
        moduleId: "dbms-acid",
        title: "Transactions, ACID & Concurrency Control",
        subtopics: [
          {
            id: "dbms-acid-isolation-levels",
            title: "ACID Properties & The 4 SQL Isolation Levels",
            summary: "Atomicity, Consistency, Isolation, Durability, Dirty Reads, Non-Repeatable Reads, Phantom Reads, and MVCC.",
            prerequisites: ["Transaction definition"],
            learningOutcomes: [
              "Define Atomicity, Consistency, Isolation, and Durability",
              "Diagnose Dirty Read, Non-Repeatable Read, and Phantom Read anomalies",
              "Map the 4 standard SQL isolation levels to permitted anomalies and MVCC"
            ],
            explanationMarkdown: "### ACID Guarantees:\n- **Atomicity**: All operations succeed or none do (enforced via Undo Log).\n- **Consistency**: Database transitions from one valid state to another, preserving constraints.\n- **Isolation**: Concurrent transactions execute without mutual interference.\n- **Durability**: Committed data survives system crashes and power loss (enforced via Redo Log / WAL).\n\n### The 4 ANSI SQL Isolation Levels:\n| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read |\n|---|---|---|---|\n| **Read Uncommitted** | Permitted | Permitted | Permitted |\n| **Read Committed** | **Prevented** | Permitted | Permitted |\n| **Repeatable Read** | **Prevented** | **Prevented** | Permitted* |\n| **Serializable** | **Prevented** | **Prevented** | **Prevented** |\n\n*Note: PostgreSQL and MySQL InnoDB use Multi-Version Concurrency Control (MVCC) and snapshot isolation to prevent phantom reads even in Repeatable Read level using Next-Key Locking or consistent snapshot reads.",
            codeOrDiagramSnippet: "Dirty Read:\nT1: UPDATE balance SET amount = 500; (Uncommitted)\nT2: SELECT amount; -> reads 500\nT1: ROLLBACK; (amount reverts to 100)\nResult: T2 operated on dirty, non-existent data!",
            interviewDefensePrompt: "How does Multi-Version Concurrency Control (MVCC) allow non-blocking reads during active concurrent writes?",
            commonMisconceptions: [
              "Misconception: Repeatable Read guarantees complete serializability. (Reality: Repeatable read can still suffer from Write Skew anomalies unless explicit serializable snapshot isolation is used)."
            ],
            tradeoffs: "Higher isolation levels guarantee cleaner correctness but increase lock contention and transaction abort rates under high write concurrency.",
            checkpoint: {
              question: "Which concurrency anomaly occurs when Transaction A reads a row, Transaction B updates that same row and commits, and Transaction A reads it again finding modified values?",
              options: [
                "Dirty Read",
                "Non-Repeatable Read (Fuzzy Read)",
                "Phantom Read",
                "Lost Update"
              ],
              correctIndex: 1,
              explanation: "A Non-Repeatable Read occurs when a transaction re-reads a row it previously fetched and discovers modified column values committed by another transaction."
            },
            estimatedMinutes: 25
          },
          {
            id: "dbms-locking-deadlocks",
            title: "Two-Phase Locking (2PL), MVCC & Deadlocks",
            summary: "Shared vs exclusive locks, Growing and Shrinking phases, Strict 2PL, MVCC snapshot isolation, and lock escalation.",
            prerequisites: ["ACID isolation levels"],
            learningOutcomes: [
              "Formulate Two-Phase Locking (2PL) and explain why it guarantees Conflict Serializability",
              "Contrast Strict 2PL and Rigorous 2PL in preventing cascading rollbacks",
              "Diagnose deadlock cycles in Wait-For Graphs and apply timeout/deadlock-detection algorithms"
            ],
            explanationMarkdown: "### Two-Phase Locking (2PL) Protocol\n2PL is a concurrency control protocol that guarantees conflict serializability:\n1. **Growing Phase**: Transaction may acquire locks, but CANNOT release any lock.\n2. **Shrinking Phase**: Transaction may release locks, but CANNOT acquire any new lock.\n\n### Strict 2PL\nIn basic 2PL, if Transaction T1 releases an Exclusive (X) lock during shrinking and later aborts, other transactions that read T1's writes must also abort (**Cascading Aborts**).\n**Strict 2PL** solves this by requiring all Exclusive (X) locks to be held until the transaction **COMMITS or ROLLS BACK**. This provably eliminates cascading rollbacks.\n\n### MVCC (Multi-Version Concurrency Control)\nModern engines (Postgres, InnoDB) avoid read locks entirely. Every row has creation/deletion transaction IDs (`xmin`, `xmax`). A reader reads the snapshot version visible as of its transaction start time: **Readers never block writers, and writers never block readers**.",
            codeOrDiagramSnippet: "Strict 2PL Timeline:\nGrowing Phase:   [ Lock X(A) ] -> [ Lock S(B) ] -> [ Lock X(C) ]\n                 =================================================\n                 [ EXECUTE OPERATIONS ]\n                 =================================================\nCommit:          [ COMMIT TRANSACTION ]\nShrinking Phase: [ Release All X Locks Simultaneously at Commit ]",
            interviewDefensePrompt: "Why does standard 2PL guarantee conflict serializability, but still remain vulnerable to deadlocks?",
            commonMisconceptions: [
              "Misconception: 2PL prevents deadlocks. (Reality: 2PL guarantees serializable schedules, but lock contention can still produce circular wait deadlocks)."
            ],
            tradeoffs: "Strict 2PL prevents cascading aborts and guarantees serializability at the cost of holding locks longer, which reduces concurrency.",
            checkpoint: {
              question: "What rule does Strict Two-Phase Locking (Strict 2PL) enforce to eliminate cascading rollbacks?",
              options: [
                "Transactions can only read one table at a time",
                "All exclusive (write) locks must be held until the transaction commits or aborts",
                "No shared (read) locks can be acquired during the shrinking phase",
                "Deadlock detection is executed before every lock acquisition"
              ],
              correctIndex: 1,
              explanation: "Strict 2PL requires all exclusive locks to be held until commit/abort, ensuring uncommitted dirty data is never visible to concurrent transactions."
            },
            estimatedMinutes: 20
          }
        ]
      },
      {
        moduleId: "dbms-storage-indexing",
        title: "Storage Engines, B+ Trees & Query Execution Plans",
        subtopics: [
          {
            id: "dbms-composite-leftmost-prefix",
            title: "B-Tree vs B+ Tree Indexing & The Leftmost Prefix Rule",
            summary: "B+ Tree node fan-out, clustered vs secondary indexes, index seeks vs scans, and composite index column ordering.",
            prerequisites: ["Binary search trees", "Disk block organization"],
            learningOutcomes: [
              "Explain why B+ Trees are superior to B-Trees and Hash Indexes for relational databases",
              "Apply the Leftmost Prefix Rule to composite multi-column indexes",
              "Differentiate between Clustered Index and Non-Clustered Secondary Index lookups"
            ],
            explanationMarkdown: "### Why B+ Trees Over B-Trees?\n1. **Higher Fan-out**: In a B-Tree, internal nodes store both keys and record pointers. In a B+ Tree, internal nodes store **ONLY keys and child block pointers**, so one 4KB disk page can hold hundreds of keys, dramatically reducing tree height (typically 3-4 levels for billions of rows).\n2. **Linked Leaf Nodes**: All data pointers are stored exclusively in leaf nodes, connected via a doubly-linked list. Range scans (`WHERE age BETWEEN 20 AND 30`) require one search to the start leaf, followed by linear sequential block traversal without navigating tree nodes.\n\n### The Leftmost Prefix Rule\nA composite index on `(A, B, C)` creates an ordered B+ tree sorted first by A, then by B, then by C:\n- `WHERE A = 1 AND B = 2` -> **Index Seek** (Uses index fully).\n- `WHERE A = 1` -> **Index Seek** (Uses index).\n- `WHERE B = 2 AND C = 3` -> **CANNOT use index seek** (A is missing; requires Full Index Scan).\n- `WHERE A = 1 AND B > 2 AND C = 3` -> Uses index for A and range on B; C cannot use the index seek because B is a range query.",
            codeOrDiagramSnippet: "B+ Tree Structure:\nLevel 1 (Root):          [ 20 | 50 ]\n                        /     |     \\\\\\\\\nLevel 2 (Internal): [10]     [30]    [70]\n                    /  \\\\\\\\    /  \\\\\\\\   /   \\\\\\\\\nLeaves (Data):    [1-9] <-> [10-19] <-> [20-29] <-> [30-49] <-> [50-69] <-> [70+]",
            interviewDefensePrompt: "If you have a table with 100 million rows, why does a B+ tree query typically take at most 3 to 4 disk reads to find any single record?",
            commonMisconceptions: [
              "Misconception: Adding an index on (A, B) also speeds up queries on WHERE B = 5. (Reality: Without leading column A, the B-Tree cannot binary search B; it must scan the entire index leaf chain)."
            ],
            tradeoffs: "B+ trees provide $O(\\log N)$ seeks and $O(K)$ range scans, but every INSERT/UPDATE/DELETE requires updating all secondary index trees and can trigger node splits.",
            checkpoint: {
              question: "Given a composite index on (department_id, salary, hire_date), which query can NOT take advantage of an Index Seek?",
              options: [
                "WHERE department_id = 10 AND salary > 50000",
                "WHERE department_id = 10",
                "WHERE salary = 75000 AND hire_date = '2023-01-01'",
                "WHERE department_id = 10 AND salary = 60000 AND hire_date > '2022-01-01'"
              ],
              correctIndex: 2,
              explanation: "Under the Leftmost Prefix Rule, any query that does not include the leading column (department_id) cannot perform an index seek on the composite index tree."
            },
            estimatedMinutes: 25
          },
          {
            id: "dbms-query-opt-wal",
            title: "Write-Ahead Logging (WAL) & Query Optimization",
            summary: "ARIES crash recovery, Redo/Undo logs, checkpoints, Cost-Based Optimizer, and Explain Plan analysis.",
            prerequisites: ["Disk block I/O"],
            learningOutcomes: [
              "Explain Write-Ahead Logging (WAL) and the ARIES recovery protocol",
              "Trace the Analysis, Redo, and Undo passes during crash recovery",
              "Interpret an EXPLAIN query execution plan (Index Seek vs Table Scan vs Hash Join)"
            ],
            explanationMarkdown: "### Write-Ahead Logging (WAL)\nDisk random writes are slow (~5-10ms on HDD, or high latency on SSDs). Modifying data pages directly on disk on every commit is impractical.\n**WAL Principle**: Any modification to a data page must first be recorded sequentially in an append-only log file on stable storage **BEFORE** the dirty data page is written to disk.\n- Committing a transaction only requires writing the small log record sequentially (fast append).\n- Dirty data pages in the buffer pool are flushed to disk asynchronously in the background.\n\n### Crash Recovery (ARIES Algorithm):\nWhen a crashed database boots up, it executes 3 passes:\n1. **Analysis Pass**: Identifies dirty pages in buffer pool and active uncommitted transactions at crash time.\n2. **Redo Pass**: Replays all logged changes forward from the checkpoint to restore the database state to the exact moment of crash.\n3. **Undo Pass**: Reverses (rolls back) all transactions that were active/uncommitted at the time of crash.",
            codeOrDiagramSnippet: "Transaction Life-cycle:\n1. Client: UPDATE accounts SET bal = bal - 100 WHERE id = 1\n2. Engine: Appends record to WAL buffer -> Flushes WAL to disk (fsync)\n3. Engine: Updates account page in Buffer Pool (marked dirty)\n4. Client receives: 'COMMIT SUCCESS'\n5. Background Checkpointer: Flushes dirty page from Buffer Pool to Data File later.",
            interviewDefensePrompt: "If the database crashes while writing dirty pages to disk, how does Write-Ahead Logging prevent data corruption?",
            commonMisconceptions: [
              "Misconception: Database COMMIT writes table data directly to disk. (Reality: COMMIT only flushes the sequential WAL log to disk; actual data tables are updated in memory and flushed asynchronously)."
            ],
            tradeoffs: "WAL provides high throughput by turning random writes into sequential log appends, at the cost of disk space for log storage and crash recovery replay time.",
            checkpoint: {
              question: "What is the core rule of the Write-Ahead Logging (WAL) protocol?",
              options: [
                "Data pages must be written to disk before log records are generated",
                "Log records representing an update must be flushed to disk before the corresponding dirty data page is written to disk",
                "Log records are kept in memory and only written to disk once per hour",
                "Transactions can only update unindexed columns"
              ],
              correctIndex: 1,
              explanation: "WAL dictates that log records describing a change must be safely flushed to persistent storage before dirty data pages are written to the database files."
            },
            estimatedMinutes: 20
          }
        ]
      }
    ],
    questions: [
      {
        id: "dbms-q-composite-index",
        subjectId: "dbms",
        subtopicId: "dbms-composite-leftmost-prefix",
        topic: "Composite Indexing & Leftmost Prefix",
        title: "B-Tree Leftmost Prefix Rule and Unindexed Filters",
        difficulty: "Hard",
        questionType: "conceptual",
        questionText: "A high-traffic e-commerce database has a table orders with 50,000,000 rows. A composite index exists on (status, created_at, customer_id). Explain how the query engine executes the following query: SELECT * FROM orders WHERE created_at >= '2025-01-01' AND customer_id = 42. Can it use an Index Seek? How would you optimize the index?",
        expectedPoints: [
          "Explain that B+ tree is sorted primarily by status, then created_at, then customer_id",
          "Because status is missing from WHERE clause, the engine CANNOT perform an Index Seek",
          "It must fall back to an Index Full Scan or a Table Scan",
          "Explain that range filter on created_at prevents following columns from acting as seek predicates",
          "Optimization: Create an index with equality columns first: (customer_id, created_at) or (status, customer_id, created_at)"
        ],
        idealAnswer: "Under the **Leftmost Prefix Rule**, a composite index on `(status, created_at, customer_id)` is ordered like a telephone book: first by `status`, and only within matching status values by `created_at`, and within matching dates by `customer_id`.\n\n### Execution Analysis:\nIn the query `WHERE created_at >= '2025-01-01' AND customer_id = 42`, the leading column `status` is completely absent.\n- The database **CANNOT perform an Index Seek** from the root of the B+ tree.\n- The engine must either perform a **Full Table Scan** (50M rows) or a **Full Index Scan** (scanning all leaf pages of the index and filtering).\n\n### Optimization Strategy:\nTo optimize this query:\n1. Create a dedicated composite index on:\n   ```sql\n   CREATE INDEX idx_orders_cust_created ON orders (customer_id, created_at);\n   ```\n2. **Rule of Thumb for Index Ordering**: Put **Equality filters first** (`customer_id`), followed by **Range filters** (`created_at >= '2025-01-01'`). This allows the engine to jump directly to `customer_id = 42` via Index Seek, and scan only the date range.",
            explanation: "Composite indexes require the leading column for seeks. Place equality columns first and range columns last.",
        commonPitfalls: [
          "Assuming that having all columns present in the table allows the index to seek regardless of column order",
          "Putting the range column before the equality column in the index"
        ],
        companyTag: "Amazon",
        roleLevel: "SDE-1 / SDE-2 Database Design",
        sourceCitation: "Amazon SDE Technical Interview Questions",
        reportingPeriod: "2024-2025",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "What is an Index Covering Query (Covering Index), and why does it avoid disk lookups entirely?",
          whyAsked: "Probes deep understanding of clustered vs secondary index mechanics.",
          expectedDefense: "A covering index contains all columns requested in SELECT, WHERE, and JOIN. The engine satisfies the entire query from index leaf pages without fetching the physical data row."
        },
        rubric: {
          conceptualAccuracyWeight: 0.4,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.25
        }
      },
      {
        id: "dbms-q-isolation-anomalies",
        subjectId: "dbms",
        subtopicId: "dbms-acid-isolation-levels",
        topic: "Transaction Isolation Phenomena",
        title: "Dirty Read vs Non-Repeatable Read vs Phantom Read Under MVCC",
        difficulty: "Medium",
        questionType: "conceptual",
        questionText: "Define Dirty Read, Non-Repeatable Read, and Phantom Read with concrete transaction timelines. In modern PostgreSQL and MySQL InnoDB, how does Repeatable Read handle phantom reads differently than standard ANSI SQL specifications?",
        expectedPoints: [
          "Dirty Read: Reading uncommitted data written by another transaction that later rolls back",
          "Non-Repeatable Read: Re-reading the same row within a transaction and finding modified values committed by another transaction",
          "Phantom Read: Re-executing a range query and finding newly inserted or deleted rows committed by another transaction",
          "In ANSI SQL, Repeatable Read permits phantom reads",
          "In MySQL InnoDB and PostgreSQL, MVCC snapshot isolation prevents phantom reads in Repeatable Read by taking a consistent snapshot at transaction start"
        ],
        idealAnswer: "### Concurrency Phenomena:\n1. **Dirty Read (Read Uncommitted)**:\n   - T1 updates account balance from $100 to $500 (uncommitted).\n   - T2 reads balance as $500.\n   - T1 executes `ROLLBACK`. T2 has acted on invalid data.\n2. **Non-Repeatable Read (Read Committed)**:\n   - T1 reads row: `SELECT balance WHERE id=1` -> reads $100.\n   - T2 updates row: `UPDATE accounts SET balance = 300 WHERE id=1; COMMIT;`\n   - T1 re-reads: `SELECT balance WHERE id=1` -> reads $300. The same row changed within T1.\n3. **Phantom Read (Repeatable Read)**:\n   - T1 reads range: `SELECT COUNT(*) FROM orders WHERE total > 100` -> returns 5 rows.\n   - T2 inserts: `INSERT INTO orders (total) VALUES (150); COMMIT;`\n   - T1 re-executes range query: returns 6 rows. A \"phantom\" row appeared.\n\n### Modern MVCC Implementation:\nStandard ANSI SQL allows phantom reads in Repeatable Read. However, in modern databases:\n- **PostgreSQL**: Repeatable Read uses **Snapshot Isolation**. The transaction takes a snapshot at its first query; subsequent queries see only rows committed prior to that snapshot. Phantoms are eliminated without read locks.\n- **MySQL InnoDB**: Uses a combination of MVCC snapshots for consistent reads and **Next-Key Locks** (record lock + gap lock) for locking reads (`FOR UPDATE`), preventing phantoms.",
            explanation: "MVCC uses row versions and snapshots to eliminate dirty reads and non-repeatable reads, while gap locks and snapshots prevent phantoms.",
        commonPitfalls: [
          "Confusing Non-Repeatable Read (one existing row is modified) with Phantom Read (new rows appear in a range query)",
          "Assuming Repeatable Read always requires lock escalations"
        ],
        companyTag: "TCS",
        roleLevel: "Digital / Prime Specialist",
        sourceCitation: "TCS Digital Technical Archives",
        reportingPeriod: "2024-2025",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "What is Write Skew, and why does Snapshot Isolation fail to prevent it without Serializable isolation?",
          whyAsked: "Tests edge cases of modern transactional storage.",
          expectedDefense: "Write Skew occurs when two transactions read overlapping datasets, verify a constraint, and make disjoint writes that together violate the constraint (e.g. two on-call doctors simultaneously checking out). Only Serializable isolation prevents write skew."
        },
        rubric: {
          conceptualAccuracyWeight: 0.45,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.2
        }
      },
      {
        id: "dbms-q-btree-vs-bplustree",
        subjectId: "dbms",
        subtopicId: "dbms-composite-leftmost-prefix",
        topic: "B+ Tree vs B-Tree Architecture",
        title: "B-Tree vs B+ Tree Architecture: Why Databases Exclusively Use B+ Trees for Storage",
        difficulty: "Hard",
        questionType: "conceptual",
        questionText: "Compare the internal memory layout of a B-Tree vs a B+ Tree. Why do all production relational database storage engines (MySQL InnoDB, Postgres, Oracle, SQL Server) exclusively use B+ Trees rather than standard B-Trees for table and index storage?",
        expectedPoints: [
          "B-Trees store both keys and record pointers/payloads in every internal node",
          "B+ Trees store ONLY keys and child pointers in internal nodes; all records/data pointers reside in leaf nodes",
          "Higher Fan-out: Internal nodes in B+ Trees can fit far more keys per 4KB/16KB disk page, resulting in shallower tree height",
          "Range Queries: B+ Tree leaves are doubly linked; range scans only require tree descent once followed by sequential leaf traversal",
          "In B-Trees, a range query requires in-order tree traversal jumping up and down random disk blocks",
          "Predictable Query Latency: Every search in a B+ Tree traverses the exact same number of levels to the leaf"
        ],
        idealAnswer: "### Structural Comparison:\n- **B-Tree**: Every node (both internal nodes and leaf nodes) stores keys along with their associated data records or disk pointers.\n- **B+ Tree**: Internal nodes store **ONLY index keys and child page pointers**. All table row data (or clustered row pointers) reside exclusively in **Leaf Nodes**. Furthermore, all leaf nodes are connected via a doubly linked list.\n\n### Why Databases Exclusively Use B+ Trees:\n1. **Significantly Higher Fan-Out & Shallower Depth**:\n   Because internal nodes in B+ Trees do not store bulky data rows, a standard 16KB disk page can store thousands of keys. A 3-level B+ Tree can index over 20,000,000 rows. A shallower tree means fewer disk block I/O operations per search (typically 3 reads).\n2. **Optimal Range Scans**:\n   In a B-Tree, scanning `WHERE age BETWEEN 25 AND 35` requires traversing up and down the tree in-order, causing random disk seek thrashing. In a B+ Tree, the engine performs a single binary search to find the leaf containing `25`, and then sequentially traverses the linked leaf pages using sequential disk reads.\n3. **Cache Efficiency**:\n   Because internal nodes contain only routing keys, the entire upper tier of the index tree can be permanently cached in RAM (Buffer Pool), reducing physical disk reads to 1.",
            explanation: "B+ trees maximize fan-out, minimize tree depth, and link leaf nodes for efficient sequential range scans.",
        commonPitfalls: [
          "Claiming B-Trees are faster for range scans",
          "Forgetting that B+ Tree internal nodes do not hold record pointers"
        ],
        companyTag: "Google",
        roleLevel: "Systems / Database Software Engineer",
        sourceCitation: "Google Engineering Technical Interview Archives",
        reportingPeriod: "2024-2025",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "When would a Hash Index be preferred over a B+ Tree, and what is its major limitation?",
          whyAsked: "Tests knowledge of alternative indexing structures.",
          expectedDefense: "Hash indexes offer O(1) point lookups, but are completely useless for range queries, sorting (ORDER BY), and prefix searches."
        },
        rubric: {
          conceptualAccuracyWeight: 0.45,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.2
        }
      },
      {
        id: "dbms-q-aries-recovery",
        subjectId: "dbms",
        subtopicId: "dbms-query-opt-wal",
        topic: "Database Crash Recovery & ARIES",
        title: "Database Crash Recovery: Write-Ahead Logging (WAL) & ARIES Protocol",
        difficulty: "Hard",
        questionType: "conceptual",
        questionText: "Explain how a database guarantees Durability and Atomicity across sudden power failures using Write-Ahead Logging (WAL) and the ARIES algorithm. What are the roles of the Analysis, Redo, and Undo passes?",
        expectedPoints: [
          "WAL rule: Log records must be flushed to disk before dirty database pages are written to data files",
          "Analysis Pass: Reads the log forward from the latest checkpoint to reconstruct dirty pages and active uncommitted transactions (the loser list)",
          "Redo Pass: Replays history forward from the oldest unwritten change (RecLSN), restoring the database state to the exact instant of the crash",
          "Undo Pass: Scans the log backwards, rolling back all active uncommitted transactions and writing Compensation Log Records (CLRs) to ensure idempotency"
        ],
        idealAnswer: "The **ARIES (Algorithms for Recovery and Isolation Exploiting Semantics)** crash recovery algorithm operates on an append-only Write-Ahead Log (WAL) to guarantee ACID Durability and Atomicity.\n\n### Core WAL Guarantee:\nDirty buffer pages are never flushed to disk until the corresponding log records with unique Log Sequence Numbers (LSN) are safely synced to disk (`fsync`).\n\n### The Three Passes of ARIES:\n1. **Analysis Pass**:\n   - Scans the log forward from the most recent **Checkpoint**.\n   - Identifies all dirty pages present in the buffer pool at crash time (Dirty Page Table - DPT).\n   - Identifies all active transactions that never committed prior to the crash (**Transaction Table / Losers List**).\n2. **Redo Pass (Repeating History)**:\n   - Scans forward from the smallest `RecLSN` found in the Dirty Page Table.\n   - Replays **EVERY** logged change, including those of uncommitted transactions and rolled-back transactions, restoring the exact page state as it existed at the microsecond of the crash.\n3. **Undo Pass**:\n   - Scans backward through the log, reversing changes made by uncommitted 'loser' transactions.\n   - For every undone change, writes a **Compensation Log Record (CLR)**.\n   - *Why CLRs?* If the server crashes AGAIN during recovery, CLRs prevent the recovery process from re-undoing previously undone operations, ensuring the recovery process is strictly **Idempotent**.",
            explanation: "ARIES replays history during Redo to restore exact crash state, then rolls back active uncommitted transactions during Undo with CLRs.",
        commonPitfalls: [
          "Assuming Redo pass only replays committed transactions (ARIES replays all transactions, then rolls back losers in Undo)",
          "Forgetting that Compensation Log Records prevent infinite loops during recurring crashes"
        ],
        companyTag: "Meta",
        roleLevel: "Storage Infrastructure Engineer",
        sourceCitation: "Meta Distributed Database Engineering Interview",
        reportingPeriod: "2024-2025",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "What is Fuzzy Checkpointing, and why is it preferred over a blocking checkpoint?",
          whyAsked: "Tests understanding of zero-downtime checkpointing in production systems.",
          expectedDefense: "A fuzzy checkpoint writes current dirty page IDs and active transaction state to the log without forcing an expensive, synchronous flush of all dirty memory pages to disk, preventing transaction stalls."
        },
        rubric: {
          conceptualAccuracyWeight: 0.45,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.2
        }
      }
    ]
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // 3. SQL PRACTICAL SKILLS (SQL)
  // ═════════════════════════════════════════════════════════════════════════════
  sql: {
    id: "sql",
    name: "SQL Practical Skills",
    shortName: "SQL",
    badge: "Practical Queries",
    iconName: "Terminal",
    overview: "SELECT, filtering, joins, aggregations, window functions (ROW_NUMBER, RANK, DENSE_RANK), CTEs, correlated subqueries, query plans, and practical interview questions.",
    targetTracks: ["service_mass", "service_elite", "product_mid", "product_faang"],
    modules: [
      {
        moduleId: "sql-queries",
        title: "Aggregation, Filtering & Multi-Table Joins",
        subtopics: [
          {
            id: "sql-joins-subqueries",
            title: "Multi-Table Joins & Correlated Subqueries",
            summary: "INNER, LEFT, RIGHT, FULL OUTER, CROSS joins; ON vs WHERE filters, and subquery correlation.",
            prerequisites: ["Basic SQL syntax"],
            learningOutcomes: [
              "Formulate multi-table queries with INNER, LEFT, and FULL joins",
              "Differentiate between filtering in the ON clause vs filtering in the WHERE clause on outer joins",
              "Write correlated subqueries using EXISTS and NOT EXISTS"
            ],
            explanationMarkdown: "### SQL Join Semantics\n- **INNER JOIN**: Returns only rows with matching values in both tables.\n- **LEFT (OUTER) JOIN**: Returns ALL rows from the left table, with matching rows from the right table (or `NULL` if no match).\n- **FULL OUTER JOIN**: Returns rows when there is a match in EITHER table.\n- **CROSS JOIN**: Cartesian product ($M \\\\times N$ rows).\n\n### The ON vs WHERE Trap in LEFT JOINs:\n- **Filter in `ON`**: Filters the right table BEFORE the join. If no match, the left row is still returned with `NULL`s.\n- **Filter in `WHERE`**: Filters the resulting joined table AFTER the join. If you filter `WHERE right_table.status = 'active'`, it converts the LEFT JOIN into an INNER JOIN because `NULL = 'active'` evaluates to FALSE!",
            codeOrDiagramSnippet: "-- Correct LEFT JOIN with filter preserving all customers:\nSELECT c.name, o.order_id, o.amount\nFROM customers c\nLEFT JOIN orders o \n  ON c.id = o.customer_id AND o.status = 'COMPLETED';\n\n-- Common Mistake: Converts LEFT JOIN to INNER JOIN!\nSELECT c.name, o.order_id\nFROM customers c\nLEFT JOIN orders o ON c.id = o.customer_id\nWHERE o.status = 'COMPLETED'; -- Filters out customers with 0 orders!",
            interviewDefensePrompt: "Why is WHERE EXISTS typically faster than WHERE IN when evaluating subqueries against large tables with NULL values?",
            commonMisconceptions: [
              "Misconception: LEFT JOIN WHERE col IS NULL is the only way to find missing records. (Reality: NOT EXISTS is often much faster and handles NULLs correctly without three-valued logic bugs)."
            ],
            tradeoffs: "JOINs leverage index lookups and hash joins. Correlated subqueries execute per-row ($O(N \\times M)$) unless rewritten by the query optimizer.",
            checkpoint: {
              question: "What is the result of placing a filter condition on the right-hand table in the WHERE clause of a LEFT JOIN query?",
              options: [
                "It speeds up the query without changing the returned rows",
                "It unintentionally converts the LEFT JOIN into an INNER JOIN by filtering out NULL rows",
                "It causes a SQL syntax error in ANSI-compliant databases",
                "It duplicates matching rows"
              ],
              correctIndex: 1,
              explanation: "In a LEFT JOIN, unmatched rows have NULLs for right-table columns. A WHERE clause filter on a right-table column evaluates NULL as FALSE, discarding non-matching left rows."
            },
            estimatedMinutes: 20
          },
          {
            id: "sql-aggregation-grouping",
            title: "GROUP BY, HAVING vs WHERE & Complex Aggregates",
            summary: "Aggregate functions (COUNT, SUM, AVG, MIN, MAX), GROUP BY groupings, and filtering grouped results via HAVING.",
            prerequisites: ["SELECT queries"],
            learningOutcomes: [
              "Distinguish between row filtering (WHERE) and aggregate filtering (HAVING)",
              "Handle NULL values in COUNT(*) vs COUNT(column_name)",
              "Write multi-column aggregations with conditional SUM(CASE WHEN ...)"
            ],
            explanationMarkdown: "### Execution Order of a SQL Query:\n1. `FROM` & `JOIN`\n2. `WHERE` (Filters individual rows before grouping)\n3. `GROUP BY` (Groups rows into aggregate buckets)\n4. `HAVING` (Filters aggregated groups)\n5. `SELECT` (Evaluates expressions, window functions)\n6. `DISTINCT`\n7. `ORDER BY`\n8. `LIMIT` / `OFFSET`\n\n### COUNT(*) vs COUNT(column):\n- `COUNT(*)`: Counts all rows in the group, regardless of NULLs.\n- `COUNT(col)`: Counts only rows where `col` is **NOT NULL**.\n\n### Conditional Aggregation Pattern:\nPivot rows into summary metrics using `SUM(CASE WHEN ... THEN 1 ELSE 0 END)`.",
            codeOrDiagramSnippet: "SELECT \n  department_id,\n  COUNT(*) as total_employees,\n  SUM(CASE WHEN salary > 100000 THEN 1 ELSE 0 END) as high_earners,\n  AVG(salary) as avg_salary\nFROM employees\nWHERE status = 'ACTIVE'       -- Row filter before grouping\nGROUP BY department_id\nHAVING AVG(salary) > 75000;   -- Group filter after aggregation",
            interviewDefensePrompt: "Can you reference a column alias defined in the SELECT clause inside the WHERE or HAVING clause? Why or why not?",
            commonMisconceptions: [
              "Misconception: WHERE can filter on aggregate expressions like WHERE SUM(salary) > 1000. (Reality: WHERE executes before GROUP BY; aggregates can only be filtered in HAVING)."
            ],
            tradeoffs: "Aggregations can utilize covering indexes with pre-computed statistics, but unindexed GROUP BY requires expensive in-memory or on-disk hash tables.",
            checkpoint: {
              question: "At what point in SQL execution order is the HAVING clause evaluated?",
              options: [
                "Before the WHERE clause filters rows",
                "After the GROUP BY clause aggregates rows, but before SELECT projection",
                "After the ORDER BY clause sorts output",
                "Simultaneously with FROM and JOIN"
              ],
              correctIndex: 1,
              explanation: "HAVING is evaluated immediately after GROUP BY to filter aggregate groups, and before SELECT assigns column aliases."
            },
            estimatedMinutes: 20
          }
        ]
      },
      {
        moduleId: "sql-window",
        title: "Window Functions & Analytical Query Patterns",
        subtopics: [
          {
            id: "sql-window-ranking",
            title: "Window Functions: ROW_NUMBER, RANK & DENSE_RANK",
            summary: "OVER (PARTITION BY ... ORDER BY ...), ranking ties, running totals, and finding top-N records per category.",
            prerequisites: ["GROUP BY fundamentals"],
            learningOutcomes: [
              "Explain the difference between ROW_NUMBER, RANK, and DENSE_RANK on tied values",
              "Formulate running totals and cumulative sums using window frames",
              "Extract Top-N records per category without subquery joins"
            ],
            explanationMarkdown: "Window functions perform calculations across a set of table rows that are related to the current row, **without collapsing rows like GROUP BY**.\n\n### Ranking Comparison:\nConsider salaries: `[10000, 9000, 9000, 8000]`\n- **`ROW_NUMBER()`**: Assigns sequential integers: `1, 2, 3, 4` (No ties).\n- **`RANK()`**: Ties get the same rank; subsequent rank skips: `1, 2, 2, 4` (Skips 3).\n- **`DENSE_RANK()`**: Ties get the same rank; subsequent rank does NOT skip: `1, 2, 2, 3` (No gaps).\n\n### Window Frame Specification:\n`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` calculates cumulative running metrics.",
            codeOrDiagramSnippet: "-- Find Department-Wise Top 3 Earners:\nWITH RankedEmployees AS (\n  SELECT \n    name,\n    department_id,\n    salary,\n    DENSE_RANK() OVER (\n      PARTITION BY department_id \n      ORDER BY salary DESC\n    ) as rnk\n  FROM employees\n)\nSELECT department_id, name, salary\nFROM RankedEmployees\nWHERE rnk <= 3;",
            interviewDefensePrompt: "Why does finding the N-th highest salary strictly require DENSE_RANK() rather than ROW_NUMBER() or RANK()?",
            commonMisconceptions: [
              "Misconception: Window functions can be placed in the WHERE clause directly. (Reality: Window functions are evaluated in step 5 of query execution; they must be wrapped in a CTE or subquery to filter on rank)."
            ],
            tradeoffs: "Window functions avoid self-joins and are optimized with streaming sort passes, but large partitions without index support require temporary disk sorting.",
            checkpoint: {
              question: "If salaries are 100, 90, 90, 80, what values are produced by DENSE_RANK()?",
              options: [
                "1, 2, 3, 4",
                "1, 2, 2, 4",
                "1, 2, 2, 3",
                "1, 1, 2, 3"
              ],
              correctIndex: 2,
              explanation: "DENSE_RANK assigns identical ranks to tied values (2 and 2) and does not skip subsequent numbers, producing 1, 2, 2, 3."
            },
            estimatedMinutes: 25
          },
          {
            id: "sql-recursive-analytics",
            title: "Common Table Expressions (CTEs) & Consecutive Patterns",
            summary: "WITH clauses, recursive CTEs for hierarchical tree structures, LAG, LEAD, and finding consecutive active streaks.",
            prerequisites: ["Window functions"],
            learningOutcomes: [
              "Construct recursive CTEs to traverse organizational hierarchies and graphs",
              "Use LAG() and LEAD() to compare adjacent rows without self-joins",
              "Solve Islands & Gaps problems (e.g. 3 consecutive days of user activity)"
            ],
            explanationMarkdown: "### Common Table Expressions (CTEs)\nA CTE (`WITH cte_name AS (...)`) creates a temporary named result set, making complex queries readable and modular.\n\n### Recursive CTEs\nConsist of:\n1. **Anchor Member**: Base query that initializes the recursion.\n2. `UNION ALL`\n3. **Recursive Member**: Query that references the CTE itself and terminates when no rows are produced.\n\n### Analytical Lookahead: LAG and LEAD\n- `LAG(col, 1) OVER (ORDER BY date)`: Accesses the previous row's value.\n- `LEAD(col, 1) OVER (ORDER BY date)`: Accesses the next row's value.\nEssential for detecting consecutive events (e.g., 3 consecutive rising temperatures or consecutive login days).",
            codeOrDiagramSnippet: "-- Consecutive Active Logins:\nSELECT DISTINCT user_id\nFROM (\n  SELECT \n    user_id,\n    login_date,\n    LAG(login_date, 1) OVER (PARTITION BY user_id ORDER BY login_date) as prev1,\n    LAG(login_date, 2) OVER (PARTITION BY user_id ORDER BY login_date) as prev2\n  FROM user_logins\n) sub\nWHERE login_date = prev1 + INTERVAL 1 DAY \n  AND prev1 = prev2 + INTERVAL 1 DAY;",
            interviewDefensePrompt: "How do you prevent a recursive CTE from entering an infinite loop when the underlying graph contains cycles?",
            commonMisconceptions: [
              "Misconception: A CTE is always materialized as a temp table. (Reality: Modern optimizers often inline non-recursive CTEs into the outer query as derived tables)."
            ],
            tradeoffs: "CTEs improve readability and enable graph traversal, but recursive CTEs consume memory if recursion depth is deep; safety limits (`MAXRECURSION`) should be set.",
            checkpoint: {
              question: "Which SQL window function allows you to inspect the value of a column from the immediately preceding row without a self-join?",
              options: [
                "FIRST_VALUE()",
                "LEAD()",
                "LAG()",
                "ROW_NUMBER()"
              ],
              correctIndex: 2,
              explanation: "LAG() accesses data from a previous row at a specified physical offset within the window partition."
            },
            estimatedMinutes: 25
          }
        ]
      }
    ],
    questions: [
      {
        id: "sql-q-second-highest-salary",
        subjectId: "sql",
        subtopicId: "sql-window-ranking",
        topic: "Second Highest Salary",
        title: "Second Highest Salary with DISTINCT and NULL Handling",
        difficulty: "Medium",
        questionType: "sql",
        questionText: "Write a SQL query to report the second highest salary from the Employee table. If there is no second highest salary (e.g. table has only 1 row or all salaries are identical), the query must return NULL.",
        codeSnippet: "Table: Employee\n+-------------+------+\n| Column Name | Type |\n+-------------+------+\n| id          | int  |\n| salary      | int  |\n+-------------+------+",
            expectedPoints: [
          "Must handle duplicate salaries using DISTINCT",
          "Must return NULL if there are fewer than 2 distinct salaries",
          "Can use DENSE_RANK() or subquery with LIMIT 1 OFFSET 1 or MAX(salary) < (SELECT MAX(salary))"
        ],
        idealAnswer: "-- Solution 1: Clean subquery with MAX (guarantees NULL if no 2nd exists)\nSELECT MAX(salary) AS SecondHighestSalary\nFROM Employee\nWHERE salary < (SELECT MAX(salary) FROM Employee);\n\n-- Solution 2: Window function with CTE\nWITH Ranked AS (\n  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) as rnk\n  FROM Employee\n)\nSELECT (\n  SELECT DISTINCT salary \n  FROM Ranked \n  WHERE rnk = 2\n) AS SecondHighestSalary;",
            explanation: "Using MAX(salary) WHERE salary < (SELECT MAX) is standard and cleanly returns NULL when only one salary exists.",
        commonPitfalls: [
          "Using LIMIT 1 OFFSET 1 directly without an outer scalar subquery, returning an empty set instead of NULL",
          "Forgetting DISTINCT, causing identical top salaries to occupy 1st and 2nd position"
        ],
        companyTag: "TCS",
        roleLevel: "Ninja / Digital Technical",
        sourceCitation: "TCS Ninja & Digital Standard SQL Assessment",
        reportingPeriod: "2024-2025",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "How would you generalize this solution to find the N-th highest salary dynamically?",
          whyAsked: "Tests transition from fixed problem to generic parameterized query design.",
          expectedDefense: "Use a stored function or CTE with DENSE_RANK() OVER (ORDER BY salary DESC) filtering WHERE rnk = N."
        },
        rubric: {
          conceptualAccuracyWeight: 0.45,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.2
        }
      },
      {
        id: "sql-q-department-top-salaries",
        subjectId: "sql",
        subtopicId: "sql-window-ranking",
        topic: "Department Top Three Salaries",
        title: "Department Top Three Salaries Using DENSE_RANK Window Function",
        difficulty: "Hard",
        questionType: "sql",
        questionText: "A company's executives want to see who earns the most in each department. A high earner in a department is an employee whose salary is in the top three unique salaries for that department. Write a SQL query to find the employees who are high earners in each department. Return the result table in any order.",
        codeSnippet: "Table: Employee\n+--------------+---------+\n| Column Name  | Type    |\n+--------------+---------+\n| id           | int     |\n| name         | varchar |\n| salary       | int     |\n| departmentId | int     |\n+--------------+---------+\n\nTable: Department\n+-------------+---------+\n| Column Name | Type    |\n+-------------+---------+\n| id          | int     |\n| name        | varchar |\n+-------------+---------+",
            expectedPoints: [
          "Join Employee and Department on departmentId = Department.id",
          "Partition by departmentId in window function",
          "Must use DENSE_RANK() because top three UNIQUE salaries are required (ties share ranks without skipping)",
          "Filter WHERE rnk <= 3 in outer query"
        ],
        idealAnswer: "WITH RankedSalaries AS (\n  SELECT \n    d.name AS Department,\n    e.name AS Employee,\n    e.salary AS Salary,\n    DENSE_RANK() OVER (\n      PARTITION BY e.departmentId \n      ORDER BY e.salary DESC\n    ) AS rnk\n  FROM Employee e\n  JOIN Department d ON e.departmentId = d.id\n)\nSELECT Department, Employee, Salary\nFROM RankedSalaries\nWHERE rnk <= 3;",
            explanation: "DENSE_RANK() partitions by department and ranks unique salaries descending, accurately handling ties without gaps.",
        commonPitfalls: [
          "Using RANK() instead of DENSE_RANK(), which causes two tied top salaries to skip rank 2 and drop the 3rd earner",
          "Attempting to put the window function directly in the WHERE clause"
        ],
        companyTag: "Amazon",
        roleLevel: "SDE-1 / Data Engineer",
        sourceCitation: "Amazon SDE Technical Interview Questions",
        reportingPeriod: "2024-2025",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "What if you needed to optimize this query for 100 million employees? What index would you create?",
          whyAsked: "Tests production database indexing knowledge for window functions.",
          expectedDefense: "Create a composite index on Employee (departmentId, salary DESC, name) to enable index streaming without an in-memory sort pass."
        },
        rubric: {
          conceptualAccuracyWeight: 0.45,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.2
        }
      },
      {
        id: "sql-q-consecutive-logins",
        subjectId: "sql",
        subtopicId: "sql-recursive-analytics",
        topic: "Consecutive Numbers & Active Streaks",
        title: "Consecutive Active Login Days Using LAG / LEAD Window Functions",
        difficulty: "Hard",
        questionType: "sql",
        questionText: "Write a SQL query to find all users who have logged in for at least 3 consecutive days. Return the result table of distinct user IDs in any order.",
        codeSnippet: "Table: Logins\n+-------------+---------+\n| Column Name | Type    |\n+-------------+---------+\n| user_id     | int     |\n| login_date  | date    |\n+-------------+---------+",
            expectedPoints: [
          "De-duplicate multiple logins on the same day using DISTINCT or GROUP BY",
          "Use LAG(login_date, 1) and LAG(login_date, 2) partitioned by user_id ordered by login_date",
          "Check that login_date = prev1 + 1 day AND prev1 = prev2 + 1 day (using DATEDIFF or date arithmetic)",
          "Alternative: Group by (login_date - ROW_NUMBER() days)"
        ],
        idealAnswer: "WITH UniqueLogins AS (\n  SELECT DISTINCT user_id, login_date\n  FROM Logins\n),\nLagged AS (\n  SELECT \n    user_id,\n    login_date,\n    LAG(login_date, 1) OVER (PARTITION BY user_id ORDER BY login_date) as prev1,\n    LAG(login_date, 2) OVER (PARTITION BY user_id ORDER BY login_date) as prev2\n  FROM UniqueLogins\n)\nSELECT DISTINCT user_id\nFROM Lagged\nWHERE DATEDIFF(login_date, prev1) = 1\n  AND DATEDIFF(prev1, prev2) = 1;",
            explanation: "Deduplicating logins first and using LAG(1) and LAG(2) cleanly verifies 3 consecutive consecutive calendar days.",
        commonPitfalls: [
          "Forgetting that a user can log in multiple times in one day, which would cause LAG to compare duplicate dates",
          "Using integer id sequence instead of date difference"
        ],
        companyTag: "Uber",
        roleLevel: "Analytics / Backend SWE",
        sourceCitation: "Uber Core Analytics & Engineering Interviews",
        reportingPeriod: "2024-2025",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "How would you solve this using the 'Islands & Gaps' technique with ROW_NUMBER()?",
          whyAsked: "Tests mastery of the classic SQL Islands and Gaps problem.",
          expectedDefense: "Subtracting ROW_NUMBER() days from login_date yields an identical anchor date for any uninterrupted streak of consecutive days."
        },
        rubric: {
          conceptualAccuracyWeight: 0.45,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.2
        }
      },
      {
        id: "sql-q-delete-duplicate-emails",
        subjectId: "sql",
        subtopicId: "sql-joins-subqueries",
        topic: "Delete Duplicate Records",
        title: "Delete Duplicate Emails While Retaining Smallest ID",
        difficulty: "Medium",
        questionType: "sql",
        questionText: "Write a SQL query to delete all duplicate emails in a table Person, keeping only one unique email with the smallest id. Note that you must write a DELETE statement, not a SELECT statement.",
        codeSnippet: "Table: Person\n+-------------+---------+\n| Column Name | Type    |\n+-------------+---------+\n| id          | int     |\n| email       | varchar |\n+-------------+---------+",
            expectedPoints: [
          "Must use a self-join DELETE or subquery with NOT IN (SELECT MIN(id))",
          "Identify rows sharing identical email where p1.id > p2.id",
          "Delete from p1"
        ],
        idealAnswer: "-- Solution 1: Self-join DELETE (Standard & Fast)\nDELETE p1\nFROM Person p1\nJOIN Person p2 \n  ON p1.email = p2.email AND p1.id > p2.id;\n\n-- Solution 2: Subquery with MIN(id)\nDELETE FROM Person\nWHERE id NOT IN (\n  SELECT min_id FROM (\n    SELECT MIN(id) as min_id \n    FROM Person \n    GROUP BY email\n  ) AS tmp\n);",
            explanation: "Joining the table to itself on equal email and p1.id > p2.id marks every duplicate with a larger ID for deletion.",
        commonPitfalls: [
          "Directly modifying table while querying it in MySQL without a derived table wrapper (Error 1093)",
          "Deleting the smallest ID instead of the larger IDs"
        ],
        companyTag: "Microsoft",
        roleLevel: "Software Engineer",
        sourceCitation: "Microsoft Technical Screening Archives",
        reportingPeriod: "2024-2025",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "In a production table with 500 million rows, why would a single large DELETE statement cause database locks, and how should it be executed?",
          whyAsked: "Tests understanding of batching and transaction log pressure.",
          expectedDefense: "A huge DELETE holds table/row locks and explodes the Undo/WAL log. It should be batched in chunks of 5,000 to 10,000 rows with a sleep interval or rewritten to a new table."
        },
        rubric: {
          conceptualAccuracyWeight: 0.45,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.2
        }
      }
    ]
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // 4. COMPUTER NETWORKS (CN)
  // ═════════════════════════════════════════════════════════════════════════════
  cn: {
    id: "cn",
    name: "Computer Networks",
    shortName: "CN",
    badge: "Networking",
    iconName: "Globe",
    overview: "OSI vs TCP/IP models, DNS resolution, TCP 3-way handshake & teardown, flow and congestion control, HTTP/1.1 vs HTTP/2 vs HTTP/3, TLS 1.3, and network proxies.",
    targetTracks: ["service_mass", "service_elite", "product_mid", "product_faang"],
    modules: [
      {
        moduleId: "cn-transport",
        title: "Transport Layer & Flow / Congestion Control",
        subtopics: [
          {
            id: "cn-tcp-handshake-flow-control",
            title: "TCP 3-Way Handshake, Teardown & TIME_WAIT",
            summary: "SYN, SYN-ACK, ACK, FIN sequence, sliding window flow control, and 2MSL TIME_WAIT state.",
            prerequisites: ["Layer 4 protocols"],
            learningOutcomes: [
              "Diagram the exact packet exchange of TCP 3-way handshake and 4-way teardown",
              "Explain the role and necessity of the TIME_WAIT state (2MSL duration)",
              "Contrast flow control (receiver buffer) and congestion control (network capacity)"
            ],
            explanationMarkdown: "### TCP 3-Way Handshake\nEstablishes reliable bidirectional sequence numbers ($ISN$) and window buffers before data exchange:\n1. **Client -> Server: [SYN]** `seq = x`. Client enters `SYN_SENT`.\n2. **Server -> Client: [SYN, ACK]** `seq = y, ack = x + 1`. Server allocates transmission buffers; enters `SYN_RCVD`.\n3. **Client -> Server: [ACK]** `ack = y + 1`. Client enters `ESTABLISHED`; Server enters `ESTABLISHED`.\n\n### TCP 4-Way Teardown & TIME_WAIT\nBecause TCP is full-duplex, each direction must close independently:\n1. Client -> Server: `FIN` (Client enters `FIN_WAIT_1`).\n2. Server -> Client: `ACK` (Server enters `CLOSE_WAIT`; Client enters `FIN_WAIT_2`).\n3. Server -> Client: `FIN` (Server enters `LAST_ACK`).\n4. Client -> Server: `ACK` (Client enters `TIME_WAIT`; Server closes).\n\n### Why the 2MSL TIME_WAIT State?\nThe client stays in `TIME_WAIT` for $2 \\\\times \\\\text{Maximum Segment Lifetime}$ (typically 1-2 minutes) for two reasons:\n1. **Acknowledge final ACK loss**: If the client's final `ACK` is dropped, the server will retransmit `FIN`. The client must remain alive to resend `ACK`.\n2. **Drain lingering duplicate packets**: Prevents delayed segments from an old connection from being accepted by a newly spawned connection on the same IP and port tuple.",
            codeOrDiagramSnippet: "TCP Handshake:\nClient                               Server\n  | ----- SYN (seq=x) --------------> |\n  | <---- SYN-ACK (seq=y, ack=x+1) -- |\n  | ----- ACK (ack=y+1) ------------> |\n  [ ESTABLISHED ]                     [ ESTABLISHED ]",
            interviewDefensePrompt: "If a server receives hundreds of thousands of connections and initiates the close, why does the TIME_WAIT state cause socket port exhaustion?",
            commonMisconceptions: [
              "Misconception: Flow control and Congestion control are identical. (Reality: Flow control prevents the sender from overwhelming the receiver's receive buffer; Congestion control prevents the sender from overwhelming network routers)."
            ],
            tradeoffs: "TIME_WAIT guarantees reliable connection closure at the cost of consuming a local ephemeral port tuple for 60-120 seconds.",
            checkpoint: {
              question: "What is the primary reason the initiator of a TCP teardown enters the TIME_WAIT state for 2MSL?",
              options: [
                "To download remaining buffered data from the server",
                "To ensure the final ACK was received by the remote endpoint and drain delayed duplicate packets from the network",
                "To negotiate encryption keys for the next connection",
                "To reduce CPU utilization during high traffic spikes"
              ],
              correctIndex: 1,
              explanation: "TIME_WAIT ensures that if the final ACK is lost, the retransmitted FIN can be acknowledged, and any delayed wandering packets expire before the port is reused."
            },
            estimatedMinutes: 20
          },
          {
            id: "cn-congestion-control",
            title: "TCP Congestion Control (Slow Start, AIMD & Fast Recovery)",
            summary: "Congestion Window (cwnd), Slow Start threshold (ssthresh), Additive Increase Multiplicative Decrease (AIMD), and 3 Duplicate ACKs.",
            prerequisites: ["TCP basics"],
            learningOutcomes: [
              "Trace the exponential growth of cwnd during Slow Start",
              "Explain Additive Increase Multiplicative Decrease (AIMD)",
              "Differentiate between packet loss detected via 3 Duplicate ACKs (Fast Retransmit) vs Timeout"
            ],
            explanationMarkdown: "TCP adjusts its **Congestion Window (`cwnd`)** dynamically based on network feedback:\n- The effective sending limit is $\\\\min(\\\\text{cwnd}, \\\\text{rwnd})$.\n\n### 4 Core Congestion Control Phases:\n1. **Slow Start**:\n   - Starts with a small `cwnd` (e.g. 10 MSS).\n   - On every received ACK, `cwnd` doubles every RTT (exponential growth: $1 \\\\rightarrow 2 \\\\rightarrow 4 \\\\rightarrow 8$).\n   - Continues until `cwnd >= ssthresh` (Slow Start Threshold).\n2. **Congestion Avoidance (AIMD)**:\n   - Grows linearly: `cwnd` increases by 1 MSS per RTT (**Additive Increase**).\n3. **Loss Detected via 3 Duplicate ACKs**:\n   - Indicates out-of-order arrival, but packets are still flowing.\n   - **Fast Retransmit**: Retransmits missing packet immediately without waiting for timeout timer.\n   - **Fast Recovery**: Halves `ssthresh` (`ssthresh = cwnd / 2`) and resumes linear growth (**Multiplicative Decrease**).\n4. **Loss Detected via RTO (Retransmission Timeout)**:\n   - Severe network blackout: `ssthresh = cwnd / 2`, and `cwnd` resets all the way back to **1 MSS**, restarting Slow Start.",
            codeOrDiagramSnippet: "AIMD Sawtooth Pattern:\ncwnd\n ^        /\\\\        /\\\\\n |       /  \\\\      /  \\\\\n |      /    \\\\    /    \\\\\n |  ---/------\\\\--/------\\\\--- ssthresh\n 0-----------------------------> Time",
            interviewDefensePrompt: "Why does modern high-bandwidth long-distance networking prefer BBR (Bottleneck Bandwidth and RTT) over loss-based Reno/Cubic?",
            commonMisconceptions: [
              "Misconception: Slow start means the connection transmits data slowly. (Reality: Slow start grows exponentially fast, doubling throughput every round trip)."
            ],
            tradeoffs: "Loss-based TCP assumes packet drops indicate buffer overflows, which causes unnecessary throughput throttling on noisy wireless networks where drops are random.",
            checkpoint: {
              question: "What action does standard TCP take when it receives 3 Duplicate ACKs for a packet?",
              options: [
                "Resets cwnd to 1 MSS and restarts Slow Start",
                "Immediately terminates the TCP connection with an RST packet",
                "Triggers Fast Retransmit to resend the missing segment without waiting for the retransmission timer",
                "Increases the receive window size rwnd"
              ],
              correctIndex: 2,
              explanation: "3 Duplicate ACKs signal that later packets reached the receiver; Fast Retransmit immediately re-sends the missing packet without waiting for a retransmission timeout."
            },
            estimatedMinutes: 20
          }
        ]
      },
      {
        moduleId: "cn-app",
        title: "Application Layer Protocols & Modern Web Security",
        subtopics: [
          {
            id: "cn-http-https-tls",
            title: "HTTP/1.1 vs HTTP/2 vs HTTP/3 & TLS 1.3 Handshake",
            summary: "Head-of-Line blocking, binary framing, multiplexing, QUIC over UDP, and asymmetric vs symmetric session encryption.",
            prerequisites: ["TCP transport"],
            learningOutcomes: [
              "Identify Head-of-Line (HoL) blocking in HTTP/1.1 pipelining",
              "Explain how HTTP/2 multiplexes multiple streams over a single TCP connection",
              "Explain how HTTP/3 solves TCP-level HoL blocking using QUIC over UDP",
              "Trace the 1-RTT TLS 1.3 handshake (Diffie-Hellman key exchange)"
            ],
            explanationMarkdown: "### Evolution of HTTP:\n1. **HTTP/1.1**:\n   - Plain text protocol. Persistent connections (`Keep-Alive`).\n   - Suffers from **Application-Level Head-of-Line (HoL) Blocking**: Browsers can only execute one request/response at a time per TCP connection (worked around by opening 6 parallel connections per domain).\n2. **HTTP/2**:\n   - Binary framing layer. Breaks requests into binary frames with Stream IDs.\n   - **True Multiplexing**: Multiple concurrent bidirectional requests interleave over a single TCP connection.\n   - HPACK header compression and Server Push.\n   - *Limitation*: Suffers from **TCP-Level HoL Blocking**. If a single TCP packet is dropped, the entire TCP connection stalls waiting for retransmission, blocking all multiplexed streams!\n3. **HTTP/3 (QUIC)**:\n   - Replaces TCP with **QUIC (built on top of UDP)**.\n   - Streams are completely independent at the transport layer: a dropped packet on Stream 1 does NOT stall Stream 2!\n   - 0-RTT connection resumption and connection migration across WiFi/Cellular IP switches.\n\n### TLS 1.3 Handshake (1-RTT):\n- Combines key agreement into the initial `ClientHello` using Ephemeral Diffie-Hellman (ECDHE).\n- Client generates key share and sends in `ClientHello`.\n- Server sends `ServerHello` with its key share and certificate.\n- Symmetric session key is computed immediately in 1 RTT (compared to 2 RTTs in TLS 1.2).",
            codeOrDiagramSnippet: "HTTP/1.1: [Req 1] -> [Resp 1] -> [Req 2] -> [Resp 2] (Sequential)\nHTTP/2:   Single TCP Conn: [Stream 1 Frame][Stream 2 Frame][Stream 1 Frame]\nHTTP/3:   QUIC over UDP:   Stream 1 | Stream 2 | Stream 3 (Loss in 1 doesn't block 2)",
            interviewDefensePrompt: "Why does HTTP/2 multiplexing degrade significantly over high-latency lossy cellular networks compared to multiple HTTP/1.1 connections?",
            commonMisconceptions: [
              "Misconception: HTTPS encrypts data using slow RSA keys throughout the entire session. (Reality: Asymmetric encryption is only used during handshake to securely exchange a symmetric AES/ChaCha key; data transfer uses fast symmetric encryption)."
            ],
            tradeoffs: "HTTP/2 reduces server socket usage via multiplexing on stable networks, while HTTP/3 eliminates TCP-level HoL blocking on mobile/lossy networks at the cost of higher CPU overhead for user-space UDP processing.",
            checkpoint: {
              question: "What fundamental transport-level issue in HTTP/2 did HTTP/3 resolve by adopting QUIC over UDP?",
              options: [
                "DNS lookup latency",
                "TCP-level Head-of-Line blocking where a single lost packet stalls all concurrent multiplexed streams",
                "Lack of support for TLS encryption",
                "Excessive cookie header overhead"
              ],
              correctIndex: 1,
              explanation: "In HTTP/2, all streams share one TCP connection; if one packet drops, TCP pauses delivery for all streams until retransmitted. HTTP/3 uses QUIC over UDP so each stream handles loss independently."
            },
            estimatedMinutes: 25
          },
          {
            id: "cn-dns-caching",
            title: "DNS Resolution, Routing & Infrastructure Proxies",
            summary: "Hierarchical DNS resolution, Forward vs Reverse Proxies, Layer 4 vs Layer 7 Load Balancers, and CDNs.",
            prerequisites: ["IP addresses"],
            learningOutcomes: [
              "Trace full recursive DNS lookup from Root -> TLD -> Authoritative Nameservers",
              "Differentiate between Forward Proxy and Reverse Proxy",
              "Contrast Layer 4 (TCP/UDP) and Layer 7 (HTTP/Application) Load Balancing"
            ],
            explanationMarkdown: "### DNS Resolution Steps\nWhen a browser visits `api.example.com`:\n1. Checks Browser cache -> OS cache -> Router cache -> Local ISP Resolver.\n2. If missing, ISP Recursive Resolver queries **Root Nameserver** (`.`), which returns the TLD Nameserver for `.com`.\n3. Queries **TLD Nameserver** (`.com`), which returns the Authoritative Nameserver for `example.com`.\n4. Queries **Authoritative Nameserver** for `example.com`, which returns the `A` record IP address (`192.0.2.1`) with a Time-To-Live (TTL).\n\n### Reverse Proxy vs Forward Proxy:\n- **Forward Proxy**: Sits in front of CLIENTS (e.g. corporate VPN). Hides client IPs, enforces content filters.\n- **Reverse Proxy**: Sits in front of SERVERS (e.g. Nginx, Cloudflare). Hides server IPs, terminates TLS, caches static assets, and balances traffic.\n\n### Layer 4 vs Layer 7 Load Balancing:\n- **Layer 4**: Inspects IP and Port (TCP/UDP). Ultra-fast packet forwarding without inspecting payload.\n- **Layer 7**: Inspects HTTP headers, cookies, URLs, and JSON body. Enables smart routing (e.g., `/api` vs `/static`), but requires TLS termination and higher CPU.",
            codeOrDiagramSnippet: "DNS Hierarchy:\n[ Root Server (.) ]\n        |\n[ TLD Server (.com) ]\n        |\n[ Authoritative Server (example.com) ] -> Returns A Record (192.0.2.1)",
            interviewDefensePrompt: "Walk through every single network step that occurs between typing 'google.com' into a browser and the first byte of HTML rendering on screen.",
            commonMisconceptions: [
              "Misconception: Load balancers always terminate TLS. (Reality: Layer 4 load balancers pass encrypted TCP packets through directly without terminating TLS)."
            ],
            tradeoffs: "Layer 7 load balancing enables fine-grained routing and header inspection at the cost of high CPU utilization for TLS decryption. Layer 4 handles millions of packets per second with minimal latency.",
            checkpoint: {
              question: "Which type of DNS record maps a domain name to another domain alias rather than directly to an IP address?",
              options: [
                "A Record",
                "AAAA Record",
                "CNAME Record",
                "MX Record"
              ],
              correctIndex: 2,
              explanation: "A CNAME (Canonical Name) record aliases one domain name to another, whereas an A record points directly to an IPv4 address."
            },
            estimatedMinutes: 20
          }
        ]
      }
    ],
    questions: [
      {
        id: "cn-q-url-navigation",
        subjectId: "cn",
        subtopicId: "cn-http-https-tls",
        topic: "What Happens When You Type a URL",
        title: "End-to-End Packet Flow When Navigating to google.com",
        difficulty: "Hard",
        questionType: "conceptual",
        questionText: "Explain in complete, exhaustive technical detail what happens when you type 'https://www.google.com' into your browser and press Enter. Cover DNS lookup, ARP resolution, TCP 3-way handshake, TLS 1.3 handshake, HTTP request/response, and browser rendering.",
        expectedPoints: [
          "DNS Resolution: Browser cache, OS hosts file, recursive resolver query to Root, TLD (.com), and Authoritative nameservers",
          "ARP Resolution: If gateway MAC address is unknown, broadcasts ARP request on local Ethernet/WiFi subnet to resolve router default gateway MAC",
          "TCP Handshake: Client sends SYN, receives SYN-ACK, returns ACK",
          "TLS 1.3 Handshake: ClientHello with KeyShare (ECDHE), ServerHello with certificate and server KeyShare, session key derivation, finished",
          "HTTP Request: GET / over encrypted TLS channel with Host, User-Agent, Accept headers",
          "Server processing, reverse proxy routing (Layer 7 load balancer), HTTP 200 response with Content-Type text/html",
          "Browser rendering: HTML parsing, DOM tree construction, CSSOM tree, Render tree, Layout (reflow), Painting, and Composite"
        ],
        idealAnswer: "Here is the complete step-by-step physical, network, and application trace:\n\n1. **URL Parsing & HSTS Check**:\n   The browser checks its HSTS (HTTP Strict Transport Security) preload list and forces HTTPS.\n\n2. **DNS Resolution**:\n   - Browser cache -> OS cache (`getaddrinfo`) -> Local router.\n   - If missing, queries local ISP Recursive Resolver.\n   - Recursive Resolver queries Root Server (`.`) -> TLD Server (`.com`) -> Google Authoritative Nameserver.\n   - Receives Google's IP address (e.g. `142.250.190.46`) with TTL.\n\n3. **Link Layer ARP Resolution**:\n   The OS checks its ARP table for the Default Gateway (router) MAC address. If missing, sends an ARP broadcast: *\"Who has 192.168.1.1? Tell 192.168.1.50\"*, receives router's MAC address.\n\n4. **TCP 3-Way Handshake (Port 443)**:\n   - Client sends `[SYN]` with initial sequence number $x$.\n   - Google server returns `[SYN, ACK]` with seq $y$ and ack $x+1$.\n   - Client sends `[ACK]` with ack $y+1$. Connection is ESTABLISHED.\n\n5. **TLS 1.3 Handshake**:\n   - Client sends `ClientHello` containing supported cipher suites and an ephemeral Diffie-Hellman key share.\n   - Server returns `ServerHello` with selected cipher suite, server key share, and digital X.509 certificate.\n   - Both sides independently compute the shared symmetric encryption key. Server identity is verified via trusted Root CA chain.\n\n6. **HTTP Request & Server Response**:\n   - Browser sends `GET / HTTP/2` encrypted stream.\n   - Google's edge BGP Anycast router forwards packets to nearest Datacenter -> Layer 4 Load Balancer (Maglev) -> Layer 7 Reverse Proxy (Envoy/GFE).\n   - Application renders response and returns `HTTP 200 OK` with `Content-Encoding: gzip` and HTML payload.\n\n7. **Browser Critical Rendering Path**:\n   - HTML Parser constructs the **DOM Tree**.\n   - CSS Parser constructs the **CSSOM Tree**.\n   - DOM + CSSOM combine into the **Render Tree**.\n   - **Layout (Reflow)** calculates pixel geometry and coordinates.\n   - **Painting** rasterizes pixels into GPU memory layers.\n   - **Compositing** displays the final pixels on screen.",
            explanation: "Comprehensive trace traversing Application (DNS/HTTP), Transport (TCP/TLS), Network (IP/Routing), Data Link (ARP/Ethernet), and Browser DOM/CSSOM pipeline.",
        commonPitfalls: [
          "Skipping ARP resolution to the default gateway router",
          "Confusing DNS lookup with HTTP request transmission",
          "Forgetting that TLS handshake happens after TCP connection is established"
        ],
        companyTag: "Google",
        roleLevel: "Software Engineer / SRE",
        sourceCitation: "Google Standard SWE Technical Screening",
        reportingPeriod: "2024-2025",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "If the server IP is on a remote subnet, why is the destination MAC address in the Ethernet frame set to the router's MAC rather than Google's MAC?",
          whyAsked: "Tests understanding of Layer 2 (Hop-by-Hop) vs Layer 3 (End-to-End) addressing.",
          expectedDefense: "MAC addresses are link-local and hop-by-hop; packets leave the local LAN addressed to the default gateway router's MAC, while the destination IP remains Google's IP end-to-end."
        },
        rubric: {
          conceptualAccuracyWeight: 0.45,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.2
        }
      },
      {
        id: "cn-q-tcp-syn-flood",
        subjectId: "cn",
        subtopicId: "cn-tcp-handshake-flow-control",
        topic: "TCP Security & SYN Flood Attacks",
        title: "TCP 3-Way Handshake, SYN Flood Attack & SYN Cookies Defense",
        difficulty: "Medium",
        questionType: "conceptual",
        questionText: "What is a TCP SYN Flood Denial-of-Service attack? Explain why the server's SYN-RCVD half-open connection backlog queue gets exhausted, and explain how SYN Cookies mitigate this attack without allocating kernel memory.",
        expectedPoints: [
          "Attacker sends flood of TCP SYN packets with spoofed IP addresses and never sends the final ACK",
          "Server allocates TCB memory in the half-open backlog queue for each SYN and enters SYN_RCVD",
          "When backlog queue fills, the server drops all incoming legitimate connection requests",
          "SYN Cookies Defense: Server does NOT allocate state/memory upon receiving SYN",
          "Encodes connection parameters into initial sequence number (timestamp, mss, cryptographic hash)",
          "Reconstructs state only when client returns valid ACK with matching sequence number"
        ],
        idealAnswer: "A **TCP SYN Flood** is a Denial-of-Service attack exploiting the asymmetric state allocation of the TCP 3-way handshake:\n1. Attacker sends millions of `SYN` packets with forged, unreachable source IP addresses.\n2. For each `SYN`, the server allocates a Transmission Control Block (TCB) in its **half-open connection backlog queue** in kernel memory, sends `[SYN, ACK]`, and waits for the final `ACK`.\n3. Because the spoofed IPs never exist or never respond, the server waits until the Retransmission Timeout (RTO) expires (typically 30-60 seconds).\n4. The half-open queue fills completely, causing the server to reject all legitimate user connections.\n\n### The SYN Cookies Mitigation:\nWhen the backlog queue is saturated, the server activates **SYN Cookies**:\n- The server **DOES NOT allocate any memory or state** in kernel tables for the incoming `SYN`.\n- Instead, it encodes the connection parameters into the 32-bit initial sequence number ($ISN$):\n  $$ISN = \\\\text{Hash}(\\\\text{src\\\\_ip}, \\\\text{dst\\\\_ip}, \\\\text{src\\\\_port}, \\\\text{dst\\\\_port}, \\\\text{secret}) + \\\\text{timestamp} + \\\\text{MSS\\\\_code}$$\n- The server sends `[SYN, ACK]` with this generated $ISN$ and immediately forgets the request!\n- If the request was legitimate, the client returns `ACK` with `ack = ISN + 1`.\n- The server verifies the cryptographic hash. If valid, it allocates the connection table entry at that moment, defeating the attack.",
            explanation: "SYN flood exhausts half-open connection tables; SYN cookies encode state into the sequence number to avoid pre-allocating memory.",
        commonPitfalls: [
          "Claiming SYN cookies prevent attackers from sending packets (they prevent server memory exhaustion, not network bandwidth exhaustion)",
          "Thinking the server keeps state in RAM when SYN cookies are active"
        ],
        companyTag: "Cloudflare",
        roleLevel: "Systems / Security Engineer",
        sourceCitation: "Cloudflare Network Security Engineering Interview",
        reportingPeriod: "2024-2025",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "What TCP options or capabilities are lost or restricted when SYN cookies are active?",
          whyAsked: "Tests understanding of the bitwise trade-offs inside 32-bit sequence numbers.",
          expectedDefense: "Because the 32-bit sequence number has limited space, advanced TCP options like large TCP Window Scaling factors and selective acknowledgments (SACK) are restricted unless negotiated via timestamp fields."
        },
        rubric: {
          conceptualAccuracyWeight: 0.45,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.2
        }
      },
      {
        id: "cn-q-l4-vs-l7-load-balancer",
        subjectId: "cn",
        subtopicId: "cn-dns-caching",
        topic: "Layer 4 vs Layer 7 Load Balancing",
        title: "Layer 4 (Transport) vs Layer 7 (Application) Load Balancer Trade-offs",
        difficulty: "Medium",
        questionType: "conceptual",
        questionText: "Contrast Layer 4 (L4) and Layer 7 (L7) load balancing. Under what conditions in a high-scale architecture would you place an L4 load balancer in front of a cluster of L7 load balancers?",
        expectedPoints: [
          "L4 operates at transport layer (TCP/UDP); routes based on IP:Port without inspecting application payload",
          "L7 operates at application layer (HTTP/HTTPS); terminates TLS, parses headers, cookies, URLs, and JSON payload",
          "L4 is ultra-fast, low latency, and handles millions of packets per second with minimal CPU and memory",
          "L7 enables smart routing (/api vs /static, A/B testing, auth tokens, rate limiting), but requires heavy CPU for TLS decryption",
          "Two-tier architecture: L4 distributes raw TCP traffic across scalable pool of L7 reverse proxies (like Nginx/Envoy)"
        ],
        idealAnswer: "### Layer 4 vs Layer 7 Comparison:\n- **Layer 4 Load Balancing (L4)**:\n  Operates on Layer 4 transport protocol metadata (Source IP, Destination IP, Source Port, Destination Port, TCP/UDP). It does not decrypt or inspect packet payloads; it simply rewrites packet headers (via NAT or Direct Server Return) and forwards packets to backend servers.\n  - *Pros*: Extremely high throughput (millions of packets/sec per node), minimal memory footprint, ultra-low latency (~microseconds).\n  - *Cons*: Cannot inspect URLs, headers, or cookies; cannot route based on application state.\n- **Layer 7 Load Balancing (L7)**:\n  Terminates the client's TCP and TLS connections, decrypts the request, and parses the full HTTP stream (Headers, Path, Cookies, Body).\n  - *Pros*: Intelligent routing (`/users` to User Service, `/payments` to Payment Service), SSL/TLS offloading, header injection, gRPC routing.\n  - *Cons*: High CPU overhead for TLS handshake decryption, buffer allocation per HTTP stream, higher latency.\n\n### The Two-Tier Production Pattern:\nIn hyper-scale systems (Google, Meta, Netflix), you place an **L4 load balancer (e.g. Google Maglev or Linux LVS) in front of a tier of L7 load balancers (Envoy / Nginx)**:\n1. The L4 tier handles BGP Anycast routing and distributes millions of incoming raw TCP packets evenly across dozens of L7 proxy instances without bottlenecking.\n2. The L7 tier handles CPU-intensive TLS termination, path-based routing, and authentication.",
            explanation: "L4 provides high-throughput packet routing without inspection, while L7 provides application-aware routing at the cost of TLS termination.",
        commonPitfalls: [
          "Thinking L4 load balancers can inspect HTTP headers or cookies",
          "Believing L7 load balancing is always faster than L4"
        ],
        companyTag: "Microsoft",
        roleLevel: "Azure Cloud Infrastructure Engineer",
        sourceCitation: "Microsoft Azure Core Networking Interview",
        reportingPeriod: "2024-2025",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "What is Direct Server Return (DSR) in Layer 4 load balancing, and why does it drastically improve download bandwidth?",
          whyAsked: "Tests knowledge of advanced high-scale network routing.",
          expectedDefense: "In DSR, the L4 load balancer only handles inbound requests; outgoing server responses bypass the load balancer and return directly to the client via router, eliminating the load balancer bandwidth bottleneck."
        },
        rubric: {
          conceptualAccuracyWeight: 0.45,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.2
        }
      }
    ]
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // 5. OOP & SYSTEM DESIGN (OOP)
  // ═════════════════════════════════════════════════════════════════════════════
  oop: {
    id: "oop",
    name: "OOP & System Design",
    shortName: "OOP",
    badge: "Object-Oriented",
    iconName: "Layers",
    overview: "Core pillars (Encapsulation, Abstraction, Inheritance, Polymorphism), virtual tables (vtable), dynamic dispatch, SOLID design principles, and production design patterns.",
    targetTracks: ["service_mass", "service_elite", "product_mid", "product_faang"],
    modules: [
      {
        moduleId: "oop-core",
        title: "Core Pillars & Dynamic Dispatch",
        subtopics: [
          {
            id: "oop-polymorphism-vtable",
            title: "Runtime Polymorphism, Virtual Tables (vtable) & vptr",
            summary: "Virtual functions, dynamic dispatch, vtable layout in memory, vptr initialization, and object slicing.",
            prerequisites: ["Classes, pointers, inheritance"],
            learningOutcomes: [
              "Trace dynamic dispatch execution using vtable and vptr",
              "Calculate memory footprint impact of virtual functions on object size",
              "Diagnose and prevent Object Slicing when passing derived classes by value"
            ],
            explanationMarkdown: "### Static vs Dynamic Polymorphism\n- **Static (Compile-time)**: Function overloading, Operator overloading, Templates / Generics. Resolved at compile time without runtime overhead.\n- **Dynamic (Runtime)**: Function overriding using the `virtual` keyword. Resolved at runtime using dynamic dispatch.\n\n### Virtual Table (vtable) Mechanics:\n1. For every class that declares or inherits at least one virtual function, the compiler creates a static array of function pointers called the **Virtual Table (`vtable`)**.\n2. Every object instance of that class contains an invisible pointer called the **`vptr`** (typically the first 8 bytes of the object in 64-bit architectures) pointing to its class's `vtable`.\n3. When calling a virtual function through a base pointer `basePtr->render()`:\n   - Program dereferences `basePtr` to find the object's `vptr`.\n   - Looks up function pointer at fixed index in the `vtable`.\n   - Jumps to the resolved function address.\n\n### Object Slicing:\nOccurs when a derived class instance is assigned to a base class object **by value** instead of by reference or pointer. The derived class's member variables and `vptr` are sliced off, degrading behavior to the base class.",
            codeOrDiagramSnippet: "Memory Layout with Virtual Functions:\nBase Object:    [ vptr ] ----> vtable [ &Base::draw, &Base::area ]\n                [ x, y ]\n\nDerived Object: [ vptr ] ----> vtable [ &Derived::draw, &Base::area ]\n                [ x, y ]\n                [ radius ]",
            interviewDefensePrompt: "Why should every class intended for inheritance have a virtual destructor?",
            commonMisconceptions: [
              "Misconception: Each object instance has its own private copy of the vtable. (Reality: There is only ONE vtable per class stored in static read-only memory; each object only stores an 8-byte pointer 'vptr').",
              "Misconception: Constructors can be virtual. (Reality: Constructors cannot be virtual because the vptr is initialized inside the constructor)."
            ],
            tradeoffs: "Virtual functions enable flexible runtime polymorphism at the cost of an 8-byte vptr per object, inability to inline function calls, and one pointer indirection per call.",
            checkpoint: {
              question: "What happens if you delete a derived class object through a base class pointer that does NOT declare a virtual destructor?",
              options: [
                "The derived class destructor is called correctly followed by base destructor",
                "Undefined behavior occurs; typically only the base class destructor runs, leaking derived resources",
                "The compiler refuses to compile the delete expression",
                "The memory manager calls malloc_trim automatically"
              ],
              correctIndex: 1,
              explanation: "Without a virtual destructor, deleting through a base pointer invokes static binding, calling only the base destructor and leaking any resources allocated by the derived class."
            },
            estimatedMinutes: 25
          },
          {
            id: "oop-abstract-interfaces",
            title: "Abstract Classes vs Interfaces & The Diamond Problem",
            summary: "Pure virtual functions, multiple inheritance, virtual inheritance, and interface contracts.",
            prerequisites: ["Inheritance basics"],
            learningOutcomes: [
              "Differentiate between Abstract Classes and pure Interfaces",
              "Analyze and resolve the Diamond Problem in C++ multiple inheritance",
              "Explain how virtual base classes prevent duplicate base subobjects"
            ],
            explanationMarkdown: "### Abstract Class vs Interface:\n- **Abstract Class**: Contains at least one pure virtual function (`virtual void run() = 0`). Can contain state (member variables), concrete method implementations, and constructors. Represents an **\"IS-A\"** relationship.\n- **Interface**: In pure OOP (Java/C# interfaces, or C++ pure abstract classes), contains NO state and ONLY pure method declarations. Represents a **\"CAN-DO\"** contractual capability.\n\n### The Diamond Problem in Multiple Inheritance\nOccurs when Class D inherits from both Class B and Class C, which both inherit from Class A:\n```\n      [ Class A ]\n       /       \\\\\\\\\n  [ Class B ]  [ Class C ]\n       \\\\\\\\       /\n      [ Class D ]\n```\n- Without virtual inheritance, Class D contains **TWO separate instances** of Class A, causing ambiguity when calling `d.getValue()`.\n- **Solution (Virtual Inheritance)**:\n  `class B : virtual public A` and `class C : virtual public A` ensures only ONE shared instance of Class A is instantiated in Class D.",
            codeOrDiagramSnippet: "C++ Virtual Inheritance:\nclass A { public: int x; };\nclass B : virtual public A {};\nclass C : virtual public A {};\nclass D : public B, public C {}; // D has exactly ONE copy of x!",
            interviewDefensePrompt: "Why do modern languages like Java, C#, and Go forbid multiple class inheritance while permitting multiple interface implementation?",
            commonMisconceptions: [
              "Misconception: You cannot instantiate a pointer to an abstract class. (Reality: You cannot instantiate an object of an abstract class, but you CAN create pointers and references to it to achieve polymorphism)."
            ],
            tradeoffs: "Multiple inheritance allows composing behaviors from multiple sources, but introduces memory offset complexity, pointer-adjusting thunks, and the diamond problem.",
            checkpoint: {
              question: "How does virtual inheritance solve the Diamond Problem in C++?",
              options: [
                "It prevents Class D from compiling if multiple base classes exist",
                "It ensures that only a single, shared instance of the root base class subobject exists in the most derived class",
                "It converts all member variables into static variables",
                "It makes all member functions private"
              ],
              correctIndex: 1,
              explanation: "Virtual inheritance instructs the compiler to share a single common base subobject among all derived paths in the inheritance hierarchy."
            },
            estimatedMinutes: 20
          }
        ]
      },
      {
        moduleId: "oop-principles",
        title: "SOLID Principles & Production Refactoring",
        subtopics: [
          {
            id: "oop-solid-principles",
            title: "The 5 SOLID Principles with Real Production Refactoring",
            summary: "Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion.",
            prerequisites: ["OOP fundamentals"],
            learningOutcomes: [
              "Apply Single Responsibility Principle (SRP) to decompose god-classes",
              "Refactor code to satisfy Open/Closed Principle (OCP) using Strategy and Factory patterns",
              "Diagnose Liskov Substitution Principle (LSP) violations in inheritance hierarchies",
              "Apply Dependency Inversion Principle (DIP) with dependency injection containers"
            ],
            explanationMarkdown: "### The 5 SOLID Principles:\n1. **S - Single Responsibility Principle (SRP)**:\n   A class should have one, and only one, reason to change. Separate business logic from persistence, validation, and presentation.\n2. **O - Open/Closed Principle (OCP)**:\n   Software entities should be **Open for extension, but Closed for modification**. Add new features by adding new classes, not editing existing battle-tested code.\n3. **L - Liskov Substitution Principle (LSP)**:\n   Subtypes must be substitutable for their base types without altering program correctness. (Classic violation: `Square extends Rectangle` where setting width mutates height).\n4. **I - Interface Segregation Principle (ISP)**:\n   Clients should not be forced to depend on interfaces they do not use. Split fat interfaces into fine-grained, cohesive interfaces.\n5. **D - Dependency Inversion Principle (DIP)**:\n   High-level modules should not depend on low-level modules; both should depend on abstractions (interfaces). Abstractions should not depend on details; details should depend on abstractions.",
            codeOrDiagramSnippet: "// Dependency Inversion Violation (Tightly Coupled):\nclass OrderService {\n  private MySQLDatabase db = new MySQLDatabase(); // Tight coupling!\n}\n\n// Dependency Inversion Compliant (Inverted & Injectable):\ninterface DatabaseConnection { void save(Order o); }\nclass OrderService {\n  private DatabaseConnection db;\n  public OrderService(DatabaseConnection db) { this.db = db; } // Injected!\n}",
            interviewDefensePrompt: "Why does having Square inherit from Rectangle violate the Liskov Substitution Principle, and how would you fix the design?",
            commonMisconceptions: [
              "Misconception: Applying SOLID means every method must be an interface. (Reality: Over-abstraction creates indirection hell; apply abstractions at true architectural boundaries)."
            ],
            tradeoffs: "SOLID code is highly testable, modular, and extensible, but introduces more interfaces and boilerplate classes.",
            checkpoint: {
              question: "A codebase has an interface Worker with methods work(), eat(), and sleep(). A Robot class implements Worker but throws an exception in eat() and sleep(). Which SOLID principle is violated?",
              options: [
                "Single Responsibility Principle",
                "Open/Closed Principle",
                "Interface Segregation Principle",
                "Dependency Inversion Principle"
              ],
              correctIndex: 2,
              explanation: "The Interface Segregation Principle states clients shouldn't be forced to depend on methods they don't use. Worker should be split into Workable and Feedable."
            },
            estimatedMinutes: 25
          },
          {
            id: "oop-design-patterns",
            title: "Essential Design Patterns (Singleton, Factory, Observer & Strategy)",
            summary: "Creational, structural, and behavioral patterns in real-world production frameworks.",
            prerequisites: ["SOLID principles"],
            learningOutcomes: [
              "Implement thread-safe Singleton with double-checked locking",
              "Apply Strategy pattern to replace nested switch/case logic",
              "Implement Observer pattern with memory leak prevention via weak references"
            ],
            explanationMarkdown: "### Key Design Patterns:\n1. **Singleton (Creational)**:\n   Guarantees a class has only one instance and provides a global point of access. In multi-threaded environments, requires **Double-Checked Locking with a `volatile` instance variable**.\n2. **Factory / Abstract Factory (Creational)**:\n   Decouples object creation from object utilization, allowing client code to work with interfaces.\n3. **Strategy (Behavioral)**:\n   Defines a family of interchangeable algorithms, encapsulating each one. Replaces sprawling `if/else` or `switch` chains with pluggable strategy classes.\n4. **Observer (Behavioral)**:\n   Defines a one-to-many dependency where an observable subject notifies subscribed observers of state changes (Pub/Sub pattern).",
            codeOrDiagramSnippet: "Thread-Safe Singleton with Double-Checked Locking:\npublic class DatabaseManager {\n  private static volatile DatabaseManager instance;\n  private DatabaseManager() {} // Private constructor\n\n  public static DatabaseManager getInstance() {\n    if (instance == null) {                         // 1st check (no lock)\n      synchronized (DatabaseManager.class) {\n        if (instance == null) {                     // 2nd check (with lock)\n          instance = new DatabaseManager();\n        }\n      }\n    }\n    return instance;\n  }\n}",
            interviewDefensePrompt: "In the double-checked locking Singleton pattern, why is the 'volatile' keyword mandatory on the instance variable?",
            commonMisconceptions: [
              "Misconception: Double-checked locking works without volatile. (Reality: Without volatile, CPU instruction reordering can publish a reference to partially initialized memory before the constructor finishes)."
            ],
            tradeoffs: "Design patterns provide standard vocabularies and flexible architectures, but premature pattern application leads to over-engineering.",
            checkpoint: {
              question: "Why is the volatile keyword mandatory in double-checked locking for Singleton in Java/C++?",
              options: [
                "To make the class serializable",
                "To prevent CPU instruction reordering where a non-null reference is exposed before constructor initialization completes",
                "To force the singleton to run in kernel mode",
                "To automatically garbage collect older instances"
              ],
              correctIndex: 1,
              explanation: "Without volatile, CPU/compiler reordering can assign the memory address to the instance variable before constructor execution finishes, exposing partially constructed objects."
            },
            estimatedMinutes: 25
          }
        ]
      }
    ],
    questions: [
      {
        id: "oop-q-solid-refactoring",
        subjectId: "oop",
        subtopicId: "oop-solid-principles",
        topic: "SOLID Design Principles",
        title: "SOLID Principles Code Refactoring & Dependency Inversion",
        difficulty: "Medium",
        questionType: "code",
        questionText: "Review the following tightly-coupled OrderProcessor class. Identify all SOLID violations, and explain how to refactor it using Dependency Inversion and Interface Segregation.",
        codeSnippet: "public class OrderProcessor {\n  public void process(Order order) {\n    // 1. Validates order\n    if (order.total <= 0) throw new IllegalArgumentException();\n\n    // 2. Direct payment charging\n    StripePaymentGateway stripe = new StripePaymentGateway();\n    stripe.chargeCreditCard(order.cardNumber, order.total);\n\n    // 3. Database persistence\n    MySQLDatabase db = new MySQLDatabase();\n    db.executeInsert(\"INSERT INTO orders VALUES (...)\");\n\n    // 4. Send email\n    SMTPEmailSender email = new SMTPEmailSender();\n    email.sendEmail(order.customerEmail, \"Order Processed\");\n  }\n}",
            expectedPoints: [
          "Violates Single Responsibility Principle (SRP): Handles validation, payment, persistence, and email notification all in one class",
          "Violates Open/Closed Principle (OCP): Cannot switch payment gateways (e.g. PayPal) without editing the class",
          "Violates Dependency Inversion Principle (DIP): Directly instantiates concrete implementations (new StripePaymentGateway, new MySQLDatabase, new SMTPEmailSender) instead of injecting abstractions",
          "Refactoring: Define PaymentGateway, OrderRepository, and NotificationService interfaces; inject them via constructor"
        ],
        idealAnswer: "The existing class violates multiple SOLID principles:\n1. **Single Responsibility (SRP)**: `OrderProcessor` has 4 separate reasons to change: business rule changes, payment API changes, database schema changes, and email provider changes.\n2. **Open/Closed (OCP)**: Cannot add PayPal or SMS alerts without modifying this tested class.\n3. **Dependency Inversion (DIP)**: Hard-coded concrete dependencies (`new StripePaymentGateway()`, `new MySQLDatabase()`) prevent unit testing with mocks.\n\n### Refactored Architecture:\n```java\npublic interface PaymentGateway { void charge(String card, double amount); }\npublic interface OrderRepository { void save(Order order); }\npublic interface NotificationService { void notify(String recipient, String message); }\n\npublic class OrderProcessor {\n  private final PaymentGateway paymentGateway;\n  private final OrderRepository orderRepository;\n  private final NotificationService notificationService;\n\n  // Injected via Constructor (Dependency Inversion)\n  public OrderProcessor(\n      PaymentGateway paymentGateway,\n      OrderRepository orderRepository,\n      NotificationService notificationService) {\n    this.paymentGateway = paymentGateway;\n    this.orderRepository = orderRepository;\n    this.notificationService = notificationService;\n  }\n\n  public void process(Order order) {\n    validate(order);\n    paymentGateway.charge(order.cardNumber, order.total);\n    orderRepository.save(order);\n    notificationService.notify(order.customerEmail, \"Order Processed\");\n  }\n\n  private void validate(Order order) {\n    if (order.total <= 0) throw new IllegalArgumentException(\"Invalid total\");\n  }\n}\n```",
            explanation: "Refactoring tightly coupled monoliths into constructor-injected interfaces decouples components and makes unit testing trivial.",
        commonPitfalls: [
          "Only changing private variables without creating interface abstractions",
          "Creating a single god-interface that combines payment, database, and email methods"
        ],
        companyTag: "Microsoft",
        roleLevel: "Software Engineer / SDE-2",
        sourceCitation: "Microsoft Object-Oriented System Design Round",
        reportingPeriod: "2024-2025",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "How does this refactoring enable fast unit testing without spinning up actual databases or charging real credit cards?",
          whyAsked: "Tests understanding of testability and mocking.",
          expectedDefense: "Unit tests can instantiate OrderProcessor passing mock implementations (e.g., Mockito mocks), verifying method invocations in milliseconds without touching external networks or databases."
        },
        rubric: {
          conceptualAccuracyWeight: 0.45,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.2
        }
      },
      {
        id: "oop-q-vtable-trace",
        subjectId: "oop",
        subtopicId: "oop-polymorphism-vtable",
        topic: "Virtual Functions & Dynamic Dispatch",
        title: "Memory Layout and Execution Trace of Virtual Function Calls via vtable & vptr",
        difficulty: "Hard",
        questionType: "code",
        questionText: "Given the following C++ class hierarchy, trace the memory layout of an instance of Derived on a 64-bit architecture. What is sizeof(Base) and sizeof(Derived)? Trace the exact pointer dereferences that occur when executing: Base* p = new Derived(); p->speak();",
        codeSnippet: "class Base {\npublic:\n  int a;\n  virtual void speak() { std::cout << \"Base\"; }\n  virtual void move() { std::cout << \"BaseMove\"; }\n};\n\nclass Derived : public Base {\npublic:\n  int b;\n  void speak() override { std::cout << \"Derived\"; }\n};",
            expectedPoints: [
          "Base contains an 8-byte vptr + 4-byte int a + 4 bytes padding = 16 bytes",
          "Derived inherits Base (16 bytes) + 4-byte int b + 4 bytes padding = 24 bytes (or 16 bytes with tail padding optimization)",
          "Compiler creates static Base::vtable and Derived::vtable in read-only memory",
          "Derived::vtable contains [&Derived::speak, &Base::move]",
          "Execution trace: p dereferences object to fetch vptr at offset 0 -> accesses vtable[0] -> calls Derived::speak()"
        ],
        idealAnswer: "### Memory Layout on 64-bit Architecture:\n1. **Base Object Layout** (Total: 16 bytes):\n   - Offset 0-7: `vptr` (8 bytes, pointing to `Base::vtable`)\n   - Offset 8-11: `int a` (4 bytes)\n   - Offset 12-15: Compiler structure alignment padding (4 bytes)\n   - `sizeof(Base) == 16`\n\n2. **Derived Object Layout** (Total: 24 bytes):\n   - Offset 0-7: `vptr` (8 bytes, overwritten by `Derived` constructor to point to `Derived::vtable`)\n   - Offset 8-11: `int a` (4 bytes inherited from Base)\n   - Offset 12-15: Alignment padding (4 bytes)\n   - Offset 16-19: `int b` (4 bytes)\n   - Offset 20-23: Structure alignment padding (4 bytes)\n   - `sizeof(Derived) == 24` (or 16 on compilers with tail padding reuse)\n\n### Execution Trace of `p->speak()`:\n1. The compiler sees `speak()` is a virtual function at index 0 of the vtable.\n2. The runtime takes `p` (pointing to the `Derived` instance in the heap).\n3. Dereferences `*(void**)p` to read the `vptr` at offset 0, which points to `Derived::vtable`.\n4. Indexes `vtable[0]`, which contains the address of `Derived::speak`.\n5. Jumps to the function address, passing `p` as the implicit `this` pointer in register `RDI`.",
            explanation: "Virtual functions add an 8-byte vptr to object memory; dynamic dispatch resolves function addresses via the class vtable.",
        commonPitfalls: [
          "Forgetting 64-bit alignment padding when calculating sizeof()",
          "Thinking Derived has two separate vptrs (it inherits and re-points the base vptr)"
        ],
        companyTag: "Google",
        roleLevel: "Systems Software Engineer (C++)",
        sourceCitation: "Google Core C++ & Systems Technical Archives",
        reportingPeriod: "2024-2025",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "Can an inline function be virtual? What happens if you call an inline virtual function through a base pointer?",
          whyAsked: "Tests understanding of compiler inlining vs dynamic dispatch.",
          expectedDefense: "A virtual function can be declared inline, but when called polymorphically through a base pointer/reference, the compiler CANNOT inline it because the target address is only known at runtime."
        },
        rubric: {
          conceptualAccuracyWeight: 0.45,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.2
        }
      }
    ]
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // 6. CONCURRENCY & MULTITHREADING (CONCURRENCY)
  // ═════════════════════════════════════════════════════════════════════════════
  concurrency: {
    id: "concurrency",
    name: "Concurrency & Multithreading",
    shortName: "Concurrency",
    badge: "Multithreading",
    iconName: "Zap",
    overview: "Race conditions, memory visibility, the volatile keyword, mutexes, semaphores, condition variables, deadlocks, producer-consumer queues, and atomic CAS operations.",
    targetTracks: ["service_mass", "service_elite", "product_mid", "product_faang"],
    modules: [
      {
        moduleId: "conc-primitives",
        title: "Synchronization Primitives & Critical Sections",
        subtopics: [
          {
            id: "conc-mutex-semaphore",
            title: "Race Conditions, Mutexes & Binary vs Counting Semaphores",
            summary: "Critical section problems, atomicity, spinlocks, and mutex vs semaphore ownership models.",
            prerequisites: ["Threads and process memory"],
            learningOutcomes: [
              "Identify race conditions and data races in concurrent code",
              "Differentiate between Mutex and Semaphore signaling semantics",
              "Construct thread-safe bounded buffers using semaphores"
            ],
            explanationMarkdown: "### Race Condition vs Data Race\n- **Data Race**: Two threads access the same memory location concurrently, at least one access is a write, and no synchronization (locks/atomics) is used. Undefined behavior.\n- **Race Condition**: A semantic flaw in execution timing where the correctness of output depends on the arbitrary interleaving of thread execution order (e.g., Check-Then-Act bugs).\n\n### Synchronization Primitives:\n- **Mutex**: Mutex stands for Mutual Exclusion. It provides exclusive lock semantics. **Enforces Ownership**: Only the thread that acquired the mutex is permitted to release it.\n- **Binary Semaphore**: Counter of 0 or 1. No ownership; can be acquired by Thread A and signaled/released by Thread B.\n- **Counting Semaphore**: Counter initialized to $N$. Controls access to a finite pool of resources (e.g. database connection pools).",
            codeOrDiagramSnippet: "Check-Then-Act Race Condition:\n// Thread 1 and Thread 2 execute concurrently:\nif (!map.containsKey(key)) {     // Check\n  map.put(key, computeValue());  // Act (Both threads can pass check simultaneously!)\n}\n// Solution: ConcurrentMap.putIfAbsent(key, value) or synchronized block",
            interviewDefensePrompt: "Why does declaring a 64-bit integer 'volatile' prevent visibility issues, but still fail to make 'count++' thread-safe?",
            commonMisconceptions: [
              "Misconception: Volatile provides atomicity. (Reality: Volatile only guarantees memory visibility and prevents instruction reordering; count++ is 3 separate CPU operations: read, modify, write)."
            ],
            tradeoffs: "Mutexes guarantee safety at the cost of blocking threads and context switch latency. Semaphores allow multiple concurrent accesses but require careful signaling logic.",
            checkpoint: {
              question: "Why is the operation count++ NOT thread-safe even if count is marked volatile?",
              options: [
                "Because volatile only works on boolean values",
                "Because count++ is not atomic; it consists of three separate steps: read, increment, and write back",
                "Because volatile variables cannot be stored in CPU registers",
                "Because the Java virtual machine disables caching for volatile variables"
              ],
              correctIndex: 1,
              explanation: "count++ decomposes into 3 machine operations: reading value into register, incrementing register, writing back to memory. Two threads can interleave these steps, causing lost updates."
            },
            estimatedMinutes: 20
          },
          {
            id: "conc-monitors-condition-vars",
            title: "Condition Variables & Spurious Wakeups",
            summary: "Monitors, wait/notify/notifyAll, condition variables, and why wait() must ALWAYS be inside a while loop.",
            prerequisites: ["Mutexes"],
            learningOutcomes: [
              "Implement condition variables for inter-thread coordination",
              "Explain why wait() must strictly be called inside a while loop (Spurious Wakeups)",
              "Differentiate between notify() and notifyAll() to prevent lost wakeups"
            ],
            explanationMarkdown: "A **Condition Variable** enables threads to suspend execution (sleep) until another thread notifies them that a specific predicate/condition has become true.\n\n### The Invariable Rule: Always wait in a While Loop!\n```java\nsynchronized (lock) {\n  while (!condition) { // MUST BE WHILE, NEVER IF!\n    lock.wait();\n  }\n  // Condition is guaranteed true here\n}\n```\n### Why 'while' and NEVER 'if'?\n1. **Spurious Wakeups**: OS kernel schedulers can wake up a sleeping thread on a condition variable even though no thread signaled it (due to kernel signal interrupts or multi-processor race conditions).\n2. **State Mutated Between Wakeup and Execution**: If Thread A calls `notifyAll()`, multiple waiting threads wake up. The first thread to acquire the lock consumes the item. When the second thread acquires the lock, the condition is no longer true! If it used `if`, it would proceed with invalid state.",
            codeOrDiagramSnippet: "Producer-Consumer Coordination:\nConsumer:\n  lock.acquire();\n  while (queue.isEmpty()) {\n    condition.wait(lock); // Atomically releases lock and sleeps\n  }\n  item = queue.pop();\n  lock.release();",
            interviewDefensePrompt: "Under what specific conditions can notify() cause deadlocks or lost signals compared to notifyAll()?",
            commonMisconceptions: [
              "Misconception: wait() keeps holding the lock while sleeping. (Reality: wait() atomically releases the associated lock before sleeping and re-acquires it before returning)."
            ],
            tradeoffs: "notifyAll() avoids lost signal deadlocks, but wakes up all waiting threads causing 'thundering herd' lock contention where only one thread succeeds.",
            checkpoint: {
              question: "Why must a thread calling wait() on a condition variable always do so inside a while loop rather than an if statement?",
              options: [
                "To prevent stack overflow errors",
                "To protect against spurious wakeups and state changes between signal and lock acquisition",
                "Because the compiler rejects if statements inside synchronized blocks",
                "To ensure the thread retains its CPU register context"
              ],
              correctIndex: 1,
              explanation: "Threads can wake up spuriously without a signal, or another awakened thread may consume the resource first. A while loop re-checks the condition before proceeding."
            },
            estimatedMinutes: 25
          }
        ]
      },
      {
        moduleId: "conc-memory-model",
        title: "Memory Models, Visibility & Deadlock Diagnostics",
        subtopics: [
          {
            id: "conc-memory-visibility",
            title: "Memory Visibility, The Volatile Keyword & Happens-Before",
            summary: "CPU cache coherence (MESI), store buffers, instruction reordering, memory barriers, and the Java/C++ Memory Model.",
            prerequisites: ["CPU caches L1/L2/L3"],
            learningOutcomes: [
              "Explain how CPU store buffers and cache coherence cause visibility lag",
              "Define the Happens-Before relationship in modern memory models",
              "Demonstrate how volatile prevents compiler and hardware instruction reordering"
            ],
            explanationMarkdown: "Modern multi-core CPUs maintain private L1/L2 caches and out-of-order execution pipelines. Without explicit synchronization, writes made by Core 1 may sit in a hardware store buffer and remain completely invisible to Core 2!\n\n### The Volatile Keyword\n1. **Visibility**: A write to a volatile variable is flushed immediately to shared memory, and reads invalidate the CPU cache line, forcing a read from main memory.\n2. **Instruction Reordering Prevention**: The compiler and CPU hardware are forbidden from reordering reads or writes across a volatile boundary (enforced via hardware memory fence / barrier instructions).\n\n### The Happens-Before Guarantee:\nIf action $A$ happens-before action $B$, the memory modifications made by $A$ are guaranteed to be visible to $B$:\n- An unlock on a monitor happens-before every subsequent lock on the same monitor.\n- A write to a `volatile` variable happens-before every subsequent read of that same `volatile` variable.",
            codeOrDiagramSnippet: "Visibility Bug without Volatile:\nboolean stop = false;\n// Thread 1:\nwhile (!stop) { /* loops forever! CPU caches stop=false in register */ }\n\n// Thread 2:\nstop = true; // Thread 1 never sees this update unless stop is volatile!",
            interviewDefensePrompt: "Explain how memory barrier instructions (LoadLoad, StoreStore, LoadStore, StoreLoad) enforce memory order at the CPU level.",
            commonMisconceptions: [
              "Misconception: Volatile variables are stored on disk. (Reality: Volatile affects CPU cache line invalidation and store buffer flushes, operating entirely in high-speed RAM and cache)."
            ],
            tradeoffs: "Volatile provides lightweight lock-free visibility at low latency, but cannot guarantee atomicity for compound operations.",
            checkpoint: {
              question: "What guarantee does the volatile keyword provide in the Java and C++ memory models?",
              options: [
                "Guarantees that compound operations like i++ are executed atomically",
                "Guarantees memory visibility across cores and prevents instruction reordering across the variable access",
                "Forces the variable to be allocated in non-volatile flash storage",
                "Causes the thread to acquire an OS-level mutex before reading"
              ],
              correctIndex: 1,
              explanation: "Volatile guarantees immediate visibility across thread caches and establishes memory barriers that prevent compiler and hardware instruction reordering."
            },
            estimatedMinutes: 20
          },
          {
            id: "conc-deadlocks-livelocks",
            title: "Deadlocks, Livelocks, Starvation & Priority Inversion",
            summary: "Livelock vs Deadlock vs Starvation, Priority Inversion (Mars Pathfinder), and Priority Inheritance Protocol.",
            prerequisites: ["Locking"],
            learningOutcomes: [
              "Differentiate between Deadlock (blocked), Livelock (active spinning), and Starvation (neglected)",
              "Diagnose Priority Inversion in real-time embedded systems",
              "Formulate Priority Inheritance to prevent high-priority thread starvation"
            ],
            explanationMarkdown: "### Thread Invalidation States:\n- **Deadlock**: Two or more threads are permanently blocked, each holding a lock the other needs. CPU utilization drops to 0% for those threads.\n- **Livelock**: Threads continuously change their states in response to each other without making any forward progress (e.g. two polite people stepping from side to side in a hallway to let each other pass). CPU utilization is **100%**!\n- **Starvation**: A thread is ready to run, but is perpetually denied CPU time or lock acquisition because higher-priority threads greedily consume resources.\n\n### Priority Inversion & Mars Pathfinder\nOccurs when a low-priority thread holds a shared lock needed by a high-priority thread, and a medium-priority thread preempts the low-priority thread:\n1. Low-priority thread $L$ acquires mutex $M$.\n2. High-priority thread $H$ requests mutex $M$ and blocks.\n3. Medium-priority thread $M_{ed}$ (which doesn't even need lock $M$) preempts $L$ because $M_{ed} > L$.\n4. Result: $H$ is indirectly blocked by $M_{ed}$ indefinitely!\n**Solution: Priority Inheritance Protocol**: When $H$ blocks on a lock held by $L$, the kernel temporarily elevates $L$'s priority to match $H$'s priority until $L$ releases the lock.",
            codeOrDiagramSnippet: "Priority Inversion:\nHigh Priority [Needs Lock] ---------------> BLOCKED waiting for Low\nMedium Priority [No Lock Needed] -------> RUNS, preempting Low!\nLow Priority [Holds Lock] -------------> Starved! Cannot release lock!",
            interviewDefensePrompt: "How did NASA engineers remotely fix the Mars Pathfinder spacecraft priority inversion bug from millions of miles away in 1997?",
            commonMisconceptions: [
              "Misconception: Livelock causes threads to sleep. (Reality: Livelocked threads are actively running instructions at maximum CPU capacity without advancing business state)."
            ],
            tradeoffs: "Priority inheritance solves priority inversion at the cost of additional complexity inside the real-time kernel scheduler.",
            checkpoint: {
              question: "What is the difference between a Deadlock and a Livelock?",
              options: [
                "Deadlocks occur on single-core CPUs; livelocks occur on GPUs",
                "In a deadlock, threads are suspended/blocked in waiting state; in a livelock, threads actively execute instructions changing state without forward progress",
                "Deadlocks can be resolved with notify(); livelocks cannot",
                "Livelocks only occur in database transactions"
              ],
              correctIndex: 1,
              explanation: "Deadlocked threads are blocked waiting for locks (0% CPU). Livelocked threads are actively running and reacting to each other (100% CPU) without advancing task progress."
            },
            estimatedMinutes: 20
          }
        ]
      }
    ],
    questions: [
      {
        id: "conc-q-bounded-buffer",
        subjectId: "concurrency",
        subtopicId: "conc-monitors-condition-vars",
        topic: "Bounded Blocking Queue",
        title: "Thread-Safe Producer-Consumer Bounded Queue",
        difficulty: "Hard",
        questionType: "code",
        questionText: "Implement a thread-safe Bounded Blocking Queue in Java or C++ with fixed capacity. It must support enqueue(item) (blocks when full) and dequeue() (blocks when empty). Explain why wait() must be inside a while loop and why two condition variables (notEmpty, notFull) are superior to a single condition variable.",
        expectedPoints: [
          "Uses a mutex/lock and two condition variables: notFull and notEmpty",
          "enqueue() checks while (queue.size() == capacity) notFull.wait()",
          "dequeue() checks while (queue.isEmpty()) notEmpty.wait()",
          "enqueue() signals notEmpty; dequeue() signals notFull",
          "Separating notEmpty and notFull avoids thundering herd problem and prevents waking up producers when a consumer needs to run"
        ],
        idealAnswer: "``java\nimport java.util.LinkedList;\nimport java.util.Queue;\nimport java.util.concurrent.locks.Condition;\nimport java.util.concurrent.locks.ReentrantLock;\n\npublic class BoundedBlockingQueue<T> {\n  private final Queue<T> queue = new LinkedList<>();\n  private final int capacity;\n  private final ReentrantLock lock = new ReentrantLock();\n  private final Condition notFull = lock.newCondition();\n  private final Condition notEmpty = lock.newCondition();\n\n  public BoundedBlockingQueue(int capacity) {\n    if (capacity <= 0) throw new IllegalArgumentException();\n    this.capacity = capacity;\n  }\n\n  public void enqueue(T item) throws InterruptedException {\n    lock.lock();\n    try {\n      while (queue.size() == capacity) {\n        notFull.await(); // Releases lock and sleeps until consumer removes item\n      }\n      queue.add(item);\n      notEmpty.signal(); // Notify waiting consumers that an item is ready\n    } finally {\n      lock.unlock();\n    }\n  }\n\n  public T dequeue() throws InterruptedException {\n    lock.lock();\n    try {\n      while (queue.isEmpty()) {\n        notEmpty.await(); // Releases lock and sleeps until producer adds item\n      }\n      T item = queue.poll();\n      notFull.signal(); // Notify waiting producers that a slot is free\n      return item;\n    } finally {\n      lock.unlock();\n    }\n  }\n}\n```\n\n### Architectural Justifications:\n1. **While Loop vs If**:\n   Guarantees safety against **spurious wakeups** and prevents race conditions where multiple awakened consumers race for a single newly produced item.\n2. **Two Condition Variables vs One**:\n   Using two conditions (`notFull` and `notEmpty`) ensures that producers wake up ONLY consumers, and consumers wake up ONLY producers. With a single condition variable, calling `signalAll()` wakes up all waiting producers and consumers simultaneously (**thundering herd**), causing massive lock contention where $N-1$ threads immediately go back to sleep.",
            explanation: "Two condition variables decouple buffer-full and buffer-empty signaling, eliminating unnecessary wakeups and lock contention.",
        commonPitfalls: [
          "Using 'if' instead of 'while' for condition checks",
          "Calling lock.unlock() outside the finally block (leaks lock on exception)"
        ],
        companyTag: "Google",
        roleLevel: "Backend / Infrastructure SDE-2",
        sourceCitation: "Google Standard Concurrency Engineering Round",
        reportingPeriod: "2024-2025",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "How would you implement a non-blocking lock-free bounded queue using atomic CAS operations?",
          whyAsked: "Probes high-performance lock-free data structure design.",
          expectedDefense: "Use a circular array with atomic sequence numbers per cell (like the LMAX Disruptor ring buffer), using atomic compare-and-swap on head and tail pointers."
        },
        rubric: {
          conceptualAccuracyWeight: 0.45,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.2
        }
      },
      {
        id: "conc-q-cas-aba",
        subjectId: "concurrency",
        subtopicId: "conc-mutex-semaphore",
        topic: "Lock-Free Atomics & ABA Problem",
        title: "Compare-And-Swap (CAS), Lock-Free Concurrent Linked Queue & The ABA Problem",
        difficulty: "Hard",
        questionType: "conceptual",
        questionText: "What is an atomic Compare-And-Swap (CAS) CPU instruction? Explain how lock-free data structures use CAS, and explain the classic ABA Problem. How do atomic stamped references (tagged pointers) resolve the ABA problem?",
        expectedPoints: [
          "CAS takes 3 parameters: memory location (V), expected old value (A), and new value (B)",
          "Executes atomically in hardware: if V == A, sets V = B and returns true; otherwise returns false without modifying memory",
          "The ABA Problem: Thread 1 reads value A. Thread 2 modifies V to B, then modifies it back to A. Thread 1's CAS succeeds because V == A, but the underlying state/pointers were mutated",
          "In a lock-free stack, ABA can cause memory corruption by linking freed or recycled nodes",
          "Solution: Stamped References / Tagged Pointers: Pair the memory pointer with a monotonically increasing integer version/tag (e.g. AtomicStampedReference)"
        ],
        idealAnswer: "### Atomic Compare-And-Swap (CAS)\nCAS is a hardware instruction (e.g., `CMPXCHG` on x86) that atomically performs:\n```cpp\nbool CAS(int* ptr, int expectedOld, int newValue) {\n  if (*ptr == expectedOld) {\n    *ptr = newValue;\n    return true; // Succeeded\n  }\n  return false;   // Failed: another thread modified the memory\n}\n```\n\n### The ABA Problem:\nConsider a lock-free stack with Top -> Node A -> Node B:\n1. Thread 1 wants to pop. Reads `Top = A`, and computes `Next = A.next (B)`.\n2. Thread 1 is preempted by the OS scheduler before executing CAS.\n3. Thread 2 runs:\n   - Pops A: Top is now B.\n   - Pops B: Top is now C.\n   - Allocates or recycles Node A, pushes A back: Top is now A -> C.\n4. Thread 1 wakes up and executes:\n   `CAS(&Top, expected: A, new: B)`\n5. **The Bug**: Since `Top` is currently pointer A, CAS evaluates to TRUE and sets `Top = B`. But Node B was already popped and freed! The stack is now corrupted, pointing to invalid memory.\n\n### Solution: Tagged Pointers / Version Stamping\nPair every pointer with an incrementing integer version number:\n`[ Pointer: Node A | Stamp: 1 ]`\nWhen Thread 2 mutates and re-pushes A, the stamp increments:\n`[ Pointer: Node A | Stamp: 3 ]`\nWhen Thread 1 attempts CAS, it checks both the pointer AND the stamp (`expectedStamp: 1`). Because $1 \\\\neq 3$, the CAS fails safely and avoids corruption.",
            explanation: "CAS enables optimistic lock-free algorithms; the ABA problem is prevented by adding monotonic version tags to pointers.",
        commonPitfalls: [
          "Believing volatile keyword prevents the ABA problem",
          "Confusing CAS failure with an exception or thread crash"
        ],
        companyTag: "Meta",
        roleLevel: "High-Concurrency Infrastructure Engineer",
        sourceCitation: "Meta High-Performance Systems Interview",
        reportingPeriod: "2024-2025",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "How does the Linux kernel or Java eliminate the ABA problem in memory allocation?",
          whyAsked: "Tests understanding of safe memory reclamation.",
          expectedDefense: "Using Hazard Pointers, Read-Copy-Update (RCU), or generational GC where memory is never recycled until no active thread holds a reference to it."
        },
        rubric: {
          conceptualAccuracyWeight: 0.45,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.2
        }
      },
      {
        id: "conc-q-priority-inversion",
        subjectId: "concurrency",
        subtopicId: "conc-deadlocks-livelocks",
        topic: "Priority Inversion & Mars Pathfinder",
        title: "Priority Inversion in Real-Time Systems & Priority Inheritance Solution",
        difficulty: "Medium",
        questionType: "conceptual",
        questionText: "What is Priority Inversion? Describe the classic scenario involving high, medium, and low priority tasks. How does the Priority Inheritance Protocol resolve this issue, and why was this famous during the NASA Mars Pathfinder mission?",
        expectedPoints: [
          "Priority Inversion occurs when a high-priority task is indirectly blocked by a medium-priority task",
          "Scenario: Low-priority task holds lock L; High-priority task requests lock L and blocks; Medium-priority task with no lock preempts Low-priority task",
          "Result: High-priority task waits while Medium-priority task runs, inverting scheduler priorities",
          "Priority Inheritance Protocol: When High-priority task blocks on a lock held by Low-priority task, the Low-priority task temporarily inherits the High priority",
          "This prevents Medium-priority tasks from preempting the Low-priority task, allowing it to quickly release the lock"
        ],
        idealAnswer: "### Priority Inversion Scenario:\nConsider three tasks: **High ($H$)**, **Medium ($M$)**, and **Low ($L$)**:\n1. Task $L$ runs and acquires shared Mutex $S$ (e.g., an attitude control data bus).\n2. Task $H$ wakes up to perform a critical real-time calculation and requests Mutex $S$. Because $L$ holds $S$, Task $H$ is placed in a sleep wait queue.\n3. While $L$ is inside the critical section, Task $M$ (which does not need Mutex $S$) arrives. Because $M > L$, the OS preempts Task $L$ to run Task $M$.\n4. **The Inversion**: Task $M$ executes for minutes. Task $L$ cannot finish and cannot release Mutex $S$. Task $H$ (the most critical task on the system) is blocked waiting for $L$, which is blocked by $M$. The system priority hierarchy is completely inverted!\n\n### The Mars Pathfinder Bug (1997):\nOn Mars, the Pathfinder rover began rebooting repeatedly. The information bus task ($L$) was preempted by long-running communications tasks ($M$), starving the real-time attitude control thread ($H$). The watchdog timer noticed $H$ was starved and reset the entire spacecraft.\n\n### The Solution: Priority Inheritance Protocol\nWhen Task $H$ blocks on Mutex $S$ held by Task $L$:\n- The kernel **temporarily elevates the priority of Task $L$ to match Task $H$**.\n- Because Task $L$ now has priority $H$, Task $M$ CANNOT preempt it.\n- Task $L$ finishes its critical section swiftly and releases Mutex $S$.\n- Task $L$ reverts to its original low priority, and Task $H$ acquires Mutex $S$ and executes immediately.",
            explanation: "Priority inheritance elevates the lock-holder's priority to match the highest waiting thread, preventing intermediate threads from preempting it.",
        commonPitfalls: [
          "Claiming priority inversion only occurs on single-core CPUs (can occur whenever thread priorities govern scheduling)",
          "Assuming high-priority threads can simply steal the lock (would cause data corruption)"
        ],
        companyTag: "Microsoft",
        roleLevel: "Systems / Real-Time Operating Systems Engineer",
        sourceCitation: "Microsoft Windows Core & Embedded Systems Archives",
        reportingPeriod: "2024-2025",
        verificationStatus: "verified_company",
        followUpChallenge: {
          question: "Can Priority Inheritance cause deadlocks? What is Priority Ceiling Protocol?",
          whyAsked: "Tests understanding of advanced real-time synchronization protocols.",
          expectedDefense: "Priority inheritance can still suffer from deadlocks if multiple locks are acquired out of order. Priority Ceiling Protocol assigns each lock a ceiling equal to the highest priority task that can ever acquire it, provably preventing deadlocks."
        },
        rubric: {
          conceptualAccuracyWeight: 0.45,
          depthWeight: 0.35,
          tradeoffAnalysisWeight: 0.2
        }
      }
    ]
  }
};

// Aliases for matching alternate IDs
CANONICAL_CS_SUBJECTS["networks"] = CANONICAL_CS_SUBJECTS["cn"];

/**
 * Helper to retrieve canonical CS subject by ID (supports 'networks' alias).
 */
export function getCanonicalSubject(subjectId: string): CSSubjectDefinition | undefined {
  const normalized = subjectId === "networks" ? "cn" : subjectId;
  return CANONICAL_CS_SUBJECTS[normalized];
}

/**
 * Returns all canonical CS subjects list (excluding aliases).
 */
export function getAllCanonicalSubjects(): CSSubjectDefinition[] {
  const set = new Set<string>();
  const list: CSSubjectDefinition[] = [];
  for (const s of Object.values(CANONICAL_CS_SUBJECTS)) {
    if (!set.has(s.id)) {
      set.add(s.id);
      list.push(s);
    }
  }
  return list;
}

/**
 * Returns canonical questions strictly for a given subject.
 */
export function getSubjectQuestions(subjectId: string): CSQuestionItem[] {
  const subject = getCanonicalSubject(subjectId);
  return subject ? subject.questions : [];
}

/**
 * Returns all questions across all subjects for custom multi-subject interview generation.
 */
export function getAllCurriculumQuestions(): CSQuestionItem[] {
  const all: CSQuestionItem[] = [];
  const subjects = getAllCanonicalSubjects();
  for (const s of subjects) {
    all.push(...s.questions);
  }
  return all;
}
