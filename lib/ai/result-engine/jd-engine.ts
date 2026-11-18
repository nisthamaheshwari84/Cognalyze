/**
 * COGNALYZE RESULT ENGINE — JD INGESTION & INTELLIGENCE ENGINE (GATE 2)
 * Ingests, normalizes, decomposes, and audits job descriptions into
 * traceable canonical requirements and immutable role specifications.
 */

import crypto from 'crypto';
import {
  CanonicalJDRequirement,
  ParsedJD,
  RequirementPriority,
  RoleArchetype,
  CanonicalRoleSpec,
  JDQualityAudit
} from './types';
import { canonicalizeSkill, matchTokenWithBoundaries, TECHNOLOGY_ONTOLOGY } from './ontology';

export const PRIORITY_WEIGHTS: Record<RequirementPriority, number> = {
  CRITICAL: 3.0,
  IMPORTANT: 2.0,
  PREFERRED: 1.0,
  NICE_TO_HAVE: 0.5,
};

/**
 * Detects the specific engineering archetype to tailor evaluation criteria.
 */
export function detectRoleArchetype(jobTitle: string, jdText: string): RoleArchetype {
  const combined = `${jobTitle} ${jdText}`.toLowerCase();
  if (/\b(ai|artificial intelligence|machine learning|ml|nlp|deep learning|vision|llm|generative ai|prompt)\b/i.test(combined)) {
    return 'ai_ml_engineer';
  }
  if (/\b(frontend|front-end|ui\/ux|react|next\.?js|web developer|css|tailwind|client)\b/i.test(combined)) {
    return 'frontend_engineer';
  }
  if (/\b(backend|back-end|api|server|microservices|distributed systems)\b/i.test(combined)) {
    return 'backend_engineer';
  }
  if (/\b(fullstack|full-stack|full stack)\b/i.test(combined)) {
    return 'fullstack_engineer';
  }
  if (/\b(data engineer|big data|etl|data platform|data warehouse|spark|kafka|airflow)\b/i.test(combined)) {
    return 'data_engineer';
  }
  if (/\b(devops|sre|site reliability|cloud engineer|infrastructure|kubernetes|terraform|docker)\b/i.test(combined)) {
    return 'devops_cloud_engineer';
  }
  if (/\b(data analyst|business analyst|bi analyst|tableau|power bi|analytics)\b/i.test(combined)) {
    return 'data_analyst';
  }
  return 'general_software_engineer';
}

/**
 * Produces concrete, observable technical indicators for evaluating a requirement.
 */
export function getObservableIndicators(
  skillName: string,
  category: string,
  roleArchetype: RoleArchetype
): string[] {
  const lower = skillName.toLowerCase();

  if (lower.includes('rest') || lower.includes('api')) {
    return [
      'API endpoint routing & HTTP method semantics (GET/POST/PUT/DELETE)',
      'Request & response validation schemas (Pydantic, Zod, or Joi)',
      'Authentication, token parsing, and role-based authorization',
      'Structured error handling, idempotency, and standard HTTP status codes',
      'Automated API integration tests or contract testing',
    ];
  }
  if (lower.includes('postgres') || lower.includes('sql') || lower.includes('database')) {
    return [
      'Relational schema design, primary keys, and foreign key constraints',
      'Indexing strategies (B-tree, GIN/GiST, composite indexes)',
      'Complex SQL joins, window functions, and aggregation queries',
      'ACID transaction management and concurrency/isolation levels',
      'Database migrations, connection pooling, and query execution plans',
    ];
  }
  if (lower.includes('fastapi')) {
    return [
      'Async route handlers and event loops under ASGI (Uvicorn)',
      'Pydantic request body models and type-safe query validation',
      'FastAPI dependency injection system for services and auth',
      'CORS middleware, exception handlers, and response serialization',
      'Auto-generated OpenAPI / Swagger interactive documentation',
    ];
  }
  if (lower.includes('docker') || lower.includes('container')) {
    return [
      'Dockerfile creation with multi-stage builds for small image size',
      'Layer caching optimization and non-root security principles',
      'Container networking, port binding, and persistent volume mounts',
      'Environment variable configuration and secret injection',
      'Docker Compose service orchestration and healthcheck definitions',
    ];
  }
  if (lower.includes('kubernetes') || lower.includes('k8s')) {
    return [
      'Pod specifications, Deployments, and ReplicaSets',
      'Service routing (ClusterIP, NodePort, LoadBalancer) and Ingress controllers',
      'ConfigMaps, Secrets, and persistent storage volumes (PVCs)',
      'Resource requests, limits, and Horizontal Pod Autoscaling (HPA)',
      'Helm charts, liveness/readiness probes, and rolling update strategies',
    ];
  }
  if (lower.includes('react') || lower.includes('next')) {
    return [
      'Modular functional component architecture and typed props',
      'Custom hooks for reusable stateful logic and effect lifecycle management',
      'Server-side rendering (SSR), static generation (SSG), or App Router layout patterns',
      'State management (Context, Zustand, Redux) and re-render mitigation',
      'Responsive design, accessible markup (a11y), and UI component testing',
    ];
  }
  if (lower.includes('python')) {
    return [
      'Object-oriented and functional software architecture',
      'Type annotations, typing module usage, and clean modular structures',
      'Concurrency models (asyncio, multiprocessing, or threading)',
      'Virtual environment isolation, package dependency management (pip/poetry)',
      'Comprehensive unit testing using pytest and mock fixtures',
    ];
  }
  if (lower.includes('rag') || lower.includes('retrieval') || lower.includes('vector')) {
    return [
      'Document chunking strategies and semantic embedding generation',
      'Vector database integration (Pinecone, Qdrant, Chroma, pgvector)',
      'Similarity search, top-k retrieval, and reciprocal rank fusion (RRF)',
      'Context window budgeting, prompt construction, and citation grounding',
      'RAG evaluation frameworks (RAGAS, TruLens) measuring faithfulness and context recall',
    ];
  }
  if (lower.includes('scalab') || lower.includes('throughput') || lower.includes('performance')) {
    return [
      'Profiling bottlenecks, response time percentiles (p95/p99), and profiling tools',
      'Caching layers (Redis, in-memory, CDN) with explicit invalidation strategies',
      'Stateless architecture enabling horizontal autoscaling',
      'Asynchronous task offloading (Celery, BullMQ, Kafka, SQS)',
      'Circuit breaking, rate limiting, and graceful degradation patterns',
    ];
  }
  if (lower.includes('ci/cd') || lower.includes('pipeline') || lower.includes('devops')) {
    return [
      'Automated linting, formatting, and static analysis workflows (GitHub Actions, GitLab CI)',
      'Automated test execution with coverage enforcement on pull requests',
      'Continuous build and container image publishing to artifact registries',
      'Multi-environment promotion (dev -> staging -> prod) with automated rollback',
      'Infrastructure-as-code or GitOps declarative synchronization',
    ];
  }

  return [
    `Practical hands-on implementation of ${skillName} in documented project code`,
    `Proper error handling, boundary validation, and edge case resilience`,
    `Architectural integration of ${skillName} within the broader system lifecycle`,
  ];
}

/**
 * Helper to produce role-aware evidence expectations and proficiency criteria.
 */
function getCompetencyCriteria(name: string, archetype: RoleArchetype, priority: RequirementPriority) {
  const lower = name.toLowerCase();

  let expectedProficiency = 'Working technical implementation with observable code or deployment artifacts.';
  let evidenceExpectations = 'Documented project module, repository code, or quantifiable outcome.';
  let evaluationCriteria = 'Candidate demonstrates practical usage, error handling, and understanding of core mechanics.';

  if (archetype === 'ai_ml_engineer') {
    if (lower.includes('python')) {
      expectedProficiency = 'Advanced Python engineering (OOP, typing, async, performance optimization, data structures).';
      evidenceExpectations = 'Production services, model serving pipelines, or custom algorithms in Python.';
      evaluationCriteria = 'Code quality, modular design, memory management, and library fluency.';
    } else if (lower.includes('rag') || lower.includes('llm') || lower.includes('retrieval')) {
      expectedProficiency = 'Production RAG architecture (chunking strategies, embeddings, vector indexing, retrieval evaluation).';
      evidenceExpectations = 'Vector database integration, context window management, reranking, or latency budgets.';
      evaluationCriteria = 'Distinguishes simple API wrapper calls from genuine retrieval-augmented pipeline engineering.';
    } else if (lower.includes('fastapi') || lower.includes('api')) {
      expectedProficiency = 'High-throughput async API development, Pydantic data schemas, dependency injection, and middleware.';
      evidenceExpectations = 'REST/WebSocket endpoints serving AI inference or data models.';
      evaluationCriteria = 'Asynchronous endpoints, request validation, structured error responses, and connection pooling.';
    }
  } else if (archetype === 'frontend_engineer') {
    if (lower.includes('react') || lower.includes('typescript')) {
      expectedProficiency = 'Production component architecture, custom hooks, state management, and type safety.';
      evidenceExpectations = 'Interactive UI modules, clean component lifecycles, and responsive layouts.';
      evaluationCriteria = 'Render optimization, re-render avoidance, accessibility (a11y), and test coverage.';
    }
  } else if (archetype === 'backend_engineer') {
    if (lower.includes('postgres') || lower.includes('database') || lower.includes('sql')) {
      expectedProficiency = 'Relational schema design, normalization, ACID guarantees, transaction isolation, and indexing.';
      evidenceExpectations = 'Complex SQL queries, migrations, ORM schemas, and query execution plans.';
      evaluationCriteria = 'Data modeling, foreign key constraints, connection pooling, and deadlock mitigation.';
    }
  }

  return { expectedProficiency, evidenceExpectations, evaluationCriteria };
}

/**
 * Conducts a comprehensive quality and ambiguity audit on the extracted JD.
 */
export function auditJDQuality(parsedJD: ParsedJD, rawText: string): JDQualityAudit {
  const ambiguousStatements: Array<{ statement: string; reason: string }> = [];
  const contradictoryExperienceRanges: Array<{ titleSeniority: string; statedTenure: string; reason: string }> = [];
  const unrealisticCombinations: string[] = [];
  const missingSections: string[] = [];
  const unassessableRequirements: string[] = [];
  const duplicateRequirements: string[] = [];

  // 1. Ambiguous Buzzwords
  const buzzwords = [
    { regex: /\b(ninja|rockstar|rock star|wizard|guru|superstar|jedi)\b/i, reason: 'Vague cultural buzzword with zero objective competency indicators' },
    { regex: /\b(fast-paced environment|wear many hats|hit the ground running)\b/i, reason: 'Generic workplace cliché that obscures actual role responsibilities' },
    { regex: /\b(self-starter|go-getter|passionate coder)\b/i, reason: 'Unverifiable subjective attribute' },
  ];

  for (const bw of buzzwords) {
    const match = rawText.match(bw.regex);
    if (match) {
      ambiguousStatements.push({ statement: match[0], reason: bw.reason });
    }
  }

  // 2. Contradictory Experience Ranges
  const isJuniorOrEntry = /\b(intern|internship|entry level|entry-level|junior|fresher|campus|graduate)\b/i.test(
    `${parsedJD.jobTitle} ${parsedJD.seniority || ''}`
  );
  const tenureMatch = rawText.match(/\b([5-9]|\d{2,})\+?\s*(?:years?|yrs)\s+(?:of\s+)?(?:experience|exp)\b/i);
  if (isJuniorOrEntry && tenureMatch) {
    contradictoryExperienceRanges.push({
      titleSeniority: parsedJD.seniority || parsedJD.jobTitle,
      statedTenure: tenureMatch[0],
      reason: `Role is designated as "${parsedJD.jobTitle}" (${parsedJD.seniority}), yet requires "${tenureMatch[0]}", creating an impossible junior threshold.`,
    });
  }

  // 3. Unrealistic Combinations (e.g. 10+ years of a tech that existed for 3 years)
  const recentTech = [
    { name: 'ChatGPT', minYear: 2022 },
    { name: 'Next.js App Router', minYear: 2023 },
    { name: 'Bun', minYear: 2022 },
    { name: 'LangChain', minYear: 2022 },
  ];
  for (const rt of recentTech) {
    const yearsPattern = new RegExp(`\\b([5-9]|\\d{2,})\\+?\\s*(?:years?|yrs)[^.\\n]*\\b${rt.name}\\b`, 'i');
    if (yearsPattern.test(rawText)) {
      unrealisticCombinations.push(`Requires 5+ to 10+ years of ${rt.name}, which was first released in ${rt.minYear}.`);
    }
  }

  // 4. Missing Sections
  if (!parsedJD.responsibilities || parsedJD.responsibilities.length === 0) {
    missingSections.push('Role Responsibilities ("Responsibilities" or "What you will do") section missing');
  }
  if (!parsedJD.requirements || parsedJD.requirements.length === 0) {
    missingSections.push('Technical Qualifications or Requirements section missing');
  }

  // 5. Unassessable Requirements
  for (const req of parsedJD.requirements) {
    const lowerReq = req.normalized_requirement.toLowerCase();
    if (lowerReq.includes('team player') || lowerReq.includes('hard worker') || lowerReq.includes('enthusiasm')) {
      unassessableRequirements.push(req.normalized_requirement);
    }
  }

  // 6. Duplicate Requirements
  const seenSkills = new Map<string, string>();
  for (const req of parsedJD.requirements) {
    const key = req.normalized_requirement.toLowerCase();
    if (seenSkills.has(key)) {
      duplicateRequirements.push(`Duplicate requirement extracted: "${req.normalized_requirement}"`);
    } else {
      seenSkills.set(key, req.id);
    }
  }

  // Calculate vagueness score (0 to 100)
  let vagueness = 0;
  vagueness += ambiguousStatements.length * 15;
  vagueness += contradictoryExperienceRanges.length * 30;
  vagueness += unrealisticCombinations.length * 25;
  vagueness += missingSections.length * 20;
  const vaguenessScore = Math.min(100, Math.max(0, vagueness));

  const recruiterReviewRequired =
    vaguenessScore >= 35 ||
    contradictoryExperienceRanges.length > 0 ||
    missingSections.length > 0 ||
    unrealisticCombinations.length > 0;

  return {
    vaguenessScore,
    ambiguousStatements,
    contradictoryExperienceRanges,
    unrealisticCombinations,
    missingSections,
    unassessableRequirements,
    duplicateRequirements,
    recruiterReviewRequired,
  };
}

/**
 * Ingests a raw job description and extracts canonical requirements.
 */
export function parseJobDescription(jdText: string): ParsedJD {
  const raw = jdText?.trim() || '';
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Extract high-level metadata (Job Title, Company, Seniority)
  let jobTitle = 'Software Engineer';
  let company = '';
  let seniority = 'Mid / Early Career';

  for (const line of lines.slice(0, 10)) {
    const lower = line.toLowerCase();
    if (lower.startsWith('title:') || lower.startsWith('role:') || lower.startsWith('position:')) {
      jobTitle = line.replace(/^(title|role|position):/i, '').trim();
    } else if (lower.startsWith('company:')) {
      company = line.replace(/^company:/i, '').trim();
    } else if (lower.includes('intern') || lower.includes('graduate') || lower.includes('entry') || lower.includes('junior')) {
      seniority = 'Early Career / Campus';
    } else if (lower.includes('senior') || lower.includes('lead') || lower.includes('principal')) {
      seniority = 'Senior / Staff';
    } else if (!jobTitle && (lower.includes('engineer') || lower.includes('developer') || lower.includes('analyst') || lower.includes('scientist'))) {
      jobTitle = line;
    }
  }

  // 2. Identify sections
  const reqLines: {
    text: string;
    sectionPriority: RequirementPriority;
    prioritySourceText: string;
    explicitness: 'explicit' | 'implicit';
    lineIndex: number;
    sectionType: 'responsibilities' | 'requirements' | 'preferred' | 'general';
  }[] = [];
  let currentPriority: RequirementPriority = 'IMPORTANT';
  let currentPrioritySourceText: string = 'Role Responsibilities & Core Competencies';
  let currentSectionType: 'responsibilities' | 'requirements' | 'preferred' | 'general' = 'general';

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const isBullet = line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || /^\d+\./.test(line);
    const cleanText = line.replace(/^([-•*]|\d+\.)\s*/, '').trim();
    const lower = cleanText.toLowerCase();

    // Check section header changes
    const isHeaderCandidate =
      !isBullet &&
      (cleanText.endsWith(':') || (!cleanText.includes(':') && cleanText.length < 35));
    const normalizedHeader = lower.replace(/[-_]/g, ' ');
    if (isHeaderCandidate) {
      if (
        normalizedHeader.includes('must have') ||
        normalizedHeader.includes('required qualification') ||
        normalizedHeader.includes('basic qualification') ||
        normalizedHeader.includes('minimum qualification') ||
        normalizedHeader.includes('core requirements') ||
        normalizedHeader.includes('requirements')
      ) {
        currentPriority = 'CRITICAL';
        currentPrioritySourceText = line;
        currentSectionType = 'requirements';
        continue;
      }
      if (
        normalizedHeader.includes('nice to have') ||
        normalizedHeader.includes('good to have')
      ) {
        currentPriority = 'NICE_TO_HAVE';
        currentPrioritySourceText = line;
        currentSectionType = 'preferred';
        continue;
      }
      if (
        normalizedHeader.includes('preferred') ||
        normalizedHeader.includes('bonus') ||
        normalizedHeader.includes('plus if') ||
        normalizedHeader.includes('desired')
      ) {
        currentPriority = 'PREFERRED';
        currentPrioritySourceText = line;
        currentSectionType = 'preferred';
        continue;
      }
      if (
        normalizedHeader.includes('responsibilities') ||
        normalizedHeader.includes('what you will do') ||
        normalizedHeader.includes('about the role')
      ) {
        currentPriority = 'IMPORTANT';
        currentPrioritySourceText = line;
        currentSectionType = 'responsibilities';
        continue;
      }
    }

    if (cleanText.length >= 2 && !cleanText.endsWith(':')) {
      let itemPriority = currentPriority;
      let itemPrioritySource = currentPrioritySourceText;
      let itemSectionType = currentSectionType;
      const lowerClean = cleanText.toLowerCase();
      const normalizedClean = lowerClean.replace(/[-_]/g, ' ');

      // Inline explicit markers
      if (
        normalizedClean.includes('must have') ||
        normalizedClean.includes('required') ||
        normalizedClean.includes('mandatory')
      ) {
        itemPriority = 'CRITICAL';
        itemPrioritySource = cleanText;
        itemSectionType = 'requirements';
      } else if (
        normalizedClean.includes('nice to have') ||
        normalizedClean.includes('good to have')
      ) {
        itemPriority = 'NICE_TO_HAVE';
        itemPrioritySource = cleanText;
        itemSectionType = 'preferred';
      } else if (
        normalizedClean.includes('preferred') ||
        normalizedClean.includes('plus') ||
        normalizedClean.includes('bonus')
      ) {
        itemPriority = 'PREFERRED';
        itemPrioritySource = cleanText;
        itemSectionType = 'preferred';
      }

      reqLines.push({
        text: cleanText,
        sectionPriority: itemPriority,
        prioritySourceText: itemPrioritySource,
        explicitness: isBullet ? 'explicit' : 'implicit',
        lineIndex: idx,
        sectionType: itemSectionType,
      });
    }
  }

  // Detect engineering role archetype
  const roleArchetype = detectRoleArchetype(jobTitle, raw);

  // 3. Extract Canonical Requirements & Decompose Compound Requirements
  const canonicalReqs: CanonicalJDRequirement[] = [];
  const seenNormalized = new Set<string>();
  let reqCounter = 1;

  // Architectural competencies for compound decomposition
  const ARCHITECTURAL_PATTERNS: Array<{
    name: string;
    regex: RegExp;
    category: CanonicalJDRequirement['category'];
    subcategory: string;
    synonyms: string[];
  }> = [
    {
      name: 'RAG Architecture & Retrieval',
      regex: /\b(rag|retrieval augmented|retrieval-augmented|vector retrieval|dense retrieval)\b/i,
      category: 'technical',
      subcategory: 'ai_architecture',
      synonyms: ['RAG', 'Retrieval Augmented Generation', 'Vector Search'],
    },
    {
      name: 'Application Scalability & Performance',
      regex: /\b(scalable|scalability|high-throughput|high throughput|low-latency|low latency|performance optimization)\b/i,
      category: 'technical',
      subcategory: 'system_architecture',
      synonyms: ['System Scalability', 'High Throughput', 'Performance Optimization'],
    },
    {
      name: 'Cloud Deployment & Hosting',
      regex: /\b(cloud deployment|cloud deploy|cloud hosting|deploy to cloud|production deployment)\b/i,
      category: 'deployment',
      subcategory: 'cloud',
      synonyms: ['Cloud Deployment', 'Production Deployment', 'Cloud Infrastructure'],
    },
    {
      name: 'RESTful API Development',
      regex: /\b(api development|restful apis?|rest apis?|backend endpoints?|microservices?)\b/i,
      category: 'technical',
      subcategory: 'api',
      synonyms: ['REST APIs', 'API Engineering', 'Microservices'],
    },
    {
      name: 'Data Pipeline & ETL Engineering',
      regex: /\b(data pipelines?|etl pipelines?|data ingestion|stream processing|batch processing)\b/i,
      category: 'technical',
      subcategory: 'data_engineering',
      synonyms: ['Data Pipelines', 'ETL', 'Data Processing'],
    },
    {
      name: 'Automated Testing & QA',
      regex: /\b(unit testing|integration testing|automated testing|test-driven|tdd|test coverage)\b/i,
      category: 'technical',
      subcategory: 'qa_testing',
      synonyms: ['Unit Testing', 'Automated QA', 'Test Coverage'],
    },
    {
      name: 'CI/CD Automation',
      regex: /\b(ci\/cd|continuous integration|continuous deployment|deployment pipelines?)\b/i,
      category: 'deployment',
      subcategory: 'devops',
      synonyms: ['CI/CD', 'Automated Deployments'],
    },
  ];

  // Scan lines against ontology and architectural patterns
  for (const item of reqLines) {
    const lowerLine = item.text.toLowerCase();
    const lineMatches: CanonicalJDRequirement[] = [];

    // Check against ontology nodes
    for (const [key, node] of Object.entries(TECHNOLOGY_ONTOLOGY)) {
      const allNames = [node.canonicalName.toLowerCase(), ...node.synonyms.map((s) => s.toLowerCase())];
      const matched = allNames.some((n) => matchTokenWithBoundaries(item.text, n));

      if (matched && !seenNormalized.has(node.canonicalName.toLowerCase())) {
        seenNormalized.add(node.canonicalName.toLowerCase());

        let cat: CanonicalJDRequirement['category'] = 'technical';
        let subcat = node.category;
        if (node.category === 'cloud' || node.category === 'devops') {
          cat = 'deployment';
        } else if (node.category === 'api') {
          cat = 'technical';
          subcat = 'api';
        }

        const criteria = getCompetencyCriteria(node.canonicalName, roleArchetype, item.sectionPriority);
        const indicators = getObservableIndicators(node.canonicalName, subcat, roleArchetype);

        const demonstrableLevel: CanonicalJDRequirement['demonstrableLevelRequired'] =
          seniority.includes('Senior')
            ? 'production_scale'
            : cat === 'technical' || cat === 'deployment'
            ? 'hands_on_project'
            : 'knowledge';

        lineMatches.push({
          id: `req_${String(reqCounter++).padStart(3, '0')}`,
          original_text: item.text,
          original_jd_quote: item.text,
          normalized_requirement: node.canonicalName,
          category: cat,
          subcategory: subcat,
          priority: item.sectionPriority,
          priority_source_text: item.prioritySourceText,
          requirement_type: node.category === 'language' ? 'language' : node.category === 'framework' ? 'framework' : 'skill',
          synonyms: node.synonyms,
          explicitness: item.explicitness,
          evidence_policy: 'direct_or_project_evidence',
          weight: PRIORITY_WEIGHTS[item.sectionPriority],
          demonstrableLevelRequired: demonstrableLevel,
          source_location: {
            section: item.prioritySourceText,
            lineRef: `line ${item.lineIndex + 1}`,
          },
          observable_indicators: indicators,
          priority_reasoning:
            item.sectionPriority === 'CRITICAL'
              ? `Derived from source text: "${item.prioritySourceText}"`
              : item.sectionPriority === 'PREFERRED'
              ? `Derived from preferred qualifications: "${item.prioritySourceText}"`
              : item.sectionPriority === 'NICE_TO_HAVE'
              ? `Derived from nice-to-have criteria: "${item.prioritySourceText}"`
              : `Derived from role description: "${item.prioritySourceText}"`,
          expected_proficiency: criteria.expectedProficiency,
          evidence_expectations: criteria.evidenceExpectations,
          evaluation_criteria: criteria.evaluationCriteria,
        });
      }
    }

    // Compound Decomposition: Check architectural patterns
    for (const arch of ARCHITECTURAL_PATTERNS) {
      if (arch.regex.test(lowerLine) && !seenNormalized.has(arch.name.toLowerCase())) {
        seenNormalized.add(arch.name.toLowerCase());
        const criteria = getCompetencyCriteria(arch.name, roleArchetype, item.sectionPriority);
        const indicators = getObservableIndicators(arch.name, arch.subcategory, roleArchetype);

        const demonstrableLevel: CanonicalJDRequirement['demonstrableLevelRequired'] =
          seniority.includes('Senior') ? 'production_scale' : 'hands_on_project';

        lineMatches.push({
          id: `req_${String(reqCounter++).padStart(3, '0')}`,
          original_text: item.text,
          original_jd_quote: item.text,
          normalized_requirement: arch.name,
          category: arch.category,
          subcategory: arch.subcategory,
          priority: item.sectionPriority,
          priority_source_text: item.prioritySourceText,
          requirement_type: 'skill',
          synonyms: arch.synonyms,
          explicitness: item.explicitness,
          evidence_policy: 'direct_or_project_evidence',
          weight: PRIORITY_WEIGHTS[item.sectionPriority],
          demonstrableLevelRequired: demonstrableLevel,
          source_location: {
            section: item.prioritySourceText,
            lineRef: `line ${item.lineIndex + 1}`,
          },
          observable_indicators: indicators,
          priority_reasoning: `Decomposed from compound role requirement: "${item.text}"`,
          expected_proficiency: criteria.expectedProficiency,
          evidence_expectations: criteria.evidenceExpectations,
          evaluation_criteria: criteria.evaluationCriteria,
        });
      }
    }

    const textWithoutAbbrs = item.text.replace(/\b(ai\/ml|ci\/cd|tcp\/ip|i\/o|os\/networking)\b/gi, '');
    const isOrGroup =
      lineMatches.length > 1 &&
      /\b(or|either|any of|one of)\b/i.test(textWithoutAbbrs) &&
      !/\b(and|plus|along with|both)\b/i.test(textWithoutAbbrs);

    if (isOrGroup) {
      // Group alternative qualifications into a single logical disjunction
      const alternativeNames = lineMatches.map((m) => m.normalized_requirement);
      const combinedName = alternativeNames.join(', ').replace(/, ([^,]+)$/, ' or $1');
      const allSynonyms = Array.from(new Set(lineMatches.flatMap((m) => m.synonyms)));
      const allIndicators = Array.from(new Set(lineMatches.flatMap((m) => m.observable_indicators || [])));
      const altGroupId = `alt_group_${reqCounter}`;

      canonicalReqs.push({
        id: `req_${String(reqCounter++).padStart(3, '0')}`,
        original_text: item.text,
        original_jd_quote: item.text,
        normalized_requirement: combinedName,
        category: lineMatches[0].category,
        subcategory: lineMatches[0].subcategory,
        priority: item.sectionPriority,
        priority_source_text: item.prioritySourceText,
        requirement_type: lineMatches[0].requirement_type,
        synonyms: allSynonyms,
        explicitness: item.explicitness,
        evidence_policy: lineMatches[0].evidence_policy,
        weight: PRIORITY_WEIGHTS[item.sectionPriority],
        demonstrableLevelRequired: lineMatches[0].demonstrableLevelRequired,
        source_location: {
          section: item.prioritySourceText,
          lineRef: `line ${item.lineIndex + 1}`,
        },
        observable_indicators: allIndicators,
        priority_reasoning: `Alternative qualification: At least one required from "${item.text}"`,
        expected_proficiency: lineMatches[0].expected_proficiency,
        evidence_expectations: `Demonstrated implementation in at least one accepted alternative: ${alternativeNames.join(', ')}`,
        evaluation_criteria: `At least one alternative must be sufficiently evidenced: ${alternativeNames.join(', ')}`,
        requirement_logic: 'OR',
        alternative_group_id: altGroupId,
        alternatives: alternativeNames,
        acceptance_rule: `At least one alternative must be sufficiently evidenced (${alternativeNames.join(' or ')})`,
        is_alternative: true,
      });
    } else {
      const isCompound = lineMatches.length > 1 || /[,;]|\b(and|with|using|plus)\b/i.test(item.text);
      for (const lm of lineMatches) {
        lm.is_decomposed = isCompound;
        if (isCompound) {
          lm.parent_compound_requirement = item.text;
        }
        lm.requirement_logic = item.sectionPriority === 'PREFERRED' || item.sectionPriority === 'NICE_TO_HAVE' ? 'PREFERRED' : 'AND';
        canonicalReqs.push(lm);
      }
    }
  }

  // Fallback / standard role patterns if JD text was brief or non-bulleted
  if (canonicalReqs.length === 0) {
    const defaultPatterns = [
      { name: 'Python', key: 'python', priority: 'CRITICAL' as RequirementPriority, source: 'Core Role Expectation' },
      { name: 'Machine Learning', key: 'machine_learning', priority: 'CRITICAL' as RequirementPriority, source: 'Core Role Expectation' },
      { name: 'RESTful APIs', key: 'rest_api', priority: 'IMPORTANT' as RequirementPriority, source: 'Role Responsibilities' },
      { name: 'AWS', key: 'aws', priority: 'PREFERRED' as RequirementPriority, source: 'Preferred Qualifications' },
    ];

    for (const dp of defaultPatterns) {
      const node = TECHNOLOGY_ONTOLOGY[dp.key];
      const indicators = getObservableIndicators(dp.name, node?.category || 'skill', roleArchetype);

      canonicalReqs.push({
        id: `req_${String(reqCounter++).padStart(3, '0')}`,
        original_text: `Knowledge and practical application of ${dp.name}`,
        original_jd_quote: `Knowledge and practical application of ${dp.name}`,
        normalized_requirement: dp.name,
        category: dp.key === 'aws' ? 'deployment' : 'technical',
        subcategory: node?.category || 'skill',
        priority: dp.priority,
        priority_source_text: dp.source,
        requirement_type: 'skill',
        synonyms: node?.synonyms || [],
        explicitness: 'implicit',
        evidence_policy: 'direct_or_project_evidence',
        weight: PRIORITY_WEIGHTS[dp.priority],
        demonstrableLevelRequired: 'hands_on_project',
        source_location: { section: dp.source, lineRef: 'implicit requirement' },
        observable_indicators: indicators,
        priority_reasoning: `Standard role competency requirement derived from title context.`,
      });
    }
  }

  // Ensure priority ordering: CRITICAL first, then IMPORTANT, then PREFERRED, then NICE_TO_HAVE
  canonicalReqs.sort((a, b) => {
    const weight: Record<RequirementPriority, number> = { CRITICAL: 4, IMPORTANT: 3, PREFERRED: 2, NICE_TO_HAVE: 1 };
    return weight[b.priority] - weight[a.priority];
  });

  const parsedJD: ParsedJD = {
    jobTitle,
    company: company || undefined,
    seniority,
    roleArchetype,
    educationRequirements: ['Bachelor’s degree in Computer Science, Engineering, or related technical field'],
    yearsExperience: seniority.includes('Senior') ? '3-5+ years' : '0-2 years (Early Career)',
    requiredTechnicalSkills: canonicalReqs.filter((r) => r.category === 'technical').map((r) => r.normalized_requirement),
    requiredSoftSkills: ['Collaboration', 'Problem Solving', 'Technical Communication'],
    responsibilities: reqLines.filter((r) => r.sectionType === 'responsibilities').map((r) => r.text).slice(0, 10),
    toolsAndFrameworks: canonicalReqs.filter((r) => r.requirement_type === 'framework' || r.requirement_type === 'tool').map((r) => r.normalized_requirement),
    programmingLanguages: canonicalReqs.filter((r) => r.requirement_type === 'language').map((r) => r.normalized_requirement),
    domainKnowledge: ['Software Architecture', 'Data Processing'],
    certifications: [],
    preferredQualifications: canonicalReqs.filter((r) => r.priority === 'PREFERRED' || r.priority === 'NICE_TO_HAVE').map((r) => r.normalized_requirement),
    deploymentRequirements: canonicalReqs.filter((r) => r.category === 'deployment').map((r) => r.normalized_requirement),
    requirements: canonicalReqs,
    rawJDVerbatim: raw,
    sourceHash: crypto.createHash('sha256').update(raw).digest('hex'),
  };

  parsedJD.qualityAudit = auditJDQuality(parsedJD, raw);

  return parsedJD;
}

/**
 * Builds an immutable, audited CanonicalRoleSpec from a parsed JD.
 */
export function buildCanonicalRoleSpec(
  parsedJD: ParsedJD,
  rawText: string,
  metadata?: {
    source?: 'pasted_text' | 'pdf' | 'docx' | 'url' | 'text_file';
    fileName?: string;
  }
): CanonicalRoleSpec {
  const source = metadata?.source || 'pasted_text';
  const clean = rawText?.trim() || parsedJD.rawJDVerbatim || '';
  const sourceDocHash = parsedJD.sourceHash || crypto.createHash('sha256').update(clean).digest('hex');

  const seniorityLevel: CanonicalRoleSpec['seniorityLevel'] =
    parsedJD.seniority?.toLowerCase().includes('intern')
      ? 'intern'
      : parsedJD.seniority?.toLowerCase().includes('early') || parsedJD.seniority?.toLowerCase().includes('junior')
      ? 'entry'
      : parsedJD.seniority?.toLowerCase().includes('lead')
      ? 'lead'
      : parsedJD.seniority?.toLowerCase().includes('principal')
      ? 'principal'
      : parsedJD.seniority?.toLowerCase().includes('senior')
      ? 'senior'
      : 'mid';

  const qualityAudit = parsedJD.qualityAudit || auditJDQuality(parsedJD, clean);

  return {
    id: `role_${sourceDocHash.slice(0, 12)}`,
    title: parsedJD.jobTitle,
    seniorityLevel,
    roleArchetype: parsedJD.roleArchetype || 'general_software_engineer',
    atomicRequirements: parsedJD.requirements,
    rawJDVerbatim: clean,
    sourceDocHash,
    documentMetadata: {
      source,
      fileName: metadata?.fileName,
      extractedAt: new Date().toISOString(),
      version: 1,
      extractionQualityScore: Math.max(0, 100 - qualityAudit.vaguenessScore),
    },
    qualityAudit,
  };
}

/**
 * Ingests a complete job description document with provenance and quality validation.
 */
export function ingestJobDescriptionDocument(options: {
  rawText: string;
  source?: 'pasted_text' | 'pdf' | 'docx' | 'url' | 'text_file';
  fileName?: string;
}): { parsedJD: ParsedJD; roleSpec: CanonicalRoleSpec } {
  const { rawText, source = 'pasted_text', fileName } = options;
  const clean = rawText?.trim() || '';

  if (clean.length < 50) {
    throw new Error(
      `Job description document is incomplete or unreadable (${clean.length} characters). Minimum 50 characters required.`
    );
  }

  const parsedJD = parseJobDescription(clean);
  const roleSpec = buildCanonicalRoleSpec(parsedJD, clean, { source, fileName });

  parsedJD.documentMetadata = {
    source,
    fileName,
    extractedAt: roleSpec.documentMetadata.extractedAt,
    extractionQualityScore: roleSpec.documentMetadata.extractionQualityScore,
  };

  return { parsedJD, roleSpec };
}
