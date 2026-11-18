/**
 * COGNALYZE RESULT ENGINE — TECHNOLOGY ONTOLOGY & CANONICAL TAXONOMY
 * Provides normalized skills, synonym dictionaries, and hard boundary rules.
 */

export interface OntologyNode {
  canonicalName: string;
  category: 'language' | 'framework' | 'library' | 'database' | 'cloud' | 'devops' | 'ai_ml' | 'api' | 'tool' | 'concept';
  synonyms: string[];
  parents?: string[];
  children?: string[];
  // Non-implications: Having parent or peer does NOT prove this node
  notImpliedBy?: string[];
}

export const TECHNOLOGY_ONTOLOGY: Record<string, OntologyNode> = {
  // --- Programming Languages ---
  python: {
    canonicalName: 'Python',
    category: 'language',
    synonyms: ['python 3', 'python programming', 'python development', 'python3'],
    parents: ['programming'],
  },
  javascript: {
    canonicalName: 'JavaScript',
    category: 'language',
    synonyms: ['js', 'es6', 'es2020', 'vanilla javascript', 'ecmascript'],
    parents: ['programming'],
  },
  typescript: {
    canonicalName: 'TypeScript',
    category: 'language',
    synonyms: ['ts', 'typescript development'],
    parents: ['programming'],
    notImpliedBy: ['javascript'],
  },
  java: {
    canonicalName: 'Java',
    category: 'language',
    synonyms: ['java 8', 'java 11', 'java 17', 'core java', 'j2ee'],
    parents: ['programming'],
  },
  cpp: {
    canonicalName: 'C++',
    category: 'language',
    synonyms: ['c plus plus', 'cpp', 'modern c++'],
    parents: ['programming'],
  },
  sql: {
    canonicalName: 'SQL',
    category: 'language',
    synonyms: ['structured query language', 'ansi sql', 't-sql', 'pl/sql'],
    parents: ['database'],
  },
  go: {
    canonicalName: 'Go',
    category: 'language',
    synonyms: ['golang', 'go programming'],
    parents: ['programming'],
  },
  rust: {
    canonicalName: 'Rust',
    category: 'language',
    synonyms: ['rust programming', 'rustlang'],
    parents: ['programming'],
  },

  // --- AI / ML / Data Science ---
  machine_learning: {
    canonicalName: 'Machine Learning',
    category: 'ai_ml',
    synonyms: ['ml', 'statistical modeling', 'predictive modeling', 'machine learning algorithms'],
    parents: ['ai'],
    children: ['scikit_learn', 'tensorflow', 'pytorch'],
  },
  deep_learning: {
    canonicalName: 'Deep Learning',
    category: 'ai_ml',
    synonyms: ['neural networks', 'ann', 'cnn', 'rnn', 'transformer models'],
    parents: ['machine_learning'],
    notImpliedBy: ['machine_learning', 'data_science'],
  },
  scikit_learn: {
    canonicalName: 'Scikit-learn',
    category: 'library',
    synonyms: ['sklearn', 'scikit learn'],
    parents: ['machine_learning', 'python'],
    notImpliedBy: ['machine_learning', 'python', 'ai'],
  },
  pandas: {
    canonicalName: 'Pandas',
    category: 'library',
    synonyms: ['python pandas', 'pandas dataframe'],
    parents: ['python'],
    notImpliedBy: ['python'],
  },
  numpy: {
    canonicalName: 'NumPy',
    category: 'library',
    synonyms: ['numpy array', 'scientific python'],
    parents: ['python'],
    notImpliedBy: ['python'],
  },
  pytorch: {
    canonicalName: 'PyTorch',
    category: 'framework',
    synonyms: ['torch', 'pytorch lightning'],
    parents: ['deep_learning', 'python'],
    notImpliedBy: ['machine_learning', 'deep_learning', 'python', 'ai'],
  },
  tensorflow: {
    canonicalName: 'TensorFlow',
    category: 'framework',
    synonyms: ['tf', 'keras', 'tf2'],
    parents: ['deep_learning', 'python'],
    notImpliedBy: ['machine_learning', 'deep_learning', 'python', 'ai'],
  },
  generative_ai: {
    canonicalName: 'Generative AI & LLMs',
    category: 'ai_ml',
    synonyms: ['generative ai', 'genai', 'gen ai', 'llm', 'llms', 'large language models', 'rag', 'langchain', 'llamaindex', 'prompt engineering'],
    parents: ['ai'],
    notImpliedBy: ['machine_learning', 'python'],
  },
  nlp: {
    canonicalName: 'Natural Language Processing',
    category: 'ai_ml',
    synonyms: ['nlp', 'text processing', 'tokenization', 'tf-idf', 'spacy', 'nltk', 'transformers', 'bert'],
    parents: ['machine_learning'],
    notImpliedBy: ['python'],
  },
  computer_vision: {
    canonicalName: 'Computer Vision',
    category: 'ai_ml',
    synonyms: ['cv', 'image processing', 'opencv', 'object detection', 'yolo'],
    parents: ['machine_learning'],
    notImpliedBy: ['python'],
  },

  // --- Cloud Platforms (Strict Non-Implication: Cloud != AWS/GCP/Azure) ---
  cloud_computing: {
    canonicalName: 'Cloud Computing',
    category: 'cloud',
    synonyms: ['cloud platforms', 'cloud infrastructure', 'cloud deployment'],
    children: ['aws', 'gcp', 'azure'],
  },
  aws: {
    canonicalName: 'AWS',
    category: 'cloud',
    synonyms: ['amazon web services', 'ec2', 's3', 'aws lambda', 'ecs', 'eks', 'iam', 'cloudwatch', 'dynamodb'],
    parents: ['cloud_computing'],
    notImpliedBy: ['cloud_computing', 'gcp', 'azure'],
  },
  gcp: {
    canonicalName: 'Google Cloud Platform',
    category: 'cloud',
    synonyms: ['gcp', 'google cloud', 'cloud run', 'bigquery', 'gke', 'google compute engine'],
    parents: ['cloud_computing'],
    notImpliedBy: ['cloud_computing', 'aws', 'azure'],
  },
  azure: {
    canonicalName: 'Microsoft Azure',
    category: 'cloud',
    synonyms: ['azure', 'azure devops', 'azure vm', 'azure functions'],
    parents: ['cloud_computing'],
    notImpliedBy: ['cloud_computing', 'aws', 'gcp'],
  },

  // --- DevOps & Containers ---
  docker: {
    canonicalName: 'Docker',
    category: 'devops',
    synonyms: ['containerization', 'containers', 'dockerfile', 'docker-compose'],
    notImpliedBy: ['linux'],
  },
  kubernetes: {
    canonicalName: 'Kubernetes',
    category: 'devops',
    synonyms: ['k8s', 'kube', 'kubectl'],
    parents: ['docker'],
    notImpliedBy: ['docker'],
  },
  terraform: {
    canonicalName: 'Terraform',
    category: 'devops',
    synonyms: ['infrastructure as code', 'iac', 'terraform hcl'],
  },
  cuda: {
    canonicalName: 'CUDA',
    category: 'tool',
    synonyms: ['cuda c++', 'gpu computing', 'nvidia cuda', 'gpu acceleration'],
  },
  cicd: {
    canonicalName: 'CI/CD Pipelines',
    category: 'devops',
    synonyms: ['continuous integration', 'continuous deployment', 'github actions', 'gitlab ci', 'jenkins'],
  },
  git: {
    canonicalName: 'Git & Version Control',
    category: 'tool',
    synonyms: ['git', 'version control', 'git vcs', 'git workflow'],
    notImpliedBy: ['github', 'gitlab', 'bitbucket'],
  },
  linux: {
    canonicalName: 'Linux / Unix',
    category: 'tool',
    synonyms: ['linux', 'unix', 'bash', 'shell scripting', 'ubuntu'],
  },

  // --- Web & APIs ---
  rest_api: {
    canonicalName: 'RESTful APIs',
    category: 'api',
    synonyms: ['rest api', 'restful web services', 'api design', 'endpoints', 'http apis', 'swagger', 'openapi'],
  },
  fastapi: {
    canonicalName: 'FastAPI',
    category: 'framework',
    synonyms: ['fast api', 'fastapi python'],
    parents: ['python', 'rest_api'],
    notImpliedBy: ['python', 'flask'],
  },
  flask: {
    canonicalName: 'Flask',
    category: 'framework',
    synonyms: ['python flask'],
    parents: ['python', 'rest_api'],
    notImpliedBy: ['python', 'fastapi'],
  },
  django: {
    canonicalName: 'Django',
    category: 'framework',
    synonyms: ['django rest framework', 'drf'],
    parents: ['python', 'rest_api'],
    notImpliedBy: ['python'],
  },
  react: {
    canonicalName: 'React',
    category: 'framework',
    synonyms: ['react.js', 'reactjs', 'react native'],
    parents: ['javascript'],
    notImpliedBy: ['javascript', 'html'],
  },
  nextjs: {
    canonicalName: 'Next.js',
    category: 'framework',
    synonyms: ['nextjs', 'next.js 14', 'next.js 15', 'next app router'],
    parents: ['react'],
    notImpliedBy: ['react', 'javascript'],
  },
  tailwind: {
    canonicalName: 'Tailwind CSS',
    category: 'framework',
    synonyms: ['tailwind', 'tailwindcss', 'utility css'],
    parents: ['frontend'],
  },
  graphql: {
    canonicalName: 'GraphQL',
    category: 'api',
    synonyms: ['graphql api', 'apollo graphql'],
    parents: ['api'],
  },
  kafka: {
    canonicalName: 'Apache Kafka',
    category: 'tool',
    synonyms: ['kafka', 'apache kafka', 'event streaming'],
    parents: ['data_engineering'],
  },
  spark: {
    canonicalName: 'Apache Spark',
    category: 'framework',
    synonyms: ['spark', 'pyspark', 'apache spark'],
    parents: ['data_engineering'],
  },
  nodejs: {
    canonicalName: 'Node.js',
    category: 'framework',
    synonyms: ['node', 'nodejs', 'express', 'express.js'],
    parents: ['javascript'],
    notImpliedBy: ['javascript'],
  },

  // --- Databases ---
  postgresql: {
    canonicalName: 'PostgreSQL',
    category: 'database',
    synonyms: ['postgres', 'pgsql', 'psql'],
    parents: ['sql'],
    notImpliedBy: ['sql', 'mysql'],
  },
  mysql: {
    canonicalName: 'MySQL',
    category: 'database',
    synonyms: ['mariadb'],
    parents: ['sql'],
    notImpliedBy: ['sql', 'postgresql'],
  },
  mongodb: {
    canonicalName: 'MongoDB',
    category: 'database',
    synonyms: ['mongo', 'nosql', 'document db'],
    notImpliedBy: ['sql'],
  },
  redis: {
    canonicalName: 'Redis',
    category: 'database',
    synonyms: ['in-memory cache', 'key-value store'],
  },

  // --- Core Concepts & Foundations ---
  dsa: {
    canonicalName: 'Data Structures & Algorithms',
    category: 'concept',
    synonyms: ['dsa', 'data structures and algorithms', 'data structures & algorithms', 'algorithmic problem solving', 'leetcode', 'competitive programming', 'complexity analysis'],
  },
  oop: {
    canonicalName: 'Object-Oriented Programming (OOP)',
    category: 'concept',
    synonyms: ['oop', 'object-oriented programming', 'object oriented programming', 'classes and objects', 'encapsulation', 'polymorphism', 'inheritance', 'abstraction'],
  },
  html_css: {
    canonicalName: 'HTML / CSS',
    category: 'language',
    synonyms: ['html', 'css', 'html5', 'css3', 'html/css', 'html and css', 'responsive design', 'web styling'],
  },
  debugging: {
    canonicalName: 'Debugging & Analytical Skills',
    category: 'concept',
    synonyms: ['debugging', 'troubleshooting', 'analytical skills', 'problem-solving', 'root cause analysis', 'code debugging'],
  },
  csharp: {
    canonicalName: 'C#',
    category: 'language',
    synonyms: ['c sharp', 'c#', '.net c#'],
    parents: ['programming'],
  },
  dotnet: {
    canonicalName: '.NET',
    category: 'framework',
    synonyms: ['.net', 'dotnet', 'asp.net', 'asp.net core', '.net core'],
  },
  system_design: {
    canonicalName: 'System Design & Architecture',
    category: 'concept',
    synonyms: ['distributed systems', 'microservices', 'high availability', 'scalability', 'system architecture'],
  },
};

/**
 * Robust boundary-safe token matcher.
 * Handles tokens with non-word characters like C++, C#, .NET, OOP without false boundary dropouts.
 */
export function matchTokenWithBoundaries(text: string, token: string): boolean {
  if (!text || !token) return false;
  const cleanToken = token.trim();
  if (!cleanToken) return false;

  // Escape special regex chars
  const escaped = cleanToken.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Boundary condition:
  // Left: Start of string OR non-alphanumeric character
  // Right: End of string OR non-alphanumeric character (and if token ends with '+', right cannot be '+')
  const rightExclusion = cleanToken.endsWith('+') ? '[^a-zA-Z0-9_+]' : '[^a-zA-Z0-9_]';
  const pattern = `(?:^|[^a-zA-Z0-9_])${escaped}(?:$|${rightExclusion})`;
  const rx = new RegExp(pattern, 'i');
  return rx.test(text);
}

/**
 * Normalizes an arbitrary skill string into its canonical key if recognized.
 */
export function canonicalizeSkill(skill: string): { key: string; canonicalName: string; category: string } | null {
  if (!skill) return null;
  const clean = skill.trim().toLowerCase().replace(/[#]/g, 'sharp').replace(/[+]/g, 'p');

  // Exact key match
  if (TECHNOLOGY_ONTOLOGY[clean]) {
    return {
      key: clean,
      canonicalName: TECHNOLOGY_ONTOLOGY[clean].canonicalName,
      category: TECHNOLOGY_ONTOLOGY[clean].category,
    };
  }

  // Synonym search
  for (const [key, node] of Object.entries(TECHNOLOGY_ONTOLOGY)) {
    if (node.canonicalName.toLowerCase() === clean) {
      return { key, canonicalName: node.canonicalName, category: node.category };
    }
    for (const syn of node.synonyms) {
      if (syn.toLowerCase() === clean) {
        return { key, canonicalName: node.canonicalName, category: node.category };
      }
    }
  }

  return null;
}

/**
 * Checks whether evidence mentioning `evidenceTerm` can prove requirement `reqTerm`.
 * Enforces non-implication rules (e.g. "Cloud" does NOT prove "AWS").
 */
export function validateOntologyRelationship(
  reqKey: string,
  evidenceText: string
): { isDirect: boolean; isPartial: boolean; violatesBound: boolean; reasoning: string } {
  const reqNode = TECHNOLOGY_ONTOLOGY[reqKey];
  if (!reqNode) {
    return { isDirect: false, isPartial: false, violatesBound: false, reasoning: 'Unknown ontology node' };
  }

  const lowerText = evidenceText.toLowerCase();

  // 1. Check direct match on canonical name or synonyms
  const directTerms = [reqNode.canonicalName.toLowerCase(), ...reqNode.synonyms.map((s) => s.toLowerCase())];
  for (const term of directTerms) {
    // Regex for word boundary
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(`\\b${escaped}\\b`, 'i');
    if (rx.test(lowerText)) {
      return {
        isDirect: true,
        isPartial: false,
        violatesBound: false,
        reasoning: `Direct mention of "${term}" matching ${reqNode.canonicalName}.`,
      };
    }
  }

  // 2. Check non-implication violations (e.g. text mentions "cloud computing" but requirement is "AWS")
  if (reqNode.notImpliedBy) {
    for (const forbiddenParent of reqNode.notImpliedBy) {
      const parentNode = TECHNOLOGY_ONTOLOGY[forbiddenParent];
      const parentTerms = parentNode ? [parentNode.canonicalName.toLowerCase(), ...parentNode.synonyms.map((s) => s.toLowerCase())] : [forbiddenParent.toLowerCase()];
      for (const pTerm of parentTerms) {
        if (new RegExp(`\\b${pTerm}\\b`, 'i').test(lowerText)) {
          return {
            isDirect: false,
            isPartial: true,
            violatesBound: true,
            reasoning: `Evidence mentions broader/related concept "${pTerm}", which does NOT prove specific requirement "${reqNode.canonicalName}".`,
          };
        }
      }
    }
  }

  // 3. Check child relationships (e.g. Requirement is "Machine Learning", evidence has "Scikit-learn" or "PyTorch")
  if (reqNode.children) {
    for (const childKey of reqNode.children) {
      const childNode = TECHNOLOGY_ONTOLOGY[childKey];
      if (childNode) {
        const childTerms = [childNode.canonicalName.toLowerCase(), ...childNode.synonyms.map((s) => s.toLowerCase())];
        for (const cTerm of childTerms) {
          if (new RegExp(`\\b${cTerm}\\b`, 'i').test(lowerText)) {
            return {
              isDirect: true,
              isPartial: false,
              violatesBound: false,
              reasoning: `Evidence demonstrates specific implementation "${cTerm}" which satisfies broader requirement "${reqNode.canonicalName}".`,
            };
          }
        }
      }
    }
  }

  return {
    isDirect: false,
    isPartial: false,
    violatesBound: false,
    reasoning: `No direct or relational evidence found for ${reqNode.canonicalName}.`,
  };
}

export interface NonEquivalenceRule {
  targetRequirement: string;
  incompatibleEvidence: string;
  reason: string;
}

export const NON_EQUIVALENCE_RULES: NonEquivalenceRule[] = [
  {
    targetRequirement: 'Next.js',
    incompatibleEvidence: 'React',
    reason: 'React client component experience does not prove Next.js SSR, SSG, Server Actions, or App Router architecture mastery.',
  },
  {
    targetRequirement: 'FastAPI',
    incompatibleEvidence: 'Python',
    reason: 'General Python language familiarity does not prove async FastAPI framework engineering (Pydantic validation, async dependency injection).',
  },
  {
    targetRequirement: 'AWS',
    incompatibleEvidence: 'Cloud',
    reason: 'Generic cloud familiarity does not prove hands-on AWS service expertise (IAM, ECS, Lambda, CloudWatch, VPC).',
  },
  {
    targetRequirement: 'PostgreSQL',
    incompatibleEvidence: 'MySQL',
    reason: 'MySQL database experience does not substitute for PostgreSQL-specific advanced indexing, JSONB operators, or window aggregate mechanics.',
  },
  {
    targetRequirement: 'Kubernetes',
    incompatibleEvidence: 'Docker',
    reason: 'Basic Docker containerization does not satisfy multi-node Kubernetes cluster orchestration, Helm charts, or Ingress architecture.',
  },
  {
    targetRequirement: 'TypeScript',
    incompatibleEvidence: 'JavaScript',
    reason: 'Dynamically typed JavaScript does not satisfy strict compile-time TypeScript type system, generics, and interface contracts.',
  },
  {
    targetRequirement: 'Production ML Engineering',
    incompatibleEvidence: 'Machine Learning',
    reason: 'Theoretical or notebook machine learning does not satisfy production low-latency model serving, monitoring, and inference pipelines.',
  },
  {
    targetRequirement: 'RAG Architecture Ownership',
    incompatibleEvidence: 'RAG',
    reason: 'Simple LLM wrapper API calls do not satisfy custom chunking, vector indexing, reranking, and retrieval evaluation architecture.',
  },
];

/**
 * Validates whether candidate evidence violates explicit non-equivalence boundaries.
 */
export function checkNonEquivalence(
  targetRequirement: string,
  candidateEvidence: string
): { isViolated: boolean; reason?: string } {
  const lowerReq = targetRequirement.toLowerCase();
  const lowerEvidence = candidateEvidence.toLowerCase();

  for (const rule of NON_EQUIVALENCE_RULES) {
    if (lowerReq.includes(rule.targetRequirement.toLowerCase())) {
      const hasTarget = lowerEvidence.includes(rule.targetRequirement.toLowerCase());
      const hasIncompatible = new RegExp(`\\b${rule.incompatibleEvidence.toLowerCase()}\\b`, 'i').test(lowerEvidence);

      if (hasIncompatible && !hasTarget) {
        return { isViolated: true, reason: rule.reason };
      }
    }
  }

  return { isViolated: false };
}

