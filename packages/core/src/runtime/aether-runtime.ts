import { readFile, mkdir, writeFile, stat } from 'fs/promises';
import { randomUUID, createHash } from 'crypto';
import { join, dirname } from 'path';
import type { CompiledExecutionContext } from '../cec/types.js';
import { InMemoryGraph } from '../graph/in-memory-graph.js';
import { deserializeGraph } from '../ontology/serialization.js';
import { SQLiteGraphRepository } from '../graph/sqlite-repository.js';
import { O1DeadKnowledgeElimination } from '../compiler/passes/optimization/o1-dead-knowledge-elimination.js';
import { O2SemanticDeduplication } from '../compiler/passes/optimization/o2-semantic-deduplication.js';
import { O3ConflictResolution } from '../compiler/passes/optimization/o3-conflict-resolution.js';
import { O4ContextCompression } from '../compiler/passes/optimization/o4-context-compression.js';
import { CECAssembler } from '../cec/assembler.js';
import type { KIRSubgraph, KIRNode, KIREdge } from '../kir/types.js';
import { KIRNodeStatus } from '../kir/types.js';
import { Scope } from '../ontology/index.js';

export interface MissionInput {
  raw: string;
  scope?: string[];
  budget?: number;
}

export class AetherRuntime {
  constructor(private readonly config: { graphPath: string }) {}

  /**
   * Resolves a natural language mission against the knowledge graph, optimizes context, and compiles the Compiled Execution Context (CEC).
   */
  async compileMission(input: MissionInput): Promise<CompiledExecutionContext> {
    const cacheDir = join(dirname(this.config.graphPath), 'cache');
    const hash = createHash('sha256').update(input.raw + (input.scope || []).join(',') + (input.budget || 10)).digest('hex');
    const cacheFile = join(cacheDir, `${hash}.json`);

    try {
      const graphStat = await stat(this.config.graphPath);
      const cacheStat = await stat(cacheFile);
      if (cacheStat.mtimeMs > graphStat.mtimeMs) {
        // Cache is fresh compared to graph
        const cached = await readFile(cacheFile, 'utf8');
        return JSON.parse(cached) as CompiledExecutionContext;
      }
    } catch {
      // Cache miss or stat failed, proceed with compilation
    }

    // 1. Load and deserialize graph
    let graph: InMemoryGraph;
    if (this.config.graphPath.endsWith('.db')) {
      const sqliteRepo = new SQLiteGraphRepository(this.config.graphPath);
      graph = (await sqliteRepo.loadGraph('runtime-temp')) as InMemoryGraph;
      sqliteRepo.close();
    } else {
      const graphJson = await readFile(this.config.graphPath, 'utf8');
      graph = new InMemoryGraph('runtime-temp');
      deserializeGraph(graphJson, graph);
    }

    // 2. Resolve anchor nodes by scanning mission text for name or ID keywords
    const anchorNodes: string[] = [];
    const lowerRaw = input.raw.toLowerCase();
    for (const node of graph.getNodes()) {
      const nodeNameLower = node.name.toLowerCase();
      const nodeSuffix = node.id.split(':')[1]?.toLowerCase() || '';
      if (
        lowerRaw.includes(nodeNameLower) ||
        (nodeSuffix.length > 2 && lowerRaw.includes(nodeSuffix))
      ) {
        anchorNodes.push(node.id);
      }
    }

    // 3. Traversal (simple BFS to gather subgraph)
    const visited = new Set<string>();
    const queue: string[] = [...anchorNodes];
    anchorNodes.forEach((a) => visited.add(a));

    while (queue.length > 0) {
      const current = queue.shift()!;
      const outgoing = graph.getOutgoingEdges(current);
      for (const edge of outgoing) {
        if (!visited.has(edge.target)) {
          visited.add(edge.target);
          queue.push(edge.target);
        }
      }
    }

    // Build KIRSubgraph
    const nodesMap = new Map<string, KIRNode>();
    const edgesMap = new Map<string, KIREdge>();

    for (const nodeId of visited) {
      const node = graph.getNode(nodeId);
      if (node) {
        const rawProperties: Record<string, string> = {
          name: node.name,
          directive: (node as any).directive || '',
          description: node.description || '',
          priority: node.priority,
          scope: node.scope.join(','),
        };

        // Concrete properties
        if ((node as any).constraintType) {
          rawProperties['constraintType'] = (node as any).constraintType;
        }
        if ((node as any).verificationMethod) {
          rawProperties['verificationMethod'] = (node as any).verificationMethod;
        }
        if ((node as any).impact) {
          rawProperties['impact'] = (node as any).impact;
        }
        if ((node as any).enforcement) {
          rawProperties['enforcement'] = (node as any).enforcement;
        }
        if ((node as any).patternType) {
          rawProperties['patternType'] = (node as any).patternType;
        }
        if ((node as any).structure) {
          rawProperties['structure'] = (node as any).structure;
        }
        if ((node as any).applicability) {
          rawProperties['applicability'] = (node as any).applicability;
        }
        if ((node as any).rationale) {
          rawProperties['rationale'] = (node as any).rationale;
        }

        nodesMap.set(nodeId, {
          id: node.id,
          tentativeType: node.type,
          canonicalType: node.type,
          rawProperties,
          typedProperties: {},
          sourceDocId: node.sourceRef?.file || '',
          sourceLocation: node.sourceRef || { line: 1, column: 1, length: 0 },
          extractionConfidence: node.confidence,
          status: KIRNodeStatus.Active,
          priority: node.priority,
          scope: node.scope,
          semanticHash: null,
          relevanceScore: null,
          pathScore: null,
          inlinedRules: [],
          foldedIntoCapability: null,
          conflictsWith: [],
          resolvedBy: null,
          annotations: {},
          modificationLog: [],
        });
      }
    }

    // Gather edges between visited nodes
    for (const edge of graph.getEdges()) {
      if (visited.has(edge.source) && visited.has(edge.target)) {
        edgesMap.set(edge.id, {
          id: edge.id,
          type: edge.type,
          source: edge.source,
          target: edge.target,
          weight: edge.weight,
          discoveryMethod: 'Explicit' as any,
          discoveredInPass: 'P7',
          status: 'Active' as any,
        });
      }
    }

    const subgraph: KIRSubgraph = {
      parentGraphId: graph.id,
      missionId: randomUUID(),
      nodes: nodesMap,
      edges: edgesMap,
    };

    const mission = {
      id: subgraph.missionId,
      objective: input.raw,
      anchorNodes,
      scope: (input.scope || [Scope.CrossCutting]) as Scope[],
      budget: input.budget || 10,
    };

    // 4. Run basic O1-O4 optimizations
    const o1 = new O1DeadKnowledgeElimination();
    await o1.run(subgraph, mission);

    const o2 = new O2SemanticDeduplication();
    await o2.run(subgraph, mission);

    const o3 = new O3ConflictResolution();
    await o3.run(subgraph, mission);

    const o4 = new O4ContextCompression();
    await o4.run(subgraph, mission);

    // 5. Assemble CEC
    const assembler = new CECAssembler();
    const cec = assembler.assemble(subgraph, mission);

    await mkdir(cacheDir, { recursive: true });
    await writeFile(cacheFile, JSON.stringify(cec), 'utf8');

    return cec;
  }
}
