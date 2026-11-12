/**
 * lib/recruitment/competency-frameworks.ts
 * 
 * Authentic Corporate Behavioral & Competency Frameworks.
 * Grounded in official documentation from Google, Amazon, Atlassian, Microsoft, Tata, and JPMorgan.
 */

import { CompetencyFramework } from "./types";

export const AMAZON_LEADERSHIP_PRINCIPLES: CompetencyFramework = {
  id: "comp_amazon_lp",
  companyId: "amazon",
  name: "Amazon 16 Leadership Principles (LPs)",
  description: "Amazon evaluates all candidates against 16 core principles. In interviews, every interviewer is assigned 2 specific principles to probe using behavioral STAR questions.",
  principles: [
    {
      id: "customer_obsession",
      name: "Customer Obsession",
      definition: "Leaders start with the customer and work backwards. They work vigorously to earn and keep customer trust.",
      positiveIndicators: [
        "Prioritizes long-term customer value over short-term metrics",
        "Deeply investigates customer friction points",
        "Designs systems backwards from end-user needs",
      ],
      negativeIndicators: [
        "Focuses on competitor moves rather than customer experience",
        "Disregards user feedback when building technical features",
      ],
      sampleProbingQuestions: [
        "Tell me about a time when you had to balance customer needs against business or technical constraints.",
        "Give an example of a difficult customer feedback item you addressed and how it changed your roadmap.",
      ],
    },
    {
      id: "ownership",
      name: "Ownership",
      definition: "Leaders are owners. They think long term and don't sacrifice long-term value for short-term results. They never say 'that's not my job'.",
      positiveIndicators: [
        "Steps up to fix systemic bugs outside their direct component",
        "Takes accountability for downstream failures without blaming others",
      ],
      negativeIndicators: [
        "Passes off critical issues because they belong to another team",
        "Leaves technical debt unaddressed without notifying stakeholders",
      ],
      sampleProbingQuestions: [
        "Tell me about a time when you saw an unowned problem in a project and took the initiative to resolve it.",
        "Describe a situation where you had to make a trade-off that was inconvenient for you but right for the team.",
      ],
    },
    {
      id: "bias_for_action",
      name: "Bias for Action",
      definition: "Speed matters in business. Many decisions and actions are reversible and do not need extensive study. We value calculated risk taking.",
      positiveIndicators: [
        "Acts with incomplete information when the decision is reversible (two-way door)",
        "Builds rapid prototypes to test critical assumptions",
      ],
      negativeIndicators: [
        "Suffers from analysis paralysis on simple architectural choices",
        "Waits for explicit instructions when blockers arise",
      ],
      sampleProbingQuestions: [
        "Tell me about a time you had to make a critical technical decision without full data or consensus.",
        "Describe a project where speed of delivery was vital and how you made the necessary trade-offs.",
      ],
    },
    {
      id: "dive_deep",
      name: "Dive Deep",
      definition: "Leaders operate at all levels, stay connected to the details, audit frequently, and are skeptical when metrics and anecdote differ. No task is beneath them.",
      positiveIndicators: [
        "Traces root causes down to individual code lines, network packets, or memory leaks",
        "Validates high-level dashboards against raw transaction telemetry",
      ],
      negativeIndicators: [
        "Relies on assumptions when diagnosing production incidents",
        "Hands off debugging without verifying root cause remediation",
      ],
      sampleProbingQuestions: [
        "Walk me through the most complex bug you personally diagnosed and resolved in production.",
        "Tell me about a time when high-level metrics looked healthy but you suspected an underlying defect.",
      ],
    },
    {
      id: "invent_and_simplify",
      name: "Invent and Simplify",
      definition: "Leaders expect and require innovation and invention from their teams and always find ways to simplify. They are externally aware, look for new ideas from everywhere, and are not limited by 'not invented here'.",
      positiveIndicators: [
        "Replaces convoluted multi-service dependencies with straightforward primitives",
        "Finds elegant solutions to complex algorithmic bottlenecks",
      ],
      negativeIndicators: [
        "Over-engineers simple requirements with premature microservices",
        "Refuses existing libraries due to not-invented-here syndrome",
      ],
      sampleProbingQuestions: [
        "Tell me about a time you simplified an existing complex process or codebase.",
        "Describe an innovative solution you devised to bypass a hard resource or platform constraint.",
      ],
    },
    {
      id: "have_backbone_disagree_commit",
      name: "Have Backbone; Disagree and Commit",
      definition: "Leaders are obligated to respectfully challenge decisions when they disagree, even when doing so is uncomfortable or exhausting. Once a decision is determined, they commit wholly.",
      positiveIndicators: [
        "Presents objective data to challenge bad technical decisions",
        "Executes enthusiastically once a team consensus or escalation is finalized",
      ],
      negativeIndicators: [
        "Remains silent during planning and complains after delivery",
        "Passively resists decisions they disagreed with",
      ],
      sampleProbingQuestions: [
        "Tell me about a technical debate where you strongly disagreed with your team lead or peer. How did you handle it?",
        "Describe a time when your proposal was rejected. How did you support the chosen alternative?",
      ],
    },
  ],
};

export const ATLASSIAN_VALUES: CompetencyFramework = {
  id: "comp_atlassian_values",
  companyId: "atlassian",
  name: "Atlassian 5 Core Values",
  description: "Atlassian evaluates candidates in a dedicated 'Values Interview' on whether their communication, teamwork, and ethics align with company culture.",
  principles: [
    {
      id: "open_company_no_bullshit",
      name: "Open Company, No Bullshit",
      definition: "Information is open by default. We share information freely and honestly, without hidden agendas.",
      positiveIndicators: [
        "Communicates blockers early and transparently",
        "Provides constructive peer feedback directly and respectfully",
      ],
      negativeIndicators: [
        "Conceals project delays until deadlines are missed",
        "Engages in office politics or gatekeeps knowledge",
      ],
      sampleProbingQuestions: [
        "Tell me about a time you had to deliver difficult feedback to a peer or manager.",
        "How do you handle sharing project failures or mistakes with your stakeholders?",
      ],
    },
    {
      id: "build_with_heart_and_balance",
      name: "Build with Heart & Balance",
      definition: "Passion and urgency must be balanced with sustainability, quality, and empathy.",
      positiveIndicators: [
        "Balances immediate shipping speed with long-term code maintainability",
        "Respects work-life boundaries for themselves and teammates",
      ],
      negativeIndicators: [
        "Sacrifices test coverage and team well-being for short-term heroics",
      ],
      sampleProbingQuestions: [
        "How do you balance technical debt against business pressure to ship quickly?",
        "Tell me about a time a project was at risk of burnout and how you managed it.",
      ],
    },
    {
      id: "play_as_a_team",
      name: "Play as a Team",
      definition: "We spend a huge amount of our time at work. The team wins together, learns together, and supports each other.",
      positiveIndicators: [
        "Mentors junior peers and celebrates team victories over personal acclaim",
        "Shares credit openly and assists teammates when their own work is done",
      ],
      negativeIndicators: [
        "Hoards high-visibility tasks and isolates themselves from team goals",
      ],
      sampleProbingQuestions: [
        "Tell me about a time a teammate was struggling and how you stepped in to support them.",
        "Describe a situation where team consensus was difficult to reach and how you helped bridge the gap.",
      ],
    },
    {
      id: "dont_fuck_the_customer",
      name: "Don't #@!% the Customer",
      definition: "Customers are our lifeblood. We must maintain their trust with transparent pricing, reliable software, and data privacy.",
      positiveIndicators: [
        "Treats user data privacy and system availability as sacred obligations",
        "Advocates for usability even when internal tools are easier to build",
      ],
      negativeIndicators: [
        "Dismisses customer bug reports as user error",
      ],
      sampleProbingQuestions: [
        "Tell me about a time when a business decision compromised customer trust and how you advocated for the customer.",
      ],
    },
    {
      id: "be_the_change_you_seek",
      name: "Be the Change You Seek",
      definition: "Continuous improvement is everyone's business. See something broken? Propose and drive a solution.",
      positiveIndicators: [
        "Identifies flaky tests or broken CI/CD pipelines and takes the initiative to fix them",
        "Introduces improvements to team developer experience",
      ],
      negativeIndicators: [
        "Passively tolerates broken tooling or hostile workflows",
      ],
      sampleProbingQuestions: [
        "Tell me about a process or tool in your previous work that you changed for the better.",
      ],
    },
  ],
};

export const GOOGLE_GOOGLYNESS: CompetencyFramework = {
  id: "comp_google_googlyness",
  companyId: "google",
  name: "Google Googlyness & Leadership (G&L)",
  description: "Google tests Googlyness to ensure engineers exhibit intellectual humility, do the right thing, navigate ambiguity, and foster inclusive, collaborative teams.",
  principles: [
    {
      id: "intellectual_humility",
      name: "Intellectual Humility & Navigating Ambiguity",
      definition: "Willingness to admit mistakes, learn from peers regardless of hierarchy, and thrive in ill-defined problem spaces.",
      positiveIndicators: [
        "Listens actively to counter-arguments and changes stance when presented with superior data",
        "Breaks down ambiguous problems into exploratory hypotheses",
      ],
      negativeIndicators: [
        "Defends incorrect technical choices out of ego",
        "Requires rigid specifications before beginning work",
      ],
      sampleProbingQuestions: [
        "Tell me about a project where the requirements were ambiguous or constantly changing. How did you structure your work?",
        "Describe a time you were wrong about a major technical assumption and what you learned from it.",
      ],
    },
    {
      id: "doing_the_right_thing",
      name: "Doing the Right Thing (Ethics & Inclusivity)",
      definition: "Commitment to ethical software engineering, user privacy, security, and building inclusive products for everyone.",
      positiveIndicators: [
        "Proactively considers algorithmic bias, accessibility, and edge-user demographics",
        "Flags potential privacy risks in data collection pipelines",
      ],
      negativeIndicators: [
        "Treats security or accessibility as optional afterthoughts",
      ],
      sampleProbingQuestions: [
        "Tell me about a time you faced an ethical dilemma or security risk in a project. How did you respond?",
        "How do you ensure your code or product is accessible and fair to all users?",
      ],
    },
  ],
};

export const TATA_CODE_OF_CONDUCT: CompetencyFramework = {
  id: "comp_tata_code",
  companyId: "tcs",
  name: "Tata Code of Conduct (TCoC)",
  description: "TCS emphasizes ethical integrity, client commitment, adaptability, and continuous learning rooted in the Tata group's historical values.",
  principles: [
    {
      id: "integrity_ethics",
      name: "Integrity and Client Trust",
      definition: "Conducting all business with uncompromising honesty, compliance with global regulations, and dedication to client service agreements.",
      positiveIndicators: [
        "Adheres strictly to client IP confidentiality and security protocols",
        "Honest reporting of project velocity and software defect counts",
      ],
      negativeIndicators: [
        "Takes shortcuts that violate security compliance to hit deadlines",
      ],
      sampleProbingQuestions: [
        "Tell me about a time you were asked to do something that conflicted with your ethical standards.",
        "How do you handle client confidentiality when working across multiple projects?",
      ],
    },
    {
      id: "adaptability_learnability",
      name: "Adaptability & Learnability",
      definition: "Willingness to master new tech stacks, adapt to changing client project demands, and collaborate in diverse global teams.",
      positiveIndicators: [
        "Rapidly self-learns modern frameworks when a project requires it",
        "Demonstrates flexibility with work shifts and geographic project rotations",
      ],
      negativeIndicators: [
        "Resists learning unfamiliar programming languages or legacy systems",
      ],
      sampleProbingQuestions: [
        "Tell me about a time you had to learn a completely new programming language or tool in a few days.",
      ],
    },
  ],
};

export const MICROSOFT_CULTURE: CompetencyFramework = {
  id: "comp_microsoft_culture",
  companyId: "microsoft",
  name: "Microsoft Culture & Growth Mindset",
  description: "Microsoft's hiring ethos centers on a Growth Mindset: moving from 'know-it-all' to 'learn-it-all', diverse collaboration, and customer empathy.",
  principles: [
    {
      id: "growth_mindset",
      name: "Growth Mindset",
      definition: "Belief that capability can be developed through dedication, hard work, and learning from failure.",
      positiveIndicators: [
        "Views failure as feedback and actively seeks out tough challenges",
        "Welcomes critical code reviews as learning opportunities",
      ],
      negativeIndicators: [
        "Reacts defensively to peer feedback",
        "Avoids unfamiliar architectural domains",
      ],
      sampleProbingQuestions: [
        "Tell me about a significant failure in your technical work. What did you take away and how did it change your approach?",
      ],
    },
    {
      id: "one_microsoft",
      name: "One Microsoft & Customer Empathy",
      definition: "Breaking down organizational silos to collaborate across divisions and deeply understanding user pain points.",
      positiveIndicators: [
        "Shares tooling and documentation across disparate project teams",
        "Empathizes with enterprise administrator and end-user challenges",
      ],
      negativeIndicators: [
        "Refuses to help adjacent teams due to jurisdictional boundaries",
      ],
      sampleProbingQuestions: [
        "Tell me about a cross-team initiative where collaboration between differing priorities was challenging.",
      ],
    },
  ],
};

export const JPMORGAN_PRINCIPLES: CompetencyFramework = {
  id: "comp_jpmorgan_principles",
  companyId: "jpmorgan",
  name: "JPMorgan Chase Business Principles",
  description: "JPMorgan Chase evaluates engineering candidates on operational excellence, risk management, and integrity in high-stakes financial technology.",
  principles: [
    {
      id: "operational_excellence",
      name: "Exceptional Client Service & Operational Excellence",
      definition: "Building robust, fault-tolerant financial computing infrastructure where data loss or calculation error has zero tolerance.",
      positiveIndicators: [
        "Designs for idempotent transactions, double-entry ledgers, and zero-loss failover",
        "Demonstrates obsessive rigor in automated regression and stress testing",
      ],
      negativeIndicators: [
        "Treats financial transaction edge cases with casual approximations",
      ],
      sampleProbingQuestions: [
        "Walk me through how you design a system where duplicate network packets must never result in duplicate financial charges.",
      ],
    },
  ],
};

export const ADOBE_VALUES: CompetencyFramework = {
  id: "comp_adobe_values",
  companyId: "adobe",
  name: "Adobe Core Values",
  description: "Adobe evaluates candidates on four core values: Genuine, Exceptional, Innovative, and Involved.",
  principles: [
    {
      id: "innovative",
      name: "Innovative",
      definition: "We are highly creative and strive to connect new ideas with business realities to build groundbreaking software.",
      positiveIndicators: [
        "Pioneers creative algorithmic or architectural approaches to solve complex design or media processing problems",
        "Challenges conventional technical boundaries while delivering practical utility",
      ],
      negativeIndicators: [
        "Rejects novel ideas due to routine adherence to legacy patterns",
      ],
      sampleProbingQuestions: [
        "Describe a time you solved an ambiguous technical problem by inventing or adapting an unconventional approach.",
      ],
    },
    {
      id: "exceptional",
      name: "Exceptional",
      definition: "We are committed to creating exceptional experiences that delight our customers and our colleagues.",
      positiveIndicators: [
        "Obsesses over user latency, rendering performance, and developer ergonomics",
        "Holds themselves and their peers to world-class software craftsmanship standards",
      ],
      negativeIndicators: [
        "Accepts mediocre system performance or unpolished APIs",
      ],
      sampleProbingQuestions: [
        "Give an example where you refused to compromise on software performance or UX despite pressure to ship quickly.",
      ],
    },
    {
      id: "genuine",
      name: "Genuine",
      definition: "We are sincere, trustworthy, and reliable in all interactions.",
      positiveIndicators: [
        "Communicates transparently about project risks, deadlines, and personal limitations",
        "Builds trust through high accountability and ethical code ownership",
      ],
      negativeIndicators: [
        "Conceals project blockers or shifts blame onto colleagues",
      ],
      sampleProbingQuestions: [
        "Tell me about a situation where you had to deliver difficult feedback or admit a mistake to leadership.",
      ],
    },
    {
      id: "involved",
      name: "Involved",
      definition: "We are inclusive, open, and actively engaged with our communities, customers, and colleagues.",
      positiveIndicators: [
        "Actively mentors peers, contributes to team knowledge bases, and values diverse viewpoints",
      ],
      negativeIndicators: [
        "Operates as an isolated silo without team knowledge sharing",
      ],
      sampleProbingQuestions: [
        "How do you ensure diverse perspectives are factored into technical architecture decisions?",
      ],
    },
  ],
};

export const DELOITTE_VALUES: CompetencyFramework = {
  id: "comp_deloitte_values",
  companyId: "deloitte",
  name: "Deloitte Shared Values & Consulting Competencies",
  description: "Deloitte evaluates candidates on client impact, analytical clarity, teamwork, and ethical leadership.",
  principles: [
    {
      id: "lead_the_way",
      name: "Lead the Way & Drive Client Value",
      definition: "Developing forward-thinking digital and analytical solutions that generate measurable business impact.",
      positiveIndicators: [
        "Connects raw data and technical architecture directly to business ROI and stakeholder outcomes",
        "Formulates structured hypotheses and analytical approaches to unstructured business problems",
      ],
      negativeIndicators: [
        "Builds technical solutions disconnected from client business constraints",
      ],
      sampleProbingQuestions: [
        "Describe a data or engineering project where you translated complex technical findings into actionable executive decisions.",
      ],
    },
    {
      id: "collaborate_impact",
      name: "Collaborate for Measurable Impact",
      definition: "Fostering multidisciplinary teamwork across tech, business, and operations to deliver cohesive results.",
      positiveIndicators: [
        "Excels in cross-functional communication and case study synthesis",
        "Synthesizes conflicting stakeholder requirements into a clear consensus",
      ],
      negativeIndicators: [
        "Dominates group discussions without listening to cross-functional peers",
      ],
      sampleProbingQuestions: [
        "Tell me about a time you worked with stakeholders from non-technical departments who had conflicting expectations.",
      ],
    },
    {
      id: "serve_integrity",
      name: "Serve with Integrity",
      definition: "Upholding absolute professional standards, data governance, and regulatory compliance.",
      positiveIndicators: [
        "Demonstrates rigorous data privacy, model governance, and ethical adherence in analytics",
      ],
      negativeIndicators: [
        "Takes shortcuts with data compliance or confidentiality",
      ],
      sampleProbingQuestions: [
        "How do you handle ambiguous requirements involving sensitive client data?",
      ],
    },
  ],
};

export const INFOSYS_CLIFE: CompetencyFramework = {
  id: "comp_infosys_clife",
  companyId: "infosys",
  name: "Infosys C-LIFE Values",
  description: "Customer Success, Leadership by Example, Integrity & Transparency, Fairness, Excellence.",
  principles: [
    {
      id: "excellence",
      name: "Excellence & Continuous Learning",
      definition: "Commitment to technical mastery, rapid skill acquisition, and relentless improvement in software quality.",
      positiveIndicators: [
        "Quickly learns new enterprise tech stacks and applies best practices",
        "Demonstrates structured problem-solving in algorithmic and architectural assessments",
      ],
      negativeIndicators: [
        "Resists learning new frameworks or technology paradigms",
      ],
      sampleProbingQuestions: [
        "Describe a time when you had to master a completely new technology or framework under tight deadlines.",
      ],
    },
    {
      id: "customer_success",
      name: "Customer Success & Delivery Reliability",
      definition: "Delivering reliable, maintainable code on schedule that meets enterprise SLAs.",
      positiveIndicators: [
        "Writes clean, modular code with thorough unit test coverage",
        "Anticipates edge cases in enterprise workflows",
      ],
      negativeIndicators: [
        "Submits unverified code without testing corner cases",
      ],
      sampleProbingQuestions: [
        "How do you ensure the stability of your code before releasing it to enterprise end-users?",
      ],
    },
  ],
};

export const ACCENTURE_VALUES: CompetencyFramework = {
  id: "comp_accenture_values",
  companyId: "accenture",
  name: "Accenture Core Values",
  description: "Client Value Creation, One Global Network, Respect for the Individual, Best People, Integrity, Stewardship.",
  principles: [
    {
      id: "client_value_creation",
      name: "Client Value Creation",
      definition: "Enabling clients to become high-performance businesses and creating long-term relationships through technical excellence.",
      positiveIndicators: [
        "Aligns technical decisions with business productivity and operational stability",
        "Shows adaptability across cloud platforms and enterprise architectures",
      ],
      negativeIndicators: [
        "Focuses on technology for technology's sake without business value",
      ],
      sampleProbingQuestions: [
        "Give an example of a technical solution you designed that reduced operational costs or increased delivery speed.",
      ],
    },
    {
      id: "stewardship",
      name: "Stewardship & Best People",
      definition: "Fulfilling our obligation to build a better, stronger, and more durable company for future generations.",
      positiveIndicators: [
        "Invests in mentoring junior engineers, documenting reusable modules, and continuous self-improvement",
      ],
      negativeIndicators: [
        "Hoards knowledge and avoids mentoring others",
      ],
      sampleProbingQuestions: [
        "Tell me about a time you mentored a peer or shared documentation that improved your team's collective efficiency.",
      ],
    },
  ],
};

export const ALL_COMPETENCY_FRAMEWORKS: Record<string, CompetencyFramework> = {
  comp_amazon_lp: AMAZON_LEADERSHIP_PRINCIPLES,
  comp_atlassian_values: ATLASSIAN_VALUES,
  comp_google_googlyness: GOOGLE_GOOGLYNESS,
  comp_tata_code: TATA_CODE_OF_CONDUCT,
  comp_microsoft_culture: MICROSOFT_CULTURE,
  comp_jpmorgan_principles: JPMORGAN_PRINCIPLES,
  comp_adobe_values: ADOBE_VALUES,
  comp_deloitte_values: DELOITTE_VALUES,
  comp_infosys_clife: INFOSYS_CLIFE,
  comp_accenture_values: ACCENTURE_VALUES,
};

export function getCompetencyFrameworkById(id: string): CompetencyFramework | null {
  return ALL_COMPETENCY_FRAMEWORKS[id] || null;
}
