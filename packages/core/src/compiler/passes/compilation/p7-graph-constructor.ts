import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import type { CompilerPass, CompilationUnit } from '../../types.js';
import { InMemoryGraph } from '../../../graph/in-memory-graph.js';
import { serializeGraph } from '../../../ontology/serialization.js';
import { NodeType, Priority, Scope, NodeStatus, StabilityLevel, EdgeType } from '../../../ontology/index.js';
import type { KnowledgeNode, Edge } from '../../../ontology/index.js';

/**
 * P7GraphConstructor takes the final optimized/compiled KIR nodes and edges and builds the EnterpriseKnowledgeGraph, then saves it to disk.
 */
export class P7GraphConstructor implements CompilerPass {
  readonly id = 'P7';
  readonly name = 'Graph Constructor';
  readonly stage = 'compilation';

  async run(unit: CompilationUnit): Promise<void> {
    const startTime = Date.now();
    const graph = new InMemoryGraph(unit.kirModule.compilationId);

    let nodesCreated = 0;
    let edgesCreated = 0;

    // 1. Build and add nodes
    for (const kirNode of unit.kirModule.nodes.values()) {
      if (kirNode.status === 'Active' || kirNode.status === 'Mapped' || kirNode.status === 'Candidate') {
        const canonicalType = (kirNode.canonicalType || kirNode.tentativeType) as NodeType;
        let priority = kirNode.priority as Priority;
        if (!priority && kirNode.rawProperties['priority']) {
          const rawP = kirNode.rawProperties['priority'].trim();
          // Normalize capitalization (e.g. mandatory -> Mandatory)
          const normalizedP = rawP.charAt(0).toUpperCase() + rawP.slice(1).toLowerCase();
          if (Object.values(Priority).includes(normalizedP as any)) {
            priority = normalizedP as Priority;
          }
        }
        if (!priority) {
          priority = Priority.Recommended;
        }

        let scope = kirNode.scope as Scope[];
        if (!scope && kirNode.rawProperties['scope']) {
          const rawS = kirNode.rawProperties['scope'].split(',').map((s) => {
            const trimmed = s.trim();
            return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
          });
          scope = rawS.filter((s) => Object.values(Scope).includes(s as any)) as Scope[];
        }
        if (!scope || scope.length === 0) {
          scope = [Scope.CrossCutting];
        }

        const node: KnowledgeNode = {
          id: kirNode.id,
          name: kirNode.rawProperties['name'] || kirNode.id,
          type: canonicalType,
          version: kirNode.rawProperties['version'] || '1.0.0',
          createdAt: kirNode.modificationLog[0]?.timestamp || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: NodeStatus.Active,
          stability: StabilityLevel.Stable,
          priority,
          scope,
          tags: kirNode.rawProperties['tags']?.split(',').map((t) => t.trim()) || [],
          confidence: kirNode.extractionConfidence,
          description: kirNode.rawProperties['description'] || kirNode.rawProperties['directive'] || '',
        };

        // Inject concrete node fields if applicable
        if (canonicalType === NodeType.Rule) {
          (node as any).directive = kirNode.rawProperties['directive'] || '';
          (node as any).category = kirNode.rawProperties['category'] || 'Implementation';
          (node as any).enforcement = kirNode.rawProperties['enforcement'] || 'Convention';
          (node as any).rationale = kirNode.rawProperties['rationale'] || '';
        } else if (canonicalType === NodeType.Constraint) {
          (node as any).directive = kirNode.rawProperties['directive'] || '';
          (node as any).constraintType = kirNode.rawProperties['constraintType'] || 'Structural';
          (node as any).verificationMethod = kirNode.rawProperties['verificationMethod'] || 'Static check';
          (node as any).impact = kirNode.rawProperties['impact'] || 'High';
          (node as any).enforcement = kirNode.rawProperties['enforcement'] || 'automated';
        } else if (canonicalType === NodeType.Pattern) {
          (node as any).patternType = kirNode.rawProperties['patternType'] || 'Design';
          (node as any).structure = kirNode.rawProperties['structure'] || '';
          (node as any).applicability = kirNode.rawProperties['applicability'] || '';
          (node as any).rationale = kirNode.rawProperties['rationale'] || '';
        }

        graph.addNode(node);
        nodesCreated++;
      }
    }

    // 2. Build and add edges
    for (const kirEdge of unit.kirModule.edges.values()) {
      if (kirEdge.status === 'Active') {
        const edgeType = kirEdge.type as EdgeType;
        const edge: Edge = {
          id: kirEdge.id,
          type: edgeType,
          source: kirEdge.source,
          target: kirEdge.target,
          weight: kirEdge.weight,
          bidirectional: edgeType === EdgeType.ConflictsWith || edgeType === EdgeType.RelatedTo,
        };

        try {
          graph.addEdge(edge);
          edgesCreated++;
        } catch {
          // Skip edges with missing nodes in Phase A
        }
      }
    }

    // 3. Save serialized graph to disk
    const json = serializeGraph(graph);
    const outputPath = unit.config.outputGraphPath;
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, json, 'utf8');

    unit.passResults.push({
      passId: this.id,
      passName: this.name,
      durationMs: Date.now() - startTime,
      success: true,
      stats: {
        nodesCreated,
        nodesModified: 0,
        nodesRemoved: 0,
        edgesCreated,
        edgesRemoved: 0,
      },
    });
  }
}
