import { createCompilationUnit } from './compilation-unit.js';
import type { CompilerConfig, SourceDocument, CompilationUnit } from './types.js';
import { P1DocumentParser } from './passes/compilation/p1-document-parser.js';
import { P2KnowledgeExtractor } from './passes/compilation/p2-knowledge-extractor.js';
import { P3RelationshipDiscoverer } from './passes/compilation/p3-relationship-discoverer.js';
import { P4OntologyMapper } from './passes/compilation/p4-ontology-mapper.js';
import { P7GraphConstructor } from './passes/compilation/p7-graph-constructor.js';

export class KnowledgeCompiler {
  constructor(private readonly config: CompilerConfig) {}

  /**
   * Compiles source documents through P1, P2, and P7 passes to build the knowledge graph.
   */
  async compile(documents: SourceDocument[]): Promise<CompilationUnit> {
    const unit = createCompilationUnit(this.config, documents);

    const p1 = new P1DocumentParser();
    await p1.run(unit);

    // Fail early on P1 errors if strict mode is enabled
    if (this.config.strict && unit.diagnostics.some((d) => d.severity === 'Error')) {
      return unit;
    }

    const p2 = new P2KnowledgeExtractor();
    await p2.run(unit);

    const p3 = new P3RelationshipDiscoverer();
    await p3.run(unit);

    const p4 = new P4OntologyMapper();
    await p4.run(unit);

    if (this.config.strict && unit.diagnostics.some((d) => d.severity === 'Error')) {
      return unit;
    }

    const p7 = new P7GraphConstructor();
    await p7.run(unit);

    return unit;
  }
}
