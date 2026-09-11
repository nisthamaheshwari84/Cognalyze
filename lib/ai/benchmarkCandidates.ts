export interface BenchmarkCandidate {
  id: string;
  name: string;
  resume: string;
}

/**
 * Generates 100 diverse, highly realistic tech resumes calibrated for FAANG hiring committee benchmarking.
 * Tiers:
 * - Top 10%: Exceptional / Strong Hire (Staff AI Engineers, Ex-FAANG, High-impact Distributed Systems & Open Source)
 * - Next 25%: Hire (Solid Full-Stack / Backend / ML Engineers with verified metrics & scale)
 * - Next 30%: Lean Hire (Competent engineers with strong fundamentals but minor seniority or domain gaps)
 * - Next 20%: Lean Reject (Junior / bootcamp grads lacking production scale or missing key must-haves)
 * - Bottom 15%: Strong Reject (Irrelevant backgrounds, consulting agency spam, or unverified claims)
 */
export function get100BenchmarkCandidates(): BenchmarkCandidate[] {
  const candidates: BenchmarkCandidate[] = [
    // --- TOP TIER: EXCEPTIONAL & STRONG HIRE (Ranks 1 - 10) ---
    {
      id: "cand-001",
      name: "Aarav Sharma",
      resume: `Aarav Sharma | aarav.sharma@alumni.iitd.ac.in | github.com/aarav-sharma | Bengaluru, India
Senior Distributed Systems & AI Infrastructure Engineer (6+ YoE)
Ex-Staff Engineer at Uber Technologies, ex-SDE 2 at AWS DynamoDB.
EXPERIENCE:
- Staff Systems Engineer @ Uber (2023 - Present): Architected real-time geospatial dispatch engine handling 1.8M QPS at p99 latency of 4.2ms using Go, Rust, and Apache Flink. Reduced cloud infrastructure spend by $1.4M annually.
- Senior SDE @ AWS DynamoDB (2020 - 2023): Led core consensus & replication team for distributed storage nodes. Implemented zero-copy Raft protocol enhancements in C++20, boosting write throughput by 34%.
- SDE Intern @ Google Search Infrastructure (Summer 2019): Optimized distributed inverted index lookup caching in C++.
TECHNICAL SKILLS:
- Languages: Rust, Go, C++20, Python, TypeScript, SQL
- Distributed Systems: Raft, Paxos, Kafka, Apache Flink, Cassandra, Kubernetes, RocksDB, Redis
- Cloud & Infra: AWS (EKS, DynamoDB, S3), Docker, Terraform, Prometheus, eBPF
PROJECTS:
- Open-Source Author: "Turboraft" (GitHub 4.8k stars) — Ultra-high-throughput embedded consensus engine in Rust.
EDUCATION:
- B.Tech in Computer Science, IIT Delhi (CGPA: 9.6/10, Institute Silver Medalist).`
    },
    {
      id: "cand-002",
      name: "Dr. Priyansh Narang",
      resume: `Dr. Priyansh Narang | p.narang@stanford.alumni.edu | priyansh-ml.io | San Francisco / Remote
Staff AI/ML Research Engineer (7+ YoE)
Lead Author on NeurIPS 2024 & ICML 2023 papers on Speculative Decoding and Agentic Tool-Use.
EXPERIENCE:
- Principal Research Scientist @ Anthropic / AI Lab (2023 - Present): Led agentic reasoning infrastructure. Optimized speculative token decoding for 70B LLMs, accelerating inference throughput by 2.8x across GPU clusters (Triton, vLLM).
- Senior ML Engineer @ Meta AI (FAIR) (2021 - 2023): Trained multimodal vision-language models with 128-node PyTorch FSDP. Published 4 first-author peer-reviewed papers.
TECHNICAL SKILLS:
- Languages: Python, C++, CUDA, Triton, Rust
- AI & ML: PyTorch, vLLM, DeepSpeed, TensorRT-LLM, HuggingFace, LangChain, FAISS, LoRA/PEFT
- Systems: Distributed GPU Training, Multi-Node InfiniBand, Kubernetes
EDUCATION:
- Ph.D. in Computer Science (Machine Learning), Stanford University.
- B.Tech in CSE, IIT Bombay (Institute Gold Medalist).`
    },
    {
      id: "cand-003",
      name: "Sneha Mukherjee",
      resume: `Sneha Mukherjee | sneha.mukh@gmail.com | github.com/sneham-dev | Hyderabad, India
Staff Full-Stack & Systems Architect (8 YoE)
Ex-Principal Engineer @ Razorpay, ex-Senior Engineer @ Stripe.
EXPERIENCE:
- Principal Engineer @ Razorpay (2022 - Present): Designed high-availability core payment orchestration switch processing ₹4,500 Cr monthly GMV. Maintained 99.999% availability during festive flash sales.
- Senior Software Engineer @ Stripe (2019 - 2022): Built automated fraud prevention graph neural network pipeline reducing fraudulent chargebacks by $3.2M annually.
TECHNICAL SKILLS:
- Backend: Java, Go, Python, Node.js, Spring Boot, FastAPI
- Frontend: React, Next.js, TypeScript, TailwindCSS
- Databases & Queues: PostgreSQL, CockroachDB, Kafka, Redis, Elasticsearch
- DevOps: AWS, Terraform, Docker, Kubernetes, Datadog
EDUCATION:
- B.Tech in Computer Science, BITS Pilani (CGPA: 9.4/10).`
    },
    {
      id: "cand-004",
      name: "Rohan Varma",
      resume: `Rohan Varma | rohan.varma@dev.io | github.com/rohan-varma | Bengaluru, India
Senior Backend & Cloud Native Engineer (5 YoE)
Ex-SDE 2 @ Microsoft Azure Core, ex-Software Engineer @ Swiggy.
EXPERIENCE:
- SDE 2 @ Microsoft (2022 - Present): Engineered Azure Container Registry control plane components in Go & Kubernetes. Decreased cold-start container pull times by 48% across 12 enterprise regions.
- Software Engineer @ Swiggy (2020 - 2022): Built real-time order delivery assignment algorithms in Java and Redis. Scaled system to handle 12,000 orders/minute.
TECHNICAL SKILLS:
- Go, Java, Python, C++, Docker, Kubernetes, gRPC, Kafka, Redis, AWS, Azure, PostgreSQL
EDUCATION:
- B.Tech Computer Science, NIT Trichy (CGPA: 9.2/10).`
    },
    {
      id: "cand-005",
      name: "Ananya Iyer",
      resume: `Ananya Iyer | a.iyer@berkeley.edu | github.com/ananya-ai | Bengaluru / Remote
Lead Generative AI & LLM Systems Engineer (4 YoE)
Ex-AI Engineer @ Cohere, ex-Applied Scientist Intern @ Amazon AWS.
EXPERIENCE:
- Lead GenAI Engineer @ Enterprise AI Startup (2023 - Present): Built enterprise RAG pipeline serving 500k queries/day with sub-300ms latency. Implemented hybrid vector search using Qdrant and Cohere reranker.
- ML Engineer @ Cohere (2022 - 2023): Fine-tuned command models on domain-specific datasets using RLHF and DPO.
TECHNICAL SKILLS:
- Python, TypeScript, PyTorch, LangChain, LlamaIndex, Qdrant, Pinecone, vLLM, FastAPI, Next.js
EDUCATION:
- M.S. in Electrical Engineering & Computer Sciences, UC Berkeley.
- B.Tech in CSE, IIT Madras (CGPA: 9.1/10).`
    },
    {
      id: "cand-006",
      name: "Karan Johar Patel",
      resume: `Karan Johar Patel | karan.patel@tech.in | github.com/karanjp | Mumbai, India
Senior High-Frequency Trading Systems Developer (5 YoE)
Ex-Quant Systems Developer @ Tower Research Capital, ex-SDE @ Goldman Sachs.
EXPERIENCE:
- Quant Developer @ Tower Research (2022 - Present): Designed low-latency market data processing engines in modern C++20 and Linux kernel bypass (Solarflare OpenOnload). Achieved sub-microsecond tick-to-trade processing.
- SDE @ Goldman Sachs (2020 - 2022): Built institutional risk computation engines in Java and Apache Spark.
TECHNICAL SKILLS:
- Modern C++ (C++17/C++20), Low Latency, Lock-Free Concurrency, Linux Kernel, Python, x86 Assembly, Network Programming
EDUCATION:
- B.Tech in Computer Science, IIT Kharagpur (CGPA: 9.3/10).`
    },
    {
      id: "cand-007",
      name: "Meera Krishnan",
      resume: `Meera Krishnan | meera.k@cs.stanford.edu | github.com/meerak-dev | Bengaluru, India
Senior Frontend & Web Platform Architect (6 YoE)
Ex-Senior UI Engineer @ Vercel, ex-Frontend Engineer @ Flipkart.
EXPERIENCE:
- Senior Engineer @ Vercel (2022 - Present): Core contributor to Next.js App Router and Turbopack compiler. Improved hydration performance by 35% on high-traffic e-commerce pages.
- Frontend Engineer @ Flipkart (2019 - 2022): Spearheaded web checkout re-architecture in React & TypeScript, boosting mobile checkout conversion by 14%.
TECHNICAL SKILLS:
- TypeScript, JavaScript, React, Next.js, WebAssembly, Rust, Node.js, TailwindCSS, Web Performance Optimization, GraphQL
EDUCATION:
- B.Tech in Information Technology, NIT Surathkal (CGPA: 9.0/10).`
    },
    {
      id: "cand-008",
      name: "Vikramaditya Sengupta",
      resume: `Vikramaditya Sengupta | vikram.sengupta@iitkgp.ac.in | github.com/vikram-sec | Delhi NCR, India
Staff Cloud Security & DevSecOps Engineer (7 YoE)
Ex-Security Architect @ Palo Alto Networks, ex-Cloud Engineer @ Zscaler.
EXPERIENCE:
- Cloud Security Architect @ Palo Alto Networks (2021 - Present): Architected automated cloud compliance and runtime anomaly detection engine monitoring 10,000+ AWS accounts.
- Systems Engineer @ Zscaler (2018 - 2021): Implemented high-throughput SSL/TLS inspection proxies in C and Go.
TECHNICAL SKILLS:
- Go, Python, C, Kubernetes, AWS Security, Terraform, Zero-Trust Architecture, eBPF, Vault, Splunk
EDUCATION:
- M.Tech in Information Security, IIT Kharagpur.
- B.E. in Computer Science, Jadavpur University.`
    },
    {
      id: "cand-009",
      name: "Divya Nambiar",
      resume: `Divya Nambiar | divya.nambiar@alumni.cmu.edu | github.com/divyan-ai | Bengaluru, India
Senior Computer Vision & Edge AI Engineer (5 YoE)
Ex-Autonomous Vehicle Perception Engineer @ Cruise, ex-ML Engineer @ Intel Labs.
EXPERIENCE:
- Perception Engineer @ Cruise Automation (2022 - Present): Deployed real-time 3D LiDAR object tracking models operating at 60 FPS on onboard edge compute.
- Research Engineer @ Intel Labs (2020 - 2022): Optimized TensorRT inference pipelines for deep neural networks on edge platforms.
TECHNICAL SKILLS:
- Python, C++, CUDA, PyTorch, TensorRT, OpenCV, ROS2, Linux, Docker, ONNX
EDUCATION:
- M.S. in Computer Vision, Carnegie Mellon University (CMU).
- B.Tech in ECE, NIT Calicut (CGPA: 9.2/10).`
    },
    {
      id: "cand-010",
      name: "Aditya Roy Chowdhury",
      resume: `Aditya Roy Chowdhury | aditya.rc@dev.net | github.com/aditya-rc | Kolkata, India
Senior Backend & Database Internals Engineer (6 YoE)
Ex-Systems Engineer @ Cockroach Labs, ex-Software Engineer @ Salesforce.
EXPERIENCE:
- Database Engineer @ Cockroach Labs (2022 - Present): Implemented distributed SQL query optimizer features and vectorized execution engine enhancements in Go.
- Software Engineer @ Salesforce (2019 - 2022): Managed multi-tenant database clusters serving 80M daily enterprise transactions.
TECHNICAL SKILLS:
- Go, C++, Java, Distributed Storage, Raft, SQL Query Optimization, PostgreSQL internals, Kubernetes, Linux
EDUCATION:
- B.Tech in CSE, IIIT Hyderabad (CGPA: 9.1/10).`
    }
  ];

  // --- MID TIER: SOLID HIRES (Ranks 11 - 35) ---
  const midTierRoles = [
    { title: "Full-Stack SDE", stack: "React, Next.js, Node.js, PostgreSQL, AWS", comp: "Zepto / Blinkit" },
    { title: "Backend SDE 2", stack: "Java, Spring Boot, Kafka, Redis, Microservices", comp: "Paytm Payments" },
    { title: "ML/NLP Engineer", stack: "Python, PyTorch, HuggingFace, FastAPI, Docker", comp: "Fractal Analytics" },
    { title: "DevOps / SRE Engineer", stack: "Kubernetes, Docker, Terraform, Prometheus, CI/CD", comp: "Juspay" },
    { title: "Cloud Infrastructure SDE", stack: "Go, AWS, Terraform, gRPC, DynamoDB", comp: "InMobi" }
  ];

  const midFirstNames = [
    "Arjun", "Neha", "Rahul", "Pooja", "Siddharth", "Kavita", "Abhishek", "Rhea",
    "Manish", "Tanvi", "Saurabh", "Deepika", "Naveen", "Swati", "Gaurav", "Simran",
    "Harsh", "Prerna", "Akash", "Shreya", "Rishabh", "Aishwarya", "Varun", "Meghna", "Kunal"
  ];
  const midLastNames = [
    "Gupta", "Bansal", "Saxena", "Chawla", "Deshmukh", "Reddy", "Kulkarni", "Malhotra",
    "Verma", "Aggarwal", "Kapoor", "Bhatia", "Jain", "Mehta", "Soni", "Chaudhary",
    "Nair", "Rao", "Mishra", "Pandey", "Sen", "Roy", "Das", "Ghosh", "Singh"
  ];

  midFirstNames.forEach((fname, i) => {
    const lname = midLastNames[i % midLastNames.length];
    const role = midTierRoles[i % midTierRoles.length];
    const yoe = 3 + (i % 4);
    const id = `cand-${String(11 + i).padStart(3, "0")}`;
    candidates.push({
      id,
      name: `${fname} ${lname}`,
      resume: `${fname} ${lname} | ${fname.toLowerCase()}.${lname.toLowerCase()}@outlook.com | github.com/${fname.toLowerCase()}-${lname.toLowerCase()}
Senior ${role.title} (${yoe} YoE)
Current SDE 2 at ${role.comp}.
EXPERIENCE:
- SDE 2 @ ${role.comp} (2022 - Present): Designed scalable production features in ${role.stack}. Handled 50,000+ daily active users, maintained 99.9% uptime, and cut API latency by 28%.
- SDE 1 @ Tech Startup (2020 - 2022): Built RESTful microservices and integrated payment gateways and telemetry.
SKILLS:
- ${role.stack}, Git, CI/CD, Agile, Unit Testing, System Design.
PROJECTS:
- Scalable Enterprise Portal: Full-stack production application with JWT auth, Redis cache, and automated deployment pipelines.
EDUCATION:
- B.Tech in Computer Science, Tier-1/Tier-2 Technical University (CGPA: 8.4 - 8.9/10).`
    });
  });

  // --- LEAN HIRE TIER (Ranks 36 - 65) ---
  const leanFirstNames = [
    "Pranav", "Ishita", "Ankit", "Ritu", "Deepak", "Shalini", "Kartik", "Jyoti",
    "Tarun", "Ananya", "Nikhil", "Shruti", "Vivek", "Pallavi", "Alok", "Nikita",
    "Mohit", "Smriti", "Rohit", "Richa", "Sumit", "Divya", "Pawan", "Garima",
    "Ayush", "Monika", "Sachin", "Preeti", "Udit", "Radhika"
  ];

  leanFirstNames.forEach((fname, i) => {
    const lname = midLastNames[(i + 5) % midLastNames.length];
    const id = `cand-${String(36 + i).padStart(3, "0")}`;
    candidates.push({
      id,
      name: `${fname} ${lname}`,
      resume: `${fname} ${lname} | ${fname.toLowerCase()}.${lname.toLowerCase()}@gmail.com | Pune / Noida, India
Software Engineer (2-3 YoE)
Software Engineer at Mid-Market Product Firm.
EXPERIENCE:
- Software Engineer @ Enterprise Tech (2023 - Present): Implemented core CRUD endpoints, database queries, and frontend UI in React, Node.js, and MongoDB. Contributed to sprint deliverables with zero regression defects.
- Junior Developer (2022 - 2023): Handled client bug fixes, unit tests, and internal developer dashboards.
SKILLS:
- JavaScript, React, Node.js, Express, MongoDB, MySQL, Git, Postman.
PROJECTS:
- Inventory Management System: Built React & Express app for warehouse tracking.
EDUCATION:
- B.Tech in Information Technology, State Engineering College (CGPA: 7.8/10).`
    });
  });

  // --- LEAN REJECT TIER (Ranks 66 - 85) ---
  const leanRejectNames = [
    "Hemant", "Rashmi", "Chetan", "Bhavna", "Sunil", "Madhuri", "Manoj", "Kiran",
    "Lalit", "Sangeeta", "Dinesh", "Komal", "Ramesh", "Geeta", "Vinay", "Sarita",
    "Bhavesh", "Aarti", "Ashok", "Kavita"
  ];

  leanRejectNames.forEach((fname, i) => {
    const lname = midLastNames[(i + 10) % midLastNames.length];
    const id = `cand-${String(66 + i).padStart(3, "0")}`;
    candidates.push({
      id,
      name: `${fname} ${lname}`,
      resume: `${fname} ${lname} | ${fname.toLowerCase()}.${lname.toLowerCase()}@yahoo.com
Junior Associate / Fresher (1 YoE)
EXPERIENCE:
- Associate Software Developer (2024 - Present): Worked on maintenance of legacy PHP/Java code. Updated UI labels and generated internal Excel reports.
SKILLS:
- HTML, CSS, JavaScript, Basic Java, MySQL.
PROJECTS:
- College Library Management System: Academic project built using HTML, CSS, and PHP.
EDUCATION:
- B.E. in Electronics & Communication, Affiliated College (CGPA: 7.1/10).
CONCERNS:
- Lacks production distributed systems experience. No cloud, Docker, or modern framework proficiency.`
    });
  });

  // --- STRONG REJECT TIER (Ranks 86 - 100) ---
  const rejectNames = [
    "Rajesh", "Pooja", "Suresh", "Anita", "Mahesh", "Suman", "Naresh", "Sunita",
    "Kamlesh", "Rekha", "Mukesh", "Shobha", "Gopal", "Lata", "Brijesh"
  ];

  rejectNames.forEach((fname, i) => {
    const lname = midLastNames[(i + 15) % midLastNames.length];
    const id = `cand-${String(86 + i).padStart(3, "0")}`;
    candidates.push({
      id,
      name: `${fname} ${lname}`,
      resume: `${fname} ${lname} | ${fname.toLowerCase()}@services-corp.com
IT Helpdesk & Manual QA Support Analyst (2 YoE)
EXPERIENCE:
- Systems Support Associate @ Legacy Outsourcing Firm (2023 - Present): Logged ticket statuses in JIRA, verified desktop network configurations, and entered data into CRM spreadsheets.
SKILLS:
- MS Office, Windows 10, Manual Testing, Basic SQL queries, JIRA.
EDUCATION:
- B.Com / Non-technical degree (2022).
RED FLAGS:
- Zero engineering or coding background. No programming languages or modern tech stack.`
    });
  });

  return candidates;
}

/**
 * Standard Job Description for Software Engineer Intern (Backend & Generalist)
 */
export function getSdeInternJobDescription(): string {
  return `Role: Software Engineer Intern (Backend & Generalist)
Location: Bengaluru / Remote
Duration: 6 Months

About the Role:
We are looking for a proactive Software Engineer Intern with solid computer science fundamentals, strong problem-solving skills, and hands-on backend development experience. You will work closely with senior engineers to design, build, and deploy production APIs and backend services.

Must-Have Requirements:
- Strong proficiency in at least one core language: Python, Java, or C++.
- Solid understanding of Data Structures & Algorithms (DSA) and Object-Oriented Programming (OOP) principles.
- Hands-on experience building and consuming RESTful APIs.
- Working knowledge of relational databases and SQL (PostgreSQL, MySQL).
- Familiarity with version control using Git and GitHub (branching, PRs, code reviews).
- Demonstrated passion through personal projects, open-source contributions, or competitive programming.

Good-to-Have (Bonus):
- Familiarity with Docker, containerization, or basic cloud services (AWS/GCP).
- Exposure to caching (Redis) or message queues.
- Basic frontend familiarity (React, TypeScript, or HTML/CSS).
- Prior internship experience in a tech environment.`;
}

/**
 * Generates the authentic 30-candidate SDE Intern benchmark dataset.
 * Specifically calibrated to test:
 * - Top Tier (Aarav Sharma, Rohan Verma, Arjun Jain, Kabir Kapoor, Vivaan Mehta)
 * - Solid Tier (Aditya Singh, Ishaan Malhotra, Vihaan Agarwal, Reyansh Bansal, Kunal Patel, Ananya Reddy, Aditi Saxena, Meera Chopra)
 * - Middle Tier (Candidates 14-22)
 * - Role Mismatches (Rahul Iyer - ML heavy, Neel Malhotra - UI/UX heavy)
 * - Keyword Stuffer Test (Mihir Bansal - all buzzwords, zero evidence)
 * - Weak / Non-technical Rejects (Candidates 27-30)
 */
export function get30SdeInternBenchmarkCandidates(): BenchmarkCandidate[] {
  return [
    // ─── TOP TIER: RANKS 1 - 5 (Strong Must-Have Alignment, Real Production/Internship Evidence) ───
    {
      id: "sde-001",
      name: "Aarav Sharma",
      resume: `Aarav Sharma | aarav.sharma@alumni.iitd.ac.in | github.com/aarav-sharma | Bengaluru, India
Pre-final Year B.Tech Computer Science | Software Engineer Intern Candidate
Summary: Passionate backend engineer with hands-on startup internship experience, strong DSA foundations, and proven API design expertise.
EXPERIENCE:
- Backend Engineering Intern @ FinFlow Technologies (Jan 2024 - Jun 2024):
  * Designed and shipped 14 RESTful API endpoints in Python (FastAPI) handling transaction reconciliation for 45,000+ daily events.
  * Optimized PostgreSQL query execution plans and implemented compound indexing, reducing p95 database response latency by 38%.
  * Collaborated in an agile team using Git/GitHub for feature branching, trunk-based development, and peer code reviews.
TECHNICAL SKILLS:
- Languages: Python, C++, Java, SQL
- Core Fundamentals: Data Structures & Algorithms, Object-Oriented Programming (OOP), Database Management (DBMS), Operating Systems
- Backend & Storage: FastAPI, Flask, PostgreSQL, MySQL, Redis (caching), REST APIs
- Tools & Practices: Git, GitHub Actions, Docker, Linux, Postman, Unit Testing (pytest)
PROJECTS:
- Distributed Task Queue Service (Go & Redis): Built an asynchronous job processing system with retry backoff and dead-letter queues. Covered with 88% unit test coverage.
- Campus Placement Portal Backend (Python, PostgreSQL, JWT): Engineered secure role-based access control (RBAC), multi-criteria filtering, and automated email dispatches for 1,200+ students.
ACHIEVEMENTS & DSA:
- Solved 480+ problems on LeetCode (Knight rating 1940); Codeforces Specialist (max rating 1490).
- Finalist in Smart India Hackathon 2023 (Developed real-time logistics tracker).
EDUCATION:
- B.Tech in Computer Science & Engineering (CGPA: 8.9/10, Expected Grad: 2025).`
    },
    {
      id: "sde-002",
      name: "Rohan Verma",
      resume: `Rohan Verma | rohan.verma@nitk.edu.in | github.com/rohan-v | Bengaluru, India
B.Tech CSE 2025 | Backend SDE Intern
EXPERIENCE:
- Software Development Intern @ CloudScale Systems (Summer 2024):
  * Built microservices using Java (Spring Boot) and PostgreSQL for user identity and subscription management.
  * Containerized services using Docker and configured GitHub Actions CI pipeline running automated JUnit tests on every pull request.
  * Integrated Redis caching for frequent user permission lookups, decreasing API response time from 120ms to 24ms.
TECHNICAL SKILLS:
- Core Languages: Java, Python, SQL, C++
- Frameworks: Spring Boot, Hibernate/JPA, Express.js
- Databases: PostgreSQL, MySQL, Redis
- Fundamentals: DSA, OOP, System Design Basics, REST Architecture
- Tools: Git, GitHub, Docker, Postman, Maven
PROJECTS:
- E-Commerce Inventory & Order API (Spring Boot & MySQL): Implemented ACID compliant order checkout with optimistic locking preventing overselling under concurrent requests.
- Peer-to-Peer File Transfer CLI (Java, Sockets): Multi-threaded client-server architecture with chunked verification using SHA-256.
DSA & PROBLEM SOLVING:
- 380+ DSA problems solved across LeetCode & GeeksforGeeks (Focus on Trees, Graphs, DP).
EDUCATION:
- B.Tech in Computer Science, NIT Karnataka (CGPA: 8.7/10).`
    },
    {
      id: "sde-003",
      name: "Arjun Jain",
      resume: `Arjun Jain | arjun.jain@dev.in | github.com/arjunjain-code | Delhi, India
Software Engineer Intern Candidate | Systems & Backend Focus
EXPERIENCE:
- Backend Intern @ DevForge Technologies (May 2024 - Jul 2024):
  * Developed high-performance REST APIs in C++ (Crow framework) and Go for processing time-series telemetry data.
  * Wrote complex SQL queries, migrations, and schema optimizations in PostgreSQL handling 500k+ sensor records daily.
  * Standardized Git commit conventions and maintained 100% CI pass rate across 40+ pull requests.
SKILLS:
- C++, Python, Go, SQL, Git/GitHub, REST APIs, OOP, DSA, Linux, Docker, PostgreSQL, MySQL
PROJECTS:
- Mini Key-Value Store (C++17): Implemented in-memory LSM-tree storage engine with write-ahead logging (WAL) and SSTable compactions.
- Collaborative Code Execution API (Python, Docker, FastAPI): Safely executes untrusted user Python/C++ code inside ephemeral isolated Docker containers.
COMPETITIVE PROGRAMMING:
- Codeforces Candidate Master (Rating: 1915); 420+ LeetCode problems solved.
EDUCATION:
- B.Tech CSE (CGPA: 9.1/10).`
    },
    {
      id: "sde-004",
      name: "Kabir Kapoor",
      resume: `Kabir Kapoor | kabir.kapoor@gmail.com | github.com/kabirkapoor | Hyderabad, India
Backend Developer & SDE Intern
EXPERIENCE:
- SDE Intern @ ByteWave Labs (Jan 2024 - Present):
  * Developed customer notification microservice using Python (FastAPI) and PostgreSQL, handling asynchronous email/SMS notifications via Celery & Redis.
  * Refactored legacy monolithic SQL endpoints to clean repository patterns, improving code maintainability and test coverage from 42% to 84%.
  * Active Git practitioner: Authored comprehensive PR descriptions, conducted code reviews, and managed release tags.
SKILLS:
- Python, Java, SQL, REST APIs, OOP, DSA, PostgreSQL, Celery, Redis, Docker, Git, Linux
PROJECTS:
- Real-Time Chat & Notification Service: Built using WebSockets, FastAPI, and Redis Pub/Sub with persistent message storage in PostgreSQL.
- RESTful Book Review & Analytics Engine: Complete CRUD application with JWT authentication, rate limiting, and automated Swagger documentation.
DSA:
- 350+ problems solved on LeetCode; active participant in weekly algorithmic contests.
EDUCATION:
- B.Tech Computer Science (CGPA: 8.6/10).`
    },
    {
      id: "sde-005",
      name: "Vivaan Mehta",
      resume: `Vivaan Mehta | vivaan.mehta@outlook.com | github.com/vivaanm | Pune, India
Software Engineer Intern | Backend & Cloud Fundamentals
EXPERIENCE:
- Software Intern @ AppMatrix Solutions (Summer 2024):
  * Designed backend REST APIs in Node.js (TypeScript) and Python for mobile app synchronization.
  * Built database models and relational queries in PostgreSQL with Prisma ORM.
  * Wrote unit and integration tests using Jest, achieving 90% code coverage.
SKILLS:
- Python, TypeScript, Node.js, Java, SQL, PostgreSQL, Git, GitHub, REST APIs, OOP, Docker, Postman
PROJECTS:
- Distributed URL Shortener: Engineered base62 encoding URL shortener in Python/Flask with Redis caching, PostgreSQL persistence, and analytics dashboard.
- Expense Sharing API (Splitwise clone): Implemented debt simplification graph algorithm in Java with comprehensive OOP design patterns.
DSA:
- 310+ LeetCode problems solved; strong understanding of graphs, dynamic programming, and binary search.
EDUCATION:
- B.Tech CSE (CGPA: 8.5/10).`
    },

    // ─── SOLID TIER: RANKS 6 - 13 (Solid Must-Have Skills, Good Projects, Steady DSA) ───
    {
      id: "sde-006",
      name: "Aditya Singh",
      resume: `Aditya Singh | aditya.singh@gmail.com | github.com/aditya-s | Noida, India
Computer Science Undergraduate | Aspiring Software Engineer
TECHNICAL SKILLS:
- Languages: Python, Java, C++, SQL
- Backend & Databases: Django, FastAPI, PostgreSQL, MySQL, REST APIs
- Core Concepts: OOP, Data Structures & Algorithms, Git, GitHub, Linux
PROJECTS:
- Hotel Booking & Reservation System (Django & PostgreSQL): Full-featured backend with payment gateway mock, booking conflict resolution, and transactional SQL queries.
- CLI Database Management Tool (Python): Lightweight relational engine implementing B-Tree indexing and basic SELECT/INSERT parsing.
DSA:
- Solved 280+ problems on LeetCode; strong command over arrays, strings, recursion, and linked lists.
EDUCATION:
- B.Tech in CSE (CGPA: 8.4/10).`
    },
    {
      id: "sde-007",
      name: "Ishaan Malhotra",
      resume: `Ishaan Malhotra | ishaan.m@gmail.com | github.com/ishaan-m | Mumbai, India
Backend Software Engineering Intern Candidate
EXPERIENCE & PROJECTS:
- Smart Attendance System: Built REST API backend in Java (Spring Boot) with MySQL database and QR-code authentication.
- E-Commerce Catalog Service: Developed RESTful endpoints in Python (Flask) with filtering, pagination, and SQL query optimization.
SKILLS:
- Java, Python, SQL, Spring Boot, MySQL, REST APIs, OOP, Git, GitHub, Postman
DSA & CODING:
- 260+ LeetCode problems solved. Regular participant in college coding contests.
EDUCATION:
- B.Tech in Information Technology (CGPA: 8.3/10).`
    },
    {
      id: "sde-008",
      name: "Vihaan Agarwal",
      resume: `Vihaan Agarwal | vihaan.agarwal@dev.in | github.com/vihaan-a | Jaipur, India
SDE Intern | Python & Relational Databases
SKILLS: Python, C++, SQL, PostgreSQL, REST APIs, Git, GitHub, OOP, DSA, Docker Basics
PROJECTS:
- College Student Portal API (FastAPI, PostgreSQL): Built authentication with bcrypt + JWT, student profile CRUD, and grade reporting endpoints.
- Algorithmic Trading Backtester (Python): Implemented moving average crossover strategies with Pandas and SQL trade logging.
DSA:
- 250+ LeetCode problems; good grasp of sorting, binary search, two pointers, and stacks.
EDUCATION:
- B.Tech in CSE (CGPA: 8.2/10).`
    },
    {
      id: "sde-009",
      name: "Reyansh Bansal",
      resume: `Reyansh Bansal | reyansh.b@gmail.com | github.com/reyanshb | Chandigarh, India
Software Engineering Intern | C++ & Algorithms
SKILLS: C++, Python, SQL, MySQL, Git, GitHub, OOP, Data Structures, Algorithms, Linux
PROJECTS:
- Custom Memory Allocator (C++): Implemented free-list memory manager with best-fit allocation strategy and memory leak detection.
- RESTful Weather Monitoring CLI: Fetches weather data via external REST APIs, caches in SQLite, and displays terminal graphs.
DSA:
- 300+ LeetCode problems solved; Codeforces Pupil (1380 rating).
EDUCATION:
- B.Tech Computer Science (CGPA: 8.5/10).`
    },
    {
      id: "sde-010",
      name: "Kunal Patel",
      resume: `Kunal Patel | kunal.patel@gmail.com | github.com/kunal-p | Ahmedabad, India
Junior Backend Developer | SDE Intern Candidate
SKILLS: Java, Python, SQL, Spring Boot, PostgreSQL, REST APIs, Git, OOP, Postman
PROJECTS:
- Hospital Patient Records Management (Java, Spring Boot, PostgreSQL): Created secure endpoints with role authorization for doctors and receptionists.
- Git Commit Analyzer Tool: Python script interacting with GitHub REST API to generate contributor analytics.
DSA:
- 220+ LeetCode problems solved.
EDUCATION:
- B.Tech CSE (CGPA: 8.1/10).`
    },
    {
      id: "sde-011",
      name: "Ananya Reddy",
      resume: `Ananya Reddy | ananya.reddy@gmail.com | github.com/ananya-r | Hyderabad, India
Computer Science Student | SDE Intern Candidate
SKILLS: Python, Java, SQL, MySQL, REST APIs, Git, GitHub, OOP, Basic Docker
PROJECTS:
- Automated Feedback Processing API (Python/Flask, MySQL): Collects customer ratings, stores relational data, and generates monthly summary reports.
- Personal Finance Tracker (Python, SQLite): CLI application with budget management and category breakdown.
DSA:
- 210+ LeetCode problems solved (focus on arrays, strings, hash tables).
EDUCATION:
- B.Tech in Computer Science (CGPA: 8.4/10).`
    },
    {
      id: "sde-012",
      name: "Aditi Saxena",
      resume: `Aditi Saxena | aditi.saxena@gmail.com | github.com/aditi-s | Lucknow, India
Aspiring Software Development Engineer
SKILLS: Java, C++, SQL, MySQL, Git, GitHub, Object-Oriented Design, REST APIs
PROJECTS:
- Banking Account Simulation (Java): Comprehensive OOP project demonstrating encapsulation, polymorphism, and multi-threaded transaction safety.
- Simple Task REST API (Java/Spring Boot, H2/MySQL): CRUD operations with input validation and exception handling.
DSA:
- 200+ problems solved on LeetCode and HackerRank (5-star Java badge).
EDUCATION:
- B.Tech CSE (CGPA: 8.0/10).`
    },
    {
      id: "sde-013",
      name: "Meera Chopra",
      resume: `Meera Chopra | meera.c@gmail.com | github.com/meera-c | Delhi, India
Software Engineering Intern Candidate
SKILLS: Python, SQL, Flask, SQLite, Git, GitHub, OOP, Data Structures
PROJECTS:
- Online Quiz Engine (Python, Flask, SQLite): RESTful backend managing quiz questions, timer countdowns, and score calculation.
- File Organizer Automation Script: Python script that sorts downloaded files by extension.
DSA:
- 180+ problems solved on LeetCode.
EDUCATION:
- B.Tech in Information Technology (CGPA: 7.9/10).`
    },

    // ─── MIDDLE TIER: RANKS 14 - 22 (Decent Fundamentals, Limited Project Scale or DSA) ───
    {
      id: "sde-014",
      name: "Siddharth Rao",
      resume: `Siddharth Rao | siddharth.r@gmail.com | Bengaluru, India
B.Tech CSE Student | Backend Learner
SKILLS: Java, SQL, MySQL, Git, Basic OOP, HTML, CSS
PROJECTS:
- College Canteen Ordering Web App: Academic project in Java Servlets and MySQL. Handled basic cart checkout.
DSA:
- 130+ LeetCode problems solved.
EDUCATION: B.Tech CSE (CGPA: 7.6/10).`
    },
    {
      id: "sde-015",
      name: "Tanvi Kulkarni",
      resume: `Tanvi Kulkarni | tanvi.k@gmail.com | Pune, India
Software Engineering Student
SKILLS: Python, MySQL, Git, Basic REST APIs, OOP
PROJECTS:
- Movie Recommendation Script: Simple Python script using collaborative filtering on CSV data.
- Inventory Tracker: Python CLI app with SQLite backend.
DSA: 110+ LeetCode problems.
EDUCATION: B.E. in Computer Engineering (CGPA: 7.7/10).`
    },
    {
      id: "sde-016",
      name: "Aryan Gupta",
      resume: `Aryan Gupta | aryan.g@gmail.com | Delhi, India
B.Tech Student looking for SDE Internship
SKILLS: C++, Python, Git, Basic SQL
PROJECTS:
- Library Management System in C++ using file handling.
- Personal Portfolio Website in HTML, CSS, JavaScript.
DSA: 120+ problems solved on GeeksforGeeks.
EDUCATION: B.Tech in CSE (CGPA: 7.5/10).`
    },
    {
      id: "sde-017",
      name: "Divya Nambiar",
      resume: `Divya Nambiar | divya.n@gmail.com | Kochi, India
Undergraduate in Computer Science
SKILLS: Java, SQL, Git, Basic Spring Boot
PROJECTS:
- Simple Employee Directory: CRUD app in Spring Boot with MySQL.
DSA: 90+ LeetCode problems.
EDUCATION: B.Tech CSE (CGPA: 7.8/10).`
    },
    {
      id: "sde-018",
      name: "Pranav Deshmukh",
      resume: `Pranav Deshmukh | pranav.d@gmail.com | Nagpur, India
Engineering Student | Aspiring Developer
SKILLS: Python, Flask, SQLite, Git
PROJECTS:
- Blog Web App: Basic Flask blog with user login and post creation.
DSA: 85+ LeetCode problems solved.
EDUCATION: B.E. CSE (CGPA: 7.4/10).`
    },
    {
      id: "sde-019",
      name: "Rhea Sen",
      resume: `Rhea Sen | rhea.sen@gmail.com | Kolkata, India
Computer Science Fresher
SKILLS: C++, Java, MySQL, OOP
PROJECTS:
- Tic-Tac-Toe Game in Java with GUI (Swing).
- Student Database in MySQL with basic stored procedures.
DSA: 75+ LeetCode problems.
EDUCATION: B.Tech IT (CGPA: 7.6/10).`
    },
    {
      id: "sde-020",
      name: "Harsh Vardhan",
      resume: `Harsh Vardhan | harsh.v@gmail.com | Patna, India
B.Tech CSE Student
SKILLS: Python, SQL, Basic Git, OOP
PROJECTS:
- Weather App using public API and Python requests.
- Contact Book management in Python.
DSA: 60+ LeetCode problems.
EDUCATION: B.Tech CSE (CGPA: 7.2/10).`
    },
    {
      id: "sde-021",
      name: "Sneha Nair",
      resume: `Sneha Nair | sneha.nair@gmail.com | Thiruvananthapuram, India
B.Tech Student
SKILLS: Java, C, SQL, Git
PROJECTS:
- Banking System Console App in Java.
DSA: 50+ problems solved on HackerRank.
EDUCATION: B.Tech (CGPA: 7.3/10).`
    },
    {
      id: "sde-022",
      name: "Varun Tiwari",
      resume: `Varun Tiwari | varun.t@gmail.com | Bhopal, India
Undergraduate Student
SKILLS: Python, HTML, Basic SQL
PROJECTS:
- Simple Web Scraper using BeautifulSoup in Python.
DSA: 45+ LeetCode problems.
EDUCATION: B.Tech CSE (CGPA: 7.1/10).`
    },

    // ─── ROLE MISMATCHES: RANKS 23 - 24 (Strong in wrong domains — ML heavy, UI/UX heavy) ───
    {
      id: "sde-023",
      name: "Rahul Iyer",
      resume: `Rahul Iyer | rahul.iyer@ml-research.org | github.com/rahul-ai | Chennai, India
AI/ML Research Intern | Computer Vision & NLP Enthusiast
EXPERIENCE:
- Research Intern @ Cognitive Vision Lab (Summer 2024):
  * Trained ResNet-50 and Vision Transformer (ViT) models in PyTorch for medical image segmentation.
  * Published co-authored paper at regional IEEE conference on self-supervised contrastive learning.
SKILLS:
- PyTorch, TensorFlow, OpenCV, HuggingFace, Scikit-Learn, Pandas, Python, NumPy, Matplotlib
PROJECTS:
- Image Super-Resolution GAN: Deep learning model upscaling low-res images by 4x.
- Sentiment Classifier using BERT: Fine-tuned transformers on Twitter dataset.
CONCERNS FOR SDE BACKEND INTERN:
- Minimal exposure to backend systems, REST APIs, SQL, database indexing, or production Git workflow.
- Solved 40 LeetCode problems only.
EDUCATION:
- B.Tech in AI & Data Science (CGPA: 8.8/10).`
    },
    {
      id: "sde-024",
      name: "Neel Malhotra",
      resume: `Neel Malhotra | neel.designs@gmail.com | behance.net/neelm | Bengaluru, India
UI/UX Designer & Frontend Web Developer
EXPERIENCE:
- UI/UX Intern @ DesignCraft Studio (2024):
  * Created design systems in Figma and converted wireframes into responsive React components using Tailwind CSS.
  * Conducted user research interviews and usability testing for e-commerce clients.
SKILLS:
- Figma, Adobe XD, HTML5, CSS3, Tailwind CSS, JavaScript, React.js, Wireframing, Prototyping
PROJECTS:
- Creative Agency Landing Page: Beautiful animated website using Framer Motion and Next.js.
- Mobile Banking App Redesign: 40+ screen interactive prototype in Figma.
CONCERNS FOR SDE BACKEND INTERN:
- Zero backend development experience. No SQL, databases, C++, Java, or server-side API construction.
- No DSA practice (15 problems on LeetCode).
EDUCATION:
- B.Des / B.Tech (CGPA: 8.1/10).`
    },

    // ─── KEYWORD STUFFER: RANK 25 (The "Mihir Bansal" Test — Lots of buzzwords, zero evidence) ───
    {
      id: "sde-025",
      name: "Mihir Bansal",
      resume: `Mihir Bansal | mihir.bansal@gmail.com | Delhi, India
Software Engineer & Full Stack Cloud Specialist
SUMMARY:
Dynamic, result-oriented software developer with comprehensive expertise in Python, Java, C++, DSA, REST APIs, SQL, PostgreSQL, MySQL, Git, GitHub, Docker, Kubernetes, Microservices, AWS, Caching, Redis, OOP, Distributed Systems, CI/CD, React, Node.js, Agile.
TECHNICAL SKILLS:
- Languages: Python, Java, C++, C, JavaScript, SQL
- Core: Data Structures and Algorithms (DSA), Object Oriented Programming (OOP), RESTful Web Services, Microservices Architecture, Distributed Systems
- Databases: PostgreSQL, MySQL, MongoDB, SQLite, Redis
- Tools & Cloud: Git, GitHub, Docker, Kubernetes, AWS, Postman, Linux, JIRA, Agile
PROJECTS:
- Calculator App: Developed desktop calculator in Python.
- Student Management Record: Created simple academic form using HTML and Python.
- Technology Exploration: Explored modern cloud-native architectures and containerization concepts.
EXPERIENCE:
- Campus Ambassador @ Tech Fest (2023): Handled social media outreach and poster distribution.
EDUCATION:
- B.Tech Computer Science (CGPA: 7.2/10).`
    },

    // ─── WEAK / NON-TECHNICAL REJECTS: RANKS 26 - 30 ───
    {
      id: "sde-026",
      name: "Tanmay Joshi",
      resume: `Tanmay Joshi | tanmay.j@gmail.com | Pune, India
Junior Developer
SKILLS: HTML, CSS, JavaScript, Basic C programming.
PROJECTS:
- Personal static website hosted on GitHub Pages.
- Basic calculator in C.
DSA: Never practiced DSA or LeetCode.
EDUCATION: B.Sc Computer Science (CGPA: 6.8/10).`
    },
    {
      id: "sde-027",
      name: "Pooja Sharma",
      resume: `Pooja Sharma | pooja.sharma@yahoo.com | Jaipur, India
Data Entry & Operations Associate
EXPERIENCE:
- Data Entry Clerk @ Regional Logistics (2023 - Present): Entered shipment bills into Excel spreadsheets and verified invoice totals.
SKILLS:
- Microsoft Excel, Word, Typing speed 45 WPM, Basic Internet browsing.
EDUCATION:
- B.Com (2022).
RED FLAGS:
- Zero programming, software engineering, or technical background.`
    },
    {
      id: "sde-028",
      name: "Suresh Nair",
      resume: `Suresh Nair | suresh.nair@services.com | Kochi, India
Technical Support Specialist
EXPERIENCE:
- Desktop Support Engineer (2023 - Present): Installed printer drivers, configured Windows OS updates, and resolved user password reset tickets.
SKILLS:
- Windows 10/11, Networking basics, Hardware troubleshooting, Outlook setup.
EDUCATION:
- Diploma in Computer Applications.
RED FLAGS:
- No coding or software development experience.`
    },
    {
      id: "sde-029",
      name: "Ramesh Kumar",
      resume: `Ramesh Kumar | ramesh.k@rediffmail.com | Kanpur, India
Administrative Assistant
EXPERIENCE:
- Office Assistant @ Manufacturing Firm (2022 - Present): Maintained inventory logs on paper and Excel. Coordinated vendor visits.
SKILLS:
- Office administration, Document filing, Basic computer operation.
EDUCATION:
- B.A. (2021).
RED FLAGS:
- Completely non-technical profile with no engineering education or software skills.`
    },
    {
      id: "sde-030",
      name: "Vikram Malhotra",
      resume: `Vikram Malhotra | vikram.m@gmail.com | Lucknow, India
Candidate
EXPERIENCE:
- General contractor work and retail sales.
SKILLS:
- Sales, Customer communication, Cash handling.
EDUCATION:
- High School Diploma / Non-engineering.
RED FLAGS:
- Zero relevant skills or education for a software engineering position.`
    }
  ];
}

