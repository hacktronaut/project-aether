import type { OptimizationPass, KIRSubgraph } from '../../types.js';
import { EdgeType, Priority } from '../../../ontology/index.js';

export class O3ConflictResolution implements OptimizationPass {
  readonly id = 'O3';
  readonly name = 'Conflict Resolution';

  async run(subgraph: KIRSubgraph, mission: any): Promise<void> {
    let conflictsResolved = 0;
    const nodesToRemove = new Set<string>();

    for (const edge of subgraph.edges.values()) {
      if (edge.type === EdgeType.ConflictsWith && subgraph.nodes.has(edge.source) && subgraph.nodes.has(edge.target)) {
        const sourceNode = subgraph.nodes.get(edge.source)!;
        const targetNode = subgraph.nodes.get(edge.target)!;
        
        // Keep Mandatory over Recommended/Optional
        if (sourceNode.ontologyContext.priority === Priority.Mandatory && targetNode.ontologyContext.priority !== Priority.Mandatory) {
          nodesToRemove.add(edge.target);
          conflictsResolved++;
        } else if (targetNode.ontologyContext.priority === Priority.Mandatory && sourceNode.ontologyContext.priority !== Priority.Mandatory) {
          nodesToRemove.add(edge.source);
          conflictsResolved++;
        }
      }
    }

    for (const id of nodesToRemove) {
      subgraph.nodes.delete(id);
    }
    
    if (conflictsResolved > 0) {
      subgraph.diagnostics.push({
        code: 'OPT_O3',
        message: `O3 resolved ${conflictsResolved} conflicts by priority dropping.`,
        severity: 'Warning', 
      });
    }
  }
}
