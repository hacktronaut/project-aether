import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Root, Content, Heading } from 'mdast';
import type { CompilerPass, CompilationUnit, DocumentAST, Section, Block } from '../../types.js';

/**
 * P1DocumentParser parses source documents (Markdown, YAML, JSON) into standard DocumentASTs.
 */
export class P1DocumentParser implements CompilerPass {
  readonly id = 'P1';
  readonly name = 'Document Parser';
  readonly stage = 'compilation';

  async run(unit: CompilationUnit): Promise<void> {
    const startTime = Date.now();
    let nodesCreated = 0;

    for (const doc of unit.documents) {
      try {
        let ast: DocumentAST;
        if (doc.format === 'markdown') {
          ast = this.parseMarkdown(doc);
        } else if (doc.format === 'yaml' || doc.format === 'json') {
          ast = this.parseStructured(doc);
        } else {
          throw new Error(`Unsupported document format: ${doc.format}`);
        }
        unit.asts.set(doc.id, ast);
        nodesCreated++;
      } catch (err: any) {
        unit.diagnostics.push({
          code: 'PARSER_ERR',
          message: `Failed to parse document ${doc.path}: ${err.message}`,
          severity: 'Error' as any,
          file: doc.path,
        });
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

  private parseMarkdown(doc: any): DocumentAST {
    const processor = unified().use(remarkParse);
    const mdast = processor.parse(doc.content) as Root;

    const ast: DocumentAST = {
      id: doc.id,
      type: 'markdown',
      path: doc.path,
      sections: [],
      blocks: [],
    };

    // Helper to build hierarchy of sections based on headings
    const sectionStack: Section[] = [];
    let currentSection: Section | null = null;

    for (const child of mdast.children) {
      if (child.type === 'heading') {
        const headingNode = child as Heading;
        const textContent = this.getMarkdownText(headingNode);
        const headingLevel = headingNode.depth;

        const newSection: Section = {
          heading: textContent,
          level: headingLevel,
          blocks: [],
          children: [],
        };

        // Pop sections from stack that have a depth >= to the new heading level
        while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1]!.level >= headingLevel) {
          sectionStack.pop();
        }

        if (sectionStack.length === 0) {
          ast.sections.push(newSection);
        } else {
          sectionStack[sectionStack.length - 1]!.children.push(newSection);
        }

        sectionStack.push(newSection);
        currentSection = newSection;
      } else {
        const block = this.parseMarkdownBlock(child);
        if (block) {
          if (currentSection) {
            currentSection.blocks.push(block);
          } else {
            ast.blocks.push(block);
          }
        }
      }
    }

    return ast;
  }

  private parseMarkdownBlock(node: Content): Block | null {
    const line = node.position?.start.line ?? 1;
    const column = node.position?.start.column ?? 1;

    switch (node.type) {
      case 'paragraph':
        return {
          type: 'paragraph',
          content: this.getMarkdownText(node),
          line,
          column,
        };
      case 'code':
        return {
          type: 'code',
          content: node.value,
          raw: { lang: node.lang },
          line,
          column,
        };
      case 'list': {
        const items: string[] = [];
        for (const item of node.children) {
          items.push(this.getMarkdownText(item).trim());
        }
        return {
          type: 'list',
          content: items.join('\n'),
          line,
          column,
        };
      }
      case 'table':
        return {
          type: 'table',
          content: this.getMarkdownText(node),
          line,
          column,
        };
      default:
        // Skip unhandled node types for now
        return null;
    }
  }

  private getMarkdownText(node: any): string {
    if (node.value !== undefined) {
      return node.value;
    }
    if (node.children) {
      return node.children.map((c: any) => this.getMarkdownText(c)).join('');
    }
    return '';
  }

  private parseStructured(doc: any): DocumentAST {
    // For YAML/JSON, parse content and represent as a single block for extraction
    const type = doc.format;
    const block: Block = {
      type,
      content: doc.content,
      line: 1,
      column: 1,
    };

    return {
      id: doc.id,
      type,
      path: doc.path,
      sections: [],
      blocks: [block],
    };
  }
}
