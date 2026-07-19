import { randomUUID } from 'crypto';
import type { CompilerPass, CompilationUnit } from '../../types.js';
import { EdgeType } from '../../../ontology/index.js';
import { KIREdgeStatus, EdgeDiscoveryMethod } from '../../../kir/types.js';

/**
 * P3RelationshipDiscoverer extracts semantic relationships (like dependsOn, conflictsWith) 
 * from the raw properties of nodes and generates explicit KIR edges.
 */
export class P3RelationshipDiscoverer implements CompilerPass {
  readonly id = 'P3';
  readonly name = 'Relationship Discoverer';
  readonly stage = 'compilation';

  async run(unit: CompilationUnit): Promise<void> {
    const startTime = Date.now();
    let edgesCreated = 0;

    for (const node of unit.kirModule.nodes.values()) {
      // Handle DependsOn
      const deps = node.rawProperties['dependson'] || node.rawProperties['depends-on'];
      if (deps) {
        const targets = deps.split(',').map(s => s.trim());
        for (const target of targets) {
          const edgeId = `edge:${randomUUID()}`;
          unit.kirModule.edges.set(edgeId, {
            id: edgeId,
            source: node.id,
            target,
            type: EdgeType.DependsOn,
            weight: 1.0,
            status: KIREdgeStatus.Active,
            discoveryMethod: EdgeDiscoveryMethod.NameMatching,
            discoveredInPass: this.id,
          });
          edgesCreated++;
        }
      }
      
      // Handle ConflictsWith
      const conflicts = node.rawProperties['conflictswith'] || node.rawProperties['conflicts-with'];
      if (conflicts) {
        const targets = conflicts.split(',').map(s => s.trim());
        for (const target of targets) {
          const edgeId = `edge:${randomUUID()}`;
          unit.kirModule.edges.set(edgeId, {
            id: edgeId,
            source: node.id,
            target,
            type: EdgeType.ConflictsWith,
            weight: 1.0,
            status: KIREdgeStatus.Active,
            discoveryMethod: EdgeDiscoveryMethod.NameMatching,
            discoveredInPass: this.id,
          });
          edgesCreated++;
        }
      }
    }

    unit.passResults.push({
      passId: this.id,
      passName: this.name,
      durationMs: Date.now() - startTime,
      success: true,
      stats: { nodesCreated: 0, nodesModified: 0, nodesRemoved: 0, edgesCreated, edgesRemoved: 0 }
    });
  }
}
