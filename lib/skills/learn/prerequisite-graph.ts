/**
 * COGNALYZE DSA LEARN — PREREQUISITE DEPENDENCY GRAPH (DAG)
 * 
 * Enforces strict prerequisite verification across Steps, Subtopics, and Micro-Concepts.
 * Guarantees zero circular dependencies (cycle detection via Kahn's algorithm)
 * and verifies that no advanced concept can be unlocked without its building blocks.
 */

import { FULL_CURRICULUM_STEPS } from "./curriculum-registry";
import { PrerequisiteNode } from "./curriculum-types";

export interface PrerequisiteGraph {
  nodes: Map<string, PrerequisiteNode>;
  adjacencyList: Map<string, string[]>; // prerequisiteId -> dependents[]
  reverseAdjacencyList: Map<string, string[]>; // nodeId -> prerequisites[]
}

/**
 * Builds the unified prerequisite dependency graph across all 17 steps,
 * subtopics, and micro-concepts.
 */
export function buildPrerequisiteGraph(): PrerequisiteGraph {
  const nodes = new Map<string, PrerequisiteNode>();
  const adjacencyList = new Map<string, string[]>();
  const reverseAdjacencyList = new Map<string, string[]>();

  // Helper to register node and dependencies
  const addNode = (node: PrerequisiteNode) => {
    nodes.set(node.id, node);
    if (!adjacencyList.has(node.id)) adjacencyList.set(node.id, []);
    reverseAdjacencyList.set(node.id, [...node.prerequisites]);

    for (const prereqId of node.prerequisites) {
      if (!adjacencyList.has(prereqId)) adjacencyList.set(prereqId, []);
      adjacencyList.get(prereqId)!.push(node.id);
    }
  };

  // 1. Register all 17 Steps
  for (const step of FULL_CURRICULUM_STEPS) {
    addNode({
      id: step.id,
      title: step.title,
      type: "step",
      prerequisites: step.prerequisiteStepIds
    });

    // 2. Register Subtopics
    for (const topic of step.topics) {
      for (const sub of topic.subtopics) {
        addNode({
          id: sub.id,
          title: sub.title,
          type: "subtopic",
          prerequisites: sub.prerequisites
        });

        // 3. Register Micro-Concepts
        for (const mc of sub.microConcepts) {
          addNode({
            id: mc.id,
            title: mc.title,
            type: "micro_concept",
            prerequisites: mc.prerequisites
          });
        }
      }
    }
  }

  return { nodes, adjacencyList, reverseAdjacencyList };
}

/**
 * Checks if all prerequisites for a given node are satisfied.
 */
export function isPrerequisiteSatisfied(
  nodeId: string,
  completedNodeIds: Set<string>,
  graph?: PrerequisiteGraph
): boolean {
  const g = graph || buildPrerequisiteGraph();
  const prereqs = g.reverseAdjacencyList.get(nodeId);
  if (!prereqs || prereqs.length === 0) return true;

  for (const p of prereqs) {
    if (!completedNodeIds.has(p)) {
      return false;
    }
  }
  return true;
}

/**
 * Returns the exact list of missing prerequisite titles blocking a student.
 */
export function getMissingPrerequisites(
  nodeId: string,
  completedNodeIds: Set<string>,
  graph?: PrerequisiteGraph
): Array<{ id: string; title: string }> {
  const g = graph || buildPrerequisiteGraph();
  const prereqs = g.reverseAdjacencyList.get(nodeId) || [];
  const missing: Array<{ id: string; title: string }> = [];

  for (const pid of prereqs) {
    if (!completedNodeIds.has(pid)) {
      const node = g.nodes.get(pid);
      missing.push({
        id: pid,
        title: node ? node.title : pid
      });
    }
  }
  return missing;
}

/**
 * Mathematical cycle detection using Kahn's Algorithm (BFS Topological Sort).
 * Returns true if graph is a valid DAG (cycle-free), or array of cycling node IDs.
 */
export function validateDAG(graph?: PrerequisiteGraph): {
  isValidDAG: boolean;
  cycleNodeIds: string[];
} {
  const g = graph || buildPrerequisiteGraph();
  const inDegree = new Map<string, number>();

  g.nodes.forEach((node, id) => {
    inDegree.set(id, node.prerequisites.length);
  });

  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) {
      queue.push(id);
    }
  });

  let visitedCount = 0;
  while (queue.length > 0) {
    const curr = queue.shift()!;
    visitedCount++;

    const dependents = g.adjacencyList.get(curr) || [];
    for (const depId of dependents) {
      const currentDeg = inDegree.get(depId)!;
      inDegree.set(depId, currentDeg - 1);
      if (currentDeg - 1 === 0) {
        queue.push(depId);
      }
    }
  }

  const cycleNodeIds: string[] = [];
  if (visitedCount < g.nodes.size) {
    inDegree.forEach((deg, id) => {
      if (deg > 0) {
        cycleNodeIds.push(id);
      }
    });
  }

  return {
    isValidDAG: visitedCount === g.nodes.size,
    cycleNodeIds
  };
}
