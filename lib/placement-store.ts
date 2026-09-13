import { supabase } from "@/lib/supabase";
import { StudentProfileData, OpportunityData, getSafeOpportunityUrl, getOpportunityPortalInfo } from "@/lib/ai/placement-intelligence";
export type { StudentProfileData, OpportunityData };
export { getSafeOpportunityUrl, getOpportunityPortalInfo };

// Comprehensive catalog of 25+ Tier-1 & Tier-2 opportunities across Unstop, IITs, Hackathons, and FAANG Corporate Internships
export const INITIAL_SEED_OPPORTUNITIES: OpportunityData[] = [
  {
    "id": "opp-flipkart-grid",
    "title": "Flipkart GRiD 7.0 — Software Development Track",
    "type": "hackathon",
    "organizer": "Flipkart (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "Algorithms",
      "Distributed Systems",
      "Java",
      "Node.js",
      "React",
      "System Design"
    ],
    "domain_tags": [
      "E-Commerce",
      "Logistics",
      "GenAI",
      "Fintech"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-15T18:30:00Z",
    "eligibility": "B.Tech/B.E./M.Tech/MCA students graduating in 2026 or 2027",
    "source_url": "https://unstop.com/o/flipkart",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "Flipkart's flagship campus engineering competition offering direct PPIs (Pre-Placement Interviews) for SDE-1 roles.",
      "prize_pool": "INR 5,25,000 + SDE-1 PPIs (CTC ₹32 LPA)",
      "tracks_or_themes": [
          "GenAI-Powered Personalized Shopping Assistants",
          "High-Concurrency Flash Sale Inventory Locking",
          "Autonomous Warehouse Robotic Pick Optimization",
          "Real-Time Product Recommendation Graph Neural Networks",
          "Multi-Modal Search: Image + Voice + Text Product Discovery",
          "Hyperlocal Delivery Route Optimization under Traffic Constraints",
          "Anti-Fraud Transaction Risk Scoring with Sub-50ms SLA",
          "Supply Chain Demand Forecasting using Temporal Transformers"
        ],
      "team_size": "2-3 members",
      "schedule_label": "Registrations: August 2026 | Assessments: September 2026 | Finale: October 15, 2026",
      "status_badge": "Annual SDE-1 PPI Track",
      "perks": [
        "Direct SDE-1 PPIs",
        "MacBook Pro for Winners",
        "National Finalist Trophy"
      ],
      "difficulty_tier": "high",
      "deadline_if_mentioned": "2026-10-15",
      "assessment_dates": [
        {
          "label": "Round 1: E-Commerce Tech Quiz",
          "date_if_mentioned": "2026-09-18"
        },
        {
          "label": "Round 2: Algorithmic Coding Challenge",
          "date_if_mentioned": "2026-09-28"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-walmart-sde-sprint",
    "title": "Walmart Global Tech — Campus SDE Hiring Sprint 2026",
    "type": "internship",
    "organizer": "Walmart Global Tech (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "Data Structures",
      "Algorithms",
      "Java",
      "Python",
      "Cloud",
      "Problem Solving"
    ],
    "domain_tags": [
      "Retail Tech",
      "Cloud Architecture",
      "Supply Chain"
    ],
    "tier": "Tier 1",
    "deadline": "2026-09-28T23:59:59Z",
    "eligibility": "B.Tech/B.E./M.Tech students graduating in 2026 & 2027",
    "source_url": "https://unstop.com/o/walmart-global-tech-india",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "Exclusive campus software engineering hiring sprint for full-time SDE-1 and summer 2027 internship roles at Walmart Global Tech Bangalore & Chennai.",
      "prize_pool": "Direct SDE-1 Offers (₹24 - 32 LPA) & Summer Internships",
      "tracks_or_themes": [
          "Distributed Microservice Health Monitoring at Scale",
          "Cloud-Native Retail POS Resilience Architecture",
          "Automated Supplier Quality Scoring with NLP",
          "Real-Time Store Heatmap Analytics using Edge Vision",
          "Dynamic Pricing Engine for Omnichannel Retail",
          "Inventory Redistribution Optimization across 10,000+ Stores"
        ],
      "team_size": "Individual",
      "schedule_label": "Registrations: September 1 – 28, 2026 | Online Assessment: October 4, 2026",
      "status_badge": "Fall Campus SDE Track",
      "perks": [
        "Direct SDE-1 Interview",
        "₹1,00,000/mo Internship",
        "Global Tech Mentorship"
      ],
      "difficulty_tier": "high",
      "deadline_if_mentioned": "2026-09-28",
      "assessment_dates": [
        {
          "label": "Round 1: Online Technical Assessment",
          "date_if_mentioned": "2026-10-04"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-walmart-codehers",
    "title": "Walmart CodeHers 2027 — India Campus Challenge",
    "type": "internship",
    "organizer": "Walmart Global Tech (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "Data Structures",
      "Algorithms",
      "Java",
      "Python",
      "Cloud",
      "Problem Solving"
    ],
    "domain_tags": [
      "Retail Tech",
      "Cloud Architecture",
      "Supply Chain"
    ],
    "tier": "Tier 1",
    "deadline": "2027-03-31T23:59:59Z",
    "eligibility": "Female students graduating in 2027 & 2028 in B.Tech/B.E./M.Tech",
    "source_url": "https://unstop.com/o/walmart-global-tech-india",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "Exclusive annual hiring challenge for female engineering students to secure summer internships and full-time software engineering roles at Walmart.",
      "prize_pool": "INR 1,50,000 + Direct Summer SDE Internships (₹1,00,000/mo stipend)",
      "tracks_or_themes": [
          "Algorithmic Problem Solving for Supply Chain",
          "Multi-Region System Resilience & Failover Design",
          "AI-Powered Customer Sentiment Analysis Pipeline",
          "Cost-Optimized Cloud Migration Strategy Framework",
          "Automated Test Generation from API Specifications",
          "Sustainable Packaging Optimizer using ML"
        ],
      "team_size": "Individual",
      "schedule_label": "Registrations: February 1 – March 31, 2027 | Coding Round: April 10, 2027",
      "status_badge": "Annual Diversity Hiring Track",
      "perks": [
        "Summer Internship PPO Track",
        "Top 30 Cash Prizes",
        "Direct Leadership Mentorship"
      ],
      "difficulty_tier": "high",
      "deadline_if_mentioned": "2027-03-31",
      "assessment_dates": [
        {
          "label": "Round 1: Online Coding Assessment",
          "date_if_mentioned": "2027-04-10"
        },
        {
          "label": "Round 2: Advanced Coding Challenge",
          "date_if_mentioned": "2027-04-24"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-tata-imagination",
    "title": "Tata Imagination Challenge 2026",
    "type": "contest",
    "organizer": "Tata Sons (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "Innovation",
      "AI/ML",
      "Sustainability",
      "IoT",
      "Product Design"
    ],
    "domain_tags": [
      "Industrial IoT",
      "CleanTech",
      "Smart Mobility"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-25T23:59:59Z",
    "eligibility": "College students across all engineering and management streams",
    "source_url": "https://unstop.com/o/tata-sons",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "Pan-India technology and innovation competition aimed at discovering visionary solutions for Tata enterprise verticals.",
      "prize_pool": "INR 2,00,000 per winner + Tata Young Leaders PPIs",
      "tracks_or_themes": [
          "AI-Driven Predictive Maintenance for Steel Plants",
          "Carbon Zero Manufacturing Process Optimization",
          "Autonomous Fleet Management for Tata Motors",
          "Smart Water Treatment Plant IoT Monitoring",
          "AI Concierge for Taj Hotels Guest Experience",
          "Digital Twin Simulation for Cement Kilns",
          "Rural Last-Mile Connectivity via Low-Earth Orbit Mesh"
        ],
      "team_size": "Individual",
      "schedule_label": "Registrations: August – October 25, 2026 | Grand Finale: November 2026",
      "status_badge": "Tata Young Leaders Track",
      "perks": [
        "Tata Leader Mentorship",
        "Fast-track Placement Interviews",
        "National Felicitation"
      ],
      "difficulty_tier": "low",
      "deadline_if_mentioned": "2026-10-25",
      "assessment_dates": [
        {
          "label": "Tata Preliminary Idea Shortlist Announcement",
          "date_if_mentioned": "2026-11-10"
        },
        {
          "label": "Grand Finale: Leadership Presentation",
          "date_if_mentioned": "2026-11-28"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-hero-campus-challenge",
    "title": "Hero Campus Challenge Season 10 — Tech Track",
    "type": "hackathon",
    "organizer": "Hero MotoCorp (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "Embedded Systems",
      "Connected Vehicles",
      "Python",
      "Full Stack",
      "IoT"
    ],
    "domain_tags": [
      "EV & Mobility",
      "Embedded IoT",
      "AI Edge Computing"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-05T23:59:59Z",
    "eligibility": "Engineering students in 3rd & 4th year from accredited institutes",
    "source_url": "https://unstop.com/o/hero-motocorp",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "Flagship engineering challenge testing innovative connected-vehicle telemetry, batter management, and customer mobile experiences.",
      "prize_pool": "INR 4,00,000 + PPIs for Management & Tech Trainee roles",
      "tracks_or_themes": [
          "EV Battery Swapping Station Network Optimizer",
          "Smart Instrument Cluster with Augmented Navigation",
          "Predictive Battery Health & Range Anxiety Reducer",
          "Connected Vehicle Telemetry Dashboard (MQTT + Kafka)",
          "AI-based Rider Safety Alert from Helmet Accelerometer",
          "Electric Scooter Regenerative Braking Efficiency ML Model",
          "Fleet Management & Geo-fencing for Commercial EVs"
        ],
      "team_size": "2-3 members",
      "schedule_label": "Registrations: September – November 5, 2026 | Finale: December 2026",
      "perks": [
        "PPI Opportunities",
        "Cash Grants",
        "Prototyping Lab Access"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Engineering Assessment & Quiz",
          "date_if_mentioned": "2026-11-12"
        },
        {
          "label": "Grand Finale at Hero Centre of Innovation, Jaipur",
          "date_if_mentioned": "2026-12-15"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-reliance-tup",
    "title": "Reliance TUP 9.0 (The Ultimate Pitch)",
    "type": "contest",
    "organizer": "Reliance Industries (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "5G & Telecom",
      "GenAI",
      "Cloud",
      "Retail Tech",
      "Computer Vision"
    ],
    "domain_tags": [
      "Telecom",
      "New Commerce",
      "Digital Services"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-20T23:59:59Z",
    "eligibility": "Full-time undergraduate & postgraduate engineering students",
    "source_url": "https://unstop.com/o/reliance-industries-limited",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "Prestigious strategic challenge inviting disruptive technological concepts across Jio 5G, Retail automation, and Clean Energy.",
      "prize_pool": "INR 6,00,000 + Pre-Placement Interviews with Jio / Reliance",
      "tracks_or_themes": [
          "5G MEC-powered AR Shopping Experience",
          "Autonomous Checkout Store using Computer Vision",
          "Solar Energy Yield Optimization for Jio Towers",
          "Real-Time Fraud Detection in JioMart Payments",
          "AI-Powered Video Summarization for JioCinema",
          "Supply Chain Visibility Platform for Reliance Retail",
          "Digital Health Records on Blockchain for Hospitals"
        ],
      "team_size": "1-4 members",
      "schedule_label": "Submissions: September – November 20, 2026 | National Finale: December 2026",
      "perks": [
        "Jio Digital Life PPIs",
        "National TV Broadcast Pitch",
        "Incubation Support"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Pitch Deck & Video Submission",
          "date_if_mentioned": "2026-11-20"
        },
        {
          "label": "National Grand Finale at Reliance Corporate Park",
          "date_if_mentioned": "2026-12-15"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-bajaj-hackrx",
    "title": "Bajaj Finserv HackRx 5.0 — Nationwide FinTech Hackathon",
    "type": "hackathon",
    "organizer": "Bajaj Finserv (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "Fintech",
      "Next.js",
      "Python",
      "Fraud Detection",
      "Microservices",
      "AI/ML"
    ],
    "domain_tags": [
      "Fintech",
      "Risk Tech",
      "Payment Gateways"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-18T23:59:59Z",
    "eligibility": "All undergraduate and postgraduate tech students across India",
    "source_url": "https://unstop.com/o/bajaj-finserv",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "High-adrenaline 36-hour hackathon to build intelligent financial lending, automated credit risk, and conversational insurance bots.",
      "prize_pool": "INR 10,00,000 Total Cash Prizes + SDE Internships",
      "tracks_or_themes": [
          "Agentic Underwriting: AI Loan Decision Pipeline",
          "Real-Time Fraud Prevention with Graph Analytics",
          "Voice-First Financial Inclusion for Rural India",
          "Conversational Insurance Claims Bot with LLM",
          "Credit Risk Scoring with Alternative Data Sources",
          "EMI Default Prediction using Behavioral Signals",
          "KYC Document Verification with Multi-Modal AI",
          "Micro-Investment Portfolio Optimizer for Gen-Z"
        ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Aug 20 – Oct 18, 2026 | Round 1 Quiz: Oct 25, 2026 | Hackathon: Nov 14–15, 2026",
      "perks": [
        "Cash Prizes up to ₹5 Lakhs",
        "Direct Job Offers",
        "Industry Jury Critique"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Online Technical Quiz",
          "date_if_mentioned": "2026-10-25"
        },
        {
          "label": "Grand Finale: 36-Hour FinTech Hackathon",
          "date_if_mentioned": "2026-11-14"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-loreal-brandstorm",
    "title": "L'Oréal Brandstorm 2026 — Tech & AI Track",
    "type": "contest",
    "organizer": "L'Oréal (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "AR/VR",
      "Generative AI",
      "Computer Vision",
      "Mobile",
      "Full Stack"
    ],
    "domain_tags": [
      "BeautyTech",
      "Augmented Reality",
      "Consumer Tech"
    ],
    "tier": "Tier 2",
    "deadline": "2026-11-25T23:59:59Z",
    "eligibility": "Undergraduate and postgraduate students under 30 years old",
    "source_url": "https://unstop.com/o/loreal",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "Global student innovation competition where winners fly to Paris HQ for a 3-month intrapreneurship mission at Station F.",
      "prize_pool": "Full 3-Month Paris Intrapreneurship Immersion + All Expenses Paid",
      "tracks_or_themes": [
          "AI Skin Diagnostic Sensor using Phone Camera",
          "Hyper-Personalized AR Virtual Makeup Mirrors",
          "Sustainable Packaging Material Discovery AI",
          "Social Commerce Influencer-Product Match Engine",
          "Hair Care Recommendation from Selfie Analysis",
          "Carbon Footprint Tracker for Beauty Supply Chain"
        ],
      "team_size": "3 members",
      "perks": [
        "Trip to Paris",
        "Station F Incubation",
        "International Networking"
      ],
      "schedule_label": "Registrations: Aug 15 – Nov 25, 2026 | Mission 1 Submission: Dec 10, 2026 | India National Finale: Feb 2027",
      "assessment_dates": [
        {
          "label": "Mission 1: 3-Slide Tech Pitch Submission",
          "date_if_mentioned": "2026-12-10"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-sih-2026",
    "title": "Smart India Hackathon 2026 — Software Edition",
    "type": "hackathon",
    "organizer": "Ministry of Education & AICTE",
    "organizer_type": "IIT-fest",
    "tags": [
      "Full Stack",
      "AI/ML",
      "Cloud",
      "Next.js",
      "Python",
      "Problem Solving",
      "DevOps"
    ],
    "domain_tags": [
      "Public Sector",
      "HealthTech",
      "AgriTech",
      "Cybersecurity"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-30T23:59:59Z",
    "eligibility": "Regular college students in teams of 6 (mandatory min 1 female member)",
    "source_url": "https://www.sih.gov.in/",
    "extracted_context": {
      "platform": "Government / SIH Portal",
      "summary": "World's biggest open innovation hackathon connecting student developers with 50+ central government ministries & enterprise problem statements.",
      "prize_pool": "INR 1,00,000 per problem statement across 300+ nodal centers",
      "tracks_or_themes": [
          "Deepfake Detection for Government Media Verification",
          "Smart Disaster Relief Resource Allocation System",
          "Clean Water Quality IoT Monitoring for Rural India",
          "AI-based Crop Disease Detection from Drone Imagery",
          "Cybersecurity Threat Intelligence for Critical Infrastructure",
          "Telemedicine Platform for Remote Tribal Areas",
          "Land Record Digitization with Blockchain Immutability",
          "Traffic Congestion Prediction & Signal Optimization",
          "Multi-Language Government Document Translation Engine",
          "Waste Management Route Optimization for Smart Cities"
        ],
      "team_size": "6 members",
      "perks": [
        "National Recognition",
        "Direct Ministry Interviews",
        "Cash Grants"
      ],
      "schedule_label": "College Nominations: Sep 1 – Oct 30, 2026 | National Shortlist: Nov 15, 2026 | 36h Grand Finale: Dec 18–19, 2026",
      "assessment_dates": [
        {
          "label": "College SPOC Idea Submission Deadline",
          "date_if_mentioned": "2026-10-30"
        },
        {
          "label": "National Shortlist & Evaluation Announcement",
          "date_if_mentioned": "2026-11-15"
        },
        {
          "label": "Grand Finale: 36-Hour Non-Stop Hackathon",
          "date_if_mentioned": "2026-12-18"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-iitb-techfest",
    "title": "IIT Bombay Techfest 2026 — International Coding Challenge",
    "type": "hackathon",
    "organizer": "IIT Bombay Techfest",
    "organizer_type": "IIT-fest",
    "tags": [
      "C++",
      "Python",
      "Algorithms",
      "Computer Vision",
      "Competitive Programming"
    ],
    "domain_tags": [
      "Robotics",
      "Defense Tech",
      "Deep Learning"
    ],
    "tier": "Tier 1",
    "deadline": "2026-12-10T23:59:59Z",
    "eligibility": "Open to college and university students globally",
    "source_url": "https://techfest.org/",
    "extracted_context": {
      "platform": "IIT Bombay",
      "summary": "Asia's largest science and technology festival hosting competitive coding, drone automation, and international hack challenges.",
      "prize_pool": "INR 7,50,000 + Certificate of Excellence from IIT Bombay",
      "tracks_or_themes": [
          "Autonomous Navigation for Underground Mining Robots",
          "Algorithmic Speed Challenge: Sub-100ms Decision Trees",
          "AI Cybersecurity: Zero-Day Exploit Pattern Recognition",
          "Drone Swarm Coordination for Search & Rescue",
          "Real-Time Sign Language Translation using MediaPipe",
          "Satellite Image Segmentation for Deforestation Tracking",
          "Adversarial ML: Defending Against Model Poisoning"
        ],
      "team_size": "1-4 members",
      "perks": [
        "IIT Bombay Techfest Medal",
        "VIP Exhibitor Passes",
        "Corporate Recruiter Networking"
      ],
      "schedule_label": "Registrations: Oct 1 – Dec 10, 2026 | Online Algorithmic Round: Dec 15, 2026 | Powai Grand Finale: Jan 3–5, 2027",
      "assessment_dates": [
        {
          "label": "Round 1: Online Coding Challenge",
          "date_if_mentioned": "2026-12-15"
        },
        {
          "label": "Grand Finale at IIT Bombay Powai Campus",
          "date_if_mentioned": "2027-01-03"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-mood-indigo-hack",
    "title": "IIT Bombay Mood Indigo — Hack Indigo 2026",
    "type": "hackathon",
    "organizer": "IIT Bombay",
    "organizer_type": "IIT-fest",
    "tags": [
      "Web3",
      "Generative AI",
      "Mobile App",
      "React Native",
      "FastAPI"
    ],
    "domain_tags": [
      "Creator Economy",
      "EdTech",
      "Entertainment"
    ],
    "tier": "Tier 1",
    "deadline": "2026-12-10T23:59:59Z",
    "eligibility": "Undergraduate students across all colleges in India",
    "source_url": "https://moodi.org/",
    "extracted_context": {
      "platform": "IIT Bombay",
      "summary": "Asia's largest college cultural fest hosting an overnight 36-hour hackathon focusing on generative art, creator platforms, and viral digital media.",
      "prize_pool": "INR 3,00,000 + Seed Capital Incubation Fast-track",
      "tracks_or_themes": [
          "AI-Generated Music Composition & Remix Engine",
          "Decentralized Creator Royalty Distribution Platform",
          "AR Concert Experience with Spatial Audio",
          "Social Impact: Mental Health Chatbot for Students",
          "NFT Marketplace for Digital Art with Zero Gas Fees",
          "Real-Time Collaborative Whiteboard with AI Assistance",
          "Viral Content Prediction from Social Media Signals"
        ],
      "team_size": "2-4 members",
      "perks": [
        "Angel Pitch Session",
        "Incubation Fast-track",
        "Mood Indigo VIP Concert Access"
      ],
      "schedule_label": "Registrations: Oct 15 – Dec 10, 2026 | 36-Hour Hack Arena: Dec 26–28, 2026",
      "assessment_dates": [
        {
          "label": "36-Hour Live Hackathon & Pitch",
          "date_if_mentioned": "2026-12-26"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-iitd-tryst",
    "title": "IIT Delhi Tryst 2026 — HackDel Overnight Hackathon",
    "type": "hackathon",
    "organizer": "IIT Delhi",
    "organizer_type": "IIT-fest",
    "tags": [
      "Full Stack",
      "Distributed Systems",
      "Rust",
      "Golang",
      "Kubernetes"
    ],
    "domain_tags": [
      "DevTools",
      "Cloud Infrastructure",
      "Fintech"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-14T23:59:59Z",
    "eligibility": "B.Tech/M.Tech/PhD students from recognized engineering colleges",
    "source_url": "https://tryst-iitd.org/",
    "extracted_context": {
      "platform": "IIT Delhi",
      "summary": "North India's largest technical festival hosting a hardcore 36-hour engineering hackathon with prominent VC and founder judges.",
      "prize_pool": "INR 4,50,000 + Cloud Credits worth $20,000",
      "tracks_or_themes": [
          "Zero-Knowledge Proof-based Voting System",
          "High-Throughput Distributed Database from Scratch",
          "AI Developer Infrastructure: Auto Code Review Bot",
          "Kubernetes Custom Operator for ML Model Serving",
          "Decentralized Identity Verification Protocol",
          "Real-Time Collaborative Code Editor with CRDT",
          "Infrastructure Cost Optimizer for Multi-Cloud Deployments"
        ],
      "team_size": "2-4 members",
      "perks": [
        "Direct VC Seed Introductions",
        "IIT Delhi Tryst Winner Memento",
        "Cloud Subsidies"
      ],
      "schedule_label": "Registrations: Oct 1 – Nov 14, 2026 | Prototype Review: Nov 20, 2026 | On-Campus Finale: Dec 5–6, 2026",
      "assessment_dates": [
        {
          "label": "Round 1: System Prototype & GitHub Review",
          "date_if_mentioned": "2026-11-20"
        },
        {
          "label": "Grand Finale at IIT Delhi Campus",
          "date_if_mentioned": "2026-12-05"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-iitm-shaastra",
    "title": "IIT Madras Shaastra 2026 — AI & Robotics Conclave Hackathon",
    "type": "hackathon",
    "organizer": "IIT Madras",
    "organizer_type": "IIT-fest",
    "tags": [
      "ROS",
      "Python",
      "Edge AI",
      "Computer Vision",
      "TensorFlow",
      "IoT"
    ],
    "domain_tags": [
      "Autonomous Drones",
      "MedTech",
      "Robotics"
    ],
    "tier": "Tier 1",
    "deadline": "2026-12-15T23:59:59Z",
    "eligibility": "Undergraduate engineering students across India",
    "source_url": "https://shaastra.org/",
    "extracted_context": {
      "platform": "IIT Madras",
      "summary": "ISO 9001:2015 certified technical festival featuring deep-tech AI challenges, autonomous robotics sprints, and hardware co-design.",
      "prize_pool": "INR 5,00,000 + IITM Pravartak Incubation Pitch",
      "tracks_or_themes": [
          "Assistive Medical Drone Delivery for Rural Hospitals",
          "Edge Video Analytics for Traffic Violation Detection",
          "Industrial IoT Anomaly Detection with Streaming ML",
          "Autonomous Underwater Vehicle Navigation using Sonar",
          "Brain-Computer Interface Signal Denoising with DL",
          "Agricultural Robot for Precision Pesticide Spraying",
          "Wearable Health Monitor with Federated Learning Privacy",
          "Solar Panel Defect Detection using Thermal Imaging"
        ],
      "team_size": "2-5 members",
      "perks": [
        "IIT Madras Research Park Access",
        "Hardware Grants",
        "National Certificates"
      ],
      "schedule_label": "Registrations: Oct 15 – Dec 15, 2026 | Online Qualifier: Dec 22, 2026 | Chennai Grand Finale: Jan 8–10, 2027",
      "assessment_dates": [
        {
          "label": "Round 1: Online AI & Robotics Assessment",
          "date_if_mentioned": "2026-12-22"
        },
        {
          "label": "Grand Finale at IIT Madras Research Park",
          "date_if_mentioned": "2027-01-08"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-iitkgp-kshitij",
    "title": "IIT Kharagpur Kshitij 2026 — Overnite Systems & Web Hack",
    "type": "hackathon",
    "organizer": "IIT Kharagpur",
    "organizer_type": "IIT-fest",
    "tags": [
      "React",
      "Go",
      "Docker",
      "Machine Learning",
      "System Security"
    ],
    "domain_tags": [
      "Cybersecurity",
      "GovTech",
      "Open Source"
    ],
    "tier": "Tier 1",
    "deadline": "2026-12-01T23:59:59Z",
    "eligibility": "All enrolled college students",
    "source_url": "https://ktj.in/",
    "extracted_context": {
      "platform": "IIT Kharagpur",
      "summary": "Asia's largest annual techno-management fest hosting software and security design challenges judged by industry veterans.",
      "prize_pool": "INR 3,50,000 + Startup Mentorship Program",
      "tracks_or_themes": [
          "Defensive Cybersecurity: IDS using ML Pipeline",
          "Decentralized Public Digital Infrastructure Framework",
          "Compiler Optimization Challenge: Custom LLVM Pass",
          "WebRTC-based P2P Video Streaming Platform",
          "Open-Source Contribution Leaderboard & Gamification",
          "Smart Contract Vulnerability Scanner with Static Analysis",
          "Container Escape Detection for Cloud Security"
        ],
      "team_size": "2-4 members",
      "perks": [
        "Kshitij Trophy",
        "Fast-track Startup Grants",
        "Free Merchandise"
      ],
      "schedule_label": "Registrations: Oct 1 – Dec 1, 2026 | Coding Round: Dec 10, 2026 | On-Campus Finale: Jan 16–18, 2027",
      "assessment_dates": [
        {
          "label": "Round 1: Systems & Security Challenge",
          "date_if_mentioned": "2026-12-10"
        },
        {
          "label": "Grand Finale Hackathon at IIT Kharagpur",
          "date_if_mentioned": "2027-01-16"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-bits-apogee",
    "title": "BITS Pilani APOGEE 2026 — HackMatrix National Hackathon",
    "type": "hackathon",
    "organizer": "BITS Pilani",
    "organizer_type": "IIT-fest",
    "tags": [
      "Full Stack",
      "Next.js",
      "AI Agents",
      "FastAPI",
      "Vector Databases"
    ],
    "domain_tags": [
      "Enterprise AI",
      "Productivity",
      "Web3"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-10T23:59:59Z",
    "eligibility": "Undergraduate college students",
    "source_url": "https://bits-apogee.org/",
    "extracted_context": {
      "platform": "BITS Pilani",
      "summary": "Premier inter-college technical hackathon testing execution speed, UX polish, and non-trivial AI agent workflows.",
      "prize_pool": "INR 3,00,000 + BITS Pilani Conquest Fast-track",
      "tracks_or_themes": [
          "Agentic Browser Workflow Automation (like Browser-Use)",
          "Autonomous Code Reviewer with AST Analysis",
          "Real-Time Collaborative Infinite Canvas",
          "AI Meeting Summarizer with Action Item Extraction",
          "Vector Database Query Optimizer for RAG Pipelines",
          "Developer Productivity Metrics Dashboard",
          "Low-Code Platform Builder with AI Schema Generation",
          "Multi-Agent Debate System for Research Synthesis"
        ],
      "team_size": "2-4 members",
      "perks": [
        "Conquest Accelerator Entry",
        "Cash Prizes",
        "BITSian Founder Mentorship"
      ],
      "schedule_label": "Registrations: Oct 1 – Nov 10, 2026 | Virtual Qualifier: Nov 20, 2026 | Pilani On-Campus Finale: Feb 26–28, 2027",
      "assessment_dates": [
        {
          "label": "Round 1: Virtual Algorithmic Qualifier",
          "date_if_mentioned": "2026-11-20"
        },
        {
          "label": "Grand Finale Hackathon at BITS Pilani",
          "date_if_mentioned": "2027-02-26"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-razorpay-fellowship",
    "title": "Razorpay AI Buildathon & Summer Engineering Fellowship",
    "type": "internship",
    "organizer": "Razorpay",
    "organizer_type": "startup",
    "tags": [
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL",
      "GenAI",
      "Payment Gateways"
    ],
    "domain_tags": [
      "Fintech",
      "Developer Tools",
      "AI Agents"
    ],
    "tier": "Tier 1",
    "deadline": "2026-12-01T23:59:59Z",
    "eligibility": "Pre-final and final year engineering students with strong full-stack GitHub repositories",
    "source_url": "https://razorpay.com/jobs/",
    "extracted_context": {
      "platform": "Razorpay Careers / Direct",
      "summary": "High-impact paid engineering fellowship building autonomous AI payment recovery pipelines and developer APIs.",
      "prize_pool": "Stipend INR 65,000/month + Full-Time SDE Conversion (CTC ₹28 LPA)",
      "tracks_or_themes": [
          "Autonomous AI Payment Recovery Agent Pipeline",
          "Real-Time Webhook Idempotency Guarantee System",
          "Global Multi-Currency Checkout Orchestration",
          "Payment Gateway Fraud Detection with Graph ML",
          "Split Payment Architecture for Marketplace Sellers",
          "UPI Deep-link Generator with Dynamic QR Codes",
          "Subscription Billing Dunning Management Engine"
        ],
      "team_size": "Individual or Pairs",
      "perks": [
        "PPO Consideration",
        "Mentorship from Staff Engineers",
        "Flexible Remote/Bangalore"
      ],
      "schedule_label": "Applications: Oct 1 – Dec 1, 2026 | System Design Challenge: Dec 12, 2026 | Fellowship Starts: May 2027",
      "assessment_dates": [
        {
          "label": "System Design & Coding Sprint",
          "date_if_mentioned": "2026-12-12"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-ethindia-2026",
    "title": "ETHIndia 2026 — Asia's Biggest Ethereum Hackathon",
    "type": "hackathon",
    "organizer": "Devfolio / ETHGlobal",
    "organizer_type": "open",
    "tags": [
      "Solidity",
      "Rust",
      "Smart Contracts",
      "Next.js",
      "Web3",
      "Zero Knowledge"
    ],
    "domain_tags": [
      "DeFi",
      "Web3 Infrastructure",
      "Zero-Knowledge Cryptography"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-10T23:59:59Z",
    "eligibility": "Developers, students, and blockchain architects worldwide",
    "source_url": "https://ethindia.co/",
    "extracted_context": {
      "platform": "Devfolio",
      "summary": "The world's premier in-person Ethereum hackathon in Bangalore bringing together 2,000+ top builders, protocols, and VC funds.",
      "prize_pool": "$150,000+ in Protocol Bounties (Polygon, Arbitrum, Base, Worldcoin)",
      "tracks_or_themes": [
          "Account Abstraction Wallet with Social Recovery",
          "Decentralized AI Agent Marketplace on Ethereum",
          "ZK-Rollup Scalability: Custom Circuit Compiler",
          "Cross-Chain Bridge with Trustless Verification",
          "On-Chain Governance with Quadratic Voting",
          "MEV Protection Protocol for DeFi Users",
          "Decentralized Social Media with Content Addressing"
        ],
      "team_size": "1-4 members",
      "perks": [
        "Direct Protocol Grants",
        "Global VC Seed Funding",
        "Hardware Wallets & Merch"
      ],
      "schedule_label": "Applications: Sep 15 – Nov 10, 2026 | 36-Hour In-Person Hackathon in Bengaluru: Dec 4–6, 2026",
      "assessment_dates": [
        {
          "label": "36-Hour In-Person Web3 Hackathon at KTPO Bengaluru",
          "date_if_mentioned": "2026-12-04"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-google-solution-challenge",
    "title": "Google Solution Challenge 2026 — Global GDSC Initiative",
    "type": "contest",
    "organizer": "Google Developer Student Clubs",
    "organizer_type": "corporate",
    "tags": [
      "Flutter",
      "Firebase",
      "TensorFlow",
      "Google Cloud",
      "Android",
      "Web"
    ],
    "domain_tags": [
      "Social Impact",
      "Sustainability",
      "HealthTech"
    ],
    "tier": "Tier 1",
    "deadline": "2026-12-31T23:59:59Z",
    "eligibility": "Members of Google Developer Student Clubs (GDSC) globally",
    "source_url": "https://developers.google.com/community/gdsc-solution-challenge",
    "extracted_context": {
      "platform": "Google Developers",
      "summary": "Annual global contest challenging university students to solve one of the United Nations 17 Sustainable Development Goals using Google tech.",
      "prize_pool": "$12,000 Per Winning Team Member + Mentorship by Google Engineers",
      "tracks_or_themes": [
          "Climate Action: Carbon Footprint Tracker for Communities",
          "Good Health: AI Symptom Checker for Underserved Areas",
          "Quality Education: Adaptive Learning Platform with AI Tutor",
          "Clean Water: IoT Sensor Network for Water Quality",
          "Reduced Inequalities: Accessibility Toolkit for Web Apps",
          "Sustainable Cities: Smart Waste Collection Route Optimizer",
          "Life Below Water: Ocean Plastic Detection via Satellite",
          "Zero Hunger: Crop Yield Prediction for Smallhold Farmers"
        ],
      "team_size": "Up to 4 members",
      "perks": [
        "Global Showcase on Google YouTube",
        "Direct Google Mentorship",
        "Cash Grants"
      ],
      "schedule_label": "Submissions: Nov 1 – Dec 31, 2026 | Top 100 Mentorship: Feb 2027 | Global Top 10 Demo Day: April 2027",
      "assessment_dates": [
        {
          "label": "Round 1: UN Sustainable Development Goals Solution Demo",
          "date_if_mentioned": "2026-12-31"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-hackout-2026",
    "title": "Hackout 2026 — National Open Innovation Hackathon",
    "type": "hackathon",
    "organizer": "Headstart & Hack2skill",
    "organizer_type": "open",
    "tags": [
      "Full Stack",
      "Python",
      "FastAPI",
      "React",
      "Cloud Native",
      "AI"
    ],
    "domain_tags": [
      "SaaS",
      "Open Innovation",
      "GenAI"
    ],
    "tier": "Tier 2",
    "deadline": "2026-11-25T23:59:59Z",
    "eligibility": "Open to all developers, engineering undergraduates, and fresh graduates",
    "source_url": "https://hack2skill.com/hackathons",
    "extracted_context": {
      "platform": "Hack2skill",
      "summary": "Pan-India developer sprint pairing hackathon finalists with startup founders for immediate pilot deployments.",
      "prize_pool": "INR 2,50,000 + Startup Hiring Fast-track",
      "tracks_or_themes": [
          "Developer Productivity: AI-Powered PR Review Assistant",
          "AI Customer Ops: Intelligent Ticket Routing & Resolution",
          "EdTech: Personalized Study Plan Generator with Spaced Repetition",
          "Open Source Package Vulnerability Scanner",
          "Real-Time Collaborative Document Editor",
          "API Gateway with Dynamic Rate Limiting & Load Shedding"
        ],
      "team_size": "2-4 members",
      "perks": [
        "Startup Job Interviews",
        "AWS Cloud Credits",
        "Demo Day to Angel Investors"
      ],
      "schedule_label": "Registrations: Oct 1 – Nov 25, 2026 | 36-Hour Hackathon Weekend: Dec 18–20, 2026",
      "assessment_dates": [
        {
          "label": "36-Hour Live Hackathon & Prototype Demo",
          "date_if_mentioned": "2026-12-18"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-google-summer-intern",
    "title": "Google Summer Software Engineering Internship 2026",
    "type": "internship",
    "organizer": "Google",
    "organizer_type": "corporate",
    "tags": [
      "C++",
      "Java",
      "Python",
      "Data Structures",
      "Algorithms",
      "System Design"
    ],
    "domain_tags": [
      "Distributed Systems",
      "Cloud",
      "Machine Learning",
      "Search"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-31T23:59:59Z",
    "eligibility": "Pre-final year students pursuing B.Tech/M.Tech/Dual Degree in CS or related fields",
    "source_url": "https://www.google.com/about/careers/applications/students/",
    "extracted_context": {
      "platform": "Google Careers",
      "summary": "Elite 10 to 12-week summer software engineering internship at Google India (Bangalore / Hyderabad) working on production infrastructure.",
      "prize_pool": "Stipend INR 1,15,000/month + Full PPO Evaluation for SWE-1",
      "tracks_or_themes": [
          "Global Scale Infrastructure Optimization",
          "Large Language Model Serving & Inference Pipeline",
          "Android Ecosystem: Jetpack Compose Performance",
          "YouTube Recommendation Algorithm Fairness",
          "Google Maps Real-Time Traffic Prediction Enhancement",
          "Chrome V8 Engine Memory Optimization"
        ],
      "team_size": "Individual",
      "perks": [
        "Google PPO Track",
        "Housing Subsidy + Meals",
        "World-class Mentorship"
      ],
      "schedule_label": "Applications: Sep 1 – Oct 31, 2026 | Online Technical Assessment: Nov 10, 2026 | Interviews: Dec 2026",
      "assessment_dates": [
        {
          "label": "Google Online Technical Assessment",
          "date_if_mentioned": "2026-11-10"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-amazon-wow",
    "title": "Amazon WOW & SDE Summer Internship 2026",
    "type": "internship",
    "organizer": "Amazon",
    "organizer_type": "corporate",
    "tags": [
      "Java",
      "Object Oriented Design",
      "Data Structures",
      "AWS",
      "Algorithms"
    ],
    "domain_tags": [
      "E-Commerce",
      "AWS Cloud",
      "Supply Chain"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-15T23:59:59Z",
    "eligibility": "Female engineering students in 2nd, 3rd, or 4th year across India",
    "source_url": "https://amazonwowindia.splashthat.com/",
    "extracted_context": {
      "platform": "Amazon Student Programs",
      "summary": "Amazon's premier networking and recruitment initiative providing skill-building sessions and internship / full-time SDE opportunities.",
      "prize_pool": "Stipend INR 1,10,000/month + SDE-1 PPO Opportunity (CTC ₹44 LPA)",
      "tracks_or_themes": [
          "High-Scale Distributed Backend for Order Processing",
          "AWS Cloud-Native Architecture for Serverless Retail",
          "Alexa Conversational AI Skill Development",
          "Supply Chain Disruption Prediction System",
          "Recommendation Engine with Real-Time User Signals",
          "Automated Warehouse Robotic Coordination"
        ],
      "team_size": "Individual",
      "perks": [
        "SDE-1 Conversion Pipeline",
        "Direct Amazon Mentors",
        "Comprehensive Tech Masterclasses"
      ],
      "schedule_label": "Registrations: Sep 1 – Nov 15, 2026 | Online Coding Assessment: Nov 25, 2026 | Technical Interviews: Jan 2027",
      "assessment_dates": [
        {
          "label": "Amazon WOW Online Coding Challenge",
          "date_if_mentioned": "2026-11-25"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-microsoft-engage",
    "title": "Microsoft Engage & SDE Internship 2026",
    "type": "internship",
    "organizer": "Microsoft",
    "organizer_type": "corporate",
    "tags": [
      "C#",
      "C++",
      "Azure",
      "React",
      "Data Structures",
      "System Design"
    ],
    "domain_tags": [
      "Cloud Infrastructure",
      "Enterprise AI",
      "Productivity"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-20T23:59:59Z",
    "eligibility": "Pre-final year engineering students (graduating in 2026/2027)",
    "source_url": "https://careers.microsoft.com/students/us/en",
    "extracted_context": {
      "platform": "Microsoft University Recruiting",
      "summary": "Mentorship-driven project challenge leading directly to software engineering internships at Microsoft IDC (Hyderabad/Bangalore/Noida).",
      "prize_pool": "Stipend INR 1,25,000/month + Full-Time SDE PPO",
      "tracks_or_themes": [
          "Azure Scalability: Multi-Region Database Failover",
          "Copilot Studio Plugin for Enterprise Workflow Automation",
          "Edge Computing for Manufacturing Quality Inspection",
          "Teams Bot for Intelligent Meeting Scheduling",
          "GitHub Copilot Extension for Security Code Review",
          "Accessibility Feature: AI-Powered Screen Reader Enhancement"
        ],
      "team_size": "Individual",
      "perks": [
        "Direct Microsoft SDE Interviews",
        "Surface Pro for Top Contributors",
        "Full Relocation Support"
      ],
      "schedule_label": "Applications: Sep 1 – Oct 20, 2026 | Mentorship & Challenge: Nov 1 – 30, 2026 | SDE PPIs: Dec 2026",
      "assessment_dates": [
        {
          "label": "Microsoft Engage Foundational Assessment",
          "date_if_mentioned": "2026-10-28"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-goldman-sachs-campus",
    "title": "Goldman Sachs Engineering Campus Hiring Program 2026",
    "type": "internship",
    "organizer": "Goldman Sachs",
    "organizer_type": "corporate",
    "tags": [
      "Java",
      "C++",
      "Python",
      "Mathematics",
      "Algorithms",
      "Financial Engineering"
    ],
    "domain_tags": [
      "Quantitative Finance",
      "FinTech",
      "High Frequency Trading"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-01T23:59:59Z",
    "eligibility": "Pre-final and final year students across all branches with strong analytical foundations",
    "source_url": "https://www.goldmansachs.com/careers/students/programs/india/engineering-campus-hiring-program.html",
    "extracted_context": {
      "platform": "Goldman Sachs Careers",
      "summary": "Rigorous pan-India aptitude and coding assessment for summer analyst roles in Global Markets and Core Engineering.",
      "prize_pool": "Stipend INR 1,00,000/month + Analyst PPO Offer (CTC ₹30+ LPA)",
      "tracks_or_themes": [
          "Low-Latency Order Book Matching Engine",
          "Risk Analytics: Real-Time Portfolio VaR Calculator",
          "Data Lake Architecture for Financial Time Series",
          "Anti-Money Laundering Transaction Graph Analysis",
          "Algorithmic Trading Strategy Backtester",
          "Regulatory Compliance Document Parser with NLP"
        ],
      "team_size": "Individual",
      "perks": [
        "Summer Analyst PPO",
        "Wall Street Tech Exposure",
        "Executive Mentorship"
      ],
      "schedule_label": "Applications: Sep 15 – Nov 1, 2026 | Aptitude Test: Nov 14, 2026 | Technical Coding: Nov 28, 2026",
      "assessment_dates": [
        {
          "label": "Goldman Sachs National Aptitude Assessment",
          "date_if_mentioned": "2026-11-14"
        },
        {
          "label": "Advanced Technical Coding Round",
          "date_if_mentioned": "2026-11-28"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-uber-hacktag",
    "title": "Uber HackTag & Engineering Fellowship 2026",
    "type": "hackathon",
    "organizer": "Uber",
    "organizer_type": "corporate",
    "tags": [
      "Golang",
      "Java",
      "Microservices",
      "Kafka",
      "Geospatial Systems"
    ],
    "domain_tags": [
      "Mobility",
      "Routing Algorithms",
      "Distributed Concurrency"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-12T23:59:59Z",
    "eligibility": "Engineering students in 3rd & 4th year across India",
    "source_url": "https://www.uber.com/careers/",
    "extracted_context": {
      "platform": "Uber Engineering",
      "summary": "High-scale engineering hackathon solving real-time rider-driver dispatch, geospatial map ingestion, and surges.",
      "prize_pool": "INR 5,00,000 + SDE-1 PPIs with Uber India R&D (CTC ₹38+ LPA)",
      "tracks_or_themes": [
          "Dynamic Surge Pricing Prediction Model",
          "Low-Latency Geohash Routing for Driver Matching",
          "ETA Prediction with Real-Time Traffic & Weather Fusion",
          "Ride Sharing Optimization: Maximizing Pool Efficiency",
          "Safety Incident Detection from Accelerometer Data",
          "Multi-Modal Trip Planner (Auto + Transit + Walk)",
          "Restaurant Delivery Time Estimation with Kitchen Load"
        ],
      "team_size": "2-3 members",
      "perks": [
        "Uber R&D PPIs",
        "MacBook Pros",
        "Global Engineering Connect"
      ],
      "schedule_label": "Registrations: Sep 25 – Nov 12, 2026 | Round 1 Online Coding: Nov 18, 2026 | Grand Finale: Dec 3, 2026",
      "assessment_dates": [
        {
          "label": "Round 1: Algorithmic Coding Challenge",
          "date_if_mentioned": "2026-11-18"
        },
        {
          "label": "Grand Finale: Engineering Presentation",
          "date_if_mentioned": "2026-12-03"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-atlassian-wit",
    "title": "Atlassian Women in Tech & Summer SDE Intern",
    "type": "internship",
    "organizer": "Atlassian",
    "organizer_type": "corporate",
    "tags": [
      "Java",
      "Kotlin",
      "React",
      "Distributed Systems",
      "Cloud Platforms"
    ],
    "domain_tags": [
      "Developer Collaboration",
      "Cloud DevOps",
      "Enterprise SaaS"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-28T23:59:59Z",
    "eligibility": "Female students graduating in 2026 or 2027 in engineering degrees",
    "source_url": "https://www.atlassian.com/company/careers/students",
    "extracted_context": {
      "platform": "Atlassian University Recruiting",
      "summary": "Summer engineering internship building Jira, Confluence, and Bitbucket scale microservices with remote-first work flexibility.",
      "prize_pool": "Stipend INR 1,00,000/month + Full PPO to SDE-1 (CTC ₹50+ LPA)",
      "tracks_or_themes": [
          "Collaborative Real-Time Editing Conflict Resolution",
          "Multi-Tenant Cloud Resilience & Chaos Engineering",
          "Jira Automation: AI-Powered Bug Triage System",
          "Confluence Smart Search with Semantic Embeddings",
          "Bitbucket CI/CD Pipeline Performance Optimizer",
          "Team Velocity Prediction using Historical Sprint Data"
        ],
      "team_size": "Individual",
      "perks": [
        "PPO Conversion Track",
        "Work from Anywhere Allowance",
        "Mentorship from Staff Engineers"
      ],
      "schedule_label": "Registrations: Sep 15 – Oct 28, 2026 | HackerRank Coding Assessment: Nov 8, 2026 | Craft Interviews: Dec 2026",
      "assessment_dates": [
        {
          "label": "Atlassian Online Coding Assessment",
          "date_if_mentioned": "2026-11-08"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-deshaw-ascend",
    "title": "D. E. Shaw Ascend Fellowship & Summer Internship 2026",
    "type": "internship",
    "organizer": "D. E. Shaw Group",
    "organizer_type": "corporate",
    "tags": [
      "Python",
      "C++",
      "Linux Systems",
      "Algorithms",
      "High Performance Computing"
    ],
    "domain_tags": [
      "Quantitative Finance",
      "Systems Architecture",
      "Compilers"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-15T23:59:59Z",
    "eligibility": "Pre-final year undergraduates across CS, EE, and Mathematics departments",
    "source_url": "https://www.deshawindia.com/careers",
    "extracted_context": {
      "platform": "D.E. Shaw Careers",
      "summary": "Exclusive educational fellowship and summer internship program with one of the world's premier quantitative investment firms.",
      "prize_pool": "Stipend INR 1,50,000/month + Fellowship Grant INR 2,00,000",
      "tracks_or_themes": [
          "Large-Scale Distributed Memory Pool Manager",
          "Quantitative Financial Model Calibration",
          "Custom Lock-Free Data Structure Implementation",
          "High-Performance Computing: FPGA Acceleration",
          "Statistical Arbitrage Signal Discovery",
          "Market Microstructure Simulation Engine"
        ],
      "team_size": "Individual",
      "perks": [
        "Direct PPO Conversion (Highest Campus CTC)",
        "Luxury Accommodation",
        "Fellowship Stipend"
      ],
      "schedule_label": "Applications: Sep 1 – Oct 15, 2026 | Online Quantitative & Coding Challenge: Oct 25, 2026 | Interviews: Nov 2026",
      "assessment_dates": [
        {
          "label": "D. E. Shaw Online Algorithmic Challenge",
          "date_if_mentioned": "2026-10-25"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-tvs-epic",
    "title": "TVS Epic Campus Challenge Season 6 — Connected Mobility",
    "type": "hackathon",
    "organizer": "TVS Motor Company (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "Embedded C",
      "Python",
      "IoT",
      "Telemetry",
      "Computer Vision"
    ],
    "domain_tags": [
      "EV & Smart Mobility",
      "Automotive IoT",
      "Edge AI"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-20T23:59:59Z",
    "eligibility": "Engineering students in 3rd & 4th year across India",
    "source_url": "https://unstop.com/o/tvs-motor-company",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "TVS flagship engineering challenge focusing on two-wheeler ADAS, battery analytics, and companion app telemetry.",
      "prize_pool": "INR 3,50,000 + Direct PPIs for R&D Core Engineering roles",
      "tracks_or_themes": [
          "Connected Instrument Cluster UX Design",
          "Predictive Battery Health with Streaming Telemetry",
          "ADAS-like Safety Features for Two-Wheelers",
          "EV Charging Station Finder with Range Estimation",
          "Rider Fatigue Detection from Handlebar Sensors",
          "Smart Helmet Integration: Heads-Up Navigation Display",
          "Anti-Theft GPS Tracker with ML Anomaly Detection"
        ],
      "team_size": "2-3 members",
      "perks": [
        "TVS R&D PPIs",
        "TVS Ronin & Apache Test Rides",
        "Fast-track Interviews"
      ],
      "schedule_label": "Registrations: Sep 10 – Nov 20, 2026 | Solution Submission: Dec 5, 2026 | Finale: Dec 20, 2026",
      "assessment_dates": [
        {
          "label": "Round 1: Mobility Solution Submission",
          "date_if_mentioned": "2026-12-05"
        },
        {
          "label": "Grand Finale at Hosur Plant",
          "date_if_mentioned": "2026-12-20"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-schneider-gogreen",
    "title": "Schneider Go Green Global 2026 — Clean Energy Tech",
    "type": "contest",
    "organizer": "Schneider Electric (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "Energy Systems",
      "IoT",
      "Python",
      "Sustainability",
      "Cloud Architecture"
    ],
    "domain_tags": [
      "CleanTech",
      "Smart Grids",
      "Green AI"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-30T23:59:59Z",
    "eligibility": "All undergraduate & postgraduate engineering students",
    "source_url": "https://unstop.com/o/schneider-electric",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "Global student innovation contest to present disruptive digital solutions for sustainable energy and microgrids.",
      "prize_pool": "All-Expense-Paid Trip to Paris Global Finals + €10,000 + Job Offers",
      "tracks_or_themes": [
          "Circular Economy Dashboard for Data Centers",
          "Decarbonized Grid Telemetry & Prediction",
          "Smart Building Energy Optimization with IoT",
          "Microgrid Controller with Renewable Integration",
          "Industrial Energy Audit Automation Platform",
          "Carbon Credit Marketplace using Blockchain"
        ],
      "team_size": "2 members (Gender diverse)",
      "perks": [
        "Trip to Paris, France",
        "Direct Full-time Placement Offers",
        "Executive Mentoring"
      ],
      "schedule_label": "Submissions: Sep 1 – Nov 30, 2026 | Regional Semifinals: Jan 15, 2027 | Global Paris Finale: April 2027",
      "assessment_dates": [
        {
          "label": "Schneider Clean Energy Solution Pitch",
          "date_if_mentioned": "2026-11-30"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-asian-paints-canvas",
    "title": "Asian Paints CANVAS 2026 — Digital & Supply Chain Track",
    "type": "contest",
    "organizer": "Asian Paints (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "Machine Learning",
      "Optimization",
      "Python",
      "Data Science",
      "Logistics"
    ],
    "domain_tags": [
      "Supply Chain AI",
      "Operations Research",
      "E-Commerce"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-22T23:59:59Z",
    "eligibility": "Engineering and MBA students from top accredited campuses",
    "source_url": "https://unstop.com/o/asian-paints",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "Real-world industrial challenge dealing with inventory optimization, robotic tinting algorithms, and dealer network telemetry.",
      "prize_pool": "INR 5,00,000 + PPIs for Systems & Operations Leadership roles",
      "tracks_or_themes": [
          "Automated Paint Tinting Dispensing Telemetry",
          "Demand Forecasting via Graph Neural Networks",
          "Color Matching from Room Photo using CV",
          "Dealer Network Inventory Redistribution AI",
          "AR Room Visualizer with Real-Time Paint Preview",
          "Supply Chain Weather Disruption Predictor"
        ],
      "team_size": "3 members",
      "perks": [
        "Direct PPIs (CTC ₹24 LPA)",
        "Executive Mentorship",
        "National Recognition"
      ],
      "schedule_label": "Registrations: Aug 25 – Oct 22, 2026 | Case Submission: Nov 5, 2026 | Grand Finale: Dec 2, 2026",
      "assessment_dates": [
        {
          "label": "Round 1: Digital Supply Chain Case Submission",
          "date_if_mentioned": "2026-11-05"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-myntra-hackerramp",
    "title": "Myntra HackerRamp: Campus Edition 2026",
    "type": "hackathon",
    "organizer": "Myntra (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "React Native",
      "Python",
      "Java",
      "Computer Vision",
      "Recommendation Systems"
    ],
    "domain_tags": [
      "Fashion Tech",
      "E-Commerce",
      "High-Scale Systems"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-15T23:59:59Z",
    "eligibility": "Female & Male engineering students graduating in 2026 & 2027",
    "source_url": "https://unstop.com/o/myntra",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "Flagship engineering hackathon creating next-gen shopping experiences, virtual try-ons, and flash-sale microservices.",
      "prize_pool": "INR 4,50,000 + SDE-1 PPIs (CTC ₹28 LPA)",
      "tracks_or_themes": [
          "Virtual Try-On Mirror using 3D Body Reconstruction",
          "High-QPS Cart Checkout Lock-Free Architecture",
          "Fashion Trend Prediction from Social Media Signals",
          "Size Recommendation Engine from Body Measurements",
          "Visual Search: Find-Similar-Look from Photo Upload",
          "Personalized Outfit Generator using Style Graphs",
          "Flash Sale Traffic Spike Load Balancer Design"
        ],
      "team_size": "2-4 members",
      "perks": [
        "Direct SDE-1 PPIs",
        "Top 10 Cash Rewards",
        "Myntra Goodie Kits"
      ],
      "schedule_label": "Registrations: Sep 15 – Nov 15, 2026 | Phase 1 Ideation: Nov 22, 2026 | Grand Finale: Dec 12, 2026",
      "assessment_dates": [
        {
          "label": "Phase 1: FashionTech Ideation Submission",
          "date_if_mentioned": "2026-11-22"
        },
        {
          "label": "Grand Finale Live Hackathon",
          "date_if_mentioned": "2026-12-12"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-ey-techathon",
    "title": "EY Techathon 5.0 — Generative AI & Cyber Resilience",
    "type": "hackathon",
    "organizer": "EY India (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "Generative AI",
      "Cybersecurity",
      "Blockchain",
      "Python",
      "Cloud"
    ],
    "domain_tags": [
      "Enterprise AI",
      "Risk & Cybersecurity",
      "FinTech"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-25T23:59:59Z",
    "eligibility": "Undergraduate & Graduate students across CS, IT, and Cybersecurity",
    "source_url": "https://unstop.com/o/ernst-young-gds-ey-gds",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "Solve real-world industry transformation problems in healthcare, financial crime detection, and autonomous cybersecurity agents.",
      "prize_pool": "INR 3,50,000 + Internships & PPIs with EY Technology Consulting",
      "tracks_or_themes": [
          "Anti-Money Laundering Graph AI Investigator",
          "Autonomous Incident Response Security Bot",
          "Healthcare Claims Fraud Detection Pipeline",
          "Enterprise Document Intelligence with LLM",
          "Supply Chain Risk Assessment Dashboard",
          "Cybersecurity Compliance Audit Automation",
          "ESG Reporting Automation from Annual Reports"
        ],
      "team_size": "3-4 members",
      "perks": [
        "EY Technology Consulting PPIs",
        "National Finalist Certificate",
        "Leadership Network"
      ],
      "schedule_label": "Registrations: Oct 1 – Nov 25, 2026 | Semi-Finals: Dec 8, 2026 | National Finale: Dec 20, 2026",
      "assessment_dates": [
        {
          "label": "Round 1: GenAI Solution Submission",
          "date_if_mentioned": "2026-12-08"
        },
        {
          "label": "Grand Finale Showcase",
          "date_if_mentioned": "2026-12-20"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-aditya-birla-stratos",
    "title": "Aditya Birla Group Stratos 2026 — Tech & Strategy Edition",
    "type": "contest",
    "organizer": "Aditya Birla Group (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "Product Strategy",
      "AI/ML",
      "Automation",
      "Sustainability"
    ],
    "domain_tags": [
      "Industrial Automation",
      "Retail Analytics",
      "Sustainable Manufacturing"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-31T23:59:59Z",
    "eligibility": "Students from engineering & B-school premier programs",
    "source_url": "https://unstop.com/competitions/aditya-birla-group-stratos",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "High-stakes multi-round case and technical challenge addressing global manufacturing, retail operations, and digital platforms.",
      "prize_pool": "INR 7,00,000 + Fast-Track PPIs for Leadership Programs",
      "tracks_or_themes": [
          "Digital Twin of Cement Kiln Operations",
          "Omnichannel D2C Inventory Optimization",
          "Sustainable Fashion: Fabric Waste Reduction AI",
          "Retail Store Planogram Optimization with CV",
          "Industrial Predictive Maintenance with Vibration Sensors",
          "Carbon Emission Tracking for Manufacturing Plants"
        ],
      "team_size": "3 members",
      "perks": [
        "Direct PPIs with ABG Group",
        "Cash Prizes",
        "Mentorship by Business CXOs"
      ],
      "schedule_label": "Registrations: Sep 1 – Oct 31, 2026 | Round 1 Simulation: Nov 10, 2026 | Mumbai Grand Finale: Dec 8, 2026",
      "assessment_dates": [
        {
          "label": "Business & Technology Simulation Round",
          "date_if_mentioned": "2026-11-10"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-jpmc-cfg",
    "title": "JPMorgan Chase Code for Good 2026",
    "type": "hackathon",
    "organizer": "J.P. Morgan",
    "organizer_type": "corporate",
    "tags": [
      "Java",
      "Spring Boot",
      "React",
      "Python",
      "Cloud Native",
      "SQL"
    ],
    "domain_tags": [
      "Social Impact",
      "Financial Inclusion",
      "Full Stack"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-10T23:59:59Z",
    "eligibility": "B.Tech/B.E./MCA students graduating in 2026 & 2027",
    "source_url": "https://careers.jpmorgan.com/global/en/students/programs/code-for-good",
    "extracted_context": {
      "platform": "JPMC Careers",
      "summary": "24-hour hackathon where students collaborate with J.P. Morgan software engineers to build solutions for real NGOs.",
      "prize_pool": "Direct Full-Time SDE & Summer Intern Offers (CTC ₹20+ LPA)",
      "tracks_or_themes": [
          "NGO Beneficiary Tracking & Impact Analytics",
          "Disaster Relief Resource Allocation Optimizer",
          "Financial Literacy Gamification Platform",
          "Microfinance Portfolio Risk Assessment Tool",
          "Volunteer-NGO Matching Platform with Skills Graph",
          "Accessible Banking Interface for Visually Impaired",
          "Rural Education Access Tracker with Geo-Analytics"
        ],
      "team_size": "5-6 members (assigned by JPMC)",
      "perks": [
        "Direct Full-Time / Summer Offers",
        "High-End SWAG Kits",
        "Mentorship from VP Engineers"
      ],
      "schedule_label": "Registrations: Aug 15 – Oct 10, 2026 | Coding Assessment: Oct 18, 2026 | 24h Hackathon: Nov 7–8, 2026",
      "assessment_dates": [
        {
          "label": "Round 1: Coding & Video Assessment",
          "date_if_mentioned": "2026-10-18"
        },
        {
          "label": "24-Hour Live Virtual Hackathon",
          "date_if_mentioned": "2026-11-07"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-kavach-cybersecurity",
    "title": "KAVACH 2026 — National Cybersecurity Hackathon",
    "type": "hackathon",
    "organizer": "Ministry of Home Affairs & AICTE",
    "organizer_type": "government",
    "tags": [
      "Cybersecurity",
      "Network Forensics",
      "Python",
      "C++",
      "Reverse Engineering",
      "Dark Web"
    ],
    "domain_tags": [
      "National Security",
      "AI Cybersecurity",
      "Threat Intelligence"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-28T23:59:59Z",
    "eligibility": "Indian college students enrolled in AICTE/UGC recognized colleges",
    "source_url": "https://kavach.mic.gov.in/",
    "extracted_context": {
      "platform": "Government of India",
      "summary": "National hackathon to identify innovative cyber-security and crime-fighting ideas from the youth of India.",
      "prize_pool": "INR 1,00,000 per problem statement (30+ statements) + MoH Certifications",
      "tracks_or_themes": [
          "Deepfake Video Detection using Frame-Level Analysis",
          "Encrypted Mesh Communication for Law Enforcement",
          "Ransomware Sandbox Detonation & Behavior Analysis",
          "Dark Web Intelligence Crawling & Alert System",
          "Phishing Website Detection with Real-Time ML",
          "Network Forensics: Packet Capture Analysis Dashboard",
          "IoT Device Vulnerability Scanner for Smart Cities",
          "Digital Evidence Chain of Custody on Blockchain"
        ],
      "team_size": "6 members (at least 1 female)",
      "perks": [
        "Direct Govt Law Enforcement PPIs",
        "National Defense Ministry Felicitation",
        "Seed Grants"
      ],
      "schedule_label": "Registrations: Oct 1 – Nov 28, 2026 | 36-Hour Nodal Center Hackathon: Jan 8–9, 2027",
      "assessment_dates": [
        {
          "label": "36-Hour Live Cybersecurity Hackathon",
          "date_if_mentioned": "2027-01-08"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-google-girl-hackathon",
    "title": "Google Girl Hackathon 2026 — India Edition",
    "type": "hackathon",
    "organizer": "Google Careers",
    "organizer_type": "corporate",
    "tags": [
      "Data Structures",
      "Algorithms",
      "System Design",
      "Python",
      "C++",
      "Java"
    ],
    "domain_tags": [
      "Big Tech",
      "Software Engineering",
      "Diversity in Tech"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-10T23:59:59Z",
    "eligibility": "Women students pursuing B.Tech/M.Tech/Dual Degree graduating in 2026, 2027, or 2028",
    "source_url": "https://buildyourfuture.withgoogle.com/events",
    "extracted_context": {
      "platform": "Google Careers",
      "summary": "Flagship technical challenge providing women engineers with a pathway to Google software engineering internships and full-time roles.",
      "prize_pool": "Direct Interviews for Google SWE Summer Intern & L3 Roles + Cash Rewards",
      "tracks_or_themes": [
          "Data Structures: Optimal Solution Challenge",
          "Google-Scale System Design Architecture Sprint",
          "API Design Challenge: RESTful vs GraphQL Trade-offs",
          "Distributed Cache Consistency Problem",
          "Machine Learning Feature Engineering Challenge",
          "Low-Level System Programming: Memory Allocator"
        ],
      "team_size": "Individual or Pairs",
      "perks": [
        "Google SWE Interviews",
        "Google Pixel Devices",
        "Mentorship with Google Staff Engineers"
      ],
      "schedule_label": "Registrations: Sep 20 – Nov 10, 2026 | Round 1 Coding: Nov 20, 2026 | Design Sprint Finale: Dec 8, 2026",
      "assessment_dates": [
        {
          "label": "Round 1: Online Coding Challenge",
          "date_if_mentioned": "2026-11-20"
        },
        {
          "label": "Round 2: Systems Design Sprint Finale",
          "date_if_mentioned": "2026-12-08"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-amazon-ml-challenge",
    "title": "Amazon ML Challenge 2026 — Pan-India",
    "type": "hackathon",
    "organizer": "Amazon India",
    "organizer_type": "corporate",
    "tags": [
      "PyTorch",
      "HuggingFace",
      "Computer Vision",
      "NLP",
      "Machine Learning",
      "Transformers"
    ],
    "domain_tags": [
      "E-Commerce AI",
      "Applied Science",
      "Multimodal Learning"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-18T23:59:59Z",
    "eligibility": "All undergraduate and postgraduate students in Indian colleges",
    "source_url": "https://www.amazon.science/",
    "extracted_context": {
      "platform": "Amazon Science",
      "summary": "Pan-India premier Machine Learning challenge testing deep learning models against real-world Amazon retail product datasets.",
      "prize_pool": "INR 4,50,000 + Amazon Applied Scientist / SDE PPIs + AWS Credits",
      "tracks_or_themes": [
          "Multimodal Product Catalog Classification (Image+Text)",
          "Visual Attribute Extraction from Product Images",
          "Customer Review Sentiment Fine-Grained Analysis",
          "Product Similarity Search using Contrastive Learning",
          "Fake Review Detection with Adversarial Training",
          "Multilingual Product Title Generation with mT5",
          "Delivery Time Prediction with Weather & Traffic Fusion",
          "Product Demand Forecasting with Temporal Attention"
        ],
      "team_size": "3-4 members",
      "perks": [
        "Direct Amazon PPIs",
        "Top 3 Team Trophies",
        "$10,000 AWS Compute Credits"
      ],
      "schedule_label": "Registrations: Sep 10 – Oct 18, 2026 | 48-Hour Machine Learning Sprint: Oct 23–25, 2026",
      "assessment_dates": [
        {
          "label": "48-Hour Machine Learning Hack Sprint",
          "date_if_mentioned": "2026-10-23"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-microsoft-imagine-cup",
    "title": "Microsoft Imagine Cup 2026 — Global World Championship",
    "type": "hackathon",
    "organizer": "Microsoft",
    "organizer_type": "corporate",
    "tags": [
      "Azure AI",
      "OpenAI API",
      "Full Stack",
      "Cloud Architecture",
      "Mobile"
    ],
    "domain_tags": [
      "Global Impact",
      "AI for Good",
      "Entrepreneurship"
    ],
    "tier": "Tier 1",
    "deadline": "2026-12-15T23:59:59Z",
    "eligibility": "Students aged 16+ globally registered in universities",
    "source_url": "https://imaginecup.microsoft.com/",
    "extracted_context": {
      "platform": "Microsoft Student Developer",
      "summary": "The premiere global student technology competition. Build an AI-driven startup on Microsoft Azure.",
      "prize_pool": "USD 100,000 Grand Prize + Mentorship Session with Satya Nadella",
      "tracks_or_themes": [
          "AI-Powered Mental Health Monitoring App",
          "Education Equity: Adaptive Learning for Disabilities",
          "Climate Tech: Carbon Capture Efficiency Optimizer",
          "Healthcare: AI Drug Interaction Checker",
          "Poverty Alleviation: Job Skill Matching Platform",
          "Sustainable Agriculture: Precision Irrigation Controller",
          "Clean Energy: Smart Grid Load Balancer"
        ],
      "team_size": "1-4 members",
      "perks": [
        "$100,000 Cash Prize",
        "1-on-1 with Microsoft CEO",
        "Microsoft for Startups Founders Hub Access ($150,000 Azure credits)"
      ],
      "schedule_label": "Submissions: Sep 1 – Dec 15, 2026 | Regional Semifinals: Jan 20, 2027 | World Finals: May 2027",
      "assessment_dates": [
        {
          "label": "Round 1: AI Minimum Viable Product Submission",
          "date_if_mentioned": "2026-12-15"
        },
        {
          "label": "Regional Semifinals & Live Mentorship",
          "date_if_mentioned": "2027-01-20"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-nasa-space-apps",
    "title": "NASA International Space Apps Challenge 2026",
    "type": "hackathon",
    "organizer": "NASA & Global Space Agencies",
    "organizer_type": "government",
    "tags": [
      "Open Data",
      "Python",
      "Satellite Telemetry",
      "GIS",
      "Web Development"
    ],
    "domain_tags": [
      "Aerospace",
      "Earth Observation",
      "Climate Science"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-08T23:59:59Z",
    "eligibility": "Open to students, developers, scientists, and designers worldwide",
    "source_url": "https://www.spaceappschallenge.org/",
    "extracted_context": {
      "platform": "NASA Open Innovation",
      "summary": "The world's largest annual global hackathon using free and open data from NASA and its nine space agency partners.",
      "prize_pool": "Invitation to view a rocket launch at NASA Kennedy Space Center + Global Awards",
      "tracks_or_themes": [
          "Asteroid Orbit Visualization & Risk Assessment",
          "Ocean Phytoplankton Mapping via Sentinel-2 Imagery",
          "Mars Terrain Classification from Rover Data",
          "Space Debris Collision Probability Calculator",
          "Climate Change Dashboard from MODIS Satellite Data",
          "Solar Flare Prediction from Magnetogram Patterns",
          "Exoplanet Habitability Scoring from Kepler Data",
          "ISS Supply Chain Optimization Simulator"
        ],
      "team_size": "1-6 members",
      "perks": [
        "NASA Launch Viewing Pass",
        "Global Winner Accolade",
        "NASA Media Spotlight"
      ],
      "schedule_label": "Registrations: Aug 1 – Oct 8, 2026 | Global Hackathon Weekend: Oct 10–11, 2026",
      "assessment_dates": [
        {
          "label": "Global Space Apps Hackathon Weekend",
          "date_if_mentioned": "2026-10-10"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-iitr-cognizance",
    "title": "Cognizance 2026 — IIT Roorkee Annual Techfest",
    "type": "hackathon",
    "organizer": "IIT Roorkee",
    "organizer_type": "IIT-fest",
    "tags": [
      "Web3",
      "Machine Learning",
      "Cloud",
      "Cybersecurity",
      "React"
    ],
    "domain_tags": [
      "Techno-Management",
      "Distributed Systems"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-22T23:59:59Z",
    "eligibility": "Enrolled college students across India",
    "source_url": "https://cognizance.org.in/",
    "extracted_context": {
      "platform": "IIT Roorkee",
      "summary": "Celebrated national technical confluence hosting the 'Overnite' 36-hour code marathon and FinTech hackathon.",
      "prize_pool": "INR 15,00,000 total rewards + Seed Funding Grants",
      "tracks_or_themes": [
          "AI for Hydro-Power Plant Energy Optimization",
          "Zero-Knowledge Financial Privacy Protocol",
          "Smart Campus Energy Management System",
          "Autonomous Drone Racing Navigation AI",
          "Real-Time Stock Market Sentiment Dashboard",
          "Decentralized Research Paper Peer Review System",
          "Multi-Language Code Translation with LLMs"
        ],
      "team_size": "2-4 members",
      "perks": [
        "IIT Roorkee Certificate of Excellence",
        "TIDES Incubator Mentorship",
        "Sponsor PPOs"
      ],
      "schedule_label": "Registrations: Oct 1 – Nov 22, 2026 | Abstract Submission: Nov 30, 2026 | Roorkee Grand Finale: Jan 22–24, 2027",
      "assessment_dates": [
        {
          "label": "Round 1: Problem Statement Solution Abstract",
          "date_if_mentioned": "2026-11-30"
        },
        {
          "label": "Grand Finale Hackathon at IIT Roorkee",
          "date_if_mentioned": "2027-01-22"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-iitbhu-technex",
    "title": "Technex 2026 — IIT (BHU) Varanasi",
    "type": "hackathon",
    "organizer": "IIT BHU Varanasi",
    "organizer_type": "IIT-fest",
    "tags": [
      "Machine Learning",
      "System Design",
      "IoT",
      "React",
      "Rust"
    ],
    "domain_tags": [
      "Heritage Techfest",
      "Applied Engineering"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-16T23:59:59Z",
    "eligibility": "All engineering and polytechnic college students",
    "source_url": "https://technex.co.in/",
    "extracted_context": {
      "platform": "IIT BHU",
      "summary": "One of India's oldest technical fests hosting 'Byte the Bits' coding arena and 'Appocalypse' mobile hackathon.",
      "prize_pool": "INR 10,00,000 + Angel Investor Mentorship",
      "tracks_or_themes": [
          "River Cleanliness Satellite Telemetry Dashboard",
          "Decentralized Identity System for Citizens",
          "Heritage Site 3D Reconstruction from Photos",
          "IoT-based Smart Irrigation for Gangetic Plains",
          "Air Quality Prediction with Sensor Fusion",
          "Accessibility Navigation for Visually Impaired in India",
          "Rust-based High-Performance Web Server Challenge"
        ],
      "team_size": "2-4 members",
      "perks": [
        "IIT BHU Incubation Connect",
        "National Trophy",
        "Sponsor PPI Shortlists"
      ],
      "schedule_label": "Registrations: Oct 5 – Nov 16, 2026 | Software Prototype: Nov 28, 2026 | Varanasi Finale: Feb 12–14, 2027",
      "assessment_dates": [
        {
          "label": "Round 1: Software Prototype Review",
          "date_if_mentioned": "2026-11-28"
        },
        {
          "label": "Grand Finale at IIT BHU Varanasi",
          "date_if_mentioned": "2027-02-12"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-nit-trichy-pragyan",
    "title": "Pragyan 2026 — NIT Trichy International Techfest",
    "type": "hackathon",
    "organizer": "NIT Trichy",
    "organizer_type": "IIT-fest",
    "tags": [
      "C++",
      "Java",
      "Python",
      "Blockchain",
      "Cloud",
      "Cybersecurity"
    ],
    "domain_tags": [
      "NIT Flagship Fest",
      "ISO 9001 Certified"
    ],
    "tier": "Tier 1",
    "deadline": "2026-12-08T23:59:59Z",
    "eligibility": "Students from all recognized technical institutions",
    "source_url": "https://pragyan.org/",
    "extracted_context": {
      "platform": "NIT Trichy",
      "summary": "The premier ISO 9001 & 20121 certified annual technical fiesta with participants from 60+ countries.",
      "prize_pool": "INR 14,00,000 across Hackathons and Capture-the-Flag arenas",
      "tracks_or_themes": [
          "Pragyan Hackathon: Full-Stack Innovation Sprint",
          "Capture The Flag: Web Application Security",
          "Blockchain-based Certificate Verification System",
          "Cloud-Native Microservice Orchestration Challenge",
          "AI-Powered Plagiarism Detection Engine",
          "Real-Time Multiplayer Game Server Architecture",
          "Competitive Programming: Algorithmic Optimization"
        ],
      "team_size": "2-4 members",
      "perks": [
        "Pragyan National Trophy",
        "Direct Interview Passes",
        "Sponsor Goodies"
      ],
      "schedule_label": "Registrations: Oct 10 – Dec 8, 2026 | Online CTF & Coding: Dec 15, 2026 | Trichy Finale: Feb 19–21, 2027",
      "assessment_dates": [
        {
          "label": "Round 1: Online Coding & CTF Qualifier",
          "date_if_mentioned": "2026-12-15"
        },
        {
          "label": "Grand Finale Hackathon at NIT Trichy",
          "date_if_mentioned": "2027-02-19"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-nitk-hackverse",
    "title": "Hackverse 5.0 — NITK Surathkal Coastal Hackathon",
    "type": "hackathon",
    "organizer": "NITK Surathkal",
    "organizer_type": "IIT-fest",
    "tags": [
      "Web3",
      "AI/ML",
      "Cloud",
      "Open Source",
      "Next.js",
      "Docker"
    ],
    "domain_tags": [
      "Coastal Hackathon",
      "Full Stack Innovation"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-08T23:59:59Z",
    "eligibility": "College students enrolled anywhere in India",
    "source_url": "https://hackverse.nitk.ac.in/",
    "extracted_context": {
      "platform": "NITK Surathkal",
      "summary": "36-hour nationwide hackathon on the beach campus of NITK Surathkal fostering collaborative open-source and deep-tech prototypes.",
      "prize_pool": "INR 5,00,000 + Sponsor Bounties & Hardware Grants",
      "tracks_or_themes": [
          "Ocean Telemetry & Coastal Ecology Monitoring",
          "Autonomous Agent for Developer Workflow Automation",
          "FinTech: UPI Payment Analytics Dashboard",
          "Web3: Decentralized Governance Voting Platform",
          "Smart Campus: Attendance via Face Recognition",
          "Open Source: Contributing Bot for GitHub Issues",
          "Healthcare: Medical Image Segmentation Challenge"
        ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: October – November 8, 2026 | Hackathon: January 11–12, 2027",
      "status_badge": "Annual Coastal Hackathon (Jan Edition)",
      "deadline_if_mentioned": "2026-11-08",
      "perks": [
        "Travel Reimbursement for Finalists",
        "Direct Sponsor Interviews",
        "Top Tier Cash Prizes"
      ],
      "assessment_dates": [
        {
          "label": "24-Hour Live Coastal Hackathon Weekend",
          "date_if_mentioned": "2026-11-21"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-iiita-hint",
    "title": "HackInTheNorth 7.0 (HINT) — IIIT Allahabad",
    "type": "hackathon",
    "organizer": "IIIT Allahabad",
    "organizer_type": "IIT-fest",
    "tags": [
      "React",
      "Python",
      "Golang",
      "Kubernetes",
      "Generative AI"
    ],
    "domain_tags": [
      "Premier Student Hackathon",
      "Software Architecture"
    ],
    "tier": "Tier 1",
    "deadline": "2027-02-28T23:59:59Z",
    "eligibility": "Students from any collegiate institution across India",
    "source_url": "https://hint.iiita.ac.in/",
    "extracted_context": {
      "platform": "IIIT Allahabad",
      "summary": "One of North India's highest-reputation student hackathons organized by GeekHaven, IIIT-A's technical society.",
      "prize_pool": "INR 4,50,000 + Major League Hacking Partner Bounties",
      "tracks_or_themes": [
          "High-Concurrency Backend: Load Testing Framework",
          "DevOps: Custom Kubernetes Controller for Auto-Scaling",
          "Decentralized AI Model Training with Federated Learning",
          "AI-Powered Resume Parser & Skill Extractor",
          "Real-Time Chat Application with End-to-End Encryption",
          "GraphQL API Generator from Database Schema",
          "Automated Cloud Cost Optimizer with FinOps Insights"
        ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Jan 15 – Feb 28, 2027 | 36-Hour Hackathon Weekend: March 19–21, 2027",
      "status_badge": "Annual GeekHaven Hackathon (Spring)",
      "perks": [
        "Direct PPI passes to startups and unicorns",
        "GeekHaven Exclusive SWAG",
        "Certificate of Honor"
      ],
      "assessment_dates": [
        {
          "label": "36-Hour National Hackathon Weekend",
          "date_if_mentioned": "2027-03-19"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-mnnit-hack36",
    "title": "Hack36 8.0 — MNNIT Allahabad Annual National Hackathon",
    "type": "hackathon",
    "organizer": "MNNIT Allahabad",
    "organizer_type": "IIT-fest",
    "tags": [
      "MERN",
      "Machine Learning",
      "Flutter",
      "Solidity",
      "FastAPI"
    ],
    "domain_tags": [
      "National Collegiate Hackathon",
      "Rapid Prototyping"
    ],
    "tier": "Tier 1",
    "deadline": "2026-12-03T23:59:59Z",
    "eligibility": "Undergraduate students in India",
    "source_url": "https://devfolio.co/hackathons",
    "extracted_context": {
      "platform": "MNNIT Allahabad",
      "summary": "36-hour annual national collegiate hackathon bringing together the brightest coders, designers, and problem solvers.",
      "prize_pool": "INR 3,50,000 + Sponsor Tracks (GitHub, Polygon, Postman)",
      "tracks_or_themes": [
          "EdTech Inclusion: Accessible Learning Platform",
          "Health Informatics: Patient Record Interoperability",
          "Cyber Defense: Intrusion Detection with Anomaly ML",
          "Social Good: Disaster Response Coordination App",
          "Smart Agriculture: Soil Moisture Prediction Model",
          "Content Moderation: Hate Speech Detection System",
          "Mobility: Campus Bus Route Optimization"
        ],
      "team_size": "2-4 members",
      "perks": [
        "Cash Prizes",
        "Postman Student Leader Fast-Track",
        "Direct Interview Opportunities"
      ],
      "schedule_label": "Registrations: Oct 15 – Dec 3, 2026 | 36-Hour Hackathon: Jan 22–24, 2027",
      "assessment_dates": [
        {
          "label": "36-Hour Hackathon & Sponsor Pitches",
          "date_if_mentioned": "2027-01-22"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-ethindia",
    "title": "ETHIndia 2026 — Asia's Largest Web3 & Blockchain Hackathon",
    "type": "hackathon",
    "organizer": "Devfolio / ETHGlobal",
    "organizer_type": "community",
    "tags": [
      "Solidity",
      "Rust",
      "Zero Knowledge",
      "Ethereum",
      "Smart Contracts",
      "Next.js"
    ],
    "domain_tags": [
      "Web3",
      "DeFi",
      "Cryptography"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-10T23:59:59Z",
    "eligibility": "Developers, students, and blockchain architects globally",
    "source_url": "https://ethindia.co/",
    "extracted_context": {
      "platform": "Devfolio",
      "summary": "Asia's flagship Ethereum hackathon hosted in Bengaluru with over 2,000 hackers, world-class mentors, and leading protocols.",
      "prize_pool": "USD 120,000+ (INR 1 Crore+) in sponsor bounties and grants",
      "tracks_or_themes": [
          "DeFi Lending Protocol with Variable Rate Markets",
          "ZK-SNARK Proof Verification Gas Optimizer",
          "Cross-Chain Asset Bridge with Merkle Proofs",
          "Decentralized Exchange with Concentrated Liquidity",
          "Social Recovery Wallet with Multi-Party Computation",
          "On-Chain AI Inference Marketplace",
          "NFT Royalty Enforcement Protocol"
        ],
      "team_size": "1-4 members",
      "perks": [
        "Travel Grants up to ₹15,000",
        "Direct VC Funding for Top Projects",
        "Global Protocol Job Offers"
      ],
      "schedule_label": "Applications: Sep 15 – Nov 10, 2026 | 36-Hour In-Person Hackathon in Bengaluru: Dec 4–6, 2026",
      "assessment_dates": [
        {
          "label": "36-Hour In-Person Web3 Hackathon at KTPO Bengaluru",
          "date_if_mentioned": "2026-12-04"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-hackthisfall",
    "title": "Hack This Fall 2026 — Pan-India Community Hackathon",
    "type": "hackathon",
    "organizer": "Devfolio / Hack This Fall",
    "organizer_type": "community",
    "tags": [
      "Full Stack",
      "Mobile",
      "Generative AI",
      "APIs",
      "DevOps"
    ],
    "domain_tags": [
      "Community Hackathon",
      "Inclusivity in Tech"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-24T23:59:59Z",
    "eligibility": "Open to students, beginners, and seasoned software professionals",
    "source_url": "https://hackthisfall.tech/",
    "extracted_context": {
      "platform": "Devfolio",
      "summary": "One of India's most welcoming and vibrant in-person developer hackathons with massive community participation.",
      "prize_pool": "INR 6,00,000+ Cash and Partner Bounties",
      "tracks_or_themes": [
        "AI for Social Good",
        "Fintech Inclusion",
        "Developer Productivity Tools"
      ],
      "team_size": "2-4 members",
      "perks": [
        "All-inclusive Stay & Food in Delhi NCR",
        "Exclusive Devfolio SWAG",
        "Fast-track Job Pipeline"
      ],
      "schedule_label": "Registrations: Sep 1 – Oct 24, 2026 | Hackathon Weekend: Nov 6–8, 2026",
      "assessment_dates": [
        {
          "label": "Hackathon Build Weekend & Community Pitch",
          "date_if_mentioned": "2026-11-06"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-hackcbs",
    "title": "HackCBS 7.0 — India's Largest Collegiate Hackathon",
    "type": "hackathon",
    "organizer": "Devfolio / SSCBS Delhi University",
    "organizer_type": "community",
    "tags": [
      "React",
      "Python",
      "Cloud",
      "FinTech",
      "AI Agents",
      "SQL"
    ],
    "domain_tags": [
      "Collegiate Hackathon",
      "Delhi University"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-04T23:59:59Z",
    "eligibility": "Students from any accredited university in India and abroad",
    "source_url": "https://hackcbs.tech/",
    "extracted_context": {
      "platform": "Devfolio",
      "summary": "India's largest student-led hackathon held at Shaheed Sukhdev College of Business Studies, Delhi University.",
      "prize_pool": "INR 8,00,000+ in Cash Prizes and Sponsor Bounties",
      "tracks_or_themes": [
        "Open Innovation",
        "GenAI Productivity",
        "Climate Action"
      ],
      "team_size": "2-4 members",
      "perks": [
        "Top Cash Prizes",
        "Direct Interviews with Y Combinator funded startups",
        "Premium SWAG"
      ],
      "schedule_label": "Registrations: Sep 15 – Nov 4, 2026 | 24-Hour Hackathon at SSCBS Delhi: Nov 14–15, 2026",
      "assessment_dates": [
        {
          "label": "24-Hour Live Hackathon & Demo",
          "date_if_mentioned": "2026-11-14"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-dotslash",
    "title": "DotSlash 8.0 — SVNIT Surat National Hackathon",
    "type": "hackathon",
    "organizer": "Devfolio / SVNIT Surat",
    "organizer_type": "IIT-fest",
    "tags": [
      "Machine Learning",
      "Web3",
      "Full Stack",
      "IoT",
      "Mobile"
    ],
    "domain_tags": [
      "National Hackathon",
      "NIT Tech Conclave"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-19T23:59:59Z",
    "eligibility": "College students across India",
    "source_url": "https://hackdotslash.co.in/",
    "extracted_context": {
      "platform": "Devfolio",
      "summary": "30-hour national hackathon hosted at Sardar Vallabhbhai National Institute of Technology (SVNIT), Surat.",
      "prize_pool": "INR 4,00,000+ Prizes & Cloud Credits",
      "tracks_or_themes": [
        "AI in Healthcare",
        "Cybersecurity & Cryptography",
        "Smart Cities"
      ],
      "team_size": "2-4 members",
      "perks": [
        "SVNIT Surat Certificate",
        "Travel Allowance for Finalists",
        "Sponsor Recruitment Leads"
      ],
      "schedule_label": "Registrations: Oct 1 – Nov 19, 2026 | 30-Hour Hackathon: Jan 9–11, 2027",
      "assessment_dates": [
        {
          "label": "30-Hour On-Campus Hackathon",
          "date_if_mentioned": "2027-01-09"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-solana-summer-camp",
    "title": "Solana Global Buildathon 2026 — High-Throughput Web3",
    "type": "hackathon",
    "organizer": "Solana Foundation",
    "organizer_type": "community",
    "tags": [
      "Rust",
      "Solana CLI",
      "TypeScript",
      "Anchor Framework",
      "Web3"
    ],
    "domain_tags": [
      "High-Throughput Cryptography",
      "Global Web3"
    ],
    "tier": "Tier 1",
    "deadline": "2026-12-12T23:59:59Z",
    "eligibility": "Global developers, students, and startups",
    "source_url": "https://solana.com/hackathon",
    "extracted_context": {
      "platform": "Solana Foundation",
      "summary": "Global online hackathon with over 50,000 developers building fast, low-cost decentralized consumer and enterprise applications.",
      "prize_pool": "USD 500,000+ in prizes and direct seed investment tracks",
      "tracks_or_themes": [
        "DePIN (Decentralized Physical Infrastructure)",
        "Consumer Crypto Apps",
        "Payments Infrastructure"
      ],
      "team_size": "1-5 members",
      "perks": [
        "Grand Prize $50,000 USD",
        "Direct Venture Capital Seed Checks",
        "Solana University Fellowship"
      ],
      "schedule_label": "Submissions: Oct 1 – Dec 12, 2026 | Global Demo Day: Jan 15, 2027",
      "assessment_dates": [
        {
          "label": "Round 1: Smart Contract Architecture Submission",
          "date_if_mentioned": "2026-12-12"
        },
        {
          "label": "Global Showcase & Judge Evaluation",
          "date_if_mentioned": "2027-01-15"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-google-step",
    "title": "Google STEP (Student Training in Engineering Program) 2026",
    "type": "internship",
    "organizer": "Google Careers",
    "organizer_type": "corporate",
    "tags": [
      "Data Structures",
      "Algorithms",
      "C++",
      "Java",
      "Python"
    ],
    "domain_tags": [
      "FAANG",
      "Software Engineering Intern"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-30T23:59:59Z",
    "eligibility": "1st and 2nd year undergraduate students in Computer Science and related technical fields",
    "source_url": "https://buildyourfuture.withgoogle.com/programs/step",
    "extracted_context": {
      "platform": "Google Careers",
      "summary": "Google's flagship developmental internship for first- and second-year undergraduate students, offering mentorship and real project ownership.",
      "prize_pool": "Stipend INR 1,20,000/month + Direct Pathway to Google SWE Intern PPO",
      "tracks_or_themes": [
        "Cloud Scalability",
        "Android Core",
        "Internal Developer Tools"
      ],
      "team_size": "Pairs (2 STEP interns per host project)",
      "perks": [
        "Monthly Stipend ₹1.2L",
        "Luxury Corporate Housing & Meals",
        "Executive Mentorship by Google Directors"
      ],
      "schedule_label": "Applications: Sep 1 – Oct 30, 2026 | Online Coding Assessment: Nov 12, 2026 | Interviews: Dec 2026",
      "assessment_dates": [
        {
          "label": "Google STEP Technical Assessment",
          "date_if_mentioned": "2026-11-12"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-tower-research-quant",
    "title": "Tower Research Capital — Campus Quantitative Developer Internship 2026",
    "type": "internship",
    "organizer": "Tower Research Capital",
    "organizer_type": "corporate",
    "tags": [
      "C++20",
      "Low Latency",
      "Linux Kernel",
      "Multithreading",
      "Computer Architecture"
    ],
    "domain_tags": [
      "Quantitative Trading",
      "High Frequency Systems",
      "Ultra Low Latency"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-15T23:59:59Z",
    "eligibility": "Pre-final year undergraduates (B.Tech 3rd year or Dual Degree 4th year) in CS, EE, Math",
    "source_url": "https://www.tower-research.com/careers",
    "extracted_context": {
      "platform": "Tower Research Careers",
      "summary": "Internship with one of the world's highest-paying proprietary quantitative trading firms, building sub-microsecond trading engines.",
      "prize_pool": "Stipend INR 3,00,000/month + Full PPO Offer (CTC ₹80-100+ LPA)",
      "tracks_or_themes": [
        "Zero-Copy Lockless Ring Buffers",
        "Kernel-Bypass Networking (Solarflare EF_VI)"
      ],
      "team_size": "Individual",
      "perks": [
        "Highest Campus Stipend in India",
        "5-Star Corporate Stay",
        "Full-time PPO Fast-Track"
      ],
      "schedule_label": "Applications: Sep 1 – Oct 15, 2026 | Online C++ & Systems Assessment: Oct 22, 2026 | Interviews: Nov 2026",
      "assessment_dates": [
        {
          "label": "Tower Research Systems & Low-Latency Coding Assessment",
          "date_if_mentioned": "2026-10-22"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-apple-intern",
    "title": "Apple Software & Machine Learning Engineering Internship 2026",
    "type": "internship",
    "organizer": "Apple",
    "organizer_type": "corporate",
    "tags": [
      "Swift",
      "C++",
      "CoreML",
      "Python",
      "Operating Systems",
      "Metal"
    ],
    "domain_tags": [
      "Consumer Hardware Tech",
      "Operating Systems",
      "On-Device AI"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-10T23:59:59Z",
    "eligibility": "Undergraduate and Masters students graduating in 2026 or 2027",
    "source_url": "https://www.apple.com/careers/in/students.html",
    "extracted_context": {
      "platform": "Apple University Relations",
      "summary": "Join Apple engineering teams in Hyderabad or Bengaluru working on iOS/macOS system frameworks, CoreML, and Apple Silicon optimization.",
      "prize_pool": "Stipend INR 1,40,000/month + Employee Apple Hardware Discounts + PPO",
      "tracks_or_themes": [
        "On-Device Neural Engine Optimization",
        "Distributed Cloud Media Streaming"
      ],
      "team_size": "Individual",
      "perks": [
        "Apple MacBook Pro & Studio Hardware",
        "Housing Stipend",
        "Mentorship with Principal Apple Engineers"
      ],
      "schedule_label": "Applications: Sep 1 – Nov 10, 2026 | Technical Assessment: Nov 20, 2026 | Engineering Interviews: Dec 2026",
      "assessment_dates": [
        {
          "label": "Apple University Relations Technical Assessment",
          "date_if_mentioned": "2026-11-20"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-solana-radar",
    "title": "Solana Renaissance & Radar Global Hackathon 2026",
    "type": "hackathon",
    "organizer": "Solana Foundation / Colosseum",
    "organizer_type": "open",
    "tags": [
      "Rust",
      "TypeScript",
      "Solana",
      "Next.js",
      "Web3",
      "Distributed Systems"
    ],
    "domain_tags": [
      "DeFi",
      "Payments",
      "Decentralized Physical Infrastructure (DePIN)",
      "AI Agents"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-18T23:59:59Z",
    "eligibility": "Open to student builders, engineers, and founders globally",
    "source_url": "https://colosseum.org/radar",
    "extracted_context": {
      "platform": "Colosseum / Solana",
      "summary": "The world's highest-stakes Web3 hackathon with $1M+ in prizes and seed funding rounds from top crypto venture capital firms.",
      "prize_pool": "$1,000,000+ in Cash Prizes & Bounties + $250,000 Colosseum Accelerator Investment",
      "tracks_or_themes": [
        "Autonomous On-Chain AI Agents",
        "High-Throughput Global Payments",
        "DePIN & Physical Sensors"
      ],
      "team_size": "1-5 members",
      "schedule_label": "Registrations: Open | Virtual Hackathon: October – November",
      "status_badge": "Global $1M+ Prize Pool",
      "perks": [
        "Direct VC Seed Round Pitch",
        "Colosseum Accelerator Admission",
        "$50,000 Track Bounties"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Smart Contract Track Submission",
          "date_if_mentioned": "2026-11-18"
        },
        {
          "label": "Global Showcase & Judge Evaluation",
          "date_if_mentioned": "2026-12-05"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-kaggle-agents",
    "title": "Kaggle AI Agents & LLM Grand Hackathon 2026",
    "type": "hackathon",
    "organizer": "Google DeepMind & Kaggle",
    "organizer_type": "corporate",
    "tags": [
      "Python",
      "PyTorch",
      "HuggingFace",
      "Transformers",
      "LLMs",
      "LangChain",
      "Vector DB"
    ],
    "domain_tags": [
      "Generative AI",
      "Applied Machine Learning",
      "Autonomous Agents"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-28T23:59:59Z",
    "eligibility": "Open to all AI/ML practitioners, students, and research engineers",
    "source_url": "https://www.kaggle.com/competitions",
    "extracted_context": {
      "platform": "Kaggle",
      "summary": "High-adrenaline global AI challenge architecting multi-agent reasoning systems that solve complex automated research and tool invocation tasks.",
      "prize_pool": "$100,000 Total Cash Awards + 10,000 GPU Compute Hours on GCP",
      "tracks_or_themes": [
        "Multi-Agent Reasoning & Tool Use",
        "RAG Precision Benchmarking",
        "Self-Correcting Code Generation"
      ],
      "team_size": "1-4 members",
      "schedule_label": "Submissions: September – November | Evaluation: December",
      "status_badge": "Google DeepMind Partner Track",
      "perks": [
        "Kaggle Grandmaster Points",
        "$100K Cash Pool",
        "Google DeepMind Research Connect"
      ],
      "assessment_dates": [
        {
          "label": "Final Notebook Submission & Benchmark Evaluation",
          "date_if_mentioned": "2026-11-28"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-mlh-ghw",
    "title": "Major League Hacking (MLH) Global Hack Week 2026",
    "type": "hackathon",
    "organizer": "Major League Hacking (MLH)",
    "organizer_type": "open",
    "tags": [
      "Python",
      "JavaScript",
      "React",
      "Docker",
      "APIs",
      "Cloud Native"
    ],
    "domain_tags": [
      "Open Innovation",
      "Developer Community",
      "Cloud Platforms"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-31T23:59:59Z",
    "eligibility": "All undergraduate, graduate students, and early-career software developers worldwide",
    "source_url": "https://globalhackweek.mlh.io/",
    "extracted_context": {
      "platform": "Major League Hacking",
      "summary": "World's largest student hacker community event with live workshops, mentor roundtables, and direct talent partner recruiting.",
      "prize_pool": "$50,000 in Tech Hardware, GitHub Grants & Sponsor Bounties",
      "tracks_or_themes": [
        "AI & Cloud Automation",
        "Web3 Open Source",
        "Beginner-Friendly Build Track"
      ],
      "team_size": "1-4 members",
      "schedule_label": "Monthly Hack Sprints | 24/7 Global Discord Mentorship",
      "status_badge": "Official MLH Member Event",
      "perks": [
        "Official MLH Swag & Hardware",
        "Fast-track Sponsor Interviews",
        "GitHub Student Grants"
      ],
      "assessment_dates": [
        {
          "label": "Global Hack Week Sprint Demo & Showcase",
          "date_if_mentioned": "2026-10-31"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-hackverse-nitk",
    "title": "Hackverse 5.0 — NITK Surathkal 24-Hour National Hackathon",
    "type": "hackathon",
    "organizer": "NIT Karnataka, Surathkal",
    "organizer_type": "IIT-fest",
    "tags": [
      "React",
      "Python",
      "Go",
      "Machine Learning",
      "System Design",
      "Cloud"
    ],
    "domain_tags": [
      "Campus Techfest",
      "Distributed Computing",
      "Smart Cities"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-22T23:59:59Z",
    "eligibility": "Engineering and technology students across all recognized colleges",
    "source_url": "https://hackverse.nitk.ac.in/",
    "extracted_context": {
      "platform": "NITK Surathkal / Devfolio",
      "summary": "Premier coastal national hackathon bringing together passionate developers to solve real enterprise and civic challenges in 24 high-intensity hours.",
      "prize_pool": "INR 4,00,000 Cash Prizes + AWS Credits",
      "tracks_or_themes": [
        "Smart Logistics & Coastline IoT",
        "AI Edge Analytics",
        "Digital Public Goods"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Open | Hackathon Weekend: Late November",
      "status_badge": "Premier NIT Hackathon",
      "perks": [
        "NITK Surathkal Winner Memento",
        "Cloud Subsidies",
        "Startup Incubator Fast-Track"
      ],
      "assessment_dates": [
        {
          "label": "24-Hour Live Coastal Hackathon Weekend",
          "date_if_mentioned": "2026-11-21"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-inout-bangalore",
    "title": "InOut 10.0 — India's Premier Community Hackathon",
    "type": "hackathon",
    "organizer": "Devfolio Community",
    "organizer_type": "open",
    "tags": [
      "Rust",
      "Python",
      "TypeScript",
      "Distributed Systems",
      "AI",
      "PostgreSQL"
    ],
    "domain_tags": [
      "Developer Infrastructure",
      "Deep Tech",
      "Open Source"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-01T23:59:59Z",
    "eligibility": "Curated application review; open to top developers, designers, and systems architects",
    "source_url": "https://hackinout.co/",
    "extracted_context": {
      "platform": "Devfolio",
      "summary": "India's oldest and most prestigious community hackathon with an invite-only cohort of the country's top 200 builders.",
      "prize_pool": "INR 8,00,000+ Direct Cash Grants & Venture Bounties",
      "tracks_or_themes": [
        "Hardcore Systems & Kernel",
        "AI Developer Tooling",
        "Novel UI Paradigms"
      ],
      "team_size": "1-3 members",
      "schedule_label": "Curated Selection: October | Live Hack: Bangalore, November",
      "status_badge": "Invite-Only Top 200 Hackers",
      "perks": [
        "Direct Founder & VC Introductions",
        "Pre-seed Angel Grants",
        "Legendary Devfolio Swag"
      ],
      "assessment_dates": [
        {
          "label": "36-Hour In-Person Community Hackathon at Bangalore",
          "date_if_mentioned": "2026-11-21"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-optum-stratethon",
    "title": "Optum Stratethon Season 6 — HealthTech AI Engineering Track",
    "type": "hackathon",
    "organizer": "Optum (UnitedHealth Group via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "AI/ML",
      "Python",
      "Full Stack",
      "Data Science",
      "Cloud Architecture",
      "Healthcare"
    ],
    "domain_tags": [
      "HealthTech",
      "Clinical AI",
      "Enterprise Scale"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-05T23:59:59Z",
    "eligibility": "Engineering students in 3rd & 4th year and Masters students across India",
    "source_url": "https://unstop.com/hackathons/optum-stratethon",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "Global healthcare tech challenge to design transformative AI patient care, claim processing automation, and clinical predictive models.",
      "prize_pool": "INR 15,00,000 Total Prize Pool + Direct Full-Time & Summer SDE PPIs",
      "tracks_or_themes": [
        "Agentic Medical Claim Validation",
        "Predictive ICU Patient Monitoring",
        "Health Data Interoperability"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Preliminary Rounds: September – October | Grand Finale: November",
      "status_badge": "Direct SDE PPI Track",
      "perks": [
        "Optum SDE-1 PPIs (CTC ₹18-22 LPA)",
        "Global Winner Trophy",
        "Executive Mentorship"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Coding & HealthTech Solution Submission",
          "date_if_mentioned": "2026-11-12"
        },
        {
          "label": "Grand Finale Presentation at Optum Hyderabad",
          "date_if_mentioned": "2026-11-28"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-infosys-hackwithinfy",
    "title": "Infosys HackWithInfy 2026 — National Coding & Hackathon Challenge",
    "type": "hackathon",
    "organizer": "Infosys Campus Connect",
    "organizer_type": "corporate",
    "tags": [
      "Data Structures",
      "Algorithms",
      "Dynamic Programming",
      "Java",
      "Python",
      "C++"
    ],
    "domain_tags": [
      "Competitive Programming",
      "System Architecture",
      "Software Engineering"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-15T23:59:59Z",
    "eligibility": "B.Tech/B.E./M.Tech/MCA students graduating in 2026 or 2027",
    "source_url": "https://www.infosys.com/careers/hackwithinfy.html",
    "extracted_context": {
      "platform": "Infosys Careers",
      "summary": "India's premier flagship coding competition offering direct job offers for Specialist Programmer (SP) and Digital Specialist Engineer (DSE) roles.",
      "prize_pool": "INR 3,50,000 Cash Prizes + Direct Specialist Programmer Offers (CTC ₹9.5 LPA)",
      "tracks_or_themes": [
        "Advanced Algorithmic Problem Solving",
        "24-Hour Grand Finale Hackathon"
      ],
      "team_size": "Individual (Rounds 1 & 2) -> Grand Finale Teams",
      "schedule_label": "Registrations: October – November 15, 2026 | Grand Finale Hackathon: December 2026",
      "status_badge": "Direct Specialist Programmer Job Track",
      "deadline_if_mentioned": "2026-11-15",
      "perks": [
        "Direct Specialist Programmer Offers (₹9.5 LPA)",
        "DSE Offers (₹6.5 LPA)",
        "Top 100 National Recognition"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Individual Coding Assessment",
          "date_if_mentioned": "2026-11-22"
        },
        {
          "label": "Grand Finale: 36-Hour Hackathon & SDE PPIs",
          "date_if_mentioned": "2026-12-14"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-tcs-codevita",
    "title": "TCS CodeVita Season 14 (2026) — The World's Largest Coding Contest",
    "type": "contest",
    "organizer": "Tata Consultancy Services (TCS)",
    "organizer_type": "corporate",
    "tags": [
      "Algorithms",
      "C++",
      "Java",
      "Python",
      "Competitive Programming",
      "Graph Theory"
    ],
    "domain_tags": [
      "Algorithmic Speed Coding",
      "Global Leaderboard"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-20T23:59:59Z",
    "eligibility": "Undergraduate and postgraduate students across any year of study globally",
    "source_url": "https://codevita.tcsapps.com/",
    "extracted_context": {
      "platform": "TCS Campus Portal",
      "summary": "Guinness World Record certified global competitive programming battle connecting over 3,00,000 students from 90+ countries.",
      "prize_pool": "USD 20,000 Total Cash Prizes + Direct TCS Prime & Digital SDE Job Offers",
      "tracks_or_themes": [
        "Global Algorithmic Battle",
        "High-Complexity Logic & Geometry"
      ],
      "team_size": "Individual",
      "schedule_label": "Mock Sprints: October | Round 1: November | Global Finale: Early 2027",
      "status_badge": "Guinness Record Global Contest",
      "perks": [
        "Direct TCS Prime (₹9+ LPA) & Digital Offers",
        "Global World Ranking Certificate",
        "Cash Rewards for Top Coders"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Global Coding Arena",
          "date_if_mentioned": "2026-11-21"
        },
        {
          "label": "Grand Finale at TCS Olympus Mumbai",
          "date_if_mentioned": "2027-02-15"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-cisco-ideathon",
    "title": "Cisco Ideathon 2026 — Secure Connected Systems Track",
    "type": "hackathon",
    "organizer": "Cisco Networking Academy",
    "organizer_type": "corporate",
    "tags": [
      "Python",
      "Computer Networks",
      "Cybersecurity",
      "IoT",
      "Cloud",
      "REST APIs"
    ],
    "domain_tags": [
      "Networking Architecture",
      "Enterprise Security",
      "Cloud DevOps"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-10T23:59:59Z",
    "eligibility": "Pre-final and final year engineering students from Cisco NetAcad partner institutions",
    "source_url": "https://www.netacad.com/",
    "extracted_context": {
      "platform": "Cisco Campus Recruiting",
      "summary": "High-impact ideathon and technical competition leading directly to Consulting Engineer and Software Engineer internships and full-time positions.",
      "prize_pool": "Direct Full-Time SDE & Intern Roles (CTC ₹18-24 LPA) + Cisco Merch Kits",
      "tracks_or_themes": [
        "Zero-Trust Network Telemetry",
        "AI Automated Incident Remediation",
        "5G Open RAN Orchestration"
      ],
      "team_size": "Individual or Pairs",
      "schedule_label": "Aptitude & Coding: October | Hackathon Round: November",
      "status_badge": "Direct SDE Offer Track (₹18-24 LPA)",
      "perks": [
        "Direct SDE Job Offers at Cisco Bangalore",
        "Cisco Certified Specialist Badges",
        "Executive Mentorship"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Online Technical & Aptitude Assessment",
          "date_if_mentioned": "2026-11-18"
        },
        {
          "label": "Round 2: Systems & Networking Hackathon",
          "date_if_mentioned": "2026-11-28"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-adobe-genai",
    "title": "Adobe India GenAI & Creative Cloud Hackathon 2026",
    "type": "hackathon",
    "organizer": "Adobe India",
    "organizer_type": "corporate",
    "tags": [
      "React",
      "Python",
      "Generative AI",
      "Computer Vision",
      "Vector Search",
      "TypeScript"
    ],
    "domain_tags": [
      "Creative Tech",
      "Multimodal AI",
      "Developer APIs"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-25T23:59:59Z",
    "eligibility": "Students pursuing B.Tech/M.Tech/Dual Degree in CS, IT, or related fields",
    "source_url": "https://www.adobe.com/careers.html",
    "extracted_context": {
      "platform": "Adobe University Programs",
      "summary": "Build next-generation creative tooling, generative video workflows, and AI vector search experiences using Adobe Firefly and Creative Cloud APIs.",
      "prize_pool": "INR 6,00,000 + Member of Technical Staff (MTS) Summer Internships",
      "tracks_or_themes": [
        "Generative Video Inpainting",
        "Automated Brand Asset Co-Pilot",
        "Edge Neural Filters"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Idea Phase: October | Final 24h Hackathon: Late November",
      "status_badge": "Adobe MTS PPI Track",
      "perks": [
        "Adobe MTS-1 PPIs (CTC ₹40+ LPA)",
        "Full Creative Cloud Enterprise Licenses",
        "Direct Staff Architect Mentorship"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Creative AI Architecture Blueprint",
          "date_if_mentioned": "2026-11-25"
        },
        {
          "label": "Grand Finale: 24-Hour Live Hackathon",
          "date_if_mentioned": "2026-12-05"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-samsung-solve",
    "title": "Samsung Solve for Tomorrow 2026 — National Youth Innovation",
    "type": "contest",
    "organizer": "Samsung India & Foundation for Innovation and Technology Transfer (FITT), IIT Delhi",
    "organizer_type": "corporate",
    "tags": [
      "AI/ML",
      "IoT",
      "Embedded Systems",
      "Sustainability",
      "HealthTech",
      "Social Innovation"
    ],
    "domain_tags": [
      "National Impact",
      "Hardware-Software Co-Design",
      "Social Tech"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-15T23:59:59Z",
    "eligibility": "Indian youth and college students aged 16 to 22 years",
    "source_url": "https://www.samsung.com/in/solvefortomorrow/",
    "extracted_context": {
      "platform": "Samsung & IIT Delhi",
      "summary": "Flagship national innovation challenge empowering young innovators to solve community problems through STEM prototypes.",
      "prize_pool": "INR 1.5 Crore in Incubation Grants + Samsung Flagship Devices + Study Tour to Samsung Korea HQ",
      "tracks_or_themes": [
        "Community Healthcare Access",
        "Environment & Carbon Reduction",
        "Smart Agricultural Telemetry"
      ],
      "team_size": "1-3 members",
      "schedule_label": "Application Phase: September – October | IIT Delhi Incubation Bootcamp: November",
      "status_badge": "INR 1.5 Cr Grant & Korea Study Tour",
      "perks": [
        "INR 1.5 Crore Seed Incubation Grants",
        "Trip to Samsung HQ in South Korea",
        "Samsung Galaxy Book & Phone Devices"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Concept Video Submission",
          "date_if_mentioned": "2026-10-31"
        },
        {
          "label": "Top 50 Prototype Bootcamp at IIT Delhi",
          "date_if_mentioned": "2026-11-18"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-devpost-agentic",
    "title": "Devpost Global Autonomous AI Agent Sprint 2026",
    "type": "hackathon",
    "organizer": "Devpost & Global AI Alliance",
    "organizer_type": "open",
    "tags": [
      "Python",
      "FastAPI",
      "Next.js",
      "AI Agents",
      "Tool Calling",
      "RAG",
      "Vector DB"
    ],
    "domain_tags": [
      "Autonomous Agents",
      "Enterprise Automation",
      "GenAI APIs"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-30T18:29:59Z",
    "eligibility": "Global open participation for student builders and professional developers",
    "source_url": "https://devpost.com/hackathons",
    "extracted_context": {
      "platform": "Devpost",
      "summary": "Virtual 3-week global buildathon to deploy autonomous agents that execute non-trivial multi-step digital workflows.",
      "prize_pool": "$75,000 in Cash Awards + OpenAI & Anthropic API Credits",
      "tracks_or_themes": [
        "Agentic Business Operations",
        "Autonomous Code Refactoring",
        "AI Financial Auditor"
      ],
      "team_size": "1-4 members",
      "schedule_label": "Virtual Submission Window: October 15 – November 30, 2026",
      "status_badge": "$75,000 Global Cash Track",
      "deadline_if_mentioned": "2026-11-30",
      "perks": [
        "Direct Cash Wire to Winners",
        "Angel Investor Showcase",
        "Free $5,000 API Compute Vouchers"
      ],
      "assessment_dates": [
        {
          "label": "Devpost Working Prototype & Video Pitch Submission",
          "date_if_mentioned": "2026-11-30"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-barclays-hackathon",
    "title": "Barclays Global FinTech Hack-a-thon 2026",
    "type": "hackathon",
    "organizer": "Barclays Technology Centre India",
    "organizer_type": "corporate",
    "tags": [
      "Java",
      "Spring Boot",
      "AWS",
      "Cybersecurity",
      "Microservices",
      "React"
    ],
    "domain_tags": [
      "FinTech",
      "Banking Infrastructure",
      "Resilience Engineering"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-12T23:59:59Z",
    "eligibility": "Engineering students in 3rd & 4th year across India",
    "source_url": "https://joinus.barclays/",
    "extracted_context": {
      "platform": "Barclays Careers",
      "summary": "36-hour code sprint architecting resilient payment engines, real-time AML surveillance, and zero-downtime banking microservices.",
      "prize_pool": "INR 4,50,000 + Direct Graduate Analyst (SDE) Placement PPIs (CTC ₹16-20 LPA)",
      "tracks_or_themes": [
        "High-Concurrency Payment Ledger",
        "Autonomous Fraud Detection Mesh"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Coding Qualifier: October 2026 | Hackathon: Mid-November 2026",
      "status_badge": "Direct Graduate Analyst SDE PPIs",
      "perks": [
        "Direct Graduate Analyst Job Offers",
        "Barclays Innovation Trophy",
        "Executive Mentorship"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Algorithmic Qualifier",
          "date_if_mentioned": "2026-11-18"
        },
        {
          "label": "Grand Finale: 24-Hour FinTech Hackathon",
          "date_if_mentioned": "2026-11-28"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-hackmit-2026",
    "title": "HackMIT 2026 — Global Collegiate Hackathon",
    "type": "hackathon",
    "organizer": "Massachusetts Institute of Technology (MIT)",
    "organizer_type": "open",
    "tags": [
      "Full Stack",
      "Distributed Systems",
      "AI",
      "Mobile",
      "Hardware",
      "APIs"
    ],
    "domain_tags": [
      "Global Collegiate",
      "Applied AI",
      "Deep Tech"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-05T23:59:59Z",
    "eligibility": "Undergraduate students enrolled in universities worldwide (virtual & hybrid)",
    "source_url": "https://hackmit.org/",
    "extracted_context": {
      "platform": "MIT Hackathon Portal",
      "summary": "MIT's flagship annual hackathon bringing together over 1,000 hackers from across the globe to build innovative software and hardware projects.",
      "prize_pool": "$35,000 in Global Category Bounties & Sponsor Recruitment",
      "tracks_or_themes": [
        "AI & Computational Biology",
        "Decentralized Infrastructure",
        "Human-Computer Interaction"
      ],
      "team_size": "1-4 members",
      "schedule_label": "Registrations: Sep 1 – Oct 5, 2026 | Hackathon Weekend: Oct 17 – 18, 2026",
      "status_badge": "MIT Global Virtual Track",
      "perks": [
        "MIT Memento & Hardware Swag",
        "FAANG Sponsor Fast-track Interviews",
        "Global Showcase"
      ],
      "assessment_dates": [
        {
          "label": "HackMIT 36-Hour Hackathon & Demos",
          "date_if_mentioned": "2026-10-17"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-calhacks-13",
    "title": "CalHacks 13.0 — The World's Largest Collegiate Hackathon",
    "type": "hackathon",
    "organizer": "UC Berkeley",
    "organizer_type": "open",
    "tags": [
      "AI Agents",
      "Python",
      "React",
      "Rust",
      "LLMs",
      "Cloud Architecture"
    ],
    "domain_tags": [
      "Silicon Valley Tech",
      "Frontier AI",
      "Open Innovation"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-12T23:59:59Z",
    "eligibility": "College and university students globally",
    "source_url": "https://calhacks.io/",
    "extracted_context": {
      "platform": "CalHacks / UC Berkeley",
      "summary": "36-hour code sprint in San Francisco Bay Area hosting 2,500+ builders with top Silicon Valley founders, venture capitalists, and engineers as mentors.",
      "prize_pool": "$120,000+ in Total Bounties, GPU Credits & Pre-Seed Angel Investments",
      "tracks_or_themes": [
        "Frontier Foundation Models",
        "Autonomous Economic Agents",
        "Spatial Computing & AR"
      ],
      "team_size": "1-4 members",
      "schedule_label": "Applications: Sep 10 – Oct 12, 2026 | 36-Hour Hack: Oct 23 – 25, 2026",
      "status_badge": "$120K+ Bounties & Bay Area VC Connect",
      "perks": [
        "Silicon Valley Investor Demo Day",
        "Free $10,000 Cloud Compute",
        "Direct Founder Fast-Track"
      ],
      "assessment_dates": [
        {
          "label": "CalHacks 36-Hour Hackathon at SF Arena",
          "date_if_mentioned": "2026-10-23"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-hackthisfall-5",
    "title": "HackThisFall 2026 (Season 5) — Nationwide Inclusive Hackathon",
    "type": "hackathon",
    "organizer": "HackThisFall Community & Devfolio",
    "organizer_type": "open",
    "tags": [
      "Next.js",
      "Python",
      "Web3",
      "FastAPI",
      "Docker",
      "DevOps"
    ],
    "domain_tags": [
      "Open Innovation",
      "Community Tech",
      "FinTech"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-28T23:59:59Z",
    "eligibility": "Open to all developers, undergraduate and graduate students in India",
    "source_url": "https://hackthisfall.tech/",
    "extracted_context": {
      "platform": "Devfolio",
      "summary": "One of India's most welcoming and fast-growing national hackathons encouraging diversity, innovative prototypes, and community open-source contributions.",
      "prize_pool": "INR 25,00,000+ in Cash Prizes, Devfolio Track Bounties & Cloud Grants",
      "tracks_or_themes": [
        "Empowering Local SMBs",
        "AI Accessibility Tools",
        "Zero-Knowledge Identity"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Sep 15 – Oct 28, 2026 | Hackathon Weekend: Nov 6 – 8, 2026",
      "status_badge": "Devfolio Premier Community Event",
      "perks": [
        "Devfolio Winner Badges",
        "Startup Job & Internship Fast-track",
        "Curated Swag Packs"
      ],
      "assessment_dates": [
        {
          "label": "HackThisFall 36-Hour Hybrid Hackathon",
          "date_if_mentioned": "2026-11-06"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-juspay-devhack",
    "title": "Juspay Hiring Challenge & DevHack 2026",
    "type": "hackathon",
    "organizer": "Juspay (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "Functional Programming",
      "Haskell",
      "PureScript",
      "Rust",
      "Algorithms",
      "Distributed Systems"
    ],
    "domain_tags": [
      "Payment Infrastructure",
      "High-Throughput Systems",
      "FinTech"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-18T23:59:59Z",
    "eligibility": "Engineering students graduating in 2026 & 2027",
    "source_url": "https://unstop.com/hackathons/juspay-devhack",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "High-caliber engineering challenge for students who love functional programming, low-latency microservices, and massive transaction scale.",
      "prize_pool": "INR 5,00,000 + Direct SDE-1 Job Offers (CTC ₹21-27 LPA)",
      "tracks_or_themes": [
        "Ultra-Low Latency Payment Switch",
        "Fault-Tolerant Distributed State Machine"
      ],
      "team_size": "Individual (Online Coding) -> 24h Hackathon Finalists",
      "schedule_label": "Registrations: Sep 20 – Oct 18, 2026 | 24-hr Hack Sprint: Nov 7 – 8, 2026",
      "status_badge": "Direct SDE-1 Offers (₹21-27 LPA)",
      "perks": [
        "Direct SDE-1 Full-Time Offers",
        "MacBook Air for Top 5 Finalists",
        "Work with India's Top FP Engineers"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Online Coding Challenge",
          "date_if_mentioned": "2026-10-24"
        },
        {
          "label": "24-Hour DevHack Sprint: Functional Programming",
          "date_if_mentioned": "2026-11-07"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-swiggy-gigabyte",
    "title": "Swiggy Gigabyte 2026 — Real-Time Logistics & Quick-Commerce Hackathon",
    "type": "hackathon",
    "organizer": "Swiggy Engineering",
    "organizer_type": "corporate",
    "tags": [
      "Java",
      "Go",
      "Kafka",
      "Geospatial Indexing",
      "Distributed Caching",
      "React"
    ],
    "domain_tags": [
      "Quick Commerce",
      "FoodTech",
      "High-Concurrency Backend"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-22T23:59:59Z",
    "eligibility": "3rd & 4th year undergraduate engineering students across India",
    "source_url": "https://bytes.swiggy.com/",
    "extracted_context": {
      "platform": "Swiggy Engineering / Unstop",
      "summary": "Solve peak-hour 10-minute delivery routing, intelligent driver dispatch, and multi-tenant warehouse sorting under real production constraints.",
      "prize_pool": "INR 6,00,000 + Direct SDE-1 PPIs (CTC ₹26-32 LPA)",
      "tracks_or_themes": [
        "10-Minute Dispatch Optimization",
        "Real-Time Cart Concurrency Locks"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Sep 25 – Oct 22, 2026 | Code Sprint: Nov 14 – 15, 2026",
      "status_badge": "Direct SDE-1 PPIs (₹26-32 LPA)",
      "perks": [
        "Swiggy SDE-1 Pre-Placement Interviews",
        "Direct Principal Engineer Mentorship",
        "Swiggy One Annual Subscriptions"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Logistics & Algorithmic Problem Solving",
          "date_if_mentioned": "2026-10-28"
        },
        {
          "label": "Swiggy Gigabyte 24-Hour Code Sprint",
          "date_if_mentioned": "2026-11-14"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-cred-techathon",
    "title": "CRED Techathon: Curious Minds 2026",
    "type": "hackathon",
    "organizer": "CRED",
    "organizer_type": "startup",
    "tags": [
      "Go",
      "React Native",
      "PostgreSQL",
      "Kafka",
      "Microservices",
      "GenAI"
    ],
    "domain_tags": [
      "Premium FinTech",
      "Design Engineering",
      "Low-Latency Architecture"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-02T23:59:59Z",
    "eligibility": "Engineering students with exceptional design sense and systems programming expertise",
    "source_url": "https://cred.club/careers",
    "extracted_context": {
      "platform": "CRED Careers",
      "summary": "Invite-only engineering and product buildathon designed for students who obsess over 60fps animations, rock-solid security, and elegant architecture.",
      "prize_pool": "INR 10,00,000 + Full-Time SDE Offers (CTC ₹35-45 LPA)",
      "tracks_or_themes": [
        "High-Security Financial Ledger",
        "Zero-Latency Mobile Micro-Animations"
      ],
      "team_size": "1-3 members",
      "schedule_label": "Registrations: Oct 1 – Nov 2, 2026 | 36-Hour Hack: Nov 20 – 22, 2026",
      "status_badge": "Highest FinTech CTC (₹35-45 LPA)",
      "perks": [
        "Direct Full-Time SDE Conversion",
        "Apple Hardware Bundle for Winners",
        "CRED Garage Access"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: System Design & Architecture Assessment",
          "date_if_mentioned": "2026-11-08"
        },
        {
          "label": "CRED Curious Minds 36-Hour Live Hackathon",
          "date_if_mentioned": "2026-11-20"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-zomato-q",
    "title": "ZomatoQ Hackathon 2026 — Next-Gen Systems & Delivery",
    "type": "hackathon",
    "organizer": "Zomato (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "Python",
      "Golang",
      "Microservices",
      "Computer Vision",
      "React",
      "Docker"
    ],
    "domain_tags": [
      "Food Logistics",
      "Hyper-local Supply Chain",
      "Event-Driven Architecture"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-08T23:59:59Z",
    "eligibility": "All undergraduate tech students graduating in 2026 or 2027",
    "source_url": "https://unstop.com/hackathons/zomatoq",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "36-hour code sprint tackling real-time delivery rider pooling, dynamic surge pricing prediction, and automated restaurant prep telemetry.",
      "prize_pool": "INR 7,50,000 + Direct SDE-1 PPIs (CTC ₹28 LPA)",
      "tracks_or_themes": [
        "Intelligent Rider Pooling Engine",
        "Vision-based Kitchen Prep Tracker"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Oct 5 – Nov 8, 2026 | Grand Finale: Nov 28 – 29, 2026",
      "status_badge": "Direct SDE-1 PPIs (₹28 LPA)",
      "perks": [
        "Zomato SDE-1 PPIs",
        "Gold Member Dining Credits",
        "Fast-Track Technical Interviews"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Distributed Routing & Systems Coding",
          "date_if_mentioned": "2026-11-15"
        },
        {
          "label": "ZomatoQ Grand Finale Live Hackathon",
          "date_if_mentioned": "2026-11-28"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-phonepe-scholars",
    "title": "PhonePe Tech Scholars Hackathon 2026",
    "type": "hackathon",
    "organizer": "PhonePe",
    "organizer_type": "corporate",
    "tags": [
      "Java",
      "Spring Boot",
      "Cassandra",
      "Redis",
      "Distributed Transactions",
      "Kubernetes"
    ],
    "domain_tags": [
      "UPI Payments",
      "Distributed Databases",
      "FinTech Scale"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-12T23:59:59Z",
    "eligibility": "Pre-final and final year B.Tech/M.Tech students (2026 & 2027 batches)",
    "source_url": "https://www.phonepe.com/careers/",
    "extracted_context": {
      "platform": "PhonePe University Relations",
      "summary": "Nationwide code challenge tackling high-volume UPI transaction pipelines processing 100,000+ queries per second with 99.999% uptime.",
      "prize_pool": "INR 8,00,000 + Summer SDE Internships (₹1,00,000/mo stipend, CTC ₹33 LPA)",
      "tracks_or_themes": [
        "Distributed Lock-Free Transaction Switch",
        "Real-Time Payment Risk Anomaly Detection"
      ],
      "team_size": "Individual or Pairs",
      "schedule_label": "Registrations: Oct 10 – Nov 12, 2026 | Virtual Hackathon: Dec 5 – 6, 2026",
      "status_badge": "Summer Intern Stipend ₹1,00,000/mo",
      "perks": [
        "Summer Internship + PPO Opportunity (₹33 LPA)",
        "Top 10 Cash Awards",
        "Bangalore Office Tour"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Algorithmic Coding Sprint",
          "date_if_mentioned": "2026-11-19"
        },
        {
          "label": "PhonePe Tech Scholars Virtual Hackathon",
          "date_if_mentioned": "2026-12-05"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-iitr-make4india",
    "title": "Make4India National Hackathon 2026 — IIT Roorkee",
    "type": "hackathon",
    "organizer": "IIT Roorkee",
    "organizer_type": "IIT-fest",
    "tags": [
      "IoT",
      "Python",
      "React",
      "Edge AI",
      "Computer Vision",
      "Embedded C"
    ],
    "domain_tags": [
      "Smart Nation",
      "Industrial Automation",
      "Healthcare"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-14T23:59:59Z",
    "eligibility": "Open to collegiate engineering teams across India",
    "source_url": "https://www.iitr.ac.in/",
    "extracted_context": {
      "platform": "IIT Roorkee / Devfolio",
      "summary": "Flagship overnight 36-hour hackathon challenging students to build hardware and software solutions that power India's digital transformation.",
      "prize_pool": "INR 3,00,000 + IIT Roorkee TIDES Incubation & Hardware Lab Access",
      "tracks_or_themes": [
        "Rural Healthcare Telemetry",
        "Autonomous Agritech Sensors",
        "Smart Grid AI"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Sep 15 – Oct 14, 2026 | 36h Overnight Hack: Oct 24 – 25, 2026",
      "status_badge": "IIT Roorkee Campus Hackathon",
      "perks": [
        "IIT Roorkee Winner Trophy",
        "TIDES Incubation Support",
        "Corporate Sponsor Merch"
      ],
      "assessment_dates": [
        {
          "label": "Make4India 36-Hour Overnight Hackathon at IIT Roorkee",
          "date_if_mentioned": "2026-10-24"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-iitk-acrostic",
    "title": "Techkriti 2026 Hackathon (Acrostic) — IIT Kanpur",
    "type": "hackathon",
    "organizer": "IIT Kanpur",
    "organizer_type": "IIT-fest",
    "tags": [
      "C++",
      "Python",
      "Algorithms",
      "Cybersecurity",
      "Blockchain",
      "Machine Learning"
    ],
    "domain_tags": [
      "Techno-Management Conclave",
      "Deep Tech Innovation"
    ],
    "tier": "Tier 1",
    "deadline": "2026-12-01T23:59:59Z",
    "eligibility": "Undergraduate and postgraduate students across all accredited institutions",
    "source_url": "https://techkriti.org/",
    "extracted_context": {
      "platform": "IIT Kanpur",
      "summary": "Premier competitive hackathon organized as part of Asia's renowned Techkriti festival, testing deep engineering and algorithmic rigor.",
      "prize_pool": "INR 8,00,000 Total Cash Awards + Techkriti National Trophy",
      "tracks_or_themes": [
        "Algorithmic Cryptanalysis",
        "Autonomous Rover Pathfinding",
        "Decentralized File Storage"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Oct 15 – Dec 1, 2026 | Grand Finale: Jan 15 – 17, 2027",
      "status_badge": "IIT Kanpur Flagship Hackathon",
      "perks": [
        "IIT Kanpur Certificate of Excellence",
        "Direct Recruiter Interviews",
        "Free Travel & Stay for Finalists"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Acrostic Problem Statement Submission",
          "date_if_mentioned": "2026-12-08"
        },
        {
          "label": "Techkriti Grand Finale Hackathon at IIT Kanpur",
          "date_if_mentioned": "2027-01-15"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-iitgoa-devhack",
    "title": "DevHack 2026 — IIT Goa Coastal Hackathon",
    "type": "hackathon",
    "organizer": "IIT Goa & Devfolio",
    "organizer_type": "IIT-fest",
    "tags": [
      "Full Stack",
      "Next.js",
      "AI Agents",
      "FastAPI",
      "PostgreSQL",
      "Docker"
    ],
    "domain_tags": [
      "Campus Techfest",
      "Open Innovation",
      "GenAI"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-10T23:59:59Z",
    "eligibility": "Undergraduate and postgraduate students from recognized colleges",
    "source_url": "https://devhack.iitgoa.ac.in/",
    "extracted_context": {
      "platform": "Devfolio",
      "summary": "Annual flagship coastal hackathon combining intense 36-hour software building with beachside networking and founder keynotes.",
      "prize_pool": "INR 3,50,000 in Cash Bounties + Travel Grants",
      "tracks_or_themes": [
        "AI in Sustainable Tourism",
        "Marine Biology Telemetry",
        "Next-Gen Developer Tools"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Oct 1 – Nov 10, 2026 | In-Person Hack: Dec 11 – 13, 2026",
      "status_badge": "IIT Goa Coastal Hackathon",
      "perks": [
        "Direct Sponsor PPIs",
        "Devfolio Track Bounties",
        "Goa Beachside Gala & Networking"
      ],
      "assessment_dates": [
        {
          "label": "DevHack In-Person Coastal Hackathon at IIT Goa",
          "date_if_mentioned": "2026-12-11"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-hackthenorth-2026",
    "title": "Hack the North 2026 — Canada's Biggest Hackathon (Global Virtual)",
    "type": "hackathon",
    "organizer": "University of Waterloo & Techvibes",
    "organizer_type": "open",
    "tags": [
      "React",
      "Python",
      "TypeScript",
      "TensorFlow",
      "GraphQL",
      "Cloud Native"
    ],
    "domain_tags": [
      "Global Collegiate",
      "Applied AI",
      "Developer Ecosystem"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-08T23:59:59Z",
    "eligibility": "Open to university and high school students globally (virtual stream available)",
    "source_url": "https://hackthenorth.com/",
    "extracted_context": {
      "platform": "Waterloo / Global",
      "summary": "Canada's biggest and premier hackathon hosting 1,500+ attendees with keynotes from Silicon Valley founders and top tech firms.",
      "prize_pool": "$50,000+ Hardware, Cloud Vouchers & FAANG Interview Fast-Tracks",
      "tracks_or_themes": [
        "AI Healthcare Interfaces",
        "Augmented Audio Computing",
        "Zero-Carbon Data Pipelines"
      ],
      "team_size": "1-4 members",
      "schedule_label": "Applications: Sep 10 – Oct 8, 2026 | Global Hack: Oct 23 – 25, 2026",
      "status_badge": "Canada's Largest Hackathon",
      "perks": [
        "FAANG Global Recruiter Review",
        "North America Startup Connect",
        "Legendary Swag Package"
      ],
      "assessment_dates": [
        {
          "label": "Hack the North 36-Hour Global Hackathon Weekend",
          "date_if_mentioned": "2026-10-23"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-chainlink-constellation",
    "title": "Chainlink Constellation Global Hackathon 2027",
    "type": "hackathon",
    "organizer": "Chainlink Labs",
    "organizer_type": "open",
    "tags": [
      "Solidity",
      "Rust",
      "Chainlink CCIP",
      "Oracles",
      "TypeScript",
      "AI"
    ],
    "domain_tags": [
      "Cross-Chain Systems",
      "DeFi",
      "Smart Contracts",
      "AI Oracles"
    ],
    "tier": "Tier 1",
    "deadline": "2026-12-15T23:59:59Z",
    "eligibility": "Open to developers and students worldwide",
    "source_url": "https://chain.link/hackathon",
    "extracted_context": {
      "platform": "Chainlink Community",
      "summary": "Premier Web3 and cross-chain hackathon offering massive prizes for applications combining verifiable computation, smart contracts, and AI.",
      "prize_pool": "$500,000 in Total Prizes across Cross-Chain, DeFi & AI Oracle Tracks",
      "tracks_or_themes": [
        "Verifiable AI Agent Oracles",
        "Cross-Chain Tokenized Real World Assets (RWA)",
        "Decentralized Identity"
      ],
      "team_size": "1-5 members",
      "schedule_label": "Registrations: Nov 1 – Dec 15, 2026 | Build Window: Jan 10 – Feb 5, 2027",
      "status_badge": "$500,000 Global Web3 Prize Pool",
      "perks": [
        "Direct Chainlink Labs Grants",
        "Top Tier VC Introductions",
        "Global Virtual Showcase"
      ],
      "assessment_dates": [
        {
          "label": "Chainlink Smart Contract & Oracle Solution Submission",
          "date_if_mentioned": "2027-02-05"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-paytm-codesprint",
    "title": "Paytm Payment Gateway CodeSprint 2026",
    "type": "hackathon",
    "organizer": "One97 Communications / Paytm (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "Java",
      "Node.js",
      "Spring Boot",
      "MySQL",
      "Kafka",
      "Payment Systems"
    ],
    "domain_tags": [
      "FinTech",
      "Payment Gateways",
      "High Scale Backend"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-16T23:59:59Z",
    "eligibility": "Engineering students graduating in 2026 or 2027",
    "source_url": "https://unstop.com/hackathons/paytm-codesprint",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "Build ultra-reliable payment orchestration, instant refund engines, and fraud-resistant merchant APIs under high transactional loads.",
      "prize_pool": "INR 4,00,000 + Core Backend SDE PPIs (CTC ₹16-22 LPA)",
      "tracks_or_themes": [
        "Zero-Drop Webhook Delivery Queue",
        "AI Real-Time Merchant Churn Radar"
      ],
      "team_size": "2-3 members",
      "schedule_label": "Registrations: Oct 12 – Nov 16, 2026 | 24-hr Coding Arena: Nov 28, 2026",
      "status_badge": "Direct Paytm SDE PPIs",
      "perks": [
        "Paytm SDE-1 PPIs (CTC ₹16-22 LPA)",
        "Fast-Track Technical Interviews",
        "Cash Rewards for Top 3 Teams"
      ],
      "assessment_dates": [
        {
          "label": "Paytm Payment Gateway 24-Hour CodeSprint Arena",
          "date_if_mentioned": "2026-11-28"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-npci-upi-hackathon",
    "title": "NPCI National UPI & Digital Payments Hackathon 2026",
    "type": "hackathon",
    "organizer": "NPCI & Reserve Bank Innovation Hub (RBIH)",
    "organizer_type": "government",
    "tags": [
      "Java",
      "Python",
      "Cryptography",
      "Distributed Ledgers",
      "Microservices",
      "Security"
    ],
    "domain_tags": [
      "National Financial Infrastructure",
      "UPI Ecosystem",
      "Fintech Security"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-25T23:59:59Z",
    "eligibility": "Students, researchers, and professional developers across India",
    "source_url": "https://www.npci.org.in/",
    "extracted_context": {
      "platform": "NPCI / Government of India",
      "summary": "Official national hackathon by NPCI to build next-generation offline UPI payments, conversational voice payments, and quantum-safe encryption.",
      "prize_pool": "INR 20,00,000 Grants + Direct Deployment Pilot on NPCI Infrastructure",
      "tracks_or_themes": [
        "Offline NFC/Soundwave Payments",
        "Voice-Activated Multilingual UPI",
        "Post-Quantum Cryptography for Ledgers"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Oct 1 – Nov 25, 2026 | Prototype Demo: Dec 18 – 19, 2026",
      "status_badge": "Official NPCI National Hackathon",
      "deadline_if_mentioned": "2026-11-25",
      "perks": [
        "Direct Pilot on Production UPI Rail",
        "INR 20 Lakhs Total Grants",
        "National RBI/NPCI Felicitation"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: UPI & CBDC Prototype Submission",
          "date_if_mentioned": "2026-12-05"
        },
        {
          "label": "Grand Finale Live Demo with Reserve Bank Innovation Hub",
          "date_if_mentioned": "2026-12-18"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-amazon-hackon-5",
    "title": "Amazon HackOn Season 5 — Flagship National Campus Hackathon",
    "type": "hackathon",
    "organizer": "Amazon India (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "Data Structures",
      "Algorithms",
      "AWS",
      "Machine Learning",
      "Distributed Systems",
      "Java"
    ],
    "domain_tags": [
      "Cloud Scale",
      "E-Commerce Tech",
      "Logistics AI"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-20T23:59:59Z",
    "eligibility": "B.Tech/B.E./M.Tech students graduating in 2026, 2027, or 2028 across all recognized Indian universities",
    "source_url": "https://unstop.com/o/amazon",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "Amazon's flagship nationwide collegiate hackathon designed to test algorithmic problem solving, resilient system architecture, and machine learning at Amazon scale.",
      "prize_pool": "INR 10,00,000 Total Prize Pool + Amazon SDE Internships / PPIs (CTC ₹44 LPA)",
      "tracks_or_themes": [
        "Predictive Supply Chain & Last-Mile Robotics",
        "Next-Gen Generative Shopping Assistant",
        "Ultra-Low Latency Cloud Storage"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Sep 15 – Oct 20, 2026 | Round 1 Coding: Oct 25, 2026 | Finale: Nov 15, 2026",
      "status_badge": "Flagship Amazon SDE PPI Track",
      "difficulty_tier": "high",
      "deadline_if_mentioned": "2026-10-20",
      "assessment_dates": [
        {
          "label": "Round 1: Online Coding Assessment",
          "date_if_mentioned": "2026-10-25"
        },
        {
          "label": "Round 2: Prototype Architecture Evaluation",
          "date_if_mentioned": "2026-11-05"
        },
        {
          "label": "Grand Finale: Amazon Leadership Panel",
          "date_if_mentioned": "2026-11-15"
        }
      ],
      "perks": [
        "Direct SDE-1 PPIs (CTC ₹44 LPA)",
        "Summer 2027 SDE Internships (₹1,10,000/mo stipend)",
        "Top 3 Team Cash Grants up to ₹5 Lakhs",
        "Direct Amazon VP Engineering Mentorship"
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-servicenow-codeathon",
    "title": "ServiceNow Campus Code-a-Thon 2026 — Enterprise Workflow AI",
    "type": "hackathon",
    "organizer": "ServiceNow India (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "JavaScript",
      "Python",
      "Workflows",
      "Enterprise AI",
      "Cloud Architecture",
      "REST APIs"
    ],
    "domain_tags": [
      "Enterprise SaaS",
      "Workflow Automation",
      "AI Agents"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-28T23:59:59Z",
    "eligibility": "Pre-final and final year engineering students in CSE, IT, ECE and circuit branches",
    "source_url": "https://unstop.com/o/servicenow",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "Build intelligent workflow automations, incident triaging bots, and enterprise service management micro-apps using the ServiceNow AI platform.",
      "prize_pool": "INR 5,00,000 Cash + Direct Associate Software Engineer PPIs (CTC ₹28 LPA)",
      "tracks_or_themes": [
        "Autonomous Enterprise IT Incident Resolution",
        "HR Lifecycle Copilots",
        "Secure Zero-Trust Access Orchestration"
      ],
      "team_size": "2-3 members",
      "schedule_label": "Registrations: Oct 1 – Oct 28, 2026 | Round 1 Quiz & Coding: Nov 3, 2026 | Grand Finale: Nov 22, 2026",
      "status_badge": "ServiceNow SDE Track",
      "difficulty_tier": "high",
      "deadline_if_mentioned": "2026-10-28",
      "assessment_dates": [
        {
          "label": "Round 1: Online Coding & System Design Quiz",
          "date_if_mentioned": "2026-11-03"
        },
        {
          "label": "Round 2: Automated Workflow Prototype Submission",
          "date_if_mentioned": "2026-11-12"
        },
        {
          "label": "Grand Finale: Executive Leadership Showcase",
          "date_if_mentioned": "2026-11-22"
        }
      ],
      "perks": [
        "Direct SDE PPI Passes (CTC ₹28 LPA)",
        "ServiceNow Certified System Administrator (CSA) Vouchers",
        "Cash Prizes for Top 5 Teams"
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-adobe-genai-hack",
    "title": "Adobe India GenAI Campus Hackathon 2026",
    "type": "hackathon",
    "organizer": "Adobe India (via Unstop)",
    "organizer_type": "corporate",
    "tags": [
      "Computer Vision",
      "Generative AI",
      "React",
      "Python",
      "WebGL",
      "Media Processing"
    ],
    "domain_tags": [
      "Creative Tech",
      "Document AI",
      "Media Synthesis"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-10T23:59:59Z",
    "eligibility": "Undergraduate and postgraduate students enrolled in recognized Indian technical institutes",
    "source_url": "https://unstop.com/o/adobe",
    "extracted_context": {
      "platform": "Unstop",
      "summary": "Adobe's annual student challenge pushing the boundaries of generative media synthesis, intelligent document interaction, and responsive canvas tooling.",
      "prize_pool": "INR 6,00,000 + Direct Summer SDE Internships (₹1,00,000/mo) & PPO PPIs",
      "tracks_or_themes": [
        "Multimodal Canvas Synthesis",
        "Intelligent PDF Knowledge Graphs",
        "Real-Time Video Enhancers"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Oct 5 – Nov 10, 2026 | Round 1 Creative Coding: Nov 16, 2026 | Finale: Dec 5, 2026",
      "status_badge": "Direct Adobe SDE Internship Track",
      "difficulty_tier": "high",
      "deadline_if_mentioned": "2026-11-10",
      "assessment_dates": [
        {
          "label": "Round 1: Creative Algorithmic Challenge",
          "date_if_mentioned": "2026-11-16"
        },
        {
          "label": "Round 2: Generative Media & PDF Intelligence Prototype",
          "date_if_mentioned": "2026-11-26"
        },
        {
          "label": "Grand Finale: In-Person Showcase at Adobe Noida",
          "date_if_mentioned": "2026-12-05"
        }
      ],
      "perks": [
        "Direct Adobe SDE Internships (₹1,00,000/mo)",
        "Adobe Creative Cloud Annual Enterprise Subscriptions",
        "National Winner Cash Grants up to ₹3 Lakhs"
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-luma-blr-genai",
    "title": "Bengaluru GenAI Builders Sprint 2026 (via Lu.ma)",
    "type": "hackathon",
    "organizer": "AI Builders Hub & Together AI (via Lu.ma)",
    "organizer_type": "community",
    "tags": [
      "Python",
      "PyTorch",
      "FastAPI",
      "Together AI",
      "LLMs",
      "Vector DB",
      "Next.js"
    ],
    "domain_tags": [
      "Frontier AI",
      "Autonomous Agents",
      "Open Source AI"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-18T23:59:59Z",
    "eligibility": "Open to student builders, founders, and engineers (in-person sprint in Bengaluru)",
    "source_url": "https://lu.ma/",
    "extracted_context": {
      "platform": "Lu.ma",
      "summary": "36-hour physical hackathon in Bengaluru hosting 300 curated AI builders to deploy frontier generative applications on open-weights foundation models.",
      "prize_pool": "$25,000 Cash Grants + $50,000 Together AI Compute + Pre-Seed Term Sheets",
      "tracks_or_themes": [
        "Autonomous Multi-Agent Swarms",
        "Domain-Specific SLM Fine-Tuning",
        "Low-Latency Voice Conversational AI"
      ],
      "team_size": "1-4 members",
      "schedule_label": "Registrations: Sep 20 – Oct 18, 2026 | 36h Offline Hackathon: Oct 24–25, 2026",
      "status_badge": "$75,000 Cash & GPU Grants",
      "difficulty_tier": "high",
      "deadline_if_mentioned": "2026-10-18",
      "assessment_dates": [
        {
          "label": "Round 1: Idea Blueprint & GitHub Code Screening",
          "date_if_mentioned": "2026-10-18"
        },
        {
          "label": "Round 2: 36-Hour Offline Buildathon in Indiranagar",
          "date_if_mentioned": "2026-10-24"
        },
        {
          "label": "Grand Finale Demo Day & VC Jury Pitch",
          "date_if_mentioned": "2026-10-25"
        }
      ],
      "perks": [
        "Direct Pre-Seed Term Sheet Pitch to VC Funds",
        "$50,000 Together AI Dedicated GPU Credits",
        "Cash Grants for Top 3 Teams"
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-luma-superteam-solana",
    "title": "Superteam India Solana Web3 Sprint 2026 (via Lu.ma)",
    "type": "hackathon",
    "organizer": "Superteam India & Solana Foundation (via Lu.ma)",
    "organizer_type": "community",
    "tags": [
      "Rust",
      "Solana",
      "Anchor",
      "TypeScript",
      "Next.js",
      "Web3 Security"
    ],
    "domain_tags": [
      "Decentralized Finance",
      "Consumer Web3",
      "Solana Ecosystem"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-04T23:59:59Z",
    "eligibility": "All collegiate and self-taught developers across India",
    "source_url": "https://lu.ma/",
    "extracted_context": {
      "platform": "Lu.ma",
      "summary": "India's highest-velocity Solana developer hackathon targeting high-throughput consumer apps, micro-payments, and verifiable on-chain computation.",
      "prize_pool": "$50,000 in USDC Bounties + Superteam Grants up to $20,000",
      "tracks_or_themes": [
        "Blink Actions & Instant Checkout",
        "Real World Asset Tokenization",
        "Zero-Knowledge State Compression"
      ],
      "team_size": "1-4 members",
      "schedule_label": "Submissions: Oct 1 – Nov 4, 2026 | Virtual Pitch & Demo Day: Nov 14, 2026",
      "status_badge": "$50,000 USDC Bounties Track",
      "difficulty_tier": "high",
      "deadline_if_mentioned": "2026-11-04",
      "assessment_dates": [
        {
          "label": "Round 1: Smart Contract Architecture Review",
          "date_if_mentioned": "2026-11-04"
        },
        {
          "label": "Grand Finale: Virtual Demo Day & Tokenomics Defense",
          "date_if_mentioned": "2026-11-14"
        }
      ],
      "perks": [
        "Direct Superteam Seed Grant Allocations",
        "Fast-Track Introduction to Top Web3 VCs",
        "Exclusive Solana Hacker House Passes"
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-luma-anthropic-claude",
    "title": "Anthropic Claude Agentic Systems Hackathon India (via Lu.ma)",
    "type": "hackathon",
    "organizer": "Anthropic & AWS Builders Community (via Lu.ma)",
    "organizer_type": "community",
    "tags": [
      "Python",
      "Claude 3.7",
      "MCP",
      "FastAPI",
      "Tool Calling",
      "Vector DB",
      "Docker"
    ],
    "domain_tags": [
      "Agentic AI",
      "Model Context Protocol",
      "Enterprise Copilots"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-18T23:59:59Z",
    "eligibility": "Developers and students globally with active virtual participation",
    "source_url": "https://lu.ma/",
    "extracted_context": {
      "platform": "Lu.ma",
      "summary": "Virtual nationwide hackathon to construct enterprise-grade multi-step autonomous agents powered by Claude 3.7 Sonnet and the Model Context Protocol (MCP).",
      "prize_pool": "$40,000 Cash + $100,000 Anthropic API & AWS Cloud Credits",
      "tracks_or_themes": [
        "Enterprise MCP Server Connectors",
        "Autonomous Code Remediation Swarms",
        "Auditable Financial Reasoning Agents"
      ],
      "team_size": "1-4 members",
      "schedule_label": "Submissions: Oct 20 – Nov 18, 2026 | Agent Red-Teaming: Nov 25, 2026 | Finale: Dec 2, 2026",
      "status_badge": "$140,000 Cash & Compute Pool",
      "difficulty_tier": "high",
      "deadline_if_mentioned": "2026-11-18",
      "assessment_dates": [
        {
          "label": "Round 1: MCP & Agent Architecture Submission",
          "date_if_mentioned": "2026-11-18"
        },
        {
          "label": "Round 2: Autonomous Agent Red-Teaming & Stress Testing",
          "date_if_mentioned": "2026-11-25"
        },
        {
          "label": "Grand Finale: Virtual Showcase with Anthropic Research",
          "date_if_mentioned": "2026-12-02"
        }
      ],
      "perks": [
        "$10,000 Free Anthropic API Compute Vouchers",
        "1-on-1 Mentorship with Claude Core Engineers",
        "Direct Cash Wires to Top 3 Teams"
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-hackerearth-ibm-callforcode",
    "title": "IBM Call for Code Global Hackathon 2026 (via HackerEarth)",
    "type": "hackathon",
    "organizer": "IBM & David Clark Cause (via HackerEarth)",
    "organizer_type": "corporate",
    "tags": [
      "Python",
      "Kubernetes",
      "Red Hat OpenShift",
      "watsonx.ai",
      "React",
      "IoT"
    ],
    "domain_tags": [
      "Social Impact Tech",
      "Sustainability",
      "Enterprise Cloud"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-31T23:59:59Z",
    "eligibility": "Open globally to collegiate students and software engineers",
    "source_url": "https://www.hackerearth.com/challenges/hackathon/",
    "extracted_context": {
      "platform": "HackerEarth",
      "summary": "The world's largest humanitarian tech initiative challenging developers to solve climate resilience, clean energy access, and ethical AI using IBM watsonx.",
      "prize_pool": "$285,000 Total Prize Pool ($50,000 Grand Winner) + IBM Incubator Deployment",
      "tracks_or_themes": [
        "Clean Energy Transition",
        "Water Quality Telemetry",
        "Disaster Relief Autonomous Drones"
      ],
      "team_size": "1-5 members",
      "schedule_label": "Registrations: Aug 15 – Oct 31, 2026 | Regional Evaluation: Nov 15, 2026 | Global Awards: Dec 10, 2026",
      "status_badge": "$285,000 Global Prize Pool",
      "difficulty_tier": "high",
      "deadline_if_mentioned": "2026-10-31",
      "assessment_dates": [
        {
          "label": "Round 1: Abstract & Architecture Submission",
          "date_if_mentioned": "2026-10-31"
        },
        {
          "label": "Round 2: Open Source Working Prototype Evaluation",
          "date_if_mentioned": "2026-11-15"
        },
        {
          "label": "Global Awards Ceremony & UN Showcase",
          "date_if_mentioned": "2026-12-10"
        }
      ],
      "perks": [
        "$50,000 USD Grand Prize Direct Cash Wire",
        "Linux Foundation Open Source Governance Support",
        "Direct Global IBM Ecosystem Deployment"
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-hackerearth-amex-makeathon",
    "title": "American Express Makeathon 2026 — Next-Gen FinTech & AI",
    "type": "hackathon",
    "organizer": "American Express (via HackerEarth)",
    "organizer_type": "corporate",
    "tags": [
      "Java",
      "Python",
      "Kafka",
      "PostgreSQL",
      "Machine Learning",
      "Fraud Analytics"
    ],
    "domain_tags": [
      "Financial Services",
      "Transaction Processing",
      "Risk Tech"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-08T23:59:59Z",
    "eligibility": "Engineering students in 3rd & 4th year from recognized institutions across India",
    "source_url": "https://www.hackerearth.com/challenges/hackathon/",
    "extracted_context": {
      "platform": "HackerEarth",
      "summary": "American Express flagship technical challenge targeting zero-latency card fraud detection, merchant underwriting AI, and seamless customer rewards engines.",
      "prize_pool": "INR 5,50,000 Cash + Direct Amex SDE & Data Science PPIs (CTC ₹22 LPA)",
      "tracks_or_themes": [
        "Sub-Millisecond Fraud Scoring",
        "Smart Spending Copilot",
        "High-Throughput Event Streaming"
      ],
      "team_size": "2-3 members",
      "schedule_label": "Registrations: Oct 1 – Nov 8, 2026 | Round 1 Coding: Nov 14, 2026 | Finale: Nov 29, 2026",
      "status_badge": "Direct Amex SDE PPI Track",
      "difficulty_tier": "high",
      "deadline_if_mentioned": "2026-11-08",
      "assessment_dates": [
        {
          "label": "Round 1: Online Coding & Machine Learning Assessment",
          "date_if_mentioned": "2026-11-14"
        },
        {
          "label": "Round 2: FinTech Prototype & High-Throughput Engine Review",
          "date_if_mentioned": "2026-11-22"
        },
        {
          "label": "Grand Finale: Executive Presentation at Gurgaon",
          "date_if_mentioned": "2026-11-29"
        }
      ],
      "perks": [
        "Direct Amex SDE-1 PPI Passes (CTC ₹22 LPA)",
        "INR 3 Lakhs Grand Prize for Winning Team",
        "1-on-1 Amex Leadership Mentorship"
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-hackerearth-socgen-brainwaves",
    "title": "Societe Generale Brainwaves 2026 — Banking & Quant Tech Hackathon",
    "type": "hackathon",
    "organizer": "Societe Generale Global Solution Centre (via HackerEarth)",
    "organizer_type": "corporate",
    "tags": [
      "Python",
      "C++",
      "Java",
      "Time Series",
      "Quantitative Finance",
      "Deep Learning"
    ],
    "domain_tags": [
      "Investment Banking Tech",
      "Algorithmic Trading",
      "Risk Modeling"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-12T23:59:59Z",
    "eligibility": "Undergraduate and postgraduate students in Engineering, Math, and Statistics streams",
    "source_url": "https://www.hackerearth.com/challenges/hackathon/",
    "extracted_context": {
      "platform": "HackerEarth",
      "summary": "Premier investment banking tech hackathon focused on low-latency market order matching, ESG regulatory compliance scoring, and risk analytics.",
      "prize_pool": "INR 4,50,000 Cash + Fast-Track PPIs for Software Engineer & Quant Analyst",
      "tracks_or_themes": [
        "Algorithmic Volatility Forecaster",
        "Automated ESG Regulatory Auditor",
        "High-Frequency Limit Order Book Simulator"
      ],
      "team_size": "1-3 members",
      "schedule_label": "Registrations: Oct 5 – Nov 12, 2026 | Round 1 Coding: Nov 18, 2026 | Finale: Dec 6, 2026",
      "status_badge": "SocGen Quant & SDE Fast-Track",
      "difficulty_tier": "high",
      "deadline_if_mentioned": "2026-11-12",
      "assessment_dates": [
        {
          "label": "Round 1: Algorithmic Coding Sprint & Data Structures",
          "date_if_mentioned": "2026-11-18"
        },
        {
          "label": "Round 2: Quantitative Trading & Risk Intelligence Hack",
          "date_if_mentioned": "2026-11-27"
        },
        {
          "label": "Grand Finale: Live Hackathon at SocGen Bangalore",
          "date_if_mentioned": "2026-12-06"
        }
      ],
      "perks": [
        "Direct SDE / Quant PPI Offers",
        "Cash Prizes for Top 3 Winners",
        "Direct Senior VP Mentorship"
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-hackerearth-capgemini",
    "title": "Capgemini Tech Challenge Season 13 (2026) — National Hackathon",
    "type": "hackathon",
    "organizer": "Capgemini India (via HackerEarth)",
    "organizer_type": "corporate",
    "tags": [
      "Java",
      "Python",
      "Cloud Native",
      "AI/ML",
      "Cybersecurity",
      "DevSecOps"
    ],
    "domain_tags": [
      "Enterprise Transformation",
      "Cyber Defense",
      "Cloud Native"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-22T23:59:59Z",
    "eligibility": "Engineering students across all years and branches from accredited Indian colleges",
    "source_url": "https://www.hackerearth.com/challenges/hackathon/",
    "extracted_context": {
      "platform": "HackerEarth",
      "summary": "Massive multi-stage national technology challenge bringing together 150,000+ engineers to solve mission-critical cloud and security problems.",
      "prize_pool": "INR 15,00,000 Cash Pool + Direct SDE Offers & Fast-Track Leadership Hiring",
      "tracks_or_themes": [
        "AI in Industrial Automation",
        "Zero-Trust Cloud Mesh Security",
        "Green Software Engineering"
      ],
      "team_size": "Individual (Levels 1 & 2) -> 3-5 members (Grand Finale)",
      "schedule_label": "Level 1 & 2 Challenges: Oct 10 – Nov 22, 2026 | Grand Finale Hackathon: Dec 12–13, 2026",
      "status_badge": "INR 15 Lakhs Prize Pool",
      "difficulty_tier": "high",
      "deadline_if_mentioned": "2026-11-22",
      "assessment_dates": [
        {
          "label": "Level 1: Online Technical Aptitude & Coding MCQs",
          "date_if_mentioned": "2026-11-22"
        },
        {
          "label": "Level 2: Advanced Coding Sprint (Cloud & AI)",
          "date_if_mentioned": "2026-11-29"
        },
        {
          "label": "Grand Finale: 24-Hour Live Virtual Team Hackathon",
          "date_if_mentioned": "2026-12-12"
        }
      ],
      "perks": [
        "Fast-track SDE Placement Offers",
        "INR 5 Lakhs National Winner Award",
        "Capgemini Applied Innovation Exchange (AIE) Access"
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-hack2skill-championship",
    "title": "Hack2Skill National Generative AI & Web3 Championship 2026",
    "type": "hackathon",
    "organizer": "Hack2Skill & Government Partner Bodies",
    "organizer_type": "open",
    "tags": [
      "Next.js",
      "Python",
      "Solidity",
      "AI Agents",
      "FastAPI",
      "Vector Search"
    ],
    "domain_tags": [
      "National Innovation",
      "GenAI & Web3",
      "Digital Public Goods"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-15T23:59:59Z",
    "eligibility": "College students, developers, and young entrepreneurs across India",
    "source_url": "https://hack2skill.com/hackathons",
    "extracted_context": {
      "platform": "Hack2Skill",
      "summary": "Flagship national innovation challenge backed by leading tech enterprises and incubator networks to build scalable AI agents and decentralized services.",
      "prize_pool": "INR 8,00,000 Total Cash Awards + Seed Grants + Direct Startup PPIs",
      "tracks_or_themes": [
        "Multilingual Citizen Services AI",
        "Verifiable Decentralized Credentials",
        "Smart AgTech Telemetry"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Oct 1 – Nov 15, 2026 | Prototype Submission: Nov 25, 2026 | Grand Finale: Dec 8, 2026",
      "status_badge": "INR 8 Lakhs National Championship",
      "difficulty_tier": "high",
      "deadline_if_mentioned": "2026-11-15",
      "assessment_dates": [
        {
          "label": "Round 1: Ideation & Architecture Abstract",
          "date_if_mentioned": "2026-11-15"
        },
        {
          "label": "Round 2: MVP GitHub Build & Functional Video Demo",
          "date_if_mentioned": "2026-11-25"
        },
        {
          "label": "Grand Finale: In-Person Jury Showcase at IIT Delhi Research Park",
          "date_if_mentioned": "2026-12-08"
        }
      ],
      "perks": [
        "Direct SDE PPI Passes to Partner Startups",
        "INR 4 Lakhs Grand Champion Trophy",
        "Incubation Support with IIT Delhi TBI"
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-microsoft-copilot-devhack",
    "title": "Microsoft India Copilot Studio & Azure AI Hackathon 2026",
    "type": "hackathon",
    "organizer": "Microsoft India (via Unstop & Microsoft Reactor)",
    "organizer_type": "corporate",
    "tags": [
      "C#",
      "Python",
      "Azure OpenAI",
      "Copilot Studio",
      "Semantic Kernel",
      "TypeScript"
    ],
    "domain_tags": [
      "Enterprise AI",
      "Cloud Intelligence",
      "Generative Solutions"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-28T23:59:59Z",
    "eligibility": "Engineering and computer applications students across all undergraduate and master's programs",
    "source_url": "https://unstop.com/o/microsoft",
    "extracted_context": {
      "platform": "Microsoft Reactor / Unstop",
      "summary": "Official Microsoft India hackathon challenging students to build enterprise Copilot extensions, Semantic Kernel plugins, and autonomous Azure AI agents.",
      "prize_pool": "INR 7,50,000 Cash + Microsoft Azure Fast-Track Interviews & $10,000 Azure Grants",
      "tracks_or_themes": [
          "Custom Copilot Enterprise Plugin for HR Workflows",
          "Multimodal Healthcare Diagnostics with Azure Vision",
          "Semantic Kernel Autonomous Task Orchestration Agent",
          "Azure OpenAI Fine-Tuning Pipeline for Legal Documents",
          "Copilot for Education: AI Teaching Assistant",
          "Power Platform Connector with Natural Language Queries",
          "Responsible AI: Bias Detection in LLM Outputs"
        ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Oct 15 – Nov 28, 2026 | Round 1 Solution Blueprint: Dec 5, 2026 | Finale: Dec 19, 2026",
      "status_badge": "Official Microsoft India Hackathon",
      "difficulty_tier": "high",
      "deadline_if_mentioned": "2026-11-28",
      "assessment_dates": [
        {
          "label": "Round 1: Copilot Solution Architecture & Prototype",
          "date_if_mentioned": "2026-12-05"
        },
        {
          "label": "Grand Finale: Live Pitch to Microsoft Azure Engineering Leadership",
          "date_if_mentioned": "2026-12-19"
        }
      ],
      "perks": [
        "Direct Azure Cloud SDE PPIs",
        "$10,000 Azure Founder Credits",
        "Exclusive Microsoft Reactor Certified Badges",
        "Surface Pro Devices for Grand Winners"
      ]
    },
    "is_active": true
  }
,
  {
    "id": "opp-phonepe-techscholars",
    "title": "PhonePe Tech Scholars Program 2026 — Full Stack Challenge",
    "type": "internship",
    "organizer": "PhonePe",
    "organizer_type": "corporate",
    "tags": [
      "Java",
      "Spring Boot",
      "Kafka",
      "PostgreSQL",
      "React",
      "System Design"
    ],
    "domain_tags": [
      "Fintech",
      "Digital Payments",
      "UPI Infrastructure"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-25T23:59:59Z",
    "eligibility": "Pre-final year B.Tech/M.Tech students from CS/IT/ECE branches",
    "source_url": "https://www.phonepe.com/careers/university/",
    "extracted_context": {
      "platform": "PhonePe Careers",
      "summary": "PhonePe's flagship engineering scholars program selecting top coders for paid summer internships building India's largest UPI payment infrastructure.",
      "prize_pool": "Stipend INR 80,000/month + Full PPO to SDE-1 (CTC ₹28 LPA)",
      "tracks_or_themes": [
        "UPI Transaction Reconciliation at 10 Billion TPS Scale",
        "Real-Time Merchant Analytics Dashboard",
        "Voice-Activated Multilingual UPI Payment Bot",
        "Fraud Ring Detection using Graph Neural Networks",
        "Smart Spending Insights & Personal Finance Copilot",
        "Dynamic QR Code Payment with Offline Fallback",
        "Insurance Claims Auto-Adjudication Pipeline"
      ],
      "team_size": "Individual",
      "schedule_label": "Applications: Sep 15 – Oct 25, 2026 | Coding Assessment: Nov 5, 2026 | Interviews: Dec 2026",
      "perks": [
        "Direct SDE PPO Track",
        "PhonePe Hackathon Invite",
        "Staff Engineer Mentorship"
      ],
      "assessment_dates": [
        {
          "label": "Online Coding Assessment & System Design",
          "date_if_mentioned": "2026-11-05"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-zepto-engineering",
    "title": "Zepto 10-Minute Engineering Challenge 2026",
    "type": "hackathon",
    "organizer": "Zepto",
    "organizer_type": "corporate",
    "tags": [
      "Python",
      "Golang",
      "Redis",
      "Kafka",
      "React",
      "Geospatial"
    ],
    "domain_tags": [
      "Quick Commerce",
      "Logistics AI",
      "Real-Time Systems"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-18T23:59:59Z",
    "eligibility": "Engineering students graduating in 2026 & 2027",
    "source_url": "https://www.zeptonow.com/careers",
    "extracted_context": {
      "platform": "Zepto Engineering",
      "summary": "Build the impossible: solve real Zepto dark-store optimization problems that enable 10-minute grocery delivery across 500+ cities.",
      "prize_pool": "INR 6,00,000 + Direct SDE Offers (CTC ₹30+ LPA)",
      "tracks_or_themes": [
        "Dark Store Inventory Placement Optimizer",
        "Delivery Partner Route Optimization with Live Traffic",
        "Demand Surge Prediction for Perishable Goods",
        "Real-Time Order Batching Algorithm",
        "Computer Vision for Product Freshness Detection",
        "Geo-fenced Dynamic Pricing Engine",
        "Customer Delivery ETA Prediction with Weather Fusion",
        "Warehouse Pick-Path Optimization using TSP Variants"
      ],
      "team_size": "2-3 members",
      "schedule_label": "Registrations: Oct 1 – Nov 18, 2026 | Coding Round: Nov 25 | Finale: Dec 10, 2026",
      "perks": [
        "Direct SDE Offers",
        "MacBook for Winners",
        "Zepto Dark Store Tour"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Algorithmic Logistics Challenge",
          "date_if_mentioned": "2026-11-25"
        },
        {
          "label": "Grand Finale: System Design & Live Coding",
          "date_if_mentioned": "2026-12-10"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-cred-craftsmen",
    "title": "CRED Craftsmen Hackathon 2026 — Fintech Design Sprint",
    "type": "hackathon",
    "organizer": "CRED",
    "organizer_type": "corporate",
    "tags": [
      "Swift",
      "Kotlin",
      "React Native",
      "Python",
      "Design Systems",
      "Animation"
    ],
    "domain_tags": [
      "Fintech",
      "Consumer Apps",
      "Premium UX"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-08T23:59:59Z",
    "eligibility": "College students and recent graduates with design + engineering skills",
    "source_url": "https://cred.club/careers",
    "extracted_context": {
      "platform": "CRED Careers",
      "summary": "CRED's invite-only engineering + design hackathon challenging teams to build premium-grade fintech micro-experiences with pixel-perfect animations.",
      "prize_pool": "INR 5,00,000 + CRED SDE Internships + Apple Products for Winners",
      "tracks_or_themes": [
        "Micro-Animation Framework for Financial Dashboards",
        "Credit Score Gamification with Behavioral Nudges",
        "Voice-Activated Bill Payment UX",
        "AI-Powered Spending Pattern Visualization",
        "Premium Loyalty Reward Recommendation Engine",
        "Gesture-Controlled Financial Data Explorer",
        "Zero-Latency Mobile Micro-Animations with Metal/Vulkan"
      ],
      "team_size": "2-3 members",
      "schedule_label": "Applications: Sep 20 – Nov 8, 2026 | Design Sprint: Nov 20, 2026 | Finale: Dec 5, 2026",
      "perks": [
        "CRED Internship Offers",
        "Apple MacBook/iPad",
        "1-on-1 with CRED Founders"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Design + Code Portfolio Review",
          "date_if_mentioned": "2026-11-15"
        },
        {
          "label": "Grand Finale: Live Design Sprint",
          "date_if_mentioned": "2026-12-05"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-swiggy-bytes",
    "title": "Swiggy Bytes 2026 — Hyperlocal Engineering Hackathon",
    "type": "hackathon",
    "organizer": "Swiggy",
    "organizer_type": "corporate",
    "tags": [
      "Java",
      "Python",
      "Kafka",
      "Elasticsearch",
      "Machine Learning",
      "Microservices"
    ],
    "domain_tags": [
      "Food Tech",
      "Logistics",
      "Hyperlocal Commerce"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-12T23:59:59Z",
    "eligibility": "Engineering students in 3rd & 4th year across India",
    "source_url": "https://careers.swiggy.com/",
    "extracted_context": {
      "platform": "Swiggy Engineering",
      "summary": "Tackle real-world Swiggy scale challenges: 2M+ daily orders, 200K+ restaurants, and sub-30-minute delivery across 600+ cities.",
      "prize_pool": "INR 5,50,000 + SDE-1 PPIs (CTC ₹32 LPA) + Swiggy Credits",
      "tracks_or_themes": [
        "Restaurant Kitchen Prep Time Prediction Model",
        "Dynamic Delivery Partner Assignment with Load Balancing",
        "Food Image Quality Scoring for Menu Listings",
        "Real-Time Surge Pricing for Peak Dinner Hours",
        "Customer Churn Prediction with Behavioral Cohorts",
        "Instamart: Hyperlocal Grocery Demand Forecasting",
        "Vision-based Kitchen Prep Order Tracking",
        "Multi-Restaurant Order Batching Optimization"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Sep 25 – Nov 12, 2026 | Online Round: Nov 20, 2026 | Finale: Dec 8, 2026",
      "perks": [
        "Direct SDE-1 PPIs",
        "₹50,000 Swiggy Credits",
        "Bangalore HQ Tech Tour"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Systems Design & Coding Challenge",
          "date_if_mentioned": "2026-11-20"
        },
        {
          "label": "Grand Finale at Swiggy HQ Bangalore",
          "date_if_mentioned": "2026-12-08"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-groww-fintech-hack",
    "title": "Groww FinTech Frontier Hackathon 2026",
    "type": "hackathon",
    "organizer": "Groww",
    "organizer_type": "corporate",
    "tags": [
      "Java",
      "Go",
      "React",
      "Python",
      "Kafka",
      "Time-Series DB"
    ],
    "domain_tags": [
      "WealthTech",
      "Stock Trading",
      "Investment Platform"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-30T23:59:59Z",
    "eligibility": "B.Tech/M.Tech students passionate about fintech & capital markets",
    "source_url": "https://groww.in/careers",
    "extracted_context": {
      "platform": "Groww Engineering",
      "summary": "Build next-gen investment tools: from real-time stock screeners to AI-powered portfolio advisors for India's 100M+ retail investors.",
      "prize_pool": "INR 4,00,000 + Direct SDE Interviews + Groww Internships",
      "tracks_or_themes": [
        "Real-Time Stock Price Alert Engine with WebSocket",
        "AI Portfolio Advisor for First-Time Investors",
        "Mutual Fund Recommendation with Risk Profiling",
        "Options Strategy Backtesting Simulator",
        "Market Sentiment Analysis from Financial News",
        "Tax-Loss Harvesting Automation Engine",
        "IPO Application Processing at Scale"
      ],
      "team_size": "2-3 members",
      "schedule_label": "Registrations: Sep 10 – Oct 30, 2026 | Round 1: Nov 8, 2026 | Finale: Nov 28, 2026",
      "perks": [
        "SDE Interview Fast-track",
        "Cash Prizes",
        "Groww Premium Subscription"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: FinTech Problem Solving Challenge",
          "date_if_mentioned": "2026-11-08"
        },
        {
          "label": "Grand Finale: Live Trading System Build",
          "date_if_mentioned": "2026-11-28"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-meesho-scale",
    "title": "Meesho Scale Challenge 2026 — Social Commerce Engineering",
    "type": "hackathon",
    "organizer": "Meesho",
    "organizer_type": "corporate",
    "tags": [
      "Python",
      "Java",
      "React",
      "Computer Vision",
      "NLP",
      "Recommendation Systems"
    ],
    "domain_tags": [
      "Social Commerce",
      "E-Commerce",
      "Tier-2 India Tech"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-22T23:59:59Z",
    "eligibility": "Engineering students from any accredited institution",
    "source_url": "https://meesho.io/careers",
    "extracted_context": {
      "platform": "Meesho Engineering",
      "summary": "Solve for 150M+ users in Tier-2 and Tier-3 India: low-bandwidth image search, vernacular commerce, and social-first shopping.",
      "prize_pool": "INR 4,50,000 + Direct SDE Offers + Meesho Goodies",
      "tracks_or_themes": [
        "Low-Bandwidth Image Compression for Product Catalogs",
        "Vernacular (Hindi/Tamil/Bengali) Product Search Engine",
        "Social Sharing Virality Prediction Model",
        "Seller Quality Scoring from Return Rate Patterns",
        "Visual Product Similarity for Catalog Deduplication",
        "Reseller Commission Optimization Algorithm",
        "Multilingual Chatbot for Seller Onboarding Support"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Oct 5 – Nov 22, 2026 | Coding Round: Dec 1, 2026 | Finale: Dec 15, 2026",
      "perks": [
        "SDE Offers",
        "Meesho Merch Kit",
        "Engineering Leadership Mentorship"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Scale Problem Coding Challenge",
          "date_if_mentioned": "2026-12-01"
        },
        {
          "label": "Grand Finale at Meesho HQ",
          "date_if_mentioned": "2026-12-15"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-samsung-prism",
    "title": "Samsung PRISM 2026 — Industry-Academia Research Program",
    "type": "internship",
    "organizer": "Samsung Research India",
    "organizer_type": "corporate",
    "tags": [
      "C++",
      "Python",
      "TensorFlow",
      "5G NR",
      "Edge AI",
      "Computer Vision"
    ],
    "domain_tags": [
      "Consumer Electronics",
      "5G Technology",
      "On-Device AI"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-15T23:59:59Z",
    "eligibility": "3rd & 4th year B.Tech students and M.Tech students in CS/ECE/EE",
    "source_url": "https://www.samsung.com/in/aboutsamsung/careers/",
    "extracted_context": {
      "platform": "Samsung Research India",
      "summary": "6-month mentored industry research program at Samsung R&D Bangalore/Noida working on real product features for Galaxy devices.",
      "prize_pool": "Stipend INR 40,000/month + Samsung Galaxy Devices + Research Publication Support",
      "tracks_or_themes": [
        "On-Device LLM Inference Optimization for Mobile",
        "5G Network Slicing for IoT Applications",
        "Camera ISP Enhancement with Neural Radiance Fields",
        "Bixby Voice Assistant Multilingual NLU",
        "Wearable Health Sensor Anomaly Detection",
        "Galaxy AI: Real-Time Photo Object Removal",
        "Smart TV Content Recommendation with Federated Learning"
      ],
      "team_size": "Individual or Pairs",
      "schedule_label": "Applications: Aug 15 – Oct 15, 2026 | Shortlist: Nov 1, 2026 | Program Starts: Jan 2027",
      "perks": [
        "Research Publication Support",
        "Samsung Galaxy Devices",
        "PPO Consideration for SDE/Researcher Roles"
      ],
      "assessment_dates": [
        {
          "label": "Application Review & Technical Interview",
          "date_if_mentioned": "2026-10-30"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-oracle-code-sprint",
    "title": "Oracle Cloud Code Sprint 2026 — India Campus",
    "type": "hackathon",
    "organizer": "Oracle",
    "organizer_type": "corporate",
    "tags": [
      "Java",
      "Oracle Cloud",
      "Kubernetes",
      "Terraform",
      "Python",
      "SQL"
    ],
    "domain_tags": [
      "Cloud Infrastructure",
      "Enterprise SaaS",
      "Database Engineering"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-05T23:59:59Z",
    "eligibility": "Engineering students graduating in 2026 & 2027 across India",
    "source_url": "https://www.oracle.com/in/careers/students-grads/",
    "extracted_context": {
      "platform": "Oracle University Programs",
      "summary": "Build cloud-native solutions on Oracle Cloud Infrastructure (OCI) solving enterprise database, Kubernetes, and serverless challenges.",
      "prize_pool": "INR 4,00,000 + Direct SDE Interviews + $5,000 OCI Credits",
      "tracks_or_themes": [
        "Autonomous Database Query Optimizer",
        "Kubernetes Operator for Multi-Region Database Failover",
        "Serverless Event-Driven Data Pipeline on OCI",
        "GraalVM Native Image Performance Challenge",
        "Cloud Security: Zero-Trust Network Policy Engine",
        "Infrastructure-as-Code: Terraform Module Generator",
        "AI-Powered SQL Query Suggestion from Natural Language"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Sep 20 – Nov 5, 2026 | Online Sprint: Nov 15, 2026 | Finale: Dec 5, 2026",
      "perks": [
        "Direct SDE Interview Pipeline",
        "OCI Cloud Credits",
        "Oracle Dev Champion Badge"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Cloud-Native Coding Sprint",
          "date_if_mentioned": "2026-11-15"
        },
        {
          "label": "Grand Finale Demo Day",
          "date_if_mentioned": "2026-12-05"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-paytm-insiders",
    "title": "Paytm Insiders Engineering Challenge 2026",
    "type": "hackathon",
    "organizer": "Paytm (One97 Communications)",
    "organizer_type": "corporate",
    "tags": [
      "Java",
      "Node.js",
      "React",
      "MongoDB",
      "Redis",
      "Machine Learning"
    ],
    "domain_tags": [
      "Fintech",
      "Digital Payments",
      "Super App"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-28T23:59:59Z",
    "eligibility": "B.Tech/M.Tech students across India",
    "source_url": "https://paytm.com/careers",
    "extracted_context": {
      "platform": "Paytm Engineering",
      "summary": "Solve super-app scale challenges: from UPI payment splitting to insurance underwriting to event ticketing optimization.",
      "prize_pool": "INR 3,50,000 + SDE Internships + Paytm First Credits",
      "tracks_or_themes": [
        "UPI Payment Split with Smart Bill Detection",
        "Insurance Premium Calculator with Risk ML",
        "Event Ticket Dynamic Pricing Engine",
        "Paytm Wallet: Offline-First Payment Architecture",
        "Merchant Fraud Detection with Behavioral Biometrics",
        "Mini-App Store Discovery & Ranking Algorithm",
        "Multilingual Customer Support Bot with LLM"
      ],
      "team_size": "2-3 members",
      "schedule_label": "Registrations: Sep 10 – Oct 28, 2026 | Coding Round: Nov 5, 2026 | Finale: Nov 22, 2026",
      "perks": [
        "SDE Internship Offers",
        "Paytm First Year Free",
        "Noida HQ Campus Visit"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Super App Problem Solving",
          "date_if_mentioned": "2026-11-05"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-ola-ride-hack",
    "title": "Ola Krutrim AI + Mobility Hackathon 2026",
    "type": "hackathon",
    "organizer": "Ola Electric & Krutrim AI",
    "organizer_type": "corporate",
    "tags": [
      "Python",
      "PyTorch",
      "React",
      "Golang",
      "Geospatial",
      "Edge AI"
    ],
    "domain_tags": [
      "Mobility",
      "Electric Vehicles",
      "Indic AI"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-25T23:59:59Z",
    "eligibility": "Engineering students interested in AI, mobility, and EV technology",
    "source_url": "https://www.olacabs.com/careers",
    "extracted_context": {
      "platform": "Ola Engineering / Krutrim",
      "summary": "Combine Krutrim's Indic LLM capabilities with Ola's mobility platform to build next-gen AI-powered transportation and EV experiences.",
      "prize_pool": "INR 5,00,000 + Krutrim API Credits + Ola EV Scooters for Winners",
      "tracks_or_themes": [
        "Indic Multilingual Voice Navigation (Krutrim LLM)",
        "EV Battery Range Prediction with Driving Pattern ML",
        "Dynamic Ride Pooling Optimization Algorithm",
        "Charging Station Network Placement Optimizer",
        "Real-Time Driver Safety Scoring from Telemetry",
        "Autonomous Fleet Management Simulation",
        "Krutrim AI: Regional Language Customer Support Bot",
        "EV Charging Queue Management & Slot Booking"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Oct 10 – Nov 25, 2026 | Round 1: Dec 3, 2026 | Finale: Dec 18, 2026",
      "perks": [
        "Ola EV S1 Pro for Winners",
        "Krutrim AI API Access",
        "Direct Interviews"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: AI + Mobility Solution Submission",
          "date_if_mentioned": "2026-12-03"
        },
        {
          "label": "Grand Finale at Ola Futurefactory, Krishnagiri",
          "date_if_mentioned": "2026-12-18"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-dream11-sportshack",
    "title": "Dream11 SportsHack 2026 — Fantasy Sports Engineering",
    "type": "hackathon",
    "organizer": "Dream11",
    "organizer_type": "corporate",
    "tags": [
      "Java",
      "Spring Boot",
      "React",
      "Machine Learning",
      "Redis",
      "Kafka"
    ],
    "domain_tags": [
      "Sports Tech",
      "Fantasy Gaming",
      "Real-Time Systems"
    ],
    "tier": "Tier 1",
    "deadline": "2026-10-20T23:59:59Z",
    "eligibility": "Engineering students from accredited Indian universities",
    "source_url": "https://www.dreamsports.group/careers",
    "extracted_context": {
      "platform": "Dream11 Engineering",
      "summary": "Build for 200M+ users: solve real-time contest management, player analytics, and high-throughput systems for India's largest fantasy sports platform.",
      "prize_pool": "INR 6,00,000 + SDE Offers (CTC ₹35+ LPA) + IPL Match Tickets",
      "tracks_or_themes": [
        "Real-Time Fantasy Points Engine with Sub-100ms SLA",
        "Player Performance Prediction with Historical Data ML",
        "Contest Auto-Scaling for IPL Match Day Traffic",
        "Fraud Detection in Fantasy Team Creation Patterns",
        "Live Cricket Score Ingestion & Push Notification Pipeline",
        "Smart Captain Suggestion using Player Form Analytics",
        "Social Fantasy: Friend Group Contest Matching Engine"
      ],
      "team_size": "2-3 members",
      "schedule_label": "Registrations: Sep 5 – Oct 20, 2026 | Coding Challenge: Oct 28, 2026 | Finale: Nov 15, 2026",
      "perks": [
        "Direct SDE Offers",
        "IPL Match Tickets",
        "Dream11 Pro Subscription"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: High-Throughput Systems Challenge",
          "date_if_mentioned": "2026-10-28"
        },
        {
          "label": "Grand Finale: Live System Build at Mumbai HQ",
          "date_if_mentioned": "2026-11-15"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-nit-warangal-technozion",
    "title": "Technozion 2026 — NIT Warangal National Techfest",
    "type": "hackathon",
    "organizer": "NIT Warangal",
    "organizer_type": "IIT-fest",
    "tags": [
      "Full Stack",
      "Python",
      "Machine Learning",
      "IoT",
      "Flutter",
      "Cloud"
    ],
    "domain_tags": [
      "NIT Premier Fest",
      "Innovation Sprint"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-10T23:59:59Z",
    "eligibility": "All enrolled college students across India",
    "source_url": "https://technozion.org/",
    "extracted_context": {
      "platform": "NIT Warangal",
      "summary": "Premier South-Central India techfest hosting competitive coding, AI/ML challenges, and a 36-hour on-campus hackathon.",
      "prize_pool": "INR 4,00,000 + Sponsor Interview Passes + NIT Warangal Merit Certificate",
      "tracks_or_themes": [
        "Smart Agriculture: Crop Disease Detection from Drone Imagery",
        "Traffic Accident Hotspot Prediction for Hyderabad",
        "Flood Early Warning System with IoT Sensor Fusion",
        "Telangana Heritage Site Virtual Tour with WebXR",
        "E-Governance: Aadhaar-linked Service Delivery Platform",
        "Student Mental Health Tracking with Mood Analytics",
        "Campus Energy Optimization with Smart Metering"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Sep 20 – Nov 10, 2026 | Online Qualifier: Nov 18, 2026 | Warangal Finale: Dec 12-14, 2026",
      "perks": [
        "NIT Warangal Merit Certificate",
        "Direct Sponsor Interviews",
        "Cash Prizes"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Online Algorithmic Qualifier",
          "date_if_mentioned": "2026-11-18"
        },
        {
          "label": "36-Hour Grand Finale at NIT Warangal",
          "date_if_mentioned": "2026-12-12"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-iit-kanpur-techkriti",
    "title": "IIT Kanpur Techkriti 2026 — Hackathon & Coding Arena",
    "type": "hackathon",
    "organizer": "IIT Kanpur",
    "organizer_type": "IIT-fest",
    "tags": [
      "C++",
      "Python",
      "Rust",
      "Competitive Programming",
      "AI/ML",
      "Blockchain"
    ],
    "domain_tags": [
      "Premier IIT Fest",
      "Deep Tech Innovation"
    ],
    "tier": "Tier 1",
    "deadline": "2026-12-05T23:59:59Z",
    "eligibility": "Undergraduate and postgraduate students globally",
    "source_url": "https://techkriti.org/",
    "extracted_context": {
      "platform": "IIT Kanpur",
      "summary": "North India's most prestigious technical and entrepreneurship fest hosting the legendary 'Bits & Bytes' programming championship.",
      "prize_pool": "INR 6,00,000 + Startup Incubation at SIIC IIT Kanpur + Cloud Credits",
      "tracks_or_themes": [
        "Competitive Programming: Advanced Graph Algorithms",
        "Autonomous Drone Navigation in GPS-Denied Environments",
        "Blockchain-based Supply Chain Traceability System",
        "Quantum Computing Simulation Challenge",
        "AI Agent for Automated Bug Triaging in Open Source",
        "Decentralized Federated Learning Framework",
        "Edge AI: Real-Time Emotion Detection on Raspberry Pi",
        "Compiler Construction: Custom Language Interpreter"
      ],
      "team_size": "1-4 members",
      "schedule_label": "Registrations: Oct 15 – Dec 5, 2026 | Coding Qualifier: Dec 12, 2026 | Kanpur Finale: Feb 5-7, 2027",
      "perks": [
        "SIIC Incubation Fast-track",
        "IIT Kanpur Certificate of Excellence",
        "VC Network Access"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Online Coding & ML Challenge",
          "date_if_mentioned": "2026-12-12"
        },
        {
          "label": "Grand Finale at IIT Kanpur Campus",
          "date_if_mentioned": "2027-02-05"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-iit-guwahati-techniche",
    "title": "IIT Guwahati Techniche 2026 — NE India Tech Hackathon",
    "type": "hackathon",
    "organizer": "IIT Guwahati",
    "organizer_type": "IIT-fest",
    "tags": [
      "Python",
      "React",
      "TensorFlow",
      "Flutter",
      "Cloud",
      "NLP"
    ],
    "domain_tags": [
      "IIT Premier Fest",
      "North-East India Tech"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-15T23:59:59Z",
    "eligibility": "Students from engineering and science backgrounds across India",
    "source_url": "https://techniche.org/",
    "extracted_context": {
      "platform": "IIT Guwahati",
      "summary": "North-East India's largest technical festival featuring the popular 'Eureka' innovation challenge and 36-hour Code-a-thon.",
      "prize_pool": "INR 3,50,000 + IIT Guwahati Incubation + Cloud Credits",
      "tracks_or_themes": [
        "Brahmaputra Flood Prediction using Satellite + IoT Data",
        "NE India Wildlife Conservation Tracking System",
        "Tea Garden Yield Optimization with Remote Sensing",
        "Assamese/Bengali Language NLP Chatbot",
        "Rural Healthcare Telemedicine Platform",
        "Eco-Tourism Recommendation Engine for NE India",
        "Bamboo Supply Chain Digitization Platform"
      ],
      "team_size": "2-4 members",
      "schedule_label": "Registrations: Sep 25 – Nov 15, 2026 | Qualifier: Nov 25, 2026 | Campus Finale: Jan 10-12, 2027",
      "perks": [
        "IIT Guwahati Certificate",
        "Travel Reimbursement for Finalists",
        "Incubation Access"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Online Innovation Qualifier",
          "date_if_mentioned": "2026-11-25"
        },
        {
          "label": "Grand Finale at IIT Guwahati",
          "date_if_mentioned": "2027-01-10"
        }
      ]
    },
    "is_active": true
  },
  {
    "id": "opp-visa-codevoyage",
    "title": "Visa CodeVoyage 2026 — Global Payments Innovation Challenge",
    "type": "hackathon",
    "organizer": "Visa",
    "organizer_type": "corporate",
    "tags": [
      "Java",
      "Python",
      "REST APIs",
      "Cryptography",
      "Cloud",
      "Blockchain"
    ],
    "domain_tags": [
      "Payments Technology",
      "Financial Infrastructure",
      "Digital Commerce"
    ],
    "tier": "Tier 1",
    "deadline": "2026-11-08T23:59:59Z",
    "eligibility": "Engineering students in 3rd & 4th year from top Indian colleges",
    "source_url": "https://www.visa.co.in/careers/students.html",
    "extracted_context": {
      "platform": "Visa Innovation Center",
      "summary": "Build next-gen payment solutions using Visa's developer APIs: from tap-to-phone to cross-border CBDC settlements.",
      "prize_pool": "INR 4,50,000 + Direct Visa SDE PPIs (CTC ₹40+ LPA) + Visa Gift Cards",
      "tracks_or_themes": [
        "Tap-to-Phone: NFC Payment Emulator for Small Merchants",
        "Cross-Border CBDC Settlement Protocol Design",
        "Tokenization Service for Recurring Subscription Payments",
        "AI-Powered Transaction Anomaly Detection Engine",
        "Visa Direct: Real-Time Person-to-Person Transfer UX",
        "Merchant Category Auto-Classification with NLP",
        "Payment Dispute Resolution Bot with LLM"
      ],
      "team_size": "2-3 members",
      "schedule_label": "Registrations: Sep 15 – Nov 8, 2026 | API Challenge: Nov 18, 2026 | Finale: Dec 5, 2026",
      "perks": [
        "Direct Visa SDE PPIs",
        "Visa Gift Cards",
        "Bangalore Innovation Center Tour"
      ],
      "assessment_dates": [
        {
          "label": "Round 1: Visa API Integration Challenge",
          "date_if_mentioned": "2026-11-18"
        },
        {
          "label": "Grand Finale: Payment Solution Demo",
          "date_if_mentioned": "2026-12-05"
        }
      ]
    },
    "is_active": true
  }
];

export const DEMO_STUDENT_PROFILE: StudentProfileData = {
  candidate_id: "student-demo",
  skills: [
    { name: "React", level: "Advanced" },
    { name: "Next.js", level: "Advanced" },
    { name: "TypeScript", level: "Advanced" },
    { name: "Python", level: "Intermediate" },
    { name: "AI/ML", level: "Intermediate" },
    { name: "PostgreSQL", level: "Advanced" },
    { name: "Cloud", level: "Intermediate" },
    { name: "FastAPI", level: "Intermediate" }
  ],
  past_projects: [
    {
      title: "Autonomous Payment Recovery Agent",
      tech_stack: ["Next.js", "Python", "LangChain", "Razorpay API"],
      description: "Built an intelligent AI agent that detects churn patterns and triggers personalized recovery workflows."
    },
    {
      title: "Distributed Edge Sensor Pipeline",
      tech_stack: ["Go", "MQTT", "PostgreSQL", "Docker"],
      description: "Real-time telemetry collection and anomaly detection for IoT industrial sensors."
    }
  ],
  target_roles: ["Full Stack Engineer", "AI/ML Engineer", "SDE Intern"],
  target_companies_or_events: ["Smart India Hackathon", "Flipkart GRiD", "Razorpay AI Buildathon", "Google"],
  availability: "Summer 2026 / Immediate",
  risk_appetite: "Aggressive",
  profile_summary: "3rd Year Computer Science student passionate about full-stack engineering, distributed systems, and agentic AI. Built automated recovery bots and scalable cloud applications."
};

// In-memory persistent caches for resilience
const inMemoryProfiles: Map<string, StudentProfileData> = new Map([
  ["student-demo", DEMO_STUDENT_PROFILE]
]);
const inMemoryOpportunities: Map<string, OpportunityData> = new Map(
  INITIAL_SEED_OPPORTUNITIES.map(o => [o.id!, o])
);
const inMemoryRecommendations: Map<string, any[]> = new Map();

// ── Radar Scan Timestamp Tracking ──
let lastRadarScanAt: string | null = null;

export function getLastRadarScanTimestamp(): string | null {
  return lastRadarScanAt;
}

export function setLastRadarScanTimestamp(isoDate: string): void {
  lastRadarScanAt = isoDate;
}

export async function getStudentProfile(candidateId: string): Promise<StudentProfileData | null> {
  // 1. Check in-memory cache first
  const mem = inMemoryProfiles.get(candidateId);
  if (mem) return mem;

  // 2. Try Supabase
  try {
    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("candidate_id", candidateId)
      .maybeSingle();

    if (data && !error) {
      const p: StudentProfileData = {
        candidate_id: data.candidate_id,
        skills: data.skills || [],
        past_projects: data.past_projects || [],
        target_roles: data.target_roles || [],
        target_companies_or_events: data.target_companies_or_events || [],
        availability: data.availability || "",
        risk_appetite: data.risk_appetite || "Moderate",
        profile_summary: data.profile_summary || ""
      };
      inMemoryProfiles.set(candidateId, p);
      return p;
    }
  } catch (err) {
    // Fall back to memory
  }

  // 3. Fallback to default demo profile so opportunities/suggestions never fail
  return inMemoryProfiles.get("student-demo") || DEMO_STUDENT_PROFILE;
}

export async function upsertStudentProfile(profile: StudentProfileData): Promise<StudentProfileData> {
  // 1. Try Supabase
  try {
    const { data, error } = await supabase
      .from("student_profiles")
      .upsert(
        {
          candidate_id: profile.candidate_id,
          skills: profile.skills,
          past_projects: profile.past_projects,
          target_roles: profile.target_roles,
          target_companies_or_events: profile.target_companies_or_events,
          availability: profile.availability,
          risk_appetite: profile.risk_appetite,
          profile_summary: profile.profile_summary,
          updated_at: new Date().toISOString()
        },
        { onConflict: "candidate_id" }
      )
      .select()
      .maybeSingle();

    if (data && !error) {
      inMemoryProfiles.set(profile.candidate_id, profile);
      return profile;
    }
  } catch (err) {
    // Fallback to memory
  }

  // 2. Fallback to memory
  inMemoryProfiles.set(profile.candidate_id, profile);
  return profile;
}


export async function getAllOpportunities(): Promise<OpportunityData[]> {
  // 1. Initialize map with all seed & in-memory opportunities
  const combinedMap = new Map<string, OpportunityData>();
  for (const opp of INITIAL_SEED_OPPORTUNITIES) {
    const sanitized = { ...opp, source_url: getSafeOpportunityUrl(opp.source_url, opp.organizer, opp.title) };
    if (sanitized.id) combinedMap.set(sanitized.id, sanitized);
    if (sanitized.title) combinedMap.set(`title:${sanitized.title.toLowerCase().trim()}`, sanitized);
  }
  for (const [id, opp] of inMemoryOpportunities.entries()) {
    combinedMap.set(id, { ...opp, source_url: getSafeOpportunityUrl(opp.source_url, opp.organizer, opp.title) });
  }

  // 2. Try Supabase and overlay
  try {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0 && !error) {
      for (const d of data) {
        const item: OpportunityData = {
          id: d.id,
          title: d.title,
          type: d.type,
          organizer: d.organizer,
          organizer_type: d.organizer_type,
          tags: d.tags || [],
          domain_tags: d.domain_tags || [],
          tier: d.tier || "Tier 2",
          deadline: d.deadline,
          eligibility: d.eligibility,
          source_url: getSafeOpportunityUrl(d.source_url, d.organizer, d.title),
          extracted_context: d.extracted_context || {},
          is_active: d.is_active !== false
        };
        combinedMap.set(d.id, item);
      }
    }
  } catch (err) {
    // Fall back to memory
  }

  // Return unique opportunities
  const unique = new Map<string, OpportunityData>();
  for (const [k, v] of combinedMap.entries()) {
    if (k.startsWith("title:")) continue;
    unique.set(v.title || v.id || k, v);
  }
  return Array.from(unique.values());
}

export async function insertOpportunity(opp: OpportunityData): Promise<OpportunityData> {
  const id = opp.id || `opp-${Date.now()}`;
  const safeUrl = getSafeOpportunityUrl(opp.source_url, opp.organizer, opp.title);
  const fullOpp = { ...opp, id, source_url: safeUrl, created_at: new Date().toISOString() };

  // 1. Try Supabase
  try {
    const { data, error } = await supabase
      .from("opportunities")
      .insert({
        title: fullOpp.title,
        type: fullOpp.type,
        organizer: fullOpp.organizer,
        organizer_type: fullOpp.organizer_type,
        tags: fullOpp.tags,
        domain_tags: fullOpp.domain_tags,
        tier: fullOpp.tier,
        deadline: fullOpp.deadline,
        eligibility: fullOpp.eligibility,
        source_url: fullOpp.source_url,
        extracted_context: fullOpp.extracted_context,
        is_active: fullOpp.is_active ?? true
      })
      .select()
      .maybeSingle();

    if (data && !error) {
      inMemoryOpportunities.set(data.id, { ...fullOpp, id: data.id });
      return { ...fullOpp, id: data.id };
    }
  } catch (err) {
    // Fall back
  }

  // 2. Memory
  inMemoryOpportunities.set(id, fullOpp);
  return fullOpp;
}

export async function saveRecommendations(
  candidateId: string,
  recs: Array<{ opportunity_id: string; fit_score: number; reasoning: string; opportunity: OpportunityData }>
): Promise<void> {
  inMemoryRecommendations.set(candidateId, recs);

  // Try Supabase if student profile UUID exists
  try {
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("candidate_id", candidateId)
      .maybeSingle();

    if (profile?.id) {
      for (const r of recs) {
        // If opportunity_id is a valid UUID, upsert
        if (r.opportunity_id.match(/^[0-9a-fA-F-]{36}$/)) {
          await supabase
            .from("recommendations")
            .upsert(
              {
                student_id: profile.id,
                opportunity_id: r.opportunity_id,
                fit_score: r.fit_score,
                reasoning: r.reasoning,
                status: "recommended"
              },
              { onConflict: "student_id,opportunity_id" }
            );
        }
      }
    }
  } catch (err) {
    // Fallback handled via memory
  }
}

export async function getOpportunityById(id: string): Promise<OpportunityData | null> {
  // 1. Try Supabase
  try {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (data && !error) {
      return {
        id: data.id,
        title: data.title,
        type: data.type,
        organizer: data.organizer,
        organizer_type: data.organizer_type,
        tags: data.tags || [],
        domain_tags: data.domain_tags || [],
        tier: data.tier || "Tier 2",
        deadline: data.deadline,
        eligibility: data.eligibility,
        source_url: getSafeOpportunityUrl(data.source_url, data.organizer, data.title),
        extracted_context: data.extracted_context || {},
        is_active: data.is_active !== false
      };
    }
  } catch (err) {
    // fallback
  }

  // 2. Memory
  const mem = inMemoryOpportunities.get(id);
  if (mem) {
    return {
      ...mem,
      source_url: getSafeOpportunityUrl(mem.source_url, mem.organizer, mem.title)
    };
  }
  return null;
}

export async function updateOpportunityExtractedContext(
  id: string,
  newContext: Record<string, any>
): Promise<void> {
  // Update memory
  const existing = inMemoryOpportunities.get(id);
  if (existing) {
    existing.extracted_context = {
      ...(existing.extracted_context || {}),
      ...newContext
    };
    inMemoryOpportunities.set(id, existing);
  }

  // Update Supabase
  try {
    await supabase
      .from("opportunities")
      .update({ extracted_context: existing?.extracted_context || newContext })
      .eq("id", id);
  } catch (err) {
    // Handled
  }
}

const inMemoryProjectSuggestions: Map<string, any> = new Map();

export async function getProjectSuggestions(
  studentId: string,
  opportunityId: string
): Promise<any | null> {
  const key = `${studentId}:${opportunityId}`;
  return inMemoryProjectSuggestions.get(key) || null;
}

export function getAllPreviousProjectTitles(studentId: string): string[] {
  const titles: string[] = [];
  for (const [key, value] of inMemoryProjectSuggestions.entries()) {
    if (key.startsWith(`${studentId}:`)) {
      const projects = value?.projects || [];
      for (const p of projects) {
        if (p?.title) titles.push(p.title);
      }
    }
  }
  return titles;
}

export async function saveProjectSuggestions(
  studentId: string,
  opportunityId: string,
  suggestionJson: any
): Promise<void> {
  const key = `${studentId}:${opportunityId}`;
  inMemoryProjectSuggestions.set(key, suggestionJson);

  // Try Supabase if both are valid UUIDs
  try {
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("candidate_id", studentId)
      .maybeSingle();

    const studentProfileId = profile?.id || studentId;

    if (studentProfileId.match(/^[0-9a-fA-F-]{36}$/) && opportunityId.match(/^[0-9a-fA-F-]{36}$/)) {
      await supabase
        .from("project_suggestions")
        .upsert(
          {
            student_id: studentProfileId,
            opportunity_id: opportunityId,
            suggestion_json: suggestionJson,
            created_at: new Date().toISOString()
          },
          { onConflict: "student_id,opportunity_id" }
        );
    }
  } catch (err) {
    // handled
  }
}

// ─────────────────────────────────────────────────────────────
// Personal Events & Applications Shared Data Store
// ─────────────────────────────────────────────────────────────

export interface PersonalEvent {
  id: string;
  student_id: string;
  title: string;
  event_date: string; // YYYY-MM-DD
  event_type: 'exam' | 'reminder' | 'practice_session' | 'other';
  notes?: string;
  linked_opportunity_id?: string;
  is_dismissed?: boolean;
  snoozed_until?: string | null; // YYYY-MM-DD
  created_at?: string;
}

export interface ApplicationRecord {
  id: string;
  student_id: string;
  opportunity_id: string;
  stage: "Bookmarked" | "Applied" | "Interviewing" | "Offer" | "Rejected";
  notes?: string;
  deadline_reminder_at?: string;
  updated_at: string;
  opportunity?: OpportunityData | null;
}

// Global in-memory storage fallback for resilient execution across API calls
const inMemoryPersonalEvents: Map<string, PersonalEvent[]> = new Map();
const inMemoryApplicationsStore: Map<string, ApplicationRecord[]> = new Map();

export async function getPersonalEvents(studentId: string): Promise<PersonalEvent[]> {
  // 1. Try Supabase
  try {
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("candidate_id", studentId)
      .maybeSingle();

    const spId = profile?.id;
    let query = supabase.from("personal_events").select("*");
    if (spId) {
      query = query.or(`student_id.eq.${spId},student_id.eq.${studentId}`);
    } else {
      query = query.eq("student_id", studentId);
    }

    const { data, error } = await query;
    if (data && !error && data.length > 0) {
      const mergedMap = new Map<string, PersonalEvent>();
      for (const d of data) {
        mergedMap.set(d.id, {
          id: d.id,
          student_id: d.student_id,
          title: d.title,
          event_date: d.event_date,
          event_type: d.event_type,
          notes: d.notes,
          linked_opportunity_id: d.linked_opportunity_id,
          is_dismissed: Boolean(d.is_dismissed),
          snoozed_until: d.snoozed_until,
          created_at: d.created_at
        });
      }
      // Also merge any memory events
      const memList = inMemoryPersonalEvents.get(studentId) || [];
      for (const m of memList) {
        if (!mergedMap.has(m.id)) mergedMap.set(m.id, m);
      }
      return Array.from(mergedMap.values());
    }
  } catch (err) {
    // Fall back to memory
  }

  return inMemoryPersonalEvents.get(studentId) || [];
}

export async function createPersonalEvent(
  eventData: Omit<PersonalEvent, "id" | "created_at">
): Promise<PersonalEvent> {
  const newId = `pevt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newEvent: PersonalEvent = {
    ...eventData,
    id: newId,
    is_dismissed: false,
    snoozed_until: null,
    created_at: new Date().toISOString()
  };

  // 1. Save in memory
  const existing = inMemoryPersonalEvents.get(eventData.student_id) || [];
  inMemoryPersonalEvents.set(eventData.student_id, [...existing, newEvent]);

  // 2. Try Supabase
  try {
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("candidate_id", eventData.student_id)
      .maybeSingle();

    const studentUuid = profile?.id;
    if (studentUuid && studentUuid.match(/^[0-9a-fA-F-]{36}$/)) {
      const { data, error } = await supabase
        .from("personal_events")
        .insert({
          student_id: studentUuid,
          title: eventData.title,
          event_date: eventData.event_date,
          event_type: eventData.event_type,
          notes: eventData.notes || null,
          linked_opportunity_id: eventData.linked_opportunity_id && eventData.linked_opportunity_id.match(/^[0-9a-fA-F-]{36}$/)
            ? eventData.linked_opportunity_id
            : null,
          is_dismissed: false,
          snoozed_until: null
        })
        .select()
        .maybeSingle();

      if (data && !error) {
        newEvent.id = data.id;
      }
    }
  } catch (err) {
    // handled
  }

  return newEvent;
}

export async function snoozePersonalEvent(id: string, untilDate: string): Promise<boolean> {
  // Update in memory across all students
  for (const [studentId, list] of inMemoryPersonalEvents.entries()) {
    const idx = list.findIndex(e => e.id === id);
    if (idx !== -1) {
      list[idx].snoozed_until = untilDate;
      inMemoryPersonalEvents.set(studentId, [...list]);
      break;
    }
  }

  // Update Supabase if UUID
  try {
    if (id.match(/^[0-9a-fA-F-]{36}$/)) {
      await supabase
        .from("personal_events")
        .update({ snoozed_until: untilDate })
        .eq("id", id);
    }
  } catch (err) {
    // handled
  }

  return true;
}

export async function dismissPersonalEvent(id: string): Promise<boolean> {
  // Update in memory
  for (const [studentId, list] of inMemoryPersonalEvents.entries()) {
    const idx = list.findIndex(e => e.id === id);
    if (idx !== -1) {
      list[idx].is_dismissed = true;
      inMemoryPersonalEvents.set(studentId, [...list]);
      break;
    }
  }

  // Update Supabase if UUID
  try {
    if (id.match(/^[0-9a-fA-F-]{36}$/)) {
      await supabase
        .from("personal_events")
        .update({ is_dismissed: true })
        .eq("id", id);
    }
  } catch (err) {
    // handled
  }

  return true;
}

export async function getApplicationsStore(candidateId: string): Promise<ApplicationRecord[]> {
  // 1. Try Supabase
  try {
    const { data, error } = await supabase
      .from("applications")
      .select(`
        id,
        student_id,
        opportunity_id,
        stage,
        notes,
        deadline_reminder_at,
        updated_at
      `);

    if (data && !error && data.length > 0) {
      const enriched = await Promise.all(
        data.map(async (app: any) => ({
          ...app,
          opportunity: await getOpportunityById(app.opportunity_id)
        }))
      );
      return enriched;
    }
  } catch (err) {
    // fall back
  }

  // 2. Memory fallback & Auto-seed for newly onboarded students
  let apps = inMemoryApplicationsStore.get(candidateId) || [];
  if (apps.length === 0) {
    // Auto-seed Flipkart GRiD (Bookmarked), Walmart SDE Sprint (Applied), Walmart CodeHers (Bookmarked), and Tata Imagination
    const gridOpp = await getOpportunityById("opp-flipkart-grid");
    const walmartSdeOpp = await getOpportunityById("opp-walmart-sde-sprint");
    const walmartCodehersOpp = await getOpportunityById("opp-walmart-codehers");
    const tataOpp = await getOpportunityById("opp-tata-imagination");

    apps = [
      {
        id: `app-seed-0`,
        student_id: candidateId,
        opportunity_id: "opp-flipkart-grid",
        stage: "Bookmarked",
        notes: "Targeting SDE-1 PPI via GenAI track.",
        updated_at: new Date().toISOString(),
        opportunity: gridOpp
      },
      {
        id: `app-seed-1`,
        student_id: candidateId,
        opportunity_id: "opp-walmart-sde-sprint",
        stage: "Applied",
        notes: "Application submitted for Fall Campus SDE Hiring Sprint 2026.",
        updated_at: new Date().toISOString(),
        opportunity: walmartSdeOpp
      },
      {
        id: `app-seed-2`,
        student_id: candidateId,
        opportunity_id: "opp-walmart-codehers",
        stage: "Bookmarked",
        notes: "Targeting CodeHers 2027 Diversity Summer Internship track (Feb-March 2027).",
        updated_at: new Date().toISOString(),
        opportunity: walmartCodehersOpp
      },
      {
        id: `app-seed-3`,
        student_id: candidateId,
        opportunity_id: "opp-tata-imagination",
        stage: "Bookmarked",
        notes: "Campus Innovation Track.",
        updated_at: new Date().toISOString(),
        opportunity: tataOpp
      }
    ];
    inMemoryApplicationsStore.set(candidateId, apps);
  } else {
    // Always refresh linked opportunity object to ensure zero date lag or stale cached deadlines
    apps = await Promise.all(
      apps.map(async (app) => {
        const fresh = await getOpportunityById(app.opportunity_id);
        return {
          ...app,
          opportunity: fresh || app.opportunity
        };
      })
    );
    inMemoryApplicationsStore.set(candidateId, apps);
  }

  return apps;
}

export async function upsertApplicationRecord(
  candidateId: string,
  opportunityId: string,
  stage: ApplicationRecord["stage"],
  notes?: string
): Promise<ApplicationRecord> {
  const opp = await getOpportunityById(opportunityId);
  const updatedApp: ApplicationRecord = {
    id: `app-${Date.now()}`,
    student_id: candidateId,
    opportunity_id: opportunityId,
    stage,
    notes: notes || "",
    updated_at: new Date().toISOString(),
    opportunity: opp
  };

  const existing = inMemoryApplicationsStore.get(candidateId) || [];
  const filtered = existing.filter(a => a.opportunity_id !== opportunityId);
  inMemoryApplicationsStore.set(candidateId, [...filtered, updatedApp]);

  // Update Supabase if possible
  try {
    if (opportunityId.match(/^[0-9a-fA-F-]{36}$/)) {
      await supabase
        .from("applications")
        .upsert(
          {
            student_id: candidateId,
            opportunity_id: opportunityId,
            stage,
            notes: notes || "",
            updated_at: new Date().toISOString()
          },
          { onConflict: "student_id,opportunity_id" }
        );
    }
  } catch (err) {
    // handled
  }

  return updatedApp;
}

export async function deleteApplicationRecord(
  candidateId: string,
  appIdOrOppId: string
): Promise<boolean> {
  const existing = inMemoryApplicationsStore.get(candidateId) || [];
  const updated = existing.filter(
    a => a.id !== appIdOrOppId && a.opportunity_id !== appIdOrOppId
  );
  inMemoryApplicationsStore.set(candidateId, updated);

  try {
    if (appIdOrOppId.match(/^[0-9a-fA-F-]{36}$/)) {
      await supabase
        .from("applications")
        .delete()
        .or(`id.eq.${appIdOrOppId},opportunity_id.eq.${appIdOrOppId}`)
        .eq("student_id", candidateId);
    }
  } catch (err) {
    // handled
  }

  return true;
}

export async function updateApplicationStage(
  candidateId: string,
  appIdOrOppId: string,
  stage: ApplicationRecord["stage"],
  notes?: string
): Promise<ApplicationRecord | null> {
  const existing = inMemoryApplicationsStore.get(candidateId) || [];
  const target = existing.find(
    a => a.id === appIdOrOppId || a.opportunity_id === appIdOrOppId
  );

  if (target) {
    target.stage = stage;
    if (notes !== undefined) target.notes = notes;
    target.updated_at = new Date().toISOString();
    inMemoryApplicationsStore.set(candidateId, [...existing]);
    return target;
  }

  // If not found, create new record
  return upsertApplicationRecord(candidateId, appIdOrOppId, stage, notes);
}


