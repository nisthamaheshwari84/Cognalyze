/**
 * lib/recruitment/remediation-map.ts
 * 
 * Client-safe competency remediation mapping to Skill Practice Hub topics.
 * Completely free of server/Node dependencies.
 */

export interface RemediationRecommendation {
  competencyId: string;
  topicTitle: string;
  practiceUrl: string;
  reason: string;
}

export const COMPETENCY_REMEDIATION_MAP: Record<
  string,
  { topicTitle: string; practiceUrl: string; reason: string }
> = {
  algorithmic_problem_solving: {
    topicTitle: "Python Data Structures, Dynamic Programming & Graph Algorithms",
    practiceUrl: "/student/skills/ai-data?tab=practice&subject=python",
    reason: "Strengthen algorithmic decomposition, edge-case validation, and Big-O runtime bounds.",
  },
  algorithmic_coding: {
    topicTitle: "Algorithmic Problem Solving & Python Coding Arena",
    practiceUrl: "/student/skills/ai-data?tab=practice&subject=python",
    reason: "Practice hands-on test suite passing and memory optimization under time constraints.",
  },
  algorithmic_and_design_competence: {
    topicTitle: "Algorithmic Problem Solving & Python Coding Arena",
    practiceUrl: "/student/skills/ai-data?tab=practice&subject=python",
    reason: "Practice hands-on test suite passing and memory optimization under time constraints.",
  },
  sql_data_modeling: {
    topicTitle: "SQL Database Arena: Window Functions, CTEs & Multi-table Joins",
    practiceUrl: "/student/skills/ai-data?tab=practice&subject=sql",
    reason: "Master advanced analytics queries, aggregations, and execution plan optimization.",
  },
  sql_and_data_acumen: {
    topicTitle: "SQL Database Arena: Window Functions, CTEs & Multi-table Joins",
    practiceUrl: "/student/skills/ai-data?tab=practice&subject=sql",
    reason: "Refine relational joins, NULL value management, and business KPI formulation.",
  },
  system_and_code_design: {
    topicTitle: "Software Architecture, SOLID Principles & Code Craft",
    practiceUrl: "/student/skills/ai-data?tab=library",
    reason: "Learn modular class design, test-driven refactoring, and extensible design patterns.",
  },
  ml_foundations_math: {
    topicTitle: "Machine Learning Foundations, Loss Functions & Tensor Math",
    practiceUrl: "/student/skills/ai-data?tab=practice&subject=machine-learning",
    reason: "Deepen understanding of loss optimization, backpropagation, and linear algebra.",
  },
  ml_systems_architecture: {
    topicTitle: "Production AI/ML Engineering & Model Serving",
    practiceUrl: "/student/skills/ai-data?tab=practice&subject=machine-learning",
    reason: "Study inference latency, batching, feature stores, and continuous model monitoring.",
  },
  communication_reasoning: {
    topicTitle: "STAR Method & Technical Communication Simulator",
    practiceUrl: "/student/interview",
    reason: "Structure responses into Situation, Task, Action, and measurable Results.",
  },
};

export function getRemediationTopicsForWeaknesses(
  weakCompetencyIds: string[]
): RemediationRecommendation[] {
  const recommendations: RemediationRecommendation[] = [];
  const seen = new Set<string>();

  for (const compId of weakCompetencyIds) {
    const mapped = COMPETENCY_REMEDIATION_MAP[compId];
    if (mapped && !seen.has(mapped.topicTitle)) {
      seen.add(mapped.topicTitle);
      recommendations.push({
        competencyId: compId,
        topicTitle: mapped.topicTitle,
        practiceUrl: mapped.practiceUrl,
        reason: mapped.reason,
      });
    }
  }

  // If no exact match, provide default foundational practice
  if (recommendations.length === 0 && weakCompetencyIds.length > 0) {
    recommendations.push({
      competencyId: weakCompetencyIds[0],
      topicTitle: "Core Python & Data Structures Practice",
      practiceUrl: "/student/skills/ai-data?tab=practice&subject=python",
      reason: "Reinforce programming foundations and algorithmic problem-solving speed.",
    });
  }

  return recommendations;
}

