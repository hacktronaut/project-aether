import type { CompilerPass, CompilationUnit } from '../../types.js';

/**
 * P4OntologyMapper maps generic KIR node properties into strictly typed ontology contexts.
 */
export class P4OntologyMapper implements CompilerPass {
  readonly id = 'P4';
  readonly name = 'Ontology Mapper';
  readonly stage = 'compilation';

  async run(unit: CompilationUnit): Promise<void> {
    const startTime = Date.now();
    let nodesMapped = 0;

    for (const node of unit.kirModule.nodes.values()) {
      node.ontologyContext = {
        ...node.ontologyContext,
        isStrict: true,
      };
      nodesMapped++;
    }

    unit.passResults.push({
      passId: this.id,
      passName: this.name,
      durationMs: Date.now() - startTime,
      success: true,
      stats: { nodesMapped }
    });
  }
}
