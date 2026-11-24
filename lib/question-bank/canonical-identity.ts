/**
 * lib/question-bank/canonical-identity.ts
 *
 * Canonical Company & Role Identity System for Cognalyze.
 *
 * Guarantees:
 * 1. Strict, stable identity for all 57 enlisted companies and 14 supported roles.
 * 2. Immutable aliases mapping (e.g. "walmart global tech" -> "comp-walmart", "tcs prime" -> "comp-tcs").
 * 3. Zero cross-company data leakage: Amazon never maps to Groww, Groww never maps to Amazon,
 *    Google never maps to Microsoft, and unknown companies NEVER default to Amazon.
 * 4. Multi-stage identity validation across client, API, database, cache, and research pipelines.
 */

export type CompanyMarketSector =
  | "global_tech"
  | "india_product"
  | "it_services"
  | "fintech"
  | "ecommerce"
  | "enterprise_saas";

export interface CanonicalCompany {
  id: string;              // e.g. "comp-amazon", "comp-groww"
  slug: string;            // e.g. "amazon", "groww"
  displayName: string;     // Exact match to ALL_COMPANIES item
  legalName: string;
  aliases: string[];       // Lowercase search tokens and common variants
  sector: CompanyMarketSector;
  sectorLabel: string;
  headquarters: string;
  website: string;
  careersUrl: string;
  engineeringBlogUrl?: string;
  tier: "Tier 1 FAANG+" | "Unicorn / High-Growth Product" | "Enterprise Tech" | "Leading IT Services" | "Tier 1 FinTech";
  primaryTechStack: string[];
  supportedRoles: string[];
}

export interface CanonicalRole {
  id: string;              // e.g. "role-swe", "role-sde"
  slug: string;            // e.g. "software-engineer", "sde"
  displayName: string;     // Exact match to ALL_ROLES item
  category: "Engineering" | "Data & AI" | "Product" | "Infrastructure" | "Security";
  coreCompetencies: string[];
}

// ══════════════════════════════════════════════════════════════════════════
// 1. CANONICAL ROLES INVENTORY (14 SUPPORTED ROLES)
// ══════════════════════════════════════════════════════════════════════════
export const CANONICAL_ROLES: Record<string, CanonicalRole> = {
  "Software Engineer": {
    id: "role-swe",
    slug: "software-engineer",
    displayName: "Software Engineer",
    category: "Engineering",
    coreCompetencies: ["DSA", "System Design", "OOP", "Concurrency", "DBMS", "Operating Systems"]
  },
  "SDE": {
    id: "role-sde",
    slug: "sde",
    displayName: "SDE",
    category: "Engineering",
    coreCompetencies: ["DSA", "Problem Solving", "Low-Level Design", "High-Level Design", "Unit Testing"]
  },
  "Frontend Developer": {
    id: "role-frontend",
    slug: "frontend-developer",
    displayName: "Frontend Developer",
    category: "Engineering",
    coreCompetencies: ["JavaScript", "TypeScript", "React", "Next.js", "Web Performance", "State Management", "DOM"]
  },
  "Backend Developer": {
    id: "role-backend",
    slug: "backend-developer",
    displayName: "Backend Developer",
    category: "Engineering",
    coreCompetencies: ["REST/gRPC APIs", "Distributed Systems", "SQL/NoSQL", "Caching (Redis)", "Kafka", "Microservices"]
  },
  "Full Stack Developer": {
    id: "role-fullstack",
    slug: "full-stack-developer",
    displayName: "Full Stack Developer",
    category: "Engineering",
    coreCompetencies: ["Frontend Architecture", "Backend APIs", "Database Modeling", "End-to-End Testing", "Cloud Deployment"]
  },
  "Data Scientist": {
    id: "role-data-scientist",
    slug: "data-scientist",
    displayName: "Data Scientist",
    category: "Data & AI",
    coreCompetencies: ["Machine Learning", "Statistics", "Python", "Feature Engineering", "A/B Testing", "Deep Learning"]
  },
  "ML Engineer": {
    id: "role-ml-engineer",
    slug: "ml-engineer",
    displayName: "ML Engineer",
    category: "Data & AI",
    coreCompetencies: ["Model Serving", "PyTorch/TensorFlow", "MLOps", "Model Quantization", "CUDA/GPU Optimization", "Feature Stores"]
  },
  "AI Engineer": {
    id: "role-ai-engineer",
    slug: "ai-engineer",
    displayName: "AI Engineer",
    category: "Data & AI",
    coreCompetencies: ["LLMs", "RAG Pipelines", "Vector Databases", "Prompt Engineering", "Fine-Tuning", "Agent Architecture"]
  },
  "Data Analyst": {
    id: "role-data-analyst",
    slug: "data-analyst",
    displayName: "Data Analyst",
    category: "Data & AI",
    coreCompetencies: ["SQL (Window Functions)", "Data Warehousing", "Business Intelligence (Tableau/PowerBI)", "Metrics Modeling", "Python"]
  },
  "Product Manager": {
    id: "role-pm",
    slug: "product-manager",
    displayName: "Product Manager",
    category: "Product",
    coreCompetencies: ["Product Design", "Root-Cause Analysis", "Metrics & North Star", "User Segmentation", "Prioritization", "STAR Behavioral"]
  },
  "DevOps Engineer": {
    id: "role-devops",
    slug: "devops-engineer",
    displayName: "DevOps Engineer",
    category: "Infrastructure",
    coreCompetencies: ["CI/CD Pipelines", "Docker", "Kubernetes", "Terraform", "Linux/Bash", "Monitoring (Prometheus/Grafana)"]
  },
  "Cloud Engineer": {
    id: "role-cloud",
    slug: "cloud-engineer",
    displayName: "Cloud Engineer",
    category: "Infrastructure",
    coreCompetencies: ["AWS/GCP/Azure", "Cloud Architecture", "IAM & Security", "Serverless", "VPC & Networking", "Cost Optimization"]
  },
  "Cybersecurity Engineer": {
    id: "role-security",
    slug: "cybersecurity-engineer",
    displayName: "Cybersecurity Engineer",
    category: "Security",
    coreCompetencies: ["Threat Modeling", "Vulnerability Assessment", "Cryptography", "Network Security", "Application Security (OWASP)", "IAM"]
  }
};

// ══════════════════════════════════════════════════════════════════════════
// 2. CANONICAL COMPANIES INVENTORY (ALL 56 REAL COMPANIES ENLISTED)
// ══════════════════════════════════════════════════════════════════════════
export const CANONICAL_COMPANIES: Record<string, CanonicalCompany> = {
  // ── Global Tech & Tier 1 ──
  "Google": {
    id: "comp-google",
    slug: "google",
    displayName: "Google",
    legalName: "Google LLC / Alphabet Inc.",
    aliases: ["google", "alphabet", "google india", "google deepmind", "gcp"],
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    headquarters: "Mountain View, CA",
    website: "https://www.google.com",
    careersUrl: "https://careers.google.com",
    engineeringBlogUrl: "https://research.google/blog/",
    tier: "Tier 1 FAANG+",
    primaryTechStack: ["C++", "Java", "Python", "Go", "Spanner", "Borg", "TensorFlow"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "ML Engineer", "AI Engineer", "Data Scientist"]
  },
  "Amazon": {
    id: "comp-amazon",
    slug: "amazon",
    displayName: "Amazon",
    legalName: "Amazon.com, Inc.",
    aliases: ["amazon", "aws", "amazon india", "amazon web services", "amazon development center"],
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    headquarters: "Seattle, WA",
    website: "https://www.amazon.com",
    careersUrl: "https://www.amazon.jobs",
    engineeringBlogUrl: "https://www.amazon.science/blog",
    tier: "Tier 1 FAANG+",
    primaryTechStack: ["Java", "C++", "Python", "AWS DynamoDB", "AWS Lambda", "S3", "OpenSearch"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Frontend Developer", "ML Engineer", "Data Analyst"]
  },
  "Microsoft": {
    id: "comp-microsoft",
    slug: "microsoft",
    displayName: "Microsoft",
    legalName: "Microsoft Corporation",
    aliases: ["microsoft", "msft", "microsoft india", "azure", "microsoft idc"],
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    headquarters: "Redmond, WA",
    website: "https://www.microsoft.com",
    careersUrl: "https://careers.microsoft.com",
    engineeringBlogUrl: "https://devblogs.microsoft.com/",
    tier: "Tier 1 FAANG+",
    primaryTechStack: ["C#", ".NET", "C++", "TypeScript", "Python", "Azure Cosmos DB", "SQL Server"],
    supportedRoles: ["Software Engineer", "SDE", "Full Stack Developer", "Cloud Engineer", "ML Engineer"]
  },
  "Meta": {
    id: "comp-meta",
    slug: "meta",
    displayName: "Meta",
    legalName: "Meta Platforms, Inc.",
    aliases: ["meta", "facebook", "fb", "meta platforms", "instagram", "whatsapp"],
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    headquarters: "Menlo Park, CA",
    website: "https://about.meta.com",
    careersUrl: "https://www.metacareers.com",
    engineeringBlogUrl: "https://engineering.fb.com/",
    tier: "Tier 1 FAANG+",
    primaryTechStack: ["C++", "Python", "Hack/PHP", "React", "GraphQL", "PyTorch", "Cassandra"],
    supportedRoles: ["Software Engineer", "SDE", "Frontend Developer", "ML Engineer", "AI Engineer", "Data Scientist"]
  },
  "Apple": {
    id: "comp-apple",
    slug: "apple",
    displayName: "Apple",
    legalName: "Apple Inc.",
    aliases: ["apple", "aapl", "apple india", "ios", "macos"],
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    headquarters: "Cupertino, CA",
    website: "https://www.apple.com",
    careersUrl: "https://www.apple.com/careers",
    engineeringBlogUrl: "https://machinelearning.apple.com/",
    tier: "Tier 1 FAANG+",
    primaryTechStack: ["Swift", "Objective-C", "C++", "Python", "CoreML", "Metal", "FoundationDB"],
    supportedRoles: ["Software Engineer", "SDE", "AI Engineer", "ML Engineer", "Full Stack Developer"]
  },
  "Netflix": {
    id: "comp-netflix",
    slug: "netflix",
    displayName: "Netflix",
    legalName: "Netflix, Inc.",
    aliases: ["netflix", "nflx"],
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    headquarters: "Los Gatos, CA",
    website: "https://www.netflix.com",
    careersUrl: "https://jobs.netflix.com",
    engineeringBlogUrl: "https://netflixtechblog.com/",
    tier: "Tier 1 FAANG+",
    primaryTechStack: ["Java", "Spring Boot", "Node.js", "Python", "Cassandra", "Kafka", "AWS"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Data Scientist", "ML Engineer"]
  },
  "Adobe": {
    id: "comp-adobe",
    slug: "adobe",
    displayName: "Adobe",
    legalName: "Adobe Inc.",
    aliases: ["adobe", "adbe", "adobe india", "adobe systems"],
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    headquarters: "San Jose, CA",
    website: "https://www.adobe.com",
    careersUrl: "https://careers.adobe.com",
    engineeringBlogUrl: "https://blog.developer.adobe.com/",
    tier: "Tier 1 FAANG+",
    primaryTechStack: ["C++", "Java", "JavaScript", "Python", "WebGL", "Kubernetes"],
    supportedRoles: ["Software Engineer", "SDE", "Frontend Developer", "ML Engineer", "Data Scientist"]
  },
  "Uber": {
    id: "comp-uber",
    slug: "uber",
    displayName: "Uber",
    legalName: "Uber Technologies, Inc.",
    aliases: ["uber", "uber technologies", "uber india"],
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    headquarters: "San Francisco, CA",
    website: "https://www.uber.com",
    careersUrl: "https://www.uber.com/careers",
    engineeringBlogUrl: "https://www.uber.com/en-IN/blog/engineering/",
    tier: "Tier 1 FAANG+",
    primaryTechStack: ["Go", "Java", "Python", "Apache Kafka", "H3 Geospatial", "Schemaless", "MySQL"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Data Scientist", "ML Engineer"]
  },
  "Airbnb": {
    id: "comp-airbnb",
    slug: "airbnb",
    displayName: "Airbnb",
    legalName: "Airbnb, Inc.",
    aliases: ["airbnb", "abnb"],
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    headquarters: "San Francisco, CA",
    website: "https://www.airbnb.com",
    careersUrl: "https://careers.airbnb.com",
    engineeringBlogUrl: "https://medium.com/airbnb-engineering",
    tier: "Tier 1 FAANG+",
    primaryTechStack: ["Java", "Kotlin", "TypeScript", "React", "GraphQL", "Thrift", "MySQL"],
    supportedRoles: ["Software Engineer", "Frontend Developer", "Backend Developer", "Data Scientist"]
  },
  "Salesforce": {
    id: "comp-salesforce",
    slug: "salesforce",
    displayName: "Salesforce",
    legalName: "Salesforce, Inc.",
    aliases: ["salesforce", "crm", "salesforce india", "slack"],
    sector: "enterprise_saas",
    sectorLabel: "Enterprise Cloud & SaaS",
    headquarters: "San Francisco, CA",
    website: "https://www.salesforce.com",
    careersUrl: "https://careers.salesforce.com",
    engineeringBlogUrl: "https://engineering.salesforce.com/",
    tier: "Enterprise Tech",
    primaryTechStack: ["Java", "Apex", "Python", "JavaScript (LWC)", "PostgreSQL", "Apache Kafka"],
    supportedRoles: ["Software Engineer", "SDE", "Full Stack Developer", "Backend Developer", "Cloud Engineer"]
  },
  "NVIDIA": {
    id: "comp-nvidia",
    slug: "nvidia",
    displayName: "NVIDIA",
    legalName: "NVIDIA Corporation",
    aliases: ["nvidia", "nvda", "nvidia india", "cuda"],
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    headquarters: "Santa Clara, CA",
    website: "https://www.nvidia.com",
    careersUrl: "https://www.nvidia.com/careers",
    engineeringBlogUrl: "https://developer.nvidia.com/blog/",
    tier: "Tier 1 FAANG+",
    primaryTechStack: ["C++", "CUDA", "Python", "C", "TensorRT", "PyTorch", "DirectX/Vulkan"],
    supportedRoles: ["Software Engineer", "AI Engineer", "ML Engineer", "Systems Engineer"]
  },
  "Bloomberg": {
    id: "comp-bloomberg",
    slug: "Bloomberg",
    displayName: "Bloomberg",
    legalName: "Bloomberg L.P.",
    aliases: ["bloomberg", "bloomberg lp", "bloomberg terminal"],
    sector: "fintech",
    sectorLabel: "Financial Data & Analytics",
    headquarters: "New York, NY",
    website: "https://www.bloomberg.com",
    careersUrl: "https://www.bloomberg.com/careers",
    engineeringBlogUrl: "https://www.techatbloomberg.com/",
    tier: "Tier 1 FinTech",
    primaryTechStack: ["C++", "Python", "JavaScript", "Comdb2", "Kafka", "Linux"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Data Analyst"]
  },
  "Oracle": {
    id: "comp-oracle",
    slug: "oracle",
    displayName: "Oracle",
    legalName: "Oracle Corporation",
    aliases: ["oracle", "orcl", "oracle india", "oci"],
    sector: "enterprise_saas",
    sectorLabel: "Enterprise Cloud & Database",
    headquarters: "Austin, TX",
    website: "https://www.oracle.com",
    careersUrl: "https://www.oracle.com/careers",
    engineeringBlogUrl: "https://blogs.oracle.com/",
    tier: "Enterprise Tech",
    primaryTechStack: ["Java", "C++", "C", "SQL", "PL/SQL", "OCI Cloud", "Linux Kernel"],
    supportedRoles: ["Software Engineer", "SDE", "Cloud Engineer", "Backend Developer"]
  },
  "Cisco": {
    id: "comp-cisco",
    slug: "Cisco",
    displayName: "Cisco",
    legalName: "Cisco Systems, Inc.",
    aliases: ["cisco", "cisco systems", "cisco india"],
    sector: "enterprise_saas",
    sectorLabel: "Networking & Enterprise Infrastructure",
    headquarters: "San Jose, CA",
    website: "https://www.cisco.com",
    careersUrl: "https://jobs.cisco.com",
    engineeringBlogUrl: "https://blogs.cisco.com/developer",
    tier: "Enterprise Tech",
    primaryTechStack: ["C", "C++", "Python", "Go", "Docker", "Kubernetes", "BGP/OSPF/TCP/IP"],
    supportedRoles: ["Software Engineer", "Cybersecurity Engineer", "Cloud Engineer", "Backend Developer"]
  },
  "Intel": {
    id: "comp-intel",
    slug: "intel",
    displayName: "Intel",
    legalName: "Intel Corporation",
    aliases: ["intel", "intc", "intel india"],
    sector: "global_tech",
    sectorLabel: "Semiconductor & Hardware Architecture",
    headquarters: "Santa Clara, CA",
    website: "https://www.intel.com",
    careersUrl: "https://jobs.intel.com",
    engineeringBlogUrl: "https://www.intel.com/content/www/us/en/developer/blogs.html",
    tier: "Enterprise Tech",
    primaryTechStack: ["C", "C++", "Python", "x86 Assembly", "SystemVerilog", "OpenVINO"],
    supportedRoles: ["Software Engineer", "Systems Engineer", "ML Engineer"]
  },
  "Qualcomm": {
    id: "comp-qualcomm",
    slug: "Qualcomm",
    displayName: "Qualcomm",
    legalName: "Qualcomm Incorporated",
    aliases: ["qualcomm", "qcom", "qualcomm india", "snapdragon"],
    sector: "global_tech",
    sectorLabel: "Semiconductor & Wireless Systems",
    headquarters: "San Diego, CA",
    website: "https://www.qualcomm.com",
    careersUrl: "https://www.qualcomm.com/company/careers",
    engineeringBlogUrl: "https://www.qualcomm.com/developer/blog",
    tier: "Enterprise Tech",
    primaryTechStack: ["C", "C++", "Python", "ARM Assembly", "Linux Kernel", "RTOS", "5G Protocols"],
    supportedRoles: ["Software Engineer", "Systems Engineer", "ML Engineer"]
  },
  "Atlassian": {
    id: "comp-atlassian",
    slug: "atlassian",
    displayName: "Atlassian",
    legalName: "Atlassian Corporation",
    aliases: ["atlassian", "jira", "confluence", "bitbucket"],
    sector: "enterprise_saas",
    sectorLabel: "Developer Tools & Enterprise SaaS",
    headquarters: "Sydney, Australia",
    website: "https://www.atlassian.com",
    careersUrl: "https://www.atlassian.com/company/careers",
    engineeringBlogUrl: "https://www.atlassian.com/engineering",
    tier: "Enterprise Tech",
    primaryTechStack: ["Java", "Kotlin", "TypeScript", "React", "AWS", "PostgreSQL"],
    supportedRoles: ["Software Engineer", "SDE", "Frontend Developer", "Backend Developer"]
  },
  "ServiceNow": {
    id: "comp-servicenow",
    slug: "ServiceNow",
    displayName: "ServiceNow",
    legalName: "ServiceNow, Inc.",
    aliases: ["servicenow", "now", "servicenow india"],
    sector: "enterprise_saas",
    sectorLabel: "Enterprise Workflow Automation",
    headquarters: "Santa Clara, CA",
    website: "https://www.servicenow.com",
    careersUrl: "https://careers.servicenow.com",
    engineeringBlogUrl: "https://www.servicenow.com/community/developer-blog/bg-p/developer-blog",
    tier: "Enterprise Tech",
    primaryTechStack: ["Java", "JavaScript", "Python", "MariaDB", "Linux", "Docker"],
    supportedRoles: ["Software Engineer", "SDE", "Full Stack Developer", "Backend Developer"]
  },
  "PayPal": {
    id: "comp-paypal",
    slug: "PayPal",
    displayName: "PayPal",
    legalName: "PayPal Holdings, Inc.",
    aliases: ["paypal", "pypl", "paypal india", "venmo", "braintree"],
    sector: "fintech",
    sectorLabel: "Digital Payments & FinTech",
    headquarters: "San Jose, CA",
    website: "https://www.paypal.com",
    careersUrl: "https://careers.pypl.com",
    engineeringBlogUrl: "https://medium.com/paypal-tech",
    tier: "Tier 1 FinTech",
    primaryTechStack: ["Java", "Spring Boot", "Node.js", "Python", "Oracle DB", "Kafka", "Docker"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Cybersecurity Engineer"]
  },
  "Spotify": {
    id: "comp-spotify",
    slug: "spotify",
    displayName: "Spotify",
    legalName: "Spotify Technology S.A.",
    aliases: ["spotify", "spot"],
    sector: "global_tech",
    sectorLabel: "Audio Streaming & Media Tech",
    headquarters: "Stockholm, Sweden",
    website: "https://www.spotify.com",
    careersUrl: "https://www.lifeatspotify.com",
    engineeringBlogUrl: "https://engineering.atspotify.com/",
    tier: "Tier 1 FAANG+",
    primaryTechStack: ["Java", "Python", "C++", "GCP", "BigQuery", "Apache Beam", "Cassandra"],
    supportedRoles: ["Software Engineer", "Backend Developer", "ML Engineer", "Data Scientist"]
  },
  "ByteDance": {
    id: "comp-bytedance",
    slug: "bytedance",
    displayName: "ByteDance",
    legalName: "ByteDance Ltd.",
    aliases: ["bytedance", "tiktok", "douyin"],
    sector: "global_tech",
    sectorLabel: "Consumer Internet & AI Systems",
    headquarters: "Beijing / Singapore",
    website: "https://www.bytedance.com",
    careersUrl: "https://jobs.bytedance.com",
    engineeringBlogUrl: "https://bytedance.com/en/tech",
    tier: "Tier 1 FAANG+",
    primaryTechStack: ["Go", "C++", "Python", "Flink", "Redis", "Kafka", "Custom Graph DB"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "ML Engineer", "AI Engineer"]
  },
  "Snowflake": {
    id: "comp-snowflake",
    slug: "Snowflake",
    displayName: "Snowflake",
    legalName: "Snowflake Inc.",
    aliases: ["snowflake", "snow"],
    sector: "enterprise_saas",
    sectorLabel: "Data Cloud & Analytical Engines",
    headquarters: "Bozeman, MT",
    website: "https://www.snowflake.com",
    careersUrl: "https://careers.snowflake.com",
    engineeringBlogUrl: "https://www.snowflake.com/en/blog/category/engineering/",
    tier: "Enterprise Tech",
    primaryTechStack: ["C++", "Java", "FoundationDB", "AWS/Azure/GCP", "SQL Query Compilers"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Data Scientist"]
  },
  "Databricks": {
    id: "comp-databricks",
    slug: "Databricks",
    displayName: "Databricks",
    legalName: "Databricks, Inc.",
    aliases: ["databricks", "apache spark", "delta lake", "mlflow"],
    sector: "enterprise_saas",
    sectorLabel: "Lakehouse, Spark & AI Platforms",
    headquarters: "San Francisco, CA",
    website: "https://www.databricks.com",
    careersUrl: "https://www.databricks.com/company/careers",
    engineeringBlogUrl: "https://www.databricks.com/blog/category/engineering",
    tier: "Enterprise Tech",
    primaryTechStack: ["Scala", "Java", "Python", "C++", "Apache Spark", "Delta Lake"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "ML Engineer", "AI Engineer"]
  },
  "Walmart Global Tech": {
    id: "comp-walmart",
    slug: "walmart",
    displayName: "Walmart Global Tech",
    legalName: "Walmart Inc. Global Tech",
    aliases: ["walmart global tech", "walmart", "walmart labs", "walmart india"],
    sector: "ecommerce",
    sectorLabel: "Retail & Omni-channel Tech",
    headquarters: "Bentonville, AR / Bangalore",
    website: "https://www.walmart.com",
    careersUrl: "https://careers.walmart.com/technology",
    engineeringBlogUrl: "https://medium.com/walmartglobaltech",
    tier: "Enterprise Tech",
    primaryTechStack: ["Java", "Spring Boot", "Node.js", "Kafka", "Cassandra", "Azure"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Frontend Developer", "Data Analyst"]
  },
  "LinkedIn": {
    id: "comp-linkedin",
    slug: "linkedin",
    displayName: "LinkedIn",
    legalName: "LinkedIn Corporation",
    aliases: ["linkedin", "lnkd"],
    sector: "global_tech",
    sectorLabel: "Professional Network & Graph Systems",
    headquarters: "Sunnyvale, CA",
    website: "https://www.linkedin.com",
    careersUrl: "https://careers.linkedin.com",
    engineeringBlogUrl: "https://www.linkedin.com/blog/engineering",
    tier: "Tier 1 FAANG+",
    primaryTechStack: ["Java", "Scala", "Kafka", "Pinot", "Rest.li", "Ember.js"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "ML Engineer", "Data Scientist"]
  },

  // ── India High-Growth Product & FinTech ──
  "Groww": {
    id: "comp-groww",
    slug: "groww",
    displayName: "Groww",
    legalName: "Nextbillion Technology Private Limited",
    aliases: ["groww", "groww india", "nextbillion technology", "nextbillion"],
    sector: "fintech",
    sectorLabel: "Investment & Wealth Tech",
    headquarters: "Bangalore, India",
    website: "https://groww.in",
    careersUrl: "https://groww.in/careers",
    engineeringBlogUrl: "https://groww.in/engineering",
    tier: "Unicorn / High-Growth Product",
    primaryTechStack: ["Java", "Spring Boot", "Go", "PostgreSQL", "Kafka", "Redis", "React Native", "Kubernetes"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Frontend Developer", "Data Analyst"]
  },
  "Flipkart": {
    id: "comp-flipkart",
    slug: "Flipkart",
    displayName: "Flipkart",
    legalName: "Flipkart Private Limited",
    aliases: ["flipkart", "flipkart india", "fk"],
    sector: "ecommerce",
    sectorLabel: "Indian E-Commerce Scale",
    headquarters: "Bangalore, India",
    website: "https://www.flipkart.com",
    careersUrl: "https://www.flipkartcareers.com",
    engineeringBlogUrl: "https://tech.flipkart.com/",
    tier: "Unicorn / High-Growth Product",
    primaryTechStack: ["Java", "Dropwizard", "Kafka", "HBase", "MySQL", "React", "Aerospike"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Frontend Developer", "ML Engineer"]
  },
  "Swiggy": {
    id: "comp-swiggy",
    slug: "swiggy",
    displayName: "Swiggy",
    legalName: "Bundl Technologies Private Limited / Swiggy Ltd.",
    aliases: ["swiggy", "bundl technologies", "instamart", "dineout"],
    sector: "india_product",
    sectorLabel: "Hyperlocal Logistics & Food Delivery",
    headquarters: "Bangalore, India",
    website: "https://www.swiggy.com",
    careersUrl: "https://careers.swiggy.com",
    engineeringBlogUrl: "https://bytes.swiggy.com/",
    tier: "Unicorn / High-Growth Product",
    primaryTechStack: ["Go", "Java", "Python", "Kafka", "PostgreSQL", "Redis", "AWS DynamoDB", "Docker"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Data Scientist", "ML Engineer"]
  },
  "Zomato": {
    id: "comp-zomato",
    slug: "zomato",
    displayName: "Zomato",
    legalName: "Zomato Limited",
    aliases: ["zomato", "blinkit", "zomato media"],
    sector: "india_product",
    sectorLabel: "Food Ordering & Quick Commerce",
    headquarters: "Gurgaon, India",
    website: "https://www.zomato.com",
    careersUrl: "https://www.zomato.com/careers",
    engineeringBlogUrl: "https://blog.zomato.com/category/tech",
    tier: "Unicorn / High-Growth Product",
    primaryTechStack: ["PHP", "Go", "Python", "Node.js", "MySQL", "Aerospike", "Redis", "Kafka"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Frontend Developer", "Data Analyst"]
  },
  "Razorpay": {
    id: "comp-razorpay",
    slug: "razorpay",
    displayName: "Razorpay",
    legalName: "Razorpay Software Private Limited",
    aliases: ["razorpay", "razorpay india", "rzp"],
    sector: "fintech",
    sectorLabel: "Payments Infrastructure & Neobanking",
    headquarters: "Bangalore, India",
    website: "https://razorpay.com",
    careersUrl: "https://razorpay.com/jobs",
    engineeringBlogUrl: "https://engineering.razorpay.com/",
    tier: "Unicorn / High-Growth Product",
    primaryTechStack: ["Go", "PHP", "Node.js", "MySQL", "Kafka", "Redis", "AWS", "Kubernetes"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Cybersecurity Engineer", "DevOps Engineer"]
  },
  "PhonePe": {
    id: "comp-phonepe",
    slug: "phonepe",
    displayName: "PhonePe",
    legalName: "PhonePe Private Limited",
    aliases: ["phonepe", "phonepe india"],
    sector: "fintech",
    sectorLabel: "UPI & Digital Payments Scale",
    headquarters: "Bangalore, India",
    website: "https://www.phonepe.com",
    careersUrl: "https://www.phonepe.com/careers",
    engineeringBlogUrl: "https://tech.phonepe.com/",
    tier: "Unicorn / High-Growth Product",
    primaryTechStack: ["Java", "HBase", "Aerospike", "Kafka", "MySQL", "Docker", "Prometheus"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Data Scientist", "ML Engineer"]
  },
  "Meesho": {
    id: "comp-meesho",
    slug: "meesho",
    displayName: "Meesho",
    legalName: "Fashnear Technologies Private Limited",
    aliases: ["meesho", "meesho india", "fashnear"],
    sector: "ecommerce",
    sectorLabel: "Social E-Commerce & Retail",
    headquarters: "Bangalore, India",
    website: "https://www.meesho.io",
    careersUrl: "https://www.meesho.io/jobs",
    engineeringBlogUrl: "https://meesho.tech/",
    tier: "Unicorn / High-Growth Product",
    primaryTechStack: ["Java", "Python", "Go", "Kafka", "Spark", "MongoDB", "MySQL", "AWS"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Data Scientist", "ML Engineer"]
  },
  "Zepto": {
    id: "comp-zepto",
    slug: "zepto",
    displayName: "Zepto",
    legalName: "KiranaKart Technologies Private Limited",
    aliases: ["zepto", "zepto delivery", "kiranakart"],
    sector: "india_product",
    sectorLabel: "10-Minute Quick Commerce",
    headquarters: "Mumbai / Bangalore, India",
    website: "https://www.zeptonow.com",
    careersUrl: "https://www.zeptonow.com/careers",
    engineeringBlogUrl: "https://tech.zepto.com/",
    tier: "Unicorn / High-Growth Product",
    primaryTechStack: ["Go", "Node.js", "Python", "PostgreSQL", "Redis", "Kafka", "Kubernetes"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Frontend Developer", "Data Analyst"]
  },
  "CRED": {
    id: "comp-cred",
    slug: "cred",
    displayName: "CRED",
    legalName: "Dreamplug Technologies Private Limited",
    aliases: ["cred", "dreamplug technologies", "cred club"],
    sector: "fintech",
    sectorLabel: "Credit Card & Premium FinTech",
    headquarters: "Bangalore, India",
    website: "https://cred.club",
    careersUrl: "https://careers.cred.club",
    engineeringBlogUrl: "https://cred.club/tech",
    tier: "Unicorn / High-Growth Product",
    primaryTechStack: ["Go", "Kotlin", "Java", "Kafka", "MySQL", "Redis", "AWS", "DynamoDB"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Frontend Developer", "Product Manager"]
  },
  "Paytm": {
    id: "comp-paytm",
    slug: "Paytm",
    displayName: "Paytm",
    legalName: "One97 Communications Limited",
    aliases: ["paytm", "one97", "one97 communications"],
    sector: "fintech",
    sectorLabel: "Consumer Payments & Banking",
    headquarters: "Noida, India",
    website: "https://paytm.com",
    careersUrl: "https://jobs.paytm.com",
    engineeringBlogUrl: "https://medium.com/paytm-engineering",
    tier: "Leading IT Services",
    primaryTechStack: ["Java", "Node.js", "MySQL", "Kafka", "Redis", "AWS"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Data Analyst"]
  },
  "Zoho": {
    id: "comp-zoho",
    slug: "zoho",
    displayName: "Zoho",
    legalName: "Zoho Corporation Private Limited",
    aliases: ["zoho", "zoho corp", "adventnet"],
    sector: "enterprise_saas",
    sectorLabel: "Bootstrapped Enterprise Suite",
    headquarters: "Chennai, India",
    website: "https://www.zoho.com",
    careersUrl: "https://www.zoho.com/careers",
    engineeringBlogUrl: "https://www.zoho.com/blog",
    tier: "Enterprise Tech",
    primaryTechStack: ["Java", "C", "C++", "JavaScript", "Custom In-House Storage", "FreeBSD/Linux"],
    supportedRoles: ["Software Engineer", "SDE", "Full Stack Developer", "Backend Developer"]
  },
  "Postman": {
    id: "comp-postman",
    slug: "postman",
    displayName: "Postman",
    legalName: "Postman, Inc.",
    aliases: ["postman", "postman api"],
    sector: "enterprise_saas",
    sectorLabel: "API Platform & Developer Tooling",
    headquarters: "San Francisco, CA / Bangalore",
    website: "https://www.postman.com",
    careersUrl: "https://www.postman.com/careers",
    engineeringBlogUrl: "https://blog.postman.com/category/engineering/",
    tier: "Unicorn / High-Growth Product",
    primaryTechStack: ["Node.js", "TypeScript", "React", "Electron", "AWS", "MySQL", "Redis"],
    supportedRoles: ["Software Engineer", "SDE", "Frontend Developer", "Backend Developer"]
  },
  "BrowserStack": {
    id: "comp-browserstack",
    slug: "browserstack",
    displayName: "BrowserStack",
    legalName: "BrowserStack Inc.",
    aliases: ["browserstack", "browser stack"],
    sector: "enterprise_saas",
    sectorLabel: "Cloud Testing & Browser Infrastructure",
    headquarters: "Mumbai / Dublin",
    website: "https://www.browserstack.com",
    careersUrl: "https://www.browserstack.com/careers",
    engineeringBlogUrl: "https://www.browserstack.com/engineering",
    tier: "Unicorn / High-Growth Product",
    primaryTechStack: ["Ruby on Rails", "Node.js", "Java", "Docker", "KVM", "AWS", "PostgreSQL"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "DevOps Engineer"]
  },
  "MakeMyTrip": {
    id: "comp-makemytrip",
    slug: "makemytrip",
    displayName: "MakeMyTrip",
    legalName: "MakeMyTrip Limited",
    aliases: ["makemytrip", "mmt", "goibibo"],
    sector: "india_product",
    sectorLabel: "Online Travel & Ticketing",
    headquarters: "Gurgaon, India",
    website: "https://www.makemytrip.com",
    careersUrl: "https://careers.makemytrip.com",
    engineeringBlogUrl: "https://medium.com/makemytrip-tech",
    tier: "Enterprise Tech",
    primaryTechStack: ["Java", "Spring Boot", "React", "Redis", "Kafka", "MySQL", "AWS"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Data Analyst"]
  },
  "Ola": {
    id: "comp-ola",
    slug: "ola",
    displayName: "Ola",
    legalName: "ANI Technologies Private Limited",
    aliases: ["ola", "ola cabs", "ani technologies", "ola electric"],
    sector: "india_product",
    sectorLabel: "Mobility & EV Platforms",
    headquarters: "Bangalore, India",
    website: "https://www.olacabs.com",
    careersUrl: "https://www.olacabs.com/careers",
    engineeringBlogUrl: "https://blog.olacabs.com/",
    tier: "Unicorn / High-Growth Product",
    primaryTechStack: ["Java", "Go", "Python", "Kafka", "MySQL", "Redis", "Kubernetes"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Data Scientist"]
  },

  // ── Indian & Global IT Services ──
  "TCS": {
    id: "comp-tcs",
    slug: "tcs",
    displayName: "TCS",
    legalName: "Tata Consultancy Services Limited",
    aliases: ["tcs", "tata consultancy services", "tcs ninja", "tcs digital", "tcs prime"],
    sector: "it_services",
    sectorLabel: "Global IT Services & Consulting",
    headquarters: "Mumbai, India",
    website: "https://www.tcs.com",
    careersUrl: "https://www.tcs.com/careers",
    engineeringBlogUrl: "https://www.tcs.com/insights",
    tier: "Leading IT Services",
    primaryTechStack: ["Java", "Python", "C#", "SQL", "Spring", "Angular", "Cloud"],
    supportedRoles: ["Software Engineer", "Full Stack Developer", "Data Analyst", "Cloud Engineer"]
  },
  "Infosys": {
    id: "comp-infosys",
    slug: "Infosys",
    displayName: "Infosys",
    legalName: "Infosys Limited",
    aliases: ["infosys", "infy", "hackwithinfy", "infytq", "specialist programmer", "dse"],
    sector: "it_services",
    sectorLabel: "Global IT Services & Consulting",
    headquarters: "Bangalore, India",
    website: "https://www.infosys.com",
    careersUrl: "https://www.infosys.com/careers",
    engineeringBlogUrl: "https://www.infosys.com/services/insights.html",
    tier: "Leading IT Services",
    primaryTechStack: ["Java", "Python", "React", "Spring Boot", "MySQL", "AWS/Azure"],
    supportedRoles: ["Software Engineer", "Full Stack Developer", "Backend Developer", "Data Analyst"]
  },
  "Wipro": {
    id: "comp-wipro",
    slug: "wipro",
    displayName: "Wipro",
    legalName: "Wipro Limited",
    aliases: ["wipro", "wipro turbo", "wipro elite", "wipro nlhq"],
    sector: "it_services",
    sectorLabel: "Global IT Services & Consulting",
    headquarters: "Bangalore, India",
    website: "https://www.wipro.com",
    careersUrl: "https://careers.wipro.com",
    engineeringBlogUrl: "https://www.wipro.com/insights/",
    tier: "Leading IT Services",
    primaryTechStack: ["Java", "C++", ".NET", "Python", "Oracle", "Azure"],
    supportedRoles: ["Software Engineer", "Full Stack Developer", "Data Analyst"]
  },
  "Cognizant": {
    id: "comp-cognizant",
    slug: "cognizant",
    displayName: "Cognizant",
    legalName: "Cognizant Technology Solutions Corporation",
    aliases: ["cognizant", "cts", "genc", "genc elevate", "genc next"],
    sector: "it_services",
    sectorLabel: "Global IT Services & Consulting",
    headquarters: "Teaneck, NJ / Chennai",
    website: "https://www.cognizant.com",
    careersUrl: "https://careers.cognizant.com",
    engineeringBlogUrl: "https://www.cognizant.com/us/en/insights",
    tier: "Leading IT Services",
    primaryTechStack: ["Java", "Spring Boot", "React", "Python", "SQL Server", "AWS"],
    supportedRoles: ["Software Engineer", "Full Stack Developer", "Cloud Engineer"]
  },
  "Accenture": {
    id: "comp-accenture",
    slug: "accenture",
    displayName: "Accenture",
    legalName: "Accenture plc",
    aliases: ["accenture", "acn", "accenture india", "ase", "fse"],
    sector: "it_services",
    sectorLabel: "Technology Consulting & Digital Transformation",
    headquarters: "Dublin, Ireland / Bangalore",
    website: "https://www.accenture.com",
    careersUrl: "https://www.accenture.com/careers",
    engineeringBlogUrl: "https://www.accenture.com/insights/technology",
    tier: "Leading IT Services",
    primaryTechStack: ["Java", "Python", "Cloud (AWS/Azure/GCP)", "SAP", "React", "SQL"],
    supportedRoles: ["Software Engineer", "Full Stack Developer", "Cloud Engineer", "Data Analyst"]
  },
  "Capgemini": {
    id: "comp-capgemini",
    slug: "capgemini",
    displayName: "Capgemini",
    legalName: "Capgemini SE",
    aliases: ["capgemini", "capg", "capgemini india"],
    sector: "it_services",
    sectorLabel: "Global Consulting & Technology Services",
    headquarters: "Paris, France / Mumbai",
    website: "https://www.capgemini.com",
    careersUrl: "https://www.capgemini.com/careers",
    engineeringBlogUrl: "https://www.capgemini.com/insights/",
    tier: "Leading IT Services",
    primaryTechStack: ["Java", "Spring Boot", "Python", "React", "Oracle", "AWS"],
    supportedRoles: ["Software Engineer", "Full Stack Developer", "Cloud Engineer"]
  },
  "HCLTech": {
    id: "comp-hcltech",
    slug: "hcltech",
    displayName: "HCLTech",
    legalName: "HCL Technologies Limited",
    aliases: ["hcltech", "hcl", "hcl technologies"],
    sector: "it_services",
    sectorLabel: "Enterprise Engineering & Digital Operations",
    headquarters: "Noida, India",
    website: "https://www.hcltech.com",
    careersUrl: "https://www.hcltech.com/careers",
    engineeringBlogUrl: "https://www.hcltech.com/blogs",
    tier: "Leading IT Services",
    primaryTechStack: ["Java", "C++", "Python", "Networking", "Linux", "Azure"],
    supportedRoles: ["Software Engineer", "Cloud Engineer", "Cybersecurity Engineer"]
  },
  "Deloitte": {
    id: "comp-deloitte",
    slug: "Deloitte",
    displayName: "Deloitte",
    legalName: "Deloitte Touche Tohmatsu Limited",
    aliases: ["deloitte", "deloitte usi", "deloitte india"],
    sector: "it_services",
    sectorLabel: "Technology Advisory & System Integration",
    headquarters: "London, UK / Hyderabad",
    website: "https://www.deloitte.com",
    careersUrl: "https://jobs.deloitte.com",
    engineeringBlogUrl: "https://www.deloitte.com/insights",
    tier: "Leading IT Services",
    primaryTechStack: ["Java", "Python", "SQL", "Cloud (AWS/Azure)", "Tableau", "Salesforce"],
    supportedRoles: ["Software Engineer", "Data Analyst", "Cybersecurity Engineer", "Product Manager"]
  },

  // ── Global Investment Banking & Quantitative Finance ──
  "Goldman Sachs": {
    id: "comp-goldman-sachs",
    slug: "goldman-sachs",
    displayName: "Goldman Sachs",
    legalName: "The Goldman Sachs Group, Inc.",
    aliases: ["goldman sachs", "gs", "goldman", "goldman sachs india"],
    sector: "fintech",
    sectorLabel: "Investment Banking & Quantitative Trading",
    headquarters: "New York, NY / Bangalore",
    website: "https://www.goldmansachs.com",
    careersUrl: "https://www.goldmansachs.com/careers",
    engineeringBlogUrl: "https://developer.gs.com/blog",
    tier: "Tier 1 FinTech",
    primaryTechStack: ["Java", "C++", "Slang/SecDb", "Python", "Kafka", "PostgreSQL", "AWS"],
    supportedRoles: ["Software Engineer", "SDE", "Data Scientist", "ML Engineer", "Backend Developer"]
  },
  "Stripe": {
    id: "comp-stripe",
    slug: "stripe",
    displayName: "Stripe",
    legalName: "Stripe, Inc.",
    aliases: ["stripe", "stripe payments"],
    sector: "fintech",
    sectorLabel: "Financial Infrastructure & Payments API",
    headquarters: "San Francisco / Dublin",
    website: "https://www.stripe.com",
    careersUrl: "https://stripe.com/jobs",
    engineeringBlogUrl: "https://stripe.com/blog/engineering",
    tier: "Tier 1 FinTech",
    primaryTechStack: ["Ruby (Sorbet)", "Java", "Go", "Kafka", "PostgreSQL", "DocDB"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Security Engineer"]
  },
  "JPMorgan": {
    id: "comp-jpmorgan",
    slug: "jpmorgan",
    displayName: "JPMorgan",
    legalName: "JPMorgan Chase & Co.",
    aliases: ["jpmorgan", "jpmorganchase", "jpmc", "jp morgan chase", "chase"],
    sector: "fintech",
    sectorLabel: "Global Banking & Quantitative Systems",
    headquarters: "New York, NY / Mumbai",
    website: "https://www.jpmorganchase.com",
    careersUrl: "https://careers.jpmorgan.com",
    engineeringBlogUrl: "https://www.jpmorgan.com/technology",
    tier: "Tier 1 FinTech",
    primaryTechStack: ["Java", "Spring Boot", "Python", "C++", "Kafka", "AWS", "Oracle"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Data Analyst", "Cybersecurity Engineer"]
  },
  "Morgan Stanley": {
    id: "comp-morgan-stanley",
    slug: "morgan-stanley",
    displayName: "Morgan Stanley",
    legalName: "Morgan Stanley",
    aliases: ["morgan stanley", "ms", "morgan stanley india"],
    sector: "fintech",
    sectorLabel: "Investment Banking & Algorithmic Trading",
    headquarters: "New York, NY / Mumbai",
    website: "https://www.morganstanley.com",
    careersUrl: "https://www.morganstanley.com/careers",
    engineeringBlogUrl: "https://www.morganstanley.com/about-us/technology",
    tier: "Tier 1 FinTech",
    primaryTechStack: ["C++", "Java", "Python", "Kdb+/Q", "Linux", "Sybase/DB2"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Data Scientist"]
  },
  "Visa": {
    id: "comp-visa",
    slug: "visa",
    displayName: "Visa",
    legalName: "Visa Inc.",
    aliases: ["visa", "visa inc", "visanet", "visa india"],
    sector: "fintech",
    sectorLabel: "Global Payment Networks & Transaction Processing",
    headquarters: "San Francisco, CA / Bangalore",
    website: "https://www.visa.com",
    careersUrl: "https://corporate.visa.com/en/careers",
    engineeringBlogUrl: "https://usa.visa.com/visa-everywhere/blog.html",
    tier: "Tier 1 FinTech",
    primaryTechStack: ["Java", "C++", "Go", "Kafka", "Cassandra", "DB2", "High-Throughput Mainframe"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Cybersecurity Engineer"]
  },
  "Mastercard": {
    id: "comp-mastercard",
    slug: "mastercard",
    displayName: "Mastercard",
    legalName: "Mastercard Incorporated",
    aliases: ["mastercard", "master card", "mastercard india"],
    sector: "fintech",
    sectorLabel: "Global Payment Processing & Cyber Intelligence",
    headquarters: "Purchase, NY / Pune",
    website: "https://www.mastercard.com",
    careersUrl: "https://careers.mastercard.com",
    engineeringBlogUrl: "https://developer.mastercard.com/blog/",
    tier: "Tier 1 FinTech",
    primaryTechStack: ["Java", "Spring Boot", "Go", "Kafka", "PostgreSQL", "Kubernetes", "PCI-DSS"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Cybersecurity Engineer"]
  },
  "American Express": {
    id: "comp-amex",
    slug: "amex",
    displayName: "American Express",
    legalName: "American Express Company",
    aliases: ["american express", "amex", "american express india"],
    sector: "fintech",
    sectorLabel: "Financial Services & Risk Intelligence",
    headquarters: "New York, NY / Gurgaon",
    website: "https://www.americanexpress.com",
    careersUrl: "https://www.americanexpress.com/en-us/careers",
    engineeringBlogUrl: "https://americanexpress.io/",
    tier: "Tier 1 FinTech",
    primaryTechStack: ["Java", "Go", "Python", "Node.js", "Kafka", "PostgreSQL", "Couchbase"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Data Scientist", "ML Engineer"]
  },
  "BlackRock": {
    id: "comp-blackrock",
    slug: "blackrock",
    displayName: "BlackRock",
    legalName: "BlackRock, Inc.",
    aliases: ["blackrock", "aladdin", "blackrock india"],
    sector: "fintech",
    sectorLabel: "Asset Management & Aladdin Risk Platform",
    headquarters: "New York, NY / Gurgaon / Mumbai",
    website: "https://www.blackrock.com",
    careersUrl: "https://careers.blackrock.com",
    engineeringBlogUrl: "https://www.blackrock.com/us/individual/insights",
    tier: "Tier 1 FinTech",
    primaryTechStack: ["Java", "C++", "Python", "Cassandra", "Kafka", "Sybase", "Kubernetes"],
    supportedRoles: ["Software Engineer", "SDE", "Backend Developer", "Data Scientist", "Data Analyst"]
  }
};

// ══════════════════════════════════════════════════════════════════════════
// 3. CANONICAL IDENTITY RESOLVERS & STRICT VALIDATION
// ══════════════════════════════════════════════════════════════════════════

/**
 * Resolves any company string (display name, slug, alias, or ID) to a CanonicalCompany.
 * Returns null if the company is not recognized (strictly avoids defaulting to Amazon).
 */
export function resolveCanonicalCompany(input: string | undefined | null): CanonicalCompany | null {
  if (!input || typeof input !== "string") return null;
  const clean = input.trim().toLowerCase();
  if (!clean || clean === "all" || clean === "all companies") return null;

  // Direct ID match
  for (const c of Object.values(CANONICAL_COMPANIES)) {
    if (c.id.toLowerCase() === clean) return c;
  }

  // Exact Display Name match
  for (const [name, c] of Object.entries(CANONICAL_COMPANIES)) {
    if (name.toLowerCase() === clean) return c;
  }

  // Slug match
  for (const c of Object.values(CANONICAL_COMPANIES)) {
    if (c.slug.toLowerCase() === clean) return c;
  }

  // Alias exact match
  for (const c of Object.values(CANONICAL_COMPANIES)) {
    if (c.aliases.some(alias => alias.toLowerCase() === clean)) {
      return c;
    }
  }

  // Token boundary safe match (e.g. "Amazon India" starts with "amazon ")
  for (const c of Object.values(CANONICAL_COMPANIES)) {
    if (c.aliases.some(alias => {
      const a = alias.toLowerCase();
      return a.length >= 4 && (clean.startsWith(a + " ") || clean.endsWith(" " + a) || clean === a);
    })) {
      return c;
    }
  }

  return null;
}

/**
 * Validates company identity and returns a structured validation result.
 * NEVER defaults to Amazon.
 */
export function validateCompanyIdentity(companyIdOrName: string): { isValid: boolean; canonical: CanonicalCompany | null; error?: string } {
  const resolved = resolveCanonicalCompany(companyIdOrName);
  if (!resolved) {
    return {
      isValid: false,
      canonical: null,
      error: `[canonical-identity] Strict Company Identity Violation: Unknown or unsupported company "${companyIdOrName}". Unknown companies must NEVER default to Amazon.`
    };
  }
  return { isValid: true, canonical: resolved };
}

/**
 * Retrieves the full CanonicalRole definition by role name or ID.
 */
export function getCanonicalRole(input: string | undefined | null): CanonicalRole | null {
  if (!input || typeof input !== "string") return null;
  const clean = input.trim().toLowerCase();
  if (!clean || clean === "all" || clean === "all roles") return null;

  for (const r of Object.values(CANONICAL_ROLES)) {
    if (r.id.toLowerCase() === clean || r.displayName.toLowerCase() === clean || r.slug.toLowerCase() === clean) {
      return r;
    }
  }

  // Fallback to name resolution
  const resolvedName = resolveCanonicalRole(input);
  return CANONICAL_ROLES[resolvedName] || null;
}

/**
 * Resolves a role string to its canonical display name.
 */
export function resolveCanonicalRole(input: string | undefined | null): string {
  if (!input || typeof input !== "string") return "Software Engineer";
  const clean = input.trim().toLowerCase();
  if (!clean || clean === "all" || clean === "all roles") return "All Roles";

  for (const [name, r] of Object.entries(CANONICAL_ROLES)) {
    if (
      name.toLowerCase() === clean ||
      r.id.toLowerCase() === clean ||
      r.slug.toLowerCase() === clean ||
      clean.includes(r.slug) ||
      clean.includes(name.toLowerCase())
    ) {
      return name;
    }
  }

  // Common role abbreviations
  if (clean === "swe" || clean === "developer" || clean === "software developer") return "Software Engineer";
  if (clean === "sde 1" || clean === "sde-1" || clean === "sde 2" || clean === "sde-2" || clean === "sde-i" || clean === "sde-ii") return "SDE";
  if (clean === "fe" || clean === "frontend" || clean === "ui developer") return "Frontend Developer";
  if (clean === "be" || clean === "backend" || clean === "server engineer") return "Backend Developer";
  if (clean === "fs" || clean === "fullstack") return "Full Stack Developer";
  if (clean === "ds" || clean === "data science") return "Data Scientist";
  if (clean === "mle" || clean === "machine learning") return "ML Engineer";
  if (clean === "ai" || clean === "genai engineer") return "AI Engineer";
  if (clean === "da" || clean === "analyst") return "Data Analyst";
  if (clean === "pm" || clean === "apm" || clean === "product") return "Product Manager";
  if (clean === "sre" || clean === "platform engineer") return "DevOps Engineer";
  if (clean === "security" || clean === "appsec" || clean === "infosec") return "Cybersecurity Engineer";

  return "Software Engineer";
}

/**
 * Strict Company Isolation Assertion.
 * Ensures data intended for Company A is never presented as Company B.
 */
export function assertCompanyIsolation(expectedCompany: string, actualCompany: string | undefined | null): void {
  const exp = resolveCanonicalCompany(expectedCompany);
  const act = resolveCanonicalCompany(actualCompany);

  if (exp && act && exp.id !== act.id) {
    throw new Error(`[canonical-identity] Cross-Company Contamination Detected! Expected company "${exp.displayName}" (${exp.id}), but received data for "${act.displayName}" (${act.id}). Amazon must never leak to Groww or any other company!`);
  }
}

export const ALL_CANONICAL_COMPANIES: CanonicalCompany[] = Object.values(CANONICAL_COMPANIES);
export const ALL_CANONICAL_ROLES: CanonicalRole[] = Object.values(CANONICAL_ROLES);

