import { load } from 'js-yaml';
import type { CompilerPass, CompilationUnit, Section } from '../../types.js';
import { KIRModuleController } from '../../../kir/operations.js';
import { KIRNodeStatus } from '../../../kir/types.js';

/**
 * P2KnowledgeExtractor extracts candidate knowledge nodes from DocumentASTs using heuristics and structured blocks.
 */
export class P2KnowledgeExtractor implements CompilerPass {
  readonly id = 'P2';
  readonly name = 'Knowledge Extractor';
  readonly stage = 'compilation';

  async run(unit: CompilationUnit): Promise<void> {
    const startTime = Date.now();
    const controller = new KIRModuleController(unit.kirModule);
    let nodesCreated = 0;

    const typePattern = /^(Rule|Constraint|Pattern|Capability|Workflow|Decision|Policy|Technology|Example|QualityGate|Role|ApiContract):\s*(.+)$/i;

    for (const [docId, ast] of unit.asts) {
      // Process top-level blocks as general description if any
      const docGeneralProperties: Record<string, string> = {};
      const generalYamlBlock = ast.blocks.find((b) => b.type === 'yaml');
      if (generalYamlBlock) {
        try {
          const parsed = load(generalYamlBlock.content) as any;
          if (parsed && typeof parsed === 'object') {
            for (const [k, v] of Object.entries(parsed)) {
              docGeneralProperties[k] = String(v);
            }
          }
        } catch {
          // ignore parsing errors for general metadata
        }
      }

      // Process sections
      const processSection = (section: Section) => {
        const match = section.heading.match(typePattern);
        if (match) {
          const rawType = match[1]!;
          const name = match[2]!.trim();
          const id = `${rawType.toLowerCase()}:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

          const rawProperties: Record<string, string> = { ...docGeneralProperties };
          let directive = '';
          let description = '';

          // Gather text and block contents
          for (const block of section.blocks) {
            if (block.type === 'yaml' || block.type === 'json') {
              try {
                const parsed = load(block.content) as any;
                if (parsed && typeof parsed === 'object') {
                  for (const [k, v] of Object.entries(parsed)) {
                    rawProperties[k] = String(v);
                  }
                }
              } catch (err: any) {
                unit.diagnostics.push({
                  code: 'YAML_ERR',
                  message: `Failed to parse YAML block in section "${section.heading}": ${err.message}`,
                  severity: 'Warning' as any,
                  file: ast.path,
                  line: block.line,
                  column: block.column,
                });
              }
            } else if (block.type === 'paragraph') {
              const text = block.content.trim();
              if (text.toLowerCase().startsWith('directive:')) {
                directive = text.slice(10).trim();
              } else if (text.toLowerCase().startsWith('description:')) {
                description = text.slice(12).trim();
              } else {
                if (directive) {
                  directive += '\n' + text;
                } else {
                  directive = text;
                }
              }
            } else if (block.type === 'list') {
              // Parse simple key-value lists like:
              // - Scope: Backend
              // - Priority: Mandatory
              const lines = block.content.split('\n');
              for (const line of lines) {
                const colonIdx = line.indexOf(':');
                if (colonIdx > 0) {
                  const key = line.substring(0, colonIdx).trim().toLowerCase();
                  const val = line.substring(colonIdx + 1).trim();
                  rawProperties[key] = val;
                }
              }
            }
          }

          // If directive/description is not in yaml, apply extracted ones
          if (directive && !rawProperties['directive']) {
            rawProperties['directive'] = directive;
          }
          if (description && !rawProperties['description']) {
            rawProperties['description'] = description;
          }
          if (!rawProperties['name']) {
            rawProperties['name'] = name;
          }

          const line = section.blocks[0]?.line ?? 1;
          const column = section.blocks[0]?.column ?? 1;

          controller.addNode({
            id,
            tentativeType: rawType,
            canonicalType: null,
            rawProperties,
            typedProperties: {},
            sourceDocId: docId,
            sourceLocation: {
              line,
              column,
              length: section.heading.length,
            },
            extractionConfidence: 0.9, // high heuristic confidence
            status: KIRNodeStatus.Candidate,
            priority: null,
            scope: null,
            semanticHash: null,
            annotations: {},
          });
          nodesCreated++;
        }

        // Recursively process child sections
        for (const child of section.children) {
          processSection(child);
        }
      };

      for (const section of ast.sections) {
        processSection(section);
      }
    }

    unit.passResults.push({
      passId: this.id,
      passName: this.name,
      durationMs: Date.now() - startTime,
      success: true,
      stats: {
        nodesCreated,
        nodesModified: 0,
        nodesRemoved: 0,
        edgesCreated: 0,
        edgesRemoved: 0,
      },
    });
  }
}
