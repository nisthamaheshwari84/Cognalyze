/**
 * lib/evidence/capability-graph.ts
 * 
 * COGNALYZE CAPABILITY GRAPH & RELATIONSHIP TOPOLOGY ENGINE (Phase 5)
 * 
 * Manages capability nodes, prerequisite dependencies, component edges,
 * and evidence-to-capability link traversal in strict alignment with
 * `20260920_evidence_operating_system_spine.sql`.
 * 
 * Edge Kinds:
 * - `prerequisite_of`: A must be demonstrated before B can be reliably verified.
 * - `part_of`: A is a sub-competency or module of B.
 * - `related_to`: Conceptual adjacency.
 * - `transferable_to`: Knowledge transfer bridge.
 * 
 * Link Relations:
 * - `supports`, `partially_supports`, `adjacent_to`, `contradicts`.
 */

export interface CapabilityNodeRecord {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string;
}

export interface CapabilityEdgeRecord {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  kind: "part_of" | "related_to" | "prerequisite_of" | "transferable_to";
  origin?: "curated" | "proposed";
  justification?: string;
}

export interface EvidenceLinkRecord {
  id: string;
  candidateId: string;
  evidenceId: string;
  capabilityNodeId?: string;
  claimId?: string;
  requirementId?: string;
  relation: "supports" | "partially_supports" | "adjacent_to" | "contradicts";
  coverage: "direct" | "adjacent" | "partial";
  createdAt: string;
}

export interface PrerequisiteVerificationResult {
  satisfied: boolean;
  targetCapability: string;
  missingPrerequisites: string[];
  prerequisiteChain: string[];
}

export interface CandidateGraphSummary {
  candidateId: string;
  totalCapabilitiesLinked: number;
  supportedCapabilitiesCount: number;
  partiallySupportedCount: number;
  contradictedCount: number;
  nodes: CapabilityNodeRecord[];
  edges: CapabilityEdgeRecord[];
  links: EvidenceLinkRecord[];
}

class CapabilityGraphStore {
  private nodes: Map<string, CapabilityNodeRecord> = new Map(); // keyed by slug
  private nodesById: Map<string, CapabilityNodeRecord> = new Map(); // keyed by id
  private edges: CapabilityEdgeRecord[] = [];
  private links: Map<string, EvidenceLinkRecord[]> = new Map(); // keyed by candidateId

  constructor() {
    this.seedDefaultCuratedGraph();
  }

  /**
   * Seeds baseline curated CS & engineering capability topology.
   */
  private seedDefaultCuratedGraph(): void {
    const defaultNodes: CapabilityNodeRecord[] = [
      { id: "node_python", name: "Python", slug: "python", category: "Languages" },
      { id: "node_fastapi", name: "FastAPI", slug: "fastapi", category: "Backend & APIs" },
      { id: "node_asyncio", name: "AsyncIO Concurrency", slug: "asyncio", category: "Core CS" },
      { id: "node_go", name: "Go", slug: "go", category: "Languages" },
      { id: "node_raft", name: "Raft Consensus", slug: "raft", category: "Distributed Systems" },
      { id: "node_dist_sys", name: "Distributed Systems", slug: "distributed-systems", category: "Distributed Systems" },
      { id: "node_sql", name: "SQL", slug: "sql", category: "Databases" },
      { id: "node_postgresql", name: "PostgreSQL", slug: "postgresql", category: "Databases" },
      { id: "node_db_transactions", name: "ACID Database Transactions", slug: "acid-transactions", category: "Databases" },
      { id: "node_react", name: "React", slug: "react", category: "Frontend" },
      { id: "node_nextjs", name: "Next.js", slug: "nextjs", category: "Frontend" },
      { id: "node_typescript", name: "TypeScript", slug: "typescript", category: "Languages" },
    ];

    for (const n of defaultNodes) {
      this.registerNode(n);
    }

    // Default prerequisite & component edges
    const defaultEdges: CapabilityEdgeRecord[] = [
      // Python -> FastAPI (Prerequisite)
      { id: "edge_py_fastapi", sourceNodeId: "node_python", targetNodeId: "node_fastapi", kind: "prerequisite_of", origin: "curated" },
      // AsyncIO -> FastAPI (Prerequisite)
      { id: "edge_async_fastapi", sourceNodeId: "node_asyncio", targetNodeId: "node_fastapi", kind: "prerequisite_of", origin: "curated" },
      // Go -> Raft (Prerequisite)
      { id: "edge_go_raft", sourceNodeId: "node_go", targetNodeId: "node_raft", kind: "prerequisite_of", origin: "curated" },
      // Raft -> Distributed Systems (Part of)
      { id: "edge_raft_distsys", sourceNodeId: "node_raft", targetNodeId: "node_dist_sys", kind: "part_of", origin: "curated" },
      // SQL -> PostgreSQL (Prerequisite)
      { id: "edge_sql_postgres", sourceNodeId: "node_sql", targetNodeId: "node_postgresql", kind: "prerequisite_of", origin: "curated" },
      // ACID Transactions -> PostgreSQL (Part of)
      { id: "edge_acid_postgres", sourceNodeId: "node_db_transactions", targetNodeId: "node_postgresql", kind: "part_of", origin: "curated" },
      // TypeScript -> Next.js (Prerequisite)
      { id: "edge_ts_nextjs", sourceNodeId: "node_typescript", targetNodeId: "node_nextjs", kind: "prerequisite_of", origin: "curated" },
      // React -> Next.js (Prerequisite)
      { id: "edge_react_nextjs", sourceNodeId: "node_react", targetNodeId: "node_nextjs", kind: "prerequisite_of", origin: "curated" },
    ];

    for (const e of defaultEdges) {
      this.addEdge(e);
    }
  }

  public registerNode(node: CapabilityNodeRecord): void {
    this.nodes.set(node.slug, node);
    this.nodesById.set(node.id, node);
  }

  public getNodeBySlug(slug: string): CapabilityNodeRecord | undefined {
    return this.nodes.get(slug);
  }

  public getNodeById(id: string): CapabilityNodeRecord | undefined {
    return this.nodesById.get(id);
  }

  public getAllNodes(): CapabilityNodeRecord[] {
    return Array.from(this.nodes.values());
  }

  public addEdge(edge: CapabilityEdgeRecord): void {
    // Avoid duplicate edges
    const exists = this.edges.some(
      (e) =>
        e.sourceNodeId === edge.sourceNodeId &&
        e.targetNodeId === edge.targetNodeId &&
        e.kind === edge.kind
    );
    if (!exists) {
      this.edges.push(edge);
    }
  }

  public getAllEdges(): CapabilityEdgeRecord[] {
    return [...this.edges];
  }

  /**
   * Traverses backward along `prerequisite_of` edges to discover all required prerequisites.
   */
  public getPrerequisiteChain(targetSlug: string): string[] {
    const target = this.nodes.get(targetSlug);
    if (!target) return [];

    const prerequisites: string[] = [];
    const visited = new Set<string>();

    const traverse = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      // Find all incoming prerequisite_of edges where target is this node
      const incomingEdges = this.edges.filter(
        (e) => e.targetNodeId === nodeId && e.kind === "prerequisite_of"
      );

      for (const edge of incomingEdges) {
        const sourceNode = this.nodesById.get(edge.sourceNodeId);
        if (sourceNode) {
          if (!prerequisites.includes(sourceNode.slug)) {
            prerequisites.push(sourceNode.slug);
          }
          traverse(sourceNode.id);
        }
      }
    };

    traverse(target.id);
    return prerequisites;
  }

  /**
   * Links a verified evidence item to a capability node for a specific candidate.
   */
  public linkEvidence(link: EvidenceLinkRecord): void {
    const list = this.links.get(link.candidateId) || [];
    list.push(link);
    this.links.set(link.candidateId, list);
  }

  public getCandidateLinks(candidateId: string): EvidenceLinkRecord[] {
    return this.links.get(candidateId) || [];
  }

  /**
   * Evaluates whether all prerequisites for a target capability are evidenced.
   */
  public verifyPrerequisitesSatisfied(
    candidateId: string,
    targetSlug: string,
    candidateEvidencedSlugs: string[]
  ): PrerequisiteVerificationResult {
    const chain = this.getPrerequisiteChain(targetSlug);
    const evidencedSet = new Set(candidateEvidencedSlugs.map((s) => s.toLowerCase()));

    const missingPrerequisites: string[] = [];
    for (const prereq of chain) {
      if (!evidencedSet.has(prereq.toLowerCase())) {
        missingPrerequisites.push(prereq);
      }
    }

    return {
      satisfied: missingPrerequisites.length === 0,
      targetCapability: targetSlug,
      missingPrerequisites,
      prerequisiteChain: chain,
    };
  }

  /**
   * Retrieves the candidate's active capability subgraph with evidence links.
   */
  public getCandidateCapabilityGraph(candidateId: string): CandidateGraphSummary {
    const candidateLinks = this.links.get(candidateId) || [];
    const linkedNodeIds = new Set(
      candidateLinks.map((l) => l.capabilityNodeId).filter(Boolean) as string[]
    );

    const relevantNodes = Array.from(this.nodesById.values()).filter((n) =>
      linkedNodeIds.has(n.id)
    );

    const relevantEdges = this.edges.filter(
      (e) => linkedNodeIds.has(e.sourceNodeId) || linkedNodeIds.has(e.targetNodeId)
    );

    const supportedCount = candidateLinks.filter((l) => l.relation === "supports").length;
    const partialCount = candidateLinks.filter((l) => l.relation === "partially_supports").length;
    const contradictCount = candidateLinks.filter((l) => l.relation === "contradicts").length;

    return {
      candidateId,
      totalCapabilitiesLinked: linkedNodeIds.size,
      supportedCapabilitiesCount: supportedCount,
      partiallySupportedCount: partialCount,
      contradictedCount: contradictCount,
      nodes: relevantNodes,
      edges: relevantEdges,
      links: candidateLinks,
    };
  }

  public clearCandidateLinks(candidateId: string): void {
    this.links.delete(candidateId);
  }
}

export const capabilityGraph = new CapabilityGraphStore();

