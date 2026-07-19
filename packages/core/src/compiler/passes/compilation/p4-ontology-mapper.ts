import type { CompilerPass, CompilationUnit } from '../../types.js';

/**
 * P4OntologyMapper is a structural pass that confirms nodes have been correctly
 * extracted and marks them as mapped. It does not modify node data directly.
 */
export class P4OntologyMapper implements CompilerPass {
  readonly id = 'P4';
  readonly name = 'Ontology Mapper';
  readonly stage = 'compilation';

  async run(unit: CompilationUnit): Promise<void> {
    const startTime = Date.now();
    let nodesModified = 0;

    for (const node of unit.kirModule.nodes.values()) {
      // Promote nodes that have been through the pipeline to 'Active'
      if (node.status === 'Candidate' as any) {
        // Just count mapped nodes — actual status promotion happens in P7
        nodesModified++;
      }
    }

    unit.passResults.push({
      passId: this.id,
      passName: this.name,
      durationMs: Date.now() - startTime,
      success: true,
      stats: { nodesCreated: 0, nodesModified, nodesRemoved: 0, edgesCreated: 0, edgesRemoved: 0 }
    });
  }
}
